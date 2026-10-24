/**
 * Javascript-Quelltext in seine **Stücke** zerlegen — der eine Leser.
 *
 * **Der Anlass, 14. September 2026, nachmittags.** Dieses Haus liest an fünf
 * Stellen seinen eigenen Quelltext, und bis heute mit **zwei** Verfahren:
 *
 * | Stelle | las mit | kennt Zeichenketten | kennt Muster |
 * |---|---|---|---|
 * | `src/entkommentieren.js` | Scanner | ja | ja |
 * | `src/testzerlegung.js` | Scanner | ja | ja |
 * | `src/zwillingssaetze.js` | Mustern | seit 14.09. | **nein** |
 * | `src/regelnamen.js` | Mustern | nein | **nein** |
 * | `src/codedubletten.js` | Mustern | nein | **nein** |
 *
 * Was die Musterleser dabei tun, ist gemessen: Der Satzleser fand **415 Sätze,
 * die es nicht gibt**, und übersah **163, die es gibt** — in 58 von 255
 * Dateien. Die Ursache ist dieselbe wie beim Apostroph am Vortag, eine Ebene
 * höher: **Ein Anführungszeichen in einem regulären Ausdruck** — `/['"]/`,
 * `/^\s*\/\/(.*)$/` — beginnt für ihn eine Zeichenkette, und ab dort liest er
 * Code als Text und Text als Zwischenraum.
 *
 * > **Wer Quelltext mit Mustern liest, liest ihn irgendwann falsch. Die Frage
 * > ist nur, an welchem Zeichen.**
 *
 * ## Was hier gilt
 *
 * Ein Gang, ein Zeichen nach dem anderen, und jedes Stück kommt mit seiner Art
 * heraus: `code`, `block`, `zeile`, `kette`, `muster`. Wer Sätze sucht, nimmt
 * `block`, `zeile` und `kette`; wer Code durchsucht, nimmt `code`; wer
 * Kommentare entfernt, lässt `block` und `zeile` weg.
 *
 * ## Streng oder nachsichtig
 *
 * `entkommentiere` schreibt das aus, was der Kunde herunterlädt: Dort ist ein
 * unvollständiges Literal ein **Abbruch**, denn ein Scanner, der rät, macht
 * aus gültigem Code Bruch. Ein Prüfer, der 255 Dateien nach Sätzen durchsieht,
 * darf an einer kaputten nicht die ganze Messung verlieren. Beides steht
 * deshalb in `streng`.
 */

/** Zeichen, nach denen ein `/` einen regulären Ausdruck beginnt, keine Division. */
const VOR_MUSTER = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}',
  ';', '+', '-', '*', '%', '~', '^', '<', '>', '\n']);

/** Schlüsselwörter, nach denen ein `/` ebenfalls einen regulären Ausdruck beginnt. */
const VOR_MUSTER_WORT = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new',
  'delete', 'void', 'do', 'else', 'case', 'yield', 'await']);

function letztesWort(text, bis) {
  let e = bis;
  while (e > 0 && /\s/.test(text[e - 1])) e--;
  let a = e;
  while (a > 0 && /[A-Za-z_$]/.test(text[a - 1])) a--;
  return text.slice(a, e);
}

/**
 * Die Stücke einer Quelle, in ihrer Reihenfolge.
 *
 * Jedes Stück trägt `art`, den vollen Text `roh` (mit Begrenzern), den Inhalt
 * `text` (ohne sie) und `von` — seine Stelle in der Quelle. Aneinandergehängt
 * ergibt `roh` wieder genau die Quelle; daran hängt, dass `entkommentiere`
 * zeichengleich bleibt, und `von` daran, dass ein Aufrufer, der mit Stellen
 * rechnet, dieselben behält.
 *
 * @param {string} quelle
 * @param {{streng?: boolean}} [wahl]  `streng` bricht bei unvollständigen
 *   Literalen ab, statt sie bis zum Dateiende zu nehmen.
 * @returns {{art: 'code'|'block'|'zeile'|'kette'|'muster', roh: string, text: string, von: number}[]}
 */
/**
 * Die letzten Zerlegungen — ein Gedächtnis von vier Einträgen.
 *
 * **14. September 2026, nachmittags.** Diese Funktion ist rein, und ihre
 * Aufrufer rufen sie hintereinander für **denselben** Text: `bisSchliessend`
 * einmal je Funktionsrumpf, `zerlege` einmal je Testfall. Über 256 Dateien mit
 * 740 Rümpfen sind das Hunderte Gänge durch dieselbe Quelle, und zwei Prüfer
 * rissen damit die Sekunde aus Gate 38.
 *
 * > **Ein genauerer Leser ist teurer, und wer ihn in eine Schleife stellt,
 * > bezahlt die Genauigkeit je Durchgang.**
 *
 * Vier Einträge reichen: Die Aufrufer arbeiten eine Datei zu Ende, bevor sie
 * die nächste nehmen. Mehr zu behalten hieße, den ganzen Bestand im
 * Arbeitsspeicher zu halten, ohne dass es einen weiteren Treffer brächte.
 */
const GEDAECHTNIS = new Map();
export const GEDAECHTNIS_HOECHSTENS = 4;
let treffer = 0;
let fehlschlaege = 0;

/**
 * Wie oft das Gedächtnis getroffen hat — und wie oft nicht.
 *
 * **Der offene Punkt vom 14. September, nachmittags.** Vier Einträge reichen,
 * **solange niemand zwei Dateien verschränkt liest.** Nichts prüfte das, und
 * wer es täte, bekäme keinen Fehler, sondern die alte Laufzeit zurück.
 *
 * > **Eine Annahme über den Aufrufer, die niemand misst, ist eine Hoffnung
 * > mit Laufzeitfolgen.**
 *
 * Gemessen wird deshalb die Trefferquote und nicht die Zeit: Zeit hängt an
 * der Last der Maschine, die Quote nicht. Dieselbe Unterscheidung wie beim
 * Schnelllauf am 13. September, der über einer geschäftigen Maschine drei
 * Prüfer für langsam hielt.
 */
export function gedaechtnisstand() {
  return { treffer, fehlschlaege, groesse: GEDAECHTNIS.size };
}

/** Setzt die Zählung zurück — für eine Messung, die bei null anfängt. */
export function gedaechtnisVergessen() {
  GEDAECHTNIS.clear();
  treffer = 0;
  fehlschlaege = 0;
}

export function stuecke(quelle, { streng = false } = {}) {
  const schluessel = `${streng ? 's' : 'n'}\u0000${quelle}`;
  const bekannt = GEDAECHTNIS.get(schluessel);
  if (bekannt) { treffer += 1; return bekannt; }
  fehlschlaege += 1;
  const frisch = zerlegeQuelle(quelle, streng);
  GEDAECHTNIS.set(schluessel, frisch);
  if (GEDAECHTNIS.size > GEDAECHTNIS_HOECHSTENS) {
    GEDAECHTNIS.delete(GEDAECHTNIS.keys().next().value);
  }
  return frisch;
}

function zerlegeQuelle(quelle, streng) {
  const s = String(quelle ?? '');
  const raus = [];
  let code = '';
  let i = 0;
  // Schachtelung der Vorlagenliterale: je offenem `${` ein Eintrag.
  const vorlagen = [];
  let klammern = 0;

  // Was vor dem `/` steht, entscheidet über Muster oder Division — und zwar
  // **alles** Bedeutende davor, nicht nur der Code: Nach `'x'` teilt ein `/`,
  // nach `(` beginnt es ein Muster. `sicht` führt deshalb mit, was ein Leser
  // sähe, der Kommentare überspringt und Literale stehen lässt.
  let sicht = '';
  let codeVon = 0;
  const nimmCode = () => {
    if (code) { raus.push({ art: 'code', roh: code, text: code, von: codeVon }); code = ''; }
  };
  const schiebe = (art, von, bis, innenVon, innenBis) => {
    nimmCode();
    const roh = s.slice(von, bis);
    raus.push({ art, roh, text: s.slice(innenVon, innenBis), von });
    codeVon = bis;
    // Ein Kommentar hinterlässt nur seine Zeilenumbrüche: Ein `/` dahinter
    // steht so vor demselben Zeichen wie ohne ihn.
    sicht += (art === 'block' || art === 'zeile') ? roh.replace(/[^\n]/g, '') : roh;
  };
  const letztesBedeutende = () => {
    for (let k = sicht.length - 1; k >= 0; k--) if (!/\s/.test(sicht[k])) return sicht[k];
    return '\n';
  };
  const zeileVon = (stelle) => s.slice(0, stelle).split('\n').length;

  while (i < s.length) {
    const c = s[i];
    const d = s[i + 1];

    if (c === '/' && d === '/') {
      const ende = s.indexOf('\n', i);
      const bis = ende === -1 ? s.length : ende;
      schiebe('zeile', i, bis, i + 2, bis);
      i = bis;
      continue;
    }
    if (c === '/' && d === '*') {
      const ende = s.indexOf('*/', i + 2);
      if (ende === -1) {
        if (streng) throw new Error('Blockkommentar ohne Ende — der Scanner bricht ab, statt zu raten.');
        schiebe('block', i, s.length, i + 2, s.length);
        i = s.length;
        continue;
      }
      schiebe('block', i, ende + 2, i + 2, ende);
      i = ende + 2;
      continue;
    }

    if (c === "'" || c === '"') {
      let j = i + 1;
      let offen = true;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === c) { offen = false; break; }
        if (s[j] === '\n') break;
        j++;
      }
      if (offen) {
        if (streng) throw new Error(`Zeichenkette ohne Ende in Zeile ${zeileVon(j)}.`);
        // Nachsichtig: Das Anführungszeichen war keines — es gehört zum Code.
        if (!code) codeVon = i;
        code += c;
        sicht += c;
        i += 1;
        continue;
      }
      schiebe('kette', i, j + 1, i + 1, j);
      i = j + 1;
      continue;
    }

    if (c === '`') {
      vorlagen.push(klammern);
      klammern = 0;
      let j = i + 1;
      for (;;) {
        if (j >= s.length) {
          if (streng) throw new Error('Vorlagenliteral ohne Ende.');
          schiebe('kette', i, s.length, i + 1, s.length);
          i = s.length;
          klammern = vorlagen.pop();
          break;
        }
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '`') { schiebe('kette', i, j + 1, i + 1, j); i = j + 1; klammern = vorlagen.pop(); break; }
        if (s[j] === '$' && s[j + 1] === '{') {
          // Der eingebettete Ausdruck wird normal weitergelesen — er kann
          // selbst Zeichenketten, Vorlagen und Kommentare enthalten.
          schiebe('kette', i, j + 2, i + 1, j);
          i = j + 2;
          klammern = 1;
          break;
        }
        j++;
      }
      continue;
    }

    // Ende eines `${…}` — zurück in das umgebende Vorlagenliteral.
    if (c === '}' && vorlagen.length && klammern === 1) {
      const von = i;
      i += 1;
      let j = i;
      for (;;) {
        if (j >= s.length) {
          if (streng) throw new Error('Vorlagenliteral ohne Ende.');
          schiebe('kette', von, s.length, von + 1, s.length);
          i = s.length;
          klammern = vorlagen.pop();
          break;
        }
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '`') { schiebe('kette', von, j + 1, von + 1, j); i = j + 1; klammern = vorlagen.pop(); break; }
        if (s[j] === '$' && s[j + 1] === '{') { schiebe('kette', von, j + 2, von + 1, j); i = j + 2; klammern = 1; break; }
        j++;
      }
      continue;
    }
    if (vorlagen.length) {
      if (c === '{') klammern++;
      else if (c === '}') klammern--;
    }

    if (c === '/') {
      const vor = letztesBedeutende();
      const wort = letztesWort(sicht, sicht.length);
      if (VOR_MUSTER.has(vor) || VOR_MUSTER_WORT.has(wort)) {
        let j = i + 1;
        let inKlasse = false;
        let offen = true;
        while (j < s.length && s[j] !== '\n') {
          if (s[j] === '\\') { j += 2; continue; }
          if (s[j] === '[') inKlasse = true;
          else if (s[j] === ']') inKlasse = false;
          else if (s[j] === '/' && !inKlasse) { offen = false; break; }
          j++;
        }
        if (offen) {
          if (streng) throw new Error(`Regulärer Ausdruck ohne Ende in Zeile ${zeileVon(i)}.`);
          if (!code) codeVon = i;
          code += c;
          sicht += c;
          i += 1;
          continue;
        }
        let ende = j + 1;
        while (ende < s.length && /[a-z]/.test(s[ende])) ende++; // Kennzeichen
        schiebe('muster', i, ende, i, ende);
        i = ende;
        continue;
      }
    }

    if (!code) codeVon = i;
    code += c;
    sicht += c;
    i += 1;
  }
  nimmCode();
  return raus;
}
