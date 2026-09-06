/**
 * Wie viele Lieferungen aus einem Warenkorb werden — und was der Kunde liest.
 *
 * **Der Anlass, 6. September 2026.** Vier Stellen sagen dem Kunden denselben
 * Satz:
 *
 * > *„Werden mehrere **Hersteller** bestellt, entstehen mehrere Lieferungen,
 * > und die Grenze gilt für jede einzelne."*
 *
 * — die Lieferseite, die Warenkorbfläche, die Fragen-und-Antworten und
 * `llms.txt`. Der Katalog führt **46 Artikel von einem einzigen Lieferanten**,
 * und der Rechenkern teilt nach `lieferantId`, nicht nach Hersteller. Ein
 * Warenkorb ist heute **eine** Lieferung, gleich wie viele Marken darin
 * liegen.
 *
 * Eine fünfte Stelle wusste es und sagte es auch — der Hinweiskasten auf der
 * Abnahmeseite:
 *
 * > *„Das jetzige Sortiment läuft über **einen** Lieferanten, also kommt eine
 * > Bestellung in einer Sendung."*
 *
 * > **Der Bestand wusste es an einer Stelle und sagte an vier anderen das
 * > Gegenteil.**
 *
 * ## Was das kostet
 *
 * Die Richtung ist die vorsichtige, und gerade deshalb fällt sie nicht auf:
 * Wer Baumit, Schiedel und Soudal in den Korb legt, liest, er brauche
 * dreimal 250 € — also 750 € statt 250 €. **Abgeschreckte Körbe stehen in
 * keiner Abrechnung.** Und wer trotzdem bis zur Kasse geht, sieht dort **eine**
 * Teillieferung und einen Betrag: Text und Verhalten widersprechen einander
 * an der Stelle, an der es ums Geld geht.
 *
 * ## Warum der Satz nicht einfach gestrichen wird
 *
 * Die Regel „je Lieferung" ist richtig und im Rechenkern richtig umgesetzt —
 * sie greift, sobald ein zweiter Lieferant dazukommt. Gestrichen käme sie
 * selten zurück (dieselbe Überlegung steht seit dem 30. August im Kasten auf
 * der Abnahmeseite). Sie wird deshalb **abgeleitet**: Der Satz folgt der Zahl
 * der Lieferanten im Katalog und dreht sich von selbst um, wenn der zweite
 * dazukommt.
 */

/** Wie viele verschiedene Lieferanten der Katalog führt. */
export function lieferantenzahl(artikel = []) {
  return new Set(artikel.map((a) => a?.lieferantId).filter(Boolean)).size;
}

/**
 * Der Satz über die Zahl der Lieferungen — knapp, für Fragen und Antworten.
 *
 * @param {number} lieferanten
 * @returns {string}
 */
export function lieferungssatz(lieferanten) {
  return lieferanten <= 1
    ? 'Alle geführten Artikel kommen von einem Lieferanten; ein Warenkorb ist deshalb eine '
      + 'Lieferung, und die Grenze gilt einmal. Kommt ein zweiter Lieferant dazu, entstehen '
      + 'mehrere Lieferungen, und sie gilt für jede einzelne.'
    : 'Artikel verschiedener Lieferanten kommen in getrennten Lieferungen, und die Grenze gilt '
      + 'für jede einzelne — Anfahrt und Verpackung fallen je Lieferung an.';
}

/**
 * Behauptet ein Text mehrere Lieferungen, wo es nur einen Lieferanten gibt?
 *
 * Gesucht wird die **Behauptung**, nicht das Wort: Ein Satz, der von mehreren
 * Herstellern oder Lieferanten auf mehrere Lieferungen schließt. Der
 * Hinweiskasten auf der Abnahmeseite nennt beide Wörter und sagt genau das
 * Gegenteil — er darf nicht anschlagen.
 */
export const BEHAUPTUNG = /(?:mehrere[nr]?|verschiedene[nr]?)\s+(?:Hersteller|Lieferanten)\S*[^.!?]{0,80}?entstehen mehrere Lieferungen/i;

/**
 * @param {object} eingabe
 * @param {{name: string, text: string}[]} eingabe.texte
 * @param {number} eingabe.lieferanten
 * @param {number} [eingabe.mindestens] ab wie vielen Texten die Aussage trägt
 */
export function lieferungsbefund({ texte, lieferanten, mindestens = 3 }) {
  const meldungen = [];
  const gepruefte = texte ?? [];

  if (gepruefte.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-texte',
      text: `nur ${gepruefte.length} Texte gemessen — darüber lässt sich nichts aussagen`,
    });
  }

  if (lieferanten <= 1) {
    for (const t of gepruefte) {
      const treffer = BEHAUPTUNG.exec(t.text ?? '');
      if (treffer) {
        meldungen.push({
          regel: 'mehrere-lieferungen-ohne-zweiten-lieferanten',
          wo: t.name,
          text: `${t.name} verspricht mehrere Lieferungen, der Katalog führt einen Lieferanten: `
            + `„${treffer[0].slice(0, 90)}"`,
        });
      }
    }
  }

  return {
    geprueft: gepruefte.length,
    lieferanten,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
