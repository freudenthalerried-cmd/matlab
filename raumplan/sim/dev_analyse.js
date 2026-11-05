// Analyse eines Entwickler-Falls: node sim/dev_analyse.js fall-….json
// Zusammenfassung, Diagnose, Markensichtbarkeit, Nachrechnung (PG.reconstruct mit gespeicherten Erkennungen) und Soll-Ist-Vergleich.
const fs = require('fs'), vm = require('vm'), PG = require('../pg.js');
const J = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ctx = { console, location: { search: '' }, localStorage: { getItem: () => null, setItem() { }, removeItem() { } }, document: { addEventListener() { } }, setTimeout, TextEncoder, Blob: class { }, navigator: {} };
vm.createContext(ctx); vm.runInContext(fs.readFileSync(__dirname + '/../dev.js', 'utf8') + ';this.DEV=DEV;', ctx); const DEV = ctx.DEV;
const f3 = v => v == null ? '–' : (+v).toFixed(3);
console.log(`== ${J.name} · ${J.app} · ${J.quelle} · ${J.W}×${J.H} · ${J.frames.length} Bilder, ${J.bilder.length} Fotos${J.video ? ', Video ' + J.video : ''}`);
console.log('Gerät:', J.ua.replace(/.*\((.*?)\).*/, '$1'), '| Kamera:', J.cam && J.cam.label, JSON.stringify(J.cam && J.cam.settings || {}));
console.log('Kalibrierung:', JSON.stringify(J.calib), '| Vorlage:', J.layout, '| printK', J.printK, '| opts', JSON.stringify(J.opts));
console.log('Eingaben:', JSON.stringify(Object.fromEntries(Object.entries(J.inputs).filter(([k]) => /^pg|^ar/.test(k)))));
console.log('\n-- Protokoll\n' + J.log);
const seen = {}, perF = J.frames.map(f => f.dets.length); J.frames.forEach(f => f.dets.forEach(d => (seen[d.id] = seen[d.id] || []).push(d.res)));
console.log('\n-- Marken je Bild: min', Math.min(...perF), 'Mittel', (perF.reduce((a, v) => a + v, 0) / perF.length).toFixed(1), '| Bilder ohne Marke:', perF.filter(v => !v).length);
console.log('Marke: Sichtungen (mittl. Kantenrest)'); console.log(Object.keys(seen).sort((a, b) => a - b).map(id => `${id}:${seen[id].length}(${(seen[id].reduce((a, v) => a + v, 0) / seen[id].length).toFixed(2)})`).join('  '));
if (J.rec) console.log(`\n-- Ergebnis App: rms ${J.rec.rms} px, f ${J.rec.it && J.rec.it[0]}, k1 ${J.rec.it && J.rec.it[3]}, ${J.rec.nImg} Bilder, verworfen ${J.rec.dropped || 0}${J.rec.suspect ? ', UNSICHER: ' + J.rec.suspect : ''}`);
J.res.forEach(d => console.log(`${d.name}: ${d.ok ? d.lengths.map((L, i) => `${f3(L)}±${d.sigma[i] == null ? '?' : (d.sigma[i] * 1000).toFixed(1)}[${d.groups[i].join(',')}]`).join('  ') : d.msg}${d.height ? ` | RH ${f3(d.height)}` : ''}${d.warn && d.warn.length ? ' | ' + d.warn.join(' / ') : ''}`));
if (J.soll) console.log('\n-- Soll:', JSON.stringify(J.soll), J.notiz ? '| Notiz: ' + J.notiz : '');
console.log('\n-- Diagnose'); DEV.diagnose(J).forEach(x => console.log(' • ' + x));
if (process.env.NOREPLAY) return;
console.log('\n-- Nachrechnung (gleiche Erkennungen, ohne Plausibilitätsprüfung)');
const t0 = Date.now(), rec = PG.reconstruct(J.frames, { ...J.opts, calib: J.calib || undefined, log: () => { } });
if (!rec.ok) return console.log('nicht möglich:', rec.msg);
const w = PG.walls(rec); console.log(`rms ${rec.res.rms.toFixed(3)} px, ${rec.nImg} Bilder, ${((Date.now() - t0) / 1000).toFixed(1)} s →`, w.ok ? w.lengths.map(f3).join(' / ') : w.msg);
if (w.ok && J.soll && J.soll.walls) { const m = DEV.match(w.lengths, J.soll.walls); if (m) console.log('Diff. zu Soll (mm):', m.d.map(v => (v * 1000).toFixed(1)).join(' / '), '| rms', (m.rms * 1000).toFixed(1), 'mm'); }
