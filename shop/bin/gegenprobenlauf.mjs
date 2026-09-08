#!/usr/bin/env node
/**
 * Jede Gegenprobe des Registers anwenden und ansehen, ob sie anschlägt.
 *
 *   npm run gegenproben
 *
 * Antwort auf die Frage vom 1. September: **Welche Gegenprobe habe ich für
 * bestanden gehalten, ohne sie anschlagen zu sehen?** An diesem Tag waren es
 * zwei von drei, und beide sahen aus wie eine Bestätigung.
 *
 * Vier Zusicherungen je Eintrag, und keine reicht allein:
 *
 *   1. Der Prüfer ist **vorher grün**.
 *   2. Die Mutation ist **angekommen** — sonst lief der Prüfer über den
 *      unveränderten Bestand und meldete zu Recht nichts.
 *   3. Er meldet **rot** und nennt die erwartete Stelle.
 *   4. Nach dem Zurücksetzen ist er **wieder grün**.
 *
 * Die Datei wird immer zurückgeschrieben — auch bei Abbruch.
 *
 * **Danach neu bauen.** Das Zurückschreiben ändert das Änderungsdatum, und die
 * Browserproben halten das Erzeugnis gegen die Quelle: Sie melden dann „eine
 * Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit". Das ist
 * richtig so und keine Fehlfunktion — aber `npm run website` gehört danach.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GEGENPROBEN, OHNE_GEGENPROBE, neueMeldungen, registerbefund } from '../src/gegenprobenregister.js';
import { laufzahl, nachPrueferGruppiert, vorlaufEntfaellt } from '../src/gegenprobenplan.js';
import { markiere, nimmAb, offeneMarken, stelleZurueck } from '../src/mutationsschutz.js';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';
import { LESER } from '../src/erzeugnisstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const laufe = (name) => {
  const r = spawnSync('npm', ['run', '--silent', name], { cwd: SHOP, encoding: 'utf8' });
  return { gruen: r.status === 0, ausgang: r.status, ausgabe: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

/**
 * Welche Prüfer lesen ein gebautes Erzeugnis?
 *
 * **Ergänzt am 4. September.** Seit die Erzeugnisleser sich über einem
 * veralteten Stand weigern, betrifft das diesen Läufer unmittelbar: Er
 * **verändert Quelldateien** und schreibt sie zurück, und beides macht das
 * Erzeugnis älter als die Quelle. Fünf Gegenproben meldeten daraufhin „war
 * schon vorher rot" — und beschuldigten damit Prüfer, die nichts falsch
 * gemacht hatten.
 *
 * > **Dasselbe Muster wie beim ignorierten `baueVorher`:** Ein Läufer, der die
 * > Vorbedingung seiner Prüfer nicht kennt, erfindet Befunde.
 *
 * Das Feld `baueVorher` am Eintrag bleibt — es sagt, dass die **Mutation**
 * durch den Bau muss. Diese Liste sagt etwas anderes: dass der **Prüfer** ohne
 * frisches Erzeugnis gar nicht erst anläuft.
 *
 * Abgeleitet wird sie aus den veröffentlichten Skripten und dem Leserregister,
 * nicht von Hand geführt — und ausdrücklich **nicht** aus `PRUEFER`: `wegprobe`
 * steht dort nicht und liest trotzdem `ausgabe/website.html`. Eine Liste, die
 * nur die geführten Prüfer kennt, hätte genau die beiden Gegenproben weiter
 * beschuldigt, die den Anlass gaben.
 */
const SKRIPTE = JSON.parse(readFileSync(join(SHOP, 'package.json'), 'utf8')).scripts ?? {};
const ERZEUGNISLESER = new Set(
  Object.entries(SKRIPTE)
    .filter(([, befehl]) => LESER.some((l) => l.erzeugnis && befehl.includes(l.werkzeug)))
    .map(([name]) => name),
);

/** Läuft den Prüfer — und baut vorher, wenn er ein Erzeugnis liest. */
const laufeMitBau = (name) => {
  if (ERZEUGNISLESER.has(name)) baue();
  return laufe(name);
};

/**
 * Manche Prüfer lesen nicht die Quelle, sondern das **Erzeugnis** —
 * `pruefe-seiten` die gebauten Seiten, `pruefe-preise` die vier Ausgaben. Eine
 * Mutation an der Quelle erreicht sie nur, wenn dazwischen gebaut wird.
 *
 * **Der Eintrag trug das Feld `baueVorher`, und der Läufer hat es ignoriert.**
 * Die Gegenprobe meldete „schlägt nicht an" und beschuldigte damit einen
 * Prüfer, der nichts falsch gemacht hatte.
 *
 * > **Ein Register, dessen Felder der Läufer nicht kennt, erfindet Befunde.**
 * > Dieselbe Familie wie eine Gegenprobe, die nicht ankommt — nur meldet
 * > diese rot statt grün, und eine falsche Anschuldigung ist auch eine
 * > Fehlmeldung.
 */
const baue = () => {
  // `build` **vor** `website`: Die Oberfläche `shop-ui.js` geht durch das
  // Bündel, und eine Mutation dort erreicht die gebaute Seite sonst nicht.
  spawnSync('npm', ['run', '--silent', 'build'], { cwd: SHOP, encoding: 'utf8' });
  // `kampagne` gehört dazu, seit `werbeprobe` als Erzeugnisleser geführt ist:
  // Sie misst `ausgabe/kampagne/`, und ein Bau, der nur die Website erneuert,
  // ließe sie über einem veralteten Anzeigenstand weigern.
  spawnSync('npm', ['run', '--silent', 'kampagne'], { cwd: SHOP, encoding: 'utf8' });
  return spawnSync('npm', ['run', '--silent', 'website'], { cwd: SHOP, encoding: 'utf8' });
};

const mitBrowser = process.argv.includes('--mit-browser');
const nurEine = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? null;

/**
 * **Browserproben bleiben aus dem Regellauf heraus** — dieselbe Regel wie in
 * `npm run alles`, und aus demselben Grund: Jede kostet einen Chromium-Start,
 * `bestellprobe` zusätzlich einen PHP-Server, einen vollständigen Bau und
 * zwei weitere Werkzeugläufe.
 *
 * Der Anlass, 4. September: Die beiden Gegenproben zu `bestellprobe` liefen
 * einzeln grün und im Gesamtlauf zweimal hintereinander unterschiedlich rot —
 * einmal „war schon vorher rot", einmal „etwas anderes gefunden". Beide Male
 * war der Bestand in Ordnung; rot war die Maschine.
 *
 * > **Eine Probe, die unter Last etwas anderes meldet als allein, misst die
 * > Last.** Sie gehört dorthin, wo sie allein läuft.
 *
 * Mit `--mit-browser` laufen sie mit, und `npm run alles --mit-browser` zieht
 * sie über den Browserprüferzweig ohnehin mit herein.
 */
const browsernamen = new Set(BROWSERPRUEFER.map((p) => p.name));
const zurueckgestellt = (!nurEine && !mitBrowser)
  ? GEGENPROBEN.filter((p) => browsernamen.has(p.pruefer))
  : [];
const gewaehlt = nurEine
  ? GEGENPROBEN.filter((p) => p.id === nurEine || p.pruefer === nurEine)
  : GEGENPROBEN.filter((p) => mitBrowser || !browsernamen.has(p.pruefer));
// Nach Prüfer gruppiert, damit der „wieder grün"-Lauf der einen Probe der
// „vorher grün"-Lauf der nächsten sein kann. Siehe `src/gegenprobenplan.js`.
const proben = nachPrueferGruppiert(gewaehlt);
if (nurEine && proben.length === 0) {
  console.error(`Keine Gegenprobe zu „${nurEine}". Bekannt: ${GEGENPROBEN.map((p) => p.id).join(', ')}`);
  process.exit(2);
}

/**
 * **Erst aufräumen, dann prüfen.** Ein Lauf, den `SIGKILL` erwischt hat, ließ
 * bis zum 4. September eine absichtlich falsche Datei im Bestand liegen — und
 * das Original nur im Arbeitsspeicher des toten Prozesses. Seit heute hängt
 * vor jeder Mutation ein Zettel mit dem Original daneben; hier wird er
 * eingelöst.
 */
const liegengeblieben = offeneMarken(REPO);
for (const m of liegengeblieben) {
  if (!m.lesbar) {
    console.error(`Abbruch: unlesbarer Zettel ${m.pfad} (${m.grund}) — von Hand ansehen.`);
    process.exit(2);
  }
  const { datei, schonRichtig } = stelleZurueck(m);
  console.log(`Aus einem abgebrochenen Lauf zurückgeholt: ${datei}`
    + `${schonRichtig ? ' (stand schon richtig da)' : ''}`);
}
if (liegengeblieben.length) console.log('');

const befund = registerbefund(PRUEFER.map((p) => p.name));

console.log(`Gegenproben — ${GEGENPROBEN.length} im Register für ${befund.gedeckt} Prüfer,`);
console.log(`${befund.begruendet} weitere mit begründetem Verzicht.`);
console.log(`${proben.length} laufen, ${laufzahl(proben)} Prüferläufe statt ${proben.length * 3} `
  + '— der „wieder grün"-Lauf zählt als „vorher grün" der nächsten Probe.\n');

const begonnen = Date.now();
let gesparteLaeufe = 0;
let voriges = null;

const ergebnisse = [];

for (const p of proben) {
  const pfad = join(REPO, p.datei);
  const vorher = readFileSync(pfad, 'utf8');
  const schritte = [];
  let urteil = 'geschlagen';

  // Ein `finally` läuft nicht bei `SIGINT` und `SIGTERM`. Die Einzelprobe in
  // `bin/gegenprobe.mjs` fängt beide seit dem 31. August ab; dieser Läufer,
  // der unbeaufsichtigt in `npm run alles` steckt, tat es bis heute nicht.
  const zuruecksetzen = () => {
    writeFileSync(pfad, vorher);
    nimmAb(pfad);
  };
  const beiSignal = () => { zuruecksetzen(); process.exit(130); };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, beiSignal);

  const seit = Date.now();

  try {
    const wieder = vorlaufEntfaellt(voriges, p) ? voriges.zurueck : null;
    if (wieder) gesparteLaeufe += 1;
    const vor = wieder ?? laufeMitBau(p.pruefer);
    /*
     * **Weigerung ist kein roter Prüfer — 8. September 2026.**
     *
     * Zwei Prüfer können seit dem Verlust von
     * `preise/poschacher-positionen.csv` nichts messen und sagen das mit
     * Ausgang 2. Ihre Gegenproben meldeten daraufhin „war schon vorher rot —
     * an einem roten Prüfer lässt sich nichts zeigen" und beschuldigten damit
     * Prüfer, die nichts falsch gemacht haben. Dasselbe Muster wie am
     * 4. September beim veralteten Erzeugnis.
     *
     * Zurückgestellt, nicht gescheitert: Was nicht gemessen werden kann, ist
     * nicht widerlegt.
     */
    if (vor.ausgang === 2) {
      schritte.push(`der Prüfer kann nichts messen: ${vor.ausgabe.trim().split('\n')[0]}`);
      urteil = 'nicht messbar';
    } else if (!vor.gruen) {
      /**
       * **Auch hier gehört der Grund dazu** — ergänzt am 4. September, aus
       * demselben Anlass wie im Gesamtlauf: Zwei Gegenproben meldeten „war
       * schon vorher rot", und der Prüfer hatte in seiner Ausgabe genau
       * gesagt, warum. Diese Ausgabe wurde weggeworfen.
       *
       * > **Ein Urteil über einen Prüfer, das seine Begründung wegwirft, ist
       * > eine Anschuldigung.**
       */
      // `not ok` zuerst: Bei `npm test` steht das ✗ auch in der eigenen
      // Ausgabe geprüfter Werkzeuge, und der erste Treffer führte einmal
      // zwanzig Minuten in die falsche Richtung.
      const zeilen = vor.ausgabe.trim().split('\n');
      const funde = (zeilen.filter((z) => z.startsWith('not ok')).length
        ? zeilen.filter((z) => z.startsWith('not ok'))
        : zeilen.filter((z) => z.includes('✗'))).slice(0, 4);
      schritte.push('war schon vorher rot — an einem roten Prüfer lässt sich nichts zeigen');
      for (const z of (funde.length ? funde : zeilen.slice(-4))) schritte.push(`  ${z.trim()}`);
      urteil = 'unbrauchbar';
    } else {
      // `alle: true` ersetzt jedes Vorkommen. Der Anlass: Die Landeseite nennt
      // ihre Lücke zweimal — im Kopf und im Fließtext —, und eine Mutation, die
      // nur eine der beiden trifft, lässt den Prüfer zu Recht grün melden.
      // Das sah aus wie „schlägt nicht an" und war eine halbe Mutation.
      const mutiert = p.art === 'anhaengen'
        ? vorher + p.text
        : (p.alle ? vorher.split(p.suchen).join(p.ersetzen) : vorher.replace(p.suchen, p.ersetzen));

      /*
       * **Ein Suchtext, der zweimal passt — 7. September 2026.**
       *
       * `replace` ersetzt die **erste** Fundstelle. Beim Schreiben einer neuen
       * Gegenprobe traf der Suchtext eine Zeile, die in `shopkern.js` zweimal
       * steht: einmal im Suchindex, einmal im öffentlichen Artikel. Mutiert
       * wurde der Suchindex, und der Preisprüfer meldete zu Recht grün — das
       * sah aus wie ein Prüfer, der nicht anschlägt.
       *
       * Die Einzelprobe bricht seit dem 31. August bei mehrfachem Treffer ab.
       * Dieser Läufer steckt unbeaufsichtigt im Gesamtlauf und tat es nicht:
       * **Was der Mensch von Hand ausführt, war abgesichert; was allein läuft,
       * nicht.**
       */
      const treffer = p.art === 'ersetzen' ? vorher.split(p.suchen).length - 1 : 1;
      if (p.art === 'ersetzen' && !p.alle && treffer > 1) {
        schritte.push(`Suchtext kommt ${treffer}-mal vor — mutiert würde die erste Stelle, `
          + 'und das ist nicht unbedingt die gemeinte');
        urteil = 'mehrdeutig';
      } else if (mutiert === vorher) {
        schritte.push(p.art === 'ersetzen'
          ? `Suchtext nicht gefunden: ${JSON.stringify(p.suchen.slice(0, 50))}`
          : 'Mutation hat nichts geändert');
        urteil = 'nicht angekommen';
      } else {
        // Der Zettel geht **vor** die Mutation. Danach wäre er ein Zettel für
        // den Fall, der zwischen beiden Zeilen nicht mehr eintreten kann.
        markiere(pfad, vorher, `gegenprobenlauf.mjs (${p.id})`, p.was);
        writeFileSync(pfad, mutiert);
        if (p.baueVorher) baue();
        const nach = laufeMitBau(p.pruefer);
        if (nach.gruen) {
          schritte.push('meldete trotz Mutation grün');
          urteil = 'schlägt nicht an';
        } else if (!p.erwartet.test(neueMeldungen(vor.ausgabe, nach.ausgabe))) {
          /*
           * **Verglichen wird, was neu ist — 7. September 2026.**
           *
           * Bis heute stand hier `nach.ausgabe`, also die ganze rote Ausgabe.
           * Gemessen über das Register passen **34 von 101 Erwartungen schon
           * auf die grüne** — bei `npm test` fast alle, weil TAP jeden
           * Testfall beim Namen nennt, ob er durchläuft oder nicht. Eine
           * Erwartung, die auch auf Grün passt, sagt nur, dass es rot ist,
           * nicht warum: Die dritte Zusicherung war für ein Drittel der
           * Einträge dieselbe Aussage wie die vorige.
           */
          schritte.push(`meldete rot, aber nicht wegen ${p.erwartet} — er hat etwas anderes gefunden`);
          urteil = 'falsche Meldung';
        } else {
          schritte.push('meldete rot an der erwarteten Stelle');
        }
      }
    }
  } finally {
    zuruecksetzen();
    for (const signal of ['SIGINT', 'SIGTERM']) process.off(signal, beiSignal);
    if (p.baueVorher) baue();
  }

  // **Zurückgeschrieben ist nicht dasselbe wie wieder da.** Die Einzelprobe
  // sieht seit dem 31. August nach; dieser Läufer hat es geglaubt.
  if (readFileSync(pfad, 'utf8') !== vorher) {
    console.error(`\nAbbruch: ${p.datei} steht nach der Probe „${p.id}" nicht wieder wie vorher.`);
    console.error('Der Zettel unter .sicherung/ trägt das Original.');
    process.exit(3);
  }

  if (urteil === 'geschlagen') {
    const zurueck = laufeMitBau(p.pruefer);
    if (zurueck.gruen) {
      // Genau dieser Lauf ist der „vorher grün"-Lauf der nächsten Probe am
      // selben Prüfer: Die Datei steht byteweise wieder da, geprüft eine
      // Zeile weiter oben.
      voriges = { pruefer: p.pruefer, urteil: 'geschlagen', zurueck };
    } else {
      schritte.push('nach dem Zurücksetzen nicht wieder grün — die Probe hat etwas hinterlassen');
      urteil = 'nicht sauber';
      voriges = null;
    }
  } else {
    voriges = null;
  }

  const sekunden = Math.round((Date.now() - seit) / 1000);
  ergebnisse.push({ ...p, urteil, schritte, sekunden });
  const zeichen = urteil === 'geschlagen' ? '✓' : '✗';
  console.log(`  ${zeichen} ${p.pruefer} — ${p.was}`);
  console.log(`      ${p.datei} (${p.art}) · ${ergebnisse[ergebnisse.length - 1].sekunden} s`);
  for (const s of schritte) console.log(`      ${s}`);
  console.log('');
}

const nichtMessbar = ergebnisse.filter((e) => e.urteil === 'nicht messbar');
const gescheitert = ergebnisse.filter((e) => e.urteil !== 'geschlagen' && e.urteil !== 'nicht messbar');

const dauer = Math.round((Date.now() - begonnen) / 1000);
if (nichtMessbar.length) {
  console.log(`${nichtMessbar.length} Gegenprobe(n) zurückgestellt — ihr Prüfer kann nichts messen:`);
  for (const e of nichtMessbar) console.log(`  ⃠ ${e.pruefer}: ${e.was}`);
  console.log('Was nicht gemessen werden kann, ist nicht widerlegt.\n');
}

console.log(`${ergebnisse.length - gescheitert.length - nichtMessbar.length} von `
  + `${ergebnisse.length - nichtMessbar.length} Gegenproben schlagen an `
  + `— ${Math.floor(dauer / 60)} min ${dauer % 60} s, ${gesparteLaeufe} `
  + `${gesparteLaeufe === 1 ? 'Prüferlauf' : 'Prüferläufe'} gespart.\n`);

if (zurueckgestellt.length) {
  console.log(`${zurueckgestellt.length} Gegenprobe(n) zu Browserproben zurückgestellt `
    + '— mit --mit-browser laufen sie mit:');
  for (const p of zurueckgestellt) console.log(`  · ${p.pruefer}: ${p.was}`);
  console.log('');
}

if (OHNE_GEGENPROBE.length && !nurEine) {
  console.log('Ohne Gegenprobe, mit Grund:');
  for (const o of OHNE_GEGENPROBE) {
    console.log(`  · ${o.pruefer}`);
    console.log(`      ${o.warumKeine}`);
  }
  console.log('');
}

if (befund.unerklaert.length) {
  console.log(`${befund.unerklaert.length} Prüfer ohne Gegenprobe und ohne Grund: ${befund.unerklaert.join(', ')}`);
  console.log('Ein Prüfer ohne Gegenprobe ist eine Behauptung.');
  process.exitCode = 1;
} else if (gescheitert.length === 0) {
  console.log('Jeder Prüfer im Register hat gezeigt, dass er anschlägt — oder sagt, warum nicht.');
  console.log('Eine Gegenprobe, die man nicht anschlagen sieht, ist keine.');
}

if (gescheitert.length) process.exitCode = 1;
