# Eine Frist, die längst beantwortet war

**12. September 2026, spät. Runde 59.**

## Der Fund

Seit dem Nachmittag rechnet `npm run akte` zu jedem Angebot die Bindefrist aus
und zählt am Ende, wie viele binden und wie viele verfallen sind. Sie tat es zu
**jedem** Angebot.

Gemessen an einem Vorgang mit Angebot vom 20. August, Auftragsbestätigung vom
22. und Rechnung vom 29.:

```
  Vorgang 2026-0105 — 3 Eintrag/Einträge, Journal 2026
         Bindefrist: bis 2026-09-03 — VERFALLEN seit 9 Tag(en)
    Stand: zuletzt „rechnung"

Angebote: 2 binden noch, 1 verfallen (Stand 2026-09-12).
```

> **Ein abgerechneter Vorgang stand als verfallenes Angebot da** — und die
> Schlusszeile zählte ihn mit.

Darunter steht seit Runde 53 der Satz:

> *Ein verfallenes Angebot bindet nicht mehr — eine Annahme danach ist ein
> neues Angebot des Kunden, und der Preis ist neu zu rechnen (§ 862 ABGB).*

Auf einen Vorgang mit **gestellter Rechnung** angewandt, ist das die
Aufforderung, einem Kunden mitzuteilen, sein Auftrag sei hinfällig.

## Warum die Zahl daneben genauso falsch war

„2 binden noch" ist das, woran der Betreiber abliest, **wie viel Geschäft in
der Luft ist**. Von den beiden war eines am selben Tag angenommen worden. Wer
Angenommenes mitzählt, liest zu viel — und zwar mit der Zeit immer mehr, weil
angenommene Vorgänge sich ansammeln und offene nicht.

Das ist dieselbe Fehlerform wie zweimal heute abend, ein drittes Mal:

| | die Liste kannte | ihr fehlte |
| --- | --- | --- |
| Posteingang | den Eingang | der Ausgang |
| Akte | die Vergangenheit | die nächste Pflicht |
| Bindefrist | den Ablauf | **die Antwort** |

## Was jetzt gilt

Die Bindefrist beantwortet eine einzige Frage: *Bindet dieses Angebot noch?*
Die Annahme beantwortet sie — die Frist ist dann nicht abgelaufen, sondern
**erledigt**.

```
  Vorgang 2026-0101  Bindefrist: bis 2026-09-25 — bindet noch 13 Tag(e)
  Vorgang 2026-0102  Bindefrist: mit der Annahme am 2026-09-11 erledigt
  Vorgang 2026-0105  Bindefrist: mit der Annahme am 2026-08-22 erledigt

Angebote: 1 binden noch, 0 verfallen (Stand 2026-09-12).
```

Der § 862-Satz erscheint jetzt nur noch, wenn es wirklich ein verfallenes,
**unangenommenes** Angebot gibt.

`bindungslage()` in `src/vorgangsstand.js` fragt dafür nach dem Papier, das die
Bindung beendet — Auftragsbestätigung oder Absage —, und nicht nach dem Stand
des Vorgangs. Beides läuft heute gleich; aber der Stand kann sich ändern, ohne
dass sich die Antwort auf diese Frage ändert. **Die Annahme beendet die
Bindefrist; was danach kommt, ändert daran nichts mehr.**

## Der Fall, den es nicht geben sollte

Eine Rechnung ohne Auftragsbestätigung widerspricht der Betriebskette — der
Vertragsschluss kommt vor der Rechnung. Sie beendet die Bindung hier trotzdem:
Die Akte darf nicht behaupten, ein abgerechneter Vorgang warte noch auf die
Annahme. **Die Rechnung ist der stärkere Beweis**, auch wenn der Weg dorthin
unvollständig aufgezeichnet ist.

## Ausgang

| | |
| --- | --- |
| `bindungslage()` | neu in `src/vorgangsstand.js` |
| `npm run akte` | rechnet die Frist nur für unangenommene Angebote |
| Die Schlusszeile | zählt nur noch, was wirklich offen ist |
| Testfälle | 2.433 → **2.435** |
| Gegenproben | 230 → **231** |

---

**Die Regel dieser Runde:** *Eine Frist ist keine Tatsache über die Zeit,
sondern über eine offene Frage — ist die Frage beantwortet, läuft die Frist
nicht ab, sie hört auf zu gelten.*
