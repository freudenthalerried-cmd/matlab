/**
 * Das Crawler-Register — wen dieser Shop einlässt, wen er aussperrt, und warum.
 *
 * **Der Anlass, 2. September 2026.** In `maschinenlesbar.js` standen zwei
 * flache Listen von Zeichenketten: `SUCH_CRAWLER` und `TRAININGS_CRAWLER`.
 * Keine Begründung je Kennung, kein Anbieter, keine Regel — und damit die
 * einzige Stelle im Bestand, an der eine Entscheidung ohne Register getroffen
 * wird. Überall sonst gilt hier: **eine Liste, ein Pflichtgrund je Eintrag,
 * ein Prüfer, der die Liste gegen die Wirklichkeit hält.** Die Widerrufe, die
 * Leitzahlen, die Außentexte, die offenen Punkte, die Gegenproben — alle nach
 * diesem Muster. Die robots.txt nicht.
 *
 * Beim Aufschreiben der Gründe fielen sofort zwei Löcher auf, und genau dafür
 * ist der Pflichtgrund da:
 *
 * 1. **„Training gesperrt" stimmte nicht.** Gesperrt waren `GPTBot`,
 *    `ClaudeBot` und `CCBot`. Apple durfte mitlesen, weil seine
 *    Trainingskennung `Applebot-Extended` in keiner der beiden Listen stand —
 *    nicht entschieden, sondern vergessen. Eine Aussage, die für drei von vier
 *    gilt, ist keine Regel, sondern ein Zufall.
 *
 * 2. **`Google-Extended` war als Trainingskennung geführt und gesperrt.** Das
 *    ist die eine Sperre in der Liste, die keinen Ausweg lässt: Für OpenAI und
 *    Anthropic steht neben der gesperrten Trainingskennung eine erlaubte
 *    Suchkennung, über die der Assistent die Seiten trotzdem liest. Für Google
 *    stand daneben nichts. Damit war es keine Trainingsentscheidung.
 *
 * > **Eine Sperre ohne erlaubte Geschwisterkennung sperrt nicht das Training,
 * > sondern den Anbieter.**
 *
 * Dieser Satz ist aus dem Register heraus prüfbar — er braucht keine Auskunft
 * von außen, sondern nur die Frage, ob für einen Anbieter, der Fragen
 * beantwortet, noch irgendeine Kennung erlaubt ist.
 *
 * **Was dieses Register nicht kann.** Es weiß nicht, was eine Kennung beim
 * Anbieter tatsächlich auslöst; die Belege dafür stehen in den
 * Crawler-Dokumentationen der Anbieter, und der Netzausgang dieser Umgebung
 * ist gesperrt (403 am Proxy, am 2. September erneut geprüft). Was hier steht,
 * ist die **Absicht** des Shops und ihre innere Widerspruchsfreiheit. Wo eine
 * Entscheidung auf einer nicht belegbaren Annahme über einen Anbieter beruht,
 * steht die Annahme im Grund — nachlesbar und widerlegbar, statt still.
 */

/**
 * Wofür eine Kennung steht.
 *
 * `suche`  — der Crawler, der den Index des Assistenten füllt. Wer hier
 *            sperrt, kommt in den Antworten nicht vor.
 * `nutzer` — der Abruf, den ein Mensch auslöst, indem er den Assistenten nach
 *            uns fragt. Die unmittelbarste Sichtbarkeit, die es gibt.
 * `training` — das Sammeln von Modellmaterial. Ohne unmittelbare Wirkung auf
 *            die Sichtbarkeit; hier gesperrt.
 */
export const ZWECKE = Object.freeze(['suche', 'nutzer', 'training']);

/** Erlaubt oder gesperrt — mehr Zustände gibt es in einer robots.txt nicht. */
export const ZUGAENGE = Object.freeze(['erlaubt', 'gesperrt']);

/**
 * Die Anbieter.
 *
 * `beantwortetFragen` ist das Feld, an dem die erste Regel hängt: Ein
 * Anbieter, der Endkunden Fragen beantwortet, ist ein Vertriebskanal. Ein
 * Archiv ist keiner. Deshalb ist `CCBot` gesperrt, ohne dass die Regel
 * anschlägt, und deshalb wäre dieselbe Sperre bei Google etwas anderes.
 */
export const ANBIETER = Object.freeze([
  Object.freeze({
    name: 'OpenAI',
    beantwortetFragen: true,
    trainingskennung: 'GPTBot',
  }),
  Object.freeze({
    name: 'Anthropic',
    beantwortetFragen: true,
    trainingskennung: 'ClaudeBot',
  }),
  Object.freeze({
    name: 'Google',
    beantwortetFragen: true,
    trainingskennung: null,
    warumKeineTrainingskennung: 'Google führt für den Assistenten keine von der Trainingsfrage '
      + 'getrennte Kennung. `Google-Extended` ist die einzige, und sie steht hier deshalb unter '
      + '`suche` und nicht unter `training` — sie zu sperren hieße, den Anbieter zu sperren.',
  }),
  Object.freeze({
    name: 'Perplexity',
    beantwortetFragen: true,
    trainingskennung: null,
    warumKeineTrainingskennung: 'Perplexity ist in diesem Register nur mit Such- und '
      + 'Nutzerkennung geführt. Eine eigene Trainingskennung ist hier nicht belegt, und eine '
      + 'erfundene Kennung in der robots.txt wäre schlechter als keine: Sie sperrt nichts und '
      + 'täuscht, dass etwas gesperrt sei.',
  }),
  Object.freeze({
    name: 'Apple',
    beantwortetFragen: true,
    trainingskennung: 'Applebot-Extended',
  }),
  Object.freeze({
    name: 'Common Crawl',
    beantwortetFragen: false,
    trainingskennung: 'CCBot',
  }),
]);

/**
 * Die Kennungen, Zeile für Zeile, jede mit Grund.
 *
 * Die Reihenfolge ist die der ausgelieferten Datei: erst wer hereindarf, dann
 * wer nicht. Wer eine Kennung hinzufügt, schreibt den Grund dazu —
 * `pruefeRegister` verlangt ihn.
 */
export const KENNUNGEN = Object.freeze([
  Object.freeze({
    kennung: 'OAI-SearchBot',
    anbieter: 'OpenAI',
    zweck: 'suche',
    zugang: 'erlaubt',
    warum: 'Füllt den Index, aus dem ChatGPT Anbieter nennt. Das ist Weg 2 des '
      + 'Sichtbarkeitskonzepts und der Grund, weshalb dieser Shop maschinenlesbare Preise trägt.',
  }),
  Object.freeze({
    kennung: 'ChatGPT-User',
    anbieter: 'OpenAI',
    zweck: 'nutzer',
    zugang: 'erlaubt',
    warum: 'Der Abruf, den ein Mensch auslöst, wenn er nach uns fragt. Bis zum 2. September nur '
      + 'über die Sammelzeile `User-agent: *` erlaubt — also so lange, wie niemand diese Zeile '
      + 'anfasst. Eine Sichtbarkeit, die an einer Sammelzeile hängt, gehört benannt.',
  }),
  Object.freeze({
    kennung: 'Claude-SearchBot',
    anbieter: 'Anthropic',
    zweck: 'suche',
    zugang: 'erlaubt',
    warum: 'Dasselbe für Claude: getrennte Kennung für die Suche, deshalb ausdrücklich erlaubt.',
  }),
  Object.freeze({
    kennung: 'Claude-User',
    anbieter: 'Anthropic',
    zweck: 'nutzer',
    zugang: 'erlaubt',
    warum: 'Der vom Menschen ausgelöste Abruf. Vorher nur über die Sammelzeile erlaubt.',
  }),
  Object.freeze({
    kennung: 'PerplexityBot',
    anbieter: 'Perplexity',
    zweck: 'suche',
    zugang: 'erlaubt',
    warum: 'Perplexity beantwortet Kaufabsichtsfragen mit Quellenangabe — der Kanal, in dem ein '
      + 'kleiner Anbieter mit klaren Preisen am ehesten vorkommt.',
  }),
  Object.freeze({
    kennung: 'Perplexity-User',
    anbieter: 'Perplexity',
    zweck: 'nutzer',
    zugang: 'erlaubt',
    warum: 'Der vom Menschen ausgelöste Abruf. Vorher nur über die Sammelzeile erlaubt.',
  }),
  Object.freeze({
    kennung: 'Applebot',
    anbieter: 'Apple',
    zweck: 'suche',
    zugang: 'erlaubt',
    warum: 'Speist Siri und die Spotlight-Suche. Kostet nichts und erreicht Geräte, auf denen '
      + 'keine der anderen Kennungen unterwegs ist.',
  }),
  Object.freeze({
    kennung: 'Google-Extended',
    anbieter: 'Google',
    zweck: 'suche',
    zugang: 'erlaubt',
    warum: 'Umgestellt am 2. September, vorher gesperrt. Sie stand in der Trainingsliste, aber '
      + 'für Google steht daneben keine erlaubte Suchkennung — die Sperre schloss damit den '
      + 'Anbieter aus und nicht das Training. Die Abwägung ist einseitig: Sperrt man zu Unrecht, '
      + 'kostet das genau das Ziel dieses Shops, gefunden zu werden; erlaubt man zu Unrecht, '
      + 'kostet es Trainingsmaterial, was das Sichtbarkeitskonzept selbst „eine Geschmacksfrage '
      + 'ohne unmittelbare Wirkung auf die Sichtbarkeit" nennt. **Annahme, hier nicht belegbar:** '
      + 'dass diese Kennung beim Anbieter auch den Assistenten steuert und nicht nur das '
      + 'Training. Der Netzausgang ist gesperrt; die Herstellerdokumentation ist von hier aus '
      + 'nicht lesbar. Die Annahme steht als Punkt im Register der offenen Punkte.',
  }),
  Object.freeze({
    kennung: 'GPTBot',
    anbieter: 'OpenAI',
    zweck: 'training',
    zugang: 'gesperrt',
    warum: 'Reines Trainingssammeln. Die Suche läuft über OAI-SearchBot und bleibt offen; die '
      + 'Sperre kostet deshalb keine Sichtbarkeit.',
  }),
  Object.freeze({
    kennung: 'ClaudeBot',
    anbieter: 'Anthropic',
    zweck: 'training',
    zugang: 'gesperrt',
    warum: 'Dasselbe: Claude-SearchBot bleibt offen, also kostet die Sperre keine Antwort.',
  }),
  Object.freeze({
    kennung: 'Applebot-Extended',
    anbieter: 'Apple',
    zweck: 'training',
    zugang: 'gesperrt',
    warum: 'Am 2. September nachgetragen. Sie fehlte in beiden Listen — nicht entschieden, '
      + 'sondern vergessen: Apple durfte als einziger Anbieter, der Fragen beantwortet, '
      + 'mittrainieren, während die Aussage nach außen „Training gesperrt" lautete.',
  }),
  Object.freeze({
    kennung: 'CCBot',
    anbieter: 'Common Crawl',
    zweck: 'training',
    zugang: 'gesperrt',
    warum: 'Ein Archiv, kein Assistent — es beantwortet niemandem eine Frage und ist deshalb '
      + 'kein Vertriebskanal. Die Sperre kostet nichts und ist die einzige, die auch ohne '
      + 'Geschwisterkennung unbedenklich ist.',
  }),
]);

/** Kennungen eines Zwecks. */
export function kennungenNach(zweck, kennungen = KENNUNGEN) {
  return kennungen.filter((k) => k.zweck === zweck);
}

/**
 * Erste Regel: Sperrt eine Zeile den Anbieter statt sein Training?
 *
 * Ein Anbieter, der Fragen beantwortet, muss mindestens eine erlaubte Kennung
 * mit Zweck `suche` oder `nutzer` haben. Hat er keine, ist jede Sperre bei ihm
 * ein Ausschluss — unabhängig davon, was in der Spalte `zweck` steht.
 */
export function anbieterOhneAusweg(kennungen = KENNUNGEN, anbieter = ANBIETER) {
  const befunde = [];
  for (const a of anbieter) {
    if (!a.beantwortetFragen) continue;
    const seine = kennungen.filter((k) => k.anbieter === a.name);
    if (seine.length === 0) continue;
    const offen = seine.filter((k) => k.zugang === 'erlaubt' && k.zweck !== 'training');
    if (offen.length === 0) {
      befunde.push(`${a.name}: keine erlaubte Such- oder Nutzerkennung — die Sperre schließt den `
        + 'Anbieter aus und nicht sein Training');
    }
  }
  return befunde;
}

/**
 * Zweite Regel: Gilt „Training gesperrt" für alle, die Fragen beantworten?
 *
 * Entweder der Anbieter hat eine Trainingskennung im Register und die ist
 * gesperrt — oder es steht dort, warum er keine hat. Eine dritte Möglichkeit,
 * nämlich das stille Fehlen, ist genau der Fall Apple vom 2. September.
 */
export function ungleicheTrainingssperren(kennungen = KENNUNGEN, anbieter = ANBIETER) {
  const befunde = [];
  for (const a of anbieter) {
    if (!a.beantwortetFragen) continue;
    if (a.trainingskennung == null) {
      if (!a.warumKeineTrainingskennung || a.warumKeineTrainingskennung.length < 40) {
        befunde.push(`${a.name}: keine Trainingskennung und kein Grund dafür — „Training `
          + 'gesperrt" gilt für ihn dann nicht, und niemand hat es entschieden');
      }
      continue;
    }
    const eintrag = kennungen.find((k) => k.kennung === a.trainingskennung);
    if (!eintrag) {
      befunde.push(`${a.name}: Trainingskennung ${a.trainingskennung} genannt, steht aber in `
        + 'keiner Zeile der robots.txt');
    } else if (eintrag.zugang !== 'gesperrt') {
      befunde.push(`${a.name}: ${a.trainingskennung} ist erlaubt, während sie bei anderen `
        + 'Anbietern gesperrt ist — die Aussage nach außen wäre unwahr');
    }
  }
  return befunde;
}

/** Formfehler im Register selbst: fehlende Gründe, unbekannte Werte, Doppel. */
export function pruefeRegister(kennungen = KENNUNGEN, anbieter = ANBIETER) {
  const befunde = [];
  const namen = new Set(anbieter.map((a) => a.name));
  const gesehen = new Set();
  for (const k of kennungen) {
    if (gesehen.has(k.kennung)) befunde.push(`${k.kennung}: steht zweimal im Register`);
    gesehen.add(k.kennung);
    if (!ZWECKE.includes(k.zweck)) befunde.push(`${k.kennung}: unbekannter Zweck „${k.zweck}"`);
    if (!ZUGAENGE.includes(k.zugang)) befunde.push(`${k.kennung}: unbekannter Zugang „${k.zugang}"`);
    if (!namen.has(k.anbieter)) befunde.push(`${k.kennung}: Anbieter „${k.anbieter}" ist nicht geführt`);
    // Dieselbe Untergrenze wie bei den Außentexten und den offenen Punkten:
    // Ein Grund, der in vierzig Zeichen passt, ist meistens keiner.
    if (!k.warum || k.warum.length < 40) befunde.push(`${k.kennung}: ohne belastbaren Grund`);
  }
  return befunde;
}

/** Alle Regeln auf einmal. */
export function pruefeCrawler(kennungen = KENNUNGEN, anbieter = ANBIETER) {
  return [
    ...pruefeRegister(kennungen, anbieter),
    ...anbieterOhneAusweg(kennungen, anbieter),
    ...ungleicheTrainingssperren(kennungen, anbieter),
  ];
}

/**
 * Hält die ausgelieferte robots.txt gegen das Register.
 *
 * Geprüft wird beides: Steht jede Kennung des Registers mit dem richtigen
 * Zustand in der Datei — und steht in der Datei keine Kennung, die im Register
 * fehlt. Die zweite Richtung ist die wichtigere: Eine Zeile, die niemand
 * eingetragen hat, ist eine Entscheidung, die niemand getroffen hat.
 */
export function vergleicheMitDatei(text, kennungen = KENNUNGEN) {
  const befunde = [];
  const zeilen = String(text).split('\n').map((z) => z.trim());
  const inDatei = new Map();
  for (const [i, z] of zeilen.entries()) {
    const treffer = /^User-agent:\s*(.+)$/i.exec(z);
    if (!treffer) continue;
    const name = treffer[1].trim();
    const folge = zeilen.slice(i + 1).find((f) => /^(Allow|Disallow):/i.test(f));
    inDatei.set(name, /^Allow:/i.test(folge ?? '') ? 'erlaubt' : 'gesperrt');
  }
  for (const k of kennungen) {
    const ist = inDatei.get(k.kennung);
    if (ist === undefined) befunde.push(`${k.kennung}: steht im Register, aber nicht in robots.txt`);
    else if (ist !== k.zugang) befunde.push(`${k.kennung}: Register sagt ${k.zugang}, robots.txt sagt ${ist}`);
    inDatei.delete(k.kennung);
  }
  for (const name of inDatei.keys()) {
    // Die Sammelzeile ist kein Registereintrag, sondern die Voreinstellung
    // für alles Unbenannte. Sie steht in `robotsTxt` und ist dort erklärt.
    if (name === '*') continue;
    befunde.push(`${name}: steht in robots.txt, aber in keinem Registereintrag`);
  }
  return befunde;
}
