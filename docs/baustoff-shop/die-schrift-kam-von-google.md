# Jede Seite holte drei Schriften bei Google

Stand: 2026-08-29

## Der Befund

Beim Nachsehen, welche fremden Adressen die 81 gebauten Seiten überhaupt
enthalten:

| Adresse | Vorkommen | Art |
| --- | --- | --- |
| `fonts.googleapis.com` | **162** | Stylesheet, wird geladen |
| `fonts.gstatic.com` | **81** | Schriftdateien, werden geladen |
| `www.synthesa.at`, `www.baumit.at`, … | 36 | Verweise, erst auf Klick |
| `w3.org`, `schema.org` | 993 | Namensräume, werden nie geladen |

Jede Seite hatte im Kopf:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=…">
```

Der Browser des Besuchers baut diese Verbindung auf, **bevor er irgendetwas
gefragt wurde**, und übermittelt dabei seine IP-Adresse an einen Dritten. Das
Landgericht München I hat am 20.01.2022 (3 O 17493/20) genau dafür
Schadenersatz zugesprochen. Die Rechtsgrundlage fehlt hier wie dort: Eine
Schriftart ist kein berechtigtes Interesse, solange dieselbe Schrift auch vom
eigenen Server kommen kann.

Für einen Shop, der noch nicht online ist, ist das billig zu beheben. Nach dem
Start wäre es eine Abmahnung.

## Was geändert wurde

Die Einbindung ist weg. Die Schriftangaben bleiben, wie sie sind — sie tragen
seit jeher eine Ersatzkette: `"Barlow Condensed", "Arial Narrow", sans-serif`
und `"Source Sans 3", system-ui, …`.

**Bemerkenswert daran:** In dieser Umgebung hat die Webschrift **nie**
geladen; `fonts.googleapis.com` hängt am Ausgangsproxy. Jede Messung, jedes
Bildschirmfoto, jeder der 81 Rahmenzensus-Läufe und alle 47 Browserszenarien
sind mit den Ersatzschriften entstanden. Der Shop sieht also genau so aus, wie
er den ganzen Tag über gemessen wurde — die Änderung nimmt nichts weg, was
jemals zu sehen war.

Der Ausweg für später ist das **Selbsthosten**: Schriftdateien neben die Seite
legen, per `@font-face` einbinden. Aus dieser Umgebung ist er versperrt — die
Dateien lassen sich nicht holen. Vorbereitet ist er trotzdem: Aus der
Konstante `SCHRIFTEINBINDUNG` wird dann ein `<style>`-Block. Eine Zeile, kein
Umbau.

## Der Wächter dagegen

Ein Test liest **alle** gebauten Seiten und sucht, was der Browser von sich
aus holt: `<link rel=stylesheet|preconnect|preload|dns-prefetch>`,
`<script src>`, `<img|iframe|video|audio|source|embed src>`, `@import` und
`url(…)` mit fremdem Ursprung. Verweise im Text (`<a href>`) sind ausdrücklich
erlaubt — ein Merkblatt des Herstellers wird erst auf Klick geladen, und das
ist gewollt.

Dazu die Gegenrichtung, damit der Test nicht auf einer leeren Seite grün
meldet: Der Verweis auf `synthesa.at` **muss** auf der Artikelseite stehen.
Gegengeprobt durch Wiedereinsetzen des Google-Links: Der Testfall fällt.

## Die Datenschutzseite beschrieb den Bestellvorgang und schwieg über den Besuch

Die Gliederung nannte neun Punkte — alle über die **Bestellung**. Über das,
was beim bloßen Aufruf der Seite geschieht, stand nichts. Das ist die falsche
Reihenfolge: Die Verarbeitung beginnt beim ersten Seitenaufruf.

Neu ist deshalb ein **technischer Befund**, aus dem Quelltext gelesen:

| Punkt | Befund |
| --- | --- |
| Keine Cookies | weder eigene noch fremde; ein Einwilligungsbanner ist gegenstandslos |
| Warenkorb im Browser | in `localStorage`, Schlüssel aus dem Code, verlässt das Gerät nicht |
| Keine Zählpixel, keine Analyse | kein Analysewerkzeug, kein Werbenetzwerk |
| Keine fremden Einbindungen | seit heute; vorher drei Schriften von Google |
| Verweise auf Herstellerseiten | verlinkt, nicht eingebettet — erst auf Klick |
| Serverprotokoll | **offen**, hängt am Hoster, muss vor dem Start ausgefüllt werden |

Das ist kein Rechtstext und will keiner sein. Es ist das, was der
Rechtstexteanbieter wissen muss und **außer dem Bau niemand kennt**. Der
letzte Punkt bleibt sichtbar offen, statt beruhigend zu fehlen.

## Ein erfundener Schlüssel in einer Rechtsseite

Der erste Wurf dieser Tabelle schrieb den Speicherschlüssel als
`fb.warenkorb`. Frei erfunden — er heißt `freudenthaler-shop-warenkorb-v1`.

In einer Rechtsseite ist das keine Schlamperei, sondern der Beweis, dass der
Text nicht zum Shop gehört. Genau diese Sorte Angabe prüft niemand nach.

Berichtigt: Der Schlüssel kommt jetzt aus der Konstante `KORBSCHLUESSEL`, und
ein Test verlangt, dass er auf der Seite steht. Damit kann er nicht mehr
auseinanderlaufen — dieselbe Regel wie überall heute: **eine Quelle, nicht
zwei.**

## Was offen bleibt

Das Serverprotokoll. Es hängt am Hoster, und der ist nicht gewählt — derselbe
offene Punkt wie Domain und Hosting in der Startklar-Liste. Er steht jetzt
zusätzlich dort, wo er gebraucht wird.
