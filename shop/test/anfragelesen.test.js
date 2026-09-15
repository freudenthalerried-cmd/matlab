/**
 * Die Anfrage zurücklesen, statt sie abzutippen.
 *
 * **Der Anlass, 3. September 2026.** Der Anfragebetrieb kostet fünfzehn
 * Minuten je Anfrage, und der erste Schritt heißt „Anfrage lesen und den
 * Positionen zuordnen": drei Minuten, in denen ein Mensch Artikelnummern und
 * Mengen aus einer Mail in den Shop zurücktippt.
 *
 * > **Das ist die eine Stelle, an der ein Tippfehler falsche Ware auf eine
 * > Baustelle bringt.**
 *
 * Die Probe geht den ganzen Weg: Anfragetext erzeugen, zurücklesen, und den
 * zurückgelesenen Warenkorb mit dem verglichen, aus dem er entstanden ist.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { lesePositionen, leseAnfrage, rueckwegbefund } from '../src/anfragelesen.js';
import { bestellschritt, mengenschritt } from '../src/gebinde.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';

const lies = (n) => JSON.parse(readFileSync(fileURLToPath(new URL(n, import.meta.url)), 'utf8'));
const lieferanten = lies('../data/lieferanten.json').lieferanten;

/** Ein Sortiment mit einem langen Namen — der erzwingt den Umbruch. */
const artikel = [
  {
    sku: 'POS-51967', bezeichnung: 'Thermo-Trennstein 12-18 EZ Absolut monolithisch weiß mit sehr langem Namen',
    gruppe: 'Mauerwerk', einheit: 'STK', lieferantId: 'poschacher', sperrgut: true,
    vkNetto: 255.91, ekNetto: 1, preisStand: '2026-06-25',
  },
  {
    sku: 'POS-12476', bezeichnung: 'SIKM Rohr 133cm gedämmt 18', gruppe: 'Kamin',
    einheit: 'STK', lieferantId: 'poschacher', sperrgut: true,
    vkNetto: 210.99, ekNetto: 1, preisStand: '2026-07-27',
  },
];
const daten = { artikel, lieferanten, mindestbestellwertNetto: 250 };
const rechne = (zeilen) => kundenWarenkorb(zeilen, daten);

/** Der Text, wie der Kunde ihn abschickt. */
function anfragetext(zeilen) {
  const a = baueKundenanfrage({
    rechnung: rechne(zeilen),
    bezirk: 'Perg',
    betreiber: { firma: 'Freudenthaler Bau GmbH', ort: 'Ried in der Riedmark', email: '' },
    datum: '2026-09-03',
  });
  assert.equal(a.moeglich, true, a.hindernis);
  return a.text;
}

/**
 * Der billige Artikel mit gebrochenem Gebinde — der Fall vom 13. September.
 *
 * `Capatect Kantenschutz … 2,5 m`, 0,95 € je laufendem Meter, abgegeben in
 * Stangen zu 2,5 m. Bestellt 302,50 LFM sind 121 ganze Stangen; die
 * Positionszeile druckt 287,38 €, und `287,38 ÷ 0,95` sind 302,5052…
 */
const kantenschutz = {
  sku: 'POS-53402', bezeichnung: 'Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,5 m',
  gruppe: 'Fassade', einheit: 'LFM', lieferantId: 'poschacher', sperrgut: false,
  vkNetto: 0.95, ekNetto: 0.71, preisStand: '2026-06-25',
};
const mitKantenschutz = { artikel: [...artikel, kantenschutz], lieferanten, mindestbestellwertNetto: 250 };
const rechneMit = (zeilen) => kundenWarenkorb(zeilen, mitKantenschutz);
// **`bestellschritt`, nicht `mengenschritt` — 13. September, dritte Runde.**
// Der Betrieb fragt seit heute nach dem Bestellschritt; eine Probe, die noch die
// Bezeichnung fragt, prüft einen Weg, den niemand mehr geht.
const schritteMit = (sku) => bestellschritt(mitKantenschutz.artikel.find((a) => a.sku === sku));

test('eine Menge, die kein ganzes Gebinde ist, entsteht hier nicht', () => {
  const bestellt = [{ sku: 'POS-53402', menge: 302.5 }];
  const a = baueKundenanfrage({
    rechnung: rechneMit(bestellt),
    bezirk: 'Perg',
    betreiber: { firma: 'Freudenthaler Bau GmbH', ort: 'Ried in der Riedmark', email: '' },
    datum: '2026-09-13',
  });
  assert.equal(a.moeglich, true, a.hindernis);

  /*
   * **Ohne den Gebindeschritt liest die Teilung daneben** — und zwar so, dass
   * die Nachrechnung es nicht sieht: `302,51 × 0,95` sind auf Cent gerundet
   * dieselben 287,38 €, die im Text stehen. Der Leser meldete deshalb
   * `gelesen: true` und gab eine Ware zurück, die niemand liefern kann.
   */
  const ohne = leseAnfrage(a.text, rechneMit);
  assert.equal(ohne.gelesen, true, 'die Summenprobe sieht den Fehler nicht — darum geht es');
  assert.deepEqual(ohne.zeilen, [{ sku: 'POS-53402', menge: 302.51 }]);

  const mit = leseAnfrage(a.text, rechneMit, { schrittFuer: schritteMit });
  assert.equal(mit.gelesen, true, mit.grund);
  assert.deepEqual(mit.zeilen, bestellt, 'die bestellte Menge kommt nicht unverändert zurück');
});

test('trifft kein ganzes Gebinde die Zeilensumme, wird nicht geraten', () => {
  // Eine Zeilensumme, die zu keinem Vielfachen von 2,5 LFM passt: 121,5 Stangen
  // gibt es nicht, und 115,52 € sind weder 302,50 noch 305,00 LFM.
  const gelesen = lesePositionen('  POS-53402   0,95 €   115,52 €', { schrittFuer: schritteMit });
  assert.deepEqual(gelesen.zeilen, []);
  assert.match(gelesen.meldungen[0], /kein ganzes Gebinde zu 2\.5/);
});

test('Stückgut ist dabei — der Leser fragt nach dem Bestellschritt, nicht nach der Bezeichnung', () => {
  /*
   * **13. September 2026, dritte Runde.** Der Einrastschutz kam am 12., der
   * `bestellschritt` am 13. — angeschlossen an den **Leser** war er nicht.
   * `mengenschritt` liest die Gebindegröße aus der Bezeichnung und findet sie
   * bei Stück, Sack, Eimer, Karton, Dose und Rolle nicht; im Bestand waren das
   * 28 von 46 Artikeln.
   *
   * ```
   * POS-53215  Rahmenschraube …  STK  0,67 €
   *   Zeile „0,67 €  1,01 €"  →  gelesen 1,51 Stück
   * ```
   *
   * > **Anderthalb Schrauben, und die Sperre dagegen lag seit dem Vormittag
   * > im Haus.**
   */
  const schraube = {
    sku: 'POS-53215', bezeichnung: 'Rahmenschraube Zylinderkopf vz 7,5x182 mm lose',
    gruppe: 'Zubehör', einheit: 'STK', lieferantId: 'poschacher', sperrgut: false,
    vkNetto: 0.67, ekNetto: 0.5, preisStand: '2026-06-25',
  };
  const zeile = '  POS-53215   0,67 €   1,01 €';

  const nachBezeichnung = lesePositionen(zeile, { schrittFuer: () => mengenschritt(schraube) });
  assert.deepEqual(nachBezeichnung.zeilen, [{ sku: 'POS-53215', menge: 1.51 }],
    'ohne Bestellschritt kommt eine gebrochene Stückzahl zurück — das ist der Fund');

  const nachBestellschritt = lesePositionen(zeile, { schrittFuer: () => bestellschritt(schraube) });
  assert.deepEqual(nachBestellschritt.zeilen, [],
    'anderthalb Schrauben gehen weiterhin durch');
  assert.match(nachBestellschritt.meldungen[0], /kein ganzes Gebinde zu 1/);
});


test('der Rückweg gilt für jede Menge, die die Oberfläche bilden kann', () => {
  /*
   * Die Prüfung, die den Fund festhält: Hin und zurück über alle Artikel und
   * alle Vielfachen ihres Gebindes. Der gesunde Zustand ist null Meldungen —
   * und die Zahl der gerechneten Mengen sagt, dass etwas gemessen wurde.
   */
  const befund = rueckwegbefund(mitKantenschutz.artikel, schritteMit, { bis: 200 });
  assert.equal(befund.sauber, true,
    `der Rückweg verliert Mengen: ${befund.meldungen.slice(0, 2).map((m) => m.text).join(' | ')}`);
  assert.equal(befund.mengen, mitKantenschutz.artikel.length * 200);

  /*
   * **Und was nicht gefahren wurde, wird gezählt — 13. September, dritte
   * Runde.** Hier rechnete der Sweep mit einem Schritt von 1 weiter, wo keiner
   * bekannt war, und übersprang dabei die Gegenrichtung. Ein Artikel ohne
   * Bestellschritt fällt jetzt aus der Zählung heraus und steht namentlich da.
   */
  const unlesbar = { ...kantenschutz, sku: 'POS-21382', bezeichnung: 'Grundmauerschutz 20 1,5 m', einheit: 'M2' };
  const mitLuecke = rueckwegbefund([...mitKantenschutz.artikel, unlesbar],
    (sku) => bestellschritt([...mitKantenschutz.artikel, unlesbar].find((a) => a.sku === sku)),
    { bis: 200 });
  assert.deepEqual(mitLuecke.ohneSchritt, ['POS-21382'],
    'ein Artikel ohne Bestellschritt wird mit einem geratenen Schritt gefahren');
  assert.equal(mitLuecke.mengen, mitKantenschutz.artikel.length * 200,
    'die nicht gefahrene Strecke zählt mit');

  /*
   * **Und die Gegenrichtung, sonst misst der Fall nichts.** Dieselbe Prüfung
   * über einen Leser **ohne** Gebindeschritt muss rot werden — läuft sie auch
   * dann grün, deckt der Fall oben eine Strecke ab, auf der es nichts zu
   * finden gibt. Der Sweep baut seine Mengen weiter aus dem Gebinde; nur das
   * Zurücklesen ist blindgestellt.
   */
  const blind = rueckwegbefund(mitKantenschutz.artikel, schritteMit, { bis: 200, leseMit: null });
  assert.ok(blind.meldungen.length > 0,
    'ohne Gebindeschritt fällt keine einzige Menge auf — dann prüft der Fall oben nichts');
  assert.equal(blind.meldungen[0].sku, 'POS-53402');
  assert.match(blind.meldungen[0].text, /bestellt 2\.5, .* zurückgelesen 2\.51/,
    'schon die kleinste bestellbare Menge dieses Artikels kommt anders zurück');
});


test('der zurückgelesene Warenkorb ist der abgeschickte', () => {
  const zeilen = [{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }];
  const e = leseAnfrage(anfragetext(zeilen), rechne);
  assert.equal(e.gelesen, true, e.grund);
  const nachNummer = (l) => [...l].sort((a, b) => a.sku.localeCompare(b.sku));
  assert.deepEqual(nachNummer(e.zeilen), nachNummer(zeilen));
  assert.equal(e.bezirk, 'Perg');
  assert.equal(e.rechnung.warenwertNetto, rechne(zeilen).warenwertNetto);
});

test('die Menge kommt aus der Rechnung, nicht aus der Zeilenanordnung', () => {
  // Der lange Name bricht um; die Menge steht dann auf einer anderen Zeile als
  // die Artikelnummer. Genau deshalb wird sie aus Zeilensumme ÷ Einzelpreis
  // gerechnet — beide stehen mit der Nummer auf derselben Zeile.
  const text = anfragetext([{ sku: 'POS-51967', menge: 3 }]);
  const mitNummer = text.split('\n').filter((z) => z.includes('POS-51967'));
  assert.equal(mitNummer.length, 1, 'die Artikelnummer steht auf genau einer Zeile');
  assert.ok(!/^\s*3\s/.test(mitNummer[0]), 'die Menge steht nicht auf derselben Zeile — sonst prüft dieser Fall nichts');
  assert.deepEqual(lesePositionen(text).zeilen, [{ sku: 'POS-51967', menge: 3 }]);
});

test('gebrochene Mengen kommen unverfälscht zurück', () => {
  const zeilen = [{ sku: 'POS-12476', menge: 1 }, { sku: 'POS-51967', menge: 2 }];
  const e = leseAnfrage(anfragetext(zeilen), rechne);
  assert.equal(e.gelesen, true, e.grund);
  const summe = e.zeilen.reduce((n, z) => n + z.menge, 0);
  assert.equal(summe, 3);
});

test('ein veränderter Betrag wird nicht überschrieben, sondern gemeldet', () => {
  // Der Fall, für den der Leser gebaut ist: Der Text sagt etwas anderes, als
  // die Zeilen ergeben — geänderter Preis oder veränderter Text.
  const text = anfragetext([{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }])
    .replace('677,89', '699,00');
  const e = leseAnfrage(text, rechne);
  assert.equal(e.gelesen, false);
  assert.match(e.grund, /Summen stimmen nicht überein/);
  assert.match(e.grund, /Warenwert/);
});

test('eine unbekannte Artikelnummer bricht das Lesen ab', () => {
  const text = anfragetext([{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }])
    .replace('POS-12476', 'POS-99999');
  const e = leseAnfrage(text, rechne);
  assert.equal(e.gelesen, false);
  assert.match(e.grund, /nicht rechnen|Unbekannte/);
});

test('ein fremder Text ergibt keine Positionen, sondern einen Grund', () => {
  for (const text of ['', 'Guten Tag, bitte um ein Angebot. Danke.', null]) {
    const e = leseAnfrage(text, rechne);
    assert.equal(e.gelesen, false, `„${text}" wurde gelesen`);
    assert.ok(e.grund.length > 20);
  }
});

test('Summenzeilen werden nicht für Positionen gehalten', () => {
  // „Warenwert 677,89 €" trägt einen Betrag und keine Artikelnummer;
  // „Netto gesamt" ebenso. Beide dürfen nicht als Position zählen.
  const text = anfragetext([{ sku: 'POS-51967', menge: 1 }, { sku: 'POS-12476', menge: 2 }]);
  const gelesen = lesePositionen(text);
  assert.equal(gelesen.zeilen.length, 2, `${gelesen.zeilen.length} Positionen statt zwei`);
  assert.deepEqual(gelesen.meldungen, [], gelesen.meldungen.join(' | '));
});

test('die Werkzeuge, die eine Anfrage lesen, fragen nach dem Bestellschritt', () => {
  /*
   * **13. September 2026, dritte Runde.** Der Einrastschutz kam am 12., der
   * `bestellschritt` am 13. — angeschlossen an die **Werkzeuge** war er nicht.
   * Beide reichten weiter `mengenschritt` herein, und der liest die
   * Gebindegröße aus der Bezeichnung: Bei Stück, Sack, Eimer, Karton, Dose und
   * Rolle steht dort keine, im Bestand bei 28 von 46 Artikeln.
   *
   * > **Ein Maßstab, der im Haus liegt und nicht angelegt wird, ist keiner.**
   *
   * Gemessen wird deshalb die Verdrahtung, nicht ihr Ergebnis: Dass die
   * heutigen Preise zufällig zu keiner gebrochenen Stückzahl führen, ist kein
   * Schutz — der Preis ändert sich, die Frage bleibt.
   */
  for (const werkzeug of ['../bin/anfrage-lesen.mjs', '../bin/vorgang.mjs', '../bin/rueckwegpruefung.mjs']) {
    const quelle = readFileSync(fileURLToPath(new URL(werkzeug, import.meta.url)), 'utf8');
    assert.ok(/bestellschritt\(/.test(quelle),
      `${werkzeug} reicht keinen Bestellschritt herein — Stückgut bleibt ungeschützt`);
    assert.ok(!/mengenschritt\(/.test(quelle),
      `${werkzeug} fragt wieder die Bezeichnung statt die Ware`);
  }
});

/*
 * ## Drei Regeln, die niemand hat feuern sehen
 *
 * **14. September 2026, abends.** Der Rückweg prüft, ob aus einer Zeile des
 * erzeugten Anfragetexts dieselbe Menge zurückkommt, die bestellt wurde. Alle
 * drei Regeln greifen erst, wenn der **Leser** sich ändert — und dann geht es
 * nicht um einen Zahlendreher, sondern darum, dass der Beleg eine andere Ware
 * nennt als die bestellte.
 */
const ware = { sku: 'POS-77010', vkNetto: 10, einheit: 'M2' };

test('Eine Menge, die nicht zurückkommt', () => {
  // Ein Leser, der auf ein doppelt so großes Gebinde einrastet: Die Zeile zu
  // einer einzelnen Einheit trifft dann kein ganzes Gebinde mehr.
  const b = rueckwegbefund([ware], () => 1, { bis: 2, leseMit: () => 2 });
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['menge-nicht-lesbar'],
    JSON.stringify(b.meldungen));
});

/*
 * Die beiden anderen Regeln des Rückwegs — `menge-kommt-anders-zurueck` und
 * `krummer-betrag-wird-uebernommen` — lassen sich von hier aus **nicht**
 * zeigen, und der Grund ist ihr Gegenstand: Sie bewachen ein **Paar** aus
 * Schreiber und Leser, und die Prüfung des Lesers auf eine halbe Cent-Abweichung
 * weist heute schon alles ab, was sie melden würden.
 *
 * > **Eine Regel, die eine zweite Sperre bewacht, schweigt, solange die erste
 * > hält — und wird gebraucht, wenn jemand die erste lockert.**
 *
 * Gemessen: Mit abgeschalteter Cent-Prüfung feuern beide sofort. Sie stehen
 * deshalb mit diesem Grund in `REGEL_GEPRUEFT`, und die Gegenprobe
 * `der-leser-nimmt-jede-zeilensumme-hin` schaltet genau diese Sperre ab.
 */
