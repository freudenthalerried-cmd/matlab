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
export const KOPFZEILEN = Object.freeze([
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
    ...KOPFZEILEN.map((k) => `  Header always set ${k.name} "${k.wert}"`),
    '</IfModule>',
    '',
    ...NICHT_GESETZT.map((n) => `# Nicht gesetzt: ${n.name} — Grund in src/serverkopf.js`),
    '',
  ].join('\n');
}
