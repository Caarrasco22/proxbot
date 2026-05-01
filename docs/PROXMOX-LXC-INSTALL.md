# Instalacion en Proxmox/LXC

Esta guia explica como usar el instalador de ProxBot para crear un contenedor
LXC Debian desde un host Proxmox VE y preparar ProxBot dentro del contenedor.

Para una prueba guiada antes de usarlo en serio, consulta
[TESTING-v0.5.0.md](TESTING-v0.5.0.md).

## Que es

`scripts/proxmox-lxc-install.sh` es un instalador conservador para ejecutar en
el host Proxmox VE. Crea un LXC Debian nuevo, instala dependencias basicas,
clona ProxBot, prepara `.env` y `config.json`, y crea un servicio systemd dentro
del contenedor.

## Para quien es

- Usuarios de Proxmox VE que quieren aislar ProxBot en un LXC.
- Homelabs pequenos que quieren una instalacion reproducible.
- Personas que prefieren revisar un plan antes de crear nada.

## Que hace

- Detecta Proxmox VE.
- Comprueba `root` y herramientas necesarias.
- Permite `--dry-run`.
- Permite modo default y advanced.
- Crea un LXC Debian nuevo.
- Instala `ca-certificates`, `curl`, `git`, `nodejs` y `npm` dentro del LXC.
- Garantiza Node.js >= 18.
- Clona ProxBot dentro del LXC.
- Ejecuta `npm install`.
- Copia `.env.example` a `.env` si no existe.
- Copia `config.example.json` a `config.json` si no existe.
- Crea y habilita `proxbot.service` dentro del LXC.

## Que NO hace

- No usa Proxmox API.
- No usa tokens de Proxmox.
- No modifica VMs/CTs existentes.
- No borra contenedores.
- No rellena tokens de Discord.
- No ejecuta acciones destructivas desde Discord.
- No instala Docker, GUI ni base de datos.

## Requisitos

- Proxmox VE.
- Ejecutar como `root` en el host Proxmox.
- Conexion a internet.
- Storage disponible para rootfs.
- Storage disponible para templates LXC.
- Bridge de red, normalmente `vmbr0`.
- Un CT ID libre.

No ejecutes este script dentro de un Debian normal ni dentro de otro contenedor.
Debe ejecutarse en el host Proxmox VE.

## Uso rapido

```bash
sudo bash scripts/proxmox-lxc-install.sh
```

## Ayuda

```bash
sudo bash scripts/proxmox-lxc-install.sh --help
```

La ayuda muestra opciones, ejemplos y recuerda que el script debe ejecutarse en
el host Proxmox VE.

## Dry-run

Para ver el plan sin crear nada:

```bash
sudo bash scripts/proxmox-lxc-install.sh --dry-run
```

En dry-run el script detecta Proxmox, revisa comandos, calcula o pide la
configuracion y muestra el plan. No crea LXC, no descarga templates y no instala
nada.

Tambien muestra mensajes `DRY-RUN` para dejar claro que se saltan la creacion
del LXC y la instalacion dentro del CT.

## Modo default

El modo default usa valores seguros:

- CT ID libre a partir de `120`.
- Hostname `proxbot`.
- Debian 12 si esta disponible.
- `local-lvm` para disco si existe.
- `local` para templates si existe.
- `vmbr0`.
- 1 core.
- 512 MB RAM.
- 512 MB swap.
- 4 GB disco.
- DHCP.
- `/opt/proxbot`.
- Branch `main`.

## Modo advanced

```bash
sudo bash scripts/proxmox-lxc-install.sh --advanced
```

Permite configurar:

- CT ID.
- Hostname.
- Storage de disco.
- Storage de templates.
- Template Debian.
- Bridge.
- DHCP o IP manual.
- Cores.
- RAM.
- Swap.
- Disco.
- Repo URL.
- Branch.
- Ruta de instalacion.
- Si arrancar el servicio al final.

## Que crea

- Un LXC Debian nuevo.
- ProxBot en `/opt/proxbot` por defecto.
- `/etc/systemd/system/proxbot.service` dentro del LXC.
- `.env` desde `.env.example`.
- `config.json` desde `config.example.json`.

El servicio systemd queda habilitado, pero no se arranca por defecto. Primero
debes configurar `.env` con `DISCORD_TOKEN`.

## Entrar al CT

```bash
pct enter <CT_ID>
```

Ejemplo:

```bash
pct enter 120
```

## Configurar ProxBot dentro del CT

```bash
cd /opt/proxbot
nano .env
npm run setup
npm run deploy
```

No subas `.env` ni `config.json` a Git.

## Comprobar el CT desde el host

```bash
pct status <CT_ID>
pct enter <CT_ID>
```

## Arrancar y ver logs

```bash
systemctl start proxbot
systemctl status proxbot --no-pager -l
journalctl -u proxbot -f -l
```

Si `.env` no tiene `DISCORD_TOKEN`, el servicio fallara hasta que lo configures.

## Troubleshooting

### No detecta Proxmox

Comprueba que estas ejecutando el script en el host Proxmox VE y que existe
`pveversion`.

### El CT ID ya existe

Elige otro ID. El script no sobrescribe contenedores existentes.

### No encuentra storage

Revisa tus storages con:

```bash
pvesm status
```

El storage de disco debe soportar `rootdir`. El de templates debe soportar
`vztmpl`.

### No encuentra bridge

Revisa bridges disponibles:

```bash
ip link show
```

Normalmente se usa `vmbr0`.

### Node.js es menor que 18

El script intenta instalar NodeSource 20.x dentro del LXC si los paquetes de
Debian no cumplen el requisito.

### El bot no arranca

Revisa:

- `.env`;
- `config.json`;
- `npm install`;
- `systemctl status proxbot --no-pager -l`;
- `journalctl -u proxbot -f -l`.

### La instalacion falla a mitad

El instalador no borra ni para contenedores automaticamente si algo falla.
Revisa el estado con `pct status <CT_ID>` y entra con `pct enter <CT_ID>` para
inspeccionarlo manualmente.

## Seguridad

- Revisa siempre el plan antes de confirmar.
- Usa `--dry-run` antes de crear el LXC.
- No guardes tokens ni passwords en documentacion publica.
- No subas `.env`, `config.json` ni logs a Git.
- El instalador no usa tokens de Proxmox.

## Limitaciones

- Solo esta pensado para Proxmox VE.
- Principalmente probado para LXC Debian.
- No gestiona clusters complejos.
- No sincroniza inventario desde Proxmox.
- No llama a la API de Proxmox.
- No controla VMs ni contenedores desde Discord.
