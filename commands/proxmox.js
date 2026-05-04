const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const {
  isProxmoxEnabled,
  getProxmoxUrl,
  getProxmoxToken,
  getProxmoxVersion,
  getProxmoxNodes,
  getProxmoxResources
} = require("../utils/proxmox");

function truncate(text, maxLength = 256) {
  const str = String(text || "");
  if (str.length <= maxLength) return str;
  return `${str.slice(0, Math.max(maxLength - 3, 0))}...`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("proxmox")
    .setDescription("Consulta informacion de Proxmox VE (solo lectura).")
    .addStringOption(option =>
      option
        .setName("accion")
        .setDescription("Que informacion quieres consultar.")
        .setRequired(true)
        .addChoices(
          { name: "Estado", value: "estado" },
          { name: "Nodos", value: "nodos" },
          { name: "Recursos", value: "recursos" }
        )
    ),

  async execute(interaction) {
    const config = loadConfig();

    if (!isProxmoxEnabled(config)) {
      await interaction.reply({
        content: "La integracion Proxmox esta desactivada en config.json.",
        ephemeral: true
      });
      return;
    }

    if (!getProxmoxUrl(config)) {
      await interaction.reply({
        content: "La URL de Proxmox no esta configurada en config.json (`integrations.proxmox.url`).",
        ephemeral: true
      });
      return;
    }

    const token = getProxmoxToken(config);

    if (!token) {
      const tokenEnv = config.integrations?.proxmox?.tokenEnv || "PROXMOX_TOKEN";
      await interaction.reply({
        content: `Token de Proxmox no encontrado en la variable de entorno \`${tokenEnv}\`. Revisa tu archivo .env.`,
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const action = interaction.options.getString("accion");
      const embed = new EmbedBuilder()
        .setColor(Number(config.bot?.color || "0x0f4c81"))
        .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

      if (action === "estado") {
        const version = await getProxmoxVersion(config);

        if (!version) {
          await interaction.editReply({
            content: "No se pudo obtener el estado de Proxmox.",
            ephemeral: true
          });
          return;
        }

        embed
          .setTitle("Estado de Proxmox VE")
          .setDescription("Informacion de la API de Proxmox. Solo lectura.");

        embed.addFields({
          name: "Version",
          value: String(version.version || "Desconocida"),
          inline: false
        });

        if (version.release) {
          embed.addFields({
            name: "Release",
            value: String(version.release),
            inline: false
          });
        }

        if (version.repoid) {
          embed.addFields({
            name: "Repo ID",
            value: String(version.repoid),
            inline: false
          });
        }
      } else if (action === "nodos") {
        const nodes = await getProxmoxNodes(config);

        embed
          .setTitle("Nodos de Proxmox VE")
          .setDescription(`Nodos detectados: ${nodes.length}. Solo lectura.`);

        if (nodes.length === 0) {
          embed.addFields({
            name: "Nodos",
            value: "No se encontraron nodos o la API devolvio una lista vacia.",
            inline: false
          });
        } else {
          for (const node of nodes.slice(0, 20)) {
            const lines = [
              `Estado: ${node.status || "desconocido"}`,
              node.cpu !== undefined ? `CPU: ${(node.cpu * 100).toFixed(1)}%` : null,
              node.maxcpu !== undefined ? `Cores: ${node.maxcpu}` : null,
              node.mem !== undefined && node.maxmem !== undefined
                ? `Memoria: ${formatBytes(node.mem)} / ${formatBytes(node.maxmem)}`
                : null,
              node.uptime !== undefined ? `Uptime: ${formatUptime(node.uptime)}` : null
            ].filter(Boolean);

            embed.addFields({
              name: truncate(node.node || "Nodo sin nombre", 256),
              value: lines.join("\n") || "Sin detalles.",
              inline: false
            });
          }

          if (nodes.length > 20) {
            embed.addFields({
              name: "Resultado truncado",
              value: `Se muestran 20 de ${nodes.length} nodos.`,
              inline: false
            });
          }
        }
      } else if (action === "recursos") {
        const resources = await getProxmoxResources(config);
        const filtered = resources.filter(r =>
          r.type === "lxc" || r.type === "qemu" || r.type === "vm" || r.type === "storage"
        );

        embed
          .setTitle("Recursos de Proxmox VE")
          .setDescription(`Recursos detectados: ${filtered.length}. Solo lectura.`);

        if (filtered.length === 0) {
          embed.addFields({
            name: "Recursos",
            value: "No se encontraron VMs, CTs ni storage en el cluster.",
            inline: false
          });
        } else {
          for (const res of filtered.slice(0, 20)) {
            const lines = [
              `Tipo: ${res.type || "desconocido"}`,
              res.status ? `Estado: ${res.status}` : null,
              res.node ? `Nodo: ${res.node}` : null,
              res.vmid !== undefined ? `VMID: ${res.vmid}` : null,
              res.maxmem !== undefined ? `Memoria max: ${formatBytes(res.maxmem)}` : null,
              res.maxdisk !== undefined ? `Disco max: ${formatBytes(res.maxdisk)}` : null
            ].filter(Boolean);

            embed.addFields({
              name: truncate(res.name || `Recurso ${res.vmid || "sin ID"}`, 256),
              value: lines.join("\n") || "Sin detalles.",
              inline: false
            });
          }

          if (filtered.length > 20) {
            embed.addFields({
              name: "Resultado truncado",
              value: `Se muestran 20 de ${filtered.length} recursos.`,
              inline: false
            });
          }
        }
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error en /proxmox:", error.message);

      await interaction.editReply({
        content: "No se pudo consultar Proxmox. Revisa la configuracion, la conectividad de red y que el token sea valido. No se muestran detalles de error por seguridad.",
        ephemeral: true
      });
    }
  }
};

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return "N/A";
  const num = Number(bytes);
  if (!Number.isFinite(num) || num < 0) return "N/A";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = num;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatUptime(seconds) {
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "< 1m";
}
