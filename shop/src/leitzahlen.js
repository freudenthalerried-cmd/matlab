/**
 * Die Leitzahlen — jene Werte, die in mehr als einem Dokument stehen.
 *
 * **Warum es diese Datei gibt.** Am 1. September stellte sich heraus, dass der
 * nötige Monatsumsatz seit vier Tagen mit **45.356 €** in der Akte stand: der
 * Kartenzahl vom 25. August, zwei Tage älter als Gate 21, das EPS entschied.
 * Gefunden hat es keine Prüfung, sondern ein Zufall — die Kennzahlenseite
 * rechnete dieselbe Größe neu und kam auf 43.396 €.
 *
 * Nach der Berichtigung stand die alte Zahl immer noch an **achtundzwanzig
 * Stellen**. Die meisten davon zu Recht: `marge-25-prozent.md` rechnet
 * ausdrücklich mit Karte, das Gate-Register erzählt die Entscheidung, das
 * Widerrufsregister führt sie als abgelöste Behauptung. Aber ohne Werkzeug
 * lässt sich das eine nicht vom anderen trennen.
 *
 * > **Eine Zahl, die in acht Dokumenten steht, wird in keinem gepflegt.**
 *
 * Die Regel ist deshalb dieselbe wie im Widerrufsregister und nicht strenger:
 * Eine überholte Zahl darf stehen — **wenn ihre Bedingung danebensteht.**
 * „45.356 € (Karte)" ist richtig. „45.356 €" allein ist es nicht mehr.
 *
 * Was hier **nicht** steht: jede Zahl der Akte. Ein Prüfer, der jede Ziffer
 * als Behauptung liest, meldet jede Artikelnummer. Aufgenommen wird eine Zahl
 * erst, wenn sie **gerechnet** ist, in **mehr als einem Dokument** steht und
 * eine **Entscheidung trägt**.
 */

import { noetigerUmsatz } from './kostenbild.js';
import { quoteAmMarktboden } from './werbewirkung.js';
import { WIDERRUFSMERKMAL, sichtfeld, SICHTWEITE } from './widerruf.js';

/**
 * Die Register-Einträge.
 *
 * `jetzt(ziel, umfeld)` rechnet den heute gültigen Wert — nie eine eingetragene Zahl,
 * wobei `umfeld` trägt, was nicht aus den Zielgrößen folgt (die Zahl der
 * Begriffe etwa steht in der erzeugten Messliste und nirgends sonst),
 * sonst hätte das Register dasselbe Problem wie die Dokumente.
 * `abgeloest` sind die Werte, die einmal gegolten haben, jeder mit dem Grund
 * **und seiner eigenen `bedingung`**.
 *
 * **Die Bedingung gehört an den abgelösten Wert, nicht an die Leitzahl.** Der
 * erste Anlauf hatte eine gemeinsame, weite Fassung — `karte|skonto|20 %|alte|
 * damals|stand|seit dem` — und deckte damit 102 von 103 Fundstellen. Eine
 * Ausnahme, die fast alles trifft, ist keine Ausnahme.
 *
 * > **Ein Prüfer, dessen Freibrief überall gilt, meldet grün und hat nichts
 * > angesehen.**
 *
 * Jetzt rechtfertigt nur das Wort die Zahl, das sie tatsächlich erklärt:
 * „Karte" die 45.356, „Zuschlag" die 72.740, „Skonto" die 38.786. Dazu die
 * Berichtigungsmerkmale aus dem Widerrufsregister — ein „berichtigt am" deckt
 * jede abgelöste Zahl, weil es genau das sagt.
 */
export const LEITZAHLEN = Object.freeze([
  Object.freeze({
    id: 'noetiger-monatsumsatz',
    einheit: 'euro',
    name: 'Nötiger Monatsumsatz',
    traegt: 'Die ganze Wirtschaftlichkeitsrechnung — aus ihr folgen Bestellzahl, '
      + 'Werbebudget und leistbarer Klickpreis.',
    jetzt: (ziel) => Math.round(noetigerUmsatz(ziel, ziel.zahlweg).umsatzNetto),
    // Die Lesart „25 % Zuschlag" ist am 26.08. **zurückgenommen** worden: Der
    // Auftraggeber hat „25 %" als Marge vom Verkauf geklärt (`marge-25-prozent.md`).
    // Sie steht unten nur als Grund für eine abgelöste Zahl.
    abgeloest: Object.freeze([
      Object.freeze({ wert: 45356, weil: 'Zahlweg Kreditkarte, gerechnet am 25.08.', bedingung: /karte|stripe/i }),
      Object.freeze({ wert: 72740, weil: '20 % Rohmarge — die Lesart „25 % Zuschlag" vor dem 25.08.', bedingung: /20 %|zuschlag/i }),
      Object.freeze({ wert: 38786, weil: 'Karte mit 3 % Skonto', bedingung: /karte|skonto/i }),
    ]),
  }),
  Object.freeze({
    id: 'bestellungen-je-monat',
    // Stückzahlen tragen kein Einheitszeichen hinter der Ziffer.
    // `null` heißt hier nicht „vergessen", sondern „nackt im Satz".
    einheit: null,
    name: 'Bestellungen im Monat',
    traegt: 'Die Zahl, die der Betrieb von Hand schaffen muss, solange keine '
      + 'Schnittstelle da ist.',
    jetzt: (ziel) => noetigerUmsatz(ziel, ziel.zahlweg).bestellungen,
    abgeloest: Object.freeze([
      Object.freeze({ wert: 70, weil: 'Zahlweg Kreditkarte', bedingung: /karte|stripe/i }),
      Object.freeze({ wert: 112, weil: '20 % Rohmarge', bedingung: /20 %|zuschlag/i }),
    ]),
    // Bestellzahlen sind kleine Zahlen und stehen überall; ohne enge Fassung
    // meldet der Prüfer Seitenzahlen und Artikelmengen. Deshalb nur, wo das
    // Wort „Bestellungen" in derselben Zeile steht — siehe `zeilenmuster`.
    zeilenmuster: /Bestellungen/i,
  }),
  Object.freeze({
    id: 'keyword-anzahl',
    // Stückzahlen tragen kein Einheitszeichen hinter der Ziffer.
    // `null` heißt hier nicht „vergessen", sondern „nackt im Satz".
    einheit: null,
    name: 'Begriffe der Messliste',
    traegt: 'Was der Auftraggeber im Keyword-Planer eintippt, und woran der '
      + 'Bedarf von 2.500 bis 6.700 Suchanfragen je Monat hängt.',
    // **Warum diese Zahl hier steht.** Am 1. September ist „Kaminkopf
    // Regenhaube" aus der Kampagne genommen worden — die Kaminkopfverkleidung
    // führt der Shop nicht, und ein Suchwort ist kein Werbeversprechen. Aus 33
    // wurden 32. Die neue Zahl stand danach in **einer** Datei, die alte in
    // **elf**: zwei Quelltexten und neun Dokumenten. Genau der Fall, für den
    // dieses Register gebaut ist — und die Zahl stand nicht darin.
    jetzt: (ziel, umfeld) => umfeld?.keywordAnzahl ?? null,
    abgeloest: Object.freeze([
      Object.freeze({
        wert: 33,
        weil: 'vor dem 01.09., als „Kaminkopf Regenhaube" noch in der Kampagne stand',
        // Eng gefasst: „1. September" und „zurückgenommen" stehen in dieser Akte
        // auf zu vielen Zeilen. Eine Bedingung, die überall zutrifft, deckt alles
        // und prüft nichts — beim ersten Lauf blieb genau deshalb eine Fundstelle
        // in STATUS.md unbemerkt.
        bedingung: /Kaminkopf|erste[nrs]? An(?:lauf|zeigenanlauf)|01\.09\./i,
      }),
    ]),
    // Kleine Zahlen stehen überall. Ohne diese Fassung meldet der Prüfer jede
    // Seitenzahl und jede Artikelmenge — dieselbe Vorsicht wie bei den
    // Bestellungen.
    zeilenmuster: /Keyword|Begriff|Suchbegriff|Suchwort/i,
  }),
  Object.freeze({
    // **Aufgenommen am 3. September 2026.** Sie erfüllt alle drei Bedingungen
    // dieses Registers, und zwar deutlicher als jede andere: Sie ist
    // **gerechnet** (aus Etappen, Budget, Klickpreis und Abbruchschwelle), sie
    // steht in **sechs** Dokumenten, und sie trägt die Entscheidung, um die es
    // in diesem Vorhaben geht — passt der Versuch in die Frist von 90 Tagen?
    //
    // Der Anlass: Am selben Tag ist eine zwölfte Etappe dazugekommen, und die
    // Kette wuchs von 57 auf 60 Tage. „57 Tage" stand danach in sechs Dateien,
    // die neue Zahl in einer.
    //
    // Die Seitenzahl ist heute früh am dritten Kriterium gescheitert und
    // **nicht** aufgenommen worden (`register-mit-eigenem-stand.md`). Diese
    // hier scheitert an keinem.
    id: 'plan-gesamtdauer',
    einheit: 'tage',
    name: 'Kette bis zur Entscheidung',
    traegt: 'Ob der Versuch in die Frist von 90 Tagen passt — die Frage, an der '
      + 'das ganze Vorhaben hängt.',
    jetzt: (ziel, umfeld) => umfeld?.planTage ?? null,
    abgeloest: Object.freeze([
      Object.freeze({
        wert: 57,
        weil: 'Vor der Etappe „Search Console einrichten und Indexierung bestätigen", '
          + 'die am 3.9. zwischen Upload und Schalten eingefügt wurde.',
        // **Eng gefasst, und der erste Anlauf war es nicht.** Er enthielt
        // `damals|zuvor|inzwischen` — Wörter, die in dieser Akte auf jeder
        // zweiten Seite stehen. Der Testfall „eine Bedingung, die überall
        // gilt, ist keine" hat ihn sofort gemeldet. Gedeckt ist die alte Zahl
        // jetzt nur dort, wo **benannt** ist, was sie abgelöst hat: die
        // Indexierungsetappe, ihr Datum, oder die neue Zahl daneben.
        bedingung: /Search Console|Indexierung|02\.09|2\. September|60 Tage/i,
      }),
    ]),
    // Ohne enge Fassung meldet der Prüfer jede 57 und jede 60 im Bestand.
    // Gesucht wird nur, wo von Tagen oder der Kette die Rede ist.
    zeilenmuster: /Tag|Kette|Frist/i,
    ohneLeitdokument: Object.freeze([
      Object.freeze({
        dokument: 'docs/baustoff-shop/PARAMETER.md',
        warum: 'Diese Datei führt die Weisungen und Parameter des Auftraggebers. Die Länge der '
          + 'Kette ist keine Weisung, sondern ein Ergebnis — sie folgt aus Etappen, Budget und '
          + 'Abbruchschwelle und ändert sich, sobald eine Etappe dazukommt. Sie dort zu '
          + 'verlangen hieße, ein Leitdokument mit einer Zahl zu füllen, die es nicht setzt.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'quote-am-marktboden',
    einheit: 'prozent',
    name: 'Kaufquote am Marktboden',
    traegt: 'Darunter trägt das Modell nicht einmal den billigsten Marktklick — '
      + 'das erste der drei größten Risiken.',
    jetzt: (ziel) => {
      const u = noetigerUmsatz(ziel, ziel.zahlweg);
      const q = quoteAmMarktboden({
        werbebudgetJeMonat: u.umsatzNetto * ziel.werbeanteil,
        bestellungen: u.bestellungen,
        marktUnten: 0.5,
      });
      return Number((q * 100).toFixed(2));
    },
    // Noch nie abgelöst — der Eintrag steht trotzdem, damit die Zahl gezählt
    // und mitgerechnet wird, bevor sie es wird. Ein Register, in das man erst
    // nach dem Schaden einträgt, ist eine Chronik.
    abgeloest: Object.freeze([]),
    zeilenmuster: /quote|klick/i,
  }),
]);

/** Wie eine Zahl in deutschem Fließtext aussehen kann. */
export function schreibweisen(wert) {
  const ganz = Math.round(wert);
  const formen = new Set();
  formen.add(String(ganz));
  formen.add(ganz.toLocaleString('de-AT').replace(/ /g, '.'));
  formen.add(ganz.toLocaleString('de-DE'));
  if (!Number.isInteger(wert)) formen.add(String(wert).replace('.', ','));
  return [...formen];
}

const entwerte = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Sucht eine Zahl in einem Text und sagt je Fundstelle, ob ihre Bedingung
 * in Sichtweite steht.
 *
 * @param {string} text
 * @param {number} wert
 * @param {{bedingung: RegExp, zeilenmuster?: RegExp, sichtweite?: number}} opt
 */
/**
 * Steht die Zahl in einer Spanne statt als Behauptung?
 *
 * „zwischen 60 und 70 Bestellungen" nennt keine Leitzahl, es umreißt eine
 * Größenordnung. Der erste Lauf hat genau diesen Satz gemeldet — die einzige
 * Meldung, und sie war falsch. Eine Spanne ist keine Angabe.
 */
export function inSpanne(zeile, form) {
  const z = entwerte(form);
  return new RegExp(`(zwischen\\s+[\\d.,]+\\s+und\\s+${z}|${z}\\s+(?:bis|–|—|-)\\s*[\\d.,]|[\\d.,]+\\s*(?:bis|–|—)\\s*${z})`, 'i').test(zeile);
}

/**
 * Die Zeichen, an denen eine Zahl ihre Einheit trägt.
 *
 * **Der Anlass, 4. September 2026.** In `STATUS.md` stand der Satz „hob den
 * gemeinsamen Anteil von **57** auf 62 %" — ein Prozentwert aus der
 * Dublettenmessung. Der Prüfer meldete ihn als abgelöste **Tageszahl** des
 * Rolloutplans und verlangte ihre Bedingung.
 *
 * > **Ein Prüfer, der eine Prozentzahl für eine Tageszahl hält, wird beim
 * > dritten Fehlalarm abgeschaltet** — und dann findet er auch den echten
 * > nicht mehr. Dieselbe Lehre wie beim Geheimnisprüfer, der `3,68` mitten in
 * > `153,68 €` fand.
 *
 * Die Prüfung ist bewusst schmal: Sie sieht nur, was **unmittelbar** hinter
 * der Zahl steht. Eine Zahl ohne Einheitszeichen bleibt verdächtig — das ist
 * die sichere Richtung, denn Leitzahlen stehen in dieser Akte oft nackt im
 * Fließtext.
 */
export const EINHEITSZEICHEN = Object.freeze({
  prozent: /^\s*(?:%|Prozent\b)/i,
  euro: /^\s*(?:€|EUR\b|Euro\b)/i,
  tage: /^\s*(?:Tage?n?\b|T\b|Werktage?n?\b)/i,
});

/**
 * Wörter, die etwas **anderes** zählen als jede geführte Leitzahl.
 *
 * **Der Anlass, 5. September 2026.** Seit die Gegenproben 57 und die Prüfer 33
 * zählen, kollidieren zwei Bestandszahlen mit zwei abgelösten Leitzahlen:
 * `plan-gesamtdauer` (60 Tage; 57 galt vor der Etappe „Search Console") und
 * `keyword-anzahl` (32 Begriffe; 33 galt vor dem 1. September, als „Kaminkopf
 * Regenhaube" noch in der Kampagne stand).
 * „57 Gegenproben für 33 Prüfer" ist eine gemeldete Fundstelle — und es
 * gibt keinen vernünftigen Satz, der die Bedingung einer Kettenlänge neben
 * eine Anzahl von Gegenproben schreibt.
 *
 * > **Ein Prüfer, der beim dritten Fehlalarm abgeschaltet wird, findet den
 * > echten nicht mehr.** Derselbe Satz wie am 4. September, als eine
 * > Prozentzahl für eine Tageszahl gehalten wurde — und dieselbe Antwort:
 * > nicht die Regel lockern, sondern die Einheit lesen.
 *
 * Was hier stehen darf, muss **eindeutig etwas anderes** zählen als jede
 * geführte Leitzahl. `Begriffe` steht deshalb ausdrücklich **nicht** hier:
 * Genau das zählt `keyword-anzahl`.
 */
export const ZAEHLWOERTER = Object.freeze([
  'Gegenproben', 'Prüfer', 'Testfälle', 'Testfällen', 'Artikel', 'Seiten', 'Dateien',
  'Fundstellen', 'Schritte', 'Schritten', 'Punkte', 'Punkten', 'Szenarien', 'Einträge',
  'Zeilen', 'Kennzahlen', 'Gates', 'Etappen', 'Werkzeuge', 'Sperren', 'Ausnahmen',
]);

const ZAEHLWORTMUSTER = new RegExp(`^\\s*(?:${ZAEHLWOERTER.join('|')})\\b`);

/**
 * Trägt die Fundstelle eine **andere** Einheit als die Leitzahl?
 *
 * Zwei Wege: ein fremdes Einheitszeichen (€, %, Tage) — oder ein Zählwort,
 * das eindeutig etwas anderes zählt.
 *
 * @param {string} zeile
 * @param {number} stelle  Position hinter der gefundenen Zahl
 * @param {string|null} eigene  Schlüssel aus `EINHEITSZEICHEN`, oder null
 */
export function fremdeEinheit(zeile, stelle, eigene) {
  const rest = zeile.slice(stelle);
  for (const [name, muster] of Object.entries(EINHEITSZEICHEN)) {
    if (muster.test(rest)) return name !== eigene ? name : null;
  }
  const zaehlwort = ZAEHLWORTMUSTER.exec(rest);
  return zaehlwort ? zaehlwort[0].trim() : null;
}

export function fundstellen(text, wert, {
  bedingung, zeilenmuster = null, sichtweite = SICHTWEITE, einheit = null,
} = {}) {
  const zeilen = text.split('\n');
  const formen = schreibweisen(wert).map(entwerte).sort((a, b) => b.length - a.length);
  // Wortgrenzen von Hand: `\b` trennt an Punkt und Komma und würde „12.345"
  // in zwei Treffer zerlegen. Geprüft wird deshalb auf keine Ziffer davor und
  // keine Ziffer, kein Punkt und kein Komma danach.
  //
  // **Die Beispielzahl ist mit Absicht erfunden.** Bis zum 5. September stand
  // hier eine echte, abgelöste Leitzahl — und als der Prüfer am selben Tag
  // auch den Quelltext zu lesen begann, meldete er die Veranschaulichung
  // seiner eigenen Regel. Eine Erklärung, die eine geführte Zahl ausborgt,
  // wird eines Tages als Behauptung gelesen.
  const muster = new RegExp(`(?<![\\d.,])(?:${formen.join('|')})(?![\\d.,]*\\d)`);
  const treffer = [];

  for (const [i, zeile] of zeilen.entries()) {
    const fund = muster.exec(zeile);
    if (!fund) continue;
    if (zeilenmuster && !zeilenmuster.test(zeile)) continue;
    if (schreibweisen(wert).some((f) => inSpanne(zeile, f))) continue;
    // Eine Zahl mit fremder Einheit ist nicht diese Leitzahl. **Nur bei
    // erklärter eigener Einheit:** Ohne sie ist nichts entschieden, und der
    // Fund bleibt verdächtig — die sichere Richtung.
    if (einheit && fremdeEinheit(zeile, fund.index + fund[0].length, einheit)) continue;
    const umfeld = sichtfeld(text, i + 1, sichtweite);
    treffer.push({
      zeile: i + 1,
      inhalt: zeile.trim().slice(0, 120),
      gedeckt: (bedingung ? bedingung.test(umfeld) : false) || WIDERRUFSMERKMAL.test(umfeld),
    });
  }
  return treffer;
}

/**
 * Die Dokumente, in denen der **gültige** Wert stehen muss.
 *
 * **Der Grund ist eine misslungene Gegenprobe.** Um zu sehen, ob der Prüfer
 * findet, wofür er gebaut ist, habe ich in `PARAMETER.md` die alte Zahl wieder
 * eingesetzt — und er meldete **nichts**. Denn direkt daneben steht meine
 * eigene Berichtigung, und die enthält das Wort „Kreditkarte". Die Bedingung
 * war in Sichtweite, also galt der Fund als gedeckt.
 *
 * > **Ein Freibrief in Sichtweite deckt auch den, der ihn nicht verdient.**
 * > Die Regel „abgelöste Zahl braucht ihre Bedingung" kann nicht unterscheiden,
 * > ob eine Zahl zitiert oder behauptet wird.
 *
 * Deshalb die zweite Regel, die von der anderen Seite kommt: In den führenden
 * Dokumenten muss der **heute gültige** Wert vorkommen — **und zwar vor jedem
 * abgelösten.**
 *
 * Auch die bloße Anwesenheit reichte nicht. Der zweite Anlauf der Gegenprobe
 * ersetzte in `PARAMETER.md` beide gültigen Vorkommen durch die alte Zahl, und
 * der Prüfer schwieg wieder: Die gültige Zahl stand weiterhin in der
 * Berichtigung weiter unten. **Anwesend ist nicht dasselbe wie führend.** Wer
 * ein Dokument aufschlägt, liest die erste Zahl, nicht die vollständigste.
 */
export const LEITDOKUMENTE = Object.freeze([
  'docs/baustoff-shop/PARAMETER.md',
  'docs/baustoff-shop/pr-beschreibung.md',
]);

/**
 * Prüft eine Datei gegen das ganze Register.
 *
 * @param {string} text
 * @param {string} name
 * @param {object} ziel  die Zielgrößen
 */
/**
 * Stellen, die eine abgelöste Leitzahl nennen **dürfen** — mit Grund.
 *
 * **Der Anlass, 5. September 2026.** Bis heute durchsuchte dieser Prüfer die
 * Akte und die Shoptexte, ausdrücklich nicht den Quelltext, und der Grund im
 * Kopf von `bin/leitzahlpruefung.mjs` lautete: *„Dort stehen dieselben Zahlen
 * als Testfälle und Registereinträge, und ein Prüfer, der seine eigene
 * Prüftabelle meldet, hat sich selbst gefunden."*
 *
 * Der Grund stimmt für diese Datei und für das Gegenprobenregister. Er stimmt
 * nicht für den übrigen Quelltext — und dort ist der Schaden größer als in
 * der Akte:
 *
 * > **In einem Dokument steht eine abgelöste Zahl falsch da. Im Quelltext
 * > rechnet sie.**
 *
 * Genau so ist die Schwelle „33 von 33" entstanden: Das Register kannte die
 * 32 und wusste sogar, wann die 33 abgelöst wurde — es hat nur nie dort
 * gesucht, wo sie stand.
 *
 * Nachgezählt waren es beim ersten Lauf über `src/`, `bin/` und `test/`
 * **elf** Meldungen in sechs Dateien. Vier davon waren Erzählungen ohne ihre
 * Bedingung und sind seither beschrieben; eine borgte sich eine echte
 * Leitzahl als Veranschaulichung und rechnet heute mit einer erfundenen. Was
 * bleibt, steht hier — **je Datei und je Leitzahl**, nicht je Datei: Eine
 * Datei ganz auszunehmen hieße, in siebenhundert Zeilen Register jede
 * künftige abgelöste Zahl mit auszunehmen.
 *
 * Die Pfade stehen so, wie der Prüfer sie meldet: vom Wurzelverzeichnis des
 * Repositoriums aus. Ein Verzeichnis, dessen Schlüssel anders aussehen als die
 * Meldungen, deckt nichts und fällt beim ersten Lauf als `ausnahme-ohne-fall`
 * auf — so geschehen beim ersten Anlauf dieser Runde.
 */
export const QUELLAUSNAHMEN = Object.freeze([
  Object.freeze({
    datei: 'shop/src/gegenprobenregister.js',
    leitzahl: 'keyword-anzahl',
    warum: 'Die Gegenprobe `abgeschriebene-schwelle` schreibt die abgelöste 33 absichtlich in '
      + 'den Quelltext zurück, um zu zeigen, dass der Testlauf sie meldet. Der Mutationstext '
      + 'muss die alte Zahl wörtlich enthalten — eine Bedingung daneben würde etwas anderes '
      + 'einsetzen, als der Fall verlangt.',
  }),
  Object.freeze({
    datei: 'shop/src/gegenprobenregister.js',
    leitzahl: 'noetiger-monatsumsatz',
    warum: 'Zwei Mutationen legen eine abgelöste Zahl in eine Datei, um zu zeigen, dass sie '
      + 'gemeldet wird — eine in ein Dokument der Akte, eine in den Quelltext. Beide brauchen '
      + 'die alte Zahl wörtlich im Mutationstext. **Je Leitzahl eingetragen und nicht je '
      + 'Datei:** Wer eine Mutation mit einer weiteren Leitzahl schreibt, soll an dieser Stelle '
      + 'darüber nachdenken müssen.',
  }),
  Object.freeze({
    datei: 'shop/test/leitzahlen.test.js',
    leitzahl: 'noetiger-monatsumsatz',
    warum: 'Die Proben dieses Registers rechnen an echten abgelösten Werten vor, dass die '
      + 'deutschen Schreibweisen gefunden werden. Eine erfundene Zahl prüfte die Mechanik und '
      + 'nicht den Fall, für den es sie gibt.',
  }),
  Object.freeze({
    datei: 'shop/test/leitzahlen.test.js',
    leitzahl: 'plan-gesamtdauer',
    warum: 'Dieselbe Datei, andere Leitzahl: An der 57 hängt der Fehlalarm vom 4. September, '
      + 'bei dem eine Prozentzahl für eine Tageszahl gehalten wurde. Die Probe muss genau '
      + 'diese Zahl nennen, sonst prüft sie einen anderen Fall als den, der eingetreten ist.',
  }),
]);

/**
 * Trennt die Meldungen des Quelltexts in gemeldete und ausgenommene.
 *
 * In beide Richtungen: Eine Ausnahme, zu der es keine Meldung mehr gibt, ist
 * eine Erlaubnis für etwas, das niemand mehr tut — und deckt beim nächsten
 * Mal einen Fall, der nichts mit ihr zu tun hat.
 */
export function quellbefund(meldungen, ausnahmen = QUELLAUSNAHMEN) {
  const genutzt = new Set();
  const offen = [];
  for (const m of meldungen) {
    const a = ausnahmen.find((x) => x.datei === m.datei && x.leitzahl === m.leitzahl);
    if (a) { genutzt.add(`${a.datei}|${a.leitzahl}`); continue; }
    offen.push(m);
  }

  const formfehler = [];
  for (const a of ausnahmen) {
    if (!a.warum || a.warum.length < 80) {
      formfehler.push({ regel: 'grund-zu-duenn', text: `${a.datei}/${a.leitzahl}: Grund zu dünn` });
    }
    if (!genutzt.has(`${a.datei}|${a.leitzahl}`)) {
      formfehler.push({
        regel: 'ausnahme-ohne-fall',
        text: `${a.datei}/${a.leitzahl}: ausgenommen, aber es gibt dort keine Meldung mehr`,
      });
    }
  }

  return {
    gemeldet: offen,
    ausgenommen: meldungen.length - offen.length,
    formfehler,
    sauber: offen.length === 0 && formfehler.length === 0,
  };
}

export function pruefeLeitzahlen(text, name, ziel, register = LEITZAHLEN, umfeld = {}) {
  const meldungen = [];
  const gefunden = [];

  const istLeitdokument = LEITDOKUMENTE.some((d) => name.endsWith(d) || d.endsWith(name));

  /**
   * Gilt die Leitdokumentregel für **diese** Zahl in **diesem** Dokument?
   *
   * **Eingeführt am 3. September 2026.** Die Regel „in den führenden
   * Dokumenten muss der gültige Wert vorkommen" nahm an, dass jede Leitzahl in
   * jedes Leitdokument gehört. Für die Länge der Kette bis zur Entscheidung
   * stimmt das nicht: `PARAMETER.md` führt die **Weisungen des Auftraggebers**,
   * und eine gerechnete Plandauer ist keine Weisung.
   *
   * Am selben Morgen war die Gegenrichtung entschieden worden: Die Seitenzahl
   * wurde **nicht** aufgenommen, weil ein Register, das man für einen Fall
   * dehnt, danach etwas anderes misst. Hier wird nicht gedehnt, sondern
   * benannt — und wie überall in diesem Bestand kostet die Ausnahme einen
   * Grund, der aufgeschrieben und geprüft wird.
   */
  const ausgenommen = (lz) => (lz.ohneLeitdokument ?? [])
    .some((a) => name.endsWith(a.dokument) || a.dokument.endsWith(name));

  for (const lz of register) {
    const gueltig = lz.jetzt(ziel, umfeld);
    const aktuelle = fundstellen(text, gueltig, lz);
    for (const f of aktuelle) {
      gefunden.push({ leitzahl: lz.id, wert: gueltig, aktuell: true, ...f });
    }
    for (const a of lz.ohneLeitdokument ?? []) {
      if (!a.warum || a.warum.length < 40) {
        throw new Error(`Ausnahme ohne Grund: ${lz.id} in ${a.dokument}`);
      }
      if (!LEITDOKUMENTE.some((d) => d.endsWith(a.dokument) || a.dokument.endsWith(d))) {
        throw new Error(`${a.dokument} ist kein Leitdokument — die Ausnahme wäre wirkungslos`);
      }
    }

    if (istLeitdokument && !ausgenommen(lz)) {
      if (aktuelle.length === 0) {
        meldungen.push({
          datei: name,
          zeile: 0,
          leitzahl: lz.id,
          text: `${lz.name} kommt in diesem führenden Dokument gar nicht mit dem gültigen Wert `
            + `${gueltig} vor. Ein Leitdokument, das die Leitzahl nicht nennt, führt nichts.`,
          inhalt: '',
        });
      } else {
        const ersteAlte = lz.abgeloest
          .flatMap((a) => fundstellen(text, a.wert, { ...lz, bedingung: a.bedingung }).map((f) => f.zeile))
          .sort((a, b) => a - b)[0];
        if (ersteAlte !== undefined && ersteAlte < aktuelle[0].zeile) {
          meldungen.push({
            datei: name,
            zeile: ersteAlte,
            leitzahl: lz.id,
            text: `${lz.name}: Die abgelöste Zahl steht in Zeile ${ersteAlte}, die gültige `
              + `(${gueltig}) erst in Zeile ${aktuelle[0].zeile}. Wer ein führendes Dokument `
              + 'aufschlägt, liest die erste Zahl, nicht die vollständigste.',
            inhalt: '',
          });
        }
      }
    }
    for (const alt of lz.abgeloest) {
      for (const f of fundstellen(text, alt.wert, { ...lz, bedingung: alt.bedingung })) {
        gefunden.push({ leitzahl: lz.id, wert: alt.wert, aktuell: false, ...f });
        if (!f.gedeckt) {
          meldungen.push({
            datei: name,
            zeile: f.zeile,
            leitzahl: lz.id,
            text: `${lz.name} steht mit ${alt.wert} ohne ihre Bedingung — gültig ist ${gueltig}. `
              + `Abgelöst: ${alt.weil}`,
            inhalt: f.inhalt,
          });
        }
      }
    }
  }

  return { datei: name, gefunden, meldungen, sauber: meldungen.length === 0 };
}
