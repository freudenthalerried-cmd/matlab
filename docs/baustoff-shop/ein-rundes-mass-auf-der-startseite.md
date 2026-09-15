# Ein rundes Maß auf der Startseite

**9. September 2026.** Nach den Gruppen- und Wissensseiten die **Startseite** —
die Fläche, die jeder zuerst sieht. Sieben Kacheln führen ins Sortiment, jede
mit einem gezeichneten Sinnbild ihrer Warengruppe.

Die Kachel **Mauerwerk** zeigte:

> Ziegel N+F **25 cm**

Geführt wird in dieser Gruppe genau **ein** Artikel: „Ökotherm HL N+F 10 50
**23,8 cm**".

Kein Auslegungsspielraum — es gibt nur diesen einen. Und bei Mauersteinen ist
die Wandstärke nicht irgendeine Eigenschaft, sondern **die** entscheidende;
die Gruppenseite sagt es selbst: *Steinformat und Wandstärke kommen aus der
Planung.* Ein rundes Maß auf der Startseite liest sich als Angebot, und
geliefert wird ein anderes.

> **Ein Sinnbild darf grob sein. Eine Zahl darin ist trotzdem eine Zahl.**

---

## Sechs von sieben stimmten

| Gruppe | Sinnbild | im Sortiment |
|---|---|---|
| Dämmung | Dämmplatte 80 mm | ✓ zwei Artikel mit 80 mm |
| WDVS | Gewebe 110 cm | ✓ Capatect Glasgewebe, Breite 110 cm |
| Mörtel | Mörtel 25 kg | ✓ zwei Säcke à 25 kg |
| Kanal | Kanalrohr NW 100 | ✓ fünf Kanalartikel NW 100 |
| Zubehör | Kartusche 750 ml | ✓ drei Soudal-Artikel à 750 ml |
| Kamin | Mantelstein | — trägt gar keine Zahl, und das ist richtig |
| **Mauerwerk** | **Ziegel N+F 25 cm** | **✗ der einzige Artikel hat 23,8 cm** |

Die Muster sind absichtlich grob. Das ist kein Fehler: „Mantelstein" ohne Maß
ist eine ehrlichere Zeichnung als eine mit erfundener Zahl. Geprüft wird
deshalb nur, was nachrechenbar ist — **jedes Maß muss im Namen eines Artikels
seiner Gruppe vorkommen.**

---

## Zwei Listen für dieselbe Sache, gleich beim Bauen

Die Mustertabelle stand **im Rumpf von `gruppenBild`** — von außen nicht
lesbar. Um sie zu prüfen, hätte ich sie abschreiben müssen, und genau das habe
ich zuerst getan: eine zweite Tabelle als Ausfuhr, neben der ersten.

> **Ein Maß, das nur innerhalb einer Funktion existiert, kann kein Prüfer
> gegen den Katalog halten — aber zwei Tabellen für dieselbe Sache sind eine
> Tabelle, die niemand pflegt.**

`GRUPPENMUSTER` steht jetzt einmal, als Ausfuhr, und `gruppenBild` liest sie.

Neu: `npm run pruefe-sinnbilder` — **40 Prüfer** statt 39, mit Eintrag im
Prüferregister. Gezählt wird das **Angesehene**: sieben Warengruppen, fünf
Maße. „Kein Maß daneben" darf nicht aussehen wie „kein Maß angesehen".

---

## Und ein Schrecken, der keiner war

`npm run pruefe-pruefer` meldete nach meinen Änderungen:

```
40 Prüfer befragt, 0 ohne belastbaren Umfang, 12 abgebrochen.
```

Zwölf Abbrüche. Nach `npm run website && build && kampagne && messliste`:

```
40 Prüfer befragt, 0 ohne belastbaren Umfang, 1 abgebrochen.
```

Der eine ist `pruefe-gebinde`, das seit dem 8. September ohne
`preise/poschacher-positionen.csv` nicht misst. Die anderen elf waren **meine
eigenen Quelländerungen**: Elf Prüfer lesen das Erzeugnis und weigern sich
über einem veralteten Stand — die Frischeprüfung aus der Runde vom Vormittag,
die genau das tun soll.

> **Ein Prüferlauf über ein veraltetes Erzeugnis sieht aus wie ein kaputter
> Bestand. Er ist der Beweis, dass die Weigerungen greifen.**

Aufgeschrieben, weil die Zahl beim nächsten Mal wieder erschrecken wird.

**Gezeigt, dass die neue Regel anschlägt:** 23,8 auf 25 zurückgesetzt →
`sinnbildmass-ohne-artikel`. 5 neue Testfälle, Gegenprobe
`das-sinnbild-zeigt-ein-mass-das-es-nicht-gibt`: *meldete rot an der
erwarteten Stelle.*
