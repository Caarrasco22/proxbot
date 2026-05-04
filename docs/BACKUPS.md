# Backups del homelab

La seccion `backups` de ProxBot es una vista de solo lectura sobre las copias de
seguridad definidas en `config.json`.

Sirve para documentar que se hace backup, con que frecuencia, donde se guarda y
cuando se probó por ultima vez, sin ejecutar acciones sobre la infraestructura.

## Que es

ProxBot lee `config.backups.items` (o `config.backups` como array legacy no
documentado) y muestra cada entrada activa (`enabled !== false`) como una ficha
en Discord.

No ejecuta backups reales, no restaura datos y no borra ficheros.

## Solo lectura

Los comandos de backups:

- no modifican `config.json`;
- no ejecutan SSH;
- no acceden a Proxmox API;
- no crean ni borran snapshots ni archivos;
- no sustituyen una estrategia real de backups.

## /backups

Muestra los backups activos del homelab.

El mismo resumen tambien esta disponible desde el boton `Backups` del panel
principal (`/panel`), pensado para consultar rapido sin escribir filtros.

Opciones:

- `tag`: filtra por una etiqueta concreta.
- `buscar`: busca texto en nombre, descripcion, notas, fuente, destino y metodo.

Ejemplos:

```text
/backups
/backups tag:backup
/backups buscar:nas
```

## Ejemplo de backup

```json
{
  "name": "Backup de configuraciones",
  "description": "Copia periodica de configuraciones importantes.",
  "source": "/srv/example/config",
  "destination": "NAS o disco externo",
  "frequency": "semanal",
  "method": "rsync manual o herramienta externa",
  "lastTested": "2026-01-01",
  "enabled": true,
  "notes": "Ejemplo documental. ProxBot no ejecuta ni restaura backups.",
  "tags": ["backup", "config"]
}
```

## Campos utiles

- `name`: nombre visible del backup.
- `description` / `descripcion`: explicacion corta.
- `source` / `fuente`: origen de los datos.
- `destination` / `destino` / `target`: donde se guarda la copia.
- `frequency` / `frecuencia`: periodicidad (por ejemplo, `diaria`, `semanal`,
  `mensual`).
- `method` / `metodo`: herramienta o procedimiento usado.
- `lastTested` / `ultimaPrueba`: fecha de la ultima prueba de restauracion.
- `status` / `estado`: estado documentado (por ejemplo, `ok`, `pendiente`).
- `notes` / `notas`: notas adicionales.
- `tags`: etiquetas para filtrar.
- `enabled`: si es `false`, se ignora en las vistas.

## Backup vs snapshot

- Un **backup** es una copia de datos en otro lugar, pensada para recuperarse
  ante perdida.
- Un **snapshot** es una instantanea del estado de un sistema en un momento
  dado, normalmente en el mismo storage.

ProxBot no crea ni gestiona snapshots.

## Seguridad

No guardes contrasenas, tokens, claves privadas ni secretos en `config.json`.

El modulo de backups esta pensado para documentacion operativa, no para
almacenar credenciales.

## Recomendacion practica

Documentar un backup no garantiza que funcione. Se recomienda probar
periodicamente la restauracion y actualizar `lastTested`.

## Limitaciones actuales

- No ejecuta backups reales.
- No restaura datos.
- No borra archivos ni snapshots.
- No usa Proxmox API.
- No ejecuta comandos SSH.
- No sustituye a una herramienta de backups.
