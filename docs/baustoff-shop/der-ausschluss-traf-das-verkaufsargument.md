# Der Ausschluss traf das Verkaufsargument

**6. September 2026, vormittags.** Zwei Runden lang ging es darum, was die
Kampagne **kauft** und **sagt**. Diesmal die Gegenrichtung: was sie
**ausschließt**. 78 negative Keywords, sechs Themen.

Gezählt, wie oft jeder einwortige Ausschluss im **eigenen** Seitentext steht —
alle 82 gebauten Seiten, nur der Hauptbereich:

```
112  wie          · Suche ohne Kaufabsicht
 39  vergleich    · Suche ohne Kaufabsicht
  3  einbau       · Falsche Absicht
  2  muster       · Preis und Menge
  1  gebraucht, einzeln
  0  die übrigen 63
```

> **Zwei Wörter stehen 112- und 39-mal im eigenen Text. Die anderen 67 zusammen
> sieben Mal.** Das ist kein Verlauf, das ist eine Kante.

---

## Die 39 sind nicht irgendein Vorkommen

Auf 39 Artikelseiten steht derselbe Satz:

> *„46 % unter dem Listenpreis des Lieferanten. Der **Vergleich** bezieht sich
> auf die Liste unseres Lieferanten, nicht auf einen Straßenpreis."*

Das ist **der** Satz dieses Shops. Die ganze Kalkulation, die Weisung „keine
Spanne ausgeben", die Marke „Baumeisterpreis" — alles läuft auf diesen
Vergleich hinaus.

> **Wer Preise vergleicht, ist der Kunde, für den „46 % unter Liste"
> geschrieben ist. Die Kampagne schloss ihn aus.**

Und „wie" ist ein Funktionswort. Als Phrase-Ausschluss trifft es jede Anfrage,
in der es vorkommt — auch „wie viel XPS 80 mm brauche ich für 100 m²", also die
Planungsfrage, für die dieser Shop seine vier Systemlisten hat.

---

## Warum der vorhandene Prüfer es nicht fand

Der Kopfkommentar über der Ausschlussliste ist gut und alt:

> *„**Was hier nicht hineingehört, ist ebenso wichtig.** Kein Ortsname des
> eigenen Liefergebiets — „linz" auszuschließen wäre ein Ausschluss der eigenen
> Kundschaft. Und kein Wort, das in einem geführten Suchbegriff vorkommt.
> Beides prüft ein Testfall."*

Zwei Bestände: das Liefergebiet und die Keywordliste. Beide werden geprüft.

> **Die Regel kannte zwei Bestände und nicht den dritten — die Seiten, auf die
> die Anzeige zeigt.**

Elfte Fassung derselben Gestalt in zwei Tagen, und diesmal auf der Seite, auf
der ein zu enger Prüfer nichts kostet, sondern **Reichweite** wegnimmt: Ein
Ausschluss verbrennt kein Geld, er verhindert Klicks. Das fällt in keiner
Abrechnung auf.

---

## Die Entscheidung

Beide Wörter entfallen. **Ohne Ersatz**, und das ist der Teil, der begründet
gehört:

Die Keywords stehen auf **Phrase** und **Exakt** und nennen ein Produkt. Eine
Anfrage erreicht die Anzeige überhaupt nur, wenn sie den Produktbegriff schon
enthält. „XPS 80 mm Vergleich" ist dann eine Kaufanfrage; „wie viel XPS 80 mm"
ist eine Planungsanfrage. Beides sind Kunden.

Die Absicht, die wirklich nichts kauft, tragen die spezifischen Wörter, die
stehen bleiben: `anleitung`, `video`, `youtube`, `wikipedia`, `was ist`,
`erfahrung`, `test`. Ausschlüsse: 78 → 76.

*Ein Ausschluss auf einem Funktionswort ist keine Absichtserkennung, sondern
eine Reichweitenbremse mit einer Begründung darüber.*

---

## Die Regel

`src/ausschluss.js` zählt jeden einwortigen Ausschluss im eigenen Seitentext
und meldet, was über der Grenze liegt. **Die Grenze ist gemessen, nicht
gesetzt:** Der Abstand im Bestand ist 3 gegen 39, die Schwelle liegt bei 10.

Sie sagt **nicht**, dass ein häufiges Wort ein falscher Ausschluss ist. Sie
sagt: Ein Ausschluss, der im eigenen Text gewöhnliches Deutsch ist, trägt nicht
die Absicht, die sein Thema behauptet — und gehört angesehen. Die Entscheidung
bleibt bei einem Menschen; die Regel sorgt dafür, dass sie gestellt wird.

Mehrwortige Ausschlüsse sind ausgenommen: „was ist", „sanieren lassen" tragen
ihre Absicht in der Wendung und nicht im einzelnen Wort.

Gegenprobe `eigenes-wort-ausgeschlossen` setzt „vergleich" zurück in die Liste
und verlangt, dass es auffällt.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Regeln | `ausschlussbefund` in `src/ausschluss.js`, im Kampagnenlauf |
| Neue Gegenproben | `eigenes-wort-ausgeschlossen` |
| Neue Testfälle | 6 (`test/ausschluss.test.js`) |
| Geänderte Ausschlüsse | 78 → 76 (`wie`, `vergleich` entfallen) |
| Neue Gates | keine — Gate 15 unverändert |

## Was offen bleibt

- **Die Grenze von 10 ist an einem Bestand gemessen**, in dem der Abstand
  3 gegen 39 beträgt. Bei einem größeren Sortiment kann sich die Verteilung
  verschieben; die Zahl steht mit ihrer Herleitung im Modulkopf, damit sie
  jemand widerlegen kann.
- **Die Regel prüft nur einwortige Ausschlüsse.** Eine Wendung wie „sanieren
  lassen" könnte genauso danebengreifen; sie kommt im eigenen Text aber nicht
  vor, und für Wendungen ist die Häufigkeit kein brauchbares Maß.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
