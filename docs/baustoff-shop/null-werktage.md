# „null Werktage" — der Termin, den niemand kannte

**30. August 2026.** Dritter Durchgang, wieder nach der Anleitung im
Loop-Abschnitt, diesmal Punkt 3: **eine Zusage suchen, die keine Probe
widerlegen kann.** Gefunden auf dem Dokument, mit dem der Vertrag zustande
kommt.

## Der Befund

`data/lieferanten.json` führt vier Lieferanten. Drei stammen aus dem
abgelösten Radon-Modell und tragen eine Lieferzeit (5, 8, 4 Werktage). Der
vierte ist Poschacher — und liefert **alle sechsundvierzig geführten
Artikel**. Seine `lieferzeitWerktage` ist `null`, weil niemand sie erhoben
hat.

`src/beleg.js` setzte diese Angabe roh ein. Nachgerechnet auf einer echten
Bestellung:

```
Poschacher Baustoffhandel — Direktlieferung, null Werktage
  Poschacher Baustoffhandel: null Werktage
Vollständig auf der Baustelle: nach 0 Werktagen.
```

Drei Zeilen darüber steht auf demselben Blatt: „Mit dieser Bestätigung kommt
der Vertrag zustande." Die Auftragsbestätigung sagte also für **jede** echte
Bestellung einen Liefertermin zu, den niemand kennt — und zwar den denkbar
günstigsten.

Verantwortlich war ein einzelner Griff:

```js
const werktage = warenkorb.teillieferungen.map((t) => t.lieferzeitWerktage ?? 0);
const laengste = werktage.length ? Math.max(...werktage) : 0;
```

> **`?? 0` hat aus „unbekannt" nicht irgendeinen Wert gemacht, sondern den
> optimistischsten.** Dasselbe Muster wie viermal zuvor in diesem Projekt: eine
> Lücke still mit einer freundlichen Annahme füllen. Neu ist nur, wohin sie
> diesmal geriet — auf ein bindendes Dokument.

Jede andere fehlende Angabe in `beleg.js` geht durch `wert()` und wird zu
`[[ … — FEHLT ]]`. Die Lieferzeit war die einzige, die daran vorbeilief.

## Warum keine Probe das gemerkt hat

`test/beleg.test.js` rechnet auf `data/artikel.json` — dem Katalog des
abgelösten Modells, dessen drei Lieferanten alle eine Lieferzeit tragen. Der
`null`-Fall existierte dort nicht. Dieselbe Trennung noch einmal in den
Browserproben: Sie laufen gegen `demo.html` (9 Artikel, dieselben drei alten
Lieferanten), während die Kundenseiten aus `ausgabe/website.html` kommen (46
Artikel, ausschließlich Poschacher).

> **Eine Probe, die auf dem Altbestand rechnet, prüft den Altbestand.** Sie ist
> nicht falsch — sie ist woanders. Neunundvierzig grüne Szenarien sagten
> nichts über den einzigen Lieferanten, der wirklich liefert.

## Was geändert wurde

| Stelle | vorher | jetzt |
|---|---|---|
| `beleg.js`, Positionszeilen (Angebot, Bestätigung, Rechnung) | `null Werktage` | `[[ Lieferzeit Poschacher Baustoffhandel — FEHLT ]]` |
| `beleg.js`, Gesamttermin | `nach 0 Werktagen` | `[[ Gesamtlieferzeit — FEHLT ]]` mit Grund |
| `beleg.js`, `lieferzeitLaengsteWerktage` | `0` | `null`, solange eine Zahl fehlt |
| `darfBestaetigtWerden` | ließ durch | sperrt und nennt den Lieferanten |
| `demo-template.html`, Warenkorbkopf | `null Werktage` | „Lieferzeit auf Anfrage" |
| `startklar` | kannte den Punkt nicht | neuer Punkt, Adressat Auftraggeber |

**Gate-Entscheidung, hier begründet:** Ohne bekannte Lieferzeit darf **keine
Auftragsbestätigung** hinaus. Sie ist die Annahme; mit ihr entsteht der
Vertrag, und sie nennt den Termin. Ein zugesagter Termin, den niemand kennt,
ist erfunden — dieselbe Regel, die schon für Platzhalterpreise gilt, nur auf
die Zeit angewandt. Angebot und Rechnung bleiben erlaubt: Das Angebot ist
unverbindlich und trägt die Lücke sichtbar, bei der Rechnung ist die Lieferung
Vergangenheit und `lieferdatum` ein echtes Feld.

Der Lieferzeitpunkt steht damit auf der Startklar-Liste, wo er hingehört —
nicht in einer Fehlermeldung am Bestelltag:

```
✗ Lieferzeit je liefernden Lieferanten bekannt
    1 ohne Lieferzeit: Poschacher Baustoffhandel — ohne sie darf keine
    Auftragsbestätigung hinaus  ·  Auftraggeber
```

Lieferanten **ohne** geführte Ware zählen dabei nicht: Wer nichts liefert,
blockiert nichts, und eine Angabe einzufordern, die niemand je braucht, hielte
den Punkt dauerhaft rot, bis jemand sie erfindet.

## Ein zweiter Fund nebenbei

Der neue Punkt betrifft den Kunden, also gehört er auf die Kasse — und dabei
kam heraus, dass die Startseite und `llms.txt` schrieben:

```
- **Bestellen ist noch nicht möglich.** Es fehlen: .
```

Ein Satz, der eine Aufzählung ankündigt und keine liefert. Erreichbar, sobald
der einzige offene Punkt den Kunden nichts angeht — etwa „Repository ist
privat". Beide Stellen tragen jetzt einen Satz, der ohne Liste trägt.

## Gegenproben

Sieben Mutationen, jede mit `.bak`-Sicherung und danach zurückgesetzt:

| Mutation | erkannt |
|---|---|
| `?? 0` wieder eingebaut | ja |
| rohe Einsetzung der Lieferzeit zurück | ja — 2 rot |
| Bestätigungssperre ausgeschaltet | ja |
| `startklar` prüft Wahrheitswert statt Zahl (0 Werktage wäre „fehlt") | ja |
| auch Lieferanten ohne Ware blockieren | ja |
| leere Aufzählung in `llms.txt` zurück | **erst nein** |
| leere Aufzählung auf der Startseite zurück | **erst nein** |

Die letzten beiden waren der eigentliche Prüfstein: Ich hatte einen Fehler
behoben, den keine Probe widerlegen konnte — genau die Sorte Zusage, nach der
dieser Durchgang gesucht hat. Eine Probe nachgezogen, die den Bau mit einer
Lage laufen lässt, in der der einzige offene Punkt keinen Kundenbezug hat;
danach werden beide Mutationen erkannt.

Elf neue Testfälle, davon drei Gegenrichtungen: Sind alle Lieferzeiten
bekannt, steht der Termin wie bisher da und **keine** Lücke; eine Lieferzeit
von **0 Werktagen** ist eine gültige Zusage (Selbstabholung) und keine fehlende
Angabe; und mit bekannten Lieferzeiten darf die Lieferzeit die Bestätigung
nicht aufhalten.

## Was der Auftraggeber beantworten muss

Eine Zahl: **die Lieferzeit von Poschacher in Werktagen, ab Bestellauslösung.**
Sie ist nicht zu schätzen — bis sie da ist, nimmt der Shop Anfragen entgegen,
bestätigt aber keinen Auftrag. Der Punkt steht in `npm run startklar`.

## Stand

944 Testfälle grün (vorher 933), `pruefe-tests` 942/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 197/197.
