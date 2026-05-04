# Proxmox VE Integration (Read-Only)

ProxBot can connect to a Proxmox VE instance to display node, VM, and
container information in read-only mode.

## What It Is

The Proxmox VE integration is **optional and disabled by default**.
When enabled, ProxBot queries the Proxmox REST API and displays:

- API version and status
- Cluster nodes
- Resources (VMs, CTs, storage)

It does not execute actions: it does not start, stop, restart, delete, or
modify any Proxmox resource.

## Disabled by Default

By default `integrations.proxmox.enabled` is `false`. With this setting, the
`/proxmox` command responds that the integration is disabled and does not make
any external connection.

## Prerequisites

1. Access to the Proxmox VE REST API.
2. A valid API token.
3. ProxBot must be able to reach the Proxmox URL over the network.

## Configuration

### 1. Create an API Token in Proxmox

General steps (may vary depending on your Proxmox version):

1. Log in to Proxmox VE as an administrator.
2. Go to **Datacenter > Permissions > API Tokens**.
3. Click **Add**.
4. Select a user (for example `root@pam` or a dedicated user).
5. Assign a **Token ID** (for example `proxbot`).
6. Disable **Privilege Separation** if you want the token to inherit the user's
   permissions.
7. Copy the **Secret**.

The complete token has this format:

```
PVEAPIToken=user@pve!tokenid=secret
```

**Fictional example:**

```
PVEAPIToken=root@pve!proxbot=abc123def456
```

Save this value in your `.env` file.

### 2. Configure .env

Add or edit in `.env`:

```env
PROXMOX_TOKEN=PVEAPIToken=user@pve!tokenid=secret
```

### 3. Configure config.json

Add the `integrations.proxmox` section:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": "https://proxmox.example.local:8006",
      "tokenEnv": "PROXMOX_TOKEN",
      "realm": "pve",
      "timeoutMs": 5000,
      "rejectUnauthorized": true,
      "cacheTtlSeconds": 60
    }
  }
}
```

### Fields

- `enabled`: enables (`true`) or disables (`false`) the integration.
- `url`: base URL of Proxmox VE, including port (for example
  `https://proxmox.local:8006`).
- `tokenEnv`: name of the environment variable where the token is read.
- `realm`: authentication realm (default `pve`).
- `timeoutMs`: maximum wait time for the API (default `5000`).
- `rejectUnauthorized`: preference reserved for future versions.
  In v0.8.0 ProxBot uses native Node.js `fetch` and TLS validation is
  handled by the operating system / Node.js. Default `true`.
- `cacheTtlSeconds`: in-memory cache TTL (reserved for future versions;
  v0.8.0 does not use persistent cache).

## TLS and Certificates

ProxBot uses native Node.js `fetch`. SSL certificate validation is performed
by Node.js and the operating system.

If you use self-signed certificates in your lab, the recommended option is:

- **Install the CA certificate on the system running ProxBot** or trust it
  at the operating system / Node.js level.

ProxBot **does not** use `NODE_TLS_REJECT_UNAUTHORIZED=0` or global hacks.
The `rejectUnauthorized` field in `config.json` remains as a preference
reserved for future improvements; in v0.8.0 it does not guarantee a bypass
of TLS validation.

## Available Commands

```text
/proxmox estado
/proxmox nodos
/proxmox recursos
```

- `estado`: shows the Proxmox API version.
- `nodos`: lists cluster nodes with CPU, memory, and uptime.
- `recursos`: lists detected VMs, CTs, and storage.

## Discord Permissions

It is recommended to protect `/proxmox` with ProxBot's permission system.
Add `"proxmox"` to `permissions.protectedCommands` in `config.json`.

## Limitations

- Read-only: does not start, stop, restart, or delete resources.
- Does not automatically sync with ProxBot's inventory.
- Does not write local files with Proxmox data.
- Does not work if Proxmox is not accessible from the network where ProxBot
  runs.
- Depends on the token having read permissions on the API.

## Credits

The initial Proxmox API integration idea was proposed by @t0msly3r in PR #2. The v0.8.0 implementation is redesigned to match ProxBot's current philosophy: optional, disabled by default, read-only, no new dependencies, and no destructive actions.

## Troubleshooting

### "The Proxmox integration is disabled"

`integrations.proxmox.enabled` is `false`. Change it to `true` and restart
ProxBot.

### "Proxmox token not found"

The environment variable indicated in `tokenEnv` does not exist or is empty.
Check your `.env`.

### "Timeout connecting to Proxmox"

ProxBot cannot reach the configured URL. Verify:
- that the URL and port are correct;
- that no firewall is blocking the connection;
- that you increase `timeoutMs` if the network is slow.

### "Proxmox responded HTTP 401"

The token is invalid or has expired. Check that the token in `.env` is correct
and that the user has permissions in Proxmox.

### "Proxmox responded HTTP 403"

The token is valid but does not have sufficient permissions. Check the
user/token permissions in Proxmox.

### Self-signed certificate

If Proxmox has a self-signed certificate, the connection may fail because
Node.js validates the certificate against the system's CAs. The recommended
solution is to install the Proxmox CA on the system running ProxBot.

ProxBot does not use `NODE_TLS_REJECT_UNAUTHORIZED=0`. The
`rejectUnauthorized` field in config.json is reserved for future versions.
