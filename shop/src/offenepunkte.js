/**
 * Alles, was offen ist — an einer Stelle und aus den Werkzeugen gezogen.
 *
 * ## Warum es das braucht
 *
 * Am 1. September verteilten sich die offenen Punkte über ein Dutzend
 * Dokumente: vier in `startklar`, drei in der Lückenliste des Feeds, einer im
 * Preisalter, drei Fragen an den Lieferanten in drei verschiedenen Befunden,
 * dazu Weisungen aus `PARAMETER.md`. `weg-zum-ersten-verkauf.md` führte sieben
 * — vom 31. August, und schon überholt: Die Domain war entschieden, drei neue
 * Punkte waren dazugekommen.
 *
 * **Eine Liste, die von Hand fortgeschrieben wird, ist an dem Tag falsch, an
 * dem jemand einen Punkt schließt und die Liste nicht anfasst.** Deshalb
 * dieselbe Bauart wie überall hier: Was ein Werkzeug weiß, wird gefragt; was
 * keines weiß, steht hier **mit dem Grund**, warum keines es weiß.
 *
 * ## Die Ordnung
 *
 * Nicht nach Wichtigkeit — die ist Ansichtssache —, sondern danach, **wer
 * handeln muss und was es kostet**. Das ist die Frage, die der Auftraggeber
 * beim Lesen tatsächlich hat.
 */

import { hubbefund } from './huebe.js';
import { palettenkreis } from './palettenkreis.js';
import { EUR } from './format.js';

/**
 * Wer den Punkt schließen kann, und was das auslöst.
 *
 * `rang` bestimmt die Reihenfolge der Abschnitte: erst was nichts kostet und
 * vorliegt, dann die eine Anfrage, die mehrere Punkte auf einmal löst, dann
 * das Geld, zuletzt was mir selbst gehört.
 */
export const ZUSTAENDIGKEITEN = Object.freeze({
  eintragen: { rang: 1, titel: 'Liegt vor, fehlt nur in der Datei', kostet: 'nichts' },
  anfrage: { rang: 2, titel: 'Anfrage an Dritte — freigabepflichtig', kostet: 'nichts, aber eine Freigabe' },
  ausgabe: { rang: 3, titel: 'Kostet Geld — freigabepflichtig', kostet: 'Geld' },
  entscheidung: { rang: 4, titel: 'Entscheidung des Auftraggebers', kostet: 'nichts' },
  werkzeug: { rang: 5, titel: 'Meine Arbeit', kostet: 'nichts' },
});

/**
 * Punkte, die **kein Werkzeug** kennt — mit dem Grund, warum nicht.
 *
 * Der Grund steht dabei, damit die Liste nicht heimlich wächst: Wer hier
 * etwas einträgt, das ein Werkzeug messen könnte, soll beim Schreiben des
 * Grundes merken, dass er keinen hat.
 */
export const OHNE_WERKZEUG = Object.freeze([
  {
    id: 'preisrhythmus',
    titel: 'Preisrhythmus des Lieferanten',
    zustaendig: 'anfrage',
    // **Grund berichtigt am 3. September.** Er lautete: „Aus fünfzehn
    // Rechnungen nicht ableitbar — sie zeigen, wann wir gekauft haben, nicht,
    // wann er die Liste ändert." Das stimmt für den **Rhythmus** und nicht für
    // die **Beobachtung**: Wo derselbe Artikel an zwei Tagen auf einer
    // Rechnung steht, ist ablesbar, ob sich sein Preis bewegt hat.
    // `npm run preiswechsel` misst es.
    warumKeinWerkzeug: 'Der Rhythmus steht in keiner Rechnung — sie zeigen, wann wir gekauft '
      + 'haben. Gemessen war immerhin das Gegenstück: `npm run preiswechsel` fand am '
      + '30. August in acht mehrfach gekauften Artikeln über bis zu 32 Tage keinen einzigen '
      + 'Preiswechsel. Seit dem 8. September misst es nichts mehr — die Rechnungspositionen '
      + 'sind verloren, und das Werkzeug weigert sich, statt über nichts grün zu melden. Die '
      + 'Beobachtung bleibt, was sie war, und ersetzt die Auskunft nicht: beobachtet sind '
      + '32 Tage, gesetzt ist eine Grenze von 90.',
    loest: 'Entscheidet, ob die 90-Tage-Grenze der Preisalterprüfung die richtige ist (gesetzt, nicht gemessen).',
  },
  {
    // **Neu am 6. September 2026.** Fünf Stellen sagten dem Kunden, er könne
    // selbst abholen — eine davon nannte den Betriebssitz. Der Shop ist ein
    // reines Streckengeschäft ohne eigenes Lager; dort liegt nie Ware. Belegt
    // ist nur, dass **wir** am Lager Mauthausen abholen (elf von fünfzehn
    // Rechnungen). Ob unsere Kunden das dürfen, hat nie jemand gefragt.
    id: 'abholung-durch-kunden',
    titel: 'Abholung durch unsere Kunden an Ihrem Lager',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Es steht in keiner Rechnung: Die elf Belege mit „Abholung Kunde" belegen '
      + 'unsere eigene Abholung, nicht die eines Dritten auf unsere Rechnung. Aus einem '
      + 'Ja für uns folgt kein Ja für einen fremden Lkw an der Rampe.',
    loest: 'Entscheidet, ob der Shop Abholung wieder zusagen darf — und ob es unterhalb des '
      + 'Mindestbestellwerts überhaupt einen Weg gibt. Gate 28 hat sie bis dahin zurückgenommen.',
  },
  {
    /*
     * **Der 8. September.** Die Arbeitsumgebung wurde neu aufgesetzt, und
     * `preise/baustoff-preise.json` war weg — zu Recht gitignoriert, und
     * damit in genau einer Kopie. Zurückgeholt sind alle 46 Werte; was fehlt,
     * ist der Beleg dahinter.
     */
    id: 'einkaufspreise-belegen',
    titel: 'Einkaufspreise wieder belegen (46 sind zurückgerechnet)',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Der Beleg ist die Lieferantenrechnung, und die liegt nicht in dieser '
      + 'Umgebung. Zurückgerechnet stimmen die Zahlen auf den Cent — 44 aus Verkaufspreis '
      + 'und Zielmarge, zwei aus dem Befund vom 30.08. Ein Wert, der stimmt, ist noch kein '
      + 'Wert, der belegt ist (Gate 30). Verloren ist außerdem '
      + '`preise/poschacher-positionen.csv`; sie lässt sich aus nichts zurückrechnen, und '
      + '`npm run preiswechsel` misst seither nichts.',
    loest: 'Setzt `ekQuelle` wieder auf „bestaetigt" und macht den Preisrhythmus wieder '
      + 'messbar. Und: Die Datei gehört an einen zweiten Ort — sie ist die einzige '
      + 'Zahlengrundlage dieses Vorhabens und war bis zum 08.09. nirgends gesichert.',
  },
  {
    id: 'liefergebiet-lieferant',
    titel: 'Liefergebiet des Lieferanten',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Die Frachtpauschale staffelt nicht nach Entfernung; aus den Belegen ist keine '
      + 'Grenze ablesbar und keine ausschließbar.',
    loest: 'Bestätigt oder widerlegt Gate 23 — heute gilt die vorsichtige Fläche der Kampagne.',
  },
  {
    id: 'ueberschrift-startseite',
    titel: 'Die Überschrift der Startseite wählen',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Der Auftraggeber hat am 3. September angeordnet, „Baustoffe zum '
      + 'Baumeisterpreis" solle nicht bleiben. Drei Fassungen liegen seither vor, mit je einer '
      + 'anderen Aussage — Liefergebiet, Preis, Zielgruppe. Welche davon oben steht, ist keine '
      + 'Messung, sondern die erste Zeile, die ein Kunde liest, und sie gehört dem '
      + 'Auftraggeber. Umgesetzt wird keine, bis er wählt.',
    loest: 'Führt eine Weisung aus, die acht Tage lang weder erfüllt noch geführt war: Bis zum '
      + '11. September stand sie in keiner Zeile der Weisungstafel und in keiner Liste offener '
      + 'Punkte, und die `<h1>` trug genau den Satz, der nicht bleiben soll. Alle vier Orte '
      + 'derselben Formulierung — Überschrift, Seitentitel, erste Zeile von `llms.txt` und die '
      + 'Kurzbeschreibung — kommen aus einer Stelle in `bin/website.mjs` und wandern gemeinsam '
      + 'mit. Empfohlen ist Fassung A („wir liefern hierher"), weil das Liefergebiet die '
      + 'einzige der drei Aussagen ist, die ein Besucher nirgends sonst herausfindet.',
  },
  {
    /*
     * **Neu am 11. September, aus Gate 35.** Das Empfangsskript nimmt seit
     * heute nur von der eigenen Seite an und höchstens fünf Bestellungen je
     * Minute. Beides ohne eine einzige neue Angabe über den Besucher — und
     * beides hilft nicht gegen eine **langsame** Flut: Wer alle zwölf Sekunden
     * eine Bestellung schickt, bleibt unter der Grenze und füllt die Ablage
     * trotzdem.
     *
     * Ein offener Punkt, der eine getroffene Entscheidung trägt, gehört
     * aufgeschrieben; sonst steht die Entscheidung da, als wäre sie
     * vollständig.
     */
    /*
     * **Neu am 11. September, aus Gate 36.** Vier Sicherheitskopfzeilen gehen
     * seit heute mit; die bekannteste fehlt und wird auch nicht kommen,
     * solange niemand das Zertifikat gesehen hat.
     */
    id: 'hsts',
    titel: 'HSTS für bauversand.com entscheiden',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'HSTS ist ein Versprechen an den Browser, das sich für die Dauer seiner '
      + '`max-age` nicht zurücknehmen lässt: Wer es setzt und danach kein gültiges Zertifikat '
      + 'hat, sperrt seine eigenen Kunden aus — und kann es nicht rückgängig machen. Ob '
      + 'bauversand.com über HTTPS erreichbar ist, lässt sich von hier nicht sehen; der '
      + 'Netzausgang dieser Umgebung ist für die Adresse gesperrt. Eine unumkehrbare Zusage '
      + 'über etwas, das niemand gesehen hat, macht dieser Bestand nicht.',
    loest: 'Schließt die einzige Lücke der vier Kopfzeilen aus Gate 36. Zu tun ist es erst, '
      + 'wenn die Seite steht und das Zertifikat gilt — dann eine Zeile in derselben '
      + '`<IfModule>`-Klammer, in der die anderen vier schon stehen.',
  },
  {
    id: 'flut-je-adresse',
    titel: 'Schutz gegen eine langsame Flut auf den Bestellweg',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Beide möglichen Wege kosten etwas, das dieser Loop nicht entscheiden '
      + 'darf. Eine Zählung **je Adresse** verlangt, die IP des Besuchers zu speichern — ein '
      + 'neuer Zweck, eine neue Angabe auf der Datenschutzseite und ein neues Risiko. Ein '
      + 'fremder Dienst (Captcha, Formularfilter) kostet Geld und macht seinen Anbieter zum '
      + 'Auftragsverarbeiter nach Art. 28 DSGVO. Gate 35 hat deshalb die beiden Sperren '
      + 'gewählt, die nichts davon brauchen.',
    loest: 'Entscheidet, ob die Vorgangsablage (§ 132 BAO, sieben Jahre) auch gegen eine '
      + 'geduldige Flut geschützt wird — heute hält sie fünf Bestellungen je Minute auf und '
      + 'eine alle zwölf Sekunden nicht. Solange keine Bestellung eingeht, kostet das nichts; '
      + 'ab dem ersten geschalteten Anzeigentag steht der Bestellweg offen.',
  },
  {
    // **Neu am 3. September, aus Gate 25.** Der Mindestbestellwert von 250 €
    // deckt zwei Paletten. Ob eine Bestellung dieser Größe eine, zwei oder
    // drei braucht, ist die eine Angabe, die aus der Grenze eine Rechnung
    // machen würde — und sie stand in keinem Register. Ein offener Punkt, der
    // eine getroffene Entscheidung trägt, gehört aufgeschrieben; sonst steht
    // die Entscheidung da, als wäre sie vollständig belegt.
    id: 'palettenzahl',
    titel: 'Paletten je Lieferung — wie viele, und wonach',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Die Palettenzahl hängt an Gewicht und Packmaß; der Katalog führt Gewicht '
      + 'für 7 von 46 Artikeln. Beziffert ist genau ein Fall: Auf der Rechnung über 1.934 € netto '
      + 'stehen sechs Paletten, also rund 322 € Einkauf je Palette. Eine Beobachtung an einem '
      + 'einzigen Beleg, und ausgerechnet bei voluminöser Leichtware (50 m² Fassaden-EPS sind '
      + '96,50 € und eine halbe Palette) kehrt sich das Verhältnis um. Aus einem Punkt lässt '
      + 'sich keine Regel ziehen.',
    /**
     * **Ergänzt am 4. September.** Der Punkt trug bis dahin eine Folge: den
     * Mindestbestellwert. Die zweite ist teurer und steht seither in Euro da —
     * der Shop verrechnet die Kranentladung **je Sperrgut-Position**, der
     * Lieferant **je Hub**, und auf einer eindeutigen Rechnung sind das sechs
     * Positionen gegen drei Hübe.
     *
     * Die Zahlen kommen aus `huebe.js` und nicht aus diesem Satz: Ein Betrag,
     * den ein Dokument von Hand trägt, ist der nächste, der veraltet.
     */
    loest: 'Macht aus dem Mindestbestellwert (Gate 25, 250 €) eine Rechnung statt einer '
      + 'vorsichtigen Grenze — nach oben wie nach unten. Heute deckt die Grenze zwei Paletten, '
      + 'und für alles darüber bleibt Gate 20 die Rückfallebene. '
      + 'Und sie entscheidet die Kranentladung: Der Shop zählt sie je Sperrgut-Position, der '
      + 'Lieferant verrechnet sie je Hub. Auf den zwei belegten Lieferungen liegt das Modell '
      + `um bis zu ${EUR(hubbefund().groesstesZuViel)} zu hoch und um bis zu `
      + `${EUR(hubbefund().groesstesZuWenig)} zu niedrig — auf jeder einzelnen, nicht im Mittel. `
      + `Und sie beziffert die Nebenkosten: Eine Palette kostet nicht ihr Pfand, sondern `
      + `${EUR(palettenkreis().differenzJePalette)} Differenz plus die Rückführungsfahrt — `
      + `zusammen ${EUR(palettenkreis().jePaletteMitFahrt)} je Palette, einmal belegt.`,
  },
  {
    id: 'artikelliste',
    titel: 'Artikelliste aus dem Kundenkonto, mit EAN, Herstellername und Bildverweis',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Die Daten liegen beim Lieferanten. Der Katalog stammt aus fünfzehn Rechnungen; '
      + 'mehr geben sie nicht her.',
    // **Berichtigt am 5. September.** Hier stand, die Artikelliste senke den
    // gemeinsamen Wortanteil der Artikelseiten. Nachgemessen je Abschnitt
    // stimmt das nur für einen von dreien: Der größte Block ist der eigene
    // Lieferabsatz, und den macht keine Lieferantenliste kürzer.
    loest: 'Löst auf einmal: GTIN, Marke und Bild im Feed — und die Weisung, das Sortiment auf '
      + 'mindestens hundert Artikel zu erweitern. Ein Viertes betrifft die Auffindbarkeit, aber '
      + 'kleiner als bisher hier stand: Der Abschnitt „Technische Kennwerte" trägt auf allen 46 '
      + 'Artikelseiten nur sechs verschiedene Fassungen, die größte auf 22 — lauter '
      + 'Platzhaltersätze statt Kennwerten (`npm run pruefe-dubletten`). Der größte gleiche '
      + 'Block der Seiten ist dagegen unser eigener Lieferabsatz und bleibt es auch mit dieser '
      + 'Liste.',
  },
  {
    id: 'suchvolumen',
    titel: 'Suchvolumen der 29 Keywords im Liefergebiet messen',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Die Zahlen liegen bei Google. Der Keyword-Planer ist kostenlos, ein Ads-Konto '
      + 'ohne geschaltete Kampagne kostet nichts.',
    loest: 'Sagt, ob der Klickkanal die geplanten Klicks überhaupt hergibt — sonst dauert der Versuch '
      + 'ein Vielfaches der gerechneten Zeit. Liste: `npm run messliste`.',
  },
  {
    id: 'google-extended',
    titel: 'Nachlesen, was `Google-Extended` beim Anbieter tatsächlich steuert',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Steht in Googles Crawler-Dokumentation, und developers.google.com ist aus '
      + 'dieser Umgebung nicht erreichbar — am 10. September gemessen, zusammen mit '
      + 'platform.openai.com, docs.anthropic.com und commoncrawl.org. Das Register prüft die '
      + 'Absicht und ihre Widerspruchsfreiheit, nicht die Wirkung beim Anbieter.',
    loest: 'Die Kennung steht seit dem 2. September auf „erlaubt", weil für Google keine zweite, '
      + 'reine Suchkennung geführt ist und die Sperre damit den Anbieter ausschloss statt sein '
      + 'Training. Steuert sie in Wahrheit nur das Training, ist die Zeile eine Geschmacksfrage '
      + 'und darf zurück auf „gesperrt" — ein Blick auf eine Seite, keine Ausgabe.',
  },
  {
    id: 'upload',
    titel: 'ausgabe/site/ auf bauversand.com hochladen',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Der Netzausgang dieser Umgebung ist gesperrt; ob die Seite erreichbar ist, '
      + 'lässt sich von hier nicht feststellen. **Vorbereitet ist es seit dem 8. September:** '
      + '`npm run paket` schreibt ein ZIP aus dem gebauten Ordner, mit der Abnahmeliste und '
      + 'einem Inhaltsverzeichnis samt Prüfsummen darin. Hochgeladen wird der Inhalt von '
      + '`site/`, nicht der Ordner selbst.',
    loest: 'Ohne erreichbare Seite kein Klick, keine Auffindbarkeit, keine Anfrage.',
  },
]);

/**
 * Setzt die Liste aus Werkzeugbefunden und den handgeführten Punkten zusammen.
 *
 * @param {object[]} ausWerkzeugen  je Punkt: {id, titel, zustaendig, befund, quelle}
 */
export function offenePunkte(ausWerkzeugen = [], ohneWerkzeug = OHNE_WERKZEUG) {
  const alle = [
    ...ausWerkzeugen.map((p) => ({ ...p, quelle: p.quelle ?? 'Werkzeug' })),
    ...ohneWerkzeug.map((p) => ({
      ...p,
      befund: p.warumKeinWerkzeug,
      quelle: 'von Hand geführt',
    })),
  ];

  const gruppen = new Map();
  for (const p of alle) {
    const z = ZUSTAENDIGKEITEN[p.zustaendig];
    if (!z) throw new Error(`Unbekannte Zuständigkeit „${p.zustaendig}" bei ${p.id}`);
    if (!gruppen.has(p.zustaendig)) gruppen.set(p.zustaendig, []);
    gruppen.get(p.zustaendig).push(p);
  }

  return [...gruppen.entries()]
    .map(([id, punkte]) => ({ id, ...ZUSTAENDIGKEITEN[id], punkte }))
    .sort((a, b) => a.rang - b.rang);
}
