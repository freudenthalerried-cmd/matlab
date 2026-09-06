/**
 * Ein Datum, das jemand nachführen muss.
 *
 * **Befund vom 6. September 2026.** Das Feld `stand:` im Kopfblock der 24
 * Inhaltsseiten hatte genau einen Abnehmer — `dateModified` in der
 * strukturierten Auskunft — und war bei **10 von 24** Seiten älter als die
 * letzte Änderung ihrer eigenen Datei. `kanal.md` trug den 25. August und war
 * am 2. September inhaltlich berichtigt worden.
 *
 * > **Ein Datum, das jemand nachführen muss, ist so aktuell wie sein
 * > Gedächtnis. Ein Datum, das aus der Änderung selbst kommt, ist es immer.**
 *
 * Geprüft wird beides: die Ableitung für sich (was `standAusGit` aus einer
 * Änderungsgeschichte macht) und der Bestand (was auf den gebauten Seiten
 * steht). Der zweite Teil ist der wichtigere — er ist der Prüfer, dessen
 * Reichweite so groß ist wie die Regel, die er prüft.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { UNBEKANNT, standAusGit } from '../src/inhaltsstand.js';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const OBEN = join(WURZEL, '..');
const SITE = join(WURZEL, 'ausgabe', 'site');

/* ------------------------------------------------------------------ *
 * Die Ableitung für sich
 * ------------------------------------------------------------------ */

/** Ein git, das auf vorbereitete Antworten hört. */
function gitMit({ status = '', log = '', wirft = null } = {}) {
  const gesehen = [];
  const git = (argumente) => {
    gesehen.push(argumente[0]);
    if (wirft === argumente[0]) throw new Error('fatal: not a git repository');
    return argumente[0] === 'status' ? status : log;
  };
  git.gesehen = gesehen;
  return git;
}

test('eine verbuchte Datei trägt das Datum ihrer letzten Änderung', () => {
  const stand = standAusGit({
    pfad: 'shop/inhalte/gruppen/kanal.md',
    git: gitMit({ log: '2026-09-02\n' }),
    heute: '2026-09-06',
  });
  assert.equal(stand, '2026-09-02');
});

test('eine unverbuchte Änderung heißt heute — nicht das Datum der letzten Einspielung', () => {
  const git = gitMit({ status: ' M shop/inhalte/gruppen/kanal.md\n', log: '2026-09-02\n' });
  const stand = standAusGit({ pfad: 'shop/inhalte/gruppen/kanal.md', git, heute: '2026-09-06' });
  assert.equal(stand, '2026-09-06');
  assert.ok(!git.gesehen.includes('log'), 'nach einer offenen Änderung ist die Geschichte gleichgültig');
});

test('eine unverfolgte Datei zählt als offen', () => {
  const stand = standAusGit({
    pfad: 'shop/inhalte/wissen/neu.md',
    git: gitMit({ status: '?? shop/inhalte/wissen/neu.md\n' }),
    heute: '2026-09-06',
  });
  assert.equal(stand, '2026-09-06');
});

test('ohne Verzeichnis bleibt der Stand unbekannt — kein erfundenes Datum', () => {
  assert.equal(
    standAusGit({ pfad: 'x.md', git: gitMit({ wirft: 'status' }), heute: '2026-09-06' }),
    UNBEKANNT,
  );
  assert.equal(
    standAusGit({ pfad: 'x.md', git: gitMit({ wirft: 'log' }), heute: '2026-09-06' }),
    UNBEKANNT,
  );
});

test('eine Datei ohne Geschichte bekommt kein Datum', () => {
  assert.equal(
    standAusGit({ pfad: 'x.md', git: gitMit({ log: '' }), heute: '2026-09-06' }),
    UNBEKANNT,
  );
});

test('was keine Datumsform hat, gilt als unbekannt', () => {
  assert.equal(
    standAusGit({ pfad: 'x.md', git: gitMit({ log: 'nicht ein datum' }), heute: '2026-09-06' }),
    UNBEKANNT,
  );
});

test('unbekannt ist null — damit der Schlüssel entfallen kann', () => {
  assert.equal(UNBEKANNT, null);
});

/* ------------------------------------------------------------------ *
 * Der Bestand
 * ------------------------------------------------------------------ */

const gitEcht = (argumente) => execFileSync('git', argumente, { cwd: OBEN, encoding: 'utf8' });
const HEUTE = new Date().toISOString().slice(0, 10);

/** Jede Inhaltsdatei mit der Seite, die aus ihr gebaut wurde. */
function inhaltsseiten() {
  const gefunden = [];
  for (const art of ['wissen', 'gruppen', 'system']) {
    const ordner = join(WURZEL, 'inhalte', art);
    if (!existsSync(ordner)) continue;
    for (const datei of readdirSync(ordner).filter((d) => d.endsWith('.md')).sort()) {
      const text = readFileSync(join(ordner, datei), 'utf8');
      const slug = /^\s*slug\s*:\s*(\S+)\s*$/m.exec(text)?.[1] ?? datei.replace(/\.md$/, '');
      const kopfstand = /^\s*stand\s*:\s*(\S+)\s*$/m.exec(text)?.[1] ?? null;
      const id = `${art === 'gruppen' ? 'gruppe' : art}/${slug}`;
      gefunden.push({
        art,
        datei,
        quelle: `shop/inhalte/${art}/${datei}`,
        kopfstand,
        seite: join(SITE, `${id}.html`),
      });
    }
  }
  return gefunden;
}

/** `dateModified` aus der ersten Auszeichnung, die eines trägt. */
function ausgezeichneterStand(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const daten = JSON.parse(m[1]);
    for (const knoten of Array.isArray(daten) ? daten : [daten]) {
      if (knoten?.dateModified) return knoten.dateModified;
    }
  }
  return null;
}

test('jede gebaute Inhaltsseite nennt den Stand aus der Änderungsgeschichte', () => {
  const seiten = inhaltsseiten().filter((s) => existsSync(s.seite));
  // Die Zusicherung über die Zahl steht **vor** der Schleife: Eine Schleife
  // über eine leere Liste prüft nichts und meldet grün.
  assert.ok(seiten.length >= 20, `nur ${seiten.length} gebaute Inhaltsseiten gefunden`);
  for (const s of seiten) {
    const erwartet = standAusGit({ pfad: s.quelle, git: gitEcht, heute: HEUTE });
    assert.ok(erwartet, `${s.quelle}: kein Stand aus dem Verzeichnis ermittelbar`);
    const genannt = ausgezeichneterStand(readFileSync(s.seite, 'utf8'));
    assert.equal(genannt, erwartet, `${s.quelle}: ausgezeichnet ${genannt}, geändert ${erwartet}`);
  }
});

/**
 * Der Grund, aus dem das Feld abgelöst wurde: Es lief ab, ohne dass es auffiel.
 * Die zehn abgelaufenen Kopffelder bleiben im Bestand stehen — sie zu
 * berichtigen hieße, die Dateien anzufassen, und damit behauptete die
 * abgeleitete Angabe für zehn Seiten „heute". Verlangt wird deshalb nicht,
 * dass es sie nicht gibt, sondern dass **keine Seite ihren Wert nennt**.
 *
 * Ohne Schleife: Ob es abgelaufene Felder überhaupt gibt, ist offen — und eine
 * Zusicherung, dass es welche geben muss, wäre die falsche Regel.
 */
test('das abgelöste Kopffeld wird nicht mehr gelesen — auch wenn es abgelaufen ist', () => {
  const seiten = inhaltsseiten().filter((s) => existsSync(s.seite));
  assert.ok(seiten.length >= 20, `nur ${seiten.length} gebaute Inhaltsseiten gefunden`);
  const rueckfaellig = seiten.filter((s) => {
    if (!s.kopfstand) return false;
    const echt = standAusGit({ pfad: s.quelle, git: gitEcht, heute: HEUTE });
    if (!echt || !(s.kopfstand < echt)) return false;
    return ausgezeichneterStand(readFileSync(s.seite, 'utf8')) === s.kopfstand;
  });
  assert.deepEqual(rueckfaellig.map((s) => s.quelle), [], 'Seiten, die wieder das Kopffeld nennen');
});
