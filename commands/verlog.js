const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { loadConfig } = require("../utils/config");

const logPath = path.join(__dirname, "..", "logs", "homelab.log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verlog")
    .setDescription("Muestra las ultimas notas del diario del homelab."),

  async execute(interaction) {
    const config = loadConfig();

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
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    await interaction.reply({ embeds: [embed] });
  }
};
