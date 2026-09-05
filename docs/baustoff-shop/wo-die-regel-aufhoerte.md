# Wo die Regel aufhörte

**2. September 2026.** Die Frage vom Ende der letzten Runde: *Welche Regel gilt
nur dort, wo ich sie geschrieben habe?*

Der erste Ort, an dem ich nachsah, war `test/fremdtext.test.js`. Die Datei
beschreibt sich selbst so:

> Diese Datei ist weniger eine Testdatei als ein **Verzeichnis**: Sie zählt
> jede Stelle auf, an der Text den Shop verlässt […] Was hier nicht steht, ist
> ungeprüft — das ist der Zweck der Aufzählung.

Der Satz stimmt. Die Liste nicht.

## Drei Ausgänge fehlten

**Angebot** und **Rechnung** standen darin. Die **Auftragsbestätigung** nicht —
das Dokument, mit dem nach Punkt 2 der AGB der Vertrag zustande kommt, und das
zwischen den beiden anderen liegt. Und der **Anfragetext** samt seiner
**mailto-Adresse** fehlte ganz, obwohl er der einzige Text ist, den der Kunde
selbst verschickt.

> **Eine Regel gilt nur dort, wo jemand sie hingeschrieben hat.** Angebot und
> Rechnung waren geprüft, weil sie an dem Tag im Blick waren; die Bestätigung
> dazwischen nicht, weil sie es nicht war.

Fünf Proben nachgetragen. **Alle fünf halten** — die Auftragsbestätigung geht
durch dieselbe `positionszeilen()` wie die Rechnung, die Kundenanfrage hat ihre
eigene Feldbehandlung, und die mailto-Adresse ist vollständig kodiert. Kein
Defekt, nur vier Wochen ungeprüft.

Das ist der unangenehmere Befund. Ein Leck hätte man geflickt; hier war nichts
zu flicken und trotzdem etwas falsch: **Die Zusicherung galt weniger weit, als
sie behauptete.**

## Dieselbe Familie, den ganzen Tag

Es war nicht der erste Fall. Drei weitere aus denselben vierundzwanzig Stunden:

| Regel | galt | galt nicht |
| --- | --- | --- |
| Lückenmarkierung `[[ … FEHLT ]]` | Kundenbelege (`beleg.js`, 30.08.) | Lieferantenbestellungen (`bestellung.js`) |
| Rückgabewert 1 bei Funden | elf Prüfer | `pruefe-inhalte`, `pruefe-quellen`, `pruefe-tests` |
| Bedingung in Sichtweite | die Akte | derselbe Satz im Quelltext |
| Fremdtextprüfung | Angebot, Rechnung | Auftragsbestätigung, Anfrage, mailto |

Jedes Mal war die Regel richtig und ihr Geltungsbereich **zufällig** — er endete
dort, wo an dem Tag die Aufmerksamkeit endete.

## Was dagegen hilft

Ein Verzeichnis, das von Hand geführt wird, wächst mit der Aufmerksamkeit und
nicht mit dem Bestand. Also wird die Liste jetzt gegen den Quelltext gehalten
statt gegen die Erinnerung.

`src/aussentexte.js` führt zehn Ausgänge mit Empfänger und Form. Dazu ein
**Namensmuster**, an dem sich ein Ausgang erkennen lässt: In diesem Bestand
heißt eine textbauende Funktion durchgehend `erzeuge…`, `baue…`, `…zeile`,
`…Csv`, `…Adresse` oder `…text`. Eine Probe liest alle `export function` aus
`src/`, filtert mit dem Muster und verlangt für jeden Treffer einen Eintrag —
als Ausgang oder als begründeter Nicht-Ausgang.

Das Muster ist bewusst grob und meldet auch Leser (`leseCsv`) und Bauwerkzeuge
(`baueKern`). Neun solche Namen stehen mit Grund in `KEIN_AUSGANG`.

> **Ein zu weites Muster kostet Einträge, ein zu enges kostet Ausgänge.**

Die Gegenprobe: eine Funktion `erzeugeMahnung` an `beleg.js` angehängt. Die
Probe meldet `src/beleg.js:erzeugeMahnung` und wird rot. Danach entfernt.

Zwei weitere Zusicherungen halten das Verzeichnis ehrlich: Jeder eingetragene
Ausgang muss es im Quelltext noch geben — sonst führt die Liste Karteileichen —,
und jeder muss in `fremdtext.test.js` **auch angefasst** werden. Eingetragen und
geprüft sind zwei Dinge.

## Was das nicht kann

- **Es erkennt Ausgänge am Namen.** Eine Funktion `erstelleSchreiben()` fiele
  durch. Das Muster ist eine Konvention dieses Bestands, keine Eigenschaft von
  JavaScript. Wer die Konvention bricht, umgeht die Probe — und merkt es nicht.
- **Es prüft nur `src/`.** Die Bauwerkzeuge in `bin/` erzeugen ebenfalls Text;
  ihr Text stammt aber aus dem Verzeichnis und nicht aus Kundeneingaben.
- **Es sagt nichts über die Güte der Prüfung.** Dass ein Ausgang in
  `fremdtext.test.js` vorkommt, heißt: Sein Name steht dort. Ob die Probe
  dahinter etwas taugt, entscheidet weiterhin `npm run pruefe-tests` — und der
  konnte bis gestern nicht rot werden.

## Die Frage für den nächsten Lauf

Vier Runden, vier Fragen, vier Funde: *welche Datei liest niemand*, *welche
Zahl rechnet niemand nach*, *welche Gegenprobe schlägt nie an*, *wo hört die
Regel auf*. Alle vier haben nach etwas gesucht, das **fehlt**.

Die nächste dreht die Richtung um:

> **Was steht im Bestand, das niemand mehr braucht?**

Zwei Modelle liegen nebeneinander und sind nach Gate 12 gleichrangig, aber
eines hat seit dem 22. August keinen Auftrag mehr getragen. Die
Radon-Platzhalterartikel, die Entscheidungsmatrix der dreizehn Anfragen, die
Messwerte des Leadmodells — jedes davon ist entweder gültige Grundlage oder
Ballast, der bei jedem Lauf mitgelesen wird. Bisher habe ich nur hinzugefügt.
