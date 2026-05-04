const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const { getActiveMaintenanceTasks, formatMaintenanceItem, truncate, filterMaintenanceTasks } = require("../utils/maintenance");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mantenimiento")
    .setDescription("Muestra tareas de mantenimiento documentadas.")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("Filtra por una etiqueta concreta.")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("buscar")
        .setDescription("Busca texto en nombre, descripcion, notas, objetivo y responsable.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const tasks = getActiveMaintenanceTasks(config);
    const tag = interaction.options.getString("tag");
    const search = interaction.options.getString("buscar");
    const filtered = filterMaintenanceTasks(tasks, tag, search);

    if (filtered.length === 0) {
      const extra = tag || search ? " con los filtros aplicados" : "";
      await interaction.reply({
        content: `No hay tareas de mantenimiento activas documentadas en config.json${extra}. ProxBot solo informa; no cambia nada.`,
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Mantenimiento del homelab")
      .setDescription("Tareas documentadas en config.json. ProxBot solo informa: no ejecuta comandos ni cambia la configuracion del servidor.")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const task of filtered.slice(0, 25)) {
      embed.addFields({
        name: truncate(task.name || "Tarea sin nombre", 256),
        value: formatMaintenanceItem(task),
        inline: false
      });
    }

    if (filtered.length > 25) {
      embed.addFields({
        name: "Resultado truncado",
        value: `Se muestran 25 de ${filtered.length} tareas.`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
