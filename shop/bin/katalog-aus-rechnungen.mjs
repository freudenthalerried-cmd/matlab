#!/usr/bin/env node
/**
 * Baut den Shop-Katalog aus den ausgelesenen Lieferantenrechnungen.
 *
 * Erzeugt zwei Dateien, und die Trennung zwischen ihnen ist der Zweck des
 * Werkzeugs:
 *
 *   data/katalog-baustoff.json   öffentlich — Artikelnummer, Bezeichnung,
 *                                Gruppe, Einheit. Keine Preise.
 *   preise/baustoff-preise.json  lokal, gitignoriert — Listenpreis und
 *                                Rabattsatz je Artikel.
 *
 * Der Grund steht in docs/baustoff-shop/katalog-aus-rechnungen.md: Die
 * Konditionen, die ein Lieferant einem Baumeister einräumt, sind dessen
 * Geschäftsgeheimnis und zugleich die Verhandlungsposition des Auftraggebers.
 * Solange dieses Repository öffentlich ist, dürfen sie nicht hinein — und
 * „dürfen nicht" ist zu wenig, wenn es nur in einem Dokument steht. Deshalb
 * schreibt dieses Werkzeug sie an einen Ort, den `.gitignore` deckt.
 *
 * Eingabe ist die Positionstabelle aus den Rechnungen:
 *   preise/poschacher-positionen.csv
 *
 * Aufruf:  node bin/katalog-aus-rechnungen.mjs [--pruefen]
 *   --pruefen  nur berichten, nichts schreiben
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { sichere } from '../src/sicherung.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sperrgutAusGruppe } from '../src/sperrguteinstufung.js';

const HIER = dirname(fileURLToPath(import.meta.url));
const WURZEL = join(HIER, '..');
const REPO = join(WURZEL, '..');

/**
 * Quelle und Ziele sind über die Umgebung überschreibbar — damit eine Probe
 * das Werkzeug **wirklich laufen lassen** kann, statt seine Logik nachzubauen.
 * Ein Test, der den Erzeuger nachbaut, prüft den Nachbau.
 */
const QUELLE = process.env.KATALOG_QUELLE || join(REPO, 'preise', 'poschacher-positionen.csv');
const KATALOG_ZIEL = process.env.KATALOG_ZIEL || join(WURZEL, 'data', 'katalog-baustoff.json');
/**
 * Die Gewichte aus den Belegen — dieselbe Quelle, ein anderes Werkzeug.
 *
 * **Berichtigt am 28.08.** Dieses Werkzeug schrieb den Katalog jedes Mal neu
 * und **löschte dabei die sieben belegten Gewichte**, die `werkzeuge/
 * gewichte.py` am 27. eingetragen hatte. Aufgefallen ist es nur, weil der
 * Lauf zufällig kontrolliert wurde: Die Datei sah danach vollständig aus,
 * der Verlust stand in keiner Zeile Ausgabe.
 *
 * > **Ein Erzeuger, der eine Datei neu schreibt, löscht alles, was ein
 * > anderes Werkzeug hineingeschrieben hat** — schweigend, weil er von dem
 * > anderen nichts weiß.
 *
 * Zwei Vorkehrungen statt einer:
 *
 * 1. Die Gewichte werden **hier mitgeschrieben**, aus derselben Datei, aus
 *    der `gewichte.py` sie erzeugt. Damit ist der Lauf wiederholbar und das
 *    Ergebnis unabhängig davon, was vorher in der Zieldatei stand.
 * 2. Vor dem Schreiben wird der **Bestand verglichen**. Ginge dabei eine
 *    belegte Angabe verloren, bricht das Werkzeug ab, statt sie zu
 *    überschreiben.
 */
const GEWICHTE_QUELLE = process.env.KATALOG_GEWICHTE || join(REPO, 'preise', 'gewichte-aus-rechnungen.json');
const PREISE_ZIEL = process.env.KATALOG_PREISE_ZIEL || join(REPO, 'preise', 'baustoff-preise.json');

/**
 * **Die beiden Ziele gehören zusammen.**
 *
 * Am 30.08. hat eine Gegenprobe `KATALOG_ZIEL` umgelenkt und beim Preisziel
 * den falschen Namen benutzt (`PREISE_ZIEL` statt `KATALOG_PREISE_ZIEL`).
 * Der Katalog ging in den Testordner, die **Preisdatei in den Bestand** —
 * und weil der Lauf keinen Artikel las, stand dort danach eine leere Liste.
 *
 * Die Datei ist gitignoriert; ein `git checkout` holt sie nicht zurück. Sie
 * ließ sich aus `preise/poschacher-positionen.csv` neu erzeugen, mit einem
 * Befehl — das ist der Verdienst der Entscheidung, sie **abzuleiten** statt
 * sie zu pflegen. Ohne diese Entscheidung wären 46 Konditionen weg gewesen.
 *
 * Ein Werkzeug, das eine seiner beiden Ausgaben umlenken lässt und die
 * andere in den Bestand schreibt, ist eine Falle. Wer eine umlenkt, lenkt
 * beide um.
 */
if (Boolean(process.env.KATALOG_ZIEL) !== Boolean(process.env.KATALOG_PREISE_ZIEL)) {
  console.error('\nAbbruch: Nur eines der beiden Ziele ist umgelenkt.');
  console.error(`  KATALOG_ZIEL:        ${process.env.KATALOG_ZIEL ?? '(nicht gesetzt)'}`);
  console.error(`  KATALOG_PREISE_ZIEL: ${process.env.KATALOG_PREISE_ZIEL ?? '(nicht gesetzt)'}`);
  console.error('\nDie beiden Ausgaben gehören zusammen. Ein Lauf, der den Katalog');
  console.error('umlenkt und die Preisdatei in den Bestand schreibt, überschreibt');
  console.error('vertrauliche Daten, die kein git zurückholt.');
  process.exit(2);
}

const LIEFERANT_ID = 'poschacher';

/**
 * Positionen, die keine Handelsware sind: Paletten, Pauschalen, Zuschläge.
 * Sie gehören in die Frachtrechnung, nicht in den Katalog. Über alle fünfzehn
 * Belege machen sie 6,6 % des Warenwerts aus.
 */
const KEINE_HANDELSWARE = new Set([
  '53053', // Paletten ÖBB
  '28096', // Einwegpalette
  '30668', // Energiekostenzuschlag
  '30715', // Kranentladung pro Hub
  '30667', // Frachtpauschale Baustelle
  '53265', // Frachtpauschale Lager
  '30704', // Folierung
]);

/**
 * Warengruppen. Die Zuordnung ist eine fachliche Einschätzung, keine Angabe
 * des Lieferanten — deshalb steht sie hier lesbar und nicht in den Daten
 * versteckt. Sie steuert im Shop die Navigation und in der Kampagne den
 * Zuschnitt der Anzeigengruppen.
 */
const GRUPPEN = {
  '11283': 'WDVS', '29461': 'WDVS', '50509': 'WDVS', '53402': 'WDVS',
  '52124': 'WDVS', '11082': 'WDVS', '29610': 'WDVS', '13728': 'WDVS',
  '19333': 'WDVS', '52058': 'WDVS', '52537': 'WDVS',
  '12566': 'Dämmung', '12567': 'Dämmung', '12583': 'Dämmung',
  '12569': 'Dämmung', '12571': 'Dämmung', '12575': 'Dämmung',
  '12580': 'Dämmung', '12596': 'Dämmung', '28415': 'Dämmung',
  '10837': 'Kamin', '12455': 'Kamin', '12467': 'Kamin', '12472': 'Kamin',
  '12476': 'Kamin', '16070': 'Kamin', '18110': 'Kamin', '51875': 'Kamin',
  '51967': 'Kamin',
  '10095': 'Kanal', '10115': 'Kanal', '10116': 'Kanal', '10134': 'Kanal',
  '11133': 'Kanal', '21382': 'Kanal',
  '13550': 'Mörtel', '29108': 'Mörtel', '29754': 'Mörtel',
  '29728': 'Mauerwerk',
  '12294': 'Zubehör', '29023': 'Zubehör', '29691': 'Zubehör',
  '31265': 'Zubehör', '31631': 'Zubehör', '51987': 'Zubehör',
  '53215': 'Zubehör',
};

/**
 * Sperrgut — palettierte oder überlange Ware, die nicht als Paket geht.
 * Ebenfalls Einschätzung, ebenfalls sichtbar. Im Katalog ist sie als
 * `sperrgutQuelle: "eingeschaetzt"` gekennzeichnet, damit niemand sie für
 * eine Lieferantenangabe hält.
 */
// Die Liste steht in `src/sperrguteinstufung.js` — hier stand bis zum 5. September
// eine zweite Fassung derselben vier Namen.

/**
 * Die Spalten, die dieses Werkzeug braucht.
 *
 * **Gemessen am 30.08.** mit einer Artikelliste im Format, um das der
 * Auftraggeber gebeten wurde (`sku;bezeichnung;einheit;ek_netto;…`). Das
 * Werkzeug las die Datei, fand kein einziges `ArtNr` — und meldete:
 *
 *     Positionen gelesen:       2
 *     Artikel im Katalog:       0
 *
 * Ausgang 0. Kein Fehler, keine Warnung. Am Tag der Lieferantenliste liest
 * sich das wie „die Liste enthält keine brauchbare Ware" und nicht wie „ich
 * kann dieses Format nicht lesen".
 *
 * Eingabe ist und bleibt die **Positionstabelle aus Rechnungen**. Eine
 * Artikelliste ist ein anderes Format und braucht ein anderes Werkzeug — was
 * dieses hier jetzt sagt, statt still nichts zu tun.
 */
const PFLICHTSPALTEN = ['ArtNr', 'Bezeichnung', 'Einheit', 'Einzelpreis', 'Datum'];

function leseCsv(text) {
  const zeilen = text.replace(/^﻿/, '').trim().split(/\r?\n/);
  const kopf = zeilen[0].split(';').map((k) => k.trim());
  const fehlend = PFLICHTSPALTEN.filter((sp) => !kopf.includes(sp));
  if (fehlend.length) {
    console.error(`\nAbbruch: ${QUELLE}`);
    console.error(`Es fehlen die Spalten: ${fehlend.join(', ')}`);
    console.error(`Gefunden wurden: ${kopf.join(', ')}`);
    console.error('\nDieses Werkzeug liest die Positionstabelle aus Lieferantenrechnungen.');
    console.error('Eine Artikelliste (sku;bezeichnung;einheit;ek_netto;…) ist ein anderes');
    console.error('Format — für einen Probelauf darüber: node bin/import.mjs <lieferantId> <datei>.');
    process.exit(2);
  }
  return zeilen.slice(1).map((z) => {
    const f = z.split(';');
    return Object.fromEntries(kopf.map((k, i) => [k, (f[i] ?? '').trim()]));
  });
}

function zahl(s) {
  // Leer ist nicht null-Komma-null. `Number('')` liefert 0 und ist endlich —
  // wer das nicht abfängt, macht aus „kein Rabatt ausgewiesen" ein „0 %
  // Rabatt" und verliert damit genau die Unterscheidung, auf die es
  // ankommt: nettofakturierte Positionen haben keinen Listenpreis, gegen
  // den sich der Verkaufspreis deckeln ließe.
  const roh = String(s ?? '').trim();
  if (roh === '') return null;
  const n = Number(roh);
  return Number.isFinite(n) ? n : null;
}

/** Aus „Capatect Kantenschutz / 11,5 cm" wird eine einzeilige Bezeichnung. */
function bezeichnung(roh) {
  return roh.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').replace(/‐/g, '-').trim();
}

function main() {
  const nurPruefen = process.argv.includes('--pruefen');

  if (!existsSync(QUELLE)) {
    console.error(`Die Positionstabelle fehlt: ${QUELLE}`);
    console.error('Sie entsteht aus den Lieferantenrechnungen und liegt bewusst');
    console.error('außerhalb des Repositories. Ohne sie kein Katalog.');
    process.exit(2);
  }

  const positionen = leseCsv(readFileSync(QUELLE, 'utf8'));
  const artikel = new Map();
  const verworfen = [];

  for (const p of positionen) {
    const nr = p.ArtNr;
    if (!nr) continue;
    if (KEINE_HANDELSWARE.has(nr)) {
      verworfen.push(nr);
      continue;
    }

    // Preisbasis „per 1000": Der Listenpreis gilt je tausend Einheiten. Wer
    // das übersieht, rechnet den Stückpreis um drei Zehnerpotenzen falsch —
    // und die Summenprobe je Beleg fängt es nicht, weil der Betrag stimmt.
    const teiler = p.Preisbasis === 'per 1000' ? 1000 : 1;
    const listePro = zahl(p.Einzelpreis) / teiler;
    const rabattRoh = zahl(p.RabattProzent);
    const hatRabatt = rabattRoh !== null;
    const rabatt = hatRabatt ? Math.abs(rabattRoh) / 100 : null;

    // Der jüngste Beleg gewinnt: Preise altern, Rabattsätze weniger.
    const [t, m, j] = p.Datum.split('.');
    const stand = `${j}-${m}-${t}`;
    const vorhanden = artikel.get(nr);
    if (vorhanden && vorhanden.stand >= stand) continue;

    const gruppe = GRUPPEN[nr] ?? 'Sonstiges';
    artikel.set(nr, {
      nr,
      stand,
      bezeichnung: bezeichnung(p.Bezeichnung),
      gruppe,
      einheit: p.Einheit,
      sperrgut: sperrgutAusGruppe(gruppe),
      // Ohne ausgewiesene Liste wurde netto fakturiert (Projekt- oder
      // Aktionspreis). Dann gibt es keinen Rabattsatz, aus dem sich etwas
      // ableiten ließe — und keinen Deckel, gegen den zu prüfen wäre.
      listeNetto: hatRabatt ? listePro : null,
      rabatt,
      ekNetto: hatRabatt ? null : listePro,
    });
  }

  // Die belegten Gewichte, wenn die Datei zur Hand ist. Fehlt sie, bleibt die
  // Karte leer — und die Bestandsprüfung weiter unten schlägt an, sobald der
  // vorhandene Katalog Gewichte trägt, die dann verlorengingen.
  const gewichtJeNummer = new Map();
  if (existsSync(GEWICHTE_QUELLE)) {
    const roh = JSON.parse(readFileSync(GEWICHTE_QUELLE, 'utf8'));
    for (const [nr, eintrag] of Object.entries(roh.fest ?? {})) {
      if (typeof eintrag.jeEinheitKg === 'number') gewichtJeNummer.set(String(nr), eintrag.jeEinheitKg);
    }
  }

  const sortiert = [...artikel.values()].sort(
    (a, b) => a.gruppe.localeCompare(b.gruppe, 'de') || a.bezeichnung.localeCompare(b.bezeichnung, 'de'),
  );

  const katalog = {
    _datenstand: `Aus ${new Set(positionen.map((p) => p.Rechnung)).size} Lieferantenbelegen, jüngster Stand ${sortiert.reduce((m, a) => (a.stand > m ? a.stand : m), '')}.`,
    _hinweis:
      'Diese Datei enthält bewusst KEINE Preise. Listenpreise und Rabattsätze stehen in preise/baustoff-preise.json, die von .gitignore gedeckt ist. Ohne diese Datei liefert der Katalog keine Verkaufspreise — und das ist die Absicht, nicht ein Mangel.',
    _sperrgutHinweis:
      'Die Kennzeichnung als Sperrgut ist eine fachliche Einschätzung nach Warengruppe, keine Angabe des Lieferanten. Sie steuert den Frachtzuschlag.',
    _gewichtHinweis:
      'gewichtKg steht bei den Artikeln, deren Positionsgewicht aus einer Rechnung stammt, deren Gewichtssumme gegen das ausgewiesene Gesamtgewicht aufgeht (werkzeuge/gewichte.py). Wo das Feld fehlt, ist das Gewicht UNBEKANNT und wird nicht geschaetzt: Vier von vierzehn Belegen gehen ohne Rest auf, die uebrigen tragen einen ungeklaerten Rest. Siehe docs/baustoff-shop/gewichte-mit-summenprobe.md.',
    sortiment: 'Fassade, Dämmung, Kamin, Kanal — aus dem Bürozubau',
    lieferantId: LIEFERANT_ID,
    artikel: sortiert.map((a) => ({
      sku: `POS-${a.nr}`,
      lieferantenArtikelnummer: a.nr,
      bezeichnung: a.bezeichnung,
      gruppe: a.gruppe,
      lieferantId: LIEFERANT_ID,
      einheit: a.einheit,
      sperrgut: a.sperrgut,
      sperrgutQuelle: 'eingeschaetzt',
      gtin: null,
      preisStand: a.stand,
      ekQuelle: 'bestaetigt',
      ...(gewichtJeNummer.get(String(a.nr)) != null
        ? { gewichtKg: gewichtJeNummer.get(String(a.nr)), gewichtQuelle: 'rechnung' }
        : {}),
    })),
  };

  const preise = {
    _warnung:
      'VERTRAULICH. Einkaufskonditionen des Auftraggebers. Diese Datei gehört nicht in ein öffentliches Verzeichnis und ist von .gitignore gedeckt. Vor jeder Veröffentlichung prüfen.',
    _quelle: 'Lieferantenrechnungen, ausgelesen am 2026-08-25, Summenprobe je Beleg bestanden.',
    lieferantId: LIEFERANT_ID,
    preise: Object.fromEntries(
      sortiert.map((a) => [
        `POS-${a.nr}`,
        a.listeNetto !== null
          ? { uvpNetto: Number(a.listeNetto.toFixed(4)), haendlerrabattAufUvp: a.rabatt, stand: a.stand }
          : { ekNetto: Number(a.ekNetto.toFixed(4)), stand: a.stand, hinweis: 'netto fakturiert, keine Liste ausgewiesen' },
      ]),
    ),
  };

  const ohneListe = sortiert.filter((a) => a.listeNetto === null).length;
  console.log(`Positionen gelesen:       ${positionen.length}`);
  console.log(`davon keine Handelsware:  ${verworfen.length}`);
  console.log(`Artikel im Katalog:       ${sortiert.length}`);
  console.log(`davon ohne Listenpreis:   ${ohneListe}`);
  console.log('');
  const jeGruppe = new Map();
  for (const a of sortiert) jeGruppe.set(a.gruppe, (jeGruppe.get(a.gruppe) ?? 0) + 1);
  for (const [g, n] of [...jeGruppe].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${g.padEnd(12)} ${String(n).padStart(3)}`);
  }

  const unsortiert = sortiert.filter((a) => a.gruppe === 'Sonstiges');
  if (unsortiert.length) {
    console.log(`\nOhne Warengruppe (bitte in GRUPPEN eintragen):`);
    for (const a of unsortiert) console.log(`  ${a.nr}  ${a.bezeichnung}`);
  }

  if (nurPruefen) {
    console.log('\n--pruefen: nichts geschrieben.');
    return;
  }

  /**
   * **Kein Schreiben ohne Ware.**
   *
   * Der Gewichtswächter unten hat den Katalog am 30.08. gerettet — aber aus
   * dem falschen Grund: Er meldete „7 belegte Gewichte gingen verloren", wo
   * in Wahrheit **kein einziger Artikel** gelesen worden war. Trüge der
   * Bestand keine belegten Gewichte, hätte das Werkzeug einen leeren Katalog
   * über den vollen geschrieben und dabei „geschrieben:" gemeldet.
   *
   * Ein Erzeuger, dessen Ausgabe leer ist, hat nicht gearbeitet.
   */
  if (sortiert.length === 0) {
    console.error('\nAbbruch: kein einziger Artikel gelesen — es wird nichts geschrieben.');
    console.error(`Quelle: ${QUELLE}`);
    process.exit(2);
  }

  mkdirSync(dirname(PREISE_ZIEL), { recursive: true });
  // Kein Schreiben, das etwas Belegtes verliert.
  if (existsSync(KATALOG_ZIEL)) {
    const alt = JSON.parse(readFileSync(KATALOG_ZIEL, 'utf8'));
    const neuJeSku = new Map(katalog.artikel.map((a) => [a.sku, a]));
    const verloren = (alt.artikel ?? []).filter(
      (a) => a.gewichtKg != null && neuJeSku.get(a.sku)?.gewichtKg == null,
    );
    if (verloren.length) {
      console.error(`\nAbbruch: ${verloren.length} belegte Gewichte gingen verloren.`);
      for (const a of verloren) console.error(`  ${a.sku}: ${a.gewichtKg} kg`);
      console.error('\nDie Quelle dafür ist preise/gewichte-aus-rechnungen.json.');
      console.error('Fehlt sie, erzeugt werkzeuge/gewichte.py sie neu — nichts wird überschrieben.');
      process.exit(2);
    }
  }

  // Vor dem Überschreiben eine datierte Kopie — der Grund steht in
  // src/sicherung.js und ist der Vorfall vom 30.08.
  const gesichert = [sichere(KATALOG_ZIEL), sichere(PREISE_ZIEL)].filter(Boolean);

  writeFileSync(KATALOG_ZIEL, JSON.stringify(katalog, null, 2) + '\n', 'utf8');
  writeFileSync(PREISE_ZIEL, JSON.stringify(preise, null, 2) + '\n', 'utf8');
  const mitGewicht = katalog.artikel.filter((a) => a.gewichtKg != null).length;
  console.log(`\nGewichte aus Belegen:      ${mitGewicht} von ${katalog.artikel.length}`);
  console.log(`\ngeschrieben: ${KATALOG_ZIEL}`);
  console.log(`geschrieben: ${PREISE_ZIEL}  (vertraulich, gitignoriert)`);
  for (const k of gesichert) console.log(`gesichert:   ${k}`);
}

main();
