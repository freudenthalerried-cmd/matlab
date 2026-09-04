/**
 * Der Auftrag an den Rechtstexteanbieter — aus den Registern gebaut.
 *
 * **Der Anlass, 4. September 2026.** Seit gestern steht fest, was das
 * Hochladen wirklich blockiert: die vier Impressumsangaben (die dem
 * Auftraggeber vorliegen) und **Datenschutzerklärung plus Offenlegung** als
 * Wortlaut. Das zweite ist eine Ausgabe und damit seine Entscheidung.
 *
 * Die Zuarbeit dafür liegt vollständig im Bestand — verteilt auf sechs
 * Register und zwei gebaute Seiten. Verteilt ist sie nichts wert:
 *
 * > **Wer eine Ausgabe freigeben soll, muss wissen, wofür.** Ein Anbieter, der
 * > „machen Sie uns die Rechtstexte" hört, rechnet den vollen Umfang; einer,
 * > der eine Gliederung mit Begründungen und den technischen Befund bekommt,
 * > rechnet die Arbeit, die übrig bleibt.
 *
 * Dieselbe Bauart wie `lieferantenanfrage.js`: Der Brief entsteht aus den
 * Registern, er wird **nicht** versendet, und ohne Absenderdaten entsteht er
 * als „nicht versandfähig" statt als Brief ohne Rückantwortadresse.
 *
 * ## Was er ausdrücklich nicht tut
 *
 * **Er formuliert keinen Rechtstext.** Kein Satz darin ist zum Übernehmen
 * gedacht; was er trägt, sind Gliederung, Grundlagen, Befunde und die
 * Abgrenzung des Adressatenkreises. Der Wortlaut kommt vom Anbieter — das
 * steht seit dem 26. August auf jeder Rechtsseite und gilt hier genauso.
 *
 * **Er nennt keinen Preis und keine Frist.** Beides verhandelt der
 * Auftraggeber.
 */

import { textZeile } from './format.js';

/**
 * **Berichtigt beim ersten Testlauf.** Die erste Fassung nahm `wert.trim()`
 * und ließ damit Zeilenumbrüche im Firmennamen durch — ein untergeschobenes
 * „Betreff: Alles gratis" wäre als eigene Zeile im Brief gestanden.
 *
 * `textZeile()` macht genau das seit dem 31. August für die Belege; ein
 * zweiter Ausgang gehört an dieselbe Regel und nicht an eine eigene.
 */
const feld = (wert, bezeichnung) => (textZeile(wert) !== ''
  ? textZeile(wert)
  : `[[ ${bezeichnung} — FEHLT ]]`);

/**
 * Darf der Auftrag hinausgehen?
 *
 * Dieselbe Regel wie beim Lieferantenbrief: Ohne Rückantwortadresse ist ein
 * Brief eine Frage ohne Empfänger für die Antwort. Zusätzlich verlangt dieser
 * hier die Firmenbuchnummer und den Sitz — ohne sie kann der Anbieter die
 * Offenlegung nach § 25 MedienG gar nicht schreiben.
 */
export function darfBeauftragtWerden(betreiber = {}) {
  const gruende = [];
  if (!betreiber.email) gruende.push('keine E-Mail-Adresse des Absenders');
  if (!betreiber.firma) gruende.push('kein Firmenname');
  if (!betreiber.firmenbuchnummer) gruende.push('keine Firmenbuchnummer — die Offenlegung braucht sie');
  if (!betreiber.ort) gruende.push('kein Sitz');
  return { darf: gruende.length === 0, gruende };
}

/**
 * Baut den Auftrag.
 *
 * Alles Inhaltliche kommt herein — diese Datei kennt keine Gliederung und
 * keinen Befund, sie ordnet sie. Sonst gäbe es die Register zweimal.
 */
export function erzeugeRechtstexteauftrag({
  betreiber = {},
  pflichttexte = [],
  agbGliederung = [],
  datenschutzGliederung = [],
  websiteVerarbeitung = [],
  b2b = { entfaellt: [], bleibt: [] },
  datenfluesse = [],
  offeneImpressumsfelder = [],
} = {}) {
  const pruefung = darfBeauftragtWerden(betreiber);
  const sofort = pflichttexte.filter((t) => t.abWann === 'besuch');
  const spaeter = pflichttexte.filter((t) => t.abWann !== 'besuch');

  const z = [];
  z.push(
    'Betreff: Angebot für Datenschutzerklärung, Offenlegung und AGB — Online-Shop im B2B',
    '',
    'Sehr geehrte Damen und Herren,',
    '',
    `wir, die ${feld(betreiber.firma, 'Absenderfirma')} in `
      + `${feld(betreiber.plz, 'PLZ')} ${feld(betreiber.ort, 'Ort')} `
      + `(FN ${feld(betreiber.firmenbuchnummer, 'Firmenbuchnummer')}), betreiben demnächst einen `
      + 'Online-Shop für Baustoffe. Wir bitten um ein Angebot — und zwar in zwei Stufen, weil',
    'die eine sofort gebraucht wird und die andere erst später.',
    '',
    '--- Was der Shop tut, und was er nicht tut ---',
    '',
    'Er richtet sich **ausschließlich an Unternehmer**; Verbraucherbestellungen sind',
    'ausgeschlossen und werden technisch abgewiesen. Alle Preise sind Nettopreise.',
    '',
    'Er nimmt **derzeit keine Bestellung entgegen.** Der Besucher füllt einen Warenkorb und',
    'bekommt eine fertig gerechnete, unverbindliche Anfrage zum Kopieren; ein Vertrag kommt',
    'auf der Seite nicht zustande. Das ist für die Stufung unten der entscheidende Punkt.',
    '',
    '--- Stufe 1: gebraucht, sobald die Seite erreichbar ist ---',
    '',
  );
  for (const t of sofort) {
    z.push(`  * ${textZeile(t.id)} (${textZeile(t.grundlage)})`, `      ${textZeile(t.warum)}`, '');
  }
  z.push(
    '--- Stufe 2: gebraucht, sobald der Shop Bestellungen annimmt ---',
    '',
  );
  for (const t of spaeter) {
    z.push(`  * ${t.id} (${t.grundlage})`, `      ${t.warum}`, '');
  }

  z.push('--- Was wegen des Adressatenkreises entfällt ---', '');
  for (const e of b2b.entfaellt) z.push(`  * ${textZeile(e)}`);
  z.push('', 'Was trotz B2B bleibt:', '');
  for (const e of b2b.bleibt) z.push(`  * ${textZeile(e)}`);

  z.push(
    '',
    '--- Zuarbeit: die Punkte, die wir abgedeckt brauchen ---',
    '',
    `Datenschutzerklärung (${datenschutzGliederung.length} Punkte):`,
    '',
  );
  for (const [i, p] of datenschutzGliederung.entries()) z.push(`  ${i + 1}. ${textZeile(p)}`);

  z.push(
    '',
    `Geschäftsbedingungen (${agbGliederung.length} Punkte, mit dem Grund, warum wir sie brauchen):`,
    '',
  );
  for (const p of agbGliederung) z.push(`  ${p.nr}. ${textZeile(p.titel)}`, `      ${textZeile(p.hinweis)}`);

  z.push(
    '',
    '--- Technischer Befund: was beim bloßen Besuch geschieht ---',
    '',
    'Aus dem Quelltext gelesen, nicht aus einer Vorlage. Das ist die Angabe, die Sie sonst',
    'mit Rückfragen erheben müssten:',
    '',
  );
  for (const v of websiteVerarbeitung) z.push(`  * ${textZeile(v.was)}: ${textZeile(v.befund)}`);

  if (datenfluesse.length) {
    z.push('', '--- Wohin Daten gehen ---', '');
    for (const d of datenfluesse) {
      z.push(`  * ${textZeile(d.datum)}`, `      an ${textZeile(d.empfaenger.join(', '))} — ${textZeile(d.grundlage)}`);
    }
  }

  if (offeneImpressumsfelder.length) {
    z.push(
      '',
      '--- Offen auf unserer Seite ---',
      '',
      `${offeneImpressumsfelder.length} Pflichtangaben des Impressums tragen wir selbst nach; `
        + 'sie liegen uns vor:',
      '',
    );
    for (const f of offeneImpressumsfelder) z.push(`  * ${textZeile(f)}`);
  }

  z.push(
    '',
    'Einen Wortlaut erwarten wir von Ihnen — wir haben bewusst keinen vorformuliert.',
    '',
    'Für Rückfragen erreichen Sie uns unter:',
    `  ${feld(betreiber.email, 'E-Mail-Adresse des Absenders')}`,
    `  ${feld(betreiber.telefon, 'Telefonnummer des Absenders')}`,
    '',
    'Mit freundlichen Grüßen',
    feld(betreiber.firma, 'Absenderfirma'),
  );

  return {
    text: `${z.join('\n')}\n`,
    zeilen: z,
    versandfaehig: pruefung.darf,
    gruende: pruefung.gruende,
    stufe1: sofort.map((t) => t.id),
    stufe2: spaeter.map((t) => t.id),
  };
}
