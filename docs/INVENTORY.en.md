# Homelab inventory

The ProxBot inventory is a read-only view over the services defined in
`config.json`.

It helps document what exists in the homelab, where it runs, who owns it and how
to find it from Discord without executing actions against those services.

## What it is

The inventory uses `config.services` as its main source. Each service can include
technical fields such as `host`, `port` and `url`, plus descriptive fields such
as `category`, `owner`, `location`, `notes` and `tags`.

It does not automatically sync services and does not call external APIs.

## Read-only

Inventory commands:

- do not modify `config.json`;
- do not execute SSH;
- do not run network checks;
- do not create or delete services;
- do not call Proxmox, Uptime Kuma or other APIs.

## /inventario

Shows a summary of active homelab services.

Options:

- `tag`: filters by a specific tag.
- `categoria`: filters by `category` or `categoria`.
- `buscar`: searches text in name, description, host, URL, owner, location,
  notes and tags.

Examples:

```text
/inventario
/inventario tag:web
/inventario categoria:infraestructura
/inventario buscar:dns
```

## /servicio-info

Shows the detailed card for one service.

Example:

```text
/servicio-info nombre:Servidor principal
```

It first tries an exact case-insensitive match. If there is no exact match, it
tries partial matches. If several services match, it asks for a more specific
name.

## Service example

```json
{
  "name": "Internal web service",
  "description": "Example local web application",
  "host": "192.168.1.20",
  "port": 3000,
  "url": "http://service.lab",
  "ssh": "ssh user@192.168.1.20",
  "category": "applications",
  "owner": "homelab",
  "location": "main server",
  "notes": "Example service. Do not store secrets here.",
  "enabled": true,
  "check": true,
  "tags": ["web", "internal"]
}
```

## Useful fields

- `category` / `categoria`: logical group, for example `infrastructure`,
  `applications` or `monitoring`.
- `owner`: person, team or context responsible for the service. It should not
  contain sensitive data.
- `location`: physical or logical location, for example `main rack`,
  `main server` or `lab VM`.
- `notes` / `notas`: short notes used to document the service.
- `tags`: list of labels used for filtering and classification.

## Security

Do not store passwords, tokens, private keys or secrets in `config.json`.

The inventory is intended for operational documentation, not for credentials.

## Current limitations

- No Proxmox API.
- No automatic service sync.
- No external change detection.
- No command execution.
- It does not replace a dedicated inventory database.
