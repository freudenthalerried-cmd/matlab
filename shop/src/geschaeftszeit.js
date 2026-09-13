/**
 * Welcher Tag ist heute — für einen Betrieb in Ried in der Riedmark?
 *
 * **Der Anlass, 9. September 2026.** `src/ablage.js` beschreibt das Feld
 * `zeitpunkt` seit ihrem ersten Bau als *„Ausstellungsdatum; zeitgerechte
 * Eintragung in der Zeitfolge"*, mit § 11 UStG und § 131 Abs 1 Z 2 BAO
 * darüber. Gefüllt wurde es an zwei Stellen aus zwei verschiedenen Uhren:
 *
 * - `bestellung.php` schreibt `gmdate('c')` — **UTC**;
 * - dieselbe Datei wählt die Journaldatei mit `date('Y')` — der **Zeitzone
 *   des Hosts**, die niemand gesetzt hat und die auf All-Inkl niemand
 *   nachgesehen hat;
 * - `bin/vorgang.mjs` nimmt `new Date().toISOString().slice(0, 10)` als
 *   Ausstellungsdatum der Rechnung — wieder **UTC**.
 *
 * Nachgestellt mit echtem PHP, Bestellung am 1. Jänner 2027 um 00:30 Uhr
 * österreichischer Zeit:
 *
 * ```
 * Host-Zeitzone UTC             journal-2026.jsonl   zeitpunkt = 2026-12-31T23:30:00+00:00
 * Host-Zeitzone Europe/Vienna   journal-2027.jsonl   zeitpunkt = 2026-12-31T23:30:00+00:00
 * ```
 *
 * Zwei Sätze, beide falsch, jeder auf seine Art: Auf einem UTC-Host landet
 * der Geschäftsfall im Journal des **Vorjahres** und trägt eine Nummer
 * daraus; auf einem Wiener Host stimmt die Datei, und das Ausstellungsdatum
 * im Eintrag nennt trotzdem den 31. Dezember.
 *
 * Und es braucht keinen Jahreswechsel. Jede Bestellung zwischen Mitternacht
 * und 01:00 Uhr (im Sommer 02:00) bekommt das Datum des **Vortags**:
 *
 * ```
 * 15. März 2027, 00:30 Uhr in Österreich → Ausstellungsdatum laut Eintrag: 2027-03-14
 * ```
 *
 * > **Ein Betrieb hat einen Kalender, keine zwei.** § 11 UStG meint mit
 * > „Ausstellungsdatum" den Tag am Ort des Unternehmens, § 132 BAO zählt
 * > sieben Jahre ab Ende des Wirtschaftsjahres, und beides sind
 * > österreichische Daten. Eine Uhr, die etwas anderes sagt, ist nicht
 * > ungenau — sie beantwortet eine andere Frage.
 *
 * Diese Datei ist der eine Kalender. Sie rechnet ohne Fremdpaket: `Intl`
 * kennt die Zeitzone samt Sommerzeit, und `sv-SE` gibt ISO-Form aus.
 */

/**
 * Der Sitz des Betriebs: Ried in der Riedmark, Bezirk Perg, Oberösterreich.
 * Mitteleuropäische Zeit mit Sommerzeit — nicht UTC, nicht die Zeitzone des
 * Hosts, sondern die des Unternehmens.
 */
export const ZEITZONE = 'Europe/Vienna';

/** `sv-SE` liefert `YYYY-MM-DD` und `HH:MM:SS` ohne eigene Zusammensetzung. */
const TAGFORM = new Intl.DateTimeFormat('sv-SE', {
  timeZone: ZEITZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const ZEITFORM = new Intl.DateTimeFormat('sv-SE', {
  timeZone: ZEITZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

/**
 * Der Geschäftstag als `YYYY-MM-DD` — das Ausstellungsdatum nach § 11 UStG.
 *
 * @param {Date} [datum] der Zeitpunkt; ohne Angabe jetzt
 * @returns {string}
 */
export function geschaeftstag(datum = new Date()) {
  return TAGFORM.format(datum);
}

/**
 * Das Wirtschaftsjahr, in dem ein Zeitpunkt liegt. Es entscheidet die
 * Journaldatei und damit, ab wann die sieben Jahre des § 132 BAO laufen.
 *
 * @param {Date} [datum]
 * @returns {number}
 */
export function geschaeftsjahr(datum = new Date()) {
  return Number(geschaeftstag(datum).slice(0, 4));
}

/**
 * Der volle Zeitstempel mit Zonenversatz, etwa `2027-03-15T00:30:00+01:00`.
 *
 * **Der Versatz gehört dazu.** Ohne ihn wäre die Angabe eine Ortszeit ohne
 * Ort — und genau das macht sie unvergleichbar, sobald jemand zwei Belege
 * nebeneinanderlegt. Mit ihm ist sie beides: der richtige Kalendertag und
 * ein eindeutiger Augenblick.
 *
 * @param {Date} [datum]
 * @returns {string}
 */
export function zeitstempel(datum = new Date()) {
  const tag = geschaeftstag(datum);
  const uhr = ZEITFORM.format(datum).replace(/^24/, '00');
  // Der Versatz ist die Differenz zwischen der Ortszeit und UTC, in Minuten.
  const alsUtc = Date.UTC(
    Number(tag.slice(0, 4)), Number(tag.slice(5, 7)) - 1, Number(tag.slice(8, 10)),
    Number(uhr.slice(0, 2)), Number(uhr.slice(3, 5)), Number(uhr.slice(6, 8)));
  const genau = datum.getTime() - datum.getMilliseconds();
  const minuten = Math.round((alsUtc - genau) / 60000);
  const vor = minuten < 0 ? '-' : '+';
  const b = Math.abs(minuten);
  const zz = (n) => String(n).padStart(2, '0');
  return `${tag}T${uhr}${vor}${zz(Math.floor(b / 60))}:${zz(b % 60)}`;
}

/* ------------------------------------------------------------------ *
 * Wer die Uhr liest — und welche
 * ------------------------------------------------------------------ */

/**
 * Jede Stelle im Bestand, die von sich aus auf die Uhr sieht.
 *
 * **Warum als Register und nicht als Regel im Kopf.** „Belegdaten in
 * Ortszeit" ist ein Satz; ein Satz gilt für den, der ihn liest. Die Liste
 * hier wird von `zeitbefund()` gegen den Quelltext gehalten, in **beide**
 * Richtungen: Eine neue Stelle ohne Eintrag fällt auf, ein Eintrag ohne
 * Stelle auch. `stellen` ist die Zahl der Uhrgriffe in der Datei — wächst
 * sie, hat jemand eine weitere angelegt, ohne sie zu begründen.
 *
 * `uhr: 'geschaeft'` heißt: Das Ergebnis ist ein **Datum, das ein Kunde
 * oder eine Behörde als unseres liest**. Es muss aus `geschaeftstag()` oder
 * `geschaeftsjahr()` kommen. `uhr: 'technisch'` heißt: Das Ergebnis
 * beschreibt einen Vorgang in dieser Werkstatt und keinen Geschäftsfall —
 * dort ist UTC richtig und der Grund steht daneben. `uhr: 'zitat'` heißt:
 * Der Treffer ist gar kein Uhrgriff, sondern eine Zeichenkette, die einen
 * zeigt — ein Prüfer kann das nicht unterscheiden, ein Mensch entscheidet
 * es hier einmal.
 */
export const UHRSTELLEN = Object.freeze([
  Object.freeze({
    datei: 'test/preisstand-auf-der-seite.test.js', roh: 0, uhr: 'geschaeft',
    was: 'das Vergleichsdatum für das Alter der Einkaufsgrundlage',
    warum: 'Die Probe hält die Altersmarke der gebauten Artikelseite gegen ihre eigene '
      + 'Rechnung. Die Seite ist mit dem Geschäftskalender gestempelt; las die Probe die '
      + 'Uhr roh, verglich sie zwischen 22:00 und 24:00 UTC das Alter von gestern mit der '
      + 'Marke von heute. Genau daran ist sie am 9. September rot geworden.',
  }),
  Object.freeze({
    datei: 'test/inhaltsstand.test.js', roh: 0, uhr: 'geschaeft',
    was: 'das Heute, gegen das die Git-Stände der Inhaltsseiten gemessen werden',
    warum: 'Die Stände kommen aus derselben Ablage, die den Geschäftskalender führt. Zwei '
      + 'Uhren ergeben hier einen Tag Unterschied und damit eine Probe, die am späten Abend '
      + 'anders urteilt als am Vormittag — ohne dass sich am Bestand etwas geändert hätte.',
  }),
  Object.freeze({
    datei: 'test/sitemapstand.test.js', roh: 0, uhr: 'geschaeft',
    was: 'das Heute, gegen das die Datumsangaben der sitemap.xml gemessen werden',
    warum: 'Die sitemap.xml wird von `npm run website` mit dem Geschäftskalender gestempelt '
      + 'und geht so an Google. Eine Probe, die sie gegen die Rechneruhr hält, prüft zwei '
      + 'verschiedene Tage gegeneinander.',
  }),
  Object.freeze({
    datei: 'test/bestellungphp.test.js', roh: 0, uhr: 'geschaeft',
    was: 'das Wirtschaftsjahr der Journaldatei, in der die Probe ihre Bestellung sucht',
    warum: '`bestellung.php` wählt seine Journaldatei über Europe/Vienna. Suchte die Probe '
      + 'mit dem UTC-Jahr, ginge sie am 31. Dezember nach 23:00 Uhr Ortszeit an der Datei '
      + 'vorbei, die das Skript gerade geschrieben hat — genau der Fehler, gegen den sie steht.',
  }),
  Object.freeze({
    datei: 'test/geschaeftszeit.test.js', roh: 17, uhr: 'zitat',
    was: 'die Prüfungen des Kalenders selbst',
    warum: 'Alle siebzehn Griffe stehen in Zeichenketten: Die Probe baut sich Quelltexte, an '
      + 'denen sie den Zähler misst — auch die PHP-Formen gmdate und date. Sie sieht nicht auf '
      + 'die Uhr, sie schreibt über sie. Die Zahl steht hier genau, damit ein echter Uhrgriff, '
      + 'der sich in diese Datei verirrt, die Summe verschiebt und auffällt.',
  }),
  Object.freeze({
    datei: 'src/geschaeftszeit.js', roh: 3, uhr: 'geschaeft',
    was: 'der Kalender selbst',
    warum: 'Die drei Griffe sind die Vorgabewerte von geschaeftstag, geschaeftsjahr und '
      + 'zeitstempel. Hier entsteht die Ortszeit, hier darf die Uhr gelesen werden.',
  }),
  Object.freeze({
    datei: 'src/kundenanfrage.js', roh: 0, uhr: 'geschaeft',
    was: 'das Datum im Anfragetext',
    warum: 'Der Text geht als Anfrage an uns und ist die Grundlage des Angebots. Ein Kunde, '
      + 'der um 00:30 Uhr bestellt, liest darin sonst den Vortag und schreibt uns über eine '
      + 'Anfrage von gestern.',
  }),
  Object.freeze({
    datei: 'bin/vorgang.mjs', roh: 0, uhr: 'geschaeft',
    was: 'das Ausstellungsdatum auf Angebot, Auftragsbestätigung und Rechnung',
    warum: '§ 11 Abs 1 Z 4 UStG verlangt das Ausstellungsdatum. Gemeint ist der Tag am Sitz '
      + 'des Unternehmens; ein Beleg mit dem Datum des Vortags ist kein Formfehler auf dem '
      + 'Papier, sondern eine falsche Angabe darauf.',
  }),
  Object.freeze({
    datei: 'bin/posteingang.mjs', roh: 0, uhr: 'geschaeft',
    was: 'das Wirtschaftsjahr der Journaldatei',
    warum: 'Es entscheidet, welche Datei gelesen wird — und damit, ob die Bestellungen des '
      + '1. Jänner überhaupt gefunden werden. § 132 BAO zählt sieben Jahre ab Ende des '
      + 'Wirtschaftsjahres, und das ist ein österreichisches Jahr.',
  }),
  Object.freeze({
    datei: 'bin/bestellprobe.mjs', roh: 0, uhr: 'geschaeft',
    was: 'die Journaldatei, in der die Probe ihre eigene Bestellung sucht',
    warum: 'Sie muss dieselbe Datei treffen wie das Empfangsskript. Rechnen beide anders, '
      + 'ist die Probe am Jahreswechsel rot, ohne dass etwas kaputt wäre — oder schlimmer: '
      + 'grün, weil sie eine alte Zeile findet.',
  }),
  Object.freeze({
    datei: 'bestellung.php', roh: 2, uhr: 'geschaeft',
    was: 'Journaljahr und Ausstellungsdatum jeder eingehenden Bestellung',
    warum: 'Der eine Griff wählt die Datei und damit die fortlaufende Nummer, der andere '
      + 'stempelt den Eintrag. Sie liefen aus zwei Uhren: die Jahreszahl aus der '
      + 'ungesetzten Zeitzone des Hosts, der Stempel aus UTC.',
  }),
  Object.freeze({
    datei: 'bin/preisliste.mjs', roh: 0, uhr: 'geschaeft',
    was: 'der Preisstand je Artikel beim Einlesen',
    warum: 'Er steht auf jeder Artikelseite und ist die Grundlage der Alterswarnung. Ein '
      + 'Preisstand, der einen Tag vor dem Einlesen liegt, ist eine Angabe über einen Tag, '
      + 'an dem niemand etwas eingelesen hat.',
  }),
  Object.freeze({
    datei: 'bin/website.mjs', roh: 0, uhr: 'geschaeft',
    was: 'der Seitenstand, der Katalogstand und das Heute der Alterswarnung',
    warum: 'Alle drei stehen auf ausgelieferten Seiten. Der dritte rechnet zusätzlich die '
      + 'Tage seit dem Preisstand aus und entscheidet, ob der Kunde die Warnung sieht.',
  }),

  Object.freeze({
    datei: 'src/gegenprobenregister.js', roh: 2, uhr: 'zitat',
    was: 'die Mutationstexte der beiden Gegenproben zu diesem Prüfer',
    warum: 'Beide Proben drehen ein Datum auf die Rechneruhr zurück — einmal das '
      + 'Ausstellungsdatum in bin/vorgang.mjs, einmal das Vergleichsdatum in '
      + 'test/preisstand-auf-der-seite.test.js; dafür stehen die alten Zeilen als '
      + 'Zeichenketten im Register. Sie werden nie ausgeführt — der Prüfer hat sie trotzdem '
      + 'gefunden, und das ist richtig so: Er kann ein Zitat nicht von einem Aufruf '
      + 'unterscheiden, also entscheidet ein Mensch es hier einmal statt der Prüfer jedes Mal '
      + 'falsch. Die zweite kostete beim Anlegen einen Lauf: Die Gegenprobe fand ihren Prüfer '
      + 'rot vor, weil ihr eigener Mutationstext ihn rot gemacht hatte.',
  }),

  /* Die Uhr in der Werkstatt — hier ist UTC richtig, und hier steht warum. */
  Object.freeze({
    datei: 'src/mutationsschutz.js', roh: 1, uhr: 'technisch',
    was: 'der Zettel an einer absichtlich verfälschten Datei',
    warum: 'Er hält fest, seit wann eine Gegenprobe läuft. Gebraucht wird die Reihenfolge, '
      + 'nicht der Kalendertag — und der Zettel überlebt keine Nacht.',
  }),
  Object.freeze({
    datei: 'src/paket.js', roh: 1, uhr: 'technisch',
    was: 'der Zeitstempel der Einträge im Auslieferungspaket',
    warum: 'Ein ZIP-Eintrag trägt sein Datum im DOS-Format ohne Zonenangabe. Es beschreibt '
      + 'die Datei, nicht einen Geschäftsfall.',
  }),
  Object.freeze({
    datei: 'src/sicherung.js', roh: 2, uhr: 'technisch',
    was: 'der Dateiname einer Sicherungskopie',
    warum: 'Der Stempel muss nur eindeutig und sortierbar sein. UTC ist dafür die bessere '
      + 'Wahl: Er springt nicht zur Sommerzeit und erzeugt keine doppelte Stunde.',
  }),
  Object.freeze({
    datei: 'bin/paket.mjs', roh: 1, uhr: 'technisch',
    was: 'der Dateiname des Auslieferungspakets',
    warum: 'Derselbe Fall wie die Sicherung: ein Name, kein Datum auf einem Papier.',
  }),
  Object.freeze({
    datei: 'bin/kampagne.mjs', roh: 1, uhr: 'technisch',
    was: 'der Stand der erzeugten Kampagnendateien',
    warum: 'Eine Angabe über einen Erzeugungslauf in dieser Werkstatt. Sie geht an keinen '
      + 'Kunden und in keinen Beleg; Google liest die Dateien, nicht das Datum darin.',
  }),
  Object.freeze({
    datei: 'bin/kennzahlen.mjs', roh: 1, uhr: 'technisch',
    was: 'der Stand der Auswertungsseite',
    warum: 'Sie ist eine Arbeitsauswertung für den Auftraggeber und wird nicht ausgeliefert.',
  }),
  Object.freeze({
    datei: 'bin/offenepunkte.mjs', roh: 2, uhr: 'technisch',
    was: 'der Stand der Liste offener Punkte',
    warum: 'Eine Arbeitsliste. Ein Tag Unterschied ändert an keinem der Punkte etwas.',
  }),
  Object.freeze({
    datei: 'bin/preisalterpruefung.mjs', roh: 1, uhr: 'technisch',
    was: 'der Stichtag, gegen den das Alter der Einkaufspreise gemessen wird',
    warum: 'Gemessen wird eine Spanne von 90 Tagen, kein Belegdatum. Ein Tag Unterschied '
      + 'verschiebt den Befund nur genau am Rand, und der Rand ist selbst eine Schätzung — '
      + 'der Preisrhythmus des Lieferanten ist eine der offenen Fragen an ihn.',
  }),
  Object.freeze({
    datei: 'bin/preiswiederherstellung.mjs', roh: 1, uhr: 'technisch',
    was: 'der Vermerk _stand in der zurückgerechneten Preisdatei',
    warum: 'Er sagt, wann zurückgerechnet wurde — eine Angabe über einen Rettungsvorgang in '
      + 'dieser Werkstatt. Der Preisstand der Artikel entsteht davon getrennt.',
  }),
  Object.freeze({
    datei: 'bin/standpruefung.mjs', roh: 1, uhr: 'technisch',
    was: 'das Heute, gegen das der Kopf von STATUS.md gehalten wird',
    warum: 'Eine Angabe über das Arbeitsverzeichnis. Sie wird gegen den jüngsten Eingriff '
      + 'gehalten, und der kommt aus derselben Uhr.',
  }),
]);

/**
 * Ein **roher** Uhrgriff: `new Date()` ohne Argument, `date(…)`, `gmdate(…)`.
 * Roh heißt: Die Uhr des Rechners, ohne Entscheidung darüber, welcher
 * Kalender gemeint ist.
 */
export const ROHGRIFF = /new Date\(\s*\)|\bgmdate\s*\(|(?<![\w$])date\s*\(/g;

/** Der Kalender dieses Betriebs, aufgerufen. */
export const KALENDERRUF = /\b(geschaeftstag|geschaeftsjahr|zeitstempel)\s*\(/;

/**
 * Der Quelltext ohne Kommentare.
 *
 * **Ein Uhrgriff im Kommentar ist keiner.** Diese Datei erklärt den Befund
 * im Kopf; ein Prüfer, der das mitzählt, meldete sich selbst. Umgekehrt darf
 * das Entfernen nicht zu viel wegnehmen — sonst verschwindet echter Code,
 * und der Prüfer wird still.
 */
export function ohneKommentare(quelltext, php = false) {
  let t = String(quelltext ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
  t = t.replace(/^\s*\/\/.*$/gm, '');
  if (php) t = t.replace(/^\s*#.*$/gm, '');
  return t;
}

/** Wie oft eine Datei roh auf die Uhr sieht. */
export function rohgriffe(quelltext, php = false) {
  return (ohneKommentare(quelltext, php).match(ROHGRIFF) ?? []).length;
}

/**
 * Hält das Register gegen den Quelltext — in beide Richtungen.
 *
 * **Was `roh` bedeutet.** Es ist die Zahl der rohen Uhrgriffe, die in dieser
 * Datei stehen **dürfen**. Für eine Datei mit Belegwirkung ist sie null: Ihre
 * Daten kommen aus dem Kalender, nicht aus der Rechneruhr. Zwei Ausnahmen
 * tragen ihren Grund im Eintrag — der Kalender selbst, und `bestellung.php`,
 * das auf dem Hosting ohne dieses Modul auskommen muss und deshalb seine
 * Zeitzone selbst setzt.
 *
 * @param {{pfad: string, text: string}[]} dateien alle Quelldateien des Shops
 * @param {object[]} [register]
 */
export function zeitbefund(dateien, register = UHRSTELLEN) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const nachPfad = new Map(register.map((e) => [e.datei, e]));

  for (const e of register) {
    if (!e.warum || e.warum.length < 40) {
      melde('grund-zu-duenn', `${e.datei}: ein Grund, der in eine Zeile passt, ist keiner`);
    }
    if (!['geschaeft', 'technisch', 'zitat'].includes(e.uhr)) {
      melde('uhr-unbekannt', `${e.datei}: „${e.uhr}" ist keine der beiden Uhren`);
    }
  }

  const gesehen = new Set();
  for (const { pfad, text } of dateien) {
    const php = pfad.endsWith('.php');
    const roh = rohgriffe(text, php);
    const eintrag = nachPfad.get(pfad);
    if (!eintrag) {
      if (roh > 0) {
        melde('stelle-ohne-eintrag',
          `${pfad} sieht ${roh}-mal roh auf die Uhr und steht in keinem Register — `
          + 'unentschieden, ob daraus ein Belegdatum wird');
      }
      continue;
    }
    gesehen.add(pfad);

    if (roh !== eintrag.roh) {
      melde(eintrag.roh === 0 ? 'rohe-uhr-im-beleg' : 'rohzahl-abgeloest',
        eintrag.roh === 0
          ? `${pfad} führt Belegdaten und sieht ${roh}-mal roh auf die Uhr — `
            + 'ein Datum aus der Rechneruhr ist am Sitz des Betriebs der falsche Tag'
          : `${pfad}: das Register erlaubt ${eintrag.roh} rohe Uhrgriffe, gezählt sind ${roh}`);
    }

    /*
     * Die Richtung, die den Fund gemacht hätte: Ein Eintrag darf „geschaeft"
     * sagen, ohne dass die Datei den Kalender je aufruft. Dann steht die
     * Absicht im Register, und im Code steht gar keine Zeit mehr — oder
     * weiter die alte. Beides sieht ohne diese Zeile grün aus.
     */
    if (eintrag.uhr === 'geschaeft' && eintrag.datei !== 'src/geschaeftszeit.js') {
      const ruft = php
        ? /date_default_timezone_set\(\s*'Europe\/Vienna'\s*\)/.test(text)
        : KALENDERRUF.test(ohneKommentare(text));
      if (!ruft) {
        melde('beleguhr-nicht-verwendet',
          `${pfad} soll den Geschäftskalender führen und ruft ihn nicht auf — `
          + 'die Absicht steht im Register, im Code steht sie nicht');
      }
      if (php && /\bgmdate\s*\(/.test(ohneKommentare(text, true))) {
        melde('utc-stempel-im-beleg',
          `${pfad} stempelt einen Beleg in UTC — gesetzte Zeitzone hin oder her, `
          + 'gmdate geht an ihr vorbei');
      }
    }
  }

  for (const e of register) {
    if (!gesehen.has(e.datei)) {
      melde('eintrag-ohne-datei', `${e.datei} steht im Register und wurde nicht gelesen`);
    }
  }

  return {
    meldungen,
    sauber: meldungen.length === 0,
    geprueft: dateien.length,
    eintraege: register.length,
    belegdateien: register.filter((e) => e.uhr === 'geschaeft').length,
  };
}
