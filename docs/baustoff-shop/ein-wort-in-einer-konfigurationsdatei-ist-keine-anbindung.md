# Ein Wort in einer Konfigurationsdatei ist keine Anbindung

**9. September 2026.** Nach dem Platzhalterbefund habe ich **jeden** Punkt der
Bereitschaftsliste gegen seine eigene Messung gehalten — neun Punkte, eine
Datei, eine Frage je Punkt: *Sagt die Meldung mehr, als die Bedingung darüber
misst?*

Einer sagt mehr.

```
  ✗ Zahlungsanbieter gewählt und angebunden
```

Grün wird er, sobald in `data/betreiber.json` ein Name steht:

```js
zahlungsanbieter ? 'erfuellt' : 'offen',
zahlungsanbieter ? `angebunden: ${zahlungsanbieter}` : …
```

Gemessen ist eine **nichtleere Zeichenkette**. Behauptet ist, dass die Kasse
mit einem Anbieter spricht.

**Sie spricht mit keinem.** Im ganzen Shop gibt es keinen Zahlschritt: Der
Bestellweg aus Gate 26 erzeugt eine Anfrage, keinen Zahlungsvorgang. Das
einzige „EPS" in `shopkern.js` ist die Dämmplatte.

> **Ein Wort in einer Konfigurationsdatei ist eine Entscheidung, keine
> Anbindung.**

---

## Diese Liste hatte den Fehler schon einmal

Am 3. September: `npm run startklar` meldete mit vollständig beantworteter
Betreiberdatei „startklar", und vier Oberflächen lesen das als *„Bestellen ist
möglich"* — während im ganzen Shop nichts abgeschickt wurde. Kein `fetch`,
kein Formular, kein Beacon.

Behoben wurde er damals **für den Bestellweg**: Der Punkt misst seither den
Quelltext der Oberfläche, nicht die Konfigurationszeile. Der Zahlungspunkt
sechs Zeilen weiter blieb, wie er war.

> **Eine Lehre, die an einer Stelle gezogen wird, gilt nicht für die Stelle
> daneben — es sei denn, jemand geht die Stelle daneben durch.**

Heute ist der Punkt offen, weil kein Anbieter eingetragen ist. Der Fehler wäre
erst an dem Tag sichtbar geworden, an dem der Auftraggeber einen Namen
einträgt — und an dem Tag hätte die Liste ihm gesagt, die Kasse sei
angebunden.

---

## Was geändert ist, und was ausdrücklich nicht

Der Punkt heißt jetzt nach dem, was er misst — **„Zahlungsanbieter gewählt"** —
und nennt seine Grenze mit:

```
✓ Zahlungsanbieter gewählt
    gewählt: Anbieter X — aus data/betreiber.json; ob die Kasse mit ihm
    spricht, misst dieses Werkzeug nicht
```

**Nicht gebaut: eine Anbindungsprüfung.** Zwei Gründe, und beide sind
Entscheidungen, keine Bequemlichkeit:

1. Es gibt **kein Merkmal im Quelltext**, das eine echte Anbindung von ihrer
   Erwähnung unterscheidet. Beim Bestellweg gibt es eines — ein `fetch`, das
   abschickt oder nicht. Ein erfundenes Merkmal wäre wieder eine Behauptung
   mit Ziffern.
2. Die Kasse **soll heute keinen Zahlschritt haben.** Gate 21 nennt die
   **Vorkasse** gleichrangig, und die braucht keinen Anbieter, sondern ein
   Konto — das steht als eigener Punkt auf derselben Liste.

Ein Punkt, der seine Grenze nennt, ist ehrlicher als einer, der eine Grenze
erfindet, um grün aussehen zu dürfen.

### ⚠️ Was dabei aufgefallen ist — und am selben Tag widerrufen wurde

> **Berichtigt am 9. September, eine Runde später.** Der Absatz, der hier
> stand, war falsch. Er lautete: *„Ein Shop, der nur per Vorkasse verkauft,
> kann nach dieser Liste nie startklar werden — obwohl Gate 21 die Vorkasse
> ab Start zulässt."*
>
> Gate 21 hat nicht „die Vorkasse" zugelassen, sondern **EPS und Vorkasse ab
> Start** entschieden, Karte als Zusatz. Ein Start ohne EPS ist damit keine
> zulässige Sparfassung, sondern eine Abweichung vom Gate. **Der Punkt
> verlangt zu Recht einen Anbieter**, und es gibt nichts zu lockern.
>
> Warum ich es falsch notiert habe, steht in
> [`der-punkt-wusste-nicht-welche-zahlwege-es-gibt.md`](./der-punkt-wusste-nicht-welche-zahlwege-es-gibt.md):
> Der Punkt las eine freie Zeichenkette und nannte keinen Zahlweg; nachlesen
> ließ es sich nur im Gate-Register. Seither sagt er es selbst.

---

## Gehalten wird die Regel, nicht das Beispiel

Zwei neue Testfälle, der zweite ist die Regel: Solange es keinen Zahlschritt
gibt, darf das Wort **„angebunden" in keiner Meldung dieser Liste stehen** —
über alle Punkte, nicht über den einen.

**Gezeigt, dass sie anschlägt:** Mit dem alten Zustand wieder eingesetzt sind
**3 von 25** Testfällen rot — die beiden neuen und einer, der die Ausgabe des
Werkzeugs prüft; danach 25 grün.
