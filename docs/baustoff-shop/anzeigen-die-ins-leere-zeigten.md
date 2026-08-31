# Drei Anzeigen, die ins Leere zeigten

**31. August 2026.** Nachdem das Budget auf die tragenden Gruppen konzentriert
war, blieb eine Frage offen, die ich noch nicht gestellt hatte: **Gibt es die
Seiten, auf die die Anzeigen zeigen?**

Nein. Keine einzige.

```
Anzeige zeigt auf                      gebaut ist
bauversand.com/fassade                 gruppe/wdvs.html
bauversand.com/daemmung                gruppe/daemmung.html
bauversand.com/kamin                   gruppe/kamin.html
```

Alle drei Anzeigen des ersten Anlaufs hätten jeden bezahlten Klick auf einer
Fehlerseite abgeliefert.

## Die Ursache: zwei verschiedene Dinge, ein Feld

Google-Suchanzeigen haben **zwei** Adressangaben, und sie tun Verschiedenes:

- Die **finale URL** ist die Seite, die der Klick öffnet.
- Der **Anzeigepfad** (`Pfad 1`, `Pfad 2`) ist Zierwerk: Er wird unter der
  Adresse eingeblendet — „bauversand.com/**fassade/wdvs**" — und muss mit der
  echten Seite nichts zu tun haben. Er darf werben, wo die Adresse technisch
  ist.

Das Werkzeug hatte nur den Anzeigepfad und setzte ihn für beides ein. Für
`Pfad 1` war er richtig; als Ziel war er eine Adresse, die es nie gab.

> **Der dritte Fund derselben Familie an einem Tag** — nach der veralteten
> Ziel-URL beim Domainwechsel und dem Mühlviertel, das nicht das Liefergebiet
> ist. Jedes Mal bezahlt man dafür, Besucher wegzuschicken. Diesmal am
> direktesten: nicht die falsche Gegend, nicht die alte Adresse, sondern gar
> keine Seite.

Und wieder derselbe Grund: Das Kampagnenwerkzeug brauchte eine Angabe, die es
schon gab, hatte keinen Zugriff darauf und half sich mit dem, was zur Hand
war. Die Zuordnung Warengruppe → Seite stand in `bin/website.mjs` als
Navigationsliste.

## Was geändert wurde

`GRUPPENSEITE` steht jetzt in `src/artikelliste.js`, neben `WARENGRUPPEN` —
dort, wo die Warengruppen ohnehin ihr Vokabular haben. `website.mjs` baut
seine Navigation daraus (die Reihenfolge bleibt dort, das ist Gestaltung),
`kampagne.mjs` bildet daraus die Ziel-URL:

```
https://bauversand.com/gruppe/wdvs.html     Anzeigepfad: fassade / wdvs
https://bauversand.com/gruppe/daemmung.html Anzeigepfad: daemmung / xps
https://bauversand.com/gruppe/kamin.html    Anzeigepfad: kamin / schiedel
```

Der Anzeigepfad bleibt, was er war — er darf „fassade" sagen, während die
Seite `wdvs.html` heißt. Genau dafür ist er da.

Fehlt einer Gruppe die Seitenkennung, bricht das Werkzeug ab. Eine Anzeige
ohne Ziel ist teurer als keine Anzeige.

**Die Umlaute sind ausgeschrieben, nicht gerechnet.** `Mörtel` wird zu
`moertel`, nicht zu `mortel`. Eine Regel dafür gäbe es — `normalisiere()` in
`shopkern.js` faltet Umlaute für die Suche —, aber Adressen dürfen sich nicht
ändern, wenn jemand eine Suchregel verbessert.

## Die Probe schlägt nach, statt zu lesen

Der entscheidende Punkt der neuen Zusicherung: Sie vergleicht die Ziel-URL
nicht mit einer erwarteten Zeichenkette, sondern **schlägt die Datei im
gebauten Ordner nach**. Eine Probe, die zwei Zeichenketten vergleicht, hätte
den Fehler nie gefunden — beide waren ja genau so gemeint, wie sie dastanden.

## Gegenproben

| Mutation | erkannt |
|---|---|
| Anzeigepfad wieder als Ziel-URL | ja |
| Kennung zeigt auf eine andere (existierende) Seite | ja |
| Warengruppe ohne Seitenkennung | ja |

Die zweite ist die interessantere: Sie ersetzt `wdvs` durch `fassade` — eine
Kennung, die *aussieht* wie eine Adresse und deren Seite es nicht gibt. Genau
der ursprüngliche Fehler, nur an anderer Stelle eingebaut.

`pruefe-tests` meldete danach eine Schleife ohne Längenzusicherung — ergänzt.

## Stand

1018 Testfälle grün (vorher 1016), `pruefe-tests` 1016/0, Website 81 Seiten
ohne toten Verweis, elf Prüfer mit `--mit-browser` ohne Beanstandung,
`pruefe-stand` 213/213. Kampagnen unverändert pausiert.
