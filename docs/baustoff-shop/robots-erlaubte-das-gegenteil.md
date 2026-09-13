# Die ausgelieferte robots.txt erlaubte das Gegenteil der Entscheidung

Stand: 2026-08-30

## Der Befund

Zwei Werkzeuge schreiben eine `robots.txt`, und sie schrieben verschiedene.

**Was `npm run veroeffentlichung` erzeugt** — aus `robotsTxt({ suche: true,
training: false })`, der Entscheidung aus `ki-sichtbarkeit-konzept.md`:

```
User-agent: OAI-SearchBot        Allow: /
User-agent: Claude-SearchBot     Allow: /
User-agent: PerplexityBot        Allow: /
User-agent: Applebot             Allow: /
User-agent: GPTBot               Disallow: /
User-agent: ClaudeBot            Disallow: /
User-agent: Google-Extended      Disallow: /
User-agent: CCBot                Disallow: /
```

**Was `npm run website` in `ausgabe/site/` legte** — also die Datei, die
tatsächlich neben der Seite steht:

```
User-agent: *
Allow: /
Sitemap: …
```

Die ausgelieferte Fassung erlaubt GPTBot, ClaudeBot, Google-Extended und
CCBot genau das, was die Entscheidung ausschließt: **die Inhalte dieses Shops
als Trainingsmaterial mitzunehmen.**

Die Unterscheidung ist keine Spitzfindigkeit. Sie ist der Kern des
Sichtbarkeitskonzepts: *gefunden werden ja, Trainingsmaterial nein.*
Suchkennungen wie `OAI-SearchBot` holen die Seite, um sie in einer Antwort zu
zitieren — dafür ist dieser Shop gebaut. Trainingskennungen wie `GPTBot`
nehmen sie mit, ohne dass jemals ein Kunde davon erfährt.

Die Entscheidung war getroffen, begründet, in einer Funktion umgesetzt und mit
Tests versehen. Sie stand nur nicht in der Datei, die ausgeliefert wird.

## Die Fehlerklasse

Dieselbe wie an mehreren Stellen des Vortags: **zwei Wege zur selben Ausgabe,
und der kürzere gewinnt** — weil er näher am Schreibaufruf steht und niemand
merkt, dass daneben ein längerer liegt.

| Fund | zwei Wege zu … | gemerkt am |
| --- | --- | --- |
| PreOrder gegen InStock | Verfügbarkeit | 28.08. |
| Fracht im Kampagnenwerkzeug | Frachtsatz | 28.08. |
| JSON-LD der Artikelseite | Angebotsauszeichnung | 29.08. |
| **robots.txt** | **Krawlerregel** | **30.08.** |

Jedes Mal war die zweite Fassung die ältere, kürzere und falsche. Der Bau
zieht die Datei jetzt aus derselben Funktion wie die Veröffentlichung.

## Was dabei nicht geändert wurde

**Die Entscheidung selbst.** `suche: true, training: false` bleibt, wie der
Auftraggeber sie hat aufschreiben lassen. Hier wurde eine Ausgabe an eine
Entscheidung angeglichen, nicht eine Entscheidung an eine Ausgabe.

## Und was in Ordnung war

Die `sitemap.xml` wurde bei derselben Gelegenheit nachgezählt: **81 von 81
gebauten Seiten**, keine zu viel, keine zu wenig. Auch das ist jetzt ein
Test, in beide Richtungen — eine Sitemap, die eine gelöschte Seite weiter
nennt, schickt Suchmaschinen ins Leere, und eine, die eine neue verschweigt,
verschenkt sie.

## Geprüft

Zwei neue Testfälle. Der erste geht **alle** Kennungen beider Listen durch —
nicht zwei ausgesuchte — und verlangt zusätzlich, dass die Listen überhaupt
gefüllt sind; sonst prüften die Schleifen nichts. Der zweite hält Sitemap und
Bestand in beide Richtungen zusammen.

Gegengeprobt durch Wiedereinsetzen der drei alten Zeilen: Der erste Testfall
fällt.
