#!/usr/bin/env node
'use strict';
// Projekt pro Kunde – vom Gratis-Check bis zum Abschlussbericht.
//   node projekt.js neu "<Kunde>" <domain> [--demo --dns <zone.json> --ca <ca.pem> --ports 80,443 --wp-latest 6.8.3]
//   node projekt.js nachher <ordner> [gleiche Flags; ohne Flags werden die von „neu“ übernommen]
// --demo ist NUR für lokale Testziele: alle Hostnamen zeigen auf 127.0.0.1, DNS kommt aus --dns.
const fs = require('node:fs');
const path = require('node:path');
const { scan } = require('./scanner');
const { score, CATS } = require('./scanner/checks');
const { wissen, fill, WER, SECURITY_HEADERS_APACHE, SECURITY_HEADERS_NGINX } = require('./projekt/fixwissen');

const ROOT = __dirname;
const BASIS = 990;

// ---------- Hilfen ----------
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const eur = (n) => `${n.toLocaleString('de-AT')} €`;
const dmy = (d) => new Date(d).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const AMPEL = { fail: '🔴', warn: '🟡', pass: '🟢', info: '🔵' };

function flat(s) {
  return s.categories.flatMap((c) => c.results.map((r) => ({ ...r, catTitle: c.title })));
}
function offen(s) {
  return flat(s).filter((r) => r.status === 'fail' || r.status === 'warn')
    .sort((a, b) => wissen(a.id).prio - wissen(b.id).prio || b.sev - a.sev || (a.status === 'fail' ? -1 : 1));
}
function pluginCount(s) {
  const p = flat(s).find((r) => r.id === 'plugins');
  return p ? Number(/^(\d+)/.exec(p.title)[1]) : 0;
}
function hatShop(s) {
  return flat(s).some((r) => r.id === 'plugins' && /woocommerce|shop/i.test(r.detail));
}

// ---------- Kommandozeile ----------
function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (k === 'demo') flags.demo = true;
      else flags[k] = argv[++i];
    } else pos.push(a);
  }
  return { cmd: pos[0], pos: pos.slice(1), flags };
}

// Scan-Optionen. Lokale/private Ziele NUR mit --demo.
function scanOptions(flags = {}) {
  const o = {};
  if (flags['wp-latest']) {
    const v = flags['wp-latest'];
    o.latestWp = async () => v;
  }
  if (!flags.demo) {
    if (flags.dns || flags.ca || flags.ports) throw new Error('--dns/--ca/--ports gehen nur zusammen mit --demo.');
    return o;
  }
  o.allowPrivate = true;
  o.allowAnyPort = true;
  o.lookup = (host, opts, cb) => cb(null, [{ address: '127.0.0.1', family: 4 }]);
  if (flags.dns) {
    const file = path.resolve(ROOT, flags.dns);
    o.resolver = {
      resolveTxt: async (name) => {
        const zone = JSON.parse(fs.readFileSync(file, 'utf8')); // bei jedem Scan neu lesen
        const recs = zone[name];
        if (!recs || !recs.length) { const e = new Error('nodata'); e.code = 'ENODATA'; throw e; }
        return recs.map((t) => [t]);
      },
    };
  }
  if (flags.ca) o.ca = fs.readFileSync(path.resolve(ROOT, flags.ca));
  if (flags.ports) {
    const [http, https] = String(flags.ports).split(',').map(Number);
    o.ports = { http, https };
  }
  return o;
}

// Flags für projekt.json: Pfade relativ zum Projektordner, damit der Kundenordner portabel bleibt.
function storableFlags(flags) {
  const out = { ...flags };
  for (const k of ['dns', 'ca']) if (out[k]) out[k] = path.relative(ROOT, path.resolve(ROOT, out[k]));
  return out;
}

// ---------- fixplan.md ----------
const SNIP_LANG = { apache: 'apache', nginx: 'nginx', wp: 'php', php: 'ini', css: 'css', html: 'html', dns: 'text' };

function fixplan(meta, s) {
  const ctx = { domain: meta.domain, host: s.target };
  const list = offen(s);
  const total = list.reduce((n, r) => n + wissen(r.id).min, 0) + 60;
  const L = [];
  L.push(`# Fixplan – ${meta.kunde} (${meta.domain})`, '');
  L.push(`Projekt ${meta.nr} · Scan vom ${dmy(s.scannedAt)} · **Note ${s.grade} (${s.score}/100)** · ${s.summary.fail} rot, ${s.summary.warn} gelb`, '');
  L.push(`Geschätzter Aufwand: **ca. ${Math.round(total / 60 * 2) / 2} h** (inkl. 60 Min. Backup, Tests, Bericht).`, '');
  L.push('**Legende:** ' + Object.values(WER).join(' · '), '');
  L.push('> **Reihenfolge einhalten:** 1. Backup → 2. Staging → 3. Updates → 4. Konfiguration → 5. DNS → 6. `node projekt.js nachher`', '');
  L.push('| # | Ampel | Befund | Prio | Min. | Wer |', '|---|---|---|---|---|---|');
  list.forEach((r, i) => { const k = wissen(r.id); L.push(`| ${i + 1} | ${AMPEL[r.status]} | ${r.title} | P${k.prio} | ${k.min} | ${WER[k.wer]} |`); });
  L.push('');
  const usesHeaders = list.some((r) => ['hsts', 'clickjacking', 'nosniff', 'referrer', 'permissions', 'server_leak'].includes(r.id));
  if (usesHeaders) {
    L.push('## Sicherheits-Header-Block (deckt mehrere Punkte auf einmal ab)', '');
    L.push('🤖 Claude per Datei/SSH. **Stefan: vorher `.htaccess` sichern, danach Seite im Browser prüfen.**', '');
    L.push('Apache (`.htaccess` im Webroot):', '```apache', SECURITY_HEADERS_APACHE, '```', '');
    L.push('nginx (im `server { listen 443 ... }`-Block):', '```nginx', SECURITY_HEADERS_NGINX, '```', '');
  }
  list.forEach((r, i) => {
    const k = wissen(r.id);
    L.push(`## ${i + 1}. ${AMPEL[r.status]} ${r.title}`, '');
    L.push(`**Priorität P${k.prio} · ca. ${k.min} Min. · ${WER[k.wer]}**`, '');
    L.push(`**In einfachen Worten:** ${k.laie || r.detail}`, '');
    L.push(`Scanner: ${r.detail}`, '');
    L.push('**Schritte:**');
    k.schritte.forEach((st, j) => L.push(`${j + 1}. ${fill(st, ctx)}`));
    L.push('');
    for (const [lang, label, code] of k.code || []) {
      L.push(`${fill(label, ctx)}:`, '```' + (SNIP_LANG[lang] || ''), fill(code, ctx), '```', '');
    }
    if (k.verdeckbar) L.push('> ⚠️ Nur die Versionsangabe zu verstecken ist **kein** Fix. Erst nach echtem Update in `notizen.json` unter `manuell_erledigt` eintragen.', '');
  });
  L.push('## Kontrolle', '', `\`node projekt.js nachher kunden/${meta.ordner}\` – erzeugt \`bericht.md\` und \`bericht.html\`.`, '');
  return L.join('\n');
}

// ---------- angebot.md ----------
function kalkulation(s) {
  const ids = new Set(offen(s).map((r) => r.id));
  const failed = (id) => flat(s).some((r) => r.id === id && r.status === 'fail');
  const z = [];
  const pc = pluginCount(s);
  if (pc > 8) z.push(['Viele Plugins (' + pc + ' erkannt): mehr Update- und Testaufwand', 150]);
  if (hatShop(s)) z.push(['Online-Shop (WooCommerce): Bestell- und Zahlungstest nach Updates', 390]);
  if (failed('php')) z.push(['PHP-Wechsel auf 8.3 inkl. Test auf Staging-Kopie', 190]);
  if (failed('wp_version')) z.push(['Großer WordPress-Versionssprung (Staging, Kompatibilität)', 150]);
  if (ids.has('tracking') && failed('tracking')) z.push(['Cookie-Consent-Tool einrichten und Tracking dahinter legen', 120]);
  if (ids.has('jquery')) z.push(['Veraltetes jQuery im Theme ersetzen und testen', 90]);
  if (failed('https') || failed('cert')) z.push(['SSL-Zertifikat neu einrichten', 60]);
  const summe = BASIS + z.reduce((n, [, p]) => n + p, 0);
  return { zuschlaege: z, summe, malware: failed('safebrowsing') };
}

function angebot(meta, s) {
  const k = kalkulation(s);
  const L = [];
  L.push(`# Angebot Fix-Paket – ${meta.kunde}`, '');
  L.push(`Angebot Nr. ${meta.nr} · ${dmy(meta.angelegt)} · gültig 30 Tage · Website: ${meta.domain}`, '');
  L.push(`Ausgangslage: Gratis-Check ergab **Note ${s.grade}** (${s.summary.fail} kritische, ${s.summary.warn} mittlere Befunde).`, '');
  L.push('## Fixpreis', '', '| Position | Betrag |', '|---|---:|');
  L.push(`| Fix-Paket Basis | ${eur(BASIS)} |`);
  k.zuschlaege.forEach(([t, p]) => L.push(`| Zuschlag: ${t} | ${eur(p)} |`));
  L.push(`| **Gesamt (Fixpreis)** | **${eur(k.summe)}** |`, '');
  L.push('**Alle Preise netto zzgl. 20 % USt.** (Als Kleinunternehmer stattdessen: „Umsatzsteuerbefreit gem. § 6 Abs. 1 Z 27 UStG“.)', '');
  L.push('Zahlung: 50 % bei Auftrag, 50 % nach Abschlussbericht.', '');
  L.push('## Leistungsumfang', '');
  [
    'Vollbackup vorher und nachher (extern gespeichert)',
    'WordPress, Theme und Plugins aktualisieren – zuerst auf einer Testkopie',
    'PHP auf aktuelle Version umstellen (sofern Hoster es anbietet)',
    'HTTPS-Weiterleitung, HSTS und Sicherheits-Header einrichten, Versionsangaben ausblenden',
    'Login-Schutz (2-Faktor für Admins, Schutz gegen Passwort-Raten), unbenutzte Plugins/Konten entfernen',
    'E-Mail-Schutz: SPF und DMARC (Stufe 1) im DNS einrichten',
    'DSGVO-Technik: Google Fonts lokal, Cookie-Consent-Tool, Google Maps/YouTube erst nach Klick',
    'Vorher/Nachher-Check, schriftlicher Abschlussbericht, 30 Tage Nachkontrolle',
  ].forEach((t) => L.push(`- ${t}`));
  L.push('', '## Nicht enthalten', '');
  [
    'Rechtsberatung, Texte für Impressum/Datenschutz (Generator der WKO oder Anwalt)',
    'Lizenzkosten für Premium-Plugins oder Consent-Tools',
    k.malware ? '**Malware-Bereinigung (Google-Warnung aktiv!) – separat nach Aufwand**' : 'Malware-Bereinigung bei gehackten Seiten (separat nach Aufwand)',
    'Neugestaltung, neue Inhalte, Programmierung neuer Funktionen',
    'Fehler in Plugins/Themes, für die es keine Updates mehr gibt (Ersatz wird angeboten)',
    'Garantie auf „100 % sicher“ – es gibt sie nicht; wir senken das Risiko deutlich',
  ].forEach((t) => L.push(`- ${t}`));
  L.push('', '## Mitwirkung des Kunden', '');
  L.push('- Zugänge (Hoster-Panel, WP-Admin, DNS) **über einen Passwort-Manager-Freigabelink** – nie per E-Mail/WhatsApp');
  L.push('- Auskunft, über welchen Anbieter die Firmen-E-Mails laufen');
  L.push('- Unterschriebener Auftrag inkl. Einverständnis zur Bearbeitung der Website');
  L.push('', '## Danach: Wartung (empfohlen)', '');
  L.push('Ab **79 €/Monat** netto: monatliche Updates mit Backup, Uptime-Überwachung, monatlicher Sicherheits-Check, DMARC-Stufe 2, Notfall-Hilfe bevorzugt. Monatlich kündbar.', '');
  return L.join('\n');
}

// ---------- video-skript.md ----------
const ROAST = {
  php: 'Ihre Website läuft auf PHP {{v}}. Das ist ungefähr so, als würden Sie im Winter mit Sommerreifen von 2019 fahren – geht, bis es nicht mehr geht.',
  wp_version: 'WordPress ist nicht aktuell. Für Hacker-Bots ist das wie eine Haustür mit Zettel: „Schlüssel unter der Matte“.',
  gfonts: 'Ihre Schriften kommen direkt von Google. Sieht schön aus – und bei jedem Besuch geht die IP-Adresse nach Amerika. Genau dafür gab es in Österreich Abmahnbriefe.',
  tracking: 'Google Analytics zählt fleißig mit – nur gefragt hat niemand. Das ist leider das, was Datenschützer am liebsten finden.',
  dmarc: 'Jeder auf der Welt kann gerade E-Mails als „office@{{domain}}“ verschicken, und kaum ein Postfach hält sie auf. Gefälschte Rechnungen sind das Lieblingsgeschäft von Betrügern.',
  spf: 'Es ist nirgends festgelegt, wer im Namen Ihrer Firma mailen darf. Das macht es Betrügern sehr leicht.',
  redirect: 'Wer Ihre Adresse ohne „https“ eintippt, landet auf der unverschlüsselten Version. Kleiner Schalter, große Wirkung.',
  hsts: 'Der Browser wird nicht angewiesen, immer verschlüsselt zu bleiben. Im Hotel-WLAN ist das eine offene Einladung.',
  jquery: 'Eine eingebaute Bibliothek ist von 2016 – mit bekannten Lücken. Software altert wie Milch, nicht wie Wein.',
  embeds: 'Die Google-Karte lädt sofort, auch wenn niemand sie anschaut. Google weiß also von jedem Besuch.',
  server_leak: 'Ihr Server erzählt jedem freiwillig, welche Software-Version er hat. Das ist wie ein Schild am Firmentor: „Alarmanlage Modell 2015, Code nie geändert“.',
  generator: 'Im Quellcode steht ganz offen die WordPress-Version. Bots lesen das in Millisekunden.',
  csp: 'Es ist nicht festgelegt, welche Skripte laufen dürfen. Wenn doch einmal etwas eingeschleust wird, hält es niemand auf.',
};

function videoSkript(meta, s) {
  const ctx = { domain: meta.domain };
  const list = offen(s);
  const top = list.filter((r) => r.status === 'fail').concat(list.filter((r) => r.status === 'warn')).slice(0, 6);
  const rest = list.length - top.length;
  const good = flat(s).filter((r) => r.status === 'pass').slice(0, 3);
  const k = kalkulation(s);
  const segs = [];
  segs.push([45, 'Begrüßung', `Grüß Gott, hier ist Stefan von Seitencheck. Ich habe mir die Website von ${meta.kunde}, ${meta.domain}, genauer angeschaut – so, wie es auch ein Angreifer tun würde, nur ohne böse Absicht. Ich bin ehrlich mit Ihnen, auch wenn's ein bisschen weh tut. Dafür sind Sie am Ende des Videos schlauer und wissen genau, was zu tun ist.`, 'Startseite der Kundenwebsite zeigen.']);
  segs.push([60, 'Das Ergebnis auf einen Blick', `Die Ampel steht auf **Note ${s.grade}**, ${s.score} von 100 Punkten. ${s.summary.fail} Punkte sind rot, ${s.summary.warn} gelb. ${s.grade === 'F' ? 'Klartext: Das ist die schlechteste Note. Gehackt ist die Seite deswegen nicht – aber sie macht es Angreifern unnötig leicht.' : 'Da ist Luft nach oben.'}`, 'Seitencheck-Ergebnis mit Ampel einblenden.']);
  top.forEach((r) => {
    const v = (/PHP (\d+\.\d+)/.exec(r.title) || [])[1] || '';
    const roast = fill((ROAST[r.id] || wissen(r.id).laie || r.detail).replace('{{v}}', v), ctx);
    segs.push([r.status === 'fail' ? 90 : 60, r.title, `${roast}\n\nWas heißt das für Sie? ${wissen(r.id).laie || r.detail}\n\nDie Lösung: ${r.fix || 'siehe Fixplan'} Aufwand für uns: rund ${wissen(r.id).min} Minuten.`, quelleZeigen(r)]);
  });
  if (rest > 0) segs.push([40, 'Kleinkram', `Dazu kommen noch ${rest} kleinere Punkte – die stehen alle im schriftlichen Bericht und sind beim Fix-Paket automatisch dabei.`, 'Liste der restlichen gelben Punkte scrollen.']);
  if (good.length) segs.push([30, 'Was schon gut ist', `Fairerweise: Es ist nicht alles schlecht. ${good.map((g) => g.title).join(', ')} – passt.`, 'Grüne Punkte zeigen.']);
  segs.push([90, 'Meine Empfehlung', `Mein ehrlicher Rat: Nicht ewig liegen lassen. Die roten Punkte sind genau das, wonach automatische Angriffe suchen – und bei Google Fonts und Analytics ohne Einwilligung kann ein Abmahnbrief schneller kommen als ein Hacker.\n\nIch kann das für Sie zum **Fixpreis von ${eur(k.summe)} netto** erledigen: Backup, Updates auf einer Testkopie, alle Einstellungen, E-Mail-Schutz und ein Vorher/Nachher-Bericht. Dauer: ca. eine Woche ab Freigabe. Danach halte ich die Seite für 79 Euro im Monat aktuell, damit wir das nicht in zwei Jahren wieder machen.\n\nDas Angebot liegt im Mail. Antworten Sie einfach mit „Passt“, dann melde ich mich wegen der Zugänge. Danke fürs Zuschauen!`, 'Angebot (angebot.md / PDF) einblenden, dann Gesicht/Kamera.']);
  let t = 0;
  const L = [`# Video-Skript Analyse – ${meta.kunde} (${meta.domain})`, '', `Ziel: 10–15 Min. Bildschirmaufnahme · Ton: freundlich-direkt, ehrlicher „Roast“, keine Fachbegriffe ohne Erklärung · Note ${s.grade}`, '', '> **Vorbereitung:** Website, Seitencheck-Ergebnis, Browser-Entwicklertools (Netzwerk-Tab) und `angebot.md` in Tabs öffnen. Keine Passwörter oder Kundendaten ins Bild!', ''];
  for (const [dur, title, text, bild] of segs) {
    L.push(`## [${mmss(t)}] ${title}`, '', `*Bild: ${bild}*`, '', text, '');
    t += dur;
  }
  L.push(`---`, `Geplante Länge: **ca. ${mmss(t)} Min.** (Sprechtempo ~130 Wörter/Min.). Unter 10 Min.? Bei den roten Punkten live im Quelltext zeigen.`, '');
  return L.join('\n');
}
function quelleZeigen(r) {
  if (['gfonts', 'tracking', 'embeds'].includes(r.id)) return 'Entwicklertools → Netzwerk-Tab, Anfrage an Google zeigen (vor jedem Klick).';
  if (['generator', 'wp_version', 'jquery'].includes(r.id)) return 'Quelltext (Strg+U), Versionsnummer markieren.';
  if (['php', 'server_leak', 'hsts', 'csp', 'clickjacking', 'nosniff', 'referrer'].includes(r.id)) return 'Entwicklertools → Netzwerk → Antwort-Header der Startseite.';
  if (['spf', 'dmarc'].includes(r.id)) return 'DNS-Abfrage (z. B. mxtoolbox.com) mit leerem Ergebnis zeigen.';
  return 'Seitencheck-Ergebnis zu diesem Punkt.';
}

// ---------- auftrag-checkliste.md ----------
function checkliste(meta) {
  return `# Auftrags-Checkliste – ${meta.kunde} (${meta.domain})

Projekt ${meta.nr}

## Vor dem Start
- [ ] Angebot angenommen, **Auftrag mit AGB unterschrieben** (Haftungsbegrenzung, Mitwirkungspflichten)
- [ ] **Schriftliches Einverständnis**: Kunde ist Inhaber/berechtigt, Arbeiten an ${meta.domain} sind erlaubt
- [ ] Anzahlung 50 % eingegangen
- [ ] Berufshaftpflicht/Cyber-Versicherung aktiv

## Zugangsdaten – nur über Passwort-Manager
- [ ] Freigabe per **Bitwarden Send / 1Password-Link / Passwort-Manager-Ordner** – nie E-Mail, SMS, WhatsApp
- [ ] Hoster-Panel (eigener Unterzugang, wenn möglich)
- [ ] WordPress: **eigenes Admin-Konto** für Stefan (nicht das des Kunden)
- [ ] DNS/Domain-Registrar (nur wenn SPF/DMARC dort gesetzt werden)
- [ ] SFTP/SSH (nur falls Dateien/Konfig geändert werden)
- [ ] Mailanbieter des Kunden notiert (für SPF/DKIM): ____________
- [ ] Nichts davon im Repo, in \`kunden/\` oder in Chat-Verläufen speichern

## Backup vorher
- [ ] Vollbackup Dateien + Datenbank (Hoster-Backup **und** UpdraftPlus o. ä.)
- [ ] Backup **extern** gespeichert und Wiederherstellung kurz geprüft (Datei öffnet sich, DB-Dump nicht leer)
- [ ] Staging-Kopie angelegt

## Ablauf
1. [ ] \`scan-vorher.json\` und \`fixplan.md\` mit Kunde abgestimmt
2. [ ] Updates auf Staging → testen (Startseite, Kontaktformular, Mobil)
3. [ ] Updates live, PHP-Version umstellen
4. [ ] Konfiguration (Header, Weiterleitung, Versionsangaben, Cookies)
5. [ ] DSGVO-Technik (Fonts lokal, Consent-Tool, Maps per Klick)
6. [ ] DNS: SPF, DMARC Stufe 1
7. [ ] Login-Schutz: 2FA für Admins, unbenutzte Konten/Plugins löschen
8. [ ] \`node projekt.js nachher kunden/${meta.ordner}\`, Bericht prüfen
9. [ ] Backup nachher
10. [ ] Bericht an Kunden, **Kunde ändert alle geteilten Passwörter**, Stefans Admin-Konto deaktivieren
11. [ ] Rechnung Rest 50 %, Wartung anbieten, Nachkontrolle in 30 Tagen im Kalender

## Notfallplan
- Seite kaputt nach Update → Backup einspielen, Kunde sofort informieren, Ursache auf Staging suchen.
`;
}

// ---------- Vergleich vorher/nachher ----------
function vergleich(vorher, nachher, notizen = {}) {
  const manuell = notizen.manuell_erledigt || {};
  const before = new Map(flat(vorher).map((r) => [r.id, r]));
  const after = new Map(flat(nachher).map((r) => [r.id, r]));
  const bad = (r) => r && (r.status === 'fail' || r.status === 'warn');
  const items = [];
  for (const [id, b] of before) {
    if (!bad(b)) continue;
    const a = after.get(id);
    const k = wissen(id);
    let state;
    if (manuell[id]) state = 'behoben';
    else if (!a) state = k.verdeckbar ? 'verdeckt' : 'behoben';
    else if (!bad(a)) state = 'behoben';
    else if (b.status === 'fail' && a.status === 'warn') state = 'teilweise';
    else state = 'offen';
    items.push({ id, vorher: b, nachher: a || null, state, notiz: manuell[id] || '', panel: k.panel || '' });
  }
  const neu = flat(nachher).filter((r) => bad(r) && !bad(before.get(r.id)));
  // Ehrliche Note: verdeckte (nur versteckte, nicht behobene) Punkte zählen weiter.
  const ehrlichResults = [...flat(nachher), ...items.filter((x) => x.state === 'verdeckt').map((x) => x.vorher)];
  return { items, neu, ehrlich: score(ehrlichResults) };
}

function berichtMd(meta, v, n, cmp) {
  const by = (st) => cmp.items.filter((x) => x.state === st);
  const L = [`# Abschlussbericht Website-Sicherheit – ${meta.kunde}`, '', `${meta.domain} · Projekt ${meta.nr} · Vorher: ${dmy(v.scannedAt)} · Nachher: ${dmy(n.scannedAt)}`, ''];
  L.push('| | Vorher | Nachher |', '|---|---|---|');
  L.push(`| Scanner-Note | **${v.grade}** (${v.score}) | **${n.grade}** (${n.score}) |`);
  L.push(`| Ehrliche Note¹ | | **${cmp.ehrlich.grade}** (${cmp.ehrlich.score}) |`);
  L.push(`| Rot / Gelb | ${v.summary.fail} / ${v.summary.warn} | ${n.summary.fail} / ${n.summary.warn} |`, '');
  L.push('¹ Zählt Punkte weiter, die nur unsichtbar gemacht, aber noch nicht wirklich behoben sind (z. B. veraltetes PHP mit versteckter Versionsnummer).', '');
  L.push(`## ✅ Erledigt (${by('behoben').length})`, '');
  by('behoben').forEach((x) => L.push(`- ${x.vorher.title}${x.notiz ? ` – ${x.notiz}` : ''}`));
  if (by('teilweise').length) { L.push('', '## 🟡 Teilweise erledigt', ''); by('teilweise').forEach((x) => L.push(`- ${x.vorher.title}: ${x.nachher.detail}`)); }
  const open = [...by('verdeckt'), ...by('offen')];
  L.push('', `## ⏳ Offen (${open.length})`, '');
  by('verdeckt').forEach((x) => L.push(`- **${x.vorher.title}** – Version jetzt versteckt, aber **noch nicht aktualisiert**. Beim echten Kunden im Panel zu erledigen: ${x.panel}.`));
  by('offen').forEach((x) => L.push(`- **${x.nachher.title}** – ${x.nachher.detail}${x.panel ? ` Beim echten Kunden im Panel zu erledigen: ${x.panel}.` : ''}`));
  if (cmp.neu.length) { L.push('', '## ⚠️ Neu aufgefallen', ''); cmp.neu.forEach((r) => L.push(`- ${r.title}: ${r.detail}`)); }
  L.push('', '## Empfehlung', '');
  L.push('Sicherheit ist kein Zustand, sondern Routine: Jede Woche erscheinen neue Lücken in Plugins. Wir empfehlen die **Wartung ab 79 €/Monat** (Updates mit Backup, Überwachung, monatlicher Check, DMARC Stufe 2).', '');
  return L.join('\n');
}

function berichtHtml(meta, v, n, cmp) {
  const by = (st) => cmp.items.filter((x) => x.state === st);
  const gcol = (g) => ({ A: '#1a7f37', B: '#4c9a2a', C: '#bf8700', D: '#d4630b', F: '#cf222e' }[g]);
  const badge = (g, sc, label) => `<div class="grade"><div class="g" style="background:${gcol(g)}">${g}</div><div class="gl">${label}<br><b>${sc}/100</b></div></div>`;
  const li = (arr, fn) => arr.length ? `<ul>${arr.map((x) => `<li>${fn(x)}</li>`).join('')}</ul>` : '<p class="muted">–</p>';
  const rows = cmp.items.map((x) => `<tr><td>${AMPEL[x.vorher.status]}</td><td>${esc(x.vorher.title)}</td><td>${x.nachher ? AMPEL[x.nachher.status] : '—'}</td><td class="st st-${x.state}">${{ behoben: 'erledigt', teilweise: 'teilweise', verdeckt: 'versteckt, Update offen', offen: 'offen' }[x.state]}</td></tr>`).join('');
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Abschlussbericht ${esc(meta.kunde)}</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--fg:#1f2328;--mut:#656d76;--line:#d0d7de}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:24px 16px}
header{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px}
.brand{font-weight:700;color:#0969da}h1{font-size:24px;margin:4px 0}h2{font-size:18px;margin:0 0 8px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin:14px 0}
.grades{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.arrow{font-size:28px;color:var(--mut)}
.grade{display:flex;align-items:center;gap:10px}.g{width:64px;height:64px;border-radius:14px;color:#fff;font:700 38px/64px system-ui;text-align:center}
.gl{color:var(--mut);font-size:13px}.muted{color:var(--mut)}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left}
.st{font-weight:600}.st-behoben{color:#1a7f37}.st-teilweise{color:#bf8700}.st-verdeckt,.st-offen{color:#cf222e}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:640px){.cols{grid-template-columns:1fr}}
.cta{background:#ddf4ff;border-color:#54aeff}small{color:var(--mut)}
@media print{body{background:#fff}.card{break-inside:avoid}}
</style></head><body><div class="wrap">
<header><div><div class="brand">Seitencheck</div><h1>Abschlussbericht Website-Sicherheit</h1><div class="muted">${esc(meta.kunde)} · ${esc(meta.domain)} · Projekt ${esc(meta.nr)}</div></div>
<div class="muted">Vorher ${dmy(v.scannedAt)} · Nachher ${dmy(n.scannedAt)}</div></header>
<div class="card"><h2>Vorher → Nachher</h2><div class="grades">${badge(v.grade, v.score, 'Vorher')}<div class="arrow">→</div>${badge(n.grade, n.score, 'Nachher (Scanner)')}${badge(cmp.ehrlich.grade, cmp.ehrlich.score, 'Ehrliche Note*')}</div>
<p class="muted">Rot/Gelb vorher ${v.summary.fail}/${v.summary.warn} · nachher ${n.summary.fail}/${n.summary.warn}.<br>* Zählt Punkte weiter, die nur unsichtbar gemacht, aber noch nicht wirklich behoben sind.</p></div>
<div class="cols">
<div class="card"><h2>✅ Erledigt (${by('behoben').length})</h2>${li(by('behoben'), (x) => esc(x.vorher.title) + (x.notiz ? ` <small>– ${esc(x.notiz)}</small>` : ''))}</div>
<div class="card"><h2>⏳ Offen (${by('verdeckt').length + by('offen').length + by('teilweise').length})</h2>${li([...by('verdeckt'), ...by('teilweise'), ...by('offen')], (x) => `<b>${esc(x.vorher.title)}</b><br><small>${x.state === 'verdeckt' ? 'Version versteckt, aber noch nicht aktualisiert. ' : esc((x.nachher || x.vorher).detail) + ' '}${x.panel ? 'Beim echten Kunden im Panel: ' + esc(x.panel) + '.' : ''}</small>`)}</div>
</div>
${cmp.neu.length ? `<div class="card"><h2>⚠️ Neu aufgefallen</h2>${li(cmp.neu, (r) => `${esc(r.title)} <small>${esc(r.detail)}</small>`)}</div>` : ''}
<div class="card"><h2>Alle Befunde im Detail</h2><table><tr><th>Vorher</th><th>Befund</th><th>Nachher</th><th>Status</th></tr>${rows}</table></div>
<div class="card cta"><h2>Empfehlung: Wartung ab 79 €/Monat</h2><p>Jede Woche werden neue Lücken in Plugins bekannt. Mit der Wartung bleiben WordPress, Plugins und PHP aktuell (immer mit Backup), die Seite wird überwacht, und Sie bekommen jeden Monat einen kurzen Sicherheits-Check. DMARC wird auf Stufe 2 angehoben. Monatlich kündbar. Preise netto.</p></div>
<p class="muted"><small>Geprüft wurde von außen, wie ein Besucher. Kein Prüfbericht garantiert absolute Sicherheit.</small></p>
</div></body></html>`;
}

// ---------- Befehle ----------
function nextNummer(kundenDir, year) {
  if (!fs.existsSync(kundenDir)) return 1;
  const nums = fs.readdirSync(kundenDir).map((d) => new RegExp(`^${year}-(\\d{3})-`).exec(d)).filter(Boolean).map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

async function neu(kunde, domain, flags = {}, { kundenDir = path.join(ROOT, 'kunden'), now = new Date() } = {}) {
  if (!kunde || !domain) throw new Error('Aufruf: node projekt.js neu "<Kunde>" <domain>');
  const year = now.getFullYear();
  const nr = `${year}-${String(nextNummer(kundenDir, year)).padStart(3, '0')}`;
  const ordner = `${nr}-${slugify(kunde)}`;
  const dir = path.join(kundenDir, ordner);
  const s = await scan(domain, scanOptions(flags));
  fs.mkdirSync(dir, { recursive: true });
  const meta = { nr, kunde, domain: s.target.replace(/^www\./, ''), ordner, angelegt: now.toISOString(), flags: storableFlags(flags) };
  const w = (f, c) => fs.writeFileSync(path.join(dir, f), c);
  w('projekt.json', JSON.stringify(meta, null, 2) + '\n');
  w('scan-vorher.json', JSON.stringify(s, null, 2) + '\n');
  w('notizen.json', JSON.stringify({ manuell_erledigt: {}, _hinweis: 'Nur echte Updates eintragen, z. B. "php": "PHP 8.3 im Panel umgestellt am 01.12.2026"' }, null, 2) + '\n');
  w('fixplan.md', fixplan(meta, s));
  w('angebot.md', angebot(meta, s));
  w('video-skript.md', videoSkript(meta, s));
  w('auftrag-checkliste.md', checkliste(meta));
  return { dir, meta, scan: s };
}

async function nachher(ordner, flags = {}) {
  const dir = path.resolve(ordner);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'projekt.json'), 'utf8'));
  const v = JSON.parse(fs.readFileSync(path.join(dir, 'scan-vorher.json'), 'utf8'));
  const notizenFile = path.join(dir, 'notizen.json');
  const notizen = fs.existsSync(notizenFile) ? JSON.parse(fs.readFileSync(notizenFile, 'utf8')) : {};
  const n = await scan(meta.domain, scanOptions(Object.keys(flags).length ? flags : meta.flags));
  const cmp = vergleich(v, n, notizen);
  fs.writeFileSync(path.join(dir, 'scan-nachher.json'), JSON.stringify(n, null, 2) + '\n');
  fs.writeFileSync(path.join(dir, 'bericht.md'), berichtMd(meta, v, n, cmp));
  fs.writeFileSync(path.join(dir, 'bericht.html'), berichtHtml(meta, v, n, cmp));
  return { dir, vorher: v, nachher: n, vergleich: cmp };
}

async function main() {
  const { cmd, pos, flags } = parseArgs(process.argv.slice(2));
  if (cmd === 'neu') {
    const r = await neu(pos[0], pos[1], flags);
    console.log(`Angelegt: ${path.relative(process.cwd(), r.dir)}\nNote ${r.scan.grade} (${r.scan.score}/100) · ${r.scan.summary.fail} rot, ${r.scan.summary.warn} gelb · Angebot ${eur(kalkulation(r.scan).summe)} netto`);
  } else if (cmd === 'nachher') {
    const r = await nachher(pos[0], flags);
    const c = r.vergleich;
    console.log(`Vorher ${r.vorher.grade} (${r.vorher.score}) → Nachher ${r.nachher.grade} (${r.nachher.score}) · ehrlich ${c.ehrlich.grade} (${c.ehrlich.score})\nErledigt ${c.items.filter((x) => x.state === 'behoben').length}, offen ${c.items.filter((x) => x.state !== 'behoben').length}, neu ${c.neu.length}`);
  } else {
    console.log('Aufruf:\n  node projekt.js neu "<Kunde>" <domain> [--demo --dns zone.json --ca ca.pem --ports 80,443 --wp-latest 6.8.3]\n  node projekt.js nachher <ordner>');
    process.exitCode = cmd ? 1 : 0;
  }
}

if (require.main === module) main().catch((e) => { console.error(`Fehler: ${e.message}`); process.exitCode = 1; });

module.exports = { neu, nachher, parseArgs, scanOptions, fixplan, angebot, videoSkript, checkliste, kalkulation, vergleich, berichtMd, berichtHtml, slugify, CATS };
