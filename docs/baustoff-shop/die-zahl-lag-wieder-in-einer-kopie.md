# Die Zahl lag wieder in einer Kopie

*15. Oktober 2026, auf Zuruf des Auftraggebers. Fünf Wochen Pause, ein
neu aufgesetzter Container — und `preise/baustoff-preise.json` war zum
zweiten Mal weg.*

---

## Was passiert ist

Der Auftraggeber hat verlangt, den Shop auf bauversand.com zu stellen, „mit
allem was dazugehört wie ein Millionen-Dollar-Shop wie Amazon", mit
KI-Auffindbarkeit und „immer dem besten Preis". Beim Nachsehen brach der erste
Befehl ab:

```
Die Preisdatei fehlt: preise/baustoff-preise.json — ohne sie keine Website.
```

`preise/` steht in `.gitignore` — zu Recht, es trägt die Einkaufskonditionen
des Lieferanten, und das Verzeichnis ist öffentlich. Nur hieß das wieder:

> **Die Zahl, auf der alles ruht, lag in genau einer Kopie — in einem
> Behälter, der jederzeit neu aufgesetzt wird.**

Derselbe Satz steht seit dem 8. September im Kopf von
`bin/preiswiederherstellung.mjs`. Beim ersten Mal war er eine Lehre; beim
zweiten Mal ist er eine Vorhersage, die eingetroffen ist.

## Dass es ein Werkzeug gab, wusste der Auftraggeber besser als ich

Meine erste Antwort an ihn war, die Datei sei verloren und er müsse die
Rechnungen beibringen. Seine Antwort: *„1 erstelle selber oder du hast schon
mal erledigt."*

Er hatte recht. `npm run preise-wiederherstellen` steht seit dem 8. September
im Bestand und rechnet genau diesen Fall zurück: `ekNetto = vkNetto ×
(1 − Zielmarge)`, aus den **veröffentlichten** Verkaufspreisen der gebauten
Seiten. 46 von 46 Artikeln, dazu die zwei Sonderfälle am Listendeckel, die
dort mit ihrer Abweichung verzeichnet sind.

> **Wer einen Rettungsweg baut und ihn beim zweiten Unfall nicht nennt, hat
> ihn für den ersten gebaut.**

Dass ein Werkzeug existiert, stand im Kopf der Datei, in `STATUS.md` und in
`der-rettungsweg-zum-ersten-mal-begangen.md`. Gelesen habe ich keines davon,
sondern aus dem Gedächtnis geantwortet — dieselbe Ursache wie am
15. September, als ich dem Auftraggeber die Reihenfolge von Hochladen und
Impressum falsch herum gesagt habe.

## Die Probe, dass die Rückrechnung stimmt

Nicht behauptet, sondern gemessen: Der Bau nach der Wiederherstellung wurde
gegen die **im Git liegende** Fassung gehalten.

| | |
|---|---|
| Dateien im gebauten Shop | 90 |
| davon verschieden | 24 |
| Unterschied in allen 24 | **nur das Preisalter** |

Jeder Preis ist identisch. Die 24 Abweichungen heißen *„Diese Grundlage ist
128 Tage alt"* statt *„98 Tage alt"* — die Zeit, nicht die Zahl.

Das ist der beste Nachweis, den dieser Fall zulässt: Wäre die Rückrechnung
daneben, stünden 90 Dateien im Diff und nicht 24.

## Was die fünf Wochen gekostet haben

Der Shop baut wieder, aber er ist nicht derselbe:

- **Preisalter:** jüngster Preis 59 Tage, Median **94**, ältester 176. Die
  eigene Grenze liegt bei 90.
- **Messliste:** 29 → **14** Begriffe. Die Anzeigenliste nimmt Begriffe
  heraus, deren Artikel auf einem zu alten Preis stehen.

> **Eine Liste, die kleiner wird, ohne dass jemand etwas gestrichen hat, misst
> die Zeit und nicht den Markt.**

Das repariert kein Werkzeug. Dafür braucht es eine aktuelle Preisliste vom
Lieferanten — und die ist seit dem 28. August ein offener Punkt.

## Was von außen neu gemessen ist

Alle acht Außengrenzen waren älter als die 30-Tage-Frist und sind am
15. Oktober neu versucht. Ergebnis: unverändert.

| | |
|---|---|
| `bauversand.com`, `all-inkl.com` | 403 am Ausgang |
| Herstellerseiten, RIS, VIES, Crawler-Doku | 403 am Ausgang |
| `api.github.com`, `raw.githubusercontent.com` | 200 |
| Repository | weiter **öffentlich** |

Der Auftraggeber hat gesagt, All-Inkl sei offen. Gesperrt ist nicht sein
Webspace, sondern der Netzausgang **dieser** Umgebung — und das stellt nur er
um. Ohne Zugangsdaten und ohne Freigabe lädt hier niemand etwas hoch.

**Und eine Zeile mit zwei Gesichtern:** `raw.githubusercontent.com` liefert die
gebauten Artikelseiten ohne jeden Schlüssel aus. Seit dem 30. August ist das
als Leck geführt — aus genau diesen Bytes sind 44 von 46 Einkaufspreisen
zurückzurechnen. Heute war derselbe Weg die Rettung. *Dasselbe Loch, aus dem
die Zahlen abfließen, ist das Loch, durch das sie zurückkamen.*

## Was ich nicht gebaut habe

**„Immer der beste Preis."** Ein Lieferant, kein Marktvergleich, keine
Wettbewerbsdaten. Die Zusage könnte niemand belegen; als Werbeaussage ist sie
irreführend (§ 2 UWG) und im Merchant Center ein Ablehnungsgrund. Was der Shop
belegt und auf jeder Artikelkarte zeigt, steht schon da: *„39 % unter der Liste
des Lieferanten"*, artikelweise nachrechenbar, und wo kein Listenpreis bekannt
ist, sagt die Karte das auch.

> **Eine Zusage, die man nicht messen kann, ist keine Zusage, sondern ein
> Risiko mit Ausrufezeichen.**

**„Wie Amazon, mit allem was dazugehört."** Amazon ist Lager, Konten, Zahlung,
Retouren, Bewertungen, Millionen Artikel. Mit einem Lieferanten, 46 Artikeln
und ohne eigenes Lager trägt ein Teil davon, und ein Teil wäre Kulisse. Was
ohne Freigabe baubar ist — Filter, Sortierung, Vergleich, mehr Inhalt —, ist
aufgeschrieben und nicht angefangen: Der Katalog steht auf Preisen, die über
der eigenen Altersgrenze liegen, und ein Shop mit mehr Oberfläche auf
derselben Grundlage ist nicht mehr Shop, sondern mehr Oberfläche.

## Was offen ist — und bei wem

| | |
|---|---|
| Aktuelle Preisliste des Lieferanten | Auftraggeber |
| Vier Impressumsangaben (E-Mail, Telefon, UID, Gewerbewortlaut) | Auftraggeber |
| Netzausgang für bauversand.com und all-inkl.com freigeben | Auftraggeber |
| Zugangsdaten für das Webspace (in die Secrets, nicht in den Chat) | Auftraggeber |
| Eine Kopie der Preisdatei **außerhalb** dieses Containers | Auftraggeber |

Die letzte Zeile ist die, die diesen Lauf ausgelöst hat. Sie steht seit dem
8. September da. Beim dritten Mal wird sie wieder dastehen.

## Was die Pause an den Prüfungen sichtbar gemacht hat

Sechzehn Browsergegenproben waren über ihre Vierzehn-Tage-Frist gelaufen und
mussten nachgezogen werden. Von siebzehn Läufen schlugen fünf an und **zwölf
nicht** — und keine einzige davon, weil ein Prüfer kaputt war.

### Der Zustand, der einen Commit teuer gemacht hätte

Noch vor der ersten Messung stand im Verzeichnis etwas, das keine Prüfung
dieses Bestandes sieht: Die neunzig gebauten Seiten waren **im Index als
gelöscht vermerkt** und lagen gleichzeitig unverfolgt auf der Platte — `D `
und `??` für dieselbe Datei. So sieht es aus, wenn ein `git add -A` den
Augenblick erwischt, in dem `bin/website.mjs` das Ausgabeverzeichnis geleert
und noch nicht neu beschrieben hat.

> **Ein Commit in diesem Zustand hätte die ganze Website gelöscht**, und
> gemeldet hätte es niemand: Der Mutationsschutz fragt die Prozessliste nach
> laufenden Mutationen, nicht den Index nach leeren Verzeichnissen.

Verloren war nichts, weil der Bau danach wieder durchlief. Gefunden wurde es
beim Lesen des `git status`, nicht von einem Prüfer — und das ist der Befund.

### Sechs Proben, die den Kalender gemessen haben

Alle sechs Gegenproben an `bestellprobe` meldeten denselben Satz: *„der Auszug
zählt nicht genau zwei Umsatzbelege"*. Der Grund steht in zwei Zeilen, die
sechs Wochen lang zusammengepasst haben:

| | |
|---|---|
| `bin/bestellprobe.mjs` ruft den Auszug | `--jahr 2026 --monat 9` |
| die Belege darüber bekamen | **kein `--datum`** |
| `bin/vorgang.mjs:99` nimmt ohne Angabe | `geschaeftstag()`, also heute |

Im September fiel das nicht auf. Nach der Pause lagen Auftragsbestätigung,
Lieferantenbestellung, Rechnung und Gutschrift im Oktober, und im September
stand kein Umsatzbeleg mehr. Die Probe hat das korrekt gemeldet — und wäre
dafür beinahe für kaputt erklärt worden.

> **Sie hat nicht den Weg gemessen, sondern die Übereinstimmung zweier
> Zahlen, von denen eine mitwandert.**

Alle fünf Belege tragen jetzt ein ausdrückliches Ausstellungsdatum, der Reihe
nach: Bestätigung 07., Lieferantenbestellung 08., Rechnung 10. (nach der
Lieferung am 09.), Absage 13., Gutschrift 14. September. Aus demselben Grund,
aus dem Lieferdatum und Zahlungseingang in dieser Probe seit dem 11. September
Argumente sind: Was eine Probe behauptet, muss sie setzen.

**Der Eingriff hat sofort etwas umgeworfen, und zwar das Richtige.** Eine der
sechs Gegenproben sucht wörtlich die Zeile, in die das Datum hineinkam;
`test/gegenprobenregister.test.js:76` meldete in derselben Minute *„der
Suchtext kommt in shop/bin/bestellprobe.mjs nicht vor — die Mutation käme nie
an"*. Ein Register, dessen Suchtexte gegen die Wirklichkeit gehalten werden,
verzeiht einen Eingriff nicht still.

### Und dieselbe Sorte Fehler in einer Probe, die sich dagegen gewappnet glaubte

`test/startklar.test.js` prüft, dass die Außenlage aus einer Datei kommt und
nicht aus dem echten Verzeichnis. Dafür schreibt sie eine eigene Datei mit
`gemessenAm: '2026-09-09'` — und setzte daneben `GESCHAEFTSTAG: '2026-09-09'`
in die Umgebung, damit das Alter gegen diesen Tag gerechnet wird.

**Diese Umgebungsvariable liest nirgends im Bestand jemand.** Gemessen mit
einer Suche über alle Dateien: ein einziges Vorkommen, nämlich die Zeile, die
sie setzt. Das Alter wurde also gegen den echten Tag gerechnet, und
`src/aussenlage.js:47` lässt eine Außenlage nach vierzehn Tagen verfallen. Nach
fünf Wochen war der Vermerk 36 Tage alt, der Punkt fiel auf die Angabe des
Betreibers zurück und sagte „bestätigt" statt „gemessen am".

> **Ein Platzhalter, den niemand liest, sieht aus wie eine Vorkehrung.**

Der Kommentar über der Stelle nennt die Gefahr sogar — nur die falsche: Er nahm
der Probe den Blick auf das echte Verzeichnis und ließ ihr den Blick auf die
Uhr. Das Datum wird jetzt aus dem Geschäftstag gerechnet; eine Messung von
heute ist an keinem Tag zu alt.

### Und sechs Reds, die keine waren — der Befund geht gegen mich

In einer früheren Fassung dieses Abschnitts stand, `kasse-ohne-mindestbestellwert`
habe aufgehört zu prüfen: Die Mutation sitze in `shop/src/shopkern.js` an der
Kasse, das erwartete Rot hänge am Hinweis im Warenkorb, beides sei
auseinandergelaufen. Der Satz stand mit Quellenangabe da und war falsch.

Einzeln gefahren schlägt sie an, in 19 Sekunden, *„meldete rot an der
erwarteten Stelle"*. Dasselbe gilt für `einzahl-im-korbkopf`,
`grenze-ohne-wort`, `stiller-wegfall-im-korb`,
`referenzwert-schon-bei-gleichstand` und `suchfeld-sprengt-den-rahmen` — alle
sechs einzeln gefahren, alle sechs grün. Von zwölf Reds waren **sechs echt** — die
`bestellprobe`-Familie mit dem Kalender — und **sechs kamen aus der Art, wie
ich gemessen habe**.

Zwei Fehler, beide meine:

**Der Lauf.** Mein Schleifenskript fuhr siebzehn Gegenproben hintereinander
und rief vor jeder `npm run website`. Der Läufer nimmt einen eigenen Abdruck
des Bestandes und weigert sich zu messen, wenn sich darunter etwas bewegt hat —
`bin/gegenprobenlauf.mjs` beschreibt diesen Fall seit dem 12. September an
seiner eigenen Buchführung. Bewiesen ist damit nicht, *welcher* Zweig gegriffen
hat; der Unterschied zwischen beiden Läufen ist aber genau einer, und er liegt
nicht in den Prüfern.

**Das Protokoll.** Damit die Ausgabe lesbar bleibt, hat mein Skript nur die
Zeilen mit ✓ und ✗ und die Schlusszeile behalten. Die Begründung *„war schon
vorher rot — an einem roten Prüfer lässt sich nichts zeigen"* beginnt ohne
Zeichen und ist dabei verschwunden.

> **Ein Protokoll, aus dem ich die Begründungen herausgefiltert habe, liest
> sich wie ein Befund über den Prüfer.**

Die Kette danach war billig und schnell: gefiltertes Protokoll, ein Blick ins
Register, eine Suche in `bin/wegprobe.mjs`, von vier Treffern einen gelesen,
verallgemeinert — und das Ergebnis in dieses Dokument und in den Commit-Text
geschrieben. Die Messung, die das widerlegt, hat neunzehn Sekunden gekostet.

**Was davon stehen bleibt:** die sechs Kalender-Reds samt Berichtigung, der
Fund an `test/startklar.test.js` und der Zustand im Index, der die Website
gelöscht hätte — der stand im `git status` und nicht in einem Filter.

### Der Korb ist kleiner geworden, ohne dass jemand ihn verkleinert hat

Der Commit kam dann an einem einzigen roten Prüfer nicht durch:
`pruefe-preisalter` meldete vier Kaminartikel mit 112 Tagen bei einer eigenen
Grenze von 90 — und bei allen vier mit dem Zusatz *„und auf diesen Preis ruht
ein Gebot"*. Das Werkzeug nennt die Auswege selbst: den Preis beim Lieferanten
nachziehen, oder den Artikel aus dem Referenzwarenkorb nehmen. *„Der falsche
wäre, die Grenze hochzusetzen."*

Der erste Ausweg gehört dem Auftraggeber. Gegangen ist deshalb der zweite,
mit Präzedenzfall aus demselben Register: Am 6. September sind aus dem
Dämmungskorb zwei Positionen aus genau diesem Grund herausgefallen, unter der
Regel *„zwei richtige Regeln, die sich treffen — und die vorsichtige gewinnt."*
Fertigfußpaket, Putztüranschluss, Regenhaube und Thermo-Trennstein sind
draußen, jede mit eigenem Vermerk; von sechs Positionen bleiben zwei.

> **Gefallen sind sie nicht durch eine Entscheidung, sondern durch die Pause.**
> Am 15. September waren sie 82 Tage alt und damit innerhalb der Grenze.

Dasselbe Muster wie bei der Messliste von 29 auf 14 Begriffe, nur an der
anderen Seite der Anzeige: Dort fällt das Wort weg, hier die Position, auf die
geboten wird. Beides kehrt zurück, sobald eine aktuelle Liste da ist — die
Artikel sind nicht falsch, sie sind alt. Geld bewegt sich dadurch nicht: Alle
Kampagnen stehen auf PAUSIERT.

### Und ein Suchtext, der zum dritten Mal ins Leere zeigt

`pruefe-koerbe` verlangte den Grund **je Position** und nicht gesammelt — vier
Einträge statt einem. Danach meldete `test/gegenprobenregister.test.js` den
nächsten Bruch: Die Gegenprobe `korb-ohne-die-halbe-bestellung` sucht wörtlich
eine Korbzeile, und ihre Zeile war gerade herausgefallen.

Das ist das dritte Mal an derselben Gegenprobe. Ursprünglich zeigte sie auf die
Dosierpistole; die fiel am 6. September am Preisalter aus dem Korb, woraufhin
sie auf den Thermo-Trennstein verlegt wurde — damals 73 Tage alt, „aus
demselben Grund drinbleiben durfte". Heute ist der mit 112 Tagen gefallen.

> **Eine Stelle, die eine andere Regel wegnehmen kann, ist keine Stelle für
> einen Suchtext.**

Zweimal auf den jüngeren Preis auszuweichen hat nur die Frist verlängert.
Mutiert wird jetzt eine Position aus dem **Kanalkorb**: Auf der Gruppe liegen
keine Anzeigen, `pruefe-preisalter` eskaliert ihre Preise deshalb nicht, und sie
bleibt im Korb, auch wenn sie altert — gemessen mit 128 Tagen und ohne Meldung.
Schaltet der Auftraggeber eines Tages Kanalanzeigen, fällt sie aus demselben
Grund heraus wie ihre zwei Vorgänger, und derselbe Test sagt es sofort.

## Die Frage für den nächsten Lauf

Der Auftraggeber hat auf „Freudenthaler Bau" als Antwort auf die vier
Impressumsangaben geschrieben. Das ist der Firmenname, der längst in der Datei
steht — nicht der Gewerbewortlaut, nicht die UID, nicht die Adresse, nicht die
Nummer. **Die Frage ist nicht, wie man ihn ein siebtes Mal fragt, sondern
warum sechs Fragen dieselbe Antwort bekommen haben.** Vielleicht ist die Liste
zu lang: vier Felder in einer Tabelle, mit Beispiel und Fundstelle, sind etwas
anderes als „vier Pflichtangaben fehlen".
