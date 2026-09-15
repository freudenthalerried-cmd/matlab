# Die Blindstelle, die ich selbst gemacht habe

**31. August 2026, abends.** Erste Aufgabe für das neue Gegenprobenwerkzeug,
und sie hat sofort etwas gefunden — allerdings anders, als ich erwartet hatte.

## Der Befund

Mittags habe ich das Werbebudget auf die drei tragenden Gruppen konzentriert.
Seitdem gibt `kampagne.mjs` nur noch drei Anzeigen aus — und `pruefeTexte`
sah nur noch diese drei.

In der zurückgestellten Gruppe **Kanal** stand weiterhin:

```
'PVC Kanal ab Lager'
```

Dieselbe unwahre Vorratszusage, die ich am Nachmittag aus der Gruppe Dämmung
entfernt habe. Der Betrieb führt kein Lager (PARAMETER.md, Streckengeschäft).

Nachgemessen, mit beiden Zuständen:

| Prüfumfang | „PVC Kanal ab Lager" in Kanal | `npm run kampagne` |
|---|---|---|
| nur die ausgegebenen Anzeigen (mittags bis abends) | vorhanden | **Code 0 — geht durch** |
| der ganze Textvorrat (jetzt) | vorhanden | Code 1 — wird bemerkt |

> **Ein Fehler mit bekanntem Auslösetag, kein latenter.** Er wäre an dem Tag
> hinausgegangen, an dem eine gemessene Kaufquote die zurückgestellten Gruppen
> aktiviert — also genau dann, wenn niemand mehr an die Textprüfung denkt,
> weil sie ein halbes Jahr lang grün war.

Und die Blindstelle war **die Folge meiner eigenen Änderung**. Ich habe den
Ausgabeumfang verkleinert, und weil Ausgabe und Prüfung an derselben Liste
hingen, ist die Prüfung mitgeschrumpft.

## Was geändert wurde

`ANZEIGENTEXTE` steht jetzt auf Modulebene und ist exportiert, ebenso
`pruefeTexte` und die neue `alleAnzeigentexte()`. Geprüft wird der **ganze
Vorrat** plus die tatsächliche Ausgabe:

```js
const textfehler = [...pruefeTexte(alleAnzeigentexte()), ...pruefeTexte(anzeigen)];
```

Der Text selbst heißt jetzt „PVC Kanal vom Baumeister" — dieselbe Aussage, die
die Kampagne ohnehin trägt.

## Was das Werkzeug an meiner Probe gefunden hat

Der eigentliche Ertrag des Abends. Mein erster Testfall las den **Quelltext**
und verlangte, dass `Object.entries(ANZEIGENTEXTE)` darin vorkommt. Die
Gegenprobe nahm nur die *Verwendung* zurück und ließ den Ausdruck stehen — die
Probe blieb grün.

> **Eine Probe, die die Schreibweise prüft, prüft nicht das Verhalten.** Sie
> ist grün, solange das richtige Wort irgendwo steht, und schweigt, wenn es
> nichts mehr tut.

Neu geschrieben, in drei Schritten, alle über das Verhalten:

1. Die Prüfmenge deckt **jede** Gruppe des Vorrats — verglichen mit der Liste
   der zurückgestellten Gruppen aus `spaeter-pruefen.csv`.
2. `pruefeTexte` findet in dieser Menge tatsächlich eine untergeschobene
   Vorratszusage.
3. Der echte Vorrat ist sauber.

## Eine Mutation, die zu Recht nicht anschlägt

Die Gegenprobe „Prüfung wieder nur auf die Ausgabe" meldet **nicht
bestanden** — und das ist kein Mangel der Probe.

Diese Mutation hat für sich genommen keine Wirkung: Solange alle Texte sauber
sind, findet auch die enge Prüfung nichts, und der Lauf endet mit 0. Sichtbar
wird sie erst **zusammen** mit einem Fehler in einer zurückgestellten Gruppe —
und genau diese Kombination lehnt das Gegenprobenwerkzeug ab, weil es auf eine
einzelne, eindeutige Änderung besteht.

Die Kombination habe ich deshalb einmal von Hand gefahren; sie steht als
Tabelle oben. Was die Proben abdecken, ist die Kette: dass die Prüfmenge
vollständig ist (Schritt 1, Mutation „Prüfmenge auf drei Gruppen gekürzt" wird
erkannt) und dass die Prüfung darin findet (Schritt 2).

**Nicht jede sinnvolle Zusicherung lässt sich mit einer einzelnen Mutation
zeigen.** Das aufzuschreiben ist ehrlicher, als eine Gegenprobe zu bauen, die
scheinbar passt.

## Stand

1032 Testfälle grün (vorher 1031), `pruefe-tests` 1030/0, `pruefe-inhalte`
24/357/0, elf Prüfer mit `--mit-browser` ohne Beanstandung, `pruefe-stand`
216/216. Kampagnen unverändert pausiert.
