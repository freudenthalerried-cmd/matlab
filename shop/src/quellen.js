/**
 * Quellenregister — von der Videoaussage zur belegten Aussage.
 *
 * Die Weisung lautet: zusammenfassen, auf Richtigkeit prüfen, verwenden.
 * Der mittlere Schritt braucht eine Regel, sonst ist er ein Gefühl. Diese
 * Regel steht hier, **bevor** die erste Aussage erfasst wird (Gate 17).
 *
 * Der Kern: **Ein Video allein belegt nichts.** Nicht aus Misstrauen gegen
 * Handwerksvideos — viele sind fachlich besser als Prospekte —, sondern weil
 * ein Video keine prüfbare Fundstelle ist. Es kann gelöscht, geschnitten oder
 * korrigiert werden, es nennt seine eigenen Quellen selten, und wer es
 * zitiert, kann eine Verwechslung nicht bemerken. Für den KI-Kanal kommt
 * hinzu: Eine Angabe, die sich als falsch erweist, ist teurer als
 * Schweigen — siehe `ki-sichtbarkeit-konzept.md`.
 *
 * Ein Video ist deshalb ein **Hinweis**, keine Quelle: Es sagt, wonach zu
 * suchen ist. Belegt wird die Aussage dann durch Norm, Datenblatt, Behörde
 * oder die eigene Berufserfahrung des Auftraggebers.
 */

import { textZeile } from './format.js';

/**
 * Quellenarten und ihre Beweiskraft.
 *
 * `tragend` heißt: Diese Quelle allein genügt für eine Aussage.
 * `hinweis` heißt: Sie zeigt die Richtung, trägt aber nicht.
 */
export const QUELLENARTEN = Object.freeze({
  norm: { tragend: true, was: 'Norm mit Nummer und Ausgabejahr' },
  datenblatt: { tragend: true, was: 'technisches Merkblatt des Herstellers' },
  behoerde: { tragend: true, was: 'Behörde, Kammer oder Gesetzestext' },
  fachbuch: { tragend: true, was: 'Fachliteratur mit Auflage' },
  eigen: { tragend: true, was: 'eigene Berufserfahrung, als solche gekennzeichnet' },
  video: { tragend: false, was: 'Video — Hinweis, keine Fundstelle' },
  forum: { tragend: false, was: 'Forum oder Kommentar' },
  haendler: { tragend: false, was: 'Werbeaussage eines Händlers' },
});

/** Prüft eine einzelne Quellenangabe auf Vollständigkeit. */
export function pruefeQuelle(quelle) {
  const fehlt = [];
  if (!QUELLENARTEN[quelle?.art]) fehlt.push(`unbekannte Quellenart: ${quelle?.art ?? '(keine)'}`);
  if (!quelle?.titel) fehlt.push('Titel fehlt');
  if (!quelle?.urheber) fehlt.push('Urheber fehlt — wer sagt das?');
  if (!quelle?.stand) fehlt.push('Stand fehlt — von wann ist die Angabe?');
  if (quelle?.art === 'video' && !quelle?.url) fehlt.push('Video ohne Link — nicht nachprüfbar');
  if (quelle?.art === 'norm' && !/\d/.test(String(quelle?.titel ?? ''))) {
    fehlt.push('Norm ohne Nummer — „laut ÖNORM" ist wertlos');
  }
  return { vollstaendig: fehlt.length === 0, fehlt };
}

/**
 * Sind zwei Quellen voneinander unabhängig?
 *
 * Zwei Videos desselben Kanals sind eine Quelle, nicht zwei. Ebenso zwei
 * Seiten desselben Herstellers. Wer das nicht trennt, hält Wiederholung für
 * Bestätigung — der häufigste Irrtum beim Nachrecherchieren.
 */
export function unabhaengig(a, b) {
  if (!a || !b) return false;
  const gleicherUrheber = textZeile(a.urheber).toLowerCase() === textZeile(b.urheber).toLowerCase();
  return !gleicherUrheber;
}

/**
 * Ist diese Aussage belegt?
 *
 * Zwei Wege, und nur diese zwei:
 *   1. Mindestens **eine tragende Quelle** (Norm, Datenblatt, Behörde,
 *      Fachbuch, eigene Erfahrung).
 *   2. Mindestens **zwei voneinander unabhängige** nicht-tragende Quellen —
 *      das reicht für eine Einordnung, nicht für einen Kennwert.
 *
 * Alles andere ist unbelegt und geht nicht in einen Text.
 */
export function istBelegt(aussage, quellenverzeichnis) {
  const quellen = (aussage?.quellen ?? [])
    .map((id) => quellenverzeichnis[id])
    .filter(Boolean);

  const unvollstaendig = quellen
    .map((q) => ({ q, pruefung: pruefeQuelle(q) }))
    .filter((x) => !x.pruefung.vollstaendig);

  const tragende = quellen.filter((q) => QUELLENARTEN[q.art]?.tragend);
  const hinweise = quellen.filter((q) => !QUELLENARTEN[q.art]?.tragend);

  // Unabhängige Hinweisquellen zählen — gleicher Urheber zählt einmal.
  const urheber = new Set(hinweise.map((q) => textZeile(q.urheber).toLowerCase()));

  const gruende = [];
  if (quellen.length === 0) gruende.push('keine Quelle angegeben');
  for (const x of unvollstaendig) {
    gruende.push(`Quelle „${x.q.titel ?? x.q.id}" unvollständig: ${x.pruefung.fehlt.join(', ')}`);
  }
  if (tragende.length === 0 && urheber.size < 2) {
    gruende.push(
      urheber.size === 1
        ? 'nur eine Hinweisquelle (z. B. ein Video) — sie zeigt die Richtung, sie belegt nicht'
        : 'keine tragende Quelle und keine zwei unabhängigen Hinweise',
    );
  }

  // Ein Kennwert (Zahl mit Einheit) verlangt immer eine tragende Quelle;
  // zwei sich einige Videos ersetzen kein Datenblatt.
  const istKennwert = /\d/.test(String(aussage?.text ?? '')) && Boolean(aussage?.kennwert);
  if (istKennwert && tragende.length === 0) {
    gruende.push('Kennwert ohne tragende Quelle — Zahlen brauchen Norm oder Datenblatt');
  }

  return {
    belegt: gruende.length === 0,
    tragende: tragende.length,
    unabhaengigeHinweise: urheber.size,
    gruende,
  };
}

/** Wertet ein ganzes Quellen- und Aussagenverzeichnis aus. */
export function werteRechercheAus(recherche) {
  const verzeichnis = Object.fromEntries((recherche?.quellen ?? []).map((q) => [q.id, q]));
  const aussagen = (recherche?.aussagen ?? []).map((a) => ({
    id: a.id,
    text: a.text,
    ...istBelegt(a, verzeichnis),
  }));
  const offen = aussagen.filter((a) => !a.belegt);
  return {
    quellen: Object.keys(verzeichnis).length,
    aussagen: aussagen.length,
    belegt: aussagen.length - offen.length,
    offen,
    verwendbar: offen.length === 0 && aussagen.length > 0,
  };
}
