/**
 * Die Kennzahlen der PR-Beschreibung — und wie man sie nachmisst.
 *
 * ## Warum es diese Datei gibt
 *
 * Die Beschreibung von PR #14 ist das **Erste**, was der Auftraggeber liest.
 * Am 01.09. war sie an neun Stellen überholt:
 *
 * | stand dort | war |
 * |---|---|
 * | 616 Testfälle | 1.059 |
 * | 77 Seiten | 81 |
 * | 23 Gates, Stand 26.08. | 24 Gates, Stand 27.08. |
 * | 3 Systemlisten | 4 |
 * | Median 27 % unter Liste | 26 % |
 * | Kamin 8,79 € / Dämmung 6,48 € | 8,22 € / 5,91 € |
 * | „6 Suchkampagnen, importfertig" | 3 im ersten Anlauf, drei zurückgestellt |
 * | „Domain und Hosting" offen | bauversand.com bei All-Inkl entschieden |
 * | 11 Oberflächenszenarien | 11 plus 50 Shopszenarien |
 *
 * Keine dieser Zahlen war je falsch. Sie waren einmal richtig und sind es
 * nicht geblieben — dieselbe Bauart wie der Seitenfuß mit dem festen
 * „Vorschau ohne Bestellmöglichkeit": **eine Aussage ohne Quelle, die keinen
 * Anlass hat, sich zu ändern.**
 *
 * Ein Zahlenwerk, das nur beim Schreiben stimmt, ist ein Schaufenster mit
 * einem Preisschild von letztem Jahr.
 *
 * ## Wie geprüft wird
 *
 * Jede Kennzahl bringt ein **Muster mit genau einer Fanggruppe** mit. Der
 * Prüfer liest die Zahl **dort, wo sie steht**, und vergleicht sie mit einer
 * Messung am Verzeichnis. Findet ein Muster nichts, ist das ein **Fehler**
 * und kein Durchwinken: Wer den Satz umschreibt, in dem eine Zahl steht,
 * nimmt dem Prüfer den Anker — und eine Wache ohne Anker ist eine Vermutung.
 *
 * ## Genaue Zahlen und Untergrenzen
 *
 * Die meisten Kennzahlen stehen still: 46 Artikel, 24 Gates, 81 Seiten. Die
 * Zahl der Testfälle tut das nicht — sie hat sich an einem einzigen Vormittag
 * dreimal geändert. Eine Beschreibung, die dabei jedes Mal veraltet, macht
 * den Prüfer zum Dauerroten, und ein Dauerroter wird abgeschaltet.
 *
 * Deshalb zwei Arten:
 *
 * - `genau` — die Zahl im Text muss die gemessene sein.
 * - `mindestens` — der Text nennt eine runde Untergrenze („über 1.000"), und
 *   gemessen wird, dass sie **gilt**. Sie darf nicht überholt und nicht
 *   lächerlich niedrig sein: Wer bei 5.000 Testfällen „über 1.000" schreibt,
 *   sagt nichts Falsches und trotzdem nichts mehr. Ab dem Doppelten meldet
 *   der Prüfer, dass die Untergrenze nachgezogen gehört.
 *
 * ## Was er ausdrücklich nicht prüft
 *
 * Die Prosa. Der Prüfer hält die aufgezählten Kennzahlen fest, sonst nichts;
 * eine überholte Einschätzung findet er nicht. Das steht hier, damit ein
 * grüner Lauf nicht für mehr genommen wird, als er ist.
 *
 * ## Und eine Regel für die Messung selbst
 *
 * **Gemessen wird an der Quelle, aus der die Aussage stammt — nicht mit einer
 * eigenen Rechnung.** Am 01.09. hat dieser Prüfer den Median des
 * Listenpreisabstands selbst nachgerechnet (`vorteil()` je Artikel, sortiert,
 * Median) und **26** erhalten, während Startseite und Preistafel **26,7**
 * ausweisen: `vorteil()` rundet je Artikel auf ganze Prozent,
 * `katalogbefund()` rundet einmal am Ende. Der Prüfer bestätigte damit die
 * Zahl, die niemand sieht, und ließ die falsche in der Beschreibung stehen.
 *
 * > Ein Prüfer, der mit einer eigenen Rechnung misst, prüft seine Rechnung.
 *
 * Wo eine Messung nicht an der Quelle genommen werden kann, sagt `wie` es
 * ausdrücklich — siehe die beiden Browserproben unten.
 */

/** Eine Zahl aus dem Text — mit Beistrich als Dezimaltrennzeichen. */
export function zahlAus(text) {
  return Number(String(text).replace(/\./g, '').replace(',', '.'));
}

/**
 * @param {object} messwerte die am Verzeichnis gemessenen Werte
 * @returns {{name: string, muster: RegExp, soll: number, wie: string}[]}
 */
export function kennzahlen(messwerte) {
  const m = messwerte;
  return [
    { name: 'Artikel im Katalog', wie: 'data/katalog-baustoff.json',
      muster: /\*\*(\d+) echte Artikel\*\*/, soll: m.artikel },
    { name: 'Gebaute Seiten (Tabelle)', wie: 'ausgabe/site/**/*.html',
      muster: /\*\*(\d+) Seiten\*\* —/, soll: m.seiten },
    { name: 'Gebaute Seiten (Fließtext)', wie: 'ausgabe/site/**/*.html',
      muster: /\n(\d+) Seiten aus `npm run website`/, soll: m.seiten },
    { name: 'Artikelseiten', wie: 'ausgabe/site/artikel/', muster: /— (\d+) Artikel, \d+ Wissensseiten/, soll: m.artikelseiten },
    { name: 'Wissensseiten', wie: 'ausgabe/site/wissen/', muster: /, (\d+) Wissensseiten/, soll: m.wissen },
    { name: 'Systemlisten', wie: 'ausgabe/site/system/', muster: /, (\d+) Systemlisten/, soll: m.system },
    { name: 'Gruppenseiten', wie: 'ausgabe/site/gruppe/', muster: /, (\d+) Gruppen,/, soll: m.gruppen },
    { name: 'Rechtsseiten', wie: 'ausgabe/site/rechtliches/', muster: /, (\d+) Rechtsseiten/, soll: m.rechtliches },
    { name: 'Gates', wie: 'gate-register.md', muster: /\((\d+) Gates, Stand/, soll: m.gates },
    { name: 'Testfälle', wie: 'node --test', muster: /\*\*über ([\d.]+) Testfälle\*\*/,
      soll: m.tests, art: 'mindestens' },
    // **Gezählt in der Quelle, nicht aus dem Lauf gelesen.** Beide Proben
    // melden ihre Szenarienzahl selbst, aber jeder Lauf kostet einen
    // Chromium-Start je Szenario. Der Umfang wird deshalb hier abgezählt und
    // vom Prüfer der Prüfer gegen den echten Lauf gehalten (`--mit-browser`).
    // Die Grenze steht hier, damit niemand einen grünen Lauf für mehr nimmt,
    // als er ist.
    { name: 'Oberflächenszenarien', wie: 'Szenariennamen in bin/oberflaechenprobe.mjs (gezählt, nicht gelaufen)',
      muster: /(\d+) Oberflächenszenarien/, soll: m.oberflaeche },
    { name: 'Shopszenarien', wie: 'Szenariennamen in bin/shopprobe.mjs (gezählt, nicht gelaufen)',
      muster: /(\d+) Shopszenarien/, soll: m.shop },
    { name: 'Prüfer ohne Browser', wie: 'src/pruefregister.js', muster: /\*\*(\d+) Prüfer\*\* ohne Browser/, soll: m.pruefer },
    { name: 'Browserproben', wie: 'src/pruefregister.js', muster: /ohne Browser, (\d+) Browserproben/, soll: m.browserpruefer },
    { name: 'Feedeinträge', wie: 'npm run veroeffentlichung', muster: /\| (\d+) Einträge — \*\*nicht einreichbar/, soll: m.feed },
    { name: 'Artikel ohne GTIN (Tabelle)', wie: 'data/katalog-baustoff.json', muster: /GTIN fehlt bei allen (\d+) Artikeln/, soll: m.ohneGtin },
    { name: 'Artikel ohne GTIN (Liste)', wie: 'data/katalog-baustoff.json', muster: /\*\*GTIN je Artikel\*\* — bei allen (\d+) offen/, soll: m.ohneGtin },
    { name: 'Artikel unter Listenpreis', wie: 'katalogbefund().unterListe', muster: /(\d+) von \d+ Artikeln liegen unter dem Listenpreis/, soll: m.unterListe },
    { name: 'Median unter Liste', wie: 'katalogbefund().medianAbstandZurListe',
      muster: /im Median ([\d,]+) % darunter/, soll: m.medianVorteil },
    { name: 'Kampagnen im ersten Anlauf', wie: 'ausgabe/kampagne/kampagnen.csv', muster: /\*\*(\d+) im ersten Anlauf\*\*/, soll: m.anlauf },
    { name: 'Höchstgebot Kamin', wie: 'ausgabe/kampagne/anzeigengruppen.csv', muster: /Kamin ([\d,]+) €, Dämmung/, soll: m.cpcKamin },
    { name: 'Höchstgebot Dämmung', wie: 'ausgabe/kampagne/anzeigengruppen.csv', muster: /Dämmung ([\d,]+) €, WDVS/, soll: m.cpcDaemmung },
    { name: 'Höchstgebot WDVS', wie: 'ausgabe/kampagne/anzeigengruppen.csv', muster: /WDVS ([\d,]+) € gegen einen Markt/, soll: m.cpcWdvs },
    { name: 'Rekonstruierbare Einkaufspreise', wie: 'npm run pruefe-geheimnis', muster: /\*\*(\d+) von \d+ Einkaufspreisen\*\*/, soll: m.rekonstruierbar },
  ];
}

/**
 * Vergleicht die Zahlen im Text mit den Messwerten.
 *
 * Ein nicht gefundenes Muster ist ein eigener Befund („Anker weg"), keine
 * stillschweigend übersprungene Zeile.
 */
function meddung(meldungen, k, ist, grund) {
  meldungen.push({ art: 'veraltet', name: k.name, ist, soll: k.soll, grund });
}

export function pruefeSchaufenster(text, messwerte) {
  const liste = kennzahlen(messwerte);
  const meldungen = [];
  for (const k of liste) {
    if (k.soll === undefined || k.soll === null) {
      meldungen.push({ art: 'ungemessen', name: k.name, grund: `kein Messwert für „${k.name}" (${k.wie})` });
      continue;
    }
    const treffer = text.match(k.muster);
    if (!treffer) {
      meldungen.push({ art: 'anker', name: k.name,
        grund: `das Muster ${k.muster} findet in der Beschreibung nichts mehr` });
      continue;
    }
    const ist = zahlAus(treffer[1]);
    if (k.art === 'mindestens') {
      if (k.soll <= ist) {
        meddung(meldungen, k, ist, `die Beschreibung sagt „über ${treffer[1]}", gemessen sind nur ${k.soll} (${k.wie})`);
      } else if (k.soll >= ist * 2) {
        meddung(meldungen, k, ist, `die Untergrenze „über ${treffer[1]}" ist bei ${k.soll} nichtssagend geworden (${k.wie})`);
      }
      continue;
    }
    if (ist !== k.soll) {
      meldungen.push({ art: 'veraltet', name: k.name, ist, soll: k.soll,
        grund: `die Beschreibung sagt ${treffer[1]}, gemessen sind ${k.soll} (${k.wie})` });
    }
  }
  return { geprueft: liste.length, meldungen, sauber: meldungen.length === 0 };
}
