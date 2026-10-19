"""Planfunktionen auf Bauherren-Ebene: Räume, Fenster, Fassade.

Alle Längen in Metern (Archicad-API-Einheit).
"""

from .client import ArchicadClient, ArchicadError, item_errors

# Annahme: Bei einer nicht gespiegelten Wand liegt die Referenzseite (referenceMaterial)
# links der Zeichenrichtung Anfang -> Ende. Beim ersten Test in Archicad prüfen;
# falls die Fassade innen eingefärbt wird, auf False setzen.
REFERENCE_SIDE_IS_LEFT = True


def _ids(elements: list[dict]) -> list[dict]:
    return [{"elementId": e["elementId"]} for e in elements if "elementId" in e]


def _guid(element_id: dict | None) -> str | None:
    return element_id.get("guid") if element_id else None


class Plan:
    def __init__(self, client: ArchicadClient):
        self.client = client

    # ---------- Lesen ----------

    def _elements_by_type(self, element_type: str) -> list[dict]:
        response = self.client.run_tapir("GetElementsByType", {"elementType": element_type})
        return _ids(response.get("elements", []))

    def _details(self, elements: list[dict]) -> list[dict]:
        if not elements:
            return []
        return self.client.run_tapir("GetDetailsOfElements", {"elements": elements})["detailsOfElements"]

    def rooms(self) -> list[dict]:
        """Alle Räume (Archicad-Zonen) mit Name, Nummer und Umriss."""
        zones = self._elements_by_type("Zone")
        result = []
        for zone, info in zip(zones, self._details(zones)):
            details = info.get("details", {})
            result.append({
                "id": zone["elementId"]["guid"],
                "name": details.get("name", ""),
                "number": details.get("numberStr", ""),
                "floorIndex": info.get("floorIndex"),
                "outline": details.get("polygonOutline", []),
            })
        return result

    def find_rooms(self, query: str) -> list[dict]:
        q = query.strip().lower()
        return [r for r in self.rooms() if q in r["name"].lower() or q == r["number"].lower()]

    def windows(self, room: str | None = None) -> list[dict]:
        """Alle Fenster mit Maßen und den Räumen auf beiden Seiten; optional nach Raumname gefiltert."""
        windows = self._elements_by_type("Window")
        if not windows:
            return []
        details = self._details(windows)
        relations = self.client.run_tapir("GetRelationsOfElements", {"elements": windows})["relations"]
        room_names = {r["id"]: r["name"] for r in self.rooms()}

        result = []
        for window, info, relation in zip(windows, details, relations):
            d = info.get("details", {})
            opening = relation.get("openingRelations", {}) if isinstance(relation, dict) else {}
            sides = [room_names.get(_guid(opening.get(k))) for k in ("fromRoom", "toRoom")]
            result.append({
                "id": window["elementId"]["guid"],
                "width": d.get("width"),
                "height": d.get("height"),
                "sillHeight": d.get("sillHeight"),
                "floorIndex": info.get("floorIndex"),
                "rooms": [s for s in sides if s],
            })
        if room:
            q = room.strip().lower()
            result = [w for w in result if any(q in name.lower() for name in w["rooms"])]
        return result

    def surfaces(self, search: str | None = None) -> list[dict]:
        """Oberflächen-Attribute (Materialien für die 3D-Darstellung)."""
        attributes = self.client.run_tapir("GetAttributesByType", {"attributeType": "Surface"})["attributes"]
        result = [{"id": a["attributeId"]["guid"], "name": a["name"]} for a in attributes]
        if search:
            q = search.strip().lower()
            result = [s for s in result if q in s["name"].lower()]
        return result

    # ---------- Ändern ----------

    def resize_windows(self, window_ids: list[str], width: float | None = None,
                       height: float | None = None, sill_height: float | None = None) -> str:
        if width is None and height is None and sill_height is None:
            raise ArchicadError("Keine neue Breite, Höhe oder Parapethöhe angegeben.")
        for name, value in (("Breite", width), ("Höhe", height)):
            if value is not None and not 0.2 <= value <= 6.0:
                raise ArchicadError(f"{name} {value} m ist unplausibel (erlaubt 0,2–6 m).")
        changes = {k: v for k, v in (("width", width), ("height", height), ("sillHeight", sill_height)) if v is not None}
        items = [{"elementId": {"guid": guid}, **changes} for guid in window_ids]
        response = self.client.run_tapir("ModifyWindows", {"windowsWithDetails": items})
        errors = item_errors(response.get("executionResults", []))
        if errors:
            raise ArchicadError("ModifyWindows: " + "; ".join(errors))
        return f"{len(items)} Fenster geändert: {changes}"

    def facade_walls(self) -> list[dict]:
        """Außenwände mit der Seite, auf der die Fassade liegt ("reference" oder "opposite")."""
        rooms = self.rooms()
        if not rooms:
            raise ArchicadError("Keine Räume (Zonen) im Projekt – ohne Zonen ist die Fassade nicht bestimmbar.")
        response = self.client.run_tapir("GetZoneBoundaries", {"zones": [{"elementId": {"guid": r["id"]}} for r in rooms]})

        # Wand-GUID -> Räume, an die die Wand als Außengrenze stößt
        inner_rooms: dict[str, list[dict]] = {}
        for room, boundaries in zip(rooms, response.get("zoneBoundariesOfZones", [])):
            for boundary in boundaries.get("zoneBoundaries", []):
                if boundary.get("isExternal"):
                    inner_rooms.setdefault(boundary["connectedElementId"]["guid"], []).append(room)
        if not inner_rooms:
            return []

        candidates = [{"elementId": {"guid": g}} for g in inner_rooms]
        result = []
        for info in self._details(candidates):
            if info.get("type") != "Wall":
                continue
            d = info["details"]
            side = _exterior_side(d, inner_rooms[info["id"]])
            if side:
                result.append({"id": info["id"], "side": side})
        return result

    def set_facade_surface(self, surface_id: str) -> str:
        walls = self.facade_walls()
        if not walls:
            raise ArchicadError("Keine Außenwände gefunden.")
        material = {"overridden": True, "attributeId": {"guid": surface_id}}
        items = [{"elementId": {"guid": w["id"]},
                  ("referenceMaterial" if w["side"] == "reference" else "oppositeMaterial"): material}
                 for w in walls]
        response = self.client.run_tapir("ModifyWalls", {"wallsWithDetails": items})
        errors = item_errors(response.get("executionResults", []))
        if errors:
            raise ArchicadError("ModifyWalls: " + "; ".join(errors))
        return f"Fassadenoberfläche an {len(items)} Außenwänden gesetzt."


def _inside(point: tuple[float, float], polygon: list[dict]) -> bool:
    """Punkt-in-Polygon (Strahlverfahren)."""
    x, y = point
    inside = False
    n = len(polygon)
    for i in range(n):
        a, b = polygon[i], polygon[(i + 1) % n]
        if (a["y"] > y) != (b["y"] > y):
            if x < a["x"] + (y - a["y"]) * (b["x"] - a["x"]) / (b["y"] - a["y"]):
                inside = not inside
    return inside


def _exterior_side(wall: dict, rooms: list[dict]) -> str | None:
    """Welche Wandseite zeigt nach außen? Geprüft wird ein Punkt knapp links und rechts der Wandmitte:
    Die Seite, auf der ein angrenzender Raum liegt, ist innen."""
    beg, end = wall.get("begCoordinate"), wall.get("endCoordinate")
    if not beg or not end:
        return None
    dx, dy = end["x"] - beg["x"], end["y"] - beg["y"]
    length = (dx * dx + dy * dy) ** 0.5
    if length == 0:
        return None
    nx, ny = -dy / length, dx / length  # Normale nach links
    mx, my = (beg["x"] + end["x"]) / 2, (beg["y"] + end["y"]) / 2
    distance = (wall.get("begThickness") or 0.3) + 0.25
    left = (mx + nx * distance, my + ny * distance)
    right = (mx - nx * distance, my - ny * distance)
    in_left = any(_inside(left, r["outline"]) for r in rooms if r["outline"])
    in_right = any(_inside(right, r["outline"]) for r in rooms if r["outline"])
    if in_left == in_right:
        return None
    reference_is_left = REFERENCE_SIDE_IS_LEFT != bool(wall.get("flipped"))
    # Fassade = Seite ohne Raum
    return "opposite" if in_left == reference_is_left else "reference"
