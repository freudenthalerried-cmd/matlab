# Die Systemtreue stand in der Prosa. Der Warenkorb kannte sie nicht.

**8. September 2026.** `inhalte/wissen/wdvs-systemaufbau.md` trägt seit dem
ersten Tag einen eigenen Abschnitt:

> **Systemtreue — warum man nicht mischen sollte.** Ein WDVS wird als
> Kombination geprüft, nicht Bestandteil für Bestandteil. Die Prüfgrundlage ist
> ETAG 004; die österreichischen Anwendungskriterien stehen in ÖNORM B 6400.
> **Wer den Klebemörtel des einen Herstellers mit dem Gewebe eines anderen
> kombiniert, verlässt die geprüfte Zusammenstellung.**

Die Gruppenseite sagt es ein zweites Mal: *„Mischen verlässt die geprüfte
Kombination."*

Der Katalog führt genau diesen Fall:

| Rolle | Capatect | Baumit |
|---|---|---|
| Klebe- und Armierungsmörtel | 186 M, 190 FEIN | KlebeSpachtel 25 kg |
| Glasgewebe | Glasgewebe M, 55 m² | TextilglasGitter 1,1 × 50 m |

Zwei Karten nebeneinander auf derselben Seite, kein Unterschied im Aussehen,
und die günstigere gewinnt. **Der Warenkorb rechnete beides anstandslos
zusammen** und der Anfragetext ging so hinaus.

> **Das Lehrbuchbeispiel der eigenen Wissensseite war in diesem Shop
> bestellbar.**

---

## Warum es niemand sehen konnte

Der Katalog führt `gruppe`, `einheit`, `sperrgut`, `gtin`, `preisStand` — **kein
Herstellerfeld**. Der Markenname steht nur im Fließtext der Bezeichnung. Eine
Regel über Hersteller ließ sich also gar nicht ausdrücken, und deshalb stand
sie in der Prosa.

Und ein zweites Detail macht es schlimmer: Die Baumit-Klebespachtel liegt in
der Gruppe **„Mörtel"**, nicht in „WDVS". Sie fällt nicht einmal auf der
Gruppenseite neben ihrem Capatect-Gegenstück auf — wer sie sucht, findet sie
über die Suche, und dort steht keine Warnung.

---

## Was jetzt geschieht

`src/systemtreue.js` liest die Marke aus der Bezeichnung und ordnet jedem
Artikel eine der vier geprüften Schichten zu: Klebe- und Armierungsmörtel,
Glasgewebe, Putzgrund, Oberputz. Enthält ein Warenkorb Schichten aus zwei
Systemen, geht ein Satz an den Kunden — über dieselbe Leitung, die den
Mindestbestellwert trägt, und damit an die **Kasse** und in den
**Anfragetext**.

> Hinweis zur Systemtreue: Ihr Warenkorb enthält Schichten aus zwei Systemen —
> Baumit (Glasgewebe) und Capatect (Klebe- und Armierungsmörtel). … **Wir
> liefern, was Sie bestellen** — diese Zeile soll nur verhindern, dass es
> niemand bemerkt hat.

Der letzte Halbsatz ist Absicht. Der Shop entscheidet nicht, welche
Zusammenstellung geprüft ist; das steht in den Systemunterlagen des
Herstellers, und genau das sagt die eigene Wissensseite auch.

### Wobei ausdrücklich **nicht** gewarnt wird

Nicht jeder Bestandteil ist systemgebunden. Die eigene Wissensseite sagt es
beim Dübel selbst: *Zahl und Anordnung kommen vom Planer oder aus der
**Dübelzulassung**, nicht aus dem Baustoffhandel.* Ein Dübel trägt seine eigene
Zulassung — ihn aus einem anderen Haus zu nehmen ist kein Systembruch. Fünf
Artikel stehen deshalb mit Grund im Register: beide Dübel, die Rondelle, der
Kantenschutz und die Gewebeanschlussleiste.

> **Eine Warnung, die bei jedem Korb angeht, liest nach dem dritten Mal niemand
> mehr.**

`npm run pruefe-systemtreue` misst deshalb beides: Ein Korb aus zwei Systemen
**muss** melden, einer aus einem **darf nicht** — der grüne Fall aus dem Befund
vom 6. September über die sieben Sperren, die alle nur ihren eigenen Sperrgrund
kannten. Und er prüft, ob der Satz die Kasse wirklich verlässt; die Gegenprobe
schneidet genau diesen einen Weg ab und lässt die Erkennung im Modul stehen.

---

## Zwei Nebenbefunde

**Ein Muster, das zwei Zeichen zu wenig kannte.** Der erste Anlauf las
`Klebe[- ]?(und )?Spachtel` — zwischen „Klebe-" und „und" stehen aber
*Bindestrich und Leerzeichen*. Ausgerechnet die beiden Capatect-Massen fielen
durch, also die Hälfte des Falls, um den es geht. Eine Schicht, die kein Muster
trifft, verschwindet lautlos aus der Prüfung; das Register meldet sie seither
als `artikel-ohne-schicht`.

**Ein Hinweis ist kein offener Punkt.** Die Leitung `offen` trug bisher nur
Punkte, die den Auftrag wirklich aufhalten. Der neue Satz erschien deshalb im
Kundendokument als *„Offen: Hinweis zur Systemtreue …"* — und sagte dem Kunden,
seine Bestellung sei unvollständig, obwohl sie es nicht ist. Ein Hinweis steht
jetzt ohne dieses Präfix.

---

## Und eine Entscheidung über das Bündel

`shopkern.js` ruft das neue Modul, also muss es in den Browser. Die Bündelliste
trägt seit dem 29. August die Regel, warum dort so wenig steht wie möglich:
*„Was im Browser steht, ist veröffentlicht."* `kostenbild.js` und `preis.js`
bleiben draußen, weil sie die **Methode** des Betriebs tragen.

`systemtreue.js` darf hinein: Es enthält keine Zahl und keine Rechnung, sondern
Bautechnik, die auf den eigenen Inhaltsseiten ohnehin veröffentlicht ist — und
es **muss** hinein, denn der Warenkorb entsteht im Browser.
