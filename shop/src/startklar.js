/**
 * Was fehlt, bevor der Shop online gehen darf.
 *
 * **Anlass, 28. August 2026.** Der Auftraggeber hat gefragt: „shop fertig?"
 * Die Antwort stand in meinem Gedächtnis und in sieben Dokumenten — nirgends
 * an einer Stelle, und nirgends nachrechenbar.
 *
 * > **Eine Bereitschaftsauskunft, die aus dem Gedächtnis kommt, ist eine
 * > Meinung.** Sie wird optimistischer, je länger man an der Sache baut.
 *
 * Dieses Modul beantwortet die Frage aus den Daten. Es kennt drei Zustände
 * je Punkt, und der dritte ist der wichtigste:
 *
 * | Zustand | Bedeutung |
 * |---|---|
 * | `erfuellt` | aus den Daten belegt |
 * | `offen` | aus den Daten belegt, dass es fehlt |
 * | `unpruefbar` | **von hier aus nicht feststellbar** — der Auftraggeber muss es bestätigen |
 *
 * Ein Punkt, den das Werkzeug nicht prüfen kann, wird nicht stillschweigend
 * als erfüllt gezählt. Er steht als eigene Kategorie da, mit der Angabe, wer
 * ihn beantworten kann. Alles andere wäre die Sorte Auskunft, die diesem
 * Vorhaben schon fünfmal Geld gekostet hätte: eine Lücke, still mit einer
 * optimistischen Annahme gefüllt.
 */

/**
 * Welche offenen Punkte der **Kunde** auf der Kasse zu hören bekommt.
 *
 * Nicht alle. Dass das Repository noch öffentlich ist oder die Domain nicht
 * zeigt, sind Betriebsfragen — sie gehören in `npm run startklar` und nicht
 * in einen Kasten, den ein Bauleiter liest. Genannt wird, was **ihn**
 * betrifft: dass niemand zahlen kann, dass die Rechtstexte nicht verbindlich
 * sind, dass das Impressum unvollständig ist.
 *
 * Die Liste steht hier und nicht in der Oberfläche, damit die Kasse ihre
 * Begründung aus den Daten nimmt statt aus einem festen Satz. Der feste Satz
 * war bis zum 29.08. das Problem: Er zählte Zahlungsanbieter, Impressum und
 * Rechtstexte auf, und er hätte das auch noch getan, wenn der Auftraggeber
 * das Impressum längst vervollständigt hätte.
 */
const AUF_DER_KASSE = new Map([
  ['impressum', 'ein vollständiges Impressum'],
  ['zahlungsanbieter', 'ein Zahlungsanbieter'],
  ['rechtstexte', 'verbindliche Rechtstexte'],
  ['lieferzeit', 'die Lieferzeit des Lieferanten'],
]);

/** Die Punkte, die über „online" entscheiden — in der Reihenfolge ihrer Härte. */
export function startklar(lage = {}) {
  const {
    betreiber = {},
    katalog = { artikel: [] },
    preisdateiVorhanden = false,
    zahlungsanbieter = null,
    rechtstexteFundstelle = null,
    domainZeigtAufShop = null,
    repositoryPrivat = null,
    impressumsfelder = [],
    lieferanten = [],
  } = lage;

  const punkte = [];
  const p = (id, titel, zustand, befund, wer) => punkte.push({ id, titel, zustand, befund, wer,
    aufDerKasse: AUF_DER_KASSE.get(id) ?? null });

  // --- Was aus den Daten kommt ---------------------------------------
  const fehlendeFelder = impressumsfelder.filter(
    (f) => typeof betreiber[f.feld] !== 'string' || betreiber[f.feld].trim() === '',
  );
  p('impressum', 'Impressum vollständig',
    fehlendeFelder.length === 0 ? 'erfuellt' : 'offen',
    fehlendeFelder.length === 0
      ? 'alle Pflichtangaben nach § 5 ECG und § 14 UGB stehen'
      : `${fehlendeFelder.length} Pflichtangaben fehlen: ${fehlendeFelder.map((f) => f.bezeichnung).join(', ')}`,
    'Auftraggeber');

  const mitPreis = katalog.artikel.filter((a) => a.vkNetto !== null && a.vkNetto !== undefined);
  p('preise', 'Jeder geführte Artikel ist gerechnet',
    preisdateiVorhanden && mitPreis.length === katalog.artikel.length && katalog.artikel.length > 0
      ? 'erfuellt' : 'offen',
    !preisdateiVorhanden
      ? 'die Preisdatei fehlt — ohne sie hat kein Artikel einen Preis'
      : `${mitPreis.length} von ${katalog.artikel.length} Artikeln mit gerechnetem Verkaufspreis`,
    'Werkzeug');

  const platzhalter = katalog.artikel.filter((a) => a.ekIstPlatzhalter);
  p('keine-platzhalter', 'Kein Platzhalterpreis im Katalog',
    platzhalter.length === 0 ? 'erfuellt' : 'offen',
    platzhalter.length === 0
      ? 'jeder Einkaufspreis ist bestätigt'
      : `${platzhalter.length} Artikel mit Platzhalterpreis`,
    'Werkzeug');

  // **Aufgenommen am 30.08.** Die Lieferzeit ist keine Nebensache, sondern
  // die Angabe, mit der die Auftragsbestätigung einen Termin zusagt. Fehlt
  // sie, verweigert `darfBestaetigtWerden` die Bestätigung — der Shop könnte
  // also Bestellungen entgegennehmen und keine einzige annehmen. Das gehört
  // auf diese Liste, nicht in eine Fehlermeldung am Bestelltag.
  //
  // Nur Lieferanten mit geführten Artikeln zählen. Ein Lieferant ohne Ware im
  // Katalog kann nichts liefern und blockiert deshalb auch nichts.
  const gefuehrt = new Set(katalog.artikel.map((a) => a.lieferantId));
  const ohneLieferzeit = lieferanten.filter(
    (l) => gefuehrt.has(l.id) && !Number.isFinite(l.lieferzeitWerktage),
  );
  p('lieferzeit', 'Lieferzeit je liefernden Lieferanten bekannt',
    lieferanten.length > 0 && ohneLieferzeit.length === 0 ? 'erfuellt' : 'offen',
    lieferanten.length === 0
      ? 'keine Lieferanten geladen — dann sagt dieser Punkt nichts aus'
      : ohneLieferzeit.length === 0
        ? `alle ${gefuehrt.size} liefernden Lieferanten mit Lieferzeit`
        : `${ohneLieferzeit.length} ohne Lieferzeit: ${ohneLieferzeit.map((l) => l.name ?? l.id).join(', ')}`
          + ' — ohne sie darf keine Auftragsbestätigung hinaus',
    'Auftraggeber');

  p('zahlungsanbieter', 'Zahlungsanbieter gewählt und angebunden',
    zahlungsanbieter ? 'erfuellt' : 'offen',
    zahlungsanbieter
      ? `angebunden: ${zahlungsanbieter}`
      : 'keiner gewählt — die Kasse löst nichts aus und sagt das auch',
    'Auftraggeber (Ausgabe)');

  p('rechtstexte', 'Rechtstexte mit verbindlichem Wortlaut',
    rechtstexteFundstelle ? 'erfuellt' : 'offen',
    rechtstexteFundstelle
      ? `Fundstelle: ${rechtstexteFundstelle}`
      : 'AGB, Widerruf und Datenschutz stehen als Gerüst mit Begründungen, nicht als Wortlaut',
    'Auftraggeber (Ausgabe)');

  // --- Was von hier aus nicht feststellbar ist -------------------------
  const unpruefbar = (id, titel, wert, befundOffen, wer) => p(
    id, titel,
    wert === null || wert === undefined ? 'unpruefbar' : (wert ? 'erfuellt' : 'offen'),
    wert === null || wert === undefined ? befundOffen : (wert ? 'bestätigt' : 'ausdrücklich verneint'),
    wer,
  );
  unpruefbar('domain', 'Die Seite ist unter einer Adresse erreichbar', domainZeigtAufShop,
    'von hier aus nicht feststellbar — der Netzausgang dieser Umgebung ist gesperrt', 'Auftraggeber');
  unpruefbar('repository', 'Repository ist privat', repositoryPrivat,
    'von hier aus nicht feststellbar; solange es öffentlich ist, sind Einkaufspreise rekonstruierbar', 'Auftraggeber');

  const zaehle = (z) => punkte.filter((x) => x.zustand === z).length;
  return {
    punkte,
    erfuellt: zaehle('erfuellt'),
    offen: zaehle('offen'),
    unpruefbar: zaehle('unpruefbar'),
    // **„Startklar" heißt: nichts offen UND nichts ungeprüft.** Ein Punkt,
    // den niemand bestätigt hat, zählt nicht als erfüllt — sonst ginge der
    // Shop online, weil das Werkzeug nicht hinsehen konnte.
    startklar: zaehle('offen') === 0 && zaehle('unpruefbar') === 0,
    // Was die Kasse dem Kunden sagen muss: die offenen Punkte, die ihn
    // betreffen. Leer heißt, dass der Kasten wegfällt — nicht, dass er
    // trotzdem stehenbleibt und Falsches behauptet.
    kassenhinweise: punkte
      .filter((x) => x.aufDerKasse && x.zustand !== 'erfuellt')
      // `wort` ist die kundentaugliche Fassung: „ein Zahlungsanbieter" statt
      // „Zahlungsanbieter gewählt und angebunden". Die Prüflisten-Überschrift
      // in einen Satz zu setzen las sich wie ein Formular, nicht wie eine
      // Auskunft.
      .map((x) => ({ id: x.id, titel: x.titel, wort: x.aufDerKasse, befund: x.befund })),
  };
}
