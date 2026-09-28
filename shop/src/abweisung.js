/**
 * Was der Besteller liest, wenn die Bestellung nicht durchgeht.
 *
 * **Der Anlass, 15. September 2026.** Gestern haben die acht Eingabefelder
 * einen Satz für den Kunden bekommen — die Frage. Die **Antwort** blieb, wie
 * sie war, und sie lautete an achtzehn Stellen ungefähr so:
 *
 *     Ablage belegt.
 *     Kein lesbares JSON.
 *     Nur POST.
 *     Feld fehlt oder ist leer: unternehmerBestaetigt
 *
 * Das sind Sätze für den, der das Skript geschrieben hat. Der Besteller weiß
 * nicht, was eine Ablage ist, hat kein JSON abgeschickt und kennt das Feld
 * unter dem Namen „Ich bestelle für ein Unternehmen".
 *
 * > **Eine Abweisung, die nur sagt, was schiefging, lässt den Kunden mit
 * > seinem Geld in der Hand stehen.**
 *
 * **Berichtigt am 15. September 2026.** Zwei dieser Sätze endeten auf „…oder
 * rufen Sie uns an" — und eine Telefonnummer führt dieser Betrieb heute
 * nirgends. Ein Rückweg, der auf eine leere Stelle zeigt, ist kein Rückweg
 * (siehe `src/rueckweg.js`); beide Sätze stehen jetzt ohne ihn und bleiben
 * vollständig. Kommt die Nummer, gehört sie hinein — und `kanalbefund`
 * sagt es.
 *
 * Drei davon — die drei Ablagefälle — sind **unsere** Fehler und wurden dem
 * Kunden hingestellt, als hätte er etwas falsch gemacht. Das ist der teuerste
 * Fall: Wer glaubt, er sei schuld, versucht es anders; wer weiß, dass es an
 * uns liegt, ruft an.
 *
 * ## Warum die Sätze im PHP stehen und trotzdem hier
 *
 * `bestellung.php` wird kopiert, nicht erzeugt; es kann dieses Modul nicht
 * lesen. Der Weg ist derselbe wie bei `src/absage.js`: Die Sätze stehen dort,
 * wo sie wirken, und dieses Register hält sie **gegen den Quelltext** — in
 * beide Richtungen. Eine handgepflegte zweite Liste, die auseinanderläuft,
 * wäre genau der Fehler, den dieses Haus seit Wochen sucht.
 *
 * Was `beschriftung` angeht: Das Skript kennt seit heute nicht nur den
 * Feldnamen, sondern auch die Beschriftung aus `src/bestellfelder.js` — sonst
 * stünde in der Meldung `unternehmerBestaetigt` und nicht das, was auf dem
 * Formular steht.
 */

import { findeInterna } from './interna.js';

/**
 * Wörter, die in einem Satz an den Besteller nichts zu suchen haben.
 *
 * Sie sind nicht geheim — anders als die Einträge in `src/interna.js` —,
 * sondern **unverständlich**. Ein Besteller, der „application/json" liest,
 * erfährt nur, dass er hier nicht gemeint ist.
 */
export const WERKSTATTWOERTER = Object.freeze([
  Object.freeze({ wort: 'JSON', warum: 'ein Datenformat; der Besteller hat ein Formular ausgefüllt' }),
  Object.freeze({ wort: 'POST', warum: 'ein HTTP-Verfahren, kein Vorgang der Bestellung' }),
  Object.freeze({ wort: 'application/', warum: 'ein Inhaltstyp aus dem Protokoll' }),
  Object.freeze({ wort: 'Ablage', warum: 'unser Wort für das Journal — auf der Kundenseite ein Möbelstück' }),
  Object.freeze({ wort: 'Feld fehlt', warum: 'nennt die Sache und nicht das Feld, das der Kunde sieht' }),
  Object.freeze({ wort: 'Parameter', warum: 'Programmiersprache' }),
  Object.freeze({ wort: 'Token', warum: 'Programmiersprache' }),
]);

/**
 * Jede Stelle, an der das Empfangsskript eine Bestellung abweist.
 *
 * `satz` steht **wörtlich** so im Skript und wird dagegen gehalten. `weiter`
 * ist der nächste Schritt; er darf nur dort fehlen, wo die Abweisung gar nicht
 * von einem Menschen ausgelöst werden kann. `unsereSchuld` entscheidet, ob der
 * Satz das auch sagt.
 */
export const ABWEISUNGEN = Object.freeze([
  Object.freeze({
    id: 'nur-formular',
    status: 405,
    satz: 'Diese Seite nimmt Bestellungen nur über das Formular der Kasse an.',
    weiter: 'Bitte schicken Sie die Bestellung über die Kasse ab.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'form-unbekannt',
    status: 415,
    satz: 'Die Bestellung ist nicht in der erwarteten Form angekommen.',
    weiter: 'Bitte laden Sie die Seite neu und schicken Sie die Bestellung noch einmal ab.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'von-woanders',
    status: 403,
    satz: 'Diese Bestellung wurde nicht auf dieser Seite ausgefüllt.',
    weiter: 'Bitte öffnen Sie die Kasse erneut und schicken Sie die Bestellung von dort ab.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'unvollstaendig-angekommen',
    status: 400,
    satz: 'Die Bestellung ist unvollständig bei uns angekommen.',
    weiter: 'Bitte laden Sie die Seite neu und schicken Sie die Bestellung noch einmal ab.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'zu-umfangreich',
    status: 413,
    satz: 'Die Bestellung ist zu umfangreich für einen Vorgang.',
    weiter: 'Bitte teilen Sie sie in zwei Bestellungen.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'angabe-fehlt',
    status: 400,
    satz: 'Bitte ergänzen Sie noch:',
    weiter: 'Die Angabe steht auf dem Formular unter diesem Namen.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'angabe-zu-lang',
    status: 400,
    satz: 'Diese Angabe ist länger, als das Formular annehmen kann:',
    weiter: 'Bitte kürzen Sie sie.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'zeichen-nicht-erlaubt',
    status: 400,
    satz: 'Diese Angabe enthält ein Zeichen, das hier nicht stehen darf:',
    weiter: 'Bitte ohne Zeilenumbrüche eintragen.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'haekchen-fehlt',
    status: 400,
    satz: 'Bitte setzen Sie noch das Häkchen bei:',
    weiter: 'Ohne diese Erklärung können wir keine Nettorechnung ausstellen.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'mailadresse-unlesbar',
    status: 400,
    satz: 'Die E-Mail-Adresse ist nicht lesbar.',
    weiter: 'Bitte prüfen Sie die Schreibweise — dorthin geht Ihr Angebot.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'weg-nicht-eingerichtet',
    status: 503,
    satz: 'Der Bestellweg ist gerade nicht in Betrieb. Das liegt an uns.',
    weiter: 'Bitte schicken Sie uns die Liste als Anfrage — die Schaltfläche daneben tut das.',
    unsereSchuld: true,
  }),
  Object.freeze({
    id: 'nicht-abgelegt',
    status: 500,
    satz: 'Ihre Bestellung konnte bei uns nicht gespeichert werden. Das liegt an uns und '
      + 'nicht an Ihrer Eingabe.',
    weiter: 'Bitte versuchen Sie es in einigen Minuten noch einmal.',
    unsereSchuld: true,
  }),
  Object.freeze({
    /*
     * **Keine Abweisung, aber dieselbe Frage.** Seit Gate 37 verbucht das
     * Skript eine wortgleiche Bestellung binnen zehn Minuten nicht zweimal,
     * sondern gibt die alte Nummer zurück — mit `ok => true`. Der Satz steht
     * trotzdem hier: Er geht an denselben Leser, und für ihn ist „liegt schon
     * vor" eine Auskunft über seinen Vorgang wie jede andere.
     */
    id: 'liegt-schon-vor',
    status: 200,
    satz: 'Diese Bestellung liegt bereits vor. Ihre Nummer bleibt',
    weiter: 'Die Nummer bleibt dieselbe; es ist kein zweiter Vorgang entstanden.',
    unsereSchuld: false,
  }),
  Object.freeze({
    id: 'gerade-zu-viele',
    status: 429,
    satz: 'Gerade gehen ungewöhnlich viele Bestellungen ein.',
    weiter: 'Bitte in einer Minute noch einmal abschicken.',
    unsereSchuld: true,
  }),
]);

/**
 * Fügt in PHP zusammengesetzte Zeichenketten wieder zusammen.
 *
 * **Der erste Lauf dieses Prüfers, 15. September 2026.** Er meldete den Satz
 * über die fehlgeschlagene Ablage als „steht in keiner Abweisung" — und er
 * stand dort, nur über drei Zeilen verteilt:
 *
 *     'Ihre Bestellung konnte bei uns nicht gespeichert werden. Das liegt an uns '
 *         . 'und nicht an Ihrer Eingabe. Bitte …'
 *
 * > **Ein Satz, den der Setzer umbricht, ist derselbe Satz.** Ein Prüfer, der
 * > das nicht weiß, zwingt den Quelltext in eine Zeilenlänge, die er nicht
 * > hat — und wird bei der ersten langen Meldung abgeschaltet.
 */
export function zusammengesetzt(quelle) {
  return String(quelle ?? '').replace(/'\s*\.\s*'/g, '').replace(/"\s*\.\s*"/g, '');
}

/** Was in einem Satz an den Besteller nach Werkstatt klingt. */
export function werkstattwoerter(satz, woerter = WERKSTATTWOERTER) {
  return woerter.filter((w) => String(satz ?? '').includes(w.wort));
}

/**
 * Hält das Register gegen den Quelltext des Empfangsskripts — beide Richtungen.
 *
 * @param {string} quelle  der Inhalt von `bestellung.php`
 */
export function abweisungsbefund(quelle, eintraege = ABWEISUNGEN, internaIm = findeInterna) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const php = zusammengesetzt(String(quelle ?? ''));

  for (const e of eintraege) {
    if (!php.includes(e.satz)) {
      melde('satz-ohne-stelle',
        `${e.id}: „${e.satz}" steht in keiner Abweisung des Empfangsskripts — entweder ist der `
        + 'Satz dort umgeschrieben worden oder dieser Eintrag beschreibt nichts');
    }
    if (!e.weiter || e.weiter.length < 20) {
      melde('abweisung-ohne-weiter',
        `${e.id}: kein nächster Schritt — eine Abweisung ohne nächsten Schritt lässt den `
        + 'Kunden mit seinem Geld in der Hand stehen');
    }
    // Wer glaubt, er sei schuld, versucht es anders; wer weiß, dass es an uns
    // liegt, ruft an. Deshalb muss der Satz es sagen und nicht nur wir.
    if (e.unsereSchuld && !/an uns|ungew(ö|oe)hnlich viele/i.test(e.satz)) {
      melde('eigener-fehler-verschwiegen',
        `${e.id}: der Fehler liegt bei uns, und der Satz sagt es nicht`);
    }
    for (const w of werkstattwoerter(`${e.satz} ${e.weiter}`)) {
      melde('abweisung-aus-der-werkstatt',
        `${e.id}: „${w.wort}" — ${w.warum}`);
    }
    for (const fund of internaIm(`${e.satz} ${e.weiter}`)) {
      melde('abweisung-mit-interna', `${e.id}: „${fund.fundstelle}" — ${fund.warum}`);
    }
  }

  /*
   * **Die Gegenrichtung.** Jede `antworte(…, 'grund' => …)`-Stelle im Skript
   * muss von einem Eintrag gedeckt sein. Ohne diese Schleife könnte morgen
   * jemand eine neue Abweisung hinschreiben, und sie stünde wieder in der
   * Sprache dessen, der sie geschrieben hat.
   */
  const stellen = [...php.matchAll(/'grund'\s*=>\s*(?:'([^']*)'|"([^"]*)")/g)]
    .map((m) => (m[1] ?? m[2]).trim());
  const gedeckt = eintraege.map((e) => e.satz);
  for (const s of stellen) {
    if (gedeckt.some((g) => s.startsWith(g) || g.startsWith(s))) continue;
    melde('stelle-ohne-satz',
      `„${s}" weist eine Bestellung ab und steht in keinem Eintrag — wer eine Abweisung `
      + 'schreibt, schreibt sie in der Sprache dessen, der sie liest');
  }

  return {
    eintraege: eintraege.length,
    stellen: stellen.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
