/**
 * Die Hersteller hinter den Lieferantenbezeichnungen.
 *
 * **Hierher verlegt am 01.09.** Die Tabelle stand in `bin/website.mjs`, also
 * in einem Bauwerkzeug — erreichbar nur für die Seiten. Die Folge stand im
 * Produktfeed: Jede Artikelseite trug ihre Marke im JSON-LD, **jede der 43
 * Feedzeilen trug keine.** `angebotsAuszeichnung` liest `artikel.hersteller`,
 * und dieses Feld gibt es im Katalog nicht — es wird in 0 von 46 Artikeln
 * gesetzt. Die Marke stand ausschließlich im Bauwerkzeug, das den Feed nicht
 * baut.
 *
 * `brand` ist für einen Produktfeed bei Markenware eine Pflichtangabe.
 * Dieselbe Bauart wie die fehlende Produktadresse eine Stunde davor: Die
 * Seite weiß etwas, das der Feed nicht weiß, weil das Wissen im Werkzeug
 * liegt statt im Modul.
 */
/**
 * Wo das technische Merkblatt zu finden ist.
 *
 * Bewusst nur die Herstellerseite, kein tiefer Link auf ein konkretes PDF:
 * Ein erfundener Dokumentpfad sieht aus wie ein Beleg und ist keiner, und
 * echte Merkblattlinks ändern sich mit jeder Überarbeitung. Der Weg über die
 * Herstellersuche ist einen Klick länger und bleibt richtig.
 */
export const HERSTELLER = {
  Capatect: { name: 'Synthesa (Capatect)', url: 'https://www.synthesa.at/' },
  Baumit: { name: 'Baumit Österreich', url: 'https://www.baumit.at/' },
  Schiedel: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIKM: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIK: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  Isover: { name: 'Isover Österreich', url: 'https://www.isover.at/' },
  Soudal: { name: 'Soudal', url: 'https://www.soudal.com/' },
  // Produktlinien statt Firmennamen. Beleg dafür, dass „Absolut" und „SIH"
  // Schiedel-Linien sind: das Konditionenblatt des Lagerhauses führt sie
  // unter „Schiedel Absolut, SIH" (`lagerhaus-rabatte-gelesen.md`, Seite 18).
  Absolut: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIH: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  // **Ergänzt am 8. September 2026 — vier Marken aus der zweiten Liste.**
  // `bin/kampagne.mjs` führte bis heute eine eigene Markenliste für die
  // Anzeigen-Keywords, elf Namen lang, und sie kannte diese vier. Folge:
  // Ökotherm, Ravenit, Prima und SunCore wurden als Markenbegriff **beworben**
  // und trugen auf ihrer Artikelseite „Für diesen Artikel liegt uns kein
  // Herstellermerkblatt vor".
  //
  // Sie stehen deshalb hier — mit `url: null`, denn eine Merkblattadresse ist
  // uns für sie nicht belegt, und eine geratene wäre schlimmer als keine. Der
  // Satz auf der Artikelseite bleibt damit unverändert richtig; neu ist nur,
  // dass es **eine** Liste ist und der Mangel eine Lücke mit Grund statt einer
  // stillen Auslassung.
  Ravenit: { name: 'Ravenit', url: null, warumOhneUrl: 'Vergussmörtel eines Baustoffherstellers; in den fünfzehn Rechnungen steht der Markenname ohne Hersteller- oder Merkblattangabe, und eine geratene Adresse wäre eine erfundene Quelle.' },
  SunCore: { name: 'SunCore', url: null, warumOhneUrl: 'Abdeckklebeband; dasselbe — die Rechnung nennt den Markennamen und sonst nichts. Für ein Klebeband gibt es auch keine Verarbeitungsrichtlinie, die auf der Artikelseite fehlte.' },
  'Ökotherm': { name: 'Ökotherm', url: null, warumOhneUrl: 'Hochlochziegel und der einzige Mauerwerksartikel des Katalogs. Gerade hier wäre ein Merkblatt wertvoll — die Bemessung hängt an der Steinfestigkeit —, und gerade hier ist keines belegt. Die Frage gehört in die Artikelliste des Lieferanten.' },
  Prima: { name: 'Prima', url: null, warumOhneUrl: 'Dosierpistole, ein Werkzeug ohne Einbauvorschrift. Ein Merkblatt fehlt hier ohne Folge für den Bau — aufgenommen ist die Marke, damit die Liste vollständig ist und nicht, weil sie etwas verspricht.' },
};

/**
 * Die Marke aus der Artikelbezeichnung.
 *
 * Der erste Wurf prüfte `bez.startsWith(m)` — die Marke musste ganz vorn
 * stehen. Bei Lieferantenbezeichnungen steht sie das oft nicht:
 * „Mantelstein MSTS EZ 16-18 **SIKM**", „Regenhaube mit Sicherungsseil 180
 * **Absolut & SIH**", „Thermo-Trennstein 12-18 EZ **Absolut**". Drei
 * Schiedel-Artikel trugen deshalb den Satz „Für diesen Artikel liegt uns
 * kein Herstellermerkblatt vor", obwohl der Hersteller in der Bezeichnung
 * steht.
 *
 * Gesucht wird jetzt überall im Text, aber nur als **ganzes Wort** — sonst
 * fände „SIK" das Wort „Sikkativ" und „Absolut" das Adverb. Die längste
 * Marke gewinnt, damit „SIKM" nicht von „SIK" verdeckt wird.
 */
export const marke = (bez) => Object.keys(HERSTELLER)
  .sort((a, b) => b.length - a.length)
  .find((m) => new RegExp(`(?<![\\p{L}\\d])${m}(?![\\p{L}\\d])`, 'u').test(bez)) ?? null;
/**
 * Der Quelltext ohne seine Kommentarzeilen.
 *
 * **Warum nicht `entkleide()` aus `src/buendel.js`:** Der Name klingt danach,
 * und ich habe ihn zuerst dafür genommen. Es nimmt aber Import- und
 * Export-Syntax weg, keine Kommentare — der erste Lauf meldete daraufhin zwei
 * Dateien, die nur *über* Marken schreiben. Die Prüfung hat ihren eigenen
 * Verfasser gefangen, und zwar mit demselben Fehler, um den es in dieser Runde
 * geht: eine Sache benutzen, ohne sie gelesen zu haben.
 *
 * Diese Fassung ist bewusst grob: Sie wirft Zeilen weg, die mit `//`, `/*`
 * oder `*` beginnen. Ein Kommentar am Zeilenende bleibt stehen — das reicht
 * für die Frage, ob eine Datei eine **Liste** führt, denn eine Liste steht in
 * eigenen Zeilen.
 */
export const ohneKommentarzeilen = (quelle) => String(quelle)
  .split('\n')
  .filter((z) => !/^\s*(\/\/|\/\*|\*)/.test(z))
  .join('\n');

/**
 * Dateien, in denen Markennamen stehen dürfen, ohne eine Liste zu sein.
 *
 * **Beim ersten Lauf sofort gebraucht.** Die Gegenprobe zu dieser Regel legt
 * die zweite Liste absichtlich wieder an — ihr Ersatztext trägt drei
 * Markennamen als Zeichenkette und steht damit selbst im Register. Der Prüfer
 * meldete daraufhin das Register, und die Gegenprobe fand einen Prüfer vor,
 * der schon rot war.
 *
 * Dasselbe Muster wie am 7. September bei `pruefe-ungerufen`: Ein Register,
 * das Quelltext wörtlich zitiert, wird von jeder Regel getroffen, die diesen
 * Quelltext sucht.
 *
 * > **Wer über eine Liste schreibt, schreibt sie hin.**
 */
export const NICHT_DURCHSUCHT = Object.freeze([
  Object.freeze({
    datei: 'src/gegenprobenregister.js',
    warum: 'Es führt zu jeder Gegenprobe den Such- und den Ersatztext wörtlich. Wo eine '
      + 'Mutation eine Markenliste wiederherstellt, steht diese Liste dort im Klartext — '
      + 'nicht als Datenhaltung, sondern als Beweisstück. Eine Regel, die das meldet, '
      + 'verbietet ihre eigene Gegenprobe.',
  }),
]);

/**
 * Führt noch irgendwo eine zweite Markenliste?
 *
 * **Der Anlass, 8. September 2026, abends.** Der Bestand führte **drei**:
 * `HERSTELLER` in `src/hersteller.js` (neun Namen, mit Merkblattadresse und
 * Beleg), `MARKEN` in `bin/kampagne.mjs` (elf Namen, für die Anzeigen-Keywords)
 * und — seit einer Stunde — `SYSTEME` in `src/systemtreue.js` (zwei Namen).
 *
 * Sie waren nicht deckungsgleich, und beide Richtungen hatten Folgen:
 *
 *   · **Vier Artikel** trugen eine Marke für die Keywords und keinen Hersteller
 *     fürs Merkblatt — Ökotherm, Ravenit, Prima, SunCore. Ihre Artikelseite
 *     sagte „Für diesen Artikel liegt uns kein Herstellermerkblatt vor",
 *     während die Kampagne mit dem Markennamen wirbt.
 *   · **Zwei Artikel** — die beiden Absolut-Kaminteile — hatten den Hersteller
 *     fürs Merkblatt, und ihre Marke floss in kein Keyword.
 *
 * > **Zwei Listen für dieselbe Sache sind eine Liste, die niemand pflegt** —
 * > und die dritte baut der, der die erste nicht kennt.
 *
 * Gesucht wird ohne die Kommentarzeilen (`ohneKommentarzeilen` darüber),
 * sonst zählte jede Erwähnung im Fließtext mit — dieses Modul selbst nennt
 * oben dreizehn Marken.
 *
 * @param {{datei: string, quelle: string}[]} dateien  ohne `src/hersteller.js`
 * @param {string[]} namen  die Marken der einen Liste
 * @param {(quelle: string) => string} ohneKommentare
 */
export function markenlistenbefund(dateien, namen, ohneKommentare, ausnahmen = NICHT_DURCHSUCHT) {
  const meldungen = [];
  const befreit = new Set(ausnahmen.map((a) => a.datei));
  for (const a of ausnahmen) {
    if (dateien.some((d) => d.datei === a.datei)) continue;
    meldungen.push({
      regel: 'ausnahme-ohne-datei',
      text: `${a.datei} ist von der Suche ausgenommen, die Datei gibt es aber nicht mehr`,
    });
  }
  for (const d of dateien) {
    if (befreit.has(d.datei)) continue;
    const nackt = ohneKommentare(d.quelle);
    const treffer = namen.filter((n) => new RegExp(`['"\`]${n}['"\`]`).test(nackt));
    // Eine einzelne Marke ist ein Sonderfall (`gebinde.js` kennt Capatect,
    // weil ein Gebinde daran hängt). Zwei nebeneinander sind eine Liste.
    if (treffer.length >= 2) {
      meldungen.push({
        regel: 'zweite-markenliste',
        text: `${d.datei} führt ${treffer.length} Markennamen als Zeichenkette `
          + `(${treffer.join(', ')}) — die eine Liste steht in src/hersteller.js`,
      });
    }
  }
  return { geprueft: dateien.length, meldungen, sauber: meldungen.length === 0 };
}
