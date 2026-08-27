/**
 * Was einen Katalog zu einem Shop macht: Suchen, Filtern, Sortieren, Sammeln.
 *
 * Die Weisung lautete „ein richtig hochwertiger Shop wie Amazon". Was daran
 * hochwertig ist, sind nicht Verläufe und Schatten, sondern vier Dinge, die
 * ein Kunde tut: **finden, eingrenzen, vergleichen, sammeln.** Bis hierher
 * konnte die Seite keines davon.
 *
 * Dieses Modul läuft **im Browser und im Testlauf** — dieselbe Datei, kein
 * Nachbau. Es rechnet keine Preise; dafür ist der Rechenkern zuständig
 * (`warenkorb.js`, `preis.js`, `kostenbild.js`). Wer hier eine zweite
 * Preisrechnung einbaut, hat zwei Wahrheiten.
 *
 * Bewusst ohne Fremdmittel und ohne Server: Der Shop ist eine statische
 * Seite. Suche und Warenkorb laufen beim Kunden.
 */

/* ------------------------------------------------------------------ *
 * Suche
 * ------------------------------------------------------------------ */

/**
 * Zerlegt Text in vergleichbare Wortstämme.
 *
 * Umlaute werden **nicht** entfernt, sondern verdoppelt abgelegt (ö → ö und
 * oe): Wer „Mörtel" tippt, meint dasselbe wie „Moertel", und wer die Tastatur
 * eines Baustellenhandys benutzt, tippt oft das zweite. Ein Suchindex, der
 * nur eine Schreibweise kennt, findet die halbe Warengruppe nicht.
 */
export function wortstaemme(text) {
  const roh = String(text ?? '').toLowerCase();
  const ersetzt = roh
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  const teile = [...roh.split(/[^\p{L}\d]+/u), ...ersetzt.split(/[^\p{L}\d]+/u)];
  return [...new Set(teile.filter((t) => t.length >= 2))];
}

/**
 * Baut den Suchindex.
 *
 * Jeder Eintrag trägt sein Gewicht mit: Ein Treffer in der Bezeichnung wiegt
 * schwerer als einer im Fließtext. Ohne diese Trennung findet „Gewebe" zuerst
 * die Wissensseite, die das Wort vierzigmal enthält, und erst danach das
 * Gewebe, das man kaufen kann.
 */
export function baueSuchindex({ artikel = [], seiten = [] } = {}) {
  const eintraege = [];

  for (const a of artikel) {
    eintraege.push({
      art: 'artikel',
      id: `artikel/${a.sku}`,
      titel: a.bezeichnung,
      zusatz: `${a.gruppe} ${a.lieferantenArtikelnummer ?? ''}`,
      gruppe: a.gruppe,
      sku: a.sku,
      vkNetto: a.vkNetto ?? null,
      einheit: a.einheit,
      stark: wortstaemme(a.bezeichnung),
      schwach: wortstaemme(`${a.gruppe} ${a.lieferantenArtikelnummer ?? ''}`),
    });
  }

  for (const s of seiten) {
    eintraege.push({
      art: s.art === 'gruppen' ? 'gruppe' : s.art,
      id: s.id,
      titel: s.titel,
      zusatz: s.kurz ?? '',
      gruppe: s.gruppe ?? null,
      stark: wortstaemme(`${s.titel} ${s.frage ?? ''}`),
      schwach: wortstaemme(`${s.kurz ?? ''} ${s.text ?? ''}`),
    });
  }

  return eintraege;
}

/** Gewichte der Trefferarten. Artikel vor Seite — der Shop verkauft Ware. */
const GEWICHT = Object.freeze({ artikel: 3, gruppe: 2, system: 2, wissen: 1 });

/**
 * Sucht im Index.
 *
 * Ein Wort zählt als Treffer, wenn ein Indexwort damit **beginnt** — „däm"
 * findet „Dämmplatte".
 *
 * **Und wenn es darin vorkommt**, ab vier Zeichen. Der erste Entwurf ließ das
 * weg, mit der Begründung, Wortmitten fänden zu viel. Der erste Probelauf hat
 * ihn widerlegt: Die Suche nach „spachtel" fand den *Baumit KlebeSpachtel*
 * nicht, weil das ein Wort ist und nicht zwei. **Deutsch setzt zusammen**;
 * eine Suche, die nur Wortanfänge kennt, findet im Baustoffhandel die Hälfte
 * des Sortiments nicht — Klebespachtel, Putzgrund, Trennwandfilz,
 * Kantenschutz, Grundmauerschutz. Die Grenze von vier Zeichen hält
 * Zufallstreffer in Artikelnummern draußen.
 *
 * Der Treffer in der Wortmitte zählt weniger als der am Anfang, und der
 * weniger als das ganze Wort. Damit steht der Spachtel vor dem
 * Klebespachtel, wenn jemand „spachtel" sucht.
 *
 * Mehrere Suchwörter müssen **alle** treffen. Wer „xps 50" eingibt, will
 * nicht alles, was XPS heißt, und auch nicht alles mit einer 50 darin.
 */
export function suche(index, frage, { grenze = 40 } = {}) {
  const woerter = wortstaemme(frage);
  if (!woerter.length) return [];

  const treffer = [];
  for (const e of index) {
    let punkte = 0;
    let alleGetroffen = true;

    for (const w of woerter) {
      const innen = w.length >= 4;
      const genau = e.stark.includes(w);
      const anfang = !genau && e.stark.some((s) => s.startsWith(w));
      const mitte = !genau && !anfang && innen && e.stark.some((s) => s.includes(w));
      const schwach = !genau && !anfang && !mitte
        && e.schwach.some((s) => s.startsWith(w) || (innen && s.includes(w)));
      if (!genau && !anfang && !mitte && !schwach) { alleGetroffen = false; break; }
      punkte += genau ? 12 : anfang ? 8 : mitte ? 6 : 3;
    }
    if (!alleGetroffen) continue;

    punkte *= GEWICHT[e.art] ?? 1;
    // Kurze Titel gewinnen bei Gleichstand: „Baumit KlebeSpachtel 25 kg" ist
    // eher gemeint als „Capatect Polystyrol-Rondelle für Capatect …".
    punkte -= Math.min(6, e.titel.length / 20);
    treffer.push({ ...e, punkte });
  }

  return treffer.sort((a, b) => b.punkte - a.punkte || a.titel.localeCompare(b.titel, 'de'))
    .slice(0, grenze);
}

/* ------------------------------------------------------------------ *
 * Filtern und Sortieren
 * ------------------------------------------------------------------ */

export const SORTIERUNGEN = Object.freeze([
  { id: 'name', text: 'Bezeichnung A–Z' },
  { id: 'preis-auf', text: 'Preis aufsteigend' },
  { id: 'preis-ab', text: 'Preis absteigend' },
  { id: 'vorteil', text: 'Preisvorteil zuerst' },
]);

/**
 * Sortiert eine Artikelliste.
 *
 * Artikel ohne Preis stehen **immer hinten**, in jeder Sortierung. Sie ganz
 * auszublenden wäre falsch (sie sind bestellbar, nur nicht bepreist), sie
 * unter „Preis aufsteigend" nach vorn zu lassen wäre irreführend: null ist
 * nicht null Euro.
 */
export function sortiere(artikel, wie = 'name') {
  const liste = [...artikel];
  const ohnePreis = (a) => a.vkNetto === null || a.vkNetto === undefined;
  const nachName = (a, b) => String(a.bezeichnung).localeCompare(String(b.bezeichnung), 'de');

  liste.sort((a, b) => {
    if (ohnePreis(a) !== ohnePreis(b)) return ohnePreis(a) ? 1 : -1;
    if (ohnePreis(a)) return nachName(a, b);
    switch (wie) {
      case 'preis-auf': return a.vkNetto - b.vkNetto || nachName(a, b);
      case 'preis-ab': return b.vkNetto - a.vkNetto || nachName(a, b);
      case 'vorteil': return (vorteil(b) ?? -1) - (vorteil(a) ?? -1) || nachName(a, b);
      default: return nachName(a, b);
    }
  });
  return liste;
}

/** Abstand zum Listenpreis des Lieferanten in Prozent, oder null. */
export function vorteil(a) {
  if (!a?.uvpNetto || !a?.vkNetto || a.amListendeckel) return null;
  return Math.round((1 - a.vkNetto / a.uvpNetto) * 100);
}

/**
 * Grenzt eine Artikelliste ein.
 *
 * Alle Felder sind freiwillig; was fehlt, filtert nicht. Ein Filter, der bei
 * fehlender Angabe alles wegwirft, ist die unangenehmste Art, einen leeren
 * Shop zu bauen.
 */
export function filtere(artikel, f = {}) {
  return artikel.filter((a) => {
    if (f.gruppe && a.gruppe !== f.gruppe) return false;
    if (f.suchtauglich && vorteil(a) === null) return false;
    if (f.ohneSperrgut && a.sperrgut) return false;
    if (typeof f.preisBis === 'number' && (a.vkNetto === null || a.vkNetto > f.preisBis)) return false;
    if (typeof f.preisAb === 'number' && (a.vkNetto === null || a.vkNetto < f.preisAb)) return false;
    return true;
  });
}

/** Die Filterwerte, die im Bestand überhaupt vorkommen — für die Oberfläche. */
export function filterwerte(artikel) {
  const preise = artikel.map((a) => a.vkNetto).filter((p) => typeof p === 'number');
  return {
    gruppen: [...new Set(artikel.map((a) => a.gruppe))].sort((a, b) => a.localeCompare(b, 'de')),
    preisMin: preise.length ? Math.min(...preise) : null,
    preisMax: preise.length ? Math.max(...preise) : null,
    mitSperrgut: artikel.some((a) => a.sperrgut),
  };
}

/* ------------------------------------------------------------------ *
 * Warenkorb
 * ------------------------------------------------------------------ */

export const KORBSCHLUESSEL = 'freudenthaler-shop-warenkorb-v1';

/**
 * Liest den Warenkorb aus dem Browserspeicher.
 *
 * Jeder Zugriff steht in try/catch: In einem privaten Fenster, bei
 * gesperrten Seitendaten oder beim Erzeugen einer Vorschau wirft schon der
 * Zugriff auf `localStorage`. Ein Shop, der deshalb weiß bleibt, ist
 * schlimmer als einer, der den Korb vergisst.
 *
 * Fremde oder beschädigte Inhalte werden **verworfen, nicht repariert**:
 * Wer eine kaputte Menge auf 1 setzt, verkauft dem Kunden etwas, das er nicht
 * bestellt hat.
 */
export function ladeKorb(speicher) {
  try {
    const roh = speicher?.getItem(KORBSCHLUESSEL);
    if (!roh) return [];
    const daten = JSON.parse(roh);
    if (!Array.isArray(daten)) return [];
    return daten
      .filter((z) => z && typeof z.sku === 'string' && Number.isInteger(z.menge) && z.menge >= 1)
      .map((z) => ({ sku: z.sku, menge: Math.min(z.menge, 999) }));
  } catch {
    return [];
  }
}

/** Schreibt den Warenkorb. Gibt zurück, ob es geklappt hat. */
export function speichereKorb(speicher, zeilen) {
  try {
    speicher?.setItem(KORBSCHLUESSEL, JSON.stringify(zeilen));
    return true;
  } catch {
    return false;
  }
}

/**
 * Legt einen Artikel in den Korb oder erhöht die Menge.
 *
 * Reine Funktion — sie ändert die übergebene Liste nicht. Der Aufrufer
 * entscheidet, ob und wann gespeichert wird.
 */
export function legeInKorb(zeilen, sku, menge = 1) {
  if (typeof sku !== 'string' || !sku) throw new Error('Artikelnummer fehlt');
  if (!Number.isInteger(menge) || menge < 1) throw new Error(`Ungültige Menge: ${menge}`);
  const neu = zeilen.map((z) => ({ ...z }));
  const treffer = neu.find((z) => z.sku === sku);
  if (treffer) treffer.menge = Math.min(treffer.menge + menge, 999);
  else neu.push({ sku, menge: Math.min(menge, 999) });
  return neu;
}

/** Setzt eine Menge. Menge 0 entfernt die Zeile. */
export function setzeMenge(zeilen, sku, menge) {
  if (!Number.isInteger(menge) || menge < 0) throw new Error(`Ungültige Menge: ${menge}`);
  if (menge === 0) return zeilen.filter((z) => z.sku !== sku);
  return zeilen.map((z) => (z.sku === sku ? { ...z, menge: Math.min(menge, 999) } : { ...z }));
}

/** Stückzahl im Korb — die Zahl neben dem Korbsymbol. */
export const korbAnzahl = (zeilen) => zeilen.reduce((n, z) => n + z.menge, 0);

/**
 * Wirft Zeilen weg, die es im Katalog nicht mehr gibt.
 *
 * Ein Warenkorb überlebt im Browser jede Katalogänderung. Wer das nicht
 * abfängt, bekommt beim Rechnen einen Fehler — `berechneWarenkorb()` wirft
 * bei unbekannter Artikelnummer, und zwar zu Recht. Was wegfällt, wird
 * **zurückgegeben und genannt**, nicht stillschweigend entfernt.
 */
export function bereinige(zeilen, katalogArtikel) {
  const bekannt = new Set(katalogArtikel.map((a) => a.sku));
  const gueltig = zeilen.filter((z) => bekannt.has(z.sku));
  const entfallen = zeilen.filter((z) => !bekannt.has(z.sku)).map((z) => z.sku);
  return { zeilen: gueltig, entfallen };
}

/* ------------------------------------------------------------------ *
 * Die Rechnung, die der Kunde sieht
 * ------------------------------------------------------------------ */

/**
 * Welche Felder eines Lieferanten in die Seite dürfen.
 *
 * **Nicht die ganze Datei.** `lieferanten.json` führt bei den
 * Platzhalterlieferanten `haendlerrabattAufUvp` und `mindestbestellwertNetto`
 * — Konditionen, keine Kundeninformation. Wer den Datensatz als Ganzes
 * einbettet, veröffentlicht sie, und niemand merkt es (siehe
 * `interna-auf-der-kundenseite.md`).
 *
 * Die Frachtsätze dürfen und müssen hinaus: Der Kunde bezahlt sie.
 */
export function oeffentlicherLieferant(l) {
  return {
    id: l.id,
    // **Kein Lieferantenname.** Der Interna-Prüfer hat ihn beim ersten Lauf
    // gemeldet, und die Prüfung, ob er recht hat, fiel zu seinen Gunsten aus:
    // Die Oberfläche zeigt den Namen nirgends, sie braucht ihn also nicht.
    // Was nicht gebraucht wird, wird nicht ausgeliefert — das ist billiger
    // als eine begründete Ausnahme.
    //
    // Vollständig verbergen lässt er sich damit nicht: Die Artikelnummern
    // tragen das Kürzel des Lieferanten (`POS-…`), und die Seiten weisen
    // seine Artikelnummer bewusst aus, damit ein Kunde nachbestellen kann.
    // **Geheim ist nicht die Geschäftsbeziehung, geheim sind die
    // Konditionen.** Diese Zeile schützt die zweite.
    lieferzeitWerktage: l.lieferzeitWerktage ?? null,
    fracht: {
      pauschaleNetto: l.fracht?.pauschaleNetto ?? 0,
      sperrgutZuschlagNetto: l.fracht?.sperrgutZuschlagNetto ?? 0,
      // Die Frei-Haus-Schwelle misst am **Bestellwert**, also am Einkauf.
      // Der Browser kennt keine Einkaufspreise und kann sie deshalb nicht
      // prüfen. Statt sie zu verschweigen, wird sie als offen gemeldet.
      freiHausAbNetto: l.fracht?.freiHausAbNetto ?? null,
    },
  };
}

/** Ein Artikel, so wie er in der Seite stehen darf. */
export function oeffentlicherArtikel(a) {
  return {
    sku: a.sku,
    bezeichnung: a.bezeichnung,
    gruppe: a.gruppe,
    einheit: a.einheit,
    lieferantId: a.lieferantId,
    sperrgut: !!a.sperrgut,
    vkNetto: a.vkNetto ?? null,
    vkBrutto: a.vkBrutto ?? null,
    uvpNetto: a.uvpNetto ?? null,
    amListendeckel: !!a.amListendeckel,
    preisStand: a.preisStand ?? null,
    lieferantenArtikelnummer: a.lieferantenArtikelnummer ?? null,
  };
}

const runde = (n) => Math.round(n * 100) / 100;

/**
 * Rechnet den Warenkorb aus Kundensicht.
 *
 * **Warum es diese zweite Funktion gibt**, obwohl `berechneWarenkorb()` im
 * Rechenkern steht und die Regel lautet, nichts nachzubauen: Jene Funktion
 * braucht Einkaufspreise — für den Bestellwert, die Frei-Haus-Schwelle und
 * den Mindestbestellwert. Einkaufspreise dürfen nicht in die Seite. Es ist
 * also keine zweite Rechnung derselben Sache, sondern **dieselbe Rechnung mit
 * weniger Wissen**.
 *
 * Damit daraus keine zweite Wahrheit wird, hält ein Testfall beide
 * aneinander: Für denselben Korb müssen Warenwert, Fracht und Gesamtsumme
 * übereinstimmen. Weicht eine Zahl ab, schlägt der Test fehl — dieselbe
 * Bauart wie die Probe zwischen `ZAHLUNGSBEDINGUNGEN` und `zahlung.js`.
 *
 * Was diese Funktion **nicht** kann, sagt sie im Feld `offen`.
 */
export function kundenWarenkorb(zeilen, { artikel, lieferanten }, ust = 0.2) {
  const nachId = new Map(artikel.map((a) => [a.sku, a]));
  const lieferantById = new Map(lieferanten.map((l) => [l.id, l]));
  const gruppen = new Map();
  const offen = [];

  for (const z of zeilen) {
    const a = nachId.get(z.sku);
    if (!a) throw new Error(`Unbekannte Artikelnummer: ${z.sku}`);
    if (a.vkNetto === null) throw new Error(`Artikel ohne Preis: ${z.sku}`);
    if (!Number.isInteger(z.menge) || z.menge < 1) throw new Error(`Ungültige Menge für ${z.sku}`);
    if (!gruppen.has(a.lieferantId)) gruppen.set(a.lieferantId, []);
    gruppen.get(a.lieferantId).push({ ...a, menge: z.menge, zeilensummeNetto: runde(a.vkNetto * z.menge) });
  }

  const teillieferungen = [];
  for (const [lieferantId, positionen] of [...gruppen].sort((a, b) => a[0].localeCompare(b[0]))) {
    const l = lieferantById.get(lieferantId);
    if (!l) throw new Error(`Unbekannter Lieferant: ${lieferantId}`);
    const warenwertNetto = runde(positionen.reduce((s, p) => s + p.zeilensummeNetto, 0));
    const sperrgutPositionen = positionen.filter((p) => p.sperrgut).length;
    const frachtNetto = runde(l.fracht.pauschaleNetto + sperrgutPositionen * l.fracht.sperrgutZuschlagNetto);

    if (l.fracht.freiHausAbNetto !== null) {
      offen.push(`Eine Frei-Haus-Schwelle ab ${l.fracht.freiHausAbNetto} € misst am Bestellwert `
        + 'und lässt sich hier nicht prüfen — die Fracht kann entfallen.');
    }

    teillieferungen.push({
      lieferantId,
      lieferzeitWerktage: l.lieferzeitWerktage,
      positionen,
      warenwertNetto,
      frachtNetto,
      frachtGrund: sperrgutPositionen > 0
        ? `Pauschale plus ${sperrgutPositionen}× Sperrgutzuschlag`
        : 'Pauschale',
      sperrgutPositionen,
    });
  }

  const warenwertNetto = runde(teillieferungen.reduce((s, t) => s + t.warenwertNetto, 0));
  const frachtNetto = runde(teillieferungen.reduce((s, t) => s + t.frachtNetto, 0));
  const nettoGesamt = runde(warenwertNetto + frachtNetto);
  const ustBetrag = runde(nettoGesamt * ust);

  return {
    teillieferungen,
    positionen: teillieferungen.reduce((n, t) => n + t.positionen.length, 0),
    stueck: korbAnzahl(zeilen),
    warenwertNetto,
    frachtNetto,
    nettoGesamt,
    ustBetrag,
    bruttoGesamt: runde(nettoGesamt + ustBetrag),
    offen,
  };
}
