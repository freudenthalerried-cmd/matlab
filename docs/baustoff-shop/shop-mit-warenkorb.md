# Aus dem Schaufenster wird ein Laden

Stand: 2026-08-27. Weisung: *„baue eine richtig hochwertigen shop wie
amazon"*. Bis heute war die Seite ein **Prospekt**: 80 Seiten, Preise,
Zeichnungen — und nichts, was ein Kunde hätte tun können.

> **Was an einem guten Shop hochwertig ist, sind nicht Verläufe und
> Schatten, sondern vier Dinge, die ein Kunde tut: finden, eingrenzen,
> vergleichen, sammeln.** Keines davon war möglich.

Jetzt sind alle vier gebaut.

## Was dazugekommen ist

| | |
|---|---|
| **Suche** | in der Kopfleiste, mit Vorschlägen beim Tippen; eigene Ergebnisseite |
| **Filter und Sortierung** | Warengruppe, Preisvorteil, palettierte Ware; vier Sortierungen |
| **Warenkorb** | Menge je Artikel, überlebt den Seitenwechsel, Zähler in der Kopfleiste |
| **Kasse** | Lieferbezirk nach Gate 23, Zahlweg, vollständige Rechnung — und ein ehrliches Ende |

Dazu drei neue Seiten (`suche`, `warenkorb`, `kasse`), ein „In den
Warenkorb" auf jeder Artikelseite und eine Filterleiste über jedem
Warenraster.

## Die Suche musste Deutsch lernen

Der erste Entwurf suchte nur **Wortanfänge**, mit der Begründung,
Wortmitten fänden zu viel. Der erste Probelauf hat ihn widerlegt: Die
Suche nach „spachtel" fand den **Baumit KlebeSpachtel** nicht.

> **Deutsch setzt zusammen.** Eine Suche, die nur Wortanfänge kennt, findet
> im Baustoffhandel die Hälfte des Sortiments nicht — Klebespachtel,
> Putzgrund, Trennwandfilz, Kantenschutz, Grundmauerschutz.

Jetzt trifft ein Suchwort auch in der Wortmitte, **ab vier Zeichen** —
kurz genug für „putz", lang genug, um nicht jede Artikelnummer zu treffen.
Der Treffer in der Mitte zählt weniger als der am Anfang, und der weniger
als das ganze Wort; deshalb steht der Spachtel vor dem Klebespachtel.

Zwei weitere Entscheidungen, beide gegen die bequeme Variante:

- **Umlaute werden doppelt abgelegt** (ö und oe). Wer auf einem
  Baustellenhandy tippt, schreibt „moertel", und das ist dieselbe Ware.
- **Mehrere Suchwörter grenzen ein, statt zu erweitern.** „xps 50" liefert
  die 50-mm-Platte und nicht alles mit XPS und alles mit einer 50 darin.

Und wenn nichts passt, schweigt die Suche, statt etwas Ähnliches zu
zeigen: *„Der Katalog umfasst 46 Artikel aus dem laufenden Einkauf. Was
nicht darin steht, führen wir nicht — wir zeigen lieber nichts als etwas
Erfundenes."*

## Die Rechnung im Browser — und warum sie zweimal existiert

Der Warenkorb rechnet mit dem **eingebetteten Rechenkern**, nicht mit
einer Nachbildung. Eine Stelle ist trotzdem doppelt, und der Grund gehört
aufgeschrieben:

`berechneWarenkorb()` im Rechenkern braucht **Einkaufspreise** — für den
Bestellwert, die Frei-Haus-Schwelle und den Mindestbestellwert. Die dürfen
nicht in die Seite (`interna-auf-der-kundenseite.md`). Also gibt es
`kundenWarenkorb()`:

> Es ist keine zweite Rechnung derselben Sache, sondern **dieselbe Rechnung
> mit weniger Wissen.**

Damit daraus keine zweite Wahrheit wird, hält ein Testfall beide
aneinander: Für denselben Korb müssen Warenwert, Fracht und Summe
übereinstimmen. Und was die Kundenrechnung **nicht** kann, sagt sie —
liegt bei einem Lieferanten eine Frei-Haus-Schwelle, erscheint ein Hinweis
statt einer stillen Auslassung.

## Die unangenehme Zahl steht auf der Seite

Der erste Probekorb hat sofort gezeigt, wofür der Shop gebaut ist und wo
er wehtut:

| | |
|---|---|
| drei Platten Fassaden-EPS | **6,39 €** Warenwert |
| Fracht | **83,00 €** |

Dreizehnmal so viel Fracht wie Ware. Der Warenkorb sagt das jetzt selbst:

> **Die Fracht kostet hier mehr als die Ware.** … Das lohnt sich für Sie
> nicht — legen Sie zusammen, was ohnehin gebraucht wird, oder holen Sie
> die Kleinmenge im Fachhandel vor Ort. Wir sagen das lieber hier als auf
> der Rechnung.

Das ist dieselbe Haltung wie bei der Zahlungsgebühr, die im Angebot
gefehlt hat, und dieselbe wie bei den Beipack-Artikeln aus Gate 22. Ein
Shop, der einem Kunden von einer Bestellung abrät, verliert eine
Bestellung und behält den Kunden.

Es ist zugleich die beste Begründung für die Paketfrage, die derselbe Tag
aufgeworfen hat ([`paketversand-kleine-einheiten.md`](./paketversand-kleine-einheiten.md)).

## Was der Interna-Prüfer dabei gefunden hat

Der Riegel von heute früh hat sofort gemeldet, dass der eingebettete
Datensatz den **Lieferantennamen** enthält. Die Prüfung, ob er recht hat,
fiel zu seinen Gunsten aus — aber nicht so, wie die Regel es vorsah:

**Die Oberfläche zeigt den Namen nirgends. Sie braucht ihn also nicht.**
Was nicht gebraucht wird, wird nicht ausgeliefert — das ist billiger als
eine begründete Ausnahme. Der Name ist aus den Nutzdaten entfernt.

Vollständig verbergen lässt er sich damit nicht, und das steht jetzt im
Code: Die Artikelnummern tragen sein Kürzel (`POS-…`), und die Seiten
weisen seine Artikelnummer **absichtlich** aus, damit ein Kunde
nachbestellen kann.

> **Geheim ist nicht die Geschäftsbeziehung, geheim sind die Konditionen.**

## Der Fehler, den erst die Probe gefunden hat

`ausgabe/website.html` — die Einzeldateifassung, die schon zweimal an den
Auftraggeber gegangen ist — hatte **keine Zeichensatzangabe**. Kein
`<meta charset>`, nirgends. Die Mehrseitenfassung bekommt ihres aus dem
HTML-Gerüst; die Einzeldatei hat kein Gerüst und hatte deshalb keins.

Ein Browser, der nicht rät, zeigt dann „fÃ¼r" statt „für" — auf jeder
Seite, in jedem Bezirksnamen, in jeder Einheit.

Gefunden hat es nicht das Auge, sondern die neue Shopprobe: Drei
Szenarien schlugen fehl, obwohl der Inhalt stimmte, weil ihre
Erwartungstexte Umlaute enthielten.

> **Ein Testfall, der über Umlaute stolpert, ist kein schlechter
> Testfall.**

## Wie das geprüft ist

| | |
|---|---|
| `npm test` | **677 Testfälle**, davon 27 neu für den Shopkern |
| `npm run shopprobe` | **13 Szenarien** im echten Headless-Chromium, alle grün |
| `npm run oberflaechenprobe` | 11 Szenarien für die Arbeitsoberfläche, unverändert grün |
| `npm run website` | 80 Seiten, keine tote Adresse, keine Interna |

Die Shopprobe ist neu und prüft die **gebaute Seite**, nicht den Kern:
Suche im zusammengesetzten Wort, Eingrenzung mit zwei Wörtern, Schweigen
bei Nulltreffern, Einlegen und Zählen, Fracht mit Sperrgutzuschlag,
Warenkorb über den Seitenwechsel, Gate 23 in beide Richtungen, der
Frachthinweis und das ehrliche Ende der Kasse.

Sie läuft **nebeneinander statt nacheinander**: Ein Chromium-Start mit der
1,2-MB-Seite kostet dreizehn Sekunden, fast alles davon Start und Parsen.
Zwölf Szenarien hintereinander wären drei Minuten gewesen.

## Was der Shop weiterhin nicht kann

| | |
|---|---|
| **bestellen** | Kein Zahlungsanbieter gewählt. Die Kasse rechnet durch und endet mit dem Satz, dass sie nichts auslöst |
| **Kundenkonto** | Es gibt keinen Server. Der Warenkorb liegt im Browser des Kunden und sonst nirgends |
| **Bewertungen** | Wären erfunden. Es gibt keine Kunden |
| **Lieferzeit je Artikel** | Aus fünfzehn Rechnungen nicht ableitbar — beim Lieferanten zu erfragen |
| **Verfügbarkeit** | Der Shop weiß nicht, was der Lieferant auf Lager hat |

Die letzten beiden sind das, was einen echten Shop von diesem trennt, und
beides hängt an einer Auskunft des Lieferanten — **einer E-Mail, also
freigabepflichtig.**

**Der Warenkorb liegt ausschließlich im Browser des Kunden.** Er geht
nirgendwohin, er wird nicht ausgewertet, und er verschwindet, wenn der
Kunde seine Seitendaten löscht. Das ist kein Mangel, sondern der einzige
Zustand, der ohne Server und ohne Datenschutzerklärung mit Substanz
zulässig ist.
