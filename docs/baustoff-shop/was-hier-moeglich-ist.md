# Der Weg war gebaut und stand auf keiner Seite

Stand: 2026-08-29

## Der Befund

Der Anfragetext auf der Kasse ist seit heute Vormittag da
(`anfrage-statt-wand.md`). Beim Nachsehen, was ihn ankündigt, kam heraus:
**nichts.**

- Die Startseite sagte: „Es kann nichts bestellt werden" — und dann nichts
  weiter.
- Die Kasse begann mit „Hier endet die Vorschau", über dem einzigen Weg, der
  weiterführt.
- `llms.txt`, der Kanal, für den dieser Shop gebaut ist, hatte gar keinen
  Abschnitt darüber, was ein Besucher hier tun kann.

Das ist die bekannte Fehlerklasse mit vertauschten Rollen: sonst *eine
Angabe, die berechnet und dann verschwiegen wird* — hier eine Fähigkeit, die
gebaut und dann verschwiegen wird. Wer nur die Startseite liest, geht.

Für `llms.txt` wiegt es am schwersten. Ein Assistent, den jemand fragt „kann
ich dort bestellen?", fand darauf keine Antwort — und die wahrscheinlichste
Ersatzantwort eines Sprachmodells auf einer Shop-artigen Seite ist „ja".

## Was jetzt an drei Stellen steht

**Startseite.** „Bestellen können Sie hier noch nicht — es fehlen ein
vollständiges Impressum, ein Zahlungsanbieter, verbindliche Rechtstexte. …
**Was schon geht:** Warenkorb füllen, Bezirk wählen — und in der Kasse die
fertig gerechnete Anfrage mitnehmen."

**Kasse.** Statt „Hier endet die Vorschau" jetzt „Bestellen können Sie hier
nicht", die Absage unverändert hart, und der Satz „Mitnehmen können Sie die
fertige Anfrage darunter."

**llms.txt.** Ein neuer erster Abschnitt „Was hier möglich ist", vor allem
anderen: Bestellen nein, Anfrage ja, nur im Liefergebiet, Fracht je Lieferung
ohne Frei-Haus-Schwelle.

Dazu der Knopf im Warenkorb: „Weiter zur Lieferadresse" heißt jetzt „Weiter
zu Lieferadresse und Anfrage".

## Die eigentliche Arbeit: Der Text kommt aus den Daten

Ein fester Satz „es fehlen Impressum, Zahlungsanbieter und Rechtstexte" wäre
eine Zeitbombe gewesen. Er hätte das auch dann noch behauptet, wenn der
Auftraggeber das Impressum längst vervollständigt hat — und niemand hätte es
gemerkt, weil kein Prüfer einen Satz liest.

Deshalb rechnet `bin/website.mjs` jetzt **dieselbe Bereitschaftsprüfung wie
`npm run startklar`** und leitet aus ihr ab, was auf den Seiten steht. Die
kundentauglichen Wörter stehen in `src/startklar.js`:

```js
const AUF_DER_KASSE = new Map([
  ['impressum',        'ein vollständiges Impressum'],
  ['zahlungsanbieter', 'ein Zahlungsanbieter'],
  ['rechtstexte',      'verbindliche Rechtstexte'],
]);
```

Nur diese drei. Dass das Repository noch öffentlich ist oder die Domain nicht
zeigt, sind Betriebsfragen — sie gehören in die Prüfliste und nicht in einen
Kasten, den ein Bauleiter liest.

Der Bereitschaftsstand geht auch ins Browserbündel (`D.bestellung`), damit die
Kasse ihre Begründung aus den Daten nimmt. Sind alle drei Punkte geschlossen,
fällt der Kasten weg — er bleibt nicht stehen und behauptet Falsches.

## Bewiesen, nicht behauptet

Eine Zusage „der Text kommt aus den Daten" ist wertlos, solange niemand zeigen
kann, dass er sich ändert, wenn die Daten sich ändern. `bin/website.mjs`
nimmt deshalb zwei Umgebungsvariablen an — `WEBSITE_AUSGABE` und
`STARTKLAR_BETREIBER` —, und ein Test lässt den **echten** Bau zweimal laufen:

| Betreiberdatei | llms.txt | Startseite |
| --- | --- | --- |
| Bestand (drei Punkte offen) | „Bestellen ist noch nicht möglich. Es fehlen: …" | „Dies ist eine Vorschau, kein laufender Shop." |
| vollständig beantwortet | **„Bestellen ist möglich."** | Warnung **weg** |

Der Test verlangt beide Richtungen. Ohne die zweite Zeile wäre er die Sorte
Probe, die den Bestand festschreibt statt der Zusage.

## Nebenbefund: eine Probe, die zu genau hinsah

Das Szenario „Die Kasse löst nichts aus und sagt das auch" erwartete wörtlich
„Zahlungsanbieter ist nicht gewählt" — den Satz aus dem Quelltext der
Oberfläche. Der ist jetzt weg; die Kasse formuliert aus den Daten. Erwartet
wird nun „ein Zahlungsanbieter" als **eines der genannten Stücke**, dazu
weiterhin „Bestellen können Sie hier nicht" und „sie löst keine aus".
Verschwindet die Aufzählung, fällt das Szenario.

## Was offen bleibt

Die drei Punkte selbst — Impressum, Zahlungsanbieter, Rechtstexte — liegen
weiter beim Auftraggeber. Geändert hat sich nur, dass die Seiten jetzt sagen,
was trotzdem geht, und dass sie es aufhören zu sagen werden, sobald es nicht
mehr stimmt.

Noch nicht angefasst: die AGB. Sie beschreiben einen Vertragsschluss durch
Bestellung, und der Anfrageweg kommt darin nicht vor. Das ist verbindlicher
Wortlaut und gehört zu dem Punkt, der ohnehin beim Auftraggeber liegt — hier
wird nichts erfunden.
