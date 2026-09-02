/**
 * Die Anfrage an den Lieferanten — vier Fragen, die acht offene Punkte schließen.
 *
 * **Der Anlass, 2. September 2026.** `npm run offenepunkte` führt acht Punkte
 * in der Gruppe „Anfrage an Dritte". Sie hängen alle an demselben Gespräch mit
 * demselben Lieferanten, und für dieses Gespräch gab es keinen Text. Was es
 * gab, waren die `anschreiben-entwuerfe.md` vom 9. August — dreizehn
 * Radon-Hersteller, geschrieben zwei Wochen **vor** dem Kurswechsel vom
 * 22. August. `data/lieferanten.json` zeigt bis heute mit `_hinweis` dorthin
 * und nennt sie die Quelle der echten Werte.
 *
 * > **Ein Entwurf für ein abgelöstes Modell ist kein Entwurf, sondern ein
 * > Wegweiser in die falsche Richtung.**
 *
 * Dieselbe Fehlerklasse, vor der `STATUS.md` in seinem eigenen Kopf warnt.
 *
 * **Warum vier und nicht zwölf.** Wer einem Lieferanten zwölf Fragen schickt,
 * bekommt keine Antwort — jede zusätzliche Frage senkt die Wahrscheinlichkeit
 * aller übrigen. Deshalb steht bei jeder Frage, welche Punkte sie schließt,
 * und `fragenOhnePunkt` meldet jede, die keinen schließt. Eine Frage, die
 * nichts löst, kostet die Antwort auf die, die etwas löst.
 *
 * **Dieser Text wird hier nicht versendet.** Das Modul erzeugt ihn; das
 * Versenden an Dritte ist und bleibt Sache des Auftraggebers.
 */

import { textZeile } from './format.js';

/**
 * Die Fragen.
 *
 * `schliesst` nennt die Kennungen aus `npm run offenepunkte`. Sie sind der
 * Grund, warum die Frage im Brief steht — und `punkteOhneFrage` hält die
 * Liste gegen die tatsächlich offenen Punkte, damit keiner stillschweigend
 * ungefragt bleibt.
 */
export const FRAGEN = Object.freeze([
  Object.freeze({
    id: 'artikelliste',
    titel: 'Artikelliste aus dem Kundenkonto',
    schliesst: Object.freeze(['artikelliste', 'feed:GTIN/EAN', 'feed:Marke', 'feed:Produktbild', 'preisalter']),
    frage: 'Können Sie uns die Artikelliste unseres Kundenkontos als Datei zur Verfügung '
      + 'stellen — je Artikel Ihre Artikelnummer, die Bezeichnung, die EAN/GTIN, den '
      + 'Hersteller, die Verpackungseinheit und den aktuellen Nettopreis? Ein Verweis auf '
      + 'Produktbild oder Datenblatt, soweit vorhanden, wäre uns viel wert.',
    warum: 'Die eine Frage, die am meisten löst. Der Katalog stammt heute aus fünfzehn '
      + 'Rechnungen; was nie auf einer Rechnung stand, kennt er nicht. Ohne EAN, Marke und '
      + 'Bild wird der Produktfeed nicht teilweise angenommen, sondern abgelehnt — und ohne '
      + 'aktuelle Preise ist der älteste Einstand 133 Tage alt.',
  }),
  Object.freeze({
    id: 'lieferzeit',
    titel: 'Lieferzeit in Werktagen',
    schliesst: Object.freeze(['lieferzeit']),
    frage: 'Mit welcher Lieferzeit in Werktagen ab Bestelleingang dürfen wir rechnen — und '
      + 'unterscheidet sie sich zwischen Lagerware und Streckenware?',
    warum: 'Ohne sie darf keine Auftragsbestätigung hinaus: Der Beleg nennt einen Termin, und '
      + 'einen Termin, den niemand zugesagt hat, sagt dieser Shop nicht zu. Der Rechenkern '
      + 'sperrt die Bestellung von selbst, solange das Feld leer ist.',
  }),
  Object.freeze({
    id: 'preisrhythmus',
    titel: 'Rhythmus der Preisänderungen',
    schliesst: Object.freeze(['preisrhythmus']),
    // **Geschärft am 3. September.** Die Frage lautete nur „In welchem Rhythmus
    // ändern sich Ihre Preise?". Wer eine Frage stellt und dazusagt, was er
    // schon gesehen hat, bekommt eine genauere Antwort — und zeigt, dass er
    // nachgesehen hat.
    frage: 'In welchem Rhythmus ändern sich Ihre Preise, und gibt es feste Termine dafür? '
      + 'Über unsere Belege von April bis August sehen wir bei acht mehrfach gekauften '
      + 'Artikeln keine Änderung; die längste Spanne dazwischen sind 32 Tage.',
    warum: 'Aus fünfzehn Rechnungen nicht ableitbar — sie zeigen, wann wir gekauft haben, nicht, '
      + 'wann die Liste sich ändert. Die 90-Tage-Grenze der Preisalterprüfung ist bis dahin '
      + 'gesetzt und nicht gemessen.',
  }),
  Object.freeze({
    id: 'liefergebiet',
    titel: 'Liefergebiet und Frachtsätze',
    schliesst: Object.freeze(['liefergebiet-lieferant']),
    frage: 'Bis wohin stellen Sie zu, und staffelt sich die Frachtpauschale nach Entfernung? '
      + 'Auf unseren Belegen ist keine Staffel erkennbar.',
    warum: 'Das Liefergebiet des Shops ist heute die vorsichtige Fläche aus der Kampagne — '
      + 'gesetzt, weil aus den Belegen keine Grenze ablesbar und keine ausschließbar ist. '
      + 'Bestätigt oder widerlegt Gate 23.',
  }),
]);

/**
 * Welcher offene Punkt der Gruppe „Anfrage" wird von keiner Frage geschlossen?
 *
 * Die Richtung, die zählt: Ein Punkt ohne Frage bleibt nach dem Gespräch offen,
 * und niemand merkt es, weil das Gespräch stattgefunden hat.
 */
export function punkteOhneFrage(punkte, fragen = FRAGEN) {
  const abgedeckt = new Set(fragen.flatMap((f) => f.schliesst));
  return punkte.filter((p) => !abgedeckt.has(p.id)).map((p) => p.id);
}

/** Und die Gegenrichtung: eine Frage, die keinen offenen Punkt mehr schließt. */
export function fragenOhnePunkt(punkte, fragen = FRAGEN) {
  const offen = new Set(punkte.map((p) => p.id));
  return fragen.filter((f) => !f.schliesst.some((s) => offen.has(s))).map((f) => f.id);
}

/**
 * Darf dieser Brief hinaus?
 *
 * **Der Befund, der diese Funktion ausgelöst hat.** Der Brief braucht eine
 * Rückantwortadresse — sonst ist er eine Frage ohne Empfänger für die Antwort.
 * `betreiber.email` und `betreiber.telefon` sind leer, und beide stehen in
 * `npm run offenepunkte` unter „Liegt vor, fehlt nur in der Datei": zwei
 * Zeilen, die niemand kosten.
 *
 * > **Der billigste offene Punkt sperrt das Gespräch, das acht andere
 * > schließt.**
 *
 * Das stand nirgends. Die Punkte lagen in zwei verschiedenen Gruppen, und
 * zwischen den Gruppen führte keine Linie.
 */
export function darfVersendetWerden(betreiber, lieferant) {
  const gruende = [];
  if (!betreiber?.firma) gruende.push('Absenderfirma fehlt');
  if (!betreiber?.email) gruende.push('Rückantwortadresse fehlt — betreiber.email ist leer');
  if (!betreiber?.telefon) gruende.push('Telefonnummer fehlt — betreiber.telefon ist leer');
  if (!lieferant?.name) gruende.push('Empfänger fehlt');
  return { darf: gruende.length === 0, gruende };
}

/** Eine Zeile mit Bezeichnung, oder die sichtbare Lücke. */
function feld(wert, bezeichnung) {
  const t = textZeile(wert ?? '');
  // Dieselbe Entscheidung wie in `bestellung.js`: Eine leere Angabe wird
  // sichtbar gemacht, nicht weggelassen. Was fehlt, soll im Brief stehen und
  // nicht erst beim Empfänger auffallen.
  return t.trim() ? t : `LUECKE: ${bezeichnung}`;
}

/**
 * Der Brief.
 *
 * Ein Außentext wie jeder andere: Alles Eingesetzte läuft durch `textZeile`,
 * damit ein Zeilenumbruch in einem Feld keine zweite Frage erfindet.
 */
export function erzeugeLieferantenanfrage({ betreiber = {}, lieferant = {}, fragen = FRAGEN } = {}) {
  const pruefung = darfVersendetWerden(betreiber, lieferant);
  const zeilen = [
    `An: ${feld(lieferant.name, 'Name des Lieferanten')}`,
    'Betreff: Artikeldaten und Konditionen für unseren Online-Shop',
    '',
    'Sehr geehrte Damen und Herren,',
    '',
    `wir, die ${feld(betreiber.firma, 'Absenderfirma')} in `
      + `${feld(betreiber.plz, 'PLZ')} ${feld(betreiber.ort, 'Ort')}, beziehen seit `
      + 'Längerem Baustoffe über Sie. Wir bauen derzeit einen Online-Shop für unsere Region '
      + 'auf, in dem wir ausschließlich Ware anbieten, die wir bei Ihnen bestellen. Dafür '
      + 'brauchen wir vier Auskünfte.',
    '',
  ];
  for (const [i, f] of fragen.entries()) {
    zeilen.push(`${i + 1}. ${f.titel}`, `   ${f.frage}`, '');
  }
  zeilen.push(
    'Der Shop führt keine eigene Lagerhaltung; jede Bestellung geht als Bestellung bei Ihnen',
    'ein. Mehr Auskünfte brauchen wir nicht — die vier oben genügen uns.',
    '',
    'Für Rückfragen erreichen Sie uns unter:',
    `  ${feld(betreiber.email, 'E-Mail-Adresse des Absenders')}`,
    `  ${feld(betreiber.telefon, 'Telefonnummer des Absenders')}`,
    '',
    'Mit freundlichen Grüßen',
    feld(betreiber.firma, 'Absenderfirma'),
  );
  return { text: zeilen.join('\n') + '\n', zeilen, versandfaehig: pruefung.darf, gruende: pruefung.gruende };
}
