import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { findeInterna, pruefeSeiten, INTERNA } from '../src/interna.js';
import { ZAHLUNGSBEDINGUNGEN, AGB_GLIEDERUNG } from '../src/rechtstexte.js';
import { ZAHLWEGE } from '../src/zahlung.js';

const ids = (text) => findeInterna(text).map((f) => f.id);

test('die eigene Spanne und das Lieferantenskonto werden gemeldet', () => {
  assert.deepEqual(ids('Beide Lieferanten geben 3 % Skonto bei 14 Tagen, das hebt die Rohmarge.').sort(),
    ['eigene-marge', 'lieferantenkondition']);
  assert.deepEqual(ids('Diese 3 % heben die Rohmarge von 25 auf 27,25 %.'), ['eigene-marge']);
  assert.ok(ids('Wir gewähren 25 % Zuschlag.').includes('eigene-marge'));
});

test('Gate-Nummern und Lieferantennamen gehören nicht auf eine Kundenseite', () => {
  assert.ok(ids('Maßgeblich für Gate 21 ist der Geldeingang.').includes('gate'));
  assert.ok(ids('Bezogen über Poschacher.').includes('lieferantenname'));
  assert.equal(ids('Verarbeitung nach dem Merkblatt von Baumit.').length, 0,
    'Herstellernamen der Ware sind kein Interna — nur der eigene Bezugsweg');
});

test('Programmkennungen verraten, dass eine Seite ihren Datensatz ausgibt', () => {
  assert.ok(ids('Zahlweg: karte-stripe').includes('programmkennung'));
  assert.equal(ids('EPS-Onlineüberweisung').length, 0, 'der Kundenname des Zahlwegs ist erlaubt');
  assert.equal(ids('Das Konzept sieht Gipsputz vor.').length, 0);
});

test('ein sauberer Kundentext löst nichts aus', () => {
  const text = 'Gezahlt wird bei der Bestellung. Die Ware geht auf den Weg, '
    + 'sobald der Betrag eingelangt ist. Lieferung im Umkreis von Ried in der Riedmark.';
  assert.deepEqual(findeInterna(text), []);
});

test('eine Ausnahme ohne Eingrenzung deckt die ganze Seite, mit Eingrenzung nur ihre Muster', () => {
  const seite = { kennung: 'index', html: 'Handelsspanne von 25 Prozent, Gate 21.' };
  assert.equal(pruefeSeiten([seite]).meldungen.length, 2);
  assert.equal(pruefeSeiten([{ ...seite, ausnahme: 'begruendet — Kernaussage' }]).sauber, true);

  const eng = pruefeSeiten([{ ...seite, ausnahme: 'begruendet — Kernaussage', nur: ['eigene-marge'] }]);
  assert.equal(eng.meldungen.length, 1, 'die eingegrenzte Ausnahme lässt Gate 21 stehen');
  assert.equal(eng.meldungen[0].id, 'gate');
  assert.equal(eng.ausnahmen[0].nur.join(), 'eigene-marge');
});

test('jeder Zahlweg trägt einen Kundensatz, und der ist frei von Interna', () => {
  // Der eigentliche Fehler war nicht das Muster, sondern die fehlende
  // Trennung: Es gab nur eine Begründung, und die war die interne.
  const alle = [
    ...ZAHLUNGSBEDINGUNGEN.angeboten,
    ...ZAHLUNGSBEDINGUNGEN.zurueckgestellt,
    ...ZAHLUNGSBEDINGUNGEN.ausgeschlossen,
  ];
  assert.ok(alle.length >= 6, 'ohne Einträge prüft diese Schleife nichts');
  for (const z of alle) {
    assert.ok(z.kunde, `${z.id}: Kundensatz fehlt`);
    assert.deepEqual(findeInterna(z.kunde), [], `${z.id}: Interna im Kundensatz`);
    assert.ok(ZAHLWEGE.some((w) => w.id === z.id), `${z.id}: kein Zahlweg dieses Namens`);
  }
});

test('die AGB-Gliederung ist frei von Interna', () => {
  // Sie steht auf einer Kundenseite, obwohl ihre Spalte „Warum" an den
  // Rechtstexteanbieter gerichtet ist. Solange sie dort steht, gilt für sie
  // dieselbe Regel wie für jeden anderen veröffentlichten Satz.
  assert.ok(AGB_GLIEDERUNG.length >= 12, 'ohne Punkte prüft diese Schleife nichts');
  for (const p of AGB_GLIEDERUNG) {
    assert.deepEqual(
      findeInterna(String(p.hinweis ?? '')).map((f) => `${f.id}: ${f.fund}`), [],
      `AGB-Punkt ${p.nr} (${p.titel}) enthält Interna`,
    );
  }
});

test('das Register ist begründet', () => {
  assert.ok(INTERNA.length >= 6);
  for (const m of INTERNA) {
    assert.ok(m.id && m.warum, `${m.id}: Grund fehlt`);
    assert.ok(m.muster.flags.includes('g'), `${m.id}: Muster ohne g findet nur den ersten Treffer`);
  }
});

/**
 * **Die Regel galt für den Rumpf, nicht für die Seite — 10. September 2026.**
 *
 * `bin/website.mjs` prüfte die Interna an `seite.html`: dem Rumpf, wie ihn
 * die Seitenbauer abliefern. Geschrieben wird, was `rahmen()` daraus macht —
 * mitsamt Kopf, Fuß und dem Absatz, den `mitMindestwert()` anhängt. Genau
 * dieser Absatz trug seit dem 5. September auf **zwanzig** Kundenseiten
 * „(Quelle: eigene Entscheidung, Gate 25, …)" — eine Gate-Nummer, das erste
 * Muster des Registers.
 *
 * > **Eine Prüfung, die das Modell liest statt die Ausgabe, prüft die eigene
 * > Absicht.**
 *
 * Dieser Testfall liest die Dateien, die auf dem Hosting landen. Er misst
 * damit unabhängig vom Bauwerkzeug — auch dann, wenn jemand die Prüfung
 * dort wieder an den Rumpf hängt.
 */
test('keine gebaute Seite trägt Interna', (t) => {
  const shop = dirname(dirname(fileURLToPath(import.meta.url)));
  const site = join(shop, 'ausgabe', 'site');
  if (!existsSync(site)) return t.skip('ausgabe/site fehlt — zuerst npm run website');
  const seiten = [];
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner)) {
      const pfad = join(ordner, e);
      if (statSync(pfad).isDirectory()) gehe(pfad);
      else if (e.endsWith('.html')) {
        seiten.push({ kennung: pfad.split('/site/')[1], html: readFileSync(pfad, 'utf8') });
      }
    }
  };
  gehe(site);
  assert.ok(seiten.length >= 60, `nur ${seiten.length} gebaute Seiten — hier ist nichts zu messen`);
  const befund = pruefeSeiten(seiten);
  assert.deepEqual(
    befund.meldungen.map((m) => `${m.kennung} [${m.id}] ${m.fund}`), [],
  );
});
