# Achtmal Merkblatt, und kein Weg

**7. September 2026.** Die zweite der vier Redaktionsregeln lautet:

> **Zweitens: Eine Zahl ohne Herkunft ist keine Zahl.** Verbrauchswerte,
> Schichtdicken und Verarbeitungsbedingungen stehen nur dann hier, wenn das
> zugehörige Merkblatt verlinkt ist. Fehlt der Beleg, fehlt der Wert — und die
> Seite sagt, dass er fehlt.

Diese Regel **hält der Bestand**. Die Inhaltsseiten schreiben keine Kennwerte
ab; „Mengen für 100 m² Fassade" sagt sogar ausdrücklich, warum es die eine
Stückliste nicht gibt, und bietet stattdessen *„den Rechenweg, in den Sie die
Werte aus **Ihrem** Merkblatt einsetzen"*.

Gezählt wurde die andere Hälfte — **wie oft eine Seite ins Merkblatt schickt
und wie oft sie sagt, wo es liegt:**

| Seite | Erwähnungen | Herstellerverweise |
|---|---|---|
| `wissen/mengen-fuer-100-qm-wdvs` | **8** | **0** |
| `wissen/verarbeitung-bei-kaelte-und-naesse` | 6 | 2 |
| `wissen/wdvs-systemaufbau` | 3 | 2 |
| `wissen/xps-oder-eps` | 1 | **0** |
| `gruppe/mauerwerk` | 1 | **0** |
| `gruppe/moertel` | 1 | 1 |
| `gruppe/wdvs` | 1 | 1 |

Vier von acht nannten keinen Hersteller — und die mit Abstand deutlichste
Lücke sitzt auf der Seite, deren ganzer Zweck der Rechenweg mit dem eigenen
Merkblatt ist.

> **Eine Seite, die den Leser ins Merkblatt schickt und den Weg dorthin
> verschweigt, hat die Auskunft an die Stelle verlegt, an der sie nicht
> steht.**

---

## Der Shop kennt den Weg, nur die Seiten kannten ihn nicht

`src/hersteller.js` führt seit dem 1. September zu jeder Marke die
Herstellerseite, und **jede Artikelseite** verlinkt sie. Die Inhaltsseiten
kannten das Register nicht.

Das ist dieselbe Bauart wie der Anlass, aus dem dieses Register überhaupt
entstand: Die Marke lag im Bauwerkzeug, deshalb trug jede Artikelseite ihr
`brand` und **keine der 43 Feedzeilen**. Wissen, das in einem Werkzeug liegt,
fehlt überall dort, wo ein anderes Werkzeug arbeitet.

---

## Abgeleitet, nicht eingetragen

`src/merkblattverweis.js` nimmt die **Warengruppe der Seite** und die Marken,
die der Katalog in dieser Gruppe führt:

```
WDVS       → Baumit Österreich · Synthesa (Capatect)
Dämmung    → Isover Österreich
Mörtel     → Baumit Österreich
Kanal      → (keine Marke im Katalog)
Mauerwerk  → (keine Marke im Register)
```

Sechs Seiten tragen den Absatz seither. **Wo keine Marke bekannt ist, steht
nichts** — Kanalrohre und der Ökotherm-Ziegel tragen keine, und ein erfundener
Weg wäre schlimmer als keiner. Der Prüfer verlangt den Verweis deshalb auch
nur dort, wo der Bestand einen kennt.

Verlinkt wird die **Herstellerseite und kein Dokument**: Ein tiefer PDF-Pfad
sieht aus wie ein Beleg und ist beim nächsten Update des Herstellers einer auf
eine Fehlerseite. Diese Entscheidung stand seit dem 1. September im Kommentar
von `HERSTELLER`; ein eigener Testfall hält sie jetzt fest.

---

## Geprüft

`test/merkblattverweis.test.js`, neun Fälle: die Ableitung (Marken je Gruppe,
doppelte Hersteller, unbekannte Marke, fehlende Gruppe), das Muster für
Merkblatt und Datenblatt im Singular und Plural, die Regel für sich — und zwei
über den **Bestand**: Jede gebaute Seite, die ein Merkblatt nennt, nennt auch
den Weg dorthin, und der Weg zeigt auf keine PDF-Adresse.

Gegenprobe `merkblatt-ohne-weg-dorthin` lässt die Herstellerliste je Gruppe
wieder leer laufen.

---

**Was das offen lässt.** Der Verweis führt auf die Startseite des Herstellers,
nicht auf das Blatt. Das ist die bewusste Entscheidung von damals und bleibt
sie — der kürzere Weg wäre eine Adresse, die niemand nachhält. Die vollständige
Antwort hängt an den **Herstellerdatenblättern**, die als offener Punkt im
Register stehen: Aus dieser Arbeitsumgebung sind `baumit.at`, `schiedel.at`,
`synthesa.at` und `isover.at` gesperrt.
