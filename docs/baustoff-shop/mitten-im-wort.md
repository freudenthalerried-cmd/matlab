# „das Ergebnis rechnen Sie m"

**3. September 2026.** Der Satz oben ist kein Tippfehler. Er stand als
`<meta name="description">` auf `system/fassade-100-qm.html` — also genau der
Text, den ein Suchergebnis anzeigt und den ein Sprachmodell als Zusammenfassung
der Seite liest.

Die Beschreibung entstand als `kurz.slice(0, 300)`. Von den 81 gebauten Seiten
waren vier länger als 300 Zeichen, und alle vier endeten mitten im Wort:

| Seite | Wie sie endete |
|---|---|
| `system/fassade-100-qm` | „…der Rechenweg steht dabei, das Ergebnis rechnen Sie m" |
| `system/kaminzug` | „…entscheiden über die Stückliste: Gesamthöhe, Ansc" |
| `system/kellerwand-perimeter` | dasselbe Muster |
| `system/kanal-dn100` | dasselbe Muster |

> **Ein abgeschnittenes Wort sagt dem Leser und der Maschine dasselbe: hier hat
> jemand nicht hingesehen.**

Für einen Shop, dessen ganze Auffindbarkeitsstrategie darauf beruht, dass
Maschinen ihn zitieren, ist das nicht kosmetisch. Die Beschreibung ist die
kürzeste Fassung dessen, was die Seite kann — und die vier betroffenen sind
ausgerechnet die **Systemlisten**, also die Seiten, die eine vollständige
Stückliste für ein Bauvorhaben führen.

## Die Regel, in dieser Reihenfolge

`kurzfassung(text, grenze)` in `src/format.js`:

1. **Passt der Text ganz, bleibt er, wie er ist.**
2. Sonst endet er am **letzten Satzende** innerhalb der Grenze — ein
   vollständiger Satz ist die beste Kurzfassung, die es umsonst gibt.
3. Gibt es keins, endet er an der letzten **Wortgrenze**, mit Auslassung.

Kein Punkt wird angehängt, wo schon einer steht, und kein Satzzeichen bleibt
vor der Auslassung stehen („Kleber, Gewebe, Dübel, …" statt „Dübel, …").

Das Satzende zählt nur, wenn schon mindestens die halbe Grenze voll ist. Ohne
diese Bedingung könnte eine Abkürzung am Anfang („z. B.") die ganze
Beschreibung auf drei Wörter kürzen — ein Schnitt, der schlimmer wäre als der,
den er behebt.

**Das Ergebnis:** Die vier Seiten tragen jetzt 173 bis 240 Zeichen, jede endet
auf einem vollständigen Satz. Keine brauchte am Ende eine Auslassung — Regel 2
hat in allen vier Fällen gegriffen.

## Was dabei in Ordnung war

Beim selben Durchgang über alle 81 Seiten gemessen:

- **81 Titel, alle verschieden.** Kein doppelter.
- **81 Beschreibungen, alle vorhanden und alle verschieden.** Kein doppelter,
  keine fehlende.

Doppelte Titel und fehlende Beschreibungen sind die zwei häufigsten Meldungen,
die eine Search Console beim ersten Durchgang ausspuckt. Beide gibt es hier
nicht — die eine Meldung, die gekommen wäre, ist die, die jetzt behoben ist.

## Geprüft

Sechs Testfälle in `test/kurzfassung.test.js`, einer davon gegengeprobt
(`slice(0, 300)` wieder eingesetzt — der Fall fällt):

1. Was passt, bleibt unverändert — auch genau auf der Grenze.
2. Zu lang endet am letzten Satzende, **ohne** Auslassung.
3. Ohne Satzende wird an der Wortgrenze gekürzt, und das letzte Wort ist ein
   ganzes aus dem Ausgangstext.
4. Kein Satzzeichen bleibt vor der Auslassung stehen.
5. Leerer Text und unbrauchbare Grenze ergeben nichts Halbes.
6. **Keine der 81 gebauten Seiten endet mitten im Wort** — jede Beschreibung
   endet auf einem Satzzeichen oder auf der Auslassung.

Der sechste ist der, auf den es ankommt: Die ersten fünf prüfen eine Funktion,
der sechste das Erzeugnis. Eine Funktion, die richtig kürzt, hilft nichts,
wenn eine Seite an ihr vorbeibaut.
