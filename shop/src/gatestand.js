/**
 * Steht jede Gate-Entscheidung noch im Bestand — oder nur noch im Dokument?
 *
 * **Der Anlass, 7. September 2026.** Ein Gate ist die stärkste Festlegung
 * dieses Vorhabens: Es sagt, was gilt, und alles Spätere baut darauf. Gemessen
 * wurde am 7. September zum ersten Mal, wie viele der **28** Gates überhaupt
 * eine Spur im Bestand haben — und wie viele nur im Register stehen.
 *
 * > **Eine Entscheidung, die nur im Protokoll steht, ist eine Absichtserklärung.**
 *
 * Der naheliegende Prüfer wäre gewesen, in den Quellen nach „Gate 25" zu
 * suchen. Er wäre wertlos: Er misst, ob jemand die Nummer in einen Kommentar
 * geschrieben hat, und belohnt genau das. Geprüft wird deshalb die **Sache** —
 * die Datei, in der die Entscheidung wirkt, und das Muster, das verschwindet,
 * wenn sie zurückgenommen wird.
 *
 * Sechzehn Gates tragen keine Spur, und das ist richtig so: Sie gehören dem
 * Radon- und dem Leadmodell, die nach Gate 12 gleichrangig sind und nicht
 * gebaut werden, oder sie regeln das Verfahren statt das Erzeugnis. Sie stehen
 * mit Grund in `OHNE_SPUR` — wie überall in diesem Bestand ist die Ausnahme
 * das, was aufgeschrieben werden muss, nicht die Regel.
 *
 * Die Liste der Gates kommt aus `gate-register.md` selbst. Ein handgeführtes
 * Verzeichnis hätte dasselbe Ergebnis wie sein Verfasser.
 */

/** Woher die Gates kommen — gemessen, nicht abgeschrieben. */
import { wortzahl } from './format.js';

export const QUELLE = 'docs/baustoff-shop/gate-register.md';

/** Überschrift des Abschnitts, in dem die Gates stehen. */
const ABSCHNITT = /^## Die \S+ Gates\s*$/;

/**
 * Liest die Gate-Nummern samt Abschnitt aus dem Register.
 *
 * Gelesen wird nur der Abschnitt „Die achtundzwanzig Gates" — weiter unten
 * stehen dieselben Nummern noch zweimal: einmal als Auslöser („Was die Gates
 * auslöst"), einmal als Vorbehalt („Gates, die sich noch ändern können"). Wer
 * das ganze Dokument liest, zählt Gate 5 dreimal.
 */
export function gatesAusRegister(text) {
  const zeilen = text.split('\n');
  const von = zeilen.findIndex((z) => ABSCHNITT.test(z));
  if (von < 0) return [];
  let abschnitt = '';
  const gefunden = [];
  const gesehen = new Set();
  for (const z of zeilen.slice(von + 1)) {
    if (/^## /.test(z)) break;
    const u = z.match(/^### (.+?)\s*$/);
    if (u) { [, abschnitt] = u; continue; }
    const g = z.match(/^\|\s*\*\*(\d+)\*\*\s*\|/);
    if (!g) continue;
    const nr = Number(g[1]);
    if (gesehen.has(nr)) continue;
    gesehen.add(nr);
    gefunden.push({ nr, abschnitt });
  }
  return gefunden.sort((a, b) => a.nr - b.nr);
}

/**
 * Gates, die im Bestand wirken — mit der Stelle, an der sie das tun.
 *
 * `muster` ist bewusst die **Sache** und nicht die Gate-Nummer: Wer die
 * Entscheidung zurücknimmt, entfernt den Aufruf, nicht den Kommentar.
 *
 * **Warum `export\s+function` und nicht `export function`:** Ein Muster, das
 * Quelltext zitiert, **ist** Quelltext. Beim ersten Lauf hielt
 * `npm run pruefe-ungerufen` die zitierte Zeile für eine Ausfuhr dieser Datei
 * und meldete sie als ungerufen — ein Prüfer, der über einen anderen Prüfer
 * stolpert, weil dieser seine Fundstelle wörtlich mitführt.
 */
export const SPUREN = Object.freeze([
  Object.freeze({
    gate: 36,
    datei: 'shop/src/serverkopf.js',
    muster: /<IfModule mod_headers\.c>/,
    warum: 'Vier Sicherheitskopfzeilen gehen mit dem Auslieferungsordner hinaus, und zwar in '
      + 'einer Klammer, die ein fehlendes Modul abfängt. Die Entscheidung steckt in genau '
      + 'dieser Klammer: Ohne sie beantwortet Apache eine Direktive für ein fehlendes Modul '
      + 'mit 500 für die ganze Seite — gemessen am 11. September. Nähme jemand Gate 36 '
      + 'zurück, stünde die `.htaccess` wieder bei ihrer einen Zeile.',
  }),
  Object.freeze({
    gate: 35,
    datei: 'shop/bestellung.php',
    muster: /HOECHSTENJEFENSTER/,
    warum: 'Das Empfangsskript nimmt nur von der eigenen Seite an und höchstens fünf '
      + 'Bestellungen je Minute. Die Entscheidung steckt in dieser Konstante und den beiden '
      + 'Kopfzeilenprüfungen daneben: Ohne sie nimmt das Skript von jedermann beliebig oft '
      + 'entgegen — gemessen am 11. September mit dreißig angenommenen Bestellungen '
      + 'hintereinander. Nähme jemand Gate 35 zurück, verschwände die Zählung aus derselben '
      + 'Lesung, die die laufende Nummer vergibt.',
  }),
  Object.freeze({
    gate: 34,
    datei: 'shop/src/shopkern.js',
    muster: /export\s+const\s+HOECHSTMENGE/,
    warum: 'Die Höchstmenge je Korbzeile ist eine Grenze der Selbstbedienung und keine der '
      + 'Ware. Die Entscheidung steckt darin, dass sie **eine benannte Zahl mit Begründung** '
      + 'ist und kein Literal: Vorher stand 999 an fünf Stellen ohne Grund, und die Oberfläche '
      + 'kürzte den Wunsch stillschweigend. Nähme jemand Gate 34 zurück, verschwände die '
      + 'Konstante und mit ihr der Satz, den der Knopf sagt, wenn gekürzt wurde.',
  }),
  Object.freeze({
    gate: 33,
    datei: 'shop/src/rechtsgrund.js',
    muster: /belegt: false/,
    warum: 'Die Ziffern bleiben stehen und tragen den fehlenden Beleg daneben. Die '
      + 'Entscheidung steckt in diesem Feld: Jede Fundstelle sagt von sich, dass sie nicht '
      + 'am Volltext geprüft ist. Wäre Gate 33 anders ausgefallen, stünden hier keine '
      + 'Ziffern, sondern nur Paragraphen — und das Feld gäbe es nicht.',
  }),
  Object.freeze({
    gate: 32,
    datei: 'shop/bin/zahlwege.mjs',
    muster: /Diese Liste ist älter/,
    warum: 'Die Anforderungsliste warnt und entscheidet nicht. Die Entscheidung steckt in '
      + 'diesem Werkzeug: Es rechnet die Tafel und nennt danach die Wege, bei denen die '
      + 'Liste dem entschiedenen Gate 21 widerspricht — statt sie als untauglich zu '
      + 'melden. Nähme jemand Gate 32 zurück, müsste hier eine Sperre stehen und das '
      + 'Werkzeug mit Ausgang 1 enden; der Satz verschwände.',
  }),
  Object.freeze({
    gate: 31,
    datei: 'shop/src/systemtreue.js',
    muster: /export\s+function\s+systembruch/,
    warum: 'Bei Systemtreue wird gewarnt und nicht gesperrt. Die Entscheidung steckt in '
      + 'dieser Funktion: Sie gibt einen Befund zurück, den die Kasse als Satz weiterreicht, '
      + 'und keine Sperre. Wäre sie eine Sperre, hätte der Shop entschieden, was der Kunde '
      + 'vorhat — und welche Zusammenstellung geprüft ist, steht in den Systemunterlagen des '
      + 'Herstellers und nicht bei uns.',
  }),
  Object.freeze({
    gate: 7,
    datei: 'shop/src/kunde.js',
    muster: /export\s+function\s+uidPruefzifferStimmt/,
    warum: 'Verkauf ausschließlich an Unternehmer — die Auflage lautet: Firmendaten, UID, '
      + 'Nettopreise, Unternehmerbestätigung. Prüfbar ist davon die UID: Ohne die '
      + 'Prüfziffernrechnung nimmt der Shop jede getippte Zeichenkette als Unternehmerbeleg.',
  }),
  Object.freeze({
    gate: 12,
    datei: 'shop/src/gebiet.js',
    muster: /export\s+function\s+vorsorgeauskunft/,
    warum: 'Beide Modelle sind gleichrangig. Das ist die einzige Gate-Entscheidung, deren '
      + 'Spur das **Dasein** eines Moduls ist: Solange Gate 12 gilt, darf der Radonzweig '
      + 'nicht stillschweigend abgeräumt werden, weil gerade das andere gebaut wird.',
  }),
  Object.freeze({
    gate: 19,
    datei: 'shop/src/shopkern.js',
    muster: /UST_SATZ_KUNDE = 0\.2/,
    warum: 'Regelbesteuerung von Anfang an, keine Kleinunternehmerregelung. Ein '
      + 'Kleinunternehmer weist keine Umsatzsteuer aus; der ausgewiesene Satz von 20 % ist '
      + 'die Stelle, an der diese Entscheidung im Kundenbeleg ankommt.',
  }),
  Object.freeze({
    gate: 20,
    datei: 'shop/src/bestellung.js',
    muster: /export\s+function\s+darfAutomatischAusgeloestWerden/,
    warum: 'Keine Bestellung ohne positiven Deckungsbeitrag. Das Gate prüft Euro, nicht '
      + 'Prozent, und tut es in dieser Funktion — fällt sie weg, löst der Shop auch aus, '
      + 'was ihn Geld kostet.',
  }),
  Object.freeze({
    gate: 21,
    datei: 'shop/src/zahlung.js',
    muster: /zahlungszielTraegt/,
    warum: 'Das Zahlungsziel des Kunden darf die Skontofrist des Lieferanten nicht '
      + 'überschreiten. Ohne diese Rechnung ist die offene Rechnung wieder ein Zahlweg wie '
      + 'jeder andere — und sie ist der einzige, der das Skonto vollständig verliert.',
  }),
  Object.freeze({
    gate: 22,
    datei: 'shop/bin/kampagne.mjs',
    muster: /beipack/i,
    warum: 'Was die Zielmarge über den Listenpreis hebt, ist Beipack: bestellbar, aber ohne '
      + 'Keyword und ohne Anzeige. Die Entscheidung wirkt dort, wo Geld ausgegeben wird — '
      + 'ohne sie bewirbt die Kampagne Artikel, bei denen es keinen Vorteil zu bewerben gibt.',
  }),
  Object.freeze({
    gate: 23,
    datei: 'shop/src/liefergebiet.js',
    muster: /bezirk/i,
    warum: 'Keine Annahme außerhalb des Liefergebiets. Die Weisung war bis zum 26. August an '
      + 'genau einer Stelle umgesetzt — als Zeichenkette in einer Anzeigenzeile. Ein '
      + 'Zielgebiet hält keine Bestellung auf; der Bezirk wird gefragt.',
  }),
  Object.freeze({
    gate: 24,
    datei: 'shop/src/baustoffkatalog.js',
    muster: /auf Anfrage/,
    warum: 'Kein Artikel, dessen Einkaufspreis nur auf Anfrage zu haben ist. Was der Shop '
      + 'nicht rechnen kann, kann er nicht anbieten — die Stelle, die solche Positionen aus '
      + 'dem Katalog hält, nennt den Grund im Klartext.',
  }),
  Object.freeze({
    gate: 25,
    datei: 'shop/src/shopkern.js',
    muster: /export\s+function\s+mindestbestellwertKunde/,
    warum: 'Mindestbestellwert 250 € netto je Lieferung, und die Grenze steht in der Kasse, '
      + 'nicht bei der Auslösung. Genau das ist der Unterschied, den das Gate festhält: Eine '
      + 'Sperre, die erst nach dem Ja des Kunden greift, ist keine.',
  }),
  Object.freeze({
    gate: 26,
    datei: 'shop/bestellung.php',
    muster: /\$/,
    warum: 'Der Bestellweg läuft über ein eigenes Empfangsskript auf dem Hosting des '
      + 'Auftraggebers. Das Gate ist die Datei selbst — ohne sie hat das Formular der Kasse '
      + 'kein Gegenüber, und der Shop nimmt wieder nichts entgegen.',
  }),
  Object.freeze({
    gate: 27,
    datei: 'shop/bin/gesamtlauf.mjs',
    muster: /BROWSERPRUEFER/,
    warum: 'Die Browserproben laufen im Regellauf mit. Sie standen bis zum 5. September '
      + 'daneben, und drei Szenarien waren sechs Stunden rot, ohne dass ein Lauf es meldete. '
      + 'Fällt der Bezug hier weg, endet der Lauf wieder mit „alles grün" über zwanzig von '
      + 'vierundzwanzig Schritten.',
  }),
  Object.freeze({
    gate: 30,
    datei: 'shop/src/preis.js',
    muster: /ekQuelle !== 'rekonstruiert'/,
    warum: 'Ein zurückgerechneter Einkaufspreis ist kein Platzhalter. Diese eine Bedingung '
      + 'ist die ganze Entscheidung — fällt sie weg, schreibt der Shop dem Kunden auf 46 '
      + 'Artikelseiten hin, sein Preis sei erfunden, obwohl er auf den Cent stimmt.',
  }),
  Object.freeze({
    gate: 29,
    datei: 'shop/src/preisdeckung.js',
    muster: /export\s+function\s+preisdeckungsbefund/,
    warum: 'Ein Keyword, dessen eigene Trefferliste einen Artikel mit überaltertem '
      + 'Einkaufspreis enthält, wird zurückgestellt. Diese Funktion ist die Stelle, an der '
      + 'das entschieden wird — fällt sie weg, bietet die Kampagne wieder auf ein Wort, das '
      + 'auf eine Marge zeigt, die niemand bestätigt hat.',
  }),
  Object.freeze({
    gate: 28,
    datei: 'shop/src/abholung.js',
    muster: /export\s+const\s+ZUSAGE/,
    warum: 'Abholung wird nicht zugesagt, solange der Lieferant sie nicht bestätigt hat. '
      + 'Fünf Stellen sagten sie zu; dieses Muster ist es, das sie wiederfindet, wenn eine '
      + 'sechste dazukommt.',
  }),
]);

/**
 * Gates ohne Spur im Bestand — mit dem Grund, warum das in Ordnung ist.
 *
 * Gruppiert nach Abschnitt des Registers, weil der Grund je Abschnitt derselbe
 * ist: Es ist der Zweig, dem das Gate gehört.
 */
export const OHNE_SPUR = Object.freeze([
  Object.freeze({
    gates: Object.freeze([1, 2, 6]),
    warum: 'Die Lieferantenseite des **Radonmodells**: Mindestmarge, vier Bedingungen an '
      + 'jeden Lieferanten, strukturierte Produktdaten eines Kernlieferanten. Der '
      + 'Baustoffzweig kauft bei einem bestehenden Lieferanten auf eigene Belege, und Gate 20 '
      + 'ist an die Stelle von Gate 1 getreten — das steht im Register an Gate 20 selbst. '
      + 'Nichts davon berührt eine Zeile des gebauten Shops.',
  }),
  Object.freeze({
    gates: Object.freeze([3, 4, 17, 18]),
    warum: 'Verfahrensentscheidungen: Auflagen vor der ersten Ausgabe, Zeitpunkt der '
      + 'Modellwahl, Auswertungsregel der beiden Prüfungen, Schließung der Analysephase. Sie '
      + 'steuern, **wie** gearbeitet wird, nicht was das Erzeugnis tut. Eine Spur im Code '
      + 'hätten sie nur als Kommentar, und ein Kommentar ist keine Prüfung.',
  }),
  Object.freeze({
    gates: Object.freeze([5, 8, 11]),
    warum: 'Das **Shopmodell des Radonzweigs**: radonspezifisches Sortiment, zwölf '
      + 'Herstelleranfragen, Gebietsabfrage auf Gemeindeebene aus Anlage 1 der '
      + 'Radonschutzverordnung. Nach Gate 12 gleichrangig, aber nicht gebaut — gebaut ist der '
      + 'Baustoffhandel, und der hat seine eigene Gebietsfrage in Gate 23.',
  }),
  Object.freeze({
    gates: Object.freeze([9, 10, 13, 14, 15, 16]),
    warum: 'Das **Leadmodell**: Erlösform, Erfassungszeitpunkt, Gebietseinheit, '
      + 'Mengenplanung, unbelegte Lead-Quote, Franchisedichte. Es ist nach Gate 12 '
      + 'gleichrangig und in keiner Zeile gebaut. Fällt die Entscheidung später auf dieses '
      + 'Modell, entstehen die Spuren mit ihm — heute wären sie erfunden.',
  }),
]);

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const GRUND_MINDESTLAENGE = 120;

/**
 * Hält das Gate-Register gegen den Bestand — in beide Richtungen.
 *
 * @param {object} eingabe
 * @param {{nr: number}[]} eingabe.gates  aus `gatesAusRegister`
 * @param {(datei: string) => string|null} eingabe.lies
 */
export function gatebefund({ gates, lies, spuren = SPUREN, ohneSpur = OHNE_SPUR }) {
  const meldungen = [];
  const imRegister = new Set(gates.map((g) => g.nr));
  const mitSpur = new Set(spuren.map((s) => s.gate));
  const ohne = new Set(ohneSpur.flatMap((o) => o.gates));

  for (const g of gates) {
    if (!mitSpur.has(g.nr) && !ohne.has(g.nr)) {
      meldungen.push({
        regel: 'gate-ohne-eintrag',
        gate: g.nr,
        text: `Gate ${g.nr} steht im Register und in keiner der beiden Listen — es ist weder `
          + 'im Bestand nachgewiesen noch ist gesagt, warum nicht',
      });
    }
    if (mitSpur.has(g.nr) && ohne.has(g.nr)) {
      meldungen.push({ regel: 'gate-doppelt', gate: g.nr, text: `Gate ${g.nr} steht in beiden Listen` });
    }
  }

  for (const nr of [...mitSpur, ...ohne].sort((a, b) => a - b)) {
    if (!imRegister.has(nr)) {
      meldungen.push({
        regel: 'eintrag-ohne-gate',
        gate: nr,
        text: `Gate ${nr} ist geführt, steht aber nicht im Register — der Eintrag beschreibt `
          + 'eine Entscheidung, die es nicht (mehr) gibt',
      });
    }
  }

  for (const s of spuren) {
    if (s.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({ regel: 'grund-zu-kurz', gate: s.gate, text: `Gate ${s.gate}: der Grund ist zu knapp` });
    }
    const text = lies(s.datei);
    if (text === null) {
      meldungen.push({
        regel: 'spur-fehlt',
        gate: s.gate,
        text: `Gate ${s.gate}: ${s.datei} gibt es nicht mehr`,
      });
      continue;
    }
    if (!s.muster.test(text)) {
      meldungen.push({
        regel: 'spur-passt-nicht',
        gate: s.gate,
        text: `Gate ${s.gate}: ${s.datei} trägt ${s.muster} nicht mehr — die Entscheidung steht `
          + 'nur noch im Register',
      });
    }
  }

  for (const o of ohneSpur) {
    if (o.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({
        regel: 'grund-zu-kurz',
        gate: o.gates[0],
        text: `Gates ${o.gates.join(', ')}: der Grund ist zu knapp`,
      });
    }
  }

  return {
    gates: gates.length,
    mitSpur: mitSpur.size,
    ohneSpur: ohne.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Stimmt, was das Gate-Register über sich selbst sagt?
 *
 * **Der Anlass, 9. September 2026.** Die dritte Zeile von `gate-register.md`
 * lautete „Stand: 2026-08-27. **Maßgeblich für alle Gate-Fragen.**
 * Vierundzwanzig Entscheidungen sind über die Phasen verteilt gefallen." —
 * und siebenunddreißig Zeilen tiefer stand die Überschrift „Die einunddreißig
 * Gates". Dasselbe Dokument, sieben Gates Unterschied, zwölf Tage.
 *
 * Es ist die Datei, auf die die PR-Beschreibung mit „Bei Gate-Fragen gilt"
 * zeigt. Wer sie öffnet und nach drei Zeilen weiß, was er wissen wollte, geht
 * mit der falschen Zahl.
 *
 * > **Ein Dokument, das „maßgeblich" von sich sagt, wird oben gelesen und
 * > nicht ganz.**
 *
 * Der Prüfer zählt die Gates ohnehin — `gatesAusRegister` liest die Tabelle.
 * Er hielt seine Zahl nur nie gegen die, die das Dokument über sich druckt.
 * Genau derselbe Schnitt wie bei `src/statuskopf.js` am 5. September, eine
 * Datei weiter: **die Aussagen eines Dokuments über genau das, was der Prüfer
 * ohnehin misst, sind ohne jedes Textverständnis prüfbar.**
 *
 * Geprüft werden drei Angaben und keine vierte:
 *
 * | Angabe | Gemessen an |
 * |---|---|
 * | das Zahlwort im Kopf | den gezählten Gates |
 * | die Zahl in der Überschrift „Die N Gates" | den gezählten Gates |
 * | `Stand: JJJJ-MM-TT` im Kopf | dem jüngsten Datum, das das Dokument selbst nennt |
 *
 * Das Datum wird **gegen den eigenen Inhalt** gemessen und nicht gegen den
 * Kalender: Ein Register darf alt sein, solange nichts dazukam. Falsch wird
 * es, wenn es selbst von etwas Späterem erzählt.
 */
export const KOPFZEILEN = 6;

/** `Stand: 2026-08-27` — die Form, in der der Kopf sein Datum trägt. */
export const KOPFSTAND = /^Stand:\s*(\d{4})-(\d{2})-(\d{2})\./m;

/** `Vierundzwanzig Entscheidungen` — das Zahlwort, das der Kopf über sich setzt. */
export const KOPFZAHL = /([A-Za-zÄÖÜäöüß]+)\s+Entscheidungen/;

/** `## Die einunddreißig Gates` — dieselbe Aussage als Überschrift. */
export const UEBERSCHRIFT = /^## Die ([A-Za-zÄÖÜäöüß]+) Gates\s*$/m;

const MONATE = Object.freeze({
  Januar: 1, Februar: 2, März: 3, April: 4, Mai: 5, Juni: 6,
  Juli: 7, August: 8, September: 9, Oktober: 10, November: 11, Dezember: 12,
});

/**
 * Das jüngste Datum, das der Text ausgeschrieben nennt — `JJJJ-MM-TT` oder ''.
 *
 * Das Jahr steht in diesen Sätzen fast nie dabei („Nachgetragen am 26.
 * August"), deshalb kommt es aus dem Kopfdatum. Das ist keine Schwäche,
 * sondern der Sinn: Verglichen wird ein Datum mit Daten aus **demselben**
 * Dokumentjahr.
 */
export function juengstesDatum(text, jahr) {
  if (!jahr) return '';
  let best = '';
  const muster = /(\d{1,2})\.\s+(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/g;
  for (const t of String(text ?? '').matchAll(muster)) {
    const tag = Number(t[1]);
    const monat = MONATE[t[2]];
    if (!monat || tag < 1 || tag > 31) continue;
    const d = `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
    if (d > best) best = d;
  }
  return best;
}

/**
 * Der Befund über den Kopf des Gate-Registers.
 *
 * @param {object} eingabe
 * @param {string} eingabe.text   der volle Text von `gate-register.md`
 * @param {number} eingabe.gates  wie viele Gates in der Tabelle stehen
 */
export function registerkopfbefund({ text, gates }) {
  const meldungen = [];
  const voll = String(text ?? '');
  const kopf = voll.split('\n').slice(0, KOPFZEILEN).join('\n');

  // **Ein Abgleich über null Gates ist kein Befund** — dieselbe Regel wie in
  // `kopfbefund`: „nichts gefunden" und „nicht hingesehen" dürfen nicht gleich
  // aussehen.
  if (!Number.isInteger(gates) || gates <= 0) {
    return {
      meldungen: [{
        regel: 'nichts-gezaehlt',
        text: 'ohne gezählte Gates ist der Kopf mit nichts vergleichbar',
      }],
      sauber: false,
    };
  }

  const kopftreffer = kopf.match(KOPFZAHL);
  const genannt = kopftreffer ? wortzahl(kopftreffer[1]) : null;
  if (genannt === null) {
    meldungen.push({
      regel: 'kopf-ohne-zahl',
      text: `der Kopf (erste ${KOPFZEILEN} Zeilen) nennt keine lesbare Zahl der Form `
        + '„<Zahlwort> Entscheidungen"',
    });
  } else if (genannt !== gates) {
    meldungen.push({
      regel: 'kopfzahl-abgeloest',
      text: `der Kopf nennt ${genannt} Entscheidungen, gezählt sind ${gates} Gates`,
    });
  }

  const uebertreffer = voll.match(UEBERSCHRIFT);
  const inUeberschrift = uebertreffer ? wortzahl(uebertreffer[1]) : null;
  if (inUeberschrift === null) {
    meldungen.push({
      regel: 'ueberschrift-ohne-zahl',
      text: 'die Überschrift der Form „## Die <Zahlwort> Gates" fehlt oder ist nicht lesbar',
    });
  } else if (inUeberschrift !== gates) {
    meldungen.push({
      regel: 'ueberschrift-abgeloest',
      text: `die Überschrift sagt ${inUeberschrift} Gates, gezählt sind ${gates}`,
    });
  }

  const standtreffer = kopf.match(KOPFSTAND);
  if (!standtreffer) {
    meldungen.push({
      regel: 'kopf-ohne-stand',
      text: `der Kopf (erste ${KOPFZEILEN} Zeilen) nennt kein Datum der Form „Stand: JJJJ-MM-TT."`,
    });
  } else {
    const stand = `${standtreffer[1]}-${standtreffer[2]}-${standtreffer[3]}`;
    const juengstes = juengstesDatum(voll.split('\n').slice(KOPFZEILEN).join('\n'), standtreffer[1]);
    if (!juengstes) {
      // **Nicht messbar ist nicht grün.**
      meldungen.push({
        regel: 'stand-nicht-messbar',
        text: `der Kopf sagt „Stand: ${stand}", und das Dokument nennt kein einziges `
          + 'ausgeschriebenes Datum, gegen das sich das halten ließe',
      });
    } else if (stand < juengstes) {
      meldungen.push({
        regel: 'stand-aelter-als-der-inhalt',
        text: `der Kopf sagt „Stand: ${stand}", das Dokument erzählt selbst vom ${juengstes}`,
      });
    }
  }

  return { meldungen, sauber: meldungen.length === 0 };
}
