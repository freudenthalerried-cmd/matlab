# Zwei Firmen, von denen eine nichts verkauft

**3. September 2026, dritte Runde am Markennamen.** Am Vormittag bekam der
Laden seinen Namen, am Nachmittag die Belege ihren Absender. Diese Runde
betrifft die Leser, für die dieser Shop überhaupt gebaut ist: **Maschinen.**

Nach dem Markenwechsel sah die Auszeichnung so aus:

| Seite | Was als Organisation dastand |
|---|---|
| Startseite | `name: Bauversand`, `legalName: Freudenthaler Bau GmbH` |
| 46 Artikelseiten (`seller`) | `name: Freudenthaler Bau GmbH` |
| 14 Wissensseiten (`publisher`) | `name: Freudenthaler Bau GmbH` |
| übrige Seiten | dasselbe |

Für einen Menschen ist das ein Schönheitsfehler — er sieht das Logo und weiß,
wo er ist. Für ein Sprachmodell oder einen Suchindex sind es **zwei
Organisationen**: eine, die die Startseite betreibt, und eine, die alles
verkauft und herausgibt. Verbunden waren sie an genau **einer** Stelle, und
zwar auf der Seite, die ein Assistent am seltensten zitiert.

> **Wer zwei Namen führt, muss sie überall zusammen führen — sonst hat er zwei
> Firmen, von denen eine nichts verkauft.**

Das trifft den Kanal, auf den dieses Vorhaben setzt. Der ganze Aufwand mit
`llms.txt`, strukturierten Daten und maschinenlesbaren Preisen zielt darauf,
dass ein Assistent auf die Frage „wo bekomme ich XPS im Bezirk Perg" einen
Namen nennt. Nennt er einen, der auf der Seite nirgends steht, hat die
Auszeichnung gegen sich selbst gearbeitet.

## Eine Funktion statt drei Literale

Die drei Stellen kommen jetzt aus einer:

```js
const organisation = () => (MARKE === FIRMA
  ? { '@type': 'Organization', name: FIRMA }
  : { '@type': 'Organization', name: MARKE, legalName: FIRMA });
```

`legalName` ist das Feld, das schema.org dafür vorsieht — Marke und
Rechtsträger in **einer** Auszeichnung, damit eine Maschine sie zusammenführt,
statt zu raten. Ohne Marke bleibt es bei der Firma allein; ein Shop, dessen
Auszeichnung sich ändert, weil eine Zugabe fehlt, wäre schlechter dran als
vorher.

**Was ausdrücklich nicht dazugehört:** `brand` am Produkt. Das Feld gehört dem
Hersteller — Baumit, Schiedel, Isover —, und der Produktfeed verlangt es
genau dafür. Es mit „Bauversand" zu füllen wäre keine Marke, sondern eine
falsche Herstellerangabe, und das ist bei Google Shopping der Unterschied
zwischen einem abgelehnten Artikel und einem gesperrten Konto.

## Geprüft

Ein Testfall geht durch **jede JSON-LD-Insel jeder gebauten Seite** und sucht
rekursiv jede `Organization` — auch die tief in `offers.seller`. Jede muss
beide Namen führen. Gemessen sind 46 Fundstellen; die Untergrenze im Testfall
liegt bei 40, damit eine Auszeichnung, die stillschweigend verschwindet, nicht
als „alle in Ordnung" durchgeht.

Gegengeprobt: `publisher` zurück auf die Firma allein — **24 Organisationen
führen nicht beide Namen**, der Fall fällt.

## Die Kette, die drei Runden gebraucht hat

Ein Name, drei Orte, drei Läufe:

| Runde | Wo der alte Name allein stand | Wer es gemerkt hätte |
|---|---|---|
| Vormittag | Kopfleiste aller 81 Seiten | der Auftraggeber — er hat es gemerkt |
| Nachmittag | Absender auf Angebot, Auftragsbestätigung, Rechnung | das Lesen des erzeugten Belegs |
| jetzt | `publisher` und `seller` in jeder Auszeichnung | niemand — kein Mensch liest JSON-LD |

Die dritte Zeile ist die interessante. Die ersten beiden Lücken hätte
irgendwann jemand gesehen; diese nicht. Sie steht in einem Format, das nur für
Maschinen gedacht ist, und sie wäre erst aufgefallen, wenn ein Assistent den
falschen Namen genannt hätte — also nach der Veröffentlichung, in einer
Antwort, die man nicht zurückholen kann.

> **Was nur Maschinen lesen, prüft nur ein Werkzeug.**

Deshalb ist der Testfall hier nicht die Kür, sondern der eigentliche Ertrag
dieser Runde.
