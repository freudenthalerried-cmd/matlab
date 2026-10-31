#!/usr/bin/env python3
"""Einfache Buchhaltung – lokaler Server (nur Python-Standardbibliothek).

Start:  python server.py
PC:     http://localhost:8765
Handy:  http://<IP-des-PCs>:8765  (gleiches WLAN)
"""
import csv
import io
import json
import mimetypes
import re
import shutil
import socket
import sqlite3
import threading
import time
import uuid
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

BASIS = Path(__file__).resolve().parent
DATEN = BASIS / "daten"
BELEGE = DATEN / "belege"
PAPIERKORB = DATEN / "papierkorb"
DB_PFAD = DATEN / "buchhaltung.db"
KONFIG_PFAD = BASIS / "config.json"

KATEGORIEN = {
    "ausgang": "Ausgangsrechnungen",
    "eingang": "Eingangsrechnungen",
    "bar": "Private Barbelege",
    "sonstiges": "Sonstiges",
    "bank": "Bank",
}
ERLAUBT = {".pdf", ".jpg", ".jpeg", ".png", ".heic", ".webp"}

STANDARD_KONFIG = {
    "port": 8765,
    "ust_standard": 20,
    # Ordner werden automatisch überwacht; neue Dateien landen in der Kategorie.
    "ueberwachte_ordner": {
        "ausgang": "eingang_ordner/ausgangsrechnungen",
        "eingang": "eingang_ordner/eingangsrechnungen",
        "bar": "eingang_ordner/barbelege",
        "sonstiges": "eingang_ordner/sonstiges",
    },
    "scan_intervall_sekunden": 10,
}

db_lock = threading.Lock()


# ---------------------------------------------------------------- Konfiguration
def lade_konfig():
    if not KONFIG_PFAD.exists():
        KONFIG_PFAD.write_text(json.dumps(STANDARD_KONFIG, indent=2, ensure_ascii=False), encoding="utf-8")
    konfig = dict(STANDARD_KONFIG)
    konfig.update(json.loads(KONFIG_PFAD.read_text(encoding="utf-8")))
    return konfig


# ---------------------------------------------------------------- Datenbank
def db():
    verbindung = sqlite3.connect(DB_PFAD, check_same_thread=False)
    verbindung.row_factory = sqlite3.Row
    return verbindung


def init_db():
    DATEN.mkdir(exist_ok=True)
    BELEGE.mkdir(exist_ok=True)
    PAPIERKORB.mkdir(exist_ok=True)
    with db() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS belege (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kategorie TEXT NOT NULL,
                datum TEXT,
                partner TEXT DEFAULT '',
                nummer TEXT DEFAULT '',
                beschreibung TEXT DEFAULT '',
                brutto REAL DEFAULT 0,
                ust_satz REAL DEFAULT 20,
                bezahlt INTEGER DEFAULT 0,
                datei TEXT DEFAULT '',
                quelle TEXT DEFAULT '',
                erstellt TEXT
            )"""
        )


def zeile_zu_dict(z):
    d = dict(z)
    ust = d.get("ust_satz") or 0
    d["netto"] = round(d["brutto"] / (1 + ust / 100), 2) if d["brutto"] else 0
    d["ust"] = round(d["brutto"] - d["netto"], 2)
    return d


def beleg_anlegen(**felder):
    felder.setdefault("datum", date.today().isoformat())
    felder.setdefault("erstellt", datetime.now().isoformat(timespec="seconds"))
    spalten = ", ".join(felder)
    platzhalter = ", ".join("?" for _ in felder)
    with db_lock, db() as c:
        cur = c.execute(f"INSERT INTO belege ({spalten}) VALUES ({platzhalter})", list(felder.values()))
        return cur.lastrowid


# ---------------------------------------------------------------- Dateien
def datei_ablegen(quelle_bytes_oder_pfad, kategorie, original_name):
    endung = Path(original_name).suffix.lower() or ".bin"
    ziel_ordner = BELEGE / kategorie / str(date.today().year)
    ziel_ordner.mkdir(parents=True, exist_ok=True)
    stamm = re.sub(r"[^\w\-]+", "_", Path(original_name).stem)[:60] or "beleg"
    ziel = ziel_ordner / f"{datetime.now():%Y%m%d_%H%M%S}_{uuid.uuid4().hex[:6]}_{stamm}{endung}"
    if isinstance(quelle_bytes_oder_pfad, (bytes, bytearray)):
        ziel.write_bytes(quelle_bytes_oder_pfad)
    else:
        shutil.move(str(quelle_bytes_oder_pfad), ziel)
    return ziel.relative_to(DATEN).as_posix()


def pdf_text(pfad):
    """Text aus PDF lesen – nur wenn 'pypdf' installiert ist (optional)."""
    try:
        from pypdf import PdfReader
    except ImportError:
        return ""
    try:
        return "\n".join((s.extract_text() or "") for s in PdfReader(str(pfad)).pages[:3])
    except Exception:
        return ""


def betrag_parsen(text):
    text = text.replace(" ", "").replace("€", "")
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def daten_erkennen(text):
    """Rechnungsnummer, Datum und Bruttobetrag aus Rechnungstext raten."""
    erg = {}
    m = re.search(r"Rechnungs?\s*-?\s*(?:Nr\.?|nummer)\s*:?\s*([A-Za-z0-9\-/]+)", text, re.I)
    if m:
        erg["nummer"] = m.group(1)
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", text)
    if m:
        try:
            erg["datum"] = date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
        except ValueError:
            pass
    betraege = re.findall(
        r"(?:Gesamt|Summe|Brutto|Endbetrag|Rechnungsbetrag|zu zahlen)[^\d\n]{0,40}?(\d{1,3}(?:[.\s]\d{3})*,\d{2}|\d+\.\d{2})",
        text, re.I,
    )
    if betraege:
        b = betrag_parsen(betraege[-1])
        if b is not None:
            erg["brutto"] = b
    return erg


# ---------------------------------------------------------------- Ordner-Überwachung
def ordner_scannen(konfig):
    for kategorie, ordner in konfig["ueberwachte_ordner"].items():
        pfad = Path(ordner).expanduser()
        if not pfad.is_absolute():
            pfad = BASIS / pfad
        pfad.mkdir(parents=True, exist_ok=True)
        for datei in sorted(pfad.iterdir()):
            if not datei.is_file() or datei.suffix.lower() not in ERLAUBT or datei.name.startswith("."):
                continue
            # Datei muss "fertig" sein (nicht mehr gerade geschrieben werden)
            if time.time() - datei.stat().st_mtime < 3:
                continue
            erkannt = daten_erkennen(pdf_text(datei)) if datei.suffix.lower() == ".pdf" else {}
            rel = datei_ablegen(datei, kategorie, datei.name)
            beleg_anlegen(
                kategorie=kategorie,
                datum=erkannt.get("datum", date.today().isoformat()),
                nummer=erkannt.get("nummer", ""),
                brutto=erkannt.get("brutto", 0),
                ust_satz=0 if kategorie == "bar" else konfig["ust_standard"],
                beschreibung=datei.stem,
                datei=rel,
                quelle="ordner",
            )
            print(f"[Import] {datei.name} -> {KATEGORIEN[kategorie]}")


def ueberwachung(konfig):
    while True:
        try:
            ordner_scannen(konfig)
        except Exception as fehler:
            print("[Überwachung] Fehler:", fehler)
        time.sleep(konfig["scan_intervall_sekunden"])


# ---------------------------------------------------------------- Bank-CSV
def bank_csv_import(roh):
    for kodierung in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            text = roh.decode(kodierung)
            break
        except UnicodeDecodeError:
            continue
    trenner = ";" if text.count(";") > text.count(",") else ","
    zeilen = list(csv.reader(io.StringIO(text), delimiter=trenner))
    if not zeilen:
        return 0
    kopf = [k.strip().lower() for k in zeilen[0]]

    def spalte(*namen):
        for i, k in enumerate(kopf):
            if any(n in k for n in namen):
                return i
        return None

    i_datum = spalte("buchungsdatum", "datum", "date", "valuta")
    i_betrag = spalte("betrag", "amount", "umsatz")
    i_text = spalte("buchungstext", "verwendungszweck", "text", "beschreibung", "zahlungsreferenz")
    i_partner = spalte("partner", "empfänger", "auftraggeber", "name")
    hat_kopf = i_datum is not None and i_betrag is not None
    if not hat_kopf:  # ohne Kopfzeile: Datum;Text;Betrag annehmen
        i_datum, i_text, i_betrag, i_partner = 0, 1, 2, None
    anzahl = 0
    for z in zeilen[1 if hat_kopf else 0:]:
        if len(z) <= max(i_datum, i_betrag):
            continue
        betrag = betrag_parsen(z[i_betrag])
        if betrag is None:
            continue
        roh_datum = z[i_datum].strip()
        try:
            datum = datetime.strptime(roh_datum[:10], "%d.%m.%Y").date().isoformat()
        except ValueError:
            datum = roh_datum[:10]
        beleg_anlegen(
            kategorie="bank",
            datum=datum,
            partner=z[i_partner].strip() if i_partner is not None and i_partner < len(z) else "",
            beschreibung=z[i_text].strip() if i_text is not None and i_text < len(z) else "",
            brutto=betrag,
            ust_satz=0,
            bezahlt=1,
            quelle="bank-csv",
        )
        anzahl += 1
    return anzahl


# ---------------------------------------------------------------- HTTP
FELDER = ("kategorie", "datum", "partner", "nummer", "beschreibung", "brutto", "ust_satz", "bezahlt")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def antwort(self, status, inhalt, typ="application/json; charset=utf-8", extra=None):
        if not isinstance(inhalt, (bytes, bytearray)):
            inhalt = json.dumps(inhalt, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(inhalt)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(inhalt)

    def body(self):
        return self.rfile.read(int(self.headers.get("Content-Length", 0)))

    # ---- GET
    def do_GET(self):
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        if url.path in ("/", "/index.html"):
            return self.antwort(200, (BASIS / "index.html").read_bytes(), "text/html; charset=utf-8")
        if url.path == "/api/belege":
            sql, par = "SELECT * FROM belege WHERE 1=1", []
            if q.get("kategorie"):
                sql += " AND kategorie=?"
                par.append(q["kategorie"])
            if q.get("jahr"):
                sql += " AND substr(datum,1,4)=?"
                par.append(q["jahr"])
            sql += " ORDER BY datum DESC, id DESC"
            with db() as c:
                return self.antwort(200, [zeile_zu_dict(z) for z in c.execute(sql, par)])
        if url.path == "/api/info":
            return self.antwort(200, {"kategorien": KATEGORIEN, "ust_standard": KONFIG["ust_standard"]})
        if url.path == "/api/export.csv":
            return self.export(q.get("jahr"))
        m = re.fullmatch(r"/datei/(\d+)", url.path)
        if m:
            with db() as c:
                z = c.execute("SELECT datei FROM belege WHERE id=?", (m.group(1),)).fetchone()
            if not z or not z["datei"]:
                return self.antwort(404, {"fehler": "keine Datei"})
            pfad = (DATEN / z["datei"]).resolve()
            if DATEN.resolve() not in pfad.parents or not pfad.exists():
                return self.antwort(404, {"fehler": "nicht gefunden"})
            typ = mimetypes.guess_type(pfad.name)[0] or "application/octet-stream"
            return self.antwort(200, pfad.read_bytes(), typ)
        self.antwort(404, {"fehler": "unbekannt"})

    def export(self, jahr):
        sql, par = "SELECT * FROM belege", []
        if jahr:
            sql += " WHERE substr(datum,1,4)=?"
            par.append(jahr)
        sql += " ORDER BY kategorie, datum"
        puffer = io.StringIO()
        w = csv.writer(puffer, delimiter=";")
        w.writerow(["Kategorie", "Datum", "Partner", "Nummer", "Beschreibung", "Netto", "USt %", "USt", "Brutto", "Bezahlt", "Datei"])
        with db() as c:
            for z in map(zeile_zu_dict, c.execute(sql, par)):
                zahl = lambda x: f"{x:.2f}".replace(".", ",")
                w.writerow([KATEGORIEN.get(z["kategorie"], z["kategorie"]), z["datum"], z["partner"], z["nummer"],
                            z["beschreibung"], zahl(z["netto"]), zahl(z["ust_satz"]), zahl(z["ust"]),
                            zahl(z["brutto"]), "ja" if z["bezahlt"] else "nein", z["datei"]])
        name = f"buchhaltung_{jahr or 'alle'}.csv"
        self.antwort(200, puffer.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8",
                     {"Content-Disposition": f'attachment; filename="{name}"'})

    # ---- POST
    def do_POST(self):
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        if url.path == "/api/upload":
            kategorie = q.get("kategorie", "eingang")
            if kategorie not in KATEGORIEN:
                return self.antwort(400, {"fehler": "Kategorie ungültig"})
            name = unquote(q.get("name", "scan.jpg"))
            if Path(name).suffix.lower() not in ERLAUBT:
                return self.antwort(400, {"fehler": "Dateityp nicht erlaubt"})
            daten = self.body()
            rel = datei_ablegen(daten, kategorie, name)
            erkannt = daten_erkennen(pdf_text(DATEN / rel)) if name.lower().endswith(".pdf") else {}
            neu = beleg_anlegen(
                kategorie=kategorie,
                datum=erkannt.get("datum", date.today().isoformat()),
                nummer=erkannt.get("nummer", ""),
                brutto=erkannt.get("brutto", 0),
                ust_satz=0 if kategorie in ("bar", "bank") else KONFIG["ust_standard"],
                datei=rel,
                quelle="upload",
            )
            return self.antwort(200, {"id": neu})
        if url.path == "/api/beleg":
            d = json.loads(self.body() or b"{}")
            felder = {k: d[k] for k in FELDER if k in d}
            if felder.get("kategorie") not in KATEGORIEN:
                return self.antwort(400, {"fehler": "Kategorie ungültig"})
            return self.antwort(200, {"id": beleg_anlegen(quelle="manuell", **felder)})
        if url.path == "/api/bank-import":
            return self.antwort(200, {"importiert": bank_csv_import(self.body())})
        self.antwort(404, {"fehler": "unbekannt"})

    # ---- PUT / DELETE
    def do_PUT(self):
        m = re.fullmatch(r"/api/beleg/(\d+)", urlparse(self.path).path)
        if not m:
            return self.antwort(404, {"fehler": "unbekannt"})
        d = json.loads(self.body() or b"{}")
        felder = {k: d[k] for k in FELDER if k in d}
        if "kategorie" in felder and felder["kategorie"] not in KATEGORIEN:
            return self.antwort(400, {"fehler": "Kategorie ungültig"})
        if felder:
            with db_lock, db() as c:
                c.execute(f"UPDATE belege SET {', '.join(k + '=?' for k in felder)} WHERE id=?",
                          [*felder.values(), m.group(1)])
        self.antwort(200, {"ok": True})

    def do_DELETE(self):
        m = re.fullmatch(r"/api/beleg/(\d+)", urlparse(self.path).path)
        if not m:
            return self.antwort(404, {"fehler": "unbekannt"})
        with db_lock, db() as c:
            z = c.execute("SELECT datei FROM belege WHERE id=?", (m.group(1),)).fetchone()
            if z and z["datei"] and (DATEN / z["datei"]).exists():
                # nicht löschen, sondern in den Papierkorb verschieben (Aufbewahrungspflicht!)
                shutil.move(str(DATEN / z["datei"]), PAPIERKORB / Path(z["datei"]).name)
            c.execute("DELETE FROM belege WHERE id=?", (m.group(1),))
        self.antwort(200, {"ok": True})


def lokale_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


if __name__ == "__main__":
    KONFIG = lade_konfig()
    init_db()
    threading.Thread(target=ueberwachung, args=(KONFIG,), daemon=True).start()
    port = KONFIG["port"]
    print(f"Buchhaltung läuft:\n  PC:    http://localhost:{port}\n  Handy: http://{lokale_ip()}:{port}  (gleiches WLAN)")
    print("Überwachte Ordner:")
    for k, o in KONFIG["ueberwachte_ordner"].items():
        print(f"  {KATEGORIEN[k]:<20} {o}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
