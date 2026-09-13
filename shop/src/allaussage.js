/**
 * Ein Testname, der **alle** sagt, und ein Rumpf, der **eine** prüft.
 *
 * **Der Anlass, 14. September 2026.** Am Vortag ist dieselbe Bauart dreimal
 * aufgefallen, jedes Mal an einer anderen Stelle und jedes Mal durch Zufall:
 *
 * | Zusicherung | was ihr Name sagte | was sie prüfte |
 * |---|---|---|
 * | `test/huebe.test.js` | „der Hubsatz steht **nur an einer Stelle**" | zwei der drei Stellen |
 * | `beschreibungsbefund` | jede Beschreibung sagt etwas **Eigenes** | eigen hieß: steht in keinem Nachbarfeld |
 * | `lesbarkeit` | der Name trägt **ein** Maß | der Leser fand ein Maß |
 *
 * > **Dreimal an einem Tag hat eine Zusicherung etwas anderes zugesichert, als
 * > ihr Name sagt.**
 *
 * Drei Funde durch Zufall sind kein Grund zu glauben, es seien die letzten —
 * derselbe Satz, mit dem am 11. September das Zwillingsregister begann.
 *
 * ## Was hier gemessen wird, und was nicht
 *
 * Ein Testname ist Prosa; ihn mit seinem Rumpf zu vergleichen, geht im
 * Allgemeinen nicht maschinell. **Ein Sonderfall geht:** der **Allquantor**.
 * Sagt ein Name „jede", „jeder", „jedes" oder „alle", dann behauptet er eine
 * Aussage über eine **Menge** — und ein Rumpf, der zwei Stichproben nimmt,
 * sichert sie nicht zu.
 *
 * Gemessen an den Testdateien dieses Hauses: 305 von 2498 Testnamen tragen
 * einen Allquantor.
 *
 * ## Wie ein Rumpf eine Menge zusichert
 *
 * Drei Formen, alle drei im Bestand belegt:
 *
 * - **Eine Schleife** über die Menge (`for`, `forEach`, `every`).
 * - **Ein `deepEqual`** gegen die ganze erwartete Menge.
 * - **Eine Zusicherung über die Anzahl.** `test/rechtstexte.test.js` tut genau
 *   das: `assert.equal(p.fehlend.length, IMPRESSUMSFELDER.length - 2)` — die
 *   Zahl der Meldungen gegen das Register, aus dem sie kommen. Fehlte eine
 *   Pflichtangabe in der Meldung, fiele die Zahl.
 *
 * Und die Form, die **nicht** zusichert, ebenfalls belegt: zweimal
 * `assert.ok(p.fehlend.some(…))`. Sie zeigt, dass zwei von zehn Feldern
 * genannt werden.
 *
 * > **Zwei Stichproben sind keine Allaussage — sie sind zwei Stichproben.**
 */

/** Wörter, mit denen ein Name eine Aussage über eine ganze Menge behauptet. */
export const ALLQUANTOREN = Object.freeze(
  ['jede', 'jeder', 'jedes', 'jeden', 'alle', 'allen', 'sämtliche', 'saemtliche'],
);

const ALLQUANTOR = new RegExp(`\\b(${ALLQUANTOREN.join('|')})\\b`, 'i');

/** Trägt dieser Titel einen Allquantor? */
export function traegtAllquantor(titel) {
  return ALLQUANTOR.test(String(titel ?? ''));
}

/**
 * Sichert dieser Rumpf eine **Menge** zu — und nicht nur Stichproben aus ihr?
 *
 * Die Zählform (`.length`) muss in einer Zusicherung stehen. Ein `.length` in
 * einer Meldung (`` `nur ${x.length} Felder` ``) sagt über das Geprüfte
 * nichts — es beschreibt nur, was schiefging.
 */
export function sichertMengeZu(rumpf) {
  const text = String(rumpf ?? '');
  if (/\bfor\s*\(|\.forEach\(|\.every\(|\.flatMap\(/.test(text)) return 'schleife';
  if (/\bdeepEqual\s*\(/.test(text)) return 'deepEqual';
  /*
   * `assert.equal(x.length, …)`, `assert.equal(…, x.length)`, `assert.ok(x.length …)`.
   * Gelesen wird von `assert` bis zum Zeilenende, damit eine Meldung dahinter
   * nicht mitzählt — sie steht nach dem Komma und trägt oft selbst ein
   * `.length`.
   */
  for (const zeile of text.split('\n')) {
    const stelle = zeile.indexOf('assert');
    if (stelle === -1) continue;
    const bis = zeile.slice(stelle).replace(/,\s*[`'"].*$/, '');
    if (/\.length\b|\.size\b/.test(bis)) return 'anzahl';
  }
  return null;
}

/**
 * Testfälle, deren Name alle sagt und deren Rumpf mit Grund eine Stichprobe prüft.
 *
 * Dieselbe Bauart wie jedes andere Register dieses Hauses: eine Liste, ein
 * Pflichtgrund, und ein Prüfer, der sie in **beide** Richtungen gegen den
 * Bestand hält — ein Eintrag zu einem Testfall, den es nicht mehr gibt oder
 * der inzwischen eine Menge zusichert, wird gemeldet.
 */
export const ALLAUSSAGEN_GEPRUEFT = Object.freeze([
  Object.freeze({
    titel: 'Mutiert wird die erste Stelle — mit `alle` jede',
    warum: 'Der Name zitiert die **Schreibweise** einer Gegenprobe (`alle: true`) und behauptet '
      + 'keine Aussage über eine Menge. Geprüft wird, dass die Schaltung wirkt; die Menge der '
      + 'Fundstellen ist zwei, und beide stehen im Erwartungswert.',
  }),
  Object.freeze({
    titel: 'alle drei Steuersätze sind dieselbe Zahl',
    warum: 'Die Menge ist geschlossen und hat drei Glieder, und alle drei stehen einzeln im '
      + 'Rumpf: `UST_SATZ_KUNDE`, `UST_SATZ` und das aus dem Quelltext gelesene Literal von '
      + '`src/kontrolle.js`. Eine Schleife über drei benannte Größen wäre hier weniger lesbar '
      + 'und nicht sicherer.',
  }),
  Object.freeze({
    titel: 'Das Werkzeug läuft und benennt alle drei Durchgänge',
    warum: 'Dieselbe Bauart: drei benannte Durchgänge, alle drei einzeln zugesichert. Der '
      + 'Allquantor nennt eine Zahl, und die Zahl steht im Namen — wächst die Menge, passt der '
      + 'Name nicht mehr und fällt beim Lesen auf.',
  }),
  Object.freeze({
    titel: 'die Regel fängt nicht jede Schreibweise desselben Bauteils',
    warum: 'Eine **verneinte** Allaussage: Der Name sagt, dass die Regel gerade nicht alles '
      + 'fängt, und ein einziges Gegenbeispiel beweist das. Für „nicht jede" ist die Stichprobe '
      + 'die richtige Form — eine Schleife bewiese das Gegenteil.',
  }),
  Object.freeze({
    titel: 'Ein AGB-Punkt ohne jede Zuordnung fällt auf — Versprechen ohne Umsetzung',
    warum: 'Der Allquantor gehört zur **Eingabe** („ohne jede Zuordnung"), nicht zur '
      + 'Zusicherung: Geprüft wird ein einzelner Punkt ohne Ziel, und dass er gemeldet wird. '
      + 'Eine Aussage über alle Punkte steht im Testfall darüber und ist dort eine Schleife.',
  }),
  Object.freeze({
    titel: 'ohne jede Gewichtsangabe bleibt die Summe null und die Lücke sichtbar',
    warum: 'Auch hier beschreibt der Allquantor die Eingabe — ein Warenkorb, in dem kein '
      + 'einziger Artikel ein Gewicht trägt. Zugesichert wird ein Ergebnis (Summe null, Lücke '
      + 'gemeldet), und das ist keine Menge.',
  }),
  Object.freeze({
    titel: 'Ohne alle Lieferzeiten gibt es keinen Gesamttermin, auch keinen von null',
    warum: 'Dieselbe Bauart: „ohne alle" beschreibt die Eingabe. Zugesichert wird, dass kein '
      + 'Termin herauskommt und insbesondere keine Null — eine einzelne Aussage über ein '
      + 'einzelnes Ergebnis.',
  }),
  Object.freeze({
    titel: 'mit allen Voraussetzungen ist der Weg an',
    warum: 'Der Allquantor beschreibt die Ausgangslage — alle Voraussetzungen erfüllt —, und '
      + 'zugesichert wird der eine Zustand, der daraus folgt. Die Menge der Voraussetzungen '
      + 'prüfen die Testfälle daneben, jeder für eine fehlende.',
  }),
  Object.freeze({
    titel: 'zugesagt wird nur, wenn jeder Lieferant es erlaubt',
    warum: 'Der Allquantor steht in der **Bedingung**. Zugesichert wird die Umkehrung: Ein '
      + 'einziger Lieferant ohne Erlaubnis nimmt die Zusage zurück — und dafür ist ein '
      + 'Gegenbeispiel der Beweis, keine Schleife.',
  }),
  Object.freeze({
    titel: 'Ein bestätigter Nettopreis schlägt jeden Rabattsatz',
    warum: 'Geprüft wird der Vorrang zweier Quellen an einem Fall, in dem beide etwas anderes '
      + 'sagen. „Jeden Rabattsatz" heißt: unabhängig von seiner Höhe — und das hängt nicht an '
      + 'der Menge der Sätze, sondern an der Reihenfolge im Code, die der eine Fall zeigt.',
  }),
  Object.freeze({
    titel: 'ein Maß mit der Einheit am Ende gilt für alle Zahlen davor',
    warum: 'Die Menge sind die Zahlen **einer** Eingabe, und der Rumpf prüft mehrere Eingaben '
      + 'mit je zwei und drei Zahlen einzeln durch. Eine Schleife über sie wäre eine Schleife '
      + 'über die Proben und nicht über das Zugesicherte.',
  }),
  Object.freeze({
    titel: 'mehrere Klammern auf einer Seite werden alle entfernt',
    warum: 'Der Rumpf gibt eine Zeichenkette mit mehreren Klammern hinein und hält das ganze '
      + 'Ergebnis dagegen — die Allaussage steckt im Vergleich der vollständigen Ausgabe und '
      + 'nicht in einer Stichprobe daraus.',
  }),
  Object.freeze({
    titel: 'der gemeinsame Anteil zählt, was auf jeder Seite steht',
    warum: 'Der Allquantor benennt die **Rechenregel** der geprüften Funktion, nicht den Umfang '
      + 'der Prüfung: Gemessen wird an zwei gebauten Seiten, deren gemeinsamer Anteil bekannt '
      + 'ist, und zugesichert wird die herauskommende Zahl.',
  }),
  Object.freeze({
    titel: 'Die Höchstmenge ist eine benannte Zahl und greift an jeder Stelle gleich',
    warum: 'Die Stellen sind die drei Wege in den Korb, und alle drei stehen einzeln im Rumpf — '
      + 'legen, erhöhen, setzen. Seit dem 13. September hält ein eigener Testfall in '
      + '`zwillingszahlen.test.js` zusätzlich jedes `max`-Feld der Oberfläche dagegen.',
  }),
  Object.freeze({
    titel: 'geprüft wird jede übergebene Seite, auch die stummen',
    warum: 'Zugesichert wird die **Anzahl** der Befunde gegen die Anzahl der übergebenen '
      + 'Seiten — nur steht die Zahl als Literal da und nicht als `.length`, weil die Proben '
      + 'im Rumpf ausgeschrieben sind. Die Allaussage ist damit gedeckt.',
  }),
  Object.freeze({
    titel: 'Jeder AGB-Punkt ist zugeordnet und jedes Ziel gibt es wirklich',
    warum: '**Übertragene Allaussage.** Die geprüfte Funktion `pruefeAbgleich` ist selbst der '
      + 'Lauf über alle Punkte; der Testfall sichert ihr Urteil zu (`vollstaendig === true`) und '
      + 'trägt die Mängelliste als Meldung mit. Der Testfall daneben hält zusätzlich die Länge '
      + 'der Zuordnung gegen die der Gliederung.',
  }),
  Object.freeze({
    titel: 'Jeder Datenfluss ist von einem Punkt der Datenschutzerklärung gedeckt',
    warum: 'Dieselbe Bauart: `pruefeDatenfluesse` läuft über alle Flüsse, und zugesichert wird '
      + 'sein Urteil über die ganze Menge. Eine Schleife im Testfall prüfte dieselbe Menge ein '
      + 'zweites Mal und verdoppelte die Regel, statt sie zu halten.',
  }),
  Object.freeze({
    titel: 'Sind alle Lieferzeiten bekannt, steht der Termin wie bisher da',
    warum: 'Der Allquantor steht in der **Bedingung** und beschreibt die Ausgangslage. '
      + 'Zugesichert wird die längste Lieferzeit, und die wird im Rumpf über alle '
      + 'Teillieferungen gerechnet (`Math.max(...korb.teillieferungen.map(…))`) — also doch '
      + 'über die ganze Menge, nur ohne Schleife.',
  }),
  Object.freeze({
    titel: 'Ein eingeschobener Punkt verschiebt jeden Verweis dahinter',
    warum: 'Der Allquantor benennt die **Wirkung** der Regel, und bewiesen wird sie am Fall, '
      + 'für den sie gebaut ist: Ein eingeschobener Punkt, und der Beleg zitiert eine Klausel, '
      + 'die etwas anderes regelt. Ein einziger verschobener Verweis widerlegt die Annahme, '
      + 'Verweise seien stabil — mehr braucht es dafür nicht.',
  }),
  Object.freeze({
    titel: 'die gebaute Entität trägt jede belegte Angabe',
    warum: 'Die Menge ist geschlossen und ausgeschrieben: Name, Firma, Straße, Postleitzahl, '
      + 'Firmenbuchnummer und Adresse stehen einzeln im Rumpf, jede gegen ihr Feld in der '
      + 'Betreiberdatei. Eine Schleife darüber bräuchte eine zweite Liste der Zuordnungen — '
      + 'und die wäre die zweite Fassung, gegen die dieser Bestand sonst arbeitet.',
  }),
  Object.freeze({
    titel: 'die Deckung nennt jede fehlende Angabe einzeln, nicht nur die erste',
    warum: 'Die Menge sind drei Marken, und zugesichert wird der Meldungstext gegen **alle '
      + 'drei auf einmal** (`/Ravenit, SunCore, Ökotherm/`). Genau das ist die Aussage: dass '
      + 'nicht nur die erste genannt wird. Eine Schleife über drei Namen prüfte weniger, nicht '
      + 'mehr — sie ließe die Reihenfolge offen.',
  }),
  Object.freeze({
    titel: 'Der Satz nennt jede entfallene Kennung und trifft die Einzahl',
    warum: 'Die Menge ist die **Eingabe**, und der Rumpf geht sie in drei Größen durch: leer, '
      + 'eine Kennung, zwei Kennungen — und prüft bei jeder den ganzen Satz samt Einzahl oder '
      + 'Mehrzahl. Mehr Glieder änderten an der Regel nichts; der Übergang von eins auf zwei '
      + 'ist die Stelle, an der sie bricht.',
  }),
  Object.freeze({
    titel: 'der Prüfer findet in der Probedatei jedes Muster und schweigt beim sauberen Fall',
    warum: 'Die Probedatei ist der Selbstnachweis des Prüfers und trägt je Muster einen Fall. '
      + 'Zugesichert wird sein Rückgabewert über die ganze Datei — 1 bei Funden, 0 mit '
      + '`--bericht`. Fiele ein Muster aus, bliebe der Lauf grün, und genau das prüft der '
      + 'Rückgabewert. Die Musterliste selbst hält der Prüfer der Prüfer.',
  }),
  Object.freeze({
    titel: 'alle drei Formen werden gefunden',
    warum: 'Der Rumpf **zählt** und vergleicht: `assert.equal(b.gefunden, 3)` gegen drei '
      + 'ausgeschriebene Schreibweisen im Text. Das ist eine Mengenzusicherung; diese Messung '
      + 'sieht sie nur nicht, weil die Zahl in einem eigenen Feld steht und nicht in `.length`. '
      + 'Ein Zählwerk mit anderem Namen ist ein Zählwerk.',
  }),
  Object.freeze({
    titel: 'Jeder Prozentpunkt Nachlass kostet mehr als einen Prozentpunkt Rabatt',
    warum: 'Eine Aussage über den **Verlauf** einer Rechnung, nicht über eine Menge von Fällen. '
      + 'Bewiesen wird sie an drei Stützpunkten (0 %, 5 %, 10 %), und die Überproportionalität '
      + 'folgt aus der Formel und nicht aus der Zahl der Proben. Eine Schleife über hundert '
      + 'Nachlässe zeigte dasselbe hundertmal.',
  }),
  Object.freeze({
    titel: 'der eigene Bestand trägt jeden Widerruf mit',
    warum: '**Übertragene Allaussage.** `pruefeBestand` läuft über alle Markdown-Dateien des '
      + 'Verzeichnisses; zugesichert wird sein Urteil und zusätzlich, dass überhaupt Funde '
      + 'entstanden sind — ohne diese zweite Zusicherung wäre ein leerer Lauf grün. Das ist '
      + 'dieselbe Sorgfalt, die eine Schleife mit Längenzusicherung leistet.',
  }),
  Object.freeze({
    titel: 'Kommentare zählen nicht als Fundstelle — sonst fände der Prüfer jede Begründung',
    warum: 'Der Allquantor steht im **Begründungssatz** nach dem Gedankenstrich und benennt die '
      + 'Folge, die vermieden wird. Zugesichert wird die Regel selbst an vier Formen: '
      + 'Zeilenkommentar, Blockkommentar, echter Code und eine Adresse mit zwei Schrägstrichen, '
      + 'die kein Kommentar ist.',
  }),
]);

/**
 * Wie viele Allaussagen ohne Mengenzusicherung stehen bleiben dürfen.
 *
 * **Null, und das ist keine Strenge, sondern das Ergebnis.** Die erste Messung
 * fand neunzehn. Sieben waren echt und sind am 14. September zugesichert
 * worden — mit einer Schleife über das Register, aus dem die Meldungen kommen,
 * oder über die Menge der Eingaben. Zwölf tragen den Allquantor an einer
 * Stelle, an der er keine Menge behauptet, und stehen mit Grund im Register.
 *
 * > **Eine Schranke über null wäre ein Vorrat an Fällen, den niemand ansieht.**
 */
export const OFFENE_ALLAUSSAGEN_HOECHSTENS = 0;

/**
 * Der Befund über eine Menge zerlegter Testfälle.
 *
 * @param {{titel: string, rumpf: string, datei?: string, zeile?: number}[]} faelle
 * @param {object[]} geprueft  begründete Ausnahmen
 * @param {number|null} hoechstens  Sperrklinke; `null` schaltet sie ab
 */
export function allaussagebefund(faelle = [], geprueft = ALLAUSSAGEN_GEPRUEFT,
  hoechstens = OFFENE_ALLAUSSAGEN_HOECHSTENS) {
  const meldungen = [];
  const abgehakt = new Map(geprueft.map((g) => [g.titel, g]));
  const gesehen = new Set();
  const mitQuantor = [];
  const offen = [];

  for (const f of faelle) {
    if (!traegtAllquantor(f.titel)) continue;
    mitQuantor.push(f);
    const form = sichertMengeZu(f.rumpf);
    if (form) continue;
    gesehen.add(f.titel);
    if (abgehakt.has(f.titel)) continue;
    offen.push(f);
    meldungen.push({
      regel: 'allaussage-ohne-menge',
      wo: `${f.datei ?? '?'}:${f.zeile ?? '?'}`,
      text: `„${f.titel}" sagt alle und sichert keine Menge zu — weder Schleife noch deepEqual `
        + 'noch eine Zusicherung über die Anzahl. Entweder die Menge zusichern oder mit Grund '
        + 'ins Register',
    });
  }

  // Die Gegenrichtung: ein Grund für einen Zustand, den es nicht mehr gibt.
  for (const g of geprueft) {
    if (!gesehen.has(g.titel)) {
      meldungen.push({
        regel: 'grund-ohne-fall',
        wo: g.titel,
        text: `„${g.titel}" steht als begründete Ausnahme und ist entweder verschwunden oder `
          + 'sichert die Menge inzwischen zu',
      });
    }
    if (!g.warum || g.warum.length < 80) {
      meldungen.push({ regel: 'grund-zu-duenn', wo: g.titel, text: `„${g.titel}": Grund zu dünn` });
    }
  }

  if (hoechstens != null && offen.length > hoechstens) {
    meldungen.push({
      regel: 'mehr-offene-als-erlaubt',
      text: `${offen.length} Allaussagen ohne Mengenzusicherung — erlaubt sind ${hoechstens}`,
    });
  }
  if (hoechstens != null && offen.length < hoechstens) {
    meldungen.push({
      regel: 'sperrklinke-nachziehen',
      text: `nur noch ${offen.length} offene Allaussagen — die Schranke steht auf ${hoechstens} `
        + 'und gehört nachgezogen (OFFENE_ALLAUSSAGEN_HOECHSTENS in src/allaussage.js)',
    });
  }

  return {
    faelle: faelle.length,
    mitQuantor: mitQuantor.length,
    offen,
    meldungen,
    sauber: meldungen.length === 0,
  };
}
