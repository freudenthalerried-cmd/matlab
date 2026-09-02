import test from 'node:test';
import assert from 'node:assert/strict';
import { pruefeTexte, VOLLSTAENDIGKEITSWORTE, LUECKENSATZ } from '../bin/kampagne.mjs';

/* ------------------------------------------------------------------ *
 * Vollständigkeitsversprechen — Befund vom 2. September
 *
 * Alle drei laufenden Anzeigengruppen warben mit „komplett", „aus einer
 * Hand" oder „alle gängigen Stärken". Alle vier Systemlisten des Shops
 * benennen mindestens eine Position, die er nicht führt — bei WDVS ist es
 * die Dämmplatte in Flächenstärke, also die Hauptschicht.
 * ------------------------------------------------------------------ */

test('Eine Gruppe mit Lücke darf keine Vollständigkeit versprechen', () => {
  const anzeige = {
    Anzeigengruppe: 'WDVS',
    'Überschrift 1': 'Fassade komplett liefern',
    'Beschreibung 1': 'Das komplette System aus einer Hand.',
  };
  const fehler = pruefeTexte([anzeige], ['M2', 'KG'], new Set(['WDVS']));
  assert.equal(fehler.length, 2, fehler.join(' | '));
  assert.ok(fehler.every((f) => f.includes('verspricht Vollständigkeit')));
});

test('Ohne Lücke ist dasselbe Wort in Ordnung', () => {
  const anzeige = { Anzeigengruppe: 'Mörtel', 'Überschrift 1': 'Mörtel komplett liefern' };
  assert.deepEqual(pruefeTexte([anzeige], ['KG'], new Set(['WDVS'])), []);
});

test('Alle fünf Vollständigkeitsworte greifen', () => {
  assert.ok(VOLLSTAENDIGKEITSWORTE.length >= 5, 'zu wenige Muster');
  const saetze = [
    'Fassade komplett liefern',
    'Alles aus einer Hand',
    'In allen gängigen Stärken',
    'Vollständiges System',
    'Der ganze Aufbau',
  ];
  assert.equal(saetze.length, VOLLSTAENDIGKEITSWORTE.length, 'je Muster ein Satz');
  for (const satz of saetze) {
    const treffer = pruefeTexte([{ Anzeigengruppe: 'X', 'Überschrift 1': satz }], ['STK'], new Set(['X']));
    assert.equal(treffer.length, 1, `„${satz}" wird nicht gefunden`);
  }
});

test('Der Lückensatz der Systemlisten wird erkannt', () => {
  assert.ok(LUECKENSATZ.test('Eine der zehn Positionen führen wir nicht: das Anschlussformteil.'));
  assert.ok(LUECKENSATZ.test('Die Dämmplatte führen wir derzeit nicht in Flächenstärke.'));
  assert.ok(!LUECKENSATZ.test('Alle Positionen stehen im Katalog.'));
});

test('Ohne Lückenangabe prüft die Regel nichts — und das ist die Voreinstellung', () => {
  // Anders als bei den Einheiten ist hier eine leere Menge zulässig: Ein Shop
  // ohne Systemliste hat keine bekannte Lücke. Die Probe hält fest, dass das
  // eine Entscheidung ist und kein Versehen.
  const anzeige = { Anzeigengruppe: 'WDVS', 'Überschrift 1': 'Fassade komplett liefern' };
  assert.deepEqual(pruefeTexte([anzeige], ['M2']), []);
});
