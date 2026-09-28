# Vier Farbpaare waren zu schwach — gerechnet, nicht gesehen

Stand: 2026-08-29

## Zuerst der Teil, an dem nichts war

Nach dem Schriftenfund lag die Frage nahe, was die gebauten Seiten sonst noch
enthalten, das niemand geprüft hat. Ein Zensus über alle 81 Seiten, mit
objektiven Regeln:

| Geprüft | Befund |
| --- | --- |
| `<html lang>` vorhanden | 81 von 81 |
| genau eine `<h1>` je Seite | 81 von 81 |
| keine übersprungene Überschriftenebene | 81 von 81 |
| jedes `<img>` mit `alt` | ohne Beanstandung |
| jedes `<svg>` mit `role`/`aria-label` oder `aria-hidden` | ohne Beanstandung |
| jedes Bedienelement mit Beschriftung | ohne Beanstandung |
| kein leerer Verweis | ohne Beanstandung |
| jede Tabelle mit `<th>` | ohne Beanstandung |

**Null Befunde.** Das ist ein Ergebnis, kein Nichtergebnis: Es war gemessen
und nicht angenommen.

## Und der Teil, an dem etwas war

Was ein Zensus über den Quelltext nicht sieht, ist der Kontrast. Der wird
gerechnet. Nach WCAG 2.1 — 4,5:1 für Fließtext, 3:1 für die Umrandung eines
Bedienelements — lagen im **hellen** Anstrich fünf Paare darunter:

| Paar | vorher | jetzt |
| --- | --- | --- |
| Gedämpfter Text auf Grund | 4,14 | **5,24** |
| Gedämpfter Text auf Fläche-2 | 3,65 | **4,62** |
| Verweise (Ocker) auf Grund | 4,17 | **4,92** |
| Schrift auf dem Hauptknopf | 4,17 | **4,92** |
| Umrandung von Eingabefeldern | 1,94 | **3,02** |

Der helle Anstrich ist der, den die meisten sehen. Und die betroffenen Stellen
sind nicht die Randbereiche: die Verweisfarbe, der Knopf „In den Warenkorb",
die Zeile „ab 0,75 m² · 3,92 €" auf jeder Kachel, die Umrandung des
Mengenfelds.

Im dunklen Anstrich lagen zwei Paare darunter; auch dort ist nachgezogen.

**Ein Kontrast von 4,17 statt 4,5 sieht man nicht — man misst ihn.** Der Shop
ist heute den ganzen Tag in beiden Anstrichen betrachtet worden, und
aufgefallen ist nichts.

## Wie weit verschoben wurde

So wenig wie nötig. `--gedaempft`, `--ocker` und `--linie-stark` sind
abgedunkelt, bis die Schwelle erreicht ist, und nicht weiter — die
Farbfamilie bleibt dieselbe:

| Wert | vorher | jetzt |
| --- | --- | --- |
| `--gedaempft` | `#78736A` | `#68635A` |
| `--ocker` | `#A8621B` | `#9C560F` |
| `--linie-stark` | `#B4AEA0` | `#908A7C` |

`--linie` bleibt unverändert. Sie zeichnet Trennlinien und Kartenränder, die
keine Bedienelemente sind; für sie verlangt WCAG 1.4.11 nichts, und ein
Kontrast, den niemand braucht, macht die Seite nur unruhiger. Das ist eine
Entscheidung, keine Auslassung — sie steht im Prüfer als Kommentar.

## Der Prüfer

`test/kontrast.test.js` liest die Farbwerte aus der **gebauten Seite**, nicht
aus der Quelle, und rechnet 16 Paare in beiden Anstrichen durch. Dazu eine
Probe auf die Rechnung selbst: Schwarz auf Weiß muss 21 ergeben, Weiß auf
Weiß 1, und `#767676` auf Weiß die klassischen 4,54. Ohne sie prüfte der Test
eine Formel, die niemand nachgerechnet hat.

Gegengeprobt mit der alten Palette: Der helle Anstrich fällt.

## Was das nicht ist

**Keine Rechtspflicht.** Der European Accessibility Act gilt seit 28. Juni
2025 für den Verbraucher-Onlinehandel; dieser Shop ist ausdrücklich B2B und
schließt Verbraucher aus (Gate 7), und ein Kleinstunternehmen wäre ohnehin
ausgenommen. Das hier als Vorschrift auszugeben wäre erfunden.

Der Grund ist ein anderer und braucht kein Gesetz: Der Kunde dieses Shops
steht auf einer Baustelle, bei Tageslicht, mit einem Telefon in der Hand und
womöglich einer Lesebrille im Auto. **4,5:1 ist dort keine Formalie.**
