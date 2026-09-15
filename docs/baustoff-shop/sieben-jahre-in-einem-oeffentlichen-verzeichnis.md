# Sieben Jahre in einem öffentlichen Verzeichnis

**4. September 2026, Mittag.** `npm run offenepunkte` führt neunzehn Punkte in
fünf Gruppen. Achtzehn davon warten auf den Auftraggeber. Einer steht unter
**„Meine Arbeit"**, und daneben liegt seit dem 31. August ein fertiges Modul,
das niemand benutzt.

`src/ablage.js` führt den Nummernkreis nach § 11 Abs 1 Z 5 UStG und die
Aufbewahrung nach § 132 BAO, sieben Jahre. `src/speicher.js` gibt ihm das
Gedächtnis: ein Journal aus Zeilen, die nur wachsen — dieselbe Eigenschaft,
die § 131 BAO vom Inhalt verlangt, auf die Form übertragen. Beide sind gebaut,
geprüft, vollständig. **Neun ihrer Ausfuhren rief außerhalb der Tests
niemand.**

Der Grund im Register lautete: Es fehle der Zahlungsanbieter, und der sei eine
Ausgabe und Sache des Auftraggebers.

> **Der Grund war falsch.** Ein Angebot braucht keinen Zahlungsanbieter. Was
> gefehlt hat, ist kein Anbieter, sondern ein **Ort**.

## Wohin ein Journal gehört, das Kundendaten trägt

Ein Journal nach § 132 BAO trägt Namen, Anschriften und Beträge — und dieses
Verzeichnis ist öffentlich. Für Einkaufspreise gibt es die Regel seit dem
26. August: `.gitignore` hält `preise/` draußen, `npm run pruefe-geheimnis`
misst nach, ob sie aus den Verkaufspreisen rekonstruierbar sind.

Für Kundendaten gibt es nichts. Weil es noch keine gibt.

> **Das ist genau der Zeitpunkt, an dem die Regel hingehört.** Danach hilft
> `.gitignore` nicht mehr — eine einmal eingecheckte Zeile bleibt in der
> Geschichte des Verzeichnisses stehen.

Nicht unter `preise/`: Das trägt die Konditionen des Lieferanten und wird als
solches behandelt — gesichert, nachgerechnet, in `npm run sicherung` geführt.
Kundendaten unterliegen anderen Fristen, einem anderen Löschanspruch (Art. 17
DSGVO, der nach Abs. 3 lit. b an § 132 BAO endet) und einem anderen
Personenkreis. Zwei Sorten Geheimnis in einem Ordner heißt: Die schärfere
Regel gilt für beide, oder die mildere. Beides ist falsch.

Also `ablage/`, eigens gesperrt, und `npm run pruefe-ablage` mit drei Regeln:

| | |
|---|---|
| `ort-nicht-gesperrt` | die `.gitignore` deckt den Ordner nicht |
| `journal-im-verzeichnis` | eine Journaldatei ist **getrackt** — nicht mehr abzuwenden, sondern aufzuräumen |
| `journal-am-falschen-ort` | eine Journaldatei liegt außerhalb und wartet darauf, eingecheckt zu werden |

Wie beim Mutationsschutz von heute früh meldet der Prüfer die Zahl der
**angesehenen** Dateien, nicht die der Funde: Sein gesunder Zustand ist null,
und „nichts gefunden" sähe sonst aus wie „nicht hingesehen".

## `npm run vorgang --ablegen`

Zwei Schranken davor, und beide sind unnachgiebig:

- **Ein Beleg mit sichtbarer Lücke kommt nicht in die Akte.** `[[ … FEHLT ]]`
  heißt: eine Pflichtangabe ist offen. Sieben Jahre lang stünde sonst ein
  unvollständiges Papier darin, und die Marke wäre nicht mehr die Erinnerung
  an eine offene Frage, sondern ein Mangel im Beleg.
- **Ein Befund der Belegprüfung ebenso.** Die Prüfung weiter oben beendet den
  Lauf schon; hier steht sie noch einmal, weil eine Schranke, die von der
  Reihenfolge zweier Blöcke abhängt, keine ist.

**Mit dem heutigen Bestand greift die erste immer.** Die Lieferzeit des
Lieferanten ist eine der neun offenen Fragen an ihn, und ohne sie trägt jedes
Angebot eine Lücke. Der Weg ist gebaut und bewiesen — begehbar wird er mit der
Antwort des Lieferanten.

## Was der erste echte Lauf sofort gefunden hat

Der erste Durchgang legte ein Angebot unter `AN-2026-0001` ab. Auf dem Papier
stand `AN-2026-0102`.

> **Ein Beleg, der unter einer anderen Nummer in der Akte liegt als der, die
> auf ihm steht, ist schlechter als ein nicht abgelegter.** Wer die Akte nach
> dem Papier durchsucht, findet nichts und schließt daraus das Falsche.

Zwei Zahlenreihen für dasselbe Papier: `src/vorgang.js` bildet die
Angebotsnummer seit dem 31. August als `AN-${vorgangsnummer}`, `src/ablage.js`
zieht sie aus einem Zähler. Beide sind für sich richtig. Dieselbe Familie wie
die Listenpreisspalte, die zweierlei bedeutete.

Aufgelöst zugunsten des Papiers — das Journal hält fest, was hinausgegangen
ist. Damit die Nummer nicht ein drittes Mal gebildet wird, geben
`erzeugeAngebot` und `erzeugeAuftragsbestaetigung` sie jetzt zurück, statt sie
nur in ihre erste Zeile zu schreiben.

**Und damit stand die Einmaligkeit plötzlich ohne Wache.** Sie hing allein an
`naechsteNummer`; wer die Nummer von woanders mitbringt, stand außerhalb jeder
Prüfung. § 11 Abs 1 Z 5 UStG verlangt fortlaufend **und einmalig** — das
Zweite prüft seit heute `haltefest`, für jeden Weg in die Ablage und nicht nur
für den einen.

Ein zweiter Fund derselben Art: Das Artenverzeichnis der Ablage kannte
Angebot, Rechnung, Gutschrift, Lieferantenbestellung, UID-Abfrage und Vermerk
— **nicht die Auftragsbestätigung**, also ausgerechnet das zweite Papier, das
dieses Werkzeug erzeugt. Sie ist jetzt eine eigene Art, bewusst **ohne**
Nummernkreis: Eine fortlaufende Nummer verlangt § 11 für die Rechnung, und wer
für die Bestätigung einen sechsten Kreis eröffnet, handelt sich dessen
Lückenerklärung ein, ohne dass eine Vorschrift sie verlangt.

## Was im Register bleibt, und warum

`ablageEintraege` in `src/vorgang.js` bleibt ungerufen — aber mit einem neuen
Grund. Sie baut **alle** Spuren eines Vorgangs auf einmal: die
Lieferantenbestellungen, den Vermerk und das Angebot. Abgelegt wird je Aufruf
genau das eine Papier, das hinausgeht.

> **Das Journal hält fest, was geschehen ist.** Eine Lieferantenbestellung,
> die niemand aufgegeben hat, gehört nicht hinein — und nach § 131 BAO bliebe
> sie dort stehen.

Die falsche Körnung, nicht der falsche Zeitpunkt. Der alte Grund an dieser
Stelle wäre eine Entschuldigung für einen Zustand gewesen, den es nicht mehr
gibt; `npm run pruefe-ungerufen` hat genau das gemeldet und drei Einträge zur
Berichtigung verlangt.

## Was das für den Auftraggeber ändert

Nichts an seiner Liste, und eine Sache am Tag danach: Wenn die Lieferzeit
beantwortet ist, entsteht aus einer Anfrage nicht nur ein Angebot auf dem
Bildschirm, sondern ein Eintrag in einer Akte, die den Anforderungen der BAO
genügt — an einem Ort, der nie in die Versionsverwaltung gerät.
