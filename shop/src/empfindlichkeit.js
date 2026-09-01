/**
 * Welche der vier Annahmen zuerst gemessen gehört.
 *
 * Die ganze Planung ruht auf vier Zahlen: Rohmarge, Werbekostenanteil,
 * Umsatzquote und Warenkorb. Keine davon ist belegt. Was bisher fehlte, ist die
 * Frage, welche von ihnen am meisten wehtut, wenn sie danebenliegt — und damit
 * die Antwort darauf, wofür man das erste Geld ausgibt.
 *
 * Gemessen wird die Wirkung auf den **Besucherbedarf**, nicht auf den Umsatz.
 * Der Umsatz ist eine Zwischengröße; die Besucher sind das, was tatsächlich
 * beschafft werden muss, und laut
 * `docs/baustoff-shop/kostenbild-und-sessionbedarf.md` der Engpass des ganzen
 * Modells.
 *
 * Zwei Dinge sind dabei zu beachten. Erstens ist die Wirkung **nicht linear**:
 * Die Rohmarge steht im Nenner, ihre Elastizität wächst, je weiter sie fällt.
 * Zweitens gibt es einen Punkt, an dem das Modell gar nicht mehr trägt —
 * Werbung und Gebühren fressen die Rohmarge auf. Beides wird ausgewiesen statt
 * geglättet.
 */

import { noetigerUmsatz } from './kostenbild.js';

/**
 * Die vier Annahmen, mit ihrer Herkunft und ihrer Konfidenz.
 *
 * `richtung` sagt, welche Veränderung ungünstig ist — bei der Rohmarge ist es
 * die Verringerung, beim Werbekostenanteil die Erhöhung. Ohne diese Angabe
 * ließe sich „10 % schlechter" nicht einheitlich bilden.
 */
export const ANNAHMEN = [
  {
    id: 'rohmarge',
    name: 'Rohmarge',
    // **Berichtigt am 01.09.** Hier stand 0,35 mit „Gate 1 setzt die
    // Untergrenze bei 32 %". Beides gehört zum Radonmodell mit
    // Herstellerkonditionen, das der Auftraggeber am 22. August verlassen hat;
    // Gate 1 ist seither gegenstandslos (PARAMETER.md). Eine Annahmenliste,
    // die eine überholte Annahme führt, misst die Empfindlichkeit des
    // falschen Plans — und zwar zu günstig: 35 % statt 25 % ist ein Drittel
    // mehr Luft, als es gibt.
    basis: 0.25,
    // **Keine eigene Grenze mehr.** An die Stelle von Gate 1 tritt Gate 20:
    // keine Bestellung ohne positiven Deckungsbeitrag. Das ist keine
    // Prozentschwelle, sondern genau der Punkt, an dem `noetigerUmsatz`
    // ohnehin `tragfaehig: false` meldet und die Elastizität ihn als
    // `traegtNicht` ausweist. Eine zweite Schwelle daneben wäre ein zweiter
    // Weg zur selben Aussage.
    grenze: null,
    schlechterIst: 'kleiner',
    konfidenz: 'Weisung des Auftraggebers vom 25.08.',
    herkunft: 'PARAMETER.md und marge-25-prozent.md; deckungsgleich mit ZIELMARGE in baustoffkatalog.js',
    klaertDurch: 'Ist entschieden. Was offen bleibt, ist die Einkaufsseite — der Preisrhythmus des Lieferanten',
  },
  {
    id: 'werbeanteil',
    name: 'Werbekostenanteil',
    basis: 0.10,
    // Die dokumentierte Tragfähigkeitsgrenze des laufenden Modells: Ab 23 %
    // Werbeanteil bleibt bei 25 % Rohmarge praktisch nichts mehr übrig
    // (marge-25-prozent.md: „24 % — rechnerisch unmöglich"). Die Grenze
    // gehört zu **dieser** Annahme, seit die der Rohmarge weggefallen ist.
    grenze: 0.23,
    schlechterIst: 'groesser',
    konfidenz: 'Annahme',
    herkunft: 'phase3-unit-economics.md, realistisches Szenario',
    klaertDurch: 'Erst der laufende Betrieb; vorab nur grob schätzbar',
  },
  {
    id: 'umsatzProSession',
    name: 'Umsatzquote je Besuch',
    basis: 0.02,
    schlechterIst: 'kleiner',
    konfidenz: 'Annahme',
    herkunft: 'phase3-unit-economics.md; im erklärungsbedürftigen B2B eher optimistisch. '
      + 'DIESELBE GRÖSSE wie die Kaufquote der Kampagne (bin/kampagne.mjs) — zwei Namen für eine Zahl',
    klaertDurch: 'Erst der laufende Betrieb. Ab wann ein Ausbleiben von Bestellungen sie ausschließt, '
      + 'rechnet src/werbewirkung.js: 299 Klicks für 1 %, 598 für 0,5 %',
  },
  {
    id: 'warenkorbNetto',
    name: 'Warenkorb netto',
    basis: 650,
    schlechterIst: 'kleiner',
    konfidenz: 'hergeleitet, mittel',
    herkunft: 'phase4-sortiment-und-materialwert.md, aus der Stückliste',
    klaertDurch: 'Die Herstelleranfragen schärfen sie mit, weil echte Preise einfließen',
  },
];

const findeAnnahme = (id) => {
  const a = ANNAHMEN.find((x) => x.id === id);
  if (!a) throw new Error(`Unbekannte Annahme: ${id}`);
  return a;
};

/** Sessionbedarf für eine Lage; null, wenn das Modell nicht mehr trägt. */
export function sessionbedarf(lage, zahlwegId) {
  const e = noetigerUmsatz(lage, zahlwegId);
  return e.tragfaehig ? e.sessions : null;
}

/**
 * Variiert eine Annahme um einen relativen Betrag ins Ungünstige.
 * @param {number} umAnteil z. B. 0.10 für zehn Prozent schlechter
 */
export function verschlechtere(lage, annahmeId, umAnteil) {
  const a = findeAnnahme(annahmeId);
  const alt = lage[annahmeId];
  if (typeof alt !== 'number') throw new Error(`Die Lage führt keinen Wert für ${annahmeId}`);
  const neu = a.schlechterIst === 'kleiner' ? alt * (1 - umAnteil) : alt * (1 + umAnteil);
  return { ...lage, [annahmeId]: neu };
}

/**
 * Elastizität: Um wie viel Prozent steigt der Besucherbedarf, wenn diese
 * Annahme um zehn Prozent ins Ungünstige rutscht?
 *
 * Ein Wert von 1,0 heißt: proportional. Alles darüber heißt, dass die Annahme
 * verstärkt — und genau diese Annahmen gehören zuerst gemessen.
 */
export function elastizitaet(lage, annahmeId, zahlwegId, umAnteil = 0.10) {
  const basis = sessionbedarf(lage, zahlwegId);
  if (basis === null) throw new Error('Die Ausgangslage trägt das Modell schon nicht');

  const a = findeAnnahme(annahmeId);
  const geprueft = verschlechtere(lage, annahmeId, umAnteil);
  const schlechter = sessionbedarf(geprueft, zahlwegId);

  // **Berichtigt am 01.09.** Der Vergleich war fest auf „kleiner als" gestellt
  // und hieß `untergrenze` — richtig für die Rohmarge, deren Grenze aus Gate 1
  // stammte. Gate 1 ist seit dem 22.08. gegenstandslos; die Grenze, die es im
  // laufenden Modell gibt, gehört zum **Werbekostenanteil**, und der wird
  // schlechter, wenn er *steigt*. Ein fest auf „kleiner" gestellter Vergleich
  // hätte sie nie ausgelöst — eine Wache, die in die falsche Richtung sieht.
  const grenze = a.grenze ?? null;
  const wert = geprueft[annahmeId];
  const grenzeGerissen = grenze != null && (a.schlechterIst === 'kleiner'
    ? wert < grenze - 1e-12
    : wert > grenze + 1e-12);
  const gateHinweis = grenzeGerissen
    ? {
      grenzeGerissen: true,
      grenze,
      hinweisGrenze: `Der geprüfte Wert ${wert} reißt die dokumentierte Grenze von ${grenze} — `
        + 'dahinter trägt das Modell nicht mehr, unabhängig von der Besucherzahl',
    }
    : { grenzeGerissen: false };

  if (schlechter === null) {
    return {
      annahme: annahmeId,
      basisSessions: basis,
      neueSessions: null,
      traegtNicht: true,
      hinweis: 'Bei dieser Verschlechterung trägt das Modell nicht mehr',
      ...gateHinweis,
    };
  }

  return {
    annahme: annahmeId,
    basisSessions: basis,
    neueSessions: schlechter,
    mehrSessions: schlechter - basis,
    veraenderung: (schlechter - basis) / basis,
    elastizitaet: (schlechter - basis) / basis / umAnteil,
    traegtNicht: false,
    ...gateHinweis,
  };
}

/** Alle vier Annahmen, nach Wirkung auf den Besucherbedarf geordnet. */
export function rangfolge(lage, zahlwegId, umAnteil = 0.10) {
  return ANNAHMEN.map((a) => {
    const e = elastizitaet(lage, a.id, zahlwegId, umAnteil);
    return { ...e, name: a.name, konfidenz: a.konfidenz, klaertDurch: a.klaertDurch };
  }).sort((x, y) => {
    if (x.traegtNicht !== y.traegtNicht) return x.traegtNicht ? -1 : 1;
    return (y.elastizitaet ?? 0) - (x.elastizitaet ?? 0);
  });
}

/**
 * Sucht den Punkt, an dem das Modell kippt.
 *
 * Sinnvoll nur für Annahmen, deren Verschlechterung die Deckungsbeitragsrate
 * gegen null treibt — bei der Umsatzquote etwa gibt es keinen Kipppunkt, dort
 * steigt der Besucherbedarf nur immer weiter.
 */
export function kipppunkt(lage, annahmeId, zahlwegId, schritt = 0.01, maxAnteil = 0.9) {
  // Wo die dokumentierte Grenze fällt, steht fest, bevor irgendetwas gerechnet
  // wird: der Anteil, ab dem der Wert sie reißt — in der Richtung, in der die
  // Annahme schlechter wird. Beim Werbekostenanteil (Basis 10 %, Grenze 23 %)
  // sind das +130 %; er müsste sich also mehr als verdoppeln.
  const a = findeAnnahme(annahmeId);
  const alt = lage[annahmeId];
  const grenze = a.grenze ?? null;
  const richtungPasst = grenze != null && typeof alt === 'number'
    && (a.schlechterIst === 'kleiner' ? alt > grenze : alt < grenze);
  const grenzeBeiAnteil = richtungPasst
    ? Math.round(Math.abs(1 - grenze / alt) * 1000) / 1000
    : null;

  for (let anteil = schritt; anteil <= maxAnteil + 1e-9; anteil += schritt) {
    const geprueft = verschlechtere(lage, annahmeId, anteil);
    if (sessionbedarf(geprueft, zahlwegId) === null) {
      return { kippt: true, beiAnteil: Math.round(anteil * 1000) / 1000, wert: geprueft[annahmeId], grenzeBeiAnteil };
    }
  }
  return { kippt: false, geprueftBis: maxAnteil, grenzeBeiAnteil };
}
