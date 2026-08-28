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
  } = lage;

  const punkte = [];
  const p = (id, titel, zustand, befund, wer) => punkte.push({ id, titel, zustand, befund, wer });

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
  };
}
