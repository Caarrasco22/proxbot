const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const {
  isProxmoxEnabled,
  getProxmoxUrl,
  getProxmoxToken,
  getProxmoxInventoryResources,
  readInventoryCache,
  writeInventoryCache
} = require("../utils/proxmox");

function truncate(text, maxLength = 256) {
  const str = String(text || "");
  if (str.length <= maxLength) {return str;}
  return `${str.slice(0, Math.max(maxLength - 3, 0))}...`;
}

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) {return "N/A";}
  const num = Number(bytes);
  if (!Number.isFinite(num) || num < 0) {return "N/A";}

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = num;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function buildResourceLines(res) {
  const lines = [
    `Tipo: ${res.type || "desconocido"}`,
    res.status ? `Estado: ${res.status}` : null,
    res.node ? `Nodo: ${res.node}` : null,
    res.vmid !== undefined ? `VMID: ${res.vmid}` : null,
    res.maxmem !== undefined ? `Memoria max: ${formatBytes(res.maxmem)}` : null,
    res.maxdisk !== undefined ? `Disco max: ${formatBytes(res.maxdisk)}` : null
  ].filter(Boolean);

  return lines.join("\n") || "Sin detalles.";
}

function buildInventoryEmbed(config, resources, options = {}) {
  const { fromCache = false, cacheTime = null, fallback = false } = options;

  const embed = new EmbedBuilder()
    .setTitle("Inventario detectado desde Proxmox VE")
    .setColor(Number(config.bot?.color || "0x0f4c81"))
    .setFooter({ text: config.bot?.footer || "ProxBot v.1" });

  const disclaimer = "Solo lectura. No modifica config.json.";
  const vmCount = resources.filter(r => r.type === "qemu").length;
  const ctCount = resources.filter(r => r.type === "lxc").length;

  if (fallback) {
    embed.setDescription(`No se pudo consultar Proxmox. Mostrando datos de cache.\n${disclaimer}`);
  } else if (fromCache) {
    const timeLabel = cacheTime ? `Ultima actualizacion: ${cacheTime}` : "Fuente: cache local";
    embed.setDescription(`${timeLabel}\n${disclaimer}`);
  } else {
    embed.setDescription(`Recursos detectados en tiempo real.\n${disclaimer}`);
  }

  embed.addFields({
    name: "Resumen",
    value: [
      `Recursos detectados: ${resources.length}`,
      `VMs (qemu): ${vmCount}`,
      `CTs (lxc): ${ctCount}`
    ].join("\n"),
    inline: false
  });

  if (resources.length === 0) {
    embed.addFields({
      name: "Recursos",
      value: "No se encontraron VMs ni CTs en el cluster.",
      inline: false
    });
    return embed;
  }

  for (const res of resources.slice(0, 20)) {
    embed.addFields({
      name: truncate(res.name || `Recurso ${res.vmid || "sin ID"}`, 256),
      value: buildResourceLines(res),
      inline: false
    });
  }

  if (resources.length > 20) {
    embed.addFields({
      name: "Resultado truncado",
      value: `Se muestran 20 de ${resources.length} recursos.`,
      inline: false
    });
  }

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("proxmox-inventario")
    .setDescription("Muestra el inventario detectado desde Proxmox VE (solo lectura).")
    .addStringOption(option =>
      option
        .setName("accion")
        .setDescription("Que informacion mostrar.")
        .setRequired(false)
        .addChoices(
          { name: "Ver desde Proxmox", value: "ver" },
          { name: "Mostrar cache local", value: "cache" }
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

    const action = interaction.options.getString("accion") || "ver";

    if (action === "cache") {
      const cached = readInventoryCache(config);

      if (!cached) {
        await interaction.reply({
          content: "No hay cache de inventario Proxmox disponible.",
          ephemeral: true
        });
        return;
      }

      const embed = buildInventoryEmbed(config, cached.resources, {
        fromCache: true,
        cacheTime: cached.timestamp
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const resources = await getProxmoxInventoryResources(config);
      writeInventoryCache(config, resources);

      const embed = buildInventoryEmbed(config, resources, { fromCache: false });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error en /proxmox-inventario:", error.message);

      const cached = readInventoryCache(config);

      if (cached) {
        const embed = buildInventoryEmbed(config, cached.resources, {
          fromCache: true,
          cacheTime: cached.timestamp,
          fallback: true
        });
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: "No se pudo consultar Proxmox y no hay cache disponible. Revisa la configuracion, la conectividad de red y que el token sea valido.",
          ephemeral: true
        });
      }
    }
  }
};
