#!/usr/bin/env python3
"""Baut alle Vergleichsseiten aus niches/*.json nach dist/<slug>/.

Aufruf:  python3 affiliate/build.py
config.json "modus":
  "ordner"  – eine Dachdomain (hauptdomain), jede Nische unter /<slug>/, Startseite + Sitemap im Hauptverzeichnis
  "domains" – jede Nische ist ein eigenständiger Ordner, der 1:1 auf ihre eigene Domain zeigt
"""
import html
import json
import shutil
import sys
from datetime import date
from pathlib import Path
from urllib.parse import quote_plus

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
CFG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
TODAY = date.today().isoformat()
DISCLOSURE = "Als Amazon-Partner verdiene ich an qualifizierten Verkäufen."
ORDNER = CFG.get("modus", "domains") == "ordner"
HAUPT = CFG.get("hauptdomain", "")
HOME = {"slug": "", "marke": CFG.get("marke", HAUPT), "icon": CFG.get("icon", "🧭"), "farbe": CFG.get("farbe", "#6d28d9"),
        "thema": "Technik, Haus & Garten"}
CASHBACK = {s["id"]: s for s in json.loads((ROOT / "cashback" / "shops.json").read_text(encoding="utf-8")) if s["aktiv"]}

e = html.escape


def base(n):
    """Absolute Adresse einer Nische (bzw. der Startseite) ohne Schrägstrich am Ende."""
    if ORDNER:
        return f"https://{HAUPT}/{n['slug']}" if n["slug"] else f"https://{HAUPT}"
    return f"https://{n['domain']}"


def amazon_link(query):
    return f"https://{CFG['amazon_domain']}/s?k={quote_plus(query)}&tag={CFG['amazon_tag']}"


def cta(query, label="Aktuellen Preis bei Amazon prüfen*"):
    return (f'<a class="btn" href="{e(amazon_link(query))}" target="_blank" '
            f'rel="sponsored nofollow noopener">{label}</a>')


def cashback_cta(p):
    """Zweiter Button zum Hersteller mit Cashback – nur wenn Portal-Domain gesetzt und Shop freigeschaltet."""
    s = CASHBACK.get(p.get("cashback_shop", ""))
    portal = (f"https://{HAUPT}/cashback" if CFG.get("cashback_aktiv") else "") if ORDNER \
        else (f"https://{CFG['cashback_domain']}" if CFG.get("cashback_domain") else "")
    if not s or not portal:
        return ""
    pct = round(s["provision_prozent"] * CFG.get("cashback_anteil", 0.5), 1)
    return (f'<a class="btn alt" href="{portal}/go.php?shop={e(s["id"])}" '
            f'rel="sponsored nofollow noopener" target="_blank">Beim Hersteller mit {pct:g} % Cashback*</a>')


def page(n, title, desc, path, body, schema=None, nav=None):
    url = f"{base(n)}/{path}"
    if nav is None:
        nav = (('<a href="../">Alle Vergleiche</a>' if ORDNER else '')
               + '<a href="./#vergleich">Vergleich</a><a href="./#rechner">Rechner</a>'
               + '<a href="./#ratgeber">Ratgeber</a><a href="checkliste.html">Checkliste</a>')
    ld = "".join(f'<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>'
                 for s in (schema or []))
    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{e(url)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>{n['icon']}</text></svg>">
<link rel="stylesheet" href="style.css">
<style>:root{{--accent:{n['farbe']}}}</style>
{ld}
</head>
<body>
<header class="top"><div class="wrap">
<a class="logo" href="./">{n['icon']} {e(n['marke'])}</a>
<nav>{nav}</nav>
</div></header>
<p class="disclosure wrap">*Werbung/Affiliate-Links: {DISCLOSURE} Für dich ändert sich der Preis nicht.</p>
<main class="wrap">
{body}
</main>
<footer><div class="wrap">
<p>{DISCLOSURE} Preise und Verfügbarkeit können sich ändern; maßgeblich ist der Preis auf Amazon zum Kaufzeitpunkt.</p>
<p>Stand: {e(CFG['stand'])} · <a href="impressum.html">Impressum</a> · <a href="datenschutz.html">Datenschutz</a></p>
</div></footer>
<script src="app.js" defer></script>
</body>
</html>
"""


def index(n):
    cols = n["spalten"]
    rows = "".join(
        f"<tr><th scope='row'>{e(p['name'])}{'<span class=badge>' + e(p['badge']) + '</span>' if p.get('badge') else ''}</th>"
        + "".join(f"<td data-l='{e(c)}'>{e(v)}</td>" for c, v in zip(cols, p["specs"]))
        + f"<td>{cta(p['suche'], 'Preis prüfen*')}</td></tr>"
        for p in n["produkte"])
    table = (f"<div class='tablewrap'><table><thead><tr><th>Modell</th>"
             + "".join(f"<th>{e(c)}</th>" for c in cols)
             + f"<th>Angebot</th></tr></thead><tbody>{rows}</tbody></table></div>")

    cards = "".join(f"""
<article class="card" id="p{i}">
<h3>{e(p['name'])}{'<span class=badge>' + e(p['badge']) + '</span>' if p.get('badge') else ''}</h3>
<p class="fuer"><strong>Ideal für:</strong> {e(p['fuer'])}</p>
<div class="pc"><ul class="pro">{''.join(f'<li>{e(x)}</li>' for x in p['pro'])}</ul>
<ul class="con">{''.join(f'<li>{e(x)}</li>' for x in p['contra'])}</ul></div>
{cta(p['suche'])}{cashback_cta(p)}
</article>""" for i, p in enumerate(n["produkte"], 1))

    r = n["rechner"]
    inputs = "".join(
        f"<label>{e(i['label'])}<span><input type='number' id='{e(i['id'])}' value='{i['wert']}' step='{i.get('step', 'any')}' inputmode='decimal'><em>{e(i.get('einheit', ''))}</em></span></label>"
        for i in r["inputs"])
    calc = (f"<section id='rechner' class='calc'><h2>{e(r['titel'])}</h2><p>{e(r['text'])}</p>"
            f"<form class='calc-form' data-calc='{e(json.dumps(r, ensure_ascii=False))}'>{inputs}</form>"
            f"<div class='calc-out' aria-live='polite'></div></section>")

    guide = "".join(f"<h3>{e(g['h'])}</h3>" + "".join(f"<p>{e(t)}</p>" for t in g["t"].split("\n\n"))
                    for g in n["ratgeber"])
    faq = "".join(f"<details><summary>{e(q['f'])}</summary><p>{e(q['a'])}</p></details>" for q in n["faq"])
    related = "".join(f"<li><a href='{e(h)}'>{e(t)}</a></li>" for h, t in n.get("_verwandt", []))

    body = f"""
<section class="hero">
<h1>{e(n['h1'])}</h1>
<p class="lead">{e(n['einleitung'])}</p>
<div class="answer"><strong>Kurzantwort:</strong> {e(n['kurzantwort'])}</div>
<p class="meta">Aktualisiert: {e(CFG['stand'])} · Unabhängig recherchiert · Keine gekauften Platzierungen</p>
</section>
<section id="vergleich"><h2>Vergleichstabelle {e(n['thema'])}</h2>{table}
<p class="hint">Wir zeigen bewusst keine festen Preise: Sie ändern sich bei {e(n['thema'])} oft täglich. Der Button zeigt den aktuellen Preis.</p></section>
<section><h2>Die Modelle im Detail</h2><div class="cards">{cards}</div></section>
{calc}
<section id="ratgeber" class="guide"><h2>Kaufratgeber: {e(n['thema'])} richtig auswählen</h2>{guide}
{'<h3>Ratgeber-Artikel</h3><ul class="related">' + "".join(f"<li><a href='{e(a['slug'])}.html'>{e(a['h1'])}</a></li>" for a in n['_artikel']) + '</ul>' if n['_artikel'] else ''}
<div class="lead-magnet"><strong>Gratis-Kaufcheckliste:</strong> Alle Punkte zum Abhaken vor dem Kauf – zum Ausdrucken oder als PDF speichern. <a class="btn alt" href="checkliste.html">Checkliste öffnen</a></div></section>
<section id="faq"><h2>Häufige Fragen</h2>{faq}</section>
{'<section><h2>Weitere Vergleiche</h2><ul class="related">' + related + '</ul></section>' if related else ''}
"""
    schema = [
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q["f"],
                         "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in n["faq"]]},
        {"@context": "https://schema.org", "@type": "ItemList", "name": n["h1"],
         "itemListElement": [{"@type": "ListItem", "position": i, "name": p["name"]}
                             for i, p in enumerate(n["produkte"], 1)]},
        {"@context": "https://schema.org", "@type": "Article", "headline": n["h1"],
         "description": n["beschreibung"], "dateModified": TODAY, "inLanguage": "de",
         "author": {"@type": "Person", "name": CFG["betreiber"]["name"]}},
    ]
    return page(n, n["titel"], n["beschreibung"], "", body, schema)


def checkliste(n):
    items = "".join(f"<li><label><input type='checkbox'> {e(c)}</label></li>" for c in n["checkliste"])
    body = f"""<section class="hero"><h1>Gratis-Kaufcheckliste: {e(n['thema'])}</h1>
<p class="lead">Geh diese Punkte vor dem Kauf durch – so vermeidest du die typischen Fehlkäufe.</p>
<button class="btn noprint" onclick="window.print()">Als PDF speichern / drucken</button></section>
<ol class="checklist">{items}</ol>
<p class="noprint"><a href="./#vergleich">← Zurück zum Vergleich</a></p>"""
    return page(n, f"Kaufcheckliste {n['thema']} (gratis, zum Ausdrucken)",
                f"Kostenlose Checkliste mit {len(n['checkliste'])} Punkten für den Kauf von {n['thema']}.",
                "checkliste.html", body)


def impressum(n):
    b = CFG["betreiber"]
    body = f"""<h1>Impressum</h1>
<p>Informationen gemäß § 5 ECG und Offenlegung gemäß § 25 MedienG</p>
<p><strong>{e(b['name'])}</strong><br>{e(b['adresse'])}<br>E-Mail: {e(b['email'])}
{'<br>Telefon: ' + e(b['telefon']) if b['telefon'] else ''}{'<br>UID: ' + e(b['uid']) if b['uid'] else ''}</p>
<p><strong>Blattlinie:</strong> Unabhängige Kaufberatung und Produktvergleiche zum Thema {e(n['thema'])}.</p>
<p><strong>Affiliate-Hinweis:</strong> {DISCLOSURE} Links mit * sind Partnerlinks.</p>
<p>Verbraucher können Beschwerden an die Online-Streitbeilegungsplattform der EU richten.</p>"""
    return page(n, f"Impressum – {n['marke']}", "Impressum", "impressum.html", body)


def datenschutz(n):
    b = CFG["betreiber"]
    body = f"""<h1>Datenschutzerklärung</h1>
<h2>Verantwortlicher</h2><p>{e(b['name'])}, {e(b['adresse'])}, {e(b['email'])}</p>
<h2>Server-Logfiles</h2><p>Beim Aufruf speichert unser Hoster (ALL-INKL.COM – Neue Medien Münnich, Deutschland) technisch notwendige Daten (IP-Adresse gekürzt, Zeitpunkt, aufgerufene Seite, Browser). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Die Daten werden nach spätestens 7 Tagen gelöscht.</p>
<h2>Cookies & Tracking</h2><p>Diese Seite setzt selbst keine Cookies und verwendet keine Analyse- oder Werbe-Tracker. Rechner und Checkliste laufen ausschließlich in deinem Browser.</p>
<h2>Amazon-Partnerprogramm</h2><p>Wir nehmen am Amazon EU-Partnerprogramm teil. Klickst du auf einen Partnerlink, wirst du zu Amazon weitergeleitet; Amazon setzt dort Cookies, um die Herkunft der Bestellung zuzuordnen. Details: Datenschutzerklärung von Amazon.</p>
<h2>Deine Rechte</h2><p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Beschwerden an die Österreichische Datenschutzbehörde (dsb.gv.at).</p>"""
    return page(n, f"Datenschutz – {n['marke']}", "Datenschutzerklärung", "datenschutz.html", body)


def artikel(n, a):
    secs = "".join(f"<h2>{e(x['h'])}</h2>" + "".join(f"<p>{e(t)}</p>" for t in x["t"].split("\n\n"))
                   for x in a["abschnitte"])
    faq = "".join(f"<details><summary>{e(q['f'])}</summary><p>{e(q['a'])}</p></details>" for q in a["faq"])
    top = n["produkte"][0]
    more = "".join(f"<li><a href='{e(o['slug'])}.html'>{e(o['h1'])}</a></li>" for o in n["_artikel"] if o is not a)
    body = f"""<article class="post">
<p class="crumb"><a href="./">{e(n['marke'])}</a> › Ratgeber</p>
<h1>{e(a['h1'])}</h1>
<div class="answer"><strong>Kurzantwort:</strong> {e(a['kurzantwort'])}</div>
<p class="meta">Aktualisiert: {e(CFG['stand'])}</p>
{secs}
<div class="lead-magnet"><span><strong>Unsere Empfehlung:</strong> {e(top['name'])} – ideal für {e(top['fuer'])}.</span>{cta(top['suche'])}</div>
<p><a class="btn alt" href="./#vergleich">Zum kompletten Vergleich</a> <a class="btn alt" href="./#rechner">{e(n['rechner']['titel'])}</a></p>
<h2>Häufige Fragen</h2>{faq}
<h2>Weitere Ratgeber</h2><ul class="related">{more}</ul>
</article>"""
    schema = [
        {"@context": "https://schema.org", "@type": "Article", "headline": a["h1"], "description": a["beschreibung"],
         "dateModified": TODAY, "inLanguage": "de", "author": {"@type": "Person", "name": CFG["betreiber"]["name"]}},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q["f"],
                         "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in a["faq"]]},
    ]
    return page(n, a["titel"], a["beschreibung"], a["slug"] + ".html", body, schema)


def marketing(niches):
    """Google-Ads-Editor-Import und Pinterest-Bulk-CSV nach marketing/."""
    out = ROOT / "marketing"
    out.mkdir(exist_ok=True)
    ads, pins, errors = [], [], []
    for n in niches:
        ad = n.get("_ads")
        if ad:
            camp, grp = f"Affiliate – {n['marke']}", n["thema"]
            for h in ad["headlines"]:
                if len(h) > 30: errors.append(f"{n['slug']}: Headline > 30 Zeichen: {h}")
            for d in ad["descriptions"]:
                if len(d) > 90: errors.append(f"{n['slug']}: Beschreibung > 90 Zeichen: {d}")
            for k in ad["keywords"]:
                ads.append([camp, grp, k, "Phrase", "", "", "", "", ""])
            for k in ADS_NEGATIVE:
                ads.append([camp, grp, k, "Negative Broad", "", "", "", "", ""])
            ads.append([camp, grp, "", "", " | ".join(ad["headlines"]), " | ".join(ad["descriptions"]),
                        f"{base(n)}/", "Vergleich", "Rechner"])
        for a in [{"slug": "", "h1": n["h1"], "beschreibung": n["beschreibung"], "pin": n["titel"]}] + n["_artikel"]:
            name = a["slug"] or "index"
            pins.append([a.get("pin", a["h1"]), f"{base(n)}/pins/{name}.jpg", n["marke"], "",
                         a["beschreibung"], f"{base(n)}/{a['slug'] + '.html' if a['slug'] else ''}", "",
                         n["thema"]])
    import csv
    with open(out / "google-ads-editor.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Campaign", "Ad group", "Keyword", "Criterion Type", "Headlines (| getrennt)",
                    "Descriptions (| getrennt)", "Final URL", "Path 1", "Path 2"])
        w.writerows(ads)
    with open(out / "pinterest-bulk.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"])
        w.writerows(pins)
    json.dump([{"slug": n["slug"], "domain": base(n).removeprefix("https://"), "farbe": n["farbe"], "icon": n["icon"],
                "pins": [{"datei": "index", "titel": n["h1"], "sub": n["kurzantwort"][:110]}]
                + [{"datei": a["slug"], "titel": a["h1"], "sub": a["kurzantwort"][:110]} for a in n["_artikel"]]}
               for n in niches], open(out / "pins.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for err in errors:
        print("⚠", err, file=sys.stderr)


ADS_NEGATIVE = ["gebraucht", "reparatur", "anleitung", "pdf", "defekt", "ersatzteil", "amazon"]


def llms(n):
    lines = [f"# {n['marke']}", "", f"> {n['kurzantwort']}", "",
             f"Unabhängiger Vergleich: {n['thema']} (Stand {CFG['stand']}).", "", "## Modelle"]
    lines += [f"- {p['name']}: ideal für {p['fuer']}. " + "; ".join(f"{c}: {v}" for c, v in zip(n['spalten'], p['specs']))
              for p in n["produkte"]]
    lines += ["", "## Häufige Fragen"] + [f"- {q['f']} {q['a']}" for q in n["faq"]]
    lines += ["", "## Seiten", f"- [Vergleich & Rechner]({base(n)}/)"]
    lines += [f"- [{a['h1']}]({base(n)}/{a['slug']}.html): {a['kurzantwort']}" for a in n["_artikel"]]
    lines += [f"- [Kaufcheckliste]({base(n)}/checkliste.html)"]
    return "\n".join(lines) + "\n"


def seiten(n):
    return [f"{base(n)}/{p}" for p in ["", "checkliste.html"] + [a["slug"] + ".html" for a in n["_artikel"]]]


def sitemap(urls):
    return ("<?xml version='1.0' encoding='UTF-8'?>\n<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>"
            + "".join(f"<url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>" for u in urls) + "</urlset>\n")


def startseite(niches):
    """Ordner-Modus: Startseite der Dachdomain mit allen Vergleichen, dazu Sitemap, robots.txt, llms.txt, .htaccess."""
    m = HOME["marke"]
    cards = "".join(f"""
<article class="card hub" style="--accent:{n['farbe']}">
<h3><span class="ico">{n['icon']}</span> {e(n['thema'])}</h3>
<p>{e(n['kurzantwort'])}</p>
<p class="meta">{len(n['produkte'])} Modelle · {e(n['rechner']['titel'])} · Checkliste{f" · {len(n['_artikel'])} Ratgeber" if n['_artikel'] else ''}</p>
<a class="btn" href="{n['slug']}/">Zum Vergleich</a>
</article>""" for n in niches)
    faq = [
        (f"Wie verdient {m} Geld?", f"Über Partnerlinks: Kaufst du über einen mit * markierten Link, bekommen wir eine kleine Provision. "
                                    f"{DISCLOSURE} Für dich ändert sich der Preis nicht, und die Reihenfolge im Vergleich ist nicht gekauft."),
        ("Warum stehen keine Preise dabei?", "Preise ändern sich bei Technik oft täglich. Statt veralteter Zahlen führt jeder Button direkt zum aktuellen Preis."),
        ("Wie aktuell sind die Vergleiche?", f"Die Modelldaten werden regelmäßig geprüft. Aktueller Stand: {CFG['stand']}."),
    ]
    body = f"""
<section class="hero">
<h1>Ehrliche Kaufvergleiche für Technik, Haus &amp; Garten</h1>
<p class="lead">{e(m)} vergleicht Geräte, bei denen ein Fehlkauf richtig ärgert – vom Balkonkraftwerk-Speicher bis zum Mähroboter. Mit Rechnern, Checklisten und klaren Empfehlungen statt Werbesprech.</p>
<div class="answer"><strong>So arbeiten wir:</strong> Herstellerangaben prüfen, Modelle nach Einsatzzweck sortieren, Vor- und Nachteile offen nennen. Keine gekauften Platzierungen, keine Cookies, keine Tracker.</div>
<p class="meta">{len(niches)} Vergleiche · Stand: {e(CFG['stand'])}</p>
</section>
<section id="vergleiche"><h2>Alle Vergleiche</h2><div class="cards">{cards}</div></section>
<section id="faq"><h2>Häufige Fragen</h2>{''.join(f"<details><summary>{e(f)}</summary><p>{e(a)}</p></details>" for f, a in faq)}</section>
"""
    schema = [
        {"@context": "https://schema.org", "@type": "WebSite", "name": m, "url": base(HOME) + "/", "inLanguage": "de"},
        {"@context": "https://schema.org", "@type": "ItemList", "name": f"Vergleiche auf {m}",
         "itemListElement": [{"@type": "ListItem", "position": i, "name": n["titel"], "url": base(n) + "/"}
                             for i, n in enumerate(niches, 1)]},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": f, "acceptedAnswer": {"@type": "Answer", "text": a}} for f, a in faq]},
    ]
    nav = '<a href="#vergleiche">Vergleiche</a><a href="#faq">Fragen</a>' + ('<a href="cashback/">Cashback</a>' if CFG.get("cashback_aktiv") else '')
    urls = [base(HOME) + "/"] + [u for n in niches for u in seiten(n)]
    files = {
        "index.html": page(HOME, f"{m} – ehrliche Kaufvergleiche für Technik, Haus & Garten",
                           f"Unabhängige Vergleiche mit Rechnern und Checklisten: {', '.join(n['thema'] for n in niches[:4])} und mehr.",
                           "", body, schema, nav),
        "impressum.html": impressum(HOME),
        "datenschutz.html": datenschutz(HOME),
        "robots.txt": f"User-agent: *\nAllow: /\nDisallow: /cashback/\nSitemap: {base(HOME)}/sitemap.xml\n",
        "sitemap.xml": sitemap(urls),
        "llms.txt": "\n".join([f"# {m}", "", "> Unabhängige Kaufvergleiche mit Rechnern und Checklisten (Österreich/Deutschland).", "",
                               f"Stand {CFG['stand']}. Partnerlinks sind gekennzeichnet.", "", "## Vergleiche"]
                              + [f"- [{n['titel']}]({base(n)}/): {n['kurzantwort']} (Details: {base(n)}/llms.txt)" for n in niches]) + "\n",
        ".htaccess": ("RewriteEngine On\nRewriteCond %{HTTPS} off [OR]\nRewriteCond %{HTTP_HOST} ^www\\. [NC]\n"
                      f"RewriteRule ^ https://{HAUPT}%{{REQUEST_URI}} [L,R=301]\nOptions -Indexes\n"),
    }
    for name, content in files.items():
        (DIST / name).write_text(content, encoding="utf-8")
    for a in ("style.css", "app.js"):
        shutil.copy(ROOT / "assets" / a, DIST / a)
    print(f"✓ Startseite                 → {base(HOME)}/  ({len(niches)} Vergleiche, Sitemap {len(urls)} URLs)")


def build():
    niches = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((ROOT / "niches").glob("*.json"))]
    if DIST.exists():
        shutil.rmtree(DIST)
    warn = "BITTE" in CFG["betreiber"]["adresse"] or CFG["amazon_tag"].startswith("DEIN")
    for n in niches:
        n["_verwandt"] = [(f"../{o['slug']}/" if ORDNER else f"https://{o['domain']}/", o["titel"])
                          for o in niches if o is not n][:4]
        extra = ROOT / "artikel" / f"{n['slug']}.json"
        x = json.loads(extra.read_text(encoding="utf-8")) if extra.exists() else {}
        n["_artikel"], n["_ads"] = x.get("artikel", []), x.get("ads")
        out = DIST / n["slug"]
        out.mkdir(parents=True)
        files = {
            "index.html": index(n),
            "checkliste.html": checkliste(n),
            "impressum.html": impressum(n),
            "datenschutz.html": datenschutz(n),
            "llms.txt": llms(n),
        }
        if not ORDNER:
            files["robots.txt"] = f"User-agent: *\nAllow: /\nSitemap: {base(n)}/sitemap.xml\n"
            files["sitemap.xml"] = sitemap(seiten(n))
        files.update({a["slug"] + ".html": artikel(n, a) for a in n["_artikel"]})
        for name, content in files.items():
            (out / name).write_text(content, encoding="utf-8")
        for a in ("style.css", "app.js"):
            shutil.copy(ROOT / "assets" / a, out / a)
        pins = ROOT / "pins" / n["slug"]
        if pins.exists():
            shutil.copytree(pins, out / "pins")
        print(f"✓ {n['slug']:<26} → {base(n)}/  ({len(n['_artikel'])} Artikel)")
    if ORDNER:
        startseite(niches)
    marketing(niches)
    out = DIST / "cashback"
    shutil.copytree(ROOT / "cashback", out, ignore=shutil.ignore_patterns("config.php", "extra.css", "*.log", "*.sqlite"))
    (out / "style.css").write_text((ROOT / "assets" / "style.css").read_text(encoding="utf-8")
                                   + (ROOT / "cashback" / "extra.css").read_text(encoding="utf-8"), encoding="utf-8")
    shutil.copy(ROOT / "assets" / "app.js", out / "app.js")
    print("✓ cashback-portal → dist/cashback")
    if warn:
        print("\n⚠ config.json: amazon_tag und/oder Impressum-Adresse noch nicht ausgefüllt!", file=sys.stderr)


if __name__ == "__main__":
    build()
