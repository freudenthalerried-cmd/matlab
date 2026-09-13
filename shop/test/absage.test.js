import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  ABSAGEGRUENDE, absagegruende, absagebefund, erzeugeAbsage, gruendeAusQuellen,
} from '../src/absage.js';
import { findeInterna } from '../src/interna.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Die Gründe, die der Bestand wirklich erzeugt — **aus dem Quelltext gelesen**
 * und nicht hier aufgezählt. Eine Liste von Hand prüfte mein Gedächtnis und
 * nicht den Bestand; genau daran ist am 8. September schon eine Begründung
 * gescheitert, die zwei Gründe nannte und von der nur einer geprüft war.
 */
const gruendeAusDemBestand = () => gruendeAusQuellen(
  (d) => readFileSync(pfad(`../${d}`), 'utf8'),
);

test('der Quelltext liefert überhaupt Gründe — sonst prüft alles darunter nichts', () => {
  const alle = gruendeAusDemBestand();
  assert.ok(alle.length >= 8, `nur ${alle.length} Gründe gefunden — die Auslese greift nicht`);
});

test('Jeder Grund, den der Bestand erzeugt, hat einen Satz für den Kunden', () => {
  const b = absagebefund(gruendeAusDemBestand());
  assert.deepEqual(b.meldungen.map((m) => `[${m.regel}] ${m.text}`), [],
    'ein Grund ohne Satz ginge im Original hinaus oder fiele weg');
});

test('Das Register nennt zu jedem Satz, welche Prüfung ihn erzeugt', () => {
  assert.ok(ABSAGEGRUENDE.length >= 8,
    `nur ${ABSAGEGRUENDE.length} Einträge — ohne Bestand prüft die Schleife nichts`);
  for (const e of ABSAGEGRUENDE) {
    assert.ok(e.muster instanceof RegExp, `${e.id} führt kein Muster`);
    assert.ok(e.kunde.length > 20, `${e.id} hat keinen Satz`);
    assert.ok(e.woher.length > 10, `${e.id} sagt nicht, woher er kommt`);
  }
});

test('Ein Grund ohne Satz wird gemeldet und nicht weggelassen', () => {
  const u = absagegruende(['Etwas völlig Neues ist passiert']);
  assert.equal(u.vollstaendig, false);
  assert.deepEqual(u.ohneSatz, ['Etwas völlig Neues ist passiert']);
  assert.throws(() => erzeugeAbsage({
    nummer: '1', datum: '11.09.2026', gruende: ['Etwas völlig Neues ist passiert'],
  }), /unübersetzt/);
});

test('Eine Absage ohne Grund entsteht nicht', () => {
  assert.throws(() => erzeugeAbsage({ nummer: '1', datum: '11.09.2026', gruende: [] }),
    /ohne Grund/);
});

/*
 * Der Kern des Befundes vom 11. September: Zwei der neun internen Gründe
 * tragen ein Internum — eine Gate-Nummer und den Namen des Lieferanten.
 */
test('Die beiden internen Gründe kommen nicht im Original hinaus', () => {
  const intern = [
    'Unternehmerstatus nicht bestätigt (Gate 7)',
    'Lieferzeit unbekannt (Poschacher Baustoffhandel) — der zugesagte Termin wäre erfunden',
  ];
  assert.equal(intern.length, 2, 'ohne diese Zusicherung prüft die Schleife darunter nichts');
  for (const g of intern) {
    assert.ok(findeInterna(g).length > 0, `„${g}" wäre gar kein Leck — dann prüft dieser Fall nichts`);
  }
  const absage = erzeugeAbsage({
    nummer: 'B-2026-0001',
    datum: '11.09.2026',
    kunde: { firma: 'Musterbau GmbH', strasse: 'Bauweg 1', plz: '4312', ort: 'Ried' },
    betreiber: { firma: 'Freudenthaler Bau GmbH', marke: 'Bauversand', strasse: 'Marwach 5', plz: '4312', ort: 'Ried in der Riedmark' },
    gruende: intern,
  });
  assert.deepEqual(findeInterna(absage.text), [],
    'die Absage trägt ein Internum — genau das sollte sie verhindern');
  assert.ok(!absage.text.includes('Gate'), 'eine Gate-Nummer in einer Kundenmail');
  assert.ok(!absage.text.includes('Poschacher'), 'der Lieferantenname in einer Kundenmail');
  // Und sie sagt trotzdem, warum: eine Absage ohne Grund ist eine Abfuhr.
  assert.match(absage.text, /ausschließlich an Unternehmer/);
  assert.match(absage.text, /Liefertermin/);
});

test('Die Absage nennt keinen Betrag und keine Position', () => {
  // Was abgesagt wird, steht in der Anfrage des Kunden. Eine zweite
  // Aufstellung daneben wäre eine zweite Rechnung über etwas, das nicht
  // zustande kommt — und die erste Stelle, an der beide auseinanderlaufen.
  const absage = erzeugeAbsage({
    nummer: 'B-2026-0001', datum: '11.09.2026',
    gruende: ['Keine UID-Nummer hinterlegt'],
  });
  assert.ok(!/€/.test(absage.text), 'ein Betrag in der Absage');
  assert.match(absage.text, /UID-Nummer/);
  assert.match(absage.text, /kein Vertrag|nicht zustande gekommen/i);
});

test('Derselbe Grund zweimal ergibt einen Satz', () => {
  const a = erzeugeAbsage({
    nummer: '1', datum: '11.09.2026',
    gruende: ['Keine UID-Nummer hinterlegt', 'UID fehlt'],
  });
  assert.equal(a.gruende.length, 1);
});
