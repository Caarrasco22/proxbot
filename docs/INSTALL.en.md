# Guided Installation

This guide covers three ways to install ProxBot:

- manual installation;
- guided setup with `npm run setup`;
- Debian/Ubuntu installer with `scripts/install.sh`.

## Before You Install

Prepare:

- a Discord account;
- a server where you can invite bots;
- a Discord Developer Portal application;
- `DISCORD_TOKEN`;
- `DISCORD_CLIENT_ID`;
- `DISCORD_GUILD_ID`;
- optional `CHANNEL_LOGS_ID`;
- a list of services you want to add;
- IP/host/port/URL for each service;
- working local DNS if you use internal domains;
- administrator permissions if you install into `/opt/proxbot`.

## Manual Install

```bash
git clone https://github.com/Caarrasco22/proxbot.git
cd proxbot
npm install
cp .env.example .env
npm run init-config
```

Then:

1. edit `.env`;
2. edit `config.json`;
3. run `npm run check-config`;
4. run `npm run deploy`;
5. start with `npm start`.

This path is the most transparent: you control every file.

## Guided Setup

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

Use this path if you want to create `.env` and `config.json` step by step.

## Command Differences

- `npm run init-config`: only copies `config.example.json` to `config.json` if it does not exist.
- `npm run setup`: asks for data and generates `.env`/`config.json` with backups.
- `scripts/install.sh`: installs system dependencies, prepares `/opt/proxbot`, can run setup, deploy, and create systemd.

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
- if reinstalling with backup, moves the previous install to `/opt/proxbot-backup-YYYYMMDD-HHMMSS`;
- requires typing `SOBRESCRIBIR` before deleting `/opt/proxbot`;
- can run `npm run setup`;
- can run `npm run deploy`;
- can create a systemd `proxbot.service`.

## What install.sh Does NOT Do

- It does not officially support Windows, Arch, Fedora, Alpine, Synology, Unraid, or Docker.
- It does not configure Discord Developer Portal for you.
- It does not create tokens.
- It does not print `.env`.
- It does not show secrets.
- It does not guarantee a modern Node.js version if your apt repository ships an old one.

## Avoid Overwriting an Existing Install

If `/opt/proxbot` already exists, the installer asks:

1. update with `git pull`;
2. back up and reinstall;
3. overwrite with strong confirmation;
4. cancel.

The safe option is update or cancel. Do not overwrite if you are unsure.

## Test Without systemd

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

Stop the bot with `Ctrl+C`.

## Test With systemd

If you created the service:

```bash
sudo systemctl status proxbot --no-pager -l
sudo journalctl -u proxbot -f -l
```

Restart:

```bash
sudo systemctl restart proxbot
```

Stop:

```bash
sudo systemctl stop proxbot
```

## Update ProxBot

If installed in `/opt/proxbot`:

```bash
cd /opt/proxbot
git pull
npm install
npm run check-config
sudo systemctl restart proxbot
```

If slash commands changed:

```bash
npm run deploy
```

## Logs

With systemd:

```bash
sudo journalctl -u proxbot -f -l
```

Without systemd, check the terminal where you ran `npm start`.

More systemd details: [SYSTEMD.md](SYSTEMD.md).
