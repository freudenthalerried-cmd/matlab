# Verrechnet und nicht bestellt

**2. September 2026, abends.** Weiter mit der Methode vom Nachmittag: das
Papier lesen, das den Shop verlässt — diesmal nicht den Anfragetext, sondern
die **Bestellung an den Lieferanten**.

Der Warenkorb dieses Durchlaufs enthält zwei palettierte Positionen. Das
Angebot an den Kunden weist aus:

```
Fracht Poschacher Baustoffhandel: 90,50 € (Pauschale plus 2× Kranentladung)
```

75,50 € Pauschale plus zweimal 7,50 € für die Kranentladung. Die Bestellung an
den Lieferanten lautete:

```
Bitte neutral verpackt und ohne Preisangaben liefern.
Rechnung an den Auftraggeber laut hinterlegten Stammdaten.
```

Kein Wort vom Kran.

> **Verrechnet und nicht bestellt ist eine Rechnung über nichts.**

Der Lastwagen wäre ohne Kran gekommen, die Paletten wären auf der Ladefläche
geblieben, und der Kunde hätte fünfzehn Euro für zwei Hübe bezahlt, die
niemand bestellt hat.

Dieselbe Familie wie der Liefertermin, der bis zum 1. September nur auf der
Auftragsbestätigung stand und beim Lieferanten nie angefordert wurde. Der
Unterschied ist die Richtung des Schadens: Ein Termin, den niemand bestellt
hat, ist eine Hoffnung. Eine Leistung, die niemand bestellt hat, ist bezahlt
und kommt nicht.

## Warum das kein Prüfer gesehen hat

Weil jeder Beleg **für sich** in Ordnung war. Das Angebot nennt seine
Frachtbestandteile, die Bestellung nennt Ware, Adresse und Termin. `pruefe-belege`
liest fünf Belege und prüft jeden einzeln: Endsumme mit Zustandsaussage, keine
leeren Beschriftungen, keine widerrufene Aussage. Alle fünf grün.

**Der Fehler lag zwischen ihnen, und dort sah niemand hin.**

`pruefeVerrechnetUndBestellt` prüft jetzt über die Belege hinweg: Was auf einem
Kundenbeleg als Leistung verrechnet ist, muss in der Lieferantenbestellung
angefordert sein — und mit **derselben Zahl**. Das Register hat heute einen
Eintrag und Platz für den nächsten; jeder trägt seinen Grund.

Fehlt der Zielbeleg im Durchlauf, wird das gemeldet und nicht verschwiegen.
Ein halber Lauf soll nicht aussehen wie ein ganzer.

## Zwei Namen für dieselbe Zahl

Beim Nachsehen fiel ein zweiter Widerspruch auf. Die Seiten des Shops nennen
die 7,50 € durchgehend **Kranentladung je Hub** — die Lieferseite, die
Artikelkarte („palettiert, Kranentladung"), die Wissensseite über die Fracht.
Die Belege nannten sie **Sperrgutzuschlag**.

Ein Zuschlag ist ein Aufpreis. Eine Kranentladung ist etwas, das jemand tut.
Der Kunde liest auf der Seite eine Leistung und auf der Rechnung einen
Aufschlag, und beide Seiten stimmen für sich — genau die Bauart von `PreOrder`
gegen `InStock` am 28. August. Jetzt heißt es überall Kranentladung.

## Und ein Satz, der dem widersprach

Im Angebot stand:

> Abladen, Zufahrt und Anwesenheit auf der Baustelle obliegen dem Besteller.

Daneben eine berechnete Kranentladung. Wer beides liest, weiß nicht, wofür er
zahlt. Der Satz sagt jetzt, wo die bezahlte Leistung aufhört:

> Zufahrt und Anwesenheit auf der Baustelle obliegen dem Besteller. Die
> Kranentladung setzt die Palette am Fahrzeug ab; alles weitere auf der
> Baustelle ist Sache des Bestellers.

## Nebenbei: eine Beschriftung, die etwas anderes verspricht

```
Ansprechpartner vor Ort: +43 660 1234567
```

Ein Fahrer, der einen Namen sucht, findet eine Nummer. Am 1. September war
dieselbe Zeile leer und wurde gefüllt; dass die Beschriftung nicht zum Wert
passt, ist erst beim Lesen aufgefallen. Jetzt „Telefon vor Ort".

## Stand

| | |
|---|---|
| Belege im Durchlauf | 5, alle einzeln geprüft |
| übergreifende Regeln | 1 (Kranentladung), mit Grund |
| Tests | 1246 |
| Gegenproben, die anschlagen | 20 von 20 |

Die neue Gegenprobe entfernt die Kranzeile aus dem Bestelltext und erwartet,
dass `pruefe-belege` es meldet. Vor heute wäre sie grün geblieben.
