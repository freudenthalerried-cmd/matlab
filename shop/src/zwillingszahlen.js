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

import { ohneKommentare as entkommentiere } from './entkommentieren.js';

/**
 * Kommentare heraus, bevor gesucht wird.
 *
 * Ohne diesen Schritt fände der Prüfer jede Zahl, über die irgendwo ein Satz
 * geschrieben steht — und dieser Bestand schreibt viele Sätze über seine
 * Zahlen. Gemessen wird der Code, nicht die Begründung.
 *
 * **Bis zum 14. September, mittags, stand hier eine eigene Fassung** aus zwei
 * Ersetzungen: Blockkommentare weg, `//…` weg (mit einer Wache gegen `://`). Sie
 * kannte weder Zeichenketten noch reguläre Ausdrücke und **löschte damit
 * Code** — überall dort, wo ein `//` in einem Muster steht:
 *
 * ```
 * /^shop\//        /https?:\/\//        fehlerpfad.replace(/^\//, '')
 * ```
 *
 * Gemessen: **20 von 252 Quelldateien** verloren so echten Code, darunter
 * `src/codedubletten.js`, `src/zwillingssaetze.js` und diese Datei selbst —
 * jeweils an dem regulären Ausdruck, mit dem sie Kommentare entfernen.
 *
 * > **Ein Leser, der Code löscht, macht aus einem Fund ein Schweigen.** Eine
 * > Zahl in einem gelöschten Stück ist für diesen Prüfer nicht vorhanden.
 *
 * Gelesen wird jetzt mit dem Scanner aus `src/entkommentieren.js`, der
 * Zeichenketten, Vorlagenliterale samt `${…}` und Muster kennt — und der seit
 * dem 29. August täglich gegen `node --check` und 39 Browserszenarien läuft.
 */
const ohneKommentare = (quelltext) => entkommentiere(String(quelltext ?? '')).text;

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
    id: 'warenkorb',
    literal: '650',
    heimat: 'src/empfindlichkeit.js',
    name: 'ANNAHMEN.warenkorbNetto',
    was: 'der angenommene Warenkorb netto, aus der Stückliste hergeleitet — Nenner jeder Bestellzahl',
    ausnahmen: Object.freeze([
      Object.freeze({
        datei: 'data/zielgroessen.json',
        warum: '`warenkorbNetto: 650` — dieselbe Zahl, und in JSON gibt es keinen Import. '
          + '**Gehalten wird sie seit dem 13. September nachmittags**, und zwar nicht einzeln: '
          + 'Die Schleife in `test/empfindlichkeit.test.js` lief schon vorher über alle vier '
          + 'Annahmen und verglich den **Typ**; sie vergleicht jetzt den Wert. Dieselbe Datei '
          + 'trägt außerdem `fixkosten: 650` — eine andere Größe mit derselben Zahl, weshalb '
          + 'die Zählung nur eine Fremddatei sieht.',
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
    name: 'UNGESEHENE_HOECHSTENS', wert: 67,
    warum: 'Die Sperrklinke der Regelzaehlung in `src/regelnamen.js` — so viele Regelstellen '
      + 'hat am 14. September kein Testfall je feuern sehen. Das zweite Vorkommen ist eine '
      + 'Zielgroesse in `data/zielgroessen.json`; eine Zahl offener Prueffaelle und eine '
      + 'Geschaeftszahl haben nichts miteinander zu tun, und die eine faellt mit jeder Runde, '
      + 'waehrend die andere stehen bleibt.',
  }),
  Object.freeze({
    name: 'bisZeichen', wert: 63,
    warum: 'Die gemessene Rumpflaenge der drei Ablageort-Praedikate im Gestaltregister '
      + '(`src/codedubletten.js`). Das zweite Vorkommen ist die Zahl der Oberflaechen-'
      + 'szenarien in einer Hakenbeschreibung (`src/haken.js`) — eine Zahl von Proben und '
      + 'eine Zahl von Zeichen. Beide wandern, wenn sich ihre Seite aendert, und keine '
      + 'wandert mit der anderen.',
  }),
  Object.freeze({
    name: 'bisZeichen', wert: 58,
    warum: 'Die gemessene Rumpflaenge der beiden Weiterreichungen in `src/shopkern.js`, '
      + 'gefuehrt im Gestaltregister. Das zweite Vorkommen ist eine Bildkoordinate in '
      + '`src/bilder.js` (`const y = 58 - d;` im gezeichneten Diagramm) — ein Punkt auf '
      + 'einer Leinwand und eine Anzahl Zeichen in einem Funktionsrumpf. Zufall, und einer, '
      + 'der sich bei der naechsten Messung von selbst aufloest.',
  }),
  Object.freeze({
    name: 'ueberlappung', wert: 0.1,
    warum: 'Zehn Prozent Ueberlappung im Bedarfsrechner. Sie trifft die drei Gebinde-'
      + 'untergrenzen (ein Zehntel Kilogramm, Quadratmeter, Laufmeter) und vier weitere '
      + 'Zehntel-Prozent-Angaben. Dass die Messung sie zusammenwirft, ist der Preis des '
      + 'Wertevergleichs vom 13.09. vormittags: `0.10` und `0.1` sind dieselbe Zahl.',
  }),
  Object.freeze({
    name: 'basis', wert: 0.1,
    warum: 'Der Werbekostenanteil der Empfindlichkeitsrechnung — zehn Prozent. Gegen seine '
      + 'zweite Fassung in `data/zielgroessen.json` **ist** er gehalten, seit dem 13.09. '
      + 'nachmittags durch die Wertschleife in `test/empfindlichkeit.test.js`. Der Rest des '
      + 'engen Bandes sind fremde Zehntel: Ueberlappung, Verschnittstaffel, Gebindeuntergrenzen.',
  }),
  Object.freeze({
    name: 'verschnitt', wert: 0.05,
    warum: 'Fuenf Prozent Verschnitt auf der Baustelle. Die beiden anderen Vorkommen sind die '
      + 'mittlere Klickrate einer Suchanzeige (`src/suchbedarf.js`) und ein Element der '
      + 'Nachlassstaffel `[0, 0.05, 0.10, 0.15]` (`src/verhandlung.js`). Drei Prozentsaetze '
      + 'aus drei Welten, die zufaellig alle fuenf Prozent sind.',
  }),
  Object.freeze({
    name: 'mittel', wert: 0.05,
    warum: 'Die mittlere Klickrate des Klickratenbandes — ausdruecklich ein Band und kein '
      + 'Wert, weil es keine geschaltete Anzeige gibt. Die beiden anderen Vorkommen sind der '
      + 'Baustellenverschnitt und ein Glied der Nachlassstaffel; keines hat mit Suchanzeigen '
      + 'zu tun.',
  }),
  Object.freeze({
    name: 'aufkantungHoehe', wert: 0.3,
    warum: 'Dreissig **Zentimeter** Aufkantung, in Metern geschrieben. Das einzige andere '
      + 'Vorkommen ist `haendlerrabattAufUvp: 0.3` in `data/lieferanten.json` — dreissig '
      + '**Prozent** Rabatt. Eine Laenge und ein Anteil, dieselbe Ziffernfolge.',
  }),
  Object.freeze({
    name: 'primerProM2', wert: 0.3,
    warum: 'Drei Zehntel **Liter** Primer je Quadratmeter. Dasselbe andere Vorkommen wie bei '
      + 'der Aufkantung: dreissig Prozent Haendlerrabatt. Ein Volumen je Flaeche und ein '
      + 'Anteil — die Messung liest Ziffern und keine Einheiten.',
  }),
  Object.freeze({
    name: 'rohrZuschlag', wert: 0.15,
    warum: 'Fuenfzehn Prozent Zuschlag auf die gerechnete Rohrlaenge fuer Bogen und Anbindung. '
      + 'Das einzige andere Vorkommen ist das letzte Glied der Nachlassstaffel `[0, 0.05, '
      + '0.10, 0.15]` in `src/verhandlung.js` — eine Szenarienliste, kein Satz.',
  }),
  Object.freeze({
    name: 'wert', wert: 33,
    warum: 'Eine **abgeloeste** Leitzahl: 33 Keywords vor dem 1. September, mit einem `weil` '
      + 'daneben. Ein historischer Stand ist keine geltende Groesse — er soll gerade nicht '
      + 'mitwandern, wenn die heutige Zahl wandert. Die Kollision ist Gate 33.',
  }),
  Object.freeze({
    name: 'wert', wert: 57,
    warum: 'Dieselbe Bauart: 57 Plantage vor der Etappe „Search Console einrichten", am 3.9. '
      + 'eingefuegt. Das andere Vorkommen ist der Satz in `data/auftragszuordnung.json`, der '
      + 'genau diesen abgeloesten Stand beschreibt — zwei Aufzeichnungen desselben vergangenen '
      + 'Befunds, nicht zwei Fassungen einer geltenden Zahl.',
  }),
  Object.freeze({
    name: 'mindestens', wert: 10000,
    warum: 'Die Mindestzeilenzahl, unter der ein Prueflauf nichts aussagt — zweimal im '
      + 'Pruefregister, fuer zwei Prueflaeufe. Die anderen Vorkommen sind die UID-Schwelle in '
      + '`src/beleg.js` (ein Bruttobetrag) und ein Rundungsfaktor `* 10000`. Drei Dinge, eine '
      + 'Ziffernfolge.',
  }),
  Object.freeze({
    name: 'mindestens', wert: 2000,
    warum: 'Die Mindestzahl angesehener Saetze, unter der `pruefe-saetze` nichts aussagt — seit '
      + 'dem 14. September. Die anderen Vorkommen von 2000 sind zweimal die Jahreszahl in der '
      + 'SVG-Namensraumadresse, ein Glied der Szenarienliste in `bin/messliste.mjs`, die '
      + 'absichtlich zu grosse Eingabe der Hoechstmengenprobe und `KUMULIERT_MINDESTENS`. '
      + 'Fuenf Dinge, eine Ziffernfolge.',
  }),
  Object.freeze({
    name: 'mindestens', wert: 8000,
    warum: 'Dieselbe Bauart eine Groessenordnung tiefer: eine Mindestzeilenzahl. Das einzige '
      + 'andere Vorkommen ist das letzte Glied der Szenarienliste `[500, 1000, 2000, 4000, '
      + '8000]` in `bin/messliste.mjs` — eine Staffel und keine Schwelle.',
  }),
  Object.freeze({
    name: 'vorsichtig', wert: 0.03,
    warum: 'Der untere Rand des Klickratenbandes. Dieselben drei fremden Fundstellen wie beim '
      + 'Skontosatz: die Gebuehr des Rechnungskaufs, der Skontosatz selbst und eine '
      + 'Szenarienliste. Vier Prozentsaetze aus vier Welten, alle drei Prozent.',
  }),
  Object.freeze({
    name: 'prozent', wert: 0.03,
    warum: 'Die Gebuehr des B2B-Rechnungskaufs, Spanne 2–4 %, hier mit drei gerechnet — die '
      + 'Herkunftsnotiz daneben sagt es. Dieselben drei fremden Fundstellen wie beim '
      + 'Skontosatz und beim unteren Klickratenrand.',
  }),
  Object.freeze({
    name: 'UID_EMPFAENGER_GRENZE_BRUTTO',
    wert: 10000,
    warum: 'Die beiden anderen Vorkommen von 10000 sind `mindestens: 10000` in '
      + '`src/pruefregister.js` (zweimal, eine Mindestzeilenzahl für einen Prüflauf) und ein '
      + 'Rundungsfaktor `* 10000` in `bin/preiswiederherstellung.mjs`. Weder Betrag noch '
      + 'Schwelle — dieselbe Ziffernfolge, drei verschiedene Dinge.',
  }),
  Object.freeze({
    name: 'KLEINSTES_GEBINDE_KG',
    wert: 0.1,
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
    wert: 0.1,
    warum: 'Dieselben fuenf Vorkommen von zehn Prozent wie bei `KLEINSTES_GEBINDE_KG`, und '
      + 'hier steht ein Zehntel **Quadratmeter**. Die drei Gebindeuntergrenzen sind absichtlich '
      + 'drei Zahlen und nicht eine: Sie messen Gewicht, Flaeche und Laenge, und dass alle drei '
      + 'ein Zehntel sind, ist die Wahl einer runden unteren Schranke — nicht eine Groesse, die '
      + 'dreimal dasteht.',
  }),
  Object.freeze({
    name: 'KLEINSTES_GEBINDE_LFM',
    wert: 0.1,
    warum: 'Dieselben fuenf Vorkommen von zehn Prozent, und hier steht ein Zehntel '
      + '**Laufmeter**. Waeren die drei zusammengelegt, hiesse das: Wer die Untergrenze fuer '
      + 'Gewicht verschiebt, verschiebt die fuer Flaeche und Laenge mit. Genau das soll nicht '
      + 'sein, und deshalb ist die Gleichheit hier Zufall und keine Bindung.',
  }),
  Object.freeze({
    name: 'KUMULIERT_MINDESTENS',
    wert: 2000,
    warum: 'Die drei anderen Vorkommen von 2000 sind zweimal `www.w3.org/2000/svg` in '
      + '`src/bilder.js` (eine Jahreszahl in einer Namensraum-Adresse), eine Szenarienliste '
      + '`[500, 1000, 2000, 4000, 8000]` in `bin/messliste.mjs` und die absichtlich zu grosse '
      + 'Eingabe `feld.value = \'2000\'` in `bin/shopprobe.mjs`, mit der die Hoechstmenge '
      + 'nachgewiesen wird. Ein Namensraum, eine Staffel und eine Fehleingabe — dreimal '
      + 'dieselbe Ziffernfolge und keine davon ein Suchvolumen.',
  }),
  Object.freeze({
    name: 'KD_NIEDRIG_BIS',
    wert: 29,
    warum: 'Alle vier anderen Vorkommen von 29 sind **Gate 29** oder die **29 Begriffe der '
      + 'Messliste**: `gate: 29` in `src/gatestand.js`, zwei Saetze ueber die Messliste in '
      + '`src/aussenlage.js` und `src/offenepunkte.js`, und die Gate-Meldung in '
      + '`bin/kampagne.mjs`. Eine Gate-Nummer und eine Keyword-Anzahl sind keine Schwelle des '
      + 'Wettbewerbsgrades — hier ist die Ziffernfolge dreimal etwas voellig anderes.',
  }),
  Object.freeze({
    name: 'KD_MITTEL_BIS',
    wert: 49,
    warum: 'Das einzige andere Vorkommen von 49 steht in `src/zahlung.js` im Satz '
      + '„Listenpreis Groessenordnung 2,49 % + 0,35 Euro" — die Gebuehr von PayPal. Gelesen '
      + 'wird sie nur, weil das deutsche Dezimalkomma die Zahl in `2` und `49` zerlegt. Ein '
      + 'Fund, der zeigt, wo die Messung ihre Grenze hat: Sie liest Ziffern und kein Komma.',
  }),
  Object.freeze({
    name: 'SKONTO_SATZ',
    wert: 0.03,
    warum: 'Die drei anderen Vorkommen von 0.03 sind `KLICKRATE.vorsichtig` in '
      + '`src/suchbedarf.js` (der untere Rand einer Anzeigen-Klickrate), `prozent: 0.03` beim '
      + 'Rechnungskauf in `src/zahlung.js` (die Gebühr eines Zahlungsanbieters, Spanne 2–4 %) '
      + 'und eine Szenarienliste in `bin/werbeprobe.mjs`. Drei Prozentsätze aus drei Welten, '
      + 'die zufällig alle drei Prozent sind — keiner hängt am Skonto.',
  }),
]);

/**
 * Feldnamen, die eine **Kennung** tragen und keine Größe.
 *
 * **Gemessen am 13. September 2026**, als die Messung von den benannten Zahlen
 * auf die Objektfelder ausgedehnt wurde: 34 Felder lagen im engen Band, und
 * **elf davon waren `gate:`** — die laufenden Nummern der Gates 19 bis 39.
 *
 * Eine Gate-Nummer ist keine Größe. Sie steht in jeder Datei, die das Gate
 * erwähnt, sie kollidiert mit jedem Schwellenwert im selben Zahlenbereich, und
 * sie hat gar keine Heimat, die man lesen könnte — sie **ist** die Kennung.
 *
 * > **Eine fortlaufende Nummer ist kein Zwilling, sondern ein Name aus
 * > Ziffern.**
 *
 * Diese Liste ist bewusst kurz und wird durch die Messung gehalten: Steht ein
 * Name hier, der im Bestand gar nicht mehr als Zahlfeld vorkommt, wird er
 * gemeldet.
 */
export const KENNUNGSFELDER = Object.freeze(['gate', 'nummer', 'jahr']);

/**
 * Jede benannte Zahl einer Datei — als Ausfuhr **und** als Objektfeld.
 *
 * **Der Fund, 13. September 2026 nachmittags.** Die Vorschlagsmessung vom
 * Vormittag las `export const NAME = 0.25;`. Gemessen über denselben Bestand:
 * **59** Zahlen stehen so — und **218** stehen in einem Objektfeld.
 *
 * > **Eine Messung, die nur eine Schreibweise liest, misst nicht den Bestand,
 * > sondern die Schreibweise.**
 *
 * Beweisbar an diesem Register selbst: Sein dritter Eintrag heißt
 * `ANNAHMEN.umsatzProSession` und steht als `basis: 0.02` in einem Objekt. Die
 * Messung, die Zwillinge vorschlagen soll, hätte **ihren eigenen Eintrag nicht
 * gefunden**.
 */
export function benannteZahlen(quelltext) {
  const gefunden = [];
  for (const m of quelltext.matchAll(/export const ([A-Z][A-Z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*;/g)) {
    gefunden.push({ name: m[1], wert: Number(m[2]), form: 'ausfuhr' });
  }
  /*
   * Objektfelder: eingerueckt, ein Name, ein Doppelpunkt, eine Zahl und sonst
   * nichts bis zum Zeilenende. Die Einrueckung ist das Merkmal, das ein Feld
   * von einer Zuweisung trennt; das Zeilenende schliesst Ausdruecke aus, in
   * denen die Zahl nur ein Summand ist.
   */
  for (const m of quelltext.matchAll(/^\s{2,}([a-zA-Z][a-zA-Z0-9_]*):\s*(-?\d+(?:\.\d+)?)\s*,?\s*$/gm)) {
    if (KENNUNGSFELDER.includes(m[1])) continue;
    gefunden.push({ name: m[1], wert: Number(m[2]), form: 'feld' });
  }
  return gefunden;
}

/**
 * Alle Zahlen eines Quelltexts als Menge — dieselbe Lesart wie `traegtZahl`.
 *
 * Beide lesen jede Zahl als eigenes Wort: Vor ihr darf kein Zeichen stehen,
 * das sie fortsetzt, und dahinter auch nicht. `traegtZahl` beantwortet eine
 * Frage, diese Funktion beantwortet alle auf einmal — gebraucht, sobald nicht
 * mehr drei Zahlen gesucht werden, sondern zweihundert.
 */
export function zahlenIn(quelltext) {
  const gefunden = new Set();
  for (const t of String(quelltext).matchAll(/(^|[^0-9A-Za-z_.])(-?\d+(?:\.\d+)?)(?![0-9A-Za-z_.])/g)) {
    gefunden.add(Number(t[2]));
  }
  return gefunden;
}

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
  /*
   * **Einmal lesen statt je Kandidat suchen — 13. September 2026.** Mit den
   * Objektfeldern stieg die Zahl der Kandidaten von 59 auf 218, und der
   * Prüfer lief über die Sekunde aus Gate 38 (1,5 s). Er suchte je Kandidat
   * in jeder Datei neu: 218 × 247 Durchläufe desselben Musters.
   *
   * Gesammelt wird jetzt einmal je Datei, welche Zahlen darin vorkommen —
   * danach ist jede Frage ein Nachschlagen. Gemessen: 1,5 s auf 0,2 s.
   */
  const zahlenJeDatei = new Map([...ohne].map(([p, t]) => [p, zahlenIn(t)]));
  const gefuehrt = new Set(eintraege.map((e) => Number(e.literal)));
  /*
   * **Schluessel ist Name **und** Wert — 13. September 2026.** Solange die
   * Messung nur `export const NAME` las, war der Name eindeutig. Objektfelder
   * heissen `basis`, `wert`, `mindestens`: In `src/empfindlichkeit.js` tragen
   * drei Annahmen ein Feld `basis` mit drei verschiedenen Zahlen.
   *
   * > **Ein Haken, der nur den Namen kennt, hakt drei Zahlen mit einem Satz
   * > ab.**
   */
  const schluessel = (name, wert) => `${name}=${wert}`;
  const abgehakt = new Map(geprueft.map((g) => [schluessel(g.name, g.wert), g]));
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
    for (const m of benannteZahlen(text)) {
      const name = m.name;
      const wert = m.wert;
      /*
       * Zahlen ohne Aussagekraft heraus. 0, 1 und 2 stehen in jeder zweiten
       * Zeile dieses Bestandes; 100 und 1000 sind Rundungs- und
       * Umrechnungsfaktoren. Sie im engen Band zu suchen hieße, das Band
       * sofort wieder zu füllen — und zwar mit genau dem Rauschen, gegen das
       * die Schwelle gebaut ist.
       */
      if ([0, 1, 2, 3, 100, 1000].includes(wert)) continue;
      gesehen.add(schluessel(name, wert));
      const andere = [];
      for (const [p, zahlen] of zahlenJeDatei) {
        if (p === pfad || REDEN_UEBER_DEN_BESTAND.includes(p)) continue;
        if (zahlen.has(wert)) andere.push(p);
      }
      if (andere.length === 0 || andere.length > ENGE_SCHWELLE) continue;
      vorschlaege.push({ name, wert, heimat: pfad, andere });
      if (gefuehrt.has(wert) || abgehakt.has(schluessel(name, wert))) continue;
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
  const imBand = new Set(vorschlaege.map((v) => schluessel(v.name, v.wert)));
  for (const g of geprueft) {
    if (!gesehen.has(schluessel(g.name, g.wert))) {
      meldungen.push({ regel: 'haken-ohne-zahl', wo: g.name,
        text: `${g.name} steht als geprüfter Vorschlag und ist als benannte Zahl in src/ nicht mehr da` });
    } else if (!imBand.has(schluessel(g.name, g.wert))) {
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
