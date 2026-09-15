# Videos als Quelle: zusammenfassen, prüfen, verwenden

Stand: 2026-08-22. Weisung des Auftraggebers: *„youtube: fasse zusammen,
überprüfe auf richtigkeit und verwende content"*. Das ist genau der
tragfähige Weg — diese Runde macht den mittleren Schritt ausführbar.

## Erstens, die harte Einschränkung

**YouTube ist aus dieser Umgebung vollständig gesperrt.** Der
Egress-Proxy weist `www.youtube.com` ab, es gibt kein `yt-dlp`, und auch
die Suchseite ist nicht erreichbar. Ich kann von hier weder Videos
ansehen noch Transkripte ziehen noch Kanäle sichten.

Das ist keine Kleinigkeit, und ich schreibe es an den Anfang, damit es
niemand übersieht: **Die Zusammenfassung selbst kann diese Umgebung
nicht leisten.** Was sie leisten kann, ist die Maschinerie darum — und
die ist der Teil, an dem solche Vorhaben sonst scheitern.

Wer die Videos sichtet, ist damit der Auftraggeber selbst (oder ein
Lauf mit freiem Netzzugang). Was er mitbringt, sind Notizen; was daraus
wird, entscheidet die Regel unten.

## Zweitens: Was „auf Richtigkeit prüfen" bedeuten muss

Ohne Regel ist Prüfen ein Gefühl. Die Regel steht jetzt fest, **bevor**
die erste Aussage erfasst ist — dasselbe Prinzip wie bei allen
Auswertungen dieses Projekts (Gate 17).

**Ein Video ist ein Hinweis, keine Fundstelle.**

Das ist kein Misstrauen gegen Handwerksvideos; viele sind fachlich
besser als jeder Prospekt. Der Grund ist ein anderer: Ein Video kann
gelöscht, geschnitten oder stillschweigend korrigiert werden, es nennt
seine eigenen Quellen selten, und wer es zitiert, kann eine
Verwechslung nicht bemerken. Es sagt, **wonach zu suchen ist** — belegt
wird die Aussage dann anderswo.

| Quellenart | Rolle |
|---|---|
| Norm (mit Nummer und Ausgabejahr) | trägt |
| Technisches Merkblatt des Herstellers | trägt |
| Behörde, Kammer, Gesetzestext | trägt |
| Fachliteratur mit Auflage | trägt |
| **Eigene Berufserfahrung**, als solche gekennzeichnet | trägt |
| Video | Hinweis |
| Forum, Kommentar | Hinweis |
| Werbeaussage eines Händlers | Hinweis |

Daraus die drei Regeln:

1. **Eine tragende Quelle genügt.**
2. **Zwei unabhängige Hinweise tragen eine Einordnung** — aber
   Unabhängigkeit hängt am Urheber: *zwei Videos desselben Kanals sind
   eine Quelle, nicht zwei.* Wer das nicht trennt, hält Wiederholung
   für Bestätigung — der häufigste Irrtum beim Nachrecherchieren.
3. **Ein Kennwert braucht immer eine tragende Quelle.** Zwei sich
   einige Videos ersetzen kein Datenblatt. Zahlen sind der Teil, an dem
   ein Shop haftbar wird.

Bemerkenswert an Punkt 1: Die **eigene Berufserfahrung des
Auftraggebers trägt** — als solche gekennzeichnet. Das ist kein
Zugeständnis, sondern der stärkste Aktivposten des Vorhabens. Ein
Baumeister, der schreibt „nach meiner Erfahrung reißt das bei
Frost", liefert etwas, das kein Wettbewerber abschreiben kann und keine
KI erfindet. Es muss nur als Erfahrung erkennbar sein, nicht als Norm
verkleidet.

## Drittens: das Werkzeug

`npm run pruefe-quellen -- <datei>` (`src/quellen.js`,
`bin/quellenpruefung.mjs`). Es nimmt ein Quellen- und
Aussagenverzeichnis und sagt je Aussage, ob sie trägt:

```
Quellen:
  2× video (Hinweis — Video — Hinweis, keine Fundstelle)
  1× datenblatt (tragend — technisches Merkblatt des Herstellers)
  1× norm (tragend — Norm mit Nummer und Ausgabejahr)

Aussagen: 3 von 3 belegt
VERWENDBAR — jede Aussage trägt ihre Quelle.
```

Und wo etwas fehlt, sagt es, was: *„nur eine Hinweisquelle — sie zeigt
die Richtung, sie belegt nicht"*, *„Kennwert ohne tragende Quelle —
Zahlen brauchen Norm oder Datenblatt"*, *„Norm ohne Nummer — ‚laut
ÖNORM' ist wertlos"*. Der Schlusssatz gehört zum Werkzeug: **Ein Video
ist ein Hinweis, keine Fundstelle. Zusammenfassen ja, abschreiben
nein.**

Eine offene Aussage sperrt die ganze Recherche — sie gehört belegt oder
gestrichen, **nicht abgeschwächt.** Der Weg, auf dem Halbwissen in
Texte kommt, ist fast immer das Weichspülen einer Aussage, die man
nicht belegen konnte.

## Der Arbeitsweg, wenn Videos gesichtet werden

1. **Sichten und notieren** — je Video ein Eintrag im Quellenverzeichnis
   (Kanal, Titel, Link, Datum) und die Notiz, worauf es hinweist. Kein
   Transkript, keine wörtliche Übernahme.
2. **Nachschlagen** — für jeden Hinweis die tragende Quelle suchen:
   Merkblatt, Norm, Behörde. Das ist die eigentliche Arbeit, und der
   Grund, weshalb der Text am Ende etwas wert ist.
3. **Prüfen** — `npm run pruefe-quellen`. Was offen bleibt, fliegt raus.
4. **Schreiben** — in eigenen Worten, nach den Vorlagen in
   `shop/inhalte/vorlagen/`, mit den Quellen im Text.
5. **Gegenprüfen** — `npm run pruefe-inhalte` fängt, was mechanisch
   findbar ist (Zahl ohne Quelle, Norm ohne Nummer, Grenzverletzung).

Schritt 3 und 5 sind zwei verschiedene Prüfungen: Die eine fragt, ob
die Aussage stimmt, die andere, ob der Text sie sauber trägt.

## Absicherung

Dreizehn Testfälle. Gegenproben per Mutation: Video als tragende Quelle
→ 7 Testfälle fallen; Unabhängigkeit ignoriert (Quellen einfach gezählt)
→ 1 fällt; Kennwertregel entfernt → 1 fällt.

Testbestand: **482, alle grün, Prüfer ohne Verdacht.**
