import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { noetigesSuchvolumen, versuchsdauer, volumenbedarf, KLICKRATE, TAGE_JE_MONAT }
  from '../src/suchbedarf.js';
import { LIEFERGEBIET } from '../src/liefergebiet.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const nah = (ist, soll, t = 1e-9) => assert.ok(Math.abs(ist - soll) <= t, `${ist} statt ${soll}`);

test('Das nötige Volumen ist die Umkehrung der Klickrate', () => {
  nah(noetigesSuchvolumen(200, 0.05), 4000);
  nah(noetigesSuchvolumen(200, 0.08), 2500);
  nah(noetigesSuchvolumen(0, 0.05), 0);
  // Eine Klickrate von 100 % heißt: jede Suche ein Klick.
  nah(noetigesSuchvolumen(200, 1), 200);

  for (const r of [0, -0.1, 1.5]) assert.throws(() => noetigesSuchvolumen(200, r), /Klickrate/);
  assert.throws(() => noetigesSuchvolumen(-1, 0.05), /Klickzahl/);
});

test('Das Klickratenband deckt alle genannten Raten ab und ist monoton', () => {
  const raten = Object.keys(KLICKRATE).filter((n) => !n.startsWith('_'));
  assert.ok(raten.length >= 3, `nur ${raten.length} Klickraten — die Schleife prüft zu wenig`);

  const b = volumenbedarf(200);
  assert.deepEqual(b.map((x) => x.name).sort(), raten.sort(),
    'das Band deckt nicht dieselben Raten ab wie KLICKRATE');
  // Der Erklärtext gehört nicht in die Rechnung.
  assert.ok(!b.some((x) => x.name.startsWith('_')), 'die Herkunftsnotiz ist in den Bedarf geraten');

  // Kleinere Klickrate, größerer Bedarf — sonst stimmt die Umkehrung nicht.
  const sortiert = [...b].sort((x, y) => x.klickrate - y.klickrate);
  for (let i = 1; i < sortiert.length; i++) {
    assert.ok(sortiert[i].noetigesVolumen < sortiert[i - 1].noetigesVolumen,
      `${sortiert[i].name} braucht nicht weniger als ${sortiert[i - 1].name}`);
  }
});

test('Es bindet der kleinere der beiden Engpässe — Markt oder Budget', () => {
  const grund = { klickrate: 0.05, tagesbudget: 10, klickpreis: 1.5, schwelleKlicks: 299 };
  const ausBudget = (10 / 1.5) * TAGE_JE_MONAT;

  // Viel Markt: das Budget bindet.
  const reich = versuchsdauer({ ...grund, suchvolumenJeMonat: 100000 });
  assert.equal(reich.engpass, 'Budget');
  nah(reich.klicksJeMonat, ausBudget);
  assert.equal(reich.ungenutztesBudgetJeMonat, 0);

  // Wenig Markt: der Markt bindet, und ein Teil des Budgets bleibt liegen.
  const knapp = versuchsdauer({ ...grund, suchvolumenJeMonat: 1000 });
  assert.equal(knapp.engpass, 'Markt');
  nah(knapp.klicksJeMonat, 50);
  nah(knapp.monateBisSchwelle, 299 / 50);
  nah(knapp.ungenutztesBudgetJeMonat, (ausBudget - 50) * 1.5);

  // Gleichstand geht an den Markt: Er ist der Engpass, den keine Entscheidung
  // wegräumt.
  const gleich = versuchsdauer({ ...grund, suchvolumenJeMonat: ausBudget / 0.05 });
  assert.equal(gleich.engpass, 'Markt');

  // Kein Volumen heißt: Der Versuch endet nie von selbst. Unendlich ist hier
  // die Antwort und keine Panne — eine 0 sähe aus wie „sofort fertig".
  const leer = versuchsdauer({ ...grund, suchvolumenJeMonat: 0 });
  assert.equal(leer.monateBisSchwelle, Infinity);
  assert.equal(leer.klicksJeMonat, 0);
});

test('Unbrauchbare Eingaben werfen, statt eine Dauer zu erfinden', () => {
  const grund = { suchvolumenJeMonat: 1000, klickrate: 0.05, tagesbudget: 10, klickpreis: 1.5, schwelleKlicks: 299 };
  for (const feld of ['tagesbudget', 'klickpreis', 'schwelleKlicks']) {
    assert.throws(() => versuchsdauer({ ...grund, [feld]: 0 }), new RegExp(feld), `${feld}=0 kam durch`);
  }
  assert.throws(() => versuchsdauer({ ...grund, suchvolumenJeMonat: -1 }), /Suchvolumen/);
  assert.throws(() => versuchsdauer({ ...grund, klickrate: 0 }), /Klickrate/);
});

/**
 * Die erzeugte Messliste muss die Begriffe der Kampagne tragen — und den Ort
 * des Liefergebiets. Eine Messliste mit anderen Begriffen misst ein anderes
 * Modell; genau das ist mit `data/messliste.json` passiert, die bis heute die
 * Radon-Keywords führt.
 */
test('Die erzeugte Messliste trägt genau die Keywords der Kampagne', () => {
  const listeDatei = pfad('../ausgabe/messliste-baustoff.json');
  const keywordDatei = pfad('../ausgabe/kampagne/keywords.csv');
  if (!existsSync(listeDatei) || !existsSync(keywordDatei)) return;

  const liste = JSON.parse(readFileSync(listeDatei, 'utf8'));
  assert.ok(liste.gruppen.length > 0, 'leere Messliste — die Vergleiche darunter prüfen nichts');

  const ausKampagne = new Set(
    readFileSync(keywordDatei, 'utf8').trim().split('\n').slice(1)
      .map((z) => (z.match(/^[^,]*,[^,]*,("(?:[^"]|"")*"|[^,]*)/) ?? [])[1])
      .filter(Boolean)
      .map((f) => f.replace(/^"|"$/g, '').replaceAll('""', '"').toLowerCase()),
  );
  assert.ok(ausKampagne.size > 0, 'keine Keywords aus der Kampagne gelesen');

  const inListe = new Set(liste.gruppen.flatMap((g) => g.keywords.map((k) => k.begriff.toLowerCase())));
  assert.deepEqual([...inListe].sort(), [...ausKampagne].sort(),
    'Messliste und Kampagne führen verschiedene Begriffe');

  // Und der Ort ist das Liefergebiet, nicht Österreich.
  assert.deepEqual(liste.markt.bezirke, LIEFERGEBIET.bezirke.map((b) => b.name));
  assert.equal(liste.markt.land, LIEFERGEBIET.land);

  // Die Werte sind leer — eine Messliste mit vorgetragenen Zahlen wäre eine
  // Vermutung, die am Messtag wie ein Messwert aussieht.
  for (const g of liste.gruppen) {
    assert.ok(g.keywords.length > 0, `Gruppe ${g.gruppe} ohne Begriffe — die Schleife prüft nichts`);
    for (const k of g.keywords) {
      assert.equal(k.volumen, null, `${k.begriff} trägt schon ein Volumen`);
    }
  }
});
