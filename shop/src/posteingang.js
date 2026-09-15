/**
 * Was mit einer eingegangenen Bestellung geschehen kann.
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg steht: Der Kunde klickt,
 * `bestellung.php` nimmt entgegen, das Journal wächst um eine Zeile. Und
 * `npm run vorgang` macht daraus ein Angebot — aus einer **Datei mit dem
 * Anfragetext** und einer **Datei mit den Kundendaten**.
 *
 * > **Zwischen der Zeile im Journal und diesen beiden Dateien liegt nichts.**
 * > Der Betreiber müsste sie von Hand herausschneiden — genau die Sorte
 * > Abtipparbeit, gegen die `npm run anfrage-lesen` am 3. September gebaut
 * > wurde, nur eine Stufe später.
 *
 * Dieses Modul ist die Zange dazwischen. Es entscheidet nichts und rechnet
 * nichts nach; es liest die Zeilen, sagt, welche zu einem Angebot taugen, und
 * schneidet auf Verlangen die zwei Dateien heraus.
 *
 * ## Warum es die Bestelldaten prüft, aber nicht die Positionen
 *
 * Ob aus einer Zeile ein Beleg werden kann, hängt an den **Kundendaten** —
 * und die prüft `pruefeBestelldaten`, dieselbe Funktion, die `npm run vorgang`
 * anwendet. Ob die **Positionen** stimmen, prüft `leseAnfrage` gegen den
 * Katalog, und das gehört dorthin, wo der Beleg entsteht: Eine zweite
 * Nachrechnung hier hieße zwei Rechnungen über denselben Warenkorb.
 */

/** Ein Journal aus Zeilen lesen — streng, mit Zeilennummer im Fehler. */
export function leseJournal(inhalt) {
  const zeilen = [];
  const meldungen = [];
  const nummern = new Set();

  String(inhalt ?? '').split('\n').forEach((roh, i) => {
    if (!roh.trim()) return;
    let eintrag;
    try {
      eintrag = JSON.parse(roh);
    } catch (e) {
      meldungen.push({ regel: 'zeile-unlesbar', text: `Zeile ${i + 1}: ${e.message}` });
      return;
    }
    if (!eintrag.nummer) {
      meldungen.push({ regel: 'ohne-nummer', text: `Zeile ${i + 1}: kein Feld „nummer"` });
      return;
    }
    // **Eine doppelte Nummer ist ein Befund, kein Sortierproblem.** Das
    // Empfangsskript vergibt sie unter Sperre; stehen zwei gleiche da, ist
    // entweder zweimal angehängt worden oder jemand hat die Datei bearbeitet.
    if (nummern.has(eintrag.nummer)) {
      meldungen.push({ regel: 'nummer-doppelt', text: `${eintrag.nummer} steht mehrfach im Journal` });
    }
    nummern.add(eintrag.nummer);
    zeilen.push({ ...eintrag, zeile: i + 1 });
  });

  return { zeilen, meldungen };
}

/**
 * Die Vorgangsnummer zu einer Bestellnummer: `B-2026-0001` → `2026-0001`.
 *
 * Sie steht seit dem 4. September in der Empfehlung dieses Werkzeugs
 * (`--nummer ${nummer.replace(/^B-/, '')}`) und war bis heute nirgends als
 * Regel aufgeschrieben. Eine Zuordnung, die nur in einer Zeichenkette einer
 * Bildschirmausgabe steht, lässt sich nicht prüfen.
 */
export function vorgangsnummerZu(bestellnummer) {
  return String(bestellnummer ?? '').replace(/^B-/, '');
}

/**
 * Der Befund je Bestellung: Taugt sie zu einem Angebot — **und ist sie es
 * schon geworden?**
 *
 * **Der Fund vom 12. September 2026, abends.** Dieses Werkzeug las das
 * Posteingangsjournal und sonst nichts. Das Journal wächst nur; jede
 * eingegangene Bestellung steht für immer darin, und jede stand hier für
 * immer als „angebotsreif".
 *
 * Gemessen an einem Probejournal aus zwei Bestellungen, von denen die erste
 * längst Angebot, Auftragsbestätigung und Rechnung hat:
 *
 * ```
 * Posteingang — 2 Bestellungen, 2 davon angebotsreif
 *   ✓ B-2026-0001  …  ✓ B-2026-0002  …
 * Zum Weiterarbeiten:
 *   npm run posteingang -- --nummer B-2026-0001 …
 * ```
 *
 * > **Die Bestellung, die fertig ist, war die, die das Werkzeug vorschlug** —
 * > und zwar an jedem Tag danach wieder, weil es immer die erste Zeile nimmt.
 *
 * Wer dem folgt, bekommt ein zweites Angebot über dieselbe Ware, unter einer
 * zweiten Vorgangsnummer, an denselben Kunden. Beide Papiere sind für sich
 * tadellos; keine Sperre in `vorgang.mjs` sieht etwas, denn dort ist es der
 * erste Vorgang dieser Nummer.
 *
 * Die Auskunft, die fehlte, liegt in der **Vorgangsablage**: `B-2026-0001`
 * wird zu Vorgang `2026-0001`, und zu jedem abgelegten Papier steht dort eine
 * Zeile. Gezählt werden Papiere, gelesen wird kein Inhalt.
 *
 * @param {object[]} zeilen  aus `leseJournal`
 * @param {(daten: object) => {gueltig: boolean, fehler: string[]}} pruefe
 * @param {object} [lage]
 * @param {object[]} [lage.vorgaenge]  die Einträge der Vorgangsablage
 */
export function posteingangsbefund(zeilen, pruefe, { vorgaenge = [] } = {}) {
  const papiereJeVorgang = new Map();
  for (const e of vorgaenge) {
    if (!e?.vorgang) continue;
    papiereJeVorgang.set(e.vorgang, (papiereJeVorgang.get(e.vorgang) ?? 0) + 1);
  }

  return zeilen.map((z) => {
    const p = pruefe({ ...z, land: z.land ?? 'AT' });
    const fehlt = [];
    if (!z.text || String(z.text).trim() === '') fehlt.push('kein Anfragetext');
    if (!z.bezirk) fehlt.push('kein Bezirk');
    const bereit = p.gueltig && fehlt.length === 0;
    const vorgang = vorgangsnummerZu(z.nummer);
    const papiere = papiereJeVorgang.get(vorgang) ?? 0;
    return {
      nummer: z.nummer,
      zeitpunkt: z.zeitpunkt ?? null,
      firma: z.firma ?? null,
      bezirk: z.bezirk ?? null,
      bereit,
      // `bereit` sagt, ob die **Angaben** taugen; `offen` sagt, ob noch etwas
      // zu tun ist. Zwei Fragen, die bis heute eine waren.
      vorgang,
      papiere,
      bearbeitet: papiere > 0,
      offen: bereit && papiere === 0,
      hindernisse: [...p.fehler, ...fehlt],
      eintrag: z,
    };
  });
}

/**
 * Die Gegenrichtung: Vorgänge der Ablage, zu denen keine Bestellung im
 * Posteingang steht.
 *
 * **Das ist kein Fehler, sondern eine Auskunft.** Die Betriebskette führt den
 * telefonischen Auftrag ausdrücklich als Weg — wer anruft, steht in keinem
 * Posteingangsjournal. Gemeldet wird es trotzdem: Sind es plötzlich viele,
 * ist entweder das Journal unvollständig heruntergeladen oder es wurde von
 * Hand angelegt, was der Kette nach nicht vorgesehen ist.
 */
export function vorgaengeOhneBestellung(zeilen, vorgaenge = []) {
  const ausDemPosteingang = new Set(zeilen.map((z) => vorgangsnummerZu(z.nummer)));
  const gefunden = new Set();
  for (const e of vorgaenge) {
    if (e?.vorgang && !ausDemPosteingang.has(e.vorgang)) gefunden.add(e.vorgang);
  }
  return [...gefunden].sort();
}

/**
 * Die Kundendatei, die `npm run vorgang --kunde` erwartet.
 *
 * **Nur die Felder, die dorthin gehören.** Die Bestellnummer, der Zeitpunkt
 * und der Anfragetext stehen im Journal und im Anfragetext; sie ein zweites
 * Mal in die Kundendatei zu schreiben hieße, zwei Orte für dieselbe Angabe zu
 * führen — und einer davon altert.
 */
export function kundendatei(eintrag, felder) {
  const daten = {};
  for (const f of felder) {
    if (eintrag[f.name] !== undefined) daten[f.name] = eintrag[f.name];
  }
  // `land` steht in keinem Formularfeld: Der Shop bedient nur Österreich, und
  // die Prüfung verlangt die Angabe. Sie ist eine Folgerung, keine Eingabe.
  daten.land = eintrag.land ?? 'AT';
  return daten;
}
