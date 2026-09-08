/**
 * Wo das Merkblatt steht, auf das eine Seite verweist.
 *
 * **Der Anlass, 7. September 2026.** Die zweite Redaktionsregel lautet: *„Eine
 * Zahl ohne Herkunft ist keine Zahl. Verbrauchswerte, Schichtdicken und
 * Verarbeitungsbedingungen stehen nur dann hier, wenn das zugehörige Merkblatt
 * verlinkt ist."* Der Bestand hält sie — die Inhaltsseiten schreiben keine
 * Kennwerte ab, sondern schicken den Leser ins Merkblatt.
 *
 * Gezählt, wie oft sie das tun und wie oft sie dazu sagen, wo es liegt:
 *
 * ```
 * Seiten, die ein Merkblatt nennen:              8
 * davon mit einem Herstellerverweis:             4
 * „Mengen für 100 m² Fassade":     8 Erwähnungen, 0 Verweise
 * ```
 *
 * Ausgerechnet die Seite, deren ganzer Zweck der Satz *„der Rechenweg, in den
 * Sie die Werte aus **Ihrem** Merkblatt einsetzen"* ist, sagt nirgends, wo
 * dieses Merkblatt zu finden wäre.
 *
 * > **Eine Seite, die den Leser ins Merkblatt schickt und den Weg dorthin
 * > verschweigt, hat die Auskunft an die Stelle verlegt, an der sie nicht
 * > steht.**
 *
 * Der Shop **weiß** den Weg: `src/hersteller.js` führt zu jeder Marke die
 * Herstellerseite, und jede Artikelseite verlinkt sie seit dem 1. September.
 * Die Inhaltsseiten kannten das Register nicht — dieselbe Bauart wie die
 * Marke, die im Bauwerkzeug lag und deshalb im Produktfeed fehlte.
 *
 * Der Verweis wird **abgeleitet**: aus der Warengruppe der Seite und den
 * Marken, die der Katalog in dieser Gruppe führt. Kommt ein Artikel dazu,
 * steht sein Hersteller am nächsten Tag auf der Seite; verschwindet die
 * letzte Marke einer Gruppe, verschwindet der Verweis.
 */

import { HERSTELLER, marke } from './hersteller.js';

/** Erwähnt ein Text ein Merkblatt? */
export const MERKBLATT = /\bMerkbl(?:a|ä)tt|\bDatenbl(?:a|ä)tt|\btechnische[ns]? Merkblatt/i;

/**
 * Die Hersteller, die der Katalog in einer Warengruppe führt.
 *
 * @param {{bezeichnung: string, gruppe: string}[]} artikel
 * @param {string} gruppe
 * @returns {{name: string, url: string}[]}
 */
export function herstellerDerGruppe(artikel = [], gruppe = null) {
  if (!gruppe) return [];
  const gefunden = new Map();
  for (const a of artikel) {
    if (a?.gruppe !== gruppe) continue;
    const m = marke(String(a.bezeichnung ?? ''));
    const h = m ? HERSTELLER[m] : null;
    // **Nur mit Adresse — 8. September, abends.** Diese Liste dient dem
    // **Verweis**: Die Gruppenseite baut daraus Links, und die Regel darunter
    // fragt, ob einer davon dasteht. Seit die Markenliste der Kampagne mit
    // `HERSTELLER` zusammengelegt ist, gibt es vier Marken ohne belegte
    // Merkblattadresse; ohne diese Zeile schrieb die Seite `href="null"` und
    // die Regel verlangte einen Weg, den es nicht gibt. Eine geratene Adresse
    // wäre eine erfundene Quelle — der Mangel steht als `warumOhneUrl` beim
    // Hersteller und als offener Punkt in der Artikelliste des Lieferanten.
    if (h?.url) gefunden.set(h.url, h);
  }
  return [...gefunden.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/**
 * Nennt jede Seite, die ein Merkblatt erwähnt, auch den Weg dorthin?
 *
 * Geprüft wird nur, wo der Bestand einen Weg **kennt**: Eine Seite über eine
 * Warengruppe ohne bekannte Marke — Kanalrohre tragen keine — kann keinen
 * Verweis tragen, und ein Prüfer, der ihn verlangt, verlangt eine Erfindung.
 *
 * @param {object} eingabe
 * @param {{name: string, text: string, gruppe: string|null}[]} eingabe.seiten
 * @param {(gruppe: string) => {url: string}[]} eingabe.hersteller
 * @param {number} [eingabe.mindestens]
 */
export function merkblattbefund({ seiten, hersteller, mindestens = 10 }) {
  const meldungen = [];
  const gepruefte = seiten ?? [];

  if (gepruefte.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-seiten',
      text: `nur ${gepruefte.length} Seiten gemessen — darüber lässt sich nichts aussagen`,
    });
  }

  for (const s of gepruefte) {
    if (!MERKBLATT.test(String(s.text ?? ''))) continue;
const bekannt = s.gruppe ? (hersteller(s.gruppe) ?? []) : [];
    if (!bekannt.length) continue;
    if (!bekannt.some((h) => String(s.text ?? '').includes(h.url))) {
      meldungen.push({
        regel: 'merkblatt-ohne-weg',
        wo: s.name,
        text: `${s.name} schickt den Leser ins Merkblatt und nennt keinen der Hersteller, `
          + `die der Katalog in „${s.gruppe}" führt`,
      });
    }
  }

  return {
    geprueft: gepruefte.length,
    mitMerkblatt: gepruefte.filter((s) => MERKBLATT.test(String(s.text ?? ''))).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
