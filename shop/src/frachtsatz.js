/**
 * Die Frachtzeile — **eine** Zahl, an einer Stelle gerechnet.
 *
 * **Der Anlass, 13. September 2026.** `frachttext.js` gibt es seit dem
 * 5. September, und sein Kopf sagt, warum:
 *
 * > „Der Wortlaut stand zweimal … **Eine Probe, die zwei Fassungen
 * > vergleicht, ist besser als nichts und schlechter als eine Fassung.**"
 *
 * Für den **Satz** wurde damals eine Datei gebaut. Die **Zahl** daneben blieb
 * stehen — und zwar dreimal:
 *
 * | Stelle | wofür |
 * |---|---|
 * | `preis.js` `fracht()` | was der Lieferant uns verrechnet |
 * | `shopkern.js` `kundenWarenkorb()` | was der Kunde bezahlt |
 * | `kontrolle.js` `pruefeFrachtdeckung()` | der Prüfer, der die beiden **gegeneinander hält** |
 *
 * Die dritte ist die schlimmste: Ein Prüfer, der seine Vergleichsgröße mit
 * einer **Abschrift** der geprüften Formel rechnet, misst nicht die Deckung,
 * sondern die Treue der Abschrift.
 *
 * Dazu kam seit dem 12. September ein Bruch: `frachtsatzbefund` verlangt
 * `modell: "pauschale"` und weist jeden anderen Satz beim Bauen ab — die
 * beiden Abschriften wussten davon nichts und hätten eine Staffel nach
 * Gewicht still als Pauschale gerechnet.
 *
 * ## Warum eine eigene Datei und nicht `preis.js`
 *
 * Dieselbe Begründung wie bei `frachttext.js`: `preis.js` trägt
 * `einkaufspreis`, `artikelEinkauf` und `rohmarge`. Es ins Browserbündel zu
 * ziehen hieße, die Einkaufsrechnung auszuliefern.
 *
 * **Was hier steht, ist eine Zahl aus drei Feldern und kein Wissen über den
 * Einkauf.** Die Frei-Haus-Schwelle bekommt der Browser weiterhin nicht: Er
 * ruft ohne Bestellwert, und ohne Bestellwert gibt es keine Frachtfreiheit —
 * nicht, weil sie ausgeschlossen wäre, sondern weil sie von hier aus nicht
 * feststellbar ist.
 */

import { cent } from './format.js';

/**
 * Das einzige Frachtmodell, das dieses Haus rechnen kann.
 *
 * **Gelesen seit dem 12. September 2026.** Alle vier Lieferanten tragen
 * `fracht.modell`, und bis dahin las es keine Zeile. Ein Feld, das ein Modell
 * benennt, sagt: Es gibt mehr als eines — und eine Staffel nach Gewicht oder
 * Entfernung rechnete diese Funktion still falsch.
 */
export const FRACHTMODELL = 'pauschale';

/**
 * Der Frachtbetrag einer Lieferung.
 *
 * @param {object} regel  `lieferant.fracht`
 * @param {object} lage
 * @param {number|null} [lage.bestellwertNetto]  Der **Einkaufs**wert dieser
 *   Lieferung. `null` heißt: von hier aus nicht feststellbar — dann gibt es
 *   keine Frachtfreiheit. Das ist der Fall des Browsers, der keine
 *   Einkaufspreise kennt und keine kennen soll.
 * @param {number} [lage.sperrgutPositionen]  Zahl der Positionen mit Sperrgut.
 */
export function frachtbetrag(regel, { bestellwertNetto = null, sperrgutPositionen = 0 } = {}) {
  if (!regel) throw new Error('Frachtbetrag ohne Frachtsatz');
  const frachtfrei = bestellwertNetto !== null
    && regel.freiHausAbNetto != null
    && bestellwertNetto >= regel.freiHausAbNetto;
  /*
   * **Kein `?? 0` mehr — 13. September 2026.** Hier und in beiden Abschriften
   * stand `regel.sperrgutZuschlagNetto ?? 0`. Seit dem 12. September verlangt
   * `frachtsatzbefund` beide Zahlen und hält den Bau an, wenn eine fehlt: Der
   * Rückfall deckte einen Zustand, den es nicht mehr gibt, und hätte beim
   * nächsten unvollständigen Datensatz wieder die optimistischste Annahme
   * gemacht.
   */
  return {
    betragNetto: frachtfrei ? 0 : cent(regel.pauschaleNetto + sperrgutPositionen * regel.sperrgutZuschlagNetto),
    frachtfrei,
    schwelleNetto: regel.freiHausAbNetto ?? null,
  };
}

/**
 * Was diese Rechnung von einem Frachtsatz verlangt — und ob er es hergibt.
 *
 * **Zwei Funde vom 12. September 2026, beide am selben Objekt.**
 *
 * **Erstens: die stille Null.** `oeffentlicherLieferant` schrieb
 * `pauschaleNetto: l.fracht?.pauschaleNetto ?? 0`. Ein Lieferant ohne
 * Frachtsatz wurde damit auf der **Kundenseite** zu frei Haus:
 *
 * ```
 * Kasse:  Warenwert 300,00 €   Fracht 0,00 €   offen: []
 * intern: Cannot read properties of undefined (reading 'freiHausAbNetto')
 * ```
 *
 * > **Derselbe fehlende Wert bricht den einen Weg laut ab und macht auf dem
 * > anderen lautlos ein Geschenk.**
 *
 * **Zweitens: das ungelesene Feld.** Alle vier Lieferanten tragen
 * `fracht.modell: "pauschale"`, und keine Zeile dieses Bestands las es.
 *
 * > **Ein Feld, das eine Wahl behauptet, die niemand trifft, ist eine Zusage
 * > an den nächsten Datensatz.**
 */
export function frachtsatzbefund(lieferanten = []) {
  const meldungen = [];
  for (const l of lieferanten) {
    const wo = l?.name ?? l?.id ?? '(ohne Kennung)';
    const f = l?.fracht;
    if (!f) {
      meldungen.push({
        regel: 'ohne-frachtsatz',
        text: `${wo}: kein Frachtsatz hinterlegt — auf der Kundenseite würde daraus `
          + 'frei Haus, und bezahlt hätte es dieses Haus',
      });
      continue;
    }
    if (f.modell !== FRACHTMODELL) {
      meldungen.push({
        regel: 'fremdes-frachtmodell',
        text: `${wo}: Frachtmodell „${f.modell}" — gerechnet wird ausschließlich `
          + `„${FRACHTMODELL}" (Pauschale je Lieferung plus Zuschlag je Sperrgutposition). `
          + 'Eine Staffel nach Gewicht oder Entfernung rechnete diese Funktion still falsch',
      });
    }
    for (const [feld, wert] of [['pauschaleNetto', f.pauschaleNetto],
      ['sperrgutZuschlagNetto', f.sperrgutZuschlagNetto]]) {
      if (typeof wert !== 'number' || !Number.isFinite(wert) || wert < 0) {
        meldungen.push({
          regel: 'frachtsatz-unlesbar',
          text: `${wo}: ${feld} ist ${JSON.stringify(wert)} — daraus lässt sich keine `
            + 'Frachtzeile rechnen, und null wäre die optimistischste aller Annahmen',
        });
      }
    }
    /*
     * Die Frei-Haus-Schwelle darf fehlen — Poschacher hat keine erkennbare,
     * und das ist ein **Befund** aus fünfzehn Rechnungen und keine Lücke.
     * `null` heißt hier „es gibt keine", nicht „wir wissen es nicht".
     */
    if (f.freiHausAbNetto !== null && f.freiHausAbNetto !== undefined
      && !(typeof f.freiHausAbNetto === 'number' && f.freiHausAbNetto > 0)) {
      meldungen.push({
        regel: 'schwelle-unlesbar',
        text: `${wo}: freiHausAbNetto ist ${JSON.stringify(f.freiHausAbNetto)} — `
          + 'zulässig sind eine positive Zahl oder `null` für „es gibt keine"',
      });
    }
  }
  return { geprueft: lieferanten.length, meldungen, sauber: meldungen.length === 0 };
}
