# Das Erzeugnis von gestern

**4. September 2026, Mittag.** `npm run alles` meldete **26 von 26 grün**.
Unmittelbar danach weigerten sich beide Browserproben, überhaupt zu starten:

```
Abbruch: ausgabe/website.html ist älter als 3 Quelldatei(en) — zuerst npm run website.
  src/pruefregister.js, src/rechtstexte.js, src/ungerufen.js
Eine Probe gegen ein veraltetes Erzeugnis prüft die Vergangenheit.
```

Die Weigerung ist richtig, und sie ist alt: Sie steht seit dem 29. August in
`shopprobe.mjs` und `oberflaechenprobe.mjs`, weil an dem Tag eine Probe gegen
eine `demo.html` lief, die zu ihrem Quelltext nicht mehr passte — grün,
während das Skript der neu gebauten Seite beim Laden starb.

Die Frage war nur, wer sie sonst noch hat.

> **Zwei von neun Werkzeugen, die ein gebautes Erzeugnis lesen.** Die anderen
> sieben fragen, **ob** `ausgabe/site` da ist. Nicht, ob es das ist, was die
> Quelle heute sagt.

Dieselbe Familie wie der Impressumspunkt vom Vormittag: **Anwesend ist nicht
dasselbe wie richtig.** Hier: vorhanden ist nicht dasselbe wie aktuell.

## Wen es trifft

| Prüfer | liest | hatte die Weigerung |
|---|---|---|
| `pruefe-seiten` | `ausgabe/site` | nein |
| `pruefe-crawler` | `ausgabe/site` | nein |
| `pruefe-datenschutz` | `ausgabe/site` | nein |
| `pruefe-dubletten` | `ausgabe/site` | nein |
| `pruefe-geheimnis` | `ausgabe/site` | nein |
| `npm run wegprobe` | `ausgabe/website.html` | nein |
| `npm run werbeprobe` | `ausgabe/kampagne` | nein |
| `npm run shopprobe` | `ausgabe/website.html` | ja |
| `npm run oberflaechenprobe` | `demo.html` | ja |

**Am schwersten wiegt `pruefe-geheimnis`.** Er misst, ob aus den
veröffentlichten Verkaufspreisen die Einkaufspreise zurückzurechnen sind — die
Zahl, die in der PR-Beschreibung steht und auf der die Empfehlung „Repository
privat stellen" ruht. Über einem veralteten Erzeugnis meldet er das über die
Seiten von gestern.

Zwei der neun kannte ich nicht: `wegprobe` und `werbeprobe` sind erst durch
das Register aufgefallen. Ein Register, das man gegen die Wirklichkeit hält,
findet mehr als eine Liste, die man aufschreibt.

## Warum ein Register und nicht sieben Kopien

Die beiden vorhandenen Prüfungen waren Kopien voneinander: dieselbe
Quellenliste, derselbe Text, zwei Fassungen. Eine siebte Kopie wäre eine
siebte Stelle gewesen, an der die Quellenliste altert.

`src/erzeugnisstand.js` führt deshalb beides — **welches Erzeugnis aus welchen
Quellen entsteht** und **wer es liest**. Der Abbruchtext steht einmal.
`npm run pruefe-erzeugnis` hält das Register gegen den Bestand, in beide
Richtungen: Ein Werkzeug, das `ausgabe/` anfasst und in keinem Eintrag steht,
ist der Fund; ein Eintrag mit Erzeugnis, dessen Werkzeug die Prüfung nicht
ruft, ebenso. Zehn Werkzeuge stehen mit Pflichtgrund darin, warum sie
**keine** brauchen — vom Bauwerkzeug, das sich sonst selbst aussperrte, bis
zum Preisabgleich, für den das Veraltetsein einer Ausgabe der Befund und nicht
der Abbruchgrund ist.

## Vier Sofortfunde der eigenen Änderung

**Erstens, aus den Tests.** Der Wächter stand zuerst im Kopf von
`inhaltspruefung.mjs` — und dieses Werkzeug hat drei Durchgänge, von denen nur
einer das Erzeugnis liest. Vier Testfälle sagten binnen einer Minute, dass die
Prüfung der Inhaltsdateien damit nichts zu tun hat. Die Weigerung steht jetzt
im `--seiten`-Zweig.

**Zweitens, aus der Gegenprobe.** Sie nahm den Aufruf aus
`geheimnispruefung.mjs` heraus — und der Prüfer meldete weiter grün. Sein
Muster suchte den Bezeichner `frischebefund` **irgendwo** im Text und fand ihn
in der Importzeile.

> **Er hat geprüft, ob das Werkzeug die Prüfung kennt, nicht ob es sie ruft.**
> Gesucht wird jetzt der Aufruf.

**Drittens, aus dem Außentextverzeichnis.** `abbruchtext` baut Text und
brauchte deshalb einen Eintrag mit Begründung, warum sie kein Ausgang ist.

**Viertens, aus der Kette selbst.** Nach einer Quelländerung lief
`pruefe-geheimnis` nicht mehr und lieferte keinen Messwert — woraufhin
`pruefe-schaufenster` meldete: „kein Messwert für Rekonstruierbare
Einkaufspreise". Genau so soll es sein. Die Weigerung wird als **ungemessen**
weitergereicht und nicht als grün.

**Fünftens, und das war die teuerste Folge.** Der Gegenprobenläufer
**verändert Quelldateien** und schreibt sie zurück — beides macht das
Erzeugnis älter als die Quelle. Danach meldeten fünf Gegenproben „war schon
vorher rot" und beschuldigten damit Prüfer, die nichts falsch gemacht hatten.

> **Dasselbe Muster wie beim ignorierten `baueVorher` am 1. September:** Ein
> Läufer, der die Vorbedingung seiner Prüfer nicht kennt, erfindet Befunde.

Er baut jetzt vor jedem Erzeugnisleser neu, und **wer das ist, leitet er ab** —
aus den veröffentlichten npm-Skripten und dem Leserregister, ausdrücklich
nicht aus `PRUEFER`: `wegprobe` steht dort gar nicht und liest trotzdem
`ausgabe/website.html`. Eine Liste, die nur die geführten Prüfer kennt, hätte
genau die beiden Gegenproben weiter beschuldigt, die den Anlass gaben.

Dabei kam ein dritter Zustand ans Licht, den das Register braucht:
`pruefe-schaufenster` und `pruefe-pruefer` **lesen** das Erzeugnis und
weigern sich absichtlich nicht — für sie ist ein veralteter Stand der Befund
und nicht der Abbruchgrund. `weigertSich: false` sagt das, mit Pflichtgrund.
Sie stehen trotzdem mit Erzeugnis im Register, denn der Läufer muss auch vor
ihnen bauen.

Ergebnis: **40 von 40 Gegenproben schlagen an**, vorher 35.

## Und der Gesamtlauf baut jetzt zuerst

Der eigentliche Anlass war, dass `alles` grün melden konnte, während das
Erzeugnis nicht zur Quelle passte. Mit dem Wächter wäre es künftig rot
gewesen — und hätte damit gesagt, wann zuletzt jemand `npm run website`
getippt hat, statt etwas über den Bestand.

> **Eine Batterie, die das Erzeugnis misst, muss es vorher erzeugen.**

`npm run alles` hat deshalb einen ersten Schritt bekommen: `bauen`. Rot wird
er, wenn ein Baubefehl scheitert — was sich nicht bauen lässt, lässt sich auch
nicht prüfen, und die fünf Prüfer darunter meldeten sonst „veraltet" und
verschwiegen die Ursache.

Zusammen mit den beiden Schritten von heute früh und mittag hat der Lauf jetzt
einen Anfang und ein Ende, die beide zum Bestand gehören: **bauen** zuerst,
**nichts liegen geblieben** zuletzt.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste. Es ändert, was „grün" wert ist: Bis heute konnte ein
grüner Gesamtlauf über eine Website reden, die es so nicht mehr gab.
