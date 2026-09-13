import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { berechneBedarf, ANSAETZE } from '../src/bedarf.js';

const daten = {
  lieferanten: JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url))),
  artikel: JSON.parse(readFileSync(new URL('../data/artikel.json', import.meta.url))),
};
const katalog = ladeKatalog(daten, 0.35);

const menge = (bedarf, sku) => bedarf.positionen.find((p) => p.sku === sku)?.menge;

test('Fläche und Umfang werden aus den Außenmaßen gebildet', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10 }, katalog);
  assert.equal(b.flaeche, 120);
  assert.equal(b.umfang, 44);
});

test('Bahnenbedarf enthält Aufkantung, Überlappung und Verschnitt', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10 }, katalog);
  const erwartet = (120 + 44 * ANSAETZE.aufkantungHoehe) * (1 + ANSAETZE.ueberlappung + ANSAETZE.verschnitt);
  assert.ok(Math.abs(b.bahnBedarfM2 - Number(erwartet.toFixed(1))) < 0.05);
  assert.ok(b.bahnBedarfM2 > 120, 'Bedarf muss über der reinen Grundfläche liegen');
});

test('Rollen werden aufgerundet und der Überschuss wird benannt', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10 }, katalog);
  const rollen = menge(b, 'AB-RD-375');

  assert.equal(rollen, Math.ceil(b.bahnBedarfM2 / 37.5));
  assert.ok(rollen * 37.5 >= b.bahnBedarfM2);
  assert.ok(b.hinweise.some((h) => /Rollenbindung/.test(h)));
  assert.ok(b.hinweise.some((h) => /Teilmengen gibt es nicht/.test(h)));
});

test('Ein Quadratmeter mehr kann eine ganze Rolle mehr bedeuten', () => {
  // Genau der Effekt, den der Rechner sichtbar machen soll.
  let vorher = null;
  let sprungGefunden = false;
  for (let l = 8; l <= 20; l += 0.5) {
    const rollen = menge(berechneBedarf({ laenge: l, breite: 10 }, katalog), 'AB-RD-375');
    if (vorher != null && rollen === vorher + 1) sprungGefunden = true;
    vorher = rollen;
  }
  assert.ok(sprungGefunden, 'Rollenzahl muss in Stufen springen, nicht stetig wachsen');
});

test('Ohne Drainage fehlen die Drainagepositionen und es gibt einen Hinweis', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10, mitDrainage: false }, katalog);
  assert.equal(menge(b, 'DR-100-050'), undefined);
  assert.equal(menge(b, 'DR-KS-100'), undefined);
  assert.ok(b.hinweise.some((h) => /Radonschutzgebiet/.test(h)));
});

test('Mit Drainage kommen Rohr, Formteile, Schacht und Steigleitung dazu', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10, mitDrainage: true }, katalog);
  const rohrMeter = (120 / ANSAETZE.rohrabstand) * (1 + ANSAETZE.rohrZuschlag);

  assert.equal(menge(b, 'DR-100-050'), Math.ceil(rohrMeter / 50));
  assert.equal(menge(b, 'DR-FT-SET'), 1);
  assert.equal(menge(b, 'DR-KS-100'), 1);
  assert.equal(menge(b, 'DR-SL-100'), 1);
});

test('Durchführungen erzeugen Ringraumdichtungen, keine bei null', () => {
  const mit = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4 }, katalog);
  assert.equal(menge(mit, 'ZB-RR-125'), 4);

  const ohne = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 0 }, katalog);
  assert.equal(menge(ohne, 'ZB-RR-125'), undefined);
});

test('Primer und Dichtband werden auf Gebinde und Rollen aufgerundet', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4 }, katalog);
  assert.equal(menge(b, 'AB-PR-010'), Math.ceil((120 * ANSAETZE.primerProM2) / 10));
  assert.equal(menge(b, 'ZB-DB-150'), Math.ceil((44 + 4) / 25));
});

test('Unsinnige Eingaben werden abgewiesen', () => {
  assert.throws(() => berechneBedarf({ laenge: 0, breite: 10 }, katalog));
  assert.throws(() => berechneBedarf({ laenge: -5, breite: 10 }, katalog));
  assert.throws(() => berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 2.5 }, katalog));
  assert.throws(() => berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: -1 }, katalog));
});

test('Das Ergebnis lässt sich unmittelbar als Warenkorb rechnen', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4, mitDrainage: true }, katalog);
  const wk = berechneWarenkorb(b.warenkorbzeilen, katalog);

  assert.ok(wk.warenwertNetto > 0);
  assert.equal(wk.teillieferungen.length, 3, 'drei Lieferanten, also drei Teillieferungen');
  assert.ok(wk.bestellbar, 'ein vollständiges Gebäude sollte alle Mindestbestellwerte erreichen');
});

test('Jede Position trägt ihre Begründung', () => {
  const b = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 2, mitDrainage: true }, katalog);
  assert.ok(b.positionen.length >= 5, `nur ${b.positionen.length} Positionen`);
  for (const p of b.positionen) {
    assert.ok(p.begruendung && p.begruendung.length > 5, `Begründung fehlt bei ${p.sku}`);
  }
  assert.ok(b.hinweise.some((h) => /Planungswerte/.test(h)));
});

test('Die Verschnitt-Prozentzahl steht auf dem Bedarf, nicht auf der gelieferten Fläche', () => {
  // 12 × 10 m: Bedarf 153,2 m², geliefert 187,5 m², Überschuss 34,3 m².
  // „über dem Bedarf" heißt 34,3/153,2 = 22 % — nicht 34,3/187,5 = 18 %.
  // Die alte Basis untertrieb die Rollenbindung; fünfter Zahlenfehler in die
  // optimistische Richtung.
  const b = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 4, mitDrainage: true }, katalog);
  const rollenhinweis = b.hinweise.find((h) => /Rollenbindung/.test(h));
  assert.match(rollenhinweis, /\(22 %\)/);
  assert.doesNotMatch(rollenhinweis, /\(18 %\)/);
});

test('Eine Position, die das Sortiment nicht führt, verschwindet nicht stumm', () => {
  const kleinerKatalog = { artikel: katalog.artikel.filter((a) => a.sku !== 'AB-RD-375') };
  const b = berechneBedarf({ laenge: 12, breite: 10, durchfuehrungen: 0, mitDrainage: false }, kleinerKatalog);

  assert.ok(!b.positionen.some((p) => p.sku === 'AB-RD-375'), 'die Bahn kann nicht in der Liste sein');
  const hinweis = b.hinweise.find((h) => /Nicht im Sortiment/.test(h));
  assert.ok(hinweis, 'die Lücke steht in der Ausgabe, nicht im Kleingedruckten');
  assert.match(hinweis, /AB-RD-375/);
  assert.match(hinweis, /unvollständig/);
});

/* ------------------------------------------------------------------ *
 * Was das Sortiment nicht führt, verschwindet nicht stumm
 * ------------------------------------------------------------------ */

test('Eine Position ohne Artikel im Katalog steht in den Hinweisen, nicht im Nichts', () => {
  // **Die Zusage aus dem Dateikopf**, bis zum 31.08. ohne Probe: „das gehört
  // in die Ausgabe, nicht ins Kleingedruckte." Der Deckungslauf hat den Zweig
  // als unerreicht gemeldet — eine Stückliste, die stumm kürzt, sieht
  // vollständig aus und ist es nicht.
  //
  // Der Rechner kennt mehr Positionen als das Sortiment; das ist erlaubt. Was
  // nicht erlaubt ist, ist zu schweigen.
  const luecke = ladeKatalog({
    lieferanten: daten.lieferanten,
    artikel: { artikel: daten.artikel.artikel.filter((a) => a.sku !== 'AB-PR-010') },
  }, 0.35);
  const b = berechneBedarf({ laenge: 12, breite: 10 }, luecke);

  assert.equal(menge(b, 'AB-PR-010'), undefined, 'die Position kann nicht enthalten sein');
  const hinweis = b.hinweise.find((h) => h.includes('Nicht im Sortiment'));
  assert.ok(hinweis, `kein Hinweis auf die fehlende Position: ${b.hinweise.join(' | ')}`);
  assert.match(hinweis, /AB-PR-010/);
  assert.match(hinweis, /unvollständig/);
});

test('Fehlt die Leitposition, meldet es der Rechner ebenfalls', () => {
  // Die Bahn ist der Sonderfall: Ihr Wächter überspringt den ganzen Block,
  // bevor `nimm()` überhaupt gefragt wird. Ohne die eigene Meldung an dieser
  // Stelle verschwände ausgerechnet die Hauptposition am leisesten.
  const ohneBahn = ladeKatalog({
    lieferanten: daten.lieferanten,
    artikel: { artikel: daten.artikel.artikel.filter((a) => a.sku !== 'AB-RD-375') },
  }, 0.35);
  const b = berechneBedarf({ laenge: 12, breite: 10 }, ohneBahn);
  const hinweis = b.hinweise.find((h) => h.includes('Nicht im Sortiment'));
  assert.ok(hinweis, `kein Hinweis auf die fehlende Bahn: ${b.hinweise.join(' | ')}`);
  assert.match(hinweis, /AB-RD-375/);
});

test('Bei vollständigem Sortiment steht kein Hinweis auf Lücken', () => {
  // Die Gegenrichtung: Der Hinweis darf nicht immer dastehen, sonst sagt er
  // nichts mehr.
  const b = berechneBedarf({ laenge: 12, breite: 10 }, katalog);
  assert.ok(!b.hinweise.some((h) => h.includes('Nicht im Sortiment')),
    'ein Lückenhinweis ohne Lücke');
});
