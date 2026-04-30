const fs = require("fs");
const path = require("path");

function loadConfig() {
  const configPath = path.join(__dirname, "..", "config.json");

  if (!fs.existsSync(configPath)) {
    console.error("No existe config.json. Ejecuta npm run init-config y editalo.");
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error leyendo o parseando config.json:");
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { loadConfig };
