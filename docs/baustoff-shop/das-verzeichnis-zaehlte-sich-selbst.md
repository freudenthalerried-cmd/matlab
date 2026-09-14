# Das Verzeichnis zählte sich selbst

**14./15. September 2026, nachts.** Die Zählung der Regelnamen führte zwei
Regeln, die es nicht gibt: `menge-kommt-anders-zurueck` und
`krummer-betrag-wird-uebernommen`, angeblich in `src/regelnamen.js`.

Sie stehen dort — in `REGEL_GEPRUEFT`, also in dem Verzeichnis, das begründet,
warum man sie **anderswo** nicht sieht. Ich hatte sie in der Runde davor
selbst eingetragen.

> **Ein Verzeichnis, das Regelnamen führt, erzeugt keine Regeln.**

Das ist wörtlich dieselbe Lehre wie beim Zahlenregister, das sich am
11. September dreimal selbst meldete, weil es jede geführte Zahl im Feld
`literal` mitträgt. Beim dritten Auftreten desselben Musters gehört es
benannt: **Ein Register über eine Sache ist keine Instanz dieser Sache** — und
jeder Zähler, der beides gleich liest, zählt sich selbst mit.

Unterschieden wird am Nachbarn: Ein Eintrag, der ein `warum:` trägt, ist ein
**Grund**, keine Meldung. Gemessen über den Bestand trifft das genau vier
Stellen — zwei hier und zwei in `src/gegenprobenregister.js`, wo der Suchtext
einer Gegenprobe eine Meldezeile **zitiert**.

## Eine Zahl, die ich falsch geschrieben hatte

Das Dokument der Runde davor sagt, 36 Stellen blieben ungesehen. Es waren
**38**. Der Zähler hat es die ganze Zeit richtig ausgegeben; die Zahl im
Dokument war von Hand danebengeschrieben.

Nach dem Fund oben sind es tatsächlich 36 — aber nicht, weil die Zahl doch
stimmte, sondern weil zwei falsch gezählte Stellen weggefallen sind.

> **Eine Zahl, die aus einem anderen Grund richtig wird, war trotzdem falsch.**

## Sieben Regeln mehr, die jetzt gesehen sind

* **`src/maschinenlesbar.js`** (2) — ein Artikel ohne Beschreibung (ein
  Feedeintrag ohne Beschreibung wird nicht teilweise angenommen, sondern
  abgelehnt) und eine Auszeichnung, deren Angabe **von der Betreiberdatei
  abweicht**. Die zweite ist die dritte von drei Richtungen: nichts da, obwohl
  belegt — etwas da, nichts belegt — **beides da und verschieden.** Was ein
  Assistent zitiert, ist die Auszeichnung; sie behauptet dann eine Anschrift,
  die im Impressum anders steht.
* **`src/aussentexte.js`** (3) — ein Grund für einen Ausgang, den es nicht mehr
  gibt; ein Ausgang, der als ungeprüft begründet **und** geprüft wird; eine
  Probe für einen Ausgang, den kein Verzeichnis führt. Alle drei bewachen
  denselben Satz: Kein Text, der an einen Kunden geht, verlässt das Haus
  ungeprüft auf Interna.
* **`src/entitaet`-Seite von `maschinenlesbar.js`** — zusätzlich der Nachweis,
  dass ein Schrägstrich am Ende einer Adresse **keine** zweite Fassung der
  Firma ist.

## Stand

| | |
|---|---|
| Regelstellen | 486 → **484** (zwei waren nie welche) |
| nie gesehen | 38 → **31** |
| begründet ungesehen | 2 |
| an anderthalb Tagen | 80 → 67 → 56 → 47 → 43 → 38 → 31 |
| Prüfer grün | 55 |
| Testfälle | 2 630 |
| Gegenproben | **307** |

Die neue Gegenprobe lässt das Verzeichnis wieder sich selbst mitzählen.

## Was diese Runde nicht erreicht hat

31 Stellen bleiben, verteilt auf 22 Dateien — die größten Blöcke sind
`bin/systemtreuepruefung.mjs` und `bin/ablagepruefung.mjs` mit je zwei bis
drei. Beide sind Werkzeuge, die etwas **mitbringen**; ob dort derselbe Griff
trägt wie bei der Kopfzeilen- und der Paketprobe, ist nicht gemessen.

Und die Frage der Runde davor ist weiter offen: Wie viele der verbliebenen
Regeln bewachen eine zweite Sperre und können deshalb gar nicht feuern? Zwei
sind so gefunden worden — indem ich versucht habe, sie zum Feuern zu bringen,
und gescheitert bin. Für die restlichen 31 ist dieser Versuch nicht gemacht.
