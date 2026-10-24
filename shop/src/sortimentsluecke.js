/**
 * Welche Teile nennt die eigene Anleitung, die der Shop nicht liefert?
 *
 * **Der Anlass, 8. September 2026.** Von den acht Weisungen des Auftraggebers
 * ist genau eine offen: *„Sortiment auf mindestens 100 Artikel"* — geführt als
 * offener Punkt, weil die Artikelliste beim Lieferanten liegt. Der Brief an
 * ihn bittet um diese Liste. Er nennt nicht, **was konkret fehlt**, obwohl der
 * Bestand es weiß.
 *
 * Vier Systemlisten beschreiben, was für ein fertiges Gewerk gebraucht wird —
 * Kaminzug, Kanal DN 100, Kellerwand mit Perimeterdämmung, Fassade auf 100 m².
 * Sieben ihrer fünfunddreißig Positionen tragen die Marke
 * *(nicht im Sortiment)*. Zwei davon sind **eigenes Gewerk** und sollen es
 * bleiben; die anderen fünf Nennungen sind **vier Teile**, und eines steht in
 * zwei von vier Systemen.
 *
 * ## Der Fund, der darüber hinausgeht
 *
 * Diese Tabellen haben eine vierte Spalte: *„wird oft vergessen"*. Sie ist ihr
 * eigentlicher Zweck — sie warnt den Bauherrn vor den Teilen, an die beim
 * Bestellen niemand denkt. **Drei der vier Lücken stehen dort auf „ja".**
 *
 * > **Die Liste warnt vor genau den Teilen, die wir nicht liefern.** Sie sagt
 * > dem Kunden, was er vergessen wird, und schickt ihn damit zu einem anderen.
 *
 * Das ist keine Unehrlichkeit — die Marke steht offen dabei, und das war eine
 * bewusste Entscheidung. Es ist eine **Verkaufsangabe**: Wer eine Bestellung
 * bei uns aufgibt, braucht für dasselbe Gewerk noch einen zweiten Lieferanten,
 * und beim Kanal betrifft das drei von acht Positionen.
 *
 * ## Was dieses Modul tut
 *
 * Es zieht die Lücken aus den Listen — gemessen, nicht getippt — und macht
 * daraus den Satz, den der Brief an den Lieferanten mitführt. Fragen werden
 * dadurch nicht mehr: Der Satz hängt an der Frage nach der Artikelliste, die
 * ohnehin gestellt wird. Jede zusätzliche Frage senkt die Wahrscheinlichkeit
 * einer vollständigen Antwort; diese vier Namen sind der Unterschied zwischen
 * „schicken Sie uns Ihr Sortiment" und „führen Sie diese vier Teile?".
 */

import { zahlwort } from './format.js';

/** Die Marke, mit der eine Position als eigenes Gewerk gilt. */
export const GEWERKMARKE = /eigenes Gewerk/i;

/**
 * Positionen, die wir **nicht** aufnehmen wollen — mit dem Grund.
 *
 * Ohne dieses Register wären beide Richtungen offen: Eine Lücke könnte
 * stillschweigend zum „eigenen Gewerk" erklärt werden, und ein Eintrag könnte
 * stehen bleiben, nachdem seine Position aus der Liste verschwunden ist.
 */
export const EIGENES_GEWERK = Object.freeze([
  Object.freeze({
    position: 'Abdichtung',
    warum: 'Die Bauwerksabdichtung nach ÖNORM B 3692 ist ein eigenes Gewerk mit eigener '
      + 'Gewährleistung; wer sie liefert, haftet für die Ausführung mit. Der Shop ist ein '
      + 'Streckenhandel ohne Baustellenkontakt und kann diese Haftung nicht tragen. Die '
      + 'Systemliste nennt sie trotzdem, weil eine Perimeterdämmung ohne Abdichtung darunter '
      + 'ein Fehler wäre — das ist der Zweck der Liste.',
  }),
  Object.freeze({
    position: 'Verfüllmaterial',
    warum: 'Rollierung und Verfüllmaterial für den Arbeitsraum kommen aus dem Kieswerk und '
      + 'werden nach Kubatur mit dem Kipper geliefert, nicht palettiert über einen '
      + 'Baustoffhändler. Der Frachtweg dieses Shops (Palette, Kranentladung, '
      + 'Mindestbestellwert 250 €) passt darauf nicht, und der Preisvorteil läge beim '
      + 'nächstgelegenen Kieswerk.',
  }),
]);

/**
 * Zieht die Lücken aus den gelesenen Systemlisten.
 *
 * `titel` ist der Name, den der Lieferant lesen soll — „Grundleitung DN 100"
 * und nicht „kanal-dn100". Der Dateiname bleibt für die Meldungen, weil der
 * Leser der Meldungen die Datei sucht.
 *
 * @param {{name: string, titel?: string, gelesen: {zeilen: object[]}}[]} listen
 * @param {(position: string) => boolean} [imKatalog]  prüft gegen den Katalog
 */
export function sortimentsluecken(listen, imKatalog = () => false) {
  const meldungen = [];
  const nachName = new Map();
  const gewerke = new Set();
  const registriert = new Map(EIGENES_GEWERK.map((e) => [e.position, e]));

  for (const l of listen) {
    for (const z of l.gelesen.zeilen) {
      if (z.gefuehrt) continue;
      const name = z.position.replace(/\s*\*\(nicht im Sortiment\)\*\s*/, '').trim();
      if (GEWERKMARKE.test(z.hinweis)) {
        gewerke.add(name);
        if (!registriert.has(name)) {
          meldungen.push({
            regel: 'gewerk-ohne-eintrag',
            text: `${l.name}: „${name}" gilt als eigenes Gewerk und steht in keinem Eintrag `
              + 'von EIGENES_GEWERK — wer eine Lücke zum Gewerk erklärt, schreibt den Grund dazu',
          });
        }
        continue;
      }
      if (imKatalog(name)) {
        meldungen.push({
          regel: 'luecke-die-keine-ist',
          text: `${l.name}: „${name}" steht als nicht im Sortiment, der Katalog führt es aber`,
        });
        continue;
      }
      const eintrag = nachName.get(name) ?? { position: name, listen: [], oftVergessen: false };
      eintrag.listen.push(l.titel ?? l.name);
      if (/\bja\b/i.test(z.hinweis)) eintrag.oftVergessen = true;
      nachName.set(name, eintrag);
    }
  }

  for (const e of EIGENES_GEWERK) {
    if (gewerke.has(e.position)) continue;
    meldungen.push({
      regel: 'eintrag-ohne-position',
      text: `„${e.position}" steht als eigenes Gewerk im Register, aber in keiner Systemliste mehr`,
    });
  }

  const luecken = [...nachName.values()]
    .sort((a, b) => b.listen.length - a.listen.length || a.position.localeCompare(b.position));
  return {
    luecken,
    gewerke: [...gewerke].sort(),
    oftVergessen: luecken.filter((l) => l.oftVergessen).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Der Satz für den Brief an den Lieferanten.
 *
 * Er nennt die Teile und **wozu** sie gebraucht werden — ein Lieferant, der
 * „Übergangsstücke" liest, weiß nicht, ob DN 100 Steinzeug auf Kunststoff
 * gemeint ist. Die Systemliste weiß es, also steht sie dabei.
 */
export function lueckensatz(luecken) {
  if (luecken.length === 0) return '';
  const teile = luecken.map((l) => `**${l.position}** (${l.listen.join(', ')})`);
  return 'Und eine Frage, die aus derselben Liste fällt: Wir stellen unsere Systemlisten so '
    + 'zusammen, dass ein Gewerk vollständig bestellbar ist. '
    // Ausgeschrieben wie „sechs Auskünfte" im selben Brief — eine Ziffer
    // mitten in einem Text, der Zahlen ausschreibt, liest sich wie ein
    // Textbaustein.
    + `${luecken.length === 1 ? 'Eine Position bekommen' : `${zahlwort(luecken.length)} Positionen bekommen`} `
    + 'wir dabei nicht aus Ihrem Sortiment zusammen: '
    + `${teile.join(', ')}. Führen Sie diese Positionen — und wenn ja, unter welcher `
    + 'Artikelnummer? Es sind Kleinteile, die zu einer ohnehin gelieferten Bestellung passen.';
}
