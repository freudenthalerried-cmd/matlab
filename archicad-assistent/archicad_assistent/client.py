"""Verbindung zu einem laufenden Archicad über die offizielle JSON-API.

Archicad lauscht standardmäßig auf http://127.0.0.1:19723. Die erweiterten
Befehle (Fenster ändern, Wände ändern, Raumbeziehungen …) kommen vom
kostenlosen Tapir-Add-On und laufen über API.ExecuteAddOnCommand.
"""

import json
import urllib.error
import urllib.request

DEFAULT_PORT = 19723


class ArchicadError(Exception):
    pass


def _error_text(error) -> str:
    if isinstance(error, dict):
        message = error.get("message") or "Unbekannter Fehler"
        code = error.get("code")
        return f"{message} (Code {code})" if code is not None else message
    return str(error)


class ArchicadClient:
    def __init__(self, host: str = "127.0.0.1", port: int = DEFAULT_PORT, timeout: float = 60.0):
        self.url = f"http://{host}:{port}"
        self.timeout = timeout

    def run_command(self, command: str, parameters: dict | None = None) -> dict:
        """Führt einen offiziellen Archicad-Befehl aus ("API." wird ergänzt)."""
        if not command.startswith("API."):
            command = "API." + command
        body = json.dumps({"command": command, "parameters": parameters or {}}).encode("utf-8")
        request = urllib.request.Request(self.url, data=body, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                answer = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, ConnectionError, OSError) as e:
            raise ArchicadError(f"Archicad ist unter {self.url} nicht erreichbar: {e}") from e
        if not answer.get("succeeded"):
            raise ArchicadError(f"{command}: {_error_text(answer.get('error'))}")
        return answer.get("result", {})

    def run_tapir(self, command: str, parameters: dict | None = None) -> dict:
        """Führt einen Befehl des Tapir-Add-Ons aus."""
        result = self.run_command("API.ExecuteAddOnCommand", {
            "addOnCommandId": {"commandNamespace": "TapirCommand", "commandName": command},
            "addOnCommandParameters": parameters or {},
        })
        response = result.get("addOnCommandResponse")
        if response is None:
            raise ArchicadError(f"{command} lieferte keine Antwort. Ist das Tapir-Add-On installiert?")
        if "error" in response:
            raise ArchicadError(f"{command}: {_error_text(response['error'])}")
        return response

    def is_alive(self) -> bool:
        try:
            return self.run_command("API.IsAlive").get("isAlive", True) is not False
        except ArchicadError:
            return False


def item_errors(items: list[dict]) -> list[str]:
    """Fehlermeldungen der fehlgeschlagenen Einträge eines Batch-Ergebnisses."""
    return [_error_text(item["error"]) for item in items if isinstance(item, dict) and "error" in item]
