# Fakten-Checker

Hört bei Gesprächen mit, erkennt prüfbare Behauptungen und zeigt in Sekunden, was stimmt: mit Zahl, Quelle und Datenstand.

## Ablauf

1. **Spracherkennung** im Browser (Web Speech API, Deutsch/Österreich). Chrome, Edge und Android-Chrome werden unterstützt.
2. **Schnellcheck** (`/api/check`): Claude findet Behauptungen im Gesprächsausschnitt und bewertet sie aus dem Modellwissen. Das dauert etwa 2–4 s.
3. **Live-Prüfung** (`/api/verify`): Startet automatisch danach. Die Websuche ist auf offizielle Quellen beschränkt (Statistik Austria, Eurostat, OECD, WHO, gv.at …), die Karte wird mit Links aktualisiert.
4. **Genauer ansehen** (`/api/detail`): Ausführliche Recherche mit Entwicklung, Vergleichen und Fallstricken bei Definitionen.

**Aufzeichnung:** „Gespräch beginnen“ öffnet das Mikrofon und schreibt alles mit Uhrzeit mit. Jedes Gespräch wird einzeln im Browser gespeichert und erscheint unter „Gespräche“: ansehen, als Textdatei exportieren (mit Prüfergebnissen und Quellen), kopieren, nachträglich komplett prüfen oder löschen. Optional wird zusätzlich das Audio aufgenommen und beim Stoppen als `.webm` gespeichert. Start ist erst möglich, wenn bestätigt wurde, dass alle Gesprächspartner Bescheid wissen.

Gleiche Behauptungen werden 24 h zwischengespeichert. Das ist der Grundstock der späteren Wissensdatenbank.

## Direkt im Browser (ohne Server)

Die Seite läuft auch als reine Webseite, z. B. über GitHub Pages:
**https://freudenthalerried-cmd.github.io/matlab/fakten-checker/**

Beim ersten Öffnen unter „Einstellungen“ den eigenen Claude-API-Schlüssel eintragen. Er wird nur im Browser dieses Geräts gespeichert und direkt an die Claude-API geschickt. Diese Variante ist für die eigene Nutzung gedacht; für eine öffentliche App gehört der Schlüssel auf einen Server (siehe unten).

Nach einem SDK-Update das Browser-Bundle neu bauen: `npm run build:sdk`.

## Mit eigenem Server

```bash
cd fakten-checker
cp .env.example .env      # API-Schlüssel eintragen (console.anthropic.com)
npm install
npm start                 # http://localhost:3000
```

Am Handy funktioniert das Mikrofon nur über HTTPS. Dafür die App hosten (z. B. Render, Railway, Fly.io) oder lokal einen Tunnel nutzen.

## Konfiguration

| Variable | Standard | Zweck |
|---|---|---|
| `ANTHROPIC_API_KEY` | – | Pflicht, bleibt am Server |
| `MODEL` | `claude-opus-5-5` | `claude-haiku-5-5` ist schneller und deutlich billiger, aber ungenauer |
| `PORT` | `3000` | |

Die vertrauenswürdigen Domains stehen in `server.js` (`TRUSTED`).

## Vor einer Veröffentlichung

- **Recht:** Aufnahmen weiterzugeben oder zu veröffentlichen, ohne dass die Sprechenden zugestimmt haben, ist strafbar (§ 120 Abs. 2 StGB); dazu kommt die DSGVO. Mitschrift und Audio bleiben deshalb auf dem Gerät. Vor einer Veröffentlichung trotzdem Rechtsberatung und eine Datenschutzerklärung einholen.
- **Kosten:** Jeder Gesprächsabschnitt löst einen Aufruf aus, jede Live-Prüfung eine Websuche. Vor dem öffentlichen Betrieb Login, Rate-Limit pro Nutzer und ein Abo-Modell einbauen.
- **Qualität:** KI kann irren. Quelle und Sicherheit werden deshalb immer angezeigt.

## Nächste Schritte

1. Wissensdatenbank: Postgres + pgvector, automatischer Import offizieller Datensätze (Statistik Austria Open Data, Eurostat API) mit Quelle und Stand. Der Schnellcheck schaut dort zuerst nach.
2. Bessere Spracherkennung mit Sprechertrennung (z. B. Deepgram oder AssemblyAI per Streaming).
3. Native App (React Native/Expo) für Android und iOS, mit Login und Abo.
4. Öffentliche API für Drittanbieter.
