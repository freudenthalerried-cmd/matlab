/**
 * Der Baustoffkatalog — öffentlicher Katalog plus vertrauliche Preisdatei.
 *
 * Warum überhaupt zwei Dateien: Die Konditionen, die ein Lieferant einem
 * Baumeister einräumt, sind dessen Geschäftsgeheimnis und zugleich die
 * Verhandlungsposition des Auftraggebers. Solange das Repository öffentlich
 * ist, dürfen sie nicht hinein. Ein Hinweis in einem Dokument genügt dafür
 * nicht — die Trennung muss so gebaut sein, dass ein Versehen auffällt statt
 * durchzurutschen.
 *
 * Deshalb die Regel, die dieses Modul durchsetzt:
 *
 *   **Ohne Preisdatei gibt es keine Preise — und keinen Ersatz dafür.**
 *
 * Nicht null, nicht Platzhalter, nicht „vorläufig". Die Artikel kommen mit
 * `ekQuelle: 'fehlt'` zurück, und damit greifen die bestehenden Sperren, die
 * an genau dieser Kennzeichnung hängen: Bestellauslösung, Rechnungsstellung
 * und die maschinenlesbare Veröffentlichung verweigern den Dienst.
 *
 * Die Versuchung, hier einen Schätzwert einzusetzen, damit „die Oberfläche
 * etwas anzeigt", ist genau der Fehler, den dieses Projekt viermal gemacht
 * hat: eine Lücke still mit einer optimistischen Annahme füllen.
 */

import { kalkuliere } from './preis.js';

/** Zielmarge des Modells. Weisung vom 25. August 2026: 25 % vom Verkauf. */
export const ZIELMARGE = 0.25;

/**
 * Führt Katalog und Preise zusammen.
 *
 * @param {object} katalogDatei  Inhalt von data/katalog-baustoff.json
 * @param {object|null} preisDatei  Inhalt von preise/baustoff-preise.json, oder null
 * @param {object} lieferantenDatei  Inhalt von data/lieferanten.json
 * @param {number} zielmarge
 */
export function ladeBaustoffkatalog(katalogDatei, preisDatei, lieferantenDatei, zielmarge = ZIELMARGE) {
  const lieferantenById = new Map(lieferantenDatei.lieferanten.map((l) => [l.id, l]));
  const preise = preisDatei?.preise ?? null;

  const artikel = [];
  const ohnePreis = [];

  for (const a of katalogDatei.artikel) {
    const lieferant = lieferantenById.get(a.lieferantId);
    if (!lieferant) throw new Error(`Unbekannter Lieferant: ${a.lieferantId} (${a.sku})`);

    const preis = preise?.[a.sku] ?? null;
    if (!preis) {
      ohnePreis.push(a.sku);
      artikel.push({
        ...a,
        ekQuelle: 'fehlt',
        ekIstPlatzhalter: true,
        vkNetto: null,
        vkBrutto: null,
        ekNetto: null,
        deckungsbeitragNetto: null,
        rohmarge: null,
        zielmargeErreicht: false,
        amListendeckel: false,
        grund: 'Kein bestätigter Einkaufspreis geladen — die Preisdatei fehlt oder kennt diesen Artikel nicht.',
      });
      continue;
    }

    const mitPreis = { ...a, ...preis };
    artikel.push({ ...a, ...preis, ...kalkuliere(mitPreis, lieferant, zielmarge) });
  }

  return {
    artikel,
    lieferantenById,
    zielmarge,
    preiseGeladen: preise !== null,
    ohnePreis,
    vollstaendig: preise !== null && ohnePreis.length === 0,
  };
}

/**
 * Was der Katalog über sich selbst sagen kann, ohne dass jemand rechnen muss.
 *
 * Die drei Zahlen, die den Zuschnitt des Shops entscheiden — hergeleitet in
 * docs/baustoff-shop/katalog-aus-rechnungen.md:
 *
 *   `unterListe`   Artikel, bei denen die Zielmarge unter dem Listenpreis des
 *                  Lieferanten bleibt. Nur diese sind als Suchartikel tauglich.
 *   `amDeckel`     Artikel, bei denen der Listenpreis den Verkaufspreis
 *                  beschneidet. Hier gibt es die Zielmarge nicht — sie gehören
 *                  in den Beipack, nicht in die Anzeige.
 *   `ohneListe`    Nettofakturierte Artikel. Kein Deckel, aber auch kein
 *                  Vergleichsmaßstab.
 */
export function katalogbefund(katalog) {
  const mitPreis = katalog.artikel.filter((a) => a.vkNetto !== null);
  const amDeckel = mitPreis.filter((a) => a.amListendeckel);
  const ohneListe = mitPreis.filter((a) => a.uvpNetto === null);
  const unterListe = mitPreis.filter((a) => a.uvpNetto !== null && !a.amListendeckel);

  const abstaende = unterListe
    .map((a) => a.vkNetto / a.uvpNetto)
    .sort((x, y) => x - y);
  const median = abstaende.length
    ? abstaende.length % 2
      ? abstaende[(abstaende.length - 1) / 2]
      : (abstaende[abstaende.length / 2 - 1] + abstaende[abstaende.length / 2]) / 2
    : null;

  const jeGruppe = new Map();
  for (const a of katalog.artikel) {
    if (!jeGruppe.has(a.gruppe)) jeGruppe.set(a.gruppe, { gesamt: 0, suchtauglich: 0 });
    const g = jeGruppe.get(a.gruppe);
    g.gesamt += 1;
    if (a.vkNetto !== null && a.uvpNetto !== null && !a.amListendeckel) g.suchtauglich += 1;
  }

  return {
    artikelGesamt: katalog.artikel.length,
    mitPreis: mitPreis.length,
    unterListe: unterListe.length,
    amDeckel: amDeckel.length,
    ohneListe: ohneListe.length,
    medianAbstandZurListe: median === null ? null : Math.round((1 - median) * 1000) / 10,
    jeGruppe: Object.fromEntries(jeGruppe),
    suchtauglicheSkus: unterListe.map((a) => a.sku),
    nurBeipackSkus: amDeckel.map((a) => a.sku),
  };
}
