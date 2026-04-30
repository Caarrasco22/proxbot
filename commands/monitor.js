const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const {
  loadMonitoringState,
  loadLastDiagnostics
} = require("../utils/monitoring");

function formatBoolean(value) {
  return value ? "Si" : "No";
}

function formatDate(value) {
  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "medium"
  });
}

function activeServices(config) {
  return (config.services || []).filter(service => service.enabled !== false);
}

function activeDomains(config) {
  return (config.domains || []).filter(domain =>
    domain.enabled !== false && domain.name
  );
}

function checkedServices(config) {
  return activeServices(config).filter(service => service.check === true);
}

function countChecks(config) {
  const domains = activeDomains(config).length;
  const services = checkedServices(config);
  const tcp = services.filter(service => service.host && service.port).length;
  const urls = services.filter(service => service.url).length;

  return {
    domains,
    tcp,
    urls,
    total: domains + tcp + urls
  };
}

function monitoringColor(config, state) {
  const checks = state && Array.isArray(state.checks) ? state.checks : [];
  const failed = checks.filter(check => check.ok === false).length;

  if (failed > 0) {
    return 0xe74c3c;
  }

  return config.monitoring?.enabled === true ? 0x2ecc71 : 0xf1c40f;
}

function monitoringStateSummary(state) {
  if (!state || !Array.isArray(state.checks)) {
    return "Todavia no hay estado guardado. Ejecuta /diagnostico o activa monitoring.runOnStartup.";
  }

  const ok = state.checks.filter(check => check.ok === true).length;
  const failed = state.checks.filter(check => check.ok === false).length;

  return [
    `Ultima ejecucion: ${formatDate(state.timestamp)}`,
    `Checks guardados: ${state.checks.length}`,
    `Checks OK: ${ok}`,
    `Checks fallidos: ${failed}`
  ].join("\n");
}

function lastDiagnosticsSummary(payload) {
  if (!payload) {
    return "Todavia no hay diagnostico guardado.";
  }

  const results = payload.results || {};
  const total = Number(results.total ?? results.summary?.total ?? 0);
  const ok = Number(results.okCount ?? results.summary?.ok ?? 0);
  const failed = Number(results.failCount ?? results.summary?.failed ?? 0);

  return [
    `Fecha/hora: ${formatDate(payload.timestamp)}`,
    `OK: ${ok}`,
    `Fallos: ${failed}`,
    `Total: ${total}`
  ].join("\n");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("monitor")
    .setDescription("Muestra el estado de la monitorizacion automatica."),

  async execute(interaction) {
    const config = loadConfig();
    const monitoring = config.monitoring || {};
    const state = loadMonitoringState();
    const lastDiagnostics = loadLastDiagnostics();
    const checks = countChecks(config);
    const services = activeServices(config);
    const servicesWithCheck = checkedServices(config);
    const domains = activeDomains(config);

    const embed = new EmbedBuilder()
      .setTitle("Monitorizacion automatica")
      .setColor(monitoringColor(config, state))
      .setFooter({ text: config.bot?.footer || "ProxBot" })
      .addFields(
        {
          name: "Estado general",
          value: [
            `Monitorizacion: ${monitoring.enabled === true ? "Activa" : "Inactiva"}`,
            `Intervalo: ${Number(monitoring.intervalMinutes) || 5} minutos`,
            `Canal de alertas: ${monitoring.alertChannelId ? "Configurado" : "No configurado"}`,
            `Avisos solo con cambios: ${formatBoolean(monitoring.notifyOnlyOnChange !== false)}`,
            `Check al arrancar: ${formatBoolean(monitoring.runOnStartup === true)}`
          ].join("\n"),
          inline: false
        },
        {
          name: "Alcance",
          value: [
            `Servicios configurados: ${services.length}`,
            `Servicios con check=true: ${servicesWithCheck.length}`,
            `Dominios configurados: ${domains.length}`,
            `Checks esperados: ${checks.total} (${checks.domains} DNS, ${checks.tcp} TCP, ${checks.urls} URL)`
          ].join("\n"),
          inline: false
        },
        {
          name: "Estado guardado",
          value: monitoringStateSummary(state),
          inline: false
        },
        {
          name: "Ultimo diagnostico",
          value: lastDiagnosticsSummary(lastDiagnostics),
          inline: false
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
