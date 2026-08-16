/**
 * Ablage der Vorgänge.
 *
 * Bisher entsteht alles und verschwindet wieder: Die UID-Abfrage erzeugt eine
 * Belegzeile, der Warenkorb drei Bestellentwürfe, die Kasse eine Rechnung —
 * und mit dem nächsten Seitenaufruf ist nichts davon mehr da. Für ein
 * Funktionsmuster geht das. Für ein Geschäft nicht: Die Rechnungsnummer muss
 * nach § 11 Abs 1 Z 5 UStG fortlaufend und **einmalig** sein, und § 132 BAO
 * verlangt sieben Jahre Aufbewahrung.
 *
 * Zwei Entwurfsentscheidungen tragen diese Datei.
 *
 * **Erstens: Die Rechnungsnummer wird erst bei der Ausstellung vergeben**, nicht
 * beim Anlegen des Vorgangs. Das ist der Fehler, den man sonst einmal macht:
 * Wer die Nummer schon im Warenkorb zieht, verbrennt für jeden abgebrochenen
 * Kauf eine — und erklärt dem Prüfer später, warum zwischen 0007 und 0034
 * nichts liegt.
 *
 * **Zweitens: Die Ablage wird nur ergänzt, nie geändert.** § 131 BAO verlangt,
 * dass der ursprüngliche Inhalt feststellbar bleibt. Eine Korrektur ist
 * deshalb ein neuer Eintrag, der auf den alten zeigt, und keine Änderung am
 * alten. Ein Testfall besteht darauf.
 *
 * Zeitpunkte werden hereingereicht, nicht hier gelesen. Eine Ablage, die selbst
 * auf die Uhr sieht, lässt sich nicht prüfen.
 */

import { csvFeld } from './format.js';

/** Aufbewahrungsfrist nach § 132 BAO: sieben Jahre nach Ablauf des Kalenderjahres. */
export const AUFBEWAHRUNG_JAHRE = 7;

export const ARTEN = {
  angebot: { kuerzel: 'AN', nummernkreis: true },
  rechnung: { kuerzel: 'RE', nummernkreis: true },
  gutschrift: { kuerzel: 'GS', nummernkreis: true },
  lieferantenbestellung: { kuerzel: 'LB', nummernkreis: true },
  uidabfrage: { kuerzel: 'UP', nummernkreis: false },
  vermerk: { kuerzel: 'VM', nummernkreis: false },
};

/** Legt eine leere Ablage an. `zaehler` kann einen Bestand fortschreiben. */
export function neueAblage({ zaehler = {} } = {}) {
  return { eintraege: [], zaehler: { ...zaehler } };
}

const schluessel = (art, jahr) => `${art}:${jahr}`;

/**
 * Vergibt die nächste Nummer eines Kreises.
 *
 * Der Zähler läuft je Art **und je Jahr**. Die Jahreszahl steht in der Nummer,
 * deshalb bleibt sie über den Jahreswechsel hinweg einmalig, obwohl der Zähler
 * wieder bei eins beginnt — genau die „eine oder mehrere Zahlenreihen", die
 * § 11 zulässt.
 */
export function naechsteNummer(ablage, art, jahr) {
  const beschreibung = ARTEN[art];
  if (!beschreibung) throw new Error(`Unbekannte Vorgangsart: ${art}`);
  if (!beschreibung.nummernkreis) throw new Error(`${art} führt keinen Nummernkreis`);
  if (!Number.isInteger(jahr)) throw new Error('Die Nummernvergabe braucht ein Jahr');

  const k = schluessel(art, jahr);
  const naechste = (ablage.zaehler[k] ?? 0) + 1;
  ablage.zaehler[k] = naechste;
  return `${beschreibung.kuerzel}-${jahr}-${String(naechste).padStart(4, '0')}`;
}

/**
 * Hängt einen Eintrag an. Der Eintrag wird eingefroren — was einmal in der
 * Ablage steht, ändert sich nicht mehr.
 */
export function haltefest(ablage, eintrag) {
  if (!ARTEN[eintrag.art]) throw new Error(`Unbekannte Vorgangsart: ${eintrag.art}`);
  if (!eintrag.zeitpunkt) throw new Error('Jeder Eintrag braucht einen Zeitpunkt');

  const fertig = Object.freeze({
    lfd: ablage.eintraege.length + 1,
    art: eintrag.art,
    nummer: eintrag.nummer ?? null,
    zeitpunkt: eintrag.zeitpunkt,
    vorgang: eintrag.vorgang ?? null,
    betragNetto: eintrag.betragNetto ?? null,
    betragBrutto: eintrag.betragBrutto ?? null,
    text: eintrag.text ?? '',
    bezugAuf: eintrag.bezugAuf ?? null,
    storniert: false,
  });

  ablage.eintraege.push(fertig);
  return fertig;
}

/**
 * Stellt eine Rechnung aus — und **erst hier** entsteht die Nummer.
 *
 * Der Beleg muss vollständig sein. Eine Rechnung mit fehlenden Pflichtangaben
 * bekommt keine Nummer, weil eine vergebene Nummer nicht zurückgenommen werden
 * kann; sie wäre dann für immer eine Lücke ohne Beleg.
 */
export function stelleRechnungAus(ablage, rechnung, { zeitpunkt, jahr, vorgang }) {
  if (!rechnung.vollstaendig) {
    return {
      ausgestellt: false,
      grund: `Pflichtangaben fehlen: ${rechnung.fehlend.join(', ')} — keine Nummer vergeben`,
    };
  }

  const nummer = naechsteNummer(ablage, 'rechnung', jahr);
  const eintrag = haltefest(ablage, {
    art: 'rechnung',
    nummer,
    zeitpunkt,
    vorgang,
    betragNetto: rechnung.nettobetrag ?? null,
    betragBrutto: rechnung.bruttobetrag ?? null,
    text: rechnung.text ?? '',
  });

  return { ausgestellt: true, nummer, eintrag };
}

/**
 * Storniert einen Eintrag.
 *
 * Der ursprüngliche Eintrag bleibt unangetastet; es entsteht eine Gutschrift
 * mit eigener Nummer, die auf ihn zeigt. Die Nummer der stornierten Rechnung
 * wird **nicht** wiederverwendet — eine wiederverwendete Rechnungsnummer ist
 * genau das, was § 11 mit „einmalig" ausschließt.
 */
export function storniere(ablage, nummer, { grund, zeitpunkt, jahr }) {
  const ziel = ablage.eintraege.find((e) => e.nummer === nummer);
  if (!ziel) throw new Error(`Kein Eintrag mit der Nummer ${nummer}`);
  if (ablage.eintraege.some((e) => e.bezugAuf === nummer && e.art === 'gutschrift')) {
    throw new Error(`${nummer} ist bereits storniert`);
  }

  const gutschrift = naechsteNummer(ablage, 'gutschrift', jahr);
  return haltefest(ablage, {
    art: 'gutschrift',
    nummer: gutschrift,
    zeitpunkt,
    vorgang: ziel.vorgang,
    betragNetto: ziel.betragNetto === null ? null : -ziel.betragNetto,
    betragBrutto: ziel.betragBrutto === null ? null : -ziel.betragBrutto,
    text: `Storno zu ${nummer}: ${grund}`,
    bezugAuf: nummer,
  });
}

/** Alle Einträge eines Vorgangs, in der Reihenfolge ihrer Entstehung. */
export function vorgangsakte(ablage, vorgang) {
  return ablage.eintraege.filter((e) => e.vorgang === vorgang);
}

/**
 * Prüft einen Nummernkreis auf Lücken.
 *
 * Eine Lücke ist nicht von vornherein ein Fehler — sie ist erklärungsbedürftig.
 * Diese Funktion liefert deshalb die fehlenden Nummern, nicht ein Urteil.
 */
export function pruefeNummernkreis(ablage, art, jahr) {
  const kuerzel = ARTEN[art]?.kuerzel;
  if (!kuerzel) throw new Error(`Unbekannte Vorgangsart: ${art}`);

  const vorsatz = `${kuerzel}-${jahr}-`;
  const vergeben = ablage.eintraege
    .filter((e) => e.nummer?.startsWith(vorsatz))
    .map((e) => Number(e.nummer.slice(vorsatz.length)))
    .sort((a, b) => a - b);

  const hoechste = ablage.zaehler[schluessel(art, jahr)] ?? 0;
  const fehlend = [];
  for (let i = 1; i <= hoechste; i++) {
    if (!vergeben.includes(i)) fehlend.push(`${vorsatz}${String(i).padStart(4, '0')}`);
  }

  return { anzahl: vergeben.length, hoechste, fehlend, lueckenlos: fehlend.length === 0 };
}

/**
 * Bis wann aufzubewahren ist: sieben Jahre nach Ablauf des Kalenderjahres.
 * Für einen Beleg aus 2026 endet die Frist also mit 31.12.2033.
 */
export function aufbewahrungBis(jahr) {
  if (!Number.isInteger(jahr)) throw new Error('Die Frist braucht ein Jahr');
  return { jahr: jahr + AUFBEWAHRUNG_JAHRE, hinweis: `31.12.${jahr + AUFBEWAHRUNG_JAHRE} (§ 132 BAO)` };
}

/** Das Journal als CSV — die Form, in der es die Buchhaltung übernimmt. */
export function alsCsv(ablage) {
  const kopf = 'lfd;art;nummer;zeitpunkt;vorgang;netto;brutto;bezug;text';
  const zeilen = ablage.eintraege.map((e) =>
    [
      e.lfd,
      e.art,
      e.nummer ?? '',
      e.zeitpunkt,
      e.vorgang ?? '',
      e.betragNetto ?? '',
      e.betragBrutto ?? '',
      e.bezugAuf ?? '',
      csvFeld(e.text).slice(0, 200),
    ].join(';'),
  );
  return [kopf, ...zeilen].join('\n');
}
