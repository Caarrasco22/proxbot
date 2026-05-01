# Proxmox/LXC installation

This guide explains how to use the ProxBot installer to create a Debian LXC from
a Proxmox VE host and prepare ProxBot inside the container.

For a guided test flow before using it seriously, see
[TESTING-v0.5.0.en.md](TESTING-v0.5.0.en.md).

## What it is

`scripts/proxmox-lxc-install.sh` is a conservative installer intended to run on
the Proxmox VE host. It creates a new Debian LXC, installs basic dependencies,
clones ProxBot, prepares `.env` and `config.json`, and creates a systemd service
inside the container.

## Who it is for

- Proxmox VE users who want to isolate ProxBot in an LXC.
- Small homelabs that want a repeatable install flow.
- Users who prefer reviewing a plan before creating anything.

## What it does

- Detects Proxmox VE.
- Checks `root` and required tools.
- Supports `--dry-run`.
- Supports default and advanced modes.
- Creates a new Debian LXC.
- Installs `ca-certificates`, `curl`, `git`, `nodejs` and `npm` inside the LXC.
- Ensures Node.js >= 18.
- Clones ProxBot inside the LXC.
- Runs `npm install`.
- Copies `.env.example` to `.env` if missing.
- Copies `config.example.json` to `config.json` if missing.
- Creates and enables `proxbot.service` inside the LXC.

## What it does NOT do

- No Proxmox API.
- No Proxmox tokens.
- No changes to existing VMs/CTs.
- No container deletion.
- No Discord token setup.
- No destructive Discord actions.
- No Docker, GUI or database.

## Requirements

- Proxmox VE.
- Run as `root` on the Proxmox host.
- Internet access.
- Storage available for rootfs.
- Storage available for LXC templates.
- Network bridge, usually `vmbr0`.
- A free CT ID.

Do not run this script inside a normal Debian system or inside another
container. It must run on the Proxmox VE host.

## Quick usage

```bash
sudo bash scripts/proxmox-lxc-install.sh
```

## Help

```bash
sudo bash scripts/proxmox-lxc-install.sh --help
```

The help output shows options, examples and reminds you that the script must be
run on the Proxmox VE host.

## Dry-run

To show the plan without creating anything:

```bash
sudo bash scripts/proxmox-lxc-install.sh --dry-run
```

In dry-run mode the script detects Proxmox, checks commands, calculates or asks
for configuration and shows the plan. It does not create an LXC, download
templates or install packages.

It also prints `DRY-RUN` messages so it is clear that LXC creation and
installation inside the CT are skipped.

## Default mode

Default mode uses safe values:

- Free CT ID starting at `120`.
- Hostname `proxbot`.
- Debian 12 if available.
- `local-lvm` for disk if available.
- `local` for templates if available.
- `vmbr0`.
- 1 core.
- 512 MB RAM.
- 512 MB swap.
- 4 GB disk.
- DHCP.
- `/opt/proxbot`.
- Branch `main`.

## Advanced mode

```bash
sudo bash scripts/proxmox-lxc-install.sh --advanced
```

Lets you configure:

- CT ID.
- Hostname.
- Disk storage.
- Template storage.
- Debian template.
- Bridge.
- DHCP or manual IP.
- Cores.
- RAM.
- Swap.
- Disk.
- Repo URL.
- Branch.
- Install path.
- Whether to start the service at the end.

## What it creates

- A new Debian LXC.
- ProxBot in `/opt/proxbot` by default.
- `/etc/systemd/system/proxbot.service` inside the LXC.
- `.env` from `.env.example`.
- `config.json` from `config.example.json`.

The systemd service is enabled but not started by default. Configure `.env`
with `DISCORD_TOKEN` first.

## Enter the CT

```bash
pct enter <CT_ID>
```

Example:

```bash
pct enter 120
```

## Configure ProxBot inside the CT

```bash
cd /opt/proxbot
nano .env
npm run setup
npm run deploy
```

Do not commit `.env` or `config.json` to Git.

## Check the CT from the host

```bash
pct status <CT_ID>
pct enter <CT_ID>
```

## Start and view logs

```bash
systemctl start proxbot
systemctl status proxbot --no-pager -l
journalctl -u proxbot -f -l
```

If `.env` does not contain `DISCORD_TOKEN`, the service will fail until it is
configured.

## Troubleshooting

### Proxmox is not detected

Make sure you are running the script on the Proxmox VE host and that
`pveversion` exists.

### CT ID already exists

Choose another ID. The script does not overwrite existing containers.

### Storage is not found

Check your storages:

```bash
pvesm status
```

Disk storage must support `rootdir`. Template storage must support `vztmpl`.

### Bridge is not found

Check available bridges:

```bash
ip link show
```

Usually `vmbr0` is used.

### Node.js is lower than 18

The script tries to install NodeSource 20.x inside the LXC if Debian packages do
not meet the requirement.

### The bot does not start

Check:

- `.env`;
- `config.json`;
- `npm install`;
- `systemctl status proxbot --no-pager -l`;
- `journalctl -u proxbot -f -l`.

### Installation fails halfway

The installer does not delete or stop containers automatically if something
fails. Check the state with `pct status <CT_ID>` and enter it with
`pct enter <CT_ID>` to inspect it manually.

## Security

- Always review the plan before confirming.
- Use `--dry-run` before creating the LXC.
- Do not store tokens or passwords in public documentation.
- Do not commit `.env`, `config.json` or logs to Git.
- The installer does not use Proxmox tokens.

## Limitations

- Intended only for Proxmox VE.
- Mainly designed for Debian LXC.
- Does not manage complex clusters.
- Does not sync inventory from Proxmox.
- Does not call the Proxmox API.
- Does not control VMs or containers from Discord.
