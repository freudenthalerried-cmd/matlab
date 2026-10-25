#!/usr/bin/env bash
# Richtet den PV-Monitor als Dienst ein, der nach jedem Neustart automatisch läuft.
# Usage: bash sems/install-raspberry.sh [WECHSELRICHTER-IP]   (ohne IP: automatische Suche)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$DIR/.venv"
python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet --upgrade goodwe
sudo tee /etc/systemd/system/pv-monitor.service >/dev/null <<UNIT
[Unit]
Description=PV-Monitor (GoodWe per WLAN)
After=network-online.target
Wants=network-online.target

[Service]
User=$USER
WorkingDirectory=$DIR
ExecStart=$VENV/bin/python $DIR/server.py --local ${1:-} --lan
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now pv-monitor
sleep 5
systemctl --no-pager --lines=5 status pv-monitor || true
echo "Dashboard im WLAN: http://$(hostname -I | awk '{print $1}'):8080"
