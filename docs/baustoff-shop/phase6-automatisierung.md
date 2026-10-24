# Phase 6 — Automatisierung und Personenunabhängigkeit

Stand: 2026-08-14. Die Kernvorgabe des Auftrags lautet „komplett unabhängig von
meiner Person". Sie steht seit Beginn als Zielbild in den Unterlagen, ist aber
nie prozessweise geprüft worden. Das geschieht hier.

## Der Prüfmaßstab

Die Frage ist nicht „läuft es automatisch". Automatisch läuft vieles, solange
nichts schiefgeht. Die belastbare Frage lautet:

> **Was bricht, wenn der Auftraggeber vier Wochen nicht erreichbar ist?**

Alles, was dann liegen bleibt und dabei Schaden anrichtet — verlorenes Geld,
verärgerte Kunden, verstrichene Fristen — ist echte Personenabhängigkeit. Alles,
was nur wartet, ist es nicht.

## Prozessinventar

Grundlage sind die korrigierten Mengen aus
[`phase4-sortiment-und-materialwert.md`](./phase4-sortiment-und-materialwert.md):
37 Bestellungen im Monat, Ø 650 €, reines Streckengeschäft, Sperrgutversand per
Spedition.

| Vorgang | Menge/Monat | Automatisierbar | Restaufwand |
|---|---|---|---|
| Bestellannahme und Zahlung | 37 | vollständig | 0 h |
| Bestelldatenübergabe an Hersteller | 37 | nur mit Schnittstelle | 0,3–2,5 h |
| Preis- und Verfügbarkeitspflege | laufend | nur mit Datenfeed | 0,5–2,0 h |
| Rückfragen zum Liefertermin | ~7 | teilweise | 1,2 h |
| Transportschäden im Speditionsversand | 1–2 | nein | 1,1 h |
| Fachliche Auskunft vor dem Kauf | 4–11 | nur vorwegnehmend | 0,9–2,8 h |
| Rechnung und Buchhaltung | 37 | vollständig | 1,0 h |
| Rücktritt und Retoure | ~0 | entfällt, siehe Gate 7 | 0 h |
| Inhaltspflege, Normenänderungen | laufend | nein, aber planbar | 1,5 h |
| Rechtstexte aktuell halten | laufend | gekaufter Dienst | 0 h |

### Zwei Szenarien, und der Unterschied ist die ganze Phase

| | ohne Datenfeed, ohne Auswahlhilfen | mit Datenfeed und Fachinhalten |
|---|---|---|
| Bestellübergabe | 2,5 h | 0,3 h |
| Preis- und Sortimentspflege | 2,0 h | 0,5 h |
| Fachliche Auskunft | 2,8 h | 0,9 h |
| Übrige Positionen | 4,8 h | 4,8 h |
| **Summe** | **~12 h/Monat** | **~6,5 h/Monat** |

Die Vorgabe von 4–8 Stunden im Monat aus
[`skalierung-und-passivitaet.md`](./skalierung-und-passivitaet.md) ist
erreichbar — aber nicht von selbst. Sie hängt an genau zwei Bedingungen, und
beide sind heute unbestätigt.

## Gate 6 — ohne strukturierte Produktdaten kein Shop

Im Streckengeschäft besitzt der Händler weder Ware noch Bestandsinformation. Er
verspricht Verfügbarkeit, die er nicht kontrolliert, und Preise, die ein anderer
festlegt. Ohne maschinenlesbare Daten heißt das: jede Preisrunde des Herstellers
ist Handarbeit, jede Lieferzeitangabe eine Vermutung.

Bei einem Sortiment aus wenigen Dutzend Artikeln ist das im ersten Jahr
erträglich. Es ist aber genau die Art laufender Pflicht, die der Auftrag
ausschließen wollte — und sie wächst mit dem Sortiment, nicht mit dem Umsatz.

> **Gate-6-Entscheidung: Mindestens ein Kernlieferant muss strukturierte
> Produktdaten liefern** — CSV, Schnittstelle oder wenigstens eine
> maschinenlesbare Preisliste mit angekündigtem Aktualisierungsrhythmus. Liefert
> keiner der sechs angefragten Hersteller das, fällt das Shopmodell an der
> Automatisierungsvorgabe, und die Leadvermittlung wird zum Standardweg. Sie
> kommt ohne Artikeldaten aus und ist damit strukturell personenunabhängiger.

Das ist ohne Zusatzaufwand entscheidbar: Anschreiben A fragt in Punkt 6 bereits
nach Produktdaten als CSV, Schnittstelle oder Katalog. Neu ist nur, dass diese
Antwort **Gate-Charakter** hat und nicht bloß eine technische Randnotiz ist.

Gate 6 gehört damit in Stufe 0 des Modells aus
[`phase9-meilensteine-und-abbruch.md`](./phase9-meilensteine-und-abbruch.md) —
zusammen mit Rohmarge, Streckengeschäft und Frachtregelung. Aus drei
Bedingungen an den Lieferanten werden vier.

## Gate 7 — der Shop wird reiner B2B-Shop

Die größte automatisierungsfeindliche Einzelposition im Projekt war bisher das
Verbraucherrücktrittsrecht: vierzehn Tage, und bei fehlerhafter Belehrung zwölf
Monate und vierzehn Tage, wie in
[`phase8-compliance.md`](./phase8-compliance.md) beschrieben. Bei Sperrgut, das
per Spedition auf eine Baustelle geliefert wurde, ist eine Rücknahme
wirtschaftlich ein Totalschaden.

Diese Position lässt sich streichen. Im B2B-Geschäft gibt es kein
Rücktrittsrecht nach § 11 FAGG; wird ein Shop als reiner B2B-Shop geführt und
werden Verträge ausschließlich mit Unternehmern geschlossen, gelten die
Verbraucherschutzbestimmungen von FAGG und KSchG nicht.

Das passt zur festgelegten Zielgruppe: In [`PARAMETER.md`](./PARAMETER.md) sind
Handwerksbetriebe als vorrangige Zielgruppe bestimmt.

Und es kostet nichts. Der Funnel in
[`phase7-inhalte-und-funnel.md`](./phase7-inhalte-und-funnel.md) teilt sich
ohnehin: Neubau führt zum Materialverkauf, Bestand zur Sanierungs-Leadstrecke.
Der private Eigentümer war nie als Warenkäufer vorgesehen — er ist der Lead.

> **Gate-7-Entscheidung: Der Warenverkauf wird ausschließlich an Unternehmer
> gerichtet.** Privatpersonen werden über die Leadstrecke an Partnerbetriebe
> vermittelt, nicht beliefert. Begründung: Der FAGG-Rücktritt entfällt samt der
> Zwölfmonatsfalle, die Zielgruppenvorgabe wird eingehalten, und der
> B2C-Zweig verliert nichts, weil er ohnehin kein Warenzweig war.

**Bedingung, ohne die die Entscheidung wertlos ist:** Unternehmer genießen
diese Erleichterung nur, wenn tatsächlich Maßnahmen zum Ausschluss von
Verbraucherbestellungen umgesetzt sind. Ein Hinweis „nur für Gewerbetreibende"
im Kleingedruckten genügt nicht. Nötig sind mindestens: Registrierung mit
Firmendaten vor der Bestellung, UID-Abfrage, Nettopreisdarstellung und ein
Bestellprozess, der ohne Unternehmerbestätigung nicht abschließbar ist. Werden
diese Maßnahmen nicht wirksam gesetzt, gilt Verbraucherrecht trotzdem — und
zwar rückwirkend für alle betroffenen Bestellungen.

Damit ist das eine **Umsetzungsauflage für Stufe 3**, keine erledigte Sache.
Vor der Freischaltung des Warenverkaufs ist sie anwaltlich oder über einen
Rechtstexteanbieter mit B2B-Paket abzusichern. Der Nebeneffekt: B2B-Rechtstexte
sind in der Regel schlanker und günstiger als B2C-Pakete mit
Widerrufsbelehrung.

### Korrektur an phase8-compliance.md

Dort steht das FAGG-Rücktrittsrecht als eines der Hauptrisiken. Für den
Warenverkauf trifft das nach Gate 7 nicht mehr zu. Bestehen bleibt es überall
dort, wo Privatpersonen etwas entgeltlich beziehen — also falls die Vermittlung
an Messstellen jemals kostenpflichtig für den Endkunden würde. Solange sie das
nicht ist, ist der Weg frei.

## Was sich nicht automatisieren lässt

Die fachliche Auskunft. Sie ist zugleich die Quelle der 32 % Rohmarge und die
Quelle der Personenabhängigkeit — dieselbe Spannung, die
[`PARAMETER.md`](./PARAMETER.md) mit dem Satz auflösen wollte, das Fachwissen
fließe „einmalig in Ratgeberinhalte, Auswahlhilfen und Rechner ein".

Diese Auflösung ist plausibel, aber sie ist eine Behauptung. Sie stimmt nur,
wenn die Inhalte die Fragen tatsächlich vorwegnehmen. Ob sie das tun, ist
messbar:

> **Neue Kennzahl für Stufe 3: Beratungsanfragen je Bestellung ≤ 0,2.**
> Bleibt der Wert nach sechs Monaten Inhaltsarbeit über 0,2, nimmt der Inhalt
> die Fragen nicht vorweg. Dann ist das Geschäft ein Beratungsgeschäft mit
> angeschlossenem Verkauf, nicht umgekehrt — und die Vorgabe der
> Personenunabhängigkeit ist mit diesem Sortiment nicht erfüllbar.

Drei Wege, falls die Marke gerissen wird, in der Reihenfolge der Bevorzugung:

1. **Inhalte nachschärfen** — die tatsächlich gestellten Fragen werden zu
   Inhalten. Kostet Zeit, skaliert dauerhaft, ist der einzige Weg, der die
   Vorgabe einhält.
2. **Fachliche Erstauskunft einkaufen** — ein technischer Innendienst auf
   Stundenbasis. Löst das Problem gegen Geld und ist eine Ausgabe, also
   freigabepflichtig.
3. **Abhängigkeit akzeptieren** — dann ist die Vorgabe aufgegeben und das Ziel
   ein anderes. Das wäre offen zu benennen, nicht stillschweigend hinzunehmen.

## Der Vier-Wochen-Test

| Vorgang | Was in vier Wochen Abwesenheit passiert | Schaden |
|---|---|---|
| Bestellungen und Zahlungen | laufen weiter | keiner |
| Bestellübergabe **mit** Feed | läuft weiter | keiner |
| Bestellübergabe **ohne** Feed | bricht am ersten Tag | hoch — bezahlte, nicht ausgelöste Aufträge |
| Preispflege | veraltet langsam | gering, bis ein Hersteller erhöht |
| Transportschäden | bleiben liegen | hoch — Fristen und Kundenvertrauen |
| Fachanfragen | bleiben liegen | mittel — verlorene Umsätze, kein Rechtsschaden |
| Buchhaltung | läuft weiter | keiner |

Zwei Punkte sind kritisch, und nur einer davon kostet Geld:

- **Die Bestellübergabe** ist der eigentliche Bruchpunkt. Ohne Automatisierung
  ist der Shop nach einem Tag Abwesenheit ein Betrieb, der Geld genommen und
  nichts bestellt hat. Das ist der härteste Grund für Gate 6 — härter als der
  Zeitaufwand.
- **Transportschäden** lassen sich nicht wegautomatisieren, aber entschärfen:
  Wer als Standard eine Eingangsbestätigung mit realistischer Bearbeitungszeit
  versendet und den Shop bei längerer Abwesenheit auf Annahmestopp schaltet,
  wandelt einen Schaden in eine Verzögerung. Das kostet nichts und ist in jedem
  Shopsystem vorhanden.

## Werkzeuge — was später Geld kosten wird

Nichts davon ist beauftragt, gekauft oder ausgelöst. Die Aufstellung dient nur
der Vollständigkeit der Planung.

| Zweck | Spanne | Fällig ab |
|---|---|---|
| Feed-Verarbeitung, Bestellweiterleitung | 0–50 €/Monat, oft im Shopsystem | Stufe 3 |
| Buchhaltungsanbindung | 10–30 €/Monat | Stufe 3 |
| Anfragen-Postfach mit Regeln und Vorlagen | 0–20 €/Monat | Stufe 3 |
| Rechtstexte B2B mit Aktualisierung | 10–25 €/Monat | Stufe 2 |

Zusammen 20–125 € im Monat. Das bleibt innerhalb der in
[`phase3-unit-economics.md`](./phase3-unit-economics.md) angesetzten 650 €
Fixkosten; die Annahme wird nicht angetastet.

## Auswirkung auf die übrigen Dokumente

| Dokument | Änderung |
|---|---|
| `phase9-meilensteine-und-abbruch.md` | Gate 6 in Stufe 0; neue Kennzahl Beratungsanfragen je Bestellung in Stufe 3 |
| `phase8-compliance.md` | FAGG-Risiko entfällt für den Warenverkauf; B2B-Ausschlussmaßnahmen kommen als Auflage hinzu |
| `anschreiben-entwuerfe.md` | keine Textänderung; Punkt 6 wird von Randfrage zu Gate-Frage aufgewertet |
| `PARAMETER.md` | die Auflösung der Fachwissens-Spannung ist jetzt an eine messbare Marke gebunden |

## Was offen bleibt

- Ob ein Hersteller überhaupt strukturierte Daten liefert — beantwortet
  Anschreiben A.
- Ob die Anfragequote unter 0,2 fällt — beantwortet erst der Betrieb.
- Welche B2B-Ausschlussmaßnahmen im konkreten Shopsystem genügen — vor Stufe 3
  rechtlich abzusichern, nicht vorher entscheidbar.

## Quellen

- [E-Commerce Rechtsfrage #14: Wie wird ein Onlineshop zum reinen B2B-Onlineshop?, WKO](https://www.wko.at/noe/e-commerce/e-commerce-rechtsfrage-14)
- [Rücktrittsrecht im Online-Shop: Warenkauf B2C, WKO](https://www.wko.at/internetrecht/ruecktrittsrecht-bei-warenkauf-im-internet)
- [Rücktrittsrecht Fernabsatz FAGG: Pflichten für Händler, Brandauer Rechtsanwälte](https://brandauer-rechtsanwaelte.at/2026/06/08/fernabsatz-ruecktrittsrecht-fagg-unternehmer-ecommerce-oesterreich/)
- [Rücktritt von einer Onlinebestellung, Europäisches Verbraucherzentrum Österreich](https://europakonsument.at/ruecktritt-von-einer-onlinebestellung/66183)
