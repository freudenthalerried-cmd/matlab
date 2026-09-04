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
 * Der Befund je Bestellung: Taugt sie zu einem Angebot?
 *
 * @param {object[]} zeilen  aus `leseJournal`
 * @param {(daten: object) => {gueltig: boolean, fehler: string[]}} pruefe
 */
export function posteingangsbefund(zeilen, pruefe) {
  return zeilen.map((z) => {
    const p = pruefe({ ...z, land: z.land ?? 'AT' });
    const fehlt = [];
    if (!z.text || String(z.text).trim() === '') fehlt.push('kein Anfragetext');
    if (!z.bezirk) fehlt.push('kein Bezirk');
    return {
      nummer: z.nummer,
      zeitpunkt: z.zeitpunkt ?? null,
      firma: z.firma ?? null,
      bezirk: z.bezirk ?? null,
      bereit: p.gueltig && fehlt.length === 0,
      hindernisse: [...p.fehler, ...fehlt],
      eintrag: z,
    };
  });
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
