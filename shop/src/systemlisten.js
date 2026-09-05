/**
 * Halten die Stücklisten, was sie über sich selbst sagen?
 *
 * **Der Anlass, 5. September 2026.** Vier Systemlisten sind der inhaltliche
 * Kern dieses Shops: Sie beantworten „was muss ich bestellen, um X zu bauen",
 * und ihre These steht auf einer eigenen Wissensseite — *was fehlt, hält die
 * Baustelle auf*. Deshalb führen sie auch die Positionen, die dieses Haus
 * **nicht** liefert, und sagen das dazu.
 *
 * Nachgezählt hielt eine davon ihre eigene Auskunft nicht:
 *
 * > `kellerwand-perimeter` versprach im Vorspann **„fünf davon aus unserem
 * > Sortiment"** und schrieb zwanzig Zeilen weiter **„Drei der sieben
 * > Positionen führen wir nicht"**. Fünf und vier — dieselbe Seite, zwei
 * > Zahlen.
 *
 * Die fünfte war der **obere Abschluss**, den die Tabelle als „nicht im
 * Sortiment" führt und der zugleich unter „wird oft vergessen" steht. **Die
 * Zusammenfassung versprach genau die Position, die die Liste als fehlend
 * kennzeichnet.**
 *
 * Dazu zwei Formfehler: Die Fassadenliste erklärte ihre nicht geführte
 * Position in einem eigenen Abschnitt, kennzeichnete sie aber nicht in der
 * Tabelle wie die drei anderen Listen; und die Kellerwandliste behauptete,
 * alle drei seien gekennzeichnet, während nur eine es war.
 *
 * ## Was hier geprüft wird
 *
 * Nur, was die Seite **über sich selbst** sagt — nicht, ob die Liste
 * fachlich vollständig ist. Das entscheidet kein Prüfer.
 *
 *   `zahl-widerspricht`     eine Positionszahl im Text gegen die Tabelle
 *   `nicht-gefuehrt-zahl`   „drei der sieben führen wir nicht" gegen die
 *                           Kennzeichnungen in der Tabelle
 *   `sku-gibt-es-nicht`     ein Artikel der Kopfzeile fehlt im Katalog
 *   `keine-position`        eine Liste ohne Positionstabelle
 *   `alles-fremd`           keine einzige lieferbare Position
 */

/** Zahlwörter, wie sie in diesen Texten vorkommen. */
export const ZAHLWORT = Object.freeze({
  eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7,
  acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12,
});

/** Die Kennzeichnung, mit der eine Position als **gar nicht** lieferbar dasteht. */
export const NICHT_GEFUEHRT = /\(nicht im Sortiment\)/;

/**
 * Jede andere Klammer der Form „(nicht …)" — eine **Einschränkung**.
 *
 * **Der Unterschied ist am 5. September teuer geworden.** Ich hatte die
 * Fassadenliste für formal unsauber gehalten, weil sie ihre Position 2 nicht
 * mit *(nicht im Sortiment)* kennzeichnete wie die drei anderen Listen, und
 * die Kennzeichnung nachgetragen. Ein Testfall vom 30. August hat es in
 * derselben Minute abgewiesen:
 *
 * > *fassade-100-qm.md Position 2 „Dämmplatten": als nicht geführt
 * > gekennzeichnet, aber im Katalog*
 *
 * Und er hatte recht. Dämmplatten führt dieses Haus sehr wohl — **nur nicht
 * in Flächenstärke**, und genau das erklärt die Seite in einem eigenen
 * Abschnitt. Ein „nicht im Sortiment" hätte den Kunden von einer Ware
 * weggeschickt, die es gibt.
 *
 * > **Eine Kennzeichnung, die zu viel behauptet, ist so falsch wie eine, die
 * > fehlt** — und die falsche Richtung ist die teurere.
 */
export const EINGESCHRAENKT = /\(nicht (?!im Sortiment\))[^)]+\)/;

const zahl = (wort) => ZAHLWORT[String(wort).toLowerCase()] ?? Number(wort);

/**
 * Liest aus einer Systemliste, was sie über sich behauptet.
 *
 * @param {string} text  der Markdown-Quelltext
 */
export function liesSystemliste(text) {
  const zeilen = [...text.matchAll(/^\| (\d+) \| (.+?) \|(.*)$/gm)]
    .map((m) => ({ nr: Number(m[1]), position: m[2], rest: m[3] }));

  const skuZeile = /^skus:\s*(.+)$/m.exec(text);
  const skus = skuZeile
    ? skuZeile[1].split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // „Sieben Positionen bilden …" / „Zehn Positionen bilden …"
  const gesamt = [...text.matchAll(/\b([A-Za-zÄÖÜäöüß]+|\d+) Positionen bilden\b/g)]
    .map((m) => ({ wort: m[1], wert: zahl(m[1]) }));

  // „Drei der sieben Positionen führen wir nicht" / „Eine der zehn Positionen
  // führen wir nicht" — beide Zahlen zählen.
  const nichtGefuehrt = [...text.matchAll(
    /\b([A-Za-zÄÖÜäöüß]+|\d+) (?:der|von) (?:den )?([A-Za-zÄÖÜäöüß]+|\d+) Positionen führen wir nicht/g,
  )].map((m) => ({ anzahl: zahl(m[1]), gesamt: zahl(m[2]) }));

  return {
    positionen: zeilen.length,
    ohneSortiment: zeilen.filter((z) => NICHT_GEFUEHRT.test(z.position)).length,
    eingeschraenkt: zeilen.filter((z) => EINGESCHRAENKT.test(z.position)).length,
    skus,
    gesamtaussagen: gesamt,
    nichtGefuehrtAussagen: nichtGefuehrt,
  };
}

/**
 * Der Befund über eine Liste.
 *
 * @param {string} name
 * @param {object} gelesen  aus `liesSystemliste`
 * @param {Set<string>} katalogSkus
 */
export function listenbefund(name, gelesen, katalogSkus) {
  const meldungen = [];
  const sag = (regel, text) => meldungen.push({ regel, datei: name, text: `${name}: ${text}` });

  if (gelesen.positionen === 0) {
    sag('keine-position', 'keine Positionstabelle gefunden');
    return { meldungen, lieferbar: 0 };
  }

  for (const a of gelesen.gesamtaussagen) {
    if (a.wert !== gelesen.positionen) {
      sag('zahl-widerspricht',
        `der Text sagt „${a.wort} Positionen", die Tabelle hat ${gelesen.positionen}`);
    }
  }

  for (const a of gelesen.nichtGefuehrtAussagen) {
    if (a.gesamt !== gelesen.positionen) {
      sag('zahl-widerspricht',
        `„von ${a.gesamt} Positionen", die Tabelle hat ${gelesen.positionen}`);
    }
    if (a.anzahl !== gelesen.ohneSortiment) {
      sag('nicht-gefuehrt-zahl',
        `der Text sagt ${a.anzahl} nicht geführte Position(en), gekennzeichnet sind ${gelesen.ohneSortiment}`);
    }
  }

  for (const sku of gelesen.skus) {
    if (!katalogSkus.has(sku)) sag('sku-gibt-es-nicht', `${sku} steht in der Kopfzeile und nicht im Katalog`);
  }

  const lieferbar = gelesen.positionen - gelesen.ohneSortiment;
  // Eine Liste, von der nichts lieferbar ist, ist ein Merkblatt und keine
  // Stückliste — und der Shop verspricht auf jeder von ihnen das Gegenteil.
  if (lieferbar <= 0) sag('alles-fremd', 'keine einzige lieferbare Position');
  if (gelesen.skus.length === 0) sag('ohne-artikel', 'nennt keinen einzigen Artikel');

  return { meldungen, lieferbar };
}

/** Der Befund über alle Listen. */
export function systemlistenbefund(listen, katalogSkus, mindestens = 3) {
  const meldungen = [];
  for (const l of listen) meldungen.push(...listenbefund(l.name, l.gelesen, katalogSkus).meldungen);
  // Ein Lauf über eine Liste ist grün und sagt nichts.
  if (listen.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-listen',
      datei: null,
      text: `nur ${listen.length} Systemlisten gefunden, erwartet mindestens ${mindestens}`,
    });
  }
  return {
    listen: listen.length,
    positionen: listen.reduce((n, l) => n + l.gelesen.positionen, 0),
    nichtGefuehrt: listen.reduce((n, l) => n + l.gelesen.ohneSortiment, 0),
    meldungen,
    sauber: meldungen.length === 0,
  };
}
