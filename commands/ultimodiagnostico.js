const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadConfig } = require("../utils/config");
const { loadLastDiagnostics } = require("../utils/monitoring");

const lastDiagnosticsPath = path.join(__dirname, "..", "data", "last-diagnostics.json");

function formatDate(value) {
  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "medium"
  });
}

function normalizeCheck(type, check) {
  if (!check || typeof check !== "object") {
    return null;
  }

  if (type === "dns") {
    const detail = check.ok ? check.address : check.error || "sin respuesta";
    return {
      type,
      name: check.name || "DNS",
      ok: Boolean(check.ok),
      message: `${check.name || "DNS"} -> ${detail}`
    };
  }

  if (type === "tcp") {
    const target = check.host && check.port ? `${check.host}:${check.port}` : "sin destino";
    const detail = check.ok ? `${check.ms} ms` : check.error || "sin respuesta";
    return {
      type,
      name: check.name || target,
      ok: Boolean(check.ok),
      message: `${check.name || target} -> ${target} ${detail}`
    };
  }

  if (type === "url") {
    const detail = check.status ? `HTTP ${check.status} (${check.ms} ms)` : check.error || "sin respuesta";
    return {
      type,
      name: check.name || check.url || "URL",
      ok: Boolean(check.ok),
      message: `${check.name || check.url || "URL"} -> ${check.url || "sin URL"} ${detail}`
    };
  }

  return {
    type: check.type || "other",
    name: check.name || "Check",
    ok: Boolean(check.ok),
    message: check.message || check.name || "Sin detalle"
  };
}

function getChecksFromPayload(payload) {
  if (payload?.currentState && Array.isArray(payload.currentState.checks)) {
    return payload.currentState.checks;
  }

  const results = payload?.results;

  if (!results || typeof results !== "object") {
    return [];
  }

  return [
    ...(results.dnsResults || results.dns || []).map(check => normalizeCheck("dns", check)),
    ...(results.portResults || results.ports || []).map(check => normalizeCheck("tcp", check)),
    ...(results.urlResults || results.urls || []).map(check => normalizeCheck("url", check))
  ].filter(Boolean);
}

function groupFailedChecks(checks) {
  return checks
    .filter(check => check.ok === false)
    .reduce((groups, check) => {
      const type = ["dns", "tcp", "url"].includes(check.type) ? check.type : "other";
      groups[type].push(check);
      return groups;
    }, {
      dns: [],
      tcp: [],
      url: [],
      other: []
    });
}

function truncateList(items, max) {
  const visible = items.slice(0, max);
  const remaining = Math.max(items.length - visible.length, 0);

  return {
    visible,
    remaining
  };
}

function failureLines(title, items, max) {
  if (items.length === 0) {
    return [];
  }

  const { visible, remaining } = truncateList(items, max);
  const lines = [`**${title}**`];

  for (const item of visible) {
    lines.push(`- ${item.message || item.name}`);
  }

  if (remaining > 0) {
    lines.push(`Y ${remaining} fallo(s) mas...`);
  }

  return lines;
}

function failuresDescription(checks) {
  const failed = checks.filter(check => check.ok === false);

  if (failed.length === 0) {
    return "Ultimo diagnostico sin fallos detectados.";
  }

  const groups = groupFailedChecks(checks);
  const lines = [
    ...failureLines("DNS fallidos", groups.dns, 3),
    ...failureLines("Puertos TCP fallidos", groups.tcp, 3),
    ...failureLines("URLs fallidas", groups.url, 3),
    ...failureLines("Otros fallos", groups.other, 2)
  ];

  return lines.join("\n");
}

function diagnosticsCounts(payload, checks) {
  const results = payload?.results || {};
  const total = Number(results.total ?? results.summary?.total);
  const ok = Number(results.okCount ?? results.summary?.ok);
  const failed = Number(results.failCount ?? results.summary?.failed);

  if (
    Number.isFinite(total) &&
    Number.isFinite(ok) &&
    Number.isFinite(failed)
  ) {
    return { total, ok, failed };
  }

  return {
    total: checks.length,
    ok: checks.filter(check => check.ok === true).length,
    failed: checks.filter(check => check.ok === false).length
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ultimodiagnostico")
    .setDescription("Muestra el ultimo diagnostico guardado por ProxBot."),

  async execute(interaction) {
    const config = loadConfig();
    const payload = loadLastDiagnostics();
    const fileExists = fs.existsSync(lastDiagnosticsPath);
    const embed = new EmbedBuilder()
      .setTitle("Ultimo diagnostico guardado")
      .setFooter({ text: config.bot?.footer || "ProxBot" });

    if (!payload) {
      embed
        .setColor(0xf1c40f)
        .setDescription(fileExists
          ? "No se pudo leer el ultimo diagnostico guardado."
          : "Todavia no hay un diagnostico guardado. Ejecuta /diagnostico o activa monitoring.runOnStartup.");

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const checks = getChecksFromPayload(payload);

    if (checks.length === 0) {
      embed
        .setColor(0xf1c40f)
        .setDescription("El ultimo diagnostico existe, pero no contiene checks interpretables.")
        .addFields({
          name: "Fecha/hora",
          value: formatDate(payload.timestamp),
          inline: false
        });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const counts = diagnosticsCounts(payload, checks);

    embed
      .setColor(counts.failed > 0 ? 0xe74c3c : 0x2ecc71)
      .addFields(
        {
          name: "Estado general",
          value: [
            `Fecha/hora: ${formatDate(payload.timestamp)}`,
            `Total checks: ${counts.total}`,
            `Checks OK: ${counts.ok}`,
            `Checks fallidos: ${counts.failed}`
          ].join("\n"),
          inline: false
        },
        {
          name: "Fallos destacados",
          value: failuresDescription(checks),
          inline: false
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
