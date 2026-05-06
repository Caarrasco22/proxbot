const fs = require("fs");
const path = require("path");

function getProxmoxConfig(config) {
  const integrations = (config && config.integrations) || {};
  return (integrations && integrations.proxmox) || {};
}

function isProxmoxEnabled(config) {
  return getProxmoxConfig(config).enabled === true;
}

function getProxmoxUrl(config) {
  const proxmox = getProxmoxConfig(config);
  return typeof proxmox.url === "string" ? proxmox.url.trim() : "";
}

function getProxmoxToken(config) {
  const proxmox = getProxmoxConfig(config);
  const tokenEnv = typeof proxmox.tokenEnv === "string" ? proxmox.tokenEnv.trim() : "PROXMOX_TOKEN";

  if (!tokenEnv) {
    return null;
  }

  const token = process.env[tokenEnv];

  if (!token) {
    return null;
  }

  return String(token).trim();
}

function buildProxmoxHeaders(token) {
  return {
    Authorization: token,
    Accept: "application/json"
  };
}

function getTimeoutMs(config) {
  const proxmox = getProxmoxConfig(config);
  const value = Number(proxmox.timeoutMs);
  return Number.isFinite(value) && value >= 1000 ? value : 5000;
}

async function proxmoxFetch(config, path) {
  // TLS certificate validation is handled by Node.js fetch.
  // Configure trusted CAs at OS/Node level for self-signed certificates.
  const url = getProxmoxUrl(config);
  const token = getProxmoxToken(config);
  const timeoutMs = getTimeoutMs(config);

  if (!url) {
    throw new Error("URL de Proxmox no configurada.");
  }

  if (!token) {
    throw new Error("Token de Proxmox no encontrado en la variable de entorno configurada.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const targetUrl = url.endsWith("/") ? `${url}${path}` : `${url}/${path}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: buildProxmoxHeaders(token),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Sin detalle");
      throw new Error(`Proxmox respondio HTTP ${response.status}: ${text}`);
    }

    const data = await response.json().catch(() => null);

    if (!data) {
      throw new Error("Respuesta de Proxmox no es JSON valido.");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Timeout al conectar con Proxmox.", { cause: error });
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function getProxmoxVersion(config) {
  const data = await proxmoxFetch(config, "api2/json/version");
  return data.data || null;
}

async function getProxmoxNodes(config) {
  const data = await proxmoxFetch(config, "api2/json/nodes");
  return Array.isArray(data.data) ? data.data : [];
}

async function getProxmoxResources(config) {
  const data = await proxmoxFetch(config, "api2/json/cluster/resources");
  return Array.isArray(data.data) ? data.data : [];
}

function resolveInventoryCachePath(config) {
  const proxmox = getProxmoxConfig(config);
  const configuredPath = typeof proxmox.inventoryCachePath === "string" ? proxmox.inventoryCachePath.trim() : "";

  if (!configuredPath) {
    return null;
  }

  const basePath = path.resolve(process.cwd());
  const resolvedPath = path.resolve(basePath, configuredPath);

  if (!resolvedPath.startsWith(basePath + path.sep) && resolvedPath !== basePath) {
    return null;
  }

  return resolvedPath;
}

async function getProxmoxInventoryResources(config) {
  const resources = await getProxmoxResources(config);
  return resources.filter(r => r.type === "qemu" || r.type === "lxc");
}

function readInventoryCache(config) {
  const cachePath = resolveInventoryCachePath(config);

  if (!cachePath) {
    return null;
  }

  if (!fs.existsSync(cachePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.timestamp === "string" &&
      Array.isArray(parsed.resources)
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

function writeInventoryCache(config, resources) {
  const cachePath = resolveInventoryCachePath(config);

  if (!cachePath) {
    return false;
  }

  if (!Array.isArray(resources)) {
    return false;
  }

  try {
    const dir = path.dirname(cachePath);
    fs.mkdirSync(dir, { recursive: true });

    const payload = {
      timestamp: new Date().toISOString(),
      resources
    };

    fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  getProxmoxConfig,
  isProxmoxEnabled,
  getProxmoxUrl,
  getProxmoxToken,
  buildProxmoxHeaders,
  getTimeoutMs,
  proxmoxFetch,
  getProxmoxVersion,
  getProxmoxNodes,
  getProxmoxResources,
  getProxmoxInventoryResources,
  readInventoryCache,
  writeInventoryCache,
  resolveInventoryCachePath
};
