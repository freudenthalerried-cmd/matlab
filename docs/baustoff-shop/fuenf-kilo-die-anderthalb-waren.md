# Fünf Kilo, die anderthalb waren

**31. August 2026, nachts.** Zurück zum Ziel des Auftraggebers. Die Anzeigen
sind in Ordnung — richtige Gegend, richtiges Budget, existierende Zielseiten,
wahre Aussagen. Die nächste Frage stellt sich von selbst: **Was findet
jemand, den eine Anzeige auf `gruppe/kamin.html` bringt?**

Also die Landeseite gelesen, wie ein Kunde sie liest.

## Was auf den Karten stand

Jede Artikelkarte trägt eine Schemazeichnung mit einer Beschriftung. Über den
ganzen Bestand nachgesehen — zweiunddreißig verschiedene. Die meisten sind
gut: `25 kg`, `⌀ 800`, `45°`, `NW 100`, `1,1 × 50 m`. Vier sind es nicht, und
zwei davon sind **falsch**:

| Bezeichnung | Beschriftung | |
|---|---|---|
| Schiedel Fugenmasse FM **1,5 kg** | „5 kg" | **das Dreifache** |
| Capatect Gewebeanschlussleiste … **2,55 m** | „55 m" | **das Zweiundzwanzigfache** |
| Regenhaube … 180 Absolut | „180" | Zahl ohne Einheit |
| SIK Zuluftplatte, Fertigfußpaket, Putztüranschluss | „STK" | rohes Kürzel |

> **Die Artikelkarte ist oft alles, was ein Kunde sieht.** Ein 1,5-kg-Eimer,
> der als „5 kg" ausgezeichnet ist, ist keine Ungenauigkeit — er ist eine
> falsche Angabe an der Stelle, an der die Kaufentscheidung fällt. Und die
> 2,55-m-Leiste steht auf einer Landeseite des ersten Anzeigenanlaufs.

Das rohe `STK` ist dasselbe Kürzel, das ich am selben Tag aus dem Warenkorb
und von den Belegen entfernt habe — eine dritte Stelle, die ich damals nicht
gesehen hatte.

## Die Ursache, und warum sie schon einmal da war

Beide falschen Maße entstanden gleich: Das Muster verlangte nur Ziffern vor
der Einheit, und `5 kg` steht nun einmal in `1,5 kg`. Es griff **den Rest
einer Dezimalzahl**.

Am 28. August ist derselbe Fehler schon einmal aufgetreten — die 600 mm
Plattenbreite wurden als Stärke gezeichnet — und **fallweise** behoben. Der
Dateikopf erzählt es sogar.

> **Eine fallweise behobene Fehlerklasse kommt wieder.** Die Regel gehört
> dorthin, wo alle Fälle durchkommen.

Sie steht jetzt in `mass()`: Steht links vom Treffer eine Ziffer, ein Komma
oder ein Punkt, ist der Treffer ein Bruchstück und gilt nicht. Zusätzlich
lassen die Muster für Kilogramm und Meter Dezimalstellen zu.

Die nackte „180" bekommt ihr Zeichen — `⌀ 180`, wie der Schachtring nebenan
seit jeher. Das Kürzel wird zum Wort, über dasselbe `einheitText()`, das schon
Warenkorb und Belege bedient; Unbekanntes wird durchgereicht statt geraten.

## Was die Gegenprobe gezeigt hat

Vier Mutationen über `npm run gegenprobe`. Drei sofort erkannt. Die vierte —
**die Bruchstückregel abgeschaltet** — blieb grün.

Der Grund war nicht Nachlässigkeit, sondern Überlappung: Weil die Muster für
Kilogramm und Meter jetzt Dezimalstellen zulassen, treffen sie `1,5 kg` und
`2,55 m` vollständig; die Linksgrenze wird dort nicht mehr gebraucht.

Statt die Regel für überflüssig zu erklären, nachgemessen, **wo sie allein
rettet** — bei den Mustern ohne Dezimalstellen:

```
„Drehstiftdübel PK K 6 8,40 mm"   ohne Regel → „40 mm"     mit Regel → keine
„Regenhaube 1180 Absolut"          ohne Regel → „⌀ 180"    mit Regel → keine
„Rahmenschraube 7,5x182 mm"        mit Regel  → „182 mm"   (ein x ist keine Ziffer)
```

Zwei Testfälle dafür ergänzt, danach wird auch die vierte Mutation erkannt.

**Eine Mutation, die grün bleibt, ist eine Frage, keine Entwarnung.** Sie
heißt entweder „die Regel ist überflüssig" oder „die Probe sieht ihren Fall
nicht" — und welches von beidem, sagt nur das Nachmessen.

## Die Regel über den ganzen Bestand

Zusätzlich eine Zusicherung, die nicht an einem Beispiel hängt: Für **jede**
Beschriftung mit einer Zahl gilt — steht diese Zahl in der Bezeichnung, darf
links davon keine Ziffer und kein Komma stehen. Über alle 46 Artikel, davon
achtzehn mit Zahl in der Beschriftung.

## Stand

1039 Testfälle grün (vorher 1033), `pruefe-tests` 1037/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 218/218.
