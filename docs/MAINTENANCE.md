# Mantenimiento del homelab

La seccion `maintenance` de ProxBot es una vista de solo lectura sobre las
tareas de mantenimiento definidas en `config.json`.

Sirve para documentar que hay que revisar, con que frecuencia, quien es
responsable y cuando se hizo el ultimo check, sin ejecutar acciones sobre la
infraestructura.

## Que es

ProxBot lee `config.maintenance.items` (o `config.maintenance` como array legacy
no documentado) y muestra cada entrada activa (`enabled !== false`) como una
ficha en Discord.

No ejecuta comandos, no reinicia servicios y no cambia la configuracion del
servidor.

## Solo lectura

Los comandos de mantenimiento:

- no modifican `config.json`;
- no ejecutan SSH;
- no acceden a Proxmox API;
- no reinician ni actualizan servicios;
- no sustituyen un calendario de mantenimiento real.

## /mantenimiento

Muestra las tareas de mantenimiento activas del homelab.

El mismo resumen tambien esta disponible desde el boton `Mantenimiento` del
panel principal (`/panel`), pensado para consultar rapido sin escribir filtros.

Opciones:

- `tag`: filtra por una etiqueta concreta.
- `buscar`: busca texto en nombre, descripcion, notas, objetivo y responsable.

Ejemplos:

```text
/mantenimiento
/mantenimiento tag:mensual
/mantenimiento buscar:actualizaciones
```

## Ejemplo de tarea

```json
{
  "name": "Revisar actualizaciones del servidor",
  "description": "Comprobar actualizaciones pendientes y reinicios necesarios.",
  "frequency": "mensual",
  "target": "Servidor principal",
  "owner": "homelab",
  "priority": "media",
  "lastCheck": "2026-01-01",
  "enabled": true,
  "notes": "Ejemplo documental. No ejecuta comandos.",
  "tags": ["mantenimiento", "mensual"]
}
```

## Campos utiles

- `name`: nombre visible de la tarea.
- `description` / `descripcion`: explicacion corta.
- `frequency` / `frecuencia`: periodicidad (por ejemplo, `diaria`, `semanal`,
  `mensual`).
- `target` / `objetivo`: a que servicio o sistema aplica.
- `owner` / `responsable`: persona o equipo responsable.
- `priority` / `prioridad`: prioridad documentada (por ejemplo, `alta`, `media`,
  `baja`).
- `lastCheck` / `ultimoCheck`: fecha del ultimo check realizado.
- `notes` / `notas`: notas adicionales.
- `tags`: etiquetas para filtrar.
- `enabled`: si es `false`, se ignora en las vistas.

## Seguridad

No guardes contrasenas, tokens, claves privadas ni secretos en `config.json`.

El modulo de mantenimiento esta pensado para documentacion operativa, no para
almacenar credenciales.

## Limitaciones actuales

- No ejecuta comandos.
- No reinicia servicios.
- No accede a Proxmox API.
- No ejecuta SSH.
- No sincroniza con calendarios externos.
- No sustituye a un sistema de gestion de tareas.
