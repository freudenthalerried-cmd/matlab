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
