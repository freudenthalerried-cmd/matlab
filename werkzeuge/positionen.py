#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
positionen.py -- Rechnungspositionen aus den Poschacher-PDFs in eine CSV schreiben.

Grundlage ist pdftext.py: dessen Textstuecke tragen X/Y-Koordinaten, deshalb
werden die Spalten ueber X-Bereiche zugeordnet statt ueber Zeichenpositionen.
Der Betrag steht bei Positionen mit Gewichtsangabe eine Zeile tiefer; beide
Zeilen werden daher zusammen ausgewertet.

Zur Kontrolle wird die Summe der Positionsbetraege gegen den ausgewiesenen
Nettowarenwert geprueft und das Ergebnis je Rechnung ausgegeben.
"""
import csv, glob, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pdftext as P

# X-Bereiche der Spalten (Seitenkoordinaten in Punkt)
SPALTEN = [('pos', 55, 78), ('artnr', 78, 128), ('bezeichnung', 128, 320),
           ('menge', 320, 364), ('einheit', 364, 395), ('preis', 395, 445),
           ('rabatt', 445, 500), ('betrag', 500, 999)]


def zahl(t):
    """'1 934,42' / '‐ 32,00 %' -> float; None wenn keine Zahl."""
    t = (t.replace('‐', '-').replace('‑', '-').replace('‒', '-')
          .replace('–', '-').replace(' ', '').replace(' ', '')
          .replace('%', '').replace(' ', '').replace('.', '').replace(',', '.'))
    try:
        return float(t)
    except ValueError:
        return None


def seiten_stuecke(pfad):
    """Je Seite die Textstuecke (y, x, text, groesse) liefern."""
    pdf = open(pfad, 'rb').read()
    objs, streams = P.objekte_lesen(pdf)
    seiten = sorted(n for n, o in objs.items()
                    if b'/Type/Page' in o and b'/Type/Pages' not in o)
    for pnum in seiten:
        seite = objs[pnum]
        fonts = {}
        fm = re.search(rb'/Font\s*<<(.*?)>>', seite, re.S)
        if fm:
            for name, onum in re.findall(rb'/([^\s/]+)\s+(\d+)\s+\d+\s+R', fm.group(1)):
                m = re.search(rb'/ToUnicode\s+(\d+)', objs.get(int(onum), b''))
                fonts['/' + name.decode('latin1')] = (
                    P.cmap_lesen(P.stream_daten(int(m.group(1)), objs, streams))
                    if m else None)
        cm = re.search(rb'/Contents\s+(\d+)\s+\d+\s+R', seite)
        teile = [int(cm.group(1))] if cm else [
            int(x) for x in re.findall(
                rb'(\d+)\s+\d+\s+R',
                (re.search(rb'/Contents\s*\[(.*?)\]', seite, re.S) or
                 re.match(rb'', b'')).group(1))]
        inhalt = b'\n'.join(P.stream_daten(t, objs, streams)
                            for t in teile if t in streams)
        yield P.stuecke_sammeln(inhalt, fonts)


def zeilen(stuecke, toleranz=2.0):
    """Stuecke zu Zeilen gruppieren -> [(y, [(x, text), ...]), ...], von oben nach unten."""
    aus, akt, ref = [], [], None
    for y, x, t, g in sorted(stuecke, key=lambda a: (-a[0], a[1])):
        if ref is None or abs(y - ref) <= toleranz:
            akt.append((x, t))
            ref = y if ref is None else ref
        else:
            aus.append((ref, akt)); akt = [(x, t)]; ref = y
    if akt:
        aus.append((ref, akt))
    return aus


def felder(zeile):
    """Eine Zeile auf die Spalten verteilen."""
    d = {name: [] for name, _, _ in SPALTEN}
    for x, t in zeile:
        for name, a, b in SPALTEN:
            if a <= x < b:
                d[name].append(t)
                break
    return {k: ' '.join(v).strip() for k, v in d.items()}


def rechnung_lesen(pfad):
    """-> (rechnungsnummer, datum, positionen, nettowarenwert)"""
    nummer = datum = None
    netto = None
    positionen = []
    belegart = []
    for stuecke in seiten_stuecke(pfad):
        zs = zeilen(stuecke)
        for i, (y, z) in enumerate(zs):
            text = ' '.join(t for _, t in z)
            # In manchen PDFs ist jedes Zeichen ein eigenes Textstueck; deshalb
            # immer erst die Stuecke einer Spalte zusammenfuegen, dann auswerten.
            entfernt = text.replace(' ', '')
            if nummer is None:
                m = re.search(r'(?:Rechnung|Gutschrift)(\d{6,})', entfernt)
                if m:
                    nummer = m.group(1)
                    art = 'Gutschrift' if 'Gutschrift' in entfernt else 'Rechnung'
                    belegart.append(art)
            if datum is None:
                m = re.search(r'Datum:(\d{2}\.\d{2}\.\d{4})', entfernt)
                if m: datum = m.group(1)
            if 'Nettowarenwert' in entfernt:
                netto = zahl(felder(z)['betrag'])

            f = felder(z)
            # Positionszeile: linke Spalte ist eine reine Nummer und es gibt eine ArtNr
            if not re.fullmatch(r'\d{1,3}', f['pos'].replace(' ', '')) or not f['artnr']:
                continue
            betrag = zahl(f['betrag'])
            zusatz, bezeichnung = '', f['bezeichnung']
            # Bei mehrzeiligen Positionen steht der Betrag eine oder mehrere
            # Zeilen tiefer; bis zur naechsten Position bzw. zum Summenblock suchen.
            j, vor_y = i + 1, y
            while j < len(zs) and j <= i + 4:
                gy, gz = zs[j]
                # Folgezeilen einer Position stehen direkt darunter; ein groesserer
                # Sprung bedeutet Fusszeile oder naechster Block -> abbrechen.
                if vor_y - gy > 20:
                    break
                vor_y = gy
                g = felder(gz)
                gtext = ' '.join(t for _, t in gz).replace(' ', '')
                if (re.fullmatch(r'\d{1,3}', g['pos'].replace(' ', '')) and g['artnr']) \
                        or 'Nettowarenwert' in gtext or 'Lieferschein' in gtext:
                    break
                if betrag is None:
                    betrag = zahl(g['betrag'])
                if g['preis'] and zahl(g['preis']) is None:
                    zusatz = g['preis']                      # z.B. 'per 1000'
                if g['bezeichnung'] and 'Positionsgewicht' not in g['bezeichnung']:
                    bezeichnung += ' / ' + g['bezeichnung']
                j += 1
            positionen.append({
                'Rechnung': nummer, 'Datum': datum, 'Pos': f['pos'].replace(' ', ''),
                'ArtNr': f['artnr'].replace(' ', ''), 'Bezeichnung': bezeichnung,
                'Menge': zahl(f['menge']), 'Einheit': f['einheit'].replace(' ', ''),
                'Einzelpreis': zahl(f['preis']),
                'Preisbasis': zusatz, 'RabattProzent': zahl(f['rabatt']),
                'Betrag': betrag})
    for p in positionen:
        p['Rechnung'] = nummer
        p['Datum'] = datum
        p['Belegart'] = belegart[0] if belegart else ''
    return nummer, datum, positionen, netto


def main(ordner, ziel):
    reihen = []
    print('%-12s %4s Pos.  %12s %12s  %s' %
          ('Rechnung', '', 'Summe', 'Nettowert', 'Kontrolle'))
    for pfad in sorted(glob.glob(os.path.join(ordner, 'Rechnung*.pdf'))):
        nummer, datum, pos, netto = rechnung_lesen(pfad)
        summe = round(sum(p['Betrag'] for p in pos if p['Betrag'] is not None), 2)
        ok = ('OK' if netto is not None and abs(summe - netto) < 0.005
              else 'ABWEICHUNG')
        print('%-12s %4d Pos.  %12.2f %12s  %s' %
              (nummer, len(pos), summe,
               ('%.2f' % netto) if netto is not None else '?', ok))
        reihen += pos
    with open(ziel, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(reihen[0].keys()), delimiter=';')
        w.writeheader()
        w.writerows(reihen)
    print('\n%d Positionen aus %d Rechnungen -> %s' %
          (len(reihen), len(glob.glob(os.path.join(ordner, 'Rechnung*.pdf'))), ziel))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
