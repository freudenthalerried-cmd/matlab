/**
 * Was der Auftrag verlangt — und ob es das gibt.
 *
 * ## Der Befund vom 01.09.
 *
 * `master-prompt.md` ist der Ursprungsauftrag. Unter „Was am Ende vorliegen
 * soll" nennt er **zwölf Ergebnisse**, acht davon mit Dateinamen. Beim
 * Nachsehen: **kein einziger dieser Dateinamen existiert.**
 *
 * Das Vorhaben hat 237 Dokumente hervorgebracht, ein lauffähiges
 * Funktionsmuster und über tausend Testfälle — aber niemand hat je
 * nachgezählt, ob das, was geliefert wurde, dem entspricht, was bestellt
 * wurde. Es ist die größte Fassung genau der Frage, die dieses Vorhaben den
 * ganzen Tag gestellt hat: *Stimmt die Behauptung mit dem Bestand überein?*
 * — nur eine Ebene höher.
 *
 * Für die meisten Punkte gibt es die **Sache** unter einem anderen Namen: Die
 * Unit Economics stehen in `phase3-unit-economics.md` und in `kostenbild.js`,
 * die Compliance in `phase8-compliance.md` und `rechtstexte.js`. Für andere
 * gibt es sie nicht, und das gehört genauso festgehalten.
 *
 * ## Warum die Liste geparst und nicht abgeschrieben wird
 *
 * Eine abgeschriebene Anforderungsliste ist eine zweite Quelle — dieselbe
 * Falle wie überall hier. Gelesen wird deshalb der Auftrag selbst. Ändert
 * jemand dort eine Zeile, meldet der Prüfer eine Anforderung ohne Zuordnung
 * statt sie zu übersehen.
 */

/** Die Überschrift, unter der der Auftrag seine Ergebnisse aufzählt. */
export const ERGEBNISKAPITEL = '## Was am Ende vorliegen soll';

/**
 * Liest die nummerierte Ergebnisliste aus dem Auftragstext.
 *
 * @returns {{nr: number, datei: string|null, text: string}[]}
 */
export function ergebnisliste(text) {
  const s = String(text ?? '');
  const anfang = s.indexOf(ERGEBNISKAPITEL);
  if (anfang === -1) {
    throw new Error(`Der Auftrag hat kein Kapitel „${ERGEBNISKAPITEL}" — ohne es ist nichts zu prüfen.`);
  }
  const rest = s.slice(anfang + ERGEBNISKAPITEL.length);
  const ende = rest.search(/\n## /);
  const block = ende === -1 ? rest : rest.slice(0, ende);

  const ergebnisse = [];
  for (const zeile of block.split('\n')) {
    const m = zeile.match(/^\s*(\d+)\.\s+(.*\S)\s*$/);
    if (!m) continue;
    const text_ = m[2];
    // Der Dateiname steht, wenn überhaupt, in Backticks am Anfang. Punkt 11
    // („KPI-Dashboard als teilbare Seite") nennt keinen — das ist kein Mangel
    // der Liste, sondern eine Anforderung ohne festgelegte Form.
    const datei = text_.match(/^`([^`]+)`/)?.[1] ?? null;
    ergebnisse.push({ nr: Number(m[1]), datei, text: text_ });
  }
  if (ergebnisse.length === 0) {
    throw new Error('Die Ergebnisliste des Auftrags ist leer — dann prüft dieser Prüfer nichts.');
  }
  return ergebnisse;
}

/**
 * Hält die Ergebnisliste gegen die Zuordnung und den Dateibestand.
 *
 * Drei Zustände, und der mittlere ist der wichtige:
 *
 * | Zustand | heißt |
 * |---|---|
 * | `erfuellt` | die Sache gibt es, die genannten Belege existieren |
 * | `anders` | die Sache gibt es **unter anderem Namen** — mit Begründung |
 * | `offen` | es gibt sie nicht; die Zuordnung sagt, warum und was daraus folgt |
 * | `ohne-zuordnung` | **Fehler.** Eine Anforderung, zu der niemand etwas gesagt hat |
 *
 * `ohne-zuordnung` ist der ganze Zweck: Eine Anforderung, die niemand
 * beantwortet hat, ist gefährlicher als eine, die offen bleibt — sie fällt
 * niemandem auf.
 */
export function pruefeErgebnisse(liste, zuordnung = {}, gibtEs = () => false) {
  const befunde = liste.map((e) => {
    const z = zuordnung[String(e.nr)];
    if (!z) return { ...e, zustand: 'ohne-zuordnung', belege: [], fehlendeBelege: [] };

    const belege = z.belege ?? [];
    const fehlendeBelege = belege.filter((b) => !gibtEs(b));
    const zustand = fehlendeBelege.length > 0 ? 'beleg-fehlt' : (z.zustand ?? 'ohne-zuordnung');
    return { ...e, zustand, begruendung: z.begruendung ?? '', belege, fehlendeBelege };
  });

  const zaehle = (z) => befunde.filter((b) => b.zustand === z).length;
  return {
    befunde,
    gesamt: befunde.length,
    erfuellt: zaehle('erfuellt'),
    anders: zaehle('anders'),
    offen: zaehle('offen'),
    // Beides sind Fehler: keine Antwort, oder eine Antwort, die auf etwas
    // zeigt, das es nicht gibt.
    sauber: zaehle('ohne-zuordnung') === 0 && zaehle('beleg-fehlt') === 0,
  };
}
