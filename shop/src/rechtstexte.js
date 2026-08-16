/**
 * Gerüst für die Pflichtangaben.
 *
 * **Kein Ersatz für Rechtstexte.** In `phase5-technik.md` ist ein
 * Rechtstexteanbieter mit Aktualisierungsdienst für 10–25 € im Monat
 * vorgesehen; dabei bleibt es. Was diese Datei leistet, ist die Zuarbeit: Sie
 * benennt jedes Feld, das der Anbieter oder die Anwältin ohnehin abfragt, und
 * sie macht die Lücken **maschinenprüfbar** — der Shop kann damit erkennen,
 * dass er noch nicht fertig ist, statt mit einem leeren Impressum online zu
 * gehen.
 *
 * Grundlage der Feldliste: § 5 E-Commerce-Gesetz, ergänzt um § 14 UGB für im
 * Firmenbuch eingetragene Unternehmen.
 */

/**
 * Pflichtfelder nach § 5 ECG.
 * `bedingt` heißt: nur nötig, wenn der Sachverhalt zutrifft.
 */
export const IMPRESSUMSFELDER = [
  { feld: 'firma', bezeichnung: 'Name oder Firma laut Firmenbuch', bedingt: false },
  { feld: 'rechtsform', bezeichnung: 'Rechtsform', bedingt: false },
  { feld: 'strasse', bezeichnung: 'Geografische Anschrift der Niederlassung', bedingt: false },
  { feld: 'plz', bezeichnung: 'Postleitzahl', bedingt: false },
  { feld: 'ort', bezeichnung: 'Ort', bedingt: false },
  { feld: 'email', bezeichnung: 'E-Mail-Adresse für die rasche Kontaktaufnahme', bedingt: false },
  { feld: 'telefon', bezeichnung: 'Telefonnummer', bedingt: false },
  { feld: 'firmenbuchnummer', bezeichnung: 'Firmenbuchnummer', bedingt: true, wennEingetragen: true },
  { feld: 'firmenbuchgericht', bezeichnung: 'Firmenbuchgericht', bedingt: true, wennEingetragen: true },
  { feld: 'uid', bezeichnung: 'UID-Nummer', bedingt: true },
  { feld: 'gewerbebehoerde', bezeichnung: 'Zuständige Gewerbebehörde', bedingt: false },
  { feld: 'kammer', bezeichnung: 'Kammer- oder Berufsverbandszugehörigkeit', bedingt: false },
  { feld: 'gewerbewortlaut', bezeichnung: 'Wortlaut des angemeldeten Gewerbes', bedingt: false },
];

import { LUECKE, textZeile } from './format.js';

/**
 * Prüft die Betreiberdaten und benennt jede Lücke einzeln.
 * @param {object} betreiber
 */
export function pruefeBetreiberdaten(betreiber = {}) {
  const imFirmenbuch = betreiber.imFirmenbuch === true;
  const fehlend = [];

  for (const f of IMPRESSUMSFELDER) {
    if (f.wennEingetragen && !imFirmenbuch) continue;
    const wert = betreiber[f.feld];
    if (typeof wert !== 'string' || wert.trim() === '') fehlend.push(f);
  }

  return {
    vollstaendig: fehlend.length === 0,
    fehlend: fehlend.map((f) => f.bezeichnung),
    fehlendeFelder: fehlend.map((f) => f.feld),
    imFirmenbuch,
  };
}

const zeile = (betreiber, feld, bezeichnung) => {
  const wert = betreiber[feld];
  return typeof wert === 'string' && wert.trim() !== '' ? textZeile(wert) : LUECKE(bezeichnung);
};

/** Erzeugt den Impressumstext; Lücken bleiben sichtbar stehen. */
export function erzeugeImpressum(betreiber = {}) {
  const p = pruefeBetreiberdaten(betreiber);
  const zeilen = [
    'Impressum',
    'Informationen nach § 5 E-Commerce-Gesetz und § 14 Unternehmensgesetzbuch',
    '',
    zeile(betreiber, 'firma', 'Firma laut Firmenbuch'),
    zeile(betreiber, 'rechtsform', 'Rechtsform'),
    zeile(betreiber, 'strasse', 'Anschrift'),
    `${zeile(betreiber, 'plz', 'PLZ')} ${zeile(betreiber, 'ort', 'Ort')}`,
    'Österreich',
    '',
    `E-Mail: ${zeile(betreiber, 'email', 'E-Mail')}`,
    `Telefon: ${zeile(betreiber, 'telefon', 'Telefon')}`,
    '',
  ];

  if (p.imFirmenbuch) {
    zeilen.push(
      `Firmenbuchnummer: ${zeile(betreiber, 'firmenbuchnummer', 'Firmenbuchnummer')}`,
      `Firmenbuchgericht: ${zeile(betreiber, 'firmenbuchgericht', 'Firmenbuchgericht')}`,
    );
  } else {
    zeilen.push('Nicht im Firmenbuch eingetragen.');
  }

  zeilen.push(
    `UID-Nummer: ${zeile(betreiber, 'uid', 'UID')}`,
    `Gewerbe: ${zeile(betreiber, 'gewerbewortlaut', 'Gewerbewortlaut')}`,
    `Gewerbebehörde: ${zeile(betreiber, 'gewerbebehoerde', 'Gewerbebehörde')}`,
    `Kammerzugehörigkeit: ${zeile(betreiber, 'kammer', 'Kammer')}`,
    '',
    'Anwendbare Rechtsvorschrift: Gewerbeordnung, abrufbar über das',
    'Rechtsinformationssystem des Bundes.',
  );

  return { text: zeilen.join('\n'), vollstaendig: p.vollstaendig, fehlend: p.fehlend };
}

/**
 * Gliederung der AGB für den reinen B2B-Verkauf nach Gate 7.
 *
 * Der wichtigste Punkt ist eine **Auslassung**: Es gibt keine
 * Widerrufsbelehrung. Sie gehört ins Verbrauchergeschäft, und eine AGB, die
 * beides vermischt, weckt genau den Anschein, den Gate 7 vermeiden soll — dass
 * sich der Shop eben doch an Verbraucher richtet.
 */
export const AGB_GLIEDERUNG = [
  { nr: 1, titel: 'Geltungsbereich und Adressatenkreis', hinweis: 'Ausschließlich Unternehmer im Sinne des UGB; Verbrauchergeschäfte sind ausgeschlossen.' },
  { nr: 2, titel: 'Vertragsschluss', hinweis: 'Bestellung ist Angebot, Annahme durch Auftragsbestätigung.' },
  { nr: 3, titel: 'Preise und Umsatzsteuer', hinweis: 'Nettopreise, Umsatzsteuer gesondert; Reverse Charge bei innergemeinschaftlicher Lieferung.' },
  { nr: 4, titel: 'Lieferung im Streckengeschäft', hinweis: 'Direktversand durch den Hersteller; Teillieferungen je Lieferant sind der Regelfall.' },
  { nr: 5, titel: 'Fracht, Sperrgut und Baustellenanlieferung', hinweis: 'Abladen, Zufahrt und Anwesenheit sind Sache des Bestellers.' },
  { nr: 6, titel: 'Gefahrübergang und Transportschäden', hinweis: 'Untersuchungs- und Rügepflicht nach § 377 UGB — im B2B eine echte Obliegenheit.' },
  { nr: 7, titel: 'Zahlung, Verzug, Eigentumsvorbehalt', hinweis: 'Keine Nachnahme und keine Barzahlung auf der Baustelle — sonst entsteht ein Barumsatz und damit Registrierkassenpflicht.' },
  { nr: 8, titel: 'Gewährleistung und Haftung', hinweis: 'Im B2B abdingbar, aber nicht grenzenlos.' },
  { nr: 9, titel: 'Rücknahme angebrochener Gebinde und Rollenware', hinweis: 'Ausschluss empfehlenswert; Rollenware ist nicht teilbar.' },
  { nr: 10, titel: 'Gerichtsstand und anwendbares Recht', hinweis: null },
];

export const DATENSCHUTZ_GLIEDERUNG = [
  'Verantwortlicher und Kontakt',
  'Welche Daten bei der Bestellung verarbeitet werden',
  'Rechtsgrundlage: Vertragserfüllung nach Art. 6 Abs. 1 lit. b DSGVO',
  'Weitergabe an Lieferanten zur Direktlieferung — mit Nennung der Empfängerkategorien',
  'Speicherdauer und steuerliche Aufbewahrungsfristen',
  'Rechte der betroffenen Person',
  'Beschwerderecht bei der Datenschutzbehörde',
];

/**
 * Was ohne Verbrauchergeschäft entfällt — und was trotzdem bleibt.
 * Beides gehört benannt, damit die Ersparnis nicht mit Sorglosigkeit verwechselt wird.
 */
export const B2B_ABGRENZUNG = {
  entfaellt: [
    'Widerrufsbelehrung und Muster-Widerrufsformular nach FAGG',
    'Die Verlängerung der Rücktrittsfrist auf zwölf Monate und vierzehn Tage bei fehlerhafter Belehrung',
    'Hinweis auf die Online-Streitbeilegungsplattform',
  ],
  bleibt: [
    'Impressum nach § 5 ECG — gilt unabhängig vom Adressatenkreis',
    'Datenschutzerklärung nach DSGVO',
    'Preisangaben mit gesondert ausgewiesener Umsatzsteuer',
    'Wirksamer Ausschluss von Verbraucherbestellungen — sonst gilt Verbraucherrecht trotzdem',
  ],
};
