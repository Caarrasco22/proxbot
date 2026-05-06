const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { loadConfig } = require("./config");

function getConfig() {
  return loadConfig();
}

function botColor(config) {
  const color = Number(config.bot?.color || "0x0f4c81");
  return Number.isFinite(color) ? color : 0x0f4c81;
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
    new ButtonBuilder().setCustomId("panel_inventario").setLabel("Inventario").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_diagnostico").setLabel("Diagnostico").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_ssh").setLabel("SSH").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_seguridad").setLabel("Seguridad").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("panel_pendientes").setLabel("Pendientes").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_backups").setLabel("Backups").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_mantenimiento").setLabel("Mantenimiento").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("panel_proxmox_inventario").setLabel("Proxmox").setStyle(ButtonStyle.Secondary)
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

module.exports = {
  buildButtonRows,
  panelRows,
  botColor
};
