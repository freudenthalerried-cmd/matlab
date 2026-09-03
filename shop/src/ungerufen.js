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
 */

/** Zeilen, die keinen Aufruf enthalten können, auch wenn der Name darin steht. */
const IST_LISTE = /^\s*(import|export)\s*\{|^\s*\w+,\s*$|^\s*\w+\s*$/;

/**
 * Die Ausfuhren, die außerhalb der Tests niemand ruft.
 *
 * @param {{name: string, text: string}[]} dateien  Quelltexte **ohne** Kommentare
 * @returns {{modul: string, funktion: string}[]} nach Modul und Name sortiert
 */
export function ungerufeneAusfuehrungen(dateien) {
  const gefunden = [];
  for (const datei of dateien) {
    if (!datei.name.startsWith('src/')) continue;
    for (const m of datei.text.matchAll(/export function (\w+)/g)) {
      const name = m[1];
      const definition = new RegExp(`export function ${name}\\b`);
      const aufruf = new RegExp(`\\b${name}\\s*[(,)]`);
      const gerufen = dateien.some((d) => d.text.split('\n').some(
        (zeile) => !definition.test(zeile) && !IST_LISTE.test(zeile) && aufruf.test(zeile),
      ));
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
    modul: 'src/ablage.js',
    funktionen: ['alsCsv', 'aufbewahrungBis', 'pruefeAblagefelder', 'pruefeNummernkreis',
      'stelleRechnungAus', 'storniere', 'vorgangsakte'],
    warum: 'Die Ablage ist gebaut und **nicht in Betrieb**: Sie vergibt fortlaufende '
      + 'Rechnungsnummern nach § 11 Abs 1 Z 5 UStG und hält die Aufbewahrung nach § 132 BAO. '
      + 'Beides beginnt mit dem ersten echten Vorgang — und der beginnt mit einem '
      + 'Zahlungsanbieter, der beim Auftraggeber liegt. Ein Werkzeug, das heute Nummern '
      + 'zöge, schriebe eine Reihe, die mit dem ersten Kunden nicht mehr stimmt.',
  }),
  Object.freeze({
    modul: 'src/aussentexte.js',
    funktionen: ['ungenannteAusgaenge'],
    warum: 'Die Regel des Ausgangsverzeichnisses steht in `test/aussentexte.test.js` und '
      + 'läuft dort gegen den echten Bestand. Diese Funktion ist ihr Hilfsmittel und kein '
      + 'zweiter Weg — sie an ein Werkzeug zu hängen hieße, dieselbe Prüfung zweimal zu '
      + 'führen und beim nächsten Umbau eine der beiden zu vergessen.',
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
    modul: 'src/speicher.js',
    funktionen: ['ausJournal', 'journalzeile'],
    warum: 'Dasselbe wie bei der Ablage: Das Journal schreibt erst, wenn ein echter Vorgang '
      + 'läuft. Es hängt am selben offenen Punkt — dem Zahlungsanbieter, der eine Ausgabe '
      + 'ist und beim Auftraggeber liegt.',
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
      + 'Arbeitsumgebung nicht erreichbar (der Netzausgang ist gesperrt). Beide Funktionen '
      + 'verarbeiten ihre **Antwort** — sie können erst laufen, wenn es eine gibt.',
  }),
  Object.freeze({
    modul: 'src/vorgang.js',
    funktionen: ['ablageEintraege'],
    warum: 'Weiß, welche Spuren ein Vorgang in der Ablage hinterlässt. Sie hängt am selben '
      + 'Punkt wie die Ablage selbst: `npm run vorgang` legt bewusst nichts ab, weil ein '
      + 'Werkzeug, das nebenbei Dateien anlegt, im ersten Betriebsmonat die Quelle der '
      + 'Frage „welcher Stand gilt" ist.',
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
