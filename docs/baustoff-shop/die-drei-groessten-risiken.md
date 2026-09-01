# Die drei größten Risiken

**1. September 2026.** Der Ursprungsauftrag verlangt als erstes Ergebnis eine
Zusammenfassung „mit Empfehlung und den **drei größten Risiken**". Der
Auftragsabgleich von vorhin hat festgehalten, dass genau diese Risikoliste
fehlt. Hier ist sie.

Jede Zahl darin ist heute gemessen worden, keine ist geschätzt. Wo eine
Annahme trägt, steht sie als Annahme da.

---

## 1. Die Kaufquote ist unbelegt — und sie entscheidet alles

Das Modell legt zwei Größen fest: **10 % Werbeanteil** am Umsatz und **67
Bestellungen** im Monat, die den Zielgewinn tragen. Daraus folgt ein
Werbebudget von 4.340 € im Monat. Wie viele Besucher man dafür braucht, hängt
allein an der Kaufquote — und damit, was ein Klick kosten darf:

| Kaufquote | Besucher nötig | leistbarer Klick |
|---|---|---|
| 3,0 % | 2.233 | 1,94 € |
| 2,0 % *(Annahme des Modells)* | 3.350 | 1,30 € |
| 1,0 % | 6.700 | 0,65 € |
| **0,77 %** | 8.700 | **0,50 €** |
| 0,5 % | 13.400 | 0,32 € |

Der Markt kostet **0,50 bis 2,50 €** je Klick.

> **Unter etwa 0,77 % Kaufquote kann sich das Modell den billigsten Klick
> nicht mehr leisten.** Nicht knapp, sondern grundsätzlich: Dann trägt der
> Klickkanal die Zielgröße bei keinem Gebot mehr.

Das Modell rechnet mit 2 %. Die Herkunft dieser Zahl steht in
`empfindlichkeit.js`: *„phase3-unit-economics.md; im erklärungsbedürftigen B2B
eher optimistisch."* Sie ist seit dem 15. August als Annahme gekennzeichnet
und bis heute nicht gemessen.

Zwischen 2 % und 0,77 % liegt Faktor 2,6. Das ist kein Feinjustieren, sondern
der Unterschied zwischen einem tragfähigen Kanal und keinem.

**Was es billiger macht:** Die Messung kostet 449 € (299 Klicks schließen 1 %
mit 95 % Sicherheit aus) und ist damit gegenüber dem Startbudget von 10.000 €
gering. Die Entscheidung ist bezahlbar — sie war nur nie beziffert.

**Was daran gefährlich bleibt:** Gemessen werden kann sie nur im Posteingang
des Betreibers, und die E-Mail-Adresse fehlt bis heute in `betreiber.json`.
Ein Klickbudget ohne Zähler kauft Klicks und keine Erkenntnis.

---

## 2. Der Markt ist möglicherweise zu klein — und niemand hat nachgesehen

Damit das Tagesbudget überhaupt ausgegeben werden kann, müssen die 33
Keywords des ersten Anlaufs **im Liefergebiet** zusammen 2.500 bis 6.700
Suchanfragen im Monat tragen (je nach Klickrate, 3 bis 8 %).

Fünf Bezirke. Ein Fachsortiment. Suchbegriffe wie „Kaminsystem einzügig".

Wenn der Markt weniger hergibt:

| Volumen/Monat | Klicks/Monat | Engpass | Monate bis zur belastbaren Aussage |
|---|---|---|---|
| 500 | 25 | Markt | **12,0** |
| 1.000 | 50 | Markt | **6,0** |
| 2.000 | 100 | Markt | 3,0 |
| 4.000 | 200 | ausgeglichen | 1,5 |

Aus 45 Tagen werden dann sechs Monate, und 225 € Budget im Monat bleiben
liegen. Ein liegengebliebenes Budget ist kein gespartes Geld, sondern ein
Versuch, der sich hinzieht — und in dieser Zeit wirkt Risiko 3.

**Dieses Risiko ist das einzige der drei, das sich heute und kostenlos
abklären lässt.** Der Keyword-Planer ist gratis, ein Ads-Konto ohne
geschaltete Kampagne kostet nichts, und die Messliste liegt fertig:
`npm run messliste`, 33 Begriffe, Ort = Liefergebiet.

Dass es nicht abgeklärt ist, ist der eigentliche Befund. Der Plan rechnet seit
drei Wochen mit einem Kanal, dessen Größe niemand nachgesehen hat.

---

## 3. Die Rohmarge ist der empfindlichste Hebel — und die Preisbasis altert

Die Empfindlichkeitsrechnung über alle vier Annahmen:

| Annahme | Elastizität | Besucherbedarf bei 10 % schlechter |
|---|---|---|
| **Rohmarge** | **2,24** | 3.350 → 4.100 |
| Warenkorb netto | 1,19 | 3.750 |
| Umsatzquote je Besuch | 1,11 | 3.723 |
| Werbekostenanteil | 0,75 | 3.600 |

Zehn Prozent weniger Marge kosten **750 zusätzliche Besucher im Monat** —
etwa so viele, wie der erste Anlauf in vier Monaten bringt. Die Rohmarge ist
außerdem die einzige Annahme, die überhaupt kippen kann: Bei 56 % schlechter
trägt das Modell nicht mehr.

Und sie erodiert bereits, unbemerkt:

```
Preisbasis: 22.04. bis 17.08.2026
  ältester Einkaufspreis   132 Tage
  Median                    50 Tage
  über 90 Tage               7 Artikel
```

Jede Preiserhöhung des Lieferanten seit April ist Marge, die der Shop
weiterhin als vorhanden ausweist. Der Preisrhythmus des Lieferanten ist
unbekannt; die 90-Tage-Grenze der Prüfung ist **gesetzt, nicht gemessen**.

Die Verbindung zu Risiko 2 ist der unangenehme Teil: Je länger der Versuch
dauert, weil der Markt dünn ist, desto weiter altert die Grundlage, auf der
gerechnet wird.

---

## Was daraus folgt

Die drei Risiken sind nicht gleich behandelbar:

| Risiko | Abklärbar durch | Kostet | Status |
|---|---|---|---|
| Marktgröße | Keyword-Planer, Liste liegt fertig | **nichts** | offen, seit drei Wochen |
| Preisbasis | eine Frage an den Lieferanten, mit fünf anderen zusammen | **nichts** | offen |
| Kaufquote | den Versuch selbst, 449 € bis zur ersten Aussage | Geld | braucht vorher die E-Mail-Adresse |

**Die beiden kostenlosen zuerst.** Sie können den teuren Versuch entweder
rechtfertigen oder ihn vorher stoppen — und beide hängen an nichts als einer
Entscheidung, keine an einer Ausgabe.

## Empfehlung

Der Shop ist gebaut, geprüft und in sich stimmig; das Modell schreibt sich
selbst einen Klickpreis von 1,30 € vor und liegt damit mitten im Marktband.
Was fehlt, ist keine Arbeit an der Technik, sondern **zwei kostenlose
Auskünfte**: die Marktgröße aus dem Keyword-Planer und die sechs Fragen an den
Lieferanten in einem Gespräch.

Erst danach ist die Frage, ob Geld für Rechtstexte, Zahlungsanbieter und
Werbung sinnvoll ausgegeben ist, überhaupt beantwortbar. Vorher wäre jede
Ausgabe eine Wette auf eine Zahl, die niemand gemessen hat.

---

## Stand

Alle Zahlen aus `npm run werbeprobe`, `npm run empfindlichkeit`,
`npm run pruefe-preisalter` und `npm run messliste`. Nichts an diesem Dokument
löst Ausgaben aus; die Kampagnen stehen auf **PAUSIERT**.
