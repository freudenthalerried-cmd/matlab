/**
 * Wie weit reicht der Betrieb — und wo hört er auf?
 *
 * **Der Anlass, 4. September 2026, Abend.** Der Weg vom Klick bis zum Angebot
 * ist heute gebaut und in einem Befehl belegt: `npm run bestellprobe` fährt
 * Kasse, Empfangsskript, Ablage, Posteingang und Angebot.
 *
 * Danach hört er auf. Ein Geschäftsfall endet nicht beim Angebot, sondern beim
 * Zahlungseingang und der Aufbewahrung, und dazwischen liegen die Bestellung
 * beim Lieferanten, die Lieferung und die Rechnung.
 *
 * > **Der Plan sagt, wie der Shop online geht. Nichts sagt, wie ein
 * > Geschäftsfall zu Ende geht.** Die Werkzeuge dafür sind teils da, teils
 * > nicht, und welche fehlen, stand nirgends.
 *
 * Diese Liste ist keine Anleitung, sondern eine **Landkarte mit weißen
 * Flecken**: Sie führt die Schritte eines Geschäftsfalls, nennt je Schritt das
 * Werkzeug und das Gate, das dabei greift — und sagt bei jedem Schritt ohne
 * Werkzeug, **warum** es keines gibt. Ein Schritt ohne Werkzeug und ohne
 * Grund ist der Fund.
 *
 * ## Was hier nicht steht
 *
 * Der Weg **bis** zum ersten Kunden. Den rechnet `src/rollout.js` aus seinen
 * Etappen und ihren Abhängigkeiten — die Zahl steht dort und nicht hier. Zwei Listen über dieselbe Sache
 * wären zwei Antworten; diese beginnt, wo jene endet.
 */

/**
 * Die Schritte eines Geschäftsfalls, in der Reihenfolge, in der sie eintreten.
 *
 * `werkzeug` ist der npm-Befehl, `gate` die Entscheidung, die dabei greift,
 * `warumOhneWerkzeug` der Pflichtgrund, wo keines existiert.
 */
export const SCHRITTE = Object.freeze([
  Object.freeze({
    id: 'bestellung-kommt-an',
    was: 'Der Kunde schickt die gerechnete Bestellung ab',
    werkzeug: 'bestellung.php (auf dem Hosting)',
    gate: 'Gate 25 — die Kasse nimmt unter 250 € netto keine Anfrage an',
  }),
  Object.freeze({
    id: 'posteingang',
    was: 'Die Bestellung wird gelesen und für den Beleg vorbereitet',
    werkzeug: 'npm run posteingang',
    gate: 'Gate 7 — ohne UID und Unternehmerbestätigung keine Nettorechnung',
  }),
  Object.freeze({
    id: 'angebot',
    was: 'Das Angebot mit Bindefrist entsteht und wird abgelegt',
    werkzeug: 'npm run vorgang -- --stufe angebot --ablegen',
    gate: 'Gate 20 — kein Vorgang ohne positiven Deckungsbeitrag',
  }),
  Object.freeze({
    id: 'annahme',
    was: 'Der Kunde nimmt an; die Auftragsbestätigung schließt den Vertrag',
    werkzeug: 'npm run vorgang -- --stufe bestaetigung --ablegen',
    gate: 'AGB Punkt 2 — der Vertrag entsteht mit der Auftragsbestätigung',
  }),
  Object.freeze({
    id: 'zahlung',
    was: 'Der Kunde zahlt; das Geld geht ein',
    werkzeug: null,
    gate: 'Gate 21 — Kundenzahlungsziel null Tage, Vorkasse und EPS',
    // **Berichtigt am 4. September, spät.** Hier stand, der Zahlungseingang
    // hänge am Anbieter. Das gilt für EPS und für die Karte — nicht für die
    // Überweisung, die Gate 21 gleichrangig nennt und die keinen Anbieter
    // braucht, sondern ein Konto. Ein Grund, der zu breit ist, verdeckt genau
    // den Weg, der ab Start offensteht.
    warumOhneWerkzeug: 'Zwei Wege, zwei Gründe. **EPS und Karte** entstehen beim '
      + 'Zahlungsanbieter, und der ist nicht gewählt — eine Ausgabe und damit Sache des '
      + 'Auftraggebers. Die **Überweisung** braucht keinen Anbieter: Kontoinhaber und IBAN '
      + 'stehen auf der Auftragsbestätigung, sobald sie in der Betreiberdatei stehen. Ein '
      + 'Werkzeug fehlt trotzdem, weil den Eingang nur sieht, wer den Kontoauszug liest — '
      + 'ein Zugang, den dieses Haus nicht hat und nicht haben soll.',
  }),
  Object.freeze({
    id: 'lieferantenbestellung',
    was: 'Die Ware wird beim Lieferanten bestellt',
    /*
     * **Seit dem 12. September mit Werkzeug.** Hier stand als Grund, was
     * fehle, sei das Absenden — per Mail an einen Dritten, und das ist nach
     * PARAMETER.md Sache des Auftraggebers. Das stimmt unverändert und ist
     * kein Grund, **kein** Werkzeug zu haben: Kein Beleg dieses Hauses wird
     * versendet, und die anderen vier haben trotzdem eines.
     *
     * Der Text stand seit dem 30. August und wurde unter jedem Angebot
     * **gezeigt**; abgelegt wurde er nie — von den fünf Papieren eines
     * Geschäftsfalls war er das einzige, das nur auf dem Bildschirm stand.
     * Wenn die Ware kommt, ist die Bestellung das Papier, gegen das jemand
     * sie prüft.
     */
    werkzeug: 'npm run vorgang -- --stufe bestellung --bezahlt … --ablegen',
    gate: 'Gate 20 — erst nach Zahlungseingang, und nur mit bekannter Lieferzeit',
  }),
  Object.freeze({
    id: 'lieferung',
    was: 'Der Lieferant liefert auf die Baustelle',
    werkzeug: null,
    gate: 'Gate 23 — nur in die fünf Bezirke des Liefergebiets',
    warumOhneWerkzeug: 'Ein Vorgang in der Welt, kein Vorgang im Rechner. Was davon zählt, ist '
      + 'das Lieferdatum, und das trägt der Betreiber ein, wenn es feststeht.',
  }),
  /*
   * **Berichtigt am 11. September 2026.** Hier stand, der Befehl fehle, „und
   * ihm fehlen zwei Angaben, die kein Kommandozeilenwert sind: das
   * Lieferdatum und der Zahlungseingang".
   *
   * Diese Begründung wirft zwei Dinge zusammen. **Festzustellen**, dass
   * bezahlt wurde, braucht den Kontoauszug — den hat dieses Haus nicht und
   * soll ihn nicht haben; das steht zu Recht beim Schritt `zahlung`. **Die
   * Rechnung zu schreiben**, nachdem der Betreiber es festgestellt hat,
   * braucht nur, dass er es eingibt — genau wie die Anschrift des Kunden, die
   * auch niemand aus einer Anfrage ableitet.
   *
   * > **Eine Angabe, die aus der Welt kommt, ist deshalb kein Hindernis für
   * > ein Werkzeug — sie ist sein erstes Argument.**
   */
  Object.freeze({
    id: 'rechnung',
    was: 'Die Rechnung wird ausgestellt und bekommt ihre Nummer',
    werkzeug: 'npm run vorgang -- --stufe rechnung --geliefert … --bezahlt … --ablegen',
    gate: '§ 11 UStG — fortlaufend und einmalig, Pflichtangaben vollständig',
  }),
  Object.freeze({
    id: 'aufbewahrung',
    /*
     * **Der letzte Schritt sagte „Beleg und Journal" und hatte nur das
     * Journal — 11. September 2026.** Der Beleg wurde gedruckt und war nach
     * dem Schließen des Fensters fort. Seit heute legt `--ablegen` neben die
     * Journalzeile die Durchschrift (`ablage/belege-2026/RE-2026-0001.txt`),
     * und `npm run pruefe-ablage` hält beide Richtungen gegeneinander.
     */
    was: 'Beleg und Journal bleiben sieben Jahre erhalten',
    werkzeug: 'ablage/ (gesperrt), Durchschrift je Beleg und npm run pruefe-ablage',
    gate: '§ 132 BAO — sieben Jahre; § 131 BAO — nur ergänzen, nie ändern',
  }),
]);

/**
 * Der Befund über die Kette.
 *
 * `erreicht` ist der Punkt, an dem sie **zusammenhängend** aufhört — nicht die
 * Zahl der Schritte mit Werkzeug. Der Unterschied ist der Ertrag dieser Liste:
 * Die Aufbewahrung hat ein Werkzeug und liegt trotzdem jenseits der Lücke.
 */
export function kettenbefund(schritte = SCHRITTE) {
  const meldungen = [];
  for (const s of schritte) {
    if (!s.gate) meldungen.push({ regel: 'ohne-gate', text: `${s.id}: nennt kein Gate` });
    if (!s.werkzeug && (!s.warumOhneWerkzeug || s.warumOhneWerkzeug.length < 80)) {
      meldungen.push({
        regel: 'ohne-werkzeug-ohne-grund',
        text: `${s.id}: kein Werkzeug und kein tragfähiger Grund`,
      });
    }
    if (s.werkzeug && s.warumOhneWerkzeug) {
      meldungen.push({
        regel: 'grund-ohne-fall',
        text: `${s.id}: hat ein Werkzeug und begründet trotzdem, warum keines da ist`,
      });
    }
  }

  const ersteLuecke = schritte.findIndex((s) => !s.werkzeug);
  return {
    schritte: schritte.length,
    mitWerkzeug: schritte.filter((s) => s.werkzeug).length,
    erreicht: ersteLuecke === -1 ? schritte.length : ersteLuecke,
    ersteLuecke: ersteLuecke === -1 ? null : schritte[ersteLuecke],
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Die Abzweige: Stellen, an denen ein Geschäftsfall die Kette verlässt.
 *
 * **Der Anlass, 11. September 2026.** Die Liste oben führt neun Schritte „in
 * der Reihenfolge, in der sie eintreten" — und jeder einzelne setzt voraus,
 * dass der Fall gelingt. Seit dem 10. September gibt es
 * `npm run vorgang -- --stufe absage`, ein Werkzeug für genau den Fall, dass er
 * **nicht** gelingt. Es stand in keinem Schritt, und es konnte in keinem
 * stehen: Eine Absage tritt nicht nach der Annahme ein, sondern statt ihrer.
 *
 * > **Eine Karte, die nur den geglückten Weg kennt, meldet sich sauber und
 * > verschweigt jede Stelle, an der ein Kunde stehen bleibt.**
 *
 * Dieselbe Pflicht wie oben, um eine Frage erweitert. `ab` nennt den Schritt,
 * nach dem der Abzweig möglich wird, `werkzeug` den Befehl, `grundlage` die
 * **veröffentlichte** Regel, die den Abzweig trägt — und wo eines von beiden
 * fehlt, steht der Pflichtgrund daneben. Ein Abzweig ohne Werkzeug und ohne
 * Grund ist der Fund; ein Abzweig ohne Grundlage und ohne Grund ist der
 * teurere davon, weil er den Kunden trifft, der schon gezahlt hat.
 */
export const ABZWEIGE = Object.freeze([
  Object.freeze({
    id: 'absage',
    ab: 'posteingang',
    was: 'Der Fall kommt nicht zustande; der Kunde bekommt den Grund im Klartext',
    // **Seit dem 12. September mit `--ablegen`:** Die Absage ist der vierte
    // Brief an einen Kunden und war der einzige, von dem nichts blieb.
    // § 132 Abs 1 BAO verlangt die Geschäftspapiere sieben Jahre, § 212 UGB
    // die Wiedergaben der abgesendeten Geschäftsbriefe — und die eingehende
    // Bestellung wird seit dem 4. September aufgezeichnet.
    werkzeug: 'npm run vorgang -- --stufe absage --ablegen',
    grundlage: 'AGB Punkt 2 — die Bestellung ist das Angebot, der Vertrag entsteht erst mit '
      + 'der Auftragsbestätigung. Die einzelnen Gründe stehen in Punkt 1, 5 und 12.',
  }),
  Object.freeze({
    id: 'angebot-verfaellt',
    ab: 'angebot',
    was: 'Die Bindefrist läuft ab, ohne dass der Kunde annimmt',
    werkzeug: null,
    grundlage: 'Die Bindefrist von vierzehn Tagen, die `BINDEFRIST` setzt und die auf jedem '
      + 'Angebot mit Datum steht.',
    warumOhneWerkzeug: 'Der Ablauf einer Frist ist kein Ereignis im Rechner, sondern das '
      + 'Ausbleiben eines Ereignisses. Ein Werkzeug müsste täglich über die Ablage laufen und '
      + 'Datum für Datum vergleichen; nichts in diesem Haus läuft täglich. Die Folge des '
      + 'Ablaufs ist auch keine Nachricht, sondern eine Entscheidung des Betreibers — neu '
      + 'rechnen oder ziehen lassen. Der Preis von gestern bindet nicht mehr, mehr geschieht nicht.',
  }),
  /*
   * **Aufgenommen am 12. September 2026.** Die Ablage konnte seit dem
   * 4. September stornieren, der Betrieb nicht: Es fehlte das Papier. Ein
   * Storno ohne Papier ist eine Journalzeile über einen Brief, den niemand
   * geschrieben hat.
   */
  Object.freeze({
    id: 'rechnung-falsch',
    ab: 'rechnung',
    was: 'Die gestellte Rechnung ist falsch und wird durch eine Gutschrift aufgehoben',
    werkzeug: 'npm run vorgang -- --stufe gutschrift --storniert … --grund … --ablegen',
    grundlage: '§ 131 Abs 1 Z 6 BAO — der ursprüngliche Inhalt muss feststellbar bleiben: '
      + 'Die Rechnung wird nicht geändert, sondern aufgehoben. Die Gutschrift ist selbst eine '
      + 'Rechnung nach § 11 UStG und trägt dieselben Pflichtangaben.',
  }),
  Object.freeze({
    id: 'kann-nicht-geliefert-werden',
    ab: 'lieferantenbestellung',
    was: 'Nach Vertragsschluss und Zahlung sagt der Lieferant ab',
    werkzeug: null,
    grundlage: null,
    warumOhneWerkzeug: 'Was zu tun wäre, hängt davon ab, was die Regel sagt — und die gibt es '
      + 'nicht (nebenan). Ein Werkzeug vor der Regel wäre eine Zusage, die niemand geprüft hat. '
      + 'Dazu kommt dieselbe Grenze wie beim Zahlungseingang: Eine Rückzahlung geht über das '
      + 'Konto, und dieses Haus hat keinen Zugang dorthin und soll keinen haben.',
    warumOhneGrundlage: 'Die dreizehn AGB-Punkte regeln Vertragsschluss, Lieferung, Zahlung, '
      + 'Gewährleistung und Gerichtsstand — keiner sagt, was gilt, wenn die bestellte und '
      + 'bezahlte Ware nicht kommt. Rücktritt, Nachfrist und Rückzahlung sind Rechtstexte, und '
      + 'die sind ein offener Punkt beim Auftraggeber. Sie hier zu erfinden hieße, dem Kunden '
      + 'eine Regel zu versprechen, die auf keiner veröffentlichten Seite steht.',
  }),
]);

/**
 * Der Befund über die Abzweige — dieselben Regeln, eine Spalte mehr.
 */
export function abzweigbefund(abzweige = ABZWEIGE, schritte = SCHRITTE) {
  const meldungen = [];
  const ids = new Set(schritte.map((s) => s.id));
  for (const a of abzweige) {
    if (!ids.has(a.ab)) {
      meldungen.push({
        regel: 'abzweig-ins-leere',
        text: `${a.id}: zweigt nach „${a.ab}" ab — diesen Schritt gibt es nicht`,
      });
    }
    if (!a.werkzeug && (!a.warumOhneWerkzeug || a.warumOhneWerkzeug.length < 80)) {
      meldungen.push({
        regel: 'abzweig-ohne-werkzeug-ohne-grund',
        text: `${a.id}: kein Werkzeug und kein tragfähiger Grund`,
      });
    }
    if (a.werkzeug && a.warumOhneWerkzeug) {
      meldungen.push({
        regel: 'grund-ohne-fall',
        text: `${a.id}: hat ein Werkzeug und begründet trotzdem, warum keines da ist`,
      });
    }
    if (!a.grundlage && (!a.warumOhneGrundlage || a.warumOhneGrundlage.length < 80)) {
      meldungen.push({
        regel: 'abzweig-ohne-grundlage-ohne-grund',
        text: `${a.id}: keine veröffentlichte Regel und kein tragfähiger Grund`,
      });
    }
    if (a.grundlage && a.warumOhneGrundlage) {
      meldungen.push({
        regel: 'grundlage-doppelt',
        text: `${a.id}: nennt eine Regel und begründet trotzdem, warum keine da ist`,
      });
    }
  }
  return {
    abzweige: abzweige.length,
    mitWerkzeug: abzweige.filter((a) => a.werkzeug).length,
    ohneGrundlage: abzweige.filter((a) => !a.grundlage).length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/**
 * Die Gegenrichtung: Kennt die Karte jede Stufe, die das Werkzeug anbietet?
 *
 * **Warum das die eigentliche Prüfung ist.** Eine Liste, die nur sich selbst
 * gegen sich selbst hält, bleibt grün, während die Wirklichkeit davonläuft.
 * Genau das ist am 10. September passiert: `bin/vorgang.mjs` bekam eine dritte
 * Stufe, und die Karte des Betriebs meldete weiter, es sei alles in Ordnung.
 * Dieser Befund wäre an jenem Tag rot geworden.
 *
 * Gelesen wird die Zeile, die `bin/vorgang.mjs` seine erlaubten Stufen nennt.
 * Findet sie sich nicht oder ist sie leer, ist das **kein grünes Ergebnis**,
 * sondern eine eigene Meldung: Ein Prüfer, der nichts findet, hat nichts geprüft.
 */
export function stufenbefund(quelltext, schritte = SCHRITTE, abzweige = ABZWEIGE) {
  const zeile = /\[([^\]]*)\]\.includes\(stufe\)/.exec(quelltext ?? '');
  const stufen = zeile ? [...zeile[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
  if (!stufen.length) {
    return {
      stufen: [],
      meldungen: [{
        regel: 'stufen-nicht-lesbar',
        text: 'In bin/vorgang.mjs steht keine lesbare Liste erlaubter Stufen — '
          + 'dieser Befund prüft damit nichts.',
      }],
      sauber: false,
    };
  }

  const benannt = new Map();
  for (const e of [...schritte, ...abzweige]) {
    const m = /--stufe\s+(\S+)/.exec(e.werkzeug ?? '');
    if (m) benannt.set(m[1], e.id);
  }

  const meldungen = [];
  for (const s of stufen) {
    if (!benannt.has(s)) {
      meldungen.push({
        regel: 'stufe-ohne-platz',
        text: `Das Werkzeug kennt die Stufe „${s}" — die Karte führt sie weder als `
          + 'Schritt noch als Abzweig',
      });
    }
  }
  for (const [s, id] of benannt) {
    if (!stufen.includes(s)) {
      meldungen.push({
        regel: 'platz-ohne-stufe',
        text: `„${id}" nennt die Stufe „${s}" — das Werkzeug kennt sie nicht`,
      });
    }
  }

  return { stufen, benannt: [...benannt.keys()], meldungen, sauber: meldungen.length === 0 };
}
