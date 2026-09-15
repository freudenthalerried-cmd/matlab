# Dieselbe Spalte, zwei Größen

**4. September 2026.** Dieser Shop bewirbt einen einzigen Vorteil, und er steht
auf 39 von 46 Artikelseiten, im Markerband über jedem Preis und als Median auf
der Startseite:

> **X % unter dem Listenpreis des Lieferanten.**

Die Bezugsgröße dieser Aussage ist `uvpNetto` — der Listenpreis, der aus der
Spalte **Einzelpreis** der Lieferantenrechnungen stammt. Gemessen hat ihre
Bewegung nie jemand. `npm run preiswechsel` gibt es seit gestern, und es misst
den **Nettopreis**: „acht von acht unverändert".

> **Der Nettopreis entscheidet die Marge. Der Listenpreis entscheidet die
> Werbeaussage.** Beide können sich unabhängig bewegen.

Also habe ich die zweite Reihe dazugerechnet. Der erste Lauf meldete:

```
12583   an 2 Tagen über 21 Tage — Netto unverändert, Liste um 50.21 % verschoben
```

**Ein Listenpreissturz von 50 % in drei Wochen.** Für die Werbeaussage wäre das
der teuerste denkbare Befund: Derselbe Artikel, derselbe Einkauf, derselbe
Verkauf — und der beworbene Vorteil halbiert sich, ohne dass irgendetwas
geschehen ist.

## Es hat ihn nie gegeben

| Datum | Einzelpreis | Rabatt | Betrag für 20 m² |
|---|---|---|---|
| 27.07. | 7,03 | **−50 %** | 70,30 |
| 17.08. | 3,50 | **—** | 70,00 |

Der Lieferant ist bei diesem Artikel von „Liste minus Rabatt" auf **netto
fakturiert** umgestellt. Der Nettopreis ist derselbe geblieben. Und die
Preisdatei weiß es längst: Genau vier Artikel tragen dort den Hinweis

> „netto fakturiert, keine Liste ausgewiesen"

und für genau diese vier steht `uvpNetto: null` — sie zeigen auf ihren Seiten
**keinen** Vorteilsmarker. Das System war richtig; meine Messung war es nicht.

> **Welche der beiden Größen in der Spalte steht, sagt die Rabattspalte
> daneben.** Eine Zahl ohne ihre Nebenspalte ist so mehrdeutig wie eine Zahl
> ohne Einheit.

## Der dritte Fehlalarm derselben Bauart an zwei Tagen

| | Der Prüfer las | Was dastand |
|---|---|---|
| 3.9. | `3,68` als Einkaufspreis | die Ziffern von `153,68 €` |
| 4.9. (früh) | `57` als Tageszahl des Rolloutplans (gültig sind 60 Tage) | `57 %` aus der Dublettenmessung |
| 4.9. (jetzt) | `7,03` als Listenpreis | ein Listenpreis **mit** Rabattzeile, verglichen mit einem Nettopreis **ohne** |

*(Die 57 in der mittleren Zeile ist die abgelöste Kettendauer — seit der Etappe
„Search Console einrichten und Indexierung bestätigen" sind es 60 Tage. Sie
steht hier mit ihrer Bedingung in derselben Zeile, denn für Tabellenzeilen
verlangt `pruefe-leitzahlen` genau das: Eine Bedingung, die nur nebenan steht,
deckt die Zeile nicht.)*

Dreimal dieselbe Ursache: **eine Zahl aus ihrem Zusammenhang gelöst und mit
einer verglichen, die etwas anderes bedeutet.** Zweimal hat es einen bestehenden
Prüfer getroffen, einmal meine eigene, eine Stunde alte Ergänzung.

Der Unterschied zu den ersten beiden: Dieser hier ist nie in einen Commit
gekommen. Der Lauf, der ihn gemeldet hat, war derselbe, der ihn widerlegt hat —
weil die Meldung so groß war, dass sie nachgesehen gehört hat.

> **Ein Befund, der zu gut zur These passt, ist der, den man zuerst
> nachrechnet.** „Die Werbeaussage steht auf einer Zahl, die der Lieferant
> verschieben kann" wäre eine schöne Geschichte gewesen.

## Was jetzt gemessen wird

`npm run preiswechsel` trägt die zweite Reihe, richtig gefasst:

```
8 von 8 im Nettopreis unverändert, 5 von 5 im Listenpreis
(nur so viele weisen zweimal eine Liste aus), längste Spanne 32 Tage.

3 Artikelnummer(n) tragen nicht zweimal eine Liste: Der Lieferant fakturiert
sie netto, ohne Rabattzeile.
```

Als Listenpreis zählt ein Einzelpreis nur, wenn eine Rabattzeile danebensteht.
Wer nur einmal eine Liste ausweist, wird als solcher genannt — **eine
Beobachtung ist kein Vergleich**, und das gehört in die Ausgabe und nicht in
eine Fußnote.

## Was der Befund für die Werbeaussage bedeutet

**Nichts hat sich bewegt** — über 32 beobachtete Tage weder ein Nettopreis noch
ein Listenpreis. Die Aussage „X % unter dem Listenpreis" steht damit auf
Zahlen, die im beobachteten Zeitraum stabil waren.

Was offen bleibt, ist dasselbe wie beim Nettopreis: **32 Tage sind kein
Rhythmus.** Die Frage an den Lieferanten nach seinem Preisrhythmus deckt jetzt
beide Größen ab — sie steht als offener Punkt und ist freigabepflichtig.

Und eine Beobachtung nebenbei, die eine Frage wert ist: Der Lieferant hat bei
mindestens einem Artikel die Abrechnungsart gewechselt. Wenn er das breiter
tut, verlieren weitere Artikel ihren Listenpreis — und mit ihm ihren
Vorteilsmarker. Das ist kein Fehler, sondern eine Abhängigkeit: **Die
Werbeaussage dieses Shops hängt daran, dass der Lieferant seine Rabatte
ausweist.**

## Verweise

- `shop/bin/preiswechsel.mjs` — die zweite Reihe und ihre Bedingung
- `shop/test/preiswechsel.test.js` — zwei neue Proben, eine davon gegen genau diesen Fehlalarm
- [`wo-der-shop-am-wenigsten-weiss.md`](./wo-der-shop-am-wenigsten-weiss.md) — der zweite Fehlalarm desselben Tages
