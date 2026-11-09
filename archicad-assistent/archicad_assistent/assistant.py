"""Claude übersetzt deutsche Anweisungen ("mach das Fenster im Wohnzimmer größer")
in Planfunktionen. Ändernde Funktionen laufen erst nach Bestätigung."""

import json
from typing import Callable

import anthropic

from .client import ArchicadError
from .plan import Plan

MODEL = "claude-opus-5-5"

SYSTEM_PROMPT = """Du bist ein Assistent, der ein laufendes Archicad-Projekt für einen Bauherrn bzw. Planer steuert.
Antworte immer kurz auf Deutsch.

Arbeitsweise:
- Lies zuerst den Plan (Räume, Fenster, Oberflächen), bevor du etwas änderst. Rate keine IDs.
- Alle Maße sind in Metern. Nenne Maße in der Antwort in Zentimetern.
- "größer"/"kleiner" ohne Zahl: Breite und Höhe um je 20 cm ändern und das in der Antwort sagen.
- Gibt es mehrere passende Fenster und ist unklar, welches gemeint ist, frag nach statt alle zu ändern.
- Für Farben der Fassade wähle die am besten passende Oberfläche aus list_surfaces (z. B. "weiß" -> Putz weiß/White).
  Gibt es keine passende Oberfläche, sag das.
- Wurde eine Änderung abgelehnt, mach nicht weiter damit.
- Kannst du einen Wunsch mit den vorhandenen Werkzeugen nicht umsetzen, sag das klar."""

WRITE_TOOLS = {"resize_windows", "set_facade_surface"}

TOOLS = [
    {
        "name": "list_rooms",
        "description": "Listet alle Räume (Archicad-Zonen) mit ID, Name, Nummer und Geschoß-Index.",
        "input_schema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
    {
        "name": "list_windows",
        "description": "Listet Fenster mit ID, Breite, Höhe, Parapethöhe (m) und angrenzenden Räumen. "
                       "Optional nach Raumname filtern (Teilstring, z. B. 'wohn').",
        "input_schema": {
            "type": "object",
            "properties": {"room": {"type": "string", "description": "Teil des Raumnamens"}},
            "additionalProperties": False,
        },
    },
    {
        "name": "list_surfaces",
        "description": "Listet Oberflächen (3D-Materialien) mit ID und Name. Optional nach Namen filtern.",
        "input_schema": {
            "type": "object",
            "properties": {"search": {"type": "string", "description": "Teil des Namens, z. B. 'weiß' oder 'white'"}},
            "additionalProperties": False,
        },
    },
    {
        "name": "resize_windows",
        "description": "Setzt neue absolute Maße (m) für die angegebenen Fenster. Nur angegebene Werte werden geändert.",
        "input_schema": {
            "type": "object",
            "properties": {
                "window_ids": {"type": "array", "items": {"type": "string"}, "minItems": 1},
                "width": {"type": "number"},
                "height": {"type": "number"},
                "sill_height": {"type": "number", "description": "Parapethöhe"},
            },
            "required": ["window_ids"],
            "additionalProperties": False,
        },
    },
    {
        "name": "set_facade_surface",
        "description": "Setzt die Oberfläche der Außenseite aller Außenwände (Fassade).",
        "input_schema": {
            "type": "object",
            "properties": {"surface_id": {"type": "string"}},
            "required": ["surface_id"],
            "additionalProperties": False,
        },
    },
]


def run_tool(plan: Plan, name: str, args: dict):
    if name == "list_rooms":
        return [{k: r[k] for k in ("id", "name", "number", "floorIndex")} for r in plan.rooms()]
    if name == "list_windows":
        return plan.windows(args.get("room"))
    if name == "list_surfaces":
        return plan.surfaces(args.get("search"))
    if name == "resize_windows":
        return plan.resize_windows(args["window_ids"], args.get("width"), args.get("height"), args.get("sill_height"))
    if name == "set_facade_surface":
        return plan.set_facade_surface(args["surface_id"])
    raise ArchicadError(f"Unbekanntes Werkzeug: {name}")


def describe(name: str, args: dict) -> str:
    if name == "resize_windows":
        parts = [f"{label} {args[key] * 100:.0f} cm" for key, label in
                 (("width", "Breite"), ("height", "Höhe"), ("sill_height", "Parapet")) if args.get(key) is not None]
        return f"{len(args['window_ids'])} Fenster ändern: " + ", ".join(parts)
    if name == "set_facade_surface":
        return f"Fassade auf Oberfläche {args['surface_id']} setzen"
    return name


class Assistant:
    def __init__(self, plan: Plan, confirm: Callable[[str], bool], client: anthropic.Anthropic | None = None):
        self.plan = plan
        self.confirm = confirm
        self.client = client or anthropic.Anthropic()
        self.messages: list = []

    def ask(self, text: str) -> str:
        """Eine Anweisung abarbeiten; das Gespräch bleibt für Rückfragen erhalten."""
        self.messages.append({"role": "user", "content": text})
        while True:
            response = self.client.beta.messages.create(
                model=MODEL,
                max_tokens=16000,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=self.messages,
                output_config={"effort": "medium"},
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
            self.messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "refusal":
                return "Die Anfrage wurde abgelehnt."
            if response.stop_reason != "tool_use":
                return "".join(b.text for b in response.content if b.type == "text").strip()

            results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                results.append(self._execute(block))
            self.messages.append({"role": "user", "content": results})

    def _execute(self, block) -> dict:
        args = block.input if isinstance(block.input, dict) else json.loads(block.input)
        if block.name in WRITE_TOOLS and not self.confirm(describe(block.name, args)):
            return {"type": "tool_result", "tool_use_id": block.id, "content": "Vom Benutzer abgelehnt.", "is_error": True}
        try:
            result = run_tool(self.plan, block.name, args)
            content = result if isinstance(result, str) else json.dumps(result, ensure_ascii=False)
            return {"type": "tool_result", "tool_use_id": block.id, "content": content}
        except (ArchicadError, KeyError, TypeError) as e:
            return {"type": "tool_result", "tool_use_id": block.id, "content": f"Fehler: {e}", "is_error": True}
