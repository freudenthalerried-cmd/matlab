/**
 * Sätze, die in mehr als einer Quelldatei stehen.
 *
 * **Der Anlass, 14. September 2026.** Ein Satz steht in diesem Bestand seit dem
 * 8. September und ist seither vier Runden lang durch Zufall wiedergefunden
 * worden — am 8., 11., 13. und 14.:
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 *
 * Das Zwillingsregister für **Zahlen** gibt es seit dem 11. September. Für
 * **Sätze** gab es keines, und Sätze sind der häufigere Fall: Eine Zahl wird
 * abgeschrieben, weil sie kurz ist; ein Absatz wird kopiert, weil er stimmt.
 *
 * ## Gemessen
 *
 * Über `src/` und `bin/`: **10.569** Sätze mit mindestens acht Wörtern, davon
 * **101 in mehr als einer Datei**. Die Spitze:
 *
 * | Dateien | Satz |
 * |---|---|
 * | 6 | der Absatz über die Frischeweigerung — **samt des Satzes, der Text stehe „dort eine Fassung für alle"** |
 * | 7 | „Wie lang eine Begründung mindestens sein muss, um eine zu sein." |
 * | 3 | § 132 BAO und die Durchschriftpflicht |
 *
 * > **Ein Satz, der sagt, es gebe ihn nur einmal, stand sechsmal.**
 *
 * ## Was hier **nicht** gemeldet wird
 *
 * Nicht jede Wiederholung ist ein Fehler, und die Unterscheidung ist dieselbe
 * wie beim Zahlenregister: Geführt wird, was eine **Heimat** hat.
 *
 * - Eine **Rechtsstelle** (§ 132 BAO) gehört dorthin, wo sie wirkt. Sie steht
 *   nicht zweimal, weil jemand sie abgeschrieben hat, sondern weil sie zweimal
 *   gilt — und ein Verweis auf eine andere Datei wäre für den Lesenden eine
 *   Verschlechterung.
 * - Ein **Dateikopf**, der in einer Prüfdatei den Gegenstand nennt, wiederholt
 *   den Satz des geprüften Moduls absichtlich: `test/tagx.test.js` steht neben
 *   `src/tagx.js`, und wer die Prüfung liest, soll die Behauptung sehen.
 *
 * Gemeldet wird, was eine **Erklärung eines Mechanismus** ist und an einer
 * Stelle stehen könnte. Die Grenze ist gezogen, nicht gerechnet — deshalb ein
 * Register mit Pflichtgrund und eine Sperrklinke, die fallen darf und nicht
 * steigen.
 */

/** Dateien, die über den Bestand reden und ihn deshalb zitieren. */
export const REDEN_UEBER_DEN_BESTAND = Object.freeze([
  'src/zwillingszahlen.js',
  'src/zwillingssaetze.js',
  'src/gegenprobenregister.js',
  'src/allaussage.js',
]);

/**
 * Die Sätze einer Quelldatei — aus Kommentaren **und** Zeichenketten.
 *
 * Beide zählen: Ein Absatz, der sechsmal im Kopf steht, ist so doppelt wie
 * eine Meldung, die sechsmal ausgegeben wird. Weggelassen wird, was wie Code
 * aussieht; ein kopiertes Stück Code ist eine andere Frage als ein kopierter
 * Satz, und für sie gibt es andere Werkzeuge.
 */
export function saetzeDerQuelle(quelltext) {
  const text = String(quelltext ?? '');
  const stuecke = [];
  /*
   * **Herausgeschnitten, nicht weggestrichen.** Der erste Entwurf hat die
   * Kommentarzeichen durch Leerzeichen ersetzt und den Rest stehen lassen —
   * und damit lief der letzte Satz eines Blockkommentars in die Codezeile
   * darunter. Ein Satz, der mit `const hier = dirname(…);` beginnt, fällt
   * durch den Filter, der Code aussortiert: **Der Absatz war unsichtbar,
   * statt gezählt zu werden.**
   *
   * > **Ein Leser, der den Code wegstreicht, liest immer noch den Code.**
   *
   * Genommen wird deshalb, was gesucht ist: Blockkommentare, Zeilenkommentare
   * und Zeichenketten. Was dazwischen steht, kommt gar nicht erst mit.
   */
  for (const t of text.matchAll(/\/\*[\s\S]*?\*\//g)) stuecke.push(t[0].slice(2, -2));
  for (const t of text.matchAll(/(^|[^:\\])\/\/([^\n]*)/g)) stuecke.push(t[2]);
  for (const t of text.matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g)) stuecke.push(t[2]);

  const saetze = new Set();
  for (const stueck of stuecke) {
    const roh = stueck.replace(/^\s*\*\s?/gm, ' ');
    for (const satz of roh.split(/(?<=[.!?])\s+|\n\s*\n/)) {
      const s = satz.replace(/\s+/g, ' ').trim();
      if (s.split(' ').length < 8) continue;
      if (!/[a-zäöüß]/.test(s)) continue;
      if (/[{};=<>]|=>|\$\{/.test(s)) continue;
      saetze.add(s);
    }
  }
  return saetze;
}

/**
 * Steht der Satz in beiden Dateien **ganz oben** — als das, worum es geht?
 *
 * **Die Bauart, gemessen am 14. September 2026.** Von 40 wiederholten Sätzen
 * gehören sechzehn derselben Form an: Ein Modul und sein Prüfer tragen
 * dieselbe **Leitfrage** in der ersten Zeile ihres Dateikopfs.
 *
 * > *„Steht jede Gate-Entscheidung noch im Bestand — oder nur noch im
 * > Dokument?"* — `src/gatestand.js` und `bin/gatepruefung.mjs`
 *
 * Das ist keine Abschrift, sondern zweimal dieselbe Auskunft an zwei
 * Leserinnen: Wer das Modul öffnet, will wissen, was es entscheidet; wer das
 * Werkzeug öffnet, was es prüft. Ein Verweis statt der Frage machte beide
 * Dateien schlechter lesbar und spart nichts.
 *
 * > **Zwei Hälften einer Sache dürfen denselben Namen tragen.**
 *
 * Die Regel ist eng gefasst und deshalb entscheidbar: **genau zwei** Dateien,
 * **eine** davon aus `src/` und **eine** aus `bin/`, und der Satz steht in
 * beiden im **Kopf** — innerhalb der ersten Zeilen. Ein Absatz, der irgendwo
 * in der Mitte zweimal steht, ist keine Leitfrage, sondern eine Kopie.
 */
export const KOPFZEILEN = 6;

export function istLeitfrage(satz, dateien, quellen) {
  if (dateien.length !== 2) return false;
  const ausSrc = dateien.filter((d) => d.startsWith('src/'));
  const ausBin = dateien.filter((d) => d.startsWith('bin/'));
  if (ausSrc.length !== 1 || ausBin.length !== 1) return false;
  const anfang = satz.split(' ').slice(0, 6).join(' ');
  return dateien.every((d) => {
    const kopf = String(quellen.get(d) ?? '').split('\n').slice(0, KOPFZEILEN).join(' ');
    return kopf.includes(anfang);
  });
}

/**
 * Wiederholungen, die mit Grund stehen dürfen.
 *
 * Geführt wird ein **Anfang** und die Zahl der Dateien, in denen der Satz
 * stehen darf — beides, weil ein Grund für zwei Fundstellen keiner für sieben
 * ist.
 */
export const WIEDERHOLUNG_GEPRUEFT = Object.freeze([
  Object.freeze({
    anfang: 'Wie lang eine Begründung mindestens sein muss',
    hoechstens: 8,
    warum: 'Sieben Module führen eine eigene `GRUND_MINDESTLAENGE`, und jedes mit derselben '
      + 'Zeile darüber. Die Zahl selbst ist bewusst je Register verschieden — ein Grund für '
      + 'eine Gate-Entscheidung wiegt anders als einer für einen Korbtext —, und der erklärende '
      + 'Satz ist derselbe, weil der Begriff derselbe ist. Ihn zu vereinheitlichen hieße, sieben '
      + 'verschiedene Zahlen unter einen Namen zu zwingen.',
  }),
  Object.freeze({
    anfang: 'Vorhanden ist nicht dasselbe wie aktuell.',
    hoechstens: 8,
    warum: 'Ein **Verweis** an der Stelle, an der die Weigerung steht — sechs Werkzeuge rufen '
      + '`frischebefund` an ganz verschiedenen Stellen ihres Ablaufs, und wer dort liest, soll '
      + 'in zwei Zeilen erfahren, warum. Bis zum 14. September stand hier der ganze Absatz, '
      + 'sechsmal wörtlich; jetzt steht die Begründung in `src/erzeugnisstand.js` und hier der '
      + 'Weg dorthin. Gar kein Wort wäre die schlechtere Wahl.',
  }),
  Object.freeze({
    anfang: 'Hält das Register gegen die Wirklichkeit',
    hoechstens: 4,
    warum: 'Der Satz benennt die Bauart, die dieses Haus überall verwendet: eine Liste, ein '
      + 'Pflichtgrund und ein Prüfer, der beides gegen den Bestand hält. Er steht über drei '
      + 'verschiedenen Registern und sagt dort dasselbe, weil dort dasselbe geschieht — eine '
      + 'gemeinsame Fassung gäbe es nur mit einer gemeinsamen Funktion, und die drei haben '
      + 'verschiedene Gegenstände.',
  }),
  Object.freeze({
    anfang: 'ist der Selbstnachweis über eine absichtlich fehlerhafte Datei',
    hoechstens: 3,
    warum: 'Drei Werkzeuge behandeln `--probe` selbst, jedes an seiner eigenen Abbruchstelle, '
      + 'und der Zweisatz steht dort, wo die Schaltung steht. Er erklärt eine Ausnahme, die '
      + 'ohne Erklärung wie ein Fehler aussieht — ein Prüfer, der bei Funden gruen bleibt. Ein '
      + 'Verweis auf eine vierte Datei machte alle drei schlechter lesbar und spart nichts.',
  }),
  Object.freeze({
    anfang: 'Er soll finden und melden, nicht sperren',
    hoechstens: 3,
    warum: 'Die zweite Zeile desselben Zweisatzes, aus demselben Grund. Sie steht neben der '
      + 'Bedingung, die sie begründet, und gehört dorthin — getrennt von ihr wäre sie eine '
      + 'Regel ohne Ort.',
  }),
  Object.freeze({
    anfang: '§ 132 BAO verlangt die Belege sieben Jahre',
    hoechstens: 3,
    warum: 'Eine Rechtsstelle gehört dorthin, wo sie wirkt: in die Ablageprüfung, in die '
      + 'Bestellprobe und in die Prüfung des Vorgangswerkzeugs. Sie steht nicht dreimal, weil '
      + 'jemand sie abgeschrieben hat, sondern weil sie dreimal gilt — ein Verweis auf eine '
      + 'andere Datei wäre für den Lesenden eine Verschlechterung.',
  }),
  Object.freeze({
    anfang: '§ 131 Abs 1 Z 5 BAO verlangt den Geschäftsfall rückführbar',
    hoechstens: 2,
    warum: 'Dieselbe Bauart: eine Rechtsstelle an den beiden Stellen, an denen sie die '
      + 'Entscheidung trägt — in der Ablageprüfung und im Aktenwerkzeug. Wer eine Akte baut, '
      + 'soll die Vorschrift sehen und nicht erst suchen.',
  }),
]);

/** Wie viele Sätze in mehr als einer Datei stehen dürfen. */
export const WIEDERHOLUNGEN_HOECHSTENS = 30;

/**
 * Hält die Sätze gegen den Bestand.
 *
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 * @param {object[]} gefuehrt
 * @param {number|null} hoechstens  Sperrklinke; `null` schaltet sie ab
 */
export function satzbefund(quellen, gefuehrt = WIEDERHOLUNG_GEPRUEFT,
  hoechstens = WIEDERHOLUNGEN_HOECHSTENS) {
  const wo = new Map();
  for (const [pfad, text] of quellen) {
    if (REDEN_UEBER_DEN_BESTAND.includes(pfad)) continue;
    for (const satz of saetzeDerQuelle(text)) {
      if (!wo.has(satz)) wo.set(satz, []);
      wo.get(satz).push(pfad);
    }
  }

  const meldungen = [];
  const mehrfach = [];
  const leitfragen = [];
  const getroffen = new Set();

  for (const [satz, dateien] of wo) {
    if (dateien.length < 2) continue;
    /*
     * **Enthalten, nicht beginnend.** Ein Satz beginnt in diesem Bestand oft
     * mit einer Auszeichnung — `**Vorhanden ist nicht dasselbe wie aktuell.**`
     * trägt die Sternchen mit, und ein Eintrag, der auf den Anfang prüft,
     * träfe ihn nicht. Gesucht wird deshalb das kennzeichnende Stück; dass es
     * kennzeichnend genug ist, hält `test/zwillingssaetze.test.js`.
     */
    /*
     * Zuerst die **Bauart**: Ein Modul und sein Prüfer dürfen dieselbe
     * Leitfrage im Kopf tragen. Eine Regel mit einem Grund deckt hier sieben
     * Fälle — sieben einzelne Gründe wären siebenmal derselbe Satz und damit
     * genau das, was dieser Prüfer sucht.
     */
    if (istLeitfrage(satz, dateien, quellen)) { leitfragen.push({ satz, dateien }); continue; }
    const eintrag = gefuehrt.find((g) => satz.includes(g.anfang));
    if (eintrag) {
      getroffen.add(eintrag);
      if (dateien.length > eintrag.hoechstens) {
        meldungen.push({
          regel: 'mehr-fundstellen-als-begruendet',
          wo: eintrag.anfang,
          text: `„${eintrag.anfang}…" steht in ${dateien.length} Dateien, begründet sind `
            + `${eintrag.hoechstens}`,
        });
      }
      continue;
    }
    mehrfach.push({ satz, dateien });
  }
  mehrfach.sort((a, b) => b.dateien.length - a.dateien.length);

  for (const g of gefuehrt) {
    if (!getroffen.has(g)) {
      meldungen.push({
        regel: 'grund-ohne-satz',
        wo: g.anfang,
        text: `„${g.anfang}…" steht als begründete Wiederholung und steht nicht mehr in `
          + 'mehr als einer Datei',
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', wo: g.anfang, text: `„${g.anfang}…": Grund zu dünn` });
    }
  }

  if (hoechstens != null && mehrfach.length > hoechstens) {
    meldungen.push({
      regel: 'mehr-wiederholungen-als-erlaubt',
      text: `${mehrfach.length} Sätze stehen in mehr als einer Datei — erlaubt sind ${hoechstens}`,
    });
  }
  if (hoechstens != null && mehrfach.length < hoechstens) {
    meldungen.push({
      regel: 'sperrklinke-nachziehen',
      text: `nur noch ${mehrfach.length} wiederholte Sätze — die Schranke steht auf `
        + `${hoechstens} und gehört nachgezogen (WIEDERHOLUNGEN_HOECHSTENS in src/zwillingssaetze.js)`,
    });
  }

  return {
    saetze: wo.size,
    leitfragen,
    mehrfach,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
