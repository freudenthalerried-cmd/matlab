/**
 * Die Absage — der Beleg, den dieser Bestand nicht hatte.
 *
 * **Der Anlass, 11. September 2026.** Der Betrieb kann drei Dinge schreiben:
 * ein Angebot, eine Auftragsbestätigung, eine Rechnung. Alle drei sagen **ja**.
 * Für das Nein gab es nichts.
 *
 * Dabei ist das Nein der häufigere Fall, und der Bestand weiß genau, wann es
 * eintritt: `darfBestaetigtWerden` und `pruefeBestelldaten` zählen die Gründe
 * einzeln auf. Nur sind sie in der Sprache des Betriebs geschrieben, denn sie
 * waren für die Konsole des Betreibers gedacht:
 *
 * > *„Unternehmerstatus nicht bestätigt (**Gate 7**)"* ·
 * > *„Lieferzeit unbekannt (**Poschacher Baustoffhandel**) — der zugesagte
 * > Termin wäre erfunden"* ·
 * > *„**Katalog enthält Platzhalterpreise** — der bestätigte Betrag wäre
 * > erfunden"*
 *
 * Gemessen an `findeInterna`: **zwei von neun Gründen tragen ein Internum** —
 * eine Gate-Nummer und den Namen des Lieferanten. Die übrigen sind kein Leck
 * im Sinne des Prüfers und trotzdem nichts, was ein Kunde lesen soll: Wer
 * einem Besteller schreibt, sein Katalog enthalte Platzhalterpreise, hat kein
 * Geheimnis verraten, sondern ein Geständnis abgelegt.
 *
 * > **Eine Absage, die es nur in der Sprache des Betriebs gibt, wird in der
 * > Sprache des Betriebs verschickt.**
 *
 * Und geprüft würde sie von niemandem: Die Interna-Prüfung läuft über gebaute
 * Seiten und Anzeigentexte — nicht über eine Mail, die jemand von Hand
 * schreibt.
 *
 * ## Wie dieses Modul gebaut ist
 *
 * Es erfindet keine Gründe. Es übersetzt die, die der Bestand ohnehin
 * ausrechnet, und hält beides in beide Richtungen gegeneinander: Jeder Grund,
 * den ein Prüfer erzeugen kann, braucht einen Satz für den Kunden; jeder Satz
 * braucht einen Grund, den es wirklich gibt.
 */

import { textZeile } from './format.js';
import { absenderzeilen } from './beleg.js';

/**
 * Die Gründe, in der Sprache des Kunden.
 *
 * `muster` trifft den internen Grund, wie ihn `darfBestaetigtWerden` oder
 * `pruefeBestelldaten` aufschreiben. `kunde` ist, was der Besteller liest.
 * `weiter` sagt, was er tun kann — eine Absage ohne nächsten Schritt ist bei
 * einem Kunden, der schon bestellt hat, noch teurer als bei einem Besucher.
 */
export const ABSAGEGRUENDE = Object.freeze([
  Object.freeze({
    id: 'unternehmer',
    muster: /Unternehmerstatus nicht bestätigt/i,
    kunde: 'Wir verkaufen ausschließlich an Unternehmer. Ihre Bestellung enthält keine '
      + 'Bestätigung, dass Sie als Unternehmer bestellen.',
    weiter: 'Bitte bestellen Sie erneut und setzen Sie das Häkchen dazu.',
    woher: 'darfBestaetigtWerden — kundeIstUnternehmer',
  }),
  Object.freeze({
    id: 'uid',
    muster: /Keine UID-Nummer|UID.*(fehlt|ungültig)/i,
    kunde: 'Für eine Rechnung ohne Umsatzsteuer brauchen wir Ihre UID-Nummer; sie fehlt '
      + 'oder ist nicht lesbar.',
    weiter: 'Bitte senden Sie uns die UID-Nummer, dann stellen wir das Angebot aus.',
    woher: 'pruefeBestelldaten — uid',
  }),
  Object.freeze({
    id: 'leerer-korb',
    muster: /Leerer Warenkorb/i,
    kunde: 'Ihre Bestellung enthält keine Position, die wir führen.',
    weiter: 'Bitte prüfen Sie den Warenkorb und schicken Sie die Anfrage noch einmal.',
    woher: 'darfBestaetigtWerden — teillieferungen',
  }),
  Object.freeze({
    id: 'preisgrundlage',
    // Der Grund, der am weitesten von der Kundensprache entfernt ist. Intern
    // heißt er „Katalog enthält Platzhalterpreise — der bestätigte Betrag wäre
    // erfunden"; das ist richtig und gehört in keine Mail.
    muster: /Platzhalterpreise|Preisgrundlage/i,
    kunde: 'Für einen Artikel Ihrer Bestellung können wir den Preis derzeit nicht '
      + 'verbindlich zusagen.',
    weiter: 'Wir melden uns mit einem Preis, sobald er uns bestätigt vorliegt.',
    woher: 'darfBestaetigtWerden — Platzhalterpreise im Katalog',
  }),
  Object.freeze({
    id: 'lieferzeit',
    // Der zweite der beiden gemessenen Lecks: Der interne Grund nennt den
    // Lieferanten beim Namen. Wen wir bestellen, geht den Kunden nichts an —
    // und `findeInterna` sagt das seit dem 28. August über jede Ausgabe.
    muster: /Lieferzeit unbekannt/i,
    kunde: 'Einen verbindlichen Liefertermin können wir für Ihre Bestellung derzeit nicht '
      + 'nennen.',
    weiter: 'Wir sagen Ihnen den Termin, sobald er feststeht — bestellt ist damit nichts.',
    woher: 'darfBestaetigtWerden — Lieferzeit des Lieferanten',
  }),
  Object.freeze({
    id: 'bankverbindung',
    muster: /Bankverbindung unvollständig/i,
    kunde: 'Wir können Ihre Bestellung derzeit nicht bestätigen, weil der Zahlungsweg bei '
      + 'uns noch nicht eingerichtet ist.',
    weiter: 'Bitte sehen Sie uns das nach; wir melden uns, sobald es so weit ist.',
    woher: 'darfBestaetigtWerden — Bankverbindung des Betreibers',
  }),
  Object.freeze({
    id: 'ausland',
    muster: /außerhalb Österreichs|nur innerhalb Österreichs/i,
    kunde: 'Wir liefern nur innerhalb Österreichs; Ihre Rechnungsanschrift liegt außerhalb.',
    weiter: null,
    woher: 'pruefeBestelldaten — Land',
  }),
  Object.freeze({
    id: 'steuerzeichen',
    muster: /Zeilenumbrüche und Steuerzeichen/i,
    kunde: 'Eine Ihrer Angaben enthält Zeichen, die wir nicht übernehmen können — '
      + 'zum Beispiel einen Zeilenumbruch mitten im Feld.',
    weiter: 'Bitte schreiben Sie sie in eine Zeile und schicken Sie die Bestellung noch einmal.',
    woher: 'pruefeBestelldaten — Steuerzeichen in einem Feld',
  }),
  Object.freeze({
    id: 'plz',
    muster: /Postleitzahl muss vierstellig/i,
    kunde: 'Die Postleitzahl in Ihrer Bestellung ist keine österreichische vierstellige '
      + 'Postleitzahl.',
    weiter: 'Bitte berichtigen Sie sie und schicken Sie die Bestellung noch einmal.',
    woher: 'pruefeBestelldaten — Postleitzahl von Rechnungsanschrift und Baustelle',
  }),
  Object.freeze({
    id: 'angabe-fehlt',
    // Der Auffangfall für die Feldprüfung, die je Feld einen eigenen Satz
    // erzeugt („Firmenname fehlt", „Ort fehlt", „Telefonnummer fehlt — …").
    // Diese Gründe sind schon in Kundensprache; sie brauchen keine
    // Übersetzung, nur einen Rahmen.
    muster: /\b(fehlt|fehlen)\b/i,
    kunde: 'Eine Angabe fehlt oder ist nicht lesbar.',
    weiter: 'Bitte ergänzen Sie sie und schicken Sie die Bestellung noch einmal.',
    woher: 'pruefeBestelldaten — Pflichtfelder',
  }),
]);

/**
 * Gründe, die **nie** an einen Kunden gehen — mit Grund.
 *
 * Ohne diese Liste sähe das Register oben nach Vollständigkeit aus, und der
 * Abgleich gegen den Bestand meldete Gründe als unübersetzt, die gar keine
 * Absage sind. Beide hier halten eine **Rechnung** auf, nicht eine Bestellung:
 * Sie entstehen, wenn der Betrieb etwas zu früh abrechnen will, und der Kunde
 * hat damit nichts zu tun.
 */
export const NICHT_FUER_DEN_KUNDEN = Object.freeze([
  Object.freeze({
    muster: /Lieferung noch nicht erfolgt/i,
    warum: 'Hält die Rechnung auf, solange nicht geliefert ist (`darfRechnungGestelltWerden`). '
      + 'Eine Absage ist das nicht — der Vorgang läuft ja, er ist nur noch nicht so weit.',
  }),
  Object.freeze({
    muster: /Zahlung nicht eingegangen/i,
    warum: 'Ein Schritt des eigenen Ablaufs: Nach Gate 20 geht die Bestellung erst an den '
      + 'Lieferanten, wenn die Vorkasse da ist. Das ist keine Absage, sondern das Warten, '
      + 'das der Kunde mit seiner Zahlung selbst beendet — und wovon ihm das Angebot erzählt.',
  }),
  Object.freeze({
    muster: /Vorgang ohne eine einzige Lieferantenbestellung/i,
    warum: 'Eine Stimmigkeitsprüfung der eigenen Akte: Zu einer Rechnung gehört eine '
      + 'Bestellung beim Lieferanten. Wen wir bestellen, geht den Kunden ohnehin nichts an.',
  }),
  Object.freeze({
    muster: /gehört nicht zu Vorgang/i,
    warum: 'Ebenfalls eine Prüfung der eigenen Akte — eine Bestellnummer unter der falschen '
      + 'Vorgangsnummer. Der Kunde kennt weder die eine noch die andere.',
  }),
  Object.freeze({
    muster: /Zahlungsvermerk unbrauchbar/i,
    warum: 'Hält die Rechnung auf, wenn der Zahlungsvermerk nicht zum Zahlweg passt. Das ist '
      + 'ein Fehler im eigenen Beleg und keine Nachricht an den Besteller.',
  }),
]);

/**
 * Übersetzt die internen Gründe — und meldet, was sich nicht übersetzen lässt.
 *
 * **Kein stilles Weglassen.** Ein Grund ohne Satz ist genau der Fall, für den
 * dieses Modul gebaut wurde: Er würde sonst entweder verschwinden (dann sagt
 * die Absage nicht, warum) oder im Original mitgehen (dann steht eine
 * Gate-Nummer in einer Kundenmail).
 */
export function absagegruende(interne = []) {
  const saetze = [];
  const ohneSatz = [];
  const innerbetrieblich = [];
  const gesehen = new Set();
  for (const g of interne) {
    // **Erst die Ausnahmen.** Ein Grund, der eine Rechnung aufhält oder die
    // eigene Akte prüft, ist keine Absage — und ohne diesen Schritt meldete
    // das Werkzeug ihn als unübersetzt und gäbe gar nichts aus.
    if (NICHT_FUER_DEN_KUNDEN.some((n) => n.muster.test(String(g)))) {
      innerbetrieblich.push(String(g));
      continue;
    }
    const treffer = ABSAGEGRUENDE.find((a) => a.muster.test(String(g)));
    if (!treffer) { ohneSatz.push(String(g)); continue; }
    if (gesehen.has(treffer.id)) continue;
    gesehen.add(treffer.id);
    saetze.push(treffer);
  }
  return { saetze, ohneSatz, innerbetrieblich, vollstaendig: ohneSatz.length === 0 };
}

/**
 * Die Absage als Text.
 *
 * Sie nennt keinen Betrag und keine Position: Was abgesagt wird, steht in der
 * Anfrage des Kunden, und eine zweite Aufstellung daneben wäre eine zweite
 * Rechnung über etwas, das nicht zustande kommt.
 */
export function erzeugeAbsage({ nummer, datum, kunde = {}, betreiber = {}, gruende = [] }) {
  const { saetze, ohneSatz, vollstaendig } = absagegruende(gruende);
  // **Der unübersetzte Grund zuerst.** Steht nur ein solcher da, sind beide
  // Bedingungen wahr — und „Absage ohne Grund" wäre die unbrauchbarere
  // Auskunft: Einen Grund gibt es ja, nur keinen Satz dafür.
  if (!vollstaendig) {
    throw new Error(`Absage mit unübersetztem Grund: ${ohneSatz.join('; ')}`);
  }
  if (!saetze.length) {
    throw new Error('Absage ohne Grund — dann gibt es nichts abzusagen');
  }

  const weiter = saetze.map((s) => s.weiter).filter(Boolean);
  const zeilen = [
    `Zu Ihrer Anfrage ${textZeile(String(nummer ?? ''))}`,
    `Datum: ${textZeile(String(datum ?? ''))}`,
    '',
    ...absenderzeilen(betreiber),
    '',
    'An:',
    `  ${textZeile(String(kunde.firma ?? ''))}`,
    `  ${textZeile(String(kunde.strasse ?? ''))}`,
    `  ${textZeile(String(kunde.plz ?? ''))} ${textZeile(String(kunde.ort ?? ''))}`,
    '',
    'vielen Dank für Ihre Anfrage. Wir können sie derzeit nicht annehmen:',
    '',
    ...saetze.map((s) => `  · ${s.kunde}`),
  ];
  if (weiter.length) {
    zeilen.push('', 'Was Sie tun können:', ...weiter.map((w) => `  · ${w}`));
  }
  zeilen.push(
    '',
    'Ein Vertrag ist damit nicht zustande gekommen. Ihre Anfrage war unverbindlich,',
    'und es entstehen Ihnen keine Kosten.',
  );
  return { text: zeilen.join('\n'), nummer, gruende: saetze.map((s) => s.id) };
}

/** Die Dateien, in denen Absagegründe entstehen. */
export const GRUNDQUELLEN = Object.freeze([
  'src/beleg.js', 'src/kunde.js', 'src/vorgang.js',
]);

/**
 * Liest die Gründe **aus dem Quelltext**, statt sie aufzuzählen.
 *
 * Eine Liste von Hand prüfte das Gedächtnis ihres Verfassers und nicht den
 * Bestand. Zwei Eigenarten mussten dabei gelernt werden:
 *
 * 1. **Auch die Schablonen.** Der erste Wurf nahm nur einfache Zeichenketten
 *    und übersah damit jeden Grund, der eine Zahl oder einen Namen einsetzt —
 *    also ausgerechnet die beiden, die ein Internum tragen.
 * 2. **Umschläge zählen nicht.** ``fehler.push(`Baustelle: ${f}`)`` reicht die
 *    Meldung eines anderen Feldes mit einer Vorsilbe weiter; der Satz darin
 *    ist schon geprüft. Ein Muster, das solche Umschläge mitnimmt, verlangt
 *    einen Satz für „Baustelle: X" — und das ist keine Meldung, sondern eine
 *    Schablone.
 *
 * @param {(datei: string) => string} lies  liest eine Datei des Shopordners
 */
export function gruendeAusQuellen(lies, dateien = GRUNDQUELLEN) {
  const gefunden = [];
  for (const datei of dateien) {
    const text = String(lies(datei) ?? '');
    for (const t of text.matchAll(/(?:gruende|fehler)\.push\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      gefunden.push(t[1].replace(/\\'/g, "'"));
    }
    for (const t of text.matchAll(/(?:gruende|fehler)\.push\(\s*`([^`]*)`/g)) {
      const satz = t[1].replace(/\$\{[^}]*\}/g, 'X');
      if (/^[A-Za-zÄÖÜäöüß ]+: X$/.test(satz)) continue;
      gefunden.push(satz);
    }
  }
  return gefunden;
}

/**
 * Das Register gegen sich selbst und gegen die Gründe, die es wirklich gibt.
 *
 * @param {string[]} bekannteGruende  interne Gründe, wie die Prüfer sie
 *   erzeugen — aus dem Bestand gelesen, nicht hier aufgezählt.
 */
export function absagebefund(bekannteGruende = [], eintraege = ABSAGEGRUENDE) {
  const meldungen = [];
  const melde = (regel, wo, text) => meldungen.push({ regel, wo, text });
  const gesehen = new Set();

  for (const e of eintraege) {
    if (gesehen.has(e.id)) melde('doppelte-kennung', e.id, `${e.id} steht zweimal im Register`);
    gesehen.add(e.id);
    if (!e.kunde || e.kunde.length < 20) {
      melde('ohne-satz', e.id, `${e.id} hat keinen Satz für den Kunden`);
    }
    if (!e.woher || e.woher.length < 10) {
      melde('ohne-herkunft', e.id, `${e.id} sagt nicht, welche Prüfung ihn erzeugt`);
    }
    if (!bekannteGruende.some((g) => e.muster.test(g))) {
      melde('satz-ohne-grund', e.id,
        `${e.id} übersetzt einen Grund, den im Bestand niemand erzeugt — `
        + 'ein Satz für einen Fall, den es nicht gibt');
    }
  }
  for (const g of bekannteGruende) {
    if (NICHT_FUER_DEN_KUNDEN.some((n) => n.muster.test(g))) continue;
    if (!eintraege.some((e) => e.muster.test(g))) {
      melde('grund-ohne-satz', g,
        `„${g}" kann entstehen und hat keinen Satz für den Kunden — er ginge im Original `
        + 'hinaus oder fiele weg');
    }
  }
  return { geprueft: eintraege.length, meldungen, sauber: meldungen.length === 0 };
}
