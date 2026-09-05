/**
 * Wo die Ablage liegen darf — und wo nie.
 *
 * **Der Anlass, 4. September 2026.** `src/ablage.js` führt den Nummernkreis
 * nach § 11 Abs 1 Z 5 UStG und die Aufbewahrung nach § 132 BAO, sieben Jahre.
 * `src/speicher.js` gibt ihr das Gedächtnis: ein Journal aus Zeilen, das nur
 * wächst, „eine Datei je Geschäftsjahr (`journal-2026.jsonl`)". Beide sind
 * gebaut, geprüft und vollständig.
 *
 * **Keine der beiden Dateien sagt, wo diese Datei liegt.** Sieben von ihren
 * dreizehn Ausfuhren ruft außerhalb der Tests niemand; `npm run vorgang`
 * druckt seinen Beleg auf den Bildschirm und legt nichts ab. Solange das so
 * ist, ist die Frage theoretisch.
 *
 * Sie ist es nur, bis sie es nicht mehr ist:
 *
 * > **Ein Journal trägt Namen, Anschriften und Beträge von Kunden — und das
 * > Verzeichnis dieses Vorhabens ist öffentlich.** Für Einkaufspreise gibt es
 * > seit dem 26. August `.gitignore` und `npm run pruefe-geheimnis`. Für
 * > Kundendaten gibt es nichts, weil es noch keine gibt.
 *
 * Das ist genau der Zeitpunkt, an dem die Regel hingehört: **bevor** der erste
 * Datensatz da ist. Danach hilft `.gitignore` nicht mehr — eine einmal
 * eingecheckte Zeile bleibt in der Geschichte stehen, und dieselbe Lehre steht
 * seit dem 30. August in `src/sicherung.js`: Was sich nicht neu erzeugen
 * lässt, darf nicht verloren gehen; was nicht hinein darf, darf nicht einmal
 * kurz hinein.
 *
 * ## Warum nicht unter `preise/`
 *
 * Der vertrauliche Bereich existiert und wäre der bequeme Ort. Er ist der
 * falsche: `preise/` trägt die **Konditionen des Lieferanten** und wird als
 * solcher behandelt — gesichert, nachgerechnet, in `npm run sicherung`
 * geführt. Kundendaten unterliegen anderen Fristen (sieben Jahre statt „bis
 * zur nächsten Liste"), einem anderen Löschanspruch (Art. 17 DSGVO, der nach
 * Abs. 3 lit. b an § 132 BAO endet) und einem anderen Personenkreis. Zwei
 * Sorten Geheimnis in einem Ordner heißt: Die schärfere Regel gilt für beide,
 * oder die mildere. Beides ist falsch.
 */

/** Der Ordner, in den die Ablage schreibt — vom Verzeichniswurzel aus. */
export const ABLAGEORT = 'ablage';

/** `journal-2026.jsonl` — eine Datei je Geschäftsjahr, wie `speicher.js` es vorsieht. */
export const JOURNALMUSTER = /^journal-(\d{4})\.jsonl$/;

/** Die Zeilen, die `.gitignore` tragen muss, damit der Ort gedeckt ist. */
export const NOETIGE_SPERREN = Object.freeze([`${ABLAGEORT}/`]);

/** Der Pfad, unter dem das Journal eines Jahres liegt. */
export function journalpfad(jahr) {
  if (!Number.isInteger(jahr)) throw new Error('Ein Journal gehört zu einem Geschäftsjahr');
  return `${ABLAGEORT}/journal-${jahr}.jsonl`;
}

/** Ob ein Pfad ein Journal ist — gleich, wo er liegt. */
export function istJournal(pfad) {
  return JOURNALMUSTER.test(String(pfad).split('/').at(-1));
}

/**
 * Der Befund über den Ablageort.
 *
 * Drei Regeln, und alle drei prüfen in die Richtung, in die es weh tut:
 *
 * - `ort-nicht-gesperrt` — `.gitignore` deckt den Ordner nicht. Dann liegt das
 *   erste Journal beim nächsten `git add -A` im öffentlichen Verzeichnis.
 * - `journal-im-verzeichnis` — eine Journaldatei ist **getrackt**. Das ist
 *   nicht mehr abzuwenden, sondern aufzuräumen, und der Befund muss es sagen.
 * - `journal-am-falschen-ort` — eine Journaldatei liegt außerhalb von
 *   `ablage/`. Sie ist dann von keiner Sperre gedeckt und wartet nur darauf,
 *   eingecheckt zu werden.
 *
 * @param {object} lage
 * @param {string} lage.gitignore        der Inhalt der `.gitignore`
 * @param {string[]} lage.getrackt       die Pfade, die git kennt
 * @param {string[]} lage.journaldateien alle gefundenen Journaldateien, relativ zur Wurzel
 */
export function ortsbefund({ gitignore = '', getrackt = [], journaldateien = [] }) {
  const zeilen = gitignore.split('\n').map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));
  const meldungen = [];

  for (const sperre of NOETIGE_SPERREN) {
    if (!zeilen.includes(sperre)) {
      meldungen.push({
        regel: 'ort-nicht-gesperrt',
        text: `\`.gitignore\` führt „${sperre}" nicht — das erste Journal landete im öffentlichen Verzeichnis`,
      });
      continue;
    }
    // **Und die Zeile, die sie wieder aufhebt — 5. September 2026, abends.**
    //
    // `npm run reichweite` fand, dass `shop/.gitignore` von keinem Prüfer
    // geöffnet wird. Beim Nachziehen fiel das Schwerere auf: Die Prüfung sucht
    // die **Zeile**, nicht ihre **Wirkung**. Ein `!ablage/` in irgendeiner
    // `.gitignore` hebt die Sperre auf — und `zeilen.includes('ablage/')`
    // bleibt wahr, weil die Zeile ja weiter dasteht.
    //
    // > **Eine Sperre, die an ihrem Wortlaut geprüft wird und nicht an ihrer
    // > Wirkung, ist so gut wie die Zeile, die sie aufhebt.**
    //
    // Hier steht bewusst keine Nachbildung der git-Semantik: Wer sie nachbaut,
    // hat zwei Fassungen derselben Regel. Gesucht wird die eine Form, die eine
    // Sperre sicher aushebelt.
    const aufhebung = zeilen.find((z) => z === `!${sperre}` || z === `!${sperre.replace(/\/$/, '')}`);
    if (aufhebung) {
      meldungen.push({
        regel: 'ort-nicht-gesperrt',
        text: `\`.gitignore\` führt „${sperre}" und hebt sie mit „${aufhebung}" wieder auf `
          + '— eine Sperre, die aufgehoben ist, ist keine',
      });
    }
  }

  for (const pfad of getrackt) {
    if (istJournal(pfad)) {
      meldungen.push({
        regel: 'journal-im-verzeichnis',
        text: `${pfad} ist getrackt — Kundendaten in einem öffentlichen Verzeichnis, und die Geschichte behält sie`,
      });
    }
  }

  for (const pfad of journaldateien) {
    if (!pfad.startsWith(`${ABLAGEORT}/`)) {
      meldungen.push({
        regel: 'journal-am-falschen-ort',
        text: `${pfad} liegt außerhalb von ${ABLAGEORT}/ und ist von keiner Sperre gedeckt`,
      });
    }
  }

  return { geprueft: getrackt.length, meldungen, sauber: meldungen.length === 0 };
}
