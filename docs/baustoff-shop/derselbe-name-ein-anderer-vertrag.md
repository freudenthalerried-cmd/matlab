# Derselbe Name, ein anderer Vertrag

**14. September 2026, vierte Runde der Nacht.**

## Der Vorrat, weiter abgearbeitet

Dreißig zweifache Wiederholungen lagen unter der Sperrklinke. Die Runde davor
hatte gezeigt, wonach zu sehen ist:

> **Ein Register für Sätze hat drei Kopien eines Ladewegs gefunden** — weil
> wer Code kopiert, den Absatz darüber mitkopiert.

Also diesmal gezielt: bei jedem wiederholten Satz nachsehen, was **darunter**
steht.

## Fünf Leser für Sätze, drei davon gleich benannt

> *„Sätze eines Textes — über Zeilenumbrüche hinweg, wie im Markdown üblich."*
> — `src/abholung.js` **und** `src/lieferungen.js`

Darunter stand beide Male dieselbe Funktion, Zeichen für Zeichen:

```js
export function saetzeVon(text) {
  return String(text ?? '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
}
```

Zum zweiten Mal an einem Tag hat ein Register für **Sätze** doppelten **Code**
gefunden.

> **Wer eine Funktion kopiert, kopiert die Zeile darüber mit.**

Und beim Nachzählen wurde es schlimmer. Fünf Stellen in diesem Bestand trennen
Text in Sätze:

| Stelle | trennt | gibt zurück |
|---|---|---|
| `src/abholung.js` | Satzzeichen | Liste |
| `src/lieferungen.js` | Satzzeichen | Liste |
| `src/seitenaehnlichkeit.js` | Satzzeichen | **Menge**, getrimmt |
| `src/abgrenzung.js` | auch Umbruch und Gedankenstrich | Liste |
| `src/zwillingssaetze.js` | auch Leerzeilen | Menge, gefiltert |

Die ersten **drei hießen alle `saetzeVon`** — und die dritte gab etwas anderes
zurück. Ich habe sie gestern selbst so genannt.

> **Derselbe Name für einen anderen Vertrag ist schlimmer als zwei Fassungen**
> — zwei Fassungen fallen auf, ein Name nicht.

Die beiden gleichen lesen jetzt `saetzeVon` aus `src/markdown.js`, wo der
Zeilenumbruch hingehört. Die dritte heißt `satzmenge`. Die beiden bewusst
abweichenden tragen den Grund ihrer Abweichung neben sich.

## Ein Aufruf, zwei Fassungen

> *„Abbruch: `npm run pr-text` lief nicht — ohne seine Ausgabe ist nichts zu
> vergleichen."* — `bin/schaufensterpruefung.mjs` **und**
> `bin/veroeffentlichungsabgleich.mjs`

Auch hier stand darunter derselbe Aufruf — einmal mit relativem, einmal mit
absolutem Pfad. Beide holen jetzt `prTextAusgabe(SHOP)`, und der Abbruch ist
einer.

### Und hier habe ich mich geirrt

Mein erster Satz dazu lautete: der relative Aufruf hänge an dem Verzeichnis,
aus dem gerufen wird. Die Gegenprobe blieb **grün**, wo sie rot sein sollte —
beide geben `cwd` mit, und `spawnSync` löst den Pfad im **Kind** auf. Die
Behauptung war falsch.

> **Eine Gegenprobe, die nicht anschlägt, widerlegt nicht sich selbst, sondern
> den Satz, für den sie gebaut wurde.**

Berichtigt, und die Gegenprobe auf den Vertrag gerichtet, den es wirklich gibt:
Gibt die Funktion bei einem misslungenen Lauf einen **leeren Text** statt eines
Grundes zurück, vergleicht der Schaufensterprüfer die veröffentlichte Fassung
gegen nichts und meldet jede Kennzahl als abweichend. Ein Fehlschlag, der
aussieht wie ein Erfolg, ist teurer als ein Abbruch.

Was von der ursprünglichen Sorge bleibt, ist kleiner und wahr: Fiele in einer
der beiden Fassungen das `cwd` weg, bräche nur sie — und die andere bliebe grün
und sagte nichts.

## Die Verweise kosten auch etwas

Jedes Mal, wenn eine Erklärung nach Hause zieht, bleibt an ihrer Stelle ein
Zweizeiler mit dem Weg dorthin — und der steht dann in so vielen Dateien, wie
der Absatz vorher stand. Der Prüfer meldete ihn, und die Zahl stieg kurz von
30 auf 32.

> **Ein Verweis kostet zwei Zeilen und wird nie falsch; ein Absatz kostet zehn
> und wird es irgendwann.**

Geführt werden sie trotzdem — sonst merkt niemand, wenn aus zwei Zeilen wieder
zehn werden.

## Die Bilanz

| | Runde 89 | heute |
|---|---|---|
| wiederholte Sätze | 30 | **27** |
| mit Grund geführt | 7 | **11** |
| Sperrklinke | 30 | **27** |

## Was geändert wurde

| Datei | was |
|---|---|
| `src/markdown.js` | `saetzeVon` als Heimat, mit den drei Abweichungen benannt |
| `src/abholung.js`, `src/lieferungen.js` | lesen sie statt sie zu führen |
| `src/seitenaehnlichkeit.js` | `saetzeVon` → `satzmenge` (anderer Vertrag, anderer Name) |
| `src/abgrenzung.js` | der Grund seiner Abweichung steht daneben |
| `src/schaufenster.js` | `prTextAusgabe()`, ein Aufruf und ein Abbruch |
| `bin/schaufensterpruefung.mjs`, `bin/veroeffentlichungsabgleich.mjs` | lesen sie |
| `src/zwillingssaetze.js` | vier neue geführte Wiederholungen, Sperrklinke 30 → 27 |
| `src/zwillingszahlen.js` | die neue Schrankenzahl abgehakt (sie trifft Gate 27) |

Eine Gegenprobe, rot gesehen:
`der-fehlschlag-des-pr-textes-sieht-aus-wie-ein-erfolg`.

## Offen

Siebenundzwanzig Wiederholungen bleiben. Zwei Runden haben gezeigt, dass unter
einem wiederholten Satz dreimal echter doppelter Code lag — das ist kein Zufall
mehr, sondern die Ausbeute dieser Suche. Was sie nicht findet: doppelten Code
**ohne** Kommentar darüber. Ob es den gibt, ist eine eigene Messung und
braucht ein anderes Werkzeug als eines für Sätze.
