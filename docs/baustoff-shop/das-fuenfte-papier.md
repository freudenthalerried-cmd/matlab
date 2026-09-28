# Das fünfte Papier

**12. September 2026. Runde 47.**

## Der Fund

Ein Geschäftsfall erzeugt fünf Papiere. Vier davon gehen seit dem 12. September
mit ihrer Durchschrift in die Akte: Angebot, Auftragsbestätigung, Rechnung,
Absage. Das fünfte ist die **Bestellung beim Lieferanten**.

`erzeugeBestellungen` baut ihren Text seit dem 30. August, und
`npm run vorgang` **zeigt** ihn unter jedem Angebot. Abgelegt wurde er nie.

> **Wenn die Ware kommt, ist die Bestellung das Papier, gegen das jemand sie
> prüft.** Ohne Durchschrift gibt es nichts, woran eine Falschlieferung
> auffällt — und § 132 Abs 1 BAO verlangt die Geschäftspapiere ohnehin sieben
> Jahre.

Die Karte des Betriebs führte den Schritt mit `werkzeug: null` und dem Grund:
*„Was fehlt, ist das Absenden: Es geht per Mail an einen Dritten, und das ist
nach PARAMETER.md dem Auftraggeber vorbehalten."* Der Satz stimmt unverändert
— **und ist kein Grund, kein Werkzeug zu haben.** Kein Beleg dieses Hauses
wird versendet; die anderen vier haben trotzdem eines.

## Zwei Zahlenreihen für dasselbe Blatt

`ARTEN` führte die Lieferantenbestellung mit `nummernkreis: true` — ein
eigener, fortlaufender Kreis. Das Papier bringt seine Nummer aber **mit**:
Vorgangsnummer plus laufende Teillieferung, `2026-0110-01`, gebildet seit dem
30. August.

Gerufen hat den Kreis nie jemand; er wäre beim ersten Ablegen zur zweiten
Nummer geworden — derselbe Fehler wie am 4. September bei der Angebotsnummer
und am 11. bei der Rechnung, wo gedruckt und abgelegt zwei verschiedene Zahlen
trugen. Aufgelöst wird er wie dort: **zugunsten des Papiers.** Fortlaufend und
einmalig verlangt § 11 Abs 1 Z 5 UStG ohnehin nur für die Rechnung.

Die Durchschrift heißt deshalb `LB-2026-0110-01.txt`: das Kürzel der Art, weil
die mitgebrachte Nummer es nicht trägt, und sonst genau die Nummer vom Blatt.

## Was hier ausdrücklich nicht läuft

Die **Interna-Prüfung**. Sie hält seit dem 11. September jeden Kundenbeleg
gegen `src/interna.js`, und dort steht der Einkaufspreis an erster Stelle.

> **Auf einer Bestellung an den Lieferanten ist der Einkaufspreis keine
> Verfehlung, sondern der Gegenstand: Es ist sein eigener Preis.**

Das Ausgangsverzeichnis trennt die Empfänger seit dem 11. September genau
dafür — `gehtNachDraussen` fragt nach „Kunde" und „Besucher", nicht nach
„Lieferant". Umgekehrt gilt Gate 39 weiter in die andere Richtung: Der Name
des Lieferanten steht **nicht** in der Journalzeile. Die Akte ist nicht der
Ort, den Bezugsweg zu wiederholen.

## Die Sperren, die von selbst mitkamen

| | |
| --- | --- |
| Gate 20 | ohne `--bezahlt` kein Lauf; ohne bekannte Lieferzeit kein Auslösen |
| Lückenmarke | `sperreLuecken` — dieselbe Regel wie bei den vier anderen |
| Probenschalter | ausgetauschte Grundlagen legen nicht in der echten Akte ab |

Alle drei stehen seit den Runden 37 bis 42 an **einer** Stelle und wirkten für
die neue Stufe, ohne dass etwas zu tun war. Das ist der Ertrag daran, eine
Regel einmal hinzuschreiben statt viermal.

**Und die erste Sperre greift sofort:** In der Wirklichkeit lässt sich diese
Stufe heute nicht fahren — die Lieferzeit des einen Lieferanten ist unbekannt,
und das ist eine der fünf offenen Fragen an ihn. Gefahren wird sie nur in der
Probe, mit einer Lieferantendatei, die eine Lieferzeit trägt. Genau wie die
Rechnung, die bis Tag X an der fehlenden UID hängt.

## Ausgang

| | |
| --- | --- |
| Papiere mit Durchschrift | 4 von 5 → **5 von 5** |
| `--stufe bestellung` | neu, mit `--bezahlt` und `--ablegen` |
| `ARTEN.lieferantenbestellung` | `nummernkreis: true` → **false**, mit Grund |
| Stufen des Werkzeugs | 4 → **5**, und die Karte hat für jede einen Platz |
| Testfälle | 2.397 |
| Gegenproben | 214 → **215** |

---

**Die Regel dieser Runde:** *Dass ein Schritt in der Welt endet, heißt nicht,
dass er im Rechner nichts hinterlässt — das Papier davor gehört aufgehoben.*
