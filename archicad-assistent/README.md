# Archicad-Assistent

Steuert ein **laufendes Archicad** mit deutschen Anweisungen, z. B.:

- „Mach das Fenster im Wohnzimmer größer“
- „Fenster in der Küche 100 cm breit“
- „Mach die Fassade weiß“

Claude übersetzt den Satz in Planbefehle. Die Befehle laufen über die **offizielle Archicad-JSON-API**
und das kostenlose **Tapir-Add-On**. Archicad wird nicht nachgebaut oder verändert, der Assistent bedient es nur.
Vor jeder Änderung fragt der Assistent nach, und in Archicad lässt sich alles mit **Strg+Z** rückgängig machen
(beim ersten Test prüfen).

## Einrichtung (einmalig, Windows oder Mac)

1. **Archicad 27, 28 oder 29** starten und ein Projekt öffnen.
2. **Tapir-Add-On** installieren: <https://github.com/ENZYME-APD/tapir-archicad-automation/releases>
   (Installer für deine Archicad-Version), danach Archicad neu starten.
3. **Python 3.10+** installieren (<https://www.python.org>).
4. Im Ordner `archicad-assistent`:
   ```
   pip install -e .
   ```
5. API-Key von <https://console.anthropic.com> als Umgebungsvariable setzen:
   - Windows (PowerShell): `setx ANTHROPIC_API_KEY "sk-ant-..."` (neues Fenster öffnen)
   - Mac: `export ANTHROPIC_API_KEY="sk-ant-..."`

## Benutzung

```
archicad-assistent                                   # Dialog
archicad-assistent "Mach das Fenster im Wohnzimmer größer"
archicad-assistent --ja "Fassade weiß"               # ohne Rückfrage
```

## Voraussetzungen im Projekt

- **Räume als Zonen** anlegen und benennen (z. B. „Wohnzimmer“). Ohne Zonen weiß der Assistent nicht,
  welches Fenster in welchem Raum liegt und wo die Fassade ist.
- Für „Fassade weiß“ muss eine passende **Oberfläche** existieren (z. B. „Putz weiß“).

## Was geht (Version 0.1)

| Funktion | Archicad-Befehl (Tapir) |
|---|---|
| Räume lesen | `GetElementsByType` und `GetDetailsOfElements` (Zone) |
| Fenster mit Raumzuordnung | `GetRelationsOfElements` (Raum links und rechts vom Fenster) |
| Fenstergröße und Parapet ändern | `ModifyWindows` |
| Fassadenoberfläche setzen | `GetZoneBoundaries` (Außengrenzen) und `ModifyWalls` (Oberflächen-Überschreibung) |

## Erster Test – bitte prüfen

Getestet ist alles nur gegen ein **simuliertes Archicad** (`pytest`), nicht gegen ein echtes.
Beim ersten echten Lauf bitte prüfen:

1. Ändert „Fenster im Wohnzimmer größer“ das richtige Fenster?
2. Wird bei „Fassade weiß“ die **Außenseite** eingefärbt? Falls es die Innenseite trifft,
   in `archicad_assistent/plan.py` `REFERENCE_SIDE_IS_LEFT = False` setzen.
3. Funktioniert Strg+Z danach?

## Nächste Schritte (geplant)

1. Spracheingabe (Mikrofon → Text → Assistent)
2. Plan aus PDF einlesen (Wände, Öffnungen, Räume erkennen → in Archicad erzeugen)
3. Einrichtungsplan automatisch (Möbel aus der Bibliothek je Raum platzieren)
4. Weitere Befehle: Türen, Wandstärken, Raumnamen, Dach, Geschoße

## Entwicklung

```
pip install -e . pytest
pytest
```
