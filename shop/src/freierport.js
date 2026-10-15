/**
 * Einen freien Port finden, statt einen zu raten.
 *
 * **Der Anlass, 4. September 2026, Abend.** Zwei Proben starten je einen
 * PHP-Server und wählten ihren Port mit `8100 + Zufall(800)` beziehungsweise
 * `8300 + Zufall(600)`. Im Gesamtlauf laufen sie dicht hintereinander, und der
 * Testlauf startet sieben davon.
 *
 * > **Ein geratener Port ist kein Port, sondern eine Wette.** Sie ging meist
 * > gut aus; die Läufe, in denen sie es nicht tat, sahen aus wie ein roter
 * > Bestand — dreimal an einem Abend, jedes Mal an einer anderen Stelle.
 *
 * Das Betriebssystem weiß, welcher Port frei ist. Diese Funktion fragt es:
 * Sie öffnet einen Horcher auf Port 0, liest die zugeteilte Nummer und gibt
 * sie sofort wieder her.
 *
 * **Die Lücke bleibt und ist klein:** Zwischen Freigeben und Binden durch PHP
 * liegt ein Augenblick, in dem jemand anders zugreifen könnte. Gegenüber einer
 * Wette auf 600 Zahlen ist das der bessere Handel — und der Aufrufer wartet
 * ohnehin, bis der Server antwortet.
 */

import { createServer } from 'node:net';

export function freierPort() {
  return new Promise((fertig, scheitern) => {
    const horcher = createServer();
    horcher.on('error', scheitern);
    horcher.listen(0, '127.0.0.1', () => {
      const { port } = horcher.address();
      horcher.close(() => fertig(port));
    });
  });
}
