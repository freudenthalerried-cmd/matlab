/**
 * Die Zahl, die ein Assistent zitieren kann.
 *
 * **Der Anlass, 22. Oktober 2026.** Was ein Mensch einen Assistenten fragt,
 * ist nicht „was kostet POS-10837", sondern **„was kostet ein Kaminzug"** oder
 * „was brauche ich für 100 m² Fassadendämmung". Dieser Shop hat für genau
 * diese Fragen vier Systemlisten, und sie standen in `llms.txt` so da:
 *
 * ```
 * - [Kaminzug — die Liste für einen Zug](…): Welche Teile muss ich für einen
 *   einzügigen Systemkamin bestellen?
 * ```
 *
 * Die Frage, und keine Zahl. Ein Assistent, der darauf stößt, müsste die Seite
 * laden, zehn Positionen einzeln nachsehen, Mengen aus „Gesamthöhe ÷
 * Steinhöhe" herleiten und selbst rechnen — das tut keiner in einer Antwort.
 *
 * > **Eine Liste, die ihre Frage nennt und ihre Summe nicht, beantwortet die
 * > Frage nicht.**
 *
 * ## Woher die Mengen kommen — und woher nicht
 *
 * **Nicht aus einer Annahme über das Bauwerk.** Die Systemliste sagt
 * ausdrücklich, dass Mantelsteine aus der Gesamthöhe folgen und die Steinhöhe
 * in den Systemunterlagen des Herstellers steht; dieser Shop schreibt
 * technische Kennwerte nicht ab. Eine Beispielrechnung mit geratener
 * Steinhöhe wäre eine geratene Stückliste — und die Seite warnt selbst davor:
 * *„eine geratene Kaminstückliste ist die teuerste Art, Material zu
 * bestellen."*
 *
 * **Sondern aus den Referenzwarenkörben**, die `bin/kampagne.mjs` seit dem
 * 28. August führt. Sie tragen je Gruppe eine Zusammenstellung mit Mengen und
 * einem Umfang („100 m² Wärmedämmverbundsystem"), jede ausgelassene Position
 * mit einem Grund, und `npm run pruefe-koerbe` hält sie gegen die
 * Systemlisten — in beide Richtungen.
 *
 * > **Die Zahl, die ein Assistent braucht, lag seit Wochen gerechnet in einer
 * > Datei, die nie online geht.**
 *
 * Gerechnet wird mit `berechneWarenkorb`, also mit demselben Kern wie der
 * Warenkorb des Shops. Der Grund steht in `bin/kampagne.mjs` und gilt hier
 * genauso: *Zwei Wege zu derselben Zahl bedeuten, dass einer davon irgendwann
 * alt ist — und es ist immer der, den man beim Ändern vergisst.*
 *
 * ## Was ausdrücklich nicht hinausgeht
 *
 * Neben dem Warenwert steht in derselben Zeile der Kampagnendatei der
 * **Deckungsbeitrag**. Er ist die Marge, und die Weisung des Auftraggebers
 * dazu ist kurz: *„keine spanne ausgeben."* Dieses Modul gibt ihn deshalb
 * nicht zurück — und `rechnungsbefund` hält das nach, damit die Zusicherung
 * nicht an meiner Aufmerksamkeit hängt, sondern an einer Prüfung.
 */

import { berechneWarenkorb } from './warenkorb.js';
import { cent, textZeile } from './format.js';
import { preisstandSpanne } from './preisalter.js';

/**
 * Der Umfang samt der Sachen, die drin sind.
 *
 * Dieselbe Rechnung wie `warenkorbText` in `bin/kampagne.mjs` — und
 * ausdrücklich **nicht** dieselbe Funktion: Die liegt in einem Werkzeug und
 * nicht in einem Modul, und `bin/website.mjs` würde damit ein Werkzeug
 * importieren, das beim Laden eine Kampagne rechnet. Dass beide gleich
 * aussehen, hält `test/beispielrechnung.test.js` gegen die Körbe des
 * Bestands; auseinanderlaufen können sie damit nicht still.
 */
function umfangstext(korb) {
  const teile = korb.positionen.map((p) => p.was).filter(Boolean);
  if (teile.length !== korb.positionen.length) return korb.umfang;
  return teile.length === 1 ? `${korb.umfang} ${teile[0]}` : `${korb.umfang}: ${teile.join(', ')}`;
}

/**
 * Welche Systemliste zu welchem Referenzwarenkorb gehört.
 *
 * Von Hand geführt und maschinell gehalten: `rechnungsbefund` verlangt, dass
 * jede Zuordnung auf eine Systemliste **und** einen Korb zeigt, die es gibt.
 * Eine Liste ohne Korb ist kein Fehler — sie bekommt keine Rechnung und sagt
 * das; ein Korb ohne Liste wäre einer, denn dann rechnet der Betrieb etwas,
 * das er nirgends erklärt.
 */
export const ZUORDNUNG = Object.freeze([
  Object.freeze({ slug: 'fassade-100-qm', gruppe: 'WDVS' }),
  Object.freeze({ slug: 'kellerwand-perimeter', gruppe: 'Dämmung' }),
  Object.freeze({ slug: 'kaminzug', gruppe: 'Kamin' }),
  Object.freeze({ slug: 'kanal-dn100', gruppe: 'Kanal' }),
]);

/**
 * Referenzwarenkörbe, die **keine** veröffentlichte Rechnung bekommen — mit Grund.
 *
 * Nicht jeder Korb ist ein Vorhaben. Zwei von sechs tragen eine Menge einer
 * einzigen Ware („40 Sack Mörtel", „128 Stück Hochlochziegel") und gehören zu
 * einer Anzeigengruppe, nicht zu einer Frage, die jemand stellt. Für ein Gebot
 * reicht das; für eine Antwort auf „was kostet das" ist es keine, denn der
 * Artikelpreis steht ohnehin auf seiner Seite.
 *
 * Die Liste steht hier, weil die Gegenrichtung sonst nicht prüfbar wäre: Ohne
 * sie müsste `rechnungsbefund` jeden Korb ohne Systemliste durchlassen — und
 * dann fiele ein neuer Korb, der sehr wohl eine Erklärung bräuchte, nicht mehr
 * auf.
 */
export const OHNE_RECHNUNG = Object.freeze([
  Object.freeze({
    gruppe: 'Mörtel',
    warum: 'Der Korb trägt vierzig Säcke einer einzigen Ware und ist der Gebotskorb der '
      + 'Anzeigengruppe „Mörtel und Putze". Eine Systemliste dazu gibt es nicht, weil es keine '
      + 'Zusammenstellung ist: Wer Mörtel braucht, braucht Mörtel, und was ein Sack kostet, '
      + 'steht auf der Artikelseite. Eine veröffentlichte Rechnung über vierzig Säcke '
      + 'beantwortete keine Frage, sondern multiplizierte eine Zahl, die schon dasteht.',
  }),
  Object.freeze({
    gruppe: 'Mauerwerk',
    warum: 'Dasselbe wie beim Mörtel, mit 128 Hochlochziegeln: ein Gebotskorb und kein '
      + 'Vorhaben. Die Stückzahl folgt aus der Palette des Lieferanten und nicht aus einer '
      + 'Wand — eine Wand hätte eine Fläche, eine Dicke und einen Verband, und keine dieser '
      + 'drei Angaben kennt dieser Korb. Was ein Ziegel kostet, steht auf seiner Artikelseite.',
  }),
]);

/**
 * Baut die veröffentlichbare Rechnung zu einem Referenzwarenkorb.
 *
 * @param {object} korb       Ein Eintrag aus WARENKOERBE
 * @param {object} katalog    Der geladene Katalog
 * @returns {object|null}     Die Rechnung, oder null wenn sie nicht steht
 */
export function beispielrechnung(korb, katalog) {
  if (!korb?.positionen?.length) return null;
  const jeSku = new Map(katalog.artikel.map((a) => [a.sku, a]));

  /*
   * **Eine Rechnung, in der eine Position fehlt, wird nicht gebaut.** Sie
   * sähe aus wie eine Summe für den genannten Umfang und wäre eine für einen
   * kleineren — der teuerste Fehler, den eine Preisauskunft machen kann.
   */
  const fehlend = korb.positionen.filter((p) => {
    const a = jeSku.get(p.sku);
    return !a || a.vkNetto === null || a.vkNetto === undefined;
  });
  if (fehlend.length) {
    return {
      slug: null,
      steht: false,
      grund: `${fehlend.length} Position(en) ohne gerechneten Preis: `
        + fehlend.map((p) => p.sku).join(', '),
    };
  }

  const warenkorb = berechneWarenkorb(korb.positionen, katalog);
  const positionen = korb.positionen.map((p) => {
    const a = jeSku.get(p.sku);
    const zeile = warenkorb.zeilen?.find((z) => z.sku === p.sku);
    return {
      sku: p.sku,
      bezeichnung: a.bezeichnung,
      was: p.was,
      position: p.position,
      menge: zeile?.menge ?? p.menge,
      einheit: a.einheit,
      einzelNetto: a.vkNetto,
      betragNetto: cent((zeile?.menge ?? p.menge) * a.vkNetto),
    };
  });

  /*
   * **Der Umfang nennt die Positionen, nicht das Vorhaben — und das ist die
   * wichtigste Zeile dieses Moduls.**
   *
   * Gemessen am 22. Oktober mit `npm run pruefe-koerbe`: **Kein einziger Korb
   * deckt die geführten Positionen seiner Systemliste.** WDVS fünf von neun,
   * Kamin zwei von neun, Dämmung eine von vier. Die Körbe sind
   * Gebotskörbe — sie lassen aus, was sich aus dem Umfang nicht rechnen lässt
   * (Mengen nach Verbrauch, und der Verbrauchswert steht im Merkblatt des
   * Herstellers), und seit dem 15. Oktober auch, was auf einem zu alten
   * Einkaufspreis steht.
   *
   * > **„Ein Kaminzug: 1.236,71 €" bei zwei von zehn Positionen ist der Preis
   * > für einen halben Kamin.**
   *
   * Übernommen wird deshalb `warenkorbText`, der den Umfang **und** die
   * enthaltenen Sachen nennt: „Ein Kaminzug: Mantelsteine, gedämmtes Rohr".
   * Wer nur die erste Hälfte zitiert, zitiert keinen vollständigen Satz —
   * und der Grund je ausgelassener Position steht daneben.
   */
  return {
    steht: true,
    grund: null,
    umfang: umfangstext(korb),
    positionen,
    /*
     * **`ohne` wandert mit.** Die Gründe sind der Teil, der eine
     * Beispielrechnung von einem Angebot unterscheidet: Vier Kaminpositionen
     * stehen seit dem 15. Oktober nicht im Korb, weil ihr Einkaufspreis über
     * der eigenen Neunzig-Tage-Grenze liegt und auf einem solchen Preis kein
     * Gebot ruhen darf. Eine Summe, die das verschweigt, nennt den Preis für
     * einen halben Kamin.
     */
    /*
     * **Zwei Texte je Eintrag, und hier geht nur einer hinaus.**
     *
     * Der erste Anlauf reichte `warum` durch — den Grund, der für
     * `pruefe-koerbe` geschrieben ist. `findeInterna` brach den Bau ab: Sechs
     * dieser Gründe nennen den **Einkaufspreis** („ist vom 25. Juni und damit
     * 112 Tage alt"), und das ist eine Entscheidung über Konditionen.
     *
     * > **Ein Grund, der für einen internen Prüfer geschrieben ist, gehört
     * > nicht auf eine Kundenseite.**
     *
     * Dieselbe Lehre wie am 13. September bei den acht Bestellfeldgründen, die
     * Gate-Nummern und Paragraphen nannten: zwei Texte je Eintrag, nicht einer.
     * `kunde` sagt dem Besteller, was er wissen muss — welche Menge folgt,
     * woraus, und warum die Position hier nicht steht — ohne eine Zahl aus dem
     * Einkauf.
     */
    ausgelassen: (korb.ohne ?? [])
      .map((o) => ({ position: o.position, kunde: o.kunde ?? null })),
    warenwertNetto: warenkorb.warenwertNetto,
    frachtNetto: warenkorb.frachtNetto,
    summeNetto: cent(warenkorb.warenwertNetto + warenkorb.frachtNetto),
    /*
     * **Der Preisstand der Rechnung — nachgetragen am 22. Oktober 2026.**
     *
     * Die Summe stand zuerst ohne ihn da, während jede Artikelseite ihren
     * nennt. Gefunden hat das `pruefe-seiten`: *„Zahl ohne Quelle: 100 m² —
     * jede Zahl braucht Herkunft und Stand."* Der Prüfer meinte die
     * Umfangsangabe, und richtig ist beides — eine Summe ohne Preisstand ist
     * eine Zahl ohne Zeitpunkt.
     *
     * Gerechnet wird die **Spanne** und nicht das Maximum. Der Grund steht in
     * `src/preisalter.js` und ist dort teuer bezahlt: Das Maximum behauptete
     * für einunddreißig Artikel eine Frische, die sie nicht haben, und zwar
     * in der Richtung, die den Shop besser aussehen lässt.
     */
    preisstand: preisstandSpanne(korb.positionen.map((p) => jeSku.get(p.sku))),
  };
}

/**
 * Der Satz über die Rechnung, in einer Zeile — für `llms.txt`.
 *
 * Er nennt **vier** Dinge und in dieser Reihenfolge: den Umfang, die Summe,
 * die Zahl der Positionen und was fehlt. Ein Assistent, der nur den Anfang
 * zitiert, zitiert damit immer noch etwas Richtiges; wer den Umfang
 * weglässt, hätte eine Zahl ohne ihren Gegenstand.
 */
export function rechnungssatz(r, geld) {
  if (!r?.steht) return null;
  /*
   * **`textZeile` um den Umfang — und die Probe hat es beim Schreiben
   * gefunden.** Der erste Anlauf setzte ihn roh ein.
   *
   * `llms.txt` ist zeilenorientiert: Ein Umbruch im Umfang zerlegt eine Zeile
   * der Datei in zwei, und die zweite sähe aus wie ein eigener Eintrag mit
   * einer Summe. Derselbe Fall wie beim Satz der Preisspanne eine Woche
   * zuvor, und derselbe wie am 15. September beim Rückwegsatz.
   *
   * > **Ein Prüfer, der beim Schreiben widerspricht, ist mehr wert als zehn,
   * > die beim Nachrechnen bestätigen.**
   */
  const teile = [`${textZeile(r.umfang)}: ${geld(r.summeNetto)} netto`];
  teile.push(`${r.positionen.length} Position${r.positionen.length === 1 ? '' : 'en'}`);
  teile.push(`davon ${geld(r.frachtNetto)} Zustellung`);
  if (r.ausgelassen.length) {
    const eine = r.ausgelassen.length === 1;
    teile.push(`${r.ausgelassen.length} Position${eine ? '' : 'en'} der Systemliste `
      + `${eine ? 'ist' : 'sind'} nicht enthalten und auf der Seite begründet`);
  }
  return `${teile.join(' · ')} — Beispielrechnung für den genannten Umfang, keine Zusage`;
}

/**
 * Wörter, die eine Marge benennen und in keiner veröffentlichten Rechnung stehen.
 *
 * **Und warum diese Liste neben `eigene-marge` in `src/interna.js` steht.**
 * Der erste Gedanke war, sie zu streichen und das etablierte Register zu
 * nutzen — zwei Kopien sind zwei Gelegenheiten, dieselbe Frage unterschiedlich
 * zu beantworten. Gemessen am 22. Oktober 2026: `findeInterna` über eine
 * Rechnung mit dem Feld `"deckungsbeitrag": 245.53` meldet **nichts**. Jenes
 * Muster liest `Deckungsbeitrag` mit großem Anfangsbuchstaben, weil es für
 * Fließtext geschrieben ist; ein Feldname ist klein.
 *
 * > **Dieselbe Lücke wie bei `"lieferantId":"poschacher"` am 15. September:
 * > kleingeschrieben und vom Muster nie gesehen.**
 *
 * Geprüft wird hier deshalb die **Datenstruktur** und nicht der Text, und
 * zwar bevor sie auf eine Seite kommt. Die beiden Listen überschneiden sich
 * im Wortlaut und nicht im Gegenstand.
 */
export const MARGENWOERTER = Object.freeze([
  'deckungsbeitrag', 'marge', 'rohmarge', 'einkaufspreis', 'ekNetto', 'spanne',
]);

/**
 * Hält die Zuordnung gegen Listen und Körbe — und die Rechnung gegen die
 * Weisung „keine spanne ausgeben".
 *
 * @param {object} eingabe
 * @param {string[]} eingabe.slugs      Vorhandene Systemlisten
 * @param {string[]} eingabe.gruppen    Vorhandene Referenzwarenkörbe
 * @param {object[]} eingabe.rechnungen Die gebauten Rechnungen
 * @param {ReadonlyArray<object>} eingabe.zuordnung
 */
export function rechnungsbefund({
  slugs, gruppen, rechnungen, zuordnung = ZUORDNUNG, ohneRechnung = OHNE_RECHNUNG,
}) {
  const probleme = [];
  const hatSlug = new Set(slugs);
  const hatGruppe = new Set(gruppen);

  for (const z of zuordnung) {
    if (!hatSlug.has(z.slug)) {
      probleme.push({
        regel: 'zuordnung-ohne-liste',
        satz: `die Zuordnung nennt die Systemliste „${z.slug}", die es nicht gibt`,
      });
    }
    if (!hatGruppe.has(z.gruppe)) {
      probleme.push({
        regel: 'zuordnung-ohne-korb',
        satz: `die Zuordnung nennt den Referenzwarenkorb „${z.gruppe}", den es nicht gibt`,
      });
    }
  }

  /*
   * **Die Gegenrichtung.** Ein Korb, der gerechnet wird und zu dem keine
   * Systemliste gehört, erklärt nirgends, woher seine Mengen kommen — und
   * eine Menge ohne ihre Begründung ist in diesem Bestand eine geratene
   * Menge.
   */
  const zugeordnet = new Set(zuordnung.map((z) => z.gruppe));
  const begruendet = new Map(ohneRechnung.map((o) => [o.gruppe, o.warum]));
  for (const g of gruppen) {
    if (zugeordnet.has(g)) continue;
    const warum = begruendet.get(g);
    if (!warum) {
      probleme.push({
        regel: 'korb-ohne-liste',
        satz: `der Referenzwarenkorb „${g}" ist keiner Systemliste zugeordnet und steht `
          + 'nicht mit Grund in OHNE_RECHNUNG — seine Mengen stehen dann in keiner '
          + 'Erklärung, und eine Menge ohne Begründung ist eine geratene Menge',
      });
    } else if (warum.length < 150) {
      probleme.push({
        regel: 'verzicht-zu-kurz',
        satz: `der Verzicht auf eine Rechnung für „${g}" nennt ${warum.length} Zeichen `
          + 'Grund — verlangt sind 150',
      });
    }
  }
  /*
   * **Und die Gegenrichtung des Verzichts.** Ein Eintrag in `OHNE_RECHNUNG`,
   * dessen Korb es nicht mehr gibt, ist ein Freibrief ohne Gegenstand — und
   * deckt beim nächsten Korb desselben Namens etwas, das niemand mehr geprüft
   * hat.
   */
  for (const o of ohneRechnung) {
    if (!gruppen.includes(o.gruppe)) {
      probleme.push({
        regel: 'verzicht-ohne-korb',
        satz: `OHNE_RECHNUNG nennt den Referenzwarenkorb „${o.gruppe}", den es nicht gibt`,
      });
    }
    if (zugeordnet.has(o.gruppe)) {
      probleme.push({
        regel: 'verzicht-und-zuordnung',
        satz: `„${o.gruppe}" steht in OHNE_RECHNUNG und in der Zuordnung — eine Gruppe `
          + 'bekommt eine Rechnung oder keine, nicht beides',
      });
    }
  }

  /*
   * **Und die Weisung, die am teuersten wäre.** Neben dem Warenwert steht in
   * der Kampagnendatei der Deckungsbeitrag. „keine spanne ausgeben" ist eine
   * Weisung vom 25. August; sie darf nicht an der Aufmerksamkeit dessen
   * hängen, der die Rechnung baut.
   */
  for (const r of rechnungen) {
    if (!r?.steht) continue;
    const text = JSON.stringify(r).toLowerCase();
    for (const wort of MARGENWOERTER) {
      if (text.includes(wort.toLowerCase())) {
        probleme.push({
          regel: 'rechnung-nennt-marge',
          satz: `die Rechnung zu „${r.umfang}" trägt das Feld oder Wort „${wort}" — `
            + 'eine veröffentlichte Rechnung nennt keine Spanne',
        });
      }
    }
    if (r.summeNetto !== cent(r.warenwertNetto + r.frachtNetto)) {
      probleme.push({
        regel: 'summe-stimmt-nicht',
        satz: `die Rechnung zu „${r.umfang}" nennt ${r.summeNetto} €, `
          + `Warenwert und Fracht ergeben ${cent(r.warenwertNetto + r.frachtNetto)} €`,
      });
    }
    /*
     * **Die Regel, ohne die diese Rechnung irreführend wäre.** Lässt der Korb
     * Positionen aus, darf der Umfang nicht das Vorhaben allein nennen: „Ein
     * Kaminzug" weckt die Erwartung auf einen ganzen Kamin, und die Summe
     * trägt zwei von zehn Positionen. Genannt sein müssen dann die Sachen,
     * die drin sind — jede einzelne.
     */
    for (const o of r.ausgelassen) {
      if (!o.kunde || String(o.kunde).length < 60) {
        probleme.push({
          regel: 'auslassung-ohne-kundensatz',
          satz: `die ausgelassene Position „${o.position}" der Rechnung zu „${r.umfang}" `
            + 'hat keinen Satz für den Kunden — der interne Grund darf nicht hinausgehen, '
            + 'und ohne Satz erfährt der Besteller nicht, ob wir sie nicht führen oder '
            + 'ihre Menge nicht kennen',
        });
      }
    }
    if (r.ausgelassen.length > 0) {
      const ungenannt = r.positionen
        .map((p) => p.was)
        .filter((was) => was && !r.umfang.includes(was));
      if (ungenannt.length) {
        probleme.push({
          regel: 'umfang-nennt-die-positionen-nicht',
          satz: `die Rechnung zu „${r.umfang}" lässt ${r.ausgelassen.length} Position(en) aus `
            + `und nennt ${ungenannt.length} der enthaltenen nicht im Umfang `
            + `(${ungenannt.join(', ')}) — die Summe gilt dann für weniger, als der Umfang sagt`,
        });
      }
    }
    const ausPositionen = cent(r.positionen.reduce((n, p) => n + p.betragNetto, 0));
    if (ausPositionen !== r.warenwertNetto) {
      probleme.push({
        regel: 'positionen-tragen-den-warenwert-nicht',
        satz: `die Rechnung zu „${r.umfang}" nennt ${r.warenwertNetto} € Warenwert, `
          + `ihre Positionen ergeben ${ausPositionen} €`,
      });
    }
  }

  return {
    geprueft: zuordnung.length,
    stehen: rechnungen.filter((r) => r?.steht).length,
    probleme,
    sauber: probleme.length === 0,
  };
}
