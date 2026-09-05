/**
 * Kommentare aus dem ausgelieferten Skript entfernen.
 *
 * **Der Anlass, 29. August 2026.** `ausgabe/site/shop.js` ist 293 KB groß und
 * geht an jeden Besucher. Darin steht der **Quelltext der Rechenmodule samt
 * seiner Kommentare** — und die Kommentare erklären die Kalkulation:
 *
 * > „40 € Einkauf und 25 % Ziel ergeben 53,333… €"
 *
 * Damit ist die Weisung vom 28. August („keine Spanne ausgeben") auf der
 * Kundenseite unterlaufen: Die Zahl steht nicht auf der Seite, aber in der
 * Datei, die die Seite lädt. Schwerer wiegt die zweite Folge: Der offene
 * Punkt „Repository privat schalten" wäre damit **wirkungslos**. Wer die
 * Einkaufspreise rekonstruieren will, braucht das Repository nicht — die
 * ausgelieferte Seite reicht.
 *
 * Fehlerklasse: *eine Prüfung, die das Modell liest statt die Ausgabe.* Der
 * Interna-Prüfer sieht den gerenderten Seitentext an; das mitgelieferte
 * Skript hat er nie gelesen.
 *
 * **Warum von Hand und nicht mit einem Werkzeug.** Im ganzen `shop/` ist kein
 * Fremdpaket, und dabei bleibt es. Der Preis dafür ist, dass dieser Scanner
 * die Sonderfälle selbst kennen muss: Zeichenketten, Vorlagenliterale samt
 * `${…}`, reguläre Ausdrücke. Ein Kommentarentferner, der ein `//` in einer
 * Zeichenkette für einen Kommentar hält, macht aus gültigem Code Bruch.
 *
 * **Die Absicherung dagegen steht nicht in diesem Kommentar, sondern im
 * Bauschritt**: Das Ergebnis wird mit `node --check` geparst, bevor es
 * geschrieben wird, und 39 Browserszenarien fahren danach über die fertige
 * Seite. Ein Scannerfehler bricht den Bau ab, statt still auszuliefern.
 */

/** Zeichen, nach denen ein `/` einen regulären Ausdruck beginnt, keine Division. */
const VOR_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}',
  ';', '+', '-', '*', '%', '~', '^', '<', '>', '\n']);

/** Schlüsselwörter, nach denen ein `/` ebenfalls einen regulären Ausdruck beginnt. */
const VOR_REGEX_WORT = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new',
  'delete', 'void', 'do', 'else', 'case', 'yield', 'await']);

function letztesWort(text, bis) {
  let e = bis;
  while (e > 0 && /\s/.test(text[e - 1])) e--;
  let a = e;
  while (a > 0 && /[A-Za-z_$]/.test(text[a - 1])) a--;
  return text.slice(a, e);
}

/**
 * @param {string} quelle
 * @returns {{ text: string, entfernt: number, zeichen: number }}
 */
export function ohneKommentare(quelle) {
  const s = String(quelle);
  let aus = '';
  let i = 0;
  let entfernt = 0;
  let zeichen = 0;
  // Schachtelung der Vorlagenliterale: je offenem `${` ein Eintrag.
  const vorlagen = [];
  let klammern = 0;

  const letztesBedeutende = () => {
    for (let k = aus.length - 1; k >= 0; k--) {
      if (!/\s/.test(aus[k])) return aus[k];
    }
    return '\n';
  };

  while (i < s.length) {
    const c = s[i];
    const d = s[i + 1];

    // --- Kommentare ---
    if (c === '/' && d === '/') {
      const ende = s.indexOf('\n', i);
      const bis = ende === -1 ? s.length : ende;
      entfernt++;
      zeichen += bis - i;
      i = bis; // der Zeilenumbruch bleibt stehen
      continue;
    }
    if (c === '/' && d === '*') {
      const ende = s.indexOf('*/', i + 2);
      if (ende === -1) throw new Error('Blockkommentar ohne Ende — der Scanner bricht ab, statt zu raten.');
      entfernt++;
      zeichen += ende + 2 - i;
      // Zeilenumbrüche des Blocks erhalten, damit Zeilennummern in
      // Fehlermeldungen weiter zur Quelle passen.
      const umbrueche = s.slice(i, ende + 2).split('\n').length - 1;
      aus += '\n'.repeat(umbrueche);
      i = ende + 2;
      continue;
    }

    // --- Zeichenketten ---
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === c) break;
        if (s[j] === '\n') throw new Error(`Zeichenkette ohne Ende in Zeile ${s.slice(0, j).split('\n').length}.`);
        j++;
      }
      if (j >= s.length) throw new Error('Zeichenkette ohne Ende.');
      aus += s.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // --- Vorlagenliterale ---
    if (c === '`') {
      vorlagen.push(klammern);
      klammern = 0;
      let j = i + 1;
      for (;;) {
        if (j >= s.length) throw new Error('Vorlagenliteral ohne Ende.');
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '`') { aus += s.slice(i, j + 1); i = j + 1; klammern = vorlagen.pop(); break; }
        if (s[j] === '$' && s[j + 1] === '{') {
          // Der eingebettete Ausdruck wird normal weiterverarbeitet — er kann
          // selbst Zeichenketten, Vorlagen und Kommentare enthalten.
          aus += s.slice(i, j + 2);
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
      aus += c;
      i++;
      let j = i;
      for (;;) {
        if (j >= s.length) throw new Error('Vorlagenliteral ohne Ende.');
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '`') { aus += s.slice(i, j + 1); i = j + 1; klammern = vorlagen.pop(); break; }
        if (s[j] === '$' && s[j + 1] === '{') { aus += s.slice(i, j + 2); i = j + 2; klammern = 1; break; }
        j++;
      }
      continue;
    }
    if (vorlagen.length) {
      if (c === '{') klammern++;
      else if (c === '}') klammern--;
    }

    // --- Reguläre Ausdrücke ---
    if (c === '/') {
      const vor = letztesBedeutende();
      const wort = letztesWort(aus, aus.length);
      if (VOR_REGEX.has(vor) || VOR_REGEX_WORT.has(wort)) {
        let j = i + 1;
        let inKlasse = false;
        for (;;) {
          if (j >= s.length || s[j] === '\n') {
            throw new Error(`Regulärer Ausdruck ohne Ende in Zeile ${s.slice(0, i).split('\n').length}.`);
          }
          if (s[j] === '\\') { j += 2; continue; }
          if (s[j] === '[') inKlasse = true;
          else if (s[j] === ']') inKlasse = false;
          else if (s[j] === '/' && !inKlasse) break;
          j++;
        }
        j++;
        while (j < s.length && /[a-z]/.test(s[j])) j++; // Kennzeichen
        aus += s.slice(i, j);
        i = j;
        continue;
      }
    }

    aus += c;
    i++;
  }

  return { text: aus, entfernt, zeichen };
}
