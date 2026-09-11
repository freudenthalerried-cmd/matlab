/**
 * Der Tag, an dem die Angaben kommen — und ob der Bestand ihn erwartet.
 *
 * **Der Anlass, 11. September 2026.** Jeder Prüfer dieses Bestandes misst den
 * Zustand von **heute**: ein Impressum mit vier Lücken, eine Entität ohne
 * UID, einen ausgeschalteten Bestellweg, sechsundvierzig Artikelseiten mit
 * dem Hinweis, was noch fehlt. Alle sind grün, und alle prüfen denselben
 * halbfertigen Stand.
 *
 * > **Jeder Prüfer misst den Zustand von heute. Der Tag, auf den alles
 * > zuläuft, ist ungeprüft.**
 *
 * An diesem Tag liefert der Auftraggeber vier Angaben — E-Mail, Telefon, UID
 * und den Gewerbewortlaut —, und daran hängt mehr, als eine Datei vermuten
 * lässt: Das Impressum wird vollständig, die maschinenlesbare Entität bekommt
 * `telephone`, `email` und `vatID`, der Bestellweg schaltet sich ein,
 * `bestellung.php` geht mit hinaus, der Hinweis auf den Artikelseiten
 * schrumpft auf das, was dann noch wirklich fehlt, und die Rechnung darf zum
 * ersten Mal entstehen.
 *
 * Nichts davon hat je jemand zusammen gesehen. Dieses Modul beschreibt, was an
 * jenem Tag gelten muss; `bin/tagxpruefung.mjs` baut den Shop mit einer
 * vollständigen Betreiberdatei in einen Wegwerfordner und hält ihn dagegen.
 *
 * ## Was hier ausdrücklich nicht passiert
 *
 * Die Werte sind **Proben, keine Angaben**. Sie stehen in keiner Datei des
 * Bestandes, gehen in keine Ausgabe und ersetzen nichts: Die echten Werte
 * kennt nur der Auftraggeber, und eine erfundene UID im Impressum wäre genau
 * der Fehler, gegen den dieser ganze Bestand gebaut ist.
 */

/**
 * Was der Auftraggeber noch schuldet — mit einer Probe und dem, was daran
 * hängt.
 *
 * `probe` ist ein plausibler Wert derselben Form; `sichtbarIn` nennt die
 * Stellen, an denen er am Tag X stehen **muss**.
 */
export const OFFENE_ANGABEN = Object.freeze([
  Object.freeze({
    feld: 'email',
    probe: 'office@bauversand.example',
    sichtbarIn: Object.freeze(['impressum', 'entitaet']),
    warum: 'Pflichtangabe nach § 5 ECG und der Weg, auf dem eine Anfrage überhaupt ankommt. '
      + 'Ohne sie bleibt der Bestellweg aus, und die Kasse erzeugt nur einen Text zum Kopieren.',
  }),
  Object.freeze({
    feld: 'telefon',
    probe: '+43 7238 00000',
    sichtbarIn: Object.freeze(['impressum', 'entitaet']),
    warum: 'Pflichtangabe nach § 5 ECG („rasche Kontaktaufnahme") und nach dem eigenen '
      + 'Sichtbarkeitskonzept eines der Felder, aus denen ein Assistent eine starke Entität '
      + 'baut.',
  }),
  Object.freeze({
    feld: 'uid',
    probe: 'ATU12345675',
    sichtbarIn: Object.freeze(['impressum', 'entitaet']),
    warum: 'Pflichtangabe nach § 11 Abs 1 Z 6 UStG. Ohne sie darf keine Rechnung entstehen — '
      + 'gemessen am 11. September bricht `npm run vorgang -- --stufe rechnung` genau daran ab.',
  }),
  /*
   * **Die fünfte Angabe ist von anderer Art — und der Prüfer hat es sofort
   * gezeigt.** Der erste Wurf führte nur die vier Impressumsangaben und
   * verlangte trotzdem, der Bestellweg schalte sich ein. Er tat es nicht:
   * `VORAUSSETZUNGEN` in `src/bestellweg.js` nennt **zwei** Felder, und das
   * zweite ist die Fundstelle der Rechtstexte.
   *
   * > **Der Tag X ist kein Tag.** Die vier Angaben kosten den Auftraggeber
   * > einen Anruf; die Rechtstexte kosten Geld und gehören zu einem anderen
   * > offenen Punkt. Wer beides in einen Topf wirft, hält den Shop für einen
   * > Anruf entfernt von der ersten Bestellung.
   */
  Object.freeze({
    feld: 'rechtstexteFundstelle',
    probe: 'rechtliches/datenschutz.html',
    sichtbarIn: Object.freeze(['bestellweg']),
    warum: 'Zweite Voraussetzung des Bestellwegs neben der E-Mail-Adresse: Solange der '
      + 'Datenschutztext nur als Gliederung dasteht, sagt die Seite „wird nicht an den Server '
      + 'übertragen" — und das wäre mit eingeschaltetem Weg eine geprüfte Unwahrheit. Diese '
      + 'Angabe kostet Geld und steht deshalb in einem anderen offenen Punkt als die vier '
      + 'darüber.',
  }),
  Object.freeze({
    feld: 'gewerbewortlaut',
    probe: 'Handelsgewerbe mit Baustoffen',
    sichtbarIn: Object.freeze(['impressum']),
    warum: 'Pflichtangabe nach § 5 ECG: der Wortlaut des angemeldeten Gewerbes. Er steht im '
      + 'Impressum und nirgends sonst — in der Entität hat er kein Feld.',
  }),
]);

/**
 * Baut aus der heutigen Betreiberdatei die des Tages X.
 *
 * **Nur die offenen Angaben werden gesetzt.** Alles andere bleibt, wie es ist
 * — sonst prüfte der Lauf einen Bestand, den es nie geben wird.
 */
export function betreiberAmTagX(heute, angaben = OFFENE_ANGABEN) {
  const voll = { ...heute };
  for (const a of angaben) voll[a.feld] = a.probe;
  return voll;
}

/**
 * Hält den am Tag X gebauten Shop gegen das, was dann gelten muss.
 *
 * @param {object} lage
 * @param {string} lage.impressum            der Text der Impressumsseite
 * @param {object[]} lage.entitaeten         jeder Organisationsblock der Ausgabe
 * @param {string[]} lage.dateien            die Dateinamen im Auslieferungsordner
 * @param {string} lage.hinweis              der Hinweis auf einer Artikelseite
 */
export function tagxbefund({
  impressum, entitaeten, dateien, hinweis, angaben = OFFENE_ANGABEN,
}) {
  const meldungen = [];

  if (!angaben.length) {
    return {
      angaben: 0,
      meldungen: [{
        regel: 'keine-offene-angabe',
        text: 'Keine einzige offene Angabe — dieser Befund prüft nichts',
      }],
      sauber: false,
    };
  }
  if (!entitaeten.length) {
    meldungen.push({
      regel: 'keine-entitaet',
      text: 'Kein Organisationsblock in der Ausgabe des Tages X',
    });
  }

  for (const a of angaben) {
    if (a.sichtbarIn.includes('impressum') && !impressum.includes(a.probe)) {
      meldungen.push({
        regel: 'angabe-erreicht-impressum-nicht',
        text: `${a.feld} steht am Tag X nicht im Impressum — ${a.warum}`,
      });
    }
    if (!a.sichtbarIn.includes('entitaet')) continue;
    const fehlend = entitaeten.filter((e) => !JSON.stringify(e).includes(a.probe));
    if (fehlend.length) {
      meldungen.push({
        regel: 'angabe-erreicht-entitaet-nicht',
        text: `${a.feld} fehlt am Tag X in ${fehlend.length} von ${entitaeten.length} `
          + 'Organisationsblöcken — ein Assistent liest die Blöcke der Artikelseiten, '
          + 'nicht den der Startseite',
      });
    }
  }

  /*
   * **Der Bestellweg ist die Folge, an der alles hängt.** Er schaltet sich
   * ein, sobald E-Mail und Rechtstextefundstelle dastehen — und erst dann
   * wird aus einem Text zum Kopieren eine Bestellung, die ankommt. Geprüft
   * wird er nur, wenn eine Angabe ihn für sich beansprucht: Eine Liste ohne
   * die Fundstelle der Rechtstexte darf ihn nicht verlangen.
   */
  const wegErwartet = angaben.some((a) => a.sichtbarIn.includes('bestellweg'));
  if (wegErwartet && !dateien.includes('bestellung.php')) {
    meldungen.push({
      regel: 'bestellweg-bleibt-aus',
      text: 'bestellung.php geht am Tag X nicht mit hinaus — der Shop nimmt weiter keine '
        + 'Bestellung an, obwohl die Angaben dastehen',
    });
  }

  /*
   * **Und der Hinweis muss schrumpfen.** Er zählt auf, was fehlt; nennt er am
   * Tag X noch eine gelieferte Angabe, steht auf sechsundvierzig Artikelseiten
   * eine Unwahrheit — und zwar eine, die den Besteller abhält.
   */
  for (const a of angaben) {
    const wort = a.feld === 'gewerbewortlaut' ? 'Gewerbe' : a.feld;
    if (new RegExp(wort, 'i').test(hinweis)) {
      meldungen.push({
        regel: 'hinweis-nennt-gelieferte-angabe',
        text: `Der Hinweis auf den Artikelseiten nennt am Tag X noch „${wort}" als fehlend`,
      });
    }
  }

  return {
    angaben: angaben.length,
    entitaeten: entitaeten.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
