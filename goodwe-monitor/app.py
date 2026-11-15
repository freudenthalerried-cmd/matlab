#!/usr/bin/env python3
"""GoodWe-Monitor: lokales Web-Dashboard für GoodWe-Wechselrichter + Batterie.

Start:  python app.py                (sucht den Wechselrichter automatisch im WLAN)
        python app.py --host 192.168.1.50
        python app.py --demo         (Testdaten ohne Wechselrichter)
Danach im Browser: http://localhost:8080  (vom Handy: http://<PC-IP>:8080)

Liest nur Werte aus (UDP-Port 8899), ändert keine Einstellungen am Gerät.
"""
import argparse
import asyncio
import json
import math
import random
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

STATE = {"ok": False, "error": "Verbinde …", "info": {}, "sensors": [], "ts": 0}
LOCK = threading.Lock()
HTML = Path(__file__).with_name("dashboard.html")


def publish(**kw):
    with LOCK:
        STATE.update(kw, ts=time.time())


async def find_host():
    import goodwe
    raw = await goodwe.search_inverters()  # Antwort: "IP,MAC,Name"
    return raw.decode("utf-8", "ignore").split(",")[0].strip()


async def poll(host, interval):
    import goodwe
    inv = None
    while True:
        try:
            if inv is None:
                if not host:
                    publish(ok=False, error="Suche Wechselrichter im Netzwerk …")
                    host = await find_host()
                inv = await goodwe.connect(host, timeout=2, retries=3)
                info = {"Modell": inv.model_name, "Seriennummer": inv.serial_number,
                        "Firmware": inv.firmware, "IP": host,
                        "Nennleistung": f"{inv.rated_power} W"}
            data = await inv.read_runtime_data()
            sensors = [{"id": s.id_, "name": s.name, "unit": s.unit,
                        "value": str(data[s.id_]) if not isinstance(data[s.id_], (int, float)) else data[s.id_]}
                       for s in inv.sensors() if s.id_ in data]
            publish(ok=True, error="", info=info, sensors=sensors)
        except Exception as e:  # Verbindung weg -> neu verbinden
            publish(ok=False, error=f"{type(e).__name__}: {e}")
            inv = None
        await asyncio.sleep(interval)


async def demo(interval):
    t0, soc = time.time(), 62.0
    while True:
        t = time.time() - t0
        pv = max(0, round(3200 + 1500 * math.sin(t / 30) + random.uniform(-80, 80)))
        load = round(900 + 400 * math.sin(t / 11) + random.uniform(-50, 50))
        bat = -min(2500, pv - load) if pv > load and soc < 100 else min(1500, load - pv) if soc > 10 else 0
        soc = min(100, max(10, soc - bat / 40000))
        grid = pv + bat - load
        s = lambda i, n, v, u: {"id": i, "name": n, "value": v, "unit": u}
        publish(ok=True, error="", info={"Modell": "DEMO GW10K-ET", "Seriennummer": "DEMO", "IP": "-"}, sensors=[
            s("ppv", "PV Power", pv, "W"), s("pv1_power", "PV1 Power", round(pv * .55), "W"),
            s("pv2_power", "PV2 Power", round(pv * .45), "W"), s("house_consumption", "House Consumption", load, "W"),
            s("pbattery1", "Battery Power", round(bat), "W"), s("battery_soc", "Battery State of Charge", round(soc), "%"),
            s("battery_mode_label", "Battery Mode", "Discharge" if bat > 0 else "Charge" if bat < 0 else "Standby", ""),
            s("battery_temperature", "Battery Temperature", 24.5, "C"), s("battery_soh", "Battery State of Health", 99, "%"),
            s("vbattery1", "Battery Voltage", 412.3, "V"), s("active_power", "Active Power", round(grid), "W"),
            s("grid_in_out_label", "On-grid Mode", "Exporting" if grid > 0 else "Importing", ""),
            s("e_day", "Today's PV Generation", 14.2, "kWh"), s("e_total", "Total PV Generation", 8431.5, "kWh"),
            s("temperature", "Inverter Temperature (Air)", 38.1, "C"), s("work_mode_label", "Work Mode", "Normal (On-Grid)", ""),
        ])
        await asyncio.sleep(interval)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/data"):
            with LOCK:
                body, ctype = json.dumps(STATE).encode(), "application/json"
        elif self.path in ("/", "/index.html"):
            body, ctype = HTML.read_bytes(), "text/html; charset=utf-8"
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


def main():
    p = argparse.ArgumentParser(description="GoodWe-Monitor")
    p.add_argument("--host", help="IP des Wechselrichters (sonst automatische Suche)")
    p.add_argument("--port", type=int, default=8080, help="Port des Dashboards")
    p.add_argument("--interval", type=int, default=5, help="Abfrage-Intervall in Sekunden")
    p.add_argument("--demo", action="store_true", help="Testdaten ohne Wechselrichter")
    a = p.parse_args()
    job = demo(a.interval) if a.demo else poll(a.host, a.interval)
    threading.Thread(target=lambda: asyncio.run(job), daemon=True).start()
    print(f"Dashboard: http://localhost:{a.port}   (Strg+C beendet)")
    try:
        ThreadingHTTPServer(("0.0.0.0", a.port), Handler).serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
