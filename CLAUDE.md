# Projekt-Notizen & Präferenzen

## E-Mail-Versand (wichtige Arbeitsweise)

Wenn der Nutzer sagt **„Schicke es an irgendwen"** (oder allgemein etwas an eine Person
schicken will):

- **NICHT automatisch senden.** Stattdessen eine **fertige, sendebereite E-Mail als
  Entwurf** vorbereiten — mit Empfänger, Betreff, Text und Anhang —, sodass der Nutzer
  **nur noch auf „Senden" klicken muss**.
- Den vollständigen Mail-Inhalt vorher **im Chat anzeigen**, damit der Nutzer ihn prüfen kann.
- Erst nach ausdrücklicher Freigabe tatsächlich versenden.

**Immer in Outlook öffnen (bevorzugter Weg, ausdrücklicher Wunsch des Nutzers):**
Die fertige Mail **immer als `.eml`-Datei** liefern — mit Empfänger, Betreff, Text und
Anhang —, die per Doppelklick **direkt in Outlook** aufgeht. **Keine Gmail-Entwürfe**
verwenden, außer der Nutzer verlangt es ausdrücklich.

Erzeugung der `.eml` z. B. mit Python (`email.message.EmailMessage`, `add_attachment`),
dann via SendUserFile schicken. Den Mail-Inhalt zusätzlich im Chat anzeigen.

Hinweis zur Umgebung: Ein lokales Outlook kann aus der Remote-/Cloud-Umgebung nicht
direkt geöffnet/gesteuert werden — daher der `.eml`-Weg (Doppelklick öffnet Outlook,
Nutzer klickt nur noch „Senden").

## Kontext zum Vermietungs-Projekt

- Betreiber: **Business & Bed OG** (Stefan Freudenthaler, Armin Celebic),
  Geschäftspartner **Armin Celebic** = `a.celebic1@icloud.com`.
- 9 Wohnungen (8 × 30 m² + 1 × 80 m²), gemietet von der **Soziale Initiative**
  (Kremplstraße 3, Linz), Ansprechpartnerin **Manuela „Ella" Kasperek**.
- Drei Vermietungs-Varianten analysiert: V1 Monteure (Crew99, 18 % Provision),
  V2 Langzeit, V3 Touristik. Auswertungen als HTML/PDF im Repo.
