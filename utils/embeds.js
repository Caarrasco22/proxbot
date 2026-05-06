const { EmbedBuilder } = require("discord.js");
const { loadConfig } = require("./config");
const {
  runDiagnostics,
  diagnosticsToDescription,
  diagnosticsColor
} = require("./diagnostics");
const {
  getActiveServices,
  getInventorySummary,
  getInventoryFacets,
  formatServiceListItem,
  truncate
} = require("./inventory");
const {
  getActiveBackups,
  getActiveMaintenanceTasks,
  formatBackupItem,
  formatMaintenanceItem,
  truncate: maintenanceTruncate
} = require("./maintenance");
const {
  isProxmoxEnabled,
  getProxmoxUrl,
  getProxmoxToken,
  getProxmoxInventoryResources,
  readInventoryCache
} = require("./proxmox");

function getConfig() {
  return loadConfig();
}

function botColor(config) {
  const color = Number(config.bot?.color || "0x0f4c81");
  return Number.isFinite(color) ? color : 0x0f4c81;
}

function botFooter(config) {
  return config.bot?.footer || config.bot?.name || "ProxBot v.1";
}

function baseEmbed(config, title, description) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(botColor(config))
    .setFooter({ text: botFooter(config) });

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

function addListFields(embed, items, emptyMessage, namePrefix) {
  if (items.length === 0) {
    embed.setDescription(emptyMessage);
    return embed;
  }

  items.slice(0, 25).forEach((item, index) => {
    embed.addFields({
      name: `${index + 1}. ${namePrefix}`,
      value: item,
      inline: false
    });
  });

  return embed;
}

function accessEmbed() {
  const config = getConfig();
  const services = (config.services || []).filter(service =>
    service.enabled !== false && service.url
  );

  const embed = baseEmbed(
    config,
    "Accesos del homelab",
    services.length > 0
      ? "Servicios con URL definidos en config.json."
      : "No hay servicios con URL configurados en config.json."
  );

  for (const service of services.slice(0, 25)) {
    const valueParts = [];

    if (service.description) {valueParts.push(service.description);}
    valueParts.push(service.url);
    if (service.host) {valueParts.push(`Host: ${service.host}`);}
    if (service.port) {valueParts.push(`Puerto: ${service.port}`);}

    embed.addFields({
      name: service.name || service.url,
      value: valueParts.join("\n"),
      inline: false
    });
  }

  return embed;
}

function redEmbed() {
  const config = getConfig();
  const network = config.network || {};
  const items = (network.items || []).filter(item => item.name && item.value);

  const embed = baseEmbed(
    config,
    network.title || "Red del homelab",
    items.length > 0
      ? "Datos de red definidos en config.json."
      : "No hay datos de red configurados en config.json."
  );

  for (const item of items.slice(0, 25)) {
    embed.addFields({
      name: item.name,
      value: item.value,
      inline: false
    });
  }

  return embed;
}

function sshEmbed() {
  const config = getConfig();
  const sshItems = (config.ssh || []).filter(item =>
    item.enabled !== false && item.name && item.command
  );

  const embed = baseEmbed(
    config,
    "Chuleta SSH",
    sshItems.length > 0
      ? "Comandos definidos en config.json."
      : "No hay comandos SSH configurados en config.json."
  );

  for (const item of sshItems.slice(0, 25)) {
    embed.addFields({
      name: item.name,
      value: `\`${item.command}\``,
      inline: false
    });
  }

  return embed;
}

function seguridadEmbed() {
  const config = getConfig();
  const security = (config.security || []).filter(item =>
    typeof item === "string" && item.trim().length > 0
  );

  return addListFields(
    baseEmbed(config, "Checklist de seguridad"),
    security,
    "No hay puntos de seguridad configurados en config.json.",
    "Seguridad"
  );
}

function pendientesEmbed() {
  const config = getConfig();
  const pending = (config.pending || []).filter(item =>
    typeof item === "string" && item.trim().length > 0
  );

  return addListFields(
    baseEmbed(config, "Pendientes del homelab"),
    pending,
    "No hay pendientes configurados en config.json.",
    "Pendiente"
  );
}

async function diagnosticoEmbed() {
  const config = getConfig();
  const results = await runDiagnostics(config);

  return new EmbedBuilder()
    .setTitle("Diagnostico del homelab")
    .setDescription(diagnosticsToDescription(results))
    .setColor(diagnosticsColor(results))
    .setFooter({ text: botFooter(config) });
}

function formatFacetList(items, emptyMessage) {
  if (!items || items.length === 0) {
    return emptyMessage;
  }

  return items
    .slice(0, 10)
    .map(item => `${item.name} (${item.count})`)
    .join(", ");
}

function inventarioEmbed() {
  const config = getConfig();
  const services = getActiveServices(config);
  const summary = getInventorySummary(config, services);
  const facets = getInventoryFacets(services);
  const visibleServices = services.slice(0, 10);
  const embed = baseEmbed(
    config,
    "Inventario del homelab",
    "Resumen de servicios documentados en config.json."
  );

  embed.addFields(
    {
      name: "Resumen",
      value: [
        `Servicios activos: ${summary.total}`,
        `Servicios con URL: ${summary.withUrl}`,
        `Servicios con host: ${summary.withHost}`,
        `Servicios con puerto: ${summary.withPort}`,
        `Servicios con check=true: ${summary.withCheck}`
      ].join("\n"),
      inline: false
    },
    {
      name: "Categorias",
      value: formatFacetList(facets.categories, "Sin categorias configuradas."),
      inline: false
    },
    {
      name: "Tags principales",
      value: formatFacetList(facets.tags, "Sin tags configurados."),
      inline: false
    }
  );

  if (visibleServices.length === 0) {
    embed.addFields({
      name: "Servicios",
      value: "No hay servicios activos configurados.",
      inline: false
    });
    return embed;
  }

  for (const service of visibleServices) {
    embed.addFields({
      name: truncate(service.name || "Servicio sin nombre", 256),
      value: formatServiceListItem(service),
      inline: false
    });
  }

  if (services.length > visibleServices.length) {
    embed.addFields({
      name: "Listado resumido",
      value: `Se muestran 10 de ${services.length} servicios. Usa /inventario para ver mas o filtrar.`,
      inline: false
    });
  }

  return embed;
}

function backupsEmbed() {
  const config = getConfig();
  const backups = getActiveBackups(config);
  const visibleBackups = backups.slice(0, 10);
  const embed = baseEmbed(
    config,
    "Backups del homelab",
    "Backups documentados en config.json. ProxBot solo informa: no ejecuta backups, no restaura y no borra nada."
  );

  embed.addFields({
    name: "Resumen",
    value: `Backups activos: ${backups.length}`,
    inline: false
  });

  if (visibleBackups.length === 0) {
    embed.addFields({
      name: "Backups",
      value: "No hay backups activos configurados.",
      inline: false
    });
    return embed;
  }

  for (const backup of visibleBackups) {
    embed.addFields({
      name: maintenanceTruncate(backup.name || "Backup sin nombre", 256),
      value: formatBackupItem(backup),
      inline: false
    });
  }

  if (backups.length > visibleBackups.length) {
    embed.addFields({
      name: "Listado resumido",
      value: `Se muestran 10 de ${backups.length} backups. Usa /backups para ver mas.`,
      inline: false
    });
  }

  return embed;
}

function mantenimientoEmbed() {
  const config = getConfig();
  const tasks = getActiveMaintenanceTasks(config);
  const visibleTasks = tasks.slice(0, 10);
  const embed = baseEmbed(
    config,
    "Mantenimiento del homelab",
    "Tareas documentadas en config.json. ProxBot solo informa: no ejecuta comandos ni cambia la configuracion del servidor."
  );

  embed.addFields({
    name: "Resumen",
    value: `Tareas activas: ${tasks.length}`,
    inline: false
  });

  if (visibleTasks.length === 0) {
    embed.addFields({
      name: "Tareas",
      value: "No hay tareas de mantenimiento activas configuradas.",
      inline: false
    });
    return embed;
  }

  for (const task of visibleTasks) {
    embed.addFields({
      name: maintenanceTruncate(task.name || "Tarea sin nombre", 256),
      value: formatMaintenanceItem(task),
      inline: false
    });
  }

  if (tasks.length > visibleTasks.length) {
    embed.addFields({
      name: "Listado resumido",
      value: `Se muestran 10 de ${tasks.length} tareas. Usa /mantenimiento para ver mas.`,
      inline: false
    });
  }

  return embed;
}

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) {return "N/A";}
  const num = Number(bytes);
  if (!Number.isFinite(num) || num < 0) {return "N/A";}

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = num;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

async function proxmoxInventarioPanelEmbed() {
  const config = getConfig();

  if (!isProxmoxEnabled(config)) {
    return baseEmbed(config, "Inventario Proxmox", "La integracion Proxmox esta desactivada en config.json.");
  }

  if (!getProxmoxUrl(config)) {
    return baseEmbed(config, "Inventario Proxmox", "La URL de Proxmox no esta configurada.");
  }

  if (!getProxmoxToken(config)) {
    return baseEmbed(config, "Inventario Proxmox", "El token de Proxmox no esta configurado en la variable de entorno.");
  }

  try {
    const resources = await getProxmoxInventoryResources(config);
    const vmCount = resources.filter(r => r.type === "qemu").length;
    const ctCount = resources.filter(r => r.type === "lxc").length;

    const embed = baseEmbed(
      config,
      "Inventario detectado desde Proxmox VE",
      "Solo lectura. No modifica config.json."
    );

    embed.addFields({
      name: "Resumen",
      value: [
        `Recursos detectados: ${resources.length}`,
        `VMs (qemu): ${vmCount}`,
        `CTs (lxc): ${ctCount}`
      ].join("\n"),
      inline: false
    });

    if (resources.length === 0) {
      embed.addFields({
        name: "Recursos",
        value: "No se encontraron VMs ni CTs en el cluster.",
        inline: false
      });
      return embed;
    }

    for (const res of resources.slice(0, 10)) {
      const lines = [
        `Tipo: ${res.type || "desconocido"}`,
        res.status ? `Estado: ${res.status}` : null,
        res.node ? `Nodo: ${res.node}` : null,
        res.vmid !== undefined ? `VMID: ${res.vmid}` : null,
        res.maxmem !== undefined ? `Memoria max: ${formatBytes(res.maxmem)}` : null
      ].filter(Boolean);

      embed.addFields({
        name: truncate(res.name || `Recurso ${res.vmid || "sin ID"}`, 256),
        value: lines.join("\n") || "Sin detalles.",
        inline: false
      });
    }

    if (resources.length > 10) {
      embed.addFields({
        name: "Resultado truncado",
        value: `Se muestran 10 de ${resources.length} recursos. Usa /proxmox-inventario para ver mas.`,
        inline: false
      });
    }

    return embed;
  } catch (error) {
    console.error("Error en panel_proxmox_inventario:", error.message);

    const cached = readInventoryCache(config);

    if (cached) {
      const resources = cached.resources || [];
      const vmCount = resources.filter(r => r.type === "qemu").length;
      const ctCount = resources.filter(r => r.type === "lxc").length;

      const embed = baseEmbed(
        config,
        "Inventario detectado desde Proxmox VE",
        `No se pudo consultar Proxmox. Mostrando cache de ${cached.timestamp}.`
      );

      embed.addFields({
        name: "Resumen",
        value: [
          `Recursos detectados: ${resources.length}`,
          `VMs (qemu): ${vmCount}`,
          `CTs (lxc): ${ctCount}`
        ].join("\n"),
        inline: false
      });

      for (const res of resources.slice(0, 10)) {
        const lines = [
          `Tipo: ${res.type || "desconocido"}`,
          res.status ? `Estado: ${res.status}` : null,
          res.node ? `Nodo: ${res.node}` : null,
          res.vmid !== undefined ? `VMID: ${res.vmid}` : null
        ].filter(Boolean);

        embed.addFields({
          name: truncate(res.name || `Recurso ${res.vmid || "sin ID"}`, 256),
          value: lines.join("\n") || "Sin detalles.",
          inline: false
        });
      }

      return embed;
    }

    return baseEmbed(
      config,
      "Inventario Proxmox",
      "No se pudo consultar Proxmox y no hay cache disponible. Revisa la configuracion y la conectividad."
    );
  }
}

module.exports = {
  botColor,
  botFooter,
  baseEmbed,
  addListFields,
  accessEmbed,
  redEmbed,
  sshEmbed,
  seguridadEmbed,
  pendientesEmbed,
  diagnosticoEmbed,
  formatFacetList,
  inventarioEmbed,
  backupsEmbed,
  mantenimientoEmbed,
  formatBytes,
  proxmoxInventarioPanelEmbed
};
