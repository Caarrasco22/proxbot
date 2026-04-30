# Monitorizacion automatica

La monitorizacion automatica es la base de ProxBot v0.3.0 para ejecutar
comprobaciones programadas del homelab y enviar alertas controladas a Discord.

Esta primera fase solo prepara la configuracion y la documentacion. Las alertas
automaticas se implementaran en fases posteriores de v0.3.0.

## Que es

La monitorizacion automatica ejecutara comprobaciones de DNS, puertos TCP y URLs
usando la misma configuracion de servicios que ya usa `/diagnostico`.

El objetivo es detectar cambios de estado en servicios importantes sin convertir
Discord en un canal lleno de mensajes repetidos.

## Diferencia entre /diagnostico y monitorizacion automatica

`/diagnostico` es manual: un usuario lo ejecuta cuando quiere revisar el estado
del homelab.

`monitoring` sera automatico: ProxBot ejecutara comprobaciones cada cierto
intervalo cuando este activado en `config.json`.

## Como se configura

La seccion prevista en `config.json` es:

```json
{
  "monitoring": {
    "enabled": false,
    "intervalMinutes": 5,
    "alertChannelId": "",
    "notifyOnlyOnChange": true,
    "runOnStartup": false
  }
}
```

- `enabled`: activa o desactiva la monitorizacion automatica.
- `intervalMinutes`: cada cuantos minutos se ejecutaran las comprobaciones.
- `alertChannelId`: canal de Discord donde se enviaran las alertas.
- `notifyOnlyOnChange`: evita mensajes repetidos si el estado no cambia.
- `runOnStartup`: ejecuta una primera comprobacion al arrancar el bot.

Por seguridad, `enabled` viene como `false` en `config.example.json`.

## Como evitar spam

La opcion recomendada es:

```json
"notifyOnlyOnChange": true
```

Con esta opcion, ProxBot solo deberia avisar cuando un check cambie de OK a
FALLO o de FALLO a OK. Si un servicio sigue caido durante varias rondas, no
deberia enviar el mismo aviso una y otra vez.

## Canal de alertas

`alertChannelId` debe ser el ID de un canal de Discord donde el bot tenga permiso
para leer y enviar mensajes.

Ejemplo:

```json
"alertChannelId": "123456789012345678"
```

No uses tokens, passwords ni datos sensibles en este campo. Solo debe contener
el ID del canal.

## Ejemplo de configuracion

```json
{
  "monitoring": {
    "enabled": false,
    "intervalMinutes": 5,
    "alertChannelId": "",
    "notifyOnlyOnChange": true,
    "runOnStartup": false
  }
}
```

## Archivos internos previstos

En futuras fases de v0.3.0 se preve usar archivos locales para recordar estado:

- `data/status-cache.json`: estado anterior de los checks para detectar cambios.
- `data/last-diagnostics.json`: ultimo resultado de diagnostico guardado.

Estos archivos seran locales y no deberian subirse a Git.

## Limitaciones actuales

- Esta fase no envia alertas reales todavia.
- No sustituye a Uptime Kuma, Grafana ni Prometheus.
- No incluye GUI web.
- No usa base de datos.
- No ejecuta acciones destructivas.
- No controla Proxmox ni otros servicios externos.

## Proximos pasos de v0.3.0

- Crear `utils/monitoring.js`.
- Reutilizar `runDiagnostics(config)` para las comprobaciones programadas.
- Guardar estado anterior para comparar cambios.
- Enviar alertas solo al canal configurado.
- Anadir comandos de consulta como `/monitor` y `/ultimodiagnostico`.
