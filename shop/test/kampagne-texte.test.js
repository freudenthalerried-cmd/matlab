import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pruefeTexte, VOLLSTAENDIGKEITSWORTE, LUECKENSATZ,
  BESTELLAUSSAGEN, pruefeBestellversprechen,
} from '../bin/kampagne.mjs';
// Seit dem 5. September in `src/aussagen.js`: Beide Register hatten nur
// Anzeigentexte gelesen, während dieselbe Behauptung auf der Startseite stand.
import { PREISAUSSAGEN } from '../src/aussagen.js';
import { ETAPPEN } from '../src/rollout.js';

/* ------------------------------------------------------------------ *
 * Vollständigkeitsversprechen — Befund vom 2. September
 *
 * Alle drei laufenden Anzeigengruppen warben mit „komplett", „aus einer
 * Hand" oder „alle gängigen Stärken". Alle vier Systemlisten des Shops
 * benennen mindestens eine Position, die er nicht führt — bei WDVS ist es
 * die Dämmplatte in Flächenstärke, also die Hauptschicht.
 * ------------------------------------------------------------------ */

test('Eine Gruppe mit Lücke darf keine Vollständigkeit versprechen', () => {
  const anzeige = {
    Anzeigengruppe: 'WDVS',
    'Überschrift 1': 'Fassade komplett liefern',
    'Beschreibung 1': 'Das komplette System aus einer Hand.',
  };
  const fehler = pruefeTexte([anzeige], ['M2', 'KG'], new Set(['WDVS']));
  assert.equal(fehler.length, 2, fehler.join(' | '));
  assert.ok(fehler.every((f) => f.includes('verspricht Vollständigkeit')));
});

test('Ohne Lücke ist dasselbe Wort in Ordnung', () => {
  const anzeige = { Anzeigengruppe: 'Mörtel', 'Überschrift 1': 'Mörtel komplett liefern' };
  assert.deepEqual(pruefeTexte([anzeige], ['KG'], new Set(['WDVS'])), []);
});

test('Alle fünf Vollständigkeitsworte greifen', () => {
  assert.ok(VOLLSTAENDIGKEITSWORTE.length >= 5, 'zu wenige Muster');
  const saetze = [
    'Fassade komplett liefern',
    'Alles aus einer Hand',
    'In allen gängigen Stärken',
    'Vollständiges System',
    'Der ganze Aufbau',
  ];
  assert.equal(saetze.length, VOLLSTAENDIGKEITSWORTE.length, 'je Muster ein Satz');
  for (const satz of saetze) {
    const treffer = pruefeTexte([{ Anzeigengruppe: 'X', 'Überschrift 1': satz }], ['STK'], new Set(['X']));
    assert.equal(treffer.length, 1, `„${satz}" wird nicht gefunden`);
  }
});

test('Der Lückensatz der Systemlisten wird erkannt', () => {
  assert.ok(LUECKENSATZ.test('Eine der zehn Positionen führen wir nicht: das Anschlussformteil.'));
  assert.ok(LUECKENSATZ.test('Die Dämmplatte führen wir derzeit nicht in Flächenstärke.'));
  assert.ok(!LUECKENSATZ.test('Alle Positionen stehen im Katalog.'));
});

test('Ohne Lückenangabe prüft die Regel nichts — und das ist die Voreinstellung', () => {
  // Anders als bei den Einheiten ist hier eine leere Menge zulässig: Ein Shop
  // ohne Systemliste hat keine bekannte Lücke. Die Probe hält fest, dass das
  // eine Entscheidung ist und kein Versehen.
  const anzeige = { Anzeigengruppe: 'WDVS', 'Überschrift 1': 'Fassade komplett liefern' };
  assert.deepEqual(pruefeTexte([anzeige], ['M2']), []);
});

/* ------------------------------------------------------------------ *
 * Aussagen über den Preis — 5. September
 *
 * In der WDVS-Anzeige stand: „Ein Baumeister kauft ein, **Sie zahlen seinen
 * Preis**." Die eigene Wissensseite, von jeder Artikelkarte verlinkt, sagt im
 * zweiten Satz: „…aus dem Einkauf eines Baumeisterbetriebs, **zuzüglich eines
 * Aufschlags**."
 *
 * > **Die Landeseite erklärt sorgfältig, warum die Aussage nicht stimmt, die
 * > die Anzeige macht, die auf sie führt.**
 * ------------------------------------------------------------------ */

const preisanzeige = (satz) => ({ Anzeigengruppe: 'WDVS', 'Beschreibung 1': satz });

test('Eine Anzeige, die den Aufschlag wegredet, fällt auf', () => {
  const fehler = pruefeTexte([preisanzeige('Ein Baumeister kauft ein, Sie zahlen seinen Preis.')], ['M2']);
  assert.equal(fehler.length, 1, fehler.join('\n'));
  assert.match(fehler[0], /25 % Aufschlag/);
  for (const satz of ['Bei uns zum Einkaufspreis.', 'Ohne Aufschlag direkt vom Lieferanten.']) {
    assert.equal(pruefeTexte([preisanzeige(satz)], ['M2']).length, 1, satz);
  }
});

test('Der Claim selbst wird nicht getroffen', () => {
  // „Zum Baumeisterpreis" ist die Weisung des Auftraggebers, der Name der
  // Website und durch eine eigene Wissensseite eingeordnet. Getroffen wird
  // die Gleichsetzung „Ihr Preis = sein Preis", nicht der Claim.
  for (const satz of [
    'WDVS zum Baumeisterpreis',
    'Baumeisterpreis, nicht Liste',
    'Ein Baumeister kauft ein — wie weit unter der Liste, steht bei jedem Artikel.',
    'Perimeter- und Fassadendämmung zum Preis, den ein Baumeister zahlt.',
  ]) {
    assert.deepEqual(pruefeTexte([preisanzeige(satz)], ['M2']), [], satz);
  }
});

test('Eine Meldung je Feld, nicht je Muster', () => {
  assert.ok(PREISAUSSAGEN.length >= 3, 'ein leeres Register bestünde jede Prüfung');
  const fehler = pruefeTexte([preisanzeige('Zum Einkaufspreis und ohne Aufschlag.')], ['M2']);
  assert.equal(fehler.length, 1, 'zwei Muster, ein Satz, eine Meldung');
});

/* ------------------------------------------------------------------ *
 * Aussagen über die Bestellbarkeit — 5. September
 *
 * Alle drei Anzeigen versprechen eine Bestellung. Der Shop kann heute keine
 * entgegennehmen (Gate 26). Der Rolloutplan setzte den Bestellweg zwar zwei
 * Tage vor das Schalten — aber **nur zeitlich**, nicht als Bedingung.
 * ------------------------------------------------------------------ */

const bestellanzeige = { Anzeigengruppe: 'WDVS', 'Beschreibung 1': 'Fassade aus einer Bestellung.' };

test('Der Plan bindet das Schalten an den Bestellweg', () => {
  const schalten = ETAPPEN.find((e) => e.id === 'anzeigen-schalten');
  assert.ok(schalten, 'die Etappe muss es geben');
  assert.ok(schalten.brauchtVor.some((b) => b.etappe === 'bestellweg'),
    'sonst laufen Anzeigen, die etwas versprechen, was die Landeseite nicht kann');
  assert.deepEqual(pruefeBestellversprechen([bestellanzeige], ETAPPEN), []);
});

test('Ohne die Bedingung fällt jedes Bestellversprechen auf', () => {
  const ohne = ETAPPEN.map((e) => (e.id === 'anzeigen-schalten'
    ? { ...e, brauchtVor: e.brauchtVor.filter((b) => b.etappe !== 'bestellweg') }
    : e));
  const fehler = pruefeBestellversprechen([bestellanzeige], ohne);
  assert.equal(fehler.length, 1, fehler.join('\n'));
  assert.match(fehler[0], /nicht an den Bestellweg/);
});

test('Eine Anzeige ohne Bestellversprechen wird nicht behelligt', () => {
  assert.ok(BESTELLAUSSAGEN.length >= 3);
  const ohne = ETAPPEN.map((e) => (e.id === 'anzeigen-schalten'
    ? { ...e, brauchtVor: [] } : e));
  assert.deepEqual(pruefeBestellversprechen(
    [{ Anzeigengruppe: 'WDVS', 'Beschreibung 1': 'Armierung, Putzgrund und Zubehör.' }], ohne), []);
});

test('Ein Plan ohne die Etappe ist ein Befund und kein Freispruch', () => {
  const fehler = pruefeBestellversprechen([bestellanzeige], []);
  assert.equal(fehler.length, 1);
  assert.match(fehler[0], /kennt keine Etappe/);
});
