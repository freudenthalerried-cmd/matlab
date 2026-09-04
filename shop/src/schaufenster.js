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
  const liste = [
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
    // Die Zahl der Begriffe ist seit dem 2. September Leitzahl. Sie stand in
    // elf Stellen und wurde in keiner gepflegt: Am 1. September fiel „Kaminkopf
    // Regenhaube" aus der Kampagne, und aus 33 wurden 32 — in einer Datei.
    { name: 'Begriffe der Messliste', wie: 'ausgabe/messliste-baustoff.json',
      muster: /\*\*(\d+) Begriffe\*\* in 3 Anzeigengruppen/, soll: m.keywords },
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
    // **Aufgenommen am 1. September.** Die vierundzwanzig Kennzahlen davor
    // messen Seitenzahlen, Testfälle, Gebote und GTIN-Lücken — und **nicht die
    // Zahl, um die es geht.** Der nötige Monatsumsatz stand in der Tabelle der
    // Beschreibung, ungemessen, seit es diese Beschreibung gibt.
    //
    // > Ein Prüfer, der alles misst außer der Leitzahl, meldet grün über ein
    // > Geschäftsmodell, das er nie angesehen hat.
    //
    // Gefunden hat es die Kennzahlenseite: Sie rechnete 43.395,77 € aus
    // `zielgroessen.json` (Zahlweg `eps`), während überall 45.356 € steht —
    // die Karte-Rechnung vom 25.08., zwei Tage älter als Gate 21, das EPS und
    // Vorkasse entschieden hat.
    { name: 'Nötiger Monatsumsatz', wie: 'noetigerUmsatz(zielgroessen, ziel.zahlweg), auf ganze Euro',
      muster: /nötiger Monatsumsatz \| [\d.]+ € \| \*\*([\d.]+) €\*\*/, soll: m.noetigerUmsatz },
    { name: 'Bestellungen im Monat', wie: 'noetigerUmsatz(zielgroessen, ziel.zahlweg)',
      muster: /Bestellungen im Monat \| \d+ \| (\d+) \|/, soll: m.bestellungen },
    { name: 'Fragen an den Lieferanten', wie: 'src/lieferantenanfrage.js — FRAGEN',
      muster: /\*\*(\d+) Fragen an den Lieferanten\*\*/, soll: m.lieferantenfragen },
    { name: 'Mindestbestellwert', wie: 'data/betreiber.json — Gate 25',
      muster: /\*\*(\d+) € netto Warenwert je Lieferung\*\*/, soll: m.mindestbestellwert },
    // **Nachgetragen am 3. September.** Die Beschreibung nannte die
    // Etappenzahl als **Wort** („zwölf Etappen") — und ein Wort findet dieses
    // Muster nicht. Sie war überholt, sobald eine dreizehnte Etappe dazukam,
    // und kein Prüfer hätte es gesagt. Seither steht die Zahl als Ziffer da.
    { name: 'Etappen des Rolloutplans', wie: 'npm run rollout',
      muster: /Kette aus (\d+) Etappen/, soll: m.etappen },
    { name: 'Tage bis zur Entscheidung', wie: 'npm run rollout',
      muster: /Wie lange bis zur Entscheidung: (\d+) Tage/, soll: m.rollouttage },
  ];

  // **Die Zahl, die diese Prüfung über sich selbst nennt.** Die Beschreibung
  // sagt, wie viele Kennzahlen hier gemessen werden — und genau dieser Satz
  // war am 3.9. der einzige überholte in der Datei: „26 Kennzahlen" bei 27
  // Einträgen. Ein Prüfer, der jede Zahl im Text hält außer der über sich
  // selbst, hat eine blinde Stelle in der Mitte.
  //
  // `liste.length + 1` zählt diesen Eintrag mit, denn er ist einer — und seit
  // dem 4. September auch die **Aussagen**: Der Prüfer meldet sie in derselben
  // Summe, also muss die Zahl in der Beschreibung sie mitzählen. Ohne diese
  // Ergänzung hätte die selbstbezügliche Zahl die zwei neuen Prüfungen
  // verschwiegen — an genau der Stelle, die es gibt, damit nichts unbemerkt
  // aus der Prüfung fällt.
  liste.push({
    name: 'Kennzahlen dieser Prüfung', wie: 'src/schaufenster.js — die Liste selbst',
    muster: /misst ihre (\d+) Kennzahlen gegen den Bestand/,
    soll: liste.length + 1 + aussagen(messwerte).length,
  });
  return liste;
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

/**
 * Die **Aussagen** der Beschreibung — nicht ihre Zahlen.
 *
 * **Der Anlass, 4. September 2026, Abend.** Nach sechs Runden Bestellweg
 * stand in der Beschreibung weiter: *„Der Shop nimmt keine Bestellung
 * entgegen, sondern erzeugt Anfragen."* Alle 32 Kennzahlen stimmten dabei.
 *
 * > **Ein Zahlenwerk, das stimmt, macht aus einem überholten Satz keinen
 * > richtigen.** Die Zahlen wurden gemessen, weil sie sich leicht messen
 * > lassen; der Satz daneben sagt mehr über den Shop als jede von ihnen.
 *
 * Jede Aussage hier ist **entscheidbar** — aus demselben Bestand, den auch
 * `npm run startklar` liest. Was sich nicht entscheiden lässt, gehört nicht
 * in diese Liste, sondern bleibt ungemessener Fließtext; eine Aussage mit
 * erfundener Messung wäre schlimmer als keine.
 *
 * `gilt` ist der Zustand, `wenn` der Satz, der dann dastehen muss, und
 * `sonst` der, der dann **nicht** dastehen darf.
 */
export function aussagen(messwerte) {
  return [
    {
      name: 'Bestellweg gebaut',
      wie: 'src/bestellweg.js gegen die ausgelieferte Oberfläche (npm run startklar)',
      gilt: messwerte.bestellwegGebaut,
      wenn: /Bestellweg/,
      sonst: /nimmt keine Bestellung entgegen/,
      erklaerung: 'Seit Gate 26 gibt es Empfangsskript, Formular und Ablage. Ein Satz, der '
        + 'das Gegenteil sagt, steht vor allem anderen in der Beschreibung.',
    },
    {
      name: 'Bestellweg eingeschaltet',
      wie: 'data/betreiber.json über bestellwegAktiv()',
      gilt: messwerte.bestellwegAktiv,
      wenn: /Bestellungen werden entgegengenommen/,
      sonst: /gebaut und ausgeschaltet/,
      erklaerung: 'Gebaut und eingeschaltet sind zwei Zustände. Wer sie verwechselt, verspricht '
        + 'dem Leser einen Shop, der Bestellungen annimmt, während das Empfangsskript nicht '
        + 'einmal ausgeliefert wird.',
    },
  ];
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
  /**
   * **Und die Aussagen.** Sie kommen nach den Zahlen, weil sie seltener sind
   * und schwerer wiegen: Eine überholte Zahl kostet Glaubwürdigkeit, ein
   * überholter Satz kostet eine Entscheidung.
   */
  const saetze = aussagen(messwerte);
  for (const a of saetze) {
    if (a.gilt === undefined || a.gilt === null) {
      meldungen.push({ art: 'ungemessen', name: a.name, grund: `kein Messwert für „${a.name}" (${a.wie})` });
      continue;
    }
    const soll = a.gilt ? a.wenn : a.sonst;
    const darfNicht = a.gilt ? a.sonst : a.wenn;
    if (!soll.test(text)) {
      meldungen.push({ art: 'aussage-fehlt', name: a.name,
        grund: `die Beschreibung sagt nicht, was gilt (${a.erklaerung})` });
    }
    if (darfNicht.test(text)) {
      meldungen.push({ art: 'aussage-ueberholt', name: a.name,
        grund: `die Beschreibung sagt noch ${darfNicht} — ${a.erklaerung}` });
    }
  }

  return { geprueft: liste.length + saetze.length, meldungen, sauber: meldungen.length === 0 };
}
