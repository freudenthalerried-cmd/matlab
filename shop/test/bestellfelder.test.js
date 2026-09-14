import test from 'node:test';
import assert from 'node:assert/strict';
import { BESTELLFELDER, beispielbestellung, pruefeBestellfelder } from '../src/bestellfelder.js';
import { pruefeBestelldaten } from '../src/kunde.js';

test('das Register deckt, was die Bestelldatenprüfung verlangt', () => {
  // **Der Fehler vom 4. September:** Das Formular sammelte drei Felder,
  // `pruefeBestelldaten` verlangt acht. Diese Probe ist die Verbindung, die
  // damals fehlte — sie hält die beiden Listen aneinander.
  const b = pruefeBestellfelder(pruefeBestelldaten);
  assert.ok(b.geprueft >= 8, `nur ${b.geprueft} Felder im Register`);
  assert.deepEqual(b.meldungen, []);
});

test('ein vollständiger Satz aus dem Register kommt durch', () => {
  const p = pruefeBestelldaten({ ...beispielbestellung(), land: 'AT' });
  assert.equal(p.gueltig, true, p.fehler.join('; '));
});

test('jedes einzelne Feld bringt die Prüfung zum Kippen', () => {
  // Ein Feld, dessen Fehlen niemanden stört, ist eine Frage an den Kunden
  // ohne Grund. Acht Felder, acht Fälle.
  assert.ok(BESTELLFELDER.length >= 8, 'zu wenige Felder — die Schleife prüfte kaum etwas');
  for (const f of BESTELLFELDER) {
    const ohne = { ...beispielbestellung(), land: 'AT' };
    delete ohne[f.name];
    assert.equal(pruefeBestelldaten(ohne).gueltig, false, `${f.name} fehlt und stört niemanden`);
  }
});

test('ein Feld ohne tragfähigen Grund wird gemeldet', () => {
  const b = pruefeBestellfelder(pruefeBestelldaten,
    [{ name: 'firma', beschriftung: 'Firma', art: 'text', warum: 'zu kurz' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'feld-ohne-grund'), JSON.stringify(b.meldungen));
});

test('ein zu kurzes Register wird als zu kurz gemeldet', () => {
  // Genau der Zustand von heute früh: drei Felder im Formular.
  const drei = BESTELLFELDER.filter((f) => ['firma', 'email', 'telefon'].includes(f.name));
  const b = pruefeBestellfelder(pruefeBestelldaten, drei);
  assert.ok(b.meldungen.some((m) => m.regel === 'register-reicht-nicht'), JSON.stringify(b.meldungen));
});

test('jedes Feld nennt Beschriftung, Feldtyp und Grund', () => {
  assert.ok(BESTELLFELDER.length >= 8, `nur ${BESTELLFELDER.length} Felder — die Schleife prüfte kaum etwas`);
  for (const f of BESTELLFELDER) {
    assert.ok(f.beschriftung.length > 2, `${f.name} ohne Beschriftung`);
    assert.match(f.art, /^(text|email|tel|checkbox)$/, `${f.name}: unbekannter Feldtyp ${f.art}`);
    assert.ok(f.warum.length >= 60, `${f.name}: Grund zu kurz`);
  }
});

/*
 * ## Zwei Regeln, die niemand hat feuern sehen
 *
 * **14. September 2026, abends.** Beide halten das Formularregister gegen die
 * Eingabeprüfung — und beide greifen erst, wenn eines von beiden sich ändert.
 * Sie stehen vor dem Formular, das die Bestellung eines Kunden aufnimmt: Ein
 * Feld ohne Beschriftung ist eine Zeile, die niemand ausfüllen kann, und ein
 * Feld ohne Wirkung ist eine Angabe, die der Beleg braucht und die niemand
 * einfordert.
 */
test('Ein Feld ohne Beschriftung oder Feldtyp', () => {
  const felder = [{ name: 'probe', warum: 'x'.repeat(70) }];
  const b = pruefeBestellfelder(() => ({ gueltig: false, fehler: ['probe fehlt'] }), felder);
  assert.ok(b.meldungen.some((m) => m.regel === 'feld-unvollstaendig'), JSON.stringify(b.meldungen));
});

test('Ein Feld, dessen Fehlen die Prüfung nicht stört', () => {
  const felder = [{
    name: 'probe', beschriftung: 'Probe', art: 'text', beispiel: 'x', warum: 'y'.repeat(70),
  }];
  // Eine Prüfung, die alles durchlässt: Dann fehlt jedes Feld folgenlos.
  const b = pruefeBestellfelder(() => ({ gueltig: true, fehler: [] }), felder);
  assert.ok(b.meldungen.some((m) => m.regel === 'feld-ohne-wirkung'), JSON.stringify(b.meldungen));
  // Und eine, die das Feld einfordert: dann ist nichts zu melden.
  const streng = pruefeBestellfelder(
    (satz) => ({ gueltig: satz.probe !== undefined, fehler: ['probe fehlt'] }), felder,
  );
  assert.ok(!streng.meldungen.some((m) => m.regel === 'feld-ohne-wirkung'),
    JSON.stringify(streng.meldungen));
});
