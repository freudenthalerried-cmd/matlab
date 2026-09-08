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

// **Zahlwörter am 8. September nach `src/format.js` verlegt.** Dieselbe
// Tabelle stand auch in `src/inhaltspruefung.js`, dort ohne „eine" — zwei
// Fassungen derselben Tabelle sind eine Fassung, die niemand pflegt.
import { ZAHLWORT } from './format.js';

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
    // **Die Zeilen selbst, nicht nur ihre Zahl — 8. September 2026.** Bis
    // dahin zählte diese Datei Positionen und Artikel und band beides nie
    // aneinander: „5 von 8 lieferbar, 7 Artikel" sagt nicht, welcher Artikel
    // welche Position deckt. Genau dort lag ein Artikel, den die Tabelle der
    // Seite mit keiner Zeile erklärt.
    zeilen: Object.freeze(zeilen.map((z) => Object.freeze({
      nr: z.nr,
      position: z.position,
      gefuehrt: !NICHT_GEFUEHRT.test(z.position),
      eingeschraenkt: EINGESCHRAENKT.test(z.position),
    }))),
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

/**
 * Positionen und Artikelnamen, die dieselbe Sache meinen und sich im Wortlaut
 * nicht treffen — mit dem Grund.
 *
 * Der Lieferant benennt nach Marke und Bauform, die Stückliste nach Gewerk.
 * Wo beides auseinandergeht, gehört der Grund hierher.
 */
export const WORTLUECKEN = Object.freeze([
  Object.freeze({
    position: 'Oberputz',
    sku: 'POS-19333',
    warum: 'Der Artikel heißt „Capatect PrimaPor K20 SH-Reibputz". Ein Reibputz **ist** der '
      + 'Oberputz des Systems — die Stückliste nennt die Schicht, der Lieferant die Struktur '
      + 'und die Körnung. Beides ist richtig, und keines steht im anderen.',
  }),
  Object.freeze({
    position: 'Armierungsmörtel',
    sku: 'POS-11283',
    warum: 'Dieselbe Klebe- und Spachtelmasse trägt im System zwei Schichten: Sie klebt die '
      + 'Platte und nimmt später das Gewebe auf. Die Stückliste führt beide Positionen — mit '
      + 'Recht, denn die Mengen unterscheiden sich —, der Katalog führt einen Artikel.',
  }),
  Object.freeze({
    position: 'Bögen',
    sku: 'POS-10116',
    warum: 'Der zweite der beiden Bögen — „PVC Kanalbogen NW 100 45 grad". Dieselbe '
      + 'Stammbildungslücke wie beim 30-Grad-Bogen, und beide gehören zur selben Zeile der '
      + 'Stückliste: Eine Richtungsänderung besteht aus zwei 45-Grad-Bögen, und der flache '
      + 'kommt an der Sohle dazu.',
  }),
  Object.freeze({
    position: 'Bögen',
    sku: 'POS-10115',
    warum: 'Mehrzahl mit Umlaut: Die Artikel heißen „PVC Kanalbogen 30 grad" und „45 grad". '
      + 'Die Wortstammbildung führt „Bögen" und „Kanalbogen" nicht zusammen — eine Eigenheit '
      + 'der Stammbildung und keine Abweichung in der Sache.',
  }),
]);

/**
 * Deckt jede lieferbare Position einen Artikel, und jeder Artikel eine
 * Position?
 *
 * **Der Anlass, 8. September 2026.** `pruefe-systemlisten` meldete „5 von 8
 * lieferbar, 7 Artikel" — zwei Zahlen nebeneinander und keine Verbindung
 * dazwischen. Gemessen trug `kanal-dn100.md` die **PAE-Folie**, und keine
 * Zeile ihrer Tabelle erklärt, wozu sie in einer Grundleitung gehört. Der
 * Kunde sah sie trotzdem: Die Seite baut ihre Artikelkarten aus genau dieser
 * Kopfzeile.
 *
 * > **Die Seite zeigte einen Artikel, den ihre eigene Liste nicht erklärt.**
 *
 * @param {object} eingabe
 * @param {Record<string, object>} eingabe.listen  Name → `liesSystemliste`
 * @param {Map<string, string>} eingabe.bezeichnungJeSku
 * @param {(text: string) => string[]} eingabe.staemme
 */
export function zuordnungsbefund({
  listen, bezeichnungJeSku, staemme, wortluecken = WORTLUECKEN,
}) {
  const meldungen = [];
  const benutzt = new Set();
  let geprueft = 0;

  const passt = (position, sku) => {
    const l = wortluecken.find((w) => w.position === position && w.sku === sku);
    if (l) { benutzt.add(`${l.position}|${l.sku}`); return true; }
    const imArtikel = staemme(bezeichnungJeSku.get(sku) ?? '');
    return staemme(position.replace(/\*.*/, ''))
      .some((w) => imArtikel.some((b) => b.includes(w) || w.includes(b)));
  };

  for (const [name, liste] of Object.entries(listen)) {
    const gedeckt = new Set();
    for (const z of liste.zeilen ?? []) {
      if (!z.gefuehrt) continue;
      // Eine Position mit eigener Einschränkung sagt selbst, dass der Artikel
      // in dieser Form nicht kommt („Dämmplatten *(nicht in Flächenstärke)*").
      // Sie ist geführt und trägt trotzdem zu Recht keinen Artikel.
      if (z.eingeschraenkt) continue;
      geprueft += 1;
      const treffer = liste.skus.filter((s) => passt(z.position, s));
      treffer.forEach((s) => gedeckt.add(s));
      if (!treffer.length) {
        meldungen.push({
          regel: 'position-ohne-artikel',
          datei: name,
          text: `${name}: Position ${z.nr} „${z.position}" ist als lieferbar geführt, und `
            + 'kein Artikel der Liste trägt ihren Namen',
        });
      }
    }
    for (const s of liste.skus) {
      if (gedeckt.has(s)) continue;
      meldungen.push({
        regel: 'artikel-ohne-position',
        datei: name,
        text: `${name}: ${s} „${bezeichnungJeSku.get(s) ?? '?'}" steht in der Kopfzeile, und `
          + 'keine Zeile der Tabelle erklärt ihn — die Seite zeigt ihn trotzdem als Karte',
      });
    }
  }

  for (const l of wortluecken) {
    if (!benutzt.has(`${l.position}|${l.sku}`)) {
      meldungen.push({
        regel: 'wortluecke-ohne-fall',
        datei: null,
        text: `„${l.position}" ↔ ${l.sku} ist begründet und kommt in keiner Liste mehr vor`,
      });
    }
    if (l.warum.length < 150) {
      meldungen.push({ regel: 'grund-zu-kurz', datei: null, text: `„${l.position}": der Grund ist zu knapp` });
    }
  }

  return { positionen: geprueft, meldungen, sauber: meldungen.length === 0 };
}
