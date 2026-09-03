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
export const NAMENSMUSTER = /^(erzeuge|baue)|[Zz]eile$|Csv$|Adresse$|[Tt]e?xt$/;

/** Die Ausgänge, die im Fremdtextverzeichnis geprüft werden. */
export const AUSGAENGE = Object.freeze([
  Object.freeze({ modul: 'src/beleg.js', funktion: 'erzeugeAngebot', an: 'Kunde', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/beleg.js', funktion: 'erzeugeAuftragsbestaetigung', an: 'Kunde', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/beleg.js', funktion: 'erzeugeRechnung', an: 'Kunde', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/bestellung.js', funktion: 'erzeugeBestellungen', an: 'Lieferant', form: 'Zeilentext und CSV' }),
  Object.freeze({ modul: 'src/format.js', funktion: 'jsonFuerSkript', an: 'jeder Besucher', form: 'JSON in einem Skriptelement' }),
  Object.freeze({ modul: 'src/lieferantenanfrage.js', funktion: 'erzeugeLieferantenanfrage', an: 'Lieferant', form: 'Brieftext' }),
  Object.freeze({ modul: 'src/kundenanfrage.js', funktion: 'baueKundenanfrage', an: 'Lieferant, über den Kunden', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/kundenanfrage.js', funktion: 'mailtoAdresse', an: 'das Mailprogramm des Kunden', form: 'URL' }),
  Object.freeze({ modul: 'src/rechtstexte.js', funktion: 'erzeugeImpressum', an: 'jeder Besucher', form: 'Zeilentext' }),
  Object.freeze({ modul: 'src/maschinenlesbar.js', funktion: 'robotsTxt', an: 'jeder Crawler', form: 'robots.txt' }),
  Object.freeze({ modul: 'src/vies.js', funktion: 'belegzeile', an: 'die eigene Ablage', form: 'Zeile' }),
  Object.freeze({ modul: 'src/ablage.js', funktion: 'alsCsv', an: 'Buchhaltung', form: 'CSV' }),
  Object.freeze({ modul: 'src/speicher.js', funktion: 'journalzeile', an: 'Buchhaltung', form: 'JSONL' }),
]);

/**
 * Namen, die dem Muster entsprechen und trotzdem keine Ausgänge sind —
 * jeder mit dem Grund. Pflicht, aus demselben Grund wie bei `OHNE_WERKZEUG`
 * in `offenepunkte.js`: Wer hier etwas einträgt, das ein Ausgang ist, soll
 * beim Schreiben des Grundes merken, dass er keinen hat.
 */
export const KEIN_AUSGANG = Object.freeze([
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
  Object.freeze({ funktion: 'leseBestellCsv', warum: 'Dasselbe in der Gegenrichtung: Er liest die eigene Bestell-CSV zur Kontrolle zurück. Sein Ausgang ist ein Vergleichsbefund, kein Text.' }),
  // **Fünf Einträge vom 3. September.** Sie waren dem Verzeichnis bis dahin
  // unsichtbar: Der Leser kannte nur `export function`, und diese fünf sind
  // Pfeilfunktionen an einem `export const`.
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
