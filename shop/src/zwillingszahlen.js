/**
 * Zahlen, die es nur einmal geben darf — und wo sie trotzdem stehen.
 *
 * **Der Anlass, 11. September 2026.** Drei Tage hintereinander ist dieselbe
 * Bauart aufgefallen, jedes Mal durch Zufall und jedes Mal an einer Zahl, an
 * der Geld hängt:
 *
 * | Tag | Zahl | wo sie zweimal stand |
 * |---|---|---|
 * | 10.09. | Bindefrist 14 Tage | Beleg und Artikelseite (ein Stand je Ware) |
 * | 11.09. | Kaufquote 0,02 | Annahmenregister und Gebotsrechnung |
 * | 11.09. | Zielmarge 0,25 | Katalog und Annahmenregister |
 * | 11.09. | Umsatzsteuer 0,20 | **vier** Fassungen, drei davon gebunden |
 *
 * Jedes Mal stand die Gleichheit in einem **Satz** — *„deckungsgleich mit
 * ZIELMARGE"*, *„DIESELBE GRÖSSE wie die Kaufquote der Kampagne"* — und nicht
 * in einem Aufruf.
 *
 * > **Drei Funde durch Zufall sind kein Grund zu glauben, es seien die
 * > letzten.**
 *
 * ## Was dieses Register nicht ist
 *
 * Es ist **keine Jagd auf doppelte Literale**. Der Bestand ist voll von
 * Zahlen, die zufällig gleich sind: `fixEuro: 0.25` ist die Kartengebühr von
 * 25 Cent und hat mit der Zielmarge nichts zu tun — `bin/geheimnispruefung.mjs`
 * trägt diese Falle seit dem 5. September ausgeschrieben im Kopf, weil sie
 * schon einmal zugeschnappt ist.
 *
 * Geführt werden deshalb nur Zahlen, die **eine Heimat** haben: eine Ausfuhr,
 * die sie erklärt. Jedes weitere Vorkommen desselben Literals im Quelltext
 * muss entweder diese Heimat lesen — dann steht dort kein Literal mehr — oder
 * hier mit Grund stehen.
 *
 * Und in der Gegenrichtung: Eine Ausnahme, deren Vorkommen verschwunden ist,
 * wird gemeldet. Ein Verzeichnis, das Gründe für Zustände führt, die es nicht
 * mehr gibt, wächst und sagt immer weniger.
 */

/**
 * Kommentare heraus, bevor gesucht wird.
 *
 * Ohne diesen Schritt fände der Prüfer jede Zahl, über die irgendwo ein Satz
 * geschrieben steht — und dieser Bestand schreibt viele Sätze über seine
 * Zahlen. Gemessen wird der Code, nicht die Begründung.
 */
export function ohneKommentare(quelltext) {
  return String(quelltext ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Dateien, die über den Bestand **reden**, statt mit ihm zu rechnen.
 *
 * Beide zitieren Quelltext und beschreiben Befunde — in Zeichenketten, nicht
 * in Kommentaren, also kommen sie durch `ohneKommentare` unbeschadet hindurch.
 * Sie hier auszunehmen ist dieselbe Lehre wie beim Gate-Prüfer, der über sich
 * selbst gestolpert ist, weil er seine Fundstelle wörtlich mitführte:
 *
 * > **Ein Verzeichnis, das Quelltext zitiert, ist Quelltext.**
 *
 * `zwillingszahlen.js` steht dabei aus einem besonderen Grund in seiner
 * eigenen Liste: Es trägt jede geführte Zahl im Feld `literal` und meldete
 * sich beim ersten Lauf dreimal selbst.
 */
const REDEN_UEBER_DEN_BESTAND = Object.freeze([
  'src/zwillingszahlen.js',
  'src/gegenprobenregister.js',
]);

/**
 * Trägt dieser Text die **Zahl** — gleich, wie sie geschrieben ist?
 *
 * **Der Fund, 13. September 2026.** Bis dahin verglich dieses Register
 * Zeichenketten: gesucht wurde `0.20`, und `0.2` fand es nicht.
 *
 * > **Zwei Schreibweisen derselben Zahl sind dieselbe Zahl. Ein Register, das
 * > Zeichen vergleicht statt Werte, führt genau die Zwillinge, die niemand
 * > versteckt hat.**
 *
 * Verborgen blieben dadurch zwei Fundstellen des Steuersatzes, beide als
 * `0.2`: die begründete in `src/shopkern.js` (`UST_SATZ_KUNDE`, seit dem
 * 30. August von einem Testfall gehalten) und eine **unbegründete** in
 * `src/skonto.js` — dort als Vorgabewert einer Parameterliste. Genau die
 * Bauart, die `shopkern.js` am 30. August bei sich selbst beschrieben hat:
 * *„nicht falsch, aber unauffindbar."*
 *
 * Verglichen werden deshalb **Werte**. Gelesen wird jede Zahl als eigenes
 * Wort: Vor ihr darf kein Zeichen stehen, das sie fortsetzt (Ziffer,
 * Buchstabe, Punkt, Unterstrich), und dahinter auch nicht — sonst träfe `0.20`
 * in `0.255`, in `10.20` und in einem Bezeichner wie `satz0`.
 */
export function traegtZahl(text, literal) {
  const wert = Number(literal);
  if (!Number.isFinite(wert)) return false;
  for (const treffer of String(text).matchAll(/(^|[^0-9A-Za-z_.])(-?\d+(?:\.\d+)?)(?![0-9A-Za-z_.])/g)) {
    if (Number(treffer[2]) === wert) return true;
  }
  return false;
}

/** Die Zahlen mit einer Heimat. */
export const ZWILLINGE = Object.freeze([
  Object.freeze({
    id: 'umsatzsteuer',
    literal: '0.20',
    heimat: 'src/preis.js',
    name: 'UST_SATZ',
    was: 'der österreichische Normalsteuersatz, mit dem jeder Kundenpreis brutto wird',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'src/kontrolle.js',
        warum: 'Die Belegkontrolle führt bewusst eine eigene Zahl, damit sie nicht dasselbe '
          + 'liest wie das Geprüfte — eine Kontrolle, die den Prüfling importiert, prüft sich '
          + 'selbst. Am 30.08. geprüft und stehen gelassen; `test/kontrolle.test.js` liest den '
          + 'Quelltext dieser Datei und hält ihr Literal gegen `preis.js`.',
      }),
      Object.freeze({
        datei: 'src/shopkern.js',
        warum: '`UST_SATZ_KUNDE = 0.2` — dieselbe Zahl mit weniger Wissen drumherum. Sie kann '
          + 'die Heimat nicht lesen: `preis.js` trägt die Margenregel und darf nicht ins '
          + 'Browserbündel. Gehalten wird sie von zwei Testfällen gegen `UST_SATZ` '
          + '(`test/kontrolle.test.js`, `test/zwillingszahlen.test.js`). **Sichtbar ist sie '
          + 'erst seit dem 13. September:** Bis dahin verglich dieses Register Zeichenketten '
          + 'und suchte `0.20`, während hier `0.2` steht — zwei Schreibweisen derselben Zahl.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'zielmarge',
    literal: '0.25',
    heimat: 'src/baustoffkatalog.js',
    name: 'ZIELMARGE',
    was: 'die Weisung des Auftraggebers vom 25.08.: 25 % Marge vom Verkauf, nicht Zuschlag',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'src/zahlung.js',
        warum: 'Dreimal `fixEuro: 0.25` — die **Kartengebühr von 25 Cent**, ein Betrag in Euro '
          + 'und kein Anteil. Genau diese Verwechslung hat am 5. September den Geheimnisprüfer '
          + 'in die Irre geführt; sie steht dort im Kopf ausgeschrieben.',
      }),
      Object.freeze({
        datei: 'data/zielgroessen.json',
        warum: '`rohmarge: 0.25` — dieselbe Zahl, und sie kann die Heimat nicht lesen: In JSON '
          + 'gibt es keinen Import. Gehalten wird sie stattdessen von einem Testfall, der sie '
          + 'Zeichen für Zeichen gegen `ZIELMARGE` hält (`test/empfindlichkeit.test.js`, '
          + '„Die Zielgrößen sind vollständig und decken sich mit dem Katalog"). Die Datei '
          + 'selbst sagt es in ihrer Herkunftsnotiz: „Muss mit ZIELMARGE in '
          + 'src/baustoffkatalog.js uebereinstimmen."',
      }),
    ]),
  }),
  Object.freeze({
    id: 'hoechstmenge',
    literal: '999',
    heimat: 'src/shopkern.js',
    name: 'HOECHSTMENGE',
    was: 'die Höchstmenge je Korbzeile — eine Grenze der Selbstbedienung, keine der Ware (Gate 34). **Sie steht hier seit dem 13. September**, an dem Tag, an dem der Prüfer zum ersten Mal auch `shop-ui.js` las: Dort stand sie zweimal als Literal (`feld.max`, `menge.max`), zwei Bildschirmzeilen neben einem Knopf, der die Konstante liest. Beide lesen sie jetzt, und deshalb steht die Oberfläche unten nicht mehr als Ausnahme',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'src/gatestand.js',
        warum: 'Der Gate-34-Eintrag **zitiert** die Zahl in seiner Begründung: „Vorher stand 999 '
          + 'an fünf Stellen ohne Grund." Ein Satz über eine Zahl ist keine zweite Fassung der '
          + 'Zahl — er steht hier trotzdem, weil er in einer Zeichenkette steht und nicht in '
          + 'einem Kommentar, und `ohneKommentare` deshalb nicht an ihn herankommt.',
      }),
      Object.freeze({
        datei: 'bin/shopprobe.mjs',
        warum: 'Die Erwartungsliste einer Browserprobe: `[\'999× im Warenkorb\', \'mehr als 999 '
          + 'geht hier nicht\', \'imKorb=999\', \'max=999\']`. Dieselbe Lehre wie bei '
          + '`src/kontrolle.js` und der Umsatzsteuer — **eine Probe, die ihren Erwartungswert '
          + 'aus dem Prüfling liest, prüft nichts.** Genau diese vier Zeichenketten sind der '
          + 'Nachweis, dass die Oberfläche die Konstante wirklich erreicht.',
      }),
      Object.freeze({
        datei: 'bin/wegprobe.mjs',
        warum: 'Die Wegprobe tippt `999` ins Mengenfeld des Korbs, um den Mindestbestellwert '
          + 'sicher zu überschreiten. Sie braucht dafür die **größte annehmbare** Menge, und '
          + 'das ist die Höchstmenge — eine größere Zahl würde stillschweigend gekürzt und die '
          + 'Probe prüfte dann etwas anderes als das, was sie eingetippt hat.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'kranentladung',
    literal: '7.5',
    heimat: 'src/huebe.js',
    name: 'JE_HUB_NETTO',
    was: 'was der Lieferant je Hub Kranentladung verrechnet — der Satz, gegen den der Hubbefund misst',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'data/lieferanten.json',
        warum: '`fracht.sperrgutZuschlagNetto: 7.5` — der Satz selbst, dort wo die Konditionen '
          + 'des Lieferanten stehen, und in JSON gibt es keinen Import. Gehalten wird er von '
          + '`test/huebe.test.js` („`JE_HUB_NETTO` ist der Satz aus der Lieferantendatei"). '
          + '**Bis zum 13. September stand die Zahl in dieser Datei zweimal**: noch einmal als '
          + '`nebenkosten.kranentladungJeHubNetto`, gelesen von niemandem und gehalten von '
          + 'niemandem. Sie ist entfernt; die Notiz an ihrer Stelle sagt warum.',
      }),
    ]),
  }),
  Object.freeze({
    id: 'kaufquote',
    literal: '0.02',
    heimat: 'src/empfindlichkeit.js',
    name: 'ANNAHMEN.umsatzProSession',
    was: 'die Quote, mit der jedes Höchstgebot je Klick multipliziert wird',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'bin/rollout.mjs',
        warum: 'Eine **Szenarienliste** `[0.02, 0.01, 0.005]`: Der Plan rechnet den Versuch für '
          + 'drei Quoten durch, und der Basisfall ist eine davon. Die Liste ist der Zweck der '
          + 'Annahme und nicht ihre Kopie — sie fiele mit einem Verweis auf die Heimat sogar '
          + 'schwerer zu lesen.',
      }),
      Object.freeze({
        datei: 'bin/werbeprobe.mjs',
        warum: 'Zwei Szenarienlisten aus demselben Grund wie im Rollout — die Probe rechnet, ab '
          + 'wie vielen Klicks ohne Bestellung sich welche Quote ausschließen lässt.',
      }),
      Object.freeze({
        datei: 'data/zielgroessen.json',
        warum: '`umsatzProSession: 0.02` — dieselbe Zahl, und die Notiz daneben sagt es seit '
          + 'dem 1. September wörtlich: „DIESELBE GROESSE wie die Kaufquote der Kampagne." '
          + '**Eine Notiz, die sagt „dieselbe Größe", ist keine Prüfung, dass es dieselbe Zahl '
          + 'ist** — bis zum 13. September war nur geprüft, dass die Notiz überhaupt da ist. '
          + 'Seither hält `test/empfindlichkeit.test.js` den Wert gegen `ANNAHMEN…basis`.',
      }),
    ]),
  }),
]);

/**
 * Hält jede geführte Zahl gegen den Quelltext.
 *
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 */
export function zwillingsbefund(quellen, eintraege = ZWILLINGE) {
  const meldungen = [];
  const melde = (regel, wo, text) => meldungen.push({ regel, wo, text });
  let gesucht = 0;

  for (const e of eintraege) {
    const erlaubt = new Set([e.heimat, ...REDEN_UEBER_DEN_BESTAND, ...e.ausnahmen.map((a) => a.datei)]);
    const gefunden = new Set();
    let inHeimat = false;

    for (const [pfad, text] of quellen) {
      if (!traegtZahl(ohneKommentare(text), e.literal)) continue;
      gesucht += 1;
      if (pfad === e.heimat) { inHeimat = true; continue; }
      gefunden.add(pfad);
      if (erlaubt.has(pfad)) continue;
      melde('zahl-zweimal', `${pfad} · ${e.id}`,
        `${pfad} trägt ${e.literal} als eigenes Literal — ${e.was}. Die Heimat ist `
        + `${e.name} in ${e.heimat}; wer sie liest, hat keine zweite Zahl`);
    }

    if (!inHeimat) {
      melde('heimat-ohne-zahl', e.id,
        `${e.heimat} trägt ${e.literal} nicht mehr — dann ist entweder die Zahl eine andere `
        + 'oder dieser Eintrag beschreibt etwas, das es nicht gibt');
    }
    for (const a of e.ausnahmen) {
      if (!gefunden.has(a.datei)) {
        melde('ausnahme-ohne-fund', `${a.datei} · ${e.id}`,
          `${a.datei} steht als begründete Ausnahme für ${e.literal} und trägt die Zahl nicht `
          + 'mehr — ein Grund für einen Zustand, den es nicht mehr gibt');
      }
      if (!a.warum || a.warum.length < 40) {
        melde('ausnahme-ohne-grund', `${a.datei} · ${e.id}`,
          `${a.datei} steht als Ausnahme ohne belastbaren Grund`);
      }
    }
  }

  return { eintraege: eintraege.length, gesucht, meldungen, sauber: meldungen.length === 0 };
}

/**
 * Wie viele andere Dateien dieselbe Zahl tragen dürfen, bevor sie auffällt.
 *
 * **Gemessen am 13. September 2026**, über alle 58 benannten Zahlen in `src/`
 * und 255 Quelldateien. Der Abstand ist nicht knapp, er ist ein Abgrund:
 *
 * | benannte Zahl | Wert | andere Dateien |
 * |---|---|---|
 * | `JE_HUB_NETTO` | 7,5 | **1** |
 * | `UST_SATZ`, `ZIELMARGE`, `UID_EMPFAENGER_GRENZE_BRUTTO` | — | **2** |
 * | `SKONTO_SATZ` | 0,03 | **3** |
 * | `HOECHSTMENGE` | 999 | **4** |
 * | `GRENZE_TAGE` | 14 | 25 |
 * | `AUFBEWAHRUNG_JAHRE` | 7 | 35 |
 * | `STAMMLAENGE`, `SICHERUNGSTIEFE` | 10 | 54 |
 *
 * Eine Zahl wie 10 oder 14 steht in fünfzig Dateien, weil fünfzig Dinge
 * zufällig zehn oder vierzehn sind — das ist der Bestand, vor dem der Kopf
 * dieser Datei warnt: *keine Jagd auf doppelte Literale.* Eine Zahl, die
 * **genau ein** anderes Vorkommen hat, ist kein Zufall; sie ist entweder
 * gelesen oder abgeschrieben.
 *
 * Fünf ist deshalb die Grenze: weit über allem, was im engen Band gemessen
 * wurde, und weit unter dem Rauschen. Sie ist eine **Messung** und keine
 * Meinung — wandert der Bestand, wandert sie mit, und der Satz hier gehört
 * dann neu geschrieben.
 */
export const ENGE_SCHWELLE = 5;

/**
 * Zahlen, deren enges Band angesehen und für harmlos befunden wurde.
 *
 * Dieselbe Bauart wie `ausnahmen` oben, eine Ebene früher: Dort steht, warum
 * ein **Vorkommen** bleiben darf; hier, warum eine Zahl gar nicht erst ins
 * Register gehört. Und wie dort gilt die Gegenrichtung — ein Eintrag, dessen
 * Zahl das enge Band verlassen hat, wird gemeldet.
 */
export const VORSCHLAG_GEPRUEFT = Object.freeze([
  Object.freeze({
    name: 'UID_EMPFAENGER_GRENZE_BRUTTO',
    warum: 'Die beiden anderen Vorkommen von 10000 sind `mindestens: 10000` in '
      + '`src/pruefregister.js` (zweimal, eine Mindestzeilenzahl für einen Prüflauf) und ein '
      + 'Rundungsfaktor `* 10000` in `bin/preiswiederherstellung.mjs`. Weder Betrag noch '
      + 'Schwelle — dieselbe Ziffernfolge, drei verschiedene Dinge.',
  }),
  Object.freeze({
    name: 'KLEINSTES_GEBINDE_KG',
    warum: 'Alle fuenf anderen Vorkommen sind `0.10` — zehn **Prozent**, in fuenf Bedeutungen: '
      + 'die Ueberlappung im Bedarfsrechner, die Basisannahme der Empfindlichkeit, der '
      + 'Schritt der Elastizitaet, eine Nachlassstaffel und der Werbeanteil der Zielgroessen. '
      + 'Hier steht ein Zehntel **Kilogramm**. Dass die Messung sie ueberhaupt zusammenwirft, '
      + 'ist der Preis der Berichtigung vom Vortag: Seit Werte statt Zeichen verglichen '
      + 'werden, ist `0.10` dieselbe Zahl wie `0.1`. Der Gewinn (der Steuersatz) und dieser '
      + 'Verlust sind dieselbe Aenderung.',
  }),
  Object.freeze({
    name: 'KLEINSTES_GEBINDE_M2',
    warum: 'Dieselben fuenf Vorkommen von zehn Prozent wie bei `KLEINSTES_GEBINDE_KG`, und '
      + 'hier steht ein Zehntel **Quadratmeter**. Die drei Gebindeuntergrenzen sind absichtlich '
      + 'drei Zahlen und nicht eine: Sie messen Gewicht, Flaeche und Laenge, und dass alle drei '
      + 'ein Zehntel sind, ist die Wahl einer runden unteren Schranke — nicht eine Groesse, die '
      + 'dreimal dasteht.',
  }),
  Object.freeze({
    name: 'KLEINSTES_GEBINDE_LFM',
    warum: 'Dieselben fuenf Vorkommen von zehn Prozent, und hier steht ein Zehntel '
      + '**Laufmeter**. Waeren die drei zusammengelegt, hiesse das: Wer die Untergrenze fuer '
      + 'Gewicht verschiebt, verschiebt die fuer Flaeche und Laenge mit. Genau das soll nicht '
      + 'sein, und deshalb ist die Gleichheit hier Zufall und keine Bindung.',
  }),
  Object.freeze({
    name: 'KUMULIERT_MINDESTENS',
    warum: 'Die drei anderen Vorkommen von 2000 sind zweimal `www.w3.org/2000/svg` in '
      + '`src/bilder.js` (eine Jahreszahl in einer Namensraum-Adresse), eine Szenarienliste '
      + '`[500, 1000, 2000, 4000, 8000]` in `bin/messliste.mjs` und die absichtlich zu grosse '
      + 'Eingabe `feld.value = \'2000\'` in `bin/shopprobe.mjs`, mit der die Hoechstmenge '
      + 'nachgewiesen wird. Ein Namensraum, eine Staffel und eine Fehleingabe — dreimal '
      + 'dieselbe Ziffernfolge und keine davon ein Suchvolumen.',
  }),
  Object.freeze({
    name: 'KD_NIEDRIG_BIS',
    warum: 'Alle vier anderen Vorkommen von 29 sind **Gate 29** oder die **29 Begriffe der '
      + 'Messliste**: `gate: 29` in `src/gatestand.js`, zwei Saetze ueber die Messliste in '
      + '`src/aussenlage.js` und `src/offenepunkte.js`, und die Gate-Meldung in '
      + '`bin/kampagne.mjs`. Eine Gate-Nummer und eine Keyword-Anzahl sind keine Schwelle des '
      + 'Wettbewerbsgrades — hier ist die Ziffernfolge dreimal etwas voellig anderes.',
  }),
  Object.freeze({
    name: 'KD_MITTEL_BIS',
    warum: 'Das einzige andere Vorkommen von 49 steht in `src/zahlung.js` im Satz '
      + '„Listenpreis Groessenordnung 2,49 % + 0,35 Euro" — die Gebuehr von PayPal. Gelesen '
      + 'wird sie nur, weil das deutsche Dezimalkomma die Zahl in `2` und `49` zerlegt. Ein '
      + 'Fund, der zeigt, wo die Messung ihre Grenze hat: Sie liest Ziffern und kein Komma.',
  }),
  Object.freeze({
    name: 'SKONTO_SATZ',
    warum: 'Die drei anderen Vorkommen von 0.03 sind `KLICKRATE.vorsichtig` in '
      + '`src/suchbedarf.js` (der untere Rand einer Anzeigen-Klickrate), `prozent: 0.03` beim '
      + 'Rechnungskauf in `src/zahlung.js` (die Gebühr eines Zahlungsanbieters, Spanne 2–4 %) '
      + 'und eine Szenarienliste in `bin/werbeprobe.mjs`. Drei Prozentsätze aus drei Welten, '
      + 'die zufällig alle drei Prozent sind — keiner hängt am Skonto.',
  }),
]);

/**
 * Welche benannten Zahlen ins Register **gehörten**, ohne dass es jemand merkt.
 *
 * **Warum es diese Messung gibt, 13. September 2026.** Das Register führt drei
 * Zahlen. Jede davon steht darin, weil sie an einem Tag im September zufällig
 * aufgefallen ist — der Kopf dieser Datei sagt es selbst: *„jedes Mal durch
 * Zufall"*. Am Vortag wurde repariert, **wie** verglichen wird (Werte statt
 * Zeichen). Womit verglichen wird, entschied weiter der Zufall.
 *
 * > **Ein Register, das nur führt, was jemand eingetragen hat, ist so
 * > vollständig wie die Aufmerksamkeit des Eintragenden.**
 *
 * Gemessen wird deshalb die Gegenrichtung: Jede benannte Zahl aus `src/`, die
 * in höchstens `ENGE_SCHWELLE` anderen Dateien steht, ist ein Vorschlag — bis
 * sie geführt ist oder in `VORSCHLAG_GEPRUEFT` steht.
 *
 * @param {Map<string, string>} quellen  Pfad (repo-relativ) → Quelltext
 */
export function zwillingsvorschlag(quellen, eintraege = ZWILLINGE, geprueft = VORSCHLAG_GEPRUEFT) {
  const ohne = new Map([...quellen].map(([p, t]) => [p, ohneKommentare(t)]));
  const gefuehrt = new Set(eintraege.map((e) => Number(e.literal)));
  const abgehakt = new Map(geprueft.map((g) => [g.name, g]));
  const meldungen = [];
  const vorschlaege = [];
  const gesehen = new Set();

  for (const [pfad, text] of ohne) {
    /*
     * Auch die Heimat wird in den redenden Dateien nicht gesucht, nicht nur
     * das Vorkommen. `gegenprobenregister.js` fuehrt Mutationen als
     * Zeichenketten mit und traegt darin Zeilen wie `export const ZIELMARGE =
     * 0.25;` — ohne diese Zeile schlaegt die Messung eine Heimat vor, die
     * eine zitierte ist.
     */
    if (!pfad.startsWith('src/') || REDEN_UEBER_DEN_BESTAND.includes(pfad)) continue;
    for (const m of text.matchAll(/export const ([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*;/g)) {
      const name = m[1];
      const wert = Number(m[2]);
      /*
       * Zahlen ohne Aussagekraft heraus. 0, 1 und 2 stehen in jeder zweiten
       * Zeile dieses Bestandes; 100 und 1000 sind Rundungs- und
       * Umrechnungsfaktoren. Sie im engen Band zu suchen hieße, das Band
       * sofort wieder zu füllen — und zwar mit genau dem Rauschen, gegen das
       * die Schwelle gebaut ist.
       */
      if ([0, 1, 2, 3, 100, 1000].includes(wert)) continue;
      gesehen.add(name);
      const andere = [];
      for (const [p, t] of ohne) {
        if (p === pfad || REDEN_UEBER_DEN_BESTAND.includes(p)) continue;
        if (traegtZahl(t, wert)) andere.push(p);
      }
      if (andere.length === 0 || andere.length > ENGE_SCHWELLE) continue;
      vorschlaege.push({ name, wert, heimat: pfad, andere });
      if (gefuehrt.has(wert) || abgehakt.has(name)) continue;
      meldungen.push({
        regel: 'zahl-im-engen-band',
        wo: `${pfad} · ${name}`,
        text: `${name} = ${wert} (${pfad}) steht in ${andere.length} weiteren `
          + `${andere.length === 1 ? 'Datei' : 'Dateien'} — ${andere.join(', ')}. Bei so wenigen `
          + 'Fundstellen ist das kein Zufall: Entweder liest jede davon die Heimat, oder die '
          + 'Zahl gehört ins Register',
      });
    }
  }

  // Die Gegenrichtung: Ein Haken für eine Zahl, die es nicht mehr gibt oder
  // die das enge Band längst verlassen hat, erklärt einen Zustand von gestern.
  const imBand = new Set(vorschlaege.map((v) => v.name));
  for (const g of geprueft) {
    if (!gesehen.has(g.name)) {
      meldungen.push({ regel: 'haken-ohne-zahl', wo: g.name,
        text: `${g.name} steht als geprüfter Vorschlag und ist als benannte Zahl in src/ nicht mehr da` });
    } else if (!imBand.has(g.name)) {
      meldungen.push({ regel: 'haken-ausserhalb-des-bandes', wo: g.name,
        text: `${g.name} steht als geprüfter Vorschlag, liegt aber nicht mehr im engen Band — `
          + 'der Haken erklärt einen Zustand, den es nicht mehr gibt' });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'haken-ohne-grund', wo: g.name,
        text: `${g.name} ist ohne belastbaren Grund abgehakt` });
    }
  }

  return { vorschlaege, meldungen, sauber: meldungen.length === 0 };
}
