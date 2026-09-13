/**
 * Was ein Leser des öffentlichen Verzeichnisses ausrechnen kann.
 *
 * Die Einkaufskonditionen liegen in `preise/`, und `.gitignore` deckt den
 * Ordner. Der Kommentar dort nennt den Grund: *„Die Rabattsätze, die ein
 * Lieferant einem Baumeister einräumt, sind dessen Geschäftsgeheimnis und
 * zugleich die Verhandlungsposition des Auftraggebers."*
 *
 * **Die Regel schützt die Datei. Sie schützt nicht die Angabe.**
 *
 * Im Verzeichnis stehen die Verkaufspreise (die gehören dorthin, es ist ein
 * Shop) und die Zielmarge (die steht in einem Dutzend Dokumenten). Aus
 * beidem folgt der Einkaufspreis in einem Schritt:
 *
 *     Einkauf = Verkauf × (1 − Marge)
 *
 * Dieses Modul rechnet nach, wie weit das trägt. Es liest dafür **nicht**
 * die vertrauliche Datei — es rechnet aus dem, was jeder sehen kann, und
 * vergleicht nur dann, wenn die Datei örtlich vorhanden ist. Ein Prüfer,
 * der zum Prüfen das Geheimnis braucht, ist als Prüfer eines öffentlichen
 * Verzeichnisses wertlos.
 */

/** Rekonstruktion aus einem veröffentlichten Verkaufspreis und der Marge. */
export function rekonstruiereEinkauf(vkNetto, marge) {
  if (!(vkNetto > 0)) throw new Error('Verkaufspreis muss positiv sein');
  if (!(marge > 0 && marge < 1)) throw new Error('Marge muss zwischen 0 und 1 liegen');
  return Math.round(vkNetto * (1 - marge) * 100) / 100;
}

/**
 * Vergleicht Rekonstruktion und Wirklichkeit — je Artikel.
 *
 * `getroffen` heißt: auf den Cent. Nicht „ungefähr". Ein Lieferant, der die
 * eigene Kalkulation auf zwei Nachkommastellen im Netz findet, liest keine
 * Schätzung, sondern seine eigene Rechnung.
 *
 * @param {Array<{sku: string, vkNetto: number, ekNetto: number}>} artikel
 * @param {number} marge
 * @param {number} toleranzEuro
 */
export function rekonstruierbarkeit(artikel, marge, toleranzEuro = 0.01) {
  const zeilen = artikel
    .filter((a) => a.vkNetto > 0 && a.ekNetto > 0)
    .map((a) => {
      const rekonstruiert = rekonstruiereEinkauf(a.vkNetto, marge);
      const abweichung = Math.round(Math.abs(rekonstruiert - a.ekNetto) * 100) / 100;
      return { sku: a.sku, vkNetto: a.vkNetto, ekNetto: a.ekNetto, rekonstruiert, abweichung,
        getroffen: abweichung <= toleranzEuro + 1e-9 };
    });

  const getroffen = zeilen.filter((z) => z.getroffen);
  return {
    geprueft: zeilen.length,
    getroffen: getroffen.length,
    verfehlt: zeilen.filter((z) => !z.getroffen),
    anteil: zeilen.length ? getroffen.length / zeilen.length : 0,
    zeilen,
  };
}

/**
 * Muster, die einen **unmittelbaren** Abfluss anzeigen — nicht die Rechnung,
 * sondern die Angabe selbst in einer Datei, die mitgeliefert wird.
 *
 * Bewusst grob, wie alle Prüfer dieses Vorhabens: Was er meldet, ist ein
 * Verdacht. Ein Feldname allein ist keiner — `einkaufNetto` steht
 * berechtigterweise im Rechenkern, der damit rechnet. Gemeldet wird erst der
 * Feldname **mit einer Zahl daneben**, denn dann ist es ein Wert und keine
 * Rechengröße.
 */
// Das `(?<![.\w])` davor ist kein Feinschliff: Ohne es traf die Regel die
// Zeile `t.warenwertNetto / t.einkaufNetto : 1;` — der Doppelpunkt kam aus
// einem Bedingungsausdruck, nicht aus einer Zuweisung. Ein Prüfer, der
// Rechenschritte für Werte hält, meldet den Rechenkern und nicht das Leck.
export const ABFLUSSMUSTER = Object.freeze([
  { name: 'Einkaufspreis mit Wert', muster: /(?<![.\w])"?(ekNetto|einkaufNetto|einkaufspreis)"?\s*[:=]\s*-?\d/i },
  { name: 'Händlerrabatt mit Wert', muster: /(?<![.\w])"?(haendlerrabattAufUvp|haendlerrabatt|rabattsatz)"?\s*[:=]\s*-?[\d.]/i },
  { name: 'Skontobasis mit Wert', muster: /(?<![.\w])"?(skontobasis|skontofaehig)"?\s*[:=]\s*-?\d/i },
]);

/** Sucht die Abflussmuster in einem Text und meldet Zeile und Fundstelle. */
export function findeAbfluss(text, name = '') {
  const treffer = [];
  text.split(/\r?\n/).forEach((zeile, i) => {
    for (const m of ABFLUSSMUSTER) {
      if (m.muster.test(zeile)) {
        treffer.push({ name, zeile: i + 1, art: m.name, auszug: zeile.trim().slice(0, 90) });
      }
    }
  });
  return treffer;
}

/* ------------------------------------------------------------------ *
 * Was in der Auslieferung nichts zu suchen hat — 5. September 2026
 *
 * Die drei Durchgänge oben suchen **Werte**: den Einkaufspreis selbst, seine
 * Rekonstruktion, den Schlüssel dazu. Sie haben zwei Dinge nie gesucht, die
 * in `ausgabe/website.html` seit dem ersten Bau standen:
 *
 *   - „Kreditkarte (EU-Karte, **Listenpreis Stripe**)" — der interne Name aus
 *     der Kostentabelle, ausgeliefert auf der AGB-Seite;
 *   - „Eine Frei-Haus-Schwelle **ab 1500 €** misst am Bestellwert" — eine
 *     Schranke auf unserem Wareneinsatz, ausgeliefert in `shop.js`.
 *
 * Keines von beiden ist ein Einkaufspreis. Beide sagen etwas über einen.
 *
 * > **Eine Schranke auf einer geheimen Zahl ist eine Aussage über die geheime
 * > Zahl — und ein interner Name ist eine Aussage über die Kostenseite.**
 *
 * Das Register wird in beide Richtungen gehalten: `findeInterneWoerter` sucht
 * die Einträge in der Ausgabe, und `registerbefund` hält sie gegen die
 * Quelle, aus der sie stammen. Ein Eintrag, dessen Anlass verschwunden ist,
 * ist eine Regel, die grün bleibt, weil sie nichts mehr prüft.
 * ------------------------------------------------------------------ */

/**
 * @param {Array<{wort: string, warum: string}>} interneWoerter  aus `zahlung.js`
 * @param {Array<number>} schwellen  Frei-Haus-Schwellen aus `lieferanten.json`
 */
export function ausgabemuster(interneWoerter, schwellen) {
  const muster = interneWoerter.map((w) => ({
    name: `interner Name „${w.wort}"`,
    warum: w.warum,
    muster: new RegExp(w.wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
  }));

  // Die Schwelle **in Gesellschaft eines Frachtworts**, nie als nackte Zahl:
  // 600 allein ist eine Menge Millimeter, 1200 eine Menge Artikelnummern. Der
  // erste Wurf ohne diese Klammer meldete 41 Fundstellen, davon keine echte —
  // und ein Prüfer mit 41 falschen Meldungen wird abgeschaltet, dann meldet
  // er auch die echte nicht mehr.
  for (const s of [...new Set(schwellen.filter((x) => x != null))]) {
    muster.push({
      name: `Frei-Haus-Schwelle ${s} neben einem Frachtwort`,
      warum: 'Sie misst am Bestellwert, also am Einkauf. Zusammen mit einer Frachtzeile von '
        + '0,00 € und dem ausgewiesenen Warenwert ergibt sie eine Obergrenze der Handelsspanne.',
      muster: new RegExp(
        `(frei[- ]?Haus|frachtfrei|Fracht|Bestellwert)[^<>\\n]{0,60}${s}`
        + `|${s}[^<>\\n]{0,60}(frei[- ]?Haus|frachtfrei|Fracht|Bestellwert)`, 'i'),
    });
  }

  return muster;
}

/**
 * Fundstellen, die bleiben — mit dem Grund, warum sie bleiben dürfen.
 *
 * **Der eine Fall.** Die Kasse liefert ihre Zahlwege als Datensatz aus, und
 * darin steht die Programmkennung `karte-stripe` als Wert des Auswahlfelds.
 * Sie muss es: Was der Kunde anklickt, kommt in seinem Anfragetext zurück und
 * wird dort wieder einem Eintrag in `zahlung.js` zugeordnet.
 *
 * Die Grenze zieht `shopkern.js` seit dem 30. August in einem Satz, der auch
 * hier gilt:
 *
 * > **Geheim ist nicht die Geschäftsbeziehung, geheim sind die Konditionen.**
 *
 * Dass wir einen Kartenabwickler vorhaben, sagt der Kasse ohnehin jeder
 * Kartenknopf. Was nicht hinausgeht, ist der Satz, den er kostet, und dass er
 * unverhandelt ist. Der Name im Anzeigetext ist deshalb weg, die Kennung im
 * Datenfeld bleibt.
 *
 * Das Verzeichnis wird in beide Richtungen gehalten: `teileFunde` meldet einen
 * Eintrag, der **nichts mehr trifft** — sonst steht hier in einem Monat eine
 * Ausnahme für eine Stelle, die es nicht mehr gibt.
 */
export const HINGENOMMEN = Object.freeze([
  Object.freeze({
    art: /Stripe/,
    auszug: /"id"\s*:\s*"karte-stripe"/,
    warum: 'Die Programmkennung im Auswahlfeld der Kasse. Sie geht mit der Anfrage zurück '
      + 'und wird dort wieder zugeordnet; ein Kundenwort an dieser Stelle wäre eine zweite '
      + 'Zuordnungstabelle. Sie nennt die Geschäftsbeziehung, nicht die Kondition.',
  }),
]);

/**
 * Trennt die Funde in offene und hingenommene — und meldet leerlaufende
 * Einträge des Verzeichnisses.
 */
export function teileFunde(funde, hingenommen = HINGENOMMEN) {
  const gedeckt = new Set();
  const offen = [];

  for (const f of funde) {
    const eintrag = hingenommen.find((h) => h.art.test(f.art) && h.auszug.test(f.auszug));
    if (eintrag) gedeckt.add(eintrag);
    else offen.push(f);
  }

  const leerlaufend = hingenommen.filter((h) => !gedeckt.has(h));
  const duenn = hingenommen.filter((h) => !h.warum || h.warum.length < 80);

  return {
    offen,
    hingenommen: funde.length - offen.length,
    leerlaufend,
    duenn,
    sauber: offen.length === 0 && leerlaufend.length === 0 && duenn.length === 0,
  };
}

/** Sucht die Ausgabemuster in einem Text und meldet Zeile und Fundstelle. */
export function findeInterneWoerter(text, muster, name = '') {
  const treffer = [];
  text.split(/\r?\n/).forEach((zeile, i) => {
    for (const m of muster) {
      const t = zeile.match(m.muster);
      if (!t) continue;
      const von = Math.max(0, t.index - 50);
      treffer.push({
        name,
        zeile: i + 1,
        art: m.name,
        auszug: zeile.slice(von, t.index + t[0].length + 50).replace(/\s+/g, ' ').trim(),
      });
    }
  });
  return treffer;
}

/**
 * Steht ein Einkaufspreis im **Verzeichnis** statt in der Ausgabe?
 *
 * **Der Anlass, 8. September 2026.** Nach dem Verlust der Preisdatei wurde
 * nach einer zweiten Quelle gesucht — und eine gefunden, im eigenen
 * Verzeichnis: `rekonstruierbare-einkaufspreise.md` führte eine Tabelle
 * „rekonstruiert / tatsächlich / daneben" mit den **tatsächlichen**
 * Einkaufspreisen zweier Artikel.
 *
 * Ausgerechnet in dem Dokument, das davor warnt, dass 44 von 46
 * Einkaufspreisen aus den veröffentlichten Verkaufspreisen zurückzurechnen
 * sind, standen die **zwei**, die es nicht sind.
 *
 * > **Der Prüfer sah in die Ausgabe. Das Verzeichnis ist genauso öffentlich.**
 *
 * Gesucht wird nicht nach Mustern, sondern nach den **Zahlen selbst**: Jeder
 * Einkaufspreis der Preisdatei wird im Text gesucht, und gemeldet wird nur,
 * was in Sichtweite eines Einkaufsworts steht. Ein Betrag allein ist kein
 * Fund — 0,60 € kann alles sein.
 *
 * @param {object} eingabe
 * @param {Map<string, number>} eingabe.einkaufJeSku
 * @param {Map<string, string>} eingabe.dateien  Pfad → Text
 * @param {number} [eingabe.sichtweite] Zeichen um den Betrag herum
 */
export const EINKAUFSWORTE = /Einkauf|EK\b|eingekauft|tatsächlich|Einstand|Kondition/i;

export function verzeichnisbefund({ einkaufJeSku, dateien, sichtweite = 60 }) {
  const meldungen = [];
  const betraege = new Map();
  for (const [sku, ek] of einkaufJeSku) {
    if (typeof ek !== 'number' || !(ek > 0)) continue;
    // Nur die Schreibweise, in der Beträge hier stehen: „0,60 €".
    const text = `${ek.toFixed(2).replace('.', ',')} €`;
    if (!betraege.has(text)) betraege.set(text, []);
    betraege.get(text).push(sku);
  }

  for (const [datei, inhalt] of dateien) {
    for (const [betrag, skus] of betraege) {
      let ab = inhalt.indexOf(betrag);
      while (ab !== -1) {
        /*
         * **Der Betrag muss vorne zu Ende sein.** Der erste Anlauf meldete
         * „5,70 €" in `1.775,70 €` und „4,88 €" in `324,88 €` — vier
         * Fehlalarme aus vier Teilzeichenketten. Ein Prüfer, der Erlöse für
         * Einkaufspreise hält, wird nach dem zweiten Mal abgeschaltet.
         */
        const davor = ab === 0 ? '' : inhalt[ab - 1];
        const angewachsen = /[\d.,]/.test(davor);
        const umfeld = inhalt.slice(Math.max(0, ab - sichtweite), ab + betrag.length + sichtweite);
        if (!angewachsen && EINKAUFSWORTE.test(umfeld)) {
          meldungen.push({
            regel: 'einkaufspreis-im-verzeichnis',
            datei,
            text: `${datei} nennt ${betrag} in Sichtweite eines Einkaufsworts — das ist der `
              + `Einkaufspreis von ${skus.join(', ')}, und dieses Verzeichnis ist öffentlich`,
          });
          break;
        }
        ab = inhalt.indexOf(betrag, ab + 1);
      }
    }
  }

  return {
    dateien: dateien.size,
    betraege: betraege.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
