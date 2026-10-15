# Ein Feldwert und ein Abruf

**10. September 2026**

Seit dem 9. September steht in der Bereitschaftsliste:

> *„Repository ist privat — gemessen am 9. September: **öffentlich**."*

Das war ein Fortschritt gegenüber dem Fragezeichen davor. Es war aber ein
**Feldwert**: Die Schnittstelle antwortet `visibility: public`, und daraus folgt
mit einem Zwischenschritt, dass die Einkaufspreise offenstehen.

Der Zwischenschritt war nie gegangen worden.

---

## Gemessen: was ein Fremder bekommt

Ohne jeden Zugangsschlüssel — die Umgebungsvariablen ausdrücklich entfernt:

```
api.github.com/repos/…                     HTTP 200
raw.githubusercontent.com/…/POS-10095.html HTTP 200, 37.928 Bytes
```

Eine gebaute Artikelseite, heruntergeladen von jemandem ohne Konto.

Auf ihr steht der Verkaufspreis netto. Die Zielmarge von 25 % steht an Dutzenden
Stellen desselben öffentlichen Verzeichnisses. Aus genau diesen Bytes rechnet
`npm run pruefe-geheimnis` **44 von 46 Einkaufspreisen auf den Cent** zurück.

> **Ein Feldwert sagt, wie es eingestellt ist; ein Abruf sagt, was jemand
> bekommt.**

---

## Was dabei gehalten hat

Der öffentliche Katalog `data/katalog-baustoff.json` trägt **keinen einzigen**
Einkaufspreis — geprüft: Das Feld `ekNetto` kommt darin nicht vor. Die
Konditionen liegen ausschließlich in `preise/`, und das steht in `.gitignore`.

Die Absicherung, die gebaut wurde, hält also. Die Lücke ist eine andere und war
von Anfang an bekannt: **Der Verkaufspreis muss auf die Seite, und die Marge
steht in jeder Erklärung.** Zwei Zahlen, die beide dort hingehören, ergeben
zusammen die dritte, die nirgends hingehört.

Und ausgerechnet die zwei Artikel, bei denen die Rückrechnung **nicht** aufgeht,
sind die, deren Verkaufspreis am Listendeckel gekappt wurde (Gate 22): *Die
Kappung ist das Einzige, was etwas verbirgt.*

---

## Was ich nicht getan habe

Der Zugangsschlüssel in dieser Umgebung darf schreiben — das ist seit der
Vorrunde gemessen, und `PATCH /repos/…` mit `{"private": true}` wäre ein
Aufruf.

**Ich habe ihn nicht gemacht.** Die Sichtbarkeit eines fremden Repositorys ist
keine Änderung an dieser Arbeit, sondern eine an der Sache des Auftraggebers,
nach außen wirksam und von ihm nicht verlangt. Sie steht seit dem 9. September
als **seine** Entscheidung in der Liste, und dass ich sie seit gestern technisch
ausführen könnte, macht sie nicht zu meiner.

Was ich stattdessen tun konnte: die Empfehlung von einer Folgerung zu einem
Beleg machen. Sie lautet unverändert **privat stellen** — und beruht jetzt auf
einer Datei, die jemand ohne Konto in der Hand hatte.

---

## Im Register

`fremder-zugriff` ist seither eine eigene Außengrenze mit Weg, Datum und Beleg;
`npm run pruefe-grenzen` führt sie unter den überschreitbaren. Die
Bereitschaftsliste sagt nicht mehr „öffentlich", sondern nennt den Abruf.

Zwölf behauptete Grenzen, acht mit belegtem Versuch.
