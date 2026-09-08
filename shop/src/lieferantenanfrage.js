/**
 * Die Anfrage an den Lieferanten — fünf Fragen, die neun offene Punkte schließen.
 *
 * **Der Anlass, 2. September 2026.** `npm run offenepunkte` führte damals acht Punkte
 * in der Gruppe „Anfrage an Dritte". Sie hängen alle an demselben Gespräch mit
 * demselben Lieferanten, und für dieses Gespräch gab es keinen Text. Was es
 * gab, waren die `anschreiben-entwuerfe.md` vom 9. August — dreizehn
 * Radon-Hersteller, geschrieben zwei Wochen **vor** dem Kurswechsel vom
 * 22. August. `data/lieferanten.json` zeigt bis heute mit `_hinweis` dorthin
 * und nennt sie die Quelle der echten Werte.
 *
 * > **Ein Entwurf für ein abgelöstes Modell ist kein Entwurf, sondern ein
 * > Wegweiser in die falsche Richtung.**
 *
 * Dieselbe Fehlerklasse, vor der `STATUS.md` in seinem eigenen Kopf warnt.
 *
 * **Warum fünf und nicht zwölf.** Wer einem Lieferanten zwölf Fragen schickt,
 * bekommt keine Antwort — jede zusätzliche Frage senkt die Wahrscheinlichkeit
 * aller übrigen. Deshalb steht bei jeder Frage, welche Punkte sie schließt,
 * und `fragenOhnePunkt` meldet jede, die keinen schließt. Eine Frage, die
 * nichts löst, kostet die Antwort auf die, die etwas löst.
 *
 * **Von vier auf fünf am 3. September.** Gate 25 hat einen Mindestbestellwert
 * gesetzt, der auf einer Annahme über die Palettenzahl je Lieferung ruht. Der
 * Punkt stand in keinem Register — und `pruefe-anfrage` hat ihn in derselben
 * Minute gemeldet, in der er eingetragen war: „offener Punkt, den keine Frage
 * schließt." Genau dafür gibt es die beiden Richtungen.
 *
 * **Dieser Text wird hier nicht versendet.** Das Modul erzeugt ihn; das
 * Versenden an Dritte ist und bleibt Sache des Auftraggebers.
 */

import { textZeile } from './format.js';
import { ZAHLWORT, zahlwort } from './format.js';

/**
 * Die Fragen.
 *
 * `schliesst` nennt die Kennungen aus `npm run offenepunkte`. Sie sind der
 * Grund, warum die Frage im Brief steht — und `punkteOhneFrage` hält die
 * Liste gegen die tatsächlich offenen Punkte, damit keiner stillschweigend
 * ungefragt bleibt.
 */
export const FRAGEN = Object.freeze([
  Object.freeze({
    id: 'artikelliste',
    titel: 'Artikelliste aus dem Kundenkonto',
    // **Ergänzt am 8. September, abends.** Dieselbe Datei schließt zwei
    // frisch gemessene Lücken mit: die Systemzugehörigkeit des
    // Mantelsteinklebers (kein Markenname in der Bezeichnung) und die
    // Merkblattadressen der vier Marken, für die keine belegt ist.
    schliesst: Object.freeze(['artikelliste', 'feed:GTIN/EAN', 'feed:Marke', 'feed:Produktbild',
      'preisalter', 'systemzugehoerigkeit', 'merkblattadressen']),
    frage: 'Können Sie uns die Artikelliste unseres Kundenkontos als Datei zur Verfügung '
      + 'stellen — je Artikel Ihre Artikelnummer, die Bezeichnung, die EAN/GTIN, den '
      + 'Hersteller, die Verpackungseinheit und den aktuellen Nettopreis? Ein Verweis auf '
      + 'Produktbild oder Datenblatt, soweit vorhanden, wäre uns viel wert.',
    warum: 'Die eine Frage, die am meisten löst. Der Katalog stammt heute aus fünfzehn '
      + 'Rechnungen; was nie auf einer Rechnung stand, kennt er nicht. Ohne EAN, Marke und '
      + 'Bild wird der Produktfeed nicht teilweise angenommen, sondern abgelehnt — und ohne '
      + 'aktuelle Preise ist der älteste Einstand 133 Tage alt. '
      // **Nachgetragen am 4. September**, nachdem `npm run pruefe-dubletten`
      // die Artikelseiten zum ersten Mal gegeneinander gehalten hat. Bis dahin
      // nannte diese Begründung drei Folgen; die vierte wiegt für den
      // Klickkanal schwerer als die drei anderen, denn auf diese Seiten führt
      // der bezahlte Klick.
      // **Berichtigt am 5. September.** Hier stand „62 % der Wörter stehen
      // wortgleich auf allen 46 … Hersteller, EAN und Bild sind das Einzige,
      // was daran etwas ändert". Nachgemessen je Abschnitt ist der größte
      // gleiche Block der **eigene** Lieferabsatz. Ein Brief an einen Dritten,
      // der seine Bitte mit einer falsch zugeschriebenen Zahl begründet, ist
      // schlechter als einer, der weniger verlangt und richtig rechnet.
      + '**Und eine vierte Folge, gemessen:** Der Abschnitt „Technische Kennwerte" trägt auf '
      + 'allen 46 Artikelseiten nur sechs verschiedene Fassungen, die größte auf 22 — es sind '
      + 'Platzhaltersätze, weil uns kein Merkblatt vorliegt. 20 von 46 Artikeln tragen dieselbe '
      + 'Schemazeichnung wie ein anderer, und bei drei Kaminpaketen ist die Bauform aus dem '
      + 'Namen nicht ablesbar. Hersteller, EAN, Verpackungseinheit und ein Produktbild je '
      + 'Artikel ändern genau das.',
  }),
  Object.freeze({
    id: 'lieferzeit',
    titel: 'Lieferzeit in Werktagen',
    schliesst: Object.freeze(['lieferzeit']),
    frage: 'Mit welcher Lieferzeit in Werktagen ab Bestelleingang dürfen wir rechnen — und '
      + 'unterscheidet sie sich zwischen Lagerware und Streckenware?',
    warum: 'Ohne sie darf keine Auftragsbestätigung hinaus: Der Beleg nennt einen Termin, und '
      + 'einen Termin, den niemand zugesagt hat, sagt dieser Shop nicht zu. Der Rechenkern '
      + 'sperrt die Bestellung von selbst, solange das Feld leer ist.',
  }),
  Object.freeze({
    id: 'preisrhythmus',
    titel: 'Rhythmus der Preisänderungen',
    schliesst: Object.freeze(['preisrhythmus']),
    // **Geschärft am 3. September.** Die Frage lautete nur „In welchem Rhythmus
    // ändern sich Ihre Preise?". Wer eine Frage stellt und dazusagt, was er
    // schon gesehen hat, bekommt eine genauere Antwort — und zeigt, dass er
    // nachgesehen hat.
    frage: 'In welchem Rhythmus ändern sich Ihre Preise, und gibt es feste Termine dafür? '
      + 'Über unsere Belege von April bis August sehen wir bei acht mehrfach gekauften '
      + 'Artikeln keine Änderung; die längste Spanne dazwischen sind 32 Tage.',
    warum: 'Aus fünfzehn Rechnungen nicht ableitbar — sie zeigen, wann wir gekauft haben, nicht, '
      + 'wann die Liste sich ändert. Die 90-Tage-Grenze der Preisalterprüfung ist bis dahin '
      + 'gesetzt und nicht gemessen.',
  }),
  Object.freeze({
    // **Die fünfte, ab 3. September.** Der Kopf dieser Datei sagt, warum es
    // vier waren und nicht zwölf — jede zusätzliche Frage senkt die
    // Wahrscheinlichkeit aller übrigen. Diese hier kostet den Platz trotzdem
    // zu Recht: Gate 25 hat am selben Tag einen Mindestbestellwert von 250 €
    // gesetzt, und der ruht auf einer Annahme über die Palettenzahl. Eine
    // Entscheidung, die auf einer Annahme steht, gehört gefragt.
    //
    // Sie steht bewusst **hinter** der Frachtfrage: Beide betreffen die
    // Lieferung, und wer zwei verwandte Fragen zusammen stellt, stellt
    // eigentlich eine.
    id: 'palettierung',
    titel: 'Paletten je Lieferung',
    schliesst: Object.freeze(['palettenzahl']),
    frage: 'Wonach richtet sich die Zahl der Paletten je Lieferung, und ab welcher Menge '
      + 'kommt eine zweite dazu? Auf unserer Rechnung über 1.934 € netto stehen sechs Paletten '
      + 'zu je 22,00 € plus Folierung — für eine kleinere Bestellung können wir daraus nicht '
      + 'ableiten, womit wir rechnen müssen. '
      // **Ergänzt am 4. September.** Die Frage hing bis dahin nur am
      // Mindestbestellwert. Sie entscheidet auch, was ein Kunde für die
      // Kranentladung zahlt — und dort ist der Betrag beziffert.
      + 'Und dieselbe Angabe brauchen wir für die Kranentladung: Sie steht auf Ihren Belegen '
      + '„pro Hub". Richtet sich ein Hub nach der Palette, oder wonach sonst? '
      // **Ergänzt am 5. September.** Die Frage nach der Zahl der Hübe setzte
      // voraus, dass feststeht, **welche** Ware überhaupt palettiert kommt.
      // Das steht nirgends: Die Einstufung stammt aus der Warengruppe.
      + 'Und die Frage davor, die wir bisher nicht gestellt haben: **Welche Artikel kommen bei '
      + 'Ihnen palettiert?** Wir stufen das heute nach der Warengruppe ein — Dämmung, Kamin, '
      + 'Kanal und Mauerwerk gelten uns als Sperrgut. Auf Ihrem Lieferschein wiegt ein '
      + 'Kanalbogen NW 100 aber 0,285 kg je Stück, und wir haben zwei davon bestellt. Eine '
      + 'Kennzeichnung in der Artikelliste, welche Position palettiert geliefert wird, ersetzt '
      + 'unsere Schätzung.',
    warum: 'Palette und Folierung sind mit 28,50 € je Lieferung die Kosten, die den '
      + 'Mindestbestellwert tragen. Wie viele Paletten eine Bestellung braucht, hängt an '
      + 'Gewicht und Packmaß; der Katalog führt Gewicht für 7 von 46 Artikeln. Die Grenze ist '
      + 'deshalb heute vorsichtig gesetzt und nicht gerechnet. **Und sie entscheidet einen '
      + 'zweiten Betrag:** Der Shop rechnet die Kranentladung je Sperrgut-Position, der '
      + 'Lieferant verrechnet sie je Hub — auf Rechnung 262027463 stehen sechs Positionen und '
      + 'drei Hübe. Auf den zwei belegten Lieferungen liegt das Modell dadurch um bis zu '
      + '22,50 € zu hoch und um bis zu 7,50 € zu niedrig. **Und eine Stufe davor:** Welche Ware '
      + 'überhaupt palettiert kommt, schätzen wir aus der Warengruppe — belegt ist keine der '
      + '46 Einstufungen. In allen vier Fällen, in denen ein Positionsgewicht dagegenhält, hält '
      + 'es dagegen: vier Kanalpositionen mit zusammen rund acht Kilogramm, alle als Sperrgut '
      + 'geführt.',
  }),
  Object.freeze({
    id: 'abholung',
    titel: 'Abholung durch unsere Kunden',
    schliesst: Object.freeze(['abholung-durch-kunden']),
    frage: 'Dürfen Kunden von uns Ware auf unsere Rechnung bei Ihnen am Lager abholen — '
      + 'und wenn ja: mit welchem Nachweis, zu welchen Zeiten und an welchem Tor?',
    warum: 'Der Shop hat kein eigenes Lager; im Streckengeschäft geht die Ware vom Lieferanten '
      + 'zur Baustelle. Bis zum 6. September sagten fünf Stellen der Website trotzdem Abholung '
      + 'zu, eine davon „am Betriebssitz" — dort liegt nie Ware. Belegt ist nur unsere eigene '
      + 'Abholung am Lager Mauthausen (elf von fünfzehn Rechnungen). Ohne diese Antwort bleibt '
      + 'Abholung zurückgenommen (Gate 28), und unterhalb des Mindestbestellwerts gibt es '
      + 'keinen zweiten Weg.',
  }),
  Object.freeze({
    id: 'liefergebiet',
    titel: 'Liefergebiet und Frachtsätze',
    schliesst: Object.freeze(['liefergebiet-lieferant']),
    frage: 'Bis wohin stellen Sie zu, und staffelt sich die Frachtpauschale nach Entfernung? '
      + 'Auf unseren Belegen ist keine Staffel erkennbar.',
    warum: 'Das Liefergebiet des Shops ist heute die vorsichtige Fläche aus der Kampagne — '
      + 'gesetzt, weil aus den Belegen keine Grenze ablesbar und keine ausschließbar ist. '
      + 'Bestätigt oder widerlegt Gate 23.',
  }),
]);

/**
 * Welcher offene Punkt der Gruppe „Anfrage" wird von keiner Frage geschlossen?
 *
 * Die Richtung, die zählt: Ein Punkt ohne Frage bleibt nach dem Gespräch offen,
 * und niemand merkt es, weil das Gespräch stattgefunden hat.
 */
export function punkteOhneFrage(punkte, fragen = FRAGEN) {
  const abgedeckt = new Set(fragen.flatMap((f) => f.schliesst));
  return punkte.filter((p) => !abgedeckt.has(p.id)).map((p) => p.id);
}

/** Und die Gegenrichtung: eine Frage, die keinen offenen Punkt mehr schließt. */
export function fragenOhnePunkt(punkte, fragen = FRAGEN) {
  const offen = new Set(punkte.map((p) => p.id));
  return fragen.filter((f) => !f.schliesst.some((s) => offen.has(s))).map((f) => f.id);
}

/**
 * Darf dieser Brief hinaus?
 *
 * **Der Befund, der diese Funktion ausgelöst hat.** Der Brief braucht eine
 * Rückantwortadresse — sonst ist er eine Frage ohne Empfänger für die Antwort.
 * `betreiber.email` und `betreiber.telefon` sind leer, und beide stehen in
 * `npm run offenepunkte` unter „Liegt vor, fehlt nur in der Datei": zwei
 * Zeilen, die niemand kosten.
 *
 * > **Der billigste offene Punkt sperrt das Gespräch, das acht andere
 * > schließt.**
 *
 * Das stand nirgends. Die Punkte lagen in zwei verschiedenen Gruppen, und
 * zwischen den Gruppen führte keine Linie.
 */
export function darfVersendetWerden(betreiber, lieferant) {
  const gruende = [];
  if (!betreiber?.firma) gruende.push('Absenderfirma fehlt');
  if (!betreiber?.email) gruende.push('Rückantwortadresse fehlt — betreiber.email ist leer');
  if (!betreiber?.telefon) gruende.push('Telefonnummer fehlt — betreiber.telefon ist leer');
  if (!lieferant?.name) gruende.push('Empfänger fehlt');
  return { darf: gruende.length === 0, gruende };
}

/** Eine Zeile mit Bezeichnung, oder die sichtbare Lücke. */
function feld(wert, bezeichnung) {
  const t = textZeile(wert ?? '');
  // Dieselbe Entscheidung wie in `bestellung.js`: Eine leere Angabe wird
  // sichtbar gemacht, nicht weggelassen. Was fehlt, soll im Brief stehen und
  // nicht erst beim Empfänger auffallen.
  return t.trim() ? t : `LUECKE: ${bezeichnung}`;
}

/**
 * Der Brief.
 *
 * Ein Außentext wie jeder andere: Alles Eingesetzte läuft durch `textZeile`,
 * damit ein Zeilenumbruch in einem Feld keine zweite Frage erfindet.
 */
/**
 * Die Stellen, an denen der Brief **sich selbst zählt**.
 *
 * **Der Anlass, 8. September 2026.** Er sagte zweimal „vier Auskünfte" und
 * stellte sechs Fragen — im ersten und im letzten Absatz. Beide Zahlen kommen
 * jetzt aus `fragen.length`, und dieses Register hält das fest: Wer sie wieder
 * ausschreibt, wird gemeldet.
 *
 * Bitter daran: Genau diese Lehre steht seit dem 3. September **eine Datei
 * weiter** — in `bin/anfragepruefung.mjs`, an der Konsolenzeile, die die Zahl
 * der geschlossenen Punkte nennt: *„Ein Satz, der eine Menge behauptet, gehört
 * an die Menge gehängt."* Angewandt wurde sie dort, wo sie auffiel, und nicht
 * dort, wo sie zählt — im Brief an den Dritten.
 *
 * `wo` ist kein Schmuck: Bleibt ein Muster ohne Treffer, wurde der Satz
 * umgeschrieben, und dann prüft niemand mehr diese Zahl. Das ist ein eigener
 * Befund und nicht dasselbe wie „Zahl stimmt nicht".
 */
export const SELBSTZAEHLUNG = Object.freeze([
  Object.freeze({ muster: /brauchen wir (\S+) Auskünfte/, wo: 'der erste Absatz' }),
  Object.freeze({ muster: /die (\S+) oben genügen uns/, wo: 'der letzte Absatz' }),
]);

/**
 * @param {string} text     der fertige Brief
 * @param {number} anzahl   wie viele Fragen wirklich darin stehen
 */
export function selbstzaehlungsbefund(text, anzahl, stellen = SELBSTZAEHLUNG) {
  const meldungen = [];
  for (const s of stellen) {
    const treffer = text.match(s.muster);
    if (!treffer) {
      meldungen.push({
        regel: 'stelle-ohne-treffer',
        text: `${s.wo}: der Satz, der die Zahl der Fragen nennt, steht nicht mehr da — `
          + 'umgeschrieben, und das Muster gehört mit',
      });
      continue;
    }
    const gelesen = ZAHLWORT[treffer[1].toLowerCase()] ?? Number(treffer[1]);
    if (gelesen !== anzahl) {
      meldungen.push({
        regel: 'brief-zaehlt-falsch',
        text: `${s.wo}: der Brief sagt „${treffer[1]}", gestellt werden ${anzahl} Fragen`,
      });
    }
  }
  return { geprueft: stellen.length, meldungen, sauber: meldungen.length === 0 };
}

/**
 * @param {object} [was]
 * @param {string} [was.zusatz]  ein Satz, der an die Frage nach der Artikelliste
 *   gehängt wird — gemessen aus den Systemlisten, siehe `src/sortimentsluecke.js`.
 *   Er hängt an einer **bestehenden** Frage und macht keine neue daraus: Jede
 *   zusätzliche Frage senkt die Wahrscheinlichkeit einer vollständigen Antwort.
 */
export function erzeugeLieferantenanfrage({
  betreiber = {}, lieferant = {}, fragen = FRAGEN, zusatz = '',
} = {}) {
  const pruefung = darfVersendetWerden(betreiber, lieferant);
  const zeilen = [
    `An: ${feld(lieferant.name, 'Name des Lieferanten')}`,
    'Betreff: Artikeldaten und Konditionen für unseren Online-Shop',
    '',
    'Sehr geehrte Damen und Herren,',
    '',
    `wir, die ${feld(betreiber.firma, 'Absenderfirma')} in `
      + `${feld(betreiber.plz, 'PLZ')} ${feld(betreiber.ort, 'Ort')}, beziehen seit `
      + 'Längerem Baustoffe über Sie. Wir bauen derzeit einen Online-Shop für unsere Region '
      + 'auf, in dem wir ausschließlich Ware anbieten, die wir bei Ihnen bestellen. Dafür '
      + `brauchen wir ${zahlwort(fragen.length)} Auskünfte.`,
    '',
  ];
  for (const [i, f] of fragen.entries()) {
    const text = f.id === 'artikelliste' && zusatz ? `${f.frage} ${zusatz}` : f.frage;
    zeilen.push(`${i + 1}. ${f.titel}`, `   ${text}`, '');
  }
  zeilen.push(
    'Der Shop führt keine eigene Lagerhaltung; jede Bestellung geht als Bestellung bei Ihnen',
    `ein. Mehr Auskünfte brauchen wir nicht — die ${zahlwort(fragen.length)} oben genügen uns.`,
    '',
    'Für Rückfragen erreichen Sie uns unter:',
    `  ${feld(betreiber.email, 'E-Mail-Adresse des Absenders')}`,
    `  ${feld(betreiber.telefon, 'Telefonnummer des Absenders')}`,
    '',
    'Mit freundlichen Grüßen',
    feld(betreiber.firma, 'Absenderfirma'),
  );
  return { text: zeilen.join('\n') + '\n', zeilen, versandfaehig: pruefung.darf, gruende: pruefung.gruende };
}
/**
 * Nennt der Brief jede Lücke, die seine Antwort schließen würde?
 *
 * **Der Anlass, 8. September 2026, abends.** Die Frage nach der Artikelliste
 * schließt fünf offene Punkte, und seit dieser Runde sieben. Sie **nennt**
 * aber nur, was jemand hineingeschrieben hat. Am selben Abend waren zwei
 * frisch gemessene Lücken dazugekommen — der fehlende Hersteller des
 * Mantelsteinklebers und vier Marken ohne Merkblattadresse —, und der Brief
 * wusste nichts davon.
 *
 * > **Eine Frage, die fünf Punkte schließt, aber nur drei nennt, bekommt eine
 * > Antwort auf drei.**
 *
 * Der Lieferant schickt, wonach er gefragt wird. Steht die Artikelnummer nicht
 * im Brief, kommt die Zeile mit dem Hersteller vielleicht mit — und vielleicht
 * nicht. Der Unterschied kostet eine weitere Runde beim Auftraggeber, und der
 * hat genau ein Gespräch.
 *
 * @param {string} brieftext
 * @param {{id: string, nennt: string[]}[]} luecken  was genannt sein muss
 */
export function deckungsbefund(brieftext, luecken) {
  const meldungen = [];
  for (const l of luecken) {
    const fehlend = l.nennt.filter((n) => !brieftext.includes(n));
    if (fehlend.length === 0) continue;
    meldungen.push({
      regel: 'luecke-ungenannt',
      text: `Der Brief schließt „${l.id}", nennt aber nicht: ${fehlend.join(', ')} — `
        + 'der Lieferant schickt, wonach er gefragt wird',
    });
  }
  return { geprueft: luecken.length, meldungen, sauber: meldungen.length === 0 };
}
/**
 * Der zweite Nachsatz zur Artikelliste: was uns in ihr besonders fehlt.
 *
 * Er nennt Artikelnummern und Markennamen, weil ein Lieferant schickt, wonach
 * er gefragt wird. Die Liste dafür entsteht aus dem Bestand — aus
 * `SYSTEM_UNBEKANNT` und aus den Herstellern ohne belegte Adresse —, damit
 * kein Punkt hinzukommt, den der Brief dann nicht kennt.
 */
export function nachfragesatz({ ohneSystem = [], ohneAdresse = [] } = {}) {
  const teile = [];
  if (ohneSystem.length) {
    teile.push(`Zu ${ohneSystem.map((u) => `**${u.sku}** (${u.was})`).join(', ')} nennt Ihre `
      + 'Bezeichnung keinen Hersteller. Weil ein Kamin über die Systemzulassung abgenommen '
      + 'wird, tragen wir dort lieber nichts ein als das Falsche: Zu welchem System gehört '
      + 'dieser Artikel?');
  }
  if (ohneAdresse.length) {
    teile.push(`Und für ${ohneAdresse.join(', ')} fehlt uns eine Hersteller- oder `
      + 'Merkblattadresse. Unsere Artikelseiten sagen das offen; wir möchten dort lieber auf '
      + 'die Unterlage des Herstellers verweisen als auf nichts.');
  }
  return teile.join(' ');
}
