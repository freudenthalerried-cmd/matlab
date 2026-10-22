/**
 * Die Beispielrechnungen — und die Regeln, ohne die sie irreführend wären.
 *
 * Jede Regel dieses Moduls muss hier feuern; `npm run pruefe-regeln` hält das
 * nach. Gebaut werden die Lagen von Hand: Zwei der Fälle gibt es im Bestand
 * von heute nicht, und ein Test gegen den Bestand prüfte, was zufällig
 * gerade dasteht.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ZUORDNUNG, OHNE_RECHNUNG, beispielrechnung, rechnungssatz, rechnungsbefund, MARGENWOERTER,
} from '../src/beispielrechnung.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const EUR = (n) => `${n.toFixed(2).replace('.', ',')} €`;

const katalog = ladeBaustoffkatalog(
  JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')),
  {
    preise: {
      'POS-A': { ekNetto: 10, uvpNetto: 20, ekQuelle: 'bestaetigt' },
    },
  },
  JSON.parse(readFileSync(join(SHOP, 'data', 'lieferanten.json'), 'utf8')),
);

/* ------------------------------------------------------------------ *
 * Was die Rechnung zurückgibt — und was ausdrücklich nicht
 * ------------------------------------------------------------------ */

test('ohne Positionen gibt es keine Rechnung', () => {
  assert.equal(beispielrechnung({ umfang: 'x', positionen: [] }, katalog), null);
  assert.equal(beispielrechnung(null, katalog), null);
});

test('eine Position ohne gerechneten Preis lässt die Rechnung nicht stehen', () => {
  // **Eine Rechnung, in der eine Position fehlt, wird nicht gebaut.** Sie sähe
  // aus wie eine Summe für den genannten Umfang und wäre eine für einen
  // kleineren.
  const r = beispielrechnung({
    umfang: 'Ein Vorhaben',
    positionen: [{ sku: 'POS-GIBT-ES-NICHT', menge: 1, was: 'Etwas' }],
  }, katalog);
  assert.equal(r.steht, false);
  assert.match(r.grund, /ohne gerechneten Preis/);
  assert.match(r.grund, /POS-GIBT-ES-NICHT/);
});

test('die Rechnung trägt keine Spanne — kein Feld und kein Wort', () => {
  /*
   * Die Weisung vom 25. August lautet „keine spanne ausgeben", und neben dem
   * Warenwert steht in der Kampagnendatei der Deckungsbeitrag. Diese Probe ist
   * die Zusicherung, dass er nicht mitwandert.
   */
  const echt = ersteEchteRechnung();
  const text = JSON.stringify(echt).toLowerCase();
  // Ohne diese Zeile prüft die Schleife bei leerer Liste nichts — `pruefe-tests`
  // hat genau das gemeldet, und es ist dieselbe Sorte wie „nicht gefahren ist
  // nicht grün".
  assert.ok(MARGENWOERTER.length >= 4, `nur ${MARGENWOERTER.length} Margenwörter`);
  for (const wort of MARGENWOERTER) {
    assert.ok(!text.includes(wort.toLowerCase()), `die Rechnung nennt „${wort}"`);
  }
});

function ersteEchteRechnung() {
  // Der Katalog des Bestands mit der echten Preisdatei — wenn sie fehlt,
  // bleibt die Probe ohne Aussage statt mit einer falschen.
  const pfad = join(SHOP, '..', 'preise', 'baustoff-preise.json');
  let preise;
  try {
    preise = JSON.parse(readFileSync(pfad, 'utf8'));
  } catch {
    return { steht: true, umfang: 'x', positionen: [], ausgelassen: [], warenwertNetto: 0, frachtNetto: 0, summeNetto: 0 };
  }
  const kat = ladeBaustoffkatalog(
    JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')),
    preise,
    JSON.parse(readFileSync(join(SHOP, 'data', 'lieferanten.json'), 'utf8')),
  );
  const korb = {
    umfang: 'Zwei Mantelsteine',
    positionen: [{ sku: 'POS-10837', menge: 2, was: 'Mantelsteine', position: 'Mantelsteine' }],
    ohne: [],
  };
  return beispielrechnung(korb, kat);
}

test('die Summe ist Warenwert plus Fracht, und die Positionen tragen den Warenwert', () => {
  const r = ersteEchteRechnung();
  if (!r.positionen.length) return; // ohne Preisdatei keine Aussage
  assert.equal(r.summeNetto, Math.round((r.warenwertNetto + r.frachtNetto) * 100) / 100);
  const ausPositionen = r.positionen.reduce((n, p) => n + p.betragNetto, 0);
  assert.equal(Math.round(ausPositionen * 100) / 100, r.warenwertNetto);
});

/* ------------------------------------------------------------------ *
 * Der Satz, den ein Assistent zitiert
 * ------------------------------------------------------------------ */

const lage = (ueber) => ({
  steht: true,
  umfang: 'Ein Kaminzug: Mantelsteine, gedämmtes Rohr',
  positionen: [{ was: 'Mantelsteine' }, { was: 'gedämmtes Rohr' }],
  warenwertNetto: 1146.21,
  frachtNetto: 90.5,
  summeNetto: 1236.71,
  ...ueber,
});

test('der Satz nennt Umfang, Summe, Positionen und was fehlt', () => {
  const satz = rechnungssatz(lage({ ausgelassen: [{ position: 'a', kunde: 'x' }] }), EUR);
  assert.match(satz, /^Ein Kaminzug: Mantelsteine, gedämmtes Rohr: 1236,71 € netto/);
  assert.match(satz, /2 Positionen/);
  assert.match(satz, /90,50 € Zustellung/);
  // Der Schluss ist die Zusicherung, nicht die Verzierung: Wer nur den Anfang
  // zitiert, zitiert damit immer noch etwas Richtiges.
  assert.match(satz, /keine Zusage$/);
});

test('bei einer ausgelassenen Position steht die Einzahl', () => {
  const satz = rechnungssatz(lage({ ausgelassen: [{ position: 'a', kunde: 'x' }] }), EUR);
  assert.match(satz, /1 Position der Systemliste ist nicht enthalten/);
  assert.doesNotMatch(satz, /1 Positionen/);
});

test('ohne Auslassung schweigt der Satz darüber', () => {
  const satz = rechnungssatz(lage({ ausgelassen: [] }), EUR);
  assert.doesNotMatch(satz, /nicht enthalten/);
});

test('eine Rechnung, die nicht steht, hat keinen Satz', () => {
  assert.equal(rechnungssatz({ steht: false }, EUR), null);
  assert.equal(rechnungssatz(null, EUR), null);
});

/* ------------------------------------------------------------------ *
 * Die Regeln, jede einmal gefeuert
 * ------------------------------------------------------------------ */

const grundlage = {
  slugs: ['kaminzug'],
  gruppen: ['Kamin'],
  rechnungen: [],
  zuordnung: [{ slug: 'kaminzug', gruppe: 'Kamin' }],
  ohneRechnung: [],
};

test('zuordnung-ohne-liste feuert', () => {
  const e = rechnungsbefund({ ...grundlage, slugs: [] });
  assert.ok(e.probleme.some((p) => p.regel === 'zuordnung-ohne-liste'), JSON.stringify(e.probleme));
});

test('zuordnung-ohne-korb feuert', () => {
  const e = rechnungsbefund({ ...grundlage, gruppen: [] });
  assert.ok(e.probleme.some((p) => p.regel === 'zuordnung-ohne-korb'));
});

test('korb-ohne-liste feuert', () => {
  const e = rechnungsbefund({ ...grundlage, gruppen: ['Kamin', 'Mörtel'] });
  const p = e.probleme.find((x) => x.regel === 'korb-ohne-liste');
  assert.ok(p, JSON.stringify(e.probleme));
  assert.match(p.satz, /eine Menge ohne Begründung ist eine geratene Menge/);
});

test('verzicht-zu-kurz feuert', () => {
  const e = rechnungsbefund({
    ...grundlage,
    gruppen: ['Kamin', 'Mörtel'],
    ohneRechnung: [{ gruppe: 'Mörtel', warum: 'zu kurz' }],
  });
  assert.ok(e.probleme.some((p) => p.regel === 'verzicht-zu-kurz'), JSON.stringify(e.probleme));
});

test('verzicht-ohne-korb feuert', () => {
  const e = rechnungsbefund({
    ...grundlage,
    ohneRechnung: [{ gruppe: 'Gibt-es-nicht', warum: 'x'.repeat(200) }],
  });
  assert.ok(e.probleme.some((p) => p.regel === 'verzicht-ohne-korb'));
});

test('verzicht-und-zuordnung feuert', () => {
  // Eine Gruppe bekommt eine Rechnung oder keine, nicht beides — sonst
  // deckt der Freibrief eine Rechnung, die trotzdem hinausgeht.
  const e = rechnungsbefund({
    ...grundlage,
    ohneRechnung: [{ gruppe: 'Kamin', warum: 'x'.repeat(200) }],
  });
  assert.ok(e.probleme.some((p) => p.regel === 'verzicht-und-zuordnung'));
});

test('auslassung-ohne-kundensatz feuert', () => {
  /*
   * **Der Fund vom 22. Oktober.** Der erste Anlauf reichte den internen Grund
   * durch, und sechs dieser Gründe nennen den Einkaufspreis. `findeInterna`
   * brach den Bau an den Systemseiten ab.
   */
  const e = rechnungsbefund({
    ...grundlage,
    rechnungen: [lage({ ausgelassen: [{ position: 'Fertigfußpaket', kunde: null }] })],
  });
  const p = e.probleme.find((x) => x.regel === 'auslassung-ohne-kundensatz');
  assert.ok(p, JSON.stringify(e.probleme));
  assert.match(p.satz, /der interne Grund darf nicht hinausgehen/);
});

test('umfang-nennt-die-positionen-nicht feuert', () => {
  // „Ein Kaminzug: 1.236,71 €" bei zwei von zehn Positionen ist der Preis für
  // einen halben Kamin.
  const e = rechnungsbefund({
    ...grundlage,
    rechnungen: [lage({
      umfang: 'Ein Kaminzug',
      ausgelassen: [{ position: 'a', kunde: 'x'.repeat(80) }],
    })],
  });
  const p = e.probleme.find((x) => x.regel === 'umfang-nennt-die-positionen-nicht');
  assert.ok(p, JSON.stringify(e.probleme));
  assert.match(p.satz, /Mantelsteine, gedämmtes Rohr/);
});

test('rechnung-nennt-marge feuert', () => {
  const e = rechnungsbefund({
    ...grundlage,
    rechnungen: [lage({ ausgelassen: [], deckungsbeitrag: 245.53 })],
  });
  assert.ok(e.probleme.some((p) => p.regel === 'rechnung-nennt-marge'), JSON.stringify(e.probleme));
});

test('summe-stimmt-nicht feuert', () => {
  const e = rechnungsbefund({
    ...grundlage,
    rechnungen: [lage({ ausgelassen: [], summeNetto: 1000 })],
  });
  assert.ok(e.probleme.some((p) => p.regel === 'summe-stimmt-nicht'));
});

test('positionen-tragen-den-warenwert-nicht feuert', () => {
  const e = rechnungsbefund({
    ...grundlage,
    rechnungen: [lage({
      ausgelassen: [],
      positionen: [{ was: 'Mantelsteine', betragNetto: 1 }, { was: 'gedämmtes Rohr', betragNetto: 1 }],
    })],
  });
  assert.ok(e.probleme.some((p) => p.regel === 'positionen-tragen-den-warenwert-nicht'));
});

test('die heile Lage meldet nichts', () => {
  const e = rechnungsbefund({
    ...grundlage,
    rechnungen: [lage({
      ausgelassen: [{ position: 'Fertigfußpaket', kunde: 'x'.repeat(80) }],
      positionen: [
        { was: 'Mantelsteine', betragNetto: 302.25 },
        { was: 'gedämmtes Rohr', betragNetto: 843.96 },
      ],
    })],
  });
  assert.deepEqual(e.probleme, []);
  assert.equal(e.sauber, true);
});

/* ------------------------------------------------------------------ *
 * Das Register gegen den Bestand
 * ------------------------------------------------------------------ */

test('jede Zuordnung nennt eine Systemliste, die es gibt', async () => {
  const { readdirSync } = await import('node:fs');
  const vorhanden = new Set(readdirSync(join(SHOP, 'inhalte', 'system'))
    .filter((d) => d.endsWith('.md')).map((d) => d.replace(/\.md$/, '')));
  assert.ok(ZUORDNUNG.length >= 3, `nur ${ZUORDNUNG.length} Zuordnungen — zu wenig zum Prüfen`);
  for (const z of ZUORDNUNG) {
    assert.ok(vorhanden.has(z.slug), `${z.slug} gibt es nicht`);
  }
});

test('jeder Verzicht nennt genau eine Gruppe und einen Grund, der trägt', () => {
  assert.ok(OHNE_RECHNUNG.length >= 1, 'die Liste ist gefüllt — sonst prüft die Schleife nichts');
  const gesehen = new Set();
  for (const o of OHNE_RECHNUNG) {
    assert.ok(o.gruppe, 'ein Verzicht ohne Gruppe deckt alles');
    assert.ok(!gesehen.has(o.gruppe), `${o.gruppe} steht zweimal`);
    gesehen.add(o.gruppe);
    assert.ok(o.warum.length >= 150, `${o.gruppe}: ${o.warum.length} Zeichen Grund`);
  }
});

test('der Umfangstext deckt sich mit warenkorbText der Kampagne', async () => {
  /*
   * **Zwei Funktionen, die gleich aussehen müssen.** `umfangstext` in diesem
   * Modul und `warenkorbText` in `bin/kampagne.mjs` bauen denselben Satz;
   * zusammenlegen ging nicht, weil das Werkzeug nicht in ein Modul gehört.
   * Diese Probe hält sie gegen die Körbe des Bestands, damit sie nicht still
   * auseinanderlaufen.
   */
  const { WARENKOERBE, warenkorbText } = await import('../bin/kampagne.mjs');
  const pfad = join(SHOP, '..', 'preise', 'baustoff-preise.json');
  let preise;
  try {
    preise = JSON.parse(readFileSync(pfad, 'utf8'));
  } catch {
    return; // ohne Preisdatei keine Aussage
  }
  const kat = ladeBaustoffkatalog(
    JSON.parse(readFileSync(join(SHOP, 'data', 'katalog-baustoff.json'), 'utf8')),
    preise,
    JSON.parse(readFileSync(join(SHOP, 'data', 'lieferanten.json'), 'utf8')),
  );
  assert.ok(ZUORDNUNG.length >= 3, `nur ${ZUORDNUNG.length} Zuordnungen — zu wenig zum Prüfen`);
  let geprueft = 0;
  for (const z of ZUORDNUNG) {
    const r = beispielrechnung(WARENKOERBE[z.gruppe], kat);
    if (!r?.steht) continue;
    assert.equal(r.umfang, warenkorbText(WARENKOERBE[z.gruppe]), `${z.gruppe}`);
    geprueft += 1;
  }
  assert.ok(geprueft >= 2, `nur ${geprueft} Rechnungen geprüft — zu wenig für eine Aussage`);
});
