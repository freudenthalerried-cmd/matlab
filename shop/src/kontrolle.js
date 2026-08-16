/**
 * Die zweite Rechnung — bewusst anders gebaut als die erste.
 *
 * Der Warenkorb summiert Positionen zu Gruppen und Gruppen zu einer Summe.
 * Geprüft wird das bisher gegen sich selbst: Die Testfälle rechnen mit
 * denselben Funktionen nach, die sie prüfen sollen. Ein Denkfehler, der in
 * beide Richtungen gleich falsch ist, fällt dabei nicht auf.
 *
 * Diese Datei geht deshalb einen anderen Weg. Sie liest den **gerenderten
 * Belegtext** zurück und rechnet aus den Zeichen nach, was dort steht. Das ist
 * aus zwei Gründen die richtige Gegenprobe:
 *
 *   1. Sie ist unabhängig. Sie kennt weder `warenkorb.js` noch `preis.js`,
 *      sondern nur Text und die vier Grundrechenarten.
 *   2. Sie prüft, was der Kunde tatsächlich sieht. Ein Fehler beim Formatieren
 *      — eine Zeile, die im Text fehlt, ein Betrag, der falsch gerundet
 *      hinausgeht — wäre allen 213 Testfällen entgangen, weil sie Objekte
 *      prüfen und keine Zeichen.
 *
 * Was sie nicht kann: Sie prüft die **innere Stimmigkeit** des Belegs, nicht
 * seine Richtigkeit. Steht überall derselbe falsche Preis, geht die Rechnung
 * trotzdem auf. Dafür ist der Abgleich mit dem Warenkorb da.
 */

const UST_SATZ = 0.20;

/** Liest einen Betrag in österreichischer Schreibweise: `1.234,56 €`. */
export function leseBetrag(text) {
  const treffer = /(-?[\d.]+,\d{2})\s*€/.exec(String(text ?? ''));
  if (!treffer) return null;
  return Number(treffer[1].replaceAll('.', '').replace(',', '.'));
}

const rund = (n) => Math.round(n * 100) / 100;

/**
 * Zieht aus einem Belegtext alle Zahlen, die dort stehen.
 *
 * Bewusst textnah: Was nicht im Text steht, wird auch nicht ergänzt. Fehlt eine
 * Zeile, meldet die Prüfung sie als fehlend statt sie zu erraten.
 */
export function leseBeleg(text) {
  const zeilen = String(text ?? '').split('\n');

  const zeilensummen = [];
  const frachten = [];
  const summen = {};

  for (const zeile of zeilen) {
    const positionszeile = /à\s+([\d.]+,\d{2}\s*€)\s+netto\s+=\s+([\d.]+,\d{2}\s*€)/.exec(zeile);
    if (positionszeile) {
      zeilensummen.push({ einzelpreis: leseBetrag(positionszeile[1]), summe: leseBetrag(positionszeile[2]) });
      continue;
    }

    if (/^\s+Fracht\s/.test(zeile)) {
      const betrag = leseBetrag(zeile);
      if (betrag !== null) frachten.push(betrag);
      continue;
    }

    for (const [schluessel, muster] of [
      ['warenwertNetto', /^Warenwert netto\s/],
      ['frachtNetto', /^Fracht netto\s/],
      ['summeNetto', /^Summe netto\s/],
      ['ust', /^Umsatzsteuer 20 %\s/],
      ['summeBrutto', /^Gesamtbetrag\s/],
    ]) {
      if (muster.test(zeile)) summen[schluessel] = leseBetrag(zeile);
    }
  }

  return { zeilensummen, frachten, ...summen };
}

/**
 * Prüft, ob der Beleg in sich aufgeht.
 *
 * Fünf Gleichungen, jede einzeln gemeldet — eine Sammelmeldung „stimmt nicht"
 * hilft niemandem beim Suchen.
 */
export function pruefeBelegRechnerisch(text) {
  const b = leseBeleg(text);
  const fehler = [];

  const fehlend = ['warenwertNetto', 'frachtNetto', 'summeNetto', 'ust', 'summeBrutto'].filter(
    (k) => b[k] === undefined || b[k] === null,
  );
  if (fehlend.length) {
    return { stimmig: false, gelesen: b, fehler: [`Im Text fehlen die Zeilen: ${fehlend.join(', ')}`] };
  }

  const summeDerZeilen = rund(b.zeilensummen.reduce((s, z) => s + z.summe, 0));
  const summeDerFrachten = rund(b.frachten.reduce((s, f) => s + f, 0));

  if (b.zeilensummen.length === 0) fehler.push('Der Beleg führt keine einzige Position');
  if (summeDerZeilen !== b.warenwertNetto) {
    fehler.push(`Positionen ergeben ${summeDerZeilen}, ausgewiesen ist ein Warenwert von ${b.warenwertNetto}`);
  }
  if (summeDerFrachten !== b.frachtNetto) {
    fehler.push(`Frachtzeilen ergeben ${summeDerFrachten}, ausgewiesen ist ${b.frachtNetto}`);
  }
  if (rund(b.warenwertNetto + b.frachtNetto) !== b.summeNetto) {
    fehler.push(`Warenwert plus Fracht ergibt ${rund(b.warenwertNetto + b.frachtNetto)}, ausgewiesen ist ${b.summeNetto}`);
  }
  if (rund(b.summeNetto * UST_SATZ) !== b.ust) {
    fehler.push(`20 % von ${b.summeNetto} sind ${rund(b.summeNetto * UST_SATZ)}, ausgewiesen ist ${b.ust}`);
  }
  if (rund(b.summeNetto + b.ust) !== b.summeBrutto) {
    fehler.push(`Netto plus Steuer ergibt ${rund(b.summeNetto + b.ust)}, ausgewiesen ist ${b.summeBrutto}`);
  }

  return { stimmig: fehler.length === 0, gelesen: b, fehler };
}

/**
 * Die einzige wirklich unabhängige Gleichung.
 *
 * Vier der fünf Prüfungen oben nutzen dieselbe Arithmetik, die den Beleg
 * erzeugt hat — sie finden Fehler beim Rendern, nicht beim Rechnen. Hier ist es
 * anders: Der Bruttobetrag entsteht im Warenkorb als `netto + gerundete USt`,
 * hier als `netto × 1,2`. Zwei Wege, zwei Rundungen, dasselbe Ergebnis — oder
 * eben nicht.
 *
 * Der Cent, um den sich beide unterscheiden können, ist keine Spitzfindigkeit:
 * Er landet auf einer Rechnung, und eine Rechnung, deren Summen sich um einen
 * Cent widersprechen, ist ein Rechnungsmangel.
 */
export function pruefeBruttoUnabhaengig(warenkorb) {
  const direkt = rund(warenkorb.summeNetto * (1 + UST_SATZ));
  return {
    stimmig: direkt === warenkorb.summeBrutto,
    ueberSteuer: warenkorb.summeBrutto,
    direkt,
    abweichung: rund(direkt - warenkorb.summeBrutto),
  };
}

/**
 * Vergleicht den gelesenen Beleg mit dem gerechneten Warenkorb.
 *
 * Erst dieser Schritt prüft die Richtigkeit. Beide Wege müssen auf denselben
 * Cent kommen; wo sie es nicht tun, steht die Abweichung mit beiden Zahlen da.
 */
export function vergleicheMitWarenkorb(text, warenkorb) {
  const b = leseBeleg(text);
  const abweichungen = [];

  const paare = [
    ['Warenwert netto', b.warenwertNetto, warenkorb.warenwertNetto],
    ['Fracht netto', b.frachtNetto, warenkorb.frachtNetto],
    ['Summe netto', b.summeNetto, warenkorb.summeNetto],
    ['Umsatzsteuer', b.ust, warenkorb.ust],
    ['Gesamtbetrag', b.summeBrutto, warenkorb.summeBrutto],
  ];

  for (const [name, imText, gerechnet] of paare) {
    if (imText === undefined || imText === null) {
      abweichungen.push(`${name}: steht nicht im Text, gerechnet wurde ${gerechnet}`);
    } else if (imText !== gerechnet) {
      abweichungen.push(`${name}: im Text ${imText}, gerechnet ${gerechnet}`);
    }
  }

  const positionenGerechnet = warenkorb.teillieferungen.reduce((s, t) => s + t.positionen.length, 0);
  if (b.zeilensummen.length !== positionenGerechnet) {
    abweichungen.push(
      `Positionen: im Text ${b.zeilensummen.length}, im Warenkorb ${positionenGerechnet} — ` +
        'eine Position, die nicht gedruckt wird, wird auch nicht geliefert',
    );
  }

  return { deckungsgleich: abweichungen.length === 0, abweichungen };
}
