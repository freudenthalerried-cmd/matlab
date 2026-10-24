# Was eine Maschine heute findet

*22. Oktober 2026, auf Weisung des Auftraggebers: „erstelle shop für ki
optimiert, sodaß wenn jemand etwas sucht oder sich informiert den preis oder
das angebot von meinem shop hat."*

---

## Gemessen, bevor etwas gebaut wurde

Beim Filter war die Hälfte längst gebaut, und zweimal habe ich an einem Tag aus
dem Gedächtnis geantwortet und falsch gelegen. Also zuerst nachsehen, was ein
Assistent heute vorfindet:

| | |
|---|---|
| Crawlerzugang (`robots.txt`) | **steht, und richtig zugeschnitten** |
| Auszeichnung je Artikel (`Product`/`Offer`) | Preis, netto, Mindestbestellwert, fünf Lieferbezirke, Verkäufer mit Firmenbuchnummer |
| `llms.txt` | 146 Zeilen, Sortiment mit Preis je Artikel, Liefergebiet, Rechtsstand |
| `sitemap.xml`, Produktfeed | gebaut |
| **Gültigkeit der Angebote** | **24 von 46 abgelaufen** |

Der Zugang ist dabei die bessere Hälfte der Antwort auf die Weisung: Die
**Such**-Roboter dürfen herein — `OAI-SearchBot`, `Claude-SearchBot`,
`PerplexityBot`, `Applebot`, `Google-Extended` —, die **Trainings**-Sammler
nicht (`GPTBot`, `ClaudeBot`, `CCBot`, `Applebot-Extended`). Wer live sucht,
bekommt die Seite; wer sie in ein Modell einbacken will, nicht. Genau das will
die Weisung.

## Die Zahl, die dazwischensteht

```
Angebotsgültigkeit am 2026-10-22 — 46 Artikelseiten
  mit ausgezeichnetem Preis    46
  davon abgelaufen             24
  läuft in 14 Tagen ab          8
```

> **Ein Angebot mit abgelaufener Gültigkeit ist für eine Maschine kein
> Angebot.** Ein Produktfeed verwirft es, ein Assistent nennt den Shop ohne
> Preis oder nennt ihn nicht.

`priceValidUntil` ist der Preisstand plus die eigene Neunzig-Tage-Grenze. Die
Regel ist richtig und ehrlich: Nach neunzig Tagen gilt die Grundlage als
überholt. Nur heißt sie heute, dass bei **mehr als der Hälfte des Sortiments**
genau die Frage unbeantwortet bleibt, um die es dem Auftraggeber geht.

**Die Zahl war bekannt.** Sie stand als Kommentar in `src/maschinenlesbar.js`,
mit ihrem Messtag und dem Satz *„weil sie mit jedem Tag wächst"*: sieben am
6. September, elf am 10. Gewachsen ist sie auf 24, und gemeldet hat es niemand.

> **Eine Zahl, die mit jedem Tag wächst und in einem Kommentar steht, wächst
> unbeobachtet.**

## Gebaut wurde ein Prüfer, der nicht an der Zeit rot wird

`npm run pruefe-angebote` misst an den **gebauten** Seiten — was ein Crawler
liest, ist das Erzeugnis. Und er prüft **nicht** die Zahl: Sie wächst, wenn
niemand etwas tut, und ein Prüfer, der an der Zeit rot wird, blockiert jeden
Commit ohne Zutun. Genau diesen Fehler hat dieser Bestand am 15. Oktober
sechsmal gefunden.

Geprüft wird der **Widerspruch**. Jede Artikelseite sagt zweierlei über
dieselbe Sache: dem Menschen im Klartext, der Maschine als Datum.

> **Wer die Auszeichnung verlängert, ohne den Satz zu ändern, belügt die
> Maschine; wer den Satz entfernt, ohne die Auszeichnung zu ändern, belügt den
> Menschen.**

Vier Regeln, jede mit einem Testfall, der sie feuern lässt: ein Preis ohne
Gültigkeit, eine abgelaufene Auszeichnung ohne Satz, ein Satz ohne abgelaufene
Auszeichnung, und zwei verschiedene Grenzen im Haus. Am 10. September war das
einmal von Hand nachgezählt — elf und elf. Von Hand nachgezählt heißt: beim
nächsten Mal nicht.

Die Zahl selbst steht jetzt in `npm run offenepunkte`, wo sie einen Adressaten
hat, und wird dort **gemessen**: Wächst sie, meldet `pruefe-punkte`, dass der
Titel nicht mehr stimmt.

## Drei eigene Fehler, jeden fand ein anderer Prüfer

**Die Prosa-Regex-Falle, zum zweiten Mal von derselben Hand.** Mein erstes
Muster suchte den Klartextsatz wörtlich und zählte **null** Treffer bei 24
abgelaufenen Angeboten. Im HTML steht
`<strong>Diese Grundlage ist 119 Tage alt</strong> und damit älter …` — ein
`</strong>` mitten im Satz.

> **Ein Muster über Prosa bricht an dem Tag, an dem jemand ein Wort fett
> setzt.**

Am 14. Oktober hatte ich genau diese Falle schon einmal gebaut, damals mit
einer Verneinung, die als Zustimmung gelesen wurde. Die Lehre ist dieselbe und
wird hier zum zweiten Mal gezogen: Die Seite trägt einen **ausdrücklichen
Marker** (`class="preis-ueberholt" data-alter data-grenze`), und der Prüfer
zeigt darauf. Beim Einsetzen des Markers habe ich den Satz dann im Quelltext
umbrochen — `test/preisstand-auf-der-seite.test.js` hat es sofort gemeldet.

**Die falsche Frage an den Frischewächter.** Der erste Anlauf fragte
`frischebefund(SHOP, 'bin/angebotspruefung.mjs')`. Die Liste nennt aber,
welches Werkzeug welches Erzeugnis **baut**, und dieses hier baut keines, es
liest eines. Der Lauf brach mit „Unbekanntes Erzeugnis" ab, und das war
richtig so.

**Eine Mutation, die nichts mutierte.** Die Gegenprobe zur überdehnten Frist
zeigte zuerst auf die **Bedingung** des Zweigs statt auf den **Wert**: Mutiert
war damit nur, *ob* ein Gültigkeitsdatum gesetzt wird, und nicht welches. Der
Läufer meldete „meldete trotz Mutation grün".

> **Eine Mutation, die den Prüfwert nicht berührt, prüft den Prüfer nicht.**

Dazu vier Register, die ihren Platz verlangten: eine Zuständigkeit, die es
nicht gibt (`auftraggeber` statt `anfrage` — die Liste liegt beim Lieferanten,
sie muss dort **erfragt** werden, und das ist freigabepflichtig), ein
exportierter Name zum zweiten Mal (`seitenbefund` steht in
`src/seitenaehnlichkeit.js`), vier Regeln, die kein Testfall feuern sah, und
drei Testattrappen, die den neuen Punkt nicht kannten.

## Und eine Gegenprobe, die ich zum zweiten Mal nachgezogen hätte

Mit der neuen Weisung in der Tafel wanderte der Kopf von `PARAMETER.md` auf
den 22. Oktober — und damit zeigte der Suchtext der Gegenprobe
`der-kopf-der-weisungstafel-haengt-hinterher` ins Leere. **Zum zweiten Mal in
acht Tagen.** Am 15. Oktober hatte ich das Datum nachgezogen und dazu
geschrieben, eine Gegenprobe über ein Datum altere mit dem Datum.

> **Eine Gegenprobe, die man regelmäßig nachzieht, prüft den Bestand nicht
> mehr, sondern den eigenen Fleiß.**

Gemessen wird dieselbe Zusicherung jetzt von der Gegenseite: Nicht der Kopf
wird älter gemacht, sondern die Tafel jünger. Die Mutation setzt eine Zeile mit
einem späten Datum **vor die älteste** — die Zeile vom 22. August, die als
erste der Tafel nicht mehr wandert. Danach hinkt der Kopf nach, gleich welches
Datum er trägt, und die Erwartung nennt nur das Datum der Mutation. Kommt eine
Weisung 16 dazu, bleibt beides wahr.

## Und die Zahl, nach der ein Mensch wirklich fragt

Was ein Mensch einen Assistenten fragt, ist nicht „was kostet POS-10837",
sondern **„was kostet ein Kaminzug"**. Dafür hat dieser Shop vier
Systemlisten, und in `llms.txt` standen sie mit ihrer Frage und ohne eine Zahl.
Ein Assistent müsste die Seite laden, zehn Positionen einzeln nachsehen, Mengen
aus „Gesamthöhe ÷ Steinhöhe" herleiten und selbst rechnen — das tut keiner in
einer Antwort.

> **Eine Liste, die ihre Frage nennt und ihre Summe nicht, beantwortet die
> Frage nicht.**

### Woher die Mengen kommen — und woher nicht

Nicht aus einer Annahme über das Bauwerk. Die Systemliste sagt selbst, dass
Mantelsteine aus der Gesamthöhe folgen und die Steinhöhe in den
Systemunterlagen des Herstellers steht; technische Kennwerte schreibt dieser
Shop nicht ab. Eine Rechnung mit geratener Steinhöhe wäre genau das, wovor die
Seite warnt: *„eine geratene Kaminstückliste ist die teuerste Art, Material zu
bestellen."*

Sondern aus den **Referenzwarenkörben**, die seit dem 28. August geführt
werden: Mengen, ein Umfang, zu jeder ausgelassenen Position ein Grund, und
`npm run pruefe-koerbe` hält sie gegen die Systemlisten.

> **Die Zahl, die ein Assistent braucht, lag seit Wochen gerechnet in einer
> Datei, die nie online geht.**

### Die Zeile, die diese Rechnung ehrlich macht

Gemessen mit `pruefe-koerbe`: **Kein einziger Korb deckt die geführten
Positionen seiner Systemliste.**

| Gruppe | Positionen | geführt | im Korb |
|---|---|---|---|
| WDVS | 10 | 9 | **5** |
| Kamin | 10 | 9 | **2** |
| Kanal | 8 | 5 | **4** |
| Dämmung | 7 | 4 | **1** |

> **„Ein Kaminzug: 1.236,71 €" bei zwei von zehn Positionen ist der Preis für
> einen halben Kamin.**

Der Umfang nennt deshalb die enthaltenen Positionen und nicht das Vorhaben
allein — „Ein Kaminzug: Mantelsteine, gedämmtes Rohr" —, und eine Regel in
`rechnungsbefund` verlangt das: Lässt ein Korb Positionen aus und nennt der
Umfang eine der enthaltenen nicht, ist das ein Befund.

Auf der Seite und in `llms.txt` stehen jetzt: Umfang, Positionstabelle mit
Menge, Einzelpreis und Betrag, Warenwert, Zustellung, Summe, Preisgrundlage mit
Stand — und zu jeder ausgelassenen Position ein Satz, der sagt, warum sie
fehlt. In den strukturierten Daten trägt jede enthaltene Position ihr Produkt
mit Preis; ein `Offer` über die Zusammenstellung wäre ein **Kaufangebot über
etwas, das dieser Shop so nicht verkauft**.

> **Die Einzelangebote sind echt, die Summe ist eine Auskunft.**

### Sechs eigene Fehler in diesem Bau

**Der interne Grund auf der Kundenseite.** Der erste Anlauf reichte das Feld
`warum` der ausgelassenen Positionen durch — geschrieben für `pruefe-koerbe`.
Sechs dieser Gründe nennen den **Einkaufspreis**, und `findeInterna` brach den
Bau ab.

> **Ein Grund, der für einen internen Prüfer geschrieben ist, gehört nicht auf
> eine Kundenseite.** Dieselbe Lehre wie am 13. September bei den acht
> Bestellfeldgründen: zwei Texte je Eintrag, nicht einer.

Alle fünfzehn Auslassungen tragen jetzt ein Feld `kunde`, und eine Regel
verlangt es.

**Ein toter Verweis — und zwanzig Minuten an der falschen Stelle gesucht.**
Ich hatte `<a href="#">Positionsliste</a>` geschrieben. Der Verweisprüfer des
Baus hat die Seite daraufhin **nicht ausgeliefert**, und weil ich `npm run
website` mit `>/dev/null 2>&1` aufrief, habe ich die Weigerung nicht gelesen.
Zwanzig Minuten lang habe ich eine Ursache im Seitenbau gesucht, die es nicht
gab: Alle Messungen liefen gegen eine Fassung von 10:56.

> **Ein Bau, dessen Ausgabe man nach /dev/null schickt, meldet seinen Abbruch
> an niemanden.**

**Eine Regel über den Quelltext, die den Bau übersieht.** Der Kundensatz zum
Perimeterkleber schickt den Leser ins Merkblatt, und `pruefe-merkblatt`
verlangt dann den Weg dorthin. Die Prüfung im Seitenbau las nur `inhalte/` —
*eine Regel über den Quelltext einer Seite übersieht, was der Bau
dazuschreibt.* Jetzt liest sie beides.

**Zwei Anläufe für eine Herkunft.** `pruefe-seiten` verlangt zu jeder Zahl mit
Einheit eine Quelle. „Preisstand 2026-08-12" genügte nicht, „Preisstand:
2026-08-12" auch nicht — das Muster sucht das Wort *Stand* mit großem S, und in
„Preisstand" steht es klein. Jetzt steht dort „Preisgrundlage, Stand: …", und
die Summe trägt damit den Zeitpunkt, den jede Artikelseite nennt.

**Ein Trennzeichen in einer maschinenlesbaren Datei.** Der Seitenformatierer
schreibt über tausend ein schmales Leerzeichen: „1 236,71 €". Ein Parser liest
daraus zwei Zahlen. `src/format.js` sagt es selbst — nie ein Tausenderpunkt.

**Und ein Muster, das ein Feld nicht sieht.** Beim Einordnen von
`MARGENWOERTER` wollte ich die Liste streichen und das etablierte Register
`eigene-marge` nutzen. Gemessen: `findeInterna` über eine Rechnung mit dem Feld
`"deckungsbeitrag": 245.53` meldet **nichts** — jenes Muster liest
`Deckungsbeitrag` mit großem Anfangsbuchstaben, weil es für Fließtext
geschrieben ist, und ein Feldname ist klein.

> **Dieselbe Lücke wie bei `"lieferantId":"poschacher"` am 15. September:
> kleingeschrieben und vom Muster nie gesehen.**

Die beiden Listen überschneiden sich im Wortlaut und nicht im Gegenstand — eine
prüft Text, die andere eine Datenstruktur, bevor sie auf eine Seite kommt.

Dazu kam, beim Lesen des Schnelllaufs: `pruefe-entitaet` gab seine
Frischeweigerung als JavaScript-Array aus, mit Klammern und Hochkommas. Sichtbar
war davon genau ein Zeichen: `[`.


## Was noch zwischen hier und „konvergiert" steht

Zwei Sperren, und beide gehören dem Auftraggeber. Beide heute neu gemessen,
nicht aus dem Gedächtnis:

**Der Netzausgang.** `curl` auf `bauversand.com`, `www.bauversand.com`,
`all-inkl.com` und `kasserver.com` antwortet viermal
`CONNECT tunnel failed, response 403`. Das ist nicht der Webspace — der ist
offen, wie der Auftraggeber sagt. Gesperrt ist der Weg **aus diesem Container
hinaus**, und das ist eine Einstellung der Umgebung.

**Die Zugangsdaten.** In der Umgebung liegt kein FTP-, SSH- oder
Webspace-Schlüssel. Auch bei offenem Ausgang lädt hier niemand etwas hoch.

Und die dritte, die keine Sperre ist, sondern die Konversionswand selbst:
**`availability: PreOrder` auf allen 46 Artikeln.** Das ist ehrlich — bestellen
ist nicht möglich —, aber ein Assistent, der zwischen zwei Shops wählt, nennt
den, bei dem man kaufen kann. Was dafür fehlt, steht in `npm run startklar`
und ist seit dem 28. August dieselbe kurze Liste: vier Impressumsangaben,
Kontoinhaber und IBAN, eine zugesagte Antwortzeit, der Rechtstextewortlaut.

> **Die KI-Auffindbarkeit ist weit gebaut; die Konversion hängt an vier
> Feldern und einem Konto.**
