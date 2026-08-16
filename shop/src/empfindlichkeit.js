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
 * Die Rohmarge steht im Nenner, ihre Elastizität wächst, je näher man der
 * Untergrenze aus Gate 1 kommt. Zweitens gibt es einen Punkt, an dem das Modell
 * gar nicht mehr trägt — Werbung und Gebühren fressen die Rohmarge auf. Beides
 * wird ausgewiesen statt geglättet.
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
    basis: 0.35,
    untergrenze: 0.32,
    schlechterIst: 'kleiner',
    konfidenz: 'unbelegt',
    herkunft: 'phase3-unit-economics.md; Gate 1 setzt die Untergrenze bei 32 %',
    klaertDurch: 'Die zwölf Herstelleranfragen — kostenlos, freigabepflichtig',
  },
  {
    id: 'werbeanteil',
    name: 'Werbekostenanteil',
    basis: 0.10,
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
    herkunft: 'phase3-unit-economics.md; im erklärungsbedürftigen B2B eher optimistisch',
    klaertDurch: 'Erst der laufende Betrieb — kein Werkzeug misst sie vorab',
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

  const schlechter = sessionbedarf(verschlechtere(lage, annahmeId, umAnteil), zahlwegId);

  if (schlechter === null) {
    return {
      annahme: annahmeId,
      basisSessions: basis,
      neueSessions: null,
      traegtNicht: true,
      hinweis: 'Bei dieser Verschlechterung trägt das Modell nicht mehr',
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
  for (let anteil = schritt; anteil <= maxAnteil + 1e-9; anteil += schritt) {
    const geprueft = verschlechtere(lage, annahmeId, anteil);
    if (sessionbedarf(geprueft, zahlwegId) === null) {
      return { kippt: true, beiAnteil: Math.round(anteil * 1000) / 1000, wert: geprueft[annahmeId] };
    }
  }
  return { kippt: false, geprueftBis: maxAnteil };
}
