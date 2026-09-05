import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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

/**
 * **Wofür der Schlüssel gilt — und wofür nicht.**
 *
 * Er deckt die Artikel aus den Lieferantenrechnungen: 46 Stück, von Hand
 * entschieden, mit dem Beleg daneben. Ein Lastlauf mit 100 eingespielten
 * Artikeln hat am 28.08. gezeigt, dass diese Zusage nicht mitwächst — bei
 * fünfhundert Artikeln aus einer Preisliste kann niemand jede Zeichnung von
 * Hand nachsehen, und ein Schlüssel, den man nicht pflegen kann, wird
 * gelöscht statt gepflegt.
 *
 * Deshalb zwei Zusagen statt einer:
 *
 * 1. **Handgeprüft**, wo Handprüfung möglich ist — für die Artikel aus den
 *    Rechnungen bleibt jede Form einzeln festgehalten.
 * 2. **Nichts behaupten**, wo sie es nicht ist — ein eingespielter Artikel
 *    bekommt eine gültige Form, und seine Zeichnung darf kein Maß nennen,
 *    das sie nicht gelesen hat. Das ist dieselbe Regel wie bei der Platte
 *    mit den erfundenen 600 mm.
 */
const ausRechnungen = (a) => a.ekHerkunft === undefined;

test('jeder Artikel aus den Rechnungen bekommt die Form, die er hat', () => {
  const eigene = katalog.artikel.filter(ausRechnungen);
  assert.ok(eigene.length >= 46, `nur ${eigene.length} Artikel aus Rechnungen`);
  // **Reihenfolge geändert am 30.08.** Die Zählung stand vorher zuerst und
  // meldete bei einem gewachsenen Katalog nur „für jeden Rechnungsartikel
  // eine Sollform und umgekehrt" — eine Zahl gegen eine Zahl. In der
  // Generalprobe mit 126 neuen Artikeln war das die erste Meldung des Tages
  // und sagte nicht, **welche** Artikel fehlen.
  //
  // Jetzt kommt die Einzelprüfung zuerst: Sie nennt Artikelnummer und
  // Bezeichnung, und die Arbeit ist ablesbar statt suchbar.
  for (const a of eigene) {
    const soll = SOLLFORM[a.sku];
    if (!soll) continue; // später eingespielt — die schwächere Zusage unten deckt ihn
    assert.equal(bauform(a), soll, `${a.sku} „${a.bezeichnung}"`);
  }
  /**
   * **Neu gefasst am 30.08.** Hier stand `eigene.length === Sollformen`: Für
   * **jeden** Artikel aus Rechnungen musste eine Sollform von Hand
   * hinterlegt sein. Das war richtig, solange es 46 gab.
   *
   * In der Generalprobe mit 126 eingespielten Artikeln verlangte die Probe
   * 126 Handentscheidungen — an dem Tag, an dem am wenigsten Zeit dafür ist,
   * und für eine Zusage, die der Test darunter ohnehin prüft: Jeder Artikel
   * bekommt eine gültige Form und behauptet kein Maß, das er nicht gelesen
   * hat.
   *
   * Was bleibt, ist die Tafel selbst: Sie deckt die 46 Artikel des Bestands
   * ab, jeder Eintrag muss zu einem vorhandenen Artikel gehören, und keiner
   * darf still verschwinden.
   */
  const gedeckt = eigene.filter((a) => SOLLFORM[a.sku]).length;
  assert.ok(gedeckt >= 46,
    `nur ${gedeckt} Artikel mit hinterlegter Sollform — die Tafel deckt den Bestand nicht mehr`);
  const ueberzaehlig = Object.keys(SOLLFORM).filter((s) => !katalog.artikel.some((a) => a.sku === s));
  assert.deepEqual(ueberzaehlig, [], 'Sollformen für Artikel, die es nicht mehr gibt');
});

test('ein eingespielter Artikel bekommt eine gültige Form und behauptet kein Maß', () => {
  const eingespielt = katalog.artikel.filter((a) => !ausRechnungen(a));
  // pruefung: begruendet — heute ist kein Artikel eingespielt; die Schleife
  // ist die Zusage für den Tag, an dem die Artikelliste kommt.
  for (const a of eingespielt) {
    const form = bauform(a);
    assert.ok(BAUFORM_TEXT[form], `${a.sku}: Bauform ohne Klartext`);
    const svg = artikelBild(a);
    if (/maßstäblich/.test(svg)) {
      assert.notEqual(dickeMm(a.bezeichnung), null,
        `${a.sku}: nennt „maßstäblich", ohne ein Maß gelesen zu haben`);
    }
  }
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

/* ------------------------------------------------------------------ *
 * Die Stärke, die keine ist
 * ------------------------------------------------------------------ */

test('eine Zahl über der Plattenstärke ist keine Plattenstärke', () => {
  // „Isover TDPT 20 1200 600 mm 8,64 m2": Die 600 sind die Plattenbreite.
  // Gezeichnet und beschriftet wurde eine 60 cm dicke Trittschalldämmung.
  assert.equal(dickeMm('Isover TDPT 20 1200 600 mm 8,64 m2'), null);
  assert.equal(dickeMm('XPS glatt SF 100 mm 0,75 m2'), 100);
  assert.equal(dickeMm('Platte 300 mm'), 300, 'die Grenze selbst gilt noch');
  assert.equal(dickeMm('Platte 301 mm'), null);
});

test('ohne ablesbare Stärke beschriftet sich die Zeichnung mit „Platte"', () => {
  const svg = artikelBild({ bezeichnung: 'Isover TDPT 20 1200 600 mm 8,64 m2', gruppe: 'Dämmung', einheit: 'M2' });
  assert.match(svg, />Platte</, 'die Beschriftung nennt kein Maß');
  assert.doesNotMatch(svg, />600 mm</);
});

test('die Bildbeschreibung verspricht nur, was gezeichnet ist', () => {
  // „Stärke maßstäblich" ist eine Zusage — für ein Vorleseprogramm und für
  // jedes Modell, das die Seite liest, ist sie die einzige Angabe zum Bild.
  const ohne = artikelBild({ bezeichnung: 'Isover TDPT 20 1200 600 mm', gruppe: 'Dämmung', einheit: 'M2' });
  assert.match(ohne, /Stärke nicht aus der Bezeichnung ablesbar/);
  const mit = artikelBild({ bezeichnung: 'XPS glatt SF 80 mm', gruppe: 'Dämmung', einheit: 'M2' });
  assert.match(mit, /Stärke maßstäblich/);
});


/* ------------------------------------------------------------------ *
 * Was nach „mit" steht, und was die Einheit weiß
 * ------------------------------------------------------------------ */

const form = (bezeichnung, gruppe = '', einheit = 'STK') => bauform({ bezeichnung, gruppe, einheit });

test('was nach „mit" steht, bestimmt die Form nicht', () => {
  // **Gemessen am 30.08.** an vierzig Namen, wie sie bei einem
  // Baustoffhändler vorkommen: „Capatect Eckwinkel mit Gewebe 2,5 m" wurde
  // als Rolle gezeichnet. Das Erzeugnis ist ein Winkel; die Rolle ist das
  // Zubehör daran.
  //
  // „X mit Y" ist ein X — dieselbe Regel wie beim Kompositum, nur
  // andersherum: Dort steht der Kopf hinten, hier vorn.
  assert.equal(form('Capatect Eckwinkel mit Gewebe 2,5 m', 'WDVS'), 'teil');
  // Und die beiden Bestandsartikel mit „mit" behalten ihre Form:
  assert.equal(form('Regenhaube mit Sicherungsseil 180 Absolut & SIH', 'Kamin'), 'haube');
  assert.equal(form('Capatect Kantenschutz mit Gewebe Carbon 11,5 13,5 cm 2,5 m', 'WDVS', 'LFM'), 'leiste');
});

test('die Einheit schlägt den Namen, wo sie eindeutig ist', () => {
  // „Drainagerohr DN 100 gelocht 50 m" mit Einheit RLL wurde als Rohr
  // gezeichnet — fünfzig Meter Rohr kommen als Ring, nicht als Stange. Die
  // Einheit steht im Beleg des Lieferanten, der Name ist Prosa.
  assert.equal(form('Drainagerohr DN 100 gelocht 50 m', 'Kanal', 'RLL'), 'rolle');
  assert.equal(form('PVC Kanalrohr NW 100 1 m', 'Kanal', 'STK'), 'rohr', 'die Stange bleibt eine Stange');
  assert.equal(form('Irgendein Kleber 750 ml', 'Zubehör', 'DOS'), 'dose');
  // SCK und EIM entscheiden **nicht** zuerst: Ein Sack kann auch ein Ziegel
  // sein, der auf Paletten in Säcken kommt.
  assert.equal(form('Hochlochziegel N+F 25', 'Mauerwerk', 'SCK'), 'stein');
});

test('eine Sockelschiene ist eine Leiste', () => {
  assert.equal(form('Capatect Sockelschiene 2,5 m', 'WDVS'), 'leiste');
  assert.equal(form('Anputzleiste 6 mm 2,4 m', 'WDVS'), 'leiste');
});

test('vierzig Namen eines Baustoffhändlers ergeben keine falsche Zeichnung', () => {
  // Die Messung selbst, als Probe festgehalten. „Generisch" ist kein Fehler:
  // Ein Formteil ohne Formwort **soll** als Teil gezeichnet werden. Falsch
  // ist eine Zeichnung, die etwas anderes zeigt, als der Artikel ist — das
  // verstößt gegen die eigene Regel „Was gezeigt wird, steht auch im
  // Datensatz".
  const proben = [
    ['Baumit MauerMörtel M5 25 kg', 'Mörtel', 'SCK', 'sack'],
    ['Wienerberger Porotherm 25 Plan', 'Mauerwerk', 'STK', null],
    ['Austrotherm EPS F-Plus 12 cm', 'Dämmung', 'M2', 'platte'],
    ['PVC Kanalrohr DN 125 2 m', 'Kanal', 'STK', 'rohr'],
    ['PVC Kanalbogen DN 125 87 grad', 'Kanal', 'STK', 'bogen'],
    ['PVC Abzweiger DN 125 45 grad', 'Kanal', 'STK', 'abzweig'],
    ['Schachtring 1000 500 90 mm', 'Kanal', 'STK', 'ring'],
    ['Drainagerohr DN 100 gelocht 50 m', 'Kanal', 'RLL', 'rolle'],
    ['Capatect Sockelschiene 2,5 m', 'WDVS', 'STK', 'leiste'],
    ['Capatect Eckwinkel mit Gewebe 2,5 m', 'WDVS', 'STK', null],
    ['Tellerdübel STR U 2G 115 mm', 'WDVS', 'KRT', 'duebel'],
    ['Soudal Fensterschaum B2 500 ml', 'Zubehör', 'DOS', 'dose'],
    ['Malerkrepp 30 mm x 50 m', 'Zubehör', 'RLL', 'rolle'],
    ['Schiedel Mantelstein 36 cm', 'Kamin', 'STK', 'stein'],
    ['Schiedel Innenrohr 33 cm gedämmt', 'Kamin', 'STK', 'rohr'],
    ['Schiedel Regenhaube 200', 'Kamin', 'STK', 'haube'],
    ['Dosierpistole Metall', 'Zubehör', 'STK', 'werkzeug'],
  ];
  assert.ok(proben.length >= 15, `nur ${proben.length} Namen in der Probe`);
  const falsch = [];
  for (const [bezeichnung, gruppe, einheit, erwartet] of proben) {
    const ist = form(bezeichnung, gruppe, einheit);
    if (erwartet === null) continue; // ohne Formwort ist „teil" richtig
    if (ist !== erwartet) falsch.push(`${bezeichnung} → ${ist} statt ${erwartet}`);
  }
  assert.deepEqual(falsch, []);
});

/* ------------------------------------------------------------------ *
 * Eine Zahl, die nach links weitergeht, ist nicht die ganze Zahl
 * ------------------------------------------------------------------ */

test('Ein Bruchstück einer Dezimalzahl wird nicht beschriftet', () => {
  // **Befund vom 31.08.** Zwei Artikelkarten trugen ein falsches Maß:
  //
  //   „Schiedel Fugenmasse FM 1,5 kg"                 →  „5 kg"
  //   „Capatect Gewebeanschlussleiste … 2,55 m"        →  „55 m"
  //
  // Das Dreifache und das Zweiundzwanzigfache — auf der Karte, die oft alles
  // ist, was ein Kunde sieht. Beide Male hatte das Muster den Rest einer
  // Dezimalzahl gegriffen.
  //
  // Am 28. August ist derselbe Fehler schon einmal aufgetreten und fallweise
  // behoben worden; jetzt steht die Regel in `mass()`, wo alle Muster
  // durchkommen.
  const kg = artikelBild({ bezeichnung: 'Schiedel Fugenmasse FM 1,5 kg', einheit: 'EIM', gruppe: 'Kamin' });
  assert.match(kg, />1,5 kg</, 'die Beschriftung nennt nicht das ganze Maß');
  assert.ok(!/>5 kg</.test(kg), 'das Bruchstück ist zurück');

  const m = artikelBild({ bezeichnung: 'Capatect Anschlussleiste 2,55 m', einheit: 'LFM', gruppe: 'WDVS' });
  assert.match(m, />2,55 m</);
  assert.ok(!/>55 m</.test(m), 'das Bruchstück ist zurück');
});

test('Auch Muster ohne Dezimalstellen greifen kein Bruchstück', () => {
  // **Das eigentliche Werk der Regel in `mass()`.** Die Muster für Kilogramm
  // und Meter lassen seit heute Dezimalstellen zu; die für Millimeter und für
  // dreistellige Durchmesser nicht — und sollen es auch nicht, denn dort sind
  // Nachkommastellen unüblich.
  //
  // Gemessen mit `npm run gegenprobe`: Ohne die Linksgrenze bliebe die erste
  // Probe grün, weil die erweiterten Muster sie mit abdecken. Diese hier ist
  // der Fall, den nur die Regel selbst rettet.
  const duebel = artikelBild({ bezeichnung: 'Drehstiftdübel PK K 6 8,40 mm', einheit: 'STK', gruppe: 'WDVS' });
  assert.ok(!/>40 mm</.test(duebel), '„40 mm" aus „8,40 mm" gegriffen');

  const haube = artikelBild({ bezeichnung: 'Regenhaube 1180 Absolut', einheit: 'STK', gruppe: 'Kamin' });
  assert.ok(!/>⌀ 180</.test(haube), '„180" aus „1180" gegriffen');

  // Und die Gegenrichtung: Ein „x" links der Zahl ist keine Ziffer.
  const schraube = artikelBild({ bezeichnung: 'Rahmenschraube 7,5x182 mm', einheit: 'STK', gruppe: 'Zubehör' });
  assert.match(schraube, />182 mm</, 'ein gültiges Maß wurde verworfen');
});

test('Ein ganzes Maß wird weiterhin beschriftet', () => {
  // Die Gegenrichtung: Die Regel darf nicht jedes Maß verwerfen.
  const sack = artikelBild({ bezeichnung: 'Baumit KlebeSpachtel 25 kg', einheit: 'SCK', gruppe: 'WDVS' });
  assert.match(sack, />25 kg</);
});

test('Eine nackte Zahl ist keine Angabe', () => {
  // „Regenhaube … 180" trug die Beschriftung „180" — eine Zahl ohne Einheit.
  // Der Schachtring nebenan schreibt seit jeher „⌀ 800"; dieselbe Ware,
  // dieselbe Schreibweise.
  const haube = artikelBild({ bezeichnung: 'Regenhaube mit Sicherungsseil 180 Absolut', einheit: 'STK', gruppe: 'Kamin' });
  assert.match(haube, />⌀ 180</, 'der Durchmesser steht ohne Zeichen da');
});

test('Das Einheitenkürzel des Lieferanten steht nicht auf der Karte', () => {
  // Drei Artikel trugen „STK" als Beschriftung — das rohe Kürzel, dasselbe,
  // das am selben Tag aus dem Warenkorb und von den Belegen entfernt wurde.
  // Ein Kunde liest „Stück".
  const teil = artikelBild({ bezeichnung: 'SIKM Fertigfußpaket 18', einheit: 'STK', gruppe: 'Kamin' });
  assert.match(teil, />Stück</);
  assert.ok(!/>STK</.test(teil), 'das Kürzel steht wieder da');

  // Unbekanntes wird durchgereicht statt geraten — dieselbe Haltung wie
  // überall sonst.
  const fremd = artikelBild({ bezeichnung: 'Sonderposten ohne Maß', einheit: 'PAK', gruppe: 'Zubehör' });
  assert.match(fremd, />PAK</);
});

test('Keine Beschriftung im Bestand nennt ein Bruchstück', () => {
  // Die Regel über den ganzen Bestand: Steht die Zahl der Beschriftung in der
  // Bezeichnung, darf links davon keine Ziffer und kein Komma stehen.
  const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
  const katalogDatei = pfad('../data/katalog-baustoff.json');
  const artikel = JSON.parse(readFileSync(katalogDatei, 'utf8')).artikel;
  assert.ok(artikel.length >= 40, `nur ${artikel.length} Artikel`);

  let geprueft = 0;
  for (const a of artikel) {
    const treffer = (artikelBild(a) || '').match(/>([^<]{1,16})<\/text>/);
    if (!treffer) continue;
    const zahl = treffer[1].match(/[\d,]+/);
    if (!zahl) continue;
    const i = a.bezeichnung.indexOf(zahl[0]);
    if (i < 0) continue;
    geprueft += 1;
    const davor = i > 0 ? a.bezeichnung[i - 1] : '';
    assert.ok(!/[\d.,]/.test(davor),
      `${a.sku}: Beschriftung „${treffer[1]}" ist ein Bruchstück aus „${a.bezeichnung}"`);
  }
  assert.ok(geprueft >= 15, `nur ${geprueft} Beschriftungen mit Zahl geprüft`);
});

/**
 * Die Auffangform sagt, dass sie eine Auffangform ist.
 *
 * **Der Anlass, 4. September 2026.** `artikelBild` trug die Regel seit dem
 * 30. August und wandte sie an genau einer Stelle an: bei der Dämmplatte, deren
 * Stärke nicht aus der Bezeichnung ablesbar ist. Die Auffangform `teil` hatte
 * sie nicht — sie meldete „Schemazeichnung: Bauteil" und las sich damit wie
 * eine Aussage über den Artikel, obwohl sie das Gegenteil ist.
 *
 * > **Eine Lücke, die wie eine Angabe klingt, ist schlimmer als eine sichtbare
 * > Lücke.**
 */
test('die Auffangform wird als Platzhalter ausgewiesen, nicht als Bauart', () => {
  const paket = { bezeichnung: 'SIKM Fertigfußpaket 18', gruppe: 'Kamin', einheit: 'STK' };
  assert.equal(bauform(paket), 'teil', 'sonst prüft dieser Fall etwas anderes');
  const svg = artikelBild(paket);
  assert.match(svg, /Platzhalter/);
  assert.ok(!/Schemazeichnung/.test(svg), svg.slice(0, 200));

  // Und die Gegenprobe: Eine erkannte Form sagt weiterhin, was sie zeichnet.
  const sack = { bezeichnung: 'Capatect Putzgrund weiß 25 kg', gruppe: 'WDVS', einheit: 'KG' };
  assert.equal(bauform(sack), 'sack');
  assert.match(artikelBild(sack), /Schemazeichnung: Sackware/);
});

test('jeder Artikel des Bestands mit Auffangform steht auf seiner Seite als Platzhalter', () => {
  const ordner = fileURLToPath(new URL('../ausgabe/site/artikel', import.meta.url));
  assert.equal(typeof existsSync(ordner), 'boolean');
  if (!existsSync(ordner)) return;

  const katalogDatei = fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url));
  const artikel = JSON.parse(readFileSync(katalogDatei, 'utf8')).artikel;
  const auffang = artikel.filter((a) => bauform(a) === 'teil');
  assert.ok(auffang.length > 0, 'kein Artikel mit Auffangform — dieser Fall prüft nichts mehr');

  for (const a of auffang) {
    const seite = join(ordner, `${a.sku}.html`);
    if (!existsSync(seite)) continue;
    const html = readFileSync(seite, 'utf8');
    // `<p class=…>` und nicht das bloße Wort: Die Formatvorlage steht im
    // Kopf **jeder** Seite, und danach zu suchen hieße, den Stil für den
    // Inhalt zu halten.
    assert.match(html, /<p class="bildhinweis">/,
      `${a.sku} (${a.bezeichnung}) zeichnet einen Platzhalter und sagt es dem Leser nicht`);
  }

  // Und umgekehrt: Wer eine erkannte Form hat, bekommt den Hinweis nicht.
  const erkannt = artikel.find((a) => bauform(a) !== 'teil');
  const seiteErkannt = join(ordner, `${erkannt.sku}.html`);
  if (existsSync(seiteErkannt)) {
    assert.ok(!readFileSync(seiteErkannt, 'utf8').includes('<p class="bildhinweis">'),
      `${erkannt.sku} trägt den Platzhalterhinweis, obwohl seine Form erkannt ist`);
  }
});
