/**
 * Materialbedarf für die Radonvorsorge eines Gebäudes.
 *
 * Rechner Nummer 2 aus phase7-inhalte-und-funnel.md. Sein Zweck ist nicht die
 * Bequemlichkeit, sondern ein konkreter Vorteil: Radonfolien werden nur
 * rollenweise abgegeben, Teilmengen sind ausgeschlossen. Wer 140 m² braucht
 * und Rollen zu 37,5 m² kauft, zahlt Verschnitt — und erfährt das heute erst
 * an der Kasse. Dieser Rechner sagt es vorher.
 *
 * Alle Ansätze sind Planungswerte. Herstellerangaben und die Ausführungsplanung
 * gehen im Zweifel vor; das gehört in die Ausgabe, nicht ins Kleingedruckte.
 */

export const ANSAETZE = {
  /** Überlappung der Bahnen, Anteil auf die Fläche. */
  ueberlappung: 0.10,
  /** Verschnitt an Ecken und Anschlüssen, Anteil auf die Fläche. */
  verschnitt: 0.05,
  /** Höhe der Aufkantung an aufgehenden Bauteilen, in Metern. */
  aufkantungHoehe: 0.30,
  /** Rohrabstand der Drainage im Kiesbett, in Metern (ÖNORM S 5280-2: bis 8 m). */
  rohrabstand: 8,
  /** Zuschlag auf die Rohrlänge für Bögen, Anschlüsse, Verschnitt. */
  rohrZuschlag: 0.15,
  /** Primerverbrauch je Quadratmeter, in Litern. */
  primerProM2: 0.30,
  /** Dichtbandbedarf je Durchführung, in Metern. */
  dichtbandProDurchfuehrung: 1.0,
};

const aufrunden = (n) => Math.ceil(n - 1e-9);

/**
 * @param {object} gebaeude
 * @param {number} gebaeude.laenge   Außenmaß in Metern
 * @param {number} gebaeude.breite   Außenmaß in Metern
 * @param {number} gebaeude.durchfuehrungen  Zahl der Leitungsdurchführungen
 * @param {boolean} gebaeude.mitDrainage  true im Radonschutzgebiet
 * @param {object} katalog  Ergebnis aus ladeKatalog()
 */
export function berechneBedarf(gebaeude, katalog) {
  const { laenge, breite, durchfuehrungen = 0, mitDrainage = false } = gebaeude;

  if (!(laenge > 0) || !(breite > 0)) throw new Error('Länge und Breite müssen positiv sein');
  if (!Number.isInteger(durchfuehrungen) || durchfuehrungen < 0) {
    throw new Error('Durchführungen müssen eine ganze Zahl ab 0 sein');
  }

  const flaeche = laenge * breite;
  const umfang = 2 * (laenge + breite);

  // Bahnen: Fläche plus Aufkantung, dann Überlappung und Verschnitt.
  const aufkantung = umfang * ANSAETZE.aufkantungHoehe;
  const bahnBedarfM2 = (flaeche + aufkantung) * (1 + ANSAETZE.ueberlappung + ANSAETZE.verschnitt);

  const positionen = [];
  const hinweise = [];
  const nichtImSortiment = [];

  const nimm = (sku, menge, begruendung) => {
    const artikel = katalog.artikel.find((a) => a.sku === sku);
    if (!artikel) {
      // Das Sortiment kann kleiner sein als der Rechner — aber eine Position,
      // die stumm verschwindet, macht die Stückliste unbemerkt unvollständig.
      // Der Kopf dieser Datei verspricht: das gehört in die Ausgabe, nicht ins
      // Kleingedruckte.
      nichtImSortiment.push(sku);
      return;
    }
    positionen.push({ sku, menge, bezeichnung: artikel.bezeichnung, begruendung });
  };

  // --- Abdichtung -------------------------------------------------------
  const rolle = katalog.artikel.find((a) => a.sku === 'AB-RD-375');
  if (rolle) {
    const rollenflaeche = 37.5;
    const rollen = aufrunden(bahnBedarfM2 / rollenflaeche);
    const gelieferteFlaeche = rollen * rollenflaeche;
    const ueberschuss = gelieferteFlaeche - bahnBedarfM2;

    nimm(
      'AB-RD-375',
      rollen,
      `${bahnBedarfM2.toFixed(1)} m² Bedarf inkl. ${(aufkantung).toFixed(1)} m² Aufkantung, ` +
        `Überlappung und Verschnitt — Rollen zu ${rollenflaeche} m²`,
    );

    // Die Prozentzahl gehört auf den Bedarf, nicht auf die gelieferte Fläche:
    // „X m² über dem Bedarf (Y %)" heißt Y = X/Bedarf. Die erste Fassung
    // teilte durch die gelieferte Fläche und untertrieb die Rollenbindung —
    // aus 22 % über dem Bedarf wurden 18 %.
    hinweise.push(
      `Rollenbindung: ${rollen} Rollen ergeben ${gelieferteFlaeche.toFixed(1)} m², ` +
        `das sind ${ueberschuss.toFixed(1)} m² über dem Bedarf ` +
        `(${((ueberschuss / bahnBedarfM2) * 100).toFixed(0)} %). Teilmengen gibt es nicht.`,
    );
  } else {
    // Der Wächter oben überspringt den ganzen Bahnen-Block — die Leitposition
    // verschwände stumm, noch bevor nimm() sie melden könnte.
    nichtImSortiment.push('AB-RD-375');
  }

  const primerLiter = flaeche * ANSAETZE.primerProM2;
  nimm('AB-PR-010', aufrunden(primerLiter / 10), `${primerLiter.toFixed(1)} l bei ${ANSAETZE.primerProM2} l/m² — Gebinde zu 10 l`);

  // --- Zubehör ----------------------------------------------------------
  const dichtbandMeter = umfang + durchfuehrungen * ANSAETZE.dichtbandProDurchfuehrung;
  nimm('ZB-DB-150', aufrunden(dichtbandMeter / 25), `${dichtbandMeter.toFixed(1)} m Umfang und Durchführungen — Rollen zu 25 m`);
  nimm('ZB-MA-SET', 1, 'ein Set Innen- und Außenecken je Gebäude');
  if (durchfuehrungen > 0) {
    nimm('ZB-RR-125', durchfuehrungen, `eine Ringraumdichtung je Durchführung`);
  }

  // --- Drainage ---------------------------------------------------------
  if (mitDrainage) {
    const rohrMeter = (flaeche / ANSAETZE.rohrabstand) * (1 + ANSAETZE.rohrZuschlag);
    nimm(
      'DR-100-050',
      aufrunden(rohrMeter / 50),
      `${rohrMeter.toFixed(1)} m bei ${ANSAETZE.rohrabstand} m Rohrabstand plus Zuschlag — Ringbund zu 50 m`,
    );
    nimm('DR-FT-SET', 1, 'ein Formteilset je Gebäude');
    nimm('DR-KS-100', 1, 'ein Kontrollschacht je Gebäude');
    nimm('DR-SL-100', 1, 'eine Steigleitung je Gebäude');
  } else {
    hinweise.push(
      'Ohne Radondrainage gerechnet. Sie ist nach ÖNORM S 5280-2 in den ' +
        'Radonschutzgebieten gefordert — im Zweifel die Gemeinde prüfen.',
    );
  }

  if (nichtImSortiment.length > 0) {
    hinweise.push(
      `Nicht im Sortiment und deshalb nicht enthalten: ${nichtImSortiment.join(', ')} — ` +
        'die Stückliste ist an diesen Stellen unvollständig.',
    );
  }

  hinweise.push('Planungswerte. Herstellerangaben und Ausführungsplanung gehen vor.');

  return {
    flaeche: Number(flaeche.toFixed(1)),
    umfang: Number(umfang.toFixed(1)),
    bahnBedarfM2: Number(bahnBedarfM2.toFixed(1)),
    positionen,
    hinweise,
    /** Direkt für berechneWarenkorb() verwendbar. */
    warenkorbzeilen: positionen.map((p) => ({ sku: p.sku, menge: p.menge })),
  };
}
