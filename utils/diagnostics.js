const dns = require("dns").promises;
const net = require("net");

const DEFAULT_TIMEOUT = 2500;

function checkPort(host, port, timeout = DEFAULT_TIMEOUT) {
  return new Promise(resolve => {
    const start = Date.now();
    const socket = new net.Socket();

    const finish = (ok, error) => {
      socket.destroy();
      resolve({
        ok,
        ms: Date.now() - start,
        error
      });
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false, "timeout"));
    socket.once("error", error => finish(false, error.code || error.message));

    socket.connect(port, host);
  });
}

async function checkUrl(url, timeout = DEFAULT_TIMEOUT) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal
    });

    return {
      ok: response.status >= 200 && response.status <= 399,
      status: response.status,
      ms: Date.now() - start
    };
  } catch (error) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runDiagnostics(config) {
  const domains = (config.domains || []).filter(domain =>
    domain.enabled !== false && domain.name
  );

  const services = (config.services || []).filter(service =>
    service.enabled !== false && service.check === true
  );

  const dnsResults = await Promise.all(domains.map(async domain => {
    try {
      const result = await dns.lookup(domain.name);

      return {
        name: domain.name,
        target: domain.target,
        ok: true,
        address: result.address
      };
    } catch (error) {
      return {
        name: domain.name,
        target: domain.target,
        ok: false,
        error: error.code || error.message
      };
    }
  }));

  const portResults = await Promise.all(
    services
      .filter(service => service.host && service.port)
      .map(async service => {
        const result = await checkPort(service.host, service.port);

        return {
          name: service.name || `${service.host}:${service.port}`,
          host: service.host,
          port: service.port,
          ok: result.ok,
          ms: result.ms,
          error: result.error
        };
      })
  );

  const urlResults = await Promise.all(
    services
      .filter(service => service.url)
      .map(async service => {
        const result = await checkUrl(service.url);

        return {
          name: service.name || service.url,
          url: service.url,
          ok: result.ok,
          status: result.status,
          ms: result.ms,
          error: result.error
        };
      })
  );

  const allResults = [...dnsResults, ...portResults, ...urlResults];
  const okCount = allResults.filter(result => result.ok).length;
  const total = allResults.length;
  const failCount = total - okCount;

  return {
    dnsResults,
    portResults,
    urlResults,
    okCount,
    failCount,
    total,
    summary: {
      total,
      ok: okCount,
      failed: failCount
    },
    dns: dnsResults,
    ports: portResults,
    urls: urlResults
  };
}

function statusIcon(ok) {
  return ok ? "OK" : "FALLO";
}

function diagnosticsToDescription(results) {
  if (results.total === 0) {
    return "No hay dominios ni servicios con check=true configurados en config.json.";
  }

  const lines = [
    results.failCount === 0
      ? `Diagnostico completado: ${results.okCount}/${results.total} checks OK.`
      : `Diagnostico completado: ${results.okCount}/${results.total} OK, ${results.failCount} fallo(s).`
  ];

  lines.push("");
  lines.push("**DNS**");
  if (results.dnsResults.length === 0) {
    lines.push("Sin dominios activos configurados.");
  } else {
    for (const check of results.dnsResults) {
      const detail = check.ok ? check.address : check.error || "sin respuesta";
      lines.push(`[${statusIcon(check.ok)}] ${check.name} -> ${detail}`);
    }
  }

  lines.push("");
  lines.push("**Puertos TCP**");
  if (results.portResults.length === 0) {
    lines.push("Sin servicios con host, port y check=true.");
  } else {
    for (const check of results.portResults) {
      const detail = check.ok ? `${check.ms} ms` : check.error || "sin respuesta";
      lines.push(`[${statusIcon(check.ok)}] ${check.name} ${check.host}:${check.port} -> ${detail}`);
    }
  }

  lines.push("");
  lines.push("**URLs HTTP/HTTPS**");
  if (results.urlResults.length === 0) {
    lines.push("Sin servicios con url y check=true.");
  } else {
    for (const check of results.urlResults) {
      const detail = check.status ? `HTTP ${check.status} (${check.ms} ms)` : check.error || "sin respuesta";
      lines.push(`[${statusIcon(check.ok)}] ${check.name} -> ${detail}`);
    }
  }

  const description = lines.join("\n");

  if (description.length <= 4000) {
    return description;
  }

  return `${description.slice(0, 3950)}\n\nResultado truncado por limite de Discord.`;
}

function diagnosticsColor(results) {
  if (results.total === 0) {
    return 0xf1c40f;
  }

  if (results.failCount === 0) {
    return 0x2ecc71;
  }

  if (results.okCount > 0) {
    return 0xf1c40f;
  }

  return 0xe74c3c;
}

module.exports = {
  checkPort,
  checkUrl,
  runDiagnostics,
  diagnosticsToDescription,
  diagnosticsColor
};
