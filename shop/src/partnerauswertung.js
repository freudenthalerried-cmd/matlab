/**
 * Auswertungsbogen für die Partnerantworten (Anschreiben B).
 *
 * Der dritte 0-€-Auslöser im Gate-Register — drei bis fünf Partneranfragen,
 * sie entscheiden Preisniveau und Machbarkeit von Gate 9 und 13 — hatte als
 * einziger keine vorab feststehende Auswertung. Gate 17 verlangt sie: Die
 * Regel steht **vor** den Antworten fest, sonst wird nach dem ersten
 * enttäuschenden Rücklauf die Regel passend gebogen statt die Lage erkannt.
 *
 * Die Bedingungen sind aus `partnerangebot-leadvermittlung.md` übernommen,
 * nicht erfunden. Zwei sind Ausschlussfragen, keine Nebenfragen:
 *
 * **Die namentliche Nennung.** Ohne sie ist die Einwilligung des Interessenten
 * unwirksam und die ganze Bauform der Gebietsexklusivität fällt. Und die
 * Fristenlösung (Ersatzbetrieb im Einwilligungstext, Weg 1) braucht **zwei**
 * genannte Betriebe — deshalb ist die Machbarkeitsregel der Runde: mindestens
 * zwei Zustimmungen, nicht eine.
 *
 * **Die leistungsgebundene Exklusivität.** Ein Partner, der Exklusivität ohne
 * Leistungsbindung verlangt, könnte einen ganzen Bezirk stilllegen.
 */

/** Preisband Stufe A aus dem Partnerangebot: je qualifizierter Anfrage. */
export const PREISBAND_STUFE_A = Object.freeze({ von: 100, bis: 250 });

/** Was jede Partnerantwort erfüllen muss. Reihenfolge wie im Angebot. */
export const PARTNER_BEDINGUNGEN = [
  {
    id: 'nennung',
    text: 'Namentliche Nennung im Einwilligungstext akzeptiert — Ausschlussfrage, ohne sie ist die Einwilligung unwirksam',
    pruefe: (a) => a.namentlicheNennung === true,
  },
  {
    id: 'leadpreis',
    text: `Leadpreis beziffert und mindestens ${PREISBAND_STUFE_A.von} € je qualifizierter Anfrage`,
    pruefe: (a) => typeof a.leadpreis === 'number' && a.leadpreis >= PREISBAND_STUFE_A.von,
  },
  {
    id: 'frist',
    text: 'Rückmeldefrist 24 Stunden an Werktagen akzeptiert',
    pruefe: (a) => a.rueckmeldefrist24h === true,
  },
  {
    id: 'exklusivitaet',
    text: 'Exklusivität leistungsgebunden akzeptiert — sie gilt, solange Frist und Abrechnung eingehalten werden',
    pruefe: (a) => a.exklusivitaetLeistungsgebunden === true,
  },
];

/**
 * Wertet eine einzelne Partnerantwort aus.
 *
 * Unbeantwortete Punkte gelten als **nicht erfüllt** — wie beim
 * Herstellerbogen: Ein Betrieb, der zur Nennung nichts sagt, hat ihr nicht
 * zugestimmt.
 *
 * `feuchteArbeiten` ist bewusst **keine** Bedingung, sondern ein Merkmal: Ein
 * Partner ohne Feuchte- und Abdichtungsarbeiten kann Partner sein — aber die
 * Runde weist aus, wie viel Gruppe-C-Reichweite das Netz abdeckt (Gate 12).
 */
export function wertePartnerAus(antwort) {
  if (!antwort?.betrieb) throw new Error('Jede Antwort braucht einen Betrieb');
  if (!antwort?.bezirk) throw new Error('Jede Antwort braucht einen Bezirk (Gate 13: Gebietseinheit)');

  const geprueft = PARTNER_BEDINGUNGEN.map((b) => ({
    id: b.id,
    text: b.text,
    erfuellt: b.pruefe(antwort) === true,
  }));

  return {
    betrieb: antwort.betrieb,
    bezirk: antwort.bezirk,
    beziffert: typeof antwort.leadpreis === 'number',
    leadpreis: typeof antwort.leadpreis === 'number' ? antwort.leadpreis : null,
    feuchteArbeiten: antwort.feuchteArbeiten === true,
    bedingungen: geprueft,
    erfuellt: geprueft.filter((g) => g.erfuellt).length,
    bestanden: geprueft.every((g) => g.erfuellt),
    fehlend: geprueft.filter((g) => !g.erfuellt).map((g) => g.text),
  };
}

/**
 * Wertet die Runde aus — drei bis fünf Antworten, zwei Fragen.
 *
 * **Machbarkeit (Gate 9):** mindestens **zwei** Betriebe stimmen der
 * namentlichen Nennung zu und bestehen insgesamt. Zwei, weil die
 * Fristenlösung je Bezirk einen Partner und einen genannten Ersatzbetrieb
 * braucht; eine einzelne Zustimmung belegt die Bauform nicht.
 *
 * **Preisniveau (Gate 9, Stufe A):** Von den Bestandenen zählt der
 * **zweithöchste** bezifferte Leadpreis als tragend — dieselbe Regel wie beim
 * Herstellerbogen: nicht der beste Einzelfall trägt die Planung, sondern der
 * zweite, der ihn bestätigt.
 */
export function wertePartnerrundeAus(antworten) {
  const einzeln = antworten.map(wertePartnerAus);
  const bestanden = einzeln.filter((e) => e.bestanden);
  const nennungen = einzeln.filter((e) => e.bedingungen.find((b) => b.id === 'nennung').erfuellt);

  const ergebnis = {
    antworten: einzeln.length,
    bestanden: bestanden.length,
    nennungen: nennungen.length,
    machbar: bestanden.length >= 2,
    mitFeuchteArbeiten: einzeln.filter((e) => e.feuchteArbeiten).length,
    einzeln,
  };

  if (!ergebnis.machbar) {
    ergebnis.grund =
      nennungen.length < 2
        ? 'Weniger als zwei Betriebe akzeptieren die namentliche Nennung — die Bauform der Gebietsexklusivität ist nicht belegt (Ersatzbetrieb braucht einen zweiten Namen)'
        : 'Weniger als zwei Betriebe bestehen alle Bedingungen';
    return ergebnis;
  }

  const preise = bestanden.map((e) => e.leadpreis).sort((a, b) => b - a);
  ergebnis.tragenderLeadpreis = preise[1];
  ergebnis.imPreisband =
    ergebnis.tragenderLeadpreis >= PREISBAND_STUFE_A.von && ergebnis.tragenderLeadpreis <= PREISBAND_STUFE_A.bis;

  return ergebnis;
}

/** Die Felder, die eine Partnerantwort ausfüllen muss — gegen das Vergessen und das Erfinden. */
export const PARTNER_BOGEN = [
  { feld: 'betrieb', frage: 'Name des Betriebs', pflicht: true },
  { feld: 'bezirk', frage: 'Politischer Bezirk (Gebietseinheit nach Gate 13)', pflicht: true },
  { feld: 'gewerke', frage: 'Angebotene Gewerke', pflicht: false },
  { feld: 'feuchteArbeiten', frage: 'Feuchte- und Abdichtungsarbeiten ohne Radonbezug? (ja/nein)', pflicht: true },
  { feld: 'namentlicheNennung', frage: 'Namentliche Nennung im Einwilligungstext akzeptiert? (ja/nein)', pflicht: true },
  { feld: 'leadpreis', frage: 'Leadpreis je qualifizierter Anfrage in Euro', pflicht: true },
  { feld: 'rueckmeldefrist24h', frage: 'Rückmeldefrist 24 Stunden akzeptiert? (ja/nein)', pflicht: true },
  { feld: 'exklusivitaetLeistungsgebunden', frage: 'Leistungsgebundene Exklusivität akzeptiert? (ja/nein)', pflicht: true },
  { feld: 'kapazitaetProMonat', frage: 'Aufnahmefähige Anfragen je Monat', pflicht: false },
  { feld: 'mindestauftragswert', frage: 'Mindestauftragswert des Betriebs in Euro', pflicht: false },
];

/** Prüft, ob ein Eintrag alle Pflichtfelder trägt. */
export function pruefePartnerbogen(antwort = {}) {
  const fehlend = PARTNER_BOGEN.filter(
    (f) => f.pflicht && (antwort[f.feld] === undefined || antwort[f.feld] === null),
  ).map((f) => f.frage);
  return { vollstaendig: fehlend.length === 0, fehlend };
}
