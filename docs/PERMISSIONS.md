# Permisos basicos de ProxBot

El sistema de permisos de ProxBot es una capa opcional y desactivada por
defecto que restringe ciertos comandos a usuarios con roles de administrador
especificos en Discord.

## Que es

ProxBot puede limitar el uso de comandos sensibles a traves de los roles de
Discord. No requiere base de datos ni dependencias adicionales: solo lee la
seccion `permissions` de `config.json` y comprueba los roles del usuario que
invoca el comando.

## Desactivado por defecto

Por defecto `permissions.enabled` es `false`. Con esta configuracion, todos los
comandos funcionan igual que antes y cualquier usuario puede usarlos.

## Solo lectura / Sin ejecucion

El modulo de permisos:

- no modifica roles de Discord;
- no ejecuta acciones sobre la infraestructura;
- no sustituye la seguridad real del homelab.

## Configuracion

Ejemplo minimo en `config.json`:

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

### Campos

- `enabled`: activa (`true`) o desactiva (`false`) las restricciones.
- `adminRoleIds`: array de IDs de roles de Discord que pueden usar comandos
  protegidos.
- `protectedCommands`: array de nombres de comandos que se quieren proteger.

### Como obtener un Role ID en Discord

1. Activa **Modo desarrollador** en Discord (Ajustes de usuario > Avanzado).
2. Ve a tu servidor y abre la lista de roles (Ajustes del servidor > Roles).
3. Clic derecho sobre el rol que quieras usar.
4. Pulsa **Copiar ID**.
5. Pegalo en `adminRoleIds` como string:

```json
"adminRoleIds": [
  "1234567890123456789"
]
```

Puedes anadir varios roles. Los usuarios que tengan **al menos uno** de esos
roles podran usar los comandos protegidos.

## Comportamiento seguro

Si activas `enabled: true` pero dejas `adminRoleIds` vacio, **todos los
comandos protegidos se bloquearan para todo el mundo**. Esto es intencional:
impide activar el sistema de permisos por accidente sin configurar roles.

`check-config` te avisara con un warning si detecta esta situacion.

## Comandos que no se protegen por defecto

Los siguientes comandos estan pensados para ser publicos y no se protegen a
menos que los anadas explicitamente a `protectedCommands`:

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

## Limitaciones

- Solo funciona dentro de servidores de Discord (no en DMs).
- Depende de que los roles esten configurados correctamente.
- No protege informacion ya publicada en canales publicos.
- No sustituye a una estrategia real de seguridad del homelab.
- No oculta botones del panel: si un usuario sin rol pulsa un boton protegido,
  recibira un mensaje de denegacion.
- No controla acceso a servicios externos ni a la maquina donde corre ProxBot.

## Ejemplo completo

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

Recuerda: para que los cambios surtan efecto, reinicia ProxBot despues de
modificar `config.json`.
