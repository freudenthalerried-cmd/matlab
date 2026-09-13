/**
 * Wohin der Kunde überweist.
 *
 * **Der Anlass, 4. September 2026, spät.** Gate 21 hat am 26. August
 * entschieden: **EPS und Vorkasse ab Start, Kundenzahlungsziel null Tage.**
 * Die Auftragsbestätigung sagt seither „Zahlbar sofort, ohne Zahlungsziel" und
 * „Die Bestellungen bei den Herstellern lösen wir nach Zahlungseingang aus".
 *
 * Der Kommentar daneben in `beleg.js` sagt, warum das dort steht:
 *
 * > *Sie ist damit das Dokument, auf das hin der Kunde zahlt — und der einzige
 * > Ort, an dem stehen kann, dass bis dahin nichts bestellt wird. Ohne den
 * > Satz wartet der Kunde auf Ware und der Shop auf Geld.*
 *
 * Der Satz ist da. **Die Kontonummer nicht.**
 *
 * > **Das Dokument, auf das hin der Kunde zahlt, sagt ihm nicht, wohin.**
 * > Genau der Fall, den der Kommentar eine Zeile weiter oben beschreibt.
 *
 * `zahlungsvermerk` kennt „Bankverbindung des Ausstellers" sogar als Lücke —
 * aber nur im Zweig für eine offene Rechnung, und der ist nach Gate 21 heute
 * unerreichbar. Im Vorkassezweig, dem einzigen, der gilt, wurde sie nie
 * verlangt.
 *
 * ## Warum das keine Kleinigkeit ist
 *
 * **Vorkasse braucht keinen Zahlungsanbieter.** Sie braucht ein Konto. Bis
 * heute Abend stand in `src/betriebskette.js`, der Zahlungseingang hänge am
 * Anbieter — das gilt für EPS und für die Karte, nicht für die Überweisung.
 * Der Shop könnte am ersten Tag Geld annehmen, ohne einen Cent Gebühr und ohne
 * eine Entscheidung, die Geld kostet. Was fehlt, ist eine **Dateneingabe**.
 */

/** Die österreichische IBAN: AT, zwei Prüfziffern, fünf Bankleitzahl, elf Kontonummer. */
export const AT_IBAN = /^AT\d{18}$/;

/**
 * Die IBAN-Prüfsumme nach ISO 13616 / Modulo 97-10.
 *
 * Vier Zeichen nach hinten, Buchstaben zu Zahlen (A=10 … Z=35), der Rest
 * geteilt durch 97 muss 1 sein. Stückweise gerechnet, weil die Zahl sonst
 * jede Ganzzahl sprengt.
 *
 * **Dieselbe Sorte Prüfung wie bei der UID** — und aus demselben Grund: Eine
 * IBAN mit Zahlendreher sieht aus wie eine IBAN. Der Kunde überweist, das Geld
 * kommt nicht an, und gemerkt wird es, wenn die Ware ausbleibt.
 */
export function ibanPruefsummeStimmt(roh) {
  const iban = String(roh ?? '').toUpperCase().replace(/\s/g, '');
  if (iban.length < 5 || !/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;

  const umgestellt = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const zeichen of umgestellt) {
    const wert = /\d/.test(zeichen) ? zeichen : String(zeichen.charCodeAt(0) - 55);
    for (const ziffer of wert) rest = (rest * 10 + Number(ziffer)) % 97;
  }
  return rest === 1;
}

/**
 * Die Angaben, die auf der Auftragsbestätigung stehen müssen.
 *
 * `bic` ist **nicht** dabei: Im SEPA-Raum genügt die IBAN seit 2016
 * („IBAN only"), und eine Angabe, die niemand braucht, ist eine Angabe, die
 * niemand pflegt. Der Kontoinhaber steht dabei, weil er vom Firmennamen
 * abweichen kann und die Bank sonst zurückweist.
 */
export const BANKFELDER = Object.freeze([
  Object.freeze({
    feld: 'kontoinhaber',
    bezeichnung: 'Kontoinhaber',
    beispiel: 'Musterfirma GmbH',
    warum: 'Er kann vom Firmenwortlaut abweichen — bei einer Einzelfirma regelmäßig. Steht er '
      + 'nicht dabei, prüft die Bank des Kunden den Namen gegen die IBAN und weist zurück.',
  }),
  Object.freeze({
    feld: 'iban',
    bezeichnung: 'IBAN',
    beispiel: 'AT611904300234573201',
    pruefe: ibanPruefsummeStimmt,
    warum: 'Ohne sie kann der Kunde nicht überweisen, und Vorkasse ist nach Gate 21 der Weg, '
      + 'der ab Start offensteht. Die Prüfsumme wird nachgerechnet: Eine IBAN mit Zahlendreher '
      + 'sieht aus wie eine IBAN, und gemerkt wird der Fehler, wenn die Ware ausbleibt.',
  }),
]);

/**
 * Die Zeilen für die Auftragsbestätigung — oder die Auskunft, dass sie fehlen.
 *
 * @param {object} betreiber
 * @param {string} verwendungszweck  die Vorgangsnummer; ohne sie ist ein
 *   Eingang nicht zuzuordnen und die Bestellung beim Lieferanten wartet
 * @param {(was: string) => string} luecke  wie im Beleg: die sichtbare Marke
 */
export function bankzeilen(betreiber = {}, verwendungszweck, luecke) {
  const fehlend = BANKFELDER.filter((f) => {
    const wert = betreiber[f.feld];
    if (typeof wert !== 'string' || wert.trim() === '') return true;
    return f.pruefe ? !f.pruefe(wert) : false;
  });

  if (fehlend.length) {
    return {
      vollstaendig: false,
      fehlend: fehlend.map((f) => f.feld),
      zeilen: [
        'Bitte überweisen Sie auf:',
        `  ${luecke(fehlend.map((f) => f.bezeichnung).join(' und '))}`,
        `  Verwendungszweck: ${verwendungszweck}`,
      ],
    };
  }

  return {
    vollstaendig: true,
    fehlend: [],
    zeilen: [
      'Bitte überweisen Sie auf:',
      `  ${betreiber.kontoinhaber}`,
      `  IBAN ${betreiber.iban}`,
      `  Verwendungszweck: ${verwendungszweck}`,
    ],
  };
}
