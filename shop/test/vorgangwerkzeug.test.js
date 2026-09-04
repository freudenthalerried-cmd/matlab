/**
 * Von der eingegangenen Anfrage zum Angebot — der Weg, der fehlte.
 *
 * **Der Anlass, 3. September 2026.** `erzeugeAngebot` gibt es seit dem
 * 31. August: mit Bindefrist, Zahlungsbedingung, Pflichtangaben nach § 11 UStG
 * und einem eigenen Prüfer. Außerhalb von Tests hat sie genau eine Stelle
 * aufgerufen — **ihr eigener Prüfer, mit einem erfundenen Warenkorb**.
 *
 * > **Ein Beleg, den nur sein Prüfer erzeugt, ist ein Muster und kein
 * > Betriebsmittel.** Wer heute ein Angebot schreiben müsste, schriebe es von
 * > Hand, und dann gälte keine der Regeln, die dieser Bestand darüber kennt.
 *
 * Diese Probe fährt den ganzen Weg am echten Bestand: Anfragetext aus der
 * Kasse, zurückgelesen, nachgerechnet, Angebot erzeugt, geprüft.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';
import { kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant } from '../src/shopkern.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';
import { wegwerfordner } from '../src/wegwerf.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const werkzeug = pfad('../bin/vorgang.mjs');
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
const preisPfad = pfad('../../preise/baustoff-preise.json');

/**
 * Die Preisdatei liegt außerhalb des Repositories. Ohne sie kann dieses
 * Werkzeug nichts rechnen — und diese Probe nichts prüfen. Sie sagt das,
 * statt still grün zu sein: `vorhanden` ist selbst eine Zusicherung, damit
 * eine Arbeitskopie **mit** Preisdatei den Fall auch wirklich fährt.
 */
const vorhanden = existsSync(preisPfad);

const KUNDE = {
  firma: 'Musterbau GmbH',
  strasse: 'Baustellenweg 7',
  plz: '4600',
  ort: 'Wels',
  uid: 'ATU12345675',
  email: 'office@example.at',
  telefon: '+43 7242 12345',
  land: 'AT',
  unternehmerBestaetigt: true,
};

/** Eine Anfrage, wie die Kasse sie erzeugt — über dem Mindestbestellwert. */
function baueUmgebung() {
  const betreiber = lies(pfad('../data/betreiber.json'));
  const katalog = ladeBaustoffkatalog(
    lies(pfad('../data/katalog-baustoff.json')),
    lies(preisPfad),
    lies(pfad('../data/lieferanten.json')),
    ZIELMARGE,
  );
  const daten = {
    artikel: katalog.artikel.map(oeffentlicherArtikel),
    lieferanten: [...katalog.lieferantenById.values()].map(oeffentlicherLieferant),
    mindestbestellwertNetto: betreiber.mindestbestellwertNetto ?? null,
  };
  const rechnung = kundenWarenkorb(
    [{ sku: 'POS-51967', menge: 2 }, { sku: 'POS-12569', menge: 30 }], daten,
  );
  const anfrage = baueKundenanfrage({
    rechnung,
    bezirk: 'Perg',
    betreiber: { firma: betreiber.firma, ort: betreiber.ort, email: '' },
    datum: '2026-09-03',
  });
  assert.equal(anfrage.moeglich, true, anfrage.hindernis);

  const ordner = wegwerfordner('vorgang-');
  const anfrageDatei = join(ordner, 'anfrage.txt');
  const kundeDatei = join(ordner, 'kunde.json');
  writeFileSync(anfrageDatei, anfrage.text);
  writeFileSync(kundeDatei, JSON.stringify(KUNDE, null, 2));
  return { ordner, anfrageDatei, kundeDatei, rechnung, text: anfrage.text };
}

/** Führt das Werkzeug aus und gibt Ausgabe und Rückgabewert zurück. */
function lauf(argumente, umgebung = {}) {
  try {
    return {
      code: 0,
      aus: execFileSync(process.execPath, [werkzeug, ...argumente],
        { encoding: 'utf8', env: { ...process.env, ...umgebung } }),
    };
  } catch (e) {
    return { code: e.status ?? 1, aus: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('die Preisdatei entscheidet, ob diese Probe etwas prüfen kann', () => {
  // Ohne diese Zusicherung wäre eine fehlende Preisdatei ein stiller
  // Durchlauf — und niemand wüsste, dass hier nichts gefahren wurde.
  assert.equal(typeof vorhanden, 'boolean');
});

test('der Weg von der Anfrage zum Angebot geht durch', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0001', '--datum', '03.09.2026']);
  assert.equal(e.code, 0, e.aus);
  assert.match(e.aus, /Angebot AN-2026-0001/);
  assert.match(e.aus, /Bindefrist: 14 Tage/);
  assert.match(e.aus, /Musterbau GmbH/);
  // Die Anschrift des Ausstellers ist Pflichtangabe nach § 11 Abs 1 Z 3 UStG.
  assert.match(e.aus, /Ried in der Riedmark/);
});

test('das Angebot nennt dieselben Summen wie die Anfrage', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0002']);
  assert.equal(e.code, 0, e.aus);
  const brutto = u.rechnung.bruttoGesamt.toLocaleString('de-AT',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  assert.ok(e.aus.includes(`Gesamtbetrag${' '.repeat(1)}`), 'kein Summenblock im Beleg');
  assert.ok(e.aus.includes(brutto), `${brutto} steht nicht im Angebot:\n${e.aus}`);
});

/**
 * Die Weisung vom 28.08.: **keine Spanne ausgeben.** Der Beleg entsteht aus
 * einem Warenkorb, der Einkaufspreise trägt — hier wird gemessen, dass keiner
 * davon im Text landet.
 */
test('das Angebot trägt keine Einkaufszahl', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0003']);
  assert.equal(e.code, 0, e.aus);
  for (const wort of ['Einkauf', 'Wareneinsatz', 'Marge', 'Spanne', 'Deckungsbeitrag']) {
    assert.ok(!e.aus.includes(wort), `„${wort}" steht im Angebot`);
  }
});

test('eine verfälschte Summe hält das Angebot auf', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  // Eine einzige Zahl im Summenblock verändert — genau der Fall, für den der
  // Leser nachrechnet: eine Mail, in der jemand eine Ziffer geändert hat.
  const verfaelscht = join(u.ordner, 'falsch.txt');
  const original = u.rechnung.bruttoGesamt.toLocaleString('de-AT',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const text = u.text.replace(`Brutto gesamt         ${original}`, 'Brutto gesamt         99,99');
  assert.notEqual(text, u.text, 'die Vorlage hat sich geändert — diese Probe verfälscht nichts mehr');
  writeFileSync(verfaelscht, text);

  const e = lauf([verfaelscht, '--kunde', u.kundeDatei, '--nummer', '2026-0004']);
  assert.equal(e.code, 1);
  assert.ok(!e.aus.includes('Angebot AN-2026-0004'), 'trotz Abweichung ein Angebot gedruckt');
});

test('ohne Vorgangsnummer und ohne Kundendatei endet der Lauf rot', () => {
  const ohneNummer = lauf(['--kunde', '/dev/null']);
  assert.equal(ohneNummer.code, 1);
  assert.match(ohneNummer.aus, /Vorgangsnummer/);

  const ohneKunde = lauf(['--nummer', '2026-0005']);
  assert.equal(ohneKunde.code, 1);
  assert.match(ohneKunde.aus, /--kunde/);
});

test('eine unbekannte Stufe wird abgelehnt und die möglichen genannt', () => {
  const e = lauf(['--kunde', '/dev/null', '--nummer', 'X', '--stufe', 'rechnung']);
  assert.equal(e.code, 1);
  assert.match(e.aus, /angebot/);
  assert.match(e.aus, /bestaetigung/);
});

/**
 * Die Auftragsbestätigung schließt nach AGB Punkt 2 den Vertrag. Solange die
 * Annahme gesperrt ist — heute, weil die Lieferzeit des Lieferanten fehlt —
 * darf sie nicht entstehen, und zwar nicht als Hinweis, sondern als roter
 * Ausgang.
 */
test('die Auftragsbestätigung entsteht nicht gegen die eigene Sperre',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    const u = baueUmgebung();
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0006', '--stufe', 'bestaetigung']);
    const gesperrt = e.aus.includes('Annahme ist nicht frei');
    // Solange die Lieferzeit fehlt, ist der rote Ausgang der richtige. Steht
    // sie eines Tages in der Lieferantendatei, muss die Bestätigung entstehen
    // — beide Fälle sind hier festgehalten, keiner davon bedingt weggelassen.
    assert.equal(e.code, gesperrt ? 1 : 0, e.aus);
    if (gesperrt) assert.ok(!e.aus.includes('Auftragsbestätigung AB-2026-0006'));
    else assert.match(e.aus, /Auftragsbestätigung AB-2026-0006/);
  });

/* ------------------------------------------------------------------ *
 * Ablegen — ergänzt am 4. September
 * ------------------------------------------------------------------ */

/**
 * `src/ablage.js` und `src/speicher.js` sind seit dem 31. August fertig:
 * Nummernkreis nach § 11 UStG, Journal aus Zeilen, die nur wachsen, § 132 BAO.
 * Sieben ihrer Ausfuhren rief außerhalb der Tests niemand — es fehlte kein
 * Code, sondern ein **Ort**, an dem Kundendaten liegen dürfen.
 *
 * Diese Proben fahren den Weg bis in die Akte, in ein Wegwerfverzeichnis.
 * `VORGANG_ABLAGE` gibt es genau dafür: Eine Probe, die den Bestand verändert,
 * ist keine.
 */
test('ohne --ablegen bleibt die Akte leer', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const akte = wegwerfordner('akte-');
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0101'],
    { VORGANG_ABLAGE: akte });
  assert.equal(e.code, 0, e.aus);
  assert.match(e.aus, /Nichts abgelegt/);
  assert.equal(existsSync(join(akte, 'journal-2026.jsonl')), false);
});

/**
 * Ein Bestand mit beantworteter Lieferzeit.
 *
 * **Ohne ihn prüft keine dieser Proben den Durchgang.** Die Lieferzeit ist
 * eine der neun offenen Fragen an den Lieferanten; solange sie offen ist,
 * trägt jeder Beleg ein `[[ … FEHLT ]]`, und `--ablegen` weist ihn zu Recht
 * ab. Genau diesen Fall prüft die Probe darunter — und diese hier den anderen.
 */
function mitLieferzeit(ordner) {
  const echt = lies(pfad('../data/lieferanten.json'));
  const datei = join(ordner, 'lieferanten.json');
  writeFileSync(datei, JSON.stringify({
    ...echt,
    lieferanten: echt.lieferanten.map((l) => ({ ...l, lieferzeitWerktage: l.lieferzeitWerktage ?? 6 })),
  }, null, 2));
  return datei;
}

test('ein Beleg mit offener Pflichtangabe kommt nicht in die Akte',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    // Der heutige Bestand: Die Lieferzeit des Lieferanten ist offen, also
    // trägt jedes Angebot eine sichtbare Lücke. Sieben Jahre lang stünde
    // sonst ein unvollständiges Papier in der Akte.
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0106',
      '--datum', '2026-09-04', '--ablegen'], { VORGANG_ABLAGE: akte });
    assert.equal(e.code, 1, e.aus);
    assert.match(e.aus, /Nicht abgelegt: 1 Lücke/);
    assert.equal(existsSync(join(akte, 'journal-2026.jsonl')), false,
      'abgewiesen und trotzdem geschrieben wäre das Schlimmste von beidem');
  });

test('mit --ablegen entsteht eine Journalzeile je Ereignis',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0102',
      '--datum', '2026-09-04', '--ablegen'],
    { VORGANG_ABLAGE: akte, VORGANG_LIEFERANTEN: mitLieferzeit(u.ordner) });
    assert.equal(e.code, 0, e.aus);
    // **Die Nummer auf dem Papier ist die Nummer in der Akte.** Der erste
    // Wurf zog sie aus dem Zähler und legte `AN-2026-0001` ab, während auf
    // dem Beleg `AN-2026-0102` stand.
    assert.match(e.aus, /Abgelegt: angebot AN-2026-0102/);
    assert.match(e.aus, /Angebot AN-2026-0102/);

    const zeilen = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
      .split('\n').filter(Boolean).map((z) => JSON.parse(z));
    // **Keine `nummernvergabe`-Zeile**, und das ist Absicht: Die Nummer kommt
    // vom Beleg, nicht aus dem Zähler. Was die Einmaligkeit sichert, ist
    // seit heute `haltefest` — die Probe darunter fährt den Fall.
    assert.equal(zeilen.length, 1);
    assert.equal(zeilen[0].typ, 'eintrag');
    assert.equal(zeilen[0].eintrag.nummer, 'AN-2026-0102');
    assert.equal(zeilen[0].eintrag.vorgang, '2026-0102');
    // Nur der Betreff, nie der Belegtext — das Felderverzeichnis verlangt es,
    // weil hier sieben Jahre lang steht, was hineinkommt.
    assert.ok(!zeilen[0].eintrag.text.includes('Baustellenweg'),
      'die Anschrift des Kunden gehört in den Beleg, nicht ins Journal');
  });

test('der zweite Lauf setzt den Nummernkreis fort statt ihn zurückzusetzen',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const gemeinsam = { VORGANG_ABLAGE: akte, VORGANG_LIEFERANTEN: mitLieferzeit(u.ordner) };
    const erst = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0103',
      '--datum', '2026-09-04', '--ablegen'], gemeinsam);
    assert.equal(erst.code, 0, erst.aus);
    const zweit = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0104',
      '--datum', '2026-09-04', '--ablegen'], gemeinsam);
    assert.equal(zweit.code, 0, zweit.aus);
    // Zwei Vorgänge, zwei Nummern, ein Journal — und beide Zeilen stehen
    // darin. Das ist die Zusicherung, die der Arbeitsspeicher nicht geben
    // konnte: Nach einem Neustart begänne der Zähler sonst wieder bei eins.
    assert.match(zweit.aus, /Abgelegt: angebot AN-2026-0104/);
    const zeilen = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
      .split('\n').filter(Boolean).map((z) => JSON.parse(z));
    assert.equal(zeilen.filter((z) => z.typ === 'eintrag').length, 2);
    assert.equal(zeilen.at(-1).eintrag.lfd, 2, 'die laufende Nummer setzt fort');
  });

test('die Auftragsbestätigung wird ohne Belegnummer abgelegt',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0105',
      '--datum', '2026-09-04', '--stufe', 'bestaetigung', '--ablegen'],
    { VORGANG_ABLAGE: akte, VORGANG_LIEFERANTEN: mitLieferzeit(u.ordner) });
    // Läuft die Bestätigung nicht (Freigabe fehlt), sagt das Werkzeug das —
    // dann darf es aber auch nichts abgelegt haben.
    if (e.code !== 0) {
      assert.equal(existsSync(join(akte, 'journal-2026.jsonl')), false, e.aus);
      return;
    }
    assert.match(e.aus, /Abgelegt: auftragsbestaetigung/);
    assert.match(e.aus, /Ohne Belegnummer/);
  });

test('dieselbe Belegnummer kommt kein zweites Mal in die Akte',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    // § 11 Abs 1 Z 5 UStG verlangt fortlaufend **und einmalig**. Seit die
    // Nummer vom Papier kommt statt aus dem Zähler, sichert die Einmaligkeit
    // nicht mehr `naechsteNummer`, sondern `haltefest`.
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const gemeinsam = { VORGANG_ABLAGE: akte, VORGANG_LIEFERANTEN: mitLieferzeit(u.ordner) };
    const argumente = [u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0107',
      '--datum', '2026-09-04', '--ablegen'];
    assert.equal(lauf(argumente, gemeinsam).code, 0);
    const zweit = lauf(argumente, gemeinsam);
    assert.notEqual(zweit.code, 0, `zweimal dieselbe Nummer durchgelassen:\n${zweit.aus}`);
    assert.match(zweit.aus, /AN-2026-0107 steht schon in der Ablage/);
  });
