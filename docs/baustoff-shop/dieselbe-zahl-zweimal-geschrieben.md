# Dieselbe Zahl, zweimal geschrieben

**12. September 2026. Runde 39.**

## Der Satz, der zu viel sagte

Im Kopf von `src/speicher.js` stand seit dem 31. August:

> *Eine Datei, an die nur angehängt wird, kennt kein Ändern und kein Löschen;
> genau deshalb ist sie der richtige Speicherort.*

Die Datei kennt gar nichts. **Angehängt wird nur, weil der Schreiber es so
tut.** Ein Texteditor ändert jede Zeile, und die Betriebskette sagt über
diesen Schritt: *„§ 131 BAO — nur ergänzen, nie ändern."*

Was die Form wirklich leistet, ist eng und lässt sich benennen:

| | |
| --- | --- |
| Zeile **gelöscht** | fällt auf — `lfd` muss lückenlos aufsteigen |
| Zeilen **vertauscht** | fällt auf — dieselbe Prüfung |
| Zeile **geändert** | fiel **nicht** auf |

> **Wer im Texteditor aus 911,06 die Zahl 91,06 macht, bekam ein Journal, das
> sauber zurückliest.** Die Form wächst weiter nur; der Inhalt war
> ungeschützt.

Das ist kein theoretischer Fall. Die Zahl in der Journalzeile ist die
Bemessungsgrundlage der Umsatzsteuervoranmeldung, und ein Zahlendreher in
einer Datei, die niemand mehr ansieht, ist die stillste Art, eine
Steuererklärung falsch zu machen.

## Was dagegen steht — und was nicht

Seit der Runde davor gibt es die **Durchschrift**: das Papier, das hinausging,
neben der Zeile über es. Damit steht jede dieser Angaben **zweimal**, und
dagegen prüft seit heute `npm run pruefe-ablage`:

- `betrag-weicht-ab` — der Bruttobetrag der Journalzeile steht nicht auf dem
  Papier.
- `zeitpunkt-weicht-ab` — der Zeitpunkt weicht ab (§ 131 Abs 1 Z 2 BAO
  verlangt die Zeitfolge, und sie stünde hier zweimal verschieden da).
- `nummer-weicht-ab` — die Belegnummer auf dem Papier ist eine andere als die
  in der Zeile. Das ist die **andere Richtung**: Nicht das Journal wurde
  geändert, sondern der Beleg.

Gemeldet wird **ohne den Inhalt**. Ein Prüfer, der den Betrag oder den Namen
in sein Protokoll schreibt, verlegt Kundendaten an einen dritten Ort — dieselbe
Regel, aus der das Journal nur den Betreff und nicht den Belegtext trägt.

**Was das nicht ist, und das gehört dazu:**

> **Keine Fälschungssicherheit.** Wer beide Dateien gleichlautend ändert,
> kommt durch. Dagegen hülfe nur ein Anker außerhalb dieses Rechners — eine
> Signatur mit einem Schlüssel, den der Rechner nicht hat, oder ein Abdruck an
> einem Ort, an den er nicht schreiben kann. Beides ist heute nicht da und
> steht hier als benannte Grenze, nicht als Versäumnis.

Was hier gesichert ist, ist die **einseitige** Änderung — und das ist der
Fall, der vorkommt: die Korrektur „von Hand", die niemand böse meint und die
nach § 131 Abs 1 Z 6 BAO trotzdem den ursprünglichen Inhalt verdeckt.

Der zu weit gehende Satz ist an seiner Stelle berichtigt worden, nicht
irgendwo nachgetragen. Eine Zusicherung, die man an einer zweiten Stelle
relativiert, gilt weiter für den, der nur die erste liest.

## Ausgang

| | |
| --- | --- |
| geänderte Journalzeile | unbemerkt → **drei Regeln, beide Richtungen** |
| Aussage über die Form | „kennt kein Ändern" → **was sie kann, aufgezählt** |
| Testfälle | 2.377 |
| Gegenproben | 208 → **209** |

Der Abgleich liest dafür den **Inhalt** der Durchschriften, nicht mehr nur
ihre Namen. Fehlt der Text (eine reine Dateiliste), prüft er weiter, was er
prüfen kann, statt eine Abweichung zu behaupten.

---

**Die Regel dieser Runde:** *Wenn eine Eigenschaft nicht aus der Sache folgt,
sondern aus der Disziplin dessen, der sie benutzt, dann ist sie keine
Eigenschaft, sondern eine Hoffnung — und gehört gemessen.*
