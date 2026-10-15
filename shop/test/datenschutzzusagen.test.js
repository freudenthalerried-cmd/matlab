/**
 * Die technischen Zusagen der Datenschutzseite.
 *
 * **Befund vom 2. September 2026.** Sechs Sätze auf `rechtliches/datenschutz.html`
 * sind Aussagen über den Code — keine Cookies, kein Zählpixel, keine fremde
 * Einbindung. Geprüft war, dass sie **dastehen**; ob sie stimmen, hat niemand
 * gemessen.
 *
 * > **Eine Zusage auf einer Rechtsseite, die niemand nachmisst, ist eine
 * > Behauptung mit Haftung.**
 *
 * Diese Datei prüft das Register selbst; die Messung an den gebauten Dateien
 * macht `npm run pruefe-datenschutz`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { websiteVerarbeitung } from '../src/rechtstexte.js';

/**
 * **Aus der Konstanten wurde am 4. September eine Funktion** (Gate 26): Die
 * Zusage über den Warenkorb hängt am Bestellweg. Diese Proben messen den
 * ausgeschalteten Zustand — den heutigen — und eine von ihnen beide.
 */
const WEBSITE_VERARBEITUNG = websiteVerarbeitung(false);
import { KORBSCHLUESSEL } from '../src/shopkern.js';

test('Jede Zusage trägt eine Kennung', () => {
  assert.ok(WEBSITE_VERARBEITUNG.length >= 5, 'die Liste ist zu kurz — die Schleife prüfte zu wenig');
  const gesehen = new Set();
  for (const z of WEBSITE_VERARBEITUNG) {
    assert.ok(z.id, `„${z.was}" ohne Kennung — sie kann keiner Messung zugeordnet werden`);
    assert.equal(gesehen.has(z.id), false, `${z.id} steht zweimal`);
    gesehen.add(z.id);
    assert.ok(z.befund && z.befund.length > 40, `${z.id}: der Befund fehlt oder ist zu knapp`);
  }
});

test('Was nicht messbar ist, sagt warum', () => {
  // Dieselbe Pflicht wie bei den offenen Punkten und den Außentexten: Wer
  // eine Zusage als unprüfbar einträgt, soll beim Schreiben des Grundes
  // merken, dass er keinen hat.
  const ohne = WEBSITE_VERARBEITUNG.filter((z) => z.pruefbar === false);
  assert.ok(ohne.length >= 1, 'keine einzige unprüfbare Zusage — die Schleife prüfte nichts');
  for (const z of ohne) {
    assert.ok(z.warumNicht && z.warumNicht.length >= 40, `${z.id}: ohne belastbaren Grund`);
  }
});

test('Der genannte Speicherschlüssel ist der benutzte', () => {
  // Der erste Wurf dieser Seite schrieb „fb.warenkorb" — frei erfunden, in
  // einer Rechtsseite. Genau die Sorte Angabe, die niemand nachprüft.
  const zusage = WEBSITE_VERARBEITUNG.find((z) => z.id === 'warenkorb-im-browser');
  assert.ok(zusage, 'die Zusage über den Warenkorb fehlt');
  assert.ok(zusage.befund.includes(KORBSCHLUESSEL), zusage.befund);
});

test('Jede prüfbare Zusage ist eine Aussage über den Bau, nicht über Recht', () => {
  // Die Trennung ist der Zweck dieser Liste: Der Wortlaut der Erklärung kommt
  // vom Rechtstexteanbieter, der technische Befund von hier. Eine
  // Paragraphenangabe in dieser Liste wäre ein Rechtstext, den niemand
  // beauftragt hat.
  assert.ok(WEBSITE_VERARBEITUNG.length >= 5, 'die Liste ist leer — die Schleife prüfte nichts');
  for (const z of WEBSITE_VERARBEITUNG) {
    assert.doesNotMatch(z.befund, /Art\.\s*\d|§\s*\d|DSGVO verlangt/, `${z.id}: das ist Rechtstext`);
  }
});
