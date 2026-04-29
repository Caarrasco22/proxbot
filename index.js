require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { loadConfig } = require("./utils/config");
const { runDiagnostics, diagnosticsToDescription } = require("./utils/diagnostics");

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

function botColor(config) {
  const color = Number(config.bot?.color || "0x0f4c81");
  return Number.isFinite(color) ? color : 0x0f4c81;
}

function botFooter(config) {
  return config.bot?.footer || config.bot?.name || "ProxBot v.1";
}

function baseEmbed(config, title, description) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(botColor(config))
    .setFooter({ text: botFooter(config) });

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}

function addListFields(embed, items, emptyMessage, namePrefix) {
  if (items.length === 0) {
    embed.setDescription(emptyMessage);
    return embed;
  }

  items.slice(0, 25).forEach((item, index) => {
    embed.addFields({
      name: `${index + 1}. ${namePrefix}`,
      value: item,
      inline: false
    });
  });

  return embed;
}

function accessEmbed() {
  const config = getConfig();
  const services = (config.services || []).filter(service =>
    service.enabled !== false && service.url
  );

  const embed = baseEmbed(
    config,
    "Accesos del homelab",
    services.length > 0
      ? "Servicios con URL definidos en config.json."
      : "No hay servicios con URL configurados en config.json."
  );

  for (const service of services.slice(0, 25)) {
    const valueParts = [];

    if (service.description) valueParts.push(service.description);
    valueParts.push(service.url);
    if (service.host) valueParts.push(`Host: ${service.host}`);
    if (service.port) valueParts.push(`Puerto: ${service.port}`);

    embed.addFields({
      name: service.name || service.url,
      value: valueParts.join("\n"),
      inline: false
    });
  }

  return embed;
}

function redEmbed() {
  const config = getConfig();
  const network = config.network || {};
  const items = (network.items || []).filter(item => item.name && item.value);

  const embed = baseEmbed(
    config,
    network.title || "Red del homelab",
    items.length > 0
      ? "Datos de red definidos en config.json."
      : "No hay datos de red configurados en config.json."
  );

  for (const item of items.slice(0, 25)) {
    embed.addFields({
      name: item.name,
      value: item.value,
      inline: false
    });
  }

  return embed;
}

function sshEmbed() {
  const config = getConfig();
  const sshItems = (config.ssh || []).filter(item =>
    item.enabled !== false && item.name && item.command
  );

  const embed = baseEmbed(
    config,
    "Chuleta SSH",
    sshItems.length > 0
      ? "Comandos definidos en config.json."
      : "No hay comandos SSH configurados en config.json."
  );

  for (const item of sshItems.slice(0, 25)) {
    embed.addFields({
      name: item.name,
      value: `\`${item.command}\``,
      inline: false
    });
  }

  return embed;
}

function seguridadEmbed() {
  const config = getConfig();
  const security = (config.security || []).filter(item =>
    typeof item === "string" && item.trim().length > 0
  );

  return addListFields(
    baseEmbed(config, "Checklist de seguridad"),
    security,
    "No hay puntos de seguridad configurados en config.json.",
    "Seguridad"
  );
}

function pendientesEmbed() {
  const config = getConfig();
  const pending = (config.pending || []).filter(item =>
    typeof item === "string" && item.trim().length > 0
  );

  return addListFields(
    baseEmbed(config, "Pendientes del homelab"),
    pending,
    "No hay pendientes configurados en config.json.",
    "Pendiente"
  );
}

async function diagnosticoEmbed() {
  const config = getConfig();
  const results = await runDiagnostics(config);

  return baseEmbed(config, "Diagnostico del homelab", diagnosticsToDescription(results));
}

function buildButtonRows(buttons) {
  const rows = [];

  for (let index = 0; index < buttons.length && rows.length < 5; index += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(index, index + 5)));
  }

  return rows;
}

function panelRows() {
  const config = getConfig();
  const buttons = [
    new ButtonBuilder().setCustomId("panel_accesos").setLabel("Accesos").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("panel_red").setLabel("Red").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("panel_diagnostico").setLabel("Diagnostico").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_ssh").setLabel("SSH").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_seguridad").setLabel("Seguridad").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("panel_pendientes").setLabel("Pendientes").setStyle(ButtonStyle.Secondary)
  ];

  const urlButtons = (config.services || [])
    .filter(service =>
      service.enabled !== false &&
      typeof service.url === "string" &&
      /^https?:\/\//i.test(service.url)
    )
    .slice(0, 10)
    .map(service =>
      new ButtonBuilder()
        .setLabel((service.name || service.url).slice(0, 80))
        .setStyle(ButtonStyle.Link)
        .setURL(service.url)
    );

  return buildButtonRows([...buttons, ...urlButtons]);
}

client.once(Events.ClientReady, readyClient => {
  const config = getConfig();

  console.clear();
  console.log(`${config.bot?.name || "ProxBot v.1"} conectado como ${readyClient.user.tag}`);
  console.log("Estado: online");
  console.log("Directorio: /opt/proxbot-dev");
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    const map = {
      panel_accesos: accessEmbed,
      panel_red: redEmbed,
      panel_ssh: sshEmbed,
      panel_seguridad: seguridadEmbed,
      panel_pendientes: pendientesEmbed
    };

    if (interaction.customId === "panel_diagnostico") {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply({ embeds: [await diagnosticoEmbed()] });
      return;
    }

    const builder = map[interaction.customId];

    if (!builder) {
      await interaction.reply({ content: "Boton no reconocido.", ephemeral: true });
      return;
    }

    await interaction.reply({
      embeds: [builder()],
      ephemeral: true
    });
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "Ese comando no existe.",
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
