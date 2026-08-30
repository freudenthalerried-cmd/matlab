/**
 * Was einen Katalog zu einem Shop macht: Suchen, Filtern, Sortieren, Sammeln.
 *
 * Die Weisung lautete „ein richtig hochwertiger Shop wie Amazon". Was daran
 * hochwertig ist, sind nicht Verläufe und Schatten, sondern vier Dinge, die
 * ein Kunde tut: **finden, eingrenzen, vergleichen, sammeln.** Bis hierher
 * konnte die Seite keines davon.
 *
 * Dieses Modul läuft **im Browser und im Testlauf** — dieselbe Datei, kein
 * Nachbau. Es rechnet keine Preise; dafür ist der Rechenkern zuständig
 * (`warenkorb.js`, `preis.js`, `kostenbild.js`). Wer hier eine zweite
 * Preisrechnung einbaut, hat zwei Wahrheiten.
 *
 * Bewusst ohne Fremdmittel und ohne Server: Der Shop ist eine statische
 * Seite. Suche und Warenkorb laufen beim Kunden.
 */

/* ------------------------------------------------------------------ *
 * Suche
 * ------------------------------------------------------------------ */

import { istMenge } from './gebinde.js';

/**
 * Zerlegt Text in vergleichbare Wortstämme.
 *
 * Ein Wort ergibt **einen** Stamm — Umlautschreibweise und Beugung fallen
 * zusammen. Wer „Mörtel", „Moertel" oder „Mörteln" tippt, sucht dasselbe.
 * Wie das geschieht, steht bei `normalisiere` und `stamm`.
 */
/**
 * Längenmaße auf Millimeter vereinheitlichen.
 *
 * **Gemessen am 29.08.:** „xps 8 cm" fand nichts. Der Shop führt „XPS glatt
 * SF **80 mm**" und „XPS rau GK 80 mm" — ein Bauleiter sagt aber acht
 * Zentimeter. Dass „eps 5 cm" funktionierte, war Zufall: Die EPS-Platten
 * heißen im Katalog „2 cm", „3 cm", „5 cm", die XPS-Platten „30 mm",
 * „50 mm", „80 mm". Dieselbe Frage traf die eine Warengruppe und die andere
 * nicht.
 *
 * Beide Schreibweisen werden deshalb auf **einen** Stamm gebracht:
 * `8 cm` und `80 mm` werden beide zu `80mm`. Die nackte Zahl bleibt
 * zusätzlich erhalten, damit „xps 80" weiter trifft.
 *
 * Nur Zentimeter und Millimeter. Meter und Quadratmeter bleiben unberührt:
 * „1,1x50 m" ist ein Rollenmaß und „0,5 m2" eine Fläche — daraus eine Länge
 * zu machen hieße, eine Kante zu erfinden.
 */
const MASS = /(\d+(?:[.,]\d+)?)\s*(cm|mm)(?![\p{L}\d])/giu;

function vereinheitlicheMasse(text) {
  const zahlen = [];
  const ersetzt = text.replace(MASS, (_, zahl, einheit) => {
    const wert = Number(String(zahl).replace(',', '.'));
    if (!Number.isFinite(wert) || wert <= 0) return ` ${zahl} ${einheit} `;
    const mm = einheit.toLowerCase() === 'cm' ? wert * 10 : wert;
    zahlen.push(String(zahl).replace(',', '.'));
    return ` ${Math.round(mm)}mm `;
  });
  return { ersetzt, zahlen };
}

/**
 * Eine Schreibweise statt vier.
 *
 * Bis zum 30.08. legte diese Funktion Umlautwörter **doppelt** ab: einmal
 * „mörtel", einmal „moertel". Das war richtig gedacht — auf einem
 * Baustellenhandy tippt mancher das zweite — aber es löste nur die halbe
 * Aufgabe und versperrte die andere: Solange ein Wort mehrere Formen hat,
 * müssen bei einer Suche **alle** davon treffen, und damit lässt sich kein
 * Stamm bilden.
 *
 * Jetzt gibt es eine Normalform: Umlaut und Digraph fallen auf denselben
 * Vokal. „mörtel", „moertel" und „mortel" werden zu `mortel`.
 */
export function normalisiere(wort) {
  return wort
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}

/** Ein `s` darf nur nach diesen Buchstaben fallen — sonst ist es Wortstamm. */
const S_VORGAENGER = 'bdfghklmnrt';

/**
 * Eine Längensperre statt dreier Sperren.
 *
 * Der erste Wurf trug die R1-Regel von Snowball mit — „schneide nur hinter
 * dem ersten Nichtvokal, der auf einen Vokal folgt". Die Gegenprobe hat sie
 * widerlegt: Abgeschaltet ändert sie auf den **177 Wörtern dieses Bestands
 * kein einziges Ergebnis**. Ein Kommentar behauptete außerdem, sie halte
 * „Mauer" zusammen — in Wahrheit fällt dort das `ue` der Normalform, mit
 * oder ohne Regel.
 *
 * Der zweite Wurf setzte zwei Längensperren an ihre Stelle, und die
 * Gegenprobe hat die eine davon gleich mit widerlegt: Eine Mindestwortlänge
 * ist überflüssig, solange der **Rest** mindestens vier Zeichen behalten
 * muss — kürzere Wörter kommen dann von selbst nicht durch.
 *
 * Und eine dritte Sperre — „Wörter mit Ziffern gar nicht erst stutzen" —
 * fiel aus demselben Grund: Ein Maß wie `80mm` endet auf keine dieser
 * Endungen, und `1990er` auf `1990` zu kürzen wäre richtig, nicht falsch.
 *
 * Von drei Regeln, die ich für nötig hielt, hat genau eine ihre Wirkung
 * zeigen können. Was bleibt, ist eine Zahl, die man nachrechnen kann.
 */
const MINDESTSTAMM = 4;

/**
 * Der Wortstamm — damit der Plural findet, was der Singular findet.
 *
 * **Gemessen am 30.08.** an 35 Paaren aus der Sprache der Baustelle:
 * **31 verloren beim Wechsel in den Plural jeden Treffer.** „dämmplatte"
 * fand zehn Artikel, „dämmplatten" einen. „schornsteine", „abflussrohre",
 * „anputzleisten", „spachtelmassen": null. Der Grund steckt in der
 * Trefferregel — sie kennt den Wortanfang und die Wortmitte, also findet ein
 * **kürzeres** Suchwort das längere Indexwort. Umgekehrt nie. Und der Plural
 * ist im Deutschen fast immer die längere Form.
 *
 * Behoben wird das mit der ersten Stufe des deutschen Snowball-Stemmers:
 * Umlaute auf den Grundvokal, dann **eine** Endung aus `ern em en er es e`
 * abschneiden, wenn dahinter genug Wort übrig bleibt; ein `s` nur nach
 * geeignetem Vorgänger. Keine Wortliste, keine Fremdmittel, dieselbe Regel
 * für Index und Frage.
 *
 * Bewusst **nicht** die zweite und dritte Stufe (`heit`, `lich`, `keit`,
 * `isch`): Die machen aus Wortbildung Wortstamm und würden im Sortiment
 * Bedeutungen zusammenwerfen, die auseinandergehören. Der Plural ist die
 * Frage, die gemessen wurde; er wird beantwortet, mehr nicht.
 */
export function stamm(wort) {
  const rein = normalisiere(wort);
  for (const endung of ['ern', 'em', 'en', 'er', 'es', 'e']) {
    if (rein.endsWith(endung) && rein.length - endung.length >= MINDESTSTAMM) {
      return rein.slice(0, -endung.length);
    }
  }
  if (rein.endsWith('s') && rein.length - 1 >= MINDESTSTAMM && S_VORGAENGER.includes(rein.at(-2))) {
    return rein.slice(0, -1);
  }
  return rein;
}

function zerlege(text) {
  const roh = String(text ?? '').toLowerCase();
  const { ersetzt, zahlen } = vereinheitlicheMasse(roh);
  return { teile: ersetzt.split(/[^\p{L}\d]+/u).filter((t) => t.length >= 2), zahlen };
}

export function wortstaemme(text) {
  const { teile, zahlen } = zerlege(text);
  return [...new Set([...teile.map(stamm), ...zahlen])];
}

/**
 * Dieselben Wörter, **ungestutzt** — für den Vorschlag, nicht für die Suche.
 *
 * Gesucht wird über Stämme, vorgeschlagen wird über Wörter. Der erste Wurf
 * des Stemmers hat das übersehen und dem Kunden „dammplatt", „geweb" und
 * „spachtelmass" angeboten: verstümmelte Wörter, die in keinem Katalog
 * stehen. Ein Vorschlag ist Text für Menschen; er muss so aussehen, wie der
 * Shop die Ware nennt.
 */
export function wortformen(text) {
  return [...new Set(zerlege(text).teile)];
}

/**
 * Die Kundenwörter zu einem Artikel.
 *
 * Der Katalog spricht die Sprache des Lieferanten. Ein Kunde tippt das Wort,
 * das er auf der Baustelle sagt — und trifft damit nichts:
 *
 * > „Noppenbahn" fand nichts, weil der Artikel *Grundmauerschutz* heißt.
 * > „Rauchfang" fand nichts, weil kein Kaminartikel das Wort im Namen trägt.
 * > „Styropor", „Bauschaum", „Anputzleiste", „Vollwärmeschutz": nichts.
 *
 * Gemessen am 27. August: **18 von 33** geläufigen Kundenwörtern lieferten
 * null Treffer. Eine Suche, die nur die Artikelnummer und den
 * Lieferantennamen kennt, ist eine Suche für den, der das Sortiment schon
 * auswendig kann.
 *
 * Das Register steht in `data/suchwoerter.json` und ist von Hand entschieden,
 * Wort für Wort, mit einer Begründung je Eintrag. Es ist bewusst **keine**
 * automatische Ähnlichkeitssuche: Ein Suchwort ist ein Versprechen, dass der
 * gefundene Artikel die gemeinte Aufgabe erfüllt.
 *
 * Deshalb führt die Datei auch, was **nicht** aufgenommen wurde — „Drainage",
 * „Abdichtung", „Bitumen", „Gleitmittel". Für all das gibt es keine Ware im
 * Sortiment, und ein Suchwort, das ersatzweise auf etwas Ähnliches zeigt,
 * erzeugt genau den Fehler, vor dem die Wissensseiten warnen. **Was wir nicht
 * haben, bleibt unauffindbar.**
 *
 * Kundenwörter landen in `schwach` und wiegen damit am wenigsten: Ein Artikel,
 * der das Wort im eigenen Namen trägt, steht immer davor.
 */
export function kundenwoerter(artikel, suchwoerter = []) {
  const raus = [];
  for (const e of suchwoerter) {
    const passt = (e.skus ?? []).includes(artikel.sku) || (e.gruppe && e.gruppe === artikel.gruppe);
    if (passt) raus.push(...wortstaemme(e.wort));
  }
  return raus;
}

/** Dieselben Kundenwörter, ungestutzt — für den Vorschlag. */
export function kundenformen(artikel, suchwoerter = []) {
  const raus = [];
  for (const e of suchwoerter) {
    const passt = (e.skus ?? []).includes(artikel.sku) || (e.gruppe && e.gruppe === artikel.gruppe);
    if (passt) raus.push(...wortformen(e.wort));
  }
  return raus;
}

/**
 * Die Wörter **des Index** — Stamm und ungestutzte Normalform.
 *
 * **Gemessen am 30.08.**, einen Tag nach dem Wortstamm: „bogen" fand nichts,
 * obwohl der Shop zwei *PVC Kanalbögen* führt. Vorher fand es beide.
 *
 * Der Grund ist eine Unsymmetrie der Mindeststammlänge. Sie gilt für das
 * ganze Wort: `kanalbogen` verliert sein `-en` (es bleiben acht Zeichen),
 * das alleinstehende `bogen` behält es (`bog` wäre zu kurz). Die Suche findet
 * ein kürzeres Wort in einem längeren — aber `kanalbog` enthält `bogen` nicht
 * mehr.
 *
 * > **Der Stamm hilft der Beugung und schadet dem Wortteil.**
 *
 * Deshalb trägt der **Index** beides: den Stamm für die Beugung und die
 * ungestutzte Normalform für den Wortteil. Die **Frage** trägt weiterhin nur
 * den Stamm — dort müssen alle Wörter treffen, und zwei Formen desselben
 * Wortes wären zwei Bedingungen statt einer.
 */
export function indexwoerter(text) {
  return [...new Set([...wortstaemme(text), ...wortformen(text).map(normalisiere)])];
}

/**
 * Baut den Suchindex.
 *
 * Jeder Eintrag trägt sein Gewicht mit: Ein Treffer in der Bezeichnung wiegt
 * schwerer als einer im Fließtext. Ohne diese Trennung findet „Gewebe" zuerst
 * die Wissensseite, die das Wort vierzigmal enthält, und erst danach das
 * Gewebe, das man kaufen kann.
 */
export function baueSuchindex({ artikel = [], seiten = [], suchwoerter = [] } = {}) {
  const eintraege = [];

  for (const a of artikel) {
    eintraege.push({
      art: 'artikel',
      id: `artikel/${a.sku}`,
      titel: a.bezeichnung,
      zusatz: `${a.gruppe} ${a.lieferantenArtikelnummer ?? ''}`,
      gruppe: a.gruppe,
      sku: a.sku,
      vkNetto: a.vkNetto ?? null,
      einheit: a.einheit,
      stark: indexwoerter(a.bezeichnung),
      schwach: [...new Set([
        ...indexwoerter(`${a.gruppe} ${a.lieferantenArtikelnummer ?? ''}`),
        ...kundenwoerter(a, suchwoerter),
      ])],
      // Ungestutzt, allein für „Meinten Sie" — siehe `wortformen`.
      formen: [...new Set([
        ...wortformen(a.bezeichnung),
        ...kundenformen(a, suchwoerter),
      ])],
    });
  }

  for (const s of seiten) {
    eintraege.push({
      art: s.art === 'gruppen' ? 'gruppe' : s.art,
      id: s.id,
      titel: s.titel,
      zusatz: s.kurz ?? '',
      gruppe: s.gruppe ?? null,
      stark: indexwoerter(`${s.titel} ${s.frage ?? ''}`),
      schwach: indexwoerter(`${s.kurz ?? ''} ${s.text ?? ''}`),
    });
  }

  return eintraege;
}

/** Gewichte der Trefferarten. Artikel vor Seite — der Shop verkauft Ware. */
const GEWICHT = Object.freeze({ artikel: 3, gruppe: 2, system: 2, wissen: 1 });

/**
 * Sucht im Index.
 *
 * Ein Wort zählt als Treffer, wenn ein Indexwort damit **beginnt** — „däm"
 * findet „Dämmplatte".
 *
 * **Und wenn es darin vorkommt**, ab vier Zeichen. Der erste Entwurf ließ das
 * weg, mit der Begründung, Wortmitten fänden zu viel. Der erste Probelauf hat
 * ihn widerlegt: Die Suche nach „spachtel" fand den *Baumit KlebeSpachtel*
 * nicht, weil das ein Wort ist und nicht zwei. **Deutsch setzt zusammen**;
 * eine Suche, die nur Wortanfänge kennt, findet im Baustoffhandel die Hälfte
 * des Sortiments nicht — Klebespachtel, Putzgrund, Trennwandfilz,
 * Kantenschutz, Grundmauerschutz. Die Grenze von vier Zeichen hält
 * Zufallstreffer in Artikelnummern draußen.
 *
 * Der Treffer in der Wortmitte zählt weniger als der am Anfang, und der
 * weniger als das ganze Wort. Damit steht der Spachtel vor dem
 * Klebespachtel, wenn jemand „spachtel" sucht.
 *
 * Mehrere Suchwörter müssen **alle** treffen. Wer „xps 50" eingibt, will
 * nicht alles, was XPS heißt, und auch nicht alles mit einer 50 darin.
 */
export function suche(index, frage, { grenze = 40 } = {}) {
  const woerter = wortstaemme(frage);
  if (!woerter.length) return [];

  const treffer = [];
  for (const e of index) {
    let punkte = 0;
    let alleGetroffen = true;

    for (const w of woerter) {
      const innen = w.length >= 4;
      const genau = e.stark.includes(w);
      const anfang = !genau && e.stark.some((s) => s.startsWith(w));
      const mitte = !genau && !anfang && innen && e.stark.some((s) => s.includes(w));
      const schwach = !genau && !anfang && !mitte
        && e.schwach.some((s) => s.startsWith(w) || (innen && s.includes(w)));
      if (!genau && !anfang && !mitte && !schwach) { alleGetroffen = false; break; }
      punkte += genau ? 12 : anfang ? 8 : mitte ? 6 : 3;
    }
    if (!alleGetroffen) continue;

    punkte *= GEWICHT[e.art] ?? 1;
    // Kurze Titel gewinnen bei Gleichstand: „Baumit KlebeSpachtel 25 kg" ist
    // eher gemeint als „Capatect Polystyrol-Rondelle für Capatect …".
    punkte -= Math.min(6, e.titel.length / 20);
    treffer.push({ ...e, punkte });
  }

  return treffer.sort((a, b) => b.punkte - a.punkte || a.titel.localeCompare(b.titel, 'de'))
    .slice(0, grenze);
}

/**
 * „Meinten Sie …?" — wenn die Suche nichts findet.
 *
 * **Gemessen am 28. August:** Von neun plausiblen Vertippern fanden **acht**
 * nichts — „spachtl", „kanalror", „dämmplate", „rauchfng", „styropr",
 * „kantenschuz", „schachtrng", „gewbe". Wer auf der Baustelle mit einer Hand
 * tippt, bekommt eine leere Seite und geht.
 *
 * Die Regel dieses Vorschlags ist dieselbe wie überall hier:
 *
 * > **Es wird nichts stillschweigend ersetzt.** Der Shop sucht nicht heimlich
 * > nach etwas anderem, sondern fragt. Wer „spachtl" eingegeben hat, sieht
 * > „Kein Treffer für „spachtl". Meinten Sie: Spachtel?" — und entscheidet
 * > selbst.
 *
 * Und: **Lieber schweigen als raten.** Vorgeschlagen wird nur, was nah genug
 * ist — ein Tippfehler bei kurzen Wörtern (bis sechs Zeichen) darf einen
 * Buchstaben ausmachen, bei längeren zwei. Alles darüber ist ein anderes
 * Wort, kein Vertipper.
 *
 * Der Abstand ist die klassische Editierdistanz (Levenshtein): wie viele
 * Buchstaben eingefügt, gelöscht oder ersetzt werden müssen. Verglichen wird
 * nur mit Wörtern ähnlicher Länge — das spart den Großteil der Arbeit und
 * ändert am Ergebnis nichts, weil ein Längenunterschied von drei Zeichen
 * schon einen Abstand von drei bedeutet.
 */
export function abstand(a, b, hoechstens = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > hoechstens) return hoechstens + 1;
  let vorige = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const aktuelle = [i];
    let bestesInZeile = i;
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      const wert = Math.min(vorige[j] + 1, aktuelle[j - 1] + 1, vorige[j - 1] + kosten);
      aktuelle.push(wert);
      if (wert < bestesInZeile) bestesInZeile = wert;
    }
    // Frühzeitig abbrechen: Ist die ganze Zeile schon zu weit weg, kann es
    // nur noch schlechter werden.
    if (bestesInZeile > hoechstens) return hoechstens + 1;
    vorige = aktuelle;
  }
  return vorige[b.length];
}

/** Wie weit ein Wort danebenliegen darf, um noch als Vertipper zu gelten. */
export function erlaubterAbstand(wort) {
  if (wort.length <= 3) return 0;
  return wort.length <= 6 ? 1 : 2;
}

/**
 * Vorschläge zu einer Anfrage, die nichts gefunden hat.
 *
 * @returns {string[]} höchstens `wieviele` Wörter aus dem Bestand, nach
 *   Abstand und dann nach Häufigkeit sortiert. Leer, wenn nichts nah genug
 *   ist — dann schweigt der Shop, statt zu raten.
 */
export function meintenSie(index, frage, { wieviele = 3 } = {}) {
  // **Verglichen wird normalisiert, vorgeschlagen wird die Schreibweise des
  // Shops.** Gestutzt wird hier nichts: „gewbe" liegt einen Buchstaben neben
  // „gewebe", aber zwei neben dessen Stamm `geweb` — ein Stemmer, der der
  // Suche hilft, macht den Vertipper unauffindbar.
  const woerter = wortformen(frage).map(normalisiere).filter((w) => w.length >= 4);
  if (!woerter.length) return [];

  // Der Wortschatz kommt aus dem, was der Shop **führt** — Bezeichnungen und
  // Kundenwörter. Wissensseiten bleiben draußen: Ein Vorschlag soll zu Ware
  // führen, nicht zu einem Aufsatz.
  //
  // Der Schlüssel ist die Normalform, der Wert die Schreibweise, unter der
  // die Ware im Katalog steht. „dämmplatte" und „daemmplatte" sind derselbe
  // Vorschlag; angezeigt wird der Name, den der Shop selbst verwendet.
  const haeufigkeit = new Map();
  for (const e of index) {
    if (e.art !== 'artikel') continue;
    for (const form of e.formen ?? []) {
      if (form.length < 4) continue;
      const schluessel = normalisiere(form);
      const bisher = haeufigkeit.get(schluessel);
      haeufigkeit.set(schluessel, { wort: bisher?.wort ?? form, wieOft: (bisher?.wieOft ?? 0) + 1 });
    }
  }

  const gefunden = new Map();
  const merke = (kandidat, d, wieOft) => {
    const bisher = gefunden.get(kandidat);
    if (!bisher || d < bisher.d) gefunden.set(kandidat, { d, wieOft });
  };

  for (const w of woerter) {
    const grenze = erlaubterAbstand(w);
    if (grenze === 0) continue;
    for (const [kandidat, { wieOft }] of haeufigkeit) {
      if (kandidat === w) continue;
      const d = abstand(w, kandidat, grenze);
      if (d <= grenze) { merke(kandidat, d, wieOft); continue; }

      // **Zweiter Anlauf: der Vertipper steckt in einem Kompositum.**
      //
      // „spachtl" fand zuerst nichts, obwohl der Shop drei Artikel mit
      // „Spachtel" führt — als *Wortteil*: KlebeSpachtel, Spachtelmasse. Die
      // Suche selbst kann das (sie sucht ab vier Zeichen auch in Wortmitten),
      // der Vorschlag konnte es nicht. Deutsch setzt zusammen; ein
      // Vorschlagswerk, das nur ganze Wörter vergleicht, ist hier taub.
      //
      // Verglichen wird das Suchwort mit jedem Ausschnitt passender Länge —
      // und vorgeschlagen wird das **ganze** Wort des Bestands. Der Kunde
      // sieht „KlebeSpachtel" und erkennt selbst, ob er das meinte.
      //
      // **Im Wortinneren darf der Vertipper nur einen Buchstaben kosten.**
      // Mit zwei erlaubten Buchstaben schlug „dachziegel" den
      // *Hochlochziegel* vor — d→l, a→o, und schon führt eine Suche nach
      // Dachziegeln zu einem Mauerziegel. Das ist genau der Fehler, den das
      // Kundenwörter-Register ausdrücklich vermeidet: **ersatzweise auf
      // etwas Ähnliches zeigen.** Wer Dachziegel sucht, bekommt hier
      // weiterhin nichts — wir führen keine.
      if (w.length < 5) continue;
      const innenGrenze = 1;
      let bestes = innenGrenze + 1;
      for (const laenge of [w.length - 1, w.length, w.length + 1]) {
        if (laenge < 4 || laenge > kandidat.length) continue;
        for (let i = 0; i + laenge <= kandidat.length; i++) {
          const d2 = abstand(w, kandidat.slice(i, i + laenge), innenGrenze);
          if (d2 < bestes) bestes = d2;
        }
      }
      // Ein Treffer im Wortinneren wiegt weniger als einer am ganzen Wort —
      // dieselbe Rangordnung wie in der Suche.
      if (bestes <= innenGrenze) merke(kandidat, bestes + 0.5, wieOft);
    }
  }

  /**
   * **Berichtigt am 30.08.** Hier stand ein Verfahren, das aus „dämmplatte"
   * und „daemmplatte" den einen Vorschlag machte, der zur Tastatur des
   * Kunden passte. Es ist entfallen, weil der Index die beiden Schreibweisen
   * nicht mehr doppelt führt: Der Schlüssel ist die Normalform, und daran
   * hängt genau eine Schreibweise — die des Katalogs. Wer „daemmplate" tippt,
   * bekommt jetzt „dämmplatte" vorgeschlagen, also den Namen, unter dem die
   * Ware wirklich steht.
   */

  /**
   * **Bei gleichem Abstand gewinnt die ähnlichere Länge.**
   *
   * Gefunden am 29.08.: Nach der Aufnahme des Kundenworts
   * „klebespachtelmasse" schlug der Vertipper „spachtl" nicht mehr
   * *spachtelmasse* vor, sondern das neue, doppelt so lange Wort — beide mit
   * demselben Abstand, und die Häufigkeit entschied zugunsten des längeren.
   *
   * Ein sehr langes Kompositum ist für einen kurzen Vertipper der
   * schlechtere Rat: Wer sieben Buchstaben tippt, meint eher ein kurzes Wort
   * mit einem Fehler als ein achtzehn Buchstaben langes. Die Häufigkeit
   * entscheidet erst danach.
   */
  const laengenAbstand = (wort) => Math.min(...woerter.map((w) => Math.abs(wort.length - w.length)));

  return [...gefunden.entries()]
    .map(([schluessel, wert]) => ({ wort: haeufigkeit.get(schluessel).wort, wert }))
    .sort((a, b) => a.wert.d - b.wert.d
      || laengenAbstand(a.wort) - laengenAbstand(b.wort)
      || b.wert.wieOft - a.wert.wieOft
      || a.wort.localeCompare(b.wort, 'de'))
    .slice(0, wieviele)
    .map((e) => e.wort);
}

/* ------------------------------------------------------------------ *
 * Filtern und Sortieren
 * ------------------------------------------------------------------ */

export const SORTIERUNGEN = Object.freeze([
  { id: 'name', text: 'Bezeichnung A–Z' },
  { id: 'preis-auf', text: 'Preis aufsteigend' },
  { id: 'preis-ab', text: 'Preis absteigend' },
  { id: 'vorteil', text: 'Preisvorteil zuerst' },
]);

/**
 * Sortiert eine Artikelliste.
 *
 * Artikel ohne Preis stehen **immer hinten**, in jeder Sortierung. Sie ganz
 * auszublenden wäre falsch (sie sind bestellbar, nur nicht bepreist), sie
 * unter „Preis aufsteigend" nach vorn zu lassen wäre irreführend: null ist
 * nicht null Euro.
 */
export function sortiere(artikel, wie = 'name') {
  const liste = [...artikel];
  const ohnePreis = (a) => a.vkNetto === null || a.vkNetto === undefined;
  const nachName = (a, b) => String(a.bezeichnung).localeCompare(String(b.bezeichnung), 'de');

  liste.sort((a, b) => {
    if (ohnePreis(a) !== ohnePreis(b)) return ohnePreis(a) ? 1 : -1;
    if (ohnePreis(a)) return nachName(a, b);
    switch (wie) {
      case 'preis-auf': return a.vkNetto - b.vkNetto || nachName(a, b);
      case 'preis-ab': return b.vkNetto - a.vkNetto || nachName(a, b);
      case 'vorteil': return (vorteil(b) ?? -1) - (vorteil(a) ?? -1) || nachName(a, b);
      default: return nachName(a, b);
    }
  });
  return liste;
}

/** Abstand zum Listenpreis des Lieferanten in Prozent, oder null. */
export function vorteil(a) {
  if (!a?.uvpNetto || !a?.vkNetto || a.amListendeckel) return null;
  return Math.round((1 - a.vkNetto / a.uvpNetto) * 100);
}

/**
 * Grenzt eine Artikelliste ein.
 *
 * Alle Felder sind freiwillig; was fehlt, filtert nicht. Ein Filter, der bei
 * fehlender Angabe alles wegwirft, ist die unangenehmste Art, einen leeren
 * Shop zu bauen.
 */
export function filtere(artikel, f = {}) {
  return artikel.filter((a) => {
    if (f.gruppe && a.gruppe !== f.gruppe) return false;
    if (f.suchtauglich && vorteil(a) === null) return false;
    if (f.ohneSperrgut && a.sperrgut) return false;
    if (typeof f.preisBis === 'number' && (a.vkNetto === null || a.vkNetto > f.preisBis)) return false;
    if (typeof f.preisAb === 'number' && (a.vkNetto === null || a.vkNetto < f.preisAb)) return false;
    return true;
  });
}

/** Die Filterwerte, die im Bestand überhaupt vorkommen — für die Oberfläche. */
export function filterwerte(artikel) {
  const preise = artikel.map((a) => a.vkNetto).filter((p) => typeof p === 'number');
  return {
    gruppen: [...new Set(artikel.map((a) => a.gruppe))].sort((a, b) => a.localeCompare(b, 'de')),
    preisMin: preise.length ? Math.min(...preise) : null,
    preisMax: preise.length ? Math.max(...preise) : null,
    mitSperrgut: artikel.some((a) => a.sperrgut),
  };
}

/* ------------------------------------------------------------------ *
 * Warenkorb
 * ------------------------------------------------------------------ */

export const KORBSCHLUESSEL = 'freudenthaler-shop-warenkorb-v1';

/**
 * Liest den Warenkorb aus dem Browserspeicher.
 *
 * Jeder Zugriff steht in try/catch: In einem privaten Fenster, bei
 * gesperrten Seitendaten oder beim Erzeugen einer Vorschau wirft schon der
 * Zugriff auf `localStorage`. Ein Shop, der deshalb weiß bleibt, ist
 * schlimmer als einer, der den Korb vergisst.
 *
 * Fremde oder beschädigte Inhalte werden **verworfen, nicht repariert**:
 * Wer eine kaputte Menge auf 1 setzt, verkauft dem Kunden etwas, das er nicht
 * bestellt hat.
 */
export function ladeKorb(speicher) {
  try {
    const roh = speicher?.getItem(KORBSCHLUESSEL);
    if (!roh) return [];
    const daten = JSON.parse(roh);
    if (!Array.isArray(daten)) return [];
    return daten
      .filter((z) => z && typeof z.sku === 'string' && istMenge(z.menge))
      .map((z) => ({ sku: z.sku, menge: Math.min(z.menge, 999) }));
  } catch {
    return [];
  }
}

/** Schreibt den Warenkorb. Gibt zurück, ob es geklappt hat. */
export function speichereKorb(speicher, zeilen) {
  try {
    speicher?.setItem(KORBSCHLUESSEL, JSON.stringify(zeilen));
    return true;
  } catch {
    return false;
  }
}

/**
 * Legt einen Artikel in den Korb oder erhöht die Menge.
 *
 * Reine Funktion — sie ändert die übergebene Liste nicht. Der Aufrufer
 * entscheidet, ob und wann gespeichert wird.
 */
export function legeInKorb(zeilen, sku, menge = 1) {
  if (typeof sku !== 'string' || !sku) throw new Error('Artikelnummer fehlt');
  if (!istMenge(menge)) throw new Error(`Ungültige Menge: ${menge}`);
  const neu = zeilen.map((z) => ({ ...z }));
  const treffer = neu.find((z) => z.sku === sku);
  if (treffer) treffer.menge = Math.min(Math.round((treffer.menge + menge) * 100) / 100, 999);
  else neu.push({ sku, menge: Math.min(menge, 999) });
  return neu;
}

/** Setzt eine Menge. Menge 0 entfernt die Zeile. */
export function setzeMenge(zeilen, sku, menge) {
  if (menge !== 0 && !istMenge(menge)) throw new Error(`Ungültige Menge: ${menge}`);
  if (menge === 0) return zeilen.filter((z) => z.sku !== sku);
  return zeilen.map((z) => (z.sku === sku ? { ...z, menge: Math.min(menge, 999) } : { ...z }));
}

/** Stückzahl im Korb — die Zahl neben dem Korbsymbol. */
/**
 * Die Zahl der **Positionen** im Korb — das, was ein Zähler anzeigen darf.
 *
 * **Berichtigt am 29.08.** Hier stand `korbAnzahl`, die Summe aller Mengen.
 * Sie addierte Stück, Quadratmeter und Kilogramm zu einer Zahl, die es nicht
 * gibt; mit ganzen Mengen sah das nach einer Stückzahl aus, seit
 * Gebindemengen zeigte der Zähler in der Kopfleiste „30.25". Eine Summe über
 * verschiedene Einheiten ist keine Menge.
 */
export const korbPositionen = (zeilen) => zeilen.length;

/**
 * Wirft Zeilen weg, die es im Katalog nicht mehr gibt.
 *
 * Ein Warenkorb überlebt im Browser jede Katalogänderung. Wer das nicht
 * abfängt, bekommt beim Rechnen einen Fehler — `berechneWarenkorb()` wirft
 * bei unbekannter Artikelnummer, und zwar zu Recht. Was wegfällt, wird
 * **zurückgegeben und genannt**, nicht stillschweigend entfernt.
 */
export function bereinige(zeilen, katalogArtikel) {
  const bekannt = new Set(katalogArtikel.map((a) => a.sku));
  const gueltig = zeilen.filter((z) => bekannt.has(z.sku));
  const entfallen = zeilen.filter((z) => !bekannt.has(z.sku)).map((z) => z.sku);
  return { zeilen: gueltig, entfallen };
}

/* ------------------------------------------------------------------ *
 * Die Rechnung, die der Kunde sieht
 * ------------------------------------------------------------------ */

/**
 * Welche Felder eines Lieferanten in die Seite dürfen.
 *
 * **Nicht die ganze Datei.** `lieferanten.json` führt bei den
 * Platzhalterlieferanten `haendlerrabattAufUvp` und `mindestbestellwertNetto`
 * — Konditionen, keine Kundeninformation. Wer den Datensatz als Ganzes
 * einbettet, veröffentlicht sie, und niemand merkt es (siehe
 * `interna-auf-der-kundenseite.md`).
 *
 * Die Frachtsätze dürfen und müssen hinaus: Der Kunde bezahlt sie.
 */
export function oeffentlicherLieferant(l) {
  return {
    id: l.id,
    // **Kein Lieferantenname.** Der Interna-Prüfer hat ihn beim ersten Lauf
    // gemeldet, und die Prüfung, ob er recht hat, fiel zu seinen Gunsten aus:
    // Die Oberfläche zeigt den Namen nirgends, sie braucht ihn also nicht.
    // Was nicht gebraucht wird, wird nicht ausgeliefert — das ist billiger
    // als eine begründete Ausnahme.
    //
    // Vollständig verbergen lässt er sich damit nicht: Die Artikelnummern
    // tragen das Kürzel des Lieferanten (`POS-…`), und die Seiten weisen
    // seine Artikelnummer bewusst aus, damit ein Kunde nachbestellen kann.
    // **Geheim ist nicht die Geschäftsbeziehung, geheim sind die
    // Konditionen.** Diese Zeile schützt die zweite.
    lieferzeitWerktage: l.lieferzeitWerktage ?? null,
    fracht: {
      pauschaleNetto: l.fracht?.pauschaleNetto ?? 0,
      sperrgutZuschlagNetto: l.fracht?.sperrgutZuschlagNetto ?? 0,
      // Die Frei-Haus-Schwelle misst am **Bestellwert**, also am Einkauf.
      // Der Browser kennt keine Einkaufspreise und kann sie deshalb nicht
      // prüfen. Statt sie zu verschweigen, wird sie als offen gemeldet.
      freiHausAbNetto: l.fracht?.freiHausAbNetto ?? null,
    },
  };
}

/** Ein Artikel, so wie er in der Seite stehen darf. */
export function oeffentlicherArtikel(a) {
  return {
    sku: a.sku,
    bezeichnung: a.bezeichnung,
    gruppe: a.gruppe,
    einheit: a.einheit,
    lieferantId: a.lieferantId,
    sperrgut: !!a.sperrgut,
    vkNetto: a.vkNetto ?? null,
    vkBrutto: a.vkBrutto ?? null,
    uvpNetto: a.uvpNetto ?? null,
    amListendeckel: !!a.amListendeckel,
    preisStand: a.preisStand ?? null,
    lieferantenArtikelnummer: a.lieferantenArtikelnummer ?? null,
    // Das Gewicht steht nur dort, wo es aus einem Beleg mit bestandener
    // Gewichtssumme stammt. `null` heißt **unbekannt**, nicht „leicht".
    gewichtKg: typeof a.gewichtKg === 'number' ? a.gewichtKg : null,
  };
}

const runde = (n) => Math.round(n * 100) / 100;

/**
 * Rechnet den Warenkorb aus Kundensicht.
 *
 * **Warum es diese zweite Funktion gibt**, obwohl `berechneWarenkorb()` im
 * Rechenkern steht und die Regel lautet, nichts nachzubauen: Jene Funktion
 * braucht Einkaufspreise — für den Bestellwert, die Frei-Haus-Schwelle und
 * den Mindestbestellwert. Einkaufspreise dürfen nicht in die Seite. Es ist
 * also keine zweite Rechnung derselben Sache, sondern **dieselbe Rechnung mit
 * weniger Wissen**.
 *
 * Damit daraus keine zweite Wahrheit wird, hält ein Testfall beide
 * aneinander: Für denselben Korb müssen Warenwert, Fracht und Gesamtsumme
 * übereinstimmen. Weicht eine Zahl ab, schlägt der Test fehl — dieselbe
 * Bauart wie die Probe zwischen `ZAHLUNGSBEDINGUNGEN` und `zahlung.js`.
 *
 * Was diese Funktion **nicht** kann, sagt sie im Feld `offen`.
 */
export function kundenWarenkorb(zeilen, { artikel, lieferanten }, ust = 0.2) {
  const nachId = new Map(artikel.map((a) => [a.sku, a]));
  const lieferantById = new Map(lieferanten.map((l) => [l.id, l]));
  const gruppen = new Map();
  const offen = [];

  for (const z of zeilen) {
    const a = nachId.get(z.sku);
    if (!a) throw new Error(`Unbekannte Artikelnummer: ${z.sku}`);
    if (a.vkNetto === null) throw new Error(`Artikel ohne Preis: ${z.sku}`);
    if (!istMenge(z.menge)) throw new Error(`Ungültige Menge für ${z.sku}`);
    if (!gruppen.has(a.lieferantId)) gruppen.set(a.lieferantId, []);
    gruppen.get(a.lieferantId).push({ ...a, menge: z.menge, zeilensummeNetto: runde(a.vkNetto * z.menge) });
  }

  const teillieferungen = [];
  for (const [lieferantId, positionen] of [...gruppen].sort((a, b) => a[0].localeCompare(b[0]))) {
    const l = lieferantById.get(lieferantId);
    if (!l) throw new Error(`Unbekannter Lieferant: ${lieferantId}`);
    const warenwertNetto = runde(positionen.reduce((s, p) => s + p.zeilensummeNetto, 0));
    const sperrgutPositionen = positionen.filter((p) => p.sperrgut).length;
    const frachtNetto = runde(l.fracht.pauschaleNetto + sperrgutPositionen * l.fracht.sperrgutZuschlagNetto);

    if (l.fracht.freiHausAbNetto !== null) {
      offen.push(`Eine Frei-Haus-Schwelle ab ${l.fracht.freiHausAbNetto} € misst am Bestellwert `
        + 'und lässt sich hier nicht prüfen — die Fracht kann entfallen.');
    }

    teillieferungen.push({
      lieferantId,
      lieferzeitWerktage: l.lieferzeitWerktage,
      positionen,
      warenwertNetto,
      frachtNetto,
      frachtGrund: sperrgutPositionen > 0
        ? `Pauschale plus ${sperrgutPositionen}× Sperrgutzuschlag`
        : 'Pauschale',
      sperrgutPositionen,
    });
  }

  // Das Gewicht der Bestellung, soweit es bekannt ist — und wie viele
  // Positionen es nicht sind. Eine Summe über Artikel mit unbekanntem
  // Gewicht wäre eine Untergrenze, die wie eine Summe aussieht.
  let gewichtKg = 0;
  let ohneGewicht = 0;
  for (const t of teillieferungen) {
    for (const p of t.positionen) {
      if (typeof p.gewichtKg === 'number') gewichtKg += p.gewichtKg * p.menge;
      else ohneGewicht += 1;
    }
  }

  const warenwertNetto = runde(teillieferungen.reduce((s, t) => s + t.warenwertNetto, 0));
  const frachtNetto = runde(teillieferungen.reduce((s, t) => s + t.frachtNetto, 0));
  const nettoGesamt = runde(warenwertNetto + frachtNetto);
  const ustBetrag = runde(nettoGesamt * ust);

  return {
    teillieferungen,
    positionen: teillieferungen.reduce((n, t) => n + t.positionen.length, 0),
    warenwertNetto,
    frachtNetto,
    gewichtKg: runde(gewichtKg),
    positionenOhneGewicht: ohneGewicht,
    nettoGesamt,
    ustBetrag,
    bruttoGesamt: runde(nettoGesamt + ustBetrag),
    offen,
  };
}
