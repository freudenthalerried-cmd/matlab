# Eine Begründung, die nicht mehr gilt

**11. September 2026, zweiundzwanzigste Runde.** Die Runde davor endete mit
einem ausdrücklichen Verzicht:

> *„Keine Kopfzeilen für den Server. … Das lässt sich von hier aus **nicht
> prüfen**: Apache liegt in dieser Umgebung nicht vor, und eine unbekannte
> Direktive beantwortet Apache mit 500 für die ganze Seite. Notiert, nicht
> getan."*

Diese Runde hat den Satz überprüft, mit dem der Verzicht begründet war. Er hielt
nicht: **Apache lässt sich hier installieren.** Damit fällt die Begründung, und
was sie getragen hat, muss neu entschieden werden.

Denselben Satz trug übrigens seit dem 6. September auch der Bestand selbst, im
Kommentar neben der `.htaccess`:

> *„Was hier sonst noch stünde — Weiterleitungen, Kompression, Kopfzeilen —
> wäre eine Serverkonfiguration **ohne Prüfung**: Von hier aus lässt sich nicht
> messen, ob sie wirkt."*

> **Eine Begründung, die einen Verzicht trägt, gehört von Zeit zu Zeit selbst
> geprüft — sonst überlebt sie ihren Anlass.**

## Drei Messungen an einem laufenden Apache

| Versuch | Antwort |
|---|---|
| die gebaute Seite, wie sie war | 200, **keine einzige Sicherheitskopfzeile** |
| eine unbekannte Direktive in der `.htaccess` | **500 für die ganze Seite** |
| dieselbe Direktive in `<IfModule mod_gibtesnicht.c>` | **200** |

Die mittlere Zeile ist der Grund, warum bis heute nichts dastand. Die untere
ist der Grund, warum jetzt etwas dastehen darf:

> **Eine ungeprüfte Zeile in der Datei, die den Shop ausliefert, ist der
> teuerste Weg, recht zu haben — aber ein `<IfModule>` kann nicht
> danebengehen.**

Fehlt das Modul, wird der Block übersprungen. Der schlimmste Fall ist damit
„die Kopfzeilen fehlen", nicht „die Seite ist weg" — gemessen, nicht
angenommen.

## Gate 36, selbst entschieden

Vier Kopfzeilen gehen mit:

| Kopfzeile | warum gerade hier |
|---|---|
| `X-Content-Type-Options: nosniff` | Die Abnahmeliste sorgt sich an **zwei** Punkten genau darum: `shop.js` muss als JavaScript ankommen, `sitemap.xml` als XML. Diese Zeile macht aus der Sorge eine Regel. |
| `Referrer-Policy: strict-origin-when-cross-origin` | Die Adresse der Suchseite trägt die Frage des Kunden (`?q=…`). |
| `Content-Security-Policy` | siehe unten |
| `Permissions-Policy` | Der Shop fragt nie nach Ort, Kamera, Mikrofon — abschalten kostet nichts. |

Die Richtlinie ist der eigentliche Gewinn. Die Datenschutzseite sagt **„keine
fremden Einbindungen"**; bisher war das eine Zusage, die ein Prüfer am Bestand
misst.

> **Jetzt hält sie der Browser des Besuchers — auch dann noch, wenn eines Tages
> jemand eine fremde Schriftart einbindet.**

`'unsafe-inline'` für Skripte ist dabei kein Versehen, sondern die Folge des
statischen Baus: Jede Seite trägt ihre Daten als JSON in einem eingebetteten
Skript (`window.__SHOP__`), und ein statischer Bau kann keine Einmalkennung
vergeben. Der Gewinn steckt in `default-src 'self'` — und gemessen ist, dass
Suche (5 Vorschläge auf „spachtel"), Warenkorb (Zähler auf 1) und die Daten
unter der Richtlinie unverändert laufen.

### Was ausdrücklich nicht gesetzt wird

**`Strict-Transport-Security`.** HSTS ist ein Versprechen an den Browser, das
sich für die Dauer seiner `max-age` **nicht zurücknehmen lässt**: Wer es setzt
und danach kein gültiges Zertifikat hat, sperrt seine eigenen Kunden aus. Ob
bauversand.com über HTTPS erreichbar ist, lässt sich von hier nicht sehen.

*Eine unumkehrbare Zusage über etwas, das niemand gesehen hat, macht dieser
Bestand nicht.* Sie steht seit heute als offener Punkt — mit der Anleitung: eine
Zeile in dieselbe Klammer, sobald die Seite steht und das Zertifikat gilt.

**`X-Frame-Options`** entfällt: abgelöst durch `frame-ancestors` in derselben
Richtlinie. *Zwei Wege zu derselben Aussage bedeuten, dass einer davon
irgendwann alt ist.*

## Der Prüfer fährt zwei Apachen

`npm run pruefe-kopfzeilen` startet zwei Server über demselben gebauten Ordner:

1. **mit `mod_headers`** — jede geführte Kopfzeile muss ankommen, und keine der
   ausdrücklich nicht gesetzten darf es.
2. **ohne `mod_headers`** — die Seite muss weiterhin mit 200 und vollem Inhalt
   kommen. Das ist die eigentliche Zusicherung.

Dazu ein Nebenbefund, der keiner ist: Die Fehlerseite steht seit dem
6. September in der `.htaccess` und war **nie an einem Apache gemessen**.
Punkt 2 der Abnahmeliste ist seit heute belegt — 404 mit der eigenen Seite.

Ohne Apache läuft der Prüfer nicht (Ausgang 2). In einer frischen Umgebung
steht er als Abbruch da, und das ist die ehrliche Anzeige: *Eine
Serverkonfiguration, die kein Server gelesen hat, ist eine Behauptung.*

Die Gegenprobe nimmt den `<IfModule>`-Rahmen heraus und lässt die Zeilen
stehen. Rot wird dann genau die Hälfte, die **ohne** das Modul misst — die
andere bleibt grün, denn mit Modul wirken die Zeilen ja. Sie meldete rot an der
erwarteten Stelle.

## Drei Nachziehungen, die der Bestand selbst verlangt hat

Der Umbau hat drei Register rot gemacht, und jedes hatte recht:

1. **Der Suchtext einer alten Gegenprobe** zeigte auf die `.htaccess`-Zeile im
   Seitenbauwerkzeug — die es dort nicht mehr gibt. *„Jeder Suchtext trifft
   genau die Stelle, die gemeint ist"* hat es sofort gesagt.
2. **`htaccessText` fehlte im Fremdtextverzeichnis** — dieselbe Namensregel,
   die gestern zehn Sätze eingefangen hat.
3. **Die Abnahmeliste zählte „die acht Punkte" von Hand**, und mit dem neunten
   wurde der Satz falsch. Jetzt kommt die Zahl aus der Liste. *Eine Zahl, die
   einen Bestand nennt und von Hand dasteht, ist die nächste, die veraltet.*

Der neunte Punkt ist der einzige, der nicht im Seitentext steht, sondern im
Antwortkopf — die Liste sagt das jetzt und erklärt den Weg über F12. Und sie
nennt den Fall, der beides zugleich erklärt: Fehlen Kopfzeilen **und**
Fehlerseite, ist die `.htaccess` gar nicht hochgeladen. Sie beginnt mit einem
Punkt, und viele Programme zeigen solche Dateien nicht an.

## Stand

| | vorher | nachher |
|---|---:|---:|
| Prüfer | 50 | **51** |
| Gates | 35 | **36** (20 mit Spur im Bestand) |
| Gegenproben | 172 | **173** |
| Abnahmepunkte | 8 | **9** |
| offene Punkte | 26 | **27** |

`npm test` grün (2267 bestanden, 3 übersprungen), `npm run pruefe-tests` (2270
Testfälle), `npm run pruefe-kopfzeilen` (4 Kopfzeilen an einem Apache
gemessen), `npm run pruefe-paket` (87 Dateien, 9 Abnahmepunkte), `npm run
pruefe-pruefer` (51 Prüfer, 1 abgebrochen — `pruefe-gebinde`).
