/**
 * Der Anfragetext: was ein Kunde absenden kann, solange nichts bestellbar ist.
 *
 * **Der Anlass.** Die Kasse rechnet den Warenkorb durch und sagt dann wahr-
 * heitsgemäß, dass sie nichts auslöst: Es ist kein Zahlungsanbieter gewählt,
 * und die Rechtstexte stehen als Gerüst. Für den Betrieb ist das richtig —
 * für den Besucher ist es eine Wand. Wer sich durch sieben Warengruppen
 * geklickt und einen Korb gefüllt hat, geht dort ohne Spur wieder weg.
 *
 * Im regionalen Baustoffhandel ist der Weg daneben ohnehin der übliche: Der
 * Betrieb schickt seine Liste, der Händler bestätigt Preis und Termin. Diese
 * Datei erzeugt genau diese Liste — vollständig, gerechnet, mit Bezirk und
 * Preisstand. Sie **versendet nichts**: Der Text wird angezeigt und kann
 * kopiert werden; ob daraus eine Mail wird, entscheidet der Kunde in seinem
 * eigenen Programm. Damit wird auf dieser Seite auch nichts gespeichert und
 * nichts übertragen, was eine Datenschutzerklärung tragen müsste.
 *
 * **Was der Text nicht sein darf.** Keine Bestellung und keine Zusage. Er
 * heißt Anfrage, er sagt es in der ersten Zeile, und er nennt die Preise
 * freibleibend samt dem Datum, auf das sie sich stützen. Ein Text, der wie
 * eine Auftragsbestätigung aussieht, wäre schlimmer als die Wand.
 *
 * **Was nicht hineingehört:** der Einkaufspreis und die Handelsspanne. Der
 * Anfragetext geht an den Kunden, und die Weisung vom 28.08. gilt hier wie
 * auf jeder anderen Kundenseite. `pruefeAnfrageaufGeheimnis()` unten macht
 * daraus eine Prüfung statt einer Absichtserklärung.
 */

import { pruefeLieferort } from './liefergebiet.js';

// Heißt `anfrageEuro` und nicht `eur`: Ein Modul dieses Bündels wandert auch
// in die Demo-Einzeldatei, und deren Vorlage führt dort bereits ein `const
// eur`. Getrennte Module dürfen denselben Namen tragen; im zusammengefügten
// Skript ist er ein SyntaxError, der die ganze Seite lahmlegt.
const anfrageEuro = (n) => `${n.toFixed(2).replace('.', ',')} €`;

/** Zeilen so ausrichten, dass Mengen und Beträge unter einander stehen. */
function anfrageSpalte(text, breite) {
  const t = String(text);
  return t.length >= breite ? t : t + ' '.repeat(breite - t.length);
}

/**
 * Baut den Anfragetext aus Warenkorb, Rechnung und Bezirk.
 *
 * Heißt `baueKundenanfrage` und nicht `baueAnfrage`, weil `vies.js` bereits
 * eine `baueAnfrage()` führt — die UID-Abfrage beim EU-Register. Im Modul
 * wäre die Doppelung harmlos; im zusammengefügten Browserbündel ist sie ein
 * SyntaxError. Aufgefallen ist sie nicht beim Lesen, sondern weil
 * `buendel.js` die Namen zählt, bevor es zusammenfügt.
 *
 * @param {object} eingabe
 * @param {object} eingabe.rechnung   Ergebnis aus kundenWarenkorb()
 * @param {string} eingabe.bezirk     Bezirk der Baustelle
 * @param {object} eingabe.betreiber  { firma, ort, email }
 * @param {string} [eingabe.datum]    ISO-Datum, Vorgabe: heute
 * @returns {{moeglich: boolean, hindernis: string|null, betreff: string, text: string, hinweise: string[]}}
 */
export function baueKundenanfrage({ rechnung, bezirk, betreiber = {}, datum = null }) {
  const leer = { betreff: '', text: '', hinweise: [] };

  if (!rechnung || !rechnung.teillieferungen || rechnung.positionen === 0) {
    return { moeglich: false, hindernis: 'Der Warenkorb ist leer.', ...leer };
  }
  if (!bezirk) {
    return { moeglich: false, hindernis: 'Der Bezirk der Baustelle fehlt.', ...leer };
  }

  // Gate 23 wird hier nicht nachgebaut, sondern aufgerufen. Eine zweite
  // Bezirksliste im Anfragetext wäre die sicherste Art, beide auseinander-
  // laufen zu lassen — dieselbe Begründung wie in der Kasse.
  const gebiet = pruefeLieferort({ land: 'AT', bezirk });
  if (!gebiet.liefern) {
    return { moeglich: false, hindernis: gebiet.grund, ...leer };
  }

  const tag = datum ?? new Date().toISOString().slice(0, 10);
  const zeilen = [];
  const hinweise = [];

  zeilen.push('UNVERBINDLICHE ANFRAGE — keine Bestellung.');
  zeilen.push('');
  zeilen.push(`Baustelle im Bezirk: ${bezirk}`);
  zeilen.push(`Erstellt am: ${tag}`);
  zeilen.push('');
  zeilen.push('Positionen');
  zeilen.push('----------');

  const preisstaende = new Set();
  for (const teil of rechnung.teillieferungen) {
    for (const p of teil.positionen) {
      if (p.preisStand) preisstaende.add(p.preisStand);
      zeilen.push(`${anfrageSpalte(`${p.menge} ${p.einheit ?? 'Stk'}`, 12)}`
        + `${anfrageSpalte(p.bezeichnung, 46)}`
        + `${anfrageSpalte(p.sku, 12)}`
        + `${anfrageSpalte(anfrageEuro(p.vkNetto), 11)}`
        + anfrageEuro(p.zeilensummeNetto));
    }
  }

  zeilen.push('');
  zeilen.push('Summen (netto, Preise für Unternehmer)');
  zeilen.push('-------------------------------------');
  zeilen.push(`${anfrageSpalte('Warenwert', 22)}${anfrageEuro(rechnung.warenwertNetto)}`);
  zeilen.push(`${anfrageSpalte('Zustellung', 22)}${anfrageEuro(rechnung.frachtNetto)}`);
  zeilen.push(`${anfrageSpalte('Netto gesamt', 22)}${anfrageEuro(rechnung.nettoGesamt)}`);
  zeilen.push(`${anfrageSpalte('USt', 22)}${anfrageEuro(rechnung.ustBetrag)}`);
  zeilen.push(`${anfrageSpalte('Brutto gesamt', 22)}${anfrageEuro(rechnung.bruttoGesamt)}`);

  // Das Gewicht ist keine Zierde: Es entscheidet, ob die Zustellung mit dem
  // eigenen Fahrzeug geht oder eine Spedition braucht. Eine Summe über
  // Artikel mit unbekanntem Gewicht wäre eine Untergrenze, die wie eine
  // Summe aussieht — deshalb steht die Zahl der offenen Positionen dabei.
  if (rechnung.gewichtKg > 0) {
    const offen = rechnung.positionenOhneGewicht;
    zeilen.push(`${anfrageSpalte('Gewicht', 22)}${rechnung.gewichtKg.toFixed(1).replace('.', ',')} kg`
      + (offen ? `  (für ${offen} Position${offen === 1 ? '' : 'en'} nicht hinterlegt)` : ''));
  }

  zeilen.push('');
  zeilen.push('Was diese Anfrage ist und was nicht');
  zeilen.push('-----------------------------------');
  zeilen.push('Diese Liste ist eine Anfrage, keine Bestellung. Sie verpflichtet');
  zeilen.push('keine der beiden Seiten. Verbindlich wird ein Preis erst mit');
  zeilen.push('unserer Bestätigung.');

  if (preisstaende.size) {
    const sortiert = [...preisstaende].sort();
    const spanne = sortiert.length === 1
      ? sortiert[0]
      : `${sortiert[0]} bis ${sortiert[sortiert.length - 1]}`;
    zeilen.push(`Preisstand der Positionen: ${spanne}. Preise freibleibend.`);
  } else {
    hinweise.push('Zu keiner Position ist ein Preisstand hinterlegt — der Text nennt deshalb keinen.');
  }

  for (const o of rechnung.offen ?? []) {
    zeilen.push(`Offen: ${o}`);
    hinweise.push(o);
  }

  zeilen.push('');
  zeilen.push('Bitte um Rückmeldung zu Preis, Verfügbarkeit und Liefertermin.');

  const firma = betreiber.firma ?? '';
  const betreff = `Anfrage ${tag} — ${rechnung.positionen} Position`
    + `${rechnung.positionen === 1 ? '' : 'en'}, Bezirk ${bezirk}`;

  if (!betreiber.email) {
    hinweise.push('Keine E-Mail-Adresse hinterlegt — der Text kann nur kopiert, nicht gesendet werden.');
  }

  return {
    moeglich: true,
    hindernis: null,
    betreff,
    text: zeilen.join('\n'),
    empfaenger: betreiber.email || null,
    firma,
    hinweise,
  };
}

/**
 * Baut die `mailto:`-Adresse — oder gibt null zurück, wenn das nicht geht.
 *
 * Zwei Gründe für null, und beide sind keine Fehler: Es ist keine Adresse
 * hinterlegt (dann ist die Adresse selbst noch offen), oder der Text ist zu
 * lang für eine Adresszeile. Browser und Mailprogramme kappen lange
 * `mailto:`-Adressen **stillschweigend** — eine halbe Positionsliste in der
 * Mail wäre schlimmer als kein Knopf. Deshalb ist der kopierbare Text der
 * Hauptweg und die Mailadresse die Abkürzung, nicht umgekehrt.
 */
export const MAILTO_HOECHSTLAENGE = 1800;

export function mailtoAdresse(anfrage) {
  if (!anfrage.moeglich || !anfrage.empfaenger) return null;
  const adresse = `mailto:${encodeURIComponent(anfrage.empfaenger)}`
    + `?subject=${encodeURIComponent(anfrage.betreff)}`
    + `&body=${encodeURIComponent(anfrage.text)}`;
  return adresse.length > MAILTO_HOECHSTLAENGE ? null : adresse;
}

/**
 * Prüft, dass im Anfragetext nichts steht, was dem Kunden nicht gehört.
 *
 * Eine Zusage im Kommentar ist keine Prüfung. Diese Funktion bekommt den
 * fertigen Text und die Artikel **mit** ihren Einkaufsdaten und sucht beides
 * darin: die Zahlen und die Wörter der Kalkulation.
 *
 * **Was sie kann und was nicht.** Die Wortprüfung ist eindeutig. Die
 * Zahlenprüfung ist es nicht: Ein Verkaufspreis oder eine Zeilensumme kann
 * zufällig genau dem Einkaufspreis eines anderen Artikels entsprechen — bei
 * 46 Artikeln und Beträgen auf zwei Nachkommastellen ist das kein
 * Gedankenspiel, sondern beim ersten Lauf dieses Tests tatsächlich passiert.
 * Ein Treffer heißt deshalb „hier nachsehen", nicht „hier steht ein
 * Geheimnis".
 *
 * Die eigentliche Zusicherung liegt ohnehin weiter oben: Ins Browserbündel
 * geht nur `oeffentlicherArtikel()`, und der führt keinen Einkaufspreis;
 * `npm run pruefe-geheimnis` misst das am ausgelieferten Stand. Diese
 * Funktion ist die zweite Reihe, nicht die erste.
 */
export function pruefeAnfrageAufGeheimnis(text, artikelMitEk = []) {
  const treffer = [];
  const zahl = (n) => n.toFixed(2).replace('.', ',');
  for (const a of artikelMitEk) {
    if (typeof a.ekNetto === 'number' && text.includes(zahl(a.ekNetto))) {
      treffer.push(`${a.sku}: die Zahl ${zahl(a.ekNetto)} ist sein Einkaufspreis und steht im Text`);
    }
  }
  for (const wort of ['Spanne', 'Marge', 'Rohertrag', 'Deckungsbeitrag', 'Einkaufspreis']) {
    if (new RegExp(wort, 'i').test(text)) treffer.push(`Das Wort „${wort}" steht im Text`);
  }
  return treffer;
}
