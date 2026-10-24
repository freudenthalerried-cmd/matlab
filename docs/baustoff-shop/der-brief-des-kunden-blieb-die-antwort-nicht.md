# Der Brief des Kunden blieb, die Antwort nicht

**12. September 2026. Runde 42.**

## Der Fund

Vier Briefe gehen an einen Kunden: Angebot, Auftragsbestätigung, Rechnung,
**Absage**. Seit dem 11. September legt jeder von ihnen seine Durchschrift in
die Akte — drei von ihnen.

Die Absage wurde gedruckt, versendet und war fort.

> **Der Brief des Kunden wird seit dem 4. September aufgezeichnet, die Antwort
> darauf nicht.**

Die Bestellung kommt über `bestellung.php` herein und bekommt ihre Zeile in
der Ablage. Das Nein darauf hinterließ nichts. § 132 Abs 1 BAO verlangt neben
Büchern und Belegen auch die **Geschäftspapiere**; § 212 UGB nennt
ausdrücklich die *Wiedergaben der abgesendeten Geschäftsbriefe*.

Und der praktische Fall dahinter ist derselbe wie bei jedem Beleg: Sagt ein
Kunde in einem halben Jahr, er habe nie erfahren, warum seine Bestellung nicht
angenommen wurde, ist die Abschrift das Einzige, was dagegen steht.

## Was geändert wurde

`npm run vorgang -- --stufe absage --ablegen` legt jetzt ab, was die anderen
drei Stufen ablegen:

| | |
| --- | --- |
| Durchschrift | `ablage/belege-2026/AS-2026-0150.txt` |
| Journalzeile | `art: 'absage'`, ohne Nummer, ohne Betrag |
| Betreff | *Absage zu Vorgang 2026-0150, 3 Grund/Gründe* |

**Ohne Nummernkreis**, aus demselben Grund wie bei der Auftragsbestätigung:
Eine fortlaufende Nummer verlangt § 11 UStG für die **Rechnung**. Wer für die
Absage einen sechsten Kreis eröffnet, handelt sich dessen Lückenerklärung ein,
ohne dass irgendeine Vorschrift sie verlangt. Rückführbar bleibt sie über den
Vorgang (§ 131 Abs 1 Z 5 BAO) — und so heißt auch ihre Durchschrift.

**Ohne Betrag**, und das ist keine Lücke: Die Absage nennt keinen. *Was
abgesagt wird, steht in der Anfrage des Kunden* — der Satz stand schon vorher
unter dem Brief.

**Im Journal steht die Zahl der Gründe, nicht die Gründe.** Sie stehen im
Brief; im Journal stünden sie sieben Jahre, und die Absagegründe sind die
heikelste Auskunft dieses Betriebs über einen Kunden.

Die Sperren gelten unverändert: keine Ablage mit sichtbarer Lückenmarke, keine
Ablage in der echten Akte mit ausgetauschten Grundlagen, kein Internum im
Text. Alle drei stehen an **einer** Stelle und wirken damit auch für die
vierte Stufe — das ist der Ertrag der Runde davor.

## Nebenbei: der Prüfer, der sofort meldete

Die Karte des Betriebs führt die Absage als Abzweig mit ihrem Werkzeug. Weil
die Zeile jetzt `--ablegen` nennt, wurde eine **Gegenprobe stumpf**, die genau
diese Zeile wörtlich zitiert (`stufe-ohne-platz`).

Gemeldet hat es im selben Lauf der Prüfer, den es seit dem 10. September gibt:
*ein Suchtext, der die gemeinte Stelle nicht mehr trifft*. Zwei Runden zuvor
war dieselbe Sorte Fehler zwölf Runden lang unbemerkt geblieben — weil damals
nur der volle Gesamtlauf sie gesehen hätte und der nicht lief. Diesmal stand
die Meldung nach 52 Sekunden da.

> **Ein Register, das seine eigenen Zitate prüft, macht aus einer stillen
> Alterung eine laute.**

## Ausgang

| | |
| --- | --- |
| Belege mit Durchschrift | 3 von 4 → **4 von 4** |
| `ARTEN` | um `absage` (`AS`) ergänzt, `nummernkreis: false` mit Grund |
| Fundstellen | § 212 UGB und § 132 Abs 1 BAO ins Register aufgenommen |
| Testfälle | 2.387 |
| Gegenproben | 211 → **212** |

---

**Die Regel dieser Runde:** *Wer aufhebt, was hereinkommt, und wegwirft, was
hinausgeht, führt kein Archiv, sondern einen Posteingang.*
