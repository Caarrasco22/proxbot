# Homelab Maintenance

The `maintenance` section in ProxBot is a read-only view of the maintenance
tasks defined in `config.json`.

It documents what needs to be checked, how often, who is responsible, and when
the last check was done, without executing any actions against the
infrastructure.

## What It Is

ProxBot reads `config.maintenance.items` (or `config.maintenance` as an
undocumented legacy array) and displays each active entry (`enabled !== false`)
as a card in Discord.

It does not run commands, restart services, or change server configuration.

## Read-Only

The maintenance commands:

- do not modify `config.json`;
- do not run SSH;
- do not access the Proxmox API;
- do not restart or update services;
- do not replace a real maintenance calendar.

## /mantenimiento

Shows active homelab maintenance tasks.

The same summary is also available from the `Mantenimiento` button in the main
panel (`/panel`), designed for quick viewing without typing filters.

Options:

- `tag`: filter by a specific tag.
- `buscar` (search): search text in name, description, notes, target and owner.

Examples:

```text
/mantenimiento
/mantenimiento tag:mensual
/mantenimiento buscar:actualizaciones
```

## Task Example

```json
{
  "name": "Check server updates",
  "description": "Check pending updates and required reboots.",
  "frequency": "monthly",
  "target": "Main server",
  "owner": "homelab",
  "priority": "medium",
  "lastCheck": "2026-01-01",
  "enabled": true,
  "notes": "Documentary example. Does not run commands.",
  "tags": ["maintenance", "monthly"]
}
```

## Useful Fields

- `name`: visible task name.
- `description` / `descripcion`: short explanation.
- `frequency` / `frecuencia`: periodicity (for example, `daily`, `weekly`,
  `monthly`).
- `target` / `objetivo`: which service or system it applies to.
- `owner` / `responsable`: responsible person or team.
- `priority` / `prioridad`: documented priority (for example, `high`, `medium`,
  `low`).
- `lastCheck` / `ultimoCheck`: date of the last check performed.
- `notes` / `notas`: additional notes.
- `tags`: labels for filtering.
- `enabled`: if `false`, ignored in views.

## Security

Do not store passwords, tokens, private keys, or secrets in `config.json`.

The maintenance module is meant for operational documentation, not for storing
credentials.

## Current Limitations

- Does not run commands.
- Does not restart services.
- Does not access the Proxmox API.
- Does not run SSH.
- Does not sync with external calendars.
- Does not replace a task management system.
