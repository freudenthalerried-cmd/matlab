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

/**
 * Der Satz über die Merkblätter — abgeleitet, nicht geschrieben.
 *
 * **Der Anlass, 10. September 2026.** `llms.txt` sagt jedem Assistenten, wie
 * diese Seiten gebaut sind. Eine der drei Zeilen lautete:
 *
 * > *„Technische Kennwerte werden nicht abgeschrieben, sondern beim
 * > Hersteller verlinkt."*
 *
 * Gemessen: **24 von 46** Artikelseiten tragen den Verweis. Auf den übrigen
 * **22** steht, dass kein Merkblatt vorliegt — richtig und offen gesagt, aber
 * eben nicht „beim Hersteller verlinkt". Die Zeile war für die Hälfte des
 * Sortiments eine Zusage, die die Seite nicht einlöst, und sie stand in genau
 * der Datei, die für Maschinen geschrieben ist.
 *
 * > **Eine Selbstbeschreibung ist eine Zusage wie jede andere — nur liest sie
 * > niemand nach, weil sie über den eigenen Bau spricht.**
 *
 * Der Satz folgt jetzt der Zahl, wie `lieferungssatz` der Lieferantenzahl:
 * Beantwortet der Lieferant Frage 1 und kommen die Merkblattadressen, wird er
 * von selbst wieder der kurze.
 *
 * @param {number} mitVerweis Artikelseiten mit Merkblattverweis
 * @param {number} gesamt Artikelseiten insgesamt
 */
export function merkblattsatz(mitVerweis, gesamt) {
  if (!(gesamt > 0)) {
    return 'Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller verlinkt.';
  }
  if (mitVerweis >= gesamt) {
    return 'Technische Kennwerte werden nicht abgeschrieben, sondern beim Hersteller verlinkt.';
  }
  if (mitVerweis === 0) {
    return 'Technische Kennwerte werden nicht abgeschrieben. Eine Merkblattadresse des '
      + `Herstellers liegt für keinen der ${gesamt} Artikel vor; die Artikelseiten sagen das.`;
  }
  return 'Technische Kennwerte werden nicht abgeschrieben. Auf '
    + `${mitVerweis} von ${gesamt} Artikelseiten steht der Verweis auf das Merkblatt des `
    + `Herstellers; für die übrigen ${gesamt - mitVerweis} liegt uns keine Adresse vor, und die `
    + 'Seite sagt das statt eine Kennwerttabelle zu erfinden.';
}

/**
 * Wie viele Artikelseiten einen Merkblattverweis tragen.
 *
 * Gemessen am **Erzeugnis** und nicht am Katalog: Ob der Verweis auf der
 * Seite landet, hängt an der Marke in der Bezeichnung und an der bekannten
 * Adresse — beides Schritte, die zwischen Katalog und Seite liegen.
 *
 * @param {{name: string, html: string}[]} seiten Artikelseiten
 */
export function merkblattdeckung(seiten = []) {
  let mitVerweis = 0;
  const ohne = [];
  for (const s of seiten) {
    const block = /Technische Kennwerte([\s\S]*?)(<h2|<\/main)/.exec(String(s.html ?? ''));
    const text = block ? block[1] : '';
    if (/<a [^>]*href="https?:\/\//.test(text)) mitVerweis += 1;
    else ohne.push(s.name);
  }
  return { gesamt: seiten.length, mitVerweis, ohne };
}

/**
 * Hält den Satz in `llms.txt` gegen die gebauten Artikelseiten.
 *
 * @param {string} llms Inhalt von `ausgabe/site/llms.txt`
 * @param {{gesamt: number, mitVerweis: number}} deckung
 * @param {number} mindestens Wie viele Artikelseiten der Bestand trägt
 */
export function selbstbeschreibungsbefund(llms, deckung, mindestens = 20) {
  const meldungen = [];
  if (deckung.gesamt < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-seiten',
      text: `nur ${deckung.gesamt} Artikelseiten gemessen, erwartet mindestens ${mindestens} — `
        + 'darüber lässt sich nichts aussagen',
    });
  }
  const soll = merkblattsatz(deckung.mitVerweis, deckung.gesamt);
  if (!String(llms ?? '').includes(soll)) {
    meldungen.push({
      regel: 'selbstbeschreibung-haelt-nicht',
      text: 'llms.txt beschreibt die Merkblattverweise anders, als die Seiten sie tragen — '
        + `${deckung.mitVerweis} von ${deckung.gesamt} tragen einen. Dort gehört: „${soll}"`,
    });
  }
  return { ...deckung, soll, meldungen, sauber: meldungen.length === 0 };
}
