"""Generate the 3D demo landing pages from one template.

Usage: python3 build_pages.py  (writes ../landingpages/3d-*.html)
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "landingpages"

PAGES = {
    "bau": dict(
        title="Baumeister Hollerer – Demo", brand="HOLLERER", brand2="BAU",
        accent="#f2a019", accent2="#e07a5f", bg="#f3f1ec", ink="#1f2733",
        kicker="Baumeister · Hausbau · Sanierung",
        h1="Ihr Haus.<br><em>Schlüsselfertig</em> zum Fixpreis.",
        lead="Vom Keller bis zum Dach aus einer Hand. Fixer Preis, fixer Termin – und ein Ansprechpartner, der erreichbar ist.",
        cta="Bauberatung anfragen", cta2="Referenzen ansehen",
        stats=[("25+", "Jahre"), ("380", "Häuser gebaut"), ("100 %", "Termintreue")],
        feats=[("Planung", "Einreichplan, Statik und Behördenwege – wir erledigen alles."),
               ("Rohbau", "Massivbauweise mit regionalen Partnern, sauber dokumentiert."),
               ("Schlüsselfertig", "Innenausbau bis zur Übergabe – Sie ziehen nur noch ein.")],
        img="bau",
    ),
    "immo": dict(
        title="Weitblick Immobilien – Demo", brand="WEITBLICK", brand2="IMMOBILIEN",
        accent="#3d6b5c", accent2="#4fb3d9", bg="#f1f4f0", ink="#1d2a26",
        kicker="Immobilienmakler · Verkauf · Bewertung",
        h1="Ihre Immobilie.<br><em>Bestpreis</em> in 90 Tagen.",
        lead="Kostenlose Marktwert-Ermittlung, 3D-Rundgang und geprüfte Käufer. Sie lehnen sich zurück, wir verkaufen.",
        cta="Gratis bewerten lassen", cta2="Objekte ansehen",
        stats=[("94 %", "Verkauf zum Wunschpreis"), ("62 Tage", "Ø Verkaufszeit"), ("4,9 ★", "Bewertung")],
        feats=[("Bewertung", "Fundierter Marktwert auf Basis echter Verkaufsdaten in Ihrer Region."),
               ("3D-Präsentation", "Virtueller Rundgang und Profi-Fotos – Ihr Objekt fällt auf."),
               ("Sicherer Abschluss", "Bonitätsgeprüfte Käufer, Vertrag und Übergabe aus einer Hand.")],
        img="immo",
    ),
    "gastro": dict(
        title="Café Morgenrot – Demo", brand="Café", brand2="Morgenrot",
        accent="#c4622d", accent2="#f49ac1", bg="#faf4ec", ink="#2e2219",
        kicker="Café · Bäckerei · Frühstück",
        h1="Guter Kaffee.<br><em>Frisch gebacken.</em><br>Jeden Morgen.",
        lead="Hausgemachte Mehlspeisen, Specialty Coffee und das beste Frühstück der Stadt. Ab 7 Uhr für dich da.",
        cta="Tisch reservieren", cta2="Speisekarte",
        stats=[("07–18", "Uhr täglich"), ("100 %", "hausgemacht"), ("4,8 ★", "Google")],
        feats=[("Frühstück", "Von süß bis herzhaft – mit regionalen Zutaten, den ganzen Tag."),
               ("Mehlspeisen", "Croissants, Donuts und Torten, jeden Morgen frisch aus dem Ofen."),
               ("Catering", "Für Büro, Feier oder Meeting – einfach online bestellen.")],
        img="gastro",
    ),
    "tech": dict(
        title="Flowbase App – Demo", brand="flow", brand2="base",
        accent="#7c5cff", accent2="#2de2e6", bg="#f4f3ff", ink="#16142b",
        kicker="App · SaaS · Produkt-Launch",
        h1="Dein Business.<br><em>In einer App.</em>",
        lead="Termine, Rechnungen und Kunden an einem Ort. Einrichten in 5 Minuten – ohne IT-Kenntnisse.",
        cta="14 Tage gratis testen", cta2="Demo ansehen",
        stats=[("12.000+", "Nutzer"), ("5 Min", "Einrichtung"), ("4,8 ★", "App Store")],
        feats=[("Termine", "Online-Buchung mit automatischer Erinnerung per SMS und E-Mail."),
               ("Rechnungen", "Mit einem Klick erstellt, versendet und verbucht."),
               ("Kunden", "Alle Kontakte, Notizen und Umsätze auf einen Blick.")],
        img="tech",
    ),
}

TEMPLATE = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
:root{{--a:{accent};--a2:{accent2};--bg:{bg};--ink:{ink};--muted:color-mix(in srgb,var(--ink) 60%,transparent)}}
*{{box-sizing:border-box;margin:0;padding:0}}
html{{overflow-x:clip}}
body{{font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55;overflow-x:hidden}}
a{{color:inherit;text-decoration:none}}
.wrap{{max-width:1180px;margin:0 auto;padding:0 24px}}
nav{{display:flex;justify-content:space-between;align-items:center;height:80px}}
.logo{{font-weight:800;font-size:22px;letter-spacing:.5px}}.logo span{{color:var(--a)}}
nav ul{{display:flex;gap:30px;list-style:none;font-size:15px;color:var(--muted)}}
.btn{{display:inline-block;padding:15px 28px;border-radius:14px;font-weight:700;transition:transform .2s,box-shadow .2s}}
.btn:hover{{transform:translateY(-2px)}}
.btn.p{{background:var(--a);color:#fff;box-shadow:0 12px 30px color-mix(in srgb,var(--a) 40%,transparent)}}
.btn.s{{background:#fff;box-shadow:0 4px 16px #0000000d}}
nav .btn{{padding:11px 20px;font-size:14px}}
.hero{{display:grid;grid-template-columns:1fr 1.05fr;gap:32px;align-items:center;min-height:calc(100vh - 80px);padding:20px 0 60px}}
.kicker{{display:inline-block;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--a);background:color-mix(in srgb,var(--a) 12%,transparent);padding:7px 14px;border-radius:99px;margin-bottom:22px}}
h1{{font-size:58px;line-height:1.05;letter-spacing:-1.5px;margin-bottom:22px}}
h1 em{{font-style:normal;background:linear-gradient(90deg,var(--a),var(--a2));-webkit-background-clip:text;background-clip:text;color:transparent}}
.lead{{font-size:19px;color:var(--muted);max-width:500px;margin-bottom:32px}}
.stats{{display:flex;gap:34px;margin-top:40px}}
.stats b{{display:block;font-size:26px}}.stats span{{font-size:14px;color:var(--muted)}}
.stage{{position:relative;aspect-ratio:1;perspective:1200px}}
.stage:before{{content:"";position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--a2) 35%,transparent),transparent 65%);filter:blur(20px)}}
.stage img,.cta img{{-webkit-mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent),linear-gradient(to bottom,transparent,#000 8%,#000 92%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent),linear-gradient(to bottom,transparent,#000 8%,#000 92%,transparent);mask-composite:intersect}}
.stage img{{position:relative;width:100%;height:100%;object-fit:contain;animation:float 6s ease-in-out infinite;transition:transform .15s ease-out;will-change:transform}}
@keyframes float{{0%,100%{{translate:0 0}}50%{{translate:0 -14px}}}}
.badge{{position:absolute;background:#fff;border-radius:16px;padding:12px 16px;box-shadow:0 18px 40px #0000001a;font-size:14px;font-weight:600;display:flex;gap:10px;align-items:center;animation:float 7s ease-in-out infinite}}
.badge i{{width:34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--a) 15%,transparent);display:grid;place-items:center;font-style:normal}}
.b1{{left:2%;top:18%}}.b2{{right:0;bottom:16%;animation-delay:-3s}}
section{{padding:90px 0}}
.h2{{text-align:center;max-width:640px;margin:0 auto 50px}}.h2 h2{{font-size:38px;letter-spacing:-.5px;margin-bottom:8px}}.h2 p{{color:var(--muted)}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}}
.card{{background:#fff;border-radius:22px;padding:30px;box-shadow:0 6px 24px #0000000a;transition:transform .25s}}
.card:hover{{transform:translateY(-6px)}}
.card .n{{width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,var(--a),var(--a2));color:#fff;font-weight:800;display:grid;place-items:center;margin-bottom:18px}}
.card h3{{margin-bottom:8px}}.card p{{color:var(--muted);font-size:15px}}
.cta{{background:var(--ink);color:#fff;border-radius:28px;padding:60px;display:grid;grid-template-columns:1.4fr 1fr;align-items:center;gap:30px;overflow:hidden;position:relative}}
.cta h2{{font-size:36px;margin-bottom:10px}}.cta p{{opacity:.75}}
.cta img{{width:100%;max-width:300px;justify-self:end;animation:float 6s ease-in-out infinite}}
footer{{text-align:center;color:var(--muted);font-size:14px;padding:40px 0}}
@media(max-width:900px){{.hero,.grid,.cta{{grid-template-columns:1fr}}h1{{font-size:40px}}nav ul,nav .btn{{display:none}}.logo{{font-size:19px}}.hero{{min-height:0}}.b2{{right:2%}}.stage{{order:-1;max-width:460px;margin:0 auto;width:100%}}.cta{{padding:36px 24px}}.cta img{{justify-self:center}}.stats{{gap:20px}}.badge{{font-size:12px;padding:8px 10px}}}}
@media(prefers-reduced-motion:reduce){{*{{animation:none!important}}}}
</style>
</head>
<body>
<div class="wrap">
<nav><div class="logo">{brand}<span>{brand2}</span></div><ul><li>Leistungen</li><li>Über uns</li><li>Kontakt</li></ul><a class="btn p" href="#kontakt">{cta}</a></nav>
<div class="hero">
  <div>
    <span class="kicker">{kicker}</span>
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
    <a class="btn p" href="#kontakt">{cta}</a>&nbsp; <a class="btn s" href="#leistungen">{cta2}</a>
    <div class="stats">{stats}</div>
  </div>
  <div class="stage" id="stage">
    <img src="3d/{img}.webp" alt="3D-Illustration" id="hero3d">
    <div class="badge b1"><i>★</i>{s0}</div>
    <div class="badge b2"><i>✓</i>{s1}</div>
  </div>
</div>
</div>
<section id="leistungen"><div class="wrap">
  <div class="h2"><h2>Was wir für Sie tun</h2><p>Drei Schritte, ein Ansprechpartner, null Stress.</p></div>
  <div class="grid">{feats}</div>
</div></section>
<div class="wrap" id="kontakt"><div class="cta"><div><h2>Bereit? Lassen Sie uns reden.</h2><p>Unverbindlich und kostenlos – Antwort innerhalb von 24 Stunden.</p><br><a class="btn p" href="#">{cta} →</a></div><img src="3d/{img}.webp" alt=""></div></div>
<footer>3D-Demo-Landingpage · Design: Pixelwerkstatt · fiktives Unternehmen</footer>
<script>
// subtle 3D tilt of the hero render following the pointer
const st=document.getElementById('stage'),im=document.getElementById('hero3d');
if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){{
  st.addEventListener('mousemove',e=>{{const r=st.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    im.style.transform=`rotateY(${{x*14}}deg) rotateX(${{-y*14}}deg) scale(1.03)`;}});
  st.addEventListener('mouseleave',()=>im.style.transform='');
}}
</script>
</body>
</html>
"""

for key, p in PAGES.items():
    stats = "".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in p["stats"])
    feats = "".join(f'<div class="card"><div class="n">{i + 1}</div><h3>{h}</h3><p>{t}</p></div>'
                    for i, (h, t) in enumerate(p["feats"]))
    html = TEMPLATE.format(**{**p, "stats": stats, "feats": feats},
                           s0=" ".join(p["stats"][-1]), s1=" ".join(p["stats"][0]))
    (OUT / f"3d-{key}.html").write_text(html, encoding="utf-8")
    print("wrote", f"3d-{key}.html")
