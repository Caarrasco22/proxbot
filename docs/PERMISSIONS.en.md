# ProxBot Basic Permissions

ProxBot's permission system is an optional layer disabled by default that
restricts certain commands to users with specific administrator roles in
Discord.

## What It Is

ProxBot can limit the use of sensitive commands through Discord roles. It does
not require a database or additional dependencies: it only reads the
`permissions` section from `config.json` and checks the roles of the user who
invokes the command.

## Disabled by Default

By default `permissions.enabled` is `false`. With this setting, all commands
work as before and any user can use them.

## Read-Only / No Execution

The permissions module:

- does not modify Discord roles;
- does not execute actions against the infrastructure;
- does not replace real homelab security.

## Configuration

Minimal example in `config.json`:

```json
{
  "permissions": {
    "enabled": false,
    "adminRoleIds": [],
    "protectedCommands": [
      "ssh",
      "log",
      "verlog",
      "backups",
      "mantenimiento",
      "servicio-info"
    ]
  }
}
```

### Fields

- `enabled`: enables (`true`) or disables (`false`) restrictions.
- `adminRoleIds`: array of Discord role IDs that can use protected commands.
- `protectedCommands`: array of command names to protect.

### How to Get a Role ID in Discord

1. Enable **Developer Mode** in Discord (User Settings > Advanced).
2. Go to your server and open the roles list (Server Settings > Roles).
3. Right-click the role you want to use.
4. Click **Copy ID**.
5. Paste it into `adminRoleIds` as a string:

```json
"adminRoleIds": [
  "1234567890123456789"
]
```

You can add multiple roles. Users who have **at least one** of those roles will
be able to use protected commands.

## Safe Behavior

If you set `enabled: true` but leave `adminRoleIds` empty, **all protected
commands will be blocked for everyone**. This is intentional: it prevents
accidentally enabling the permission system without configuring roles.

`check-config` will warn you if it detects this situation.

## Commands Not Protected by Default

The following commands are intended to be public and are not protected unless
you explicitly add them to `protectedCommands`:

- `/ping`
- `/status`
- `/panel`
- `/servicios`
- `/inventario`
- `/diagnostico`
- `/checkdns`
- `/checkpuerto`
- `/checkurl`
- `/ips`
- `/dominios`
- `/red`
- `/seguridad`
- `/pendientes`

## Limitations

- Only works inside Discord servers (not in DMs).
- Depends on roles being configured correctly.
- Does not protect information already posted in public channels.
- Does not replace a real homelab security strategy.
- Does not hide panel buttons: if a user without the role clicks a protected
  button, they will receive a denial message.
- Does not control access to external services or the machine running ProxBot.

## Complete Example

```json
{
  "permissions": {
    "enabled": true,
    "adminRoleIds": [
      "1234567890123456789",
      "9876543210987654321"
    ],
    "protectedCommands": [
      "ssh",
      "log",
      "verlog",
      "backups",
      "mantenimiento",
      "servicio-info"
    ]
  }
}
```

Remember: restart ProxBot after modifying `config.json` for changes to take
effect.
