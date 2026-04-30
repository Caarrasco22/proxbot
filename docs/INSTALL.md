# Instalacion guiada

Esta guia cubre tres formas de instalar ProxBot:

- instalacion manual;
- setup guiado con `npm run setup`;
- instalador Debian/Ubuntu con `scripts/install.sh`.

## Antes de instalar

Ten preparado:

- cuenta de Discord;
- servidor donde puedas invitar bots;
- aplicacion creada en Discord Developer Portal;
- `DISCORD_TOKEN`;
- `DISCORD_CLIENT_ID`;
- `DISCORD_GUILD_ID`;
- `CHANNEL_LOGS_ID` opcional;
- lista de servicios que quieres anadir;
- IP/host/puerto/URL de cada servicio;
- DNS local funcionando si usas dominios internos;
- permisos de administrador si vas a instalar en `/opt/proxbot`.

## Instalacion manual

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run init-config
```

Despues:

1. edita `.env`;
2. edita `config.json`;
3. ejecuta `npm run check-config`;
4. ejecuta `npm run deploy`;
5. arranca con `npm start`.

Esta ruta es la mas transparente: tu controlas cada archivo.

## Setup guiado

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

Usa esta ruta si quieres crear `.env` y `config.json` paso a paso.

## Diferencias entre comandos

- `npm run init-config`: solo copia `config.example.json` a `config.json` si no existe.
- `npm run setup`: pregunta datos y genera `.env`/`config.json` con backups.
- `scripts/install.sh`: instala dependencias del sistema, prepara `/opt/proxbot`, puede ejecutar setup, deploy y crear systemd.

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
- si reinstala con backup, mueve la instalacion anterior a `/opt/proxbot-backup-YYYYMMDD-HHMMSS`;
- exige escribir `SOBRESCRIBIR` antes de borrar `/opt/proxbot`;
- puede ejecutar `npm run setup`;
- puede ejecutar `npm run deploy`;
- puede crear `proxbot.service` para systemd.

## Que NO hace install.sh

- No soporta oficialmente Windows, Arch, Fedora, Alpine, Synology, Unraid ni Docker.
- No configura Discord Developer Portal por ti.
- No crea tokens.
- No imprime `.env`.
- No muestra secretos.
- No garantiza una version moderna de Node si tu repositorio apt ofrece una version antigua.

## Evitar sobrescribir una instalacion existente

Si `/opt/proxbot` ya existe, el instalador pregunta:

1. actualizar con `git pull`;
2. hacer backup y reinstalar;
3. sobrescribir con confirmacion fuerte;
4. cancelar.

La opcion segura es actualizar o cancelar. No sobrescribas si tienes dudas.

## Probar sin systemd

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

Para parar el bot en terminal, usa `Ctrl+C`.

## Probar con systemd

Si creaste el servicio:

```bash
sudo systemctl status proxbot --no-pager -l
sudo journalctl -u proxbot -f -l
```

Reiniciar:

```bash
sudo systemctl restart proxbot
```

Parar:

```bash
sudo systemctl stop proxbot
```

## Actualizar ProxBot

Si instalaste en `/opt/proxbot`:

```bash
cd /opt/proxbot
git pull
npm install
npm run check-config
sudo systemctl restart proxbot
```

Si cambian comandos slash:

```bash
npm run deploy
```

## Logs

Con systemd:

```bash
sudo journalctl -u proxbot -f -l
```

Sin systemd, revisa la terminal donde ejecutaste `npm start`.

Mas detalles de systemd en [SYSTEMD.md](SYSTEMD.md).
