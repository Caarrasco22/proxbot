# Guia de pruebas ProxBot v0.8.0

## Que se prueba

La integracion opcional de Proxmox VE en modo solo lectura.

## Antes de empezar

Ten listo:

- Un entorno de Proxmox VE accesible (puede ser un lab).
- Un token de API de Proxmox con permisos de lectura.
- ProxBot v0.8.0 clonado y con `.env` configurado.

## 1. Sin integracion activada

Configura `config.json`:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": false,
      "url": "",
      "tokenEnv": "PROXMOX_TOKEN"
    }
  }
}
```

Ejecuta:

```text
/proxmox estado
```

**Esperado:**
- Mensaje: "La integracion Proxmox esta desactivada en config.json."
- No debe hacer ninguna peticion de red.

## 2. Integracion activada pero sin URL

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": ""
    }
  }
}
```

**Esperado:**
- Mensaje indicando que falta la URL.

## 3. Integracion activada pero sin token

Asegurate de que `PROXMOX_TOKEN` no esta en `.env`.

**Esperado:**
- Mensaje indicando que falta el token.
- No debe mostrar el valor del token.

## 4. Token invalido

Pon un token ficticio en `.env`:

```env
PROXMOX_TOKEN=PVEAPIToken=invalido
```

**Esperado:**
- Mensaje generico de error.
- No debe exponer detalles internos de la API.

## 5. Consultas read-only correctas

Configura URL y token reales de tu lab:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": "https://tu-proxmox.local:8006",
      "tokenEnv": "PROXMOX_TOKEN"
    }
  }
}
```

Prueba:

```text
/proxmox estado
/proxmox nodos
/proxmox recursos
```

**Esperado:**
- Cada comando devuelve un embed con datos reales de Proxmox.
- No hay botones de start/stop/restart/delete.
- Los datos se muestran como texto plano en embeds.

## 6. Permisos de Discord

Anade `"proxmox"` a `permissions.protectedCommands` y activa permisos.

Prueba con un usuario sin rol admin:

```text
/proxmox estado
```

**Esperado:**
- Mensaje de denegacion.

## Validaciones automaticas

Ejecuta:

```bash
npm run check-config
```

**Esperado:** sin errores; warnings solo si config.json tiene avisos legitimos.

```bash
node -c index.js
node -c deploy-commands.js
node -c utils/proxmox.js
node -c commands/proxmox.js
```

**Esperado:** sin errores de sintaxis.

## No hacer

- No pruebes start/stop/delete: no existen esos comandos.
- No esperes que /proxmox escriba en config.json.
- No uses certificados autofirmados sin instalar la CA en el sistema.
