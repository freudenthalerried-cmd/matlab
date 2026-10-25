#!/usr/bin/env python3
"""Schreibt einen kompletten Daten-Snapshot (Anlagen, Live-Werte, Statistik) als JSON.

Wird von .github/workflows/sems-data.yml alle 15 min ausgeführt.
Usage: SEMS_USER=... SEMS_PASSWORD=... python3 sems/snapshot.py out.json [--demo]
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sems_client import Sems  # noqa: E402
from server import DemoSource, LiveSource  # noqa: E402

PERIODS = (7, 30, 365)


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "live.json")
    if "--demo" in sys.argv:
        source = DemoSource()
    else:
        account, password = os.environ.get("SEMS_USER"), os.environ.get("SEMS_PASSWORD")
        if not account or not password:
            sys.exit("SEMS_USER und SEMS_PASSWORD fehlen (GitHub-Secrets anlegen).")
        source = LiveSource(Sems(account, password))
    stations = source.stations()
    snapshot = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "stations": stations,
        "live": {s["id"]: source.live(s["id"]) for s in stations},
        "stats": {s["id"]: {str(d): source.stats(s["id"], d) for d in PERIODS} for s in stations},
    }
    out.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")))
    print(f"{out}: {len(stations)} Anlage(n), {out.stat().st_size} Bytes")


if __name__ == "__main__":
    main()
