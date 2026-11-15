# GoodWe-Monitor

Lokales Web-Dashboard für GoodWe-Wechselrichter mit Batterie. Liest PV-Leistung,
Batterie (Ladestand, Leistung, Temperatur), Netz und Hausverbrauch direkt im
Heimnetz aus – ohne Cloud. Es werden nur Werte gelesen, keine Einstellungen geändert.

## Voraussetzungen

- PC/Laptop/Raspberry Pi im **selben WLAN/Netzwerk** wie der Wechselrichter
- Python 3.9 oder neuer

## Start

```
pip install goodwe
python app.py
```

Dann im Browser `http://localhost:8080` öffnen. Vom Handy im selben WLAN:
`http://<IP-des-PCs>:8080`.

Wird der Wechselrichter nicht automatisch gefunden, seine IP im Router nachsehen
(Geräteliste, Name meist `Solar-WiFi…` oder `GW…`) und direkt angeben:

```
python app.py --host 192.168.1.50
```

Weitere Optionen: `--port 8080`, `--interval 5` (Sekunden), `--demo` (Testdaten).

## Fehlersuche

- **Keine Verbindung / Timeout:** IP prüfen; Firewall muss UDP-Port 8899 ausgehend erlauben.
- **Gäste-WLAN / Client-Isolation** verhindert den Zugriff – PC und Wechselrichter müssen im selben Netz sein.
- Feste IP für den Wechselrichter im Router vergeben, damit `--host` dauerhaft stimmt.
