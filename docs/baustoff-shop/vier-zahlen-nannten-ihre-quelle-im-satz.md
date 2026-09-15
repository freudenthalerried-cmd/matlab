# Vier Zahlen nannten ihre Quelle im Satz — und standen in keinem Register

**7. September 2026.** `npm run pruefe-quellen` meldet seit Wochen
**„Aussagen: 6 von 6 belegt"**. Das stimmt. Es ist nur eine Aussage über das
**Register** und keine über die Seiten: Gezählt werden die eingetragenen
Aussagen, nicht die geschriebenen.

> **Ein Quellenregister, das nur die eingetragenen Aussagen zählt, ist so
> vollständig wie die Eintragung.**

Dieselbe Form wie beim Rolloutplan und bei der PR-Beschreibung, nur an der
Stelle, an der es am meisten kostet: Diese Seiten stehen da, damit ein
Handwerker den richtigen Artikel bestellt. Ein falscher Gefällewert kostet eine
Kanalleitung, keine Nachbesserung.

---

## Von der anderen Seite gemessen

Nicht „hat jede Eintragung eine Quelle", sondern „hat jede Zahl auf den Seiten
eine Eintragung". Gezählt über 26 Inhaltsseiten, gesucht wurden Zahlen **mit
Einheit** — €, %, mm, cm, m², kg, Tage, Grad: **vierundzwanzig**, wenige genug,
um jede einzeln anzusehen.

Vier standen ohne Eintrag da. Das Bittere daran:

**Alle vier nennen ihre Quelle im laufenden Satz.**

| Zahl | Seite | was der Satz selbst sagt |
|---|---|---|
| Füllungsgrad **70 %** | `kanal-was-zusammengehoert.md` | „Ebenfalls nach ÖNORM B 2501, Abschnitt 5.7.1" |
| Bogenradius **500 mm** | `kanal-was-zusammengehoert.md` | „ÖNORM B 2501, Ausgabe 2009-09-01, Abschnitt 5.7.1" |
| **1.934 €** und **614 €** | `warum-keine-gratislieferung.md` | „Quelle: eigene Lieferantenrechnungen, Stand: 2026-08-31" (siehe unten — sie bleiben bewusst ohne Registereintrag) |

Die ersten beiden stammen aus **demselben Abschnitt 5.7.1**, aus dem vier
Zeilen darüber die eingetragenen Gefällewerte kommen. Dieselbe Fundstelle, halb
verzeichnet. Der Text war ehrlich, das Register unvollständig — und geprüft hat
es niemand, weil der Prüfer von der falschen Seite zählte.

---

## Die Datei wusste die Antwort schon

Für die beiden Rechnungssummen wollte ich eine neue Quellenart `beleg`
nachtragen — die fünfzehn Lieferantenrechnungen sind die stärkste Belegart
dieses Vorhabens, jeder Einkaufspreis, Gate 20, Gate 22, Gate 25 ruhen auf
ihnen, und im Register gab es dafür keine Kategorie.

Beim Einfügen stand zwei Zeilen darüber, seit dem 27. August:

> „Preise und Einkaufskonditionen stehen **NICHT** hier. Sie tragen ihren
> Preisstand am Artikel und stammen aus Lieferantenbelegen; **eine Rechnung ist
> kein Beleg im Sinn dieses Registers, sondern ein Geschäftsvorfall.**"

Das ist eine Grenze mit Grund, und sie ist älter als mein Einfall. Die neue
Quellenart ist wieder draußen. Die beiden Summen stehen jetzt mit **genau
dieser Begründung** unter den Zahlen ohne Fundstellenpflicht: nachprüfbar in
`preise/`, und das liegt bewusst außerhalb des Verzeichnisses.

> **Bevor man eine Regel ergänzt, liest man, was sie schon sagt.**

Was auf einer Kundenseite aus so einem Beleg stehen darf, bleibt ohnehin eng:
Genannt sind zwei **Rechnungssummen**, keine Artikelpreise. Aus ihnen lässt
sich keine Spanne rechnen — sie sagen etwas über die Fracht, nicht über den
Aufschlag.

---

## Drei Werte brauchen keine Fundstelle

Und sagen, warum:

- **100 m²** ist die Bezugsgröße der Systemlisten, keine Aussage über die Welt.
  Belegpflichtig ist, was daraus folgt — Kleber je m², Dübel je m² —, und das
  steht mit seiner Norm im Register.
- **87°** ist die Handelsbezeichnung des gebräuchlichen KG-Bogens. So heißt das
  Teil, mehr nicht; die Aussage daneben — dass er in Grund- und Sammelleitungen
  der falsche Artikel ist — trägt die ÖNORM.
- **90°** ist Rechnung: zwei Bögen zu 45°. Eine Quelle für „zweimal
  fünfundvierzig ist neunzig" wäre eine Verlegenheitsangabe.

Der Prüfer hält die Liste in **beide** Richtungen: Eine begründete Ausnahme,
deren Zahl von keiner Seite mehr steht, meldet er als `grund-ohne-zahl`. Eine
Begründung, die einen Zustand deckt, den es nicht mehr gibt, ist keine.

Ausgenommen ist ein einziger Ordner: `probe/`, die Vorlage für
`npm run pruefe-quellen --probe`. Ihre Zahlen sind mit Absicht erfunden — sie zu
belegen hieße, die Vorlage zur Wahrheit zu erklären.

---

## Die Gegenprobe

Sie nimmt die Zahl aus der nachgetragenen Aussage heraus: Die Fundstelle bleibt
im Register stehen, die Zahl auf der Seite verliert sie. Genau der Zustand, den
sechs Wochen lang niemand gesehen hat — und den `pruefe-quellen` weiterhin mit
„alles belegt" quittieren würde.
