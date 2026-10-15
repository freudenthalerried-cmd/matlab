# Eine leere Stelle ist keine Auskunft

**10. September 2026, elfte Runde.** Die Redaktionsprinzipien sind durch —
alle vier Regeln gemessen. Die nächste Seite ist die, auf der das
Geschäftsmodell steht: *„Was ‚Baumeisterpreis' heißt — und was nicht"*,
die Antwort auf die Frage **„wo ist der Haken?"**.

Sie sagt zweimal dasselbe:

> *„…deshalb steht auf **jeder Artikelkarte**, wie weit der Preis unter der
> Liste des Lieferanten liegt."*
>
> *„Sie steht auf **jeder Artikelkarte**, artikelweise und nachrechenbar, denn
> nur sie sagt etwas über Ihre Ersparnis."*

Und sie sagt das an der Stelle, an der sie erklärt, warum der **Aufschlag**
nicht dasteht: Die Zahl, die den Kunden betrifft, sei eine andere — eben
dieser Abstand.

## Gemessen: 39 von 46

| Karten | Auskunft |
|---|---|
| 39 | „31 % unter Liste" — die Zahl |
| 3 | „Beipack" — und die Seite erklärt Beipack ausdrücklich als *kein Preisvorteil* |
| **4** | **nichts** |

Die vier sind drei Dämmplatten und ein Reibputz — Warengruppen, von denen
dieselbe Seite in ihrer Tabelle sagt, dort *„trägt der Vorteil deutlich"*.

Der Grund ist harmlos: Für diese vier ist **kein Listenpreis des Lieferanten
bekannt**. `vorteil()` gibt dann `null`, und der Marker entfällt.

Genau deshalb gehört er auf die Karte. Die **zweite Redaktionsregel** dieses
Shops, eine Seite weiter:

> *„Fehlt der Beleg, fehlt der Wert — und die Seite sagt, dass er fehlt."*

> **Eine leere Stelle ist keine Auskunft: Sie sieht aus wie ein Artikel ohne
> Vorteil, und der Leser kann beides nicht unterscheiden.**

Es ist die Umkehrung des Fundes vom Nachmittag. Dort stand auf der Seite mehr,
als die Karten hielten; hier steht auf den Karten weniger, als die Seite
verspricht. Beide Male ist die Zusage die Stelle, an der es auffällt.

## Was ich zuerst vermutet habe — und was es nicht war

Der Marker steht nur bei `abstand >= 5`. Meine erste Vermutung war deshalb:
Der Shop **verschweigt die dünnen Vorteile** — die Karte schwiege genau dort,
wo die Antwort unschmeichelhaft wäre. Das wäre ein schwerer Befund gewesen.

Nachgerechnet: **kein einziger** Artikel hat einen Vorteil zwischen 0 und
5 %. Die Fünf-Prozent-Schwelle hat heute keinen einzigen Fall. Die Vermutung
war falsch, und sie steht hier, weil eine geprüfte Vermutung mehr wert ist als
eine ungeprüfte, die man weglässt.

Und die drei „Beipack"-Karten sind **am Listendeckel** (Gate 22): Ihr
Verkaufspreis ist auf den Listenpreis gekappt, der Vorteil ist rechnerisch
null, und „Beipack" ist die richtige Auskunft dafür.

## Was jetzt dasteht

- **Auf der Karte:** ein dritter Marker, zurückhaltend gesetzt —
  *„Listenpreis nicht bekannt"*. Auf der Artikelseite ausgeschrieben:
  *„Listenpreis des Lieferanten nicht bekannt"*.
- **Auf der Seite:** kein „auf jeder Artikelkarte" mehr, sondern was gilt —
  die Zahl steht auf der Karte, und wo sie nicht steht, sagt die Karte den
  Grund. Mit der Zahl: heute vier von sechsundvierzig.
- **Gemessen:** `vorteilsangabebefund` hält jede Artikelfläche gegen die drei
  Auskünfte. Über alle 82 Seiten sind das **584 Karten** — 496 mit der Zahl,
  31 als Beipack, 57 mit offenem Listenpreis. Keine schweigt.

Geschnitten wird an der Marke `class="karte"` und nicht an einem Element: Der
Kartenaufbau hat sich zweimal geändert, die Marke nicht — *eine Messung, die
an der Verschachtelung hängt, misst beim nächsten Umbau etwas anderes.*

## Stand

- `src/vorteilsangabe.js` — neu: `AUSKUENFTE`, `karten`,
  `vorteilsangabebefund`.
- `bin/website.mjs` — dritter Marker auf Karte und Artikelseite, eigene
  zurückhaltende Auszeichnung.
- `inhalte/wissen/baumeisterpreis.md` — zwei Stellen berichtigt, mit dem
  Vermerk, was bis heute dastand.
- 5 neue Testfälle, 1 Gegenprobe (`karte-ohne-auskunft-zur-liste`,
  angeschlagen).
- 2228 Testfälle, 156 Gegenproben, 48 Prüfer.

**Was der Auftraggeber davon wissen muss:** Nichts zu tun. Die vier fehlenden
Listenpreise kommen mit der Artikelliste des Lieferanten — Frage 1, die seit
dem 8. September auf der Liste steht.
