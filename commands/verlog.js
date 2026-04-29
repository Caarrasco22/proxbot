const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "..", "logs", "homelab.log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verlog")
    .setDescription("Muestra las ultimas notas del diario del homelab."),

  async execute(interaction) {
    if (!fs.existsSync(logPath)) {
      await interaction.reply({
        content: "Todavia no hay notas guardadas.",
        ephemeral: true
      });
      return;
    }

    const lines = fs.readFileSync(logPath, "utf8").trim().split("\n").slice(-8);

    const embed = new EmbedBuilder()
      .setTitle("Ultimas notas del homelab")
      .setDescription(lines.map(line => `- ${line}`).join("\n"))
      .setColor(0x0f4c81)
      .setFooter({ text: "ProxBot v.1 · caarrasco.dev" });

    await interaction.reply({ embeds: [embed] });
  }
};
