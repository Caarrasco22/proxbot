# Pruebas v0.5.0 - Instalador Proxmox/LXC

Esta guia sirve para probar ProxBot v0.5.0 en un host Proxmox VE real de forma
controlada.

## Objetivo de la prueba

- Validar que el instalador puede desplegar ProxBot en un LXC Debian desde un
  host Proxmox VE.
- Validar primero sin cambios con `--dry-run`.
- Validar despues una instalacion real controlada.

## Que se va a probar

- `--help`.
- `bash -n`.
- `--dry-run`.
- Deteccion de Proxmox VE.
- Validacion de CT ID libre.
- Validacion de storage.
- Validacion de bridge.
- Validacion de template Debian.
- Creacion del LXC.
- Instalacion de Node.js >= 18.
- Clonacion del repositorio.
- `npm install`.
- Creacion de `.env` y `config.json` desde ejemplos.
- Creacion y habilitacion de systemd.
- No arranque automatico por defecto.
- Pasos manuales finales.

## Que NO se va a probar

- API de Proxmox.
- Tokens de Proxmox.
- Sincronizacion de VMs/CTs.
- Comandos destructivos.
- Start, stop o delete desde Discord.
- Docker.
- GUI.
- Base de datos.

## Requisitos previos

- Host Proxmox VE.
- Acceso `root` al host.
- Conexion a internet desde host y CT.
- Storage disponible.
- Bridge disponible, normalmente `vmbr0`.
- Template Debian disponible o posibilidad de descargarlo.
- CT ID libre.
- Copia o snapshot si quieres ir mas seguro, aunque el script no toca CTs
  existentes.

## Preparar rama de prueba en Proxmox

Ejecuta esto en el host Proxmox:

```bash
cd /tmp
git clone https://github.com/Caarrasco22/proxbot.git proxbot-v050-test
cd proxbot-v050-test
git checkout v0.5.0-proxmox-lxc-installer
```

## Validar sintaxis Bash

```bash
bash -n scripts/proxmox-lxc-install.sh
```

Resultado esperado:

- No debe imprimir errores.
- Si hay error, no continues.

## Probar ayuda

```bash
sudo bash scripts/proxmox-lxc-install.sh --help
```

Resultado esperado:

- Debe mostrar descripcion.
- Debe mostrar opciones `--help`, `--dry-run`, `--default` y `--advanced`.
- Debe advertir que se ejecuta en host Proxmox VE.

## Probar dry-run

```bash
sudo bash scripts/proxmox-lxc-install.sh --dry-run
```

Resultado esperado:

- Debe mostrar `DRY-RUN: no changes will be made`.
- Debe detectar Proxmox.
- Debe mostrar el plan.
- No debe crear CT.
- No debe arrancar CT.
- No debe ejecutar `pct exec`.
- No debe instalar paquetes.

Comprobacion posterior:

```bash
pct list
```

No deberia aparecer un CT nuevo creado por esta prueba.

## Prueba real en modo advanced

Para la primera prueba real se recomienda usar `--advanced`:

```bash
sudo bash scripts/proxmox-lxc-install.sh --advanced
```

Valores seguros para la prueba:

- CT ID: uno libre elegido por ti.
- Hostname: `proxbot-test`.
- Branch: `v0.5.0-proxmox-lxc-installer`.
- Red: DHCP para reducir riesgo.
- Arrancar servicio al final: NO.

No uses IPs, dominios ni tokens reales en capturas o documentacion publica.

## Comprobaciones despues de instalar

Desde el host Proxmox:

```bash
pct list
pct status CT_ID
pct enter CT_ID
```

Dentro del CT:

```bash
cd /opt/proxbot
node -v
npm -v
git branch
ls -la
systemctl status proxbot --no-pager -l
```

Resultado esperado:

- Node.js debe ser >= 18.
- Debe existir `/opt/proxbot`.
- Deben existir `.env` y `config.json` creados desde ejemplos.
- `proxbot.service` debe existir.
- El servicio puede estar habilitado pero no arrancado.
- Si no hay token en `.env`, no debe esperarse que el bot conecte.

## Configuracion manual final

Dentro del CT:

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

Notas:

- No pegues tokens en capturas.
- No subas `.env` ni `config.json`.
- `npm run deploy` requiere `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` y
  `DISCORD_GUILD_ID`.

## Pruebas en Discord

Prueba:

- `/status`.
- `/panel`.
- `/inventario`.
- `/diagnostico`.
- `/monitor`.

Resultado esperado:

- `/status` debe mostrar version `0.5.0`.
- `/panel` debe responder.
- Los comandos previos no deben romperse.

## Casos de fallo que conviene probar

- Ejecutar sin root: debe fallar claro.
- Ejecutar fuera de Proxmox: debe fallar claro.
- Usar CT ID ocupado: debe fallar claro.
- Usar bridge inexistente: debe fallar claro.
- Usar storage inexistente: debe fallar claro.
- Cancelar en confirmacion final: no debe crear nada.
- Pulsar Enter en confirmacion final: no debe crear nada.

## Checklist de aceptacion

- [ ] `bash -n` correcto.
- [ ] `--help` correcto.
- [ ] `--dry-run` no crea nada.
- [ ] Confirmacion final fuerte.
- [ ] CT creado correctamente.
- [ ] Node.js >= 18 dentro del CT.
- [ ] Repositorio clonado.
- [ ] `npm install` correcto.
- [ ] `.env` y `config.json` preparados.
- [ ] systemd creado dentro del CT.
- [ ] El servicio no arranca sin confirmacion.
- [ ] `npm run check-config` correcto.
- [ ] `npm run deploy` correcto.
- [ ] Bot arranca con systemd.
- [ ] `/status` funciona.
- [ ] `/panel` funciona.
- [ ] No hay datos privados en el repositorio.

## Notas de seguridad

- No subas `.env`.
- No subas `config.json` real.
- No publiques tokens.
- No publiques IDs reales si no hace falta.
- No publiques IPs reales en documentacion publica.
- El instalador no borra CTs automaticamente.
- Si algo falla, revisa manualmente antes de tocar nada.
