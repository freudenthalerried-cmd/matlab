# Ein Anker ist kein Bereich — 81 Seiten ohne Hauptbereich

**31. August 2026.** Der Zweig-Durchgang davor endete mit einem sauberen
Ergebnis: Von allen `existsSync`-Verzweigungen fiel nur eine still zurück,
und die ist geprüft. Alle übrigen — `website.mjs`, `kampagne.mjs`,
`preisabgleich.mjs` — brechen ohne Preisdatei mit Ausgangscode 2 und
genannter Ursache ab. **Kein weiterer stiller Rückfall im Bestand**, hier
vermerkt, damit ihn niemand noch einmal sucht.

Also ein anderes Feld: Was liest eigentlich, wer die Seiten nicht sieht?

## Die Messung

Acht bauliche Zusicherungen über alle 81 gebauten Seiten geprüft —
Sprachauszeichnung, genau eine `h1`, keine Überschriftensprünge,
Alternativtexte, Formularbeschriftungen, Tabellenköpfe, Landmarken. Sieben
davon sind auf allen 81 Seiten erfüllt. Die achte auf keiner:

```
 81x ohne <main>
```

## Warum das mehr ist als ein Formfehler

Es gab ein Sprungziel — seit dem 30. August, nach zwei Anläufen. Es sah so
aus:

```html
</header><div id="inhalt" tabindex="-1"></div>
```

Ein leeres `div`, dessen einziger Zweck es ist, den Fokus aufzunehmen. Es tut
das auch. Aber:

1. **Der Sprung landete an einer Stelle, nicht in einem Bereich.** Wer per
   Vorleseprogramm „zum Inhalt" springt, erfährt anschließend nicht, wo der
   Inhalt wieder aufhört. Eine Landmarke hat einen Anfang **und** ein Ende.
2. **Landmarkennavigation gab es nicht.** Vorleseprogramme bieten `banner`,
   `main` und `contentinfo` zum Anspringen an. Auf diesen Seiten fehlte der
   mittlere Eintrag — auf jeder.
3. **Der Kanal, für den dieser Shop gebaut ist, liest mit.** Textauszieher
   und Sprachmodelle nehmen `<main>` als das stärkste Signal dafür, wo der
   eigene Inhalt beginnt und wo Kopfleiste, Menü und Fußzeile aufhören. Eine
   Seite ohne `main` überlässt diese Abgrenzung der Heuristik — bei einem
   Vorhaben, dessen erklärter Zweck die Auffindbarkeit durch Maschinen ist.

Aus dem Anker wird deshalb der Bereich selbst:

```html
</header>
<main id="inhalt" tabindex="-1">
  … der eigene Inhalt …
</main>
<footer>
```

Der Sprungverweis führt unverändert auf `#inhalt` — jetzt aber **in** den
Hauptbereich statt davor.

Die Grenzen sind eindeutig: Alle 81 Seiten tragen genau ein `</header>` und
genau ein `<footer>`. Nachgezählt, nicht angenommen.

## Was die Probe dabei gewonnen hat

Ein bestehender Testfall grenzte den „eigenen Inhalt" einer Seite bisher über
zwei Suchbegriffe ab — vom Anker bis zur Fußzeile — und maß daran, ob eine
Seite genug Eigenes trägt, um im Index zu stehen. Er liest jetzt den
`<main>`-Bereich. Dieselbe Menge Text, aber vom Erzeugnis selbst abgegrenzt
statt von der Probe nachgebaut.

## Gegenproben

| Mutation | erkannt |
|---|---|
| zurück zum leeren Anker | ja — 2 rot |
| `<main>` wird nie geschlossen | ja — 2 rot |
| `<main>` beginnt vor der Kopfleiste | ja — 3 rot |
| Fußzeilen-Wache entfernt | **erst nein** |
| Kopfleisten-Wache entfernt | (danach ja) |

Die vierte Zeile ist der eigentliche Ertrag dieses Durchgangs. Beide Wachen in
`sprungziel` werfen, wenn die Grenzen des Hauptbereichs unbestimmt sind — und
**keine gebaute Seite kann sie auslösen**, weil alle 81 Kopfleiste und
Fußzeile tragen. Ihr Entfernen ließ die gesamte Datei grün.

> **Eine Wache, die keine Probe auslösen kann, ist eine Vermutung.** Genau
> derselbe Befund wie beim Rückfall in `veroeffentlichung.mjs` einen Durchgang
> zuvor, nur eine Ebene tiefer.

Dafür musste `sprungziel` auf die Modulebene wandern: Die Funktion lag
verschachtelt in `rahmen()` und war von außen nicht erreichbar. Sie ist rein —
Körper hinein, Körper hinaus —, der Umzug ändert nichts als ihre
Prüfbarkeit. Danach werden beide Wachen erkannt.

Das Ende des Hauptbereichs zu **raten** wäre schlimmer als gar kein `<main>`:
Eine Landmarke, die zu früh oder zu spät schließt, führt Vorleseprogramm und
Textauszieher in die Irre, statt ihnen nichts zu sagen. Deshalb der Abbruch
statt einer Annahme.

## Stand

969 Testfälle grün (vorher 967), `pruefe-tests` 967/0, `pruefe-seiten` 81/81,
`shopprobe` 50 Szenarien, elf Prüfer mit `--mit-browser` ohne Beanstandung,
`pruefe-stand` 203/203.
