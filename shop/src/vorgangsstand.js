/**
 * Wie weit ist dieser Geschäftsfall — und was ist als Nächstes dran?
 *
 * **Der Anlass, 12. September 2026, abends.** Die Akte ist vollständig: Sie
 * liest jeden Vorgang zurück, nennt zu jeder Zeile den Beleg und zu jedem
 * Angebot die Bindefrist. Sie sagt, **was geschehen ist**.
 *
 * Gemessen an vier Vorgängen an vier verschiedenen Punkten der Betriebskette —
 * einer mit Angebot, einer angenommen, einer verfallen, einer mit bestellter
 * Ware — sagte sie über alle vier dasselbe: die Zeilen und die Belege.
 *
 * > **Nichts in diesem Haus sagt, was als Nächstes zu tun ist.** Der Kunde hat
 * > angenommen — und niemand erinnert daran, den Zahlungseingang zu prüfen.
 * > Die Ware ist bestellt — und niemand erinnert an das Lieferdatum, ohne das
 * > keine Rechnung entsteht.
 *
 * Die einzige vorwärts gerichtete Aussage der ganzen Akte war bis heute die
 * Bindefrist, und die kam vorgestern dazu.
 *
 * ## Woher der nächste Schritt kommt
 *
 * **Nicht von hier.** Die Schritte eines Geschäftsfalls führt `SCHRITTE` in
 * `src/betriebskette.js`, mitsamt Werkzeug, Gate und — wo es kein Werkzeug
 * gibt — dem Grund dafür. Diese Datei ordnet nur die **Papiere** den Schritten
 * zu und liest den Rest dort ab. Eine zweite Liste der Schritte wäre eine
 * Abschrift, und eine davon altert.
 */

import { ARTEN } from './ablage.js';
import { SCHRITTE, ABZWEIGE } from './betriebskette.js';
import { bindefrist } from './beleg.js';

/**
 * Welches Papier welchen Schritt belegt — das Register dieser Datei.
 *
 * Ein Papier ist der **Beweis**, dass ein Schritt geschehen ist: Die
 * Auftragsbestätigung ist der Vertragsschluss, die Lieferantenbestellung ist
 * die Bestellung. Zwei Papiere belegen keinen Schritt, sondern einen
 * **Abzweig**, an dem der Fall die Kette verlässt: die Absage und die
 * Gutschrift.
 *
 * Die beiden Arten ohne Blatt (`vermerk`, `uidabfrage`) stehen nicht hier und
 * dürfen es nicht — sie belegen nichts, sie *sind* die Aufzeichnung.
 * `papierschrittbefund()` hält das in beide Richtungen fest.
 */
export const PAPIERSCHRITT = Object.freeze({
  angebot: Object.freeze({ schritt: 'angebot' }),
  auftragsbestaetigung: Object.freeze({ schritt: 'annahme' }),
  lieferantenbestellung: Object.freeze({ schritt: 'lieferantenbestellung' }),
  rechnung: Object.freeze({ schritt: 'rechnung' }),
  absage: Object.freeze({ abzweig: 'absage' }),
  gutschrift: Object.freeze({ abzweig: 'rechnung-falsch' }),
});

/** Hält `PAPIERSCHRITT` gegen `ARTEN` und die Betriebskette — in beide Richtungen. */
export function papierschrittbefund() {
  const meldungen = [];
  const schritte = new Set(SCHRITTE.map((s) => s.id));
  const abzweige = new Set(ABZWEIGE.map((a) => a.id));

  for (const [art, beschreibung] of Object.entries(ARTEN)) {
    const zuordnung = PAPIERSCHRITT[art];
    if (beschreibung.beleg && !zuordnung) {
      meldungen.push({
        regel: 'papier-ohne-schritt',
        text: `${art} ist ein Papier und belegt keinen Schritt der Betriebskette `
          + '— die Akte kann daraus nicht sagen, wie weit der Vorgang ist',
      });
    }
    if (!beschreibung.beleg && zuordnung) {
      meldungen.push({
        regel: 'schritt-ohne-papier',
        text: `${art} hat kein Blatt und ist trotzdem als Beleg eines Schritts geführt `
          + '— ein Vermerk beweist keinen Schritt, er ist die Aufzeichnung',
      });
    }
  }

  for (const [art, zuordnung] of Object.entries(PAPIERSCHRITT)) {
    if (!ARTEN[art]) {
      meldungen.push({
        regel: 'art-gibt-es-nicht',
        text: `${art} steht im Papierregister und in ARTEN nicht`,
      });
    }
    if (zuordnung.schritt && !schritte.has(zuordnung.schritt)) {
      meldungen.push({
        regel: 'schritt-gibt-es-nicht',
        text: `${art} zeigt auf den Schritt ${zuordnung.schritt}, den die Betriebskette nicht führt`,
      });
    }
    if (zuordnung.abzweig && !abzweige.has(zuordnung.abzweig)) {
      meldungen.push({
        regel: 'abzweig-gibt-es-nicht',
        text: `${art} zeigt auf den Abzweig ${zuordnung.abzweig}, den die Betriebskette nicht führt`,
      });
    }
  }

  /*
   * **Und das Voraussetzungsregister — 13. September 2026.** Es nennt Arten
   * beim Namen; eine Art, die es nicht gibt, wäre eine Regel, die nie greift,
   * und eine Art ohne Blatt kann nichts belegen.
   */
  for (const v of VORAUSGESETZT) {
    for (const [rolle, art] of [['papier', v.papier], ['braucht', v.braucht]]) {
      if (!ARTEN[art]) {
        meldungen.push({
          regel: 'voraussetzung-ohne-art',
          text: `Die Voraussetzung ${v.papier} → ${v.braucht} nennt als ${rolle} `
            + `${art}, und diese Art gibt es nicht`,
        });
      } else if (!ARTEN[art].beleg) {
        meldungen.push({
          regel: 'voraussetzung-ohne-blatt',
          text: `Die Voraussetzung ${v.papier} → ${v.braucht} nennt als ${rolle} ${art} `
            + '— eine Art ohne Blatt belegt nichts und kann nichts voraussetzen',
        });
      }
    }
    if (v.warum.length < 80) {
      meldungen.push({
        regel: 'voraussetzung-ohne-grund',
        text: `Die Voraussetzung ${v.papier} → ${v.braucht} trägt keinen tragenden Grund`,
      });
    }
  }

  return { geprueft: Object.keys(ARTEN).length, meldungen, sauber: meldungen.length === 0 };
}

/** Der Schritt der Kette, den ein Papier belegt — oder null. */
function schrittIndex(art) {
  const id = PAPIERSCHRITT[art]?.schritt;
  return id ? SCHRITTE.findIndex((s) => s.id === id) : -1;
}

/**
 * Der Stand eines Vorgangs aus seinen Journalzeilen.
 *
 * Gelesen werden **Arten und Zeitpunkte**, kein Inhalt: Der Stand eines
 * Vorgangs ergibt sich daraus, welche Papiere es gibt, nicht daraus, was
 * darauf steht.
 *
 * @param {object[]} eintraege  die Zeilen **eines** Vorgangs
 * @param {object} [lage]
 * @param {string} [lage.heute]  Geschäftstag, für die Bindefrist
 */
export function vorgangsstand(eintraege = [], { heute = null } = {}) {
  const arten = eintraege.map((e) => e.art);
  const hat = (art) => arten.includes(art);

  /*
   * **Die Abzweige zuerst.** Ein Fall, der die Kette verlassen hat, hat keinen
   * nächsten Schritt — und die Frage „wie weit ist er?" ist dann falsch
   * gestellt. Die Reihenfolge ist die der Endgültigkeit: Eine Gutschrift hebt
   * eine gestellte Rechnung auf, eine Absage kommt vor allem anderen.
   */
  if (hat('gutschrift')) {
    return abschluss(eintraege, 'aufgehoben', 'rechnung-falsch');
  }
  if (hat('absage')) {
    return abschluss(eintraege, 'abgesagt', 'absage');
  }

  const erreicht = Math.max(-1, ...arten.map(schrittIndex));
  const letzter = erreicht >= 0 ? SCHRITTE[erreicht] : null;

  /*
   * **Das verfallene Angebot.** Steht nur das Angebot da und ist die
   * Bindefrist abgelaufen, ist der nächste Schritt nicht „der Kunde nimmt
   * an" — nimmt er am zwanzigsten Tag an, entsteht kein Vertrag zum Preis von
   * damals (§ 862 ABGB). Die Folge ist eine Entscheidung des Betreibers, und
   * genau das sagt der Abzweig.
   */
  if (letzter?.id === 'angebot' && heute) {
    const angebot = eintraege.find((e) => e.art === 'angebot');
    const frist = bindefrist(angebot?.zeitpunkt, heute);
    if (frist.lesbar && frist.abgelaufen) {
      return { ...abschluss(eintraege, 'verfallen', 'angebot-verfaellt'), frist };
    }
  }

  const naechster = SCHRITTE[erreicht + 1] ?? null;
  return {
    papiere: arten.length,
    erreicht: letzter?.id ?? null,
    abgeschlossen: null,
    abzweig: null,
    naechster: naechster
      ? {
        id: naechster.id,
        was: naechster.was,
        werkzeug: naechster.werkzeug,
        gate: naechster.gate,
        warumOhneWerkzeug: naechster.warumOhneWerkzeug ?? null,
      }
      : null,
  };
}

function abschluss(eintraege, wie, abzweigId) {
  const abzweig = ABZWEIGE.find((a) => a.id === abzweigId) ?? null;
  return {
    papiere: eintraege.length,
    erreicht: null,
    abgeschlossen: wie,
    abzweig: abzweig ? { id: abzweig.id, was: abzweig.was, grundlage: abzweig.grundlage } : null,
    naechster: null,
  };
}

/**
 * Ist die Bindefrist dieses Vorgangs noch eine Frage?
 *
 * **Der Fund vom 12. September 2026, spät.** Seit dem Nachmittag rechnet
 * `npm run akte` zu jedem Angebot die Bindefrist aus. Sie tat es zu **jedem**
 * — auch zu einem, das längst angenommen und abgerechnet ist. Gemessen an
 * einem Vorgang mit Angebot vom 20. August, Auftragsbestätigung vom 22. und
 * Rechnung vom 29.:
 *
 * ```
 *   Vorgang 2026-0105 — 3 Eintrag/Einträge
 *          Bindefrist: bis 2026-09-03 — VERFALLEN seit 9 Tag(en)
 *     Stand: zuletzt „rechnung"
 *   Angebote: 2 binden noch, 1 verfallen
 * ```
 *
 * > **Ein abgerechneter Vorgang stand als verfallenes Angebot da** — und die
 * > Schlusszeile zählte ihn mit. Daneben steht der Satz: „Eine Annahme danach
 * > ist ein neues Angebot des Kunden, und der Preis ist neu zu rechnen."
 * > Angewandt auf eine gestellte Rechnung ist das eine Aufforderung, einem
 * > Kunden mitzuteilen, sein Auftrag sei hinfällig.
 *
 * Die Bindefrist ist die Antwort auf eine einzige Frage: *Bindet dieses
 * Angebot noch?* Sobald der Kunde angenommen oder abgesagt hat, ist sie
 * beantwortet — nicht abgelaufen, sondern **erledigt**. Die Zahl „so viele
 * binden noch" ist das, woran der Betreiber abliest, wie viel Geschäft in der
 * Luft ist; wer Angenommenes mitzählt, liest zu viel.
 *
 * @param {object[]} eintraege  die Zeilen **eines** Vorgangs
 * @returns {{offen: boolean, durch: {art: string, zeitpunkt: string}|null}}
 */
export function bindungslage(eintraege = []) {
  /*
   * Gefragt wird nach dem Papier, das die Bindung beendet, und nicht nach dem
   * Stand des Vorgangs: Beides läuft heute gleich, aber der Stand kann sich
   * ändern, ohne dass sich die Antwort auf diese Frage ändert. Die Annahme
   * beendet die Bindefrist — was danach kommt, ändert daran nichts mehr.
   */
  for (const art of ['auftragsbestaetigung', 'absage']) {
    const papier = eintraege.find((e) => e.art === art);
    if (papier) return { offen: false, durch: { art, zeitpunkt: papier.zeitpunkt ?? null } };
  }
  /*
   * Der Fall, den es nicht geben sollte: eine Rechnung ohne
   * Auftragsbestätigung. Die Kette verlangt den Vertragsschluss vor der
   * Rechnung, aber die Akte darf nicht behaupten, ein abgerechneter Vorgang
   * warte noch auf die Annahme — die Rechnung ist der stärkere Beweis.
   */
  const rechnung = eintraege.find((e) => e.art === 'rechnung');
  if (rechnung) return { offen: false, durch: { art: 'rechnung', zeitpunkt: rechnung.zeitpunkt ?? null } };

  return { offen: true, durch: null };
}

/**
 * Welches Papier welches andere **voraussetzt** — und warum.
 *
 * **Der Anlass, 13. September 2026.** Seit gestern nacht kann eine
 * Auftragsbestätigung überhaupt entstehen; bis dahin schnitt `bin/vorgang.mjs`
 * die Bankfelder ab, und der Vertragsschluss war unerreichbar. Damit wird
 * erst jetzt prüfbar, was die Runde davor als offen benannt hat:
 *
 * > **`vorgangsstand` nimmt den höchsten erreichten Schritt und sieht nicht
 * > nach, ob die davor belegt sind.** Ein Vorgang mit Angebot und
 * > Lieferantenbestellung, aber ohne Auftragsbestätigung, steht in der Akte
 * > als „zuletzt: lieferantenbestellung, als Nächstes: die Lieferung" — also
 * > auf Kurs.
 *
 * Er ist es nicht. Nach AGB Punkt 2 entsteht der Vertrag **mit der
 * Auftragsbestätigung**; ohne sie ist Ware beim Lieferanten bestellt, ohne
 * dass ein Kunde gebunden wäre. Gate 20 verlangt dafür zusätzlich den
 * Zahlungseingang, und wer soll gezahlt haben, wenn niemand angenommen hat?
 *
 * Die Liste ist **kurz und begründet** und keine Ableitung aus der
 * Schrittfolge. Das hat einen Grund: Ein fehlendes **Angebot** ist kein
 * Mangel. Nach AGB Punkt 2 ist die Bestellung des Kunden das Angebot, und die
 * Auftragsbestätigung nimmt es an — wer über die Kasse bestellt, braucht kein
 * Papier dieses Hauses davor. Wer aus der Schrittfolge eine Pflichtkette
 * machte, meldete diesen normalen Weg als Lücke.
 */
export const VORAUSGESETZT = Object.freeze([
  Object.freeze({
    papier: 'lieferantenbestellung',
    braucht: 'auftragsbestaetigung',
    warum: 'Ohne Vertragsschluss ist Ware beim Lieferanten bestellt, an die kein Kunde '
      + 'gebunden ist (AGB Punkt 2). Gate 20 löst erst nach Zahlungseingang aus — und wer '
      + 'zahlt, bevor er angenommen hat?',
  }),
  Object.freeze({
    papier: 'rechnung',
    braucht: 'auftragsbestaetigung',
    warum: 'Eine Rechnung über etwas, dem niemand zugestimmt hat. Der Vertrag entsteht mit '
      + 'der Auftragsbestätigung (AGB Punkt 2); fehlt sie, steht in der Akte ein Entgelt '
      + 'ohne die Vereinbarung, aus der es folgt.',
  }),
]);

/**
 * Die Papiere, deren Voraussetzung in dieser Akte fehlt.
 *
 * Gelesen werden **Arten**, kein Inhalt. Gemeldet wird nicht, was der Betrieb
 * hätte tun sollen — sondern was in der Aufzeichnung nicht zusammenpasst.
 *
 * @param {object[]} eintraege  die Zeilen **eines** Vorgangs
 */
export function luecken(eintraege = [], register = VORAUSGESETZT) {
  const arten = new Set(eintraege.map((e) => e.art));
  return register
    .filter((v) => arten.has(v.papier) && !arten.has(v.braucht))
    .map((v) => ({ ...v }));
}
