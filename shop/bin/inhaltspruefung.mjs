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
import {
  PREISAUSSAGEN, VORRATSWORTE, aussagenbefund, stellenbefund,
} from '../src/aussagen.js';
import { nurText } from '../src/format.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { abbruchtext, frischebefund } from '../src/erzeugnisstand.js';
import {
  pruefeInhalt, pruefeAbsatz, schneideQuelltext, oberflaechensaetze, erfundeneZeitangaben,
} from '../src/inhaltspruefung.js';

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
/** Alle gebauten Seiten — der Bestand, gegen den die geprüfte Zahl steht. */
function zaehleSeiten(wurzel) {
  let n = 0;
  const gehe = (ordner) => {
    for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
      if (eintrag.isDirectory()) gehe(join(ordner, eintrag.name));
      else if (eintrag.name.endsWith('.html')) n++;
    }
  };
  gehe(wurzel);
  return n;
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

/**
 * **Vierter Betriebsmodus, 2. September: die Sätze der Oberfläche.**
 *
 * Ein Drittel des Textes, den ein Kunde in der Kasse und im Warenkorb liest,
 * steht in keiner gebauten Datei — er entsteht erst im Browser aus
 * `shop-ui.js`. Aufgefallen ist das an einer Gegenprobe, die nicht anschlug:
 * `pruefe-seiten` blieb bei einer erfundenen Antwortzeit zu Recht grün, weil
 * der Satz dort gar nicht steht.
 *
 * > **Was erst im Browser entsteht, prüft keine Datei.**
 *
 * Jetzt eine. Dreiundzwanzig Sätze, dieselben Regeln wie überall.
 */
if (process.argv[2] === '--oberflaeche') {
  const quelle = join(hier, '..', 'shop-ui.js');
  if (!existsSync(quelle)) {
    console.error('shop-ui.js fehlt — ohne sie gibt es keine Oberflächensätze.');
    process.exit(2);
  }
  const saetze = oberflaechensaetze(readFileSync(quelle, 'utf8'));
  // Ein leerer Bestand ist kein sauberer: Fände die Auslese nichts mehr,
  // meldete dieser Modus „0 mit Verdacht" und hätte nichts angesehen.
  if (saetze.length < 10) {
    console.error(`Nur ${saetze.length} Sätze gefunden — die Auslese greift nicht mehr.`);
    process.exit(2);
  }
  let treffer = 0;
  for (const [i, text] of saetze.entries()) {
    const verdacht = pruefeAbsatz({ text, zeile: i + 1 });
    // Zusätzlich zu den allgemeinen Regeln: eine fest eingetragene Zeitspanne.
    // Sie kann hier nicht gedeckt sein — die echten Fristen des Shops setzt
    // erst die Laufzeit ein und steht deshalb in keinem Literal.
    for (const zeit of erfundeneZeitangaben(text)) {
      verdacht.push(`Zeitzusage im Quelltext: \u201e${zeit}\u201c \u2014 echte Fristen stehen in den Daten, nicht in shop-ui.js`);
    }
    if (!verdacht.length) continue;
    treffer += 1;
    console.log(`\n  „${text.slice(0, 100)}…"`);
    for (const v of verdacht) console.log(`    → ${v}`);
  }
  console.log(`\n${saetze.length} Sätze der Oberfläche geprüft, ${treffer} mit Verdacht.`);
  console.log('Diese Sätze stehen in shop-ui.js und erreichen den Kunden erst im Browser —');
  console.log('sie unterliegen trotzdem denselben Regeln wie jede Inhaltsseite.');
  if (treffer > 0 && !process.argv.includes('--bericht')) {
    console.log('\nMit Verdacht endet dieser Lauf rot. Mit --bericht nicht.');
    process.exit(1);
  }
  process.exit(0);
}

/** Alle gebauten HTML-Dateien — auch die ohne eigenen Fließtext. */
function alleSeitendateien(wurzel) {
  const gefunden = [];
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, e.name);
      if (e.isDirectory()) gehe(pfad);
      else if (e.name.endsWith('.html')) gefunden.push(pfad);
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
  /**
   * **Vorhanden ist nicht dasselbe wie aktuell.** Ergänzt am 4. September: Die
   * Weigerung, gegen ein veraltetes Erzeugnis zu prüfen, stand seit dem
   * 29. August in zwei von neun Werkzeugen, die eines lesen; die anderen
   * fragten nur, ob es da ist — die Zeile darüber ist genau diese Frage.
   *
   * Sie steht **hier** und nicht im Kopf der Datei: Dieses Werkzeug hat drei
   * Durchgänge, und nur dieser liest das Erzeugnis. Eine Weigerung im Kopf
   * hielte auch die Prüfung der Inhaltsdateien an, die damit nichts zu tun
   * hat — vier Testfälle haben das binnen einer Minute gesagt.
   */
  const stand = frischebefund(join(hier, '..'), 'ausgabe/site');
  if (!stand.frisch) {
    for (const zeile of abbruchtext(stand)) console.error(zeile);
    process.exit(2);
  }
  const seiten = seitenAbsaetze(wurzel);
  const gebaut = zaehleSeiten(wurzel);
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
  /**
   * **Und was die Maschine liest.**
   *
   * Befund vom 2. September: Die Lieferseite trug als einzige keine
   * maschinenlesbare Auszeichnung — ausgerechnet die Seite mit den
   * Frachtsätzen. Beim Nachtragen die zweite Frage: Wer bewacht, dass eine
   * ausgezeichnete Antwort dasselbe sagt wie die Seite?
   *
   * > **Eine Auszeichnung, die mehr sagt als die Seite, ist eine Behauptung
   * > an eine Maschine** — sie wird zitiert und nicht gelesen.
   *
   * Geprüft werden die **Zahlen mit Einheit**; sie sind die nachprüfbare
   * Substanz einer Antwort. Der Wortlaut darf abweichen, die Sätze sind für
   * verschiedene Leser geschrieben. Blanke Zahlen bleiben außen vor: „2"
   * steht auf jeder Seite, „7,50 €" nicht.
   */
  const zahlMitEinheit = /\d+(?:[.,]\d+)?\s*(?:€|%|m²|mm|cm|kg|Bezirke|Werktage?)/g;
  let antworten = 0;
  for (const datei of alleSeitendateien(wurzel)) {
    const html = readFileSync(datei, 'utf8');
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#8239;|&thinsp;/g, ' ')
      .replace(/\s+/g, ' ');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let daten;
      try {
        daten = JSON.parse(m[1]);
      } catch (e) {
        treffer += 1;
        console.log(`\n${datei.split('/site/')[1] ?? datei}`);
        console.log(`    → unlesbares JSON-LD: ${e.message}`);
        continue;
      }
      for (const frage of [].concat(daten.mainEntity ?? [])) {
        const antwort = frage?.acceptedAnswer?.text;
        if (!antwort) continue;
        antworten += 1;
        for (const zahl of antwort.match(zahlMitEinheit) ?? []) {
          if (text.includes(zahl.replace(/\s+/g, ' '))) continue;
          treffer += 1;
          console.log(`\n${datei.split('/site/')[1] ?? datei}`);
          console.log(`    → „${zahl}" steht nur in der Auszeichnung, nicht auf der Seite`);
        }
      }
    }
  }

  /* ---------------------------------------------------------------- *
   * Wo man einen Korb füllt, steht die Grenze — 5. September 2026
   *
   * Gemessen an allen 81 gebauten Seiten: Der Mindestbestellwert (Gate 25)
   * stand auf 48 — auf jeder Artikelseite, auf `lieferung.html`, in den AGB.
   * Auf **keiner** der 19 Seiten mit Artikelkarten: Startseite (46 Karten),
   * sieben Gruppenseiten, vier Systemlisten, sieben Wissensseiten.
   *
   * > **Die Grenze steht auf jeder Seite, auf der man einen Artikel ansieht —
   * > und auf keiner, auf der man eine Bestellung zusammenstellt.**
   *
   * Die Gruppenseiten sind die Landeseiten der bezahlten Anzeigen. Diese
   * Prüfung misst das **Erzeugnis** und nicht den Bauer: Sie schlägt auch an,
   * wenn der Einbau in `bin/website.mjs` entfernt oder ein Seitentyp anders
   * gebaut wird.
   * ---------------------------------------------------------------- */
  /* ---------------------------------------------------------------- *
   * Aussagen über den eigenen Bestand — auf jeder Fläche, nicht nur in
   * der Anzeige (5. September 2026, abends)
   *
   * `PREISAUSSAGEN` und `VORRATSWORTE` gibt es seit dem 31. August und dem
   * 5. September — und beide haben nur Anzeigentexte gelesen. Auf der
   * **Startseite** stand derweil im ersten Satz unter der Hauptüberschrift:
   *
   * > „Was ein Baumeister im Einkauf zahlt, **zahlen Sie auch**"
   *
   * Wörtlich dieselbe Behauptung, die am selben Tag aus der WDVS-Anzeige
   * entfernt wurde — auf der Seite, die jeder zuerst sieht.
   *
   * > **Der Prüfer, der dagegen gebaut wurde, las nur die Anzeigen.**
   *
   * Gesucht wird im **Text**, nicht im Markup: Die Startseite bricht den
   * Satz über zwei Zeilen, und ein Muster über rohes HTML hätte ihn auch
   * jetzt nicht gefunden — dieselbe Falle wie beim Herkunftsmuster.
   * ---------------------------------------------------------------- */
  const alleStellen = [];
  for (const datei of alleSeitendateien(wurzel)) {
    const text = nurText(readFileSync(datei, 'utf8'));
    const name = datei.split('/site/')[1] ?? datei;
    // Alle Fundstellen sammeln — auch die gedeckten. Ohne sie kann die
    // Rückrichtung nicht sagen, ob ein Eintrag noch etwas trifft.
    const pa = PREISAUSSAGEN.find((x) => x.muster.test(text));
    if (pa) alleStellen.push({ datei: name, wort: pa.was });
    for (const wort of VORRATSWORTE) {
      if (text.toLowerCase().includes(wort.toLowerCase())) alleStellen.push({ datei: name, wort });
    }

    for (const m of aussagenbefund(name, text)) {
      treffer += 1;
      console.log(`\n${name}`);
      console.log(m.regel === 'preisgleichheit'
        ? `    → behauptet, ${m.was} — der Verkaufspreis trägt einen Aufschlag, und die eigene\n`
          + '      Wissensseite „Was Baumeisterpreis heißt" sagt das auch'
        : `    → „${m.was}" behauptet Vorrat — der Shop führt kein eigenes Lager`);
    }
  }
  for (const m of stellenbefund(alleStellen)) {
    treffer += 1;
    console.log(`\n${m.datei}`);
    console.log(m.regel === 'stelle-ohne-fall'
      ? `    → als Ausnahme geführt für „${m.was}", die Stelle gibt es nicht mehr`
      : `    → Ausnahme für „${m.was}" ohne tragfähigen Grund`);
  }

  let mitKarten = 0;
  let ohneGrenze = 0;
  for (const datei of alleSeitendateien(wurzel)) {
    const html = readFileSync(datei, 'utf8');
    if (!html.includes('class="karte"')) continue;
    mitKarten += 1;
    if (html.includes('Mindestbestellwert')) continue;
    ohneGrenze += 1;
    treffer += 1;
    console.log(`\n${datei.split('/site/')[1] ?? datei}`);
    console.log('    → zeigt Artikelkarten und nennt den Mindestbestellwert nicht');
  }
  // Ein leerer Lauf ist kein grüner: Fände die Sammlung keine Kartenseite,
  // meldete diese Prüfung „sauber" über nichts.
  if (mitKarten < 15) {
    treffer += 1;
    console.log(`\n    → nur ${mitKarten} Seiten mit Artikelkarten gefunden, erwartet mindestens 15`);
  }

  console.log(`\n${seiten.length} Seiten, ${absaetze} Fließtextabsätze geprüft, ${treffer} mit Verdacht.`);
  console.log(`${mitKarten} Seiten zeigen Artikelkarten, ${mitKarten - ohneGrenze} nennen den Mindestbestellwert.`);
  console.log(`${antworten} maschinenlesbare Antworten gegen den sichtbaren Text gehalten.`);
  console.log('Diese Texte stehen im Seitenbauwerkzeug, nicht in inhalte/ — sie unterliegen');
  console.log('trotzdem denselben Regeln.');
  // Die Zahl oben ist die Zahl der Seiten mit **eigenem** Text und nicht die
  // Zahl der gebauten Seiten. Ohne diesen Satz liest sich „58 Seiten geprüft"
  // wie eine Abdeckung von 58 aus 81 — und die fehlenden 23 sähen aus wie
  // eine Lücke. Sie sind keine: Sie tragen ausschließlich Text aus
  // `inhalte/`, der zwischen den Quelltextmarken steht und an der Quelle
  // geprüft wird. Was hier fehlt, muss trotzdem sichtbar sein, sonst prüft
  // niemand nach.
  // **Berichtigt am 29.08.:** Der Satz lautete „Die übrigen N tragen keinen
  // eigenen Absatz". Seit jede Seite einen Hinweis für Besucher ohne
  // JavaScript trägt, ist N null — und „die übrigen 0" ist kein Satz. Ein
  // Bericht, der bei einer runden Zahl sinnlos wird, hat den Fall nicht
  // vorgesehen.
  const ohneEigenen = gebaut - seiten.length;
  if (ohneEigenen > 0) {
    console.log(`\nGebaut sind ${gebaut} Seiten. Die übrigen ${ohneEigenen} tragen keinen eigenen`);
    console.log('Absatz — ihr Text steht in inhalte/ und wird dort von `npm run pruefe-inhalte` geprüft.');
  } else {
    console.log(`\nGebaut sind ${gebaut} Seiten, und jede trägt mindestens einen eigenen Absatz.`);
    console.log('Der Text aus inhalte/ steht zusätzlich darauf und wird dort geprüft.');
  }
  /**
   * **Berichtigt am 2. September.** Hier stand `process.exit(0)` — ohne
   * Bedingung. Dieser Modus liest 81 gebaute Seiten, zählt die Absätze mit
   * Verdacht, druckt die Zahl und endete **immer grün**. Ein Prüfer, der nicht
   * rot werden kann, ist ein Bericht.
   *
   * Aufgefallen ist es nicht beim Lesen, sondern weil eine Gegenprobe nicht
   * anschlug: Die Mutation kam an, der Prüfer meldete sie, und der Lauf blieb
   * grün. Dieselbe Familie wie `pruefe-inhalte`, `pruefe-quellen` und
   * `pruefe-tests`, bei denen am 1. September derselbe Fehler stand — dieser
   * Modus war übersehen worden.
   *
   * `--bericht` unterdrückt den roten Ausgang, wie in den anderen Modi auch.
   */
  if (treffer > 0 && !process.argv.includes('--bericht')) {
    console.log('\nMit Verdacht endet dieser Lauf rot. Mit --bericht nicht.');
    process.exit(1);
  }
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

/**
 * **Berichtigt am 1. September.** Hier stand `process.exit(0)` — immer, auch
 * mit Funden. Entdeckt hat es das neue Gegenprobenregister: Es hängte
 * „Wir sind garantiert der günstigste Anbieter" an eine Wissensseite, der
 * Prüfer **fand die Erfolgszusage und meldete sie** — und endete mit
 * Rückgabewert 0.
 *
 * Damit stand er in jeder Prüferschleife auf „OK", ganz gleich was er fand.
 * Tagelang habe ich diese Schleife als Statusbericht gelesen.
 *
 * > **Ein Prüfer, der jeden Fund als Verdacht meldet und immer grün endet,
 * > ist ein Bericht, keine Wache.**
 *
 * Der Vorbehalt war richtig gemeint: Ein Treffer ist ein Verdacht und kein
 * Urteil, die Faktenprüfung bleibt Handarbeit. Nur folgt daraus nicht
 * Rückgabewert 0, sondern das Gegenteil — **ein Verdacht, den niemand ansieht,
 * ist ein grünes Licht.** Wer ihn angesehen hat und ihn für unbegründet hält,
 * hat zwei ehrliche Wege: den Satz ändern oder die Regel begründen. Beide
 * hinterlassen etwas; ein stiller Rückgabewert 0 nicht.
 *
 * `--bericht` behält das alte Verhalten für den Fall, dass jemand die Liste
 * nur ansehen will.
 */
// `--probe` ist der Selbstnachweis über eine absichtlich fehlerhafte Datei.
// Er soll finden und melden, nicht sperren — sonst kann das Werkzeug seine
// eigenen Muster nicht mehr vorführen.
if (trefferGesamt > 0 && !process.argv.includes('--bericht') && !process.argv.includes('--probe')) {
  console.log('\nMit Verdacht endet dieser Lauf rot. Mit --bericht nicht.');
  process.exit(1);
}
process.exit(0);
