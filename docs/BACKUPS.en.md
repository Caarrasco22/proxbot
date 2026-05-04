# Homelab Backups

The `backups` section in ProxBot is a read-only view of the backups defined in
`config.json`.

It documents what is backed up, how often, where it is stored, and when it was
last tested, without executing any actions against the infrastructure.

## What It Is

ProxBot reads `config.backups.items` (or `config.backups` as an undocumented
legacy array) and displays each active entry (`enabled !== false`) as a card in
Discord.

It does not run real backups, restore data, or delete files.

## Read-Only

The backup commands:

- do not modify `config.json`;
- do not run SSH;
- do not access the Proxmox API;
- do not create or delete snapshots or files;
- do not replace a real backup strategy.

## /backups

Shows active homelab backups.

The same summary is also available from the `Backups` button in the main panel
(`/panel`), designed for quick viewing without typing filters.

Options:

- `tag`: filter by a specific tag.
- `buscar` (search): search text in name, description, notes, source, destination
  and method.

Examples:

```text
/backups
/backups tag:backup
/backups buscar:nas
```

## Backup Example

```json
{
  "name": "Configuration backup",
  "description": "Periodic copy of important configurations.",
  "source": "/srv/example/config",
  "destination": "NAS or external drive",
  "frequency": "weekly",
  "method": "manual rsync or external tool",
  "lastTested": "2026-01-01",
  "enabled": true,
  "notes": "Documentary example. ProxBot does not run or restore backups.",
  "tags": ["backup", "config"]
}
```

## Useful Fields

- `name`: visible backup name.
- `description` / `descripcion`: short explanation.
- `source` / `fuente`: data origin.
- `destination` / `destino` / `target`: where the copy is stored.
- `frequency` / `frecuencia`: periodicity (for example, `daily`, `weekly`,
  `monthly`).
- `method` / `metodo`: tool or procedure used.
- `lastTested` / `ultimaPrueba`: date of the last restore test.
- `status` / `estado`: documented status (for example, `ok`, `pending`).
- `notes` / `notas`: additional notes.
- `tags`: labels for filtering.
- `enabled`: if `false`, ignored in views.

## Backup vs Snapshot

- A **backup** is a copy of data in another location, intended for recovery in
  case of loss.
- A **snapshot** is a point-in-time capture of a system's state, usually on the
  same storage.

ProxBot does not create or manage snapshots.

## Security

Do not store passwords, tokens, private keys, or secrets in `config.json`.

The backups module is meant for operational documentation, not for storing
credentials.

## Practical Recommendation

Documenting a backup does not guarantee it works. It is recommended to test
restores periodically and update `lastTested`.

## Current Limitations

- Does not run real backups.
- Does not restore data.
- Does not delete files or snapshots.
- Does not use the Proxmox API.
- Does not run SSH commands.
- Does not replace a backup tool.
