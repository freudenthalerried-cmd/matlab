# Das Messwerkzeug maß den größten Leser nicht

**6. September 2026, nachts.** `npm run reichweite` gibt es seit dem
5. September. Es beantwortet die Frage, die dieser Bestand am häufigsten
stellt — *welche Datei liest kein Prüfer?* — nicht mit einem Register, sondern
mit einer Messung: Jeder Prüfer läuft mit einer Spur davor, die jeden
geöffneten Pfad protokolliert.

Es schloss mit diesem Satz:

> *„Gelesen ist nicht geprüft … **Ungelesen ist dagegen sicher ungeprüft** —
> die Zahl oben ist eine untere Schranke, kein Zeugnis."*

Und nannte sieben Dateien. Eine davon ist
`beispiel/preisliste-muster-bahnen.csv`. Sie wird bei **jedem** Lauf gelesen —
von `test/import-werkzeug.test.js`.

```
gemessen wurden:   31 Prüfer aus src/pruefregister.js
nicht gemessen:    npm test — 1750 Testfälle, Schritt 1 des Gesamtlaufs
```

> **Das Werkzeug, das misst, wessen Reichweite zu klein ist, hatte selbst eine
> zu kleine — und beschuldigte damit eine Datei, die geprüft wird.**

Die Testfälle stehen nicht in `PRUEFER`; dort stehen die `bin/`-Werkzeuge. Sie
sind trotzdem der größte Leser des Bestands, und das ist jetzt gemessen:

```
   807  test              ← neu
   759  pruefe-leitzahlen
   674  pruefe-geheimnis
   635  pruefe-widerrufe
   287  pruefe-lesbar
```

Der Lauf kommt aus dem `test`-Skript in `package.json`, nicht aus dem
Gedächtnis. Die Spur erreicht die Kindprozesse des Testläufers über
`NODE_OPTIONS` — ein `--require` am Elternprozess bliebe dort, wo nichts
gelesen wird.

**Aus sieben ungelesenen Dateien werden drei.** Vier waren zu Unrecht
beschuldigt.

---

## Und die drei, die bleiben

| Datei | Lage |
|---|---|
| `styles.css` | 5. August, vor diesem Vorhaben entstanden; steht seit jeher unter „bewusst nicht angefasst" |
| `beispiel/artikelliste-muster.csv` | **die Vorlage, die der Lieferant ausfüllt** |
| `beispiel/messung-beispiel.json` | die Vorlage für die Messung beim Keyword-Planer |

Die beiden Vorlagen sind keine Nebensache. Die Artikelliste mit EAN-Spalte
löst vier offene Punkte auf einmal — GTIN, Marke, Bild und die Weisung, das
Sortiment auf mindestens hundert Artikel zu erweitern. Die Messliste entscheidet,
ob der Klickkanal die geplanten Klicks überhaupt hergibt.

> **Eine Vorlage, die niemand durch ihr Werkzeug schickt, ist eine Behauptung
> über ein Dateiformat.** Merkt es jemand, dann am Freigabetag, mit der
> ausgefüllten Datei in der Hand.

`test/vorlagen.test.js` schickt seither jede Vorlage durch das Werkzeug, für
das sie gemacht ist: die Artikelliste durch `importierePreisliste`, die Messung
durch `pruefeMessung` und `werteClusterAus`. Geprüft wird **die Form, nicht die
Zahlen** — die Werte in den Vorlagen sind ausdrücklich erfunden und belegen
nichts.

Dazu die Gegenrichtung, damit eine neue Vorlage nicht stillschweigend ungeprüft
dazukommt: Jede Datei in `beispiel/` muss eine Probe haben, und die Zuordnung
wird nachgesehen statt geglaubt — die genannte Probe muss es geben und die
Vorlage nennen.

---

## Geprüft

Drei Fälle in `test/vorlagen.test.js`. Gegenprobe
`vorlage-die-ihr-werkzeug-abweist` vertauscht die Spaltennamen der
Artikelliste-Vorlage mit plausiblen anderen — genau das, was beim Abschreiben
von Hand passiert.

Der Reichweitenlauf selbst bleibt außerhalb von `npm run alles`: Er startet
jeden Prüfer **und** den ganzen Testlauf einzeln, kostet damit ein Vielfaches
eines Gesamtlaufs und beantwortet eine Frage, die man stellt und nicht
überwacht. Was er heute gefunden hat, steht als Probe im Bestand — und die
läuft mit.
