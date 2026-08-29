/**
 * Maschinenlesbare Ausgabe des Katalogs — für KI-Suche und Produktfeeds.
 *
 * Grundlage ist `ki-sichtbarkeit-konzept.md`: Ein Assistent nennt bei einer
 * Empfehlungsfrage zwei bis drei Anbieter. Wer dort vorkommen will, muss
 * Preis, Verfügbarkeit, Versandkosten und Liefergebiet in einer Form
 * hinterlegen, die eine Maschine lesen kann — und die stimmt.
 *
 * Drei Regeln tragen dieses Modul, alle drei sind Übernahmen aus dem
 * bestehenden Bau und nicht neu erfunden:
 *
 * 1. **Keine zweite Rechnung.** Die Auszeichnung übernimmt die Zahlen aus
 *    `kalkuliere()`, sie rechnet nichts nach. Eine zweite Preisrechnung für
 *    die Maschinen wäre die sicherste Art, Kunden und Assistenten
 *    unterschiedliche Preise zu zeigen — und ein Widerspruch zwischen
 *    angezeigtem und ausgezeichnetem Preis ist in diesem Kanal der teuerste
 *    Fehler, den es gibt.
 * 2. **Platzhalter gehen nicht hinaus.** `darfAutomatischAusgeloestWerden`
 *    sperrt die Bestellung, solange ein Artikel keinen bestätigten
 *    Einkaufspreis trägt. Für die Veröffentlichung gilt dasselbe, aus einem
 *    schärferen Grund: Eine Bestellung mit Platzhalterpreis schadet einem
 *    Vorgang, ein veröffentlichter Platzhalterpreis schadet dem Vertrauen
 *    — und Vertrauen ist der einzige Rohstoff dieses Kanals, den man nicht
 *    nachkaufen kann.
 * 3. **Fremdtext wird entschärft.** Artikelbezeichnungen stammen aus
 *    Herstellerdateien. Sie gehen durch `textZeile`, wie an jedem anderen
 *    Ausgang auch.
 */

import { textZeile } from './format.js';
import { mengenschritt } from './gebinde.js';

/** Wie lange eine ausgezeichnete Preisangabe als gültig gilt (Tage). */
export const PREIS_GUELTIG_TAGE = 7;

/**
 * Was der Shop über die Verfügbarkeit sagt — an **allen** Ausgängen dieselbe
 * Angabe.
 *
 * Bis zum 28. August standen zwei verschiedene Antworten im Bau: Die
 * Artikelseite zeichnete `PreOrder` aus, dieser Feed `InStock`. Beide aus
 * derselben Datenlage, beide ohne Absicht — und die gefährlichere stand im
 * Maschinenkanal: Ein Assistent, der `InStock` liest, sagt einem Kunden, er
 * könne das jetzt kaufen. Kaufen kann er nichts; die Kasse löst nichts aus,
 * weil kein Zahlungsanbieter gewählt ist.
 *
 * > **Zwei Ausgänge mit zwei Wahrheiten sind schlimmer als ein falscher
 * > Ausgang** — der falsche fällt auf, der Widerspruch erst beim Kunden.
 *
 * Deshalb eine Konstante statt zweier Zeichenketten. Sobald die Kasse
 * Bestellungen auslöst, ändert sich hier ein Wort, und beide Ausgänge folgen.
 */
export const VERFUEGBARKEIT = 'https://schema.org/PreOrder';

/**
 * Darf dieser Artikel maschinenlesbar veröffentlicht werden?
 *
 * Liefert Gründe statt eines bloßen Nein — dieselbe Form wie die
 * Freigabeprüfung der Bestellstrecke, damit die Ausgabe sagen kann, was
 * fehlt, statt stumm nichts zu tun.
 */
export function darfVeroeffentlichtWerden(artikel) {
  const gruende = [];
  if (artikel.ekIstPlatzhalter) {
    gruende.push('Einkaufspreis ist Platzhalter — kein Lieferant hat ihn bestätigt');
  }
  if (!(artikel.vkNetto > 0)) {
    gruende.push('kein Verkaufspreis');
  }
  if (!artikel.sku) {
    gruende.push('keine Artikelnummer');
  }
  // Gate 22: Wer einen Artikel bewirbt, dessen Verkaufspreis am Listendeckel
  // des Lieferanten klebt, bezahlt für einen Preisvergleich, den er verliert.
  // Ein Produktfeed ist Werbung — also greift das Gate hier.
  //
  // Unbedingt geprüft, nicht als Schalter: Gate 20 hing anfangs an keiner
  // Entscheidung und lief deshalb nie mit. Artikel ohne dieses Kennzeichen
  // (etwa aus dem Radonkatalog) sind nicht betroffen.
  if (artikel.amListendeckel === true) {
    gruende.push('Verkaufspreis am Listendeckel — Beipack, kein Feedartikel (Gate 22)');
  }
  return { erlaubt: gruende.length === 0, gruende };
}

/**
 * Liefergebiet als strukturierte Angabe.
 *
 * Die Weisung sieht Lieferung „im umliegenden Bereich" vor, nicht
 * österreichweit. Für diesen Kanal ist das ein Vorteil — aber nur, wenn das
 * Gebiet als Liste dasteht und nicht als Satz auf der Versandseite. Ein
 * Assistent, der „liefert nach Bezirk X" belegen kann, nennt den Shop;
 * einer, der es raten müsste, nennt ihn nicht.
 */
export function liefergebietAngabe(gebiet) {
  const bezirke = (gebiet?.bezirke ?? []).map(textZeile).filter(Boolean);
  if (bezirke.length === 0) {
    return { vollstaendig: false, fehlt: 'Liefergebiet ist nicht beziffert', land: gebiet?.land ?? 'AT', bezirke };
  }
  return { vollstaendig: true, land: gebiet.land ?? 'AT', bezirke };
}

/**
 * Schema.org-Auszeichnung eines Artikels als einfaches Objekt.
 *
 * Bewusst als Objekt und nicht als fertiger Text: So kann der Aufrufer es
 * einbetten, in einen Feed schreiben oder gegenprüfen, ohne es zu zerlegen.
 */
/**
 * Die Einheiten des Katalogs in UN/CEFACT-Codes, wie schema.org sie erwartet.
 *
 * **Warum das nötig wurde.** Der Feed nannte bis zum 29.08. nur
 * `price: 5.23` — den Quadratmeterpreis der XPS-Platte. Was ein Käufer
 * tatsächlich zahlt, ist ein anderer Betrag: Die Platte wird in Einheiten zu
 * 0,75 m² abgegeben, die kleinste Bestellung kostet 3,92 €. Ein Angebot, das
 * einen Preis nennt, den man für nichts bekommt, ist in diesem Kanal kein
 * Detail — es ist der Preis, mit dem der Shop im Vergleich steht.
 *
 * schema.org hat dafür genau zwei Felder, und beide werden jetzt gesetzt:
 * `priceSpecification.referenceQuantity` sagt, **worauf** der Preis sich
 * bezieht (je 1 m²), und `eligibleQuantity.minValue` sagt, **wie wenig** man
 * kaufen kann (0,75 m²).
 *
 * Nicht abgebildete Einheiten bekommen keinen Code. Einen zu raten hieße,
 * einem Preisvergleich eine Bezugsgröße unterzuschieben, die niemand geprüft
 * hat.
 */
export const EINHEITSCODES = Object.freeze({
  M2: 'MTK',   // Quadratmeter
  KG: 'KGM',   // Kilogramm
  LFM: 'MTR',  // laufender Meter
  LTR: 'LTR',  // Liter
  // Alles, was stückweise abgegeben wird — Sack, Dose, Eimer, Karton,
  // Rolle, Stück —, ist für UN/CEFACT dasselbe: ein Stück.
  STK: 'C62',
  SCK: 'C62',
  DOS: 'C62',
  EIM: 'C62',
  KRT: 'C62',
  RLL: 'C62',
  PAK: 'C62',
});

/**
 * Die Auszeichnung **ohne** die Veröffentlichungsfrage.
 *
 * **Getrennt am 29.08., und der Anlass war eine selbst gebaute Regression.**
 * Seit die Artikelseite ihr JSON-LD aus `produktAuszeichnung()` bezieht,
 * verlor sie es bei jedem Artikel, den der **Feed** zurückhält — drei
 * Beipackartikel am Listendeckel (Gate 22) standen plötzlich ohne
 * strukturierte Daten da. Gefunden hat es `npm run pruefe-preise` beim
 * allerersten Lauf.
 *
 * Der Denkfehler war, zwei Fragen in eine Funktion zu legen: *Wie sieht die
 * Auszeichnung aus?* und *Gehört der Artikel in den Feed?* Die zweite ist
 * eine Feedfrage. Eine Artikelseite ist eine Produktseite, auch wenn ihr
 * Artikel nicht beworben wird.
 */
export function angebotsAuszeichnung(artikel, lage = {}) {
  const gebiet = liefergebietAngabe(lage.liefergebiet);
  const angebot = {
    '@type': 'Offer',
    priceCurrency: 'EUR',
    // Der Preis kommt aus kalkuliere(), er wird hier nicht neu gerechnet.
    price: artikel.vkNetto.toFixed(2),
    priceValidUntil: lage.preisGueltigBis ?? null,
    availability: artikel.lieferbar === false
      ? 'https://schema.org/OutOfStock'
      : VERFUEGBARKEIT,
    itemCondition: 'https://schema.org/NewCondition',
    // Nettopreis für Unternehmer — Gate 7. Die Auszeichnung sagt es
    // ausdrücklich, weil ein Assistent sonst Netto gegen Brutto vergleicht
    // und den Shop teurer aussehen lässt, als er ist.
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: artikel.vkNetto.toFixed(2),
      priceCurrency: 'EUR',
      valueAddedTaxIncluded: false,
    },
  };

  // Worauf der Preis sich bezieht und wie wenig man kaufen kann.
  const code = EINHEITSCODES[String(artikel.einheit ?? '').toUpperCase()];
  if (code) {
    angebot.priceSpecification.referenceQuantity = {
      '@type': 'QuantitativeValue',
      value: 1,
      unitCode: code,
    };
    const schritt = mengenschritt(artikel);
    if (schritt) {
      angebot.eligibleQuantity = {
        '@type': 'QuantitativeValue',
        minValue: schritt,
        unitCode: code,
      };
    }
  }

  if (lage.versandkostenNetto != null && gebiet.vollstaendig) {
    angebot.shippingDetails = {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: Number(lage.versandkostenNetto).toFixed(2),
        currency: 'EUR',
      },
      shippingDestination: gebiet.bezirke.map((b) => ({
        '@type': 'DefinedRegion',
        addressCountry: gebiet.land,
        addressRegion: b,
      })),
    };
  }

  const daten = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: textZeile(artikel.sku),
    name: textZeile(artikel.bezeichnung),
    category: textZeile(artikel.gruppe ?? ''),
    offers: angebot,
  };
  if (artikel.gtin) daten.gtin13 = textZeile(artikel.gtin);
  if (artikel.hersteller) daten.brand = { '@type': 'Brand', name: textZeile(artikel.hersteller) };

  const fehlend = [];
  if (!artikel.gtin) fehlend.push('GTIN/EAN — für Produktfeeds verlangt');
  if (!gebiet.vollstaendig) fehlend.push(gebiet.fehlt);
  if (lage.versandkostenNetto == null) fehlend.push('Versandkosten');

  return { daten, fehlend };
}

/**
 * Auszeichnung **für den Feed** — mit der Freigabefrage davor.
 *
 * Gate 22 hält Artikel am Listendeckel zurück: Wer einen Beipackartikel
 * bewirbt, auf dem nichts verdient wird, zahlt für den Klick und verliert an
 * der Bestellung. Das ist eine Entscheidung über den **Feed**, nicht über die
 * Auszeichnung — die Artikelseite behält ihre strukturierten Daten.
 */
export function produktAuszeichnung(artikel, lage = {}) {
  const freigabe = darfVeroeffentlichtWerden(artikel);
  if (!freigabe.erlaubt) {
    return { veroeffentlichbar: false, gruende: freigabe.gruende, daten: null };
  }
  const { daten, fehlend } = angebotsAuszeichnung(artikel, lage);
  return { veroeffentlichbar: true, gruende: [], daten, fehlend };
}

/**
 * Der Katalog als Feed-Zeilen — und was dabei zurückbleibt.
 *
 * Zurückgehaltene Artikel werden gezählt und begründet, nicht verschwiegen.
 * Ein Feed, der stillschweigend die Hälfte des Katalogs weglässt, ist genau
 * die Sorte Schweigen, die dieser Bau an vier anderen Stellen schon einmal
 * gekostet hat.
 */
export function katalogFeed(artikel, lage = {}) {
  const zeilen = [];
  const zurueckgehalten = [];
  const mitLuecken = [];

  for (const a of artikel) {
    // `versandkostenNetto` darf eine Zahl **oder** eine Funktion sein.
    //
    // Der Grund ist die Ware, nicht die Bequemlichkeit: Die Fracht dieses
    // Lieferanten ist eine Pauschale je Lieferung plus einen Zuschlag je
    // Hub für palettierte Ware. Damit hängt der Betrag am Artikel — eine
    // Palette Dämmplatten kostet mehr Zustellung als ein Karton Dübel —,
    // und eine einzige Zahl für den ganzen Katalog wäre für die eine Hälfte
    // zu hoch und für die andere zu niedrig.
    //
    // Gerechnet wird auch hier nichts nach: Die Funktion liest dieselben
    // Sätze aus `data/lieferanten.json`, die der Warenkorb liest.
    const eintrag = produktAuszeichnung(a, {
      ...lage,
      versandkostenNetto: typeof lage.versandkostenNetto === 'function'
        ? lage.versandkostenNetto(a)
        : lage.versandkostenNetto,
    });
    if (!eintrag.veroeffentlichbar) {
      zurueckgehalten.push({ sku: a.sku, gruende: eintrag.gruende });
      continue;
    }
    zeilen.push(eintrag.daten);
    // Ein veröffentlichbarer Eintrag kann trotzdem unvollständig sein.
    // `produktAuszeichnung` rechnet das aus — und die erste Fassung dieser
    // Funktion hat es weggeworfen. Der Bericht meldete dann „46
    // veröffentlichbar, 0 zurückgehalten", während bei allen 46 die GTIN
    // fehlte, die dieselbe Datei zwei Zeilen höher verlangt. Genau die
    // Fehlerklasse, die diesem Vorhaben schon fünfmal Geld gekostet hat:
    // eine Angabe, die berechnet und dann verschwiegen wird.
    if (eintrag.fehlend?.length) mitLuecken.push({ sku: a.sku, fehlend: eintrag.fehlend });
  }

  return {
    zeilen,
    zurueckgehalten,
    mitLuecken,
    // „Vollständig" heißt: nichts zurückgehalten UND bei keinem Eintrag eine
    // Lücke. Ein Feed mit lückenhaften Einträgen ist nicht einreichbar.
    vollstaendig: zurueckgehalten.length === 0 && mitLuecken.length === 0,
    einreichbar: zeilen.length > 0 && mitLuecken.length === 0,
    anzahl: zeilen.length,
  };
}

/**
 * robots.txt mit bewusster Trennung von Suche und Training.
 *
 * Die beiden sind heute getrennte Kennungen. Wer pauschal alles sperrt,
 * verschwindet auch aus den Antworten — das ist der häufigste
 * Selbstschaden in diesem Feld. Wer alles erlaubt, gibt auch
 * Trainingsmaterial her. Deshalb steht die Entscheidung hier als
 * Schalter und nicht als stille Voreinstellung.
 */
export const SUCH_CRAWLER = Object.freeze(['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'Applebot']);
export const TRAININGS_CRAWLER = Object.freeze(['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot']);

export function robotsTxt({ suche = true, training = false, sitemap = null } = {}) {
  const zeilen = ['# Suche und Training sind getrennte Kennungen — siehe ki-sichtbarkeit-konzept.md'];
  for (const bot of SUCH_CRAWLER) {
    zeilen.push('', `User-agent: ${bot}`, suche ? 'Allow: /' : 'Disallow: /');
  }
  for (const bot of TRAININGS_CRAWLER) {
    zeilen.push('', `User-agent: ${bot}`, training ? 'Allow: /' : 'Disallow: /');
  }
  zeilen.push('', 'User-agent: *', 'Allow: /');
  if (sitemap) zeilen.push('', `Sitemap: ${textZeile(sitemap)}`);
  return zeilen.join('\n') + '\n';
}

/**
 * `llms.txt` — ein Wegweiser für Sprachmodelle im Wurzelverzeichnis.
 *
 * Ehrlich zum Nutzen: Es gibt **keinen Beleg**, dass die großen Anbieter die
 * Datei derzeit für Auswahl oder Zitat verwenden. Sie entsteht, weil sie eine
 * Stunde kostet und nicht schadet — nicht, weil sie wirkt. Der Nutzen liegt
 * eher darin, dass ihr Aufbau eine Frage beantwortet, die man sich sonst nicht
 * stellt: Welche fünf Seiten dieses Shops beantworten die häufigsten Fragen?
 */
export function llmsTxt({ name, beschreibung, liefergebiet, seiten = [], hinweise = [] }) {
  const gebiet = liefergebietAngabe(liefergebiet);
  const zeilen = [`# ${textZeile(name)}`, ''];
  if (beschreibung) zeilen.push(`> ${textZeile(beschreibung)}`, '');
  if (gebiet.vollstaendig) {
    zeilen.push(`Liefergebiet: ${gebiet.bezirke.join(', ')} (${gebiet.land}).`, '');
  }
  for (const h of hinweise) zeilen.push(textZeile(h));
  if (hinweise.length) zeilen.push('');
  if (seiten.length) {
    zeilen.push('## Seiten', '');
    for (const s of seiten) {
      const beschr = s.beschreibung ? `: ${textZeile(s.beschreibung)}` : '';
      zeilen.push(`- [${textZeile(s.titel)}](${textZeile(s.url)})${beschr}`);
    }
    zeilen.push('');
  }
  return zeilen.join('\n');
}
