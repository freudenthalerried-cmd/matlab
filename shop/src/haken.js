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
    ruft: [
      'bin/mutationspruefung.mjs',
      'bin/erzeugnispruefung.mjs',
      'npm test',
      // **Ergänzt am 9. September 2026.** Der Gesamtlauf fand zwei Testfälle,
      // die über eine Liste laufen und bei leerer Liste nichts prüfen — beide
      // aus den zwei Runden davor, beide von mir, beide über den Haken
      // committet. `npm test` kann das nie finden: Eine Schleife über nichts
      // ist grün. Gemessen: 215 ms. `pruefe-schaufenster` bleibt draußen, es
      // braucht 23 Sekunden und verdoppelte jeden Commit — sein Befund ist
      // eine veraltete Zahl, kein falsches Verhalten.
      'bin/testpruefung.mjs',
      // **Ergänzt am 9. September 2026, nachmittags.** Am Vormittag blieb
      // dieser Prüfer draußen: 24 Sekunden, „verdoppelte jeden Commit". Die
      // Rechnung stimmte, die Zahl nicht — 97 % davon war ein zweiter
      // Testlauf, unmittelbar nach dem, den der Haken ohnehin macht. Mit der
      // übergebenen Zahl sind es 0,6 s. Der Anlass: Zwei Runden später ging
      // „39 Prüfer" hinaus, während 40 im Register standen.
      'bin/schaufensterpruefung.mjs',
      // **Ergänzt am 11. September 2026 — Gate 38.** Bis heute rief dieser
      // Haken vier der fünfundfünfzig Prüfer auf, und warum die anderen
      // draußen blieben, stand nirgends. Gemessen: 47 von 55 bleiben unter
      // einer Sekunde, zusammen fünf. Drei Prüfer standen an diesem Tag rot,
      // einer seit dem 25. August, und kein Commit hat das aufgehalten. Die
      // Auswahl rechnet `imSchnelllauf` aus dem Register und `NICHT_IM_HAKEN`
      // aus — hier steht keine zweite Liste, die davon abweichen könnte.
      'bin/schnelllauf.mjs',
    ],
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

/* ------------------------------------------------------------------
 * **Gate 38, entschieden am 11. September 2026: Was unter einer Sekunde
 * bleibt, läuft vor jedem Commit.**
 *
 * ## Der Anlass
 *
 * Der Haken oben ruft vier der fünfundfünfzig Prüfer dieses Bestandes. Warum
 * die anderen einundfünfzig draußen bleiben, stand nirgends — zwei Gründe
 * dazu standen als **Kommentar** in genau der Datei, deren eigener Kopfsatz
 * lautet: *„Eine Regel, die nur als Satz dasteht, gilt für den, der sie
 * liest."*
 *
 * Der Schaden ist am 11. September gemessen worden. Der Gesamtlauf über alles
 * dauert **72 Minuten**, und niemand fährt ihn zwischen zwei Commits. In ihm
 * standen drei Prüfer rot:
 *
 * | Prüfer | rot seit | aufgehalten hat es |
 * |---|---|---|
 * | `pruefe-umschreibung` | 25. August | nichts |
 * | `pruefe-punkte` | 8. September | nichts |
 * | `pruefe-gebinde` | 8. September (Weigerung) | nichts |
 *
 * > **Ein Prüfer, der rot ist und nichts aufhält, ist kein Prüfer, sondern
 * > eine Notiz.**
 *
 * ## Die Zahl, die entscheidet
 *
 * Jeder Prüfer einzeln gestoppt, am 11. September: **47 von 55 bleiben unter
 * einer Sekunde**, zusammen etwa fünf Sekunden. Die acht darüber machen
 * 107 der 123 Sekunden aus. Eine Sekunde ist deshalb keine gegriffene Grenze,
 * sondern die Stelle, an der die Messreihe auseinanderfällt.
 *
 * Fünf Sekunden auf einen Commit, der mit `npm test` ohnehin gut vierzig
 * kostet, sind der Preis dafür, dass ein roter Prüfer nicht mehr tagelang
 * rot bleiben kann.
 *
 * ## Zwei Regeln, die dazugehören
 *
 * **Eine Weigerung sperrt nicht.** `pruefe-gebinde` kann seit dem Verlust von
 * `preise/poschacher-positionen.csv` nichts messen und endet mit Ausgang 2.
 * Wer das wie einen Fund behandelt, sperrt jeden Commit für immer; wer es
 * verschweigt, hat einen Prüfer, der nichts tut und grün aussieht. Der
 * Schnelllauf meldet die Weigerung und lässt durch.
 *
 * **Draußen bleiben heißt: mit Grund draußen bleiben.** Wie bei jedem
 * Register dieses Hauses gilt die Regel in beide Richtungen — jeder Prüfer ist
 * entweder im Haken oder hier eingetragen, und kein Eintrag zeigt auf einen
 * Prüfer, den es nicht gibt.
 * ------------------------------------------------------------------ */

/**
 * Prüfer, die **nicht** vor jedem Commit laufen — jeder mit dem Grund.
 *
 * `sekunden` ist der gestoppte Wert vom 11. September 2026, damit ein Grund,
 * der sich auf die Laufzeit beruft, nachprüfbar bleibt und nicht mit dem
 * Bestand veraltet.
 */
export const NICHT_IM_HAKEN = Object.freeze([
  Object.freeze({
    pruefer: 'pruefe-lesbar', sekunden: 13.8,
    warum: 'Liest jede der 379 Quelldateien mit dem Übersetzer ein — die unterste Stufe und '
      + 'die teuerste. Sie findet eine Datei, die sich nicht einmal einlesen lässt; genau das '
      + 'fällt aber schon beim ersten Aufruf jedes anderen Werkzeugs auf, und `npm test` lädt '
      + 'im Haken ohnehin den halben Bestand.',
  }),
  Object.freeze({
    pruefer: 'pruefe-leitzahlen', sekunden: 1.6,
    warum: 'Geht über jede gebaute Seite und hält jede Zahl gegen ihr Hauptwort. Sie liegt als '
      + 'einzige knapp über der Grenze und ist der Grenzfall, an dem sie sich bewährt: Eine '
      + 'Grenze, die ihren ersten Grenzfall hereinlässt, ist keine. Sie läuft im Gesamtlauf.',
  }),
  Object.freeze({
    pruefer: 'shopprobe', sekunden: 15.1,
    warum: 'Startet Chromium und fährt 63 Szenarien der Oberfläche. Ein Browserstart je Lauf '
      + 'ist der teuerste Posten des ganzen Bestandes; was er findet, hängt am gebauten '
      + 'Erzeugnis und nicht an der Quelle, die gerade committet wird.',
  }),
  Object.freeze({
    pruefer: 'oberflaechenprobe', sekunden: 3.6,
    warum: 'Derselbe Grund wie bei der Shopprobe: ein eigener Browserstart für elf Szenarien '
      + 'der Demoseite. Vier Browserproben vor jedem Commit kosteten zusammen dreißig Sekunden '
      + 'und verdoppelten ihn.',
  }),
  Object.freeze({
    pruefer: 'bestellprobe', sekunden: 2.7,
    warum: 'Fährt Kasse, PHP, Ablage und Angebot in einem Stück durch — mit Browser und '
      + 'echtem Schreibvorgang in die Ablage. Eine Probe, die Zeilen schreibt, gehört nicht '
      + 'in einen Haken, der bei jedem Commit läuft.',
  }),
  Object.freeze({
    pruefer: 'rahmenzensus', sekunden: 8.8,
    warum: 'Stellt 82 gebaute Seiten in einen 390-Pixel-Rahmen und sieht nach, ob etwas '
      + 'seitlich hinausragt — wieder ein Browser, und wieder am Erzeugnis statt an der '
      + 'Quelle. Der Gesamtlauf fährt ihn.',
  }),
  Object.freeze({
    pruefer: 'pruefe-haken', sekunden: 35.2,
    warum: 'Ruft den Haken selbst auf, zweimal, und der Haken ruft `npm test`. Im Haken wäre '
      + 'das kein Prüfer, sondern eine Schleife ohne Boden. Er ist die einzige Ausnahme, die '
      + 'nicht an der Laufzeit hängt, sondern daran, was er prüft.',
  }),
  Object.freeze({
    pruefer: 'wegprobe', sekunden: 2.4,
    warum: 'Am 11. September ins Prüferregister aufgenommen und damit zuerst im Schnelllauf '
      + 'gelandet — dort kostete sie eine Sekunde mehr als die anderen dreiundvierzig '
      + 'zusammen. Sie startet Chromium und geht den Weg vom Anzeigenklick bis zur fertigen '
      + 'Anfrage; derselbe Grund wie bei den vier anderen Browserproben.',
  }),
  Object.freeze({
    pruefer: 'abgleich-veroeffentlichung', sekunden: 0.7,
    warum: 'Holt die veröffentlichte PR-Beschreibung über api.github.com und rechnet sie gegen '
      + 'die Quelle. Er ist billig genug, und trotzdem falsch am Platz: **Ein Commit, der ohne '
      + 'Netz nicht gelingt, ist kein Commit mehr, sondern eine Zusage über fremde Erreichbarkeit.** '
      + 'Er gehört zur Veröffentlichung und läuft dort.',
  }),
]);

/**
 * Welche Prüfer der Schnelllauf fährt: alle, die weder der Haken schon
 * einzeln aufruft noch begründet draußen stehen.
 *
 * @param {{name: string, werkzeug: string}[]} pruefer  das Prüferregister
 */
export function imSchnelllauf(pruefer, ruft = HAKEN[0].ruft, draussen = NICHT_IM_HAKEN) {
  const raus = new Set(draussen.map((e) => e.pruefer));
  return pruefer.filter((p) => !raus.has(p.name) && !ruft.includes(`bin/${p.werkzeug}`));
}

/**
 * Hält die Auswahl gegen das Prüferregister — in beide Richtungen.
 *
 * Gemeldet wird dreierlei: ein Prüfer, der weder läuft noch einen Grund hat;
 * ein Grund, der auf einen Prüfer zeigt, den es nicht gibt; und ein Prüfer,
 * der zugleich im Haken steht und als ausgenommen geführt wird — das letzte
 * ist die stille Sorte, weil beide Seiten für sich richtig aussehen.
 */
export function auswahlbefund(pruefer, ruft = HAKEN[0].ruft, draussen = NICHT_IM_HAKEN) {
  const meldungen = [];
  const bekannt = new Set(pruefer.map((p) => p.name));
  const direkt = new Set(
    pruefer.filter((p) => ruft.includes(`bin/${p.werkzeug}`)).map((p) => p.name),
  );

  for (const e of draussen) {
    if (!bekannt.has(e.pruefer)) {
      meldungen.push({
        regel: 'grund-ohne-pruefer',
        text: `NICHT_IM_HAKEN nennt „${e.pruefer}" — diesen Prüfer gibt es im Register nicht`,
      });
    }
    if (direkt.has(e.pruefer)) {
      meldungen.push({
        regel: 'ausgenommen-und-drin',
        text: `${e.pruefer} steht als ausgenommen geführt und wird vom Haken trotzdem aufgerufen`,
      });
    }
    if (!e.warum || e.warum.length < 80) {
      meldungen.push({
        regel: 'grund-zu-duenn',
        text: `${e.pruefer}: der Grund trägt den Verzicht nicht`,
      });
    }
  }

  // Alles Übrige fährt der Schnelllauf. Dafür gibt es hier keine Meldung: Die
  // Gegenprobe ist der Lauf selbst, der genau diese Liste nimmt.
  return {
    geprueft: pruefer.length,
    imHaken: direkt.size,
    imSchnelllauf: imSchnelllauf(pruefer, ruft, draussen).length,
    draussen: draussen.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
