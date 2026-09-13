# Das Statusdokument hatte eine Woche Verspätung

Stand: 2026-08-29

## Der Fund

`STATUS.md` sagt in der zweiten Zeile über sich selbst: *„Dieses Dokument
zuerst lesen. Hier steht, was gilt."* Der Arbeitsloop tut genau das. In der
Mitte desselben Dokuments stand bis heute, unmarkiert:

> **Die Modellwahl ist vertagt — begründet**
>
> | | Radon-Shop | Leadvermittlung Bausanierung |
> | Nötiger Erlös | 24.200 €/Monat | 5.724 €/Monat |
> …
> **Empfehlung: Inhalte zuerst.** Sie … halten die Entscheidung offen, bis
> die Herstellerkonditionen vorliegen.

Der Auftraggeber hat am **22. August** auf eigene Baumeisterpreise, 25 %
Marge und regionale Lieferung umgestellt. Es gibt keine Modellwahl mehr, keine
Herstellerkonditionen, auf die man warten könnte, und keinen Radon-Shop. Der
Absatz stand sieben Tage lang als geltender Plan da.

Der Abschnitt **„Zum Arbeitsloop"** ganz am Ende war ebenso alt: Er sagte, der
Loop nehme „die eigentliche Arbeit auf, sobald eine der beiden Freigaben
vorliegt". Diese beiden Freigaben gibt es nicht mehr. Ein Lauf, der das für
aktuell hielt, hätte auf etwas gewartet, das nie kommt.

Dasselbe Muster wie am 28. August in `PARAMETER.md` (32 % Rohmarge,
`oberste-regel-war-ueberholt.md`) und am 28. August in `STATUS.md` selbst
(Radon-Freigaben, `statusseite-zeigte-den-falschen-plan.md`). **Dreimal in
zwei Tagen dieselbe Fehlerklasse — und jedes Mal hat sie ein Leser gefunden,
kein Werkzeug.**

## Was berichtigt wurde

- **Kopfnotiz** auf `STATUS.md`: Wer hier liest, prüft zuerst das Datum über
  dem Absatz.
- **„Wo das Projekt steht"** neu geschrieben und auf den Stand vom 29. August
  gebracht: Firma, 46 gerechnete Artikel, 81 gebaute Seiten, ein Anfrageweg,
  neun Prüfer. Die alte Gegenüberstellung bleibt als Fehlergeschichte stehen,
  jetzt hinter einer Trennlinie und einer Warnung.
- **„Die Modellwahl ist vertagt"** trägt eine Kopfnotiz: nicht mehr vertagt,
  gegenstandslos.
- **„Zum Arbeitsloop"** neu gefasst: was der Loop tut, drei brauchbare
  Einstiege, und wo die offenen Fäden liegen.
- **Prüfmittelstand** aktualisiert (792 Tests, `shopprobe` 39, `rahmenzensus`
  81/81 — dort stand noch 729 und 28).
- Vier neue **Korrekturzeilen** in der Tabelle „Korrekturen, die im Verlauf
  nötig waren".

## Der eigentliche Ertrag: ein Wächter für die kleinere Schwester

Ob ein Satz noch stimmt, kann kein Werkzeug entscheiden. Die Vorstufe schon:
**Weiß das Statusdokument überhaupt, dass es diese Datei gibt?**

Der Abgleich beim ersten Lauf: **20 von 154 Arbeitsdateien wurden in
`STATUS.md` nie genannt** — praktisch der ganze 28. August. Die Läufe dieses
Tages waren im Fließtext zusammengefasst („28. August — sieben Läufe"), aber
im Dokumentverzeichnis nicht auffindbar. Wer nach `meinten-sie.md` oder
`erzeuger-loeschte-die-gewichte.md` gesucht hätte, hätte sie über das
Statusdokument nicht gefunden.

Alle zwanzig sind jetzt mit einer Zeile Kernaussage eingetragen, dazu die
fünf vom 29. August — dieses Dokument eingeschlossen, und zwar weil der
Prüfer es beim ersten Lauf nach seiner Fertigstellung selbst angemahnt hat. `npm run pruefe-stand` hält den Zustand:

```
Standabgleich: 155 Arbeitsdateien gegen STATUS.md

155 von 155 Dateien sind in STATUS.md genannt.
```

Gegengeprobt mit einer angelegten, nicht eingetragenen Datei: Der Prüfer nennt
sie und endet mit Code 1. Er ist als siebter Prüfer im Regellauf des Prüferprüfers
eingetragen, mit einem Mindestmaß von 100 Dateien — zeigt er eines Tages auf
ein leeres Verzeichnis, meldet er „0 von 0" und das sähe ohne Mindestmaß wie
Grün aus. Derselbe Schutz sitzt im Werkzeug selbst: Ein Abgleich über null
Dateien endet mit Code 2, nicht mit einem Haken.

## Die Grenze dieses Werkzeugs, ausdrücklich

Es liest keinen Inhalt. Ein Satz über eine genannte Datei kann beliebig
überholt sein, und `pruefe-stand` meldet nichts. Die drei Funde dieser zwei
Tage hätte er alle **nicht** gefunden — er verhindert nur, dass zu einer
überholten Zusammenfassung auch noch die Auffindbarkeit fehlt.

Was gegen überholte Sätze hilft, ist keine Prüfung, sondern eine Gewohnheit:
**Wer ein Dokument als geltend liest, prüft zuerst das Datum über dem
Absatz.** Deshalb steht dieser Satz jetzt als Kopfnotiz in `STATUS.md`
selbst.
