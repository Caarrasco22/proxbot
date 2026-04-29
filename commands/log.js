const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const logPath = path.join(__dirname, "..", "logs", "homelab.log");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Guarda una nota en el diario del homelab.")
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Texto de la nota")
        .setRequired(true)
    ),

  async execute(interaction) {
    const texto = interaction.options.getString("texto");
    const date = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid"
    });

    const line = `[${date}] ${interaction.user.tag}: ${texto}\n`;

    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line, "utf8");

    const logsChannelId = process.env.CHANNEL_LOGS_ID;

    if (logsChannelId) {
      try {
        const channel = await interaction.client.channels.fetch(logsChannelId);

        if (channel) {
          await channel.send({
            content: `📝 **Nuevo log del homelab**\n**Autor:** ${interaction.user.tag}\n**Fecha:** ${date}\n**Nota:** ${texto}`
          });
        }
      } catch (error) {
        console.error("No se pudo enviar el log al canal:", error);
      }
    }

    await interaction.reply({
      content: "Nota guardada en el log del homelab y enviada al canal de logs.",
      ephemeral: true
    });
  }
};
