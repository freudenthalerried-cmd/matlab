import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pruefeBestelldaten, uidPruefzifferStimmt, baueAuftrag } from '../src/kunde.js';
import { ZUSICHERUNG_DRITTER } from '../src/rechtstexte.js';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { erzeugeBestellungen, darfAutomatischAusgeloestWerden } from '../src/bestellung.js';

const vollstaendig = {
  firma: 'Baumeister Muster GmbH',
  uid: 'ATU12345675',
  email: 'office@muster.at',
  strasse: 'Feldweg 3',
  plz: '4600',
  ort: 'Wels',
  telefon: '+43 660 0000000',
  unternehmerBestaetigt: true,
};

test('Vollständige Daten sind gültig und ohne Warnung', () => {
  const p = pruefeBestelldaten(vollstaendig);
  assert.equal(p.gueltig, true);
  assert.deepEqual(p.fehler, []);
  assert.deepEqual(p.warnungen, []);
});

test('UID-Prüfziffer: genau eine Ziffer passt je Basis', () => {
  const treffer = [];
  for (let d = 0; d < 10; d++) if (uidPruefzifferStimmt('ATU1234567' + d)) treffer.push(d);
  assert.deepEqual(treffer, [5], 'ATU12345675 ist das gängige Beispiel');
});

test('UID-Prüfziffer weist fremde Formate ab', () => {
  assert.equal(uidPruefzifferStimmt('ATU123'), false);
  assert.equal(uidPruefzifferStimmt('DE123456789'), false);
  assert.equal(uidPruefzifferStimmt('ATU1234567X'), false);
});

test('Falsche Prüfziffer ist eine Warnung, kein Fehler', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, uid: 'ATU12345670' });
  assert.equal(p.gueltig, true, 'verbindlich ist die MIAS-Abfrage, nicht die Prüfziffer');
  assert.equal(p.fehler.length, 0);
  assert.ok(p.warnungen.some((w) => /Prüfziffer/.test(w)));
});

test('Falsches UID-Format ist dagegen ein Fehler', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, uid: 'DE123456789' });
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /ATU/.test(f)));
});

test('Gate 7: ohne Unternehmerbestätigung keine gültige Bestellung', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, unternehmerBestaetigt: false });
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /Gate 7/.test(f)));
});

test('Pflichtfelder werden einzeln benannt', () => {
  const p = pruefeBestelldaten({ unternehmerBestaetigt: true, uid: 'ATU12345675' });
  assert.equal(p.gueltig, false);
  for (const begriff of [/Firmenname/, /Straße/, /Ort/, /Telefonnummer/, /Postleitzahl/, /E-Mail/]) {
    assert.ok(p.fehler.some((f) => begriff.test(f)), `Fehlermeldung fehlt für ${begriff}`);
  }
});

test('Postleitzahl wird auf vier Stellen und den AT-Bereich geprüft', () => {
  assert.ok(pruefeBestelldaten({ ...vollstaendig, plz: '460' }).fehler.some((f) => /vierstellig/.test(f)));
  assert.ok(pruefeBestelldaten({ ...vollstaendig, plz: '0999' }).fehler.some((f) => /vierstellig/.test(f)));
  assert.equal(pruefeBestelldaten({ ...vollstaendig, plz: '1010' }).gueltig, true);
});

test('Ein Land außerhalb Österreichs wird an der Rechnungsanschrift abgewiesen', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, land: 'DE' });
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /außerhalb Österreichs/.test(f)), p.fehler.join(' | '));
});

test('Ohne Landangabe bleibt es bei Österreich — als ausgesprochene Voreinstellung', () => {
  const p = pruefeBestelldaten(vollstaendig);
  assert.equal(p.gueltig, true);
  assert.equal(p.normalisiert.land, 'AT');
});

test('UID wird normalisiert: Großschreibung und Leerzeichen', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, uid: ' atu 1234 5675 ' });
  assert.equal(p.normalisiert.uid, 'ATU12345675');
  assert.equal(p.gueltig, true);
});

test('Der Auftrag trägt die Lieferadresse in die Bestellungen', () => {
  const daten = {
    lieferanten: JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url))),
    artikel: JSON.parse(readFileSync(new URL('../data/artikel.json', import.meta.url))),
  };
  const katalog = ladeKatalog(daten, 0.35);
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 5 }], katalog);
  const auftrag = baueAuftrag('A-2026-0007', vollstaendig, { zahlungEingegangen: true });

  assert.equal(auftrag.kundeIstUnternehmer, true);
  assert.equal(auftrag.uid, 'ATU12345675');

  const bestellungen = erzeugeBestellungen(wk, auftrag);
  assert.equal(bestellungen.length, 1);
  assert.match(bestellungen[0].text, /4600 Wels/);
  assert.match(bestellungen[0].text, /Baumeister Muster GmbH/);

  // Platzhalterpreise halten die Auslösung weiterhin auf.
  const pruefung = darfAutomatischAusgeloestWerden(wk, auftrag);
  assert.equal(pruefung.erlaubt, false);
  assert.ok(pruefung.gruende.some((g) => /Platzhalter/.test(g)));
});

test('Ohne Unternehmerbestätigung bleibt der Auftrag gesperrt', () => {
  const auftrag = baueAuftrag('A-1', { ...vollstaendig, unternehmerBestaetigt: false });
  assert.equal(auftrag.kundeIstUnternehmer, false);
});

/* ------------------------------------------------------------------ *
 * Die Baustelle als eigene Anschrift
 *
 * Der Regelfall der Zielgruppe: Ein Handwerksbetrieb bestellt vom Büro aus
 * für eine Baustelle, die woanders liegt. Bis zu dieser Runde konnte der Shop
 * diese Bestellung gar nicht abbilden.
 * ------------------------------------------------------------------ */

// Seit der Zusicherung nach Art. 14 gehört das Kästchen zu jeder Bestellung
// mit abweichender Baustelle. Es steht hier einmal und wird überall
// mitgereicht — ein Testfall, der es vergisst, prüft den falschen Fehler.
const mitZusicherung = (daten) => ({ ...daten, ansprechpartnerInformiert: true });

const baustelle = {
  name: 'Neubau Familie Berger',
  strasse: 'Feldgasse 27',
  plz: '4910',
  ort: 'Ried im Innkreis',
  land: 'AT',
  telefon: '+43 664 9998877',
  hinweis: 'Zufahrt über Baustraße, Kran bis 16 Uhr besetzt',
};

test('Eine vollständige Baustelle ist gültig und steht getrennt in den Daten', () => {
  const p = pruefeBestelldaten(mitZusicherung({ ...vollstaendig, baustelle }));
  assert.equal(p.gueltig, true, p.fehler.join(' | '));
  assert.equal(p.normalisiert.baustelle.ort, 'Ried im Innkreis');
  assert.equal(p.normalisiert.ort, 'Wels', 'die Rechnungsanschrift bleibt unberührt');
});

test('Ohne Baustelle bleibt alles wie bisher', () => {
  const p = pruefeBestelldaten(vollstaendig);
  assert.equal(p.normalisiert.baustelle, null);

  const auftrag = baueAuftrag('A-1', vollstaendig);
  assert.equal(auftrag.lieferungAnRechnungsadresse, true);
  assert.equal(auftrag.lieferadresse.ort, 'Wels');
});

test('Mit Baustelle geht die Ware dorthin und die Rechnung ans Büro', () => {
  const auftrag = baueAuftrag('A-1', mitZusicherung({ ...vollstaendig, baustelle }));
  assert.equal(auftrag.lieferungAnRechnungsadresse, false);
  assert.equal(auftrag.lieferadresse.ort, 'Ried im Innkreis');
  assert.equal(auftrag.lieferadresse.name, 'Neubau Familie Berger');
  assert.equal(auftrag.lieferadresse.telefon, '+43 664 9998877');
});

test('Ohne eigenen Namen steht der Besteller auf dem Lieferschein', () => {
  const ohneName = { ...baustelle };
  delete ohneName.name;
  const p = pruefeBestelldaten(mitZusicherung({ ...vollstaendig, baustelle: ohneName }));
  assert.equal(p.gueltig, true, p.fehler.join(' | '));
  assert.equal(p.normalisiert.baustelle.name, vollstaendig.firma);
});

test('Der Zufahrtshinweis steht im Bestelltext unter der Adresse', () => {
  const daten = {
    lieferanten: JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url))),
    artikel: JSON.parse(readFileSync(new URL('../data/artikel.json', import.meta.url))),
  };
  const katalog = ladeKatalog(daten, 0.35);
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 5 }], katalog);
  const b = erzeugeBestellungen(wk, baueAuftrag('A-1', mitZusicherung({ ...vollstaendig, baustelle })))[0];

  const zeilen = b.text.split('\n');
  const adresse = zeilen.findIndex((z) => /Ried im Innkreis/.test(z));
  const hinweis = zeilen.findIndex((z) => /Hinweis zur Zufahrt/.test(z));
  assert.ok(adresse >= 0 && hinweis > adresse, 'Der Hinweis gehört unter den Adressblock');
  assert.match(b.text, /Kran bis 16 Uhr besetzt/);
});

test('Ohne Zufahrtshinweis entsteht keine leere Zeile', () => {
  const daten = {
    lieferanten: JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url))),
    artikel: JSON.parse(readFileSync(new URL('../data/artikel.json', import.meta.url))),
  };
  const katalog = ladeKatalog(daten, 0.35);
  const wk = berechneWarenkorb([{ sku: 'AB-RD-375', menge: 5 }], katalog);
  const ohneHinweis = { ...baustelle, hinweis: '' };

  const mit = erzeugeBestellungen(wk, baueAuftrag('A-1', mitZusicherung({ ...vollstaendig, baustelle })))[0];
  const ohne = erzeugeBestellungen(wk, baueAuftrag('A-1', mitZusicherung({ ...vollstaendig, baustelle: ohneHinweis })))[0];
  assert.equal(ohne.text.split('\n').length, mit.text.split('\n').length - 1);
  assert.ok(!/Hinweis zur Zufahrt/.test(ohne.text));
});

test('Die Baustelle braucht einen Ansprechpartner vor Ort', () => {
  const ohneTelefon = { ...baustelle };
  delete ohneTelefon.telefon;
  const p = pruefeBestelldaten(mitZusicherung({ ...vollstaendig, baustelle: ohneTelefon }));
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /Ansprechpartner vor Ort/.test(f)), p.fehler.join(' | '));
});

/*
 * Der Fund dieser Runde: Eine vierstellige Postleitzahl über 1000 beweist
 * nicht Österreich. 6900 ist Lugano, 9490 ist Vaduz, 8001 ist Zürich — Schweiz
 * und Liechtenstein sind Drittland, eine Lieferung dorthin ist eine Ausfuhr.
 * Der Rechnungstext behauptet aber „Leistungsort Österreich, Steuersatz 20 %".
 */
test('Eine Schweizer Postleitzahl allein macht die Baustelle nicht österreichisch', () => {
  const proben = [
    ['CH', '6900', 'Lugano'],
    ['LI', '9490', 'Vaduz'],
    ['CH', '8001', 'Zürich'],
  ];
  assert.equal(proben.length, 3);
  for (const [land, plz, ort] of proben) {
    const p = pruefeBestelldaten(mitZusicherung({ ...vollstaendig, baustelle: { ...baustelle, land, plz, ort } }));
    assert.equal(p.gueltig, false, `${ort} wurde angenommen`);
    assert.ok(p.fehler.some((f) => /nur innerhalb Österreichs/.test(f)), p.fehler.join(' | '));
  }
});

test('Ohne Landangabe wird die Baustelle abgewiesen, nicht stillschweigend nach AT gelegt', () => {
  const ohneLand = { ...baustelle };
  delete ohneLand.land;
  const p = pruefeBestelldaten(mitZusicherung({ ...vollstaendig, baustelle: ohneLand }));
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /Land fehlt/.test(f)), p.fehler.join(' | '));
});

test('Steuerzeichen sind auch in den Baustellenfeldern nicht zulässig', () => {
  const felder = ['name', 'strasse', 'ort', 'telefon', 'hinweis'];
  assert.equal(felder.length, 5);
  for (const feld of felder) {
    const p = pruefeBestelldaten(
      mitZusicherung({
        ...vollstaendig,
        baustelle: { ...baustelle, [feld]: `${baustelle[feld] ?? 'x'}\nZusatz` },
      }),
    );
    assert.ok(
      p.fehler.some((f) => /^Baustelle — /.test(f)),
      `${feld} ungeprüft: ${p.fehler.join(' | ')}`,
    );
  }
});

/* ------------------------------------------------------------------ *
 * Die Zusicherung nach Art. 14 DSGVO
 *
 * Der Ansprechpartner vor Ort ist ein Dritter: kein Vertragspartner, seine
 * Nummer stammt vom Besteller, und der Shop erreicht ihn nie. Der einzige Weg
 * führt über den, der ihn kennt.
 * ------------------------------------------------------------------ */

test('Ohne Zusicherung wird eine Bestellung mit Baustelle abgewiesen', () => {
  const p = pruefeBestelldaten({ ...vollstaendig, baustelle });
  assert.equal(p.gueltig, false);
  assert.ok(p.fehler.some((f) => /Art\. 14 DSGVO/.test(f)), p.fehler.join(' | '));
});

test('Mit Zusicherung geht dieselbe Bestellung durch', () => {
  const p = pruefeBestelldaten(mitZusicherung({ ...vollstaendig, baustelle }));
  assert.equal(p.gueltig, true, p.fehler.join(' | '));
});

test('Ohne Baustelle wird die Zusicherung nicht verlangt', () => {
  // Ohne abweichende Anschrift gibt es keinen Dritten. Eine Bestätigung ohne
  // Anlass gewöhnt Kunden daran, Kästchen ungelesen anzuhaken.
  const p = pruefeBestelldaten(vollstaendig);
  assert.equal(p.gueltig, true, p.fehler.join(' | '));
  assert.ok(!p.fehler.some((f) => /Art\. 14/.test(f)));
});

test('Ein angehaktes Kästchen ohne Baustelle ändert nichts', () => {
  const p = pruefeBestelldaten(mitZusicherung(vollstaendig));
  assert.equal(p.gueltig, true, p.fehler.join(' | '));
});

test('Der Wortlaut der Zusicherung steht an einer Stelle und nennt seine Grundlage', () => {
  assert.equal(ZUSICHERUNG_DRITTER.feld, 'ansprechpartnerInformiert');
  assert.match(ZUSICHERUNG_DRITTER.grundlage, /Art\. 14 DSGVO/);
  assert.match(ZUSICHERUNG_DRITTER.text, /Ansprechpartner vor Ort/);
  assert.match(ZUSICHERUNG_DRITTER.text, /Spedition/, 'Der Empfänger gehört in den Wortlaut');
  assert.ok(ZUSICHERUNG_DRITTER.text.length > 100, 'Ein Einzeiler erklärt dem Kunden nichts');
});

test('Das Feld der Zusicherung ist dasselbe, das die Prüfung liest', () => {
  // Sonst stünde der Wortlaut an einer Stelle und die Prüfung an einer anderen
  // — und ein umbenanntes Feld fiele niemandem auf.
  const mitFeld = { ...vollstaendig, baustelle, [ZUSICHERUNG_DRITTER.feld]: true };
  assert.equal(pruefeBestelldaten(mitFeld).gueltig, true);

  const falschesFeld = { ...vollstaendig, baustelle, irgendeinAnderesFeld: true };
  assert.equal(pruefeBestelldaten(falschesFeld).gueltig, false);
});
