# Vierzehneinhalb Stunden im Monat

**2. September 2026.** Die Besucherstrecke ist gemessen: fünf Schritte vom
Anzeigenklick bis zum fertigen Anfragetext. Die Frage danach war die
Gegenrichtung: *Was kostet der Weg, den der Betreiber geht?*

Die Zahlen dafür gab es seit Wochen — elf Schritte in `auftragslauf.js`, jeder
mit einer Minutenangabe für den Fall, dass die Fähigkeit dahinter fehlt.
**Gegen die Zielgröße gehalten hat sie niemand.** `aufwandProMonat()` stand in
der Liste der dreißig Funktionen, die außerhalb der Tests kein Aufrufer kennt.

## Bei 67 Bestellungen im Monat

| Lage | je Bestellung | im Monat | |
| --- | ---: | ---: | --- |
| heute | 16 min | 17,9 h | **blockiert** — Zahlung und Rechnung sind gesperrt, es läuft gar nichts |
| **nach den Freigaben** | **13 min** | **14,5 h** | läuft |
| voll ausgebaut | 0 min | 0 h | läuft von allein |

Die mittlere Zeile ist der erste Betriebstag: Zahlungsanbieter gewählt,
Firmendaten eingetragen, echte Konditionen bestätigt — und sonst nichts
angebunden.

**14,5 Stunden im Monat.** Rund drei Stunden je Woche, vierzig Minuten je
Werktag. Das geht neben einer Bau GmbH.

## Die Zahl, die den Plan beschreibt

> **Ab 92 Bestellungen im Monat geht es nicht mehr nebenbei. Das ist das
> 1,4-fache der Zielgröße.**

Die Grenze ist mit **20 Stunden im Monat** gesetzt — ein halber Arbeitstag je
Woche. Sie ist nicht gemessen, und sie steht ausdrücklich als Zahl da, damit
ihr widersprochen werden kann: **Eine Grenze, die niemand aufschreibt, wird im
Betrieb stillschweigend überschritten.**

Der Abstand ist der eigentliche Befund. Der Plan zielt auf 67 Bestellungen; bei
92 kippt er. Wer das Modell für zu klein hält und die Zielgröße erhöht, erhöht
nicht den Gewinn, sondern die Handarbeit — und stößt vorher an diese Grenze als
an eine wirtschaftliche.

## Gate 6 in Stunden

| fehlende Fähigkeit | min/Bestellung | h/Monat | sperrt |
| --- | ---: | ---: | --- |
| **produktdatenSchnittstelle** | **9** | **10,1** | — |
| echteKonditionen | 7 | 7,8 | Rechnung |
| uidAbfrage | 2 | 2,2 | — |
| buchhaltungsanbindung | 2 | 2,2 | — |
| zahlungsanbieter | 0 | 0 | Zahlung |
| betreiberdaten | 0 | 0 | Rechnung |

Zehn der vierzehneinhalb Stunden gehen für **eine** fehlende Anbindung drauf.
Gate 6 sagt seit dem 16. August: *„Ohne strukturierte Produktdaten mindestens
eines Kernlieferanten fällt das Shopmodell."* Das ist dieselbe Aussage in
Stunden statt in Worten — und sie ist milder, als das Gate klingt: Das Modell
fällt nicht, es kostet zehn Stunden im Monat.

Bemerkenswert ist die andere Spalte. **Zahlungsanbieter und Betreiberdaten
kosten null Minuten und sperren trotzdem.** Sie sind keine Arbeit, sie sind
eine Bedingung. Genau deshalb stehen sie ganz oben in `npm run offenepunkte`,
und genau deshalb ist „heute" die einzige Zeile mit einem Kreuz.

## Was die Rechnung nicht kann

Sie sagt es selbst am Ende jedes Laufs, und die drei Vorbehalte sind nicht
kosmetisch:

- **Die Minutenangaben sind gesetzt, nicht gestoppt.** Sie stehen einzeln in
  `auftragslauf.js` und lassen sich am ersten Betriebstag durch gemessene
  ersetzen. Bis dahin ist die 14,5 so belastbar wie die Schätzungen darin.
- **Sie rechnet den Regelfall.** Elf Schritte sind der glatte Weg. Eine
  Rückfrage, eine Retoure, ein falsch geliefertes Gebinde kommen obendrauf —
  und im Baustoffhandel ist das kein Ausnahmefall.
- **Sie sagt nichts über die Zeit vor der ersten Bestellung.** Katalogpflege,
  Inhalte, Anzeigen: Die trägt heute dieses Verzeichnis, und sie hört am ersten
  Betriebstag nicht auf.

Der zweite Punkt ist der schwerste. Eine Retourenquote von zehn Prozent mit
je einer halben Stunde wären 3,4 Stunden im Monat — ein Viertel mehr, und der
Abstand zur Grenze schrumpft von 1,4× auf 1,25×.

## Was jetzt festgehalten ist

Acht Proben, und zwei davon halten Aussagen fest, die leicht verschwinden:

- **„Nach den Freigaben ist nichts gesperrt und es bleibt unter der Grenze."**
  Reißt sie, läuft der Betrieb am ersten Tag nicht mehr nebenbei.
- **„Die Produktdatenschnittstelle ist der größte Einzelposten."** Verschiebt
  sich das, hat sich der Bruchpunkt des Modells verschoben — und das gehört
  gesehen, nicht überlesen.

Die Gegenprobe im Register hebt eine Minutenangabe von 2 auf 20; der Lauf
meldet „geht nicht nebenbei". **Dreizehn von dreizehn Gegenproben schlagen an.**

## Die Frage für den nächsten Lauf

Beide Richtungen sind jetzt gemessen — der Besucher braucht fünf Schritte, der
Betreiber dreizehn Minuten. Was zwischen ihnen liegt, ist ungezählt:

> **Wie lange wartet der Kunde auf eine Antwort?**

Der Anfragetext landet in einem Postfach. Von dort bis zum Angebot vergeht
Zeit, die in keiner der beiden Rechnungen vorkommt — sie steht in keinem
Schritt von `auftragslauf.js`, weil sie zwischen den Schritten liegt. Im
Baustoffhandel entscheidet sie über den Auftrag: Wer am Nachmittag anfragt und
am übernächsten Tag ein Angebot bekommt, hat längst woanders gekauft.
