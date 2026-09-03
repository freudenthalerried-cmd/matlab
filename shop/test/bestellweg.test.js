/**
 * Der Punkt, der in der Bereitschaftsliste fehlte.
 *
 * **Der Anlass, 3. September 2026.** `startklar()` führte neun Punkte, und
 * alle neun waren Zulieferungen des Auftraggebers. Wären sie geschlossen
 * gewesen, hätte das Werkzeug `startklar: true` gemeldet — und drei
 * Oberflächen lesen dieses Ja als „Bestellen ist möglich", `llms.txt` schreibt
 * den Satz sogar wörtlich hin.
 *
 * > **Keiner der neun war der Bestellweg selbst.**
 *
 * Die Probe, die es hätte auffallen lassen können, trug dieselbe Annahme:
 * `test/website` beantwortete alles Beantwortbare und verlangte dann den
 * Umschlag auf „Bestellen ist möglich".
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ABSENDEWEGE, absendewege, bestellwegBefund } from '../src/bestellweg.js';
import { startklar, fehltSatz } from '../src/startklar.js';

const oberflaeche = readFileSync(fileURLToPath(new URL('../shop-ui.js', import.meta.url)), 'utf8');

test('der Bestand schickt nichts ab — gemessen an der ausgelieferten Oberfläche', () => {
  const e = bestellwegBefund(oberflaeche);
  assert.equal(e.moeglich, false, `gefunden: ${e.gefunden.join(', ')}`);
  assert.deepEqual(e.gefunden, []);
  assert.match(e.befund, /Anfrage und ausdrücklich keine Bestellung/);
});

test('jeder Weg der Liste wird auch gefunden', () => {
  const proben = {
    fetch: 'fetch("/bestellung", { method: "POST" })',
    XMLHttpRequest: 'var x = new XMLHttpRequest();',
    sendBeacon: 'navigator.sendBeacon("/b", daten);',
    Formular: '<form action="/bestellung" method="post">',
  };
  // Erst gegen die Liste halten: Ein neuer Eintrag ohne Probe fällt hier auf,
  // statt still ungeprüft mitzufahren.
  assert.deepEqual(ABSENDEWEGE.map((w) => w.name).sort(), Object.keys(proben).sort());
  assert.equal(ABSENDEWEGE.length, 4);
  for (const [name, text] of Object.entries(proben)) {
    assert.deepEqual(absendewege(text), [name], `„${text}" sollte genau ${name} treffen`);
  }
});

test('jeder Weg trägt seine Begründung', () => {
  assert.ok(ABSENDEWEGE.length > 0, 'eine leere Liste bestünde jede Prüfung');
  for (const w of ABSENDEWEGE) {
    assert.ok(w.warum.length >= 60, `${w.name}: Begründung zu kurz (${w.warum.length} Zeichen)`);
  }
});

/**
 * Die naheliegende „Verbesserung", die den Punkt falsch grün machte.
 *
 * Die Kasse bietet einen Mailverweis an. Er sieht nach einem Absendeweg aus
 * und ist keiner: Er öffnet das Programm des Kunden, und was darin steht,
 * heißt in jedem Text dieses Hauses Anfrage und ausdrücklich keine Bestellung.
 */
test('ein Mailverweis ist kein Bestellweg', () => {
  const mit = `${oberflaeche}\nvar a = 'mailto:office@example.at?subject=Anfrage';`;
  assert.equal(bestellwegBefund(mit).moeglich, false);
  // Und die Gegenprobe zur Gegenprobe: Ein echter Weg kippt denselben Text.
  assert.equal(bestellwegBefund(`${mit}\nfetch('/bestellung');`).moeglich, true);
});

test('ohne Quelltext ist der Punkt ungeprüft und nicht erfüllt', () => {
  const e = bestellwegBefund(null);
  assert.equal(e.moeglich, null);
  assert.match(e.befund, /ungeprüft, nicht erfüllt/);
});

const vollstaendig = {
  betreiber: { antwortzeitWerktage: 1 },
  impressumsfelder: [],
  katalog: { artikel: [{ sku: 'A', vkNetto: 10, lieferantId: 'l1' }] },
  preisdateiVorhanden: true,
  zahlungsanbieter: 'EPS',
  rechtstexteFundstelle: 'Kanzlei',
  domainZeigtAufShop: true,
  repositoryPrivat: true,
  lieferanten: [{ id: 'l1', name: 'Eins', lieferzeitWerktage: 5 }],
};

test('alles beantwortet und trotzdem nicht startklar, solange nichts abschickt', () => {
  const ohne = startklar({ ...vollstaendig, oberflaechenQuelltext: oberflaeche });
  assert.equal(ohne.startklar, false);
  assert.deepEqual(ohne.punkte.filter((p) => p.zustand !== 'erfuellt').map((p) => p.id),
    ['bestellweg']);

  const mit = startklar({
    ...vollstaendig,
    oberflaechenQuelltext: `${oberflaeche}\nfetch('/bestellung', { method: 'POST' });`,
  });
  assert.equal(mit.startklar, true, JSON.stringify(mit.punkte.filter((p) => p.zustand !== 'erfuellt')));
});

test('der Bestellweg steht als erster Punkt und wird dem Kunden genannt', () => {
  const b = startklar({ ...vollstaendig, oberflaechenQuelltext: oberflaeche });
  assert.equal(b.punkte[0].id, 'bestellweg', 'der härteste Punkt gehört nach vorn');
  assert.equal(b.punkte[0].wer, 'Werkzeug');
  assert.deepEqual(b.kassenhinweise.map((h) => h.wort), ['ein Weg, die Bestellung abzuschicken']);
});

/**
 * Denselben Satz gab es dreimal: im Fuß, auf der Startseite und in der Kasse.
 * Zwei beugten ihn nach der Anzahl, die dritte schrieb immer „Es fehlt" — und
 * hängte fünf Punkte daran.
 */
test('der Fehlt-Satz wird nach der Anzahl gebeugt', () => {
  assert.equal(fehltSatz([]), '');
  assert.equal(fehltSatz([{ wort: 'ein Zahlungsanbieter' }]), 'es fehlt ein Zahlungsanbieter');
  assert.equal(fehltSatz([{ wort: 'A' }, { wort: 'B' }]), 'es fehlen A, B');
  // Ein Hinweis ohne Wort darf den Satz nicht zu „es fehlen A, " machen.
  assert.equal(fehltSatz([{ wort: 'A' }, {}]), 'es fehlt A');
});
