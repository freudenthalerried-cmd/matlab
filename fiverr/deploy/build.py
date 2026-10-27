"""Build the upload package for the live website (ALL-INKL or any Apache host).

Differences to the preview version:
- fonts and three.js are served from the own server (no Google Fonts / CDN requests -> GDPR),
- index.html gets a full document head, .htaccess adds HTTPS redirect, compression and caching,
- the privacy page describes the self-hosted fonts.

Usage: python3 deploy/build.py <npm_node_modules_dir>   (needs three@0.147.0 and @fontsource/* installed)
Output: deploy/dist/ and deploy/pixelwerkstatt-website.zip
"""
import re
import shutil
import sys
import zipfile
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent
OUT = SRC / "deploy" / "dist"
NM = Path(sys.argv[1])
CDN = "https://cdn.jsdelivr.net/npm/three@0.147.0/"

FONTS = {  # fontsource package -> weights (suffix "-italic" for italics)
    "bricolage-grotesque": ["600", "800"],
    "figtree": ["400", "500", "600"],
    "jetbrains-mono": ["500"],
    "bodoni-moda": ["400", "500", "400-italic"],
    "hanken-grotesk": ["300", "400", "600"],
    "ibm-plex-mono": ["400"],
}

HTACCESS = """# Pixelwerkstatt
AddDefaultCharset UTF-8
DirectoryIndex index.html

RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 30 days"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/javascript "access plus 7 days"
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType text/plain "access plus 7 days"
</IfModule>
AddType font/woff2 .woff2
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
"""

PRIVACY_FONTS = """<h2>Schriftarten</h2>
<p>Alle Schriftarten und Programmbibliotheken dieser Website werden direkt von unserem eigenen Server geladen. Es findet keine Verbindung zu Google oder anderen Drittanbietern statt.</p>

"""


def build_fonts():
    css, used = [], set()
    for pkg, weights in FONTS.items():
        for w in weights:
            for subset in ("latin", "latin-ext"):
                f = NM / "@fontsource" / pkg / f"{subset}-{w}.css"
                text = f.read_text()
                text = re.sub(r",\s*url\(\./files/[^)]+\.woff\) format\('woff'\)", "", text)
                for name in re.findall(r"url\(\./files/([^)]+\.woff2)\)", text):
                    used.add((pkg, name))
                css.append(text.replace("url(./files/", "url(fonts/"))
    (OUT / "assets" / "fonts").mkdir(parents=True, exist_ok=True)
    for pkg, name in used:
        shutil.copy(NM / "@fontsource" / pkg / "files" / name, OUT / "assets" / "fonts" / name)
    (OUT / "assets" / "fonts.css").write_text("\n".join(css))


def localise(html, prefix):
    """Swap Google Fonts and the three.js CDN for local copies; prefix = path back to the site root."""
    html = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>\n?', "", html)
    html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]+">',
                  f'<link rel="stylesheet" href="{prefix}assets/fonts.css">', html)
    for rel in re.findall(re.escape(CDN) + r'([^"]+)', html):
        dst = OUT / "vendor" / "three" / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(NM / "three" / rel, dst)
    return html.replace(CDN, f"{prefix}vendor/three/")


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    build_fonts()

    index = (SRC / "index.html").read_text()
    head = ('<!doctype html>\n<html lang="de">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n')
    (OUT / "index.html").write_text(head + localise(index, ""))

    for name in ("impressum.html", "datenschutz.html"):
        html = localise((SRC / name).read_text(), "")
        if name == "datenschutz.html":
            html = re.sub(r"<h2>Schriftarten \(Google Fonts\)</h2>.*?(?=<h2>)", PRIVACY_FONTS, html, flags=re.S)
        (OUT / name).write_text(html)

    shutil.copytree(SRC / "pw", OUT / "pw")
    lp = OUT / "landingpages"
    lp.mkdir()
    for f in (SRC / "landingpages").iterdir():
        if f.is_dir():
            shutil.copytree(f, lp / f.name)
        elif f.suffix == ".html":
            (lp / f.name).write_text(localise(f.read_text(), "../"))
        else:
            shutil.copy(f, lp / f.name)
    (OUT / ".htaccess").write_text(HTACCESS)

    leftovers = [str(p.relative_to(OUT)) for p in OUT.rglob("*.html") if "googleapis" in p.read_text() or "jsdelivr" in p.read_text()]
    assert not leftovers, leftovers

    zpath = SRC / "deploy" / "pixelwerkstatt-website.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(OUT.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(OUT))
    size = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"dist: {size / 1e6:.1f} MB, zip: {zpath.stat().st_size / 1e6:.1f} MB")


main()
