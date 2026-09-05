/**
 * Jede veröffentlichte Anzeige steht im Schaufensterverzeichnis.
 *
 * **Der Anlass, 3. September 2026.** `schaufenster-abgleich.md` führt, welche
 * veröffentlichte Anzeige auf welchem Stand steht. Seine eigene Tafel stand
 * acht Tage auf dem 26. August und trug Zahlen — „77 Seiten", „616
 * Testfälle" —, die längst überholt waren, während sie als *gültig* ausgewiesen
 * wurden.
 *
 * > **Ein Register der Stände, das selbst einen Stand hat, ist ein
 * > Schaufenster.**
 *
 * Die Zahlen sind deshalb aus der Tafel heraus; sie führt jetzt, was nicht
 * altert. Was bleibt, ist die Gefahr dahinter: **eine veröffentlichte Adresse,
 * die in keinem Verzeichnis steht.** Sie wandert nicht mit, sie steht auch
 * nicht bewusst still — sie ist schlicht vergessen, und niemand merkt es, weil
 * nichts auf sie zeigt.
 *
 * Dieser Testfall zieht die Gegenrichtung: Jede Artefaktadresse, die irgendwo
 * im Bestand vorkommt, muss im Verzeichnis stehen. Er prüft nicht, ob der
 * Eintrag stimmt — das kann kein Werkzeug —, sondern dass es ihn gibt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(SHOP, '..');
const AKTE = join(REPO, 'docs', 'baustoff-shop');
const VERZEICHNIS = 'schaufenster-abgleich.md';

/** Alle Dateien der Akte und der Shoptexte, in denen eine Adresse stehen kann. */
function dateien() {
  const gefunden = [];
  const gehe = (ordner, endungen) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, e.name);
      if (e.isDirectory()) gehe(pfad, endungen);
      else if (endungen.some((x) => e.name.endsWith(x))) gefunden.push(pfad);
    }
  };
  gehe(AKTE, ['.md', '.html']);
  gehe(join(SHOP, 'inhalte'), ['.md']);
  return gefunden;
}

const ADRESSE = /claude\.ai\/code\/artifact\/([0-9a-f-]{36})/g;

test('jede veröffentlichte Anzeige steht im Schaufensterverzeichnis', () => {
  const pfade = dateien();
  assert.ok(pfade.length >= 50, `nur ${pfade.length} Dateien durchsucht — die Prüfung greift zu wenig`);

  const verzeichnis = readFileSync(join(AKTE, VERZEICHNIS), 'utf8');
  const gefuehrt = new Set([...verzeichnis.matchAll(ADRESSE)].map((t) => t[1]));
  assert.ok(gefuehrt.size >= 3, `nur ${gefuehrt.size} Einträge im Verzeichnis — leer prüft nichts`);

  const ungefuehrt = new Map();
  for (const pfad of pfade) {
    if (pfad.endsWith(VERZEICHNIS)) continue;
    for (const t of readFileSync(pfad, 'utf8').matchAll(ADRESSE)) {
      if (!gefuehrt.has(t[1])) ungefuehrt.set(t[1], pfad.slice(REPO.length + 1));
    }
  }

  assert.deepEqual(
    [...ungefuehrt].map(([id, wo]) => `${id} (${wo})`),
    [],
    `diese veröffentlichten Adressen stehen in keinem Eintrag von ${VERZEICHNIS} — `
      + 'eine Anzeige, auf die kein Verzeichnis zeigt, wandert nicht mit und steht auch '
      + 'nicht bewusst still',
  );
});

/**
 * Und die Gegenrichtung, damit die Tafel nicht wieder Zahlen ansetzt.
 *
 * Sie führt Modell und Zustand, keine Stände. Eine Mengenangabe der Form
 * „N Seiten" oder „N Testfälle" gehört nicht hinein — genau die sind acht Tage
 * lang falsch dagestanden.
 */
test('die Tafel des Verzeichnisses führt keine Mengen, die altern', () => {
  const text = readFileSync(join(AKTE, VERZEICHNIS), 'utf8');
  const tafel = text.split('\n').filter((z) => z.startsWith('| ') && z.includes('artifact/'));
  assert.ok(tafel.length >= 4, `nur ${tafel.length} Anzeigenzeilen — die Prüfung greift zu wenig`);

  const mengen = tafel
    .flatMap((z) => [...z.matchAll(/\b(\d[\d.]*)\s+(Seiten|Testfälle|Artikel|Kennzahlen|Prüfer)\b/g)]
      .map((t) => `${t[1]} ${t[2]}`));
  assert.deepEqual(mengen, [],
    'die Tafel trägt wieder Mengenangaben — eine Zahl hier ist eine Kopie, und Kopien altern');
});

/**
 * Das Einfrierdatum einer stillstehenden Anzeige kommt aus ihrer Quelldatei.
 *
 * Der Radon-Bericht stand am 3. September mit **drei** Daten in drei Dateien:
 * 16.08. in `PARAMETER.md`, „auf Stand 17. August gebracht" in `STATUS.md`,
 * 18.08. im Schaufensterverzeichnis. Keines davon war gemessen; maßgeblich ist,
 * was die Anzeige selbst trägt — und ihre Quelldatei liegt im Repo.
 */
test('der Stand des Radon-Berichts stimmt mit seiner Quelldatei überein', () => {
  const quelle = readFileSync(join(AKTE, 'bericht-radon.html'), 'utf8');
  const treffer = /Stand (\d{1,2}\. \w+ \d{4})/.exec(quelle);
  assert.ok(treffer, 'bericht-radon.html nennt keinen Stand — dann ist keiner belegt');

  const zeile = readFileSync(join(AKTE, VERZEICHNIS), 'utf8')
    .split('\n')
    .find((z) => z.includes('3d669d15'));
  assert.ok(zeile, 'der Radon-Bericht steht nicht im Verzeichnis');
  assert.ok(
    zeile.includes(treffer[1]),
    `das Verzeichnis nennt nicht „${treffer[1]}" — die Anzeige trägt einen anderen Stand als ihr Eintrag`,
  );
});
