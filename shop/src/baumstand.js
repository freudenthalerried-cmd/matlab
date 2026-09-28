/**
 * Hat sich der Arbeitsbaum unter einem laufenden Gegenprobenlauf bewegt?
 *
 * **Der Anlass, 8. September 2026.** Ein Gesamtlauf meldete die Gegenproben
 * rot: sieben Proben gegen `npm test`, fünf davon mit *„war schon vorher rot —
 * an einem roten Prüfer lässt sich nichts zeigen"*. Am Bestand war nichts.
 * Gearbeitet wurde an der nächsten Runde, **während** der Lauf lief, und für
 * ein paar Minuten war `npm test` rot: Eine frisch geschriebene Gegenprobe
 * trug einen Suchtext, dem eine Ersetzung die Einrückung genommen hatte.
 *
 * Der Läufer sah einen roten Prüfer und schrieb den Satz, den er für diesen
 * Fall hat. Der Satz ist richtig und trifft hier den Falschen:
 *
 * > **„War schon vorher rot" meint zweierlei: der Bestand hat einen Fehler —
 * > oder jemand hat unter dem Lauf geschraubt.** Das eine ist ein Befund, das
 * > andere ist keiner.
 *
 * Dieselbe Familie wie zweimal an diesem Tag: Am Vormittag zählte der
 * Gesamtlauf die **Weigerung** eines Prüfers als Befund, bis
 * `⃠ nicht messbar` dazukam; nachmittags nahm ein Commit eine laufende
 * Mutation mit, bis der Haken davorstand. Jedes Mal geht es um denselben
 * Unterschied: *etwas gefunden* gegen *nicht gemessen*.
 *
 * ## Warum der Abdruck über den Inhalt geht und nicht über die Zeit
 *
 * Der Läufer schreibt jede geprüfte Datei zweimal — einmal falsch, einmal
 * zurück. Danach ist ihre Änderungszeit neu und ihr Inhalt derselbe. Ein
 * Abdruck aus Zeitstempeln meldete jede Probe als Bewegung; ein Abdruck aus
 * dem Inhalt meldet genau das, was wirklich anders steht.
 *
 * ## Warum er vor jeder Probe steht und nicht erst im Verdachtsfall
 *
 * Der erste Entwurf zog den zweiten Abdruck erst, wenn ein Prüfer vor der
 * Mutation rot meldete — aus Sorge um die Laufzeit. Gemessen: **377 Dateien in
 * 16 Millisekunden**, bei hundertvierzehn Proben also knapp zwei Sekunden auf
 * zweiunddreißig Minuten.
 *
 * > **Eine Sparmaßnahme, die niemand nachgerechnet hat, kostet den Befund und
 * > spart nichts.**
 *
 * Er steht deshalb vor jeder Probe, und verglichen wird gegen die **vorige**
 * Probe, nicht gegen den Laufbeginn: So sagt jede Meldung, was sich seit dem
 * letzten Messpunkt bewegt hat, statt eine einmalige Bewegung bis zum Ende
 * durchzuschleppen.
 *
 * Und gemeldet wird auch dann, wenn der Prüfer grün bleibt: Eine Probe, die
 * einen anderen Bestand misst als die vorige, hat etwas gezeigt — nur nicht
 * unbedingt das, was in ihrem Registereintrag steht.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Verzeichnisse, die nicht zum Bestand gehören.
 *
 * `ausgabe` steht hier, weil der Läufer selbst baut: Jede Probe mit
 * `baueVorher` schreibt den ganzen Ordner neu, und das ist seine Arbeit, keine
 * fremde Bewegung. `.sicherung` steht hier, weil dort die Zettel des Läufers
 * liegen.
 */
export const NICHT_HINEIN = Object.freeze([
  'node_modules', '.git', 'ausgabe', '.sicherung', 'preise',
]);

/** Endungen, die den Bestand ausmachen. */
export const ENDUNGEN = Object.freeze(['.js', '.mjs', '.json', '.md', '.php', '.html', '.csv']);

/**
 * Inhaltsabdruck aller Bestandsdateien unter `wurzel`.
 *
 * @returns {Map<string, string>} Pfad (relativ, mit `/`) → Kurzhash
 */
export function baumabdruck(wurzel, { nichtHinein = NICHT_HINEIN, endungen = ENDUNGEN } = {}) {
  const abdruck = new Map();
  const gehe = (ordner) => {
    let eintraege;
    try {
      eintraege = readdirSync(ordner, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of eintraege) {
      if (nichtHinein.includes(e.name)) continue;
      const voll = join(ordner, e.name);
      if (e.isDirectory()) {
        gehe(voll);
        continue;
      }
      if (!endungen.some((x) => e.name.endsWith(x))) continue;
      let inhalt;
      try {
        inhalt = readFileSync(voll);
      } catch {
        continue;
      }
      abdruck.set(relative(wurzel, voll).split(sep).join('/'),
        createHash('sha1').update(inhalt).digest('hex').slice(0, 12));
    }
  };
  gehe(wurzel);
  return abdruck;
}

/**
 * Was sich zwischen zwei Abdrücken bewegt hat — ohne das, was der Lauf selbst
 * anfasst.
 *
 * @param {Map<string, string>} vorher
 * @param {Map<string, string>} jetzt
 * @param {string[]} [eigene]  Pfade, die der Lauf gerade selbst hält
 */
export function baumbefund(vorher, jetzt, eigene = []) {
  const nichtZaehlen = new Set(eigene);
  const geaendert = [];
  const dazu = [];
  const weg = [];
  for (const [pfad, hash] of jetzt) {
    if (nichtZaehlen.has(pfad)) continue;
    if (!vorher.has(pfad)) dazu.push(pfad);
    else if (vorher.get(pfad) !== hash) geaendert.push(pfad);
  }
  for (const pfad of vorher.keys()) {
    if (nichtZaehlen.has(pfad) || jetzt.has(pfad)) continue;
    weg.push(pfad);
  }
  const bewegt = [...geaendert, ...dazu, ...weg].sort();
  return {
    bewegt, geaendert: geaendert.sort(), dazu: dazu.sort(), weg: weg.sort(),
    ruhig: bewegt.length === 0,
  };
}

/**
 * Der Satz, den der Läufer schreibt, wenn sich etwas bewegt hat.
 *
 * Er nennt die Dateien, denn ohne sie ist die Meldung dasselbe wie die
 * Anschuldigung, die sie ersetzt: eine Behauptung ohne Nachweis.
 */
export function bewegungstext(befund, hoechstens = 5) {
  const namen = befund.bewegt.slice(0, hoechstens).join(', ');
  const rest = befund.bewegt.length > hoechstens ? ` und ${befund.bewegt.length - hoechstens} weitere` : '';
  return `der Arbeitsbaum hat sich unter dem Lauf bewegt: ${namen}${rest}`
    + ' — an einem Bestand, der sich ändert, lässt sich nichts zeigen';
}
