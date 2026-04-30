# ProxBot v.1

ProxBot v.1 es un bot de Discord para homelabs. Sirve como panel rapido, listado de servicios, chuleta SSH y herramienta de diagnostico real para redes domesticas, laboratorios y entornos de aprendizaje.

La idea es sencilla: el codigo no conoce tu homelab. Todo lo importante vive en `config.json`: servicios, IPs, dominios, puertos, comandos SSH, pendientes y checklist de seguridad.

## Para quien es

- Personas que tienen un homelab y quieren verlo desde Discord.
- Gente aprendiendo redes, DNS, puertos, servicios internos y administracion basica.
- Usuarios que quieren documentar su laboratorio sin meter IPs a mano dentro del codigo.
- Usuarios con servidores caseros, Raspberry, virtualizacion o servicios self-hosted.

## Que hace

- Muestra un panel principal con botones.
- Lista servicios definidos en `config.json`.
- Muestra IPs, puertos, URLs y tags.
- Lista dominios internos.
- Muestra comandos SSH configurados.
- Guarda y muestra notas simples del homelab.
- Ejecuta diagnostico real:
  - DNS con `dns.lookup()`.
  - Puertos TCP con `net.Socket`.
  - URLs HTTP/HTTPS con `fetch()`.
- Permite botones URL dinamicos para servicios con `url`.

## Que NO es

- No es un sistema de monitorizacion completo.
- No sustituye a herramientas como Uptime Kuma, Grafana o Prometheus.
- No sustituye a un SIEM ni a una herramienta enterprise.
- No instala servicios del homelab por ti.
- No expone ni protege servicios sensibles por si solo.
- No debe guardar tokens, claves privadas ni datos sensibles en el repositorio.

## Requisitos

- Node.js 18 o superior.
- Un bot de Discord creado en el Developer Portal.
- Un servidor de Discord donde registrar los comandos slash.

## Instalacion rapida

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run init-config
```

En Windows PowerShell puedes usar:

```powershell
copy .env.example .env
```

## Configuracion de `.env`

Edita `.env` con tus datos reales:

```env
DISCORD_CLIENT_ID=tu_client_id
DISCORD_GUILD_ID=tu_guild_id
DISCORD_TOKEN=tu_token
CHANNEL_LOGS_ID=tu_canal_de_logs
```

- `DISCORD_TOKEN`: token del bot.
- `DISCORD_CLIENT_ID`: ID de la aplicacion de Discord.
- `DISCORD_GUILD_ID`: ID del servidor donde registrar comandos slash.
- `CHANNEL_LOGS_ID`: canal opcional para reenviar notas de `/log`.

No subas `.env` a Git. Ya esta ignorado en `.gitignore`.

## Configuracion de `config.json`

`npm run init-config` crea `config.json` desde `config.example.json`.

Ejecuta una comprobacion basica:

```bash
npm run check-config
```

Para entender cada seccion, mira [docs/CONFIG.md](docs/CONFIG.md).

## Como anadir servicios

Anade servicios en `config.json`, no en `index.js` ni en los comandos:

```json
{
  "name": "Servicio web interno",
  "description": "Panel o aplicacion local",
  "host": "192.168.1.20",
  "port": 3000,
  "url": "http://servicio.local",
  "enabled": true,
  "check": true,
  "tags": ["web"]
}
```

Si `check` es `true`, el servicio entra en `/diagnostico`.

## Diagnostico

`/diagnostico` y el boton Diagnostico del panel ejecutan la misma comprobacion real:

- `domains`: comprueba DNS con `dns.lookup()`.
- `services` con `check: true`, `host` y `port`: comprueba puerto TCP.
- `services` con `check: true` y `url`: comprueba HTTP/HTTPS.

Los servicios con `enabled: false` se ignoran.

## Comandos disponibles

- `/panel`: panel central con botones.
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
- `/ping`: prueba rapida del bot.
- `/servicios`: listado completo de servicios.
- `/red`: datos de red.

## Registrar comandos slash

Con `.env` configurado:

```bash
npm run deploy
```

Si Discord devuelve `Missing Access`, revisa que el bot este invitado al servidor correcto y que `DISCORD_GUILD_ID` sea el ID de ese servidor.

## Arrancar en local

```bash
npm start
```

Luego usa en Discord:

```text
/panel
/diagnostico
/servicios
/ips
/dominios
/ssh
```

## Produccion con systemd

Hay una guia corta en [docs/SYSTEMD.md](docs/SYSTEMD.md).

Resumen:

```bash
sudo systemctl daemon-reload
sudo systemctl enable proxbot
sudo systemctl start proxbot
sudo systemctl status proxbot --no-pager -l
```

## Archivos privados

No subas estos archivos:

- `.env`
- `config.json`
- `logs/`
- `node_modules/`

Usa estas plantillas publicas:

- `.env.example`
- `config.example.json`

## Capturas

Pendiente de anadir capturas reales:

- `docs/images/panel.png`
- `docs/images/diagnostico.png`

## Troubleshooting

### La aplicacion no ha respondido

Posibles causas:

- El bot esta caido.
- Hay dos instancias usando el mismo token.
- Un comando tarda demasiado o falla antes de responder.
- Hay un error antes de `deferReply()`.

El comando `/diagnostico` y el boton del panel usan `deferReply()`, asi que si falla revisa la consola del bot y que el proceso siga vivo.

### Los dominios `.local` o `.lab` fallan

El bot resuelve DNS desde la maquina donde se ejecuta Node.js. Si corre en un host, VM o LXC, ese sistema debe usar tu DNS local. Comprueba tambien que el dominio existe.

### Cannot find module

Posibles causas: dependencias sin instalar, archivo faltante o ruta incorrecta. Primero ejecuta:

```bash
npm install
```

### Missing Access al registrar comandos

Comprueba:

- `DISCORD_CLIENT_ID` es el ID de la aplicacion.
- `DISCORD_GUILD_ID` es el servidor correcto.
- El bot esta invitado con el scope `applications.commands`.
- El bot tiene permisos suficientes en el servidor.
- Estas usando el token correcto.

## Roadmap

- v0.1.0: configuracion estable y diagnostico real.
- v0.2.0: instalador basico.
- v0.3.0: alertas y canales configurables.
- v0.4.0: interfaz web solo si aporta valor real.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
