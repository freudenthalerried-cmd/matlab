/**
 * Das Einzugsgebiet einer Gegenprobe — welche Dateien ihr Ergebnis ändern
 * können.
 *
 * **Der Anlass, 12. September 2026.** Der Gesamtlauf braucht 109 Minuten,
 * davon 105 für die Gegenproben. Zwischen zwei Runden fährt ihn niemand —
 * und genau deshalb standen zwei stumpfe Gegenproben zwölf Runden lang da,
 * ohne dass es jemandem auffiel. Für die Prüfer hat Gate 38 diese Frage
 * beantwortet (was unter einer Sekunde bleibt, läuft vor jedem Commit); für
 * die Gegenproben war sie offen.
 *
 * Der naheliegende Schnitt wäre: nur fahren, was seine **eigene Datei**
 * geändert hat. Er wäre falsch, und die Runde davor hat den Gegenbeweis
 * geliefert:
 *
 * > **`weisung-nur-noch-im-protokoll` mutiert `baustoffkatalog.js` und wurde
 * > stumpf, weil `weisungsstand.js` die Weisungen neu durchnummeriert hat.**
 * > Eine Auswahl nach der mutierten Datei allein hätte sie übersprungen — und
 * > der einzige Lauf, der den Fund gemacht hat, wäre nicht gefahren.
 *
 * Das Einzugsgebiet ist deshalb größer als die Mutation: Es umfasst alles,
 * was der **Prüfer** liest, um zu seinem Urteil zu kommen. Gelesen wird das
 * nicht aus einer gepflegten Liste — die wäre nach dem ersten neuen `import`
 * falsch —, sondern aus den `import`-Zeilen selbst, rekursiv.
 *
 * **Was bewusst draußen bleibt:** Pakete aus `node_modules` und die eingebauten
 * Module von Node (`node:fs`). Dieses Haus hat keine Abhängigkeiten; ein
 * Wechsel der Node-Fassung ist kein Ereignis, das eine Auswahl treffen kann.
 */

/**
 * Relative `import`- und `export … from`-Ziele einer Quelldatei.
 *
 * Gesucht wird `from '…'` und nicht das ganze `import`-Wort davor: Die
 * Einfuhren dieses Hauses stehen oft über mehrere Zeilen, und ein Muster, das
 * am Zeilenumbruch endet, fand bei `bin/weisungspruefung.mjs` **keine
 * einzige**. Ein Fundort zu viel (etwa ein Zitat im Fließtext) vergrößert das
 * Gebiet und lässt eine Gegenprobe öfter laufen — das ist die Richtung, in
 * die ein Fehler hier gehen darf.
 */
export function importe(quelltext) {
  const gefunden = new Set();
  for (const t of String(quelltext ?? '').matchAll(/\bfrom\s*['"](\.[^'"]+)['"]/g)) {
    gefunden.add(t[1]);
  }
  // `import('./x.js')` — der Gesamtlauf und einige Prüfer laden so nach.
  for (const t of String(quelltext ?? '').matchAll(/\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
    gefunden.add(t[1]);
  }
  return [...gefunden];
}

/** Löst `./x.js` gegen den Ordner der lesenden Datei auf — ohne `node:path`. */
export function aufloesen(von, ziel) {
  const teile = von.split('/').slice(0, -1).concat(ziel.split('/'));
  const weg = [];
  for (const t of teile) {
    if (t === '.' || t === '') continue;
    if (t === '..') { weg.pop(); continue; }
    weg.push(t);
  }
  return weg.join('/');
}

/**
 * Pfade, die eine Quelldatei als Zeichenkette nennt — die Dateien, die sie
 * **liest**, nicht die, die sie einbindet.
 *
 * Ein Prüfer urteilt über Daten, nicht über seine Einfuhren:
 * `bin/gatepruefung.mjs` liest `docs/baustoff-shop/gate-register.md`, und wer
 * dort eine Zeile ändert, ändert sein Urteil. Solche Pfade stehen im Bestand
 * als Konstanten (`QUELLE = 'docs/…'`), also als Zeichenkette mit Endung.
 */
export function genanntePfade(quelltext) {
  const gefunden = new Set();
  const muster = /['"`]([\w][\w./-]*\.(?:md|json|jsonl|csv|html|php|txt|xml|gitignore))['"`]/g;
  for (const t of String(quelltext ?? '').matchAll(muster)) gefunden.add(t[1]);
  return [...gefunden];
}

/**
 * Liest diese Quelldatei einen **Ordner** statt einzelner Dateien?
 *
 * Dann ist ihr Gebiet nicht aufzählbar: `pruefe-stand` zählt die Dateien unter
 * `docs/baustoff-shop/`, und eine **neue** Datei steht in keiner Einfuhr und
 * in keiner Zeichenkette. Wer einen Ordner liest, läuft immer — die Auswahl
 * sagt das, statt es zu verschweigen.
 */
export function liestOrdner(quelltext) {
  return /\breaddirSync\b|\bglob\b|\bls-files\b/.test(String(quelltext ?? ''));
}

/**
 * Alle Dateien, die ein Einstiegspunkt über `import` erreicht — er selbst
 * eingeschlossen.
 *
 * `lies(pfad)` gibt den Quelltext oder `null`, wenn es die Datei nicht gibt.
 * Eine nicht lesbare Datei bricht nichts ab: Sie steht im Gebiet, und das ist
 * die vorsichtige Antwort — wer sie ändert, löst den Lauf aus.
 *
 * @param {string} einstieg Pfad ab der Verzeichniswurzel, z. B. `shop/bin/x.mjs`
 * @param {(pfad: string) => string|null} lies
 */
export function einzugsgebiet(einstieg, lies, { gibtEs = null } = {}) {
  const gesehen = new Set([einstieg]);
  const offen = [einstieg];
  const gelesen = new Set();
  let offenesGebiet = false;
  while (offen.length) {
    const pfad = offen.pop();
    const text = lies(pfad);
    if (text === null || text === undefined) continue;
    if (liestOrdner(text)) offenesGebiet = true;
    for (const ziel of importe(text)) {
      const voll = aufloesen(pfad, ziel);
      if (gesehen.has(voll)) continue;
      gesehen.add(voll);
      offen.push(voll);
    }
    if (gibtEs) {
      for (const genannt of genanntePfade(text)) {
        for (const kandidat of [genannt, `shop/${genannt}`]) {
          if (gibtEs(kandidat)) gelesen.add(kandidat);
        }
      }
    }
  }
  for (const g of gelesen) gesehen.add(g);
  return { dateien: gesehen, offenesGebiet };
}

/**
 * Muss diese Gegenprobe laufen?
 *
 * Drei Gründe, und jeder einzelne genügt:
 *
 * 1. **Ihre eigene Datei hat sich geändert.** Dann greift die Mutation
 *    womöglich nicht mehr — der Suchtext kann verschwunden sein.
 * 2. **Etwas im Einzugsgebiet ihres Prüfers hat sich geändert.** Dann kann
 *    sich sein Urteil geändert haben, auch ohne dass die Mutation anders
 *    wirkt. Das ist der Fall vom 12. September.
 * 3. **Ihr Gebiet ist unbekannt.** Dann läuft sie — eine Auswahl, die im
 *    Zweifel überspringt, ist eine Auswahl, die im Zweifel schweigt.
 *
 * @param {object} probe    Eintrag aus dem Gegenprobenregister
 * @param {Set<string>} geaendert  geänderte Pfade ab der Verzeichniswurzel
 * @param {Map<string, Set<string>>} gebiete  Prüfername → Einzugsgebiet
 */
export function mussLaufen(probe, geaendert, gebiete) {
  if (geaendert.has(probe.datei)) return { laufen: true, grund: 'eigene-datei' };
  const gebiet = gebiete.get(probe.pruefer);
  if (!gebiet) return { laufen: true, grund: 'gebiet-unbekannt' };
  if (gebiet.offenesGebiet) return { laufen: true, grund: 'liest-einen-ordner' };
  for (const datei of gebiet.dateien) {
    if (geaendert.has(datei)) return { laufen: true, grund: 'einzugsgebiet' };
  }
  return { laufen: false, grund: 'unveraendert' };
}
