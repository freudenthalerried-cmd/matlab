# Kein nachweisbarer Preiswechsel in fünf Monaten

**3. September 2026.** Gestern Nacht haben sich vier Begründungen als
schlüssig, aber falsch erwiesen. Das war Anlass, die Begründungen im **anderen**
Register mit denselben Augen zu lesen — `OHNE_WERKZEUG` in `offenepunkte.js`,
also die Liste der Punkte, die angeblich kein Werkzeug messen kann.

Sechs Einträge. Fünf halten. Einer nicht:

> **Preisrhythmus des Lieferanten** — Aus fünfzehn Rechnungen nicht ableitbar:
> sie zeigen, wann wir gekauft haben, nicht, wann er die Liste ändert.

Der Satz stimmt für den **Rhythmus**. Er stimmt nicht für die **Beobachtung**:
Wo derselbe Artikel an zwei Tagen auf einer Rechnung steht, ist ablesbar, ob
sich sein Preis dazwischen bewegt hat.

## Der Befund

`npm run preiswechsel` liest die Positionen der eigenen Lieferantenrechnungen:

```
70 Positionen, 53 Artikelnummern, 7 Zeilen ohne verwertbare Menge.
An mehr als einem Tag gekauft: 8 Artikelnummern.
8 von 8 unverändert, längste beobachtete Spanne 32 Tage.
```

**Kein einziger nachweisbarer Preiswechsel.** April bis August, acht Artikel,
Spannen von 5 bis 32 Tagen.

### Was daran fast schiefgegangen wäre

Ein erster Durchlauf über die **ausgewiesenen Einzelpreise** meldete zwei
Änderungen. Beide lösen sich beim Hinsehen auf:

- **Paletten ÖBB**: 22,00 beim Kauf, 20,00 bei der Rückgabe. Das ist Pfand,
  keine Preisänderung — und die Zeile trägt eine negative Menge.
- **Fassaden EPS 5 cm**: Einzelpreis halbiert, gleichzeitig entfiel ein Rabatt
  von 50 %. Der Betrag für dieselbe Menge blieb bei 70 € — der **Nettopreis
  änderte sich nicht**, nur seine Darstellung auf dem Beleg.

Verglichen wird deshalb `Betrag / Menge`, nicht der Einzelpreis, und negative
Mengen bleiben außen vor.

> **Der ausgewiesene Preis ist nicht der bezahlte.**

Nebenbei bestätigt: Der Katalog hat für diesen Artikel den **effektiven**
Preis übernommen und nicht den ausgewiesenen. Der Fehler, den diese Messung
beinahe gemeldet hätte, steckt nicht im Bestand.

## Was das ändert — und was nicht

**Die Frage bleibt offen.** Beobachtet sind 32 Tage, die Preisalter-Grenze ist
auf 90 gesetzt. Was fehlt, ist der Zeitraum, nicht die Messung; aus „in 32
Tagen hat sich nichts bewegt" folgt nichts über 90.

Was sich ändert, ist die Qualität der Frage. Sie lautete:

> In welchem Rhythmus ändern sich Ihre Preise, und gibt es feste Termine dafür?

Und lautet jetzt:

> … Über unsere Belege von April bis August sehen wir bei acht mehrfach
> gekauften Artikeln keine Änderung; die längste Spanne dazwischen sind
> 32 Tage.

Wer eine Frage stellt und dazusagt, was er schon gesehen hat, bekommt eine
genauere Antwort — und zeigt, dass er nachgesehen hat.

Und der Grund im Register sagt jetzt, was gemessen ist, statt zu behaupten,
es sei nichts zu messen.

## Ein Werkzeug, das seine eigene Ausgabe bewacht

Die Grundlage liegt in `preise/`, das `.gitignore` deckt. Gedeckt ist damit
die **Datei** — nicht die Ausgabe eines Werkzeugs, und die landet schneller in
einem Dokument als eine Datei.

Deshalb druckt `preiswechsel` **keinen einzigen Preis**: nur Zählungen,
Zeitspannen und relative Abweichungen. Eine Probe hält das fest und prüft
gegen die echten Einkaufspreise — beide Bauarten im Bestand, den fakturierten
Nettopreis und den aus Listenpreis und Rabatt gerechneten, in deutscher und in
englischer Schreibweise.

`pruefe-geheimnis` bewacht `data/`. Für seine eigene Ausgabe ist ein Werkzeug
selbst verantwortlich.

## Stand

| | |
|---|---|
| ausgewertete Positionen | 70 aus 15 Rechnungen |
| mehrfach gekaufte Artikelnummern | 8 |
| davon mit verschobenem Nettopreis | **0** |
| längste beobachtete Spanne | 32 Tage |
| gesetzte Preisalter-Grenze | 90 Tage |
| Tests | 1272 |

Die fünf übrigen Begründungen in `OHNE_WERKZEUG` halten: Artikelliste, GTIN
und Bild liegen beim Lieferanten; das Suchvolumen bei Google; der Upload
braucht einen Netzausgang, den diese Umgebung nicht hat; und was
`Google-Extended` beim Anbieter steuert, steht in dessen Dokumentation.
