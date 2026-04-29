const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dominios")
    .setDescription("Muestra dominios internos configurados del homelab."),

  async execute(interaction) {
    const config = loadConfig();

    const domains = (config.domains || []).filter(domain =>
      domain.enabled !== false && domain.name
    );

    if (domains.length === 0) {
      await interaction.reply({
        content: "No hay dominios configurados en config.json.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Dominios internos")
      .setDescription("Dominios definidos en config.json.")
      .setColor(Number(config.bot?.color || "0x0f4c81"))
      .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

    for (const domain of domains.slice(0, 25)) {
      const valueParts = [];

      if (domain.target) {
        valueParts.push(`Destino: ${domain.target}`);
      }

      if (domain.notes) {
        valueParts.push(`Nota: ${domain.notes}`);
      }

      embed.addFields({
        name: domain.name,
        value: valueParts.length > 0 ? valueParts.join("\n") : "Sin detalles extra",
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
