const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dns = require("dns").promises;
const { loadConfig } = require("../utils/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkdns")
    .setDescription("Comprueba a que IP resuelve un dominio.")
    .addStringOption(option =>
      option
        .setName("dominio")
        .setDescription("Dominio a resolver")
        .setRequired(true)
    ),

  async execute(interaction) {
    const config = loadConfig();
    const dominio = interaction.options.getString("dominio");

    await interaction.deferReply();

    try {
      const result = await dns.lookup(dominio);

      const embed = new EmbedBuilder()
        .setTitle("Check DNS")
        .setColor(0x2ecc71)
        .addFields(
          { name: "Dominio", value: dominio, inline: true },
          { name: "IP resuelta", value: result.address, inline: true },
          { name: "Familia", value: `IPv${result.family}`, inline: true }
        )
        .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle("Check DNS")
        .setColor(0xe74c3c)
        .addFields(
          { name: "Dominio", value: dominio, inline: true },
          { name: "Resultado", value: "No resuelve", inline: true },
          { name: "Error", value: String(error.code || error.message), inline: false }
        )
        .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

      await interaction.editReply({ embeds: [embed] });
    }
  }
};
