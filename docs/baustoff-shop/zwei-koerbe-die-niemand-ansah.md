# Zwei Körbe, die niemand ansah

**6. September 2026, nachmittags.** Die Runde davor hat `pruefe-koerbe` gebaut:
Jede geführte Position einer Systemliste liegt im Referenzwarenkorb ihrer
Anzeigengruppe — oder der Korb sagt, warum nicht. Vier Systemlisten, vier
Körbe, alles grün.

Der Prüfer läuft über die **Systemlisten**.

Es gibt sechs Anzeigengruppen.

> **Ein Prüfer, der über die Listen läuft, sieht die Körbe nicht, zu denen es
> keine Liste gibt.**

Dasselbe Register, das nur seine eigenen Einträge zählt — in der eigenen
Prüfung von gestern, achtzehn Stunden alt.

---

## Und es sind nicht irgendwelche zwei

„Mörtel" und „Mauerwerk" haben keine Systemliste. Sie sind auch die beiden
Gruppen, die **zurückgestellt** sind:

```
Zurückgestellt — tragen 125 € Werbekosten je Verkauf nicht:
  Kanal        Deckungsbeitrag 69.07 €
  Mörtel       Deckungsbeitrag 92.51 €
  Mauerwerk    Deckungsbeitrag 61.81 €
```

> **Die Entscheidung, die zwei von sechs Gruppen aus dem Budget nimmt, ruhte
> auf den beiden Körben, die keine Prüfung ansah.**

Kanal ist der dritte Zurückgestellte und hat eine Liste — er ist geprüft und
bleibt zurückgestellt. Die anderen beiden waren es nicht.

---

## Was beim Hinsehen herauskam

**„Mörtel" ist kein Bauteil, sondern ein Baustoff** — und die Gruppe fasst drei
Mörtel mit drei verschiedenen Aufgaben: Klebespachtel für das WDVS,
ThermoMörtel für das Mauerwerk, Vergussmörtel für den Verguss. Ein gemeinsames
Bauteil, dessen Positionen man auflisten könnte, gibt es nicht. *Wer
Vergussmörtel bestellt, bestellt Vergussmörtel.* Das ist der Grund, und er
steht jetzt im Korb.

**„Mauerwerk" ist der Fund.** Der Korb trägt 128 Planziegel und keinen Mörtel.
Gemauert wird kein Ziegel ohne ihn, und der Shop **führt** ihn: `Baumit
ThermoMörtel 50` ist der Leichtmauermörtel zum Hochlochziegel. Er liegt nur in
einer anderen Anzeigengruppe.

> **Zwei Anzeigengruppen, zwei Ein-Positionen-Körbe — und zusammen wären sie
> eine Bestellung.**

---

## Was daraus folgt und was nicht

Die Menge fehlt: Der Mörtelverbrauch je Quadratmeter Mauerwerk steht im
Merkblatt des Herstellers und nicht im Katalog. Dieselbe Wand wie gestern bei
Armierungsmörtel, Oberputz und Perimeterkleber — und dieselbe Antwort: **eine
geratene Menge im Korb ergäbe ein geratenes Gebot.**

Damit bleibt die Folge offen, und das gehört so gesagt:

> **Der Deckungsbeitrag der Gruppe „Mauerwerk" (61,81 €) ist eine untere
> Schranke, und die Rückstellung ruht auf ihr.**

Ob sie mit dem Mörtel über 125 € käme, weiß hier niemand. Es zu behaupten wäre
so falsch wie es zu verschweigen. Der Weg dorthin ist derselbe wie bei den
anderen Verbrauchswerten: das Herstellermerkblatt, das aus dieser Umgebung
gesperrt ist und in der PR-Beschreibung als offener Punkt steht.

---

## Der Prüfer läuft jetzt in beide Richtungen

- Über die Systemlisten: Jede geführte Position liegt im Korb oder hat einen
  Grund. *(seit gestern)*
- Über die Körbe: Jeder Korb hat eine Systemliste oder einen Grund, warum
  keine. *(seit heute)*

Die Übersicht zeigt beides; für einen Korb ohne Liste steht `null` statt einer
Positionszahl — **das ist keine Lücke, sondern die Auskunft „hier gibt es
nichts zu decken".** Ein Testfall verlangt, dass mindestens ein solcher Korb in
der Übersicht steht: Wäre keiner darin, prüfte die Gegenrichtung nichts.

Gegenprobe `korb-ohne-liste-ungeprueft` nimmt dem Mörtelkorb seinen Grund.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-koerbe` prüft die Gegenrichtung mit |
| Neue Gegenproben | `korb-ohne-liste-ungeprueft` |
| Neue Testfälle | 4 (`test/warenkorbdeckung.test.js`, 8 → 12) |
| Gefundene Fehler | einer: „Mauerwerk" rechnet ohne den Mörtel, den der Shop führt |

## Was offen bleibt

- **Der Mörtelverbrauch je m² Mauerwerk.** Ohne ihn bleibt der
  Deckungsbeitrag dieser Gruppe eine untere Schranke — und damit auch die
  Rückstellung. Freigabepflichtig ist er nicht: Er steht im Merkblatt, und das
  Merkblatt ist aus dieser Umgebung nicht erreichbar.
- **Eine Systemliste „Mauerwerk" wäre der saubere Weg** — sie würde Ziegel und
  Mörtel als Positionen eines Bauteils führen, so wie es die vier anderen
  Listen tun. Das ist Inhaltsarbeit mit einem Artikel im Sortiment; **nicht
  getan**, weil eine Systemliste über ein Bauteil aus einem einzigen geführten
  Artikel mehr verspricht, als der Katalog hergibt.
- **Die Gebietsfrage an den Lieferanten** und die sieben Punkte in
  `npm run startklar` — alle beim Auftraggeber.
