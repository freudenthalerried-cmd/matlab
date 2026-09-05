# Sechs Sätze über den Code, auf einer Rechtsseite

**2. September 2026, abends.** Weiter mit der Methode, diesmal die Seite, die
jeder Besucher aufrufen kann und deren Sätze im Streitfall zählen: die
**Datenschutzseite**.

Sie ist ausdrücklich kein fertiger Rechtstext — der Wortlaut kommt vom
Rechtstexteanbieter. Was sie schon trägt, ist ein **technischer Befund**, den
außer dem Bau niemand kennt:

| | |
|---|---|
| Keine Cookies | weder eigene noch fremde |
| Warenkorb im Browser | `localStorage`, Schlüssel `freudenthaler-shop-warenkorb-v1`, nicht an den Server übertragen |
| Keine Zählpixel, keine Analyse | kein Analysewerkzeug, kein Werbenetzwerk |
| Keine fremden Einbindungen | seit 29.08. lädt keine Seite eine Datei von einem fremden Server |
| Verweise auf Herstellerseiten | verlinkt, nicht eingebettet |
| Serverprotokoll | hängt am Hoster, noch nicht entschieden |

Das sind sechs **Aussagen über den Code**. Geprüft war, dass sie **dastehen**:
`test/website.test.js` sucht die Zeichenkette „Keine Cookies" auf der Seite.
Ob sie stimmt, hat niemand gemessen.

> **Eine Zusage auf einer Rechtsseite, die niemand nachmisst, ist eine
> Behauptung mit Haftung.**

Ein einziges `document.cookie`, ein Zählpixel, eine eingebundene Schrift, ein
`fetch` — und der Satz ist unwahr, ohne dass ein Prüfer rot wird.

Genau eine der sechs hatte eine Messung hinter sich: die über die fremden
Einbindungen, seit dem 29. August, weil an dem Tag drei Schriften von
`fonts.googleapis.com` kamen und mit ihnen die IP-Adresse jedes Besuchers.
**Der Satz existiert, weil der Fehler passiert ist** — und er war der einzige,
der bewacht wurde.

## Was jetzt gemessen wird

`npm run pruefe-datenschutz` liest die **82 gebauten Dateien** — HTML, das
Bündel, die Stilvorlagen — und misst je Zusage:

| Zusage | was gelesen wird |
|---|---|
| Keine Cookies | `document.cookie`, `Set-Cookie`, das entsprechende `<meta http-equiv>` |
| Warenkorb im Browser | der genannte Schlüssel muss der benutzte sein; jeder **andere** Speicherschlüssel fällt auf; und „nicht an den Server übertragen" heißt: kein `fetch`, kein `XMLHttpRequest`, kein `sendBeacon`, kein `WebSocket`, kein `EventSource` |
| Keine Analyse | die Namen der verbreiteten Zähl- und Werbewerkzeuge |
| Keine fremden Einbindungen | jede Einbindung, die der Browser **von sich aus** holt — Verweise nicht |
| Verweise nicht eingebettet | kein `iframe`, `embed`, `object` — **und** die Gegenrichtung: Gibt es die Verweise überhaupt? Eine Zusage über etwas, das es nicht gibt, ist keine |
| Serverprotokoll | nicht messbar, mit Grund |

Jeder Eintrag trägt jetzt eine Kennung, und `pruefbar: false` verlangt
`warumNicht` — dieselbe Pflicht wie bei den offenen Punkten und den
Außentexten. Wer eine siebte Zusage hinzufügt, muss beim Schreiben des Grundes
merken, dass er keinen hat. Eine Zusage ohne Kennung meldet der Prüfer als
solche; eine mit Kennung, zu der keine Messung existiert, ebenfalls.

Heute: **6 Zusagen, 5 gemessen, 0 Meldungen.**

## Was der Lauf ausdrücklich nicht kann

Er misst den **technischen Befund**, nicht die Erklärung. Ob die Erklärung
vollständig ist, ob die Rechtsgrundlagen stimmen, ob die Informationspflicht
gegenüber dem Ansprechpartner auf der Baustelle so verlagert werden darf — das
entscheidet der Rechtstexteanbieter, und das steht als offener Punkt in
`npm run offenepunkte`. Der Prüfer sagt das in seiner eigenen Ausgabe, damit
ein grüner Lauf nicht für mehr genommen wird, als er ist.

Eine Regel steht auch in den Proben: **In dieser Liste darf kein Paragraph
vorkommen.** Sobald dort „Art. 6 Abs. 1 lit. b" oder „die DSGVO verlangt"
steht, ist es Rechtstext, den niemand beauftragt hat. Der technische Befund
gehört dem Bau, der Rechtstext der Kanzlei.

## Die Gegenprobe, die zuerst nicht anschlug

Der erste Versuch hängte einen **Kommentar** an `shop-ui.js`:
`// document.cookie = "x=1";`. Der Prüfer blieb grün — das Bündel wirft
Kommentare weg. Eine Mutation, die der Bau entfernt, ist keine.

Jetzt hängt sie echten Code an. `23 von 23`.

## Stand

| | |
|---|---|
| Zusagen auf der Datenschutzseite | 6 |
| davon gemessen | 5 |
| gelesene gebaute Dateien | 82 |
| Prüfer ohne Browser | 18 |
| Tests | 1260 |
| Gegenproben, die anschlagen | 23 von 23 |

Nicht getan: **kein Wort zum Mediengesetz.** Das Impressum nennt § 5 ECG und
§ 14 UGB; ob eine Offenlegung nach § 25 MedienG dazugehört, ist eine
Rechtsfrage, und der Netzausgang dieser Umgebung ist gesperrt. Sie gehört in
die Beauftragung der Rechtstexte und nicht in einen Bau, der sie raten müsste.
