const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const { runDiagnostics, diagnosticsToDescription } = require("../utils/diagnostics");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("diagnostico")
    .setDescription("Hace un diagnostico real de DNS, puertos y URLs del homelab."),

  async execute(interaction) {
    const config = loadConfig();

    await interaction.deferReply();

    const results = await runDiagnostics(config);
    const embed = new EmbedBuilder()
      .setTitle("Diagnostico del homelab")
      .setDescription(diagnosticsToDescription(results))
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    await interaction.editReply({ embeds: [embed] });
  }
};
