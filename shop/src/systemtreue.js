/**
 * Stammen die Schichten eines Warenkorbs aus **einem** Wärmedämmverbundsystem?
 *
 * **Der Anlass, 8. September 2026.** `inhalte/wissen/wdvs-systemaufbau.md`
 * trägt seit dem ersten Tag einen eigenen Abschnitt:
 *
 * > *„**Systemtreue — warum man nicht mischen sollte.** Ein WDVS wird als
 * > Kombination geprüft, nicht Bestandteil für Bestandteil. Die Prüfgrundlage
 * > ist ETAG 004 … Wer den Klebemörtel des einen Herstellers mit dem Gewebe
 * > eines anderen kombiniert, verlässt die geprüfte Zusammenstellung."*
 *
 * Und die Gruppenseite sagt es ein zweites Mal: *„Mischen verlässt die
 * geprüfte Kombination."*
 *
 * Der Katalog führt daneben **beides**:
 *
 * | Rolle | Capatect | Baumit |
 * |---|---|---|
 * | Klebe-/Armierungsmörtel | 186 M, 190 FEIN | KlebeSpachtel 25 kg |
 * | Glasgewebe | Glasgewebe M 55 m² | TextilglasGitter 1,1 × 50 m |
 *
 * Zwei Karten nebeneinander auf derselben Gruppenseite, ohne Unterschied im
 * Aussehen, und die günstigere gewinnt. Der Warenkorb rechnet beides
 * anstandslos zusammen.
 *
 * > **Die Systemtreue stand in der Prosa. Der Warenkorb kannte sie nicht.**
 *
 * Und die Daten konnten sie gar nicht kennen: Der Katalog führt `gruppe`,
 * `einheit`, `sperrgut` — **keinen Hersteller**. Der Markenname steht nur im
 * Fließtext der Bezeichnung.
 *
 * ## Was hier bewusst **nicht** gewarnt wird
 *
 * Nicht jeder Bestandteil eines WDVS ist systemgebunden. Die eigene
 * Wissensseite sagt es beim Dübel selbst: *„Das ist eine Bemessung … sie kommt
 * vom Planer oder **aus der Dübelzulassung**, nicht aus dem Baustoffhandel."*
 * Ein Dübel trägt seine eigene Zulassung; ihn aus einem anderen Haus zu nehmen
 * ist kein Systembruch. Gewarnt wird deshalb nur bei den Schichten, die die
 * Prüfgrundlage als Kombination prüft — und jede Ausnahme steht mit Grund im
 * Register.
 *
 * > **Eine Warnung, die bei jedem Korb angeht, liest nach dem dritten Mal
 * > niemand mehr.**
 */

import { HERSTELLER, marke } from './hersteller.js';


/**
 * Die Schichten, die nach der eigenen Wissensseite als **Kombination** geprüft
 * werden — und nur bei denen eine Vermischung gemeldet wird.
 *
 * Die Dämmplatte fehlt hier, weil der Shop sie nicht in Flächenstärke führt;
 * das steht seit dem 30. August auf der Systemliste und ist keine Auslassung.
 */
export const SCHICHTEN = Object.freeze([
  Object.freeze({
    rolle: 'Klebe- und Armierungsmörtel',
    // „Klebe- und Spachtelmasse" trägt zwischen den beiden Wörtern einen
    // Bindestrich **und** ein Leerzeichen; der erste Anlauf las nur eines von
    // beidem und ließ ausgerechnet die zwei Capatect-Massen durchfallen —
    // eine Schicht, die kein Muster trifft, verschwindet aus der Prüfung.
    muster: /Klebe[-\s]*(?:und\s+)?Spachtel|Armierungsm[öo]rtel/i,
    warum: 'Die Prüfgrundlage nennt ausdrücklich den Klebemörtel des einen Herstellers mit '
      + 'dem Gewebe eines anderen als den Fall, der die Zusammenstellung verlässt.',
  }),
  Object.freeze({
    rolle: 'Glasgewebe',
    muster: /Glasgewebe|Textilglasgitter/i,
    warum: 'Das Gewebe liegt eingebettet im Armierungsmörtel; die beiden werden als Paar '
      + 'geprüft und sind der im Regelwerk genannte Beispielfall.',
  }),
  Object.freeze({
    rolle: 'Putzgrund',
    muster: /Putzgrund/i,
    warum: 'Der Putzgrund stellt die Haftung zwischen Armierungsschicht und Oberputz her — '
      + 'beide Seiten davon gehören dem System.',
  }),
  Object.freeze({
    rolle: 'Oberputz',
    muster: /Reibputz|Oberputz|Silikatputz|Silikonharzputz/i,
    warum: 'Die oberste Schicht des geprüften Aufbaus; ihre Körnung und Bindemittelbasis '
      + 'stehen in den Systemunterlagen des Herstellers.',
  }),
  /*
   * **Die Schichten des Kaminzugs — 8. September 2026.** Seine Seite nennt sie
   * ausdrücklich als systemgebunden: die Mantelsteine „mit einem
   * Dünnbettmörtel **des Systems** versetzt, nicht mit gewöhnlichem
   * Mauermörtel — die Fugendicke gehört zum System", und das Innenrohr „mit
   * der Fugenmasse **des Systems** verbunden".
   */
  Object.freeze({
    rolle: 'Mantelstein',
    // „Mantelstein" und „Mantelsteinkleber" sind zwei verschiedene Dinge —
    // derselbe Fall wie bei den Schemazeichnungen am 6. September: Ein
    // Mantelstein ist ein Stein, ein Mantelsteinkleber ist keiner. Hinter dem
    // Wort darf deshalb kein weiterer Buchstabe stehen.
    muster: /Mantelstein(?![\p{L}])/u,
    warum: 'Der tragende Mantel des Zugs. Seine Steinhöhe bestimmt die Lagenzahl und mit ihr '
      + 'die Fugendicke, die laut der eigenen Seite zum System gehört.',
  }),
  Object.freeze({
    rolle: 'Dünnbettmörtel des Systems',
    muster: /Dünnbettmörtel|Mantelsteinkleber/i,
    warum: 'Die Seite nennt ihn als einzige Position ausdrücklich mit dem Zusatz „des '
      + 'Systems" und grenzt ihn gegen gewöhnlichen Mauermörtel ab — die Fugendicke gehört '
      + 'zum System.',
  }),
  Object.freeze({
    rolle: 'Innenrohr',
    muster: /Innenrohr|Rohr \d+\s?cm gedämmt/i,
    warum: 'Das rauchgasführende Rohr mit seiner Dämmschale; sein Durchmesser und seine '
      + 'Länge sind auf Mantelstein und Fertigfuß abgestimmt.',
  }),
  Object.freeze({
    rolle: 'Fugenmasse',
    muster: /Fugenmasse/i,
    warum: 'Die Rohrstöße werden mit der Fugenmasse des Systems verbunden — auch das steht '
      + 'wörtlich auf der eigenen Seite.',
  }),
]);

/**
 * Artikel der WDVS-Gruppe, die **keiner** Schicht zugeordnet sind — mit Grund.
 *
 * Ohne dieses Register wäre die Zuordnung einseitig: Ein neuer Artikel, den
 * kein Schichtmuster trifft, verschwände stillschweigend aus der Prüfung.
 */
export const OHNE_SCHICHT = Object.freeze([
  Object.freeze({
    sku: 'POS-11082',
    was: 'Capatect Universaldübel Schraubdübel',
    warum: 'Dübel tragen eine eigene Zulassung. Die eigene Wissensseite sagt es beim Dübel '
      + 'selbst: Zahl und Anordnung kommen vom Planer oder aus der Dübelzulassung, nicht aus '
      + 'dem Baustoffhandel. Ein Dübel aus einem anderen Haus ist deshalb kein Systembruch.',
  }),
  Object.freeze({
    sku: 'POS-52537',
    was: 'Drehstiftdübel PK(100) K 6',
    warum: 'Derselbe Grund wie beim Universaldübel — und dieser trägt gar keinen '
      + 'Markennamen. Er ist der Beleg dafür, dass die Marke aus der Bezeichnung kein '
      + 'Ersatz für ein Herstellerfeld ist, sondern eine Behelfslösung bis zur '
      + 'Artikelliste des Lieferanten.',
  }),
  Object.freeze({
    sku: 'POS-29610',
    was: 'Capatect Polystyrol-Rondelle',
    warum: 'Die Rondelle gehört zum Dübel und nicht zur Schichtenfolge: Sie deckt den '
      + 'versenkt gesetzten Teller ab. Ihre Passung richtet sich nach dem Dübel, dessen '
      + 'Zulassung eigenständig ist.',
  }),
  Object.freeze({
    sku: 'POS-53402',
    was: 'Capatect Kantenschutz mit Gewebe Carbon',
    warum: 'Ein Profil für Außenecken und Laibungen. Es trägt zwar ein Gewebefähnchen, '
      + 'bildet aber keine Fläche der Armierungsschicht, sondern deren Rand — es ersetzt '
      + 'keine Schicht und steht in keiner Verbrauchsrechnung je m².',
  }),
  Object.freeze({
    sku: 'POS-52124',
    was: 'Capatect Gewebeanschlussleiste 3D Universal Plus',
    warum: 'Dasselbe am Fenster- und Türanschluss: ein Anschlussprofil mit Dichtband, das '
      + 'die Putzfläche vom Rahmen trennt. Es ist die Position, die am häufigsten vergessen '
      + 'wird, und keine Schicht des geprüften Aufbaus.',
  }),
]);

/**
 * Schichten, deren System sich aus der Bezeichnung **nicht** lesen lässt.
 *
 * **Der Fund, der von Runde 192 übrig bleibt.** Acht der neun Kaminartikel
 * lösen sich über `marke()` zu „Schiedel Österreich" auf. Einer nicht — und es
 * ist ausgerechnet der Dünnbettmörtel, den die eigene Seite als einzige
 * Position mit dem Zusatz „des Systems" hervorhebt.
 *
 * Ein Kamin ist ein Brandschutzbauteil; über seine Abnahme entscheidet der
 * Rauchfangkehrer anhand der Systemzulassung. Eine geratene Zuordnung wäre
 * dort schlimmer als keine — sie sähe aus wie eine Auskunft (Gate 31).
 *
 * Der Eintrag steht hier und nicht in `OHNE_SCHICHT`: Der Artikel **ist** eine
 * Schicht, und zwar die empfindlichste. Was fehlt, ist sein System.
 */
export const SYSTEM_UNBEKANNT = Object.freeze([
  Object.freeze({
    sku: 'POS-18110',
    was: 'Mantelsteinkleber RMRTL Dünnbettmörtel',
    warum: 'Die Bezeichnung trägt keine Marke und keine Produktlinie, nur das Kürzel RMRTL. '
      + 'Acht Kaminartikel daneben nennen SIKM, SIK, Schiedel oder Absolut; dieser nicht. '
      + 'Damit lässt sich nicht sagen, ob er zum Schiedel-Aufbau gehört — und geraten wird '
      + 'es nicht, weil ein Kamin über die Systemzulassung abgenommen wird.',
    loest: 'Das Herstellerfeld aus der Artikelliste des Lieferanten. Der Brief erbittet sie '
      + 'bereits; dieser Artikel ist der Beleg dafür, dass die Marke in der Bezeichnung '
      + 'eine Behelfslösung ist und keine Datenhaltung.',
  }),
]);

/**
 * **Am 8. September zurückgenommen: eine eigene Markenliste.**
 *
 * Hier stand `SYSTEME` mit zwei Einträgen — `/^Capatect\b/` und `/^Baumit\b/`,
 * die Marke musste ganz vorn stehen. Damit war der Kamin unsichtbar, und ich
 * habe daraus geschlossen, seine Systemzugehörigkeit sei „nicht bestimmbar".
 *
 * `src/hersteller.js` löst das seit Langem: `marke()` sucht überall im Text,
 * aber nur als ganzes Wort und mit der längsten Marke zuerst — und sein
 * Kopfkommentar nennt als Anlass genau die drei Artikel, über die ich
 * gestolpert bin („Mantelstein MSTS EZ 16-18 **SIKM**", „Regenhaube … 180
 * **Absolut & SIH**", „Thermo-Trennstein 12-18 EZ **Absolut**").
 *
 * > **Ich habe aus der Unkenntnis meiner eigenen Liste einen Befund über den
 * > Bestand gemacht.**
 *
 * Gemessen mit der richtigen Liste: **acht von neun** Kaminartikeln lösen sich
 * zu „Schiedel Österreich" auf. Genau einer nicht — und das ist der Befund,
 * der bleibt, siehe `GEWERKE` weiter unten.
 *
 * Das System eines Artikels ist deshalb der **Hersteller**, nicht die Marke:
 * `SIKM`, `SIK`, `Schiedel` und `Absolut` sind Produktlinien desselben Hauses,
 * und ein Kamin daraus ist systemtreu. Eine Liste, die sie auseinanderhielte,
 * warnte vor einem Bruch, den es nicht gibt.
 */
export function einordnung(artikel) {
  const text = String(artikel.bezeichnung ?? '');
  const schicht = SCHICHTEN.find((s) => s.muster.test(text)) ?? null;
  const m = marke(text);
  return { sku: artikel.sku, schicht: schicht?.rolle ?? null, system: m ? HERSTELLER[m].name : null };
}

/**
 * Hält den Katalog gegen das Register — in beide Richtungen.
 *
 * @param {object[]} artikel  alle Artikel, die in einen WDVS-Aufbau gehören
 */
export function zuordnungsbefund(artikel, ohneSchicht = OHNE_SCHICHT, unbekannt = SYSTEM_UNBEKANNT) {
  const meldungen = [];
  const befreit = new Map(ohneSchicht.map((e) => [e.sku, e]));
  const gesehen = new Set();
  const gesehenUnbekannt = new Set();

  for (const a of artikel) {
    const e = einordnung(a);
    if (e.schicht === null) {
      if (!befreit.has(a.sku)) {
        meldungen.push({
          regel: 'artikel-ohne-schicht',
          text: `${a.sku} „${a.bezeichnung}" gehört keiner Schicht an und steht in keinem `
            + 'Eintrag von OHNE_SCHICHT — wer ihn aus der Systemprüfung nimmt, schreibt den Grund dazu',
        });
      } else {
        gesehen.add(a.sku);
      }
      continue;
    }
    if (befreit.has(a.sku)) {
      meldungen.push({
        regel: 'befreiter-artikel-ist-schicht',
        text: `${a.sku} steht als schichtlos im Register und trifft doch die Schicht `
          + `„${e.schicht}"`,
      });
      gesehen.add(a.sku);
      continue;
    }
    if (e.system === null) {
      // **Registriert statt gemeldet.** Eine Schicht ohne ablesbares System
      // ist ein Fund — aber ein bekannter, wenn er mit Grund und mit dem Weg
      // zur Auflösung dasteht. Ein Prüfer, der jeden Lauf dieselbe bekannte
      // Lücke meldet, wird nach dem dritten Mal weggeklickt.
      const bekannt = unbekannt.find((u) => u.sku === a.sku);
      if (bekannt) { gesehenUnbekannt.add(a.sku); continue; }
      meldungen.push({
        regel: 'schicht-ohne-system',
        text: `${a.sku} „${a.bezeichnung}" ist eine Schicht (${e.schicht}), und aus der `
          + 'Bezeichnung ist kein System ablesbar — eine Schicht ohne System lässt sich gegen '
          + 'keine andere prüfen',
      });
    }
  }

  for (const u of unbekannt) {
    const a = artikel.find((x) => x.sku === u.sku);
    if (!a) {
      meldungen.push({
        regel: 'unbekannt-ohne-artikel',
        text: `${u.sku} („${u.was}") steht als System-unbekannt im Register, im Katalog aber nicht mehr`,
      });
      continue;
    }
    if (einordnung(a).system !== null) {
      meldungen.push({
        regel: 'unbekannt-und-doch-bekannt',
        text: `${u.sku} steht als System-unbekannt im Register, die Bezeichnung nennt aber `
          + `inzwischen ${einordnung(a).system} — der Eintrag gehört weg`,
      });
    } else if (!gesehenUnbekannt.has(u.sku)) {
      meldungen.push({
        regel: 'unbekannt-ohne-schicht',
        text: `${u.sku} steht als System-unbekannt im Register, ist aber gar keine Schicht mehr`,
      });
    }
  }

  for (const e of ohneSchicht) {
    if (gesehen.has(e.sku)) continue;
    meldungen.push({
      regel: 'eintrag-ohne-artikel',
      text: `${e.sku} („${e.was}") steht als schichtlos im Register, im Katalog aber nicht mehr`,
    });
  }
  return { geprueft: artikel.length, meldungen, sauber: meldungen.length === 0 };
}

/**
 * Mischt dieser Warenkorb zwei Systeme?
 *
 * Gemeldet wird **nur**, wenn zwei verschiedene Systeme mit je einer Schicht
 * vertreten sind. Ein Korb aus einem System und einem Dübel des anderen Hauses
 * ist kein Fund.
 */
export function systembruch(artikelImKorb) {
  const schichten = artikelImKorb.map(einordnung).filter((e) => e.schicht && e.system);
  const systeme = [...new Set(schichten.map((e) => e.system))].sort();
  if (systeme.length < 2) return null;
  const jeSystem = systeme.map((s) => ({
    system: s,
    rollen: [...new Set(schichten.filter((e) => e.system === s).map((e) => e.schicht))].sort(),
  }));
  return { systeme, jeSystem };
}

/**
 * Der Satz für den Kunden. Er warnt und entscheidet nicht: Welche
 * Zusammenstellung geprüft ist, steht in den Systemunterlagen des Herstellers
 * — das sagt die eigene Wissensseite, und dabei bleibt es.
 */
export function systembruchsatz(bruch) {
  if (!bruch) return '';
  const teile = bruch.jeSystem.map((s) => `${s.system} (${s.rollen.join(', ')})`);
  return `Hinweis zur Systemtreue: Ihr Warenkorb enthält Schichten aus zwei Systemen — `
    + `${teile.join(' und ')}. Ein Wärmedämmverbundsystem wird als Kombination geprüft `
    + '(ETAG 004, ÖNORM B 6400); wer den Klebemörtel des einen Herstellers mit dem Gewebe '
    + 'eines anderen kombiniert, verlässt die geprüfte Zusammenstellung. Welche '
    + 'Zusammenstellung geprüft ist, steht in den Systemunterlagen des Herstellers. '
    + 'Wir liefern, was Sie bestellen — diese Zeile soll nur verhindern, dass es niemand '
    + 'bemerkt hat.';
}
/**
 * Gewerke, deren eigene Wissensseite Systemtreue behauptet — und ob sie sich
 * am Katalog überhaupt messen lässt.
 *
 * **Der Anlass, 8. September 2026, abends.** Nachdem der WDVS-Fall gefunden
 * war, lag die Frage nahe: Gibt es ihn woanders auch? Der Kaminzug behauptet
 * dieselbe Regel schärfer als das WDVS, und zwar im **ersten Satz** seiner
 * Seite: *„Die Teile eines Systems sind aufeinander abgestimmt und werden
 * nicht mit denen eines anderen gemischt."* Und einen Absatz weiter, für ein
 * ganz bestimmtes Teil: *„mit einem **Dünnbettmörtel des Systems** versetzt,
 * nicht mit gewöhnlichem Mauermörtel — die Fugendicke gehört zum System."*
 *
 * Gemessen an den neun Kaminartikeln ist das **nicht prüfbar**. Die
 * Systemmarke steht in vier Schreibweisen und an wechselnder Stelle — `SIKM`
 * am Anfang und am Ende, `SIK`, `Schiedel`, `Absolut`, `Absolut & SIH` —, und
 * ein Artikel trägt gar keine: **`Mantelsteinkleber RMRTL Dünnbettmörtel`.**
 * Ausgerechnet das Teil, das die eigene Seite als systemgebunden hervorhebt.
 *
 * > **Beim WDVS war die Marke eine Behelfslösung, die trug. Beim Kamin trägt
 * > sie nicht — und das ist kein Grund, sie trotzdem zu benutzen.**
 *
 * Ein Kamin ist ein Brandschutzbauteil; über seine Abnahme entscheidet der
 * Rauchfangkehrer anhand der Systemzulassung. Eine geratene Zuordnung wäre
 * dort schlimmer als keine — deshalb steht hier „nicht bestimmbar" mit dem
 * Grund und nicht eine Regel, die meistens stimmt (Gate 31).
 *
 * Auflösen lässt sich das nicht im Verzeichnis, sondern nur mit dem
 * Herstellerfeld aus der Artikelliste des Lieferanten — der Punkt, den der
 * Brief ohnehin schon erbittet.
 */
export const GEWERKE = Object.freeze([
  Object.freeze({
    gruppe: 'WDVS',
    seite: 'wissen/wdvs-systemaufbau',
    messbar: true,
    warum: 'Neun von elf Artikeln tragen den Herstellernamen am Anfang der Bezeichnung, die '
      + 'zwei übrigen sind ein Dübel ohne Systembindung und ein zweiter Hersteller. Die '
      + 'Zuordnung ist eindeutig, und der Fall, vor dem die Seite warnt, ist bestellbar.',
  }),
  Object.freeze({
    gruppe: 'Kamin',
    seite: 'wissen/kaminzug-aufbau',
    messbar: true,
    warum: 'Acht der neun Kaminartikel lösen sich über marke() zu „Schiedel Österreich" auf — '
      + 'SIKM, SIK, Schiedel und Absolut sind Produktlinien desselben Hauses, und ein Kamin '
      + 'daraus ist systemtreu. Der neunte, der Mantelsteinkleber, trägt keine Marke und '
      + 'steht mit Grund in SYSTEM_UNBEKANNT. Am 08.09. stand hier zuerst „nicht bestimmbar" '
      + 'für das ganze Gewerk — das war ein Irrtum über die eigene Ablage und nicht über den '
      + 'Katalog.',
  }),
]);

/**
 * Hält die Gewerkeliste gegen den Katalog — in beide Richtungen.
 *
 * Ein Gewerk, das als „nicht bestimmbar" geführt wird, muss den Artikel noch
 * haben, an dem es scheitert. Verschwindet er, ist die Begründung hinfällig
 * und die Frage neu zu stellen — sonst bliebe eine Ausrede stehen, deren
 * Anlass es nicht mehr gibt.
 */
export function gewerkbefund(artikel, gewerke = GEWERKE) {
  const meldungen = [];
  for (const g of gewerke) {
    const eigene = artikel.filter((a) => a.gruppe === g.gruppe);
    if (eigene.length === 0) {
      meldungen.push({
        regel: 'gewerk-ohne-artikel',
        text: `${g.gruppe} steht in der Gewerkeliste, der Katalog führt dazu keinen Artikel mehr`,
      });
      continue;
    }
    if (g.messbar) {
      const registriert = new Set(SYSTEM_UNBEKANNT.map((u) => u.sku));
      const stumm = eigene.filter((a) => einordnung(a).system === null
        && einordnung(a).schicht !== null && !registriert.has(a.sku));
      for (const a of stumm) {
        meldungen.push({
          regel: 'messbar-und-doch-stumm',
          text: `${g.gruppe} gilt als messbar, ${a.sku} „${a.bezeichnung}" ist aber eine `
            + 'Schicht ohne erkennbares System',
        });
      }
      continue;
    }
    if (!g.blockiert) {
      meldungen.push({
        regel: 'unmessbar-ohne-beleg',
        text: `${g.gruppe} gilt als nicht bestimmbar und nennt keinen Artikel, an dem es scheitert`,
      });
      continue;
    }
    if (!eigene.some((a) => a.sku === g.blockiert)) {
      meldungen.push({
        regel: 'blockierer-verschwunden',
        text: `${g.gruppe} beruft sich auf ${g.blockiert}; den Artikel gibt es nicht mehr — `
          + 'die Frage ist neu zu stellen',
      });
    }
  }
  return { gewerke: gewerke.length, meldungen, sauber: meldungen.length === 0 };
}
