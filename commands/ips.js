const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ips")
    .setDescription("Muestra IPs importantes del homelab."),

  async execute(interaction) {
    const config = loadConfig();
    const services = (config.services || []).filter(service =>
      service.enabled !== false && service.host
    );

    if (services.length === 0) {
      await interaction.reply({
        content: "No hay servicios con IP configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("IPs del homelab")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const service of services.slice(0, 25)) {
      const valueParts = [];

      valueParts.push(service.host);

      if (service.port) {
        valueParts.push(`Puerto: ${service.port}`);
      }

      if (service.url) {
        valueParts.push(service.url);
      }

      embed.addFields({
        name: service.name || "Servicio sin nombre",
        value: valueParts.join("\n"),
        inline: true
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
