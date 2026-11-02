"""Kommandozeile: Anweisungen eintippen, Claude setzt sie in Archicad um."""

import argparse
import sys

from .assistant import Assistant
from .client import DEFAULT_PORT, ArchicadClient
from .plan import Plan


def main() -> None:
    parser = argparse.ArgumentParser(description="Archicad per Anweisung steuern.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port der Archicad-JSON-API (Standard 19723)")
    parser.add_argument("--ja", action="store_true", help="Änderungen ohne Rückfrage ausführen")
    parser.add_argument("anweisung", nargs="*", help="Einzelne Anweisung; ohne Angabe startet der Dialog")
    args = parser.parse_args()

    client = ArchicadClient(port=args.port)
    if not client.is_alive():
        sys.exit(f"Archicad antwortet nicht auf Port {args.port}. Läuft Archicad mit geöffnetem Projekt?")

    def confirm(description: str) -> bool:
        if args.ja:
            print(f"→ {description}")
            return True
        return input(f"→ {description}. Ausführen? [j/n] ").strip().lower() in ("j", "ja", "y")

    assistant = Assistant(Plan(client), confirm)

    if args.anweisung:
        print(assistant.ask(" ".join(args.anweisung)))
        return

    print("Archicad-Assistent – Anweisung eingeben (leer = Ende). Rückgängig in Archicad mit Strg+Z.")
    while True:
        try:
            text = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not text:
            break
        print(assistant.ask(text))


if __name__ == "__main__":
    main()
