#!/usr/bin/env bash
# Startet die fiktive demo-handwerk.at lokal mit nginx (Ports 80/443 auf 127.0.0.1, braucht root).
#   ./setup.sh [server|server-vorher]   (Standard: server = aktueller Stand)
# Erzeugt bei Bedarf eine lokale Demo-CA + Zertifikat in tls/ (nicht im Git).
set -euo pipefail
cd "$(dirname "$0")"
SRV="${1:-server}"
if [ ! -f tls/demo-handwerk.crt ]; then
  mkdir -p tls
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=Seitencheck Demo-CA" \
    -keyout tls/ca.key -out tls/ca.pem 2>/dev/null
  openssl req -newkey rsa:2048 -nodes -subj "/CN=demo-handwerk.at" \
    -keyout tls/demo-handwerk.key -out tls/demo-handwerk.csr 2>/dev/null
  printf "subjectAltName=DNS:demo-handwerk.at,DNS:www.demo-handwerk.at\nbasicConstraints=CA:FALSE\nextendedKeyUsage=serverAuth\n" > tls/ext.cnf
  openssl x509 -req -in tls/demo-handwerk.csr -CA tls/ca.pem -CAkey tls/ca.key -CAcreateserial \
    -days 90 -extfile tls/ext.cnf -out tls/demo-handwerk.crt 2>/dev/null
fi
for d in server server-vorher; do [ -f "$d/run/nginx.pid" ] && nginx -p "$PWD/$d/" -c nginx.conf -s stop 2>/dev/null || true; done
sleep 0.5
mkdir -p "$SRV/run/tmp"
nginx -p "$PWD/$SRV/" -c nginx.conf
echo "demo-handwerk.at läuft ($SRV). Scannen mit: node projekt.js ... --demo --dns demo/demo-handwerk/$SRV/dns.json --ca demo/demo-handwerk/tls/ca.pem"
