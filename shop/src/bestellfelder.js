/**
 * Was eine Bestellung braucht — an einer Stelle, für alle drei Seiten.
 *
 * **Der Anlass, 4. September 2026, Nachmittag.** Gestern ist der Bestellweg
 * gebaut worden, heute ist er zum ersten Mal durchgefahren: Klick, PHP,
 * Journal. Das Formular hat dabei **drei** Felder gesammelt — Firma, E-Mail,
 * Telefon.
 *
 * `pruefeBestelldaten` in `kunde.js` verlangt **acht**: dazu Straße,
 * Postleitzahl, Ort, UID mit stimmender Prüfziffer und die Bestätigung, dass
 * für ein Unternehmen bestellt wird.
 *
 * > **Die Kasse nahm eine Bestellung entgegen, aus der kein Angebot werden
 * > kann.** Ohne Anschrift keine Rechnung nach § 11 UStG, ohne UID und
 * > Bestätigung keine Nettorechnung nach Gate 7 — und darauf ruht das ganze
 * > Modell.
 *
 * Der Fehler ist meiner, und er ist genau die Sorte, die dieser Bestand sonst
 * findet: **zwei Listen für dieselbe Sache, und die kürzere gewinnt, weil sie
 * zuerst gelesen wird.** Deshalb gibt es die Liste ab heute einmal. Sie
 * versorgt das Formular im Browser, die Prüfung im Empfangsskript und die
 * Kundendatei, die `npm run vorgang` liest.
 *
 * Was hier **nicht** steht, ist die Prüfung selbst. Die bleibt in `kunde.js`;
 * eine zweite Fassung wäre wieder eine Liste, die auseinanderläuft. Dieses
 * Register sagt, **welche Felder erhoben werden**, und ein Prüfer hält es
 * gegen das, was `pruefeBestelldaten` verlangt — in beide Richtungen.
 */

/**
 * Die Felder, die das Bestellformular erhebt.
 *
 * `art` ist der HTML-Feldtyp, `warum` der Grund. Ein Feld ohne Grund kommt
 * nicht durch `pruefeBestellfelder` — wer den Kunden nach etwas fragt, soll
 * sagen können, wofür.
 */
export const BESTELLFELDER = Object.freeze([
  Object.freeze({
    name: 'firma',
    beschriftung: 'Firma',
    art: 'text',
    warum: 'Der Rechnungsempfänger. Er steht nach § 11 Abs 1 Z 2 UStG auf der Rechnung und '
      + 'muss mit dem Firmenbucheintrag übereinstimmen.',
  }),
  Object.freeze({
    name: 'strasse',
    beschriftung: 'Straße und Hausnummer',
    art: 'text',
    warum: 'Die Rechnungsanschrift nach § 11 Abs 1 Z 2 UStG. Sie ist nicht die Baustelle — '
      + 'wohin geliefert wird, entscheidet der Bezirk und die Absprache zur Lieferung.',
  }),
  Object.freeze({
    name: 'plz',
    beschriftung: 'PLZ',
    art: 'text',
    warum: 'Teil der Rechnungsanschrift. Vierstellig und österreichisch — eine ausländische '
      + 'Anschrift führt in ein Reihengeschäft, das dieser Shop nicht abbildet.',
  }),
  Object.freeze({
    name: 'ort',
    beschriftung: 'Ort',
    art: 'text',
    warum: 'Teil der Rechnungsanschrift nach § 11 Abs 1 Z 2 UStG. Eine Anschrift ohne Ort steht auf keiner gültigen Rechnung, und nachfragen kostet einen halben Tag Umlauf.',
  }),
  Object.freeze({
    name: 'email',
    beschriftung: 'E-Mail für die Antwort',
    art: 'email',
    warum: 'Der Rückweg. Angebot, Auftragsbestätigung und Rechnung gehen dorthin; ohne sie '
      + 'bleibt die Bestellung ohne Antwort.',
  }),
  Object.freeze({
    name: 'telefon',
    beschriftung: 'Telefon',
    art: 'tel',
    warum: 'Die Spedition braucht sie für die Baustelle. Sie ist deshalb Pflicht und nicht '
      + 'Höflichkeit — eine Zustellung ohne erreichbare Nummer fährt zweimal.',
  }),
  Object.freeze({
    name: 'uid',
    beschriftung: 'UID-Nummer',
    art: 'text',
    beispiel: 'ATU12345675',
    warum: 'Gate 7: Dieser Shop verkauft netto an Unternehmer. Die UID trägt eine Prüfziffer, '
      + 'die nachgerechnet wird — eine falsche gefährdet den Vorsteuerabzug des Kunden.',
  }),
  Object.freeze({
    name: 'unternehmerBestaetigt',
    beschriftung: 'Ich bestelle für ein Unternehmen',
    art: 'checkbox',
    warum: 'Gate 7 verlangt beides: die UID **und** die ausdrückliche Bestätigung. Eine UID '
      + 'allein könnte auch abgeschrieben sein; die Bestätigung ist die Erklärung des '
      + 'Bestellers, dass er als Unternehmer handelt.',
  }),
]);

/** Ein vollständiger Satz Beispieldaten aus dem Register — für Proben und Prüfer. */
export function beispielbestellung(felder = BESTELLFELDER) {
  const beispiele = {
    firma: 'Musterbau GmbH',
    strasse: 'Baustellenweg 7',
    plz: '4600',
    ort: 'Wels',
    email: 'kunde@example.at',
    telefon: '+43 7242 12345',
    uid: 'ATU12345675',
    unternehmerBestaetigt: true,
  };
  const daten = {};
  for (const f of felder) daten[f.name] = beispiele[f.name];
  return daten;
}

/**
 * Hält das Register gegen die Prüfung — in beide Richtungen.
 *
 * **Vorwärts:** Ein vollständiger Satz aus dem Register muss durchkommen.
 * Kommt er nicht durch, erhebt das Formular zu wenig — genau der Fehler vom
 * 4. September.
 *
 * **Rückwärts:** Jedes einzelne Feld muss die Prüfung zum Kippen bringen,
 * wenn es fehlt. Ein Feld, dessen Fehlen niemanden stört, ist eine Frage an
 * den Kunden ohne Grund.
 *
 * @param {(daten: object) => {gueltig: boolean, fehler: string[]}} pruefe
 */
export function pruefeBestellfelder(pruefe, felder = BESTELLFELDER) {
  const meldungen = [];

  for (const f of felder) {
    if (!f.warum || f.warum.length < 60) {
      meldungen.push({ regel: 'feld-ohne-grund', text: `${f.name}: kein tragfähiger Grund` });
    }
    if (!f.beschriftung || !f.art) {
      meldungen.push({ regel: 'feld-unvollstaendig', text: `${f.name}: ohne Beschriftung oder Feldtyp` });
    }
  }

  const voll = beispielbestellung(felder);
  const ganz = pruefe({ ...voll, land: 'AT' });
  if (!ganz.gueltig) {
    meldungen.push({
      regel: 'register-reicht-nicht',
      text: `ein vollständiger Satz aus dem Register kommt nicht durch: ${ganz.fehler.join('; ')}`,
    });
  }

  for (const f of felder) {
    const ohne = { ...voll, land: 'AT' };
    delete ohne[f.name];
    if (pruefe(ohne).gueltig) {
      meldungen.push({
        regel: 'feld-ohne-wirkung',
        text: `${f.name} fehlt, und die Prüfung stört sich nicht daran`,
      });
    }
  }

  return { geprueft: felder.length, meldungen, sauber: meldungen.length === 0 };
}
