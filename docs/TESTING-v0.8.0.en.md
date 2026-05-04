# ProxBot v0.8.0 Testing Guide

## What Is Being Tested

The optional Proxmox VE read-only integration.

## Before You Start

Have ready:

- An accessible Proxmox VE environment (can be a lab).
- A Proxmox API token with read permissions.
- ProxBot v0.8.0 cloned and `.env` configured.

## 1. Integration Disabled

Configure `config.json`:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": false,
      "url": "",
      "tokenEnv": "PROXMOX_TOKEN"
    }
  }
}
```

Run:

```text
/proxmox estado
```

**Expected:**
- Message: "La integracion Proxmox esta desactivada en config.json."
- Must not make any network request.

## 2. Integration Enabled but No URL

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": ""
    }
  }
}
```

**Expected:**
- Message indicating the URL is missing.

## 3. Integration Enabled but No Token

Make sure `PROXMOX_TOKEN` is not in `.env`.

**Expected:**
- Message indicating the token is missing.
- Must not show the token value.

## 4. Invalid Token

Put a fake token in `.env`:

```env
PROXMOX_TOKEN=PVEAPIToken=invalid
```

**Expected:**
- Generic error message.
- Must not expose internal API details.

## 5. Correct Read-Only Queries

Configure real URL and token from your lab:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": "https://your-proxmox.local:8006",
      "tokenEnv": "PROXMOX_TOKEN"
    }
  }
}
```

Test:

```text
/proxmox estado
/proxmox nodos
/proxmox recursos
```

**Expected:**
- Each command returns an embed with real Proxmox data.
- No start/stop/restart/delete buttons.
- Data is displayed as plain text in embeds.

## 6. Discord Permissions

Add `"proxmox"` to `permissions.protectedCommands` and enable permissions.

Test with a user without the admin role:

```text
/proxmox estado
```

**Expected:**
- Denial message.

## Automated Validations

Run:

```bash
npm run check-config
```

**Expected:** no errors; warnings only if config.json has legitimate warnings.

```bash
node -c index.js
node -c deploy-commands.js
node -c utils/proxmox.js
node -c commands/proxmox.js
```

**Expected:** no syntax errors.

## Do Not

- Do not test start/stop/delete: those commands do not exist.
- Do not expect /proxmox to write to config.json.
- Do not use self-signed certificates without installing the CA on the system.
