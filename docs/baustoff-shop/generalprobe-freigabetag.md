# Die Generalprobe des Freigabetags — die Kette läuft, bevor es zählt

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Neuer Prüfwinkel nach dem Ende der Modul-Audits: nicht mehr ein Modul gegen
seine Erklärung, sondern **die ganze Strecke gegen ihren Zweck.**

## Warum

Jedes Glied des Freigabetags ist einzeln geprüft — Bogen, zwei Antwortwege,
Rundenregel, Kaskade, Sessionbedarf, Partnerregeln. Gate 17 behauptet: Alle
Antworten sind am Tag ihres Eintreffens auswertbar. Ob die Glieder auch
**ineinandergreifen**, hatte nie jemand am Stück geprüft — und
Integrationsnähte sind genau die Stellen, an denen einzeln grüne Teile
gemeinsam scheitern.

## Was gebaut wurde

`test/generalprobe.test.js` — drei Proben mit **fiktiven, als FIKTIV
markierten** Antworten, die nichts über reale Hersteller belegen, sondern
nur, dass die Strecke trägt:

1. **Generalprobe A (Lieferanten):** Zwei fiktive Hersteller (40 % und 36 %
   Rabatt), ein fiktiver Großhändler (Netto-Einkauf gegen den Deckel,
   ≈ 41 % Marge) und ein Schweiger laufen durch Bogen → Rundenauswertung →
   Kaskade. Ergebnis ohne einen Handgriff am Code: Prüfung A bestanden,
   tragende Marge 40 % (der zweitbeste Wert, wegunabhängig), Kaskade
   tragfähig, Sessionbedarf im erwarteten Band. Der Großhandelsweg und der
   Rabattweg mischen sich in einer Runde — genau das war die offene Naht.
2. **Gegenlage:** Eine 31-%-Zusage reißt die Untergrenze, die Runde fällt
   mit dem richtigen Grund („ein einzelner Lieferant ist kein Sortiment").
3. **Generalprobe B (Partner):** Fünf fiktive Rückmeldungen — zwei
   Verweigerungen (Nennung, Frist), ein reiner Radonsanierer — ergeben:
   machbar mit drei Bestandenen, tragender Leadpreis 180 € (zweithöchster),
   im Band, Gruppe-C-Reichweite ausgewiesen.

**Befund: kein Nahtbruch.** Alle drei Proben liefen beim ersten Anlauf
durch. Nach neun Funden in den Modulen ist das die erste Ebene, die auf
Anhieb hält — plausibel, weil die Nähte (gemeinsame `marge`, gemeinsame
`lage`) in den letzten Runden bewusst vereinheitlicht wurden.

Der Hohltest-Prüfer hat dabei seine eigene Regel durchgesetzt: Die erste
Fassung der Partner-Probe iterierte ohne Längenzusicherung — gemeldet,
behoben. Gegenprobe an der wichtigsten Naht: Die Rundenauswertung reicht
die Marge nicht mehr an die Kaskade weiter → **3 Testfälle fallen.**

## Geprüft

| | |
|---|---|
| neue Testfälle | 3 (Generalproben) |
| Testfälle gesamt | 406, alle grün, 0 mit Verdacht |

## Kein Gate

Kein Gate ändert sich. Was sich ändert, ist die Qualität der
Gate-17-Behauptung: Sie war bisher aus Einzelteilen gefolgert, jetzt ist
sie als Kette vorgeführt. Am Tag der Freigabe sind die dreizehn
Lieferantenantworten und die Partnerrückmeldungen nicht nur einzeln
lesbar — sie laufen bis zur Sessionzahl und zum tragenden Leadpreis durch,
und die Probe dafür läuft bei jedem `npm test` mit. Nichts gesendet,
nichts gekauft, keine Ausgabe.
