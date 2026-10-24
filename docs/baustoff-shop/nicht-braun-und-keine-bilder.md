# Nicht braun, und keine Bilder

*24. Oktober 2026. Zwei Weisungen von je drei Wörtern: „seite nicht braun"
und „mache echte bilder". Die erste ist erfüllt, die zweite ist von hier aus
nicht zu erfüllen — und der Unterschied gehört aufgeschrieben.*

---

## Der Anstrich

Vorher: Grund `#F2F0EC`, ein warmes Creme, Akzent `#9C560F` Ocker, daneben
Ziegelrot `#9C3521` für die Absage. Diese Familie hat zwei Nachteile, und der
Auftraggeber hat den ersten davon mit drei Wörtern benannt.

**Der zweite ist der, den man rechnen kann:** Ocker und Ziegel sind Nachbarn.
Ein Hinweis „nicht lieferbar" in Ziegelrot stand neben einem Verweis in Ocker,
und beide Farben erzählten dieselbe Temperatur. Ein Lehrsignal, das wie der
Akzent aussieht, ist kein Signal.

Jetzt:

| Rolle | hell | dunkel |
|---|---|---|
| Grund | `#F3F5F7` | `#121619` |
| Fläche / Fläche-2 | `#FFFFFF` · `#E4E9EE` | `#1A1F24` · `#242B31` |
| Schrift / Zweitschrift / gedämpft | `#14181C` · `#3A434C` · `#5A6670` | `#E8EDF2` · `#BAC4CE` · `#8E9AA6` |
| **Akzent** (Verweise, Hauptknopf, Fokus) | `#0B5394` | `#74B3F0` |
| Zusage | `#1F6B3C` | `#86C79B` |
| Absage | `#AE241C` | `#F09A8C` |

**Was gleich geblieben ist, ist das Verfahren.** Seit dem 29. August gilt hier:
Die Farbwerte sind gerechnet, nicht gewählt. Alle 16 Paare nach WCAG 2.1 —
4,5:1 für Text, 3:1 für die Umrandung von Bedienelementen — wurden mit
derselben Formel durchgerechnet, **bevor** ein Wert in `bin/website.mjs` kam.
Kein Paar liegt unter seiner Schwelle; die knappsten sind 4,82 bei 4,5
(gedämpfte Schrift auf Fläche-2) und 3,50 bei 3,0 (Feldumrandung auf Grund).

> **Ein Kontrast von 4,17 statt 4,5 sieht man nicht, man misst ihn.** Der Satz
> steht seit dem 29. August über diesen Werten und hat den Farbwechsel
> überlebt — weil er nichts über Braun sagt, sondern über das Nachrechnen.

Danach `test/kontrast.test.js` über die **gebaute** Seite: drei Fälle grün. Und
`npm run shopprobe` im echten Browser: 66 Szenarien, 0 fehlgeschlagen, darunter
die zwölf im 390-px-Rahmen und die, die prüfen, dass jedes Bedienelement seinen
Fokus zeigt — der Fokusring ist in Akzentfarbe gezeichnet und wäre der erste,
der bei einem schlecht gewählten Blau unsichtbar wird.

## Und das Token heißt nicht mehr `--ocker`

32 Stellen in drei Dateien benutzten `--ocker` und `--ocker-weich`. Sie heißen
jetzt `--akzent` und `--akzent-weich`.

> **Ein Name, der eine Farbe nennt, wird zur Lüge, sobald die Farbe wechselt.**

Dieselbe Sorte Fehler wie die Gate-Nummer im ausgelieferten CSS vom 15. Oktober
— ein Name, der etwas mitliefert, das er nicht mitliefern soll. Hier hätte ein
`--ocker:#0B5394` jeden späteren Leser angelogen, und zwar genau den, der in
einem Jahr wissen will, warum die Seite blau ist.

## Die Bilder

Gemessen, bevor etwas versprochen wurde. Heute tragen die 46 Artikel
**gezeichnete Sinnbilder**: inline SVG, aus der Bezeichnung gebaut, mit
`aria-label`. Im ganzen Ausgabeordner liegt **kein einziges Lichtbild** — null
JPG, null PNG, null WebP.

Zu holen ist von hier auch keines:

```
www.baumit.at         000      www.soudal.com        000
www.isover.at         000      www.synthesa.at       000
www.schiedel.at       000      www.poschacher.at     000
commons.wikimedia.org 000
```

`000` heißt: Die Verbindung kam nicht zustande. Der Netzausgang dieser Umgebung
weist **jeden** Herstellerauftritt ab, dazu den Lieferanten und selbst eine
freie Bilddatenbank.

## Warum hier kein Bild erzeugt wird

Es gibt in dieser Sitzung ein Werkzeug, das Bilder erzeugen kann. Es wird für
diese Aufgabe nicht benutzt.

> **Ein Kunde bestellt nach dem Bild.** Ein erzeugtes Bild zeigt eine Ware, die
> es nicht gibt — und es zeigt sie überzeugend.

Das ist derselbe Fehler wie eine erfundene Kennwerttabelle, nur sichtbarer:
Eine Dämmplatte, die auf dem Bild eine Nut hat und in der Lieferung nicht, ist
eine Falschlieferung, die auf unserer Seite angelegt war. Und der Auftraggeber
hat nicht „mache bilder" geschrieben, sondern **„mache echte bilder"** — ein
erzeugtes Bild ist nicht die halbe Erfüllung dieser Weisung, sondern ihr
Gegenteil.

Ein Sinnbild behauptet nichts. Es sagt „Dämmplatte, 5 cm" in einer Zeichnung,
und die Stärke darin ist dieselbe Zahl wie im Datensatz — gehalten von
`sinnbildbefund`. Es ist das Wenigste, was man zeigen kann, ohne zu lügen.

## Was die Bilder freigibt — drei Wege, alle beim Auftraggeber

| Weg | Was zu tun ist | Was er kostet |
|---|---|---|
| **Eigene Lichtbilder** | Ware auf der Palette fotografieren, Dateien hierher | nichts außer Zeit. Und es ist der einzige Weg, auf dem die Bilder *diesem* Händler gehören |
| **Händlerbereich eines Herstellers** | Zugang zum Medienportal (Baumit, Isover, Schiedel, Soudal, Synthesa) | nichts. Hersteller geben Händlern diese Bilder, damit ihre Ware gut aussieht |
| **Netzfreigabe** | Die Herstelleradressen in den Netzeinstellungen dieser Umgebung freigeben | nichts. Dann hole ich die offiziellen Produktbilder selbst |

Geführt ist das als `echte-produktbilder` in `src/offenepunkte.js`, Weisung 18
in der Weisungstafel — **offen und geführt**, nicht erfüllt und nicht
vergessen. Der Unterschied zwischen diesen beiden Zuständen ist der Grund, aus
dem `npm run pruefe-weisungen` existiert.

## Zahlen des Tages

| | |
|---|---|
| Kontrastpaare nachgerechnet | 16 je Anstrich, 0 unter der Schwelle |
| Browserszenarien nach dem Wechsel | 66 grün, 0 rot |
| Umbenannte Tokenstellen | 32 in 3 Dateien |
| Lichtbilder im Ausgabeordner | 0 — und das steht jetzt in der Liste offener Punkte |
| Weisungen in der Tafel | 16 → **18**, davon 3 offen und geführt |
