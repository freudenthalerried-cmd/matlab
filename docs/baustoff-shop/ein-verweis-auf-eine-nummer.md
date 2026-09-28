# Ein Verweis auf eine Nummer ist eine Verabredung mit einer Reihenfolge

**2. September 2026, spät.** Zwei Sätze auf den Kundenbelegen:

> Wir nehmen Ihre Bestellung hiermit an. Mit dieser Bestätigung kommt der
> Vertrag zustande (**Punkt 2** unserer Allgemeinen Geschäftsbedingungen).

> Zahlungsbedingung: Zahlung bei Bestellung, kein Zahlungsziel (**Punkt 9** der
> Geschäftsbedingungen).

Beide stimmen. Punkt 2 der Gliederung heißt „Vertragsschluss", Punkt 9
„Zahlung, Verzug, Eigentumsvorbehalt". Und beide hängen an einer **Zählung,
die niemand bewacht.**

Die AGB stehen als Gliederung aus dreizehn Punkten im Bau; der verbindliche
Wortlaut kommt vom Rechtstexteanbieter und ist ein offener Punkt. Wer bis dahin
— oder danach — einen Punkt einschiebt, verschiebt jede Nummer dahinter. Aus
„Punkt 9, Zahlung" wird „Punkt 9, Gefahrübergang", und der Beleg beim Kunden
zitiert eine Klausel, die etwas anderes regelt.

**Das fällt nicht auf.** Die Gliederung bleibt richtig. Der Beleg bleibt
lesbar. Nur der Verweis zeigt woanders hin.

> **Ein Verweis auf eine Nummer ist eine Verabredung mit einer Reihenfolge.**

Dieselbe Bauart wie der Anker im HTML, an dem der Preisabgleich hing — er
trennte an `<a class="karte"`, die Kachel wurde ein `div`, und der Prüfer fand
nichts mehr. Wer die Reihenfolge ändert, ändert die Verabredung mit.

## Was jetzt gemessen wird

`AGB_VERWEISE` führt jede Nummer, auf die ein Außentext zeigt — heute zwei,
jede mit ihrem Zweck und einem Wort, das im Titel des Punktes vorkommen muss.

`pruefeAgbVerweise` prüft **drei Richtungen**:

| | |
|---|---|
| Ein Beleg zitiert einen Punkt, den das Register nicht führt | dann hält ihn niemand gegen die Gliederung |
| Ein geführter Punkt fehlt oder heißt anders | dann zeigt der Kundenbeleg auf eine fremde Klausel |
| Ein geführter Punkt wird in keinem Beleg mehr zitiert | dann ist der Eintrag stehengeblieben und bewacht nichts |

Die dritte gilt **nur beim vollständigen Durchlauf**. Über einer Teilmenge der
Belege sagt das Fehlen nichts, und ein Prüfer, der bei jedem Ausschnitt rot
wird, wird abgeschaltet. Der Prüflauf ruft `pruefeBelege` deshalb mit
`vollstaendig: true`; die Proben, die zwei Belege prüfen, ohne.

## Warum ein Wort und nicht der Titel

`erwartetImTitel: 'Zahlung'`, nicht `'Zahlung, Verzug, Eigentumsvorbehalt'`.
Eine Kopie des Titels prüfte nur, dass zwei Zeichenketten gleich sind — und
wäre bei jeder Umformulierung rot, ohne dass etwas kaputt ist. Bei „Punkt 2,
Vertragsschluss" ist das Wort zufällig der ganze Titel; das ist in Ordnung,
weil geprüft wird, ob die **Zuordnung** hält, nicht wie lang sie ist.

## Der Nachweis

Fünf Proben, und die tragende ist die auf den verschobenen Bestand: Sie zählt
jeden Punkt ab 3 um eins hoch und erwartet, dass der Verweis auf Punkt 9
gemeldet wird. Dazu die Gegenprobe `agb-punkt-verschoben`, die den Titel von
Punkt 9 im Quelltext auf „Gewährleistung und Haftung" setzt.

## Stand

| | |
|---|---|
| Punkte der AGB-Gliederung | 13 |
| Verweise aus Außentexten | 2, beide geführt |
| übergreifende Regeln in `pruefeBelege` | 2 (Kranentladung, AGB-Verweise) |
| Tests | 1267 |
| Gegenproben, die anschlagen | 24 von 24 |

Was das nicht ist: eine Prüfung des **Inhalts** der Klauseln. Ob Punkt 9 das
Zahlungsziel wirksam ausschließt, entscheidet der Rechtstexteanbieter. Geprüft
ist, dass der Beleg auf die Klausel zeigt, die er meint.
