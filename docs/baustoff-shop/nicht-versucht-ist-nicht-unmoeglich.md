# Nicht versucht ist nicht unmöglich

**9. September 2026, spät.** Zweimal an einem Abend hat sich eine behauptete
Grenze als zu weit gezogen erwiesen.

Zuerst der Vermerk über die veröffentlichte PR-Beschreibung: *„Der Netzausgang
dieser Umgebung erlaubt keine Prüfung der Veröffentlichung selbst."* Das
GitHub-Werkzeug beantwortet sie. Dann der Repositorypunkt der
Bereitschaftsliste: *„von hier aus nicht feststellbar."* Dasselbe Werkzeug,
ein Aufruf, `visibility: public`.

**Beide Male hatte niemand es versucht.** Und beide Male fiel es durch Zufall
auf, nicht durch eine Prüfung.

> **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
> ausschließt.**

Zweimal ist ein Muster. Diese Runde dreht deshalb die Beweislast um.

---

## Das Register

`AUSSENGRENZEN` führt acht Aussagen dieses Bestands über die **Außenwelt** —
nicht über sein Modell. Jede nennt entweder einen **Weg**, auf dem sie zu
prüfen ist, oder einen **Grund**, warum es keinen gibt. `data/aussenlage.json`
trägt zu jedem Weg das Datum, das Ergebnis und einen Beleg.

```
Außengrenzen — 8 behauptete Grenzen, 4 mit belegtem Versuch,
4 ohne Weg und mit Grund; Versuche gelten 30 Tage

  · eigene-adresse             gesperrt, 2026-09-09
  ! repository-sichtbarkeit    moeglich, 2026-09-09
  · herstellerseiten           gesperrt, 2026-09-09
  · rechtsinformationssystem   gesperrt, 2026-09-09
  — hosting-zeitzone           ohne Weg, mit Grund
  — sicherung-beim-hoster      ohne Weg, mit Grund
  — suchvolumen                ohne Weg, mit Grund
  — lieferantenangaben         ohne Weg, mit Grund
```

**Was dieser Prüfer nicht kann:** messen, ob eine Grenze *stimmt*. Er läuft
ohne Netz. Er misst, ob jemand sie **versucht** hat, wann, und ob ein Beleg
danebensteht.

---

## Was die vier Versuche ergeben haben

**Die eigene Adresse — gesperrt, und zwar am Ausgang.** `bauversand.com`
antwortet nicht, aber die bestehende Firmenseite `freudenthaler-bau.at` auch
nicht. Die Sperre liegt also nicht an der Adresse. Der Proxy nennt den Grund
selbst: *policy denial*.

**Die Herstellerseiten — gesperrt, auf beiden Wegen.** Sieben Inhaltsseiten
verweisen auf Merkblätter von Baumit, Schiedel, Synthesa und Isover, und keine
verlinkt eines; der Grund stand seit Wochen als *„aus der Arbeitsumgebung
gesperrt"* da. Nachgemessen: alle sieben Adressen 403 am Ausgang, und der
zweite Weg — der Seitenabruf über das Werkzeug, das bei GitHub funktioniert —
antwortet `EGRESS_BLOCKED`. **Diesmal hält die Behauptung**, und sie hält
gegen den Weg, der die andere widerlegt hat.

**Das Rechtsinformationssystem — gesperrt.** Derselbe Grund. Damit ist keine
der Paragraphenangaben dieses Bestands am Volltext belegt; sie stehen als
Fachwissen da, nicht als Zitat.

**Die Sichtbarkeit des Repositorys — möglich.** Die eine von vier.

---

## Und die vier ohne Weg

Sie sind der eigentliche Prüfstein des Registers, denn „es gibt keinen Weg"
ist der bequemste Satz von allen. Drei von vier sind **keine Grenzen der
Umgebung**, und das sagen sie jetzt:

- **Die Zeitzone des Hostings** war eine echte Frage, bis `bestellung.php` am
  selben Tag seine eigene setzte. Sie bleibt in der Liste, weil ihre Antwort
  vorher den Ausgang entschieden hätte und niemand sie gestellt hat.
- **Das Suchvolumen** ist eine **Ausgabe**, nicht eine Sperre: Der
  Keyword-Planer verlangt ein Konto mit laufender Kampagne, die Alternativen
  50 bis 119 € im Monat. Es fehlt eine Freigabe, kein Weg.
- **Die Lieferantenangaben** sind eine **Anfrage an Dritte** — nach den
  Freigaberegeln dieses Vorhabens dem Auftraggeber vorbehalten. Der Brief
  steht fertig in `npm run pruefe-anfrage`.
- Nur **die Sicherung beim Hoster** ist wirklich verschlossen: kein Zugang,
  keine Umgehung, und die Antwort weiß nur der Auftraggeber oder All-Inkl.

> **Drei von vier „geht nicht" heißen in Wahrheit „ist nicht freigegeben".**
> Das ist ein Unterschied, den ein Auftraggeber lesen können muss.

---

## Die Regeln

| Regel | Wann |
|---|---|
| `grenze-ohne-versuch` | ein Weg ist genannt und niemand ist ihn gegangen |
| `versuch-veraltet` | zuletzt vor mehr als 30 Tagen — eine Sperre von damals ist keine Aussage über heute |
| `beleg-fehlt` | ein Ergebnis ohne Beleg ist eine Behauptung mit Ziffern |
| `ergebnis-unbekannt` | etwas anderes als „gesperrt" oder „moeglich" |
| `grund-zu-duenn` | ohne Weg braucht es einen Grund, und zwar einen ganzen |
| `versuch-ohne-grenze` | ein Versuch, zu dem keine behauptete Grenze gehört |
| `versuch-ohne-weg` | eine Grenze ohne Weg, zu der es einen Versuch gibt — einer von beiden lügt |

Und der Satz, der bei einem überschrittenen Ergebnis erscheint:

> *Wer sie weiter als Grenze führt, behauptet etwas, das er selbst widerlegt
> hat.*

**Gegengeprobt:** Der Versuch zur Repository-Sichtbarkeit umbenannt → die
Grenze steht ohne ihn da, der Versuch ohne sie daneben, `grenze-ohne-versuch`.

---

## Was das nicht löst

**Es ist kein Verzeichnis aller Stellen, die „von hier aus nicht feststellbar"
schreiben.** Das sind über fünfzig, verteilt auf fünfundzwanzig Dateien, und
die meisten erklären eine Entwurfsentscheidung statt eine Umgebung. Hier
stehen die acht Aussagen, an denen eine **Auskunft** hängt. Wer eine neunte
behauptet, wird von diesem Prüfer nicht gefunden — nur, wer eine der acht
ungeprüft altern lässt.

Und die Grenze bleibt, was sie ist: Der Prüfer läuft ohne Netz und glaubt dem
Vermerk. Er misst den **Handgriff**, nicht die Welt.

---

**9 neue Testfälle, 42 Prüfer.** Und ein Nachtrag zum Handgriff selbst: Die
veröffentlichte Beschreibung wurde nach dem Setzen wieder zurückgelesen und
stimmte diesmal **überein** — der erste Abgleich an diesem Abend, der nichts
gefunden hat. Dreimal davor hatte er eine Abweichung gezeigt. *Ein Handgriff,
der dreimal etwas findet und beim vierten Mal nichts, ist nicht überflüssig
geworden.*
