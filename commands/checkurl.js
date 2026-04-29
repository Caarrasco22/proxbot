const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkurl")
    .setDescription("Comprueba si una URL responde por HTTP/HTTPS.")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("URL completa, ejemplo: http://kuma.lab")
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url");

    await interaction.deferReply();

    try {
      const start = Date.now();

      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(5000)
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
        .setFooter({ text: "ProxBot v.1 · caarrasco.dev" });

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
        .setFooter({ text: "ProxBot v.1 · caarrasco.dev" });

      await interaction.editReply({ embeds: [embed] });
    }
  }
};
