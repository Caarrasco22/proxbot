# Automatic monitoring

Automatic monitoring is the foundation of ProxBot v0.3.0 for running scheduled
homelab checks and sending controlled alerts to Discord.

This first phase only prepares the configuration and documentation. Automatic
alerts will be implemented in later v0.3.0 steps.

## What it is

Automatic monitoring will run DNS, TCP port and URL checks using the same service
configuration already used by `/diagnostico`.

The goal is to detect service state changes without turning Discord into a noisy
stream of repeated messages.

## Difference between /diagnostico and automatic monitoring

`/diagnostico` is manual: a user runs it when they want to check the current
homelab status.

`monitoring` will be automatic: ProxBot will run checks on a schedule when it is
enabled in `config.json`.

## How to configure it

The planned `config.json` section is:

```json
{
  "monitoring": {
    "enabled": false,
    "intervalMinutes": 5,
    "alertChannelId": "",
    "notifyOnlyOnChange": true,
    "runOnStartup": false
  }
}
```

- `enabled`: enables or disables automatic monitoring.
- `intervalMinutes`: how often checks will run.
- `alertChannelId`: Discord channel where alerts will be sent.
- `notifyOnlyOnChange`: avoids repeated alerts when the state does not change.
- `runOnStartup`: runs an initial check when the bot starts.

For safety, `enabled` is set to `false` in `config.example.json`.

## How spam is avoided

The recommended option is:

```json
"notifyOnlyOnChange": true
```

With this option, ProxBot should only notify when a check changes from OK to FAIL
(`FAILED`) or from FAIL to OK (`RECOVERED`). If a service remains down for
multiple rounds, it should not send the same alert again and again.

## Alert channel

`alertChannelId` must be the ID of a Discord channel where the bot can read and
send messages.

Example:

```json
"alertChannelId": "123456789012345678"
```

Do not put tokens, passwords or sensitive data in this field. It should only
contain the channel ID.

## Configuration example

```json
{
  "monitoring": {
    "enabled": false,
    "intervalMinutes": 5,
    "alertChannelId": "",
    "notifyOnlyOnChange": true,
    "runOnStartup": false
  }
}
```

## Generated local files

The monitoring engine uses local JSON files to remember state:

- `data/status-cache.json`: previous check state used to detect changes.
- `data/last-diagnostics.json`: last saved diagnostics result.
- `data/.gitkeep`: empty file used to keep the `data/` directory in Git.

`status-cache.json` and `last-diagnostics.json` are generated automatically and
must not be committed to Git. Only `data/.gitkeep` belongs in the repository.

The snapshot saved in `status-cache.json` contains a simple list of checks:

```json
{
  "timestamp": "2026-01-01T10:00:00.000Z",
  "checks": [
    {
      "id": "tcp:Internal web service:192.168.1.20:3000",
      "type": "tcp",
      "name": "Internal web service",
      "ok": true,
      "message": "Internal web service -> 192.168.1.20:3000 23 ms"
    }
  ]
}
```

`last-diagnostics.json` stores the latest full cycle payload:

```json
{
  "timestamp": "2026-01-01T10:00:00.000Z",
  "results": {},
  "currentState": {},
  "changes": []
}
```

Detected changes can be:

- `NEW`: new check.
- `FAILED`: check changed from OK to FAIL.
- `RECOVERED`: check changed from FAIL to OK.
- `REMOVED`: check no longer exists in the configuration.

Future alerts will mainly use `FAILED` and `RECOVERED`.

## Current limitations

- The engine saves local state, but it does not send real Discord alerts yet.
- It does not replace Uptime Kuma, Grafana or Prometheus.
- No web GUI.
- No database.
- No destructive actions.
- No Proxmox or external service control.

## Next v0.3.0 steps

- Send alerts only to the configured channel.
- Add query commands such as `/monitor` and `/ultimodiagnostico`.
