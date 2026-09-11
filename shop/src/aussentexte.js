/**
 * Das Verzeichnis der Ausgänge — wo Text diesen Shop verlässt.
 *
 * **Warum es diese Datei gibt.** `test/fremdtext.test.js` nennt sich selbst
 * ein Verzeichnis und sagt: *„Was hier nicht steht, ist ungeprüft."* Am
 * 2. September stimmte der Satz, aber die Liste nicht: Angebot und Rechnung
 * standen darin, die **Auftragsbestätigung** nicht — das Dokument, mit dem
 * nach Punkt 2 der AGB der Vertrag zustande kommt. Der Anfragetext und seine
 * mailto-Adresse fehlten ganz, obwohl der Kunde sie selbst verschickt.
 *
 * > **Eine Regel gilt nur dort, wo jemand sie hingeschrieben hat.** Angebot
 * > und Rechnung waren geprüft, weil sie an dem Tag im Blick waren; die
 * > Bestätigung dazwischen nicht, weil sie es nicht war.
 *
 * Ein Verzeichnis, das von Hand geführt wird, hat genau dieses Leck: Es wächst
 * mit der Aufmerksamkeit und nicht mit dem Bestand. Deshalb steht hier nicht
 * nur die Liste, sondern auch das **Muster**, an dem sich ein Ausgang erkennen
 * lässt — und eine Probe hält beides gegeneinander. Wer eine neue
 * textbauende Funktion schreibt, muss sie eintragen oder begründen, warum
 * nicht.
 *
 * Der Geltungsbereich einer Regel gehört gerechnet, nicht erinnert.
 */

/**
 * Woran ein Ausgang zu erkennen ist.
 *
 * Absichtlich am **Namen** und nicht am Rückgabewert: Eine Funktion, die Text
 * baut, heißt in diesem Bestand durchgehend `erzeuge…`, `baue…`, `…zeile`,
 * `…Csv`, `…Adresse` oder `…text`. Das Muster ist grob und meldet auch
 * Leser (`leseCsv`) und Bauwerkzeuge (`baueKern`) — sie stehen unten mit
 * Begründung. Ein zu weites Muster kostet Einträge, ein zu enges kostet
 * Ausgänge.
 */
/**
 * **Erweitert am 2. September.** Das Muster kannte das Wort `Text`, aber nicht
 * die Dateiendung `Txt` — und `robotsTxt` in `maschinenlesbar.js` ist damit an
 * einer Schreibweise vorbeigelaufen. Eine Datei, die jeder Crawler liest und
 * die niemand als Ausgang geführt hat. Gefunden beim Bau des Crawler-Registers.
 *
 * Dritter Fall derselben Sorte in diesem Bestand: `\\bÖNORM` traf nie, weil `Ö`
 * kein ASCII-Wortzeichen ist; `ZAHL_MIT_EINHEIT` kannte `Std`, aber nicht
 * „Stunden". **Ein Muster prüft die Schreibweise, die sein Verfasser im Kopf
 * hatte.**
 */
/*
 * **Erweitert am 10. September 2026 um `[Ss]atz$`.**
 *
 * Der dritte Fall derselben Art in dieser Datei, und diesmal fiel er beim
 * eigenen Bauen auf: Für den Hinweis über entfallene Warenkorbpositionen
 * entstand `entfallensatz` — eine Funktion, die einen Satz für den Kunden
 * baut und Kennungen aus dem Browserspeicher hineinsetzt. Das Verzeichnis sah
 * sie nicht, weil ihr Name auf „satz" endet und nicht auf „text".
 *
 * Nachgezählt fanden sich **zehn** Ausfuhren auf `satz`, davon sieben, die
 * einen Satz für einen Kunden oder einen Lieferanten bauen.
 *
 * > **Ein Verzeichnis, das eine Schreibweise nicht kennt, führt sie auch
 * > nicht** — und meldet dabei vollständig über das, was es kennt.
 *
 * Zwei der zehn enden nur zufällig so: `noetigerUmsatz` ist eine Zahl, und
 * `pruefeAbsatz` ist ein Prüfer. Beide stehen mit ihrem Grund in
 * `KEIN_AUSGANG` — eine Ausnahme mit Begründung ist billiger als ein Muster,
 * das die Fälle von Hand ausnimmt.
 */
export const NAMENSMUSTER = /^(erzeuge|baue)|[Zz]eile$|Csv$|Adresse$|[Ss]atz$|[Tt]e?xt$/;

/** Die Ausgänge, die im Fremdtextverzeichnis geprüft werden. */
export const AUSGAENGE = Object.freeze([
  Object.freeze({ modul: 'src/beleg.js', funktion: 'erzeugeAngebot', an: 'Kunde', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/beleg.js', funktion: 'erzeugeAuftragsbestaetigung', an: 'Kunde', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/beleg.js', funktion: 'erzeugeRechnung', an: 'Kunde', form: 'Zeilentext' }),
  // **Ergänzt am 11. September.** Der vierte Beleg — und der einzige, der nein
  // sagt. Er setzt die Anschrift des Kunden ein und die Gründe aus einem
  // Register; die Gründe selbst kommen aus dem Bestand und nicht von außen.
  Object.freeze({ modul: 'src/absage.js', funktion: 'erzeugeAbsage', an: 'Kunde', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/bestellung.js', funktion: 'erzeugeBestellungen', an: 'Lieferant', form: 'Zeilentext und CSV' }),
  Object.freeze({ modul: 'src/format.js', funktion: 'jsonFuerSkript', an: 'jeder Besucher', form: 'JSON in einem Skriptelement' }),
  Object.freeze({ modul: 'src/lieferantenanfrage.js', funktion: 'erzeugeLieferantenanfrage', an: 'Lieferant', form: 'Brieftext' }),
  Object.freeze({ modul: 'src/rechtstexteauftrag.js', funktion: 'erzeugeRechtstexteauftrag', an: 'Rechtstexteanbieter', form: 'Brieftext' }),
  Object.freeze({ modul: 'src/kundenanfrage.js', funktion: 'baueKundenanfrage', an: 'Lieferant, über den Kunden', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/kundenanfrage.js', funktion: 'mailtoWeg', an: 'das Mailprogramm des Kunden', form: 'URL' }),
  Object.freeze({ modul: 'src/rechtstexte.js', funktion: 'erzeugeImpressum', an: 'jeder Besucher', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/maschinenlesbar.js', funktion: 'robotsTxt', an: 'jeder Crawler', form: 'robots.txt' }),
  Object.freeze({ modul: 'src/vies.js', funktion: 'belegzeile', an: 'die eigene Ablage', form: 'Zeile' }),
  Object.freeze({ modul: 'src/ablage.js', funktion: 'alsCsv', an: 'Buchhaltung', form: 'CSV' }),
  Object.freeze({ modul: 'src/speicher.js', funktion: 'journalzeile', an: 'Buchhaltung', form: 'JSONL' }),
  // **Ergänzt am 8. September.** Der Zweck dieses Ausgangs ist ungewöhnlich:
  // Er geht zuerst an den Auftraggeber und danach, ausgepackt, an jeden
  // Besucher — das Archiv **ist** die Website. Es trägt keinen fremden Text
  // hinein, sondern die Dateien, die `npm run website` gebaut hat.
  Object.freeze({ modul: 'src/paket.js', funktion: 'baueZip', an: 'Auftraggeber, danach jeder Besucher', form: 'ZIP-Archiv' }),
]);

/**
 * Namen, die dem Muster entsprechen und trotzdem keine Ausgänge sind —
 * jeder mit dem Grund. Pflicht, aus demselben Grund wie bei `OHNE_WERKZEUG`
 * in `offenepunkte.js`: Wer hier etwas einträgt, das ein Ausgang ist, soll
 * beim Schreiben des Grundes merken, dass er keinen hat.
 */
export const KEIN_AUSGANG = Object.freeze([
  // **Ergänzt am 8. September**, mit dem Baumabdruck des Gegenprobenläufers.
  // Derselbe Fall wie `abbruchtext` eine Zeile darunter: eine Weigerung für die
  // eigene Konsole, gebaut aus Pfaden des eigenen Bestands.
  Object.freeze({ funktion: 'bewegungstext', warum: 'Baut den Satz, mit dem der Gegenprobenläufer eine Probe zurückstellt, weil sich der Bestand unter ihm bewegt hat — aus Pfaden, die er selbst eingelesen hat, für die eigene Konsole. Kein fremder Text erreicht ihn, und er erreicht keinen Empfänger außerhalb des Rechners.' }),
  Object.freeze({ funktion: 'abbruchtext', warum: 'Baut die Weigerung, gegen ein veraltetes Erzeugnis zu prüfen — drei Zeilen für die Konsole des Betreibers, aus Dateinamen des eigenen Bestands. Kein fremder Text erreicht sie, und sie erreicht keinen Empfänger außerhalb des Rechners.' }),
  // **Ergänzt am 5. September**, mit der Verlegung des Frachtsatzes in ein
  // eigenes Modul. Der Satz geht sehr wohl an den Kunden — aber er entsteht
  // aus einer Zahl des eigenen Rechenkerns und aus nichts sonst.
  Object.freeze({ funktion: 'frachtGrundText', warum: 'Baut den Satz an der Frachtzeile aus **einer eigenen Zahl** — der Anzahl der Sperrgut-Positionen im eigenen Warenkorb. Fremdtext erreicht ihn nicht: Er nimmt keine Zeichenkette entgegen, sondern eine Menge, und wo er hinausgeht (Kasse, Beleg), sind die umgebenden Texte geprüft.' }),
  // **Ergänzt am 5. September**, aus demselben Anlass wie sein Nachbar: Der
  // Frei-Haus-Satz kam aus `preis.js` hierher, weil er dort mit einer Zahl
  // stand, die er nicht nennen darf.
  // **Ergänzt am 5. September.** Sie baut keinen Text, sie **zerlegt** einen —
  // aus HTML wird Fließtext, damit ein Prüfer darin suchen kann. Der Weg geht
  // nach innen, nicht nach außen.
  /* **Zehn Einträge vom 10. September**, mit der Aufnahme von `[Ss]atz$` ins
   * Namensmuster. Sieben bauen einen Satz für einen Kunden oder einen
   * Lieferanten — keiner von ihnen ist selbst ein Ausgang: Sie liefern eine
   * Zeile an ein Dokument, das im Verzeichnis oben steht, oder an eine
   * Oberfläche, die sie als Text und nicht als Markup setzt. Zwei enden nur
   * zufällig auf diese Buchstaben. */
  // **Ergänzt am 11. September**, mit den Serverkopfzeilen.
  Object.freeze({ funktion: 'htaccessText', warum: 'Baut die `.htaccess` des Auslieferungsordners aus einem eingefrorenen Register — vier Kopfzeilen und der Name der Fehlerseite. Sie nimmt keine Zeichenkette von außen entgegen, sondern einen Dateinamen aus dem eigenen Bau; ein Empfänger ist sie auch nicht: Was sie liefert, liest der Webserver und kein Mensch. `npm run pruefe-kopfzeilen` hält das Ergebnis an einem laufenden Apache.' }),
  Object.freeze({ funktion: 'entfallensatz', warum: 'Baut den Hinweis über Positionen, die nicht mehr im Katalog stehen. Die Kennungen darin kommen aus dem Browserspeicher des Besuchers, also von außen — die Oberfläche setzt den Satz über `textContent` und nicht als Markup, damit eine erfundene Kennung Text bleibt und keine Marke wird.' }),
  Object.freeze({ funktion: 'systembruchsatz', warum: 'Baut den Hinweis, dass ein Warenkorb Schichten aus zwei Wärmedämmverbundsystemen mischt. Systemnamen und Rollen stammen aus dem eigenen Katalog; der Satz geht in die Hinweisliste des Warenkorbs und wird dort als Text gesetzt, nicht als Markup.' }),
  Object.freeze({ funktion: 'abholungssatz', warum: 'Baut die Antwort auf „Kann ich selbst abholen?" aus einem Feld der eigenen Lieferantendatei. Er geht ausschließlich über das Seitenbauwerkzeug hinaus und läuft dort durch dieselbe Entschärfung wie jeder andere eingesetzte Wert.' }),
  Object.freeze({ funktion: 'lieferungssatz', warum: 'Baut aus **einer eigenen Zahl** — der Anzahl der Lieferanten im Katalog — den Satz darüber, ob ein Warenkorb eine oder mehrere Lieferungen ist. Fremdtext kann ihn nicht erreichen: Er nimmt eine Menge entgegen und keine Zeichenkette.' }),
  Object.freeze({ funktion: 'merkblattsatz', warum: 'Baut aus zwei eigenen Zahlen — wie viele Artikelseiten einen Merkblattverweis tragen und wie viele es gibt — den Satz für die Maschinendatei. Er nimmt keine Zeichenkette entgegen, also erreicht ihn kein fremder Text.' }),
  Object.freeze({ funktion: 'nachfragesatz', warum: 'Baut die Nachfragen zu Artikeln ohne Hersteller und ohne Merkblattadresse. Die Bezeichnungen darin stammen vom Lieferanten, also von außen — der Satz geht nur über `erzeugeLieferantenanfrage` hinaus, und dieser Brief steht als Ausgang im Verzeichnis und ist dort geprüft.' }),
  Object.freeze({ funktion: 'lueckensatz', warum: 'Baut die Frage nach den Positionen, die unsere Systemlisten nicht aus dem Sortiment des Lieferanten zusammenbekommen. Die Positionsnamen stammen aus den eigenen Stücklisten; hinaus geht der Satz nur über `erzeugeLieferantenanfrage`.' }),
  Object.freeze({ funktion: 'fehltSatz', warum: 'Baut die halbe Zeile „es fehlen E-Mail, Telefon" für die Startklar-Prüfung — drei Wörter für die Konsole des Betreibers, aus Feldnamen des eigenen Bestands. Sie erreicht keinen Empfänger außerhalb des Rechners.' }),
  Object.freeze({ funktion: 'noetigerUmsatz', warum: 'Endet nur zufällig auf diese Buchstaben: Sie gibt eine **Zahl** zurück — den Monatsumsatz, den ein Zahlweg nötig macht — und keinen Satz. Ein Ausgang ist sie damit unter keiner Lesart; das Muster kann „Umsatz" nicht von „Satz" unterscheiden, und eine Ausnahme mit Grund ist billiger als ein Muster mit Sonderfällen.' }),
  Object.freeze({ funktion: 'pruefeAbsatz', warum: 'Endet ebenfalls nur zufällig so: Sie prüft einen **Absatz** und gibt eine Liste von Verdachtsmomenten zurück. Sie ist der Prüfer, nicht das Geprüfte — der Weg geht nach innen, nicht nach außen.' }),
  // **Ergänzt am 10. September**, mit dem Register der Quellenstempel. Derselbe
  // Fall wie `nurText` darunter — und sie ruft es sogar auf.
  Object.freeze({ funktion: 'sichtbarerText', warum: 'Nimmt eine gebaute Seite entgegen und gibt weniger zurück: Skript und Stil heraus, Marken heraus, Leerraum zusammen. Sie ist kein Ausgang, sondern das Gegenteil — der Stempelprüfer sucht damit in gebautem HTML nach Quellenangaben. Was sie liefert, geht in eine Meldung auf der eigenen Konsole und in keine Datei.' }),
  Object.freeze({ funktion: 'nurText', warum: 'Nimmt HTML entgegen und gibt weniger zurück: Marken raus, Entitäten raus, Leerraum zusammen. Sie ist kein Ausgang, sondern das Gegenteil — sie wird von Prüfern benutzt, um in gebautem HTML nach Text zu suchen (Sperrgutflächen, Interna, Seitenähnlichkeit). Was sie liefert, geht in keine Datei und an keinen Empfänger.' }),
  Object.freeze({ funktion: 'frachtfreiText', warum: 'Nimmt **nichts** entgegen und gibt einen festen Satz zurück — die schmalste denkbare Textfunktion. Fremdtext kann sie nicht erreichen, weil sie keinen Eingang hat; das war der ganze Zweck der Änderung, die sie geschaffen hat (vorher stand dort eine Lieferantenschwelle in einer Zeichenkettenschablone).' }),
  Object.freeze({ funktion: 'baueAuftrag', warum: 'Baut das Auftragsobjekt aus geprüften Feldern — kein Text verlässt den Shop. Die Eingangsprüfung davor steht in kunde.js und wird eigens geprüft.' }),
  Object.freeze({ funktion: 'baueKern', warum: 'Fügt die Quelldateien zum Browserbündel — Werkzeug, kein Kundentext. Namenskollisionen prüft buendel.js selbst.' }),
  // **Grund berichtigt am 3. September.** Er lautete: „…geht als JSON ins
  // Bündel, nicht als Zeilentext hinaus." Der Satz hört einen Schritt zu
  // früh auf — das Bündel wird in eine **HTML-Seite** eingebettet, und dort
  // beendet die Zeichenfolge `</script>` in einer Artikelbezeichnung das
  // Skriptelement. Ein Fremdtext, der in eine Seite eingebettet wird, ist
  // ein Ausgang — auch wenn er als Daten aussieht.
  Object.freeze({ funktion: 'baueSuchindex', warum: 'Baut die Suchstruktur für die Oberfläche; ihr Inhalt kommt aus dem eigenen Katalog und geht als JSON hinaus. Der Ausgang ist nicht diese Funktion, sondern die Einbettung: Sie läuft über jsonFuerSkript und steht mit ihr im Fremdtextverzeichnis.' }),
  Object.freeze({ funktion: 'baueVorgang', warum: 'Führt den Vorgangszustand im Speicher. Was daraus als Text hinausgeht, geht durch beleg.js und bestellung.js — dort ist es geprüft.' }),
  Object.freeze({ funktion: 'baueAnfrage', warum: 'Baut die UID-Abfrage an das EU-System aus einer geprüften UID; die Antwort darauf ist der Fremdtext, und die geht durch belegzeile.' }),
  Object.freeze({ funktion: 'alsText', warum: 'Wandelt eigenes Markdown in HTML für die eigenen Seiten. Fremdtext erreicht sie nicht — die Inhalte stehen im Verzeichnis.' }),
  Object.freeze({ funktion: 'leseCsv', warum: 'Liest, statt zu schreiben. Ein Leser kann keinen Ausgang vergiften; was er einliest, geht danach durch die geprüften Ausgänge.' }),
  Object.freeze({ funktion: 'darfBeauftragtWerden', warum: 'Beantwortet, ob der Auftrag an den Rechtstexteanbieter hinausgehen darf. Sie baut keinen Text, sondern hält einen an — der Text selbst steht in `erzeugeRechtstexteauftrag` und ist dort geprüft.' }),
  Object.freeze({ funktion: 'eigenerText', warum: 'Schneidet aus einer **gebauten** Seite den eigenen Teil heraus, damit die Dublettenprüfung Navigation nicht für Inhalt hält. Sie liest das eigene Erzeugnis und gibt nichts hinaus — was sie zurückgibt, geht in eine Wortmenge und nicht in eine Datei.' }),
  Object.freeze({ funktion: 'lesePositionen', warum: 'Liest die Positionen aus einem eingegangenen Anfragetext zurück. Ein Leser kann keinen Ausgang vergiften — und was er liest, geht erst weiter, wenn `leseAnfrage` es nachgerechnet hat.' }),
  Object.freeze({ funktion: 'leseAnfrage', warum: 'Rechnet die zurückgelesene Anfrage nach und gibt bei jeder Abweichung nichts zurück, sondern den Grund. Ihr Ergebnis ist ein Befund, kein Text — der Beleg daraus entsteht in beleg.js und ist dort geprüft.' }),
  Object.freeze({ funktion: 'leseBestellCsv', warum: 'Dasselbe in der Gegenrichtung: Er liest die eigene Bestell-CSV zur Kontrolle zurück. Sein Ausgang ist ein Vergleichsbefund, kein Text.' }),
  // **Fünf Einträge vom 3. September.** Sie waren dem Verzeichnis bis dahin
  // unsichtbar: Der Leser kannte nur `export function`, und diese fünf sind
  // Pfeilfunktionen an einem `export const`.
  Object.freeze({ funktion: 'markenzeile', warum: 'Sie baut eine Zeile des Impressums — und das Impressum steht als Ganzes im Verzeichnis (erzeugeImpressum). Ihr Inhalt sind zwei eigene Felder aus data/betreiber.json, kein Fremdtext; sie geht nur über erzeugeImpressum hinaus und ist dort geprüft.' }),
  Object.freeze({ funktion: 'textZeile', warum: 'Sie ist nicht der Ausgang, sondern die Entschärfung — jeder Ausgang läuft durch sie. Was sie zurückgibt, geht erst durch eine der geführten Funktionen hinaus.' }),
  Object.freeze({ funktion: 'zahlText', warum: 'Schreibt eine Zahl in hiesiger Schreibweise. Sie baut keinen Text, sondern formt einen Wert — und die Zeilen, in denen er landet, stehen einzeln im Verzeichnis.' }),
  Object.freeze({ funktion: 'zahlAusText', warum: 'Liest zurück, statt zu schreiben. Ein Leser kann keinen Ausgang vergiften; dieselbe Begründung wie bei leseCsv.' }),
  Object.freeze({ funktion: 'einheitText', warum: 'Übersetzt ein Einheitenkürzel des Lieferanten in lesbares Deutsch. Die Übersetzung stammt aus einer eigenen Tabelle, nicht aus der Herstellerdatei.' }),
  Object.freeze({ funktion: 'ustText', warum: 'Setzt den eigenen Steuersatz in einen Satz. Kein Fremdtext geht hindurch; der Satz selbst steht im Bestand.' }),
  Object.freeze({ funktion: 'schneideQuelltext', warum: 'Schneidet HTML für die Inhaltsprüfung auf — ein Prüfwerkzeug, dessen Ergebnis auf dem Bildschirm endet.' }),
]);

/**
 * Welche textbauenden Funktionen kennt niemand?
 *
 * @param {{modul: string, funktion: string}[]} gefunden  aus dem Quelltext gelesen
 */
export function ungenannteAusgaenge(gefunden, ausgaenge = AUSGAENGE, keine = KEIN_AUSGANG) {
  const bekannt = new Set(ausgaenge.map((a) => a.funktion));
  const begruendet = new Set(keine.map((k) => k.funktion));
  for (const k of keine) {
    if (!k.warum || k.warum.length < 40) throw new Error(`Ohne Grund kein Eintrag: ${k.funktion}`);
    if (bekannt.has(k.funktion)) throw new Error(`${k.funktion} steht als Ausgang und als Nicht-Ausgang`);
  }
  return gefunden.filter((g) => !bekannt.has(g.funktion) && !begruendet.has(g.funktion));
}
