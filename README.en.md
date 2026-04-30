# ProxBot v.1

[Spanish version](README.md)

ProxBot v.1 is a configurable Discord bot for homelabs. It works as a quick Discord panel, service inventory, SSH cheat sheet, simple notes tool, and real diagnostic helper for home networks and self-hosted services.

The core idea is simple: the code does not know your homelab. Services, IPs, domains, ports, SSH commands, pending tasks, and security notes live in `config.json`.

## Who It Is For

- Homelab users who want a Discord-based control panel.
- People running small servers, Raspberry boards, virtualization hosts, or internal services.
- Users learning networking, DNS, TCP ports, and basic administration.
- Anyone who wants to document their infrastructure without hardcoding values in code.

## What It Does

- Provides a main Discord panel with buttons.
- Lists services, IPs, domains, and SSH commands.
- Provides a basic homelab inventory and service cards from `config.json`.
- Runs real DNS, TCP port, and HTTP/HTTPS diagnostics.
- Generates URL buttons from `config.json`.
- Stores simple notes with `/log` and `/verlog`.
- Shows installation status with `/status`.
- Shows automatic monitoring status with `/monitor`.
- Shows the latest saved diagnostics with `/ultimodiagnostico`.
- Supports guided setup with `npm run setup`.

## What It Is Not

- It is not a replacement for Uptime Kuma, Grafana, Prometheus, or a SIEM.
- It is not an enterprise monitoring platform.
- It does not install or secure your self-hosted services.
- It must not store tokens, passwords, or private keys in the repository.

## Before You Install

Prepare:

1. A Discord account.
2. A Discord server where you can invite bots.
3. A Discord Developer Portal application.
4. `DISCORD_TOKEN`.
5. `DISCORD_CLIENT_ID`.
6. `DISCORD_GUILD_ID`.
7. Optional `CHANNEL_LOGS_ID`.
8. A list of services you want to add.
9. For each service: name, IP/host, port, URL, SSH command, local domain, and whether it should be diagnosed.
10. Working local DNS if you use `.lab`, `.local`, or similar domains.
11. Linux permissions if you plan to use `scripts/install.sh` or systemd.

## Quick Install

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run setup
```

On Windows PowerShell:

```powershell
copy .env.example .env
npm.cmd install
npm.cmd run setup
```

Manual alternative:

```bash
npm run init-config
```

Then edit `.env` and `config.json`.

### Manual Install vs Setup vs install.sh

- `npm run init-config`: only copies `config.example.json` to `config.json` if it does not exist.
- `npm run setup`: interactive assistant to create or update `.env` and `config.json` with backups.
- `scripts/install.sh`: Debian/Ubuntu installer; installs packages, clones into `/opt/proxbot`, can run setup, deploy commands, and create systemd.

## Discord Developer Portal Setup

1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Name it, for example `ProxBot`.
4. Open the created application.

### Create the Bot and Get `DISCORD_TOKEN`

1. Open **Bot**.
2. Create the bot if Discord asks for it.
3. Copy or reset the token.
4. Put it in `.env`:

```env
DISCORD_TOKEN=your_token
```

The token is secret. Do not share it, do not push it to GitHub, and do not paste it in screenshots.

### Get `DISCORD_CLIENT_ID`

1. Open **General Information**.
2. Copy **Application ID**. In OAuth2 it may also appear as **Client ID**.
3. Put it in `.env`:

```env
DISCORD_CLIENT_ID=your_client_id
```

### Get `DISCORD_GUILD_ID`

`Guild ID` means the Discord server ID where slash commands are registered.

1. In Discord, open **User Settings > Advanced**.
2. Enable **Developer Mode**.
3. Right-click your server.
4. Click **Copy ID**.
5. Put it in `.env`:

```env
DISCORD_GUILD_ID=your_guild_id
```

### Get `CHANNEL_LOGS_ID`

This is optional. It lets `/log` send notes to a specific channel.

```env
CHANNEL_LOGS_ID=your_logs_channel_id
```

If you do not want it:

```env
CHANNEL_LOGS_ID=
```

### Complete `.env` Example

```env
DISCORD_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
CHANNEL_LOGS_ID=your_logs_channel_id
```

## Invite the Bot

In **OAuth2 > OAuth2 URL Generator**, select:

```text
bot
applications.commands
```

Recommended minimum permissions:

```text
Send Messages
Use Slash Commands
Embed Links
Read Message History
```

Open the generated URL and authorize the bot in your server.

## Configure `config.json`

Use the guided setup:

```bash
npm run setup
```

Or create it from the template:

```bash
npm run init-config
```

Then validate:

```bash
npm run check-config
```

More details: [docs/CONFIG.md](docs/CONFIG.md). Examples: [docs/examples](docs/examples).

## Inventory

`/inventario` and `/servicio-info` show service documentation from `config.json`
in read-only mode. They do not execute commands, do not run network checks and do
not call external APIs.

Full guide: [docs/INVENTORY.en.md](docs/INVENTORY.en.md).

## Diagnostics

`/diagnostico` and the Diagnostico panel button run the same real checks:

- `domains`: DNS lookup with `dns.lookup()`.
- `services` with `check: true`, `host`, and `port`: TCP port check.
- `services` with `check: true` and `url`: HTTP/HTTPS check.

Timeouts:

```json
"diagnostics": {
  "portTimeoutMs": 2000,
  "urlTimeoutMs": 5000
}
```

## Commands

- `/panel`: main panel.
- `/status`: basic ProxBot status.
- `/monitor`: automatic monitoring status.
- `/ultimodiagnostico`: latest diagnostics saved by monitoring.
- `/inventario`: filterable homelab inventory summary.
- `/servicio-info`: detailed service card.
- `/ips`: configured service hosts.
- `/dominios`: configured domains.
- `/ssh`: SSH cheat sheet.
- `/diagnostico`: DNS/TCP/HTTP diagnostics.
- `/checkdns`: check a specific domain.
- `/checkpuerto`: check a specific TCP port.
- `/checkurl`: check a specific URL.
- `/log`: save a note.
- `/verlog`: show recent notes.
- `/seguridad`: security checklist.
- `/pendientes`: pending tasks.
- `/ping`: quick bot test.
- `/servicios`: full services list.
- `/red`: network notes.

## Screenshots

### Main panel

Quick view with access buttons, network info, diagnostics, SSH, security and URL services.

![ProxBot main panel](docs/images/proxbot-panel.png)

### Bot status

Summary of ProxBot version, Node.js, platform, services, domains and active checks.

![ProxBot status](docs/images/proxbot-status.png)

### Manual diagnostics

Output of `/diagnostico` with DNS, TCP port and URL checks.

![ProxBot manual diagnostics](docs/images/proxbot-diagnostics.png)

### Automatic monitoring

Output of `/monitor` with automatic monitoring status, saved checks and latest diagnostics.

![ProxBot automatic monitoring](docs/images/proxbot-monitoring.png)

### Latest saved diagnostics

Output of `/ultimodiagnostico` with failures grouped by DNS, TCP and URLs.

![ProxBot latest saved diagnostics](docs/images/proxbot-last-diagnostics.png)

## Register Slash Commands

```bash
npm run deploy
```

## Start Locally

```bash
npm start
```

Try in Discord:

```text
/status
/monitor
/ultimodiagnostico
/panel
/diagnostico
```

## Debian/Ubuntu Guided Install

On a clean Debian/Ubuntu server:

```bash
sudo bash scripts/install.sh
```

Full guide: [docs/INSTALL.en.md](docs/INSTALL.en.md).

## Troubleshooting

### The Application Did Not Respond

Possible causes: bot is down, two instances use the same token, a command failed before replying, or a command took too long.

### Missing Access

Check that the bot was invited to the right server and that `applications.commands` was selected.

### Slash Commands Do Not Appear

Run `npm run deploy`, check `DISCORD_GUILD_ID`, and wait a few seconds for Discord to refresh.

### Local Domains Fail

The bot resolves DNS from the machine running Node.js. That machine must use your local DNS.

### Cannot Find Module

Run:

```bash
npm install
```

## Project Versions

| Version | Status | Focus |
|--------|--------|-------|
| v0.1.0 | Released | Configurable base, panel and manual diagnostics |
| v0.2.0 | Released | Guided setup, installer and `/status` |
| v0.3.0 | Released | Automatic monitoring and no-spam alerts |
| v0.4.0 | In development | Basic homelab inventory |

### v0.1.0 - Configurable base

Added:

- Functional Discord bot with slash commands.
- `config.json` based configuration.
- Public `config.example.json` template.
- Main `/panel`.
- Commands for services, IPs, domains, SSH, network, pending items and security.
- Manual diagnostics with `/diagnostico`.
- Manual checks with `/checkdns`, `/checkpuerto` and `/checkurl`.
- Notes/logging with `/log` and `/verlog`.
- Initial documentation.
- MIT License.

### v0.2.0 - Guided installation and documentation

Added:

- `npm run setup` for guided `.env` and `config.json` creation.
- `scripts/install.sh` for Debian/Ubuntu installation.
- `/status` command.
- Configurable diagnostics timeouts.
- Spanish/English documentation.
- `README.en.md`.
- `docs/INSTALL.md` and `docs/INSTALL.en.md`.
- `config.json` examples.
- systemd and Git guides.
- Release notes.

### v0.3.0 - Automatic monitoring

Status: in development until the release is published.

Added or planned:

- `monitoring` section in `config.json`.
- Internal monitoring engine.
- Local `data/status-cache.json` and `data/last-diagnostics.json` files.
- Alerts when a check changes from OK to failed.
- Recovery alerts when a check returns to OK.
- Anti-spam behavior with `notifyOnlyOnChange`.
- `/monitor` command.
- `/ultimodiagnostico` command.
- Monitoring documentation in [docs/MONITORING.en.md](docs/MONITORING.en.md).

### v0.4.0 - Homelab inventory

Status: in development until the release is published.

Added or planned:

- Internal `utils/inventory.js` utility.
- `/inventario` command.
- `/servicio-info` command.
- Optional inventory fields in services: `category`, `owner`, `location` and
  `notes`.
- Inventory documentation in [docs/INVENTORY.en.md](docs/INVENTORY.en.md).

## Next Steps

- Improve inventory examples, autocomplete and real-world testing.
- Consider a web UI only if it becomes genuinely useful.

## License

MIT. See [LICENSE](LICENSE).
