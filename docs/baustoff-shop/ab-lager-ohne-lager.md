# „Ab Lager" — ohne Lager

**31. August 2026.** Dreimal an einem Tag zeigte das Kampagnenwerkzeug an die
falsche Stelle: veraltete Adresse, falsche Gegend, nicht existierende
Zielseiten. Jedes Mal ging es darum, **wohin** die Anzeige führt. Diesmal die
andere Frage: **Was behauptet sie?**

Alle Anzeigentexte des ersten Anlaufs durchgelesen. Zwei Befunde.

## 1. Eine Zusage, die der Betrieb nicht halten kann

```
Dämmung · Überschrift 1:  „XPS und EPS ab Lager"
```

`PARAMETER.md`, Zeile 49:

> | Logistik | Reines Streckengeschäft, **kein eigenes Warenlager** |

Die Ware geht vom Lieferanten direkt auf die Baustelle. Ein Lager gibt es
nicht, und es soll auch keines geben — das ist eine der tragenden
Entscheidungen des ganzen Modells.

> **Im B2B-Baustoffhandel ist „ab Lager" keine Floskel, sondern eine
> Terminzusage.** Der Bauleiter plant danach: Er bestellt auf Freitag, weil
> „ab Lager" heißt, dass die Ware da ist, und stellt die Kolonne auf Montag
> ein. Diese Zusage zu machen, ohne ein Lager zu haben, ist nicht bloß
> ungenau — sie kostet ihn einen Tag.

Das ist ein anderer Fehler als die drei davor. Die kosteten **uns** Geld
(bezahlte Klicks ins Leere). Dieser kostet **den Kunden** etwas, und er tut es
erst, nachdem er bestellt hat.

Ersetzt durch „XPS und EPS vom Baumeister" — dieselbe Aussage, die die
Kampagne ohnehin trägt, und eine, die stimmt.

## 2. Ein Satz, der abgeschnitten wurde

```
WDVS · Überschrift 5:  „Vom Baumeister, nicht vom"
```

Fünfundzwanzig Zeichen, also innerhalb der dreißig, die Google zulässt — und
trotzdem ein Fragment. Jemand hat „… nicht vom Baumarkt" (34 Zeichen) gekürzt,
statt es umzuformulieren.

Das Bittere daran: Dieses Werkzeug verhindert genau diesen Fehler bei den
**Keywords** seit Langem. Aus seinem eigenen Dateikopf:

> Ein erster Versuch mit einfachem Abschneiden erzeugte Fragmente wie „Baumit
> TextilglasGitter 1,1x" — schlimmer als nichts, weil es nach einem gepflegten
> Konto aussieht.

Für die Anzeigentexte galt die Regel nicht — obwohl dort ein **Mensch** liest,
und nicht ein Auktionsalgorithmus. Die Längenprüfung war da, die
Vollständigkeitsprüfung nicht: `pruefeTexte` maß Zeichen, nicht Sätze.

Ersetzt durch „Baumeisterpreis, nicht Liste".

## Was geändert wurde

`pruefeTexte` prüft jetzt drei Dinge statt einem:

| | |
|---|---|
| Länge | wie bisher — Google weist zu lange Texte beim Import ab |
| **Vorratsworte** | „ab Lager", „auf Lager", „lagernd", „sofort verfügbar", „vorrätig", „Lagerware" |
| **Satzenden** | keine Überschrift endet auf Präposition, Artikel oder Konjunktion |

Das Werkzeug bricht bei einem Fund ab (Ausgangscode 1) und schreibt die
Fundstelle mit Begründung. Nachgeprüft, indem die alten Texte wieder
eingesetzt wurden:

```
Anzeigentexte, die so nicht hinausgehen:

  WDVS · Überschrift 5: „Vom Baumeister, nicht vom" endet auf „vom"
      — abgeschnitten statt umformuliert
  Dämmung · Überschrift 1: „XPS und EPS ab Lager" behauptet Vorrat
      — der Shop führt kein eigenes Lager (PARAMETER.md, Streckengeschäft)
```

Die Überschrift der Meldung lautete bis heute „Anzeigentexte überschreiten die
Längengrenzen von Google Ads". Das wäre jetzt eine falsche Überschrift über
einer richtigen Liste — sie heißt „Anzeigentexte, die so nicht hinausgehen".

## Gegenproben

| Mutation | erkannt |
|---|---|
| Vorratswache aus, „ab Lager" zurück | ja |
| Fragmentwache aus, „nicht vom" zurück | ja |

Beide Mutationen schalten **die Wache und den Text zugleich** um — sonst
prüfte die Gegenprobe nur, ob das Werkzeug abbricht, und nicht, ob die Probe
den Fehler in der fertigen Datei findet. Geprüft gehört beides: dass das
Werkzeug es nicht ausgibt, und dass es auffiele, wenn es doch dastünde.

`pruefe-tests` meldete danach eine Schleife ohne Längenzusicherung — ergänzt.

## Was noch offen ist, aber nicht von mir entschieden wird

Zwei Aussagen habe ich stehen lassen, weil sie stimmen, aber ein Auge
verdienen:

- **„Kein Baumarktpreis"** — vergleichende Werbung. In Österreich zulässig,
  solange sie nachprüfbar und nicht herabsetzend ist. Sie ist hier beides
  nicht verletzt, aber der Rechtstexteanbieter sollte sie sehen, wenn er
  ohnehin über die AGB schaut.
- **„geliefert und mit Kran entladen"** (Mauerwerk, zurückgestellte Gruppe) —
  gedeckt durch den Sperrgutzuschlag von 7,50 € je Hub, der genau die
  Kranentladung bezahlt. Wahr, solange der Zuschlag im Warenkorb landet, und
  das prüft `pruefe-preise`.

## Nachtrag: Dieselbe Frage an die 81 Seiten

Wenn eine Anzeige einen Vorrat behauptet, den es nicht gibt, liegt die Frage
nahe, ob die Seiten dasselbe tun. Beide Durchsichten sind gelaufen:

| gesucht | Fundstellen |
|---|---|
| Vorratszusagen („ab Lager", „lagernd", „vorrätig", „sofort verfügbar", …) | **1**, und die ist richtig |
| Terminzusagen (Tagesangaben, „kurzfristig", „umgehend", „Lieferzeit") | **3**, alle richtig |

Die eine Vorratsfundstelle steht in `wissen/xps-oder-eps` und rät vom
Gegenteil ab:

> Die Stärke ergibt sich aus dem Wärmeschutznachweis des Bauvorhabens — nicht
> aus dem Preis und **nicht aus dem, was vorrätig ist**.

Die drei Terminfundstellen nennen die fehlende Lieferzeit als **Grund**, warum
noch nicht bestellt werden kann (Startseite, `llms.txt`), und die dritte ist
die Absage an das Zahlungsziel in den AGB. Keine Seite verspricht einen
Termin.

**Die Seiten sind sauber.** Damit sie es bleiben, prüft
`src/inhaltspruefung.js` sie jetzt darauf — und zwar in einer **eigenen
Liste**, getrennt von den `GRENZWOERTER`:

| Liste | sammelt |
|---|---|
| `GRENZWOERTER` | was **kein** Baustoffhändler behaupten darf — Gesundheitswirkung, Rechtsauskunft, Erfolgszusage |
| `BETRIEBSAUSSAGEN` | was **dieser** nicht darf, weil seine eigenen Festlegungen dagegen stehen |

Der Unterschied ist nicht kosmetisch: „ab Lager" ist für einen Händler mit
Lager eine wahre Aussage. Die Begründung jeder Betriebsaussage muss ihre
Grundlage nennen — die Probe verlangt, dass `PARAMETER.md` darin vorkommt.

### Verneinungen schlagen nicht an

Das war der heikle Teil. Ein Prüfer, der die Zeile aus `xps-oder-eps` meldet,
meldet die **richtige** Auskunft — und wird abgeschaltet statt befolgt. Genau
diese Sorge hat schon den Kopfblock von der Prüfung ausgenommen.

Die Verneinung wirkt deshalb **nur nach links und nur im selben Satz**:

- „nicht aus dem, was vorrätig ist" — still, die Verneinung steht davor.
- „ab Lager, nicht auf Bestellung" — **meldet**, die Verneinung steht danach
  und verneint etwas anderes.
- „Wir raten nicht dazu. Die Ware ist vorrätig." — **meldet**, ein „nicht" im
  vorigen Satz geht diesen nichts an.

Vier Mutationen dazu, alle erkannt: Regel abgeschaltet, Verneinung ignoriert,
Verneinung auf den ganzen Absatz ausgedehnt, Satzgrenze entfernt.

Die vierte kam im ersten Anlauf gar nicht an — meine Ersetzung zerlegte die
Maskierung des regulären Ausdrucks, und die Datei blieb unverändert. **Zum
dritten Mal an einem Tag dieselbe Falle**, und sie meldet jedes Mal Grün.
Sauber wiederholt, dann erkannt.

## Stand

1024 Testfälle grün (vorher 1018), `pruefe-tests` 1022/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 214/214. Kampagnen
unverändert pausiert.
