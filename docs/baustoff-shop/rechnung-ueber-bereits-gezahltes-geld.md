# Eine Rechnung, die nicht sagt, dass sie schon bezahlt ist

**1. September 2026.** Die Frage der letzten Stunde war: *Welche Datei sieht der
Kunde, die ich noch nie gelesen habe?* Die Antwort waren die Belege. Also habe
ich einen echten Warenkorb gerechnet und die drei Texte ausgegeben, die eine
Bestellung auslöst. Die Rechnung endete so:

```
Warenwert netto         1240,40 €
Fracht netto             125,00 €
Summe netto             1365,40 €
Umsatzsteuer 20 %        273,08 €
Gesamtbetrag            1638,48 €

Leistungsort Österreich, Steuersatz 20 %.
Untersuchungs- und Rügepflicht nach § 377 UGB wird ausdrücklich vereinbart.
```

Elf Pflichtangaben nach § 11 UStG, alle vorhanden, die Prüfung meldete
`vollstaendig: true`. Und trotzdem ist dieser Beleg falsch.

## Was fehlt

Punkt 9 der eigenen Geschäftsbedingungen: **Zahlungsziel null Tage, gezahlt
wird bei der Bestellung.** Alle drei angebotenen Zahlwege — EPS, Vorkasse,
Kreditkarte — verlangen das Geld, bevor die Bestellung an die Hersteller geht.
`offene-rechnung` steht ausdrücklich unter *ausgeschlossen*.

Und der Ablauf in `auftragslauf.js` setzt die Rechnung an **Position zehn**,
nach der Lieferung:

| # | Schritt |
| --- | --- |
| 4 | Auftragsbestätigung an den Kunden |
| 5 | **Zahlungseingang feststellen** |
| 6 | Bestellung je Lieferant auslösen |
| 9 | Direktlieferung an die Baustelle |
| 10 | **Rechnung an den Kunden stellen** |

Zwischen Schritt 5 und Schritt 10 liegen die ganze Lieferzeit und das ganze
Geld. Jede Rechnung dieses Shops ist eine Rechnung über bereits bezahltes Geld.
Der Beleg oben sagt das nicht — er nennt einen Betrag und schweigt.

> **Eine Rechnung, die einen Betrag nennt und über seinen Zustand schweigt, ist
> eine Zahlungsaufforderung.** So liest sie jede Buchhaltung, und so wird sie
> bezahlt. Ein zweites Mal.

Das Unangenehme daran ist die Richtung des Fehlers. Wer zu wenig verrechnet,
merkt es beim Kontoabgleich. Hier bekommt der Shop **zu viel** — und der
Einzige, der einen Anlass hätte, das zu bemerken, ist er selbst. Der Kunde hat
gezahlt, was auf dem Papier stand.

## Was jetzt auf den Belegen steht

**Rechnung** — der Vermerk, aus `rechtstexte.js` und `zahlung.js` gespeist:

```
Bereits bezahlt am 30.08.2026 über EPS-Onlineüberweisung.
Zahlungsreferenz: AB-2026-0001
Dieser Beleg dient dem Vorsteuerabzug. Bitte nicht noch einmal überweisen.
```

Fehlt Zahlweg oder Datum, steht dort `[[ Zahlweg und Zahlungsdatum — FEHLT ]]`
und `darfRechnungGestelltWerden` sperrt. Dieselbe Haltung wie beim
Platzhalterpreis: Ein Beleg, der eine Angabe erfindet, ist schlimmer als
keiner.

**Angebot** — die Bedingung, bevor bestellt wird. Ohne sie gilt im B2B die
Verkehrssitte, und die ist ein Zahlungsziel:

```
Zahlungsbedingung: Zahlung bei Bestellung, kein Zahlungsziel
(EPS-Onlineüberweisung, Vorkasse per Überweisung, Kreditkarte …).
```

**Auftragsbestätigung** — der eine Satz, der bisher nirgends stand, obwohl er
der Grund ist, warum die Baustelle wartet:

```
Zahlbar sofort, ohne Zahlungsziel (Punkt 9 der Geschäftsbedingungen). Die
Bestellungen bei den Herstellern lösen wir nach Zahlungseingang aus; die
Lieferzeiten unten laufen ab diesem Zeitpunkt.
```

Alle drei Texte lesen `ZAHLUNGSBEDINGUNGEN.zielTage`. Wird eines Tages ein
Zahlungsziel freigegeben, kippen sie mit, statt zu widersprechen.

## Der eigentliche Befund

Diesen Fehler hat kein Prüfer gefunden, und das war kein Zufall:

| Prüfer | liest |
| --- | --- |
| `pruefe-inhalte` | `inhalte/` und die gebauten Seiten |
| `pruefe-seiten` | die gebauten Seiten |
| `pruefe-widerrufe` | den **Quelltext** von `src/`, `bin/`, `inhalte/`, `docs/` |

Der Beleg ist das einzige Kundendokument, das erst im Betrieb entsteht. Ein
Prüfer, der Quelltext liest, sieht die Bausteine; was aus ihnen zusammengesetzt
beim Kunden ankommt, sieht er nicht. Elf Prüfer, und keiner hatte je einen
fertigen Beleg gelesen.

`npm run pruefe-belege` baut jetzt vier Kundendokumente aus echten Daten —
Angebot, Auftragsbestätigung, Rechnung, Kundenanfrage — und liest den fertigen
Text. Zwei Regeln:

1. **Kein Betrag ohne Zustand.** Wer eine Endsumme nennt, muss sagen, ob sie zu
   zahlen oder bezahlt ist.
2. **Kein widerrufener Satz** — mit Sichtweite **null**. Auf einer Seite darf
   der Widerruf danebenstehen; ein Beleg hat keine Fußnoten.

Die Gegenprobe: Vermerk aus der Rechnung entfernt, Prüfer läuft, Meldung
`betrag-ohne-zustand`, Rückgabewert 1. Danach zurückgestellt. Ein Prüfer, der
den Fehler nicht findet, für den er gebaut wurde, ist Zierrat.

## Zwei Nebenbefunde aus derselben Stunde

**Der Bündelprüfer hat mitgeredet.** Meine erste Fassung nannte eine lokale
Tabelle `ZAHLWEGE` — den Namen trägt schon die Kostentabelle in `zahlung.js`.
Im Modul harmlos, im zusammengefügten `shop.js` ein `SyntaxError`. Vier Tests
rot, Meldung im Klartext, zwei Minuten Arbeit. Genau dafür steht die Prüfung
dort.

**`zahlwegName` ist umgezogen.** Sie stand als lokale Hilfsfunktion in
`bin/website.mjs` und war damit nur für die AGB-Seite zu haben. Die Rechnung
braucht denselben Namen — sonst liest derselbe Kunde auf der Seite
„EPS-Onlineüberweisung" und auf dem Beleg „eps". Derselbe Fehler wie das
Lieferantenkürzel in der Belegzeile, und dieselbe Lösung: eine Quelle, zwei
Leser.

## Was das nächste Mal zu fragen ist

Die Frage der letzten Stunde hat funktioniert und ist damit verbraucht — die
Belege sind gelesen. Die nächste ist eine Stufe allgemeiner:

> **Welches Kundendokument entsteht erst im Betrieb, und wer liest es dann?**

Übrig bleiben nach heute: die Bestelltexte an die Lieferanten (`bestellung.js`,
kein Kundendokument, aber ein Außentext), die Mailto-Adresse aus
`kundenanfrage.js` und alles, was ein Zahlungsanbieter eines Tages an den
Kunden schickt. Das dritte ist noch niemandes Text — und genau deshalb der
Kandidat, an den keiner denkt.
