/**
 * Prüft Inhalte auf die Regeln, die vor dem ersten Text feststanden.
 *
 * Grundlage ist `inhalte-und-pruefteam.md`: Eine widerlegte Angabe ist
 * teurer als Schweigen. Wer massenhaft Inhalte erzeugt und dabei einen
 * Fehler einbaut, hat nicht neunundneunzig gute Seiten, sondern eine
 * Quelle, der nicht mehr geglaubt wird.
 *
 * Der Prüfer ist bewusst grob — wie sein Vorbild `bin/testpruefung.mjs`.
 * Er versteht keinen Fachtext, er sucht Muster. Was er meldet, ist ein
 * **Verdacht, kein Urteil**; jeder Treffer gehört angesehen. Ein Prüfer,
 * der Urteile fällt, wird ruhiggestellt statt befolgt.
 *
 * Wo ein Treffer begründet abgelehnt wird, steht im Text die Zeile
 * `<!-- pruefung: begruendet — Grund -->`. Der Prüfer schweigt dann für
 * diesen Absatz. Eine Ausnahme, die man aufschreiben muss, wird seltener
 * aus Bequemlichkeit gemacht als eine, die man wegkonfiguriert.
 */

/**
 * Zahlen mit Maßeinheit — sie sind Behauptungen und brauchen eine Quelle.
 *
 * **Die Wortgrenze am Ende ist nicht Feinschliff.** Ohne sie las die Regel
 * „3 Lagen" als *3 Liter* und „5 Häuser" als *5 Stunden*: Einheiten wie `l`,
 * `h` und `min` sind ein bis drei Zeichen lang und stehen damit am Anfang
 * unzähliger deutscher Wörter. Gefunden am 28.08., als der Seitenprüfer
 * erstmals auch die Absätze des Seitenbauwerkzeugs las und zwei Fehltreffer
 * meldete — beide auf demselben Satz „die 3 Lagen, die dieser Shop nicht
 * führt".
 *
 * Wieder `(?![\p{L}])` statt `\b`: Dieselbe ASCII-Falle wie bei `ÖNORM`
 * weiter unten und bei der Bauformerkennung in `bilder.js`. Das ist die
 * dritte Stelle im Projekt mit demselben Fehler.
 */
const ZAHL_MIT_EINHEIT = /\d+(?:[.,]\d+)?\s*(?:€|EUR|m²|m³|mm|cm|kg|g\/m²|l|%|Bq\/m³|°C|min|h|Std|Jahre?|Monate?)(?![\p{L}])/giu;

/** Belegformen, die als Quelle gelten. */
const QUELLE = /\[[^\]]*\]\([^)]+\)|Quelle:|laut\s+\p{Lu}|Stand:|siehe\s+\p{Lu}|ÖNORM\s+[A-Z]|DIN\s*(?:EN\s*)?\d|EN\s*\d/u;

/**
 * Normbezüge ohne Nummer sind wertlos — Normen ändern sich.
 *
 * Die Wortgrenze ist hier von Hand gesetzt statt über `\b`: JavaScripts `\b`
 * beruht auf ASCII-Wortzeichen, und „Ö" gehört nicht dazu. `\bÖNORM` trifft
 * deshalb **nie** — der Prüfer hätte genau die Regel verschwiegen, für die er
 * gebaut wurde. Gefunden beim ersten Probelauf.
 */
const NORM_OHNE_NUMMER = /(?<![\p{L}\d])(?:ÖNORM|DIN|EN|OIB[- ]Richtlinie)(?![\p{L}\d])(?!\s*(?:[A-Z]\s*)?\d)/gu;

/**
 * Geltungsaussagen — Behauptungen darüber, was zugelassen, vorgeschrieben
 * oder verboten ist.
 *
 * Sie sind der blinde Fleck der übrigen Regeln: Alle anderen hängen an einer
 * Zahl, einer Normnummer oder einem Grenzwort. Ein Satz wie „Ein WDVS wird
 * als System geprüft und zugelassen" enthält nichts davon und kam deshalb
 * durch — obwohl er die tragende Verkaufsaussage der Systemlisten ist. Eine
 * Behauptung ohne Zahl ist nicht weniger eine Behauptung.
 *
 * **Was bewusst nicht in dieser Liste steht:** „haftet" und „Haftung". Im
 * Baustofftext sind das physikalische Wörter — der Putzgrund stellt die
 * Haftung her, die Abdichtung haftet an der Wand. Beide Wörter meldeten im
 * Probelauf ausschließlich Fehltreffer. Der juristische Fall ist ohnehin
 * über das Grenzwort „Rechtsauskunft" abgedeckt. Ebenfalls draußen:
 * „zulässig". Es steht in diesen Texten fast immer dort, wo die Seite eine
 * Frage korrekt an die Bauordnung weiterreicht, statt sie zu beantworten —
 * und genau das soll die Regel nicht bestrafen.
 */
const GELTUNGSAUSSAGE = /(?<![\p{L}\d])(?:Zulassung|zugelassen|bauaufsichtlich|vorgeschrieben|genormt|Pflicht|verpflichtet|unzulässig)(?![\p{L}\d])/giu;

/**
 * Wörter, die eine Grenze verletzen. Nicht der Wahrheit wegen, sondern der
 * Zulässigkeit: Gesundheitsaussagen, Rechtsauskünfte und Erfolgszusagen
 * gehören einem Baustoffhändler nicht.
 */
export const GRENZWOERTER = Object.freeze([
  { wort: /\bgesundheitlich|\bGesundheit\b|\bkrebs/i, grenze: 'Gesundheitsaussage' },
  { wort: /\bheilt\b|\bschützt vor Krankheit/i, grenze: 'Gesundheitsaussage' },
  { wort: /\brechtssicher\b|\brechtlich unbedenklich\b|\bwir beraten Sie rechtlich/i, grenze: 'Rechtsauskunft' },
  { wort: /\bgarantiert\b|\bwir garantieren\b|\bzugesichert\b/i, grenze: 'Erfolgszusage' },
  { wort: /\bdauerhaft trocken\b|\bfür immer\b/i, grenze: 'Erfolgszusage' },
]);

/** Ein Preis ohne Stand und ohne netto/brutto ist in vier Wochen falsch. */
const PREIS = /\d+(?:[.,]\d+)?\s*(?:€|EUR)/i;
const PREIS_EINORDNUNG = /\bnetto\b|\bbrutto\b|\bexkl\.|\binkl\./i;
const STAND = /Stand:|Preisstand|Stand\s+\d/i;

/**
 * Trennt einen Kopfblock im Stil `---\n schlüssel: wert \n---` ab.
 *
 * Der Kopfblock trägt Metadaten — Titel, Kurzfassung, Verweise —, keine
 * Behauptungen an den Leser. Ihn mitzuprüfen erzeugte Verdacht auf jeder
 * Seite, deren Titel eine Menge nennt („Mengen für 100 m² Fassade"), und ein
 * Prüfer, der bei jeder Datei anschlägt, wird abgeschaltet statt befolgt.
 *
 * Die Zeilennummern der übrigen Absätze bleiben richtig: Der Kopf wird nicht
 * entfernt, sondern durch ebenso viele Leerzeilen ersetzt.
 */
export function ohneKopfblock(text) {
  const treffer = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(text);
  if (!treffer) return text;
  const zeilen = treffer[0].split('\n').length - 1;
  return '\n'.repeat(zeilen) + text.slice(treffer[0].length);
}

/**
 * Zerlegt einen Text in Absätze mit Zeilennummer.
 *
 * Die Zeilennummer wird aus der **Position im Text** berechnet, nicht durch
 * Mitzählen beim Zerlegen. Der Unterschied ist kein Feinschliff: Die erste
 * Fassung zählte je Absatz „Zeilen plus eins" weiter und unterstellte damit
 * genau eine Leerzeile zwischen zwei Absätzen. Der Kopfblock wird aber durch
 * *mehrere* Leerzeilen ersetzt, und `split(/\n\s*\n/)` fasst einen ganzen
 * Block Leerzeilen zu einem Trenner zusammen. Ab dem ersten Absatz nach dem
 * Kopf zeigte der Prüfer deshalb um genau die Kopflänge daneben — bei
 * `kaminzug-aufbau.md` auf Zeile 53 statt 62.
 *
 * Aufgefallen ist das erst, als eine neue Regel anschlug und die gemeldete
 * Zeile nachgeschlagen wurde. Ein Prüfer, der nichts findet, verrät auch
 * nicht, dass sein Fingerzeig falsch ist — der Fehler saß von Anfang an
 * darin und war so lange unsichtbar, wie der Bestand sauber war.
 */
export function inAbsaetze(text) {
  const bereinigt = ohneKopfblock(text);
  const absaetze = [];
  const trenner = /\n\s*\n/g;
  const stuecke = [];
  let start = 0;
  let treffer;
  while ((treffer = trenner.exec(bereinigt)) !== null) {
    stuecke.push([start, bereinigt.slice(start, treffer.index)]);
    start = treffer.index + treffer[0].length;
  }
  stuecke.push([start, bereinigt.slice(start)]);

  for (const [pos, stueck] of stuecke) {
    if (!stueck.trim()) continue;
    const versatz = stueck.length - stueck.trimStart().length;
    const zeile = bereinigt.slice(0, pos + versatz).split('\n').length;
    absaetze.push({ text: stueck.trim(), zeile });
  }
  return absaetze;
}

/** Prüft einen einzelnen Absatz auf die vorab festgelegten Regeln. */
export function pruefeAbsatz(absatz) {
  const verdacht = [];
  const t = absatz.text;

  if (/<!--\s*pruefung:\s*begruendet/i.test(t)) return verdacht;
  // Überschriften und Codeblöcke tragen keine Behauptungen.
  if (/^\s*#{1,6}\s/.test(t) || /^\s*```/.test(t)) return verdacht;

  const zahlen = [...t.matchAll(ZAHL_MIT_EINHEIT)].map((m) => m[0]);
  if (zahlen.length > 0 && !QUELLE.test(t)) {
    verdacht.push(`Zahl ohne Quelle: ${zahlen.slice(0, 3).join(', ')} — jede Zahl braucht Herkunft und Stand`);
  }

  for (const treffer of t.matchAll(NORM_OHNE_NUMMER)) {
    verdacht.push(`„${treffer[0]}" ohne Nummer — Normen ändern sich, die Fundstelle gehört dazu`);
  }

  // Nach Kleinschreibung entdoppelt: „Zugelassen … zugelassen" ist ein Wort,
  // nicht zwei. Gemeldet wird die zuerst gefundene Schreibweise.
  // `Map` behält bei doppeltem Schlüssel den letzten Wert — hier soll der
  // erste stehen bleiben, damit die Meldung auf das erste Vorkommen zeigt.
  const geltung = [...[...t.matchAll(GELTUNGSAUSSAGE)]
    .reduce((m, treffer) => (m.has(treffer[0].toLowerCase()) ? m : m.set(treffer[0].toLowerCase(), treffer[0])), new Map())
    .values()];
  if (geltung.length > 0 && !QUELLE.test(t)) {
    verdacht.push(
      `Geltungsaussage ohne Fundstelle: ${geltung.join(', ')} — wer sagt, was zugelassen oder vorgeschrieben ist, muss sagen, wo es steht`,
    );
  }

  for (const { wort, grenze } of GRENZWOERTER) {
    const treffer = t.match(wort);
    if (treffer) verdacht.push(`${grenze}: „${treffer[0]}" — diese Aussage steht einem Baustoffhändler nicht zu`);
  }

  if (PREIS.test(t)) {
    if (!PREIS_EINORDNUNG.test(t)) verdacht.push('Preis ohne netto/brutto — der Unterschied sind 20 %');
    if (!STAND.test(t)) verdacht.push('Preis ohne Stand — er ist in vier Wochen falsch');
  }

  // Blockzitate brauchen eine Quelle, sonst sind sie fremder Text ohne Beleg.
  if (/^\s*>/m.test(t) && !QUELLE.test(t)) {
    verdacht.push('Zitat ohne Quellenangabe — Urheberrecht verlangt die Fundstelle');
  }

  return verdacht;
}

/**
 * Felder des Kopfblocks, die **Fließtext an den Leser** sind.
 *
 * Der Kopfblock als Ganzes bleibt von der Prüfung ausgenommen — er trägt
 * Titel, Kennungen und Verweise, und ein Prüfer, der bei jedem Titel mit
 * einer Mengenangabe anschlägt, wird abgeschaltet statt befolgt. Diese zwei
 * Felder sind aber keine Metadaten: `kurz` wird als Beschreibung der Seite
 * ausgegeben — in die Kachel, in die Meta-Beschreibung, ins JSON-LD und in
 * die `llms.txt` —, `frage` als Frage im FAQ-Baustein.
 *
 * Damit stand die Aussage „die Komponenten sind als System geprüft und
 * zugelassen" ausgerechnet dort ungeprüft, wo maschinelle Leser sie
 * abholen: im Kopfblock. Der Prüfer meldete sie im Fließtext und schwieg
 * zur wörtlich gleichen Zeile drei Zeilen darüber.
 */
const GEPRUEFTE_KOPFFELDER = Object.freeze(['kurz', 'frage']);

/** Liest die prüfbaren Kopffelder mit ihrer Zeilennummer. */
export function kopffelder(text) {
  const treffer = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!treffer) return [];
  const felder = [];
  treffer[1].split(/\r?\n/).forEach((zeile, i) => {
    const m = /^([a-zA-ZäöüÄÖÜ_][\w-]*)\s*:\s*(.*)$/.exec(zeile);
    if (m && GEPRUEFTE_KOPFFELDER.includes(m[1]) && m[2].trim()) {
      felder.push({ feld: m[1], text: m[2].trim(), zeile: i + 2 });
    }
  });
  return felder;
}

/** Prüft einen ganzen Text und liefert die Verdachtsfälle je Absatz. */
export function pruefeInhalt(text, name = '') {
  const absaetze = inAbsaetze(text);
  const ausKopf = kopffelder(text).map((f) => ({
    zeile: f.zeile,
    auszug: `${f.feld}: ${f.text.slice(0, 50).replace(/\s+/g, ' ')}`,
    verdacht: pruefeAbsatz({ text: f.text }),
  }));
  const treffer = [...ausKopf, ...absaetze
    .map((a) => ({ zeile: a.zeile, auszug: a.text.slice(0, 60).replace(/\s+/g, ' '), verdacht: pruefeAbsatz(a) }))]
    .filter((a) => a.verdacht.length > 0)
    .sort((a, b) => a.zeile - b.zeile);
  return {
    name,
    absaetze: absaetze.length,
    treffer,
    sauber: treffer.length === 0,
  };
}

/**
 * Schneidet den Text heraus, der aus `inhalte/` stammt.
 *
 * Das Seitenbauwerkzeug klammert ihn in `<!--quelltext-->…<!--/quelltext-->`.
 * Was übrig bleibt, hat das Werkzeug selbst geschrieben — und genau das
 * gehört auf den gebauten Seiten geprüft.
 *
 * **Warum es diese Funktion gibt.** Der Seitenprüfer übersprang bis zum
 * 28.08. ganze Seiten: alles unter `wissen/`, `gruppe/` und `system/`. Die
 * Begründung war richtig — dieser Text ist an der Quelle geprüft, samt seiner
 * begründeten Ausnahmen, die das Rendern nicht überleben. Die Grenze lag nur
 * am falschen Ort:
 *
 * > **Auf einer übersprungenen Seite steht auch Text, den das Werkzeug selbst
 * > schreibt** — und der lief durch keine der beiden Prüfungen. Nicht in
 * > `inhalte/`, also nicht in `pruefe-inhalte`; auf einer ausgenommenen
 * > Seite, also nicht in `pruefe-seiten`.
 *
 * Eine unpaarige Marke ist ein Fehler, kein Sonderfall: Wer sie stillschweigend
 * behandelt, liest zu viel oder zu wenig und merkt es nie.
 *
 * @returns {{text: string, fehler: string|null}}
 */
export function schneideQuelltext(html) {
  const roh = String(html ?? '');
  const AUF = '<!--quelltext-->';
  const ZU = '<!--/quelltext-->';
  const auf = (roh.match(/<!--quelltext-->/g) ?? []).length;
  const zu = (roh.match(/<!--\/quelltext-->/g) ?? []).length;
  if (auf !== zu) {
    return { text: roh, fehler: `${auf} öffnende, ${zu} schließende Quelltextmarken` };
  }
  let raus = '';
  let rest = roh;
  for (;;) {
    const a = rest.indexOf(AUF);
    if (a < 0) { raus += rest; break; }
    const e = rest.indexOf(ZU, a);
    if (e < 0) return { text: roh, fehler: 'Quelltextmarke ohne Ende' };
    raus += rest.slice(0, a);
    rest = rest.slice(e + ZU.length);
  }
  return { text: raus, fehler: null };
}
