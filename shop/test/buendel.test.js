import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { BROWSERMODULE, KERNMODULE, SHOPMODULE, importhuelle, baueKern, reihenfolge, pruefeNamenskollisionen } from '../src/buendel.js';

const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
const src = pfad('../src');


/* ------------------------------------------------------------------ *
 * Was im Browser landet — und was nicht
 * ------------------------------------------------------------------ */

test('die Browserliste ist genau ihre eigene Importhülle', () => {
  // Von Hand geführt, maschinell geprüft: Importiert eines dieser Module
  // eines Tages etwas Neues, fällt es hier auf, statt still wieder ins
  // ausgelieferte Skript zu fahren.
  const lies = (name) => readFileSync(join(src, name), 'utf8');
  assert.deepEqual(importhuelle(lies, [...BROWSERMODULE]), [...BROWSERMODULE].sort());
});

test('das Browserbündel trägt keine Rechnung, die dem Betrieb gehört', () => {
  // Keine Einkaufszahl steht in diesen Dateien — aber die Methode, und die
  // gehört dem Betrieb. Genannt wird, was ausdrücklich draußen bleibt.
  for (const draussen of ['preis.js', 'kostenbild.js', 'skonto.js', 'zahlung.js',
    'beleg.js', 'ablage.js', 'vies.js', 'bestellung.js', 'auftragslauf.js',
    'rechtstexte.js', 'kunde.js', 'bedarf.js', 'warenkorb.js']) {
    assert.ok(!BROWSERMODULE.includes(draussen), `${draussen} gehört nicht in den Browser`);
  }
  // Und die Gegenrichtung: Was der Shop braucht, ist drin.
  for (const drin of ['shopkern.js', 'gebinde.js', 'kundenanfrage.js', 'liefergebiet.js']) {
    assert.ok(BROWSERMODULE.includes(drin), `${drin} fehlt im Browserbündel`);
  }
});

test('das gebaute shop.js enthält keine ausgeschlossene Funktion', () => {
  const datei = pfad('../ausgabe/site/shop.js');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const js = readFileSync(datei, 'utf8');
  // Namen, die es nur in den ausgeschlossenen Modulen gibt.
  for (const name of ['berechneWarenkorb', 'erzeugeBestellungen', 'pruefeUid',
    'traegtSichSelbst', 'erzeugeImpressum', 'materialbedarf']) {
    assert.ok(!new RegExp(`function ${name}\\\\b`).test(js),
      `${name} fährt weiter im Browser mit`);
  }
  // Und was drin sein muss, ist drin — sonst prüft der Test eine leere Datei.
  assert.match(js, /function kundenWarenkorb\(/);
  assert.match(js, /function baueKundenanfrage\(/);
});


/* ------------------------------------------------------------------ *
 * Die Reihenfolge wird gerechnet, nicht gepflegt
 * ------------------------------------------------------------------ */

test('jede Abhängigkeit steht im Bündel vor ihrem Nutzer', () => {
  // **Der Befund vom 30.08.:** `rechtstexte.js` nennt seit der
  // Datenschutzseite den Warenkorbschlüssel aus `shopkern.js`, stand in der
  // handgeführten Liste aber neun Plätze davor. Im Modulbetrieb gleichgültig,
  // im zusammengefügten Skript tödlich: „Cannot access 'KORBSCHLUESSEL'
  // before initialization" — und damit war das ganze Skript der Demoseite
  // tot, ohne dass ein Test etwas bemerkte.
  //
  // Geprüft wird die Eigenschaft an **allen** Modulen, nicht am aufgefallenen
  // Paar.
  const lies = (name) => readFileSync(join(src, name), 'utf8');
  const sortiert = reihenfolge(lies, [...KERNMODULE, ...SHOPMODULE]);
  assert.equal(sortiert.length, KERNMODULE.length + SHOPMODULE.length);
  const kanten = sortiert.flatMap((modul) => [...lies(modul).matchAll(/from '\.\/([a-z.]+\.js)'/g)]
    .map((treffer) => ({ nutzer: modul, gebraucht: treffer[1] })));
  assert.ok(kanten.length >= 20, `nur ${kanten.length} Abhängigkeiten gefunden — die Schleife prüft zu wenig`);
  for (const { nutzer, gebraucht } of kanten) {
    assert.ok(sortiert.indexOf(gebraucht) < sortiert.indexOf(nutzer),
      `${nutzer} braucht ${gebraucht}, steht aber davor`);
  }
  // Und die Stelle, an der es schiefging, namentlich:
  assert.ok(sortiert.indexOf('shopkern.js') < sortiert.indexOf('rechtstexte.js'),
    'rechtstexte.js liest KORBSCHLUESSEL aus shopkern.js');
});

test('ein Ringschluss wird gemeldet, nicht sortiert', () => {
  // Zwei Module, die einander brauchen, haben keine Reihenfolge. Das ist
  // kein Sonderfall, den man wegsortieren kann — es ist ein Befund.
  const erfunden = {
    'a.js': "import { b } from './b.js';",
    'b.js': "import { a } from './a.js';",
  };
  assert.throws(() => reihenfolge((n) => erfunden[n], ['a.js']), /Ringschluss/);
});

test('das gebaute demo.html führt sein Skript wirklich aus', () => {
  // Die Gegenprobe zur Reihenfolge, an der ausgelieferten Datei: Steht die
  // Deklaration des Warenkorbschlüssels vor seiner ersten Verwendung?
  const datei = pfad('../demo.html');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage — und keine falsche
  const html = readFileSync(datei, 'utf8');
  const deklaration = html.indexOf('const KORBSCHLUESSEL =');
  assert.ok(deklaration > 0, 'der Warenkorbschlüssel steht nicht im Bündel');
  // **Anker nachgezogen am 4. September.** Hier stand `${KORBSCHLUESSEL}` —
  // die Einsetzung in `rechtstexte.js`. Seit Gate 26 bildet
  // `warenkorbZusage()` den Satz, und `rechtstexte.js` reicht den Schlüssel
  // als Wert weiter. Die geprüfte Eigenschaft ist dieselbe geblieben:
  // Deklaration vor erster Verwendung.
  const ersteNutzung = html.indexOf('warenkorbZusage(aktiv, KORBSCHLUESSEL)');
  assert.ok(ersteNutzung > 0, 'die Datenschutzseite nennt den Schlüssel nicht mehr — Probe nachziehen');
  assert.ok(deklaration < ersteNutzung,
    'der Schlüssel wird vor seiner Deklaration gelesen — das Skript stirbt beim Laden');
});

test('Ein doppelt vergebener Name im Bündel wird gemeldet, nicht gebündelt', () => {
  // **Der Fehler, den diese Wache verhindert, ist schon passiert:** Zwei
  // Module trugen je eine Hilfsfunktion `EUR`. Einzeln geladen ist das
  // harmlos, im zusammengefügten Skript ein SyntaxError — und dann läuft die
  // ganze Seite nicht, während die Tests grün bleiben, weil sie die Module
  // einzeln laden.
  //
  // Bis zum 31.08. war ausgerechnet diese Wache die einzige in `buendel.js`
  // ohne Probe; der Ringschluss darüber hatte längst eine. Gefunden mit einem
  // Deckungslauf über die Testsuite, nicht durch Lesen.
  assert.throws(
    () => pruefeNamenskollisionen('const EUR = 1;\nfunction f() {}\nconst EUR = 2;'),
    /Doppelt deklariert im Bündel: EUR/,
  );
  assert.throws(
    () => pruefeNamenskollisionen('function kopf() {}\nasync function kopf() {}'),
    /SyntaxError/,
  );
});

test('Gleichnamige Namen in verschiedenen Modulen sind erlaubt, solange sie es bleiben', () => {
  // Die Gegenrichtung: Die Wache darf nicht bei jedem wiederholten Wort
  // anschlagen. Geprüft wird die **Deklaration** am Zeilenanfang, nicht jedes
  // Vorkommen des Namens.
  assert.doesNotThrow(() => pruefeNamenskollisionen(
    'const EUR = 1;\nfunction zeige() { return EUR + EUR; }\n  const EUR = 2;',
  ));
  assert.doesNotThrow(() => pruefeNamenskollisionen('const a = 1;\nconst b = 2;\nlet c;'));
});
