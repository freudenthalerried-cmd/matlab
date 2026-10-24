# Der Beleg, der nein sagt

**11. September 2026, vierundzwanzigste Runde.** Der Betrieb konnte drei Dinge
schreiben: ein **Angebot**, eine **Auftragsbestätigung**, eine **Rechnung**.
Alle drei sagen ja. Für das Nein gab es nichts.

Dabei weiß der Bestand genau, wann es eintritt: `darfVorgangLaufen` und
`pruefeBestelldaten` zählen die Gründe einzeln auf. Nur sind sie für die
Konsole des Betreibers geschrieben — und deshalb in seiner Sprache:

> *„Unternehmerstatus nicht bestätigt (**Gate 7**)"* ·
> *„Lieferzeit unbekannt (**Poschacher Baustoffhandel**) — der zugesagte Termin
> wäre erfunden"* · *„**Katalog enthält Platzhalterpreise** — der bestätigte
> Betrag wäre erfunden"*

## Die Messung

Alle neun Gründe durch `findeInterna`, denselben Prüfer, der über jede gebaute
Seite läuft:

| | |
|---|---|
| Gründe insgesamt | 9 |
| **mit einem Internum** | **2** — eine Gate-Nummer, ein Lieferantenname |

Die übrigen sieben sind kein Leck im Sinne des Prüfers und trotzdem nichts, was
ein Kunde lesen soll. Wer einem Besteller schreibt, sein Katalog enthalte
Platzhalterpreise, hat kein Geheimnis verraten, sondern ein Geständnis abgelegt.

> **Eine Absage, die es nur in der Sprache des Betriebs gibt, wird in der
> Sprache des Betriebs verschickt.**

Und geprüft würde sie von niemandem: Die Interna-Prüfung läuft über gebaute
Seiten und Anzeigentexte — nicht über eine Mail, die jemand von Hand schreibt.

## Was jetzt gilt

`src/absage.js` erfindet keine Gründe. Es übersetzt die, die der Bestand
ohnehin ausrechnet, und hält beides **in beide Richtungen** gegeneinander:
Jeder Grund braucht einen Satz, jeder Satz einen Grund, den es wirklich gibt.

Die Gründe werden dafür **aus dem Quelltext gelesen** und nicht aufgezählt —
eine Liste von Hand prüfte mein Gedächtnis und nicht den Bestand. Der Abgleich
hat dann sofort vier Dinge über mich herausgefunden:

1. **Zwei Sätze für Fälle, die es nicht gibt.** Ich hatte Einträge für
   „außerhalb des Liefergebiets" und „unter dem Mindestbestellwert"
   geschrieben. Beide Absagen kann es gar nicht geben: Die Kasse lässt eine
   solche Bestellung nie entstehen. *Ein Satz für einen Fall, den es nicht
   gibt, ist kein Schaden — aber er täuscht Vollständigkeit vor.* Gestrichen.
2. **Vier Gründe ohne Satz**, darunter zwei Postleitzahl-Fälle und die
   Steuerzeichen-Prüfung. Nachgetragen.
3. **Zwei Gründe, die nie an einen Kunden gehen** — sie halten eine *Rechnung*
   auf, nicht eine Bestellung. Sie stehen jetzt als eigene Liste mit Grund;
   ohne sie meldete der Abgleich sie ewig als unübersetzt.
4. **Mein erster Ausleser übersah die Schablonen.** Er nahm nur einfache
   Zeichenketten — und damit ausgerechnet die beiden Gründe nicht, die ein
   Internum tragen, denn beide setzen einen Namen ein.

### Kein stilles Weglassen

Findet sich für einen Grund kein Satz, entsteht **keine** Absage. Das ist die
wichtigere Hälfte: Ein Grund, der stillschweigend wegfällt, macht aus einer
Absage mit zwei Gründen eine mit einem — und der Kunde hält den zweiten für
erledigt. Eine eigene Gegenprobe schaltet genau dieses Weglassen frei.

### Die Absage nennt keinen Betrag und keine Position

Was abgesagt wird, steht in der Anfrage des Kunden. Eine zweite Aufstellung
daneben wäre eine zweite Rechnung über etwas, das nicht zustande kommt — und
die erste Stelle, an der beide auseinanderlaufen.

### Eine eigene Stufe, keine Nebenwirkung

`npm run vorgang -- … --stufe absage`. Der erste Wurf ließ die Absage
automatisch entstehen, sobald eine Sperre griff — und machte damit neun
Prüffälle rot: Der **Angebotsweg** war weg. Zu Recht. Ein Vorgang, der noch
nicht bis zur Bestätigung laufen darf, ist ja oft genau der, für den ein
Angebot das Richtige ist.

> **Ob ein Kunde ein Angebot oder eine Absage bekommt, entscheidet der
> Betreiber und nicht der Zustand einer Prüfung.**

Der fertige Brief geht durch `findeInterna`, bevor er ausgegeben wird. Findet
sich etwas, kommt nichts heraus.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Testfälle | 2270 | **2281** |
| Gegenproben | 175 | **177** |
| Belege an den Kunden | 3 | **4** |
| geführte Ausgänge (Fremdtext) | 15 | **16** |

`npm test` grün (2281 bestanden, 3 übersprungen), `npm run pruefe-tests` (2284
Testfälle, 0 mit Verdacht), `npm run pruefe-belege` (10 Absagesätze gegen die
Gründe des Bestandes gehalten), `npm run pruefe-pruefer` (51 Prüfer, 1
abgebrochen — `pruefe-gebinde`).
