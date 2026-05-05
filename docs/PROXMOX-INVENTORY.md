# Inventario detectado desde Proxmox VE

ProxBot puede mostrar un resumen estructurado de las VMs y contenedores (CTs)
detectados en Proxmox VE, sin modificar el inventario manual ni `config.json`.

## Que es

El comando `/proxmox-inventario` consulta la API de Proxmox VE y muestra:

- Numero total de recursos detectados.
- Cuantos son VMs (`qemu`) y cuantos CTs (`lxc`).
- Nombre, estado, nodo, VMID, memoria y disco de cada recurso.

Es **solo lectura** y **no modifica `config.json`**.

## Requisitos previos

- Tener la integracion Proxmox activada y configurada. Consulta
  [docs/PROXMOX-READONLY.md](PROXMOX-READONLY.md) para los pasos previos.
- Tener acceso de lectura a la API de Proxmox VE.

## Comandos disponibles

```text
/proxmox-inventario
/proxmox-inventario accion:Ver desde Proxmox
/proxmox-inventario accion:Mostrar cache local
```

Tambien puedes acceder desde el panel principal (`/panel`) con el boton **Proxmox**.

- `ver` (por defecto): consulta Proxmox en tiempo real, muestra el resumen y
  actualiza la cache local si `inventoryCachePath` esta configurado.
- `cache`: muestra la ultima cache guardada sin llamar a Proxmox.

## Cache local

Si configuras `inventoryCachePath` en `config.json`, ProxBot guarda la ultima
respuesta de Proxmox en un archivo JSON local. Esto permite consultar el
inventario sin repetir llamadas a la API.

Ejemplo de configuracion:

```json
{
  "integrations": {
    "proxmox": {
      "enabled": true,
      "url": "https://proxmox.example.local:8006",
      "tokenEnv": "PROXMOX_TOKEN",
      "inventoryCachePath": "data/proxmox-inventory-cache.json"
    }
  }
}
```

El archivo de cache:

- Se genera automaticamente al usar `/proxmox-inventario ver`.
- Esta ignorado por Git (`.gitignore`).
- Puede contener nombres reales de VMs/CTs: no lo subas al repositorio.
- No contiene tokens ni credenciales.

## Si la llamada a Proxmox falla

Si `/proxmox-inventario ver` no puede conectar con Proxmox pero existe una cache
local valida, ProxBot mostrara los datos de cache con un aviso de que son
informacion desactualizada.

Si no hay cache, respondera con un error generico sin detalles sensibles.

## Permisos de Discord

Se recomienda proteger `/proxmox-inventario` con el sistema de permisos de ProxBot.
Anade `"proxmox-inventario"` a `permissions.protectedCommands` en `config.json`.

## Limitaciones

- Solo muestra recursos de tipo `qemu` y `lxc`. No incluye storage.
- No modifica `config.json` ni sincroniza con el inventario manual.
- No ejecuta acciones sobre los recursos (start, stop, reboot, delete).
- El listado se trunca a 20 recursos por respuesta.
