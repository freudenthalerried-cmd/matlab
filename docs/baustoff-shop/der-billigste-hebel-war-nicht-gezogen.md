# Der billigste Hebel war nicht gezogen

**11. September 2026. Runde 30.**

## Was gemessen wurde

`ki-sichtbarkeit-konzept.md` steht seit dem 22. August im Verzeichnis und
beantwortet die Weisung, der Shop solle von KI-Assistenten genannt werden. Es
nennt drei Dinge, aus denen bei diesen Systemen Vertrauen entsteht. Das erste:

> **Konsistenz der Entität.** Firmenname, Rechtsform, Adresse, UID,
> Firmenbuchnummer und Telefonnummer müssen **überall identisch** sein. … Das
> ist der billigste und meistvernachlässigte Hebel.

Nachgezählt im Auslieferungsordner: **71 Organisationsblöcke.**

| | |
| --- | --- |
| Blöcke mit `name` und `legalName` | **71** |
| Blöcke mit einer Adresse | **1** (die Startseite) |
| Blöcke mit Straße | **0** |
| Blöcke mit Postleitzahl | **0** |
| Blöcke mit Firmenbuchnummer | **0** |

Die eine Adresse auf der Startseite nannte Ort und Land. Straße, Postleitzahl
und Firmenbuchnummer stehen belegt in `data/betreiber.json`, stehen im
Impressum — und standen in keiner einzigen maschinenlesbaren Auszeichnung.

> **Der billigste Hebel war nicht gezogen, und die Angaben lagen die ganze
> Zeit in der Datei daneben.**

Die siebzig dünnen Blöcke sind dabei nicht die unwichtigen. Es sind die
`seller` der sechsundvierzig Artikelseiten und der Wissensseiten — also genau
der Seiten, die ein Assistent zitiert. Die Startseite ist die eine, die er
vielleicht nie liest.

## Was geändert wurde

Die Organisation wird jetzt an **einer** Stelle gebaut
(`organisationsdaten` in `src/maschinenlesbar.js`) und trägt alles Belegte:
Straße, Postleitzahl, Ort, Land, die Firmenbuchnummer als `identifier` mit
`propertyID: "Firmenbuchnummer"` und die Adresse des Shops. Alle einundsiebzig
Blöcke sind seither identisch.

**Was ausdrücklich nicht passiert:** Ein leeres Feld wird **weggelassen, nicht
geschrieben**. `vatID: ""` wäre keine Angabe, sondern eine Behauptung über eine
fehlende — dieselbe Linie, die dieser Bestand seit dem ersten Tag beim
Impressum zieht.

> **Eine Lücke, die sichtbar ist, ist besser als eine, die gefüllt aussieht.**

Telefon, E-Mail und UID sind heute leer und stehen deshalb nirgends. Sobald
der Auftraggeber sie liefert, verlangt der Prüfer sie in jedem Block — ohne
dass jemand daran denken muss.

## Der Prüfer fand gleich noch eine zweite Fassung

`npm run pruefe-entitaet` (der 60. Prüfer) hält jeden Block gegen die
Betreiberdatei, nach drei Regeln:

1. Jede **belegte** Angabe steht in jedem Block.
2. Keine Angabe steht dort, die in der Betreiberdatei leer ist.
3. Alle Blöcke sagen **dasselbe** — eine Entität, nicht einundsiebzig.

Die dritte Regel hat beim ersten Lauf angeschlagen. Die Organisation auf der
Startseite trug ihre eigene Adresse mit Schrägstrich
(`https://bauversand.com/`), dieselbe Organisation als `seller` auf siebzig
Seiten ohne. Für einen Menschen ist das derselbe Ort; nach dem Maßstab des
eigenen Konzepts sind es zwei Angaben über eine Firma.

Die Zeile ist weg. Die Adresse kommt jetzt aus der Betreiberdatei und wird
so geschrieben, wie die Seite sich selbst schreibt — kanonisch, mit
Schrägstrich, so wie es am 7. September nach demselben Befund für die Seite
selbst entschieden wurde. Das `rel="canonical"` der **Seite** blieb unberührt:
*Die Seite ist nicht die Firma.*

Und der Vergleich musste sich dabei selbst zurechtstutzen: Der erste Wurf
verglich die ganzen Objekte und meldete zwei Fassungen, weil der Wurzelknoten
der Startseite zusätzlich `@context` und das Liefergebiet trägt — beides zu
Recht. **Ein Vergleich, der zu viel vergleicht, meldet den falschen
Unterschied und verdeckt den gemeinten.** Verglichen werden jetzt die
Entitätsfelder.

## Ausgang

| | |
| --- | --- |
| Organisationsblöcke mit voller Adresse | 0 → **71** |
| Fassungen derselben Organisation | 2 → **1** |
| Prüfer | 59 → **60** (`pruefe-entitaet`, 0,2 s — im Haken) |
| Testfälle | 9 neu, 2328 grün |
| Gegenproben | 191 → **194** |

## Was daraus offen bleibt

Nichts Neues. Der Hebel, den dieses Konzept an erster Stelle nennt, hängt
zuletzt an drei Angaben, die längst auf der Liste stehen: **Telefonnummer,
E-Mail-Adresse und UID.** Sie fehlen im Impressum, im Feed und jetzt sichtbar
auch in der Entität — und der Prüfer trägt sie ein, sobald sie da sind.

Was dieser Bestand nicht kann, sagt das Konzept selbst: Punkt 2, die
Bestätigung von außen, *lässt sich nicht schreiben, nur verdienen.*

---

**Die Regel dieser Runde:** *Ein Konzept, das seinen wichtigsten Hebel selbst
benennt, ist noch keine Messung — und der billigste Hebel ist der, den am
ehesten niemand zieht.*
