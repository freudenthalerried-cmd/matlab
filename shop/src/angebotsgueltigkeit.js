/**
 * Was eine Maschine findet, wenn sie heute kommt.
 *
 * **Der Anlass, 22. Oktober 2026.** Weisung des Auftraggebers: „erstelle shop
 * für ki optimiert, sodaß wenn jemand etwas sucht oder sich informiert den
 * preis oder das angebot von meinem shop hat." Gemessen war an diesem Tag:
 *
 * - Der Crawlerzugang steht und ist richtig zugeschnitten — die **Such**-
 *   Roboter dürfen (OAI-SearchBot, Claude-SearchBot, PerplexityBot,
 *   Applebot), die **Trainings**-Sammler nicht.
 * - Die Artikelseiten tragen `Product` und `Offer` mit Preis,
 *   Nettokennzeichnung, Mindestbestellwert und allen fünf Lieferbezirken.
 * - Und **24 von 46 Angeboten trugen ein `priceValidUntil` in der
 *   Vergangenheit.**
 *
 * > **Ein Angebot mit abgelaufener Gültigkeit ist für eine Maschine kein
 * > Angebot.** Google Shopping verwirft es, ein Assistent nennt den Shop ohne
 * > Preis oder nennt ihn nicht.
 *
 * Die Zahl war bekannt — sie stand als Kommentar in `src/maschinenlesbar.js`,
 * mit ihrem Messtag und dem Satz „weil sie mit jedem Tag wächst": sieben am
 * 6. September, elf am 10. Gewachsen ist sie auf 24, und gemeldet hat es
 * niemand, weil kein Prüfer sie ansah.
 *
 * ## Was dieses Modul prüft — und was ausdrücklich nicht
 *
 * **Nicht** die Frist selbst. `priceValidUntil` ist der Preisstand plus
 * `GRENZE_TAGE`, und das ist eine Entscheidung des Betriebs: Nach neunzig
 * Tagen gilt die Grundlage als überholt. Sie zu verlängern, damit mehr
 * Angebote gültig aussehen, wäre der falsche Ausweg — dieselbe Gestalt wie
 * eine hochgesetzte Altersgrenze, nur gegenüber einer Maschine statt
 * gegenüber dem eigenen Prüfer.
 *
 * **Nicht** die Zahl als Schranke. Sie wächst, wenn niemand etwas tut, und
 * ein Prüfer, der an der Zeit rot wird, ist derselbe Fehler wie eine Probe,
 * die den Kalender misst statt den Weg — am 15. Oktober hat dieser Bestand
 * sechs davon gefunden. Die Zahl wird **gemessen und weitergereicht**: in die
 * Liste der offenen Punkte, wo sie dem Auftraggeber gehört.
 *
 * **Geprüft wird der Widerspruch**, und zwar in beide Richtungen. Jede
 * Artikelseite sagt zweierlei über dieselbe Sache — einmal für den Menschen
 * im Klartext („Diese Grundlage ist 119 Tage alt und damit älter als die
 * selbst gesetzte Grenze von 90 Tagen") und einmal für die Maschine als
 * `priceValidUntil`. Beides muss dasselbe sagen:
 *
 * > **Wer die Auszeichnung verlängert, ohne den Satz zu ändern, belügt die
 * > Maschine; wer den Satz entfernt, ohne die Auszeichnung zu ändern, belügt
 * > den Menschen.**
 *
 * Am 10. September war das einmal von Hand nachgezählt — elf Auszeichnungen,
 * elf Sätze, keine Abweichung. Von Hand nachgezählt heißt: beim nächsten Mal
 * nicht.
 */

/**
 * Woran der Klartextsatz zu erkennen ist — **an einem Marker, nicht an Prosa.**
 *
 * Der erste Anlauf suchte den Satz wörtlich: „Diese Grundlage ist 119 Tage alt
 * und damit älter als die selbst gesetzte Grenze von 90 Tagen". Er zählte
 * **null** Treffer bei 24 abgelaufenen Angeboten — und das war kein Befund
 * über den Bestand, sondern einer über das Muster: Im HTML steht
 * `<strong>Diese Grundlage ist 119 Tage alt</strong> und damit älter …`, ein
 * `</strong>` mitten im Satz.
 *
 * > **Ein Muster über Prosa bricht an dem Tag, an dem jemand ein Wort fett
 * > setzt.**
 *
 * Genau diese Falle hat dieser Bestand am 14. Oktober schon einmal gestellt
 * bekommen, von derselben Hand. Die Lehre war dieselbe und wird hier zum
 * zweiten Mal gezogen: Die Seite trägt einen **ausdrücklichen Marker**, und
 * der Prüfer zeigt darauf. `data-alter` und `data-grenze` stehen daneben, weil
 * ein Marker ohne seine Zahlen nur sagt, *dass* etwas gemeldet wird, und nicht
 * *was* — und die beiden Zahlen sind genau das, was gegen die Auszeichnung zu
 * halten ist.
 *
 * Als Zeichenkette und nicht als `RegExp` mit `g`: Ein globaler Ausdruck, den
 * zwei Funktionen teilen, teilt auch seinen Stand. Am 14. Oktober hat das in
 * diesem Bestand einen Parameter namens `eter` erzeugt.
 */
export const UEBERHOLT_MUSTER = 'class="preis-ueberholt" data-alter="(\\d+)" '
  + 'data-grenze="(\\d+)"';

/** Woran die Auszeichnung zu erkennen ist. */
const GUELTIG_BIS_MUSTER = '"priceValidUntil":"(\\d{4}-\\d{2}-\\d{2})"';
const PREIS_MUSTER = '"price":"([0-9.]+)"';

/** Ab wann ein Ablauf als nah gilt — Vorwarnung, kein Befund. */
export const VORWARNUNG_TAGE = 14;

const TAG_MS = 86400000;

function tageBis(datum, heute) {
  const a = Date.parse(`${datum}T00:00:00Z`);
  const b = Date.parse(`${String(heute).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / TAG_MS);
}

/**
 * Liest eine ausgelieferte Artikelseite.
 *
 * **Nicht `seitenbefund`** — den Namen führt `src/seitenaehnlichkeit.js`, und
 * `pruefe-namen` hat die Dublette beim ersten Lauf gemeldet. Ein exportierter
 * Name ist ein Versprechen nach außen, und zwei davon sind eines zu viel.
 *
 * @param {string} name   Dateiname, für die Meldung
 * @param {string} inhalt Die gebaute HTML-Seite
 * @param {string} heute  ISO-Datum
 */
export function angebotsseitenbefund(name, inhalt, heute) {
  const gueltig = new RegExp(GUELTIG_BIS_MUSTER).exec(inhalt);
  const preis = new RegExp(PREIS_MUSTER).exec(inhalt);
  const satz = new RegExp(UEBERHOLT_MUSTER).exec(inhalt);
  const bis = gueltig ? gueltig[1] : null;
  const tage = bis === null ? null : tageBis(bis, heute);
  return {
    name,
    hatPreis: Boolean(preis),
    preis: preis ? preis[1] : null,
    gueltigBis: bis,
    tageBisAblauf: tage,
    abgelaufen: tage !== null && tage < 0,
    laeuftBald: tage !== null && tage >= 0 && tage <= VORWARNUNG_TAGE,
    nenntUeberholt: Boolean(satz),
    genannteTage: satz ? Number(satz[1]) : null,
    genannteGrenze: satz ? Number(satz[2]) : null,
  };
}

/**
 * Hält die Auszeichnung gegen den Klartext und zählt, was eine Maschine heute
 * findet.
 *
 * @param {{name: string, inhalt: string}[]} seiten
 * @param {string} heute ISO-Datum
 */
export function angebotsbefund(seiten, heute) {
  const probleme = [];
  const befunde = seiten.map((s) => angebotsseitenbefund(s.name, s.inhalt, heute));

  for (const b of befunde) {
    /*
     * **Ein Preis ohne Gültigkeit.** Für einen Produktfeed ist
     * `priceValidUntil` keine Pflichtangabe, und ein fehlender Schlüssel ist
     * in diesem Bestand die richtige Antwort auf „nicht bekannt". Hier ist er
     * aber bekannt — er wird aus dem Preisstand gerechnet. Fehlt er trotzdem,
     * ist entweder der Preisstand weg oder die Rechnung ausgefallen.
     */
    if (b.hatPreis && b.gueltigBis === null) {
      probleme.push({
        regel: 'preis-ohne-gueltigkeit',
        seite: b.name,
        satz: 'die Seite zeichnet einen Preis aus und nennt kein priceValidUntil — '
          + 'ohne Gültigkeit kann eine Maschine nicht sagen, ob das Angebot noch steht',
      });
      continue;
    }
    if (!b.hatPreis) continue;

    /*
     * **Die beiden Richtungen, um die es hier geht.**
     *
     * Die Seite sagt dem Menschen „älter als die eigene Grenze" und der
     * Maschine ein Datum. Gehen die beiden auseinander, ist eine der zwei
     * Auskünfte falsch — und welche, hängt davon ab, wer nachgesehen hat.
     */
    if (b.abgelaufen && !b.nenntUeberholt) {
      probleme.push({
        regel: 'auszeichnung-abgelaufen-ohne-satz',
        seite: b.name,
        satz: `priceValidUntil ${b.gueltigBis} liegt ${-b.tageBisAblauf} Tage zurück, `
          + 'und die Seite sagt dem Leser nichts davon — die Maschine erfährt mehr als '
          + 'der Mensch',
      });
    }
    if (!b.abgelaufen && b.nenntUeberholt) {
      probleme.push({
        regel: 'satz-ohne-abgelaufene-auszeichnung',
        seite: b.name,
        satz: `die Seite nennt die Grundlage mit ${b.genannteTage} Tagen überholt, `
          + `priceValidUntil ${b.gueltigBis} gilt aber noch ${b.tageBisAblauf} Tage — `
          + 'der Mensch erfährt mehr als die Maschine',
      });
    }
    /*
     * **Und die Grenze selbst.** Der Klartextsatz nennt sie mit („von 90
     * Tagen"). Nennt er eine andere als die, aus der die Auszeichnung
     * gerechnet ist, stehen zwei Grenzen im Haus — und eine Zahl, die an zwei
     * Stellen steht, fällt irgendwann an einer davon.
     */
    if (b.nenntUeberholt && b.genannteGrenze !== null && b.gueltigBis !== null) {
      const ausGrenze = tageBis(b.gueltigBis, heute) + b.genannteTage;
      if (ausGrenze !== b.genannteGrenze) {
        probleme.push({
          regel: 'zwei-grenzen',
          seite: b.name,
          satz: `der Satz nennt eine Grenze von ${b.genannteGrenze} Tagen, aus `
            + `priceValidUntil und dem genannten Alter folgt ${ausGrenze}`,
        });
      }
    }
  }

  const mitPreis = befunde.filter((b) => b.hatPreis);
  return {
    geprueft: seiten.length,
    mitPreis: mitPreis.length,
    abgelaufen: mitPreis.filter((b) => b.abgelaufen).length,
    laeuftBald: mitPreis.filter((b) => b.laeuftBald).length,
    nenntUeberholt: mitPreis.filter((b) => b.nenntUeberholt).length,
    naechsterAblauf: mitPreis
      .filter((b) => b.tageBisAblauf !== null && b.tageBisAblauf >= 0)
      .map((b) => b.gueltigBis)
      .sort()[0] ?? null,
    befunde,
    probleme,
    sauber: probleme.length === 0,
  };
}

/**
 * Der Satz für die Liste der offenen Punkte.
 *
 * Er sagt **nicht** „bitte Preise aktualisieren", sondern was die Zahl für den
 * Wunsch des Auftraggebers bedeutet. Eine Aufgabe ohne ihre Folge wird
 * verschoben; eine Aufgabe mit der Folge daneben nicht.
 */
export function ablaufsatz(befund) {
  if (befund.abgelaufen === 0 && befund.laeuftBald === 0) {
    return `Alle ${befund.mitPreis} ausgezeichneten Angebote gelten — der nächste Ablauf `
      + `ist ${befund.naechsterAblauf ?? 'nicht datiert'}.`;
  }
  const teile = [];
  if (befund.abgelaufen > 0) {
    teile.push(`${befund.abgelaufen} von ${befund.mitPreis} ausgezeichneten Angeboten tragen `
      + 'ein Gültigkeitsdatum in der Vergangenheit. Für einen Assistenten oder einen '
      + 'Produktfeed ist das kein Angebot: Der Preis wird verworfen, und genau die Frage '
      + '„was kostet das" bleibt bei diesem Shop unbeantwortet');
  }
  if (befund.laeuftBald > 0) {
    teile.push(`${befund.laeuftBald} weitere laufen in den nächsten ${VORWARNUNG_TAGE} Tagen ab`);
  }
  return `${teile.join('; ')}. Das Datum ist der Preisstand plus die eigene `
    + 'Neunzig-Tage-Grenze; es verlängert sich nicht durch einen Bau, sondern nur durch '
    + 'eine aktuelle Preisliste des Lieferanten.';
}
