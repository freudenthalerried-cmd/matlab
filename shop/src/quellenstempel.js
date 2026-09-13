/**
 * Die Quellenangaben, die der Bau selbst auf die Seiten stempelt.
 *
 * **Der Anlass, 10. September 2026.** Auf jeder der 46 Artikelseiten steht
 * dieser Satz:
 *
 * > *„Verbindlich wird der Preis nicht hier, sondern mit dem Angebot: Das
 * > bindet 14 Tage ab Angebotsdatum (**Quelle: eigene Belegvorlage nach § 862
 * > ABGB, Stand: 2026-05-26**)."*
 *
 * Belegt werden soll damit die **Bindefrist** — eine Zahl aus `src/beleg.js`,
 * beschlossen am 6. September. Das Datum daneben war der **Preisstand des
 * Artikels**, also der Tag, an dem der Lieferant zuletzt seine Liste für
 * *diese eine Ware* geschrieben hat.
 *
 * Gemessen an den 146 Quellenstempeln des gebauten Auftritts:
 *
 * | Stempel | Vorkommen | verschiedene Stände |
 * |---|---|---|
 * | Lieferung und Fracht | 71 | 1 |
 * | **eigene Belegvorlage nach § 862 ABGB** | **46** | **8** |
 * | eigene Entscheidung (Mindestbestellwert) | 20 | 1 |
 * | die übrigen fünf | 9 | je 1 |
 *
 * > **Sieben von acht Stempeln nennen im ganzen Auftritt genau einen Stand.
 * > Der achte nennt acht — und er ist der einzige, dessen Tatsache eine Regel
 * > unseres eigenen Papiers ist.**
 *
 * Eine Regel hat ein Beschlussdatum, keins je Ware. Wer auf der ältesten Seite
 * nachsieht, liest die Bindefrist als 141 Tage alt; auf der jüngsten als 24
 * Tage alt. Beides über dieselbe Zahl, beides falsch, und keine der beiden
 * Angaben lässt sich nachschlagen — der Preisstand steht in der Preisliste des
 * Lieferanten, die Bindefrist in unserer Belegvorlage.
 *
 * **Warum das keiner der 48 Prüfer gefunden hat.** `pruefe-quellen` liest
 * `inhalte/quellen.json`, also die Fundstellen der *handgeschriebenen*
 * Inhaltsseiten. `pruefe-zahlen` hält 30 Zahlen der Inhaltsseiten gegen ihre
 * Fundstelle. Beide sehen nur, was in `inhalte/` steht. Diese 146 Stempel
 * entstehen erst beim Bauen — sie stehen in keinem Quelltext, den ein Redakteur
 * ansieht, sondern in Vorlagen des Seitenbauwerkzeugs.
 *
 * > **Ein Beleg, den erst der Bau anhängt, wird von keinem Redaktionsprüfer
 * > gelesen.**
 *
 * ## Was dieses Register hält
 *
 * Für jeden Stempel steht hier, **welche Tatsache** er belegt und **woher der
 * Stand kommt**. Aus dem zweiten Feld folgt die Prüfung:
 *
 * - `einer` — die Tatsache ist eine Setzung oder ein Bestand, sie hat genau
 *   ein Datum. Findet der Prüfer zwei, meldet er beide.
 * - `viele` — der Stand hängt an der einzelnen Ware oder Seite und darf
 *   abweichen. Diese Form verlangt einen **Grund**; ohne ihn wäre sie die
 *   bequeme Antwort auf jeden Befund.
 * - `ohne` — der Stempel nennt kein Datum, weil die Fundstelle keins hat
 *   (ein Lieferschein trägt sein Datum selbst).
 *
 * Und die Gegenrichtung, die den Fund gemacht hätte: **ein Stempel auf einer
 * Seite, den dieses Register nicht führt.** Wer eine neue Quellenangabe in
 * eine Vorlage schreibt, trägt sie hier ein oder wird gemeldet.
 */

import { nurText } from './format.js';

/**
 * Ein Quellenstempel besteht aus dem Wort „Quelle" und allem bis zur
 * schließenden Klammer. Klammern innerhalb kommen nicht vor — geprüft wird
 * das in der Gegenrichtung: Ein Stempel, der hier zerschnitten würde, passt
 * auf keinen Registereintrag und meldet sich.
 */
const STEMPELMUSTER = /\(Quelle:[^)]{0,400}\)/g;

/**
 * Sichtbarer Text einer gebauten Seite.
 *
 * Zwei Dinge kommen zu `nurText` aus `format.js` hinzu, und beide haben einen
 * Anlass:
 *
 * 1. **Skript und Stil heraus.** Jede Artikelseite trägt das Bündel der
 *    Oberfläche eingebettet, und darin steht der Katalog. Ohne diese Zeile
 *    läse der Prüfer Daten und nicht Text.
 * 2. **Kein Leerraum vor Satzzeichen.** Aus `<a>Lieferung und Fracht</a>,
 *    Stand` wird beim Entfernen der Marken „Lieferung und Fracht , Stand".
 *    Ohne den Ausgleich müsste jedes Muster unten dieses Leerzeichen
 *    mitschreiben — das Register beschriebe dann eine Eigenart des Prüfers
 *    und nicht die Seite.
 */
export function sichtbarerText(html) {
  const ohneSkript = String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  return nurText(ohneSkript).replace(/\s+([,.;:])/g, '$1');
}

/** Alle Datumsangaben eines Stempels, in der Form JJJJ-MM-TT. */
export function staendeIn(stempel) {
  return String(stempel).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
}

/** Die Stempel, die der Bau auf die Seiten setzt. */
export const QUELLENSTEMPEL = Object.freeze([
  Object.freeze({
    id: 'fracht',
    muster: /^\(Quelle: Lieferung und Fracht, Stand: /,
    tatsache: 'die Frachtsätze des Lieferanten',
    standform: 'einer',
    woher: 'der Zeitraum der eigenen Lieferantenrechnungen, aus denen die Sätze stammen',
  }),
  Object.freeze({
    id: 'bindefrist',
    muster: /^\(Quelle: eigene Belegvorlage nach § 862 ABGB, Stand: /,
    tatsache: 'die Bindefrist des Angebots — 14 Tage, eine Zahl aus src/beleg.js',
    standform: 'einer',
    woher: 'BINDEFRIST.stand — der Tag, an dem diese Zahl gesetzt wurde',
  }),
  Object.freeze({
    id: 'mindestbestellwert',
    muster: /^\(Quelle: eigene Entscheidung, Stand: /,
    tatsache: 'der Mindestbestellwert je Lieferung',
    standform: 'einer',
    woher: 'das Beschlussdatum aus dem Hinweistext in data/betreiber.json',
  }),
  Object.freeze({
    id: 'positionsgewicht',
    muster: /^\(Quelle: Positionsgewicht auf dem Lieferschein\)$/,
    tatsache: 'das Gewicht einer Position',
    standform: 'ohne',
    woher: 'der Lieferschein trägt sein Datum selbst; die Seite nennt daneben den Preisstand',
  }),
  Object.freeze({
    id: 'lieferantenrechnungen',
    muster: /^\(Quelle: eigene Lieferantenrechnungen, Stand: /,
    tatsache: 'die Einkaufslage, aus der die Preise gerechnet sind',
    standform: 'einer',
    woher: 'der Stand der Preisdatei',
  }),
  Object.freeze({
    id: 'liefergebiet',
    muster: /^\(Quelle: eigene Entscheidung vom \d{2}\.\d{2}\.\d{4}, Stand: /,
    tatsache: 'der Zuschnitt des Liefergebiets',
    standform: 'einer',
    woher: 'das Beschlussdatum, das im Stempel selbst noch einmal ausgeschrieben steht',
  }),
  Object.freeze({
    id: 'nebenkosten',
    muster: /^\(Quelle: eigene Lieferantenrechnungen und die daraus gerechneten Nebenkosten/,
    tatsache: 'die Nebenkosten je Lieferung',
    standform: 'einer',
    woher: 'der Stand der Preisdatei',
  }),
  Object.freeze({
    id: 'gebindegroesse',
    muster: /^\(Quelle: unser Katalog, Stand \d{4}-\d{2}-\d{2}; die Paketgröße/,
    tatsache: 'die Menge, auf die die Kasse aufrechnet',
    standform: 'einer',
    woher: 'das Änderungsdatum der Katalogdatei',
  }),
]);

/**
 * Die Stempel des gebauten Auftritts gegen das Register — in beide Richtungen.
 *
 * @param {{name: string, html: string}[]} seiten  gebaute Seiten
 * @param {number} mindestens  wie viele Stempel mindestens zu finden sein
 *   müssen. Ein Prüfer, der über null Fundstellen sauber meldet, sagt nichts.
 */
export function stempelbefund(seiten = [], mindestens = 100) {
  const meldungen = [];
  const melde = (regel, wo, text) => meldungen.push({ regel, wo, text });
  /** id → Map(Stand → Beispielseite) */
  const staende = new Map(QUELLENSTEMPEL.map((s) => [s.id, new Map()]));
  const zahl = new Map(QUELLENSTEMPEL.map((s) => [s.id, 0]));
  let gesamt = 0;

  for (const { name, html } of seiten) {
    for (const stempel of sichtbarerText(html).match(STEMPELMUSTER) ?? []) {
      gesamt += 1;
      const eintrag = QUELLENSTEMPEL.find((s) => s.muster.test(stempel));
      if (!eintrag) {
        melde('stempel-nicht-gefuehrt', name,
          `${name} trägt eine Quellenangabe, die das Register nicht führt: ${stempel.slice(0, 120)}`);
        continue;
      }
      zahl.set(eintrag.id, zahl.get(eintrag.id) + 1);
      const gefunden = staendeIn(stempel);
      if (eintrag.standform === 'ohne') {
        if (gefunden.length) {
          melde('stand-wo-keiner-erwartet', `${name} · ${eintrag.id}`,
            `${eintrag.id} ist als „ohne Stand" geführt, trägt auf ${name} aber `
            + `${gefunden.join(', ')} — dann gehört der Eintrag geändert, nicht die Meldung`);
        }
        continue;
      }
      if (!gefunden.length) {
        melde('stand-fehlt', `${name} · ${eintrag.id}`,
          `${eintrag.id} belegt ${eintrag.tatsache} und nennt auf ${name} keinen Stand — `
          + 'eine Fundstelle ohne Datum lässt sich nicht nachschlagen');
        continue;
      }
      const schluessel = gefunden.join(' bis ');
      if (!staende.get(eintrag.id).has(schluessel)) staende.get(eintrag.id).set(schluessel, name);
    }
  }

  for (const eintrag of QUELLENSTEMPEL) {
    const gesehen = staende.get(eintrag.id);
    if (!zahl.get(eintrag.id)) {
      melde('eintrag-ohne-stempel', eintrag.id,
        `${eintrag.id} steht im Register und auf keiner gebauten Seite — entweder ist die `
        + 'Vorlage weg oder der Eintrag beschreibt etwas, das es nicht mehr gibt');
      continue;
    }
    if (eintrag.standform === 'einer' && gesehen.size > 1) {
      const liste = [...gesehen.entries()].map(([s, wo]) => `${s} (${wo})`).join(', ');
      melde('stand-uneinheitlich', eintrag.id,
        `${eintrag.id} belegt ${eintrag.tatsache} und trägt ${gesehen.size} verschiedene Stände: `
        + `${liste}. Der Stand kommt aus ${eintrag.woher} — eine Tatsache, ein Datum`);
    }
  }

  if (gesamt < mindestens) {
    melde('zu-wenig-stempel', '—',
      `nur ${gesamt} Quellenangaben gefunden, erwartet mindestens ${mindestens} — `
      + 'ein Prüfer ohne Fundstellen meldet sauber über nichts');
  }

  return {
    gesamt,
    nach: Object.fromEntries(zahl),
    staende: Object.fromEntries([...staende].map(([id, m]) => [id, [...m.keys()]])),
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Die Registerhygiene: Was `viele` sagt, muss sagen warum.
 *
 * Heute nutzt kein Eintrag diese Form — und genau deshalb steht die Regel
 * hier. `viele` ist die bequeme Antwort auf jeden Befund über abweichende
 * Stände; ohne Begründungszwang wäre der erste Eintrag, der sich nicht halten
 * lässt, morgen umgestellt statt berichtigt.
 */
export function registerbefund(eintraege = QUELLENSTEMPEL) {
  const meldungen = [];
  const gesehen = new Set();
  for (const e of eintraege) {
    if (gesehen.has(e.id)) {
      meldungen.push({ regel: 'doppelte-kennung', wo: e.id, text: `${e.id} steht zweimal im Register` });
    }
    gesehen.add(e.id);
    if (!['einer', 'viele', 'ohne'].includes(e.standform)) {
      meldungen.push({
        regel: 'unbekannte-standform', wo: e.id,
        text: `${e.id} führt die Standform „${e.standform}" — bekannt sind einer, viele, ohne`,
      });
    }
    if (!e.woher || String(e.woher).trim().length < 10) {
      meldungen.push({
        regel: 'ohne-grund', wo: e.id,
        text: `${e.id} sagt nicht, woher sein Stand kommt — dann ist er nicht prüfbar`,
      });
    }
    if (!e.tatsache || String(e.tatsache).trim().length < 10) {
      meldungen.push({
        regel: 'ohne-tatsache', wo: e.id,
        text: `${e.id} sagt nicht, welche Tatsache er belegt — ein Beleg ohne Behauptung belegt nichts`,
      });
    }
  }
  return { geprueft: eintraege.length, meldungen, sauber: meldungen.length === 0 };
}
