# Im Postfach hießen alle Anfragen gleich

**8. September 2026, abends.** Zwei Stellen im Bestand behaupteten, die
Anzeigenstatistik kenne die Anfragen:

> `src/rollout.js`: *„Kaufquote = Anfragequote × Auftragsquote. **Die erste
> zählt Google**, die zweite zählt niemand."*
>
> `src/werbewirkung.js`: *„Die Anzeigenstatistik kennt **Klicks und
> Anfragen**."*

Beides stimmt nicht, und der Bestand weiß es an anderer Stelle sehr genau:

- Die Anfrage geht per `mailto:` aus dem **Programm des Kunden** hinaus.
- `npm run pruefe-datenschutz` sucht in jeder gebauten Datei nach `gtag(`,
  Analytics, Matomo, Pixeln — und **verbietet sie**. Gemessen: keine einzige
  Zählmarke im ganzen Shop.
- Die Datenschutzzusage nennt genau **einen** Speicherschlüssel, den
  Warenkorb. Ein Herkunftszähler im Browser wäre ein Bruch, und derselbe
  Prüfer misst das.

Google zählt **Klicks**. Beide Quoten entstehen im Postfach des Betreibers —
und die Etappe „Anfragen und daraus entstandene Aufträge mitschreiben" steht
seit dem 3. September genau deshalb im Plan.

---

## Der Fund, der daraus folgt

Der Versuch läuft über **drei Anzeigengruppen mit sehr verschiedenen
Klickpreisen** — Kamin 9,41 €, Dämmung 5,91 €, WDVS 4,19 € —, und nach
fünfundvierzig Tagen soll **je Gruppe** entschieden werden, ob sich der Klick
trägt.

Die Anfrage nannte: Datum, Positionszahl, Bezirk.

> **Ein Versuch, der drei Gruppen unterscheiden soll, braucht eine Anfrage,
> die sagt, aus welcher sie kommt.**

Der Betreiber hätte nach 45 Tagen eine Gesamtzahl gehabt und drei
Entscheidungen treffen müssen.

### Was jetzt in der Mail steht

```
Betreff: Anfrage 2026-09-08 — 2 Positionen Kamin/WDVS, Bezirk Perg

Baustelle im Bezirk: Perg
Erstellt am: 2026-09-08
Warengruppen: Kamin, WDVS
```

Im Betreff, damit die Postfachliste sich sortieren lässt, ohne jede Mail zu
öffnen — und im Text, weil wer weiterleitet oder ausdruckt den Betreff
verliert.

**Was das ist und was nicht:** Es ist die Gruppe der **bestellten Ware**, nicht
die der **angeklickten Anzeige**. Wer über die Kaminanzeige kommt und Dämmung
kauft, erscheint unter Dämmung. Die angeklickte Anzeige wüsste nur ein Zähler
im Browser — und der ist hier ausgeschlossen, nicht aus Nachlässigkeit,
sondern weil die Datenschutzzusage genau einen Speicherschlüssel nennt und ein
Prüfer das misst. Das steht so im Modul, damit niemand die Zahl später für
mehr nimmt, als sie ist.

---

## Drei eigene Fehler an einer Stelle — jeden hat die Gegenprobe gefunden

Die Regel dazu (`gruppenbefund`: jede Gruppe im Korb muss in der Anfrage
stehen) war in zwanzig Minuten geschrieben und dreimal wirkungslos.

| Anlauf | Fehler | was die Gegenprobe sagte |
|---|---|---|
| 1 | `befund.meldungen` nicht mitgezählt | „meldete trotz Mutation grün" |
| 2 | Block stand **innerhalb** von `if (geheim.length)` | dasselbe |
| 3 | `ziel.sauber` gesetzt, `befund.sauber` nicht | dasselbe |

Der zweite ist der bemerkenswerte. Er ist **wörtlich** der Befund vom
4. September über die Bankverbindung:

> **Eine Prüfung, die nur im ungenutzten Fall greift, ist keine.**

Damals lag der Bankverbindungs-Hinweis im Zweig für eine offene Rechnung mit
Zahlungsziel, den Gate 21 mit null Tagen unerreichbar gemacht hatte. Diesmal
lag meine Regel im Zweig für einen Geheimnisfund, den es nie gibt. Vier Tage
zwischen den beiden, dieselbe Form.

Und alle drei Male war die Meldung dieselbe — *„meldete trotz Mutation grün"*.
Ohne die Gegenprobe stünde jetzt ein Prüfer im Register, der nie etwas findet,
und `npm run alles` wäre grün.

> **Eine Regel, die niemand anschlagen sieht, ist eine Behauptung über den
> Bestand.**
