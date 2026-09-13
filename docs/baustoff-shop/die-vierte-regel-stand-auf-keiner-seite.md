# Die vierte Regel stand auf keiner Seite

**7. September 2026.** `wissen/redaktionsprinzipien` ist die
Glaubwürdigkeitsseite dieses Shops. `llms.txt` verweist auf sie mit den Worten
*„Wie geprüft wird"*. Sie führt vier Regeln, und die vierte lautete:

> **Viertens: Wir sagen auch, wofür etwas nicht taugt.** *Jede Produktseite hat
> einen Abschnitt dazu.* Das kostet Umsatz an der einen Stelle und spart ihn an
> der anderen — eine Rücklieferung ist für beide Seiten teurer als ein
> verlorener Auftrag.

Gezählt über die 46 gebauten Artikelseiten:

```
Technische Kennwerte          46
Lieferung                     46
Wird damit zusammen verbaut   32
Gehört zu diesen Systemen     32
Weitere Artikel aus …         30
Wofür etwas nicht taugt        0
```

Auch im Fließtext: **keine einzige** Artikelseite enthält „nicht geeignet",
„ungeeignet" oder „nicht für".

> **Eine Regel, die auf der eigenen Seite steht und auf keiner anderen
> eingelöst ist, ist eine Behauptung über den eigenen Betrieb.**

Und sie ist teuer in der stillen Richtung: Die Regel begründet sich selbst mit
der Rücklieferung, die niemand will — der Kunde bestellt XPS für die Fassade
oder Reibputz statt Silikatputz, und beide merken es zu spät.

---

## Warum der Abschnitt nicht einfach geschrieben wurde

Eignungsgrenzen sind technische Aussagen, und **Regel zwei derselben Seite**
sagt: *„Eine Zahl ohne Herkunft ist keine Zahl."* Die Artikelseiten führen seit
jeher keine Kennwerte, weil sie ins Merkblatt des Herstellers gehören und sich
dort ändern. Sie hier zu erfinden wäre der teurere Fehler — und aus dieser
Umgebung sind die Herstellerseiten gesperrt.

Der Weg lag zwischen beidem: **Der Shop weiß etwas über Grenzen, es steht nur
woanders.**

* die **Wissensseiten mit Warengruppe** — „XPS oder EPS: was passiert, wenn man
  es vertauscht", „Verarbeitung bei Kälte und Nässe", „Untergrund prüfen";
* die **Abgrenzungssätze der Gruppenseite** — was auf der Systemliste steht und
  nicht im Regal;
* das **Merkblatt**, das die Seite ohnehin verlinkt.

---

## Was jetzt auf jeder der 46 Seiten steht

Ein Abschnitt **Wofür dieser Artikel nicht gedacht ist**, abgeleitet aus genau
diesen drei Quellen:

1. Ein Satz, der sagt, **wo** die Eignungsgrenzen stehen — im Merkblatt, oben
   verlinkt — und dass wir sie nicht abschreiben. Fehlt das Merkblatt, sagt der
   Satz das, statt eine Grenze zu erfinden.
2. **Was wir in dieser Warengruppe nicht führen** — die Abgrenzungssätze der
   Gruppenseite, gelesen mit `abgegrenzteStaemme`, also demselben Leser, mit
   dem die Kampagne prüft, ob ein Keyword auf eine Absage bietet. Auf 26 der
   46 Seiten steht etwas.
3. **Die Wissensseiten der Warengruppe**, mit ihrer Frage als Zeile: Auf einer
   XPS-Seite steht damit *„XPS oder EPS — welche Platte wohin: Wann nimmt man
   XPS und wann EPS, und was passiert, wenn man es vertauscht?"*

Der Abschnitt steht auf **jeder** Artikelseite, auch wenn der Bestand für sie
nur das Merkblatt hergibt. Eine Seite, die ihn weglässt, weil nichts da ist,
sieht aus wie eine Seite ohne Grenzen.

---

## Die Regel sagt jetzt, was sie tut

Ein Abschnitt, der auf Quellen zeigt, ist nicht dasselbe wie „wir sagen, wofür
etwas nicht taugt". Der Unterschied gehört auf die Seite, nicht in einen
Kommentar — die Regel ist deshalb ergänzt: *„…und er schreibt nichts ab. Wo die
Eignungsgrenzen stehen, sagt er; was wir aus eigener Kenntnis dazu wissen,
steht darin verlinkt."* Darunter, kursiv, der Befund von heute: bis zum
7. September stand nur der erste Satz, und keine der 46 Seiten hatte den
Abschnitt.

---

## Geprüft

`test/eignungsgrenzen.test.js`, acht Fälle: die Ableitung (Warengruppe,
doppelte Sätze, fehlende Gruppe), die Regel für sich — und drei über den
**Bestand**: Jede der 46 Seiten trägt den Abschnitt, jeder Abschnitt nennt das
Merkblatt als Quelle statt eigener Kennwerte, und die Redaktionsseite
verspricht ihn weiterhin *und* sagt, wie er entsteht.

Gegenprobe `produktseite-ohne-eignungsgrenzen` lässt ihn auf den Kaminseiten
weg — dort, wo die Warengruppe keine eigenen Abgrenzungssätze hat und die Lücke
am wenigsten auffiele.

---

**Der Preis, benannt.** Der Abschnitt bringt einen weitgehend gleichen Absatz
auf alle 46 Seiten, und `npm run pruefe-dubletten` misst genau das: 93 von 124
Wörtern stehen auf jeder Seite. Der Prüfer bleibt grün, aber die Richtung ist
die falsche — und die Antwort darauf ist dieselbe wie bei den Kennwerten: Es
sind die **Herstellerdatenblätter und die Artikelliste des Lieferanten**, die
je Artikel etwas anderes sagen würden. Beide stehen als offene Punkte im
Register, beide hängen an einem Gespräch, das der Auftraggeber führt.
