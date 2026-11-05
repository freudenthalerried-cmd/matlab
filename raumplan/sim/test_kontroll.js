// Test: Kontrollmaße aus gesprochenem Text erkennen
global.localStorage = { getItem: () => null, setItem: () => { } }; const KM = require('../kontroll.js');
const T = [['Raumhöhe 2,55', 'hoehe', 2.55], ['Fenster Küche 1,20 breit', 'fenster', 1.2, 'b'], ['Fenster Küche 1,45 hoch', 'fenster', 1.45, 'h'], ['Tür Bad 80 breit', 'tuer', 0.8, 'b'], ['Wand Wohnzimmer 4 Meter 25', 'wand', 4.25],
  ['Diagonale 5,312', 'diag', 5.312], ['Parapet 90 cm', 'mass', 0.9, 'p'], ['Länge 3.605 m', 'wand', 3.605], ['2550 mm Raumhöhe', 'hoehe', 2.55], ['Fenster Bad Brüstung 1,10', 'fenster', 1.1, 'p'], ['Raumhöhe', 'hoehe', null]];
let ok = 0; T.forEach(([s, k, v, d]) => { const p = KM.parse(s), good = p.kind === k && (v === null ? p.v === null : Math.abs(p.v - v) < 1e-6) && (!d || p.dim === d); ok += good; console.log(good ? '✓' : '✗', s, '→', JSON.stringify(p), '|', KM.describe(p)); });
console.log(ok + '/' + T.length + ' richtig');
