const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const {
  findServiceByName,
  formatServiceDetails,
  truncate
} = require("../utils/inventory");

function serviceLabel(service) {
  const status = service.enabled === false ? "disabled" : "enabled";
  const category = service.category || service.categoria;
  return category ? `${service.name || "Servicio sin nombre"} (${category}, ${status})` : `${service.name || "Servicio sin nombre"} (${status})`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servicio-info")
    .setDescription("Muestra la ficha de un servicio del inventario.")
    .addStringOption(option =>
      option
        .setName("nombre")
        .setDescription("Nombre del servicio.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const name = interaction.options.getString("nombre");
    const result = findServiceByName(config, name);
    const service = result.exactMatch || (result.partialMatches.length === 1 ? result.partialMatches[0] : null);

    if (!service && result.partialMatches.length > 1) {
      const matches = result.partialMatches
        .slice(0, 10)
        .map(item => `- ${serviceLabel(item)}`)
        .join("\n");

      await interaction.reply({
        content: `Hay varios servicios que coinciden. Prueba con un nombre mas concreto:\n${matches}`,
        ephemeral: true
      });
      return;
    }

    if (!service) {
      await interaction.reply({
        content: "No se encontro ningun servicio con ese nombre.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(truncate(service.name || "Ficha de servicio", 256))
      .setDescription(formatServiceDetails(service))
      .setColor(service.enabled === false ? 0xf1c40f : Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
