const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const {
  findServices,
  getInventorySummary,
  formatServiceListItem,
  truncate
} = require("../utils/inventory");

function filtersDescription(filters) {
  const active = [];

  if (filters.tag) {active.push(`tag=${filters.tag}`);}
  if (filters.categoria) {active.push(`categoria=${filters.categoria}`);}
  if (filters.buscar) {active.push(`buscar=${filters.buscar}`);}

  if (active.length === 0) {
    return "Servicios activos definidos en config.json.";
  }

  return `Servicios activos filtrados por: ${active.join(", ")}.`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventario")
    .setDescription("Muestra un resumen del inventario del homelab.")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("Filtra servicios por tag.")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("categoria")
        .setDescription("Filtra servicios por categoria.")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("buscar")
        .setDescription("Busca texto en nombre, descripcion, host, URL, tags o notas.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const filters = {
      tag: interaction.options.getString("tag"),
      categoria: interaction.options.getString("categoria"),
      buscar: interaction.options.getString("buscar")
    };
    const services = findServices(config, filters);

    if (services.length === 0) {
      await interaction.reply({
        content: "No hay servicios activos que coincidan con esos filtros.",
        ephemeral: true
      });
      return;
    }

    const summary = getInventorySummary(config, services);
    const visibleServices = services.slice(0, 25);
    const embed = new EmbedBuilder()
      .setTitle("Inventario del homelab")
      .setDescription(filtersDescription(filters))
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" })
      .addFields({
        name: "Resumen",
        value: [
          `Servicios encontrados: ${summary.total}`,
          `Servicios con URL: ${summary.withUrl}`,
          `Servicios con host: ${summary.withHost}`,
          `Servicios con puerto: ${summary.withPort}`,
          `Servicios con check=true: ${summary.withCheck}`
        ].join("\n"),
        inline: false
      });

    for (const service of visibleServices) {
      embed.addFields({
        name: truncate(service.name || "Servicio sin nombre", 256),
        value: formatServiceListItem(service),
        inline: false
      });
    }

    if (services.length > visibleServices.length) {
      embed.addFields({
        name: "Resultado truncado",
        value: `Se muestran 25 de ${services.length} servicios. Usa filtros para concretar mas.`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
