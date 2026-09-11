/**
 * Welche Ausfuhr ruft außerhalb der Tests niemand?
 *
 * **Der Anlass, 3. September 2026.** `erzeugeAngebot` gab es seit dem
 * 31. August — mit Bindefrist, Pflichtangaben nach § 11 UStG, eigener Prüfung
 * und siebzehn Testfällen. Aufgerufen hat sie außerhalb der Tests **genau eine
 * Stelle: ihr eigener Prüfer, mit einem erfundenen Warenkorb.** Am selben
 * Abend fiel `pruefeAnfrageAufGeheimnis` auf, die zweite Reihe gegen
 * Einkaufszahlen im Kundentext: dieselbe Lage, drei Tage lang.
 *
 * > **Eine Funktion, die nur ihre Tests rufen, ist ein Entwurf und kein
 * > Betriebsmittel.** Sie ist geprüft — aber geprüft ist nicht dasselbe wie
 * > angeschlossen, und der Unterschied fällt niemandem auf, weil beide Male
 * > grün danebensteht.
 *
 * Beide Male hat es ein Mensch beim Hinsehen gefunden, nicht ein Werkzeug.
 * Diese Datei macht daraus eine Messung — nach demselben Muster wie die
 * Widerrufe, die Leitzahlen, die Außentexte, die offenen Punkte, die
 * Gegenproben und das Crawler-Register: **eine Liste, ein Pflichtgrund je
 * Eintrag, ein Prüfer, der die Liste gegen die Wirklichkeit hält.**
 *
 * ## Die Messung und ihre Grenze
 *
 * Gezählt wird, ob der Name einer Ausfuhr im **kommentarfreien** Quelltext von
 * `src/`, `bin/` und `shop-ui.js` irgendwo als Aufruf vorkommt — außerhalb
 * ihrer eigenen Definitionszeile und außerhalb der Import- und Exportlisten.
 * Das ist keine Erreichbarkeitsanalyse: Eine Funktion, die nur von einer
 * anderen ungerufenen gerufen wird, gilt hier als gerufen.
 *
 * > **Die Messung irrt damit in eine Richtung: Sie findet zu wenig, nie zu
 * > viel.** Wer im Register steht, ist wirklich ungerufen; wer fehlt, kann es
 * > trotzdem sein. Für den Zweck reicht das — es geht um die Funktion, die
 * > gebaut, geprüft und dann vergessen wurde, und die hat gar keinen Rufer.
 *
 * Kommentare zählen ausdrücklich **nicht** mit. Sonst hätte der Satz „gerufen
 * hat `erzeugeAngebot` niemand" die Funktion als gerufen gemeldet — ein
 * Register, das sich an seiner eigenen Begründung sattsieht.
 *
 * ## Was am 9. September dazukam
 *
 * Drei Ausfuhren standen als gerufen da und waren es nicht. Alle drei aus
 * demselben Grund: **Die Messung kannte Funktionen bei ihrem Vornamen und
 * zählte Erwähnungen wie Aufrufe.**
 *
 * 1. **Ein Name ist nur in seinem Modul eindeutig.** Acht Namen gibt es im
 *    Bestand zweimal. Wurde einer gerufen, galt der andere als gerufen — so
 *    blieb `vergleiche` aus `zahlung.js` unsichtbar, die Tafel, auf der
 *    Gate 21 ruht, weil `import.js` eine gleichnamige Funktion hat.
 * 2. **Eine Zeichenkette ist kein Code.** `pruefeAblageAufDrittdaten` galt
 *    als gerufen, weil ihr Name in `src/ablage.js` in einem Feldtext steht:
 *    „Schranke: keine Daten Dritter (pruefeAblageAufDrittdaten)".
 * 3. **Ein Muster ist kein Aufruf.** `zeitstempel` galt als gerufen, weil
 *    der Name in einem regulären Ausdruck vorkommt.
 *
 * Seither zählt ein Aufruf nur dort, wo die Datei den Namen **aus diesem
 * Modul** eingeführt hat — oder wo sie aus dem Browserbündel läuft und gar
 * nichts einführen kann. Zeichenketten und Muster fallen vorher heraus.
 *
 * Die Richtung des Irrtums bleibt dieselbe: Mehrzeilige Schablonen bleiben
 * unangetastet, weil in ihnen echter Code zwischen HTML-Anführungszeichen
 * steht. Wer sie wie Code behandelt, verliert Aufrufe und meldet Funde, die
 * es nicht gibt.
 */

/** Zeilen, die keinen Aufruf enthalten können, auch wenn der Name darin steht. */
const IST_LISTE = /^\s*(import|export)\s*\{|^\s*\w+,\s*$|^\s*\w+\s*$/;

/**
 * Die Dateien, die im Browser **aus dem Bündel** laufen. Sie führen nichts
 * ein — der Bau fügt die Module davor. Für sie gilt weiter der bloße Name.
 */
export const GEBUENDELT = Object.freeze(['shop-ui.js', 'shop-bestellen.js']);

/** Vor einem Muster steht eines dieser Zeichen, nie ein Wert. */
const VOR_MUSTER = /[=(,:[!&|?;]\s*$/;

/**
 * Eine Zeile ohne ihre Zeichenketten und ohne ihre Muster.
 *
 * **Der Anlass, 9. September 2026.** `pruefeAblageAufDrittdaten` galt als
 * gerufen, weil ihr Name in `src/ablage.js` in einer **Zeichenkette** steht
 * („Schranke: keine Daten Dritter (pruefeAblageAufDrittdaten)"). Und
 * `zeitstempel` galt als gerufen, weil der Name in einem **Muster** steht.
 * Kommentare entfernt diese Messung seit ihrem ersten Tag, aus genau diesem
 * Grund — Zeichenketten und Muster nicht.
 *
 * > **Eine Erwähnung ist kein Aufruf.** Der Unterschied entscheidet, ob eine
 * > gebaute und geprüfte Funktion angeschlossen ist oder nur beschrieben.
 */
function ohneTexteInZeile(zeile) {
  const s = String(zeile ?? '');
  let aus = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") {
      i += 1;
      while (i < s.length && s[i] !== c) i += s[i] === '\\' ? 2 : 1;
      i += 1;
      aus += `${c}${c}`;
      continue;
    }
    if (c === '/' && VOR_MUSTER.test(aus)) {
      let j = i + 1;
      let inKlasse = false;
      let gefunden = false;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '[') inKlasse = true;
        else if (s[j] === ']') inKlasse = false;
        else if (s[j] === '/' && !inKlasse) { gefunden = true; break; }
        j += 1;
      }
      if (gefunden) { i = j + 1; aus += '//'; continue; }
    }
    aus += c;
    i += 1;
  }
  return aus;
}

/**
 * Der Quelltext ohne Zeichenketten und ohne Muster, Zeile für Zeile.
 *
 * **Mehrzeilige Schablonen bleiben stehen.** `bin/website.mjs` baut die
 * Seiten aus Schablonen, und darin steht echter Code in `${…}` — mitten
 * zwischen Anführungszeichen eines HTML-Merkmals:
 *
 * ```
 * <meta name="description" content="${esc(kurzfassung(seite.kurz, 300))}">
 * ```
 *
 * Wer diese Zeile wie Code behandelt, hält `content="` für den Anfang einer
 * Zeichenkette und verliert den Aufruf darin — ein **Fund, den es nicht
 * gibt**. Deshalb bleibt alles zwischen zwei Rückstrichen unangetastet.
 *
 * > **Die Messung irrt weiter in die Richtung, die sie selbst nennt: Sie
 * > findet zu wenig, nie zu viel.**
 */
export function ohneTexte(quelltext) {
  let inSchablone = false;
  return String(quelltext ?? '').split('\n').map((zeile) => {
    if (inSchablone) {
      // Zählen, ob die Schablone auf dieser Zeile endet — und wieder beginnt.
      for (let i = 0; i < zeile.length; i += 1) {
        if (zeile[i] === '\\') { i += 1; continue; }
        if (zeile[i] === '`') inSchablone = !inSchablone;
      }
      return zeile;
    }
    const rein = ohneTexteInZeile(zeile);
    for (let i = 0; i < rein.length; i += 1) {
      if (rein[i] === '\\') { i += 1; continue; }
      if (rein[i] === '`') inSchablone = !inSchablone;
    }
    return rein;
  }).join('\n');
}

/**
 * Unter welchem Namen eine fremde Datei diese Ausfuhr ruft — oder `null`,
 * wenn sie sie gar nicht einführt.
 *
 * **Der Anlass, 9. September 2026.** Bis dahin suchte die Messung den bloßen
 * Namen im ganzen Bestand. Ein Name ist aber nur **innerhalb seines Moduls**
 * eindeutig: Acht Namen gibt es im Bestand zweimal, und wurde einer der
 * beiden irgendwo gerufen, galt der andere als gerufen. So blieb
 * `vergleiche` aus `zahlung.js` unsichtbar — die Tafel, auf der Gate 21
 * ruht —, weil `import.js` eine gleichnamige Funktion hat, die gerufen wird.
 */
function ortsname(text, name, quellen) {
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const woher = m[2].split('/').pop();
    if (!quellen.has(woher)) continue;
    for (const teil of m[1].split(',')) {
      const stuecke = teil.trim().split(/\s+as\s+/).map((x) => x.trim());
      if (stuecke[0] === name) return stuecke[stuecke.length - 1];
    }
  }
  return null;
}

/**
 * Die Ausfuhren, die außerhalb der Tests niemand ruft.
 *
 * @param {{name: string, text: string}[]} dateien  Quelltexte **ohne** Kommentare
 * @param {string[]} [gebuendelt]  Dateien, die ohne Einfuhr aus dem Bündel laufen
 * @returns {{modul: string, funktion: string}[]} nach Modul und Name sortiert
 */
export function ungerufeneAusfuehrungen(dateien, gebuendelt = GEBUENDELT) {
  /*
   * **Zwei Fassungen je Datei, und das ist keine Doppelung.** Die Einfuhren
   * stehen in Zeichenketten — `from './zahlung.js'` —, die Aufrufe stehen
   * daneben im Code. Wer beides in derselben Fassung sucht, verliert
   * entweder die Herkunft oder zählt Erwähnungen als Aufrufe.
   */
  const ohne = dateien.map((d) => ({
    name: d.name,
    text: d.text,
    zeilen: ohneTexte(d.text).split('\n'),
  }));

  // Wer einen Namen weiterexportiert, ist eine zweite Quelle für ihn.
  const weiter = new Map();
  for (const d of ohne) {
    for (const m of d.text.matchAll(/export\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const woher = m[1].split('/').pop();
      if (!weiter.has(woher)) weiter.set(woher, new Set());
      weiter.get(woher).add(d.name.split('/').pop());
    }
  }

  const gefunden = [];
  for (const datei of ohne) {
    if (!datei.name.startsWith('src/')) continue;
    const modul = datei.name.split('/').pop();
    const quellen = new Set([modul, ...(weiter.get(modul) ?? [])]);
    // **Nur am Zeilenanfang.** Ein `export function` mitten in einer Zeile
    // steht in einem Mutationstext oder in einem Beispiel, nicht im Bestand.
    for (const m of datei.zeilen.join('\n').matchAll(/^export function (\w+)/gm)) {
      const name = m[1];
      const definition = new RegExp(`export function ${name}\\b`);
      let gerufen = false;
      for (const d of ohne) {
        const hier = d.name === datei.name || gebuendelt.includes(d.name)
          ? name : ortsname(d.text, name, quellen);
        if (!hier) continue;
        const aufruf = new RegExp(`\\b${hier}\\s*[(,)]`);
        if (d.zeilen.some(
          (zeile) => !definition.test(zeile) && !IST_LISTE.test(zeile) && aufruf.test(zeile))) {
          gerufen = true;
          break;
        }
      }
      if (!gerufen) gefunden.push({ modul: datei.name, funktion: name });
    }
  }
  return gefunden.sort((a, b) => (a.modul === b.modul
    ? a.funktion.localeCompare(b.funktion) : a.modul.localeCompare(b.modul)));
}

/**
 * Das Register: ungerufene Ausfuhren mit dem Grund, warum das in Ordnung ist.
 *
 * Gruppiert nach Modul, weil der Grund je Modul derselbe ist — und ein Grund,
 * der für sechs Funktionen gilt, wird nicht dadurch besser, dass man ihn
 * sechsmal umschreibt. Wo zwei Funktionen eines Moduls aus verschiedenen
 * Gründen ungerufen sind, gehören sie in zwei Einträge.
 */
export const UNGERUFEN = Object.freeze([
  Object.freeze({
    modul: 'src/abgleich.js',
    funktionen: ['alsUebersicht', 'pruefeAbgleich', 'pruefeDatenfluesse'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt statt in einem Werkzeug. '
      + '`test/abgleich.test.js` ruft `pruefeAbgleich` gegen die **echten** Module und '
      + 'verlangt Vollständigkeit; damit läuft er in Schritt 1 des Gesamtlaufs mit. Was '
      + 'fehlt, ist nur die Ausgabe (`alsUebersicht`) — ein Bericht, den heute niemand '
      + 'liest. Der Anschluss an `pruefregister.js` wäre Bequemlichkeit, keine Prüfung.',
  }),
  Object.freeze({
    modul: 'src/abholung.js',
    funktionen: ['abholungsbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/lieferungen.js` und '
      + '`src/llmsdeckung.js`. `test/abholung.test.js` hält ihn gegen alle 82 gebauten Seiten '
      + 'und gegen `llms.txt`; er läuft damit in Schritt 1 des Gesamtlaufs mit. Der Bau kann '
      + 'ihn nicht rufen, weil er den fertigen Ordner misst. `abholungssatz` und '
      + '`abholungslage` stehen nicht hier: Die ruft der Bau, und genau darum geht es.',
  }),
  Object.freeze({
    modul: 'src/ablage.js',
    funktionen: ['alsCsv', 'aufbewahrungBis', 'pruefeAblagefelder',
      'stelleRechnungAus', 'storniere', 'vorgangsakte'],
    warum: 'Seit dem 4. September ist die Ablage in Betrieb — `npm run vorgang --ablegen` '
      + 'schreibt Angebot und Auftragsbestätigung ins Journal. Was hier bleibt, hängt an der '
      + '**Rechnung**, und die entsteht in keinem Werkzeug dieses Bestands: Sie braucht '
      + 'Lieferdatum und Zahlungseingang, also einen Zahlungsanbieter, der eine Ausgabe ist '
      + 'und beim Auftraggeber liegt. `storniere` und `vorgangsakte` setzen eine ausgestellte '
      + 'Rechnung voraus, `alsCsv` eine Buchhaltung, die etwas abholt, `aufbewahrungBis` '
      + 'einen Beleg, dessen Frist zu berechnen wäre. Der frühere Grund an dieser Stelle war '
      + 'falsch: Er nannte den Zahlungsanbieter für die **ganze** Ablage. Gefehlt hat kein '
      + 'Anbieter, sondern ein Ort, an dem Kundendaten liegen dürfen.',
  }),
  Object.freeze({
    modul: 'src/aussentexte.js',
    funktionen: ['ungenannteAusgaenge', 'internabefund'],
    warum: 'Die Regel des Ausgangsverzeichnisses steht in `test/aussentexte.test.js` und '
      + 'läuft dort gegen den echten Bestand. Diese Funktion ist ihr Hilfsmittel und kein '
      + 'zweiter Weg — sie an ein Werkzeug zu hängen hieße, dieselbe Prüfung zweimal zu '
      + 'führen und beim nächsten Umbau eine der beiden zu vergessen. **Seit dem '
      + '11. September gilt dasselbe für `internabefund`**, und zwar aus einem zwingenderen '
      + 'Grund: Er hält die Liste der Internaproben gegen das Verzeichnis, und diese Liste '
      + 'kann nur dort stehen, wo die Texte auch **erzeugt** werden — in '
      + '`test/ausgangsinterna.test.js`. Ein Werkzeug müsste sie aus dem Quelltext einer '
      + 'Testdatei lesen; dann prüfte es eine Aufzählung statt einen Text.',
  }),
  Object.freeze({
    modul: 'src/bedarf.js',
    funktionen: ['berechneBedarf'],
    warum: 'Der Bedarfsrechner gehört zum **Radonzweig**, dem älteren der beiden Modelle. '
      + 'Nach Gate 12 liegen beide gleichrangig im Bestand; gebaut wird derzeit der '
      + 'Baustoffhandel, und dessen Seiten führen keinen Bedarfsrechner. Ungerufen heißt '
      + 'hier: nicht dieses Modell, nicht dieser Monat.',
  }),
  Object.freeze({
    modul: 'src/beleg.js',
    funktionen: ['reihengeschaeftEinordnung'],
    warum: 'Die umsatzsteuerliche Einordnung des Reihengeschäfts — sie betrifft den '
      + '**Eingang** (innergemeinschaftlicher Erwerb bei ausländischen Herstellern) und '
      + 'nicht den Kundenbeleg. Sie gehört auf keinen Text, der aus dem Haus geht, sondern '
      + 'in die Unterlage für die Steuerberatung, und die entsteht mit der Gründung.',
  }),
  Object.freeze({
    modul: 'src/buendel.js',
    funktionen: ['importhuelle'],
    warum: 'Rechnet aus, was eine Modulliste an Abhängigkeiten mitzieht. Genutzt wird sie '
      + 'von `test/buendel.test.js`, um `BROWSERMODULE` gegen die Wirklichkeit zu halten — '
      + 'genau dort gehört sie hin. Der Bau selbst braucht nicht die Hülle, sondern die '
      + 'Reihenfolge, und die liefert `reihenfolge()`.',
  }),
  Object.freeze({
    modul: 'src/crawler.js',
    funktionen: ['kennungenNach'],
    warum: 'Ein Auswahlhelfer über dem Crawler-Register. `npm run pruefe-crawler` und die '
      + 'robots.txt kommen ohne ihn aus, weil sie beide über das ganze Register laufen. Er '
      + 'steht für den Fall bereit, dass eine Ausgabe einmal nur die Suchkennungen braucht '
      + '— bis dahin ist er eine Ausfuhr ohne Anlass.',
  }),
  Object.freeze({
    modul: 'src/eignungsgrenzen.js',
    funktionen: ['grenzenbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/abholung.js` und '
      + '`src/lieferungen.js`. `test/eignungsgrenzen.test.js` hält ihn gegen alle 46 gebauten '
      + 'Artikelseiten und läuft damit in Schritt 1 des Gesamtlaufs mit. Der Bau kann ihn nicht '
      + 'rufen: Er misst die fertigen Seiten, die der Bau erst am Ende hat. `grenzenbausteine` '
      + 'steht nicht hier — die ruft der Bau für jede Artikelseite.',
  }),
  Object.freeze({
    modul: 'src/empfindlichkeit.js',
    funktionen: ['rangfolge'],
    warum: 'Sagt, welche der vier unbelegten Annahmen zuerst gemessen gehört. Ihr Ergebnis '
      + 'steht in `docs/baustoff-shop/` und ist eine **einmalige** Auskunft: Die Rangfolge '
      + 'ändert sich erst, wenn eine der vier gemessen ist — und dann ist die Frage eine '
      + 'andere. Ein Werkzeug, das sie stündlich neu ausrechnet, rechnet stündlich dasselbe.',
  }),
  Object.freeze({
    modul: 'src/gebiet.js',
    funktionen: ['vorsorgeauskunft'],
    warum: 'Die Gebietsauskunft des **Radonzweigs** über die Negativliste. Dasselbe wie beim '
      + 'Bedarfsrechner: gleichrangig nach Gate 12, gebaut wird gerade das andere Modell. '
      + 'Der Baustoffhandel hat seine eigene Gebietsfrage (Gate 23) in `liefergebiet.js`.',
  }),
  Object.freeze({
    modul: 'src/gegenprobenregister.js',
    funktionen: ['suchtextbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — und dort mit Absicht. Er hält jeden '
      + 'Suchtext des Registers gegen die Datei, die er treffen soll, und meldet, wenn er '
      + 'gar nicht oder zweimal passt. `bin/gegenprobenlauf.mjs` weigert sich seit dem '
      + '7. September bei mehrfachem Treffer selbst, aber erst mitten im zwanzigminütigen '
      + 'Lauf und nur für die Probe, die gerade dran ist. `test/gegenprobenregister.test.js` '
      + 'misst dasselbe über jeden ersetzenden Eintrag in Millisekunden und mutiert '
      + 'nichts. Der Läufer kann ihn nicht rufen: Er prüft das Register, in dem der Läufer '
      + 'selbst steht, und tut es, bevor irgendetwas ausgeführt wird.',
  }),
  Object.freeze({
    modul: 'src/kontrolle.js',
    funktionen: ['pruefeBestellung'],
    warum: 'Die zweite Rechnung liest Belegtexte zurück. `npm run pruefe-kontrolle` führt '
      + 'sieben Kontrollen; die Bestellprüfung ist die achte und läuft in '
      + '`test/kontrolle.test.js` gegen erzeugte Bestelltexte. Sie in das Werkzeug zu '
      + 'nehmen hieße, ihm einen Bestellauftrag zu erfinden — und genau davon lebt der '
      + 'Befund vom 3. September: erfundene Vorlagen prüfen Möglichkeiten statt Fälle.',
  }),
  Object.freeze({
    modul: 'src/kostenbild.js',
    funktionen: ['kaskade', 'mehrumsatzGegenVorkasse',
      'mindestwarenkorbFreiHaus', 'proBestellung', 'zahlwegGegenSkonto'],
    warum: 'Die Wirtschaftlichkeitsrechnung. Ihre Ergebnisse stehen als **Leitzahlen** in '
      + '`src/leitzahlen.js` und werden von `npm run pruefe-leitzahlen` gegen die Dokumente '
      + 'gehalten — dort liegt die Wiederholung, nicht in einem Werkzeug, das die Kaskade '
      + 'täglich neu druckt. Was hier fehlt, fiele dem Leitzahlenprüfer auf.',
  }),
  Object.freeze({
    modul: 'src/krume.js',
    funktionen: ['krumenbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/sitemapstand.js` und '
      + '`src/merkblattverweis.js`. `test/krume.test.js` hält ihn gegen alle 82 gebauten '
      + 'Seiten und läuft damit in Schritt 1 des Gesamtlaufs mit. Der Bau kann ihn nicht '
      + 'rufen: Er misst die fertige Seite, aus der die Auszeichnung gerade erst entstanden '
      + 'ist. `krumeAusHtml` und `brotkrume` stehen nicht hier — die ruft der Rahmen für jede '
      + 'Seite.',
  }),
  Object.freeze({
    modul: 'src/lieferungen.js',
    funktionen: ['lieferungsbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/abgleich.js` und '
      + '`src/llmsdeckung.js`. `test/lieferungen.test.js` hält ihn gegen **alle** gebauten '
      + 'Seiten und gegen `llms.txt` und läuft damit in Schritt 1 des Gesamtlaufs mit. Der Bau '
      + 'selbst kann ihn nicht rufen: Er misst den fertigen Ordner, den der Bau erst am Ende '
      + 'vollständig hat. `lieferungssatz` und `lieferantenzahl` stehen nicht hier — die ruft '
      + 'der Bau bei jeder Seite, und genau darum geht es.',
  }),
  Object.freeze({
    modul: 'src/llmsdeckung.js',
    funktionen: ['llmsbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt statt in einem Werkzeug — dieselbe Lage '
      + 'wie bei `src/abgleich.js`. `test/llmsdeckung.test.js` ruft ihn gegen die **gebaute** '
      + 'Site und die ausgelieferte `llms.txt` und läuft damit in Schritt 1 des Gesamtlaufs '
      + 'mit; ein eigenes `npm run`-Werkzeug brächte keine zusätzliche Prüfung, sondern eine '
      + 'zweite Stelle, an der dieselbe Liste zu pflegen wäre. Der Bau selbst kann ihn nicht '
      + 'rufen: Er misst das Ergebnis des Baus gegen den Ordner, den der Bau erst am Ende '
      + 'vollständig hat.',
  }),
  Object.freeze({
    modul: 'src/dienstseiten.js',
    funktionen: ['dienstseitenbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/abholung.js` und '
      + '`src/lieferungen.js`. `test/dienstseiten.test.js` hält das Verzeichnis gegen den '
      + 'ausgelieferten Suchindex und läuft damit in Schritt 1 des Gesamtlaufs mit. Der Bau '
      + 'kann ihn nicht rufen: Er prüft die Datei, die der Bau gerade schreibt. `DIENSTSEITEN` '
      + 'steht nicht hier — die Aufzählung selbst geht in den Index, und genau darum geht es.',
  }),
  Object.freeze({
    modul: 'src/merkblattverweis.js',
    funktionen: ['merkblattbefund', 'selbstbeschreibungsbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/eignungsgrenzen.js` und '
      + '`src/abholung.js`. `test/merkblattverweis.test.js` hält ihn gegen die gebauten '
      + 'Inhaltsseiten und läuft damit in Schritt 1 des Gesamtlaufs mit. Der Bau kann ihn nicht '
      + 'rufen: Er misst die fertigen Seiten. `herstellerDerGruppe` und `MERKBLATT` stehen '
      + 'nicht hier — die ruft der Bau bei jeder Inhaltsseite. **Seit dem 10. September** '
      + 'steht `selbstbeschreibungsbefund` daneben: Er hält den Satz in `llms.txt` gegen die '
      + 'gebauten Artikelseiten und wohnt aus demselben Grund im Testfall — der Bau schreibt '
      + 'die Datei, die er prüft. `merkblattsatz` und `merkblattdeckung` stehen nicht hier: '
      + 'Die ruft der Bau, um den Satz überhaupt erst zu schreiben, und genau darum geht es.',
  }),
  Object.freeze({
    modul: 'src/messwert.js',
    funktionen: ['ordneEin'],
    warum: 'Die Einordnung eines Radon-Messwerts — Radonzweig, wie Bedarfsrechner und '
      + 'Gebietsauskunft. Sie gehört auf eine Seite, die dieses Modell noch nicht hat.',
  }),
  Object.freeze({
    modul: 'src/quellen.js',
    funktionen: ['unabhaengig'],
    warum: 'Sagt, ob zwei Belege wirklich voneinander unabhängig sind. `npm run '
      + 'pruefe-quellen` prüft heute sechs belegpflichtige Aussagen auf Fundstelle und '
      + 'Stand, nicht auf Unabhängigkeit — die Frage stellt sich erst, wenn eine Aussage '
      + 'auf zwei Belegen ruht. Bis dahin eine Regel ohne Fall.',
  }),
  Object.freeze({
    modul: 'src/sitemapstand.js',
    funktionen: ['sitemapbefund'],
    warum: 'Ein Prüfer, der in den Testfällen wohnt — wie `src/merkblattverweis.js` und '
      + '`src/eignungsgrenzen.js`. `test/sitemapstand.test.js` hält ihn gegen die gebaute '
      + '`sitemap.xml` und die Änderungsgeschichte der Quelldateien; er läuft damit in '
      + 'Schritt 1 des Gesamtlaufs mit. Der Bau kann ihn nicht rufen: Er misst die fertige '
      + 'Datei, die der Bau erst schreibt. `lastmodFuer` steht nicht hier — die ruft der Bau '
      + 'für jeden Eintrag.',
  }),
  Object.freeze({
    modul: 'src/verhandlung.js',
    funktionen: ['rueckwaertsKatalog', 'spielraumAusRabatt', 'staffel'],
    warum: 'Rechnet, welchen Einkauf oder Rabatt es für eine Zielmarge braucht — Zuarbeit '
      + 'für **ein Gespräch mit dem Lieferanten**, das noch nicht geführt ist. Es steht als '
      + 'offener Punkt mit fünf Fragen bereit und ist freigabepflichtig, weil es eine '
      + 'Anfrage an Dritte ist.',
  }),
  Object.freeze({
    modul: 'src/vies.js',
    funktionen: ['belegzeile', 'ergaenzeFreigabe'],
    warum: 'Die UID-Abfrage beim EU-Informationsaustauschsystem ist aus dieser '
      + 'Arbeitsumgebung nicht erreichbar: ec.europa.eu antwortet nicht, am 10. September '
      + 'gemessen. Beide Funktionen '
      + 'verarbeiten ihre **Antwort** — sie können erst laufen, wenn es eine gibt.',
  }),
  Object.freeze({
    modul: 'src/vorgang.js',
    funktionen: ['ablageEintraege'],
    warum: 'Sie baut **alle** Spuren eines Vorgangs auf einmal: die Lieferantenbestellungen, '
      + 'den Vermerk über die Auftragsbestätigung und das Angebot. Seit dem 4. September legt '
      + '`npm run vorgang --ablegen` ab — aber je Aufruf genau das eine Papier, das '
      + 'hinausgeht. Das Journal hält fest, **was geschehen ist**; eine Lieferantenbestellung, '
      + 'die niemand aufgegeben hat, gehört nicht hinein, und nach § 131 BAO bleibt sie dort '
      + 'stehen. Die falsche Körnung, nicht der falsche Zeitpunkt.',
  }),
  Object.freeze({
    modul: 'src/zahlung.js',
    funktionen: ['wirkungAufBestellung'],
    warum: 'Rechnet die Wirkung eines Zahlwegs auf eine einzelne Bestellung. Gate 21 ist '
      + 'damit entschieden (EPS und Vorkasse), und die Zahlen stehen in der '
      + 'PR-Beschreibung, die `npm run pruefe-schaufenster` gegen den Bestand hält. Die '
      + 'Rechnung ist gelaufen; wiederholt wird ihr Ergebnis, nicht sie.',
  }),
]);

/** Kürzester Grund, der noch einer ist. */
export const GRUND_MINDESTLAENGE = 120;

/**
 * Hält das Register gegen die Wirklichkeit — in beide Richtungen.
 *
 * Die zweite Richtung ist die, die man vergisst: Ein Eintrag bleibt stehen,
 * die Funktion ist längst angeschlossen, und das Register führt eine
 * Entschuldigung für einen Zustand, den es nicht mehr gibt.
 */
export function pruefeUngerufen(tatsaechlich, register = UNGERUFEN) {
  const meldungen = [];
  const imRegister = new Map();
  for (const eintrag of register) {
    if (!eintrag.warum || eintrag.warum.length < GRUND_MINDESTLAENGE) {
      meldungen.push({
        regel: 'grund-zu-kurz',
        text: `${eintrag.modul}: der Grund ist ${eintrag.warum?.length ?? 0} Zeichen lang — `
          + `unter ${GRUND_MINDESTLAENGE} ist er eine Behauptung`,
      });
    }
    for (const f of eintrag.funktionen) {
      const schluessel = `${eintrag.modul}#${f}`;
      if (imRegister.has(schluessel)) {
        meldungen.push({ regel: 'doppelt-gefuehrt', text: `${schluessel} steht zweimal im Register` });
      }
      imRegister.set(schluessel, eintrag);
    }
  }

  const offen = new Set(tatsaechlich.map((t) => `${t.modul}#${t.funktion}`));
  for (const schluessel of offen) {
    if (!imRegister.has(schluessel)) {
      meldungen.push({
        regel: 'ohne-grund',
        text: `${schluessel} ruft außerhalb der Tests niemand — und das Register sagt nicht, warum`,
      });
    }
  }
  for (const schluessel of imRegister.keys()) {
    if (!offen.has(schluessel)) {
      meldungen.push({
        regel: 'grund-ohne-fall',
        text: `${schluessel} wird inzwischen gerufen — der Eintrag entschuldigt einen Zustand, `
          + 'den es nicht mehr gibt, und gehört gestrichen',
      });
    }
  }
  return { meldungen, gefuehrt: imRegister.size, gefunden: offen.size, sauber: meldungen.length === 0 };
}
