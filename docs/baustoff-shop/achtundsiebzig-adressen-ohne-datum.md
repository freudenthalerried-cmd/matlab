# Achtundsiebzig Adressen ohne Datum

**7. September 2026.** Seit dem 6. September leitet der Bau das Änderungsdatum
jeder Inhaltsseite aus der Änderungsgeschichte ab, statt es aus einem
handgeführten Kopffeld zu nehmen, und gibt es als `dateModified` in der
strukturierten Auskunft aus. Gezählt in der `sitemap.xml` — der Datei, in die
eine Suchmaschine zuerst sieht, wenn sie wissen will, was sich geändert hat:

```
<url> in sitemap.xml:   78
davon mit <lastmod>:     0
```

> **Die Angabe war da, und sie stand nicht dort, wo danach gefragt wird.**

Dieselbe Bauart wie zwei Befunde der letzten Tage: die Marke, die im
Bauwerkzeug lag und deshalb in allen 43 Feedzeilen fehlte, und der
Herstellerverweis, den jede Artikelseite trug und keine Inhaltsseite. Der
Bestand weiß etwas, und die Stelle, die es braucht, kennt es nicht.

---

## Nur wo es eine Quelle gibt

`lastmod` ist eine Behauptung, und eine Suchmaschine, die sie zweimal
widerlegt findet, glaubt sie nicht mehr. Angegeben wird sie deshalb nur, wo
sich eine Quelle datieren lässt:

| Seiten | Quelle | Einträge |
|---|---|---|
| Inhaltsseiten | die Markdown-Datei, aus der sie entstehen | 24 |
| Artikelseiten | die Katalogdatei — ändert sich ein Preis, ändert sich die Seite | 46 |
| Startseite, Lieferseite, Rechtsseiten, Übersichten | das Bauwerkzeug | **keines** |

Für die letzten acht steht **nichts**, und das ist die Entscheidung, nicht die
Lücke: Ihre Quelle ist `bin/website.mjs`, und das ändert sich fast täglich,
ohne dass sich der Satz auf der Seite ändern muss.

> **Ein `lastmod`, das immer heute sagt, ist die Angabe, die eine Suchmaschine
> ignoriert — und es entwertet die richtigen daneben.**

Stand danach: **70 von 78 Einträgen** tragen ein Datum, keines davon
erfunden.

---

## Geprüft

`test/sitemapstand.test.js`, zehn Fälle: die Ableitung (Inhaltsseite,
Artikelseite, ohne Quelle), die Regel für sich (abweichendes Datum, Datum ohne
Quelle, Datum in der Zukunft, leere Sitemap) — und drei über den **Bestand**:

* Jedes `lastmod` in der gebauten Sitemap stimmt mit der Änderungsgeschichte
  seiner Quelle überein — gemessen mit demselben `standAusGit`, das der Bau
  benutzt.
* Die acht Seiten **ohne** Datum stehen namentlich in der Zusicherung. Kommt
  eine neue hinzu, fällt es auf; rutscht eine Inhaltsseite hierher, weil ihr
  Stand verloren ging, ebenfalls.
* Jedes ausgegebene Datum hat Datumsform.

Gegenprobe `sitemap-ohne-aenderungsdatum` nimmt das Datum den 46 Artikelseiten
wieder weg — der Hälfte, bei der ein Preiswechsel der eigentliche Anlass zum
Neubesuch wäre.

---

**Nebenbei geprüft und in Ordnung:** Die Sitemap führt 78 der 82 gebauten
Seiten. Die vier fehlenden sind `404`, `kasse`, `suche` und `warenkorb` — sie
tragen `nurBedienung` und damit `noindex,follow`, und die Entscheidung steht
seit dem 30. August mit ihrer Messung im Bauwerkzeug: 43, 53 und 214 Zeichen
eigener Text gegen 1.173 bei der nächstdünneren Seite. *Eine Sitemap ist eine
Behauptung: diese Seiten lohnen die Aufnahme.*
