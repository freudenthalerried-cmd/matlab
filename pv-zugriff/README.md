# PV-Zugriff lokal (GoodWe)

Liest den Wechselrichter **direkt im eigenen Netz**, ohne SEMS-Konto oder Passwort. Nur lesen, keine Einstellungen.

## Start (PC oder Laptop mit Python 3)
```
pip install goodwe
python pv_lokal.py
```
Danach im Browser `http://localhost:8080` öffnen. Vom Handy im selben WLAN: `http://<IP-des-PCs>:8080`.

- **Wechselrichter ist im Heim-WLAN:** Das Programm findet ihn automatisch. Klappt das nicht, die IP aus dem Router angeben: `python pv_lokal.py 192.168.x.x`.
- **Wechselrichter ist nur über „Solar-WiFi“ erreichbar:** Den PC mit „Solar-WiFi“ verbinden (Passwort meist `12345678`) und `python pv_lokal.py 10.10.100.253` starten.
- **Android ohne PC:** In der App Termux `pkg install python`, dann `pip install goodwe` und `python pv_lokal.py`.

Die Messwerte werden laufend in `pv_daten_JJJJ-MM.csv` gespeichert. So hast du deine Daten auch ohne Cloud.

## Cloud-Konto (SEMS) zurückholen
- Konto-E-Mail: `stefan.freudenthaler@aon.at`
- Passwort-Reset auf semsportal.com, die Mail im aon-Webmail suchen (auch im Spam).
- Wenn das nicht klappt: Installateur Solarier (`pv@solarier.at`) bitten, das Passwort zurückzusetzen.
