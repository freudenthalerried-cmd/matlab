# Ein Prüfer, den ich wieder entfernt habe

**10. September 2026, sechste Runde.** Die Runde davor endete mit einem Fund,
der nach Verallgemeinerung schreit: Ein Registereintrag begründete vier Tage
lang, warum „abholung" **nicht** als negatives Keyword ausgeschlossen ist —
mit einem wörtlichen Zitat der Lieferseite, das seit dem 6. September falsch
war.

> **Eine Begründung, die eine Zusage zitiert, überlebt die Zusage.**

Die Abhilfe galt für **ein** Verzeichnis. Die naheliegende nächste Frage:
Dieser Bestand führt **652 Zitate** in Quelltexten und Werkzeugen — halten
die anderen?

Diese Runde hat den Prüfer dafür gebaut, gemessen — und wieder entfernt. Was
bleibt, ist das Ergebnis der Messung und der Grund, warum daraus keine Prüfung
werden kann.

## Der Bauplan

Ein Zitat, das als **gegenwärtig** gesetzt ist („die Seite sagt …"), muss im
Bestand vorkommen. Zitate in der Vergangenheitsform („hier stand bis dahin …")
sind ausgenommen — das ist die Bauart der Berichtigungen dieses Vorhabens, und
sie zu melden hieße, das Gedächtnis zu bestrafen. Platzhalter („innerhalb von
**N** Werktagen") auch.

Gemessen wurde über `src/` und `bin/` gegen alles, worin ein Zitat stehen
darf: 906 Dateien, gebaute Seiten, Inhaltsquellen, Akte, Testfälle.

**Erster Lauf: 0 Befunde bei 412 gegenwärtigen Zitaten.** Sah gut aus.

## Der Fehler, den die Gegenprobe gefunden hat

Die Gegenprobe veränderte ein zitiertes Wort — und der Prüfer blieb **grün**.
Der Grund: Die Quelldateien gehören zum Bestand, denn ein Kommentar zitiert
oft einen anderen. Damit fand **jedes Zitat sich selbst**.

> **Ein Prüfer, der die Behauptung zu ihrem eigenen Beleg zählt, kann nicht
> rot werden.**

Dieselbe Familie wie die Wegprobe vom 3. September, die
`document.body.textContent` las und damit den Quelltext des eigenen Bündels
mitmaß. Gefunden hat es beide Male nicht das Lesen, sondern die Mutation.

Behoben: Gesucht wird im Bestand **außerhalb der Anführungszeichen**. Ein
Zitat muss seinen Satz als gewöhnlichen Text finden, nicht als weiteres Zitat.

## Und dann die Zahl, die die Sache beendet hat

**180 Befunde bei 414 gegenwärtigen Zitaten.** Nicht einer davon war ein
veraltetes Zitat. Ein Blick auf die Meldungen zeigt, was die deutschen
Anführungszeichen in diesem Bestand alles bedeuten:

| Meldung | Was es wirklich ist |
|---|---|
| „ein // Treffer wäre irreführend" | ein Zitat über zwei Kommentarzeilen — das `//` steht mitten drin |
| „was kostet die Isover-Platte?" | eine **Beispielsuche**, kein Satz von einer Seite |
| „Aussagen: 9 von 9 belegt" | **Werkzeugausgabe**, nicht Seitentext |
| „das kann nicht vorkommen" | eine **rhetorische** Wendung |
| „Repository ${erklaert ? 'privat' : 'öffentlich'}" | eine Zeichenkette **mit Einsetzung** |

Ein zweiter, engerer Anlauf — nur Zitate, denen eine **benannte Fundstelle**
vorausgeht („die Lieferseite sagt …", „`llms.txt` führt …") — ergab **34
Befunde bei 75 Zitaten**, aus denselben Gründen.

> **Die Anführungszeichen markieren hier nicht eine Behauptung über den
> Bestand, sondern jede Art von zitiertem Material.** Ein Prüfer, der sie als
> Fundstellenangabe liest, misst die Schreibweise von Kommentaren und nicht
> die Wahrheit von Begründungen.

## Warum daraus kein Prüfer wird

Ein Werkzeug mit 180 Meldungen, von denen ich keine einzige als echt bestätigt
habe, wäre genau das, was dieser Bestand am 10. September vormittags über eine
andere Messung geschrieben hat: *„Eine Zahl aus einer schlechten Messung ist
keine Auskunft, sondern eine Behauptung mit Ziffern."* Und ein Prüfer, der bei
jedem dritten Zitat anschlägt, wird abgeschaltet statt befolgt.

**Entfernt worden sind deshalb wieder:** `src/zitatstand.js`,
`bin/zitatpruefung.mjs`, der npm-Befehl, der Eintrag im Prüferregister, der
Eintrag bei den Erzeugnislesern und die Gegenprobe. Der Bestand steht wieder
bei 48 Prüfern und 151 Gegenproben.

## Was stattdessen gilt

Die Abhilfe von gestern Abend bleibt die richtige, und zwar **weil** sie eng
ist: Ein Zitat wird geprüft, wenn der Eintrag es **als Zitat deklariert** —
`zitat` und `fundstelle` als eigene Felder, nicht Anführungszeichen im
Fließtext. Dazu die Regel, die das erzwingt: Eine Begründung, in der
Anführungszeichen um mehr als ein paar Wörter stehen, **muss** diese Felder
tragen.

> **Was gemessen werden soll, gehört in ein Feld und nicht in einen Satz.**

Der Unterschied ist derselbe wie zwischen dem Widerrufsregister und einer
Volltextsuche nach „berichtigt": Das eine ist eine Erklärung, die geprüft
werden kann, das andere ein Muster über Prosa.

## Für den nächsten Lauf

Diese Idee folgt so zwanglos aus der Vorrunde, dass sie wiederkommt. Sie steht
deshalb hier mit ihrer Zahl: **180 von 414, keiner davon echt.** Wer sie noch
einmal aufnimmt, braucht zuerst eine Antwort auf die Frage, an der sie
gescheitert ist — woran erkennt man ohne Deklaration, ob ein Satz in
Anführungszeichen eine Fundstelle behauptet oder ein Beispiel gibt?

**Der Stand ist unverändert:** 2204 Testfälle, 151 Gegenproben, 48 Prüfer.
Diese Runde hat nichts hinzugefügt und nichts kaputt gemacht — sie hat eine
Möglichkeit ausgeschlossen und den Grund aufgeschrieben.
