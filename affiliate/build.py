#!/usr/bin/env python3
"""Baut alle Vergleichsseiten aus niches/*.json nach dist/<slug>/.

Aufruf:  python3 affiliate/build.py
Jede Nische wird ein eigenständiger Ordner, der 1:1 auf eine Domain zeigt.
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

e = html.escape


def amazon_link(query):
    return f"https://{CFG['amazon_domain']}/s?k={quote_plus(query)}&tag={CFG['amazon_tag']}"


def cta(query, label="Aktuellen Preis bei Amazon prüfen*"):
    return (f'<a class="btn" href="{e(amazon_link(query))}" target="_blank" '
            f'rel="sponsored nofollow noopener">{label}</a>')


def page(n, title, desc, path, body, schema=None):
    url = f"https://{n['domain']}/{path}"
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
<nav><a href="./#vergleich">Vergleich</a><a href="./#rechner">Rechner</a><a href="./#ratgeber">Ratgeber</a><a href="checkliste.html">Checkliste</a></nav>
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
{cta(p['suche'])}
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
    related = "".join(f"<li><a href='https://{e(d)}/'>{e(t)}</a></li>" for d, t in n.get("_verwandt", []))

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


def llms(n):
    lines = [f"# {n['marke']}", "", f"> {n['kurzantwort']}", "",
             f"Unabhängiger Vergleich: {n['thema']} (Stand {CFG['stand']}).", "", "## Modelle"]
    lines += [f"- {p['name']}: ideal für {p['fuer']}. " + "; ".join(f"{c}: {v}" for c, v in zip(n['spalten'], p['specs']))
              for p in n["produkte"]]
    lines += ["", "## Häufige Fragen"] + [f"- {q['f']} {q['a']}" for q in n["faq"]]
    lines += ["", "## Seiten", f"- [Vergleich & Rechner](https://{n['domain']}/)",
              f"- [Kaufcheckliste](https://{n['domain']}/checkliste.html)"]
    return "\n".join(lines) + "\n"


def build():
    niches = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((ROOT / "niches").glob("*.json"))]
    if DIST.exists():
        shutil.rmtree(DIST)
    warn = "BITTE" in CFG["betreiber"]["adresse"] or CFG["amazon_tag"].startswith("DEIN")
    for n in niches:
        n["_verwandt"] = [(o["domain"], o["titel"]) for o in niches if o is not n][:4]
        out = DIST / n["slug"]
        out.mkdir(parents=True)
        files = {
            "index.html": index(n),
            "checkliste.html": checkliste(n),
            "impressum.html": impressum(n),
            "datenschutz.html": datenschutz(n),
            "llms.txt": llms(n),
            "robots.txt": f"User-agent: *\nAllow: /\nSitemap: https://{n['domain']}/sitemap.xml\n",
            "sitemap.xml": "<?xml version='1.0' encoding='UTF-8'?>\n<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>"
                           + "".join(f"<url><loc>https://{n['domain']}/{p}</loc><lastmod>{TODAY}</lastmod></url>"
                                     for p in ("", "checkliste.html")) + "</urlset>\n",
        }
        for name, content in files.items():
            (out / name).write_text(content, encoding="utf-8")
        for a in ("style.css", "app.js"):
            shutil.copy(ROOT / "assets" / a, out / a)
        print(f"✓ {n['slug']:<20} → {n['domain']}")
    if warn:
        print("\n⚠ config.json: amazon_tag und/oder Impressum-Adresse noch nicht ausgefüllt!", file=sys.stderr)


if __name__ == "__main__":
    build()
