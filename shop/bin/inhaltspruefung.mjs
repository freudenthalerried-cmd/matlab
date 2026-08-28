#!/usr/bin/env node
/**
 * Inhalte gegen die vorab festgelegten Prüfregeln durchsehen.
 *
 *   node bin/inhaltspruefung.mjs [ordner]
 *
 * Vierter Durchgang der Prüfkette aus `inhalte-und-pruefteam.md` —
 * maschinell, grob und nur unterstützend. Was er meldet, ist ein Verdacht,
 * kein Urteil; die Faktenprüfung gegen die Quelle bleibt Handarbeit.
 *
 * **Berichtigt am 27.08.:** Ohne Argument prüfte er bis dahin die
 * *Probedatei* — eine einzige Datei mit absichtlich fehlerhaften Absätzen,
 * damit nachweisbar bleibt, dass er die Muster findet, die er zu finden
 * behauptet. Das war als Selbstnachweis gedacht und als Voreinstellung
 * falsch:
 *
 * > **Ein Prüfer, dessen Voreinstellung nicht auf den Bestand zeigt, wird
 * > mit der Voreinstellung aufgerufen.** `npm run pruefe-inhalte` meldete
 * > „1 Dateien, 15 Absätze" und sah aus wie ein Durchlauf über den Shop.
 *
 * Jetzt prüft er ohne Argument **alle Inhaltsordner** (23 Seiten). Die
 * Probedatei liegt weiterhin bereit und wird mit `--probe` aufgerufen; der
 * Selbstnachweis bleibt damit erhalten, nur nicht mehr als Normalfall.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pruefeInhalt, pruefeAbsatz, schneideQuelltext } from '../src/inhaltspruefung.js';

const hier = dirname(fileURLToPath(import.meta.url));
const INHALTSORDNER = ['wissen', 'gruppen', 'system'];

/**
 * Dritter Betriebsmodus: die **gebauten Seiten**.
 *
 * Rund die Hälfte des Textes im Shop steht nicht in `inhalte/`, sondern im
 * Seitenbauwerkzeug — Startseite, Lieferung, Rechtstexte, Artikelseiten,
 * Warenkorbhinweise. Dieser Text ist nie durch die Prüfregeln gelaufen. Er
 * behauptet dieselben Dinge wie die Wissensseiten und unterliegt denselben
 * Regeln.
 *
 * Geprüft wird nur **Fließtext**: `<p>` außerhalb von Krume, Fuß und
 * Markierungsstreifen. Ein erster Anlauf las den ganzen sichtbaren Text und
 * meldete 84 Treffer — fast alle aus Artikelbezeichnungen („Capatect
 * Glasgewebe M, Breite 110cm") und Tabellenzellen. **Eine Prüfung, die
 * jeden Text als Aussage liest, meldet jeden Artikelnamen als Behauptung.**
 *
 * Zwei weitere Einschränkungen, beide aus dem zweiten Probelauf:
 *
 * 1. **Seiten aus `inhalte/` bleiben außen vor.** Ihr Text ist an der
 *    Quelle geprüft, und dort stehen auch die begründeten Ausnahmen
 *    (`<!-- pruefung: begruendet — … -->`). Die überleben das Rendern
 *    nicht; die Seitenprüfung meldete deshalb genau das wieder, was am
 *    Quelltext bereits abgehandelt war.
 * 2. **Verweise werden zurückverwandelt.** `<a href="x">Text</a>` wird
 *    wieder zu `[Text](x)`, bevor geprüft wird. Sonst verliert eine Zahl
 *    ihre Quelle allein dadurch, dass sie gerendert wurde — der Verweis
 *    *ist* die Fundstelle, und die Regeln erkennen ihn in Markdown-Form.
 */
/**
 * Schneidet den Text heraus, der aus `inhalte/` stammt.
 *
 * **Berichtigt am 28.08.** Vorher übersprang der Prüfer ganze *Seiten*:
 * alles unter `wissen/`, `gruppe/` und `system/`. Die Begründung war richtig
 * — dieser Text ist an der Quelle geprüft, und dort stehen auch die
 * begründeten Ausnahmen, die das Rendern nicht überleben. Die Umsetzung war
 * zu grob:
 *
 * > **Auf einer übersprungenen Seite steht auch Text, den das
 * > Seitenbauwerkzeug selbst schreibt** — und der lief durch keine der
 * > beiden Prüfungen. Nicht in `inhalte/`, also nicht in `pruefe-inhalte`;
 * > auf einer ausgenommenen Seite, also nicht in `pruefe-seiten`.
 *
 * Aufgefallen beim Einbau des Schichtenschnitts, der genau so einen Absatz
 * erzeugt. Der Ausweg ist kein neuer Prüfer, sondern eine schärfere Grenze:
 * Das Seitenbauwerkzeug klammert den Text aus der Quelle in
 * `<!--quelltext-->…<!--/quelltext-->`, und hier wird genau dieser Bereich
 * entfernt. Übrig bleibt, was das Werkzeug selbst geschrieben hat.
 *
 * Fehlt eine Klammer oder steht sie falsch herum, bricht die Prüfung ab
 * statt stillschweigend zu viel oder zu wenig zu lesen — ein Marker, der
 * unbemerkt verrutscht, wäre dieselbe Falle noch einmal.
 */
function ohneQuelltext(html, datei) {
  const { text, fehler } = schneideQuelltext(html);
  if (fehler) {
    console.error(`${datei}: ${fehler} — die Prüfung wäre wertlos.`);
    process.exit(2);
  }
  return text;
}
function seitenAbsaetze(wurzel) {
  const gefunden = [];
  const gehe = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const pfad = join(ordner, eintrag.name);
      if (eintrag.isDirectory()) { gehe(pfad); continue; }
      if (!eintrag.name.endsWith('.html')) continue;
      const roh = readFileSync(pfad, 'utf8');
      const anfang = roh.indexOf('<div class="huelle">');
      const ende = roh.indexOf('<footer>');
      if (anfang < 0 || ende < 0) continue;
      const name0 = pfad.slice(wurzel.length + 1);
      const koerper = ohneQuelltext(roh.slice(anfang, ende), name0);
      const absaetze = [];
      let nummer = 0;
      // `<p([^>]*)>` trifft auch `<path …>` in den SVG-Zeichnungen — und
      // schluckt dann alles bis zum nächsten `</p>`, samt Preistafel. Der
      // gemeldete „Absatz" bestand aus Pfaddaten und Preisen. Deshalb die
      // Wortgrenze: entweder `<p>` oder `<p ` mit Leerzeichen.
      for (const treffer of koerper.matchAll(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/g)) {
        nummer++;
        const merkmale = treffer[1] ?? '';
        const inhalt = treffer[2];
        if (/class="[^"]*\bkrume\b/.test(merkmale)) continue;
        // Markierungsstreifen („81 % unter Listenpreis", „palettiert") sind
        // Etiketten, keine Sätze. Sie stehen zwar in einem <p>, tragen aber
        // keine Aussage, die eine Quelle brauchte.
        if (/class="marker/.test(inhalt)) continue;
        const text = inhalt
          // Der Verweis ist die Fundstelle — er darf beim Entkleiden nicht
          // verlorengehen.
          .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, u, t) => `[${t}](${u})`)
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ').trim();
        if (text.length < 40) continue;
        absaetze.push({ text, zeile: nummer });
      }
      if (absaetze.length) gefunden.push({ datei: name0, absaetze });
    }
  };
  gehe(wurzel);
  return gefunden;
}

if (process.argv[2] === '--seiten') {
  const wurzel = join(hier, '..', 'ausgabe', 'site');
  if (!existsSync(wurzel)) {
    console.error('ausgabe/site/ fehlt — zuerst npm run website.');
    process.exit(2);
  }
  const seiten = seitenAbsaetze(wurzel);
  let absaetze = 0;
  let treffer = 0;
  for (const seite of seiten) {
    absaetze += seite.absaetze.length;
    const meldungen = seite.absaetze
      .map((a) => ({ a, verdacht: pruefeAbsatz(a) }))
      .filter((m) => m.verdacht.length);
    if (!meldungen.length) continue;
    treffer += meldungen.length;
    console.log(`\n${seite.datei}`);
    for (const m of meldungen) {
      console.log(`  Absatz ${m.a.zeile}: ${m.a.text.slice(0, 90)}…`);
      for (const v of m.verdacht) console.log(`    → ${v}`);
    }
  }
  console.log(`\n${seiten.length} Seiten, ${absaetze} Fließtextabsätze geprüft, ${treffer} mit Verdacht.`);
  console.log('Diese Texte stehen im Seitenbauwerkzeug, nicht in inhalte/ — sie unterliegen');
  console.log('trotzdem denselben Regeln.');
  process.exit(0);
}

const argument = process.argv[2];
const ordnerListe = argument === '--probe'
  ? [join(hier, '..', 'inhalte', 'probe')]
  : argument
    ? [argument]
    : INHALTSORDNER.map((o) => join(hier, '..', 'inhalte', o));

const dateien = [];
for (const ordner of ordnerListe) {
  try {
    for (const d of readdirSync(ordner).sort()) {
      if (!d.endsWith('.md')) continue;
      if (!statSync(join(ordner, d)).isFile()) continue;
      dateien.push({ ordner, datei: d });
    }
  } catch (fehler) {
    console.error(`Inhaltsordner nicht lesbar: ${ordner}`);
    console.error(`  ${fehler.message}`);
    process.exit(2);
  }
}

let absaetzeGesamt = 0;
let trefferGesamt = 0;

for (const { ordner, datei } of dateien) {
  const ergebnis = pruefeInhalt(readFileSync(join(ordner, datei), 'utf8'), datei);
  absaetzeGesamt += ergebnis.absaetze;
  if (ergebnis.sauber) continue;
  trefferGesamt += ergebnis.treffer.length;
  console.log(`\n${datei}`);
  for (const t of ergebnis.treffer) {
    console.log(`  Zeile ${t.zeile}: ${t.auszug}…`);
    for (const v of t.verdacht) console.log(`    → ${v}`);
  }
}

console.log(`\n${dateien.length} Dateien, ${absaetzeGesamt} Absätze geprüft, ${trefferGesamt} mit Verdacht.`);
console.log('Jeder Treffer ist anzusehen, nicht automatisch zu beheben.');
console.log('Die Faktenprüfung gegen die Quelle ersetzt dieses Werkzeug nicht.');
process.exit(0);
