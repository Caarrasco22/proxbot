const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servicios")
    .setDescription("Muestra los servicios configurados del homelab."),

  async execute(interaction) {
    const config = loadConfig();

    const services = (config.services || []).filter(service =>
      service.enabled !== false && service.name
    );

    if (services.length === 0) {
      await interaction.reply({
        content: "No hay servicios configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Servicios del homelab")
      .setDescription("Servicios definidos en config.json.")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const service of services.slice(0, 25)) {
      const valueParts = [];

      if (service.description) {
        valueParts.push(service.description);
      }

      if (service.host) {
        valueParts.push(`Host: ${service.host}`);
      }

      if (service.port) {
        valueParts.push(`Puerto: ${service.port}`);
      }

      if (service.url) {
        valueParts.push(`URL: ${service.url}`);
      }

      if (service.tags && Array.isArray(service.tags) && service.tags.length > 0) {
        valueParts.push(`Tags: ${service.tags.join(", ")}`);
      }

      embed.addFields({
        name: service.name,
        value: valueParts.length > 0 ? valueParts.join("\n") : "Sin detalles extra",
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
