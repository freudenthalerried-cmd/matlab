# Flohmarkt.at Inserate verlängern

Kleines Skript, das ablaufende Inserate auf [flohmarkt.at](https://www.flohmarkt.at)
automatisch verlängert. Für jede Inserat-ID öffnet es
`https://www.flohmarkt.at/inserat/<ID>/login`, meldet sich mit dem Passwort an und
klickt auf **„verlängern"**.

> **Wichtig:** Dieses Skript muss dort laufen, wo `www.flohmarkt.at` erreichbar ist
> (z. B. dein eigener Rechner oder Server). In der Claude-Code-Web-Umgebung, in der
> es erstellt wurde, ist die Domain per Netzwerk-Policy gesperrt – dort funktioniert
> es nicht.

## Woher kommen die Inserat-IDs?

Die IDs stehen in den Erinnerungs-Mails von `info@flohmarkt.at`
(Betreff: *„Ihr Inserat laeuft morgen ab!"*), Zeile *„Inserat ID-Kennung: …"*, und
im Link `.../inserat/<ID>/login`.

Die aktuell bekannten IDs sind in [`inserate.txt`](./inserate.txt) hinterlegt.

## Einrichtung

```bash
cd flohmarkt-renew
npm install
npx playwright install chromium   # einmalig, lädt den Browser
```

## Verwendung

Passwort als Umgebungsvariable setzen (nicht im Code speichern!) und starten:

```bash
export FLOHMARKT_PASSWORD='dein-passwort'

# IDs aus inserate.txt verlängern:
node renew.mjs

# oder IDs direkt übergeben:
node renew.mjs 5473679 5473680

# oder per Umgebungsvariable:
FLOHMARKT_IDS="5473679,5473680" node renew.mjs
```

### Erst testen (empfohlen)

`DRY_RUN` loggt sich nur ein und klickt **nicht** auf verlängern – so kannst du
prüfen, ob Passwort und Ablauf stimmen:

```bash
DRY_RUN=true node renew.mjs
```

Zum Zuschauen den Browser sichtbar machen:

```bash
HEADLESS=false node renew.mjs
```

## Konfiguration (Umgebungsvariablen)

| Variable            | Pflicht | Bedeutung                                                        |
|---------------------|:-------:|------------------------------------------------------------------|
| `FLOHMARKT_PASSWORD`| ja      | Passwort für den Inserat-Login                                   |
| `FLOHMARKT_IDS`     | –       | IDs, komma-/leerzeichengetrennt (überschreibt `inserate.txt`)    |
| `IDS_FILE`          | –       | Pfad zur ID-Datei (Default: `inserate.txt` neben dem Skript)     |
| `DRY_RUN`           | –       | `true` = nur einloggen, nicht verlängern                         |
| `HEADLESS`          | –       | `false` = Browser sichtbar                                       |
| `HTTPS_PROXY`       | –       | wird an den Browser weitergereicht                               |

## Diagnose

Findet das Skript kein „verlängern", schlägt der Login fehl oder ist der Erfolg
nicht eindeutig, legt es Screenshot + HTML unter `diagnostics/` ab. Falls
flohmarkt.at die Beschriftung/Struktur ändert, lassen sich damit die Selektoren in
`renew.mjs` (Abschnitt *„verlängern finden und klicken"*) leicht anpassen.

## Regelmäßig ausführen (optional)

Beispiel-Cron (täglich um 08:00, Passwort z. B. aus einer geschützten Datei):

```cron
0 8 * * *  cd /pfad/zu/flohmarkt-renew && FLOHMARKT_PASSWORD="$(cat ~/.flohmarkt_pw)" /usr/bin/node renew.mjs >> renew.log 2>&1
```

## Hinweis zu den Selektoren

Da die Login-Seite bei der Erstellung nicht direkt inspiziert werden konnte
(Domain gesperrt), sind die Selektoren bewusst tolerant gehalten
(Passwortfeld = `input[type=password]`, Verlängern = Text enthält „erläng").
Beim ersten echten Lauf am besten mit `HEADLESS=false` bzw. `DRY_RUN=true`
kontrollieren und die Selektoren bei Bedarf feinjustieren.
