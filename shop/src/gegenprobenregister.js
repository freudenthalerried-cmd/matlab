/**
 * Das Gegenprobenregister — welcher Prüfer hat je gezeigt, dass er anschlägt?
 *
 * **Der Anlass, 1. September 2026, sechste Runde.** Beim Bauen des
 * Leitzahlprüfers liefen zwei Gegenproben ins Leere: Die eingesetzte falsche
 * Zahl wurde nicht gemeldet, und beide Male sah das Ergebnis aus wie eine
 * bestandene Probe. Erst der dritte Anlauf schlug an.
 *
 * > **Eine Gegenprobe, die man nicht anschlagen sieht, ist keine.**
 *
 * `bin/gegenprobe.mjs` gibt es seit dem 31. August; es wendet **eine**
 * Mutation an und stellt sicher, dass sie ankommt. Was fehlte, ist das
 * Verzeichnis: welche Gegenprobe zu welchem Prüfer gehört, und ob sie heute
 * noch anschlägt. Von Hand ausgeführte Gegenproben hinterlassen nichts — ich
 * habe heute vier gemacht und keine davon wäre morgen noch nachweisbar.
 *
 * Dieses Register führt sie. `npm run gegenproben` wendet jede an, verlangt
 * **vier** Dinge und begnügt sich mit keinem davon allein:
 *
 *   1. Der Prüfer ist **vorher grün** — an einem roten Prüfer lässt sich
 *      nichts zeigen.
 *   2. Die Mutation ist **angekommen** (die Datei hat sich geändert).
 *   3. Der Prüfer meldet **rot** und nennt dabei die erwartete Stelle.
 *   4. Nach dem Zurücksetzen ist er **wieder grün** — sonst hat die Probe
 *      etwas hinterlassen.
 *
 * Und es zählt auf, welche Prüfer **keinen** Eintrag haben. Das ist der
 * eigentliche Ertrag: Ein Prüfer ohne Gegenprobe ist eine Behauptung.
 */

/**
 * Zwei Arten von Mutation, beide über Dateien statt über Befehlszeilen —
 * dieselbe Lehre wie in `gegenprobe.mjs`: Jede Maskierungsschicht ist eine
 * Gelegenheit, dass die Änderung nicht ankommt.
 *
 * `anhaengen` ist die sichere Sorte: Sie kann nichts kaputt machen, was schon
 * da war. `ersetzen` braucht einen Suchtext, der genau einmal vorkommt.
 */
export const ARTEN = Object.freeze(['anhaengen', 'ersetzen']);

export const GEGENPROBEN = Object.freeze([
  Object.freeze({
    id: 'leitzahlen-blanke-alte-zahl',
    pruefer: 'pruefe-leitzahlen',
    was: 'Eine abgelöste Leitzahl ohne ihre Bedingung im Fließtext',
    datei: 'docs/baustoff-shop/weg-zum-ersten-verkauf-nachgerechnet.md',
    art: 'anhaengen',
    text: '\n\nDer nötige Monatsumsatz liegt bei 45.356 €.\n',
    erwartet: /noetiger-monatsumsatz/,
    warum: 'Genau der Fall vom 1. September: die Kartenzahl, blank hingeschrieben. '
      + 'Zwei frühere Fassungen des Prüfers haben ihn nicht gemeldet.',
  }),
  Object.freeze({
    id: 'widerruf-ohne-widerruf',
    pruefer: 'pruefe-widerrufe',
    was: 'Eine zurückgenommene Aussage ohne ihre Rücknahme',
    datei: 'docs/baustoff-shop/weg-zum-ersten-verkauf-nachgerechnet.md',
    art: 'anhaengen',
    text: '\n\nDie Frachtpauschale steht auf jedem Beleg.\n',
    erwartet: /fracht-auf-jedem-beleg/,
    warum: 'Die Aussage ist am 27.08. zurückgenommen worden; sie stand danach noch '
      + 'sechs Tage im Warenkorb, weil der Prüfer die Datei nicht las.',
  }),
  Object.freeze({
    id: 'schaufenster-veraltete-leitzahl',
    pruefer: 'pruefe-schaufenster',
    was: 'Eine überholte Zahl in der PR-Beschreibung',
    datei: 'docs/baustoff-shop/pr-beschreibung.md',
    art: 'ersetzen',
    suchen: '| nötiger Monatsumsatz | 67.826 € | **43.396 €** |',
    ersetzen: '| nötiger Monatsumsatz | 67.826 € | **43.111 €** |',
    erwartet: /Nötiger Monatsumsatz/,
    warum: 'Die Beschreibung ist das Erste, was der Auftraggeber liest. Sie war '
      + 'schon einmal an neun Stellen überholt.',
  }),
  Object.freeze({
    id: 'inhalte-grenzwort',
    pruefer: 'pruefe-inhalte',
    was: 'Ein Werbeversprechen im Shoptext',
    datei: 'shop/inhalte/wissen/baumeisterpreis.md',
    art: 'anhaengen',
    text: '\n\nWir sind garantiert der günstigste Anbieter Österreichs.\n',
    erwartet: /baumeisterpreis/,
    warum: 'Die Redaktionsprinzipien verbieten Superlative ohne Beleg. Ohne Probe '
      + 'ist nicht gezeigt, dass die Regel im Bestand greift und nicht nur in der Probedatei.',
  }),
  Object.freeze({
    id: 'auftrag-beleg-fehlt',
    pruefer: 'pruefe-auftrag',
    was: 'Ein Beleg im Auftragsabgleich, den es nicht gibt',
    datei: 'shop/data/auftragszuordnung.json',
    art: 'ersetzen',
    suchen: '"shop/src/rollout.js"',
    ersetzen: '"shop/src/gibtesnicht.js"',
    erwartet: /beleg-fehlt|gibtesnicht/,
    warum: 'Der Abgleich behauptet, jede Antwort sei belegt. Ohne Probe ist das '
      + 'seine eigene Behauptung über sich selbst.',
  }),
  Object.freeze({
    id: 'belege-betrag-ohne-zustand',
    pruefer: 'pruefe-belege',
    was: 'Eine Rechnung, die eine Endsumme nennt und ihren Zustand verschweigt',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: '    ...vermerk.zeilen,\n',
    ersetzen: '',
    erwartet: /betrag-ohne-zustand/,
    warum: 'Der Befund vom 1. September: Die Buchhaltung des Kunden hätte ein '
      + 'zweites Mal überwiesen.',
  }),
  Object.freeze({
    id: 'quellen-aussage-ohne-beleg',
    pruefer: 'pruefe-quellen',
    was: 'Eine belegpflichtige Aussage ohne Fundstelle',
    datei: 'shop/inhalte/quellen.json',
    art: 'ersetzen',
    suchen: '"quellen": ["etag-004", "oenorm-b6400"]',
    ersetzen: '"quellen": []',
    erwartet: /a-wdvs-system|ohne Quelle|nicht belegt|NICHT VERWENDBAR/i,
    warum: 'Der Prüfer sagt „jede Aussage trägt ihre Quelle". Ohne Probe ist das seine '
      + 'eigene Behauptung über sich selbst — dieselbe Lage wie beim Auftragsabgleich.',
  }),
  Object.freeze({
    id: 'anzeige-verspricht-vollstaendigkeit',
    pruefer: 'kampagne',
    was: 'Eine Anzeige, die Vollständigkeit verspricht, obwohl die Systemliste eine Lücke nennt',
    datei: 'shop/bin/kampagne.mjs',
    art: 'ersetzen',
    suchen: "'Armierung bis Oberputz'",
    ersetzen: "'Fassade komplett liefern'",
    erwartet: /verspricht Vollständigkeit/,
    warum: 'Der teuerste Klick des ersten Anlaufs führte auf ein Versprechen, das die '
      + 'eigene Systemliste im selben Verzeichnis widerlegt — die Dämmplatte in '
      + 'Flächenstärke führt der Shop nicht.',
  }),
  Object.freeze({
    id: 'auftrag-nennt-was-es-nicht-gibt',
    pruefer: 'pruefe-auftrag',
    was: 'Eine Begründung, die einen Befehl nennt, den es nicht gibt',
    datei: 'shop/data/auftragszuordnung.json',
    art: 'ersetzen',
    suchen: 'npm run pruefe-kontrolle',
    ersetzen: 'npm run pruefe-erfunden',
    erwartet: /nennt den Befehl/,
    warum: 'Zum neunten Ergebnis stand ein Vorgang im Präsens, den es nicht gab — die '
      + 'Belegdatei existierte, der Aufruf nicht. Ein Beleg, der existiert, belegt noch nichts.',
  }),
  Object.freeze({
    id: 'kontrolle-margenleck',
    pruefer: 'pruefe-kontrolle',
    was: 'Der Wareneinsatz auf dem Kundenbeleg',
    datei: 'shop/src/beleg.js',
    art: 'ersetzen',
    suchen: "    'Leistungsort Österreich, Steuersatz 20 %.',",
    ersetzen: "    `Wareneinsatz: ${EUR(warenkorb.einkaufNetto)}`,\n    'Leistungsort Österreich, Steuersatz 20 %.',",
    erwartet: /Einkaufszahl|Wareneinsatz/i,
    warum: 'Die Weisung vom 28.08. lautet: keine Spanne ausgeben. Die zweite Rechnung '
      + 'liest den fertigen Belegtext und muss die Einkaufszahl darin finden — sonst '
      + 'bestätigt sie nur, statt zu prüfen.',
  }),
]);

/**
 * Prüfer ohne Gegenprobe — mit dem Grund, warum keine da ist.
 *
 * Der Grund ist Pflicht, aus demselben Grund wie bei `OHNE_WERKZEUG` in
 * `offenepunkte.js`: Wer hier etwas einträgt, das sich leicht gegenproben
 * ließe, soll beim Schreiben des Grundes merken, dass er keinen hat.
 */
export const OHNE_GEGENPROBE = Object.freeze([
  Object.freeze({
    pruefer: 'pruefe-tests',
    warumKeine: 'Er zählt die Testfälle und lässt sie laufen. Eine Gegenprobe wäre ein '
      + 'absichtlich roter Test — und der ganze Lauf dauert vierzehn Sekunden je Durchgang.',
  }),
  Object.freeze({
    pruefer: 'pruefe-pruefer',
    warumKeine: 'Er prüft den Umfang der anderen Prüfer. Seine Gegenprobe wäre ein '
      + 'Prüfer mit leerem Ergebnis — das ist genau, was dieses Register hier tut.',
  }),
  Object.freeze({
    pruefer: 'pruefe-geheimnis',
    warumKeine: 'Seine Mutation wäre, einen Einkaufspreis in eine öffentliche Datei zu '
      + 'schreiben. Auch nur für Sekunden und auch nur lokal — das ist die eine Datei, '
      + 'die diese Arbeit nicht anfassen darf.',
  }),
  Object.freeze({
    pruefer: 'pruefe-seiten',
    warumKeine: 'Drei Versuche, keiner ist angekommen. Er liest die **gebauten** Seiten; '
      + 'ein Absatz in `inhalte/` erreicht ihn erst nach einem Bau, und auch mit Bau '
      + 'dazwischen blieb er stumm. Der Eintrag ist zurückgezogen, weil ein Prüfer, dem '
      + 'eine untaugliche Gegenprobe „schlägt nicht an" bescheinigt, zu Unrecht '
      + 'beschuldigt wird — was fehlt, ist meine Kenntnis seiner Regeln, nicht seine Wachsamkeit.',
  }),
  Object.freeze({
    pruefer: 'pruefe-preise',
    warumKeine: 'Er hält vier Ausgaben gegeneinander, die alle aus **einem** Bau stammen. '
      + 'Eine Mutation, die nur eine davon verschiebt, müsste im Seitenbauwerkzeug ansetzen '
      + 'und dort genau eine Ausgabe treffen. Zwei Versuche waren Leerläufe; der Eintrag '
      + 'wartet, bis ich eine Mutation habe, die ankommt.',
  }),
  Object.freeze({
    pruefer: 'pruefe-preisalter',
    warumKeine: 'Seine Grundlage ist `preise/` — außerhalb des Verzeichnisses und die eine '
      + 'Datei, die diese Arbeit nicht anfasst. Eine Mutation im Katalog änderte den '
      + 'Preisstand, nicht den Preis, und prüfte damit etwas anderes.',
  }),
  Object.freeze({
    pruefer: 'pruefe-stand',
    warumKeine: 'Seine Mutation ist eine **neue Datei**, nicht eine geänderte. Das Werkzeug '
      + 'kann bisher nur ändern und zurückschreiben; eine Datei anzulegen und zu löschen '
      + 'ist eine andere Zusicherung, und eine halbe wäre schlechter als keine.',
  }),
]);

/** Was das Register über sich selbst weiß. */
export function registerbefund(pruefernamen, proben = GEGENPROBEN, ohne = OHNE_GEGENPROBE) {
  const mitProbe = new Set(proben.map((p) => p.pruefer));
  const begruendet = new Set(ohne.map((o) => o.pruefer));
  const unerklaert = pruefernamen.filter((n) => !mitProbe.has(n) && !begruendet.has(n));

  for (const p of proben) {
    if (!ARTEN.includes(p.art)) throw new Error(`Unbekannte Mutationsart „${p.art}" bei ${p.id}`);
    if (p.art === 'ersetzen' && (p.suchen === undefined || p.ersetzen === undefined)) {
      throw new Error(`„ersetzen" braucht suchen und ersetzen: ${p.id}`);
    }
    if (p.art === 'anhaengen' && !p.text) throw new Error(`„anhaengen" braucht text: ${p.id}`);
    if (!p.warum || p.warum.length < 30) throw new Error(`Ohne Begründung kein Eintrag: ${p.id}`);
  }
  for (const o of ohne) {
    if (!o.warumKeine || o.warumKeine.length < 30) throw new Error(`Ohne Grund kein Eintrag: ${o.pruefer}`);
  }

  return {
    proben: proben.length,
    gedeckt: mitProbe.size,
    begruendet: begruendet.size,
    unerklaert,
    vollstaendig: unerklaert.length === 0,
  };
}
