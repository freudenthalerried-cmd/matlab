# Was wirklich vor dem Hochladen stehen muss

**4. September 2026.** Der Auftraggeber hat am 3. September gesagt: *„lade shop
auf bauversand.com hoch und bewirb sie bei google und chatgpt"*. Der Rolloutplan
hält die Etappe `upload` an, und zwar mit dieser Begründung:

> „AGB, Widerruf und Datenschutz stehen als Gerüst mit Begründungen. **Ein
> Gerüst online zu stellen wäre schlechter als kein Text, weil es wie einer
> aussieht.**"

Der zweite Satz ist richtig — für ein Gerüst, das sich für einen Text ausgibt.

**Diese Seiten tun das nicht.** Die AGB-Seite beginnt mit:

> „Das hier ist die Gliederung, nicht der Vertrag. Jeder Punkt steht mit dem
> Grund, warum er nötig ist … Der verbindliche Wortlaut fehlt und wird nicht
> erfunden."

Und die Datenschutzseite mit „Gliederung, kein fertiger Text."

> **Die Begründung war an ihrem eigenen Erzeugnis widerlegt.** Sie beschrieb
> eine Gefahr, gegen die diese Seiten im ersten Satz vorgehen.

## Die härtere Frage, die dahinter liegt

Wenn die Begründung fällt, fällt die Sperre nicht mit — sie braucht eine
richtige. Und die ist schärfer, weil sie zwei Dinge trennt, die bisher in einem
Wort zusammenstanden:

| Pflichttext | ab wann | Grundlage | Stand |
|---|---|---|---|
| Impressum | ab dem **ersten Besuch** | § 5 ECG, § 14 UGB | Gerüst, vier Pflichtangaben offen |
| Offenlegung | ab dem **ersten Besuch** | § 25 MedienG | im Auftrag an den Anbieter, keine eigene Seite |
| Datenschutzerklärung | ab dem **ersten Besuch** | Art. 13 DSGVO | Gliederung, kein Wortlaut |
| AGB | ab dem ersten **Vertragsschluss** | § 864a, § 879 ABGB | Gliederung — und es kommt kein Vertrag zustande |
| Widerrufsbelehrung | nur gegenüber **Verbrauchern** | § 11 FAGG | Gate 7 schließt sie aus |

> **Der Datenschutz blockiert das Hochladen, die AGB nicht.** Wer eine Seite
> aufruft, hinterlässt eine IP-Adresse im Serverprotokoll und bekommt einen
> Warenkorb in den Browser gelegt. Wer nichts bestellen kann, schließt keinen
> Vertrag.

Dass hier nichts bestellt werden kann, ist seit dem 3. September keine
Vermutung, sondern der erste Punkt in `npm run startklar`, am Quelltext
gemessen: kein `fetch`, kein Formular, kein Beacon. Die AGB warten damit auf
etwas, das es nicht gibt.

**Das ist keine Rechtsberatung und soll keine sein.** Es ist die Zuordnung, die
der Rechtstexteanbieter ohnehin trifft. Sie steht hier, damit der Plan nicht
mehr behauptet, es hänge alles an allem — und damit der Auftraggeber sieht, was
seine Frage „kann ich das hochladen?" tatsächlich blockiert.

## Was sich ändert und was nicht

**An der Kette ändert es nichts.** Es ist dieselbe Bestellung beim selben
Anbieter; der Rolloutplan bleibt bei 60 Tagen, `rechtstexte → upload →
indexierung → anzeigen-schalten → klickversuch`. Wer Zeit sparen will, spart
sie nicht hier.

**An der Aussage ändert es viel.** Drei Stellen sagen jetzt dasselbe und
dasselbe Richtige:

- `npm run startklar` nennt beim offenen Punkt die drei Texte, die ab dem
  ersten Aufruf gelten, mit ihrer Grundlage — und sagt dazu, dass AGB und
  Widerruf das Hochladen nicht blockieren.
- `npm run rollout` trägt dieselbe Begründung an der Abhängigkeit.
- `PFLICHTTEXTE` in `rechtstexte.js` ist die eine Quelle dafür; die beiden
  anderen lesen sie, statt sie zu wiederholen.

Drei Testfälle halten es fest, darunter einer, der prüft, dass jeder Eintrag
mit eigener Seite diese Seite auch wirklich hat — ein Register, das eine
Fundstelle führt, die es nicht gibt, ist die nächste Stelle, an der jemand
falsch abbiegt.

## Was der Auftraggeber davon hat

Seine Frage war: hochladen. Die Antwort ist jetzt genau so lang wie nötig:

1. **Vier Impressumsangaben** — E-Mail, Telefon, UID, Wortlaut des Gewerbes.
   Sie liegen ihm vor; es fehlt der Eintrag in `data/betreiber.json`.
2. **Datenschutzerklärung und Offenlegung** als Wortlaut. Das ist eine Ausgabe
   und damit seine Entscheidung; die Zuarbeit steht fertig da — neun Punkte,
   jeder mit Begründung, dazu der technische Befund, den außer dem Bau niemand
   kennt.

**AGB und Widerrufsbelehrung braucht er dafür nicht** — sie stehen im selben
Auftrag, weil es derselbe Anbieter ist, aber sie halten die Seite nicht auf.

## Verweise

- `shop/src/rechtstexte.js` — `PFLICHTTEXTE` und `vorDemHochladen()`
- `shop/src/rollout.js`, `shop/src/startklar.js` — die berichtigten Begründungen
- `shop/test/rechtstexte.test.js` — drei neue Proben
- [`neun-punkte-und-keiner-war-der-weg.md`](./neun-punkte-und-keiner-war-der-weg.md) — warum hier kein Vertrag zustande kommt
