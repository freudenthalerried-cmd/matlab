# Sonnenstand – PV-App für den GoodWe-Wechselrichter

Oberfläche wie SEMS: Übersicht mit Energiefluss, Diagramme (Tag/Monat/Jahr/Gesamt),
Geräte und eine eigene Auswertung (Eigenverbrauch, Autarkie, Tarife, CSV-Export).
Zwei Datenquellen, dieselbe `index.html`:

1. **Lokal, ohne Konto (bevorzugt):** `server.py` läuft zu Hause (PC oder Raspberry), liest den
   Wechselrichter direkt im Heimnetz (Bibliothek `goodwe`, UDP 8899 bzw. Modbus-TCP 502), speichert
   Minutenwerte und Tagessummen in SQLite und liefert die Oberfläche unter `http://<PC>:8080` aus.
   Die Seite erkennt das selbst (`api/setup` antwortet) und braucht dann keine Anmeldung.
   Voraussetzung: Der WLAN-Stick des Wechselrichters ist im Heim-WLAN (einmalig über den Hotspot
   „Solar-WiFi…“, Browser 10.10.100.253, admin/admin, oder die App SolarGo; nur 2,4 GHz; feste IP im Router).
   Installation unter Windows: `pv/install-windows.ps1` (Autostart ohne Fenster, Desktop-Verknüpfung).
   Daten in `%APPDATA%\PV-Monitor` (`config.json`, `sonnenstand.db`, `server.log`).
   Test ohne Gerät: `python server.py --demo --port 8081`.
2. **SEMS-Cloud:** Die Seite meldet sich direkt im Browser beim GoodWe-SEMS-Portal an (siehe unten).

- Aufruf der Cloud-Variante: `https://raw.githack.com/freudenthalerried-cmd/matlab/<commit>/pv/index.html`
  (Link steht in der App-Zentrale). `#demo` anhängen zeigt Beispieldaten ohne Konto.

## Lokale API (`server.py`)

| Aufruf | Inhalt |
|---|---|
| `GET /api/setup` | Status: `local`, `configured`, `inverter`, `model`, `sn`, `error`, `lastOk`, `lan_url` |
| `POST /api/setup` `{inverter, pvKwp?, batKwh?}` · `POST /api/setup/search` | Wechselrichter prüfen und speichern · im Netz suchen |
| `GET /api/flow` | Live: `pv, last, netz (>0 Einspeisung), bat (>0 Entladen), soc` in kW / % |
| `GET /api/curve?date=` | Minutenmittel eines Tages |
| `GET /api/stats?dim=day\|month\|year&from=&to=` | Energien je Zeitraum (kWh): `pv, last, einsp, bezug, eigen, laden, entladen` |
| `GET /api/devices` · `GET /api/raw` | Wechselrichter, Batterie, GoodWe-Zähler · alle Rohwerte |

Smart Meter: Hängt ein GoodWe-Zähler (GM1000/GM3000) am Wechselrichter, liefert der Wechselrichter
Hausverbrauch und Netzleistung mit (`house_consumption`, `active_power`, `meter_*`). Ein Zähler des
Netzbetreibers (Kundenschnittstelle) wäre eine eigene, zweite Quelle, noch nicht gebaut.
- Zugangsdaten bleiben am Gerät: gespeichert wird nur der Passwort-Hash, den SEMS+
  beim Login verlangt (base64(md5)), plus das Sitzungs-Token. Nichts geht an Dritte.
- Die SEMS-Server erlauben Browser-Aufrufe (`Access-Control-Allow-Origin: *`), darum
  braucht es keinen Zwischenserver.

## API (SEMS+, Stand 11/2026, aus `sems/README.md` und `sems-plus-ts`)

| Zweck | Aufruf |
|---|---|
| Login | `POST https://semsplus.goodwe.com/web/sems/sems-user/api/v1/auth/cross-login` |
| Anlagen | `POST {api}/sems-plant/api/portal/stations/page` `{current,size}` |
| Anlageninfo | `POST {api}/sems-plant/api/app/v2/stations/basic/info?stationId=` |
| Live-Fluss | `GET {api}/sems-plant/api/stations/flow?stationId=` |
| Minutenkurve | `POST {api}/sems-plant/api/v1/hems/power/statisticsAndPreV2` `{stationId,items,timeScale:1,timeZone,startTime,endTime}` |
| Statistik | `POST {api}/sems-plant/api/stations/statistics` `{stationId,isReport:false,items,dimension:day|month|year,startTime,endTime}` (nur innerhalb eines Kalenderjahres) |
| Geräte | `GET …/stations/device/all-status`, `POST …/web/device/station/page`, `GET …/equipments/{sn}/telemetry|telecounting` |

Header je Anfrage: `Token` = Login-`data` als JSON, `X-Signature` = base64(sha256hex(`{ms}@{uid}@{token}`)+`@{ms}`).
Vorzeichen laut Portal: `pGrid` > 0 Einspeisung, `pBat` > 0 Entladen. Beides lässt sich in
den Einstellungen der App umdrehen, falls die Anlage es anders meldet.

Fallback für alte Konten: klassische API (`/api/v3/Common/CrossLogin`,
`/v2/PowerStation/GetMonitorDetailByPowerstationId`) – nur Übersicht und Geräte.

## Offen

- Noch nicht mit dem echten Konto getestet (Passwort-Rücksetzung läuft, siehe
  App-Zentrale „PV-Zugriff GoodWe“). Anfrageformat und Fehlercodes wurden gegen die
  Live-Server geprüft (falsche Zugangsdaten → `100005`).
