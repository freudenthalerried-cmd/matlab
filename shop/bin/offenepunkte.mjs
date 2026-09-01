#!/usr/bin/env node
/**
 * Was noch offen ist — gezogen, nicht fortgeschrieben.
 *
 *   node bin/offenepunkte.mjs
 *
 * Fragt die Werkzeuge, die es ohnehin gibt: `startklar()` für den Weg online,
 * `katalogFeed()` für den Produktfeed, `preisalterBefund()` für die Frische
 * der Einkaufspreise. Was kein Werkzeug weiß, steht in
 * `src/offenepunkte.js` — mit dem Grund, warum keines es weiß.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { offenePunkte } from '../src/offenepunkte.js';
import { startklar } from '../src/startklar.js';
import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';
import { ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { katalogFeed } from '../src/maschinenlesbar.js';
import { preisalterBefund, GRENZE_TAGE } from '../src/preisalter.js';
import { LIEFERGEBIET } from '../src/liefergebiet.js';
import { WARENKOERBE } from './kampagne.mjs';
import { fracht } from '../src/preis.js';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(SHOP, '..');
const lies = (p) => JSON.parse(readFileSync(p, 'utf8'));

const preisPfad = join(REPO, 'preise', 'baustoff-preise.json');
const preisdateiVorhanden = existsSync(preisPfad);
const betreiber = lies(join(SHOP, 'data', 'betreiber.json'));
const lieferantenDatei = lies(join(SHOP, 'data', 'lieferanten.json'));
const katalog = ladeBaustoffkatalog(
  lies(join(SHOP, 'data', 'katalog-baustoff.json')),
  preisdateiVorhanden ? lies(preisPfad) : null,
  lieferantenDatei,
);

// --- Was startklar weiß -----------------------------------------------------
//
// `wer` sagt dort, wer handeln muss, und ob es Geld kostet. Übersetzt in die
// Zuständigkeiten dieser Liste — nicht neu entschieden.
const ZUSTAENDIG_AUS_STARTKLAR = {
  'Auftraggeber': 'eintragen',
  'Auftraggeber (Anfrage)': 'anfrage',
  'Auftraggeber (Ausgabe)': 'ausgabe',
  'Werkzeug': 'werkzeug',
};

const befund = startklar({
  betreiber,
  impressumsfelder: IMPRESSUMSFELDER,
  katalog,
  preisdateiVorhanden,
  zahlungsanbieter: betreiber.zahlungsanbieter ?? null,
  rechtstexteFundstelle: betreiber.rechtstexteFundstelle ?? null,
  domainZeigtAufShop: betreiber.domainZeigtAufShop ?? null,
  repositoryPrivat: betreiber.repositoryPrivat ?? null,
  lieferanten: lieferantenDatei.lieferanten,
});

const ausWerkzeugen = [];
for (const p of befund.punkte) {
  if (p.zustand === 'erfuellt') continue;
  // `domainZeigtAufShop` und `repositoryPrivat` sind hier nicht feststellbar —
  // sie stehen in der handgeführten Liste bzw. als Entscheidung, nicht als
  // Werkzeugbefund, der nichts messen konnte.
  const zustaendig = p.zustand === 'unpruefbar' ? 'entscheidung' : ZUSTAENDIG_AUS_STARTKLAR[p.wer];
  if (!zustaendig) {
    console.error(`Abbruch: startklar meldet „${p.wer}" — dafür gibt es hier keine Zuständigkeit.`);
    console.error('Eine Liste, die einen Punkt still fallen lässt, ist schlimmer als keine.');
    process.exit(2);
  }
  ausWerkzeugen.push({ id: p.id, titel: p.titel, zustaendig, befund: p.befund, quelle: 'npm run startklar' });
}

// --- Was der Feed weiß ------------------------------------------------------
const lieferant = katalog.lieferantenById.get(katalog.artikel[0]?.lieferantId);
const feed = katalogFeed(katalog.artikel, {
  liefergebiet: { land: LIEFERGEBIET.land, bezirke: LIEFERGEBIET.bezirke.map((b) => b.name) },
  versandkostenNetto: (a) => fracht([{ ...a, menge: 1 }], lieferant).betragNetto,
  seitenadresse: betreiber.domain ? (a) => `${String(betreiber.domain).replace(/\/+$/, '')}/artikel/${a.sku}.html` : null,
});
const jeLuecke = new Map();
for (const e of feed.mitLuecken) {
  for (const f of e.fehlend) jeLuecke.set(f, (jeLuecke.get(f) ?? 0) + 1);
}
for (const [text, wieOft] of jeLuecke) {
  ausWerkzeugen.push({
    id: `feed:${text.split('—')[0].trim()}`,
    titel: `Produktfeed: ${text.split('—')[0].trim()}`,
    zustaendig: 'anfrage',
    befund: `${text} — bei ${wieOft} von ${feed.anzahl} Feedeinträgen. Ohne sie wird der Feed abgelehnt, nicht teilweise angenommen.`,
    quelle: 'npm run veroeffentlichung',
  });
}

// --- Was das Preisalter weiß ------------------------------------------------
const beworbeneSkus = new Set(Object.values(WARENKOERBE).flatMap((k) => k.positionen.map((p) => p.sku)));
const alter = preisalterBefund({
  artikel: lies(join(SHOP, 'data', 'katalog-baustoff.json')).artikel,
  heute: new Date().toISOString().slice(0, 10),
  beworbeneSkus,
});
if (alter.verdacht.length) {
  ausWerkzeugen.push({
    id: 'preisalter',
    titel: `${alter.verdacht.length} Einkaufspreise älter als ${GRENZE_TAGE} Tage`,
    zustaendig: 'anfrage',
    befund: `ältester ${alter.aelteste} Tage, Median ${alter.median}. Auf keinem ruht ein Gebot — `
      + 'aber ein alter Einstand ist die Marge von gestern, ausgewiesen als die von heute.',
    quelle: 'npm run pruefe-preisalter',
  });
}

// --- Ausgabe ----------------------------------------------------------------
const gruppen = offenePunkte(ausWerkzeugen);
const gesamt = gruppen.reduce((s, g) => s + g.punkte.length, 0);

console.log(`\nOffene Punkte — ${gesamt} in ${gruppen.length} Gruppen, Stand ${new Date().toISOString().slice(0, 10)}`);
console.log('Gezogen aus startklar, veroeffentlichung und pruefe-preisalter; der Rest steht');
console.log('in src/offenepunkte.js, jeder mit dem Grund, warum ihn kein Werkzeug kennt.\n');

for (const g of gruppen) {
  console.log(`${g.titel}  (${g.punkte.length})`);
  for (const p of g.punkte) {
    console.log(`  · ${p.titel}`);
    console.log(`      ${p.befund}`);
    if (p.loest) console.log(`      Löst: ${p.loest}`);
    console.log(`      [${p.quelle}]`);
  }
  console.log('');
}

console.log('Diese Aufstellung löst keine Ausgaben aus. Das Versenden einer Anfrage an Dritte,');
console.log('der Kauf von Ware und jede Ausgabe bleiben Sache des Auftraggebers.');
