# Dem Verweis folgen, nicht seine Adresse lesen

**29. August 2026, kurz nach Mitternacht.** Die beiden Proben für den
„Meinten Sie …?"-Vorschlag prüften, **wohin** die Zeile zeigt:

```js
fuehrtZurSuche = /q=kanalrohr/.test(verweis.getAttribute('href'))
```

Das ist die Sorte Prüfung, die dieses Vorhaben schon zweimal in die Irre
geführt hat — sie liest die **Absicht** statt das **Ergebnis**. Ein Verweis
kann tadellos aussehen und auf einer leeren Seite landen: falsche Kennung,
falsche Raute, kaputte Rautennavigation, ein Suchwort, das im Index doch
nicht vorkommt.

> **Ein Verweis ist geprüft, wenn man ihm gefolgt ist.**

Beide Szenarien klicken jetzt und sehen nach, was danach dasteht:

```
Kein Treffer für „kanalror".      →  Meinten Sie: kanalrohr?
                                  →  geklickt: 2 Treffer für „kanalrohr"
```

Gegengeprobt, indem der Vorschlag ins Leere zeigt (`q=kanalrohrxyz`): Die
Probe meldet „Kein Treffer für ‚kanalrohrxyz'" und fällt. Mit der alten
Fassung — Adresse lesen — wäre sie grün geblieben, denn die Adresse enthielt
weiterhin „kanalrohr".

## Warum das mehr ist als Gründlichkeit

Die drei Fälle dieser Woche, in denen eine Prüfung das Falsche ansah:

| | las | hätte lesen müssen |
|---|---|---|
| Interna auf der AGB-Seite | das Modell | die gebaute Seite |
| „Stärke maßstäblich" | ob ein Bild da ist | ob es das richtige Bild ist |
| Vorschlagsverweis | die Adresse | die Seite danach |

Jedes Mal war die einfachere Prüfung die, die grün blieb. Das ist kein
Zufall: **Was leichter zu prüfen ist, ist meist das, was ohnehin stimmt.**

## Stand

778 Tests grün, `shopprobe` **34 Szenarien**, `pruefe-pruefer` 6 Prüfer mit
belastbarem Umfang.
