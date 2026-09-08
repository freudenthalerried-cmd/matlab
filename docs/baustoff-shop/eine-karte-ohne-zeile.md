# Eine Karte ohne Zeile

**8. September 2026.** `npm run pruefe-systemlisten` meldet seit Wochen für
jede Stückliste zwei Zahlen:

```
  5 von 8 lieferbar, 7 Artikel — kanal-dn100.md
```

Beide stimmen. Zwischen ihnen steht **nichts**: Welche der fünf lieferbaren
Positionen von welchem der sieben Artikel gedeckt wird, hat nie jemand
geprüft.

---

## Gemessen: die PAE-Folie

Die Kopfzeile von `kanal-dn100.md` führte `POS-29023 PAE-Folie T 100`. Die
Tabelle der Seite hat acht Zeilen — Kanalrohr, Bögen, Abzweiger, Schachtringe,
Übergangsstücke, Gleitmittel, Grundmauerschutzbahn, Abschlussschiene — und
**keine davon nennt eine Folie.**

Der Kunde sah sie trotzdem. Die Seite baut ihre Artikelkarten aus genau dieser
Kopfzeile:

```js
const skus = alsListe(seite.kopf.skus);
teile.push('<h2>Die Artikel dieser Liste</h2>');
```

> **Die Seite zeigte einen Artikel, den ihre eigene Liste nicht erklärt.**

Und der Bestand weiß es besser: `kundenwoerter.md` führt die Folie unter
**„estrichfolie"**, im Katalog steht sie in der Gruppe **Zubehör**. Wozu sie in
einer Grundleitung DN 100 gehört, steht nirgends — und es zu erfinden wäre die
Sorte Produktwissen, die dieses Verzeichnis sich verbietet. Sie ist deshalb aus
der Liste heraus, nicht in die Tabelle hinein.

---

## Was jetzt geprüft wird

`zuordnungsbefund` hält beide Richtungen — dieselbe Regel, die seit gestern die
Referenzwarenkörbe prüft, nur an der Stelle, die der Kunde sieht:

- **jede lieferbare Position** trägt den Namen eines Artikels der Liste,
- **jeder Artikel der Kopfzeile** hat eine Zeile, die ihn erklärt.

Verglichen wird über die Wortstämme der Shopsuche mit Teilwortdeckung, damit
„Kanalrohr" zu „PVC Kanalrohr NW 100" passt.

**Drei Wortlücken stehen mit Grund daneben**, weil Stückliste und Lieferant
dieselbe Sache verschieden benennen:

| Position | Artikel | warum |
|---|---|---|
| Oberputz | Capatect PrimaPor K20 **SH-Reibputz** | Ein Reibputz *ist* der Oberputz — die Liste nennt die Schicht, der Lieferant die Struktur |
| Armierungsmörtel | Capatect **Klebe- und Spachtelmasse** | Dieselbe Masse trägt zwei Schichten; die Liste führt beide Positionen, weil die Mengen sich unterscheiden |
| Bögen | PVC **Kanalbogen** 30°/45° | Mehrzahl mit Umlaut — eine Eigenheit der Stammbildung, keine Abweichung in der Sache |

**Eine Position mit eigener Einschränkung braucht keinen Artikel.**
„Dämmplatten *(nicht in Flächenstärke)*" sagt selbst, dass es den Artikel in
dieser Form nicht gibt; das Modul kennt diese Klammer seit dem 30. August und
zählt sie nun auch hier.

---

## Was der Gesamtlauf dazu sagte

Ein Testfall zählt seit dem 30. August, wie viele Artikel in mindestens einer
Systemliste stehen — als **Anker**, nicht als Rechnung: `assert.equal(mitVorschlag, 32)`.
Mit der Folie heraus sind es 31, und der Lauf ging rot.

Das ist der Zweck dieser Zahl. Sie steht dort, damit niemand eine Stückliste
ändert, ohne die Änderung ein zweites Mal zu bestätigen — und sie hat genau
das getan.

---

## Die Gegenprobe

Sie setzt `POS-29023` wieder in die Kopfzeile. Die Position dazu gibt es nicht,
und der Prüfer meldet rot — bevor die Karte gebaut wird.
