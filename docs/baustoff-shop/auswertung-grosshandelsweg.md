# Der Großhandelsweg im Auswertungsbogen — zwei Antwortwege, eine Regel

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Entwurf C ([`anschreiben-entwuerfe.md`](./anschreiben-entwuerfe.md)) fragt
einen Baustoffgroßhändler an — aber der Auswertungsbogen in `auswertung.js`
konnte nur Herstellerantworten lesen: Händlerrabatt auf eine UVP-Liste. Der
Großhandel antwortet nicht so. Er nennt **Netto-Einkaufspreise je Kunde**,
und eine Liste, gegen die man rechnen könnte, gibt es nicht. Wäre die erste
Großhändlerantwort eingetroffen, hätte der fertige Bogen sie als
„nicht beziffert" verworfen — die Auswertung, die nach Gate 17 vor den
Antworten feststehen soll, hätte den dreizehnten Adressaten gar nicht lesen
können.

## Was gebaut wurde

`auswertung.js` wertet jetzt zwei Wege gleichrangig aus:

| | Herstellerweg (Entwurf A) | Großhandelsweg (Entwurf C) |
|---|---|---|
| Angabe | Händlerrabatt auf die Netto-Liste | Netto-Einkaufspreis je Einheit |
| Bezugsgröße | UVP | **Straßenpreis-Deckel** (`strassenpreisanker-sortiment.md`) |
| Marge | = Rabattsatz (bei Verkauf zur UVP) | = 1 − Einkauf/Deckel |
| Spielraum | zulässiger Nachlass auf die UVP | zulässiger Abstand unter dem Deckel |

Drei Entwurfsentscheidungen:

1. **Ein Einkaufspreis ohne Deckel ist keine Kondition.** `pruefeBogen`
   verlangt seit Entwurf C ein Entweder-oder: Rabatt **oder** Einkaufspreis
   samt Deckel. Eine Zahl ohne Bezugsgröße ist genau der Fehler, der schon
   zweimal teuer war (Frachtschwelle auf der falschen Seite, UVP auf der
   Brutto-Seite) — der Bogen weist ihn jetzt an der Eingangstür ab.
2. **Nennt eine Antwort beide Wege, gilt der schlechtere.** Eine Antwort,
   die sich mit der günstigeren Lesart schmückt, würde sonst besser bewertet
   als zwei ehrliche. `margeAusAntwort` nimmt das Minimum.
3. **Die tragende Marge kennt keine Herkunft.** `werteRundeAus` rangiert
   nach `marge`, gleich aus welchem Weg — Prüfung A (zwei Lieferanten, alle
   vier Bedingungen) gilt unverändert, und eine gemischte Runde aus einem
   Hersteller und einem Großhändler kann sie bestehen.

## Geprüft

| | |
|---|---|
| neue Testfälle | 7 |
| Testfälle gesamt | 381, alle grün, 0 mit Verdacht |

Gegenproben an der Prüfung, beide sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| die geschmückte Lesart: der **bessere** Weg gewinnt | 1 Testfall fällt |
| der Großhandelsweg wird bei der Marge überlesen | 4 Testfälle fallen |

Kein Demo-Umbau: `auswertung.js` ist bewusst nicht Teil des gebauten
Bündels — der Bogen ist Betreiber-, nicht Kundenwerkzeug.

## Kein Gate

Kein neues Gate, keine geänderte Kennzahl; die Referenzzahlen bleiben
3.900,20 € brutto und 34,2 % Mischmarge (als optimistisch markiert), alle
Preise Platzhalter. Was sich ändert, ist die Bereitschaft: **Alle dreizehn
Antworten sind jetzt am Tag ihres Eintreffens auswertbar** — Gate 17
(Auswertung steht vor den Antworten fest) gilt wieder für den ganzen
Empfängerkreis, nicht nur für zwölf Dreizehntel davon.
