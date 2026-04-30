const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");
const { loadConfig } = require("../utils/config");
const packageInfo = require("../package.json");

function formatUptime(seconds) {
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Muestra el estado basico de ProxBot."),

  async execute(interaction) {
    const config = loadConfig();
    const services = (config.services || []).filter(service => service.enabled !== false);
    const domains = (config.domains || []).filter(domain => domain.enabled !== false);
    const sshItems = (config.ssh || []).filter(item => item.enabled !== false);
    const checks = services.filter(service =>
      service.check === true && (service.url || (service.host && service.port))
    );

    const embed = new EmbedBuilder()
      .setTitle("Estado de ProxBot")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" })
      .addFields(
        { name: "Bot", value: config.bot?.name || "ProxBot v.1", inline: true },
        { name: "Version", value: packageInfo.version || "desconocida", inline: true },
        { name: "Node.js", value: process.version, inline: true },
        { name: "Plataforma", value: process.platform, inline: true },
        { name: "Uptime", value: formatUptime(process.uptime()), inline: true },
        { name: "Canal de logs", value: process.env.CHANNEL_LOGS_ID ? "Configurado" : "No configurado", inline: true },
        { name: "Directorio", value: `\`${path.resolve(process.cwd())}\``, inline: false },
        { name: "Servicios", value: String(services.length), inline: true },
        { name: "Dominios", value: String(domains.length), inline: true },
        { name: "SSH", value: String(sshItems.length), inline: true },
        { name: "Checks activos", value: String(checks.length), inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
