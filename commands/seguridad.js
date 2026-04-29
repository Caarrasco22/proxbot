const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("seguridad")
    .setDescription("Muestra una checklist basica de seguridad del homelab."),

  async execute(interaction) {
    const config = loadConfig();

    const security = (config.security || []).filter(item =>
      typeof item === "string" && item.trim().length > 0
    );

    if (security.length === 0) {
      await interaction.reply({
        content: "No hay puntos de seguridad configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Checklist de seguridad")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    security.slice(0, 25).forEach((item, index) => {
      embed.addFields({
        name: `${index + 1}. Seguridad`,
        value: item,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
