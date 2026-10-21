# Fakten-Checker

Hört bei Gesprächen mit, erkennt prüfbare Behauptungen und zeigt in Sekunden, was stimmt: mit Zahl, Quelle und Datenstand.

## Ablauf

1. **Spracherkennung** im Browser (Web Speech API, Deutsch/Österreich). Chrome, Edge und Android-Chrome werden unterstützt.
2. **Schnellcheck** (`/api/check`): Claude findet Behauptungen im Gesprächsausschnitt und bewertet sie aus dem Modellwissen. Das dauert etwa 2–4 s.
3. **Live-Prüfung** (`/api/verify`): Startet automatisch danach. Die Websuche ist auf offizielle Quellen beschränkt (Statistik Austria, Eurostat, OECD, WHO, gv.at …), die Karte wird mit Links aktualisiert.
4. **Genauer ansehen** (`/api/detail`): Ausführliche Recherche mit Entwicklung, Vergleichen und Fallstricken bei Definitionen.

Gleiche Behauptungen werden 24 h zwischengespeichert. Das ist der Grundstock der späteren Wissensdatenbank.

## Starten

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

- **Recht:** Fremde Gespräche aufzunehmen ist heikel (§ 120 StGB, DSGVO). Die App speichert kein Audio, trotzdem gehört eine Rechtsberatung, eine Datenschutzerklärung und ein klarer Hinweis an Gesprächspartner dazu.
- **Kosten:** Jeder Gesprächsabschnitt löst einen Aufruf aus, jede Live-Prüfung eine Websuche. Vor dem öffentlichen Betrieb Login, Rate-Limit pro Nutzer und ein Abo-Modell einbauen.
- **Qualität:** KI kann irren. Quelle und Sicherheit werden deshalb immer angezeigt.

## Nächste Schritte

1. Wissensdatenbank: Postgres + pgvector, automatischer Import offizieller Datensätze (Statistik Austria Open Data, Eurostat API) mit Quelle und Stand. Der Schnellcheck schaut dort zuerst nach.
2. Bessere Spracherkennung mit Sprechertrennung (z. B. Deepgram oder AssemblyAI per Streaming).
3. Native App (React Native/Expo) für Android und iOS, mit Login und Abo.
4. Öffentliche API für Drittanbieter.
