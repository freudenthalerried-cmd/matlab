import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import {
  KLEINBETRAG_GRENZE_BRUTTO,
  UID_EMPFAENGER_GRENZE_BRUTTO,
  erforderlicheMerkmale,
  pruefeRechnungsmerkmale,
  erzeugeAngebot,
  erzeugeRechnung,
  darfRechnungGestelltWerden,
  reihengeschaeftEinordnung,
  erzeugeAuftragsbestaetigung,
  darfBestaetigtWerden,
  zahlungsvermerk,
  zahlwegIstVorkasse,
  angeboteneZahlwege,
} from '../src/beleg.js';
import { zahlwegName } from '../src/zahlung.js';

const lies = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const daten = { lieferanten: lies('../data/lieferanten.json'), artikel: lies('../data/artikel.json') };
const katalog = ladeKatalog(daten, 0.35);

const korb = berechneWarenkorb(
  [
    { sku: katalog.artikel[0].sku, menge: 5 },
    { sku: katalog.artikel.find((a) => a.lieferantId !== katalog.artikel[0].lieferantId).sku, menge: 10 },
  ],
  katalog,
);

// **Zerlegt am 02.09.** Hier stand die ganze Anschrift in einem Feld:
// `firma: 'Musterfirma GmbH, Musterweg 1, 4600 Wels'`. Das war der Beleg
// dafür, dass die Anschrift dorthin gehört — und zugleich der Grund, weshalb
// niemand gemerkt hat, dass der echte Betreiber nur seinen Namen druckt:
// Die Probe füllte ein Feld, das der Bau gar nicht als Anschrift ausgibt.
const betreiber = {
  firma: 'Musterfirma GmbH',
  strasse: 'Musterweg 1',
  plz: '4600',
  ort: 'Wels',
  uid: 'ATU12345675',
  // **Ergänzt am 4. September, spät.** Die Auftragsbestätigung ist das
  // Dokument, auf das hin der Kunde zahlt, und trägt seither die
  // Bankverbindung. Eine Probe, die „nichts fehlt" behauptet, muss alles
  // mitbringen, was das Papier braucht — sonst prüft sie eine Lücke weniger.
  kontoinhaber: 'Musterfirma GmbH',
  iban: 'AT611904300234573201',
};
const kunde = {
  firma: 'Bau Muster GmbH',
  strasse: 'Baustellenweg 7',
  plz: '4600',
  ort: 'Wels',
  uid: 'ATU12345675',
};

test('Bis 400 Euro brutto genügen die sechs Angaben der Kleinbetragsrechnung', () => {
  const noetig = erforderlicheMerkmale(KLEINBETRAG_GRENZE_BRUTTO);
  assert.equal(noetig.length, 6);
  assert.ok(!noetig.some((m) => m.feld === 'rechnungsnummer'));
  assert.ok(!noetig.some((m) => m.feld === 'empfaengerName'));
});

test('Über 400 Euro kommen Nummer, Empfänger und getrennte Steuer dazu', () => {
  const noetig = erforderlicheMerkmale(KLEINBETRAG_GRENZE_BRUTTO + 0.01);
  assert.equal(noetig.length, 10);
  assert.ok(noetig.some((m) => m.feld === 'rechnungsnummer'));
  assert.ok(!noetig.some((m) => m.feld === 'empfaengerUid'));
});

test('Erst über 10.000 Euro wird die UID des Empfängers verlangt', () => {
  assert.ok(!erforderlicheMerkmale(UID_EMPFAENGER_GRENZE_BRUTTO).some((m) => m.feld === 'empfaengerUid'));
  assert.ok(erforderlicheMerkmale(UID_EMPFAENGER_GRENZE_BRUTTO + 0.01).some((m) => m.feld === 'empfaengerUid'));
});

test('Die Prüfung benennt jede fehlende Pflichtangabe einzeln', () => {
  const p = pruefeRechnungsmerkmale({ bruttobetrag: 3900 });
  assert.equal(p.vollstaendig, false);
  assert.equal(p.kleinbetrag, false);
  assert.equal(p.empfaengerUidNoetig, false);
  assert.ok(p.fehlendeFelder.includes('rechnungsnummer'));
  assert.ok(p.fehlendeFelder.includes('ausstellerUid'));
});

test('Ein Betrag von null gilt nicht als ausgefüllte Angabe fürs Entgelt', () => {
  // Number.isFinite(0) ist true — der Betrag zählt als vorhanden, das ist richtig.
  const p = pruefeRechnungsmerkmale({ bruttobetrag: 0, ausstellerName: 'A', leistung: 'x', lieferdatum: '1.1.', ausstellungsdatum: '1.1.', steuersatz: '20 %' });
  assert.equal(p.vollstaendig, true);
  assert.equal(p.kleinbetrag, true);
});

test('Das Angebot trägt eine Bindefrist und weist die Teillieferungen aus', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  assert.match(a.text, /Bindefrist: 14 Tage/);
  assert.match(a.text, /Angebot AN-0001/);
  assert.equal(a.bruttobetrag, korb.summeBrutto);
  assert.ok(korb.teillieferungen.length >= 2, 'sonst prüft die Schleife keinen zweiten Lieferanten');
  for (const teil of korb.teillieferungen) {
    assert.ok(a.text.includes(teil.lieferantName), `${teil.lieferantName} fehlt im Angebot`);
  }
});

test('Das Angebot enthält keine Rechnungsnummer', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  assert.ok(!/Rechnung/.test(a.text), 'ein Angebot ist keine Rechnung');
});

test('Angebot und Rechnung stimmen im Betrag mit dem Warenkorb überein', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  assert.equal(a.bruttobetrag, r.bruttobetrag);
  const gerundet = korb.summeBrutto.toFixed(2).replace('.', ',');
  assert.ok(a.text.includes(gerundet) && r.text.includes(gerundet));
});

// Seit dem 1. September gehört die Zahlungsangabe dazu. Der Test hat den
// Wechsel angezeigt: Er lief vorher grün über einen Beleg, dem der
// Zahlungsvermerk fehlte — weil „vollständig" bis dahin nur § 11 UStG meinte.
test('Eine vollständige Rechnung enthält keine Lückenmarkierung', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber,
    zahlung: { weg: 'eps', datum: '20.08.2026', kennzeichen: 'AB-0001' },
  });
  assert.equal(r.vollstaendig, true);
  assert.ok(!r.text.includes('FEHLT'));
  assert.match(r.text, /§ 377 UGB/);
});

test('Ohne Betreiberdaten bleiben die Lücken in der Rechnung sichtbar', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber: {} });
  assert.equal(r.vollstaendig, false);
  assert.match(r.text, /\[\[ UID des Ausstellers — FEHLT \]\]/);
});

test('Platzhalterpreise verhindern die Rechnung so wie die Bestellung', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  const f = darfRechnungGestelltWerden(korb, r);
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Platzhalterpreise/.test(g)));
});

test('Ohne Lieferung wird kein Lieferdatum bescheinigt', () => {
  const r = erzeugeRechnung(korb, { nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber });
  const f = darfRechnungGestelltWerden(korb, r, { geliefert: false });
  assert.ok(f.gruende.some((g) => /Lieferung noch nicht erfolgt/.test(g)));
});

test('Auslandslieferanten machen das Streckengeschäft zum Reihengeschäft', () => {
  const e = reihengeschaeftEinordnung(korb, katalog);
  assert.equal(e.reihengeschaeft, true);
  assert.equal(e.uidPflicht, true);
  assert.ok(e.hinweise.some((h) => /innergemeinschaftlicher Erwerb/.test(h)));
  assert.ok(e.betroffeneLieferanten.every((id) => katalog.lieferantenById.get(id).land !== 'AT'));
});

test('Ein rein österreichischer Warenkorb ist kein Reihengeschäft', () => {
  const inland = katalog.artikel.find((a) => katalog.lieferantenById.get(a.lieferantId).land === 'AT');
  const nurInland = berechneWarenkorb([{ sku: inland.sku, menge: 20 }], katalog);
  const e = reihengeschaeftEinordnung(nurInland, katalog);
  assert.equal(e.reihengeschaeft, false);
  assert.deepEqual(e.hinweise, []);
});

test('Jeder Lieferant trägt ein Land — ohne das ist die Steuerfrage nicht zu stellen', () => {
  // Bewusst keine Anzahl geprüft: Der Testname verspricht „jeder", und eine
  // feste Zahl bricht, sobald ein Lieferant dazukommt — ohne dass die
  // zugesicherte Eigenschaft verletzt wäre. Geprüft wird stattdessen, dass
  // überhaupt Lieferanten da sind und alle die Eigenschaft tragen.
  assert.ok(daten.lieferanten.lieferanten.length > 0, 'keine Lieferanten geladen');
  for (const l of daten.lieferanten.lieferanten) {
    assert.match(l.land, /^[A-Z]{2}$/, `${l.id} hat kein Land`);
  }
});

/* ------------------------------------------------------------------ *
 * Auftragsbestätigung — das Papier, mit dem der Vertrag zustande kommt
 *
 * Es hat gefehlt, obwohl Punkt 2 der eigenen AGB darauf verweist. Der Ablauf
 * ging vom Zahlungseingang direkt zur Lieferantenbestellung: Geld genommen,
 * bevor nach den eigenen Bedingungen ein Vertrag bestand.
 * ------------------------------------------------------------------ */

test('Die Auftragsbestätigung sagt ausdrücklich, wann der Vertrag zustande kommt', () => {
  const b = erzeugeAuftragsbestaetigung(korb, {
    nummer: 'AB-2026-0001', datum: '2026-08-16', kunde: kunde, betreiber: betreiber,
  });
  assert.match(b.text, /Vertrag zustande/);
  assert.match(b.text, /Punkt 2/);
});

test('Sie nennt die längste Lieferzeit, nicht nur die einzelnen', () => {
  // Der Bauleiter kann erst arbeiten, wenn das letzte Teil da ist. Angebot und
  // Rechnung nennen die Lieferzeit je Hersteller; keiner nennt das Maximum.
  const b = erzeugeAuftragsbestaetigung(korb, {
    nummer: 'AB-2026-0001', datum: '2026-08-16', kunde: kunde, betreiber: betreiber,
  });
  const einzeln = korb.teillieferungen.map((t) => t.lieferzeitWerktage);
  assert.ok(einzeln.length >= 2, 'Für diese Prüfung braucht es mehrere Lieferanten');

  const laengste = Math.max(...einzeln);
  assert.equal(b.lieferzeitLaengsteWerktage, laengste);
  assert.match(b.text, new RegExp('Vollständig auf der Baustelle: nach ' + laengste + ' Werktagen'));
  assert.ok(laengste > Math.min(...einzeln), 'sonst prüft der Testfall nichts Eigenes');
});

test('Ohne Lieferanschrift bleibt der Block weg statt leer dazustehen', () => {
  const b = erzeugeAuftragsbestaetigung(korb, {
    nummer: 'AB-1', datum: '2026-08-16', kunde: kunde, betreiber: betreiber,
  });
  assert.ok(!/Lieferanschrift:/.test(b.text));
});

test('Eine abweichende Baustelle wird als solche gekennzeichnet', () => {
  const auftrag = {
    lieferungAnRechnungsadresse: false,
    lieferadresse: {
      name: 'Neubau Familie Berger', strasse: 'Feldgasse 27',
      plz: '4910', ort: 'Ried im Innkreis', telefon: '+43 664 9998877',
    },
  };
  const b = erzeugeAuftragsbestaetigung(korb, {
    nummer: 'AB-1', datum: '2026-08-16', kunde: kunde, betreiber: betreiber, auftrag,
  });
  assert.match(b.text, /4910 Ried im Innkreis/);
  assert.match(b.text, /abweichend von der Rechnungsanschrift/);
  assert.match(b.text, /Ansprechpartner vor Ort/);
});

test('Die Hinweise wandern in das Papier, nicht nur auf den Bildschirm', () => {
  const b = erzeugeAuftragsbestaetigung(korb, {
    nummer: 'AB-1', datum: '2026-08-16', kunde: kunde, betreiber: betreiber,
    hinweise: [{ titel: 'Rügefrist', text: 'Läuft ab Ablieferung.', grundlage: '§ 377 UGB' }],
  });
  assert.match(b.text, /Rügefrist: Läuft ab Ablieferung\. \(§ 377 UGB\)/);
});

test('Fehlende Angaben bleiben in der Bestätigung sichtbar stehen', () => {
  const b = erzeugeAuftragsbestaetigung(korb, { nummer: null, datum: null, kunde: {}, betreiber: {} });
  assert.match(b.text, /FEHLT/);
});

test('Ein Auftrag unter dem Mindestbestellwert darf nicht bestätigt werden', () => {
  // Der Fall aus frachtschwelle-und-bestellwert.md: Wer das bestätigt, hat
  // einen Vertrag geschlossen, den er nicht erfüllen kann.
  const zuKlein = berechneWarenkorb([{ sku: 'DR-100-050', menge: 2 }], katalog);
  assert.equal(zuKlein.bestellbar, false, 'Vorbedingung des Testfalls');

  const f = darfBestaetigtWerden(zuKlein, { kundeIstUnternehmer: true, uid: 'ATU12345675' });
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Nicht platzierbar/.test(g)), f.gruende.join(' | '));
});

test('Ohne Unternehmerstatus und ohne UID keine Annahme', () => {
  const ohne = darfBestaetigtWerden(korb, {});
  assert.equal(ohne.erlaubt, false);
  assert.ok(ohne.gruende.some((g) => /Gate 7/.test(g)));
  assert.ok(ohne.gruende.some((g) => /UID/.test(g)));
});

test('Platzhalterpreise halten auch die Annahme an', () => {
  const f = darfBestaetigtWerden(korb, { kundeIstUnternehmer: true, uid: 'ATU12345675' });
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Platzhalterpreise/.test(g)), f.gruende.join(' | '));
});

/* ------------------------------------------------------------------ *
 * Eine unbekannte Lieferzeit ist keine Lieferzeit von null
 * ------------------------------------------------------------------ */

// Der Warenkorb des Bestands trägt Lieferzeiten, weil er aus `artikel.json`
// stammt — dem Katalog des abgelösten Modells. Der echte Katalog liefert
// sechsundvierzig Artikel eines einzigen Lieferanten, dessen Lieferzeit
// niemand kennt. Genau deshalb fiel es keiner Probe auf.
const korbOhneLieferzeit = {
  ...korb,
  teillieferungen: korb.teillieferungen.map((t, i) => (
    i === 0 ? { ...t, lieferzeitWerktage: null } : t
  )),
};

test('Eine unbekannte Lieferzeit steht als Lücke da, nicht als „null Werktage"', () => {
  const b = erzeugeAuftragsbestaetigung(korbOhneLieferzeit, {
    nummer: 'AB-1', datum: '2026-08-30', kunde, betreiber,
  });
  assert.ok(!b.text.includes('null Werktage'),
    'die rohe Einsetzung ist zurück — auf einem Beleg an den Kunden');
  assert.ok(!b.text.includes('undefined'));
  const name = korbOhneLieferzeit.teillieferungen[0].lieferantName;
  assert.ok(b.text.includes(`[[ Lieferzeit ${name} — FEHLT ]]`),
    'die Lücke nennt nicht, wessen Lieferzeit fehlt');
});

test('Ohne alle Lieferzeiten gibt es keinen Gesamttermin, auch keinen von null', () => {
  // **Der teuerste Griff des Moduls**, hier festgenagelt: `?? 0` machte aus
  // „unbekannt" den optimistischsten aller Werte — und zwar auf dem Dokument,
  // mit dem der Vertrag zustande kommt.
  const b = erzeugeAuftragsbestaetigung(korbOhneLieferzeit, {
    nummer: 'AB-1', datum: '2026-08-30', kunde, betreiber,
  });
  assert.equal(b.lieferzeitLaengsteWerktage, null);
  assert.ok(!b.text.includes('nach 0 Werktagen'), 'der Termin ist wieder erfunden');
  assert.match(b.text, /Vollständig auf der Baustelle: \[\[ Gesamtlieferzeit — FEHLT \]\]/);
});

test('Sind alle Lieferzeiten bekannt, steht der Termin wie bisher da', () => {
  // Gegenprobe: Die Lücke darf nicht der neue Normalfall werden.
  const b = erzeugeAuftragsbestaetigung(korb, {
    nummer: 'AB-1', datum: '2026-08-30', kunde, betreiber,
  });
  const laengste = Math.max(...korb.teillieferungen.map((t) => t.lieferzeitWerktage));
  assert.equal(b.lieferzeitLaengsteWerktage, laengste);
  assert.ok(!b.text.includes('FEHLT ]]'), 'eine Lücke, wo nichts fehlt');
});

test('Auch Angebot und Rechnung setzen die fehlende Lieferzeit nicht roh ein', () => {
  // Dieselbe Zeile bedient drei Belege. Ohne diesen Fall bliebe zwei Drittel
  // des Fundorts ungeprüft.
  const a = erzeugeAngebot(korbOhneLieferzeit, {
    nummer: 'AN-1', datum: '2026-08-30', kunde, betreiber,
  });
  const r = erzeugeRechnung(korbOhneLieferzeit, {
    nummer: 'RE-1', datum: '2026-08-30', lieferdatum: '2026-08-30', kunde, betreiber,
  });
  for (const [name, beleg] of [['Angebot', a], ['Rechnung', r]]) {
    assert.ok(!beleg.text.includes('null Werktage'), `${name} setzt roh ein`);
    assert.match(beleg.text, /FEHLT \]\]/, `${name} macht die Lücke nicht sichtbar`);
  }
});

test('Ohne bekannte Lieferzeit darf keine Auftragsbestätigung hinaus', () => {
  // **Gate-Entscheidung vom 30.08.** Die Bestätigung ist die Annahme; mit ihr
  // kommt der Vertrag zustande, und sie nennt den Termin. Ein Termin, den
  // niemand kennt, ist erfunden — dieselbe Regel wie beim Platzhalterpreis,
  // nur auf die Zeit angewandt. Das Angebot darf die Lücke tragen, weil es
  // unverbindlich ist; die Bestätigung nicht.
  const auftrag = { kundeIstUnternehmer: true, uid: 'ATU12345675' };
  const gesperrt = darfBestaetigtWerden(korbOhneLieferzeit, auftrag);
  assert.equal(gesperrt.erlaubt, false);
  assert.ok(gesperrt.gruende.some((g) => /Lieferzeit unbekannt/.test(g)), gesperrt.gruende.join(' | '));
  assert.ok(gesperrt.gruende.some((g) => g.includes(korbOhneLieferzeit.teillieferungen[0].lieferantName)),
    'der Grund nennt nicht, wessen Lieferzeit fehlt');

  const erlaubt = darfBestaetigtWerden(korb, auftrag);
  assert.ok(!erlaubt.gruende.some((g) => /Lieferzeit/.test(g)),
    'mit bekannten Lieferzeiten darf die Lieferzeit kein Hindernis sein');
});

test('Eine Lieferzeit von 0 Werktagen ist eine Zusage, keine Lücke', () => {
  // Selbstabholung am selben Tag. Wer hier auf Wahrheitswert statt auf Zahl
  // prüft, erklärt die gültigste aller Lieferzeiten zur fehlenden Angabe.
  const sofort = {
    ...korb,
    teillieferungen: korb.teillieferungen.map((t) => ({ ...t, lieferzeitWerktage: 0 })),
  };
  const b = erzeugeAuftragsbestaetigung(sofort, {
    nummer: 'AB-1', datum: '2026-08-30', kunde, betreiber,
  });
  assert.equal(b.lieferzeitLaengsteWerktage, 0);
  assert.match(b.text, /Vollständig auf der Baustelle: nach 0 Werktagen/);
  assert.ok(!b.text.includes('FEHLT ]]'));
  assert.ok(!darfBestaetigtWerden(sofort, { kundeIstUnternehmer: true, uid: 'ATU12345675' })
    .gruende.some((g) => /Lieferzeit/.test(g)));
});

test('Angebot und Rechnung schreiben die Einheit aus, nicht das Kürzel', () => {
  // **Derselbe Kunde, dieselbe Position, zwei Schreibweisen.** Der
  // Anfragetext auf der Kasse übersetzt „SCK" seit jeher zu „Sack"; Angebot
  // und Rechnung setzten das Kürzel des Lieferanten roh. Der echte Katalog
  // führt ausschließlich solche Kürzel — im Altkatalog dieser Datei stehen
  // deutsche Wörter, deshalb fiel es hier nie auf.
  const mitKuerzel = {
    ...korb,
    teillieferungen: korb.teillieferungen.map((t, i) => (i === 0 ? {
      ...t,
      positionen: t.positionen.map((p) => ({ ...p, einheit: 'SCK' })),
    } : t)),
  };
  const a = erzeugeAngebot(mitKuerzel, { nummer: 'AN-1', datum: '2026-08-31', kunde, betreiber });
  const r = erzeugeRechnung(mitKuerzel, {
    nummer: 'RE-1', datum: '2026-08-31', lieferdatum: '2026-08-31', kunde, betreiber,
  });
  for (const [name, beleg] of [['Angebot', a], ['Rechnung', r]]) {
    assert.match(beleg.text, /\bSack\b/, `${name} schreibt die Einheit nicht aus`);
    assert.ok(!/\bSCK\b/.test(beleg.text), `${name} zeigt dem Kunden das Kürzel des Lieferanten`);
  }
});

test('Ein unbekanntes Kürzel steht als Kürzel da, nicht als Vermutung', () => {
  // Die Gegenrichtung zum Ausschreiben: Erfinden wäre schlimmer. „PAK" als
  // „Paket" zu lesen ist geraten — und die Vermutung stünde auf einer
  // Rechnung.
  const fremd = {
    ...korb,
    teillieferungen: korb.teillieferungen.map((t, i) => (i === 0 ? {
      ...t,
      positionen: t.positionen.map((p) => ({ ...p, einheit: 'PAK' })),
    } : t)),
  };
  const a = erzeugeAngebot(fremd, { nummer: 'AN-1', datum: '2026-08-31', kunde, betreiber });
  assert.match(a.text, /\bPAK\b/);
  assert.ok(!/Paket/.test(a.text));
});

test('Mit Platzhalterpreisen wird keine Rechnung gestellt', () => {
  // Dieselbe Regel wie bei der Auftragsbestätigung, hier für die Rechnung —
  // und bis zum 31.08. der einzige unerreichte Zweig in `beleg.js`. Ein
  // ausgewiesener Betrag aus einem Platzhalterpreis ist erfunden, und er
  // stünde auf einem Beleg, der unveränderbar in die Ablage geht.
  const platzhalter = {
    ...korb,
    teillieferungen: korb.teillieferungen.map((t, i) => (i === 0 ? {
      ...t, positionen: t.positionen.map((p) => ({ ...p, ekIstPlatzhalter: true })),
    } : t)),
  };
  const r = erzeugeRechnung(platzhalter, {
    nummer: 'RE-1', datum: '2026-08-31', lieferdatum: '2026-08-31', kunde, betreiber,
  });
  const f = darfRechnungGestelltWerden(platzhalter, r, { geliefert: true });
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /Platzhalterpreise/.test(g)), f.gruende.join(' | '));
  assert.ok(f.gruende.some((g) => /erfunden/.test(g)));

  // Gegenrichtung — und sie musste ausdrücklich gebaut werden: Der Warenkorb
  // dieser Datei stammt aus `data/artikel.json`, dem Katalog des abgelösten
  // Modells, und **dessen Preise sind Platzhalter**. Wer hier den Bestand als
  // sauberen Fall nimmt, prüft nichts — der Grund stünde ohnehin da.
  const bestaetigt = {
    ...korb,
    teillieferungen: korb.teillieferungen.map((t) => ({
      ...t, positionen: t.positionen.map((p) => ({ ...p, ekIstPlatzhalter: false })),
    })),
  };
  const sauber = darfRechnungGestelltWerden(bestaetigt, erzeugeRechnung(bestaetigt, {
    nummer: 'RE-2', datum: '2026-08-31', lieferdatum: '2026-08-31', kunde, betreiber,
  }), { geliefert: true });
  assert.ok(!sauber.gruende.some((g) => /Platzhalterpreise/.test(g)), sauber.gruende.join(' | '));
});

test('Eine Rechnung mit fehlenden Pflichtangaben wird nicht gestellt', () => {
  // Der letzte unerreichte Zweig in `beleg.js`. Beim ersten Anlauf hatte ich
  // ihn mit der Platzhaltersperre daneben verwechselt — der Deckungslauf
  // nannte die Zeile, ich las die falsche Bedingung. Nachgesehen: Es ist die
  // Vollständigkeit nach § 11 UStG.
  //
  // `pruefeRechnungsmerkmale` benennt die Lücken einzeln; diese Sperre sorgt
  // dafür, dass der Entwurf ein Entwurf bleibt. Ein Beleg mit fehlender UID
  // des Ausstellers ist über 400 € brutto ein Rechnungsmangel.
  const ohneUid = erzeugeRechnung(korb, {
    nummer: 'RE-1', datum: '2026-08-31', lieferdatum: '2026-08-31',
    kunde, betreiber: { firma: betreiber.firma },
  });
  assert.equal(ohneUid.vollstaendig, false, 'ohne UID müsste der Beleg unvollständig sein');
  const f = darfRechnungGestelltWerden(korb, ohneUid, { geliefert: true });
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => /§ 11 UStG/.test(g)), f.gruende.join(' | '));
  assert.ok(f.gruende.some((g) => /UID/.test(g)), 'der Grund nennt nicht, welche Angabe fehlt');

  // Gegenrichtung: Mit vollständigen Angaben darf dieser Grund nicht kommen.
  const vollstaendigerBeleg = erzeugeRechnung(korb, {
    nummer: 'RE-2', datum: '2026-08-31', lieferdatum: '2026-08-31', kunde, betreiber,
  });
  assert.equal(vollstaendigerBeleg.vollstaendig, true);
  assert.ok(!darfRechnungGestelltWerden(korb, vollstaendigerBeleg, { geliefert: true })
    .gruende.some((g) => /§ 11 UStG/.test(g)));
});

// ---------------------------------------------------------------------------
// Der Zahlungsvermerk — Befund vom 1. September
//
// Gefunden nicht durch eine Prüfung, sondern durch das Lesen einer erzeugten
// Rechnung: Sie nannte 1.638,48 € Gesamtbetrag und schwieg darüber, ob dieses
// Geld noch zu zahlen ist. Nach Punkt 9 der eigenen AGB ist es das nie.
// ---------------------------------------------------------------------------

const gezahlt = { weg: 'eps', datum: '30.08.2026', kennzeichen: 'AB-0001' };

test('Alle angebotenen Zahlwege sind Vorkasse — sonst stimmt der Vermerk nicht mehr', () => {
  assert.ok(angeboteneZahlwege().length >= 2, 'zu wenige angebotene Zahlwege — die Schleife prüfte nichts');
  for (const id of angeboteneZahlwege()) {
    assert.equal(zahlwegIstVorkasse(id), true, `${id} müsste Vorkasse sein`);
  }
  assert.equal(zahlwegIstVorkasse('offene-rechnung'), false);
  assert.equal(zahlwegIstVorkasse('gibtesnicht'), null);
});

test('Die Rechnung sagt, dass der Betrag bereits bezahlt ist', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber, zahlung: gezahlt,
  });
  assert.ok(r.zahlungsvermerk.vollstaendig);
  assert.match(r.text, /Bereits bezahlt am 30\.08\.2026/);
  assert.match(r.text, /nicht noch einmal überweisen/);
  assert.match(r.text, /Zahlungsreferenz: AB-0001/);
});

test('Der Vermerk nennt den Zahlweg mit dem Wort der Website, nicht mit der Kennung', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber, zahlung: gezahlt,
  });
  assert.match(r.text, new RegExp(zahlwegName('eps').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(!/über eps\b/.test(r.text));
});

test('Ohne Zahlungsangabe trägt die Rechnung die sichtbare Lücke und darf nicht hinaus', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber,
  });
  assert.equal(r.zahlungsvermerk.vollstaendig, false);
  assert.match(r.text, /\[\[ Zahlweg und Zahlungsdatum — FEHLT \]\]/);
  const f = darfRechnungGestelltWerden(korb, r, { geliefert: true });
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Zahlungsvermerk')));
});

test('Ein Zahlweg ohne Datum ist keine Quittung', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber,
    zahlung: { weg: 'eps' },
  });
  assert.equal(r.zahlungsvermerk.vollstaendig, false);
  assert.match(r.zahlungsvermerk.grund, /Zahlungsdatum fehlt/);
  assert.match(r.text, /\[\[ Zahlungsdatum — FEHLT \]\]/);
});

test('Ein nicht angebotener Zahlweg wird benannt, nicht durchgereicht', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber,
    zahlung: { weg: 'nachnahme', datum: '30.08.2026' },
  });
  assert.equal(r.zahlungsvermerk.vollstaendig, false);
  assert.match(r.zahlungsvermerk.grund, /keine Vorkasse/);
});

test('Das Angebot nennt die Zahlungsbedingung, damit nicht die Verkehrssitte gilt', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-0001', datum: '15.08.2026', kunde, betreiber });
  assert.match(a.text, /Zahlung bei Bestellung, kein Zahlungsziel/);
  for (const id of angeboteneZahlwege()) assert.ok(a.text.includes(zahlwegName(id)), id);
});

test('Die Auftragsbestätigung sagt, dass vor dem Geld nichts bestellt wird', () => {
  const b = erzeugeAuftragsbestaetigung(korb, { nummer: 'AB-0001', datum: '15.08.2026', kunde, betreiber });
  assert.match(b.text, /Zahlbar sofort, ohne Zahlungsziel/);
  assert.match(b.text, /nach Zahlungseingang aus/);
});


/* ------------------------------------------------------------------ *
 * Name UND Anschrift
 *
 * § 11 Abs 1 Z 3 UStG verlangt „Name und Anschrift des liefernden
 * Unternehmers". Das Register schrieb das hin, die Prüfung bekam nur die
 * Firma, und gedruckt wurde nur die Firma. Drei Stellen, drei Aussagen, alle
 * für sich plausibel.
 * ------------------------------------------------------------------ */

test('Die Rechnung druckt Straße, PLZ und Ort des Ausstellers', () => {
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber,
  });
  assert.match(r.text, /Musterweg 1/);
  assert.match(r.text, /4600 Wels/);
  assert.equal(r.vollstaendig, true);
});

test('Eine halbe Anschrift ist keine — die Rechnung gilt als unvollständig', () => {
  const ohneStrasse = { ...betreiber, strasse: '' };
  const r = erzeugeRechnung(korb, {
    nummer: 'RE-0001', datum: '15.08.2026', lieferdatum: '22.08.2026', kunde, betreiber: ohneStrasse,
  });
  assert.equal(r.vollstaendig, false, 'ohne Straße gilt die Rechnung als vollständig');
  assert.ok(r.fehlend.some((f) => /Anschrift des liefernden/.test(f)), r.fehlend.join(' | '));
  // Und die Lücke steht sichtbar im Text, statt still zu fehlen.
  assert.match(r.text, /Straße des Ausstellers — FEHLT/);
});

test('Angebot und Auftragsbestätigung tragen dieselbe Absenderanschrift', () => {
  const a = erzeugeAngebot(korb, { nummer: 'AN-1', datum: '15.08.2026', kunde, betreiber });
  const b = erzeugeAuftragsbestaetigung(korb, { nummer: 'AB-1', datum: '15.08.2026', kunde, betreiber });
  for (const t of [a.text, b.text]) {
    assert.match(t, /Musterweg 1/);
    assert.match(t, /4600 Wels/);
  }
});

/* ------------------------------------------------------------------ *
 * Marke und Aussteller
 * ------------------------------------------------------------------ */

/**
 * Seit dem 3. September heißt der Laden `Bauversand`, betrieben von der
 * Freudenthaler Bau GmbH. Die Belege trugen zunächst weiter nur die Firma: Ein
 * Kunde bestellt bei einem Namen und bekommt die Rechnung von einem anderen.
 *
 * > **Wer nicht erkennt, von wem die Rechnung kommt, bezahlt sie nicht — er
 * > ruft an.**
 */
test('der Absenderkopf nennt erst die Marke, dann den Aussteller', async () => {
  const { absenderkopf, absenderzeilen } = await import('../src/beleg.js');
  const betreiber = {
    marke: 'Bauversand', firma: 'Freudenthaler Bau GmbH',
    strasse: 'Marwach 5', plz: '4312', ort: 'Ried in der Riedmark',
  };
  assert.equal(absenderkopf(betreiber), 'Bauversand — Freudenthaler Bau GmbH');
  assert.equal(absenderzeilen(betreiber)[0], 'Bauversand — Freudenthaler Bau GmbH',
    'die erste Absenderzeile trägt beide Namen');
  assert.equal(absenderzeilen(betreiber).length, 3, 'die Marke bekommt keine eigene Zeile');
});

test('ohne Marke bleibt der Absender, wie er war', async () => {
  const { absenderkopf } = await import('../src/beleg.js');
  const firma = 'Freudenthaler Bau GmbH';
  for (const marke of [undefined, '', '   ', firma]) {
    assert.equal(absenderkopf({ marke, firma }), firma,
      `bei Marke ${JSON.stringify(marke)} gehört nichts dazu`);
  }
});

test('der Name des Ausstellers steht weiterhin vollständig auf dem Beleg', async () => {
  // § 11 UStG verlangt den Namen des Ausstellers. Die Marke davor ist eine
  // Zugabe, keine Ersetzung — sonst hätte diese Änderung eine Pflichtangabe
  // gegen eine Bequemlichkeit getauscht.
  const { absenderkopf } = await import('../src/beleg.js');
  const firma = 'Freudenthaler Bau GmbH';
  const kopf = absenderkopf({ marke: 'Bauversand', firma });
  assert.ok(kopf.includes(firma), 'der Ausstellername fehlt in der Zeile');
  assert.ok(kopf.indexOf('Bauversand') < kopf.indexOf(firma),
    'die Marke steht vorn — unter ihr hat der Kunde bestellt');
});

/* ------------------------------------------------------------------ *
 * Die Sperren machen auch wieder auf — nachgewiesen am 4. September, spät
 *
 * **Der Befund.** `darfBestaetigtWerden` hat sechs Sperrgründe und sechs
 * Proben, und jede prüft, dass *ihr* Grund kommt. Keine einzige prüfte je,
 * dass die Sperre bei vollständiger Lage **aufmacht**. Die üblichen Zeilen
 * lauteten `assert.ok(!f.gruende.some(...))` — sie halten fest, dass ein
 * bestimmter Grund fehlt, und schweigen über die fünf anderen.
 *
 * > **Eine Sperre, von der niemand gezeigt hat, dass sie je aufgeht, könnte
 * > jeden Auftrag abweisen, ohne dass eine Probe es merkt.** Der Shop nähme
 * > Bestellungen entgegen und könnte keine einzige annehmen.
 *
 * Genau davor warnt der Kommentar zur Lieferzeit in `startklar.js` seit dem
 * 30. August — für einen Grund. Diese beiden Fälle prüfen die Kette.
 * ------------------------------------------------------------------ */

/** Die vollständige Lage: alles beantwortet, was eine Annahme verlangt. */
const annahmefaehig = {
  ...korb,
  teillieferungen: korb.teillieferungen.map((t) => ({
    ...t,
    lieferzeitWerktage: t.lieferzeitWerktage ?? 5,
    positionen: t.positionen.map((p) => ({ ...p, ekIstPlatzhalter: false })),
  })),
};
const auftragVollstaendig = { kundeIstUnternehmer: true, uid: 'ATU12345675' };

test('Mit vollständiger Lage darf die Auftragsbestätigung hinaus', () => {
  assert.equal(annahmefaehig.bestellbar, true, 'Vorbedingung des Testfalls');
  const f = darfBestaetigtWerden(annahmefaehig, auftragVollstaendig, betreiber);
  assert.equal(f.erlaubt, true, f.gruende.join(' | '));
  assert.deepEqual(f.gruende, []);
});

/**
 * Und die Gegenrichtung zur Gegenrichtung: Dieselbe vollständige Lage, nur
 * ohne Konto beim Betreiber. Ohne diese Zeile stünde oben eine Zusicherung,
 * die auch dann grün bliebe, wenn die Bankprüfung ersatzlos verschwände.
 */
test('Dieselbe Lage ohne Konto wird abgewiesen', () => {
  const ohneKonto = { ...betreiber, kontoinhaber: undefined, iban: undefined };
  const f = darfBestaetigtWerden(annahmefaehig, auftragVollstaendig, ohneKonto);
  assert.equal(f.erlaubt, false);
  assert.deepEqual(f.gruende.length, 1, f.gruende.join(' | '));
  assert.match(f.gruende[0], /Bankverbindung unvollständig \(kontoinhaber, iban\)/);
});

test('Ohne Betreiber sperrt die Annahme, statt stillschweigend durchzulassen', () => {
  // Der Grundwert `{}` ist die vorsichtige Richtung: Wer das Argument
  // vergisst, bekommt einen Befund und keine Erlaubnis.
  const f = darfBestaetigtWerden(annahmefaehig, auftragVollstaendig);
  assert.equal(f.erlaubt, false);
  assert.match(f.gruende.join(' | '), /Bankverbindung/);
});

test('Mit vollständiger Lage darf auch die Rechnung gestellt werden', () => {
  const r = erzeugeRechnung(annahmefaehig, {
    nummer: 'RE-0002', datum: '31.08.2026', lieferdatum: '31.08.2026',
    kunde, betreiber, zahlung: gezahlt,
  });
  const f = darfRechnungGestelltWerden(annahmefaehig, r, { geliefert: true });
  assert.equal(f.erlaubt, true, f.gruende.join(' | '));
});
