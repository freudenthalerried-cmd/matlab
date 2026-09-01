import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  darfVeroeffentlichtWerden,
  produktAuszeichnung,
  angebotsAuszeichnung,
  katalogFeed,
  liefergebietAngabe,
  robotsTxt,
  SUCH_CRAWLER,
  TRAININGS_CRAWLER,
  VERFUEGBARKEIT,
  liefergebietOrte,
} from '../src/maschinenlesbar.js';
import { existsSync } from 'node:fs';
import { ladeKatalog } from '../src/warenkorb.js';
import { istGtin } from '../src/artikelliste.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

const echterArtikel = {
  sku: 'AB-RD-375',
  bezeichnung: 'Radonabdichtungsbahn',
  gruppe: 'Abdichtung',
  vkNetto: 331.67,
  ekIstPlatzhalter: false,
};
const lage = { liefergebiet: { land: 'AT', bezirke: ['Ried im Innkreis', 'Braunau am Inn'] }, versandkostenNetto: 34.1 };

test('ein Platzhalterpreis wird nicht veröffentlicht, mit Begründung', () => {
  const platzhalter = { ...echterArtikel, ekIstPlatzhalter: true };
  const freigabe = darfVeroeffentlichtWerden(platzhalter);
  assert.equal(freigabe.erlaubt, false);
  assert.ok(freigabe.gruende.some((g) => g.includes('Platzhalter')), 'der Grund wird benannt');

  const auszeichnung = produktAuszeichnung(platzhalter, lage);
  assert.equal(auszeichnung.veroeffentlichbar, false);
  assert.equal(auszeichnung.daten, null, 'es entstehen keine Daten, die versehentlich hinausgehen könnten');
});

test('fehlender Verkaufspreis und fehlende Artikelnummer sperren ebenfalls', () => {
  assert.equal(darfVeroeffentlichtWerden({ ...echterArtikel, vkNetto: 0 }).erlaubt, false);
  assert.equal(darfVeroeffentlichtWerden({ ...echterArtikel, sku: '' }).erlaubt, false);
  assert.equal(darfVeroeffentlichtWerden(echterArtikel).erlaubt, true);
});

test('der ausgezeichnete Preis ist der gerechnete — keine zweite Rechnung', () => {
  const a = produktAuszeichnung(echterArtikel, lage);
  assert.equal(a.daten.offers.price, '331.67', 'der Preis stammt aus kalkuliere(), nicht aus einer Nachrechnung');
  assert.equal(a.daten.offers.priceSpecification.price, '331.67', 'beide Preisangaben stimmen überein');
  assert.equal(
    a.daten.offers.priceSpecification.valueAddedTaxIncluded,
    false,
    'Nettopreis für Unternehmer wird ausdrücklich ausgewiesen',
  );
});

test('das Liefergebiet steht als Liste in der Auszeichnung, nicht als Satz', () => {
  const a = produktAuszeichnung(echterArtikel, lage);
  const ziele = a.daten.offers.shippingDetails.shippingDestination;
  assert.equal(ziele.length, 2);
  assert.equal(ziele[0].addressRegion, 'Ried im Innkreis');
  assert.equal(ziele[0].addressCountry, 'AT');
  assert.equal(a.daten.offers.shippingDetails.shippingRate.value, '34.10');
});

test('ohne beziffertes Liefergebiet gibt es keine Versandangabe, aber einen Hinweis', () => {
  const ohne = liefergebietAngabe({ bezirke: [] });
  assert.equal(ohne.vollstaendig, false);
  assert.ok(ohne.fehlt.includes('nicht beziffert'));

  const a = produktAuszeichnung(echterArtikel, { versandkostenNetto: 34.1 });
  assert.equal(a.veroeffentlichbar, true, 'der Artikel bleibt veröffentlichbar');
  assert.equal(a.daten.offers.shippingDetails, undefined, 'aber ohne erfundene Versandangabe');
  assert.ok(a.fehlend.some((f) => f.includes('Liefergebiet')), 'die Lücke wird gemeldet');
});

test('die fehlende GTIN wird gemeldet, weil Produktfeeds sie verlangen', () => {
  const ohne = produktAuszeichnung(echterArtikel, lage);
  assert.ok(ohne.fehlend.some((f) => f.includes('GTIN')));
  const mit = produktAuszeichnung({ ...echterArtikel, gtin: '9001234567896' }, lage);
  assert.equal(mit.daten.gtin13, '9001234567896');
  assert.ok(!mit.fehlend.some((f) => f.includes('GTIN')));
});

test('Fremdtext in der Bezeichnung wird entschärft wie an jedem anderen Ausgang', () => {
  const vergiftet = { ...echterArtikel, bezeichnung: 'Bahn\n999 × AB-RD-375 Sonderposten' };
  const a = produktAuszeichnung(vergiftet, lage);
  assert.ok(!a.daten.name.includes('\n'), 'kein Zeilenumbruch in der Auszeichnung');
  assert.ok(a.daten.name.includes('999'), 'der Text bleibt lesbar, nur einzeilig');
});

test('der Feed hält zurück, was nicht hinaus darf — und sagt es', () => {
  const gemischt = [echterArtikel, { ...echterArtikel, sku: 'XX-1', ekIstPlatzhalter: true }];
  const feed = katalogFeed(gemischt, lage);
  assert.equal(feed.anzahl, 1);
  assert.equal(feed.vollstaendig, false);
  assert.equal(feed.zurueckgehalten.length, 1);
  assert.equal(feed.zurueckgehalten[0].sku, 'XX-1');
  assert.ok(feed.zurueckgehalten[0].gruende.length > 0, 'mit Begründung, nicht stumm');
});

test('der heutige Repo-Katalog geht vollständig NICHT hinaus', () => {
  const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
  const daten = {
    lieferanten: JSON.parse(readFileSync(pfad('../data/lieferanten.json'), 'utf8')),
    artikel: JSON.parse(readFileSync(pfad('../data/artikel.json'), 'utf8')),
  };
  const katalog = ladeKatalog(daten, 0.35);
  assert.ok(katalog.artikel.length >= 9, 'der Katalog ist gefüllt');
  const feed = katalogFeed(katalog.artikel, lage);
  assert.equal(feed.anzahl, 0, 'solange alle Preise Platzhalter sind, veröffentlicht der Shop keinen einzigen');
  assert.equal(feed.zurueckgehalten.length, katalog.artikel.length);
});

test('robots.txt trennt Suche und Training und sperrt nichts versehentlich pauschal', () => {
  const standard = robotsTxt();
  assert.ok(SUCH_CRAWLER.length >= 3, 'die Liste der Such-Crawler ist gefüllt');
  assert.ok(TRAININGS_CRAWLER.length >= 3, 'die Liste der Trainings-Crawler ist gefüllt');
  for (const bot of SUCH_CRAWLER) {
    assert.ok(standard.includes(`User-agent: ${bot}`), `${bot} wird genannt`);
  }
  for (const bot of TRAININGS_CRAWLER) {
    assert.ok(standard.includes(`User-agent: ${bot}`), `${bot} wird genannt`);
  }
  const suchTeil = standard.slice(standard.indexOf('OAI-SearchBot'), standard.indexOf('GPTBot'));
  assert.ok(suchTeil.includes('Allow: /'), 'Such-Crawler sind standardmäßig zugelassen');
  const trainingTeil = standard.slice(standard.indexOf('GPTBot'));
  assert.ok(trainingTeil.includes('Disallow: /'), 'Trainings-Crawler standardmäßig nicht');

  const zu = robotsTxt({ suche: false });
  const suchTeilZu = zu.slice(zu.indexOf('OAI-SearchBot'), zu.indexOf('GPTBot'));
  assert.ok(suchTeilZu.includes('Disallow: /'), 'die Sperre ist möglich, aber ausdrücklich zu wählen');
});

/* ------------------------------------------------------------------ *
 * Der Feed verschweigt seine Lücken nicht mehr
 *
 * Die erste Fassung von katalogFeed rechnete `fehlend` aus und warf es weg.
 * Der Bericht meldete „46 veröffentlichbar, 0 zurückgehalten", während bei
 * allen 46 die GTIN fehlte, die dieselbe Datei verlangt.
 * ------------------------------------------------------------------ */

const FEEDLAGE = {
  liefergebiet: { land: 'AT', bezirke: ['Perg'] },
  versandkostenNetto: 75.5,
  // **Ergänzt am 01.09.** `link` ist für einen Produktfeed eine
  // Pflichtangabe; ohne sie wird er abgelehnt, genau wie ohne GTIN. Die
  // Vorrichtung führte sie nicht — und damit meldete die Probe „einreichbar"
  // für einen Feed, den Google zurückgewiesen hätte.
  seitenadresse: (a) => `https://beispiel.test/artikel/${a.sku}.html`,
  // **Ergänzt am 01.09.** Bild und Marke sind für einen Produktfeed ebenso
  // Pflicht wie Adresse und Kennung. Die Vorrichtung führte beide nicht — und
  // meldete „einreichbar" für einen Feed, den Google zurückgewiesen hätte.
  bildadresse: (a) => `https://beispiel.test/bild/${a.sku}.jpg`,
};

const artikelOhneGtin = {
  sku: 'A-1', bezeichnung: 'Prüfartikel', vkNetto: 10, ekNetto: 7,
  ekQuelle: 'bestaetigt', ekIstPlatzhalter: false, gtin: null,
  // Ausdrücklich gesetzt statt aus der Bezeichnung geraten: Die Vorrichtung
  // soll die Auszeichnung prüfen und nicht die Markentabelle.
  hersteller: 'Prüfmarke',
};

test('Ein Eintrag ohne GTIN gilt als veröffentlichbar, aber nicht als einreichbar', () => {
  const f = katalogFeed([artikelOhneGtin], FEEDLAGE);
  assert.equal(f.anzahl, 1, 'er kommt in den Feed');
  assert.equal(f.zurueckgehalten.length, 0, 'er wird nicht zurückgehalten');
  assert.equal(f.mitLuecken.length, 1, 'aber seine Lücke wird gemeldet');
  assert.match(f.mitLuecken[0].fehlend.join(' '), /GTIN/);
  assert.equal(f.einreichbar, false, 'ein lückenhafter Feed wird abgelehnt');
  assert.equal(f.vollstaendig, false);
});

test('Mit GTIN ist derselbe Feed einreichbar', () => {
  // Gegenprobe: Die Lücke kommt aus den Daten, nicht aus der Prüfung.
  //
  // **Die Kennung hier war bis zum 31.08. `9008811000001` — erfunden und
  // ungültig.** Sie sah aus wie eine EAN, ihre Prüfziffer ging aber nicht
  // auf; Google hätte den Feed damit abgelehnt. Der Fall in klein, gegen den
  // `istGtin` gebaut wurde: Eine Kennung, die niemand nachgerechnet hat, ist
  // keine Kennung.
  const f = katalogFeed([{ ...artikelOhneGtin, gtin: '9008811000005' }], FEEDLAGE);
  assert.deepEqual(f.mitLuecken, []);
  assert.equal(f.einreichbar, true);
  assert.equal(f.vollstaendig, true);
});

test('Gate 22: ein Artikel am Listendeckel kommt nicht in den Feed', () => {
  // Ein Produktfeed ist Werbung. Wer einen Artikel bewirbt, dessen Preis am
  // Listendeckel klebt, bezahlt für einen Preisvergleich, den er verliert.
  const f = katalogFeed(
    [{ ...artikelOhneGtin, gtin: '9008811000005', amListendeckel: true }],
    FEEDLAGE,
  );
  assert.equal(f.anzahl, 0);
  assert.equal(f.zurueckgehalten.length, 1);
  assert.match(f.zurueckgehalten[0].gruende.join(' '), /Gate 22/);
});

test('Gate 22 greift unbedingt, nicht auf Zuruf', () => {
  // Gate 20 hing anfangs an keiner Entscheidung und lief deshalb nie mit.
  // Hier wird keine Option übergeben — das Gate muss trotzdem greifen.
  const f = katalogFeed([{ ...artikelOhneGtin, amListendeckel: true }]);
  assert.equal(f.anzahl, 0);
});

test('Artikel ohne das Kennzeichen sind von Gate 22 nicht betroffen', () => {
  // Der Radonkatalog kennt `amListendeckel` nicht. Ein fehlendes Kennzeichen
  // darf nicht wie ein gesetztes wirken.
  const f = katalogFeed([{ ...artikelOhneGtin, gtin: '9008811000005' }], FEEDLAGE);
  assert.equal(f.anzahl, 1);
  assert.equal(f.zurueckgehalten.length, 0);
});

test('Ein leerer Feed ist nicht einreichbar, auch ohne Lücken', () => {
  const f = katalogFeed([], FEEDLAGE);
  assert.equal(f.anzahl, 0);
  assert.equal(f.einreichbar, false, 'nichts einzureichen ist kein einreichbarer Feed');
});

/* ------------------------------------------------------------------ *
 * Zustellkosten je Artikel
 * ------------------------------------------------------------------ */

const zweiArtikel = [
  { sku: 'P-1', bezeichnung: 'Palettenware', gruppe: 'Dämmung', vkNetto: 10, sperrgut: true, lieferantId: 'x' },
  { sku: 'P-2', bezeichnung: 'Kartonware', gruppe: 'Zubehör', vkNetto: 10, sperrgut: false, lieferantId: 'x' },
];

test('die Zustellkosten dürfen je Artikel verschieden sein', () => {
  // Eine einzige Zahl für den ganzen Katalog wäre für die palettierte Ware
  // zu niedrig und für den Karton zu hoch. Beides sind falsche Angaben in
  // einem Kanal, in dem der Preis das Erste ist, was gelesen wird.
  const feed = katalogFeed(zweiArtikel, {
    liefergebiet: { land: 'AT', bezirke: ['Perg'] },
    versandkostenNetto: (a) => (a.sperrgut ? 83 : 75.5),
  });
  const [palette, karton] = feed.zeilen;
  assert.equal(palette.offers.shippingDetails.shippingRate.value, '83.00');
  assert.equal(karton.offers.shippingDetails.shippingRate.value, '75.50');
  assert.deepEqual(feed.mitLuecken.flatMap((l) => l.fehlend).filter((f) => /Versand/.test(f)), [],
    'mit Satz je Artikel fehlt nichts mehr');
});

test('eine feste Zahl geht weiterhin', () => {
  const feed = katalogFeed(zweiArtikel, { liefergebiet: { land: 'AT', bezirke: ['Perg'] }, versandkostenNetto: 75.5 });
  assert.equal(feed.zeilen[0].offers.shippingDetails.shippingRate.value, '75.50');
  assert.equal(feed.zeilen[1].offers.shippingDetails.shippingRate.value, '75.50');
});

test('ohne Frachtsatz bleibt die Lücke stehen, statt eine Null zu erfinden', () => {
  const feed = katalogFeed(zweiArtikel, {
    liefergebiet: { land: 'AT', bezirke: ['Perg'] },
    versandkostenNetto: () => null,
  });
  assert.equal(feed.zeilen[0].offers.shippingDetails, undefined);
  assert.ok(feed.mitLuecken.every((l) => l.fehlend.includes('Versandkosten')));
});

/* ------------------------------------------------------------------ *
 * Eine Verfügbarkeit für alle Ausgänge
 * ------------------------------------------------------------------ */

test('Feed und Artikelseite sagen dasselbe über die Verfügbarkeit', () => {
  // Bis zum 28.08. sagte die Seite „PreOrder" und der Feed „InStock" —
  // beide aus derselben Datenlage. Der Widerspruch fiel niemandem auf, weil
  // niemand beide Ausgänge nebeneinander gelesen hat. Dieser Test tut es.
  const a = produktAuszeichnung(echterArtikel, lage);
  assert.equal(a.daten.offers.availability, VERFUEGBARKEIT);

  const seite = fileURLToPath(new URL('../ausgabe/site/artikel/POS-12566.html', import.meta.url));
  if (!existsSync(seite)) return; // ohne Bau keine Aussage — und keine falsche
  const html = readFileSync(seite, 'utf8');
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
  assert.equal(ld.offers.availability, VERFUEGBARKEIT,
    'die gebaute Artikelseite weicht vom Feed ab');
});

test('die Verfügbarkeit behauptet nichts Kaufbares, solange die Kasse nichts auslöst', () => {
  // Der Shop nimmt keine Bestellung an: Es ist kein Zahlungsanbieter
  // gewählt, und die Kasse sagt das. „InStock" wäre in einem Kanal, den ein
  // Assistent liest, die gefährlichere Angabe von beiden.
  assert.equal(VERFUEGBARKEIT, 'https://schema.org/PreOrder');
});

/* ------------------------------------------------------------------ *
 * Bezugsgröße und Mindestmenge — der Preis gilt wofür?
 * ------------------------------------------------------------------ */

test('der Preis nennt seine Bezugsgröße als UN/CEFACT-Code', () => {
  const e = produktAuszeichnung(
    { sku: 'X', bezeichnung: 'XPS glatt SF 30 mm 0,75 m2', gruppe: 'Dämmung',
      einheit: 'M2', vkNetto: 5.23, ekQuelle: 'rechnung', preisStand: '2026-08-17' },
    { liefergebiet: { land: 'AT', bezirke: [{ name: 'Perg' }] } },
  );
  assert.equal(e.veroeffentlichbar, true, JSON.stringify(e.gruende));
  const p = e.daten.offers.priceSpecification;
  assert.equal(p['@type'], 'UnitPriceSpecification');
  assert.deepEqual(p.referenceQuantity, { '@type': 'QuantitativeValue', value: 1, unitCode: 'MTK' });
  // Und die kleinste bestellbare Menge: eine Platte, nicht ein Quadratmeter.
  assert.deepEqual(e.daten.offers.eligibleQuantity,
    { '@type': 'QuantitativeValue', minValue: 0.75, unitCode: 'MTK' });
});

test('Stückgut bekommt eine Bezugsgröße, aber keine Mindestmenge', () => {
  const e = produktAuszeichnung(
    { sku: 'Y', bezeichnung: 'PVC Kanalrohr NW 100 1 m', gruppe: 'Kanal',
      einheit: 'STK', vkNetto: 10.81, ekQuelle: 'rechnung', preisStand: '2026-08-17' },
    { liefergebiet: { land: 'AT', bezirke: [{ name: 'Perg' }] } },
  );
  assert.equal(e.daten.offers.priceSpecification.referenceQuantity.unitCode, 'C62');
  assert.equal(e.daten.offers.eligibleQuantity, undefined,
    'wer je Stück verkauft, hat keine Gebindebindung');
});

test('eine nicht abgebildete Einheit bekommt keinen geratenen Code', () => {
  const e = produktAuszeichnung(
    { sku: 'Z', bezeichnung: 'Sonderware', gruppe: 'Zubehör',
      einheit: 'XYZ', vkNetto: 1, ekQuelle: 'rechnung', preisStand: '2026-08-17' },
    { liefergebiet: { land: 'AT', bezirke: [{ name: 'Perg' }] } },
  );
  assert.equal(e.daten.offers.priceSpecification.referenceQuantity, undefined);
  assert.equal(e.daten.offers.eligibleQuantity, undefined);
});

test('Seite und Feed zeichnen dasselbe Angebot aus, nicht zwei', () => {
  // Bis zum 29.08. baute die Artikelseite ihr JSON-LD von Hand. Sie nannte
  // weder Bezugsgröße noch Mindestmenge, der Feed beides — dieselbe
  // Fehlerklasse wie PreOrder gegen InStock im August.
  const seite = pfad('../ausgabe/site/artikel/POS-12569.html');
  if (!existsSync(seite)) return; // ohne Bau keine Aussage — und keine falsche
  const html = readFileSync(seite, 'utf8');
  const treffer = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(treffer, 'kein JSON-LD auf der Artikelseite');
  const daten = JSON.parse(treffer[1]);
  assert.equal(daten.offers.priceSpecification.referenceQuantity.unitCode, 'MTK');
  assert.equal(daten.offers.eligibleQuantity.minValue, 0.75);
  // Was die Seite darüber hinaus trägt, ersetzt nichts.
  assert.ok(daten.offers.areaServed);
  assert.equal(daten.offers.seller['@type'], 'Organization');
  assert.equal(daten.offers.priceValidUntil, undefined,
    'ein erfundenes Gültigkeitsdatum wäre eine Zusage');
});


test('ein vom Feed zurückgehaltener Artikel behält seine Auszeichnung auf der Seite', () => {
  // Gate 22 hält Beipackartikel am Listendeckel aus dem Feed. Das ist eine
  // Feedentscheidung. Als die Artikelseite ihr JSON-LD aus
  // produktAuszeichnung() bezog, verlor sie es bei genau diesen drei
  // Artikeln — gefunden von `npm run pruefe-preise` beim ersten Lauf.
  const beipack = {
    sku: 'B', bezeichnung: 'Beipack 1 Stück', gruppe: 'Zubehör', einheit: 'STK',
    vkNetto: 2.87, uvpNetto: 2.87, amListendeckel: true,
    ekQuelle: 'rechnung', preisStand: '2026-08-17',
  };
  const lage = { liefergebiet: { land: 'AT', bezirke: [{ name: 'Perg' }] } };

  const fuerDenFeed = produktAuszeichnung(beipack, lage);
  assert.equal(fuerDenFeed.veroeffentlichbar, false, 'der Feed muss ihn zurückhalten');
  assert.equal(fuerDenFeed.daten, null);

  const fuerDieSeite = angebotsAuszeichnung(beipack, lage);
  assert.equal(fuerDieSeite.daten['@type'], 'Product');
  assert.equal(fuerDieSeite.daten.offers.price, '2.87');
});

test('jede gebaute Artikelseite trägt ein Produkt-JSON-LD', () => {
  const ordner = pfad('../ausgabe/site/artikel');
  if (!existsSync(ordner)) return; // ohne Bau keine Aussage — und keine falsche
  const seiten = readdirSync(ordner).filter((d) => d.endsWith('.html'));
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Artikelseiten gefunden`);
  const ohne = seiten.filter((d) => {
    const html = readFileSync(join(ordner, d), 'utf8');
    const treffer = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!treffer) return true;
    try { return JSON.parse(treffer[1])['@type'] !== 'Product'; } catch { return true; }
  });
  assert.deepEqual(ohne, [], 'Artikelseiten ohne Produktauszeichnung');
});


/* ------------------------------------------------------------------ *
 * Das Liefergebiet als Ort, nicht als Satz
 * ------------------------------------------------------------------ */

test('jeder Bezirk wird ein eigener Ort', () => {
  // Bis zum 30.08. stand das Gebiet als Zeichenkette da: „Bezirk Perg,
  // Urfahr-Umgebung, Freistadt, Linz, Linz-Land". Für einen maschinellen
  // Leser ist das ein Satz und keine Liste — und es liest sich, als sei nur
  // das erste ein Bezirk.
  const orte = liefergebietOrte({ land: 'AT', bezirke: ['Perg', 'Freistadt'] });
  assert.equal(orte.length, 2);
  assert.deepEqual(orte.map((o) => o['@type']), ['AdministrativeArea', 'AdministrativeArea']);
  assert.deepEqual(orte.map((o) => o.name), ['Perg', 'Freistadt']);
  assert.equal(orte[0].address.addressRegion, 'Perg');
  assert.equal(orte[0].address.addressCountry, 'AT');
});

test('ohne beziffertes Gebiet entsteht kein Ort', () => {
  // Lieber keine Angabe als eine leere Liste, die „wir liefern nirgends"
  // heißt — die Lücke meldet `liefergebietAngabe` an anderer Stelle.
  assert.equal(liefergebietOrte({ land: 'AT', bezirke: [] }), null);
  assert.equal(liefergebietOrte(undefined), null);
});

/* ------------------------------------------------------------------ *
 * Was nicht bekannt ist, bekommt keinen Schlüssel
 * ------------------------------------------------------------------ */

test('Ohne bekannte Preisgültigkeit fehlt der Schlüssel, statt null zu tragen', () => {
  // **Befund vom 31.08.** `angebotsAuszeichnung` schrieb `priceValidUntil:
  // lage.preisGueltigBis ?? null`. `bin/website.mjs` wusste, dass das falsch
  // ist, und setzte den Wert beim Bauen der Artikelseite zurück — mit genau
  // dieser Begründung im Kommentar. Der Feed-Erzeuger wusste es nicht.
  //
  // Ein fehlender Schlüssel behauptet nichts; ein `null` behauptet eine
  // ungültige Antwort.
  const { daten } = angebotsAuszeichnung(echterArtikel, {});
  assert.ok(!('priceValidUntil' in daten.offers),
    `priceValidUntil steht als ${JSON.stringify(daten.offers.priceValidUntil)} da`);
});

test('Mit bekannter Preisgültigkeit steht sie da', () => {
  // Gegenrichtung: Die Auslassung darf nicht der einzige Zustand werden.
  const { daten } = angebotsAuszeichnung(echterArtikel, { preisGueltigBis: '2026-12-31' });
  assert.equal(daten.offers.priceValidUntil, '2026-12-31');
});

test('Der Feed trägt an keiner Stelle einen ausdrücklichen Nullwert', () => {
  // Die Regel des Moduls, hier als Ganzes geprüft: `gtin13`,
  // `versandkostenNetto` und die Preisgültigkeit werden weggelassen, wenn sie
  // fehlen. Ein einzelner `?? null` reicht, um diese Haltung zu unterlaufen —
  // und in strukturierten Daten ist ein Nullwert kein Schweigen, sondern eine
  // Angabe, die kein Prüfwerkzeug annimmt.
  const feed = katalogFeed([echterArtikel, { ...echterArtikel, sku: 'B-2', gtin: null }], {});
  const roh = JSON.stringify(feed);
  const nullFelder = roh.match(/"[A-Za-z0-9@]+":null/g) ?? [];
  assert.deepEqual([...new Set(nullFelder)], [], `Nullwerte im Feed: ${nullFelder.join(', ')}`);
  assert.ok(roh.length > 200, 'der Feed ist zu klein, um etwas zu zeigen');
});

test('Eine ungültige GTIN kommt nicht in den Feed, sondern in die Mängelliste', () => {
  // Die zweite Sperre. `artikelliste.js` weist eine falsche Kennung schon beim
  // Einlesen zurück; hier steht sie noch einmal, weil der Katalog auch aus
  // älteren Quellen stammen kann. Eine falsche Kennung im Feed ist schlimmer
  // als gar keine — sie kann eine andere Ware bezeichnen.
  const falsch = produktAuszeichnung({ ...echterArtikel, gtin: '4007817327006' }, lage);
  assert.equal(falsch.daten.gtin13, undefined, 'die falsche Kennung steht im Feed');
  assert.ok(falsch.fehlend.some((f) => /Prüfziffer geht nicht auf/.test(f)), falsch.fehlend.join(' | '));
  assert.ok(falsch.fehlend.some((f) => /4007817327006/.test(f)), 'der Mangel nennt die Kennung nicht');

  const feed = katalogFeed([{ ...echterArtikel, gtin: '4007817327006' }], FEEDLAGE);
  assert.equal(feed.einreichbar, false);
});

test('Keine Probe dieser Datei trägt eine erfundene Artikelkennung', () => {
  // **Zwei Platzhalter dieser Datei waren am 31.08. ungültig** —
  // `9008811000001` und `9001234567890`, beide erfunden statt gerechnet. Sie
  // sahen aus wie EANs, und Google hätte den Feed damit abgelehnt.
  //
  // Diese Probe liest den eigenen Quelltext: Jede dreizehnstellige Zahl darin
  // muss eine gültige Kennung sein. Eine Zusicherung, die auf einer erfundenen
  // Kennung ruht, prüft den Feed nicht — sie prüft eine Zeichenkette.
  const quelle = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const kandidaten = [...new Set(quelle.match(/'\d{13}'/g) ?? [])].map((t) => t.slice(1, -1));
  assert.ok(kandidaten.length >= 2, `nur ${kandidaten.length} Kennungen im Quelltext — prüft zu wenig`);
  for (const k of kandidaten) {
    if (k === '4007817327006') continue; // ausdrücklich als ungültig geprüft
    assert.ok(istGtin(k), `${k} sieht aus wie eine EAN, ist aber keine`);
  }
});

/* ------------------------------------------------------------------ *
 * Die Adresse der Artikelseite
 * ------------------------------------------------------------------ */

/**
 * **Gefunden am 01.09.** Die Auszeichnung trug keine Produktadresse — weder
 * im JSON-LD der Seite noch im Feed —, und die Lückenliste kannte das Feld
 * nicht. Der Feed hätte an dem Tag, an dem die Kennungen eintreffen, als
 * vollständig gegolten und wäre trotzdem abgelehnt worden.
 */
test('Ohne Produktadresse ist der Feed nicht einreichbar', () => {
  const ohne = { ...FEEDLAGE, seitenadresse: null };
  const f = katalogFeed([{ ...artikelOhneGtin, gtin: '9008811000005' }], ohne);
  assert.equal(f.anzahl, 1, 'zurückgehalten wird er nicht — die Seite gibt es ja');
  assert.equal(f.einreichbar, false);
  assert.match(f.mitLuecken[0].fehlend.join(' '), /Adresse der Artikelseite/);
});

test('Nur eine absolute Adresse zählt', () => {
  const eintrag = (adresse) => angebotsAuszeichnung(
    { ...artikelOhneGtin, gtin: '9008811000005' },
    { ...FEEDLAGE, seitenadresse: adresse },
  );

  // Absolut: übernommen, und zwar an beiden Stellen.
  const gut = eintrag('https://beispiel.test/artikel/A-1.html');
  assert.equal(gut.daten.offers.url, 'https://beispiel.test/artikel/A-1.html');
  assert.equal(gut.daten['@id'], 'https://beispiel.test/artikel/A-1.html');
  assert.deepEqual(gut.fehlend, []);

  // Relativ, leer, unbrauchbar: kein Schlüssel, sondern eine Meldung. Eine
  // relative Adresse ist in einem Feed wertlos — dort steht kein Dokument,
  // auf das sie sich beziehen könnte.
  for (const schlecht of ['/artikel/A-1.html', 'artikel/A-1.html', '', '   ', null, undefined]) {
    const e = eintrag(schlecht);
    assert.equal(e.daten.offers.url, undefined, `„${schlecht}" kam durch`);
    assert.equal(e.daten['@id'], undefined, `„${schlecht}" kam als @id durch`);
    assert.match(e.fehlend.join(' '), /Adresse der Artikelseite/, `„${schlecht}" wurde nicht gemeldet`);
  }
});

/**
 * **Gefunden am 01.09.:** Jede Artikelseite trug ihre Marke im JSON-LD,
 * **jede der 43 Feedzeilen trug keine.** `angebotsAuszeichnung` las
 * `artikel.hersteller` — ein Feld, das in 0 von 46 Katalogartikeln gesetzt
 * ist. Die Zuordnung steckte in `bin/website.mjs`, also im Bauwerkzeug, das
 * den Feed nicht baut. Dieselbe Bauart wie die fehlende Produktadresse.
 */
test('Die Marke kommt aus dem Feld oder aus der Bezeichnung — und sonst als Meldung', async () => {
  const { herstellerNameAus } = await import('../src/maschinenlesbar.js');
  const { HERSTELLER } = await import('../src/hersteller.js');
  assert.ok(Object.keys(HERSTELLER).length > 0, 'leere Markentabelle — die Prüfungen darunter prüfen nichts');

  // Aus der Bezeichnung, auch wenn die Marke nicht vorn steht.
  assert.equal(herstellerNameAus('Mantelstein MSTS EZ 16-18 SIKM'), HERSTELLER.SIKM.name);
  assert.equal(herstellerNameAus('Capatect Putzgrund weiß 25 kg'), HERSTELLER.Capatect.name);
  // Und nicht geraten, wo nichts steht.
  assert.equal(herstellerNameAus('PVC Kanalbogen NW 100 45 grad'), null);

  // **Der Fall, um den es geht:** kein `hersteller`-Feld — so steht jeder der
  // 46 Katalogartikel da —, aber die Marke in der Bezeichnung. Vorher blieb
  // die Feedzeile hier ohne Marke, während die Artikelseite eine trug.
  const ausName = angebotsAuszeichnung(
    { ...artikelOhneGtin, bezeichnung: 'Mantelstein MSTS EZ 16-18 SIKM', hersteller: undefined, gtin: '9008811000005' },
    FEEDLAGE,
  );
  assert.equal(ausName.daten.brand?.name, HERSTELLER.SIKM.name,
    'die Marke aus der Bezeichnung kommt nicht in die Auszeichnung');
  assert.deepEqual(ausName.fehlend, [], 'mit Marke aus der Bezeichnung fehlt nichts mehr');

  // Das ausdrückliche Feld schlägt die Ableitung.
  const mitFeld = angebotsAuszeichnung(
    { ...artikelOhneGtin, bezeichnung: 'Capatect Putzgrund', hersteller: 'Eigene Angabe' },
    FEEDLAGE,
  );
  assert.equal(mitFeld.daten.brand.name, 'Eigene Angabe');

  // Ohne beides: keine erfundene Marke, sondern eine Meldung.
  const ohne = angebotsAuszeichnung(
    { ...artikelOhneGtin, bezeichnung: 'PVC Kanalbogen NW 100', hersteller: null, gtin: '9008811000005' },
    FEEDLAGE,
  );
  assert.equal(ohne.daten.brand, undefined);
  assert.match(ohne.fehlend.join(' '), /Marke/);
});

test('Beschreibung und Bild sind Pflichtangaben — die eine gebaut, die andere gemeldet', async () => {
  const { feedbeschreibung } = await import('../src/maschinenlesbar.js');

  // Die Beschreibung setzt sich aus Katalogfeldern zusammen und erfindet
  // nichts: keine Verbrauchsangabe, keine Schichtdicke.
  const t = feedbeschreibung({ bezeichnung: 'XPS glatt SF 50 mm', gruppe: 'Dämmung', einheit: 'M2' });
  assert.match(t, /XPS glatt SF 50 mm/);
  assert.match(t, /Warengruppe Dämmung/);
  assert.match(t, /Verkaufseinheit m²/);
  assert.match(t, /netto für Unternehmer/);
  // Ohne Bezeichnung gibt es keine Beschreibung — kein Satz aus lauter Kommas.
  assert.equal(feedbeschreibung({ gruppe: 'Dämmung' }), null);

  // Das Bild: vorhanden, wenn eine absolute Adresse gegeben ist …
  const mit = angebotsAuszeichnung({ ...artikelOhneGtin, gtin: '9008811000005' }, FEEDLAGE);
  assert.equal(mit.daten.image, 'https://beispiel.test/bild/A-1.jpg');
  assert.deepEqual(mit.fehlend, []);

  // … und sonst gemeldet statt gefüllt. Ein Platzhalter wäre ein
  // Ablehnungsgrund mehr: Das Bild muss die Ware zeigen.
  const ohne = angebotsAuszeichnung(
    { ...artikelOhneGtin, gtin: '9008811000005' },
    { ...FEEDLAGE, bildadresse: null },
  );
  assert.equal(ohne.daten.image, undefined);
  assert.match(ohne.fehlend.join(' '), /Produktbild/);
});
