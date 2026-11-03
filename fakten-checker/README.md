# Fakten-Checker

Schreibt Gespräche live mit, prüft Behauptungen in Echtzeit mit Zahl, Quelle und Gegenargument und gibt als Sparring-Partner Tipps für die eigenen Aussagen.

## Ablauf

1. **Mitschrift:** Deepgram (genau, durchgehend, mit Sprechertrennung) oder ersatzweise die Spracherkennung des Browsers.
2. **Schnellcheck:** erkennt Behauptungen und bewertet sie aus dem Modellwissen (2–4 s).
3. **Live-Prüfung:** prüft die Behauptung mit Websuche auf offiziellen Quellen (Statistik Austria, Eurostat, OECD, WHO, gv.at …).
4. **Sparring-Partner:** prüft die eigenen Aussagen, schlägt Ergänzungen, einen nächsten Satz und eine Rückfrage vor.
5. **Gespräche:** werden lokal im Browser als Transkript gespeichert und lassen sich exportieren.

## Modi und Kosten

| Modus | Schnellcheck/Sparring | Live-Prüfung/Details | Geschätzte Kosten pro Gesprächsstunde* |
|---|---|---|---|
| **Sparmodus** (Standard) | Haiku 5.5 | Sonnet 5.5, 2 Suchen | ca. 1 € |
| Genau | Opus 5.5 | Opus 5.5, 3 Suchen | ca. 6–9 € |
| Am günstigsten | Haiku 5.5 | Haiku 5.5, 2 Suchen | ca. 0,60 € |

\* inkl. Deepgram (ca. 0,45 €/h). Im Sparmodus werden nur Sätze geprüft, die nach einer Behauptung klingen (Zahlen, „Prozent“, „mehr als“ …), sichere Treffer nicht noch einmal im Web gesucht und der Sparring-Partner meldet sich höchstens alle 30 s. Die App zählt die Kosten mit (Einstellungen) und stoppt bei einem selbst gesetzten Monatslimit.

## Drei Betriebsarten

**1. Ohne Server (eigene Schlüssel im Browser)** – z. B. über GitHub Pages oder raw.githack.com. Claude- und Deepgram-Schlüssel unter „Einstellungen“ eintragen; sie bleiben nur auf dem Gerät. Ohne Claude-Schlüssel prüft der Knopf „Mit Claude prüfen“ über das Claude-Abo.

**2. Eigener Server für dich** – Schlüssel liegen am Server, nicht im Handy:
```bash
cd fakten-checker
cp .env.example .env      # ANTHROPIC_API_KEY und DEEPGRAM_API_KEY eintragen
npm install
npm start                 # http://localhost:3000
```

**3. Verkauf an Kunden** – `REQUIRE_LICENSE=true`: Jede Anfrage braucht einen Lizenzschlüssel, Verbrauch wird pro Lizenz und Monat gezählt und begrenzt (`plans.json`).

## Veröffentlichen und Geld verdienen – Schritt für Schritt

1. **Hosting (Render.com, ca. 7 $/Monat inkl. Speicher):** Repo verbinden, `render.yaml` wird erkannt. Schlüssel `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`, `STRIPE_SECRET_KEY` im Dashboard eintragen. Der Speicher unter `/data` hält Lizenzen und Verbrauch.
2. **Pakete festlegen:** `plans.json` – Name, Preis, Stunden pro Monat, Kostenobergrenze (`usdLimit`). Voreinstellung: Basis 9,90 €/5 Std., Pro 24,90 €/20 Std. – mit Sparmodus bleibt so ein deutlicher Überschuss.
3. **Stripe:** Pro Paket einen *Payment Link* für ein Monatsabo anlegen. Als Weiterleitung nach dem Kauf `https://DEINE-DOMAIN/?session_id={CHECKOUT_SESSION_ID}` eintragen. Link-URL als `url` und die Link-ID (`plink_…`) als `paymentLinkId` in `plans.json` eintragen. Nach dem Kauf holt sich die App ihren Lizenzschlüssel automatisch; gekündigte Abos werden alle 6 Stunden erkannt.
4. **Test- oder Barverkauf-Lizenzen:** `curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" -d '{"plan":"pro"}' https://DEINE-DOMAIN/api/admin/license`
5. **Rechtstexte:** `public/impressum.html`, `datenschutz.html`, `agb.html` ausfüllen (Platzhalter in [eckigen Klammern]) und prüfen lassen. Mit Anthropic, Deepgram und Stripe Auftragsverarbeitungsverträge abschließen.
6. **App installieren:** Die Seite ist eine installierbare Web-App (Manifest, Symbol, Offline-Hülle). Für den Google Play Store mit [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) als Trusted Web Activity verpacken (`bubblewrap init --manifest https://DEINE-DOMAIN/manifest.webmanifest`).

## Konfiguration

| Variable | Zweck |
|---|---|
| `ANTHROPIC_API_KEY` | Claude-Zugang |
| `DEEPGRAM_API_KEY` | Mitschrift über den Server (der Schlüssel verlässt den Server nie) |
| `MODE` | `spar` (Standard), `genau`, `guenstig` |
| `REQUIRE_LICENSE` | `true` für den Verkauf |
| `STRIPE_SECRET_KEY` | Kaufbestätigung und Abo-Status |
| `ADMIN_TOKEN` | Lizenzen von Hand anlegen |
| `DATA_DIR` | Ablage für Lizenzen und Verbrauch |

Nach einem SDK-Update das Browser-Bundle neu bauen: `npm run build:sdk`.

## Grenzen

- Lizenzen liegen in einer JSON-Datei: gut für den Start mit einem Server, ab einigen hundert Kunden auf eine Datenbank umstellen.
- Mitschrift und Gespräche liegen nur im Browser des Geräts.
- Recht: Gespräche nur nach Information aller Beteiligten mitschreiben; Weitergabe ohne Zustimmung ist strafbar (§ 120 Abs. 2 StGB).
