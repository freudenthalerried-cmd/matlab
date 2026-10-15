/**
 * Wird ein Beiwert, der ein Register hereinlässt, auch wirklich gezogen?
 *
 * **Der Anlass, 15. September 2026.** Am Abend zuvor sind zwölf Regeln
 * erreichbar geworden, die ihr eigenes Register bewachen — sie prüfen nicht
 * die Welt, sondern die Liste, aus der der Befund selbst liest. Erreichbar
 * wurden sie dadurch, dass das Register als Beiwert hereinkommt:
 *
 *     export function punktebefund({ …, ohneMessung = OHNE_MESSUNG }) {
 *
 * Und genau dort lag der Fund: Die Kopfzeile trug den Beiwert schon, der
 * Rumpf nannte an **vier** Stellen weiter `OHNE_MESSUNG`. Von außen war
 * nichts zu erreichen, von innen sah alles offen aus.
 *
 * > **Eine Tür, die man einbaut und nicht benutzt, ist eine Wand mit
 * > Beschlag.**
 *
 * Aufgefallen ist das beim Lesen, nicht beim Messen. Das ist der Grund für
 * diesen Prüfer: Er sieht jede Kopfzeile an, die eine Registervorgabe trägt,
 * und hält sie gegen den Rumpf — in beide Richtungen.
 *
 * ## Was er ausdrücklich **nicht** prüft
 *
 * Nicht, ob eine Befundfunktion ihr Register überhaupt hereinlässt. Gemessen
 * am 15. September lesen **84 von 183** Befundfunktionen irgendeine
 * Modulkonstante unmittelbar — und die allermeisten davon sind Suchmuster,
 * Umsatzsteuersätze oder Zeilenmasse, bei denen ein Beiwert nichts erreichbar
 * machte, sondern nur eine Stellschraube mehr wäre. Ein Prüfer über diese 84
 * hätte an vier von fünf Stellen unrecht.
 *
 * > **Eine Bauart ist kein Befund, sondern ein Verdacht** — dieselbe
 * > Entscheidung wie am 13. September über die Kopfzeilenprüfung.
 *
 * Dieser Prüfer misst nur, was schon entschieden ist: Wo jemand die Tür
 * gebaut hat, muss sie auch die einzige sein.
 */

import { bisSchliessend, nurCode } from './testzerlegung.js';

/** Eine Funktionskopfzeile mit Namen. */
const FUNKTIONSKOPF = '\\bfunction\\s+([A-Za-z_$][\\w$]*)\\s*\\(';

/** Eine Pfeilfunktion mit Namen: `const x = (…) =>`. */
const PFEILKOPF = '\\bconst\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*(?:async\\s+)?\\(';

/**
 * Eine Registervorgabe in der Klammer: `register = ZULIEFERUNGEN`.
 *
 * Grossgeschrieben mit mindestens drei Zeichen — das trennt ein Register von
 * einer Klassenschreibweise und von einem einzelnen Buchstaben.
 *
 * **Als Quelltext und nicht als Ausdruck — 15. September 2026, der erste Lauf
 * dieses Prüfers.** Hier stand ein `/…/g`, den zwei Funktionen teilten: die
 * eine rief `.test()`, die andere `matchAll()`. Beide lesen und schreiben
 * `lastIndex`, und zwar über Aufrufe hinweg. Der Prüfer meldete daraufhin
 * einen Beiwert namens `eter` — die zweite Hälfte von `anbieter`, weil die
 * Suche mitten im Wort ansetzte — und zählte 117 statt 168 Vorgaben.
 *
 * > **Ein globaler Ausdruck, den zwei Funktionen teilen, teilt auch seinen
 * > Stand.**
 *
 * Deshalb steht hier die Quelle und kein Ausdruck: Jede Stelle baut sich ihren
 * eigenen, und keiner trägt den Stand einer anderen Zeile mit sich.
 */
const VORGABE = '(?<![\\w$])([A-Za-z_$][\\w$]*)\\s*=\\s*([A-Z][A-Z0-9_]{2,})\\b';

/**
 * Wie wenige Kopfzeilen mit Registervorgabe noch etwas aussagen.
 *
 * **Eine Untergrenze, keine Sperrklinke.** Sie soll nicht fallen, wenn Beiwerte
 * dazukommen; sie fängt den Fall ab, dass die Zerlegung bricht und der Prüfer
 * mit „nichts gefunden" grün meldet. Gemessen am 15. September: 168.
 */
export const MINDESTENS_VORGABEN = 120;

/**
 * Zerlegt eine Quelle in Funktionen mit ihrer Kopfzeile und ihrem Rumpf.
 *
 * Gelesen wird über `nurCode` — Zeichenketten, Muster und Kommentare sind
 * ausgeblendet, die Zeilenumbrüche stehen. Sonst hielte ein Beispiel im
 * Kommentarkopf (dieses Modul hat eines) eine Kopfzeile für echt.
 *
 * @param {string} quelle
 * @returns {{name: string, kopf: string, rumpf: string, von: number}[]}
 */
export function funktionen(quelle) {
  const code = nurCode(String(quelle ?? ''));
  const aus = [];
  for (const quelltext of [FUNKTIONSKOPF, PFEILKOPF]) {
    for (const t of code.matchAll(new RegExp(quelltext, 'g'))) {
      const auf = t.index + t[0].length - 1;
      const zu = bisSchliessend(code, auf, '(', ')');
      if (zu < 0) continue;
      const kopf = code.slice(auf, zu + 1);
      // Nur Kopfzeilen mit Registervorgabe kosten die zweite Zerlegung.
      if (!new RegExp(VORGABE).test(kopf)) continue;
      const rumpf = rumpfNach(code, zu);
      if (rumpf === null) continue;
      aus.push({ name: t[1], kopf, rumpf, von: t.index });
    }
  }
  return aus.sort((a, b) => a.von - b.von);
}

/**
 * Was nach der Klammer kommt: ein Block oder ein Ausdruck bis zum Semikolon.
 *
 * Eine Pfeilfunktion ohne geschweifte Klammern hat trotzdem einen Rumpf —
 * `ustText` in `src/shopkern.js` ist genau so gebaut, und sie war der einzige
 * Fall dieser Form am 15. September. Wer nur Blöcke liest, übersieht sie
 * still.
 */
function rumpfNach(code, zu) {
  const rest = code.slice(zu + 1);
  const bisBlock = rest.search(/\S/);
  if (bisBlock < 0) return null;
  const ab = zu + 1 + bisBlock;
  if (code[ab] === '{') {
    const ende = bisSchliessend(code, ab);
    return ende < 0 ? null : code.slice(ab, ende + 1);
  }
  const pfeil = /^=>\s*/.exec(code.slice(ab));
  if (!pfeil) return null;
  const start = ab + pfeil[0].length;
  if (code[start] === '{') {
    const ende = bisSchliessend(code, start);
    return ende < 0 ? null : code.slice(start, ende + 1);
  }
  const semikolon = code.indexOf(';', start);
  return code.slice(start, semikolon < 0 ? code.length : semikolon);
}

/** Jede Registervorgabe einer Kopfzeile, ohne Doppelungen. */
export function vorgaben(kopf) {
  const aus = [];
  for (const t of String(kopf ?? '').matchAll(new RegExp(VORGABE, 'g'))) {
    if (aus.some((v) => v.beiwert === t[1] && v.register === t[2])) continue;
    aus.push({ beiwert: t[1], register: t[2] });
  }
  return aus;
}

/**
 * Der Befund über eine Quelle.
 *
 * @param {string} datei  wie sie in der Meldung stehen soll
 * @param {string} quelle
 */
export function dateibefund(datei, quelle) {
  const meldungen = [];
  let geprueft = 0;
  for (const f of funktionen(quelle)) {
    for (const { beiwert, register } of vorgaben(f.kopf)) {
      geprueft += 1;
      const wort = (name, text) => (text.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length;
      if (wort(register, f.rumpf)) {
        meldungen.push({
          regel: 'beiwert-uebergangen',
          text: `${datei}: ${f.name}() nimmt ${register} als \`${beiwert}\` herein und liest `
            + `${register} im Rumpf trotzdem unmittelbar — von außen ist diese Stelle nicht `
            + 'zu erreichen, von innen sieht sie offen aus',
        });
      }
      if (!wort(beiwert, f.rumpf)) {
        meldungen.push({
          regel: 'beiwert-ungenutzt',
          text: `${datei}: ${f.name}() nimmt \`${beiwert}\` herein und nennt es im Rumpf nie — `
            + 'ein Beiwert, der nichts ändert, ist eine Zusage, die niemand einlöst',
        });
      }
    }
  }
  return { geprueft, meldungen };
}

/**
 * Der Befund über alle Quellen — mit der Untergrenze.
 *
 * @param {Map<string, string>} quellen  Pfad → Quelltext
 */
export function beiwertbefund(quellen, mindestens = MINDESTENS_VORGABEN) {
  const meldungen = [];
  let geprueft = 0;
  for (const [datei, quelle] of quellen) {
    const b = dateibefund(datei, quelle);
    geprueft += b.geprueft;
    meldungen.push(...b.meldungen);
  }
  if (mindestens != null && geprueft < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-gesehen',
      text: `nur ${geprueft} Kopfzeilen mit Registervorgabe gefunden, erwartet sind mindestens `
        + `${mindestens} — eine Zerlegung, die nichts mehr findet, meldet grün und misst nichts`,
    });
  }
  return { geprueft, dateien: quellen.size, meldungen, sauber: meldungen.length === 0 };
}
