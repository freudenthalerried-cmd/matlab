# Ein Fall war zwei Jahrgänge

**13. September 2026. Runde 65.**

## Der Fund

Ein ganz gewöhnlicher Geschäftsfall am Jahresende: Angebot am 20. Dezember,
Annahme am 22., Rechnung am 15. Jänner. Gemessen:

```
  Vorgang 2026-0500 — 2 Eintrag/Einträge, Journal 2026
    Bindefrist: mit der Annahme am 2026-12-22 erledigt
    Stand: zuletzt „annahme"  ·  Als Nächstes: Der Kunde zahlt

  Vorgang 2026-0500 — 1 Eintrag/Einträge, Journal 2027
    FEHLT: auftragsbestaetigung — rechnung liegt in der Akte, das Papier davor nicht
    Stand: zuletzt „rechnung"

2 Vorgang/Vorgänge laufen, 0 sind abgeschlossen.
```

> **Ein Fall, zweimal gezählt, zweimal mit halbem Stand** — und der jüngere
> Teil mit einem Fehlalarm über den schwersten Befund dieses Hauses: Die
> Auftragsbestätigung stand zwei Zeilen weiter oben, nur im Journal des
> Vorjahres.

`npm run pruefe-ablage` wurde davon **rot**. Und ein Prüfer, der bei einem
gewöhnlichen Geschäftsfall rot wird, wird abgeschaltet — mit ihm die Regeln,
die er sonst hält. Das ist derselbe Satz, den dieses Haus seit Gate 38 an
mehreren Stellen aufgeschrieben hat, hier zum ersten Mal gegen eine Regel
gerichtet, die es selbst gestern eingeführt hat.

Die Ursache stand in der Schleife: über die **Journale**, und darin über die
Vorgänge.

## Die Trennlinie, die fehlte

> **Was an der Datei hängt, bleibt beim Jahr. Was am Geschäftsfall hängt,
> gehört zum Vorgang.**

| beim Jahr | beim Vorgang |
| --- | --- |
| die laufende Nummer (`lfd` beginnt je Journal neu) | Stand und nächster Schritt |
| der Belegordner `belege-2026/` | die Bindefrist |
| der Abgleich gegen die Durchschriften | die Voraussetzungen |
| der Buchhaltungsauszug je Periode | die Aufbewahrungsfrist der **Akte** |

Nach der Berichtigung:

```
  Vorgang 2026-0500 — 3 Eintrag/Einträge, Journal 2026 und 2027
    Bindefrist: mit der Annahme am 2026-12-22 erledigt
    Stand: zuletzt „rechnung"
    Als Nächstes: Beleg und Journal bleiben sieben Jahre erhalten
    aufzubewahren bis 31.12.2034 (§ 132 BAO)

1 Vorgang/Vorgänge laufen, 0 sind abgeschlossen.
```

Die Frist kommt aus dem **jüngsten** Jahr des Falls: § 132 BAO rechnet ab
Ablauf des Kalenderjahres, in dem der Beleg entstanden ist, und wer die Akte
so lange behält, behält jeden ihrer Belege lange genug.

## Dieselbe Wurzel, zwei weitere Stellen

**`npm run vermerk`** — gestern gebaut — suchte den Vorgang dort, wo es
schreibt: im Journal des laufenden Jahres. Ein Angebot vom 20. Dezember, zu
dem der Kunde im Jänner anruft, war damit nicht vermerkbar: *„Zu Vorgang
2026-0500 steht nichts im Journal 2027."* Der Fall ist nicht selten, sondern
**jährlich** — und der Vermerk ist für sein Ereignis die einzige Quelle.

Gesucht wird jetzt über alle Jahre, geschrieben weiter ins laufende: Der
Vermerk entsteht heute, und die laufende Nummer beginnt je Journal neu.

**Die Sperre von gestern** — keine Lieferantenbestellung ohne
Auftragsbestätigung — las ebenfalls nur das Journal des Bestelldatums. Eine
Bestätigung vom 22. Dezember und eine Bestellung im Jänner hätte sie **zu
Unrecht** aufgehalten und eine berechtigte Bestellung verhindert. Eine Sperre,
die den Normalfall aufhält, wird als Erstes umgangen.

## Was die Probe lehrte

Der erste Entwurf des Testfalls für den Vermerk legte das zweite Journal auf
**2027** — die Zukunft. Die Gegenprobe schlug nicht an: Gesucht wird im
laufenden Geschäftsjahr, und dort stand der Vorgang ja. Die Probe war grün und
prüfte den Fall nicht.

> **Ein Fall „im anderen Jahr" liegt im Vorjahr, nicht im nächsten.** Das
> Journal der Probe trägt jetzt `geschaeftsjahr() - 1`.

## Ausgang

| | |
| --- | --- |
| `npm run akte` | ein Geschäftsfall ist ein Vorgang, über alle Journale |
| `npm run pruefe-ablage` | Voraussetzungen je Vorgang statt je Jahr |
| `npm run vermerk` | findet den Vorgang in jedem Journal |
| `--stufe bestellung` | findet die Auftragsbestätigung des Vorjahres |
| Testfälle | 2.445 → **2.449** |
| Gegenproben | 241 → **243** |

---

**Die Regel dieser Runde:** *Eine Akte wird nach Geschäftsfällen geführt und
nach Jahren abgelegt — wer nach der Ablage gruppiert, zerschneidet den Fall
genau dort, wo das Geschäft weiterläuft.*
