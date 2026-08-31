# Der Zweig, den niemand betrat — und der in jeder frischen Arbeitskopie greift

**31. August 2026.** Nachdem die Durchsicht des Vortags den Katalogfaden
geschlossen hat, eine andere Frage: Welcher Programmzweig läuft bei allen
anderen und bei keiner Probe?

Die Antwort steht in `bin/veroeffentlichung.mjs`, und sie ist unangenehm
naheliegend.

## Der Rückfall ist der Normalfall

```js
const baustoffVerfuegbar = existsSync(preisPfad) && existsSync(katalogDatei);
const katalog = baustoffVerfuegbar
  ? ladeBaustoffkatalog(…)          // der echte Katalog, 46 Artikel
  : ladeKatalog({ … artikel.json }, 0.35);   // der Platzhalterbestand, 9 Artikel
```

`preise/` liegt **außerhalb des Repositories** — das ist die Sperre, die die
Einkaufskonditionen des Auftraggebers schützt. Wer klont, hat die Datei nicht.
Der Rückfall ist damit nicht der Ausnahmefall, sondern der Zustand jeder
frischen Arbeitskopie.

Geprüft war er trotzdem nie. Alle zehn bestehenden Testfälle dieses Werkzeugs
starten es in **der einen Lage, in der der Zweig nicht greift** — dieser
Arbeitskopie, in der `preise/` liegt.

> **Ein Zweig, den keine Probe betritt, ist kein Zweig, sondern eine
> Vermutung.** Und diese Vermutung stand im Dateikopf als Zusage: „Ohne
> Preisdatei fällt das Werkzeug auf den Radonkatalog zurück **und meldet
> das**. Es tut dann nichts Falsches."

## Zum ersten Mal betreten

Der Pfad ist jetzt über `VEROEFFENTLICHUNG_PREISE` überschreibbar — dieselbe
Vorkehrung wie `STARTKLAR_BETREIBER` und `WEBSITE_LIEFERANTEN`, aus demselben
Grund. Damit lässt sich der Rückfall auslösen, ohne die vertrauliche Datei
anzufassen. Was dabei herauskommt:

```
Katalog: Radon-Platzhalterkatalog (die Preisdatei des Baustoffkatalogs fehlt)
         9 Artikel
Feed:    0 veröffentlichbar, 9 zurückgehalten
  · Einkaufspreis ist Platzhalter — kein Lieferant hat ihn bestätigt
Einreichbar: nein
```

**Die Zusage hält.** Das Werkzeug meldet den Rückfall, gibt ihn nicht als den
echten Katalog aus, hält alle neun Einträge zurück und verweigert mit
`--schreiben` den Dienst (Ausgangscode 1). Vier Testfälle nageln das fest,
einer davon die Gegenrichtung: Mit Preisdatei muss weiterhin der echte Katalog
dastehen — sonst wäre der Rückfall der neue Normalfall.

Beim Schreiben des dritten Testfalls lief ich in dieselbe Falle wie
`pruefe-pruefer` zwei Tage zuvor: Die Weigerung steht auf **stderr**, der
Bericht auf stdout. Wer nur einen Strom liest, sieht entweder den Grund nicht
oder den Bericht nicht. Der Testfall prüft jetzt beides und verlangt
ausdrücklich, dass der Abbruch **nicht** zusätzlich auf stdout steht.

## Der Nebenbefund: eine stehengebliebene Marge

Der Rückfall rechnete mit `0.35` — der Zielmarge des am 22. August abgelösten
Modells. Seit dem 25. August gilt 25 %.

Der erste Gedanke war, das sei folgenlos: Die Preise dieses Katalogs sind
Platzhalter und erreichen keinen Kunden. Nachgemessen stimmt das nicht ganz —
der **Bericht** unterscheidet sich:

```
< · Verkaufspreis am Listendeckel — Beipack, kein Feedartikel (Gate 22)
```

Bei 35 % Marge stieß ein Artikel an den Listenpreis und wurde als Beipack
gemeldet; bei 25 % tut er das nicht. Der Rückfallbericht nannte also einen
Gate-22-Grund, den es im laufenden Modell gar nicht gibt. Genau die Sorte
stehengebliebener Zahl, die in `PARAMETER.md` schon einmal einen Lauf an die
falsche Weggabelung geführt hat — nur diesmal in einer Ausgabe statt in einem
Dokument.

Auf `ZIELMARGE` umgestellt, mit der Begründung an der Zeile.

## Gegenproben

| Mutation | erkannt |
|---|---|
| Rückfall gibt sich als der echte Katalog aus | ja |
| Rückfall abgeschaltet (Absturz ohne Preisdatei) | ja — 3 rot |
| Überschreibbarkeit wieder entfernt | ja — 2 rot |

Die dritte ist die Absicherung der Prüfbarkeit selbst: Wer den Griff
zurücknimmt, macht den Zweig wieder unerreichbar — und **das** darf nicht
stillschweigend gehen.

## Was das für andere Werkzeuge heißt

Vermerkt, nicht erledigt: Dieselbe Frage — welcher Zweig greift bei allen
anderen und bei keiner Probe? — lohnt sich für jedes Werkzeug, das auf
`existsSync` verzweigt. `startklar` und `website.mjs` sind es bereits, weil sie
ihre Überschreibbarkeit haben. Ein Durchgang über die übrigen steht aus; er
gehört gemacht, wenn kein dringenderer Befund ansteht, und **nicht** als
Sammeländerung: Jeder Griff in eine Umgebungsvariable ist eine zusätzliche
Stellschraube und will einzeln begründet sein.

## Stand

967 Testfälle grün (vorher 963), `pruefe-tests` 965/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 202/202.
