/**
 * Was eine Maschine findet, wenn sie heute kommt — die vier Regeln einzeln.
 *
 * Jede Regel dieses Moduls muss hier **feuern**. `npm run pruefe-regeln` hält
 * das nach und sagt dazu den Satz, um den es geht: *Eine Regel, die nie
 * gefeuert hat, ist kein Prüfsatz, sondern ein Vorsatz.*
 *
 * Die Seiten sind deshalb von Hand gebaut und nicht aus `ausgabe/` gelesen:
 * Dort steht der Bestand von heute, und der kennt zwei der vier Fälle nicht —
 * es gibt keinen Preis ohne Gültigkeit und keine zwei Grenzen. Ein Test gegen
 * den Bestand prüfte, was zufällig gerade dasteht.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  angebotsbefund, angebotsseitenbefund, ablaufsatz, VORWARNUNG_TAGE,
} from '../src/angebotsgueltigkeit.js';

const HEUTE = '2026-10-22';

/** Eine Artikelseite, wie der Bau sie schreibt — auf das Nötige gekürzt. */
function seite({ preis = '23.25', gueltigBis = null, alter = null, grenze = 90 }) {
  const angebot = gueltigBis === null
    ? `{"@type":"Offer","price":"${preis}"}`
    : `{"@type":"Offer","price":"${preis}","priceValidUntil":"${gueltigBis}"}`;
  const satz = alter === null ? ''
    : `<br><span class="preis-ueberholt" data-alter="${alter}" data-grenze="${grenze}">`
      + `<strong>Diese Grundlage ist ${alter} Tage alt</strong> und damit älter als die `
      + `selbst gesetzte Grenze von ${grenze} Tagen.</span>`;
  return `<html><script type="application/ld+json">${angebot}</script><p>${satz}</p></html>`;
}

test('eine gültige Auszeichnung ohne Überholt-Satz ist in Ordnung', () => {
  const e = angebotsbefund([{ name: 'a.html', inhalt: seite({ gueltigBis: '2026-11-15' }) }], HEUTE);
  assert.equal(e.sauber, true);
  assert.equal(e.abgelaufen, 0);
  assert.equal(e.mitPreis, 1);
});

test('eine abgelaufene Auszeichnung mit Überholt-Satz ist in Ordnung', () => {
  // Der Zustand des Bestands am 22. Oktober, 24 Mal: Preisstand vom 25. Juni,
  // Gültigkeit am 23. September abgelaufen, und die Seite sagt es im Klartext.
  const e = angebotsbefund([{
    name: 'b.html', inhalt: seite({ gueltigBis: '2026-09-23', alter: 119 }),
  }], HEUTE);
  assert.equal(e.sauber, true, JSON.stringify(e.probleme));
  assert.equal(e.abgelaufen, 1);
  assert.equal(e.nenntUeberholt, 1);
});

/* ------------------------------------------------------------------ *
 * Die vier Regeln, jede einmal gefeuert
 * ------------------------------------------------------------------ */

test('preis-ohne-gueltigkeit feuert', () => {
  const e = angebotsbefund([{ name: 'c.html', inhalt: seite({ gueltigBis: null }) }], HEUTE);
  assert.equal(e.probleme.length, 1);
  assert.equal(e.probleme[0].regel, 'preis-ohne-gueltigkeit');
  assert.match(e.probleme[0].satz, /ohne Gültigkeit kann eine Maschine nicht sagen/);
});

test('auszeichnung-abgelaufen-ohne-satz feuert', () => {
  // Die Maschine erfährt mehr als der Mensch: Der Crawler liest ein
  // abgelaufenes Angebot, der Leser der Seite erfährt nichts davon.
  const e = angebotsbefund([{
    name: 'd.html', inhalt: seite({ gueltigBis: '2026-08-24' }),
  }], HEUTE);
  assert.equal(e.probleme.length, 1);
  assert.equal(e.probleme[0].regel, 'auszeichnung-abgelaufen-ohne-satz');
  assert.match(e.probleme[0].satz, /59 Tage zurück/);
});

test('satz-ohne-abgelaufene-auszeichnung feuert', () => {
  // Die Gegenrichtung und der gefährlichere Fall — genau das, was eine
  // überdehnte Frist erzeugt: Die Seite nennt die Grundlage überholt, die
  // Auszeichnung meldet der Maschine ein gültiges Angebot.
  const e = angebotsbefund([{
    name: 'e.html', inhalt: seite({ gueltigBis: '2036-06-25', alter: 119 }),
  }], HEUTE);
  assert.ok(e.probleme.some((p) => p.regel === 'satz-ohne-abgelaufene-auszeichnung'),
    JSON.stringify(e.probleme));
  assert.match(e.probleme.map((p) => p.satz).join(' '), /der Mensch erfährt mehr als die Maschine/);
});

test('zwei-grenzen feuert', () => {
  /*
   * Der Satz nennt eine Grenze von 60 Tagen, die Auszeichnung ist aus 90
   * gerechnet: Preisstand plus 90 ergibt den 23. September, das genannte
   * Alter ist 119 Tage. Aus Gültigkeitsdatum und Alter folgt die Grenze,
   * und sie muss die genannte sein — sonst stehen zwei Grenzen im Haus.
   */
  const e = angebotsbefund([{
    name: 'f.html', inhalt: seite({ gueltigBis: '2026-09-23', alter: 119, grenze: 60 }),
  }], HEUTE);
  assert.ok(e.probleme.some((p) => p.regel === 'zwei-grenzen'), JSON.stringify(e.probleme));
  assert.match(e.probleme.find((p) => p.regel === 'zwei-grenzen').satz, /60 Tagen.*folgt 90/);
});

/* ------------------------------------------------------------------ *
 * Die Zählung und der Satz an den Auftraggeber
 * ------------------------------------------------------------------ */

test('der Marker wird gelesen, nicht die Prosa', () => {
  // **Der Fund vom 22. Oktober.** Das erste Muster suchte den Satz wörtlich
  // und zählte null Treffer bei 24 abgelaufenen Angeboten: Im HTML steht
  // `<strong>Diese Grundlage ist 119 Tage alt</strong> und damit älter …`.
  // Hier steht die Auszeichnung mitten im Satz und muss trotzdem erkannt
  // werden.
  const b = angebotsseitenbefund('g.html', seite({ gueltigBis: '2026-09-23', alter: 119 }), HEUTE);
  assert.equal(b.nenntUeberholt, true);
  assert.equal(b.genannteTage, 119);
  assert.equal(b.genannteGrenze, 90);
});

test('ein Ablauf heute gilt noch', () => {
  // Gleichstand: Wer am letzten Gültigkeitstag kommt, bekommt ein gültiges
  // Angebot. Ein `<=` hier wäre derselbe Fehler, den
  // `referenzwert-schon-bei-gleichstand` an der Messwertgrenze festhält.
  const b = angebotsseitenbefund('h.html', seite({ gueltigBis: HEUTE }), HEUTE);
  assert.equal(b.abgelaufen, false);
  assert.equal(b.tageBisAblauf, 0);
  assert.equal(b.laeuftBald, true);
});

test('die Vorwarnung greift innerhalb der Frist und nicht darüber', () => {
  const knapp = angebotsseitenbefund('i.html', seite({ gueltigBis: '2026-11-05' }), HEUTE);
  const weit = angebotsseitenbefund('j.html', seite({ gueltigBis: '2026-11-06' }), HEUTE);
  assert.equal(knapp.tageBisAblauf, VORWARNUNG_TAGE);
  assert.equal(knapp.laeuftBald, true);
  assert.equal(weit.laeuftBald, false, 'einen Tag über der Frist ist keine Vorwarnung');
});

test('der Satz an den Auftraggeber nennt die Folge, nicht die Aufgabe', () => {
  const e = angebotsbefund([
    { name: 'a.html', inhalt: seite({ gueltigBis: '2026-08-24' }) },
    { name: 'b.html', inhalt: seite({ gueltigBis: '2026-10-25' }) },
  ], HEUTE);
  const satz = ablaufsatz(e);
  assert.match(satz, /1 von 2/);
  assert.match(satz, /ist das kein Angebot/);
  // Die Folge für genau die Frage des Auftraggebers — ohne sie wird die
  // Aufgabe verschoben.
  assert.match(satz, /„was kostet das" bleibt bei diesem Shop unbeantwortet/);
  assert.match(satz, /1 weitere laufen in den nächsten 14 Tagen ab|laufen in den nächsten/);
  // Und der Weg: Keine Bauanweisung, sondern die einzige Quelle, die hilft.
  assert.match(satz, /aktuelle Preisliste des Lieferanten/);
});

test('ohne Ablauf meldet der Satz den nächsten Termin', () => {
  const e = angebotsbefund([{ name: 'a.html', inhalt: seite({ gueltigBis: '2026-12-31' }) }], HEUTE);
  assert.match(ablaufsatz(e), /Alle 1 ausgezeichneten Angebote gelten/);
  assert.match(ablaufsatz(e), /2026-12-31/);
});
