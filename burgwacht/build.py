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
}
shell = (SRC / 'shell.html').read_text()
core = (SRC / 'core.js').read_text()
for name, v in VARIANTS.items():
    js = "<script>\n" + v['pre'] + "\n" + core + "\n" + (SRC / v['renderer']).read_text() + "\nboot();\n</script>"
    html = (shell.replace('{{TITLE}}', v['title']).replace('{{LIBS}}', v['libs'])
            .replace('{{THEME_CSS}}', v['theme']).replace('{{SCRIPTS}}', js))
    (OUT / name).write_text(html)
    print(name, len(html))
