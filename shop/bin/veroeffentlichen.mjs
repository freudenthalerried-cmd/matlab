#!/usr/bin/env node
/**
 * Veröffentlicht die PR-Beschreibung — ohne dass ein Buchstabe durch eine Hand geht.
 *
 *   npm run veroeffentlichen
 *
 * **Der Anlass, 10. September 2026.** Die Beschreibung ging bis dahin durch ein
 * Werkzeug, das sie aus dem Gespräch heraus setzte: abgetippt. In sechs Runden
 * hat der Abgleich fünfmal eine Abweichung gefunden, jedes Mal einen Satz oder
 * Absatz, den die Quelle nicht kannte — und an einem einzigen Abend fünf
 * Veröffentlichungen gekostet, drei davon nur wegen einer geänderten Zahl.
 *
 * > **Was nicht abgetippt wird, kann sich beim Abtippen nicht ändern.**
 *
 * An diesem Tag stellte sich heraus, dass `api.github.com` aus dieser Umgebung
 * nicht nur zu lesen ist: Ein Zugangsschlüssel liegt in der Umgebung, ein
 * Schreibversuch antwortet mit 200. Versucht hatte es niemand.
 *
 * Dieses Werkzeug schreibt die Ausgabe von `npm run pr-text` unverändert
 * hinaus, liest sie zurück, hält sie Zeichen für Zeichen dagegen und trägt den
 * Fingerabdruck erst dann in den Vermerk ein. **Nur in dieser Reihenfolge:**
 * Ein Vermerk vor dem Abgleich belegt, dass jemand etwas veröffentlicht hat,
 * nicht dass es das Richtige war.
 *
 * **Was es nicht tut:** irgendetwas anderes als die Beschreibung ändern. Kein
 * Titel, kein Zustand, kein Kommentar.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { markenbefund, WEGZUSATZ } from '../src/veroeffentlichung.js';
import { geschaeftstag } from '../src/geschaeftszeit.js';
import { wegwerfordner } from '../src/wegwerf.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const PR = 'https://api.github.com/repos/freudenthalerried-cmd/matlab/pulls/14';
const VERMERK = join(SHOP, '..', 'docs', 'baustoff-shop', 'pr-veroeffentlicht.json');

/** Der Schlüssel wird gelesen und nie ausgegeben — auch nicht in einer Fehlermeldung. */
const schluessel = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
if (!schluessel) {
  console.error('Weigerung: Kein Zugangsschlüssel in der Umgebung (GITHUB_TOKEN).');
  console.error('Ohne ihn ließe sich nur abtippen, und genau das soll hier aufhören.');
  process.exit(2);
}

const eigen = spawnSync('node', [join(SHOP, 'bin', 'prtext.mjs')], { cwd: SHOP, encoding: 'utf8' });
if (eigen.status !== 0) {
  console.error('Abbruch: `npm run pr-text` lief nicht — es gibt nichts zu veröffentlichen.');
  process.exit(2);
}
const soll = eigen.stdout.replace(/\n$/, '');

/*
 * **Über eine Datei, nicht über die Befehlszeile.** Vierzigtausend Zeichen als
 * Argument sprengen jede Längengrenze, und was gekürzt hinausgeht, sähe hier
 * aus wie ein Erfolg.
 *
 * **Und nicht nach `ausgabe/`.** Jedes Werkzeug, das dorthin schreibt, gehört
 * ins Frischeregister — für eine Datei, die eine Minute lebt, wäre das ein
 * Eintrag für nichts. Das Wegwerfverzeichnis räumt sich selbst weg; eine Probe,
 * die ihre Spuren behält, wird irgendwann selbst der Fehler.
 */
const ablage = wegwerfordner('pr-nutzlast-');
const nutzlast = join(ablage, 'koerper.json');
writeFileSync(nutzlast, JSON.stringify({ body: soll }));

const schreiben = spawnSync('curl', [
  '-sS', '-X', 'PATCH', '--max-time', '40',
  '-o', '/dev/null', '-w', '%{http_code}',
  '-H', `Authorization: Bearer ${schluessel}`,
  '-H', 'Accept: application/vnd.github+json',
  '-H', 'Content-Type: application/json',
  '--data-binary', `@${nutzlast}`, PR,
], { encoding: 'utf8' });

if (schreiben.status !== 0 || schreiben.stdout.trim() !== '200') {
  console.error(`Weigerung: Die Schnittstelle antwortete mit „${schreiben.stdout.trim() || '—'}".`);
  console.error((schreiben.stderr || '').trim().slice(0, 200));
  console.error('Der Vermerk bleibt, wie er war — er sagt, was zuletzt draußen stand.');
  process.exit(2);
}

// Der Wegwerfordner räumt sich beim Programmende selbst weg.
const holen = spawnSync('curl', ['-sS', '--max-time', '30', '-H',
  `Authorization: Bearer ${schluessel}`, PR], { encoding: 'utf8' });
if (holen.status !== 0 || !holen.stdout) {
  console.error('Weigerung: Geschrieben, aber nicht zurückgelesen — der Abgleich fehlt.');
  process.exit(2);
}
const ist = JSON.parse(holen.stdout).body ?? '';
const ohneZusatz = ist.endsWith(WEGZUSATZ) ? ist.slice(0, -WEGZUSATZ.length) : ist;
const marke = markenbefund(ist);

console.log('\nVeröffentlicht — ohne einen abgetippten Buchstaben\n');
console.log(marke.passt ? `  ✓ ${marke.text}` : `  ✗ ${marke.text}  [${marke.regel}]`);
console.log(ohneZusatz === soll
  ? `  ✓ Zurückgelesen und Zeichen für Zeichen gleich (${soll.length} Zeichen)`
  : '  ✗ Zurückgelesen und abweichend');

if (!marke.passt || ohneZusatz !== soll) {
  console.log('\nDer Vermerk bleibt ungeschrieben. Ein Fingerabdruck ohne Abgleich belegt,');
  console.log('dass jemand etwas veröffentlicht hat — nicht, dass es das Richtige war.');
  process.exit(1);
}

/*
 * **Der Fingerabdruck des Vermerks ist der der ganzen Werkzeugausgabe** — nicht
 * der aus der Marke. Die Marke deckt den Text **über** ihr; `pruefe-schaufenster`
 * rechnet über die vollständige Ausgabe samt Marke und Zeilenumbruch am Ende.
 * Der erste Anlauf hat hier `marke.ist` eingetragen, und der Prüfer meldete
 * prompt eine ausstehende Veröffentlichung, die es nicht gab.
 *
 * > **Zwei Zahlen über denselben Text sind zwei Zahlen.**
 */
const vermerk = JSON.parse(readFileSync(VERMERK, 'utf8'));
vermerk.sha256 = createHash('sha256').update(eigen.stdout, 'utf8').digest('hex');
vermerk.stand = geschaeftstag();
vermerk.zurueckgelesen = geschaeftstag();
vermerk.werkzeug = 'npm run veroeffentlichen';
writeFileSync(VERMERK, `${JSON.stringify(vermerk, null, 2)}\n`);

console.log(`  ✓ Vermerk nachgezogen: sha256:${vermerk.sha256.slice(0, 16)}…, Stand ${vermerk.stand}`);
console.log('\nWas nicht abgetippt wird, kann sich beim Abtippen nicht ändern.');
