const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkurl")
    .setDescription("Comprueba si una URL responde por HTTP/HTTPS.")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("URL completa, ejemplo: http://servicio.local")
        .setRequired(true)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const url = interaction.options.getString("url");

    await interaction.deferReply();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const start = Date.now();

      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal
      });

      const ms = Date.now() - start;
      const ok = response.status >= 200 && response.status < 400;

      const embed = new EmbedBuilder()
        .setTitle("Check URL")
        .setColor(ok ? 0x2ecc71 : 0xf1c40f)
        .addFields(
          { name: "URL", value: url, inline: false },
          { name: "Codigo HTTP", value: String(response.status), inline: true },
          { name: "Tiempo", value: `${ms} ms`, inline: true },
          { name: "Resultado", value: ok ? "Responde correctamente" : "Responde, pero revisar codigo", inline: false }
        )
        .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle("Check URL")
        .setColor(0xe74c3c)
        .addFields(
          { name: "URL", value: url, inline: false },
          { name: "Resultado", value: "No responde", inline: true },
          { name: "Error", value: String(error.code || error.message), inline: false }
        )
        .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

      await interaction.editReply({ embeds: [embed] });
    } finally {
      clearTimeout(timer);
    }
  }
};
