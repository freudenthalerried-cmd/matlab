/**
 * Was auf einer Kundenseite nichts verloren hat.
 *
 * Der Anlass steht in `docs/baustoff-shop/interna-auf-der-kundenseite.md`:
 * Die AGB-Seite hat die **Entscheidungsbegründung** der Zahlwege gerendert
 * statt der Bedingung — mitsamt eigener Rohmarge, Lieferantenskonto,
 * Mehrkosten je Bestellung, Ausfallquote und internen Gate-Nummern.
 *
 * Der Fehler ist eine alte Bekannte dieses Vorhabens in neuer Kleidung:
 * **eine Angabe, die berechnet und dann am falschen Ort ausgegeben wird.**
 * Die Prüfkette hatte bis dahin drei Prüfer — `pruefe-inhalte` (stimmt die
 * Aussage?), `pruefe-quellen` (ist sie belegt?), `pruefe-geheimnis` (lässt
 * sich der Einkaufspreis zurückrechnen?). Keiner von ihnen stellt die
 * vierte Frage: **Gehört das überhaupt auf diese Seite?**
 *
 * Dieser Prüfer stellt sie, und er läuft im Bauwerkzeug selbst: Eine Seite
 * mit einem Treffer wird nicht geschrieben. Ein Prüfer, den man nach dem
 * Bauen aufrufen muss, wird irgendwann nicht aufgerufen.
 */

import { nurText } from './format.js';

/**
 * Die Muster.
 *
 * Jedes trägt den Grund mit, warum es hier steht — ein Muster ohne Grund
 * wird beim nächsten Fehlalarm gelöscht statt verstanden.
 */
export const INTERNA = Object.freeze([
  {
    id: 'gate',
    muster: /Gate[- ]?\d+|Gate[- ]?\d+-fest/g,
    warum: 'Gate-Nummern sind die interne Entscheidungsordnung. Für den Kunden sind sie eine Chiffre, für den Wettbewerber eine Landkarte.',
  },
  {
    id: 'eigene-marge',
    /*
     * **Erweitert am 10. September.** Zwei Lücken, beide gemessen: „25
     * **Prozent** Aufschlag" — ausgeschrieben statt mit Zeichen — und das
     * Wort **Einkaufspreis** selbst, das im Register überhaupt nicht stand,
     * obwohl es die vertraulichste Zahl dieses Vorhabens benennt.
     *
     * Gemeldet wird der Einkaufspreis **mit einer Zahl daneben** und nicht
     * das Wort: Die Wissensseite „Was Baumeisterpreis heißt" erklärt das
     * Geschäftsmodell und muss dafür davon sprechen. Über 106 Kundenflächen
     * erzeugen beide Ergänzungen null Fehltreffer.
     */
    muster: /Rohmarge|Deckungsbeitrag|Zielmarge|Handelsspanne von \d|Aufschlag von \d|\d+\s*(?:%|Prozent)\s*(?:Marge|Zuschlag|Aufschlag)|Einkaufspreis(?:e|en)?[^.!?]{0,30}?\d/g,
    warum: 'Die eigene Spanne. Wer sie kennt, kennt den Einkaufspreis — und verhandelt ab da nicht mehr über den Verkaufspreis.',
  },
  {
    id: 'lieferantenkondition',
    muster: /Lieferantenskonto|\d+\s*%\s*Skonto|Skonto bei \d|Einkaufskondition|Rabattstaffel|Werkspreisliste/g,
    warum: 'Was ein Lieferant einem Baumeister einräumt, ist dessen Geschäftsgeheimnis und zugleich die eigene Verhandlungsposition.',
  },
  {
    id: 'lieferantenname',
    muster: /Poschacher|Pramer|Peither|Lagerhaus Eferding/g,
    /*
     * **Berichtigt am 15. September 2026 — zwei Sätze, die sich widersprachen.**
     *
     * Hier stand: *„Der Bezugsweg. Er steht dem Kunden nicht zu und dem
     * Wettbewerber schon gar nicht."* In `src/shopkern.js` steht seit dem
     * 30. August daneben: *„Vollständig verbergen lässt er sich nicht: Die
     * Artikelnummern tragen das Kürzel des Lieferanten (`POS-…`), und die
     * Seiten weisen seine Artikelnummer bewusst aus, damit ein Kunde
     * nachbestellen kann. **Geheim ist nicht die Geschäftsbeziehung, geheim
     * sind die Konditionen.**"*
     *
     * Beides zugleich geht nicht. Gemessen am 15. September: Das ausgelieferte
     * `shop.js` trägt **47-mal** `"lieferantId":"poschacher"` — klein
     * geschrieben, und deshalb von diesem Muster nie gesehen.
     *
     * Der erste Griff war, das Muster auf `/i` zu stellen. Er wäre falsch
     * gewesen: Dann meldete der Prüfer 47-mal etwas, das dieses Haus
     * **absichtlich** ausliefert, und die Ausnahme dafür stünde am Ende genau
     * dort, wo heute das Muster steht.
     *
     * > **Wenn zwei Sätze eines Bestandes sich widersprechen, ist der Prüfer
     * > nicht die Stelle, an der man sich entscheidet.**
     *
     * Entschieden wird hier, und zwar für den konkreteren der beiden:
     * Geheim sind die Konditionen. Der **Name** bleibt trotzdem draußen — er
     * wird auf keiner Kundenseite gebraucht, und was nicht gebraucht wird,
     * wird nicht ausgeliefert. Das Muster bleibt deshalb groß geschrieben: Es
     * sucht den Namen im Fließtext, nicht die Kennung im Datensatz.
     */
    warum: 'Der Lieferantenname im Fließtext. Er wird auf keiner Kundenseite gebraucht, und was '
      + 'nicht gebraucht wird, wird nicht ausgeliefert. **Nicht** gemeint ist die Kennung im '
      + 'Datensatz (`lieferantId`, `POS-…`): Die Geschäftsbeziehung ist nicht geheim, die '
      + 'Konditionen sind es — so steht es in `oeffentlicherLieferant` in `src/shopkern.js`, '
      + 'und die Artikelnummern weist dieser Shop bewusst aus, damit ein Kunde nachbestellen '
      + 'kann. Die Herstellernamen der Ware sind ohnehin unberührt.',
  },
  {
    id: 'kalkulationsgroesse',
    muster: /je Bestellung mehr|Ausfallquote|Kippzahl|nötiger? Monatsumsatz|Sessionbedarf|Klickpreis/g,
    warum: 'Betriebsrechnung. Sie beantwortet keine Frage, die ein Besteller hat.',
  },
  {
    id: 'programmkennung',
    muster: /(?<![\p{L}\d-])(?:karte-stripe|karte-mollie|offene-rechnung|rechnungskauf|eps)(?![\p{L}\d-])/gu,
    warum: 'Programmkennungen statt Kundenwörter — das sichere Zeichen, dass eine Seite ihren Datensatz ausgibt statt ihren Inhalt.',
  },
]);

/**
 * Stellen im Text, die nicht veröffentlicht gehören.
 *
 * Wie überall in dieser Prüfkette: ein **Verdacht**, kein Urteil. Wo ein
 * Treffer begründet bleiben soll, steht im Seitenkopf
 * `intern: begruendet — Grund`; der Prüfer schweigt dann für diese Seite
 * und nennt den Grund im Bericht. Eine Ausnahme, die man aufschreiben
 * muss, wird seltener aus Bequemlichkeit gemacht als eine, die man
 * wegkonfiguriert.
 */
export function findeInterna(text, { muster = INTERNA } = {}) {
  const funde = [];
  for (const eintrag of muster) {
    const suche = new RegExp(eintrag.muster.source, eintrag.muster.flags);
    let treffer;
    while ((treffer = suche.exec(text)) !== null) {
      if (treffer[0].length === 0) { suche.lastIndex++; continue; }
      funde.push({
        id: eintrag.id,
        fund: treffer[0],
        stelle: treffer.index,
        // `nurText` seit dem 5. September: Diese vier Ersetzungen standen im
        // Bestand dreimal, und die dritte Fassung war die, die an HTML
        // zerbrach. Sie stehen jetzt einmal in `format.js`.
        umfeld: nurText(text.slice(Math.max(0, treffer.index - 60), treffer.index + treffer[0].length + 60)),
        warum: eintrag.warum,
      });
    }
  }
  return funde.sort((a, b) => a.stelle - b.stelle);
}

/**
 * Prüft eine Liste von Seiten `{ kennung, html, ausnahme, nur }`.
 *
 * `nur` grenzt eine Ausnahme auf einzelne Muster ein. Die Startseite trägt
 * die Kachel der Seite „Was Baumeisterpreis heißt" und damit deren
 * ausgenommene Spannenangabe — aber sie soll deshalb nicht auch für
 * Gate-Nummern und Lieferantennamen frei sein. **Eine Ausnahme, die mehr
 * freigibt als nötig, ist der zweite Fehler nach dem ersten.**
 */
export function pruefeSeiten(seiten, optionen = {}) {
  const meldungen = [];
  const ausnahmen = [];
  for (const seite of seiten) {
    const nur = seite.nur ? new Set(seite.nur) : null;
    if (seite.ausnahme) {
      ausnahmen.push({
        kennung: seite.kennung,
        grund: seite.ausnahme,
        nur: nur ? [...nur] : null,
      });
      if (!nur) continue;
    }
    for (const fund of findeInterna(seite.html ?? '', optionen)) {
      if (seite.ausnahme && nur?.has(fund.id)) continue;
      meldungen.push({ ...fund, kennung: seite.kennung });
    }
  }
  return { seiten: seiten.length, meldungen, ausnahmen, sauber: meldungen.length === 0 };
}
