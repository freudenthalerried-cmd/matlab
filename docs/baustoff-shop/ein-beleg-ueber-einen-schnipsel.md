# Ein Beleg über einen Schnipsel

**9. September 2026, nachts.** Zwei Runden zuvor bekam `bestellung.php` seine
Zeitzone. Der Befund war scharf: Die Journaldatei kam aus der ungesetzten
Zeitzone des Hosts, der Stempel aus UTC, und jede Bestellung zwischen
Mitternacht und 01:00 Uhr trug das Datum des Vortags.

Gezeigt habe ich das mit einem eigenen kleinen PHP-Schnipsel — sechs Zeilen,
die `date('Y')` und `gmdate('c')` nebeneinanderstellen. Der Schnipsel lief,
die Zahlen stimmten, die Berichtigung ging hinaus.

> **Ein Beleg über einen Schnipsel ist ein Beleg über den Schnipsel.**

An der echten Kette — Klick, Empfangsskript, Ablage — hat den Stempel niemand
gemessen. `npm run bestellprobe` fährt diese Kette seit dem 4. September in
einem Befehl, mit echtem PHP und echtem Browser, und prüfte fünf Dinge: dass
die Kasse antwortet, dass die Ablage außerhalb des Webverzeichnisses liegt,
was in der Zeile steht, und dass aus ihr ein Angebot wird. **Der Zeitpunkt in
derselben Zeile war nicht darunter.**

---

## Die sechste Prüfung

Sie fragt drei Dinge, und keines davon ist die Schreibweise:

- Trägt der Stempel einen **Zonenversatz**? Ohne ihn wäre er eine Ortszeit
  ohne Ort — er käme durch jede Datumsprüfung und wäre trotzdem nicht
  vergleichbar.
- Nennt er denselben **Kalendertag** wie `geschaeftstag()`?
- Meint er denselben **Augenblick**, den seine eigene Zeichenkette sagt?
  Gemessen, indem der Kalender dieses Betriebs aus dem geparsten Zeitpunkt
  denselben Stempel bauen muss.

Dazu ein vierter Griff, der nichts kostet: Die Jahreszahl im Dateinamen muss
die des Stempels sein. Sie entscheidet die fortlaufende Nummer und damit, ab
wann die sieben Jahre des § 132 BAO laufen.

Am laufenden PHP:

```
✓ Der Stempel nennt den Geschäftstag: 2026-09-09T20:39:18+02:00
```

**Gegengeprobt** an der echten Kette, mit der Zeitzone des Skripts auf UTC
gestellt:

```
✗ PHP stempelt 2026-09-09T18:39:29+00:00, der Kalender dieses Betriebs
  2026-09-09T20:39:29+02:00 — zwei Uhren
```

Damit ruft `zeitstempel` erstmals jemand außerhalb der Tests. Der Eintrag im
Register der ungerufenen Ausfuhren ist gestrichen — und der Prüfer hat das
selbst verlangt: *„wird inzwischen gerufen — der Eintrag entschuldigt einen
Zustand, den es nicht mehr gibt."*

---

## Und eine Behauptung von mir, die nicht stimmte

Der Grund, mit dem `zeitstempel` vor einer Stunde ins Register kam, lautete:
Die JS-Ablage lege mit einem **Tag** ab, und damit fehle ihr die Zeitfolge
nach § 131 Abs 1 Z 2 BAO — zwei Einträge desselben Tages stünden ohne
Reihenfolge.

**Das ist falsch.** Die Antwort steht in derselben Datei, zwölf Zeilen über
der, die ich gelesen hatte. `FELDER_DER_ABLAGE` führt als **erstes** Feld:

```
lfd: {
  verlangt: true,
  grundlage: '§ 131 Abs 1 Z 2 BAO',
  zweck: 'Eintragungen der Zeitfolge nach — die laufende Nummer macht
          Lücken und Umsortierungen sichtbar',
}
```

Sie wird beim Anhängen vergeben, steht in jeder Journalzeile, und beim
Einlesen hält `src/speicher.js` sie Zeile für Zeile gegen ihre Position:
`lfd ${eintrag.lfd} statt ${ablage.eintraege.length + 1}`. Die Zeitfolge ist
geführt, und der Tag im `zeitpunkt` ist das Ausstellungsdatum nach § 11 UStG
und muss kein Zeitstempel sein.

> **Ich habe eine Lücke behauptet, ohne die Stelle zu lesen, die sie
> schließt.** Dieselbe Bewegung, die dieses Verzeichnis sonst an anderen
> findet — nur diesmal in einer Begründung, die ich selbst als Pflichtgrund
> in ein Register geschrieben habe.

Zurückgenommen mit ⚠️-Kopf im Rundendokument der Vorrunde. Der Fund bleibt
davon unberührt: `zeitstempel` war ungerufen, und der Prüfer hatte ihn nur
deshalb nicht gefunden, weil sein Name in einem Muster vorkam.

---

## Die Zahl, die an zwei Stellen steht

In derselben Runde kam `frachtProBestellungNetto: 75.5` in die Zielgrößen.
Der Hinweis daneben sagt, woher sie kommt: die Pauschale von Poschacher aus
`data/lieferanten.json`.

**Ein Hinweis ist keine Prüfung** — und diese Runde hat gerade vorgeführt, was
aus einer Berichtigung wird, die nur an einer der beiden Stellen ankommt.

Seit heute hält eine Probe die beiden gegeneinander. Sie rät den Lieferanten
nicht, sondern nimmt ihn aus dem Katalog, und sie prüft die Bedingung mit,
unter der eine **feste** Fracht je Bestellung überhaupt zulässig ist: Gäbe es
eine Frei-Haus-Schwelle, fiele die Pauschale nicht bei jeder Lieferung an, und
die Zielrechnung wäre zu hoch statt zu niedrig. Poschacher hat keine.

Gegengeprobt mit 70,00 €:

```
zielgroessen.json rechnet mit 70 €, poschacher verlangt 75.5 €
```

---

## Und ein Mindestmaß, das mitwachsen muss

`pruefe-pruefer` hält jeden Prüfer gegen ein Mindestmaß, damit „0 von 0" nicht
wie Grün aussieht. Für die Bestellprobe stand dort **5**. Sie prüft jetzt
sechs Dinge — und mit einem Mindestmaß von fünf wäre der Verlust der neuen
Prüfung wieder unsichtbar. Nachgezogen auf 6.

*Ein Mindestmaß, das dem Umfang nicht folgt, verliert seinen Sinn.*

---

## Was das nicht löst

Die Bestellprobe misst den Stempel zu der Zeit, zu der sie läuft. Der
gefährliche Fall — eine Bestellung um 00:30 Uhr, an einem 1. Jänner — lässt
sich so nicht herbeiführen: Die Uhr des Rechners ist nicht zu stellen, und ein
Skript, das die Zeit vortäuscht, prüfte wieder sich selbst. Was gemessen ist,
ist die **Kette**: dass beide Uhren dieselbe sind. Dass sie an der Grenze
richtig entscheiden, zeigen die Testfälle des Kalenders — an gestellten
Zeitpunkten, im Hellen benannt.
