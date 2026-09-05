/**
 * Prüft dieser Prüfer das Erzeugnis von heute?
 *
 * **Der Anlass, 4. September 2026, Mittag.** `npm run alles` meldete 26 von 26
 * grün. Unmittelbar danach weigerten sich beide Browserproben, überhaupt zu
 * starten:
 *
 * ```
 * Abbruch: ausgabe/website.html ist älter als 3 Quelldatei(en) — zuerst npm run website.
 *   src/pruefregister.js, src/rechtstexte.js, src/ungerufen.js
 * ```
 *
 * Die Weigerung ist richtig. Sie steht seit dem 29. August in `shopprobe.mjs`
 * und `oberflaechenprobe.mjs`, und zwar weil an dem Tag eine Probe gegen eine
 * `demo.html` lief, die zu ihrem Quelltext nicht mehr passte — grün, während
 * das Skript der neu gebauten Seite beim Laden starb.
 *
 * > **Fünf weitere Prüfer lesen dasselbe Erzeugnis und haben diese Weigerung
 * > nicht.** `pruefe-seiten`, `pruefe-crawler`, `pruefe-datenschutz`,
 * > `pruefe-dubletten` und `pruefe-geheimnis` fragen, **ob** `ausgabe/site`
 * > da ist. Nicht, ob es das ist, was die Quelle heute sagt.
 *
 * Am teuersten ist dabei `pruefe-geheimnis`: Er misst, ob aus den
 * veröffentlichten Verkaufspreisen die Einkaufspreise zurückzurechnen sind.
 * Über einem veralteten Erzeugnis meldet er das über die Seiten von gestern.
 *
 * Dieselbe Familie wie der Impressumspunkt vom Vormittag: **Anwesend ist nicht
 * dasselbe wie richtig.** Hier: vorhanden ist nicht dasselbe wie aktuell.
 *
 * ## Warum ein Register und nicht fünf Kopien
 *
 * Die beiden vorhandenen Prüfungen sind Kopien voneinander — dieselbe
 * Quellenliste, derselbe Text, zwei Fassungen. Eine sechste Kopie wäre eine
 * sechste Stelle, an der die Quellenliste altert. Deshalb steht hier, welches
 * Erzeugnis aus welchen Quellen entsteht, und daneben, **wer es liest**. Ein
 * Werkzeug, das `ausgabe/` anfasst und nicht im Register steht, ist der Fund.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Die Erzeugnisse und woraus sie entstehen.
 *
 * `quellordner` wird zur Laufzeit aufgelistet — eine fest eingetragene
 * Dateiliste wäre am Tag der nächsten neuen Quelldatei still veraltet, und
 * still veraltete Listen sind der Grund, warum es dieses Register gibt.
 */
export const ERZEUGNISSE = Object.freeze({
  'ausgabe/site': Object.freeze({
    baubefehl: 'npm run website',
    quellordner: Object.freeze([['src', '.js'], ['data', '.json']]),
    quelldateien: Object.freeze(['bin/website.mjs', 'shop-ui.js']),
  }),
  'ausgabe/website.html': Object.freeze({
    baubefehl: 'npm run website',
    quellordner: Object.freeze([['src', '.js'], ['data', '.json']]),
    quelldateien: Object.freeze(['bin/website.mjs', 'shop-ui.js']),
  }),
  'demo.html': Object.freeze({
    baubefehl: 'npm run build',
    quellordner: Object.freeze([['src', '.js'], ['data', '.json']]),
    quelldateien: Object.freeze(['demo-template.html', 'build-demo.mjs', 'shop-ui.js']),
  }),
  'ausgabe/kampagne': Object.freeze({
    baubefehl: 'npm run kampagne',
    quellordner: Object.freeze([['src', '.js'], ['data', '.json']]),
    quelldateien: Object.freeze(['bin/kampagne.mjs']),
  }),
});

/**
 * Wer ein Erzeugnis liest — und wer ausdrücklich ohne Frischeprüfung auskommt.
 *
 * `warumOhnePruefung` ist Pflicht, wo `erzeugnis` fehlt. Ein Werkzeug, das
 * `ausgabe/` anfasst und keines von beidem trägt, ist genau der Fall, den
 * `leserbefund` melden soll.
 */
export const LESER = Object.freeze([
  Object.freeze({ werkzeug: 'bin/inhaltspruefung.mjs', erzeugnis: 'ausgabe/site' }),
  Object.freeze({ werkzeug: 'bin/crawlerpruefung.mjs', erzeugnis: 'ausgabe/site' }),
  Object.freeze({ werkzeug: 'bin/datenschutzpruefung.mjs', erzeugnis: 'ausgabe/site' }),
  Object.freeze({ werkzeug: 'bin/dublettenpruefung.mjs', erzeugnis: 'ausgabe/site' }),
  // **Ergänzt am 5. September.** Sie hält seither auch die gebauten Flächen
  // gegen die Einstufung: Sagt llms.txt "palettiert", muss dort stehen, woher
  // die Einstufung kommt. Gegen eine Fläche von gestern zu prüfen hieße, die
  // Auskunft von gestern für heute grün zu melden.
  Object.freeze({ werkzeug: 'bin/sperrgutpruefung.mjs', erzeugnis: 'ausgabe/site' }),
  Object.freeze({ werkzeug: 'bin/geheimnispruefung.mjs', erzeugnis: 'ausgabe/site' }),
  Object.freeze({ werkzeug: 'bin/shopprobe.mjs', erzeugnis: 'ausgabe/website.html' }),
  Object.freeze({ werkzeug: 'bin/wegprobe.mjs', erzeugnis: 'ausgabe/website.html' }),
  Object.freeze({ werkzeug: 'bin/werbeprobe.mjs', erzeugnis: 'ausgabe/kampagne' }),
  Object.freeze({ werkzeug: 'bin/oberflaechenprobe.mjs', erzeugnis: 'demo.html' }),
  Object.freeze({
    werkzeug: 'bin/website.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Es **erzeugt** die Ausgabe. Ein Bauwerkzeug, das sich weigert zu '
      + 'bauen, weil das Gebaute veraltet ist, käme nie wieder aus dieser Lage heraus.',
  }),
  Object.freeze({
    werkzeug: 'bin/gegenprobenlauf.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Er baut selbst neu, wo ein Eintrag `baueVorher` trägt, und macht das '
      + 'Erzeugnis zwischendurch absichtlich falsch. Eine Frischeprüfung würde hier genau das '
      + 'melden, was die Probe gerade tut.',
  }),
  Object.freeze({
    werkzeug: 'bin/erzeugnispruefung.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Er **ist** die Frischeprüfung. Sein Befund über ein veraltetes '
      + 'Erzeugnis ist ein Hinweis und kein Abbruch: Rot wird er über das Register, also '
      + 'darüber, ob ein Leser ohne Weigerung liest — nicht darüber, wann zuletzt gebaut wurde.',
  }),
  Object.freeze({
    werkzeug: 'bin/gesamtlauf.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Er ruft die Prüfer, statt selbst zu lesen. Die Weigerung gehört '
      + 'dorthin, wo gemessen wird — sonst stünde sie einmal zu früh und einmal zu spät.',
  }),
  Object.freeze({
    werkzeug: 'bin/kennzahlen.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Es schreibt eine Übersicht in `ausgabe/`, es liest dort nichts. '
      + 'Wer nur schreibt, kann nichts Veraltetes messen.',
  }),
  Object.freeze({
    werkzeug: 'bin/kampagne.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Es schreibt die Anzeigendateien nach `ausgabe/kampagne/` und liest '
      + 'die gebauten Seiten nicht — seine eigene Frischeprüfung gilt den Warenkörben, nicht '
      + 'dem Erzeugnis der Website.',
  }),
  Object.freeze({
    werkzeug: 'bin/messliste.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Schreibt die Messliste nach `ausgabe/`, liest von dort nichts.',
  }),
  Object.freeze({
    werkzeug: 'bin/preisabgleich.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Er hält die vier **Ausgaben** gegeneinander und gegen die Quelle — '
      + 'das Veraltetsein einer davon ist sein Befund und nicht sein Abbruchgrund.',
  }),
  Object.freeze({
    werkzeug: 'bin/veroeffentlichung.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Es baut den Produktfeed aus dem Katalog, nicht aus den Seiten.',
  }),
  Object.freeze({
    werkzeug: 'bin/offenepunkte.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Es fasst zusammen, was andere Werkzeuge melden, und liest deren '
      + 'Ausgabe — nicht das Erzeugnis.',
  }),
  Object.freeze({
    werkzeug: 'bin/preisalterpruefung.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Sie misst das Alter der **Einkaufspreise** gegen den Kalender. Mit '
      + 'dem gebauten Erzeugnis hat sie nichts zu tun.',
  }),
  /**
   * **Zwei Werkzeuge lesen das Erzeugnis und weigern sich ausdrücklich nicht.**
   * `weigertSich: false` sagt das: Für sie ist ein veralteter Stand der
   * **Befund**, nicht der Abbruchgrund — die Seitenzahl ist ihr Messwert, und
   * der Prüferprüfer misst, was die anderen melden.
   *
   * Sie stehen trotzdem mit `erzeugnis` da, und das ist der Zweck des Feldes:
   * `bin/gegenprobenlauf.mjs` baut vor **jedem** Erzeugnisleser neu. Ohne den
   * Eintrag meldeten ihre Gegenproben „war schon vorher rot" und
   * beschuldigten damit Prüfer, die nichts falsch gemacht haben — genau der
   * Fehler, den der Läufer beim ignorierten `baueVorher` schon einmal gemacht
   * hat.
   */
  Object.freeze({
    werkzeug: 'bin/schaufensterpruefung.mjs',
    erzeugnis: 'ausgabe/site',
    weigertSich: false,
    warumOhnePruefung: 'Sie hält die Kennzahlen der PR-Beschreibung gegen den Bestand. Wo sie '
      + 'gebaute Seiten zählt, ist deren Zahl der Messwert — ein veraltetes Erzeugnis wäre '
      + 'genau die Abweichung, die sie melden soll, und kein Grund abzubrechen.',
  }),
  Object.freeze({
    werkzeug: 'bin/rahmenzensus.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Er zählt die Rahmen der Quelltexte, nicht die der gebauten Seiten.',
  }),
  Object.freeze({
    werkzeug: 'bin/leitzahlpruefung.mjs',
    erzeugnis: null,
    warumOhnePruefung: 'Sie liest den Fließtext des Verzeichnisses. Die gebauten Seiten kommen '
      + 'nur als Fundort vor, und eine abgelöste Zahl darin ist ein Befund, kein Abbruchgrund.',
  }),
  Object.freeze({
    werkzeug: 'bin/prueferpruefung.mjs',
    erzeugnis: 'ausgabe/site',
    weigertSich: false,
    warumOhnePruefung: 'Sie befragt die Prüfer und liest deren Ausgabe. Weigert sich einer '
      + 'wegen eines veralteten Erzeugnisses, ist das ihr Messwert und nicht ihr Abbruch.',
  }),
]);

/**
 * Welche Quellen sind jünger als das Erzeugnis?
 *
 * **Stand bis zum 4. September in `src/buendel.js`.** Ihr Anlass: Am 29.08.
 * bekam `rechtstexte.js` eine Abhängigkeit, die das Bündel zerriss — und
 * niemand merkte es, weil `demo.html` seit dem 28.08. nicht neu gebaut worden
 * war. Die Oberflächenprobe lief grün gegen eine Datei, die zu ihrem
 * Quelltext nicht mehr passte.
 *
 * Bewusst ohne Dateizugriff: Sie bekommt Zeitstempel und gibt Namen zurück.
 * Damit lässt sie sich prüfen, ohne Dateien anzulegen.
 */
export function juengereQuellen(zielZeit, quellen) {
  return quellen.filter((q) => q.zeit > zielZeit).map((q) => q.name);
}

/**
 * Der Frischebefund eines Erzeugnisses, gelesen von der Platte.
 *
 * @param {string} wurzel  das Verzeichnis `shop/`
 * @param {string} name    ein Schlüssel aus `ERZEUGNISSE`
 */
export function frischebefund(wurzel, name) {
  const e = ERZEUGNISSE[name];
  if (!e) throw new Error(`Unbekanntes Erzeugnis: ${name}`);

  const ziel = join(wurzel, name);
  let zielZeit;
  try {
    zielZeit = statSync(ziel).mtimeMs;
  } catch {
    return { name, baubefehl: e.baubefehl, fehlt: true, juenger: [], frisch: false };
  }

  const quellen = [];
  for (const [ordner, endung] of e.quellordner) {
    for (const d of readdirSync(join(wurzel, ordner))) {
      if (!d.endsWith(endung)) continue;
      quellen.push({ name: `${ordner}/${d}`, zeit: statSync(join(wurzel, ordner, d)).mtimeMs });
    }
  }
  for (const d of e.quelldateien) {
    quellen.push({ name: d, zeit: statSync(join(wurzel, d)).mtimeMs });
  }

  const juenger = juengereQuellen(zielZeit, quellen);
  return { name, baubefehl: e.baubefehl, fehlt: false, juenger, frisch: juenger.length === 0 };
}

/**
 * Der Abbruchtext — **eine** Fassung für alle.
 *
 * Bis heute stand er zweimal im Bestand, in zwei Schreibweisen. Zwei Fassungen
 * desselben Satzes sind eine Fassung, die niemand pflegt.
 */
export function abbruchtext(befund) {
  if (befund.fehlt) {
    return [`Abbruch: ${befund.name} fehlt — zuerst ${befund.baubefehl}.`];
  }
  return [
    `Abbruch: ${befund.name} ist älter als ${befund.juenger.length} Quelldatei(en)`
      + ` — zuerst ${befund.baubefehl}.`,
    `  ${befund.juenger.slice(0, 5).join(', ')}${befund.juenger.length > 5 ? ' …' : ''}`,
    'Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.',
  ];
}

/**
 * Hält das Register gegen die Wirklichkeit — in beide Richtungen.
 *
 * @param {{name: string, text: string}[]} dateien  die Werkzeuge, Quelltext ohne Kommentare
 */
export function leserbefund(dateien, leser = LESER) {
  const meldungen = [];
  const gefuehrt = new Map(leser.map((l) => [l.werkzeug, l]));

  for (const l of leser) {
    // Ein Eintrag braucht seinen Grund, sobald er **nicht** selbst weigert —
    // gleich ob er gar kein Erzeugnis führt oder eines mit `weigertSich: false`.
    if (l.weigertSich === false || !l.erzeugnis) {
      if (!l.warumOhnePruefung || l.warumOhnePruefung.length < 60) {
        meldungen.push({
          regel: 'ohne-grund',
          text: `${l.werkzeug} weigert sich nicht und nennt keinen tragfähigen Grund dafür`,
        });
      }
    }
    if (l.erzeugnis && !ERZEUGNISSE[l.erzeugnis]) {
      meldungen.push({
        regel: 'unbekanntes-erzeugnis',
        text: `${l.werkzeug} nennt „${l.erzeugnis}", und das führt ERZEUGNISSE nicht`,
      });
    }
    const datei = dateien.find((d) => d.name === l.werkzeug);
    if (!datei) {
      meldungen.push({
        regel: 'werkzeug-gibt-es-nicht',
        text: `${l.werkzeug} steht im Register und liegt nicht (mehr) im Bestand`,
      });
      continue;
    }
    // **Vom Eintrag aus, nicht vom Wort `ausgabe` aus.** Der erste Wurf prüfte
    // diese Regel nur an Dateien, in denen `ausgabe` vorkommt — und ließ
    // `oberflaechenprobe.mjs` durch, die `demo.html` liest und das Wort nicht
    // braucht. Wer ein Erzeugnis führt, führt auch die Weigerung.
    // **Der Aufruf, nicht der Name.** Die erste Fassung suchte `frischebefund`
    // irgendwo im Text — und fand ihn in der Importzeile. Die Gegenprobe nahm
    // den Aufruf heraus und der Prüfer meldete weiter grün: Er hat geprüft,
    // ob das Werkzeug die Prüfung **kennt**, nicht ob es sie ruft.
    if (l.erzeugnis && l.weigertSich !== false && !/frischebefund\s*\(/.test(datei.text)) {
      meldungen.push({
        regel: 'eintrag-ohne-pruefung',
        text: `${l.werkzeug} liest ${l.erzeugnis} und ruft keine Frischeprüfung`,
      });
    }
  }

  for (const d of dateien) {
    if (!/\bausgabe\b/.test(d.text)) continue;
    if (!gefuehrt.has(d.name)) {
      meldungen.push({
        regel: 'leser-ohne-eintrag',
        text: `${d.name} fasst ausgabe/ an und steht in keinem Eintrag`,
      });
    }
  }

  return { geprueft: dateien.length, meldungen, sauber: meldungen.length === 0 };
}
