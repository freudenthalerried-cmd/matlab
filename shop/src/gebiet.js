/**
 * Gebietsauskunft — die Zwischenlösung über die Negativliste.
 *
 * Die geplante Gebietsabfrage nach `phase10-datengrundlage-gebietsabfrage.md`
 * braucht die Gemeindeliste aus Anlage 1 der Radonschutzverordnung; RIS und
 * der Geoserver sind aus dieser Umgebung nicht erreichbar. Was ohne sie
 * trotzdem verlässlich beantwortbar ist, hat
 * `nachfragezahlen-pflichtgebiet-und-bestand.md` gezeigt: Das
 * **Radonvorsorgegebiet** — die Kulisse der Neubau-Pflicht — ist fast ganz
 * Österreich, ausgenommen Wien und zehn Bezirke. Elf Einträge statt 2.095
 * Gemeinden.
 *
 * Die Grenzen sind Teil des Entwurfs, nicht Kleingedrucktes:
 *
 * **Die Auskunft gilt dem Vorsorgegebiet, nicht dem Schutzgebiet.** Ob in
 * einer Gemeinde zusätzlich Schutzgebiets-Pflichten gelten (104 Gemeinden,
 * Anlage 1 RnV), beantwortet nur die amtliche Liste — Gate 11: Die
 * Rechtsaussage stützt sich ausschließlich auf Verordnungstext, und der ist
 * von hier aus nicht abrufbar. Die Auskunft sagt das dazu, statt es zu
 * verschweigen.
 *
 * **Bezirksebene, weil die Ausnahmen bezirksscharf sind.** Die Negativliste
 * nennt ganze Bezirke (und Wien); eine feinere Auskunft gäbe die Quelle nicht
 * her. Eingegeben wird der Bezirk, nicht die Postleitzahl — eine PLZ beweist
 * keinen Bezirk, so wie sie kein Land beweist (`kunde.js`).
 *
 * **Die Liste stammt aus einer Sekundärquelle.** Vor dem ersten
 * veröffentlichten Inhalt ist sie am Verordnungstext gegenzuprüfen; die
 * Auskunft trägt diesen Vorbehalt in jedem Ergebnis.
 */

import { textZeile } from './format.js';

/** Stand und Quelle der Liste — wandert in jede Auskunft. */
export const GEBIETSSTAND = Object.freeze({
  stand: '2026-08-16',
  quelle: 'BMLUK, Gemeinden im Radonvorsorgegebiet (Sekundärquelle)',
  vorbehalt:
    'Bezirksliste aus einer Sekundärquelle — vor einer Veröffentlichung am Verordnungstext gegenzuprüfen.',
});

/**
 * Die Ausnahmen vom Radonvorsorgegebiet: Wien und zehn Bezirke.
 * Überall sonst gilt die bauliche Vorsorgepflicht im Neubau (Landesrecht,
 * ÖNORM S 5280-2).
 */
export const AUSNAHMEN_VORSORGEGEBIET = Object.freeze([
  { name: 'Wien', bundesland: 'Wien' },
  { name: 'Güssing', bundesland: 'Burgenland' },
  { name: 'Jennersdorf', bundesland: 'Burgenland' },
  { name: 'Neusiedl am See', bundesland: 'Burgenland' },
  { name: 'Oberwart', bundesland: 'Burgenland' },
  { name: 'Bruck an der Leitha', bundesland: 'Niederösterreich' },
  { name: 'Ried im Innkreis', bundesland: 'Oberösterreich' },
  { name: 'Südoststeiermark', bundesland: 'Steiermark' },
  { name: 'Bregenz', bundesland: 'Vorarlberg' },
  { name: 'Dornbirn', bundesland: 'Vorarlberg' },
  { name: 'Feldkirch', bundesland: 'Vorarlberg' },
]);

const vergleichbar = (wert) =>
  textZeile(wert)
    .toLowerCase()
    .replace(/^bezirk\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Beantwortet: Liegt dieser Bezirk im Radonvorsorgegebiet?
 *
 * Die Logik ist die der Quelle — eine Negativliste: Wer nicht ausgenommen
 * ist, ist Vorsorgegebiet. Ein unbekannter oder verschriebener Bezirk landet
 * deshalb auf der Vorsorge-Seite; die Auskunft formuliert das als
 * Listenaussage („nicht auf der Ausnahmeliste"), nicht als Ortskenntnis.
 */
export function vorsorgeauskunft(bezirk) {
  const eingabe = textZeile(bezirk);
  const gesucht = vergleichbar(bezirk);
  const treffer = gesucht
    ? AUSNAHMEN_VORSORGEGEBIET.find((a) => vergleichbar(a.name) === gesucht) ?? null
    : null;

  const saetze = [];
  if (!gesucht) {
    saetze.push('Kein Bezirk angegeben — die Auskunft braucht den Bezirk der Baustelle.');
  } else if (treffer) {
    saetze.push(
      `${treffer.name} (${treffer.bundesland}) steht auf der Ausnahmeliste und ist kein Radonvorsorgegebiet — die bauliche Vorsorgepflicht für Neubauten gilt dort nicht.`,
    );
  } else {
    saetze.push(
      `„${eingabe}" steht nicht auf der Ausnahmeliste (Wien und zehn Bezirke) — der Bezirk gilt damit als Radonvorsorgegebiet: bauliche Vorsorge im Neubau nach Landesrecht und ÖNORM S 5280-2.`,
    );
  }
  saetze.push(
    'Ob zusätzlich Schutzgebiets-Pflichten gelten (104 Gemeinden, Anlage 1 Radonschutzverordnung), beantwortet nur die amtliche Liste auf Gemeindeebene.',
  );

  return {
    eingabe,
    beantwortet: Boolean(gesucht),
    ausgenommen: Boolean(treffer),
    gebiet: treffer,
    text: saetze.join(' '),
    ...GEBIETSSTAND,
  };
}
