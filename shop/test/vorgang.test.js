/**
 * Der Vorgang als Klammer.
 *
 * Diese Testdatei hält zwei Dinge fest: dass der Vorgang aus **einem** Satz
 * Kundendaten entsteht, und dass die Klammer es meldet, wenn ein Papier aus der
 * Reihe fällt. Die zweite Hälfte ist die wichtigere — eine Klammer, die nie
 * anschlägt, ist von einer, die nicht anschlagen **kann**, nicht zu
 * unterscheiden.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { baueVorgang, darfVorgangLaufen, ablageEintraege } from '../src/vorgang.js';
import { erzeugeRechnung } from '../src/beleg.js';
import { pruefeVorgangsklammer, leseBelegkopf, pruefeMargenleck } from '../src/kontrolle.js';
import { neueAblage, haltefest, vorgangsakte } from '../src/ablage.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);

const kundeA = {
  firma: 'Baumeister Alpen GmbH',
  uid: 'ATU12345675',
  email: 'buero@alpen.at',
  strasse: 'Alpenweg 1',
  plz: '6020',
  ort: 'Innsbruck',
  telefon: '+43 512 111',
  unternehmerBestaetigt: true,
};

const kundeB = { ...kundeA, firma: 'Bau Donau e.U.', strasse: 'Donaustraße 9', plz: '4020', ort: 'Linz' };

const betreiber = { firma: 'Testbetrieb e.U., Hauptstraße 2, 4910 Ried', uid: 'ATU98765432' };

const warenkorb = berechneWarenkorb(
  [{ sku: 'AB-RD-375', menge: 5 }, { sku: 'ZB-DB-150', menge: 2 }],
  katalog,
);

const machVorgang = (kundendaten = kundeA) =>
  baueVorgang({
    vorgangsnummer: 'B-2026-0007',
    kundendaten,
    warenkorb,
    betreiber,
    datum: '2026-08-16',
    lieferdatum: '2026-08-30',
    rechnungsnummer: 'RE-2026-0042',
    zahlungEingegangen: true,
  });

/* ------------------------------------------------------------------ *
 * Der Vorgang entsteht aus einer Hand
 * ------------------------------------------------------------------ */

test('Ein Vorgang ohne Nummer wird abgewiesen', () => {
  assert.throws(
    () => baueVorgang({ kundendaten: kundeA, warenkorb }),
    /braucht eine Nummer/,
  );
});

test('Alle Bestellungen tragen die Nummer des Vorgangs', () => {
  const v = machVorgang();
  assert.ok(v.bestellungen.length >= 2, 'Für diese Prüfung braucht es mehrere Lieferanten');
  for (const b of v.bestellungen) {
    assert.ok(b.nummer.startsWith('B-2026-0007'), `${b.nummer} fällt aus der Reihe`);
  }
});

test('Beleg und Bestellung nennen denselben Kunden', () => {
  const v = machVorgang();
  assert.equal(leseBelegkopf(v.rechnung.text).empfaenger[0], kundeA.firma);
  assert.equal(leseBelegkopf(v.angebot.text).empfaenger[0], kundeA.firma);
  assert.ok(v.bestellungen.length >= 2, 'Ohne Bestellungen prüft die Schleife nichts');
  for (const b of v.bestellungen) {
    assert.match(b.text, new RegExp(kundeA.firma));
  }
});

test('Die Klammer eines aus einer Hand gebauten Vorgangs ist geschlossen', () => {
  const p = pruefeVorgangsklammer(machVorgang());
  assert.equal(p.geschlossen, true, p.abweichungen.join(' | '));
  assert.deepEqual(p.abweichungen, []);
});

test('Alle Ablageeinträge tragen dieselbe Vorgangsnummer', () => {
  const v = machVorgang();
  const ablage = neueAblage();
  const eintraege = ablageEintraege(v, '2026-08-16T10:00:00Z');
  assert.ok(eintraege.length >= 3, 'Bestellungen plus Angebot');

  for (const e of eintraege) haltefest(ablage, e);
  assert.equal(vorgangsakte(ablage, 'B-2026-0007').length, eintraege.length);
});

/* ------------------------------------------------------------------ *
 * Die Klammer schlägt an
 *
 * Der nachgewiesene Fall: Bestellung und Rechnung mit den Daten zweier
 * verschiedener Kunden gebaut. Beide Papiere sind für sich tadellos — die
 * Rechnung ist nach § 11 UStG vollständig, die Gegenprobe an der Bestellung
 * ist deckungsgleich. Nur zusammen ergeben sie keinen Sinn.
 * ------------------------------------------------------------------ */

test('Eine Rechnung auf einen anderen Kunden fällt auf', () => {
  const v = machVorgang();
  const vertauscht = {
    ...v,
    rechnung: erzeugeRechnung(warenkorb, {
      nummer: 'RE-2026-0042',
      datum: '2026-08-16',
      lieferdatum: '2026-08-30',
      kunde: kundeB,
      betreiber,
    }),
  };

  // Für sich betrachtet ist diese Rechnung einwandfrei — das ist der Punkt.
  assert.equal(vertauscht.rechnung.vollstaendig, true);

  const p = pruefeVorgangsklammer(vertauscht);
  assert.equal(p.geschlossen, false);
  assert.ok(p.abweichungen.some((a) => /Rechnung geht an/.test(a)), p.abweichungen.join(' | '));
});

test('Eine auf eine fremde Baustelle umgelenkte Bestellung fällt auf', () => {
  const v = machVorgang();
  const umgelenkt = {
    ...v,
    bestellungen: v.bestellungen.map((b) => ({
      ...b,
      text: b.text.replace('6020 Innsbruck', '4020 Linz'),
    })),
  };

  const p = pruefeVorgangsklammer(umgelenkt);
  assert.equal(p.geschlossen, false);
  assert.ok(p.abweichungen.some((a) => /Ware geht nach 4020 Linz/.test(a)), p.abweichungen.join(' | '));
});

test('Eine Bestellnummer aus einem fremden Vorgang fällt auf', () => {
  const v = machVorgang();
  const fremd = {
    ...v,
    bestellungen: [{ ...v.bestellungen[0], nummer: 'B-2026-0099-01' }, ...v.bestellungen.slice(1)],
  };

  assert.equal(pruefeVorgangsklammer(fremd).geschlossen, false);
  assert.equal(darfVorgangLaufen(fremd).erlaubt, false);
  assert.ok(darfVorgangLaufen(fremd).gruende.some((g) => /gehört nicht zu Vorgang/.test(g)));
});

test('Eine verschwundene Lieferantenbestellung fällt auf', () => {
  const v = machVorgang();
  const halb = { ...v, bestellungen: v.bestellungen.slice(0, 1) };

  const p = pruefeVorgangsklammer(halb);
  assert.equal(p.geschlossen, false);
  assert.ok(
    p.abweichungen.some((a) => /summieren/.test(a)),
    `Der fehlende Wareneinsatz wurde nicht gemeldet: ${p.abweichungen.join(' | ')}`,
  );
  assert.ok(
    p.abweichungen.some((a) => /Positionen werden bestellt/.test(a)),
    `Die fehlende Position wurde nicht gemeldet: ${p.abweichungen.join(' | ')}`,
  );
});

test('Ware und Rechnung an verschiedene Firmen fallen auf, ohne Blick auf den Vorgang', () => {
  // Die einzige Prüfung der Klammer, die zwei gerenderte Papiere gegeneinander
  // hält. Beide Namen werden aus dem Text gelesen; die Erklärung des Vorgangs
  // spielt dabei keine Rolle — sie könnte selbst falsch sein.
  const v = machVorgang();
  const geteilt = {
    ...v,
    kunde: { ...v.kunde, firma: 'Bau Donau e.U.' },
    auftrag: { ...v.auftrag, lieferadresse: { ...v.auftrag.lieferadresse, name: 'Bau Donau e.U.' } },
    rechnung: erzeugeRechnung(warenkorb, {
      nummer: 'RE-2026-0042',
      datum: '2026-08-16',
      lieferdatum: '2026-08-30',
      kunde: kundeB,
      betreiber,
    }),
  };

  const p = pruefeVorgangsklammer(geteilt);
  assert.equal(p.geschlossen, false);
  assert.ok(
    p.abweichungen.some((a) => /Ware geht an .*die Rechnung an/.test(a)),
    `Die Papiere wurden nicht gegeneinander gehalten: ${p.abweichungen.join(' | ')}`,
  );
});

test('Wer die Annahme fallen lässt, schaltet genau diese Prüfung ab', () => {
  // Sobald die Baustelle eine andere Adresse hat als die Rechnung, ist ein
  // Vergleich Papier gegen Papier falsch. Das Feld sagt es ausdrücklich; die
  // übrigen Prüfungen der Klammer bleiben in Kraft.
  const v = machVorgang();
  const abweichend = {
    ...v,
    lieferungAnRechnungsempfaenger: false,
    kunde: { ...v.kunde, firma: 'Bau Donau e.U.' },
    auftrag: { ...v.auftrag, lieferadresse: { ...v.auftrag.lieferadresse, name: 'Bau Donau e.U.' } },
    rechnung: erzeugeRechnung(warenkorb, {
      nummer: 'RE-2026-0042',
      datum: '2026-08-16',
      lieferdatum: '2026-08-30',
      kunde: kundeB,
      betreiber,
    }),
  };

  const p = pruefeVorgangsklammer(abweichend);
  assert.ok(
    !p.abweichungen.some((a) => /Ware geht an .*die Rechnung an/.test(a)),
    'Die abgeschaltete Prüfung schlägt trotzdem an',
  );
  // Aber die Bestelltexte nennen weiterhin die alte Firma — das bleibt ein Fund.
  assert.equal(p.geschlossen, false);
});

test('Ein Vorgang ganz ohne Bestellung wird nicht stillschweigend hingenommen', () => {
  const v = machVorgang();
  const leer = { ...v, bestellungen: [] };

  assert.equal(pruefeVorgangsklammer(leer).geschlossen, false);
  assert.equal(darfVorgangLaufen(leer).erlaubt, false);
});

/* ------------------------------------------------------------------ *
 * Die bestehenden Sperren bleiben in Kraft
 * ------------------------------------------------------------------ */

test('Die Platzhaltersperre hält den Vorgang weiterhin an', () => {
  const f = darfVorgangLaufen(machVorgang());
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Platzhalterpreise/.test(g)), f.gruende.join(' | '));
});

test('Untaugliche Kundendaten halten den Vorgang an, ohne den Entwurf zu verweigern', () => {
  const v = machVorgang({ ...kundeA, unternehmerBestaetigt: false });
  assert.ok(v.rechnung.text.length > 0, 'Der Entwurf entsteht trotzdem');

  const f = darfVorgangLaufen(v);
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Kundendaten: .*Gate 7/.test(g)), f.gruende.join(' | '));
});

/* ------------------------------------------------------------------ *
 * Die Baustelle schaltet die Papier-gegen-Papier-Prüfung ab — von selbst
 * ------------------------------------------------------------------ */

test('Mit abweichender Baustelle liest der Vorgang die Annahme aus den Daten', () => {
  const mitBaustelle = {
    ...kundeA,
    baustelle: {
      name: 'Neubau Familie Berger',
      strasse: 'Feldgasse 27',
      plz: '4910',
      ort: 'Ried im Innkreis',
      land: 'AT',
      telefon: '+43 664 9998877',
    },
  };

  const ohne = machVorgang();
  const mit = machVorgang(mitBaustelle);

  assert.equal(ohne.lieferungAnRechnungsempfaenger, true);
  assert.equal(mit.lieferungAnRechnungsempfaenger, false, 'nicht mehr fest verdrahtet');
  assert.equal(mit.kundenpruefung.gueltig, true, mit.kundenpruefung.fehler.join(' | '));
});

test('Ware zur Baustelle, Rechnung ans Büro — und die Klammer bleibt geschlossen', () => {
  const mitBaustelle = {
    ...kundeA,
    baustelle: {
      name: 'Neubau Familie Berger',
      strasse: 'Feldgasse 27',
      plz: '4910',
      ort: 'Ried im Innkreis',
      land: 'AT',
      telefon: '+43 664 9998877',
    },
  };
  const v = machVorgang(mitBaustelle);

  for (const b of v.bestellungen) assert.match(b.text, /4910 Ried im Innkreis/);
  assert.equal(leseBelegkopf(v.rechnung.text).empfaenger[0], kundeA.firma);
  assert.match(v.rechnung.text, /6020 Innsbruck/);

  const p = pruefeVorgangsklammer(v);
  assert.equal(p.geschlossen, true, p.abweichungen.join(' | '));
});

test('Auch mit Baustelle fällt eine umgelenkte Bestellung auf', () => {
  // Die abgeschaltete Prüfung ist genau eine; die übrigen bleiben scharf.
  const mitBaustelle = {
    ...kundeA,
    baustelle: {
      name: 'Neubau Familie Berger',
      strasse: 'Feldgasse 27',
      plz: '4910',
      ort: 'Ried im Innkreis',
      land: 'AT',
      telefon: '+43 664 9998877',
    },
  };
  const v = machVorgang(mitBaustelle);
  const umgelenkt = {
    ...v,
    bestellungen: v.bestellungen.map((b) => ({
      ...b,
      text: b.text.replace('4910 Ried im Innkreis', '4020 Linz'),
    })),
  };

  const p = pruefeVorgangsklammer(umgelenkt);
  assert.equal(p.geschlossen, false);
  assert.ok(p.abweichungen.some((a) => /Ware geht nach 4020 Linz/.test(a)), p.abweichungen.join(' | '));
});

/* ------------------------------------------------------------------ *
 * Die Auftragsbestätigung gehört zum Vorgang
 * ------------------------------------------------------------------ */

test('Der Vorgang erzeugt eine Auftragsbestätigung mit eigener Nummer', () => {
  const v = machVorgang();
  assert.ok(v.bestaetigung, 'Die Bestätigung fehlt im Vorgang');
  assert.equal(leseBelegkopf(v.bestaetigung.text).nummer, 'AB-B-2026-0007');
  assert.equal(leseBelegkopf(v.bestaetigung.text).empfaenger[0], kundeA.firma);
});

test('Die Bestätigung trägt die Lieferhinweise ins Papier', () => {
  const v = machVorgang();
  assert.match(v.bestaetigung.text, /§ 377 UGB/);
});

test('Die Klammer prüft auch die Auftragsbestätigung', () => {
  const v = machVorgang();
  const vertauscht = {
    ...v,
    bestaetigung: { ...v.bestaetigung, text: v.bestaetigung.text.replace(kundeA.firma, 'Bau Donau e.U.') },
  };

  const p = pruefeVorgangsklammer(vertauscht);
  assert.equal(p.geschlossen, false);
  assert.ok(
    p.abweichungen.some((a) => /Auftragsbestätigung geht an/.test(a)),
    `Die Bestätigung wurde nicht geprüft: ${p.abweichungen.join(' | ')}`,
  );
});

test('Die Annahme steht als eigene Freigabe neben Bestellung und Rechnung', () => {
  const v = machVorgang();
  assert.ok(v.freigabe.annahme, 'Die Annahme fehlt in den Freigaben');
  assert.equal(v.freigabe.annahme.erlaubt, false, 'Platzhalterpreise halten sie an');
  assert.ok(darfVorgangLaufen(v).gruende.some((g) => /^Annahme: /.test(g)));
});

test('Die Ablage vermerkt den Vertragsschluss', () => {
  const v = machVorgang();
  const eintraege = ablageEintraege(v, '2026-08-16T10:00:00Z');
  const vermerk = eintraege.find((e) => /Auftragsbestätigung an/.test(e.text));
  assert.ok(vermerk, 'Kein Vermerk zum Vertragsschluss');
  assert.equal(vermerk.vorgang, 'B-2026-0007');
  assert.match(vermerk.text, /AGB Punkt 2/);
});

/* ------------------------------------------------------------------ *
 * Kein Papier an den Kunden verrät die Handelsspanne
 * ------------------------------------------------------------------ */

test('Die Kundenbelege eines gewöhnlichen Vorgangs sind dicht', () => {
  const p = pruefeMargenleck(machVorgang());
  assert.equal(p.dicht, true, p.funde.join(' | '));
});

test('Auch ein Warenkorb unter dem Mindestbestellwert bleibt dicht', () => {
  // Genau dieser Fall hat geleckt: Der Hinweis zum Mindestbestellwert stand im
  // Angebot und nannte den Einkaufswert.
  const klein = berechneWarenkorb([{ sku: 'DR-100-050', menge: 2 }], katalog);
  assert.equal(klein.bestellbar, false, 'Vorbedingung des Testfalls');

  const v = baueVorgang({
    vorgangsnummer: 'B-2026-0008', kundendaten: kundeA, warenkorb: klein, betreiber,
    datum: '2026-08-16', lieferdatum: '2026-08-30', rechnungsnummer: 'RE-1',
  });
  assert.ok(v.angebot.text.includes('zu klein'), 'Der Hinweis muss überhaupt dastehen');

  const p = pruefeMargenleck(v);
  assert.equal(p.dicht, true, p.funde.join(' | '));
});

test('Ein untergeschobener Einkaufswert im Angebot fällt auf', () => {
  const v = machVorgang();
  const undicht = {
    ...v,
    angebot: { ...v.angebot, text: v.angebot.text + `\nWareneinsatz: ${warenkorb.einkaufNetto} €` },
  };

  const p = pruefeMargenleck(undicht);
  assert.equal(p.dicht, false);
  assert.ok(p.funde.some((f) => /^Angebot: Wareneinsatz gesamt/.test(f)), p.funde.join(' | '));
});

test('Ein Einkaufswert je Lieferant fällt ebenso auf wie die Summe', () => {
  const v = machVorgang();
  const teil = warenkorb.teillieferungen[0];
  const undicht = {
    ...v,
    rechnung: { ...v.rechnung, text: v.rechnung.text + `\nintern: ${teil.einkaufNetto} €` },
  };

  const p = pruefeMargenleck(undicht);
  assert.equal(p.dicht, false);
  assert.ok(p.funde.some((f) => f.startsWith('Rechnung: Einkauf ')), p.funde.join(' | '));
});
