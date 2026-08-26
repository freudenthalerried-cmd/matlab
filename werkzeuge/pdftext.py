#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
pdftext.py -- Textextraktion aus PDFs mit Font-Subsets (Identity-H) ohne Fremdbibliotheken.

Vorgehen:
 1. Alle Objekte aus dem PDF lesen (auch aus Objekt-Stroemen /ObjStm).
 2. Seitenbaum aufloesen, je Seite die Font-Ressourcen (/F0.. -> Fontobjekt) sammeln.
 3. Zu jedem Font die /ToUnicode-CMap dekomprimieren und in eine
    Glyphcode -> Unicode-Tabelle uebersetzen (beginbfchar / beginbfrange).
 4. Den Inhaltsstrom der Seite tokenisieren, Textmatrix mitfuehren und
    fuer jedes Textstueck (Tj/TJ/'/") Position und entschluesselten Text merken.
 5. Textstuecke nach Y-Position zu Zeilen gruppieren, nach X sortieren und
    Spaltenabstaende in Leerzeichen umrechnen -> layouterhaltender Text.

Aufruf:  python3 pdftext.py datei.pdf [ausgabe.txt]
"""
import re, sys, zlib


# ---------------------------------------------------------------- Objektzugriff

def flate(raw, parms):
    """FlateDecode inkl. optionalem PNG-Predictor."""
    data = zlib.decompress(raw)
    pred = 0
    cols = 1
    if parms:
        m = re.search(rb'/Predictor\s+(\d+)', parms)
        if m: pred = int(m.group(1))
        m = re.search(rb'/Columns\s+(\d+)', parms)
        if m: cols = int(m.group(1))
    if pred < 10:
        return data
    # PNG-Predictor rueckgaengig machen
    rowlen = cols + 1
    out = bytearray()
    prev = bytearray(cols)
    for i in range(0, len(data), rowlen):
        ft = data[i]
        row = bytearray(data[i + 1:i + rowlen])
        if ft == 2:                      # Up
            for j in range(len(row)):
                row[j] = (row[j] + prev[j]) & 0xFF
        out += row
        prev = row
    return bytes(out)


def objekte_lesen(pdf):
    """Liefert {objektnummer: rohbytes} fuer direkte Objekte und Objektstrom-Objekte."""
    objs = {}
    streams = {}
    for m in re.finditer(rb'(?<![0-9])(\d+)\s+(\d+)\s+obj\b', pdf):
        num = int(m.group(1))
        start = m.end()
        end = pdf.find(b'endobj', start)
        body = pdf[start:end]
        si = body.find(b'stream')
        if si < 0:
            objs[num] = body.strip()
            continue
        d = body[:si]
        s = si + 6
        if body[s:s + 2] == b'\r\n':
            s += 2
        elif body[s:s + 1] in (b'\n', b'\r'):
            s += 1
        se = body.rfind(b'endstream')
        objs[num] = d.strip()
        streams[num] = (d, body[s:se])

    # Objektstroeme auspacken
    for num, (d, raw) in list(streams.items()):
        if b'/ObjStm' not in d:
            continue
        pm = re.search(rb'/DecodeParms\s*(<<.*?>>)', d, re.S)
        data = flate(raw, pm.group(1) if pm else None)
        n = int(re.search(rb'/N\s+(\d+)', d).group(1))
        first = int(re.search(rb'/First\s+(\d+)', d).group(1))
        kopf = data[:first].split()
        for i in range(n):
            onum = int(kopf[2 * i])
            off = int(kopf[2 * i + 1])
            ende = int(kopf[2 * i + 3]) + first if i + 1 < n else len(data)
            objs[onum] = data[first + off:ende].strip()
    return objs, streams


def stream_daten(num, objs, streams):
    """Dekomprimierter Inhalt eines Stream-Objekts."""
    d, raw = streams[num]
    if b'FlateDecode' in d:
        pm = re.search(rb'/DecodeParms\s*(<<.*?>>)', d, re.S)
        return flate(raw, pm.group(1) if pm else None)
    return raw


# ---------------------------------------------------------------- ToUnicode-CMap

def cmap_lesen(text):
    """CMap-Text -> {glyphcode: unicodestring}."""
    tab = {}
    for blk in re.findall(rb'beginbfchar(.*?)endbfchar', text, re.S):
        for src, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            tab[int(src, 16)] = hex_zu_text(dst)
    for blk in re.findall(rb'beginbfrange(.*?)endbfrange', text, re.S):
        # Form 1: <lo> <hi> <startziel>
        for lo, hi, dst in re.findall(
                rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk):
            a, b = int(lo, 16), int(hi, 16)
            basis = int(dst, 16)
            for k in range(a, b + 1):
                tab[k] = chr(basis + (k - a))
        # Form 2: <lo> <hi> [ <z1> <z2> ... ]
        for lo, hi, arr in re.findall(
                rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*?)\]', blk, re.S):
            a = int(lo, 16)
            for i, dst in enumerate(re.findall(rb'<([0-9A-Fa-f]+)>', arr)):
                tab[a + i] = hex_zu_text(dst)
    return tab


def hex_zu_text(h):
    """UTF-16BE-Hexfolge -> Zeichenkette."""
    b = bytes.fromhex(h.decode() if isinstance(h, bytes) else h)
    if len(b) % 2:
        b = b'\x00' + b
    try:
        return b.decode('utf-16-be')
    except Exception:
        return ''


# ---------------------------------------------------------------- Inhaltsstrom

WS = b'\x00\t\n\x0c\r '
TRENNER = WS + b'()<>[]{}/%'


def tokens(buf):
    """PDF-Inhaltsstrom zeichenweise zerlegen.

    Wichtig: Glyphcodes koennen beliebige Bytes enthalten, auch '[' , ']' oder
    Klammern. Ein Regex ueber den ganzen Strom verliert dadurch Text, deshalb
    wird hier von Hand getrennt. Rueckgabe je Token: (art, wert) mit den Arten
    'str', 'num', 'name', 'op' sowie den Markierungen '[' und ']'.
    """
    i, n = 0, len(buf)
    while i < n:
        c = buf[i:i + 1]
        if c in WS:
            i += 1
        elif c == b'%':                              # Kommentar
            while i < n and buf[i:i + 1] not in b'\r\n':
                i += 1
        elif c == b'(':                              # Literalstring
            i += 1
            tiefe, roh = 1, bytearray()
            while i < n:
                ch = buf[i:i + 1]
                if ch == b'\\':
                    roh += buf[i:i + 2]; i += 2; continue
                if ch == b'(':
                    tiefe += 1
                elif ch == b')':
                    tiefe -= 1
                    if tiefe == 0:
                        i += 1; break
                roh += ch; i += 1
            yield ('str', literal_bytes(bytes(roh)))
        elif c == b'<':
            if buf[i + 1:i + 2] == b'<':             # Dictionary
                start = i
                tiefe, i = 1, i + 2
                while i < n and tiefe:
                    if buf[i:i + 2] == b'<<': tiefe += 1; i += 2
                    elif buf[i:i + 2] == b'>>': tiefe -= 1; i += 2
                    elif buf[i:i + 1] == b'(':       # String im Dict ueberspringen
                        i += 1; t = 1
                        while i < n and t:
                            if buf[i:i + 1] == b'\\': i += 2; continue
                            if buf[i:i + 1] == b'(': t += 1
                            elif buf[i:i + 1] == b')': t -= 1
                            i += 1
                    else: i += 1
                yield ('dict', buf[start:i])
            else:                                    # Hexstring
                e = buf.find(b'>', i)
                h = re.sub(rb'[^0-9A-Fa-f]', b'', buf[i + 1:e])
                if len(h) % 2: h += b'0'
                i = e + 1
                yield ('str', bytes.fromhex(h.decode()))
        elif c == b'/':
            j = i + 1
            while j < n and buf[j:j + 1] not in TRENNER:
                j += 1
            yield ('name', '/' + buf[i + 1:j].decode('latin1'))
            i = j
        elif c in b'[]':
            i += 1
            yield (c.decode(), None)
        elif c in b'{}':
            i += 1
        elif c in b'+-.0123456789':
            j = i
            while j < n and buf[j:j + 1] in b'+-.0123456789eE':
                j += 1
            try:
                yield ('num', float(buf[i:j]))
            except ValueError:
                pass
            i = j
        else:
            j = i
            while j < n and buf[j:j + 1] not in TRENNER:
                j += 1
            if j == i:
                j = i + 1
            yield ('op', buf[i:j].decode('latin1'))
            i = j


def entschluesseln(roh, tab):
    """Bytefolge eines Textstuecks -> lesbarer Text (2-Byte-Codes, Identity-H)."""
    aus = []
    for i in range(0, len(roh) - 1, 2):
        code = (roh[i] << 8) | roh[i + 1]
        z = tab.get(code) if tab else chr(code)
        # Codes ohne ToUnicode-Eintrag und Zeichen aus dem privaten
        # Unicode-Bereich sind nicht eindeutig aufloesbar (Subset-Ligaturen);
        # sie werden bewusst als U+FFFD markiert statt geraten.
        if z is None or (z and 0xE000 <= ord(z[0]) <= 0xF8FF):
            z = '\ufffd'
        aus.append(z)
    return ''.join(aus)


def pua_markieren(t):
    return ''.join('\ufffd' if 0xE000 <= ord(c) <= 0xF8FF else c for c in t)


def literal_bytes(s):
    """PDF-Literalstring entschaerfen (Escapes aufloesen)."""
    out = bytearray()
    i = 0
    esc = {b'n': 10, b'r': 13, b't': 9, b'b': 8, b'f': 12,
           b'(': 40, b')': 41, b'\\': 92}
    while i < len(s):
        c = s[i:i + 1]
        if c == b'\\':
            nx = s[i + 1:i + 2]
            if nx in esc:
                out.append(esc[nx]); i += 2
            elif nx.isdigit():
                okt = s[i + 1:i + 4]
                j = 0
                while j < 3 and okt[j:j + 1].isdigit():
                    j += 1
                out.append(int(okt[:j], 8) & 0xFF); i += 1 + j
            elif nx in (b'\n', b'\r'):
                i += 2
            else:
                out += nx; i += 2
        else:
            out += c; i += 1
    return bytes(out)


def actualtext(rohdict):
    """/ActualText aus einem BDC-Dictionary lesen (Ersatztext des Autors)."""
    m = re.search(rb'/ActualText\s*\(', rohdict)
    if not m:
        return None
    i, tiefe, roh = m.end(), 1, bytearray()
    while i < len(rohdict) and tiefe:
        c = rohdict[i:i + 1]
        if c == b'\\':
            roh += rohdict[i:i + 2]; i += 2; continue
        if c == b'(': tiefe += 1
        elif c == b')':
            tiefe -= 1
            if not tiefe: break
        roh += c; i += 1
    b = literal_bytes(bytes(roh))
    if b[:2] == b'\xfe\xff':
        try:
            return pua_markieren(b[2:].decode('utf-16-be'))
        except Exception:
            return None
    return pua_markieren(b.decode('latin1'))


def mul(a, b):
    return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3],
            a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3],
            a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]]


def stuecke_sammeln(inhalt, fonts):
    """Inhaltsstrom auswerten -> Liste (y, x, text, schriftgroesse)."""
    stuecke = []
    stapel = []
    ctm = [1, 0, 0, 1, 0, 0]          # aktuelle Transformationsmatrix (cm)
    tm = tlm = [1, 0, 0, 1, 0, 0]     # Text- und Zeilenmatrix
    tab = None
    groesse = 10.0
    zeilenabst = 0.0
    ops = []                          # Operandenstapel
    arr = None                        # laufendes Array (fuer TJ)
    ersatz = [None]                   # /ActualText des laufenden BDC-Spans

    def ablegen(text):
        # Glyphen ohne ToUnicode-Eintrag notfalls aus /ActualText ersetzen
        if '\ufffd' in text and ersatz[0]:
            text, ersatz[0] = ersatz[0], None
        # Textposition erst durch die CTM schicken -> echte Seitenkoordinaten
        if text.strip():
            g = mul(tm, ctm)
            stuecke.append((round(g[5], 1), round(g[4], 1), text,
                            abs(groesse * g[3]) or groesse))

    def zahl(k):
        return [float(v) for v in ops[-k:]]

    for art, wert in tokens(inhalt):
        if art == '[':
            arr = []
            continue
        if art == ']':
            ops.append(arr if arr is not None else [])
            arr = None
            continue
        if art in ('str', 'num', 'name', 'dict'):
            (arr if arr is not None else ops).append(wert)
            continue
        if art != 'op':
            continue
        op = wert
        try:
            if op == 'BT':
                tm = tlm = [1, 0, 0, 1, 0, 0]
            elif op == 'Tf' and len(ops) >= 2:
                tab = fonts.get(ops[-2])
                groesse = float(ops[-1])
            elif op == 'Tm' and len(ops) >= 6:
                tm = tlm = zahl(6)
            elif op in ('Td', 'TD') and len(ops) >= 2:
                if op == 'TD':
                    zeilenabst = -float(ops[-1])
                tlm = mul([1, 0, 0, 1, float(ops[-2]), float(ops[-1])], tlm)
                tm = tlm[:]
            elif op == 'TL' and ops:
                zeilenabst = float(ops[-1])
            elif op == 'T*':
                tlm = mul([1, 0, 0, 1, 0, -zeilenabst], tlm)
                tm = tlm[:]
            elif op == 'Tj' and ops:
                ablegen(entschluesseln(ops[-1], tab))
            elif op in ("'", '"') and ops:
                tlm = mul([1, 0, 0, 1, 0, -zeilenabst], tlm)
                tm = tlm[:]
                ablegen(entschluesseln(ops[-1], tab))
            elif op == 'TJ' and ops and isinstance(ops[-1], list):
                text = []
                for teil in ops[-1]:
                    if isinstance(teil, bytes):
                        text.append(entschluesseln(teil, tab))
                    elif isinstance(teil, float):
                        # negative Werte ruecken weiter; grosse Luecken = Leerzeichen
                        if -teil / 1000.0 * groesse > groesse * 0.18:
                            text.append(' ')
                ablegen(''.join(text))
            elif op == 'BDC':
                ersatz[0] = None
                for o in ops:
                    if isinstance(o, bytes) and b'/ActualText' in o:
                        ersatz[0] = actualtext(o)
            elif op == 'EMC':
                ersatz[0] = None
            elif op == 'cm' and len(ops) >= 6:
                ctm = mul(zahl(6), ctm)
            elif op == 'q':
                stapel.append(ctm[:])
            elif op == 'Q' and stapel:
                ctm = stapel.pop()
        except Exception:
            pass
        ops = []
    return stuecke


def zeilen_bauen(stuecke, breite_zeichen=4.8, toleranz=2.5):
    """Textstuecke nach Y gruppieren, nach X sortieren, Abstaende auffuellen."""
    stuecke = sorted(stuecke, key=lambda t: (-t[0], t[1]))
    zeilen = []
    aktuell = []
    letztes_y = None
    for y, x, txt, gr in stuecke:
        if letztes_y is None or abs(y - letztes_y) <= toleranz:
            aktuell.append((x, txt))
            letztes_y = y if letztes_y is None else letztes_y
        else:
            zeilen.append((letztes_y, aktuell))
            aktuell = [(x, txt)]
            letztes_y = y
    if aktuell:
        zeilen.append((letztes_y, aktuell))

    aus = []
    vor_y = None
    for y, teile in zeilen:
        if vor_y is not None and vor_y - y > 18:
            aus.append('')
        vor_y = y
        zeile = ''
        for x, txt in sorted(teile):
            spalte = int(round(x / breite_zeichen))
            if spalte > len(zeile):
                zeile += ' ' * (spalte - len(zeile))
            elif zeile and not zeile.endswith(' '):
                zeile += ' '
            zeile += txt
        aus.append(zeile.rstrip())
    return '\n'.join(aus)


def pdf_zu_text(pfad):
    pdf = open(pfad, 'rb').read()
    objs, streams = objekte_lesen(pdf)

    def ref(txt, feld):
        m = re.search((r'/%s\s+(\d+)\s+\d+\s+R' % feld).encode(), txt)
        return int(m.group(1)) if m else None

    # Seiten einsammeln.
    #
    # Nicht per Substring: PDF-Erzeuger setzen Leerraum unterschiedlich.
    # Poschacher schreibt "/Type/Page", Pramer "/Type /Page". Ein Vergleich
    # auf b'/Type/Page' fand bei Pramer null Seiten und lieferte eine leere
    # Datei -- ohne Fehlermeldung, was schlimmer ist als ein Absturz.
    # /Type/Pages ist der Seitenbaum und darf nicht mitgezaehlt werden,
    # deshalb der negative Lookahead auf das "s".
    SEITE = re.compile(rb'/Type\s*/Page(?![a-zA-Z])')
    seiten = [n for n, o in objs.items() if SEITE.search(o)]
    seiten.sort()

    alles = []
    for si, pnum in enumerate(seiten, 1):
        seite = objs[pnum]
        # Font-Ressourcen
        fonts = {}
        # Auch hier leerraumtolerant, und die Ressourcen koennen als eigenes
        # Objekt referenziert sein statt eingebettet -- Pramer macht das.
        res = seite
        rm = re.search(rb'/Resources\s+(\d+)\s+\d+\s+R', seite)
        if rm:
            res = objs.get(int(rm.group(1)), seite)
        fm = re.search(rb'/Font\s*<<(.*?)>>', res, re.S)
        if fm:
            for name, onum in re.findall(rb'/([^\s/]+)\s+(\d+)\s+\d+\s+R', fm.group(1)):
                fobj = objs.get(int(onum), b'')
                tu = ref(fobj, 'ToUnicode')
                tab = cmap_lesen(stream_daten(tu, objs, streams)) if tu in streams else None
                fonts['/' + name.decode('latin1')] = tab
        # Inhalt
        teile = []
        cm = re.search(rb'/Contents\s+(\d+)\s+\d+\s+R', seite)
        if cm:
            teile = [int(cm.group(1))]
        else:
            am = re.search(rb'/Contents\s*\[(.*?)\]', seite, re.S)
            if am:
                teile = [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', am.group(1))]
        inhalt = b'\n'.join(stream_daten(t, objs, streams) for t in teile if t in streams)
        if len(seiten) > 1:
            alles.append('--- Seite %d ---' % si)
        alles.append(zeilen_bauen(stuecke_sammeln(inhalt, fonts)))
    return '\n'.join(alles)


if __name__ == '__main__':
    txt = pdf_zu_text(sys.argv[1])
    if len(sys.argv) > 2:
        open(sys.argv[2], 'w', encoding='utf-8').write(txt)
        print('geschrieben:', sys.argv[2])
    else:
        print(txt)
