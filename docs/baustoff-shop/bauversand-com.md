# bauversand.com — die Adresse steht

**31. August 2026.** Weisung des Auftraggebers: *bauversand.com verwenden, die
Domain ist bei All-Inkl gerade offen.* Damit ist eines der sieben Glieder auf
dem Weg zum ersten Verkauf entschieden — **Domain und Hosting**.

## Was eingetragen ist

`data/betreiber.json` trägt jetzt `domain: "https://bauversand.com"`, dort wo
Firma, Firmenbuchnummer und Anschrift schon stehen. Der Bau nimmt sie von
dort; die Adresse steht in Verweisen, Sitemap, `llms.txt`, den
strukturierten Daten und den finalen URLs der Anzeigen.

**`domainZeigtAufShop` bleibt unverändert offen.** Die Domain zu besitzen
heißt nicht, dass die Seite dort liegt — das ist erst wahr, wenn hochgeladen
ist, und von hier aus nicht feststellbar (der Netzausgang dieser Umgebung ist
gesperrt). `npm run startklar` führt den Punkt weiterhin als *nicht
feststellbar*, nicht als erfüllt.

## Der Befund beim Eintragen

Die Adresse stand als Konstante in `bin/website.mjs` — **und ein zweites Mal
fest verdrahtet** in `bin/kampagne.mjs`, wo sie die finalen URLs der Anzeigen
bildet:

```js
'Finale URL': `https://shop.freudenthaler-bau.at/${t.pfad[0]}`
```

Diese Adresse ist **abgelöst**: `shop.freudenthaler-bau.at` war die Empfehlung
aus `domainwahl.md` vom 25. August; entschieden ist seit dem 31. August
`bauversand.com`. Sie steht oben als Zitat, weil sie der Befund ist — nicht,
weil sie noch gälte.

> **Zwei Wege zu derselben Adresse, und der zweite wäre beim Wechsel alt
> geblieben.** Von allen Duplikaten, die dieses Projekt gefunden hat, ist das
> das teuerste: Eine Anzeige mit veralteter Ziel-URL kostet den Klick **und**
> liefert eine Fehlerseite. Man bezahlt dafür, Besucher wegzuschicken.

Beide Werkzeuge lesen die Adresse jetzt aus den Betreiberdaten. Eine Probe
liest ihren Quelltext und fällt um, sobald einer von beiden wieder einen
eigenen Hostnamen hineinschreibt.

## Kein Rückfall auf die alte Adresse

Der erste Entwurf ließ `website.mjs` auf die alte Adresse zurückfallen, wenn
das Feld fehlt — damit ein Bau ohne Betreiberdatei nicht scheitert. Beim
Gegenlesen fiel auf, dass das die falsche Richtung ist: Die achtzig Seiten
trügen dann still eine Adresse, unter der nichts steht.

Beide Werkzeuge brechen jetzt mit Ausgangscode 2 ab und sagen, warum. Ein
Abbruch ist sichtbar, eine tote Adresse in achtzig Seiten nicht.

## Was die Adresse verspricht — und was der Shop hält

Ein Punkt, den ich nicht übergehen will, ohne ihn genannt zu haben:
**„Bauversand" verspricht Versand.** Der Shop liefert in fünf Bezirke — Perg,
Urfahr-Umgebung, Freistadt, Linz und Linz-Land — und nicht österreichweit
(Gate 23, Weisung vom 22. August).

Das ist kein Widerspruch, den man abstellen müsste, aber einer, den die Seite
tragen muss: Wer über eine Anzeige mit „Bauversand" kommt und in Salzburg
sitzt, darf das nicht erst in der Kasse erfahren.

> **BERICHTIGT 31.08.** Hier stand: „Der Bestand ist an dieser Stelle in
> Ordnung — das Liefergebiet steht in der Kopfzeile jeder Seite." Das ist
> falsch, und zwar messbar falsch. Von 81 gebauten Seiten nannten **drei** das
> Liefergebiet; die drei Gruppenseiten, auf die der erste Anlauf der Anzeigen
> zeigt, gehörten nicht dazu. Was stimmte, war die Aufzählung dahinter:
> `llms.txt`, `areaServed` und die Kasse. Also die drei Orte, an denen eine
> **Maschine** liest — und keiner, an dem der Besucher liest. Berichtigt und
> abgestellt in `liefergebiet-auf-der-seite.md`.

Beim Schreiben der Anzeigentexte gehört es ausdrücklich hinein; das ist beim
nächsten Blick auf `kampagne.mjs` zu prüfen.

Zur `.com`-Endung: Für einen regional liefernden österreichischen B2B-Shop
signalisiert `.at` die Nähe deutlicher. Das ist eine Abwägung, keine
Fehlentscheidung, und die Domain gehört dem Auftraggeber — vermerkt, nicht
eingewendet.

## Gegenproben

| Mutation | erkannt |
|---|---|
| Adresse in `website.mjs` wieder fest verdrahtet | ja — 2 rot |
| Anzeigen-URL in `kampagne.mjs` wieder verdrahtet | ja |
| `domain` aus den Betreiberdaten entfernt | beide Werkzeuge brechen mit Code 2 ab |

`pruefe-tests` meldete danach zutreffend eine Schleife ohne Längenzusicherung
in der neuen Probe — ergänzt.

## Was jetzt noch fehlt

Von den sieben Gliedern ist eines erledigt. Offen bleiben:

| # | Was | Wer |
|---|---|---|
| 1 | UID-Nummer | Auftraggeber (liegt vor) |
| 2 | E-Mail, Telefon, Gewerbewortlaut | Auftraggeber (liegt vor) |
| 3 | Lieferzeit von Poschacher | ein Anruf |
| ~~4~~ | ~~Domain und Hosting~~ | **entschieden: bauversand.com bei All-Inkl** |
| 5 | Rechtstexte, verbindlicher Wortlaut | Rechtstexteanbieter |
| 6 | Zahlungsanbieter | Entscheidung + Vertrag |
| 7 | GTIN/EAN für 43 Artikel | Artikelliste aus dem Kundenkonto |

Das Hochladen selbst kann ich nicht: Der Netzausgang dieser Umgebung ist
gesperrt, und es wäre eine Veröffentlichung. `npm run website` erzeugt den
fertigen Ordner `ausgabe/site/` — 81 Seiten, statisch, ohne Serverbedarf. Er
lässt sich per FTP in das Webverzeichnis von All-Inkl legen. Solange die
Rechtstexte Gerüst sind, gehört er allerdings **nicht** öffentlich erreichbar
gemacht.

## Stand

1010 Testfälle grün (vorher 1008), `pruefe-tests` 1008/0, elf Prüfer mit
`--mit-browser` ohne Beanstandung, `pruefe-stand` 210/210. Kampagnen
unverändert pausiert.
