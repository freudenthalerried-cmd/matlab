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

import { ARTEN } from './ablage.js';
import { EUR } from './format.js';

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
export function ortsbefund({
  gitignore = '', getrackt = [], journaldateien = [], belegdateien = [], auszuege = [],
}) {
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
    // Seit dem 11. September liegt neben dem Journal der Beleg selbst, und er
    // trägt dieselben Daten in Klartext: Name, Anschrift, Betrag. Die Sperre
    // kannte bis dahin nur die eine der beiden Dateiarten.
    if (istBuchhaltung(pfad)) {
      meldungen.push({
        regel: 'auszug-im-verzeichnis',
        text: `${pfad} ist getrackt — ein Buchhaltungsauszug trägt die Beträge und Betreffs `
          + 'einer ganzen Periode',
      });
    }
    if (istBeleg(pfad)) {
      meldungen.push({
        regel: 'beleg-im-verzeichnis',
        text: `${pfad} ist getrackt — eine Durchschrift trägt Name und Anschrift des Kunden im Klartext`,
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

  for (const pfad of auszuege) {
    if (!pfad.startsWith(`${ABLAGEORT}/`)) {
      meldungen.push({
        regel: 'auszug-am-falschen-ort',
        text: `${pfad} liegt außerhalb von ${ABLAGEORT}/ und ist von keiner Sperre gedeckt`,
      });
    }
  }

  for (const pfad of belegdateien) {
    if (!pfad.startsWith(`${ABLAGEORT}/`)) {
      meldungen.push({
        regel: 'beleg-am-falschen-ort',
        text: `${pfad} liegt außerhalb von ${ABLAGEORT}/ und ist von keiner Sperre gedeckt`,
      });
    }
  }

  return { geprueft: getrackt.length, meldungen, sauber: meldungen.length === 0 };
}

/**
 * ## Die Durchschrift — 11. September 2026
 *
 * Bis heute schrieb `npm run vorgang -- --ablegen` **eine Zeile** ins Journal
 * und druckte den Beleg auf den Bildschirm. Das Journal ist die Aufzeichnung;
 * der Beleg ist der Beleg. § 132 BAO verlangt beides sieben Jahre, und § 11
 * Abs 2 UStG verlangt vom Aussteller ausdrücklich eine **Durchschrift oder
 * Abschrift jeder Rechnung**.
 *
 * > **Die Runde vom Vortag hat den Belegtext aus dem Journal genommen — zu
 * > Recht, eine Journalzeile ist keine Urkunde. Nur ist er damit nirgendwo
 * > mehr gelandet.** Was der Kunde bekommt, existierte nach dem Schließen des
 * > Fensters nicht mehr.
 *
 * Seit heute liegt neben dem Journal je Geschäftsjahr ein Ordner
 * `belege-2026/`, und darin steht je abgelegtem Beleg **eine Datei mit genau
 * dem Text, der hinausgeht**. Drei Entscheidungen tragen ihn:
 *
 * **Der Name ist die Belegnummer.** Wer die Akte nach dem Papier durchsucht,
 * sucht nach der Nummer, die darauf steht. Für die Auftragsbestätigung, die
 * nach `ARTEN` bewusst keinen Nummernkreis führt, ist es die
 * **Vorgangsnummer** — dieselbe Rückführung, die das Verzeichnis dort schon
 * nennt (§ 131 Abs 1 Z 5 BAO).
 *
 * **Geschrieben wird nur, was noch nicht da ist.** Der Aufrufer legt mit
 * `flag: 'wx'` an; eine bestehende Datei bricht den Lauf ab, statt sie zu
 * überschreiben. Eine Durchschrift, die sich überschreiben lässt, ist keine.
 *
 * **Kein neues Journalfeld.** Der Pfad folgt aus Art, Nummer und Jahr und
 * steht damit nicht ein zweites Mal irgendwo; `FELDER_DER_ABLAGE` nennt jede
 * Feldaufnahme eine Migrationsfrage, und diese hier wäre eine ohne Not.
 */

/**
 * Der Ordner, in dem die Durchschriften eines Geschäftsjahres liegen —
 * **relativ zur Ablage**, nicht zur Verzeichniswurzel. `VORGANG_ABLAGE` lenkt
 * den Ort für Proben um; ein Ordnername, der die Wurzel schon eingebaut hat,
 * ließe sich nicht umlenken.
 */
export function belegordner(jahr) {
  if (!Number.isInteger(jahr)) throw new Error('Durchschriften gehören zu einem Geschäftsjahr');
  return `belege-${jahr}`;
}

/** Die Kürzel kommen aus `ARTEN` — eine zweite Liste wäre eine Abschrift. */
export const BELEGMUSTER = new RegExp(
  `^(?:${Object.values(ARTEN).map((a) => a.kuerzel).join('|')})-\\d{4}-\\d{4}(?:-\\d{2})?\\.txt$`,
);

/**
 * **Der Auszug für die Buchhaltung — 12. September 2026.**
 *
 * Er trägt Vorgangsnummern, Beträge und Betreffs einer ganzen Periode und
 * liegt neben dem Journal. Die Sperre kannte bis heute Journale und
 * Durchschriften; eine dritte Dateiart, die dieselben Daten trägt und von
 * keiner Regel erfasst ist, wäre genau der Fund vom 11. September noch einmal.
 */
export const BUCHHALTUNGSMUSTER = /^buchhaltung-\d{4}(?:-\d{2})?\.csv$/;

/** Ob ein Pfad ein Buchhaltungsauszug ist — gleich, wo er liegt. */
export function istBuchhaltung(pfad) {
  return BUCHHALTUNGSMUSTER.test(String(pfad).split('/').at(-1));
}

/** Ob ein Pfad eine Durchschrift ist — gleich, wo er liegt. */
export function istBeleg(pfad) {
  return BELEGMUSTER.test(String(pfad).split('/').at(-1));
}

/**
 * Der Dateiname der Durchschrift eines Belegs.
 *
 * Ohne Belegnummer greift die Vorgangsnummer. Sie ist keine Notlösung: Die
 * Auftragsbestätigung führt nach `ARTEN` absichtlich keinen Nummernkreis, und
 * rückführbar ist sie über den Vorgang. Zwei Bestätigungen zu einem Vorgang
 * tragen damit denselben Namen — und genau dann soll der Lauf anhalten und
 * fragen, statt die erste zu überschreiben.
 */
export function belegname({ art, nummer = null, vorgang = null }) {
  const beschreibung = ARTEN[art];
  if (!beschreibung) throw new Error(`Unbekannte Vorgangsart: ${art}`);
  /*
   * **Das Kürzel kommt dazu, wo die Nummer es nicht trägt — 12. September.**
   * Die Nummern der Nummernkreise nennen ihre Art bereits (`RE-2026-0001`).
   * Die Lieferantenbestellung bringt ihre Nummer mit, und die ist die
   * Vorgangsnummer plus Teillieferung (`2026-0110-01`) — ohne Kürzel stünde
   * sie im Belegordner als Datei, der niemand ansieht, was sie ist.
   */
  if (nummer && !beschreibung.nummernkreis) return `${beschreibung.kuerzel}-${nummer}.txt`;
  if (nummer) return `${nummer}.txt`;
  if (!vorgang) throw new Error(`${art} ohne Nummer braucht die Vorgangsnummer für die Durchschrift`);
  return `${beschreibung.kuerzel}-${vorgang}.txt`;
}

/** Der Pfad der Durchschrift, von der Verzeichniswurzel aus. */
export function belegpfad(jahr, eintrag) {
  return `${ABLAGEORT}/${belegordner(jahr)}/${belegname(eintrag)}`;
}

/**
 * Journaleinträge gegen Durchschriften — in **beide** Richtungen.
 *
 * Ein Eintrag ohne Durchschrift ist eine Aufzeichnung über ein Papier, das
 * niemand mehr hat. Eine Durchschrift ohne Eintrag ist ein Papier, das
 * hinausgegangen ist, ohne aufgezeichnet zu werden — die schwerere der
 * beiden, denn die Aufzeichnung ist die Pflicht, aus der sich der Rest ergibt.
 *
 * Eine leere Datei zählt als fehlend: Sie sieht in jeder Dateiliste aus wie
 * eine Durchschrift und ist keine.
 *
 * @param {object} lage
 * @param {Array} lage.eintraege  die Einträge des Journals eines Jahres
 * @param {Array} lage.dateien    `{ name, zeichen }` je Datei im Belegordner
 */
export function durchschriftenbefund({ eintraege = [], dateien = [] }) {
  const meldungen = [];
  const nachName = new Map(dateien.map((d) => [d.name, d]));
  const erwartet = new Set();

  for (const eintrag of eintraege) {
    /*
     * **Zwei der acht Arten haben kein Blatt — 12. September 2026.**
     *
     * Hier stand `belegname(eintrag)` für **jeden** Eintrag, und damit
     * verlangte diese Prüfung eine Durchschrift auch dort, wo keine
     * entstehen kann: `ARTEN` führt seit heute `beleg`, und `vermerk` und
     * `uidabfrage` tragen darin `false`. Sie **sind** die Aufzeichnung.
     *
     * > **Der erste abgelegte Vermerk hätte `npm run pruefe-ablage` rot
     * > gemacht** — mit `durchschrift-fehlt` für `VM-2026-0140.txt`, einer
     * > Datei, die kein Werkzeug dieses Hauses je schreibt. `--ablegen`
     * > legt Angebot, Bestätigung, Absage, Bestellung, Rechnung und
     * > Gutschrift ab; für die beiden anderen gibt es keinen Aufruf.
     *
     * Die Gegenrichtung bleibt bestehen und wird **schärfer**: Liegt neben
     * einem solchen Eintrag doch eine Datei, ist das kein fehlender Beleg,
     * sondern eine Abschrift von etwas, das nie ein Blatt war — und die
     * gehört nicht in den Belegordner, sondern in den Vermerk selbst.
     */
    const beschreibung = ARTEN[eintrag.art];
    if (beschreibung && !beschreibung.beleg) {
      // Ohne Nummer und ohne Vorgang lässt sich kein Name bilden — und für
      // eine Art ohne Beleg braucht es auch keinen. `belegname` würde hier
      // werfen, und ein Prüfer, der an einem Vermerk abbricht, prüft nichts.
      if (!eintrag.nummer && !eintrag.vorgang) continue;
      const gefunden = belegname(eintrag);
      if (nachName.has(gefunden)) {
        meldungen.push({
          regel: 'durchschrift-ohne-blatt',
          text: `${gefunden} liegt im Belegordner, ${eintrag.art} hat aber kein Blatt `
            + '— eine Abschrift von etwas, das nie eines war',
        });
        erwartet.add(gefunden);
      }
      continue;
    }

    const name = belegname(eintrag);
    erwartet.add(name);
    const datei = nachName.get(name);
    if (!datei) {
      meldungen.push({
        regel: 'durchschrift-fehlt',
        text: `lfd. ${eintrag.lfd ?? '—'} (${eintrag.art}) steht im Journal, ${name} fehlt `
          + '— § 132 BAO verlangt den Beleg, nicht nur die Zeile darüber',
      });
      continue;
    }
    if (!datei.zeichen) {
      meldungen.push({
        regel: 'durchschrift-leer',
        text: `${name} ist leer — eine Datei, die in jeder Liste wie eine Durchschrift aussieht und keine ist`,
      });
      continue;
    }

    /*
     * **Dieselbe Zahl steht zweimal — 12. September 2026.**
     *
     * Die Betriebskette sagt über die Aufbewahrung: *„§ 131 BAO — nur
     * ergänzen, nie ändern."* Die **Form** hielt das auch: Das Journal ist
     * eine Datei, an die nur angehängt wird, `lfd` deckt eine gelöschte oder
     * vertauschte Zeile auf, und `ausJournal` bricht dann ab.
     *
     * > **Eine geänderte Zeile deckte nichts auf.** Wer in einem Texteditor
     * > aus 911,06 die Zahl 91,06 macht, bekam ein Journal, das sauber
     * > zurückliest. Die Form wächst nur — der Inhalt war ungeschützt.
     *
     * Seit es die Durchschrift gibt, steht jede dieser Zahlen **zweimal**:
     * einmal in der Journalzeile, einmal auf dem Papier, das hinausging. Hier
     * werden sie gegeneinander gehalten. Das ist keine Fälschungssicherheit —
     * wer beide Dateien gleichlautend ändert, kommt durch; dagegen hülfe nur
     * ein Anker außerhalb dieses Rechners. Es ist die Sicherung gegen die
     * einseitige Änderung, und das ist der Fall, der vorkommt.
     *
     * Gemeldet wird **ohne den Inhalt**: Eine Prüfung, die den Betrag oder
     * den Namen in ihr Protokoll schreibt, verlegt Kundendaten an einen
     * dritten Ort.
     */
    const text = datei.text ?? null;
    if (text === null) continue;

    if (eintrag.nummer && !text.includes(eintrag.nummer)) {
      meldungen.push({
        regel: 'nummer-weicht-ab',
        text: `${name}: die Belegnummer der Journalzeile steht nicht auf dem Papier `
          + '— eine der beiden Angaben ist nachträglich geändert worden',
      });
    }
    if (eintrag.zeitpunkt && !text.includes(eintrag.zeitpunkt)) {
      meldungen.push({
        regel: 'zeitpunkt-weicht-ab',
        text: `${name}: der Zeitpunkt der Journalzeile steht nicht auf dem Papier `
          + '— § 131 Abs 1 Z 2 BAO verlangt die Zeitfolge, und sie steht hier zweimal verschieden',
      });
    }
    if (typeof eintrag.betragBrutto === 'number' && !text.includes(EUR(eintrag.betragBrutto))) {
      meldungen.push({
        regel: 'betrag-weicht-ab',
        text: `${name}: der Bruttobetrag der Journalzeile steht nicht auf dem Papier `
          + '— die Zahl, aus der die Umsatzsteuer folgt, sagt hier zweierlei',
      });
    }
  }

  for (const datei of dateien) {
    if (!erwartet.has(datei.name)) {
      meldungen.push({
        regel: 'durchschrift-ohne-eintrag',
        text: `${datei.name} liegt in der Ablage, das Journal kennt ihn nicht `
          + '— ein Papier, das hinausging, ohne aufgezeichnet zu werden',
      });
    }
  }

  return { geprueft: eintraege.length + dateien.length, meldungen, sauber: meldungen.length === 0 };
}

/** Die Periode, für die ein Auszug geschrieben ist — `2026-09` oder `2026`. */
export function auszugszeitraum(pfad) {
  const name = String(pfad).split('/').at(-1);
  const t = name.match(/^buchhaltung-(\d{4}(?:-\d{2})?)\.csv$/);
  return t ? t[1] : null;
}

/**
 * Der Auszug gegen das Journal — die dritte Dateiart bekommt ihren Abgleich.
 *
 * **Der Fund vom 12. September 2026, abends.** In der Ablage liegen drei
 * Dateiarten. Zwei werden seit dem 11. September gegeneinander gehalten,
 * Journal und Durchschrift, in beide Richtungen. Die dritte wurde nur auf
 * ihren **Ort** geprüft:
 *
 * > **Der Auszug ist die einzige Datei der Akte, die das Haus verlässt.** Er
 * > geht zum Steuerberater, und aus ihm entsteht die Umsatzsteuervoranmeldung
 * > (§ 21 Abs 1 UStG, fällig am 15. des zweitfolgenden Monats).
 *
 * Und er **altert lautlos**. Das Journal wächst nur (§ 131 BAO); jeder
 * Eintrag nach dem Schreiben des Auszugs fehlt darin. Gemessen an einem
 * Probejournal: Auszug mit zwei Zeilen geschrieben, dritte Rechnung
 * eingetragen — `npm run pruefe-ablage` blieb grün, und die Datei behauptete
 * weiter, sie sei der September.
 *
 * **Die Richtung des Fehlers ist die schlechtere von zwei:** Ein veralteter
 * Auszug meldet **zu wenig** Umsatz. Das ist keine Ungenauigkeit, sondern
 * eine zu niedrige Voranmeldung.
 *
 * Verglichen werden **laufende Nummern**, nichts sonst — keine Beträge, keine
 * Namen, keine Betreffs. Gemeldet werden Anzahlen und der Dateiname. Ein
 * Prüfer, der den Inhalt in sein Protokoll schreibt, verlegt Kundendaten an
 * einen dritten Ort; dieselbe Regel wie bei `durchschriftenbefund` und
 * `npm run akte`.
 *
 * @param {object} lage
 * @param {Array} lage.auszuege   `{ name, text }` je gefundener Auszug
 * @param {Array} lage.eintraege  alle Einträge der Journale, die dazugehören
 */
export function auszugsbefund({ auszuege = [], eintraege = [] }) {
  const meldungen = [];

  for (const auszug of auszuege) {
    const zeitraum = auszugszeitraum(auszug.name);
    if (!zeitraum) continue;

    const zeilen = String(auszug.text ?? '').split('\n').filter((z) => z.trim());
    if (!zeilen.length) {
      meldungen.push({
        regel: 'auszug-leer',
        text: `${auszug.name} ist leer — eine Datei, die in jeder Liste wie ein Auszug `
          + 'aussieht und keiner ist',
      });
      continue;
    }

    const [kopf, ...datenzeilen] = zeilen;
    /*
     * **Die Spalte `umsatz` ist die eine Angabe, die der Leser braucht.** Ohne
     * sie stehen der Umsatz der Rechnung und der Einkaufswert der
     * Lieferantenbestellung in derselben Spalte `netto` — wer sie
     * zusammenzählt, meldet zu viel. Ein Auszug ohne diese Spalte stammt von
     * vor dem 12. September und ist nicht sicher zu lesen.
     */
    if (!kopf.split(';').includes('umsatz')) {
      meldungen.push({
        regel: 'auszug-ohne-umsatzspalte',
        text: `${auszug.name} nennt keine Spalte \`umsatz\` — Umsatz und Einkaufswert stehen `
          + 'darin ununterscheidbar in derselben Spalte, und die Summe daraus ist zu hoch',
      });
    }

    const imAuszug = new Set(
      datenzeilen.map((z) => Number(z.split(';')[0])).filter(Number.isInteger),
    );
    const imJournal = new Set(
      eintraege
        .filter((e) => String(e.zeitpunkt ?? '').startsWith(`${zeitraum}-`))
        .map((e) => e.lfd)
        .filter(Number.isInteger),
    );

    const fehlen = [...imJournal].filter((lfd) => !imAuszug.has(lfd));
    if (fehlen.length) {
      meldungen.push({
        regel: 'auszug-veraltet',
        text: `${auszug.name} kennt ${imAuszug.size} Zeile(n), das Journal führt in `
          + `${zeitraum} ${imJournal.size} — ${fehlen.length} Eintrag/Einträge sind nach dem `
          + 'Auszug dazugekommen, und eine Voranmeldung daraus wäre zu niedrig '
          + '(§ 21 Abs 1 UStG)',
      });
    }

    const fremd = [...imAuszug].filter((lfd) => !imJournal.has(lfd));
    if (fremd.length) {
      meldungen.push({
        regel: 'auszug-kennt-fremde-zeile',
        text: `${auszug.name} nennt ${fremd.length} laufende Nummer(n), die das Journal in `
          + `${zeitraum} nicht führt — entweder ist der Auszug aus einer anderen Periode `
          + 'oder das Journal ist nachträglich geändert worden (§ 131 Abs 1 Z 6 BAO)',
      });
    }
  }

  return { geprueft: auszuege.length, meldungen, sauber: meldungen.length === 0 };
}
