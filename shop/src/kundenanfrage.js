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

/**
 * Zeilen so ausrichten, dass Mengen und Beträge unter einander stehen.
 *
 * **Berichtigt am 30.08.** Der Rückgabewert war bei zu langem Text der Text
 * selbst — ohne ein einziges Leerzeichen dahinter. Die nächste Spalte klebte
 * dann daran: `…186 M 25 kgPOS-11283`. Eine Spalte, die nicht trennt, ist
 * keine Spalte. Mindestens ein Leerzeichen steht immer.
 */
function anfrageSpalte(text, breite) {
  const t = String(text);
  return t + ' '.repeat(Math.max(1, breite - t.length));
}

/**
 * Einen langen Namen auf Zeilen der Spaltenbreite umbrechen.
 *
 * An Wortgrenzen, und wenn ein einzelnes Wort länger ist als die Spalte,
 * bleibt es ungeteilt stehen — ein zerschnittener Artikelname ist schlimmer
 * als eine zu lange Zeile.
 */
function anfrageUmbruch(text, breite) {
  const zeilen = [];
  let laufend = '';
  for (const wort of String(text).split(/\s+/).filter(Boolean)) {
    if (laufend === '') laufend = wort;
    else if (`${laufend} ${wort}`.length <= breite) laufend += ` ${wort}`;
    else { zeilen.push(laufend); laufend = wort; }
  }
  if (laufend !== '') zeilen.push(laufend);
  return zeilen.length ? zeilen : [''];
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
export function baueKundenanfrage({ rechnung, bezirk, betreiber = {}, datum = null, einheiten = {} }) {
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

  // **Gate 25, ab 3. September.** Der Mindestbestellwert wird hier nicht
  // nachgerechnet, sondern aus der Rechnung übernommen — dieselbe Begründung
  // wie beim Liefergebiet eine Zeile darüber: Eine zweite Grenze neben der
  // in `kundenWarenkorb` wäre die sicherste Art, beide auseinanderlaufen zu
  // lassen.
  //
  // Und er steht **vor** dem Text, nicht daneben: Ein fertiger Anfragetext
  // mit Beträgen, unter dem „das nehmen wir so nicht an" steht, ist ein
  // Angebot mit Widerruf in derselben Zeile.
  const mbw = rechnung.mindestbestellwert;
  if (mbw && !mbw.erfuellt) {
    return { moeglich: false, hindernis: mbw.grund, ...leer };
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
  const mehrere = rechnung.teillieferungen.length > 1;
  for (const [nr, teil] of rechnung.teillieferungen.entries()) {
    // **Gemessen am 30.08.:** Ein Korb aus zwei Lieferantensortimenten ergibt
    // zwei Teillieferungen — zwei Anfahrten, zwei Termine — und der Text
    // nannte nur eine Summe „Zustellung". Heute führt der Katalog nur einen
    // Lieferanten; mit der Artikelliste des Auftraggebers kommt der zweite.
    //
    // Genannt wird die Nummer, nicht der Lieferant: Geheim ist nicht die
    // Geschäftsbeziehung, geheim sind die Konditionen — dieselbe Grenze wie
    // in `oeffentlicherLieferant`.
    if (mehrere) {
      zeilen.push('');
      zeilen.push(`Lieferung ${nr + 1} von ${rechnung.teillieferungen.length}`);
    }
    for (const p of teil.positionen) {
      if (p.preisStand) preisstaende.add(p.preisStand);
      // Menge mit Komma und die lesbare Einheit. Bis zum 29.08. stand hier
      // `5.25 M2` — der Punkt aus JavaScript und das Kürzel aus dem Katalog.
      // Ein Text, der an einen Kunden geht, schreibt nicht in Datenbank-
      // schreibweise.
      const mengeText = String(p.menge).replace('.', ',');
      // **Gemessen am 30.08.:** 12 der 46 Artikel tragen einen Namen, der
      // länger ist als die Namensspalte — der längste hat 96 Zeichen. Bis
      // dahin lief er in die Artikelnummer hinein. Jetzt bricht der Name um;
      // Nummer und Beträge stehen auf der **letzten** seiner Zeilen, damit
      // die Spalten unter einander bleiben.
      const namenszeilen = anfrageUmbruch(p.bezeichnung, 44);
      const menge = anfrageSpalte(`${mengeText} ${einheiten[p.einheit] ?? p.einheit ?? 'Stk'}`, 14);
      // Menge zuerst, dann der Name; Nummer und Beträge stehen am Ende des
      // Blocks. So liest sich jede Position in der Reihenfolge, in der ein
      // Bauleiter sie prüft — wie viel, wovon, welche Nummer, was kostet es.
      namenszeilen.forEach((zeile, i) => {
        const vorne = i === 0 ? menge : anfrageSpalte('', 14);
        if (i < namenszeilen.length - 1) { zeilen.push(vorne + zeile); return; }
        zeilen.push(`${vorne}${anfrageSpalte(zeile, 44)}${anfrageSpalte(p.sku, 12)}`
          + `${anfrageSpalte(anfrageEuro(p.vkNetto), 11)}${anfrageEuro(p.zeilensummeNetto)}`);
      });
    }
  }

  zeilen.push('');
  zeilen.push('Summen (netto, Preise für Unternehmer)');
  zeilen.push('-------------------------------------');
  zeilen.push(`${anfrageSpalte('Warenwert', 22)}${anfrageEuro(rechnung.warenwertNetto)}`);
  if (mehrere) {
    // Jede Anfahrt einzeln, dann die Summe. Eine Frachtsumme ohne die
    // Aufteilung sieht aus wie ein Preis für eine Lieferung.
    for (const [nr, teil] of rechnung.teillieferungen.entries()) {
      zeilen.push(`${anfrageSpalte(`Zustellung ${nr + 1}`, 22)}${anfrageEuro(teil.frachtNetto)}`
        + `   ${teil.frachtGrund ?? ''}`.trimEnd());
    }
  }
  zeilen.push(`${anfrageSpalte(mehrere ? 'Zustellung gesamt' : 'Zustellung', 22)}${anfrageEuro(rechnung.frachtNetto)}`);
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
  if (mehrere) {
    // Der Satz gehört zur Anfrage und nicht in die Hinweise: Er sagt dem
    // Kunden etwas über seine Baustelle, nicht über eine Lücke im Werkzeug.
    zeilen.push(`Die Ware kommt in ${rechnung.teillieferungen.length} getrennten Lieferungen —`);
    zeilen.push('je Lieferung eine Anfahrt, und die Termine können auseinanderliegen.');
  }

  // **Ergänzt am 2. September.** Die unangenehme Zahl stand im Warenkorb und
  // fehlte in dem einen Papier, das den Shop verlässt. Die Wegprobe hat einen
  // fertigen Anfragetext über 1,19 € Ware und 75,50 € Zustellung gedruckt,
  // ohne ein Wort dazu — während dieselbe Rechnung auf der Warenkorbseite
  // ausdrücklich sagt: „Das lohnt sich für Sie nicht."
  //
  // > **Ein Hinweis, der nur auf der Seite steht, fehlt in dem Papier, das
  // > der Kunde verschickt.**
  //
  // Er steht hier absichtlich **vor** dem Preisstand und nicht unter den
  // Hinweisen: Was den Kunden Geld kostet, gehört in die Anfrage und nicht in
  // eine Fußnote über das Werkzeug.
  if (rechnung.frachtNetto > rechnung.warenwertNetto) {
    zeilen.push('Die Fracht kostet hier mehr als die Ware — das lohnt sich für Sie nicht.');
    zeilen.push('Bitte zusammenlegen oder die Kleinmenge vor Ort holen.');
  }

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
  /**
   * **Berichtigt am 3. September**, beim ersten Lauf dieser Funktion an einem
   * echten Anfragetext. `text.includes('3,68')` fand die Zahl in
   * `USt                   153,68 €` — und meldete den Einkaufspreis von
   * POS-52124, der in diesem Korb gar nicht vorkommt.
   *
   * > **Ein Fehlalarm, der bei jedem Lauf kommt, ist schlimmer als keine
   * > Prüfung:** Er bringt den Leser dazu, die Meldung zu überblättern — und
   * > mit ihr die echte.
   *
   * Gesucht wird deshalb die **ganze** Zahl: keine Ziffer und kein Trennzeichen
   * davor, keine Ziffer danach. Der zufällige Gleichstand zweier echter Beträge
   * bleibt möglich und ist auch gemeint — er heißt weiterhin „hier nachsehen".
   */
  const ganzeZahl = (z) => new RegExp(`(?<![\\d.,])${z.replace(',', '[,]')}(?!\\d)`);
  for (const a of artikelMitEk) {
    if (typeof a.ekNetto === 'number' && ganzeZahl(zahl(a.ekNetto)).test(text)) {
      treffer.push(`${a.sku}: die Zahl ${zahl(a.ekNetto)} ist sein Einkaufspreis und steht im Text`);
    }
  }
  for (const wort of ['Spanne', 'Marge', 'Rohertrag', 'Deckungsbeitrag', 'Einkaufspreis']) {
    if (new RegExp(wort, 'i').test(text)) treffer.push(`Das Wort „${wort}" steht im Text`);
  }
  return treffer;
}
