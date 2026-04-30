const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { validateConfig } = require("../utils/validateConfig");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const configPath = path.join(root, "config.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

function timestamp() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join("") + "-" + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const backupPath = `${filePath}.backup-${timestamp()}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

async function confirm(question, defaultValue = false) {
  const suffix = defaultValue ? "[S/n]" : "[s/N]";
  const answer = (await ask(`${question} ${suffix} `)).toLowerCase();

  if (!answer) return defaultValue;
  return answer === "s" || answer === "si" || answer === "sí" || answer === "y" || answer === "yes";
}

async function chooseExistingFileAction(label) {
  console.log(`\n${label} ya existe.`);
  console.log("1) Mantenerlo");
  console.log("2) Recrearlo haciendo backup");
  console.log("3) Cancelar setup");

  const answer = await ask("Elige una opcion [1]: ");

  if (!answer || answer === "1") return "keep";
  if (answer === "2") return "recreate";
  return "cancel";
}

async function handleExistingFile(filePath, label) {
  if (!fs.existsSync(filePath)) return "create";

  const action = await chooseExistingFileAction(label);

  if (action === "cancel") {
    console.log("Setup cancelado. No se han hecho cambios en este archivo.");
    process.exit(0);
  }

  if (action === "recreate") {
    const backupPath = backupFile(filePath);
    console.log(`Backup creado: ${path.basename(backupPath)}`);
    return "create";
  }

  return "keep";
}

async function askWithDefault(question, defaultValue) {
  const answer = await ask(`${question} [${defaultValue}]: `);
  return answer || defaultValue;
}

async function askOptional(question) {
  return ask(`${question} (opcional): `);
}

function parsePort(value) {
  if (!value) return undefined;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.log("Puerto ignorado: debe ser un numero entre 1 y 65535.");
    return undefined;
  }

  return port;
}

function parseTags(value) {
  if (!value) return undefined;

  const tags = value
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? tags : undefined;
}

async function createEnv() {
  console.log("\nConfiguracion de .env");
  console.log("El token es secreto. No lo compartas, no lo subas a GitHub y no lo pegues en capturas.");
  console.log("Aviso: sin dependencias externas, el token puede verse mientras lo escribes en terminal.");

  const token = await ask("DISCORD_TOKEN: ");
  const clientId = await ask("DISCORD_CLIENT_ID / Application ID: ");
  const guildId = await ask("DISCORD_GUILD_ID / Server ID: ");
  const logsChannelId = await askOptional("CHANNEL_LOGS_ID");

  const content = [
    `DISCORD_TOKEN=${token}`,
    `DISCORD_CLIENT_ID=${clientId}`,
    `DISCORD_GUILD_ID=${guildId}`,
    `CHANNEL_LOGS_ID=${logsChannelId}`,
    ""
  ].join("\n");

  fs.writeFileSync(envPath, content, "utf8");
}

async function createConfig() {
  console.log("\nConfiguracion de config.json");

  const botName = await askWithDefault("Nombre del bot", "ProxBot v.1");
  const footer = await askWithDefault("Marca/footer", "ProxBot v.1 - caarrasco.dev");
  const color = await askWithDefault("Color embed", "0x0f4c81");
  const networkName = await askWithDefault("Nombre de red principal", "LAN principal");
  const networkRange = await askWithDefault("Rango de red", "192.168.1.0/24");
  const router = await askWithDefault("Router/gateway", "192.168.1.1");
  const serviceCountRaw = await askWithDefault("Cuantos servicios quieres anadir ahora", "0");
  const serviceCount = Math.max(0, Number.parseInt(serviceCountRaw, 10) || 0);

  const services = [];
  const domains = [];
  const ssh = [];

  for (let index = 0; index < serviceCount; index += 1) {
    console.log(`\nServicio ${index + 1}/${serviceCount}`);

    let name = "";
    while (!name) {
      name = await ask("Nombre del servicio (obligatorio): ");
    }

    const description = await askOptional("Descripcion");
    const host = await askOptional("Host/IP/dominio");
    const port = parsePort(await askOptional("Puerto"));
    const url = await askOptional("URL");
    const sshCommand = await askOptional("Comando SSH");
    const localDomain = await askOptional("Dominio local asociado");
    const enabled = await confirm("Activar este servicio?", true);
    const check = await confirm("Incluir este servicio en /diagnostico?", false);
    const tags = parseTags(await askOptional("Tags separados por comas"));

    if (check && !url && !(host && port)) {
      console.log("Aviso: este servicio esta marcado para diagnostico, pero no tiene puerto ni URL.");
      console.log("Solo se podra diagnosticar si anades al menos uno.");
    }

    const service = { name, enabled, check };
    if (description) service.description = description;
    if (host) service.host = host;
    if (port) service.port = port;
    if (url) service.url = url;
    if (sshCommand) service.ssh = sshCommand;
    if (tags) service.tags = tags;
    services.push(service);

    if (localDomain) {
      domains.push({
        name: localDomain,
        target: name,
        enabled: true
      });
    }

    if (sshCommand) {
      ssh.push({
        name,
        command: sshCommand,
        enabled: true
      });
    }
  }

  const config = {
    bot: {
      name: botName,
      brand: footer,
      footer,
      color
    },
    network: {
      title: "Red del homelab",
      items: [
        { name: networkName, value: networkRange },
        { name: "Router", value: router }
      ]
    },
    diagnostics: {
      portTimeoutMs: 2000,
      urlTimeoutMs: 5000
    },
    services,
    domains,
    ssh,
    pending: [
      "Revisar config.json y anadir servicios reales si faltan",
      "Ejecutar /diagnostico desde Discord",
      "Revisar DNS local si usas dominios internos"
    ],
    security: [
      "No exponer servicios sensibles directamente a Internet",
      "Usar VPN o acceso privado para administrar el homelab",
      "Mantener copias de seguridad antes de tocar servicios importantes"
    ]
  };

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function summarize() {
  let config = null;
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
      config = null;
    }
  }

  if (config) {
    const validation = validateConfig(config);
    if (validation.errors.length > 0) {
      console.log("\nErrores de config:");
      validation.errors.forEach(error => console.log(`- ${error}`));
    }

    if (validation.warnings.length > 0) {
      console.log("\nAvisos de config:");
      validation.warnings.forEach(warning => console.log(`- ${warning}`));
    }
  }

  const services = config?.services || [];
  const domains = config?.domains || [];
  const ssh = config?.ssh || [];
  const checks = services.filter(service =>
    service.check === true && (service.url || (service.host && service.port))
  );

  console.log("\nResumen:");
  console.log(`- .env existe: ${fs.existsSync(envPath) ? "si" : "no"}`);
  console.log(`- config.json existe: ${fs.existsSync(configPath) ? "si" : "no"}`);
  console.log(`- Servicios: ${services.length}`);
  console.log(`- Dominios: ${domains.length}`);
  console.log(`- SSH: ${ssh.length}`);
  console.log(`- Checks activos: ${checks.length}`);

  console.log("\nProximos pasos:");
  console.log("npm run check-config");
  console.log("npm run deploy");
  console.log("npm start");
}

async function main() {
  console.log("ProxBot setup guiado");
  console.log("\nAntes de continuar, ten preparado:");
  console.log("- Token del bot de Discord");
  console.log("- Client ID / Application ID");
  console.log("- Guild ID / Server ID");
  console.log("- Canal de logs opcional");
  console.log("- Numero de servicios que quieres anadir");
  console.log("- Datos de cada servicio: nombre, host, puerto, URL, SSH, dominio y diagnostico");

  const ready = await confirm("\nTienes estos datos preparados?", false);
  if (!ready) {
    console.log("\nConsulta README.md o docs/INSTALL.md y vuelve a ejecutar `npm run setup`.");
    rl.close();
    return;
  }

  const envAction = await handleExistingFile(envPath, ".env");
  if (envAction === "create") {
    await createEnv();
  } else {
    console.log(".env mantenido.");
  }

  const configAction = await handleExistingFile(configPath, "config.json");
  if (configAction === "create") {
    await createConfig();
  } else {
    console.log("config.json mantenido.");
  }

  summarize();
  rl.close();
}

main().catch(error => {
  console.error("Error en setup:", error.message);
  rl.close();
  process.exit(1);
});
