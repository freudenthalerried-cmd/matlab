/**
 * Eine Artikelliste des Lieferanten in Katalog und Preisdatei überführen.
 *
 * **Anlass, 28. August 2026.** Der Katalog hat 46 Artikel, weil er aus
 * fünfzehn Rechnungen entstanden ist; mehr steht dort nicht drin. Der
 * Auftraggeber hat ein Konto im Webshop seines Lieferanten, und was er dort
 * sieht, sind seine Preise. Sobald er eine Liste daraus ausleitet, soll sie
 * in einem Lauf im Shop stehen — und zwar unter denselben Sperren wie alles
 * andere.
 *
 * Dieses Modul rechnet und entscheidet; es liest und schreibt keine Dateien.
 * Das Werkzeug drumherum (`bin/preisliste.mjs`) tut nur das.
 *
 * **Was hier nicht passiert:** Es wird nichts geschätzt, nichts gerundet und
 * nichts ergänzt. Eine Zeile ohne brauchbaren Einkaufspreis wird **nicht**
 * übernommen, und sie wird namentlich gemeldet — Gate 24: Was der Shop nicht
 * rechnen kann, kann er nicht anbieten.
 */

/** Spalten, ohne die eine Zeile keine Zeile ist. */
export const PFLICHTSPALTEN = Object.freeze(['sku', 'bezeichnung', 'einheit', 'ek_netto']);

/** Spalten, die zusätzlich gelesen werden, wenn sie dastehen. */
export const KANNSPALTEN = Object.freeze(['uvp_netto', 'gruppe', 'gewicht_kg', 'sperrgut', 'stand']);

/**
 * Liest eine Zahl in deutscher **oder** englischer Schreibweise.
 *
 * „1.234,56" und „1234.56" meinen dasselbe, und beide kommen aus Webshops.
 * Entscheidend ist das **letzte** Trennzeichen: Was danach kommt, sind die
 * Nachkommastellen. Ein Punkt mit drei folgenden Ziffern ist ein
 * Tausenderpunkt — „1.234" sind tausendzweihundertvierunddreißig, nicht
 * eins Komma zwei drei vier.
 */
export function leseZahl(roh) {
  const t = String(roh ?? '').trim().replace(/[€\s ]/g, '');
  if (t === '') return null;
  if (!/^-?[\d.,]+$/.test(t)) return null;
  const letzteKomma = t.lastIndexOf(',');
  const letzterPunkt = t.lastIndexOf('.');
  let zahl;
  if (letzteKomma > letzterPunkt) {
    zahl = t.replace(/\./g, '').replace(',', '.');
  } else if (letzterPunkt > letzteKomma) {
    const nach = t.length - letzterPunkt - 1;
    zahl = nach === 3 && letzteKomma === -1 && /^\d{1,3}\.\d{3}$/.test(t)
      ? t.replace(/\./g, '')
      : t.replace(/,/g, '');
  } else {
    zahl = t;
  }
  const wert = Number(zahl);
  return Number.isFinite(wert) ? wert : null;
}

/** Zerlegt CSV mit `;`, `,` oder Tabulator als Trenner. */
export function leseTabelle(text) {
  const sauber = String(text ?? '').replace(/^﻿/, '').trim();
  if (sauber === '') return { kopf: [], zeilen: [] };
  const zeilenRoh = sauber.split(/\r?\n/).filter((z) => z.trim() !== '');
  const kandidaten = [';', '\t', ','];
  const trenner = kandidaten
    .map((t) => ({ t, n: zeilenRoh[0].split(t).length }))
    .sort((a, b) => b.n - a.n)[0];
  if (!trenner || trenner.n < 2) return { kopf: [], zeilen: [] };

  const feld = (z) => z.split(trenner.t).map((f) => f.trim().replace(/^"|"$/g, ''));
  const kopf = feld(zeilenRoh[0]).map((f) => f.toLowerCase().replace(/\s+/g, '_'));
  const zeilen = [];
  for (let i = 1; i < zeilenRoh.length; i++) {
    const werte = feld(zeilenRoh[i]);
    const satz = {};
    kopf.forEach((spalte, k) => { satz[spalte] = werte[k] ?? ''; });
    satz._zeile = i + 1;
    zeilen.push(satz);
  }
  return { kopf, zeilen };
}

/**
 * Prüft und zerlegt eine Artikelliste.
 *
 * @param {string} text       Inhalt der CSV-Datei
 * @param {object} lage       `{ lieferantId, stand }`
 * @returns {{artikel: object[], preise: object, abgelehnt: object[], fehler: string[]}}
 */
export function lesePreisliste(text, { lieferantId, stand } = {}) {
  const fehler = [];
  const { kopf, zeilen } = leseTabelle(text);
  if (!kopf.length) return { artikel: [], preise: {}, abgelehnt: [], fehler: ['Die Datei ist leer oder hat keine Kopfzeile.'] };

  for (const pflicht of PFLICHTSPALTEN) {
    if (!kopf.includes(pflicht)) fehler.push(`Pflichtspalte fehlt: ${pflicht}`);
  }
  if (fehler.length) return { artikel: [], preise: {}, abgelehnt: [], fehler };

  const artikel = [];
  const preise = {};
  const abgelehnt = [];
  const gesehen = new Set();

  for (const satz of zeilen) {
    const ort = `Zeile ${satz._zeile}`;
    const sku = String(satz.sku ?? '').trim();
    const bezeichnung = String(satz.bezeichnung ?? '').trim();
    if (!sku) { abgelehnt.push({ ort, sku: '—', bezeichnung, grund: 'Artikelnummer fehlt' }); continue; }
    if (gesehen.has(sku)) { abgelehnt.push({ ort, sku, bezeichnung, grund: 'Artikelnummer kommt mehrfach vor' }); continue; }
    if (!bezeichnung) { abgelehnt.push({ ort, sku, bezeichnung: '—', grund: 'Bezeichnung fehlt' }); continue; }

    const ek = leseZahl(satz.ek_netto);
    if (ek === null || ek <= 0) {
      // Gate 24 an der Quelle: „auf Anfrage", leer oder unlesbar ist dasselbe
      // — der Shop kann damit nicht rechnen und führt den Artikel nicht.
      abgelehnt.push({ ort, sku, bezeichnung, grund: `kein brauchbarer Einkaufspreis („${String(satz.ek_netto ?? '').trim() || 'leer'}")` });
      continue;
    }
    const uvp = leseZahl(satz.uvp_netto);
    if (uvp !== null && uvp > 0 && uvp < ek) {
      abgelehnt.push({ ort, sku, bezeichnung, grund: `Listenpreis ${uvp} liegt unter dem Einkaufspreis ${ek}` });
      continue;
    }
    const gewicht = leseZahl(satz.gewicht_kg);

    gesehen.add(sku);
    artikel.push({
      sku,
      lieferantenArtikelnummer: sku,
      bezeichnung,
      // **Ohne Warengruppe ist ein Artikel im Shop unauffindbar** — er steht
      // in keiner Sortimentsliste und in keiner Kachel; nur die Suche kennt
      // ihn. Der Bau bricht deshalb ab, wenn eine Gruppe keine Seite hat.
      // Der Name „Ohne Gruppe" ist absichtlich sperrig: Er soll auffallen,
      // nicht sich einfügen.
      gruppe: String(satz.gruppe ?? '').trim() || 'Ohne Gruppe',
      lieferantId,
      einheit: String(satz.einheit ?? '').trim().toUpperCase(),
      sperrgut: /^(ja|true|1|x)$/i.test(String(satz.sperrgut ?? '').trim()),
      sperrgutQuelle: 'liste',
      gtin: null,
      preisStand: String(satz.stand ?? '').trim() || stand,
      ekQuelle: 'bestaetigt',
      ekHerkunft: 'artikelliste',
      ...(gewicht !== null && gewicht > 0 ? { gewichtKg: gewicht, gewichtQuelle: 'liste' } : {}),
    });
    preise[sku] = {
      ekNetto: ek,
      ...(uvp !== null && uvp > 0 ? { uvpNetto: uvp } : {}),
      stand: String(satz.stand ?? '').trim() || stand,
      hinweis: 'aus der Artikelliste des Lieferanten',
    };
  }

  return { artikel, preise, abgelehnt, fehler };
}

/**
 * Führt eine gelesene Liste mit dem Bestand zusammen.
 *
 * **Der Bestand gewinnt bei allem, was er besser weiß.** Ein Gewicht aus
 * einer Rechnung mit bestandener Summenprobe ist belegter als eines aus
 * einer Liste; ein Preis aus einer Rechnung ist eine bezahlte Tatsache, ein
 * Listenpreis eine Zusage. Deshalb überschreibt der Import **nichts**, was
 * aus Belegen stammt — er ergänzt.
 *
 * Das ist dieselbe Lehre wie am selben Tag beim Katalogerzeuger, der die
 * Gewichte gelöscht hat: **Ein Werkzeug, das eine Datei neu schreibt, muss
 * wissen, was andere hineingeschrieben haben.**
 */
export function fuegeZusammen(bestandKatalog, bestandPreise, gelesen) {
  const alteArtikel = new Map((bestandKatalog.artikel ?? []).map((a) => [a.sku, a]));
  const altePreise = { ...(bestandPreise.preise ?? {}) };

  const neu = [];
  const ergaenzt = [];
  const unveraendert = [];

  for (const a of gelesen.artikel) {
    const alt = alteArtikel.get(a.sku);
    if (!alt) {
      alteArtikel.set(a.sku, a);
      altePreise[a.sku] = gelesen.preise[a.sku];
      neu.push(a.sku);
      continue;
    }
    // Vorhandener Artikel: Nur Felder ergänzen, die fehlen.
    const zusammen = { ...a, ...alt };
    const dazu = Object.keys(a).filter((k) => alt[k] === undefined && a[k] !== undefined);
    if (dazu.length) {
      alteArtikel.set(a.sku, zusammen);
      ergaenzt.push({ sku: a.sku, felder: dazu });
    } else {
      unveraendert.push(a.sku);
    }
    // Der Preis aus dem Beleg bleibt stehen; die Liste liefert nur, was fehlt.
    if (!altePreise[a.sku]) altePreise[a.sku] = gelesen.preise[a.sku];
  }

  const artikel = [...alteArtikel.values()].sort(
    (x, y) => String(x.gruppe).localeCompare(String(y.gruppe), 'de')
      || String(x.bezeichnung).localeCompare(String(y.bezeichnung), 'de'),
  );

  return { artikel, preise: altePreise, neu, ergaenzt, unveraendert };
}
