# Der Beleg, den niemand aufhob

**11. September 2026. Runde 37.**

## Der Fund

Die Betriebskette führt neun Schritte. Der letzte heißt:

> *Beleg und Journal bleiben sieben Jahre erhalten.*

Das Journal gab es. Den Beleg nicht.

`npm run vorgang -- --ablegen` schrieb eine Zeile ins Journal und druckte den
Beleg auf den Bildschirm. Danach war er fort — kein Ordner, keine Datei, keine
Kopie.

> **Was der Kunde bekommt, existierte nach dem Schließen des Fensters nicht
> mehr.**

Und das ist die unmittelbare Folge der Runde davor. Sie nahm den vollen
Belegtext aus dem Journal, mit der richtigen Begründung: Eine Journalzeile ist
keine Urkunde, und was dort steht, steht sieben Jahre samt der Anschrift des
Kunden ein zweites Mal. **Nur wurde er nirgendwo sonst hingelegt.** Eine
Verbesserung, die eine Lücke aufreißt, weil niemand fragt, wo die Sache denn
jetzt hingehört.

§ 132 BAO verlangt die **Belege** sieben Jahre, nicht die Aufzeichnung über
sie; § 11 Abs 2 UStG verlangt vom Aussteller eine Durchschrift oder Abschrift
jeder Rechnung.

## Was geändert wurde

Neben dem Journal liegt je Geschäftsjahr `ablage/belege-2026/`, und darin steht
je abgelegtem Beleg **eine Datei mit genau dem Text, der hinausgeht**.

| | |
| --- | --- |
| Name der Datei | die Belegnummer — `RE-2026-0001.txt` |
| ohne Nummernkreis | die Vorgangsnummer — `AB-2026-0102.txt` |
| Schreibweise | `flag: 'wx'` — eine bestehende Datei hält den Lauf an |
| Reihenfolge | erst das Papier, dann die Zeile darüber |
| neues Journalfeld | keines — der Pfad folgt aus Art, Nummer und Jahr |

Der Name ist die Belegnummer, weil danach sucht, wer die Akte nach dem Papier
durchsucht. Für die Auftragsbestätigung, die nach `ARTEN` bewusst keinen
Nummernkreis führt, ist es die Vorgangsnummer — dieselbe Rückführung, die das
Verzeichnis dort schon nennt (§ 131 Abs 1 Z 5 BAO).

**`wx` ist die ganze Sperre.** Eine Durchschrift, die sich überschreiben lässt,
ist keine; § 131 Abs 1 Z 6 BAO verlangt, dass der ursprüngliche Inhalt
feststellbar bleibt. Zwei Bestätigungen zu einem Vorgang tragen damit denselben
Namen, und genau dann soll der Lauf anhalten und fragen, statt die erste
stillschweigend zu ersetzen.

Geprüft wird **in beide Richtungen**, wie jedes Register dieses Bestands:

- `durchschrift-fehlt` — eine Aufzeichnung über ein Papier, das niemand mehr
  hat.
- `durchschrift-ohne-eintrag` — ein Papier, das hinausging, ohne aufgezeichnet
  zu werden. Die schwerere der beiden.
- `durchschrift-leer` — eine Datei, die in jeder Liste wie eine Durchschrift
  aussieht und keine ist.

Dazu die Sperre am Ort: Eine Durchschrift trägt Name, Anschrift und Betrag im
Klartext, also dasselbe wie das Journal. `beleg-im-verzeichnis` und
`beleg-am-falschen-ort` sind die Zwillinge der Regeln, die es für das Journal
seit dem 4. September gibt.

## Der zweite Fund, vom neuen Prüfer selbst

Der erste Lauf des Abgleichs meldete rot — **in der echten Akte**:

```
lfd. 1 (rechnung) steht im Journal, RE-2026-0002.txt fehlt
```

Dort lag ein Journal. Sein Inhalt: zwei gezogene Rechnungsnummern, ein Eintrag
mit `betragNetto: null` und einem Betreff, der `RE-2026-0001` nennt, während
der Eintrag `RE-2026-0002` heißt. Das ist genau der Fehler der Runde davor —
**stehen geblieben in der echten Ablage**, weil die Probeläufe dieses Hauses
den Vorgabewert benutzt hatten.

> **§ 11 Abs 1 Z 5 UStG nimmt eine Belegnummer nicht zurück.** `RE-2026-0001`
> und `RE-2026-0002` wären verbraucht gewesen, bevor der Betrieb seine erste
> Rechnung stellt — und der Steuerberater hätte zwei Lücken zu erklären
> gehabt, die es nie gab.

Der Satz dazu steht seit dem 4. September im Quelltext des Werkzeugs, über dem
Schalter `VORGANG_ABLAGE`: *„Eine Probe, die den Bestand verändert, ist
keine."* Er beschrieb, wofür der Schalter da ist — und hielt niemanden auf,
der ihn vergaß. Dieselbe Familie wie der Fund der Vorrunde: ein Satz, der
beschreibt statt zu sperren.

**Woran eine Probe zu erkennen ist:** Sie tauscht die Grundlagen aus. Wer
`VORGANG_BETREIBER` setzt, rechnet mit einem Betrieb, den es so nicht gibt —
heute unvermeidlich, denn dem echten fehlen UID und E-Mail, und ohne UID
sperrt § 11 Abs 1 Z 6 UStG die Rechnung. Wer `VORGANG_LIEFERANTEN` setzt,
rechnet mit Lieferzeiten, die niemand zugesagt hat. Seit heute weist
`--ablegen` in die echte Akte ab, sobald einer dieser Schalter gesetzt ist.

Das Journal selbst liegt jetzt im Wegwerfordner dieses Laufs, nicht in der
Akte: Es hält keinen Geschäftsfall fest, sondern einen Probelauf. Solange
nichts Echtes abgelegt ist, ist das Wegräumen die richtige Reihenfolge —
nach der ersten echten Zeile wäre es die falsche.

## Gate 40

**Zu jedem abgelegten Beleg gehört seine Durchschrift; die Journalzeile ist
die Aufzeichnung, nicht der Beleg. Und wer die Grundlagen austauscht, legt
nicht in der echten Akte ab.**

Beide Hälften gehören zusammen, weil die zweite die erste erst brauchbar
macht: Eine Akte, in die jeder Probelauf schreibt, ist keine Akte, sondern ein
Zwischenspeicher mit Rechtsfolgen.

## Ausgang

| | |
| --- | --- |
| Durchschrift je abgelegtem Beleg | keine → **eine Datei je Beleg** |
| Abgleich Journal ↔ Ordner | keiner → **beide Richtungen** |
| Proben in der echten Akte | möglich → **abgewiesen** |
| Bestellprobe | 7 → **8 Prüfungen**, Klick bis Durchschrift |
| Gates | 39 → **40** |
| Testfälle | 2.370 |
| Gegenproben | 203 → **206** |

Die Sperre in `haltefest`, die dieselbe Belegnummer kein zweites Mal
durchlässt, hatte ihre einzige Probe über das Werkzeug — und seit die
Durchschrift am Anfang steht, hält die schon vorher auf. Sie hat seit heute
ihre eigene.

---

**Die Regel dieser Runde:** *Wer etwas aus dem falschen Behälter nimmt, muss
sagen, in welchen es gehört — sonst ist das Aufräumen ein Verlust.*
