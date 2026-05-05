require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { loadConfig } = require("./utils/config");
const {
  runDiagnostics,
  diagnosticsToDescription,
  diagnosticsColor
} = require("./utils/diagnostics");
const { runMonitoringCycle } = require("./utils/monitoring");
const {
  getActiveServices,
  getInventorySummary,
  getInventoryFacets,
  formatServiceListItem,
  truncate
} = require("./utils/inventory");
const {
  getActiveBackups,
  getActiveMaintenanceTasks,
  formatBackupItem,
  formatMaintenanceItem,
  truncate: maintenanceTruncate
} = require("./utils/maintenance");
const {
  isPermissionsEnabled,
  canUseCommand,
  canUsePanelCommand,
  protectedCommandMessage,
  panelCommandName
} = require("./utils/permissions");
const {
  isProxmoxEnabled,
  getProxmoxUrl,
  getProxmoxToken,
  getProxmoxInventoryResources,
  readInventoryCache
} = require("./utils/proxmox");

if (!process.env.DISCORD_TOKEN) {
  console.error("Falta la variable de entorno: DISCORD_TOKEN");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`El comando ${file} no tiene data o execute.`);
  }
}

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

    if (service.description) valueParts.push(service.description);
    valueParts.push(service.url);
    if (service.host) valueParts.push(`Host: ${service.host}`);
    if (service.port) valueParts.push(`Puerto: ${service.port}`);

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
  if (bytes === undefined || bytes === null) return "N/A";
  const num = Number(bytes);
  if (!Number.isFinite(num) || num < 0) return "N/A";

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

function buildButtonRows(buttons) {
  const rows = [];

  for (let index = 0; index < buttons.length && rows.length < 5; index += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(index, index + 5)));
  }

  return rows;
}

function panelRows() {
  const config = getConfig();
  const buttons = [
    new ButtonBuilder().setCustomId("panel_accesos").setLabel("Accesos").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("panel_red").setLabel("Red").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("panel_inventario").setLabel("Inventario").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_diagnostico").setLabel("Diagnostico").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_ssh").setLabel("SSH").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_seguridad").setLabel("Seguridad").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("panel_pendientes").setLabel("Pendientes").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_backups").setLabel("Backups").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_mantenimiento").setLabel("Mantenimiento").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_proxmox_inventario").setLabel("Proxmox").setStyle(ButtonStyle.Secondary)
  ];

  const urlButtons = (config.services || [])
    .filter(service =>
      service.enabled !== false &&
      typeof service.url === "string" &&
      /^https?:\/\//i.test(service.url)
    )
    .slice(0, 10)
    .map(service =>
      new ButtonBuilder()
        .setLabel((service.name || service.url).slice(0, 80))
        .setStyle(ButtonStyle.Link)
        .setURL(service.url)
    );

  return buildButtonRows([...buttons, ...urlButtons]);
}

function monitoringIntervalMinutes(config) {
  const value = Number(config.monitoring?.intervalMinutes);
  return Number.isFinite(value) && value >= 1 ? value : 5;
}

function formatMonitoringAlert(change) {
  if (change.type === "FAILED") {
    return {
      title: "Servicio con fallo",
      color: 0xe74c3c,
      description: [
        `**Nombre:** ${change.name}`,
        `**Tipo:** ${String(change.checkType || "").toUpperCase()}`,
        "**Estado anterior:** OK",
        "**Estado actual:** FALLO",
        `**Detalle:** ${change.currentMessage || "Sin detalle"}`
      ].join("\n")
    };
  }

  if (change.type === "RECOVERED") {
    return {
      title: "Servicio recuperado",
      color: 0x2ecc71,
      description: [
        `**Nombre:** ${change.name}`,
        `**Tipo:** ${String(change.checkType || "").toUpperCase()}`,
        "**Estado anterior:** FALLO",
        "**Estado actual:** OK",
        `**Detalle:** ${change.currentMessage || "Sin detalle"}`
      ].join("\n")
    };
  }

  return null;
}

async function sendMonitoringAlerts(discordClient, config, changes) {
  const relevantChanges = changes.filter(change =>
    change.type === "FAILED" || change.type === "RECOVERED"
  );

  if (relevantChanges.length === 0) {
    return;
  }

  const alertChannelId = config.monitoring?.alertChannelId;

  if (!alertChannelId) {
    console.warn("Monitoring: alertChannelId is not configured");
    return;
  }

  try {
    const channel = await discordClient.channels.fetch(alertChannelId);

    if (!channel || typeof channel.send !== "function") {
      console.error("Monitoring: alert channel is not available for sending messages");
      return;
    }

    for (const change of relevantChanges) {
      const alert = formatMonitoringAlert(change);

      if (!alert) {
        continue;
      }

      const embed = new EmbedBuilder()
        .setTitle(alert.title)
        .setDescription(alert.description)
        .setColor(alert.color)
        .setFooter({ text: botFooter(config) })
        .setTimestamp(new Date(change.timestamp));

      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Monitoring: could not send alerts:", error.message);
  }
}

async function executeMonitoringCycle(discordClient, config) {
  try {
    const monitoringResult = await runMonitoringCycle(config);
    const changes = monitoringResult.changes || [];

    // Future: periodic summary alerts can be added here.
    await sendMonitoringAlerts(discordClient, config, changes);
  } catch (error) {
    console.error("Monitoring: cycle failed:", error.message);
  }
}

function startMonitoring(discordClient, config) {
  const monitoring = config.monitoring || {};

  if (monitoring.enabled !== true) {
    console.log("Monitoring: disabled");
    return;
  }

  const intervalMinutes = monitoringIntervalMinutes(config);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`Monitoring: enabled every ${intervalMinutes} minute(s)`);

  if (!monitoring.alertChannelId) {
    console.warn("Monitoring: alertChannelId is not configured");
  }

  if (monitoring.runOnStartup === true) {
    console.log("Monitoring: running startup check");
    executeMonitoringCycle(discordClient, config);
  }

  setInterval(() => {
    executeMonitoringCycle(discordClient, config);
  }, intervalMs);
}

client.once(Events.ClientReady, readyClient => {
  const config = getConfig();

  console.clear();
  console.log(`${config.bot?.name || "ProxBot v.1"} conectado como ${readyClient.user.tag}`);
  console.log("Estado: online");
  console.log("Directorio: /opt/proxbot-dev");
  startMonitoring(readyClient, config);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    const map = {
      panel_accesos: accessEmbed,
      panel_red: redEmbed,
      panel_inventario: inventarioEmbed,
      panel_ssh: sshEmbed,
      panel_seguridad: seguridadEmbed,
      panel_pendientes: pendientesEmbed,
      panel_backups: backupsEmbed,
      panel_mantenimiento: mantenimientoEmbed
    };

    const config = getConfig();

    if (interaction.customId === "panel_diagnostico") {
      if (!canUsePanelCommand(interaction, config, "diagnostico")) {
        await interaction.reply({ content: protectedCommandMessage("diagnostico"), ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [await diagnosticoEmbed()] });
      return;
    }

    if (interaction.customId === "panel_proxmox_inventario") {
      if (!canUsePanelCommand(interaction, config, "proxmox-inventario")) {
        await interaction.reply({ content: protectedCommandMessage("proxmox-inventario"), ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [await proxmoxInventarioPanelEmbed()] });
      return;
    }

    const builder = map[interaction.customId];

    if (!builder) {
      await interaction.reply({ content: "Boton no reconocido.", ephemeral: true });
      return;
    }

    const panelCmdName = panelCommandName(interaction.customId);
    if (panelCmdName && !canUsePanelCommand(interaction, config, panelCmdName)) {
      await interaction.reply({ content: protectedCommandMessage(panelCmdName), ephemeral: true });
      return;
    }

    await interaction.reply({
      embeds: [builder()],
      ephemeral: true
    });
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "Ese comando no existe.",
      ephemeral: true
    });
    return;
  }

  const cmdConfig = getConfig();
  if (!canUseCommand(interaction, cmdConfig)) {
    await interaction.reply({
      content: protectedCommandMessage(interaction.commandName),
      ephemeral: true
    });
    return;
  }

  try {
    await command.execute(interaction, { panelRows });
  } catch (error) {
    console.error("Error ejecutando comando:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Ha habido un error al ejecutar el comando.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "Ha habido un error al ejecutar el comando.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
