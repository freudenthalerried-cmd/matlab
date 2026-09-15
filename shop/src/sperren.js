/**
 * Die Sperren — und der Nachweis, dass sie auch wieder aufmachen.
 *
 * **Der Anlass, 4. September 2026, nach Mitternacht.** `darfBestaetigtWerden`
 * hat sechs Sperrgründe und hatte sechs Proben. Jede prüfte, dass **ihr**
 * Grund kommt:
 *
 * ```js
 * assert.ok(!f.gruende.some((g) => /Lieferzeit/.test(g)));
 * ```
 *
 * Eine solche Zeile hält fest, dass ein bestimmter Grund fehlt — und schweigt
 * über die fünf anderen. Sechs davon ergeben keine einzige Aussage darüber,
 * ob die Sperre je aufgeht.
 *
 * > **Eine Sperre, von der niemand gezeigt hat, dass sie aufmacht, könnte
 * > jeden Auftrag abweisen, ohne dass eine Probe es merkt.** Der Shop nähme
 * > Bestellungen entgegen und könnte keine einzige annehmen.
 *
 * Von Hand nachgesehen waren es an dem Abend zwei von sieben. Das ist genau
 * die Sorte Frage, die man nicht durch Lesen beantwortet.
 *
 * ## Woher die Liste kommt
 *
 * **Aus den Quelldateien, nicht aus einem Register.** Dieses Haus nennt jede
 * Sperre `darfXWerden`, und diese Benennung *ist* das Register: Wer eine neue
 * baut, trägt sie ein, indem er sie so nennt. Ein zweites Verzeichnis wäre
 * eine zweite Liste über dieselbe Sache — genau der Fehler, den dieser
 * Bestand ein halbes Dutzend Mal gemacht hat.
 *
 * Das **Urteilsfeld** kommt ebenfalls aus der Quelle: `darfVersendetWerden`
 * gibt `{ darf }` zurück, die übrigen `{ erlaubt }`. Ein Prüfer, der `erlaubt`
 * fest verdrahtet, hätte die eine Sperre stillschweigend übersprungen.
 *
 * ## Die Sichtweite
 *
 * Der grüne Fall gilt als nachgewiesen, wenn **im Umkreis von acht Zeilen**
 * um einen Aufruf der Sperre eine bejahende Zusicherung über ihr Urteilsfeld
 * steht. Acht Zeilen, weil ein Testfall in diesem Bestand selten länger ist
 * zwischen Aufruf und Zusicherung — und weil eine Zusicherung, die weiter weg
 * steht, meistens von etwas anderem handelt.
 *
 * Der Prüfer ist damit **grob**, wie `pruefe-tests`: Er meldet einen
 * **Verdacht**. Wer ihn begründet ablehnt, trägt die Sperre in
 * `OHNE_GRUENEN_FALL` ein — mit Grund, nicht mit Häkchen.
 */

/** Wie viele Zeilen nach dem Aufruf die Zusicherung noch zählt. */
export const SICHTWEITE = 8;

/**
 * Findet die Sperren einer Quelldatei samt ihrem Urteilsfeld.
 *
 * @param {string} datei   Dateiname, für die Meldung
 * @param {string} quelle  Inhalt
 */
export function sperrenDerDatei(datei, quelle) {
  const gefunden = [];
  const muster = /export function (darf[A-Za-z]*)\s*\(/g;
  for (const treffer of quelle.matchAll(muster)) {
    const name = treffer[1];
    // Das Urteilsfeld steht in der Rückgabe: `return { erlaubt: …, gruende }`.
    // Gesucht wird ab dem Fund, damit die Rückgabe einer anderen Funktion
    // nicht dazwischenkommt.
    const rest = quelle.slice(treffer.index);
    const rueckgabe = rest.match(/return \{ (\w+): gruende\.length === 0/);
    gefunden.push({
      name,
      datei,
      feld: rueckgabe ? rueckgabe[1] : null,
    });
  }
  return gefunden;
}

/**
 * Steht im Umkreis eines Aufrufs eine bejahende Zusicherung?
 *
 * Drei Schreibweisen gelten, alle drei kommen im Bestand vor:
 *
 *   `assert.equal(f.erlaubt, true)`   — auch mit Meldung dahinter
 *   `assert.ok(f.erlaubt)`
 *   `assert.deepEqual(f.gruende, [])` — die schärfere: **kein** Grund
 */
export function gruenerFall(zeilen, name, feld, sichtweite = SICHTWEITE) {
  if (!feld) return false;
  const bejaht = [
    new RegExp(`assert\\.equal\\([^;]*\\.${feld}\\s*,\\s*true\\s*[,)]`),
    new RegExp(`assert\\.ok\\([^;]*\\.${feld}\\s*[,)]`),
    /assert\.deepEqual\([^;]*\.gruende\s*,\s*\[\]\s*[,)]/,
  ];
  for (let i = 0; i < zeilen.length; i++) {
    if (!zeilen[i].includes(`${name}(`)) continue;
    const fenster = zeilen.slice(i, i + sichtweite + 1).join('\n');
    if (bejaht.some((m) => m.test(fenster))) return true;
  }
  return false;
}

/**
 * Sperren ohne grünen Fall — mit dem Grund, warum keiner da ist.
 *
 * Pflicht wie überall: Wer hier etwas einträgt, das sich leicht nachweisen
 * ließe, soll beim Schreiben des Grundes merken, dass er keinen hat.
 */
export const OHNE_GRUENEN_FALL = Object.freeze([]);

/**
 * Der Befund.
 *
 * @param {object[]} sperren  aus `sperrenDerDatei`
 * @param {string[]} zeilen   alle Zeilen aller Testdateien, hintereinander
 */
export function sperrenbefund(sperren, zeilen, ohne = OHNE_GRUENEN_FALL) {
  const meldungen = [];
  const begruendet = new Set(ohne.map((o) => o.sperre));
  const namen = new Set(sperren.map((s) => s.name));
  let nachgewiesen = 0;

  for (const s of sperren) {
    if (!s.feld) {
      meldungen.push({
        regel: 'kein-urteilsfeld',
        text: `${s.name} (${s.datei}): kein erkennbares Urteilsfeld — prüft sie überhaupt etwas?`,
      });
      continue;
    }
    // Aufgerufen zu werden ist die Vorbedingung. Eine Sperre, die keine Probe
    // je anfasst, hat weder einen grünen noch einen roten Fall.
    const angefasst = zeilen.some((z) => z.includes(`${s.name}(`));
    if (!angefasst) {
      meldungen.push({
        regel: 'nie-aufgerufen',
        text: `${s.name} (${s.datei}): keine einzige Probe ruft sie auf`,
      });
      continue;
    }
    if (gruenerFall(zeilen, s.name, s.feld)) {
      nachgewiesen += 1;
      if (begruendet.has(s.name)) {
        meldungen.push({
          regel: 'grund-ohne-fall',
          text: `${s.name}: steht unter „ohne grünen Fall" und hat einen`,
        });
      }
      continue;
    }
    if (begruendet.has(s.name)) continue;
    meldungen.push({
      regel: 'ohne-gruenen-fall',
      text: `${s.name} (${s.datei}): keine Probe zeigt, dass sie bei vollständiger Lage `
        + `aufmacht (${s.feld}: true)`,
    });
  }

  for (const o of ohne) {
    if (!namen.has(o.sperre)) {
      meldungen.push({
        regel: 'eintrag-ohne-sperre',
        text: `${o.sperre}: steht im Verzicht, aber es gibt keine solche Sperre`,
      });
    }
    if (!o.warumKeiner || o.warumKeiner.length < 80) {
      meldungen.push({
        regel: 'verzicht-ohne-grund',
        text: `${o.sperre}: Verzicht ohne tragfähigen Grund`,
      });
    }
  }

  return {
    sperren: sperren.length,
    nachgewiesen,
    begruendet: begruendet.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
