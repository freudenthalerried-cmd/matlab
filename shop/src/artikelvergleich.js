/**
 * Zwei Artikel nebeneinander — und was dabei nicht vergleichbar ist.
 *
 * **Der Anlass, 23. Oktober 2026.** Weisung des Auftraggebers: „mach den
 * artikelvergleich". Gemessen war vorher, was es schon gibt, und das waren
 * zwei Tafeln auf den Gruppenseiten:
 *
 * - **„Was ein Zentimeter Stärke kostet"** — Dämmplatten nach Stärke, seit
 *   dem 11. September.
 * - **Der Kilovergleich** — Gebindeartikel nach Kilopreis, aus dem Befund
 *   *„Wer eine Zahl dreimal richtig beschriftet, hat noch keine vergleichbare
 *   Zahl geliefert."*
 *
 * Beide vergleichen eine ganze Gruppe nach **einem** Kriterium. Was fehlte,
 * ist die Gegenüberstellung: zwei Artikel, alle Merkmale, nebeneinander.
 *
 * ## Was dieser Vergleich kann — und woran die Grenze liegt
 *
 * Der Katalog führt elf Merkmale je Artikel und **keine technischen
 * Kennwerte**: kein Lambda, kein Druckwiderstand, keine Brandklasse. Das ist
 * die zweite Redaktionsregel dieses Hauses und keine Lücke — Kennwerte stehen
 * im Merkblatt des Herstellers, und wer sie abschreibt, haftet für einen
 * Zahlendreher in einem Nachweis.
 *
 * > **Ein Vergleich, der Kennwerte erfindet, ist gefährlicher als keiner:**
 * > Er sieht aus wie eine Entscheidungsgrundlage.
 *
 * Verglichen wird deshalb, was der Betrieb selbst weiß: Preis, Abstand zur
 * Liste des Lieferanten, Einheit, Abgabemenge, Gewicht, Palettierung,
 * Systembindung, Preisstand. Und zu jedem Merkmal, das bei einem Artikel
 * fehlt, steht ein Satz — denn eine Tafel, die schweigend kürzt, sieht
 * vollständig aus und ist es nicht.
 *
 * ## Die drei Warnungen, ohne die diese Tafel irreführt
 *
 * 1. **Verschiedene Einheiten.** Ein Artikel je m², einer je Stück: Die
 *    Preisspalte steht nebeneinander und vergleicht nichts. Genau der Befund,
 *    aus dem der Kilovergleich entstanden ist.
 * 2. **Verschiedene Systeme.** Baumit-Kleber neben Capatect-Gewebe: Beide
 *    Preise sind richtig, und wer beide kauft, verlässt die geprüfte
 *    Zusammenstellung (ETAG 004, ÖNORM B 6400). Ein Vergleich, der zwei
 *    Systeme nebeneinanderstellt, ohne das zu sagen, lädt zum Mischen ein.
 * 3. **Verschiedene Warengruppen.** Eine Dämmplatte neben einem Kanalrohr:
 *    Die Tafel rechnet, der Vergleich bedeutet nichts.
 *
 * Alle drei stehen **über** der Tafel und nicht darunter: Sie sind die
 * Bedingung, unter der die Zahlen gelten — dieselbe Entscheidung wie bei der
 * Liefernotiz über dem Warenraster.
 */

import { preisJeKilo, mengenschritt } from './gebinde.js';
import { vorteil } from './shopkern.js';
import { dickeMm } from './bilder.js';
// **`einordnung` und `systembruch` statt einer eigenen Erkennung.** Sie liegen
// in `src/systemtreue.js` und sind dort gegen den Katalog gehalten
// (`zuordnungsbefund`, in beide Richtungen). Eine zweite Erkennung waere ein
// zweiter Weg zur selben Aussage, und einer davon ist irgendwann alt.
//
// Der **Satz** kommt nicht von dort: `systembruchsatz` spricht von „Ihr
// Warenkorb enthaelt", und das ist eine andere Lage. Im Korb liegt die Ware,
// im Vergleich liegt sie noch nicht — zwei Saetze fuer zwei Lagen sind
// richtig, zwei Erkennungen waeren es nicht.
import { einordnung, systembruch } from './systemtreue.js';
import { preisalterTage, GRENZE_TAGE } from './preisalter.js';

/** Mindestlänge einer Begründung im Register. Dieselbe Zahl wie überall. */
export { GRUND_MINDESTLAENGE } from './grundmass.js';

/**
 * Die Merkmale, die verglichen werden — und zu jedem, warum.
 *
 * `wert` gibt `null` zurück, wo der Betrieb die Angabe **nicht hat**. Das ist
 * kein Fehler, sondern die häufigste Lage: Gewicht kennt der Katalog für
 * sieben von 46 Artikeln. `fehlt` sagt dann, was das für den Vergleich heißt.
 *
 * `einheitengebunden: true` heißt: Diese Zahl darf nur zwischen Artikeln
 * derselben Einheit verglichen werden. Der Prüfer verlangt dann die
 * Einheitenwarnung.
 */
export const MERKMALE = Object.freeze([
  Object.freeze({
    id: 'preis',
    titel: 'Preis je Einheit, netto',
    einheitengebunden: true,
    wert: (a) => (a.vkNetto === null || a.vkNetto === undefined ? null
      : { zahl: a.vkNetto, art: 'geld' }),
    fehlt: 'Kein gerechneter Verkaufspreis — der Einkaufspreis ist nur auf Anfrage zu haben '
      + '(Gate 24), und was der Shop nicht rechnen kann, bietet er nicht an.',
    warum: 'Die Zahl, um die es geht. Sie steht hier netto, weil dieser Shop an Unternehmer '
      + 'liefert und die Umsatzsteuer getrennt ausweist — eine Bruttozahl im Vergleich wäre '
      + 'für den Kunden die falsche: Er rechnet mit dem Nettopreis, weil er die Vorsteuer '
      + 'abzieht. Sie ist einheitengebunden, und das ist der Grund für die erste Warnung über '
      + 'der Tafel.',
  }),
  Object.freeze({
    id: 'einheit',
    titel: 'Einheit',
    wert: (a, u) => ({ text: u.einheitText(a.einheit, 2) }),
    fehlt: null,
    warum: 'Die Zeile, die die Preiszeile erst lesbar macht. Zwei Artikel mit „25 kg" im Namen '
      + 'können je Kilogramm und je Sack kosten, und beide Angaben sind überall sauber '
      + 'beschriftet — der eine Sack kostet 69,25 €, der andere 14,32 €. Wer eine Zahl dreimal '
      + 'richtig beschriftet, hat noch keine vergleichbare Zahl geliefert; deshalb steht die '
      + 'Einheit direkt unter dem Preis und nicht in einer Fußnote.',
  }),
  Object.freeze({
    id: 'vorteil',
    abgeleitet: true,
    hinweis: 'Der Abstand bezieht sich auf die Liste unseres Lieferanten und nicht auf einen Marktpreis — er zeigt, wie viel vom Baumeister-Einkaufsvorteil bei diesem Artikel ankommt.',
    titel: 'unter der Liste des Lieferanten',
    wert: (a) => {
      const v = vorteil(a);
      return v === null ? null : { zahl: v, art: 'prozent' };
    },
    fehlt: 'Kein Listenpreis des Lieferanten bekannt, oder der Artikel liegt am Listendeckel — '
      + 'dann gibt es keinen ausweisbaren Vorteil. Beides steht auf der Artikelseite.',
    warum: 'Der einzige Vergleichsmaßstab, den dieser Shop belegen kann. Er bezieht sich '
      + 'ausdrücklich auf die **Liste des Lieferanten** und nicht auf einen Marktpreis: Ein '
      + 'Marktvergleich bräuchte Wettbewerbsdaten, die hier niemand hat, und „immer der beste '
      + 'Preis" ist aus genau diesem Grund am 15. Oktober abgelehnt worden. Abgerundet wird '
      + 'nach unten, weil die Richtung der Rundung bei einem Werbeversprechen keine '
      + 'Genauigkeitsfrage ist.',
  }),
  Object.freeze({
    id: 'abgabemenge',
    titel: 'Abgabe ab',
    wert: (a, u) => {
      const s = mengenschritt(a);
      return s ? { text: `${u.zahlText(s)} ${u.einheitText(a.einheit, s)}` } : null;
    },
    fehlt: 'Kein Gebinde und keine Mindestabgabemenge — der Artikel ist stückweise zu haben.',
    warum: 'Die Zahl, die aus einem günstigen Preis eine teure Bestellung macht. Wer fünf '
      + 'Quadratmeter braucht und in Paketen von 0,75 m² kauft, bekommt sieben Pakete und '
      + 'zahlt 5,25 m². Zwei Artikel mit gleichem Quadratmeterpreis und verschiedenen Paketen '
      + 'kosten für dasselbe Bauteil verschieden viel, und das sieht man nur hier.',
  }),
  Object.freeze({
    id: 'jekilo',
    abgeleitet: true,
    hinweis: 'Das Gebindegewicht ist aus der Artikelbezeichnung gelesen, der Kilopreis daraus gerechnet — nicht aus einer Angabe des Lieferanten.',
    titel: 'je Kilogramm, netto',
    einheitengebunden: false,
    wert: (a) => {
      const p = preisJeKilo(a);
      return p ? { zahl: p.jeKgNetto, art: 'geld' } : null;
    },
    fehlt: 'Das Gebindegewicht ist aus der Bezeichnung nicht ablesbar — geschätzt wird es '
      + 'nicht, denn es ginge unmittelbar in einen Preisvergleich ein.',
    warum: 'Die einzige Spalte, die **über** Einheitengrenzen vergleicht: Ein Sack zu 25 kg '
      + 'und eine Ware je Kilogramm werden hier vergleichbar, und genau dieser Fall war der '
      + 'Anlass des Kilovergleichs auf den Gruppenseiten. Gerechnet wird das Gewicht aus der '
      + 'Bezeichnung und nicht aus einer Annahme; wo es nicht darin steht, bleibt die Spalte '
      + 'leer und sagt es.',
  }),
  Object.freeze({
    id: 'staerke',
    abgeleitet: true,
    hinweis: 'Die Stärke ist aus der Artikelbezeichnung gelesen und keine Angabe des Herstellers; welche Stärke ein Bauteil braucht, entscheidet der Wärmeschutznachweis.',
    titel: 'Stärke',
    wert: (a) => {
      const mm = dickeMm(a.bezeichnung);
      return mm === null ? null : { text: `${mm} mm` };
    },
    fehlt: 'Die Stärke ist aus der Bezeichnung nicht ablesbar. Sie steht in den Unterlagen des '
      + 'Herstellers, und eine geschätzte Stärke wäre im Vergleich besonders teuer.',
    warum: 'Bei Dämmplatten die Angabe, ohne die der Quadratmeterpreis nichts sagt: Eine '
      + 'Drei-Zentimeter-Platte für 2,81 € ist nicht billiger als eine Fünf-Zentimeter-Platte '
      + 'für 4,67 €. Sie steht hier als Maß und nicht als Wärmeleitwert — welche Stärke ein '
      + 'Bauteil braucht, entscheidet der Wärmeschutznachweis und nicht der Preis.',
  }),
  Object.freeze({
    id: 'winkel',
    abgeleitet: true,
    hinweis: 'Der Winkel ist aus der Artikelbezeichnung gelesen und keine Angabe des '
      + 'Herstellers; welcher Winkel in eine Leitung geh\u00f6rt, entscheidet der Plan.',
    titel: 'Winkel',
    wert: (a) => {
      const m = /(\d+)\s*grad/i.exec(String(a.bezeichnung ?? ''));
      return m ? { text: `${m[1]}\u00b0` } : null;
    },
    fehlt: 'Kein Winkel in der Bezeichnung \u2014 der Artikel ist kein Formst\u00fcck, oder der Winkel '
      + 'steht nur in den Unterlagen des Herstellers.',
    warum: 'Aufgenommen am 23. Oktober 2026, und zwar aus einer Messung: Die Seiten der beiden '
      + 'PVC-Kanalbogen \u2014 NW 100 mit 30 und mit 45 Grad \u2014 erreichten in `pruefe-dubletten` '
      + '0,988, also \u00fcber der Grenze von 0,98, weil die Tafel bei ihnen zehnmal dasselbe sagte. '
      + 'Ihr ganzer Unterschied ist der Winkel, und der stand in keinem Merkmal. **Eine '
      + 'Vergleichstafel, die bei zwei Artikeln nur Gleiches zeigt, macht aus zwei Antworten '
      + 'eine** \u2014 nicht das Ma\u00df war zu streng, es fehlte die Spalte, die unterscheidet. Die '
      + 'Deckung ist niedrig (drei von 46), und das ist richtig: Ein Formst\u00fcck tr\u00e4gt einen '
      + 'Winkel, eine D\u00e4mmplatte nicht.',
  }),
  Object.freeze({
    id: 'gewicht',
    titel: 'Gewicht je Einheit',
    wert: (a, u) => (a.gewichtKg === null || a.gewichtKg === undefined ? null
      : { text: `${u.zahlText(a.gewichtKg)} kg` }),
    fehlt: 'Liegt uns nicht belegt vor. Der Katalog führt das Gewicht für sieben von '
      + '46 Artikeln; die Frage steht in der offenen Anfrage an den Lieferanten.',
    warum: 'Entscheidet auf der Baustelle, was von Hand geht und was den Kran braucht — und '
      + 'damit, ob die Kranentladung anfällt. Die Angabe ist für fast alle Artikel offen, und '
      + 'das steht hier ausdrücklich: Eine Tafel, in der neununddreißig Zellen leer bleiben, '
      + 'ohne dass jemand sagt warum, liest sich wie ein Mangel am Artikel statt wie einer an '
      + 'unserer Auskunft.',
  }),
  Object.freeze({
    id: 'palettiert',
    abgeleitet: true,
    hinweis: 'Die Einstufung folgt aus der Warengruppe und ist nicht vom Lieferanten bestätigt. Sie entscheidet, ob die Kranentladung je Hub anfällt.',
    titel: 'palettiert',
    wert: (a) => ({ text: a.sperrgut ? 'ja' : 'nein' }),
    fehlt: null,
    warum: 'Zwei Folgen, beide am Geld: Palettierte Ware kostet die Kranentladung je Hub, und '
      + 'sie braucht eine tragfähige Zufahrt und einen ebenen Abstellplatz. Die Angabe ist '
      + 'aus der Warengruppe geschätzt und nicht vom Lieferanten bestätigt — wo ein '
      + 'Positionsgewicht dagegenspricht, steht es auf der Artikelseite.',
  }),
  Object.freeze({
    id: 'system',
    titel: 'Systembindung',
    wert: (a) => {
      const e = einordnung(a);
      return e.system ? { text: e.system, system: e.system } : null;
    },
    fehlt: 'Nicht systemgebunden — Dübel und Zubehör tragen eine eigene Zulassung.',
    warum: 'Die Zeile, aus der die zweite Warnung über der Tafel entsteht. Bei WDVS und Kamin '
      + 'gehören die Schichten eines Aufbaus zu **einem** System: Wer den Klebemörtel des '
      + 'einen Herstellers mit dem Gewebe eines anderen kombiniert, verlässt die geprüfte '
      + 'Zusammenstellung, und der Rauchfangkehrer oder der Bauträger prüft gegen die '
      + 'Systemunterlagen. Ein Preisvergleich über Systemgrenzen ist deshalb richtig gerechnet '
      + 'und als Kaufempfehlung falsch.',
  }),
  Object.freeze({
    id: 'preisstand',
    titel: 'Preisgrundlage, Stand',
    wert: (a, u) => {
      if (!a.preisStand) return null;
      const tage = preisalterTage(a.preisStand, u.heute);
      const alt = typeof tage === 'number' && tage > GRENZE_TAGE;
      return { text: alt ? `${a.preisStand} (${tage} Tage, über der Grenze)` : a.preisStand };
    },
    fehlt: 'Kein Preisstand vermerkt — dann ist nicht zu sagen, von welchem Tag die Grundlage '
      + 'stammt, und unprüfbar zählt nicht als frisch.',
    warum: 'Zwei Artikel mit demselben Preis sind nicht gleich gut bepreist, wenn der eine auf '
      + 'einer Grundlage von vorletzter Woche steht und der andere auf einer von vor vier '
      + 'Monaten. Über der eigenen Neunzig-Tage-Grenze steht das Alter in Klammern dabei — '
      + 'dieselbe Auskunft, die die Artikelseite im Klartext gibt und die maschinenlesbare '
      + 'Auszeichnung als abgelaufenes Gültigkeitsdatum.',
  }),
]);

/**
 * Wie viele Artikel höchstens nebeneinander stehen.
 *
 * Vier Spalten plus die Merkmalsspalte. Mehr ist auf einem Telefon bei 390 px
 * nicht zu lesen — die Tafel steht in einem `scroll`-Rahmen, und was man
 * dreimal wegschieben muss, liest niemand. Die Zahl ist eine Entscheidung
 * über Lesbarkeit und keine über den Katalog.
 */
export const HOECHSTENS = 3;

/**
 * Die Artikel, die neben einen gehören — und warum genau diese.
 *
 * Zwei harte Bedingungen, beide aus den Warnungen oben:
 *
 * - **Dieselbe Warengruppe.** Eine Dämmplatte neben einem Kanalrohr rechnet,
 *   bedeutet aber nichts.
 * - **Dieselbe Einheit.** Sonst vergleicht die Preiszeile nichts, und eine
 *   Tafel, deren Hauptzeile nicht vergleicht, ist keine Vergleichstafel.
 *
 * Sortiert wird nach **Preisnähe** und nicht nach dem Katalog: Wer auf einer
 * Artikelseite steht, fragt nach der Alternative in derselben Preislage. Die
 * Richtung ist dabei gleichgültig — teurer und billiger sind beide eine
 * Antwort, und wer nur das Billigere zeigt, hat keine Tafel gebaut, sondern
 * eine Empfehlung.
 *
 * **Was ausdrücklich nicht einschränkt: das System.** Zwei Artikel
 * verschiedener Systeme gehören nebeneinander, denn genau diese Frage stellt
 * sich am Regal — und die Tafel trägt dafür die Systemwarnung. Sie
 * herauszufiltern wäre bequemer und würde dem Kunden die Entscheidung
 * abnehmen, die ihm gehört.
 */
export function alternativen(artikel, alle, hoechstens = HOECHSTENS) {
  if (artikel.vkNetto === null || artikel.vkNetto === undefined) return [];
  /*
   * **Die dritte Bedingung, und sie kam aus einer Messung — 23. Oktober 2026.**
   *
   * Gruppe und Einheit allein ergaben neben dem **Mantelstein** den
   * Mantelsteinkleber, die Regenhaube und die Zuluftplatte: alle in der
   * Gruppe Kamin, alle je Stück, alle in ähnlicher Preislage — und keiner
   * davon eine Alternative. Sie sind **Schichten desselben Aufbaus** und
   * werden zusammen gekauft, nicht gegeneinander.
   *
   * > **Zwei Artikel, die zusammen gekauft werden, sind keine Alternativen.**
   *
   * `einordnung` aus `src/systemtreue.js` kennt die Schicht — dieselbe
   * Zuordnung, mit der `systembruch` den Korb prüft. Wo ein Artikel eine
   * Schicht trägt, kommen nur Artikel derselben Schicht in die Tafel; wo er
   * keine trägt (Dübel, Zubehör, Kanalrohre), bleibt es bei Gruppe und
   * Einheit.
   */
  const meine = einordnung(artikel).schicht;
  const passend = alle.filter((a) => a.sku !== artikel.sku
    && a.gruppe === artikel.gruppe
    && a.einheit === artikel.einheit
    && a.vkNetto !== null && a.vkNetto !== undefined
    && einordnung(a).schicht === meine);
  return passend
    .sort((x, y) => Math.abs(x.vkNetto - artikel.vkNetto) - Math.abs(y.vkNetto - artikel.vkNetto)
      || String(x.bezeichnung).localeCompare(String(y.bezeichnung), 'de'))
    .slice(0, hoechstens - 1);
}

/**
 * Baut die Tafel: je Merkmal eine Zeile, je Artikel eine Spalte.
 *
 * @param {object[]} artikel  Die zu vergleichenden Artikel
 * @param {object} umgebung   `einheitText`, `zahlText`, `heute`
 */
export function vergleichstafel(artikel, umgebung, merkmale = MERKMALE) {
  /*
   * **Gemischte Einheiten einmal festgestellt, nicht je Zeile.** Sie
   * entscheiden, ob eine einheitengebundene Zahl überhaupt nebeneinander
   * stehen darf — und die Warnung oben nennt sie. Die Zeile trägt es
   * trotzdem noch einmal: Wer eine Tabelle liest, liest Zeilen und nicht
   * Vorbemerkungen.
   */
  const gemischteEinheiten = new Set(artikel.map((a) => a.einheit)).size > 1;
  const zeilen = merkmale.map((m) => {
    const werte = artikel.map((a) => m.wert(a, umgebung));
    const luecken = werte.filter((w) => w === null).length;
    return {
      id: m.id,
      titel: m.titel,
      einheitengebunden: Boolean(m.einheitengebunden),
      werte,
      luecken,
      fehlt: m.fehlt,
      abgeleitet: Boolean(m.abgeleitet),
      hinweis: m.hinweis ?? null,
      /*
       * **Eine Zeile, in der alle dasselbe sagen, trägt nichts zum Vergleich
       * bei.** Sie wird nicht weggelassen — der Leser soll sehen, dass die
       * Angabe geprüft und gleich ist —, aber sie wird gekennzeichnet, damit
       * das Auge die Unterschiede findet.
       *
       * **`luecken === 0` gehört dazu, und das war ein Fehler im ersten
       * Anlauf.** Ohne diese Bedingung galt die Gewichtszeile als „alle
       * gleich", weil bei allen drei Artikeln `null` stand — und damit hätte
       * die Tafel gesagt, die Artikel seien im Gewicht gleich, während sie
       * sagen wollte, dass wir es bei keinem wissen.
       *
       * > **Dass niemand etwas weiß, ist keine Übereinstimmung.**
       */
      alleGleich: werte.length > 1 && luecken === 0
        && werte.every((w) => JSON.stringify(w) === JSON.stringify(werte[0])),
      /*
       * **Eine Zahl, die hier nicht vergleichbar ist.** Der Preis je Einheit
       * steht bei gemischten Einheiten nebeneinander und vergleicht nichts:
       * 13,95 € je m² neben 0,56 € je kg. Die Zeile sagt es selbst, nicht nur
       * die Warnung über der Tafel.
       */
      nichtVergleichbar: Boolean(m.einheitengebunden) && gemischteEinheiten,
    };
  });
  return { zeilen, artikel, warnungen: vergleichswarnungen(artikel) };
}

/**
 * Die Warnungen, ohne die die Tafel irreführt.
 *
 * Sie stehen **über** der Tafel: Sie sind die Bedingung, unter der die Zahlen
 * darunter gelten. Dieselbe Entscheidung wie bei der Liefernotiz über dem
 * Warenraster — ein Hinweis unter einer Tabelle wird nach der Tabelle
 * gelesen, also nach der Entscheidung.
 */
export function vergleichswarnungen(artikel) {
  const warnungen = [];
  if (artikel.length < 2) return warnungen;

  const einheiten = [...new Set(artikel.map((a) => a.einheit))];
  if (einheiten.length > 1) {
    warnungen.push({
      art: 'einheiten',
      satz: 'Diese Artikel haben verschiedene Einheiten. Die Preiszeile steht deshalb '
        + 'nebeneinander und vergleicht nichts — vergleichbar ist nur die Zeile „je '
        + 'Kilogramm", und die gibt es nur, wo das Gebindegewicht in der Bezeichnung steht.',
    });
  }

  const bruch = systembruch(artikel);
  if (bruch) {
    const teile = bruch.jeSystem.map((s) => `${s.system} (${s.rollen.join(', ')})`);
    warnungen.push({
      art: 'systeme',
      satz: `Diese Artikel gehören zu verschiedenen Systemen — ${teile.join(' und ')}. `
        + 'Die Preise sind richtig gerechnet, und trotzdem ist der Vergleich keine '
        + 'Kaufempfehlung: Wer Schichten verschiedener Systeme kombiniert, verlässt die '
        + 'geprüfte Zusammenstellung (ETAG 004, ÖNORM B 6400). Welche Zusammenstellung '
        + 'geprüft ist, steht in den Systemunterlagen des Herstellers.',
    });
  }

  const gruppen = [...new Set(artikel.map((a) => a.gruppe))];
  if (gruppen.length > 1) {
    warnungen.push({
      art: 'gruppen',
      satz: `Diese Artikel kommen aus verschiedenen Warengruppen (${gruppen.join(', ')}). `
        + 'Die Tafel rechnet, der Vergleich bedeutet aber nur dort etwas, wo die Artikel '
        + 'denselben Zweck haben.',
    });
  }
  return warnungen;
}

/**
 * Hält das Register gegen den Bestand — in beide Richtungen.
 *
 * @param {object} eingabe
 * @param {object[]} eingabe.artikel  Der ganze Katalog
 * @param {object} eingabe.umgebung
 */
export function vergleichsbefund({
  artikel, umgebung, merkmale = MERKMALE, grundmass = 150, auswahl = alternativen,
}) {
  const probleme = [];

  for (const m of merkmale) {
    /*
     * **Richtung eins: Ein Merkmal, das bei keinem Artikel einen Wert hat.**
     * Es ist dann eine Spalte aus Gedankenstrichen — toter Code mit einer
     * Überschrift, und der Leser hält die Lücke für einen Mangel am Artikel.
     */
    const mitWert = artikel.filter((a) => m.wert(a, umgebung) !== null).length;
    if (mitWert === 0) {
      probleme.push({
        regel: 'merkmal-ohne-wert',
        merkmal: m.id,
        satz: `„${m.titel}" hat bei keinem der ${artikel.length} Artikel einen Wert — `
          + 'eine Spalte aus Gedankenstrichen sagt nichts über die Ware und alles über '
          + 'unsere Auskunft',
      });
    }
    /*
     * **Richtung zwei: Ein Merkmal mit Lücken ohne Satz.** Wo der Betrieb die
     * Angabe nicht hat, muss die Tafel das sagen. Eine leere Zelle liest sich
     * wie ein Mangel am Artikel statt wie einer an unserer Auskunft.
     */
    if (mitWert < artikel.length && !m.fehlt) {
      probleme.push({
        regel: 'luecke-ohne-satz',
        merkmal: m.id,
        satz: `„${m.titel}" fehlt bei ${artikel.length - mitWert} von ${artikel.length} `
          + 'Artikeln und nennt keinen Satz dazu',
      });
    }
    if (m.fehlt && m.fehlt.length < 60) {
      probleme.push({
        regel: 'fehlsatz-zu-kurz',
        merkmal: m.id,
        satz: `der Satz zur Lücke bei „${m.titel}" hat ${m.fehlt.length} Zeichen — `
          + 'er soll sagen, warum die Angabe fehlt und was das für den Vergleich heißt',
      });
    }
    /*
     * **Ein Wert, der abgeleitet ist, muss es sagen — und zwar auf der Seite.**
     *
     * Gefunden am 23. Oktober von `pruefe-sperrgut`: Die Zeile „palettiert"
     * brachte das Wort auf 15 Artikelseiten, auf denen es vorher nie stand,
     * und die Herkunft der Einstufung („aus der Warengruppe") stand nur im
     * `warum` dieses Registers — also intern. Derselbe Fehler wie einen Tag
     * zuvor bei den ausgelassenen Positionen der Beispielrechnung.
     *
     * > **Ein Wert, den der Betrieb geschlossen hat, sieht auf einer Tafel
     * > genauso aus wie einer, den er belegt hat.**
     */
    if (m.abgeleitet && (!m.hinweis || m.hinweis.length < 60)) {
      probleme.push({
        regel: 'abgeleitet-ohne-hinweis',
        merkmal: m.id,
        satz: `„${m.titel}" ist abgeleitet und nennt dem Leser keinen Hinweis darauf — `
          + 'ein geschlossener Wert sieht auf einer Tafel genauso aus wie ein belegter',
      });
    }
    if (!m.warum || m.warum.length < grundmass) {
      probleme.push({
        regel: 'merkmal-ohne-grund',
        merkmal: m.id,
        satz: `„${m.titel}" nennt ${String(m.warum ?? '').length} Zeichen Grund — `
          + `verlangt sind ${grundmass}: Ein Merkmal ohne Begründung ist eine Spalte, `
          + 'die jemand für nützlich hielt',
      });
    }
  }

  /*
   * **Die Auswahlregel selbst — und sie fehlte hier.** Aufgefallen ist das
   * der Gegenprobe `alternativen-ohne-schicht`: Sie nahm den Schichtfilter
   * heraus, und der Prüfer blieb grün. Die wichtigste Entscheidung dieses
   * Baus war damit ungeprüft.
   *
   * > **Zwei Artikel, die zusammen gekauft werden, sind keine Alternativen.**
   *
   * Gemessen wird über den ganzen Katalog: Keine Tafel darf zwei Artikel
   * nebeneinanderstellen, die verschiedene Schichten desselben Aufbaus sind.
   * Das ist nicht derselbe Fall wie zwei **Systeme** nebeneinander — die
   * gehören in die Tafel und tragen dafür die Systemwarnung; hier geht es um
   * zwei **Rollen**, und eine Regenhaube ist keine Wahl gegen einen
   * Mantelstein.
   */
  for (const a of artikel) {
    const meine = einordnung(a).schicht;
    /*
     * **`auswahl` ist einsetzbar, und das ist kein Zierrat.** Die Regel
     * darunter muss sich fahren lassen: Mit dem echten Schichtfilter findet
     * sie nichts — das ist der Zweck —, und ohne ihn wäre sie nie gefeuert.
     * `test/artikelvergleich.test.js` setzt deshalb eine Auswahl ein, die die
     * Rollen mischt — sonst stünde hier eine Zusage, die ihren eigenen
     * Prüffall nicht hergibt, und `pruefe-regeln` sagt dazu den Satz, der dem
     * Prüfer gehört und deshalb hier nicht noch einmal steht.
     */
    for (const n of auswahl(a, artikel)) {
      const seine = einordnung(n).schicht;
      if (seine !== meine) {
        probleme.push({
          regel: 'alternative-anderer-schicht',
          merkmal: null,
          satz: `neben ${a.sku} (${meine ?? 'ohne Schicht'}) steht ${n.sku} `
            + `(${seine ?? 'ohne Schicht'}) — das sind verschiedene Rollen desselben `
            + 'Aufbaus und keine Alternativen, sie werden zusammen gekauft',
        });
      }
    }
  }

  /*
   * **Und die Zusicherung, auf der die ganze Tafel steht.** Ein
   * einheitengebundenes Merkmal gibt es, also muss eine Tafel mit gemischten
   * Einheiten die Einheitenwarnung tragen — sonst stehen 13,95 € je m² und
   * 0,56 € je kg nebeneinander und sehen aus wie ein Preisvergleich.
   *
   * Geprüft wird an einer Probe aus dem Bestand und nicht an einer
   * Behauptung: Zwei Artikel mit verschiedenen Einheiten müssen sich finden
   * lassen, sonst prüft diese Regel nichts.
   */
  if (merkmale.some((m) => m.einheitengebunden)) {
    const einheiten = [...new Set(artikel.map((a) => a.einheit))];
    if (einheiten.length < 2) {
      probleme.push({
        regel: 'keine-gemischte-probe',
        satz: `der Bestand führt nur die Einheit ${einheiten[0]} — dann ist die `
          + 'Einheitenwarnung nicht fahrbar, und nicht gefahren ist nicht grün',
      });
    } else {
      const zwei = [
        artikel.find((a) => a.einheit === einheiten[0]),
        artikel.find((a) => a.einheit === einheiten[1]),
      ];
      const w = vergleichswarnungen(zwei);
      if (!w.some((x) => x.art === 'einheiten')) {
        probleme.push({
          regel: 'einheitenwarnung-fehlt',
          satz: `zwei Artikel mit den Einheiten ${einheiten[0]} und ${einheiten[1]} erzeugen `
            + 'keine Einheitenwarnung — die Preiszeile stünde nebeneinander, ohne zu sagen, '
            + 'dass sie nichts vergleicht',
        });
      }
    }
  }

  return {
    geprueft: merkmale.length,
    artikel: artikel.length,
    probleme,
    sauber: probleme.length === 0,
  };
}
