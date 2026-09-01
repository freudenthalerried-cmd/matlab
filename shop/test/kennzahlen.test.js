import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kennzahlen, kennzahlbefund, haeltSchwelle, ABSCHNITTE, RICHTUNGEN } from '../src/kennzahlen.js';

const ziel = JSON.parse(readFileSync(new URL('../data/zielgroessen.json', import.meta.url), 'utf8'));
const liste = () => kennzahlen({ ziel });

test('Jede Kennzahl nennt Schwelle, Herkunft und Entscheidung', () => {
  assert.ok(liste().length >= 8, `nur ${liste().length} Kennzahlen — die Schleife prüfte zu wenig`);
  for (const k of liste()) {
    assert.equal(typeof k.schwelle, 'number', k.id);
    assert.ok(Number.isFinite(k.schwelle), k.id);
    assert.ok(k.herkunft && k.herkunft.length > 20, `${k.id}: die Herkunft der Schwelle fehlt`);
    assert.ok(k.entscheidung && k.entscheidung.length > 20, `${k.id}: die Entscheidung fehlt`);
    assert.ok(Object.keys(RICHTUNGEN).includes(k.richtung), `${k.id}: ${k.richtung}`);
    assert.ok(ABSCHNITTE.some((a) => a.id === k.abschnitt), `${k.id}: Abschnitt ${k.abschnitt}`);
  }
});

test('Was nicht gemessen ist, ist null — nie null Euro', () => {
  // Der ganze Einwand gegen ein leeres Dashboard hängt hieran: Eine Null ist
  // ein Messergebnis, ein Strich ist keines.
  assert.ok(liste().filter((k) => k.id !== 'freigaben-offen').length >= 8, 'zu wenige Kennzahlen');
  for (const k of liste()) {
    if (k.id === 'freigaben-offen') continue;
    assert.equal(k.ist, null, k.id);
    assert.equal(k.gemessen, false, k.id);
    assert.equal(k.haelt, null, `${k.id} behauptet ein Urteil ohne Messung`);
  }
});

test('Ein gemessener Wert bekommt sein Urteil', () => {
  const l = kennzahlen({ ziel, gemessen: { klicks: 120, monatsumsatz: 50000, werbeanteil: 0.3 } });
  const von = (id) => l.find((k) => k.id === id);
  assert.equal(von('monatsumsatz').haelt, true);
  assert.equal(von('werbeanteil').haelt, false, '30 % über einer Decke von 23 % müsste reißen');
  assert.equal(von('klicks').haelt, null, 'eine Zielmarke kennt kein Halten');
});

test('Die Richtungen kehren die Prüfung wirklich um', () => {
  assert.equal(haeltSchwelle(5, 10, 'mindestens'), false);
  assert.equal(haeltSchwelle(5, 10, 'hoechstens'), true);
  assert.equal(haeltSchwelle(10, 10, 'mindestens'), true);
  assert.equal(haeltSchwelle(10, 10, 'hoechstens'), true);
  assert.equal(haeltSchwelle(1, 2, 'genau'), null);
});

test('Die offenen Punkte werden gezählt, nicht ihre Gruppen', () => {
  // Der Fehler des ersten Anlaufs: Er lief über die Gruppen und meldete 2
  // statt 15. In einem Dashboard fällt so etwas niemandem auf.
  const l = kennzahlen({ ziel, offen: { anfrage: 5, ausgabe: 2, entscheidung: 4, eintragen: 4 } });
  assert.equal(l.find((k) => k.id === 'freigaben-offen').ist, 15);
});

test('Die Schwellen sind gerechnet, nicht eingetragen', () => {
  // Wer die Zielgrößen ändert, muss die Schwellen mitwandern sehen — sonst
  // steht hier eine Zahl von gestern.
  const teurer = kennzahlen({ ziel: { ...ziel, zielgewinn: ziel.zielgewinn * 2 } });
  const normal = liste();
  const umsatz = (l) => l.find((k) => k.id === 'monatsumsatz').schwelle;
  assert.ok(umsatz(teurer) > umsatz(normal) * 1.8, 'der nötige Umsatz müsste mit dem Ziel steigen');
});

test('Die Abbruchschwelle folgt der Quote, die ausgeschlossen werden soll', () => {
  const streng = kennzahlen({ ziel, quote: 0.005 }).find((k) => k.id === 'klicks').schwelle;
  const mild = kennzahlen({ ziel, quote: 0.02 }).find((k) => k.id === 'klicks').schwelle;
  assert.ok(streng > mild * 3, `${streng} gegen ${mild}`);
});

test('Zielgrößen, die sich nicht tragen, werden abgewiesen', () => {
  assert.throws(() => kennzahlen({ ziel: { ...ziel, werbeanteil: 0.9 } }), /tragen sich nicht/);
});

test('Der Befund zählt Gemessenes und Reißendes getrennt', () => {
  const b = kennzahlbefund(kennzahlen({ ziel, gemessen: { werbeanteil: 0.3 } }));
  assert.equal(b.gesamt, 10);
  assert.equal(b.gemessen, 1);
  assert.equal(b.ungemessen, 9);
  assert.deepEqual(b.reissend, ['werbeanteil']);
  assert.equal(b.jeAbschnitt.length, ABSCHNITTE.length);
  assert.equal(b.jeAbschnitt.reduce((n, a) => n + a.kennzahlen.length, 0), b.gesamt);
});

test('Jeder Abschnitt trägt mindestens eine Kennzahl', () => {
  const abschnitte = kennzahlbefund(liste()).jeAbschnitt;
  assert.ok(abschnitte.length >= 3, `nur ${abschnitte.length} Abschnitte`);
  for (const a of abschnitte) {
    assert.ok(a.kennzahlen.length > 0, `${a.id} ist leer — ein Abschnitt ohne Kennzahl ist eine Überschrift`);
  }
});

test('Ohne erhobene offene Punkte zeigt die Kennzahl keinen glatten Nullstand', () => {
  // Die erste Fassung summierte ein leeres Objekt zu 0 und meldete „hält" —
  // ein Dashboard, das ohne Daten eine makellose Bilanz zeigt. Der Test hat
  // es gefunden, nicht das Lesen.
  const k = kennzahlen({ ziel }).find((x) => x.id === 'freigaben-offen');
  assert.equal(k.ist, null);
  assert.equal(k.haelt, null);
  assert.equal(kennzahlen({ ziel, offen: {} }).find((x) => x.id === 'freigaben-offen').ist, 0);
});
