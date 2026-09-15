# Der Beleg, den nur sein Prüfer erzeugt hat

**3. September 2026.** Seit dem Morgen liest `npm run anfrage-lesen` eine
eingegangene Anfrage zurück, statt sie abtippen zu lassen — drei der fünfzehn
Minuten je Anfrage, und die eine Stelle, an der ein Tippfehler falsche Ware auf
eine Baustelle bringt.

Danach hörte der Weg auf. Der nächste Schritt des Anfragebetriebs heißt
**„Angebot schreiben und senden"** und ist mit fünf Minuten veranschlagt. Die
Funktion dafür gibt es seit dem 31. August: `erzeugeAngebot` in `beleg.js`, mit
Bindefrist nach § 862 ABGB, Zahlungsbedingung, Pflichtangaben nach § 11 UStG,
eigener Prüfung und siebzehn Testfällen.

Aufgerufen hat sie außerhalb der Tests genau eine Stelle:

```
$ grep -rn "erzeugeAngebot" bin/
bin/belegpruefung.mjs:149:    text: erzeugeAngebot(korb, { nummer: 'AN-0001', ...gemeinsam }).text,
```

**Ihr eigener Prüfer, mit einem erfundenen Warenkorb.**

> **Ein Beleg, den nur sein Prüfer erzeugt, ist ein Muster und kein
> Betriebsmittel.** Wer heute ein Angebot schreiben müsste, schriebe es von
> Hand — und dann gilt keine der Regeln, die dieser Bestand darüber kennt:
> keine Bindefrist, kein Zahlungsziel null, keine Anschrift des Ausstellers,
> keine Prüfung, ob eine Einkaufszahl durchgerutscht ist.

Der Leser hatte einen Ausgang und keinen Empfänger. Dasselbe gilt für
`baueVorgang` in `vorgang.js`, die Klammer über Angebot, Auftragsbestätigung,
Lieferantenbestellungen und Rechnung: geschrieben, geprüft, von keinem Werkzeug
je gerufen.

## `npm run vorgang`

```
npm run vorgang -- anfrage.txt --kunde ../kunden/mueller.json --nummer 2026-0001
npm run vorgang -- anfrage.txt --kunde … --stufe bestaetigung
```

Vier Prüfungen stehen vor der Ausgabe, und jede kann den Lauf rot beenden:

1. **Die Anfrage wird nachgerechnet** (`leseAnfrage`). Weicht eine Summe um
   mehr als einen halben Cent ab, gibt es keinen Beleg, sondern den Grund.
2. **Beide Rechnungen müssen dasselbe sagen.** Die Kasse rechnet mit
   `kundenWarenkorb` (ohne Einkaufspreise), der Beleg mit `berechneWarenkorb`
   (mit). Ein Testfall hält die beiden aneinander; hier steht dieselbe Prüfung
   am lebenden Fall — denn hier wird aus der Zahl, die der Kunde gesehen hat,
   eine Zahl mit Bindefrist.
3. **Der fertige Text geht durch `pruefeBelege`** — denselben Prüfer wie im
   Gesamtlauf, samt der Lieferantenbestellungen, damit auch die Regeln
   *zwischen* zwei Papieren greifen. Eine Beanstandung heißt: nichts ausgeben.
4. **Die Freigaben des Vorgangs** stehen über dem Beleg: Kundendaten (Gate 7),
   Annahme (AGB Punkt 2), Bestellung (Gate 20).

Die Auftragsbestätigung entsteht **nicht** gegen die eigene Sperre: Sie
schließt nach AGB Punkt 2 den Vertrag, und solange die Annahme gesperrt ist —
heute, weil die Lieferzeit des Lieferanten fehlt —, endet der Lauf rot statt
mit einem Papier.

Drei Dinge tut das Werkzeug bewusst nicht:

| | Warum |
|---|---|
| Vorgangsnummern ziehen | Ein Werkzeug, das selbst nummeriert, macht aus dem zweiten Ausdruck einen zweiten Vorgang. `--nummer` ist Pflicht. |
| Die Rechnung erzeugen | Sie braucht Lieferdatum und Zahlungseingang. Beides ist kein Kommandozeilenwert, sondern ein Vorgang. |
| Kundendaten ablegen | `--kunde` ist ein Pfad **außerhalb** dieses Verzeichnisses. Firmenname, Anschrift und UID eines Kunden sind seine Daten; das Repository ist bis heute öffentlich. |

Steht eine Pflichtangabe noch offen, druckt der Beleg die Marke
`[[ … — FEHLT ]]`, und **unter** dem Text — dort, wo ihn liest, wer ihn kopieren
will — steht, dass er so nicht versandfertig ist. Heute ist das die Lieferzeit
des Lieferanten, eine der fünf offenen Fragen an ihn.

## Was der erste echte Lauf gefunden hat

Der erste Aufruf mit `--stufe bestaetigung` endete rot, und zwar an einer
Stelle, die niemand gesucht hatte:

```
✗ Belegprüfung
    Auftragsbestätigung zitiert Punkt 4 der AGB — im Verweisregister steht
    er nicht, also hält ihn niemand gegen die Gliederung
```

Der Grund: `baueVorgang` hängt an die Auftragsbestätigung die
**Lieferhinweise** aus `rechtstexte.js` — vier Sätze über Übernahme,
Rügefrist und Teillieferungen. Sie zitieren zwei AGB-Punkte. Der Prüfer
`pruefe-belege` baute seine Auftragsbestätigung **ohne diese Hinweise** und
bekam die Verweise deshalb nie zu sehen.

> **Ein Prüfer, der ein Dokument liest, das der Betrieb nie erzeugt, prüft eine
> Möglichkeit statt eines Falls.** Derselbe Satz steht seit dem 1. September
> über der Wahl des Warenkorbs in genau diesem Prüfer — eine Ebene tiefer war
> er noch nicht angekommen.

### Und dahinter lag ein falscher Verweis

Von den beiden ungeprüften Verweisen war einer falsch. Der Hinweis

> „**Wer übernimmt, übernimmt für Sie.** Auf einer Baustelle nimmt an, wer
> gerade dort ist — ein anderes Gewerk, der Bauherr, der Polier. Die Übernahme
> wirkt für Sie als Besteller."

berief sich auf **AGB Punkt 6**. Punkt 6 heißt „Fracht, Sperrgut und
Baustellenanlieferung". Der Wortlaut des Hinweises steht fast Satz für Satz in
**Punkt 7** — „Abweichende Lieferanschrift und Empfangsvollmacht".

Das ist keine Formalie: Der Kunde, der nachschlägt, warum die Übernahme durch
ein fremdes Gewerk für ihn wirkt, findet unter Punkt 6 eine Frachtklausel.
Dahinter hängt die Rügefrist nach § 377 UGB — im B2B eine echte Obliegenheit,
und bei einer Abdichtungsbahn zu 355 € netto je Rolle eine teure.

**Die Regel dagegen gab es.** `verweis-zeigt-woanders` in `belegpruefung.js`
prüft genau das: ob der zitierte Punkt trägt, was er tragen soll. Sie hat nie
zugeschlagen, weil zwei Dinge zusammenkamen — das Register kannte den Punkt
nicht, und der Prüfer las das Dokument nicht, das ihn zitiert. Zwei Lücken, die
sich gegenseitig verdeckten.

## Was geändert wurde

- **`PUNKT_EMPFANGSVOLLMACHT`** ist jetzt eine Konstante mit dem Wert
  `'AGB Punkt 7'`. Der Filter in `lieferhinweise()` benutzt dieselbe Konstante:
  Zwei Schreibweisen einer Fundstelle wären genau der Fehler, der hier behoben
  wird — eine Berichtigung hätte den Filter stehen lassen, und der Hinweis wäre
  plötzlich immer erschienen.
- **`AGB_VERWEISE`** führt jetzt vier Punkte statt zwei: 2 (Vertragsschluss),
  **4 (Streckengeschäft)**, **7 (Empfangsvollmacht)**, 9 (Zahlungsbedingung).
- **`pruefe-belege`** baut die Auftragsbestätigung **zweimal**: einmal an die
  Rechnungsanschrift, einmal an eine abweichende Baustelle. Die Hinweise hängen
  am Lieferort — nur die reichere Fassung zu prüfen hieße, den Regelfall
  ungeprüft zu lassen.
- **Drei Testfälle** in `test/rechtstexte.test.js` halten das fest, und keiner
  schreibt eine Nummer fest: Der Punkt, auf den sich der Hinweis beruft, **muss
  die Empfangsvollmacht regeln** — welche Nummer er trägt, ist Sache der
  Gliederung.
- **Eine Gegenprobe** (`lieferhinweis-zeigt-auf-den-falschen-punkt`) stellt den
  falschen Verweis wieder her und verlangt, dass `pruefe-belege` rot wird. 33
  von 33 schlagen an.

## Was offen bleibt

Die Rechnung entsteht weiterhin in keinem Werkzeug. Sie braucht Lieferdatum und
Zahlungseingang — und einen Zahlungsanbieter, der eine Ausgabe ist und beim
Auftraggeber liegt. Bis dahin wäre eine Rechnung aus diesem Werkzeug ein Papier
über Geld, das niemand bekommen hat.

Ebenso offen: die Ablage. `ablageEintraege()` weiß, welche Spuren ein Vorgang
hinterlässt; geschrieben wird bis heute keine. Dieses Werkzeug legt bewusst
nichts ab — ein Werkzeug, das nebenbei Dateien anlegt, ist im ersten
Betriebsmonat die Quelle der Frage „welcher Stand gilt".

## Verweise

- `shop/bin/vorgang.mjs` — das Werkzeug
- `shop/test/vorgangwerkzeug.test.js` — acht Proben am echten Bestand
- `shop/src/rechtstexte.js` — `PUNKT_EMPFANGSVOLLMACHT`, `AGB_VERWEISE`
- [`die-anfrage-zuruecklesen.md`](./die-anfrage-zuruecklesen.md) — der Schritt davor
- [`ein-verweis-auf-eine-nummer.md`](./ein-verweis-auf-eine-nummer.md) — warum es das Verweisregister gibt
