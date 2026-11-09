#!/usr/bin/env python3
"""Sonnenstand lokal: liest den GoodWe-Wechselrichter direkt im Heimnetz, ohne SEMS-Konto.

Der Wechselrichter (WLAN-Stick, UDP 8899; neuere LAN/WLAN-Kits Modbus-TCP 502) wird alle
POLL Sekunden abgefragt. Leistungen werden minutengenau gespeichert und zu Tages-, Monats-
und Jahresenergien aufsummiert (SQLite). Dazu liefert der Server die Sonnenstand-Oberfläche
(index.html im selben Ordner) aus, damit sie im Heimnetz am PC und am Handy läuft.

Start:   python server.py                 (sucht den Wechselrichter beim ersten Mal selbst)
         python server.py --local 192.168.1.50      feste IP (Modbus-TCP: 192.168.1.50:502)
         python server.py --demo                    Beispieldaten ohne Wechselrichter
Optionen: --port 8080   --localhost (nur am PC erreichbar, sonst im ganzen Heimnetz)
Daten:   %APPDATA%\\PV-Monitor  bzw.  ~/.config/PV-Monitor  (config.json, sonnenstand.db, server.log)
Es wird nur gelesen; am Wechselrichter wird nichts verändert.
"""

import asyncio
import json
import math
import os
import socket
import sqlite3
import sys
import threading
import time
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
CONFIG_DIR = Path(os.environ.get("APPDATA") or Path.home() / ".config") / "PV-Monitor"
CONFIG_FILE = CONFIG_DIR / "config.json"
POLL = 20            # Sekunden zwischen zwei Abfragen
KEEP_DAYS = 400      # Minutenwerte so lange aufheben; Tagessummen bleiben immer
VERSION = "1.0"


def num(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def kw(v):
    f = num(v)
    return None if f is None else round(f / 1000, 3)


def now_iso():
    return datetime.now().astimezone().isoformat(timespec="seconds")


# ---------------------------------------------------------------- Speicher
class Store:
    """SQLite: samples (eine Zeile je Abfrage, kW) und daily (kWh je Tag und Richtung)."""

    DAILY = ("pv", "last", "einsp", "bezug", "laden", "entladen")

    def __init__(self, path):
        self.path = str(path)
        self.lock = threading.Lock()
        with self.conn() as c:
            c.execute("CREATE TABLE IF NOT EXISTS samples (ts INTEGER PRIMARY KEY, pv REAL, last REAL, netz REAL, bat REAL, soc REAL)")
            c.execute("CREATE TABLE IF NOT EXISTS daily (day TEXT PRIMARY KEY, "
                      + ", ".join(f"{k} REAL NOT NULL DEFAULT 0" for k in self.DAILY) + ")")
            c.execute("CREATE INDEX IF NOT EXISTS samples_day ON samples (ts)")

    def conn(self):
        c = sqlite3.connect(self.path, check_same_thread=False, timeout=10)
        return c

    def add(self, ts, flow, hours):
        """Messwert ablegen und, wenn hours > 0, die Energie seit der letzten Messung aufsummieren."""
        day = datetime.fromtimestamp(ts).date().isoformat()
        g, b = flow.get("netz") or 0.0, flow.get("bat") or 0.0
        add = {"pv": flow.get("pv") or 0.0, "last": flow.get("last") or 0.0,
               "einsp": max(g, 0.0), "bezug": max(-g, 0.0), "entladen": max(b, 0.0), "laden": max(-b, 0.0)}
        with self.lock, self.conn() as c:
            c.execute("INSERT OR REPLACE INTO samples VALUES (?,?,?,?,?,?)",
                      (int(ts), flow.get("pv"), flow.get("last"), flow.get("netz"), flow.get("bat"), flow.get("soc")))
            if hours > 0:
                c.execute("INSERT OR IGNORE INTO daily (day) VALUES (?)", (day,))
                c.execute("UPDATE daily SET " + ", ".join(f"{k} = {k} + ?" for k in self.DAILY) + " WHERE day = ?",
                          [add[k] * hours for k in self.DAILY] + [day])

    def add_many(self, rows):
        """Für den Demo-Modus: viele Minutenwerte auf einmal (ts, pv, last, netz, bat, soc, hours)."""
        with self.lock, self.conn() as c:
            c.executemany("INSERT OR REPLACE INTO samples VALUES (?,?,?,?,?,?)", [r[:6] for r in rows])
            days = {}
            for ts, pv, last, netz, bat, soc, h in rows:
                d = days.setdefault(datetime.fromtimestamp(ts).date().isoformat(), [0.0] * 6)
                g, b = netz or 0.0, bat or 0.0
                for i, v in enumerate((pv or 0.0, last or 0.0, max(g, 0), max(-g, 0), max(-b, 0), max(b, 0))):
                    d[i] += v * h
            c.executemany("INSERT OR REPLACE INTO daily VALUES (?,?,?,?,?,?,?)", [(k, *v) for k, v in days.items()])

    def curve(self, day):
        """Minutenmittel eines Tages."""
        start = datetime.fromisoformat(day)
        a, b = int(start.timestamp()), int((start + timedelta(days=1)).timestamp())
        with self.conn() as c:
            rows = c.execute("SELECT (ts/60)*60 AS m, AVG(pv), AVG(last), AVG(netz), AVG(bat), AVG(soc) FROM samples "
                             "WHERE ts >= ? AND ts < ? GROUP BY m ORDER BY m", (a, b)).fetchall()
        r = lambda v: None if v is None else round(v, 3)
        return {"t": [datetime.fromtimestamp(m).astimezone().isoformat(timespec="minutes") for m, *_ in rows],
                "pv": [r(x[1]) for x in rows], "last": [r(x[2]) for x in rows], "netz": [r(x[3]) for x in rows],
                "bat": [r(x[4]) for x in rows], "soc": [None if x[5] is None else round(x[5]) for x in rows]}

    def stats(self, dim, frm, to):
        n = {"day": 10, "month": 7, "year": 4}.get(dim, 10)
        with self.conn() as c:
            rows = c.execute(f"SELECT substr(day,1,{n}) AS p, " + ", ".join(f"SUM({k})" for k in self.DAILY)
                             + " FROM daily WHERE day >= ? AND day <= ? GROUP BY p ORDER BY p", (frm, to)).fetchall()
        out = []
        for p, pv, last, einsp, bezug, laden, entladen in rows:
            out.append({"p": p, "pv": round(pv, 2), "last": round(last, 2), "einsp": round(einsp, 2), "bezug": round(bezug, 2),
                        "eigen": round(max(pv - einsp, 0.0), 2), "laden": round(laden, 2), "entladen": round(entladen, 2)})
        return out

    def first_day(self):
        with self.conn() as c:
            r = c.execute("SELECT MIN(day) FROM daily").fetchone()
        return r[0] if r else None

    def purge(self):
        cutoff = int((datetime.now() - timedelta(days=KEEP_DAYS)).timestamp())
        with self.lock, self.conn() as c:
            c.execute("DELETE FROM samples WHERE ts < ?", (cutoff,))


# ---------------------------------------------------------------- Wechselrichter
class Inverter:
    """Verbindung zum Wechselrichter über die Bibliothek goodwe; liest alle Sensoren."""

    def __init__(self, host):
        self.host = host
        self.inv = None
        self.raw = {}
        self.flow = None
        self.read_at = None
        self.error = "Noch keine Messung"
        self.meta = {}

    async def _connect(self):
        import goodwe
        host, _, port = self.host.partition(":")
        self.inv = await (goodwe.connect(host, port=int(port)) if port else goodwe.connect(host))
        self.meta = {"model": self.inv.model_name, "sn": self.inv.serial_number, "firmware": getattr(self.inv, "firmware", None),
                     "rated": kw(getattr(self.inv, "rated_power", None)), "host": self.host}

    async def _read(self):
        if self.inv is None:
            await self._connect()
        return await self.inv.read_runtime_data()

    def read(self):
        """Einmal lesen; gibt den normalisierten Fluss zurück (kW; Netz > 0 Einspeisung, Batterie > 0 Entladen)."""
        try:
            d = asyncio.run(self._read())
        except Exception as exc:
            self.inv = None
            self.error = f"{type(exc).__name__}: {exc}"
            raise
        self.raw = {k: v for k, v in d.items() if isinstance(v, (int, float, str))}
        g = d.get("active_power")                       # ET: Zählerleistung, > 0 Einspeisung
        if g is None:
            g = d.get("meter_active_power_total")
        if g is None:
            g = d.get("meter_active_power")             # DT mit Zähler
        if g is None and d.get("pgrid") is not None:    # ES: pgrid > 0 Bezug
            g = -num(d["pgrid"])
        bat = d.get("pbattery1")                        # > 0 Entladen
        self.flow = {"pv": kw(d.get("ppv")), "last": kw(d.get("house_consumption")), "netz": kw(g), "bat": kw(bat),
                     "soc": num(d.get("battery_soc")), "time": now_iso()}
        self.read_at = time.time()
        self.error = None
        return self.flow

    def devices(self):
        d, m = self.raw, self.meta
        out = [{"sn": m.get("sn"), "name": m.get("model") or "Wechselrichter", "type": "INVERTER", "status": 1 if not self.error else -1,
                "model": m.get("model"), "firmware": m.get("firmware"), "pac": kw(d.get("ppv")), "temp": num(d.get("temperature")),
                "vac": num(d.get("vgrid")), "eday": num(d.get("e_day")), "etotal": num(d.get("e_total"))}]
        if d.get("battery_soc") is not None:
            out.append({"sn": d.get("battery_sn") or "Batterie", "name": "Batterie", "type": "BATTERY_RACK", "status": 1,
                        "soc": num(d.get("battery_soc")), "pbat": kw(d.get("pbattery1")), "temp": num(d.get("battery_temperature")),
                        "eday": None, "etotal": None, "laden_heute": num(d.get("e_bat_charge_day")), "entladen_heute": num(d.get("e_bat_discharge_day"))})
        if any(k in d for k in ("meter_active_power_total", "meter_active_power", "meter_e_total_exp")):
            out.append({"sn": "Zähler", "name": "Smart Meter (GoodWe)", "type": "SMART_METER", "status": 1,
                        "pac": kw(d.get("meter_active_power_total", d.get("meter_active_power"))),
                        "einsp_gesamt": num(d.get("meter_e_total_exp")), "bezug_gesamt": num(d.get("meter_e_total_imp"))})
        return out


class DemoInverter(Inverter):
    """Beispieldaten: 9,9 kWp mit 10-kWh-Speicher, deterministischer Tagesverlauf."""

    def __init__(self):
        super().__init__("demo")
        self.meta = {"model": "GW10K-ET (Demo)", "sn": "DEMO9010KETU", "firmware": "demo", "rated": 10.0, "host": "demo"}
        self.soc = 40.0

    @staticmethod
    def factor(d):
        doy = d.timetuple().tm_yday
        season = 0.55 + 0.45 * math.cos((doy - 172) / 365 * 2 * math.pi)
        r = (math.sin(d.year * 7 + doy * 13.7) + 1) / 2
        return season * (0.35 + 0.65 * r)

    def sample(self, t, soc):
        h = t.hour + t.minute / 60
        sun = max(0.0, math.sin((h - 6.5) / 11 * math.pi))
        pv = 9.9 * self.factor(t.date()) * sun ** 1.3 * (0.9 + 0.1 * math.sin(t.minute))
        last = 0.35 + (0.9 if 6 < h < 9 else 0) + (1.4 if 17 < h < 22 else 0) + 0.2 * (math.sin(t.minute * 1.3) + 1) / 2
        bat = 0.0
        if pv > last and soc < 100:
            bat = -min(pv - last, 3.3); soc = min(100, soc - bat / 60 * 10)
        elif pv < last and soc > 10:
            bat = min(last - pv, 3.0); soc = max(10, soc - bat / 60 * 10)
        return {"pv": round(pv, 3), "last": round(last, 3), "netz": round(pv + bat - last, 3), "bat": round(bat, 3), "soc": round(soc)}, soc

    def read(self):
        f, self.soc = self.sample(datetime.now(), self.soc)
        f["time"] = now_iso()
        self.flow, self.read_at, self.error = f, time.time(), None
        self.raw = {"ppv": f["pv"] * 1000, "house_consumption": f["last"] * 1000, "active_power": f["netz"] * 1000, "pbattery1": f["bat"] * 1000,
                    "battery_soc": f["soc"], "e_day": 12.3, "e_total": 48213.0, "temperature": 38.5, "vgrid": 231.0,
                    "meter_active_power_total": f["netz"] * 1000, "meter_e_total_exp": 27210.0, "meter_e_total_imp": 12560.0}
        return f

    def backfill(self, store, days=45):
        rows, soc = [], 40.0
        start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days)
        t, end = start, datetime.now()
        while t < end:
            f, soc = self.sample(t, soc)
            rows.append((int(t.timestamp()), f["pv"], f["last"], f["netz"], f["bat"], f["soc"], 1 / 60))
            t += timedelta(minutes=1)
        store.add_many(rows)


def search():
    """UDP-Broadcast 48899; der Stick antwortet mit 'IP,MAC,Name'."""
    try:
        import goodwe
        raw = asyncio.run(goodwe.search_inverters()).decode(errors="replace").strip()
    except Exception as exc:
        print(f"Kein Wechselrichter gefunden: {exc}", file=sys.stderr)
        return None
    print(f"Wechselrichter gefunden: {raw}")
    return raw.split(",")[0].strip() or None


def load_config():
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save_config(cfg):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2), encoding="utf-8")


# ---------------------------------------------------------------- Anwendung
class App:
    def __init__(self, store, cfg, inverter=None, fixed=False):
        self.store, self.cfg, self.inverter, self.fixed = store, cfg, inverter, fixed
        self.lock = threading.Lock()
        self.last = None            # (zeit, fluss) der letzten erfolgreichen Messung
        self.lan_url = None
        threading.Thread(target=self.poll, daemon=True).start()

    def poll(self):
        n = 0
        while True:
            inv = self.inverter
            if inv is not None:
                try:
                    flow = inv.read()
                    ts = time.time()
                    hours = 0.0
                    if self.last is not None and datetime.fromtimestamp(self.last[0]).date() == datetime.fromtimestamp(ts).date():
                        hours = (ts - self.last[0]) / 3600
                        if hours > 0.25:   # Lücke (Wechselrichter nachts aus, PC aus) nicht hochrechnen
                            hours = 0.0
                    self.store.add(ts, flow, hours)
                    self.last = (ts, flow)
                except Exception as exc:
                    print(f"{datetime.now():%d.%m. %H:%M} Wechselrichter nicht erreichbar: {exc}", file=sys.stderr)
            n += 1
            if n % 2000 == 0:
                self.store.purge()
            time.sleep(POLL if not isinstance(inv, DemoInverter) else 60)

    def setup(self, body):
        host = (body.get("inverter") or "").strip()
        if not host:
            raise ValueError("Bitte die IP-Adresse des Wechselrichters angeben (oder „Suchen“).")
        inv = Inverter(host)
        try:
            inv.read()
        except Exception as exc:
            raise ValueError(f"Wechselrichter {host} antwortet nicht: {exc}") from exc
        with self.lock:
            self.inverter = inv
            self.cfg = {**self.cfg, "inverter": host}
            if body.get("pvKwp") is not None:
                self.cfg["pvKwp"] = num(body.get("pvKwp"))
            if body.get("batKwh") is not None:
                self.cfg["batKwh"] = num(body.get("batKwh"))
        save_config(self.cfg)

    def status(self):
        inv = self.inverter
        return {"local": True, "version": VERSION, "configured": inv is not None, "demo": isinstance(inv, DemoInverter), "fixed": self.fixed,
                "inverter": self.cfg.get("inverter") if not isinstance(inv, DemoInverter) else "demo",
                "model": inv.meta.get("model") if inv else None, "sn": inv.meta.get("sn") if inv else None,
                "error": inv.error if inv else "Noch kein Wechselrichter eingerichtet",
                "lastOk": datetime.fromtimestamp(inv.read_at).astimezone().isoformat(timespec="seconds") if inv and inv.read_at else None,
                "lan_url": self.lan_url, "pvKwp": self.cfg.get("pvKwp"), "batKwh": self.cfg.get("batKwh")}

    def info(self):
        inv = self.inverter
        return {"name": (inv.meta.get("model") if inv else None) or "Wechselrichter", "created": self.store.first_day(),
                "pvKwp": self.cfg.get("pvKwp") or (inv.meta.get("rated") if inv else None), "batKwh": self.cfg.get("batKwh"),
                "model": inv.meta.get("model") if inv else None, "sn": inv.meta.get("sn") if inv else None,
                "host": self.cfg.get("inverter"), "onGrid": None}

    def flow(self):
        inv = self.inverter
        if inv is None:
            raise ValueError("Noch kein Wechselrichter eingerichtet")
        if inv.flow is None or (inv.read_at and time.time() - inv.read_at > 3 * POLL):
            # letzter Wert zu alt oder noch keiner: sofort lesen
            try:
                flow = inv.read()
                self.store.add(time.time(), flow, 0.0)
                return flow
            except Exception as exc:
                if inv.flow:
                    return {**inv.flow, "stale": True, "error": str(exc)}
                raise
        return inv.flow


def make_handler(app):
    class Handler(BaseHTTPRequestHandler):
        def send(self, code, body, ctype="application/json; charset=utf-8"):
            data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            url = urlparse(self.path)
            q = {k: v[0] for k, v in parse_qs(url.query).items()}
            try:
                if url.path in ("/", "/index.html"):
                    page = HERE / "index.html"
                    if page.exists():
                        return self.send(200, page.read_bytes(), "text/html; charset=utf-8")
                    return self.send(200, b"<!doctype html><meta charset=utf-8><p>index.html fehlt neben server.py.", "text/html; charset=utf-8")
                if url.path == "/api/setup":
                    return self.send(200, app.status())
                if url.path == "/api/info":
                    return self.send(200, app.info())
                if url.path == "/api/flow":
                    return self.send(200, app.flow())
                if url.path == "/api/curve":
                    day = q.get("date") or date.today().isoformat()
                    date.fromisoformat(day)
                    return self.send(200, app.store.curve(day))
                if url.path == "/api/stats":
                    dim = q.get("dim", "day")
                    frm, to = q.get("from", date.today().isoformat()), q.get("to", date.today().isoformat())
                    return self.send(200, app.store.stats(dim, frm[:10], to[:10]))
                if url.path == "/api/devices":
                    return self.send(200, app.inverter.devices() if app.inverter else [])
                if url.path == "/api/raw":
                    return self.send(200, app.inverter.raw if app.inverter else {})
                self.send(404, {"error": "not found"})
            except ValueError as exc:
                self.send(400, {"error": str(exc)})
            except Exception as exc:
                self.send(502, {"error": str(exc)})

        def do_POST(self):
            try:
                length = min(int(self.headers.get("Content-Length") or 0), 10_000)
                body = json.loads(self.rfile.read(length) or b"{}")
                if self.path == "/api/setup/search":
                    return self.send(200, {"inverter": search()})
                if self.path == "/api/setup":
                    if app.fixed:
                        return self.send(409, {"error": "Quelle wurde per Kommandozeile festgelegt"})
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


def lan_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))   # sendet nichts, ermittelt nur die eigene Adresse
            return s.getsockname()[0]
    except OSError:
        return None


def main():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if sys.stdout is None:   # pythonw (Autostart) hat keine Konsole
        sys.stdout = sys.stderr = open(CONFIG_DIR / "server.log", "a", buffering=1, encoding="utf-8")
    else:
        for stream in (sys.stdout, sys.stderr):   # Windows-Konsole (cp1252) verträgt sonst keine Umlaute/Symbole
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except (AttributeError, ValueError):
                pass
    args = sys.argv[1:]
    if "--search" in args:
        search()
        return
    port = int(args[args.index("--port") + 1]) if "--port" in args else int(os.environ.get("PORT", 8080))
    cfg, fixed = load_config(), False
    if "--demo" in args:
        store = Store(CONFIG_DIR / "sonnenstand-demo.db")
        inv = DemoInverter()
        if store.first_day() is None:
            inv.backfill(store)
        fixed = True
    else:
        store = Store(CONFIG_DIR / "sonnenstand.db")
        inv = None
        if "--local" in args:
            i = args.index("--local") + 1
            host = args[i] if i < len(args) and not args[i].startswith("--") else search()
            if not host:
                sys.exit("Kein Wechselrichter gefunden. Ist der PC im selben WLAN? Sonst IP angeben: --local 192.168.1.50")
            inv, fixed = Inverter(host), True
        elif cfg.get("inverter"):
            inv = Inverter(cfg["inverter"])
        else:
            host = search()
            if host:
                cfg = {**cfg, "inverter": host}
                save_config(cfg)
                inv = Inverter(host)
            else:
                print("Noch nicht eingerichtet: Wechselrichter-IP in Sonnenstand (Einstellungen) eintragen.")
    app = App(store, cfg, inv, fixed)
    bind = "127.0.0.1" if "--localhost" in args else "0.0.0.0"
    server = ThreadingHTTPServer((bind, port), make_handler(app))
    print(f"Sonnenstand lokal v{VERSION}: http://127.0.0.1:{port}")
    if bind == "0.0.0.0":
        ip = lan_ip()
        if ip:
            app.lan_url = f"http://{ip}:{port}"
            print(f"Im Heimnetz (Handy): {app.lan_url}")
    server.serve_forever()


if __name__ == "__main__":
    main()
