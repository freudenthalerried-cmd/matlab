/**
 * Ablage der Vorgänge.
 *
 * Bisher entsteht alles und verschwindet wieder: Die UID-Abfrage erzeugt eine
 * Belegzeile, der Warenkorb drei Bestellentwürfe, die Kasse eine Rechnung —
 * und mit dem nächsten Seitenaufruf ist nichts davon mehr da. Für ein
 * Funktionsmuster geht das. Für ein Geschäft nicht: Die Rechnungsnummer muss
 * nach § 11 Abs 1 Z 5 UStG fortlaufend und **einmalig** sein, und § 132 BAO
 * verlangt sieben Jahre Aufbewahrung.
 *
 * Zwei Entwurfsentscheidungen tragen diese Datei.
 *
 * **Erstens: Die Rechnungsnummer wird erst bei der Ausstellung vergeben**, nicht
 * beim Anlegen des Vorgangs. Das ist der Fehler, den man sonst einmal macht:
 * Wer die Nummer schon im Warenkorb zieht, verbrennt für jeden abgebrochenen
 * Kauf eine — und erklärt dem Prüfer später, warum zwischen 0007 und 0034
 * nichts liegt.
 *
 * **Zweitens: Die Ablage wird nur ergänzt, nie geändert.** § 131 BAO verlangt,
 * dass der ursprüngliche Inhalt feststellbar bleibt. Eine Korrektur ist
 * deshalb ein neuer Eintrag, der auf den alten zeigt, und keine Änderung am
 * alten. Ein Testfall besteht darauf.
 *
 * Zeitpunkte werden hereingereicht, nicht hier gelesen. Eine Ablage, die selbst
 * auf die Uhr sieht, lässt sich nicht prüfen.
 */

import { csvFeld, csvBetrag } from './format.js';

/** Aufbewahrungsfrist nach § 132 BAO: sieben Jahre nach Ablauf des Kalenderjahres. */
export const AUFBEWAHRUNG_JAHRE = 7;

/**
 * **`umsatz` — aufgenommen am 12. September 2026.**
 *
 * Die Akte sammelt sechs Papierarten, und nur zwei davon sind ein **Umsatz**:
 * die Rechnung und die Gutschrift, die sie aufhebt. Alles andere ist ein
 * Schritt davor oder daneben.
 *
 * > **Ein Auszug für die Buchhaltung, der alles zusammenzählt, was einen
 * > Betrag trägt, meldet dem Finanzamt das Angebot mit.**
 *
 * Am gefährlichsten ist die **Lieferantenbestellung**: Sie trägt seit heute
 * früh einen Nettobetrag — den Einkaufswert. Der ist kein Umsatz dieses
 * Betriebs, sondern seine Ausgabe; die Vorsteuer daraus steht auf der
 * Rechnung des Lieferanten und nicht auf dieser Bestellung. Ohne dieses Feld
 * wäre er in der Umsatzsteuervoranmeldung gelandet, mit umgekehrtem
 * Vorzeichen zur Wahrheit.
 */
/**
 * **`beleg` — aufgenommen am 12. September 2026.**
 *
 * Sechs der acht Arten sind ein **Papier**, das hinausgeht, und liegen seit
 * dem 11. September als Durchschrift in der Akte. Zwei sind es nicht:
 *
 * > **Ein Vermerk und eine UID-Abfrage haben keinen Beleg — sie *sind* die
 * > Aufzeichnung.** Wer für sie eine Durchschrift verlangt, verlangt eine
 * > Abschrift von etwas, das nie ein Blatt war.
 *
 * Gemessen war der Fall heute schon fällig: `durchschriftenbefund` rechnete
 * für **jeden** Journaleintrag einen Dateinamen aus und meldete ihn als
 * fehlend. Der erste abgelegte Vermerk hätte `npm run pruefe-ablage` rot
 * gemacht — und zwar mit einem Befund, der nichts über den Bestand sagt.
 */
export const ARTEN = {
  angebot: { kuerzel: 'AN', nummernkreis: true, umsatz: false, beleg: true },
  rechnung: { kuerzel: 'RE', nummernkreis: true, umsatz: true, beleg: true },
  gutschrift: { kuerzel: 'GS', nummernkreis: true, umsatz: true, beleg: true },
  /**
   * **Berichtigt am 12. September 2026.** Hier stand `nummernkreis: true` —
   * ein eigener Kreis für ein Papier, das seine Nummer **mitbringt**:
   * `erzeugeBestellungen` bildet sie seit dem 30. August als Vorgangsnummer
   * plus laufende Teillieferung (`2026-0110-01`).
   *
   * > **Zwei Zahlenreihen für dasselbe Papier** — dieselbe Familie wie am
   * > 4. September bei der Angebotsnummer und am 11. bei der Rechnung, wo
   * > gedruckt und abgelegt zwei verschiedene Nummern trugen. Aufgelöst wird
   * > sie wie dort: zugunsten des Papiers.
   *
   * Gerufen hat den Kreis nie jemand; er wäre beim ersten Ablegen zur zweiten
   * Nummer geworden. Fortlaufend und einmalig verlangt § 11 Abs 1 Z 5 UStG
   * ohnehin nur für die Rechnung.
   */
  lieferantenbestellung: { kuerzel: 'LB', nummernkreis: false, umsatz: false, beleg: true },
  /**
   * Die Abfrage der UID des Kunden beim Finanzamt. Sie geschieht **außerhalb**
   * — FinanzOnline oder `ec.europa.eu`, das EU-System VIES —, und der
   * Netzausgang dieser Umgebung ist dorthin gesperrt (`uid-pruefung` in
   * `data/aussenlage.json`, gemessen am 10. September: keine Verbindung).
   * Aufzuzeichnen ist ihr **Ergebnis**, und das ist selbst die Aufzeichnung:
   * Es gibt kein Blatt, von dem eine Abschrift entstünde.
   */
  uidabfrage: { kuerzel: 'UP', nummernkreis: false, umsatz: false, beleg: false },
  /**
   * Der freie Vermerk zu einem Vorgang — „der Kunde hat telefonisch
   * verschoben". Er hat keinen Empfänger und kein Papier; er **ist** die
   * Aufzeichnung (§ 131 Abs 1 Z 5 BAO: zu jedem Geschäftsfall gehört ein
   * Beleg, und wo keiner entsteht, tritt der Vermerk an seine Stelle).
   */
  vermerk: { kuerzel: 'VM', nummernkreis: false, umsatz: false, beleg: false },
  /**
   * **Aufgenommen am 4. September**, als `npm run vorgang` erstmals ablegen
   * sollte. Das Werkzeug erzeugt zwei Papiere — Angebot und
   * **Auftragsbestätigung** —, und dieses Verzeichnis kannte nur das erste.
   * Ohne Eintrag hätte die Bestätigung als `vermerk` abgelegt werden müssen,
   * also unter einem Namen, der etwas anderes meint.
   *
   * `nummernkreis: false` ist Absicht: Eine fortlaufende Nummer verlangt § 11
   * UStG für die **Rechnung**. Wer für die Auftragsbestätigung einen sechsten
   * Kreis eröffnet, handelt sich dessen Lückenerklärung ein, ohne dass
   * irgendeine Vorschrift sie verlangt. Rückführbar bleibt sie über
   * `vorgang` — das ist die Vorgangsakte nach § 131 Abs 1 Z 5 BAO.
   */
  auftragsbestaetigung: { kuerzel: 'AB', nummernkreis: false, umsatz: false, beleg: true },
  /**
   * **Aufgenommen am 12. September**, als die Absage ablegen können sollte.
   * Sie ist der vierte Brief an einen Kunden und war der einzige, von dem
   * nichts blieb: gedruckt, versendet, fort. § 132 Abs 1 BAO verlangt die
   * Geschäftspapiere sieben Jahre, § 212 UGB die Wiedergaben der abgesendeten
   * Geschäftsbriefe — und die **eingehende** Bestellung wird seit dem
   * 4. September aufgezeichnet.
   *
   * > **Der Brief des Kunden wurde aufgehoben, die Antwort darauf nicht.**
   *
   * `nummernkreis: false` aus demselben Grund wie bei der
   * Auftragsbestätigung: Eine fortlaufende Nummer verlangt § 11 UStG für die
   * Rechnung. Rückführbar bleibt die Absage über den Vorgang (§ 131 Abs 1 Z 5
   * BAO) — und ein eigener Kreis brächte eine Lückenerklärung ein, die
   * niemand verlangt.
   */
  absage: { kuerzel: 'AS', nummernkreis: false, umsatz: false, beleg: true },
};

/**
 * Das Verzeichnis der Journalfelder.
 *
 * Die Regel dazu steht in `zusicherung-und-ablage.md`: Was in die Ablage geht,
 * geht für sieben Jahre hinein — eine Löschung nach Art. 17 DSGVO läuft dort
 * ins Leere (Abs. 3 lit. b). Deshalb braucht jedes Feld seine Begründung,
 * **bevor** es hineinkommt, nicht hinterher. Ein Feld ohne Eintrag hier kommt
 * nicht durch `pruefeAblagefelder`.
 *
 * `verlangt` trennt zwei Klassen: Felder, die eine Vorschrift fordert, und
 * Felder, die nur dem Betrieb dienen. Die zweite Klasse ist nicht verboten —
 * aber sie trägt die Beweislast, und bei ihr beginnt jede künftige Diskussion
 * über ein neues Feld.
 */
export const FELDER_DER_ABLAGE = Object.freeze({
  lfd: {
    verlangt: true,
    grundlage: '§ 131 Abs 1 Z 2 BAO',
    zweck: 'Eintragungen der Zeitfolge nach — die laufende Nummer macht Lücken und Umsortierungen sichtbar',
  },
  art: {
    verlangt: true,
    grundlage: '§ 131 BAO',
    zweck: 'welche Aufzeichnung vorliegt; ohne die Art ist kein Nummernkreis prüfbar',
  },
  nummer: {
    verlangt: true,
    grundlage: '§ 11 Abs 1 Z 5 UStG',
    zweck: 'die fortlaufende, einmalige Belegnummer',
  },
  zeitpunkt: {
    verlangt: true,
    grundlage: '§ 11 UStG, § 131 Abs 1 Z 2 BAO',
    zweck: 'Ausstellungsdatum; zeitgerechte Eintragung in der Zeitfolge',
  },
  vorgang: {
    verlangt: true,
    grundlage: '§ 131 Abs 1 Z 5 BAO',
    zweck: 'Rückführbarkeit zum Geschäftsfall — die Vorgangsakte ist die geordnete Belegablage',
  },
  betragNetto: {
    verlangt: true,
    grundlage: '§ 11 Abs 1 Z 5 UStG',
    zweck: 'das Entgelt',
  },
  betragBrutto: {
    verlangt: true,
    grundlage: '§ 11 UStG',
    zweck: 'Entgelt samt Steuer; die Differenz zum Netto ist der ausgewiesene Steuerbetrag',
  },
  text: {
    verlangt: false,
    grundlage: 'betrieblich',
    zweck: 'Betreff oder Vermerk — nie der volle Belegtext; Schranke: keine Daten Dritter (pruefeAblageAufDrittdaten)',
  },
  bezugAuf: {
    verlangt: true,
    grundlage: '§ 131 Abs 1 Z 6 BAO',
    zweck: 'die Stornokette: der ursprüngliche Inhalt bleibt feststellbar, weil die Gutschrift auf die Rechnung zeigt, statt sie zu ändern',
  },
});

/**
 * Legt eine leere Ablage an. `zaehler` kann einen Bestand fortschreiben.
 *
 * `schreibe` ist das Gedächtnis: Wird es übergeben, ruft die Ablage es für
 * jedes Ereignis auf — jede Nummernvergabe, jeden Eintrag — **bevor** sie
 * ihren eigenen Zustand ändert. Wirft die Senke, bleibt der Speicher
 * unverändert; eine Nummer, die das Journal nie gesehen hat, gilt als nie
 * vergeben. Ohne `schreibe` arbeitet die Ablage wie bisher im Arbeitsspeicher.
 */
export function neueAblage({ zaehler = {}, schreibe = null } = {}) {
  return { eintraege: [], zaehler: { ...zaehler }, schreibe };
}

const schluessel = (art, jahr) => `${art}:${jahr}`;

/**
 * Vergibt die nächste Nummer eines Kreises.
 *
 * Der Zähler läuft je Art **und je Jahr**. Die Jahreszahl steht in der Nummer,
 * deshalb bleibt sie über den Jahreswechsel hinweg einmalig, obwohl der Zähler
 * wieder bei eins beginnt — genau die „eine oder mehrere Zahlenreihen", die
 * § 11 zulässt.
 */
export function naechsteNummer(ablage, art, jahr) {
  const beschreibung = ARTEN[art];
  if (!beschreibung) throw new Error(`Unbekannte Vorgangsart: ${art}`);
  if (!beschreibung.nummernkreis) throw new Error(`${art} führt keinen Nummernkreis`);
  if (!Number.isInteger(jahr)) throw new Error('Die Nummernvergabe braucht ein Jahr');

  const k = schluessel(art, jahr);
  const naechste = (ablage.zaehler[k] ?? 0) + 1;
  const nummer = `${beschreibung.kuerzel}-${jahr}-${String(naechste).padStart(4, '0')}`;

  // Erst das Journal, dann der Zähler: Eine Nummer, die nur im Arbeitsspeicher
  // gezogen wurde, wäre nach einem Neustart wieder frei — und § 11 verlangt
  // Einmaligkeit über den Neustart hinweg.
  ablage.schreibe?.({ typ: 'nummernvergabe', art, jahr, nummer });
  ablage.zaehler[k] = naechste;
  return nummer;
}

/**
 * Hängt einen Eintrag an. Der Eintrag wird eingefroren — was einmal in der
 * Ablage steht, ändert sich nicht mehr.
 */
export function haltefest(ablage, eintrag) {
  if (!ARTEN[eintrag.art]) throw new Error(`Unbekannte Vorgangsart: ${eintrag.art}`);
  if (!eintrag.zeitpunkt) throw new Error('Jeder Eintrag braucht einen Zeitpunkt');

  /**
   * **Ergänzt am 4. September.** Die Einmaligkeit der Belegnummer hing bis
   * dahin allein an `naechsteNummer` — wer die Nummer von woanders mitbringt,
   * stand außerhalb jeder Prüfung. Genau das tut seit heute `npm run vorgang
   * --ablegen`: Es legt unter der Nummer ab, die **auf dem Papier** steht,
   * denn eine Akte unter einer zweiten Nummer findet niemand.
   *
   * § 11 Abs 1 Z 5 UStG verlangt fortlaufend **und einmalig**. Fortlaufend
   * sichert der Zähler, einmalig sichert von hier an diese Zeile — und zwar
   * für jeden Weg in die Ablage, nicht nur für den einen.
   */
  if (eintrag.nummer && ablage.eintraege.some((e) => e.nummer === eintrag.nummer)) {
    throw new Error(`Die Belegnummer ${eintrag.nummer} steht schon in der Ablage`);
  }

  const fertig = Object.freeze({
    lfd: ablage.eintraege.length + 1,
    art: eintrag.art,
    nummer: eintrag.nummer ?? null,
    zeitpunkt: eintrag.zeitpunkt,
    vorgang: eintrag.vorgang ?? null,
    betragNetto: eintrag.betragNetto ?? null,
    betragBrutto: eintrag.betragBrutto ?? null,
    text: eintrag.text ?? '',
    bezugAuf: eintrag.bezugAuf ?? null,
  });

  ablage.schreibe?.({ typ: 'eintrag', eintrag: fertig });
  ablage.eintraege.push(fertig);
  return fertig;
}

/**
 * Stellt eine Rechnung aus — und **erst hier** entsteht die Nummer.
 *
 * Der Beleg muss vollständig sein. Eine Rechnung mit fehlenden Pflichtangaben
 * bekommt keine Nummer, weil eine vergebene Nummer nicht zurückgenommen werden
 * kann; sie wäre dann für immer eine Lücke ohne Beleg.
 */
export function stelleRechnungAus(ablage, rechnung, { zeitpunkt, jahr, vorgang, betreff, nummer: gezogen }) {
  if (!rechnung.vollstaendig) {
    return {
      ausgestellt: false,
      grund: `Pflichtangaben fehlen: ${rechnung.fehlend.join(', ')} — keine Nummer vergeben`,
    };
  }

  /*
   * **Die Nummer kommt vom Beleg, wenn er schon eine hat — berichtigt am
   * 11. September 2026.**
   *
   * Vorher zog diese Funktion immer selbst eine. Das ging, solange sie
   * niemand rief: Eine Rechnung ist ohne Nummer **nicht vollständig**, die
   * Zeile darüber weist sie also ab, und die Nummer entsteht erst hier — ein
   * Kreis, aus dem kein Aufrufer herauskommt. Wer die Rechnung wirklich
   * ausstellt, zieht die Nummer **vorher**, baut den Beleg damit und legt ihn
   * dann ab; das ist auch die Reihenfolge, in der ein Mensch es täte.
   */
  const nummer = gezogen ?? rechnung.nummer ?? naechsteNummer(ablage, 'rechnung', jahr);

  /*
   * **Nur der Betreff, nie der Belegtext — berichtigt am 11. September 2026.**
   *
   * Hier stand `text: rechnung.text`, also der **ganze** Rechnungstext. Genau
   * das verbietet das Felderverzeichnis dieser Ablage, und `bin/vorgang.mjs`
   * schreibt es bei Angebot und Auftragsbestätigung seit dem 4. September
   * ausdrücklich dazu: *Was hier steht, steht sieben Jahre. Der volle Text
   * enthält die Anschrift des Kunden ein zweites Mal und gehört in den Beleg,
   * nicht ins Journal.*
   *
   * > **Eine Regel, die für zwei von drei Belegarten gilt, ist keine Regel
   * > über die Ablage, sondern eine über zwei Belegarten.**
   */
  const eintrag = haltefest(ablage, {
    art: 'rechnung',
    nummer,
    zeitpunkt,
    vorgang,
    betragNetto: rechnung.nettobetrag ?? null,
    betragBrutto: rechnung.bruttobetrag ?? null,
    text: betreff ?? `Rechnung ${nummer} zu Vorgang ${vorgang ?? '—'}`,
  });

  return { ausgestellt: true, nummer, eintrag };
}

/**
 * Storniert einen Eintrag.
 *
 * Der ursprüngliche Eintrag bleibt unangetastet; es entsteht eine Gutschrift
 * mit eigener Nummer, die auf ihn zeigt. Die Nummer der stornierten Rechnung
 * wird **nicht** wiederverwendet — eine wiederverwendete Rechnungsnummer ist
 * genau das, was § 11 mit „einmalig" ausschließt.
 */
export function storniere(ablage, nummer, {
  grund, zeitpunkt, jahr, nummer: gezogen = null, bezug = null, bekannt = null,
}) {
  /*
   * **`bezug` und `bekannt` seit dem 13. September 2026.**
   *
   * Diese Funktion suchte die aufzuhebende Rechnung in **der Ablage, in die
   * sie schreibt** — also im Journal des laufenden Geschäftsjahres. Eine
   * Rechnung vom 20. Dezember, die im Jänner aufgehoben wird, stand dort
   * nicht, und der Lauf brach mit einer ungefangenen Ausnahme ab —
   * **nachdem** die Durchschrift der Gutschrift schon geschrieben war.
   *
   * > **Und die schwerere Richtung: `istStorniert` sah ein Storno aus dem
   * > Vorjahr nicht.** Zweimal aufheben heißt einmal zu viel gutschreiben.
   *
   * Die Nummer zieht weiterhin der Kreis des Jahres, in das geschrieben wird
   * (§ 11 Abs 1 Z 5 UStG, fortlaufend und einmalig je Geschäftsjahr). Gesucht
   * wird über alles, was der Aufrufer kennt.
   */
  const bestand = bekannt ?? ablage.eintraege;
  const ziel = bezug ?? bestand.find((e) => e.nummer === nummer);
  if (!ziel) throw new Error(`Kein Eintrag mit der Nummer ${nummer}`);
  if (istStorniert({ eintraege: bestand }, nummer)) {
    throw new Error(`${nummer} ist bereits storniert`);
  }

  /*
   * **`gezogen` seit dem 12. September** — dieselbe Ergänzung wie bei
   * `stelleRechnungAus` am 11.: Wer die Gutschrift **drucken** will, bevor er
   * sie ablegt, braucht ihre Nummer schon beim Bauen. Zöge diese Zeile dann
   * eine zweite, trüge das Papier eine andere Nummer als die Akte.
   */
  const gutschrift = gezogen ?? naechsteNummer(ablage, 'gutschrift', jahr);
  return haltefest(ablage, {
    art: 'gutschrift',
    nummer: gutschrift,
    zeitpunkt,
    vorgang: ziel.vorgang,
    betragNetto: ziel.betragNetto === null ? null : -ziel.betragNetto,
    betragBrutto: ziel.betragBrutto === null ? null : -ziel.betragBrutto,
    text: `Storno zu ${nummer}: ${grund}`,
    bezugAuf: nummer,
  });
}

/** Alle Einträge eines Vorgangs, in der Reihenfolge ihrer Entstehung. */
export function vorgangsakte(ablage, vorgang) {
  return ablage.eintraege.filter((e) => e.vorgang === vorgang);
}

/**
 * Prüft einen Nummernkreis auf Lücken.
 *
 * Eine Lücke ist nicht von vornherein ein Fehler — sie ist erklärungsbedürftig.
 * Diese Funktion liefert deshalb die fehlenden Nummern, nicht ein Urteil.
 */
export function pruefeNummernkreis(ablage, art, jahr) {
  const kuerzel = ARTEN[art]?.kuerzel;
  if (!kuerzel) throw new Error(`Unbekannte Vorgangsart: ${art}`);

  const vorsatz = `${kuerzel}-${jahr}-`;
  const vergeben = ablage.eintraege
    .filter((e) => e.nummer?.startsWith(vorsatz))
    .map((e) => Number(e.nummer.slice(vorsatz.length)))
    .sort((a, b) => a - b);

  const hoechste = ablage.zaehler[schluessel(art, jahr)] ?? 0;
  const fehlend = [];
  for (let i = 1; i <= hoechste; i++) {
    if (!vergeben.includes(i)) fehlend.push(`${vorsatz}${String(i).padStart(4, '0')}`);
  }

  return { anzahl: vergeben.length, hoechste, fehlend, lueckenlos: fehlend.length === 0 };
}

/**
 * Bis wann aufzubewahren ist: sieben Jahre nach Ablauf des Kalenderjahres.
 * Für einen Beleg aus 2026 endet die Frist also mit 31.12.2033.
 */
export function aufbewahrungBis(jahr) {
  if (!Number.isInteger(jahr)) throw new Error('Die Frist braucht ein Jahr');
  return { jahr: jahr + AUFBEWAHRUNG_JAHRE, hinweis: `31.12.${jahr + AUFBEWAHRUNG_JAHRE} (§ 132 BAO)` };
}

/**
 * Ob eine Nummer storniert ist, steht in keiner Zelle — es folgt aus der
 * Gutschriftkette. Ein Feld im eingefrorenen Eintrag könnte den Wechsel auf
 * „storniert" nie vollziehen; genau so ein Feld (`storniert`, immer `false`)
 * stand bis zum Felderverzeichnis in jedem Eintrag.
 */
export function istStorniert(ablage, nummer) {
  return ablage.eintraege.some((e) => e.art === 'gutschrift' && e.bezugAuf === nummer);
}

/**
 * Hält jedes Feld jedes Eintrags gegen das Verzeichnis — in beide Richtungen.
 *
 * Richtung eins: Ein Feld ohne Verzeichniseintrag ist ein Befund, auch wenn es
 * leer ist. So fiel beim Aufstellen des Verzeichnisses `storniert` auf: seit
 * der ersten Fassung in jedem Eintrag, immer `false`, von niemandem gelesen —
 * und strukturell unwahr, denn ein eingefrorener Eintrag kann den Wechsel auf
 * `true` nie vollziehen. Der Storno steht in der Gutschriftkette
 * (`istStorniert`), nicht im Eintrag.
 *
 * Richtung zwei: Ein Eintrag, dem ein Verzeichnisfeld fehlt, ist ebenso ein
 * Befund. `haltefest` schreibt alle Felder; fehlt eines, kam der Eintrag an
 * `haltefest` vorbei ins Journal.
 */
export function pruefeAblagefelder(ablage) {
  const bekannt = Object.keys(FELDER_DER_ABLAGE);
  const funde = [];

  for (const e of ablage.eintraege) {
    const vorhanden = Object.keys(e);
    for (const feld of vorhanden) {
      if (!bekannt.includes(feld)) {
        funde.push(`Eintrag ${e.lfd ?? '?'}: Feld „${feld}" hat keinen Verzeichniseintrag`);
      }
    }
    for (const feld of bekannt) {
      if (!vorhanden.includes(feld)) {
        funde.push(`Eintrag ${e.lfd ?? '?'}: Verzeichnisfeld „${feld}" fehlt — der Eintrag kam an haltefest vorbei`);
      }
    }
  }

  return { dicht: funde.length === 0, funde, geprueft: ablage.eintraege.length };
}

/** Das Journal als CSV — die Form, in der es die Buchhaltung übernimmt. */
/**
 * Die Zahlen einer Periode für die Umsatzsteuervoranmeldung.
 *
 * **Der Anlass, 12. September 2026.** `alsCsv` gibt es seit dem Bau der
 * Ablage; gerufen hat sie niemand, mit dem Grund, es fehle „eine Buchhaltung,
 * die etwas abholt". Sie kommt mit der ersten Rechnung, und dann sofort: Die
 * UVA ist am 15. des zweitfolgenden Monats fällig (§ 21 Abs 1 UStG).
 *
 * Gezählt wird **nur, was ein Umsatz ist** — `ARTEN` sagt seit heute, welche
 * Papierart das ist. Die Steuer folgt aus der Differenz und wird nicht ein
 * zweites Mal gerechnet: Was auf dem Beleg steht, ist brutto minus netto.
 *
 * @param {Array} eintraege  die Einträge der Periode
 */
export function umsatzsumme(eintraege = []) {
  const gezaehlt = eintraege.filter((e) => ARTEN[e.art]?.umsatz);
  const summe = (feld) => gezaehlt.reduce((n, e) => n + (e[feld] ?? 0), 0);
  const netto = Math.round(summe('betragNetto') * 100) / 100;
  const brutto = Math.round(summe('betragBrutto') * 100) / 100;
  return {
    belege: gezaehlt.length,
    ohneUmsatz: eintraege.length - gezaehlt.length,
    netto,
    brutto,
    steuer: Math.round((brutto - netto) * 100) / 100,
  };
}

/**
 * Der Auszug als CSV — die Datei, die zum Steuerberater geht.
 *
 * **Die Spalte `umsatz` kam am 12. September 2026, abends.** Seit dem
 * Vormittag weiß `ARTEN`, welche Papierart ein Umsatz ist, und
 * `npm run buchhaltung` rechnet damit die Bemessungsgrundlage. Auf dem
 * Bildschirm. **In die Datei ging die Unterscheidung nicht mit.**
 *
 * Gemessen an einem Probejournal aus zwei Zeilen:
 *
 * ```
 * 1;rechnung;RE-2026-0001;…;759,22;911,06;;Rechnung an Muster GmbH
 * 2;lieferantenbestellung;2026-0101-01;…;600,00;;;Bestellung Poschacher
 * ```
 *
 * > **Beide Beträge stehen in derselben Spalte `netto`.** Wer sie
 * > zusammenzählt — und genau dafür öffnet ein Steuerberater eine CSV —
 * > bekommt 1.359,22 € statt 759,22 €. Das sind 79 % zu viel, und die
 * > Umsatzsteuer daraus wandert in die Voranmeldung.
 *
 * Der Einkaufswert der Lieferantenbestellung ist die **Ausgabe** dieses
 * Betriebs; die Vorsteuer daraus steht auf der Rechnung des Lieferanten und
 * nicht auf dieser Bestellung. Dieselbe Familie wie der Zahlenpunkt am
 * 2. September: Die Datei war für sich richtig und wurde beim Lesen falsch.
 */
export function alsCsv(ablage) {
  const kopf = 'lfd;art;umsatz;nummer;zeitpunkt;vorgang;netto;brutto;bezug;text';
  const zeilen = ablage.eintraege.map((e) =>
    [
      e.lfd,
      e.art,
      ARTEN[e.art]?.umsatz ? 'ja' : 'nein',
      e.nummer ?? '',
      e.zeitpunkt,
      e.vorgang ?? '',
      // **Berichtigt am 2. September.** Hier stand der rohe Zahlenwert:
      // `768.39` bei Semikolon als Trenner. In einer Tabellenkalkulation mit
      // deutscher Ländereinstellung ist der Punkt das Tausendertrennzeichen —
      // aus 768,39 € werden lautlos 76.839 €. Diese Datei geht zum
      // Steuerberater.
      csvBetrag(e.betragNetto),
      csvBetrag(e.betragBrutto),
      e.bezugAuf ?? '',
      csvFeld(e.text).slice(0, 200),
    ].join(';'),
  );
  return [kopf, ...zeilen].join('\n');
}
