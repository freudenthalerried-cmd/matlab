/**
 * Stimmen die Zahlen, die in den offenen Punkten stehen?
 *
 * **Der Anlass, 8. September 2026.** `src/offenepunkte.js` sagt in seinem
 * eigenen Kopf, warum es das Modul gibt:
 *
 * > *Eine Liste, die von Hand fortgeschrieben wird, ist an dem Tag falsch, an
 * > dem jemand einen Punkt schließt und die Liste nicht anfasst. Deshalb
 * > dieselbe Bauart wie überall hier: Was ein Werkzeug weiß, wird gefragt.*
 *
 * Das gilt für die **Punkte**. Es gilt nicht für die **Sätze über die
 * Punkte** — und genau dort stehen Zahlen. Ein Punkt hieß am 8. September
 * *„Suchvolumen der 32 Keywords im Liefergebiet messen"*, während `npm run
 * messliste` seit dem 6. September **29** ausgibt: Zwei Begriffe hat die
 * Landeseite verneint, einen hat Gate 29 zurückgestellt.
 *
 * > **Die Liste fragte die Werkzeuge, welche Punkte offen sind. Was in den
 * > Punkten steht, hat sie selbst geschrieben.**
 *
 * Der Schaden ist nicht die Zahl. Der Schaden ist, dass der Auftraggeber eine
 * Aufgabe bekommt, die es so nicht mehr gibt: Er soll für 32 Begriffe
 * Suchvolumen holen, für drei davon steht keine Anzeige mehr.
 *
 * ## Und ein zweiter Fall in derselben Datei
 *
 * Zwei Punkte widersprachen einander. Der eine sagte, `npm run preiswechsel`
 * *finde* in acht mehrfach gekauften Artikeln keinen Preiswechsel — Gegenwart.
 * Der andere, drei Einträge weiter, sagte, dasselbe Werkzeug *messe seither
 * nichts*, weil die Rechnungspositionen beim Neuaufsetzen des Behälters
 * verlorengingen. Beides am selben Tag geschrieben, beides in derselben Liste.
 *
 * > **Ein Werkzeug, dem die Grundlage fehlt, findet nichts — es sucht nicht.**
 * > Ein Satz in der Gegenwartsform behauptet die Suche.
 *
 * Deshalb prüft dieses Modul zweierlei: die Zahlen gegen den Bestand, und
 * jeden genannten Befehl gegen die Frage, ob seine Grundlage überhaupt noch
 * da liegt.
 */

/** Ziffernfolgen im Fließtext — mit Tausenderpunkt und Dezimalkomma. */
export const ZAHLMUSTER = /(?<![\w,.])\d{1,3}(?:\.\d{3})*(?:,\d+)?(?![\w])/g;

/**
 * Die lebenden Zahlen: gemessen wird am Bestand, nicht an einer zweiten Liste.
 *
 * `wo` nennt den Punkt, in dem die Zahl stehen muss — sonst würde ein Muster,
 * das irgendwo im Text zufällig trifft, eine Zahl an ganz anderer Stelle
 * decken.
 */
export function kennzahlen(m) {
  return [
    {
      name: 'Zurückgerechnete Einkaufspreise', wo: 'einkaufspreise-belegen',
      wie: 'data/katalog-baustoff.json', muster: /\((\d+) sind zurückgerechnet\)/, soll: m.artikel,
    },
    {
      name: 'Artikel mit belegtem Gewicht', wo: 'palettenzahl',
      wie: 'data/katalog-baustoff.json (gewichtKg)',
      muster: /führt Gewicht für (\d+) von \d+ Artikeln/, soll: m.mitGewicht,
    },
    {
      name: 'Artikel im Katalog', wo: 'palettenzahl',
      wie: 'data/katalog-baustoff.json',
      muster: /führt Gewicht für \d+ von (\d+) Artikeln/, soll: m.artikel,
    },
    {
      name: 'Mindestbestellwert', wo: 'palettenzahl',
      wie: 'data/betreiber.json (mindestbestellwertNetto)',
      muster: /Mindestbestellwert \(Gate 25, (\d+) €\)/, soll: m.mindestbestellwert,
    },
    {
      name: 'Preisaltersgrenze', wo: 'preisrhythmus',
      wie: 'src/preisalter.js (GRENZE_TAGE)',
      muster: /gesetzt ist eine Grenze von (\d+)/, soll: m.grenzeTage,
    },
    {
      name: 'Preisaltersgrenze im Lösungssatz', wo: 'preisrhythmus',
      wie: 'src/preisalter.js (GRENZE_TAGE)',
      muster: /ob die (\d+)-Tage-Grenze/, soll: m.grenzeTage,
    },
    /*
     * **Die Zahl, wegen der es dieses Modul gibt.** Sie stand auf 32 und war
     * seit dem 6. September falsch. Der Punkt verweist selbst auf
     * `npm run messliste` — die Liste, aus der die Zahl käme, wenn jemand
     * fragte.
     */
    {
      name: 'Begriffe der Messliste', wo: 'suchvolumen',
      wie: 'ausgabe/messliste-baustoff.json (npm run messliste)',
      muster: /Suchvolumen der (\d+) Keywords/, soll: m.begriffe,
    },
  ];
}

/**
 * Zahlen, die **nicht** gegen den Bestand gehen — jede mit dem Grund.
 *
 * Ohne diese Liste hätte der Prüfer zwei Möglichkeiten, und beide wären
 * falsch: jede Zahl messen wollen (dann meldet er Gate-Nummern und
 * Datumsangaben) oder nur die gelisteten ansehen (dann wächst der Text
 * ungeprüft weiter). Die dritte ist ein Register mit Pflichtgrund.
 */
export const OHNE_MESSUNG = Object.freeze([
  /*
   * **Formen statt Ziffern — 11. September 2026.**
   *
   * Hier standen fünf Gate-Nummern als Ziffernfolgen: `['20','23','25','28','30']`.
   * Seither sind Gate 34 bis 37 entschieden worden, und drei von ihnen
   * standen in offenen Punkten — der Prüfer war damit seit dem 8. September
   * rot, und kein Commit hat das aufgehalten.
   *
   * > **Ein Freibrief, der auf eine Ziffernfolge lautet, muss jedem neuen
   * > Gate hinterhergetragen werden — und gilt außerdem für jede andere
   * > Zahl, die zufällig gleich aussieht.** „36" wäre ab heute auch als
   * > Kennzahl, Stückzahl oder Prozentsatz frei.
   *
   * Ein Eintrag nennt deshalb entweder `zahlen` (einzelne Beobachtungen, die
   * genau so dastehen) oder `form` — ein Muster, das die Zahl **mit ihrem
   * Hauptwort** liest. Die Form deckt nur, was auch wirklich eine Gate-Nummer,
   * ein Paragraph oder ein Tagesdatum ist.
   */
  Object.freeze({
    form: /\bGate (\d+)\b/g,
    warumOhneMessung: 'Gate-Nummern. Sie bezeichnen eine Entscheidung und ändern sich nie — '
      + 'dass es das Gate gibt und was es sagt, misst npm run pruefe-gates gegen das '
      + 'Register, und zwar in beide Richtungen. Gedeckt ist nur die Zahl hinter dem Wort '
      + '„Gate"; dieselbe Ziffernfolge als Kennzahl bleibt meldepflichtig.',
  }),
  Object.freeze({
    form: /(?:§+|\bArt\.)\s*(\d+)/g,
    warumOhneMessung: 'Paragraphen- und Artikelnummern. Sie bezeichnen eine Rechtsnorm — § 132 '
      + 'BAO, § 11 UStG, § 377 UGB, Art. 28 DSGVO. Was in ihnen steht, misst kein Werkzeug '
      + 'dieses Hauses, und ändern würde sie nur der Gesetzgeber. Gedeckt ist nur die Zahl '
      + 'hinter dem Zeichen — die 28 aus Art. 28 war bis heute zufällig gedeckt, weil es auch '
      + 'ein Gate 28 gibt, und das ist kein Grund, sondern ein Zusammentreffen.',
  }),
  Object.freeze({
    form: /\b(\d{1,2})\.\s?(?:Jänner|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b/g,
    warumOhneMessung: 'Tagesdaten. Ein Datum ist die Aussage darüber, wann etwas festgestellt '
      + 'wurde; es gegen den heutigen Bestand zu halten hieße, die Vergangenheit für falsch zu '
      + 'erklären. Gedeckt ist nur der Tag vor einem Monatsnamen.',
  }),
  Object.freeze({
    zahlen: ['2', '8', '08'],
    warumOhneMessung: 'Tagesnummern ohne Monatsnamen, wie sie in Kurzschreibweisen stehen '
      + '(„08.09."). Sie fallen nicht unter die Form darüber, weil dort der Monatsname fehlt — '
      + 'und einzeln geführt zu werden ist besser, als das Datumsmuster so weit zu machen, '
      + 'dass es jede zweistellige Zahl deckt.',
  }),
  Object.freeze({
    zahlen: ['44'],
    warumOhneMessung: 'Der Befund vom 30. August: 44 der 46 Einkaufspreise ergeben sich aus '
      + 'Verkaufspreis und Zielmarge, zwei nicht, weil sie am Listendeckel hängen. Die Zahl '
      + 'gehört zu jener Messung, nicht zum heutigen Katalog — sie würde sich mit dem '
      + 'Deckel ändern und nicht mit der Artikelzahl.',
  }),
  Object.freeze({
    zahlen: ['32'],
    warumOhneMessung: 'Beobachtete Tage zwischen zwei Käufen desselben Artikels, gemessen am '
      + '30. August an den Rechnungspositionen. Die Grundlage dafür ist seit dem 8. September '
      + 'verloren; die Beobachtung bleibt, was sie war, und ist deshalb festgeschrieben und '
      + 'nicht mehr nachzumessen.',
  }),
  Object.freeze({
    zahlen: ['1.934', '322', '50', '96,50', '22,50', '7,50', '2,00', '13,47', '7', '22', '46'],
    warumOhneMessung: 'Beträge und Stückzahlen von genau zwei belegten Lieferungen — sechs '
      + 'Paletten auf einem Beleg, die Spanne der Kranentladung auf beiden, die '
      + 'Palettennebenkosten aus einer Gutschrift. Es sind Einzelbeobachtungen, ausdrücklich '
      + 'als solche geschrieben („aus einem Punkt lässt sich keine Regel ziehen"); eine '
      + 'Messung am heutigen Bestand gäbe es dafür nicht.',
  }),
  // **Gestrichen am 11. September 2026.** Hier stand ein Freibrief für den
  // HTTP-Status 403, mit dem der Netzausgang die Crawler-Dokumentation
  // abweist. Der Punkt `google-extended` nennt die Zahl nicht mehr, seit er
  // am 10. September neu geschrieben wurde — der Prüfer hat das als
  // `eintrag-ohne-zahl` gemeldet und damit recht gehabt. Ein Freibrief für
  // eine Zahl, die nirgends steht, deckt nur noch die nächste, die zufällig
  // gleich aussieht.
]);

/**
 * Befehle, deren Grundlage außerhalb des Verzeichnisses liegt.
 *
 * Ein Text darf sie nennen — aber nicht in der Gegenwartsform behaupten, sie
 * würden gerade etwas finden, wenn ihre Grundlage fehlt.
 */
export const WERKZEUGE_MIT_GRUNDLAGE = Object.freeze([
  Object.freeze({
    befehl: 'npm run preiswechsel',
    braucht: 'preise/poschacher-positionen.csv',
    warum: 'Der Preisrhythmus ergibt sich aus Rechnungspositionen mit Datum. Die Datei ging '
      + 'am 8. September beim Neuaufsetzen des Behälters verloren und lässt sich aus keiner '
      + 'Ausgabe zurückrechnen.',
  }),
  Object.freeze({
    befehl: 'npm run pruefe-gebinde',
    braucht: 'preise/poschacher-positionen.csv',
    warum: 'Achtzehn Artikel gegen fakturierte Mengen — ohne die Positionen ist hier nichts '
      + 'zu messen, und ein grüner Lauf über nichts wäre eine Lüge.',
  }),
]);

/** Wörter, mit denen ein Satz zugibt, dass gerade nichts gemessen wird. */
const ZUGEGEBEN = /misst seither nichts|weigert|nicht messbar|verloren|fehlt|nicht mehr/;

/**
 * @param {object} lage
 * @param {{id: string, text: string}[]} lage.punkte
 * @param {object} lage.messwerte
 * @param {(pfad: string) => boolean} lage.gibtEs   liegt eine Grundlage da?
 * @param {boolean} [lage.vollstaendig]  ob `punkte` die ganze Liste ist
 *
 * `vollstaendig` entscheidet über die **zweite Richtung**: Ein Freibrief, zu
 * dem keine Zahl mehr steht, ist nur dann ein Fund, wenn wirklich alle Punkte
 * vorliegen. Über einem Ausschnitt wäre dieselbe Meldung eine Aussage über den
 * Ausschnitt — und damit falsch.
 */
export function punktebefund({ punkte, messwerte, gibtEs, vollstaendig = false }) {
  const meldungen = [];
  const tafel = kennzahlen(messwerte);
  const gedeckt = new Map(punkte.map((p) => [p.id, new Set()]));
  const nachId = new Map(punkte.map((p) => [p.id, p.text]));

  for (const k of tafel) {
    const text = nachId.get(k.wo);
    if (text === undefined) {
      meldungen.push({
        regel: 'punkt-fehlt',
        text: `„${k.name}" misst im Punkt ${k.wo} — den gibt es nicht mehr`,
      });
      continue;
    }
    const treffer = text.match(k.muster);
    if (!treffer) {
      meldungen.push({
        regel: 'muster-trifft-nicht',
        text: `„${k.name}": das Muster findet im Punkt ${k.wo} keine Zahl — `
          + 'der Satz wurde umgeschrieben, und das Muster gehört mit',
      });
      continue;
    }
    gedeckt.get(k.wo).add(treffer[1]);
    const gelesen = Number(treffer[1].replace(/\./g, '').replace(',', '.'));
    if (gelesen !== k.soll) {
      meldungen.push({
        regel: 'zahl-veraltet',
        text: `„${k.name}" im Punkt ${k.wo}: der Text sagt ${treffer[1]}, gemessen sind ${k.soll} (${k.wie})`,
      });
    }
  }

  const erlaubt = new Set(OHNE_MESSUNG.flatMap((e) => e.zahlen ?? []));
  const formen = OHNE_MESSUNG.filter((e) => e.form);
  // Was eine Form deckt, hangt am Text des einzelnen Punktes: `Gate 36` deckt
  // die 36 dort, wo sie hinter dem Wort steht, und nirgends sonst.
  const durchForm = (text) => {
    const gefunden = new Set();
    for (const e of formen) for (const t of text.matchAll(e.form)) gefunden.add(t[1]);
    return gefunden;
  };
  for (const p of punkte) {
    const ausForm = durchForm(p.text);
    for (const t of p.text.match(ZAHLMUSTER) ?? []) {
      if (gedeckt.get(p.id).has(t) || erlaubt.has(t) || ausForm.has(t)) continue;
      meldungen.push({
        regel: 'zahl-ohne-eintrag',
        text: `Im Punkt ${p.id} steht die Zahl ${t}, die weder gemessen wird noch einen `
          + 'Grund hat, warum nicht',
      });
    }
  }

  for (const w of WERKZEUGE_MIT_GRUNDLAGE) {
    if (gibtEs(w.braucht)) continue;
    for (const p of punkte) {
      if (!p.text.includes(w.befehl)) continue;
      if (ZUGEGEBEN.test(p.text)) continue;
      meldungen.push({
        regel: 'werkzeug-misst-nichts-mehr',
        text: `Der Punkt ${p.id} nennt ${w.befehl}, als würde es messen — ${w.braucht} `
          + 'liegt nicht da, und der Befehl weigert sich seither',
      });
    }
  }

  /*
   * **Die Gegenrichtung, jetzt auch fuer die Formen.** Ein Freibrief, den
   * nichts mehr braucht, deckt nur noch die naechste Zahl, die zufaellig
   * gleich aussieht — am 11. September stand genau so einer fuer den
   * HTTP-Status 403 da, dessen Punkt ihn seit einem Tag nicht mehr nannte.
   */
  for (const e of vollstaendig ? OHNE_MESSUNG : []) {
    if (e.form) {
      if (punkte.some((p) => e.form.test(p.text))) continue;
      meldungen.push({
        regel: 'eintrag-ohne-zahl',
        text: `die Form ${e.form} trifft in keinem offenen Punkt mehr, hat aber weiter einen Freibrief`,
      });
      continue;
    }
    for (const z of e.zahlen) {
      if (punkte.some((p) => (p.text.match(ZAHLMUSTER) ?? []).includes(z))) continue;
      meldungen.push({
        regel: 'eintrag-ohne-zahl',
        text: `${z} steht in keinem offenen Punkt mehr, hat aber weiter einen Freibrief`,
      });
    }
  }

  /*
   * **Jeder Eintrag nennt genau eines von beiden und einen Grund.** Ohne
   * diese Zeilen waere ein Eintrag ohne `zahlen` und ohne `form` still: Er
   * deckte nichts, meldete nichts und saehe aus wie eine Entscheidung.
   */
  for (const e of OHNE_MESSUNG) {
    if (!e.form === !e.zahlen) {
      meldungen.push({
        regel: 'freibrief-ohne-gegenstand',
        text: `Ein Eintrag in OHNE_MESSUNG nennt ${e.form ? 'beides' : 'weder zahlen noch form'}`,
      });
    }
    if (!e.warumOhneMessung || e.warumOhneMessung.length < 80) {
      meldungen.push({
        regel: 'freibrief-ohne-grund',
        text: `Ein Eintrag in OHNE_MESSUNG traegt keinen tragfaehigen Grund`,
      });
    }
  }

  return { geprueft: tafel.length, meldungen, sauber: meldungen.length === 0 };
}
