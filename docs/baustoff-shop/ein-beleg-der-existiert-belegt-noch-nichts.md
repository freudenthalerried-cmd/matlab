# Ein Beleg, der existiert, belegt noch nichts

**2. September 2026.** Die Frage der letzten Runde: *Welcher Beleg des
Auftragsabgleichs behauptet mehr, als er zeigt?* Anlass war Ergebnis 9, wo im
Präsens stand, was nie lief — „kontrolle.js prüft jeden Beleg gegen die
Rechnung", bei dreiundfünfzig Testverweisen und null Aufrufen.

Acht weitere Ergebnisse sind mit *„unter anderem Namen vorhanden"* beantwortet,
nach demselben Muster und von derselben Hand geschrieben. Also habe ich sie
einzeln nachgeprüft.

## Der Befund: keiner

| Ergebnis | Behauptung | nachgesehen |
| --- | --- | --- |
| 2 | `ANNAHMEN` führt Basis, Herkunft, Konfidenz, Klärungsweg | vier Annahmen, alle vier Felder — als `klaertDurch` |
| 2 | `zielgroessen.json` trägt je Zahl eine Herkunftsnotiz | 7 von 7 Feldern |
| 5 | `npm run empfindlichkeit` gibt Elastizitäten **und** Kipppunkte aus | beides in der Ausgabe |
| 6 | `lieferanten.json` mit Frachtmodell, Sperrgutzuschlag, Belegstand | 4 von 4 — Belegstand heißt `konditionenStand` |
| 8 | `IMPRESSUMSFELDER` verweist auf § 5 ECG und § 14 UGB | acht Fundstellen im Block |

Alle acht halten. Zwei meiner Prüfgriffe waren falsch, nicht die Begründungen:
Ich suchte `klaerungsweg` und `belegstand`, im Datensatz heißen sie
`klaertDurch` und `konditionenStand`.

**Zum dritten Mal an zwei Tagen war meine Gegenprobe falsch und nicht die
Sache.** Beim Gegenprobenregister waren es zwei untaugliche Mutationen, beim
Kontrollprüfer eine wahre Meldung über das falsche Objekt, hier zwei falsch
geratene Feldnamen. Der Reflex, aus einem roten Ergebnis auf einen Fehler im
Geprüften zu schließen, ist selbst eine Fehlerquelle.

## Was daraus wird

Ein Audit, das nichts findet, ist kein Ertrag — der Ertrag ist, dass es sich
nicht wiederholen muss. Der Auftragsabgleich prüfte bisher, dass die
**Belegdateien existieren**. Das reichte nachweislich nicht.

`npm run pruefe-auftrag` liest jetzt jede Begründung und prüft, was sie **beim
Namen nennt**: jede Datei, jeden `npm run`-Befehl, jede Kennung aus dem
Quelltext. **21 Angaben, sechs begründete Ausnahmen.**

Die Ausnahmen sind unvermeidlich und stehen deshalb im Datensatz statt in einer
Regel — jede mit Grund. Sie haben alle dieselbe Form: **Etwas wird genannt,
weil es fehlt.** „Statt einer Datei `ANNAHMEN.md` …", „`preisrecherche.xlsx`
gibt es nirgends". Der Name der verlangten Sache steht in der Begründung ihrer
Abwesenheit.

## Wo der Prüfer aufhört, und warum

Die erste Fassung des Kennungsmusters meldete `DREI`, `GROESSTEN` und
`RISIKEN` — aus dem Satz „die DREI GROESSTEN RISIKEN". In deutscher Prosa ist
ein großgeschriebenes Wort eine Betonung, und **`IMPRESSUMSFELDER` sieht
genauso aus wie `WETTBEWERBSPREISEN`.**

> **Was sich nicht unterscheiden lässt, wird nicht geprüft — nicht geraten.**

Geprüft werden deshalb nur `kleinesCamelCase` (deutsche Prosa kennt es nicht)
und `GROSS_MIT_UNTERSTRICH`. Der Preis ist bekannt und benannt: `ANNAHMEN` und
`IMPRESSUMSFELDER` fallen aus der Prüfung heraus. Die Datei- und Befehlsnamen
tragen das meiste Gewicht ohnehin.

Der bequeme Ausweg wäre eine Ausnahmeliste für deutsche Wörter gewesen. Sie
hätte mit jedem neuen Satz wachsen müssen — und eine Ausnahmeliste, die wächst,
ist eine Regel, die nicht gilt.

## Die Gegenprobe

Im Register: `npm run pruefe-kontrolle` in einer Begründung durch
`npm run pruefe-erfunden` ersetzt. Der Prüfer meldet *„Ergebnis 9 nennt den
Befehl ‚pruefe-erfunden' — den gibt es nicht"* und endet rot.

**Neun von neun Gegenproben schlagen an.**

## Die Frage für den nächsten Lauf

Sechs Runden, sechs Fragen. Fünf haben etwas gefunden, diese nicht — und das
ist die erste, die eine Antwort in die andere Richtung gibt: Der
Auftragsabgleich hält, was er sagt.

> **Welche meiner Prüfungen misst etwas, das sich nie ändern kann?**

Ein Prüfer über eine eingefrorene Größe meldet jeden Tag grün und kostet jeden
Tag Zeit. `pruefe-quellen` liest sechs Aussagen, die seit dem 27. August
unverändert sind. `pruefe-preise` hält vier Ausgaben gegeneinander, die alle aus
einem Bau stammen — für ihn ist bis heute keine Gegenprobe angekommen, und das
könnte derselbe Befund sein.
