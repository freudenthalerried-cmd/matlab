/**
 * Was der Reichweitenmesser messen kann — und was nicht.
 *
 * **Der Anlass, 5. September 2026, abends.** Neun Runden trugen an einem Tag
 * denselben Befund: ein Prüfer, dessen Reichweite kleiner ist als die
 * Reichweite der Regel, die er prüft. `npm run reichweite` beantwortet die
 * Frage durch Messung statt durch ein handgeführtes Register.
 *
 * > **Und der erste Lauf fand den Fehler an sich selbst.** Er meldete
 * > `shop/bestellung.php` als von keinem Prüfer gelesen — das Empfangsskript,
 * > das als einziges von außen erreichbar ist. Es stimmte nicht:
 * > `pruefe-lesbar` **liest** die Datei nicht, es reicht sie an `php -l`
 * > weiter, und die Hülle sah nur `fs` im eigenen Prozess.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { wegwerfordner } from '../src/wegwerf.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const SPUR = join(SHOP, 'werkzeug', 'spur.cjs');

/** Führt ein Stück Node mit der Spur davor aus und gibt die Pfade zurück. */
function spur(quelltext) {
  const ordner = wegwerfordner('spurprobe-');
  const skript = join(ordner, 'probe.mjs');
  const ziel = join(ordner, 'spur.txt');
  writeFileSync(skript, quelltext);
  writeFileSync(ziel, '');
  const lauf = spawnSync(process.execPath, ['--require', SPUR, skript], {
    cwd: SHOP, encoding: 'utf8', env: { ...process.env, SPUR_DATEI: ziel },
  });
  assert.equal(lauf.status, 0, lauf.stderr);
  return readFileSync(ziel, 'utf8').split('\n').filter(Boolean);
}

test('die Spur sieht, was ein Werkzeug selbst liest', () => {
  const pfade = spur("import { readFileSync } from 'node:fs';\nreadFileSync('package.json', 'utf8');\n");
  assert.ok(pfade.some((p) => p.endsWith('/package.json')), pfade.join('\n'));
});

test('die Spur sieht, was ein Kindprozess bekommt', () => {
  // **Die Blindstelle des ersten Laufs.** Ohne diese Hülle meldete der
  // Messer `bestellung.php` als ungelesen — weil `pruefe-lesbar` sie an
  // `php -l` weiterreicht, statt sie selbst zu öffnen.
  const pfade = spur("import { spawnSync } from 'node:child_process';\n"
    + "spawnSync(process.execPath, ['--check', 'package.json']);\n");
  assert.ok(pfade.some((p) => p.endsWith('/package.json')),
    'ein Argument, das auf eine Datei zeigt, zählt als gelesen');
});

test('die Spur zählt nur, was es gibt', () => {
  // Ein Argument ist kein Beweis, dass gelesen wurde — aber ein Argument,
  // das auf keine Datei zeigt, ist mit Sicherheit keines.
  const pfade = spur("import { spawnSync } from 'node:child_process';\n"
    + "spawnSync(process.execPath, ['-e', '1', '--gibtesnicht', 'auch-nicht.txt']);\n");
  assert.ok(!pfade.some((p) => p.includes('auch-nicht.txt')), pfade.join('\n'));
});

test('ohne SPUR_DATEI verändert die Hülle nichts', () => {
  // Ein Messwerkzeug, das den Lauf verändert, den es misst, misst den
  // falschen Lauf.
  const lauf = spawnSync(process.execPath, ['--require', SPUR, '-e', "console.log('unberührt')"],
    { cwd: SHOP, encoding: 'utf8', env: { ...process.env, SPUR_DATEI: '' } });
  assert.equal(lauf.status, 0, lauf.stderr);
  assert.match(lauf.stdout, /unberührt/);
});

test('das Werkzeug selbst ist da und lässt sich einlesen', () => {
  assert.ok(existsSync(SPUR), 'ohne die Spur gibt es nichts zu messen');
  const werkzeug = join(SHOP, 'bin', 'reichweite.mjs');
  assert.ok(existsSync(werkzeug));
  // Es darf sich kein eigenes Wegwerfverzeichnis anlegen — die Regel vom
  // 4. September, und `test/wegwerf.test.js` liest `bin/` ohnehin.
  assert.ok(!/\bmkdtempSync\s*\(/.test(readFileSync(werkzeug, 'utf8')));
});
