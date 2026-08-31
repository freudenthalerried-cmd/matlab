/**
 * Widerrufsregister — was einmal zurückgenommen wurde, darf nicht
 * unbemerkt weiterleben.
 *
 * Anlass ist ein Muster, das dreimal aufgetreten ist: Eine Aussage wird in
 * einem Dokument widerrufen, und in einem **Nachbardokument** steht sie
 * unverändert weiter. Beim ersten Mal war es ein Marktbefund (`zwei-ried.md`),
 * beim zweiten eine Gate-Auslegung (`zahlungsziel-entschieden.md`), beim
 * dritten eine Rabattthese (`lagerhaus-rabatte-gelesen.md`). Jedes Mal fiel
 * es zufällig auf, jedes Mal Stunden später.
 *
 * **Der Widerruf ist billig, das Nachziehen ist die Arbeit.** Wer eine
 * These zurücknimmt, schreibt das dort auf, wo er gerade schreibt — und
 * genau dort ist sie schon berichtigt. Die Kopien stehen woanders.
 *
 * Die Regel dieses Prüfers ist deshalb **nicht** „das Wort darf nicht mehr
 * vorkommen". Widerrufene Sätze müssen zitierbar bleiben, sonst verliert
 * das Verzeichnis seine Fehlergeschichte, und die ist der wertvollste Teil.
 * Die Regel lautet:
 *
 * > **Eine widerrufene Aussage darf überall stehen — aber nie ohne ihren
 * > Widerruf in Sichtweite.**
 *
 * Gemeldet wird also nur der Treffer, in dessen Umfeld kein
 * Widerrufsmerkmal steht. Das ist dieselbe Bauart wie `inhaltspruefung.js`:
 * ein grober Musterprüfer, der einen **Verdacht** meldet, kein Urteil.
 */

/** Wie viele Zeilen um den Treffer als „in Sichtweite" gelten. */
export const SICHTWEITE = 8;

/**
 * Wie weit oben ein Widerrufsvermerk stehen muss, um für das **ganze**
 * Dokument zu gelten.
 *
 * `rechnung-zum-zuschlag.md` macht es vor: ein eingerückter Kasten unter
 * der Überschrift, „Überholt seit 25.08. …". Wer den liest, liest alles
 * Folgende mit dem richtigen Vorzeichen. Ein solcher Kopfvermerk deckt
 * deshalb jede Fundstelle der Datei — aber nur, wenn er als Zitatblock
 * (`>`) gesetzt ist. Ein Widerruf, der wie Fließtext aussieht, wird
 * überlesen.
 */
export const KOPFZEILEN = 15;

/**
 * Wörter, die einen Widerruf kenntlich machen.
 *
 * Die Liste ist **absichtlich eng**. Der erste Entwurf enthielt „falsch",
 * „gestrichen" und „nicht mehr" — damit verstummte der Prüfer genau an der
 * Stelle, für die er gebaut wurde: In `umsetzung-shop.md` steht acht Zeilen
 * unter dem stehengebliebenen Irrtum der Satz „Gegenproben: Ried
 * gestrichen", der etwas ganz anderes meint. Ein Merkmal, das zufällig
 * danebensteht, ist kein Widerruf.
 *
 * Aufgenommen ist nur, was ausdrücklich eine frühere Aussage zurücknimmt.
 */
export const WIDERRUFSMERKMAL =
  /widerruf|widerlegt|widerlegen|widerlegt|berichtigt|Berichtigung|Irrtum|irrtümlich|irrig|Verwechslung|hält (?:das )?nicht|hielt nicht|hält nicht|zurückgenommen|zurückgezogen|überholt|alte Fassung|erste Fassung|frühere (?:Fassung|Zuschreibung|Annahme)|bisher behauptet|falsche[nr]? Schluss|nicht mehr gültig|~~/i;

/**
 * Das Register.
 *
 * Jeder Eintrag nennt: was behauptet wurde, wann und wo es zurückgenommen
 * wurde, was stattdessen gilt — und ein Muster, das die widerrufene
 * Formulierung findet.
 *
 * Die Muster laufen über den **ganzen Dateitext**, nicht zeilenweise:
 * Markdown bricht Sätze um, und der dritte Fall des Musters („Ried im
 * Innkreis, der ausgenommene\nHeimatbezirk") wäre zeilenweise unsichtbar
 * geblieben. Deshalb `[\s\S]` statt `.` und die Zeilennummer aus der
 * **Fundstelle**, nicht aus einem Zähler — derselbe Fehler steckte schon
 * einmal in `inhaltspruefung.js`.
 *
 * Neben dem Muster trägt jeder Eintrag ein **eigenes Merkmal**: die Worte,
 * an denen man erkennt, dass *diese* Berichtigung mitgeführt wird. Der
 * erste Entwurf hatte nur die allgemeine Liste oben, und die war das
 * falsche Werkzeug — sie ließ sich von einem beliebigen Berichtigungswort
 * in der Nähe beruhigen, das eine ganz andere Sache berichtigte (in
 * `STATUS.md` steht acht Zeilen unter der alten Zuschlagsrechnung, dass
 * *Gate 1* abgelöst wurde). **Ein Widerruf deckt nur seine eigene
 * Aussage.**
 *
 * `beispiel` hält den **ursprünglichen Wortlaut** fest — nicht als Zierde:
 * Ein Testfall prüft damit, dass jedes Muster seine eigene These noch
 * findet. Ein Muster, das nichts mehr trifft, meldet nichts und sieht
 * deshalb aus wie ein Erfolg. Genau so ist die erste Fassung dieses
 * Registers durchgefallen: `these` steht im Konjunktiv („staffele"), das
 * Muster sucht den Indikativ.
 */
export const WIDERRUFE = Object.freeze([
  {
    id: 'heimatbezirk-innkreis',
    these: 'Der Heimatbezirk des Auftraggebers sei Ried im Innkreis und damit vom Radonvorsorgegebiet ausgenommen.',
    statt: 'Der Sitz ist 4312 Ried in der Riedmark, Bezirk Perg. Perg ist Vorsorgegebiet — der Befund steht auf dem Kopf.',
    widerrufenAm: '2026-08-26',
    belegt: 'zwei-ried.md',
    muster: /Ried im Innkreis[\s\S]{0,120}Heimatbezirk|Heimatbezirk[\s\S]{0,120}Ried im Innkreis/g,
    merkmal: /Riedmark|Bezirk Perg|zwei-ried|Verwechslung/i,
    beispiel: 'Beispielwert ist Ried im Innkreis, der ausgenommene Heimatbezirk des Betreibers.',
  },
  {
    id: 'gate21-nur-rechnungskauf',
    these: 'Nur der Rechnungskauf könne Gate 21 verletzen.',
    statt: 'Gemessen wird der Geldeingang. Der Rechnungskauf über einen Anbieter hält das Gate (er zahlt sofort aus); was es verletzt, ist die offene Rechnung auf eigenes Risiko.',
    widerrufenAm: '2026-08-26',
    belegt: 'zahlungsziel-entschieden.md, gate-register.md (Gate 21)',
    muster: /[Nn]ur der Rechnungskauf[\s\S]{0,60}(?:verletzt|verletzen|kann das Gate)/g,
    merkmal: /über einen Anbieter|Geldeingang|offene Rechnung auf eigenes Risiko|zahlungsziel-entschieden/i,
    beispiel: 'Nur der Rechnungskauf kann das Gate verletzen — und genau der ist im Baustoffhandel üblich.',
  },
  {
    id: 'lagerhaus-regal-gegen-baustelle',
    these: 'Das Lagerhaus staffele fest, was im Regal liegt, und verhandle einzeln, was auf die Baustelle gefahren wird.',
    statt: 'Widerlegt durch Schiedel (30–35 %) und Isover (52–53 %) — beides fest gestaffelt und palettenweise auf die Baustelle.',
    widerrufenAm: '2026-08-27',
    belegt: 'lagerhaus-rabatte-gelesen.md',
    muster: /staffelt fest, was im Regal|im Regal liegt[\s\S]{0,80}verhandelt einzeln/g,
    merkmal: /kein einfaches Prinzip|Schiedel|Isover|erste Fassung/i,
    beispiel: 'Das Lagerhaus staffelt fest, was im Regal liegt, und verhandelt einzeln, was auf die Baustelle gefahren wird.',
  },
  {
    id: 'lagerhaus-rohstoff',
    these: 'Die Trennlinie zwischen fester Staffel und „auf Anfrage" verlaufe entlang des Rohstoffs.',
    statt: 'Widerlegt durch die Ziegelseite: Planziegel stehen auf Anfrage, N+F-Steine aus demselben Ton haben 60 %. Es gibt kein einfaches Prinzip — was bleibt, ist eine Liste.',
    widerrufenAm: '2026-08-27',
    belegt: 'lagerhaus-rabatte-gelesen.md',
    muster: /Trennlinie[\s\S]{0,80}Rohstoff|Rohstoff[\s\S]{0,60}Trennlinie/g,
    merkmal: /kein einfaches Prinzip|Planziegel|hält (?:das )?nicht/i,
    beispiel: 'Die Trennlinie verläuft nicht entlang der Warengruppen, sondern entlang des Rohstoffs.',
  },
  {
    id: 'fracht-auf-jedem-beleg',
    these: 'Die Frachtpauschale stehe auf jedem der fünfzehn Belege.',
    statt: 'Fracht steht auf drei von fünfzehn Rechnungen. Elf lauten „Abholung Kunde", eine „Retour durch Kunde" — der Auftraggeber holt meistens selbst am Lager Mauthausen ab.',
    widerrufenAm: '2026-08-27',
    belegt: 'fracht-nur-bei-zustellung.md',
    muster: /Frachtpauschale[\s\S]{0,60}auf jedem Beleg|auf jedem Beleg[\s\S]{0,60}Frachtpauschale|Befund aus allen f(?:ue|ü)nfzehn Rechnungen/g,
    merkmal: /drei von f(?:ue|ü)nfzehn|Abholung Kunde|fracht-nur-bei-zustellung|BERICHTIGT|Berichtigt/i,
    beispiel: 'Die Frachtpauschale steht auf jedem Beleg, auch auf dem über 1.934 Euro.',
  },
  {
    id: 'marge-als-zuschlag',
    these: '„25 %" seien 25 % Zuschlag auf den Einkauf (= 20 % Rohmarge).',
    statt: 'Der Auftraggeber hat „25 %" als Marge geklärt: 33,33 % Zuschlag, nötiger Monatsumsatz 45.356 € statt 72.740 €.',
    widerrufenAm: '2026-08-26',
    belegt: 'marge-25-prozent.md',
    muster: /25\s*%\s*\*{0,2}Zuschlag/g,
    merkmal: /25\s*%\s*\**\s*Marge|33,3+\s*%\s*Zuschlag|jetzt gültig|marge-25-prozent/i,
    beispiel: '25 % Zuschlag auf den Einkauf sind eine Rohmarge von 20 % vom Verkauf.',
  },
  {
    id: 'rahmen-ohne-javascript',
    these: 'Ein eingebettetes Dokument führe in diesem Headless-Chromium seine Skripte nicht aus.',
    statt: 'Es führt sie aus. Angehalten hat der Parser am Stylesheet von fonts.googleapis.com, das hinter dem Ausgangsproxy hängt statt zu scheitern. Ohne Proxy: shop=object, ready=complete — mit: shop=undefined, ready=loading.',
    widerrufenAm: '2026-08-28',
    belegt: 'rahmen-lief-doch.md',
    muster: /Skripte? nicht aus|misst (?:die Seite )?(?:also )?\*{0,2}ohne JavaScript/g,
    merkmal: /Proxy|proxy-server|rahmen-lief-doch|Widerrufen|widerrufen|BERICHTIGT|Berichtigt/i,
    beispiel: 'Der Rahmen misst die Seite also ohne JavaScript.',
  },
]);

/**
 * Steht im Kopf der Datei ein Widerrufsvermerk als Zitatblock?
 *
 * Dann gilt er für das ganze Dokument.
 */
export function kopfwiderruf(text, { kopfzeilen = KOPFZEILEN, merkmal } = {}) {
  return text.split('\n').slice(0, kopfzeilen).some(
    (z) => /^\s*>/.test(z) && (WIDERRUFSMERKMAL.test(z) || (merkmal ? merkmal.test(z) : false)),
  );
}

/** Zeilennummer aus der Fundstelle — nicht aus einem Zähler. */
function zeileVon(text, stelle) {
  let zeile = 1;
  for (let i = 0; i < stelle && i < text.length; i++) if (text[i] === '\n') zeile++;
  return zeile;
}

/** Der Textausschnitt, der als „in Sichtweite" gilt. */
export function sichtfeld(text, zeile, sichtweite = SICHTWEITE) {
  const zeilen = text.split('\n');
  const von = Math.max(0, zeile - 1 - sichtweite);
  const bis = Math.min(zeilen.length, zeile + sichtweite);
  return zeilen.slice(von, bis).join('\n');
}

/**
 * Sucht in einem Text nach widerrufenen Aussagen.
 *
 * Zurück kommt **jeder** Fund, gedeckt oder nicht — wer nur die Meldungen
 * zurückgibt, kann später nicht mehr sagen, wie oft ein Widerruf richtig
 * mitgeführt wurde.
 */
export function findeWiderrufe(text, { register = WIDERRUFE, sichtweite = SICHTWEITE, kopfzeilen = KOPFZEILEN } = {}) {
  const funde = [];
  for (const eintrag of register) {
    const imKopf = kopfwiderruf(text, { kopfzeilen, merkmal: eintrag.merkmal });
    const muster = new RegExp(eintrag.muster.source, eintrag.muster.flags.includes('g')
      ? eintrag.muster.flags
      : eintrag.muster.flags + 'g');
    let treffer;
    while ((treffer = muster.exec(text)) !== null) {
      if (treffer[0].length === 0) { muster.lastIndex++; continue; }
      const zeile = zeileVon(text, treffer.index);
      const umfeld = sichtfeld(text, zeile, sichtweite);
      funde.push({
        id: eintrag.id,
        zeile,
        fundstelle: treffer[0].replace(/\s+/g, ' ').slice(0, 90),
        gedeckt: imKopf
          || WIDERRUFSMERKMAL.test(umfeld)
          || (eintrag.merkmal ? eintrag.merkmal.test(umfeld) : false),
        wodurch: imKopf ? 'Kopfvermerk' : 'in Sichtweite',
        eintrag,
      });
    }
  }
  return funde.sort((a, b) => a.zeile - b.zeile);
}

/**
 * Prüft mehrere Dateien.
 *
 * `dateien` ist eine Liste von `{ name, text }` — das Einlesen bleibt beim
 * Aufrufer, damit der Kern ohne Dateisystem prüfbar ist.
 */
export function pruefeBestand(dateien, optionen = {}) {
  const meldungen = [];
  let funde = 0;
  for (const datei of dateien) {
    for (const fund of findeWiderrufe(datei.text, optionen)) {
      funde++;
      if (!fund.gedeckt) meldungen.push({ ...fund, datei: datei.name });
    }
  }
  return {
    dateien: dateien.length,
    register: (optionen.register ?? WIDERRUFE).length,
    funde,
    gedeckt: funde - meldungen.length,
    meldungen,
    sauber: meldungen.length === 0,
  };
}

/* ------------------------------------------------------------------ *
 * Wo gesucht wird
 * ------------------------------------------------------------------ */

/**
 * Die Bestände, in denen eine widerrufene Aussage überleben kann.
 *
 * **Steht hier und nicht im Werkzeug**, seit dem 31.08. — vorher stand die
 * Reichweite des Prüfers in `bin/widerrufpruefung.mjs` und war damit von
 * keiner Probe erreichbar. Eine Wache, deren Sichtfeld niemand nachmessen
 * kann, ist eine Vermutung: Der Prüfer las bis dahin nur `docs/`, meldete
 * grün — und der Shop trug an drei Stellen den Satz, der am 27.08.
 * zurückgenommen worden war.
 *
 * Nicht gelesen wird `ausgabe/` — das ist Erzeugnis, kein Bestand. Wer den
 * Satz dort trifft, hat ihn hier schon getroffen; wer ihn **nur** dort
 * trifft, hat eine alte Ausgabe vor sich und keinen Fehler im Text.
 */
export const BESTAENDE = Object.freeze([
  Object.freeze({ ordner: ['docs', 'baustoff-shop'], endung: '.md', was: 'Akte' }),
  Object.freeze({ ordner: ['shop', 'inhalte'], endung: '.md', was: 'Shoptexte' }),
  Object.freeze({ ordner: ['shop', 'bin'], endung: '.mjs', was: 'Werkzeuge' }),
  Object.freeze({ ordner: ['shop', 'src'], endung: '.js', was: 'Rechenkern' }),
]);

/**
 * Das Register selbst muss den widerrufenen Satz wörtlich führen — sonst
 * könnte es ihn nicht suchen. Es ist der eine Ort, an dem die Aussage stehen
 * darf, ohne dass etwas faul ist, und deshalb der eine ausgenommene.
 */
export const AUSGENOMMEN = Object.freeze([['shop', 'src', 'widerruf.js']]);

/**
 * Alle Dateien der Bestände, als Pfade relativ zur Projektwurzel.
 *
 * Der Sortierschlüssel ist der Pfad, damit die Reihenfolge der Meldungen
 * nicht von der Reihenfolge im Dateisystem abhängt.
 *
 * @param {(ordner: string) => {name: string, verzeichnis: boolean}[]} lies
 *   Verzeichnisleser — hereingereicht, damit die Probe ihn ersetzen kann.
 */
export function bestandsdateien(lies, bestaende = BESTAENDE, ausgenommen = AUSGENOMMEN) {
  const gesperrt = new Set(ausgenommen.map((t) => t.join('/')));
  const treffer = [];
  const gehe = (teile, endung) => {
    for (const eintrag of lies(teile.join('/'))) {
      const pfad = [...teile, eintrag.name];
      if (eintrag.verzeichnis) gehe(pfad, endung);
      else if (eintrag.name.endsWith(endung) && !gesperrt.has(pfad.join('/'))) treffer.push(pfad.join('/'));
    }
  };
  for (const b of bestaende) gehe([...b.ordner], b.endung);
  return treffer.sort((a, b) => a.localeCompare(b));
}
