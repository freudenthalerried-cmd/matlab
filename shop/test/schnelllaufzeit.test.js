/**
 * Die Zeitmeldung des Schnelllaufs — und was sie misst.
 *
 * **Der Anlass, 14. September 2026.** Der Schnelllauf meldete drei Prüfer
 * „über der Sekunde aus Gate 38". Einzeln gemessen brauchten sie 0,75 s,
 * 0,53 s und 0,24 s. Der Behälter war beschäftigt.
 *
 * > **Eine Meldung, die bei Last erscheint und bei Ruhe nicht, sagt etwas
 * > über die Last.**
 *
 * **Und diese Prüfung darf nicht denselben Fehler machen.** Mein erster
 * Entwurf sicherte zu, dass bei ruhiger Maschine keine Meldung kommt — und
 * fiel prompt um, als die Gegenprobe unter Last lief. Eine Zusicherung über
 * die Abwesenheit einer lastabhängigen Meldung ist selbst lastabhängig.
 *
 * > **Wer eine wackelige Messung prüft, darf die Prüfung nicht auf dieselbe
 * > Wackelei stellen.**
 *
 * Geprüft wird deshalb das **Verhalten** am Quelltext und an einer Grenze,
 * die so klein ist, dass jeder Prüfer sie reißt — beides unabhängig davon,
 * was der Rechner sonst gerade tut.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const SHOP = fileURLToPath(new URL('..', import.meta.url));
const QUELLE = readFileSync(join(SHOP, 'bin', 'schnelllauf.mjs'), 'utf8');

test('Wer über der Grenze liegt, wird ein zweites Mal gemessen', () => {
  assert.match(QUELLE, /const zweitens = nachgemessen\(p\);/,
    'die zweite Messung fehlt — dann meldet eine einzelne Uhrzeit');
  assert.match(QUELLE, /if \(zweitens > GRENZE_MS\) langsame\.push\(/,
    'gemeldet wird, ohne dass die zweite Messung darüber liegt');
  // Und die erste Zahl geht nicht verloren: Wer nachsieht, soll den Abstand
  // zwischen beiden sehen — er ist das Maß für die Last.
  assert.match(QUELLE, /zuerst: gebraucht/);
});

test('Unter einer winzigen Grenze meldet er, und mit beiden Zahlen', () => {
  const e = spawnSync(process.execPath, [join(SHOP, 'bin', 'schnelllauf.mjs')],
    { cwd: SHOP, encoding: 'utf8', env: { ...process.env, SCHNELLLAUF_GRENZE_MS: '1' } });
  const aus = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  assert.match(aus, /über der Sekunde aus Gate 38/, aus.slice(0, 400));
  assert.match(aus, /zweimal gemessen/);
  assert.match(aus, /! \S+ — \d+\.\d s \(zuerst \d+\.\d s\)/,
    'die Meldung nennt nicht beide Messungen');
});

/*
 * **Die Naht senkt und hebt nicht.** Wäre die Grenze aus Gate 38 über eine
 * Umgebungsvariable zu heben, wäre sie keine Entscheidung mehr, sondern eine
 * Einstellung — und ein langsamer Prüfer ginge durch, indem jemand die Zahl
 * hochsetzt statt den Prüfer anzusehen.
 */
test('Die Naht kann die Grenze nur senken', () => {
  assert.match(QUELLE, /Math\.min\(1000, Number\(process\.env\.SCHNELLLAUF_GRENZE_MS\)/,
    'die Grenze lässt sich über die Umgebung heben');
  assert.doesNotMatch(QUELLE, /Math\.max\([^)]*SCHNELLLAUF_GRENZE_MS/);
});
