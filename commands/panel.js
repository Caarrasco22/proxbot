const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

function botColor(config) {
  const color = Number(config.bot?.color || "0x0f4c81");
  return Number.isFinite(color) ? color : 0x0f4c81;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Muestra el panel principal del homelab."),

  async execute(interaction, context) {
    const config = loadConfig();
    const botName = config.bot?.name || "ProxBot v.1";

    const embed = new EmbedBuilder()
      .setTitle(`${botName} - Panel del homelab`)
      .setDescription("Panel central para accesos, red, diagnostico, SSH, seguridad y pendientes.")
      .setColor(botColor(config))
      .addFields(
        { name: "Accesos", value: "Servicios con URL", inline: true },
        { name: "Red", value: "Datos de red", inline: true },
        { name: "Diagnostico", value: "DNS, puertos TCP y URLs", inline: true },
        { name: "SSH", value: "Comandos configurados", inline: true },
        { name: "Seguridad", value: "Checklist defensiva", inline: true },
        { name: "Pendientes", value: "Lista de tareas", inline: true }
      )
      .setFooter({ text: config.bot?.footer || botName });

    await interaction.reply({
      embeds: [embed],
      components: context.panelRows()
    });
  }
};
