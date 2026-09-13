/**
 * Hängen die 82 gebauten Seiten zusammen?
 *
 * **Der Anlass, 8. September 2026.** Gemessen wurde an diesem Tag dreierlei am
 * fertigen Ordner, und alles dreimal grün:
 *
 * - **2.650 interne Verweise**, keiner geht ins Leere,
 * - **zwei Seiten ohne eingehenden Verweis** — `404.html` und `suche.html`,
 *   beide mit `noindex` und beide zu Recht,
 * - **82 verschiedene Titel, 82 Beschreibungen, 82 Überschriften** auf 82
 *   Seiten.
 *
 * Drei gute Nachrichten, und trotzdem der Anlass für dieses Modul: Sie waren
 * das Ergebnis einer Handmessung, die niemand wiederholt. Der Bau benennt
 * Seiten um, Gruppen kommen dazu, eine Vorlage ändert sich — und dann bricht
 * genau das, was heute hielt.
 *
 * > **Ein Befund, den kein Werkzeug wiederholt, gilt für den Tag, an dem er
 * > erhoben wurde.**
 *
 * Ein toter Verweis kostet hier mehr als anderswo: Drei der Seiten sind
 * Endziele bezahlter Anzeigen zu 4,19 € bis 8,22 € je Klick.
 */

/** Verweise, die nicht ins eigene Verzeichnis zeigen. */
const AUSWAERTS = /^(https?:|mailto:|tel:|#|data:|\/\/)/;

/**
 * Seiten ohne eingehenden Verweis, die es zu Recht gibt — mit dem Grund.
 *
 * Eine Seite, die von keiner anderen verlinkt ist, findet nur, wer ihre
 * Adresse kennt. Für die Fehlerseite ist das der Zweck; für eine
 * Sortimentsseite wäre es ein Fehler.
 */
export const OHNE_EINGANG = Object.freeze([
  Object.freeze({
    datei: '404.html',
    warum: 'Die Fehlerseite. Auf sie zu verlinken hieße, dem Besucher einen Weg auf eine '
      + 'Sackgasse anzubieten; erreicht wird sie über `ErrorDocument` in der `.htaccess`, '
      + 'also vom Server und nicht von einer Seite. Sie trägt `noindex`.',
  }),
  Object.freeze({
    datei: 'suche.html',
    warum: 'Die Trefferseite des Suchfelds. Sie steht in der Kopfleiste jeder Seite als '
      + '**Eingabefeld**, nicht als Verweis — der Weg dorthin entsteht beim Tippen. Für '
      + 'Maschinen nennt die Startseite sie als `SearchAction`; sie trägt `noindex` und '
      + 'steht deshalb auch nicht in der Sitemap.',
  }),
]);

/** Wie lang eine Begründung mindestens sein muss, um eine zu sein. */
export const GRUND_MINDESTLAENGE = 150;

const werte = (text, muster) => [...text.matchAll(muster)].map((m) => m[1]);

/**
 * Hält die gebauten Seiten gegen sich selbst.
 *
 * @param {object} eingabe
 * @param {Map<string, string>} eingabe.seiten  Pfad relativ zum Ausgabeordner → HTML
 * @param {(von: string, ziel: string) => string} eingabe.aufloesen  relativer Pfad → Pfad
 * @param {(pfad: string) => boolean} eingabe.gibtEs  liegt die Datei im Ausgabeordner?
 */
export function verweisbefund({
  seiten, aufloesen, gibtEs, ohneEingang = OHNE_EINGANG, mindestens = 20,
}) {
  const meldungen = [];
  const eingehend = new Map([...seiten.keys()].map((d) => [d, 0]));
  let verweise = 0;

  for (const [datei, html] of seiten) {
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const ziel = m[1];
      if (AUSWAERTS.test(ziel)) continue;
      const ohneAnker = ziel.split('#')[0].split('?')[0];
      if (!ohneAnker) continue;
      verweise += 1;
      const pfad = aufloesen(datei, ohneAnker);
      if (!gibtEs(pfad)) {
        meldungen.push({
          regel: 'verweis-ins-leere',
          datei,
          text: `${datei} verweist auf „${ziel}" — die Datei gibt es im Ausgabeordner nicht`,
        });
        continue;
      }
      if (eingehend.has(pfad) && pfad !== datei) eingehend.set(pfad, eingehend.get(pfad) + 1);
    }
  }

  const begruendet = new Map(ohneEingang.map((o) => [o.datei, o]));
  const benutzt = new Set();
  for (const [datei, zahl] of eingehend) {
    if (zahl > 0) continue;
    if (begruendet.has(datei)) { benutzt.add(datei); continue; }
    meldungen.push({
      regel: 'seite-ohne-eingang',
      datei,
      text: `${datei} wird von keiner anderen Seite verlinkt — sie findet nur, wer die `
        + 'Adresse kennt, und nichts sagt, warum das so sein soll',
    });
  }
  for (const o of ohneEingang) {
    if (!benutzt.has(o.datei)) {
      meldungen.push({
        regel: 'grund-ohne-seite',
        datei: o.datei,
        text: `${o.datei} ist als verweisfrei begründet und ist entweder verlinkt oder weg`,
      });
    }
    if (o.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({ regel: 'grund-zu-kurz', datei: o.datei, text: `${o.datei}: der Grund ist zu knapp` });
    }
  }

  /*
   * **Titel, Beschreibung und Überschrift sind Adressen im Kopf des Lesers.**
   * Zwei Seiten mit demselben Titel sind in der Trefferliste einer
   * Suchmaschine dieselbe Seite — und in der Lesezeichenliste des Kunden auch.
   */
  const doppelt = (name, muster) => {
    const nach = new Map();
    for (const [datei, html] of seiten) {
      const [wert] = werte(html, muster);
      if (!wert) {
        meldungen.push({ regel: `ohne-${name}`, datei, text: `${datei} hat kein ${name}` });
        continue;
      }
      if (!nach.has(wert)) nach.set(wert, []);
      nach.get(wert).push(datei);
    }
    for (const [wert, dateien] of nach) {
      if (dateien.length > 1) {
        meldungen.push({
          regel: `${name}-doppelt`,
          datei: dateien[0],
          text: `${dateien.length} Seiten tragen dasselbe ${name} „${wert.slice(0, 60)}": `
            + dateien.join(', '),
        });
      }
    }
  };
  doppelt('Titel', /<title>([\s\S]*?)<\/title>/g);
  doppelt('Beschreibung', /<meta name="description" content="([^"]*)"/g);
  doppelt('Überschrift', /<h1[^>]*>([\s\S]*?)<\/h1>/g);

  if (seiten.size < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-seiten',
      datei: null,
      text: `nur ${seiten.size} Seiten gelesen, erwartet mindestens ${mindestens}`,
    });
  }

  return {
    seiten: seiten.size,
    verweise,
    ohneEingang: benutzt.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
