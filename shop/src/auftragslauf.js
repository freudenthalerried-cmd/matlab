/**
 * Der Auftrag von der Bestellung bis zur Buchung — als Trockenlauf.
 *
 * Die Vorgabe des Auftraggebers lautet, das Geschäft solle ohne laufendes Zutun
 * bestehen. `phase6-automatisierung.md` beziffert den Restaufwand mit 6,5 bis
 * 12 Stunden im Monat. Beide Aussagen waren bisher Behauptungen: Niemand ist
 * die Kette einmal Schritt für Schritt durchgegangen und hat gezählt, wo sie
 * stehen bleibt.
 *
 * Diese Datei tut genau das. Sie führt keinen einzigen Schritt aus — sie prüft
 * für jeden, ob er unter den gegebenen Umständen von selbst liefe, und
 * protokolliert das Ergebnis. Wer die Kette hier durchlaufen lässt, bekommt
 * eine Zahl statt einer Hoffnung.
 *
 * Die Zeitansätze stammen aus `phase6-automatisierung.md` und sind
 * ausdrücklich Schätzungen. Was hier neu ist, ist nicht ihre Höhe, sondern
 * ihre Zuordnung: welcher Schritt sie verursacht und welche fehlende
 * Voraussetzung ihn erzwingt.
 */

/**
 * Was die Umgebung bereitstellt. Alles `false` heißt: heutiger Stand.
 * Jede Fähigkeit ist ein Vertrag, ein Konto oder eine Schnittstelle —
 * nichts davon entsteht durch Programmieren.
 */
export const WELT_HEUTE = {
  zahlungsanbieter: false,
  produktdatenSchnittstelle: false,
  uidAbfrage: false,
  buchhaltungsanbindung: false,
  echteKonditionen: false,
  betreiberdaten: false,
};

/** Der Ausbauzustand, den die Planung für Stufe 3 unterstellt. */
export const WELT_AUSGEBAUT = {
  zahlungsanbieter: true,
  produktdatenSchnittstelle: true,
  uidAbfrage: true,
  buchhaltungsanbindung: true,
  echteKonditionen: true,
  betreiberdaten: true,
};

/**
 * Die Schritte in ihrer tatsächlichen Reihenfolge.
 *
 * `braucht` nennt die Voraussetzungen aus der Welt. Fehlt eine, fällt der
 * Schritt auf `minutenOhne` Minuten Handarbeit zurück — oder er blockiert,
 * wenn `blockiert` gesetzt ist. Der Unterschied ist wesentlich: Handarbeit
 * kostet Zeit, eine Blockade kostet den Auftrag.
 */
export const SCHRITTE = [
  {
    id: 'eingang',
    name: 'Bestellung geht ein',
    braucht: [],
    minutenOhne: 0,
    blockiert: false,
  },
  {
    id: 'datenpruefung',
    name: 'Bestelldaten und Unternehmerstatus prüfen',
    braucht: [],
    minutenOhne: 0,
    blockiert: false,
    hinweis: 'Läuft im Shop selbst — siehe kunde.js, Gate 7.',
  },
  {
    id: 'uidPruefung',
    name: 'UID beim EU-Informationsaustauschsystem abfragen',
    braucht: ['uidAbfrage'],
    minutenOhne: 2,
    blockiert: false,
    hinweis: 'Ohne Anbindung von Hand über das Portal. Zwei Minuten, aber bei jeder Bestellung.',
  },
  {
    id: 'annahme',
    name: 'Auftragsbestätigung an den Kunden senden',
    braucht: ['echteKonditionen'],
    minutenOhne: 3,
    blockiert: false,
    hinweis:
      'Nach Punkt 2 der eigenen AGB kommt der Vertrag erst hiermit zustande. ' +
      'Der Schritt hat im Ablauf gefehlt — der Shop wäre vom Zahlungseingang ' +
      'direkt zur Lieferantenbestellung gegangen und hätte Geld genommen, ' +
      'bevor er sich gebunden hatte. Steht bewusst vor der Zahlung.',
  },
  {
    id: 'zahlung',
    name: 'Zahlungseingang feststellen',
    braucht: ['zahlungsanbieter'],
    minutenOhne: 0,
    blockiert: true,
    hinweis: 'Ohne Zahlungsanbieter gibt es keinen Zahlungseingang, den man feststellen könnte.',
  },
  {
    id: 'bestellauslösung',
    name: 'Bestellung je Lieferant auslösen',
    braucht: ['produktdatenSchnittstelle', 'echteKonditionen'],
    minutenOhne: 4,
    blockiert: false,
    hinweis: 'Der Bruchpunkt aus Gate 6. Der Entwurf steht fertig da; ohne Schnittstelle muss ihn jemand abschicken.',
  },
  {
    id: 'lieferantenbestaetigung',
    name: 'Auftragsbestätigung des Lieferanten einlesen',
    braucht: ['produktdatenSchnittstelle'],
    minutenOhne: 3,
    blockiert: false,
    hinweis: 'Kommt als PDF oder E-Mail. Lieferzeit und Teilmengen stehen nur dort.',
  },
  {
    id: 'terminauskunft',
    name: 'Liefertermin an den Kunden weitergeben',
    braucht: ['produktdatenSchnittstelle'],
    minutenOhne: 2,
    blockiert: false,
    hinweis: 'Im Streckengeschäft weiß der Händler nichts, was ihm der Hersteller nicht sagt.',
  },
  {
    id: 'lieferung',
    name: 'Direktlieferung an die Baustelle',
    braucht: [],
    minutenOhne: 0,
    blockiert: false,
    hinweis: 'Macht der Hersteller. Der einzige Schritt, der ohne jedes Zutun läuft.',
  },
  {
    id: 'rechnung',
    name: 'Rechnung an den Kunden stellen',
    braucht: ['betreiberdaten', 'echteKonditionen'],
    minutenOhne: 0,
    blockiert: true,
    hinweis: 'Ohne Firmendaten fehlen Pflichtangaben nach § 11 UStG — siehe beleg.js.',
  },
  {
    id: 'buchung',
    name: 'Beleg in die Buchhaltung',
    braucht: ['buchhaltungsanbindung'],
    minutenOhne: 2,
    blockiert: false,
    hinweis: 'Ausgangs- und Eingangsrechnung, im Reihengeschäft mit Erwerbsteuer.',
  },
];

/**
 * Führt die Kette einmal durch, ohne irgendetwas auszulösen.
 *
 * @param {object} welt Fähigkeiten der Umgebung
 * @returns Protokoll je Schritt sowie die Summe der Handarbeit
 */
export function trockenlauf(welt = WELT_HEUTE) {
  const protokoll = [];
  let minutenMensch = 0;
  let abbruchBei = null;

  for (const schritt of SCHRITTE) {
    const fehlend = schritt.braucht.filter((v) => welt[v] !== true);

    if (fehlend.length === 0) {
      protokoll.push({ id: schritt.id, name: schritt.name, stand: 'automatisch', minuten: 0, fehlend: [] });
      continue;
    }

    if (schritt.blockiert) {
      protokoll.push({
        id: schritt.id,
        name: schritt.name,
        stand: 'blockiert',
        minuten: 0,
        fehlend,
        grund: schritt.hinweis,
      });
      if (!abbruchBei) abbruchBei = schritt.id;
      continue;
    }

    minutenMensch += schritt.minutenOhne;
    protokoll.push({
      id: schritt.id,
      name: schritt.name,
      stand: 'handarbeit',
      minuten: schritt.minutenOhne,
      fehlend,
      grund: schritt.hinweis,
    });
  }

  return {
    protokoll,
    minutenMensch,
    laeuftDurch: abbruchBei === null && minutenMensch === 0,
    abbruchBei,
    blockaden: protokoll.filter((p) => p.stand === 'blockiert').map((p) => p.id),
  };
}

/**
 * Was eine einzelne fehlende Fähigkeit kostet.
 *
 * Berechnet nicht die Differenz zum heutigen Stand, sondern zum Vollausbau:
 * Was ändert sich, wenn genau diese eine Fähigkeit fehlt und sonst nichts?
 * Nur so ist der Beitrag einer Fähigkeit von den anderen zu trennen.
 */
export function engpaesse() {
  const voll = trockenlauf(WELT_AUSGEBAUT);
  const namen = Object.keys(WELT_AUSGEBAUT);

  return namen
    .map((fehlt) => {
      const welt = { ...WELT_AUSGEBAUT, [fehlt]: false };
      const lauf = trockenlauf(welt);
      return {
        faehigkeit: fehlt,
        zusatzminuten: lauf.minutenMensch - voll.minutenMensch,
        blockiert: lauf.blockaden,
        betroffeneSchritte: lauf.protokoll.filter((p) => p.stand !== 'automatisch').map((p) => p.id),
      };
    })
    .sort((a, b) => b.blockiert.length - a.blockiert.length || b.zusatzminuten - a.zusatzminuten);
}

/**
 * Rechnet die Minuten je Bestellung auf den Monat hoch.
 *
 * Wichtig für den Vergleich mit `phase6-automatisierung.md`: Erfasst sind hier
 * **nur die Vorgänge je Bestellung**. Inhaltspflege, Normenänderungen und
 * Transportschäden hängen nicht an der Bestellmenge und stehen nicht darin.
 */
export function aufwandProMonat(welt, bestellungenProMonat) {
  const lauf = trockenlauf(welt);
  const minuten = lauf.minutenMensch * bestellungenProMonat;
  return {
    minutenJeBestellung: lauf.minutenMensch,
    bestellungenProMonat,
    stundenProMonat: Math.round((minuten / 60) * 10) / 10,
    blockaden: lauf.blockaden,
  };
}
