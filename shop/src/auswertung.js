/**
 * Auswertungsbogen für die Herstellerantworten.
 *
 * Sobald die dreizehn Anfragen aus `anschreiben-entwuerfe.md` freigegeben sind
 * und Antworten eintreffen, entscheidet sich daran Gate 1, 2 und 6 zugleich.
 * Seit Entwurf C werden zwei Antwortwege gleichrangig ausgewertet: der
 * Händlerrabatt auf eine Liste (Hersteller) und der Netto-Einkaufspreis gegen
 * den Straßenpreis-Deckel (Großhandel). Diese
 * Datei nimmt die Auswertung vorweg: Sie prüft jede Antwort gegen die vier
 * Bedingungen aus `entscheidungsmatrix.md`, setzt die zugesagte Kondition in
 * die Kaskade ein und weist aus, was daraus für den Besucherbedarf folgt.
 *
 * Der Zweck ist, die Auswertung von der Freigabe zu **entkoppeln**. Wenn die
 * Antworten kommen, sind sie nur noch einzutragen; niemand muss dann erst
 * überlegen, wie sie zu lesen sind. Die Regel steht vorher fest — genau das
 * verlangt Gate 17.
 *
 * **Die Härte ist Absicht.** Gate 2 ist eine UND-Verknüpfung: Drei von vier
 * Bedingungen sind ein Nein. Jede der vier war einzeln der Grund, aus dem ein
 * Gate gesetzt wurde.
 */

import { MARGENUNTERGRENZE } from './preis.js';
import { noetigerUmsatz } from './kostenbild.js';

/** Was Gate 2 verlangt. Reihenfolge wie in `entscheidungsmatrix.md`. */
export const GATE2_BEDINGUNGEN = [
  {
    id: 'streckengeschaeft',
    text: 'Streckengeschäft mit Direktversand an den Endkunden',
    pruefe: (a) => a.streckengeschaeft === true,
  },
  {
    id: 'kondition',
    text: `Kondition, aus der ≥ ${Math.round(MARGENUNTERGRENZE * 100)} % Rohmarge bleiben — als Händlerrabatt oder als Netto-Einkaufspreis gegen den Straßenpreis-Deckel`,
    pruefe: (a) => {
      const marge = margeAusAntwort(a);
      return typeof marge === 'number' && marge >= MARGENUNTERGRENZE;
    },
  },
  {
    id: 'fracht',
    text: 'Kalkulierbare Frachtregelung, nicht „nach Aufwand"',
    pruefe: (a) => a.frachtmodell === 'pauschale' || a.frachtmodell === 'freiHausAb' || a.frachtmodell === 'staffel',
  },
  {
    id: 'produktdaten',
    text: 'Strukturierte Produktdaten oder maschinenlesbare Preisliste mit Rhythmus',
    pruefe: (a) => ['csv', 'api', 'excel'].includes(a.produktdaten) && Boolean(a.preisrhythmus),
  },
];

/**
 * Wie viel Preisspielraum ein Rabatt lässt.
 *
 * Der Verkaufspreis ist nach `preis.js` bei der UVP gedeckelt. Wer 35 % Rabatt
 * bekommt, hat damit **höchstens** 35 % Rohmarge — und die auch nur, wenn er zur
 * vollen UVP verkauft. Jeder Prozentpunkt Nachlass geht unmittelbar von der
 * Marge ab.
 *
 * Das ist der Punkt, an dem eine Zusage von „genau 35 %" gefährlich aussieht:
 * Sie erfüllt die Bedingung und lässt trotzdem kaum Luft.
 */
export function margenspielraum(haendlerrabatt) {
  if (typeof haendlerrabatt !== 'number') throw new Error('Der Spielraum braucht einen Rabattsatz');

  // Verkauf zu (1 − nachlass) × UVP, Einkauf zu (1 − rabatt) × UVP.
  // Rohmarge = 1 − (1 − rabatt) / (1 − nachlass) ≥ Untergrenze.
  const maxNachlass = 1 - (1 - haendlerrabatt) / (1 - MARGENUNTERGRENZE);

  return {
    art: 'rabatt',
    haendlerrabatt,
    marge: haendlerrabatt,
    margeBeiUvp: haendlerrabatt,
    reichtOhneNachlass: haendlerrabatt >= MARGENUNTERGRENZE,
    maxNachlass: Math.max(0, maxNachlass),
    hinweis:
      maxNachlass <= 0
        ? 'Kein Preisspielraum — jeder Nachlass reißt die Untergrenze'
        : `Bis ${(maxNachlass * 100).toFixed(1)} % Nachlass auf die UVP bleibt die Untergrenze gehalten`,
  };
}

/**
 * Der Spielraum für den Großhandelsweg (Entwurf C).
 *
 * Der Großhandel nennt keinen Rabatt auf eine Liste, sondern einen
 * **Netto-Einkaufspreis je Kunde**. Eine Liste, gegen die man rechnen könnte,
 * gibt es nicht — gerechnet wird gegen den **Straßenpreis-Deckel** aus
 * `strassenpreisanker-sortiment.md` und `vertriebswege-der-hersteller.md`:
 * den Preis, den derselbe Kunde bei einem sichtbaren Händler ohnehin zahlt.
 * Wer darüber verkauft, verkauft nicht.
 *
 * Dieselbe Frage, andere Bezugsgröße: Wie viel unter dem Deckel kann der
 * Shop anbieten, bevor die Untergrenze reißt?
 */
export function nettopreisSpielraum(einkaufNetto, deckelNetto) {
  if (!(einkaufNetto > 0) || !(deckelNetto > 0)) {
    throw new Error('Der Spielraum braucht Einkauf und Straßenpreis-Deckel, beide netto und größer null');
  }

  const marge = 1 - einkaufNetto / deckelNetto;
  // Verkauf zu (1 − nachlass) × Deckel: Marge ≥ Untergrenze verlangt
  // VK ≥ EK / (1 − UG), also nachlass ≤ 1 − EK / ((1 − UG) · Deckel).
  const maxNachlass = 1 - einkaufNetto / ((1 - MARGENUNTERGRENZE) * deckelNetto);

  return {
    art: 'nettopreis',
    einkaufNetto,
    deckelNetto,
    marge,
    margeAmDeckel: marge,
    reichtAmDeckel: marge >= MARGENUNTERGRENZE,
    maxNachlass: Math.max(0, maxNachlass),
    hinweis:
      maxNachlass <= 0
        ? 'Kein Preisspielraum — schon am Straßenpreis-Deckel reißt die Untergrenze'
        : `Bis ${(maxNachlass * 100).toFixed(1)} % unter dem Straßenpreis-Deckel bleibt die Untergrenze gehalten`,
  };
}

/**
 * Liest aus einer Antwort die Rohmarge, gleich welchen Wegs.
 *
 * Nennt eine Antwort beides, gilt der **schlechtere** Wert — eine Antwort,
 * die sich mit der günstigeren Lesart schmückt, würde sonst besser bewertet
 * als zwei ehrliche.
 */
export function margeAusAntwort(antwort = {}) {
  const wege = [];
  if (typeof antwort.haendlerrabatt === 'number') wege.push(antwort.haendlerrabatt);
  if (antwort.einkaufNetto > 0 && antwort.strassenpreisDeckelNetto > 0) {
    wege.push(1 - antwort.einkaufNetto / antwort.strassenpreisDeckelNetto);
  }
  if (wege.length === 0) return null;
  return Math.min(...wege);
}

/** Der passende Spielraum zu einer Antwort — Rabattweg oder Großhandelsweg. */
export function spielraumAusAntwort(antwort = {}) {
  const rabatt = typeof antwort.haendlerrabatt === 'number' ? margenspielraum(antwort.haendlerrabatt) : null;
  const netto =
    antwort.einkaufNetto > 0 && antwort.strassenpreisDeckelNetto > 0
      ? nettopreisSpielraum(antwort.einkaufNetto, antwort.strassenpreisDeckelNetto)
      : null;
  if (rabatt && netto) return netto.marge <= rabatt.marge ? netto : rabatt;
  return netto ?? rabatt;
}

/**
 * Wertet eine einzelne Antwort aus.
 *
 * Unbeantwortete Punkte gelten als **nicht erfüllt**, nicht als offen. Ein
 * Hersteller, der zur Fracht nichts sagt, hat keine kalkulierbare
 * Frachtregelung zugesagt — und genau darauf käme es an.
 */
export function werteAntwortAus(antwort) {
  if (!antwort?.hersteller) throw new Error('Jede Antwort braucht einen Hersteller');

  const geprueft = GATE2_BEDINGUNGEN.map((b) => ({
    id: b.id,
    text: b.text,
    erfuellt: b.pruefe(antwort) === true,
  }));

  const beziffert = margeAusAntwort(antwort) !== null;

  return {
    hersteller: antwort.hersteller,
    sortiment: antwort.sortiment ?? null,
    beziffert,
    bedingungen: geprueft,
    erfuellt: geprueft.filter((g) => g.erfuellt).length,
    bestanden: geprueft.every((g) => g.erfuellt),
    fehlend: geprueft.filter((g) => !g.erfuellt).map((g) => g.text),
    spielraum: beziffert ? spielraumAusAntwort(antwort) : null,
    // Aus beleg-und-reihengeschaeft.md: Nicht der Sitz entscheidet, sondern wer fakturiert.
    fakturierendesLand: antwort.fakturierendesLand ?? null,
    reihengeschaeft: antwort.fakturierendesLand ? antwort.fakturierendesLand !== 'AT' : null,
  };
}

/**
 * Wertet die ganze Runde aus.
 *
 * Prüfung A gilt als bestanden, wenn **mindestens zwei** Hersteller alle vier
 * Bedingungen zugleich erfüllen. Dass es zwei sein müssen, steht in
 * `phase2-lieferantenlandkarte.md`: Ein einzelner Lieferant ist kein Sortiment,
 * sondern eine Abhängigkeit.
 */
export function werteRundeAus(antworten, lage) {
  const einzeln = antworten.map(werteAntwortAus);
  const bestanden = einzeln.filter((e) => e.bestanden);

  const ergebnis = {
    antworten: einzeln.length,
    beziffert: einzeln.filter((e) => e.beziffert).length,
    bestanden: bestanden.length,
    pruefungA: bestanden.length >= 2,
    einzeln,
  };

  if (!ergebnis.pruefungA) {
    ergebnis.grund =
      bestanden.length === 0
        ? 'Kein Hersteller erfüllt alle vier Bedingungen'
        : 'Nur ein Hersteller erfüllt alle vier — ein einzelner Lieferant ist kein Sortiment';
    return ergebnis;
  }

  // Für die Planung zählt der schwächere der beiden besten: Er begrenzt die
  // Mischmarge, weil beide Sortimentsteile gebraucht werden. `marge` tragen
  // beide Wege — Rabatt wie Netto-Einkauf gegen den Straßenpreis-Deckel.
  const raenge = bestanden.map((e) => e.spielraum.marge).sort((a, b) => b - a);
  const tragendeMarge = raenge[1];

  ergebnis.tragendeMarge = tragendeMarge;
  ergebnis.folgen = lage ? noetigerUmsatz({ ...lage, rohmarge: tragendeMarge }, lage.zahlweg ?? 'karte-stripe') : null;

  return ergebnis;
}

/**
 * Der leere Bogen — die Felder, die eine Antwort ausfüllen muss.
 *
 * Steht hier, damit beim Eintragen nichts vergessen wird und niemand ein Feld
 * erfindet, das im Anschreiben gar nicht gefragt wurde.
 */
export const BOGEN = [
  { feld: 'hersteller', frage: 'Name des Herstellers oder Großhändlers', pflicht: true },
  { feld: 'sortiment', frage: 'Bahnen, Rohr oder Zubehör', pflicht: false },
  { feld: 'streckengeschaeft', frage: 'Direktversand an den Endkunden möglich? (ja/nein)', pflicht: true },
  { feld: 'haendlerrabatt', frage: 'Händlerrabatt auf UVP als Anteil, z. B. 0.38 (Entwurf A)', pflicht: false },
  { feld: 'einkaufNetto', frage: 'Netto-Einkaufspreis je Einheit in Euro (Entwurf C)', pflicht: false },
  { feld: 'strassenpreisDeckelNetto', frage: 'Straßenpreis-Deckel netto je Einheit, aus dem Straßenpreisanker', pflicht: false },
  { feld: 'frachtmodell', frage: 'pauschale, freiHausAb, staffel oder nachAufwand', pflicht: true },
  { feld: 'produktdaten', frage: 'csv, api, excel oder katalog', pflicht: true },
  { feld: 'preisrhythmus', frage: 'Angekündigter Rhythmus der Preispflege', pflicht: true },
  { feld: 'mindestbestellwert', frage: 'Mindestbestellwert netto in Euro', pflicht: false },
  { feld: 'fakturierendesLand', frage: 'Welche Gesellschaft fakturiert? AT, DE, CH …', pflicht: true },
];

/**
 * Prüft, ob ein Eintrag alle Pflichtfelder trägt.
 *
 * Die Kondition ist seit Entwurf C ein **Entweder-oder** statt eines
 * Pflichtfelds: Entweder ein Händlerrabatt (Herstellerweg) oder ein
 * Netto-Einkaufspreis **samt** Straßenpreis-Deckel (Großhandelsweg). Ein
 * Einkaufspreis ohne Deckel ist keine Kondition — ohne Bezugsgröße lässt
 * sich daraus keine Marge lesen, und genau diese Verwechslung von Zahlen
 * ohne Bezug war schon zweimal der Fehler (Frachtschwelle, Brutto-UVP).
 */
export function pruefeBogen(antwort = {}) {
  const fehlend = BOGEN.filter((f) => f.pflicht && (antwort[f.feld] === undefined || antwort[f.feld] === null))
    .map((f) => f.frage);
  if (margeAusAntwort(antwort) === null) {
    fehlend.push(
      'Kondition: entweder Händlerrabatt (Entwurf A) oder Netto-Einkaufspreis samt Straßenpreis-Deckel (Entwurf C)',
    );
  }
  return { vollstaendig: fehlend.length === 0, fehlend };
}
