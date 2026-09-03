# Neun Testfälle, acht angesehen

**3. September 2026.** Angefangen hat die Stunde mit einer Bequemlichkeit: Um
zu wissen, ob der Bestand steht, mussten **einundzwanzig Befehle von Hand**
getippt werden, und die vollständige Liste stand nirgends — nicht in
`package.json`, nicht in einer Anleitung, sondern jedes Mal neu im Kopf dessen,
der sie tippt.

> **Eine Prüfung, deren Vollständigkeit man sich merken muss, ist irgendwann
> unvollständig.**

Daraus wurde `npm run alles` (`bin/gesamtlauf.mjs`). Es tippt die Liste nicht
ab, sondern **liest sie aus `src/pruefregister.js`** und kann damit nicht hinter
dem Bestand zurückbleiben. Der erste Lauf hat dann drei Dinge gefunden, die
ohne ihn weiter nebeneinander gestanden hätten.

---

## 1. Zwei Aufrufe, zwei Wahrheiten

Der erste Lauf meldete `✗ Testlauf — 1 Testfälle rot`, während `npm test`
1.276 grüne Fälle zählte. Der Unterschied war die Schreibweise: Der neue Lauf
rief `node --test test/` auf. Node 22 nimmt diesen Pfad als **Modul**, nicht
als Ordner, und scheitert daran — ein einziger roter „Testfall" namens `test`.

Nicht der Bestand war rot, sondern der Aufruf war ein anderer. Der Lauf ruft
jetzt **den veröffentlichten Befehl** auf (`npm test`) statt eine eigene
Dateiliste zu bilden: Eine zweite Liste könnte von der in `package.json`
abweichen, dieser Aufruf kann es nicht.

## 2. Ein Häkchen hinter einer Nichtzahl

Derselbe Lauf zeigte `✓ pruefe-datenschutz — NaN Zusagen über den Code`.

Der Registereintrag trug `zweite: true`, sein Muster hat aber nur **eine**
Klammer. `Number(undefined)` ist `NaN` — und weil `NaN < 5` **falsch** ist,
fiel der Prüfer durch den Vergleich hindurch ins Grüne. Der Fehler saß nicht
im neuen Lauf: `npm run pruefe-pruefer` hatte ihn seit dem 2. September genauso
gemeldet, nur las ihn niemand Zeichen für Zeichen.

> **Ein Häkchen hinter einer Nichtzahl ist schlimmer als ein Kreuz. Es sagt
> „nachgesehen", wo nichts gemessen wurde.**

Drei Änderungen, damit es nicht wiederkommt:

* `src/prueferurteil.js` behandelt eine nicht endliche Zahl als `ohne-menge` —
  dieselbe Schublade wie ein Prüfer, der über seinen Umfang schweigt.
* Ein Testfall hält **jeden** Registereintrag gegen sein Muster: Die Klammer,
  die der Eintrag liest, muss es geben. Gemessen wird ohne Prüferlauf, über
  ein angehängtes `|`.
* `pruefe-pruefer` stand bis heute unter **begründetem Verzicht** — seine
  Gegenprobe wäre „ein Prüfer mit leerem Ergebnis, und das tut das Register
  ohnehin". Die Begründung war schlüssig und hat den Fall verfehlt: Nicht
  *leer*, sondern *unmessbar* war das Problem. Der Eintrag ist jetzt eine
  echte Gegenprobe (31 statt 30), die genau dieses `zweite: true`
  wieder einsetzt und den Prüfer rot sehen will.

Dieselbe Sorte Irrtum wie am 2.9. bei `pruefe-stand` und `pruefe-preise`: **eine
Begründung, die stimmte, bis der Fall eintrat.** Dritter Verzicht in drei
Tagen, der sich als Möglichkeit entpuppt hat.

## 3. Neun Testfälle, acht angesehen

`Testlauf 1278` und `pruefe-tests 1276` standen im selben Bildschirm
untereinander. Jede Zahl für sich sah richtig aus. Die Differenz nachgemessen,
Datei für Datei:

| Datei | im Code | ausgeführt |
|---|---|---|
| `kontrast.test.js` | 2 | 3 |
| `geheimnis.test.js` | 8 | **9** |

Die erste Zeile ist Zählstil: Ein Testfall steht dort in einer Schleife über
zwei Anstriche — eine Stelle im Code, zwei Läufe. Die zweite Zeile war ein
Loch. Der Prüfer sah einen Testfall der Datei **überhaupt nicht**:

```js
test('Der Feldname allein löst nichts aus', () => {
  assert.deepEqual(findeAbfluss('export function artikelEinkauf(a, l) {'), []);
  ...
});
```

Die geschweifte Klammer steht in Anführungszeichen und schließt nie.
`bisSchliessend` zählte sie mit, lief bis zum Dateiende, fand keine Balance,
gab `-1` zurück — und die Schleife darüber übersprang den Fall mit `continue`.
Ohne Meldung. Ein hohler Test an dieser Stelle wäre nie aufgefallen, und der
Prüfer hätte weiter „1276 Testfälle geprüft" gemeldet.

> **Ein Prüfer, der eine Stelle nicht lesen kann, muss das sagen. Wer sie
> überspringt, prüft weniger, als er meldet — und meldet es nicht.**

### Der zweite Anlauf war schlimmer als der erste

Die Klammerzählung kennt jetzt Zeichenketten und Kommentare. Nach dieser
Änderung meldete der Prüfer **acht** unlesbare Fälle statt einem. Der Grund:

```js
assert.match(svg, /role="img" aria-label="[^"]+"/, `${a.sku}: ohne Beschreibung`);
```

Fünf Anführungszeichen in einem Muster-Literal — beim fünften lief die neue
Zeichenkettenerkennung in den Rest der Datei. **Ein Prüfer, der eine
Schreibweise nicht kennt, meldet nicht zu wenig, sondern das Falsche**;
dieselbe Lehre wie beim Optionsobjekt am 28.08., nur einen Stock tiefer.

Also auch Muster-Literale erkannt — mitsamt der Frage, wann ein `/` ein Muster
beginnt und wann es teilt. Nach `(`, `,`, `=`, `:` und dem **Pfeil** `=>` ist
es ein Muster; das war der häufigste Fall im Bestand (`(m) => /muster/.test(m)`)
und der letzte, der noch zwei Fälle unlesbar hielt.

**Ergebnis:** 1.277 statt 1.276 angesehene Testfälle, null Verdacht, und ein
Fall, der sich nicht abgrenzen lässt, wird ab jetzt **gemeldet** statt
übersprungen. Die Probedatei `test/probe/probe.test.js` trägt beide neuen
Fälle als Zielscheibe: einen hohlen Test mit `{` im Text, einen hinter einem
Muster mit Anführungszeichen. Beide müssen gefunden werden, keiner darf
„nicht lesbar" heißen.

---

## Was daraus bleibt

Der neue Gesamtlauf hat in seinem ersten Durchgang **keinen** neuen Fehler
erzeugt. Er hat drei vorhandene sichtbar gemacht, und zwar allein dadurch,
dass er Zahlen nebeneinanderstellt, die vorher in getrennten Terminals standen.

> **Zwei Zählungen desselben Bestands sind eine Prüfung, solange jemand die
> Differenz erklären muss.**

`npm run alles` läuft in gut einer Minute, ohne Browserproben; mit
`-- --mit-browser` kommen die drei Chromium-Proben dazu. Er baut bewusst
nicht: Ein Prüflauf, der sein Prüfobjekt selbst erzeugt, prüft das, was er
gerade gebaut hat, und nicht das, was ausgeliefert ist.

Stand nach dieser Stunde: **20 von 20 Schritten grün**, 1.278 ausgeführte
Testfälle, 31 von 31 Gegenproben, 18 Prüfer mit belastbarem Umfang.
