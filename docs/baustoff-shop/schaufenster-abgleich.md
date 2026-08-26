# Schaufenster-Abgleich: was wo angezeigt wird, und ob es stimmt

Stand: 2026-08-26. Am 17. August stand hier schon einmal derselbe
Befund: **Eine nicht mitgezogene Anzeige ist eine stille
Falschaussage.** Seither sind drei Schaufenster dazugekommen und der
Bestand ist um mehrere hundert Testfälle gewachsen. Dieses Dokument
gleicht alle ab und hält fest, welches auf welchem Stand steht — damit
der nächste Lauf nicht raten muss.

## Der Bestand an Schaufenstern

| Anzeige | Zeigt | Stand | gültig? |
|---|---|---|---|
| **PR #14, Beschreibung** | den ganzen Vorhabenstand | **26.08.** | ja, heute nachgezogen |
| [Baustoffe zum Baumeisterpreis](https://claude.ai/code/artifact/fe6d720d-473d-4af5-a26b-6fcfbea929dc) | die Website | **26.08., 77 Seiten** | ja, heute nachgezogen |
| [Was 25 % Marge tragen](https://claude.ai/code/artifact/6e356abb-b5d3-44a9-9b8d-f98a13fb0502) | die Kalkulation | 25.08. | ja — kennt aber das Skonto nicht |
| [Der Weg zum ersten Klick](https://claude.ai/code/artifact/44ba340b-a126-457c-96d5-64fc34efa3a4) | den Ablaufplan | 25.08. | ja — kennt die Rechtsseiten nicht |
| [Radonvorsorge Österreich](https://claude.ai/code/artifact/3d669d15-b632-41b9-838c-b9369dab8a4c) | den Radon-Bericht | 18.08. | **ja, für sein Modell** |
| [Radonvorsorge Fachhandel](https://claude.ai/code/artifact/c40fd35f-56e1-4821-a3b1-a1a885102ec8) | das Radon-Funktionsmuster | 17.08. | **ja, für sein Modell** |
| `shop/demo.html` | dasselbe Funktionsmuster als Datei | heute neu gebaut | ja |

## Zwei Schaufenster stehen bewusst still

Die beiden Radon-Anzeigen sind **nicht veraltet, sondern gehören zu
einem anderen Modell.** Nach Gate 12 sind Shop und Leadmodell
gleichrangig, und nach der Gate-Entscheidung vom 26. August gilt für den
Radon-Streckenhandel weiterhin Gate 1 und Gate 5. Sie auf den
Baustoffstand zu ziehen hieße, zwei verschiedene Geschäfte in einer
Anzeige zu vermischen.

**Sie bleiben also stehen — und das ist eine Entscheidung, keine
Nachlässigkeit.** Damit sie nicht doch für den aktuellen Stand gehalten
werden, führt dieses Dokument sie mit Datum und Modellzuordnung.

## Zwei Anzeigen sind gültig, aber nicht vollständig

**Die Kalkulationsseite** (25.08.) rechnet richtig mit 25 % Marge, kennt
aber den Skonto-Hebel noch nicht, der am 26. August dazukam. Sie sagt
nichts Falsches — sie sagt nur nicht alles. Der nötige Monatsumsatz von
45.356 € stimmt ohne Skonto; mit Skonto sind es 38.786 €.

**Der Ablaufplan** (25.08.) markiert zwei der vier Fragen als
beantwortet und nennt die Domainschritte. Er kennt die fünf
Rechtsseiten nicht, die am 26. August entstanden sind, und auch nicht,
dass die GTIN der letzte verbleibende Arbeitspunkt ist.

Beide gehören beim nächsten Lauf nachgezogen. Sie stehen hier, damit das
nicht vergessen wird — und weil „später" ohne Notiz erfahrungsgemäß
„nie" heißt.

## Was `npm run build` heute verändert hat

Das Funktionsmuster meldet seit heute **vier statt drei Lieferanten**.
Der Grund ist harmlos und gehört trotzdem benannt: Am 25. August kam
`poschacher` in `data/lieferanten.json` dazu. Der Radonkatalog verweist
auf keinen seiner Artikel, die Zahl im Bauhinweis zählt aber alle
geladenen Lieferanten.

Das ist kein Fehler, aber es ist die Sorte Nebenwirkung, die man
bemerken sollte: **Eine Datei, die zwei Modelle bedient, verändert beide,
wenn man eines pflegt.**

## Die Regel, die daraus folgt

> Wer eine Zahl in einem Schaufenster ändert, ändert sie in **allen** —
> oder trägt hier ein, warum nicht.

Das ist billiger als die Alternative. Am 17. August waren drei Anzeigen
auf drei verschiedenen Ständen, und der Abgleich kostete einen ganzen
Lauf. Ein Eintrag in dieser Tabelle kostet zwei Minuten.

## Nächster Abgleich

Fällig, sobald eines der folgenden eintritt:

- die Kalkulationsseite bekommt das Skonto (offen)
- der Ablaufplan bekommt die Rechtsseiten und die GTIN-Lage (offen)
- die GTIN trifft ein — dann ändert sich der Feedstand in allen Anzeigen
- das Repository wird auf privat gestellt — dann ändern sich die
  Hinweise zur Vertraulichkeit
