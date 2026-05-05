# ProxBot v.1

[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/built%20with-Discord.js-5865F2.svg)](https://discord.js.org)
[![Version](https://img.shields.io/badge/version-0.9.0-brightgreen.svg)]()

[English version](README.en.md)

ProxBot v.1 es un bot de Discord configurable para homelabs. Sirve como panel rapido, listado de servicios, chuleta SSH, notas simples y herramienta de diagnostico real para redes domesticas, laboratorios y servicios self-hosted.

La idea es sencilla: el codigo no conoce tu homelab. Todo lo importante vive en `config.json`: servicios, IPs, dominios, puertos, comandos SSH, pendientes y checklist de seguridad.

## Para quien es

- Personas con un homelab que quieren verlo desde Discord.
- Usuarios con servidores caseros, Raspberry, virtualizacion o servicios internos.
- Gente aprendiendo redes, DNS, puertos y administracion basica.
- Personas que quieren documentar su infraestructura sin hardcodear IPs en el codigo.

## Que hace

- Panel principal en Discord con botones.
- Listado de servicios, IPs, dominios y comandos SSH.
- Inventario basico del homelab y ficha de servicio desde `config.json`.
- Diagnostico real de DNS, puertos TCP y URLs HTTP/HTTPS.
- Botones URL dinamicos desde `config.json`.
- Notas simples con `/log` y `/verlog`.
- Comando `/status` con informacion basica de instalacion.
- Comando `/monitor` para consultar el estado de la monitorizacion automatica.
- Comando `/ultimodiagnostico` para revisar el ultimo diagnostico guardado.
- Comando `/backups` para documentar backups del homelab.
- Comando `/mantenimiento` para documentar tareas de mantenimiento.
- Permisos basicos configurables por roles de Discord (opcional, desactivado por defecto).
- Comando `/proxmox` para consultar Proxmox VE en modo solo lectura (opcional, desactivado por defecto).
- Instalacion manual o setup guiado con `npm run setup`.
- Instalador opcional para desplegar ProxBot en un LXC Debian desde Proxmox VE.

## Que NO es

- No sustituye a Uptime Kuma, Grafana, Prometheus ni a un SIEM.
- No es una herramienta enterprise.
- No instala ni protege tus servicios self-hosted.
- No debe guardar tokens, passwords ni claves privadas en el repositorio.

## Antes de instalar

Ten preparado:

1. Cuenta de Discord.
2. Servidor de Discord donde puedas invitar bots.
3. Aplicacion creada en [Discord Developer Portal](https://discord.com/developers/applications).
4. `DISCORD_TOKEN`.
5. `DISCORD_CLIENT_ID`.
6. `DISCORD_GUILD_ID`.
7. `CHANNEL_LOGS_ID` opcional.
8. Lista de servicios que quieres anadir.
9. Para cada servicio: nombre, IP/host, puerto, URL, SSH, dominio local y si entra en diagnostico.
10. DNS local funcionando si usas dominios `.lab`, `.local` o similares.
11. Permisos en Linux si vas a usar `scripts/install.sh` o systemd.

## Instalacion rapida

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run setup
```

En Windows PowerShell:

```powershell
copy .env.example .env
npm.cmd install
npm.cmd run setup
```

Si prefieres hacerlo manualmente:

```bash
npm run init-config
```

Luego edita `.env` y `config.json`.

### Diferencia entre instalacion manual, setup e install.sh

- `npm run init-config`: solo copia `config.example.json` a `config.json` si no existe.
- `npm run setup`: asistente interactivo para crear o actualizar `.env` y `config.json` con backups.
- `scripts/install.sh`: instalador para Debian/Ubuntu; instala paquetes, clona en `/opt/proxbot`, puede ejecutar setup, deploy y crear systemd.

## Crear aplicacion en Discord Developer Portal

1. Entra en [Discord Developer Portal](https://discord.com/developers/applications).
2. Pulsa **New Application**.
3. Pon un nombre, por ejemplo `ProxBot`.
4. Entra en la aplicacion creada.

### Crear bot y obtener `DISCORD_TOKEN`

1. Entra en **Bot**.
2. Crea el bot si Discord lo pide.
3. Copia o resetea el token.
4. Pegalo en `.env`:

```env
DISCORD_TOKEN=tu_token
```

El token es secreto. No lo compartas, no lo subas a GitHub y no lo pegues en capturas.

### Obtener `DISCORD_CLIENT_ID`

1. Entra en **General Information**.
2. Copia **Application ID**. Tambien puede aparecer como **Client ID** en OAuth2.
3. Pegalo en `.env`:

```env
DISCORD_CLIENT_ID=tu_client_id
```

### Obtener `DISCORD_GUILD_ID`

`Guild ID` es el ID del servidor donde se registran los comandos slash.

1. En Discord, ve a **Ajustes de usuario > Avanzado**.
2. Activa **Modo desarrollador**.
3. Clic derecho en tu servidor.
4. Pulsa **Copiar ID**.
5. Pegalo en `.env`:

```env
DISCORD_GUILD_ID=tu_guild_id
```

### Obtener `CHANNEL_LOGS_ID`

Es opcional. Sirve para que `/log` mande notas a un canal concreto.

1. Crea un canal, por ejemplo `homelab-logs`.
2. Con modo desarrollador activado, clic derecho sobre el canal.
3. Pulsa **Copiar ID**.
4. Pegalo en `.env`:

```env
CHANNEL_LOGS_ID=tu_canal_de_logs
```

Si no quieres usarlo:

```env
CHANNEL_LOGS_ID=
```

### Ejemplo completo de `.env`

```env
DISCORD_TOKEN=tu_token
DISCORD_CLIENT_ID=tu_client_id
DISCORD_GUILD_ID=tu_guild_id
CHANNEL_LOGS_ID=tu_canal_de_logs
```

## Invitar el bot al servidor

En Discord Developer Portal, entra en **OAuth2 > OAuth2 URL Generator**.

Scopes:

```text
bot
applications.commands
```

Permisos minimos recomendados:

```text
Send Messages
Use Slash Commands
Embed Links
Read Message History
```

Copia la URL generada, abrela en el navegador y autoriza el bot en tu servidor.

## Configurar `config.json`

Puedes usar:

```bash
npm run setup
```

O crearlo desde la plantilla:

```bash
npm run init-config
```

Despues edita `config.json` con tus servicios reales y revisa:

```bash
npm run check-config
```

Mas detalles en [docs/CONFIG.md](docs/CONFIG.md). Hay ejemplos en [docs/examples](docs/examples).

## Inventario

El inventario tambien esta disponible desde el boton `Inventario` de `/panel`.
`/inventario` y `/servicio-info` muestran documentacion de servicios desde
`config.json` en modo solo lectura. No ejecutan comandos, no hacen checks de red
y no llaman a APIs externas.

Guia completa: [docs/INVENTORY.md](docs/INVENTORY.md).

## Backups y mantenimiento

Los backups y las tareas de mantenimiento estan disponibles desde los botones
`Backups` y `Mantenimiento` de `/panel`.

`/backups` y `/mantenimiento` muestran documentacion operativa desde
`config.json` en modo solo lectura. No ejecutan backups reales, no restauran
datos, no reinician servicios y no llaman a APIs externas.

Guias completas:
[docs/BACKUPS.md](docs/BACKUPS.md) y
[docs/MAINTENANCE.md](docs/MAINTENANCE.md).

## Diagnostico

`/diagnostico` y el boton Diagnostico del panel ejecutan la misma comprobacion real:

- `domains`: comprueba DNS con `dns.lookup()`.
- `services` con `check: true`, `host` y `port`: comprueba puerto TCP.
- `services` con `check: true` y `url`: comprueba HTTP/HTTPS.

Los timeouts se pueden ajustar en `config.json`:

```json
"diagnostics": {
  "portTimeoutMs": 2000,
  "urlTimeoutMs": 5000
}
```

## Comandos disponibles

- `/panel`: panel central.
- `/status`: estado basico de ProxBot.
- `/monitor`: estado de la monitorizacion automatica.
- `/ultimodiagnostico`: ultimo diagnostico guardado por monitoring.
- `/inventario`: resumen filtrable del inventario del homelab.
- `/servicio-info`: ficha detallada de un servicio.
- `/ips`: servicios con host configurado.
- `/dominios`: dominios definidos en config.
- `/ssh`: chuleta SSH.
- `/diagnostico`: diagnostico DNS/TCP/HTTP.
- `/checkdns`: comprueba un dominio concreto.
- `/checkpuerto`: comprueba un puerto TCP concreto.
- `/checkurl`: comprueba una URL concreta.
- `/log`: guarda una nota.
- `/verlog`: muestra ultimas notas.
- `/seguridad`: checklist de seguridad.
- `/pendientes`: lista de pendientes.
- `/ping`: prueba rapida.
- `/backups`: backups documentados del homelab.
- `/mantenimiento`: tareas de mantenimiento documentadas.
- `/proxmox`: consulta Proxmox VE en modo solo lectura (opcional).
- `/proxmox-inventario`: inventario detectado desde Proxmox VE, con cache local opcional (solo lectura).
- `/servicios`: listado completo de servicios.
- `/red`: datos de red.

## Capturas

### Panel principal

Vista rapida con accesos, red, diagnostico, SSH, seguridad, inventario Proxmox y servicios con URL.

![Panel principal de ProxBot](docs/images/proxbot-panel.png)

### Estado del bot

Resumen de version, Node.js, plataforma, servicios, dominios y checks activos.

![Estado de ProxBot](docs/images/proxbot-status.png)

### Diagnostico manual

Resultado de `/diagnostico` con comprobaciones DNS, puertos TCP y URLs.

![Diagnostico manual de ProxBot](docs/images/proxbot-diagnostics.png)

### Monitorizacion automatica

Resultado de `/monitor` con el estado de la monitorizacion automatica, checks guardados y ultimo diagnostico.

![Monitorizacion automatica de ProxBot](docs/images/proxbot-monitoring.png)

### Ultimo diagnostico guardado

Resultado de `/ultimodiagnostico` con fallos agrupados por DNS, TCP y URLs.

![Ultimo diagnostico guardado de ProxBot](docs/images/proxbot-last-diagnostics.png)

## Registrar comandos slash

Con `.env` configurado:

```bash
npm run deploy
```

En Windows si PowerShell bloquea `npm`:

```powershell
npm.cmd run deploy
```

## Arrancar en local

```bash
npm start
```

Prueba en Discord:

```text
/status
/monitor
/ultimodiagnostico
/panel
/diagnostico
```

## Instalacion guiada en Debian/Ubuntu

En un servidor Debian/Ubuntu limpio puedes usar:

```bash
sudo bash scripts/install.sh
```

El instalador instala paquetes, clona o actualiza `/opt/proxbot`, puede ejecutar `npm run setup`, registrar comandos y crear systemd. Guia completa: [docs/INSTALL.md](docs/INSTALL.md).

## Instalacion en Proxmox/LXC

Si usas Proxmox VE, puedes crear un LXC Debian nuevo y preparar ProxBot dentro
del contenedor con:

```bash
sudo bash scripts/proxmox-lxc-install.sh --dry-run
sudo bash scripts/proxmox-lxc-install.sh
```

Guia completa: [docs/PROXMOX-LXC-INSTALL.md](docs/PROXMOX-LXC-INSTALL.md).
Guia de pruebas: [docs/TESTING-v0.5.0.md](docs/TESTING-v0.5.0.md).
Usa `--help` para ver opciones. Este instalador no usa Proxmox API ni tokens de
Proxmox, no borra CTs si algo falla y no arranca el bot por defecto hasta que
configures `.env`.

## Produccion con systemd

Consulta [docs/SYSTEMD.md](docs/SYSTEMD.md).

Comandos utiles:

```bash
sudo systemctl status proxbot --no-pager -l
sudo journalctl -u proxbot -f -l
sudo systemctl restart proxbot
```

## Archivos privados

No subas:

- `.env`
- `config.json`
- `logs/`
- `node_modules/`
- backups `*.backup-*`

## Troubleshooting

### La aplicacion no ha respondido

Posibles causas: bot caido, dos instancias con el mismo token, error antes de responder o un comando que tarda demasiado.

### Missing Access al registrar comandos

Comprueba que el bot esta invitado al servidor correcto y que usaste el scope `applications.commands`.

### Los comandos slash no aparecen

Ejecuta `npm run deploy`, revisa `DISCORD_GUILD_ID` y espera unos segundos a que Discord refresque.

### Los dominios `.lab` fallan

El bot resuelve DNS desde la maquina donde se ejecuta Node.js. Esa maquina debe usar tu DNS local.

### Cannot find module

Ejecuta:

```bash
npm install
```

## Versiones del proyecto

| Version | Estado | Enfoque |
|--------|--------|---------|
| v0.1.0 | Publicada | Base configurable, panel y diagnostico manual |
| v0.2.0 | Publicada | Setup guiado, instalador y `/status` |
| v0.3.0 | Publicada | Monitorizacion automatica y alertas sin spam |
| v0.4.0 | Publicada | Inventario basico del homelab |
| v0.5.0 | Publicada | Instalador Proxmox/LXC |
| v0.6.0 | Publicada | Backups y mantenimiento documental |
| v0.7.0 | Publicada | Permisos basicos por roles de Discord |
| v0.8.0 | Publicada | Integracion Proxmox VE solo lectura |
| v0.9.0 | En desarrollo | Inventario detectado desde Proxmox VE |

### v0.1.0 - Base configurable

Funcionalidades añadidas:

- Bot de Discord funcional con comandos slash.
- Configuracion mediante `config.json`.
- Plantilla publica `config.example.json`.
- Panel principal con `/panel`.
- Comandos para servicios, IPs, dominios, SSH, red, pendientes y seguridad.
- Diagnostico manual con `/diagnostico`.
- Checks manuales con `/checkdns`, `/checkpuerto` y `/checkurl`.
- Logs/notas con `/log` y `/verlog`.
- Documentacion inicial.
- Licencia MIT.

### v0.2.0 - Instalacion guiada y documentacion

Funcionalidades añadidas:

- `npm run setup` para crear `.env` y `config.json` de forma guiada.
- `scripts/install.sh` para instalacion en Debian/Ubuntu.
- Comando `/status`.
- Timeouts configurables para diagnostico.
- Documentacion bilingue espanol/ingles.
- `README.en.md`.
- `docs/INSTALL.md` y `docs/INSTALL.en.md`.
- Ejemplos de `config.json`.
- Guias de systemd y Git.
- Release notes.

### v0.3.0 - Monitorizacion automatica

Estado: publicada.

Funcionalidades añadidas:

- Seccion `monitoring` en `config.json`.
- Motor interno de monitorizacion.
- Archivos locales `data/status-cache.json` y `data/last-diagnostics.json`.
- Alertas automaticas cuando un check pasa de OK a fallo.
- Alertas de recuperacion cuando un check vuelve a OK.
- Proteccion anti-spam con `notifyOnlyOnChange`.
- Comando `/monitor`.
- Comando `/ultimodiagnostico`.
- Documentacion de monitorizacion en [docs/MONITORING.md](docs/MONITORING.md).

### v0.4.0 - Inventario del homelab

Estado: publicada.

Funcionalidades añadidas:

- Utilidad interna `utils/inventory.js`.
- Comando `/inventario`.
- Comando `/servicio-info`.
- Campos opcionales de inventario en servicios: `category`, `owner`,
  `location` y `notes`.
- Documentacion de inventario en [docs/INVENTORY.md](docs/INVENTORY.md).

### v0.5.0 - Instalador Proxmox/LXC

Estado: publicada.

Funcionalidades añadidas:

- Script `scripts/proxmox-lxc-install.sh`.
- Modo `--dry-run`.
- Modo default y advanced.
- Creacion conservadora de LXC Debian desde host Proxmox VE.
- Instalacion de ProxBot y systemd dentro del contenedor.
- Documentacion en [docs/PROXMOX-LXC-INSTALL.md](docs/PROXMOX-LXC-INSTALL.md).

### v0.6.0 - Backups y mantenimiento documental

Estado: en desarrollo.

Funcionalidades anadidas:

- Utilidad interna `utils/maintenance.js`.
- Comando `/backups` con filtros por `tag` y `buscar`.
- Comando `/mantenimiento` con filtros por `tag` y `buscar`.
- Botones `Backups` y `Mantenimiento` en `/panel`.
- Campos de backups y mantenimiento en `config.json`.
- Documentacion en [docs/BACKUPS.md](docs/BACKUPS.md) y
  [docs/MAINTENANCE.md](docs/MAINTENANCE.md).

### v0.7.0 - Permisos basicos por roles de Discord

Estado: en desarrollo.

Funcionalidades anadidas:

- Utilidad interna `utils/permissions.js`.
- Seccion `permissions` en `config.json` con `enabled`, `adminRoleIds` y
  `protectedCommands`.
- Comprobacion de permisos antes de ejecutar comandos slash y botones de panel.
- Documentacion en [docs/PERMISSIONS.md](docs/PERMISSIONS.md).

### v0.8.0 - Integracion Proxmox VE solo lectura

Estado: publicada.

Funcionalidades anadidas:

- Utilidad interna `utils/proxmox.js`.
- Comando `/proxmox` con opciones `estado`, `nodos` y `recursos`.
- Seccion `integrations.proxmox` en `config.json`.
- Token de Proxmox leido desde variable de entorno.
- Documentacion en [docs/PROXMOX-READONLY.md](docs/PROXMOX-READONLY.md).

### v0.9.0 - Inventario detectado desde Proxmox VE

Estado: en desarrollo.

Funcionalidades anadidas:

- Comando `/proxmox-inventario` con opciones `ver` y `cache`.
- Utilidades de cache local en `utils/proxmox.js`: `getProxmoxInventoryResources`, `readInventoryCache`, `writeInventoryCache`.
- Cache local opcional en `data/proxmox-inventory-cache.json`, ignorada por Git.
- Solo lectura: no modifica `config.json` ni el inventario manual.
- Documentacion en [docs/PROXMOX-INVENTORY.md](docs/PROXMOX-INVENTORY.md).

## Proximos pasos

- Mantener el proyecto simple, configurable y sin dependencias especificas obligatorias.
- Valorar integraciones externas solo cuando puedan ser opcionales, seguras y bien documentadas.
- Preparar futuras versiones: mejoras en cache, filtros adicionales o sincronizacion manual guiada.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
