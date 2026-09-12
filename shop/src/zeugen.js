/**
 * Der Zeuge einer Gegenprobe — welcher Testfall sie eigentlich fängt.
 *
 * **Der Anlass, 12. September 2026.** Die Runde davor hat gemessen, warum
 * eine Auswahl nach geänderten Dateien bei den Gegenproben nicht trägt (142
 * von 210 Prüfern lesen ein ganzes Verzeichnis), und dabei den eigentlichen
 * Hebel benannt:
 *
 * > **57 der 210 Gegenproben haben `test` als Prüfer, und jede lässt dreimal
 * > die ganze Testreihe laufen.** Das sind gut 100 Sekunden je Probe und
 * > damit der Löwenanteil der 105 Minuten.
 *
 * Dagegen hilft keine Auswahl nach Dateien, sondern ein **Zeuge**: Wenn eine
 * Gegenprobe anschlägt, steht in der Ausgabe, welcher Testfall in welcher
 * Datei rot geworden ist. Wer das mitschreibt, muss beim nächsten Mal nicht
 * die ganze Reihe fahren, sondern genau diese Datei.
 *
 * **Warum das sicher ist, und in welche Richtung es schiefgeht.** Fängt den
 * Fall inzwischen ein anderer Testfall, dann meldet der Zeuge grün — die
 * Gegenprobe sagt „schlägt nicht an", und jemand sieht nach. Das ist ein
 * **falscher Alarm**, nicht ein falsches Grün. Die Verwechslung in die andere
 * Richtung kann nicht eintreten: Wird der Zeuge rot, ist die Mutation
 * gefangen worden.
 *
 * Der Stand ist kein Gedächtnis, das gepflegt werden müsste: Er wird bei
 * jedem Anschlag neu geschrieben. Fehlt er, läuft die ganze Reihe.
 */

/**
 * Die Testdateien, in denen bei diesem Lauf etwas rot geworden ist.
 *
 * Gelesen wird die TAP-Ausgabe von `node --test`: Auf jedes `not ok` folgt
 * ein Block mit `location: '…/test/x.test.js:12:1'`. Genommen werden **alle**
 * roten Dateien und nicht nur die erste — fängt den Fall mehr als eine, sind
 * sie alle Zeugen, und keine davon darf beim nächsten Mal fehlen.
 */
export function zeugeAus(ausgabe) {
  const zeilen = String(ausgabe ?? '').split('\n');
  const dateien = new Set();
  for (let i = 0; i < zeilen.length; i++) {
    if (!zeilen[i].startsWith('not ok')) continue;
    for (let j = i + 1; j < Math.min(i + 8, zeilen.length); j++) {
      if (zeilen[j].startsWith('not ok')) break;
      const t = zeilen[j].match(/location:\s*'([^']*\/(test\/[\w.-]+\.test\.js)):\d+/);
      if (t) { dateien.add(`shop/${t[2]}`); break; }
    }
  }
  return [...dateien].sort();
}

/**
 * Der Befehl, mit dem eine Gegenprobe ihren Prüfer ruft.
 *
 * Zwei Gestalten, und der Unterschied ist wichtig genug für einen eigenen
 * Wert: Ein Skript aus `package.json` — oder, wenn ein Zeuge bekannt ist, der
 * Testlauf über genau diese Dateien. Der Läufer spart den Vorlauf einer Probe,
 * wenn die vorige **denselben Befehl** hatte; mit Zeugen genügt dafür nicht
 * mehr derselbe Prüfername.
 */
export function befehlFuer(probe, zeugen = {}) {
  const dateien = probe.pruefer === 'test' ? (zeugen[probe.id] ?? []) : [];
  return dateien.length ? `node --test ${dateien.join(' ')}` : `npm ${probe.pruefer}`;
}

/**
 * Schreibt einen Zeugen fort — und sagt, ob sich etwas geändert hat.
 *
 * Ein **leerer** Fund löscht den Eintrag nicht: Eine Gegenprobe, die anschlägt,
 * ohne dass eine Testdatei genannt wird, ist kein Grund, den letzten bekannten
 * Zeugen zu vergessen.
 */
export function mitZeuge(stand, id, dateien) {
  if (!dateien?.length) return { stand, geaendert: false };
  const alt = stand[id] ?? [];
  const gleich = alt.length === dateien.length && alt.every((d, i) => d === dateien[i]);
  if (gleich) return { stand, geaendert: false };
  return { stand: { ...stand, [id]: dateien }, geaendert: true };
}

/** Der Stand als Datei — nach Kennung sortiert, damit der Abdruck stabil ist. */
export function alsDatei(stand) {
  const sortiert = {};
  for (const id of Object.keys(stand).sort()) sortiert[id] = stand[id];
  return `${JSON.stringify(sortiert, null, 2)}\n`;
}
