const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Comprueba si el bot responde."),

  async execute(interaction) {
    await interaction.reply("Pong. El bot esta vivo.");
  }
};
