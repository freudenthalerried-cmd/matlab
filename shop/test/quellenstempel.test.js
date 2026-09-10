import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  QUELLENSTEMPEL, stempelbefund, registerbefund, sichtbarerText, staendeIn,
} from '../src/quellenstempel.js';
import { BINDEFRIST, BINDEFRIST_TAGE } from '../src/beleg.js';

const WURZEL = new URL('../ausgabe/site', import.meta.url).pathname;

/** Die gebauten Seiten — dieselbe Datei, die der Besucher bekommt. */
function gebauteSeiten() {
  const gefunden = [];
  const gehe = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) gehe(pfad);
      else if (eintrag.name.endsWith('.html')) {
        gefunden.push({ name: pfad.slice(WURZEL.length + 1), html: readFileSync(pfad, 'utf8') });
      }
    }
  };
  gehe(WURZEL);
  return gefunden;
}

test('Das Register führt jeden Stempel mit Tatsache, Standform und Herkunft', () => {
  assert.ok(QUELLENSTEMPEL.length >= 8,
    `nur ${QUELLENSTEMPEL.length} Einträge — ohne Bestand prüft die Schleife darunter nichts`);
  for (const e of QUELLENSTEMPEL) {
    assert.ok(e.muster instanceof RegExp, `${e.id} führt kein Muster`);
    assert.ok(e.tatsache.length > 10, `${e.id} nennt keine Tatsache`);
    assert.ok(e.woher.length > 10, `${e.id} sagt nicht, woher sein Stand kommt`);
  }
  assert.equal(registerbefund().sauber, true);
});

test('Eine unbekannte Standform und ein fehlender Grund werden gemeldet', () => {
  const b = registerbefund([
    { id: 'x', standform: 'gelegentlich', tatsache: 'irgendetwas Langes', woher: 'aus dem Bauch' },
    { id: 'x', standform: 'viele', tatsache: 'noch etwas Langes', woher: '' },
  ]);
  const regeln = b.meldungen.map((m) => m.regel);
  assert.ok(regeln.includes('unbekannte-standform'));
  assert.ok(regeln.includes('ohne-grund'));
  assert.ok(regeln.includes('doppelte-kennung'));
});

test('„viele" ist erlaubt — aber nur mit Grund', () => {
  const b = registerbefund([
    { id: 'y', standform: 'viele', tatsache: 'ein Wert je einzelner Ware', woher: 'der Preisstand des Artikels' },
  ]);
  assert.equal(b.sauber, true, 'eine begründete Abweichung ist keine Meldung');
});

test('Der Text einer Seite wird ohne Marken gelesen, und Lücken vor Satzzeichen fallen weg', () => {
  const t = sichtbarerText('<p>(Quelle: <a href="/x">Lieferung und Fracht</a>, Stand: 2026-01-01)</p>');
  assert.equal(t, '(Quelle: Lieferung und Fracht, Stand: 2026-01-01)');
  assert.deepEqual(staendeIn(t), ['2026-01-01']);
});

test('Jeder Stempel des gebauten Auftritts steht im Register, und keiner fehlt', () => {
  const b = stempelbefund(gebauteSeiten(), 100);
  assert.ok(b.gesamt >= 100, `nur ${b.gesamt} Quellenangaben gefunden`);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => `[${m.regel}] ${m.text}`).join('\n'));
});

/*
 * Der Befund vom 10. September, als Fall festgehalten: Die Artikelseite
 * belegte die Bindefrist mit dem **Preisstand des Artikels**. Acht Daten für
 * eine Regel — und kein Prüfer sah hin, weil dieser Beleg erst beim Bauen
 * entsteht.
 */
test('Ein Stempel mit zwei Ständen für eine Setzung wird gemeldet', () => {
  const seite = (stand) => ({
    name: `artikel/${stand}.html`,
    html: `<p>Das bindet 14 Tage (Quelle: eigene Belegvorlage nach § 862 ABGB, Stand: ${stand}).</p>`,
  });
  const b = stempelbefund([seite('2026-04-22'), seite('2026-08-17')], 2);
  const treffer = b.meldungen.filter((m) => m.regel === 'stand-uneinheitlich');
  assert.equal(treffer.length, 1);
  assert.match(treffer[0].text, /2026-04-22/);
  assert.match(treffer[0].text, /2026-08-17/);
});

test('Eine Quellenangabe, die das Register nicht führt, meldet sich', () => {
  const b = stempelbefund([{
    name: 'wissen/neu.html',
    html: '<p>Der Satz (Quelle: ein Anruf beim Nachbarn, Stand: 2026-09-10).</p>',
  }], 1);
  assert.equal(b.meldungen[0].regel, 'stempel-nicht-gefuehrt');
});

test('Ein Prüfer ohne Fundstellen meldet nicht sauber über nichts', () => {
  const b = stempelbefund([], 100);
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-stempel'));
});

test('Die Bindefrist trägt ihre Zahl und ihren Stand als ein Paar', () => {
  // Wer die Frist ändert, ändert den Stand — sonst nennt diese Zusicherung
  // beim nächsten Lauf genau die Hälfte, die stehen geblieben ist.
  assert.deepEqual({ ...BINDEFRIST }, { tage: 14, stand: '2026-09-06' });
  assert.equal(BINDEFRIST_TAGE, BINDEFRIST.tage);
});

test('Die Artikelseiten belegen die Bindefrist mit dem Stand der Regel', () => {
  const seiten = gebauteSeiten().filter((s) => s.name.startsWith('artikel/'));
  assert.ok(seiten.length >= 40, `nur ${seiten.length} Artikelseiten — die Schleife prüfte fast nichts`);
  for (const s of seiten) {
    const t = sichtbarerText(s.html);
    assert.match(t, new RegExp(
      `bindet ${BINDEFRIST.tage} Tage ab Angebotsdatum \\(Quelle: eigene Belegvorlage nach `
      + `§ 862 ABGB, Stand: ${BINDEFRIST.stand}\\)`),
    `${s.name} belegt die Bindefrist nicht mit dem Stand der Regel`);
  }
});
