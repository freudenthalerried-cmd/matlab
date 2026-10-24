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
