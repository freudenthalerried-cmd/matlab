# Der Prüfer der Prüfer, auditiert — eine fremde Länge schirmte hohle Schleifen ab

Stand: 2026-08-17. Vierzehntes Audit der Serie „vom Verhalten zur
Erklärung", viertes und letztes Betreiberwerkzeug: `bin/testpruefung.mjs`,
der Hohlheitsprüfer der Testfälle. Wer alle anderen prüft, verdient die
schärfste Sonde — ein blinder Fleck hier wirkt auf den gesamten
Testbestand zurück.

## Drei Befunde

**1. Die Längenzusicherungs-Regel akzeptierte jedes `.length`.** Muster 3
verlangt vor einer Schleife über eine Liste eine Zusicherung ihrer Länge.
Die Regel prüfte aber unter anderem nur, ob *irgendwo davor* `.length`
vorkam — die Längenzusicherung einer **fremden** Liste genügte. Die Sonde:

```js
assert.equal(andereListe.length, 3);      // fremde Liste
const leereListe = [].filter(Boolean);
for (const eintrag of leereListe) {        // läuft nie
  assert.ok(eintrag > 0);
}
```

Der Prüfer schwieg. Genau die Fallgestalt, für die er gebaut wurde —
verdeckt durch die Zusicherung eines Nachbarn. Jetzt muss ein Name aus dem
Schleifenausdruck **in derselben Zusicherung** stehen wie `.length` oder
`.size`. Bemerkenswert: Auf den echten Bestand von 420 Fällen erzeugt die
verschärfte Regel **null neue Verdachte** — die Längenzusicherungs-
Disziplin der früheren Runden war echt, nicht vom laxen Prüfer geschenkt.

**2. Der Nachweis lebte außerhalb des Repos.** „Gegen Probedatei
nachgewiesen" stand im Bauprotokoll — die Probedatei lag im flüchtigen
Arbeitsverzeichnis der Session und war mit jeder Umgebung weg. Der
Nachweis war ein Ereignis, kein Bestand. Jetzt liegt sie unter
`test/probe/probe.test.js` (sechs Fälle: die drei Muster, die neue
Blindstelle, eine begründete Ablehnung, ein sauberer Fall) und
`test/testpruefung-werkzeug.test.js` führt den Nachweis bei jedem
`npm test`: alle vier Verdachte gefunden, der begründete und der saubere
Fall stumm. Die Probedatei wird von `npm test` selbst nicht ausgeführt
(das Muster `test/*.test.js` greift eine Ebene tief) und vom Prüfer im
Normallauf nicht gelesen (nicht rekursiv) — sie ist reine Zielscheibe.

**3. Ein unlesbarer Ordner warf einen Stacktrace.** Wie bei den drei
Werkzeugen zuvor: Meldung statt Stacktrace, Exit 2.

## Gegenproben

Regel zurückgelockert auf „irgendein `.length` davor" → der
Nachweis-Testfall fällt. Fehlerbehandlung entfernt → der zweite fällt.
Testbestand: **422, alle grün, Prüfer ohne Verdacht** — wobei dieser Satz
jetzt mehr wiegt: Der Prüfer, der ihn liefert, ist selbst unter Test.

## Die Serie ist an einem Abschluss

Vierzehn Audits: zehn Rechenmodule (neun Befunde), vier
Betreiberwerkzeuge (zwölf Befunde in vier Runden — Auswerten, Import,
Bau, Prüfer). Einundzwanzig Befunde, alle in die optimistische Richtung:
zu gute Zahlen, zu gute Datenqualität, zu gute Wachsamkeit. Jede Schicht
des Systems — Rechnung, Vortrag, Datenpflege, Bau, Selbstprüfung — hat
jetzt ein dokumentiertes Verhaltensaudit mit Mutations-Gegenprobe.

Was der Serie als Nächstes fehlt, sind neue Eingangsdaten: echte
Herstellerantworten, echte Preislisten, echtes Suchvolumen. Die liegen
hinter den beiden Freigaben.
