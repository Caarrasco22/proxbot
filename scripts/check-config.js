const { loadConfig } = require("../utils/config");
const { validateConfig } = require("../utils/validateConfig");

const config = loadConfig();
const result = validateConfig(config);

if (result.errors.length > 0) {
  console.error("Errores en config.json:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
}

if (result.warnings.length > 0) {
  console.warn("Avisos en config.json:");
  for (const warning of result.warnings) {
    console.warn(`- ${warning}`);
  }
}

if (!result.valid) {
  process.exit(1);
}

if (result.warnings.length === 0) {
  console.log("config.json parece correcto.");
} else {
  console.log("config.json es valido, pero tiene avisos.");
}
