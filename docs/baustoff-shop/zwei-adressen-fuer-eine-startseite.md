# Zwei Adressen für eine Startseite

**3. September 2026.** Der Rolloutplan hat seit heute eine Etappe „Search
Console einrichten und die Indexierung bestätigen". Wer eine Etappe für die
Indexierung einführt, sieht sich vorher an, was der Indexer zu lesen bekommt.

Er bekam für die Startseite zwei Adressen, aus zwei Dateien desselben Baus:

| Datei | Was dort steht |
|---|---|
| `index.html`, `rel="canonical"` | `https://bauversand.com/` |
| `sitemap.xml` | `https://bauversand.com/index.html` |
| JSON-LD `Organization.url` | `https://bauversand.com` |

Die Sitemap sagt *„indexiere diese Adresse"*, und die Seite dahinter sagt
*„meine Adresse ist eine andere"*. In der Search Console ist das die Meldung
**„Duplikat, Google hat eine andere Seite als kanonisch bestimmt"** — ein
verschenkter Eintrag, und ausgerechnet der der Startseite.

## Das Ärgerliche daran

Die Regel stand seit dem 1. September im Bestand. `kanonisch()` trägt in seinem
Dateikopf genau diese Beschreibung:

> `bauversand.com/`, `bauversand.com/index.html` und `www.bauversand.com/…`
> sind für einen Indexer drei Adressen mit demselben Inhalt. Welche davon
> zählt, entscheidet dann er — und zerlegt die Signale auf drei Seiten statt
> sie zu bündeln.

Die Funktion wurde vom `rel="canonical"` benutzt und von der Sitemap nicht. Die
baute ihre Einträge selbst zusammen: `${BASIS}/${id}.html`.

> **Ein Werkzeug, das die Regel kennt und an einer Stelle nicht anwendet, hat
> die Regel nicht.**

Das ist dieselbe Familie wie die Adresse in `kampagne.mjs` am 31. August (zwei
Wege zu derselben Adresse, und der zweite blieb beim Wechsel alt) und wie die
Marke heute Vormittag (vier Fundstellen, vier verschiedene Wege sie zu finden).
Jedes Mal gab es die richtige Stelle bereits, und jedes Mal ging eine zweite
daran vorbei.

## Was jetzt gilt

Sitemap und Auszeichnung nehmen ihre Adressen aus `kanonisch()`. Die Startseite
steht in allen dreien als `https://bauversand.com/` — die Adresse, die jemand
tippt, die in einer Anzeige steht und die die Seite selbst gelten lässt.

Was **nicht** geändert wurde: die internen Verweise. Sie zeigen weiter auf
`index.html`, weil sie relative Dateipfade sind und die Einzeldateifassung
dieselbe Kette benutzt. Für einen Indexer ist das unproblematisch — er folgt
dem Verweis und liest dort das `canonical`. Zwei Fassungen einer **Adresse**
sind ein Schaden; ein Verweis, der auf die kanonische Seite führt, ist keiner.

## Geprüft

Zwei neue Testfälle in `test/website.test.js`, beide gegengeprobt (Sitemap
wieder selbst zusammengebaut — beide fallen):

1. **Jede Adresse der Sitemap ist die kanonische ihrer Seite.** Der Testfall
   löst jede `<loc>` zur Datei auf und vergleicht mit deren `rel="canonical"`.
   78 Einträge.
2. **Die Startseite hat genau eine Schreibweise.** Das canonical endet auf
   `/`, die Sitemap nennt genau diese Adresse und **nicht** zusätzlich
   `/index.html`, und die Auszeichnung nennt dieselbe.

Der vorhandene Testfall „jede gebaute Seite steht in der sitemap — oder trägt
noindex" hat den Umbau sofort gemeldet: Sein Ausdruck verlangte `.html` und
zählte die Startseite als fehlend — **vier Lücken statt drei**. Er kennt die
Wurzel jetzt als `index`. Das ist die angenehme Sorte Fehlalarm: Ein Test, der
bei einer richtigen Änderung anschlägt, hätte bei einer falschen auch
angeschlagen.

## Was beim Nachsehen in Ordnung war

Beim selben Durchgang geprüft und nicht angetastet:

- **Drei Seiten fehlen in der Sitemap** — Warenkorb, Kasse, Suche. Absicht seit
  dem 30. August, und sie tragen `noindex,follow`. Eine Sitemap-Lücke ohne
  `noindex` wäre der Fehler; hier ist beides da.
- **`robots.txt`** nennt die Sitemap und erlaubt die Suchkennungen von Google,
  OpenAI, Anthropic und Perplexity namentlich.
- **78 Einträge, 81 Seiten** — die Differenz ist genau diese drei.
