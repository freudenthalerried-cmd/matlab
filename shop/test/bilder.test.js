import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { artikelBild, gruppenBild, bauform, dickeMm, gradzahl, schichten, schichtbild, BAUFORM_TEXT } from '../src/bilder.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { lesKopf } from '../src/markdown.js';

const katalog = JSON.parse(readFileSync(fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8'));

test('die Bauform kommt aus Bezeichnung, Gruppe und Einheit', () => {
  const f = (bezeichnung, gruppe = '', einheit = 'STK') => bauform({ bezeichnung, gruppe, einheit });
  assert.equal(f('PVC Kanalbogen NW 100 45 grad'), 'bogen', 'ein Bogen ist ein Bogen, kein Rohr');
  assert.equal(f('PVC Kanalabzweiger 100 100 45 grad'), 'abzweig');
  assert.equal(f('PVC Kanalrohr NW 100 1 m'), 'rohr');
  assert.equal(f('Schachtring 800 300 80 mm'), 'ring');
  assert.equal(f('Fassaden EPS 5 cm 0,5 m2', 'Dämmung', 'M2'), 'platte');
  assert.equal(f('Baumit KlebeSpachtel 25 kg', 'Mörtel', 'SCK'), 'sack');
  assert.equal(f('Capatect Glasgewebe M, Breite 110cm', 'WDVS', 'M2'), 'rolle');
  assert.equal(f('Ökotherm HL N+F 10 50 23,8 cm', 'Mauerwerk'), 'stein');
});

test('Maße werden aus der Bezeichnung gelesen', () => {
  assert.equal(dickeMm('XPS glatt SF 100 mm 0,75 m2'), 100);
  assert.equal(dickeMm('Fassaden EPS 5 cm 0,5 m2'), 50);
  assert.equal(dickeMm('Prima Dosierpistole Metall Lite'), null);
  assert.equal(gradzahl('PVC Kanalbogen NW 100 30 grad'), 30);
  assert.equal(gradzahl('PVC Kanalrohr NW 100 1 m'), null);
});

test('die gezeichnete Stärke folgt dem Maß', () => {
  // Der Punkt der ganzen Übung: Ein Bild, das bei 2 cm und bei 10 cm gleich
  // aussieht, ist Dekoration. Verglichen wird die y-Lage der Oberkante —
  // je dicker die Platte, desto höher beginnt sie im Feld.
  const oben = (b) => Number(artikelBild({ bezeichnung: b, gruppe: 'Dämmung', einheit: 'M2' })
    .match(/<path d="M18 (\d+(?:\.\d+)?)/)[1]);
  assert.ok(oben('EPS 10 cm') < oben('EPS 2 cm'), 'die dickere Platte beginnt weiter oben');
});

test('der Winkel eines Bogens wird gezeichnet, nicht nur beschriftet', () => {
  const spitze = (b) => artikelBild({ bezeichnung: b, gruppe: 'Kanal', einheit: 'STK' })
    .match(/L40 62 L([\d.]+) ([\d.]+)/);
  const [, x30, y30] = spitze('Kanalbogen 30 grad');
  const [, x45, y45] = spitze('Kanalbogen 45 grad');
  assert.ok(Number(y45) < Number(y30), '45° steigt steiler als 30°');
  assert.ok(Number(x45) < Number(x30), '45° reicht dafür weniger weit');
});

test('jeder Artikel des Katalogs bekommt ein gültiges Bild', () => {
  assert.ok(katalog.artikel.length >= 40, 'ohne Artikel prüft diese Schleife nichts');
  for (const a of katalog.artikel) {
    const svg = artikelBild(a);
    assert.match(svg, /^<svg /, `${a.sku}: kein SVG`);
    assert.match(svg, /viewBox="0 0 120 90"/, `${a.sku}: fremdes Feld`);
    assert.match(svg, /role="img" aria-label="[^"]+"/, `${a.sku}: ohne Beschreibung`);
    assert.equal((svg.match(/<svg/g) ?? []).length, 1, `${a.sku}: verschachteltes SVG`);
    assert.ok(!/NaN|undefined|null/.test(svg), `${a.sku}: unaufgelöster Wert im Bild`);
    assert.ok(BAUFORM_TEXT[bauform(a)], `${a.sku}: Bauform ohne Klartext`);
  }
});

test('jede Warengruppe hat ein Sinnbild', () => {
  const gruppen = [...new Set(katalog.artikel.map((a) => a.gruppe))];
  assert.ok(gruppen.length >= 6);
  for (const g of gruppen) {
    const svg = gruppenBild(g);
    assert.match(svg, /class="schema gruppe"/, `${g}: falsche Klasse`);
    assert.ok(!/NaN|undefined/.test(svg), `${g}: unaufgelöster Wert`);
  }
});

test('die Beschriftung entkommt spitzen Klammern', () => {
  const svg = artikelBild({ bezeichnung: 'Teil <script> 5 cm', gruppe: 'Dämmung', einheit: 'M2' });
  assert.ok(!svg.includes('<script>'), 'sonst steht fremdes Markup in der Zeichnung');
});

/* ------------------------------------------------------------------ *
 * Der Schlüssel: welche Form gehört zu welchem Artikel
 * ------------------------------------------------------------------ */

/**
 * Von Hand entschieden, Artikel für Artikel, mit dem Lieferschein daneben.
 *
 * Diese Tabelle gab es zuerst nicht — geprüft wurde nur, ob überhaupt ein
 * gültiges SVG herauskommt. Drei von 46 Artikeln trugen deshalb monatelang
 * das falsche Bild, ohne dass eine Probe anschlug:
 *
 * > **Eine Prüfung, die fragt „ist es ein Bild?", beantwortet nicht die
 * > Frage „ist es das richtige Bild?".**
 *
 * Was die Maschine nicht entscheiden kann, steht deshalb hier als Antwort
 * und nicht als Regel. Kommt ein Artikel in den Katalog, fällt er als
 * fehlender Eintrag auf und zwingt zur Entscheidung.
 */
const SOLLFORM = {
  'POS-10095': 'rohr', 'POS-10115': 'bogen', 'POS-10116': 'bogen', 'POS-10134': 'abzweig',
  'POS-11133': 'ring', 'POS-21382': 'rolle', 'POS-29023': 'rolle',
  'POS-10837': 'stein', 'POS-51967': 'stein', 'POS-29728': 'stein',
  'POS-18110': 'sack', // Mantelstein*kleber* — ein Dünnbettmörtel, kein Stein
  'POS-12455': 'teil', 'POS-12467': 'teil', // Anschluss*paket*, kein Sack Putz
  'POS-12472': 'teil',
  'POS-12476': 'rohr', 'POS-51875': 'haube', 'POS-16070': 'sack',
  'POS-11283': 'sack', 'POS-29461': 'sack', 'POS-13728': 'sack', 'POS-19333': 'sack',
  'POS-29108': 'sack', 'POS-13550': 'sack', 'POS-29754': 'sack',
  'POS-50509': 'rolle', 'POS-52058': 'rolle', 'POS-31265': 'rolle',
  'POS-52124': 'leiste', 'POS-53402': 'leiste',
  'POS-11082': 'duebel', 'POS-29610': 'duebel', 'POS-52537': 'duebel', 'POS-53215': 'duebel',
  'POS-12294': 'werkzeug', // die Pistole selbst
  'POS-51987': 'dose', // Pistolen*schaum* — die Dose für die Pistole
  'POS-29691': 'dose', 'POS-31631': 'dose',
  'POS-12566': 'platte', 'POS-12567': 'platte', 'POS-12583': 'platte', 'POS-28415': 'platte',
  'POS-12569': 'platte', 'POS-12571': 'platte', 'POS-12575': 'platte', 'POS-12580': 'platte',
  'POS-12596': 'platte',
};

test('jeder Artikel bekommt die Form, die er hat', () => {
  assert.equal(katalog.artikel.length, Object.keys(SOLLFORM).length,
    'für jeden Artikel eine Sollform und umgekehrt');
  for (const a of katalog.artikel) {
    const soll = SOLLFORM[a.sku];
    assert.ok(soll, `${a.sku} „${a.bezeichnung}": keine Sollform hinterlegt — von Hand entscheiden`);
    assert.equal(bauform(a), soll, `${a.sku} „${a.bezeichnung}"`);
  }
  const ueberzaehlig = Object.keys(SOLLFORM).filter((s) => !katalog.artikel.some((a) => a.sku === s));
  assert.deepEqual(ueberzaehlig, [], 'Sollformen für Artikel, die es nicht mehr gibt');
});

test('der Kopf des Kompositums entscheidet, nicht der Wortteil', () => {
  const f = (bezeichnung, gruppe = '', einheit = 'STK') => bauform({ bezeichnung, gruppe, einheit });
  assert.equal(f('Mantelstein MSTS EZ 16-18'), 'stein');
  assert.equal(f('Mantelsteinkleber RMRTL Dünnbettmörtel'), 'sack', 'der Kleber ist kein Stein');
  assert.equal(f('Prima Dosierpistole Metall Lite'), 'werkzeug');
  assert.equal(f('Soudal Profi-Pistolenschaum B3 750 ml', '', 'DOS'), 'dose', 'der Schaum ist keine Pistole');
  assert.equal(f('SIKM Putztüranschlusspaket oben 18'), 'teil', 'ein Paket ist kein Sack Putz');
  assert.equal(f('Capatect PrimaPor K20 weiß 25 kg SH-Reibputz', 'WDVS', 'KG'), 'sack', 'der Reibputz schon');
});

test('Bindestrich und Ziffer beenden ein Wort, ein Buchstabe nicht', () => {
  // „PAE-Folie" und „Kanalbogen 45" müssen weiter treffen — sonst hätte die
  // Wortende-Regel mehr kaputtgemacht, als sie repariert.
  const f = (bezeichnung, einheit = 'STK') => bauform({ bezeichnung, einheit });
  assert.equal(f('PAE-Folie T 100 2 50 m'), 'rolle');
  assert.equal(f('PVC Kanalbogen NW 100 45 grad'), 'bogen');
  assert.equal(f('Thermo-Trennstein 12-18 EZ'), 'stein');
});

/* ------------------------------------------------------------------ *
 * Der Schichtenschnitt
 * ------------------------------------------------------------------ */

test('die Kopfzeile wird in Lagen zerlegt, „(fremd)" markiert die fremde Lage', () => {
  const l = schichten('Wand (fremd) | Abdichtung (fremd) | Perimeterplatte XPS | Bahn');
  assert.deepEqual(l.map((x) => x.name), ['Wand', 'Abdichtung', 'Perimeterplatte XPS', 'Bahn']);
  assert.deepEqual(l.map((x) => x.gefuehrt), [false, false, true, true]);
  assert.deepEqual(schichten(''), []);
  assert.deepEqual(schichten(undefined), []);
  assert.deepEqual(schichten('  Eine  |  '), [{ name: 'Eine', gefuehrt: true }]);
});

test('jede Lage bekommt ein Band, jede fremde Lage die Schraffur', () => {
  const svg = schichtbild('A (fremd) | B | C');
  assert.equal((svg.match(/<rect /g) ?? []).length, 3, 'ein Band je Lage');
  assert.equal((svg.match(/url\(#fremdraster\)/g) ?? []).length, 1, 'nur die fremde Lage schraffiert');
  assert.equal((svg.match(/nicht von uns/g) ?? []).length, 1);
  assert.equal(schichtbild(''), '', 'ohne Lagen kein Bild');
});

test('wer das Bild nicht sieht, erfährt dasselbe', () => {
  // Ein Schema, dessen Aussage nur in der Zeichnung steht, ist für einen Teil
  // der Leser gar nicht da — und für jedes Sprachmodell, das die Seite liest,
  // ebenso wenig.
  const svg = schichtbild('Wand (fremd) | Platte');
  const label = /aria-label="([^"]+)"/.exec(svg)[1];
  assert.match(label, /von innen nach außen/);
  assert.match(label, /Wand — nicht aus diesem Shop/);
  assert.match(label, /Platte/);
  assert.doesNotMatch(label.replace('Wand — nicht aus diesem Shop', ''), /nicht aus diesem Shop/);
});

test('Bild und Text einer Systemliste nennen dieselben fremden Lagen', () => {
  // Die Zeichnung darf nichts behaupten, was auf der Seite nicht steht — und
  // umgekehrt darf die Seite die Lücke nicht nur im Bild zugeben.
  //
  // pruefung: begruendet — die **innere** Schleife läuft über die fremden
  // Lagen, und ein Bauteil ganz ohne fremde Lage ist erlaubt (dann gibt es
  // nichts abzugleichen). Dass überhaupt Listen geprüft wurden, sichert
  // `dateien.length >= 4` und der Zähler `geprueft` am Ende zu.
  const ordner = fileURLToPath(new URL('../inhalte/system', import.meta.url));
  const dateien = readdirSync(ordner).filter((d) => d.endsWith('.md'));
  assert.ok(dateien.length >= 4, `nur ${dateien.length} Systemlisten gefunden`);
  let geprueft = 0;
  for (const datei of dateien) {
    const roh = readFileSync(join(ordner, datei), 'utf8');
    const { kopf, koerper } = lesKopf(roh);
    const lagen = schichten(kopf.schichten);
    if (!lagen.length) continue;
    geprueft++;
    for (const lage of lagen.filter((l) => !l.gefuehrt)) {
      assert.ok(koerper.includes(lage.name),
        `${datei}: „${lage.name}" ist im Bild als fremd markiert, kommt im Text aber nicht vor`);
    }
  }
  assert.ok(geprueft >= 2, `nur ${geprueft} Systemlisten mit Schichtenbild`);
});
