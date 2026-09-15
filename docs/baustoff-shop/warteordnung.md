# Warteordnung — was der Loop tut, wenn nichts mehr ansteht

Stand: 2026-08-17. Der Vorrat an in sich abgeschlossener Arbeit ist
weitgehend abgetragen: Beide Versandstrecken sind versandtagsfertig, alle
drei Prüfstrecken ausführbar, das Messgerät festgelegt, fünfzehn
Verhaltensaudits über alle Schichten gelaufen, die drei Schaufenster
(Bericht, Funktionsmuster, PR) auf Stand. Was übrig ist, wartet auf
Dinge, die der Loop nicht selbst auslösen kann.

Diese Ordnung legt fest, was eine Runde ohne offene Aufgabe tut — damit
künftige Läufe nicht Arbeit erfinden, um eine Runde zu füllen. Eine
erfundene Runde produziert Dokumente, die niemand braucht, und verwässert
die, die jemand braucht.

## Woran es hängt (nicht vom Loop lösbar)

| Blockade | Löst sich durch |
|---|---|
| Freigabe: dreizehn Anfragen (0 €) | Entscheidung des Auftraggebers |
| Freigabe: Messmonat (~50 €, Rahmen 100–200 €) | Entscheidung des Auftraggebers |
| Firmendaten und eigene UID (Impressum, VIES-Nachweis) | Zulieferung des Auftraggebers |
| Verordnungstext RIS + zwei Spiegel-PDFs (Gebiets-Vollausbau, 104-Gemeinden-Liste) | erster Lauf mit freiem Netzzugang |
| RFC-4180-CSV im Import | erste echte Herstellerpreisliste |
| Audit-Serie | neue Eingangsdaten (Antworten, Messwerte, Preislisten) |

## Der Wartelauf, in dieser Reihenfolge

1. **Netzblockade nachprüfen** (ein Versuch, RIS): Fällt sie, ist der
   Gebiets-Vollausbau sofort die nächste Aufgabe — Verordnungstext
   gegen die Negativliste, 104-Gemeinden-Liste ziehen, `GEBIETSSTAND`
   und Vorbehalt aktualisieren. Fundstellen stehen in
   `gegenpruefung-bezirksliste.md`.
2. **PR #14 prüfen** (Kommentare, Reviews, Checks) — Handlungsbedarf
   dort geht vor allem anderen.
3. **Schaufenster-Abgleich nur bei Substanzänderung** seit dem letzten
   Abgleich: Bericht-Artefakt, Funktionsmuster-Artefakt, PR-Text. Ohne
   Substanzänderung wird nichts republiziert.
4. **Sonst: kurz und ehrlich enden.** Kein neues Dokument, kein Commit
   um des Commits willen. Die Meldung der Runde nennt den Wartegrund
   und ist fertig. Gate 18 gilt sinngemäß auch für Werkzeuge: kein
   neues Werkzeug ohne absehbaren Benutzer.

## Was eine echte neue Aufgabe wäre

Eintreffende Antworten oder Messwerte (→ `npm run auswerten`,
`npm run suchvolumen`, Audit-Serie), gelieferte Firmendaten (→
Impressum-Gerüst füllen), freier Netzzugang (→ Punkt 1), ein
PR-Kommentar, oder eine neue Weisung des Auftraggebers. Alles davon
steht mit Werkzeug und Verfahren bereit; nichts davon braucht
Vorarbeit, die sich vorziehen ließe.
