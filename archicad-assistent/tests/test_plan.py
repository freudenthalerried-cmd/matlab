"""Tests gegen ein simuliertes Archicad: 6 x 4 m Haus, Wände gegen den Uhrzeigersinn gezeichnet,
Wohnzimmer links, Küche rechts, je ein Fenster in der Südwand."""

from types import SimpleNamespace

import pytest

from archicad_assistent.assistant import Assistant
from archicad_assistent.client import ArchicadError
from archicad_assistent.plan import Plan

LIVING = {"x": 0, "y": 0}, {"x": 4, "y": 0}, {"x": 4, "y": 4}, {"x": 0, "y": 4}
KITCHEN = {"x": 4, "y": 0}, {"x": 6, "y": 0}, {"x": 6, "y": 4}, {"x": 4, "y": 4}
WALLS = {  # gegen den Uhrzeigersinn -> Räume liegen links
    "w-sued": ((0, 0), (6, 0)), "w-ost": ((6, 0), (6, 4)),
    "w-nord": ((6, 4), (0, 4)), "w-west": ((0, 4), (0, 0)),
}


class FakeArchicad:
    def __init__(self):
        self.calls = []
        self.zones = {
            "z-wohn": {"name": "Wohnzimmer", "numberStr": "1", "polygonOutline": list(LIVING)},
            "z-kueche": {"name": "Küche", "numberStr": "2", "polygonOutline": list(KITCHEN)},
        }
        self.windows = {
            "f-wohn": {"width": 1.2, "height": 1.4, "sillHeight": 0.9, "room": "z-wohn"},
            "f-kueche": {"width": 0.8, "height": 1.0, "sillHeight": 1.1, "room": "z-kueche"},
        }

    def run_tapir(self, command, parameters=None):
        self.calls.append((command, parameters))
        guids = [e["elementId"]["guid"] for e in (parameters or {}).get("elements", [])]
        if command == "GetElementsByType":
            source = {"Zone": self.zones, "Window": self.windows}[parameters["elementType"]]
            return {"elements": [{"elementId": {"guid": g}} for g in source]}
        if command == "GetDetailsOfElements":
            return {"detailsOfElements": [self._details(g) for g in guids]}
        if command == "GetRelationsOfElements":
            return {"relations": [{"openingRelations": {"fromRoom": {"guid": self.windows[g]["room"]}}} for g in guids]}
        if command == "GetAttributesByType":
            return {"attributes": [
                {"attributeId": {"guid": "s-beton"}, "index": 1, "name": "Beton"},
                {"attributeId": {"guid": "s-weiss"}, "index": 2, "name": "Putz weiß"},
            ]}
        if command == "GetZoneBoundaries":
            boundaries = {
                "z-wohn": ["w-sued", "w-nord", "w-west"],
                "z-kueche": ["w-sued", "w-nord", "w-ost"],
            }
            return {"zoneBoundariesOfZones": [
                {"zoneBoundaries": [{"connectedElementId": {"guid": w}, "isExternal": True} for w in boundaries[z["elementId"]["guid"]]]}
                for z in parameters["zones"]
            ]}
        if command in ("ModifyWindows", "ModifyWalls"):
            key = "windowsWithDetails" if command == "ModifyWindows" else "wallsWithDetails"
            return {"executionResults": [{"success": True} for _ in parameters[key]]}
        raise AssertionError(command)

    def _details(self, guid):
        if guid in self.zones:
            return {"type": "Zone", "id": guid, "floorIndex": 0, "details": self.zones[guid]}
        if guid in self.windows:
            return {"type": "Window", "id": guid, "floorIndex": 0, "details": self.windows[guid]}
        (bx, by), (ex, ey) = WALLS[guid]
        return {"type": "Wall", "id": guid, "floorIndex": 0, "details": {
            "begCoordinate": {"x": bx, "y": by}, "endCoordinate": {"x": ex, "y": ey},
            "begThickness": 0.3, "flipped": False}}

    def last(self, command):
        return next(p for c, p in reversed(self.calls) if c == command)


@pytest.fixture
def fake():
    return FakeArchicad()


def test_windows_in_room(fake):
    windows = Plan(fake).windows("wohn")
    assert [w["id"] for w in windows] == ["f-wohn"]
    assert windows[0]["rooms"] == ["Wohnzimmer"]


def test_resize_windows_sends_only_given_values(fake):
    Plan(fake).resize_windows(["f-wohn"], width=1.4)
    assert fake.last("ModifyWindows") == {"windowsWithDetails": [{"elementId": {"guid": "f-wohn"}, "width": 1.4}]}


def test_resize_rejects_implausible_size(fake):
    with pytest.raises(ArchicadError):
        Plan(fake).resize_windows(["f-wohn"], width=14)


def test_facade_uses_side_without_room(fake):
    Plan(fake).set_facade_surface("s-weiss")
    items = fake.last("ModifyWalls")["wallsWithDetails"]
    assert {i["elementId"]["guid"] for i in items} == set(WALLS)
    # Räume liegen links = Referenzseite -> Fassade ist die Gegenseite
    assert all("oppositeMaterial" in i and "referenceMaterial" not in i for i in items)
    assert items[0]["oppositeMaterial"] == {"overridden": True, "attributeId": {"guid": "s-weiss"}}


def test_facade_flipped_wall_uses_reference_side(fake):
    original = fake._details
    fake._details = lambda g: ({**original(g), "details": {**original(g)["details"], "flipped": True}}
                               if g in WALLS else original(g))
    Plan(fake).set_facade_surface("s-weiss")
    assert all("referenceMaterial" in i for i in fake.last("ModifyWalls")["wallsWithDetails"])


def test_surface_search(fake):
    assert Plan(fake).surfaces("weiß") == [{"id": "s-weiss", "name": "Putz weiß"}]


# ---------- Assistent mit simuliertem Claude ----------

def _tool(id, name, input):
    return SimpleNamespace(type="tool_use", id=id, name=name, input=input)


def _text(text):
    return SimpleNamespace(type="text", text=text)


class FakeClaude:
    def __init__(self, responses):
        self.responses = list(responses)
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self.create))
        self.requests = []

    def create(self, **kwargs):
        self.requests.append(kwargs)
        stop, content = self.responses.pop(0)
        return SimpleNamespace(stop_reason=stop, content=content)


def test_assistant_resizes_after_confirmation(fake):
    claude = FakeClaude([
        ("tool_use", [_tool("t1", "list_windows", {"room": "wohn"})]),
        ("tool_use", [_tool("t2", "resize_windows", {"window_ids": ["f-wohn"], "width": 1.4, "height": 1.6})]),
        ("end_turn", [_text("Fenster im Wohnzimmer jetzt 140 × 160 cm.")]),
    ])
    asked = []
    answer = Assistant(Plan(fake), lambda d: asked.append(d) or True, client=claude).ask("Fenster im Wohnzimmer größer")
    assert "140" in answer
    assert asked == ["1 Fenster ändern: Breite 140 cm, Höhe 160 cm"]
    assert fake.last("ModifyWindows")["windowsWithDetails"][0]["height"] == 1.6


def test_assistant_declined_change_is_not_executed(fake):
    claude = FakeClaude([
        ("tool_use", [_tool("t1", "resize_windows", {"window_ids": ["f-wohn"], "width": 2.0})]),
        ("end_turn", [_text("Ok, nichts geändert.")]),
    ])
    Assistant(Plan(fake), lambda d: False, client=claude).ask("Fenster breiter")
    assert not any(c == "ModifyWindows" for c, _ in fake.calls)
    result = claude.requests[1]["messages"][2]["content"][0]  # user, assistant, tool_result
    assert result["is_error"] and "abgelehnt" in result["content"]
