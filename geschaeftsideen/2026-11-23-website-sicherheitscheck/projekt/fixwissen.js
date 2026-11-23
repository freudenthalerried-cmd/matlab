'use strict';
// Fix-Wissensbasis: pro Scanner-Befund (id) Erklärung, Priorität, Aufwand,
// wer es erledigt und fertige Schnipsel. Platzhalter: {{domain}}, {{host}}.
//
// wer: 'stefan'  = Stefan klickt selbst (Hoster-Panel, DNS, WP-Admin)
//      'claude'  = per Datei/SSH machbar (Konfig-Datei, Theme-Datei), Stefan prüft
//      'beide'   = Claude bereitet vor, Stefan klickt/bestätigt
// verdeckbar: true = verschwindet aus dem Scan, wenn man nur die Versionsangabe
//             versteckt – gilt erst als erledigt, wenn manuell bestätigt.

const WER = {
  stefan: '🧑 Stefan klickt selbst',
  claude: '🤖 Claude per Datei/SSH (Stefan prüft)',
  beide: '🤖+🧑 Claude bereitet vor, Stefan klickt',
};

const SECURITY_HEADERS_APACHE = `<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header unset X-Powered-By
  Header always unset X-Powered-By
</IfModule>`;

const SECURITY_HEADERS_NGINX = `server_tokens off;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
fastcgi_hide_header X-Powered-By;`;

const K = {
  https: {
    prio: 1, min: 20, wer: 'stefan',
    laie: 'Die Seite ist nicht verschlüsselt. Alles, was Besucher eintippen, kann mitgelesen werden – und Chrome schreibt groß „Nicht sicher“ hin.',
    schritte: ['Hoster-Panel öffnen → SSL/TLS → kostenloses Let’s-Encrypt-Zertifikat für `{{domain}}` und `www.{{domain}}` aktivieren.', 'Danach Weiterleitung auf HTTPS einschalten (siehe nächster Punkt).'],
  },
  redirect: {
    prio: 1, min: 10, wer: 'claude',
    laie: 'Wer die Adresse ohne „https://“ eintippt, landet auf der unverschlüsselten Version.',
    schritte: ['Viele Hoster haben dafür einen Schalter („HTTPS erzwingen“) – wenn vorhanden, den nehmen.', 'Sonst Regel in `.htaccess` (Apache) bzw. Server-Block (nginx) eintragen.'],
    code: [
      ['apache', 'Apache `.htaccess` (ganz oben)', `RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`],
      ['nginx', 'nginx', `server {
  listen 80;
  server_name {{domain}} www.{{domain}};
  return 301 https://$host$request_uri;
}`],
    ],
  },
  cert: {
    prio: 1, min: 20, wer: 'stefan',
    laie: 'Das Sicherheitszertifikat wird von Browsern nicht akzeptiert – Besucher sehen eine Warnseite und sind weg.',
    schritte: ['Hoster-Panel → SSL/TLS → Zertifikat für alle Varianten (mit/ohne www) neu ausstellen (Let’s Encrypt).', 'Automatische Verlängerung aktiv lassen.'],
  },
  cert_expiry: { prio: 1, min: 10, wer: 'stefan', laie: 'Das Zertifikat läuft bald ab oder ist abgelaufen.', schritte: ['Hoster-Panel → SSL/TLS → erneuern, Auto-Verlängerung prüfen.'] },
  tls_version: { prio: 2, min: 15, wer: 'beide', laie: 'Der Server spricht noch alte, unsichere Verschlüsselung.', schritte: ['Beim Hoster TLS 1.0/1.1 deaktivieren (oft Support-Ticket nötig).'], code: [['nginx', 'nginx', 'ssl_protocols TLSv1.2 TLSv1.3;']] },
  hsts: {
    prio: 2, min: 10, wer: 'claude',
    laie: 'Der Browser wird nicht angewiesen, immer die sichere Verbindung zu nehmen. Im Hotel-WLAN kann man Besucher so umleiten.',
    schritte: ['Erst aktivieren, wenn HTTPS auf allen Subdomains sicher funktioniert.', 'Header setzen (Teil des Sicherheits-Header-Blocks unten).'],
    code: [['apache', 'Apache `.htaccess`', 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"'], ['nginx', 'nginx (im 443-Server-Block)', 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;']],
  },
  mixed: { prio: 2, min: 20, wer: 'beide', laie: 'Einzelne Dateien werden noch unverschlüsselt nachgeladen.', schritte: ['Plugin „Better Search Replace“: `http://{{domain}}` → `https://{{domain}}` in der Datenbank ersetzen (vorher Backup!).'] },
  csp: {
    prio: 3, min: 30, wer: 'claude',
    laie: 'Es ist nicht festgelegt, welche Skripte auf der Seite laufen dürfen. Wird eine Lücke ausgenutzt, hat Schadcode leichtes Spiel.',
    schritte: ['Zuerst als `Content-Security-Policy-Report-Only` setzen, 1–2 Wochen Browser-Konsole beobachten.', 'Dann scharf schalten. Bei WordPress mit Page-Buildern oft `\'unsafe-inline\'` für Styles nötig.'],
    code: [['nginx', 'nginx (Beispiel, an Seite anpassen!)', `add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.google-analytics.com; frame-src https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" always;`]],
  },
  clickjacking: { prio: 2, min: 5, wer: 'claude', laie: 'Fremde Seiten können Ihre Seite unsichtbar einbetten und Besucher zu Klicks verleiten.', schritte: ['Header `X-Frame-Options: SAMEORIGIN` setzen (im Header-Block enthalten).'] },
  nosniff: { prio: 3, min: 5, wer: 'claude', laie: 'Browser könnten Dateien „erraten“ und als Programm ausführen.', schritte: ['Header `X-Content-Type-Options: nosniff` setzen (im Header-Block enthalten).'] },
  referrer: { prio: 3, min: 5, wer: 'claude', laie: 'Beim Klick auf externe Links wird die volle Adresse mitgeschickt.', schritte: ['Header `Referrer-Policy: strict-origin-when-cross-origin` setzen (im Header-Block).'] },
  permissions: { prio: 3, min: 5, wer: 'claude', laie: 'Nicht festgelegt, ob die Seite Kamera/Mikrofon/Standort anfragen darf.', schritte: ['Header `Permissions-Policy` setzen (im Header-Block).'] },
  server_leak: {
    prio: 2, min: 10, wer: 'claude',
    laie: 'Der Server verrät, welche Software in welcher Version läuft. Das ist ein Wegweiser für Angreifer.',
    schritte: ['Versionsangaben ausblenden. **Achtung:** Das versteckt nur die Version – eine veraltete PHP-Version bleibt trotzdem veraltet!'],
    code: [['apache', 'Apache `.htaccess` + `php.ini`/`.user.ini`', 'Header unset X-Powered-By\n# .user.ini bzw. php.ini:\nexpose_php = Off'], ['nginx', 'nginx', 'server_tokens off;\nfastcgi_hide_header X-Powered-By;']],
  },
  php: {
    prio: 1, min: 45, wer: 'stefan', verdeckbar: true,
    laie: 'Die Programmiersprache hinter der Seite (PHP) bekommt keine Sicherheitsupdates mehr. Neue Lücken bleiben für immer offen.',
    schritte: ['Zuerst Staging-Kopie anlegen (Hoster-Panel oder Plugin „WP Staging“).', 'Auf der Kopie PHP auf 8.3 umstellen, alle Seiten + Kontaktformular testen.', 'Wenn ok: Hoster-Panel → PHP-Einstellungen → Live-Seite auf 8.3 umstellen.', 'Plugin „PHP Compatibility Checker“ hilft vorab (Hinweise, keine Garantie).'],
    panel: 'PHP-Version im Hoster-Panel umstellen',
  },
  cookies: {
    prio: 3, min: 10, wer: 'claude',
    laie: 'Cookies werden ohne Schutz-Attribute gesetzt und könnten abgegriffen werden.',
    schritte: ['PHP-Session-Cookies härten (`.user.ini`/`php.ini`).'],
    code: [['php', '`.user.ini` / `php.ini`', 'session.cookie_secure = 1\nsession.cookie_httponly = 1\nsession.cookie_samesite = Lax']],
  },
  generator: {
    prio: 3, min: 5, wer: 'claude',
    laie: 'Im Quellcode steht offen die WordPress-Version. Angreifer-Bots suchen genau danach.',
    schritte: ['Ins Child-Theme (`functions.php`) eintragen oder Sicherheits-Plugin nutzen. Versteckt nur – Update trotzdem nötig!'],
    code: [['wp', 'WordPress Child-Theme `functions.php`', "remove_action('wp_head', 'wp_generator');\nadd_filter('the_generator', '__return_empty_string');"]],
  },
  wp_version: {
    prio: 1, min: 60, wer: 'stefan', verdeckbar: true,
    laie: 'WordPress ist veraltet. Veraltete WordPress-Seiten sind das Ziel Nummer eins für automatische Angriffe.',
    schritte: ['Vollbackup (Dateien + Datenbank, extern speichern).', 'Auf Staging: WordPress, dann Theme, dann Plugins aktualisieren; Seite durchklicken.', 'Unbenutzte Plugins/Themes löschen, Admin-Konten prüfen.', 'Danach Live-Update im WP-Admin (Dashboard → Aktualisierungen).', 'Automatische Hintergrund-Updates für Sicherheits-Releases aktiv lassen.'],
    panel: 'WordPress-Update im WP-Admin',
  },
  jquery: {
    prio: 2, min: 20, wer: 'claude',
    laie: 'Eine eingebaute Programm-Bibliothek (jQuery) ist uralt und hat bekannte Lücken.',
    schritte: ['Herausfinden, wer die alte Version lädt (meist altes Theme oder Plugin „Enable jQuery Migrate Helper“).', 'WordPress-eigenes jQuery verwenden (kommt mit dem WP-Update) bzw. Theme-Datei auf jQuery 3.7.x umstellen.', 'Danach Slider, Menü und Formulare testen.'],
  },
  gfonts: {
    prio: 1, min: 30, wer: 'claude',
    laie: 'Schriften werden direkt bei Google geladen – dabei geht die IP-Adresse jedes Besuchers ohne Einwilligung an Google. Dafür gab es in Österreich Abmahnwellen.',
    schritte: ['Plugin „OMGF – Host Google Fonts Locally“ installieren, Fonts speichern, „Remove Google Fonts“ aktivieren. **Oder** per Datei:', 'Schriftdateien (woff2) über google-webfonts-helper herunterladen, nach `/wp-content/uploads/fonts/` legen, `@font-face` lokal einbinden, externen Link entfernen.', 'Page-Builder (Elementor: Einstellungen → „Google Fonts laden: Nein“) prüfen.'],
    code: [['css', 'CSS (lokal)', "@font-face {\n  font-family: 'Inter';\n  src: url('/wp-content/uploads/fonts/inter-v13-latin-regular.woff2') format('woff2');\n  font-display: swap;\n}"]],
  },
  tracking: {
    prio: 1, min: 45, wer: 'beide',
    laie: 'Google Analytics läuft sofort beim Besuch, ohne dass jemand zugestimmt hat. Das ist laut DSGVO/TKG nicht erlaubt.',
    schritte: ['Consent-Tool einrichten: WordPress → „Real Cookie Banner“ oder „Complianz“ (beide mit Gratis-Version); ohne WP → Klaro (Open Source).', 'Google Analytics nur noch über das Consent-Tool laden lassen (Skript als „blockiert bis Zustimmung“).', 'Im Browser (privates Fenster, Netzwerk-Tab) prüfen: vor dem Klick **keine** Anfrage an google-analytics.com.', 'Datenschutzerklärung um Analytics/Consent ergänzen.'],
    code: [['html', 'HTML (Klaro-Variante)', '<script type="text/plain" data-type="application/javascript" data-name="google-analytics"\n        data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>']],
  },
  embeds: {
    prio: 2, min: 20, wer: 'claude',
    laie: 'Google Maps wird sofort geladen – Google erfährt von jedem Besuch.',
    schritte: ['Zwei-Klick-Lösung: Platzhalterbild + Button „Karte laden (Daten an Google)“, iframe erst nach Klick einfügen.', 'Bei WordPress übernimmt das das Consent-Tool (Content Blocker) oder Plugin „Embed Privacy“.'],
  },
  impressum: { prio: 2, min: 20, wer: 'beide', laie: 'Kein Impressum gefunden – in Österreich Pflicht (ECG, Mediengesetz).', schritte: ['WKO-Impressum-Generator nutzen, Seite anlegen, im Footer verlinken.'] },
  datenschutz: { prio: 2, min: 20, wer: 'beide', laie: 'Kein Link zur Datenschutzerklärung – DSGVO-Pflicht.', schritte: ['Text vom Kunden bzw. Generator (z. B. WKO/Datenschutz-Generator) – **wir liefern keine Rechtsberatung**.', 'Seite anlegen und im Footer verlinken.'], panel: 'Text der Datenschutzerklärung liefert der Kunde' },
  spf: {
    prio: 1, min: 15, wer: 'stefan',
    laie: 'Es ist nicht festgelegt, wer E-Mails im Namen der Firma verschicken darf. Betrüger können so gefälschte Rechnungen in Ihrem Namen senden.',
    schritte: ['Beim Kunden klären: Über welchen Anbieter laufen die Mails (z. B. World4You, Microsoft 365, Gmail)?', 'DNS-Verwaltung (Domain-Registrar) → TXT-Eintrag für `{{domain}}` anlegen.', 'Es darf nur **einen** SPF-Eintrag geben.'],
    code: [['dns', 'DNS TXT `{{domain}}` (Beispiel Microsoft 365 – an Anbieter anpassen)', 'v=spf1 include:spf.protection.outlook.com -all']],
    panel: 'TXT-Eintrag beim Domain-Registrar anlegen',
  },
  dmarc: {
    prio: 1, min: 15, wer: 'stefan',
    laie: 'Gefälschte E-Mails mit Ihrer Absenderadresse werden von Empfängern nicht abgewiesen – beliebt für Rechnungsbetrug.',
    schritte: ['Erst SPF (und DKIM beim Mailanbieter) einrichten.', 'Stufe 1: DMARC mit `p=none` + Berichtsadresse, 2–4 Wochen Berichte ansehen.', 'Stufe 2: auf `p=quarantine`, später `p=reject` erhöhen (gutes Thema für die Wartung).'],
    code: [['dns', 'DNS TXT `_dmarc.{{domain}}` – Stufe 1', 'v=DMARC1; p=none; rua=mailto:dmarc@{{domain}}; adkim=s; aspf=s'], ['dns', 'DNS TXT `_dmarc.{{domain}}` – Stufe 2 (nach 2–4 Wochen)', 'v=DMARC1; p=quarantine; rua=mailto:dmarc@{{domain}}; adkim=s; aspf=s']],
    panel: 'TXT-Eintrag beim Domain-Registrar anlegen',
  },
  safebrowsing: { prio: 1, min: 240, wer: 'beide', laie: 'Google warnt vor Ihrer Seite – sie ist vermutlich gehackt.', schritte: ['Seite sofort in Wartungsmodus, Malware-Bereinigung als eigenes Projekt (nicht im Fixpreis).', 'Google Search Console → Sicherheitsprobleme → Überprüfung anfordern.'] },
  status: { prio: 3, min: 10, wer: 'beide', laie: 'Die Startseite antwortet mit einem Fehlercode.', schritte: ['Ursache prüfen (Bot-Schutz, Wartungsmodus, Serverfehler).'] },
};

const FALLBACK = { prio: 3, min: 15, wer: 'beide', laie: '', schritte: ['Siehe Hinweis des Scanners.'] };

function wissen(id) { return K[id] || FALLBACK; }
function fill(s, ctx) { return String(s).replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? ''); }

module.exports = { K, WER, wissen, fill, SECURITY_HEADERS_APACHE, SECURITY_HEADERS_NGINX };
