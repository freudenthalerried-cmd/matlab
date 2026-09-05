# Die Messliste misst das Modell, das keine Kampagne hat

**1. September 2026.** Am Ende der letzten Stunde stand die offene Frage:
*Gibt der Markt die 200 Klicks im Monat überhaupt her?* Dafür gibt es seit
Phase 1 ein Werkzeug — `npm run suchvolumen`, Prüfung B zu Gate 15 — und eine
vorbereitete Messliste in `data/messliste.json`.

Hineingesehen:

```
neubaupflicht   A   6 Keywords   Neubaupflicht und Norm
  radonvorsorge neubau · önorm s 5280-2 · radonvorsorgegebiet · …
ausfuehrung     A   6 Keywords   Ausführung und Material
foerderung      A   3 Keywords   Förderung Oberösterreich
messen          B   5 Keywords   Messen und Einordnen
sanierung       B   5 Keywords   Sanierung im Bestand
feuchte         C   6 Keywords   Kellersanierung und Feuchte
```

**Das ist das Radonmodell.** Es ist nach Gate 12 gleichrangig und die Liste
ist nicht falsch. Aber wer heute misst, misst ein Modell, für das es keine
Kampagne, keine Landeseiten und kein Budget gibt — und erfährt nichts über
das, in das der erste Euro fließen soll.

Dazu kommt ein zweiter Fehler, und der ist der teurere: Das Feld heißt
*„volumen = Suchvolumen **Österreich** je Monat"*. Beworben wird in **fünf
Bezirken**. Wer landesweites Volumen misst und regional wirbt, überschätzt
sich um den Faktor der Bevölkerung.

## Die Frage umgedreht

Die alten Schwellen — 200 Suchen je Cluster, 2.000 kumuliert — stammen aus dem
Radonmodell und sind gesetzt. Für dieses Modell lässt sich die Schwelle
**ableiten**, und zwar aus dem Versuchsplan der letzten Stunde:

> Nicht: *„Reicht das gemessene Volumen?"* — sondern: *„Wie viel Volumen muss
> die Messung zeigen, damit der Plan aufgeht?"*

Der Plan braucht 200 Klicks im Monat (10 € Tagesbudget, 1,50 € Klickpreis).
Daraus:

| Klickrate | nötige Suchanfragen je Monat, **im Liefergebiet** |
|---|---|
| 3 % | 6.667 |
| 5 % | 4.000 |
| 8 % | 2.500 |

Die Klickrate ist die eine Zahl hier, die **nicht** aus den Daten dieses
Vorhabens stammt — es gibt keine geschaltete Anzeige, aus der sie abzulesen
wäre. Sie steht deshalb als Band und nicht als Wert, genau wie die Kaufquote.

## Was passiert, wenn der Markt weniger hergibt

`src/suchbedarf.js` rechnet beide Engpässe und nennt den bindenden:

| Volumen/Monat | Klicks/Monat | Engpass | Monate bis 299 Klicks | nicht ausgebbar |
|---|---|---|---|---|
| 500 | 25 | **Markt** | 12,0 | 263 €/Monat |
| 1.000 | 50 | **Markt** | 6,0 | 225 €/Monat |
| 2.000 | 100 | **Markt** | 3,0 | 150 €/Monat |
| 4.000 | 200 | **Markt** | 1,5 | 0 € |
| 8.000 | 200 | Budget | 1,5 | 0 € |

(bei 5 % Klickrate)

Der Befund, den ich vorher nicht auf dem Schirm hatte: **Wahrscheinlich bindet
der Markt und nicht das Geld.** Die Abbruchregel von gestern rechnet mit 45
Tagen bis zur ersten belastbaren Aussage — das gilt nur, wenn das Budget
ausgegeben werden *kann*. Bei 1.000 Suchanfragen im Monat werden aus 45 Tagen
sechs Monate, und 225 € Budget im Monat bleiben liegen.

Ein liegengebliebenes Budget ist kein gespartes Geld. Es ist ein Versuch, der
sich hinzieht, und in dieser Zeit veraltet die Preisbasis (`pruefe-preisalter`)
weiter.

## Die neue Messliste

`npm run messliste` erzeugt sie aus `ausgabe/kampagne/keywords.csv` — also aus
den Begriffen, auf die tatsächlich geboten würde:

```
33 Begriffe in 3 Anzeigengruppen      (Stand 01.09. — heute 32)
  WDVS       14
  Dämmung     8
  Kamin      11

Ort: Perg, Urfahr-Umgebung, Freistadt, Linz-Land, Linz (AT) — nicht Österreich.
```

Erzeugt statt geschrieben, aus demselben Grund wie überall hier: **Zwei
Listen, die dasselbe meinen, laufen auseinander.** Genau das ist mit
`data/messliste.json` passiert — sie ist bei einem Modell geblieben, das das
Vorhaben am 22. August verlassen hat.

Die Datei trägt ihre Anweisungen mit: den Ort, den nötigen Volumenbedarf, die
Abbruchschwelle und die Herkunft der Klickrate. Alle `volumen`-Felder sind
`null`; eine Messliste mit vorgetragenen Zahlen wäre eine Vermutung, die am
Messtag wie ein Messwert aussieht.

**Die Messung selbst löst keine Ausgaben aus.** Der Keyword-Planer ist
kostenlos, und ein Google-Ads-Konto ohne geschaltete Kampagne kostet nichts.
Sie ist damit der einzige Punkt der ganzen Kette, der ohne Freigabe und ohne
Geld beantwortet werden kann — und sie entscheidet, ob der Klickkanal
überhaupt tragfähig ist.

## Was ich bewusst nicht getan habe

**Die alte Messliste nicht angerührt.** Sie gehört zum Radonmodell, und das
ist nach Gate 12 gleichrangig. Sie zu überschreiben hieße, eine Entscheidung
zu treffen, die der Auftraggeber nicht getroffen hat.

**Kein Bevölkerungsfaktor.** Naheliegend wäre, österreichweites Volumen mit
dem Bevölkerungsanteil der fünf Bezirke zu skalieren. Die Einwohnerzahlen
liegen hier nicht belegt vor, und eine aus dem Gedächtnis geschriebene Tabelle
sähe amtlich aus und wäre es nicht — dieselbe Sperre wie bei der
Postleitzahlenzuordnung in `liefergebiet.js`. Der Keyword-Planer kann direkt
regional messen; das ist der genauere Weg und braucht keine Schätzung.

**Die alten Auswertungsregeln nicht wiederverwendet.** `suchauswertung.js`
prüft Gruppen A/B/C und eine „Radonseite"-Bedingung. Diese Regeln in ein
anderes Modell zu zwingen, hieße, eine fremde Frage zu beantworten.

## Gegenproben

| Mutation | Erkannt |
|---|---|
| Engpass: kleinerer zu größerem Wert | ja |
| Gleichstand dem Budget statt dem Markt zugeschlagen | ja |
| Null Klicks ergibt „null Monate" statt „nie" | ja |
| Herkunftsnotiz als Klickrate mitgerechnet | ja |
| Messliste mit vorgetragenem Volumen erzeugt | ja |

## Stand

- 1.075 Tests, 0 rot; alle Prüfer grün
- neu: `npm run messliste`, `src/suchbedarf.js`
- Kampagnen weiterhin **PAUSIERT**

Der nächste Schritt gehört dem Auftraggeber und kostet nichts: die 32 Begriffe
im Keyword-Planer mit dem Liefergebiet als Ort messen. Darunter steht, ob der
Klickkanal 200 Klicks im Monat hergibt oder ein Vielfaches der geplanten Zeit
braucht.
