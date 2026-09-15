/**
 * Die Belege durchsehen, die der Kunde bekommt.
 *
 * **Warum es diese Datei gibt.** Am 1. September habe ich eine erzeugte
 * Rechnung zum ersten Mal von oben nach unten gelesen — nicht als Testfall,
 * sondern als Kunde. Sie nannte 1.638,48 € Gesamtbetrag und schwieg darüber,
 * ob dieses Geld noch zu zahlen ist. Nach Punkt 9 der eigenen AGB ist es das
 * nie: Das Zahlungsziel ist null Tage, und im Ablauf steht die Rechnung nach
 * der Lieferung. Die Buchhaltung des Kunden hätte ein zweites Mal überwiesen.
 *
 * Gefunden hat das kein Prüfer, weil keiner hinsah:
 *
 * | Prüfer | liest |
 * | --- | --- |
 * | `pruefe-inhalte` | `inhalte/` und die gebauten Seiten |
 * | `pruefe-seiten` | die gebauten Seiten |
 * | `pruefe-widerrufe` | den **Quelltext** von `src/`, `bin/`, `inhalte/`, `docs/` |
 *
 * > **Der Beleg ist das einzige Kundendokument, das erst im Betrieb
 * > entsteht.** Ein Prüfer, der Quelltext liest, sieht die Bausteine; was aus
 * > ihnen zusammengesetzt beim Kunden ankommt, sieht er nicht.
 *
 * Also wird hier der **fertige Text** geprüft — genau der, der in den
 * Briefumschlag geht. Zwei Regeln, beide aus dem Befund:
 *
 *   1. **Kein Betrag ohne Zustand.** Wer eine Endsumme nennt, muss sagen, ob
 *      sie noch zu zahlen oder schon bezahlt ist. Ein Angebot sagt die
 *      Bedingung, eine Rechnung den Vermerk.
 *   2. **Kein widerrufener Satz.** Dieselbe Prüfung wie überall — aber ohne
 *      die Ausnahme „Widerruf in Sichtweite". Ein Beleg hat keine Fußnoten;
 *      was auf ihm steht, gilt.
 */

import { findeWiderrufe } from './widerruf.js';
import { EINHEITEN } from './format.js';
import { ZAHLUNGSBEDINGUNGEN, AGB_GLIEDERUNG, AGB_VERWEISE } from './rechtstexte.js';

/** Die Zeile, die eine Endsumme ausweist. */
export const SUMMENZEILE = /^Gesamtbetrag\s+[\d.,]+\s*€/m;

/**
 * Woran erkennt man, dass ein Beleg den Zustand seines Betrags nennt?
 *
 * Absichtlich mehrere Formulierungen je Belegart, nicht eine: Der Prüfer soll
 * die **Aussage** finden und nicht den Wortlaut, sonst steht er in einem Jahr
 * wieder da, wo das Frachtmuster am 27. August stand.
 */
export const ZUSTANDSAUSSAGE = Object.freeze({
  Angebot: /Zahlungsbedingung:|Zahlung bei Bestellung|Tage netto/,
  Auftragsbestätigung: /Zahlbar (?:sofort|innerhalb)/,
  Rechnung: /Bereits bezahlt|Zahlbar innerhalb|nicht (?:noch einmal |mehr )?überweisen/,
  // Die Anfrage nennt keine Endsumme zum Zahlen, sondern einen Preisstand.
  // Sie steht hier trotzdem, weil sie beim Kunden landet und damit unter die
  // zweite Regel fällt — und weil eine Belegart ohne Eintrag gemeldet wird.
  Kundenanfrage: /UNVERBINDLICHE ANFRAGE|keine Bestellung/,
  // Der Auftrag an den Rechtstexteanbieter nennt keine Endsumme, sondern
  // einen Umfang. Er steht hier, weil er hinausgeht — und weil eine
  // Belegart ohne Eintrag gemeldet wird.
  Rechtstexteauftrag: /Angebot für|Einen Wortlaut erwarten wir von Ihnen/,
  // Der Bestelltext geht an den Lieferanten, nicht an den Kunden. Er steht
  // hier trotzdem: Ein Außentext ist ein Außentext, und die zweite und dritte
  // Regel gelten für ihn wortgleich. Die Endsumme darauf ist der Einkauf und
  // keine Forderung an den Empfänger — die Zustandsaussage bezieht sich
  // deshalb auf den **Termin**, der bestellt sein muss.
  Lieferantenbestellung: /Gewünschte Lieferzeit:/,
});

/**
 * Eine Zeile, die nur aus einer Beschriftung und einem Doppelpunkt besteht.
 *
 * **Befund vom 1. September, zweiter Teil.** Der Bestelltext an den
 * Lieferanten ging ohne Telefonnummer hinaus mit der Zeile
 * `Ansprechpartner vor Ort:` — leer. Eine leere Angabe liest sich nicht als
 * Lücke, sondern als **Auskunft**: es gibt keinen. Die Spedition fährt
 * daraufhin trotzdem, findet eine verschlossene Baustelle, und die Ware geht
 * auf Kosten des Bestellers retour.
 *
 * Nicht jede solche Zeile ist falsch: `Lieferadresse (Baustelle):` ist eine
 * **Blocküberschrift**, ihr Wert steht eingerückt darunter. Der Unterschied
 * ist die Einrückung der nächsten Zeile mit Inhalt, und genau daran wird er
 * festgemacht — nicht an einer Liste erlaubter Beschriftungen, die niemand
 * pflegt.
 *
 * *Berichtigt beim ersten Lauf:* Die erste Fassung sah nur auf die unmittelbar
 * folgende Zeile und meldete deshalb „…an den unten genannten Endkunden:" —
 * einen Satz, dessen Aufzählung nach einer Leerzeile beginnt. Leerzeilen
 * werden jetzt übersprungen. Ein Prüfer, der bei der ersten Leerzeile aufgibt,
 * meldet die Absatzgestaltung als Fehler.
 */
export function leereAngaben(text) {
  const zeilen = text.split('\n');
  const treffer = [];
  for (const [i, zeile] of zeilen.entries()) {
    const m = /^(\s*)(\S.*?):[ \t]*$/.exec(zeile);
    if (!m) continue;
    const naechste = zeilen.slice(i + 1).find((z) => z.trim() !== '') ?? '';
    const tieferEingerueckt = naechste !== '' && /^\s*/.exec(naechste)[0].length > m[1].length;
    if (!tieferEingerueckt) treffer.push({ zeile: i + 1, beschriftung: m[2].trim() });
  }
  return treffer;
}

/**
 * Ein einzelner Beleg.
 * @param {{art: string, text: string}} beleg
 */
export function pruefeBeleg({ art, text, mussEnthalten = [] }) {
  const meldungen = [];

  // **Was geprüft wurde, muss auch dastehen.**
  //
  // Der Befund vom 2. September: `pruefeRechnungsmerkmale` prüft die
  // **Eingaben** eines Belegs, `pruefeBeleg` den **Text** — und niemand hielt
  // beides gegeneinander. Die Rechnung galt als vollständig nach § 11 UStG,
  // während im gedruckten Beleg die Anschrift des Ausstellers fehlte. Beide
  // Prüfungen waren grün und meinten verschiedene Dinge.
  //
  // Leere Werte stehen hier nicht: Eine fehlende Angabe ist im Text schon als
  // sichtbare Lücke markiert, und zweimal dasselbe zu melden macht keine
  // Meldung besser.
  for (const { was, wert } of mussEnthalten) {
    if (!wert || String(wert).trim() === '') continue;
    if (!text.includes(String(wert).trim())) {
      meldungen.push({
        regel: 'geprueft-aber-nicht-gedruckt',
        text: `${was} ist geprüft, steht aber nicht im Beleg: „${String(wert).trim()}"`,
      });
    }
  }
  const musterFuerArt = ZUSTANDSAUSSAGE[art];

  if (musterFuerArt === undefined) {
    // Eine neue Belegart ohne Eintrag darf nicht stillschweigend durchlaufen.
    // Sonst ist die Lücke wieder genau dort, wo sie schon einmal war.
    meldungen.push({
      regel: 'belegart-unbekannt',
      text: `Belegart „${art}" ist in ZUSTANDSAUSSAGE nicht eingetragen — ungeprüft`,
    });
  } else if (SUMMENZEILE.test(text) && !musterFuerArt.test(text)) {
    meldungen.push({
      regel: 'betrag-ohne-zustand',
      text: 'Nennt eine Endsumme, sagt aber nicht, ob sie zu zahlen oder bezahlt ist',
    });
  }

  for (const l of leereAngaben(text)) {
    meldungen.push({
      regel: 'leere-angabe',
      zeile: l.zeile,
      text: `„${l.beschriftung}:" steht ohne Wert da — das liest sich als Auskunft, nicht als Lücke`,
    });
  }

  // Sichtweite 0: Auf einem Beleg gibt es keinen Platz, den Widerruf
  // danebenzuschreiben — der Satz muss weg, nicht erläutert werden.
  for (const fund of findeWiderrufe(text, { sichtweite: 0, kopfzeilen: 0 })) {
    meldungen.push({
      regel: 'widerrufene-aussage',
      zeile: fund.zeile,
      text: `„${fund.fundstelle}" — widerrufen ${fund.eintrag.widerrufenAm} (${fund.eintrag.belegt})`,
    });
  }

  for (const fund of roheEinheiten(text)) {
    meldungen.push({
      regel: 'kuerzel-statt-wort',
      zeile: fund.zeile,
      text: `„${fund.fundstelle}" — Kürzel des Lieferanten in der Mengenspalte, `
        + `lesbar wäre „${fund.menge} ${EINHEITEN[fund.kuerzel]}"`,
    });
  }

  return { art, meldungen, sauber: meldungen.length === 0 };
}

/* ------------------------------------------------------------------ *
 * Kürzel des Lieferanten in der Mengenspalte — 5. September 2026
 *
 * Der Anfragetext, den `bin/belegpruefung.mjs` prüfte, sah so aus:
 *
 * ```
 * 500 KG        Capatect Klebe- und Spachtelmasse 186 M 25 kg
 * 6 KRT         Capatect Universaldübel Schraubdübel …
 * ```
 *
 * `baueKundenanfrage` nahm die Einheitentafel als **Aufrufparameter mit
 * Vorgabewert `{}`**. Die Oberfläche reichte sie herein, der Prüfer nicht —
 * also las der einzige Prüfer über diesen Text eine Fassung, die es beim
 * Kunden nie gab, und keine Regel konnte anschlagen.
 *
 * > **Ein Prüfer, der eine andere Fassung liest als der Empfänger, prüft ein
 * > Dokument, das niemand bekommt.**
 *
 * Gesucht wird eng: eine Zeile, die mit einer Zahl beginnt, darauf ein
 * Kürzel aus `EINHEITEN` und dahinter Spaltenabstand oder Zeilenende. Die
 * Artikelnamen selbst tragen Kürzel („100 STK, 1 KAR" steht im Namen eines
 * Dübelkartons) — dort folgt ein Komma, und dort gehören sie hin: Der Name
 * kommt vom Lieferanten und wird nicht umgeschrieben.
 * ------------------------------------------------------------------ */

const KUERZELZEILE = new RegExp(
  `^\\s*(\\d+(?:[.,]\\d+)?)\\s(${Object.keys(EINHEITEN).join('|')})(?=\\s\\s|\\s*$)`,
);

/** Findet Mengenzeilen, die das Kürzel statt des Wortes tragen. */
export function roheEinheiten(text) {
  const funde = [];
  String(text ?? '').split(/\r?\n/).forEach((zeile, i) => {
    const t = zeile.match(KUERZELZEILE);
    if (t) funde.push({ zeile: i + 1, menge: t[1], kuerzel: t[2], fundstelle: `${t[1]} ${t[2]}` });
  });
  return funde;
}

/**
 * Was dem Kunden verrechnet wird, muss beim Lieferanten bestellt sein.
 *
 * **Der Befund vom 2. September.** Der Warenkorb rechnete je palettierter
 * Position 7,50 € Kranentladung und wies sie dem Kunden aus. Die Bestellung
 * an den Lieferanten sagte davon nichts. Der Lastwagen wäre ohne Kran
 * gekommen, und der Kunde hätte für zwei Hübe bezahlt, die niemand bestellt
 * hat.
 *
 * > **Verrechnet und nicht bestellt ist eine Rechnung über nichts.**
 *
 * Dieselbe Familie wie der Liefertermin, der bis zum 1. September nur auf der
 * Auftragsbestätigung stand und beim Lieferanten nie angefordert wurde. Der
 * Unterschied: Ein Termin, den niemand bestellt hat, ist eine Hoffnung — eine
 * Leistung, die niemand bestellt hat, ist bezahlt und kommt nicht.
 *
 * Geprüft wird über **beide** Belege hinweg, weil der Fehler zwischen ihnen
 * liegt. Jeder für sich war in Ordnung.
 */
export const VERRECHNET_UND_BESTELLT = Object.freeze([
  Object.freeze({
    id: 'kranentladung',
    was: 'Kranentladung je Hub',
    // Auf dem Kundenbeleg: „Pauschale plus 2× Kranentladung".
    verrechnet: /(\d+)×\s*Kranentladung/,
    bestellt: /mit Kranentladung zustellen\s+—\s+(\d+)\s+palettierte/,
    beiWem: 'Lieferantenbestellung',
    warum: 'Der Kunde zahlt je Hub. Ohne Anforderung kommt der Lastwagen ohne Kran, '
      + 'und die Palette steht auf der Ladefläche.',
  }),
]);

/** Die Belegart, die eine verrechnete Leistung bestellen muss. */
function findeBeleg(belege, art) {
  return belege.find((b) => b.art === art);
}

/**
 * Hält die Kundenbelege gegen die Lieferantenbestellung.
 *
 * @param {{art: string, text: string}[]} belege
 * @returns {{regel: string, text: string}[]}
 */
export function pruefeVerrechnetUndBestellt(belege, register = VERRECHNET_UND_BESTELLT) {
  const meldungen = [];
  for (const eintrag of register) {
    const ziel = findeBeleg(belege, eintrag.beiWem);
    // Kein Zielbeleg im Durchlauf heißt: Diese Regel ist hier nicht prüfbar.
    // Das wird gesagt und nicht verschwiegen — sonst sieht ein halber Lauf
    // aus wie ein ganzer.
    let hoechste = 0;
    let quelle = null;
    for (const b of belege) {
      if (b.art === eintrag.beiWem) continue;
      const t = eintrag.verrechnet.exec(b.text);
      if (t && Number(t[1]) > hoechste) { hoechste = Number(t[1]); quelle = b.art; }
    }
    if (hoechste === 0) continue;
    if (!ziel) {
      meldungen.push({
        regel: 'verrechnet-ohne-beleg',
        text: `${eintrag.was} steht auf ${quelle}, aber in diesem Durchlauf gibt es keine `
          + `${eintrag.beiWem} — die Regel ist hier nicht prüfbar`,
      });
      continue;
    }
    const b = eintrag.bestellt.exec(ziel.text);
    if (!b) {
      meldungen.push({
        regel: 'verrechnet-nicht-bestellt',
        text: `${eintrag.was} ist auf ${quelle} verrechnet (${hoechste}×), aber in der `
          + `${eintrag.beiWem} nicht bestellt — ${eintrag.warum}`,
      });
    } else if (Number(b[1]) !== hoechste) {
      meldungen.push({
        regel: 'verrechnet-anders-bestellt',
        text: `${eintrag.was}: ${hoechste}× verrechnet, ${Number(b[1])}× bestellt`,
      });
    }
  }
  return meldungen;
}

/**
 * Hält jede Punkt-Nennung eines Außentextes gegen die Gliederung der AGB.
 *
 * Drei Richtungen, und die dritte ist die, die man vergisst:
 *
 * 1. Ein Beleg zitiert einen Punkt, den das Register nicht führt — dann hat
 *    ihn niemand gegen die Gliederung gehalten.
 * 2. Ein geführter Punkt gibt es nicht mehr, oder er heißt anders — dann
 *    zeigt der Verweis auf dem Kundenbeleg auf eine fremde Klausel.
 * 3. Ein geführter Punkt kommt in keinem Beleg mehr vor — dann ist der
 *    Eintrag stehengeblieben und bewacht nichts. **Nur bei einem vollständigen
 *    Durchlauf**: Über einer Teilmenge der Belege sagt das Fehlen nichts, und
 *    ein Prüfer, der bei jedem Ausschnitt rot wird, wird abgeschaltet.
 *
 * @param {{art: string, text: string}[]} belege
 * @param {{nr: number, titel: string}[]} gliederung
 * @param {{nr: number, erwartetImTitel: string}[]} register
 */
export function pruefeAgbVerweise(belege, gliederung, register, { vollstaendig = false } = {}) {
  const meldungen = [];
  const genannt = new Map();
  for (const b of belege) {
    for (const t of String(b.text).matchAll(/Punkt\s+(\d+)/g)) {
      const nr = Number(t[1]);
      if (!genannt.has(nr)) genannt.set(nr, b.art);
    }
  }

  for (const [nr, art] of genannt) {
    if (!register.some((r) => r.nr === nr)) {
      meldungen.push({
        regel: 'verweis-ohne-eintrag',
        text: `${art} zitiert Punkt ${nr} der AGB — im Verweisregister steht er nicht, `
          + 'also hält ihn niemand gegen die Gliederung',
      });
    }
  }

  for (const r of register) {
    const punkt = gliederung.find((g) => g.nr === r.nr);
    if (!punkt) {
      meldungen.push({
        regel: 'verweis-ins-leere',
        text: `Punkt ${r.nr} (${r.zweck}) steht in keiner Gliederung mehr`,
      });
      continue;
    }
    if (!punkt.titel.toLowerCase().includes(String(r.erwartetImTitel).toLowerCase())) {
      meldungen.push({
        regel: 'verweis-zeigt-woanders',
        text: `Punkt ${r.nr} heißt „${punkt.titel}" und soll ${r.zweck} tragen — `
          + `„${r.erwartetImTitel}" kommt im Titel nicht vor`,
      });
    }
    if (vollstaendig && !genannt.has(r.nr)) {
      meldungen.push({
        regel: 'eintrag-ohne-verweis',
        text: `Punkt ${r.nr} (${r.zweck}) wird in keinem Beleg mehr zitiert — `
          + 'der Eintrag bewacht nichts',
      });
    }
  }
  return meldungen;
}

/**
 * Alle Belege eines Durchlaufs.
 * @param {{art: string, text: string}[]} belege
 */
export function pruefeBelege(belege, { vollstaendig = false } = {}) {
  if (!Array.isArray(belege) || belege.length === 0) {
    throw new Error('Ohne Belege gibt es nichts zu prüfen — ein leerer Durchlauf ist kein grüner.');
  }
  const befunde = belege.map(pruefeBeleg);
  // Der Fehler zwischen zwei Belegen gehört dem Durchlauf, nicht einem
  // einzelnen Beleg. Er wird deshalb dem Zielbeleg zugeschlagen, damit er in
  // derselben Liste erscheint wie alles andere.
  const uebergreifend = [
    ...pruefeVerrechnetUndBestellt(belege),
    ...pruefeAgbVerweise(belege, AGB_GLIEDERUNG, AGB_VERWEISE, { vollstaendig }),
  ];
  if (uebergreifend.length) {
    const ziel = befunde.find((f) => f.art === 'Lieferantenbestellung') ?? befunde[0];
    ziel.meldungen.push(...uebergreifend);
    ziel.sauber = ziel.meldungen.length === 0;
  }
  return {
    befunde,
    geprueft: befunde.length,
    meldungen: befunde.reduce((n, b) => n + b.meldungen.length, 0),
    sauber: befunde.every((b) => b.sauber),
    zielTage: ZAHLUNGSBEDINGUNGEN.zielTage,
  };
}
