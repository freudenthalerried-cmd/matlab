#!/usr/bin/env python3
"""PV-Monitor: lokaler Server für das Dashboard (GoodWe-Wechselrichter per WLAN oder SEMS-Cloud).

Normalbetrieb: python3 sems/server.py --lan
  Beim ersten Start wird der Wechselrichter im WLAN gesucht und gespeichert; klappt das nicht,
  zeigt das Dashboard eine Einrichtungsseite (SEMS-Login). Danach läuft alles automatisch.
Optionen: --local IP[:Port]  --demo  --search  --lan (Dashboard im ganzen WLAN erreichbar)
Konfiguration und Verlauf: %APPDATA%\\PV-Monitor bzw. ~/.config/PV-Monitor
"""

import asyncio

import json
import math
import os
import random
import sys
import threading
import time
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sems_client import Sems, password_hash  # noqa: E402

HERE = Path(__file__).resolve().parent
CONFIG_DIR = Path(os.environ.get("APPDATA") or Path.home() / ".config") / "PV-Monitor"
CONFIG_FILE = CONFIG_DIR / "config.json"
CACHE_SECONDS = 300  # SEMS rate limit: höchstens alle 5 min abfragen
STAT_ITEMS = ["proSystemTotalStats", "proConsumStats", "proGridStats", "proPurchaseStats",
              "proSelfConsumStats", "proCharStats", "proDischarStats"]


def num(value):
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def factors(groups):
    out = {}
    for group in groups or []:
        for factor in (group or {}).get("factors", []) or []:
            if isinstance(factor, dict) and isinstance(factor.get("code"), str) and factor.get("data") is not None:
                out[factor["code"]] = factor["data"]
    return out


class LiveSource:
    def __init__(self, sems):
        self.sems = sems
        self.lock = threading.Lock()
        self.cache = {}

    def cached(self, key, fn, ttl=CACHE_SECONDS):
        with self.lock:
            hit = self.cache.get(key)
            if hit and time.time() - hit[0] < ttl:
                return hit[1]
            value = fn()
            self.cache[key] = (time.time(), value)
            return value

    def stations(self):
        def load():
            data = self.sems.stations() or {}
            return [{"id": s.get("id"),
                     "name": s.get("stationName") or s.get("name") or s.get("id"),
                     "capacity": num(s.get("capacity"))}
                    for s in data.get("dataList", []) if isinstance(s, dict) and s.get("id")]
        return self.cached("stations", load)

    def live(self, sid):
        def load():
            flow = self.sems.flow(sid) or {}
            devices = []
            for group in (self.sems.devices(sid) or {}).get("deviceDetailList", []):
                dtype = group.get("deviceType")
                for status in group.get("statusDetailList", []):
                    for sn in status.get("snList", []):
                        dev = {"sn": sn, "type": dtype, "status": status.get("status")}
                        if dtype in ("INVERTER", "ENERGY_STORAGE_INTEGRATED_CABINET"):
                            q = f"?deviceType={dtype}&pwId={sid}"
                            tel = factors(self.sems.call(f"/sems-plant/api/equipments/{sn}/telemetry{q}"))
                            cnt = factors(self.sems.call(f"/sems-plant/api/equipments/{sn}/telecounting{q}"))
                            dev.update(pac=num(tel.get("pAc")), temp=num(tel.get("Temperature")),
                                       vac=num(tel.get("Vac") or tel.get("PHASE-A:Vac")),
                                       eday=num(cnt.get("proPvStatsToday")), etotal=num(cnt.get("proPvStatsTotal")))
                        devices.append(dev)
            return {
                "updated": datetime.now().astimezone().isoformat(timespec="seconds"),
                "flow": {"pv": num(flow.get("pSystem") if flow.get("pSystem") is not None else flow.get("pAc")),
                         "load": num(flow.get("pConsum")), "grid": num(flow.get("pGrid")),
                         "battery": num(flow.get("pBat")), "soc": num(flow.get("soc"))},
                "devices": devices,
            }
        return self.cached(f"live:{sid}", load)

    def stats(self, sid, days):
        def load():
            raw = self.sems.stats(sid, days) or {}
            dates, series = [], {}
            for entry in raw.get("dataList", []):
                item = entry.get("item")
                points = entry.get("statisticsList", []) or []
                if not dates:
                    dates = [p.get("date") for p in points]
                series[item] = [num(p.get("val")) for p in points]
            return {"dates": dates, "series": series}
        return self.cached(f"stats:{sid}:{days}", load)


class LocalSource(LiveSource):
    """Live-Werte direkt vom Wechselrichter (UDP 8899 über den WLAN-Stick).

    Ein Hintergrund-Thread liest alle POLL_SECONDS und summiert die Energien pro Tag in
    verlauf.db (SQLite) - so gibt es Tagesbalken auch ganz ohne Cloud.
    """

    POLL_SECONDS = 30
    COLUMNS = ("pv", "load", "export", "import", "charge", "discharge")
    STAT_KEYS = {"proSystemTotalStats": "pv", "proConsumStats": "load", "proGridStats": "export",
                 "proPurchaseStats": "import", "proCharStats": "charge", "proDischarStats": "discharge"}

    def __init__(self, host, sems=None, db_path=None):
        super().__init__(sems)
        self.host = host
        self.inverter = None
        self.running = True
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path or CONFIG_DIR / "verlauf.db"
        with self.db() as db:
            db.execute("CREATE TABLE IF NOT EXISTS daily (date TEXT PRIMARY KEY, "
                       + ", ".join(f"{c} REAL DEFAULT 0" for c in self.COLUMNS) + ")")
        self.last = None  # (zeitpunkt, flow) der letzten Messung
        threading.Thread(target=self.poll, daemon=True).start()

    def db(self):
        import sqlite3
        return sqlite3.connect(self.db_path)

    async def _read(self):
        import goodwe
        if self.inverter is None:
            host, _, port = self.host.partition(":")  # "IP:502" für Modbus-TCP-Sticks
            self.inverter = await (goodwe.connect(host, int(port)) if port else goodwe.connect(host))
        return await self.inverter.read_runtime_data()

    def stations(self):
        if self.sems:
            return super().stations()
        return [{"id": "local", "name": f"Wechselrichter {self.host}", "capacity": None}]

    def live(self, sid):
        def load():
            d = asyncio.run(self._read())
            kw = lambda key: None if num(d.get(key)) is None else round(num(d.get(key)) / 1000, 3)
            grid = kw("active_power") if d.get("active_power") is not None else kw("meter_active_power")
            bat = kw("pbattery1")
            inv = self.inverter
            return {
                "updated": datetime.now().astimezone().isoformat(timespec="seconds"),
                "flow": {"pv": kw("ppv"), "load": kw("house_consumption"), "grid": grid,  # >0 Einspeisung
                         "battery": None if bat is None else -bat,                       # >0 Laden
                         "soc": num(d.get("battery_soc"))},
                "devices": [{"sn": inv.serial_number, "type": f"INVERTER ({inv.model_name})", "status": "LOKAL",
                             "pac": kw("ppv"), "temp": num(d.get("temperature")), "vac": num(d.get("vgrid")),
                             "eday": num(d.get("e_day")), "etotal": num(d.get("e_total"))}],
            }
        try:
            return self.cached("local", load, ttl=10)
        except Exception:
            self.inverter = None  # beim nächsten Versuch neu verbinden
            raise

    def record(self, now, flow):
        """Leistung (kW) x Zeit seit letzter Messung = Energie (kWh), aufgeteilt nach Richtung."""
        prev, self.last = self.last, (now, flow)
        if prev is None or prev[0].date() != now.date():
            return
        hours = (now - prev[0]).total_seconds() / 3600
        if not 0 < hours <= 0.25:  # Lücke (Wechselrichter nachts aus o. Ä.) nicht hochrechnen
            return
        g, b = flow.get("grid") or 0, flow.get("battery") or 0
        add = {"pv": flow.get("pv") or 0, "load": flow.get("load") or 0,
               "export": max(g, 0), "import": max(-g, 0), "charge": max(b, 0), "discharge": max(-b, 0)}
        with self.db() as db:
            db.execute("INSERT OR IGNORE INTO daily (date) VALUES (?)", (now.date().isoformat(),))
            db.execute("UPDATE daily SET " + ", ".join(f"{c} = {c} + ?" for c in self.COLUMNS) + " WHERE date = ?",
                       [add[c] * hours for c in self.COLUMNS] + [now.date().isoformat()])

    def poll(self):
        while self.running:
            try:
                self.record(datetime.now(), self.live("local")["flow"])
            except Exception as exc:
                print(f"Wechselrichter nicht erreichbar: {exc}", file=sys.stderr)
            time.sleep(self.POLL_SECONDS)

    def stats(self, sid, days):
        if self.sems and sid != "local":
            return super().stats(sid, days)
        dates = [(date.today() - timedelta(days=days - 1 - i)).isoformat() for i in range(days)]
        with self.db() as db:
            rows = {r[0]: r[1:] for r in db.execute(
                "SELECT date, " + ", ".join(self.COLUMNS) + " FROM daily WHERE date >= ?", (dates[0],))}
        return {"dates": dates, "series": {
            key: [round(rows[d][self.COLUMNS.index(col)], 2) if d in rows else None for d in dates]
            for key, col in self.STAT_KEYS.items()}}


def search():
    """Broadcast an UDP 48899, Antwort "IP,MAC,Name". Gibt die erste IP zurück oder None."""
    try:
        import goodwe
        raw = asyncio.run(goodwe.search_inverters()).decode(errors="replace").strip()
    except Exception as exc:
        print(f"Kein Wechselrichter gefunden: {exc}", file=sys.stderr)
        return None
    print(f"Wechselrichter gefunden: {raw}")
    return raw.split(",")[0] or None


def load_config():
    try:
        return json.loads(CONFIG_FILE.read_text())
    except (OSError, ValueError):
        return {}


def save_config(cfg):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2))
    try:
        CONFIG_FILE.chmod(0o600)  # nur der eigene Benutzer darf lesen
    except OSError:
        pass


def build_source(cfg):
    sems = Sems(cfg["account"], pwd_hash=cfg["pwd_hash"]) if cfg.get("account") and cfg.get("pwd_hash") else None
    if cfg.get("inverter"):
        return LocalSource(cfg["inverter"], sems)
    return LiveSource(sems) if sems else None


def stop(source):
    if isinstance(source, LocalSource):
        source.running = False


class App:
    """Hält die aktive Datenquelle; die Einrichtung kann sie im laufenden Betrieb austauschen."""

    def __init__(self, source, cfg, fixed=False):
        self.source, self.cfg, self.fixed = source, cfg, fixed
        self.lan_url = None  # Adresse fürs Handy, nur mit --lan
        self.lock = threading.Lock()

    def kind(self):
        src = self.source
        return ("demo" if isinstance(src, DemoSource) else "local" if isinstance(src, LocalSource)
                else "sems" if src else "setup")

    def setup(self, body):
        """Prüft die Angaben (Verbindung bzw. Login) und speichert sie erst bei Erfolg."""
        cfg = dict(self.cfg)
        inverter = (body.get("inverter") or "").strip()
        account = (body.get("account") or "").strip()
        password = body.get("password") or ""
        cfg["inverter"] = inverter or None
        if account and password:
            cfg["account"], cfg["pwd_hash"] = account, password_hash(password)
        elif not account:
            cfg.pop("account", None), cfg.pop("pwd_hash", None)
        elif account != self.cfg.get("account"):
            raise ValueError("Bitte Passwort für das neue SEMS-Konto eingeben.")
        if not cfg.get("inverter") and not cfg.get("pwd_hash"):
            raise ValueError("Wechselrichter-IP oder SEMS-Login angeben.")
        if cfg.get("pwd_hash"):
            try:
                Sems(cfg["account"], pwd_hash=cfg["pwd_hash"]).login()
            except Exception as exc:
                raise ValueError(f"SEMS-Login fehlgeschlagen: {exc}") from exc
        source = build_source(cfg)
        if isinstance(source, LocalSource):
            try:
                source.live("local")
            except Exception as exc:
                stop(source)
                raise ValueError(f"Wechselrichter {inverter} antwortet nicht: {exc}") from exc
        with self.lock:
            stop(self.source)
            self.source, self.cfg = source, cfg
        save_config(cfg)

    def status(self):
        return {"configured": self.source is not None, "source": self.kind(), "fixed": self.fixed,
                "inverter": self.cfg.get("inverter"), "account": self.cfg.get("account"),
                "lan_url": self.lan_url}


class DemoSource:
    """Plausible Fake-Daten (10 kWp mit Speicher) zum Testen ohne Account."""

    def stations(self):
        return [{"id": "demo-1", "name": "Demo-Anlage", "capacity": 10.0}]

    def live(self, sid):
        now = datetime.now()
        h = now.hour + now.minute / 60
        pv = round(max(0.0, 8.5 * math.sin(math.pi * (h - 6) / 14)) * random.uniform(0.85, 1.0), 2) if 6 < h < 20 else 0.0
        load = round(random.uniform(0.4, 2.5), 2)
        bat = round(max(-3.0, min(3.0, pv - load)) * 0.6, 2)
        grid = round(pv - load - bat, 2)
        return {"updated": now.astimezone().isoformat(timespec="seconds"),
                "flow": {"pv": pv, "load": load, "grid": grid, "battery": bat, "soc": 64.0},
                "devices": [{"sn": "DEMO10K-ET-0001", "type": "INVERTER", "status": "ONLINE", "pac": pv,
                             "temp": 38.5, "vac": 231.2, "eday": round(pv * 4.1, 1), "etotal": 18234.7},
                            {"sn": "DEMO-METER-01", "type": "SMART_METER", "status": "ONLINE"}]}

    def stats(self, sid, days):
        rnd = random.Random(42)
        dates = [(date.today() - timedelta(days=days - 1 - i)).isoformat() for i in range(days)]
        prod = [round(rnd.uniform(8, 48), 1) for _ in dates]
        cons = [round(rnd.uniform(12, 22), 1) for _ in dates]
        selfc = [round(min(p, c) * 0.8, 1) for p, c in zip(prod, cons)]
        return {"dates": dates, "series": {
            "proSystemTotalStats": prod, "proConsumStats": cons, "proSelfConsumStats": selfc,
            "proGridStats": [round(p - s, 1) for p, s in zip(prod, selfc)],
            "proPurchaseStats": [round(c - s, 1) for c, s in zip(cons, selfc)]}}


def make_handler(app):
    class Handler(BaseHTTPRequestHandler):
        def send(self, code, body, ctype="application/json; charset=utf-8"):
            data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Source", app.kind())
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            url = urlparse(self.path)
            q = {k: v[0] for k, v in parse_qs(url.query).items()}
            source = app.source
            try:
                if url.path in ("/", "/dashboard.html"):
                    return self.send(200, (HERE / "dashboard.html").read_bytes(), "text/html; charset=utf-8")
                if url.path == "/api/setup":
                    return self.send(200, app.status())
                if url.path == "/api/qr" and app.lan_url:
                    import io
                    import qrcode
                    import qrcode.image.svg
                    buf = io.BytesIO()
                    qrcode.make(app.lan_url, image_factory=qrcode.image.svg.SvgPathImage, border=2).save(buf)
                    return self.send(200, buf.getvalue(), "image/svg+xml")
                if source is None and url.path.startswith("/api/"):
                    return self.send(503, {"error": "Noch nicht eingerichtet"})
                if url.path == "/api/stations":
                    return self.send(200, source.stations())
                if url.path == "/api/live" and q.get("id"):
                    return self.send(200, source.live(q["id"]))
                if url.path == "/api/stats" and q.get("id"):
                    days = max(1, min(366, int(q.get("days", 7))))
                    return self.send(200, source.stats(q["id"], days))
                self.send(404, {"error": "not found"})
            except Exception as exc:  # Fehler an das Dashboard durchreichen
                self.send(502, {"error": str(exc)})

        def do_POST(self):
            try:
                length = min(int(self.headers.get("Content-Length") or 0), 10_000)
                body = json.loads(self.rfile.read(length) or b"{}")
                if self.path == "/api/setup/search":
                    return self.send(200, {"inverter": search()})
                if self.path == "/api/setup":
                    if app.fixed:
                        return self.send(409, {"error": "Quelle per Kommandozeile festgelegt"})
                    app.setup(body)
                    return self.send(200, app.status())
                self.send(404, {"error": "not found"})
            except ValueError as exc:
                self.send(400, {"error": str(exc)})
            except Exception as exc:
                self.send(502, {"error": str(exc)})

        def log_message(self, fmt, *args):
            pass

    return Handler


def main():
    if sys.stdout is None:  # pythonw (Windows-Autostart) hat keine Konsole -> Log-Datei
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        sys.stdout = sys.stderr = open(CONFIG_DIR / "server.log", "a", buffering=1, encoding="utf-8")
    if "--search" in sys.argv:
        search()
        return
    cfg, fixed = load_config(), True
    account, password = os.environ.get("SEMS_USER"), os.environ.get("SEMS_PASSWORD")
    sems = Sems(account, password) if account and password else None
    if "--demo" in sys.argv:
        source = DemoSource()
    elif "--local" in sys.argv:
        i = sys.argv.index("--local") + 1
        host = sys.argv[i] if i < len(sys.argv) and not sys.argv[i].startswith("--") else search()
        if not host:
            sys.exit("Kein Wechselrichter gefunden. PC im selben WLAN? Sonst IP angeben: --local 192.168.1.50")
        source = LocalSource(host, sems)
    elif sems:
        source = LiveSource(sems)
    else:
        fixed = False
        if not cfg:  # erster Start: Wechselrichter automatisch suchen und merken
            host = search()
            if host:
                cfg = {"inverter": host}
                save_config(cfg)
        source = build_source(cfg)
        if source is None:
            print("Noch nicht eingerichtet: Einrichtung im Dashboard öffnen.")
    app = App(source, cfg, fixed)
    port = int(os.environ.get("PORT", 8080))
    bind = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    server = ThreadingHTTPServer((bind, port), make_handler(app))
    print(f"PV-Dashboard: http://127.0.0.1:{port}  ({app.kind()})")
    if bind == "0.0.0.0":
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("10.255.255.255", 1))  # sendet nichts, ermittelt nur die eigene LAN-IP
            app.lan_url = f"http://{sock.getsockname()[0]}:{port}"
        print(f"Im WLAN (Handy):  {app.lan_url}")
    server.serve_forever()


if __name__ == "__main__":
    main()
