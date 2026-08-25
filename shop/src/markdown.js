/**
 * Ein kleiner Markdown-Umsetzer — nur so viel, wie die Inhalte brauchen.
 *
 * Warum nicht eine Bibliothek: Dieses Vorhaben kommt ohne Fremdpakete aus,
 * und der Umfang ist überschaubar — Überschriften, Absätze, Listen, Tabellen,
 * Blockzitate, Links, Fettdruck, Code. Was hier fehlt, fehlt absichtlich:
 * Bilder, verschachtelte Listen und HTML im Text. Ein Umsetzer, der alles
 * kann, kann auch alles falsch machen.
 *
 * Zwei Eigenschaften sind wichtiger als Vollständigkeit:
 *
 *   1. **Er entkommt allem.** Jeder Textinhalt geht durch `esc`, bevor er
 *      Markup wird. Ein Artikelname mit `&` oder `<` darf die Seite nicht
 *      zerlegen — und Artikelnamen kommen aus Lieferantenrechnungen, also
 *      aus fremder Hand.
 *   2. **Er verschluckt nichts stillschweigend.** Was er nicht kennt, wird
 *      Absatztext. Eine Zeile, die spurlos verschwindet, fällt beim
 *      Korrekturlesen nicht auf.
 */

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/**
 * Trennt den Kopfblock `---\nschlüssel: wert\n---` vom Text.
 *
 * Alle Werte bleiben Zeichenketten. Eine erste Fassung zerlegte jeden Wert
 * mit Komma in eine Liste — und machte damit aus der Frage „Warum ist das
 * günstiger, und wo ist der Haken?" zwei Listenelemente, die später ohne
 * Leerzeichen wieder zusammengefügt wurden. Sichtbar wurde das erst in der
 * `llms.txt`, also genau dort, wo maschinelle Leser es lesen.
 *
 * Wer eine Liste braucht, sagt es: {@link alsListe}. Eine Regel, die aus der
 * Form des Werts errät, was gemeint ist, errät irgendwann falsch.
 */
export function lesKopf(text) {
  const treffer = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!treffer) return { kopf: {}, koerper: text };

  const kopf = {};
  for (const zeile of treffer[1].split(/\r?\n/)) {
    const m = /^([a-zA-ZäöüÄÖÜ_][\w-]*)\s*:\s*(.*)$/.exec(zeile);
    if (!m) continue;
    kopf[m[1]] = m[2].trim();
  }
  return { kopf, koerper: text.slice(treffer[0].length) };
}

/**
 * Zerlegt einen Kopfblockwert in eine Liste — für die Felder, die eine sind.
 * Leere Einträge fallen weg; ein fehlendes Feld ergibt eine leere Liste.
 */
export function alsListe(wert) {
  if (wert == null) return [];
  if (Array.isArray(wert)) return wert.map((s) => String(s).trim()).filter(Boolean);
  return String(wert).split(',').map((s) => s.trim()).filter(Boolean);
}

/** Fettdruck, Code und Links — in dieser Reihenfolge, damit sie sich nicht beißen. */
export function inline(text) {
  let s = esc(text);
  // Code zuerst: Was in Backticks steht, soll nicht als Markup gelesen werden.
  // Der Platzhalter braucht ein Zeichen, das in echtem Text nicht vorkommt.
  // Als Escape geschrieben, nicht als echtes Steuerzeichen: Eine Quelldatei
  // mit NUL-Bytes gilt für git und grep als binär und ist im Diff nicht mehr
  // lesbar.
  //
  // Der Inhalt in `codes` ist bereits entkommen — `esc` läuft ganz oben über
  // den vollständigen Text, die Ausschnitte werden erst danach herausgelöst.
  // Ein zweites `esc` beim Zurücksetzen würde doppelt entkommen.
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, inhalt) => {
    codes.push(inhalt);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const extern = /^https?:/i.test(u);
    const ziel = extern ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${u}"${ziel}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, '<em>$1</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

const istTabellenTrenner = (z) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(z);
const zellen = (z) => z.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

/**
 * Setzt Markdown in HTML um.
 *
 * @param {string} text
 * @param {{ueberschriftAb?: number}} [opt] verschiebt die Überschriftenebene,
 *   damit eine eingebettete Seite unter einer bestehenden h1 nicht eine
 *   zweite aufmacht.
 */
export function alsHtml(text, opt = {}) {
  const versatz = (opt.ueberschriftAb ?? 1) - 1;
  const zeilen = text.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  const aus = [];
  let i = 0;

  const absatz = (puffer) => {
    if (puffer.length) aus.push(`<p>${inline(puffer.join(' '))}</p>`);
  };

  while (i < zeilen.length) {
    const z = zeilen[i];

    if (!z.trim()) { i += 1; continue; }

    // Überschrift
    const h = /^(#{1,6})\s+(.*)$/.exec(z);
    if (h) {
      const stufe = Math.min(6, h[1].length + versatz);
      aus.push(`<h${stufe}>${inline(h[2].trim())}</h${stufe}>`);
      i += 1;
      continue;
    }

    // Waagrechte Linie
    if (/^\s*(---|\*\*\*|___)\s*$/.test(z)) { aus.push('<hr>'); i += 1; continue; }

    // Tabelle: Kopfzeile plus Trennzeile
    if (z.includes('|') && i + 1 < zeilen.length && istTabellenTrenner(zeilen[i + 1])) {
      const kopf = zellen(z);
      i += 2;
      const koerper = [];
      while (i < zeilen.length && zeilen[i].includes('|') && zeilen[i].trim()) {
        koerper.push(zellen(zeilen[i]));
        i += 1;
      }
      aus.push(
        '<div class="scroll"><table><thead><tr>' +
          kopf.map((c) => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          koerper
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
            .join('') +
          '</tbody></table></div>',
      );
      continue;
    }

    // Blockzitat
    if (/^\s*>/.test(z)) {
      const puffer = [];
      while (i < zeilen.length && /^\s*>/.test(zeilen[i])) {
        puffer.push(zeilen[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      aus.push(`<blockquote>${alsHtml(puffer.join('\n'), opt)}</blockquote>`);
      continue;
    }

    // Liste, geordnet oder ungeordnet
    const liste = /^\s*([-*]|\d+\.)\s+/.exec(z);
    if (liste) {
      const geordnet = /\d/.test(liste[1]);
      const punkte = [];
      while (i < zeilen.length) {
        const m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(zeilen[i]);
        if (m) { punkte.push(m[1]); i += 1; continue; }
        // Fortsetzungszeile eines Punktes: eingerückt und nicht leer.
        if (punkte.length && /^\s{2,}\S/.test(zeilen[i])) {
          punkte[punkte.length - 1] += ` ${zeilen[i].trim()}`;
          i += 1;
          continue;
        }
        break;
      }
      const tag = geordnet ? 'ol' : 'ul';
      aus.push(`<${tag}>${punkte.map((p) => `<li>${inline(p)}</li>`).join('')}</${tag}>`);
      continue;
    }

    // Alles andere ist Absatz.
    const puffer = [];
    while (i < zeilen.length && zeilen[i].trim() && !/^\s*(#{1,6}\s|>|[-*]\s|\d+\.\s)/.test(zeilen[i])) {
      if (zeilen[i].includes('|') && i + 1 < zeilen.length && istTabellenTrenner(zeilen[i + 1])) break;
      puffer.push(zeilen[i].trim());
      i += 1;
    }
    if (puffer.length) absatz(puffer);
    else i += 1;
  }

  return aus.join('\n');
}

/** Reiner Text ohne Markup — für Kurzfassungen in Metadaten und JSON-LD. */
export function alsText(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
