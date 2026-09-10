/**
 * Was von außen zu sehen ist — gemessen statt angenommen.
 *
 * **Der Anlass, 9. September 2026, nachts.** In `src/startklar.js` stand seit
 * dem ersten Bau, ob das Repository privat ist, sei *„von hier aus nicht
 * feststellbar"*. Der Punkt trug seither ein Fragezeichen, und der Shop galt
 * deshalb als nicht startklar — mit einer Frage, die niemand gestellt hatte.
 *
 * Der Netzausgang dieser Umgebung ist für bauversand.com gesperrt. **Für die
 * GitHub-Schnittstelle ist er es nicht:** api.github.com beantwortet die Frage
 * in einem Aufruf, und die Antwort lautet `visibility: public`. Am 9. September
 * hat das noch das GitHub-Werkzeug beantwortet und die Sperre galt als
 * vollständig; am 10. war gemessen, dass sie nach Adresse verschieden ist.
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.** Solange „nicht feststellbar" dasteht, sieht niemand nach.
 *
 * Zwei Runden zuvor war dieselbe Bewegung schon einmal aufgefallen: Der
 * Vermerk über die veröffentlichte PR-Beschreibung behauptete, eine Prüfung
 * der Veröffentlichung sei aus dieser Umgebung unmöglich — auch das war
 * falsch, und auch das hatte niemand nachgesehen.
 *
 * ## Warum eine Datei und kein Prüfer
 *
 * Das eine Feld kann der Shop seit dem 10. September selbst erheben —
 * api.github.com antwortet —, das andere nicht: Für bauversand.com ist sein
 * Netzausgang gesperrt. Erhoben wird trotzdem von Hand, weil ein Prüferlauf
 * ohne Netz sonst raten müsste. Was hier steht, ist
 * deshalb ein **Vermerk über einen Handgriff** — dasselbe Muster wie bei der
 * veröffentlichten Beschreibung. Und wie dort trägt er sein Datum: Eine
 * Messung, die alt genug ist, gilt wieder als offene Frage.
 */

/**
 * Wie lange eine Messung trägt.
 *
 * **Vierzehn Tage, und der Grund ist die Richtung des Schadens.** Der
 * gefährliche Fall ist nicht „öffentlich und keiner weiß es" — das steht dann
 * ja da —, sondern „einmal privat gemessen, seither wieder öffentlich". Zwei
 * Wochen sind kurz genug, dass eine solche Umstellung nicht ein Vierteljahr
 * unbemerkt bleibt, und lang genug, dass der Handgriff nicht zur Zeremonie
 * wird.
 */
export const GRENZE_TAGE = 14;

const TAG_MS = 24 * 60 * 60 * 1000;

/** Tage zwischen zwei Tagesangaben, oder `null`, wenn eine unlesbar ist. */
export function tageSeit(gemessenAm, heute) {
  const form = /^\d{4}-\d{2}-\d{2}$/;
  if (!form.test(String(gemessenAm ?? '')) || !form.test(String(heute ?? ''))) return null;
  const a = Date.parse(`${gemessenAm}T00:00:00Z`);
  const b = Date.parse(`${heute}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / TAG_MS);
}

/**
 * Liest den Vermerk und sagt, was er heute noch trägt.
 *
 * Rückgabe je Feld: `true`, `false` oder `null`. **`null` heißt „keine
 * Auskunft"** — die Datei fehlt, das Feld fehlt, oder die Messung ist zu alt.
 * Der Grund steht daneben, damit die Bereitschaftsliste ihn weiterreichen
 * kann, statt „unbekannt" zu sagen und den Leser raten zu lassen.
 *
 * @param {object|null} vermerk  der Inhalt von `data/aussenlage.json`
 * @param {string} heute  Geschäftstag als `YYYY-MM-DD`
 */
export function aussenlage(vermerk, heute) {
  if (!vermerk || typeof vermerk !== 'object') {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter: null,
      grund: 'kein Vermerk über die Außenlage — data/aussenlage.json fehlt' };
  }
  const alter = tageSeit(vermerk.gemessenAm, heute);
  if (alter === null) {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter: null,
      grund: `der Vermerk nennt kein lesbares Messdatum („${vermerk.gemessenAm}")` };
  }
  if (alter < 0) {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter,
      grund: `der Vermerk ist auf den ${vermerk.gemessenAm} datiert und damit auf morgen` };
  }
  if (alter > GRENZE_TAGE) {
    return { repositoryOeffentlich: null, domainErreichbar: null, alter,
      grund: `die Messung ist ${alter} Tage alt (Grenze ${GRENZE_TAGE}) — sie sagt über heute nichts` };
  }
  const feld = (wert) => (typeof wert === 'boolean' ? wert : null);
  return {
    repositoryOeffentlich: feld(vermerk.repositoryOeffentlich),
    domainErreichbar: feld(vermerk.domainErreichbar),
    alter,
    grund: null,
  };
}

/**
 * Hält den Vermerk gegen die Betreiberdatei.
 *
 * **Die Richtung, die den Fund machen würde:** Der Auftraggeber trägt „privat"
 * ein, und die Messung sagt „öffentlich". Ohne diesen Vergleich gewinnt, wer
 * zuletzt gelesen wird — und das ist die Angabe, nicht die Messung.
 *
 * @returns {{regel: string, text: string}[]}
 */
export function widerspruchsbefund(gemessen, erklaert) {
  if (gemessen.repositoryOeffentlich === null || typeof erklaert !== 'boolean') return [];
  const privatLautMessung = gemessen.repositoryOeffentlich === false;
  if (privatLautMessung === erklaert) return [];
  return [{
    regel: 'erklaerung-gegen-messung',
    text: `data/betreiber.json sagt „Repository ${erklaert ? 'privat' : 'öffentlich'}", `
      + `gemessen wurde „${gemessen.repositoryOeffentlich ? 'öffentlich' : 'privat'}" `
      + '— die Messung gilt, die Angabe gehört berichtigt',
  }];
}

/* ------------------------------------------------------------------ *
 * Die behaupteten Grenzen — und wann sie zuletzt jemand geprüft hat
 * ------------------------------------------------------------------ */

/**
 * Was dieser Bestand über die Außenwelt behauptet, nicht zu können.
 *
 * **Der Anlass: zweimal dasselbe an einem Abend.** Am 9. September stellte
 * sich heraus, dass `pr-veroeffentlicht.json` eine Prüfung der
 * Veröffentlichung für unmöglich erklärte, obwohl das GitHub-Werkzeug sie
 * beantwortet. Zwei Runden später dasselbe beim Repositorypunkt der
 * Bereitschaftsliste. **Beide Male hatte niemand es versucht.**
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.** Solange „nicht feststellbar" dasteht, sieht niemand nach —
 * > und die Behauptung altert ungeprüft weiter.
 *
 * Diese Liste dreht die Beweislast um: Wer eine Grenze behauptet, nennt den
 * **Weg**, auf dem sie geprüft wurde, und `data/aussenlage.json` trägt das
 * Datum und das Ergebnis. Wo es keinen Weg gibt, steht der Grund — und das
 * ist etwas anderes als „geht nicht".
 *
 * **Was sie nicht ist.** Kein Verzeichnis aller Stellen, die im Bestand „von
 * hier aus nicht feststellbar" schreiben; das sind über fünfzig, und die
 * meisten erklären eine Entwurfsentscheidung statt eine Umgebung. Hier stehen
 * die **Aussagen über die Außenwelt**, an denen eine Auskunft hängt.
 */
export const AUSSENGRENZEN = Object.freeze([
  Object.freeze({
    id: 'eigene-adresse',
    was: 'Ob die Seite unter bauversand.com erreichbar ist',
    wie: 'curl -L https://bauversand.com/ aus dieser Umgebung',
    haengtAn: 'Bereitschaftspunkt „Die Seite ist unter einer Adresse erreichbar"',
  }),
  Object.freeze({
    id: 'repository-sichtbarkeit',
    was: 'Ob das Repository öffentlich ist',
    wie: 'Feld visibility der Repository-Auskunft — über das GitHub-Werkzeug oder, '
      + 'seit dem 10. September gemessen, mit curl auf api.github.com',
    haengtAn: 'Bereitschaftspunkt „Repository ist privat"',
  }),
  /*
   * **Aufgenommen am 10. September 2026.** Diese Grenze hat es vorher nicht
   * gegeben, weil niemand sie für prüfbar hielt: `data/aussenlage.json` sagte,
   * der Netzausgang sei gesperrt — gemessen an drei Adressen, die es sind. Der
   * Abgleich der veröffentlichten Beschreibung brauchte einen Weg nach
   * draußen, und der erste Versuch mit dieser Adresse hat 200 geantwortet.
   */
  Object.freeze({
    id: 'github-schnittstelle',
    was: 'Ob die GitHub-Schnittstelle aus dieser Umgebung erreichbar ist',
    wie: 'curl https://api.github.com/repos/freudenthalerried-cmd/matlab',
    haengtAn: 'Der Abgleich der veröffentlichten PR-Beschreibung gegen die Quelle '
      + '(`npm run abgleich-veroeffentlichung`) und die Messung der Repository-Sichtbarkeit',
  }),
  /*
   * **Aufgenommen am 10. September 2026.** „Repository ist öffentlich" war bis
   * dahin ein **Feldwert** der Schnittstelle. Ob ein Fremder ohne Konto die
   * gebauten Seiten wirklich herunterlädt, hatte niemand versucht — und genau
   * darauf beruht die Empfehlung, das Repository privat zu stellen.
   */
  Object.freeze({
    id: 'fremder-zugriff',
    was: 'Ob ein Fremder ohne Zugangsdaten die gebauten Seiten herunterladen kann',
    wie: 'curl ohne Zugangsschlüssel auf raw.githubusercontent.com, eine Artikelseite',
    haengtAn: 'Die Empfehlung „privat stellen": Aus dem Verkaufspreis auf der gebauten Seite '
      + 'und der dokumentierten Zielmarge rechnet `npm run pruefe-geheimnis` 44 von 46 '
      + 'Einkaufspreisen auf den Cent zurück — aus genau diesen Bytes',
  }),
  Object.freeze({
    id: 'herstellerseiten',
    was: 'Ob die Merkblätter von Baumit, Schiedel, Synthesa und Isover abrufbar sind',
    wie: 'curl und WebFetch auf baumit.at, schiedel.at, synthesa.at, isover.at',
    haengtAn: 'Sieben Inhaltsseiten verweisen auf Merkblätter, keine verlinkt eines',
  }),
  Object.freeze({
    id: 'rechtsinformationssystem',
    was: 'Ob der Gesetzestext im RIS des Bundes abrufbar ist',
    wie: 'curl -L https://ris.bka.gv.at/',
    haengtAn: 'Jede Paragraphenangabe im Bestand — belegt ist keine am Volltext',
  }),
  Object.freeze({
    id: 'uid-pruefung',
    was: 'Ob die UID des Betriebs beim EU-Informationsaustauschsystem zu prüfen ist',
    wie: 'curl https://ec.europa.eu/ (VIES)',
    haengtAn: 'src/betreiberform.js prüft die UID nur auf ihre Form — die Prüfziffer sagt, '
      + 'dass die Zahl richtig getippt ist, nicht, dass sie zu dieser Gesellschaft gehört',
  }),
  Object.freeze({
    id: 'crawler-dokumentation',
    was: 'Ob die Crawler-Dokumentationen der Anbieter abrufbar sind',
    wie: 'curl auf developers.google.com, platform.openai.com, docs.anthropic.com, commoncrawl.org',
    haengtAn: 'Die Annahme in src/crawler.js, dass `Google-Extended` beim Anbieter auch den '
      + 'Assistenten steuert und nicht nur das Training — sie entscheidet, ob die Kennung '
      + 'erlaubt oder gesperrt gehört, und damit die Auffindbarkeit',
  }),
  Object.freeze({
    id: 'hosting-zeitzone',
    was: 'Welche Zeitzone auf dem Hosting eingestellt ist',
    wie: null,
    warumOhneVersuch: 'Es gibt keinen Zugang zum Hosting — weder Konto noch Schlüssel liegen '
      + 'hier. Die Frage ist seit dem 9. September gegenstandslos: `bestellung.php` setzt seine '
      + 'Zeitzone selbst, statt die des Hosts zu erben. Sie bleibt in der Liste, weil die '
      + 'Antwort vorher den Ausgang entschieden hätte und niemand sie gestellt hat.',
    haengtAn: 'Journaljahr und Ausstellungsdatum jeder eingehenden Bestellung',
  }),
  Object.freeze({
    id: 'sicherung-beim-hoster',
    was: 'Ob All-Inkl die Vorgangsablage in seine eigene Sicherung nimmt',
    wie: null,
    warumOhneVersuch: 'Derselbe fehlende Zugang. Anders als bei der Zeitzone lässt sich der '
      + 'Fall auch nicht umgehen: Die Ablage liegt dort, und ob sie gesichert wird, weiß nur '
      + 'der Auftraggeber oder sein Hoster. Der Punkt steht deshalb als offene Zulieferung '
      + 'und als siebzehnte Etappe im Rolloutplan.',
    haengtAn: 'Bereitschaftspunkt „Die Ablage der Vorgänge ist gesichert" (§ 132 BAO)',
  }),
  Object.freeze({
    id: 'suchvolumen',
    was: 'Wie oft die 29 Begriffe der Messliste im Liefergebiet gesucht werden',
    wie: null,
    warumOhneVersuch: 'Der Keyword-Planer verlangt ein Google-Ads-Konto mit laufender '
      + 'Kampagne, die Alternativen kosten 50 bis 119 € im Monat. Beides ist eine Ausgabe '
      + 'und damit freigabepflichtig — nicht eine Grenze der Umgebung, sondern eine '
      + 'Entscheidung, die aussteht (Gate 15).',
    haengtAn: 'Gate 15 — ob der Markt die Kampagne überhaupt trägt',
  }),
  Object.freeze({
    id: 'lieferantenangaben',
    was: 'Lieferzeit, Liefergebiet, Preisrhythmus, Palettenzahl, Abholung, Artikelliste',
    wie: null,
    warumOhneVersuch: 'Zwölf offene Punkte, die zusammen ein Brief an den Lieferanten löst. '
      + 'Eine Anfrage an Dritte ist nach den Freigaberegeln dieses Vorhabens dem Auftraggeber '
      + 'vorbehalten. Der Brief steht fertig in `npm run pruefe-anfrage`; was fehlt, ist die '
      + 'Freigabe, nicht der Weg.',
    haengtAn: 'Gate 25, Gate 28, die Auftragsbestätigung und die Weisung „mindestens 100 Artikel"',
  }),
]);

/** Wie lange ein Versuch trägt. */
export const VERSUCH_GRENZE_TAGE = 30;

/**
 * Hält die behaupteten Grenzen gegen die Versuche, sie zu überschreiten.
 *
 * @param {object|null} vermerk  der Inhalt von `data/aussenlage.json`
 * @param {string} heute  Geschäftstag als `YYYY-MM-DD`
 * @param {object[]} [grenzen]
 */
export function aussengrenzenbefund(vermerk, heute, grenzen = AUSSENGRENZEN) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const versuche = vermerk?.versuche ?? {};
  const bekannt = new Set(grenzen.map((g) => g.id));
  let gemessen = 0;
  let begruendet = 0;

  for (const g of grenzen) {
    if (!g.wie) {
      if (!g.warumOhneVersuch || g.warumOhneVersuch.length < 80) {
        melde('grund-zu-duenn', `${g.id}: ohne Weg braucht es einen Grund, und zwar einen ganzen`);
      } else {
        begruendet += 1;
      }
      if (versuche[g.id]) {
        melde('versuch-ohne-weg',
          `${g.id}: es gibt einen Versuch, aber die Grenze nennt keinen Weg — einer von beiden lügt`);
      }
      continue;
    }
    const v = versuche[g.id];
    if (!v) {
      melde('grenze-ohne-versuch',
        `${g.id}: „${g.was}" — ein Weg ist genannt und niemand ist ihn gegangen`);
      continue;
    }
    if (!['gesperrt', 'moeglich'].includes(v.ergebnis)) {
      melde('ergebnis-unbekannt', `${g.id}: „${v.ergebnis}" ist kein Ergebnis`);
      continue;
    }
    if (!v.beleg || v.beleg.length < 20) {
      melde('beleg-fehlt', `${g.id}: ein Ergebnis ohne Beleg ist eine Behauptung mit Ziffern`);
      continue;
    }
    const alter = tageSeit(v.am, heute);
    if (alter === null || alter < 0) {
      melde('versuch-ohne-datum', `${g.id}: „${v.am}" ist kein brauchbares Versuchsdatum`);
      continue;
    }
    if (alter > VERSUCH_GRENZE_TAGE) {
      melde('versuch-veraltet',
        `${g.id}: zuletzt vor ${alter} Tagen versucht (Grenze ${VERSUCH_GRENZE_TAGE}) — `
        + 'eine Sperre von damals ist keine Aussage über heute');
      continue;
    }
    gemessen += 1;
  }

  for (const id of Object.keys(versuche)) {
    if (!bekannt.has(id)) {
      melde('versuch-ohne-grenze', `${id}: ein Versuch, zu dem keine behauptete Grenze gehört`);
    }
  }

  return {
    meldungen,
    sauber: meldungen.length === 0,
    grenzen: grenzen.length,
    gemessen,
    begruendet,
    moeglich: grenzen.filter((g) => versuche[g.id]?.ergebnis === 'moeglich').length,
  };
}

/* ------------------------------------------------------------------ *
 * Was der Bestand über den Netzausgang behauptet
 * ------------------------------------------------------------------ */

/**
 * **Der Anlass, 10. September 2026.** Bis zum 9. September stand überall
 * derselbe Satz: *„Der Netzausgang dieser Umgebung ist gesperrt."* Am 9. wurde
 * gemessen, dass er zu weit gezogen ist — `api.github.com` antwortet,
 * `bauversand.com`, die Herstellerseiten und das Rechtsinformationssystem
 * nicht. Am 10. kamen `registry.npmjs.org` und `pypi.org` dazu, und vier
 * weitere Adressen des Bundes blieben stumm. Die Freigabe umfasst
 * Entwicklerinfrastruktur, nicht das offene Netz.
 *
 * Berichtigt wurde die Datei, in der es stand. **Gezählt: 22 solche Sätze in
 * 15 Quelldateien — die Berichtigung erreichte drei davon.**
 *
 * > **Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.**
 *
 * Genau dieser Satz hat diesen Bestand am 9. September die Leitzahl gekostet:
 * Die Frachtkorrektur war an der Funktion angekommen und nicht an den Daten.
 * Und einer der 22 Sätze war zu diesem Zeitpunkt bereits **widerlegt** — in
 * `src/schaufenster.js` stand, die veröffentlichte Fassung lasse sich von hier
 * aus nicht messen, während `npm run abgleich-veroeffentlichung` sie in
 * derselben Nacht gemessen hat.
 *
 * Diese Prüfung hält die Behauptungen über den Netzausgang gegen die Messungen
 * in `data/aussenlage.json`: **Wer sperrt, nennt die Adresse.** Eine Pauschale
 * ohne Adresse ist keine Messung, sondern ein Satz, der überall zutrifft und
 * deshalb nichts ausschließt.
 *
 * **Ihre Grenze, damit sie niemand überschätzt.** Gelesen werden `src` und
 * `bin` — der Quelltext, in dem eine Aussage *gilt*. Die Dokumente unter
 * `docs/` bleiben außen vor: Dort wird zitiert, auch der alte, widerlegte Satz,
 * und ein Prüfer kann Zitat und Behauptung nicht unterscheiden. Dieselbe
 * Entscheidung wie beim Uhrenregister, wo `uhr: 'zitat'` denselben Zweck hat.
 */

/**
 * Wovon eine Sperraussage handelt: vom Ausgang dieser Umgebung.
 *
 * **Erst als Muster über den ganzen Satz geschrieben, seit dem 10. September
 * über den Satz als Einheit.** Der erste Entwurf verlangte die Reihenfolge
 * *Netzausgang … ist … gesperrt*. Beim Nachziehen der siebzehn Fundstellen
 * wanderte das „ist" in fast allen davor — *„Für bauversand.com **ist** der
 * Netzausgang gesperrt"* —, und die Zahl der gesehenen Sätze fiel von 24 auf
 * 7. Der Prüfer wurde grün, weil die Sätze aus seinem Blickfeld gerutscht
 * waren, nicht weil sie ihre Adresse bekommen hatten.
 *
 * > **Ein Prüfer, der grün wird, weil er wegsieht, ist schlimmer als keiner.**
 *
 * Gesucht wird deshalb der **Satz**, in dem das Wort steht, und darin ein
 * Sperrwort — in beliebiger Reihenfolge.
 */
export const SPERRWORT = /gesperrt|sperrt|nicht erreichbar|keine Verbindung|antwortet nicht/;

/** Das Wort, um dessen Sätze es geht. */
export const AUSGANGSWORT = /Netzausgang/g;

/**
 * Wie weit um eine Fundstelle herum eine Adresse noch als „daneben" gilt.
 *
 * **Nicht größer.** Ein weiter Umkreis findet irgendwo im Absatz eine Adresse
 * und erklärt damit einen Satz für gedeckt, der sie gar nicht meint.
 */
export const UMFELD = 400;

/** Die Adressen, zu denen ein Versuch mit Datum und Beleg vorliegt. */
export function gemesseneAdressen(versuche = {}) {
  const gefunden = new Set();
  for (const v of Object.values(versuche ?? {})) {
    for (const a of String(v?.beleg ?? '').match(/[a-z0-9-]+(?:\.[a-z0-9-]+){1,3}/g) ?? []) {
      if (/\.(?:at|com|org|io|net)$/.test(a)) gefunden.add(a);
    }
  }
  return gefunden;
}

/**
 * Hält die Sperraussagen des Quelltextes gegen die Messungen.
 *
 * @param {{pfad: string, text: string}[]} dateien
 * @param {object} versuche der Abschnitt `versuche` aus data/aussenlage.json
 */
export function aussagenbefund(dateien, versuche = {}) {
  const meldungen = [];
  const bekannt = gemesseneAdressen(versuche);
  let gefunden = 0;

  for (const { pfad, text } of dateien) {
    const ganz = String(text ?? '');
    const re = new RegExp(AUSGANGSWORT.source, 'g');
    let treffer = re.exec(ganz);
    while (treffer) {
      // Der Satz um das Wort herum: von einem Punkt bis zum nächsten.
      const anfang = ganz.lastIndexOf('.', treffer.index) + 1;
      const punkt = ganz.indexOf('.', treffer.index);
      const satz = ganz.slice(anfang, punkt < 0 ? ganz.length : punkt + 1);
      if (!SPERRWORT.test(satz)) { treffer = re.exec(ganz); continue; }
      gefunden += 1;
      const von = Math.max(0, treffer.index - UMFELD);
      const umfeld = ganz.slice(von, treffer.index + UMFELD);
      const genannt = [...bekannt].some((a) => umfeld.includes(a));
      if (!genannt) {
        const zeile = ganz.slice(0, treffer.index).split('\n').length;
        meldungen.push({
          regel: 'pauschale-sperre',
          pfad,
          zeile,
          text: `${pfad}:${zeile} sperrt den Ausgang, ohne eine gemessene Adresse zu nennen — `
            + 'er sperrt nach Adresse verschieden, und ein Satz, der überall zutrifft, '
            + 'schließt nichts aus',
        });
      }
      treffer = re.exec(ganz);
    }
  }

  return {
    meldungen,
    gefunden,
    adressen: bekannt.size,
    sauber: meldungen.length === 0,
  };
}
