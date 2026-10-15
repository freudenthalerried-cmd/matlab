# Prüfung B als Werkzeug: `npm run suchvolumen`

Stand: 2026-08-17. Nach der Werkzeugwahl (`werkzeugwahl-suchvolumen.md`)
fehlte das letzte Stück der Messstrecke: Die Auswertungsregeln der
Entscheidungsmatrix existierten nur als Prosa, und eine messfertige
Keyword-Liste gab es nicht. Am Messtag hätte jemand beides aus drei
Dokumenten zusammensuchen müssen. Jetzt ist Prüfung B ausführbar — wie
Prüfung A und die Partnerrunde vor ihr.

## Was gebaut wurde

**`shop/src/suchauswertung.js`** — die Regeln der Matrix als Modul,
und zwei Stellen, an denen die Prosa zahlenfest gemacht werden musste
(vorab, nach dem Gate-17-Prinzip):

1. **Difficulty-Zuordnung:** bis 29 niedrig, 30–49 mittel, ab 50 hoch —
   die übliche Skalenteilung der Werkzeuge aus der Werkzeugwahl.
2. **„Niedrig bis mittel" je Cluster:** Höchstens ein Drittel des
   Clustervolumens darf auf hart umkämpften Begriffen liegen
   (volumengewichtet). Wer die 200er-Schwelle nur mit umkämpften
   Begriffen reißt, hat keine erreichbare Nachfrage gemessen.

Die vier Bedingungen: mindestens drei Cluster mit je ≥ 200 Suchen,
kumuliert ≥ 2.000 **über die bestandenen Cluster**, Wettbewerbsregel je
Cluster, und die Gruppe-C-Regel — mindestens ein bestandener Cluster
außerhalb der Reichweitenthemen, sonst ist gemessen, dass ein anderer
den Markt hat.

**`shop/data/messliste.json`** — die messfertige Liste: sechs Cluster
aus der Inhaltslandkarte (drei regulatorische der Gruppe A, zwei
Bestandscluster der Gruppe B, ein Reichweiten-Cluster der Gruppe C),
31 echte Keywords, Werte leer. Am Messtag wird eine Kopie gefüllt —
`volumen` und `kd` je Keyword aus dem Werkzeug.

**`shop/bin/suchvolumen.mjs`** — das Vortragswerkzeug nach dem Muster
der beiden anderen: Probelauf über die fiktive Beispielmessung, klare
Meldung statt Stacktrace bei kaputter Datei, fehlende Werte werden
benannt statt still zu Null.

## Die Beispielmessung zeigt absichtlich einen Grenzbefund

Die fiktiven Werte in `beispiel/messung-beispiel.json` bestehen
**nicht**: Vier Radon-Cluster bestehen einzeln, verfehlen aber kumuliert
die 2.000 (1.450); der große Feuchte-Cluster hätte das Volumen, fällt
aber am Wettbewerbsanteil (38 % hart umkämpft). Das ist genau die
Konstellation, vor der Gate 15 und 16 warnen — und der Grund, warum die
Messung überhaupt Geld kosten darf: Ob die echten Zahlen so aussehen,
weiß niemand vor dem Messmonat. Ein Beispiel, das glatt bestünde, würde
das Gegenteil suggerieren.

## Absicherung

Acht Testfälle: Skalenteilung an den Kanten (29/30, 49/50), die
200er-Schwelle bei genau 200 und 199, die Drittelgrenze volumengewichtet
an der Kante, die Gruppe-C-Regel (drei bestandene C-Cluster über 2.000
bestehen nicht; derselbe Fall mit einem A-Cluster besteht), die
kumulierte Schwelle nur über bestandene Cluster, die
Vollständigkeitsprüfung, die Repo-Messliste selbst (alle drei Gruppen
vertreten, noch ohne Werte) und der Kindprozess-Lauf des Werkzeugs.
Gegenproben per Mutation: Gruppe-C-Regel entfernt → 1 Testfall fällt;
kumuliert über alle statt über bestandene → 2 fallen.

Testbestand: **430, alle grün, Prüfer ohne Verdacht.**

## Stand der drei Prüfstrecken

| Prüfung | Regeln | Werkzeug | fehlt nur noch |
|---|---|---|---|
| A — Hersteller/Großhandel | Matrix + `auswertung.js` | `npm run auswerten` | Freigabe Versand (0 €) |
| Partnerrunde | `partnerauswertung.js` | `npm run auswerten` | Freigabe Versand (0 €) |
| B — Suchvolumen | Matrix + `suchauswertung.js` | `npm run suchvolumen` | Freigabe Messmonat (~50 €, Rahmen 100–200 €) |

Alle drei Strecken sind damit von der Regel bis zum Vortrag ausführbar,
bevor der erste echte Wert existiert.
