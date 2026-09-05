/**
 * Welche Dateien liest ein Werkzeug wirklich?
 *
 * **Der Anlass, 5. September 2026.** Neun Runden an einem Tag trugen denselben
 * Befund: Ein Prüfer, dessen Reichweite kleiner ist als die Reichweite der
 * Regel, die er prüft. Die Runde davor hat die Frage gestellt und
 * aufgeschrieben, dass die Antwort eine **Messung** sein müsste und kein
 * handgeführtes Register — mit dem Zusatz: „wie, weiß ich noch nicht."
 *
 * So. Node lädt dieses Modul über `--require` vor jedem Prüfer, es umhüllt die
 * Lesefunktionen von `fs` und schreibt jeden geöffneten Pfad in eine Datei.
 * Was danach dasteht, ist keine Behauptung über den Quelltext, sondern die
 * Liste der Dateien, die der Prozess tatsächlich angefasst hat.
 *
 * > **Eine Reichweite, die man aufschreibt, ist eine Absicht. Eine, die man
 * > misst, ist ein Befund.**
 *
 * Es verändert nichts am Verhalten: Die Hüllen reichen Argumente und Ergebnis
 * unverändert durch und fangen keine Fehler ab. Fällt das Protokollieren aus,
 * fällt es still aus — ein Messwerkzeug, das den Lauf abbricht, den es messen
 * soll, wäre der teurere Fehler.
 */

'use strict';

const fs = require('node:fs');
const { appendFileSync } = fs;
const { resolve } = require('node:path');

const ZIEL = process.env.SPUR_DATEI;
if (ZIEL) {
  const gesehen = new Set();
  const merke = (p) => {
    try {
      if (typeof p !== 'string' && !Buffer.isBuffer(p)) return;
      const voll = resolve(String(p));
      if (gesehen.has(voll)) return;
      gesehen.add(voll);
      appendFileSync(ZIEL, `${voll}\n`);
    } catch {
      // Still: Ein Messwerkzeug, das den Lauf abbricht, den es messen soll,
      // ist der teurere Fehler.
    }
  };

  for (const name of ['readFileSync', 'openSync', 'createReadStream']) {
    const echt = fs[name];
    if (typeof echt !== 'function') continue;
    fs[name] = function (...args) {
      merke(args[0]);
      return echt.apply(this, args);
    };
  }
  const echtRead = fs.readFile;
  if (typeof echtRead === 'function') {
    fs.readFile = function (...args) {
      merke(args[0]);
      return echtRead.apply(this, args);
    };
  }

  /*
   * **Und die Kindprozesse — nachgetragen beim ersten Lauf.**
   *
   * Der erste Durchgang meldete acht ungelesene Dateien, darunter
   * `shop/bestellung.php`. Das sah nach dem Befund der Runde aus: Das
   * Empfangsskript, das als einziges von außen erreichbar ist, von keinem
   * Prüfer angesehen.
   *
   * Es stimmte nicht. `pruefe-lesbar` **liest** die Datei nicht — es reicht
   * sie als Argument an `php -l` weiter, und der Kindprozess öffnet sie.
   * Diese Hülle sah nur `fs` im eigenen Prozess.
   *
   * > **Ein Messwerkzeug, dessen Reichweite kleiner ist als die Reichweite
   * > dessen, was es misst.** Genau der Befund, den zu finden es gebaut
   * > wurde — im ersten Lauf, an sich selbst.
   *
   * Gezählt wird deshalb auch, was einem Kindprozess als Argument mitgegeben
   * wird, sofern es auf eine vorhandene Datei zeigt. Das ist grob: Ein
   * Argument ist kein Beweis, dass gelesen wurde. Für die Richtung, in der
   * die Aussage trägt — *ungelesen heißt sicher ungeprüft* —, ist es die
   * vorsichtige Seite.
   */
  const cp = require('node:child_process');
  for (const name of ['spawnSync', 'execFileSync', 'spawn', 'execFile']) {
    const echt = cp[name];
    if (typeof echt !== 'function') continue;
    cp[name] = function (befehl, argumente, ...rest) {
      if (Array.isArray(argumente)) {
        for (const a of argumente) {
          if (typeof a !== 'string' || a.startsWith('-')) continue;
          try { if (fs.existsSync(a) && fs.statSync(a).isFile()) merke(a); } catch { /* still */ }
        }
      }
      return echt.call(this, befehl, argumente, ...rest);
    };
  }
}
