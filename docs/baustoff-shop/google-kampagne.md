# Die Google-Kampagne — fertig geplant, nicht geschaltet

Stand: 2026-08-22, Zahlen überarbeitet 2026-08-25. Weisung: *„setze google kampagne auf den fertigen
shop"*. Dieses Dokument ist die vollständige Kampagne — Struktur,
Gebote, Ausschlüsse, Budget. **Geschaltet ist sie nicht**, und zwei
Gründe stehen dem entgegen, die vor jedem Euro geklärt gehören.

## Warum ich sie nicht schalte

**Erstens: Eine Kampagne löst Ausgaben aus.** Nach der stehenden
Abmachung entscheidet das der Auftraggeber, nicht der Loop. Das gilt
unabhängig davon, wie gut die Planung ist.

**Zweitens, und das wiegt schwerer: Der Shop ist nicht fertig.** Nicht
im Sinne von „noch nicht schön", sondern im Sinne von „Google nimmt
ihn nicht an". Google Merchant Center prüft vor der Freischaltung, und
es fehlen:

| fehlt | wofür |
|---|---|
| **Domain und Hosting** | ohne erreichbare Adresse keine Anzeige |
| **Impressum** nach § 5 ECG | Merchant-Center-Pflicht, Ablehnungsgrund Nr. 1 |
| **AGB, Datenschutz, Widerrufsbelehrung** | dito; bei B2B-Beschränkung anders, aber nachzuweisen |
| **Funktionierender Bestellabschluss** | Google prüft den Kaufweg bis zur Bestätigung |
| **Zahlungsanbieter** | derzeit endet die Strecke bewusst vor der Zahlung |
| **Produktfeed mit GTIN** | steht als Werkzeug bereit, aber ohne Artikelkennungen |
| **Firmendaten und UID** | für Impressum und Merchant-Konto |

Ein Merchant-Konto, das wegen fehlender Pflichtangaben gesperrt wird,
ist schwerer wieder freizubekommen als eines, das nie eröffnet wurde.
**Reihenfolge: erst Firma und Domain, dann Shop live, dann Merchant
Center, dann Kampagne.**

## Die Rechnung, die den Zuschnitt entscheidet

Was ein Klick kosten darf, ergibt sich aus dem Deckungsbeitrag der
Bestellung mal der Kaufquote. Gerechnet mit den echten Zahlen der
Bürozubau-Rechnung (Fracht verrechnet, Zahlung per Karte):

| Bestellgröße | Warenkorb netto | Deckungsbeitrag | max. Klick bei 1 % | bei 2 % | bei 3 % |
|---|---|---|---|---|---|
| 1 Sack Kleber | 42 € | 9,18 € | 0,09 € | 0,18 € | 0,28 € |
| 4 Sack | 169 € | 38,74 € | 0,39 € | 0,77 € | 1,16 € |
| 12 Sack (Gate-20-Schwelle) | 507 € | 116,65 € | 1,17 € | 2,33 € | 3,50 € |
| 30 Sack (Baustelle) | 1.268 € | 294,01 € | 2,94 € | 5,88 € | 8,82 € |

*Gerechnet mit 25 % Marge nach der Weisung vom 25.08.
(`marge-25-prozent.md`); die frühere Fassung dieser Tabelle rechnete
mit 25 % Zuschlag, also 20 % Marge, und lag durchgehend um rund ein
Drittel niedriger.*

Dem gegenüber die tatsächlichen Klickpreise: In Österreich liegt der
CPC branchenüblich zwischen **0,50 € und 2,50 €**, lokale Anbieter und
Handwerk eher bei 0,50–2,00 €.

Daraus folgt hart und ohne Spielraum:

> **Der Ein-Sack-Kunde ist über Google nicht bezahlbar.** Sein maximaler
> Klickpreis liegt bei 9 bis 28 Cent, der Markt verlangt das Zwei- bis
> Zehnfache. Jede Anzeige, die ihn anzieht, kostet Geld und bringt
> keines. Daran hat die bessere Marge nichts geändert — sie hat die
> Größenordnung verschoben, nicht das Vorzeichen.
>
> **Ab etwa zwölf Sack — rund 500 € Warenkorb — trägt die Kampagne
> sich, und zwar seit der Margenumstellung mit Abstand.** Bei 20 %
> Marge lag der zulässige Klickpreis dort bei 1,73 € und damit am
> oberen Rand des Marktpreises; bei 25 % sind es 2,33 €. Es ist
> dieselbe Schwelle, die Gate 20 aus der Fracht ableitet — zwei
> unabhängige Rechnungen kommen auf denselben Punkt, weil unterhalb
> dieser Größe jede Einzelbestellung zu klein für ihre eigenen
> Nebenkosten ist.

**Die Kampagne muss also Baustellen ansprechen, nicht Heimwerker.** Das
ist zugleich die Antwort auf den Preisvergleich aus
`erste-echte-zahlen.md`: Wer zwölf Sack Profi-Kleber braucht, vergleicht
nicht mit der Baumarkt-Eigenmarke — er kann sie fachlich nicht
verwenden.

## Die Kampagnenstruktur

### Was ausgeschlossen wird — zuerst

Ausschlüsse sind bei dieser Marge wichtiger als Gebote. Jeder Klick,
der nicht zu einer Baustellenbestellung führt, ist verlorenes Geld.

**Auszuschließende Suchbegriffe** (negative Keywords):

```
günstig, billig, gebraucht, Restposten, Angebot
Baumarkt, OBI, Hornbach, Bauhaus, Lagerhaus
1 Sack, Einzelsack, Kleinmenge, Muster, Probe
Anleitung, wie, Video, Erfahrung, Test, Vergleich
Jobs, Lehre, Gehalt
Miete, mieten, leihen
```

Die zweite Zeile ist die wichtigste: Wer „Flexkleber Hornbach" sucht,
will zu Hornbach. Die vierte auch — Ratgebersuchen kaufen nicht, sie
gehören auf die Inhaltsseiten, nicht in die bezahlte Anzeige.

**Auszuschließende Zielgruppen:** Privatkunden lassen sich nicht direkt
ausschließen, aber über Gerät (Mobilgebot senken), Uhrzeit
(Werktags 6–17 Uhr höher) und die Textgestaltung steuern.

### Die drei Kampagnen

**Kampagne 1 — Marken- und Produktsuche (Suchnetzwerk)**
Der tragende Teil. Hier vergleicht der Kunde Gleiches mit Gleichem.

| Anzeigengruppe | Beispiel-Suchbegriffe | Gebot |
|---|---|---|
| Kleber und Mörtel nach Marke | „Quarzolith FK500", „Quarzolith Trass-Bettbeton", Marke + Artikelnummer | hoch |
| Dämmung nach Marke und Maß | „XPS 50 mm", Herstellername + Stärke | mittel |
| Drainage nach Typ | „Drainrohr DN100 geschlitzt", „Dränrohr 50 m Rolle" | mittel |

Übereinstimmungstyp **Phrase und exakt**, nicht weitgehend. Weitgehende
Übereinstimmung ist bei dieser Marge der teuerste Fehler, den man
machen kann.

**Kampagne 2 — Fachanforderung (Suchnetzwerk)**
Wer eine Norm oder Eigenschaft sucht, ist Fachmann.

Beispiele: „Flexkleber C2TE S1", „Trass Bettbeton Naturstein",
„Drainage nach ÖNORM B 2506", „XPS Perimeterdämmung druckfest".

**Kampagne 3 — Shopping (erst wenn der Feed steht)**
Shopping zeigt Preise nebeneinander. Solange dort
Baumarkt-Eigenmarken mitlaufen, ist es der ungünstigste Kanal — mit
einer Ausnahme: **Markenspezifische Shopping-Anzeigen**, bei denen die
Marke im Titel steht. Deshalb: Shopping erst nach den beiden
Suchkampagnen, und nur für Artikel mit Markennamen und GTIN.

### Gebiet und Budget

**Gebiet:** Radius um den Firmensitz, nicht ganz Österreich — die
Lieferung ist regional, und Klicks aus Vorarlberg sind bezahlte
Absagen. Anfangs eng ziehen (der Bezirk plus Nachbarbezirke), später
nach den tatsächlichen Lieferkosten erweitern.

**Startbudget:** 10 € am Tag, 300 € im Monat. Begründung: Bei einem
angenommenen Klickpreis von 1 € sind das 300 Klicks; bei 2 %
Kaufquote sechs Bestellungen. Das reicht, um die Kaufquote zu
**messen** — und die Kaufquote ist die einzige Zahl, die über die
ganze Kampagne entscheidet und die niemand vorher kennt.

**Das ist ein Messbudget, kein Werbebudget.** Nach vier Wochen steht
fest, ob eine Bestellung im Schnitt mehr Deckungsbeitrag bringt, als
ihre Klicks gekostet haben. Vorher wird nicht erhöht.

### Die Abbruchregel, vorab festgelegt

Nach Gate-17-Prinzip, damit sie nicht nachträglich verhandelt wird:

> **Nach 300 € Werbeausgabe wird gerechnet.** Liegt die Summe der
> Deckungsbeiträge aller in dieser Zeit eingegangenen Bestellungen
> unter der Werbeausgabe, wird die Kampagne **abgeschaltet**, nicht
> optimiert. Optimiert wird erst, wenn die Grundrechnung aufgeht.

Der Grund steht in `marge-25-prozent.md`: Bei 25 % Rohmarge endet die
Tragfähigkeit bei **23 % Werbeanteil** (bei 20 % waren es 18 %). Das
ist der Puffer, der die Kampagne überhaupt erst vertretbar macht — es
ist keine Erlaubnis, ihn auszureizen. Eine Kampagne, die bei 300 €
nicht trägt, trägt bei 3.000 € auch nicht; sie kostet nur zehnmal so
viel, bis man es merkt.

## Was zu tun ist, in dieser Reihenfolge

1. **Domain klären** (siehe `domainwahl.md`) — die Firma steht bereits:
   Freudenthaler Bau GmbH, FN 347938z, Baustoffhandel als Gewerbe
   eingetragen. Empfehlung ist eine Subdomain der bestehenden Domain.
   Repository auf privat stellen.
2. **Shop live** mit Impressum, Rechtstexten, Zahlung — der Rechenkern
   steht, die Rechtstexte sind ein Gerüst mit ausgewiesenen Lücken.
3. **Katalog füllen** aus den Poschacher-Rechnungen, GTIN je Artikel
   erfassen.
4. **Merchant Center** anlegen und Feed einreichen
   (`npm run veroeffentlichung`), Freigabe abwarten.
5. **Kampagne 1 und 2** mit dem Messbudget starten, Ausschlussliste von
   Anfang an.
6. Nach 300 €: rechnen, dann entscheiden.

Schritt 5 ist der erste, der Geld kostet — und der erste, für den es
eine ausdrückliche Freigabe braucht.
