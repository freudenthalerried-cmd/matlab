import test from 'node:test';
import assert from 'node:assert/strict';
import { pruefeBeleg, pruefeBelege, leereAngaben, SUMMENZEILE, ZUSTANDSAUSSAGE , pruefeVerrechnetUndBestellt, VERRECHNET_UND_BESTELLT, pruefeAgbVerweise } from '../src/belegpruefung.js';
import { AGB_GLIEDERUNG, AGB_VERWEISE } from '../src/rechtstexte.js';

const mitSumme = (rest) => `Rechnung RE-0001\n\nGesamtbetrag            1638,48 €\n\n${rest}`;

test('Eine Endsumme ohne Zustandsaussage wird gemeldet', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: mitSumme('Leistungsort Österreich, Steuersatz 20 %.') });
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'betrag-ohne-zustand');
});

test('Der Zahlungsvermerk deckt die Endsumme', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: mitSumme('Bereits bezahlt am 30.08.2026 über EPS.') });
  assert.equal(b.sauber, true);
});

test('Auch die offene Rechnung wäre eine Zustandsaussage', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: mitSumme('Zahlbar innerhalb von 30 Tagen ohne Abzug.') });
  assert.equal(b.sauber, true);
});

test('Ohne Endsumme greift die Regel nicht — ein Lieferschein ist keine Rechnung', () => {
  const b = pruefeBeleg({ art: 'Rechnung', text: 'Rechnung RE-0001\n\nSumme netto  1365,40 €\n' });
  assert.equal(b.sauber, true);
});

test('Eine unbekannte Belegart läuft nicht stillschweigend durch', () => {
  const b = pruefeBeleg({ art: 'Gutschrift', text: mitSumme('Bereits bezahlt.') });
  assert.equal(b.sauber, false);
  assert.equal(b.meldungen[0].regel, 'belegart-unbekannt');
});

test('Ein widerrufener Satz auf dem Beleg wird gemeldet, auch mit Widerruf daneben', () => {
  // Auf der Seite rettet der danebenstehende Widerruf die Aussage. Auf einem
  // Beleg nicht: Sichtweite 0. Genau das trennt diesen Prüfer vom Register.
  const text = mitSumme(
    'Bereits bezahlt am 30.08.2026.\n'
    + 'Die Frachtpauschale steht auf jeder Rechnung.\n'
    + 'Berichtigt: das gilt nicht mehr.',
  );
  const b = pruefeBeleg({ art: 'Rechnung', text });
  assert.equal(b.sauber, false);
  assert.ok(b.meldungen.some((m) => m.regel === 'widerrufene-aussage'));
});

test('Jede Belegart nennt mindestens ein Muster', () => {
  for (const [art, muster] of Object.entries(ZUSTANDSAUSSAGE)) {
    assert.ok(muster instanceof RegExp, art);
  }
  assert.ok(SUMMENZEILE.test('Gesamtbetrag            1638,48 €'));
  assert.ok(!SUMMENZEILE.test('Warenwert netto         1240,40 €'));
});

test('Ein leerer Durchlauf ist kein grüner', () => {
  assert.throws(() => pruefeBelege([]), /leerer Durchlauf/);
  assert.throws(() => pruefeBelege(null), /leerer Durchlauf/);
});

test('Die Gesamtzahl der Meldungen stimmt mit den einzelnen überein', () => {
  const b = pruefeBelege([
    { art: 'Rechnung', text: mitSumme('Leistungsort Österreich.') },
    { art: 'Angebot', text: mitSumme('Zahlungsbedingung: Zahlung bei Bestellung.') },
  ]);
  assert.equal(b.geprueft, 2);
  assert.equal(b.meldungen, 1);
  assert.equal(b.sauber, false);
});

// ---------------------------------------------------------------------------
// Die leere Angabe — Befund vom 1. September, zweiter Teil
// ---------------------------------------------------------------------------

test('Eine Beschriftung ohne Wert wird gemeldet', () => {
  const t = 'Lieferadresse:\n  Bau Muster GmbH\n  Ansprechpartner vor Ort: \n\nMit freundlichen Grüßen';
  const l = leereAngaben(t);
  assert.equal(l.length, 1);
  assert.equal(l[0].beschriftung, 'Ansprechpartner vor Ort');
  assert.equal(l[0].zeile, 3);
});

test('Eine Blocküberschrift ist keine leere Angabe', () => {
  assert.deepEqual(leereAngaben('Lieferadresse (Baustelle):\n  Bau Muster GmbH\n  4600 Wels'), []);
});

test('Leerzeilen zwischen Beschriftung und Aufzählung zählen nicht als Ende', () => {
  // Der Fehlalarm des ersten Laufs: ein Satz, dessen Liste erst nach einer
  // Leerzeile beginnt.
  assert.deepEqual(leereAngaben('… an den unten\ngenannten Endkunden:\n\n    5 × DR-100-050 Rohr'), []);
});

test('Eine Beschriftung am Textende hat keinen Wert mehr', () => {
  assert.equal(leereAngaben('Summe: 12 €\nAnsprechpartner:').length, 1);
});

test('Die Belegprüfung meldet die leere Angabe als eigene Regel', () => {
  const b = pruefeBeleg({ art: 'Lieferantenbestellung', text: 'Gewünschte Lieferzeit: 5 Werktage.\nTelefon: ' });
  assert.ok(b.meldungen.some((m) => m.regel === 'leere-angabe'));
});


/* ------------------------------------------------------------------ *
 * Was verrechnet wird, muss bestellt sein
 *
 * Befund vom 2. September: Der Warenkorb rechnete je palettierter Position
 * 7,50 € Kranentladung und wies sie dem Kunden aus; die Bestellung an den
 * Lieferanten sagte davon nichts. Jeder Beleg für sich war in Ordnung — der
 * Fehler lag zwischen ihnen.
 * ------------------------------------------------------------------ */

const kunde = (n) => ({ art: 'Angebot', text: `Fracht: 90,50 € (Pauschale plus ${n}× Kranentladung)` });
const lieferant = (n) => ({
  art: 'Lieferantenbestellung',
  text: `Bitte mit Kranentladung zustellen — ${n} palettierte Positionen.`,
});

test('verrechnet und bestellt: gleiche Zahl, keine Meldung', () => {
  assert.deepEqual(pruefeVerrechnetUndBestellt([kunde(2), lieferant(2)]), []);
});

test('verrechnet, aber nicht bestellt', () => {
  const m = pruefeVerrechnetUndBestellt([
    kunde(2),
    { art: 'Lieferantenbestellung', text: 'Bitte neutral verpackt liefern.' },
  ]);
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verrechnet-nicht-bestellt');
  assert.match(m[0].text, /2×/);
});

test('verrechnet und anders bestellt', () => {
  const m = pruefeVerrechnetUndBestellt([kunde(2), lieferant(1)]);
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verrechnet-anders-bestellt');
});

test('nichts verrechnet, nichts gemeldet', () => {
  assert.deepEqual(pruefeVerrechnetUndBestellt([
    { art: 'Angebot', text: 'Fracht: 75,50 € (Pauschale)' },
    { art: 'Lieferantenbestellung', text: 'Bitte neutral verpackt liefern.' },
  ]), []);
});

test('fehlt der Zielbeleg, wird das gesagt statt verschwiegen', () => {
  // Ein halber Lauf soll nicht aussehen wie ein ganzer.
  const m = pruefeVerrechnetUndBestellt([kunde(2)]);
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verrechnet-ohne-beleg');
});

test('jeder Eintrag des Registers nennt seinen Grund', () => {
  assert.ok(VERRECHNET_UND_BESTELLT.length >= 1, 'das Register ist leer');
  for (const e of VERRECHNET_UND_BESTELLT) {
    assert.ok(e.warum && e.warum.length >= 40, `${e.id}: ohne belastbaren Grund`);
    assert.ok(e.verrechnet instanceof RegExp && e.bestellt instanceof RegExp, e.id);
  }
});


/* ------------------------------------------------------------------ *
 * Ein Verweis auf eine Nummer ist eine Verabredung mit einer Reihenfolge
 *
 * Die Auftragsbestätigung sagt „Punkt 2 unserer Allgemeinen
 * Geschäftsbedingungen", das Angebot „Punkt 9 der Geschäftsbedingungen".
 * Beides stimmt — und beides hängt an einer Zählung, die niemand bewacht.
 * Wer einen Punkt einschiebt, verschiebt jede Nummer dahinter.
 * ------------------------------------------------------------------ */

/**
 * **Erweitert am 3. September.** Die Auftragsbestätigung trug hier nur den
 * Verweis auf Punkt 2 — den einen, der in `beleg.js` ausgeschrieben steht. Die
 * echte trägt zusätzlich die **Lieferhinweise** aus `rechtstexte.js`, und die
 * zitieren zwei weitere Punkte. Aufgefallen ist das, als `npm run vorgang` zum
 * ersten Mal eine Bestätigung baute, wie der Betrieb sie baut.
 *
 * Die Vorlage bildet deshalb jetzt ab, was ein vollständiger Durchlauf
 * tatsächlich sieht: vier zitierte Punkte, verteilt auf zwei Belege.
 */
const belegeMitVerweis = [
  {
    art: 'Auftragsbestätigung',
    text: 'Der Vertrag kommt zustande (Punkt 2 unserer AGB).\n'
      + 'Teillieferungen kommen getrennt an. (AGB Punkt 4)\n'
      + 'Wer übernimmt, übernimmt für Sie. (AGB Punkt 7)',
  },
  { art: 'Angebot', text: 'Zahlung bei Bestellung, kein Zahlungsziel (Punkt 9 der AGB).' },
  // **Ergänzt am 4. September.** Seit der Auftrag an den Rechtstexteanbieter
  // die ganze AGB-Gliederung mitnimmt, geht auch der Verweis von Punkt 3 auf
  // Punkt 12 hinaus — er stand vorher nur in einem internen Register.
  { art: 'Rechtstexteauftrag', text: 'Leistungsort Inland, siehe Punkt 12 der AGB.' },
];

test('Der heutige Bestand ist widerspruchsfrei', () => {
  assert.deepEqual(pruefeAgbVerweise(belegeMitVerweis, AGB_GLIEDERUNG, AGB_VERWEISE, { vollstaendig: true }), []);
});

test('Über einer Teilmenge meldet die dritte Regel nichts', () => {
  assert.deepEqual(pruefeAgbVerweise([belegeMitVerweis[0]], AGB_GLIEDERUNG, AGB_VERWEISE), []);
});

test('Ein eingeschobener Punkt verschiebt jeden Verweis dahinter', () => {
  // Der Fall, für den die Regel gebaut ist: Aus „Punkt 9, Zahlung" wird
  // „Punkt 9, Gefahrübergang", und der Kundenbeleg zitiert eine Klausel, die
  // etwas anderes regelt.
  const verschoben = AGB_GLIEDERUNG.map((g) => (g.nr >= 3 ? { ...g, nr: g.nr + 1 } : g));
  const m = pruefeAgbVerweise(belegeMitVerweis, verschoben, AGB_VERWEISE);
  assert.ok(m.some((x) => x.regel === 'verweis-zeigt-woanders'), JSON.stringify(m));
  assert.ok(m.some((x) => /Punkt 9 heißt/.test(x.text)), JSON.stringify(m));
});

test('Ein zitierter Punkt ohne Eintrag im Register fällt auf', () => {
  const m = pruefeAgbVerweise(
    [...belegeMitVerweis, { art: 'Rechnung', text: 'Siehe Punkt 11 der AGB.' }],
    AGB_GLIEDERUNG, AGB_VERWEISE,
  );
  assert.equal(m.length, 1);
  assert.equal(m[0].regel, 'verweis-ohne-eintrag');
  assert.match(m[0].text, /Punkt 11/);
});

test('Ein Eintrag, den kein Beleg mehr zitiert, bewacht nichts', () => {
  // Die Richtung, die man vergisst: Der Eintrag bleibt stehen, der Satz im
  // Beleg ist längst umgeschrieben, und das Register meldet weiter grün.
  //
  // Nur bei einem **vollständigen** Durchlauf: Über einer Teilmenge sagt das
  // Fehlen nichts.
  const m = pruefeAgbVerweise([belegeMitVerweis[0]], AGB_GLIEDERUNG, AGB_VERWEISE, { vollstaendig: true });
  // **Berichtigt am 4. September.** Hier stand `m.length === 1`. Seit das
  // Register einen vierten Punkt führt (12, aus dem Auftrag an den
  // Rechtstexteanbieter), fehlen über diesem einen Beleg zwei — die Zahl war
  // die Registergröße von gestern und nicht die Aussage.
  assert.ok(m.length >= 1, 'kein Eintrag ohne Verweis — dann prüft dieser Fall nichts');
  assert.ok(m.every((x) => x.regel === 'eintrag-ohne-verweis'), JSON.stringify(m));
  assert.ok(m.some((x) => /Punkt 9/.test(x.text)), JSON.stringify(m));
});

test('Ein gestrichener Punkt lässt den Verweis ins Leere zeigen', () => {
  const ohneNeun = AGB_GLIEDERUNG.filter((g) => g.nr !== 9);
  const m = pruefeAgbVerweise(belegeMitVerweis, ohneNeun, AGB_VERWEISE);
  assert.ok(m.some((x) => x.regel === 'verweis-ins-leere'), JSON.stringify(m));
});

test('Jeder Eintrag des Verweisregisters nennt seinen Grund', () => {
  assert.ok(AGB_VERWEISE.length >= 2, 'das Register ist zu kurz');
  for (const v of AGB_VERWEISE) {
    assert.ok(v.warum && v.warum.length >= 40, `Punkt ${v.nr}: ohne belastbaren Grund`);
    assert.ok(v.erwartetImTitel && v.erwartetImTitel.length >= 4, `Punkt ${v.nr}`);
    // Das Wort muss im Titel vorkommen — bei „Vertragsschluss" ist es der
    // ganze Titel, und das ist in Ordnung: Geprüft wird die Zuordnung, nicht
    // die Länge.
    const punkt = AGB_GLIEDERUNG.find((g) => g.nr === v.nr);
    assert.ok(punkt, `Punkt ${v.nr} steht in keiner Gliederung`);
    assert.ok(punkt.titel.toLowerCase().includes(v.erwartetImTitel.toLowerCase()), `Punkt ${v.nr}`);
  }
});
