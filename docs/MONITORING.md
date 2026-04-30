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

Para activar la monitorizacion automatica:

```json
{
  "monitoring": {
    "enabled": true,
    "intervalMinutes": 5,
    "alertChannelId": "123456789012345678",
    "notifyOnlyOnChange": true,
    "runOnStartup": true
  }
}
```

`alertChannelId` debe apuntar a un canal donde el bot pueda enviar mensajes.
`runOnStartup` permite ejecutar una primera comprobacion cuando el bot se
conecta. Si no quieres ese primer ciclo inmediato, dejalo como `false`.

## Como evitar spam

La opcion recomendada es:

```json
"notifyOnlyOnChange": true
```

Con esta opcion, ProxBot solo deberia avisar cuando un check cambie de OK a
FALLO (`FAILED`) o de FALLO a OK (`RECOVERED`). Si un servicio sigue caido
durante varias rondas, no deberia enviar el mismo aviso una y otra vez.

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

## Archivos locales generados

El motor base de monitorizacion usa archivos JSON locales para recordar estado:

- `data/status-cache.json`: estado anterior de los checks para detectar cambios.
- `data/last-diagnostics.json`: ultimo resultado de diagnostico guardado.
- `data/.gitkeep`: archivo vacio para conservar la carpeta `data/` en Git.

`status-cache.json` y `last-diagnostics.json` se generan automaticamente y no
deben subirse a Git. Solo `data/.gitkeep` forma parte del repositorio.

El snapshot guardado en `status-cache.json` contiene una lista simple de checks:

```json
{
  "timestamp": "2026-01-01T10:00:00.000Z",
  "checks": [
    {
      "id": "tcp:Servicio web interno:192.168.1.20:3000",
      "type": "tcp",
      "name": "Servicio web interno",
      "ok": true,
      "message": "Servicio web interno -> 192.168.1.20:3000 23 ms"
    }
  ]
}
```

`last-diagnostics.json` conserva el ultimo resultado completo del ciclo:

```json
{
  "timestamp": "2026-01-01T10:00:00.000Z",
  "results": {},
  "currentState": {},
  "changes": []
}
```

Los cambios detectados pueden ser:

- `NEW`: check nuevo.
- `FAILED`: check que pasa de OK a FALLO.
- `RECOVERED`: check que pasa de FALLO a OK.
- `REMOVED`: check que ya no existe en la configuracion.

Las futuras alertas usaran principalmente `FAILED` y `RECOVERED`.

## Alertas actuales

La integracion actual envia alertas a Discord solo para:

- `FAILED`: un check que antes estaba OK ahora falla.
- `RECOVERED`: un check que antes fallaba ahora esta OK.

`NEW` y `REMOVED` se detectan internamente, pero no se notifican por defecto.

Aunque `notifyOnlyOnChange` sea `false`, ProxBot no envia resumenes periodicos
todavia. El comportamiento actual sigue siendo seguro: solo se notifican cambios
de fallo y recuperacion para evitar spam.

## Comando /monitor

`/monitor` muestra si la monitorizacion automatica esta activa, cada cuanto se
ejecuta, si hay canal de alertas configurado y el ultimo estado guardado.

El comando es solo de lectura: no modifica `config.json`, no activa ni desactiva
la monitorizacion y no muestra IDs completos ni secretos.

## Comando /ultimodiagnostico

`/ultimodiagnostico` muestra el ultimo diagnostico guardado por la monitorizacion
automatica, incluyendo fecha, checks OK y fallos agrupados.

El comando es solo de lectura y usa `data/last-diagnostics.json`. Si todavia no
hay diagnostico guardado, mostrara un aviso claro.

## Limitaciones actuales

- No envia resumenes periodicos.
- No sustituye a Uptime Kuma, Grafana ni Prometheus.
- No incluye GUI web.
- No usa base de datos.
- No ejecuta acciones destructivas.
- No controla Proxmox ni otros servicios externos.

## Proximos pasos de v0.3.0

- Probar la monitorizacion en un servidor real antes de publicar la version.
