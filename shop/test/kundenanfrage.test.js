import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baueKundenanfrage, mailtoWeg, pruefeAnfrageAufGeheimnis, MAILTO_HOECHSTLAENGE }
  from '../src/kundenanfrage.js';
import { einheitText } from '../src/format.js';

/** Nur die Adresse — die Proben unten fragen meistens danach. */
const adresseVon = (a) => mailtoWeg(a).adresse;
import { kundenWarenkorb } from '../src/shopkern.js';

const katalog = JSON.parse(readFileSync(new URL('../data/katalog-baustoff.json', import.meta.url), 'utf8'));
const lieferanten = JSON.parse(readFileSync(new URL('../data/lieferanten.json', import.meta.url), 'utf8'));

/**
 * Die Preise stehen nicht im Katalog, sondern werden gerechnet. Für diese
 * Tests genügt ein einfacher, aber **echter** Aufschlag auf einen frei
 * gewählten Einkaufspreis — geprüft wird der Text, nicht die Kalkulation.
 */
function preisliste() {
  return katalog.artikel.map((a, i) => ({
    sku: a.sku,
    bezeichnung: a.bezeichnung,
    gruppe: a.gruppe,
    einheit: a.einheit,
    lieferantId: a.lieferantId,
    sperrgut: a.sperrgut,
    preisStand: a.preisStand,
    // Die Einkaufspreise liegen bewusst in einem Zahlenraum, den kein
    // Verkaufspreis und keine Summe dieses Korbs erreicht. Nicht um den Test
    // grün zu bekommen, sondern weil die Zahlenprüfung sonst Zufälle meldet:
    // Beim ersten Lauf war der Verkaufspreis des einen Artikels auf den Cent
    // der Einkaufspreis des anderen, und der Test schlug an, ohne dass im
    // Text ein Geheimnis stand.
    ekNetto: 9000 + i,
    vkNetto: Number(((10 + i) / 0.75).toFixed(2)),
    gewichtKg: i % 3 === 0 ? 25 : null,
  }));
}

const artikel = preisliste();
// Der Mindestbestellwert (Gate 25) steht hier bewusst niedrig: Diese Datei
// prüft den **Anfragetext**, nicht die Grenze. Mit den 250 € aus
// `data/betreiber.json` läge jeder Korb dieser Probe darunter, und zwanzig
// Testfälle prüften nur noch, dass die Sperre greift. Die Grenze selbst hat
// ihre eigenen Testfälle weiter unten.
const daten = { artikel, lieferanten: lieferanten.lieferanten, mindestbestellwertNetto: 5 };
const zwei = [{ sku: artikel[0].sku, menge: 3 }, { sku: artikel[1].sku, menge: 2 }];
const betreiber = { firma: 'Freudenthaler Bau GmbH', ort: 'Ried in der Riedmark', email: '' };

function anfrageFuer(zeilen, extra = {}) {
  const rechnung = kundenWarenkorb(zeilen, daten);
  return baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29', ...extra });
}

test('der Anfragetext nennt sich in der ersten Zeile Anfrage und keine Bestellung', () => {
  const a = anfrageFuer(zwei);
  assert.equal(a.moeglich, true);
  assert.match(a.text.split('\n')[0], /UNVERBINDLICHE ANFRAGE/);
  assert.match(a.text, /keine Bestellung/);
});

test('jede Position steht mit Menge, Einheit, Artikelnummer und Zeilensumme im Text', () => {
  const a = anfrageFuer(zwei);
  const rechnung = kundenWarenkorb(zwei, daten);
  // Zuerst die Länge: Eine Schleife über eine leere Liste prüft nichts und
  // meldet trotzdem Grün.
  assert.equal(rechnung.positionen, 2);
  assert.ok(rechnung.teillieferungen.length >= 1);
  let gezaehlt = 0;
  for (const teil of rechnung.teillieferungen) {
    assert.ok(teil.positionen.length >= 1);
    for (const p of teil.positionen) {
      gezaehlt++;
      assert.ok(a.text.includes(p.sku), `${p.sku} fehlt im Text`);
      assert.ok(a.text.includes(p.bezeichnung), `${p.bezeichnung} fehlt im Text`);
      // `einheitText`, nicht `p.einheit`: Der Kunde liest „Karton", nicht
      // „KRT". Bis zum 5. September stand hier das Kürzel — und dieselbe
      // Zusicherung hätte sie geprüft, wenn der Text sie getragen hätte.
      assert.ok(a.text.includes(`${String(p.menge).replace('.', ',')} ${einheitText(p.einheit)}`),
        `Menge von ${p.sku} fehlt`);
      assert.ok(a.text.includes(p.zeilensummeNetto.toFixed(2).replace('.', ',')),
        `Zeilensumme von ${p.sku} fehlt`);
    }
  }
  assert.equal(gezaehlt, 2);
});

test('die Summen im Text stimmen mit der Rechnung überein', () => {
  const rechnung = kundenWarenkorb(zwei, daten);
  const a = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29' });
  for (const wert of [rechnung.warenwertNetto, rechnung.frachtNetto, rechnung.nettoGesamt,
    rechnung.ustBetrag, rechnung.bruttoGesamt]) {
    assert.ok(a.text.includes(wert.toFixed(2).replace('.', ',')),
      `${wert} fehlt im Anfragetext`);
  }
});

test('ohne Bezirk und mit leerem Korb entsteht kein Text, sondern ein Hindernis', () => {
  const rechnung = kundenWarenkorb(zwei, daten);
  const ohneBezirk = baueKundenanfrage({ rechnung, bezirk: '', betreiber });
  assert.equal(ohneBezirk.moeglich, false);
  assert.equal(ohneBezirk.text, '');
  assert.match(ohneBezirk.hindernis, /Bezirk/);

  const leer = baueKundenanfrage({ rechnung: kundenWarenkorb([], daten), bezirk: 'Perg', betreiber });
  assert.equal(leer.moeglich, false);
  assert.match(leer.hindernis, /leer/);
});

test('Gate 23: aus einem Bezirk außerhalb des Liefergebiets entsteht kein Anfragetext', () => {
  const rechnung = kundenWarenkorb(zwei, daten);
  const a = baueKundenanfrage({ rechnung, bezirk: 'Innsbruck-Land', betreiber });
  assert.equal(a.moeglich, false);
  assert.equal(a.text, '');
  assert.ok(a.hindernis.length > 10);
});

test('der Text nennt den Preisstand und dass die Preise freibleibend sind', () => {
  const a = anfrageFuer(zwei);
  assert.match(a.text, /Preisstand der Positionen: \d{4}-\d{2}-\d{2}/);
  assert.match(a.text, /freibleibend/);
});

test('kein Einkaufspreis und kein Wort der Kalkulation steht im Anfragetext', () => {
  // Der ganze Bestand, nicht zwei Positionen: Was hier durchrutscht, rutscht
  // sonst genau bei dem Artikel durch, den niemand geprüft hat.
  const alle = artikel.map((a) => ({ sku: a.sku, menge: 1 }));
  const a = anfrageFuer(alle);
  assert.equal(a.moeglich, true);
  assert.deepEqual(pruefeAnfrageAufGeheimnis(a.text, artikel), []);
  // Und die Gegenrichtung: Der Text ist nicht deshalb sauber, weil er kurz
  // ist. Er trägt jede der 46 Positionen.
  for (const p of artikel) assert.ok(a.text.includes(p.sku), `${p.sku} fehlt`);
});

test('die Geheimnisprüfung schlägt an, wenn ein Einkaufspreis im Text steht', () => {
  // Gegenprobe: Ohne sie wäre der Test darüber auch dann grün, wenn die
  // Prüfung gar nichts sucht.
  const treffer = pruefeAnfrageAufGeheimnis('Zeile mit 10,00 € darin', [{ sku: 'X', ekNetto: 10 }]);
  assert.equal(treffer.length, 1);
  assert.match(treffer[0], /Einkaufspreis/);
  assert.equal(pruefeAnfrageAufGeheimnis('enthält das Wort Marge', []).length, 1);
});

test('ohne hinterlegte E-Mail-Adresse gibt es keine mailto-Adresse, aber einen Hinweis', () => {
  const a = anfrageFuer(zwei);
  assert.equal(a.empfaenger, null);
  assert.equal(adresseVon(a), null);
  assert.ok(a.hinweise.some((h) => /E-Mail-Adresse/.test(h)));
});

test('mit Adresse entsteht eine mailto-Adresse, die Betreff und Text trägt', () => {
  // **Eine Position statt zwei, seit dem 02.09.** Der Anfragetext trägt jetzt
  // den Satz „Die Fracht kostet hier mehr als die Ware", sobald das zutrifft —
  // und in dieser Probe trifft es zu, weil die Prüfpreise klein sind. Der Satz
  // kostet rund zweihundert Zeichen in der Adresse.
  //
  // **Ohne den Kleinmengensatz, seit dem 05.09.** Die Frachtzeile trägt jetzt
  // auch im Einzellieferungsfall ihren Grund — noch einmal gut hundert
  // Zeichen. Ein Korb, der die Fracht trägt, hat den Kleinmengensatz nicht
  // und behält den Knopf; genau so ein Korb steht hier.
  const a = anfrageFuer([{ sku: artikel[0].sku, menge: 60 }],
    { betreiber: { ...betreiber, email: 'office@example.at' } });
  const adresse = adresseVon(a);
  assert.ok(adresse.startsWith('mailto:office%40example.at?subject='));
  assert.ok(adresse.includes(encodeURIComponent('UNVERBINDLICHE ANFRAGE')));
  assert.ok(adresse.length <= MAILTO_HOECHSTLAENGE);
});

test('eine lange Liste bekommt keine mailto-Adresse, statt einer stillschweigend gekürzten', () => {
  const alle = artikel.map((a) => ({ sku: a.sku, menge: 1 }));
  const a = anfrageFuer(alle, { betreiber: { ...betreiber, email: 'office@example.at' } });
  assert.equal(a.moeglich, true);
  assert.ok(a.text.length > 1000);
  assert.equal(adresseVon(a), null,
    'Eine gekürzte Positionsliste in der Mail wäre schlimmer als kein Knopf');
});

test('das Gewicht steht im Text und sagt dazu, für wie viele Positionen es fehlt', () => {
  const a = anfrageFuer(zwei);
  const rechnung = kundenWarenkorb(zwei, daten);
  // Der Korb ist so gewählt, dass beide Fälle vorkommen: eine Position mit
  // hinterlegtem Gewicht und eine ohne. Stünden die Zusicherungen in einem
  // `if`, prüfte der Test nichts, sobald die Auswahl sich ändert — deshalb
  // steht die Voraussetzung als eigene Zusicherung da.
  assert.ok(rechnung.gewichtKg > 0, 'der Prüfkorb muss ein bekanntes Gewicht enthalten');
  assert.ok(rechnung.positionenOhneGewicht > 0, 'und eine Position ohne Gewicht');
  assert.match(a.text, /Gewicht/);
  assert.match(a.text, /nicht hinterlegt/);
});

test('Mengen stehen mit Komma und lesbarer Einheit im Anfragetext', () => {
  // Bis zum 29.08. stand hier „5.25 M2": der Punkt aus JavaScript und das
  // Kürzel aus dem Katalog. Ein Text, der an einen Kunden geht, schreibt
  // nicht in Datenbankschreibweise.
  const rechnung = kundenWarenkorb([{ sku: artikel[0].sku, menge: 5.25 }], daten);
  const a = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29' });
  assert.match(a.text, /5,25 m²/);
  assert.ok(!a.text.includes('5.25'), 'kein Dezimalpunkt im Kundentext');
});

test('ein unbekanntes Kürzel bleibt stehen, statt zu verschwinden', () => {
  // **Umgebaut am 5. September.** Vorher hieß dieser Fall „ohne
  // Einheitentabelle": Die Tafel kam als Aufrufparameter mit Vorgabewert
  // `{}`, und wer sie vergaß, bekam die Kürzel des Lieferanten in einen
  // Kundentext. Genau das tat `bin/belegpruefung.mjs`, der einzige Prüfer
  // über diesen Text — *er las eine Fassung, die es beim Kunden nie gab.*
  //
  // Die Schutzabsicht bleibt, nur eine Ebene tiefer: `einheitText` reicht ein
  // **unbekanntes** Kürzel durch, statt es zu raten.
  const fremd = [{ ...artikel[0], sku: 'X-1', einheit: 'PAL' }];
  const rechnung = kundenWarenkorb([{ sku: 'X-1', menge: 2 }],
    { ...daten, artikel: fremd });
  const a = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-29' });
  assert.ok(a.text.includes('2 PAL'), 'lieber das Kürzel als eine geratene Einheit');
});


/* ------------------------------------------------------------------ *
 * Kein Name klebt an der Artikelnummer
 * ------------------------------------------------------------------ */

test('ein langer Artikelname läuft nicht in die Artikelnummer', () => {
  // **Der Befund vom 30.08.:** 12 der 46 Artikel tragen einen Namen, der
  // länger ist als die Namensspalte — der längste hat 96 Zeichen. Die Spalte
  // gab bei Überlänge den Text ohne ein einziges Leerzeichen zurück, und die
  // Nummer klebte daran: `…186 M 25 kgPOS-11283`.
  //
  // Dieser Text ist der einzige Weg, auf dem heute eine Bestellung zustande
  // kommt: Der Kunde kopiert ihn und schickt ihn. Die Artikelnummer ist das
  // Feld, an dem wir die Ware erkennen.
  const lang = { ...artikel[0], bezeichnung: 'Capatect Polystyrol-Rondelle für Capatect Universaldübel Rondelle und Capatect Schraubdübel Holz' };
  const rechnung = kundenWarenkorb([{ sku: lang.sku, menge: 2 }],
    { ...daten, artikel: [lang, ...artikel.slice(1)] });
  const text = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-30' }).text;
  assert.match(text, new RegExp(`\\s${lang.sku}\\s`), 'die Artikelnummer steht ohne Leerzeichen davor');
  // Und der Name ist vollständig wiederherstellbar, Wort für Wort.
  const woerter = lang.bezeichnung.split(' ');
  assert.ok(woerter.length >= 10, `nur ${woerter.length} Wörter im Probenamen`);
  for (const wort of woerter) {
    assert.ok(text.includes(wort), `„${wort}" fehlt im Anfragetext`);
  }
});

test('jede Artikelnummer des ganzen Bestands steht frei', () => {
  // Nicht an einem ausgesuchten Artikel, sondern an allen: Ein Korb mit dem
  // vollständigen Sortiment, und keine Nummer darf an Text kleben.
  const alle = artikel.map((a) => ({ sku: a.sku, menge: 1 }));
  assert.ok(alle.length >= 40, `nur ${alle.length} Artikel im Korb`);
  const rechnung = kundenWarenkorb(alle, daten);
  const text = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-30' }).text;
  assert.ok(artikel.length >= 40, `nur ${artikel.length} Artikel zu prüfen`);
  for (const a of artikel) {
    assert.match(text, new RegExp(`\\s${a.sku}\\s`), `${a.sku} klebt an einem Nachbarn`);
  }
});

test('die Beträge stehen in allen Zeilen an derselben Stelle', () => {
  // Der Grund für die feste Spaltenbreite: Ein Bauleiter überfliegt die
  // rechte Kante. Läuft eine Zeile aus, ist die Summenspalte wertlos.
  const lang = { ...artikel[0], bezeichnung: 'Ein sehr langer Name mit vielen Wörtern, der die Spalte deutlich überschreitet und umbrechen muss' };
  const rechnung = kundenWarenkorb([{ sku: lang.sku, menge: 2 }, { sku: artikel[1].sku, menge: 1 }],
    { ...daten, artikel: [lang, ...artikel.slice(1)] });
  const text = baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-30' }).text;
  const positionszeilen = text.split('\n').filter((z) => /POS-|A-\d/.test(z) && z.includes('€'));
  assert.ok(positionszeilen.length >= 2, `nur ${positionszeilen.length} Positionszeilen`);
  const spalten = positionszeilen.map((z) => z.indexOf(z.trim().match(/\S+$/)[0]));
  assert.equal(new Set(spalten).size, 1, `die Summenspalte steht bei ${[...new Set(spalten)].join(' und ')}`);
});


/* ------------------------------------------------------------------ *
 * Zwei Lieferanten sind zwei Anfahrten
 * ------------------------------------------------------------------ */

/** Ein Korb, dessen Positionen aus zwei Sortimenten kommen. */
function zweiLieferanten() {
  const umgehaengt = artikel.map((a, i) => (i === 1 ? { ...a, lieferantId: 'zubehoer-de' } : a));
  const rechnung = kundenWarenkorb(
    [{ sku: umgehaengt[0].sku, menge: 2 }, { sku: umgehaengt[1].sku, menge: 3 }],
    { ...daten, artikel: umgehaengt },
  );
  return { rechnung, text: baueKundenanfrage({ rechnung, bezirk: 'Perg', betreiber, datum: '2026-08-30' }).text };
}

test('zwei Teillieferungen stehen als zwei Lieferungen im Text', () => {
  // **Gemessen am 30.08.:** Ein Korb aus zwei Sortimenten ergibt zwei
  // Teillieferungen — zwei Anfahrten, zwei Termine —, und der Text nannte
  // eine einzige Zeile „Zustellung 95,00 €". Der Rechenkern wusste es, der
  // Text verschwieg es.
  //
  // Heute führt der Katalog einen Lieferanten. Der Fall kommt mit der
  // Artikelliste des Auftraggebers, und dann soll er richtig sein.
  const { rechnung, text } = zweiLieferanten();
  assert.equal(rechnung.teillieferungen.length, 2, 'die Probe erzwingt zwei Teillieferungen');
  assert.match(text, /Lieferung 1 von 2/);
  assert.match(text, /Lieferung 2 von 2/);
  assert.match(text, /Zustellung 1\s+[\d.,]+ €/);
  assert.match(text, /Zustellung 2\s+[\d.,]+ €/);
  assert.match(text, /Zustellung gesamt/);
  assert.match(text, /in 2 getrennten Lieferungen/);
});

test('die Teilfrachten ergeben zusammen die Gesamtfracht', () => {
  // Sonst stünde eine Aufteilung da, die nicht aufgeht — schlimmer als gar
  // keine.
  const { rechnung, text } = zweiLieferanten();
  const summe = rechnung.teillieferungen.reduce((s, t) => s + t.frachtNetto, 0);
  assert.equal(Math.round(summe * 100), Math.round(rechnung.frachtNetto * 100));
  const genannt = [...text.matchAll(/Zustellung \d\s+([\d.,]+) €/g)].map((m) => Number(m[1].replace('.', '').replace(',', '.')));
  assert.equal(genannt.length, 2, `${genannt.length} Teilfrachten im Text`);
  assert.equal(Math.round(genannt.reduce((a, b) => a + b, 0) * 100), Math.round(rechnung.frachtNetto * 100));
});

test('bei einem Lieferanten bleibt der Text wie er war', () => {
  // Die Aufteilung ist die Ausnahme, nicht die Regel. Ein Korb aus einem
  // Sortiment darf keine Lieferungsnummern tragen.
  const text = anfrageFuer(zwei).text;
  assert.ok(!text.includes('Lieferung 1 von'), 'einzelne Lieferung wird durchnummeriert');
  assert.ok(!text.includes('Zustellung gesamt'), 'eine Fracht braucht kein „gesamt"');
  assert.match(text, /Zustellung\s+[\d.,]+ €/);
});

test('kein Lieferantenname steht im Text', () => {
  // Geheim ist nicht die Geschäftsbeziehung, geheim sind die Konditionen —
  // dieselbe Grenze wie in `oeffentlicherLieferant`. Die Aufteilung nennt
  // deshalb Nummern, keine Namen.
  const { text } = zweiLieferanten();
  const namen = lieferanten.lieferanten.map((l) => l.name).filter(Boolean);
  assert.ok(namen.length >= 3, `nur ${namen.length} Lieferantennamen zu prüfen`);
  for (const name of namen) assert.ok(!text.includes(name), `„${name}" steht im Anfragetext`);
  for (const l of lieferanten.lieferanten) assert.ok(!text.includes(l.id), `„${l.id}" steht im Anfragetext`);
});

/* ------------------------------------------------------------------ *
 * Der Mailknopf, gemessen — Befund vom 1. September
 *
 * `MAILTO_HOECHSTLAENGE` gab es seit Beginn, die Begründung dazu auch. Was
 * es nie gab, ist die Zahl daneben: **ab welcher Position verschwindet der
 * Knopf?** Gemessen am echten Katalog (46 Artikel, bestätigte Preise) ist die
 * Antwort **drei**. Der Bezugswarenkorb der Wirtschaftlichkeitsrechnung liegt
 * bei 650 € netto und damit bei rund elf Positionen.
 *
 * > **Der Mailknopf trägt keine Bestellung, für die dieser Handel gebaut
 * > ist.** Er trägt die Nachbestellung von ein, zwei vergessenen Positionen —
 * > und das ist ein echter Fall, nur nicht der Regelfall.
 *
 * Diese Proben halten die Schwelle fest. Wer `MAILTO_HOECHSTLAENGE` erhöht,
 * um „den Knopf endlich sichtbar zu machen", verschiebt sie nicht, sondern
 * schaltet die stillschweigende Kürzung im Mailprogramm frei — der Kunde
 * verschickt dann eine halbe Positionsliste und merkt nichts.
 * ------------------------------------------------------------------ */

// Mit Empfängeradresse. Ohne sie fällt der Knopf ohnehin weg — die
// E-Mail-Adresse ist bis heute einer der vier offenen Impressumspunkte, und
// der erste Anlauf dieser Probe ist genau darüber gestolpert. Gemessen werden
// soll die **Länge**, nicht die fehlende Adresse.
const mailKorb = (n) =>
  anfrageFuer(artikel.slice(0, n).map((a) => ({ sku: a.sku, menge: 3 })), {
    betreiber: { ...betreiber, email: 'bestellung@bauversand.com' },
  });

test('Ohne hinterlegte Adresse gibt es den Knopf gar nicht', () => {
  assert.equal(betreiber.email, '', 'die Vorlage dieser Proben hat bewusst keine Adresse');
  assert.equal(adresseVon(anfrageFuer([{ sku: artikel[0].sku, menge: 3 }])), null);
});

/*
 * **Verschoben am 02.09.** Vorher: bis zwei Positionen mit Knopf, ab drei
 * ohne. Der Anfragetext trägt seither den Kleinmengensatz, sobald die Fracht
 * die Ware übersteigt — in diesen Körben ist das so, und der Satz kostet
 * rund zweihundert Zeichen in der Adresse.
 *
 * Das ist der bewusst gezahlte Preis: **Der Hinweis wiegt schwerer als die
 * Abkürzung.** Er entfällt genau dort, wo der Shop dem Kunden ohnehin sagt,
 * dass sich diese Lieferung für ihn nicht lohnt; der kopierbare Text bleibt
 * in jedem Fall. Bei einem Korb, der die Fracht trägt, ändert sich nichts —
 * dann steht der Satz gar nicht im Text.
 *
 * **Noch einmal verschoben am 05.09., und dieselbe Abwägung.** Die
 * Frachtzeile nannte ihren Grund nur bei mehreren Lieferungen — also nie,
 * denn der Katalog führt einen Lieferanten. Seit heute steht er auch im
 * Regelfall da, und in einem Korb, in dem palettierte Ware liegt, sind das
 * gut hundert weitere Zeichen. Damit verliert **auch der Ein-Positionen-Korb
 * mit Kleinmengensatz** den Knopf.
 *
 * Zwei Sätze kosten ihn, und beide sagen dem Kunden etwas, das er sonst
 * nirgends erfährt. Die Antwort auf das Schrumpfen ist deshalb nicht, den
 * Text zu kürzen, sondern das, was diese Runde tut: **dem Kunden sagen,
 * warum der Knopf fehlt** (`mailtoWeg().text`), statt ihn wortlos
 * wegzulassen.
 */
test('Ein Korb ohne Kleinmengensatz behält den Knopf', () => {
  // Nicht die Zahl der Positionen entscheidet allein, sondern die Länge —
  // und die hängt an den Sätzen, die der Text tragen muss.
  const gross = anfrageFuer([{ sku: artikel[0].sku, menge: 60 }], {
    betreiber: { ...betreiber, email: 'bestellung@bauversand.com' },
  });
  assert.ok(!/mehr als die Ware/.test(gross.text), 'Vorbedingung: kein Kleinmengensatz');
  assert.ok(adresseVon(gross), 'ein Korb, der die Fracht trägt');
});

test('Mit Kleinmengensatz gibt es ihn ab der ersten Position nicht mehr', () => {
  for (const n of [1, 2, 3, 5, 8]) {
    assert.equal(adresseVon(mailKorb(n)), null, `${n} Positionen`);
  }
});

test('Wo der Knopf fehlt, steht der Grund', () => {
  // **Der eigentliche Fund vom 5. September.** Die Schwelle ist seit dem
  // 1. September gemessen und begründet; niemand hatte je gesagt, dass der
  // Kunde nichts davon erfährt. `bin/website.mjs` legt sich zum
  // Schwesterfall ausdrücklich fest: Die Oberfläche solle sagen, *warum*
  // kein Mailknopf da ist, statt ihn stillschweigend wegzulassen.
  const ohneAdresse = mailtoWeg(anfrageFuer([{ sku: artikel[0].sku, menge: 3 }]));
  assert.equal(ohneAdresse.grund, 'keine-adresse');
  assert.match(ohneAdresse.text, /kopieren/);

  const zuLang = mailtoWeg(mailKorb(8));
  assert.equal(zuLang.grund, 'zu-lang');
  assert.match(zuLang.text, /kürzen ihn/);

  const geht = mailtoWeg(anfrageFuer([{ sku: artikel[0].sku, menge: 60 }],
    { betreiber: { ...betreiber, email: 'bestellung@bauversand.com' } }));
  assert.equal(geht.grund, null);
  assert.equal(geht.text, '', 'wo der Knopf da ist, braucht es keinen Grund');
});

test('Die Oberfläche zeigt den Grund, statt den Knopf wegzulassen', () => {
  const ui = readFileSync(new URL('../shop-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /mailtoWeg\(/, 'sonst kennt sie den Grund gar nicht');
  assert.match(ui, /weg\.text/, 'und schreibt ihn nicht hin');
});

test('Ein Korb, der die Fracht trägt, verliert den Knopf nicht', () => {
  // Die Gegenrichtung, und sie ist die wichtigere: Der Kleinmengensatz darf
  // nur dort Platz kosten, wo er etwas sagt.
  const gross = anfrageFuer([{ sku: artikel[0].sku, menge: 60 }], {
    betreiber: { ...betreiber, email: 'bestellung@bauversand.com' },
  });
  assert.ok(!/mehr als die Ware/.test(gross.text), 'der Satz steht zu Unrecht im Text');
  assert.ok(adresseVon(gross), 'der Knopf fehlt, obwohl der Korb die Fracht trägt');
});

test('Der Kopiertext bleibt in jeder Größe da — er ist der Weg, nicht die Abkürzung', () => {
  for (const n of [1, 3, 8]) {
    const a = mailKorb(n);
    assert.equal(a.moeglich, true);
    assert.ok(a.text.length > 200, `${n} Positionen: ${a.text.length} Zeichen`);
  }
});

test('Die Grenze liegt unter dem, was Mailprogramme stillschweigend kürzen', () => {
  // Kein Selbstzweck: Die Zahl ist eine Vorsichtsentscheidung, keine Messung
  // an einem Mailprogramm. Sie gehört nach oben begrenzt, damit sie nicht
  // eines Tages „zur Sicherheit" auf 4000 wandert.
  assert.ok(MAILTO_HOECHSTLAENGE <= 2000, `${MAILTO_HOECHSTLAENGE} ist über dem, was Outlook verlässlich trägt`);
  assert.ok(MAILTO_HOECHSTLAENGE >= 1000, 'unter 1000 trägt der Knopf gar nichts mehr');
});

/**
 * Der Einkaufspreis in einer größeren Zahl ist keiner.
 *
 * **Der Anlass, 3. September 2026.** Beim ersten Lauf dieser Prüfung an einem
 * echten Anfragetext meldete sie den Einkaufspreis 3,68 € eines Artikels, der
 * in diesem Warenkorb gar nicht vorkommt. Gefunden hatte sie ihn in der Zeile
 * `USt                   153,68 €`.
 *
 * > **Ein Fehlalarm, der bei jedem Lauf kommt, bringt den Leser dazu, die
 * > Meldung zu überblättern — und mit ihr die echte.**
 */
test('eine Einkaufszahl im Innern einer größeren Zahl ist kein Treffer', () => {
  const artikel = [{ sku: 'X', ekNetto: 3.68 }];
  assert.deepEqual(pruefeAnfrageAufGeheimnis('USt                   153,68 €', artikel), []);
  assert.deepEqual(pruefeAnfrageAufGeheimnis('Summe 3,681 €', artikel), []);
  // Und die Gegenprobe: als eigene Zahl gefunden werden muss sie weiterhin.
  const alleine = pruefeAnfrageAufGeheimnis('Einstand 3,68 € je Stück', artikel);
  assert.equal(alleine.length, 1, JSON.stringify(alleine));
  assert.match(alleine[0], /3,68/);
  // Auch am Zeilenanfang und am Zeilenende, wo kein Zeichen davor oder danach
  // steht — die Grenzprüfung darf nicht am Rand versagen.
  assert.equal(pruefeAnfrageAufGeheimnis('3,68', artikel).length, 1);
});
