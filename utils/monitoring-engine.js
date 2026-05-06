const { EmbedBuilder } = require("discord.js");
const { runMonitoringCycle } = require("./monitoring");

function botFooter(config) {
  return config.bot?.footer || config.bot?.name || "ProxBot v.1";
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

module.exports = {
  monitoringIntervalMinutes,
  formatMonitoringAlert,
  sendMonitoringAlerts,
  executeMonitoringCycle,
  startMonitoring
};
