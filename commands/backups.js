const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const { getActiveBackups, formatBackupItem, truncate, filterBackups } = require("../utils/maintenance");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("backups")
    .setDescription("Muestra backups documentados del homelab.")
    .addStringOption(option =>
      option
        .setName("tag")
        .setDescription("Filtra por una etiqueta concreta.")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("buscar")
        .setDescription("Busca texto en nombre, descripcion, notas, fuente, destino y metodo.")
        .setRequired(false)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const backups = getActiveBackups(config);
    const tag = interaction.options.getString("tag");
    const search = interaction.options.getString("buscar");
    const filtered = filterBackups(backups, tag, search);

    if (filtered.length === 0) {
      const extra = tag || search ? " con los filtros aplicados" : "";
      await interaction.reply({
        content: `No hay backups activos documentados en config.json${extra}. ProxBot solo documenta backups; no ejecuta ni restaura nada.`,
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Backups del homelab")
      .setDescription("Backups documentados en config.json. ProxBot solo informa: no ejecuta backups, no restaura y no borra nada.")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const backup of filtered.slice(0, 25)) {
      embed.addFields({
        name: truncate(backup.name || "Backup sin nombre", 256),
        value: formatBackupItem(backup),
        inline: false
      });
    }

    if (filtered.length > 25) {
      embed.addFields({
        name: "Resultado truncado",
        value: `Se muestran 25 de ${filtered.length} backups.`,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
