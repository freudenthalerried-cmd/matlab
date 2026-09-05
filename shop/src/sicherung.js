/**
 * Eine Kopie behalten, bevor etwas überschrieben wird.
 *
 * **Warum es das gibt.** Am 30.08. hat eine Gegenprobe die vertrauliche
 * Preisdatei geleert: Ein Lauf mit halb umgelenkten Zielen schrieb den
 * Katalog in einen Testordner und die Preise in den Bestand. Die Datei liegt
 * unter `preise/` und ist von `.gitignore` gedeckt — kein `git checkout`
 * holt sie zurück.
 *
 * Gerettet hat damals nicht die Vorsicht, sondern die Ableitbarkeit: Ein
 * Befehl erzeugte sie neu. Genau darauf ist aber kein Verlass mehr, sobald
 * der Auftraggeber Angaben liefert, die **nicht** abgeleitet, sondern
 * gepflegt werden.
 *
 * > **Eine Datei, die sich aus ihrer Quelle neu erzeugen lässt, kann man
 * > verlieren. Eine gepflegte Datei nicht.**
 *
 * Deshalb legt jedes Werkzeug, das eine vorhandene Datei überschreibt, vorher
 * eine datierte Kopie daneben. Die Kopie landet im selben Verzeichnis wie das
 * Original — bei `preise/` also innerhalb des gitignorierten Bereichs, was
 * Absicht ist: Eine Sicherung, die die Geheimhaltung durchbricht, ist keine.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

/** Wie viele Stände je Datei aufgehoben werden. */
export const SICHERUNGSTIEFE = 10;

/** `2026-08-30T15-42-07` — sortierbar und ohne Zeichen, die Dateisysteme ärgern. */
export function zeitstempel(datum = new Date()) {
  return datum.toISOString().slice(0, 19).replace(/:/g, '-');
}

/**
 * Legt eine datierte Kopie von `datei` an, wenn es sie gibt.
 *
 * @param {string} datei  der Pfad, der gleich überschrieben wird
 * @param {Date} [datum]
 * @returns {string|null} der Pfad der Kopie, oder null wenn es nichts zu
 *   sichern gab (die Datei existiert noch nicht — dann geht auch nichts
 *   verloren)
 */
export function sichere(datei, datum = new Date()) {
  if (!existsSync(datei)) return null;
  const ordner = join(dirname(datei), '.sicherung');
  mkdirSync(ordner, { recursive: true });
  const endung = extname(datei);
  const stamm = basename(datei, endung);
  const ziel = join(ordner, `${stamm}-${zeitstempel(datum)}${endung}`);
  copyFileSync(datei, ziel);
  entsorgeAlte(ordner, stamm, endung);
  return ziel;
}

/**
 * Der Name eines Standes: Stamm, Bindestrich, Zeitstempel, Endung.
 *
 * **Eine Fassung für beide Fragen.** Der erste Wurf hatte zwei: Der
 * Aufräumer prüfte streng gegen den Zeitstempel, die Auflistung locker gegen
 * `startsWith`. Ergebnis: Sie zählte eine fremde Datei mit, die der
 * Aufräumer richtigerweise in Ruhe ließ — und die Probe meldete elf Stände,
 * wo zehn stehen sollten.
 *
 * Zwei Begriffe von „Stand dieser Datei" sind einer zu viel; genau das ist
 * die Fehlerklasse, gegen die dieses Projekt die ganze Woche gearbeitet hat.
 */
function standmuster(stamm, endung) {
  const roh = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${roh(stamm)}-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}${roh(endung)}$`);
}

/**
 * Hält die Zahl der Stände je Datei bei `SICHERUNGSTIEFE`.
 *
 * Gelöscht wird **nur** in `.sicherung` und nur, was diese Funktion selbst
 * angelegt hat. Ein Aufräumer, der nach Muster löscht, ohne das Muster eng
 * zu fassen, ist gefährlicher als das Volllaufen, das er verhindert.
 */
function entsorgeAlte(ordner, stamm, endung) {
  const muster = standmuster(stamm, endung);
  const vorhanden = readdirSync(ordner).filter((d) => muster.test(d)).sort();
  for (const alt of vorhanden.slice(0, Math.max(0, vorhanden.length - SICHERUNGSTIEFE))) {
    unlinkSync(join(ordner, alt));
  }
}

/** Die vorhandenen Stände einer Datei, jüngster zuletzt. */
export function staende(datei) {
  const ordner = join(dirname(datei), '.sicherung');
  if (!existsSync(ordner)) return [];
  const endung = extname(datei);
  const muster = standmuster(basename(datei, endung), endung);
  return readdirSync(ordner)
    .filter((d) => muster.test(d))
    .sort()
    .map((d) => join(ordner, d))
    .filter((p) => statSync(p).isFile());
}
