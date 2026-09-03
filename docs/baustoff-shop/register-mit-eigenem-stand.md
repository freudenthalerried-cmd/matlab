# Das Register der Stände hatte einen Stand

**3. September 2026.** `schaufenster-abgleich.md` führt, welche veröffentlichte
Anzeige auf welchem Stand steht. Es endet mit einer Regel:

> Wer eine Zahl in einem Schaufenster ändert, ändert sie in **allen** — oder
> trägt hier ein, warum nicht.

Diese Regel galt acht Tage lang für alle außer für das Dokument selbst. Seine
Tafel stand auf dem 26. August und wies drei Anzeigen als **gültig** aus:

| Was dort stand | Was gilt |
|---|---|
| PR #14: „26.08., abends — ja, mit 616 Testfällen" | zweimal an diesem Tag neu geschrieben, 1.293 Testfälle |
| Website: „26.08., 77 Seiten — ja" | 81 Seiten seit dem 31.08.; die Anzeige ist eine Momentaufnahme aus dem August |
| Ablaufplan: „26.08. — ja, mit Rechtsseiten und GTIN-Lage" | seither viermal überholt |

> **Ein Register der Stände, das selbst einen Stand hat, ist ein
> Schaufenster.**

Dieselbe Familie wie der Prüfer der Prüfer mit seiner unvollständigen Liste
(1. September) und wie die Probeliste, die die Fragen gegen ihre eigene Menge
hielt (heute früh). Immer prüft etwas eine Menge, die es selbst mitbringt.

## Die Tafel führt keine Zahlen mehr

Nicht „die Zahlen nachziehen" — das war schon dreimal die Antwort und hat
dreimal acht Tage gehalten. Die Tafel führt jetzt, was nicht altert:

* **welches Modell** eine Anzeige zeigt — Baustoff oder das abgelöste Radon,
* **ob sie mitwandert oder stillsteht**, und
* **wo die gültige Fassung liegt**.

Die Zahlen stehen dort, wo ein Prüfer sie misst: `npm run alles` für den Bau,
`npm run pruefe-schaufenster` für die PR-Beschreibung.

**Ein Einfrierdatum ist dabei keine Kopie.** Wo eine Anzeige stillsteht, ist ihr
Stand eine feste Tatsache und altert nicht — der darf und soll dabeistehen.

## Drei Daten für eine Anzeige

Beim Aufräumen kam die zweite Sorte Drift heraus. Der Radon-Bericht trug drei
verschiedene Stände in drei Dateien:

| Datei | Stand |
|---|---|
| `PARAMETER.md` | 16.08.2026 |
| `STATUS.md` | „auf Stand 17. August gebracht" |
| `schaufenster-abgleich.md` | 18.08. |

Keines davon war gemessen. Maßgeblich ist, was die Anzeige selbst trägt, und
ihre Quelldatei liegt im Repo: `bericht-radon.html` sagt **Stand 17. August
2026**. Der 18. war der Tag des Commits, der 16. war schlicht falsch — und
stand ausgerechnet in der Datei, die über allem rangiert.

`PARAMETER.md` nennt das Datum jetzt gar nicht mehr; es steht an der einen
Stelle, die dafür gebaut ist. Dafür sagt die Tafel dort etwas, das vorher
fehlte: **Beide dort verlinkten Artefakte gehören zum abgelösten
Radon-Modell.** Wer die oberste Datei aufschlägt und „Statusbericht" liest,
hielt bis heute einen Bericht für den Stand, dessen Modell am 22. August
verlassen wurde.

## Was jetzt misst

Drei Testfälle in `test/schaufensterregister.test.js`, alle drei von Hand
gegengeprobt:

1. **Jede veröffentlichte Anzeige steht im Verzeichnis.** Gesucht wird jede
   Artefaktadresse in der Akte und in den Shoptexten; keine darf ohne Eintrag
   sein. Das ist die Gefahr hinter der Tafel: Eine Anzeige, auf die kein
   Verzeichnis zeigt, wandert nicht mit und steht auch nicht bewusst still —
   sie ist vergessen. *(Gegenprobe: eine erfundene Adresse in einem Dokument,
   und der Fall fällt.)*
2. **Die Tafel führt keine Mengen, die altern.** „N Seiten", „N Testfälle",
   „N Artikel" in einer Anzeigenzeile lassen den Fall fallen — genau diese
   Angaben sind acht Tage falsch dagestanden. *(Gegenprobe: „77 Seiten" zurück
   in die Zeile, und der Fall fällt.)*
3. **Das Einfrierdatum kommt aus der Quelldatei.** Der Stand im Eintrag des
   Radon-Berichts muss der sein, den `bericht-radon.html` selbst nennt.

Was keiner der drei prüft: ob ein Eintrag inhaltlich stimmt. Das kann kein
Werkzeug. Sie prüfen, dass es ihn gibt, dass er nichts Alterndes behauptet und
dass sein einziges Datum belegt ist.

## Wofür kein Werkzeug gebaut wurde — und warum

Naheliegend wäre gewesen, die **Seitenzahl als fünfte Leitzahl** aufzunehmen.
Ein Versuch dazu lief: Der Prüfer meldete sofort sechs Fundstellen mit „77" und
„57" ohne Bedingung, darunter zwei in veröffentlichungsnahen Dokumenten.

Zurückgenommen, aus zwei Gründen. Das Leitzahlregister nimmt eine Zahl nach
eigener Regel erst auf, wenn sie **gerechnet** ist, in **mehr als einem
Dokument** steht und **eine Entscheidung trägt**. Die Seitenzahl erfüllt zwei
davon; sie trägt keine Entscheidung. Und die zweite Regel des Registers —
jedes Leitdokument muss die gültige Zahl nennen — hätte `PARAMETER.md` gezwungen,
eine Seitenzahl zu führen, die dort nichts zu suchen hat.

> **Ein Register, das man für einen Fall dehnt, misst danach etwas anderes als
> das, wofür es gebaut ist.**

Die Zahl bleibt damit ungeprüft. Das ist der ehrliche Stand und keine Lücke,
die jemand übersehen hat: Sie steht hier, damit ein späterer Lauf nicht
denselben Anlauf noch einmal nimmt.
