# Sieben Befunde, die der zweite Rechner noch nie ausgesprochen hat

**31. August 2026.** Der Durchgang davor endete mit einer ausdrücklichen
Warnung an mich selbst: Die verbliebenen Deckungslücken sind **keine
Aufgabenliste**; ob dort etwas zugesagt wird, muss man einzeln nachlesen.
Also eine aufgeschlagen — `src/kontrolle.js`, die größte.

Was dort steht, rechtfertigt den Blick.

## Was dieses Modul ist

`kontrolle.js` ist **die zweite Rechnung**, absichtlich anders gebaut als die
erste. Sein Dateikopf sagt, warum:

> „Die Testfälle rechnen mit denselben Funktionen nach, die sie prüfen sollen.
> Ein Denkfehler, der in beide Richtungen gleich falsch ist, fällt dabei nicht
> auf."

Es liest deshalb den **gerenderten Belegtext** zurück und rechnet aus den
Zeichen nach. Es kennt weder `warenkorb.js` noch `preis.js`, nur Text und die
vier Grundrechenarten.

Ein Modul, dessen ganzer Zweck das Melden von Abweichungen ist. Und der
Deckungslauf nennt sieben seiner Zweige, die kein Testfall je betritt — **alle
sieben sind Fundmeldungen.**

> **Ein Prüfer, der einen Befund noch nie ausgesprochen hat, hat nur bewiesen,
> dass er schweigen kann.**

Zur Ehrenrettung: Die meisten Abweichungsarten *sind* geprüft — verfälschte
Gesamtsumme, unterschlagene Position, falsch gerundete Umsatzsteuer,
vertauschte Menge im Bestelltext, fehlende CSV-Zeile, verfälschter
Einkaufswert. Der Prüfer ist nicht stumm. Diese sieben hat er nur nie sagen
müssen.

## Die sieben

| Befund | was er verhindert |
|---|---|
| CSV-Zeile verrutscht | ein zusätzliches Semikolon schiebt alle Felder um eins — die Menge steht in der Spalte daneben, beim Lesen unauffällig, beim Kommissionieren die falsche Zahl |
| CSV-Zeile ohne lesbare Menge | eine Bestellung, die der Lieferant nicht ausführen kann |
| Betrag steht gar nicht im Text | nicht „falsche Zahl", sondern „keine Zahl" — die stillere der beiden Fehlerarten |
| Frachtzeilen summieren nicht zur ausgewiesenen Fracht | ein in sich widersprüchlicher Beleg |
| Warenwert plus Fracht ergibt nicht die Nettosumme | die Zeile, die Positionssumme gegen Belegsumme hält |
| keine Lieferadresse im Bestelltext | der Lieferant weiß nicht wohin |
| kein Empfänger im Beleg | über 400 € brutto ein Rechnungsmangel nach § 11 UStG |

Bei vieren davon war jeweils die **auffälligere** Schwester geprüft und die
leisere nicht: umgelenkte Adresse ja, fehlende nein. Falscher Empfänger ja,
gar keiner nein. Falscher Betrag ja, fehlender nein. Verrutschte Menge im
Text ja, verrutschte Spalte in der CSV nein.

Das ist kein Zufall, sondern die natürliche Reihenfolge: Man schreibt den Fall
auf, der einem beim Bauen vor Augen stand. Der stillere fällt einem nicht
ein, gerade weil er still ist.

## Gegenproben

Jede der sieben Meldungen einzeln abgeschaltet, jede Datei gesichert und
zurückgesetzt:

| abgeschaltete Meldung | erkannt |
|---|---|
| CSV verrutscht | ja |
| CSV ohne lesbare Menge | ja |
| fehlender Betrag im Vergleich | ja |
| Frachtzeilensumme | ja |
| Nettosumme aus Warenwert und Fracht | ja |
| fehlende Lieferadresse | ja |
| fehlender Empfänger | ja |

Dazu drei Gegenrichtungen, die zusammen sagen: Der unversehrte Vorgang meldet
**keinen** dieser Befunde. Ein Prüfer, der immer meldet, ist so wertlos wie
einer, der nie meldet — und beim Nachziehen von Fundmeldungen ist der erste
Fehler der leichtere.

Einen Anlauf musste ich verwerfen: Der Empfängerblock ließ sich nicht durch
Streichen der Zeilen mit dem Firmennamen entfernen — der Kopfleser sucht die
eingerückten Zeilen unter „Rechnungsempfänger:", und mein erster Griff traf
den falschen Text. Erst der Block selbst ergab den Fall, den ich meinte.

## Stand

`kontrolle.js` steht auf 100 % Zeilendeckung; keine Fundmeldung dieses Moduls
ist mehr unausgesprochen.

992 Testfälle grün (vorher 983), `pruefe-tests` 990/0, `pruefe-preise` 46/0,
elf Prüfer mit `--mit-browser` ohne Beanstandung, `pruefe-stand` 206/206.
