/**
 * Worauf sich dieser Bestand beruft — und was davon belegt ist.
 *
 * **Der Anlass, 9. September 2026, nachts.** Die Runde davor hat gemessen,
 * dass das Rechtsinformationssystem des Bundes aus dieser Umgebung gesperrt
 * ist. Daraus folgt ein Satz, der vorher nirgends stand:
 *
 * > **Keine einzige Paragraphenangabe dieses Bestands ist am Volltext
 * > belegt.** Sie stehen als Fachwissen da, nicht als Zitat.
 *
 * Gezählt: **126 Nennungen von 21 verschiedenen Fundstellen**, verteilt über
 * Quelltexte, Register und Inhaltsseiten. Vier davon zitieren § 11 Abs 1 UStG
 * mit vier verschiedenen Ziffern — Z 2 für die Angaben des Empfängers, Z 3
 * für die des Ausstellers, Z 4 für das Ausstellungsdatum, Z 5 für die
 * fortlaufende Nummer. **Das ist in sich stimmig**, und genau das ist das
 * Unangenehme: Eine Nummerierung, die zueinander passt, sieht geprüft aus.
 * Stimmt die Aufteilung nicht, sind alle sechs Pflichtgründe daneben, die
 * darauf zeigen — und in diesem Bestand trägt ein Pflichtgrund Gewicht.
 *
 * ## Was diese Liste tut und was nicht
 *
 * Sie **belegt nichts**. Sie sammelt die Behauptungen an einer Stelle, sagt zu
 * jeder, was genau sie behauptet, und hält fest, dass keine geprüft ist. Damit
 * wird aus „126 verstreuten Paragraphen" eine Liste, die ein
 * Rechtstexteanbieter in einer Sitzung abhaken kann — die Fundstelle, die
 * Behauptung, und der Ort, an dem sie wirkt.
 *
 * `npm run pruefe-recht` hält sie gegen den Bestand, in beide Richtungen:
 * Eine Fundstelle ohne Eintrag fällt auf, ein Eintrag ohne Fundstelle auch.
 */

/** Was auf einem Kundenpapier steht, wiegt schwerer als ein Kommentar. */
export const WIRKUNG = Object.freeze({
  beleg: 'steht auf einem Papier, das der Kunde bekommt',
  seite: 'steht auf einer ausgelieferten Seite',
  pflichtgrund: 'trägt einen Pflichtgrund in einem Register',
  erklaerung: 'erklärt eine Entwurfsentscheidung im Quelltext',
});

/**
 * Jede Fundstelle einmal, mit dem, was sie behauptet.
 *
 * `belegt` ist überall `false`, und das ist kein Versehen: Der Volltext ist
 * aus dieser Umgebung nicht abrufbar (siehe `AUSSENGRENZEN`,
 * `rechtsinformationssystem`). Sobald jemand eine Stelle am Gesetzestext
 * geprüft hat, gehört hier das Datum hin — und dann ist `belegt` eine
 * Aussage über einen Handgriff, nicht über ein Gefühl.
 */
export const RECHTSGRUENDE = Object.freeze([
  Object.freeze({
    zitat: '§ 11 UStG',
    behauptung: 'Regelt, wann eine Rechnung auszustellen ist und was sie enthalten muss.',
    wirkung: 'beleg',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 Abs 1 UStG',
    behauptung: 'Die Aufzählung dessen, was eine Rechnung über 400 € brutto enthalten muss. '
      + 'Auf ihre Ziffern zeigen die vier Einträge darunter.',
    wirkung: 'erklaerung',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 Abs 1 Z 2 UStG',
    behauptung: 'Name und Anschrift des Leistungsempfängers gehören auf die Rechnung; '
      + 'über 10.000 € brutto zusätzlich seine UID.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 Abs 1 Z 3 UStG',
    behauptung: 'Name und Anschrift des liefernden Unternehmers gehören auf die Rechnung, '
      + 'und über 400 € brutto seine UID.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 Abs 1 Z 4 UStG',
    behauptung: 'Die Rechnung trägt ein Ausstellungsdatum.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  // **Nachgetragen am 11. September 2026**, mit der Rechnungsstufe des
  // Vorgangswerkzeugs: Ohne die UID-Nummer des Ausstellers darf keine
  // Rechnung entstehen, und sie fehlt in `data/betreiber.json` bis heute.
  Object.freeze({
    zitat: '§ 11 Abs 1 Z 6 UStG',
    behauptung: 'Die Rechnung trägt die UID-Nummer des Ausstellers.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 Abs 1 Z 5 UStG',
    behauptung: 'Die Rechnungsnummer ist fortlaufend und einmalig.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  // **Nachgetragen am 11. September 2026, abends**, mit der Durchschrift: Bis
  // dahin schrieb `--ablegen` eine Journalzeile und druckte den Beleg auf den
  // Bildschirm. Die Aufbewahrungspflicht trifft den **Aussteller**, nicht nur
  // den Empfänger — und sie trifft den Beleg, nicht die Zeile über ihn.
  Object.freeze({
    zitat: '§ 11 Abs 2 UStG',
    behauptung: 'Der Aussteller bewahrt eine Durchschrift oder Abschrift jeder von ihm '
      + 'ausgestellten Rechnung sieben Jahre auf.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 Abs 6 UStG',
    behauptung: 'Bis 400 € brutto genügt die Kleinbetragsrechnung mit weniger Angaben.',
    wirkung: 'beleg',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 131 BAO',
    behauptung: 'Aufzeichnungen sind so zu führen, dass sie nachvollziehbar bleiben.',
    wirkung: 'erklaerung',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 131 Abs 1 Z 2 BAO',
    behauptung: 'Eintragungen erfolgen zeitgerecht und in der Zeitfolge.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 131 Abs 1 Z 5 BAO',
    behauptung: 'Zu jedem Geschäftsfall gehört ein Beleg, und er bleibt rückführbar.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 131 Abs 1 Z 6 BAO',
    behauptung: 'Der ursprüngliche Inhalt einer Eintragung muss feststellbar bleiben; '
      + 'Änderungen dürfen ihn nicht unlesbar machen.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 132 BAO',
    behauptung: 'Bücher, Aufzeichnungen und Belege sind sieben Jahre aufzubewahren, '
      + 'gerechnet ab Ende des Wirtschaftsjahres.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 5 ECG',
    behauptung: 'Ein Diensteanbieter hält bestimmte Angaben ständig leicht zugänglich bereit '
      + '— das Impressum.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 5 E-Commerce-Gesetz',
    behauptung: 'Dieselbe Pflicht wie § 5 ECG, ausgeschrieben statt abgekürzt — auf einer '
      + 'Seite, die ein Mensch liest.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 14 UGB',
    behauptung: 'Geschäftsbriefe und Bestellscheine tragen Firma, Rechtsform, Sitz und '
      + 'Firmenbuchnummer.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 14 Unternehmensgesetzbuch',
    behauptung: 'Dieselbe Pflicht, ausgeschrieben statt abgekürzt — auf einer Seite, die '
      + 'ein Mensch liest.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 25 MedienG',
    behauptung: 'Eine wiederkehrende Website nennt Medieninhaber, Herausgeber und die '
      + 'grundlegende Richtung — die Offenlegung.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 377 UGB',
    behauptung: 'Der unternehmerische Käufer hat die Ware zu untersuchen und Mängel '
      + 'unverzüglich zu rügen, sonst gilt sie als genehmigt.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 377 Abs 2 UGB',
    behauptung: 'Wird die Rüge unterlassen, gilt die Ware als genehmigt.',
    wirkung: 'erklaerung',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 862 ABGB',
    behauptung: 'Ein Angebot bindet den Antragsteller bis zum Ablauf der gesetzten Frist.',
    wirkung: 'seite',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 864a ABGB',
    behauptung: 'Eine ungewöhnliche Bestimmung in Allgemeinen Geschäftsbedingungen wird nicht '
      + 'Vertragsinhalt, wenn der andere Teil mit ihr nicht rechnen musste.',
    wirkung: 'pflichtgrund',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 879 ABGB',
    behauptung: 'Eine Vertragsbestimmung, die gegen die guten Sitten verstößt, ist nichtig.',
    wirkung: 'erklaerung',
    belegt: false,
  }),
  Object.freeze({
    zitat: '§ 11 FAGG',
    behauptung: 'Das Fern- und Auswärtsgeschäfte-Gesetz gilt für Verbraucher — dieser Shop '
      + 'verkauft an Unternehmer, und deshalb gibt es kein gesetzliches Rücktrittsrecht.',
    wirkung: 'seite',
    belegt: false,
  }),
]);

/**
 * Die Gesetze, auf die sich dieser Bestand beruft — aus dem Register
 * gewonnen, nicht daneben geführt. Eine zweite Liste wäre eine Liste, die
 * niemand pflegt.
 */
export const GESETZE = Object.freeze([...new Set(
  RECHTSGRUENDE.map((e) => e.zitat.split(/\s+/).at(-1)),
)].sort());

/** Ein Gesetzesname irgendwo in einer Zeile. */
export const GESETZESNAME = new RegExp(`\\b(?:${GESETZE.join('|')})\\b`);

/** Eine Fundstelle im Text: `§ 11 Abs 1 Z 3 UStG`, auch ohne die Zusätze. */
export const FUNDSTELLE = /§+\s*(\d+[a-z]?)(?:\s*(?:Abs|Absatz)\.?\s*(\d+))?(?:\s*(?:Z|Ziffer)\.?\s*(\d+))?(?:\s*lit\.?\s*([a-z]))?(\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{2,})?/g;

/** Bringt eine gefundene Fundstelle auf die Schreibweise des Registers. */
export function normiere(treffer) {
  const [, nr, abs, ziffer, lit, gesetz] = treffer;
  const teile = [`§ ${nr}`];
  if (abs) teile.push(`Abs ${abs}`);
  if (ziffer) teile.push(`Z ${ziffer}`);
  if (lit) teile.push(`lit ${lit}`);
  if (gesetz) teile.push(gesetz.trim());
  return teile.join(' ');
}

/**
 * Hält die Fundstellen des Bestands gegen das Register.
 *
 * @param {{pfad: string, text: string}[]} dateien
 * @param {object[]} [register]
 */
export function rechtsbefund(dateien, register = RECHTSGRUENDE) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const bekannt = new Map(register.map((e) => [e.zitat, e]));
  const gesehen = new Set();
  let nennungen = 0;

  for (const e of register) {
    if (!e.behauptung || e.behauptung.length < 30) {
      melde('behauptung-zu-duenn',
        `${e.zitat}: eine Fundstelle ohne ausgeschriebene Behauptung ist eine Nummer`);
    }
    if (!Object.keys(WIRKUNG).includes(e.wirkung)) {
      melde('wirkung-unbekannt', `${e.zitat}: „${e.wirkung}" ist keine der vier Wirkungen`);
    }
    if (e.belegt !== false && !e.belegtAm) {
      melde('beleg-ohne-datum',
        `${e.zitat}: belegt ohne Datum — dann ist es ein Gefühl und kein Handgriff`);
    }
  }

  for (const { pfad, text } of dateien) {
    /*
     * **Ein Zitat überlebt einen Zeilenumbruch.** In Kopfkommentaren steht
     * regelmäßig „§ 132\n * verlangt sieben Jahre" — dazwischen liegt der
     * Kommentarrand, nicht das Ende der Fundstelle. Wer zeilenweise sucht,
     * meldet die Hälfte davon als gesetzlos und hat nach dem Buchstaben
     * recht.
     */
    const entfaltet = String(text).replace(/\n\s*(?:\*|\/\/)?[ \t]?/g, ' ');

    /*
     * **Die Kurzform ist erlaubt, wenn die Langform vorher steht.** So wird
     * in Rechtstexten geschrieben: einmal „§ 11 UStG", danach „§ 11". Wer
     * jede Nennung ausschreiben müsste, bekäme eine Prüfung, die zur
     * Umgehung einlädt.
     */
    const eingefuehrt = new Set();
    for (const treffer of entfaltet.matchAll(FUNDSTELLE)) {
      nennungen += 1;
      const nummer = treffer[1];
      if (!treffer[5]) {
        /*
         * **„§§ 864a, 879 ABGB" ist eine Fundstelle, keine zwei halben.**
         * Das Gesetz steht einmal, am Ende der Reihe.
         */
        const naheDahinter = entfaltet.slice(treffer.index, treffer.index + 120);
        const nachbar = naheDahinter.match(GESETZESNAME);
        if (nachbar) {
          /*
           * **Auch die erste Nummer einer Reihe ist eine Fundstelle.** Die
           * erste Fassung ließ sie durchgehen, sobald das Gesetz irgendwo
           * dahinterstand — damit wäre `§ 864a` aus der AGB-Grundlage nie im
           * Register gelandet, obwohl es eine eigene Behauptung trägt.
           */
          const zusammen = `${normiere(treffer)} ${nachbar[0]}`;
          if (!bekannt.has(zusammen)) {
            melde('fundstelle-ohne-eintrag',
              `${pfad}: „${zusammen}" steht in keinem Register — unentschieden, was sie behauptet`);
          } else {
            gesehen.add(zusammen);
          }
          continue;
        }
        if (!eingefuehrt.has(nummer)) {
          melde('fundstelle-ohne-gesetz',
            `${pfad}: „${normiere(treffer)}" nennt kein Gesetz, und vorher steht in dieser `
            + 'Datei auch keines — eine Fundstelle ohne Gesetz ist eine Zahl');
        }
        continue;
      }
      eingefuehrt.add(nummer);
      const zitat = normiere(treffer);
      if (!bekannt.has(zitat)) {
        melde('fundstelle-ohne-eintrag',
          `${pfad}: „${zitat}" steht in keinem Register — unentschieden, was sie behauptet`);
        continue;
      }
      gesehen.add(zitat);
    }
  }

  for (const e of register) {
    if (!gesehen.has(e.zitat)) {
      melde('eintrag-ohne-fundstelle',
        `${e.zitat}: steht im Register und an keiner Stelle des Bestands`);
    }
  }

  return {
    meldungen,
    sauber: meldungen.length === 0,
    fundstellen: register.length,
    nennungen,
    belegt: register.filter((e) => e.belegt === true).length,
  };
}
