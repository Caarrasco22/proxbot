const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const examplePath = path.join(root, "config.example.json");
const configPath = path.join(root, "config.json");

if (!fs.existsSync(examplePath)) {
  console.error("No existe config.example.json.");
  process.exit(1);
}

if (fs.existsSync(configPath)) {
  console.log("config.json ya existe. No se ha sobrescrito.");
  process.exit(0);
}

fs.copyFileSync(examplePath, configPath);
console.log("config.json creado desde config.example.json.");
console.log("Editalo con tus servicios, dominios, SSH, pendientes y checklist.");
