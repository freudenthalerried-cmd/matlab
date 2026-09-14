/**
 * Was der Webserver zu jeder Seite dazusagt — und was ausdrücklich nicht.
 *
 * **Der Anlass, 11. September 2026.** Die `.htaccess` des Baus trug eine
 * einzige Zeile, `ErrorDocument`, und der Kommentar daneben nannte den Grund:
 *
 * > *„Was hier sonst noch stünde — Weiterleitungen, Kompression, Kopfzeilen —
 * > wäre eine Serverkonfiguration **ohne Prüfung**: Von hier aus lässt sich
 * > nicht messen, ob sie wirkt."*
 *
 * Die Begründung war richtig und ist es nicht mehr. Ein Apache lässt sich in
 * dieser Umgebung starten; gemessen wurde am 11. September dreierlei:
 *
 * | Versuch | Antwort |
 * |---|---|
 * | die gebaute Seite, wie sie ist | 200, **keine einzige Sicherheitskopfzeile** |
 * | eine unbekannte Direktive in der `.htaccess` | **500 für die ganze Seite** |
 * | dieselbe Direktive in einem `<IfModule>` für ein fehlendes Modul | 200 |
 *
 * Die mittlere Zeile ist der Grund, warum hier bis heute nichts stand, und die
 * untere der Grund, warum jetzt etwas stehen darf:
 *
 * > **Eine ungeprüfte Zeile in der Datei, die den Shop ausliefert, ist der
 * > teuerste Weg, recht zu haben — aber ein `<IfModule>` kann nicht
 * > danebengehen.**
 *
 * Fehlt das Modul, wird der Block übersprungen, und die Seite kommt wie
 * vorher. Der schlimmste Fall ist damit „die Kopfzeilen fehlen", nicht „die
 * Seite ist weg".
 *
 * ## Warum diese vier
 *
 * Der Shop ist statisch, setzt keine Cookies, bindet nichts Fremdes ein und
 * sagt das auf seiner Datenschutzseite. Die Kopfzeilen sind deshalb nicht
 * Abwehr gegen etwas, das da ist, sondern **die Durchsetzung dessen, was der
 * Shop ohnehin verspricht** — mit dem Unterschied, dass es danach der Browser
 * hält und nicht das Versprechen.
 */

/** Die Kopfzeilen, jede mit ihrem Grund. */
/*
 * **Umbenannt am 14. September 2026, mittags.** Sie hiess `KOPFZEILEN` — wie
 * fuenf andere Ausfuhren in diesem Haus, und die meinen etwas voellig
 * anderes: `src/statuskopf.js`, `src/gatestand.js` und `src/zwillingssaetze.js`
 * fuehren darunter eine **Zeilenzahl** (6), `src/weisungsstand.js` 14,
 * `src/widerruf.js` 15. Hier steht eine **Liste von HTTP-Kopfzeilen**.
 *
 * > **Ein Name, unter dem einmal eine Zahl und einmal eine Liste steht, ist
 * > kein Name, sondern eine Verwechslung mit Anlauf.**
 */
export const SICHERHEITSKOPFZEILEN = Object.freeze([
  Object.freeze({
    name: 'X-Content-Type-Options',
    wert: 'nosniff',
    warum: 'Der Browser soll den Typ nehmen, den der Server nennt, und nicht raten. Die '
      + 'Abnahmeliste sorgt sich an zwei Punkten genau darum — `shop.js` muss als '
      + 'JavaScript ankommen und `sitemap.xml` als XML; diese Zeile macht aus der Sorge eine '
      + 'Regel.',
  }),
  Object.freeze({
    name: 'Referrer-Policy',
    wert: 'strict-origin-when-cross-origin',
    warum: 'Die Adresse der Suchseite trägt die Frage des Kunden (`?q=…`). Die Verweise auf '
      + 'Herstellerseiten tragen bereits `rel="noreferrer"`; diese Zeile gilt für alles '
      + 'andere und schickt nach außen höchstens den Ursprung, nie den Pfad.',
  }),
  Object.freeze({
    name: 'Content-Security-Policy',
    // `'unsafe-inline'` für Skripte ist kein Versehen: Jede Seite trägt ihre
    // Daten als JSON in einem eingebetteten Skript (`window.__SHOP__`), und
    // ein statischer Bau kann keine Einmalkennung vergeben. Der Gewinn steckt
    // in `default-src 'self'`: Was nicht vom eigenen Ursprung kommt, lädt
    // nicht — und genau das verspricht die Datenschutzseite.
    wert: "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
      + "script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; "
      + "base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
    warum: 'Die Datenschutzseite sagt „keine fremden Einbindungen". Bisher war das eine '
      + 'Zusage, die ein Prüfer am Bestand misst; mit dieser Zeile hält sie der Browser des '
      + 'Besuchers — auch dann noch, wenn eines Tages jemand eine fremde Schriftart '
      + 'einbindet. `frame-ancestors` hält den Shop aus fremden Rahmen, `form-action`, dass '
      + 'ein Formular woandershin abschickt, `base-uri`, dass eine eingeschleuste Marke alle '
      + 'Verweise umbiegt.',
  }),
  Object.freeze({
    name: 'Permissions-Policy',
    wert: 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
    warum: 'Der Shop braucht keine dieser Schnittstellen und fragt nie danach. Sie '
      + 'abzuschalten kostet nichts und nimmt einem eingeschleusten Skript die Möglichkeit, '
      + 'im Namen der Seite zu fragen.',
  }),
]);

/**
 * Was ausdrücklich **nicht** gesetzt wird — mit Grund.
 *
 * Ohne diese Liste sähe die Datei oben nach Vollständigkeit aus. Die
 * bekannteste Kopfzeile fehlt, und das ist eine Entscheidung und kein
 * Vergessen.
 */
export const NICHT_GESETZT = Object.freeze([
  Object.freeze({
    name: 'Strict-Transport-Security',
    warum: 'HSTS ist ein Versprechen an den Browser, das sich für die Dauer seiner '
      + '`max-age` **nicht zurücknehmen lässt**: Wer sie setzt und danach kein gültiges '
      + 'Zertifikat hat, sperrt seine eigenen Kunden aus. Ob bauversand.com über HTTPS '
      + 'erreichbar ist, lässt sich von hier nicht sehen — der Netzausgang dieser Umgebung '
      + 'ist gesperrt. Eine unumkehrbare Zusage über etwas, das niemand gesehen hat, ist '
      + 'genau die Sorte, die dieser Bestand nicht macht. Sie steht als offener Punkt.',
  }),
  Object.freeze({
    name: 'X-Frame-Options',
    warum: 'Abgelöst durch `frame-ancestors` in der Inhaltssicherheitsrichtlinie, die oben '
      + 'steht. Zwei Wege zu derselben Aussage bedeuten, dass einer davon irgendwann alt ist.',
  }),
]);

/**
 * Der Inhalt der `.htaccess`, wie der Bau sie schreibt.
 *
 * @param {string} fehlerseite  Dateiname der Fehlerseite, ohne Endung
 */
export function htaccessText(fehlerseite) {
  return [
    '# Von `npm run website` erzeugt. Änderungen hier gehen beim nächsten Bau verloren.',
    `ErrorDocument 404 /${fehlerseite}.html`,
    '',
    '# Die Kopfzeilen stehen in einem IfModule: Fehlt mod_headers, wird der Block',
    '# übersprungen und die Seite kommt wie vorher. Eine unbekannte Direktive ohne',
    '# diesen Rahmen beantwortet Apache mit 500 — für die ganze Seite, gemessen.',
    '<IfModule mod_headers.c>',
    ...SICHERHEITSKOPFZEILEN.map((k) => `  Header always set ${k.name} "${k.wert}"`),
    '</IfModule>',
    '',
    ...NICHT_GESETZT.map((n) => `# Nicht gesetzt: ${n.name} — Grund in src/serverkopf.js`),
    '',
  ].join('\n');
}

/* ------------------------------------------------------------------ *
 * Was an einem laufenden Apache herauskommt — und was es bedeutet
 * ------------------------------------------------------------------ */

/**
 * Die Entscheidungen der Kopfzeilenprobe, **ohne Apache.**
 *
 * **Der Anlass, 14. September 2026, abends.** Die Zählung der Regelnamen führt
 * neun Stellen aus `bin/kopfzeilenpruefung.mjs` als „nie gesehen" — mehr als
 * aus jeder anderen Datei. Der Grund lag nahe und war trotzdem falsch: Sie
 * messen an einem laufenden Apache, also könne ein Testfall sie nicht sehen.
 *
 * Messen tut das der **Läufer**. Die Regeln daneben entscheiden nur über das,
 * was er mitbringt: eine Antwortnummer, eine Kopfzeilentafel, einen Text.
 *
 * > **Was ein Prüfer misst und was er daraus schließt, sind zwei Dinge — und
 * > nur das erste braucht den Server.**
 *
 * Die drei Befunde hier nehmen das Mitgebrachte entgegen. Der Läufer startet
 * weiter zwei Apaches, holt zwei Seiten und reicht sie herein; keine Zeile
 * seiner Messung ist nachgebaut.
 */

/** @param {{status: number, kopfzeilen: Map<string,string>|Headers}} antwort */
export function kopfzeilenbefund(antwort, kopfzeilen = SICHERHEITSKOPFZEILEN,
  nichtGesetzt = NICHT_GESETZT) {
  const meldungen = [];
  const melde = (regel, text) => meldungen.push({ regel, text });
  const lies = (name) => (typeof antwort.kopfzeilen?.get === 'function'
    ? antwort.kopfzeilen.get(name) : (antwort.kopfzeilen?.[name] ?? null));

  if (antwort.status !== 200) melde('startseite-nicht-200', `die Startseite kommt mit ${antwort.status}`);
  for (const k of kopfzeilen) {
    const wert = lies(k.name);
    if (wert === null || wert === undefined) {
      melde('kopfzeile-fehlt', `${k.name} kommt nicht an — ${String(k.warum).slice(0, 80)}…`);
    } else if (wert !== k.wert) {
      melde('kopfzeile-weicht-ab', `${k.name} kommt als „${wert}" an, geführt ist „${k.wert}"`);
    }
  }
  for (const n of nichtGesetzt) {
    if (lies(n.name) !== null && lies(n.name) !== undefined) {
      melde('nicht-gesetzt-und-doch-da',
        `${n.name} steht als ausdrücklich nicht gesetzt im Register und kommt trotzdem an`);
    }
  }
  return { geprueft: kopfzeilen.length, meldungen, sauber: meldungen.length === 0 };
}

/** Der Satz, an dem die eigene Fehlerseite zu erkennen ist. */
export const FEHLERSEITENSATZ = 'Diese Seite gibt es nicht';

/**
 * Greift `ErrorDocument`?
 *
 * Zwei Fragen, und beide zählen einzeln: Kommt die Antwort mit 404 — und ist
 * es **unsere** Seite? Eine fremde Fehlerseite mit richtigem Code ist die des
 * Hosters: ohne Marke, ohne Kopfleiste, ohne Weg ins Sortiment.
 */
export function fehlerseitenbefund(status, text, satz = FEHLERSEITENSATZ) {
  const meldungen = [];
  if (status !== 404) {
    meldungen.push({ regel: 'fehlerseite-falscher-code', text: `sie kommt mit ${status}` });
  }
  if (!String(text ?? '').includes(satz)) {
    meldungen.push({
      regel: 'fehlerseite-fremd',
      text: 'die Fehlerseite ist nicht unsere — ErrorDocument greift nicht',
    });
  }
  return { meldungen, sauber: meldungen.length === 0 };
}

/**
 * Trägt der `<IfModule>`-Rahmen, wenn das Modul fehlt?
 *
 * **Am 11. September an einem laufenden Apache gemessen:** Eine Direktive,
 * deren Modul fehlt, beantwortet Apache mit **500 für die ganze Seite** —
 * dieselbe Zeile in einem `<IfModule>` mit 200. Genau diese Gefahr war bis
 * dahin der Grund, gar keine Kopfzeilen zu schreiben.
 *
 * Die dritte Regel prüft die Messung selbst: Kommt ohne das Modul trotzdem
 * eine Kopfzeile an, misst der Lauf nicht, was er soll.
 */
export function ohneModulbefund({ status, laenge, kopfzeile = null },
  mindestzeichen = MINDESTZEICHEN) {
  const meldungen = [];
  if (status !== 200) {
    meldungen.push({
      regel: 'ohne-modul-kaputt',
      text: `ohne mod_headers kommt die Startseite mit ${status} — der <IfModule> trägt nicht`,
    });
  } else if (laenge < mindestzeichen) {
    meldungen.push({
      regel: 'ohne-modul-leer',
      text: `ohne mod_headers kommt die Seite mit ${laenge} Zeichen`,
    });
  }
  if (kopfzeile !== null && kopfzeile !== undefined) {
    meldungen.push({
      regel: 'ohne-modul-und-doch-kopfzeile',
      text: 'ohne mod_headers kommt trotzdem eine Kopfzeile — dann misst dieser Lauf nicht, was er soll',
    });
  }
  return { meldungen, sauber: meldungen.length === 0 };
}

/**
 * Ab wie vielen Zeichen eine ausgelieferte Startseite als ausgeliefert gilt.
 *
 * Tausend: Die gebaute Startseite hat über hunderttausend. Was darunter
 * ankommt, ist keine Seite, sondern eine Fehlermeldung mit Status 200.
 */
export const MINDESTZEICHEN = 1000;
