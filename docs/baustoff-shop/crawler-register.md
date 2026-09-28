# Eine Sperre ohne Geschwisterkennung sperrt den Anbieter

**2. September 2026.** In `src/maschinenlesbar.js` standen zwei Listen aus
Zeichenketten:

```js
export const SUCH_CRAWLER      = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'Applebot'];
export const TRAININGS_CRAWLER = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot'];
```

Kein Grund je Kennung, kein Anbieter, keine Regel. Damit war das die einzige
Entscheidung im ganzen Bestand ohne Register — überall sonst gilt hier: **eine
Liste, ein Pflichtgrund je Eintrag, ein Prüfer, der die Liste gegen die
Wirklichkeit hält.** Die Widerrufe, die Leitzahlen, die Außentexte, die offenen
Punkte, die Gegenproben, die Prüfer selbst: alle nach diesem Muster. Die
`robots.txt` nicht.

Beim Aufschreiben der Gründe — mehr war nicht geplant — fielen zwei Löcher auf.
Genau dafür ist der Pflichtgrund da.

## Loch 1: „Training gesperrt" stimmte nicht

Gesperrt waren `GPTBot`, `ClaudeBot`, `CCBot`. Apple durfte mitlesen, weil
seine Trainingskennung `Applebot-Extended` in **keiner** der beiden Listen
stand. Das war nicht entschieden, sondern vergessen: Wer eine Liste aus
Zeichenketten pflegt, sieht nicht, was fehlt — nur was dasteht.

Eine Aussage, die für drei von vier gilt, ist keine Regel, sondern ein Zufall.
Nachgetragen und gesperrt; das kostet keine Sichtbarkeit, weil `Applebot`
erlaubt bleibt.

## Loch 2: eine Sperre, die etwas anderes tat als draufstand

`Google-Extended` stand in der Trainingsliste und war gesperrt — wie `GPTBot`
und `ClaudeBot`. Nur ist der Sachverhalt daneben ein anderer:

| Anbieter | Suchkennung | Trainingskennung | Was die Sperre bewirkt |
|---|---|---|---|
| OpenAI | `OAI-SearchBot` erlaubt | `GPTBot` gesperrt | Training gesperrt, Antworten bleiben |
| Anthropic | `Claude-SearchBot` erlaubt | `ClaudeBot` gesperrt | dasselbe |
| Perplexity | `PerplexityBot` erlaubt | — | nichts gesperrt |
| Apple | `Applebot` erlaubt | *fehlte* | nichts gesperrt |
| **Google** | **keine** | `Google-Extended` gesperrt | **der Anbieter ist draußen** |
| Common Crawl | keine | `CCBot` gesperrt | Training gesperrt (ein Archiv, kein Assistent) |

Für OpenAI und Anthropic steht neben der gesperrten Trainingskennung eine
erlaubte Suchkennung, über die der Assistent die Seiten trotzdem liest. Für
Google stand daneben nichts.

> **Eine Sperre ohne erlaubte Geschwisterkennung sperrt nicht das Training,
> sondern den Anbieter.**

Das ist aus dem Register heraus prüfbar. Es braucht keine Auskunft von außen,
sondern nur die Frage: Bleibt für einen Anbieter, der Fragen beantwortet, noch
irgendeine Kennung erlaubt?

Die letzte Zeile der Tabelle zeigt, warum die Regel nicht einfach „keine
Trainingssperre ohne Suchkennung" heißen darf: Common Crawl hat auch keine, und
die Sperre dort ist trotzdem harmlos. Ein Archiv beantwortet niemandem eine
Frage; es ist kein Vertriebskanal. Deshalb trägt die Anbieterliste das Feld
`beantwortetFragen`, und die Regel hängt daran.

## Die Entscheidung und was ich dabei nicht weiß

`Google-Extended` steht jetzt unter `suche` und auf `erlaubt`. Die Abwägung ist
einseitig:

- **Zu Unrecht gesperrt** kostet genau das Ziel dieses Shops — gefunden zu
  werden, und zwar beim größten Anbieter.
- **Zu Unrecht erlaubt** kostet Trainingsmaterial. Das Sichtbarkeitskonzept
  nennt das selbst „eine Geschmacksfrage ohne unmittelbare Wirkung auf die
  Sichtbarkeit"; der Satz trägt seit heute einen Nachtrag, weil er eben nur mit
  Bedingung gilt.

**Was ich nicht belegen kann:** dass diese Kennung beim Anbieter tatsächlich
auch den Assistenten steuert und nicht bloß das Training. Das steht in Googles
Crawler-Dokumentation, und der Netzausgang dieser Umgebung ist gesperrt — 403
am Proxy, am 2. September erneut geprüft, wie schon bei den Herstellerseiten am
28. August. Die Annahme steht deshalb **im Grund der Zeile** und als Punkt in
`npm run offenepunkte`: ein Blick auf eine Seite, keine Ausgabe. Stellt sich
heraus, dass die Kennung nur das Training steuert, darf sie zurück auf
„gesperrt" — dann ist es wirklich eine Geschmacksfrage.

Nicht getan habe ich das Naheliegende: die Zeile still stehen zu lassen, weil
ich sie nicht prüfen kann. Eine Sperre, deren Wirkung niemand kennt, ist keine
vorsichtige Entscheidung, sondern eine unentschiedene.

## Was noch dazukam: die Abrufe, die ein Mensch auslöst

`ChatGPT-User`, `Claude-User`, `Perplexity-User` — das sind die Abrufe, die
entstehen, wenn jemand einen Assistenten nach uns fragt. Die unmittelbarste
Sichtbarkeit, die es gibt. Sie waren erlaubt: über die Sammelzeile
`User-agent: *` am Ende der Datei, also so lange, wie niemand diese Zeile
anfasst.

Eine Sichtbarkeit, die an einer Sammelzeile hängt, gehört benannt. Jetzt stehen
sie als eigene Einträge mit Zweck `nutzer` im Register.

## Loch 3: die Datei stand in keinem Ausgangsverzeichnis

`src/aussentexte.js` führt jede Stelle, an der Text den Shop verlässt, und
erkennt sie am Namen:

```js
const NAMENSMUSTER = /^(erzeuge|baue)|[Zz]eile$|Csv$|Adresse$|[Tt]ext$/;
```

`robotsTxt` endet auf **`Txt`**, nicht auf `Text`. Die Funktion, deren Ergebnis
jeder Crawler liest, ist an einer Schreibweise vorbeigelaufen und stand in
keinem Verzeichnis — obwohl das Verzeichnis genau dafür gebaut wurde, dass
nichts vorbeiläuft.

Dritter Fall derselben Sorte in diesem Bestand: `\bÖNORM` traf nie, weil `Ö`
kein ASCII-Wortzeichen ist; `ZAHL_MIT_EINHEIT` kannte `Std`, aber nicht
„Stunden" — das war die Gegenprobe von gestern Vormittag.

> **Ein Muster prüft die Schreibweise, die sein Verfasser im Kopf hatte.**

Muster erweitert (`[Tt]e?xt$`, erfasst genau eine weitere Funktion und keine
sonst), Eintrag nachgetragen, und die Fremdtextprobe dazu: Gift in der
Sitemap-Adresse darf keine zweite Zeile und keine zusätzliche
`Disallow`-Anweisung erzeugen. Letzteres wäre der Weg, mit dem sich ein
Fremdtext den ganzen Shop aus den Suchmaschinen nimmt.

Dabei war die erste Fassung der Probe wieder **selbst** falsch — zum vierten
Mal in zwei Tagen. Sie rief `hatSteuerzeichen` auf das ganze Dokument auf; das
Werkzeug gilt der **Zeile** und meldet auf einem mehrzeiligen Text die eigenen
Umbrüche. Geprüft wird jetzt die eine Zeile, in der Fremdtext überhaupt landet.

## Der Prüfer

`npm run pruefe-crawler` stellt drei Fragen:

1. **Ist das Register in Form?** Jede Kennung mit Grund, bekanntem Zweck,
   bekanntem Anbieter, keine doppelt.
2. **Sperrt eine Zeile den Anbieter statt sein Training?**
   (`anbieterOhneAusweg`, `ungleicheTrainingssperren`)
3. **Steht in der gebauten `ausgabe/site/robots.txt`, was das Register sagt —
   und nichts darüber hinaus?**

Die dritte Frage ist die, an der der Bau schon einmal auseinandergelaufen ist:
Bis zum 30. August schrieb `website.mjs` eigene Zeilen, während
`veroeffentlichung.mjs` dieselbe Datei aus `robotsTxt()` erzeugte. Jetzt
rendert `robotsTxt()` das Register, und der Prüfer liest die ausgelieferte
Datei zurück. Die Richtung „Zeile in der Datei, die im Register fehlt" ist
dabei die wichtigere: **Eine Zeile, die niemand eingetragen hat, ist eine
Entscheidung, die niemand getroffen hat.**

Ohne gebaute Datei endet der Prüfer mit Code 2 statt mit Grün — ein halber
Lauf soll nicht aussehen wie ein ganzer.

## Nachweis

Die beiden Regeln sind gegen den **alten** Stand geprüft, nicht nur gegen den
berichtigten. `test/crawler.test.js` baut die zwei flachen Listen vom
1. September nach und erwartet genau zwei Meldungen:

```
✗ Google: keine erlaubte Such- oder Nutzerkennung — die Sperre schließt den
  Anbieter aus und nicht sein Training
✗ Apple: keine Trainingskennung und kein Grund dafür — „Training gesperrt"
  gilt für ihn dann nicht, und niemand hat es entschieden
```

Ein Prüfer, der nur den heutigen, schon berichtigten Bestand grün meldet, hat
nichts gezeigt. Dazu die Gegenprobe `crawler-sperre-ohne-ausweg`, die
`Google-Extended` im Quelltext auf den alten Zustand zurücksetzt.

## Stand

| | |
|---|---|
| Kennungen im Register | 12 (8 erlaubt, 4 gesperrt) |
| Anbieter | 6 |
| davon ohne Ausweg | 0 (vorher 1) |
| davon ohne entschiedene Trainingsfrage | 0 (vorher 1) |
| Prüfer ohne Browser | 16 |
| Gegenproben, die anschlagen | 15 von 15 |
| Tests | 1222 |

Geprüft ist damit die **Absicht** und ihre Widerspruchsfreiheit, nicht die
Wirkung beim Anbieter. Der Unterschied steht in der Ausgabe des Prüfers, damit
niemand das eine für das andere hält.
