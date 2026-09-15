# Das Dokument, auf das hin der Kunde zahlt, sagte ihm nicht, wohin

*4. September 2026, spät. Runde 118.*

## Der Fund

Gate 21 hat am 26. August entschieden: **Vorkasse und EPS ab Start,
Kundenzahlungsziel null Tage.** Die Auftragsbestätigung trägt diesen
Beschluss seither wörtlich:

> Zahlbar sofort, ohne Zahlungsziel (Punkt 9 der Geschäftsbedingungen). Die
> Bestellungen bei den Herstellern lösen wir nach Zahlungseingang aus; die
> Lieferzeiten unten laufen ab diesem Zeitpunkt.

Eine Zeile darüber steht in `src/beleg.js` ein Kommentar, der genau sagt,
warum dieser Satz dort steht:

> *Sie ist damit das Dokument, auf das hin der Kunde zahlt — und der einzige
> Ort, an dem stehen kann, dass bis dahin nichts bestellt wird. Ohne den Satz
> wartet der Kunde auf Ware und der Shop auf Geld.*

Der Satz ist da. **Die Kontonummer nicht.**

Damit tritt genau der Schaden ein, den der Kommentar beschreibt — nur eine
Stufe später: Der Kunde liest, dass er sofort zahlen soll, und findet auf dem
Papier keinen Weg, es zu tun. Er wartet auf Ware, der Shop wartet auf Geld,
und die Bestellung beim Lieferanten wartet auf beides.

## Warum es niemandem aufgefallen ist

`zahlungsvermerk` in `beleg.js` **kennt** die Bankverbindung. Sie steht dort
seit dem 1. September als ausdrückliche Lücke — „Bankverbindung des
Ausstellers" — aber nur im Zweig für eine **offene Rechnung mit
Zahlungsziel**. Gate 21 hat dieses Zahlungsziel auf null gesetzt; der Zweig
ist seither unerreichbar. Im Vorkassezweig, dem einzigen, der heute gilt,
wurde sie nie verlangt.

> **Eine Prüfung, die nur im ungenutzten Fall greift, ist keine Prüfung.**
> Das ist dieselbe Familie wie „eine Prüfung, die nur im gelungenen Fall
> läuft" — nur dass hier nicht der Erfolg, sondern ein Gate den Zweig
> abgeschaltet hat, in dem der Wächter saß.

Und die Bereitschaftsliste half nicht: `startklar()` führte den
**Zahlungsanbieter**, und der ist als Ausgabe dem Auftraggeber vorbehalten.
Solange der Punkt offen ist, sieht alles Übrige nach „wartet ohnehin auf den
Anbieter" aus. Das stimmt nur für den halben Beschluss.

## Der zweite Teil des Fundes: eine Begründung, die zu breit war

In `src/betriebskette.js` — der Landkarte von gestern Abend — stand beim
Schritt „Der Kunde zahlt":

> *Der Zahlungseingang entsteht beim Zahlungsanbieter, und der ist nicht
> gewählt — eine Ausgabe und damit Sache des Auftraggebers.*

Das gilt für EPS und für die Karte. Für die **Überweisung** gilt es nicht.

> **Vorkasse braucht keinen Zahlungsanbieter. Sie braucht ein Konto.**

Der Shop könnte am ersten Tag Geld annehmen, ohne einen Cent Gebühr und ohne
eine einzige Entscheidung, die Geld kostet. Was fehlt, ist eine
**Dateneingabe** — zwei Zeilen in `data/betreiber.json`. Ein Grund, der zu
breit ist, verdeckt genau den Weg, der ab Start offensteht; die Begründung
ist berichtigt und nennt jetzt beide Wege getrennt.

## Was gebaut wurde

**`src/bankverbindung.js`** — zwei Felder mit Pflichtbegründung, eine
Prüfsummenrechnung und die Zeilen fürs Papier.

* `ibanPruefsummeStimmt` rechnet nach ISO 13616 / Modulo 97-10, Ziffer für
  Ziffer, weil die Zahl sonst jede Ganzzahl sprengt. Dieselbe Sorte Prüfung
  wie bei der UID und aus demselben Grund: **Eine IBAN mit Zahlendreher sieht
  aus wie eine IBAN.** Der Kunde überweist, das Geld kommt nicht an, und
  gemerkt wird der Fehler, wenn die Ware ausbleibt. *Anwesend ist nicht
  dasselbe wie richtig.*
* `BANKFELDER` führt **Kontoinhaber** und **IBAN**. Der Kontoinhaber steht
  dabei, weil er vom Firmenwortlaut abweichen kann — bei einer Einzelfirma
  regelmäßig — und die Bank des Kunden sonst zurückweist.
* Der **BIC fehlt mit Absicht.** Im SEPA-Raum genügt die IBAN seit 2016
  („IBAN only"), und eine Angabe, die niemand braucht, ist eine Angabe, die
  niemand pflegt. Eine Probe hält die Absicht fest, damit sie nicht
  irgendwann „zur Sicherheit" wieder dazukommt.
* Jedes Feld trägt ein **Beispiel**. Daraus bauen die Proben in
  `startklar.test.js`, `bestellweg.test.js` und `website.test.js` ihre
  vollständige Lage — dieselbe Bauart wie bei `FORMREGELN`: Ein neues Bankfeld
  bringt seine eigene gültige Angabe mit, statt vier Proben still rot zu
  färben.

**Auf der Auftragsbestätigung** stehen die Zeilen jetzt unmittelbar unter dem
Zahlungssatz. Ohne Konto steht dort keine Leere, sondern die sichtbare Lücke:

```
Zahlbar sofort, ohne Zahlungsziel (Punkt 9 der Geschäftsbedingungen). Die
Bestellungen bei den Herstellern lösen wir nach Zahlungseingang aus; die
Lieferzeiten unten laufen ab diesem Zeitpunkt.

Bitte überweisen Sie auf:
  [[ Kontoinhaber und IBAN — FEHLT ]]
  Verwendungszweck: AB-2026-0007
```

und mit Konto:

```
Bitte überweisen Sie auf:
  Musterfirma GmbH
  IBAN AT611904300234573201
  Verwendungszweck: AB-2026-0007
```

Der **Verwendungszweck ist die Vorgangsnummer**. Ohne ihn ist ein Eingang auf
dem Kontoauszug keiner Bestellung zuzuordnen, und die Lieferantenbestellung
wartet auf ein Geld, das längst da ist.

**In der Bereitschaftsliste** steht der Punkt seit heute als eigener Eintrag —
neben dem Zahlungsanbieter und nicht in ihm, weil der eine Geld kostet und der
andere eine Dateneingabe ist:

```
✗ Die Bankverbindung steht auf der Auftragsbestätigung
    es fehlen kontoinhaber, iban — ohne Konto kann kein Kunde per Vorkasse
    zahlen, und Gate 21 hat Vorkasse ab Start entschieden  ·  Auftraggeber
```

Die Kasse nennt ihn dem Kunden mit denselben Worten wie die übrigen offenen
Punkte: *ein Konto, auf das gezahlt werden kann.*

## Die Gegenprobe

`iban-ungeprueft` nimmt die Prüfsummenrechnung aus `BANKFELDER` heraus und
setzt an ihre Stelle eine reine Anwesenheitsprüfung — genau den Zustand, den
eine gut gemeinte Vereinfachung herstellen würde. Der Testlauf muss rot
werden und die IBAN nennen:

```
✓ test — Eine IBAN mit Zahlendreher, die dasteht und angenommen wird
    shop/src/bankverbindung.js (ersetzen)
    meldete rot an der erwarteten Stelle
```

Damit sind es **48 Gegenproben für 30 Prüfer**, zwei weitere mit begründetem
Verzicht.

## Was daraus für den Auftraggeber folgt

Ein neuer Eintrag auf der Liste der Zulieferungen — und der **billigste**
darauf:

| Angabe | wohin | was sie freischaltet |
|---|---|---|
| Kontoinhaber | `data/betreiber.json` | die Zeile auf der Auftragsbestätigung |
| IBAN | `data/betreiber.json` | die Zahlung per Überweisung, ohne Anbieter und ohne Gebühr |

Das ist **keine Ausgabe**. Es ist die einzige der offenen Zulieferungen, die
den Shop einen Schritt weiterbringt, ohne dass irgendwo Geld fließt oder eine
Entscheidung fällt, die Geld kostet. Der Zahlungsanbieter für EPS und Karte
bleibt davon unberührt — er steht weiter auf der Liste und bleibt eine
Ausgabe.

## Die Lehre

> **Ein Beschluss, der nur zur Hälfte gelesen wird, sieht aus wie ein
> Beschluss, der ganz umgesetzt ist.** Gate 21 nennt zwei Zahlwege. Der eine
> hängt an einer Ausgabe, der andere an zwei Zeilen Text. Solange beide unter
> derselben Überschrift „Zahlung" standen, hat der teurere den billigeren
> gedeckt — und der billigere war der, der ab Start offensteht.
