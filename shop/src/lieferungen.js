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

/* ------------------------------------------------------------------ *
 * Die zweite Fassung — 10. September 2026
 *
 * `BEHAUPTUNG` oben stammt vom 6. September und findet genau eine Formulierung:
 * *„… mehrere Hersteller … entstehen mehrere Lieferungen"*. Das war der Satz,
 * der an dem Tag an vier Stellen stand und dort berichtigt wurde. Gemessen am
 * 10. September über **127 Kundenflächen** — gebaute Seiten, Quelltexte,
 * AGB-Gliederung und die Lieferhinweise der Auftragsbestätigung — steht
 * dieselbe Behauptung an **sieben** weiteren Stellen, in vier anderen
 * Formulierungen. Das Muster trifft **keine** davon:
 *
 * | Fläche | Satz |
 * |---|---|
 * | AGB Punkt 4 | „Direktversand durch den Hersteller; **Teillieferungen je Lieferant sind der Regelfall**." |
 * | Auftragsbestätigung | „**Teillieferungen kommen getrennt an.** … erreicht die Baustelle deshalb **in mehreren Sendungen an verschiedenen Tagen**." |
 * | Wissensseite | „Wir bündeln, was auf dieselbe Baustelle geht, **statt drei Teillieferungen zu fahren**." |
 *
 * > **Ein Prüfer, der aus einem Beispielsatz gebaut wird, erkennt den
 * > Beispielsatz.** Seine grüne Meldung hat seit dem 6. September nichts
 * > bedeutet.
 *
 * Die Abnahmeseite ist der Gegenfall und bleibt grün: Sie trägt denselben
 * Hinweis und sagt zwei Absätze darunter, dass er heute nicht zutrifft. Genau
 * diese Auskunft fehlt der **Auftragsbestätigung**, auf der derselbe Text
 * allein steht — die Berichtigung vom 30. August ist an der Seite angekommen
 * und nicht am Text.
 *
 * ## Die Regel
 *
 * > **Wer mehrere Lieferungen behauptet, sagt auf derselben Fläche, wovon sie
 * > abhängen.**
 *
 * Gemessen wird zweistufig, und das ist Absicht. Ein Satz, der die Bedingung
 * selbst trägt („Kommt ein zweiter Lieferant dazu, entstehen mehrere
 * Lieferungen"), ist fertig — so stehen 24 Fundstellen im Bestand, und keine
 * davon ist ein Befund. Trägt er sie nicht, entscheidet die **Fläche**: Nennt
 * sie irgendwo den einen Lieferanten oder den zweiten, der dazukommen müsste,
 * liest der Kunde beides zusammen.
 */

/**
 * Wörter, die mehr als eine Lieferung behaupten.
 *
 * Nicht „Lieferung" — das Wort steht auf jeder Seite. Gesucht ist die
 * **Mehrzahl**: geteilte Sendungen, getrennte Lieferungen, Teillieferungen.
 */
export const MEHRLIEFERUNG =
  /Teillieferung(?:en)?|mehrere[nr]?\s+(?:Sendungen|Lieferungen|Teillieferungen)|getrennte[nr]?\s+(?:Sendungen|Lieferungen)|(?:zwei|drei)\s+(?:Sendungen|Lieferungen|Teillieferungen)/i;

/**
 * Die Bedingung **im Satz**: Wovon die mehreren Lieferungen abhängen.
 *
 * Eng gefasst und mit Vorsatz. „mehreren" allein genügt nicht — „erreicht die
 * Baustelle in mehreren Sendungen" wäre sonst durch sein eigenes Wort gedeckt.
 */
export const SATZBEDINGUNG =
  /\b(?:wenn|falls|sobald|sofern|kommt[^.!?]{0,40}dazu|k(?:ä|ae)me|bei mehreren|verschiedene[nr]?\s+(?:Lieferanten|Hersteller)|mehrerer\s+(?:Lieferanten|Hersteller)|f(?:ü|ue)hrt der Katalog)\b/i;

/**
 * Die Bedingung **auf der Fläche**: der Satz über die Zahl der Lieferanten.
 *
 * Das ist die Auskunft, die den Hinweis einordnet — „alle Artikel kommen von
 * einem Lieferanten", „sobald ein zweiter dazukommt". Ein beliebiges
 * Bedingungswort irgendwo auf der Seite genügt ausdrücklich nicht: Ein
 * Freibrief, der überall gilt, ist keiner.
 */
export const FLAECHENBEDINGUNG =
  /zweite[rn]?\s+Lieferant|zweiten\s+Lieferanten|von\s+einem\s+Lieferanten|(?:ü|ue)ber\s+einen\s+Lieferanten/i;

/** Sätze eines Textes — über Zeilenumbrüche hinweg, wie im Markdown üblich. */
export function saetzeVon(text) {
  return String(text ?? '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
}

/**
 * Behauptet eine Fläche mehrere Lieferungen, ohne zu sagen, wovon sie abhängen?
 *
 * @param {{name: string, text: string}[]} flaechen
 * @param {number} lieferanten Wie viele Lieferanten der Katalog führt.
 * @param {number} mindestens Ab wie vielen Flächen die Aussage trägt.
 */
export function mehrlieferungsbefund(flaechen = [], lieferanten = 1, mindestens = 20) {
  const meldungen = [];
  let gesehen = 0;
  if (flaechen.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-flaechen',
      wo: '—',
      text: `nur ${flaechen.length} Kundenflächen gemessen, erwartet mindestens ${mindestens} — `
        + 'darüber lässt sich nichts aussagen',
    });
  }
  // Bei zwei Lieferanten stimmt jeder dieser Sätze. Die Regel gilt für den
  // Zustand, in dem sie falsch sind — und dreht sich von selbst ab, sobald der
  // zweite Lieferant im Katalog steht.
  if (lieferanten > 1) return { geprueft: flaechen.length, lieferanten, gesehen, meldungen, sauber: meldungen.length === 0 };
  for (const { name, text } of flaechen) {
    const gedeckt = FLAECHENBEDINGUNG.test(String(text ?? ''));
    for (const satz of saetzeVon(text)) {
      if (!MEHRLIEFERUNG.test(satz)) continue;
      gesehen += 1;
      if (SATZBEDINGUNG.test(satz) || gedeckt) continue;
      meldungen.push({
        regel: 'mehrlieferung-ohne-bedingung',
        wo: name,
        text: `${name} behauptet mehrere Lieferungen und sagt nirgends auf derselben Fläche, `
          + `wovon sie abhängen — der Katalog führt einen Lieferanten: „${satz.trim().slice(0, 110)}"`,
      });
    }
  }
  return {
    geprueft: flaechen.length,
    lieferanten,
    gesehen,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
