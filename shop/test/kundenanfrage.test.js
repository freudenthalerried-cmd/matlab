import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baueKundenanfrage, mailtoAdresse, pruefeAnfrageAufGeheimnis, MAILTO_HOECHSTLAENGE }
  from '../src/kundenanfrage.js';
import { kundenWarenkorb } from '../src/shopkern.js';

const katalog = JSON.parse(readFileSync(new URL('../data/katalog-baustoff.json', import.meta.url), 'utf8'));
const lieferanten = JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url), 'utf8'));

/**
 * Die Preise stehen nicht im Katalog, sondern werden gerechnet. Für diese
 * Tests genügt ein einfacher, aber **echter** Aufschlag auf einen frei
 * gewählten Einkaufspreis — geprüft wird der Text, nicht die Kalkulation.
 */
function preisliste() {
  return katalog.artikel.map((a, i) => ({
    sku: a.sku,
    bezeichnung: a.bezeichnung,
    gruppe: a.gruppe,
    einheit: a.einheit,
    lieferantId: a.lieferantId,
    sperrgut: a.sperrgut,
    preisStand: a.preisStand,
    // Die Einkaufspreise liegen bewusst in einem Zahlenraum, den kein
    // Verkaufspreis und keine Summe dieses Korbs erreicht. Nicht um den Test
    // grün zu bekommen, sondern weil die Zahlenprüfung sonst Zufälle meldet:
    // Beim ersten Lauf war der Verkaufspreis des einen Artikels auf den Cent
    // der Einkaufspreis des anderen, und der Test schlug an, ohne dass im
    // Text ein Geheimnis stand.
    ekNetto: 9000 + i,
    vkNetto: Number(((10 + i) / 0.75).toFixed(2)),
    gewichtKg: i % 3 === 0 ? 25 : null,
  }));
}

const artikel = preisliste();
const daten = { artikel, lieferanten: lieferanten.lieferanten };
const zwei = [{ sku: artikel[0].sku, menge: 3 }, { sku: artikel[1].sku, menge: 2 }];
const betreiber = { firma: 'Freudenthaler Bau GmbH', ort: 'Ried in der Riedmark', email: '' };

function anfrageFuer(zeilen, extra = {}) {
  const rechnung = kundenWarenkorb(zeilen, daten);
  return baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29', ...extra });
}

test('der Anfragetext nennt sich in der ersten Zeile Anfrage und keine Bestellung', () => {
  const a = anfrageFuer(zwei);
  assert.equal(a.moeglich, true);
  assert.match(a.text.split('\n')[0], /UNVERBINDLICHE ANFRAGE/);
  assert.match(a.text, /keine Bestellung/);
});

test('jede Position steht mit Menge, Einheit, Artikelnummer und Zeilensumme im Text', () => {
  const a = anfrageFuer(zwei);
  const rechnung = kundenWarenkorb(zwei, daten);
  // Zuerst die Länge: Eine Schleife über eine leere Liste prüft nichts und
  // meldet trotzdem Grün.
  assert.equal(rechnung.positionen, 2);
  assert.ok(rechnung.teillieferungen.length >= 1);
  let gezaehlt = 0;
  for (const teil of rechnung.teillieferungen) {
    assert.ok(teil.positionen.length >= 1);
    for (const p of teil.positionen) {
      gezaehlt++;
      assert.ok(a.text.includes(p.sku), `${p.sku} fehlt im Text`);
      assert.ok(a.text.includes(p.bezeichnung), `${p.bezeichnung} fehlt im Text`);
      assert.ok(a.text.includes(`${String(p.menge).replace('.', ',')} ${p.einheit}`),
        `Menge von ${p.sku} fehlt`);
      assert.ok(a.text.includes(p.zeilensummeNetto.toFixed(2).replace('.', ',')),
        `Zeilensumme von ${p.sku} fehlt`);
    }
  }
  assert.equal(gezaehlt, 2);
});

test('die Summen im Text stimmen mit der Rechnung überein', () => {
  const rechnung = kundenWarenkorb(zwei, daten);
  const a = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29' });
  for (const wert of [rechnung.warenwertNetto, rechnung.frachtNetto, rechnung.nettoGesamt,
    rechnung.ustBetrag, rechnung.bruttoGesamt]) {
    assert.ok(a.text.includes(wert.toFixed(2).replace('.', ',')),
      `${wert} fehlt im Anfragetext`);
  }
});

test('ohne Bezirk und mit leerem Korb entsteht kein Text, sondern ein Hindernis', () => {
  const rechnung = kundenWarenkorb(zwei, daten);
  const ohneBezirk = baueKundenanfrage({ rechnung, bezirk: '', betreiber });
  assert.equal(ohneBezirk.moeglich, false);
  assert.equal(ohneBezirk.text, '');
  assert.match(ohneBezirk.hindernis, /Bezirk/);

  const leer = baueKundenanfrage({ rechnung: kundenWarenkorb([], daten), bezirk: 'Perg', betreiber });
  assert.equal(leer.moeglich, false);
  assert.match(leer.hindernis, /leer/);
});

test('Gate 23: aus einem Bezirk außerhalb des Liefergebiets entsteht kein Anfragetext', () => {
  const rechnung = kundenWarenkorb(zwei, daten);
  const a = baueKundenanfrage({ rechnung, bezirk: 'Innsbruck-Land', betreiber });
  assert.equal(a.moeglich, false);
  assert.equal(a.text, '');
  assert.ok(a.hindernis.length > 10);
});

test('der Text nennt den Preisstand und dass die Preise freibleibend sind', () => {
  const a = anfrageFuer(zwei);
  assert.match(a.text, /Preisstand der Positionen: \d{4}-\d{2}-\d{2}/);
  assert.match(a.text, /freibleibend/);
});

test('kein Einkaufspreis und kein Wort der Kalkulation steht im Anfragetext', () => {
  // Der ganze Bestand, nicht zwei Positionen: Was hier durchrutscht, rutscht
  // sonst genau bei dem Artikel durch, den niemand geprüft hat.
  const alle = artikel.map((a) => ({ sku: a.sku, menge: 1 }));
  const a = anfrageFuer(alle);
  assert.equal(a.moeglich, true);
  assert.deepEqual(pruefeAnfrageAufGeheimnis(a.text, artikel), []);
  // Und die Gegenrichtung: Der Text ist nicht deshalb sauber, weil er kurz
  // ist. Er trägt jede der 46 Positionen.
  for (const p of artikel) assert.ok(a.text.includes(p.sku), `${p.sku} fehlt`);
});

test('die Geheimnisprüfung schlägt an, wenn ein Einkaufspreis im Text steht', () => {
  // Gegenprobe: Ohne sie wäre der Test darüber auch dann grün, wenn die
  // Prüfung gar nichts sucht.
  const treffer = pruefeAnfrageAufGeheimnis('Zeile mit 10,00 € darin', [{ sku: 'X', ekNetto: 10 }]);
  assert.equal(treffer.length, 1);
  assert.match(treffer[0], /Einkaufspreis/);
  assert.equal(pruefeAnfrageAufGeheimnis('enthält das Wort Marge', []).length, 1);
});

test('ohne hinterlegte E-Mail-Adresse gibt es keine mailto-Adresse, aber einen Hinweis', () => {
  const a = anfrageFuer(zwei);
  assert.equal(a.empfaenger, null);
  assert.equal(mailtoAdresse(a), null);
  assert.ok(a.hinweise.some((h) => /E-Mail-Adresse/.test(h)));
});

test('mit Adresse entsteht eine mailto-Adresse, die Betreff und Text trägt', () => {
  const a = anfrageFuer(zwei, { betreiber: { ...betreiber, email: 'office@example.at' } });
  const adresse = mailtoAdresse(a);
  assert.ok(adresse.startsWith('mailto:office%40example.at?subject='));
  assert.ok(adresse.includes(encodeURIComponent('UNVERBINDLICHE ANFRAGE')));
  assert.ok(adresse.length <= MAILTO_HOECHSTLAENGE);
});

test('eine lange Liste bekommt keine mailto-Adresse, statt einer stillschweigend gekürzten', () => {
  const alle = artikel.map((a) => ({ sku: a.sku, menge: 1 }));
  const a = anfrageFuer(alle, { betreiber: { ...betreiber, email: 'office@example.at' } });
  assert.equal(a.moeglich, true);
  assert.ok(a.text.length > 1000);
  assert.equal(mailtoAdresse(a), null,
    'Eine gekürzte Positionsliste in der Mail wäre schlimmer als kein Knopf');
});

test('das Gewicht steht im Text und sagt dazu, für wie viele Positionen es fehlt', () => {
  const a = anfrageFuer(zwei);
  const rechnung = kundenWarenkorb(zwei, daten);
  // Der Korb ist so gewählt, dass beide Fälle vorkommen: eine Position mit
  // hinterlegtem Gewicht und eine ohne. Stünden die Zusicherungen in einem
  // `if`, prüfte der Test nichts, sobald die Auswahl sich ändert — deshalb
  // steht die Voraussetzung als eigene Zusicherung da.
  assert.ok(rechnung.gewichtKg > 0, 'der Prüfkorb muss ein bekanntes Gewicht enthalten');
  assert.ok(rechnung.positionenOhneGewicht > 0, 'und eine Position ohne Gewicht');
  assert.match(a.text, /Gewicht/);
  assert.match(a.text, /nicht hinterlegt/);
});

test('Mengen stehen mit Komma und lesbarer Einheit im Anfragetext', () => {
  // Bis zum 29.08. stand hier „5.25 M2": der Punkt aus JavaScript und das
  // Kürzel aus dem Katalog. Ein Text, der an einen Kunden geht, schreibt
  // nicht in Datenbankschreibweise.
  const rechnung = kundenWarenkorb([{ sku: artikel[0].sku, menge: 5.25 }], daten);
  const a = baueKundenanfrage({
    rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29',
    einheiten: { [artikel[0].einheit]: 'm²' },
  });
  assert.match(a.text, /5,25 m²/);
  assert.ok(!a.text.includes('5.25'), 'kein Dezimalpunkt im Kundentext');
});

test('ohne Einheitentabelle bleibt das Kürzel stehen, statt zu verschwinden', () => {
  const rechnung = kundenWarenkorb([{ sku: artikel[0].sku, menge: 2 }], daten);
  const a = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29' });
  assert.ok(a.text.includes(`2 ${artikel[0].einheit}`),
    'lieber das Kürzel als gar keine Einheit');
});
