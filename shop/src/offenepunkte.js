/**
 * Alles, was offen ist — an einer Stelle und aus den Werkzeugen gezogen.
 *
 * ## Warum es das braucht
 *
 * Am 1. September verteilten sich die offenen Punkte über ein Dutzend
 * Dokumente: vier in `startklar`, drei in der Lückenliste des Feeds, einer im
 * Preisalter, drei Fragen an den Lieferanten in drei verschiedenen Befunden,
 * dazu Weisungen aus `PARAMETER.md`. `weg-zum-ersten-verkauf.md` führte sieben
 * — vom 31. August, und schon überholt: Die Domain war entschieden, drei neue
 * Punkte waren dazugekommen.
 *
 * **Eine Liste, die von Hand fortgeschrieben wird, ist an dem Tag falsch, an
 * dem jemand einen Punkt schließt und die Liste nicht anfasst.** Deshalb
 * dieselbe Bauart wie überall hier: Was ein Werkzeug weiß, wird gefragt; was
 * keines weiß, steht hier **mit dem Grund**, warum keines es weiß.
 *
 * ## Die Ordnung
 *
 * Nicht nach Wichtigkeit — die ist Ansichtssache —, sondern danach, **wer
 * handeln muss und was es kostet**. Das ist die Frage, die der Auftraggeber
 * beim Lesen tatsächlich hat.
 */

/**
 * Wer den Punkt schließen kann, und was das auslöst.
 *
 * `rang` bestimmt die Reihenfolge der Abschnitte: erst was nichts kostet und
 * vorliegt, dann die eine Anfrage, die mehrere Punkte auf einmal löst, dann
 * das Geld, zuletzt was mir selbst gehört.
 */
export const ZUSTAENDIGKEITEN = Object.freeze({
  eintragen: { rang: 1, titel: 'Liegt vor, fehlt nur in der Datei', kostet: 'nichts' },
  anfrage: { rang: 2, titel: 'Anfrage an Dritte — freigabepflichtig', kostet: 'nichts, aber eine Freigabe' },
  ausgabe: { rang: 3, titel: 'Kostet Geld — freigabepflichtig', kostet: 'Geld' },
  entscheidung: { rang: 4, titel: 'Entscheidung des Auftraggebers', kostet: 'nichts' },
  werkzeug: { rang: 5, titel: 'Meine Arbeit', kostet: 'nichts' },
});

/**
 * Punkte, die **kein Werkzeug** kennt — mit dem Grund, warum nicht.
 *
 * Der Grund steht dabei, damit die Liste nicht heimlich wächst: Wer hier
 * etwas einträgt, das ein Werkzeug messen könnte, soll beim Schreiben des
 * Grundes merken, dass er keinen hat.
 */
export const OHNE_WERKZEUG = Object.freeze([
  {
    id: 'preisrhythmus',
    titel: 'Preisrhythmus des Lieferanten',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Aus fünfzehn Rechnungen nicht ableitbar — sie zeigen, wann wir gekauft haben, '
      + 'nicht, wann er die Liste ändert.',
    loest: 'Entscheidet, ob die 90-Tage-Grenze der Preisalterprüfung die richtige ist (gesetzt, nicht gemessen).',
  },
  {
    id: 'liefergebiet-lieferant',
    titel: 'Liefergebiet des Lieferanten',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Die Frachtpauschale staffelt nicht nach Entfernung; aus den Belegen ist keine '
      + 'Grenze ablesbar und keine ausschließbar.',
    loest: 'Bestätigt oder widerlegt Gate 23 — heute gilt die vorsichtige Fläche der Kampagne.',
  },
  {
    id: 'artikelliste',
    titel: 'Artikelliste aus dem Kundenkonto, mit EAN, Herstellername und Bildverweis',
    zustaendig: 'anfrage',
    warumKeinWerkzeug: 'Die Daten liegen beim Lieferanten. Der Katalog stammt aus fünfzehn Rechnungen; '
      + 'mehr geben sie nicht her.',
    loest: 'Löst auf einmal: GTIN, Marke und Bild im Feed — und die Weisung, das Sortiment auf '
      + 'mindestens hundert Artikel zu erweitern.',
  },
  {
    id: 'suchvolumen',
    titel: 'Suchvolumen der 32 Keywords im Liefergebiet messen',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Die Zahlen liegen bei Google. Der Keyword-Planer ist kostenlos, ein Ads-Konto '
      + 'ohne geschaltete Kampagne kostet nichts.',
    loest: 'Sagt, ob der Klickkanal die geplanten Klicks überhaupt hergibt — sonst dauert der Versuch '
      + 'ein Vielfaches der gerechneten Zeit. Liste: `npm run messliste`.',
  },
  {
    id: 'google-extended',
    titel: 'Nachlesen, was `Google-Extended` beim Anbieter tatsächlich steuert',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Steht in Googles Crawler-Dokumentation; der Netzausgang dieser Umgebung ist '
      + 'gesperrt (403 am Proxy, am 2. September erneut geprüft). Das Register prüft die Absicht '
      + 'und ihre Widerspruchsfreiheit, nicht die Wirkung beim Anbieter.',
    loest: 'Die Kennung steht seit dem 2. September auf „erlaubt", weil für Google keine zweite, '
      + 'reine Suchkennung geführt ist und die Sperre damit den Anbieter ausschloss statt sein '
      + 'Training. Steuert sie in Wahrheit nur das Training, ist die Zeile eine Geschmacksfrage '
      + 'und darf zurück auf „gesperrt" — ein Blick auf eine Seite, keine Ausgabe.',
  },
  {
    id: 'upload',
    titel: 'ausgabe/site/ auf bauversand.com hochladen',
    zustaendig: 'entscheidung',
    warumKeinWerkzeug: 'Der Netzausgang dieser Umgebung ist gesperrt; ob die Seite erreichbar ist, '
      + 'lässt sich von hier nicht feststellen.',
    loest: 'Ohne erreichbare Seite kein Klick, keine Auffindbarkeit, keine Anfrage.',
  },
]);

/**
 * Setzt die Liste aus Werkzeugbefunden und den handgeführten Punkten zusammen.
 *
 * @param {object[]} ausWerkzeugen  je Punkt: {id, titel, zustaendig, befund, quelle}
 */
export function offenePunkte(ausWerkzeugen = [], ohneWerkzeug = OHNE_WERKZEUG) {
  const alle = [
    ...ausWerkzeugen.map((p) => ({ ...p, quelle: p.quelle ?? 'Werkzeug' })),
    ...ohneWerkzeug.map((p) => ({
      ...p,
      befund: p.warumKeinWerkzeug,
      quelle: 'von Hand geführt',
    })),
  ];

  const gruppen = new Map();
  for (const p of alle) {
    const z = ZUSTAENDIGKEITEN[p.zustaendig];
    if (!z) throw new Error(`Unbekannte Zuständigkeit „${p.zustaendig}" bei ${p.id}`);
    if (!gruppen.has(p.zustaendig)) gruppen.set(p.zustaendig, []);
    gruppen.get(p.zustaendig).push(p);
  }

  return [...gruppen.entries()]
    .map(([id, punkte]) => ({ id, ...ZUSTAENDIGKEITEN[id], punkte }))
    .sort((a, b) => a.rang - b.rang);
}
