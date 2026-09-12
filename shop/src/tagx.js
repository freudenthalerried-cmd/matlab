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
  /*
   * **Die siebte und achte Angabe — 12. September 2026, nachts.**
   *
   * Sie stehen auf keiner Seite und trotzdem hier. Seit dem 4. September
   * trägt die **Auftragsbestätigung** die Bankverbindung: Gate 21 hat
   * Vorkasse ab Start entschieden, und eine Bestätigung, die Zahlung sofort
   * verlangt und kein Konto nennt, ist unbrauchbar. `darfBestaetigtWerden`
   * weist sie seither ab.
   *
   * > **Der Tag X, für den dieses Haus probt, konnte keinen Vertrag
   * > schließen.** Gemessen: `npm run vorgang -- --stufe bestaetigung
   * > --ablegen` bricht mit *„Bankverbindung unvollständig (kontoinhaber,
   * > iban)"* ab — auch mit der Betreiberdatei des Tages X, denn die kannte
   * > die beiden Felder nicht.
   *
   * Die Folge hat acht Tage lang niemand gesehen, weil der eine Testfall, der
   * diese Stufe fährt, bei einem Abbruch **zurückkehrt** statt zu prüfen. Er
   * war grün und hatte nie eine abgelegte Auftragsbestätigung gesehen.
   *
   * `sichtbarIn` nennt die **Auftragsbestätigung** und keine Seite des Shops:
   * Beide gehören auf das Papier an den Kunden. Eine Kontonummer im Impressum
   * ist eine Einladung an jeden Leser.
   */
  Object.freeze({
    feld: 'kontoinhaber',
    probe: 'Freudenthaler Bau GmbH (Probe)',
    sichtbarIn: Object.freeze(['bestaetigung']),
    warum: 'Zahlung per Vorkasse ohne Anbieter braucht ein Konto, und ein Konto braucht einen '
      + 'Inhaber: Wer überweist, muss wissen, an wen. Gate 21 hat Vorkasse ab Start '
      + 'entschieden, und die Auftragsbestätigung ist das Papier, auf dem es steht.',
  }),
  Object.freeze({
    feld: 'iban',
    probe: 'AT611904300234573201',
    sichtbarIn: Object.freeze(['bestaetigung']),
    warum: 'Ohne sie kann kein Kunde per Vorkasse zahlen, und ohne Zahlung löst Gate 20 keine '
      + 'Lieferantenbestellung aus. Der Probewert ist die in der Literatur gebräuchliche '
      + 'Beispiel-IBAN und gehört keinem Konto dieses Betriebs — er steht hier, damit sich '
      + 'der Weg bis zum Vertragsschluss überhaupt fahren lässt.',
  }),
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
  /*
   * **Die sechste, gefunden am 11. September durch eine zweite Liste.**
   * `bin/bestellprobe.mjs` baute sich seit dem 4. September eine eigene
   * Betreiberdatei für denselben Tag X — mit **drei** Feldern, und eines davon
   * stand hier nicht. Zwei Listen über denselben Tag, und keine kannte die
   * andere.
   */
  Object.freeze({
    feld: 'antwortzeitWerktage',
    probe: 2,
    sichtbarIn: Object.freeze(['oberflaeche']),
    warum: 'Die einzige Zusage, die der Shop über den eigenen Betrieb macht: „Wir melden uns '
      + 'innerhalb von N Werktagen." Sie geht mit den Betreiberdaten in `shop.js` und steht '
      + 'nach dem Absenden in der Rückmeldung. Ohne sie verspricht die Kasse eine Antwort '
      + 'ohne Zeit — und eine Zusage über den eigenen Betrieb ist teurer als eine falsche Zahl.',
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
 * Leere Felder der Betreiberdatei, die im **Bau** nichts bewirken — jedes mit
 * dem Grund.
 *
 * Ohne diese Liste hätte die Prüfung zwei Möglichkeiten, und beide wären
 * falsch: jedes leere Feld im Bau zu suchen (dann scheitert sie an
 * Bestätigungen über die Welt) oder nur die aufzuzählen, die schon geführt
 * werden (dann wächst die Betreiberdatei ungeprüft weiter).
 */
export const OHNE_BAUWIRKUNG = Object.freeze([
  Object.freeze({
    feld: 'zahlungsanbieter',
    warum: 'Eine Entscheidung des Auftraggebers, die Geld kostet (Gate 21, EPS-Onlineüberweisung). '
      + 'Sie wirkt im **Ablauf** — `src/auftragslauf.js` und der Rolloutplan hängen daran —, '
      + 'aber im gebauten Shop ändert sie keine Zeile: Die Kasse löst keine Zahlung aus und '
      + 'sagt das auch. Ein Bau des Tages X könnte ihre Wirkung nirgends nachsehen.',
  }),
  Object.freeze({
    feld: 'domainZeigtAufShop',
    warum: 'Eine Bestätigung über die Welt, kein Inhalt: Ob bauversand.com auf dieses '
      + 'Verzeichnis zeigt, sieht man am Browser und nicht am Bau. `npm run startklar` führt '
      + 'sie als eigenen Punkt und sagt ausdrücklich, dass sie von hier aus nicht feststellbar '
      + 'ist — der Netzausgang dieser Umgebung ist für die Adresse gesperrt.',
  }),
  Object.freeze({
    feld: 'repositoryPrivat',
    warum: 'Ebenfalls eine Bestätigung über die Welt — und die einzige, die `npm run startklar` '
      + '**gegen** die Angabe misst: Steht dort „privat" und ist das Verzeichnis öffentlich, '
      + 'gilt die Messung und die Angabe gehört berichtigt. Im gebauten Shop kommt sie nicht vor.',
  }),
]);

/**
 * Hält die Betreiberdatei gegen beide Listen — in beide Richtungen.
 *
 * **Der Anlass.** Am 11. September führte `bin/bestellprobe.mjs` eine zweite,
 * eigene Liste für denselben Tag X. Zwei Listen über dieselbe Sache sind zwei
 * Antworten, sobald eine Angabe dazukommt.
 */
export function betreiberbefund(betreiber, angaben = OFFENE_ANGABEN, ohne = OHNE_BAUWIRKUNG) {
  const meldungen = [];
  const gefuehrt = new Set(angaben.map((a) => a.feld));
  const begruendet = new Set(ohne.map((o) => o.feld));
  const leer = Object.entries(betreiber)
    .filter(([k, v]) => !k.startsWith('_') && (v === null || v === undefined || v === ''))
    .map(([k]) => k);

  if (!leer.length) {
    return {
      leer: 0,
      meldungen: [{
        regel: 'nichts-mehr-offen',
        text: 'Kein leeres Feld in der Betreiberdatei — dieser Befund prüft nichts mehr, '
          + 'und das wäre eine gute Nachricht: Dann ist der Tag X da',
      }],
      sauber: false,
    };
  }

  for (const f of leer) {
    if (gefuehrt.has(f) || begruendet.has(f)) continue;
    meldungen.push({
      regel: 'leeres-feld-ohne-platz',
      text: `${f} ist leer und steht weder unter den offenen Angaben noch mit Grund daneben`,
    });
  }
  for (const o of ohne) {
    if (gefuehrt.has(o.feld)) {
      meldungen.push({
        regel: 'gefuehrt-und-ohne-wirkung',
        text: `${o.feld} steht als offene Angabe und zugleich als ohne Bauwirkung`,
      });
    }
    if (!o.warum || o.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', text: `${o.feld}: der Grund trägt nicht` });
    }
  }
  for (const a of angaben) {
    if (a.feld in betreiber) continue;
    meldungen.push({
      regel: 'angabe-ohne-feld',
      text: `${a.feld} steht als offene Angabe — dieses Feld gibt es in der Betreiberdatei nicht`,
    });
  }

  return { leer: leer.length, gefuehrt: gefuehrt.size, begruendet: ohne.length, meldungen, sauber: meldungen.length === 0 };
}

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
 * @param {string} lage.oberflaeche           das gebaute `shop.js` mit den Betreiberdaten
 */
export function tagxbefund({
  impressum, entitaeten, dateien, hinweis, oberflaeche = '', bestaetigung = '',
  angaben = OFFENE_ANGABEN,
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
    /*
     * **Die Auftragsbestätigung ist auch eine Stelle — 12. September 2026.**
     * Kontoinhaber und IBAN stehen auf keiner Seite des Shops und trotzdem im
     * Register: Ohne sie weist `darfBestaetigtWerden` die Bestätigung ab, und
     * damit kommt kein Vertrag zustande (AGB Punkt 2). Eine offene Angabe
     * ohne Stelle wäre eine, die niemand vermisst.
     */
    if (a.sichtbarIn.includes('bestaetigung') && !String(bestaetigung).includes(String(a.probe))) {
      meldungen.push({
        regel: 'angabe-erreicht-bestaetigung-nicht',
        text: `${a.feld} steht am Tag X nicht auf der Auftragsbestätigung — ${a.warum}`,
      });
    }
    if (a.sichtbarIn.includes('oberflaeche') && !String(oberflaeche).includes(String(a.probe))) {
      meldungen.push({
        regel: 'angabe-erreicht-oberflaeche-nicht',
        text: `${a.feld} steht am Tag X nicht in den Betreiberdaten der Oberfläche — ${a.warum}`,
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
