/**
 * Auswertung der Suchvolumen-Messung — Prüfung B, Gate 15.
 *
 * Die Regeln stammen aus `entscheidungsmatrix.md` und stehen damit fest,
 * BEVOR gemessen wird (Gate 17): mindestens drei Themencluster mit je
 * ≥ 200 Suchen im Monat, kumuliert ≥ 2.000, bei niedriger bis mittlerer
 * Wettbewerbsdichte. Ergänzung nach Gate 15/16: Die Cluster der Gruppe C
 * (Feuchte- und Abdichtungsthemen) werden getrennt ausgewiesen — ein
 * Ergebnis, das NUR dort Volumen zeigt und bei den radonspezifischen
 * Begriffen nichts, ist kein Bestehen.
 *
 * Was die Matrix als Prosa lässt, legt dieses Modul vorab zahlenfest:
 *
 * 1. **Wettbewerb je Keyword** kommt als Difficulty-Wert (0–100) aus dem
 *    Werkzeug (`werkzeugwahl-suchvolumen.md`). Zuordnung: bis 29 niedrig,
 *    30–49 mittel, ab 50 hoch — die übliche Skalenteilung der Werkzeuge.
 * 2. **„Niedrig bis mittel" für einen Cluster** heißt: Höchstens ein
 *    Drittel des Clustervolumens liegt auf Keywords mit hoher Difficulty
 *    (volumengewichtet). Wer die Schwelle nur mit umkämpften Begriffen
 *    reißt, hat keine erreichbare Nachfrage gemessen.
 *
 * Reine Rechenfunktionen; das Werkzeug dazu ist `bin/suchvolumen.mjs`.
 */

export const CLUSTER_MINDESTVOLUMEN = 200;
export const KUMULIERT_MINDESTENS = 2000;
export const KD_NIEDRIG_BIS = 29;
export const KD_MITTEL_BIS = 49;
export const ANTEIL_HOCH_HOECHSTENS = 1 / 3;

/** Difficulty-Wert in die drei Stufen der Matrix übersetzen. */
export function wettbewerbsstufe(kd) {
  if (typeof kd !== 'number' || Number.isNaN(kd)) return null;
  if (kd <= KD_NIEDRIG_BIS) return 'niedrig';
  if (kd <= KD_MITTEL_BIS) return 'mittel';
  return 'hoch';
}

/**
 * Prüft eine Messliste auf Vollständigkeit — VOR der Wertung.
 *
 * Gemeldet wird, was fehlt, damit am Messtag gezielt nachgetragen werden
 * kann: Keywords ohne Volumen, Keywords ohne Difficulty, Cluster ohne
 * Gruppe. Ein fehlender Wert ist kein stiller Nuller.
 */
export function pruefeMessung(messung) {
  const fehlend = [];
  const cluster = messung?.cluster ?? [];
  if (cluster.length === 0) fehlend.push('keine Cluster in der Messliste');

  for (const c of cluster) {
    if (!['A', 'B', 'C'].includes(c.gruppe)) {
      fehlend.push(`Cluster „${c.name ?? c.id}": Gruppe fehlt oder unbekannt (A, B oder C)`);
    }
    const keywords = c.keywords ?? [];
    if (keywords.length === 0) fehlend.push(`Cluster „${c.name ?? c.id}": keine Keywords`);
    for (const k of keywords) {
      if (typeof k.volumen !== 'number' || Number.isNaN(k.volumen) || k.volumen < 0) {
        fehlend.push(`„${k.begriff}": Suchvolumen fehlt`);
      }
      if (wettbewerbsstufe(k.kd) === null) {
        fehlend.push(`„${k.begriff}": Difficulty (kd) fehlt`);
      }
    }
  }
  return { vollstaendig: fehlend.length === 0, fehlend };
}

/** Wertet einen einzelnen Cluster nach den vorab festgelegten Regeln. */
export function werteClusterAus(cluster) {
  const keywords = (cluster.keywords ?? []).filter(
    (k) => typeof k.volumen === 'number' && !Number.isNaN(k.volumen),
  );
  const summe = keywords.reduce((s, k) => s + k.volumen, 0);
  const volumenHoch = keywords
    .filter((k) => wettbewerbsstufe(k.kd) === 'hoch')
    .reduce((s, k) => s + k.volumen, 0);
  const anteilHoch = summe > 0 ? volumenHoch / summe : 0;

  const genugVolumen = summe >= CLUSTER_MINDESTVOLUMEN;
  const wettbewerbOk = anteilHoch <= ANTEIL_HOCH_HOECHSTENS + 1e-9;

  return {
    id: cluster.id,
    name: cluster.name,
    gruppe: cluster.gruppe,
    summe,
    anteilHoch,
    genugVolumen,
    wettbewerbOk,
    bestanden: genugVolumen && wettbewerbOk,
  };
}

/**
 * Wertet die gesamte Messung — die vier Bedingungen der Matrix.
 *
 * `radonseite` ist die Gruppe-C-Regel: Mindestens ein bestandener Cluster
 * muss außerhalb der Gruppe C liegen. Die Reichweitenthemen dürfen tragen,
 * aber nicht allein — sonst ist gemessen, dass ein anderer den Markt hat.
 */
export function werteSuchmessungAus(messung) {
  const cluster = (messung?.cluster ?? []).map(werteClusterAus);
  const bestandene = cluster.filter((c) => c.bestanden);
  const kumuliert = bestandene.reduce((s, c) => s + c.summe, 0);
  const radonseite = bestandene.some((c) => c.gruppe !== 'C');

  const bedingungen = [
    { id: 'cluster', text: `mindestens 3 Cluster mit je ≥ ${CLUSTER_MINDESTVOLUMEN} Suchen`, erfuellt: bestandene.length >= 3 },
    { id: 'kumuliert', text: `kumuliert ≥ ${KUMULIERT_MINDESTENS} Suchen über die bestandenen Cluster`, erfuellt: kumuliert >= KUMULIERT_MINDESTENS },
    { id: 'radonseite', text: 'mindestens ein bestandener Cluster außerhalb der Gruppe C', erfuellt: radonseite },
  ];

  return {
    cluster,
    bestandene: bestandene.length,
    kumuliert,
    radonseite,
    bedingungen,
    pruefungB: bedingungen.every((b) => b.erfuellt),
    fehlend: bedingungen.filter((b) => !b.erfuellt).map((b) => b.text),
  };
}
