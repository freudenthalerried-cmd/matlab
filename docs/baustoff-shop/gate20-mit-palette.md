# Gate 20 rechnet jetzt mit der Palette — und eine kleine Bestellung trägt sich nicht mehr

**28. August 2026.** Seit dem 26. steht in `lieferanten.json` eine Zeile, die
seither niemand verwendet hat:

> Auf der Rechnung über 1.934 € netto: sechs ÖBB-Paletten zu 22,00 €, eine
> Rückgabe mit −20,00 €, Folierung 6,50 € — **118,50 € Nebenkosten, mehr als
> die Frachtpauschale selbst.** Im Rechenkern kamen sie nicht vor.

Damit war Gate 20 („keine Bestellung ohne positiven Deckungsbeitrag")
nachweislich optimistisch. Aufgeschrieben war das; gerechnet wurde es nicht.

## Warum eine Untergrenze und keine Rechnung

Die **Stückzahl** der Paletten hängt an Gewicht und Packmaß, und der Katalog
führt Gewichte für sieben von 46 Artikeln. Eine Palettenzahl zu schätzen wäre
genau die Sorte Annahme, die dieses Vorhaben viermal Geld gekostet hat.

Was sich aus den Belegen **ohne** Annahme ableiten lässt, ist der Boden:

> **Eine Lieferung mit palettierter Ware kostet mindestens eine Palette plus
> Folierung.** 22,00 + 6,50 = **28,50 € je Lieferung.**

Zwei Entscheidungen dazu, beide in Richtung Vorsicht:

- **Die Rückgabegutschrift (−20,00 €) wird nicht gegengerechnet.** Sie fällt
  nur an, wenn die Palette zurückgeht. Elf der fünfzehn Rechnungen lauten
  „Abholung Kunde"; was dabei mit der Palette geschieht, steht auf keinem
  Beleg.
- **Die Kranentladung (7,50 € je Hub) steht nicht in dieser Summe.** Sie wird
  dem Kunden als Sperrgutzuschlag weiterverrechnet und steckt schon in der
  Fracht. Ein zweites Mal abgezogen wäre sie doppelt bezahlt.

Gate 20 bleibt damit optimistisch — aber nachweislich weniger als vorher, und
es steht dabei, um wie viel.

## Der Befund: 96 € Warenwert reichen nicht mehr

50 m² Fassaden-EPS, Fracht wird dem Kunden verrechnet, Zahlweg Vorkasse
(also ohne Gebühr — die günstigste Annahme):

| Warenwert netto | Deckungsbeitrag vorher | jetzt |
|---|---|---|
| 19,30 € (10 m²) | +4,80 € | **−23,70 €** |
| 96,50 € (50 m²) | +24,00 € | **−4,50 €** |
| 231,60 € (120 m²) | +57,60 € | +29,10 € |
| 579,00 € (300 m²) | +144,00 € | +115,50 € |

**Der Nulldurchgang für palettierte Ware liegt bei rund 114 € Warenwert** —
28,50 € geteilt durch die Handelsspanne. Bei frei-Haus-Lieferung, die es hier
ohnehin nicht gibt, läge er bei rund 446 €.

Das heißt: Eine palettierte Bestellung unter etwa 114 € Warenwert ist ein
Verlustgeschäft, **auch wenn der Kunde die volle Fracht zahlt.** Gate 20
verweigert sie ab sofort automatisch, statt sie durchzuwinken.

## Was das für die Preisgestaltung offenlässt

Drei Wege, und keiner davon ist heute zu entscheiden, weil alle drei den
Kunden betreffen:

1. **Mindestbestellwert für palettierte Ware** (rund 120 € netto) — der
   ehrlichste, weil er das Problem dort löst, wo es entsteht.
2. **Palettenzuschlag ausweisen**, wie der Sperrgutzuschlag heute schon —
   passt zur Linie „die unangenehme Zahl steht vorne", macht aber kleine
   Bestellungen teuer statt unmöglich.
3. **Nichts tun** und den Verlust als Anfahrtskosten für Neukunden verbuchen —
   vertretbar, aber nur als Entscheidung, nicht als Versehen.

Vorgeschlagen wird 1. Die Entscheidung gehört dem Auftraggeber, weil sie
sichtbar am Kunden ankommt; bis dahin hält Gate 20 die Bestellung an, und das
ist der sichere Zustand.

## Geprüft

Zwei Mutationen, beide fallen:

- Nebenkosten im Gate ignorieren → drei Proben fallen, darunter die am echten
  Katalog.
- Rückgabegutschrift gegenrechnen → vier Proben fallen.

729 Tests grün (vorher 721), `pruefe-seiten` 57/216/0, `pruefe-inhalte`
24/355/0, `shopprobe` 28, Website 81 Seiten ohne toten Verweis. Der Feed
bleibt bei 43 einreichbaren Artikeln mit der einen offenen Angabe (GTIN).
