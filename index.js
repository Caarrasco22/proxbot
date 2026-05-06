require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const { loadConfig } = require("./utils/config");
const {
  canUseCommand,
  canUsePanelCommand,
  protectedCommandMessage,
  panelCommandName
} = require("./utils/permissions");
const {
  accessEmbed,
  redEmbed,
  inventarioEmbed,
  sshEmbed,
  seguridadEmbed,
  pendientesEmbed,
  diagnosticoEmbed,
  backupsEmbed,
  mantenimientoEmbed,
  proxmoxInventarioPanelEmbed
} = require("./utils/embeds");
const { panelRows } = require("./utils/panel");
const { startMonitoring } = require("./utils/monitoring-engine");

if (!process.env.DISCORD_TOKEN) {
  console.error("Falta la variable de entorno: DISCORD_TOKEN");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`El comando ${file} no tiene data o execute.`);
  }
}

function getConfig() {
  return loadConfig();
}

client.once(Events.ClientReady, readyClient => {
  const config = getConfig();

  console.clear();
  console.log(`${config.bot?.name || "ProxBot v.1"} conectado como ${readyClient.user.tag}`);
  console.log("Estado: online");
  console.log("Directorio: /opt/proxbot-dev");
  startMonitoring(readyClient, config);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    const map = {
      panel_accesos: accessEmbed,
      panel_red: redEmbed,
      panel_inventario: inventarioEmbed,
      panel_ssh: sshEmbed,
      panel_seguridad: seguridadEmbed,
      panel_pendientes: pendientesEmbed,
      panel_backups: backupsEmbed,
      panel_mantenimiento: mantenimientoEmbed
    };

    const config = getConfig();

    if (interaction.customId === "panel_diagnostico") {
      if (!canUsePanelCommand(interaction, config, "diagnostico")) {
        await interaction.reply({ content: protectedCommandMessage("diagnostico"), ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [await diagnosticoEmbed()] });
      return;
    }

    if (interaction.customId === "panel_proxmox_inventario") {
      if (!canUsePanelCommand(interaction, config, "proxmox-inventario")) {
        await interaction.reply({ content: protectedCommandMessage("proxmox-inventario"), ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [await proxmoxInventarioPanelEmbed()] });
      return;
    }

    const builder = map[interaction.customId];

    if (!builder) {
      await interaction.reply({ content: "Boton no reconocido.", ephemeral: true });
      return;
    }

    const panelCmd = panelCommandName(interaction.customId);
    if (panelCmd && !canUsePanelCommand(interaction, config, panelCmd)) {
      await interaction.reply({ content: protectedCommandMessage(panelCmd), ephemeral: true });
      return;
    }

    await interaction.reply({
      embeds: [builder()],
      ephemeral: true
    });
    return;
  }

  if (!interaction.isChatInputCommand()) {return;}

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "Ese comando no existe.",
      ephemeral: true
    });
    return;
  }

  const cmdConfig = getConfig();
  if (!canUseCommand(interaction, cmdConfig)) {
    await interaction.reply({
      content: protectedCommandMessage(interaction.commandName),
      ephemeral: true
    });
    return;
  }

  try {
    await command.execute(interaction, { panelRows });
  } catch (error) {
    console.error("Error ejecutando comando:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Ha habido un error al ejecutar el comando.",
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: "Ha habido un error al ejecutar el comando.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
