/**
 * Welche Ware kommt auf der Palette — und woher wollen wir das wissen?
 *
 * **Der Befund, 5. September 2026.** Auf der Seite des PVC-Kanalbogens stehen
 * vier Angaben übereinander:
 *
 * ```
 * [Marker]    palettiert, Kranentladung
 * Gewicht     0,285 kg   je Stück, aus dem Lieferschein
 *             Palettierte Ware. Sie wird mit dem Kran entladen …
 * Zustellung  83,00 €    netto je Lieferung, inkl. Kranentladung
 * ```
 *
 * > **Ein Bogen von 285 Gramm, mit dem Kran entladen.** Dreimal die
 * > Kranentladung und einmal das Gewicht, das ihr widerspricht — auf
 * > derselben Seite, seit es die Seite gibt.
 *
 * ## Woher die Einstufung kommt
 *
 * Aus der **Warengruppe**. Wer in Dämmung, Kamin, Kanal oder Mauerwerk steht,
 * ist Sperrgut; alles andere nicht. Keine einzige der 46 Einstufungen stammt
 * aus einer Angabe des Lieferanten — alle 46 tragen
 * `sperrgutQuelle: "eingeschaetzt"`.
 *
 * Und wo eine Tatsache dagegensteht, steht sie in **jedem** Fall dagegen: Von
 * den sieben Artikeln mit belegtem Gewicht sind vier als Sperrgut eingestuft
 * und wiegen 0,285 kg, 0,285 kg, 0,64 kg und 1,73 kg. Der schwerste Artikel
 * mit belegtem Gewicht — ein Sack ThermoMörtel, 24 kg — ist **kein** Sperrgut.
 *
 * > **In den vier Fällen, in denen die Schätzung nachprüfbar ist, ist sie
 * > falsch — und zwar in die Richtung, die den Kunden Geld kostet.**
 *
 * ## Was diese Datei nicht tut
 *
 * Sie stuft **nichts um**. Das Gewicht je Einheit entscheidet die Frage nicht:
 * Fünfhundert Bögen sind eine Palette, fünf sind ein Paket, und die Kasse
 * verrechnet die Kranentladung je Position — nicht je Menge. Wer aus einem
 * Gewicht je Stück eine Lieferart macht, ersetzt eine unbelegte Schätzung
 * durch eine zweite.
 *
 * Was sie tut: **den Widerspruch benennen**, wo er nachweisbar ist, und
 * verlangen, dass jeder Fall einen Grund trägt. Aufgelöst wird er mit der
 * Palettenfrage an den Lieferanten, die ohnehin offen ist.
 */

import { packungsgewichtKg } from './gebinde.js';
import { nurText } from './format.js';

/**
 * Die Warengruppen, aus denen die Schätzung „Sperrgut" folgt.
 *
 * **Hier und nur hier.** Bis zum 5. September stand diese Liste zweimal: als
 * `SPERRGUT_GRUPPEN` in `src/artikelliste.js` und als lokales `Set` in
 * `bin/katalog-aus-rechnungen.mjs`. Zwei Listen für dieselbe Sache, heute
 * gleich und morgen vielleicht nicht — genau die Familie, die dieser Bestand
 * ein halbes Dutzend Mal gefunden hat.
 */
export const SPERRGUT_GRUPPEN = Object.freeze(['Dämmung', 'Kamin', 'Kanal', 'Mauerwerk']);

/**
 * Was ein Mensch trägt, braucht keinen Kran.
 *
 * 25 kg ist die übliche Obergrenze für das Heben durch eine Person und
 * zugleich das gängige Sackgewicht im Baustoffhandel. Die Zahl entscheidet
 * hier **nichts** — sie trennt nur die Fälle, in denen ein belegtes Gewicht
 * der Einstufung widerspricht, von denen, in denen es zu ihr passt.
 *
 * **Verglichen wird seit dem 5. September mit `>`, nicht mit `>=`.** Der Satz
 * darüber sagt, 25 kg sei *die übliche Obergrenze für das Heben durch eine
 * Person* und *das gängige Sackgewicht* — ein 25-kg-Sack ist damit gerade der
 * Regelfall des Tragens und kein Widerspruch zur Einstufung „nicht
 * palettiert". Mit `>=` war er einer.
 *
 * Der Fehler war bis heute unsichtbar, weil **kein einziger Artikel je 25 kg
 * erreichte**: Die beiden Kiloartikel trugen `gewichtKg: 1`, die fünf
 * Sackartikel gar nichts (siehe `packungsgewichtKg`). Erst als das
 * Packungsgewicht richtig gerechnet wurde, standen sechs Artikel exakt auf der
 * Grenze — und hätten mit `>=` einen Widerspruch gemeldet, den es nicht gibt.
 *
 * > **Die Grenze wurde entschieden, bevor feststand, wem sie nützt.** Mit
 * > `>=` hätte diese Runde sechs Befunde gehabt statt einen; sechs Befunde
 * > sehen nach mehr Arbeit aus und wären sechs Fehlmeldungen gewesen.
 */
export const HANDGEWICHT_KG = 25;

/** Ist diese Warengruppe nach der Schätzung Sperrgut? */
export function sperrgutAusGruppe(gruppe) {
  return SPERRGUT_GRUPPEN.includes(gruppe);
}

/**
 * Widersprüche, die bewusst stehenbleiben — mit dem Grund.
 *
 * Pflicht wie überall in diesem Haus: Wer hier etwas einträgt, soll beim
 * Schreiben des Grundes merken, wenn er keinen hat.
 */
/**
 * Der Grund, den sich die vier Kanalpositionen teilen.
 *
 * Er steht einmal und wird viermal eingetragen: ein Eintrag je Artikel, damit
 * ein fünfter Widerspruch nicht hinter einem Sammeleintrag verschwindet — und
 * ein Wortlaut, damit er nicht viermal leicht anders lautet.
 */
export const GEMEINSAMER_GRUND = 'Die naheliegende Ausrede — „so etwas wird palettenweise bestellt" — '
  + 'ist widerlegt: Auf der einen belegten Lieferung stehen je Position zwei bis drei Stück, '
  + 'zusammen rund acht Kilogramm über alle vier Kanalpositionen. Umgestuft wird trotzdem nicht: '
  + 'Ob der Lieferant einen Hub verrechnet, sagt der Lieferant und nicht das Gewicht — und die '
  + 'Gebühr stehen zu lassen ist die Richtung, die den Shop überrascht und nicht den Kunden. Die '
  + 'Artikelseite nennt seit dem 5. September Herkunft und Betrag der Schätzung. Aufgelöst wird '
  + 'der Fall mit der Palettenfrage an den Lieferanten.';

export const HINGENOMMEN = Object.freeze([
  Object.freeze({
    sku: 'POS-10095',
    kurz: 'Kanalformteil, 1,73 kg je Stück',
    warum: `Kanalformteil, 1,73 kg je Stück. ${GEMEINSAMER_GRUND}`,
  }),
  Object.freeze({
    sku: 'POS-10134',
    kurz: 'Kanalformteil, 0,64 kg je Stück',
    warum: `Kanalformteil, 0,64 kg je Stück. ${GEMEINSAMER_GRUND}`,
  }),
  Object.freeze({
    sku: 'POS-10115',
    kurz: 'Kanalformteil, 0,285 kg je Stück',
    warum: `Kanalformteil, 0,285 kg je Stück. ${GEMEINSAMER_GRUND}`,
  }),
  Object.freeze({
    sku: 'POS-10116',
    kurz: 'Kanalformteil, 0,285 kg je Stück',
    warum: `Kanalformteil, 0,285 kg je Stück. ${GEMEINSAMER_GRUND}`,
  }),
  // **Der fünfte Fall, sichtbar seit dem 5. September.** Er stand die ganze
  // Zeit da und war nicht zu sehen: Der Eimer trägt sein Gewicht im Namen und
  // nicht im Feld, und der Prüfer las nur das Feld.
  Object.freeze({
    sku: 'POS-16070',
    kurz: 'Eimer Fugenmasse, 1,5 kg',
    warum: 'Ein Eimer Fugenmasse zu 1,5 kg, eingestuft als Sperrgut, weil er in der '
      + 'Warengruppe Kamin steht — und die Kamingruppe ist die mit den Mantelsteinen. '
      + 'Anderthalb Kilogramm Fugenmasse mit dem Kran zu entladen ist so wenig plausibel '
      + 'wie der Kanalbogen von 285 Gramm. Umgestuft wird aus demselben Grund nicht: Ob der '
      + 'Lieferant einen Hub verrechnet, sagt der Lieferant. Der Eimer kommt vermutlich '
      + 'mit den Mantelsteinen auf derselben Palette — was die Einstufung eher stützt als '
      + 'widerlegt, aber eben eine Vermutung ist. Aufgelöst mit der Palettenfrage.',
  }),
]);

/**
 * Die gebauten Flächen, auf denen der Kunde von der Kranentladung liest —
 * und der Nachweis, dass dort auch steht, woher die Einstufung kommt.
 *
 * **Der Anlass, 5. September 2026, morgens.** Die Artikelseite sagt seit dem
 * Vortag, dass die Einstufung aus der Warengruppe geschätzt ist. `llms.txt`
 * sagte weiter nur „· palettiert", und die Kasse „palettiert, Kranentladung
 * je Hub".
 *
 * > **Eine Auskunft, die an einer Stelle qualifiziert ist und an der
 * > maschinenlesbaren blank steht, wird von Assistenten als Tatsache
 * > weitergegeben.**
 *
 * ## Und die Flächen wurden aufgezählt statt gesucht — 5. September, abends
 *
 * Die erste Fassung führte ein **Verzeichnis** von zwei Dateien, und das
 * Werkzeug meldete darüber: „Gebaute Flächen mit dem Wort **2**, alle mit
 * Herkunftsangabe."
 *
 * Gemessen sind es **32**: 25 Artikelseiten, `lieferung.html`, zwei
 * Wissensseiten, eine Gruppenseite, `llms.txt`, `shop.js` und
 * `website.html`.
 *
 * > **Der Prüfer, der zählt, wie viele Flächen er geprüft hat, zählte sein
 * > eigenes Register.**
 *
 * Dieselbe Familie wie „davon `HINGENOMMEN.length` mit Grund" zwei Felder
 * weiter oben — am selben Tag gefunden, im selben Modul, und beim Beheben des
 * einen ist das andere nicht aufgefallen.
 *
 * **Warum es genau zwei waren, ist der zweite Teil des Befunds.**
 * `HERKUNFTSMUSTER` suchte im rohen Dateiinhalt. Auf der Artikelseite steht
 * die Auskunft vollständig da — aber als
 * `aus der\n<strong>Warengruppe Dämmung</strong>`. Umbruch und Marke
 * dazwischen; das Muster trifft nicht. Ein Prüfer mit diesem Muster über die
 * 25 Artikelseiten hätte 25 Fehlmeldungen erzeugt. Gesucht wird deshalb im
 * **Text**, nicht im Markup (`nurText` aus `format.js`).
 *
 * Geprüft wird weiterhin grob und in eine Richtung: Wo das Wort fällt, muss
 * die Herkunft in derselben Datei stehen. Dass sie an der richtigen Stelle
 * steht, sagt diese Prüfung nicht — das sagt der Augenschein.
 */

/** Woran die Herkunftsangabe zu erkennen ist — in jeder der Flächen dieselbe. */
export const HERKUNFTSMUSTER = /aus der Warengruppe/;

/** Woran eine Fläche zu erkennen ist. */
export const FLAECHENMUSTER = /Kranentladung|palettiert/i;

/**
 * Flächen, die das Wort tragen dürfen, ohne die Herkunft zu nennen — mit Grund.
 *
 * In beide Richtungen gehalten: Ein Eintrag, dessen Datei das Wort gar nicht
 * mehr trägt, ist eine Erlaubnis für etwas, das niemand mehr tut.
 */
export const OHNE_HERKUNFT = Object.freeze([
  Object.freeze({
    datei: 'site/wissen/warum-keine-gratislieferung.html',
    warum: 'Die Seite erklärt, warum die Fracht getrennt ausgewiesen wird, und nennt die '
      + 'Kranentladung als einen der Posten. Sie stuft keinen Artikel ein und nennt keinen '
      + 'Betrag je Position — die Herkunft der Einstufung gehört dorthin, wo sie Geld kostet: '
      + 'auf die Artikelseite und in den Warenkorb.',
  }),
  Object.freeze({
    datei: 'site/wissen/baumeisterpreis.html',
    warum: 'Erklärt den Preisaufbau und erwähnt die Kranentladung als Beispiel für einen '
      + 'Kostenbestandteil, der getrennt bleibt. Kein Artikel, keine Einstufung, kein Betrag '
      + 'je Position — dieselbe Abgrenzung wie bei der Gratislieferungsseite.',
  }),
  Object.freeze({
    datei: 'site/gruppe/mauerwerk.html',
    warum: 'Die Gruppenseite listet Artikel mit dem Etikett „palettiert" und verlinkt jeden '
      + 'auf seine Artikelseite, wo die Herkunft steht. Das Etikett darf kurz sein, solange '
      + 'die Erklärung in Sichtweite steht — dieselbe Entscheidung wie beim Marker über dem '
      + 'Preis am 5. September vormittags.',
  }),
]);

/**
 * Sucht die Flächen selbst — statt sie aufzuzählen.
 *
 * @param {() => Array<{datei: string, inhalt: string}>} sammle  gebaute Dateien
 * @param {number} mindestens  unter dieser Zahl ist der Lauf leer, nicht sauber
 */
export function flaechenbefund(sammle, ohneHerkunft = OHNE_HERKUNFT, mindestens = 20) {
  const meldungen = [];
  const gedeckt = new Set();
  const gefunden = [];

  for (const { datei, inhalt } of sammle()) {
    const text = nurText(inhalt);
    if (!FLAECHENMUSTER.test(text)) continue;
    gefunden.push(datei);
    if (HERKUNFTSMUSTER.test(text)) continue;

    const eintrag = ohneHerkunft.find((o) => o.datei === datei);
    if (eintrag) { gedeckt.add(eintrag); continue; }
    meldungen.push({
      regel: 'einstufung-ohne-herkunft',
      datei,
      text: `${datei}: nennt die Kranentladung und nicht, woher die Einstufung kommt`,
    });
  }

  // **Ein leerer Lauf ist kein grüner.** Fände die Sammlung nichts — weil
  // nicht gebaut wurde, weil ein Pfad sich verschoben hat —, meldete diese
  // Prüfung „sauber" über null Dateien.
  if (gefunden.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-flaechen',
      text: `nur ${gefunden.length} Flächen mit dem Wort gefunden, erwartet mindestens ${mindestens}`,
    });
  }

  for (const o of ohneHerkunft) {
    if (!o.warum || o.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', datei: o.datei, text: `${o.datei}: Grund zu kurz` });
    }
    if (!gedeckt.has(o)) {
      meldungen.push({
        regel: 'ausnahme-ohne-fall',
        datei: o.datei,
        text: `${o.datei}: als Ausnahme geführt, trägt das Wort aber nicht (mehr) ohne Herkunft`,
      });
    }
  }

  return {
    flaechen: gefunden.length,
    mitHerkunft: gefunden.length - gedeckt.size - meldungen.filter((m) => m.regel === 'einstufung-ohne-herkunft').length,
    hingenommen: gedeckt.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Hält die Einstufung gegen die Tatsachen, die der Katalog hat.
 *
 * Drei Regeln, und keine davon stuft um:
 *
 *   `gruppe-widerspricht`   die Einstufung passt nicht zur eigenen Regel —
 *                           dann ist eine der beiden aus der Hand gesetzt
 *   `leicht-und-sperrgut`   belegtes Gewicht unter der Handgrenze, trotzdem
 *                           Kranentladung
 *   `schwer-und-frei`       belegtes Gewicht ab der Handgrenze, trotzdem
 *                           keine
 */
export function einstufungsbefund(artikel = [], hingenommen = HINGENOMMEN) {
  const meldungen = [];
  const begruendet = new Map(hingenommen.map((h) => [h.sku, h]));
  const gesehen = new Set();
  let belegbar = 0;
  let widerspruch = 0;

  for (const a of artikel) {
    if (a.sperrgut !== sperrgutAusGruppe(a.gruppe)) {
      meldungen.push({
        regel: 'gruppe-widerspricht',
        sku: a.sku,
        text: `${a.sku}: „${a.gruppe}" ergibt ${sperrgutAusGruppe(a.gruppe)}, gespeichert ist ${a.sperrgut}`,
      });
    }

    // **Nicht `a.gewichtKg`, seit dem 5. September.** Das Feld heißt bei
    // Stückware „je Packung" und bei Kiloware „je Kilogramm"; gegen eine
    // Handgrenze in Kilogramm ist nur das Erste vergleichbar. Zwei Artikel
    // trugen `gewichtKg: 1` bei Einheit `KG` — wahr, und gegen 25 kg nie
    // anzuschlagen. Die Begründung steht bei `packungsgewichtKg`.
    const gewicht = packungsgewichtKg(a);
    if (!Number.isFinite(gewicht)) continue;
    belegbar += 1;

    const leicht = a.sperrgut && gewicht < HANDGEWICHT_KG;
    const schwer = !a.sperrgut && gewicht > HANDGEWICHT_KG;
    if (!leicht && !schwer) continue;
    widerspruch += 1;

    if (begruendet.has(a.sku)) { gesehen.add(a.sku); continue; }
    meldungen.push({
      regel: leicht ? 'leicht-und-sperrgut' : 'schwer-und-frei',
      sku: a.sku,
      text: leicht
        ? `${a.sku}: ${gewicht} kg je Packung und trotzdem Kranentladung — ${a.bezeichnung}`
        : `${a.sku}: ${gewicht} kg je Packung und trotzdem keine — ${a.bezeichnung}`,
    });
  }

  for (const h of hingenommen) {
    if (!h.warum || h.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', sku: h.sku, text: `${h.sku}: hingenommen ohne tragfähigen Grund` });
    }
    if (!artikel.some((a) => a.sku === h.sku)) {
      meldungen.push({ regel: 'eintrag-ohne-artikel', sku: h.sku, text: `${h.sku}: hingenommen, aber nicht im Katalog` });
    } else if (!gesehen.has(h.sku)) {
      meldungen.push({
        regel: 'grund-ohne-widerspruch',
        sku: h.sku,
        text: `${h.sku}: hingenommen, aber es gibt keinen Widerspruch mehr`,
      });
    }
  }

  return {
    artikel: artikel.length,
    mitGewicht: belegbar,
    widersprueche: widerspruch,
    // **Gemessen, nicht abgezählt** — ergänzt am 5. September. Das Werkzeug
    // schrieb „davon `HINGENOMMEN.length` mit Grund" und meldete damit die
    // Länge des Verzeichnisses als Ergebnis der Prüfung. Bei einem
    // ungedeckten Widerspruch hätte dort dieselbe Zahl gestanden.
    gedeckt: gesehen.size,
    unbelegt: artikel.filter((a) => a.sperrgutQuelle !== 'liste' && a.sperrgutQuelle !== 'belegt').length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
