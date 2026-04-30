#!/usr/bin/env bash
set -e

INSTALL_DIR="/opt/proxbot"
REPO_URL="https://github.com/Caarrasco22/proxbot.git"
SERVICE_NAME="proxbot"

confirm() {
  local question="$1"
  local default="${2:-n}"
  local suffix="[s/N]"

  if [ "$default" = "s" ]; then
    suffix="[S/n]"
  fi

  read -r -p "$question $suffix " answer
  answer="${answer:-$default}"

  case "$answer" in
    s|S|si|SI|y|Y|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Este instalador debe ejecutarse como root."
    echo "Ejemplo: sudo bash scripts/install.sh"
    exit 1
  fi
}

check_distro() {
  if [ ! -f /etc/os-release ]; then
    echo "No se pudo detectar la distribucion."
    confirm "Quieres continuar de todas formas?" "n" || exit 1
    return
  fi

  . /etc/os-release
  case "${ID:-}" in
    debian|ubuntu) ;;
    *)
      echo "Distribucion detectada: ${PRETTY_NAME:-desconocida}"
      echo "Este instalador esta pensado para Debian/Ubuntu."
      confirm "Quieres continuar de todas formas?" "n" || exit 1
      ;;
  esac
}

install_packages() {
  apt update
  apt install -y git curl ca-certificates nano nodejs npm
}

prepare_install_dir() {
  if [ ! -d "$INSTALL_DIR" ]; then
    git clone "$REPO_URL" "$INSTALL_DIR"
    return
  fi

  echo "$INSTALL_DIR ya existe."
  echo "1) Actualizar con git pull"
  echo "2) Hacer backup y reinstalar"
  echo "3) Sobrescribir escribiendo SOBRESCRIBIR"
  echo "4) Cancelar"
  read -r -p "Elige una opcion [4]: " option
  option="${option:-4}"

  case "$option" in
    1)
      cd "$INSTALL_DIR"
      git pull
      ;;
    2)
      local backup_dir="/opt/proxbot-backup-$(timestamp)"
      mv "$INSTALL_DIR" "$backup_dir"
      echo "Backup creado en $backup_dir"
      git clone "$REPO_URL" "$INSTALL_DIR"
      ;;
    3)
      read -r -p "Escribe SOBRESCRIBIR para confirmar: " confirmation
      if [ "$confirmation" != "SOBRESCRIBIR" ]; then
        echo "Confirmacion incorrecta. Cancelando."
        exit 1
      fi
      rm -rf "$INSTALL_DIR"
      git clone "$REPO_URL" "$INSTALL_DIR"
      ;;
    *)
      echo "Instalacion cancelada."
      exit 0
      ;;
  esac
}

create_systemd_service() {
  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=ProxBot Discord Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"
}

main() {
  echo "Instalador guiado de ProxBot v0.2.0"
  echo
  echo "Antes de continuar necesitas:"
  echo "- Datos de Discord Developer Portal."
  echo "- Bot invitado con scopes bot y applications.commands."
  echo "- Numero de servicios que quieres anadir."
  echo "- IP/host/puerto/URL de los servicios."
  echo "- DNS local funcionando si usas dominios internos."
  echo

  confirm "Quieres continuar?" "n" || exit 0

  require_root
  check_distro
  install_packages
  prepare_install_dir

  cd "$INSTALL_DIR"
  npm install

  if confirm "Quieres ejecutar npm run setup ahora?" "s"; then
    npm run setup
  else
    if [ ! -f config.json ]; then
      npm run init-config
    fi
    echo "Recuerda crear .env manualmente antes de arrancar el bot."
  fi

  if npm run | grep -q "check-config"; then
    npm run check-config || true
  fi

  deploy_status="no ejecutado"
  if confirm "Quieres registrar comandos slash ahora con npm run deploy?" "n"; then
    if npm run deploy; then
      deploy_status="si"
    else
      deploy_status="fallo"
      echo "Revisa .env, que el bot este invitado y el scope applications.commands."
    fi
  fi

  systemd_status="no"
  if command -v systemctl >/dev/null 2>&1; then
    if confirm "Quieres crear servicio systemd para ProxBot?" "s"; then
      create_systemd_service
      systemd_status="si"

      start_default="n"
      if [ "$deploy_status" = "si" ]; then
        start_default="s"
      fi

      if confirm "Quieres arrancar ProxBot ahora?" "$start_default"; then
        systemctl start "$SERVICE_NAME"
      fi
    fi
  else
    echo "systemctl no esta disponible. Saltando systemd."
  fi

  echo
  echo "Resumen final:"
  echo "- Directorio: $INSTALL_DIR"
  echo "- .env existe: $([ -f .env ] && echo si || echo no)"
  echo "- config.json existe: $([ -f config.json ] && echo si || echo no)"
  echo "- systemd creado: $systemd_status"
  echo "- comandos registrados: $deploy_status"
  echo
  echo "Comandos utiles:"
  echo "systemctl status $SERVICE_NAME --no-pager -l"
  echo "journalctl -u $SERVICE_NAME -f -l"
  echo "systemctl restart $SERVICE_NAME"
  echo "systemctl stop $SERVICE_NAME"
}

main "$@"
