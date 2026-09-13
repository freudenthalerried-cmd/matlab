/**
 * Die Rückwärtsrechnung: Welche Kondition muss man verlangen?
 *
 * Bisher läuft die Rechnung in eine Richtung — Einkauf plus Zielmarge ergibt
 * den Verkaufspreis, gedeckelt bei der UVP. Für eine Konditionsverhandlung ist
 * das die falsche Richtung. Dort steht die Frage andersherum: Ich will zu einem
 * marktüblichen Preis verkaufen und dabei die Untergrenze halten — welchen
 * Rabatt brauche ich dafür?
 *
 * Der Unterschied ist nicht akademisch. `auswertungsbogen-hersteller.md` hat
 * gezeigt, dass 35 % Händlerrabatt nur 4,4 % Nachlass auf die UVP erlauben.
 * Diese Datei dreht die Rechnung um und liefert die Zahl, mit der man in ein
 * Gespräch geht — statt eine Zusage entgegenzunehmen und hinterher zu merken,
 * dass sie keinen Spielraum lässt.
 */

import { cent, MARGENUNTERGRENZE } from './preis.js';

/**
 * Der Einkaufspreis, der bei diesem Verkaufspreis die Zielmarge trägt.
 *
 * Rohmarge = (VK − EK) / VK, also EK = VK × (1 − Marge).
 */
export function noetigerEinkauf(vkNetto, zielmarge = MARGENUNTERGRENZE) {
  if (!(vkNetto > 0)) throw new Error('Die Rückwärtsrechnung braucht einen Verkaufspreis');
  if (!(zielmarge >= 0 && zielmarge < 1)) throw new Error('Die Zielmarge muss zwischen 0 und 1 liegen');
  return cent(vkNetto * (1 - zielmarge));
}

/**
 * Der Händlerrabatt auf die UVP, der bei einem Nachlass die Zielmarge hält.
 *
 * Verkauft wird zu (1 − Nachlass) × UVP, eingekauft zu (1 − Rabatt) × UVP.
 * Aus der Margenbedingung folgt:
 *
 *     Rabatt = 1 − (1 − Nachlass) × (1 − Marge)
 *
 * Der Rabatt steigt also **überproportional** mit dem gewünschten Nachlass —
 * jeder Prozentpunkt, den man dem Kunden geben will, kostet mehr als einen
 * Prozentpunkt in der Verhandlung.
 */
export function noetigerRabatt(nachlassAufUvp, zielmarge = MARGENUNTERGRENZE) {
  if (!(nachlassAufUvp >= 0 && nachlassAufUvp < 1)) throw new Error('Der Nachlass muss zwischen 0 und 1 liegen');
  if (!(zielmarge >= 0 && zielmarge < 1)) throw new Error('Die Zielmarge muss zwischen 0 und 1 liegen');
  return 1 - (1 - nachlassAufUvp) * (1 - zielmarge);
}

/**
 * Das Verhandlungsziel für eine Warengruppe.
 *
 * `zielmarge` ist die Marge, die diese Gruppe tragen muss — für die
 * Abdichtungsbahn nach `phase2-lieferantenlandkarte.md` rund 38 %, für das Rohr
 * als Preisprodukt weniger.
 */
export function verhandlungsziel({ gruppe, zielmarge, nachlassAufUvp, uvpNetto = null }) {
  const rabatt = noetigerRabatt(nachlassAufUvp, zielmarge);
  const vkNetto = uvpNetto === null ? null : cent(uvpNetto * (1 - nachlassAufUvp));

  return {
    gruppe,
    zielmarge,
    nachlassAufUvp,
    noetigerRabatt: rabatt,
    uvpNetto,
    vkNetto,
    ekNetto: vkNetto === null ? null : noetigerEinkauf(vkNetto, zielmarge),
    // Was der Wunsch nach Preisspielraum über die reine Marge hinaus kostet.
    aufschlagGegenOhneNachlass: rabatt - zielmarge,
  };
}

/**
 * Was ein angebotener Rabatt tatsächlich zulässt.
 *
 * Die Gegenrichtung zu `verhandlungsziel`: Der Hersteller nennt eine Zahl, und
 * die Frage ist, welchen Nachlass sie erlaubt, ohne die Untergrenze zu reißen.
 */
export function spielraumAusRabatt(rabatt, zielmarge = MARGENUNTERGRENZE) {
  if (!(rabatt >= 0 && rabatt < 1)) throw new Error('Der Rabatt muss zwischen 0 und 1 liegen');
  const nachlass = 1 - (1 - rabatt) / (1 - zielmarge);

  return {
    rabatt,
    zielmarge,
    reicht: rabatt >= zielmarge,
    maxNachlass: Math.max(0, nachlass),
  };
}

/**
 * Die Staffel, die ins Anschreiben gehört.
 *
 * Nicht eine Zahl, sondern drei — sie zeigt dem Hersteller, dass die Forderung
 * begründet ist, und sie zeigt uns, ab wo eine Zusage wirklich trägt.
 */
export function staffel(zielmarge = MARGENUNTERGRENZE, nachlaesse = [0, 0.05, 0.10, 0.15]) {
  return nachlaesse.map((n) => ({
    nachlassAufUvp: n,
    noetigerRabatt: noetigerRabatt(n, zielmarge),
  }));
}

/**
 * Rechnet den Katalog rückwärts: Was müsste jeder Artikel im Einkauf kosten?
 *
 * Nimmt die vorhandenen UVP-Niveaus und liefert je Artikel den Einkaufspreis,
 * der bei gewünschtem Nachlass die Zielmarge trägt — die Liste, die man einer
 * Konditionsverhandlung zugrunde legt.
 */
export function rueckwaertsKatalog(katalog, { nachlassAufUvp = 0.10, zielmargen = {} } = {}) {
  return katalog.artikel.map((a) => {
    const zielmarge = zielmargen[a.gruppe] ?? MARGENUNTERGRENZE;
    const ziel = verhandlungsziel({
      gruppe: a.gruppe,
      zielmarge,
      nachlassAufUvp,
      uvpNetto: a.uvpNetto,
    });

    return {
      sku: a.sku,
      bezeichnung: a.bezeichnung,
      gruppe: a.gruppe,
      lieferantId: a.lieferantId,
      uvpNetto: a.uvpNetto,
      vkNetto: ziel.vkNetto,
      ekNetto: ziel.ekNetto,
      noetigerRabatt: ziel.noetigerRabatt,
      // Was heute im Platzhalterkatalog steht — zum Abgleich, nicht als Beleg.
      heutigerEk: a.ekNetto ?? null,
      luecke: a.ekNetto === undefined || a.ekNetto === null ? null : cent(a.ekNetto - ziel.ekNetto),
    };
  });
}
