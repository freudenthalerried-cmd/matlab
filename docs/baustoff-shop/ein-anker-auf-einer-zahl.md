# Ein Anker auf einer Zahl, die sich ändert

**10. September 2026**

Die Gegenproben dieses Bestands hängen an **Suchtexten**: Jede nennt eine Datei
und eine Zeichenkette darin, ersetzt sie durch eine falsche und verlangt, dass
der zuständige Prüfer rot wird. 126 der 136 Proben arbeiten so.

Eine davon hat in drei Wochen dreimal aufgehört zu funktionieren:

```
suchen: '**Maßgeblich für alle Gate-Fragen.** Einunddreißig'   → Gate 32 kam
suchen: '**Maßgeblich für alle Gate-Fragen.** Zweiunddreißig'  → Gate 33 kam
suchen: '**Maßgeblich für alle Gate-Fragen.** Dreiunddreißig'
```

Sie sitzt auf dem Zahlwort im Kopf des Gate-Registers — auf **genau der
Stelle, die sich mit jedem neuen Gate ändert.** Jedes Mal fiel es erst auf, als
der Testlauf rot wurde, und jedes Mal habe ich die Zahl nachgezogen und
weitergemacht.

> **Ein Anker auf einer Zahl, die sich ändert, ist ein Anker auf Sand.**

---

## Gemessen: drei von 126

| Probe | Anker | wie oft schon gebrochen |
|---|---|---|
| `der-kopf-des-registers-zaehlt-anders-als-die-tabelle` | das Zahlwort der Gates | **dreimal** |
| `schaufenster-veraltete-leitzahl` | `\| **43.792 €** \|` | die Leitzahl war dreimal falsch |
| `eine-aufgabe-fuer-drei-begriffe-die-es-nicht-mehr-gibt` | „Suchvolumen der **29** Keywords" | 31 → 29 |

Die übrigen 25 Anker mit einer Ziffer sind **stabil** — Artikelnummern,
Konstanten, Quelltextzeilen. Der Unterschied ist nicht „enthält eine Zahl",
sondern „enthält eine Zahl, die *dieser Bestand selbst* laufend ändert".

---

## Der Anker darf jetzt ein Muster sein

Eine Probe trägt seither entweder `suchen` (eine Zeichenkette) **oder**
`suchenMuster` (einen regulären Ausdruck) — genau eines von beiden. Beide
zugleich wäre nicht doppelt gesichert, sondern unentschieden.

```js
suchenMuster: /\*\*Maßgeblich für alle Gate-Fragen\.\*\* \S+/
```

Das Muster beschreibt die Stelle, ohne ihren beweglichen Teil festzuschreiben.
Es überlebt Gate 34.

**Zwei Sicherungen gehören dazu**, weil ein Muster etwas kann, was ein Suchtext
nicht kann — nämlich mehr fassen, als beim Schreiben gemeint war:

- **`muster-greift-zu-weit`.** Fasst ein Muster mehr als 400 Zeichen, ist es
  ein Befund. Ein Suchtext zeigt im Register, was er ersetzt; ein Muster zeigt
  es nicht. `/Gate[\s\S]*Register/` sieht harmlos aus und verschluckt
  vierhundert Zeilen — die ausgeführte Mutation wäre dann eine andere als die
  beschriebene, und ein rot meldender Prüfer bewiese nichts über die gemeinte
  Stelle.
- **Ersetzt wird über Stellen, nicht mit `String.replace`.**

---

## Der Nebenfund: `$&` im Ersetzungstext

`String.replace` deutet in seinem **Ersetzungstext** die Folgen `$&`,
`` $` ``, `$'` und `$1` als Anweisungen. Der Läufer benutzte `replace`.

```js
'abc'.replace('b', '$&')   // → 'abc', nicht 'a$&c'
```

Gemessen: **kein einziger** der 126 Ersetzungstexte enthält heute eine solche
Folge. Neun enthalten `${…}`, was harmlos ist. Der Fehler ist also nie
passiert — aber der Erste, der eine Gegenprobe mit `$&` schriebe, bekäme eine
Mutation, die woanders landet als im Register steht, und ein daraufhin grün
meldender Prüfer sähe aus wie einer, der nicht anschlägt. Genau die Sorte
Befund, die dieser Bestand sonst erst nach Tagen findet.

Die neue Ersetzung schneidet an den gemessenen Stellen und setzt den Text
dazwischen — von hinten nach vorn, damit die früheren Stellen ihre Lage
behalten. Die Falle gibt es damit nicht mehr, statt sie zu verbieten.

---

## Und das Muster hat beim ersten Lauf selbst danebengegriffen

Der erste Anlauf lautete `\w+` statt `\S+`. `\w` ist ASCII: Es trifft
`Dreiunddrei` und bleibt am `ß` stehen. Die Mutation ließ `ßig` liegen und
erzeugte

```
**Maßgeblich für alle Gate-Fragen.** Vierundzwanzigßig
```

Der Prüfer meldete rot — **aber aus einem anderen Grund als dem gemeinten**,
und der Läufer sagte das auch: *„meldete rot, aber nicht wegen
/kopfzahl-abgeloest/"*. Ohne diese Unterscheidung wäre die Probe grün
durchgegangen und hätte nichts bewiesen.

Dieselbe Falle steht seit Wochen in der Befundtabelle dieses Vorhabens: *die
ÖNORM-Regel traf nie — `\b` kennt „Ö" nicht als Wortzeichen.* Sie stand dort,
und ich bin trotzdem hineingelaufen.

> **Ein Befund im eigenen Verzeichnis ist keine Impfung.**

---

## Zweiter Teil des Tages: die Sperre noch einmal vermessen

Gestern fiel auf, dass der Netzausgang **adressweise** verschieden sperrt:
`api.github.com` antwortet, `bauversand.com` nicht. Damit stand die Frage neu,
ob der Volltext der Gesetze doch zu haben ist — 23 Fundstellen tragen seit
Gate 33 `belegt: false`, und der einzige gemessene Versuch galt
`ris.bka.gv.at`.

Vier Adressen versucht, darunter die offenen Daten des Bundes:

```
ris.bka.gv.at        keine Verbindung      api.github.com        200
www.ris.bka.gv.at    keine Verbindung      registry.npmjs.org    200
data.bka.gv.at       keine Verbindung      pypi.org              200
ogd.bka.gv.at        keine Verbindung
```

**Die Freigabe umfasst Entwicklerinfrastruktur, nicht das offene Netz.** Das
ist eine schärfere Aussage als „der Netzausgang ist gesperrt" und eine
nützlichere: Sie sagt dem Auftraggeber, dass die Verifikation der 23
Fundstellen von hier aus auf keinem Weg zu haben ist — nicht aus Bequemlichkeit,
sondern gemessen. Der Weg führt über den Rechtstexteanbieter oder über eine
freigegebene Adresse.

**Was ich nicht getan habe:** den Gesetzestext über eine erlaubte Adresse
besorgen — ein npm- oder PyPI-Paket mit österreichischen Rechtstexten wäre
erreichbar. Eine Fundstelle, die gegen die Kopie eines Dritten geprüft ist,
ist nicht geprüft; Gate 33 verlangt den Volltext. Ein Beleg aus einer
ungeprüften Quelle wäre schlechter als das ehrliche `belegt: false`, weil er
danach aussieht wie einer.
