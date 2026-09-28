# „Ablage belegt."

*Lauf vom 15. September 2026. Fünfzehn Abweisungen des Empfangsskripts neu
geschrieben, ein Register mit Prüfer (`pruefe-abweisungen`, 66 ohne Browser),
eine Gegenprobe. Drei davon waren unsere Fehler und sahen aus wie seine.*

---

## Die Frage von gestern

Gestern haben die acht Eingabefelder einen Satz für den Kunden bekommen — die
**Frage**. Am Ende stand: *Was sagt das Formular, wenn die Eingabe falsch ist?*

Die Antwort lautete an fünfzehn Stellen ungefähr so:

```
Ablage belegt.
Kein lesbares JSON.
Nur POST.
Erwartet wird application/json.
Feld fehlt oder ist leer: unternehmerBestaetigt
Unerlaubtes Zeichen in: strasse
```

Das sind Sätze für den, der das Skript geschrieben hat. Der Besteller weiß
nicht, was eine Ablage ist, hat kein JSON abgeschickt, und das Feld kennt er
unter dem Namen „Ich bestelle für ein Unternehmen".

> **Eine Abweisung, die nur sagt, was schiefging, lässt den Kunden mit seinem
> Geld in der Hand stehen.**

## Der Teil, der wehtut

Drei der fünfzehn sind **unsere** Fehler: `Ablage nicht erreichbar.`,
`Ablage nicht beschreibbar.`, `Ablage belegt.` — HTTP 500, unser Journal, unser
Dateisystem, unser Problem. Vor den Besteller gestellt sahen sie aus wie seine.

Der Unterschied ist nicht sprachlich, sondern praktisch:

> **Wer glaubt, er sei schuld, versucht es anders. Wer weiß, dass es an uns
> liegt, ruft an.**

Der eine ändert seine Eingabe, bis er aufgibt, und wir erfahren nie davon. Der
andere greift zum Telefon, und wir haben die Bestellung. Alle drei lauten jetzt:

> *Ihre Bestellung konnte bei uns nicht gespeichert werden. Das liegt an uns und
> nicht an Ihrer Eingabe. Bitte versuchen Sie es in einigen Minuten noch einmal
> oder rufen Sie uns an.*

**Welcher der drei Fälle eingetreten ist, steht nicht mehr drin.** Das gehört
ins Protokoll des Servers; für den Besteller ist es dieselbe Lage.

## Der Feldname, den niemand kennt

`Feld fehlt oder ist leer: unternehmerBestaetigt` nennt das Feld so, wie der
Code es nennt. Auf dem Formular steht „Ich bestelle für ein Unternehmen".

Das Empfangsskript kannte bisher nur Name und Feldtyp — die Konfiguration, die
`npm run website` erzeugt, gab nicht mehr her. Sie führt seit heute auch die
**Beschriftungen**, aus derselben Quelle wie die Felder selbst. Damit lautet
die Abweisung:

> *Bitte ergänzen Sie noch: Ich bestelle für ein Unternehmen. Ohne diese
> Erklärung können wir keine Nettorechnung ausstellen.*

Fehlt eine Beschriftung, steht der technische Name da — schlechter als die
Beschriftung, besser als gar nichts.

## Das Register und was es misst

`bestellung.php` wird kopiert, nicht erzeugt; es kann kein Modul lesen. Der Weg
ist deshalb derselbe wie bei `src/absage.js`: Die Sätze stehen dort, wo sie
wirken, und `src/abweisung.js` hält sie **gegen den Quelltext**, in beide
Richtungen.

| Regel | was sie hält |
|---|---|
| `satz-ohne-stelle` | ein Eintrag, dessen Satz im Skript nicht mehr steht |
| `stelle-ohne-satz` | eine Abweisung im Skript, die kein Eintrag deckt |
| `abweisung-ohne-weiter` | kein nächster Schritt |
| `eigener-fehler-verschwiegen` | unser Fehler, und der Satz sagt es nicht |
| `abweisung-aus-der-werkstatt` | JSON, POST, `application/`, Ablage, Parameter, Token |
| `abweisung-mit-interna` | dieselbe Sperre wie jeder Text an den Kunden |

`stelle-ohne-satz` ist die wichtigste: Ohne sie schriebe morgen jemand eine
neue Abweisung hin, und sie stünde wieder in der Sprache dessen, der sie
geschrieben hat.

Die **Werkstattwörter** sind eine eigene Liste und ausdrücklich nicht
`src/interna.js`. Die dortigen Wörter sind *geheim* — Gate-Nummern, Margen.
Diese hier sind *unverständlich*. Ein Besteller, der „application/json" liest,
erfährt nur, dass er hier nicht gemeint ist.

## Was der Prüfer im ersten Lauf an sich selbst fand

Er meldete den Satz über die fehlgeschlagene Ablage als „steht in keiner
Abweisung" — und er stand dort, nur über drei Zeilen verteilt:

```php
'Ihre Bestellung konnte bei uns nicht gespeichert werden. Das liegt an uns '
    . 'und nicht an Ihrer Eingabe. Bitte …'
```

> **Ein Satz, den der Setzer umbricht, ist derselbe Satz.**

Ein Prüfer, der das nicht weiß, zwingt den Quelltext in eine Zeilenlänge, die
er nicht hat — und wird bei der ersten langen Meldung abgeschaltet. `zusammengesetzt()`
fügt die Teile vor dem Vergleich zusammen.

Der zweite Fund war kein Fehler, sondern eine Auslassung: „Diese Bestellung
liegt bereits vor. Ihre Nummer bleibt …" ist **keine** Abweisung — sie kommt
mit `ok => true`. Sie steht trotzdem im Register: Sie geht an denselben Leser,
und für ihn ist „liegt schon vor" eine Auskunft über seinen Vorgang wie jede
andere.

## Was die vorhandenen Prüfer dazu beigetragen haben

**`test/bestellungphp.test.js` ist dreimal rot geworden** — die Probe fährt den
ganzen Weg über einen echten PHP-Server und hatte die alten Texte
festgeschrieben. Das ist richtig so: Wer den Satz an den Kunden ändert, soll
einen Testfall anfassen müssen. Die drei Erwartungen sind nachgezogen, und zwei
davon prüfen seither **mehr** als vorher: dass die Abweisung die Beschriftung
nennt und nicht den Feldnamen, und dass der eigene Fehler sich dazu bekennt.

**`pruefe-zwillinge` hat den Statuscode 403 gemeldet** — er steht jetzt in drei
Dateien. Eingetragen mit Grund: Ein Statuscode ist ein Name aus Ziffern, er
kommt aus RFC 9110 und wandert nie, weil sich hier etwas ändert. Eine
gemeinsame Konstante verbände drei Stellen, die nichts miteinander zu tun
haben.

## Was dieser Lauf nicht erreicht hat

- **Sichtbar ist davon heute nichts.** Gate 26: Der Bestellweg ist gebaut und
  ausgeschaltet, `bestellung.php` wird gar nicht erst mitgeliefert. Die
  fünfzehn Sätze wirken am Tag, an dem eingeschaltet wird — und an dem Tag wird
  eingeschaltet und nicht formuliert.
- **Ob die Sätze verständlich sind**, misst kein Prüfer. Er misst Länge,
  nächsten Schritt, Werkstattwörter und Internes. Ob ein Satz den Leser
  erreicht, entscheidet niemand hier.
- **Die Absagegründe nach der Annahme** (`src/absage.js`) sind unberührt. Sie
  sind seit dem 8. September in der Sprache des Kunden geschrieben — geprüft ist
  jetzt aber nur der Weg **vor** der Annahme.
- **Ein Gate-Hinweis im internen Grund** steht weiter in `pruefeBestelldaten`:
  *„Bestätigung fehlt … (Gate 7)"*. Er geht durch `ABSAGEGRUENDE` und wird
  übersetzt, bevor ihn jemand liest — gemessen, nicht angenommen. Er bleibt
  trotzdem ein Fremdkörper in einem Text, der einen Übersetzer braucht.

## Die Frage für den nächsten Lauf

Was passiert mit einer Bestellung, die **angenommen** wurde und dann scheitert?
Die Absage danach ist geschrieben und geprüft. Aber zwischen „Angekommen, Ihre
Nummer: B-2026-0001" und der Absage liegen Tage, in denen der Besteller nichts
hört — und der Shop sagt ihm bis heute nicht, wie lange das dauern darf. Die
Zahl fehlt seit dem 10. September auf dem Zettel für den Auftraggeber.
