#!/usr/bin/env python3
"""Einfache Buchhaltung – lokaler Server (nur Python-Standardbibliothek).

Start:  python server.py
PC:     http://localhost:8765
Handy:  http://<IP-des-PCs>:8765  (gleiches WLAN)
"""
import base64
import csv
import io
import os
import json
import mimetypes
import re
import shutil
import socket
import sqlite3
import threading
import time
import uuid
import webbrowser
import zipfile
from datetime import date, datetime, timedelta
from email.parser import BytesParser
from email.policy import HTTP
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
# Ausgabenkonten (angelehnt an die E1a-Gliederung) – für Auswertung & Steuerberater
KONTEN = ["Waren/Material", "Fremdleistungen", "Fahrzeug/Treibstoff", "Reise/Verpflegung", "Miete/Pacht",
          "Energie", "Telefon/Internet", "Büro/Software", "Versicherung", "Werbung", "Bank/Gebühren",
          "Instandhaltung", "Anlagen/GWG", "Privat", "Sonstiges"]
ERLAUBT = {".pdf", ".jpg", ".jpeg", ".png", ".heic", ".webp"}
STATISCH = {"/manifest.webmanifest": "application/manifest+json", "/sw.js": "text/javascript",
            "/icon-192.png": "image/png", "/icon-512.png": "image/png"}

STANDARD_KONFIG = {
    "port": 8765,
    "ust_standard": 20,
    # Ordner werden automatisch überwacht; neue Dateien landen in der Kategorie.
    "ueberwachte_ordner": {
        "ausgang": "eingang_ordner/ausgangsrechnungen",
        "eingang": "eingang_ordner/eingangsrechnungen",
        "bar": "eingang_ordner/barbelege",
        "sonstiges": "eingang_ordner/sonstiges",
        "auto": "eingang_ordner/automatisch",
    },
    "scan_intervall_sekunden": 10,
    "zahlungsziel_tage": 14,
    # Optional: automatische Belegerkennung (Betrag, Datum, Firma, Rubrik) per Claude.
    # Benötigt: pip install anthropic  +  API-Key von https://console.anthropic.com
    "anthropic_api_key": "",
    "ki_modell": "claude-opus-5-5",
    # Dein Firmen-/Name: Rechnungen VON dir werden als Ausgangsrechnung erkannt.
    "eigene_firma": "",
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
        vorhanden = {z[1] for z in c.execute("PRAGMA table_info(belege)")}
        for spalte, typ in (("konto", "TEXT DEFAULT ''"), ("zuordnung", "INTEGER")):
            if spalte not in vorhanden:
                c.execute(f"ALTER TABLE belege ADD COLUMN {spalte} {typ}")


def zeile_zu_dict(z):
    d = dict(z)
    ust = d.get("ust_satz") or 0
    d["netto"] = round(d["brutto"] / (1 + ust / 100), 2) if d["brutto"] else 0
    d["ust"] = round(d["brutto"] - d["netto"], 2)
    if d["kategorie"] == "ausgang" and d["datum"]:
        try:
            d["faellig"] = (date.fromisoformat(d["datum"]) + timedelta(KONFIG["zahlungsziel_tage"])).isoformat()
            d["ueberfaellig"] = not d["bezahlt"] and d["faellig"] < date.today().isoformat()
        except ValueError:
            pass
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


# ---------------------------------------------------------------- KI-Erkennung (optional)
KI_SCHEMA = {
    "type": "object",
    "properties": {
        "kategorie": {"type": "string", "enum": ["ausgang", "eingang", "bar", "sonstiges", "bank"]},
        "datum": {"type": "string", "description": "Belegdatum YYYY-MM-DD, leer wenn unbekannt"},
        "partner": {"type": "string", "description": "Firma/Geschäft des Geschäftspartners"},
        "nummer": {"type": "string", "description": "Rechnungs-/Belegnummer, leer wenn keine"},
        "beschreibung": {"type": "string", "description": "kurz: was wurde gekauft/verrechnet"},
        "brutto": {"type": "number", "description": "Gesamtbetrag inkl. USt in EUR"},
        "ust_satz": {"type": "number", "enum": [20, 13, 10, 0]},
        "bezahlt": {"type": "boolean"},
        "konto": {"type": "string", "enum": KONTEN, "description": "Ausgabenart (bei Ausgangsrechnungen 'Sonstiges')"},
    },
    "required": ["kategorie", "datum", "partner", "nummer", "beschreibung", "brutto", "ust_satz", "bezahlt", "konto"],
    "additionalProperties": False,
}
KI_TYPEN = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def ki_erkennen(pfad):
    """Beleg per Claude auslesen. Liefert {} wenn nicht eingerichtet oder bei Fehler."""
    schluessel = KONFIG.get("anthropic_api_key") or os.environ.get("ANTHROPIC_API_KEY")
    endung = pfad.suffix.lower()
    if not schluessel or (endung != ".pdf" and endung not in KI_TYPEN):
        return {}
    try:
        import anthropic
    except ImportError:
        print("[KI] Paket fehlt: pip install anthropic")
        return {}
    daten = base64.standard_b64encode(pfad.read_bytes()).decode()
    if endung == ".pdf":
        block = {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": daten}}
    else:
        block = {"type": "image", "source": {"type": "base64", "media_type": KI_TYPEN[endung], "data": daten}}
    firma = KONFIG.get("eigene_firma") or "(unbekannt)"
    anweisung = (
        f"Lies diesen Beleg aus (Österreich). Meine Firma/mein Name: {firma}.\n"
        "Rubrik: 'ausgang' = Rechnung, die ICH an einen Kunden gestellt habe; "
        "'eingang' = Rechnung eines Lieferanten an mich; 'bar' = Kassenbon/Barzahlung (Supermarkt, Tankstelle, Baumarkt-Kassa); "
        "'bank' = Kontoauszug; sonst 'sonstiges'. "
        "Bei 'ausgang' ist partner der Kunde, sonst der Aussteller. "
        "Bei mehreren Steuersätzen den überwiegenden nehmen. Kassenbons gelten als bezahlt."
    )
    try:
        client = anthropic.Anthropic(api_key=schluessel)
        antwort = client.beta.messages.create(
            model=KONFIG.get("ki_modell", "claude-opus-5-5"),
            max_tokens=2000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": KI_SCHEMA}},
            messages=[{"role": "user", "content": [block, {"type": "text", "text": anweisung}]}],
        )
        if antwort.stop_reason == "refusal":
            return {}
        text = next(b.text for b in antwort.content if b.type == "text")
        erg = json.loads(text)
        erg["bezahlt"] = int(erg.get("bezahlt", False))
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", erg.get("datum", "")):
            erg.pop("datum", None)
        return erg
    except Exception as fehler:
        print("[KI] Fehler:", fehler)
        return {}


def beleg_verarbeiten(rel, kategorie, quelle, beschreibung=""):
    """Abgelegte Datei auswerten und als Beleg buchen. kategorie='auto' -> erkennen."""
    pfad = DATEN / rel
    erkannt = daten_erkennen(pdf_text(pfad)) if pfad.suffix.lower() == ".pdf" else {}
    erkannt.update({k: v for k, v in ki_erkennen(pfad).items() if v not in ("", None)})
    if kategorie == "auto":
        kategorie = erkannt.get("kategorie", "eingang")
    if not rel.startswith(f"belege/{kategorie}/"):  # Datei in den Ordner der Rubrik verschieben
        ziel = BELEGE / kategorie / str(date.today().year)
        ziel.mkdir(parents=True, exist_ok=True)
        shutil.move(str(pfad), ziel / pfad.name)
        rel = (ziel / pfad.name).relative_to(DATEN).as_posix()
    standard_ust = 0 if kategorie in ("bar", "bank") else KONFIG["ust_standard"]
    return beleg_anlegen(
        kategorie=kategorie,
        datum=erkannt.get("datum", date.today().isoformat()),
        partner=erkannt.get("partner", ""),
        nummer=erkannt.get("nummer", ""),
        beschreibung=erkannt.get("beschreibung", beschreibung),
        brutto=erkannt.get("brutto", 0),
        ust_satz=erkannt.get("ust_satz", standard_ust),
        bezahlt=erkannt.get("bezahlt", 1 if kategorie == "bar" else 0),
        konto="" if kategorie in ("ausgang", "bank") else erkannt.get("konto", ""),
        datei=rel,
        quelle=quelle,
    )


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
            rel = datei_ablegen(datei, "eingang", datei.name)
            neu = beleg_verarbeiten(rel, kategorie, "ordner", datei.stem)
            print(f"[Import] {datei.name} -> Beleg {neu}")


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


def export_csv(jahr):
    sql, par = "SELECT * FROM belege", []
    if jahr:
        sql += " WHERE substr(datum,1,4)=?"
        par.append(jahr)
    sql += " ORDER BY kategorie, datum"
    puffer = io.StringIO()
    w = csv.writer(puffer, delimiter=";")
    w.writerow(["Kategorie", "Datum", "Partner", "Nummer", "Beschreibung", "Konto", "Netto", "USt %", "USt", "Brutto",
                "Bezahlt", "Datei"])
    zahl = lambda x: f"{x:.2f}".replace(".", ",")
    with db() as c:
        for z in map(zeile_zu_dict, c.execute(sql, par)):
            w.writerow([KATEGORIEN.get(z["kategorie"], z["kategorie"]), z["datum"], z["partner"], z["nummer"],
                        z["beschreibung"], z["konto"], zahl(z["netto"]), zahl(z["ust_satz"]), zahl(z["ust"]),
                        zahl(z["brutto"]), "ja" if z["bezahlt"] else "nein", z["datei"]])
    return puffer.getvalue().encode("utf-8-sig")


# ---------------------------------------------------------------- HTTP
FELDER = ("kategorie", "datum", "partner", "nummer", "beschreibung", "brutto", "ust_satz", "bezahlt", "konto")


def bank_abgleich():
    """Bankbuchungen offenen Rechnungen zuordnen (Betrag gleich, Rechnungsnr. im Text bevorzugt)."""
    anzahl = 0
    with db_lock, db() as c:
        bank = c.execute("SELECT * FROM belege WHERE kategorie='bank' AND zuordnung IS NULL").fetchall()
        for b in bank:
            arten = ("ausgang", "ausgang") if b["brutto"] > 0 else ("eingang", "bar")
            offen = c.execute(
                "SELECT * FROM belege WHERE kategorie IN (?, ?) AND bezahlt=0 AND zuordnung IS NULL "
                "AND abs(brutto - ?) < 0.01", (*arten, abs(b["brutto"]))).fetchall()
            text = f"{b['beschreibung']} {b['partner']}".lower()
            mit_nr = [o for o in offen if o["nummer"] and o["nummer"].lower() in text]
            treffer = mit_nr[0] if len(mit_nr) == 1 else offen[0] if len(offen) == 1 else None
            if treffer:
                c.execute("UPDATE belege SET bezahlt=1, zuordnung=? WHERE id=?", (b["id"], treffer["id"]))
                c.execute("UPDATE belege SET zuordnung=? WHERE id=?", (treffer["id"], b["id"]))
                anzahl += 1
    return anzahl


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
        if url.path in STATISCH:
            return self.antwort(200, (BASIS / url.path[1:]).read_bytes(), STATISCH[url.path])
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
            ki = bool(KONFIG.get("anthropic_api_key") or os.environ.get("ANTHROPIC_API_KEY"))
            return self.antwort(200, {"kategorien": KATEGORIEN, "konten": KONTEN,
                                      "ust_standard": KONFIG["ust_standard"], "ki": ki})
        if url.path == "/api/export.csv":
            return self.antwort(200, export_csv(q.get("jahr")), "text/csv; charset=utf-8",
                                {"Content-Disposition": f'attachment; filename="buchhaltung_{q.get("jahr") or "alle"}.csv"'})
        if url.path == "/api/export.zip":
            return self.export_zip(q.get("jahr"))
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

    def export_zip(self, jahr):
        """Paket für den Steuerberater: Liste (CSV) + alle Belegdateien nach Rubrik."""
        puffer = io.BytesIO()
        with zipfile.ZipFile(puffer, "w", zipfile.ZIP_DEFLATED) as z, db() as c:
            z.writestr("belegliste.csv", export_csv(jahr))
            sql = "SELECT datei FROM belege WHERE datei != ''" + (" AND substr(datum,1,4)=?" if jahr else "")
            for zeile in c.execute(sql, [jahr] if jahr else []):
                if (DATEN / zeile["datei"]).exists():
                    z.write(DATEN / zeile["datei"], zeile["datei"])
        self.antwort(200, puffer.getvalue(), "application/zip",
                     {"Content-Disposition": f'attachment; filename="buchhaltung_{jahr or "alle"}.zip"'})

    # ---- POST
    def do_POST(self):
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        if url.path == "/api/upload":
            kategorie = q.get("kategorie", "auto")
            if kategorie not in KATEGORIEN and kategorie != "auto":
                return self.antwort(400, {"fehler": "Kategorie ungültig"})
            name = unquote(q.get("name", "scan.jpg"))
            if Path(name).suffix.lower() not in ERLAUBT:
                return self.antwort(400, {"fehler": "Dateityp nicht erlaubt"})
            return self.antwort(200, {"id": self.ablegen(self.body(), name, kategorie)})
        if url.path == "/teilen":  # "Teilen -> Buchhaltung" vom Handy (Web Share Target)
            neu = None
            for name, daten in self.multipart_dateien():
                if Path(name).suffix.lower() in ERLAUBT:
                    neu = self.ablegen(daten, name, "auto")
            ziel = f"/?beleg={neu}" if neu else "/?fehler=keine+Datei"
            return self.antwort(303, b"", "text/plain", {"Location": ziel})
        if url.path == "/api/beleg":
            d = json.loads(self.body() or b"{}")
            felder = {k: d[k] for k in FELDER if k in d}
            if felder.get("kategorie") not in KATEGORIEN:
                return self.antwort(400, {"fehler": "Kategorie ungültig"})
            return self.antwort(200, {"id": beleg_anlegen(quelle="manuell", **felder)})
        if url.path == "/api/bank-import":
            importiert = bank_csv_import(self.body())
            return self.antwort(200, {"importiert": importiert, "zugeordnet": bank_abgleich()})
        if url.path == "/api/abgleich":
            return self.antwort(200, {"zugeordnet": bank_abgleich()})
        self.antwort(404, {"fehler": "unbekannt"})

    def ablegen(self, daten, name, kategorie):
        return beleg_verarbeiten(datei_ablegen(daten, "eingang", name), kategorie, "upload")

    def multipart_dateien(self):
        kopf = f"Content-Type: {self.headers.get('Content-Type', '')}\r\n\r\n".encode()
        nachricht = BytesParser(policy=HTTP).parsebytes(kopf + self.body())
        for teil in nachricht.iter_parts():
            if teil.get_filename():
                yield teil.get_filename(), teil.get_payload(decode=True)

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
            c.execute("UPDATE belege SET zuordnung=NULL WHERE zuordnung=?", (m.group(1),))
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
        print(f"  {KATEGORIEN.get(k, 'Automatisch'):<20} {o}")
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    # Browser erst öffnen, wenn der Server wirklich läuft
    threading.Timer(1, webbrowser.open, (f"http://localhost:{port}",)).start()
    server.serve_forever()
