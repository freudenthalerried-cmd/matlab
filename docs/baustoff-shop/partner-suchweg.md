# Suchweg zu den Partnerbetrieben — die Vorarbeit für Entwurf B

Stand: 2026-08-17. Für die dreizehn Lieferanten-Adressaten ist der Zugang
erhoben (`adressaten-und-zugaenge.md`); für die Partnerbetriebe der
Leadvermittlung (Entwurf B, drei bis fünf Betriebe) fehlte er. Diese
Runde legt den Suchweg fest — **nicht die Betriebe**. Versendet wurde
nichts.

## Warum hier keine Firmennamen stehen

Bei den Lieferanten stehen Namen im Repo, bei den Partnern nicht — der
Unterschied ist Absicht. Die zwölf Hersteller und das Lagerhaus sind
Konzerne und Genossenschaften, deren Nennung eine Sortimentsfrage
dokumentiert. Partnerkandidaten sind kleine regionale Handwerksbetriebe;
eine im Repo geführte Liste mit Bewertungen („reagiert langsam",
„abgelehnt") wäre eine Datei über konkrete kleine Firmen, die keiner
braucht und die veraltet. Die Kandidatenliste entsteht **am Versandtag
lokal** nach dem hier festgelegten Weg und bleibt beim Auftraggeber; ins
Repo kommt später nur das anonymisierte Auswertungsergebnis
(`npm run auswerten`, Partnerteil — Betriebe dort als Bezirk + laufende
Nummer).

## Das Suchgebiet

Nach Gate 13 ist die Gebietseinheit der politische Bezirk; die
Ausbaufolge beginnt in **Oberösterreich** (dichteste Schutzgemeinden-
Belegung). Zielbezirke der ersten Runde, in dieser Reihenfolge:

1. **Mühlviertel** — Freistadt, Urfahr-Umgebung, Rohrbach, Perg: das
   Granitgebiet mit den meisten Schutzgemeinden und der höchsten
   Radonlast im Bestand.
2. **Zentralraum** — Linz-Land, Wels-Land: Neubauvolumen und
   Erreichbarkeit für Betriebe, die das Mühlviertel mit abdecken.
3. Nachrückend: Braunau, Vöcklabruck, Schärding (Innviertel), sobald die
   erste Runde je Bezirk zwei Kandidaten hat.

Ried im Innkreis ist als einziger OÖ-Bezirk kein Vorsorgegebiet — dort
ansässige Betriebe sind trotzdem zulässig, wenn sie Nachbarbezirke
abdecken (Frage 3 des Anschreibens klärt genau das).

## Der Suchweg, in Reihenfolge

**Quelle 1 — WKO Firmen A-Z (`firmen.wko.at`), amtsnahe Kammerdaten.**
Bezirksscharfe Verzeichnisse nach Branche, URL-Muster
`firmen.wko.at/<branche>/<bezirk>_bezirk/`. Heute verifiziert:
„Bauwerksabdichter" führt 241 Betriebe in Oberösterreich, davon z. B.
9 in Urfahr-Umgebung und 12 in Vöcklabruck — der Kandidatenpool je
Bezirk ist einstellig bis knapp zweistellig, eine Durchsicht je Bezirk
ist eine Stunde, kein Projekt. Branchenreihenfolge:

1. „Bauwerksabdichter" — die engste Übereinstimmung mit dem Sortiment,
2. „Abdichtung" (breiter, 340 in OÖ) für Bezirke mit dünnem Ergebnis,
3. „Baumeister" nur nachrangig — über 1.000 in OÖ, dort filtert erst
   die Website-Durchsicht (führt der Betrieb Kellersanierung oder
   Abdichtung ausdrücklich als Leistung?).

**Quelle 2 — Herold und Google Maps** („Kellerabdichtung <Bezirk>",
„Kellersanierung <Bezirk>") als Gegenprobe: Wer dort mit eigener
Leistungsseite auftaucht, aber nicht in der WKO-Branche steht, wird
trotzdem Kandidat — die Branchenzuordnung der Kammer ist Selbstauskunft.

**Vorfilter je Kandidat (von der Website ablesbar, ohne Kontakt):**

| Kriterium | Ausschluss wenn |
|---|---|
| Leistungen: Abdichtung, Kellersanierung oder Feuchtesanierung genannt | nein → raus |
| Eigener Betrieb vor Ort (kein Franchisesystem) | Franchise → raus (Gate-16-Umfeld: die Systeme sind der Wettbewerb der Leadvermittlung, nicht ihre Kunden) |
| Erreichbarkeit: Telefon und E-Mail im Impressum | keine E-Mail → nachrangig |
| Einzugsgebiet plausibel zum Zielbezirk | nur Ferngebiet → raus |

Radonsanierung als ausgewiesene Leistung ist **kein** Vorfilter — sie
ist Frage 1 des Anschreibens. Ein guter Abdichtungsbetrieb ohne
Radon-Marketing ist genau der Kandidat, dem das Portal etwas bietet.

**Ziel je Bezirk: zwei Kandidaten.** Die Partnerauswertung
(`partnerauswertung.js`) braucht für die Fristenlösung je Bezirk zwei
genannte Betriebe, und der zweithöchste Leadpreis trägt die Rechnung —
ein einzelner Kandidat je Bezirk macht die Runde auswertbar, aber nicht
belastbar. Für Stufe A (drei bis fünf Betriebe) heißt das: zwei bis
drei Bezirke mit je zwei Kandidaten, nicht fünf Bezirke mit je einem.

## Was am Versandtag zu tun ist

1. Je Zielbezirk die WKO-Liste durchgehen, Vorfilter anwenden, zwei
   Kandidaten notieren (lokal, nicht im Repo).
2. Entwurf B unverändert versenden — die sieben Fragen sind die
   eigentliche Auswahl, insbesondere 4 (Aufnahmekapazität), 6
   (Rückmeldezeit) und 7 (namentliche Nennung, Ausschlussfrage).
3. Antworten in die Partnerfelder der Antwortdatei eintragen
   (`beispiel/antworten-beispiel.json` als Muster) und mit
   `npm run auswerten` vortragen.

Damit ist auch die zweite Versandstrecke auf den mechanischen Rest
geschrumpft: Liste durchgehen, Vorfilter, versenden. Die Freigabe für
den Versand von Entwurf B bleibt — wie alles Versenden — beim
Auftraggeber.

## Quellen

- WKO Firmen A-Z: firmen.wko.at — Verzeichnisse „Bauwerksabdichter"
  (241 in OÖ; Urfahr-Umgebung 9, Vöcklabruck 12), „Abdichtung" (340 in
  OÖ), „Baumeister" (>1.000 in OÖ); bezirksscharfe URLs verifiziert am
  2026-08-17.
