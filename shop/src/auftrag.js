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

/* ------------------------------------------------------------------ *
 * Was die Begründung nennt — Ergänzung vom 2. September
 *
 * Bis hierher prüfte der Abgleich, dass die **Belegdateien** existieren. Am
 * 2. September stellte sich heraus, dass das zu wenig ist: Zum neunten
 * Ergebnis stand *„kontrolle.js prüft jeden Beleg gegen die Rechnung"* — die
 * Datei gab es, den Vorgang nicht. Dreiundfünfzig Testverweise, kein einziger
 * Aufruf aus dem Betrieb.
 *
 * > **Ein Beleg, der existiert, belegt noch nichts.**
 *
 * Geprüft wird deshalb jetzt auch, was die Begründung **beim Namen nennt**:
 * jede Datei, jeder `npm run`-Befehl, jede Kennung aus dem Quelltext. Was
 * genannt wird, muss es geben.
 *
 * Zwei Sorten Ausnahme sind unvermeidlich und stehen deshalb ausdrücklich im
 * Datensatz statt in einer Regel:
 *
 *   1. Etwas wird genannt, **weil es fehlt** — „statt einer Datei ANNAHMEN.md".
 *   2. Ein Wort steht in Großbuchstaben zur **Betonung**, nicht als Kennung —
 *      „Rohdaten von WETTBEWERBSPREISEN gibt es nicht".
 *
 * Beide brauchen einen Grund im Feld `_ausnahmen`. Wer eine Ausnahme einträgt,
 * die keine ist, muss beim Schreiben des Grundes merken, dass er keinen hat.
 * ------------------------------------------------------------------ */

/** Eine Datei, wie sie in Prosa geschrieben wird. */
export const DATEIMUSTER = /\b([A-Za-z0-9._-]+\.(?:js|mjs|json|md|html|xlsx|docx|csv))\b/g;

/** Ein Werkzeugaufruf. */
export const BEFEHLSMUSTER = /\bnpm run ([a-z][a-z0-9-]*)/g;

/**
 * Eine Kennung aus dem Quelltext: `kleinesCamelCase` oder
 * `GROSS_MIT_UNTERSTRICH`.
 *
 * **Ein einzelnes Wort in Großbuchstaben steht ausdrücklich nicht darin**, und
 * das ist die Grenze dieses Prüfers. Die erste Fassung nahm es auf und meldete
 * prompt `DREI`, `GROESSTEN` und `RISIKEN` als Kennungen — aus dem Satz „die
 * DREI GROESSTEN RISIKEN". In deutscher Prosa ist ein großgeschriebenes Wort
 * eine Betonung, und `IMPRESSUMSFELDER` sieht genauso aus wie `WETTBEWERBS-
 * PREISEN`.
 *
 * > **Was sich nicht unterscheiden lässt, wird nicht geprüft — nicht geraten.**
 *
 * Der Preis ist bekannt: `ANNAHMEN` und `IMPRESSUMSFELDER` fallen aus der
 * Prüfung. `camelCase` bleibt, weil deutsche Prosa es nicht kennt, und die
 * Datei- und Befehlsnamen tragen ohnehin das meiste Gewicht.
 */
export const KENNUNGSMUSTER = /\b([A-Z][A-Z0-9]*_[A-Z0-9_]+|[a-z]+[A-Z][A-Za-z0-9]{2,})\b/g;

/** Was eine Begründung an Nachprüfbarem nennt. */
export function genanntes(begruendung) {
  const text = String(begruendung ?? '');
  const hol = (muster) => [...new Set([...text.matchAll(muster)].map((m) => m[1]))];
  const dateien = hol(DATEIMUSTER);
  return {
    dateien,
    befehle: hol(BEFEHLSMUSTER),
    // Ein Dateiname enthält oft selbst eine Kennung („empfindlichkeit.js");
    // sie wird nicht doppelt geprüft.
    kennungen: hol(KENNUNGSMUSTER).filter((k) => !dateien.some((d) => d.startsWith(k))),
  };
}

/**
 * Prüft jede Begründung gegen die Wirklichkeit.
 *
 * @param {object} zuordnung  der Datensatz, samt `_ausnahmen`
 * @param {object} kennt      {datei(name), befehl(name), kennung(name)} → boolean
 */
export function pruefeBegruendungen(zuordnung = {}, kennt = {}) {
  const ausnahmen = new Map((zuordnung._ausnahmen ?? []).map((a) => [a.was, a]));
  for (const [was, a] of ausnahmen) {
    if (!a.warum || a.warum.length < 30) throw new Error(`Ausnahme ohne Grund: ${was}`);
  }

  const meldungen = [];
  let geprueft = 0;

  for (const [nr, eintrag] of Object.entries(zuordnung)) {
    if (nr.startsWith('_')) continue;
    const g = genanntes(eintrag.begruendung);
    const paare = [
      ...g.dateien.map((x) => ['Datei', x, kennt.datei]),
      ...g.befehle.map((x) => ['Befehl', x, kennt.befehl]),
      ...g.kennungen.map((x) => ['Kennung', x, kennt.kennung]),
    ];
    for (const [art, name, weiss] of paare) {
      if (ausnahmen.has(name)) continue;
      geprueft += 1;
      if (typeof weiss !== 'function') throw new Error(`Für ${art} fehlt die Auskunft`);
      if (!weiss(name)) {
        const artikel = { Datei: ['die Datei', 'die'], Befehl: ['den Befehl', 'den'], Kennung: ['die Kennung', 'die'] }[art];
        meldungen.push({
          nr,
          art,
          name,
          text: `Ergebnis ${nr} nennt ${artikel[0]} „${name}" — ${artikel[1]} gibt es nicht`,
        });
      }
    }
  }

  return { geprueft, meldungen, sauber: meldungen.length === 0, ausnahmen: ausnahmen.size };
}
