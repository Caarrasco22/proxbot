# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint + Prettier configuration and npm scripts (`lint`, `format`).
- Jest test suite with unit tests for `utils/inventory`, `utils/maintenance`, and `utils/permissions`.
- Modular architecture: extracted `utils/embeds.js`, `utils/panel.js`, and `utils/monitoring-engine.js` from `index.js`.

### Changed
- `index.js` reduced from ~809 lines to a clean bootstrap file (~130 lines).

## [0.9.0] - 2026-05-05

### Added
- Command `/proxmox-inventario` with `ver` and `cache` options.
- Local cache utilities in `utils/proxmox.js` for Proxmox inventory.
- Proxmox button in `/panel` with async handler and cache fallback.
- Cache stored in `data/proxmox-inventory-cache.json` (gitignored).
- Path traversal protection on cache paths via `resolveInventoryCachePath`.
- Validation for `inventoryCachePath` in `utils/validateConfig.js`.
- Documentation: `docs/PROXMOX-INVENTORY.md` and `docs/PROXMOX-INVENTORY.en.md`.

### Changed
- Updated `package.json` version to `0.9.0`.
- Updated READMEs with shields badges.

## [0.8.0] - 2026-04-28

### Added
- Optional Proxmox VE read-only integration (`/proxmox` command).
- `utils/proxmox.js` with token-based API client.
- Documentation: `docs/PROXMOX-READONLY.md`.

## [0.7.0] - 2026-04-21

### Added
- Basic Discord role-based permissions system.
- `utils/permissions.js` with configurable `protectedCommands` and `adminRoleIds`.
- Documentation: `docs/PERMISSIONS.md`.

## [0.6.0] - 2026-04-14

### Added
- `/backups` and `/mantenimiento` commands with panel integration.
- `utils/maintenance.js` for backups and maintenance item formatting.
- Documentation: `docs/BACKUPS.md` and `docs/MAINTENANCE.md`.

## [0.5.0] - 2026-04-07

### Added
- Proxmox LXC installer script (`scripts/proxmox-lxc-install.sh`).
- `--dry-run` mode for installer.
- Documentation: `docs/PROXMOX-LXC-INSTALL.md`.

## [0.4.0] - 2026-03-31

### Added
- Homelab inventory commands (`/inventario`, `/servicio-info`).
- `utils/inventory.js` with filtering, facets, and service formatting.
- Documentation: `docs/INVENTORY.md`.

## [0.3.0] - 2026-03-24

### Added
- Automatic monitoring engine (`utils/monitoring.js`).
- Status cache (`data/status-cache.json`) and last diagnostics persistence.
- Alert system with `notifyOnlyOnChange` anti-spam.
- Commands `/monitor` and `/ultimodiagnostico`.
- Documentation: `docs/MONITORING.md`.

## [0.2.0] - 2026-03-17

### Added
- Guided setup script (`npm run setup`).
- Debian/Ubuntu installer (`scripts/install.sh`).
- Command `/status`.
- Bilingual documentation (ES/EN).

## [0.1.0] - 2026-03-10

### Added
- Initial ProxBot release.
- Configurable Discord bot with `config.json`.
- Panel, diagnostics, SSH cheatsheet, notes, and security checklist.
- MIT License.

[Unreleased]: https://github.com/Caarrasco22/proxbot/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/Caarrasco22/proxbot/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/Caarrasco22/proxbot/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Caarrasco22/proxbot/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Caarrasco22/proxbot/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Caarrasco22/proxbot/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Caarrasco22/proxbot/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Caarrasco22/proxbot/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Caarrasco22/proxbot/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Caarrasco22/proxbot/releases/tag/v0.1.0
