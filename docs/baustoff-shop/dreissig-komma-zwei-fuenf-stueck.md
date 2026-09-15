# „30.25" stand in der Kopfleiste

Stand: 2026-08-29

## Der Anlass

Der vorige Lauf hat die Mengenregel im Rechenkern geändert: Gebindemengen mit
zwei Nachkommastellen sind zugelassen, weil ganze Quadratmeter bei einer
Platte zu 0,75 m² nicht lieferbar sind. Danach die Pflichtfrage: **Was hat
sonst noch angenommen, dass Mengen ganze Zahlen sind?**

Zwei Stellen, beide sichtbar für den Kunden, beide gefunden durch Nachsehen
statt durch einen Fehlerbericht.

## Erstens: der Korbzähler

```
Zähler in der Kopfleiste:  30.25
```

`korbAnzahl` summierte alle Mengen. Bei 5,25 m² Dämmplatte und 25 kg
Putzgrund kommt 30,25 heraus — und diese Zahl stand in der Kopfleiste, mit
Dezimalpunkt.

Der Fehler ist älter als die gestrige Änderung: **Eine Summe über Stück,
Quadratmeter und Kilogramm ist keine Menge.** Sie war nur bis gestern
unauffällig, weil alle Summanden ganze Zahlen waren und „7" wie eine
Stückzahl aussah. Die Gebindemengen haben nichts kaputtgemacht; sie haben
sichtbar gemacht, was schon nicht stimmte.

`korbAnzahl` ist ersatzlos weg. An seine Stelle tritt `korbPositionen` —
die Zahl der Zeilen im Korb, und das ist auch die Zahl, die ein Zähler in
einer Kopfleiste zeigen darf. Ebenso gestrichen: das Feld `stueck` aus
`kundenWarenkorb()`, das dieselbe Summe trug. Die Kasse nennt jetzt
„2 Positionen · verschiedene Artikel".

## Zweitens: der Anfragetext

```
5.25 M2     XPS glatt SF 30 mm 0,75 m2     POS-12569   5,23 €   27,46 €
```

Der Punkt kommt aus JavaScript, das `M2` aus dem Katalog. Beides steht in
einem Text, den ein Kunde in eine Mail kopiert. **Ein Text, der an einen
Kunden geht, schreibt nicht in Datenbankschreibweise.**

Jetzt:

```
5,25 m²       XPS glatt SF 30 mm 0,75 m2   POS-12569   5,23 €   27,46 €
25 kg         Capatect Putzgrund weiß 25 kg POS-13728  2,77 €   69,25 €
```

Die lesbare Einheit kommt aus derselben Tabelle wie auf den Seiten und wird
`baueKundenanfrage()` übergeben. Fehlt sie, bleibt das Kürzel stehen — lieber
`M2` als gar keine Einheit. Auch dafür gibt es einen Test.

## Ein Szenario, das schwächer geworden wäre

Die Shopprobe prüfte seit Wochen:

```js
document.getElementById('menge-POS-12566').value = '4';
document.querySelector('[data-legen="POS-12566"]').click();
out = 'Zaehler:' + document.querySelector('[data-korbzaehler]').textContent;
erwartet: ['Zaehler:4']
```

Mit dem neuen Zähler steht dort „1". Die bequeme Änderung wäre gewesen,
`Zaehler:1` zu erwarten — und damit hätte das Szenario **weniger** geprüft
als vorher: Es hätte nicht mehr gezeigt, dass die eingetippte Menge 4
überhaupt ankommt.

Es prüft jetzt beides: den Zähler *und* die Menge im Korb *und* die
Zeilensumme (7,72 €). Eine Probe, die bei einer Änderung angepasst wird, muss
danach mindestens so scharf sein wie vorher — sonst ist die Anpassung eine
stille Abschwächung.

## Geprüft

820 Testfälle, 45 Browserszenarien. Neu darunter zwei Szenarien für den
Zähler und den Anfragetext, dazu zwei Testfälle für Komma und Einheit.

| Gegenprobe | Ergebnis |
| --- | --- |
| Zähler summiert wieder die Mengen | 2 Szenarien fallen |
| Einheitentabelle nicht übergeben | 1 Szenario fällt |

## Notiert

Fehlerklasse: **eine Zahl, die etwas anderes sagt, als sie meint** — und die
Beobachtung, dass eine solche Zahl oft erst durch eine unabhängige Änderung
auffällt. Der Zähler war seit dem ersten Warenkorb falsch. Gemerkt hat es
niemand, solange alle Mengen ganze Zahlen waren.

Deshalb gehört zu jeder Änderung an einer Kernregel die Frage, wer sonst noch
von ihr ausging. Beide Funde dieses Laufs stammen aus dieser Frage, nicht aus
einem Fehlerbericht.
