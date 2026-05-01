# v0.5.0 testing - Proxmox/LXC installer

This guide helps test ProxBot v0.5.0 on a real Proxmox VE host in a controlled
way.

## Test objective

- Validate that the installer can deploy ProxBot inside a Debian LXC from a
  Proxmox VE host.
- Validate the process first with `--dry-run`.
- Validate a controlled real installation afterwards.

## What will be tested

- `--help`.
- `bash -n`.
- `--dry-run`.
- Proxmox VE detection.
- Free CT ID validation.
- Storage validation.
- Bridge validation.
- Debian template validation.
- LXC creation.
- Node.js >= 18 installation.
- Repository cloning.
- `npm install`.
- `.env` and `config.json` creation from examples.
- systemd service creation and enablement.
- No automatic service start by default.
- Final manual steps.

## What will not be tested

- Proxmox API.
- Proxmox tokens.
- VM/CT sync.
- Destructive commands.
- Start, stop or delete actions from Discord.
- Docker.
- GUI.
- Database.

## Requirements

- Proxmox VE host.
- `root` access on the host.
- Internet access from the host and CT.
- Available storage.
- Available bridge, usually `vmbr0`.
- Debian template available or permission to download it.
- Free CT ID.
- Backup or snapshot if you want extra safety, although the script does not
  touch existing CTs.

## Prepare the test branch on Proxmox

Run this on the Proxmox host:

```bash
cd /tmp
git clone https://github.com/Caarrasco22/proxbot.git proxbot-v050-test
cd proxbot-v050-test
git checkout v0.5.0-proxmox-lxc-installer
```

## Validate Bash syntax

```bash
bash -n scripts/proxmox-lxc-install.sh
```

Expected result:

- It should print no errors.
- If it prints an error, do not continue.

## Test help

```bash
sudo bash scripts/proxmox-lxc-install.sh --help
```

Expected result:

- It should show a description.
- It should show `--help`, `--dry-run`, `--default` and `--advanced`.
- It should warn that it must run on the Proxmox VE host.

## Test dry-run

```bash
sudo bash scripts/proxmox-lxc-install.sh --dry-run
```

Expected result:

- It should show `DRY-RUN: no changes will be made`.
- It should detect Proxmox.
- It should show the plan.
- It should not create a CT.
- It should not start a CT.
- It should not run `pct exec`.
- It should not install packages.

Post-check:

```bash
pct list
```

There should be no new CT created by this test.

## Real advanced install test

For the first real test, use `--advanced`:

```bash
sudo bash scripts/proxmox-lxc-install.sh --advanced
```

Safe test values:

- CT ID: a free ID chosen by you.
- Hostname: `proxbot-test`.
- Branch: `v0.5.0-proxmox-lxc-installer`.
- Network: DHCP to reduce risk.
- Start service at the end: NO.

Do not use real IPs, domains or tokens in screenshots or public documentation.

## Post-install checks

From the Proxmox host:

```bash
pct list
pct status CT_ID
pct enter CT_ID
```

Inside the CT:

```bash
cd /opt/proxbot
node -v
npm -v
git branch
ls -la
systemctl status proxbot --no-pager -l
```

Expected result:

- Node.js must be >= 18.
- `/opt/proxbot` must exist.
- `.env` and `config.json` must exist, created from examples.
- `proxbot.service` must exist.
- The service may be enabled but not started.
- If `.env` has no token, the bot is not expected to connect.

## Final manual setup

Inside the CT:

```bash
cd /opt/proxbot
nano .env
npm run setup
npm run check-config
npm run deploy
sudo systemctl start proxbot
sudo systemctl status proxbot --no-pager -l
sudo journalctl -u proxbot -f -l
```

Notes:

- Do not paste tokens in screenshots.
- Do not commit `.env` or `config.json`.
- `npm run deploy` requires `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` and
  `DISCORD_GUILD_ID`.

## Discord checks

Test:

- `/status`.
- `/panel`.
- `/inventario`.
- `/diagnostico`.
- `/monitor`.

Expected result:

- `/status` should show version `0.5.0`.
- `/panel` should respond.
- Existing commands should keep working.

## Failure cases worth testing

- Run without root: should fail clearly.
- Run outside Proxmox: should fail clearly.
- Use an occupied CT ID: should fail clearly.
- Use a missing bridge: should fail clearly.
- Use a missing storage: should fail clearly.
- Cancel at final confirmation: should create nothing.
- Press Enter at final confirmation: should create nothing.

## Acceptance checklist

- [ ] `bash -n` passes.
- [ ] `--help` works.
- [ ] `--dry-run` creates nothing.
- [ ] Strong final confirmation.
- [ ] CT created correctly.
- [ ] Node.js >= 18 inside the CT.
- [ ] Repository cloned.
- [ ] `npm install` passes.
- [ ] `.env` and `config.json` prepared.
- [ ] systemd created inside the CT.
- [ ] Service does not start without confirmation.
- [ ] `npm run check-config` passes.
- [ ] `npm run deploy` passes.
- [ ] Bot starts with systemd.
- [ ] `/status` works.
- [ ] `/panel` works.
- [ ] No private data in the repository.

## Security notes

- Do not commit `.env`.
- Do not commit a real `config.json`.
- Do not publish tokens.
- Do not publish real IDs unless needed.
- Do not publish real IPs in public documentation.
- The installer does not delete CTs automatically.
- If something fails, inspect manually before changing anything.
