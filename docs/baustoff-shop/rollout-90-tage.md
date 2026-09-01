# Wochenplan mit Gates — 90 Tage bis zur Entscheidung

**Zwölftes Ergebnis des Ursprungsauftrags.** Es stand bis zum 1. September als
*offen* im Auftragsabgleich, mit dieser Begründung:

> Ein Wochenplan über 90 Tage existiert nicht. […] Was fehlt, ist die Zeitachse
> — und sie ließe sich heute nicht ehrlich schreiben, weil sie am Datum des
> ersten Uploads hängt, das der Auftraggeber setzt.

Die Begründung stimmt für einen **Kalender** und ist falsch für einen **Plan**.
„Woche 3: Anzeigen schalten" behauptet ein Datum, das niemand halten kann, weil
der erste Schritt eine Freigabe des Auftraggebers ist und der zweite eine
Antwort des Lieferanten. Was sich ehrlich schreiben lässt, ist die Kette:

> **Nicht „Woche 3", sondern „Tag N nach der Freigabe, die davor liegt."**

**Tag 0 ist nicht heute.** Tag 0 ist der Tag, an dem der Auftraggeber den ersten
Schritt auslöst. Vorher steht die Kette still, und kein Plan ändert daran etwas.

Der Plan ist ein Werkzeug, kein Text: `npm run rollout` rechnet ihn aus
`src/rollout.js`, `src/werbewirkung.js` und dem Tagesbudget der Kampagne. Was
hier steht, ist seine Ausgabe vom 1. September — dieselbe Trennung wie bei der
PR-Beschreibung, deren Zahlen einmal zwei Stände zurücklagen.

## Das Ergebnis in drei Zeilen

Hauptfall: **9,99 € Tagesbudget, 1,50 € je Klick, eine Kaufquote von 1 %
auszuschließen.**

| | Tage |
| --- | ---: |
| Kette insgesamt | **57** |
| davon der Klickversuch selbst | 45 |
| davon Warten auf Dritte im bestimmenden Strang | 10 |
| davon eigene Arbeit im bestimmenden Strang | **2** |

Bestimmender Strang: **Rechtstexte → Upload → Anzeigen schalten →
Klickversuch.**

> **Der Versuch ist die längste Etappe, und vor ihm liegt fast nur Warten.**
> Wer den Termin halten will, verkürzt keine Arbeit — er löst früher aus.

Zwei Tage. So viel Arbeit liegt zwischen heute und dem Start des Versuchs, auf
dem Strang, der alles bestimmt. Alles andere ist Freigabe und Wartezeit.

## Die elf Etappen

Was nicht voneinander abhängt, läuft nebeneinander — sechs der elf Etappen
können an Tag 0 beginnen. `›` markiert den bestimmenden Strang.

| | Woche | Tag | Etappe | Dauer | Gate |
| --- | --- | --- | --- | --- | --- |
| | 1 | 0 | Repository privat stellen | sofort | — |
| | 1 | 0–1 | Vier Impressumsangaben eintragen | 1 (gesetzt) | — (§ 5 ECG) |
| | 1 | 0–1 | Suchvolumen der 33 Keywords messen | 1 (gesetzt) | **15** |
| | 1 | 0–7 | Ein Gespräch mit dem Lieferanten | 7 (Wartezeit) | **6, 23** |
| **›** | 1–2 | 0–10 | Rechtstexte beauftragen | 10 (Wartezeit) | — |
| | 1–2 | 1–11 | Zahlungsanbieter wählen und anbinden | 10 (Wartezeit) | **21** |
| | 2 | 7–9 | Katalog auf ≥ 100 Artikel erweitern | 2 (gesetzt) | **22, 24** |
| **›** | 2 | 10–11 | `ausgabe/site/` hochladen | 1 (gesetzt) | — |
| **›** | 2 | 11–12 | Die drei Suchkampagnen schalten | 1 (gesetzt) | — |
| | 2 | 11–14 | Produktfeed bei Google Merchant einreichen | 3 (Wartezeit) | **6** |
| **›** | 2–9 | 12–57 | Klicks sammeln bis zur Entscheidung | 45 (gerechnet) | **20** |

Jede Dauer trägt ihre Art, und die Arten sind nicht gleichwertig:

- **gerechnet** — folgt aus Budget, Klickpreis und Abbruchschwelle. Keine Annahme.
- **gesetzt** — meine Annahme mit Begründung. Nachprüfbar, aber nicht gemessen.
- **Wartezeit auf Dritte** — eine Annahme über jemanden, den niemand gefragt
  hat. **Eine Terminzusage ersetzt sie sofort**, und dann ändert sich der Plan.

Die zehn Tage für die Rechtstexte sind die einzige Wartezeit im bestimmenden
Strang. Sie zu verkürzen ist der ganze Hebel, den es vor dem Versuch gibt.

## Was die Frist trägt und was nicht

Die Abbruchschwelle folgt aus der Binomialregel: *n* = ln(0,05)/ln(1−q). Sie
sagt, wie viele Klicks ohne Bestellung eine Quote *q* mit 95 % Sicherheit
ausschließen.

| Quote | Klickpreis | Schwelle | Versuch | Kette gesamt | |
| ---: | ---: | ---: | ---: | ---: | :--- |
| 2,0 % | 0,50 € | 149 | 8 T | 20 T | |
| 2,0 % | 1,50 € | 149 | 23 T | 35 T | |
| 2,0 % | 2,50 € | 149 | 38 T | 50 T | |
| 1,0 % | 0,50 € | 299 | 15 T | 27 T | |
| **1,0 %** | **1,50 €** | **299** | **45 T** | **57 T** | Hauptfall |
| 1,0 % | 2,50 € | 299 | 75 T | 87 T | |
| 0,5 % | 0,50 € | 598 | 30 T | 42 T | |
| 0,5 % | 1,50 € | 598 | 90 T | **102 T** | über der Frist |
| 0,5 % | 2,50 € | 598 | 150 T | **162 T** | über der Frist |

**Lesart.** Eine Kaufquote von 1 % lässt sich innerhalb von neunzig Tagen bei
jedem Marktklickpreis ausschließen. Eine von 0,5 % nur am unteren Rand des
Marktes — sonst reicht die Zeit nicht, und der Versuch endet ohne Urteil.

Das ist keine Kleinigkeit. Die Risikoliste hält fest, dass das Modell **unter
0,77 % Kaufquote** nicht einmal den billigsten Marktklick trägt. Genau in
diesem Bereich versagt der Neunzig-Tage-Rahmen: Er kann sagen, dass 1 % nicht
erreicht wird, aber nicht, ob es 0,6 % oder 0,3 % sind — und der Unterschied
entscheidet über das Vorhaben.

> **Neunzig Tage reichen, um das Modell zu widerlegen, nicht um es knapp zu
> retten.**

Wer den Bereich unter 1 % auflösen will, braucht mehr Budget oder mehr Zeit —
oder er akzeptiert, dass ein Fehlversuch nach 57 Tagen ein *Nein* ist und kein
*Vielleicht*.

## Was dieser Plan nicht kann

- **Die Wartezeiten auf Dritte sind Annahmen, keine Zusagen.** Sieben Tage bis
  zur Antwort des Lieferanten, zehn für die Rechtstexte, zehn für die
  Legitimation beim Zahlungsanbieter, drei für die Feedprüfung. Vier Zahlen,
  vier Platzhalter. Jede Terminzusage ersetzt eine davon.
- **Ein Verkauf beendet den Versuch früher als jede Schwelle.** Die Tabelle
  rechnet den Fall, in dem keiner kommt — die teure Richtung, und die einzige,
  die eine Frist braucht.
- **Reicht das Suchvolumen das Budget nicht aus, dauert jede Zeile länger.**
  Deshalb steht die Messung an Tag 0 und nicht später: Sie kostet nichts und
  kann den ganzen Plan verwerfen, bevor er Geld kostet.
- **Der Plan endet an der Entscheidung, nicht am Betrieb.** Was nach einem
  erfolgreichen Versuch kommt — Sortiment, zweiter Lieferant, Automatisierung —
  steht in den Phasendokumenten und hat keinen Termin, weil es keine Frist hat.

## Warum das jetzt „erfüllt" heißt und vorher nicht

Der Auftragsabgleich vom 31. August hat zwölf Ergebnisse geprüft und **null**
als erfüllt gefunden: acht unter anderem Namen, vier offen. Dieses hier ist das
erste unter dem verlangten Namen und in der verlangten Sache — ein Wochenplan
mit Gates.

Was sich geändert hat, ist nicht die Datenlage. Die Kaufquote ist so ungemessen
wie am 31. August. Geändert hat sich die Form: **Ein Plan, der an Ereignissen
hängt statt an Daten, braucht die Messung nicht, die er erst herbeiführen
soll.**

Drei der übrigen vier bleiben offen, und ihre Gründe stehen unverändert:
Wettbewerbspreise wurden nie erhoben, ein Businessplan behauptet eine Planung
auf einer ungemessenen Annahme, und ein KPI-Dashboard ohne einen einzigen
Besucher ist ein Rahmen, der Betrieb vortäuscht.
