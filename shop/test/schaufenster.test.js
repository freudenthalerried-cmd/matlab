import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { zahlAus, kennzahlen, pruefeSchaufenster, veroeffentlichungsbefund } from '../src/schaufenster.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));

test('zahlAus liest deutsche Schreibweise', () => {
  assert.equal(zahlAus('46'), 46);
  assert.equal(zahlAus('1.059'), 1059);
  assert.equal(zahlAus('8,22'), 8.22);
  assert.equal(zahlAus('132'), 132);
});

/**
 * Drei Ausgänge, und der mittlere ist der, um den es geht: Ein Muster, das
 * nichts mehr findet, ist ein **Fehler** und keine übersprungene Zeile. Wer
 * den Satz umschreibt, in dem eine Zahl steht, nimmt dem Prüfer den Anker —
 * und eine Wache ohne Anker ist eine Vermutung.
 */
test('Der Abgleich unterscheidet veraltet, ohne Anker und ungemessen', () => {
  const messwerte = { artikel: 46, gates: 24 };
  const nur = (name) => kennzahlen(messwerte).filter((k) => k.name === name);
  assert.equal(nur('Artikel im Katalog').length, 1, 'die Kennzahl fehlt — der Test prüft nichts');

  // Passt.
  let e = pruefeSchaufenster('… **46 echte Artikel** aus 15 Belegen …',
    { ...messwerte, artikel: 46 });
  assert.deepEqual(e.meldungen.filter((m) => m.name === 'Artikel im Katalog'), []);

  // Zahl veraltet.
  e = pruefeSchaufenster('… **46 echte Artikel** aus 15 Belegen …', { ...messwerte, artikel: 52 });
  const veraltet = e.meldungen.find((m) => m.name === 'Artikel im Katalog');
  assert.equal(veraltet.art, 'veraltet');
  assert.equal(veraltet.ist, 46);
  assert.equal(veraltet.soll, 52);

  // Satz umgeschrieben — der Anker ist weg.
  e = pruefeSchaufenster('… sechsundvierzig echte Artikel …', messwerte);
  assert.equal(e.meldungen.find((m) => m.name === 'Artikel im Katalog').art, 'anker');

  // Kein Messwert: Der Prüfer sagt das, statt die Zeile stillschweigend
  // durchzuwinken. Ein `undefined === undefined` wäre grün gewesen.
  e = pruefeSchaufenster('… **46 echte Artikel** …', { gates: 24 });
  assert.equal(e.meldungen.find((m) => m.name === 'Artikel im Katalog').art, 'ungemessen');
  assert.equal(e.sauber, false);
});

test('Jede Kennzahl bringt genau eine Fanggruppe mit', () => {
  const liste = kennzahlen({});
  assert.ok(liste.length >= 12, `nur ${liste.length} Kennzahlen — die Schleife prüft zu wenig`);
  for (const k of liste) {
    assert.ok(k.name && k.wie, `Kennzahl ohne Namen oder Herkunft: ${k.muster}`);
    // Eine Fanggruppe, nicht null und nicht zwei: `treffer[1]` wäre sonst
    // undefiniert oder die falsche Zahl.
    const gruppen = new RegExp(`${k.muster.source}|`).exec('').length - 1;
    assert.equal(gruppen, 1, `„${k.name}" hat ${gruppen} Fanggruppen statt einer`);
  }
});

/**
 * Der Abgleich gegen die echte Beschreibung — ohne die Messwerte, die einen
 * Bau oder einen Testlauf brauchen. Was hier geprüft wird, ist, dass **jedes
 * Muster in der Datei noch etwas findet**: Der Anker ist das, was am
 * leisesten verlorengeht.
 */
test('Jedes Muster findet seine Stelle in der echten Beschreibung', () => {
  const text = readFileSync(pfad('../../docs/baustoff-shop/pr-beschreibung.md'), 'utf8');
  const ohneAnker = kennzahlen({}).filter((k) => !k.muster.test(text));
  assert.deepEqual(ohneAnker.map((k) => k.name), [],
    'diese Kennzahlen haben in der Beschreibung keine Fundstelle mehr');
});

/**
 * Die Untergrenze für Zahlen, die sich täglich ändern. Ohne sie wäre der
 * Prüfer nach jeder neuen Probe rot, und ein Dauerroter wird abgeschaltet.
 * Geprüft werden **beide** Richtungen: überholt und nichtssagend.
 */
test('Eine Untergrenze gilt, solange sie stimmt und noch etwas sagt', () => {
  const mitGrenze = kennzahlen({ tests: 1 }).find((k) => k.art === 'mindestens');
  assert.ok(mitGrenze, 'keine Kennzahl mit Untergrenze — der Test prüft nichts');

  const satz = (n) => `| Testbestand | **über ${n} Testfälle**, alle grün |`;
  const meldung = (text, tests) =>
    pruefeSchaufenster(text, { tests }).meldungen.find((m) => m.name === 'Testfälle');

  // Gilt: 1.063 sind mehr als 1.000.
  assert.equal(meldung(satz('1.000'), 1063), undefined);
  // Genau darauf: „über 1.000" bei 1.000 stimmt nicht mehr.
  assert.match(meldung(satz('1.000'), 1000).grund, /gemessen sind nur/);
  // Überholt.
  assert.match(meldung(satz('1.200'), 900).grund, /gemessen sind nur/);
  // Nichtssagend: ab dem Doppelten gehört sie nachgezogen.
  assert.match(meldung(satz('1.000'), 2000).grund, /nichtssagend/);
  // Knapp darunter noch nicht.
  assert.equal(meldung(satz('1.000'), 1999), undefined);
});

/**
 * **Der Fund vom 01.09.:** Der Prüfer rechnete den Median des
 * Listenpreisabstands selbst nach und erhielt **26**, während Startseite und
 * Preistafel **26,7** ausweisen — zwei Rundungswege für dieselbe Aussage. Er
 * bestätigte damit die Zahl, die niemand sieht.
 *
 * Geprüft wird deshalb die Eigenschaft, um die es geht: Was die Beschreibung
 * über den Katalog sagt, muss dasselbe sein, was die **gebaute Seite** sagt.
 * Beide schöpfen dann aus `katalogbefund()`.
 */
test('Beschreibung und Startseite nennen denselben Listenpreisabstand', () => {
  const start = pfad('../ausgabe/site/index.html');
  if (!existsSync(start)) return;

  const beschreibung = readFileSync(pfad('../../docs/baustoff-shop/pr-beschreibung.md'), 'utf8');
  const ausBeschreibung = beschreibung.match(/im Median ([\d,]+) % darunter/);
  assert.ok(ausBeschreibung, 'die Beschreibung nennt keinen Median mehr');

  const seite = readFileSync(start, 'utf8');
  const ausSeite = seite.match(/im Median<\/span><span class="w">([\d,]+) %/);
  assert.ok(ausSeite, 'die Startseite nennt keinen Median mehr');

  assert.equal(zahlAus(ausBeschreibung[1]), zahlAus(ausSeite[1]),
    `Beschreibung sagt ${ausBeschreibung[1]}, die Seite sagt ${ausSeite[1]}`);

  // Und dieselbe Zahl steht in beiden Sätzen über die Artikelzahl.
  const nBeschreibung = beschreibung.match(/(\d+) von (\d+) Artikeln liegen unter dem Listenpreis/);
  const nSeite = seite.match(/liegen\s*(\d+) von (\d+) Artikeln unter dem Listenpreis/);
  assert.ok(nBeschreibung && nSeite, 'die Artikelzahlen stehen nicht mehr in beiden Texten');
  assert.deepEqual(nBeschreibung.slice(1, 3), nSeite.slice(1, 3));
});

/* ------------------------------------------------------------------ *
 * Die Leitzahl — Befund vom 1. September
 *
 * Vierundzwanzig Kennzahlen maßen Seiten, Testfälle, Gebote und GTIN-Lücken.
 * Der nötige Monatsumsatz war keine davon — und stand vier Tage lang mit der
 * Kartenzahl in der Beschreibung, obwohl Gate 21 EPS entschieden hat.
 * ------------------------------------------------------------------ */

test('Der nötige Monatsumsatz und die Bestellungen werden gemessen', () => {
  const namen = kennzahlen({}).map((k) => k.name);
  assert.ok(namen.includes('Nötiger Monatsumsatz'), 'die Leitzahl fehlt in der Messung');
  assert.ok(namen.includes('Bestellungen im Monat'));
});

test('Die Leitzahl wird mit dem Zahlweg aus den Zielgrößen gerechnet, nicht mit einem beliebigen', async () => {
  // Der ganze Befund hängt hieran: 45.356 € ist die Karte, 43.396 € ist EPS.
  const { noetigerUmsatz } = await import('../src/kostenbild.js');
  const ziel = JSON.parse(readFileSync(new URL('../data/zielgroessen.json', import.meta.url), 'utf8'));
  const mitZielweg = noetigerUmsatz(ziel, ziel.zahlweg);
  const mitKarte = noetigerUmsatz(ziel, 'karte-stripe');
  assert.ok(mitZielweg.tragfaehig && mitKarte.tragfaehig);
  assert.notEqual(
    Math.round(mitZielweg.umsatzNetto),
    Math.round(mitKarte.umsatzNetto),
    'unterschieden sich die beiden nicht, wäre der Befund gegenstandslos — dann gehört dieser Test weg',
  );
});

test('Das Muster der Leitzahl trifft die Zeile der Beschreibung', () => {
  const zeile = '| nötiger Monatsumsatz | 67.826 € | **43.396 €** | **37.343 €** |';
  const k = kennzahlen({}).find((x) => x.name === 'Nötiger Monatsumsatz');
  const treffer = zeile.match(k.muster);
  assert.ok(treffer, 'das Muster findet die Zeile nicht');
  assert.equal(zahlAus(treffer[1]), 43396);
});

/**
 * **Zwei Zahlen ohne Anker — 7. September 2026.**
 *
 * Diese Tafel misst, was jemand zu messen angeordnet hat. Beim Nachzählen
 * aller Zahlen der Beschreibung standen zwei **lebende** Angaben da, die kein
 * Muster berührte: die Zahl der Lieferantenbelege und die Zahl der gerechneten
 * Suchkampagnen.
 *
 * > **Ein Prüfer, der nur die angeordneten Zahlen misst, ist so vollständig
 * > wie die Anordnung.**
 */
test('die Zahl der Lieferantenbelege wird gemessen', () => {
  const k = kennzahlen({ belege: 15 }).find((x) => x.name === 'Lieferantenbelege');
  assert.ok(k, 'kein Anker für die Belege');
  assert.equal(zahlAus(k.muster.exec('Katalog | **46 echte Artikel** aus 15 Lieferantenbelegen')[1]), 15);
});

test('die Zahl der gerechneten Kampagnen wird gemessen', () => {
  const k = kennzahlen({ kampagnen: 6 }).find((x) => x.name === 'Gerechnete Kampagnen');
  assert.ok(k, 'kein Anker für die Kampagnen');
  assert.equal(zahlAus(k.muster.exec('| Kampagne | 6 Suchkampagnen gerechnet, **3 im ersten Anlauf** |')[1]), 6);
});

test('beide Anker greifen nur auf ihre eigene Zeile', () => {
  // Ein Muster, das auch die Nachbarzahl fängt, misst irgendetwas.
  const belege = kennzahlen({}).find((x) => x.name === 'Lieferantenbelege');
  assert.equal(belege.muster.exec('aus 15 Rechnungen nicht ableitbar'), null);
  const kampagnen = kennzahlen({}).find((x) => x.name === 'Gerechnete Kampagnen');
  assert.equal(kampagnen.muster.exec('6 Suchkampagnen ohne Tafelzeile'), null);
});

// **Ergänzt am 9. September 2026.** Dreimal wurde die Quelle nachgezogen und
// die Veröffentlichung vergessen — zuletzt gleich zweifach („über 1.000
// Testfälle" bei 2009, „39 Prüfer" bei 40). `pruefe-schaufenster` misst die
// Quelle gegen den Bestand und war jedes Mal grün; zwischen Quelle und GitHub
// lag ein Handgriff ohne Werkzeug.
const abdruck = (t) => createHash('sha256').update(t).digest('hex');

test('stimmt der Fingerabdruck, steht keine Veröffentlichung aus', () => {
  const text = 'Die Beschreibung.';
  const b = veroeffentlichungsbefund(text, { sha256: abdruck(text), stand: '2026-09-09' });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.ist, abdruck(text));
});

test('eine geänderte Quelle meldet die ausstehende Veröffentlichung', () => {
  const b = veroeffentlichungsbefund('neu', { sha256: abdruck('alt'), stand: '2026-09-09' });
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'veroeffentlichung-steht-aus');
  assert.match(b.meldungen[0].text, /2026-09-09/);
});

test('ein Vermerk ohne brauchbaren Fingerabdruck ist nicht messbar und nicht grün', () => {
  for (const kaputt of [{}, { sha256: '' }, { sha256: 'abc' }, { sha256: 'Z'.repeat(64) }]) {
    const b = veroeffentlichungsbefund('irgendwas', kaputt);
    assert.equal(b.sauber, false, JSON.stringify(kaputt));
    assert.equal(b.meldungen[0].regel, 'vermerk-ohne-fingerabdruck');
  }
});

test('der Vermerk im Verzeichnis nennt seine eigene Grenze', () => {
  // Er belegt den Handgriff, nicht sein Ergebnis. Ein Prüfer, der behauptete,
  // GitHub zeige diesen Text, wäre eine Behauptung mit Ziffern.
  const v = JSON.parse(readFileSync(
    new URL('../../docs/baustoff-shop/pr-veroeffentlicht.json', import.meta.url), 'utf8'));
  assert.match(v._grenze, /belegt NICHT/);
  assert.match(v.sha256, /^[0-9a-f]{64}$/);
});

/**
 * **Berichtigt am 9. September, abends.** Die Grenze stand bis dahin zu weit:
 * Sie behauptete, eine Prüfung der Veröffentlichung sei aus dieser Umgebung
 * unmöglich. Der Netzausgang ist gesperrt, das GitHub-Werkzeug nicht — die
 * Beschreibung lässt sich zurücklesen. Gedeckt hatte die falsche Grenze einen
 * echten Fall: Die veröffentlichte Fassung trug einen Punkt, den die Quelle
 * nie hatte, und der Prüfer blieb grün, weil er die Werkzeugausgabe gegen
 * eine Zahl in dieser Datei hält und nicht gegen GitHub.
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.**
 */
test('der Vermerk hält fest, wann zuletzt zurückgelesen wurde', () => {
  const v = JSON.parse(readFileSync(
    new URL('../../docs/baustoff-shop/pr-veroeffentlicht.json', import.meta.url), 'utf8'));
  assert.match(v.zurueckgelesen, /^\d{4}-\d{2}-\d{2}$/,
    'ohne Datum wäre es eine Zusage statt eines Vermerks');
  // Und die Grenze sagt selbst, dass das Zurücklesen geht — sonst stünde die
  // widerlegte Behauptung wieder da.
  assert.match(v._grenze, /zurücklesen/);
  assert.doesNotMatch(v._grenze, /erlaubt keine Prüfung der Veröffentlichung selbst/);
});
