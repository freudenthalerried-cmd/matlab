# Acht Gründe, die niemand las

*Lauf vom 15. September 2026. Acht Kundenhinweise im Bestellformular, zwei
neue Regeln, eine Gegenprobe. Der Anlass steht in der Wissensseite von
vorgestern.*

---

## Wie es auffiel

Die Seite „Was die Baustelle können muss" verlangt vom Kunden eine
Telefonnummer, **unter der jemand auf der Baustelle erreichbar ist** — sonst
steht der LKW vor dem verschlossenen Tor und fährt wieder. Beim Schreiben
blieb die Frage offen, ob das Bestellformular das auch sagt.

Es sagt es nicht. Es sagt „Telefon".

Nachgesehen im Register: Jedes der acht Felder trägt seit dem 4. September
einen sorgfältig geschriebenen Grund. Der für die Telefonnummer lautet:

> *Die Spedition braucht sie für die Baustelle. Sie ist deshalb Pflicht und
> nicht Höflichkeit — eine Zustellung ohne erreichbare Nummer fährt zweimal.*

Der richtige Satz stand die ganze Zeit da. Was fehlte, war der Weg nach
draußen: `bin/website.mjs` gab **Name, Beschriftung, Feldtyp und Beispiel** an
die Oberfläche weiter. `warum` blieb im Modul.

> **Ein Pflichtfeld ohne Grund wird irgendwie ausgefüllt, ein Pflichtfeld mit
> einem Satz daneben richtig.**

Wer „Telefon" liest, trägt die Büronummer ein. Das ist keine Nachlässigkeit
des Kunden, sondern die einzig vernünftige Antwort auf die Frage, die
dastand.

## Warum der vorhandene Grund nicht einfach hinausgereicht wurde

Der erste Gedanke war, `warum` durchzuschleifen. Er trägt nicht:

| Feld | was im `warum` steht |
|---|---|
| `uid` | *„Gate 7: Dieser Shop verkauft netto an Unternehmer."* |
| `unternehmerBestaetigt` | *„Gate 7 verlangt beides …"* |
| `strasse` | *„Die Rechnungsanschrift nach § 11 Abs 1 Z 2 UStG."* |

Gate-Nummern sind die interne Entscheidungsordnung — *für den Kunden eine
Chiffre, für den Wettbewerber eine Landkarte*, so steht es in `src/interna.js`.
`findeInterna` hätte den Text zu Recht gemeldet, sobald er eine Kundenfläche
erreicht.

Also zwei Texte je Feld: `warum` für uns, `hinweis` für den Kunden. Und weil
zwei Texte über dieselbe Sache die Bauart sind, an der dieser Bestand seit
Wochen Befunde findet, gleich zwei Regeln dazu:

- **`feld-ohne-hinweis`** — ein Feld ohne Satz für den Kunden, oder einer unter
  vierzig Zeichen, der nur die Beschriftung wiederholt.
- **`hinweis-mit-interna`** — der Weg nach außen hat dieselbe Sperre wie jeder
  andere Text an den Kunden. Die Suche kommt als Beiwert herein, damit die
  Regel von außen erreichbar ist — der Griff vom 14. September.

## Die acht Sätze

Sie sind keine Übersetzung des `warum`, sondern beantworten die Frage, die
sich der Ausfüllende stellt: *Warum will der das wissen, und was passiert,
wenn ich es falsch mache?*

- **Firma** — wie sie im Firmenbuch steht, so kommt sie auf die Rechnung.
- **Straße** — die Rechnungsanschrift, **nicht** die Baustelle.
- **PLZ** — vierstellig, österreichisch; wir liefern nur innerhalb Österreichs.
- **Ort** — fehlt er, müssen wir nachfragen, und das kostet einen halben Tag.
- **E-Mail** — hierher gehen Angebot, Bestätigung und Rechnung.
- **Telefon** — *der Fahrer meldet sich vor der Anlieferung; eine Nummer, unter
  der jemand auf der Baustelle erreichbar ist.*
- **UID** — die Prüfziffer wird nachgerechnet, eine falsche gefährdet Ihren
  Vorsteuerabzug.
- **Unternehmerbestätigung** — mit dem Häkchen erklären Sie, dass Sie nicht als
  Verbraucher bestellen.

Kein Paragraph, keine Gate-Nummer, kein Wort über unsere Ablage. Was der Kunde
davon hat, steht vorne.

## Wo der Satz steht und warum dort

Im `label` wäre er falsch: Ein Screenreader läse ihn als Teil der
Beschriftung, und aus „Telefon" würden vier Sätze. Er steht deshalb als
eigener Absatz **nach** der Zeile, mit `aria-describedby` an das Eingabefeld
gebunden — dann liest der Screenreader erst das Feld und danach die
Erläuterung, so wie ein Sehender erst das Feld sieht und dann darunterschaut.

## Was das heute sichtbar ändert: nichts

Der Bestellweg ist **gebaut und ausgeschaltet** (Gate 26). Solange E-Mail und
Rechtstextewortlaut fehlen, gibt `bin/website.mjs` gar keine Felder hinaus,
und das Formular steht auf keiner Seite. Die acht Sätze wirken am Tag, an dem
der Weg eingeschaltet wird.

Das ist kein Argument dagegen, sie heute zu schreiben — im Gegenteil: Am Tag X
wird eingeschaltet und nicht formuliert. Aber es gehört gesagt, statt einen
Fortschritt zu behaupten, den ein Besucher heute sehen könnte.

## Der Prüfer, der dabei gefehlt hat

Das Register der Bestellfelder war vollständig geprüft — Grund, Beschriftung,
Feldtyp, und in beide Richtungen gegen `pruefeBestelldaten` gehalten. Was
**nicht** geprüft war: ob das, was im Register steht, die Oberfläche
**erreicht**.

Genau diese Lücke hat den `warum` seit dem 4. September festgehalten. Ein
vollständiges Register und eine Oberfläche, die nur die Hälfte davon abholt,
sehen von jeder Seite einzeln richtig aus.

> **Ein Register wird nicht dadurch wirksam, dass es vollständig ist.**

`test/bestellwegbau.test.js` hält jetzt beide Enden fest: dass `hinweis` an
die Oberfläche geht und dass die Oberfläche ihn anzeigt. Die Gegenprobe
`das-formular-schweigt-wieder` kappt den Weg nach draußen wieder; das Register
bleibt dabei vollständig, und genau deshalb fiele es ohne diesen Testfall
niemandem auf. Rot gesehen am 15. September. Gegenproben 310 → **311**.

## Was dieser Lauf nicht erreicht hat

- **Die übrigen Eingabefelder der Kasse** — Menge, Bezirk, Lieferart — haben
  keinen solchen Satz und kein Register, das einen verlangte. Ob sie einen
  brauchen, ist nicht gemessen.
- **Ob die acht Sätze verständlich sind**, sagt kein Prüfer. Er misst Länge und
  Internes; ob ein Satz die Frage beantwortet, die sich der Ausfüllende
  stellt, entscheidet niemand hier.
- **Die Fehlermeldungen des Formulars** sind unberührt. Ein Feld, das man
  falsch ausfüllt, sagt weiterhin, was `pruefeBestelldaten` sagt — und das ist
  für uns geschrieben, nicht für den Kunden. Das ist dieselbe Bauart, einen
  Schritt später.

## Die Frage für den nächsten Lauf

Was sagt das Formular, wenn die Eingabe **falsch** ist? Der Weg nach draußen
ist jetzt für die Frage gebaut; für die Antwort darauf noch nicht. Eine
Meldung wie „uid: Prüfziffer stimmt nicht" ist richtig und hilft niemandem,
der wissen will, ob er sich vertippt hat oder die falsche Nummer nimmt.
