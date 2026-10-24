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
    'crazygames': dict(sdk='<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n',
                       cfg="window.BW_CONFIG={ads:'crazygames'};"),
    'web': dict(sdk='', cfg=(OUT / 'web-config.js').read_text() if (OUT / 'web-config.js').exists() else "window.BW_CONFIG={ads:'none'};"),
}
final = (OUT / 'burgwacht.html').read_text()
assert FONT_LINKS in final and THREE in final
for name, d in DIST.items():
    target = OUT / 'dist' / name
    if target.exists():
        shutil.rmtree(target)
    (target / 'fonts').mkdir(parents=True)
    html = final.replace(FONT_LINKS, LOCAL_FONTS).replace(THREE, d['sdk'] + '<script src="three.min.js"></script>')
    html = html.replace('<script>\nwindow.R3D=', '<script>\n' + d['cfg'] + '\nwindow.R3D=', 1)
    (target / 'index.html').write_text(html)
    shutil.copy(VENDOR / 'three.min.js', target)
    shutil.copy(VENDOR / 'three-LICENSE.txt', target)
    for f in (VENDOR / 'fonts').iterdir():
        shutil.copy(f, target / 'fonts')
    zpath = OUT / 'dist' / f'burgwacht-{name}.zip'
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(target.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(target))
    print('dist', name, zpath.stat().st_size)
