# Ein Datum, das jemand nachführen muss

**6. September 2026, abends.** Nach der Preisgültigkeit die zweite Angabe aus
der strukturierten Auskunft, die nur eine Maschine liest. Gezählt, was im
Bestand ausgezeichnet ist:

```
Product              46
Article + FAQPage    24
Organization          1
FAQPage               1
ohne Auszeichnung    10   (404, Kasse, Suche, Warenkorb, Wissensübersicht,
                           fünf Rechtsseiten)
```

Die 24 Inhaltsseiten tragen `dateModified`. Woher es kam, stand in einer Zeile:

```js
dateModified: seite.kopf.stand,   // bin/website.mjs
```

`stand:` ist ein Feld im Kopfblock der Markdown-Datei. Von Hand geschrieben,
von Hand nachzuführen — **und auf keiner Seite sichtbar.** Es hatte genau einen
Abnehmer: diese Zeile.

---

## Gegen die Änderungsgeschichte gehalten

`dateModified` ist nach schema.org *„the date on which the CreativeWork was
most recently modified"*. Das Verzeichnis weiß diese Tatsache ohnehin. Beides
nebeneinandergelegt:

| Datei | Kopffeld | zuletzt geändert | Abstand |
|---|---|---|---|
| `gruppen/kanal.md` | 2026-08-25 | 2026-09-02 | **8 Tage** |
| `system/fassade-100-qm.md` | 2026-08-30 | 2026-09-05 | 6 |
| `system/kellerwand-perimeter.md` | 2026-08-30 | 2026-09-05 | 6 |
| `wissen/kanal-was-zusammengehoert.md` | 2026-08-25 | 2026-08-27 | 2 |
| `wissen/perimeterdaemmung-und-grundmauerschutz.md` | 2026-08-25 | 2026-08-27 | 2 |
| `wissen/kaminzug-aufbau.md` | 2026-08-25 | 2026-08-26 | 1 |
| `wissen/mengen-fuer-100-qm-wdvs.md` | 2026-08-25 | 2026-08-26 | 1 |
| `wissen/wdvs-systemaufbau.md` | 2026-08-25 | 2026-08-26 | 1 |
| `gruppen/daemmung.md` | 2026-09-01 | 2026-09-02 | 1 |
| `gruppen/wdvs.md` | 2026-09-01 | 2026-09-02 | 1 |

**10 von 24.** Und nicht bloß um Tage: Der Eingriff vom 2. September an
`kanal.md` trägt den Titel *„Eine ehrliche Anzeige ist die halbe Ehrlichkeit"* —
seither nennt der Antwortsatz die Lücke im Kanal-Sortiment. Der vom
5. September an `fassade-100-qm.md` heißt *„Fünf versprochen, vier lieferbar"*.
Beides sind **inhaltliche Berichtigungen**.

> **Ein berichtigter Satz unter einem Datum, das vor der Berichtigung liegt.**

Das ist die Auskunft, an der ein maschineller Leser die Aktualität misst — bei
einem Shop, der auf maschinelle Auffindbarkeit gebaut ist, keine Nebensache.
Und es fiel niemandem auf, **weil das Feld auf keiner Seite steht.** Ein
Fehler, den kein Leser sehen kann, wird von keinem Leser gemeldet.

---

## Warum kein Prüfer, sondern ein Wegfall

Der naheliegende Griff wäre ein Prüfer, der `stand:` gegen die
Änderungsgeschichte hält. Er wäre die schlechtere Antwort: Das Feld ist ein
**von Hand geführtes Register über eine Tatsache, die das Verzeichnis ohnehin
kennt** — und dieser Bestand hat an zwei Tagen dreimal gesehen, was davon zu
halten ist (das Prüferregister, die Kopfzahl in `STATUS.md`, der
Gegenproben-Suchtext, der stumm veraltete).

> **Ein Datum, das jemand nachführen muss, ist so aktuell wie sein Gedächtnis.
> Ein Datum, das aus der Änderung selbst kommt, ist es immer.**

Neu: `src/inhaltsstand.js` mit `standAusGit({ pfad, git, heute })`.

* Eine Datei mit **offener** Änderung im Baum ist **heute** geändert — alles
  andere behauptete ein Alter, das sie nicht hat.
* Sonst das Datum des letzten Eingriffs (`git log -1 --format=%cs`).
* Kein Verzeichnis, keine Geschichte, keine Datumsform: **`null`** — und was
  nicht bekannt ist, bekommt keinen Schlüssel. Die Seite trägt dann gar kein
  `dateModified`, statt eines erfundenen.

`stand:` bleibt im Kopfblock und ist seither der **Rückfall** für genau diesen
Fall.

---

## Was das nicht kann — und hier steht, damit niemand mehr hineinliest

Der Zeitpunkt der letzten **Einspielung** ist nicht der Zeitpunkt der letzten
**inhaltlichen** Änderung: Eine berichtigte Rechtschreibung verschiebt ihn
genauso. Das ist die richtige Richtung — `dateModified` fragt nach der Datei,
nicht nach der Bedeutung —, aber es ist eine Grenze, und sie steht in der
Quelle.

---

## Die zehn abgelaufenen Werte bleiben stehen

Sie zu berichtigen wäre die erste Regung und der zweite Fehler:

> **Das Feld zu berichtigen hieße, die Dateien anzufassen — und damit würde die
> abgeleitete Angabe für zehn Seiten „heute" behaupten.**

Der Wert, den sie früher falsch geliefert haben, wird von niemandem mehr
gelesen. Die wahre Geschichte dieser zehn Seiten steht im Verzeichnis und
bleibt nur erhalten, wenn man sie in Ruhe lässt. Der Prüfer hält deshalb fest,
**dass** es die abgelaufenen Kopffelder gibt, und verlangt nur, dass keine
Seite wieder ihren Wert nennt.

---

## Geprüft

`test/inhaltsstand.test.js`, neun Fälle in zwei Teilen:

* **Die Ableitung für sich:** verbucht → das Datum des Eingriffs; offen oder
  unverfolgt → heute (und die Geschichte wird dann gar nicht erst befragt);
  kein git, keine Geschichte, keine Datumsform → `null`.
* **Der Bestand:** Jede gebaute Inhaltsseite nennt den Stand, den das
  Verzeichnis für ihre Quelle führt — der Prüfer, dessen Reichweite so groß ist
  wie die Regel, die er prüft. Die Zusicherung über die Zahl der gemessenen
  Seiten steht **vor** der Schleife, damit ein leerer Bestand nicht als grün
  durchgeht. Der zweite Fall verlangt nicht, dass es abgelaufene Kopffelder
  gibt, sondern dass keine Seite ihren Wert nennt.

Gegenprobe `stand-aus-dem-gedaechtnis`: Sie setzt `dateModified:
seite.kopf.stand` wieder ein, baut und verlangt, dass es auffällt.

Nachgezogen: `gruppe/daemmung`, `gruppe/kanal`, `gruppe/wdvs`,
`system/fassade-100-qm`, `system/kellerwand-perimeter` und fünf Wissensseiten
tragen seit diesem Bau ihr echtes Änderungsdatum.

---

**Familie.** Dieselbe wie die Kopfzahl in `STATUS.md` und wie das
Prüferregister: *ableiten statt aufschreiben.* Und zugleich die Familie des
gestrigen Befundes — eine Angabe, die nur eine Maschine liest, wird von keinem
Menschen berichtigt.
