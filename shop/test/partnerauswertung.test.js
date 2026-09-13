import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREISBAND_STUFE_A,
  PARTNER_BEDINGUNGEN,
  PARTNER_BOGEN,
  wertePartnerAus,
  wertePartnerrundeAus,
  pruefePartnerbogen,
} from '../src/partnerauswertung.js';

const guterPartner = {
  betrieb: 'Abdichtung Muster GmbH',
  bezirk: 'Braunau am Inn',
  gewerke: 'Bauwerksabdichtung, Radonsanierung',
  feuchteArbeiten: true,
  namentlicheNennung: true,
  leadpreis: 150,
  rueckmeldefrist24h: true,
  exklusivitaetLeistungsgebunden: true,
};

test('Vier Bedingungen, jede mit Text und Prüfung', () => {
  assert.equal(PARTNER_BEDINGUNGEN.length, 4);
  for (const b of PARTNER_BEDINGUNGEN) {
    assert.ok(b.text.length > 20, `${b.id} ohne tragfähigen Text`);
    assert.equal(typeof b.pruefe, 'function');
  }
});

test('Eine vollständige Zusage besteht', () => {
  const e = wertePartnerAus(guterPartner);
  assert.equal(e.bestanden, true);
  assert.equal(e.erfuellt, 4);
  assert.deepEqual(e.fehlend, []);
});

test('Die namentliche Nennung ist eine Ausschlussfrage — Schweigen zählt als Nein', () => {
  const e = wertePartnerAus({ ...guterPartner, namentlicheNennung: undefined });
  assert.equal(e.bestanden, false);
  assert.ok(e.fehlend.some((f) => /Einwilligung unwirksam/.test(f)));
});

test('Ein Leadpreis unter dem Band erfüllt die Preisbedingung nicht', () => {
  assert.equal(PREISBAND_STUFE_A.von, 100);
  const e = wertePartnerAus({ ...guterPartner, leadpreis: 60 });
  assert.equal(e.bestanden, false);
  assert.equal(e.beziffert, true, 'beziffert schon — nur zu niedrig');
});

test('Ohne Betrieb oder Bezirk wird gar nicht ausgewertet', () => {
  assert.throws(() => wertePartnerAus({ bezirk: 'Braunau am Inn' }), /braucht einen Betrieb/);
  assert.throws(() => wertePartnerAus({ betrieb: 'X GmbH' }), /braucht einen Bezirk/);
});

test('Eine einzelne Zustimmung belegt die Bauform nicht — der Ersatzbetrieb braucht den zweiten Namen', () => {
  const r = wertePartnerrundeAus([guterPartner, { ...guterPartner, betrieb: 'Zweiter', namentlicheNennung: false }]);
  assert.equal(r.machbar, false);
  assert.match(r.grund, /zweiten Namen/);
});

test('Zwei Bestandene machen die Runde machbar, der zweithöchste Preis trägt', () => {
  const r = wertePartnerrundeAus([
    guterPartner,
    { ...guterPartner, betrieb: 'Zweiter Betrieb', bezirk: 'Schärding', leadpreis: 220 },
    { ...guterPartner, betrieb: 'Dritter Betrieb', bezirk: 'Ried im Innkreis', namentlicheNennung: false },
  ]);
  assert.equal(r.machbar, true);
  assert.equal(r.bestanden, 2);
  assert.equal(r.tragenderLeadpreis, 150, 'nicht die besten 220, sondern die bestätigenden 150');
  assert.equal(r.imPreisband, true);
  assert.equal(r.mitFeuchteArbeiten, 3, 'Gruppe-C-Reichweite wird ausgewiesen');
});

test('Ein Preis über dem Band macht machbar, fällt aber aus dem Band', () => {
  const r = wertePartnerrundeAus([
    { ...guterPartner, leadpreis: 400 },
    { ...guterPartner, betrieb: 'Zweiter', bezirk: 'Schärding', leadpreis: 300 },
  ]);
  assert.equal(r.machbar, true);
  assert.equal(r.tragenderLeadpreis, 300);
  assert.equal(r.imPreisband, false, 'über 250 € — das Band aus dem Angebot ist verlassen');
});

test('Der Partnerbogen nennt jedes fehlende Pflichtfeld', () => {
  const p = pruefePartnerbogen({ betrieb: 'Nur der Name' });
  assert.equal(p.vollstaendig, false);
  assert.ok(p.fehlend.some((f) => /Einwilligungstext/.test(f)));
  assert.ok(p.fehlend.some((f) => /Leadpreis/.test(f)));
  assert.equal(pruefePartnerbogen(guterPartner).vollstaendig, true);
});

test('Jedes Bogenfeld trägt eine Frage', () => {
  assert.equal(PARTNER_BOGEN.length, 10);
  for (const f of PARTNER_BOGEN) {
    assert.ok(f.frage.length > 5, `${f.feld} ohne Frage`);
  }
});
