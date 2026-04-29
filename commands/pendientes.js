const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pendientes")
    .setDescription("Muestra pendientes actuales del homelab."),

  async execute(interaction) {
    const config = loadConfig();

    const pending = (config.pending || []).filter(item =>
      typeof item === "string" && item.trim().length > 0
    );

    if (pending.length === 0) {
      await interaction.reply({
        content: "No hay pendientes configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Pendientes del homelab")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    pending.slice(0, 25).forEach((item, index) => {
      embed.addFields({
        name: `${index + 1}. Pendiente`,
        value: item,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
