# Die Datei, die jeder lädt

*23. Oktober 2026. Der Auftraggeber fragte „geht seite schon". Beim Nachsehen
stand die Antwort fest — und daneben eine Lücke, die keine Prüfung gemeldet
hat.*

---

## Die Antwort auf die Frage

**Gebaut und lauffähig, nicht online.** Gemessen am selben Tag:

| | |
|---|---|
| Seiten in `ausgabe/site/` | 85, gebaut am 23.10. |
| Im echten Browser gefahren | `npm run shopprobe`: 66 Szenarien, 0 fehlgeschlagen — davon 12 im 390-px-Rahmen |
| Prüfer | 62 grün, 2786 Tests |
| Unter `bauversand.com` erreichbar | **von hier aus nicht feststellbar** |
| Hochgeladen | nichts |

Die letzten zwei Zeilen gehören zusammen und sind genau zu lesen: Der
Netzausgang **dieser Umgebung** weist `bauversand.com` ab — die Absage kommt
vom eigenen Tor und steht so im Protokoll des Vermittlers
(`connect_rejected`, „policy denial"). Sie sagt nichts darüber, was der Server
des Auftraggebers tut.

> **Eine Absage des eigenen Tors ist keine Aussage über die Gegenseite.**

Zugangsdaten für den Webspace liegen in dieser Umgebung keine — gemessen über
alle Umgebungsvariablen: null Treffer für FTP, SFTP, SSH, All-Inkl, Kasserver.
Hochgeladen hat also niemand etwas, und das ist kein Versehen, sondern der
offene Punkt, der dem Auftraggeber gehört.

**Sehen kann er die Seite trotzdem:** Die Einzeldateifassung
(`ausgabe/website.html`, 1,8 MB, alle 46 Artikel, Suche und Kasse im selben
Dokument) liegt jetzt als Artefakt und ist mit einem Verweis zu öffnen. Es ist
eine Vorschau und nicht die veröffentlichte Seite.

## Und die Lücke, die beim Nachsehen auffiel

Durchsucht wurde die Ausgabe nach internen Wörtern — Einkauf, Marge, Spanne,
Deckungsbeitrag, Lieferantenname, Pfade zur Preisdatei. In den 85 HTML-Seiten:
nichts. In **`ausgabe/site/shop.js`**: vier Sorten Treffer.

Diese Datei lädt jeder Besucher, einmal, 198 KB. Sie trägt den Quelltext der
elf Module, die der Browser braucht, und den Datensatz aller Artikel. Der Bau
prüft sie seit dem 13. September auf Syntax und auf stehengebliebene
Modulzeilen. Auf Interna prüfte er sie **nie**:

```
pruefeSeiten(proben)     → über den Seitenrumpf     (seit 28. August)
pruefeSeiten(fertig)     → über die fertige Seite   (seit 10. September)
                         → über shop.js: nichts
```

> **Die Datei, die jeder Besucher lädt, stand außerhalb der Prüfung, die den
> Bau abbricht, wenn ein internes Wort eine Seite erreicht.**

Dieselbe Bauart wie am 10. September, nur eine Ebene tiefer: Damals las die
Prüfung `seite.html` und sah den Absatz nicht, den erst der Rahmen anhängt.
Jetzt las sie Seiten und sah die Datei nicht, die daneben liegt.

## Was die vier Treffer wirklich waren

Gemessen, bevor etwas geändert wurde — und das ist der Teil, der eine
Aufregung von einem Befund trennt:

| Fund | Urteil |
|---|---|
| `eps`, `karte-stripe` — Zahlwegkennungen im Datensatz | **gehört hin.** Die Oberfläche braucht die Kennung, um den Weg zu wählen, und zeigt daneben den Kundennamen und den Kundensatz |
| `Deckungsbeitrag` in einer Wortliste | **gehört hin.** Es ist die Liste, mit der die Kasse ihren eigenen Anfragetext gegen „keine spanne ausgeben" hält. Der Text entsteht im Browser, also läuft der Wächter dort |
| `preise/poschacher-positionen.csv` | **gehört nicht hin.** Ein Pfad zu einer Datei mit Einkaufspreisen, den nur zwei Kommandozeilenwerkzeuge aussprechen |
| 48-mal `"lieferantId":"poschacher"` | **gehört hin, und das ist entschieden** — am 15. September, nach einem Widerspruch zwischen zwei Sätzen des Bestands. Geheim ist nicht die Geschäftsbeziehung, geheim sind die Konditionen. Der **Name** bleibt draußen, die Kennung reist mit |

Kein Einkaufspreis, keine Marge, kein Zielwert. Das ist das Ergebnis des
Kommentarentferners vom 29. August — damals gingen 293 KB Quelltext samt der
Rechnung „40 € Einkauf und 25 % Ziel ergeben 53,333… €" an jeden Besucher.

## Gebaut wurde beides

**Der Pfad ist aus dem Browsermodul heraus.** `POSITIONSLISTE_FEHLT` stand in
`src/gebinde.js`, und das Modul steht in `BROWSERMODULE`. Am 14. September war
das Zusammenlegen richtig — zwei Werkzeuge sagten denselben Satz — und der Ort
falsch. Er liegt jetzt neben `preisdateiWeigerung()` in
`src/baustoffkatalog.js`: dieselbe Lage, dieselbe Datei, und keine davon wird
ausgeliefert.

> **Ein Satz, den nur ein Werkzeug sagt, gehört in kein Modul, das der Browser
> lädt.**

**Und der Maßstab gilt jetzt für das Bündel.** `pruefeSeiten` läuft über
`shop.js` wie über eine Seite, mit einer Ausnahme auf genau die zwei Muster,
die oben als „gehört hin" stehen. Nicht mit einem weicheren Muster: Eine
Ausnahme, die man aufschreiben muss, wird seltener aus Bequemlichkeit gemacht
als eine, die man wegkonfiguriert. Was dazukommt, bricht den Bau ab.

## Die Gegenprobe steht vor der Zusage

Gegenprobe 323 nimmt in `src/shopkern.js` die Zeile zurück, mit der
`oeffentlicherLieferant` den Lieferantennamen weglässt — eine Zeile, die seit
dem 30. August nur aus einem Kommentar heraus existiert. Der Name steht dann im
Datensatz, der Datensatz steht in keiner HTML-Seite, und rot werden darf
deshalb nur die neue Prüfung:

```
✓ website — Der Lieferantenname im ausgelieferten Datensatz, den jeder Besucher lädt
      shop/src/shopkern.js (ersetzen) · 7 s
      meldete rot an der erwarteten Stelle
```

## Was das über die Prüfkette sagt

Drei Mal in sieben Wochen hat dieselbe Bauart zugeschlagen: eine Prüfung las
eine Fassung des Gegenstands und nicht die ausgelieferte. Am 5. September den
Rumpf statt der fertigen Seite. Am 13. September das Bündel als Modul statt als
Skript. Heute die Seiten statt der Datei daneben.

> **Eine Prüfung ist nur so weit richtig, wie ihr Gegenstand der ausgelieferte
> ist.** Die Frage „prüft sie alles, was hinausgeht?" ist eine andere als „ist
> sie grün".

Gefunden hat es diesmal keine Prüfung, sondern eine Frage von vier Wörtern.

## Zahlen des Tages

| | |
|---|---|
| Gegenproben im Register | 322 → **323** |
| Prüfer im Schnelllauf | 62, unverändert — die Prüfung sitzt im Bau, nicht daneben |
| Tests | 2786 grün |
| Interna in den 85 Seiten | 0 |
| Interna im Bündel | 3 begründet ausgenommen, 1 entfernt |
