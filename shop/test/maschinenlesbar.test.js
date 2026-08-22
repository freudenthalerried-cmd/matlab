import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  darfVeroeffentlichtWerden,
  produktAuszeichnung,
  katalogFeed,
  liefergebietAngabe,
  robotsTxt,
  SUCH_CRAWLER,
  TRAININGS_CRAWLER,
} from '../src/maschinenlesbar.js';
import { ladeKatalog } from '../src/warenkorb.js';

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
  const mit = produktAuszeichnung({ ...echterArtikel, gtin: '9001234567890' }, lage);
  assert.equal(mit.daten.gtin13, '9001234567890');
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
