#!/usr/bin/env python3
"""Baut die Burgwacht-Varianten aus src/ zu eigenständigen HTML-Dateien."""
import pathlib
SRC = pathlib.Path(__file__).parent / 'src'
OUT = pathlib.Path(__file__).parent
THREE = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
VARIANTS = {
    'v1-klassik-hd.html': dict(title='Burgwacht Klassik HD', libs='', theme='', pre='', renderer='r2d.js'),
    'v2-3d-welt.html': dict(title='Burgwacht 3D-Welt', libs=THREE, theme='',
                            pre="window.R3D={theme:'summer',ortho:false,toon:false};", renderer='r3d.js'),
    'v3-winter-insel.html': dict(title='Burgwacht Winter-Insel', libs=THREE, theme=(SRC / 'winter.css').read_text(),
                                 pre="window.R3D={theme:'winter',ortho:true,toon:true};", renderer='r3d.js'),
    'v4-3d-held.html': dict(title='Burgwacht Held', libs=THREE, theme=(SRC / 'features.css').read_text(),
                            pre="window.R3D={theme:'summer'};window.FEAT={hero:1};", renderer='r3d.js'),
    'v5-3d-kaserne.html': dict(title='Burgwacht Kaserne', libs=THREE, theme=(SRC / 'features.css').read_text(),
                               pre="window.R3D={theme:'summer'};window.FEAT={barracks:1};", renderer='r3d.js'),
    'burgwacht.html': dict(title='Burgwacht', libs=THREE, theme=(SRC / 'features.css').read_text(),
                           pre="window.R3D={theme:'summer'};window.FEAT={hero:1,barracks:1,campaign:1};", renderer='r3d.js'),
    'v6-3d-kampagne.html': dict(title='Burgwacht Kampagne', libs=THREE, theme=(SRC / 'features.css').read_text(),
                                pre="window.R3D={theme:'summer'};window.FEAT={campaign:1};", renderer='r3d.js'),
}
shell = (SRC / 'shell.html').read_text()
core = (SRC / 'core.js').read_text()
for name, v in VARIANTS.items():
    js = ("<script>\n" + v['pre'] + "\n" + (SRC / 'i18n.js').read_text() + "\n" + core + "\n" + (SRC / 'meta.js').read_text()
          + "\n" + (SRC / v['renderer']).read_text() + "\nboot();\n</script>")
    html = (shell.replace('{{TITLE}}', v['title']).replace('{{LIBS}}', v['libs'])
            .replace('{{THEME_CSS}}', v['theme']).replace('{{SCRIPTS}}', js))
    (OUT / name).write_text(html)
    print(name, len(html))

# ---------- Upload-Pakete ----------
import shutil, zipfile
FONT_LINKS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
              '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
              '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap">')
LOCAL_FONTS = ('<style>' + ''.join(
    f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url(fonts/{f}) format('woff2')}}"
    for fam, w, f in [('Lilita One', 400, 'lilita-one-latin-400-normal.woff2'), ('Nunito', 700, 'nunito-latin-700-normal.woff2'),
                      ('Nunito', 800, 'nunito-latin-800-normal.woff2'), ('Nunito', 900, 'nunito-latin-900-normal.woff2')]) + '</style>')
VENDOR = OUT / 'vendor'
DIST = {
    'crazygames': dict(sdk='<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n', cfg='CG'),
    'web': dict(sdk='', cfg=None),
}
# Angaben für Rechtstexte und Königspaket
import json, hashlib, secrets, datetime
PUB = OUT / 'publish'
ANG = json.loads((PUB / 'angaben.json').read_text())
code_file = PUB / '.premium-code'
if not code_file.exists() and ANG.get('CODE_HASH'):
    code_file = None  # Code liegt nur beim Betreiber; der gespeicherte Hash bleibt gültig
if code_file and not code_file.exists():
    alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    code_file.write_text('-'.join(''.join(secrets.choice(alpha) for _ in range(4)) for _ in range(3)))
CODE = code_file.read_text().strip() if code_file else None
if CODE:
  (PUB / 'Koenigspaket-Code.txt').write_text(
    'Danke für deinen Kauf! / Thank you for your purchase!\n\n'
    f'Dein Code / Your code:  {CODE}\n\n'
    'Im Spiel: Shop > Code eingeben.  In game: Shop > Enter code.\n')
CODE_HASH = hashlib.sha256(CODE.upper().encode()).hexdigest() if CODE else ANG['CODE_HASH']
if ANG.get('CODE_HASH') != CODE_HASH:
    ANG['CODE_HASH'] = CODE_HASH
    (PUB / 'angaben.json').write_text(json.dumps(ANG, ensure_ascii=False, indent=2) + '\n')
BOARD = json.dumps({'url': ANG['SUPABASE_URL'], 'key': ANG['SUPABASE_ANON_KEY']}) if ANG.get('SUPABASE_URL') and ANG.get('SUPABASE_ANON_KEY') else 'null'
WEB_CFG = ("window.BW_CONFIG={ads:'none',legal:true,board:" + BOARD + ",premiumUrl:" + json.dumps(ANG.get('KAUF_URL', '')) +
           ",premiumPrice:" + json.dumps(ANG.get('PREIS', '2,99 €')) + ",premiumCode:'" + CODE_HASH + "'};\n")
DIST['crazygames']['cfg'] = "window.BW_CONFIG={ads:'crazygames',board:" + BOARD + "};"
missing = [k for k in ('NAME', 'ADRESSE', 'EMAIL') if ANG[k].startswith('[')]
if missing:
    print('HINWEIS: in publish/angaben.json fehlen noch:', ', '.join(missing))
final = (OUT / 'burgwacht.html').read_text()
assert FONT_LINKS in final and THREE in final
DIST['android'] = dict(sdk='', cfg="window.BW_CONFIG={ads:'native',legal:true,board:" + BOARD + "};")
APP_TEXT = ('<h2>Werbung in der App (Google AdMob)</h2><p>Die Android-App zeigt Werbung über Google AdMob (Google Ireland Limited, Gordon House, '
            'Barrow Street, Dublin 4, Irland). Beim ersten Start fragt dich die App, ob personalisierte Werbung erlaubt ist; du kannst die Auswahl in den '
            'Einstellungen jederzeit ändern. Dabei können Geräte-Kennungen, ungefährer Standort und Nutzungsdaten verarbeitet werden. Rechtsgrundlage ist '
            'deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) bzw. bei nicht personalisierter Werbung unser berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). '
            'Details: policies.google.com/privacy</p><h2>Käufe in der App (Google Play)</h2><p>Das Königspaket wird über Google Play Billing verkauft. '
            'Die Zahlung wickelt Google ab; wir erhalten keine Zahlungsdaten, nur die Bestätigung des Kaufs.</p>')
def render_legal(target, app):
    page = (SRC / 'legal' / '_page.html').read_text()
    rep = dict(ANG, DATUM=datetime.date.today().strftime('%d.%m.%Y'),
               UID=f"<h2>UID-Nummer</h2><p>{ANG['UID']}</p>" if ANG.get('UID') else '',
               HOSTER='Google Play (Google Ireland Limited)' if app else ANG['HOSTER'],
               SHOP='Google Play' if app else ANG['SHOP'],
               TRACKING_TEXT='' if app else '<p>Das Spiel verwendet keine Cookies, kein Tracking, keine Analyse-Werkzeuge und keine Werbung.</p>',
               APP_TEXT=APP_TEXT if app else '',
               BOARD_TEXT=('<h2>Bestenliste</h2><p>Wenn du dich nach einer Runde im Endlos-Modus in die Bestenliste einträgst, speichern wir den von dir gewählten '
                           'Spielernamen, die erreichte Welle, die Karte und den Zeitpunkt in einer Datenbank bei Supabase Inc. (Rechenzentrum in der EU). '
                           'Rechtsgrundlage ist deine Einwilligung durch das Eintragen (Art. 6 Abs. 1 lit. a DSGVO). Die Einträge sind für alle Spieler sichtbar. '
                           'Möchtest du einen Eintrag löschen lassen, schreib an ' + ANG['EMAIL'] + '.</p>') if BOARD != 'null' else '')
    for f, title in [('impressum', 'Impressum'), ('datenschutz', 'Datenschutz'), ('kaufbedingungen', 'Kaufbedingungen')]:
        out = page.replace('{{TITLE}}', title).replace('{{BODY}}', (SRC / 'legal' / f'{f}.html').read_text())
        for k, v in rep.items():
            out = out.replace('{{' + k + '}}', str(v))
        (target / f'{f}.html').write_text(out)
for name, d in DIST.items():
    target = OUT / 'dist' / name
    if target.exists():
        shutil.rmtree(target)
    (target / 'fonts').mkdir(parents=True)
    html = final.replace(FONT_LINKS, LOCAL_FONTS).replace(THREE, d['sdk'] + '<script src="three.min.js"></script>')
    if d['cfg']:
        html = html.replace('<script>\nwindow.R3D=', '<script>\n' + d['cfg'] + '\nwindow.R3D=', 1)
    else:
        html = html.replace('<script>\nwindow.R3D=', '<script src="config.js"></script>\n<script>\nwindow.R3D=', 1)
        (target / 'config.js').write_text(WEB_CFG)
    if name != 'crazygames':
        render_legal(target, name == 'android')
    (target / 'index.html').write_text(html)
    shutil.copy(VENDOR / 'three.min.js', target)
    shutil.copy(VENDOR / 'three-LICENSE.txt', target)
    for f in (VENDOR / 'fonts').iterdir():
        shutil.copy(f, target / 'fonts')
    if name == 'android':
        print('dist android (Assets für die App)')
        continue
    zpath = OUT / 'dist' / f'burgwacht-{name}.zip'
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(target.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(target))
    print('dist', name, zpath.stat().st_size)

# ---------- Pressemappe ----------
PK = OUT / 'dist' / 'presskit'
if PK.exists():
    shutil.rmtree(PK)
PK.mkdir(parents=True)
imgs = sorted((OUT / 'dist' / 'assets').glob('*.png'))
for f in imgs:
    shutil.copy(f, PK)
trailer = OUT / 'dist' / 'marketing' / 'trailer-en-1280x720.mp4'
if trailer.exists():
    shutil.copy(trailer, PK)
pk = (SRC / 'presskit.html').read_text()
play = ANG.get('PLAY_URL', '')
for k, v in {'NAME': ANG['NAME'], 'EMAIL': ANG['EMAIL'], 'RELEASE': ANG.get('RELEASE', '2026'),
             'PLAY': play or '#', 'PLAY_LABEL': play.replace('https://', '') if play else 'coming soon',
             'IMAGES': ''.join(f'<a href="{f.name}"><img src="{f.name}" alt="Burgwacht screenshot" loading="lazy"></a>' for f in imgs)}.items():
    pk = pk.replace('{{' + k + '}}', v)
(PK / 'index.html').write_text(pk)
print('presskit', len(imgs), 'Bilder')
