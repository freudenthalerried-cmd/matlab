#!/usr/bin/env python3
"""Minimal GoodWe SEMS / SEMS+ client (stdlib only).

Credentials come from the environment: SEMS_USER, SEMS_PASSWORD.
Usage: python3 sems_client.py stations|devices|flow|telemetry|stats|legacy [station_id]
"""

import base64
import hashlib
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timedelta

LOGIN_URL = "https://semsplus.goodwe.com/web/sems/sems-user/api/v1/auth/cross-login"
GATEWAY_FALLBACK = "https://eu-gateway.semsportal.com/web/sems"
LEGACY_LOGIN_URL = "https://www.semsportal.com/api/v3/Common/CrossLogin"
SUCCESS = (0, "0", "00000")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"


def signature(token):
    # base64("sha256(ms@uid@token)@ms"), ms = epoch milliseconds
    ms = round(time.time() * 1000)
    digest = hashlib.sha256(f"{ms}@{token.get('uid', '')}@{token.get('token', '')}".encode()).hexdigest()
    return base64.b64encode(f"{digest}@{ms}".encode()).decode()


def http(method, url, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


class Sems:
    def __init__(self, account, password):
        self.account = account
        self.password = password
        self.token = None
        self.api = GATEWAY_FALLBACK

    def login(self):
        # pwd = base64(md5_hex(password))
        pwd = base64.b64encode(hashlib.md5(self.password.encode()).hexdigest().encode()).decode()
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://semsplus.goodwe.com",
            "Referer": "https://semsplus.goodwe.com/",
            "User-Agent": UA,
            "Token": json.dumps({"uid": "", "timestamp": 0, "token": "", "client": "semsPlusWeb", "version": "", "language": "en"}),
            "X-Signature": signature({}),
        }
        body = http("POST", LOGIN_URL, headers, {"account": self.account, "pwd": pwd, "agreement": 1, "isChinese": False, "isLocal": False})
        if body.get("code") not in SUCCESS or not isinstance(body.get("data"), dict):
            raise RuntimeError(f"Login failed: code={body.get('code')} msg={body.get('msg')}")
        self.token = body["data"]
        api = body.get("api") or self.token.get("api")
        if isinstance(api, str) and api.startswith("https://"):
            self.api = api.rstrip("/")

    def call(self, path, method="GET", payload=None):
        if self.token is None:
            self.login()
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": UA,
            "Token": json.dumps(self.token),
            "X-Signature": signature(self.token),
        }
        body = http(method, self.api + path, headers, payload)
        if body.get("code") not in SUCCESS:
            raise RuntimeError(f"{path}: code={body.get('code')} msg={body.get('msg')}")
        return body.get("data")

    def stations(self):
        return self.call("/sems-plant/api/portal/stations/page", "POST", {"current": 1, "size": 100})

    def devices(self, sid):
        return self.call(f"/sems-plant/api/stations/device/all-status?stationId={sid}")

    def flow(self, sid):
        return self.call(f"/sems-plant/api/stations/flow?stationId={sid}")

    def telemetry(self, sid):
        out = {}
        for group in (self.devices(sid) or {}).get("deviceDetailList", []):
            dtype = group.get("deviceType")
            for status in group.get("statusDetailList", []):
                for sn in status.get("snList", []):
                    q = f"?deviceType={dtype}&pwId={sid}"
                    out[sn] = {
                        "deviceType": dtype,
                        "telemetry": self.call(f"/sems-plant/api/equipments/{sn}/telemetry{q}"),
                        "telecounting": self.call(f"/sems-plant/api/equipments/{sn}/telecounting{q}"),
                    }
        return out

    def stats(self, sid, days=7):
        end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=0)
        start = (end - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0)
        items = ["proSystemTotalStats", "proPurchaseStats", "proGridStats", "proConsumStats",
                 "proSelfConsumStats", "proCharStats", "proDischarStats"]
        return self.call("/sems-plant/api/stations/statistics", "POST", {
            "stationId": sid, "isReport": False, "items": items, "dimension": "day",
            "startTime": start.strftime("%Y-%m-%d %H:%M:%S"), "endTime": end.strftime("%Y-%m-%d %H:%M:%S"),
        })


def legacy_monitor(account, password, sid):
    """Classic API (pre SEMS+): plaintext pwd, v2 monitor detail. May be disabled for migrated accounts."""
    headers = {"Content-Type": "application/json", "Accept": "application/json",
               "Token": json.dumps({"version": "3.1.1", "client": "ios", "language": "en"})}
    body = http("POST", LEGACY_LOGIN_URL, headers, {"account": account, "pwd": password})
    if body.get("code") not in SUCCESS:
        raise RuntimeError(f"Legacy login failed: code={body.get('code')} msg={body.get('msg')}")
    token = body["data"]
    api = (body.get("api") or "https://eu.semsportal.com/api/").rstrip("/")
    headers["Token"] = json.dumps(token)
    return http("POST", api + "/v2/PowerStation/GetMonitorDetailByPowerstationId", headers, {"powerStationId": sid})


def main():
    account, password = os.environ.get("SEMS_USER"), os.environ.get("SEMS_PASSWORD")
    if not account or not password:
        sys.exit("SEMS_USER und SEMS_PASSWORD setzen.")
    cmd = sys.argv[1] if len(sys.argv) > 1 else "stations"
    sid = sys.argv[2] if len(sys.argv) > 2 else None
    s = Sems(account, password)
    if cmd == "stations":
        result = s.stations()
    elif sid is None:
        sys.exit(f"{cmd} braucht eine station_id (siehe 'stations').")
    elif cmd == "legacy":
        result = legacy_monitor(account, password, sid)
    else:
        result = getattr(s, cmd)(sid)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
