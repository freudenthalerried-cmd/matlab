# Wer ist Bauversand?

**3. September 2026, vierte Runde am Markennamen.** Diese Frage konnte man den
ganzen Tag über auf keiner Seite beantworten.

Der Shop tritt seit dem Vormittag unter `Bauversand` auf: Logo, Seitentitel,
`llms.txt`, seit Mittag der Absender jedes Kundenbelegs, seit dem Nachmittag jede
`Organization` in den strukturierten Daten. Das **Impressum** — die eine Seite,
auf der man sich zu erkennen gibt — nannte weiter allein:

```
Freudenthaler Bau GmbH
Gesellschaft mit beschränkter Haftung
Marwach 5
4312 Ried in der Riedmark
```

§ 5 ECG ist damit erfüllt: Der Name des Diensteanbieters steht da. Was fehlte,
war die **Verbindung**. Ein Kunde, der wissen will, wer hinter „Bauversand"
steckt, klickt aufs Impressum und liest einen Namen, den er noch nie gesehen
hat — dieselbe Lücke wie bei der Rechnung heute Mittag, nur an der Stelle, die
sie eigentlich schließen soll.

> **Ein Name, unter dem man auftritt, gehört auf die Seite, auf der man sich zu
> erkennen gibt.**

## Eine Zeile, unter dem Adressblock

```
Freudenthaler Bau GmbH
Gesellschaft mit beschränkter Haftung
Marwach 5
4312 Ried in der Riedmark
Österreich

„Bauversand" ist das Online-Angebot der Freudenthaler Bau GmbH.

E-Mail: …
```

Die Reihenfolge ist umgekehrt zu der auf dem Beleg, und das mit Absicht. Auf
der Rechnung steht die Marke vorn, weil der Kunde dort **wiedererkennen** soll,
bei wem er bestellt hat. Im Impressum steht die Firma vorn, weil sie dort die
**Pflichtangabe** ist und die Marke die Erklärung dazu. Ein Testfall hält genau
das fest: Die Firma muss vor der Marke stehen.

Fehlt eine Marke, oder ist sie gleich der Firma, entfällt die Zeile. „Bauversand
ist das Online-Angebot der Bauversand" wäre keine Auskunft, sondern eine
Schleife.

## Was der Bestand von selbst gemeldet hat

Die neue Funktion `markenzeile` war nach zwei Minuten rot — nicht wegen ihres
Inhalts, sondern weil sie existiert:

```
✗ Jede textbauende Funktion steht im Verzeichnis oder hat einen Grund
    Eine textbauende Funktion, die niemand kennt, ist ein ungeprüfter Ausgang
```

Das Fremdtextverzeichnis führt jede Funktion, aus der Text den Shop verlässt,
und verlangt zu jeder Ausnahme einen Grund. Der Grund hier ist echt und keine
Formsache: Die Zeile geht ausschließlich über `erzeugeImpressum` hinaus, ihr
Inhalt sind zwei eigene Felder aus `data/betreiber.json`, und Fremdtext
erreicht sie nicht. So steht sie jetzt im Verzeichnis.

## Vier Runden, ein Name

| Runde | Wo der alte Name allein stand | Gefunden von |
|---|---|---|
| Vormittag | Kopfleiste aller 81 Seiten | dem Auftraggeber |
| Mittag | Absender auf Angebot, Auftragsbestätigung, Rechnung | dem Lesen des erzeugten Belegs |
| Nachmittag | `publisher` und `seller` in jeder Auszeichnung | einem eigens gebauten Testfall |
| jetzt | Impressum — die Seite, die die Frage beantworten soll | einem Durchgang durch die Rechtsseiten |

Vier Stellen, vier verschiedene Wege, sie zu finden, und **kein einziger davon
war derselbe.** Das ist die eigentliche Lehre dieses Tages: Eine Umbenennung
hat keine Liste. Sie hat so viele Fundstellen, wie es Orte gibt, an denen der
alte Name für sich allein stand — und jeder dieser Orte hat seine eigene Art,
sich zu zeigen.

Was daraus folgt, steht schon in `PARAMETER.md`: Die Weisungstafel ist der Ort,
an dem eine Weisung des Auftraggebers als Erstes landet. Für den Markennamen
ist sie es heute Vormittag nicht gewesen — die Weisung kam mündlich, und die
vier Runden danach waren die Rechnung dafür.

## Geprüft

Zwei Testfälle in `test/rechtstexte.test.js`, einer gegengeprobt (die Funktion
gibt eine leere Liste zurück — der Fall fällt):

1. Das Impressum nennt **beide** Namen, und die Firma steht vor der Marke.
2. Ohne Marke, mit leerer Marke oder wenn Marke gleich Firma ist, entsteht
   keine Zeile.
