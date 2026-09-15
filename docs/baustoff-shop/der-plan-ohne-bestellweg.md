# Der Plan ohne Bestellweg

**4. September 2026, Nachmittag.** `npm run offenepunkte` führt neunzehn
Punkte in fünf Gruppen. Achtzehn warten auf den Auftraggeber. Der neunzehnte
steht unter **„Meine Arbeit"**:

> **Der Kunde kann eine Bestellung abschicken** — die Oberfläche schickt
> nichts ab; die Kasse rechnet und erzeugt einen Anfragetext zum Kopieren.

Ich habe ihn heute zweimal aufgeschoben, beide Male mit demselben Argument:
zu groß für eine Runde, und er berührt Rechtstexte, die Geld kosten. Beim
dritten Mal habe ich in den Rolloutplan gesehen.

## Dreizehn Etappen, und keine davon war der Bestellweg

`npm run rollout` rechnet die Kette bis zur Entscheidung: Repository privat,
Impressum, Suchvolumen, Rechtstexte, Lieferantengespräch, Katalog erweitern,
Upload, Indexierung, Feed, Zahlungsanbieter, Anzeigen, Klickversuch, Anfragen
zählen. Sechzig Tage.

> **Am Ende dieser sechzig Tage wäre der Shop genauso wenig bestellfähig
> gewesen wie heute.**

Das ist nicht dieselbe Lücke wie am 3. September, als `startklar` neun Punkte
führte und keiner der Bestellweg war. Das war eine Bereitschaftsliste. Dies
ist der **Plan**, den der Auftraggeber vor der Budgetfreigabe liest.

Und er enthielt eine falsche Zusage. Die Etappe „Zahlungsanbieter" schloss mit:

> *Erst danach kann die Kasse etwas auslösen. Vorher erzeugt der Shop
> Anfragen.*

Sie kann es auch danach nicht. Es gibt keinen Weg, auf dem eine Bestellung den
Browser verlässt — kein `fetch`, kein Formular, kein Beacon; nachgemessen und
nicht erinnert (`bestellwegBefund`). Der Satz versprach eine Wirkung, die zehn
Tage Legitimationsprüfung und eine laufende Gebühr gekostet hätte.

> **Der Plan hätte den Auftraggeber einen Zahlungsanbieter bezahlen lassen,
> der nichts zu kassieren bekommt.**

## Warum die Etappe fehlte

Der Plan ist aus den **offenen Punkten** gewachsen, und die offenen Punkte
kommen aus den Prüfern. Achtzehn von neunzehn zeigen auf den Auftraggeber,
und für die ist die Etappe „warten" oder „eintragen". Der eine, der auf mich
zeigt, hat keinen Prüfer, der eine Dauer nennt — also stand er in der Liste
und nicht im Plan.

> **Ein Plan, der nur aus fremden Abhängigkeiten wächst, enthält die eigene
> Arbeit nur zufällig.** Dieselbe Familie wie die Etappe, die am 3. September
> „Kaufquote" hieß und Anfragen maß: Nicht das Urteil war falsch, sondern das,
> worüber geurteilt wurde.

## Gate 26 — die Entscheidung, vor der ersten Zeile Code

Vier Wege, drei ausgeschieden:

| Weg | Urteil |
|---|---|
| **Eigenes Empfangsskript** auf dem Hosting des Auftraggebers (All-Inkl, PHP) | **gewählt** |
| `mailto:` mit vorbereitetem Text | sendet nichts |
| Fremder Formulardienst | kostet Geld, Art. 28 DSGVO |
| Fertiges Shopsystem | wirft den ganzen Bestand weg |

**Gewählt, weil es nichts kostet, ohne Dritten auskommt und die Daten des
Kunden beim Auftraggeber bleiben.** Der Hoster steht ohnehin fest und kann
PHP; ein Auftragsverarbeiter entsteht dadurch nicht zusätzlich.

`mailto:` bleibt als Bequemlichkeit neben dem Kopiertext. Es ist nur kein
Bestellweg: Es öffnet das Programm des Kunden, und ob dort jemand auf „Senden"
drückt, erfährt dieser Shop nie. Wer es in die Absendeliste aufnähme, machte
den Punkt grün, ohne dass eine einzige Bestellung ankäme.

## Gebaut werden darf er heute. Eingeschaltet nicht.

Zwei Voraussetzungen stehen im Register, mit Feld und Grund:

- **`betreiber.email`** — ohne Empfänger benachrichtigt das Skript niemanden,
  und die Bestellung läge in einer Datei, in die keiner sieht.
- **`rechtstexteFundstelle`** — und dies ist die unangenehmere. Die
  Datenschutzseite sagt heute: *„Der Warenkorb liegt in localStorage des
  Besuchers und wird nicht an den Server übertragen."* Diese Zusage ist nicht
  bloß hingeschrieben, sie wird **gemessen** (`npm run pruefe-datenschutz`,
  seit dem 2. September), und sie stimmt.

> **Sie muss mit demselben Bau fallen, mit dem der Bestellweg entsteht.** Ein
> Bau, der den Weg einschaltet und die Zusage stehen lässt, erzeugt auf einer
> Rechtsseite eine Unwahrheit — und zwar eine geprüfte. Art. 13 DSGVO verlangt
> die Beschreibung **vor** der ersten Übertragung, nicht danach.

Genau deshalb hängt die neue Etappe an `rechtstexte` und an `impressum` und
nicht am Upload: Sie ist nicht durch Aufwand blockiert, sondern durch zwei
Angaben und einen Wortlaut.

## Was sich heute geändert hat

- Der Plan hat eine **vierzehnte Etappe**: „Den Bestellweg bauen: Formular,
  Empfangsskript, Ablage", zwei Tage, meine Arbeit, Gate 26.
- „Zahlungsanbieter" hängt jetzt **an ihr** und verspricht nicht mehr, was es
  nicht halten kann.
- Die Kette bleibt bei **60 Tagen**: Die neue Etappe läuft neben dem
  Hochladen und verlängert den kritischen Pfad nicht. Sie kostet Arbeit, keine
  Frist.
- `src/bestellweg.js` führt die Entscheidung, die drei verworfenen Wege und
  die zwei Voraussetzungen — jede mit Pflichtgrund, damit die nächste Runde
  nicht von vorne anfängt.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste, und eine Sache am Zahlungsanbieter: Er gehört **nach**
den Bestellweg, nicht vor ihn. Wer die Reihenfolge umdreht, zahlt zehn Tage
früher für etwas, das noch nichts zu tun hat.
