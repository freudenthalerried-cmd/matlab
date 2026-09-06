/**
 * Steht jede gebaute Seite in der Datei, die für Maschinen gemacht ist?
 *
 * **Befund vom 6. September 2026.** `llms.txt` ist das Verzeichnis, das dieser
 * Shop Assistenten hinhält — der Kanal, über den geworben werden soll.
 * Gezählt: **82 gebaute Seiten, 70 genannt.** Vier der zwölf Auslassungen
 * waren die Rechtsseiten. Wer einen Assistenten fragt, unter welchen
 * Bedingungen dieser Händler liefert oder wie lange die Rügefrist läuft, bekam
 * von dieser Datei keine Antwort — und ein Assistent, der nichts findet,
 * antwortet mit dem, was bei einem Baustoffhändler üblich ist.
 *
 * > **Eine Auslassung ohne Grund ist von einer vergessenen Seite nicht zu
 * > unterscheiden.**
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { MINDESTGRUND, OHNE_EINTRAG, llmsbefund } from '../src/llmsdeckung.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = join(SHOP, 'ausgabe', 'site');

const seiten = (n) => Array.from({ length: n }, (_, i) => `seite${i}`);
const grund = 'ein Grund, der lang genug ist, um als Begründung zu zählen und nicht als Ausrede';

test('eine gebaute Seite ohne Eintrag und ohne Grund ist der Fund', () => {
  const alle = seiten(41);
  const b = llmsbefund({ seiten: alle, genannt: alle.slice(1), ohneEintrag: [] });
  const m = b.meldungen.find((x) => x.regel === 'seite-ohne-eintrag');
  assert.ok(m, 'seite-ohne-eintrag fehlt');
  assert.equal(m.seite, 'seite0');
});

test('mit Grund ist die Auslassung in Ordnung', () => {
  const alle = seiten(41);
  const b = llmsbefund({ seiten: alle, genannt: alle.slice(1), ohneEintrag: [{ seite: 'seite0', warum: grund }] });
  assert.deepEqual(b.meldungen, []);
  assert.equal(b.genannt, 40);
  assert.equal(b.ausgelassen, 1);
});

test('ein zu kurzer Grund zählt nicht als einer', () => {
  const alle = seiten(41);
  const b = llmsbefund({ seiten: alle, genannt: alle.slice(1), ohneEintrag: [{ seite: 'seite0', warum: 'weil' }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'auslassung-ohne-grund'));
});

test('die Rückrichtung: ein Grund für eine Seite, die es nicht gibt', () => {
  const alle = seiten(41);
  const b = llmsbefund({ seiten: alle, genannt: alle, ohneEintrag: [{ seite: 'weg', warum: grund }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'grund-fuer-nichts' && m.seite === 'weg'));
});

test('genannt und zugleich begründet ausgelassen ist ein Widerspruch', () => {
  const alle = seiten(41);
  const b = llmsbefund({ seiten: alle, genannt: alle, ohneEintrag: [{ seite: 'seite0', warum: grund }] });
  assert.ok(b.meldungen.some((m) => m.regel === 'genannt-und-begruendet-ausgelassen'));
});

test('zu wenige Seiten sind kein grüner Befund', () => {
  const b = llmsbefund({ seiten: ['eine'], genannt: ['eine'], ohneEintrag: [] });
  assert.ok(b.meldungen.some((m) => m.regel === 'zu-wenig-seiten'));
});

test('jeder Grund im Register trägt seine Begründung', () => {
  assert.ok(OHNE_EINTRAG.length > 0, 'ohne Einträge prüft die Schleife darunter nichts');
  for (const o of OHNE_EINTRAG) {
    assert.ok(o.warum.length >= MINDESTGRUND, `„${o.seite}" ohne brauchbaren Grund`);
  }
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

/** Die Kennungen aller gebauten Seiten — `wissen/xps-oder-eps` und so fort. */
function gebauteSeiten() {
  const gefunden = [];
  const gehe = (ordner, vorne) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      if (e.isDirectory()) { gehe(join(ordner, e.name), `${vorne}${e.name}/`); continue; }
      if (e.name.endsWith('.html')) gefunden.push(`${vorne}${e.name.replace(/\.html$/, '')}`);
    }
  };
  gehe(SITE, '');
  return gefunden;
}

test('jede gebaute Seite steht in llms.txt — oder mit Grund nicht darin', () => {
  const datei = join(SITE, 'llms.txt');
  if (!existsSync(datei)) return; // ohne Bau keine Aussage

  const text = readFileSync(datei, 'utf8');
  const alle = gebauteSeiten();
  const b = llmsbefund({
    seiten: alle,
    genannt: alle.filter((id) => text.includes(`/${id}.html`)),
    ohneEintrag: OHNE_EINTRAG,
  });
  assert.deepEqual(b.meldungen.map((m) => m.text), []);
  assert.ok(b.seiten >= 60, `nur ${b.seiten} gebaute Seiten gemessen`);
});

test('die Rechtsseiten stehen in llms.txt, samt dem Satz über ihren Stand', () => {
  const datei = join(SITE, 'llms.txt');
  if (!existsSync(datei)) return;
  const text = readFileSync(datei, 'utf8');
  for (const seite of ['impressum', 'agb', 'datenschutz', 'abnahme']) {
    assert.ok(text.includes(`/rechtliches/${seite}.html`), `${seite} fehlt in llms.txt`);
  }
  // Solange kein verbindlicher Wortlaut da ist, muss die Datei es sagen —
  // sonst gibt sie ein Gerüst als Rechtstext aus.
  const betreiber = JSON.parse(readFileSync(join(SHOP, 'data', 'betreiber.json'), 'utf8'));
  if (!betreiber.rechtstexteFundstelle) {
    assert.match(text, /ohne verbindlichen Wortlaut/);
  }
});
