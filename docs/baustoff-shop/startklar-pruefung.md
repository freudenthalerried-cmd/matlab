# „Shop fertig?" — jetzt beantwortet ein Werkzeug die Frage

**28. August 2026.** Der Auftraggeber hat heute gefragt: *„shop fertig?"* Die
Antwort stand in meinem Gedächtnis und verteilt über sieben Dokumente —
nirgends an einer Stelle und nirgends nachrechenbar.

> **Eine Bereitschaftsauskunft, die aus dem Gedächtnis kommt, ist eine
> Meinung.** Sie wird optimistischer, je länger man an der Sache baut.

Neu: `npm run startklar`.

```
  ✗ Impressum vollständig
      4 Pflichtangaben fehlen: E-Mail, Telefon, UID, Gewerbewortlaut  ·  Auftraggeber
  ✓ Jeder geführte Artikel ist gerechnet
      46 von 46 Artikeln mit gerechnetem Verkaufspreis
  ✓ Kein Platzhalterpreis im Katalog
  ✗ Zahlungsanbieter gewählt und angebunden
  ✗ Rechtstexte mit verbindlichem Wortlaut
  ? Die Seite ist unter einer Adresse erreichbar
  ? Repository ist privat

2 erfüllt, 3 offen, 2 von hier aus nicht feststellbar.
NICHT STARTKLAR.
```

## Der dritte Zustand ist der Punkt

Die meisten solchen Listen kennen zwei Zustände: erledigt oder offen. Hier
gibt es einen dritten — **`unpruefbar`**, und er ist der wichtigste:

| Zustand | Bedeutung |
|---|---|
| `erfuellt` | aus den Daten belegt |
| `offen` | aus den Daten belegt, dass es fehlt |
| `unpruefbar` | von hier aus nicht feststellbar — jemand muss es bestätigen |

Ob die Domain auf den Shop zeigt und ob das Repository privat ist, kann
dieses Werkzeug nicht wissen: Der Netzausgang dieser Umgebung ist gesperrt.
Ein zweiwertiges Werkzeug müsste beides raten, und es würde in die bequeme
Richtung raten.

> **„Startklar" heißt: nichts offen **und** nichts ungeprüft.** Ein Punkt,
> den niemand bestätigt hat, zählt nicht als erfüllt — sonst ginge der Shop
> online, weil das Werkzeug nicht hinsehen konnte.

Gegengeprobt: Lässt man Ungeprüftes als erfüllt durchgehen, fällt genau die
Probe, die diese Regel festhält.

Und die Umkehrung steht auch drin: Ein Punkt, den jemand **ausdrücklich
verneint** („nein, das Repository ist öffentlich"), ist `offen`, nicht
`unpruefbar`. Eine verneinte Frage ist beantwortet.

## Wo die Antworten herkommen

- **Impressum** aus `data/betreiber.json` gegen `IMPRESSUMSFELDER` — dieselbe
  Liste, aus der die Impressumsseite ihre Lücken meldet. Eine Quelle, zwei
  Ausgänge.
- **Preise und Platzhalter** aus dem gerechneten Katalog: Zählt, wie viele
  Artikel einen Verkaufspreis tragen und ob ein Einkaufspreis Platzhalter ist.
- **Zahlungsanbieter, Rechtstexte, Domain, Repository** haben heute noch
  keinen Ort in den Daten, weil es sie nicht gibt. Sobald sie da sind, gehören
  sie nach `data/betreiber.json` — dann meldet das Werkzeug sie von selbst,
  ohne dass jemand diese Datei anfasst.

## Was das Werkzeug ausdrücklich nicht tut

Es urteilt nicht über Inhalte, Preise oder Gestaltung. Dafür gibt es acht
andere Prüfer, und der heutige Vormittag hat gezeigt, was passiert, wenn deren
Ausgabe niemand liest. Diese Prüfung beantwortet **eine** Frage: Darf das
online gehen?

## Stand

772 Tests grün (vorher 765; +7), `pruefe-tests` 771 / 0 Verdacht,
`pruefe-pruefer` 6 Prüfer mit belastbarem Umfang.

Beim Einbau meldete der Testprüfer prompt eine neue Schleife ohne
Längenzusicherung — in einer Probe, die ich zwei Stunden vorher geschrieben
hatte. Er wird gelesen.
