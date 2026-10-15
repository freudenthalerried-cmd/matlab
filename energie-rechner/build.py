#!/usr/bin/env python3
"""Baut die veröffentlichbare Seite nach dist/.

  python3 build.py           # Entwurf, fehlende Impressum-Daten werden markiert
  python3 build.py --strict  # bricht ab, wenn Pflichtangaben fehlen (für das Deployment)

src.html ist die Arbeitsfassung (auch Vorschau als Artifact). Für die echte Seite werden
die Schriften lokal eingebunden (keine Verbindung zu Google), Partner-Links aus config.json
eingesetzt und Impressum, Datenschutz, robots.txt, sitemap.xml und .htaccess erzeugt.
"""
import html, json, re, shutil, sys, urllib.parse
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
cfg = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
strict = "--strict" in sys.argv
dom = cfg["domain"]
base = f"https://{dom}"
imp = cfg["impressum"]

missing = [k for k in ("name", "address", "email", "gewerbebehoerde") if not imp.get(k)]
if missing and strict:
    sys.exit("Impressum unvollständig, fehlt: " + ", ".join(missing))

def v(key):
    return html.escape(imp.get(key) or f"[{key} ergänzen]")

src = (ROOT / "src.html").read_text(encoding="utf-8")
style = re.search(r"<style>.*?</style>", src, re.S).group(0)

# Partner-Links
aff = cfg["affiliate"]
names = dict(re.findall(r'\{id:"([^"]+)",n:"([^"]+)"', src))
links = {}
for pid, merchant in aff["products"].items():
    m = aff["merchants"].get(merchant, {})
    if aff.get("awin_publisher_id") and m.get("awin_mid"):
        links[pid] = ("https://www.awin1.com/cread.php?awinmid=" + m["awin_mid"] + "&awinaffid="
                      + aff["awin_publisher_id"] + "&ued=" + urllib.parse.quote(m["url"], safe=""))
    elif aff.get("amazon_tag") and pid in names:
        links[pid] = ("https://www.amazon.de/s?k=" + urllib.parse.quote_plus(names[pid])
                      + "&tag=" + aff["amazon_tag"])

FONTS = """<link rel="preload" href="fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="fonts/fonts.css">"""
HEAD = """<!doctype html>
<html lang="de-AT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
"""

def page(title, desc, path, body, extra=""):
    return (HEAD + f"<title>{title}</title>\n<meta name=\"description\" content=\"{desc}\">\n"
            f"<link rel=\"canonical\" href=\"{base}/{path}\">\n" + FONTS + "\n" + extra + style
            + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n")

# Startseite
i = src.index('<header class="top">')
head_src, body_src = src[:i], src[i:]
title = re.search(r"<title>(.*?)</title>", head_src).group(1)
desc = re.search(r'<meta name="description" content="([^"]*)"', head_src).group(1)
body_src = body_src.replace("const LINKS={};", "const LINKS=" + json.dumps(links) + ";")
ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": cfg["site_name"],
      "url": base + "/", "applicationCategory": "UtilitiesApplication", "inLanguage": "de-AT",
      "description": desc, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}}
og = (f'<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n'
      f'<meta property="og:url" content="{base}/">\n<meta property="og:type" content="website">\n'
      f'<meta property="og:locale" content="de_AT">\n'
      f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n')

if DIST.exists():
    shutil.rmtree(DIST)
(DIST / "fonts").mkdir(parents=True)
(DIST / "index.html").write_text(page(title, desc, "", body_src, og), encoding="utf-8")

# Rechtstexte
nav = f"""<header class="top"><div class="wrap"><a class="brand" href="./"><span class="cell" aria-hidden="true"></span>{cfg['site_name']}</a>
<nav class="links" aria-label="Seitenbereiche"><a href="./">Rechner</a><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a></nav></div></header>"""

def legal(h1, inner):
    return nav + f'\n<main class="wrap"><section class="block prose" style="border-top:0">\n<h1>{h1}</h1>\n{inner}\n</section></main>'

uid = html.escape(imp["uid"]) if imp.get("uid") else "keine (Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG)"
impressum = f"""<p><strong>Medieninhaber und Diensteanbieter</strong><br>{v('name')}<br>{v('address')}<br>E-Mail: {v('email')}</p>
<p><strong>Unternehmensgegenstand:</strong> Betrieb eines Informationsportals mit Rechnern zu Stromspeichern, Balkonkraftwerken und Förderungen; Werbung über Partnerprogramme</p>
<p><strong>Gewerbe:</strong> {v('gewerbe')}<br><strong>Gewerbebehörde:</strong> {v('gewerbebehoerde')}<br><strong>Mitglied:</strong> {v('kammer')}<br><strong>UID-Nummer:</strong> {uid}</p>
<h2>Offenlegung gemäß § 25 Mediengesetz</h2>
<p>Medieninhaber: siehe oben. Grundlegende Richtung: unabhängige Informationen und Rechner zu Stromspeichern, Balkonkraftwerken und Förderungen in Österreich.</p>
<h2>Partner-Links</h2>
<p>Mit * gekennzeichnete Links sind Partner-Links. Kaufst du darüber ein, erhalten wir eine Provision. Für dich ändert sich der Preis nicht. Die Reihung im Vergleich richtet sich nur nach dem Preis pro kWh.</p>
<h2>Haftung</h2>
<p>Alle Angaben, insbesondere Förderungen und Preise, werden sorgfältig recherchiert, aber ohne Gewähr. Die Rechner liefern Schätzungen und ersetzen keine Beratung. Für Inhalte verlinkter Seiten sind deren Betreiber verantwortlich.</p>"""
(DIST / "impressum.html").write_text(page("Impressum · " + cfg["site_name"], "Impressum und Offenlegung", "impressum.html", legal("Impressum", impressum)), encoding="utf-8")

ds = f"""<p>Stand: {date.today().strftime('%m/%Y')}. Verantwortlich: {v('name')}, {v('address')}, {v('email')}.</p>
<h2>Kurz gesagt</h2>
<p>Diese Seite setzt keine Cookies, verwendet keine Analyse- oder Werbewerkzeuge und lädt keine Inhalte von fremden Servern. Die Rechner laufen nur in deinem Browser. Deine Eingaben werden nicht übertragen und nicht gespeichert.</p>
<h2>Hosting und Server-Logdateien</h2>
<p>Die Seite liegt bei ALL-INKL.COM – Neue Medien Münnich (Deutschland), mit dem ein Vertrag zur Auftragsverarbeitung besteht. Beim Aufruf verarbeitet der Server technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser). Das dient dem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Logdateien werden nach spätestens {int(cfg['log_retention_days'])} Tagen gelöscht.</p>
<h2>Partner-Links</h2>
<p>Klickst du auf einen Partner-Link (*), wirst du zum Partnernetzwerk (z. B. Awin oder Amazon) und dann zum Shop weitergeleitet. Erst dort können Cookies gesetzt werden, damit ein Kauf uns zugeordnet wird. Dafür gelten die Datenschutzhinweise dieser Anbieter. Wir erfahren keine persönlichen Daten, nur dass ein Verkauf stattfand.</p>
<h2>Kontakt per E-Mail</h2>
<p>Schreibst du uns, verwenden wir deine Angaben nur zur Beantwortung (Art. 6 Abs. 1 lit. b und f DSGVO) und löschen sie, wenn sie nicht mehr gebraucht werden.</p>
<h2>Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wende dich dazu an die oben genannte E-Mail-Adresse. Du kannst dich auch bei der Österreichischen Datenschutzbehörde beschweren (www.dsb.gv.at).</p>"""
(DIST / "datenschutz.html").write_text(page("Datenschutz · " + cfg["site_name"], "Datenschutzerklärung", "datenschutz.html", legal("Datenschutzerklärung", ds)), encoding="utf-8")
(DIST / "404.html").write_text(page("Seite nicht gefunden · " + cfg["site_name"], "Seite nicht gefunden", "404.html", legal("Seite nicht gefunden", '<p>Diese Seite gibt es nicht. <a href="./">Zum Speicher-Rechner</a></p>')), encoding="utf-8")

# Schriften, Icon, Server-Dateien
for f in (ROOT / "assets" / "fonts").glob("*.woff2"):
    shutil.copy(f, DIST / "fonts" / f.name)
ff = lambda fam, file, w: f"@font-face{{font-family:\"{fam}\";src:url({file}) format(\"woff2\");font-weight:{w};font-style:normal;font-display:swap}}"
(DIST / "fonts" / "fonts.css").write_text("\n".join([
    ff("Bricolage Grotesque", "bricolage-grotesque-latin-wght-normal.woff2", "200 800"),
    ff("Source Sans 3", "source-sans-3-latin-400-normal.woff2", 400),
    ff("Source Sans 3", "source-sans-3-latin-600-normal.woff2", 600),
    ff("Source Sans 3", "source-sans-3-latin-700-normal.woff2", 700),
    ff("JetBrains Mono", "jetbrains-mono-latin-500-normal.woff2", 500),
    ff("JetBrains Mono", "jetbrains-mono-latin-700-normal.woff2", 700)]) + "\n", encoding="utf-8")
(DIST / "favicon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="9" y="3" width="14" height="26" rx="3" fill="none" stroke="#0E7C66" stroke-width="3"/><rect x="12.5" y="13" width="7" height="12.5" rx="1" fill="#0E7C66"/></svg>\n', encoding="utf-8")
(DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n", encoding="utf-8")
(DIST / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>{base}/</loc><lastmod>{date.today().isoformat()}</lastmod></url>\n</urlset>\n', encoding="utf-8")
(DIST / ".htaccess").write_text("""RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
ErrorDocument 404 /404.html
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType font/woff2 "access plus 1 year"
ExpiresByType image/svg+xml "access plus 1 month"
ExpiresByType text/html "access plus 1 hour"
</IfModule>
""", encoding="utf-8")

print(f"dist/ gebaut für {dom}: {len(links)} Partner-Links aktiv" + (f", Impressum fehlt: {', '.join(missing)}" if missing else ""))
