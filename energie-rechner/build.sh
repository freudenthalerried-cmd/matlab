#!/bin/sh
# Baut index.html aus src.html (Kopfteil bis zum ersten <header>, Rest in den body)
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
src=open("src.html",encoding="utf-8").read()
i=src.index('<header class="top">')
out=('<!doctype html>\n<html lang="de-AT">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
     + src[:i].rstrip() + '\n</head>\n<body>\n' + src[i:].rstrip() + '\n</body>\n</html>\n')
open("index.html","w",encoding="utf-8").write(out)
PY
