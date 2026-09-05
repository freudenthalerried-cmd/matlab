#!/usr/bin/env node
/**
 * Die PR-Beschreibung, fertig zum Veröffentlichen.
 *
 *   npm run --silent pr-text            > auf den Bildschirm
 *   npm run --silent pr-text > irgendwohin  > in eine Datei
 *
 * **Der Anlass, 5. September 2026.** Die Quelle sagte „25 Prüfer", die
 * veröffentlichte Fassung „24" — und `pruefe-schaufenster` misst die
 * **Quelle**, nicht die Seite. Die Abweichung ist beim Abschreiben von Hand
 * entstanden, zweimal hintereinander, und keine Prüfung konnte sie sehen.
 *
 * > **Ein Schaufenster, dessen Preisschilder im Lager stimmen, ist immer noch
 * > eines mit falschen Preisschildern.** Derselbe Satz stand schon am
 * > 4. September in `alle-zahlen-stimmten.md` — damals über den Inhalt, jetzt
 * > über den Weg dorthin.
 *
 * Dieses Werkzeug macht das Abschreiben überflüssig: Es gibt genau den Text
 * aus, der veröffentlicht gehört — Kopfkommentar und Überschrift entfernt,
 * Fußzeile angehängt. Wer etwas anderes veröffentlicht, tut es gegen ein
 * Werkzeug und nicht aus Versehen.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const quelle = join(hier, '..', '..', 'docs', 'baustoff-shop', 'pr-beschreibung.md');

/** Die Fußzeile gehört zur Veröffentlichung und nicht in die Quelle. */
const FUSS = '\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\n'
  + 'https://claude.ai/code/session_01NUkcuRkCJDZFDntY4wU3xy';

const roh = readFileSync(quelle, 'utf8');
const text = roh
  .replace(/^<!--[\s\S]*?-->\s*/, '')   // der Kopfkommentar erklärt die Datei, nicht das Vorhaben
  .replace(/^# .*\n+/, '')              // die Überschrift ist der PR-Titel und steht dort schon
  .trimEnd() + FUSS;

// **Nur auf die Ausgabe, nie in eine Datei.** Die erste Fassung schrieb nach
// `ausgabe/`, und `pruefe-erzeugnis` hat sie noch in derselben Minute gemeldet:
// Jedes Werkzeug, das `ausgabe/` anfasst, gehört ins Frischeregister. Es
// schreiben zu lassen wäre ein Eintrag mehr für nichts — die Umleitung der
// Ausgabe kann die Schale besser.
process.stdout.write(`${text}\n`);
