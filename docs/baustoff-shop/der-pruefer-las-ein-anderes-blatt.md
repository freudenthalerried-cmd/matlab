# Der Prüfer las ein anderes Blatt

**5. September 2026, abends.** Der Bestellweg ist ausgeschaltet (Gate 26). Der
**Anfragetext** ist damit das einzige Papier, das diesen Shop heute verlässt —
der Kunde kopiert ihn aus der Kasse in seine eigene Mail. Ich habe einen
echten erzeugt: sechs Positionen, 100 m² Fassade, 1.571,55 € netto, aus dem
echten Katalog mit bestätigten Preisen.

Vier Befunde, und der erste erklärt, warum die anderen so lange stehen
konnten.

---

## 1. Der Prüfer las eine Fassung, die es beim Kunden nie gab

So kam der Text aus `bin/belegpruefung.mjs` — dem **einzigen** Prüfer über
diesen Text:

```
100 M2        Fassaden EPS 5 cm 0,5 m2                    POS-12583   4,67 €
500 KG        Capatect Klebe- und Spachtelmasse 186 M 25 kg
  6 KRT       Capatect Universaldübel Schraubdübel 053 115, 100 STK, 1 KAR
```

`M2`, `KG`, `KRT` — die Kürzel aus den Lieferantenrechnungen, in einem
Kundentext. In der **Kasse** steht dort „m²", „kg", „Karton".

Der Grund: `baueKundenanfrage` nahm die Einheitentafel als **Aufrufparameter
mit Vorgabewert `{}`**.

```js
const menge = `${mengeText} ${einheiten[p.einheit] ?? p.einheit ?? 'Stk'}`;
```

Die Oberfläche reichte sie herein (`einheiten: D.einheiten || {}`), der Prüfer
nicht. Beide Seiten funktionierten für sich.

> **Ein Prüfer, der eine andere Fassung liest als der Empfänger, prüft ein
> Dokument, das niemand bekommt.**

Und es ist ein Vorgabewert, der **durchlässt**. Das Haus kennt die Regel
inzwischen: `kennzahlen({begriffe})` wirft ohne die Zahl, `zahlwegName` wirft
ohne Kundennamen, `darfBestaetigtWerden({})` sperrt statt zu erlauben. Hier
stand die Ausnahme, und sie stand an dem Text, der als einziger hinausgeht.

**Geändert:** `kundenanfrage.js` holt `einheitText` selbst aus `format.js` —
eine Stelle, kein Parameter, der vergessen werden kann. Ein *unbekanntes*
Kürzel wird weiterhin durchgereicht statt geraten; das entscheidet `format.js`,
und dort steht auch, warum („PAK als Paket zu lesen ist eine Vermutung, und
sie stünde dann auf einer Rechnung").

**Neu die Regel, die es gefunden hätte:** `pruefeBeleg` meldet
`kuerzel-statt-wort`, wenn eine Zeile mit einer Zahl beginnt und darauf ein
Kürzel aus `EINHEITEN` folgt. Eng gesucht — die Artikelnamen selbst tragen
Kürzel („100 STK, 1 KAR" steht im Namen eines Dübelkartons), und dort gehören
sie hin: Der Name kommt vom Lieferanten und wird nicht umgeschrieben.

Dazu die dritte Richtung in `einheitenbefund` (seit heute Mittag):
`einheit-ohne-wort` meldet eine Katalogeinheit, für die `EINHEITEN` kein
lesbares Wort führt — dann ginge das Kürzel an den Kunden.

---

## 2. Das Gewicht war um den Faktor fünf zu klein

```
Gewicht               125,0 kg  (für 4 Positionen nicht hinterlegt)
```

In diesem Korb liegen **500 kg** Klebe- und Spachtelmasse. Sie sind eine der
vier „nicht hinterlegten" Positionen: Der Artikel wird je Kilogramm verkauft
und trägt kein `gewichtKg`.

500 kg sind aber keine Schätzung. Es ist die bestellte Menge, in Kilogramm.

> **Die eine Zahl, die entscheidet, ob das eigene Fahrzeug reicht oder eine
> Spedition nötig ist, war um den Faktor fünf zu klein — und der Klammerzusatz
> ließ die Lücke woanders vermuten.**

Der Kommentar darüber sagt genau das Richtige: *„Eine Summe über Artikel mit
unbekanntem Gewicht wäre eine Untergrenze, die wie eine Summe aussieht."* Er
beschreibt den eigenen Fehler und hat ihn nicht verhindert.

**Geändert:** Bei Einheit `KG` ist das Positionsgewicht die Menge. Dieselbe
Rechnung deckt die beiden Artikel mit `gewichtKg: 1` bei Einheit `KG` ab —
dieselbe Identität, die heute Mittag schon den Sperrgutprüfer blind gemacht
hat. **Jetzt 625,0 kg, drei offene Positionen.**

---

## 3. Der Frachtgrund war für den Fall geschrieben, den es nicht gibt

```
Zustellung            83,00 €
```

83,00 € sind 75,50 € Pauschale **plus 7,50 € Kranentladung**. Der Satz, der
das erklärt, existiert und ist heute früh eigens überarbeitet worden:

> Pauschale plus 1× Kranentladung — Zahl je Sperrgut-Position gerechnet,
> Einstufung aus der Warengruppe geschätzt

Er stand im Zweig `if (mehrere)`. Der Katalog führt **einen** Lieferanten; der
zweite kommt erst mit der Artikelliste des Auftraggebers.

> **Die Aufschlüsselung war für den Fall geschrieben, den es nicht gibt.**

Damit war der Anfragetext die vierte Fläche, an der die Sperrgut-Schätzung
blank blieb — nachdem `eine-flaeche-gebessert-drei-blank.md` gestern drei
andere nachgezogen hat. Und es ist die einzige Fläche, die **das Haus
verlässt**.

---

## 4. Wo der Mailknopf fehlt, stand kein Wort

Die Kasse bietet „Als Mail öffnen" — aber nur, wenn `mailtoAdresse` eine
Adresse liefert. Sonst fällt der Knopf weg, wortlos.

**Dass er wegfällt, ist seit dem 1. September gemessen und begründet**
(`test/kundenanfrage.test.js`): Mailprogramme kappen lange `mailto:`-Adressen
stillschweigend, eine halbe Positionsliste wäre schlimmer als kein Knopf, und
wer die Grenze anhebt, „um den Knopf endlich sichtbar zu machen", schaltet
genau diese Kürzung frei. Das steht, und es bleibt.

Was nie geschah: **es dem Kunden zu sagen.** Dabei hat sich das Haus zu genau
dieser Stelle schon festgelegt — in `bin/website.mjs`, über der
Betreiberadresse:

> „…weil ein leeres `email` der Oberfläche erlaubt zu sagen, **warum** kein
> Mailknopf da ist, statt ihn stillschweigend wegzulassen."

Die Oberfläche sagte es in keinem der beiden Fälle.

> **Eine Zusage im Kommentar ist keine Prüfung — und keine Umsetzung.**

**Geändert:** `mailtoWeg()` gibt die Adresse **oder** den Grund zurück
(`keine-adresse`, `zu-lang`), und die Kasse schreibt ihn hin. `mailtoAdresse`
ist weg: Nach der Umstellung rief sie außerhalb der Tests niemand mehr, und
`npm run pruefe-ungerufen` hat das in derselben Minute gemeldet. *Eine Hülle,
die nur noch Proben bedienen, ist genau der Fall, für den es diesen Prüfer
gibt.*

### Der Preis, offen benannt

Die beiden Sätze aus Befund 2 und 3 kosten Zeichen, und Zeichen kosten den
Knopf. Gemessen an den Prüfkörben: Vor heute gab es ihn bei **einer**
Position, jetzt bei keiner mehr, sobald der Kleinmengensatz danebensteht.

Am 2. September ist dieselbe Abwägung schon einmal getroffen worden, als der
Kleinmengensatz dazukam: **Der Hinweis wiegt schwerer als die Abkürzung.**
Der kopierbare Text bleibt in jedem Fall, und er ist der Hauptweg — die
Mailadresse war immer nur die Abkürzung. Neu ist, dass der Kunde jetzt liest,
warum sie fehlt.

---

## Was das gekostet hat

| | |
|---|---|
| Neue Prüfer | keine — `pruefe-belege` bekam eine Regel, `pruefe-gebinde` eine dritte Richtung |
| Neue Gates | keine |
| Gegenproben | **61 für 35 Prüfer** (vorher 60) |
| Testfälle | 1615 (vorher 1611) |

## Was offen bleibt

- **Drei Positionen ohne Gewicht** in diesem Korb: EPS-Platten, Glasgewebe,
  Dübelkarton. Für Flächenware braucht es ein Gewicht je m² — es steht in der
  Artikelliste des Lieferanten, die ohnehin angefragt wird.
- **Die Kranentladung selbst bleibt geschätzt.** Der Satz sagt es jetzt auch
  dem, der den Text aus dem Haus trägt; belegt wird sie mit der Palettenfrage.
