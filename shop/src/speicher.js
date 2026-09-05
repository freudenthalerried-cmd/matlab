/**
 * Das Gedächtnis der Ablage.
 *
 * `ablage.js` führt Nummernkreis und Journal sauber — aber im Arbeitsspeicher.
 * Nach einem Neuladen beginnt die Rechnungsnummer wieder bei eins, und § 11
 * UStG verlangt Einmaligkeit. Diese Datei gibt der Ablage ihr Gedächtnis: ein
 * **Journal aus Zeilen, das nur wächst** — dieselbe Eigenschaft, die § 131 BAO
 * vom Inhalt verlangt, hier auf die Form übertragen. Eine Datei, an die nur
 * angehängt wird, kennt kein Ändern und kein Löschen; genau deshalb ist sie
 * der richtige Speicherort.
 *
 * Drei Entscheidungen tragen diese Datei:
 *
 * **Erstens: Jedes Ereignis wird eine Zeile, auch die Nummernvergabe.** Das
 * Journal der Einträge allein wäre kein Gedächtnis für den Zähler: Eine
 * gezogene, aber nie festgehaltene Nummer stünde in keinem Eintrag — nach dem
 * Neuladen würde derselbe Zähler dieselbe Nummer noch einmal vergeben, und
 * zwei Papiere trügen dieselbe Rechnungsnummer. Die Vergabezeile macht die
 * Lücke stattdessen dauerhaft sichtbar: `pruefeNummernkreis` meldet sie als
 * erklärungsbedürftig, so wie es sein soll.
 *
 * **Zweitens: Die Senke wird nicht hier gewählt.** `journalzeile` erzeugt die
 * Zeile, `ausJournal` liest sie zurück; ob die Zeilen in einer Datei, einem
 * Browser-Speicher oder einem Testfall landen, entscheidet der Aufrufer. Der
 * Betrieb hängt an eine Datei je Geschäftsjahr an (`journal-2026.jsonl`,
 * aufzubewahren nach § 132 BAO). Das Funktionsmuster speichert bewusst
 * **nicht**: Es baut bei jeder Eingabe den ganzen Ablauf neu, ein dauerhaftes
 * Journal würde dort bei jedem Tastendruck erfundene Geschäftsfälle sammeln.
 *
 * **Drittens: Beim Zurücklesen gilt das Felderverzeichnis.** Ein Journal, das
 * ein Feld trägt, das `FELDER_DER_ABLAGE` nicht kennt — oder eines vermissen
 * lässt —, wird nicht geladen, sondern abgewiesen: Ab dem ersten persistierten
 * Eintrag ist jede Feldänderung eine Migrationsfrage, und eine Migration
 * beginnt nicht damit, dass das Laden sie stillschweigend überspielt.
 */

import { ARTEN, FELDER_DER_ABLAGE, neueAblage } from './ablage.js';

/**
 * Serialisiert ein Ereignis der Ablage als eine Journalzeile.
 *
 * JSON hält den ursprünglichen Inhalt zeichengenau fest — ein Zeilenumbruch im
 * Betreff wird zu `\n` in der Zeile und beim Zurücklesen wieder zum Umbruch.
 * Das ist der Unterschied zur CSV an die Buchhaltung: Dort wird entschärft,
 * hier wird bewahrt (§ 131 BAO), ohne dass die Zeile je bricht.
 *
 * `U+2028` und seine Verwandten sind in JSON-Zeichenketten erlaubt und blieben
 * roh stehen — genug Anzeigeprogramme brechen an ihnen um. Sie werden deshalb
 * zusätzlich als `\uXXXX` maskiert; `JSON.parse` stellt sie originalgetreu
 * wieder her.
 */
export function journalzeile(ereignis) {
  if (ereignis?.typ !== 'nummernvergabe' && ereignis?.typ !== 'eintrag') {
    throw new Error(`Unbekannter Zeilentyp für das Journal: ${ereignis?.typ}`);
  }
  return JSON.stringify(ereignis).replace(/[\u007F\u0085\u2028\u2029]/g, (z) => {
    return '\\u' + z.charCodeAt(0).toString(16).padStart(4, '0');
  });
}

const kreis = (art, jahr) => `${art}:${jahr}`;

/** Hebt einen Zähler auf mindestens die laufende Nummer einer Belegnummer. */
function hebeZaehler(ablage, art, nummer, zeilennummer) {
  const teile = String(nummer).split('-');
  const laufend = Number(teile.at(-1));
  const jahr = Number(teile.at(-2));
  if (!Number.isInteger(laufend) || laufend < 1 || !Number.isInteger(jahr)) {
    throw new Error(`Journal, Zeile ${zeilennummer}: ${nummer} ist keine lesbare Belegnummer`);
  }
  const k = kreis(art, jahr);
  ablage.zaehler[k] = Math.max(ablage.zaehler[k] ?? 0, laufend);
}

/**
 * Baut die Ablage aus einem Journal wieder auf.
 *
 * Streng, nicht nachsichtig: Eine Zeile, die nicht lesbar ist, ein Feld ohne
 * Verzeichniseintrag, eine gerissene Zeitfolge — jedes davon bricht das Laden
 * mit einer Zeilennummer ab. Ein Journal, das nicht sauber zurückliest, darf
 * nicht stillschweigend zu einer arbeitenden Ablage werden; mit ihm arbeiten
 * hieße, auf einem Belegbestand zu buchen, dessen Zustand niemand kennt.
 *
 * `schreibe` gibt der wiederaufgebauten Ablage gleich wieder ein Gedächtnis —
 * typischerweise dieselbe Datei, an die weiter angehängt wird.
 */
export function ausJournal(journal, { schreibe = null } = {}) {
  const ablage = neueAblage({ schreibe });
  const bekannt = Object.keys(FELDER_DER_ABLAGE);

  const zeilen = String(journal ?? '').split('\n');
  for (let i = 0; i < zeilen.length; i++) {
    const roh = zeilen[i].trim();
    if (!roh) continue;
    const nr = i + 1;

    let ereignis;
    try {
      ereignis = JSON.parse(roh);
    } catch {
      throw new Error(`Journal, Zeile ${nr}: kein gültiges JSON`);
    }

    if (ereignis.typ === 'nummernvergabe') {
      if (!ARTEN[ereignis.art]) {
        throw new Error(`Journal, Zeile ${nr}: unbekannte Vorgangsart ${ereignis.art}`);
      }
      hebeZaehler(ablage, ereignis.art, ereignis.nummer, nr);
      continue;
    }

    if (ereignis.typ === 'eintrag') {
      const eintrag = ereignis.eintrag ?? {};
      const vorhanden = Object.keys(eintrag);
      for (const feld of vorhanden) {
        if (!bekannt.includes(feld)) {
          throw new Error(
            `Journal, Zeile ${nr}: Feld „${feld}" hat keinen Verzeichniseintrag — das Laden ist eine Migrationsfrage geworden`,
          );
        }
      }
      for (const feld of bekannt) {
        if (!vorhanden.includes(feld)) {
          throw new Error(
            `Journal, Zeile ${nr}: Verzeichnisfeld „${feld}" fehlt — das Laden ist eine Migrationsfrage geworden`,
          );
        }
      }
      if (!ARTEN[eintrag.art]) {
        throw new Error(`Journal, Zeile ${nr}: unbekannte Vorgangsart ${eintrag.art}`);
      }
      if (eintrag.lfd !== ablage.eintraege.length + 1) {
        throw new Error(
          `Journal, Zeile ${nr}: lfd ${eintrag.lfd} statt ${ablage.eintraege.length + 1} — die Zeitfolge ist gerissen`,
        );
      }

      ablage.eintraege.push(Object.freeze({ ...eintrag }));
      // Auch ohne Vergabezeile darf ein Journal keine Nummer doppelt vergeben —
      // der Zähler steigt zusätzlich mit jeder Nummer, die in einem Eintrag steht.
      if (eintrag.nummer) hebeZaehler(ablage, eintrag.art, eintrag.nummer, nr);
      continue;
    }

    throw new Error(`Journal, Zeile ${nr}: unbekannter Zeilentyp ${ereignis.typ}`);
  }

  return ablage;
}
