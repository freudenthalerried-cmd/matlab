# Sonnenstand – PV-App für den GoodWe-Wechselrichter

Eine HTML-Datei (`index.html`), kein Server, kein Build. Die App meldet sich direkt im
Browser beim GoodWe-SEMS-Portal an (gleiches Konto wie die SEMS-App) und zeigt die
Anlage wie SEMS: Übersicht mit Energiefluss, Diagramme (Tag/Monat/Jahr/Gesamt),
Geräte und eine eigene Auswertung (Eigenverbrauch, Autarkie, Tarife, CSV-Export).

- Aufruf: `https://raw.githack.com/freudenthalerried-cmd/matlab/<commit>/pv/index.html`
  (Link steht in der App-Zentrale). `#demo` anhängen zeigt Beispieldaten ohne Konto.
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
