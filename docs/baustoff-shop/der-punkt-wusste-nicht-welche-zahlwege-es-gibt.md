# Der Punkt wusste nicht, welche Zahlwege es gibt

**9. September 2026.** Die Runde davor endete mit einem offenen Punkt, den ich
selbst notiert hatte:

> *Ein Shop, der nur per Vorkasse verkauft, kann nach dieser Liste nie
> startklar werden — obwohl Gate 21 die Vorkasse ab Start zulässt.*

**Der Satz war falsch.** Gate 21 hat nicht „die Vorkasse" zugelassen, sondern
**EPS und Vorkasse ab Start** entschieden, Karte als Zusatz. Ein Start ohne
EPS ist keine zulässige Sparfassung, sondern eine Abweichung vom Gate. Der
Bereitschaftspunkt verlangt zu Recht einen Anbieter; zu lockern gibt es
nichts.

Der Widerruf steht im Dokument der Vorrunde und in der Statuszeile. Wichtiger
ist, **warum** ich es falsch notiert habe.

---

## Weil der Punkt keinen Zahlweg nannte

Der Bereitschaftspunkt las eine freie Zeichenkette aus `data/betreiber.json`
und sagte:

```
✗ Zahlungsanbieter gewählt
    keiner gewählt — die Kasse löst nichts aus und sagt das auch
```

Kein Wort darüber, **wofür** ein Anbieter gebraucht wird. Um das zu
beantworten, musste ich ins Gate-Register — und beim Lesen aus „EPS und
Vorkasse" ein „Vorkasse genügt" gemacht.

Dabei steht die Antwort seit dem 27. August im Bestand: `ZAHLUNGSBEDINGUNGEN`
in `rechtstexte.js` führt `angeboten`, `ausgeschlossen` und `zurueckgestellt`,
jeden Eintrag mit Grund. Deren eigener Kopfkommentar warnt ausdrücklich:

> *„Das Feld steht hier und nicht in `beleg.js`, weil sonst **zwei** Stellen
> wüssten, welche Zahlwege es gibt."*

Die Bereitschaftsliste war eine **dritte** — eine, die es nicht wusste und
trotzdem entschied.

> **Ein Prüfer, der eine Frage beantwortet, die das Register schon
> beantwortet, beantwortet sie irgendwann anders — und niemand merkt, welche
> der beiden Antworten gilt.**

---

## Was jetzt dasteht

```
✗ Zahlungsanbieter gewählt
    keiner gewählt — EPS-Onlineüberweisung braucht einen und ist nach
    Gate 21 ab Start entschieden; die Kasse löst nichts aus und sagt
    das auch
```

Abgeleitet, nicht geschrieben. Zwei Angaben sind dafür in den Bestand
gekommen, beide dorthin, wo die Sache schon steht:

| Angabe | Wo | Was sie festhält |
|---|---|---|
| `BRAUCHT_ANBIETER` | `zahlung.js` | Vorkasse ist eine Überweisung auf das eigene Konto — dazwischen steht niemand. EPS und Karte laufen über einen Dritten. Jeder Eintrag mit Grund |
| `abStart` | `ZAHLUNGSBEDINGUNGEN` | Gate 21s „EPS und Vorkasse ab Start, Karte als Zusatz" — die Unterscheidung, deren Fehlen den Fehlbefund erzeugt hat |

**Die Karte bleibt aus dem Satz heraus.** Sie braucht auch einen Anbieter, ist
aber ein Zusatz; sie mitzunennen hieße, aus einem Zusatz eine Startbedingung
zu machen.

`anbieterbedarf()` zerlegt die angebotenen Wege in beide Richtungen und führt
eine dritte Liste: **`unbekannt`**. Ein Zahlweg, der dazukommt und keinen
Eintrag hat, fällt auf, statt stillschweigend als „braucht keinen"
durchzugehen.

---

## Fünf Testfälle, und einer wäre mir fast durchgegangen

Beide neuen Register habe ich absichtlich falsch gemacht, um zu sehen, ob die
Testfälle anschlagen. Beim ersten Versuch meldete der Testlauf **28 grün** —
und ich hätte fast „hält nicht" notiert.

Die Mutation war nicht angekommen: Mein Suchtext passte auf keine Stelle, weil
der Eintrag darüber inzwischen einen Kommentarblock trägt. Richtig angesetzt:
**1 von 28 rot.** Der zweite Eingriff — den Kartenweg aus `BRAUCHT_ANBIETER`
entfernen — meldete **2 von 28 rot**.

> **Eine Mutation, die nicht ankommt, sieht aus wie ein Prüfer, der nicht
> anschlägt.** Beides meldet grün, und nur eines davon ist eine gute
> Nachricht.

Das ist heute die dritte Fassung derselben Sache: zweimal hatte ein
umgeschriebener Satz eine Gegenprobe entwaffnet, hier ein Suchtext, der nie
traf. Im Gegenprobenregister hält ein Testfall genau das fest — bei einer
Prüfung von Hand hält es niemand außer dem, der hinsieht.
