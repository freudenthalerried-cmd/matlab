# „Ansprechpartner vor Ort:" — und dann nichts

**1. September 2026, zweite Runde.** Die Frage, die ich mir am Ende der letzten
Stunde gestellt hatte: *Welches Kundendokument entsteht erst im Betrieb, und wer
liest es dann?* Übrig geblieben waren drei Kandidaten. Der erste davon ist gar
kein Kundendokument — es ist die **Bestellung an den Lieferanten**, und genau
deshalb hatte sie noch niemand angesehen.

Erzeugt, mit einer Lieferadresse ohne Telefonnummer:

```
Lieferadresse (Baustelle):
  Bau Muster GmbH
  Baustellenweg 7
  4600 Wels
  Ansprechpartner vor Ort:

Bitte neutral verpackt und ohne Preisangaben liefern.
…
Mit freundlichen Grüßen
```

Zwei Fehler in einem Blatt, beide vom selben Typ.

## Erstens: die leere Zeile ist keine Lücke, sondern eine Auskunft

`Ansprechpartner vor Ort:` mit nichts dahinter. Der Disponent des Lieferanten
liest das nicht als *fehlt noch*, sondern als *gibt es nicht* — und disponiert.
Der LKW fährt, findet eine verschlossene Baustelle, niemand nimmt an, und die
Ware geht retour. Die Rücklieferung zahlt der Besteller.

`beleg.js` hat diese Behandlung am 30. August bekommen: Was fehlt, wird zu
`[[ … — FEHLT ]]`. Der Anlass damals war `null Werktage` auf jedem Angebot.
`bestellung.js` hat sie nie bekommen.

> **Was der Kunde nicht sehen darf, darf der Lieferant erst recht nicht sehen.**
> Die Lückenmarkierung galt als Regel für Kundenbelege. Der Bestelltext ist
> derselbe Außentext, nur mit einem anderen Empfänger.

## Zweitens: der Brief endete nach „Mit freundlichen Grüßen"

Ohne `absender.firma` steht dort die Grußformel und darunter nichts. Eine
Bestellung ohne Absender ist beim Lieferanten keinem Kundenkonto zuordenbar —
im günstigen Fall bleibt sie liegen, im ungünstigen wird sie dem falschen
gebucht.

## Drittens: der Termin war zugesagt, aber nie bestellt

Die Auftragsbestätigung sagt dem Kunden „5 Werktage". Die Zahl stammt aus den
Stammdaten des Lieferanten. Die Bestellung an denselben Lieferanten nannte
**keinen Termin** und bat um **keine Bestätigung**.

> **Ein zugesagter Termin, den niemand bestellt hat, ist eine Hoffnung.**

Jetzt steht dort:

```
Gewünschte Lieferzeit: 5 Werktage ab heute. Bitte den Termin bestätigen — wir haben
ihn dem Endkunden gegenüber zugesagt.
```

## Was gesperrt ist

`darfAutomatischAusgeloestWerden` hatte fünf Sperren, und alle fünf schützten
**das Geld**: Zahlung eingegangen, Unternehmerstatus, UID, keine
Platzhalterpreise, Gate 20. Was fehlte, war der Schutz der **Zustellung**.
Dazugekommen sind: Name, Straße, PLZ, Ort, Telefon des Ansprechpartners,
Absenderfirma — jedes Feld einzeln gemeldet, nicht pauschal — und die bekannte
Lieferzeit.

Der Fixture-Auftrag in `test/gate20-freigabe.test.js` fiel dabei durch. Er hieß
„eine gesunde Bestellung passiert alle Sperren" und trug weder Lieferadresse
noch Absender. Er war nie gesund; es hatte ihn nur nie jemand danach gefragt.

Nebenbei: Die **CSV** kannte den Ansprechpartner überhaupt nicht. Die Textfassung
nannte ihn, die maschinelle nicht — und die maschinelle ist der Weg, den eine
Schnittstelle nimmt. `liefertelefon` ist jetzt eine Spalte.

## Die neue Regel im Prüfer

`npm run pruefe-belege` liest seit heute Vormittag die fertigen Außentexte.
Dazugekommen sind der Bestelltext als fünfter — und eine dritte Regel:

**Eine Beschriftung ohne Wert wird gemeldet.** Erkannt wird sie an der
Einrückung der nächsten Zeile mit Inhalt: `Lieferadresse (Baustelle):` ist eine
Blocküberschrift, ihr Wert steht eingerückt darunter; `Ansprechpartner vor Ort:`
mit einer Leerzeile danach ist eine Lücke. Festgemacht an der Form, nicht an
einer Liste erlaubter Beschriftungen, die niemand pflegt.

Der erste Lauf meldete prompt einen Fehlalarm: „…an den unten genannten
**Endkunden:**" — ein Satz, dessen Aufzählung erst nach einer Leerzeile
beginnt. **Ein Prüfer, der bei der ersten Leerzeile aufgibt, meldet die
Absatzgestaltung als Fehler.** Leerzeilen werden jetzt übersprungen.

Die Gegenprobe: alte Behandlung wiederhergestellt, Telefon aus dem Testauftrag
entfernt, Prüfer läuft — `Lieferantenbestellung:15 [leere-angabe]`, Rückgabewert
1. Danach zurückgestellt.

## Zwei Außentexte bleiben ungelesen

Der Vollständigkeit halber, damit die Liste nicht mit dieser Datei verschwindet:

- **Die Mailto-Adresse aus `kundenanfrage.js`.** Ihr Inhalt ist der geprüfte
  Anfragetext, aber die Adresse selbst — Länge, Kodierung, Empfänger — ist ein
  eigenes Gebilde. `MAILTO_HOECHSTLAENGE` gibt es, gelesen habe ich sie nicht.
- **Was ein Zahlungsanbieter eines Tages an den Kunden schickt.** Noch
  niemandes Text, und genau deshalb der Kandidat, an den keiner denkt.
