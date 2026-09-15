import test from 'node:test';
import assert from 'node:assert/strict';
import { darfAutomatischAusgeloestWerden } from '../src/bestellung.js';

// Ein Warenkorb, dessen Positionen bestätigte Preise tragen und dessen
// Mindestbestellwerte erfüllt sind — an ihm allein entscheidet Gate 20.
const korb = (warenwertNetto, einkaufNetto, frachtNetto) => ({
  bestellbar: true,
  warenwertNetto,
  einkaufNetto,
  frachtNetto,
  teillieferungen: [{ lieferantName: 'Testlieferant', lieferzeitWerktage: 5, positionen: [{ ekIstPlatzhalter: false }] }],
});
// Seit dem 1. September gehören Lieferadresse, Ansprechpartner und
// Absenderfirma zu einem auslösbaren Auftrag. Der Fixture-Auftrag trug sie
// nicht — er war nie „gesund", nur nie danach gefragt worden.
const auftrag = (zusatz = {}) => ({
  zahlungEingegangen: true,
  kundeIstUnternehmer: true,
  uid: 'ATU12345675',
  absender: { firma: 'Musterfirma GmbH' },
  lieferadresse: {
    name: 'Bau Muster GmbH',
    strasse: 'Baustellenweg 7',
    plz: '4600',
    ort: 'Wels',
    telefon: '+43 660 1234567',
  },
  ...zusatz,
});

test('keine Bestellung über eine Menge, die es nicht gibt', () => {
  /*
   * **13. September 2026.** Die Sperren dieser Funktion schützen das Geld
   * (Zahlung, Marge, Konditionen) und seit dem 1. September die Zustellung
   * (Telefon, Absenderfirma). Was fehlte, war der Schutz der **Ware**:
   * `XPS glatt SF 30 mm 0,75 m2` wird in Platten zu 0,75 m² abgegeben, und
   * 40 m² sind 53⅓ Platten. Beide Wege der Oberfläche runden auf — von hier
   * aus ginge die krumme Zahl an den Lieferanten.
   */
  const mitMenge = (menge) => ({
    bestellbar: true,
    warenwertNetto: 4000,
    einkaufNetto: 3000,
    frachtNetto: 0,
    teillieferungen: [{
      lieferantName: 'Testlieferant',
      lieferzeitWerktage: 5,
      positionen: [{
        sku: 'POS-12569',
        bezeichnung: 'XPS glatt SF 30 mm 0,75 m2',
        einheit: 'M2',
        menge,
        ekIstPlatzhalter: false,
      }],
    }],
  });

  const krumm = darfAutomatischAusgeloestWerden(mitMenge(40), auftrag());
  assert.equal(krumm.erlaubt, false, 'eine unlieferbare Menge geht an den Lieferanten');
  assert.ok(krumm.gruende.some((g) => /Unlieferbare Menge/.test(g)), krumm.gruende.join(' | '));

  // Und die Gegenrichtung, sonst prüft der Fall die falsche Sperre: 53 Platten
  // sind 39,75 m², und daran ist nichts auszusetzen.
  const glatt = darfAutomatischAusgeloestWerden(mitMenge(39.75), auftrag());
  assert.deepEqual(glatt.gruende.filter((g) => /Unlieferbare Menge/.test(g)), []);
});


test('Gate 20 sperrt eine Bestellung, die ihre Fracht nicht trägt', () => {
  // 50 € Warenkorb, 20 % Rohmarge, 25 € Fracht frei Haus.
  const freigabe = darfAutomatischAusgeloestWerden(korb(50, 40, 25), auftrag({ frachtVerrechnet: false }));
  assert.equal(freigabe.erlaubt, false);
  assert.ok(
    freigabe.gruende.some((g) => g.startsWith('Gate 20')),
    'die Sperre nennt sich beim Namen, damit man sie im Betrieb wiedererkennt',
  );
});

test('derselbe Warenkorb geht durch, wenn die Fracht verrechnet wird', () => {
  const freigabe = darfAutomatischAusgeloestWerden(korb(50, 40, 25), auftrag({ frachtVerrechnet: true }));
  assert.equal(freigabe.erlaubt, true, 'zahlt der Kunde die Fracht, trägt die Bestellung sich');
});

test('der erfüllte Mindestbestellwert rettet eine Verlustbestellung nicht', () => {
  // bestellbar: true — die Kondition des Lieferanten ist erfüllt. Sie sagt
  // nichts darüber, ob wir an der Bestellung etwas verdienen.
  const k = korb(120, 96, 60);
  assert.equal(k.bestellbar, true);
  const freigabe = darfAutomatischAusgeloestWerden(k, auftrag({ frachtVerrechnet: false }));
  assert.equal(freigabe.erlaubt, false);
  assert.ok(!freigabe.gruende.includes('Mindestbestellwert nicht erreicht'), 'der Mindestbestellwert ist erfüllt');
  assert.ok(freigabe.gruende.some((g) => g.startsWith('Gate 20')), 'trotzdem sperrt Gate 20');
});

test('die Prüfung läuft auch ohne Angaben im Auftrag — sie überspringt sich nicht selbst', () => {
  // Kein zahlweg, kein frachtVerrechnet: Es gilt die Voreinstellung, und die
  // Prüfung findet trotzdem statt. Ein Verkauf unter Einkaufspreis fällt auf.
  const unterEinkauf = darfAutomatischAusgeloestWerden(korb(100, 130, 0), auftrag());
  assert.equal(unterEinkauf.erlaubt, false);
  assert.ok(unterEinkauf.gruende.some((g) => g.startsWith('Gate 20')));
});

test('eine gesunde Bestellung passiert alle Sperren', () => {
  const freigabe = darfAutomatischAusgeloestWerden(korb(650, 520, 25), auftrag({ frachtVerrechnet: false }));
  assert.equal(freigabe.erlaubt, true, freigabe.gruende.join('; '));
  assert.equal(freigabe.gruende.length, 0);
});

/* ------------------------------------------------------------------ *
 * Am echten Katalog: wo die Schwelle jetzt liegt
 * ------------------------------------------------------------------ */

test('eine kleine Palettenbestellung trägt sich nicht mehr, auch mit verrechneter Fracht', async () => {
  /*
   * Der Befund vom 28.08., als Probe festgehalten. 50 m² Fassaden-EPS sind
   * 96,50 € Warenwert; die Fracht zahlt der Kunde. Vor dem Einbau von Palette
   * und Folierung stand hier ein Deckungsbeitrag von +24,00 €, danach −4,50 €.
   *
   * **Berichtigt am 13. September 2026 — und der Befund kippt.** Die −4,50 €
   * sind mit **22,00 €** je Palette gerechnet, also mit dem Pfandbetrag als
   * Kosten. `src/palettenkreis.js` hat das am 4. September widerlegt: Pfand ist
   * eine Auslage; was kostet, sind 2,00 € Differenz plus der Anteil an der
   * Rückführungsfahrt, zusammen **13,47 €**. Mit der berichtigten Zahl steht
   * hier **+4,03 €**, und diese Bestellung trägt sich.
   *
   * > **Ein Befund, der auf einer berichtigten Zahl ruht, ist mit ihr zu
   * > berichtigen — auch wenn er dabei sein Vorzeichen wechselt.**
   *
   * Die Sache, um die es 28.08. ging, gilt unverändert: Eine kleine
   * Palettenbestellung trägt ihre Nebenkosten nicht. Nur liegt die Grenze
   * jetzt bei **rund 41 m²** statt bei rund 53 — der Fall prüft sie weiter
   * unten mit 40 m², also dort, wo sie heute liegt.
   *
   * Ohne Preisdatei ist dieser Test still: Er prüft eine Zahl, die es dann
   * nicht gibt — und ein Test, der ohne Daten grün meldet, wäre schlimmer als
   * keiner.
   */
  const { existsSync, readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const pfad = (p) => fileURLToPath(new URL(p, import.meta.url));
  const preise = pfad('../../preise/baustoff-preise.json');
  if (!existsSync(preise)) return;

  const { ladeBaustoffkatalog } = await import('../src/baustoffkatalog.js');
  const { berechneWarenkorb } = await import('../src/warenkorb.js');
  const { traegtSichSelbst } = await import('../src/kostenbild.js');
  const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const lieferanten = lies(pfad('../data/lieferanten.json'));
  const k = ladeBaustoffkatalog(lies(pfad('../data/katalog-baustoff.json')), lies(preise), lieferanten);
  const katalog = { artikel: k.artikel, lieferantenById: new Map(lieferanten.lieferanten.map((l) => [l.id, l])) };

  const klein = berechneWarenkorb([{ sku: 'POS-12566', menge: 40 }], katalog);
  assert.equal(klein.nebenkostenUntergrenzeNetto, 19.97,
    'Palette (13,47) und Folierung (6,50) stehen im Warenkorb');
  const kleinDeckung = traegtSichSelbst(klein, { frachtVerrechnet: true, zahlwegId: 'vorkasse' });
  assert.equal(kleinDeckung.traegt, false, 'die kleine Palettenbestellung trägt sich nicht');

  // Der Fall vom 28.08. selbst, mit der berichtigten Zahl: Er kippt, und das
  // gehört festgehalten statt weggelassen.
  const damals = berechneWarenkorb([{ sku: 'POS-12566', menge: 50 }], katalog);
  const damalsDeckung = traegtSichSelbst(damals, { frachtVerrechnet: true, zahlwegId: 'vorkasse' });
  assert.equal(damalsDeckung.deckungsbeitragNetto, 4.03,
    'die 50 m² vom 28.08. — mit 22,00 € je Palette waren es −4,50 €');
  assert.equal(damalsDeckung.traegt, true);

  const gross = berechneWarenkorb([{ sku: 'POS-12566', menge: 300 }], katalog);
  const grossDeckung = traegtSichSelbst(gross, { frachtVerrechnet: true, zahlwegId: 'vorkasse' });
  assert.equal(grossDeckung.traegt, true, 'die große trägt sich weiterhin');
});

/* ------------------------------------------------------------------ *
 * Die Zustellung, nicht das Geld — Befund vom 1. September
 *
 * Alle Sperren davor schützen das Geld: Zahlung, Konditionen, Marge. Der
 * erzeugte Bestelltext zeigte, was ungeschützt war.
 * ------------------------------------------------------------------ */

const gesund = () => korb(650, 520, 25);

test('Ohne Telefon des Ansprechpartners wird nicht ausgelöst', () => {
  const f = darfAutomatischAusgeloestWerden(gesund(), auftrag({
    lieferadresse: { name: 'B', strasse: 'S 1', plz: '4600', ort: 'Wels' },
    frachtVerrechnet: false,
  }));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Telefon')));
});

test('Ohne Absenderfirma wird nicht ausgelöst — der Lieferant kann sie nicht zuordnen', () => {
  const f = darfAutomatischAusgeloestWerden(gesund(), auftrag({ absender: {}, frachtVerrechnet: false }));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Firma des Bestellers')));
});

test('Ohne bekannte Lieferzeit wird kein Termin unbestellt zugesagt', () => {
  const k = gesund();
  k.teillieferungen = [{ lieferantName: 'Testlieferant', positionen: [{ ekIstPlatzhalter: false }] }];
  const f = darfAutomatischAusgeloestWerden(k, auftrag({ frachtVerrechnet: false }));
  assert.equal(f.erlaubt, false);
  assert.ok(f.gruende.some((g) => g.includes('Lieferzeit unbekannt')));
});

test('Eine fehlende Lieferadresse meldet jedes Feld einzeln, nicht pauschal', () => {
  const f = darfAutomatischAusgeloestWerden(gesund(), auftrag({ lieferadresse: {}, frachtVerrechnet: false }));
  assert.equal(f.erlaubt, false);
  assert.equal(f.gruende.filter((g) => g.startsWith('Bestelltext unvollständig')).length, 5);
});
