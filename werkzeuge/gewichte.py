#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gewichte.py -- Positionsgewichte aus den Poschacher-Rechnungen auslesen.

Die Rechnungen fuehren unter jeder Position eine Zeile "Positionsgewicht:
X Kg" und am Ende "Gesamtgewicht: Y Kg". Das ist die Bezugsgroesse, die dem
Katalog fehlt: ohne Gewicht laesst sich nicht sagen, ob ein Artikel per Paket
versendbar waere.

Der Grundsatz ist derselbe wie bei positionen.py:

    Keine Zahl ohne bestandene Summenprobe.

Je Beleg wird die Summe der Positionsgewichte gegen das ausgewiesene
Gesamtgewicht gehalten. Nur Belege ohne Rest liefern Artikelgewichte; alle
anderen werden mit ihrem Rest ausgewiesen und NICHT verwendet. Ein Gewicht,
dessen Gegenrechnung nicht aufgeht, ist eine Vermutung mit zwei Stellen
hinter dem Komma.

    GEWICHT_PDFS=<ordner mit den Rechnungs-PDFs> python3 gewichte.py [ziel.json]
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pdftext as P

QUELLE = os.environ.get('GEWICHT_PDFS')

# Bindestriche kommen in den PDFs als U+2010/2011/2012/2013 vor.
STRICHE = str.maketrans({'‐': '-', '‑': '-', '‒': '-', '–': '-'})


def zahl(t):
    """'1 254,40' -> 1254.4 ; '‐ 20,00' -> -20.0 ; None wenn keine Zahl."""
    t = (t or '').translate(STRICHE).replace(' ', '').replace(' ', '')
    t = t.replace(' ', '').replace('.', '').replace(',', '.')
    try:
        return float(t)
    except ValueError:
        return None


# "  1  21382  Bezeichnung   60,00 M2 ..."  -- Positionsnummer, Artikelnummer,
# Bezeichnung, Menge, Einheit. Die Einheitenliste ist bewusst geschlossen: ein
# offenes \w+ fing Woerter aus der Bezeichnung.
EINHEITEN = 'STK|M2|M3|SCK|KG|DOS|RLL|LFM|KRT|EIM|TO|PAU|SET|PAK'
POSITION = re.compile(
    r'^\s*(\d{1,3})\s+(\d{4,6})\s+(.+?)\s+([\d\s.,]+?)\s+(' + EINHEITEN + r')\b')
GEWICHT = re.compile(r'Positionsgewicht:\s*([\d\s., ]+?)\s*Kg')
GESAMT = re.compile(r'Gesamtgewicht:\s*([\d\s., ]+?)\s*Kg')
BELEGNR = re.compile(r'Rechnung\s+(\d{9})')

# Positionen, die keine Ware sind. Sie tragen Gewicht (eine Palette wiegt),
# gehoeren aber nicht in den Artikelkatalog.
KEINE_WARE = {
    '53265': 'Frachtpauschale Lager',
    '30667': 'Frachtpauschale Baustelle',
    '30668': 'Energiekostenzuschlag',
    '30704': 'Folierung',
    '30715': 'Kranentladung',
    '28096': 'Einwegpalette',
    '53053': 'Paletten OeBB',
}


def lies_beleg(pfad):
    """Ein Beleg -> {nummer, positionen: [...], gesamt, summe, rest}."""
    text = P.seitentext(pfad) if hasattr(P, 'seitentext') else None
    if text is None:
        import subprocess
        text = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'pdftext.py'), pfad],
                              capture_output=True, text=True).stdout
    zeilen = text.split('\n')

    positionen = []
    for i, z in enumerate(zeilen):
        m = POSITION.match(z)
        if not m:
            continue
        # Das Gewicht steht in der naechsten nicht-leeren Zeile.
        gewicht = None
        for j in range(i + 1, min(i + 3, len(zeilen))):
            g = GEWICHT.search(zeilen[j])
            if g:
                gewicht = zahl(g.group(1))
                break
            if POSITION.match(zeilen[j]):
                break
        positionen.append({
            'pos': int(m.group(1)),
            'artnr': m.group(2),
            'bezeichnung': m.group(3).strip(),
            'menge': zahl(m.group(4)),
            'einheit': m.group(5),
            'gewichtKg': gewicht,
        })

    # Eine Position kann auf beiden Seiten auftauchen (Kopfwiederholung).
    # Massgeblich ist die erste Nennung je Positionsnummer.
    gesehen = {}
    for p in positionen:
        gesehen.setdefault(p['pos'], p)
    positionen = [gesehen[k] for k in sorted(gesehen)]

    gm = GESAMT.search(text)
    nm = BELEGNR.search(text)
    summe = sum(p['gewichtKg'] or 0.0 for p in positionen)
    gesamt = zahl(gm.group(1)) if gm else None
    return {
        'datei': os.path.basename(pfad),
        'nummer': nm.group(1) if nm else None,
        'positionen': positionen,
        'summe': round(summe, 2),
        'gesamt': gesamt,
        'rest': None if gesamt is None else round(gesamt - summe, 2),
    }


def main(ziel=None):
    if not QUELLE:
        print('GEWICHT_PDFS nicht gesetzt.', file=sys.stderr)
        return 2
    belege = [lies_beleg(p) for p in sorted(glob.glob(os.path.join(QUELLE, '*.pdf')))]
    belege = [b for b in belege if b['gesamt'] is not None]

    sauber = [b for b in belege if abs(b['rest']) < 0.005]
    print(f'{len(belege)} Belege mit Gesamtgewicht, davon {len(sauber)} ohne Rest.')
    for b in belege:
        if abs(b['rest']) >= 0.005:
            print(f"  Rest {b['rest']:>10.2f} kg  {b['nummer']}  "
                  f"({len(b['positionen'])} Positionen, Summe {b['summe']:.2f}, "
                  f"ausgewiesen {b['gesamt']:.2f})")

    # Artikelgewichte nur aus den sauberen Belegen.
    je_artikel = {}
    for b in sauber:
        for p in b['positionen']:
            if p['artnr'] in KEINE_WARE or not p['gewichtKg'] or not p['menge']:
                continue
            je_artikel.setdefault(p['artnr'], {'bezeichnung': p['bezeichnung'], 'werte': []})
            je_artikel[p['artnr']]['werte'].append({
                'beleg': b['nummer'],
                'menge': p['menge'],
                'einheit': p['einheit'],
                'gewichtKg': p['gewichtKg'],
                'jeEinheitKg': round(p['gewichtKg'] / p['menge'], 4),
            })

    # Widersprueche zwischen Belegen sind ein Befund, kein Mittelwert.
    fest, strittig = {}, {}
    for artnr, e in je_artikel.items():
        werte = sorted({w['jeEinheitKg'] for w in e['werte']})
        if len(werte) == 1:
            fest[artnr] = {'bezeichnung': e['bezeichnung'], 'jeEinheitKg': werte[0],
                           'einheit': e['werte'][0]['einheit'], 'belege': [w['beleg'] for w in e['werte']]}
        else:
            strittig[artnr] = {'bezeichnung': e['bezeichnung'], 'werte': werte,
                               'belege': [w['beleg'] for w in e['werte']]}

    print(f'\n{len(fest)} Artikel mit eindeutigem Gewicht je Einheit, {len(strittig)} widerspruechlich.')
    for artnr, e in sorted(strittig.items()):
        print(f"  {artnr}  {e['bezeichnung'][:40]:<40} {e['werte']}")

    if ziel:
        with open(ziel, 'w', encoding='utf-8') as f:
            json.dump({'_hinweis': 'Nur aus Belegen ohne Gewichtsrest. Quelle: Positionsgewicht auf den '
                                   'Lieferantenrechnungen.',
                       'fest': fest, 'strittig': strittig,
                       'belege': [{'nummer': b['nummer'], 'rest': b['rest']} for b in belege]},
                      f, ensure_ascii=False, indent=1)
        print(f'\ngeschrieben: {ziel}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
