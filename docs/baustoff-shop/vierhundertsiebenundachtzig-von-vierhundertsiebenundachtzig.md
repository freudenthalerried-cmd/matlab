# 487 von 487

*Lauf vom 15. September 2026. Ungesehene Regelstellen 19 → **0**.
Dreiundzwanzig Testfälle, eine Berichtigung an einem Leser, sechs Einträge mit
Grund, eine Gegenprobe. Und eine Messung, die absichtlich kein Prüfer wurde.*

---

## Die offene Frage der Vorrunde — und warum sie kein Prüfer wird

Gestern blieb die Frage: *Welche der 168 Registervorgaben bekommt von außen je
etwas anderes zu sehen als ihre eigene Vorgabe?* Sie ist heute gemessen:

**44 von 168** — jede vierte Tür — werden von keinem Testfall je benutzt.

Und dann ist die Messung angesehen worden, bevor sie ein Prüfer wurde. Das
Ergebnis: **Sie taugt nicht dazu.** Eine Vorgabe, die nie überschrieben wird,
ist kein Befund. `beiwertbefund(quellen, mindestens = MINDESTENS_VORGABEN)` aus
dem Prüfer von gestern steht selbst auf dieser Liste — und die Regel dahinter
ist trotzdem geprüft, weil die **Vorgabe** klein genug ist, dass ein Testfall
sie mit einer kleinen Quellenliste auslöst. Die Tür wird nicht gebraucht, weil
der Raum ein Fenster hat.

> **„Nie benutzt" und „nicht zu erreichen" sind zwei verschiedene Sätze.**

Die Frage, auf die es ankommt — *ist die Regel dahinter je rot gesehen worden?*
—, beantwortet `pruefe-regeln` seit dem 14. September direkt. Ein zweiter
Prüfer daneben, der dasselbe über einen Umweg schätzt, wäre kein zweiter Zeuge,
sondern ein zweiter Zähler. Die 44 sind gemessen und hier festgehalten; ein
Prüfer sind sie nicht.

Damit ist dieselbe Entscheidung an drei Tagen dreimal gefallen — 13. September
(Kopfzeilen), 15. September (die 84 Befundfunktionen), 15. September (die 44
Türen). Beim dritten Mal gehört sie benannt: **Eine Messung wird erst dann ein
Prüfer, wenn ihre Meldung für sich genommen richtig ist.**

## Was stattdessen geschah: die letzten neunzehn

| Modul | Regel | warum sie nie gefeuert hat |
|---|---|---|
| `ausschluss.js` | `eigenes-wort-ausgeschlossen` | kein Ausschlusswort steht öfter im eigenen Text als erlaubt |
| `aussenlage.js` | `versuch-ohne-datum` | jeder Versuch im Vermerk trägt ein lesbares Datum |
| `bezeichnungsmass.js` | `bestand-gewandert` | der Katalog ist seit der Messung derselbe |
| `gatestand.js` | `ueberschrift-ohne-zahl` | die Überschrift steht seit dem ersten Tag da |
| `kennzahlen.js` | `kennzahl-verschwindet` | beide Läufe rechnen dieselbe Liste |
| `belegpruefung.js` | `geprueft-aber-nicht-gedruckt`, `kuerzel-statt-wort` | die Belege drucken, was geprüft wurde, und schreiben die Einheit aus |
| `pruefregister.js` | `grund-ohne-befehl` | jeder Verzicht zeigt auf einen Befehl, den es gibt |
| `systemlisten.js` | `ohne-artikel` | **siehe unten — sie war gar nicht zu erreichen** |
| `weisungsstand.js` | `ausnahme-ohne-grund` | die eine Ausnahme trägt einen ganzen Grund |
| `zwillingszahlen.js` | `ausnahme-ohne-grund` | jede Ausnahme trägt einen belastbaren Grund |

Elf Regeln, die schwiegen, weil der Bestand in Ordnung ist. Genau das ist der
Grund, warum ihr Schweigen nichts über sie aussagte.

## Zwei, die längst gefeuert hatten und niemand nannte

`mehrlieferung-ohne-bedingung` (`src/lieferungen.js`) und `zeile-unlesbar`
(`src/posteingang.js`) standen auf der Liste der ungesehenen Regeln — und
**beide wurden von einem Testfall seit Wochen ausgelöst.** Der eine zählte die
Meldungen (`b.meldungen.length === 1`) und prüfte die Fundstelle, der andere
las die Zeilennummer aus dem Text. Keiner nannte den Regelnamen.

> **Ein Testfall, der eine Regel auslöst und nicht nennt, hat sie geprüft und
> nicht bezeugt.**

Das ist keine Formalie des Zählers. Wird der Regelname morgen umbenannt,
laufen beide Testfälle weiter grün durch — sie messen ein Verhalten und
behaupten nichts über den Namen, an dem Gegenprobenlauf, Mutationsschutz und
Prüferausgabe hängen. Zwei Zeilen `assert.deepEqual(…map(m => m.regel), […])`
haben das behoben.

## Der Fund: eine Regel, die über ihren Leser nicht zu erreichen war

`ohne-artikel` meldet eine Systemliste, deren Kopfzeile keinen einzigen Artikel
nennt — *eine Liste ohne Artikel ist ein Merkblatt und keine Stückliste.* Beim
Versuch, sie anschlagen zu sehen, kam etwas anderes heraus:

```js
const skuZeile = /^skus:\s*(.+)$/m.exec(text);
```

`\s` schließt den Zeilenumbruch ein. Bei einer leeren Kopfzeile `skus:` sprang
die Suche in die **nächste** Zeile und las den Trennstrich `---` des
Vorspanns als Artikelnummer. Gemeldet wurde dann `sku-gibt-es-nicht` — eine
richtige Meldung mit dem falschen Grund. Und `ohne-artikel` konnte über diesen
Leser überhaupt nicht entstehen: `skus` war nie leer.

> **Ein `\s` am Zeilenende liest die nächste Zeile mit.**

Berichtigt auf `[ \t]`. Die Gegenprobe
`die-kopfzeile-liest-die-naechste-zeile-mit` stellt den alten Ausdruck wieder
her; rot gesehen am 15. September. Gegenproben 309 → **310**.

Das ist der zweite Fund dieser Art in zwei Tagen — gestern die geteilten
`lastIndex`, heute das gierige `\s`. Beide Male hat ein regulärer Ausdruck
still etwas anderes gelesen als das, was danebenstand.

## Die sechs, die bleiben — und jetzt mit Grund

Nach den neunzehn blieben sechs Stellen in `bin/`-Werkzeugen. Am 14. September
ist entschieden worden, sie **nicht** nach `src/` zu heben; heute steht dieser
Grund dort, wo ein Prüfer ihn liest: als sechs Einträge in `REGEL_GEPRUEFT`,
jeder mit der Fundstelle des Testfalls, der die entscheidende Funktion misst.

> **Ein Grund, der nur in einem Dokument steht, wird von keinem Prüfer
> gelesen.**

Alle sechs kleben einen Regelnamen auf eine Antwort, die eine Funktion in
`src/` gegeben hat: `luecken()` und `widersprueche()` (`vorgangsstand.js`),
`pruefeAnfrageAufGeheimnis()` (`kundenanfrage.js`), `systembruch()`
(`systemtreue.js`, dreimal). Jede dieser vier Funktionen ist in beide
Richtungen gemessen.

## Die Sperrklinke steht auf null

`UNGESEHENE_HOECHSTENS`: 80 → 67 → 56 → 47 → 43 → 38 → 31 → 19 → **0** von 487.

**Null heißt nicht „fertig".** Es heißt: Jede Regelstelle dieses Bestandes ist
entweder von einem Testfall rot gesehen worden oder steht mit einem Grund im
Verzeichnis. Die nächste geschriebene Regel bricht diese Sperre sofort — und
genau dafür steht sie auf null und nicht auf einem bequemen Wert.

Der Eintrag im Zwillingsregister ist damit **entfallen**: 0 liegt nicht mehr im
engen Band, und `pruefe-zwillinge` verlangt in dieser Richtung dasselbe wie in
der anderen. Enges Band 36 → 35 Zahlen.

## Was dieser Lauf nicht erreicht hat

- **Die 44 ungenutzten Türen** sind gemessen und nicht angesehen. Ob unter
  ihnen eine ist, deren Vorgabe eine Regel deckt, die es ohne sie nicht gäbe,
  ist offen — `pruefe-regeln` sagt nur, dass **irgendein** Testfall sie
  ausgelöst hat, nicht wodurch.
- **Regelnamen, die nur in einem Testfall stehen und sonst nirgends**, fallen
  keinem auf. Die Gegenrichtung des Zählers — ein bezeugter Name, den es im
  Bestand nicht mehr gibt — prüft `ERFUNDEN_GEPRUEFT` nur für das Verzeichnis,
  nicht für die Testdateien.
- **Der Katalog ist unverändert.** Die Erweiterung auf hundert Artikel liegt
  seit dem 28. August beim Auftraggeber; `bestand-gewandert` ist seit heute die
  Regel, die den Tag meldet, an dem sie kommt.

## Die Frage für den nächsten Lauf

Was passiert am ersten Tag, an dem die Sperrklinke auf null steht und jemand
eine Regel schreibt? Sie bricht — richtig. Aber sie bricht auch, wenn jemand
eine Regel schreibt **und** sie im selben Zug bezeugt, falls die Reihenfolge
falsch ist. Ob die Sperre auf null ein Werkzeug ist oder ein Stolperdraht, ist
erst am nächsten neuen Prüfer zu sehen — und das ist die einzige ehrliche
Auskunft darüber heute.
