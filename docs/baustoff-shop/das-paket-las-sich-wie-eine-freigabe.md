# Das Paket las sich wie eine Freigabe

*Lauf vom 15. September 2026. Eine Berichtigung an meiner eigenen Antwort von
heute früh, zwei neue Regeln, eine Gegenprobe.*

---

## Was ich dem Auftraggeber falsch gesagt habe

Heute früh hat er gefragt, ob ihn schon eine KI erreichen kann. Meine Antwort
endete mit:

> *„Der erste und wichtigste Schritt bleibt: **online stellen** und die
> E-Mail-Adresse eintragen."*

**Die Reihenfolge ist falsch herum**, und der Bestand sagt es an zwei Stellen
selbst. Die gebaute Impressumsseite trägt einen Kasten:

> *„Noch nicht vollständig. 4 Pflichtangaben fehlen und sind unten markiert.
> Solange eine Marke sichtbar ist, **darf diese Seite nicht online gehen** —
> ein unvollständiges Impressum ist im Merchant Center der häufigste
> Ablehnungsgrund und außerhalb davon abmahnfähig."*

Und `npm run startklar` endet mit **NICHT STARTKLAR**, acht offene Punkte.

Ich habe den Satz nicht übersehen — ich habe ihn nicht gelesen. Die Antwort
kam aus dem, was ich über den Stand wusste, und nicht aus dem, was der Stand
sagt.

## Und der Bestand sagte es an einer dritten Stelle nicht

`npm run paket` schreibt das Archiv zum Hochladen, mit `ABNAHME.txt` darin.
Diese Datei begann mit:

```
Abnahme nach dem Hochladen — 9 Punkte
Ziel: https://bauversand.com
```

Kein Wort darüber, ob hochgeladen werden **darf**. Neun Punkte, jeder davon
eine Anweisung für danach.

> **Ein Paket, das eine Abnahme mitliefert und keine Sperre, liest sich wie
> eine Freigabe.**

Das ist dieselbe Sorte Befund wie gestern beim Rückweg der Kasse, nur eine
Ebene höher: Nicht ein Satz zeigte ins Leere, sondern ein ganzes Werkzeug ließ
das Wichtigste weg. Und es ist dieselbe Ursache wie bei meiner Antwort — die
Auskunft stand da, und der Weg dorthin war nicht gebaut.

## Was jetzt im Archiv steht

`ABNAHME.txt` beginnt seit heute mit der Sperre und erst dann mit der
Anleitung:

```
NICHT HOCHLADEN, SOLANGE DAS HIER STEHT

  * 4 Pflichtangabe(n) fehlen im Impressum: E-Mail-Adresse für die rasche
    Kontaktaufnahme, Telefonnummer, UID-Nummer, Wortlaut des angemeldeten Gewerbes
    Ein unvollstaendiges Impressum ist im Merchant Center der haeufigste
    Ablehnungsgrund und ausserhalb davon abmahnfaehig (§ 5 ECG, § 14 UGB).

  * 3 Rechtstext(e) gelten ab dem ersten Aufruf und stehen als Gliederung ohne
    verbindlichen Wortlaut: impressum, offenlegung, datenschutz
    Sie gelten gegenueber jedem Besucher, auch ohne Bestellung — eine Gliederung
    ist keine Erklaerung.

Das Archiv ist trotzdem vollstaendig und richtig — es ist zum Vorbereiten da.
Was oben steht, sperrt die Seite, nicht das Paket.
```

**Was ausdrücklich nicht dabeisteht:** der fehlende Zahlungsanbieter, die
Lieferzeit, die Bankverbindung. Sie halten die **Bestellung** auf, nicht die
Seite. Gesperrt ist nur, was ab dem ersten Aufruf gilt — das Impressum nach
§ 5 ECG und die Texte, die `vorDemHochladen` führt.

Eine Sperrenliste, die alle acht offenen Punkte nennte, wäre keine Sperre,
sondern eine Wiederholung von `npm run startklar` — und niemand liest zwei
Listen über dieselbe Sache.

**Und wenn nichts mehr sperrt**, steht dort ein Satz und kein Kasten: *„Nichts
hält das Hochladen auf."* Eine Warnung, die immer dasteht, liest nach dem
dritten Mal niemand mehr.

## Die beiden Regeln

`beilagenbefund` bekommt die Sperren als Beiwert — **gerechnet aus diesem
Bestand, nicht aus dem Archiv gelesen**. Eine Sperre, die aus der Beilage
stammt, prüfte ihre eigene Abschrift.

| Regel | Fall |
|---|---|
| `abnahme-ohne-sperre` | es sperrt etwas, und die Liste sagt es nicht |
| `sperre-ohne-grund-in-der-liste` | der Kasten steht da, eine Sperre fehlt darin |

Die zweite ist die unauffälligere und die wichtigere: Ein Kasten mit einer von
zwei Sperren sieht vollständig aus. **Eine Warnung ohne ihre Gründe überliest
man zuerst.**

## Was der Bestand dabei gemeldet hat

**`pruefe-aussentexte` wollte den neuen Satz im Verzeichnis sehen.**
`sperrentext` baut Text, der dieses Haus verlässt — im Archiv, an den
Auftraggeber. Er steht jetzt in `AUSGAENGE`, mit zwei Proben in
`test/fremdtext.test.js`: Ein Umbruch in einer Feldbezeichnung macht aus einer
Sperre keine zwei.

**`pruefe-tests` hat eine Schleife ohne Längenzusicherung gefunden** — meine,
zwei Minuten alt. Bei leerer Liste hätte sie nichts geprüft und wäre grün
gewesen.

## Was dieser Lauf nicht erreicht hat

- **Die Sperren verschwinden nicht dadurch, dass sie dastehen.** Vier
  Impressumsangaben und der Rechtstextewortlaut bleiben beim Auftraggeber. Was
  sich geändert hat, ist nur, dass das Paket es sagt.
- **`npm run startklar` und die Sperrenliste rechnen zweimal.** Beide lesen
  den Impressumsbefund und das Rechtstexteregister; die Sperrenliste nimmt
  daraus die Teilmenge, die die **Seite** aufhält. Zwei Wege zu einer Zahl sind
  in diesem Haus sonst ein Befund — hier sind es zwei Fragen an dieselbe
  Quelle, und die zweite ist enger. Angesehen und so entschieden.
- **Ob jemand die Datei liest**, weiß niemand. Sie steht jetzt vor der
  Anleitung und nicht dahinter; mehr kann ein Archiv nicht tun.

## Die Frage für den nächsten Lauf

Die Seite darf nicht online, die Bestellung geht nicht, die Anfrage hat keinen
Empfänger — alles wegen Angaben, die nichts kosten und seit dem 10. September
auf einem Zettel stehen. Was der Loop bauen kann, ist gebaut und geprüft;
**was ihn aufhält, ist eine Minute Arbeit an einer JSON-Datei.** Die Frage ist
nicht mehr technisch: Wie sagt man dem Auftraggeber dasselbe ein siebtes Mal,
ohne dass es wie ein Vorwurf klingt?
