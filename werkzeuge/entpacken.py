#!/usr/bin/env python3
"""PDF-Anhaenge aus den von Gmail abgelegten RAW-JSON-Dateien herausloesen.

Das Gmail-Werkzeug gibt Anhaenge nicht als Datei heraus. Ueber
`messageFormat: RAW` kommt aber die vollstaendige MIME-Nachricht; grosse
Antworten legt die Umgebung als JSON-Datei ab. Dieses Skript liest diese
Dateien und loest die PDF-Teile heraus.

    GMAIL_ROHDATEN=<ordner mit den JSON-Dateien> PDF_ZIEL=<zielordner> \
        python3 entpacken.py

Beide Pfade sind maschinenspezifisch und stehen deshalb in Umgebungsvariablen,
nicht im Quelltext.
"""
import base64, email, glob, json, os

QUELLE = os.environ.get('GMAIL_ROHDATEN', '.')
ZIEL = os.environ.get('PDF_ZIEL', './rechnungen')

anzahl = 0
# Das Gmail-Werkzeug legt grosse Antworten unter dem Namen
# 'mcp-Gmail-get_message-<zeit>.txt' ab. Wer eine Datei von Hand
# dazulegt, benennt sie erfahrungsgemaess anders -- und bekam dann
# kommentarlos 'neue PDFs: 0'. Deshalb wird jetzt jede .txt- und
# .json-Datei im Ordner probiert; was kein passendes JSON ist, meldet
# sich selbst.
kandidaten = sorted(set(glob.glob(os.path.join(QUELLE, '*.txt')))
                    | set(glob.glob(os.path.join(QUELLE, '*.json'))))
if not kandidaten:
    print('keine Rohdateien in', QUELLE)
for pfad in kandidaten:
    try:
        daten = json.load(open(pfad))
    except Exception as e:
        print('uebersprungen (kein JSON):', os.path.basename(pfad), e)
        continue
    roh = daten.get('raw')
    if not roh:
        continue
    mime = base64.urlsafe_b64decode(roh + '=' * (-len(roh) % 4))
    nachricht = email.message_from_bytes(mime)
    betreff = nachricht.get('Subject', '?')
    for teil in nachricht.walk():
        name = teil.get_filename()
        if not name or not name.lower().endswith('.pdf'):
            continue
        inhalt = teil.get_payload(decode=True)
        ziel = os.path.join(ZIEL, os.path.basename(name))
        if os.path.exists(ziel):
            print('vorhanden:', name)
            continue
        open(ziel, 'wb').write(inhalt)
        anzahl += 1
        print('geschrieben: %-28s %7d Bytes  (%s)' % (name, len(inhalt), betreff))
print('neue PDFs:', anzahl)
