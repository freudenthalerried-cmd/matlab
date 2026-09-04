/**
 * Der Weg von heute bis zur Entscheidung — als Kette, nicht als Kalender.
 *
 * **Warum es das bis zum 1. September nicht gab.** Der Ursprungsauftrag
 * verlangt als zwölftes Ergebnis einen `rollout-90-tage.md`. Der
 * Auftragsabgleich hat ihn als *offen* geführt, mit der Begründung: Eine
 * Zeitachse ließe sich nicht ehrlich schreiben, solange die tragende Annahme
 * — die Kaufquote — nicht gemessen ist.
 *
 * Die Begründung stimmt für einen **Kalender** und ist falsch für einen
 * **Plan**. „Woche 3: Anzeigen schalten" behauptet ein Datum, das niemand
 * halten kann, weil der erste Schritt eine Freigabe des Auftraggebers ist und
 * der zweite eine Antwort des Lieferanten. Was sich ehrlich schreiben lässt,
 * ist die Kette:
 *
 * > **Nicht „Woche 3", sondern „Tag N nach der Freigabe, die davor liegt."**
 *
 * Alles hängt an Ereignissen, die andere auslösen. Dieses Modul rechnet aus,
 * wie lange die Kette ist, welcher Strang sie bestimmt und ob die Entscheidung
 * in neunzig Tage passt.
 *
 * Jede Dauer trägt ihre Art:
 *
 *   `gerechnet`      folgt aus Budget, Klickpreis und Abbruchschwelle
 *   `gesetzt`        meine Annahme, mit Begründung — keine Messung
 *   `fremdbestimmt`  Wartezeit auf Dritte; die Zahl ist eine Annahme und
 *                    sagt nichts über die Wirklichkeit
 *
 * Wer die Kette abkürzen will, muss die Wartezeiten kürzen, nicht die Arbeit.
 */

import { abbruchschwelle, TAGE_JE_MONAT } from './werbewirkung.js';

/**
 * Die Etappen. `brauchtVor` ist die Abhängigkeit, nicht die Reihenfolge —
 * was nicht voneinander abhängt, läuft nebeneinander.
 *
 * **Jede Abhängigkeit trägt ihren Grund, und jede fehlende auch.** Bis zum
 * 2. September war `brauchtVor` eine blanke Liste von Kennungen — das einzige
 * Feld im Plan ohne Pflichtgrund. Genau dieses Feld war falsch:
 * `lieferantengespraech` stand auf `[]` und begann an Tag 0, obwohl der Brief
 * an den Lieferanten eine Rückantwortadresse braucht, die erst die Etappe
 * `impressum` einträgt. `erzeugeLieferantenanfrage` sagt das von selbst
 * („NICHT VERSANDFÄHIG"); der Plan hat nie gefragt.
 *
 * > **Wer „hängt von nichts ab" nicht begründen muss, schreibt es hin.**
 *
 * Deshalb ist `brauchtVor` jetzt `{etappe, warum}` — und eine **leere** Liste
 * verlangt `warumOhneVoraussetzung`. Die leere Liste ist die gefährlichere:
 * Eine falsche Abhängigkeit verlängert die Kette und fällt beim Rechnen auf,
 * eine fehlende verkürzt sie und sieht aus wie ein guter Plan.
 */
export const ETAPPEN = Object.freeze([
  Object.freeze({
    id: 'repository-privat',
    titel: 'Repository privat stellen',
    zustaendig: 'entscheidung',
    brauchtVor: [],
    warumOhneVoraussetzung: 'Ein Klick, der von nichts abhängt — und der einzige Schritt, der '
      + 'jeden Tag teurer wird, den er wartet.',
    tage: 0,
    art: 'gesetzt',
    woher: 'Ein Klick in den GitHub-Einstellungen.',
    gate: null,
    warumKeinGate: 'Kein Gate — eine Sicherheitsfrage, keine Modellentscheidung.',
    ergebnis: 'Solange es öffentlich ist, sind 44 von 46 Einkaufspreisen rekonstruierbar.',
  }),
  Object.freeze({
    id: 'impressum',
    titel: 'Vier Impressumsangaben eintragen (E-Mail, Telefon, UID, Gewerbewortlaut)',
    zustaendig: 'eintragen',
    brauchtVor: [],
    warumOhneVoraussetzung: 'Die Angaben liegen beim Auftraggeber; es fehlt nichts, worauf sie '
      + 'warten müssten.',
    tage: 1,
    art: 'gesetzt',
    woher: 'Die Angaben liegen beim Auftraggeber vor; einzutragen ist eine Datei.',
    gate: null,
    warumKeinGate: 'Kein Gate — eine gesetzliche Pflicht nach § 5 ECG, keine Entscheidung.',
    ergebnis: 'Ohne E-Mail hat die fertig gerechnete Kundenanfrage keinen Empfänger.',
  }),
  /**
   * **Ergänzt am 4. September, spät.** Zwei Punkte der Bereitschaftsliste
   * hatten im Plan keine Etappe: die zugesagte **Antwortzeit** und die
   * **Bankverbindung**. Beide sind Angaben des Auftraggebers aus dem
   * laufenden Betrieb, beide kosten nichts, und beide halten den Shop auf.
   *
   * > **Der Plan kannte nur den teuren Zahlweg.** Er führte zehn Tage
   * > Legitimationsprüfung beim Zahlungsanbieter — und keinen Schritt, mit
   * > dem der Shop am ersten Tag Geld annehmen kann. Gate 21 nennt die
   * > Überweisung gleichrangig, und die braucht keinen Anbieter, sondern ein
   * > Konto.
   *
   * Der Plan sagt selbst, ein Verkauf beende den Versuch früher als jede
   * Schwelle. Bis heute enthielt er keinen Schritt, der einen Verkauf zu
   * Ende bringt.
   */
  Object.freeze({
    id: 'betreiberangaben',
    titel: 'Antwortzeit und Bankverbindung eintragen',
    zustaendig: 'eintragen',
    brauchtVor: [],
    warumOhneVoraussetzung: 'Zwei Angaben aus dem laufenden Betrieb, die auf nichts warten — '
      + 'weder auf eine Antwort noch auf eine Ausgabe.',
    tage: 1,
    art: 'gesetzt',
    woher: 'Eine Zahl (Werktage bis zur Rückmeldung) und zwei Zeilen (Kontoinhaber, IBAN). '
      + 'Beide liegen beim Auftraggeber; einzutragen ist eine Datei.',
    gate: 'Gate 21',
    ergebnis: 'Die Auftragsbestätigung sagt dem Kunden, wohin er überweist, und die Kasse '
      + 'nennt eine Frist statt einer Rückmeldung ohne Zeitangabe. Vorkasse braucht keinen '
      + 'Zahlungsanbieter — dies ist der einzige Schritt zwischen heute und einem Geschäft, '
      + 'das zu Ende geht.',
  }),
  Object.freeze({
    id: 'lieferantengespraech',
    titel: 'Ein Gespräch mit dem Lieferanten',
    zustaendig: 'anfrage',
    // **Berichtigt am 2. September.** Hier stand `[]`. Der Brief an den
    // Lieferanten braucht eine Rückantwortadresse, und die steht in
    // `betreiber.email` und `betreiber.telefon` — beides Teil dieser Etappe.
    // `erzeugeLieferantenanfrage` weigert sich von selbst: „NICHT
    // VERSANDFÄHIG". Der Plan ließ das Gespräch trotzdem an Tag 0 beginnen.
    brauchtVor: [Object.freeze({
      etappe: 'impressum',
      warum: 'Der Brief braucht eine Rückantwortadresse. Ohne betreiber.email und '
        + 'betreiber.telefon erzeugt `erzeugeLieferantenanfrage` ihn als „nicht versandfähig" '
        + '— eine Frage ohne Empfänger für die Antwort.',
    })],
    tage: 7,
    art: 'fremdbestimmt',
    woher: 'Angenommene Antwortzeit eines Baustoffhändlers auf eine Kundenanfrage. '
      + 'Keine Messung — die Zahl ist ein Platzhalter, den eine Terminzusage ersetzt.',
    // Ohne Zahl, absichtlich. Hier stand „Löst acht offene Punkte" — am
    // 3. September waren es neun, weil die Palettenfrage dazukam, und die
    // Zeile hätte es nicht gemerkt. Die Zahl führt `npm run offenepunkte`;
    // dieser Plan nennt, **was** das Gespräch löst, nicht wie viel.
    ergebnis: 'Löst die offenen Punkte der Gruppe „Anfrage" auf einmal: Lieferzeit, '
      + 'Preisrhythmus, Liefergebiet, Palettenzahl und — über eine Artikelliste mit '
      + 'EAN-Spalte — GTIN, Marke und Bild.',
    gate: 'Gate 6 und Gate 23',
  }),
  Object.freeze({
    id: 'katalog-erweitern',
    titel: 'Katalog aus der Artikelliste auf mindestens 100 Artikel erweitern',
    zustaendig: 'werkzeug',
    brauchtVor: [Object.freeze({
      etappe: 'lieferantengespraech',
      warum: 'Die hundert Artikel stehen in der Artikelliste, die das Gespräch bringt. Der '
        + 'Katalog von heute stammt aus fünfzehn Rechnungen und kennt nur, was darauf stand.',
    })],
    tage: 2,
    art: 'gesetzt',
    woher: 'Einlesen, zuordnen, prüfen — Arbeit an vorliegenden Daten, keine Wartezeit.',
    gate: 'Gate 22 und Gate 24',
    ergebnis: 'Erfüllt die Weisung vom 25.08. und macht den Feed einreichbar.',
  }),
  Object.freeze({
    id: 'rechtstexte',
    titel: 'Rechtstexte mit verbindlichem Wortlaut beauftragen',
    zustaendig: 'ausgabe',
    brauchtVor: [],
    warumOhneVoraussetzung: 'Die Gliederung mit Begründungen liegt fertig vor; der Auftrag kann '
      + 'am selben Tag hinaus wie die Freigabe. Genau deshalb bestimmt diese Etappe den Strang.',
    tage: 10,
    art: 'fremdbestimmt',
    woher: 'Angenommene Bearbeitungszeit eines Rechtstexteanbieters. Die Vorarbeit '
      + '(Gliederung mit Begründungen) liegt fertig vor und verkürzt sie.',
    gate: null,
    warumKeinGate: 'Kein Gate — Pflichttexte, über die nichts zu entscheiden ist.',
    ergebnis: 'AGB, Widerruf und Datenschutz als Wortlaut statt als Gerüst.',
  }),
  Object.freeze({
    id: 'keywordmessung',
    titel: 'Suchvolumen der 32 Keywords im Liefergebiet messen',
    zustaendig: 'entscheidung',
    brauchtVor: [],
    warumOhneVoraussetzung: 'Ein kostenloses Ads-Konto ohne geschaltete Kampagne. Es hängt an '
      + 'nichts — und muss vor dem Schalten liegen, nicht danach.',
    tage: 1,
    art: 'gesetzt',
    woher: 'Keyword-Planer, kostenlos, ein Ads-Konto ohne geschaltete Kampagne. '
      + 'Liste steht: npm run messliste.',
    ergebnis: 'Sagt, ob der Markt die gerechneten Klicks überhaupt hergibt. '
      + 'Ist er zu klein, dauert der Versuch ein Vielfaches — oder findet nicht statt.',
    gate: 'Gate 15',
  }),
  Object.freeze({
    id: 'upload',
    titel: 'ausgabe/site/ auf bauversand.com hochladen',
    zustaendig: 'entscheidung',
    brauchtVor: [
      Object.freeze({
        etappe: 'impressum',
        warum: 'Die Abhängigkeit ist keine technische: Das Impressum-Gerüst sagt selbst, dass '
          + 'es so nicht online gehen darf.',
      }),
      /**
       * **Begründung berichtigt am 4. September.** Hier stand: „AGB, Widerruf
       * und Datenschutz stehen als Gerüst mit Begründungen. Ein Gerüst online
       * zu stellen wäre schlechter als kein Text, weil es wie einer aussieht."
       *
       * Der zweite Halbsatz stimmt für ein Gerüst, das sich für einen Text
       * ausgibt. **Diese Seiten tun das nicht:** Die AGB-Seite beginnt mit
       * „Das hier ist die Gliederung, nicht der Vertrag". Die Begründung war
       * an ihrem eigenen Erzeugnis widerlegt.
       *
       * Was hält, ist die schärfere Zuordnung aus `PFLICHTTEXTE`: Der
       * **Datenschutz** blockiert das Hochladen, die AGB nicht. Wer eine Seite
       * aufruft, hinterlässt eine IP-Adresse; wer nichts bestellen kann,
       * schließt keinen Vertrag.
       *
       * An der Kette ändert das nichts — es ist dieselbe Bestellung beim
       * selben Anbieter. An der Aussage schon: Der Plan behauptet nicht mehr,
       * es hänge alles an allem.
       */
      Object.freeze({
        etappe: 'rechtstexte',
        warum: 'Die Datenschutzerklärung (Art. 13 DSGVO) und die Offenlegung (§ 25 MedienG) '
          + 'gelten ab dem ersten Aufruf, nicht ab der ersten Bestellung — beide stehen heute '
          + 'als Gliederung ohne Wortlaut da. AGB und Widerruf blockieren das Hochladen nicht: '
          + 'Sie brauchen einen Vertrag, und dieser Shop nimmt keine Bestellung entgegen.',
      }),
    ],
    tage: 1,
    art: 'gesetzt',
    woher: 'Ein FTP-Vorgang. Die Abhängigkeit ist keine technische: Das Impressum-Gerüst '
      + 'sagt selbst, dass es so nicht online gehen darf.',
    gate: null,
    warumKeinGate: 'Kein Gate — ein Vorgang, keine Entscheidung. Die Gates davor sind erfüllt oder nicht.',
    ergebnis: 'Ohne erreichbare Seite kein Klick, keine Auffindbarkeit, keine Anfrage.',
  }),
  Object.freeze({
    // **Aufgenommen am 3. September 2026.** Der Plan ging vom Upload unmittelbar
    // zum Schalten. Dazwischen fehlte der eine Schritt, der beantwortet, ob die
    // hochgeladene Seite überhaupt gelesen wird: Ist sie erreichbar, ist
    // `robots.txt` gültig, kommt die Sitemap an, wird indexiert?
    //
    // > **Der Plan hat 45 Tage Messung vorgesehen und keinen Tag für die
    // > Frage, ob überhaupt gemessen werden kann.**
    //
    // Ein nicht indexierter Shop merkt das sonst erst am Ende des Versuchs —
    // und dann sieht eine gescheiterte Auffindbarkeit aus wie eine zu kleine
    // Kaufquote. Zwei völlig verschiedene Befunde, und der Plan könnte sie
    // nicht auseinanderhalten.
    //
    // Kostet nichts: Die Search Console ist kostenlos, die Bestätigung läuft
    // über eine Datei oder einen DNS-Eintrag auf der eigenen Domain. Sie ist
    // außerdem der **einzige** Weg, die organische Seite des Kanals überhaupt
    // zu sehen — die Anzeigen messen nur, was bezahlt ist.
    id: 'indexierung',
    titel: 'Search Console einrichten und die Indexierung bestätigen',
    zustaendig: 'entscheidung',
    brauchtVor: [
      Object.freeze({
        etappe: 'upload',
        warum: 'Es gibt nichts zu bestätigen, solange nichts erreichbar ist. Die Search '
          + 'Console prüft die Seite, nicht die Absicht.',
      }),
    ],
    tage: 3,
    art: 'fremdbestimmt',
    woher: 'Einrichtung und Sitemap-Meldung sind eine Sache von Minuten; bis Google die '
      + 'ersten Seiten erfasst hat, vergehen erfahrungsgemäß Tage. Keine Messung — die Zahl '
      + 'ist eine Annahme, die eine erste erfasste Seite sofort ersetzt.',
    gate: null,
    warumKeinGate: 'Kein Gate — eine Feststellung. Was sie feststellt, entscheidet nichts, '
      + 'aber ohne sie ist jeder spätere Befund zweideutig.',
    ergebnis: 'Sagt, ob die Seite gelesen wird — und trennt damit „nicht gefunden" von '
      + '„gefunden und nicht gekauft". Ohne diese Trennung misst der Klickversuch zwei Dinge '
      + 'auf einmal.',
  }),
  /**
   * **Aufgenommen am 4. September.** Der Plan führte in dreizehn Etappen bis
   * zur gemessenen Anfragequote — und der Shop wäre danach genauso wenig
   * bestellfähig gewesen wie heute. Die Etappe, die aus einer Anfrage einen
   * Auftrag macht, kam darin nicht vor.
   *
   * > **Es ist der einzige Punkt der Bereitschaftsliste, der nicht auf den
   * > Auftraggeber wartet — und er stand in keinem Plan.**
   *
   * Was die Entscheidung dazu ist und warum, steht in `src/bestellweg.js`
   * unter `GEWAEHLTER_WEG` (Gate 26).
   */
  Object.freeze({
    id: 'bestellweg',
    titel: 'Den Bestellweg bauen: Formular, Empfangsskript, Ablage',
    zustaendig: 'werkzeug',
    brauchtVor: [
      Object.freeze({
        etappe: 'rechtstexte',
        warum: 'Der Bestellweg überträgt Namen, Anschrift und Warenkorb an den Server. Art. 13 '
          + 'DSGVO verlangt, dass die Erklärung das **vor** der ersten Übertragung beschreibt — '
          + 'und der heutige Text sagt das Gegenteil: „wird nicht an den Server übertragen".',
      }),
      Object.freeze({
        etappe: 'impressum',
        warum: 'Ohne die E-Mail-Adresse des Betreibers hat das Empfangsskript keinen Empfänger. '
          + 'Sie ist eine der vier offenen Pflichtangaben.',
      }),
      Object.freeze({
        etappe: 'betreiberangaben',
        warum: 'Mit der Auftragsbestätigung kommt nach Punkt 2 der eigenen AGB der Vertrag '
          + 'zustande. Wer den Bestellweg einschaltet, ohne sagen zu können, wohin gezahlt '
          + 'wird, schließt Verträge, die er nicht abwickeln kann: Die Bestätigung trägt dann '
          + 'die sichtbare Lücke statt einer Kontonummer.',
      }),
    ],
    tage: 2,
    art: 'gesetzt',
    woher: 'Formular, Empfangsskript, Ablage und Proben — Arbeit an vorliegenden Daten. Die '
      + 'Dauer ist gesetzt und nicht gemessen; sie hängt an keiner fremden Antwort.',
    gate: 'Gate 26',
    ergebnis: 'Erst danach kann ein Kunde bestellen. Vorher erzeugt der Shop Anfragen zum '
      + 'Kopieren, und der Auftrag entsteht im Postfach.',
  }),
  Object.freeze({
    id: 'zahlungsanbieter',
    titel: 'Zahlungsanbieter wählen und anbinden',
    zustaendig: 'ausgabe',
    brauchtVor: [
      Object.freeze({
        etappe: 'impressum',
        warum: 'Die Legitimationsprüfung des Anbieters verlangt die UID, und die wird in dieser '
          + 'Etappe eingetragen.',
      }),
      /**
       * **Ergänzt am 4. September.** Diese Etappe versprach: „Erst danach kann
       * die Kasse etwas auslösen." Das war falsch — die Kasse kann auch mit
       * Zahlungsanbieter nichts auslösen, weil es keinen Weg gibt, auf dem
       * eine Bestellung den Browser verlässt.
       *
       * > **Der Plan hätte den Auftraggeber zehn Tage Legitimationsprüfung
       * > und eine laufende Gebühr für einen Anbieter aufwenden lassen, der
       * > nichts zu kassieren bekommt.**
       */
      Object.freeze({
        etappe: 'bestellweg',
        warum: 'Ein Zahlungsanbieter kassiert für eine Bestellung. Ohne Bestellweg gibt es '
          + 'keine, und die Anbindung liefe ins Leere — bezahlt ab dem ersten Monat.',
      }),
    ],
    tage: 10,
    art: 'fremdbestimmt',
    woher: 'Angenommene Dauer der Legitimationsprüfung. Sie braucht die UID, deshalb '
      + 'hängt sie am Impressum.',
    gate: 'Gate 21',
    ergebnis: 'Erst danach kann die Kasse eine Zahlung auslösen. Den Weg dafür baut die '
      + 'Etappe davor; ohne ihn kassiert der Anbieter nichts.',
  }),
  Object.freeze({
    id: 'feed-einreichen',
    titel: 'Produktfeed bei Google Merchant einreichen',
    zustaendig: 'entscheidung',
    brauchtVor: [
      Object.freeze({
        etappe: 'upload',
        warum: 'Der Feed verweist je Artikel auf eine Seite. Zeigt sie ins Leere, wird der Feed '
          + 'abgelehnt.',
      }),
      Object.freeze({
        etappe: 'katalog-erweitern',
        warum: 'Eine erfundene GTIN sperrt das Konto. Die echten kommen mit der Artikelliste.',
      }),
    ],
    tage: 3,
    art: 'fremdbestimmt',
    woher: 'Angenommene Prüfdauer bei Google. Eine erfundene GTIN sperrt das Konto, '
      + 'deshalb steht die Artikelliste zwingend davor.',
    gate: 'Gate 6',
    ergebnis: 'Ohne angenommenen Feed kein Shopping-Kanal.',
  }),
  Object.freeze({
    id: 'anzeigen-schalten',
    titel: 'Die drei Suchkampagnen des ersten Anlaufs schalten',
    zustaendig: 'ausgabe',
    brauchtVor: [
      Object.freeze({
        etappe: 'upload',
        warum: 'Ein bezahlter Klick auf eine nicht erreichbare Seite ist bezahltes Geld für '
          + 'nichts.',
      }),
      Object.freeze({
        etappe: 'keywordmessung',
        warum: 'Reicht das Suchvolumen das Budget nicht aus, dauert der Versuch ein Vielfaches. '
          + 'Das gehört vor das Schalten, nicht danach.',
      }),
      Object.freeze({
        etappe: 'indexierung',
        warum: 'Nicht weil ein bezahlter Klick eine Indexierung bräuchte — er braucht sie '
          + 'nicht. Sondern weil ein Fehler, den die Search Console in Minuten zeigt (tote '
          + 'Seite, gesperrte robots.txt, falsche Adresse), sonst 45 Tage lang als schwache '
          + 'Kaufquote verbucht wird.',
      }),
    ],
    tage: 1,
    art: 'gesetzt',
    woher: 'Die Kampagnen stehen fertig und pausiert. Das Schalten selbst ist ein Schalter.',
    gate: null,
    warumKeinGate: 'Kein Gate — ein Schalter. Was zu entscheiden war, steht in den Etappen davor.',
    ergebnis: 'Ab hier läuft die Uhr des Versuchs — und das Budget.',
  }),
  Object.freeze({
    id: 'klickversuch',
    /**
     * **Umbenannt am 3. September.** Die Etappe hieß „bis die **Kaufquote**
     * entschieden ist" — und der Shop kann keine Bestellung entgegennehmen.
     * Seit heute Abend steht das als erster Punkt in `startklar()`, am
     * Quelltext gemessen: kein `fetch`, kein Formular, kein Beacon. Was ein
     * bezahlter Klick hier auslösen kann, ist eine **Anfrage**.
     *
     * > **Ein Plan, der 45 Tage und das ganze Budget auf eine Größe setzt,
     * > die der gebaute Shop nicht erzeugen kann, misst nicht zu wenig — er
     * > misst etwas anderes.**
     *
     * Die Einschränkung stand seit dem 1. September im Kopfkommentar von
     * `werbewirkung.js` und in der Ausgabe von `npm run werbeprobe`. Sie stand
     * nicht dort, wo entschieden wird. Dieselbe Familie wie der Lieferhinweis,
     * der auf den falschen AGB-Punkt zeigte: eine Regel, die es gibt, an der
     * einen Stelle, an der sie zählt, nicht angewandt.
     */
    titel: 'Klicks sammeln, bis die Anfragequote entschieden ist',
    zustaendig: 'entscheidung',
    brauchtVor: [Object.freeze({
      etappe: 'anzeigen-schalten',
      warum: 'Die Uhr des Versuchs beginnt mit dem ersten bezahlten Klick.',
    })],
    tage: null,
    art: 'gerechnet',
    woher: 'Aus Tagesbudget, Klickpreis und der Abbruchschwelle — siehe werbewirkung.js.',
    ergebnis: 'Der Versuch trägt die Absage, nicht die Zusage. Bleibt jede Anfrage aus, '
      + 'ist die Anfragequote ausgeschlossen — und weil kein Auftrag ohne Anfrage entsteht, '
      + 'damit auch die Kaufquote. Kommen Anfragen, misst er die Anfragequote; was davon '
      + 'ein Auftrag wird, entscheidet sich im Postfach und nicht in der Anzeigenstatistik.',
    gate: 'Gate 20',
  }),
  /**
   * **Aufgenommen am 3. September**, im selben Zug.
   *
   * Ohne diese Etappe endet der Versuch mit **einer** Zahl, und die zweite
   * fehlt: Kaufquote = Anfragequote × Auftragsquote. Die erste zählt Google,
   * die zweite zählt niemand — sie entsteht im Postfach des Betreibers, und
   * wenn sie dort nicht mitgeschrieben wird, ist sie nach 45 Tagen nicht mehr
   * rekonstruierbar.
   *
   * Läuft **neben** dem Versuch, nicht danach: Beide beginnen mit dem ersten
   * bezahlten Klick, und beide dauern so lange wie er. Der bestimmende Strang
   * ändert sich dadurch nicht.
   */
  Object.freeze({
    id: 'anfragen-zaehlen',
    titel: 'Anfragen und daraus entstandene Aufträge mitschreiben',
    zustaendig: 'entscheidung',
    brauchtVor: [Object.freeze({
      etappe: 'anzeigen-schalten',
      warum: 'Gezählt werden kann erst, was durch bezahlte Klicks entsteht. Vorher gibt es '
        + 'keine Anfrage, die zu diesem Versuch gehört.',
    })],
    tage: null,
    art: 'gerechnet',
    woher: 'Dieselbe Dauer wie der Versuch — beide beginnen mit dem ersten bezahlten Klick.',
    ergebnis: 'Liefert die zweite der beiden Zahlen, aus denen die Kaufquote besteht. Ohne '
      + 'sie endet der Versuch mit einer Zahl, die wie ein Ergebnis aussieht und eine andere '
      + 'Frage beantwortet. Zwei Striche auf einem Zettel je Anfrage genügen: eingegangen, '
      + 'beauftragt.',
    gate: 'Gate 20',
  }),
]);

/**
 * Der Hauptfall, mit dem dieser Plan gerechnet wird.
 *
 * **Hierher gezogen am 3. September**, aus `bin/rollout.mjs`. Die Zahlen sind
 * Modellannahmen und keine Werkzeugeinstellung — und seit die PR-Beschreibung
 * die Etappenzahl und die Gesamtdauer nennt, misst `pruefe-schaufenster` sie.
 * Stünden sie im Werkzeug, müsste der Prüfer sie nachbauen: zwei Wege zur
 * selben Zahl, und einer davon veraltet.
 *
 * Der **mittlere** Marktklickpreis ist der Hauptfall, nicht der untere Rand:
 * Die optimistische Richtung ist in diesem Vorhaben schon mehrfach die falsche
 * gewesen.
 */
export const HAUPTFALL = Object.freeze({
  tagesbudget: 9.99, klickpreis: 1.5, quote: 0.01, frist: 90,
});

/** Die Kennungen, von denen eine Etappe abhängt. */
export function vorgaenger(etappe) {
  return etappe.brauchtVor.map((v) => v.etappe);
}

/**
 * Formprüfung der Etappenliste.
 *
 * Beides ist Pflicht und aus demselben Grund: Ein Plan, in dem niemand
 * aufschreiben muss, warum etwas an nichts hängt, enthält irgendwann eine
 * Etappe, die an etwas hängt und es nicht sagt.
 */
export function pruefeEtappen(etappen = ETAPPEN) {
  const befunde = [];
  const bekannt = new Set(etappen.map((e) => e.id));
  for (const e of etappen) {
    if (e.brauchtVor.length === 0) {
      if (!e.warumOhneVoraussetzung || e.warumOhneVoraussetzung.length < 40) {
        befunde.push(`${e.id}: hängt von nichts ab und sagt nicht, warum`);
      }
      continue;
    }
    if (e.warumOhneVoraussetzung) {
      befunde.push(`${e.id}: nennt Voraussetzungen und begründet zugleich, keine zu haben`);
    }
    for (const v of e.brauchtVor) {
      if (!bekannt.has(v.etappe)) befunde.push(`${e.id}: braucht „${v.etappe}", die es nicht gibt`);
      if (!v.warum || v.warum.length < 40) befunde.push(`${e.id} → ${v.etappe}: ohne belastbaren Grund`);
    }
  }
  return befunde;
}

/** Die Etappe zu einer Kennung, oder ein Fehler — kein stilles Überspringen. */
function etappeVon(liste, id) {
  const e = liste.find((x) => x.id === id);
  if (!e) throw new Error(`Etappe „${id}" steht in brauchtVor, aber nicht in ETAPPEN`);
  return e;
}

/**
 * Rechnet die Kette durch.
 *
 * @param {object} p
 * @param {number} p.tagesbudget    Euro je Tag über alle Anzeigengruppen
 * @param {number} p.klickpreis     Euro je Klick
 * @param {number} p.quote          Kaufquote, die ausgeschlossen werden soll (0…1)
 * @param {number} [p.frist]        Frist in Tagen, gegen die geprüft wird
 * @param {object[]} [p.etappen]
 */
export function rolloutplan({ tagesbudget, klickpreis, quote, frist = 90, etappen = ETAPPEN }) {
  if (!(tagesbudget > 0) || !(klickpreis > 0)) throw new Error('Tagesbudget und Klickpreis müssen positiv sein');
  if (!(quote > 0) || quote >= 1) throw new Error('Die Quote muss zwischen 0 und 1 liegen');

  const schwelleKlicks = abbruchschwelle(quote);
  const klicksJeTag = tagesbudget / klickpreis;
  const versuchstage = Math.ceil(schwelleKlicks / klicksJeTag);

  // **Verallgemeinert am 3. September.** Hier stand `e.id === 'klickversuch'`.
  // Seit die Zählung der Anfragen eine eigene Etappe ist, gibt es zwei
  // Etappen von der Dauer des Versuchs — und eine Sonderregel für **eine**
  // Kennung hätte die zweite still mit `null` Tagen gerechnet.
  const dauerVon = (e) => (e.art === 'gerechnet' ? versuchstage : e.tage);

  // Frühester Beginn: die längste Kette der Vorbedingungen. Zyklen fallen
  // durch die Tiefenbegrenzung auf — eine Kette kann nicht länger sein als die
  // Liste selbst.
  const fertigAm = new Map();
  const beginnAm = new Map();
  const rechne = (e, tiefe) => {
    if (tiefe > etappen.length) throw new Error(`Ringschluss in brauchtVor bei „${e.id}"`);
    if (fertigAm.has(e.id)) return fertigAm.get(e.id);
    const beginn = vorgaenger(e).reduce((max, id) => Math.max(max, rechne(etappeVon(etappen, id), tiefe + 1)), 0);
    beginnAm.set(e.id, beginn);
    const ende = beginn + dauerVon(e);
    fertigAm.set(e.id, ende);
    return ende;
  };
  for (const e of etappen) rechne(e, 0);

  const gesamt = Math.max(...fertigAm.values());

  // Der bestimmende Strang: rückwärts von der spätesten Etappe über den
  // jeweils spätesten Vorgänger.
  const letzte = etappen.find((e) => fertigAm.get(e.id) === gesamt);
  const strang = [];
  let lauf = letzte;
  while (lauf) {
    strang.unshift(lauf.id);
    const vor = vorgaenger(lauf)
      .map((id) => etappeVon(etappen, id))
      .sort((a, b) => fertigAm.get(b.id) - fertigAm.get(a.id))[0];
    lauf = vor;
  }

  const plan = etappen
    .map((e) => ({
      ...e,
      dauer: dauerVon(e),
      beginntTag: beginnAm.get(e.id),
      fertigTag: fertigAm.get(e.id),
      imStrang: strang.includes(e.id),
    }))
    .sort((a, b) => a.beginntTag - b.beginntTag || a.fertigTag - b.fertigTag);

  // Wartezeit auf Dritte im bestimmenden Strang — die Zahl, die sagt, wo
  // gedrückt werden muss.
  const wartenImStrang = plan
    .filter((e) => e.imStrang && e.art === 'fremdbestimmt')
    .reduce((n, e) => n + e.dauer, 0);

  return {
    plan: plan.map((e) => ({ ...e, woche: Math.floor(e.beginntTag / 7) + 1 })),
    strang,
    gesamt,
    frist,
    passt: gesamt <= frist,
    versuch: { schwelleKlicks, klicksJeTag, versuchstage, klickpreis, tagesbudget, quote },
    wartenImStrang,
    // Drei Größen, die sich nicht überschneiden dürfen. Der erste Lauf zählte
    // den Versuch als Arbeit mit und meldete „45 Tage Versuch, 47 Tage
    // Arbeit" bei einer Kette von 57 — eine Summe, die niemand nachrechnet
    // und die niemandem auffällt, weil sie plausibel aussieht.
    arbeitImStrang: plan
      .filter((e) => e.imStrang && e.art === 'gesetzt')
      .reduce((n, e) => n + e.dauer, 0),
    tageJeMonat: TAGE_JE_MONAT,
  };
}
