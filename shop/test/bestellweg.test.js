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

import { ABSENDEWEGE, GEWAEHLTER_WEG, VERWORFENE_WEGE, VORAUSSETZUNGEN, absendewege, bestellwegBefund } from '../src/bestellweg.js';
import { startklar, fehltSatz } from '../src/startklar.js';
import { BANKFELDER } from '../src/bankverbindung.js';

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
  // Die Bankverbindung gehört seit dem 4. September zur vollständigen Lage:
  // Ohne Konto ist der Shop nicht startklar, und diese Probe will zeigen,
  // dass **nur** der Bestellweg offen bleibt.
  betreiber: {
    ...Object.fromEntries(BANKFELDER.map((f) => [f.feld, f.beispiel])),
    antwortzeitWerktage: 1,
  },
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
  // **Berichtigt am 4. September, abends.** Hier stand „Werkzeug", und das
  // war richtig, solange der Weg nicht gebaut war. Er ist gebaut und einmal
  // von Ende zu Ende gefahren; was ihn anhält, sind zwei Angaben des
  // Auftraggebers — die E-Mail-Adresse und der Rechtstextewortlaut.
  assert.equal(b.punkte[0].wer, 'Auftraggeber');
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

/* ------------------------------------------------------------------ *
 * Gate 26 — die Entscheidung, ergänzt am 4. September
 * ------------------------------------------------------------------ */

test('der gewählte Weg nennt sich und seinen Grund', () => {
  assert.ok(GEWAEHLTER_WEG.id, 'ohne Kennung lässt sich nichts darauf beziehen');
  assert.ok(GEWAEHLTER_WEG.warum.length > 80, 'eine Entscheidung ohne Begründung ist eine Ansage');
});

test('jeder verworfene Weg trägt seinen Grund', () => {
  assert.ok(VERWORFENE_WEGE.length >= 3, `nur ${VERWORFENE_WEGE.length} Alternativen erwogen`);
  for (const w of VERWORFENE_WEGE) {
    assert.ok(w.warumNicht.length > 80, `${w.id}: zu kurz begründet`);
  }
});

test('mailto steht unter den verworfenen Wegen und in keiner Absendeliste', () => {
  // Der Punkt ginge sonst grün, ohne dass je eine Bestellung ankäme.
  assert.ok(VERWORFENE_WEGE.some((w) => w.id === 'mailto'));
  assert.ok(!ABSENDEWEGE.some((w) => /mailto/i.test(w.name)));
});

test('die Voraussetzungen nennen Feld und Grund', () => {
  assert.ok(VORAUSSETZUNGEN.length >= 2, 'weniger als zwei Voraussetzungen wären verdächtig wenig');
  for (const v of VORAUSSETZUNGEN) {
    assert.match(v.feld, /^[a-zA-Z]+\.?[a-zA-Z]*$/, `${v.id}: kein benanntes Feld`);
    assert.ok(v.warum.length > 80, `${v.id}: zu kurz begründet`);
  }
  // Die Datenschutzzusage ist die eine, die mit demselben Bau fallen muss.
  assert.ok(VORAUSSETZUNGEN.some((v) => v.id === 'datenschutzwortlaut'));
});

/* ------------------------------------------------------------------ *
 * Der Befund sagt, warum — ergänzt am 4. September, abends
 * ------------------------------------------------------------------ */

test('ohne Absendeweg sagt der Punkt, ob nichts gebaut oder nur nichts geschaltet ist', () => {
  // **Der Befund vom Abend:** Der Satz lautete „die Oberfläche schickt nichts
  // ab; die Kasse rechnet und erzeugt einen Anfragetext zum Kopieren" — der
  // Satz eines Shops, für den nichts gebaut ist. Gebaut ist alles; es fehlen
  // zwei Einträge in der Betreiberdatei.
  const ohneDaten = startklar({ ...vollstaendig, oberflaechenQuelltext: oberflaeche });
  const punkt = ohneDaten.punkte.find((p) => p.id === 'bestellweg');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /gebaut und ausgeschaltet/);
  assert.match(punkt.befund, /betreiber\.email/);
  assert.match(punkt.befund, /rechtstexteFundstelle/);

  // Und mit beiden Angaben, aber ohne Weg im Quelltext, bleibt der alte Satz:
  // Dann ist es wirklich der Bau, der fehlt.
  const mitDaten = startklar({
    ...vollstaendig,
    betreiber: { ...vollstaendig.betreiber, email: 'a@b.at', rechtstexteFundstelle: 'Kanzlei' },
    oberflaechenQuelltext: oberflaeche,
  });
  assert.match(mitDaten.punkte.find((p) => p.id === 'bestellweg').befund, /schickt nichts ab/);
});
