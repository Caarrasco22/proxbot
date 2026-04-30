# Guided Installation

This guide covers the manual installation and the basic Debian/Ubuntu installer.

## Before You Install

Prepare:

- A Discord account.
- A server where you can invite bots.
- A Discord Developer Portal application.
- `DISCORD_TOKEN`.
- `DISCORD_CLIENT_ID`.
- `DISCORD_GUILD_ID`.
- Optional `CHANNEL_LOGS_ID`.
- A list of services you want to add.
- IP/host/port/URL for each service.
- Working local DNS if you use internal domains.
- Administrator permissions if you install into `/opt/proxbot`.

## Manual Install

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run setup
npm run check-config
```

If you do not want the guided assistant:

```bash
npm run init-config
```

Then edit `.env` and `config.json`.

## Guided Setup

Run:

```bash
npm run setup
```

The assistant:

- shows a pre-flight checklist;
- creates or keeps `.env`;
- creates or keeps `config.json`;
- asks before overwriting;
- creates `*.backup-YYYYMMDD-HHMMSS` backups;
- does not print the token at the end;
- helps add services, domains, and SSH commands.

## Debian/Ubuntu Installer

On a clean server:

```bash
sudo bash scripts/install.sh
```

The installer:

- does a basic Debian/Ubuntu check;
- installs `git`, `curl`, `ca-certificates`, `nano`, `nodejs`, and `npm`;
- clones or updates `/opt/proxbot`;
- asks before overwriting;
- can run `npm run setup`;
- can run `npm run deploy`;
- can create a systemd `proxbot.service`.

It does not officially support Windows, Arch, Fedora, Alpine, Synology, Unraid, or Docker.

## After Installing

```bash
npm run check-config
npm run deploy
npm start
```

In Discord:

```text
/status
/panel
/diagnostico
```

## systemd

If you created the service:

```bash
sudo systemctl status proxbot --no-pager -l
sudo journalctl -u proxbot -f -l
sudo systemctl restart proxbot
sudo systemctl stop proxbot
```

More details: [SYSTEMD.md](SYSTEMD.md).
