# Neue Weisung: eigene Baumeisterpreise als Kalkulationsgrundlage

> **Berichtigt am 25.08.:** Dieses Dokument liest „+25 %" als **Zuschlag
> auf den Einkauf** (= 20 % Rohmarge) und stellt genau das unten als offene
> Frage. Der Auftraggeber hat sie beantwortet: gemeint ist **25 % Marge**,
> also 33,33 % Zuschlag. Alle 20-%-Zahlen unten sind damit historisch; die
> gültige Rechnung steht in [`marge-25-prozent.md`](./marge-25-prozent.md).
> Der Wortlaut der Weisung bleibt unverändert stehen — er war zweideutig,
> und das ist Teil des Befunds.

Stand: 2026-08-22. Weisung des Auftraggebers, wörtlich festgehalten,
damit ein späterer Lauf sie unverfälscht vorfindet. **Ausgeführt wird
sie noch nicht** — der Auftraggeber hat ausdrücklich pausiert, bis das
Token-Budget wieder voll ist (frühestens nächste Woche).

## Die Weisung im Wortlaut

> „nutze meinen preise von bürozubau rechnungen peither alles was du
> findest, verwende diese baumeisterpreise +25 % zuschlag für den shop
> falls du nichts günstigeres findest. zb. wenn jemand spachtelmasse
> sucht kommt mein shop bei google shopping ganz oben mit versandkosten
> in umliegenden Bereich nicht ganz österreich. aber pausiere noch bis
> nächste woche bis token wieder voll sind"

## Was sie ändert — und das ist erheblich

Bisher stand der Shop auf **unbelegten Platzhalterpreisen**, deren
Belege erst aus dreizehn Herstelleranfragen kommen sollten (Gate 1, 2,
3 — die ganze Freigabe-Blockade). Die Weisung ersetzt diese Grundlage
durch etwas, das bereits existiert: **die tatsächlich bezahlten
Einkaufspreise des Auftraggebers als Baumeister**, belegt durch die
Rechnungen des Bürozubaus (Lieferant: Peither).

Drei Folgen, die ein späterer Lauf durchdenken muss, bevor er baut:

1. **Die Rohmarge ist nicht mehr unbelegt, sondern gesetzt.** 25 %
   Zuschlag auf den Einkauf sind eine Rohmarge von 20 % vom Verkauf
   (1 − 1/1,25). Das liegt **unter der Margenuntergrenze von 32 %**
   aus `PARAMETER.md` und Gate 1. Das ist kein Rechenfehler des
   Auftraggebers, sondern eine andere Geschäftslogik: Wer zum
   Baumeister-Einkaufspreis einkauft, konkurriert nicht mit dem
   Fachhandel, sondern unterbietet ihn — Preisführerschaft statt
   Margenführerschaft. **Gate 1 muss dafür ausdrücklich neu entschieden
   werden**, samt Durchrechnung, was 20 % Rohmarge für den nötigen
   Umsatz bedeuten (die Kaskade in `kostenbild.js` rechnet das sofort
   aus; grob: der nötige Monatsumsatz steigt gegenüber 35 % Rohmarge
   deutlich an). Der Auftraggeber hat den Zuschlag vorgegeben — die
   Rechnung dazu gehört ihm vorgelegt, nicht stillschweigend
   wegkorrigiert.
2. **Das Sortiment ist nicht mehr radonspezifisch.** „Spachtelmasse"
   ist Allgemeinbaustoff. Damit fällt Gate 5 (Sortiment auf den
   radonspezifischen Kern) in seiner bisherigen Form, und die
   Alleinstellung verschiebt sich von der Nische zum Preis. Zu prüfen
   ist, ob Radon als Sortimentsteil bleibt oder das Vorhaben ein
   allgemeiner Baustoffhandel wird.
3. **Der Vertriebsweg ist neu: Google Shopping statt organischer
   Reichweite.** Das ist ein bezahlter Kanal (CPC) und berührt den
   Werbeanteil von 10 % in `PARAMETER.md` unmittelbar. Zugleich
   entwertet es Prüfung B teilweise: Wer über Shopping verkauft,
   braucht kein organisches Suchvolumen für Ratgeberinhalte — aber
   sehr wohl Klickpreise, die zur 20-%-Marge passen.
4. **Der Liefergebiet ist regional, nicht österreichweit.**
   „Umliegender Bereich" muss beziffert werden (Umkreis in km oder
   Bezirksliste ab Ried im Innkreis), weil daran die Frachtkalkulation
   und die Google-Shopping-Gebietseinstellung hängen.

## Was fehlt, bevor gearbeitet werden kann

**Die Rechnungen selbst liegen nicht vor.** Im Repository ist keine
Rechnungsdatei; die Umgebung hat keinen Zugriff auf ein Ablagesystem des
Auftraggebers. Gebraucht wird je Position: Artikelbezeichnung, Menge,
Einheit, Netto-Einzelpreis, Lieferant, Rechnungsdatum. Formate, die ohne
weiteres verarbeitbar wären: PDF-Rechnungen, Fotos der Rechnungen, oder
eine abgetippte CSV/Tabelle.

Offene Fragen, die der Auftraggeber beantworten sollte (gebündelt, nicht
einzeln nachgefragt):

- Wo liegen die Peither-Rechnungen, oder werden sie hochgeladen?
- ~~Ist „+25 %" als Zuschlag auf den Einkauf gemeint (→ 20 % Rohmarge)
  oder als Rohmarge von 25 %? Beides ist mit dem Satz vereinbar, die
  Zahlen unterscheiden sich deutlich.~~ **Am 25.08. beantwortet: 25 %
  Marge.** Der nötige Monatsumsatz fällt damit von 72.740 € auf
  45.356 € — die Zweideutigkeit war ein Drittel des Geschäftsmodells
  wert.
- Wie weit reicht „umliegender Bereich" — Umkreis in Kilometern, oder
  eine Liste von Bezirken?
- Bleibt Radon Teil des Sortiments, oder wird daraus ein allgemeiner
  Baustoffhandel mit Preisargument?

## Der Ablaufplan für den nächsten Lauf

1. Rechnungen einlesen, Positionen strukturiert erfassen (der
   Preislisten-Import in `src/import.js` kann als Gerüst dienen; die
   Zahlenlesung ist bereits gegen mehrdeutige Formate gehärtet).
2. Je Position: Baumeister-Einkaufspreis, Verkaufspreis mit Zuschlag,
   und — soweit ohne Netzzugang möglich — eine Gegenprobe am
   Straßenpreis („falls du nichts günstigeres findest"). Wo der
   Straßenpreis unter dem eigenen Verkaufspreis liegt, trägt die
   Position sich nicht und gehört markiert.
3. Gate 1 neu entscheiden und die Folgen durchrechnen, mit Vorlage an
   den Auftraggeber (Zahlen, keine stille Korrektur).
4. Frachtmodell für das regionale Liefergebiet.
5. Erst danach Google-Shopping-Fragen (Datenfeed, Klickpreise).

Bis dahin ruht der Loop. Es wurde nichts versendet, nichts gekauft und
nichts ausgegeben.
