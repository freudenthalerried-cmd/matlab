# Zwei Uhren in einem Beleg

**9. September 2026, abends.** Die Runde davor hat gefragt, *wo* die Vorgänge
sieben Jahre liegen. Diese fragt, *wann* sie entstanden sind.

`src/ablage.js` beschreibt das Feld `zeitpunkt` seit ihrem ersten Bau am
4. September so:

```
zeitpunkt: {
  verlangt: true,
  grundlage: '§ 11 UStG, § 131 Abs 1 Z 2 BAO',
  zweck: 'Ausstellungsdatum; zeitgerechte Eintragung in der Zeitfolge',
}
```

Gefüllt wurde es an zwei Stellen — und die beiden lasen zwei verschiedene
Uhren, von denen keine die österreichische war.

---

## Nachgestellt mit echtem PHP

`bestellung.php` wählt die Journaldatei mit `date('Y')` und stempelt den
Eintrag mit `gmdate('c')`. Die erste Funktion nimmt die Zeitzone des Hosts —
die niemand gesetzt und niemand nachgesehen hat —, die zweite immer UTC.

Bestellung am 1. Jänner 2027 um 00:30 Uhr österreichischer Zeit:

```
Host-Zeitzone UTC             journal-2026.jsonl   zeitpunkt = 2026-12-31T23:30:00+00:00
Host-Zeitzone Europe/Vienna   journal-2027.jsonl   zeitpunkt = 2026-12-31T23:30:00+00:00
```

**Beide Zeilen sind falsch, jede auf ihre Art.** Auf einem UTC-Host landet
der Geschäftsfall im Journal des **Vorjahres** und bekommt eine fortlaufende
Nummer daraus — § 132 BAO zählt die sieben Jahre ab Ende des
Wirtschaftsjahres, und dieser Fall liegt im falschen. Auf einem Wiener Host
stimmt die Datei, und das Ausstellungsdatum im Eintrag nennt trotzdem den
31. Dezember.

Und es braucht keinen Jahreswechsel:

```
15. März 2027, 00:30 Uhr in Österreich → Ausstellungsdatum laut Eintrag: 2027-03-14
```

Jede Bestellung zwischen Mitternacht und 01:00 Uhr — im Sommer 02:00 —
bekommt das Datum des Vortags. Das ist keine Randstunde: Es ist genau die
Zeit, zu der ein Baumeister nach dem Tag auf der Baustelle den Warenkorb
fertig macht.

> **Ein Betrieb hat einen Kalender, keine zwei.** Eine Uhr, die etwas
> anderes sagt, geht nicht falsch — sie beantwortet eine andere Frage.

---

## Es war nicht eine Stelle, sondern sieben

Beim Nachzählen aller Stellen, die von sich aus auf die Uhr sehen: **26
Uhrgriffe in 18 Dateien.** Davon erzeugen sieben Dateien ein Datum, das ein
Kunde oder eine Behörde als unseres liest:

| Datei | Was daraus wird |
|---|---|
| `bestellung.php` | Journaljahr und Ausstellungsdatum jeder eingehenden Bestellung |
| `bin/vorgang.mjs` | das Ausstellungsdatum auf Angebot, Auftragsbestätigung und Rechnung (§ 11 Abs 1 Z 4 UStG) |
| `src/kundenanfrage.js` | das Datum im Anfragetext, den der Kunde kopiert |
| `bin/posteingang.mjs` | das Wirtschaftsjahr der Journaldatei, die gelesen wird |
| `bin/preisliste.mjs` | der Preisstand je Artikel — Grundlage der Alterswarnung |
| `bin/website.mjs` | Seitenstand, Katalogstand und das Heute, gegen das die Alterswarnung rechnet |
| `bin/bestellprobe.mjs` | die Journaldatei, in der die Probe ihre eigene Bestellung sucht |

Die letzte ist die stillste: Rechnen Probe und Empfangsskript verschieden,
ist die Bestellprobe am Jahreswechsel rot, ohne dass etwas kaputt wäre — oder
schlimmer, grün, weil sie eine alte Zeile findet.

---

## Gebaut: ein Kalender und ein Register

`src/geschaeftszeit.js` ist der eine Kalender. `ZEITZONE` ist
`Europe/Vienna` — der Sitz des Betriebs, nicht der Ort des Servers.
`geschaeftstag()`, `geschaeftsjahr()` und `zeitstempel()` rechnen ohne
Fremdpaket: `Intl` kennt die Zone samt Sommerzeit, und `sv-SE` gibt ISO-Form
aus.

Der Zeitstempel trägt den Versatz mit (`2027-03-15T00:30:00+01:00`). **Ohne
ihn wäre die Angabe eine Ortszeit ohne Ort** — mit ihm ist sie beides: der
richtige Kalendertag und ein eindeutiger Augenblick.

`UHRSTELLEN` ist das Register: jede Datei, die ein Datum erzeugt, mit der
Uhr, die sie führen soll, und einem Pflichtgrund. Zwei Werte:

- **`geschaeft`** — das Ergebnis ist ein Datum, das ein Kunde oder eine
  Behörde als unseres liest. Erlaubte rohe Uhrgriffe: **null.**
- **`technisch`** — das Ergebnis beschreibt einen Vorgang in dieser
  Werkstatt: ein Sicherungsdateiname, der Zettel an einer laufenden
  Gegenprobe, der Stand einer Arbeitsliste. Dort ist UTC richtig, und warum,
  steht daneben.

Das Register zu schreiben war der eigentliche Aufwand — zehn Begründungen
für die technische Seite, und jede zwingt zu der Frage, ob dieser Fall
wirklich keiner ist. Bei `bin/preisalterpruefung.mjs` war die Antwort knapp:
Gemessen wird eine Spanne von 90 Tagen, kein Belegdatum, und der Rand ist
selbst eine Schätzung.

---

## Der Prüfer, in beide Richtungen

`npm run pruefe-zeit` liest alle 197 Quelldateien plus `bestellung.php`,
zählt die rohen Uhrgriffe ohne Kommentare und hält sie gegen das Register:

| Regel | Wann |
|---|---|
| `stelle-ohne-eintrag` | eine Datei sieht auf die Uhr und steht in keinem Register |
| `rohe-uhr-im-beleg` | eine Belegdatei greift roh auf die Rechneruhr |
| `rohzahl-abgeloest` | in einer technischen Datei ist ein Uhrgriff dazugekommen |
| `beleguhr-nicht-verwendet` | der Eintrag sagt `geschaeft`, der Code ruft den Kalender nicht auf |
| `utc-stempel-im-beleg` | PHP mit gesetzter Zeitzone, das trotzdem `gmdate` stempelt |
| `eintrag-ohne-datei`, `grund-zu-duenn`, `uhr-unbekannt` | die Form des Registers |

Die vorletzte Regel ist die, die man leicht vergisst: **Die Zeitzone zu
setzen rettet einen `gmdate`-Stempel nicht** — er geht an ihr vorbei. Genau
diese Mischung stand in `bestellung.php`.

Und `beleguhr-nicht-verwendet` ist die Richtung, ohne die das Register eine
Absichtserklärung wäre: Ein Eintrag darf „geschaeft" sagen, während im Code
weiter die alte Uhr steht. Beim ersten Lauf hat der Prüfer genau das
gemeldet — vierzehn Meldungen über sieben Dateien, ehe eine einzige davon
umgebaut war.

**Ein Uhrgriff im Kommentar ist keiner.** Der Kopf dieses Moduls erklärt den
Befund mit `gmdate('c')` im Text; ein Prüfer, der das mitzählt, meldete sich
selbst. Beim ersten Lauf tat er genau das — zwei Treffer in einer
Begründung, die die Falle beschreibt.

---

## Eine Grenze, die zu weit gezogen war

Beim Nachziehen der Beschreibung fiel etwas anderes auf. Die veröffentlichte
Fassung auf GitHub trug unter „Was fehlt" einen Punkt zur **Sicherung der
Vorgangsablage** — und die Quelle im Verzeichnis hatte ihn nie:

```
$ git show HEAD:docs/baustoff-shop/pr-beschreibung.md | grep -c "Vorgangsablage.*BAO"
0
```

Der Commit der Vorrunde änderte an dieser Datei **eine** Zeile: 16 Etappen →
17. Den Punkt hatte ich beim Veröffentlichen von Hand dazugeschrieben.

**Und `pruefe-schaufenster` war grün.** Zu Recht, nach seiner Bauart: Er
vergleicht die heutige Werkzeugausgabe mit einer Zahl in
`pr-veroeffentlicht.json` — beide stammen aus der Quelle. Was auf GitHub
steht, kommt in dieser Rechnung nicht vor.

Das steht seit gestern so in der Datei, unter `_grenze`. Nur stand dort auch
ein zweiter Satz:

> *Der Netzausgang dieser Umgebung erlaubt keine Prüfung der Veröffentlichung
> selbst.*

**Das ist falsch, und ich habe es nie nachgesehen.** Der Netzausgang ist
gesperrt — das GitHub-Werkzeug ist es nicht. Die veröffentlichte Beschreibung
lässt sich zurücklesen; ich habe es an diesem Abend zum ersten Mal getan, und
sie kam vollständig zurück.

> **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
> ausschließt.** Solange „nicht prüfbar" dasteht, sieht niemand nach — und
> der eine Fall, in dem es auseinanderlief, konnte ein Jahr lang so bleiben.

Berichtigt: `_grenze` sagt jetzt, was wirklich nicht geht (der **Prüfer**
läuft ohne Netz und kann GitHub nicht sehen) und was sehr wohl geht (der
**Handgriff** des Zurücklesens). Dazu ein Feld `zurueckgelesen` mit Datum und
ein Testfall, der beides festhält — auch, dass der widerlegte Satz nicht
zurückkehrt. Der Punkt selbst steht seither in der Quelle, wo er hingehört,
und die veröffentlichte Fassung ist zurückgelesen und stimmt überein.

---

## Und ein Fehler von mir, den das Werkzeug abgefangen hat

Der Gesamtlauf (`npm run alles`, 25 min) lief im Hintergrund, während ich
`src/geschaeftszeit.js`, den Prüfer und die Proben anlegte. Neue Dateien,
kein Eingriff in Bestehendes — dachte ich.

Der Lauf endete mit sieben nicht angeschlagenen Gegenproben. Vier davon
sagten wörtlich, woran es lag:

```
✗ pruefe-preise — Ein Preis in den Daten der Kasse, den keine Seite nennt
    der Arbeitsbaum hat sich unter dem Lauf bewegt: shop/src/geschaeftszeit.js
    — an einem Bestand, der sich ändert, lässt sich nichts zeigen
```

**Es hat meine eigenen Dateien beim Namen genannt.** Die anderen drei waren
Folgeschäden derselben Ursache: Eine neue Quelldatei macht `ausgabe/`
veraltet, `npm test` wird rot, und an einem roten Prüfer lässt sich nichts
zeigen.

> **Sieben rote Gegenproben, und keine davon war ein Befund.** Ohne diese
> Sperre hätte der Lauf sieben Prüfer beschuldigt, die nichts falsch gemacht
> haben — dasselbe Muster wie am 4. September beim veralteten Erzeugnis und
> am 8. September bei `pruefe-gebinde`.

Der Lauf ist damit **kein Beleg über den Bestand**, weder in die eine noch in
die andere Richtung. Er wird nach dieser Runde wiederholt, an einem
Arbeitsbaum, der stillhält.

---

## Was das nicht löst

Es sind bis heute **null Bestellungen** eingegangen: Der Bestellweg ist
ausgeschaltet, und die Ablage ist leer. Kein Beleg trägt heute ein falsches
Datum. Der Fund ist keine Korrektur, sondern eine Sperre — er wäre
aufgefallen, sobald jemand nach der ersten Bestellung um halb eins gefragt
hätte, warum sie im Journal des Vortags steht.

Nicht feststellbar bleibt, **welche Zeitzone auf All-Inkl eingestellt ist**.
Sie spielt jetzt keine Rolle mehr — das Skript setzt seine eigene —, aber die
Frage war vorher nie gestellt worden, und die Antwort hätte den Ausgang
entschieden.

---

**21 neue Testfälle** — der Kalender an sechs Grenzfällen (Mitternacht,
Jahreswechsel, Sommerzeit, der Umstellungstag, der Versatz, das übergebene
Datum unverändert), das Register und seine acht Regeln in beide Richtungen,
und einer am berichtigten Vermerk.
**130 Gegenproben** (die neue: das Ausstellungsdatum zurück auf die
Rechneruhr — schlägt an), **41 Prüfer.**
