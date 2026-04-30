# Instalacion guiada

Esta guia cubre la instalacion manual y el instalador basico para Debian/Ubuntu.

## Antes de instalar

Ten preparado:

- Cuenta de Discord.
- Servidor donde puedas invitar bots.
- Aplicacion creada en Discord Developer Portal.
- `DISCORD_TOKEN`.
- `DISCORD_CLIENT_ID`.
- `DISCORD_GUILD_ID`.
- `CHANNEL_LOGS_ID` opcional.
- Lista de servicios que quieres anadir.
- IP/host/puerto/URL de cada servicio.
- DNS local funcionando si usas dominios internos.
- Permisos de administrador si vas a instalar en `/opt/proxbot`.

## Instalacion manual

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run setup
npm run check-config
```

Si prefieres no usar el asistente:

```bash
npm run init-config
```

Despues edita `.env` y `config.json`.

## Setup guiado

Ejecuta:

```bash
npm run setup
```

El asistente:

- muestra una checklist previa;
- crea o mantiene `.env`;
- crea o mantiene `config.json`;
- pregunta antes de sobrescribir;
- crea backups `*.backup-YYYYMMDD-HHMMSS`;
- no imprime el token al final;
- permite anadir servicios, dominios y comandos SSH.

## Instalador Debian/Ubuntu

En un servidor limpio:

```bash
sudo bash scripts/install.sh
```

El instalador:

- comprueba Debian/Ubuntu de forma basica;
- instala `git`, `curl`, `ca-certificates`, `nano`, `nodejs` y `npm`;
- clona o actualiza `/opt/proxbot`;
- pregunta antes de sobrescribir;
- puede ejecutar `npm run setup`;
- puede ejecutar `npm run deploy`;
- puede crear `proxbot.service` para systemd.

No esta pensado oficialmente para Windows, Arch, Fedora, Alpine, Synology, Unraid ni Docker.

## Despues de instalar

```bash
npm run check-config
npm run deploy
npm start
```

En Discord:

```text
/status
/panel
/diagnostico
```

## systemd

Si creaste el servicio:

```bash
sudo systemctl status proxbot --no-pager -l
sudo journalctl -u proxbot -f -l
sudo systemctl restart proxbot
sudo systemctl stop proxbot
```

Mas detalles en [SYSTEMD.md](SYSTEMD.md).
