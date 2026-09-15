# Die Statusseite nannte noch die Freigaben des alten Modells

**28. August 2026.** Der Arbeitsloop beginnt mit einer Anweisung: *„Lies
zuerst … den jeweils jüngsten Phasenstand."* Wer das tut, landet in
`STATUS.md` — und dort stand unter **„Was als Nächstes gebraucht wird"** seit
dem 22. August etwas Falsches:

| dort | tatsächlich |
|---|---|
| Freigabe für E-Mails an dreizehn Hersteller | keine Hersteller — der Auftraggeber kauft bei einem Händler |
| Keyword-Werkzeug für ~50 € buchen | nicht mehr entscheidend |
| „Rechtsform, Shop, Inhalte erst ab Stufe 2" | Shop und Inhalte stehen seit einer Woche |

Das ist der Plan des **Radon-Stufenmodells**, das der Kurswechsel vom 22.
August abgelöst hat. Der Rest der Datei ist seither zwölfmal fortgeschrieben
worden; ausgerechnet die Tabelle, die sagt, was als Nächstes zu tun ist, blieb
stehen.

> **Ein überholter Plan an der Stelle, an die man zuerst schaut, ist teurer
> als ein überholter Plan irgendwo.** Er beantwortet die Frage, die man beim
> Aufschlagen stellt — und beantwortet sie falsch.

## Was jetzt dort steht

Die sieben Schritte, die der Shop tatsächlich braucht, sortiert danach, was
ihn am weitesten bringt:

1. **Artikelliste** aus dem Poschacher-Webshop — der Importweg steht
2. **Impressum** vervollständigen (vier Angaben)
3. **Zahlungsanbieter** wählen
4. **Domain und Hosting**
5. **Rechtstexte** verbindlich
6. **Repository privat** — 44 von 46 Einkaufspreisen sind rekonstruierbar
7. **Mindestbestellwert** entscheiden (Gate 20, ~114 € bei palettierter Ware)

Der alte Abschnitt bleibt stehen, mit einem Vorspann als Zitatblock: Er ist
Fehlergeschichte, und die ist der wertvollste Teil dieses Verzeichnisses.
Genau die Bauform, die das Widerrufsregister verlangt — der Widerruf steht in
Sichtweite der Aussage, nicht in einer anderen Datei.

## Und die Zahl aus dem Lastlauf ist jetzt ein Wächter

Der Lastlauf hatte gemeldet, dass die Einzeldateifassung mit dem Sortiment
wächst: 46 Artikel → 1,5 MB, 141 → 3,3 MB. Das stand als Satz in einem
Dokument, und dort wäre es geblieben.

Jetzt meldet der Bau selbst:

```
Einzeldatei:  ausgabe/website.html (1505 KB, 33 KB je Artikel)
```

und ab 6 MB einen Hinweis, dass die Vorschau zum Doppelklicken damit am Ende
ist. **Gegengeprobt**, indem die Grenze auf 1 MB gesetzt wurde — der Hinweis
erscheint. Ein Wächter, den niemand hat auslösen sehen, ist kein Wächter.

Die Mehrseitenfassung ist davon nicht betroffen; sie lädt je Seite. Der
Ausweg wäre dann, die Vorschau auf die Stammseiten und eine Auswahl zu
beschränken — und das ist eine Entscheidung, keine Optimierung: Eine Vorschau,
die nur einen Teil des Sortiments zeigt, muss sagen, dass sie es tut.

## Stand

762 Tests, `pruefe-tests` 761 / 0, `pruefe-seiten` 58/217/0, `pruefe-inhalte`
24/355/0, `pruefe-widerrufe` sauber, Website 81 Seiten ohne toten Verweis.
