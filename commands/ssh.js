const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ssh")
    .setDescription("Muestra comandos SSH configurados."),

  async execute(interaction) {
    const config = loadConfig();

    const sshItems = (config.ssh || []).filter(item =>
      item.enabled !== false && item.name && item.command
    );

    if (sshItems.length === 0) {
      await interaction.reply({
        content: "No hay comandos SSH configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Chuleta SSH")
      .setDescription("Comandos definidos en config.json.")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const item of sshItems.slice(0, 25)) {
      embed.addFields({
        name: item.name,
        value: `\`${item.command}\``,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
