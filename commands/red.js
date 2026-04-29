const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("red")
    .setDescription("Muestra el esquema basico de redes del homelab."),

  async execute(interaction) {
    const config = loadConfig();

    const network = config.network || {};
    const items = (network.items || []).filter(item =>
      item.name && item.value
    );

    if (items.length === 0) {
      await interaction.reply({
        content: "No hay datos de red configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(network.title || "Red del homelab")
      .setDescription("Datos de red definidos en config.json.")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const item of items.slice(0, 25)) {
      embed.addFields({
        name: item.name,
        value: item.value,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
