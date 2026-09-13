# Die Ausschlussliste kannte nicht, was nicht kaufen *kann*

**3. September 2026.** Die Kampagne führt 41 Ausschlüsse in vier Themen:
Preisjäger, Baumärkte, Suchen ohne Kaufabsicht, falsche Absicht — Jobs, Miete,
Entsorgung.

Alle vier schließen aus, was **wahrscheinlich nicht kauft**. Was fehlte, war
das, was **nicht kaufen kann**.

## Zwei Sperren, kein Ausschluss

| Gate | Was er sperrt | Was in der Liste stand |
|---|---|---|
| **23** | Keine Annahme außerhalb von fünf Bezirken | nichts |
| **7** | Nur Unternehmer, alle Preise netto | nichts |

Beides sind keine Wahrscheinlichkeiten, sondern Absagen. Wer aus Wien anfragt,
bekommt eine Absage; wer als Privatkunde anfragt, ebenfalls. **Der Klick ist
vorher bezahlt.**

Beim Liefergebiet steckt dahinter ein Missverständnis, das leicht zu haben ist:
Die Ortssteuerung von Google richtet sich nach dem **Standort des Suchenden**.
Sie greift nicht, wenn jemand in Linz sitzt und „Dämmung kaufen Wien" tippt,
weil er dort baut — die Anzeige erscheint, der Klick kostet, und Gate 23 lehnt
die Anfrage ab.

> **Ein Ausschluss ist billiger als jede Anzeige: Er kostet nichts und spart
> genau die Klicks, die nie zu einer Bestellung führen können.**

Die Liste hat jetzt 67 Einträge in sechs Themen — 19 Orte außerhalb des
Gebiets, sechs Privatkundenbegriffe.

## Was ausdrücklich *nicht* hineingehört

Der Ausschluss ist ein Werkzeug, das in beide Richtungen schneidet. „linz"
auszuschließen wäre der Ausschluss der eigenen Kundschaft — Linz und Linz-Land
sind zwei der fünf Bezirke. Ein Phrase-Ausschluss greift auf jede Wortfolge,
die ihn enthält.

Genauso darf kein Ausschluss ein Wort treffen, das in einem geführten
Suchbegriff steckt. „xps" in der Ausschlussliste würde vier bezahlte Begriffe
stillegen, und niemand sähe es: In den Berichten stünde nur, dass diese
Keywords keine Impressionen bekommen.

> **Ein Ausschluss, der eigene Ware oder das eigene Gebiet trifft, ist teurer
> als kein Ausschluss.** Der erste kostet Klicks, der zweite kostet alle.

Zwei Testfälle halten das fest, und beide messen gegen die **Quellen**, nicht
gegen eine zweite Liste:

* Kein Ausschluss ist in einem Bezirksnamen aus `LIEFERGEBIET` enthalten.
  *(Gegenprobe: „linz" eingesetzt — der Fall fällt.)*
* Kein Ausschluss ist in einem Begriff aus `keywords.csv` enthalten.
  *(Gegenprobe: „xps" eingesetzt — der Fall fällt.)*

Ein dritter hält fest, dass die beiden Themen überhaupt vorhanden sind: Gate 23
und Gate 7 sind Sperren, und was sie sperren, gehört ausgeschlossen, **bevor
der erste Klick bezahlt ist.**

## Warum die Ortsliste kurz ist

Neunzehn Namen, nicht zweihundert. Ausgeschlossen ist, was jemand tatsächlich
eintippt, wenn er anderswo baut: die größten Städte, die Bundesländer außerhalb
Oberösterreichs, dazu Wels, Steyr und Passau als die nächstgelegenen Orte
außerhalb der fünf Bezirke.

Eine vollständige Liste aller österreichischen Gemeinden wäre keine bessere
Ausschlussliste, sondern eine unlesbare. Und sie wäre die Sorte Vollständigkeit,
die dieses Vorhaben schon zweimal geprüft und verworfen hat: Was man nicht
begründen kann, gehört nicht in ein Register.

## Was das im Versuch bedeutet

Der Klickversuch rechnet mit 299 Klicks bis zur Entscheidung und 1,50 € je
Klick. Jeder Klick, der aus Wien kommt oder von einem Heimwerker, verlängert
den Versuch, ohne etwas zu messen — er landet in derselben Zahl wie ein Klick,
der nichts gekauft hat.

Das ist dieselbe Zweideutigkeit wie bei der fehlenden Indexierungsetappe heute
Nachmittag und beim unbeantworteten Anfragebetrieb heute Abend: **zwei Befunde,
die gleich aussehen und verschiedene Ursachen haben.** Der Versuch misst die
Kaufquote nur dann, wenn alles, was ihn erreicht, überhaupt kaufen könnte.
