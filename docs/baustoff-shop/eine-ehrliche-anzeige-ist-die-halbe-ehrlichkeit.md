# Eine ehrliche Anzeige ist die halbe Ehrlichkeit

**2. September 2026.** Gestern sind die drei Anzeigen berichtigt worden, die
Vollständigkeit versprachen, obwohl vier von vier Systemlisten eine Lücke
nennen. Die Frage danach war: *Was verspricht der Shop dem Besucher, das er erst
nach dem Klick zurücknimmt?*

Also die Landeseiten gelesen — die drei Gruppenseiten, auf denen der bezahlte
Klick ankommt.

## Eine von drei machte es richtig

**Kamin** nennt seine Lücke im ersten Absatz, ohne dass jemand danach fragen
muss:

> Wir führen Systemteile für einzügige Schiedel-Kamine: Fertigfuß,
> Mantelsteine, gedämmte Innenrohre, Putztüranschluss, Zuluft, Trennstein und
> Regenhaube — **das Anschlussformteil der Feuerstätte steht auf der
> Stückliste, aber nicht im Regal.**

**WDVS** zählte sechs Bestandteile auf und schwieg über den siebten:

> Wir führen Klebe- und Spachtelmassen, Glasgewebe, Dübel, Kantenschutz,
> Putzgrund und Oberputz — die Bestandteile eines Fassadensystems.

Kein Wort davon, dass die Dämmplatte fehlt. Der Besucher, der für 4,19 € auf
eine Fassadenanzeige geklickt hat, muss selbst bemerken, dass in der Aufzählung
die Hauptsache nicht vorkommt.

**Dämmung** sagte „EPS als Fassadenplatte". Der Katalog führt EPS in 2, 3 und
5 cm — Ausgleichsstärken. Dasselbe Zuviel wie in der Anzeige, nur einen
Bildschirm später.

> **Eine ehrliche Anzeige ist die halbe Ehrlichkeit.** Der Besucher klickt und
> landet auf der Seite; dort entscheidet sich, ob er die Lücke liest oder sie
> selbst bemerken muss.

## Berichtigt

Alle drei Seiten sagen es jetzt im Antwortsatz, dort wo Kamin es immer gesagt
hat — und **Kanal dazu**, das der neue Prüfer im selben Lauf fand:

| Seite | jetzt |
| --- | --- |
| WDVS | „… die Bestandteile eines Fassadensystems **bis auf eine: Die Dämmplatte in Flächenstärke führen wir nicht.** Sie steht auf der Stückliste und ist dort gekennzeichnet." |
| Dämmung | „**Die Fassadendämmplatte in Flächenstärke führen wir nicht** — die geführten EPS-Stärken gleichen aus, sie dämmen die Fläche nicht." |
| Kanal | „**Übergangsstücke, Gleitmittel und Abschlussschiene führen wir nicht**, sie stehen auf der Stückliste und sind dort gekennzeichnet." |

## Was die Inhaltsprüfung dazwischen gesagt hat

Mein erster Entwurf für die Dämmungsseite lautete: *„Fassadenplatten in
WDVS-Stärke — sie beginnen bei 8 cm — führen wir nicht."*

`pruefe-inhalte` meldete: **Zahl ohne Quelle.** Zu Recht. Dass eine
WDVS-Dämmung bei acht Zentimetern beginnt, weiß ich — belegen kann ich es
nicht: Die Herstellerseiten und `ris.bka.gv.at` sind aus dieser Arbeitsumgebung
gesperrt.

> **Eine Zahl, die ich nicht belegen kann, gehört nicht auf eine Kundenseite —
> auch wenn sie stimmt.**

Der Satz sagt jetzt dasselbe ohne die Zahl: Die geführten Stärken *gleichen
aus*, sie *dämmen die Fläche nicht*. Das steht im eigenen Katalog und braucht
keine fremde Norm.

## Die Regel

`npm run kampagne` prüft seit heute beide Hälften: Nennt die Systemliste einer
Gruppe eine nicht geführte Position, darf **die Anzeige** keine Vollständigkeit
versprechen — und **die Landeseite** muss die Lücke nennen. Gelesen werden die
eigenen Dateien, nicht eine Liste daneben.

## Zwei Proben, die dabei angeschlagen haben

**Erstens: die Versprechensliste.** `test/shopkern.test.js` führt, was jede
Gruppenseite verspricht, und prüft es in beide Richtungen: Das Wort muss im
Antwortsatz stehen **und** einen Artikel finden. Ich hatte „Fassadenplatte"
aus dem Satz genommen — der Test meldete es sofort.

Mein Ersatz „Ausgleichsplatte" schlug in der **anderen** Richtung an: kein
Artikel heißt so, die Ware heißt „Fassaden EPS 2 cm".

> **Ein Versprechen, das der Kunde nicht eintippt, ist keines.**

Jetzt steht dort „EPS" — das Wort, das auf der Seite steht und die Artikel
findet.

**Zweitens: die halbe Mutation.** Die Gegenprobe zur neuen Regel meldete „schlägt
nicht an". Der Grund war meiner: Die Landeseite nennt ihre Lücke zweimal — im
Kopf und im Fließtext —, und meine Ersetzung traf nur eine. Der Prüfer meldete
zu Recht grün.

Das Register kennt jetzt `alle: true`. **Eine halbe Mutation sieht aus wie ein
blinder Prüfer** — der vierte Fall in drei Tagen, in dem meine Gegenprobe falsch
war und nicht die Sache.

**Elf von elf Gegenproben schlagen an.**

## Die Frage für den nächsten Lauf

Anzeigen und Landeseiten sind durchgesehen. Was dazwischen liegt, ist der Weg:

> **Wie viele Schritte liegen zwischen dem Klick und der Anfrage — und an
> welchem springt der Besucher ab?**

Der Shop erzeugt heute keine Bestellungen, sondern Anfragen. Der ganze bezahlte
Klick ist wertlos, wenn der Weg vom Landen bis zum fertigen Anfragetext länger
ist als die Geduld eines Poliers am Bau. Gemessen hat das noch niemand — und im
Gegensatz zur Kaufquote lässt es sich ohne einen einzigen Besucher zählen.
