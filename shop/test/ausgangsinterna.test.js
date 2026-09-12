/**
 * Trägt ein Ausgang nach draußen ein Internum?
 *
 * **Der Anlass, 11. September 2026.** Am Vortag ist herausgekommen, dass
 * Angebot, Auftragsbestätigung und Rechnung den Namen des Lieferanten trugen
 * — drei Nennungen in einem Angebot von 1.544 Zeichen —, während
 * `src/interna.js` genau diesen Namen seit dem 28. August als Bezugsweg
 * führt. Geprüft wurde das über jede gebaute Seite und über keinen Beleg.
 *
 * Die Sperre steht seither in `bin/vorgang.mjs`, also **im Werkzeug**. Das
 * Ausgangsverzeichnis zählt aber sechzehn Ausgänge, neun davon an einen
 * Kunden oder an jeden Besucher.
 *
 * > **Eine Sperre im Werkzeug gilt für den Weg durch dieses Werkzeug. Ein
 * > Ausgang ist aber eine Stelle, keine Strecke.**
 *
 * Diese Datei erzeugt an jedem kundennahen Ausgang einen **fertigen Text** und
 * schickt ihn durch `findeInterna`. Was hier nicht steht, steht mit Grund in
 * `OHNE_INTERNAPROBE` — und `internabefund` hält beides gegeneinander.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { internabefund, gehtNachDraussen, AUSGAENGE, OHNE_INTERNAPROBE } from '../src/aussentexte.js';
import { findeInterna } from '../src/interna.js';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import {
  erzeugeAngebot, erzeugeAuftragsbestaetigung, erzeugeGutschrift, erzeugeRechnung,
} from '../src/beleg.js';
import { erzeugeAbsage } from '../src/absage.js';
import { erzeugeImpressum } from '../src/rechtstexte.js';
import { kundenWarenkorb, oeffentlicherArtikel, oeffentlicherLieferant } from '../src/shopkern.js';
import { ladeBaustoffkatalog, ZIELMARGE } from '../src/baustoffkatalog.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const lies = (p) => JSON.parse(readFileSync(pfad(p), 'utf8'));

const preisPfad = pfad('../../preise/baustoff-preise.json');
const preiseDa = existsSync(preisPfad);

const katalog = ladeKatalog(
  { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') },
  0.35,
);
const korb = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 1 }, { sku: 'ZB-DB-150', menge: 2 }], katalog);
const betreiber = lies('../data/betreiber.json');
const GIFTKUNDE_FIRMA = 'Musterbau GmbH (vormals Poschacher Hoch- und Tiefbau)';

const kunde = {
  firma: 'Musterbau GmbH',
  strasse: 'Baustellenweg 7',
  plz: '4600',
  ort: 'Wels',
  uid: 'ATU12345675',
  land: 'AT',
};

/**
 * Derselbe Kunde mit einem geführten Internum im Firmennamen.
 *
 * **Warum das dazugehört.** Eine Probe, die über einen sauberen Text läuft und
 * schweigt, hat nichts bewiesen — sie könnte auch über nichts gelaufen sein
 * oder gar nicht hingesehen haben. Dieselbe Regel wie bei den sieben Sperren
 * vom 6. September: *Eine Sperre ohne grünen Fall ist so wertlos wie eine ohne
 * roten.*
 */
const GIFTKUNDE = { ...kunde, firma: GIFTKUNDE_FIRMA };

/**
 * Je Ausgang ein **fertiger** Text, so wie er hinausginge.
 *
 * Nicht der Quelltext und nicht ein Ausschnitt: Der Fund vom 10. September
 * saß in einer Überschrift, die aus zwei Feldern zusammengesetzt wird — an
 * keinem der beiden Felder wäre er zu sehen gewesen.
 */
const AUSGANGSTEXTE = Object.freeze([
  Object.freeze({
    funktion: 'erzeugeAngebot',
    text: () => erzeugeAngebot(korb, { nummer: 'AN-1', datum: '2026-09-11', kunde, betreiber }).text,
    giftig: () => erzeugeAngebot(korb, { nummer: 'AN-1', datum: '2026-09-11', kunde: GIFTKUNDE, betreiber }).text,
  }),
  Object.freeze({
    funktion: 'erzeugeAuftragsbestaetigung',
    text: () => erzeugeAuftragsbestaetigung(korb, { nummer: 'AB-1', datum: '2026-09-11', kunde, betreiber }).text,
    giftig: () => erzeugeAuftragsbestaetigung(korb, { nummer: 'AB-1', datum: '2026-09-11', kunde: GIFTKUNDE, betreiber }).text,
  }),
  Object.freeze({
    funktion: 'erzeugeRechnung',
    text: () => erzeugeRechnung(korb, {
      nummer: 'RE-1', datum: '2026-09-11', lieferdatum: '2026-09-09', kunde, betreiber,
      zahlung: { weg: 'vorkasse', datum: '2026-09-08', betrag: korb.summeBrutto },
    }).text,
    giftig: () => erzeugeRechnung(korb, {
      nummer: 'RE-1', datum: '2026-09-11', lieferdatum: '2026-09-09', kunde: GIFTKUNDE, betreiber,
      zahlung: { weg: 'vorkasse', datum: '2026-09-08', betrag: korb.summeBrutto },
    }).text,
  }),
  Object.freeze({
    funktion: 'erzeugeGutschrift',
    text: () => erzeugeGutschrift(korb, {
      nummer: 'GS-1', datum: '2026-09-12', bezugAuf: 'RE-1', bezugsdatum: '2026-09-09',
      grund: 'Falscher Steuersatz', kunde, betreiber,
    }).text,
    giftig: () => erzeugeGutschrift(korb, {
      nummer: 'GS-1', datum: '2026-09-12', bezugAuf: 'RE-1', bezugsdatum: '2026-09-09',
      grund: 'Falscher Steuersatz', kunde: GIFTKUNDE, betreiber,
    }).text,
  }),
  Object.freeze({
    funktion: 'erzeugeAbsage',
    text: () => erzeugeAbsage({
      nummer: 'AB-9', datum: '2026-09-11', kunde, betreiber,
      gruende: ['Leerer Warenkorb'],
    }).text,
    giftig: () => erzeugeAbsage({
      nummer: 'AB-9', datum: '2026-09-11', kunde: GIFTKUNDE, betreiber,
      gruende: ['Leerer Warenkorb'],
    }).text,
  }),
  Object.freeze({
    funktion: 'erzeugeImpressum',
    text: () => {
      const i = erzeugeImpressum(betreiber);
      return typeof i === 'string' ? i : i.text;
    },
    giftig: () => {
      const i = erzeugeImpressum({ ...betreiber, firma: `${betreiber.firma} / Poschacher` });
      return typeof i === 'string' ? i : i.text;
    },
  }),
  /*
   * **Der Anfragetext braucht den Baustoffkatalog**, nicht den Radonkatalog
   * darüber: Er entsteht in der Kasse, und die rechnet mit Einkaufspreisen
   * aus `preise/`. Fehlt die Datei, sagt der Fall das, statt still zu
   * schweigen — dieselbe Haltung wie in `vorgangwerkzeug.test.js`.
   */
  Object.freeze({
    funktion: 'baueKundenanfrage',
    text: () => {
      if (!preiseDa) return null;
      const baustoff = ladeBaustoffkatalog(
        lies('../data/katalog-baustoff.json'),
        JSON.parse(readFileSync(preisPfad, 'utf8')),
        lies('../data/lieferanten.json'),
        ZIELMARGE,
      );
      const daten = {
        artikel: baustoff.artikel.map(oeffentlicherArtikel),
        lieferanten: [...baustoff.lieferantenById.values()].map(oeffentlicherLieferant),
        mindestbestellwertNetto: betreiber.mindestbestellwertNetto ?? null,
      };
      const k = kundenWarenkorb([{ sku: 'POS-51967', menge: 2 }, { sku: 'POS-12569', menge: 30 }], daten);
      const a = baueKundenanfrage({
        rechnung: k,
        bezirk: 'Perg',
        betreiber: { firma: betreiber.firma, ort: betreiber.ort, email: '' },
        datum: '2026-09-11',
      });
      assert.equal(a.moeglich, true, a.hindernis);
      return a.text;
    },
    giftig: () => (preiseDa ? `${betreiber.firma} — Poschacher Baustoffhandel liefert direkt` : null),
  }),
]);

test('jeder kundennahe Ausgang wird geprüft oder steht mit Grund draußen', () => {
  const b = internabefund(AUSGANGSTEXTE.map((a) => a.funktion));
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.draussen, b.geprueft + b.begruendet,
    'jeder Ausgang nach draußen gehört zu genau einer der beiden Gruppen');
});

test('kein fertiger Ausgangstext trägt ein Internum', () => {
  assert.ok(AUSGANGSTEXTE.length >= 5, `nur ${AUSGANGSTEXTE.length} Proben`);
  for (const a of AUSGANGSTEXTE) {
    const text = a.text();
    if (text === null) continue; // preise/ fehlt — der Fall sagt das oben
    assert.ok(text && text.length > 50, `${a.funktion}: kein brauchbarer Text erzeugt`);
    const funde = findeInterna(text);
    assert.deepEqual(funde.map((f) => `${f.id}: ${f.fund}`), [],
      `${a.funktion} trägt ein Internum — der Bezugsweg gehört nicht nach draußen`);
  }
});

test('ein untergeschobenes Internum wird an jedem Ausgang gefunden', () => {
  /**
   * **Die Gegenrichtung, und ohne sie ist die Probe darüber wertlos.** Ein
   * Fall, der über einen sauberen Text läuft und schweigt, könnte auch über
   * nichts gelaufen sein oder gar nicht hingesehen haben. Hier bekommt jeder
   * Ausgang ein geführtes Internum untergeschoben und **muss** es melden.
   */
  assert.ok(AUSGANGSTEXTE.length >= 5, `nur ${AUSGANGSTEXTE.length} Proben`);
  for (const a of AUSGANGSTEXTE) {
    const text = a.giftig();
    if (text === null) continue; // preise/ fehlt
    const funde = findeInterna(text);
    assert.ok(funde.length >= 1,
      `${a.funktion}: das untergeschobene Internum wurde nicht gefunden — `
      + 'die Probe darüber beweist damit nichts');
    assert.equal(funde[0].id, 'lieferantenname');
  }
});

test('jeder Verzicht nennt einen Ausgang und einen Grund, der trägt', () => {
  assert.equal(OHNE_INTERNAPROBE.length, 3, `${OHNE_INTERNAPROBE.length} Verzichte`);
  const namen = new Set(AUSGAENGE.map((a) => a.funktion));
  for (const o of OHNE_INTERNAPROBE) {
    assert.ok(namen.has(o.funktion), `${o.funktion} steht in keinem Ausgangsverzeichnis`);
    assert.ok(o.warum.length >= 80, `${o.funktion}: der Grund trägt den Verzicht nicht`);
  }
});

test('ein Ausgang ohne Probe und ohne Grund ist ein Befund', () => {
  const b = internabefund([], [{ funktion: 'x', an: 'Kunde' }], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ausgang-ohne-internaprobe']);
});

test('ein Verzeichnis ohne kundennahen Ausgang ist kein grünes Ergebnis', () => {
  const b = internabefund([], [{ funktion: 'x', an: 'Buchhaltung' }], []);
  assert.equal(b.sauber, false);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['kein-ausgang-nach-draussen']);
});

test('gehtNachDraussen liest den Empfänger, nicht den Namen', () => {
  assert.equal(gehtNachDraussen({ an: 'Kunde' }), true);
  assert.equal(gehtNachDraussen({ an: 'jeder Besucher' }), true);
  assert.equal(gehtNachDraussen({ an: 'Lieferant' }), false);
  assert.equal(gehtNachDraussen({ an: 'Buchhaltung' }), false);
});
