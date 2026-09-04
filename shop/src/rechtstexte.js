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
import { KORBSCHLUESSEL } from './shopkern.js';
import { warenkorbZusage } from './bestellwegbau.js';

/**
 * Welcher Pflichttext ab wann nötig ist.
 *
 * **Der Anlass, 4. September 2026.** Der Auftraggeber hat am 3. September
 * gesagt: „lade shop auf bauversand.com hoch". Der Rolloutplan hält die Etappe
 * `upload` mit dieser Begründung an:
 *
 * > „AGB, Widerruf und Datenschutz stehen als Gerüst mit Begründungen. Ein
 * > Gerüst online zu stellen wäre schlechter als kein Text, weil es wie einer
 * > aussieht."
 *
 * Der zweite Halbsatz stimmt für ein Gerüst, das sich für einen Text ausgibt.
 * **Diese Seiten tun das nicht.** Die AGB-Seite beginnt mit „Das hier ist die
 * Gliederung, nicht der Vertrag", die Datenschutzseite mit „Gliederung, kein
 * fertiger Text". Die Begründung ist damit an ihrem eigenen Erzeugnis
 * widerlegt.
 *
 * Was übrig bleibt, ist die härtere und richtige Frage: **Welcher Text ist ab
 * wann Pflicht?** Und da laufen zwei Dinge auseinander, die bisher in einem
 * Wort zusammenstanden:
 *
 * | | ab wann | Stand |
 * |---|---|---|
 * | Impressum | ab dem **ersten Besuch** | Gerüst, vier Pflichtangaben offen |
 * | Offenlegung § 25 MedienG | ab dem **ersten Besuch** | steht im Auftrag an den Anbieter |
 * | Datenschutzerklärung | ab dem **ersten Besuch** | Gliederung, kein Wortlaut |
 * | AGB | ab dem ersten **Vertragsschluss** | Gliederung — und es kann kein Vertrag zustande kommen |
 * | Widerrufsbelehrung | nur gegenüber **Verbrauchern** | Gate 7 schließt sie aus |
 *
 * > **Der Datenschutz blockiert das Hochladen, die AGB nicht.** Wer eine Seite
 * > aufruft, hinterlässt eine IP-Adresse im Serverprotokoll; wer nichts
 * > bestellen kann, schließt keinen Vertrag.
 *
 * Das ist **keine Rechtsberatung** und soll keine sein. Es ist die Zuordnung,
 * die der Rechtstexteanbieter ohnehin trifft — hier steht sie, damit der
 * Rolloutplan nicht mehr behauptet, es hänge alles an allem.
 */
export const PFLICHTTEXTE = Object.freeze([
  Object.freeze({
    id: 'impressum',
    seite: 'rechtliches/impressum',
    abWann: 'besuch',
    grundlage: '§ 5 ECG, § 14 UGB',
    warum: 'Die Pflichtangaben treffen jeden, der eine Website geschäftlich betreibt — '
      + 'unabhängig davon, ob über sie etwas verkauft wird. Vier Angaben fehlen; die Seite '
      + 'sagt das selbst.',
  }),
  Object.freeze({
    id: 'offenlegung',
    seite: null,
    abWann: 'besuch',
    grundlage: '§ 25 MedienG',
    warum: 'Die Offenlegung gilt für wiederkehrend abrufbare Websites und steht neben dem '
      + 'Impressum, nicht darin. Sie ist Teil des Auftrags an den Rechtstexteanbieter und hat '
      + 'heute keine eigene Seite.',
  }),
  Object.freeze({
    id: 'datenschutz',
    seite: 'rechtliches/datenschutz',
    abWann: 'besuch',
    grundlage: 'Art. 13 DSGVO',
    warum: 'Die Informationspflicht beginnt mit dem ersten Aufruf: Der Server protokolliert '
      + 'eine IP-Adresse, und die Oberfläche legt den Warenkorb im Browser ab. Beides '
      + 'geschieht, bevor irgendjemand etwas anfragt.',
  }),
  Object.freeze({
    id: 'agb',
    seite: 'rechtliches/agb',
    abWann: 'vertrag',
    warum: 'Geschäftsbedingungen werden Vertragsbestandteil — sie brauchen einen Vertrag. '
      + 'Dieser Shop nimmt keine Bestellung entgegen (erster Punkt in `startklar`); die Kasse '
      + 'erzeugt eine Anfrage, und die ist ausdrücklich unverbindlich.',
    grundlage: '§ 864a, § 879 ABGB — Einbeziehung und Inhaltskontrolle',
  }),
  Object.freeze({
    id: 'widerruf',
    seite: null,
    abWann: 'verbraucher',
    grundlage: '§ 11 FAGG',
    warum: 'Das Rücktrittsrecht bei Fernabsatz steht Verbrauchern zu. Gate 7 lässt '
      + 'ausschließlich Unternehmer bestellen, und die Kundendatenprüfung verlangt die '
      + 'Bestätigung. Solange das gilt, entsteht die Belehrungspflicht nicht.',
  }),
]);

/** Was vor dem Hochladen dastehen muss — alles andere hängt am Verkauf. */
export function vorDemHochladen(texte = PFLICHTTEXTE) {
  return texte.filter((t) => t.abWann === 'besuch');
}

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
/**
 * Die Zeile, die Marke und Firma verbindet — oder keine.
 *
 * Leer, solange der Shop unter seiner Firma auftritt: Eine Zeile „Bauversand
 * ist eine Marke der Bauversand" wäre keine Auskunft, sondern eine Schleife.
 */
export function markenzeile(betreiber = {}) {
  const marke = String(betreiber.marke ?? '').trim();
  const firma = String(betreiber.firma ?? '').trim();
  if (!marke || !firma || marke === firma) return [];
  return [`„${marke}" ist das Online-Angebot der ${firma}.`];
}

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
    // **Ergänzt am 3. September 2026.** Seit diesem Tag tritt der Shop unter
    // `Bauversand` auf — Logo, Seitentitel, Belege, strukturierte Daten. Das
    // Impressum nannte weiter allein die Firma laut Firmenbuch. § 5 ECG
    // verlangt den Namen des Diensteanbieters, und der steht hier; was fehlte,
    // war die **Verbindung**: Wer wissen will, wer „Bauversand" ist, findet es
    // sonst auf keiner Seite.
    //
    // > **Ein Name, unter dem man auftritt, gehört auf die Seite, auf der man
    // > sich zu erkennen gibt.**
    ...markenzeile(betreiber),
    ...(markenzeile(betreiber).length ? [''] : []),
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
/**
 * Welche Zahlwege der Shop anbietet — und welche er ausschließt.
 *
 * Die Liste ist die Entscheidung aus `zahlungsziel-entschieden.md`, nicht
 * eine Aufzählung des Möglichen. Sie steht hier und nicht in `zahlung.js`,
 * weil sie in die Geschäftsbedingungen gehört: Was der Shop annimmt, ist eine
 * Vertragsbedingung, keine Rechengröße.
 *
 * `zahlung.js` bleibt die Stelle, an der die Wege **gerechnet** werden. Ein
 * Testfall hält beide Listen aneinander: Jede Kennung hier muss dort
 * existieren, sonst weicht die Bedingung von der Rechnung ab, ohne dass es
 * jemand merkt.
 */
/**
 * Jeder Zahlweg trägt **zwei** Begründungen, und das ist der Kern dieser
 * Datei.
 *
 * `grund` ist die Entscheidungsbegründung: Gate-Nummern, Gebühren je
 * Bestellung, Kippzahlen, Lieferantenskonto. Sie gehört ins Verzeichnis und
 * in die Nachvollziehbarkeit — und **nicht** auf eine Kundenseite.
 *
 * `kunde` ist der Satz, der veröffentlicht werden darf: was gilt, ohne die
 * eigene Kalkulation offenzulegen.
 *
 * Der Anlass ist ein Fehler dieser Reihe. Die erste Fassung kannte nur
 * `grund`, und `bin/website.mjs` hat ihn in die AGB-Seite gerendert. Damit
 * standen auf einer Kundenseite: die eigene Rohmarge, das Skonto beider
 * Lieferanten, die Mehrkosten je Zahlweg, die Ausfallquote, ab der sich das
 * Bild dreht — und die internen Gate-Nummern dazu. Gefunden hat es niemand
 * beim Schreiben, sondern eine Frage des Auftraggebers: *„ist das schon die
 * öffentliche Seite oder nur ein Dashboard für mich?"*
 *
 * > **Eine Begründung, die überzeugt, überzeugt auch die Konkurrenz.** Der
 * > Grund, warum eine Bedingung gilt, ist nicht automatisch der Grund, den
 * > man dem Kunden nennt — und der Unterschied ist keine Unehrlichkeit,
 * > sondern die Grenze zwischen Auskunft und Kalkulation.
 *
 * **`vorkasse` kam am 1. September dazu**, und der Anlass steht in
 * `docs/baustoff-shop/rechnung-ueber-bereits-gezahltes-geld.md`. Alle drei
 * angebotenen Zahlwege verlangen das Geld **vor** der Bestellauslösung; die
 * Rechnung entsteht im Ablauf erst nach der Lieferung. Sie ist damit immer
 * eine Rechnung über bereits bezahltes Geld — und muss das sagen, sonst
 * überweist die Buchhaltung des Kunden ein zweites Mal.
 *
 * Das Feld steht hier und nicht in `beleg.js`, weil sonst zwei Stellen
 * wüssten, welche Zahlwege es gibt. Wird eines Tages `offene-rechnung`
 * freigegeben, kippt der Vermerk auf der Rechnung von allein mit.
 */
export const ZAHLUNGSBEDINGUNGEN = Object.freeze({
  zielTage: 0,
  stand: '2026-08-27',
  herkunft: 'docs/baustoff-shop/zahlungsziel-entschieden.md',
  angeboten: Object.freeze([
    {
      id: 'eps',
      vorkasse: true,
      grund: 'einziger Weg, der alle vier Anforderungen erfüllt; +6,50 € je Bestellung nach Gebühr und Skonto',
      kunde: 'Der empfohlene Weg: Freigabe im eigenen Bankkonto, Zahlung sofort bestätigt, keine Kartendaten im Spiel.',
    },
    {
      id: 'vorkasse',
      vorkasse: true,
      grund: 'billigster Weg und Gate-21-fest; meldet den Eingang aber nicht maschinell',
      kunde: 'Überweisung nach Auftragsbestätigung. Die Ware geht auf den Weg, sobald der Betrag eingelangt ist — das dauert je nach Bank ein bis zwei Werktage länger.',
    },
    {
      id: 'karte-stripe',
      vorkasse: true,
      grund: 'je Bestellung noch positiv, auf den Monat über der 10-%-Grenze — angeboten, weil er Bestellungen ermöglicht, nicht weil er sich rechnet',
      kunde: 'Für Bestellungen, die aus der Firmenkarte laufen sollen. Zahlung sofort bestätigt.',
    },
  ]),
  ausgeschlossen: Object.freeze([
    {
      id: 'offene-rechnung',
      vorkasse: false,
      grund: 'verletzt Gate 21 und trägt das Ausfallrisiko im Haus; kippt schon ab einem Ausfall auf 86 Bestellungen',
      kunde: 'Wird nicht angeboten. Ein Zahlungsziel würde in die Preise wandern — dieser Shop rechnet stattdessen ohne.',
    },
    {
      id: 'nachnahme',
      vorkasse: false,
      grund: 'löst Registrierkassenpflicht aus und verletzt Gate 21',
      kunde: 'Wird nicht angeboten. Im Streckengeschäft kassiert der Frächter, nicht der Händler.',
    },
  ]),
  zurueckgestellt: Object.freeze([
    {
      id: 'rechnungskauf',
      vorkasse: false,
      grund: 'hält Gate 21, kostet aber 17,93 € je Bestellung mehr als EPS — lohnt ab acht Zusatzbestellungen im Monat oder einer Ausfallquote über 3,2 %',
      kunde: 'Noch nicht verfügbar. Für Stammkunden mit laufendem Bedarf ist ein Rechnungskauf über einen Anbieter vorgesehen; wer ihn braucht, meldet sich.',
    },
  ]),
  _offen: 'Der Zahlungsanbieter selbst ist nicht gewählt — das ist eine Ausgabe und freigabepflichtig.',
});


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
    titel: 'Mindestbestellwert und Mindestbestellmengen',
    hinweis:
      'Für jede Lieferung gilt ein Mindestbestellwert, gemessen am Warenwert netto. Er steht ' +
      'auf der Lieferseite und im Warenkorb; wird er nicht erreicht, kommt keine Anfrage ' +
      'zustande, und der Shop weist den fehlenden Betrag aus. Bei mehreren Lieferungen gilt ' +
      'er je Lieferung, weil Anfahrt und Verpackung je Lieferung anfallen. Daneben setzt ' +
      'jeder Hersteller eine eigene Mindestbestellmenge. Wird sie für einen Hersteller nicht ' +
      'erreicht, kann die Bestellung insoweit nicht angenommen werden; der Shop weist die ' +
      'fehlende Menge im Warenwert aus. Der Punkt hat gefehlt, obwohl der Shop die Grenze ' +
      'von Anfang an durchgesetzt hat — eine Ablehnung ohne veröffentlichte Grundlage. Der ' +
      'eigene Mindestbestellwert ist am 3. September dazugekommen; bis dahin nahm die Kasse ' +
      'jeden Warenkorb an, und die Absage kam erst nach der Zusage des Bestellers.',
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
  {
    nr: 9,
    titel: 'Zahlung, Verzug, Eigentumsvorbehalt',
    hinweis:
      'Keine Nachnahme und keine Barzahlung auf der Baustelle — sonst entsteht ein Barumsatz ' +
      'und damit Registrierkassenpflicht. **Zahlungsziel: null Tage**, gezahlt wird bei der ' +
      'Bestellung; maßgeblich ist der Zahlungseingang, nicht das Datum der Bestellung. ' +
      'Keine offene Rechnung auf eigenes Risiko. Der Eigentumsvorbehalt reicht bis zur ' +
      'vollständigen Zahlung und muss den Weiterverkauf und den Einbau in fremdes Eigentum ' +
      'ausdrücklich regeln — im Baustoffhandel ist die Ware regelmäßig verbaut, bevor sie ' +
      'bezahlt ist. Verzugszinsen und Mahnspesen nach UGB, Höhe vom Anbieter zu setzen.',
  },
  { nr: 10, titel: 'Gewährleistung und Haftung', hinweis: 'Im B2B abdingbar, aber nicht grenzenlos.' },
  { nr: 11, titel: 'Rücknahme angebrochener Gebinde und Rollenware', hinweis: 'Ausschluss empfehlenswert; Rollenware ist nicht teilbar.' },
  {
    nr: 12,
    titel: 'Liefergebiet',
    hinweis:
      'Geliefert wird in die Bezirke Perg, Urfahr-Umgebung, Freistadt, Linz-Land und Linz — ' +
      'nicht in ganz Österreich. Die Weisung lautet seit dem 22. August „regional", umgesetzt ' +
      'war sie bis zum 26. nur in der Kampagne, also in der Werbung und nicht in der Annahme. ' +
      'Der Bezirk der Baustelle wird gefragt und nicht aus der Postleitzahl erraten: Eine ' +
      'Postleitzahl beweist keinen Bezirk, so wie sie kein Land beweist. Abholung am ' +
      'Betriebssitz ist davon unberührt. Lieferung außerhalb Österreichs bleibt zusätzlich ' +
      'ausgeschlossen — sie wäre nach Art 6, 7 UStG steuerfrei bzw. eine Ausfuhr und damit ' +
      'anders zu verrechnen.',
  },
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
/**
 * Der Punkt, auf den sich der Hinweis zur Empfangsvollmacht beruft.
 *
 * **Berichtigt am 3. September.** Hier stand „AGB Punkt 6" — und Punkt 6 heißt
 * „Fracht, Sperrgut und Baustellenanlieferung". Der Wortlaut des Hinweises
 * steht in **Punkt 7** („Abweichende Lieferanschrift und Empfangsvollmacht"),
 * fast Satz für Satz.
 *
 * > **Ein falscher Verweis auf einem Kundenbeleg ist keine Formalie:** Der
 * > Kunde, der nachschlägt, findet dort eine Frachtklausel und keine Aussage
 * > darüber, dass die Übernahme durch ein fremdes Gewerk für ihn wirkt.
 *
 * Es gibt eine Regel, die genau das findet (`verweis-zeigt-woanders` in
 * `belegpruefung.js`), und sie hat nie zugeschlagen: Das Verweisregister kannte
 * nur die zwei Punkte, die in `beleg.js` stehen — und der Prüfer baute seine
 * Auftragsbestätigung **ohne** diese Hinweise. Er las damit ein Dokument, das
 * der Betrieb so nie erzeugt.
 *
 * Steht als Konstante da, weil `lieferhinweise()` denselben Text zum Filtern
 * braucht. Zwei Schreibweisen einer Fundstelle wären genau der Fehler, der hier
 * gerade behoben wird.
 */
export const PUNKT_EMPFANGSVOLLMACHT = 'AGB Punkt 7';

export const LIEFERHINWEISE = [
  {
    titel: 'Wer übernimmt, übernimmt für Sie',
    text:
      'Auf einer Baustelle nimmt an, wer gerade dort ist — ein anderes Gewerk, der Bauherr, der Polier. ' +
      'Die Übernahme wirkt für Sie als Besteller.',
    grundlage: PUNKT_EMPFANGSVOLLMACHT,
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
  return LIEFERHINWEISE.filter((h) => abweichend || h.grundlage !== PUNKT_EMPFANGSVOLLMACHT);
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
/**
 * Was die **Website selbst** tut — Stand 29.08.2026, aus dem Code gelesen.
 *
 * Die Gliederung darunter beschrieb den Bestellvorgang und schwieg über den
 * Besuch der Seite. Das ist die falsche Reihenfolge: Die Verarbeitung beginnt
 * beim ersten Seitenaufruf, nicht beim Absenden.
 *
 * Diese Liste ist **kein Rechtstext**, sondern der technische Befund, den der
 * Rechtstexteanbieter braucht — und den außer dem Bau niemand kennt. Er
 * ändert sich mit dem Code und gehört deshalb hierher und nicht in eine
 * Kanzleivorlage.
 */
/**
 * **Jede Zusage hier trägt seit dem 2. September eine Kennung — oder einen
 * Grund, warum sie sich nicht messen lässt.**
 *
 * Diese sechs Sätze stehen auf der Datenschutzseite und sind Aussagen über
 * den **Code**. Vier davon können durch ein Skript falsch werden: Ein
 * `document.cookie`, ein Zählpixel, eine eingebettete Schrift, ein `fetch` —
 * und der Satz auf der Rechtsseite ist eine Unwahrheit, die niemand bemerkt.
 * Geprüft war bisher nur, dass die Sätze **dastehen**.
 *
 * > **Eine Zusage auf einer Rechtsseite, die niemand nachmisst, ist eine
 * > Behauptung mit Haftung.**
 *
 * `pruefbar: false` verlangt `warumNicht` — dieselbe Pflicht wie bei den
 * offenen Punkten und den Außentexten. Wer eine siebte Zusage hinzufügt, muss
 * beim Schreiben des Grundes merken, dass er keinen hat.
 */
/**
 * **Aus einer Konstanten wurde am 4. September eine Funktion.**
 *
 * Der Grund ist der Bestellweg (Gate 26): Schaltet er sich ein, wird aus
 * „wird nicht an den Server übertragen" das Gegenteil. Solange die Liste eine
 * Konstante war, hätten zwei Stellen — die gebaute Seite und der Prüfer —
 * jede für sich daran denken müssen.
 *
 * > **Zwei Schalter für dieselbe Sache sind ein Schalter, den einer vergisst.**
 *
 * `aktiv` muss jeder Aufrufer mitbringen. Das ist die ganze Absicht: Die
 * Konstante gibt es nicht mehr, also kann sie niemand versehentlich in der
 * alten Lesart weiterbenutzen.
 *
 * @param {boolean} aktiv  ob der Bestellweg eingeschaltet ist
 */
export function websiteVerarbeitung(aktiv = false) {
  return VERARBEITUNG_VORLAGE.map((z) => (
    z.id === 'warenkorb-im-browser'
      ? { ...z, befund: warenkorbZusage(aktiv, KORBSCHLUESSEL) }
      : z
  ));
}

const VERARBEITUNG_VORLAGE = [
  {
    id: 'keine-cookies',
    pruefbar: true,
    was: 'Keine Cookies',
    befund: 'Die Seiten setzen keine Cookies — weder eigene noch fremde. Ein Einwilligungsbanner ist deshalb gegenstandslos.',
  },
  {
    id: 'warenkorb-im-browser',
    pruefbar: true,
    was: 'Warenkorb im Browser',
    // Der Schlüssel kommt aus dem Code, nicht aus dem Gedächtnis. Der erste
    // Wurf schrieb „fb.warenkorb" — frei erfunden, in einer Rechtsseite.
    // Genau die Sorte Angabe, die niemand nachprüft und die im Ernstfall
    // beweist, dass der Text nicht zum Shop gehört.
    // **Kein `befund` in der Vorlage.** Er hängt am Bestellweg und kommt aus
    // `warenkorbZusage()`. Stünde er hier, gäbe es ihn zweimal — und die
    // zweite Fassung wäre die, die niemand nachzieht.
    befund: null,
  },
  {
    id: 'keine-analyse',
    pruefbar: true,
    was: 'Keine Zählpixel, keine Analyse',
    befund: 'Kein Analysewerkzeug, kein Zählpixel, kein Werbenetzwerk auf den Seiten.',
  },
  {
    id: 'keine-fremden-einbindungen',
    pruefbar: true,
    was: 'Keine fremden Einbindungen',
    befund: 'Seit 29.08. lädt keine Seite eine Datei von einem fremden Server. Bis dahin kamen drei Schriften von '
      + 'fonts.googleapis.com und fonts.gstatic.com; damit ging die IP-Adresse jedes Besuchers ungefragt an einen Dritten.',
  },
  {
    id: 'verweise-nicht-eingebettet',
    pruefbar: true,
    was: 'Verweise auf Herstellerseiten',
    befund: 'Merkblätter und Sicherheitsdatenblätter sind verlinkt, nicht eingebettet. Sie werden erst geladen, wenn der Besucher klickt — '
      + 'dann gilt die Datenschutzerklärung des Herstellers.',
  },
  {
    id: 'serverprotokoll',
    pruefbar: false,
    warumNicht: 'Was der Webserver protokolliert, entscheidet der Hoster und nicht dieser Bau. '
      + 'Aus dem Verzeichnis ist es nicht ablesbar; die Angabe bleibt offen und steht als '
      + 'solche auf der Seite.',
    was: 'Serverprotokoll',
    befund: 'Was der Webserver protokolliert, hängt am Hoster und ist noch nicht entschieden. Diese Angabe ist offen und muss vor dem Start ausgefüllt werden.',
  },
];

/**
 * Die Punkte der Geschäftsbedingungen, auf die ein **Außentext** verweist.
 *
 * **Der Anlass, 2. September 2026.** Die Auftragsbestätigung sagt „Mit dieser
 * Bestätigung kommt der Vertrag zustande (Punkt 2 unserer Allgemeinen
 * Geschäftsbedingungen)", das Angebot nennt „kein Zahlungsziel (Punkt 9 der
 * Geschäftsbedingungen)". Beide Verweise stimmen — und beide hängen an einer
 * **Zählung**, die niemand bewacht.
 *
 * Wer einen Punkt einschiebt, verschiebt jede Nummer dahinter. Aus „Punkt 9,
 * Zahlung" wird „Punkt 9, Gewährleistung und Haftung", und der Beleg beim
 * Kunden zitiert eine Klausel, die etwas anderes regelt. Das fällt nicht auf:
 * Die Gliederung bleibt richtig, der Beleg bleibt lesbar, nur der Verweis
 * zeigt woanders hin.
 *
 * > **Ein Verweis auf eine Nummer ist eine Verabredung mit einer Reihenfolge.**
 *
 * Dieselbe Bauart wie der Anker im HTML, an dem der Preisabgleich hing: Wer
 * die Reihenfolge ändert, ändert die Verabredung mit.
 *
 * `erwartetImTitel` ist bewusst ein Wort und keine Wiederholung des Titels —
 * eine Kopie des Titels prüfte nur, dass zwei Zeichenketten gleich sind, und
 * wäre bei jeder Umformulierung rot, ohne dass etwas kaputt ist.
 */
export const AGB_VERWEISE = Object.freeze([
  Object.freeze({
    nr: 2,
    zweck: 'Vertragsschluss durch die Auftragsbestätigung',
    erwartetImTitel: 'Vertragsschluss',
    warum: 'Die Auftragsbestätigung ist das Dokument, mit dem der Vertrag zustande kommt. '
      + 'Zeigt der Verweis auf eine andere Klausel, steht auf dem Beleg eine falsche '
      + 'Rechtsfolge — und der Beleg ist der, auf den hin der Kunde zahlt.',
  }),
  /**
   * **Nachgetragen am 3. September**, nachdem `npm run vorgang` zum ersten Mal
   * eine Auftragsbestätigung erzeugt hat, wie der Betrieb sie erzeugt: mit den
   * Lieferhinweisen. Sie zitieren zwei weitere AGB-Punkte, und das Register
   * kannte keinen von beiden — die Regel `verweis-ohne-eintrag` meldete sie im
   * selben Lauf, in dem sie zum ersten Mal zu sehen waren.
   */
  Object.freeze({
    nr: 4,
    zweck: 'Teillieferungen je Lieferant als Regelfall',
    erwartetImTitel: 'Streckengeschäft',
    warum: 'Der Hinweis auf der Auftragsbestätigung sagt dem Bauleiter, dass seine Bestellung '
      + 'in mehreren Sendungen ankommt und jede für sich zu prüfen ist. Zeigt der Verweis '
      + 'woanders hin, sucht er die Regel im falschen Punkt — und die Rügefrist läuft.',
  }),
  Object.freeze({
    nr: 7,
    zweck: 'Empfangsvollmacht bei abweichender Baustelle',
    erwartetImTitel: 'Empfangsvollmacht',
    warum: 'Der Hinweis stand bis zum 3. September mit „Punkt 6" da — dem Frachtpunkt. Wer '
      + 'nachschlägt, warum die Übernahme durch ein fremdes Gewerk für ihn wirkt, fand dort '
      + 'eine Frachtklausel. Der Eintrag hält die Fundstelle jetzt fest.',
  }),
  /**
   * **Nachgetragen am 4. September.** Punkt 3 der Gliederung verweist im
   * eigenen Hinweistext auf Punkt 12 („für Reverse Charge gegenüber dem Kunden
   * ist kein Raum, weil nur ins Inland geliefert wird (Punkt 12)"). Der
   * Verweis stand nie in einem Außentext — bis der Auftrag an den
   * Rechtstexteanbieter die ganze Gliederung mitnahm und `pruefe-belege` ihn
   * im selben Lauf meldete.
   *
   * > **Ein Verweis, den nur ein internes Register trägt, wird nicht geprüft.**
   * > Sobald er hinausgeht, gilt für ihn dieselbe Regel wie für jeden anderen.
   */
  Object.freeze({
    nr: 12,
    zweck: 'Beschränkung auf das inländische Liefergebiet',
    erwartetImTitel: 'Liefergebiet',
    warum: 'Punkt 3 begründet mit ihm, warum Reverse Charge gegenüber dem Kunden nicht in '
      + 'Betracht kommt: Es wird nur ins Inland geliefert. Zeigt der Verweis woanders hin, '
      + 'trägt die umsatzsteuerliche Aussage nichts mehr.',
  }),
  Object.freeze({
    nr: 9,
    zweck: 'Zahlungsbedingung ohne Zahlungsziel',
    erwartetImTitel: 'Zahlung',
    warum: 'Ohne diesen Satz gilt im B2B die Verkehrssitte, und die ist ein Zahlungsziel. '
      + 'Der Verweis trägt die Ausnahme; zeigt er ins Leere, trägt sie nichts.',
  }),
]);

export const DATENSCHUTZ_GLIEDERUNG = [
  'Verantwortlicher und Kontakt',
  'Was beim bloßen Besuch der Seite geschieht — siehe den technischen Befund darunter',
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
