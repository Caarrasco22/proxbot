const dns = require("dns").promises;
const net = require("net");

const DEFAULT_TIMEOUT = 2500;

function checkPort(host, port, timeout = DEFAULT_TIMEOUT) {
  return new Promise(resolve => {
    const socket = new net.Socket();

    const finish = ok => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));

    socket.connect(port, host);
  });
}

async function checkUrl(url, timeout = DEFAULT_TIMEOUT) {
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
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
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

  const dnsChecks = await Promise.all(domains.map(async domain => {
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

  const portChecks = await Promise.all(
    services
      .filter(service => service.host && service.port)
      .map(async service => {
        const ok = await checkPort(service.host, service.port);

        return {
          name: service.name || `${service.host}:${service.port}`,
          host: service.host,
          port: service.port,
          ok
        };
      })
  );

  const urlChecks = await Promise.all(
    services
      .filter(service => service.url)
      .map(async service => {
        const result = await checkUrl(service.url);

        return {
          name: service.name || service.url,
          url: service.url,
          ok: result.ok,
          status: result.status,
          error: result.error
        };
      })
  );

  const allChecks = [...dnsChecks, ...portChecks, ...urlChecks];
  const ok = allChecks.filter(check => check.ok).length;
  const failed = allChecks.length - ok;

  return {
    summary: {
      total: allChecks.length,
      ok,
      failed
    },
    dns: dnsChecks,
    ports: portChecks,
    urls: urlChecks
  };
}

function statusIcon(ok) {
  return ok ? "[OK]" : "[FALLO]";
}

function diagnosticsToDescription(results) {
  const lines = [
    `Resumen: ${results.summary.ok} OK - ${results.summary.failed} fallidos - ${results.summary.total} checks`
  ];

  lines.push("");
  lines.push("**DNS**");
  if (results.dns.length === 0) {
    lines.push("Sin dominios activos configurados.");
  } else {
    for (const check of results.dns) {
      const detail = check.ok ? check.address : check.error || "sin respuesta";
      lines.push(`${statusIcon(check.ok)} ${check.name} -> ${detail}`);
    }
  }

  lines.push("");
  lines.push("**Puertos TCP**");
  if (results.ports.length === 0) {
    lines.push("Sin servicios con host, port y check=true.");
  } else {
    for (const check of results.ports) {
      lines.push(`${statusIcon(check.ok)} ${check.name} ${check.host}:${check.port}`);
    }
  }

  lines.push("");
  lines.push("**URLs**");
  if (results.urls.length === 0) {
    lines.push("Sin servicios con url y check=true.");
  } else {
    for (const check of results.urls) {
      const detail = check.status ? `HTTP ${check.status}` : check.error || "sin respuesta";
      lines.push(`${statusIcon(check.ok)} ${check.name} -> ${detail}`);
    }
  }

  const description = lines.join("\n");

  if (description.length <= 4000) {
    return description;
  }

  return `${description.slice(0, 3950)}\n\nResultado truncado por limite de Discord.`;
}

module.exports = {
  checkPort,
  checkUrl,
  runDiagnostics,
  diagnosticsToDescription
};
