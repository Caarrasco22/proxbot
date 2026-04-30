# Produccion con systemd

Esta guia muestra una forma simple de ejecutar ProxBot como servicio en Linux.

Tambien puedes dejar que `scripts/install.sh` cree el servicio por ti en Debian/Ubuntu.

## 1. Preparar el proyecto

Ejemplo usando `/opt/proxbot`:

```bash
cd /opt/proxbot
npm install --omit=dev
npm run init-config
cp .env.example .env
```

Edita `.env` y `config.json` antes de arrancar.

## 2. Crear servicio

Crea `/etc/systemd/system/proxbot.service`:

```ini
[Unit]
Description=ProxBot Discord Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/proxbot
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ajusta `WorkingDirectory` si instalaste el bot en otra ruta.

## 3. Activar servicio

```bash
sudo systemctl daemon-reload
sudo systemctl enable proxbot
sudo systemctl start proxbot
```

## 4. Ver estado

```bash
sudo systemctl status proxbot --no-pager -l
```

## 5. Ver logs

```bash
sudo journalctl -u proxbot -f
```

Con lineas completas:

```bash
sudo journalctl -u proxbot -f -l
```

Ultimas lineas:

```bash
sudo journalctl -u proxbot -n 100 --no-pager -l
```

## 6. Reiniciar tras cambios

```bash
sudo systemctl restart proxbot
```

Si cambias comandos slash, registra de nuevo:

```bash
npm run deploy
```
