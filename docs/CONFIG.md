# Configuracion

ProxBot lee su configuracion desde `config.json`. Ese archivo es local y no debe subirse a Git.

Para crearlo:

```bash
npm run init-config
```

Para revisarlo:

```bash
npm run check-config
```

## bot

Datos visuales del bot:

```json
{
  "name": "ProxBot v.1",
  "brand": "tu-homelab",
  "footer": "ProxBot v.1 - tu-homelab",
  "color": "0x0f4c81"
}
```

- `name`: nombre mostrado en paneles.
- `brand`: texto libre para tu entorno.
- `footer`: pie de los embeds.
- `color`: color base en hexadecimal.

## network

Resumen de red mostrado por `/red` y por el panel:

```json
{
  "title": "Red del homelab",
  "items": [
    {
      "name": "LAN principal",
      "value": "192.168.1.0/24"
    }
  ]
}
```

`items` es una lista libre de pares `name` y `value`.

## diagnostics

Timeouts usados por `/diagnostico`:

```json
{
  "portTimeoutMs": 2000,
  "urlTimeoutMs": 5000
}
```

- `portTimeoutMs`: tiempo maximo para checks TCP.
- `urlTimeoutMs`: tiempo maximo para checks HTTP/HTTPS.

Si no existe esta seccion, ProxBot usa valores por defecto.

## services

Lista principal de servicios:

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

- `name`: nombre visible en Discord.
- `description`: explicacion corta.
- `host`: IP o hostname usado para checks TCP.
- `port`: puerto TCP.
- `url`: enlace para botones y checks HTTP/HTTPS.
- `enabled`: si es `false`, el servicio se ignora en vistas principales.
- `check`: si es `true`, entra en `/diagnostico`.
- `tags`: etiquetas libres para clasificar.

Un servicio puede tener solo `url`, solo `host` y `port`, o ambas cosas.

## domains

Dominios internos:

```json
{
  "name": "servicio.local",
  "target": "Servicio web interno",
  "enabled": true
}
```

- `name`: dominio que se comprobara con DNS.
- `target`: nombre humano del destino.
- `enabled`: si es `false`, se ignora.

## ssh

Comandos mostrados por `/ssh` y el boton SSH:

```json
{
  "name": "Servidor principal",
  "command": "ssh usuario@192.168.1.10",
  "enabled": true
}
```

No guardes claves ni passwords aqui. Solo comandos.

## pending

Lista simple de pendientes:

```json
[
  "Comprobar DNS local",
  "Probar checks de puertos"
]
```

## security

Checklist simple de seguridad:

```json
[
  "No exponer servicios sensibles directamente a Internet",
  "Usar VPN o acceso privado para administrar el homelab"
]
```

## Reglas practicas

- No hardcodees IPs en comandos.
- Si quieres ocultar algo temporalmente, usa `enabled: false`.
- Si un servicio no debe diagnosticarse, usa `check: false`.
- Usa `config.example.json` como plantilla publica y `config.json` como configuracion privada.
