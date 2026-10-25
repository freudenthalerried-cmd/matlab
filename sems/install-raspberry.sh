#!/usr/bin/env bash
# PV-Monitor auf Raspberry Pi / Linux installieren, inkl. Autostart als Dienst.
#   curl -fsSL https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/main/sems/install-raspberry.sh | bash
set -euo pipefail
SRC="https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/main/sems"
DIR="$HOME/pv-monitor"
mkdir -p "$DIR"
for f in server.py sems_client.py dashboard.html; do curl -fsSL "$SRC/$f" -o "$DIR/$f"; done
python3 -m venv "$DIR/.venv"
"$DIR/.venv/bin/pip" install --quiet --upgrade goodwe
sudo tee /etc/systemd/system/pv-monitor.service >/dev/null <<UNIT
[Unit]
Description=PV-Monitor (GoodWe per WLAN)
After=network-online.target
Wants=network-online.target

[Service]
User=$USER
WorkingDirectory=$DIR
ExecStart=$DIR/.venv/bin/python $DIR/server.py --lan
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable pv-monitor
sudo systemctl restart pv-monitor
sleep 8
systemctl --no-pager --lines=5 status pv-monitor || true
echo "Fertig. Dashboard im WLAN: http://$(hostname -I | awk '{print $1}'):8080"
