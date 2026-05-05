# Integracion Proxmox VE (solo lectura)

ProxBot puede conectarse a una instancia de Proxmox VE para mostrar
informacion de nodos, VMs y contenedores en modo solo lectura.

## Que es

La integracion con Proxmox VE es **opcional y desactivada por defecto**.
Cuando se activa, ProxBot consulta la API REST de Proxmox y muestra:

- Version y estado de la API
- Nodos del cluster
- Recursos (VMs, CTs, storage)

No ejecuta acciones: no inicia, no detiene, no reinicia, no elimina ni modifica
ningun recurso de Proxmox.

## Desactivada por defecto

Por defecto `integrations.proxmox.enabled` es `false`. Con esta configuracion,
el comando `/proxmox` responde que la integracion esta desactivada y no realiza
ninguna conexion externa.

## Requisitos previos

1. Tener acceso a la API REST de Proxmox VE.
2. Tener un token de API valido.
3. Que ProxBot pueda alcanzar la URL de Proxmox por red.

## Configuracion

### 1. Crear un token de API en Proxmox

Pasos generales (pueden variar segun tu version de Proxmox):

1. Accede a Proxmox VE como administrador.
2. Ve a **Datacenter > Permissions > API Tokens**.
3. Clic en **Add**.
4. Selecciona un usuario (por ejemplo `root@pam` o un usuario dedicado).
5. Asigna un **Token ID** (por ejemplo `proxbot`).
6. Desactiva **Privilege Separation** si quieres que el token herede los
   permisos del usuario.
7. Copia el **Secret**.

El token completo tiene este formato:

```
PVEAPIToken=usuario@pve!tokenid=secret
```

**Ejemplo ficticio:**

```
PVEAPIToken=root@pve!proxbot=abc123def456
```

Guarda este valor en tu archivo `.env`.

### 2. Configurar .env

Añade o edita en `.env`:

```env
PROXMOX_TOKEN=PVEAPIToken=usuario@pve!tokenid=secret
```

### 3. Configurar config.json

Añade la seccion `integrations.proxmox`:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": "https://proxmox.example.local:8006",
      "tokenEnv": "PROXMOX_TOKEN",
      "realm": "pve",
      "timeoutMs": 5000,
      "rejectUnauthorized": true,
      "cacheTtlSeconds": 60
    }
  }
}
```

### Campos

- `enabled`: activa (`true`) o desactiva (`false`) la integracion.
- `url`: URL base de Proxmox VE, incluyendo puerto (por ejemplo
  `https://proxmox.local:8006`).
- `tokenEnv`: nombre de la variable de entorno donde leer el token.
- `realm`: realm de autenticacion (por defecto `pve`).
- `timeoutMs`: tiempo maximo de espera para la API (por defecto `5000`).
- `rejectUnauthorized`: preferencia reservada para futuras versiones.
  En v0.8.0 ProxBot usa `fetch` nativo de Node.js y la validacion TLS la
  gestiona el sistema operativo / Node.js. Por defecto `true`.
- `cacheTtlSeconds`: TTL de cache en memoria (reservado para futuras
  versiones; en v0.8.0 no se usa cache persistente).

## TLS y certificados

ProxBot usa `fetch` nativo de Node.js. La validacion de certificados SSL la
realiza Node.js y el sistema operativo.

Si usas certificados autofirmados en tu lab, la opcion recomendada es:

- **Instalar el certificado CA en el sistema donde corre ProxBot** o confiar
  en el a nivel de sistema operativo / Node.js.

ProxBot **no** usa `NODE_TLS_REJECT_UNAUTHORIZED=0` ni hacks globales.
El campo `rejectUnauthorized` en `config.json` queda como preferencia
reservada para futuras mejoras; en v0.8.0 no garantiza un bypass de la
validacion TLS.

## Comandos disponibles

```text
/proxmox estado
/proxmox nodos
/proxmox recursos
/proxmox-inventario ver
/proxmox-inventario cache
```

- `estado`: muestra la version de la API de Proxmox.
- `nodos`: lista los nodos del cluster con CPU, memoria y uptime.
- `recursos`: lista VMs, CTs y storage detectados.
- `proxmox-inventario`: muestra un resumen estructurado de VMs y CTs detectadas, con cache local opcional.
  Consulta [docs/PROXMOX-INVENTORY.md](PROXMOX-INVENTORY.md) para mas detalles.

## Permisos de Discord

Se recomienda proteger `/proxmox` y `/proxmox-inventario` con el sistema de permisos de ProxBot.
Anade `"proxmox"` y `"proxmox-inventario"` a `permissions.protectedCommands` en `config.json`.

## Limitaciones

- Solo lectura: no inicia, detiene, reinicia ni elimina recursos.
- No modifica `config.json` ni el inventario manual de ProxBot.
- No sincroniza automaticamente con el inventario de ProxBot.
- No escribe archivos locales con datos de Proxmox (salvo cache opcional de inventario).
- No funciona si Proxmox no es accesible desde la red donde corre ProxBot.
- Depende de que el token tenga permisos de lectura en la API.

## Creditos

La idea inicial de integracion con Proxmox API fue propuesta por @t0msly3r en la PR #2. La implementacion de v0.8.0 se redisena para encajar con la filosofia actual de ProxBot: opcional, desactivada por defecto, solo lectura, sin dependencias nuevas y sin acciones destructivas.

## Troubleshooting

### "La integracion Proxmox esta desactivada"

`integrations.proxmox.enabled` es `false`. Cambialo a `true` y reinicia ProxBot.

### "Token de Proxmox no encontrado"

La variable de entorno indicada en `tokenEnv` no existe o esta vacia. Revisa tu
`.env`.

### "Timeout al conectar con Proxmox"

ProxBot no puede alcanzar la URL configurada. Verifica:
- que la URL y el puerto sean correctos;
- que no haya firewall bloqueando la conexion;
- que aumentes `timeoutMs` si la red es lenta.

### "Proxmox respondio HTTP 401"

El token es invalido o ha expirado. Revisa que el token en `.env` sea correcto
y que el usuario tenga permisos en Proxmox.

### "Proxmox respondio HTTP 403"

El token es valido pero no tiene permisos suficientes. Revisa los permisos del
usuario/token en Proxmox.

### Certificado autofirmado

Si Proxmox tiene un certificado autofirmado, la conexion puede fallar porque
Node.js valida el certificado contra las CAs del sistema. La solucion
recomendada es instalar el CA de Proxmox en el sistema donde corre ProxBot.

ProxBot no usa `NODE_TLS_REJECT_UNAUTHORIZED=0`. El campo
`rejectUnauthorized` en config.json queda reservado para futuras versiones.
