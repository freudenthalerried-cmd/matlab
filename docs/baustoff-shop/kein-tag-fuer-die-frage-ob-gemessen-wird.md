# Kein Tag für die Frage, ob überhaupt gemessen wird

**3. September 2026.** Der Rolloutplan führte elf Etappen: Freigaben, Warten
auf Dritte, hochladen, schalten, und dann **45 Tage Klicks sammeln**, bis die
Kaufquote entschieden ist. Dazwischen fehlte ein Schritt.

| | |
|---|---|
| Tag 10–11 | `ausgabe/site/` hochladen |
| Tag 11–12 | Die drei Suchkampagnen schalten |
| Tag 12–57 | Klicks sammeln, bis die Kaufquote entschieden ist |

Zwischen „hochgeladen" und „45 Tage messen" steht keine Zeile, die beantwortet,
ob die hochgeladene Seite überhaupt **gelesen** wird. Ist sie erreichbar? Ist
`robots.txt` gültig? Kommt die Sitemap an? Wird indexiert?

> **Der Plan hatte 45 Tage Messung vorgesehen und keinen Tag für die Frage, ob
> überhaupt gemessen werden kann.**

Das ist teurer, als es klingt. Ein nicht indexierter Shop liefert am Ende des
Versuchs dasselbe Bild wie ein indexierter ohne Käufer: keine Bestellung. Zwei
völlig verschiedene Befunde — *nicht gefunden* und *gefunden und nicht gekauft*
—, und der Plan könnte sie nicht auseinanderhalten. Nach 45 Tagen stünde ein
*Nein* da, das keines ist.

## Die zwölfte Etappe

> **Search Console einrichten und die Indexierung bestätigen** — 3 Tage,
> Wartezeit auf Dritte, nach dem Upload, vor dem Schalten.

Sie kostet nichts: Die Search Console ist kostenlos, die Bestätigung läuft über
eine Datei oder einen DNS-Eintrag auf der eigenen Domain. Und sie ist der
**einzige** Weg, die organische Seite des Kanals überhaupt zu sehen — die
Anzeigen messen nur, was bezahlt ist.

Sie hängt am Upload (es gibt nichts zu bestätigen, solange nichts erreichbar
ist), und das Schalten hängt jetzt an ihr. Nicht, weil ein bezahlter Klick eine
Indexierung bräuchte — er braucht sie nicht. Sondern weil ein Fehler, den die
Search Console in Minuten zeigt, sonst fünfundvierzig Tage lang als schwache
Kaufquote verbucht wird.

**Die Kette wächst dadurch von 57 auf 60 Tage** und bleibt in der Frist. Im
bestimmenden Strang liegen jetzt zwei Wartezeiten: zehn Tage für die
Rechtstexte, drei für die Indexierung.

## Die Zahl, die dabei in sechs Dateien stand

„57 Tage" stand in `rollout-90-tage.md` (dreimal), in `STATUS.md`, in
`der-plan-hing-an-nichts.md` (zweimal) — die neue Zahl in einer Datei. Der
bekannte Fall, und diesmal war das Werkzeug schon da: Die **Kette bis zur
Entscheidung** ist seit heute die fünfte Leitzahl.

Sie erfüllt alle drei Aufnahmebedingungen des Registers, und zwar deutlicher
als jede andere: **gerechnet** (aus Etappen, Budget, Klickpreis und
Abbruchschwelle), in **mehr als einem Dokument**, und sie **trägt eine
Entscheidung** — passt der Versuch in die Frist? Die Seitenzahl war heute früh
am dritten Kriterium gescheitert und wurde nicht aufgenommen. Diese scheitert
an keinem.

### Zwei Dinge, die das Register selbst korrigiert hat

**Die Bedingung war zu weit.** Der erste Anlauf deckte die alte Zahl überall
ab, wo `damals`, `zuvor` oder `inzwischen` in Sichtweite stand — Wörter, die in
dieser Akte auf jeder zweiten Seite stehen. Der Testfall *„eine Bedingung, die
überall gilt, ist keine"* hat es sofort gemeldet. Gedeckt ist die 57 jetzt nur
dort, wo **benannt** ist, was sie abgelöst hat: die Indexierungsetappe, ihr
Datum, oder die neue Zahl daneben.

**Die Leitdokumentregel war zu grob.** Sie verlangt, dass jede Leitzahl in
jedem führenden Dokument mit ihrem gültigen Wert vorkommt — und hätte
`PARAMETER.md` gezwungen, eine Plandauer zu führen. Diese Datei führt die
**Weisungen des Auftraggebers**; eine gerechnete Kettenlänge ist keine Weisung,
sondern ein Ergebnis, und es ändert sich, sobald eine Etappe dazukommt.

Heute früh war die Antwort auf eine ähnliche Spannung, das Register **nicht** zu
dehnen. Der Unterschied ist, wo gedehnt würde: Damals hätte sich die
Aufnahmeregel geändert, damit eine Zahl hineinpasst. Hier ändert sich nichts an
der Regel — sie bekommt eine **benannte Ausnahme mit Pflichtgrund**, wie jede
andere Liste in diesem Bestand auch. Der Grund wird geprüft: Wer eine Ausnahme
einträgt, deren Begründung unter vierzig Zeichen bleibt oder die auf ein
Dokument zeigt, das gar kein Leitdokument ist, bekommt einen Abbruch.

In der PR-Beschreibung steht die Zahl dagegen zu Recht — sie ist die Antwort
auf die Frage, die der Auftraggeber tatsächlich hat: **wie lange bis zur
Entscheidung.**

## Geprüft

- `npm run rollout`: 12 Etappen, 60 Tage, passt in die Frist. Die Tabelle im
  Dokument stimmt Zeile für Zeile mit der gerechneten überein.
- `npm run pruefe-leitzahlen`: fünf Leitzahlen, 13 Fundstellen für die neue,
  keine ohne Bedingung.
- Die bestehenden Registertests haben zwei Fehler in der neuen Eintragung
  gefunden, bevor ein Lauf sie sehen konnte — die zu weite Bedingung und den
  fehlenden Messwert in der Probeumgebung.
