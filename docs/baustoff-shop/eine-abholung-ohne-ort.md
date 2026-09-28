# Eine Abholung ohne Ort

**6. September 2026, nachts.** Der Rat aus der Runde davor — *„darunter ist
Selbstabholung der bessere Weg"* — hat beim Nachlesen eine Frage aufgeworfen:
**Wo eigentlich?**

Fünf Stellen sagten dem Kunden, er könne selbst abholen:

* die Fragen und Antworten: *„Ja, ausdrücklich vorgesehen. Wer selbst abholt,
  zahlt keine Fracht."*
* die Lieferseite, mit eigener Überschrift *Selbstabholung*
* zweimal der Rat, unterhalb des Mindestbestellwerts sei Abholung der bessere
  Weg (Lieferseite und Wissensseite)
* die AGB, **Punkt 12**: *„Abholung am Betriebssitz ist davon unberührt"* — und
  dieselbe Zeile ging an jeden Kunden außerhalb des Liefergebiets als Trostpreis
  mit.

Der Gründungsparameter dieses Vorhabens steht in `PARAMETER.md`:

> | Logistik | **Reines Streckengeschäft, kein eigenes Warenlager** |

Und **Punkt 4 derselben AGB** sagt: *„Direktversand durch den Hersteller."*

> **Punkt 4 sagt Direktversand vom Hersteller, Punkt 12 sagte Abholung am
> Betriebssitz — in derselben Datei, acht Punkte auseinander.**

Ware, die vom Lieferanten direkt zur Baustelle geht, liegt nie in Marwach 5.
Wer dort hinfährt, steht vor einer Adresse ohne Lager.

---

## Belegt ist das Gegenteil, und es stand längst da

In `data/lieferanten.json`, seit dem 27. August:

> *„Fracht steht auf DREI von fünfzehn Rechnungen; **elf lauten ‚Abholung
> Kunde'**, eine ‚Retour durch Kunde'. **Der Auftraggeber holt meistens selbst
> am Lager Mauthausen ab.**"*

Abgeholt wird also sehr wohl — beim **Lieferanten**, und der abholende Kunde
sind **wir**. Aus einem Ja für uns folgt kein Ja für einen fremden Lkw an der
Rampe.

**Gefragt hat es nie jemand.** Der Brief an den Lieferanten hatte fünf Fragen;
Abholung war keine davon.

---

## Gate 28 — entschieden und begründet

**Abholung wird nicht zugesagt, solange der Lieferant sie nicht bestätigt hat.**

Nicht „auf Anfrage", nicht „vielleicht": Eine Zusage, deren Ort es nicht gibt,
kostet den Kunden die Fahrt und den Shop den Kunden. Und sie ist **kein Weg
unter den Mindestbestellwert** — der Rat zeigte auf eine Tür, die zu sein
könnte. Dieselbe Familie wie *„Bestellen ist möglich"*, nur eine Ebene weiter
außen.

Der Satz wird **abgeleitet**, nicht gestrichen: Steht `abholungDurchKunden`
beim Lieferanten eines Tages auf `true`, sagt der Shop es wieder — mit dem Ort,
den die Antwort nennt. Und zugesagt wird nur, wenn **jeder** Lieferant es
erlaubt: Ein Warenkorb kann Ware mehrerer Lieferanten enthalten, und eine
Zusage für einen Teil liest sich auf der Seite als Zusage für alles.

Was jetzt dasteht:

> Abholung können wir derzeit nicht zusagen. Die Ware geht im Streckengeschäft
> direkt vom Lieferanten zur Baustelle; ein eigenes Lager gibt es nicht, und ob
> unsere Kunden beim Lieferanten abholen dürfen, ist dort angefragt und noch
> nicht beantwortet.

Dazu auf der Lieferseite der Beleg, der dagegen zu sprechen scheint — elf von
fünfzehn Rechnungen, Mauthausen, und wer dort der Kunde ist. Ohne ihn liest
sich die Absage wie eine Ausrede, und der nächste Lauf hebt sie wieder auf.

---

## Die sechste Frage

Neu im Brief an den Lieferanten:

> *„Dürfen Kunden von uns Ware auf unsere Rechnung bei Ihnen am Lager abholen —
> und wenn ja: mit welchem Nachweis, zu welchen Zeiten und an welchem Tor?"*

Damit schließt das eine Gespräch jetzt **zehn** offene Punkte statt neun. Der
neue Punkt `abholung-durch-kunden` steht im Register, und der Prüfer, der
Punkte ohne Frage meldet, hat ihn beim ersten Lauf sofort verlangt.

---

## Geprüft

`test/abholung.test.js`, neun Fälle: die Ableitung (ohne Bestätigung nichts,
mit Bestätigung samt Ort, nur wenn alle Lieferanten zustimmen), die Regel für
sich, die Absage an einen Bezirk außerhalb — und zwei über den **Bestand**:
Keine der 82 gebauten Seiten und keine Textdatei sagt Abholung zu, und die
Lieferseite nennt Grund und Gegenbeleg.

Gegenprobe `abholung-an-einer-adresse-ohne-lager`.

**Ein Prüfer hat unterwegs den Autor korrigiert.** Der neue Satz auf der
Lieferseite lautete zuerst *„abgeholt wird am Lager des Lieferanten in
Mauthausen"* — `pruefe-inhalte` meldete ihn:

> *„Betriebsaussage: ‚am Lager' behauptet Vorrat — dieser Betrieb führt kein
> eigenes Warenlager (PARAMETER.md, Streckengeschäft)"*

Die Regel traf ausgerechnet den Satz, der erklärt, dass es keinen Vorrat gibt —
und sie hatte trotzdem recht: Gemeint ist der Standort des Lieferanten, und so
steht es jetzt da. Der Testfall hält diese Formulierung fest.
