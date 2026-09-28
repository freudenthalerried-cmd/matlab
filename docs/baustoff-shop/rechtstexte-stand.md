# Rechtstexte: was steht, was fehlt, und was bewusst nicht erfunden wurde

Stand: 2026-08-26. Die Website hat seit heute fünf Rechtsseiten —
Übersicht, Impressum, Geschäftsbedingungen, Datenschutz und Abnahme.
Sie sind **ein Gerüst mit sichtbaren Lücken, kein fertiger Rechtstext.**

## Warum als Gerüst und nicht als Text

Der naheliegende Weg wäre gewesen, plausible Klauseln zu formulieren. Er
wäre der teuerste Fehler dieses Vorhabens geworden:

> Eine erfundene Klausel sieht aus wie Recht, ist keines, und man merkt
> es erst im Streitfall.

Dasselbe gilt fürs Impressum. Eine falsche UID-Nummer ist schlechter als
gar keine: Die fehlende Angabe fällt beim Korrekturlesen auf, die falsche
erst bei der Abmahnung. Deshalb steht in `data/betreiber.json` nur, was
aus Firmenbuch und öffentlichen Verzeichnissen belegbar ist.

## Was jetzt belegt ist

| Angabe | Wert | Quelle |
|---|---|---|
| Firma | Freudenthaler Bau GmbH | Firmenbuch |
| Rechtsform | Gesellschaft mit beschränkter Haftung | Firmenbuch |
| Sitz | Marwach 5, 4312 Ried in der Riedmark | Firmenbuch, eigene Firmenseite |
| Firmenbuchnummer | FN 347938z | Firmenbuch |
| Firmenbuchgericht | Landesgericht Linz | Firmenbuch |
| Gewerbebehörde | Bezirkshauptmannschaft Perg | zuständig nach Sitz |
| Kammer | Wirtschaftskammer Oberösterreich | WKO-Firmenverzeichnis |

## Was fehlt — vier Angaben, alle beim Auftraggeber

| fehlt | woher es kommt |
|---|---|
| **E-Mail-Adresse** | laufender Betrieb |
| **Telefonnummer** | laufender Betrieb |
| **UID-Nummer** | Steuerakt |
| **Wortlaut des angemeldeten Gewerbes** | Gewerberegisterauszug |

Der letzte Punkt verdient eine Anmerkung. Ich habe früher berichtet, der
**Handel mit Baustoffen** sei als Gewerbe eingetragen. Das stammt aus
einer Suchergebnis-Zusammenfassung, nicht aus dem Gewerberegister
selbst. Für ein Impressum ist das zu wenig: Dort gehört der **Wortlaut**
hinein, wie er im Auszug steht, nicht eine Umschreibung. Deshalb steht
das Feld leer, obwohl ich eine Vermutung hätte.

Solange eine dieser vier Lücken sichtbar ist, darf die Seite nicht online
gehen — und die Seite sagt das selbst, gut sichtbar, statt es dem
Gedächtnis zu überlassen.

## Was ohne Verbrauchergeschäft entfällt

Der Shop richtet sich ausschließlich an Unternehmer. Das erspart drei
Pflichten: Widerrufsbelehrung samt Musterformular nach FAGG, die
Verlängerung der Rücktrittsfrist bei fehlerhafter Belehrung und den
Hinweis auf die Online-Streitbeilegungsplattform.

**Das ist keine Ersparnis, sondern eine Bedingung.** Wer
Verbraucherbestellungen nicht wirksam ausschließt, dem gilt
Verbraucherrecht trotzdem — und dann fehlt genau das, was man sich
gespart hat.

Unverändert nötig bleiben: Impressum nach § 5 ECG, Datenschutzerklärung
nach DSGVO, Preisangaben mit gesondert ausgewiesener Umsatzsteuer.

## Der Punkt, der im Baustoffhandel wirklich klemmt

**Der Ansprechpartner vor Ort ist ein Dritter.** Er hat mit dem Shop
keinen Vertrag, seine Rufnummer stammt vom Besteller, und Artikel 14
DSGVO verlangt, *ihn* zu informieren — eine Person, die der Shop nie
erreicht.

Der einzige offene Weg führt über den, der ihn kennt: Der Besteller
sichert im Bestellvorgang zu, ihn unterrichtet zu haben. Das ist keine
Erfüllung der Pflicht durch den Shop, sondern ihre Verlagerung auf
denjenigen, der sie erfüllen kann — samt Dokumentation, dass danach
gefragt wurde. Ob das genügt, entscheidet der Rechtstexteanbieter. Der
Wortlaut liegt vor, damit er darüber reden kann.

## Ein Punkt, der heute noch nicht zutrifft

Die Lieferhinweise nennen mehrere Sendungen an verschiedenen Tagen —
ein Erbstück aus dem ursprünglichen Zuschnitt mit mehreren Herstellern.
Das jetzige Sortiment läuft über **einen** Lieferanten.

Der Punkt bleibt trotzdem stehen, und die Seite sagt dazu, dass er
gerade nicht gilt. Begründung für diese Selbstentscheidung: Sobald ein
zweiter Lieferant dazukommt, gilt er wieder — und ein Hinweis, der
einmal weggelassen wurde, kommt erfahrungsgemäß nicht zurück. Ein
sichtbar als „gilt noch nicht" markierter Punkt ist ehrlicher als ein
gelöschter.

## Was das für den Merchant-Center-Weg heißt

`google-kampagne.md` nennt fehlende Pflichtangaben als Ablehnungsgrund
Nummer eins. Der Stand jetzt:

| | |
|---|---|
| Impressum | Gerüst steht, **4 Lücken** |
| AGB | Gliederung in 13 Punkten mit Begründung, **Wortlaut fehlt** |
| Datenschutz | Gliederung in 9 Punkten, **Wortlaut fehlt** |
| Widerruf | entfällt bei reinem B2B |

Der verbindliche Wortlaut kommt vom Rechtstexteanbieter mit
Aktualisierungsdienst, wie in `phase5-technik.md` vorgesehen. Das ist
eine laufende Ausgabe und damit eine Entscheidung des Auftraggebers —
sie wird hier nicht ausgelöst.

## Nächste offene Punkte

1. Die vier Impressumsangaben eintragen (Auftraggeber).
2. Rechtstexteanbieter beauftragen — Ausgabe, Freigabe nötig.
3. GTIN beschaffen — Anfrage an Dritte, Freigabe nötig.
4. Quarzolith- und Pramer-Rechnungen auslesen; die Werkzeuge stehen.
