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
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  const e = lauf(['--kunde', '/dev/null', '--nummer', 'X', '--stufe', 'mahnung']);
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
    /*
     * **Seit dem 11. September hält die Durchschrift auf**, nicht erst das
     * Journal: Der Beleg wird vor seiner Journalzeile geschrieben, und eine
     * Datei, die es schon gibt, bricht den Lauf ab. Die Sperre in `haltefest`
     * steht unverändert dahinter — sie hat seither ihre eigene Probe in
     * `test/ablage.test.js`, weil sie sonst keine mehr hätte.
     */
    assert.match(zweit.aus, /Durchschrift AN-2026-0107\.txt liegt schon in der Ablage/);
    const zeilen = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
      .split('\n').filter(Boolean);
    assert.equal(zeilen.length, 1, 'der zweite Lauf hat trotzdem ins Journal geschrieben');
  });

test('mit ausgetauschter Grundlage schreibt --ablegen nicht in die echte Akte',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    /*
     * **Der zweite Fund vom 11. September.** Der neue Abgleich zwischen
     * Journal und Durchschriften fand in der **echten** Akte einen Eintrag:
     * zwei gezogene Rechnungsnummern und eine Zeile mit `betragNetto: null`,
     * übrig aus den Läufen dieses Hauses vom selben Tag. § 11 UStG nimmt eine
     * Belegnummer nicht zurück — `RE-2026-0001` wäre verbraucht gewesen,
     * bevor der Betrieb seine erste Rechnung stellt.
     */
    const u = baueUmgebung();
    const echt = pfad('../../ablage');
    const vorher = existsSync(echt);
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0112',
      '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08', '--ablegen'],
    mitUid(u.ordner));
    // Aufräumen **vor** der Zusicherung: Schlägt die Sperre fehl, soll die
    // Probe nicht ihrerseits eine Nummer in der echten Akte verbrauchen.
    const angelegt = !vorher && existsSync(echt);
    if (angelegt) rmSync(echt, { recursive: true, force: true });

    assert.equal(angelegt, false, `der Lauf hat in die echte Akte geschrieben:\n${e.aus}`);
    assert.equal(e.code, 1, e.aus);
    assert.match(e.aus, /VORGANG_BETREIBER ist gesetzt/);
  });

test('eine Rechnung mit sichtbarer Lücke kommt nicht in die Akte',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    /*
     * **Der Fund vom 11. September, nachts.** Die Sperre gibt es seit dem
     * 4. September — aber nur im Zweig für Angebot und Auftragsbestätigung.
     * Die Rechnungsstufe kam am 11. September dazu, an anderer Stelle der
     * Datei, und legte ab, was eine Lückenmarke trug.
     *
     * > **Eine Regel, die an zwei von drei Stellen steht, ist keine Regel
     * > über Belege, sondern eine über zwei Zweige.**
     */
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const ohneUid = join(u.ordner, 'kunde-ohne-uid.json');
    writeFileSync(ohneUid, JSON.stringify(
      { ...KUNDE, uid: '', unternehmerBestaetigt: false }, null, 2,
    ));
    const e = lauf([u.anfrageDatei, '--kunde', ohneUid, '--nummer', '2026-0113',
      '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08', '--ablegen'],
    { ...mitUid(u.ordner), VORGANG_ABLAGE: akte });
    assert.equal(e.code, 1, e.aus);
    assert.match(e.aus, /Lücke\(n\) im Beleg/);
    assert.match(e.aus, /UID des Leistungsempfängers/);
    // Und nichts ist geschehen: kein Journal, keine Durchschrift, keine
    // verbrauchte Nummer.
    assert.equal(existsSync(join(akte, 'journal-2026.jsonl')), false,
      'die Rechnung mit der Lücke steht im Journal');
    assert.equal(existsSync(join(akte, 'belege-2026')), false,
      'die Rechnung mit der Lücke liegt als Durchschrift in der Akte');
  });

test('--ablegen hinterlässt die Durchschrift des Belegs, nicht nur die Zeile darüber',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    /*
     * **Der Fund vom 11. September, abends.** Die Runde davor nahm den vollen
     * Belegtext aus dem Journal — richtig, eine Journalzeile ist keine
     * Urkunde. Danach landete er **nirgendwo**: `--ablegen` schrieb eine Zeile
     * und druckte den Beleg auf den Bildschirm. § 132 BAO verlangt die Belege
     * sieben Jahre, § 11 Abs 2 UStG vom Aussteller eine Durchschrift jeder
     * Rechnung.
     */
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0111',
      '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08', '--ablegen'],
    { ...mitUid(u.ordner), VORGANG_ABLAGE: akte });
    assert.equal(e.code, 0, e.aus);

    const datei = join(akte, 'belege-2026', 'RE-2026-0001.txt');
    assert.equal(existsSync(datei), true, `keine Durchschrift abgelegt:\n${e.aus}`);
    const durchschrift = readFileSync(datei, 'utf8');

    // **Dasselbe Papier, nicht ein zweites.** Was abgelegt ist, muss das sein,
    // was hinausgeht — sonst sind es zwei Belege für einen Geschäftsfall.
    assert.ok(durchschrift.includes('RE-2026-0001'), 'die Nummer fehlt auf der Durchschrift');
    assert.ok(durchschrift.includes('Baustellenweg'),
      'ohne Anschrift ist es keine Abschrift der Rechnung');
    assert.ok(e.aus.includes(durchschrift.trim()),
      'gedruckt wurde ein anderer Text als abgelegt');

    // Und die Zeile im Journal bleibt der Betreff — die Anschrift steht jetzt
    // genau einmal in der Akte, nämlich auf der Durchschrift.
    const eintrag = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
      .trim().split('\n').map((z) => JSON.parse(z)).find((z) => z.typ === 'eintrag').eintrag;
    assert.ok(!eintrag.text.includes('Baustellenweg'));
  });

/* ------------------------------------------------------------------ *
 * Die dritte Stufe: die Absage (11. September 2026)
 *
 * Der Betrieb konnte drei Dinge schreiben, und alle drei sagten ja. Für das
 * Nein gab es nichts — obwohl `darfVorgangLaufen` die Gründe einzeln aufzählt,
 * in der Sprache des Betriebs.
 * ------------------------------------------------------------------ */

test('die Lieferantenbestellung geht mit ihrer Durchschrift in die Akte',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    /*
     * **Der Fund vom 12. September.** `erzeugeBestellungen` baut den Text
     * seit dem 30. August, und `npm run vorgang` **zeigt** ihn unter jedem
     * Angebot. Abgelegt wurde er nie: Von den fünf Papieren eines
     * Geschäftsfalls war er das einzige, das nur auf dem Bildschirm stand.
     *
     * > **Wenn die Ware kommt, ist die Bestellung das Papier, gegen das
     * > jemand sie prüft.**
     */
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0161',
      '--stufe', 'bestellung', '--bezahlt', '2026-09-10', '--ablegen'],
    { VORGANG_ABLAGE: akte, VORGANG_LIEFERANTEN: mitLieferzeit(u.ordner) });
    assert.equal(e.code, 0, e.aus);

    // Die Nummer steht auf dem Papier: Vorgangsnummer plus Teillieferung.
    // Ein eigener Nummernkreis wäre eine zweite Zahlenreihe für dasselbe
    // Blatt — `ARTEN` sagt das seit heute ausdrücklich.
    const datei = join(akte, 'belege-2026', 'LB-2026-0161-01.txt');
    assert.equal(existsSync(datei), true, `keine Durchschrift abgelegt:\n${e.aus}`);
    const durchschrift = readFileSync(datei, 'utf8');
    assert.ok(durchschrift.includes('2026-0161-01'), 'die Bestellnummer fehlt');
    assert.ok(e.aus.includes(durchschrift.trim()), 'gedruckt wurde ein anderer Text als abgelegt');

    const eintrag = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
      .trim().split('\n').map((z) => JSON.parse(z)).find((z) => z.typ === 'eintrag').eintrag;
    assert.equal(eintrag.art, 'lieferantenbestellung');
    assert.equal(eintrag.nummer, '2026-0161-01');
    assert.equal(typeof eintrag.betragNetto, 'number', 'der Einkaufswert fehlt');
    // Kein Lieferantenname im Journal: Gate 39 hält den Bezugsweg von jedem
    // Kundenbeleg fern, und die Akte ist nicht der Ort, ihn zu wiederholen.
    assert.ok(!eintrag.text.includes('Poschacher'));
  });

test('ohne Zahlungseingang gibt es keine Lieferantenbestellung',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    // Gate 20 lässt sie erst nach dem Zahlungseingang. Den sieht nur, wer den
    // Kontoauszug liest — dieses Haus sieht ihn nicht und erfindet ihn nicht.
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0162',
      '--stufe', 'bestellung', '--ablegen'],
    { VORGANG_ABLAGE: akte, VORGANG_LIEFERANTEN: mitLieferzeit(u.ordner) });
    assert.equal(e.code, 1, e.aus);
    assert.match(e.aus, /fehlt --bezahlt/);
    assert.equal(existsSync(join(akte, 'belege-2026')), false);
  });

test('die Absage geht mit ihrer Durchschrift in die Akte',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    /*
     * **Der vierte Brief, von dem nichts blieb — 12. September 2026.**
     * Angebot, Auftragsbestätigung und Rechnung gehen seit dem 11. September
     * mit ihrer Durchschrift in die Akte; die Absage ging hinaus und war
     * fort. Der Brief des Kunden wird seit dem 4. September aufgezeichnet,
     * die Antwort darauf nicht (§ 132 Abs 1 BAO, § 212 UGB).
     */
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0151',
      '--stufe', 'absage', '--ablegen'], { VORGANG_ABLAGE: akte });
    assert.equal(e.code, 0, e.aus);
    assert.match(e.aus, /Abgelegt: absage als lfd\. 1/);

    // Ohne Nummernkreis: Rückführbar ist sie über den Vorgang
    // (§ 131 Abs 1 Z 5 BAO), und so heißt auch ihre Durchschrift.
    const datei = join(akte, 'belege-2026', 'AS-2026-0151.txt');
    assert.equal(existsSync(datei), true, `keine Durchschrift abgelegt:\n${e.aus}`);
    const durchschrift = readFileSync(datei, 'utf8');
    assert.ok(durchschrift.includes('Zu Ihrer Anfrage 2026-0151'));
    assert.ok(e.aus.includes(durchschrift.trim()), 'gedruckt wurde ein anderer Text als abgelegt');

    const eintrag = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
      .trim().split('\n').map((z) => JSON.parse(z)).find((z) => z.typ === 'eintrag').eintrag;
    assert.equal(eintrag.art, 'absage');
    assert.equal(eintrag.nummer, null);
    assert.equal(eintrag.vorgang, '2026-0151');
    // Kein Betrag, und das ist keine Lücke: Die Absage nennt keinen.
    assert.equal(eintrag.betragBrutto, null);
    // Im Journal steht die Zahl der Gründe, nicht die Gründe — und nicht die
    // Anschrift des Kunden.
    assert.match(eintrag.text, /Grund\/Gründe/);
    assert.ok(!eintrag.text.includes('Baustellenweg'));
  });

test('ohne --ablegen bleibt von der Absage nichts liegen',
  { skip: !vorhanden && 'preise/ fehlt' }, () => {
    const u = baueUmgebung();
    const akte = wegwerfordner('akte-');
    const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0152',
      '--stufe', 'absage'], { VORGANG_ABLAGE: akte });
    assert.equal(e.code, 0, e.aus);
    assert.match(e.aus, /Nichts abgelegt/);
    assert.equal(existsSync(join(akte, 'journal-2026.jsonl')), false);
    assert.equal(existsSync(join(akte, 'belege-2026')), false);
  });

test('--stufe absage schreibt den Brief an den Kunden', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0100',
    '--stufe', 'absage']);
  assert.equal(e.code, 0, e.aus);
  assert.match(e.aus, /Zu Ihrer Anfrage 2026-0100/);
  assert.match(e.aus, /Musterbau GmbH/);
  assert.match(e.aus, /nicht zustande gekommen/);
  // Die beiden gemessenen Lecks: eine Gate-Nummer und der Name des
  // Lieferanten. Beide stehen in den internen Gründen, und keiner darf in
  // einer Kundenmail landen.
  assert.ok(!e.aus.includes('Gate '), `eine Gate-Nummer in der Absage:\n${e.aus}`);
  assert.ok(!e.aus.includes('Poschacher'), `der Lieferantenname in der Absage:\n${e.aus}`);
  // Und sie sagt trotzdem, warum.
  assert.match(e.aus, /Liefertermin|Zahlungsweg|Unternehmer/);
});

test('eine unbekannte Stufe wird abgewiesen', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0101',
    '--stufe', 'gutschrift']);
  assert.notEqual(e.code, 0);
  assert.match(e.aus, /absage/);
});

/*
 * **Die vierte Stufe: die Rechnung — 11. September 2026.**
 *
 * Sie hätte es seit dem 2. September geben können; was fehlte, war der Befehl.
 * Die Begründung dafür stand in der Betriebskette und warf zwei Dinge
 * zusammen: **festzustellen**, dass bezahlt wurde, braucht den Kontoauszug —
 * **die Rechnung zu schreiben** braucht nur, dass der Betreiber es eingibt.
 */

test('ohne Lieferdatum und Zahlungseingang entsteht keine Rechnung', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0101', '--stufe', 'rechnung']);
  assert.equal(e.code, 1, e.aus);
  assert.match(e.aus, /Für eine Rechnung fehlt ein Datum/);
  assert.match(e.aus, /--geliefert/);
  assert.match(e.aus, /--bezahlt/);
});

test('ohne UID des Ausstellers entsteht heute keine Rechnung', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  /**
   * **Der heutige Stand, und er ist richtig.** Die UID-Nummer des Ausstellers
   * ist Pflichtangabe nach § 11 Abs 1 Z 6 UStG und eine der vier Angaben, die
   * der Auftraggeber noch liefern muss. Dieser Fall wird rot, sobald sie
   * kommt — und dann gehört er umgeschrieben, nicht gelöscht.
   */
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0102',
    '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08']);
  assert.equal(e.code, 1, e.aus);
  assert.match(e.aus, /UID-Nummer des Ausstellers/);
});

/** Ein Betreiber mit allen Pflichtangaben — sonst bleibt der Weg ungefahren. */
function mitUid(ordner) {
  const datei = join(ordner, 'betreiber.json');
  writeFileSync(datei, JSON.stringify(
    { ...lies(pfad('../data/betreiber.json')), uid: 'ATU87654321' }, null, 2,
  ));
  return { VORGANG_BETREIBER: datei };
}

test('mit beiden Daten entsteht eine Rechnung nach § 11 UStG', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0102',
    '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08'],
  mitUid(u.ordner));
  assert.equal(e.code, 0, e.aus);
  assert.match(e.aus, /Musterbau GmbH/);
  assert.match(e.aus, /ATU12345675/, 'die UID des Empfängers ist Pflichtangabe');
  assert.match(e.aus, /ATU87654321/, 'und die des Ausstellers');
  assert.match(e.aus, /2026-09-09/, 'das Lieferdatum steht auf der Rechnung');
  assert.match(e.aus, /20 ?%/, 'der Steuersatz steht drauf');
});

test('die Rechnungsnummer fällt erst beim Ablegen', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  // Ein abgebrochener Lauf darf keine Nummer aus dem fortlaufenden Kreis
  // verbrennen — § 11 Abs 1 Z 3 UStG verlangt ihn lückenlos.
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0103',
    '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08'],
  mitUid(u.ordner));
  assert.equal(e.code, 0, e.aus);
  assert.match(e.aus, /fällt erst beim Ablegen/);
});

test('ein unbekannter Zahlweg hält die Rechnung auf', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  /**
   * Der Zahlungsvermerk ist keine Pflichtangabe nach § 11 UStG — er steht in
   * Punkt 9 der eigenen AGB. Ohne ihn überweist die Buchhaltung des Kunden
   * ein zweites Mal.
   */
  const u = baueUmgebung();
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0104',
    '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08',
    '--zahlweg', 'bargeld-in-der-hosentasche'], mitUid(u.ordner));
  assert.equal(e.code, 1, e.aus);
  assert.match(e.aus, /darf nicht gestellt werden/);
  assert.match(e.aus, /Zahlungsvermerk unbrauchbar/);
});

test('ein Beleg mit einem Internum geht nicht hinaus', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  /**
   * **Der Prüfer, den die drei Belege bis zum 11. September nicht hatten.**
   * Die Absage bekam ihn am 10. September mit dem Satz, geprüft würde sie
   * sonst von niemandem, „denn die Interna-Prüfung läuft über gebaute Seiten
   * und Anzeigentexte, nicht über eine Mail von Hand". Für Angebot,
   * Bestätigung und Rechnung galt dasselbe — nur wurden die schon gedruckt.
   *
   * Geprüft wird hier das **Verhalten**, nicht der Quelltext: Trägt der
   * Aussteller einen Namen, den `src/interna.js` als Bezugsweg führt, muss
   * der Lauf rot enden statt das Blatt auszugeben.
   */
  const u = baueUmgebung();
  const datei = join(u.ordner, 'betreiber-intern.json');
  writeFileSync(datei, JSON.stringify(
    { ...lies(pfad('../data/betreiber.json')), firma: 'Poschacher Handels GmbH' }, null, 2,
  ));
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0105'],
    { VORGANG_BETREIBER: datei });
  assert.equal(e.code, 1, e.aus);
  assert.match(e.aus, /trägt ein Internum/);
  assert.match(e.aus, /Bezugsweg/);
});


test('--ablegen zieht bei der Rechnung eine Nummer und schreibt sie ins Journal', { skip: !vorhanden && 'preise/ fehlt' }, () => {
  /**
   * **Der Satz, den das Werkzeug über sich selbst sagt.** Ohne `--ablegen`
   * schreibt es: *„Mit `--ablegen` wird sie gezogen und der Beleg ins Journal
   * geschrieben."* Am 11. September war das eine Zusage über den eigenen
   * Betrieb, die nicht stimmte — die Stufe endete vor der Ablage.
   */
  const u = baueUmgebung();
  const akte = join(u.ordner, 'akte');
  const e = lauf([u.anfrageDatei, '--kunde', u.kundeDatei, '--nummer', '2026-0110',
    '--stufe', 'rechnung', '--geliefert', '2026-09-09', '--bezahlt', '2026-09-08', '--ablegen'],
  { ...mitUid(u.ordner), VORGANG_ABLAGE: akte });
  assert.equal(e.code, 0, e.aus);
  assert.match(e.aus, /Abgelegt: Rechnungsnummer RE-2026-0001/);

  /*
   * **Und im Journal steht der Betreff, nicht der Beleg.** Was dort steht,
   * steht nach § 132 BAO sieben Jahre; die Anschrift des Kunden steht schon
   * auf der Rechnung und gehört nicht ein zweites Mal in die Akte.
   */
  const zeilen = readFileSync(join(akte, 'journal-2026.jsonl'), 'utf8')
    .trim().split('\n').map((z) => JSON.parse(z));
  // Zwei Zeilen: die Nummernvergabe und der Eintrag. Die Vergabe steht
  // getrennt da, damit sich eine gezogene Nummer auch dann nachweisen lässt,
  // wenn der Beleg danach nicht zustande kam.
  assert.equal(zeilen.length, 2, JSON.stringify(zeilen));
  const vergabe = zeilen.find((z) => z.typ === 'nummernvergabe');
  const eintrag = zeilen.find((z) => z.typ === 'eintrag')?.eintrag;
  assert.equal(vergabe.nummer, 'RE-2026-0001');
  assert.equal(eintrag.nummer, 'RE-2026-0001', 'gedruckt und abgelegt unter derselben Nummer');
  assert.equal(eintrag.art, 'rechnung');
  assert.ok(!eintrag.text.includes('Baustellenweg'),
    'die Anschrift des Kunden steht ein zweites Mal in der Akte');
  assert.match(eintrag.text, /Position\(en\)/);

  /*
   * **Und beide Beträge.** Die Nettospalte ist die Bemessungsgrundlage der
   * Umsatzsteuervoranmeldung; bis zum 11. September stand dort `null`, weil
   * `erzeugeRechnung` als einzige der drei Belegarten ihren Nettobetrag nicht
   * mitgab.
   */
  assert.equal(typeof eintrag.betragNetto, 'number', 'der Nettobetrag fehlt im Journal');
  assert.ok(eintrag.betragNetto > 0 && eintrag.betragNetto < eintrag.betragBrutto);
});
