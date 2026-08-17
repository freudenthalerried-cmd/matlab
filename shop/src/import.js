/**
 * Import von Lieferanten-Preislisten.
 *
 * Gate 6 nennt die Bestellübergabe den Bruchpunkt des Modells. Der Import ist
 * der zweite: Wenn eine neue Preisliste von Hand in den Katalog getippt werden
 * muss, ist der Shop genau so lange aktuell, wie jemand Zeit hat. Deshalb liest
 * diese Datei die Liste, prüft sie und meldet, was sich geändert hat.
 *
 * Bewusst tolerant beim Format — Hersteller liefern, was ihr System hergibt —
 * und bewusst streng bei den Werten: Was nicht eindeutig ist, wird abgewiesen
 * statt geraten. Ein falsch geratener Einkaufspreis fällt erst bei der
 * Jahresabrechnung auf.
 */

import { MARGENUNTERGRENZE, cent, einkaufspreis, verkaufspreis, rohmarge } from './preis.js';

const PFLICHTSPALTEN = ['sku', 'bezeichnung'];

/** Zahl aus deutscher oder englischer Schreibweise. Leer bleibt leer. */
export function zahl(roh) {
  if (roh == null) return null;
  const s = String(roh).trim().replace(/\s|€/g, '');
  if (s === '') return null;

  // `1.234` kann 1234 bedeuten (deutsche Tausendergruppe) oder 1,234
  // (englische Dezimalzahl mit drei Stellen). Eindeutig ist das nicht — und
  // die Kopfzeile dieser Datei verspricht: abweisen statt raten. Ein
  // geratener Einkaufspreis wäre um den Faktor 1.000 falsch und fiele erst
  // bei der Jahresabrechnung auf. `0,500` bleibt lesbar: Eine Tausendergruppe
  // beginnt nie mit einer einzelnen Null, die Lesart ist eindeutig deutsch.
  if (/^[1-9]\d{0,2}[.,]\d{3}$/.test(s)) return NaN;

  // 1.234,56 → 1234.56   |   1,234.56 → 1234.56   |   1234.56 → 1234.56
  const normalisiert =
    s.includes(',') && s.lastIndexOf(',') > s.lastIndexOf('.')
      ? s.replaceAll('.', '').replace(',', '.')
      : s.replaceAll(',', '');
  const n = Number(normalisiert);
  return Number.isFinite(n) ? n : NaN;
}

export function jaNein(roh) {
  const s = String(roh ?? '').trim().toLowerCase();
  return ['ja', 'j', 'true', '1', 'x', 'yes'].includes(s);
}

/** Zerlegt CSV-Text. Erkennt Semikolon oder Komma als Trenner, entfernt BOM. */
export function leseCsv(text) {
  const sauber = text.replace(/^﻿/, '').trim();
  if (sauber === '') return { kopf: [], zeilen: [] };

  const zeilenRoh = sauber.split(/\r?\n/).filter((z) => z.trim() !== '');
  const trenner = (zeilenRoh[0].match(/;/g) ?? []).length >= (zeilenRoh[0].match(/,/g) ?? []).length ? ';' : ',';

  const kopf = zeilenRoh[0].split(trenner).map((f) => f.trim().toLowerCase().replace(/\s+/g, '_'));
  const zeilen = zeilenRoh.slice(1).map((zeile, i) => {
    const felder = zeile.split(trenner);
    const satz = { _zeile: i + 2 };
    kopf.forEach((spalte, k) => {
      satz[spalte] = (felder[k] ?? '').trim();
    });
    return satz;
  });

  return { kopf, zeilen };
}

/**
 * Prüft und wandelt eine Preisliste in Katalogartikel.
 *
 * @param {string} csvText  Inhalt der Lieferantendatei
 * @param {object} lieferant  Lieferantensatz aus lieferanten.json
 * @returns {{artikel: Array, fehler: Array, warnungen: Array}}
 */
export function importierePreisliste(csvText, lieferant, zielmarge = 0.35) {
  const { kopf, zeilen } = leseCsv(csvText);
  const fehler = [];
  const warnungen = [];

  for (const pflicht of PFLICHTSPALTEN) {
    if (!kopf.includes(pflicht)) fehler.push(`Pflichtspalte fehlt: ${pflicht}`);
  }
  if (!kopf.includes('uvp_netto') && !kopf.includes('ek_netto')) {
    fehler.push('Es fehlt eine Preisspalte: uvp_netto oder ek_netto');
  }
  if (fehler.length > 0) return { artikel: [], fehler, warnungen };

  const artikel = [];
  const gesehen = new Set();

  for (const satz of zeilen) {
    const ort = `Zeile ${satz._zeile}`;
    const sku = satz.sku;

    if (!sku) { fehler.push(`${ort}: SKU fehlt`); continue; }
    if (gesehen.has(sku)) { fehler.push(`${ort}: SKU ${sku} kommt mehrfach vor`); continue; }
    gesehen.add(sku);
    if (!satz.bezeichnung) { fehler.push(`${ort}: Bezeichnung fehlt für ${sku}`); continue; }

    const uvp = zahl(satz.uvp_netto);
    const ekGeliefert = zahl(satz.ek_netto);
    const gewicht = zahl(satz.gewicht_kg);

    if (Number.isNaN(uvp) || Number.isNaN(ekGeliefert) || Number.isNaN(gewicht)) {
      fehler.push(`${ort}: Zahl nicht lesbar bei ${sku}`);
      continue;
    }

    let ekNetto;
    let ekQuelle;
    if (ekGeliefert != null) {
      if (ekGeliefert <= 0) { fehler.push(`${ort}: Einkaufspreis muss positiv sein (${sku})`); continue; }
      ekNetto = cent(ekGeliefert);
      ekQuelle = 'bestaetigt';
    } else {
      if (uvp == null || uvp <= 0) { fehler.push(`${ort}: Weder Einkaufspreis noch UVP brauchbar (${sku})`); continue; }
      ekNetto = einkaufspreis(uvp, lieferant.haendlerrabattAufUvp);
      ekQuelle = 'platzhalter';
      warnungen.push(`${ort}: ${sku} ohne Einkaufspreis — aus UVP und Rabatt gerechnet, bleibt Platzhalter`);
    }

    const uvpNetto = uvp != null && uvp > 0 ? cent(uvp) : cent(ekNetto / (1 - lieferant.haendlerrabattAufUvp));

    if (ekNetto >= uvpNetto) {
      fehler.push(`${ort}: Einkaufspreis ist nicht kleiner als UVP (${sku}) — Liste prüfen`);
      continue;
    }

    const vkNetto = verkaufspreis(ekNetto, zielmarge, uvpNetto);
    const marge = rohmarge(ekNetto, vkNetto);
    if (marge < MARGENUNTERGRENZE - 1e-9) {
      warnungen.push(
        `${ort}: ${sku} erreicht nur ${(marge * 100).toFixed(1)} % Marge — unter der Untergrenze von 32 % (Gate 1)`,
      );
    }

    artikel.push({
      sku,
      bezeichnung: satz.bezeichnung,
      gruppe: satz.gruppe || 'Sonstiges',
      lieferantId: lieferant.id,
      einheit: satz.einheit || 'Stück',
      menge: satz.menge || '1',
      uvpNetto,
      ekNetto: ekQuelle === 'bestaetigt' ? ekNetto : undefined,
      gewichtKg: gewicht ?? 0,
      sperrgut: jaNein(satz.sperrgut),
      ekQuelle,
    });
  }

  return { artikel, fehler, warnungen };
}

/**
 * Vergleicht eine importierte Liste mit dem bisherigen Katalog.
 * Das ist die monatliche Pflegearbeit aus phase6-automatisierung.md — hier
 * erledigt sie sich beim Einlesen selbst.
 */
export function vergleiche(alt, neu) {
  const altById = new Map(alt.map((a) => [a.sku, a]));
  const neuById = new Map(neu.map((a) => [a.sku, a]));

  const neuzugaenge = neu.filter((a) => !altById.has(a.sku)).map((a) => a.sku);
  const entfallen = alt.filter((a) => !neuById.has(a.sku)).map((a) => a.sku);

  const preisaenderungen = [];
  for (const [sku, n] of neuById) {
    const a = altById.get(sku);
    if (!a) continue;
    const alterEk = a.ekNetto ?? null;
    const neuerEk = n.ekNetto ?? null;
    if (alterEk != null && neuerEk != null && Math.abs(alterEk - neuerEk) >= 0.01) {
      preisaenderungen.push({
        sku,
        vorher: alterEk,
        nachher: neuerEk,
        veraenderung: (neuerEk - alterEk) / alterEk,
      });
    }
  }

  preisaenderungen.sort((x, y) => Math.abs(y.veraenderung) - Math.abs(x.veraenderung));

  return { neuzugaenge, entfallen, preisaenderungen };
}
