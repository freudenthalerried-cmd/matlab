/**
 * Die Bereitschaftsliste und der Plan — halten sie sich gegenseitig aus?
 *
 * **Der Anlass, 4. September 2026, spät.** Am selben Abend hat `startklar()`
 * einen zehnten Punkt bekommen: die **Bankverbindung**. Der Rolloutplan hat
 * davon nichts erfahren. Er ist das Papier, das der Auftraggeber vor der
 * Budgetfreigabe liest, und er führte weiterhin vierzehn Etappen — darunter
 * zehn Tage Legitimationsprüfung beim Zahlungsanbieter und keinen Schritt,
 * mit dem der Shop am ersten Tag Geld annehmen kann.
 *
 * > **Zwei Listen über dieselbe Sache — was der Auftraggeber liefern muss —
 * > und keine wusste von der anderen.** Die kürzere gewinnt, weil sie
 * > kürzer aussieht: ein Plan mit einer Voraussetzung weniger liest sich wie
 * > ein guter Plan.
 *
 * Beim ersten Lauf dieses Registers fehlten zwei Punkte im Plan: die
 * **Antwortzeit** (seit 2. September in der Liste) und die
 * **Bankverbindung** (seit demselben Abend). Beide sind Angaben des
 * Auftraggebers, beide kosten nichts, beide halten den Shop auf.
 *
 * ## Warum ein Register und keine Prüfung „im Kopf"
 *
 * Die Punkte entstehen zur Laufzeit in `startklar()`, die Etappen stehen als
 * Liste in `rollout.js`. Ein Vergleich, der beide nur nebeneinanderlegt, sagt
 * nichts: Nicht jeder Punkt **braucht** eine Etappe. „Jeder geführte Artikel
 * ist gerechnet" ist meine eigene Arbeit und fällt an, sobald ein Artikel
 * dazukommt — dafür einen Kalendereintrag zu führen hieße, meine Sorgfalt zu
 * planen.
 *
 * Deshalb dasselbe Muster wie überall in diesem Haus: **Zuordnung oder
 * Pflichtgrund**, und ein Prüfer, der das Register in **beide** Richtungen
 * gegen die Wirklichkeit hält. Ein Punkt ohne Eintrag fällt auf. Ein Eintrag
 * ohne Punkt auch — sonst bliebe die Zuordnung stehen, wenn der Punkt
 * verschwindet.
 */

/**
 * Je Punkt der Bereitschaftsliste: die Etappe, die ihn schließt — oder der
 * Grund, warum der Plan ihn nicht führt.
 *
 * `etappe` und `warumOhneEtappe` schließen einander aus. Wer beides schriebe,
 * hätte einen Grund für etwas, das er zugleich tut.
 */
export const ZUORDNUNG = Object.freeze([
  Object.freeze({ punkt: 'bestellweg', etappe: 'bestellweg' }),
  Object.freeze({ punkt: 'bankverbindung', etappe: 'betreiberangaben' }),
  Object.freeze({ punkt: 'impressum', etappe: 'impressum' }),
  Object.freeze({ punkt: 'antwortzeit', etappe: 'betreiberangaben' }),
  Object.freeze({
    punkt: 'preise',
    warumOhneEtappe: 'Der Punkt ist heute erfüllt und wird nur wieder offen, wenn ein Artikel '
      + 'dazukommt — was ausschließlich in der Etappe „katalog-erweitern" geschieht, und dort '
      + 'in derselben Runde geschlossen wird. Eine eigene Etappe plante meine eigene Sorgfalt.',
  }),
  Object.freeze({
    punkt: 'keine-platzhalter',
    warumOhneEtappe: 'Wie „preise": ein Platzhalter entsteht nur beim Erweitern des Katalogs '
      + 'und wird in derselben Arbeit ersetzt. Der Punkt bewacht das Ergebnis dieser Etappe, '
      + 'er ist keine eigene.',
  }),
  Object.freeze({ punkt: 'lieferzeit', etappe: 'lieferantengespraech' }),
  Object.freeze({ punkt: 'zahlungsanbieter', etappe: 'zahlungsanbieter' }),
  Object.freeze({ punkt: 'rechtstexte', etappe: 'rechtstexte' }),
  Object.freeze({ punkt: 'domain', etappe: 'upload' }),
  Object.freeze({ punkt: 'repository', etappe: 'repository-privat' }),
]);

/**
 * Hält das Register gegen beide Wirklichkeiten.
 *
 * @param {string[]} punkte    die Kennungen aus `startklar().punkte`
 * @param {string[]} etappen   die Kennungen aus `ETAPPEN`
 * @param {object[]} [zuordnung]
 */
export function planbefund(punkte, etappen, zuordnung = ZUORDNUNG) {
  const meldungen = [];
  const bekanntePunkte = new Set(punkte);
  const bekannteEtappen = new Set(etappen);
  const gefuehrt = new Set();

  for (const z of zuordnung) {
    if (gefuehrt.has(z.punkt)) {
      meldungen.push({ regel: 'punkt-zweimal', text: `${z.punkt}: steht zweimal im Register` });
    }
    gefuehrt.add(z.punkt);

    if (!bekanntePunkte.has(z.punkt)) {
      meldungen.push({
        regel: 'eintrag-ohne-punkt',
        text: `${z.punkt}: steht im Register, aber nicht mehr in der Bereitschaftsliste`,
      });
    }
    if (z.etappe && z.warumOhneEtappe) {
      meldungen.push({
        regel: 'zuordnung-und-grund',
        text: `${z.punkt}: nennt eine Etappe und begründet zugleich, keine zu haben`,
      });
      continue;
    }
    if (z.etappe) {
      if (!bekannteEtappen.has(z.etappe)) {
        meldungen.push({
          regel: 'etappe-gibt-es-nicht',
          text: `${z.punkt}: verweist auf die Etappe „${z.etappe}", die es im Plan nicht gibt`,
        });
      }
      continue;
    }
    // Dieselbe Länge wie bei `brauchtVor` in `rollout.js`: Ein Grund, der in
    // eine Zeile passt, ist meistens eine Behauptung.
    if (!z.warumOhneEtappe || z.warumOhneEtappe.length < 80) {
      meldungen.push({
        regel: 'grund-zu-duenn',
        text: `${z.punkt}: keine Etappe und kein tragfähiger Grund`,
      });
    }
  }

  // Die Richtung, die den Fund vom 4. September gemacht hätte: ein Punkt, den
  // niemand ins Register geschrieben hat, fährt sonst still ungeplant mit.
  for (const p of punkte) {
    if (!gefuehrt.has(p)) {
      meldungen.push({
        regel: 'punkt-ohne-eintrag',
        text: `${p}: steht in der Bereitschaftsliste und in keiner Etappe des Plans`,
      });
    }
  }

  return {
    punkte: punkte.length,
    mitEtappe: zuordnung.filter((z) => z.etappe).length,
    begruendet: zuordnung.filter((z) => !z.etappe).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
