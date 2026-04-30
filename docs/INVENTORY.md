# Inventario del homelab

El inventario de ProxBot es una vista de solo lectura sobre los servicios
definidos en `config.json`.

Sirve para documentar que existe en el homelab, donde esta, quien lo mantiene y
como encontrarlo desde Discord sin ejecutar acciones sobre los servicios.

## Que es

El inventario usa `config.services` como fuente principal. Cada servicio puede
tener campos tecnicos como `host`, `port` y `url`, y campos descriptivos como
`category`, `owner`, `location`, `notes` y `tags`.

No sincroniza servicios automaticamente y no consulta APIs externas.

## Solo lectura

Los comandos de inventario:

- no modifican `config.json`;
- no ejecutan SSH;
- no hacen checks de red;
- no crean ni borran servicios;
- no llaman a Proxmox, Uptime Kuma ni otras APIs.

## /inventario

Muestra un resumen de servicios activos del homelab.

Opciones:

- `tag`: filtra por una etiqueta concreta.
- `categoria`: filtra por `category` o `categoria`.
- `buscar`: busca texto en nombre, descripcion, host, URL, owner, location,
  notas y tags.

Ejemplos:

```text
/inventario
/inventario tag:web
/inventario categoria:infraestructura
/inventario buscar:dns
```

## /servicio-info

Muestra la ficha de un servicio concreto.

Ejemplo:

```text
/servicio-info nombre:Servidor principal
```

Primero busca coincidencia exacta sin distinguir mayusculas/minusculas. Si no
hay coincidencia exacta, busca coincidencias parciales. Si hay varias, pedira un
nombre mas concreto.

## Ejemplo de servicio

```json
{
  "name": "Servicio web interno",
  "description": "Aplicacion web local de ejemplo",
  "host": "192.168.1.20",
  "port": 3000,
  "url": "http://servicio.lab",
  "ssh": "ssh usuario@192.168.1.20",
  "category": "aplicaciones",
  "owner": "homelab",
  "location": "servidor principal",
  "notes": "Servicio de ejemplo. No guardar secretos aqui.",
  "enabled": true,
  "check": true,
  "tags": ["web", "interno"]
}
```

## Campos utiles

- `category` / `categoria`: grupo logico del servicio, por ejemplo
  `infraestructura`, `aplicaciones` o `monitorizacion`.
- `owner`: persona, equipo o contexto responsable. No debe contener datos
  sensibles.
- `location`: ubicacion fisica o logica, por ejemplo `rack principal`,
  `servidor principal` o `VM lab`.
- `notes` / `notas`: notas cortas para documentar el servicio.
- `tags`: lista de etiquetas para filtrar y clasificar.

## Seguridad

No guardes contrasenas, tokens, claves privadas ni secretos en `config.json`.

El inventario esta pensado para documentacion operativa, no para almacenar
credenciales.

## Limitaciones actuales

- No usa Proxmox API.
- No sincroniza servicios automaticamente.
- No detecta cambios externos.
- No ejecuta comandos.
- No sustituye a una base de datos de inventario.
