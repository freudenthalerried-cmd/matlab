# GoodWe SEMS Portal – API (Reverse Engineering)

Stand: Oktober 2026. Rekonstruiert aus dem SEMS+-Web-Client-Verhalten, abgeglichen mit
den aktuellen Open-Source-Clients `pygoodwe` 0.2.0 und `goodwe-sems-home-assistant`.
**Nicht live verifiziert** (Sandbox hatte keinen Zugriff auf semsportal.com) – vor
produktivem Einsatz mit eigenem Account testen.

## Zwei API-Generationen

| | Classic (alt) | SEMS+ (aktuell) |
|---|---|---|
| Login | `POST https://www.semsportal.com/api/v3/Common/CrossLogin` | `POST https://semsplus.goodwe.com/web/sems/sems-user/api/v1/auth/cross-login` |
| Passwort | Klartext | `base64(md5_hex(passwort))` |
| Basis-URL | `api` aus Login-Antwort, z. B. `https://eu.semsportal.com/api` | `api` aus Login-Antwort, Fallback `https://eu-gateway.semsportal.com/web/sems` |
| Signatur | keine | Header `X-Signature` |

Migrierte Accounts funktionieren oft nur noch mit SEMS+.

## SEMS+ Login

```http
POST /web/sems/sems-user/api/v1/auth/cross-login
Content-Type: application/json
Origin: https://semsplus.goodwe.com
Token: {"uid":"","timestamp":0,"token":"","client":"semsPlusWeb","version":"","language":"en"}
X-Signature: <signatur mit leerem uid/token>

{"account":"<mail>","pwd":"<base64(md5_hex)>","agreement":1,"isChinese":false,"isLocal":false}
```

Erfolg: `code` ∈ `0`, `"0"`, `"00000"`. `data` = Token-Objekt (`uid`, `token`, `timestamp`,
`client`, …), `api` = regionale Basis-URL.

## Authentifizierte Requests

- `Token`: das komplette `data`-Objekt aus dem Login als JSON-String
- `X-Signature`: `base64( sha256_hex("{ms}@{uid}@{token}") + "@" + ms )`, `ms` = Epoch in Millisekunden

## Fehlercodes

| Code | Bedeutung |
|---|---|
| `GY0429` / HTTP 429 | Rate-Limit → mind. 60 s warten, exponentiell steigern |
| `100002`, `C0602` | Token abgelaufen → neu einloggen |
| HTTP 401 / 403 | Session ungültig / keine Berechtigung |

## Endpunkte (relativ zur Basis-URL)

| Methode | Pfad | Parameter | Inhalt |
|---|---|---|---|
| POST | `/sems-plant/api/portal/stations/page` | `{"current":1,"size":100}` | Anlagenliste → `dataList[].id` |
| GET | `/sems-plant/api/stations/device/all-status?stationId=` | | Geräte je Typ (`INVERTER`, `SMART_METER`, `BATTERY_RACK`, `DONGLE`, `EV_CHARGER`, …) → `deviceDetailList[].statusDetailList[].snList` |
| GET | `/sems-plant/api/stations/flow?stationId=` | | Energiefluss PV/Netz/Last/Batterie |
| GET | `/sems-plant/api/equipments/{sn}/telemetry?deviceType=&pwId=` | | Live-Messwerte (Gruppen → `factors[]` mit `code`/`data`) |
| GET | `/sems-plant/api/equipments/{sn}/telecounting?deviceType=&pwId=` | | Zählerstände |
| POST | `/sems-plant/api/stations/statistics` | `stationId, isReport, items[], dimension, startTime, endTime` | Statistik (Tag/Monat/Jahr) |
| POST | `/sems-plant/api/stations/production` | wie statistics | Ertrag/Ersparnis |
| GET | `/sems-remote/api/ev-charger/control-item-content-list/{sn}` | | Wallbox-Modi |
| POST | `/sems-remote/api/ev-charger/{command}` | | Wallbox steuern |

Statistik-`items`: `proSystemTotalStats` (Erzeugung), `proPurchaseStats` (Bezug),
`proGridStats` (Einspeisung), `proConsumStats` (Verbrauch), `proSelfConsumStats`
(Eigenverbrauch), `proCharStats` / `proDischarStats` (Batterie).

### Classic (Fallback)

`POST {api}/v2/PowerStation/GetMonitorDetailByPowerstationId` mit `{"powerStationId": "<id>"}`,
Header `Token` = Login-`data` als JSON. Liefert alles in einem Objekt (`info`, `kpi`,
`powerflow`, `inverter[]`, `soc`, …).

## Client

```bash
export SEMS_USER='mail@example.com' SEMS_PASSWORD='...'
python3 sems/sems_client.py stations
python3 sems/sems_client.py flow <station_id>
python3 sems/sems_client.py telemetry <station_id>
python3 sems/sems_client.py stats <station_id>
python3 sems/sems_client.py legacy <station_id>   # alte API
```

Nur Python-Standardbibliothek. Polling nicht öfter als alle 5 min (Rate-Limit).

## Dashboard (eigenes SEMS-Portal)

```bash
export SEMS_USER='mail@example.com' SEMS_PASSWORD='...'
python3 sems/server.py          # → http://127.0.0.1:8080
python3 sems/server.py --demo   # ohne Account, mit Beispieldaten
```

- `server.py` meldet sich bei SEMS+ an, normalisiert die Antworten und cached sie 5 min
  (Rate-Limit). Er läuft nur auf `127.0.0.1`, Zugangsdaten bleiben lokal.
- `dashboard.html`: Kennzahlen, animierter Energiefluss (PV, Haus, Netz, Akku),
  Tagesbilanz als Balkendiagramm (7/30/365 Tage) und Geräteliste. Ohne Server
  (z. B. direkt geöffnet) läuft automatisch der Demo-Modus.
- Lokaler Server statt direkter Browser-Abfrage: Die SEMS-API erlaubt keine Aufrufe
  von fremden Webseiten (CORS), und die Zugangsdaten sollen nicht im Browser liegen.
- Vorzeichen (unverifiziert): `pGrid > 0` = Einspeisung, `pBat > 0` = Laden. Falls die
  Pfeile verkehrt laufen, in `renderLive()` in `dashboard.html` umdrehen.

## Direkt zum Wechselrichter (WLAN, ohne Cloud) – empfohlen

GoodWe-Wechselrichter mit WiFi-Stick antworten im Heimnetz auf UDP-Port 8899
(Bibliothek [`goodwe`](https://pypi.org/project/goodwe/)). Vorteile: Live-Werte alle
15 s, keine Zugangsdaten, nichts verlässt das Heimnetz.

### Installation (einmalig, danach alles automatisch)

**Windows:** Windows-Taste + X → „Terminal“ → einfügen → Enter:
```powershell
irm https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/main/sems/install-windows.ps1 | iex
```
Installiert bei Bedarf Python, lädt das Programm nach `%LOCALAPPDATA%\PV-Monitor`,
legt Autostart und das Desktop-Symbol „PV-Monitor“ an und öffnet das Dashboard. Die
Firewall-Abfrage mit „Zulassen“ bestätigen (für den Zugriff vom Handy).

**Raspberry Pi / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/freudenthalerried-cmd/matlab/main/sems/install-raspberry.sh | bash
```

### Was beim ersten Start passiert

1. Der Server sucht den Wechselrichter im WLAN (Broadcast UDP 48899) und speichert ihn.
2. Findet er nichts, zeigt das Dashboard die **Einrichtung**: IP eintragen oder suchen,
   optional SEMS-Login. Die Angaben werden geprüft und erst bei Erfolg gespeichert.
3. Ab dann startet alles automatisch und meldet sich selbst an. Über ⚙ im Dashboard
   lässt sich die Einrichtung jederzeit ändern.

Gespeichert in `%APPDATA%\PV-Monitor` bzw. `~/.config/PV-Monitor`: `config.json`
(Wechselrichter-IP, SEMS-E-Mail und **nur der Passwort-Hash**, den SEMS beim Login
verlangt; nicht das Klartext-Passwort), `verlauf.db` und `server.log`. Achtung: Mit dem
Hash kann man sich trotzdem bei SEMS anmelden, die Datei also nicht weitergeben.

### Manuell / Optionen

`python3 sems/server.py [--lan] [--local IP[:Port]] [--demo] [--search]`
- `--lan`: Dashboard im ganzen WLAN erreichbar, z. B. am Handy unter
  `http://<IP des PCs/Pi>:8080` (steht beim Start in der Konsole bzw. im Log).
- `--local` legt die Quelle fest (ohne IP: automatische Suche); die Einrichtung im
  Dashboard ist dann gesperrt.

### Eigener Verlauf

Der Server liest alle 30 s und summiert PV, Verbrauch, Einspeisung, Netzbezug und
Akku pro Tag in `sems/verlauf.db` (SQLite). Daraus entstehen die Tagesbalken, ganz
ohne Cloud. Der Verlauf beginnt mit dem ersten Start; Lücken über 15 min (PC aus)
werden nicht hochgerechnet. Mit `SEMS_USER`/`SEMS_PASSWORD` kommt der Verlauf
stattdessen aus der SEMS-Cloud (inkl. Vergangenheit).

### Wechselrichter ins WLAN bringen

Falls `--search` nichts findet, ist der WiFi-Stick nicht im Heim-WLAN:
1. Mit dem WLAN `Solar-WiFi…` verbinden (Passwort meist `12345678`).
2. Im Browser `10.10.100.253` öffnen (Login `admin`/`admin`) oder die App „SolarGo“
   verwenden und dort das Heim-WLAN eintragen (nur 2,4 GHz).
3. Im Router eine feste IP für den Wechselrichter vergeben.

Hinweis: Manche neuere Sticks (z. B. WiFi/LAN Kit-20) sprechen nur Modbus-TCP auf
Port 502. Dann den Port mit angeben: `--local 192.168.1.50:502`.

### Vorzeichen

Laut `goodwe`-Bibliothek ist `active_power` > 0 = Einspeisung und `pbattery1` > 0 =
Entladen; das Dashboard rechnet um auf Akku > 0 = Laden.
