# Das Mühlviertel ist nicht das Liefergebiet

**31. August 2026.** Beim Eintragen der Domain hatte ich mir notiert, die
Anzeigentexte müssten das Liefergebiet ausdrücklich nennen — „Bauversand"
verspricht Versand, geliefert wird in fünf Bezirke. Nachgesehen. Der Befund
ist schlimmer als erwartet: Sie nennen es, aber falsch.

## Die Messung

Alle sechs Anzeigen auf Ortsangaben abgesucht:

| Gruppe | was dastand |
|---|---|
| WDVS | „Lieferung ins Mühlviertel", „Regionale Lieferung" |
| Dämmung | „Lieferung im Umkreis von Linz" |
| **Kamin** | **— keine Ortsangabe —** |
| Kanal | „Erdbau im Mühlviertel" |
| Mörtel | „Mörtel im Mühlviertel" |
| Mauerwerk | „Ziegel im Mühlviertel", „Regionale Lieferung" |

Daneben das tatsächliche Liefergebiet aus `LIEFERGEBIET`:

```
Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz
```

Das Mühlviertel besteht aus **vier** Bezirken: Perg, Urfahr-Umgebung,
Freistadt — **und Rohrbach**. Die beiden Mengen decken sich also in keine
Richtung:

- **Rohrbach ist zu viel.** Vier Anzeigen warben in einem Bezirk, in dem nicht
  geliefert wird. Wer von dort klickt, wird in der Kasse abgelehnt — der Klick
  ist bezahlt, der Kunde weggeschickt.
- **Linz und Linz-Land fehlen.** Sie gehören zum Liefergebiet und nicht zum
  Mühlviertel. Das sind die beiden bevölkerungsstärksten der fünf, und die
  Anzeigen schlossen sie sprachlich aus.

> **Derselbe Fehler wie eine tote Ziel-URL, nur subtiler.** Dort bezahlt man
> für eine Fehlerseite, hier für eine Ablehnung. Beides ist Geld dafür,
> Besucher wegzuschicken — und beides fällt in der Statistik nicht auf, weil
> die Klicks ja ankommen.

Und die Gruppe ohne jede Ortsangabe war ausgerechnet **Kamin** — die mit dem
höchsten Deckungsbeitrag (410,94 €), in die nach der Entscheidung von heute
Vormittag der erste Euro Werbebudget fließen soll.

## Warum das passiert ist

Die Ortsangaben standen von Hand in `ANZEIGENTEXTE`, als Teil der
Werbebotschaft. „Mühlviertel" ist als Ansprache auch besser als eine
Bezirksliste — es klingt nach Gegend statt nach Verwaltung. Nur ist es eben
eine **andere** Gegend als die, in die geliefert wird.

Dieselbe Lektion wie bei der Domain zwei Stunden zuvor: Eine Angabe, die es
schon gibt, ein zweites Mal von Hand hinzuschreiben, heißt, dass die zweite
Fassung irgendwann nicht mehr stimmt. Hier hat sie nie gestimmt.

## Was geändert wurde

Die Ortsangabe wird jetzt **erzeugt**, aus `LIEFERGEBIET`:

```
Überschrift:   Lieferung Perg bis Linz                    (23 von 30 Zeichen)
Beschreibung:  Geliefert wird in die Bezirke Perg,
               Urfahr-Umgebung, Freistadt, Linz-Land, Linz.  (80 von 90)
```

Sie steht in **jeder** Anzeige, an letzter Stelle, damit sie keine der
beworbenen Eigenschaften verdrängt. Ändert sich das Liefergebiet, ändern sich
die Anzeigen mit.

Passt die Überschrift nicht in dreißig Zeichen, **bricht das Werkzeug ab**
statt zu kürzen. Ein gekürztes Liefergebiet wäre ein falsches — genau der
Fehler, der gerade behoben wurde.

## Gegenproben

| Mutation | erkannt |
|---|---|
| „Mühlviertel" wieder in einem Anzeigentext | ja |
| Ortsangabe nicht mehr angehängt | ja |
| Ortsangabe wieder als Landschaftsname | ja — 2 rot |
| Bezirksname so lang, dass die Überschrift platzt | Abbruch mit Code 2 |

`pruefe-tests` meldete danach zwei Schleifen ohne Längenzusicherung in den
neuen Proben — beide ergänzt.

## Was das nicht löst

Die Anzeigen bleiben **pausiert**, und die Kette zum Werbeweg ist unverändert
lang: Rechtstexte, Zahlungsanbieter und die GTIN-Liste stehen weiter aus. Was
sich geändert hat, ist, dass am Tag des Schaltens keine Anzeige mehr für einen
Bezirk wirbt, in dem nicht geliefert wird — und dass die ertragreichste Gruppe
überhaupt sagt, wohin sie liefert.

## Stand

1013 Testfälle grün (vorher 1010), `pruefe-tests` 1011/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 211/211. Kampagnen
unverändert pausiert.
