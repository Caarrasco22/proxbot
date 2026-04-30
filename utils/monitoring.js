const fs = require("fs");
const path = require("path");
const { runDiagnostics } = require("./diagnostics");

const dataDir = path.join(__dirname, "..", "data");
const statePath = path.join(dataDir, "status-cache.json");
const lastDiagnosticsPath = path.join(dataDir, "last-diagnostics.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`No se pudo leer ${label}. Se ignorara el estado guardado: ${error.message}`);
    return null;
  }
}

function writeJsonFile(filePath, payload) {
  ensureDataDir();
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function loadMonitoringState() {
  return readJsonFile(statePath, "data/status-cache.json");
}

function saveMonitoringState(state) {
  writeJsonFile(statePath, state);
}

function loadLastDiagnostics() {
  return readJsonFile(lastDiagnosticsPath, "data/last-diagnostics.json");
}

function saveLastDiagnostics(payload) {
  writeJsonFile(lastDiagnosticsPath, payload);
}

function buildDnsCheck(check) {
  const detail = check.ok ? check.address : check.error || "sin respuesta";

  return {
    id: `dns:${check.name}`,
    type: "dns",
    name: check.name,
    ok: Boolean(check.ok),
    message: `${check.name} -> ${detail}`
  };
}

function buildPortCheck(check) {
  const target = `${check.host}:${check.port}`;
  const detail = check.ok ? `${check.ms} ms` : (check.error || "sin respuesta").toUpperCase();

  return {
    id: `tcp:${check.name}:${target}`,
    type: "tcp",
    name: check.name,
    ok: Boolean(check.ok),
    message: `${check.name} -> ${target} ${detail}`
  };
}

function buildUrlCheck(check) {
  const detail = check.status
    ? `HTTP ${check.status} (${check.ms} ms)`
    : check.error || "sin respuesta";

  return {
    id: `url:${check.name}:${check.url}`,
    type: "url",
    name: check.name,
    ok: Boolean(check.ok),
    message: `${check.name} -> ${check.url} ${detail}`
  };
}

function buildMonitoringSnapshot(results) {
  const timestamp = new Date().toISOString();
  const dnsChecks = (results.dnsResults || []).map(buildDnsCheck);
  const portChecks = (results.portResults || []).map(buildPortCheck);
  const urlChecks = (results.urlResults || []).map(buildUrlCheck);

  return {
    timestamp,
    checks: [...dnsChecks, ...portChecks, ...urlChecks]
  };
}

function checksById(state) {
  const checks = state && Array.isArray(state.checks) ? state.checks : [];
  return new Map(checks.map(check => [check.id, check]));
}

function buildChange(type, previousCheck, currentCheck, timestamp) {
  const reference = currentCheck || previousCheck;

  return {
    type,
    checkId: reference.id,
    checkType: reference.type,
    name: reference.name,
    previousOk: previousCheck ? previousCheck.ok : null,
    currentOk: currentCheck ? currentCheck.ok : null,
    previousMessage: previousCheck ? previousCheck.message : null,
    currentMessage: currentCheck ? currentCheck.message : null,
    timestamp
  };
}

function diffMonitoringStates(previousState, currentState) {
  const timestamp = currentState && currentState.timestamp
    ? currentState.timestamp
    : new Date().toISOString();
  const previousChecks = checksById(previousState);
  const currentChecks = checksById(currentState);
  const changes = [];

  for (const [checkId, currentCheck] of currentChecks) {
    const previousCheck = previousChecks.get(checkId);

    if (!previousCheck) {
      changes.push(buildChange(currentCheck.ok === false ? "FAILED" : "NEW", null, currentCheck, timestamp));
      continue;
    }

    if (previousCheck.ok === true && currentCheck.ok === false) {
      changes.push(buildChange("FAILED", previousCheck, currentCheck, timestamp));
    }

    if (previousCheck.ok === false && currentCheck.ok === true) {
      changes.push(buildChange("RECOVERED", previousCheck, currentCheck, timestamp));
    }
  }

  for (const [checkId, previousCheck] of previousChecks) {
    if (!currentChecks.has(checkId)) {
      changes.push(buildChange("REMOVED", previousCheck, null, timestamp));
    }
  }

  return changes;
}

async function runMonitoringCycle(config = {}) {
  const results = await runDiagnostics(config);
  const previousState = loadMonitoringState();
  const currentState = buildMonitoringSnapshot(results);
  const changes = diffMonitoringStates(previousState, currentState);
  const lastDiagnostics = {
    timestamp: currentState.timestamp,
    results,
    currentState,
    changes
  };

  saveMonitoringState(currentState);
  saveLastDiagnostics(lastDiagnostics);

  return {
    results,
    previousState,
    currentState,
    changes
  };
}

module.exports = {
  ensureDataDir,
  loadMonitoringState,
  saveMonitoringState,
  loadLastDiagnostics,
  saveLastDiagnostics,
  buildMonitoringSnapshot,
  diffMonitoringStates,
  runMonitoringCycle
};
