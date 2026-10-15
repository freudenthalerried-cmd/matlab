import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, lesKopf, inline, alsHtml, alsText, alsListe } from '../src/markdown.js';

/* ------------------------------------------------------------------ *
 * Entkommen — die wichtigste Eigenschaft
 *
 * Artikelnamen kommen aus Lieferantenrechnungen, also aus fremder Hand.
 * Ein `&` oder `<` darin darf die Seite nicht zerlegen.
 * ------------------------------------------------------------------ */

test('Sonderzeichen werden entkommen', () => {
  assert.equal(esc('Ökotherm HL N+F <5 & "groß"'), 'Ökotherm HL N+F &lt;5 &amp; &quot;groß&quot;');
});

test('Markup im Inhalt wird Text, nicht Markup', () => {
  assert.equal(inline('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.match(alsHtml('# <img onerror=x>'), /&lt;img onerror=x&gt;/);
});

test('Code wird genau einmal entkommen, nicht doppelt', () => {
  // Der Inhalt in Backticks ist bereits durch esc gelaufen, bevor er
  // herausgelöst wird. Ein zweites esc beim Zurücksetzen machte aus
  // &lt; ein &amp;lt; — sichtbarer Unsinn auf der Seite.
  assert.equal(inline('`<b>`'), '<code>&lt;b&gt;</code>');
});

test('Eine Zahl im Fließtext ist kein Code-Platzhalter', () => {
  // Der Platzhalter für Code-Ausschnitte darf nicht mit gewöhnlichem Text
  // kollidieren. Mit Leerzeichen als Trenner hätte „rund 25 Prozent" den
  // Inhalt von Ausschnitt 25 eingesetzt — der gar nicht existiert.
  assert.equal(inline('rund 25 Prozent und ein `Sack` dazu'), 'rund 25 Prozent und ein <code>Sack</code> dazu');
  assert.equal(inline('1 2 3 4 5'), '1 2 3 4 5');
});

/* ------------------------------------------------------------------ *
 * Kopfblock
 * ------------------------------------------------------------------ */

test('Der Kopfblock wird gelesen und vom Körper getrennt', () => {
  const { kopf, koerper } = lesKopf('---\ntitel: Probe\nslug: probe\n---\n\n# Überschrift\n');
  assert.equal(kopf.titel, 'Probe');
  assert.equal(kopf.slug, 'probe');
  assert.match(koerper, /^\s*# Überschrift/);
});

test('Kopfblockwerte bleiben Zeichenketten — auch mit Komma', () => {
  // Eine erste Fassung zerlegte jeden Wert mit Komma in eine Liste. Damit
  // wurde aus einer Frage mit Nebensatz eine zweielementige Liste, die
  // später ohne Leerzeichen wieder zusammenwuchs: „im Fachhandel,und wo".
  const { kopf } = lesKopf('---\nfrage: Ist das günstiger, und wo ist der Haken?\n---\n');
  assert.equal(kopf.frage, 'Ist das günstiger, und wo ist der Haken?');
});

test('alsListe zerlegt nur, wo eine Liste gemeint ist', () => {
  assert.deepEqual(alsListe('eins, zwei, drei'), ['eins', 'zwei', 'drei']);
  assert.deepEqual(alsListe('nur eins'), ['nur eins']);
  assert.deepEqual(alsListe(undefined), []);
  assert.deepEqual(alsListe('a, , b'), ['a', 'b'], 'leere Einträge fallen weg');
});

test('Ohne Kopfblock bleibt der ganze Text Körper', () => {
  const { kopf, koerper } = lesKopf('# Direkt los\n');
  assert.deepEqual(kopf, {});
  assert.equal(koerper, '# Direkt los\n');
});

/* ------------------------------------------------------------------ *
 * Blockelemente
 * ------------------------------------------------------------------ */

test('Überschriften, Absätze und Listen', () => {
  const html = alsHtml('# Titel\n\nEin Absatz.\n\n- eins\n- zwei\n');
  assert.match(html, /<h1>Titel<\/h1>/);
  assert.match(html, /<p>Ein Absatz\.<\/p>/);
  assert.match(html, /<ul><li>eins<\/li><li>zwei<\/li><\/ul>/);
});

test('Geordnete Listen bleiben geordnet', () => {
  assert.match(alsHtml('1. eins\n2. zwei\n'), /<ol><li>eins<\/li><li>zwei<\/li><\/ol>/);
});

test('Eine eingerückte Fortsetzungszeile gehört zum Punkt davor', () => {
  const html = alsHtml('- ein langer Punkt,\n  der umbricht\n- zweiter\n');
  assert.match(html, /<li>ein langer Punkt, der umbricht<\/li>/);
  assert.match(html, /<li>zweiter<\/li>/);
});

test('Tabellen werden umgesetzt und sind seitlich scrollbar', () => {
  const html = alsHtml('| A | B |\n|---|---|\n| 1 | 2 |\n');
  assert.match(html, /<div class="scroll"><table>/);
  assert.match(html, /<th>A<\/th><th>B<\/th>/);
  assert.match(html, /<td>1<\/td><td>2<\/td>/);
});

test('Blockzitate dürfen Absätze enthalten', () => {
  const html = alsHtml('> Erste Zeile.\n>\n> Zweite.\n');
  assert.match(html, /<blockquote>/);
  assert.equal((html.match(/<p>/g) ?? []).length, 2);
});

test('Überschriftenebenen lassen sich verschieben', () => {
  // Eine eingebettete Seite darf unter einer bestehenden h1 keine zweite
  // aufmachen — das zerstört die Gliederung für Vorleser und Suchmaschinen.
  assert.match(alsHtml('# Titel\n', { ueberschriftAb: 2 }), /<h2>Titel<\/h2>/);
  assert.match(alsHtml('### Tief\n', { ueberschriftAb: 3 }), /<h5>Tief<\/h5>/);
});

test('Kommentare verschwinden, Text nicht', () => {
  const html = alsHtml('<!-- pruefung: begruendet — Grund -->\nEin Satz.\n');
  assert.doesNotMatch(html, /pruefung/);
  assert.match(html, /Ein Satz\./);
});

test('Externe Links bekommen rel=noopener, interne nicht', () => {
  assert.match(inline('[x](https://baumit.at/)'), /rel="noopener noreferrer"/);
  assert.doesNotMatch(inline('[x](wissen/y)'), /rel=/);
});

test('Nichts geht spurlos verloren', () => {
  // Was der Umsetzer nicht kennt, wird Absatztext. Eine verschluckte Zeile
  // fällt beim Korrekturlesen nicht auf — deshalb diese Zusicherung.
  const quelle = '# Eins\n\nZwei\n\n- Drei\n\n| A |\n|---|\n| Vier |\n\n> Fünf\n';
  const html = alsHtml(quelle);
  for (const wort of ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf']) {
    assert.match(html, new RegExp(wort), `„${wort}" fehlt in der Ausgabe`);
  }
});

test('alsText liefert zitierfähigen Fließtext', () => {
  assert.equal(alsText('# Titel\n\n**Fett** und [Link](x) und `Code`.'), 'Titel Fett und Link und Code.');
});
