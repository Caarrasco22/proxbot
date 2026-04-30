const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const { checkPort } = require("../utils/diagnostics");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkpuerto")
    .setDescription("Comprueba si un puerto TCP esta abierto.")
    .addStringOption(option =>
      option
        .setName("host")
        .setDescription("IP o dominio a comprobar")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("puerto")
        .setDescription("Puerto TCP a comprobar")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(65535)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const host = interaction.options.getString("host");
    const port = interaction.options.getInteger("puerto");

    await interaction.deferReply();

    const result = await checkPort(host, port);

    const embed = new EmbedBuilder()
      .setTitle("Check de puerto")
      .setColor(result.ok ? 0x2ecc71 : 0xe74c3c)
      .addFields(
        { name: "Host", value: host, inline: true },
        { name: "Puerto", value: String(port), inline: true },
        { name: "Tiempo", value: `${result.ms} ms`, inline: true },
        { name: "Resultado", value: result.ok ? "ABIERTO / responde" : "CERRADO / no responde", inline: false }
      )
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    await interaction.editReply({ embeds: [embed] });
  }
};
