# Sieben Zeilen, die nichts kosten

**10. September 2026**

`npm run punkte` führt an diesem Tag **25 offene Punkte in vier Gruppen**, und
**kein einziger davon liegt bei mir.** Fünf stehen unter *„Liegt vor, fehlt nur
in der Datei"* — sie kosten nichts, brauchen keine Freigabe, keinen Vertrag und
keinen Dritten. Mit der Bankverbindung sind es **sieben Angaben**.

Diese sieben verteilen sich über vier Werkzeugausgaben. Wer sie liefern soll,
müsste alle vier lesen und daraus die Felder heraussuchen.

> **Eine Zulieferung, die man sich zusammensuchen muss, wird nicht geliefert.**

---

## Der Zettel

`npm run zettel` legt sie nebeneinander — je Zeile das Feld, die Form, die
Fundstelle und der Satz, **wofür**:

```
  IBAN
      Feld       "iban": ""
      Form       AT611904300234573201  (wird nachgerechnet)
      Grundlage  keine Vorschrift — ohne sie kann niemand überweisen
      Wofür      Vorkasse braucht keinen Zahlungsanbieter, sondern ein Konto:
                 keine Gebühr, kein Vertrag, keine zehn Tage
                 Legitimationsprüfung. Es ist der einzige Weg, auf dem der
                 Shop am ersten Tag Geld annehmen kann.
```

**Form und Beispiel stehen nicht auf dem Zettel**, sondern in den Registern,
die sie prüfen — `betreiberform.js` und `bankverbindung.js`. Zweimal
geschrieben hieße: einmal gepflegt.

**Und der Zettel wird gegen die Datei gehalten, in beide Richtungen.** Ein
leeres Feld, das nichts kostet und auf keiner Zeile steht, ist ein Befund; eine
Zeile, deren Feld längst ausgefüllt ist, ebenso. Wer den Zettel aufschlägt und
als Erstes nach etwas gefragt wird, das er vor drei Wochen eingetragen hat,
liest die übrigen sechs Zeilen nicht mehr.

---

## Was der Zettel beim ersten Lauf gefunden hat

Er holte Form und Beispiel aus den Registern, und bei **zwei von sieben** kam
nichts zurück:

| Feld | Zustand |
|---|---|
| `gewerbewortlaut` | Pflichtangabe nach § 5 ECG, auf jeder Liste — **keine Formregel** |
| `antwortzeitWerktage` | geht als Zusage an den Kunden — **keine Formregel** |

Beide sind jetzt geprüft: Der Gewerbewortlaut muss mehr als ein Wort sein und
darf kein Platzhalter sein (`TODO`, `Gewerbe`); die Antwortzeit muss eine ganze
Zahl zwischen 1 und 10 sein.

---

## Und die neue Regel konnte gar nicht feuern

Beim Nachmessen zeigte sich, dass `pruefeBetreiberform` so aussortiert:

```js
if (typeof wert !== 'string' || wert.trim() === '') continue;
```

**Jede Zahl wurde übersprungen** — und `antwortzeitWerktage` trägt eine Zahl.
Gemessen:

```
2   → durchgelassen      "2"    → durchgelassen
0   → durchgelassen      "0"    → Mangel gemeldet
99  → durchgelassen      "zwei" → Mangel gemeldet
```

Eine Zusage von **null** oder **neunundneunzig** Werktagen wäre auf die
Kundenseite gegangen, ohne dass ein Prüfer hinsieht — während dieselbe Null in
Anführungszeichen gemeldet worden wäre.

> **Eine Prüfung, die nur für einen Typ greift, ist für den anderen keine.**

Derselbe Satz wie beim Zahlungsvermerk am 4. September, der die Bankverbindung
nur im Zweig für eine offene Rechnung mit Zahlungsziel prüfte — und den hatte
Gate 21 mit null Tagen unerreichbar gemacht. *Eine Prüfung, die nur im
ungenutzten Fall greift, ist keine.*

Übersprungen wird seither nur das **Leere**. Das ist kein Formfehler, sondern
ein offener Punkt, und den führt `startklar`.

---

## Was der Zettel nicht ist

Er ist **keine Aufforderung** und geht an niemanden hinaus. Er füllt nichts
aus, verschickt nichts und entscheidet nichts — er liegt im Verzeichnis und
wartet.

Und er ist **nicht die Liste der offenen Punkte**. Die ist länger und enthält,
was Geld kostet: Zahlungsanbieter, Rechtstexte, GTIN, das Hochladen. Dieser
Zettel enthält ausschließlich, was eine Minute dauert — und genau deshalb ist
er kurz genug, um in einer Minute erledigt zu werden.

Was er freigäbe, wenn er ausgefüllt wäre: den **Bestellweg** (die E-Mail-Adresse
ist eine seiner beiden Voraussetzungen), das **Impressum** (alle vier fehlenden
Angaben stehen darauf), die **Vorkasse** nach Gate 21 — und damit den einzigen
Weg, auf dem der Shop am ersten Tag Geld annehmen kann.

---

## Nachtrag: Der Abgleich hat zum ersten Mal gerechnet

Beim Veröffentlichen dieser Runde ist zum fünften Mal ein Absatz dazugekommen,
den die Quelle nicht kannte — diesmal die Einleitung zu „Was fehlt", die auf
den neuen Zettel hinweist.

**Gefunden hat es kein Auge, sondern `npm run abgleich-veroeffentlichung`:**

```
✗ Die Fassung trägt Text, den ihre eigene Marke nicht deckt
✗ Sie weicht von der Ausgabe von `npm run pr-text` ab
    erste Abweichung in Zeile 154, Zeichen 33399
    veröffentlicht: …"**Sieben davon kosten nichts** und stehe"
    Quelle        : …"- **Das Repository ist öffentlich — seit"
    Länge: 39596 veröffentlicht, 39297 in der Quelle
```

Zeilennummer, Zeichenposition, beide Textstellen nebeneinander. Vier Runden
lang war derselbe Fehler eine Sache des Hinsehens; das Werkzeug ist zwei Runden
alt und hat beim ersten Ernstfall geliefert.

Berichtigt wurde die Quelle — der Absatz war gut und gehört hinein. Danach
blieb genau **eine** Abweichung stehen: die Markenzeile selbst, weil sie den
geänderten Text deckt. Auch das zeigte das Werkzeug auf das Zeichen genau, und
eine zweite Veröffentlichung hat sie geschlossen.

> **Zwei Veröffentlichungen für einen Absatz.** Der Preis eines
> Übertragungsfehlers ist damit sichtbar — und das ist richtig so.
