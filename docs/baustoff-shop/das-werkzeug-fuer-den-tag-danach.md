# Das Werkzeug für den Tag danach

**Stand: 30. August 2026** · Betroffen: `shop/bin/import.mjs`,
`shop/src/import.js`, `shop/test/import.test.js`,
`shop/test/import-werkzeug.test.js`.

## Die Frage

Der vorige Lauf hat einen Begriff geprägt, der sich als brauchbar erwiesen
hat: **ein Fehler mit bekanntem Auslösetag.** Der Tag ist bekannt — es ist
der, an dem die Artikelliste des Lieferanten kommt. Also die Frage: *Was
läuft an diesem Tag als Erstes, und ist es in Ordnung?*

Als Erstes läuft `npm run import`. Es ist nicht in Ordnung.

## Drei Befunde

### 1. Das Ziel ist eine tote Datei

`bin/import.mjs` schreibt nach `data/artikel.json`. Diese Datei trägt **neun
Platzhalterartikel des abgelösten Radon-Modells** — an erster Stelle ein
Drainagerohr der Warengruppe „Drainage", die dieser Shop ausdrücklich nicht
führt und die im Kundenwörter-Register unter „nicht aufgenommen" steht.

Der Shop liest sie nicht. Er liest `data/katalog-baustoff.json`. Ein Import
hätte ordentlich berichtet — „Geschrieben: 143 Artikel" — und am Katalog
nichts geändert.

### 2. Die Warnschwelle stammt aus dem alten Modell

`importierePreisliste` rechnete mit einer Zielmarge von **0,35** als
Vorgabewert; seit dem 22. August gilt 0,25. Die Folge war nicht ein falscher
Preis — der Verkaufspreis wird für die Warnung gerechnet und **nicht
gespeichert**, das habe ich zuerst falsch angenommen und nachgemessen. Die
Folge war eine falsche Warnung, und zwar bei jeder Zeile:

```
! Zeile 2: X-1 erreicht nur 25.0 % Marge — unter der Untergrenze von 32 % (Gate 1)
```

Die 32 % sind `MARGENUNTERGRENZE`, die Regel des abgelösten Modells; STATUS.md
führt sie seit dem 22.08. als abgelöst. Mit der heutigen Zielmarge von 25 %
hätte **jeder Artikel jeder Liste** diese Warnung ausgelöst.

> **Ein Werkzeug, das jede Zeile meldet, meldet nichts.**

Am Tag der Lieferantenliste wäre die Warnung überblättert worden — samt der
Zeilen, bei denen sie stimmt.

### 3. Einkaufspreise in ein öffentliches Verzeichnis

Der erzeugte Datensatz trägt `ekNetto` und `uvpNetto`. `data/` ist
versioniert und öffentlich. Genau dafür wurde am 22. August
`bin/katalog-aus-rechnungen.mjs` gebaut: Es schreibt den Katalog nach
`data/katalog-baustoff.json` **ohne Preise** und die Konditionen nach
`preise/baustoff-preise.json`, das `.gitignore` deckt.

Es gab einen Riegel — aber nur gegen Dateinamen mit „muster", „beispiel" oder
„demo". **Eine echte Artikelliste wäre durchgekommen.**

## Was geändert wurde

**Das Schreiben ist gesperrt.** `--schreiben` bricht mit Ausgang 3 ab, nennt
alle drei Gründe und den richtigen Weg. **Der Probelauf bleibt** — eine Liste
durchrechnen und die Befunde lesen ist genau das, was am ersten Tag gebraucht
wird, und der Parser ist geprüft und gut.

**Die Warnung prüft die Regel, die gilt.** Statt der abgelösten Untergrenze
meldet sie den Fall, den es wirklich gibt: Der Listenpreis deckelt den
Verkaufspreis, die Zielmarge wird nicht erreicht (Gate 22).
`MARGENUNTERGRENZE` bleibt, wo sie hingehört — in der Bewertung von
Lieferantenkonditionen.

**Verglichen wird der Preis, nicht die Marge.** Der erste Wurf prüfte
`marge < zielmarge` und meldete deshalb auch ungedeckelte Artikel: Ein auf
Cent gerundeter Verkaufspreis verfehlt die Zielmarge um Bruchteile eines
Prozentpunkts. Ein Rundungsrest ist kein Befund.

## Die Lücke in den Proben

Der Vorgabewert 0,35 stand seit Wochen da, und **kein Testfall hätte es
gemerkt.** Geprüft wurden Fehler, Warnungen und Herkunftsfelder — nie die
Zahl, die von der Marge abhängt. Der alte Testfall verlangte sogar eine
Warnung, die es nur mit der alten Zahl gibt; er hätte die Berichtigung
**verhindert**.

Jetzt hängt eine Probe an derselben Zeile mit beiden Margen und zeigt, dass
sie zwei verschiedene Urteile ergibt. Dazu drei weitere:

| Zusicherung | Gegenprobe |
|---|---|
| Das Werkzeug schreibt nicht — auch nicht mit einer echten Liste | Sperre entfernt → fällt |
| Der Probelauf rechnet die Liste weiterhin durch und meldet Gate 22 | — |
| Ein Artikel, der die Zielmarge erreicht, wird **nicht** gemeldet | Marge statt Preis verglichen → fällt |
| Der Datensatz trägt keinen Verkaufspreis, wohl aber die Konditionen | — |

Die letzte Zeile ist die Berichtigung an mir selbst: Ich hatte geschrieben,
die falsche Marge hätte falsche Preise erzeugt. Nachgemessen stimmt das
nicht — sie hat falsche Warnungen erzeugt. Das ist der Unterschied zwischen
einem teuren und einem lästigen Fehler, und keiner von beiden gehört stehen
gelassen.

## Was am Tag der Liste zu tun bleibt

Der Weg in den Katalog führt über `npm run katalog`. Dessen Eingabe ist
heute die **Positionstabelle aus Rechnungen**, nicht eine Artikelliste —
zwei verschiedene Formate. Über `KATALOG_QUELLE` ist die Quelle
überschreibbar; ob die Spaltenzuordnung passt, entscheidet sich an der Datei,
die kommt.

Vorbereitet ist damit: Die Liste lässt sich durchrechnen und beurteilen, und
kein Weg führt mehr versehentlich an der Trennung zwischen öffentlichem
Katalog und lokalen Konditionen vorbei.

`data/artikel.json` bleibt übrigens stehen. Sie hat eine Aufgabe: Fehlt die
Preisdatei — auf einem fremden Rechner ohne `preise/` —, rechnet
`npm run veroeffentlichung` mit ihr weiter und **sagt es**: „Radon-
Platzhalterkatalog (die Preisdatei des Baustoffkatalogs fehlt)". Ein
Rückfallweg, der sich benennt, ist kein toter Code.
