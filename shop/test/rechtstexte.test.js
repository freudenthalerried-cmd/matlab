import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMPRESSUMSFELDER,
  pruefeBetreiberdaten,
  erzeugeImpressum,
  AGB_GLIEDERUNG,
  DATENSCHUTZ_GLIEDERUNG,
  B2B_ABGRENZUNG,
} from '../src/rechtstexte.js';

const vollstaendig = {
  firma: 'Musterfirma GmbH',
  rechtsform: 'Gesellschaft mit beschränkter Haftung',
  strasse: 'Musterweg 1',
  plz: '4600',
  ort: 'Wels',
  email: 'office@muster.at',
  telefon: '+43 7242 000000',
  imFirmenbuch: true,
  firmenbuchnummer: 'FN 123456a',
  firmenbuchgericht: 'Landesgericht Wels',
  uid: 'ATU12345675',
  gewerbebehoerde: 'Bezirkshauptmannschaft Wels-Land',
  kammer: 'Wirtschaftskammer Oberösterreich',
  gewerbewortlaut: 'Handelsgewerbe',
};

test('Leere Betreiberdaten melden jede Pflichtangabe einzeln', () => {
  const p = pruefeBetreiberdaten({});
  assert.equal(p.vollstaendig, false);
  // Ohne Firmenbucheintrag entfallen die beiden bedingten Firmenbuchfelder.
  assert.equal(p.fehlend.length, IMPRESSUMSFELDER.length - 2);
  assert.ok(p.fehlend.some((f) => /E-Mail/.test(f)));
  assert.ok(p.fehlend.some((f) => /Gewerbebehörde/.test(f)));
});

test('Vollständige Daten gelten als vollständig', () => {
  const p = pruefeBetreiberdaten(vollstaendig);
  assert.equal(p.vollstaendig, true);
  assert.deepEqual(p.fehlend, []);
});

test('Firmenbuchfelder werden nur bei Eintragung verlangt', () => {
  const ohne = pruefeBetreiberdaten({ ...vollstaendig, imFirmenbuch: false, firmenbuchnummer: '', firmenbuchgericht: '' });
  assert.equal(ohne.vollstaendig, true);

  const mit = pruefeBetreiberdaten({ ...vollstaendig, firmenbuchnummer: '' });
  assert.equal(mit.vollstaendig, false);
  assert.ok(mit.fehlendeFelder.includes('firmenbuchnummer'));
});

test('Leerzeichen zählen nicht als ausgefülltes Feld', () => {
  const p = pruefeBetreiberdaten({ ...vollstaendig, ort: '   ' });
  assert.equal(p.vollstaendig, false);
  assert.ok(p.fehlendeFelder.includes('ort'));
});

test('Das Impressum macht jede Lücke sichtbar statt sie zu verschweigen', () => {
  const { text, vollstaendig: v } = erzeugeImpressum({ firma: 'Nur die Firma' });
  assert.equal(v, false);
  assert.match(text, /\[\[ E-Mail — FEHLT \]\]/);
  assert.match(text, /\[\[ Gewerbebehörde — FEHLT \]\]/);
  assert.match(text, /Nur die Firma/);
});

test('Vollständiges Impressum enthält keine Lückenmarkierung', () => {
  const { text, vollstaendig: v } = erzeugeImpressum(vollstaendig);
  assert.equal(v, true);
  assert.ok(!text.includes('FEHLT'), 'kein Platzhalter darf übrig bleiben');
  assert.match(text, /§ 5 E-Commerce-Gesetz/);
  assert.match(text, /FN 123456a/);
  assert.match(text, /Landesgericht Wels/);
});

test('Ohne Firmenbucheintrag steht das ausdrücklich im Impressum', () => {
  const { text } = erzeugeImpressum({ ...vollstaendig, imFirmenbuch: false });
  assert.match(text, /Nicht im Firmenbuch eingetragen/);
  assert.ok(!text.includes('Firmenbuchnummer:'));
});

test('Die AGB-Gliederung enthält keine Widerrufsbelehrung', () => {
  const alleTitel = AGB_GLIEDERUNG.map((a) => a.titel).join(' ').toLowerCase();
  assert.ok(!/widerruf|rücktrittsrecht/.test(alleTitel), 'Gate 7: kein Verbraucherrücktritt im B2B');
  assert.ok(AGB_GLIEDERUNG.some((a) => /Streckengeschäft/.test(a.titel)));
  assert.ok(AGB_GLIEDERUNG.some((a) => /Transportschäden/.test(a.titel)));
});

test('Die Gliederung ist lückenlos durchnummeriert', () => {
  AGB_GLIEDERUNG.forEach((a, i) => assert.equal(a.nr, i + 1));
});

test('Die B2B-Abgrenzung nennt Ersparnis und verbleibende Pflichten', () => {
  assert.ok(B2B_ABGRENZUNG.entfaellt.some((e) => /Widerrufsbelehrung/.test(e)));
  assert.ok(B2B_ABGRENZUNG.entfaellt.some((e) => /zwölf Monate/.test(e)));
  assert.ok(B2B_ABGRENZUNG.bleibt.some((b) => /§ 5 ECG/.test(b)));
  assert.ok(
    B2B_ABGRENZUNG.bleibt.some((b) => /Ausschluss von Verbraucherbestellungen/.test(b)),
    'die Auflage aus Gate 7 muss unter "bleibt" stehen',
  );
});

test('Die Datenschutzgliederung nennt die Weitergabe an Lieferanten', () => {
  assert.ok(DATENSCHUTZ_GLIEDERUNG.some((d) => /Weitergabe an Lieferanten/.test(d)));
  assert.ok(DATENSCHUTZ_GLIEDERUNG.some((d) => /Art\. 6/.test(d)));
});
