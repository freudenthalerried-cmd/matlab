#!/usr/bin/env python3
"""Lokaler Server für das PV-Dashboard: liefert dashboard.html und normalisierte SEMS-Daten.

Start:  SEMS_USER=... SEMS_PASSWORD=... python3 sems/server.py   -> http://127.0.0.1:8080
Lokal:  python3 sems/server.py --local 192.168.1.50   (direkt per WLAN, braucht: pip install goodwe)
Suchen: python3 sems/server.py --search                (Wechselrichter im Netz finden)
Demo:   python3 sems/server.py --demo
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
from sems_client import Sems  # noqa: E402

HERE = Path(__file__).resolve().parent
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
    """Live-Werte direkt vom Wechselrichter (UDP 8899 über den WLAN-Stick), Verlauf optional aus SEMS."""

    def __init__(self, host, sems=None):
        super().__init__(sems)
        self.host = host
        self.inverter = None

    async def _read(self):
        import goodwe
        if self.inverter is None:
            self.inverter = await goodwe.connect(self.host)
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

    def stats(self, sid, days):
        if self.sems and sid != "local":
            return super().stats(sid, days)
        return {"dates": [], "series": {}}


def search():
    import goodwe
    try:
        raw = asyncio.run(goodwe.search_inverters())
    except Exception as exc:
        sys.exit(f"Kein Wechselrichter gefunden ({exc}). PC im selben WLAN wie der Wechselrichter?")
    print(raw.decode(errors="replace"))  # Format: IP,MAC,Name


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


def make_handler(source):
    class Handler(BaseHTTPRequestHandler):
        def send(self, code, body, ctype="application/json; charset=utf-8"):
            data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Source", "demo" if isinstance(source, DemoSource) else "sems")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            url = urlparse(self.path)
            q = {k: v[0] for k, v in parse_qs(url.query).items()}
            try:
                if url.path in ("/", "/dashboard.html"):
                    return self.send(200, (HERE / "dashboard.html").read_bytes(), "text/html; charset=utf-8")
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

        def log_message(self, fmt, *args):
            pass

    return Handler


def main():
    demo = "--demo" in sys.argv
    if "--search" in sys.argv:
        return search()
    account, password = os.environ.get("SEMS_USER"), os.environ.get("SEMS_PASSWORD")
    if demo:
        source = DemoSource()
    elif "--local" in sys.argv:
        host = sys.argv[sys.argv.index("--local") + 1]
        source = LocalSource(host, Sems(account, password) if account and password else None)
    else:
        if not account or not password:
            sys.exit("SEMS_USER und SEMS_PASSWORD setzen, oder --local <IP> bzw. --demo verwenden.")
        source = LiveSource(Sems(account, password))
    port = int(os.environ.get("PORT", 8080))
    server = ThreadingHTTPServer(("127.0.0.1", port), make_handler(source))
    print(f"PV-Dashboard: http://127.0.0.1:{port}  ({type(source).__name__})")
    server.serve_forever()


if __name__ == "__main__":
    main()
