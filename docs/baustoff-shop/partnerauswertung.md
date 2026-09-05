# Der Partner-Auswertungsbogen — die dritte Prüfung steht jetzt vorab fest

Stand: 2026-08-16. Bauprotokoll, keine Analyse. Gate 18 bleibt unberührt.

Das Gate-Register führt drei 0-€-Auslöser. Zwei davon hatten eine vorab
feststehende Auswertung: die dreizehn Lieferantenanfragen (`auswertung.js`
samt Großhandelsweg) und die Keyword-Prüfung (`entscheidungsmatrix.md`). Der
dritte — **drei bis fünf Partneranfragen, sie entscheiden Preisniveau und
Machbarkeit von Gate 9 und 13** — hatte keine. Gate 17 verlangt sie: Die
Regel steht vor den Antworten fest, sonst wird nach dem ersten
enttäuschenden Rücklauf die Regel gebogen statt die Lage erkannt.

## Was gebaut wurde

`partnerauswertung.js`, nach dem Muster des Herstellerbogens. Die
Bedingungen sind aus [`partnerangebot-leadvermittlung.md`](./partnerangebot-leadvermittlung.md)
übernommen, nicht erfunden:

| Bedingung | Grund |
|---|---|
| Namentliche Nennung im Einwilligungstext akzeptiert | Ausschlussfrage — ohne sie ist die Einwilligung unwirksam, die Bauform fällt |
| Leadpreis beziffert, ≥ 100 € | Preisband Stufe A (100–250 €); „gerne, melden Sie sich" ist keine Zahl |
| Rückmeldefrist 24 h akzeptiert | ein Lead, der drei Tage wartet, ist verbrannt |
| Exklusivität leistungsgebunden akzeptiert | sonst kann ein untätiger Partner einen Bezirk stilllegen |

`feuchteArbeiten` (Gruppe C) ist bewusst **Merkmal statt Bedingung**: Ein
reiner Radonsanierer kann Partner sein — aber die Runde weist aus, wie viel
Reichweite das Netz nach Gate 12 abdeckt.

## Die zwei Rundenregeln — und woher die Zwei kommt

**Machbarkeit:** mindestens **zwei** Betriebe bestehen alle Bedingungen.
Nicht einer — denn die Fristenlösung des Partnerangebots (Weg 1) setzt je
Bezirk einen zuständigen Partner **und einen namentlich genannten
Ersatzbetrieb** in den Einwilligungstext. Eine einzelne Zustimmung belegt
die Bauform nicht; das stand bisher nirgends als Zahl.

**Preisniveau:** Von den Bestandenen trägt der **zweithöchste** bezifferte
Leadpreis die Planung — dieselbe Regel wie beim Herstellerbogen: Nicht der
beste Einzelfall trägt, sondern der zweite, der ihn bestätigt. Zusätzlich
wird ausgewiesen, ob der tragende Preis im Band 100–250 € liegt; ein Preis
darüber macht die Runde machbar, verlässt aber das kalkulierte Band und
gehört in die Stufe-B-Verhandlung, nicht in die Planung.

## Geprüft

| | |
|---|---|
| neue Testfälle | 10 |
| Testfälle gesamt | 391, alle grün, 0 mit Verdacht |

Gegenproben an der Prüfung, beide sofort rot, danach zurückgenommen:

| Mutation | |
|---|---|
| eine einzelne Nennung genügt der Machbarkeit | 1 Testfall fällt |
| der beste statt des zweitbesten Preises trägt | 2 Testfälle fallen |

Kein Demo-Umbau: Der Bogen ist Betreiberwerkzeug, wie der Herstellerbogen.

## Kein Gate

Kein Gate ändert sich. Die Anschreiben-B-Ergänzungen (Ausschlussfrage
Nennung, Frage nach Feuchtearbeiten) standen schon im Partnerangebot; der
Bogen setzt sie nur in auswertbare Form um. **Alle drei 0-€-Auslöser sind
damit am Tag ihres Eintreffens auswertbar** — es fehlt für alle drei nur
noch die Freigabe, E-Mails an Dritte zu senden. Nichts wurde gesendet,
nichts gekauft, keine Ausgabe ausgelöst.
