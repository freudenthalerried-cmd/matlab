# Dieselbe Regel, schärfer — und nicht messbar

> ⚠️ **Diese Fassung war falsch und ist am selben Abend berichtigt worden.**
> Der Kamin **ist** messbar: Acht von neun Artikeln lösen sich über
> `src/hersteller.js` zu „Schiedel Österreich" auf. Der Nachtrag am Ende sagt,
> was gilt.

**8. September 2026, abends.** Nachdem der WDVS-Fall gefunden war, lag die
Frage nahe: **Gibt es ihn woanders auch?**

Der Kaminzug behauptet dieselbe Regel schärfer als das WDVS, und zwar im
**ersten Satz** seiner Seite:

> „Die Teile eines Systems sind aufeinander abgestimmt und werden **nicht mit
> denen eines anderen gemischt**."

Und einen Absatz weiter, für ein ganz bestimmtes Teil:

> „… mit einem **Dünnbettmörtel des Systems** versetzt, nicht mit gewöhnlichem
> Mauermörtel — die Fugendicke gehört zum System."

---

## Gemessen: Es lässt sich nicht messen

Neun Kaminartikel, und die Systemmarke steht in **vier Schreibweisen an
wechselnder Stelle**:

| Artikel | Marker | wo |
|---|---|---|
| SIKM Fertigfußpaket 18 | `SIKM` | vorn |
| Mantelstein MSTS EZ 16-18 SIKM | `SIKM` | **hinten** |
| SIK Zuluftplatte EZ 16-18 | `SIK` | vorn |
| Schiedel Fugenmasse FM 1,5 kg | `Schiedel` | vorn |
| Thermo-Trennstein 12-18 EZ Absolut | `Absolut` | Mitte |
| Regenhaube … 180 Absolut & SIH | `Absolut & SIH` | hinten |
| **Mantelsteinkleber RMRTL Dünnbettmörtel** | **keiner** | — |

Der eine Artikel ohne jeden Marker ist **ausgerechnet der Dünnbettmörtel** —
das Teil, das dieselbe Seite als systemgebunden hervorhebt.

Beim WDVS war die Marke am Anfang der Bezeichnung eine Behelfslösung, die
trägt: neun von elf Artikeln, eindeutig, und der Fall, vor dem die Seite warnt,
war bestellbar. Beim Kamin trägt sie nicht.

> **Beim WDVS war die Marke eine Behelfslösung, die trägt. Beim Kamin trägt sie
> nicht — und das ist kein Grund, sie trotzdem zu benutzen.**

Ein Kamin ist ein **Brandschutzbauteil**; über seine Abnahme entscheidet der
Rauchfangkehrer anhand der Systemzulassung. Eine geratene Zuordnung wäre dort
schlimmer als keine: Sie sähe aus wie eine Auskunft.

---

## Was stattdessen dasteht

Das Gewerk steht als **„nicht bestimmbar"** — mit dem Grund und mit dem
Artikel, an dem es scheitert. Der Prüfer sagt es bei jedem Lauf:

```
2 Gewerke mit Systemtreue in ihrer Wissensseite, 1 davon am Katalog messbar

  ⃠ Kamin: nicht bestimmbar — POS-18110 trägt keine Systemmarke.
      Auflösbar mit dem Herstellerfeld aus der Artikelliste des Lieferanten.
```

Das ist dieselbe Unterscheidung, die dieser Tag dreimal gebraucht hat:
**ein Befund ist nicht dasselbe wie eine fehlende Grundlage.**

Und der Eintrag muss den Blockierer **nennen**. Verschwindet `POS-18110` aus
dem Katalog, meldet der Prüfer `blockierer-verschwunden` und die Frage ist neu
zu stellen — sonst bliebe eine Begründung stehen, deren Anlass es nicht mehr
gibt.

> **Eine Ausrede ist eine Begründung, die ihren Anlass überlebt hat.**

Aufgelöst wird das nicht im Verzeichnis, sondern mit dem **Herstellerfeld aus
der Artikelliste des Lieferanten** — dem Punkt, den der Brief ohnehin schon
erbittet. Es ist jetzt die fünfte Sache, die diese eine Antwort löst.

---

## Gate 31, nachgetragen

Die Entscheidung der vorigen Runde stand im Code und nicht im Register. Sie
hat zwei Hälften:

**Gewarnt wird, nicht gesperrt.** Eine Sperre wäre falsch, weil der Shop nicht
weiß, was der Kunde vorhat — eine Sanierung kann eine Position eines
Fremdsystems bewusst nachbeziehen. Welche Zusammenstellung geprüft ist, steht
in den Systemunterlagen des Herstellers und nicht bei uns. Deshalb endet der
Satz an den Kunden mit: *„Wir liefern, was Sie bestellen — diese Zeile soll nur
verhindern, dass es niemand bemerkt hat."*

**Geraten wird nicht.** Wo die Zugehörigkeit nicht aus der Bezeichnung folgt,
steht „nicht bestimmbar" statt einer Regel, die meistens stimmt.

Die Spur dazu ist `systembruch()` selbst: Sie gibt einen **Befund** zurück, den
die Kasse als Satz weiterreicht, und **keine Sperre**. Wäre sie eine Sperre,
hätte der Shop entschieden, was der Kunde vorhat.

---

## Zwei eigene Fehler, vom Bestand gefunden

`pruefe-tests` meldete eine Schleife über `GEWERKE` ohne vorherige
Längenzusicherung — bei leerer Liste hätte sie nichts geprüft und wäre grün
gewesen. Derselbe Fund wie in der Runde davor, im selben Testmuster.

`pruefe-schaufenster` meldete, dass die PR-Beschreibung weiter **30 Gates**
nennt, während es einunddreißig sind. Beides behoben, bevor es hinausging —
der Haken vom Nachmittag hätte den Commit ohnehin nicht durchgelassen.
---

## Berichtigt am selben Abend: Der Kamin **ist** messbar

**Dieses Dokument war in seiner ersten Fassung falsch.** Es schloss aus vier
Schreibweisen, die Systemzugehörigkeit der Kaminartikel sei „nicht
bestimmbar". Der Bestand löst sie seit Langem auf.

`src/hersteller.js` führt `HERSTELLER` mit **SIKM, SIK, Schiedel, Absolut und
SIH** — alle auf „Schiedel Österreich", mit Beleg für die Produktlinien
(Konditionenblatt des Lagerhauses, Seite 18). `marke()` sucht überall im Text,
aber nur als ganzes Wort und mit der längsten Marke zuerst; sein
Kopfkommentar nennt als Anlass **genau die drei Artikel**, über die ich
gestolpert bin.

Gemessen mit der richtigen Liste: **acht von neun** Kaminartikeln lösen sich
auf. Genau einer nicht — `POS-18110 Mantelsteinkleber RMRTL Dünnbettmörtel`.

> **Ich habe aus der Unkenntnis meiner eigenen Liste einen Befund über den
> Bestand gemacht.**

Was bleibt, ist **schärfer** als das, was hier stand: nicht ein unlesbares
Gewerk, sondern **eine einzige Lücke an der schlechtestmöglichen Stelle** — bei
dem Teil, das die Kaminseite als einzige Position mit dem Zusatz „des Systems"
hervorhebt. Sie steht jetzt in `SYSTEM_UNBEKANNT`, mit Grund und mit dem Weg
zur Auflösung, und der Kamin gilt als messbar.

Alles Weitere steht in
[`drei-listen-fuer-dieselbe-marke.md`](./drei-listen-fuer-dieselbe-marke.md).
