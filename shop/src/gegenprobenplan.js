/**
 * In welcher Reihenfolge die Gegenproben laufen — und welcher Lauf entfällt.
 *
 * **Der Anlass, 7. September 2026.** Der Prüfstand misst 42 Schritte, 1851
 * Testfälle, 105 Gegenproben, 24 Zahlen der Inhaltsseiten, 28 Gates und 8
 * Weisungen. Was er nie gemessen hat, ist **sich selbst**: Kein Werkzeug sagt,
 * wie lange `npm run alles` dauert.
 *
 * Gemessen: **315 Prüferläufe** für 105 Gegenproben — je Probe drei (vorher
 * grün, mutiert rot, zurückgesetzt wieder grün). Dreißig davon hängen am
 * Prüfer `test`, und ein Testlauf kostet 23 Sekunden. Allein diese dreißig
 * Proben kosten damit **rund 35 Minuten**, und jede neue Probe an diesem
 * Prüfer legt 69 Sekunden drauf.
 *
 * > **Ein Prüfstand, der zu lange braucht, wird nicht langsamer — er wird
 * > übersprungen.**
 *
 * Der eine Lauf, der sich sparen lässt, ist der vierte: Wenn Probe A ihren
 * Prüfer **nach dem Zurücksetzen wieder grün** gesehen hat und Probe B
 * denselben Prüfer braucht, dann ist genau dieser Lauf der „vorher grün"-Lauf
 * von B. Dazwischen ist nichts passiert — der Läufer prüft nach jeder Probe
 * byteweise nach, dass die Datei wieder dasteht wie zuvor.
 *
 * Damit das oft zutrifft, laufen die Proben nach Prüfer gruppiert. Aus 3n
 * Läufen je Gruppe werden 2n+1: **315 → 251**, und die Ersparnis liegt fast
 * ganz bei den dreißig Testproben.
 *
 * **Was hier nicht passiert:** Die Proben laufen weiter nacheinander. Parallel
 * wäre schneller und wäre falsch — eine Mutation in `kampagne.mjs` färbt den
 * ganzen Testlauf rot, und eine zweite Probe, die zeitgleich ihren „vorher
 * grün"-Lauf macht, würde daraus schließen, ihr Prüfer sei kaputt.
 */

/**
 * Ordnet die Proben nach Prüfer, ohne die Reihenfolge innerhalb einer Gruppe
 * zu ändern.
 *
 * Stabil und ohne Sortierschlüssel: Die Gruppen erscheinen in der Reihenfolge,
 * in der ihr Prüfer zum ersten Mal vorkommt. Eine alphabetische Sortierung
 * würde die Berichte zwischen zwei Läufen durcheinanderwerfen, sobald ein
 * Prüfer umbenannt wird.
 */
export function nachPrueferGruppiert(proben) {
  const gruppen = new Map();
  for (const p of proben) {
    if (!gruppen.has(p.pruefer)) gruppen.set(p.pruefer, []);
    gruppen.get(p.pruefer).push(p);
  }
  return [...gruppen.values()].flat();
}

/**
 * Darf der „vorher grün"-Lauf entfallen?
 *
 * Nur wenn die vorige Probe **denselben Prüfer** hatte und mit `geschlagen`
 * endete. `geschlagen` heißt: mutiert rot, zurückgesetzt wieder grün, Datei
 * byteweise wie vorher. Jedes andere Urteil lässt offen, in welchem Zustand
 * der Bestand ist — dann wird gemessen statt geglaubt.
 *
 * @param {{pruefer: string, urteil: string}|null} vorige
 * @param {{pruefer: string}} jetzige
 */
export function vorlaufEntfaellt(vorige, jetzige) {
  if (!vorige) return false;
  /*
   * **Verglichen wird der Befehl, nicht der Prüfername — 12. September 2026.**
   *
   * Seit es Zeugen gibt, ruft nicht jede Gegenprobe mit dem Prüfer `test`
   * denselben Befehl: Die eine fährt `node --test test/ablage.test.js`, die
   * nächste eine andere Datei. Der gesparte Vorlauf verließ sich auf den
   * **Namen** des Prüfers und hätte den grünen Lauf der einen Datei als
   * „vorher grün" der anderen ausgegeben.
   *
   * > **Ein gesparter Lauf ist nur dann derselbe Lauf, wenn es derselbe
   * > Befehl ist.**
   *
   * Ohne `befehl` bleibt es beim Prüfernamen — dieselbe Aussage wie vorher.
   */
  if ((vorige.befehl ?? vorige.pruefer) !== (jetzige.befehl ?? jetzige.pruefer)) return false;
  return vorige.urteil === 'geschlagen';
}

/**
 * Wie viele Prüferläufe ein Plan kostet — gezählt, nicht geschätzt.
 *
 * Drei je Probe, minus jeder entfallende Vorlauf.
 */
export function laufzahl(proben) {
  let laeufe = 0;
  let vorige = null;
  for (const p of proben) {
    laeufe += vorlaufEntfaellt(vorige, p) ? 2 : 3;
    vorige = { pruefer: p.pruefer, urteil: 'geschlagen' };
  }
  return laeufe;
}
