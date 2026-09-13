# Die Probe schloss keinen Vertrag

**13. September 2026. Runde 63.**

## Der Fund

`npm run bestellprobe` ist der eine Lauf, der die ganze Kette fährt — mit
echtem PHP, echtem Browser und echter Akte in einem Wegwerfordner. Er endet
mit dem Satz *„Der Weg trägt."*

Seit gestern gibt es die Regel, dass eine Rechnung den Vertragsschluss
voraussetzt (AGB Punkt 2). Die Akte der Probe, mit `npm run akte` gelesen:

```
  Vorgang 2026-9001 — 2 Eintrag/Einträge, Journal 2026
    FEHLT: auftragsbestaetigung — rechnung liegt in der Akte,
           das Papier davor nicht
```

> **Die Probe, die sagt „der Weg trägt", baute eine Akte, die nicht
> zusammenpasst.** Sie ging vom Angebot direkt zur Rechnung.

Und ihr dreizehnter Schritt — *„Die gebaute Akte hält `npm run pruefe-ablage`
stand"* — blieb grün: Der Prüfer vergleicht Journal, Durchschriften und Auszug
und wusste von Voraussetzungen nichts.

## Zwei Lücken, nicht eine

| | |
| --- | --- |
| **Die Probe** | sprang über den Vertragsschluss — den Schritt, den sie seit gestern fahren **kann** |
| **Der Prüfer** | las die Regel nicht mit; gelesen hat sie nur `npm run akte`, also das Werkzeug, das jemand **aufschlägt** |

Die zweite ist die schwerere. Eine Regel, die nur dort gilt, wo jemand
hinsieht, gilt in einem unbeaufsichtigten Lauf nicht — und § 131 Abs 1 Z 5 BAO
verlangt den Geschäftsfall rückführbar, unabhängig davon, ob ihn jemand
aufschlägt.

## Was jetzt gilt

**Die Probe schließt den Vertrag.** Zwischen Angebot und Rechnung steht seit
heute:

```
  ✓ Die Auftragsbestätigung schließt den Vertrag und nennt das Konto
```

Dafür braucht sie zweierlei: die Bankverbindung, die seit gestern nacht durch
`bin/vorgang.mjs` durchkommt und aus der Betreiberdatei des Tages X stammt —
und eine **Lieferzeit**. Die ist eine offene Frage an den Lieferanten; die
Probe schreibt sie in eine eigene Datei (`VORGANG_LIEFERANTEN`).

> **Eine erfundene Lieferzeit im echten Bestand wäre eine Zusage an Kunden.
> Hier ist sie ein Wert, mit dem sich der Weg fahren lässt** — dieselbe
> Trennung wie zwischen der Probe-IBAN und einem echten Konto.

Geprüft wird dabei nicht nur, dass die Bestätigung entsteht, sondern dass sie
das **Konto nennt**: Ohne es verlangt sie Zahlung sofort und sagt nicht wohin.

**Und `npm run pruefe-ablage` liest die Voraussetzungen mit.** Je Vorgang, mit
der neuen Regel `voraussetzung-fehlt`:

```
✗ Vorgang 2026-0201 (2026): lieferantenbestellung liegt in der Akte,
  auftragsbestaetigung nicht — Ohne Vertragsschluss ist Ware beim Lieferanten
  bestellt, an die kein Kunde gebunden ist (AGB Punkt 2).  [voraussetzung-fehlt]
```

Gelesen werden **Arten**, kein Inhalt — dieselbe Regel wie bei den drei
Abgleichen daneben.

## Die Kette, zum ersten Mal vollständig

```
Bestellprobe — 14 Prüfungen von Klick bis Sicherung

  ✓ Die Kasse meldet Nummer, Vertragslage und Antwortzeit
  ✓ Die Ablage liegt außerhalb des Webverzeichnisses
  ✓ In der Ablage: B-2026-0001, Musterbau GmbH, 1087 Zeichen Positionsliste
  ✓ Der Stempel nennt den Geschäftstag
  ✓ Aus der abgelegten Bestellung lässt sich ein Angebot machen
  ✓ Aus dem Journal entsteht über posteingang und vorgang ein Angebot
  ✓ Die Auftragsbestätigung schließt den Vertrag und nennt das Konto
  ✓ Am Tag X entsteht aus derselben Bestellung eine Rechnung nach § 11 UStG
  ✓ Die Rechnung liegt als Durchschrift in der Akte
  ✓ Die Akte liest den Vorgang zurück und nennt Beleg und Frist
  ✓ Die Gutschrift hebt die Rechnung auf, ohne sie zu ändern
  ✓ Der Auszug für die Buchhaltung zählt nur Umsätze
  ✓ Die Sicherung erreicht auch die Durchschriften in den Unterordnern
  ✓ Die gebaute Akte hält npm run pruefe-ablage stand
```

Der letzte Schritt prüft jetzt auch die Voraussetzungen — die beiden Lücken
dieser Runde können sich also nicht gegenseitig decken.

## Ausgang

| | |
| --- | --- |
| Prüfungen der Bestellprobe | 13 → **14** |
| Neue Regel | `voraussetzung-fehlt` in `npm run pruefe-ablage` |
| Die Probe | schließt den Vertrag, mit Konto auf dem Papier |
| Testfälle | 2.440 → **2.441** |
| Gegenproben | 237 → **239** |

---

**Die Regel dieser Runde:** *Eine Regel, die nur das Werkzeug kennt, das
jemand aufschlägt, gilt im unbeaufsichtigten Lauf nicht — und eine Probe, die
einen Schritt überspringt, beweist die Kette ohne ihn.*
