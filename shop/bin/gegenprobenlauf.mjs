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

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { geschaeftstag } from '../src/geschaeftszeit.js';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  GEGENPROBEN, OHNE_GEGENPROBE, neueMeldungen, registerbefund,
  fundstellen, mutiere, ankerbeschreibung, MUSTER_HOECHSTLAENGE,
} from '../src/gegenprobenregister.js';
import { laufzahl, nachPrueferGruppiert, vorlaufEntfaellt } from '../src/gegenprobenplan.js';
import { baumabdruck, baumbefund, bewegungstext } from '../src/baumstand.js';
import { markiere, nimmAb, offeneMarken, stelleZurueck } from '../src/mutationsschutz.js';
import { richteHakenEin } from './hakeneinrichtung.mjs';
import { PRUEFER, BROWSERPRUEFER } from '../src/pruefregister.js';
import { LESER } from '../src/erzeugnisstand.js';
import { einzugsgebiet, mussLaufen } from '../src/einzugsgebiet.js';
import { alsDatei, befehlFuer, mitZeuge, zeugeAus } from '../src/zeugen.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const laufe = (name) => {
  const r = spawnSync('npm', ['run', '--silent', name], { cwd: SHOP, encoding: 'utf8' });
  return { gruen: r.status === 0, ausgang: r.status, ausgabe: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

/**
 * **Der Zeugenstand — 12. September 2026.** Wo bekannt ist, welche Testdatei
 * eine Gegenprobe fängt, läuft nur sie statt der ganzen Reihe. Siehe
 * `src/zeugen.js`; der Stand steht in `zeugen.json` neben `package.json`.
 */
const ZEUGENDATEI = join(SHOP, 'zeugen.json');
/*
 * **Und ein Mitschrieb, der einen Abbruch überlebt.** Der Stand wird erst am
 * Ende geschrieben — eine Datei, die mitten im Lauf entsteht, wäre genau die
 * Bewegung, über der dieser Läufer nicht messen will. Ein Lauf, der die 57
 * Testzeugen einsammelt, dauert aber gut anderthalb Stunden, und ein `SIGKILL`
 * darin verlöre alles.
 *
 * Der Mitschrieb liegt deshalb unter `.sicherung/` — demselben Ordner wie die
 * Zettel des Mutationsschutzes, und der steht in `NICHT_HINEIN`: Der
 * Baumabdruck sieht ihn nicht.
 */
const ZEUGENLAUF = join(SHOP, '.sicherung', 'zeugen-lauf.json');
let zeugen = existsSync(ZEUGENDATEI) ? JSON.parse(readFileSync(ZEUGENDATEI, 'utf8')) : {};
if (existsSync(ZEUGENLAUF)) {
  const mitgeschrieben = JSON.parse(readFileSync(ZEUGENLAUF, 'utf8'));
  const neue = Object.keys(mitgeschrieben).filter((id) => !zeugen[id]);
  zeugen = { ...zeugen, ...mitgeschrieben };
  if (neue.length) {
    console.log(`Aus einem abgebrochenen Lauf übernommen: ${neue.length} Zeuge(n).\n`);
  }
}
// Ein Zeuge, den es nicht mehr gibt, ist keiner — dann läuft wieder die Reihe.
zeugen = Object.fromEntries(Object.entries(zeugen)
  .map(([id, dateien]) => [id, dateien.filter((d) => existsSync(join(REPO, d)))])
  .filter(([, dateien]) => dateien.length));
let zeugenGeaendert = false;
let mitZeugenGelaufen = 0;

/** Läuft die Testreihe — ganz oder, wenn ein Zeuge bekannt ist, nur ihn. */
const laufeTest = (dateien) => {
  if (!dateien?.length) return laufe('test');
  mitZeugenGelaufen += 1;
  const r = spawnSync(process.execPath, ['--test', ...dateien.map((d) => join(REPO, d))],
    { cwd: SHOP, encoding: 'utf8' });
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

/*
 * **Der Testlauf gehört dazu — 9. September 2026, nachts.**
 *
 * Er steht in keinem `LESER`-Eintrag, weil sein Befehl kein Werkzeug aus
 * `bin/` nennt (`node --test test/*.test.js`). Gelesen hat er die Erzeugnisse
 * trotzdem immer: fünfunddreißig Testdateien lesen `ausgabe/site`.
 *
 * Aufgefallen ist es in der Nacht, in der `test/erzeugnisfrische.test.js`
 * dazukam. Seither **sagt** der Testlauf, wenn das Erzeugnis veraltet ist —
 * und im Gegenprobenlauf ist es das nach jeder Mutation. Die erste Probe am
 * Prüfer `test` schlug an, alle folgenden meldeten „war schon vorher rot".
 *
 * > **Eine neue Regel, die eine bestehende Messung unmöglich macht, ist keine
 * > Verschärfung, sondern ein Ausfall.**
 *
 * Er wird deshalb wie jeder andere Erzeugnisleser vor dem Lauf gebaut.
 */
ERZEUGNISLESER.add('test');

/** Läuft den Prüfer — und baut vorher, wenn er ein Erzeugnis liest. */
const laufeMitBau = (name, zeugendateien = null) => {
  if (ERZEUGNISLESER.has(name)) baue();
  // Gebaut wird auch für den Zeugen: Fünfunddreißig Testdateien lesen
  // `ausgabe/site`, und welche davon der Zeuge ist, weiß hier niemand.
  if (name === 'test') return laufeTest(zeugendateien);
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
  // `messliste` hinterher, seit `pruefe-punkte` sie liest: Sie wird aus
  // `ausgabe/kampagne/keywords.csv` geschrieben, also aus dem, was der Schritt
  // davor gerade erneuert hat. Ohne sie stünde die frische Kampagne neben
  // einer Messliste von gestern, und der Prüfer vergliche die Aufgabenliste
  // mit einer überholten Zahl.
  spawnSync('npm', ['run', '--silent', 'messliste'], { cwd: SHOP, encoding: 'utf8' });
  return spawnSync('npm', ['run', '--silent', 'website'], { cwd: SHOP, encoding: 'utf8' });
};

const mitBrowser = process.argv.includes('--mit-browser');
// `--seit <stand>` trägt einen Wert; er ist kein Gegenprobenname. Ohne diese
// Zeile las der Läufer „HEAD~1" als gesuchte Kennung und brach ab.
const argumente = process.argv.slice(2);
const nurEine = argumente.find(
  (a, i) => !a.startsWith('--') && argumente[i - 1] !== '--seit',
) ?? null;

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
/**
 * **Auswahl nach dem Einzugsgebiet — 12. September 2026.**
 *
 * Der Gesamtlauf braucht 109 Minuten, davon 105 hier. Zwischen zwei Runden
 * fährt ihn niemand, und genau deshalb standen zwei stumpfe Gegenproben zwölf
 * Runden lang da. Gate 38 hat diese Frage für die Prüfer beantwortet; hier
 * ist sie es bis heute nicht gewesen.
 *
 * `--seit <stand>` fährt nur, was sich seit diesem Stand geändert haben kann.
 * **Welche Dateien das sind, rechnet `src/einzugsgebiet.js` aus** — aus den
 * Einfuhren des Prüfers, den Pfaden, die er als Zeichenkette nennt, und der
 * Frage, ob er einen ganzen Ordner liest. Eine Auswahl nach der mutierten
 * Datei allein wäre falsch: Die Runde davor hat eine Gegenprobe gefunden, die
 * stumpf wurde, weil sich eine **andere** Datei des Prüfers geändert hatte.
 *
 * Zurückgestellt heißt hier **nicht** grün. Die Auswahl sagt bei jeder Zeile,
 * warum sie nicht gelaufen ist, und der Gesamtlauf fährt weiter alles.
 */
const seitStand = (() => {
  const i = process.argv.indexOf('--seit');
  return i >= 0 ? (process.argv[i + 1] ?? 'HEAD') : null;
})();

const browsernamen = new Set(BROWSERPRUEFER.map((p) => p.name));
const zurueckgestellt = (!nurEine && !mitBrowser)
  ? GEGENPROBEN.filter((p) => browsernamen.has(p.pruefer))
  : [];
const nachGebiet = nurEine
  ? GEGENPROBEN.filter((p) => p.id === nurEine || p.pruefer === nurEine)
  : GEGENPROBEN.filter((p) => mitBrowser || !browsernamen.has(p.pruefer));

/** Die Gebiete je Prüfer — nur gerechnet, wenn ausgewählt werden soll. */
const uebersprungen = [];
const gewaehlt = (() => {
  if (!seitStand) return nachGebiet;
  const roh = execFileSync('git', ['diff', '--name-only', seitStand], { cwd: REPO, encoding: 'utf8' });
  const geaendert = new Set(roh.split('\n').filter(Boolean));
  console.log(`Auswahl seit ${seitStand}: ${geaendert.size} geänderte Datei(en).\n`);

  const lies = (pfad) => { try { return readFileSync(join(REPO, pfad), 'utf8'); } catch { return null; } };
  const gibtEs = (pfad) => existsSync(join(REPO, pfad));
  const gebiete = new Map();
  for (const p of PRUEFER) {
    gebiete.set(p.name, einzugsgebiet(`shop/bin/${p.werkzeug}`, lies, { gibtEs }));
  }
  /*
   * **Der Prüfer „test" ist kein Werkzeug, sondern neunzig Dateien.** Sein
   * Gebiet je Gegenprobe sind genau die Testdateien, die die mutierte Datei
   * über ihre Einfuhren erreichen — die möglichen Zeugen. Erreicht sie keine,
   * bleibt das Gebiet unbekannt, und dann läuft sie.
   */
  const testdateien = readdirSync(join(SHOP, 'test'))
    .filter((n) => n.endsWith('.test.js')).map((n) => `shop/test/${n}`);
  const testgebiete = testdateien.map((d) => [d, einzugsgebiet(d, lies, { gibtEs })]);

  return nachGebiet.filter((p) => {
    let urteil;
    if (p.pruefer === 'test') {
      const zeugen = testgebiete.filter(([, g]) => g.dateien.has(p.datei));
      const vereint = zeugen.length
        ? {
          dateien: new Set(zeugen.flatMap(([d, g]) => [d, ...g.dateien])),
          offenesGebiet: zeugen.some(([, g]) => g.offenesGebiet),
        }
        : null;
      urteil = mussLaufen(p, geaendert, new Map([['test', vereint]]));
    } else {
      urteil = mussLaufen(p, geaendert, gebiete);
    }
    if (!urteil.laufen) uebersprungen.push({ ...p, grund: urteil.grund });
    return urteil.laufen;
  });
})();
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
/*
 * **Der Haken zuerst, dann die erste Mutation — 8. September 2026.**
 *
 * An diesem Tag rief ein Commit dieses Loops `git add -A`, während hier die
 * Gegenproben liefen; die gerade offene Mutation ging mit und stellte einen
 * Prüfer blind. Der Satz „wer währenddessen committet, committet die
 * Mutation" stand seit dem 4. September im Kopf der Mutationsprüfung — als
 * Warnung an einen Leser. Committet wird hier aber von einem Programm.
 *
 * > **Der Schutz gehört zu der Stelle, die die Gefahr erzeugt.** Diese Zeile
 * > macht die Dateien absichtlich falsch; sie stellt deshalb auch den Haken
 * > auf, der einen Commit so lange aufhält.
 */
const haken = richteHakenEin(REPO);
console.log(haken.geaendert
  ? `Haken gesetzt: core.hooksPath → ${haken.weg}\n`
  : `Haken steht: core.hooksPath → ${haken.weg}\n`);

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

/**
 * Schreibt einer geschlagenen Browsergegenprobe ihr Datum.
 *
 * **Warum überhaupt geschrieben wird.** Die vier zurückgestellten Proben
 * liefen zwischen dem 5. und dem 10. September kein einziges Mal, obwohl der
 * Lauf ihre Namen jedes Mal druckte. Ein Vermerk, den ein Mensch nachtragen
 * müsste, hätte dasselbe Schicksal.
 */
function vermerkeBrowserprobe(id, sekunden) {
  const pfad = join(SHOP, 'data', 'browserproben.json');
  if (!existsSync(pfad)) return;
  try {
    const v = JSON.parse(readFileSync(pfad, 'utf8'));
    v.proben = v.proben ?? {};
    v.proben[id] = { am: geschaeftstag(), sekunden };
    writeFileSync(pfad, `${JSON.stringify(v, null, 2)}\n`);
  } catch {
    // Ein Vermerk, der nicht zu schreiben ist, darf den Lauf nicht abbrechen —
    // der Prüfer daneben meldet dann zu Recht „zu lange her".
  }
}
let gesparteLaeufe = 0;
let voriges = null;

const ergebnisse = [];

/*
 * **Der Abdruck des Bestands — 8. September 2026.**
 *
 * Ein Gesamtlauf meldete sieben Proben gegen `npm test` rot, fünf davon mit
 * „war schon vorher rot". Am Bestand war nichts; gearbeitet wurde an der
 * nächsten Runde, während der Lauf lief. Der Satz ist richtig und traf den
 * Falschen. Verglichen wird gegen die **vorige** Probe, damit jede Meldung
 * sagt, was sich seit dem letzten Messpunkt bewegt hat.
 */
let letzterAbdruck = baumabdruck(REPO);

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
    const jetzt = baumabdruck(REPO);
    const baum = baumbefund(letzterAbdruck, jetzt);
    letzterAbdruck = jetzt;

    // Über einem Bestand, der sich bewegt, wird gar nicht erst gemessen: Ein
    // Prüferlauf kostet hier bis zu fünfzig Sekunden, und sein Ergebnis wäre
    // eine Aussage über einen Zustand, den es beim Lesen nicht mehr gibt.
    const meinZeuge = p.pruefer === 'test' ? (zeugen[p.id] ?? null) : null;
    const meinBefehl = befehlFuer(p, zeugen);
    const wieder = baum.ruhig && vorlaufEntfaellt({ ...voriges }, { ...p, befehl: meinBefehl })
      ? voriges.zurueck : null;
    if (wieder) gesparteLaeufe += 1;
    const vor = baum.ruhig
      ? (wieder ?? laufeMitBau(p.pruefer, meinZeuge))
      : { gruen: false, ausgang: -1, ausgabe: '' };
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
    if (!baum.ruhig) {
      schritte.push(bewegungstext(baum));
      urteil = 'nicht messbar';
    } else if (vor.ausgang === 2) {
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
      const mutiert = p.art === 'anhaengen' ? vorher + p.text : mutiere(vorher, p);

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
      const stellen = p.art === 'ersetzen' ? fundstellen(vorher, p) : [];
      const treffer = p.art === 'ersetzen' ? stellen.length : 1;
      /*
       * **Seit dem 10. September auch für Muster.** Ein Suchtext zeigt im
       * Register, was er ersetzt; ein Muster zeigt es nicht und kann still weit
       * mehr fassen, als beim Schreiben gemeint war. Dann liefe eine andere
       * Mutation als die beschriebene, und ihr Ergebnis sagte über die gemeinte
       * Stelle nichts.
       */
      const zuLang = stellen.slice(0, p.alle ? stellen.length : 1)
        .find((s) => p.suchenMuster && s.laenge > MUSTER_HOECHSTLAENGE);
      if (p.art === 'ersetzen' && !p.alle && treffer > 1) {
        schritte.push(`${ankerbeschreibung(p)} kommt ${treffer}-mal vor — mutiert würde die `
          + 'erste Stelle, und das ist nicht unbedingt die gemeinte');
        urteil = 'mehrdeutig';
      } else if (zuLang) {
        schritte.push(`${ankerbeschreibung(p)} fasst ${zuLang.laenge} Zeichen — mehr als die `
          + `erlaubten ${MUSTER_HOECHSTLAENGE}; ersetzt würde mehr, als im Register steht`);
        urteil = 'mehrdeutig';
      } else if (mutiert === vorher) {
        schritte.push(p.art === 'ersetzen'
          ? `nicht gefunden: ${ankerbeschreibung(p)}`
          : 'Mutation hat nichts geändert');
        urteil = 'nicht angekommen';
      } else {
        // Der Zettel geht **vor** die Mutation. Danach wäre er ein Zettel für
        // den Fall, der zwischen beiden Zeilen nicht mehr eintreten kann.
        markiere(pfad, vorher, `gegenprobenlauf.mjs (${p.id})`, p.was);
        writeFileSync(pfad, mutiert);
        if (p.baueVorher) baue();
        const nach = laufeMitBau(p.pruefer, meinZeuge);
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
          /*
           * **Hier entsteht der Zeuge.** Rot ist der Prüfer, die Erwartung
           * passt — jetzt steht in der Ausgabe, welche Testdatei ihn gefangen
           * hat. Beim nächsten Lauf muss dafür nicht die ganze Reihe fahren.
           */
          if (p.pruefer === 'test') {
            const gefunden = zeugeAus(nach.ausgabe);
            const fort = mitZeuge(zeugen, p.id, gefunden);
            zeugen = fort.stand;
            zeugenGeaendert = zeugenGeaendert || fort.geaendert;
            if (fort.geaendert) {
              mkdirSync(dirname(ZEUGENLAUF), { recursive: true });
              writeFileSync(ZEUGENLAUF, alsDatei(zeugen), 'utf8');
            }
            if (gefunden.length && !meinZeuge) {
              schritte.push(`Zeuge: ${gefunden.join(', ')}`);
            }
          }
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
    /*
     * **Der Vermerk schreibt sich selbst, seit dem 10. September 2026.** Die
     * zurückgestellten Browserproben tragen ihr Datum in
     * `data/browserproben.json`, und `npm run pruefe-browserproben` lässt eine
     * Zurückstellung nach vierzehn Tagen wieder als ungeprüft gelten. Von Hand
     * gepflegt wäre dieser Vermerk genau das, wogegen er gebaut ist: ein
     * Handgriff, an den sich niemand erinnert.
     */
    if (browsernamen.has(p.pruefer)) vermerkeBrowserprobe(p.id, Math.round((Date.now() - seit) / 1000));
    // Derselbe Befehl wie der Lauf darüber — auch mit einem Zeugen, der eben
    // erst gefunden wurde. Sonst wäre der gesparte Vorlauf der nächsten Probe
    // ein anderer Lauf als der, den sie braucht.
    const zurueck = laufeMitBau(p.pruefer, p.pruefer === 'test' ? (zeugen[p.id] ?? null) : null);
    if (zurueck.gruen) {
      // Genau dieser Lauf ist der „vorher grün"-Lauf der nächsten Probe am
      // selben Prüfer: Die Datei steht byteweise wieder da, geprüft eine
      // Zeile weiter oben.
      voriges = { pruefer: p.pruefer, befehl: befehlFuer(p, zeugen), urteil: 'geschlagen', zurueck };
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

/*
 * **Der Zeugenstand wird am Ende geschrieben, nicht zwischendurch.** Der
 * Läufer prüft vor jeder Probe, ob sich der Bestand bewegt hat, und stellt
 * eine Messung über einem bewegten Bestand zurück. Eine Datei, die er selbst
 * mitten im Lauf schreibt, wäre genau diese Bewegung.
 */
if (zeugenGeaendert) {
  writeFileSync(ZEUGENDATEI, alsDatei(zeugen), 'utf8');
  if (existsSync(ZEUGENLAUF)) rmSync(ZEUGENLAUF);
  console.log(`Zeugenstand nachgezogen: ${Object.keys(zeugen).length} von `
    + `${GEGENPROBEN.filter((p) => p.pruefer === 'test').length} Testgegenproben `
    + 'kennen ihre Testdatei.\n');
}
if (mitZeugenGelaufen) {
  console.log(`${mitZeugenGelaufen} Lauf/Läufe gingen gegen den Zeugen statt gegen die ganze `
    + 'Testreihe. Fängt den Fall inzwischen ein anderer Testfall, meldet der Zeuge grün —\n'
    + 'das ist ein falscher Alarm und kein falsches Grün.\n');
}

const nichtMessbar = ergebnisse.filter((e) => e.urteil === 'nicht messbar');
const gescheitert = ergebnisse.filter((e) => e.urteil !== 'geschlagen' && e.urteil !== 'nicht messbar');

const dauer = Math.round((Date.now() - begonnen) / 1000);
if (nichtMessbar.length) {
  // **Verallgemeinert am 8. September.** Hier stand „ihr Prüfer kann nichts
  // messen" — das trifft die Weigerung wegen fehlender Grundlage und nicht den
  // zweiten Fall, der seit heute dazugehört: einen Bestand, der sich unter dem
  // Lauf bewegt hat. Der Grund steht jetzt bei jeder Zeile statt in der
  // Überschrift.
  console.log(`${nichtMessbar.length} Gegenprobe(n) zurückgestellt — nicht messbar:`);
  for (const e of nichtMessbar) {
    console.log(`  ⃠ ${e.pruefer}: ${e.was}`);
    if (e.schritte[0]) console.log(`      ${e.schritte[0]}`);
  }
  console.log('Was nicht gemessen werden kann, ist nicht widerlegt.\n');
}

console.log(`${ergebnisse.length - gescheitert.length - nichtMessbar.length} von `
  + `${ergebnisse.length - nichtMessbar.length} Gegenproben schlagen an `
  + `— ${Math.floor(dauer / 60)} min ${dauer % 60} s, ${gesparteLaeufe} `
  + `${gesparteLaeufe === 1 ? 'Prüferlauf' : 'Prüferläufe'} gespart.\n`);

if (uebersprungen.length) {
  console.log(`${uebersprungen.length} Gegenprobe(n) übersprungen — ihr Einzugsgebiet ist seit `
    + `${seitStand} unverändert:`);
  for (const p of uebersprungen.slice(0, 10)) console.log(`  · ${p.pruefer}: ${p.was}`);
  if (uebersprungen.length > 10) console.log(`  · … und ${uebersprungen.length - 10} weitere`);
  console.log('Übersprungen ist nicht grün. Der Gesamtlauf fährt sie alle.\n');
}

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
