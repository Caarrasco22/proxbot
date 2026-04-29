const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const net = require("net");

function checkPort(host, port, timeout = 2000) {
  return new Promise(resolve => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

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
    const host = interaction.options.getString("host");
    const port = interaction.options.getInteger("puerto");

    await interaction.deferReply();

    const ok = await checkPort(host, port);

    const embed = new EmbedBuilder()
      .setTitle("Check de puerto")
      .setColor(ok ? 0x2ecc71 : 0xe74c3c)
      .addFields(
        { name: "Host", value: host, inline: true },
        { name: "Puerto", value: String(port), inline: true },
        { name: "Resultado", value: ok ? "ABIERTO / responde" : "CERRADO / no responde", inline: false }
      )
      .setFooter({ text: "ProxBot v.1 · caarrasco.dev" });

    await interaction.editReply({ embeds: [embed] });
  }
};
