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

## Stand

1020 Testfälle grün (vorher 1018), `pruefe-tests` 1018/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 214/214. Kampagnen
unverändert pausiert.
