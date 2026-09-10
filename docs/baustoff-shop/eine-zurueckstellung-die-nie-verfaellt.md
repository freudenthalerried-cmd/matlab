# Eine Zurückstellung, die nie verfällt

**10. September 2026**

Der Gegenprobenlauf endet seit dem 4. September mit derselben Zeile:

```
4 Gegenprobe(n) zu Browserproben zurückgestellt — mit --mit-browser laufen sie mit:
  · shopprobe:     Eine Fläche mit Legen-Knopf, auf der die Grenze aus Gate 25 fehlt
  · bestellprobe:  Ein Bestellformular, aus dessen Angaben kein Angebot werden kann
  · bestellprobe:  Ein Bestelljournal, das unter einer URL erreichbar ist
  · shopprobe:     Eine Auskunft, die nur erscheint, wenn die Trefferliste leer ist
```

Der Grund für die Zurückstellung ist gut und steht im Läufer: Am 4. September
meldeten zwei dieser Proben **unter Last** etwas anderes als allein.

> **Eine Probe, die unter Last etwas anderes meldet als allein, misst die
> Last.**

Was fehlte, war die andere Hälfte. Die Zeile stand da, und niemand ließ sie
mitlaufen — vom 5. bis zum 10. September lief **keine** von ihnen.

> **Eine Zurückstellung, die nie verfällt, ist eine Probe, die nie läuft.**

---

## Was der erste Lauf mit Browser ergab

| Probe | Ergebnis | Dauer |
|---|---|---|
| `ablage-im-webverzeichnis` | schlägt an | 18 s |
| `formular-erhebt-zu-wenig` | schlägt an | 8 s |
| `auskunft-nur-im-leeren-fall` | schlägt an | 56 s |
| `korbflaeche-ohne-grenze` | **rot, aber an der falschen Stelle** | 39 s |

**Die vierte war fünf Tage lang wertlos.** Sie erwartete das *allgemeine*
Szenario — „Keine Fläche mit Legen-Knopf ohne die Grenze" —, und das bleibt
unter ihrer Mutation zu Recht grün: Die Suchergebnisseite trägt vor dem ersten
Tastendruck gar keinen Knopf. Rot wird das Szenario daneben, das genau für sie
gebaut wurde: *„Wo Karten erst beim Tippen entstehen, steht die Grenze
trotzdem."*

Gesagt hat es der Läufer selbst — *„meldete rot, aber nicht wegen …"*. Ohne
diese Unterscheidung wäre die Probe als geschlagen durchgegangen und hätte auf
eine Stelle gezeigt, die sie nicht bewacht.

Was sie bewacht, ist nichts Kleines: die Untergrenze aus Gate 25 auf der einzigen
Seite, deren Kacheln erst beim Tippen entstehen. Genau dort war die Grenze am
5. September im Browser gemessen **nicht** vorhanden — neun Karten, neun
Knöpfe, keine Grenze.

---

## Was daraus folgt — und was ausdrücklich nicht

**Nicht** folgt daraus, die vier in den Regellauf zu ziehen. Der Grund für die
Zurückstellung ist die Last, nicht der Aufwand, und er gilt weiter. Gemessen
kostet der ganze Satz übrigens **2 Minuten** gegen 46 Minuten Regellauf — die
Annahme, es sei teuer, war nie geprüft und ist falsch. Sie war nur nie der
Grund.

Was folgt, ist ein **Datum je Probe** und eine Frist:

- `data/browserproben.json` hält fest, wann jede zurückgestellte Probe zuletzt
  angeschlagen hat, und wie lange sie brauchte.
- `npm run pruefe-browserproben` liest das Datum — **ohne Browser**. Nach
  vierzehn Tagen heißt „zurückgestellt" wieder „ungeprüft", und der Prüfer ist
  rot.
- **Geschrieben wird der Vermerk vom Läufer selbst.** Von Hand gepflegt wäre er
  genau das, wogegen er gebaut ist: ein Handgriff, an den sich niemand
  erinnert.

Der Prüfer misst damit nicht den Zustand des Shops, sondern **das Alter einer
Aussage über ihn** — dasselbe Muster wie bei der Außenlage, wo eine Messung
nach dreißig Tagen wieder als offene Frage gilt.

---

## Der Anker der neuen Gegenprobe

Ihre Mutation setzt einen Anschlag weit zurück. Ein fester Suchtext wäre nach
dem ersten Anschlag tot gewesen: Der Läufer schreibt das Datum neu **und**
formatiert die Datei dabei um.

Sie hängt deshalb an einem **Suchmuster** — gebaut zwei Runden zuvor, für genau
diesen Fall: einen Anker auf einer Zahl, die sich ändert.
