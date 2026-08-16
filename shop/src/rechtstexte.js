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
  {
    nr: 3,
    titel: 'Preise und Umsatzsteuer',
    hinweis:
      'Nettopreise, Umsatzsteuer gesondert mit 20 %. Leistungsort ist Österreich — für ' +
      'Reverse Charge gegenüber dem Kunden ist kein Raum, weil nur ins Inland geliefert ' +
      'wird (Punkt 12). Das Verfahren betrifft die Eingangsseite: den ' +
      'innergemeinschaftlichen Erwerb bei ausländischen Herstellern im Reihengeschäft.',
  },
  { nr: 4, titel: 'Lieferung im Streckengeschäft', hinweis: 'Direktversand durch den Hersteller; Teillieferungen je Lieferant sind der Regelfall.' },
  {
    nr: 5,
    titel: 'Mindestbestellmengen je Hersteller',
    hinweis:
      'Jeder Hersteller setzt eine Mindestbestellmenge. Wird sie für einen Hersteller nicht ' +
      'erreicht, kann die Bestellung insoweit nicht angenommen werden; der Shop weist die ' +
      'fehlende Menge im Warenwert aus. Der Punkt hat gefehlt, obwohl der Shop die Grenze ' +
      'von Anfang an durchgesetzt hat — eine Ablehnung ohne veröffentlichte Grundlage.',
  },
  { nr: 6, titel: 'Fracht, Sperrgut und Baustellenanlieferung', hinweis: 'Abladen, Zufahrt und Anwesenheit sind Sache des Bestellers.' },
  {
    nr: 7,
    titel: 'Abweichende Lieferanschrift und Empfangsvollmacht',
    hinweis:
      'Wer auf der Baustelle übernimmt, nimmt für den Besteller an — auch ein anderes Gewerk oder der Bauherr. ' +
      'Der Besteller benennt einen Ansprechpartner vor Ort und trägt dessen Erreichbarkeit.',
  },
  { nr: 8, titel: 'Gefahrübergang und Transportschäden', hinweis: 'Untersuchungs- und Rügepflicht nach § 377 UGB — im B2B eine echte Obliegenheit, und die Frist läuft ab Ablieferung auf der Baustelle.' },
  { nr: 9, titel: 'Zahlung, Verzug, Eigentumsvorbehalt', hinweis: 'Keine Nachnahme und keine Barzahlung auf der Baustelle — sonst entsteht ein Barumsatz und damit Registrierkassenpflicht.' },
  { nr: 10, titel: 'Gewährleistung und Haftung', hinweis: 'Im B2B abdingbar, aber nicht grenzenlos.' },
  { nr: 11, titel: 'Rücknahme angebrochener Gebinde und Rollenware', hinweis: 'Ausschluss empfehlenswert; Rollenware ist nicht teilbar.' },
  { nr: 12, titel: 'Lieferorte nur in Österreich', hinweis: 'Lieferung außerhalb Österreichs ist ausgeschlossen — sie wäre nach Art 6, 7 UStG steuerfrei bzw. eine Ausfuhr und damit anders zu verrechnen.' },
  { nr: 13, titel: 'Gerichtsstand und anwendbares Recht', hinweis: null },
];

/**
 * Der Wortlaut der Zusicherung nach Art. 14 DSGVO.
 *
 * Der Befund der Vorrunde: Der **Ansprechpartner vor Ort** ist ein Dritter. Er
 * hat mit dem Shop keinen Vertrag, seine Rufnummer stammt vom Besteller, und
 * Art. 14 verlangt, **ihn** zu informieren — eine Person, die der Shop nie
 * erreicht.
 *
 * Der einzige Weg, der offensteht, führt über den, der ihn kennt. Der Besteller
 * sichert zu, ihn unterrichtet zu haben; der Shop hält die Zusicherung fest.
 * Das ist **keine Erfüllung der Pflicht durch den Shop**, sondern die
 * Verlagerung auf denjenigen, der sie erfüllen kann — und die
 * Dokumentation, dass danach gefragt wurde.
 *
 * Ob das genügt, entscheidet der Rechtstexteanbieter aus `phase5-technik.md`.
 * Was hier steht, ist der Wortlaut, über den er dann reden kann: an einer
 * Stelle, prüfbar, und im Bestellprozess sichtbar statt im Kleingedruckten.
 */
export const ZUSICHERUNG_DRITTER = {
  feld: 'ansprechpartnerInformiert',
  text:
    'Ich habe den genannten Ansprechpartner vor Ort darüber informiert, dass sein Name und ' +
    'seine Telefonnummer zur Zustellung an den Hersteller und dessen Spedition weitergegeben ' +
    'werden.',
  grundlage: 'Art. 14 DSGVO',
  hinweis:
    'Nur nötig, wenn die Ware an eine abweichende Baustelle geht. Ohne Baustelle gibt ' +
    'es keinen Dritten, dessen Daten weitergereicht würden.',
};

/**
 * Die Hinweise, die ein Besteller sehen muss, **bevor** er eine abweichende
 * Lieferanschrift angibt.
 *
 * Nicht Kleingedrucktes, sondern der Punkt, an dem im B2B-Baustoffhandel
 * wirklich Geld verlorengeht. § 377 UGB verlangt, die Ware **unverzüglich nach
 * der Ablieferung** zu untersuchen und Mängel unverzüglich zu rügen. Die Frist
 * läuft ab der Ablieferung auf der Baustelle — nicht ab dem Tag, an dem der
 * Besteller die Palette zum ersten Mal sieht.
 *
 * Für das Sortiment aus `phase4-sortiment-und-materialwert.md` ist das keine
 * Spitzfindigkeit: Eine Abdichtungsbahn kostet rund 355 € netto die Rolle, und
 * ein Transportschaden an der Rolle fällt oft erst beim Verlegen auf — Wochen
 * später. Dann ist die Rüge verspätet und die Ware gilt als genehmigt.
 *
 * Daraus folgt auch, warum der Ansprechpartner vor Ort seit
 * `baustelle-als-lieferort.md` ein Pflichtfeld ist: Er ist nicht für die
 * Spedition da, sondern für diese Frist.
 */
export const LIEFERHINWEISE = [
  {
    titel: 'Wer übernimmt, übernimmt für Sie',
    text:
      'Auf einer Baustelle nimmt an, wer gerade dort ist — ein anderes Gewerk, der Bauherr, der Polier. ' +
      'Die Übernahme wirkt für Sie als Besteller.',
    grundlage: 'AGB Punkt 6',
  },
  {
    titel: 'Die Rügefrist läuft ab Ablieferung',
    text:
      'Nach § 377 UGB ist die Ware unverzüglich nach der Ablieferung zu untersuchen und ein Mangel ' +
      'unverzüglich zu rügen. Maßgeblich ist die Ablieferung auf der Baustelle, nicht der Tag, an dem ' +
      'Sie selbst hinkommen.',
    grundlage: '§ 377 UGB',
  },
  {
    titel: 'Rollenware auf der Baustelle prüfen, nicht beim Verlegen',
    text:
      'Ein Transportschaden an einer Abdichtungsbahn fällt oft erst beim Verlegen auf. Zu diesem ' +
      'Zeitpunkt ist die Rüge in aller Regel verspätet und die Ware gilt als genehmigt.',
    grundlage: '§ 377 Abs 2 UGB',
  },
  {
    titel: 'Teillieferungen kommen getrennt an',
    text:
      'Im Streckengeschäft liefert jeder Hersteller selbst. Eine Bestellung erreicht die Baustelle ' +
      'deshalb in mehreren Sendungen an verschiedenen Tagen; jede ist für sich zu prüfen.',
    grundlage: 'AGB Punkt 4',
  },
];

/**
 * Liefert die Hinweise, die zu diesem Auftrag tatsächlich passen.
 *
 * Ohne abweichende Baustelle geht die Ware an die Rechnungsanschrift; dann ist
 * der Hinweis zur Empfangsvollmacht überflüssig und würde nur die anderen
 * verwässern. Ein Hinweistext, den alle immer sehen, wird von niemandem
 * gelesen.
 */
export function lieferhinweise(auftrag = {}) {
  const abweichend = auftrag.lieferungAnRechnungsadresse === false;
  return LIEFERHINWEISE.filter((h) => abweichend || h.grundlage !== 'AGB Punkt 6');
}

/**
 * Gliederung der Datenschutzerklärung.
 *
 * Die beiden letzten Punkte sind beim Abgleich der Datenflüsse dazugekommen und
 * betreffen **Menschen, die mit dem Shop keinen Vertrag haben**:
 *
 *   * Der **Ansprechpartner vor Ort** auf der Baustelle. Seine Telefonnummer
 *     geht an die Spedition des Lieferanten. Art. 6 Abs. 1 lit. b trägt das
 *     nicht — er ist nicht Vertragspartner; in Betracht kommt lit. f. Und
 *     Art. 14 verlangt, **ihn** zu informieren, obwohl der Shop ihn nie zu
 *     Gesicht bekommt. Die Angabe stammt vom Besteller.
 *   * Die **UID-Abfrage** beim EU-Informationsaustauschsystem. Bei einem
 *     Einzelunternehmer ist die UID ein personenbezogenes Datum, und die
 *     Abfrage ist eine Übermittlung an eine Stelle außerhalb des Betriebs.
 *
 * Beides gehört benannt, nicht gelöst: Diese Datei ist Zuarbeit für den
 * Rechtstexteanbieter aus `phase5-technik.md`, keine Rechtsberatung. Was sie
 * leisten kann, ist die Frage auf den Tisch zu legen, bevor jemand sie im
 * Echtbetrieb stellt.
 */
export const DATENSCHUTZ_GLIEDERUNG = [
  'Verantwortlicher und Kontakt',
  'Welche Daten bei der Bestellung verarbeitet werden',
  'Rechtsgrundlage: Vertragserfüllung nach Art. 6 Abs. 1 lit. b DSGVO',
  'Weitergabe an Lieferanten zur Direktlieferung — mit Nennung der Empfängerkategorien',
  'Daten Dritter: Ansprechpartner vor Ort auf der Baustelle — Art. 6 Abs. 1 lit. f, Informationspflicht nach Art. 14',
  'UID-Abfrage beim EU-Informationsaustauschsystem — Übermittlung und Zweck',
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
