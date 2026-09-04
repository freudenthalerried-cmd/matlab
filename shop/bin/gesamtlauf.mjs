#!/usr/bin/env node
/**
 * Ein Befehl, der alles läuft — und rot wird, wenn irgendetwas rot ist.
 *
 *   npm run alles              ohne die Browserproben
 *   npm run alles -- --mit-browser
 *
 * **Der Anlass, 3. September 2026.** Es gab keinen. Achtzehn Prüfer, drei
 * Browserproben, dreißig Gegenproben und 1.276 Testfälle — und um zu wissen,
 * ob der Bestand steht, musste man **einundzwanzig Befehle von Hand tippen**.
 * Die vollständige Liste stand nirgends: nicht in `package.json`, nicht in
 * einer Anleitung, sondern jedes Mal neu im Kopf dessen, der sie tippt.
 *
 * > **Eine Prüfung, deren Vollständigkeit man sich merken muss, ist irgendwann
 * > unvollständig.**
 *
 * Dieser Lauf tippt sie nicht ab, sondern **liest sie aus dem Register**
 * (`src/pruefregister.js`). Damit kann er nicht hinter dem Bestand
 * zurückbleiben: Wer einen Prüfer einträgt, hat ihn hier automatisch dabei —
 * und wer einen einträgt, ohne ihn zu bauen, merkt es hier.
 *
 * ## Die Testzahl hat eine Untergrenze
 *
 * `node --test test/*.test.js` meldet bei leerem Verzeichnis **„0 Testfälle"
 * und endet grün**. Nachgemessen am selben Tag. Deshalb verlangt dieser Lauf
 * die Zahl, die das Register für `pruefe-tests` als Mindestmaß führt: Ein Lauf
 * ohne Testfälle ist kein bestandener Lauf.
 *
 * ## Zwei Testzahlen, und beide stimmen
 *
 * Der Testlauf meldet 1.278 Fälle, `pruefe-tests` 1.277. Das ist kein
 * Widerspruch: Der Lauf zählt **ausgeführte** Fälle, der Prüfer **im Code
 * stehende**. `test/kontrast.test.js` schreibt einen Fall in eine Schleife
 * über zwei Anstriche — eine Stelle im Code, zwei Läufe.
 *
 * Die Differenz war am 3.9. zunächst zwei. Der zweite Fall war kein Zählstil,
 * sondern ein Loch: `test/geheimnis.test.js` hat neun Testfälle, der Prüfer
 * sah acht. Nebeneinandergestellt haben die beiden Zahlen es gezeigt — jede
 * für sich sah richtig aus. **Zwei Zählungen desselben Bestands sind eine
 * Prüfung, solange jemand die Differenz erklären muss.**
 *
 * ## Was er nicht tut
 *
 * Er baut nicht. `build` und `website` gehören davor, und zwar bewusst von
 * Hand: Ein Prüflauf, der sein Prüfobjekt selbst erzeugt, prüft das, was er
 * gerade gebaut hat, und nicht das, was ausgeliefert ist. Fehlt der Bau,
 * sagen die betroffenen Prüfer das von sich aus.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';
import { frischebefund } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const mitBrowser = process.argv.includes('--mit-browser');
// Wie npm aufzurufen ist: Läuft dieser Lauf selbst unter npm, steht dessen
// Skript in `npm_execpath` und gehört mit dem laufenden node gestartet —
// sonst nimmt `npm` aus dem Pfad, was auch immer dort zuerst liegt.
const NPM_AUFRUF = process.env.npm_execpath?.endsWith('.js')
  ? [process.execPath, process.env.npm_execpath, 'test']
  : ['npm', 'test'];

const testfloor = PRUEFER.find((p) => p.name === 'pruefe-tests')?.mindestens ?? 1;

/** Ein Schritt: Name, Befehl, und was ihn rot macht. */
const schritte = [];

/**
 * **Erst bauen, dann messen** — ergänzt am 4. September.
 *
 * Fünf Prüfer dieses Laufs lesen das gebaute Erzeugnis. Bis heute fragten sie
 * nur, **ob** es da ist; seit dem Erzeugnisregister weigern sie sich über
 * einem veralteten. Ohne diesen Schritt hinge das Ergebnis des Gesamtlaufs
 * daran, wann zuletzt jemand `npm run website` getippt hat.
 *
 * > **Eine Batterie, die das Erzeugnis misst, muss es vorher erzeugen.**
 *
 * Rot wird der Schritt, wenn ein Baubefehl scheitert: Was sich nicht bauen
 * lässt, lässt sich auch nicht prüfen — und die fünf Prüfer darunter meldeten
 * sonst „veraltet" und verschwiegen damit die eigentliche Ursache.
 */
schritte.push({
  name: 'bauen',
  was: 'npm run build und npm run website — das Erzeugnis auf den Stand der Quelle',
  lauf: () => {
    for (const befehl of ['build', 'website']) {
      const e = spawnSync('npm', ['run', '--silent', befehl], { cwd: SHOP, encoding: 'utf8' });
      if (e.status !== 0) {
        return { ok: false, meldung: `npm run ${befehl} scheitert (Ausgang ${e.status})` };
      }
    }
    const nachher = ['ausgabe/site', 'ausgabe/website.html', 'demo.html']
      .map((n) => frischebefund(SHOP, n));
    const alt = nachher.filter((b) => !b.frisch).map((b) => b.name);
    if (alt.length) return { ok: false, meldung: `nach dem Bau noch veraltet: ${alt.join(', ')}` };
    return { ok: true, meldung: `${nachher.length} Erzeugnisse auf dem Stand` };
  },
});

schritte.push({
  name: 'Testlauf',
  was: `npm test, mindestens ${testfloor} Testfälle`,
  lauf: () => {
    // **Nicht `node --test test/`.** Diese Schreibweise hat am 3.9. beim ersten
    // Lauf dieses Werkzeugs „1 Testfall, 1 rot" gemeldet, während `npm test`
    // 1.276 grüne Testfälle zählte: Node 22 nimmt den Pfad als Modul und
    // scheitert am Verzeichnis. Zwei Aufrufe, zwei Wahrheiten — und die
    // falsche wäre hier die maßgebliche geworden.
    //
    // Deshalb ruft dieser Schritt **den veröffentlichten Befehl** auf statt
    // eine eigene Dateiliste zu bilden. Eine zweite Liste könnte von der in
    // `package.json` abweichen; dieser Aufruf kann es nicht.
    const e = spawnSync(NPM_AUFRUF[0], NPM_AUFRUF.slice(1), { cwd: SHOP, encoding: 'utf8' });
    const ausgabe = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    const gezaehlt = Number(/^# tests (\d+)$/m.exec(ausgabe)?.[1] ?? 0);
    const gescheitert = Number(/^# fail (\d+)$/m.exec(ausgabe)?.[1] ?? -1);
    if (gescheitert !== 0) return { ok: false, meldung: `${gescheitert} Testfälle rot` };
    if (gezaehlt < testfloor) {
      return { ok: false, meldung: `nur ${gezaehlt} Testfälle — unter dem Mindestmaß ${testfloor}` };
    }
    return { ok: true, meldung: `${gezaehlt} Testfälle` };
  },
});

for (const p of [...PRUEFER, ...(mitBrowser ? BROWSERPRUEFER : [])]) {
  schritte.push({
    name: p.name,
    was: `${p.werkzeug}${p.argumente ? ` ${p.argumente.join(' ')}` : ''}`,
    lauf: () => {
      const e = spawnSync(process.execPath, [join(SHOP, 'bin', p.werkzeug), ...(p.argumente ?? [])],
        { cwd: SHOP, encoding: 'utf8' });
      const ausgabe = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      // Der Umfang steht im Register und wird hier mitgeprüft: Ein Prüfer, der
      // grün endet und dabei nichts angesehen hat, ist der Fall, für den es
      // `pruefe-pruefer` gibt — hier kostet die Prüfung nichts extra.
      const treffer = p.muster.exec(ausgabe);
      const umfang = treffer ? Number(treffer[p.zweite ? 2 : 1]) : null;
      if (e.status !== 0) return { ok: false, meldung: `Ausgang ${e.status}` };
      if (umfang === null) return { ok: false, meldung: 'meldet seinen Umfang nicht' };
      // NaN ist keine Menge. `NaN < mindestens` ist falsch, also käme ein
      // Prüfer, dessen Register die falsche Klammer nennt, hier als grün
      // durch — genau so stand `pruefe-datenschutz` am 3.9. mit „NaN Zusagen"
      // im ersten Lauf. Das Urteil in `src/prueferurteil.js` fängt es jetzt
      // auch; hier steht es ein zweites Mal, weil dieser Lauf nicht darauf
      // angewiesen sein soll, dass ein anderes Werkzeug mitgelesen wird.
      if (!Number.isFinite(umfang)) {
        return { ok: false, meldung: `nennt keine Zahl an der Stelle, die das Register angibt (Klammer ${p.zweite ? 2 : 1} von ${p.muster})` };
      }
      if (umfang < p.mindestens) {
        return { ok: false, meldung: `nur ${umfang} ${p.einheit} — Mindestmaß ${p.mindestens}` };
      }
      return { ok: true, meldung: `${umfang} ${p.einheit}` };
    },
  });
}

schritte.push({
  name: 'gegenproben',
  was: 'gegenprobenlauf.mjs — schlägt jede Gegenprobe an?',
  lauf: () => {
    const e = spawnSync(process.execPath, [join(SHOP, 'bin', 'gegenprobenlauf.mjs')],
      { cwd: SHOP, encoding: 'utf8' });
    const ausgabe = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    const t = /^(\d+) von (\d+) Gegenproben schlagen an/m.exec(ausgabe);
    if (e.status !== 0) return { ok: false, meldung: `Ausgang ${e.status}` };
    if (!t) return { ok: false, meldung: 'meldet sein Ergebnis nicht' };
    return { ok: t[1] === t[2], meldung: `${t[1]} von ${t[2]}` };
  },
});

/**
 * **Zuletzt, nach den Gegenproben.** `pruefe-mutationen` steht schon im
 * Prüferregister und lief damit weiter oben — also **vor** dem einzigen
 * Schritt, der Quelldateien absichtlich falsch macht. Genau das war der
 * Befund vom 4. September: Der Lauf war noch im Gegenprobenschritt, als die
 * Abschlussprüfung „uncommitted changes" meldete.
 *
 * > **Ein Prüfer, der vor dem Ereignis läuft, prüft die Zeit davor.**
 */
schritte.push({
  name: 'nichts liegen geblieben',
  was: 'mutationspruefung.mjs — steht nach den Gegenproben noch etwas absichtlich falsch da?',
  lauf: () => {
    const e = spawnSync(process.execPath, [join(SHOP, 'bin', 'mutationspruefung.mjs')],
      { cwd: SHOP, encoding: 'utf8' });
    const ausgabe = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    const t = /(\d+) offene Zettel/.exec(ausgabe);
    if (!t) return { ok: false, meldung: 'meldet sein Ergebnis nicht' };
    return { ok: e.status === 0, meldung: `${t[1]} offene Zettel` };
  },
});

console.log(`Gesamtlauf — ${schritte.length} Schritte`
  + `${mitBrowser ? ', mit Browserproben' : ' (ohne Browserproben, mit --mit-browser dazu)'}\n`);

const rot = [];
for (const s of schritte) {
  const ergebnis = s.lauf();
  console.log(`  ${ergebnis.ok ? '✓' : '✗'} ${s.name.padEnd(22)} ${ergebnis.meldung}`);
  if (!ergebnis.ok) rot.push(`${s.name}: ${ergebnis.meldung}`);
}

console.log(`\n${schritte.length - rot.length} von ${schritte.length} Schritten grün.`);
if (rot.length === 0) {
  console.log('Der Bestand steht. Was hier nicht läuft, ist nicht geprüft — die Liste kommt aus');
  console.log('src/pruefregister.js und nicht aus dem Gedächtnis.');
  process.exit(0);
}
console.log('');
for (const r of rot) console.log(`  ✗ ${r}`);
process.exit(1);
