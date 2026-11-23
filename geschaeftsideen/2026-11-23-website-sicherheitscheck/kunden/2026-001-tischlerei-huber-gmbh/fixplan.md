# Fixplan – Tischlerei Huber GmbH (demo-handwerk.at)

Projekt 2026-001 · Scan vom 23.11.2026 · **Note F (18/100)** · 8 rot, 10 gelb

Geschätzter Aufwand: **ca. 7 h** (inkl. 60 Min. Backup, Tests, Bericht).

**Legende:** 🧑 Stefan klickt selbst · 🤖 Claude per Datei/SSH (Stefan prüft) · 🤖+🧑 Claude bereitet vor, Stefan klickt

> **Reihenfolge einhalten:** 1. Backup → 2. Staging → 3. Updates → 4. Konfiguration → 5. DNS → 6. `node projekt.js nachher`

| # | Ampel | Befund | Prio | Min. | Wer |
|---|---|---|---|---|---|
| 1 | 🔴 | WordPress veraltet | P1 | 60 | 🧑 Stefan klickt selbst |
| 2 | 🔴 | PHP 7.4 veraltet | P1 | 45 | 🧑 Stefan klickt selbst |
| 3 | 🔴 | Tracking erst nach Einwilligung | P1 | 45 | 🤖+🧑 Claude bereitet vor, Stefan klickt |
| 4 | 🔴 | Google Fonts lokal eingebunden | P1 | 30 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 5 | 🔴 | Richtlinie gegen E-Mail-Betrug (DMARC) | P1 | 15 | 🧑 Stefan klickt selbst |
| 6 | 🔴 | Schutz gegen gefälschte Absender (SPF) | P1 | 15 | 🧑 Stefan klickt selbst |
| 7 | 🔴 | Automatische Weiterleitung auf HTTPS | P1 | 10 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 8 | 🔴 | HTTPS erzwingen (HSTS) | P2 | 10 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 9 | 🟡 | Schutz gegen Clickjacking | P2 | 5 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 10 | 🟡 | Veraltete Bibliothek jQuery 1.12.4 | P2 | 20 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 11 | 🟡 | Datenschutzerklärung vorhanden | P2 | 20 | 🤖+🧑 Claude bereitet vor, Stefan klickt |
| 12 | 🟡 | Keine Versionsnummern öffentlich | P2 | 10 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 13 | 🟡 | Eingebettete Inhalte datenschutzfreundlich | P2 | 20 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 14 | 🟡 | Schutz gegen eingeschleuste Skripte (CSP) | P3 | 30 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 15 | 🟡 | Cookies sicher gesetzt | P3 | 10 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 16 | 🟡 | Dateityp-Schutz (nosniff) | P3 | 5 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 17 | 🟡 | Weitergabe von Seitenadressen begrenzt | P3 | 5 | 🤖 Claude per Datei/SSH (Stefan prüft) |
| 18 | 🟡 | Systemversion nicht öffentlich sichtbar | P3 | 5 | 🤖 Claude per Datei/SSH (Stefan prüft) |

## Sicherheits-Header-Block (deckt mehrere Punkte auf einmal ab)

🤖 Claude per Datei/SSH. **Stefan: vorher `.htaccess` sichern, danach Seite im Browser prüfen.**

Apache (`.htaccess` im Webroot):
```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header unset X-Powered-By
  Header always unset X-Powered-By
</IfModule>
```

nginx (im `server { listen 443 ... }`-Block):
```nginx
server_tokens off;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
fastcgi_hide_header X-Powered-By;
```

## 1. 🔴 WordPress veraltet

**Priorität P1 · ca. 60 Min. · 🧑 Stefan klickt selbst**

**In einfachen Worten:** WordPress ist veraltet. Veraltete WordPress-Seiten sind das Ziel Nummer eins für automatische Angriffe.

Scanner: WordPress 5.8.3 läuft, aktuell ist 6.8.3. Veraltete WordPress-Seiten sind das häufigste Ziel automatisierter Angriffe.

**Schritte:**
1. Vollbackup (Dateien + Datenbank, extern speichern).
2. Auf Staging: WordPress, dann Theme, dann Plugins aktualisieren; Seite durchklicken.
3. Unbenutzte Plugins/Themes löschen, Admin-Konten prüfen.
4. Danach Live-Update im WP-Admin (Dashboard → Aktualisierungen).
5. Automatische Hintergrund-Updates für Sicherheits-Releases aktiv lassen.

> ⚠️ Nur die Versionsangabe zu verstecken ist **kein** Fix. Erst nach echtem Update in `notizen.json` unter `manuell_erledigt` eintragen.

## 2. 🔴 PHP 7.4 veraltet

**Priorität P1 · ca. 45 Min. · 🧑 Stefan klickt selbst**

**In einfachen Worten:** Die Programmiersprache hinter der Seite (PHP) bekommt keine Sicherheitsupdates mehr. Neue Lücken bleiben für immer offen.

Scanner: PHP 7.4 bekommt seit Jahren keine Sicherheitsupdates mehr. Neue Lücken werden nicht mehr geschlossen.

**Schritte:**
1. Zuerst Staging-Kopie anlegen (Hoster-Panel oder Plugin „WP Staging“).
2. Auf der Kopie PHP auf 8.3 umstellen, alle Seiten + Kontaktformular testen.
3. Wenn ok: Hoster-Panel → PHP-Einstellungen → Live-Seite auf 8.3 umstellen.
4. Plugin „PHP Compatibility Checker“ hilft vorab (Hinweise, keine Garantie).

> ⚠️ Nur die Versionsangabe zu verstecken ist **kein** Fix. Erst nach echtem Update in `notizen.json` unter `manuell_erledigt` eintragen.

## 3. 🔴 Tracking erst nach Einwilligung

**Priorität P1 · ca. 45 Min. · 🤖+🧑 Claude bereitet vor, Stefan klickt**

**In einfachen Worten:** Google Analytics läuft sofort beim Besuch, ohne dass jemand zugestimmt hat. Das ist laut DSGVO/TKG nicht erlaubt.

Scanner: Gefunden: Google Analytics – aber kein Cookie-Banner-Tool erkannt. Tracking ohne Einwilligung verstößt gegen DSGVO/TKG.

**Schritte:**
1. Consent-Tool einrichten: WordPress → „Real Cookie Banner“ oder „Complianz“ (beide mit Gratis-Version); ohne WP → Klaro (Open Source).
2. Google Analytics nur noch über das Consent-Tool laden lassen (Skript als „blockiert bis Zustimmung“).
3. Im Browser (privates Fenster, Netzwerk-Tab) prüfen: vor dem Klick **keine** Anfrage an google-analytics.com.
4. Datenschutzerklärung um Analytics/Consent ergänzen.

HTML (Klaro-Variante):
```html
<script type="text/plain" data-type="application/javascript" data-name="google-analytics"
        data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
```

## 4. 🔴 Google Fonts lokal eingebunden

**Priorität P1 · ca. 30 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Schriften werden direkt bei Google geladen – dabei geht die IP-Adresse jedes Besuchers ohne Einwilligung an Google. Dafür gab es in Österreich Abmahnwellen.

Scanner: Schriften werden direkt von Google-Servern geladen. Dabei wird die IP-Adresse jedes Besuchers ohne Einwilligung an Google übertragen – in Österreich und Deutschland gab es dazu Abmahnwellen.

**Schritte:**
1. Plugin „OMGF – Host Google Fonts Locally“ installieren, Fonts speichern, „Remove Google Fonts“ aktivieren. **Oder** per Datei:
2. Schriftdateien (woff2) über google-webfonts-helper herunterladen, nach `/wp-content/uploads/fonts/` legen, `@font-face` lokal einbinden, externen Link entfernen.
3. Page-Builder (Elementor: Einstellungen → „Google Fonts laden: Nein“) prüfen.

CSS (lokal):
```css
@font-face {
  font-family: 'Inter';
  src: url('/wp-content/uploads/fonts/inter-v13-latin-regular.woff2') format('woff2');
  font-display: swap;
}
```

## 5. 🔴 Richtlinie gegen E-Mail-Betrug (DMARC)

**Priorität P1 · ca. 15 Min. · 🧑 Stefan klickt selbst**

**In einfachen Worten:** Gefälschte E-Mails mit Ihrer Absenderadresse werden von Empfängern nicht abgewiesen – beliebt für Rechnungsbetrug.

Scanner: Kein DMARC-Eintrag. Gefälschte E-Mails mit Ihrer Absenderadresse werden von Empfängern nicht abgewiesen – beliebt für Rechnungsbetrug.

**Schritte:**
1. Erst SPF (und DKIM beim Mailanbieter) einrichten.
2. Stufe 1: DMARC mit `p=none` + Berichtsadresse, 2–4 Wochen Berichte ansehen.
3. Stufe 2: auf `p=quarantine`, später `p=reject` erhöhen (gutes Thema für die Wartung).

DNS TXT `_dmarc.demo-handwerk.at` – Stufe 1:
```text
v=DMARC1; p=none; rua=mailto:dmarc@demo-handwerk.at; adkim=s; aspf=s
```

DNS TXT `_dmarc.demo-handwerk.at` – Stufe 2 (nach 2–4 Wochen):
```text
v=DMARC1; p=quarantine; rua=mailto:dmarc@demo-handwerk.at; adkim=s; aspf=s
```

## 6. 🔴 Schutz gegen gefälschte Absender (SPF)

**Priorität P1 · ca. 15 Min. · 🧑 Stefan klickt selbst**

**In einfachen Worten:** Es ist nicht festgelegt, wer E-Mails im Namen der Firma verschicken darf. Betrüger können so gefälschte Rechnungen in Ihrem Namen senden.

Scanner: Es ist nicht festgelegt, welche Server E-Mails für Ihre Domain senden dürfen. Betrüger können leichter E-Mails in Ihrem Namen verschicken.

**Schritte:**
1. Beim Kunden klären: Über welchen Anbieter laufen die Mails (z. B. World4You, Microsoft 365, Gmail)?
2. DNS-Verwaltung (Domain-Registrar) → TXT-Eintrag für `demo-handwerk.at` anlegen.
3. Es darf nur **einen** SPF-Eintrag geben.

DNS TXT `demo-handwerk.at` (Beispiel Microsoft 365 – an Anbieter anpassen):
```text
v=spf1 include:spf.protection.outlook.com -all
```

## 7. 🔴 Automatische Weiterleitung auf HTTPS

**Priorität P1 · ca. 10 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Wer die Adresse ohne „https://“ eintippt, landet auf der unverschlüsselten Version.

Scanner: Wer Ihre Adresse ohne „https://“ eingibt, bleibt auf der unverschlüsselten Version.

**Schritte:**
1. Viele Hoster haben dafür einen Schalter („HTTPS erzwingen“) – wenn vorhanden, den nehmen.
2. Sonst Regel in `.htaccess` (Apache) bzw. Server-Block (nginx) eintragen.

Apache `.htaccess` (ganz oben):
```apache
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

nginx:
```nginx
server {
  listen 80;
  server_name demo-handwerk.at www.demo-handwerk.at;
  return 301 https://$host$request_uri;
}
```

## 8. 🔴 HTTPS erzwingen (HSTS)

**Priorität P2 · ca. 10 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Der Browser wird nicht angewiesen, immer die sichere Verbindung zu nehmen. Im Hotel-WLAN kann man Besucher so umleiten.

Scanner: Der Browser wird nicht angewiesen, immer die sichere Verbindung zu nutzen. In öffentlichen WLANs kann die Verbindung so umgeleitet werden.

**Schritte:**
1. Erst aktivieren, wenn HTTPS auf allen Subdomains sicher funktioniert.
2. Header setzen (Teil des Sicherheits-Header-Blocks unten).

Apache `.htaccess`:
```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

nginx (im 443-Server-Block):
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 9. 🟡 Schutz gegen Clickjacking

**Priorität P2 · ca. 5 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Fremde Seiten können Ihre Seite unsichtbar einbetten und Besucher zu Klicks verleiten.

Scanner: Ihre Seite kann in fremde Webseiten eingebettet werden – Besucher können so zu ungewollten Klicks verleitet werden.

**Schritte:**
1. Header `X-Frame-Options: SAMEORIGIN` setzen (im Header-Block enthalten).

## 10. 🟡 Veraltete Bibliothek jQuery 1.12.4

**Priorität P2 · ca. 20 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Eine eingebaute Programm-Bibliothek (jQuery) ist uralt und hat bekannte Lücken.

Scanner: jQuery 1.12.4 hat bekannte Sicherheitslücken (Cross-Site-Scripting, CVE-2020-11022/11023).

**Schritte:**
1. Herausfinden, wer die alte Version lädt (meist altes Theme oder Plugin „Enable jQuery Migrate Helper“).
2. WordPress-eigenes jQuery verwenden (kommt mit dem WP-Update) bzw. Theme-Datei auf jQuery 3.7.x umstellen.
3. Danach Slider, Menü und Formulare testen.

## 11. 🟡 Datenschutzerklärung vorhanden

**Priorität P2 · ca. 20 Min. · 🤖+🧑 Claude bereitet vor, Stefan klickt**

**In einfachen Worten:** Kein Link zur Datenschutzerklärung – DSGVO-Pflicht.

Scanner: Kein Link zur Datenschutzerklärung gefunden (DSGVO-Pflicht).

**Schritte:**
1. Text vom Kunden bzw. Generator (z. B. WKO/Datenschutz-Generator) – **wir liefern keine Rechtsberatung**.
2. Seite anlegen und im Footer verlinken.

## 12. 🟡 Keine Versionsnummern öffentlich

**Priorität P2 · ca. 10 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Der Server verrät, welche Software in welcher Version läuft. Das ist ein Wegweiser für Angreifer.

Scanner: Der Server verrät seine Software-Version (Server: nginx/1.24.0 (Ubuntu), X-Powered-By: PHP/7.4.33). Angreifer suchen gezielt nach bekannten Lücken dieser Versionen.

**Schritte:**
1. Versionsangaben ausblenden. **Achtung:** Das versteckt nur die Version – eine veraltete PHP-Version bleibt trotzdem veraltet!

Apache `.htaccess` + `php.ini`/`.user.ini`:
```apache
Header unset X-Powered-By
# .user.ini bzw. php.ini:
expose_php = Off
```

nginx:
```nginx
server_tokens off;
fastcgi_hide_header X-Powered-By;
```

## 13. 🟡 Eingebettete Inhalte datenschutzfreundlich

**Priorität P2 · ca. 20 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Google Maps wird sofort geladen – Google erfährt von jedem Besuch.

Scanner: Google Maps werden direkt eingebettet – Daten fließen beim Seitenaufruf an Google.

**Schritte:**
1. Zwei-Klick-Lösung: Platzhalterbild + Button „Karte laden (Daten an Google)“, iframe erst nach Klick einfügen.
2. Bei WordPress übernimmt das das Consent-Tool (Content Blocker) oder Plugin „Embed Privacy“.

## 14. 🟡 Schutz gegen eingeschleuste Skripte (CSP)

**Priorität P3 · ca. 30 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Es ist nicht festgelegt, welche Skripte auf der Seite laufen dürfen. Wird eine Lücke ausgenutzt, hat Schadcode leichtes Spiel.

Scanner: Es ist nicht festgelegt, welche Skripte laden dürfen. Bei einer Lücke kann Schadcode leichter ausgeführt werden.

**Schritte:**
1. Zuerst als `Content-Security-Policy-Report-Only` setzen, 1–2 Wochen Browser-Konsole beobachten.
2. Dann scharf schalten. Bei WordPress mit Page-Buildern oft `'unsafe-inline'` für Styles nötig.

nginx (Beispiel, an Seite anpassen!):
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.google-analytics.com; frame-src https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'" always;
```

## 15. 🟡 Cookies sicher gesetzt

**Priorität P3 · ca. 10 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Cookies werden ohne Schutz-Attribute gesetzt und könnten abgegriffen werden.

Scanner: Unsicher gesetzte Cookies: PHPSESSID: ohne „Secure“.

**Schritte:**
1. PHP-Session-Cookies härten (`.user.ini`/`php.ini`).

`.user.ini` / `php.ini`:
```ini
session.cookie_secure = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
```

## 16. 🟡 Dateityp-Schutz (nosniff)

**Priorität P3 · ca. 5 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Browser könnten Dateien „erraten“ und als Programm ausführen.

Scanner: Browser könnten hochgeladene Dateien als Skript ausführen.

**Schritte:**
1. Header `X-Content-Type-Options: nosniff` setzen (im Header-Block enthalten).

## 17. 🟡 Weitergabe von Seitenadressen begrenzt

**Priorität P3 · ca. 5 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Beim Klick auf externe Links wird die volle Adresse mitgeschickt.

Scanner: Beim Klick auf externe Links wird die vollständige Adresse weitergegeben (Datenschutz).

**Schritte:**
1. Header `Referrer-Policy: strict-origin-when-cross-origin` setzen (im Header-Block).

## 18. 🟡 Systemversion nicht öffentlich sichtbar

**Priorität P3 · ca. 5 Min. · 🤖 Claude per Datei/SSH (Stefan prüft)**

**In einfachen Worten:** Im Quellcode steht offen die WordPress-Version. Angreifer-Bots suchen genau danach.

Scanner: Im Quellcode steht: „WordPress 5.8.3“. Angreifer sehen sofort, welche Version läuft.

**Schritte:**
1. Ins Child-Theme (`functions.php`) eintragen oder Sicherheits-Plugin nutzen. Versteckt nur – Update trotzdem nötig!

WordPress Child-Theme `functions.php`:
```php
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
```

## Kontrolle

`node projekt.js nachher kunden/2026-001-tischlerei-huber-gmbh` – erzeugt `bericht.md` und `bericht.html`.
