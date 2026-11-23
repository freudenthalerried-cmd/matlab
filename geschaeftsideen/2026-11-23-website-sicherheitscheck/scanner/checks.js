'use strict';
// Reine Auswertungsfunktionen (ohne Netzwerk) – dadurch gut testbar.
// status: pass (grün) | warn (gelb) | fail (rot) | info (blau)
// sev: 1 = gering, 2 = mittel, 3 = hoch

const CATS = {
  tls: 'Verschlüsselung (HTTPS)',
  headers: 'Schutz-Einstellungen des Servers',
  software: 'Software & Updates',
  mail: 'E-Mail-Sicherheit',
  privacy: 'Datenschutz (DSGVO)',
  reputation: 'Ruf & Malware',
};

const r = (id, cat, title, status, sev, detail, fix = '') => ({ id, cat, title, status, sev, detail, fix });
const DAY = 864e5;

// ---------- Verschlüsselung ----------
const CERT_ERRORS = {
  CERT_HAS_EXPIRED: 'Das Zertifikat ist abgelaufen. Browser zeigen eine Warnseite – Besucher springen ab.',
  ERR_TLS_CERT_ALTNAME_INVALID: 'Das Zertifikat passt nicht zum Domainnamen. Browser zeigen eine Warnseite.',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'Das Zertifikat ist selbst ausgestellt und wird von Browsern nicht anerkannt.',
  SELF_SIGNED_CERT_IN_CHAIN: 'Die Zertifikatskette enthält ein selbst ausgestelltes Zertifikat.',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'Das Zwischenzertifikat fehlt – manche Geräte zeigen eine Warnung.',
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 'Das Zwischenzertifikat fehlt – manche Geräte zeigen eine Warnung.',
};

function checkTls({ https, http, now = Date.now() }) {
  const out = [];
  const httpsOk = https && https.status < 500 && new URL(https.finalUrl).protocol === 'https:';
  out.push(httpsOk
    ? r('https', 'tls', 'Website über HTTPS erreichbar', 'pass', 3, 'Die Verbindung zu Ihrer Website ist verschlüsselt.')
    : r('https', 'tls', 'Website über HTTPS erreichbar', 'fail', 3,
      'Ihre Website ist nicht verschlüsselt erreichbar. Eingaben (z. B. Kontaktformular) können mitgelesen werden, Browser markieren die Seite als „Nicht sicher“.',
      'SSL-Zertifikat (z. B. kostenlos über Let’s Encrypt) beim Hoster aktivieren.'));

  if (http) {
    const finalProto = new URL(http.finalUrl).protocol;
    out.push(finalProto === 'https:'
      ? r('redirect', 'tls', 'Automatische Weiterleitung auf HTTPS', 'pass', 2, 'Wer „http://“ eingibt, landet automatisch auf der sicheren Version.')
      : r('redirect', 'tls', 'Automatische Weiterleitung auf HTTPS', 'fail', 2,
        'Wer Ihre Adresse ohne „https://“ eingibt, bleibt auf der unverschlüsselten Version.',
        'Dauerhafte Weiterleitung (301) von HTTP auf HTTPS im Webserver bzw. beim Hoster einschalten.'));
  }

  if (!httpsOk || !https.tls) return out;
  const t = https.tls;
  if (t.authorized) {
    out.push(r('cert', 'tls', 'SSL-Zertifikat gültig', 'pass', 3, `Gültiges Zertifikat${t.issuer ? ` von ${t.issuer}` : ''}.`));
  } else {
    out.push(r('cert', 'tls', 'SSL-Zertifikat gültig', 'fail', 3,
      CERT_ERRORS[t.authError] || `Das Zertifikat wird von Browsern nicht akzeptiert (${t.authError || 'unbekannter Fehler'}).`,
      'Gültiges Zertifikat für alle Domain-Varianten (mit und ohne www) einrichten, inkl. Zwischenzertifikat.'));
  }

  if (t.validTo) {
    const days = Math.floor((Date.parse(t.validTo) - now) / DAY);
    if (days < 0) out.push(r('cert_expiry', 'tls', 'Zertifikat-Laufzeit', 'fail', 3, `Das Zertifikat ist seit ${-days} Tagen abgelaufen.`, 'Zertifikat sofort erneuern und automatische Verlängerung einrichten.'));
    else if (days < 21) out.push(r('cert_expiry', 'tls', 'Zertifikat-Laufzeit', 'warn', 2, `Das Zertifikat läuft in ${days} Tagen ab.`, 'Prüfen, ob die automatische Verlängerung funktioniert.'));
    else out.push(r('cert_expiry', 'tls', 'Zertifikat-Laufzeit', 'pass', 2, `Noch ${days} Tage gültig.`));
  }

  if (t.protocol) {
    const modern = t.protocol === 'TLSv1.3' || t.protocol === 'TLSv1.2';
    out.push(modern
      ? r('tls_version', 'tls', 'Aktuelles Verschlüsselungsverfahren', 'pass', 2, `Verbindung nutzt ${t.protocol}.`)
      : r('tls_version', 'tls', 'Aktuelles Verschlüsselungsverfahren', 'fail', 2, `Verbindung nutzt das veraltete ${t.protocol}.`, 'Am Server nur TLS 1.2 und 1.3 erlauben.'));
  }
  return out;
}

function checkHsts(headers) {
  const v = headers['strict-transport-security'];
  if (!v) {
    return r('hsts', 'tls', 'HTTPS erzwingen (HSTS)', 'fail', 2,
      'Der Browser wird nicht angewiesen, immer die sichere Verbindung zu nutzen. In öffentlichen WLANs kann die Verbindung so umgeleitet werden.',
      'Header „Strict-Transport-Security: max-age=31536000; includeSubDomains“ setzen.');
  }
  const m = /max-age\s*=\s*"?(\d+)/i.exec(v);
  const age = m ? Number(m[1]) : 0;
  return age >= 15552000
    ? r('hsts', 'tls', 'HTTPS erzwingen (HSTS)', 'pass', 2, 'Browser verwenden dauerhaft nur die sichere Verbindung.')
    : r('hsts', 'tls', 'HTTPS erzwingen (HSTS)', 'warn', 2, `HSTS ist aktiv, aber nur für ${Math.round(age / 86400)} Tage.`, 'max-age auf mindestens 1 Jahr (31536000) erhöhen.');
}

function checkMixedContent(html) {
  const re = /<(script|iframe|img|link|source|video|audio|embed)\b[^>]*?\s(?:src|href)\s*=\s*["']http:\/\/[^"']+["'][^>]*>/gi;
  let active = 0;
  let passive = 0;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    if (tag === 'link' && !/rel\s*=\s*["']?[^"'>]*(stylesheet|icon)/i.test(m[0])) continue;
    if (tag === 'script' || tag === 'iframe' || tag === 'link' || tag === 'embed') active++;
    else passive++;
  }
  if (active) return r('mixed', 'tls', 'Keine unsicheren Inhalte (Mixed Content)', 'fail', 2, `${active} Skripte/Styles werden unverschlüsselt nachgeladen – Browser blockieren sie oder warnen.`, 'Alle eingebundenen Dateien auf https:// umstellen.');
  if (passive) return r('mixed', 'tls', 'Keine unsicheren Inhalte (Mixed Content)', 'warn', 1, `${passive} Bilder/Medien werden unverschlüsselt geladen.`, 'Bild- und Medien-Links auf https:// umstellen.');
  return r('mixed', 'tls', 'Keine unsicheren Inhalte (Mixed Content)', 'pass', 2, 'Alle Inhalte werden verschlüsselt geladen.');
}

// ---------- Server-Header ----------
const PHP_EOL = { '8.1': '2025-12-31', '8.2': '2026-12-31', '8.3': '2027-12-31', '8.4': '2028-12-31', '8.5': '2029-12-31' };

function phpStatus(ver, now = Date.now()) {
  const [maj, min] = ver.split('.').map(Number);
  const key = `${maj}.${min}`;
  if (maj < 8 || (maj === 8 && min < 1)) return { status: 'fail', eol: null };
  const eol = PHP_EOL[key];
  if (!eol) return { status: 'pass', eol: null };
  const left = (Date.parse(eol) - now) / DAY;
  if (left < 0) return { status: 'fail', eol };
  if (left < 90) return { status: 'warn', eol };
  return { status: 'pass', eol };
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function checkHeaders(headers, { isHttps = true, now = Date.now() } = {}) {
  const out = [];
  const h = (k) => headers[k];
  const csp = h('content-security-policy') || '';

  out.push(csp
    ? r('csp', 'headers', 'Schutz gegen eingeschleuste Skripte (CSP)', 'pass', 2, 'Eine Content-Security-Policy ist gesetzt.')
    : r('csp', 'headers', 'Schutz gegen eingeschleuste Skripte (CSP)', 'warn', 2,
      'Es ist nicht festgelegt, welche Skripte laden dürfen. Bei einer Lücke kann Schadcode leichter ausgeführt werden.',
      'Content-Security-Policy schrittweise einführen (erst im Report-Only-Modus testen).'));

  const xfo = (h('x-frame-options') || '').toUpperCase();
  out.push(xfo === 'DENY' || xfo === 'SAMEORIGIN' || /frame-ancestors/i.test(csp)
    ? r('clickjacking', 'headers', 'Schutz gegen Clickjacking', 'pass', 2, 'Ihre Seite kann nicht unbemerkt in fremde Seiten eingebettet werden.')
    : r('clickjacking', 'headers', 'Schutz gegen Clickjacking', 'warn', 2,
      'Ihre Seite kann in fremde Webseiten eingebettet werden – Besucher können so zu ungewollten Klicks verleitet werden.',
      "Header „X-Frame-Options: SAMEORIGIN“ oder CSP „frame-ancestors 'self'“ setzen."));

  out.push((h('x-content-type-options') || '').toLowerCase() === 'nosniff'
    ? r('nosniff', 'headers', 'Dateityp-Schutz (nosniff)', 'pass', 1, 'Browser interpretieren Dateien nicht eigenmächtig um.')
    : r('nosniff', 'headers', 'Dateityp-Schutz (nosniff)', 'warn', 1, 'Browser könnten hochgeladene Dateien als Skript ausführen.', 'Header „X-Content-Type-Options: nosniff“ setzen.'));

  const ref = (h('referrer-policy') || '').toLowerCase();
  out.push(ref && !ref.includes('unsafe-url')
    ? r('referrer', 'headers', 'Weitergabe von Seitenadressen begrenzt', 'pass', 1, `Referrer-Policy: ${ref}.`)
    : r('referrer', 'headers', 'Weitergabe von Seitenadressen begrenzt', 'warn', 1, 'Beim Klick auf externe Links wird die vollständige Adresse weitergegeben (Datenschutz).', 'Header „Referrer-Policy: strict-origin-when-cross-origin“ setzen.'));

  if (!h('permissions-policy')) {
    out.push(r('permissions', 'headers', 'Zugriff auf Kamera/Mikrofon/Standort begrenzt', 'info', 1, 'Keine Permissions-Policy gesetzt (empfohlen, aber kein akutes Risiko).', 'Header „Permissions-Policy: camera=(), microphone=(), geolocation=()“ setzen.'));
  } else {
    out.push(r('permissions', 'headers', 'Zugriff auf Kamera/Mikrofon/Standort begrenzt', 'pass', 1, 'Eine Permissions-Policy ist gesetzt.'));
  }

  const leaks = [];
  const server = h('server');
  if (server && /\d/.test(server)) leaks.push(`Server: ${server}`);
  const powered = h('x-powered-by');
  if (powered) leaks.push(`X-Powered-By: ${powered}`);
  if (h('x-aspnet-version')) leaks.push(`X-AspNet-Version: ${h('x-aspnet-version')}`);
  out.push(leaks.length
    ? r('server_leak', 'headers', 'Keine Versionsnummern öffentlich', 'warn', 1, `Der Server verrät seine Software-Version (${leaks.join(', ')}). Angreifer suchen gezielt nach bekannten Lücken dieser Versionen.`, 'Versionsangaben in der Server-Konfiguration ausblenden (z. B. „expose_php = Off“, „ServerTokens Prod“).')
    : r('server_leak', 'headers', 'Keine Versionsnummern öffentlich', 'pass', 1, 'Der Server verrät keine Software-Versionen.'));

  const php = /PHP\/(\d+\.\d+)/i.exec(powered || '');
  if (php) {
    const s = phpStatus(php[1], now);
    if (s.status === 'fail') out.push(r('php', 'software', `PHP ${php[1]} veraltet`, 'fail', 3, `PHP ${php[1]} bekommt ${s.eol ? `seit ${fmtDate(s.eol)}` : 'seit Jahren'} keine Sicherheitsupdates mehr. Neue Lücken werden nicht mehr geschlossen.`, 'PHP beim Hoster auf eine aktuelle Version (8.3 oder neuer) umstellen – vorher Kompatibilität der Website testen.'));
    else if (s.status === 'warn') out.push(r('php', 'software', `PHP ${php[1]} läuft bald aus`, 'warn', 2, `Sicherheitsupdates für PHP ${php[1]} enden am ${fmtDate(s.eol)}.`, 'Umstieg auf PHP 8.3 oder neuer planen.'));
    else out.push(r('php', 'software', `PHP ${php[1]} aktuell`, 'pass', 2, 'Die PHP-Version erhält Sicherheitsupdates.'));
  }

  out.push(checkCookies(headers['set-cookie'], isHttps));
  return out;
}

function checkCookies(setCookie, isHttps) {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  if (!list.length) return r('cookies', 'headers', 'Cookies sicher gesetzt', 'pass', 1, 'Beim ersten Aufruf werden keine Cookies gesetzt.');
  const issues = [];
  for (const c of list) {
    const name = c.split('=')[0].trim();
    const flags = c.toLowerCase();
    const sensitive = /sess|sid|token|auth|login|wordpress_logged/i.test(name);
    if (isHttps && !/;\s*secure/.test(flags)) issues.push(`${name}: ohne „Secure“`);
    else if (sensitive && !/;\s*httponly/.test(flags)) issues.push(`${name}: ohne „HttpOnly“`);
  }
  return issues.length
    ? r('cookies', 'headers', 'Cookies sicher gesetzt', 'warn', issues.some((i) => /sess|sid|token|auth/i.test(i)) ? 2 : 1, `Unsicher gesetzte Cookies: ${issues.slice(0, 5).join('; ')}.`, 'Cookies mit den Attributen Secure, HttpOnly und SameSite setzen.')
    : r('cookies', 'headers', 'Cookies sicher gesetzt', 'pass', 1, `${list.length} Cookie(s) mit sicheren Attributen.`);
}

// ---------- Software ----------
function cmpVer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

const CMS = [
  ['WordPress', /\/wp-content\/|\/wp-includes\//i, false],
  ['Joomla', /content=["']Joomla|\/media\/jui\//i, false],
  ['TYPO3', /content=["']TYPO3|\/typo3(?:conf|temp)\//i, false],
  ['Drupal', /content=["']Drupal|drupal-settings-json/i, false],
  ['Shopify', /cdn\.shopify\.com/i, true],
  ['Wix', /static\.wixstatic\.com|wix-code/i, true],
  ['Jimdo', /jimdo/i, true],
  ['Squarespace', /static1\.squarespace\.com/i, true],
  ['Webflow', /webflow\.com|data-wf-page/i, true],
];

function checkSoftware(html, { latestWp } = {}) {
  const out = [];
  const cms = CMS.find(([, re]) => re.test(html));
  if (cms) {
    out.push(r('cms', 'software', `System erkannt: ${cms[0]}`, 'info', 1, cms[2]
      ? `${cms[0]} ist ein gehostetes System – Updates übernimmt der Anbieter.`
      : `${cms[0]} muss regelmäßig aktualisiert werden (System, Themes, Plugins).`));
  }

  const gen = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+name=["']generator["']/i.exec(html);
  const genText = gen ? (gen[1] || gen[2]) : '';
  let wpVer = (/WordPress\s+(\d+\.\d+(?:\.\d+)?)/i.exec(genText) || [])[1];
  if (!wpVer && cms && cms[0] === 'WordPress') {
    wpVer = (/(?:block-library\/style(?:\.min)?\.css|wp-emoji-release\.min\.js)\?ver=(\d+\.\d+(?:\.\d+)?)/i.exec(html) || [])[1];
  }
  if (genText && /\d/.test(genText)) {
    out.push(r('generator', 'software', 'Systemversion nicht öffentlich sichtbar', 'warn', 1, `Im Quellcode steht: „${genText.slice(0, 60)}“. Angreifer sehen sofort, welche Version läuft.`, 'Generator-Angabe entfernen (bei WordPress z. B. per Sicherheits-Plugin).'));
  }
  if (wpVer && latestWp) {
    const [lMaj, lMin] = latestWp.split('.');
    const [vMaj, vMin] = wpVer.split('.');
    if (cmpVer(wpVer, latestWp) >= 0) {
      out.push(r('wp_version', 'software', 'WordPress aktuell', 'pass', 3, `WordPress ${wpVer} ist die aktuelle Version.`));
    } else if (vMaj === lMaj && vMin === lMin) {
      out.push(r('wp_version', 'software', 'WordPress-Sicherheitsupdate fehlt', 'warn', 2, `WordPress ${wpVer} läuft, aktuell ist ${latestWp}. Kleine Updates enthalten meist Sicherheitskorrekturen.`, 'WordPress-Update einspielen (vorher Backup).'));
    } else {
      out.push(r('wp_version', 'software', 'WordPress veraltet', 'fail', 3, `WordPress ${wpVer} läuft, aktuell ist ${latestWp}. Veraltete WordPress-Seiten sind das häufigste Ziel automatisierter Angriffe.`, 'Backup erstellen, WordPress, Themes und Plugins aktualisieren, danach Funktion testen.'));
    }
  }

  const plugins = [...new Set([...html.matchAll(/\/wp-content\/plugins\/([a-z0-9_-]+)\//gi)].map((m) => m[1].toLowerCase()))];
  if (plugins.length) {
    out.push(r('plugins', 'software', `${plugins.length} Plugins öffentlich erkennbar`, 'info', 1, `Gefunden: ${plugins.slice(0, 12).join(', ')}${plugins.length > 12 ? ' …' : ''}. Ob davon welche bekannte Sicherheitslücken haben, prüfen wir im Detailbericht.`));
  }

  const jq = /jquery[.-](\d+\.\d+\.\d+)(?:\.min|\.slim)*\.js|jquery(?:\.min)?\.js\?ver=(\d+\.\d+\.\d+)|ajax\.googleapis\.com\/ajax\/libs\/jquery\/(\d+\.\d+\.\d+)/i.exec(html);
  if (jq) {
    const v = jq[1] || jq[2] || jq[3];
    out.push(cmpVer(v, '3.5.0') < 0
      ? r('jquery', 'software', `Veraltete Bibliothek jQuery ${v}`, 'warn', 2, `jQuery ${v} hat bekannte Sicherheitslücken (Cross-Site-Scripting, CVE-2020-11022/11023).`, 'jQuery auf Version 3.7 oder neuer aktualisieren.')
      : r('jquery', 'software', `jQuery ${v} aktuell`, 'pass', 1, 'Keine bekannten Lücken in der eingesetzten jQuery-Version.'));
  }
  return out;
}

// ---------- Datenschutz ----------
const TRACKERS = [
  ['Google Analytics', /google-analytics\.com\/|googletagmanager\.com\/gtag\/js|gtag\(\s*['"]config/i],
  ['Google Tag Manager', /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/],
  ['Meta-/Facebook-Pixel', /connect\.facebook\.net|fbq\(\s*['"]init/i],
  ['Hotjar', /static\.hotjar\.com/i],
  ['Microsoft Clarity', /clarity\.ms\//i],
  ['TikTok-Pixel', /analytics\.tiktok\.com/i],
  ['LinkedIn Insight', /snap\.licdn\.com/i],
];
const CONSENT = [
  ['Cookiebot', /cookiebot/i], ['Usercentrics', /usercentrics/i], ['Borlabs Cookie', /borlabs/i],
  ['Complianz', /complianz/i], ['CookieYes', /cookieyes|cookie-law-info/i], ['OneTrust', /onetrust|cookielaw\.org/i],
  ['Klaro', /klaro/i], ['iubenda', /iubenda/i], ['Real Cookie Banner', /real-cookie-banner/i],
  ['CCM19', /ccm19/i], ['consentmanager', /consentmanager/i],
];

function checkPrivacy(html) {
  const out = [];
  out.push(/fonts\.(?:googleapis|gstatic)\.com/i.test(html)
    ? r('gfonts', 'privacy', 'Google Fonts lokal eingebunden', 'fail', 2,
      'Schriften werden direkt von Google-Servern geladen. Dabei wird die IP-Adresse jedes Besuchers ohne Einwilligung an Google übertragen – in Österreich und Deutschland gab es dazu Abmahnwellen.',
      'Schriftdateien herunterladen und vom eigenen Server ausliefern.')
    : r('gfonts', 'privacy', 'Google Fonts lokal eingebunden', 'pass', 2, 'Im Quellcode wurden keine extern geladenen Google Fonts gefunden.'));

  const found = TRACKERS.filter(([, re]) => re.test(html)).map(([n]) => n);
  const consent = CONSENT.find(([, re]) => re.test(html));
  if (found.length && !consent) {
    out.push(r('tracking', 'privacy', 'Tracking erst nach Einwilligung', 'fail', 2, `Gefunden: ${found.join(', ')} – aber kein Cookie-Banner-Tool erkannt. Tracking ohne Einwilligung verstößt gegen DSGVO/TKG.`, 'Consent-Tool einbinden, das Tracker erst nach Zustimmung lädt.'));
  } else if (found.length) {
    out.push(r('tracking', 'privacy', 'Tracking erst nach Einwilligung', 'info', 1, `Gefunden: ${found.join(', ')}. Cookie-Banner (${consent[0]}) erkannt – ob Tracker wirklich erst nach Zustimmung laden, prüfen wir im Detailbericht.`));
  } else {
    out.push(r('tracking', 'privacy', 'Tracking erst nach Einwilligung', 'pass', 2, 'Keine bekannten Tracking-Dienste im Quellcode gefunden.'));
  }

  const embeds = [];
  if (/youtube\.com\/embed\//i.test(html)) embeds.push('YouTube-Videos');
  if (/google\.[a-z.]+\/maps\/embed|maps\.google\.[a-z.]+\/maps/i.test(html)) embeds.push('Google Maps');
  if (embeds.length) {
    out.push(r('embeds', 'privacy', 'Eingebettete Inhalte datenschutzfreundlich', 'warn', 1, `${embeds.join(' und ')} werden direkt eingebettet – Daten fließen beim Seitenaufruf an Google.`, 'Erst nach Klick laden (Zwei-Klick-Lösung) bzw. youtube-nocookie.com verwenden.'));
  }

  out.push(/impressum|imprint/i.test(html)
    ? r('impressum', 'privacy', 'Impressum vorhanden', 'pass', 2, 'Ein Impressum-Link wurde gefunden.')
    : r('impressum', 'privacy', 'Impressum vorhanden', 'warn', 2, 'Kein Impressum-Link gefunden. In Österreich (ECG, Mediengesetz) und Deutschland (DDG) ist das Pflicht.', 'Impressum mit allen Pflichtangaben ergänzen und auf jeder Seite verlinken.'));

  out.push(/datenschutz|privacy/i.test(html)
    ? r('datenschutz', 'privacy', 'Datenschutzerklärung vorhanden', 'pass', 2, 'Ein Link zur Datenschutzerklärung wurde gefunden.')
    : r('datenschutz', 'privacy', 'Datenschutzerklärung vorhanden', 'warn', 2, 'Kein Link zur Datenschutzerklärung gefunden (DSGVO-Pflicht).', 'Datenschutzerklärung erstellen und auf jeder Seite verlinken.'));
  return out;
}

// ---------- E-Mail ----------
function checkMail({ spf, dmarc }) {
  const out = [];
  if (spf.error) {
    out.push(r('spf', 'mail', 'Schutz gegen gefälschte Absender (SPF)', 'info', 1, 'Konnte nicht geprüft werden (DNS-Abfrage fehlgeschlagen).'));
  } else {
    const recs = spf.records.filter((t) => /^v=spf1\b/i.test(t));
    if (!recs.length) out.push(r('spf', 'mail', 'Schutz gegen gefälschte Absender (SPF)', 'fail', 2, 'Es ist nicht festgelegt, welche Server E-Mails für Ihre Domain senden dürfen. Betrüger können leichter E-Mails in Ihrem Namen verschicken.', 'SPF-Eintrag im DNS anlegen (z. B. „v=spf1 include:<Mailanbieter> -all“).'));
    else if (recs.length > 1) out.push(r('spf', 'mail', 'Schutz gegen gefälschte Absender (SPF)', 'fail', 2, 'Es gibt mehrere SPF-Einträge – damit ist SPF ungültig.', 'SPF-Einträge zu einem einzigen zusammenführen.'));
    else if (/[+]all\b/i.test(recs[0])) out.push(r('spf', 'mail', 'Schutz gegen gefälschte Absender (SPF)', 'fail', 3, 'Der SPF-Eintrag erlaubt jedem Server, in Ihrem Namen zu senden („+all“).', '„+all“ durch „-all“ oder „~all“ ersetzen.'));
    else if (/[~-]all\b/i.test(recs[0])) out.push(r('spf', 'mail', 'Schutz gegen gefälschte Absender (SPF)', 'pass', 2, 'SPF ist korrekt eingerichtet.'));
    else out.push(r('spf', 'mail', 'Schutz gegen gefälschte Absender (SPF)', 'warn', 2, 'SPF ist vorhanden, aber nicht streng (kein „-all“/„~all“).', 'SPF-Eintrag mit „-all“ oder „~all“ abschließen.'));
  }

  if (dmarc.error) {
    out.push(r('dmarc', 'mail', 'Richtlinie gegen E-Mail-Betrug (DMARC)', 'info', 1, 'Konnte nicht geprüft werden (DNS-Abfrage fehlgeschlagen).'));
  } else {
    const rec = dmarc.records.find((t) => /^v=DMARC1/i.test(t));
    const p = rec && (/;\s*p\s*=\s*(\w+)/i.exec(rec) || [])[1];
    if (!rec) out.push(r('dmarc', 'mail', 'Richtlinie gegen E-Mail-Betrug (DMARC)', 'fail', 2, 'Kein DMARC-Eintrag. Gefälschte E-Mails mit Ihrer Absenderadresse werden von Empfängern nicht abgewiesen – beliebt für Rechnungsbetrug.', 'DMARC-Eintrag anlegen, zuerst mit „p=none“ und Berichten, danach auf „quarantine“/„reject“ erhöhen.'));
    else if (/^(reject|quarantine)$/i.test(p || '')) out.push(r('dmarc', 'mail', 'Richtlinie gegen E-Mail-Betrug (DMARC)', 'pass', 2, `DMARC aktiv (p=${p.toLowerCase()}).`));
    else out.push(r('dmarc', 'mail', 'Richtlinie gegen E-Mail-Betrug (DMARC)', 'warn', 2, 'DMARC ist nur im Beobachtungsmodus (p=none) – gefälschte Mails werden noch zugestellt.', 'Nach Auswertung der Berichte auf „p=quarantine“ oder „p=reject“ umstellen.'));
  }
  return out;
}

// ---------- Ruf ----------
function checkReputation(sb) {
  if (!sb) return [];
  if (sb.error) return [r('safebrowsing', 'reputation', 'Nicht auf Google-Warnliste', 'info', 1, 'Konnte nicht geprüft werden.')];
  return [sb.matches
    ? r('safebrowsing', 'reputation', 'Nicht auf Google-Warnliste', 'fail', 3, 'Google stuft Ihre Website als gefährlich ein. Besucher sehen eine rote Warnseite.', 'Sofort Malware entfernen lassen und Überprüfung in der Google Search Console beantragen.')
    : r('safebrowsing', 'reputation', 'Nicht auf Google-Warnliste', 'pass', 3, 'Ihre Website steht nicht auf der Google-Safe-Browsing-Warnliste.')];
}

// ---------- Bewertung ----------
const WEIGHT = { 1: 3, 2: 6, 3: 12 };

function score(results) {
  let s = 100;
  for (const x of results) {
    if (x.status === 'fail') s -= WEIGHT[x.sev];
    else if (x.status === 'warn') s -= WEIGHT[x.sev] / 2;
  }
  const failed = (id) => results.some((x) => x.id === id && x.status === 'fail');
  if (failed('https')) s = Math.min(s, 35);
  else if (failed('cert') || failed('safebrowsing')) s = Math.min(s, 45);
  s = Math.max(0, Math.round(s));
  const grade = s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 40 ? 'D' : 'F';
  return { score: s, grade };
}

module.exports = {
  CATS, checkTls, checkHsts, checkMixedContent, checkHeaders, checkCookies,
  checkSoftware, checkPrivacy, checkMail, checkReputation, score, phpStatus, cmpVer,
};
