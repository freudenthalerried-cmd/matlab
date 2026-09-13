# Die Oberfläche am Verhalten geprüft — und die Sonde gleich mit

Stand: 2026-08-17. Der Rechenkern hat 430 Testfälle, aber die Verdrahtung
im Template — Formular-Handler, `zeichne*`-Funktionen — lief bisher ohne
Verhaltensprobe; die Headless-Kontrolle prüfte nur, dass der Katalog beim
Laden erscheint. Diese Runde baut `npm run oberflaechenprobe`: sieben
Szenarien, die demo.html im echten Headless-Chromium ausfüllen, abschicken
und die gerenderte Antwort prüfen.

## Die sieben Szenarien — alle grün

1. Gebietsauskunft beim Laden: Ried im Innkreis steht auf der
   Ausnahmeliste, mit dem Schutzgebiets-Vorbehalt.
2. **Messwert genau 300 überschreitet 300 nicht** — die Korrektur aus
   `grenze-bei-genau-300.md`, jetzt durch die Oberfläche nachgewiesen.
3. Ein Kurzzeitwert (2 Monate) wird nicht mit dem Referenzwert
   verglichen, sondern führt zur Langzeitmessung — und die Seite behauptet
   nirgends „liegen über dem Referenzwert".
4. 450/12 führt zur Sanierungsempfehlung nach ÖNORM S 5280-3.
5. Der Materialbedarfsrechner weist die Rollenbindung aus („über dem
   Bedarf", „Teilmengen gibt es nicht").
6. Kasse mit simuliertem VIES-Dienstausfall: Die UID wird **nicht** als
   ungültig ausgewiesen, und es geht nichts hinaus.
7. Kasse mit simuliert ungültiger UID: „ungültig" steht in der Antwort.

Gegenprobe per Mutation am gebauten Artefakt: Grenze in der eingebetteten
Kopie auf `wert < REFERENZWERT` sabotiert → Szenario 2 fällt; Original
wiederhergestellt → alles grün.

## Der eigentliche Ertrag: Die Sonde hat zweimal an sich selbst gelogen

Der erste Wurf meldete sechs von sieben Szenarien grün — **und keines
davon war je gelaufen.**

**Fund 1: Die Injektion war ein stiller No-op.** Das Sondenskript wurde
per `replace('</body>', …)` eingehängt — aber demo.html endet ohne
`</body>`-Tag (in HTML zulässig, der Browser schließt implizit). Kein
Treffer, kein Fehler, keine Sonde. Exakt die Fehlerklasse aus dem
Bau-Audit (`bau-pruefte-nur-den-kern.md`, fehlender Platzhalter fällt
stumm durch), diesmal im eigenen Prüfwerkzeug. Jetzt wird angehängt statt
ersetzt — und jedes Szenario muss mit einem Marker **beweisen, dass es
gelaufen ist**; eine Probe ohne Marker gilt als Fehlschlag.

**Fund 2: Grün durch Quelltext-Kollision.** Die Erwartungen wurden im
ganzen Dokument gesucht — aber der Rechenkern steht als Quelltext in der
Seite, samt seiner String-Literale: „Es geht nichts hinaus" findet sich
dort auch, wenn nie eine Kasse abgeschickt wurde. Geprüft wird jetzt
ausschließlich der `textContent` der Zielelemente, den die Sonde zwischen
zwei Marker kopiert. Und weil auch die Marker als Skript-Quelltext in der
Seite stehen, werden sie zur Laufzeit aus zwei Hälften zusammengesetzt —
sonst fände die Auswertung die Quelle statt der Ausgabe. Das fiel im
zweiten Wurf tatsächlich auf: Alle sieben Szenarien meldeten als
„gerendert" den eigenen Skripttext.

Der dritte Wurf lief dann echt — sieben von sieben, Mutation gefangen.

## Einordnung

Fünfzehntes Verhaltensaudit, und das erste, dessen Befunde ausschließlich
im Prüfwerkzeug selbst lagen: Die Oberfläche war in Ordnung, die Sonde
nicht. Das ist kein geringerer Ertrag — eine Probe, die stumm grün zeigt,
wäre auf Dauer gefährlicher als gar keine, weil sie Wachsamkeit ersetzt
hätte. Die beiden Konstruktionsregeln (Selbstnachweis-Marker, nur
gerenderten Text prüfen) stehen jetzt als Kommentar im Werkzeug.

Die Probe läuft bewusst **nicht** in `npm test`: Sie braucht ein
installiertes Chromium, und die Testfälle dürfen von keiner
Browserinstallation abhängen. Ohne Browser bricht sie mit klarer Meldung
und Exit 2 ab — nie still.
