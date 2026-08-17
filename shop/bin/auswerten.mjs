#!/usr/bin/env node
/**
 * Die Antworten des Freigabetags auswerten.
 *
 *   node bin/auswerten.mjs [antworten.json]
 *
 * Ohne Argument läuft die fiktive Beispieldatei — als Probelauf, wie beim
 * Import. Die Regeln stehen in `auswertung.js` und `partnerauswertung.js`
 * und sind vorab festgelegt (Gate 17); dieses Werkzeug trägt nur vor, es
 * entscheidet nichts selbst.
 */

import { readFileSync } from 'node:fs';
import { pruefeBogen, werteRundeAus } from '../src/auswertung.js';
import { pruefePartnerbogen, wertePartnerrundeAus, PREISBAND_STUFE_A } from '../src/partnerauswertung.js';

const datei = process.argv[2] ?? new URL('../beispiel/antworten-beispiel.json', import.meta.url);
const daten = JSON.parse(readFileSync(datei, 'utf8'));

const pct = (n) => (n * 100).toFixed(1).replace('.', ',') + ' %';
const eur = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';

console.log(`\nAntwortdatei: ${datei}`);
if (daten._hinweis) console.log(`Hinweis: ${daten._hinweis}\n`);

// --- Lieferanten -----------------------------------------------------------
const lieferanten = daten.lieferanten ?? [];
console.log(`Lieferantenantworten: ${lieferanten.length}`);
for (const a of lieferanten) {
  const bogen = pruefeBogen(a);
  if (bogen.vollstaendig) {
    console.log(`  ✓ ${a.hersteller} — Bogen vollständig`);
  } else {
    console.log(`  ✗ ${a.hersteller} — unvollständig:`);
    for (const f of bogen.fehlend) console.log(`      · ${f}`);
  }
}

const runde = werteRundeAus(lieferanten, daten.lage ?? null);
console.log(`\nPrüfung A: ${runde.pruefungA ? 'BESTANDEN' : 'NICHT BESTANDEN'}`);
console.log(`  beziffert: ${runde.beziffert}, bestanden: ${runde.bestanden} von ${runde.antworten}`);
if (!runde.pruefungA) {
  console.log(`  Grund: ${runde.grund}`);
} else {
  console.log(`  tragende Marge: ${pct(runde.tragendeMarge)} (der schwächere der beiden besten)`);
  if (runde.folgen?.tragfaehig) {
    console.log(`  Folgen: ${eur(runde.folgen.umsatzNetto)} Umsatz, ${runde.folgen.bestellungen} Bestellungen, ${runde.folgen.sessions ?? '—'} Sessions im Monat`);
  }
}
for (const e of runde.einzeln) {
  if (!e.bestanden && e.fehlend.length > 0) {
    console.log(`  ${e.hersteller}: es fehlt — ${e.fehlend.join('; ')}`);
  }
}

// --- Partner ---------------------------------------------------------------
const partner = daten.partner ?? [];
if (partner.length > 0) {
  console.log(`\nPartnerantworten: ${partner.length}`);
  for (const a of partner) {
    const bogen = pruefePartnerbogen(a);
    console.log(`  ${bogen.vollstaendig ? '✓' : '✗'} ${a.betrieb} (${a.bezirk})${bogen.vollstaendig ? '' : ' — unvollständig'}`);
  }

  const p = wertePartnerrundeAus(partner);
  console.log(`\nPartnerrunde: ${p.machbar ? 'MACHBAR' : 'NICHT MACHBAR'}`);
  console.log(`  bestanden: ${p.bestanden} von ${p.antworten}, Nennungen: ${p.nennungen}, mit Feuchtearbeiten: ${p.mitFeuchteArbeiten}`);
  if (p.machbar) {
    const band = `${PREISBAND_STUFE_A.von}–${PREISBAND_STUFE_A.bis} €`;
    console.log(`  tragender Leadpreis: ${eur(p.tragenderLeadpreis)} — ${p.imPreisband ? `im Band ${band}` : `AUSSERHALB des Bands ${band}`}`);
  } else {
    console.log(`  Grund: ${p.grund}`);
  }
}

console.log('\nDie Regeln stehen vorab fest (Gate 17). Dieses Werkzeug trägt vor, es entscheidet nicht.');
