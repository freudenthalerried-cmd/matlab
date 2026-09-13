/**
 * Woher wir wissen wollen, welche Ware auf der Palette kommt.
 *
 * **Der Anlass, 5. September 2026.** Auf der Seite des PVC-Kanalbogens stehen
 * „Gewicht 0,285 kg je Stück, aus dem Lieferschein" und „Palettierte Ware. Sie
 * wird mit dem Kran entladen" übereinander — seit es die Seite gibt.
 *
 * > **Ein Bogen von 285 Gramm, mit dem Kran entladen.** Beide Angaben stehen
 * > auf derselben Seite; nebeneinandergehalten hat sie nie jemand.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  SPERRGUT_GRUPPEN, HANDGEWICHT_KG, HINGENOMMEN, OHNE_HERKUNFT,
  sperrgutAusGruppe, einstufungsbefund, flaechenbefund,
  gruppentextbefund,
  blockquellenbefund,
} from '../src/sperrguteinstufung.js';

const katalog = JSON.parse(readFileSync(new URL('../data/katalog-baustoff.json', import.meta.url), 'utf8'));

test('die Warengruppe entscheidet, und sonst nichts', () => {
  assert.equal(SPERRGUT_GRUPPEN.length, 4);
  for (const g of SPERRGUT_GRUPPEN) assert.equal(sperrgutAusGruppe(g), true, g);
  for (const g of ['WDVS', 'Mörtel', 'Zubehör', '', undefined]) {
    assert.equal(sperrgutAusGruppe(g), false, String(g));
  }
});

/**
 * Die Liste stand bis heute zweimal: hier und als eigenes `Set` in
 * `bin/katalog-aus-rechnungen.mjs`. Zwei Listen für dieselbe Sache sind
 * heute gleich und morgen vielleicht nicht.
 */
test('es gibt sie nur einmal — auch für den Einleser', async () => {
  const quelle = readFileSync(new URL('../bin/katalog-aus-rechnungen.mjs', import.meta.url), 'utf8');
  assert.ok(!/SPERRGUT_GRUPPEN\s*=\s*new Set/.test(quelle), 'zweite Fassung derselben vier Namen');
  assert.match(quelle, /sperrgutAusGruppe/);
});

test('der Bestand widerspricht sich in fünf Fällen, und jeder trägt seinen Grund', () => {
  // **Vier waren es bis zum 5. September, mittags.** Gemessen wurde gegen
  // `gewichtKg`, und das Feld heißt bei Kiloware „je Kilogramm": Zwei Artikel
  // trugen dort eine 1, fünf weitere gar nichts, obwohl ihr Sackgewicht im
  // Namen steht. Mit `packungsgewichtKg` sind es 12 belegte Gewichte statt 7
  // — und der fünfte Widerspruch ist ein Eimer Fugenmasse zu 1,5 kg, der seit
  // jeher als Sperrgut geführt wird, weil er in der Kamingruppe steht.
  const b = einstufungsbefund(katalog.artikel);
  assert.equal(b.artikel, 46);
  assert.equal(b.mitGewicht, 12, 'weniger hieße, das Packungsgewicht wird wieder nicht gerechnet');
  assert.equal(b.widersprueche, 5);
  assert.equal(b.gedeckt, 5, 'gemessen, nicht die Länge des Verzeichnisses');
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  // Die Zahl, die den Anlass trägt: keine einzige Einstufung ist belegt.
  assert.equal(b.unbelegt, 46);
});

test('die sechs Säcke zu genau 25 kg sind kein Widerspruch', () => {
  // **Die Grenze wurde entschieden, bevor feststand, wem sie nützt.** Der
  // Kommentar über `HANDGEWICHT_KG` nennt 25 kg *die übliche Obergrenze für
  // das Heben durch eine Person* und *das gängige Sackgewicht* — ein
  // 25-kg-Sack ist damit der Regelfall des Tragens. Verglichen wurde
  // trotzdem mit `>=`; unsichtbar blieb es nur, weil vor heute kein Artikel
  // je 25 kg erreichte.
  const saecke = katalog.artikel.filter((a) => /(^|\D)25\s?kg/i.test(a.bezeichnung) && !a.sperrgut);
  assert.equal(saecke.length, 6, 'die Vorbedingung des Testfalls');
  const b = einstufungsbefund(saecke, []);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.mitGewicht, 6, 'gewogen sind sie sehr wohl — nur widersprechen sie nicht');
});

test('jeder hingenommene Fall trägt einen tragfähigen Grund', () => {
  assert.ok(HINGENOMMEN.length > 0, 'eine leere Liste bestünde jede Prüfung');
  for (const h of HINGENOMMEN) {
    assert.ok(h.warum.length >= 200, `${h.sku}: Begründung zu kurz`);
    assert.ok(h.kurz, `${h.sku}: ohne kurze Fassung ist die Ausgabe unlesbar`);
  }
});

/* ------------------------------------------------------------------ *
 * Die Regeln einzeln
 * ------------------------------------------------------------------ */

const artikel = (x) => ({
  sku: 'A-1', gruppe: 'Kanal', einheit: 'STK', bezeichnung: 'Probe', sperrgut: true, ...x,
});

test('leichte Ware mit Kranentladung fällt auf', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 0.285 })], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['leicht-und-sperrgut']);
  assert.match(b.meldungen[0].text, /0\.285 kg/);
});

test('schwere Ware ohne Kranentladung auch', () => {
  const b = einstufungsbefund([artikel({ gruppe: 'Mörtel', sperrgut: false, gewichtKg: 40 })], []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['schwer-und-frei']);
});

test('genau auf der Grenze wird nicht geurteilt', () => {
  // **Umgekehrt seit dem 5. September.** Hier stand „Genau auf der Grenze
  // gilt sie als schwer" — im Widerspruch zum Kommentar der Konstante, die
  // 25 kg als das gängige Sackgewicht und die Obergrenze des Tragens
  // beschreibt. Ein Sack, der genau so viel wiegt, wie ein Mensch trägt, ist
  // kein Fall für den Kran.
  const frei = (kg) => artikel({ gruppe: 'Mörtel', sperrgut: false, gewichtKg: kg });
  assert.equal(einstufungsbefund([frei(HANDGEWICHT_KG)], []).meldungen.length, 0);
  assert.equal(einstufungsbefund([frei(HANDGEWICHT_KG + 1)], []).meldungen.length, 1);
  assert.equal(einstufungsbefund([frei(HANDGEWICHT_KG - 1)], []).meldungen.length, 0);
  assert.equal(einstufungsbefund([artikel({ sperrgut: true, gewichtKg: HANDGEWICHT_KG })], []).meldungen.length, 0);
});

test('ohne belegtes Gewicht gibt es kein Urteil', () => {
  const b = einstufungsbefund([artikel({}), artikel({ sku: 'A-2', gewichtKg: null })], []);
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.mitGewicht, 0);
});

test('eine gespeicherte Einstufung, die der eigenen Regel widerspricht', () => {
  const b = einstufungsbefund([artikel({ gruppe: 'WDVS', sperrgut: true })], []);
  assert.ok(b.meldungen.some((m) => m.regel === 'gruppe-widerspricht'));
});

test('ein Grund ohne Widerspruch bleibt nicht stehen', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 30 })], [{ sku: 'A-1', warum: 'x'.repeat(120) }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-ohne-widerspruch'));
});

test('ein Grund für einen Artikel, den es nicht gibt', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 0.3 })], [
    { sku: 'A-1', warum: 'x'.repeat(120) },
    { sku: 'GIBTESNICHT', warum: 'y'.repeat(120) },
  ]);
  assert.ok(b.meldungen.some((m) => m.regel === 'eintrag-ohne-artikel'));
});

test('ein zu dünner Grund zählt nicht als Grund', () => {
  const b = einstufungsbefund([artikel({ gewichtKg: 0.3 })], [{ sku: 'A-1', warum: 'ist halt so' }]);
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-zu-duenn'));
});

/* ------------------------------------------------------------------ *
 * Was die Seite dem Kunden sagt
 * ------------------------------------------------------------------ */

test('die Artikelseite nennt die Herkunft der Einstufung', async () => {
  const { existsSync } = await import('node:fs');
  const pfad = new URL('../ausgabe/site/artikel/POS-10115.html', import.meta.url);
  if (!existsSync(pfad)) return; // pruefung: begruendet — ohne Bau gibt es nichts zu lesen
  const html = readFileSync(pfad, 'utf8');
  assert.match(html, /Einstufung als palettierte Ware stammt aus der/);
  assert.match(html, /Warengruppe Kanal<\/strong> und nicht aus einer Angabe des Lieferanten/);
  // Und der Widerspruch steht dabei, nicht nur die Herkunft.
  assert.match(html, /wiegt 0,285 kg je Stück/);
});

/* ------------------------------------------------------------------ *
 * Wo der Kunde davon liest — ergänzt am 5. September, morgens
 *
 * **Der Befund.** Die Artikelseite nennt die Herkunft der Einstufung seit dem
 * Vortag. `llms.txt` sagte weiter nur „· palettiert", das Kassenbündel
 * „palettiert, Kranentladung je Hub".
 *
 * > **Eine Auskunft, die an einer Stelle qualifiziert ist und an der
 * > maschinenlesbaren blank steht, wird von Assistenten als Tatsache
 * > weitergegeben.**
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * Gesucht, nicht aufgezählt — 5. September, abends
 *
 * Die erste Fassung führte ein Verzeichnis von **zwei** Dateien, und der
 * Bericht meldete darüber „Gebaute Flächen mit dem Wort 2". Gemessen sind es
 * **31** unter `ausgabe/site/`.
 *
 * > **Der Prüfer, der zählt, wie viele Flächen er geprüft hat, zählte sein
 * > eigenes Register.**
 *
 * Und warum es genau zwei waren: `HERKUNFTSMUSTER` suchte im rohen
 * Dateiinhalt. Auf der Artikelseite steht die Auskunft als
 * `aus der\n<strong>Warengruppe Dämmung</strong>` — Umbruch und Marke
 * dazwischen, das Muster trifft nicht. Über die 25 Artikelseiten hätte diese
 * Fassung 25 Fehlmeldungen erzeugt.
 * ------------------------------------------------------------------ */

/** Eine Sammlung, wie das Werkzeug sie liefert. */
const sammlung = (...dateien) => () => dateien.map(([datei, inhalt]) => ({ datei, inhalt }));
/** Genug Flächen, damit die Untergrenze nicht dazwischenfunkt. */
const fuellung = (n, inhalt) => Array.from({ length: n }, (_, i) => [`site/f${i}.html`, inhalt]);
const mitHerkunft = 'palettiert — die Angabe folgt aus der Warengruppe.';

test('die Flächen werden gesucht, nicht aufgezählt', () => {
  const b = flaechenbefund(sammlung(...fuellung(25, mitHerkunft), ['site/ohne.html', 'Nur Preise.']), []);
  assert.equal(b.flaechen, 25, 'die Datei ohne das Wort zählt nicht mit');
  assert.equal(b.mitHerkunft, 25);
  assert.deepEqual(b.meldungen, []);
});

test('die Herkunft wird im Text gesucht, nicht im Markup', () => {
  // Der Grund, warum das Verzeichnis genau die zwei Textdateien führte.
  const html = 'Ware <em>palettiert</em>. Die Einstufung stammt aus der\n<strong>Warengruppe Kanal</strong>.';
  const b = flaechenbefund(sammlung(...fuellung(20, html)), []);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
});

test('eine Fläche, die die Kranentladung nennt und ihre Herkunft nicht', () => {
  const b = flaechenbefund(sammlung(...fuellung(20, 'Zustellung inkl. Kranentladung je Hub.')), []);
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.some((m) => m.regel === 'einstufung-ohne-herkunft'));
});

test('eine Fläche ohne das Wort wird nicht behelligt', () => {
  // Nicht jede gebaute Datei muss davon reden. Ein Prüfer, der das verlangte,
  // erzwänge den Satz an Stellen, an denen er nichts zu suchen hat.
  const b = flaechenbefund(sammlung(['site/a.html', 'Nur Preise und Lieferzeiten.']), [], 0);
  assert.equal(b.sauber, true);
  assert.equal(b.flaechen, 0);
});

test('ein leerer Lauf ist kein grüner', () => {
  // Fände die Sammlung nichts — nicht gebaut, Pfad verschoben —, meldete die
  // Prüfung „sauber" über null Dateien.
  const b = flaechenbefund(sammlung(), []);
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-flaechen'));
});

test('eine Ausnahme deckt ihre Fläche und wird gegengehalten', () => {
  const ausnahme = [{ datei: 'site/wissen/x.html', warum: 'w'.repeat(90) }];
  const b = flaechenbefund(sammlung(...fuellung(20, mitHerkunft),
    ['site/wissen/x.html', 'Kranentladung als Beispiel.']), ausnahme);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.equal(b.hingenommen, 1);

  // Die Rückrichtung: Eine Ausnahme, deren Fläche das Wort nicht mehr trägt,
  // ist eine Erlaubnis für etwas, das niemand mehr tut.
  const leer = flaechenbefund(sammlung(...fuellung(20, mitHerkunft)), ausnahme);
  assert.ok(leer.meldungen.some((m) => m.regel === 'ausnahme-ohne-fall'));
});

test('jede geführte Ausnahme trägt einen tragfähigen Grund', () => {
  assert.ok(OHNE_HERKUNFT.length >= 1, 'ein leeres Verzeichnis bestünde jede Prüfung');
  for (const o of OHNE_HERKUNFT) {
    assert.ok(o.datei, 'eine Ausnahme ohne Datei lässt sich nicht halten');
    assert.ok(o.warum.length >= 80, `${o.datei}: Begründung zu kurz`);
  }
});

/**
 * Und der Satz an der Frachtzeile: Er stand bis heute zweimal im Bestand,
 * gehalten von einer Probe. Jetzt steht er einmal — und sagt, **welche** der
 * beiden Schätzungen gemeint ist.
 */
test('der Frachtsatz nennt beide Schätzungen getrennt', async () => {
  const { frachtGrundText } = await import('../src/frachttext.js');
  assert.equal(frachtGrundText(0), 'Pauschale');
  const drei = frachtGrundText(3);
  assert.match(drei, /3× Kranentladung/);
  assert.match(drei, /je Sperrgut-Position/, 'die Zahl der Hübe ist geschätzt');
  assert.match(drei, /aus der Warengruppe/, 'und die Einstufung selbst auch');
  // Ein Sonderfall, den der alte Ausdruck mit `> 0` schon richtig traf und der
  // beim Verlegen leicht verlorengeht.
  assert.equal(frachtGrundText(null), 'Pauschale');
  assert.equal(frachtGrundText(undefined), 'Pauschale');
});

// **Ergänzt am 9. September 2026.** `moertel.md` sagte der Kundschaft unter
// „Bestellhinweis": „Mörtel wird palettenweise geliefert." Alle drei
// Mörtelartikel sind `sperrgut: false` — kein Kranhub, sackweiser Verkauf.
// Die eine Gruppenseite mit der stärksten Palettenaussage war die einzige
// Gruppe, in der kein Artikel als palettiert gilt.
test('eine Lieferzusage ohne einen einzigen palettierten Artikel ist ein Befund', () => {
  const b = gruppentextbefund([
    { gruppe: 'Mörtel', text: 'Mörtel wird palettenweise geliefert.', artikel: [{ sperrgut: false }, { sperrgut: false }] },
  ]);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'lieferaussage-ohne-einstufung');
  assert.match(b.meldungen[0].text, /keiner der 2 Artikel/);
});

test('dieselbe Zusage mit einem palettierten Artikel meldet nichts', () => {
  const b = gruppentextbefund([
    { gruppe: 'Mauerwerk', text: 'Wird palettenweise geliefert.', artikel: [{ sperrgut: true }] },
  ]);
  assert.deepEqual(b.meldungen, []);
});

test('ein Lagerhinweis über Paletten ist keine Lieferzusage', () => {
  // `moertel.md` rät unter „Bodenfeuchte" richtig, die Säcke auf der Palette
  // stehen zu lassen. Ein Prüfer, der das meldete, machte Lärm — und wird
  // dann ruhiggestellt statt befolgt.
  const b = gruppentextbefund([
    { gruppe: 'Mörtel', text: 'Säcke gehören auf der Palette zu bleiben.', artikel: [{ sperrgut: false }] },
  ]);
  assert.deepEqual(b.meldungen, []);
});

test('geprüft wird jede übergebene Seite, auch die stummen', () => {
  const seiten = [
    { gruppe: 'WDVS', text: 'Kein Wort dazu.', artikel: [{ sperrgut: false }] },
    { gruppe: 'Kamin', text: 'Mit Kran entladen.', artikel: [{ sperrgut: true }] },
  ];
  const b = gruppentextbefund(seiten);
  assert.equal(b.geprueft, 2, 'die Zahl nennt das Angesehene, nicht das Gefundene');
  assert.equal(b.sauber, true);
});

/* ------------------------------------------------------------------ *
 * Die Zahlen im Einstufungsblock und ihre Quellen — 10. September 2026
 *
 * Die Abhilfe zum Befund „Kranentladung für 285 Gramm" war, dem Kunden
 * Herkunft, Gewicht und Betrag der Schätzung zu nennen. Fünf Tage lang hing
 * sie allein an der Vorlage: Der Flächenprüfer verlangt nur „aus der
 * Warengruppe" irgendwo in der Datei, und der Testfall prüfte eine Seite und
 * den ersten Halbsatz.
 * ------------------------------------------------------------------ */

const block = (inneres) => `<p class="einstufung">${inneres}</p>`;
const echterBlock = block(
  'Die Einstufung als palettierte Ware stammt aus der Warengruppe Kanal. '
  + 'Dieser Artikel wiegt 1,7 kg je Stück (Quelle: Positionsgewicht auf dem Lieferschein) — '
  + 'bei kleiner Menge kommt er ohne Palette. '
  + 'Die Kranentladung ist mit 7,50 € netto je Position gerechnet und in der Zustellung '
  + 'unten enthalten (Quelle: Lieferung und Fracht, Stand: 2026-08-17); liegt die Schätzung '
  + 'zu hoch, ist die Lieferung günstiger.');

test('Ein vollständiger Block ist keine Meldung', () => {
  const b = blockquellenbefund([{ datei: 'a.html', inhalt: echterBlock }], 1);
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.bloecke, 1);
  assert.equal(b.zahlen, 2, 'beide Zahlen tragen Quellenpflicht');
});

test('Dem Betrag fehlt seine Quelle — der Fall, für den das gebaut ist', () => {
  const ohne = echterBlock.replace('(Quelle: Lieferung und Fracht, Stand: 2026-08-17)',
    '(Lieferung und Fracht, Stand: 2026-08-17)');
  const b = blockquellenbefund([{ datei: 'a.html', inhalt: ohne }], 1);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'zahl-ohne-quelle');
  assert.match(b.meldungen[0].text, /kranbetrag/);
});

test('Die Quelle des Gewichts deckt den Betrag nicht', () => {
  /*
   * **Der erste Entwurf prüfte gegen den ganzen Block** — und der trägt zwei
   * Quellen. Die Gegenprobe nahm dem Betrag seine, und der Prüfer blieb grün:
   * Er fand die des Gewichts, ein paar Zeilen darüber.
   *
   * > Eine Quelle gehört zu ihrer Zahl, nicht zu ihrem Absatz.
   */
  const ohne = echterBlock.replace('(Quelle: Lieferung und Fracht, Stand: 2026-08-17)', '(dort)');
  const b = blockquellenbefund([{ datei: 'a.html', inhalt: ohne }], 1);
  assert.equal(b.meldungen.length, 1, 'die Gewichtsquelle darf nicht einspringen');
  assert.match(b.meldungen[0].text, /kranbetrag/);
});

test('Beim Betrag fehlt auch der Stand nicht ungestraft', () => {
  const ohne = echterBlock.replace(', Stand: 2026-08-17', '');
  const b = blockquellenbefund([{ datei: 'a.html', inhalt: ohne }], 1);
  assert.equal(b.meldungen.length, 1, 'ein Frachtsatz altert — der Stand gehört dazu');
});

test('Dem Gewicht fehlt seine Quelle', () => {
  const ohne = echterBlock.replace('(Quelle: Positionsgewicht auf dem Lieferschein)', '(gewogen)');
  const b = blockquellenbefund([{ datei: 'a.html', inhalt: ohne }], 1);
  assert.equal(b.meldungen.length, 1);
  assert.match(b.meldungen[0].text, /gewicht/);
});

test('Eine Seite ohne Block wird nicht gezählt', () => {
  const b = blockquellenbefund([{ datei: 'a.html', inhalt: '<p>nichts</p>' }], 0);
  assert.equal(b.bloecke, 0);
  assert.deepEqual(b.meldungen, []);
});

test('Ein leerer Lauf ist kein grüner', () => {
  // Fände die Sammlung keinen Block — nicht gebaut, Klasse verloren —, meldete
  // die Prüfung „sauber" über nichts.
  const b = blockquellenbefund([], 20);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'zu-wenig-bloecke');
});

test('Der echte Bestand trägt zu jeder Zahl ihre Quelle', async () => {
  const { readFileSync, readdirSync, existsSync } = await import('node:fs');
  const ordner = new URL('../ausgabe/site/artikel/', import.meta.url);
  if (!existsSync(ordner)) return; // pruefung: begruendet — ohne Bau nichts zu lesen
  const seiten = readdirSync(ordner).filter((n) => n.endsWith('.html'))
    .map((n) => ({ datei: n, inhalt: readFileSync(new URL(n, ordner), 'utf8') }));
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Artikelseiten`);
  const b = blockquellenbefund(seiten, 20);
  assert.ok(b.zahlen >= 20, `nur ${b.zahlen} Zahlen mit Quellenpflicht — die Schleife prüfte fast nichts`);
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
});
