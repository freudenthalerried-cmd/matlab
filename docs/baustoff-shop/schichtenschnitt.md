# Der Schichtenschnitt — ein Bild, das die Lücke mitzeichnet

**27./28. August 2026.** Weisung: mehr Bilder, Schwerpunkt Produkte. Bilder
gibt es für jeden Artikel. Was fehlte, war das Bild des **Bauteils** — und
genau dort sitzt die Aussage, die eine Systemliste macht: In welcher
Reihenfolge liegen die Lagen, und welche davon kommt nicht aus diesem Shop.

## Was neu ist

Zwei Systemlisten tragen jetzt einen Schnitt durch den Aufbau:

| Liste | Lagen von innen nach außen |
|---|---|
| Kellerwand außen dämmen | Wand *(fremd)* · Abdichtung *(fremd)* · Perimeterplatte XPS · Grundmauerschutzbahn · Verfüllung *(fremd)* |
| Fassade dämmen | Untergrund *(fremd)* · Klebemörtel · Dämmplatte *(fremd)* · Armierungsmörtel mit Glasgewebe · Putzgrund · Oberputz |

Die fremden Lagen sind **schraffiert und mit „nicht von uns" beschriftet**.
Das ist der eigentliche Grund für das Bild:

> Ein Schichtbild, das nur die eigenen Lagen zeigt, sieht aus wie ein
> vollständiges Bauteil und ist keines.

Bei der Fassade zeichnet es die Lücke, die vorgestern nur im Text stand:
Position 2, die Dämmplatte, ist die dickste Lage im Bild — und schraffiert.

**Bewusst nicht maßstäblich.** Welche Stärke jede Lage braucht, entscheidet
die Planung. Eine Zeichnung, die 8 cm Dämmung zeigt, behauptet 8 cm. Alle
Bänder sind deshalb gleich hoch; das Bild zeigt die Reihenfolge, und die ist
die Aussage.

**Nur zwei von vier Listen.** Kaminzug und Grundleitung bekommen keins: Ein
Kamin ist im Schnitt ein Ring, eine Grundleitung ein Graben — beides ist kein
Lagenstapel, und ein Bild, das sie als einen zeichnet, wäre falsch. Lieber
kein Bild als ein Bild, das die Bauform verfehlt.

## Vier Proben, zwei davon gegen mich selbst

1. **Zerlegung** der Kopfzeile `schichten:` inklusive Leerfälle.
2. **Zeichnung**: ein Band je Lage, Schraffur genau für die fremden.
   Mutation — alle Lagen gleich füllen — lässt sie fallen.
3. **Vorlesbarkeit**: Das `aria-label` nennt alle Lagen in Reihenfolge und
   markiert die fremden mit Worten. Ein Schema, dessen Aussage nur in der
   Zeichnung steht, ist für einen Teil der Leser gar nicht da — und für jedes
   Sprachmodell, das die Seite liest, ebenso wenig.
4. **Bild und Text müssen dasselbe sagen**: Jede im Bild als fremd markierte
   Lage muss auch im Fließtext der Seite vorkommen. Mutation — eine
   „Dampfbremse (fremd)" eintragen, die im Text nicht steht — lässt sie
   fallen. Diese Probe verhindert die Fassung, vor der ich hier am meisten
   Respekt habe: eine Zeichnung, die etwas Eigenes behauptet, weil sie
   niemand gegen den Text gehalten hat.

Dazu eine sechste 390-px-Rahmenprobe: Die Systemliste mit dem Schnitt scrollt
nicht seitwärts. Ein SVG mit rechtsbündigen Beschriftungen außerhalb der
Bänder ist genau die Art Zeichnung, die einen schmalen Rahmen sprengt.

## Eine Prüflücke, aufgeschrieben statt geschlossen

Der Absatz unter der Zeichnung wird vom **Seitenbauwerkzeug** erzeugt, steht
aber auf einer Seite aus `inhalte/`. `pruefe-seiten` überspringt diese Seiten
vollständig, weil ihr Text an der Quelle geprüft wird — dieser Absatz aber
steht nicht in der Quelle. Er läuft damit durch keine der beiden Prüfungen.

Heute ist das folgenlos (der Absatz enthält keine Zahl mit Einheit und keine
Geltungsaussage). Aufgeschrieben wird es trotzdem, weil die Lücke wächst,
sobald das Werkzeug mehr Text auf Inhaltsseiten schreibt. Die saubere Lösung
wäre eine Ausnahme **je Absatz** statt je Seite.

## Stand

- 709 Tests grün (vorher 705; +4)
- `shopprobe` **26** Szenarien, davon 6 im 390-px-Rahmen; `oberflaechenprobe` 11
- `pruefe-inhalte` 24/355/0, `pruefe-seiten` 54/213/0, `pruefe-widerrufe` 128
  Dateien sauber, `pruefe-pruefer` 6 Prüfer mit Umfang
- Website 81 Seiten ohne toten Verweis
