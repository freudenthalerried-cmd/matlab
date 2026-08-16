# Das Gedächtnis der Ablage — ein Journal, das nur wächst

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.
Baustein „Gedächtnis der Ablage" aus [`umsetzung-shop.md`](./umsetzung-shop.md).

Der Befund stand seit Wochen im Baustand: `ablage.js` führt Nummernkreis und
Journal sauber — im Arbeitsspeicher. Nach einem Neuladen beginnt die
Rechnungsnummer wieder bei eins, und § 11 UStG verlangt Einmaligkeit. **Solange
das so ist, darf der Shop keine echte Rechnung ausstellen.** Diese Runde baut
das Gedächtnis. Die geforderte Entscheidung über den Speicherort ist gefallen
und begründet.

## Die Entscheidung: eine Datei, an die nur angehängt wird

`speicher.js` schreibt jedes Ereignis der Ablage als **eine JSON-Zeile**
(JSONL) in eine Senke; `ausJournal` liest die Zeilen zurück und baut daraus
die Ablage wieder auf. Der Betrieb hängt an eine Datei je Geschäftsjahr an
(`journal-2026.jsonl`), aufzubewahren nach § 132 BAO wie alles andere.

Warum diese Form und keine andere:

* **Eine Anhangdatei kennt kein Ändern und kein Löschen.** § 131 BAO verlangt
  vom Inhalt, dass das Ursprüngliche feststellbar bleibt — die Form erzwingt
  jetzt dasselbe. Eine Datenbank mit UPDATE wäre eine dauernde Einladung, es
  doch zu tun.
* **Die Senke wird nicht im Modul gewählt.** `journalzeile` erzeugt Zeilen,
  der Aufrufer entscheidet, wo sie landen — Datei, Browser-Speicher oder
  Testfall. Kein Dateisystemzugriff im Modul; die Regeln bleiben ohne
  Attrappen prüfbar.
* **Das Funktionsmuster speichert bewusst nicht.** Die Demo baut bei jeder
  Eingabe den ganzen Ablauf neu; ein dauerhaftes Journal würde dort bei jedem
  Tastendruck erfundene Geschäftsfälle sammeln. Ein Gedächtnis, das
  Erfundenes behält, ist schlimmer als keines.

## Der Fund: das Journal der Einträge allein wäre kein Gedächtnis

Der naheliegende Entwurf — „jeden Eintrag als Zeile ablegen, den Zähler beim
Laden aus den Eintragsnummern ableiten" — hat ein Loch, und es sitzt genau an
der Stelle, die § 11 schützt: **Eine gezogene, aber nie festgehaltene Nummer
steht in keinem Eintrag.** Zieht der Ablauf eine Rechnungsnummer und stürzt
vor dem Festhalten ab, hätte der Wiederaufbau einen zu niedrigen Zähler — und
die nächste Rechnung trüge **dieselbe Nummer wie ein Papier, das es womöglich
schon gibt**. Die Einmaligkeit wäre genau dann verletzt, wenn es darauf
ankommt: nach einem Absturz.

Deshalb wird **auch die Nummernvergabe selbst eine Journalzeile**, und die
Reihenfolge ist Teil der Zusage: erst das Journal, dann der Speicher.
`naechsteNummer` und `haltefest` rufen die Senke auf, **bevor** sie den eigenen
Zustand ändern. Wirft die Senke — Platte voll —, bleibt der Arbeitsspeicher
unverändert, und eine Nummer, die das Journal nie gesehen hat, gilt als nie
vergeben. Ein Testfall hält beides fest.

Die Lücke verschwindet dabei nicht — sie wird dauerhaft: Eine Vergabezeile
ohne Eintragszeile bleibt nach jedem Neuladen als fehlende Nummer sichtbar,
und `pruefeNummernkreis` meldet sie als erklärungsbedürftig. Das ist die
richtige Behandlung; eine Lücke, die beim Laden verschwindet, wäre eine
vertuschte.

## Das Laden ist streng, nicht nachsichtig

`ausJournal` bricht mit Zeilennummer ab statt zu reparieren: unlesbares JSON,
ein unbekannter Zeilentyp, eine unbekannte Vorgangsart, eine gerissene
Zeitfolge (`lfd` 2 ohne `lfd` 1) — und vor allem: **ein Feld, das
`FELDER_DER_ABLAGE` nicht kennt, oder ein fehlendes Verzeichnisfeld.** Damit
ist der Satz der Vorrunde eingelöst, früher als gedacht: Ab dem ersten
persistierten Eintrag ist jede Feldänderung eine Migrationsfrage — und das
Laden ist die Stelle, die sie stellt, statt sie zu überspielen. Das in der
Vorrunde entfernte Feld `storniert` dient dabei als Prüffall: Ein Journal, das
es noch trägt, wird mit genau dieser Meldung abgewiesen.

Ein Journal, das nicht sauber zurückliest, darf nicht stillschweigend zu einer
arbeitenden Ablage werden — mit ihm arbeiten hieße, auf einem Belegbestand zu
buchen, dessen Zustand niemand kennt.

## Ein neuer Ausgang im Fremdtext-Verzeichnis — mit umgekehrter Regel

Die JSONL-Zeile ist ein Ausgang, an dem fremder Text den Shop verlässt, also
gehört sie ins Verzeichnis (`fremdtext.test.js`, Ausgang 5a). Aber die Regel
ist hier die **umgekehrte**: Alle anderen Ausgänge entschärfen (`textZeile`,
`csvFeld`); das Journal muss **bewahren**, § 131 BAO. Beides zugleich leistet
JSON: Ein Umbruch im Betreff wird `\n` in der Zeile und beim Zurücklesen
wieder ein Umbruch — die Zeile bricht nie, der Inhalt bleibt zeichengenau.

Eine Falle blieb: `JSON.stringify` lässt `U+2028`/`U+2029` **roh** stehen —
in JSON erlaubt, aber genug Anzeigeprogramme brechen an ihnen um. Die Zeichen
aus der Steuerzeichen-Liste des Fremdtext-Verzeichnisses werden deshalb
zusätzlich als `\uXXXX` maskiert; `JSON.parse` stellt sie originalgetreu her.
Der Gifttest besteht darauf, dass die geschriebene Zeile selbst kein einziges
Steuerzeichen trägt.

## Geprüft

| | |
|---|---|
| neue Testfälle | 14 (13 `speicher.test.js`, 1 Fremdtext-Ausgang 5a) |
| Testfälle gesamt | 364, alle grün, 0 mit Verdacht |

Gegenproben an der Prüfung, alle sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| Maskierung der Unicode-Zeilentrenner entfernt | 2 Testfälle fallen |
| Nummernvergabe schreibt nicht mehr ins Journal | 3 Testfälle fallen |
| Laden prüft die Felder nicht mehr gegen das Verzeichnis | 2 Testfälle fallen |

Am gebauten Bündel nachgesehen: `speicher.js` ist im Bündel, der
Kollisionswächter schweigt, die Seite rendert unverändert.

Zwei Nebenfunde am eigenen Werkzeug: Der Testfall-Prüfer zählt mit einem
naiven Klammerzähler — eine unpaarige `{` in einer Zeichenkette
(`'{kaputt'`) ließ einen Testfall aus seiner Zählung fallen. Der Fall ist mit
ausgeglichener Klammer geschrieben und der Grund steht als Kommentar dabei;
die Differenz zwischen 364 gelaufenen und gezählten Fällen hätte sonst
niemand bemerkt. Und: Der erste Wurf dieses Protokollautors prüfte den
Nummernkreis **nach** der Beweis-Ziehung statt vor ihr — die Ziehung, die die
Einmaligkeit beweisen sollte, erzeugte selbst die zweite offene Nummer. Wer
mit einer Handlung prüft, muss den Zustand vorher festhalten.

## Kein Gate — aber eine Sperre weniger

Kein neues Gate, keine geänderte Kennzahl. Die Referenzzahlen bleiben
3.900,20 € brutto und 34,2 % Mischmarge (als optimistisch markiert); alle
Preise sind Platzhalter.

Der Satz „solange die Ablage im Arbeitsspeicher lebt, darf der Shop keine
echte Rechnung ausstellen" ist damit abgearbeitet — die verbleibende
Voraussetzung für echte Rechnungen ist nicht mehr technisch, sondern die
bekannte Liste: Firmendaten, UID des Betreibers, echte Konditionen. Offen im
Backlog bleiben die Gebietsabfrage (Umgebung blockiert die amtlichen Quellen)
und die CSV nach RFC 4180 (hängt an der Herstellerantwort).
