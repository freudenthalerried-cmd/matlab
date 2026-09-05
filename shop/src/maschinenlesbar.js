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

import { textZeile, EINHEITEN } from './format.js';
import { istGtin } from './artikelliste.js';
import { HERSTELLER, marke } from './hersteller.js';
import { mengenschritt, packungsgewichtKg } from './gebinde.js';
import { KENNUNGEN } from './crawler.js';

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
 * Das Liefergebiet als benannte Orte statt als Zeichenkette.
 *
 * **Gemessen am 30.08.** Die Startseite trug
 * `areaServed: 'Bezirk Perg, Urfahr-Umgebung, Freistadt, Linz, Linz-Land'` —
 * fest im Quelltext, neben der Entscheidung in `LIEFERGEBIET`. Zwei Wege zur
 * selben Angabe, und die Reihenfolge wich schon voneinander ab.
 *
 * Zweitens ist eine Aufzählung in einem Textfeld für einen maschinellen Leser
 * ein Satz, keine Liste: „Bezirk Perg, Urfahr-Umgebung, …" liest sich, als sei
 * nur das erste ein Bezirk. Der Shop weiß es genauer — jeder Bezirk steht mit
 * Namen, Bundesland und Begründung in der Entscheidung.
 *
 * `AdministrativeArea` mit `addressRegion` und `addressCountry`: dieselbe
 * Form, die `shippingDestination` im Angebot längst benutzt.
 *
 * @returns {object[]|null} die Orte, oder null wenn das Gebiet unbeziffert ist
 */
export function liefergebietOrte(gebiet) {
  const angabe = liefergebietAngabe(gebiet);
  if (!angabe.vollstaendig) return null;
  return angabe.bezirke.map((name) => ({
    '@type': 'AdministrativeArea',
    name,
    address: {
      '@type': 'PostalAddress',
      addressRegion: name,
      addressCountry: angabe.land,
    },
  }));
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
/**
 * Die absolute Adresse einer Artikelseite — aus dem, was der Aufrufer gibt.
 *
 * Nur absolute Adressen: Eine relative Adresse ist in einem Feed und in einer
 * maschinellen Auskunft wertlos, weil dort kein Dokument steht, auf das sie
 * sich beziehen könnte. Was nicht mit http beginnt, gilt als nicht vorhanden
 * und wird gemeldet.
 */
/**
 * Der Herstellername aus der Artikelbezeichnung.
 *
 * Die Zuordnung liegt in `hersteller.js`, damit Seite und Feed dieselbe
 * benutzen. Gefunden wird nur als ganzes Wort und die längste Marke zuerst —
 * die Begründung steht dort.
 */
export function herstellerNameAus(bezeichnung) {
  const kuerzel = marke(String(bezeichnung ?? ''));
  return kuerzel ? textZeile(HERSTELLER[kuerzel].name) : null;
}

/**
 * Die Feedbeschreibung — aus Katalogfeldern, nicht aus Fantasie.
 *
 * Was hier steht, steht auch auf der Artikelseite. Was dort nicht steht,
 * steht hier nicht: keine Verbrauchsangaben, keine Schichtdicken, keine
 * Verarbeitungshinweise. Die gehören ins Merkblatt des Herstellers und ändern
 * sich dort — dieselbe Regel wie auf der Seite.
 */
/* ------------------------------------------------------------------ *
 * Die Schablone mit eingesetztem Namen — 5. September 2026, abends
 *
 * **Gemessen.** Über die 46 gebauten Artikelseiten ergibt die
 * `description` in der JSON-LD **neun** verschiedene Fassungen, und die neun
 * unterscheiden sich ausschließlich im Wort hinter „Verkaufseinheit":
 *
 * ```
 * <Name>. Warengruppe <Gruppe>. Verkaufseinheit Stück. Preis netto für
 * Unternehmer, Umsatzsteuer wird getrennt ausgewiesen.
 * ```
 *
 * Name und Gruppe stehen als `name` und `category` **im selben Datensatz**
 * direkt daneben. Was die Beschreibung eigenständig beiträgt, sind zwei
 * Wörter zur Verkaufseinheit und ein Satz, der auf allen 46 identisch ist.
 *
 * > **Die 46 Produktbeschreibungen für Maschinen sind eine Schablone mit
 * > eingesetztem Namen — und der Name steht darüber im Feld `name`.**
 *
 * Der Kommentar oben hatte die richtige Hälfte der Regel: „Was hier steht,
 * steht auch auf der Artikelseite. Was dort nicht steht, steht hier nicht."
 * Die andere Hälfte fehlte: **Was dort steht und belegt ist, steht hier
 * auch.** Die Seite trägt Abgabemenge, Packungsgewicht, Preisstand und die
 * Sperrgut-Einstufung samt ihrer Herkunft — die strukturierte Auskunft, für
 * die dieses Vorhaben ausdrücklich optimiert wird, trug keines davon.
 *
 * Erfunden wird weiterhin nichts: Jede ergänzte Angabe kommt aus einem
 * Katalogfeld oder aus einer Funktion, die schon die Seite füttert.
 * ------------------------------------------------------------------ */

export function feedbeschreibung(artikel, einheiten = EINHEITEN) {
  const name = textZeile(artikel.bezeichnung ?? '');
  if (!name) return null;
  const teile = [name];
  const gruppe = textZeile(artikel.gruppe ?? '');
  if (gruppe) teile.push(`Warengruppe ${gruppe}`);

  const einheit = einheiten[String(artikel.einheit ?? '').toUpperCase()] ?? null;
  // Verkaufseinheit und Abgabemenge in einem Satz: Der Kunde bestellt nicht
  // „einen Quadratmeter", sondern Platten zu 0,75 m². Dieselbe Zahl steht auf
  // der Artikelseite als „Abgabe ab 0,75 m²" und kommt aus derselben Funktion.
  const schritt = mengenschritt(artikel);
  if (einheit && schritt != null) {
    teile.push(`Verkaufseinheit ${einheit}, Abgabe ab ${String(schritt).replace('.', ',')} ${einheit}`);
  } else if (einheit) {
    teile.push(`Verkaufseinheit ${einheit}`);
  }

  // Das Gewicht der kleinsten lieferbaren Packung — wo es sich sagen lässt.
  // `null` heißt unbekannt und wird nicht zu einer Null gerundet.
  const gewicht = packungsgewichtKg(artikel);
  if (gewicht != null) {
    teile.push(`Kleinste Abgabemenge ${String(gewicht).replace('.', ',')} kg`);
  }

  // **Mit ihrer Herkunft, nicht ohne.** Dieselbe Auskunft wie auf der
  // Artikelseite, in `llms.txt`, in der Kasse und seit heute auf der
  // Lieferseite: Die Einstufung entscheidet 7,50 € je Position, und sie ist
  // geschätzt. Eine maschinenlesbare Auskunft, die das verschweigt, wird von
  // Assistenten als Tatsache weitergegeben.
  if (artikel.sperrgut) {
    teile.push('Palettierte Ware, Kranentladung je Hub — die Einstufung folgt '
      + 'aus der Warengruppe und nicht aus einer Angabe des Lieferanten');
  }

  const stand = textZeile(artikel.preisStand ?? '');
  if (stand) teile.push(`Preisstand ${stand}`);

  teile.push('Preis netto für Unternehmer, Umsatzsteuer wird getrennt ausgewiesen');
  return `${teile.join('. ')}.`;
}

/**
 * Hält jede Beschreibung gegen die Felder, die neben ihr stehen.
 *
 * **Die Zusicherung, und nur sie:** Jede Beschreibung nennt mindestens eine
 * Angabe, die **kein anderes Feld** des Datensatzes trägt. Name gehört zu
 * `name`, Warengruppe zu `category`, der Netto-Satz zu
 * `valueAddedTaxIncluded` — was nach deren Abzug übrig bleibt, ist der eigene
 * Beitrag. Bleibt nichts übrig, ist die Beschreibung eine Schablone.
 *
 * **Was dieser Prüfer ausdrücklich nicht verlangt: dass sich je zwei
 * Beschreibungen unterscheiden.** Der erste Wurf tat das und meldete acht
 * Gruppen — darunter XPS 30, 50 und 80 mm, alle 0,75 m², alle palettiert,
 * gleicher Preisstand. Ihr Unterschied *ist* die Dicke, und die steht im
 * Namen. Sie auseinanderzuschreiben hieße, Eigenschaften zu erfinden, und
 * erfundene Eigenschaften sind bei Baustoffen der teuerste Fehler.
 *
 * > **Ein Prüfer, der acht richtige Fälle anschwärzt, wird abgeschaltet — und
 * > meldet dann auch den echten nicht mehr.**
 *
 * Die Zahl der verschiedenen Beschreibungen wird gemessen und **berichtet,
 * nicht bewertet**: Ob zwei Platten sich unterscheiden müssen, entscheidet
 * der Katalog und nicht dieses Werkzeug.
 *
 * @param {object[]} artikel
 * @param {number} mindestens  weniger Artikel prüfen nichts
 */
export function beschreibungsbefund(artikel = [], mindestens = 20) {
  const meldungen = [];
  const kerne = new Set();

  for (const a of artikel) {
    const text = feedbeschreibung(a);
    if (!text) {
      meldungen.push({ regel: 'ohne-beschreibung', sku: a.sku, text: `${a.sku}: keine Beschreibung` });
      continue;
    }
    if (a.sperrgut && !/aus der Warengruppe/.test(text)) {
      meldungen.push({
        regel: 'einstufung-ohne-herkunft',
        sku: a.sku,
        text: `${a.sku}: nennt die Kranentladung und nicht, woher die Einstufung kommt`,
      });
    }

    const saetze = text.replace(/\.$/, '').split('. ');
    const eigen = saetze.filter((satz) => !satz.startsWith(String(a.bezeichnung ?? '§'))
      && !satz.startsWith(`Warengruppe ${a.gruppe ?? '§'}`)
      && !satz.startsWith('Verkaufseinheit')
      && !satz.startsWith('Preis netto für Unternehmer'));
    kerne.add(eigen.join('. '));

    if (eigen.length === 0) {
      meldungen.push({
        regel: 'nichts-eigenes',
        sku: a.sku,
        text: `${a.sku}: die Beschreibung sagt nichts, was nicht schon in name, category `
          + 'und den Preisfeldern danebensteht',
      });
    }
  }

  if (artikel.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-artikel',
      text: `nur ${artikel.length} Artikel geprüft, erwartet mindestens ${mindestens}`,
    });
  }

  return {
    artikel: artikel.length,
    verschieden: kerne.size,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

export function adresseVon(quelle, artikel) {
  const roh = typeof quelle === 'function' ? quelle(artikel) : quelle;
  const text = textZeile(roh ?? '');
  return /^https?:\/\/\S+$/.test(text) ? text : null;
}

export function angebotsAuszeichnung(artikel, lage = {}) {
  const gebiet = liefergebietAngabe(lage.liefergebiet);
  // `seitenadresse` darf eine Zeichenkette **oder** eine Funktion sein —
  // dieselbe Form wie `versandkostenNetto` weiter unten und aus demselben
  // Grund: Die Adresse hängt am Artikel, und der Aufrufer kennt den Aufbau
  // seiner Seiten. Erfunden wird sie hier nicht.
  const seitenadresse = adresseVon(lage.seitenadresse, artikel);
  const angebot = {
    '@type': 'Offer',
    priceCurrency: 'EUR',
    // Der Preis kommt aus kalkuliere(), er wird hier nicht neu gerechnet.
    price: artikel.vkNetto.toFixed(2),
    // **Kein `?? null`, sondern gar kein Schlüssel.** Bis wann ein Preis gilt,
    // hängt an der nächsten Liste des Lieferanten und ist nicht bekannt; ein
    // erfundenes Datum wäre eine Zusage. Ein ausdrückliches `null` ist aber
    // auch keine Antwort, sondern eine ungültige — die Prüfwerkzeuge für
    // strukturierte Daten weisen es zurück, während ein fehlender Schlüssel
    // schlicht nichts behauptet.
    //
    // **Berichtigt am 31.08.** `bin/website.mjs` wusste das und setzte den
    // Wert beim Zusammenbauen der Artikelseite auf `undefined` zurück, mit
    // genau dieser Begründung im Kommentar. `katalogFeed` — der Erzeuger des
    // Google-Shopping-Feeds — wusste es nicht: Dort standen 43 Nullen. Die
    // Berichtigung gehört an die Quelle, nicht an einen von zwei Abnehmern.
    //
    // Dieselbe Form wie `gtin13` und `versandkostenNetto` weiter unten: Was
    // nicht bekannt ist, bekommt keinen Schlüssel.
    ...(lage.preisGueltigBis ? { priceValidUntil: lage.preisGueltigBis } : {}),
    availability: artikel.lieferbar === false
      ? 'https://schema.org/OutOfStock'
      : VERFUEGBARKEIT,
    itemCondition: 'https://schema.org/NewCondition',
    // **Die Adresse der Artikelseite.** Sie fehlte bis zum 01.09. überall:
    // im JSON-LD der Seite, im Feed und in der Lückenliste. Für einen
    // Produktfeed ist `link` eine **Pflichtangabe** — ein Feed ohne sie wird
    // abgelehnt, genau wie einer ohne GTIN. Die Lückenliste kannte das Feld
    // nicht und hätte den Feed an dem Tag, an dem die Kennungen eintreffen,
    // als vollständig gemeldet und die Ablehnung dem Auftraggeber überlassen.
    //
    // Für den zweiten Kanal wiegt es ebenso schwer: Ein Sprachmodell, das
    // diese Auszeichnung liest, hat ohne `url` keinen Verweis, den es
    // zurückgeben könnte. Ein Produkt, auf das man nicht zeigen kann, ist für
    // eine Auskunft nicht da.
    //
    // Wie bei `gtin13` und `priceValidUntil`: Was nicht bekannt ist, bekommt
    // keinen Schlüssel — und wird stattdessen gemeldet.
    ...(seitenadresse ? { url: seitenadresse } : {}),
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

  // **Der Preisstand, seit dem 5. September auch hier.** Jede
  // menschenlesbare Fläche nennt ihn — Artikelseite, `llms.txt`,
  // Anfragetext, Beleg. Die strukturierte Auskunft nannte kein Datum.
  //
  // `validFrom` und ausdrücklich **nicht** `priceValidUntil`: Der Preisstand
  // ist das Datum der Lieferantenliste, aus der er stammt — „gilt ab". Bis
  // wann er gilt, hängt an der nächsten Liste und ist nicht bekannt; die
  // Begründung dafür steht zwanzig Zeilen weiter oben und gilt weiter.
  if (typeof artikel.preisStand === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(artikel.preisStand)) {
    angebot.priceSpecification.validFrom = artikel.preisStand;
  }

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

  // **Der Mindestbestellwert, ab dem eine Bestellung überhaupt angenommen wird**
  // — Gate 25, ergänzt am 3. September 2026.
  //
  // `eligibleTransactionVolume` ist das Feld, das schema.org dafür führt, und
  // es ist nicht dasselbe wie `eligibleQuantity`: jenes sagt, **wie wenig
  // Ware** man kaufen kann (der Gebindeschritt), dieses, **wie klein der
  // Vorgang** sein darf. Die beiden standen bis heute nebeneinander, und nur
  // das erste war ausgezeichnet.
  //
  // > **Ein Angebot, das seine Untergrenze nicht nennt, wird für Anfragen
  // > empfohlen, die es ablehnt.**
  //
  // Gemessen wird je Lieferung, nicht je Warenkorb — deshalb steht der Wert am
  // Angebot des einzelnen Artikels und nicht an einer Seite.
  if (lage.mindestbestellwertNetto != null && Number(lage.mindestbestellwertNetto) > 0) {
    angebot.eligibleTransactionVolume = {
      '@type': 'PriceSpecification',
      minPrice: Number(lage.mindestbestellwertNetto).toFixed(2),
      priceCurrency: 'EUR',
      valueAddedTaxIncluded: false,
    };
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
    // Der Knoten bekommt seine eigene Kennung, damit ein Leser ihn wieder
    // findet und zwei Auszeichnungen desselben Artikels nicht als zwei
    // Produkte zählen.
    ...(seitenadresse ? { '@id': seitenadresse } : {}),
    sku: textZeile(artikel.sku),
    name: textZeile(artikel.bezeichnung),
    category: textZeile(artikel.gruppe ?? ''),
    offers: angebot,
  };
  // **Nur eine gültige Kennung geht hinaus.** `artikelliste.js` weist eine
  // GTIN mit falscher Prüfziffer schon beim Einlesen zurück; hier steht die
  // zweite Sperre, weil der Katalog auch aus älteren Quellen stammen kann und
  // eine falsche Kennung im Feed schlimmer ist als gar keine — sie kann eine
  // andere Ware bezeichnen.
  if (istGtin(artikel.gtin)) daten.gtin13 = textZeile(artikel.gtin);

  // **Die Marke — und woher sie kommt.** `artikel.hersteller` steht in
  // **keinem** der 46 Katalogartikel; die Marke steckt in der
  // Lieferantenbezeichnung („Mantelstein MSTS EZ 16-18 SIKM"). Bis zum 01.09.
  // las diese Zeile nur das Feld, das es nicht gibt — jede Artikelseite trug
  // ihre Marke, jede der 43 Feedzeilen trug keine, weil die Zuordnung im
  // Bauwerkzeug lag statt hier.
  const markenname = artikel.hersteller
    ? textZeile(artikel.hersteller)
    : herstellerNameAus(artikel.bezeichnung);
  if (markenname) daten.brand = { '@type': 'Brand', name: markenname };

  // **Beschreibung — Pflichtangabe im Produktfeed.** Zusammengesetzt aus dem,
  // was der Katalog führt, und aus nichts sonst: Bezeichnung, Warengruppe,
  // Verkaufseinheit, Preisbezug. Ein Werbetext wäre hier erfunden, und
  // erfundene Eigenschaften sind bei Baustoffen der teuerste Fehler — sie
  // lesen sich wie eine Zusicherung.
  const beschreibung = feedbeschreibung(artikel);
  if (beschreibung) daten.description = beschreibung;

  const fehlend = [];
  if (!istGtin(artikel.gtin)) {
    fehlend.push(artikel.gtin
      ? `GTIN/EAN „${textZeile(artikel.gtin)}" — die Prüfziffer geht nicht auf`
      : 'GTIN/EAN — für Produktfeeds verlangt');
  }
  if (!gebiet.vollstaendig) fehlend.push(gebiet.fehlt);
  if (lage.versandkostenNetto == null) fehlend.push('Versandkosten');
  if (!seitenadresse) {
    fehlend.push(lage.seitenadresse
      ? 'Adresse der Artikelseite — keine absolute Adresse (http…)'
      : 'Adresse der Artikelseite — für Produktfeeds verlangt');
  }
  // **Kein Ratespiel.** 20 der 43 Bezeichnungen tragen keine Marke, die
  // `hersteller.js` belegen kann — teils weil die Ware keine hat ("PVC
  // Kanalbogen NW 100"), teils weil der Name da ist und die Zuordnung fehlt
  // ("Ravenit", "Ökotherm", "SunCore"). Welcher Fall vorliegt, ist aus der
  // Bezeichnung nicht entscheidbar, und einen Hersteller zu erraten wäre bei
  // Baustoffen der teuerste Fehler: Er stünde als Zusicherung im Feed.
  // Gemeldet wird deshalb, was zutrifft — nicht bestimmbar.
  if (!markenname) fehlend.push('Marke — aus der Bezeichnung nicht bestimmbar; für Markenware verlangt');
  // **Das Bild ist die dritte Pflichtangabe, und die einzige, die hier
  // niemand schließen kann.** Der Shop führt Zeichnungen als eingebettetes
  // SVG, keine Produktfotos. Ein Platzhalter im Feed wäre keine Lösung,
  // sondern ein Grund mehr für die Ablehnung: Das Bild muss die Ware zeigen.
  // Gemeldet statt gefüllt — wie die GTIN eine Beschaffungsaufgabe.
  const bild = adresseVon(lage.bildadresse, artikel);
  if (bild) daten.image = bild;
  else fehlend.push('Produktbild — für Produktfeeds verlangt, muss die Ware zeigen');

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
 * robots.txt — gerendert aus dem Crawler-Register, nicht aus zwei flachen
 * Listen.
 *
 * **Umgestellt am 2. September.** Hier standen `SUCH_CRAWLER` und
 * `TRAININGS_CRAWLER` als Zeichenkettenlisten ohne Begründung je Kennung — die
 * einzige Entscheidung im Bestand ohne Register. Beim Aufschreiben der Gründe
 * in `crawler.js` fielen zwei Löcher auf, die in einer Liste aus Zeichenketten
 * nicht sichtbar sein konnten: Apples Trainingskennung fehlte ganz, und
 * `Google-Extended` war als Training geführt, obwohl daneben keine erlaubte
 * Suchkennung stand. Die beiden Namen bleiben als **abgeleitete Sichten** auf
 * das Register bestehen, damit die Proben, die an ihnen hängen, weiter greifen.
 */
export const SUCH_CRAWLER = Object.freeze(
  KENNUNGEN.filter((k) => k.zweck === 'suche').map((k) => k.kennung),
);
export const TRAININGS_CRAWLER = Object.freeze(
  KENNUNGEN.filter((k) => k.zweck === 'training').map((k) => k.kennung),
);

/**
 * @param {{suche?: boolean, training?: boolean, sitemap?: string|null}} wahl
 *   `suche` und `training` sind **Übersteuerungen**, keine Voreinstellungen:
 *   Bleiben sie weg, entscheidet der Zugang, der im Register bei der Kennung
 *   steht. Sie bestehen weiter, weil eine Sperre möglich sein muss, ohne das
 *   Register umzuschreiben — aber sie ist dann ausdrücklich zu wählen.
 */
export function robotsTxt({ suche, training, sitemap = null } = {}) {
  const uebersteuert = { suche, nutzer: undefined, training };
  const zeilen = ['# Wen dieser Shop einlässt — Register und Gründe in src/crawler.js'];
  for (const k of KENNUNGEN) {
    const schalter = uebersteuert[k.zweck];
    const offen = schalter === undefined ? k.zugang === 'erlaubt' : schalter;
    zeilen.push('', `User-agent: ${k.kennung}`, offen ? 'Allow: /' : 'Disallow: /');
  }
  // Die Sammelzeile ist die Voreinstellung für alles Unbenannte. Sie steht
  // absichtlich am Ende und absichtlich auf `Allow`: Ein Shop, der gefunden
  // werden will, sperrt nicht, was er nicht kennt.
  zeilen.push('', 'User-agent: *', 'Allow: /');
  if (sitemap) zeilen.push('', `Sitemap: ${textZeile(sitemap)}`);
  return zeilen.join('\n') + '\n';
}
