# Inventory Detected from Proxmox VE

ProxBot can display a structured summary of VMs and containers (CTs) detected
in Proxmox VE, without modifying the manual inventory or `config.json`.

## What It Is

The `/proxmox-inventario` command queries the Proxmox VE API and shows:

- Total number of detected resources.
- How many are VMs (`qemu`) and how many are CTs (`lxc`).
- Name, status, node, VMID, memory, and disk for each resource.

It is **read-only** and **does not modify `config.json`**.

## Prerequisites

- The Proxmox integration must be enabled and configured. See
  [docs/PROXMOX-READONLY.en.md](PROXMOX-READONLY.en.md) for setup steps.
- The Proxmox VE API token must have read permissions.

## Available Commands

```text
/proxmox-inventario
/proxmox-inventario accion:View from Proxmox
/proxmox-inventario accion:Show local cache
```

- `ver` (default): queries Proxmox in real time, displays the summary, and
  updates the local cache if `inventoryCachePath` is configured.
- `cache`: displays the last saved cache without calling Proxmox.

You can also access it from the main panel (`/panel`) with the **Proxmox**
button.

## Local Cache

If you configure `inventoryCachePath` in `config.json`, ProxBot saves the last
Proxmox response in a local JSON file. This allows querying the inventory
without repeating API calls.

Example configuration:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": "https://proxmox.example.local:8006",
      "tokenEnv": "PROXMOX_TOKEN",
      "inventoryCachePath": "data/proxmox-inventory-cache.json"
    }
  }
}
```

The cache file:

- Is generated automatically when using `/proxmox-inventario ver`.
- Is ignored by Git (`.gitignore`).
- May contain real VM/CT names: do not push it to the repository.
- Does not contain tokens or credentials.

## If the Proxmox Call Fails

If `/proxmox-inventario ver` cannot connect to Proxmox but a valid local cache
exists, ProxBot will display the cached data with a notice that it is outdated.

If there is no cache, it will respond with a generic error without sensitive
details.

## Discord Permissions

It is recommended to protect `/proxmox-inventario` with ProxBot's permission
system. Add `"proxmox-inventario"` to `permissions.protectedCommands` in
`config.json`.

## Limitations

- Only shows resources of type `qemu` and `lxc`. Storage is not included.
- Does not modify `config.json` or sync with the manual inventory.
- Does not execute actions on resources (start, stop, reboot, delete).
- The list is truncated to 20 resources per response.
