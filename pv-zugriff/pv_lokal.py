#!/usr/bin/env python3
"""PV-Zugriff lokal – liest den GoodWe-Wechselrichter direkt (UDP 8899), ohne SEMS-Konto.

Start:  python pv_lokal.py              (sucht den Wechselrichter automatisch)
        python pv_lokal.py 192.168.1.50 (feste IP; im Solar-WiFi: 10.10.100.253)
Dann im Browser (Handy im selben WLAN):  http://<IP-dieses-Geräts>:8080
Alle Messwerte werden zusätzlich in pv_daten_JJJJ-MM.csv gespeichert.
Nur LESEN – es werden keine Einstellungen am Wechselrichter geändert.
"""
import asyncio, csv, json, os, sys, threading, time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    import goodwe
except ImportError:
    sys.exit("Bitte zuerst installieren:  pip install goodwe")

PORT = int(os.environ.get("PV_PORT", 8080))
INTERVALL = int(os.environ.get("PV_INTERVALL", 30))  # Sekunden
ORDNER = os.path.dirname(os.path.abspath(__file__))
STAND = {"ok": False, "fehler": "Verbinde …", "zeit": None, "werte": [], "geraet": {}}


async def finde_ip():
    antwort = (await goodwe.search_inverters()).decode(errors="ignore")
    return antwort.split(",")[0].strip()


def speichere_csv(zeile):
    datei = os.path.join(ORDNER, f"pv_daten_{datetime.now():%Y-%m}.csv")
    neu = not os.path.exists(datei)
    with open(datei, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(zeile), delimiter=";")
        if neu:
            w.writeheader()
        w.writerow(zeile)


async def schleife(ip):
    wr = None
    while True:
        try:
            if wr is None:
                ip = ip or await finde_ip()
                wr = await goodwe.connect(ip, timeout=2, retries=3)
                STAND["geraet"] = {"ip": ip, "modell": wr.model_name, "seriennr": wr.serial_number, "firmware": wr.firmware}
            daten = await wr.read_runtime_data()
            werte = [{"id": s.id_, "name": s.name, "wert": daten[s.id_], "einheit": s.unit}
                     for s in wr.sensors() if s.id_ in daten and daten[s.id_] not in (None, "")]
            jetzt = datetime.now().isoformat(timespec="seconds")
            STAND.update(ok=True, fehler=None, zeit=jetzt, werte=werte)
            speichere_csv({"zeit": jetzt, **{w["id"]: w["wert"] for w in werte if isinstance(w["wert"], (int, float))}})
        except Exception as e:  # Verbindung weg -> neu verbinden
            STAND.update(ok=False, fehler=f"{type(e).__name__}: {e}")
            wr = None
        await asyncio.sleep(INTERVALL)


SEITE = """<!doctype html><html lang=de><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>PV lokal</title><style>
body{font:15px system-ui,sans-serif;margin:0;padding:14px;background:#eef0ec;color:#1d2622}
@media(prefers-color-scheme:dark){body{background:#141a17;color:#e6ece8}.k,.t{background:#1d2521!important;border-color:#2f3a35!important}}
h1{margin:0 0 4px;font-size:24px}.m{color:#5d6a64;font-size:13px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:12px 0}
.k{background:#fff;border:1px solid #d3d9d4;border-radius:8px;padding:10px}.k b{display:block;font-size:22px}
.t{background:#fff;border:1px solid #d3d9d4;border-radius:8px;padding:8px;overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:13px}td{padding:4px 6px;border-top:1px solid #d3d9d488}
.err{color:#b3261e;font-weight:600}</style>
<h1>☀ PV lokal</h1><div class=m id=info>Lade …</div><div class=g id=kacheln></div>
<details class=t><summary>Alle Werte</summary><table id=tab></table></details>
<script>
const WICHTIG=['ppv','house_consumption','active_power','battery_soc','pbattery1','e_day','e_total','e_bat_charge_day','e_bat_discharge_day','meter_e_total_exp','meter_e_total_imp'];
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function lade(){try{const d=await (await fetch('/api')).json(),g=d.geraet||{};
 document.getElementById('info').innerHTML=(d.ok?'':'<span class=err>'+esc(d.fehler||'')+'</span><br>')+esc([g.modell,g.seriennr,g.ip].filter(Boolean).join(' · '))+(d.zeit?' · Stand '+esc(d.zeit.replace('T',' ')):'');
 const W=d.werte||[];document.getElementById('kacheln').innerHTML=W.filter(w=>WICHTIG.includes(w.id)).sort((a,b)=>WICHTIG.indexOf(a.id)-WICHTIG.indexOf(b.id)).map(w=>`<div class=k>${esc(w.name)}<b>${esc(w.wert)} ${esc(w.einheit)}</b></div>`).join('');
 document.getElementById('tab').innerHTML=W.map(w=>`<tr><td>${esc(w.name)}<td>${esc(w.wert)} ${esc(w.einheit)}`).join('');
}catch(e){document.getElementById('info').innerHTML='<span class=err>Programm nicht erreichbar</span>';}}
lade();setInterval(lade,10000);
</script></html>"""


class Web(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api"):
            body, typ = json.dumps(STAND, default=str).encode(), "application/json"
        else:
            body, typ = SEITE.encode(), "text/html; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", typ)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    ip = sys.argv[1] if len(sys.argv) > 1 else None
    threading.Thread(target=lambda: ThreadingHTTPServer(("0.0.0.0", PORT), Web).serve_forever(), daemon=True).start()
    print(f"PV lokal läuft: http://localhost:{PORT}  (Beenden: Strg+C)")
    try:
        asyncio.run(schleife(ip))
    except KeyboardInterrupt:
        pass
