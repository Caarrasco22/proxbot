#!/usr/bin/env bash
set -Eeuo pipefail

# ProxBot Proxmox/LXC installer
# Creates a Debian LXC on a Proxmox VE host and prepares ProxBot inside it.
# This script must be run on the Proxmox VE host as root.
# It does not modify existing VMs/CTs except checking whether the selected CT ID exists.
# Project license: MIT. See LICENSE in the ProxBot repository.

REPO_URL_DEFAULT="https://github.com/Caarrasco22/proxbot.git"
BRANCH_DEFAULT="main"
INSTALL_PATH_DEFAULT="/opt/proxbot"
SERVICE_NAME="proxbot"

CT_ID=""
HOSTNAME="proxbot"
DISK_STORAGE=""
TEMPLATE_STORAGE=""
TEMPLATE=""
BRIDGE="vmbr0"
CORES="1"
MEMORY="512"
SWAP="512"
DISK="4G"
NETWORK_MODE="dhcp"
IP_CONFIG=""
GATEWAY=""
REPO_URL="$REPO_URL_DEFAULT"
BRANCH="$BRANCH_DEFAULT"
INSTALL_PATH="$INSTALL_PATH_DEFAULT"
START_SERVICE="n"
DRY_RUN="n"
MODE="default"

info() {
  echo "[INFO] $*"
}

warn() {
  echo "[WARN] $*" >&2
}

error() {
  echo "[ERROR] $*" >&2
}

die() {
  error "$*"
  exit 1
}

confirm() {
  local question="$1"
  local default="${2:-n}"
  local suffix="[y/N]"
  local answer

  if [ "$default" = "y" ]; then
    suffix="[Y/n]"
  fi

  read -r -p "$question $suffix " answer
  answer="${answer:-$default}"

  case "$answer" in
    y|Y|yes|YES|s|S|si|SI) return 0 ;;
    *) return 1 ;;
  esac
}

confirm_create_lxc() {
  local answer

  echo
  echo "Confirmacion final"
  echo "Se va a crear un contenedor LXC nuevo:"
  echo "- CT ID: $CT_ID"
  echo "- Hostname: $HOSTNAME"
  echo "- Template: $TEMPLATE"
  echo "- Storage disco: $DISK_STORAGE"
  echo "- Bridge: $BRIDGE"
  echo "- Red: $NETWORK_MODE"
  echo "- CPU/RAM/disco: ${CORES} core(s), ${MEMORY} MB RAM, ${DISK}"
  echo "- Repo/branch: $REPO_URL / $BRANCH"
  echo
  read -r -p "Escribe yes, y, si o s para continuar: " answer

  case "$answer" in
    y|Y|yes|YES|s|S|si|SI) return 0 ;;
    *) return 1 ;;
  esac
}

prompt() {
  local question="$1"
  local default="$2"
  local answer

  read -r -p "$question [$default]: " answer
  echo "${answer:-$default}"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    die "Este instalador debe ejecutarse como root en el host Proxmox VE."
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Falta el comando requerido: $1"
}

detect_proxmox() {
  require_command pveversion

  if [ ! -d /etc/pve ]; then
    die "No existe /etc/pve. Ejecuta este script en el host Proxmox VE, no dentro de un CT ni Debian normal."
  fi

  if ! pveversion >/dev/null 2>&1; then
    die "No parece un host Proxmox VE valido."
  fi

  info "Proxmox detectado: $(pveversion | head -n 1)"
}

check_required_commands() {
  require_command bash
  require_command pct
  require_command pvesm
  require_command grep
  require_command awk
  require_command sed

  if command -v curl >/dev/null 2>&1; then
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    return
  fi

  die "Falta curl o wget."
}

parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --dry-run)
        DRY_RUN="y"
        shift
        ;;
      --advanced)
        MODE="advanced"
        shift
        ;;
      --default)
        MODE="default"
        shift
        ;;
      -h|--help)
        print_help
        exit 0
        ;;
      *)
        die "Argumento no reconocido: $1"
        ;;
    esac
  done
}

print_help() {
  cat <<EOF
ProxBot Proxmox/LXC installer

Descripcion:
  Crea un LXC Debian en un host Proxmox VE y prepara ProxBot dentro.
  No usa API de Proxmox, no usa tokens de Proxmox y no modifica CTs existentes.

Uso:
  sudo bash scripts/proxmox-lxc-install.sh
  sudo bash scripts/proxmox-lxc-install.sh --dry-run
  sudo bash scripts/proxmox-lxc-install.sh --default
  sudo bash scripts/proxmox-lxc-install.sh --advanced
  sudo bash scripts/proxmox-lxc-install.sh --help

Opciones:
  --dry-run   Muestra el plan sin crear LXC, descargar templates ni instalar nada.
  --default   Usa valores seguros y pocas preguntas.
  --advanced  Permite elegir CT ID, storage, red, recursos, repo y branch.
  --help      Muestra esta ayuda.

Este script debe ejecutarse en el host Proxmox VE.
EOF
}

choose_mode() {
  if [ "$MODE" = "advanced" ]; then
    return
  fi

  if [ "$DRY_RUN" = "y" ]; then
    return
  fi

  echo
  echo "Modo de instalacion:"
  echo "1) default - valores seguros y pocas preguntas"
  echo "2) advanced - elegir CT ID, storage, red, recursos, repo y branch"
  read -r -p "Elige modo [1]: " option
  option="${option:-1}"

  if [ "$option" = "2" ]; then
    MODE="advanced"
  else
    MODE="default"
  fi
}

next_free_ctid() {
  local id=120

  while pct status "$id" >/dev/null 2>&1; do
    id=$((id + 1))
  done

  echo "$id"
}

storage_supports_content() {
  local storage="$1"
  local content="$2"

  pvesm status --content "$content" 2>/dev/null | awk 'NR > 1 {print $1}' | grep -qx "$storage"
}

first_storage_for_content() {
  local content="$1"
  local preferred="$2"

  if [ -n "$preferred" ] && storage_supports_content "$preferred" "$content"; then
    echo "$preferred"
    return
  fi

  pvesm status --content "$content" 2>/dev/null | awk 'NR == 2 {print $1}'
}

bridge_exists() {
  local bridge="$1"
  [ -d "/sys/class/net/$bridge" ]
}

valid_ipv4() {
  local ip="$1"
  local octet
  local o1
  local o2
  local o3
  local o4

  [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || return 1

  IFS=. read -r o1 o2 o3 o4 <<< "$ip"
  for octet in "$o1" "$o2" "$o3" "$o4"; do
    [ "$((10#$octet))" -ge 0 ] && [ "$((10#$octet))" -le 255 ] || return 1
  done
}

valid_cidr() {
  local value="$1"
  local ip
  local prefix

  [[ "$value" =~ ^([^/]+)/([0-9]{1,2})$ ]] || return 1
  ip="${BASH_REMATCH[1]}"
  prefix="${BASH_REMATCH[2]}"

  valid_ipv4 "$ip" || return 1
  [ "$prefix" -ge 1 ] && [ "$prefix" -le 32 ]
}

find_debian_template() {
  local storage="$1"

  pvesm list "$storage" --content vztmpl 2>/dev/null |
    awk 'NR > 1 {print $1}' |
    grep -E 'debian-12.*standard.*\.tar\.(zst|gz|xz)$' |
    head -n 1
}

download_debian_template_if_needed() {
  if [ -n "$TEMPLATE" ]; then
    return
  fi

  TEMPLATE="$(find_debian_template "$TEMPLATE_STORAGE" || true)"

  if [ -n "$TEMPLATE" ]; then
    return
  fi

  if [ "$DRY_RUN" = "y" ]; then
    TEMPLATE="${TEMPLATE_STORAGE}:vztmpl/debian-12-standard_TEMPLATE.tar.zst"
    warn "Dry-run: no se descarga plantilla. Se usara un placeholder en el plan."
    return
  fi

  require_command pveam
  info "No se encontro template Debian 12 local. Actualizando lista de templates."
  pveam update

  local template_name
  template_name="$(pveam available --section system | awk '/debian-12.*standard/ {print $2}' | tail -n 1)"
  [ -n "$template_name" ] || die "No se encontro template Debian 12 disponible con pveam."

  info "Descargando template $template_name en storage $TEMPLATE_STORAGE"
  pveam download "$TEMPLATE_STORAGE" "$template_name"
  TEMPLATE="${TEMPLATE_STORAGE}:vztmpl/${template_name}"
}

validate_ctid() {
  [[ "$CT_ID" =~ ^[0-9]+$ ]] || die "CT ID invalido: $CT_ID"
  [ "$CT_ID" -ge 100 ] || die "CT ID demasiado bajo. Usa un ID >= 100."
  [ "$CT_ID" -le 999999999 ] || die "CT ID demasiado alto para Proxmox."

  if pct status "$CT_ID" >/dev/null 2>&1; then
    die "Ya existe un CT/VM con ID $CT_ID. No se sobrescribe nada."
  fi
}

validate_template() {
  [ -n "$TEMPLATE" ] || die "Template Debian vacio."
  [[ "$TEMPLATE" == *":vztmpl/"* ]] || die "Template invalido. Usa formato storage:vztmpl/debian-12-...tar.zst"
  [[ "$TEMPLATE" == *debian* ]] || die "El template debe ser Debian."
}

validate_storage() {
  local storage="$1"
  local content="$2"

  [ -n "$storage" ] || die "Storage vacio para contenido $content."
  storage_supports_content "$storage" "$content" || die "Storage '$storage' no soporta contenido '$content'."
}

validate_bridge() {
  bridge_exists "$BRIDGE" || die "Bridge '$BRIDGE' no existe en este host."
}

validate_resources() {
  [[ "$CORES" =~ ^[0-9]+$ ]] || die "CORES debe ser numerico."
  [[ "$MEMORY" =~ ^[0-9]+$ ]] || die "MEMORY debe ser numerico."
  [[ "$SWAP" =~ ^[0-9]+$ ]] || die "SWAP debe ser numerico."
  [[ "$DISK" =~ ^[0-9]+[GM]$ ]] || die "DISK debe tener formato como 4G o 512M."
  [ "$CORES" -ge 1 ] || die "CORES debe ser al menos 1."
  [ "$MEMORY" -ge 256 ] || die "MEMORY debe ser al menos 256 MB."
  [ "$SWAP" -ge 0 ] || die "SWAP no puede ser negativo."
}

validate_safe_inputs() {
  [[ "$HOSTNAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,62}$ ]] || die "Hostname invalido."
  [[ "$BRANCH" =~ ^[a-zA-Z0-9._/-]+$ ]] || die "Branch invalida. Evita espacios y caracteres especiales."
  [[ "$INSTALL_PATH" =~ ^/[a-zA-Z0-9._/-]+$ ]] || die "Ruta de instalacion invalida. Debe ser absoluta y simple."
  [[ "$REPO_URL" =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(\.git)?$ ]] || die "Repo URL invalida. Usa una URL https de GitHub."
}

prompt_default_config() {
  CT_ID="$(prompt "CT ID" "$(next_free_ctid)")"
  DISK_STORAGE="$(first_storage_for_content rootdir local-lvm || true)"
  TEMPLATE_STORAGE="$(first_storage_for_content vztmpl local || true)"

  [ -n "$DISK_STORAGE" ] || DISK_STORAGE="$(prompt "Storage para disco/rootfs" "local-lvm")"
  [ -n "$TEMPLATE_STORAGE" ] || TEMPLATE_STORAGE="$(prompt "Storage para templates" "local")"

  if ! bridge_exists "$BRIDGE"; then
    BRIDGE="$(prompt "Bridge de red" "vmbr0")"
  fi
}

prompt_advanced_config() {
  local default_disk_storage
  local default_template_storage

  default_disk_storage="$(first_storage_for_content rootdir local-lvm || true)"
  default_template_storage="$(first_storage_for_content vztmpl local || true)"

  CT_ID="$(prompt "CT ID" "$(next_free_ctid)")"
  HOSTNAME="$(prompt "Hostname" "$HOSTNAME")"
  DISK_STORAGE="$(prompt "Storage para disco/rootfs" "${default_disk_storage:-local-lvm}")"
  TEMPLATE_STORAGE="$(prompt "Storage para templates" "${default_template_storage:-local}")"
  TEMPLATE="$(prompt "Template Debian existente, vacio para autodetectar/descargar" "")"
  BRIDGE="$(prompt "Bridge" "$BRIDGE")"
  CORES="$(prompt "Cores" "$CORES")"
  MEMORY="$(prompt "RAM MB" "$MEMORY")"
  SWAP="$(prompt "Swap MB" "$SWAP")"
  DISK="$(prompt "Disco rootfs" "$DISK")"

  if confirm "Quieres usar IP manual en vez de DHCP?" "n"; then
    NETWORK_MODE="manual"
    IP_CONFIG="$(prompt "IP/CIDR ejemplo 192.168.1.50/24" "")"
    GATEWAY="$(prompt "Gateway" "")"
  fi

  REPO_URL="$(prompt "Repo URL" "$REPO_URL")"
  BRANCH="$(prompt "Branch" "$BRANCH")"
  INSTALL_PATH="$(prompt "Ruta de instalacion dentro del CT" "$INSTALL_PATH")"

  if confirm "Arrancar servicio proxbot al final? Requiere .env configurado." "n"; then
    START_SERVICE="y"
  fi
}

validate_config() {
  validate_ctid
  validate_storage "$DISK_STORAGE" rootdir
  validate_storage "$TEMPLATE_STORAGE" vztmpl
  validate_bridge
  validate_resources
  validate_safe_inputs

  if [ "$NETWORK_MODE" = "manual" ]; then
    [ -n "$IP_CONFIG" ] || die "IP manual vacia."
    [ -n "$GATEWAY" ] || die "Gateway vacio para IP manual."
    valid_cidr "$IP_CONFIG" || die "IP manual invalida. Usa formato IPv4/CIDR, por ejemplo 192.168.1.50/24."
    valid_ipv4 "$GATEWAY" || die "Gateway invalido. Usa una IPv4 simple."
  fi
}

show_plan() {
  echo
  echo "Plan de instalacion ProxBot LXC"
  echo "--------------------------------"
  echo "Modo: $MODE"
  echo "Dry-run: $DRY_RUN"
  echo "CT ID: $CT_ID"
  echo "Hostname: $HOSTNAME"
  echo "Template: $TEMPLATE"
  echo "Storage disco: $DISK_STORAGE"
  echo "Storage templates: $TEMPLATE_STORAGE"
  echo "Bridge: $BRIDGE"
  echo "Red: $NETWORK_MODE"
  if [ "$NETWORK_MODE" = "manual" ]; then
    echo "IP: $IP_CONFIG"
    echo "Gateway: $GATEWAY"
  fi
  echo "Cores: $CORES"
  echo "RAM: ${MEMORY} MB"
  echo "Swap: ${SWAP} MB"
  echo "Disco: $DISK"
  echo "Repo: $REPO_URL"
  echo "Branch: $BRANCH"
  echo "Ruta dentro del CT: $INSTALL_PATH"
  echo "Crear systemd: si"
  echo "Arrancar servicio al final: $START_SERVICE"
  echo
}

create_lxc() {
  local net0
  net0="name=eth0,bridge=${BRIDGE},ip=dhcp"

  if [ "$NETWORK_MODE" = "manual" ]; then
    net0="name=eth0,bridge=${BRIDGE},ip=${IP_CONFIG},gw=${GATEWAY}"
  fi

  info "Creando LXC $CT_ID"
  pct create "$CT_ID" "$TEMPLATE" \
    --hostname "$HOSTNAME" \
    --cores "$CORES" \
    --memory "$MEMORY" \
    --swap "$SWAP" \
    --rootfs "${DISK_STORAGE}:${DISK}" \
    --net0 "$net0" \
    --ostype debian \
    --unprivileged 1 \
    --onboot 1 \
    --start 0
}

start_lxc() {
  info "Arrancando LXC $CT_ID"
  pct start "$CT_ID"
}

wait_for_lxc() {
  info "Esperando a que el LXC este listo"

  for _ in $(seq 1 30); do
    if pct exec "$CT_ID" -- true >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done

  die "El LXC no esta listo para ejecutar comandos."
}

run_in_lxc() {
  pct exec "$CT_ID" -- bash -lc "$1"
}

install_inside_lxc() {
  info "Instalando dependencias dentro del LXC"
  run_in_lxc "apt-get update"
  run_in_lxc "DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git nodejs npm"

  local node_major
  node_major="$(pct exec "$CT_ID" -- node -p \"Number(process.versions.node.split('.')[0])\" 2>/dev/null || echo 0)"

  if [ "$node_major" -lt 18 ]; then
    warn "Node.js instalado es menor que 18. Instalando NodeSource 20.x dentro del LXC."
    run_in_lxc "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    run_in_lxc "DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs"
  fi

  node_major="$(pct exec "$CT_ID" -- node -p \"Number(process.versions.node.split('.')[0])\" 2>/dev/null || echo 0)"
  [ "$node_major" -ge 18 ] || die "No se pudo garantizar Node.js >= 18 dentro del LXC."

  info "Clonando ProxBot dentro del LXC"
  run_in_lxc "if [ -e '$INSTALL_PATH' ]; then echo 'La ruta $INSTALL_PATH ya existe dentro del CT.' >&2; exit 1; fi"
  run_in_lxc "git clone --branch '$BRANCH' --depth 1 '$REPO_URL' '$INSTALL_PATH'"
  run_in_lxc "cd '$INSTALL_PATH' && npm install"
  run_in_lxc "cd '$INSTALL_PATH' && [ -f .env ] || cp .env.example .env"
  run_in_lxc "cd '$INSTALL_PATH' && [ -f config.json ] || cp config.example.json config.json"
}

create_systemd_service_inside_lxc() {
  info "Creando servicio systemd dentro del LXC"

  run_in_lxc "cat > /etc/systemd/system/${SERVICE_NAME}.service <<'EOF'
[Unit]
Description=ProxBot Discord Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_PATH}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}"

  if [ "$START_SERVICE" = "y" ]; then
    warn "Arrancando servicio. Si .env no esta configurado, fallara hasta que lo edites."
    run_in_lxc "systemctl start ${SERVICE_NAME}"
  else
    info "Servicio habilitado, pero no arrancado. Configura .env antes de iniciarlo."
  fi
}

print_next_steps() {
  cat <<EOF

Instalacion preparada.

Siguientes pasos:
  pct enter $CT_ID
  cd $INSTALL_PATH
  nano .env
  npm run setup
  npm run deploy
  systemctl start $SERVICE_NAME
  systemctl status $SERVICE_NAME --no-pager -l
  journalctl -u $SERVICE_NAME -f -l

Notas:
- .env y config.json son locales dentro del CT.
- No se han rellenado tokens ni IDs de Discord.
- Si no ejecutas npm run deploy, los comandos slash nuevos no apareceran.
EOF
}

main() {
  parse_args "$@"

  echo "ProxBot Proxmox/LXC installer"
  echo
  echo "Este script debe ejecutarse en el HOST Proxmox VE como root."
  echo "Creara un contenedor LXC Debian nuevo para ProxBot."
  echo "No borra ni sobrescribe VMs/CTs existentes."
  echo

  if [ "$DRY_RUN" = "y" ]; then
    info "DRY-RUN: no changes will be made."
  fi

  require_root
  detect_proxmox
  check_required_commands
  choose_mode

  if [ "$MODE" = "advanced" ]; then
    prompt_advanced_config
  else
    prompt_default_config
  fi

  validate_config
  download_debian_template_if_needed
  validate_template
  show_plan

  if [ "$DRY_RUN" = "y" ]; then
    info "DRY-RUN: no changes will be made."
    info "DRY-RUN: skipping LXC creation."
    info "DRY-RUN: skipping installation inside CT."
    info "Dry-run completado. No se ha creado ni modificado nada."
    exit 0
  fi

  confirm_create_lxc || die "Instalacion cancelada."

  create_lxc
  start_lxc
  wait_for_lxc
  install_inside_lxc
  create_systemd_service_inside_lxc
  print_next_steps
}

main "$@"
