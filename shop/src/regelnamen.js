/**
 * Wie viele Regeln gibt es — und wie viele hat je jemand feuern sehen?
 *
 * **Der Anlass, 14. September 2026, abends.** Jeder Prüfer dieses Hauses
 * meldet in derselben Form: `{ regel, text }`. Die `regel` ist der Name des
 * Befundes, und an ihm hängt alles Weitere — der Gegenprobenlauf sucht ihn in
 * der Ausgabe, ein Testfall behauptet ihn, ein Dokument nennt ihn. Gezählt
 * wurde er nie.
 *
 * Gezählt ergibt: **473 Stellen, 412 Namen — und 80 Stellen, deren Name in
 * keinem einzigen Testfall vorkommt.** Das ist kein Beweis, dass sie falsch
 * sind. Es ist der Beweis, dass sie **niemand hat feuern sehen**:
 *
 * > **Eine Regel, die nie gefeuert hat, ist kein Prüfsatz, sondern ein
 * > Vorsatz.** Ob ihr Text stimmt, ob ihre Bedingung je zutrifft, ob sie den
 * > Fall trifft, für den sie geschrieben wurde — das alles ist offen, solange
 * > sie nur dasteht.
 *
 * ## Warum das Zählen selbst der erste Fund war
 *
 * „Hier entsteht eine Regel" steht in **drei** Schreibweisen im Haus:
 *
 * | Schreibweise | Stellen | Beispiel |
 * |---|---|---|
 * | Feld | 400 | `meldungen.push({ regel: 'kopf-ohne-stand', … })` |
 * | örtlicher Melder | 67 | `melde('uhr-unbekannt', …)`, `sag('alles-fremd', …)` |
 * | Fallunterscheidung | 6 | `regel: leicht ? 'leicht-und-sperrgut' : 'schwer-und-frei'` |
 *
 * Mein erster Zähler kannte nur die erste und meldete 347 Namen — und in der
 * Gegenrichtung zehn Namen, die ein Testfall behauptet und die es angeblich
 * nicht gibt. Alle zehn gab es; sie standen nur in der zweiten Schreibweise.
 *
 * > **Ein Verzeichnis, das eine von drei Schreibweisen kennt, meldet die
 * > anderen beiden als fehlend — und liest sich dabei wie ein Fund.**
 *
 * Der örtliche Melder heißt in jeder Datei anders (`melde`, `sag`). Gefunden
 * wird er nicht am Namen, sondern daran, **was er tut**: eine Funktion, deren
 * erster Parameter `regel` heißt und die ein Objekt mit diesem Feld ablegt.
 *
 * ## Was sich nicht zählen lässt
 *
 * Zwei Regelnamen entstehen erst zur Laufzeit (`` `ohne-${name}` ``). Sie
 * stehen in `GEBAUT_GEPRUEFT` mit Grund — ein Name, den kein Verzeichnis
 * kennt, ist kein Fehler, solange jemand weiß, dass es ihn gibt.
 */

import { ohneKommentare } from './entkommentieren.js';

/** Woran ein örtlicher Melder erkannt wird: erster Parameter `regel`. */
const MELDERKOPF = /(?:const\s+([A-Za-z_$][\w$]*)\s*=\s*\(\s*regel\s*[,)]|function\s+([A-Za-z_$][\w$]*)\s*\(\s*regel\s*[,)])/g;

/** … und daran, dass er ein Objekt mit diesem Feld ablegt. */
const MELDERRUMPF = /\{\s*regel\s*[,:]/;

/**
 * Jeder Melder einer Datei — Name und Fundstelle.
 *
 * Die Rumpfprobe ist nötig, nicht schmückend: `frachtbetrag(regel, …)` in
 * `src/frachtsatz.js` nimmt eine **Frachtregel** entgegen. Ohne sie zählte
 * dieses Verzeichnis einen Preisrechner als Meldeweg.
 */
export function melderNamen(quelltext) {
  const gefunden = [];
  for (const m of String(quelltext).matchAll(MELDERKOPF)) {
    const name = m[1] ?? m[2];
    if (MELDERRUMPF.test(String(quelltext).slice(m.index, m.index + 200))) gefunden.push(name);
  }
  return [...new Set(gefunden)];
}

/**
 * Jede Regelstelle einer Datei.
 *
 * Gezählt wird **je Datei einmal je Name**: Dieselbe Regel zweimal in einer
 * Datei ist ein Befund mit zwei Anlässen, nicht zwei Regeln.
 *
 * @returns {{pfad: string, regel: string, art: 'feld'|'melder'|'wahl'}[]}
 */
export function regelstellen(pfad, quelltext) {
  // **Gelesen wird der Code, nicht die Prosa — 14. September 2026,
  // nachmittags.** Vorher lief die Suche über den Rohtext, und die Tafel im
  // Kopf dieser Datei zählte als drei Regelstellen: `kopf-ohne-stand`,
  // `leicht-und-sperrgut`, `schwer-und-frei` stehen dort als **Beispiele**.
  //
  // > **Ein Verzeichnis, das seine eigene Erklärung mitzählt, meldet sich
  // > selbst als Bestand.**
  const text = ohneKommentare(String(quelltext ?? '')).text;
  const drin = new Map();
  const nimm = (regel, art) => { if (!drin.has(regel)) drin.set(regel, art); };
  for (const m of text.matchAll(/regel:\s*'([a-z0-9-]+)'/g)) {
    if (!istMeldung(text, m.index)) continue;
    nimm(m[1], 'feld');
  }
  for (const m of text.matchAll(/regel:\s*[^,\n]*\?\s*'([a-z0-9-]+)'\s*:\s*'([a-z0-9-]+)'/g)) {
    nimm(m[1], 'wahl');
    nimm(m[2], 'wahl');
  }
  for (const name of melderNamen(text)) {
    for (const m of text.matchAll(new RegExp(`\\b${name}\\(\\s*'([a-z0-9-]+)'`, 'g'))) nimm(m[1], 'melder');
  }
  return [...drin].map(([regel, art]) => ({ pfad, regel, art }));
}

/**
 * Steht dieses `regel:` in einer **Meldung** — oder in einem Verzeichnis
 * **über** Meldungen?
 *
 * **Der Fund, 14. September 2026, nachts.** Die Zählung führte zwei Regeln
 * dieses Moduls selbst als „nie gesehen": `menge-kommt-anders-zurueck` und
 * `krummer-betrag-wird-uebernommen`. Es gibt sie hier nicht — sie stehen in
 * `REGEL_GEPRUEFT`, also in dem Verzeichnis, das begründet, warum man sie
 * **anderswo** nicht sieht.
 *
 * > **Ein Verzeichnis, das Regelnamen führt, erzeugt keine Regeln.** Dieselbe
 * > Lehre wie beim Zahlenregister, das sich am 11. September dreimal selbst
 * > meldete, weil es jede geführte Zahl im Feld `literal` mitträgt.
 *
 * Unterschieden wird am Nachbarn: Ein Eintrag, der ein `warum:` trägt, ist ein
 * **Grund**, keine Meldung. Gemessen über den Bestand trifft das genau vier
 * Stellen — zwei hier und zwei in `src/gegenprobenregister.js`, wo der
 * Suchtext einer Gegenprobe eine Meldezeile **zitiert**.
 */
function istMeldung(text, stelle) {
  const bis = text.slice(stelle, stelle + 500);
  const ende = bis.indexOf('}),');
  return !/\bwarum:/.test(ende > 0 ? bis.slice(0, ende) : bis);
}

/** Regelnamen, die erst zur Laufzeit entstehen. */
export function gebauteRegeln(pfad, quelltext) {
  return [...String(quelltext).matchAll(/regel:\s*`([^`]*\$\{[^`]*)`/g)]
    .map((m) => ({ pfad, roh: m[1] }));
}

/**
 * Gebaute Regelnamen, die mit Grund gebaut werden.
 *
 * Geführt wird der Rohtext, wie er im Quelltext steht — ein zweiter gebauter
 * Name in derselben Datei fiele sonst durch.
 */
export const GEBAUT_GEPRUEFT = Object.freeze([
  Object.freeze({
    roh: 'ohne-${name}',
    pfad: 'src/verweise.js',
    warum: 'Der Verweisprüfer geht dieselben drei Fragen für jede geführte Verweisart durch. '
      + 'Der Name der Art gehört in den Regelnamen, weil die Meldung sonst für alle Arten '
      + 'gleich hieße und ein Leser der Ausgabe nicht sähe, welche fehlt. Der Preis ist, dass '
      + 'kein Verzeichnis diese Namen kennt — deshalb stehen sie hier.',
  }),
  Object.freeze({
    roh: '${name}-doppelt',
    pfad: 'src/verweise.js',
    warum: 'Dieselbe Bauart wie `ohne-${name}` und derselbe Grund: Welche Verweisart doppelt '
      + 'steht, ist die halbe Meldung. Beide zusammen erzeugen so viele Regelnamen, wie es '
      + 'Verweisarten gibt; ein Verzeichnis müsste die Artenliste mitlesen, um sie zu kennen, '
      + 'und wäre damit an dieselbe Liste gebunden wie der Prüfer selbst.',
  }),
]);

/**
 * Regeln, die kein Testfall sehen kann — mit Grund.
 *
 * Der Grund muss sagen, **warum nicht**, nicht bloß, dass es aufwendig wäre.
 * Eine Regel, die nur mühsam zu sehen ist, gehört gesehen.
 */
export const REGEL_GEPRUEFT = Object.freeze([
  Object.freeze({
    regel: 'menge-kommt-anders-zurueck',
    pfad: 'src/anfragelesen.js',
    warum: 'Sie bewacht ein **Paar** aus Schreiber und Leser: Kommt aus einer Zeile des '
      + 'Anfragetexts eine andere Menge zurück, als bestellt wurde, nennt der Beleg eine andere '
      + 'Ware als die bestellte — und in Geld ist der Unterschied kleiner als ein Cent. Sie '
      + 'schweigt heute, weil `lesePositionen` eine Zeile schon verwirft, deren Summe um mehr '
      + 'als einen halben Cent von einem ganzen Gebinde abweicht. Gemessen am 14. September: '
      + 'Mit abgeschalteter Cent-Prüfung feuert sie sofort. Die Gegenprobe '
      + '`der-leser-nimmt-jede-zeilensumme-hin` schaltet genau diese Sperre ab.',
  }),
  Object.freeze({
    regel: 'krummer-betrag-wird-uebernommen',
    pfad: 'src/anfragelesen.js',
    warum: 'Die Gegenrichtung derselben Bewachung: Eine Zeilensumme **zwischen** zwei ganzen '
      + 'Gebinden darf der Leser nicht auf eines davon runden — sonst bestünde auch eine '
      + 'Fassung den Rückweg, die jede Zahl rundet. Auch sie schweigt, solange die Cent-Prüfung '
      + 'in `lesePositionen` hält, und feuert sofort, wenn man sie abschaltet. '
      + 'Eine Regel, die eine zweite Sperre bewacht, schweigt, solange die erste hält — und '
      + 'wird gebraucht, wenn jemand die erste lockert.',
  }),
]);

/**
 * Namen, die ein Testfall **erfindet** — mit Grund.
 *
 * Die Gegenrichtung unten meldet jeden Namen, den ein Testfall behauptet und
 * den keine Quelle trägt. Das ist der gefährlichere Fall: Ein Prüfsatz, dessen
 * Regel umbenannt wurde, ist grün, weil er nichts mehr prüfen kann.
 *
 * Es gibt aber einen zweiten Grund, warum ein Name nur im Test steht: Eine
 * Reihe, die einen Befund gegen **eigene** Attrappen fährt, muss Namen
 * erfinden dürfen. Geführt wird deshalb die Datei **und die Liste** — ein
 * fünfter erfundener Name in derselben Datei fällt weiter auf.
 */
export const ERFUNDEN_GEPRUEFT = Object.freeze([
  Object.freeze({
    datei: 'test/regelnamen.test.js',
    regeln: Object.freeze(['attrappe', 'echte-regel', 'gibt-es', 'gibt-es-nicht-mehr',
      'jetzt-gesehen', 'nie-gesehen']),
    warum: 'Die Reihe, die dieses Verzeichnis prüft, reicht ihre eigenen Quellen und ihre '
      + 'eigenen Testtexte herein und sieht jede seiner Regeln daran anschlagen. Die sechs '
      + 'Namen stehen in den Attrappen beider Seiten; sie in `src/` anzulegen hieße, für einen '
      + 'Prüfsatz eine Regel zu erfinden, die niemand meldet. Ein Prüfer, der andere daran '
      + 'misst, ob man sie feuern sah, braucht Namen, die es nicht gibt.',
  }),
]);

/**
 * Wie viele Regelstellen ohne einen Testfall stehen bleiben dürfen.
 *
 * **Eine Sperrklinke, gesetzt auf den gemessenen Stand.** Sie darf fallen und
 * nie steigen. Gemessen am 14./15. September: 80 → 67 → 56 → 47 → 43 → 38 → **31**
 * von 484
 * Stellen. Die letzten elf sind an einem Abend gefallen, und zwar nicht durch
 * Fleiß: Zwei Befunde lasen ihre Register **unmittelbar aus dem Modul** und
 * waren damit unerreichbar, genau wie `papierschrittbefund()` am Vormittag.
 *
 * > **Wer dreimal am selben Tag dieselbe Bauart findet, hat keine drei Funde,
 * > sondern eine Gewohnheit gefunden.**
 */
export const UNGESEHENE_HOECHSTENS = 31;

/**
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 * @param {Map<string, string>} tests    Pfad → Quelltext der Testdateien
 */
export function regelbefund(quellen, tests, gefuehrt = REGEL_GEPRUEFT,
  hoechstens = UNGESEHENE_HOECHSTENS, gebautGefuehrt = GEBAUT_GEPRUEFT,
  erfunden = ERFUNDEN_GEPRUEFT) {
  const stellen = [];
  const gebaut = [];
  for (const [pfad, text] of quellen) {
    stellen.push(...regelstellen(pfad, text));
    gebaut.push(...gebauteRegeln(pfad, text));
  }
  const namen = new Set(stellen.map((s) => s.regel));

  const testtext = [...tests.values()].join('\n');
  const genannt = (regel) => testtext.includes(`'${regel}'`) || testtext.includes(`"${regel}"`);

  const meldungen = [];
  const getroffen = new Set();
  const ungesehen = [];
  for (const s of stellen) {
    if (genannt(s.regel)) continue;
    const eintrag = gefuehrt.find((g) => g.regel === s.regel && g.pfad === s.pfad);
    if (eintrag) { getroffen.add(eintrag); continue; }
    ungesehen.push(s);
  }
  ungesehen.sort((a, b) => a.pfad.localeCompare(b.pfad) || a.regel.localeCompare(b.regel));

  // Die Gegenrichtung: Ein Testfall behauptet einen Namen, den es nicht gibt.
  // Er ist dann grün, weil er nichts mehr prüfen kann — die gefährlichere
  // Hälfte, denn ein fehlender Prüfsatz meldet sich, ein toter nicht.
  const behauptet = new Map();
  for (const [pfad, text] of tests) {
    for (const m of text.matchAll(/regel\s*===\s*'([a-z0-9-]+)'/g)) {
      if (!namen.has(m[1])) {
        if (!behauptet.has(m[1])) behauptet.set(m[1], new Set());
        behauptet.get(m[1]).add(pfad);
      }
    }
  }
  const erfundenGetroffen = new Set();
  for (const [regel, wo] of behauptet) {
    const offen = [...wo].filter((datei) => {
      const e = erfunden.find((x) => x.datei === datei && x.regeln.includes(regel));
      if (e) { erfundenGetroffen.add(`${datei}|${regel}`); return false; }
      return true;
    });
    if (offen.length === 0) continue;
    meldungen.push({
      regel: 'regel-behauptet-ohne-stelle',
      text: `\`${regel}\` wird in ${offen.join(', ')} behauptet und steht in keiner Quelle`,
    });
  }
  for (const e of erfunden) {
    for (const regel of e.regeln) {
      if (erfundenGetroffen.has(`${e.datei}|${regel}`)) continue;
      meldungen.push({
        regel: 'erfundener-name-ohne-fall',
        text: namen.has(regel)
          ? `\`${regel}\` steht in ${e.datei} als erfunden und ist ein Regelname geworden`
          : `\`${regel}\` steht in ${e.datei} als erfunden und wird dort nicht mehr behauptet`,
      });
    }
    if (!e.warum || e.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `${e.datei}: Grund zu dünn` });
    }
  }

  for (const g of gefuehrt) {
    if (!getroffen.has(g)) {
      meldungen.push({
        regel: 'grund-ohne-regel',
        text: `\`${g.regel}\` (${g.pfad}) steht als begründet ungesehen und ist es nicht mehr`,
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `\`${g.regel}\`: Grund zu dünn` });
    }
  }

  for (const g of gebautGefuehrt) {
    if (!gebaut.some((x) => x.roh === g.roh && x.pfad === g.pfad)) {
      meldungen.push({
        regel: 'grund-ohne-gebaute-regel',
        text: `\`${g.roh}\` (${g.pfad}) steht als begründet gebaut und wird dort nicht gebaut`,
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `\`${g.roh}\`: Grund zu dünn` });
    }
  }
  for (const x of gebaut) {
    if (!gebautGefuehrt.some((g) => g.roh === x.roh && g.pfad === x.pfad)) {
      meldungen.push({
        regel: 'gebaute-regel-ungefuehrt',
        text: `\`${x.roh}\` in ${x.pfad} entsteht zur Laufzeit und steht in keinem Verzeichnis`,
      });
    }
  }

  if (hoechstens != null && ungesehen.length > hoechstens) {
    meldungen.push({
      regel: 'mehr-ungesehene-als-erlaubt',
      text: `${ungesehen.length} Regelstellen hat kein Testfall je feuern sehen — `
        + `erlaubt sind ${hoechstens}`,
    });
  }
  if (hoechstens != null && ungesehen.length < hoechstens) {
    meldungen.push({
      regel: 'sperrklinke-nachziehen',
      text: `nur noch ${ungesehen.length} ungesehene Regelstellen — die Schranke steht auf `
        + `${hoechstens} und gehört nachgezogen (UNGESEHENE_HOECHSTENS in src/regelnamen.js)`,
    });
  }

  return { stellen, namen, gebaut, ungesehen, meldungen, sauber: meldungen.length === 0 };
}
