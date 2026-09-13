#!/usr/bin/env node
/**
 * Liegt die Ablage an einem Ort, der Kundendaten aushält?
 *
 *   npm run pruefe-ablage
 *
 * **Der Anlass, 4. September 2026.** Die Ablage ist fertig: Nummernkreis nach
 * § 11 UStG, Aufbewahrung nach § 132 BAO, ein Journal aus Zeilen, das nur
 * wächst. Was fehlt, ist die Frage, wo diese Zeilen liegen — und dieses
 * Verzeichnis ist öffentlich.
 *
 * > **Für Einkaufspreise gibt es diese Prüfung seit dem 26. August. Für
 * > Kundendaten gibt es sie nicht, weil es noch keine gibt.**
 *
 * Genau deshalb steht sie hier: Eine Sperre, die erst nach dem ersten
 * Datensatz kommt, kommt zu spät — die Geschichte des Verzeichnisses behält
 * ihn.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import {
  ABLAGEORT, auszugsbefund, auszugszeitraum, belegordner, durchschriftenbefund, istBeleg,
  istBuchhaltung, istJournal, istStandkopie, ortsbefund,
} from '../src/ablageort.js';
import { ausJournal } from '../src/speicher.js';
import { luecken } from '../src/vorgangsstand.js';

const SHOP = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO = dirname(SHOP);

const getrackt = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
  .split('\n').filter(Boolean);

/**
 * Auch die ungetrackten Journale finden — sie sind der Fall vor dem Schaden.
 *
 * **Und seit dem 11. September die Durchschriften.** Neben dem Journal liegt
 * je Geschäftsjahr der Beleg selbst, und er trägt dieselben Daten im Klartext:
 * Name, Anschrift, Betrag. Eine Sperre, die nur die eine der beiden Dateiarten
 * kennt, deckt die Hälfte.
 */
const journaldateien = [];
const belegdateien = [];
// **Seit dem 12. September auch der Auszug für die Buchhaltung.** Er trägt die
// Beträge und Betreffs einer ganzen Periode in einer einzigen Datei.
const auszuege = [];
const gehe = (ordner, aufnehmen) => {
  for (const name of readdirSync(ordner)) {
    if (name === 'node_modules' || name === '.git') continue;
    const voll = join(ordner, name);
    if (statSync(voll).isDirectory()) gehe(voll, aufnehmen);
    else aufnehmen(name, voll);
  }
};
gehe(REPO, (name, voll) => {
  if (istJournal(name)) journaldateien.push(relative(REPO, voll));
  else if (istBeleg(name)) belegdateien.push(relative(REPO, voll));
  else if (istBuchhaltung(name)) auszuege.push(relative(REPO, voll));
});

/**
 * **Der Prüfer konnte nie auf eine Probeakte zeigen — 12. September 2026.**
 *
 * `npm run bestellprobe` baut seit dem 11. September eine vollständige Akte in
 * einem Wegwerfordner: Bestellung, Angebot, Rechnung mit Durchschrift,
 * Gutschrift, Buchhaltungsauszug. Sie entsteht **mit den Werkzeugen dieses
 * Hauses**, und sie ist die einzige Akte, die es gibt — die echte unter
 * `ablage/` ist leer, weil noch kein Geschäft stattgefunden hat.
 *
 * > **Dieser Prüfer las bis hierher nur das Verzeichnis.** Alle seine Regeln
 * > sind an von Hand gebauten Beispielen gezeigt worden und noch nie an einer
 * > Akte, die die Werkzeuge selbst erzeugt haben.
 *
 * Das sind die zwei Hälften, die zusammengehören: Die Probe zeigt, dass die
 * Werkzeuge eine Akte **bauen**; der Prüfer zeigt, dass eine Akte **trägt**.
 * Solange sie sich nicht treffen, kann die gebaute Akte an jeder Regel
 * vorbeilaufen, und niemand sähe es.
 *
 * Der Ortsbefund bleibt davon unberührt: Er fragt, ob eine Datei mit
 * Kundendaten außerhalb von `ablage/` **im Verzeichnis** liegt, und ein
 * Wegwerfordner in `/tmp` liegt dort nicht.
 */
const probenwurzel = process.env.VORGANG_ABLAGE && existsSync(process.env.VORGANG_ABLAGE)
  && !process.env.VORGANG_ABLAGE.startsWith(REPO)
  ? process.env.VORGANG_ABLAGE
  : null;
const probe = { journale: [], belege: [], auszuege: [] };
if (probenwurzel) {
  gehe(probenwurzel, (name, voll) => {
    if (istJournal(name)) probe.journale.push(relative(probenwurzel, voll));
    else if (istBeleg(name)) probe.belege.push(relative(probenwurzel, voll));
    else if (istBuchhaltung(name)) probe.auszuege.push(relative(probenwurzel, voll));
  });
}

/*
 * **Alle `.gitignore`, nicht nur die der Wurzel — 5. September 2026, abends.**
 *
 * Gefunden von `npm run reichweite`: `shop/.gitignore` wird von keinem
 * Prüfer geöffnet. Sie enthält heute eine Zeile (`veroeffentlichung/`) und
 * ist damit belanglos — aber genau hier liegt die Sperre, die verhindert,
 * dass das Journal mit Namen, Anschriften und Beträgen ins öffentliche
 * Verzeichnis wandert.
 *
 * Eine `.gitignore` in einem Unterordner kann eine Regel der Wurzel mit
 * `!muster` **aufheben**. Ein Prüfer, der nur die Wurzel liest, sähe die
 * Aufhebung nicht und meldete die Sperre als bestehend.
 *
 * > **Eine Sperre gegen Kundendaten, geprüft an einer von zwei Dateien, die
 * > sie aufheben können.**
 *
 * Gelesen werden deshalb alle — aneinandergehängt, wie git sie auch
 * anwendet: die spätere gewinnt.
 */
const gitignoreDateien = [];
{
  const suche = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      if (['node_modules', '.git', 'ausgabe'].includes(eintrag.name)) continue;
      const voll = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) { suche(voll); continue; }
      if (eintrag.name === '.gitignore') gitignoreDateien.push(voll);
    }
  };
  suche(REPO);
}
const gitignore = gitignoreDateien.map((d) => readFileSync(d, 'utf8')).join('\n');

const ort = ortsbefund({ gitignore, getrackt, journaldateien, belegdateien, auszuege });

/**
 * **Das Journal gegen die Durchschriften — in beide Richtungen.**
 *
 * Bis zum 11. September schrieb `--ablegen` eine Zeile und druckte den Beleg
 * auf den Bildschirm; nach dem Schließen des Fensters gab es das Papier nicht
 * mehr. § 132 BAO verlangt die Belege sieben Jahre, § 11 Abs 2 UStG vom
 * Aussteller eine Durchschrift jeder Rechnung.
 *
 * Gelesen wird nur, was in der Ablage liegt, und **ausgegeben wird nichts
 * daraus** — Belegnummern und Dateinamen, keine Inhalte. Ein Prüfer, der
 * Kundendaten in sein Protokoll schreibt, verlegt sie an einen dritten Ort.
 */
/*
 * **Die datierte Kopie zählt für den Ort, nicht für den Abgleich.**
 *
 * Seit heute abend erkennen die drei Muster auch den Stand aus `.sicherung`
 * — `journal-2026-2026-09-12T19-42-04.jsonl` trägt dieselben Kundendaten und
 * war bis dahin für jede Sperre unsichtbar. Für den **Ortsbefund** ist das
 * genau richtig: Er fragt, ob so eine Datei außerhalb von `ablage/` liegt.
 *
 * Für den **Abgleich** wäre es falsch: Eine Kopie des Journals ist kein
 * zweites Journal, und eine Kopie der Durchschrift kein zweites Papier. Wer
 * sie mitzählt, meldet jede gesicherte Akte als doppelt geführt.
 */
const lebend = ({ pfad }) => !istStandkopie(pfad);
const alleJournale = [
  ...journaldateien.map((pfad) => ({ basis: REPO, pfad })),
  ...probe.journale.map((pfad) => ({ basis: probenwurzel, pfad })),
].filter(lebend);
const alleAuszuege = [
  ...auszuege.map((pfad) => ({ basis: REPO, pfad })),
  ...probe.auszuege.map((pfad) => ({ basis: probenwurzel, pfad })),
].filter(lebend);

const durchschriften = [];
const eintraegeJeJahr = new Map();
for (const { basis, pfad: journalpfad } of alleJournale) {
  const jahr = Number(journalpfad.match(/journal-(\d{4})\.jsonl$/)?.[1]);
  const ordner = join(basis, dirname(journalpfad), belegordner(jahr));
  // **Gelesen wird der Inhalt, nicht nur der Name — 12. September 2026.**
  // Die Zahlen der Journalzeile stehen ein zweites Mal auf dem Papier; nur so
  // fällt eine nachträglich geänderte Zeile auf. Ausgegeben wird davon
  // nichts: Ein Prüfer, der Kundendaten in sein Protokoll schreibt, verlegt
  // sie an einen dritten Ort.
  const dateien = existsSync(ordner)
    ? readdirSync(ordner).filter(istBeleg).map((name) => {
      const voll = join(ordner, name);
      return { name, zeichen: statSync(voll).size, text: readFileSync(voll, 'utf8') };
    })
    : [];
  const ablage = ausJournal(readFileSync(join(basis, journalpfad), 'utf8'));
  // Der Schlüssel trägt die Wurzel mit: Die laufenden Nummern einer Probeakte
  // und die des Verzeichnisses gehören nicht in denselben Topf.
  const schluessel = `${basis}|${jahr}`;
  eintraegeJeJahr.set(schluessel, [
    ...(eintraegeJeJahr.get(schluessel) ?? []), ...ablage.eintraege,
  ]);
  const befund = durchschriftenbefund({ eintraege: ablage.eintraege, dateien });
  durchschriften.push({ journalpfad, ...befund });
}

/**
 * **Der Auszug gegen das Journal — 12. September 2026, abends.**
 *
 * Die dritte Dateiart der Ablage war bis hierher nur auf ihren **Ort**
 * geprüft. Sie ist die einzige, die das Haus verlässt: Aus ihr entsteht die
 * Umsatzsteuervoranmeldung (§ 21 Abs 1 UStG). Und sie altert lautlos, weil
 * das Journal nur wächst.
 *
 * Verglichen werden laufende Nummern, und die laufen je Geschäftsjahr neu —
 * deshalb bekommt jeder Auszug die Einträge **seines** Jahres.
 */
const auszugslage = alleAuszuege.map(({ basis, pfad }) => ({
  name: pfad,
  text: readFileSync(join(basis, pfad), 'utf8'),
  jahr: Number(auszugszeitraum(pfad)?.slice(0, 4)),
  basis,
}));
const auszugsmeldungen = auszugslage.flatMap((a) => auszugsbefund({
  auszuege: [a],
  eintraege: eintraegeJeJahr.get(`${a.basis}|${a.jahr}`) ?? [],
}).meldungen);

/**
 * **Die Voraussetzungen, je Vorgang — 13. September 2026.**
 *
 * Seit gestern gibt es die Regel, dass eine Lieferantenbestellung und eine
 * Rechnung den Vertragsschluss voraussetzen (AGB Punkt 2). Gelesen hat sie
 * bis heute nur `npm run akte` — also das Werkzeug, das jemand **aufschlägt**.
 *
 * > **Die Bestellprobe baute eine Akte mit genau dieser Lücke und meldete
 * > „der Weg trägt".** Ihr dreizehnter Schritt fragt diesen Prüfer, und der
 * > verglich Journal, Durchschriften und Auszug — von Voraussetzungen wusste
 * > er nichts.
 *
 * § 131 Abs 1 Z 5 BAO verlangt den Geschäftsfall rückführbar. Eine Akte, in
 * der ein Entgelt ohne die Vereinbarung steht, aus der es folgt, ist es
 * nicht. Gelesen werden **Arten**, kein Inhalt.
 */
/*
 * **Über alle Jahre einer Ablage — 13. September 2026.** Hier stand die
 * Gruppierung je **Jahr**, und ein Geschäftsfall über den Jahreswechsel
 * bekam damit einen Fehlalarm: Angebot und Auftragsbestätigung im Dezember,
 * Rechnung im Jänner — gemeldet wurde „rechnung liegt in der Akte,
 * auftragsbestaetigung nicht", obwohl sie zwei Zeilen weiter oben steht.
 *
 * > **Ein Prüfer, der bei einem gewöhnlichen Geschäftsfall rot wird, wird
 * > abgeschaltet** — und mit ihm die Regeln, die er sonst hält.
 *
 * Die laufende Nummer beginnt je Journal neu, der Belegordner hängt am Jahr,
 * der Buchhaltungsauszug auch. Der **Geschäftsfall** hängt an keinem von
 * beiden.
 */
const luekenmeldungen = [];
const jeWurzel = new Map();
for (const [schluessel, eintraege] of eintraegeJeJahr) {
  const wurzel = schluessel.split('|')[0];
  jeWurzel.set(wurzel, [...(jeWurzel.get(wurzel) ?? []), ...eintraege]);
}
for (const eintraege of jeWurzel.values()) {
  const jeVorgang = new Map();
  for (const e of eintraege) {
    if (!e.vorgang) continue;
    jeVorgang.set(e.vorgang, [...(jeVorgang.get(e.vorgang) ?? []), e]);
  }
  for (const [vorgang, zeilen] of jeVorgang) {
    for (const l of luecken(zeilen)) {
      luekenmeldungen.push({
        regel: 'voraussetzung-fehlt',
        text: `Vorgang ${vorgang}: ${l.papier} liegt in der Akte, ${l.braucht} nicht `
          + `— ${l.warum}`,
      });
    }
  }
}

const meldungen = [
  ...ort.meldungen,
  ...durchschriften.flatMap((d) => d.meldungen),
  ...auszugsmeldungen,
  ...luekenmeldungen,
];
const geprueft = ort.geprueft;

console.log(`Ablageort — ${geprueft} getrackte Dateien angesehen, `
  + `${journaldateien.length} Journaldateien, ${belegdateien.length} Durchschriften und `
  + `${auszuege.length} Buchhaltungsauszüge gefunden\n`);
if (probenwurzel) {
  console.log(`  Dazu eine Probeakte aus VORGANG_ABLAGE: ${probe.journale.length} Journal(e), `
    + `${probe.belege.length} Durchschrift(en), ${probe.auszuege.length} Auszug/Auszüge.`);
  console.log('  Sie zählt nicht zum Ortsbefund — sie liegt nicht im Verzeichnis.\n');
}
for (const d of durchschriften) {
  console.log(`  ${d.journalpfad}: ${d.geprueft} Eintrag/Datei abgeglichen`);
}
for (const a of auszugslage) {
  console.log(`  ${a.name}: gegen das Journal ${a.jahr} gehalten`);
}
if (durchschriften.length || auszugslage.length) console.log('');
console.log(`  ${gitignoreDateien.length} .gitignore gelesen: `
  + `${gitignoreDateien.map((d) => relative(REPO, d)).join(', ')}\n`);

if (meldungen.length === 0) {
  console.log(`Keine Meldung. ${ABLAGEORT}/ ist gesperrt, kein Journal und keine`);
  console.log('Durchschrift liegt woanders, zu jeder Journalzeile gibt es den Beleg, und');
  console.log('jeder Buchhaltungsauszug deckt sich mit dem Journal seiner Periode.');
  console.log('Kein Papier liegt darin, dessen Voraussetzung fehlt.');
  console.log('Eine Sperre, die erst nach dem ersten Datensatz kommt, kommt zu spät.');
  process.exit(0);
}

for (const m of meldungen) console.log(`  ✗ ${m.text}  [${m.regel}]`);
console.log(`\n${meldungen.length} Meldung(en).`);
process.exit(1);
