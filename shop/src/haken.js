/**
 * Steht der Haken im Weg, der einen Commit während einer Gegenprobe aufhält?
 *
 * **Der Anlass, 8. September 2026.** Ein Commit dieses Loops rief `git add -A`,
 * während im Hintergrund `npm run alles` bei den Gegenproben stand. Eine davon
 * hielt in diesem Moment `src/schaufenster.js` absichtlich falsch — der
 * Sollwert der Lieferantenbelege um eins verschoben, damit sich zeigt, dass
 * die Zahl wirklich gemessen wird und nicht bloß dasteht. Genau diese Zeile
 * ging mit in den Commit und stand fünfunddreißig Minuten lang auf dem Zweig.
 *
 * Was dort stand, war kein Tippfehler, sondern ein **blindgestellter Prüfer**:
 * `pruefe-schaufenster` hätte die Zahl der Lieferantenbelege ab da gegen einen
 * Sollwert gehalten, der um eins danebenliegt — und damit gegen gar nichts.
 *
 * ## Der Schutz war da. Er war ein Satz.
 *
 * `bin/mutationspruefung.mjs` trägt seit dem 4. September in seinem Kopf:
 *
 * > *Wer währenddessen committet, committet die Mutation. Genau dafür ist
 * > dieser Loop gebaut: Er committet und pusht ohne Rückfrage.*
 *
 * Und einen Satz weiter: *„er gehört vor jeden Commit."* Beides stimmt, beides
 * stand da, und beides half nichts — weil hier kein Mensch committet, sondern
 * ein Programm, und ein Programm liest keine Kopfkommentare.
 *
 * > **Eine Regel, die nur als Satz dasteht, gilt für den, der sie liest.**
 *
 * Dieselbe Familie wie am 4. September (`src/mutationsschutz.js`: eine Regel,
 * die es gibt und die an der Stelle nicht gilt, an der sie entstanden ist) und
 * wie am 8. September früher am Tag (`pruefe-geheimnis` sah in die Ausgabe,
 * während das Verzeichnis genauso öffentlich ist). Der Unterschied liegt
 * jedes Mal nicht im Wissen, sondern darin, ob es an der Stelle ankommt, die
 * handelt.
 *
 * ## Was dieses Modul misst
 *
 * Der Haken selbst steht in `haken/pre-commit` und ruft die Mutationsprüfung
 * auf. `git` findet ihn über `core.hooksPath`, und `bin/gegenprobenlauf.mjs`
 * setzt den Weg, **bevor** er die erste Datei falsch macht — der Schutz gehört
 * zu der Stelle, die die Gefahr erzeugt, nicht in eine Einrichtungsanleitung.
 *
 * Gemessen wird deshalb nicht, dass es die Datei gibt, sondern **dass sie
 * aufhält**: einmal mit offenem Zettel (muss sperren) und einmal ohne (muss
 * durchlassen). Ein Haken, der immer sperrt, wäre genauso wertlos wie einer,
 * der nie sperrt — das ist der Befund vom 6. September über die sieben
 * Sperren, die alle nur ihren eigenen Sperrgrund kannten und nie den grünen
 * Fall.
 */

/** Wohin `core.hooksPath` zeigen muss — vom Wurzelverzeichnis aus. */
export const HAKENWEG = 'shop/haken';

/**
 * Welche Haken es geben muss, und wozu.
 *
 * Das Register hat wie jedes in diesem Bestand zwei Richtungen: Jeder Eintrag
 * muss als Datei dastehen, und jede Datei in `haken/` muss einen Eintrag
 * haben. Ein Haken, den niemand angeordnet hat, hält irgendwann etwas auf,
 * und niemand weiß warum.
 */
export const HAKEN = Object.freeze([
  Object.freeze({
    name: 'pre-commit',
    ruft: ['bin/mutationspruefung.mjs', 'bin/erzeugnispruefung.mjs', 'npm test'],
    warum: 'Eine Gegenprobe hält eine Quelldatei absichtlich falsch. Wer währenddessen '
      + 'committet, committet die Mutation — am 8. September stand so fünfunddreißig '
      + 'Minuten lang ein blindgestellter Prüfer auf dem Zweig. Der Zettel unter '
      + '.sicherung/ weiß es; dieser Haken fragt ihn, bevor git schreibt. Und seit dem '
      + 'Abend desselben Tages auch die Testfälle: Ein Commit ging mit zwei roten hinaus, '
      + 'weil `npm test | tail -5` den Ausgang von tail liefert und nicht den von npm.',
  }),
]);

/**
 * @param {object} lage
 * @param {string|null} lage.hakenweg    was `git config core.hooksPath` sagt
 * @param {string[]}    lage.dateien     die Dateinamen in `haken/`
 * @param {(name: string) => string} lage.lies   Inhalt eines Hakens
 * @param {(name: string) => boolean} lage.ausfuehrbar
 * @param {(name: string) => {mitZettel: number, ohneZettel: number}} lage.probiere
 *        führt den Haken zweimal aus und gibt beide Ausgänge zurück
 * @param {string} [lage.aufrufer]       Quelltext, der den Weg setzen muss
 * @param {string} [lage.sollweg]
 */
export function hakenbefund({
  hakenweg, dateien, lies, ausfuehrbar, probiere, aufrufer = null, sollweg = HAKENWEG,
}) {
  const meldungen = [];
  const bekannt = new Set(HAKEN.map((h) => h.name));

  if (!hakenweg) {
    meldungen.push({
      regel: 'hakenweg-nicht-gesetzt',
      text: `core.hooksPath ist nicht gesetzt — git sieht ${sollweg}/ nicht an. `
        + `Zu setzen mit: npm run haken`,
    });
  } else if (hakenweg.replace(/\/+$/, '') !== sollweg) {
    meldungen.push({
      regel: 'hakenweg-zeigt-woandershin',
      text: `core.hooksPath steht auf „${hakenweg}", verlangt ist „${sollweg}"`,
    });
  }

  for (const haken of HAKEN) {
    if (!dateien.includes(haken.name)) {
      meldungen.push({ regel: 'haken-fehlt', text: `${haken.name} ist angeordnet und fehlt in ${sollweg}/` });
      continue;
    }
    if (!ausfuehrbar(haken.name)) {
      meldungen.push({
        regel: 'haken-nicht-ausfuehrbar',
        text: `${haken.name} ist nicht ausführbar — git überspringt ihn wortlos`,
      });
    }
    for (const ruft of haken.ruft) {
      if (lies(haken.name).includes(ruft)) continue;
      meldungen.push({
        regel: 'haken-ruft-nicht',
        text: `${haken.name} ruft ${ruft} nicht auf`,
      });
    }

    // **Der grüne Fall gehört dazu.** Ein Haken, der jeden Commit sperrt,
    // sieht in einer Messung, die nur „sperrt er?" fragt, genauso gut aus wie
    // einer, der richtig liegt — und wäre unbrauchbar.
    const { mitZettel, ohneZettel } = probiere(haken.name);
    if (mitZettel === 0) {
      meldungen.push({
        regel: 'haken-laesst-durch',
        text: `${haken.name} ließ einen offenen Zettel durch (Ausgang ${mitZettel})`,
      });
    }
    if (ohneZettel !== 0) {
      meldungen.push({
        regel: 'haken-sperrt-immer',
        text: `${haken.name} sperrte auch ohne offenen Zettel (Ausgang ${ohneZettel}) — `
          + 'eine Sperre ohne grünen Fall hält irgendwann die Arbeit auf und nicht den Fehler',
      });
    }
  }

  for (const name of dateien) {
    if (!bekannt.has(name)) {
      meldungen.push({
        regel: 'haken-ohne-eintrag',
        text: `${name} liegt in ${sollweg}/, steht aber in keinem Eintrag von HAKEN`,
      });
    }
  }

  // Der Weg nützt nur, wenn ihn jemand setzt, bevor die erste Datei falsch
  // wird. Angeordnet ist dafür der Gegenprobenläufer — die Stelle, die die
  // Gefahr erzeugt.
  if (aufrufer !== null && !/hakeneinrichtung/.test(aufrufer)) {
    meldungen.push({
      regel: 'niemand-setzt-den-weg',
      text: 'bin/gegenprobenlauf.mjs richtet den Haken nicht ein, bevor er mutiert — '
        + 'ein Schutz, den nur eine Anleitung einschaltet, ist in einem unbeaufsichtigten '
        + 'Lauf keiner',
    });
  }

  return { geprueft: HAKEN.length, meldungen, sauber: meldungen.length === 0 };
}
