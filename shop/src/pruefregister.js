/**
 * Das Register der Prüfer — wer geprüft wird, wenn `npm run pruefe-pruefer` läuft.
 *
 * **Hierher verlegt am 01.09.** Es stand in `bin/prueferpruefung.mjs`, also in
 * einem Skript, das beim Laden losläuft — und war damit von keiner Probe
 * erreichbar. Am selben Tag ist genau das eingetreten: `pruefe-preisalter` kam
 * dazu, das Register nicht, und der Prüfer der Prüfer meldete weiter „8 Prüfer
 * befragt, 0 ohne belastbaren Umfang". Ein vollständiges Ergebnis über eine
 * unvollständige Liste.
 *
 * Dieselbe Familie wie der Widerrufsprüfer zwei Tage davor: **Nicht das
 * Urteil war falsch, sondern die Menge, über die geurteilt wurde.**
 *
 * `mindestens` ist kein Bestandsmaß, sondern eine Untergrenze der
 * Belastbarkeit: Sie sagt, ab welchem Umfang die Aussage eines Prüfers
 * überhaupt etwas wert ist. Ein Prüfer, der „0 von 0 geprüft" meldet, ist
 * grün und nutzlos.
 */
export const PRUEFER = [
  {
    name: 'pruefe-inhalte',
    werkzeug: 'inhaltspruefung.mjs',
    muster: /(\d+) Dateien, (\d+) Absätze geprüft/,
    einheit: 'Inhaltsseiten',
    mindestens: 20,
  },
  {
    name: 'pruefe-seiten',
    werkzeug: 'inhaltspruefung.mjs',
    argumente: ['--seiten'],
    muster: /(\d+) Seiten, (\d+) Fließtextabsätze geprüft/,
    einheit: 'gebaute Seiten',
    mindestens: 40,
  },
  {
    name: 'pruefe-quellen',
    werkzeug: 'quellenpruefung.mjs',
    muster: /Aussagen: \d+ von (\d+) belegt/,
    einheit: 'belegpflichtige Aussagen',
    mindestens: 5,
  },
  {
    name: 'pruefe-widerrufe',
    werkzeug: 'widerrufpruefung.mjs',
    muster: /(\d+) Dateien, (\d+) Fundstellen/,
    einheit: 'Verzeichnisdateien',
    mindestens: 90,
  },
  {
    name: 'pruefe-geheimnis',
    werkzeug: 'geheimnispruefung.mjs',
    muster: /(\d+) von (\d+) Einkaufspreisen/,
    einheit: 'Artikel',
    mindestens: 40,
    zweite: true,
  },
  {
    name: 'pruefe-tests',
    werkzeug: 'testpruefung.mjs',
    muster: /(\d+) Testfälle geprüft/,
    einheit: 'Testfälle',
    mindestens: 500,
  },
  // Der Preisabgleich zählt Artikel über vier Ausgaben. Zeigt er eines Tages
  // auf einen leeren Katalog, meldet er „0 Artikel geprüft" — ohne
  // Mindestmaß sähe das wie Grün aus.
  {
    name: 'pruefe-preise',
    werkzeug: 'preisabgleich.mjs',
    muster: /(\d+) Artikel geprüft/,
    einheit: 'Artikel über vier Ausgaben',
    mindestens: 30,
  },
  {
    name: 'pruefe-stand',
    werkzeug: 'standpruefung.mjs',
    muster: /(\d+) von (\d+) Dateien sind in STATUS\.md genannt/,
    einheit: 'Arbeitsdateien',
    mindestens: 100,
    zweite: true,
  },
  {
    name: 'pruefe-preisalter',
    werkzeug: 'preisalterpruefung.mjs',
    muster: /Preisalter am \d{4}-\d{2}-\d{2} — (\d+) Artikel/,
    einheit: 'Artikel mit Preisstand',
    mindestens: 40,
  },
  {
    name: 'pruefe-auftrag',
    werkzeug: 'auftragspruefung.mjs',
    muster: /Auftragsabgleich — (\d+) Ergebnisse/,
    einheit: 'Ergebnisse des Ursprungsauftrags',
    mindestens: 8,
  },
  {
    name: 'pruefe-schaufenster',
    werkzeug: 'schaufensterpruefung.mjs',
    muster: /Schaufensterabgleich: (\d+) Kennzahlen/,
    einheit: 'Kennzahlen der PR-Beschreibung',
    mindestens: 12,
  },
];

/**
 * Die Browserproben.
 *
 * Sie bleiben aus dem Regellauf heraus, weil jede einen Chromium-Start je
 * Einheit kostet — je Szenario bei den Proben, je gebauter Seite beim
 * Zensus; zusammen gut eine Minute. Mit `--mit-browser` kommen sie
 * dazu. Geprüft wird auch hier nur der **Umfang**: Eine gelöschte Datei mit
 * Szenarien fiele sonst niemandem auf.
 *
 * Für die Frage, ob ein einzelnes Szenario etwas gesehen hat, ist dieses
 * Werkzeug der falsche Ort. Das muss jedes Szenario selbst beweisen — durch
 * eine Erwartung, die auf einer leeren Seite nicht erfüllbar ist (die
 * Überschrift, die Zahl der gefundenen Elemente, der Zustand **vor** der
 * geprüften Handlung).
 */
export const BROWSERPRUEFER = [
  {
    name: 'oberflaechenprobe',
    werkzeug: 'oberflaechenprobe.mjs',
    muster: /(\d+) Szenarien/,
    einheit: 'Szenarien',
    mindestens: 9,
  },
  {
    name: 'shopprobe',
    werkzeug: 'shopprobe.mjs',
    muster: /(\d+) Szenarien/,
    einheit: 'Szenarien',
    mindestens: 18,
  },
  // Der Zensus zählt keine Szenarien, sondern gebaute Seiten. Genau deshalb
  // steht er hier: Zeigt er eines Tages auf einen leeren Ausgabeordner,
  // meldet er „0 von 0 Seiten" — und das sähe ohne Mindestmaß wie Grün aus.
  {
    name: 'rahmenzensus',
    werkzeug: 'rahmenzensus.mjs',
    muster: /(\d+) von (\d+) Seiten rollen/,
    einheit: 'gebaute Seiten im 390-px-Rahmen',
    mindestens: 40,
    zweite: true,
  },
];
