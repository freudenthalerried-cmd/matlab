import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMPRESSUMSFELDER,
  pruefeBetreiberdaten,
  erzeugeImpressum,
  AGB_GLIEDERUNG,
  DATENSCHUTZ_GLIEDERUNG,
  B2B_ABGRENZUNG,
  LIEFERHINWEISE,
  lieferhinweise,
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

test('Der Zahlungspunkt schließt Nachnahme und Barzahlung aus', () => {
  // Kartenzahlung im Web ist kein Barumsatz, Nachnahme schon. Ohne diesen
  // Ausschluss entstünde Registrierkassenpflicht — siehe ablage-und-nummernkreis.md.
  const zahlung = AGB_GLIEDERUNG.find((a) => /Zahlung, Verzug/.test(a.titel));
  assert.ok(zahlung, 'Der Zahlungspunkt fehlt in der Gliederung');
  assert.match(zahlung.hinweis, /Nachnahme/);
  assert.match(zahlung.hinweis, /Registrierkassenpflicht/);
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

/* ------------------------------------------------------------------ *
 * Lieferhinweise nach § 377 UGB
 *
 * Der Punkt, an dem im B2B-Baustoffhandel wirklich Geld verlorengeht: Die
 * Rügefrist läuft ab Ablieferung auf der Baustelle, nicht ab dem Tag, an dem
 * der Besteller die Palette zum ersten Mal sieht.
 * ------------------------------------------------------------------ */

test('Die Gliederung regelt die abweichende Lieferanschrift', () => {
  const punkt = AGB_GLIEDERUNG.find((a) => /Abweichende Lieferanschrift/.test(a.titel));
  assert.ok(punkt, 'Der Punkt fehlt');
  assert.match(punkt.hinweis, /Empfangsvollmacht|nimmt für den Besteller an/);
  assert.match(punkt.hinweis, /Ansprechpartner vor Ort/);
});

test('Die Gliederung nennt die Beschränkung auf Lieferorte in Österreich', () => {
  const punkt = AGB_GLIEDERUNG.find((a) => /Lieferorte nur in Österreich/.test(a.titel));
  assert.ok(punkt, 'Der Punkt fehlt');
  assert.match(punkt.hinweis, /Art 6, 7 UStG|Ausfuhr/);
});

test('Der Gefahrübergang nennt die Ablieferung auf der Baustelle als Fristbeginn', () => {
  const punkt = AGB_GLIEDERUNG.find((a) => /Gefahrübergang/.test(a.titel));
  assert.ok(punkt);
  assert.match(punkt.hinweis, /§ 377 UGB/);
  assert.match(punkt.hinweis, /ab Ablieferung/);
});

test('Jeder Lieferhinweis nennt seine Grundlage', () => {
  assert.ok(LIEFERHINWEISE.length >= 4, 'zu wenige Hinweise für diese Prüfung');
  for (const h of LIEFERHINWEISE) {
    assert.ok(h.titel && h.titel.length > 0);
    assert.ok(h.text && h.text.length > 40, `${h.titel}: zu dünn`);
    assert.ok(h.grundlage && h.grundlage.length > 0, `${h.titel}: ohne Grundlage`);
  }
});

test('Die Rügefrist steht immer da, auch ohne abweichende Baustelle', () => {
  const ohne = lieferhinweise({ lieferungAnRechnungsadresse: true });
  assert.ok(ohne.some((h) => /§ 377 UGB/.test(h.grundlage)), 'Die Frist gilt in jedem Fall');
});

test('Die Empfangsvollmacht erscheint nur bei abweichender Baustelle', () => {
  const ohne = lieferhinweise({ lieferungAnRechnungsadresse: true });
  const mit = lieferhinweise({ lieferungAnRechnungsadresse: false });

  assert.ok(!ohne.some((h) => /übernimmt für Sie/.test(h.titel)), 'Hinweis ohne Anlass');
  assert.ok(mit.some((h) => /übernimmt für Sie/.test(h.titel)), 'Hinweis fehlt, wo er hingehört');
  assert.ok(mit.length > ohne.length);
});

test('Ohne Auftrag wird der weniger passende Hinweis weggelassen, nicht der wichtigere', () => {
  // Ein Aufruf ohne Angaben darf nicht schweigen — die Rügefrist gilt immer.
  const h = lieferhinweise();
  assert.ok(h.length >= 3);
  assert.ok(h.some((x) => /§ 377 UGB/.test(x.grundlage)));
});

/* ------------------------------------------------------------------ *
 * AGB gegen Ablauf — was der Shop tut, muss in den AGB stehen
 * ------------------------------------------------------------------ */

test('Die Umsatzsteuerklausel widerspricht der Lieferbeschränkung nicht mehr', () => {
  // Sie versprach Reverse Charge bei innergemeinschaftlicher Lieferung —
  // während ein anderer Punkt Lieferungen außerhalb Österreichs ausschließt.
  const steuer = AGB_GLIEDERUNG.find((a) => /Preise und Umsatzsteuer/.test(a.titel));
  const orte = AGB_GLIEDERUNG.find((a) => /Lieferorte nur in Österreich/.test(a.titel));
  assert.ok(steuer && orte);

  assert.match(steuer.hinweis, /Leistungsort ist Österreich/);
  assert.match(steuer.hinweis, /Eingangsseite|innergemeinschaftlichen Erwerb/);
  assert.match(steuer.hinweis, new RegExp('Punkt ' + orte.nr), 'Der Verweis muss auf den richtigen Punkt zeigen');
});

test('Die durchgesetzte Mindestbestellmenge hat einen eigenen AGB-Punkt', () => {
  // Der Shop lehnt Bestellungen unter der Herstellergrenze ab. Bis zu dieser
  // Runde stand das in keinem Punkt — eine Ablehnung ohne Grundlage.
  const punkt = AGB_GLIEDERUNG.find((a) => /Mindestbestellmengen/.test(a.titel));
  assert.ok(punkt, 'Der Punkt fehlt');
  assert.match(punkt.hinweis, /nicht angenommen werden/);
  assert.match(punkt.hinweis, /Warenwert/, 'in der Währung des Kunden, nicht im Einkauf');
});

test('Jeder Querverweis zwischen AGB-Punkten zeigt auf einen vorhandenen Punkt', () => {
  const nummern = new Set(AGB_GLIEDERUNG.map((a) => a.nr));

  // Erst sammeln, dann prüfen: So steht die Längenzusicherung vor der Schleife
  // und nicht dahinter — sonst prüfte der Testfall bei null Verweisen nichts.
  const verweise = AGB_GLIEDERUNG.flatMap((a) =>
    [...String(a.hinweis ?? '').matchAll(/Punkt (\d+)/g)].map((t) => ({ von: a.nr, auf: Number(t[1]) })),
  );
  assert.ok(verweise.length >= 1, 'Ohne Querverweis prüft dieser Testfall nichts');

  for (const v of verweise) {
    assert.ok(nummern.has(v.auf), `Punkt ${v.von} verweist auf ${v.auf} — gibt es nicht`);
  }
});
