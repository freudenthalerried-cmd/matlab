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
