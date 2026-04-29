# ProxBot v.1

ProxBot v.1 es un bot de Discord para homelabs. Sirve como panel, chuleta de red, listado de servicios, accesos SSH y diagnostico basico de DNS, puertos TCP y URLs.

El proyecto esta pensado para que cada persona lo adapte a su propio homelab sin tocar el codigo. Las IPs, dominios, puertos, servicios, comandos SSH, pendientes y checklist de seguridad viven en `config.json`.

## Caracteristicas

- Panel principal con botones de Discord.
- Servicios dinamicos desde `config.json`.
- Dominios internos desde `config.json`.
- Chuleta SSH configurable.
- Diagnostico real:
  - DNS con `dns.lookup()`.
  - Puertos TCP con `net.Socket`.
  - URLs HTTP/HTTPS con `fetch()`.
- Configuracion local fuera de Git.
- Compatible con Node.js, CommonJS, discord.js v14 y dotenv.

## Instalacion rapida

1. Instala dependencias:

```bash
npm install
```

2. Crea tu configuracion local:

```bash
npm run init-config
cp .env.example .env
```

3. Edita `.env` con tus datos de Discord.

4. Edita `config.json` con tus servicios reales.

5. Registra comandos slash:

```bash
npm run deploy
```

6. Arranca el bot:

```bash
npm start
```

## Como anadir servicios

No anadas IPs en `index.js` ni en los comandos. Cada servicio se define en `config.json`:

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

Campos utiles:

- `name`: nombre visible en Discord.
- `description`: texto corto para explicar el servicio.
- `host`: IP o hostname para checks TCP.
- `port`: puerto TCP.
- `url`: enlace usado en panel y check HTTP/HTTPS.
- `enabled`: si es `false`, se oculta o ignora.
- `check`: si es `true`, entra en `/diagnostico`.
- `tags`: etiquetas libres para ordenar mentalmente.

## Archivos privados

Estos archivos no deben subirse a Git:

- `.env`
- `config.json`
- `logs/`
- `node_modules/`

Usa `config.example.json` y `.env.example` como plantillas publicas.

## Git y publicacion

Consulta `docs/GIT.md` para crear el repositorio, hacer el primer commit y publicar el proyecto sin subir configuracion privada.

## Produccion con systemd

Ejemplo de servicio:

```ini
[Unit]
Description=ProxBot v.1
After=network-online.target

[Service]
WorkingDirectory=/opt/proxbot
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Despues:

```bash
sudo systemctl daemon-reload
sudo systemctl enable proxbot
sudo systemctl start proxbot
sudo systemctl status proxbot --no-pager -l
```
