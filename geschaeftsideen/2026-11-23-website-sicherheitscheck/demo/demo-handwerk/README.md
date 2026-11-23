# Demo „demo-handwerk.at“ (fiktiv)

Lokale Testseite der erfundenen Tischlerei Huber GmbH mit typischen Mängeln.
- `server-vorher/` – Ausgangszustand (Note F), `server/` – nach dem Fix, `../../kunden/2026-001-…/aenderungen.diff` – alle Änderungen
- Start (root, nginx): `./setup.sh server-vorher` oder `./setup.sh server`
- Scan: `node projekt.js neu "Tischlerei Huber GmbH" demo-handwerk.at --demo --dns demo/demo-handwerk/server-vorher/dns.json --ca demo/demo-handwerk/tls/ca.pem --wp-latest 6.8.3`

Mitgelieferte Fremdsoftware: jQuery 3.7.1 (MIT), Klaro 0.7.22 (BSD-3), Inter-Schrift (OFL) – Lizenzdateien jeweils daneben.
