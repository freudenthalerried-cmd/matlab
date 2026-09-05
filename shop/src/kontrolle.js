/**
 * Die zweite Rechnung — bewusst anders gebaut als die erste.
 *
 * Der Warenkorb summiert Positionen zu Gruppen und Gruppen zu einer Summe.
 * Geprüft wird das bisher gegen sich selbst: Die Testfälle rechnen mit
 * denselben Funktionen nach, die sie prüfen sollen. Ein Denkfehler, der in
 * beide Richtungen gleich falsch ist, fällt dabei nicht auf.
 *
 * Diese Datei geht deshalb einen anderen Weg. Sie liest den **gerenderten
 * Belegtext** zurück und rechnet aus den Zeichen nach, was dort steht. Das ist
 * aus zwei Gründen die richtige Gegenprobe:
 *
 *   1. Sie ist unabhängig. Sie kennt weder `warenkorb.js` noch `preis.js`,
 *      sondern nur Text und die vier Grundrechenarten.
 *   2. Sie prüft, was der Kunde tatsächlich sieht. Ein Fehler beim Formatieren
 *      — eine Zeile, die im Text fehlt, ein Betrag, der falsch gerundet
 *      hinausgeht — wäre allen 213 Testfällen entgangen, weil sie Objekte
 *      prüfen und keine Zeichen.
 *
 * Was sie nicht kann: Sie prüft die **innere Stimmigkeit** des Belegs, nicht
 * seine Richtigkeit. Steht überall derselbe falsche Preis, geht die Rechnung
 * trotzdem auf. Dafür ist der Abgleich mit dem Warenkorb da.
 */

/**
 * Eine Zahl aus einem Beleg — auch hier **noch einmal**, aus demselben Grund
 * wie der Steuersatz unten.
 *
 * `format.js` hat seit dem 2. September `zahlAusText`. Sie von dort zu holen
 * wäre die Regel „eine Quelle für jede Zahl" — und sie ist hier falsch: Diese
 * Datei liest zurück, was `format.js` geschrieben hat. Ein Leser, der die
 * Schreibweise vom Schreiber bezieht, bestätigt jede Schreibweise, auch eine
 * falsche.
 *
 * Gelesen wird Komma **und** Punkt: Ältere Dateien tragen den Punkt, und ein
 * Leser, der sie ab heute nicht mehr versteht, macht aus einem Formatfehler
 * einen Datenverlust.
 */
const zahlAusText = (wert) => {
  const roh = String(wert ?? '').trim().replace(',', '.');
  return roh === '' ? NaN : Number(roh);
};

/**
 * Der Steuersatz steht hier **noch einmal** — und das ist Absicht.
 *
 * `preis.js` exportiert ihn auch. Ihn von dort zu holen wäre die Regel
 * „eine Quelle für jede Zahl", und sie ist hier falsch: Diese Datei ist die
 * zweite Rechnung, die gegen die erste prüft. Ein Kontrollwerkzeug, das
 * seine Vergleichsgröße von dem holt, was es prüft, kontrolliert nichts —
 * es bestätigt.
 *
 * **Am 30.08. geprüft und stehen gelassen.** Damit die Doppelung nicht
 * eines Tages still auseinanderläuft, hält ein Testfall beide Zahlen
 * aneinander: `test/kontrolle.test.js` verlangt, dass sie übereinstimmen —
 * das ist der Abgleich, den ein Import erschlagen hätte, ohne ihn zu leisten.
 */
const UST_SATZ = 0.20;

/** Liest einen Betrag in österreichischer Schreibweise: `1.234,56 €`. */
export function leseBetrag(text) {
  const treffer = /(-?[\d.]+,\d{2})\s*€/.exec(String(text ?? ''));
  if (!treffer) return null;
  return Number(treffer[1].replaceAll('.', '').replace(',', '.'));
}

const rund = (n) => Math.round(n * 100) / 100;

/**
 * Zieht aus einem Belegtext alle Zahlen, die dort stehen.
 *
 * Bewusst textnah: Was nicht im Text steht, wird auch nicht ergänzt. Fehlt eine
 * Zeile, meldet die Prüfung sie als fehlend statt sie zu erraten.
 */
export function leseBeleg(text) {
  const zeilen = String(text ?? '').split('\n');

  const zeilensummen = [];
  const frachten = [];
  const summen = {};

  for (const zeile of zeilen) {
    const positionszeile = /à\s+([\d.]+,\d{2}\s*€)\s+netto\s+=\s+([\d.]+,\d{2}\s*€)/.exec(zeile);
    if (positionszeile) {
      zeilensummen.push({ einzelpreis: leseBetrag(positionszeile[1]), summe: leseBetrag(positionszeile[2]) });
      continue;
    }

    if (/^\s+Fracht\s/.test(zeile)) {
      const betrag = leseBetrag(zeile);
      if (betrag !== null) frachten.push(betrag);
      continue;
    }

    for (const [schluessel, muster] of [
      ['warenwertNetto', /^Warenwert netto\s/],
      ['frachtNetto', /^Fracht netto\s/],
      ['summeNetto', /^Summe netto\s/],
      ['ust', /^Umsatzsteuer 20 %\s/],
      ['summeBrutto', /^Gesamtbetrag\s/],
    ]) {
      if (muster.test(zeile)) summen[schluessel] = leseBetrag(zeile);
    }
  }

  return { zeilensummen, frachten, ...summen };
}

/**
 * Prüft, ob der Beleg in sich aufgeht.
 *
 * Fünf Gleichungen, jede einzeln gemeldet — eine Sammelmeldung „stimmt nicht"
 * hilft niemandem beim Suchen.
 */
export function pruefeBelegRechnerisch(text) {
  const b = leseBeleg(text);
  const fehler = [];

  const fehlend = ['warenwertNetto', 'frachtNetto', 'summeNetto', 'ust', 'summeBrutto'].filter(
    (k) => b[k] === undefined || b[k] === null,
  );
  if (fehlend.length) {
    return { stimmig: false, gelesen: b, fehler: [`Im Text fehlen die Zeilen: ${fehlend.join(', ')}`] };
  }

  const summeDerZeilen = rund(b.zeilensummen.reduce((s, z) => s + z.summe, 0));
  const summeDerFrachten = rund(b.frachten.reduce((s, f) => s + f, 0));

  if (b.zeilensummen.length === 0) fehler.push('Der Beleg führt keine einzige Position');
  if (summeDerZeilen !== b.warenwertNetto) {
    fehler.push(`Positionen ergeben ${summeDerZeilen}, ausgewiesen ist ein Warenwert von ${b.warenwertNetto}`);
  }
  if (summeDerFrachten !== b.frachtNetto) {
    fehler.push(`Frachtzeilen ergeben ${summeDerFrachten}, ausgewiesen ist ${b.frachtNetto}`);
  }
  if (rund(b.warenwertNetto + b.frachtNetto) !== b.summeNetto) {
    fehler.push(`Warenwert plus Fracht ergibt ${rund(b.warenwertNetto + b.frachtNetto)}, ausgewiesen ist ${b.summeNetto}`);
  }
  if (rund(b.summeNetto * UST_SATZ) !== b.ust) {
    fehler.push(`20 % von ${b.summeNetto} sind ${rund(b.summeNetto * UST_SATZ)}, ausgewiesen ist ${b.ust}`);
  }
  if (rund(b.summeNetto + b.ust) !== b.summeBrutto) {
    fehler.push(`Netto plus Steuer ergibt ${rund(b.summeNetto + b.ust)}, ausgewiesen ist ${b.summeBrutto}`);
  }

  return { stimmig: fehler.length === 0, gelesen: b, fehler };
}

/**
 * Liest eine Lieferantenbestellung aus ihrem Text zurück.
 *
 * Die Bestellung an den Lieferanten ist der einzige Beleg, der **Ware bewegt**.
 * Eine falsche Zahl auf der Kundenrechnung kostet Geld; eine falsche Menge hier
 * kostet Geld **und** eine Palette, die zurückgeht. Sie verdient deshalb
 * dieselbe Gegenprobe wie der Beleg an den Kunden.
 */
export function leseBestellung(text) {
  const zeilen = String(text ?? '').split('\n');
  const positionen = [];
  let lieferadresse = null;

  for (let i = 0; i < zeilen.length; i++) {
    // Die Menge ist mit padStart(3) eingerückt, die Artikelnummer mit padEnd(12)
    // aufgefüllt — das Muster muss beides vertragen.
    // **Berichtigt am 2. September.** Hier stand `(\d+)` — nur ganze Zahlen.
    // Der Shop gibt Platten zu 0,75 m² und Rollen zu 55 m² ab; eine Zeile mit
    // gebrochener Menge traf das Muster nicht und **verschwand still**. Die
    // Gegenprobe verglich dann eine Position weniger und beschuldigte den
    // Bestelltext, in dem die Position sehr wohl stand.
    const p = /^\s*([\d.,]+)\s+×\s+(\S+)\s+(.+)$/.exec(zeilen[i]);
    if (p) {
      positionen.push({ menge: zahlAusText(p[1]), sku: p[2], bezeichnung: p[3].trim() });
      continue;
    }
    if (/^Lieferadresse/.test(zeilen[i])) {
      lieferadresse = {
        name: (zeilen[i + 1] ?? '').trim(),
        strasse: (zeilen[i + 2] ?? '').trim(),
        plzOrt: (zeilen[i + 3] ?? '').trim(),
      };
    }
  }

  // Am **Zeilenanfang** verankert, nicht irgendwo im Text. Der lose Ausdruck
  // hat sich beim Prüfen der Fremdtext-Ausgänge selbst blamiert: Ein Kunde, der
  // „Warenwert netto laut meiner Kalkulation: 1,00 €" in seinen Firmennamen
  // schreibt, brachte diese Gegenprobe dazu, den erfundenen Betrag zu lesen —
  // obwohl er mitten in der Lieferadresse stand und keine eigene Zeile war.
  const wertzeile = zeilen.find((z) => /^Warenwert netto/.test(z)) ?? '';
  return { positionen, lieferadresse, einkaufNetto: leseBetrag(wertzeile) };
}

/** Liest dieselbe Bestellung aus ihrer CSV zurück. */
export function leseBestellCsv(csv) {
  const zeilen = String(csv ?? '').split('\n').filter((z) => z.trim() !== '');
  if (zeilen.length === 0) return { kopf: [], positionen: [] };

  const kopf = zeilen[0].split(';');
  const spalte = (felder, name) => felder[kopf.indexOf(name)];

  const positionen = zeilen.slice(1).map((z) => {
    const f = z.split(';');
    return {
      spalten: f.length,
      sku: spalte(f, 'sku'),
      menge: zahlAusText(spalte(f, 'menge')),
      bezeichnung: spalte(f, 'bezeichnung'),
      liefername: spalte(f, 'liefername'),
      lieferort: spalte(f, 'lieferort'),
    };
  });

  return { kopf, positionen };
}

/**
 * Vergleicht Warenkorb, Bestelltext und Bestell-CSV paarweise.
 *
 * Drei Quellen, die getrennt entstehen: die gerechnete Teillieferung, der Text
 * für den Menschen und die Datei für die Maschine. Sie müssen dieselben Mengen
 * und dieselben Artikelnummern führen — sonst bestellt der Shop etwas anderes,
 * als er anzeigt.
 */
export function pruefeBestellung(bestellung, teillieferung) {
  const text = leseBestellung(bestellung.text);
  const csv = leseBestellCsv(bestellung.csv);
  const abweichungen = [];

  const soll = teillieferung.positionen.map((p) => ({ sku: p.sku, menge: p.menge }));
  const alsText = (liste) => liste.map((p) => `${p.sku}×${p.menge}`).sort().join(', ');

  if (alsText(text.positionen) !== alsText(soll)) {
    abweichungen.push(`Text führt ${alsText(text.positionen) || '—'}, der Warenkorb ${alsText(soll)}`);
  }
  if (alsText(csv.positionen) !== alsText(soll)) {
    abweichungen.push(`CSV führt ${alsText(csv.positionen) || '—'}, der Warenkorb ${alsText(soll)}`);
  }

  // Eine CSV-Zeile mit mehr Feldern als Spalten ist verrutscht — dann steht die
  // Menge in einer anderen Spalte, und niemand merkt es beim Lesen.
  for (const p of csv.positionen) {
    if (p.spalten !== csv.kopf.length) {
      abweichungen.push(`CSV-Zeile mit ${p.spalten} Feldern bei ${csv.kopf.length} Spalten — verrutscht`);
      break;
    }
    if (!Number.isFinite(p.menge)) {
      abweichungen.push(`CSV-Zeile ohne lesbare Menge bei ${p.sku}`);
      break;
    }
  }

  if (text.einkaufNetto !== teillieferung.einkaufNetto) {
    abweichungen.push(`Einkaufswert im Text ${text.einkaufNetto}, gerechnet ${teillieferung.einkaufNetto}`);
  }

  return { deckungsgleich: abweichungen.length === 0, abweichungen, text, csv };
}

/**
 * Liest den Kopf eines Kundenbelegs zurück: Nummer und Empfänger.
 *
 * Wieder textnah. Der Empfängerblock ist das, was zwischen der Zeile
 * „Rechnungsempfänger:" bzw. „An:" und der nächsten Leerzeile steht — genau
 * das, was ein Mensch dort liest.
 */
export function leseBelegkopf(text) {
  const zeilen = String(text ?? '').split('\n');
  const nummer = /^(?:Rechnung|Angebot|Auftragsbestätigung)\s+(\S+)/.exec(zeilen[0] ?? '')?.[1] ?? null;

  const beginn = zeilen.findIndex((z) => /^(Rechnungsempfänger:|Auftraggeber:|An:)$/.test(z.trim()));
  const empfaenger = [];
  if (beginn >= 0) {
    for (let i = beginn + 1; i < zeilen.length && zeilen[i].trim() !== ''; i++) {
      empfaenger.push(zeilen[i].trim());
    }
  }

  return { nummer, empfaenger };
}

/**
 * Hält die Papiere **eines** Vorgangs gegen den Vorgang selbst.
 *
 * Der Anlass ist nachgewiesen: Werden Bestellung und Rechnung mit den Daten
 * zweier verschiedener Kunden gebaut, geht die Ware zum einen und die Rechnung
 * zum anderen — und **keine bestehende Prüfung sieht es**. Die Rechnung ist
 * nach § 11 UStG vollständig, die Gegenprobe an der Bestellung ist
 * deckungsgleich, weil sie nur gegen den Warenkorb vergleicht. Beide prüfen ihr
 * eigenes Papier; niemand prüft, ob es dieselbe Sache betrifft.
 *
 * Verglichen wird gegen die **erklärten Daten des Vorgangs**, nicht die beiden
 * Papiere gegeneinander. Der Unterschied wird wichtig, sobald die Baustelle
 * einmal eine andere Adresse hat als die Rechnung — im Streckengeschäft der
 * Normalfall, heute noch nicht abgebildet. Ein Vergleich Papier gegen Papier
 * müsste dann aufgegeben werden; dieser hier bleibt richtig.
 */
export function pruefeVorgangsklammer(vorgang) {
  const abweichungen = [];

  if (vorgang.bestellungen.length === 0) {
    abweichungen.push('Der Vorgang führt keine einzige Lieferantenbestellung');
  }

  // 1. Jede Bestellung trägt die Nummer des Vorgangs.
  for (const b of vorgang.bestellungen) {
    if (!String(b.nummer).startsWith(vorgang.vorgangsnummer)) {
      abweichungen.push(`Bestellnummer ${b.nummer} beginnt nicht mit ${vorgang.vorgangsnummer}`);
    }
  }

  // 2. Jede Bestellung nennt die Lieferadresse des Vorgangs — gelesen aus dem
  //    Text, der tatsächlich hinausgeht, nicht aus dem Objekt daneben.
  const soll = vorgang.auftrag.lieferadresse;
  for (const b of vorgang.bestellungen) {
    const a = leseBestellung(b.text).lieferadresse;
    if (!a) {
      abweichungen.push(`${b.nummer}: keine Lieferadresse im Bestelltext`);
      continue;
    }
    if (a.name !== soll.name) {
      abweichungen.push(`${b.nummer}: Lieferadresse lautet auf „${a.name}", der Vorgang auf „${soll.name}"`);
    }
    if (a.plzOrt !== `${soll.plz} ${soll.ort}`) {
      abweichungen.push(`${b.nummer}: Ware geht nach ${a.plzOrt}, der Vorgang nennt ${soll.plz} ${soll.ort}`);
    }
  }

  // 3. Der Beleg an den Kunden nennt den Kunden des Vorgangs.
  for (const [name, beleg] of [
    ['Angebot', vorgang.angebot],
    ['Auftragsbestätigung', vorgang.bestaetigung],
    ['Rechnung', vorgang.rechnung],
  ]) {
    if (!beleg) continue;
    const kopf = leseBelegkopf(beleg.text);
    if (kopf.empfaenger.length === 0) {
      abweichungen.push(`${name}: kein Empfänger im Text`);
      continue;
    }
    if (kopf.empfaenger[0] !== vorgang.kunde.firma) {
      abweichungen.push(
        `${name} geht an „${kopf.empfaenger[0]}", der Vorgang lautet auf „${vorgang.kunde.firma}"`,
      );
    }
  }

  // 3b. Die einzige Prüfung hier, die **zwei gerenderte Papiere** gegeneinander
  //     hält, statt beide gegen die Erklärung des Vorgangs. Der Unterschied ist
  //     derselbe wie bei der Gegenprobe am Beleg: Wer gegen die eigene
  //     Erklärung prüft, findet ein vertauschtes Papier, aber keinen Fehler in
  //     der Stelle, die die Erklärung erzeugt hat.
  //
  //     Sie gilt nur, solange Baustelle und Rechnungsanschrift dieselbe Firma
  //     nennen — heute erzwingt `baueAuftrag` das, im Streckengeschäft ist es
  //     auf Dauer die Ausnahme. Deshalb steht die Annahme als Feld am Vorgang
  //     und nicht als stille Voraussetzung im Code: Wer sie fallen lässt,
  //     schaltet die Prüfung bewusst ab, statt sie unbemerkt zu entwerten.
  if (vorgang.lieferungAnRechnungsempfaenger !== false && vorgang.rechnung) {
    const imBeleg = leseBelegkopf(vorgang.rechnung.text).empfaenger[0] ?? null;
    for (const b of vorgang.bestellungen) {
      const imAuftrag = leseBestellung(b.text).lieferadresse?.name ?? null;
      if (imBeleg !== null && imAuftrag !== null && imBeleg !== imAuftrag) {
        abweichungen.push(
          `${b.nummer}: Ware geht an „${imAuftrag}", die Rechnung an „${imBeleg}"`,
        );
      }
    }
  }

  // 4. Was wir bestellen, ist zusammen der Wareneinsatz des Warenkorbs.
  const bestellt = rund(vorgang.bestellungen.reduce((s, b) => s + b.einkaufNetto, 0));
  if (bestellt !== vorgang.warenkorb.einkaufNetto) {
    abweichungen.push(
      `Die Bestellungen summieren ${bestellt}, der Warenkorb weist ${vorgang.warenkorb.einkaufNetto} aus`,
    );
  }

  // 5. Was bestellt wird, ist zusammen das, was berechnet wird.
  const positionenBestellt = vorgang.bestellungen.reduce(
    (s, b) => s + leseBestellung(b.text).positionen.length,
    0,
  );
  const positionenBerechnet = vorgang.rechnung ? leseBeleg(vorgang.rechnung.text).zeilensummen.length : null;
  if (positionenBerechnet !== null && positionenBestellt !== positionenBerechnet) {
    abweichungen.push(
      `${positionenBestellt} Positionen werden bestellt, ${positionenBerechnet} berechnet — ` +
        'eine Position, die nicht bestellt wird, kommt auch nicht an',
    );
  }

  return { geschlossen: abweichungen.length === 0, abweichungen };
}

/**
 * Verrät ein Papier an den Kunden die Handelsspanne?
 *
 * Nachgewiesen, nicht befürchtet: Der Hinweis zum Mindestbestellwert nannte
 * neben einem Warenwert von 330 € den Satz „erreicht sind 231 €" — den
 * Einkaufswert. Daraus liest jeder Einkäufer 30 % Marge ab, und der Hersteller
 * steht mit Namen daneben. Über 1.005 von 1.533 geprüften Angeboten ging das
 * hinaus.
 *
 * Die Prüfung sucht die Beträge, die **nur der Betreiber kennen darf**, in den
 * Papieren, die **der Kunde bekommt**. Sie ist bewusst grob: Jede Schreibweise
 * eines Einkaufswerts zählt als Fund, auch eine zufällige. Ein Fehlalarm kostet
 * eine Minute Nachsehen; ein übersehener Betrag kostet die Verhandlungsposition
 * bei jedem Folgeauftrag.
 */
export function pruefeMargenleck(vorgang) {
  const wk = vorgang.warenkorb;
  const geheim = [
    { name: 'Wareneinsatz gesamt', betrag: wk.einkaufNetto },
    { name: 'Deckungsbeitrag', betrag: wk.deckungsbeitragNetto },
    ...wk.teillieferungen.map((t) => ({ name: `Einkauf ${t.lieferantName}`, betrag: t.einkaufNetto })),

    // **Ergänzt am 5. September: die Schranken, nicht nur die Werte.**
    //
    // Bis heute suchte diese Prüfung ausschließlich die **tatsächlichen**
    // Beträge. Auf dem Angebot stand daneben unbemerkt der Satz „frei Haus ab
    // 1500 € Bestellwert" — keiner der gesuchten Werte, aber eine Aussage über
    // sie: Ist die Frachtzeile 0,00 €, liegt unser Einkauf darüber, und der
    // Warenwert steht auf demselben Blatt.
    //
    // > **Eine Schranke auf einer geheimen Zahl ist eine Aussage über die
    // > geheime Zahl.**
    //
    // Gesucht wird die Schwelle unabhängig davon, ob sie im Vorgang erreicht
    // wurde: Auch „ab 1500 € entfällt die Fracht" auf einem Angebot über 400 €
    // nennt sie.
    ...wk.teillieferungen
      .filter((t) => t.frachtSchwelleNetto != null)
      .map((t) => ({ name: `Frei-Haus-Schwelle ${t.lieferantName}`, betrag: t.frachtSchwelleNetto })),
  ];

  const belege = [
    ['Angebot', vorgang.angebot],
    ['Auftragsbestätigung', vorgang.bestaetigung],
    ['Rechnung', vorgang.rechnung],
  ].filter(([, b]) => b && typeof b.text === 'string');

  const funde = [];
  for (const [name, beleg] of belege) {
    for (const g of geheim) {
      if (g.betrag === null || g.betrag === undefined || g.betrag === 0) continue;
      // Beide Schreibweisen: die rohe Zahl und die Euro-Darstellung. Umgeben von
      // Ziffern zählt der Treffer nicht — 231 in 1231,00 ist keiner.
      const formen = [String(g.betrag), g.betrag.toFixed(2).replace('.', ',')];
      const treffer = formen.some((f) =>
        new RegExp(`(^|[^\\d,.])${f.replace('.', '\\.')}($|[^\\d,])`).test(beleg.text),
      );
      if (treffer) funde.push(`${name}: ${g.name} (${g.betrag}) steht im Text`);
    }
  }

  return { dicht: funde.length === 0, funde };
}

/**
 * Stehen Daten eines Dritten in der Ablage?
 *
 * Die Ablage ist die **einzige Stelle, aus der nichts mehr verschwindet**:
 * § 131 BAO verlangt, dass der ursprüngliche Inhalt feststellbar bleibt, § 132
 * verlangt sieben Jahre Aufbewahrung. Eine Löschung nach Art. 17 DSGVO läuft
 * dort ins Leere — und muss es auch, denn Art. 17 Abs. 3 lit. b nimmt
 * gesetzliche Aufbewahrungspflichten aus.
 *
 * Genau deshalb gehört dorthin **nur, was die Aufbewahrungspflicht verlangt.**
 * Die Rufnummer des Ansprechpartners auf der Baustelle verlangt sie nicht. Wer
 * sie ins Journal schreibt, schafft einen Eintrag über einen Dritten, den
 * niemand mehr löschen kann und für den es keine Rechtsgrundlage gibt, ihn zu
 * behalten.
 *
 * Heute steht sie nicht drin — aber **aus Zufall, nicht aus Absicht**:
 * `ablageEintraege` legt nur den Betreff der Bestellung ab, nicht ihren Text.
 * Wer das einmal auf `b.text` ändert, um „mehr Nachvollziehbarkeit" zu haben,
 * hätte die Rufnummer für sieben Jahre unlöschbar im Journal. Diese Prüfung
 * macht aus dem Zufall eine Zusicherung.
 */
export function pruefeAblageAufDrittdaten(ablage, auftrag = {}) {
  const adresse = auftrag.lieferadresse ?? {};
  const abweichend = auftrag.lieferungAnRechnungsadresse === false;

  if (!abweichend) {
    return { dicht: true, funde: [], geprueft: 0, hinweis: 'Keine abweichende Baustelle — kein Dritter im Spiel' };
  }

  const geheim = [
    { name: 'Rufnummer des Ansprechpartners', wert: adresse.telefon },
    { name: 'Name der Baustelle', wert: adresse.name },
  ].filter((g) => typeof g.wert === 'string' && g.wert.trim().length >= 4);

  const funde = [];
  for (const e of ablage.eintraege) {
    for (const g of geheim) {
      if (String(e.text ?? '').includes(g.wert)) {
        funde.push(`Eintrag ${e.lfd} (${e.art}): ${g.name} steht im Journal`);
      }
    }
  }

  return { dicht: funde.length === 0, funde, geprueft: ablage.eintraege.length };
}

/**
 * Trägt die Fracht sich selbst?
 *
 * Die Kette hat zwei Seiten, und bisher hat niemand sie gegeneinander gehalten:
 * Der Kunde zahlt eine Fracht, die im Warenkorb gerechnet wird — der Lieferant
 * verlangt eine Fracht, die sich nach **seinen** Konditionen und nach dem Wert
 * **unserer** Bestellung richtet. Stimmen die beiden nicht überein, geht die
 * Differenz aus der Marge, und zwar unbemerkt: Auf keinem Beleg steht sie.
 *
 * Bewusst unabhängig gebaut. Die Funktion rechnet nicht mit `warenkorb.js`,
 * sondern liest den **Bestellwert aus dem gerenderten Bestelltext** zurück und
 * legt die Konditionen aus `lieferanten.json` darauf an. Ein Vorzeichenfehler
 * auf der einen Seite fällt damit auf, statt sich auf beiden Seiten gleich
 * auszuwirken.
 *
 * @param {object} bestellung  Eine Lieferantenbestellung mit `text`
 * @param {object} teil        Die zugehörige Teillieferung aus dem Warenkorb
 * @param {object} lieferant   Der Lieferantensatz mit `fracht`
 */
export function pruefeFrachtdeckung(bestellung, teil, lieferant) {
  const gelesen = leseBestellung(bestellung.text);
  const bestellwert = gelesen.einkaufNetto;
  const regel = lieferant.fracht;

  if (bestellwert === null) {
    return { gedeckt: false, grund: 'Im Bestelltext steht kein Warenwert', bestellwert: null };
  }

  const sperrgut = teil.positionen.filter((p) => p.sperrgut).length;
  const frachtLieferant =
    regel.freiHausAbNetto != null && bestellwert >= regel.freiHausAbNetto
      ? 0
      : rund(regel.pauschaleNetto + sperrgut * (regel.sperrgutZuschlagNetto ?? 0));

  const frachtKunde = teil.frachtNetto;
  const differenz = rund(frachtKunde - frachtLieferant);

  return {
    gedeckt: differenz === 0,
    bestellwert,
    schwelle: regel.freiHausAbNetto ?? null,
    frachtKunde,
    frachtLieferant,
    differenz,
    grund:
      differenz === 0
        ? 'Fracht deckt sich'
        : differenz < 0
          ? `Der Kunde zahlt ${frachtKunde} €, der Lieferant verlangt ${frachtLieferant} € — ` +
            `${-differenz} € gehen aus der Marge`
          : `Der Kunde zahlt ${frachtKunde} €, der Lieferant verlangt nur ${frachtLieferant} €`,
  };
}

/**
 * Die einzige wirklich unabhängige Gleichung.
 *
 * Vier der fünf Prüfungen oben nutzen dieselbe Arithmetik, die den Beleg
 * erzeugt hat — sie finden Fehler beim Rendern, nicht beim Rechnen. Hier ist es
 * anders: Der Bruttobetrag entsteht im Warenkorb als `netto + gerundete USt`,
 * hier als `netto × 1,2`. Zwei Wege, zwei Rundungen, dasselbe Ergebnis — oder
 * eben nicht.
 *
 * Der Cent, um den sich beide unterscheiden können, ist keine Spitzfindigkeit:
 * Er landet auf einer Rechnung, und eine Rechnung, deren Summen sich um einen
 * Cent widersprechen, ist ein Rechnungsmangel.
 */
export function pruefeBruttoUnabhaengig(warenkorb) {
  const direkt = rund(warenkorb.summeNetto * (1 + UST_SATZ));
  return {
    stimmig: direkt === warenkorb.summeBrutto,
    ueberSteuer: warenkorb.summeBrutto,
    direkt,
    abweichung: rund(direkt - warenkorb.summeBrutto),
  };
}

/**
 * Vergleicht den gelesenen Beleg mit dem gerechneten Warenkorb.
 *
 * Erst dieser Schritt prüft die Richtigkeit. Beide Wege müssen auf denselben
 * Cent kommen; wo sie es nicht tun, steht die Abweichung mit beiden Zahlen da.
 */
export function vergleicheMitWarenkorb(text, warenkorb) {
  const b = leseBeleg(text);
  const abweichungen = [];

  const paare = [
    ['Warenwert netto', b.warenwertNetto, warenkorb.warenwertNetto],
    ['Fracht netto', b.frachtNetto, warenkorb.frachtNetto],
    ['Summe netto', b.summeNetto, warenkorb.summeNetto],
    ['Umsatzsteuer', b.ust, warenkorb.ust],
    ['Gesamtbetrag', b.summeBrutto, warenkorb.summeBrutto],
  ];

  for (const [name, imText, gerechnet] of paare) {
    if (imText === undefined || imText === null) {
      abweichungen.push(`${name}: steht nicht im Text, gerechnet wurde ${gerechnet}`);
    } else if (imText !== gerechnet) {
      abweichungen.push(`${name}: im Text ${imText}, gerechnet ${gerechnet}`);
    }
  }

  const positionenGerechnet = warenkorb.teillieferungen.reduce((s, t) => s + t.positionen.length, 0);
  if (b.zeilensummen.length !== positionenGerechnet) {
    abweichungen.push(
      `Positionen: im Text ${b.zeilensummen.length}, im Warenkorb ${positionenGerechnet} — ` +
        'eine Position, die nicht gedruckt wird, wird auch nicht geliefert',
    );
  }

  return { deckungsgleich: abweichungen.length === 0, abweichungen };
}
