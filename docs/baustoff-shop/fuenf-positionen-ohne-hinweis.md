# Fünf Positionen ohne Hinweis

**Stand: 30. August 2026** · Der Zensus, den der vorige Lauf als nächsten
Schritt notiert hat. Betroffen: die vier Dateien in `shop/inhalte/system/`,
`shop/test/shopkern.test.js`.

## Die Frage

Die Systemlisten sind Bestelllisten. Wer die Kellerwand dämmt, zählt sie
durch und bestellt, was daraufsteht. Also die Frage an alle 35 Positionen der
vier Listen:

> **Gibt es zu jeder Position einen Artikel — und wenn nicht, steht es da?**

## Der Befund

Sieben Positionen fanden keinen Artikel. Zwei davon waren gekennzeichnet
(„eigenes Gewerk"), fünf nicht:

| Liste | Position | Stand vorher |
|---|---|---|
| Kaminzug | 6 Anschlussformteil Feuerstätte | ohne Hinweis |
| Kanal DN 100 | 5 Übergangsstücke | ohne Hinweis, **„wird oft vergessen: ja"** |
| Kanal DN 100 | 6 Gleitmittel | ohne Hinweis, **„wird oft vergessen: ja"** |
| Kanal DN 100 | 8 Abschlussschiene | ohne Hinweis, **„wird oft vergessen: ja"** |
| Kellerwand | 6 Abschlussschiene | ohne Hinweis, **„wird oft vergessen: ja"** |

Vier der fünf tragen in der Tabelle die Markierung „wird oft vergessen".
Die Liste sagte also: *Vergiss das nicht, das brauchst du* — und verschwieg,
dass es hier nicht zu bekommen ist.

Bei zweien ist es schärfer. Für **Übergangsstücke** und **Gleitmittel** stand
die Entscheidung längst schriftlich fest, im Kundenwörter-Register unter „nicht
aufgenommen":

> „Gleitmittel: steht als Position auf der Kanalliste, ist aber kein Artikel
> des Sortiments."

Der Shop wusste es, hielt die Suche sauber davon frei — und schrieb es
ungekennzeichnet auf die Bestellliste. **Dieselbe Angabe, zwei Orte, und nur
einer sagt die Wahrheit.** Das ist die Fehlerklasse dieser Woche, zum sechsten
Mal.

## Die Entscheidung

Die Positionen bleiben auf den Listen. Sie werden gekennzeichnet.

Eine Liste, die nur zeigt, was im Regal liegt, ist keine Positionsliste,
sondern ein Angebot — der Satz stand schon auf der Kellerwandseite und ist
richtig. Der Nutzen der Liste liegt gerade darin, dass sie **vollständig** ist:
Wer die Abschlussschiene aus der Liste streicht, weil er sie nicht verkauft,
schickt den Kunden mit einer unvollständigen Bestellung auf die Baustelle.

Alle fünf tragen jetzt `*(nicht im Sortiment)*` in der Positionsspalte, und
jede der drei Seiten sagt es zusätzlich im Text.

## Zwei Zählungen waren dabei auch falsch

Beim Schreiben der Hinweise stellte sich heraus, dass zwei Seiten ihre eigenen
Fehlstellen falsch zählten — dieselbe Sorte wie „Sieben Positionen von zehn"
eine Stunde zuvor:

- Kellerwand: „**Zwei** der sieben Positionen führen wir nicht" — es sind
  **drei** (Abdichtung, Abschlussschiene, Verfüllmaterial).
- Kaminzug: Der Antwortsatz zählte „Anschlussformteile" zum Sortiment.

Beides berichtigt, im Fließtext und im Kopffeld `kurz`; `stand:` mitgezogen.

## Die Probe

Ein Zensus über alle Positionen aller Systemlisten, mit einer Bedingung in
**beide** Richtungen:

1. Ohne Kennzeichnung muss die Position einen Artikel finden.
2. **Mit** Kennzeichnung darf sie keinen finden.

Die zweite ist die wichtigere, und der erste Wurf hatte sie nicht. Die
Gegenprobe zeigte es: Ein `*(nicht im Sortiment)*` am **Armierungsmörtel** —
den wir sehr wohl führen — kam ungehindert durch. Eine falsche Kennzeichnung
schickt den Kunden woandershin, still und ohne Fehlermeldung; sie ist der
teurere Fehler von beiden. Dasselbe Muster wie beim `noindex` am Vormittag:
Die Sperre gehört in beide Richtungen geprüft.

## Was das nicht prüft

Ob die Zuordnung Position → Artikel **stimmt**. Die Probe fragt, ob die
Benennung überhaupt etwas findet, nicht ob sie das Richtige findet. „Bögen"
findet die Kanalbögen — dass es die richtigen Winkel sind, sagt kein
Werkzeug.

Und sie prüft die Markdown-Quelle. Was das Seitenbauwerkzeug selbst an
Tabellen erzeugt, bleibt außen vor.
