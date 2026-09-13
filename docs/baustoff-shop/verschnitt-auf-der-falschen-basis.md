# Der Verschnitt stand auf der falschen Basis — und Lücken verschwanden stumm

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Neuntes Selbstaudit in der Richtung „vom Verhalten zur Erklärung", diesmal an
`bedarf.js` — dem Materialbedarfsrechner, der die Rollenbindung zum
Verkaufsargument macht.

## Fund 1: „34,3 m² über dem Bedarf (18 %)" — die 18 % waren die falsche Zahl

Der Rollenbindungs-Hinweis — das Paradestück des Rechners, im README als
Beispiel zitiert — teilte den Überschuss durch die **gelieferte** Fläche:
34,3 / 187,5 = 18 %. Der Satz sagt aber „über dem **Bedarf**", und über dem
Bedarf sind es 34,3 / 153,2 = **22 %**. Die Zahl untertrieb genau den
Effekt, den der Rechner sichtbar machen soll — der **fünfte Zahlenfehler
des Projekts, der fünfte in die optimistische Richtung.** Korrigiert; das
README-Beispiel zeigt jetzt 22 %.

## Fund 2: Eine Position, die das Sortiment nicht führt, verschwand stumm

`nimm()` übersprang unbekannte Artikel wortlos („Sortiment kann kleiner sein
als der Rechner"), und der Bahnen-Block hatte zusätzlich einen eigenen
Wächter, der noch **vor** `nimm()` griff. Fehlte die Leitposition im
Katalog, war die Stückliste um 70 % ihres Werts ärmer — ohne ein Wort. Der
Kopf derselben Datei verspricht: „das gehört in die Ausgabe, nicht ins
Kleingedruckte."

Jetzt sammelt der Rechner die übersprungenen Positionen und schreibt sie in
die Hinweise: „Nicht im Sortiment und deshalb nicht enthalten: … — die
Stückliste ist an diesen Stellen unvollständig." Der Testfall deckte dabei
die zweite Schicht auf: Die erste Fassung der Korrektur meldete nur
`nimm()`-Lücken, nicht den Bahnen-Wächter — wer eine Meldung nachrüstet,
muss alle Pfade finden, auf denen etwas verschwindet.

## Geprüft

| | |
|---|---|
| neue Testfälle | 2 |
| Testfälle gesamt | 403, alle grün, 0 mit Verdacht |

Gegenproben, beide sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| Prozentbasis wieder die gelieferte Fläche | 1 Testfall fällt |
| übersprungene Positionen wieder stumm | 1 Testfall fällt |

Demo neu gebaut. README-Beispiel und Testzahl nachgezogen.

## Kein Gate

Kein Gate ändert sich. Die Rollenbindung von 22 % statt 18 % verschiebt
keine Referenzzahl (der Warenkorb rechnete immer mit den vollen 5 Rollen —
falsch war nur der ausgewiesene Prozentsatz), aber sie macht das
Verkaufsargument des Rechners ehrlicher: Der Kunde, dem man 22 % Verschnitt
vorrechnet, glaubt auch den übrigen Zahlen. Nichts gesendet, nichts
gekauft, keine Ausgabe.
