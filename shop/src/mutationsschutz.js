/**
 * Ein Zettel an der Tür, solange eine Datei absichtlich falsch ist.
 *
 * **Der Anlass, 4. September 2026.** Am Ende eines Laufs meldete die
 * Abschlussprüfung „uncommitted changes": `src/betreiberform.js` trug die
 * ausgehängte UID-Prüfziffer, `src/ungerufen.js` kurz darauf etwas anderes.
 * Beides waren Mutationen aus `bin/gegenprobenlauf.mjs`, dem letzten Schritt
 * von `npm run alles` — der Lauf war noch nicht fertig, und ich hatte ihn für
 * fertig gehalten.
 *
 * Diesmal ging es gut aus. Es geht nicht immer gut aus:
 *
 * > **Der Gegenprobenläufer hält das Original im Arbeitsspeicher und schreibt
 * > es in einem `finally` zurück.** Ein `finally` läuft nicht bei `SIGKILL`,
 * > nicht bei einem Speicherabbruch und nicht, wenn jemand das Fenster
 * > schließt. Dann bleibt die mutierte Datei liegen — und das Original ist
 * > weg, weil es nirgends stand.
 *
 * `bin/gegenprobe.mjs` (die Einzelprobe) fängt wenigstens `SIGINT` und
 * `SIGTERM` ab und prüft danach nach, ob die Datei wirklich wieder dasteht.
 * Der **Läufer**, der 37 Proben hintereinander anwendet und in `npm run alles`
 * unbeaufsichtigt läuft, tat beides nicht.
 *
 * **Und es gibt seit dem 30. August ein Modul dafür.** `src/sicherung.js`
 * existiert, weil damals eine Gegenprobe die vertrauliche Preisdatei geleert
 * hat; sein Kopfkommentar sagt das selbst. Drei Werkzeuge benutzen es. Die
 * Gegenprobe — der Anlass — benutzt es nicht.
 *
 * > **Dieselbe Familie wie am Vormittag:** eine Regel, die es gibt und die an
 * > der Stelle nicht gilt, an der sie entstanden ist.
 *
 * ## Was dieses Modul anders macht als `sichere()`
 *
 * `sichere()` legt eine **datierte Kopie** an — zehn Stände je Datei, zum
 * Nachschlagen. Für eine Mutation braucht es das Gegenteil: **genau einen**
 * Stand, und die Antwort auf die Frage „liegt hier gerade etwas absichtlich
 * Falsches?". Eine datierte Kopie beantwortet sie nicht; ein Zettel, der
 * verschwindet, sobald zurückgeschrieben ist, beantwortet sie.
 *
 * Die Zettel liegen unter `.sicherung/` neben der Datei — dasselbe
 * Verzeichnis wie die datierten Kopien, aus demselben Grund gitignoriert und
 * bei `preise/` innerhalb des vertraulichen Bereichs. Eine Sicherung, die die
 * Geheimhaltung durchbricht, ist keine.
 */

import {
  existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';

/** Woran ein Zettel zu erkennen ist. */
export const MARKENENDUNG = '.mutation.json';

/** Verzeichnisse, in die keine Suche hineingeht. */
export const NICHT_HINEIN = Object.freeze(['node_modules', '.git', 'ausgabe']);

/** `<ordner>/.sicherung/<dateiname>.mutation.json` */
export function markenpfad(datei) {
  return join(dirname(datei), '.sicherung', `${basename(datei)}${MARKENENDUNG}`);
}

/**
 * Hängt den Zettel auf — **vor** dem Überschreiben, sonst nützt er nichts.
 *
 * @param {string} datei      die Datei, die gleich absichtlich falsch wird
 * @param {string} original   ihr jetziger Inhalt
 * @param {string} wer        wer sie ändert, für den Fall, dass sie liegen bleibt
 * @param {string} [warum]    was die Mutation zeigen soll
 * @returns {string} der Pfad des Zettels
 */
export function markiere(datei, original, wer, warum = '') {
  if (!wer) throw new Error('Ein Zettel ohne Absender sagt dem Finder nicht, wen er fragen soll.');
  const pfad = markenpfad(datei);
  mkdirSync(dirname(pfad), { recursive: true });
  writeFileSync(pfad, `${JSON.stringify({
    datei, wer, warum, seit: new Date().toISOString(), original,
  }, null, 2)}\n`, 'utf8');
  return pfad;
}

/**
 * Nimmt den Zettel ab. Wird nur aufgerufen, **nachdem** zurückgeschrieben ist.
 *
 * @returns {boolean} ob es einen abzunehmen gab
 */
export function nimmAb(datei) {
  const pfad = markenpfad(datei);
  if (!existsSync(pfad)) return false;
  unlinkSync(pfad);
  return true;
}

/**
 * Liest einen Zettel. Ein unlesbarer Zettel ist ein Fund, kein Absturz — er
 * sagt immerhin, dass hier etwas liegen geblieben ist.
 */
export function lies(pfad) {
  const roh = readFileSync(pfad, 'utf8');
  try {
    const m = JSON.parse(roh);
    if (!m.datei || typeof m.original !== 'string') {
      return { pfad, lesbar: false, grund: 'kein Original im Zettel' };
    }
    return { pfad, lesbar: true, ...m };
  } catch (e) {
    return { pfad, lesbar: false, grund: e.message };
  }
}

/**
 * Alle Zettel unter `wurzel`, aufsteigend nach Pfad.
 *
 * `angesehen` zählt die besuchten Einträge und ist der Grund, warum dieses
 * Modul überhaupt zählt: Der gesunde Zustand ist **null Zettel**, und
 * „nichts gefunden" sieht genauso aus wie „nicht hingesehen". Das ist die
 * Fehlerfamilie, gegen die `src/pruefregister.js` gebaut ist — der Prüfer
 * meldet deshalb die Zahl der angesehenen Einträge, nicht die der Funde.
 */
export function offeneMarken(wurzel) {
  const gefunden = [];
  let angesehen = 0;
  const gehe = (ordner) => {
    let eintraege;
    try {
      eintraege = readdirSync(ordner);
    } catch {
      return;
    }
    for (const name of eintraege) {
      if (NICHT_HINEIN.includes(name)) continue;
      const voll = join(ordner, name);
      let s;
      try {
        s = statSync(voll);
      } catch {
        continue;
      }
      angesehen += 1;
      if (s.isDirectory()) gehe(voll);
      else if (name.endsWith(MARKENENDUNG)) gefunden.push(lies(voll));
    }
  };
  gehe(wurzel);
  gefunden.sort((a, b) => a.pfad.localeCompare(b.pfad));
  gefunden.angesehen = angesehen;
  return gefunden;
}

/**
 * Schreibt das Original zurück und nimmt den Zettel ab.
 *
 * **Der eigentliche Zweck des Zettels.** Ein Lauf, den `SIGKILL` erwischt,
 * hinterlässt eine mutierte Datei; der nächste Lauf findet sie hier und kann
 * sie ohne `git checkout` zurückholen — der wäre bei einer Datei unter
 * `preise/` auch gar keine Hilfe.
 *
 * @returns {{datei: string, schonRichtig: boolean}}
 */
export function stelleZurueck(marke) {
  if (!marke.lesbar) throw new Error(`Unlesbarer Zettel: ${marke.pfad} (${marke.grund})`);
  const schonRichtig = existsSync(marke.datei) && readFileSync(marke.datei, 'utf8') === marke.original;
  if (!schonRichtig) writeFileSync(marke.datei, marke.original, 'utf8');
  unlinkSync(marke.pfad);
  return { datei: marke.datei, schonRichtig };
}

/**
 * Der Befund für den Prüfer: Liegt irgendwo eine absichtlich falsche Datei?
 *
 * `schonRichtig` trennt zwei Fälle, die gleich aussehen und es nicht sind:
 * Ein Zettel, unter dem die Datei bereits richtig dasteht, ist ein
 * abgebrochener Lauf **nach** dem Zurückschreiben — ärgerlich, aber harmlos.
 * Ein Zettel, unter dem etwas anderes steht, ist eine liegen gebliebene
 * Mutation im Bestand.
 */
export function mutationsbefund(wurzel) {
  const marken = offeneMarken(wurzel);
  const angesehen = marken.angesehen;
  const meldungen = [];
  for (const m of marken) {
    if (!m.lesbar) {
      meldungen.push({ regel: 'zettel-unlesbar', pfad: m.pfad, text: `Zettel nicht lesbar: ${m.grund}` });
      continue;
    }
    const jetzt = existsSync(m.datei) ? readFileSync(m.datei, 'utf8') : null;
    if (jetzt === m.original) {
      meldungen.push({
        regel: 'zettel-ohne-mutation',
        pfad: m.pfad,
        text: `${m.datei} steht richtig da, der Zettel von ${m.wer} hängt noch — abgebrochen nach dem Zurückschreiben`,
      });
    } else {
      meldungen.push({
        regel: 'mutation-liegen-geblieben',
        pfad: m.pfad,
        text: `${m.datei} ist noch absichtlich falsch (${m.wer}, seit ${m.seit})`,
      });
    }
  }
  return { marken, angesehen, meldungen, sauber: meldungen.length === 0 };
}
