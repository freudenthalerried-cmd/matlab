# Wer macht das, und wo steht es?

*Lauf vom 15. September 2026. Zwei Sätze mehr in jeder Feedbeschreibung, die
Sperrklinke 21 → 18 — und eine Zahl, die absichtlich **nicht** gefallen ist.*

---

## Warum dieser Lauf nicht bei den offenen Punkten anfängt

`npm run punkte` führt heute 28 offene Punkte. Jeder einzelne davon liegt beim
Auftraggeber oder bei einem Dritten: Zahlungsanbieter, Rechtstexte,
Lieferzeit, die Artikelliste des Lieferanten, das Hochladen. Der Loop darf
keine E-Mail schicken, nichts kaufen und keine Ausgabe auslösen — für alle 28
wäre jeder Schritt genau das.

Was **nicht** dort liegt, ist die maschinenlesbare Beschreibung der 46 Artikel.
Sie ist seit dem 13. September beziffert: **21 von 46 sagen über die Ware
selbst nichts.** Ihr ganzer eigener Beitrag war „Palettierte Ware" und ein
Preisstand — eine Aussage über den Versand und eine über den Datensatz.

Das ist die Zahl, die dieser Lauf angreift, und sie trifft zwei Weisungen des
Auftraggebers auf einmal: Auffindbarkeit für KI-Assistenten und Google
Shopping.

## Die nützlichste Zeile des ganzen Datensatzes

Ein Assistent, der aus dem Feed eine Bestellliste zusammenstellt, braucht
zuerst nicht das Gewicht. Er braucht die Stelle, an der die
**Verarbeitungsvorschrift** steht — und die stand in keinem Feld:

> *Hersteller Synthesa (Capatect), technisches Merkblatt über
> https://www.synthesa.at/*

Beides lag seit dem 8. September in `src/hersteller.js`, mit Beleg: Der
Markenname kommt aus der Artikelbezeichnung, die Firma und die Adresse aus dem
Register, das `pruefe-systemtreue` gegen den Bestand hält. Für vier Marken —
Ravenit, SunCore, Ökotherm, Prima — ist keine Adresse belegt, und die Zeile
sagt das:

> *Hersteller Ökotherm, ein technisches Merkblatt liegt uns nicht vor.*

Eine geratene Adresse wäre eine erfundene Quelle. Der Mangel bleibt sichtbar,
statt gefüllt auszusehen.

## Und die Zahl, die deshalb **nicht** gefallen ist

Die Herstellerzeile steht in keinem Nachbarfeld. Nach dem Buchstaben des
Prüfers wäre sie damit ein „eigener Beitrag", und sie hätte die Schranke von
21 auf **3** gestürzt — ohne dass eine einzige Beschreibung mehr über die Ware
sagte.

Genau dieser Fehler ist am 13. September schon einmal gemacht worden. Damals
stand im Modulkopf:

> **„Eigen" hieß: steht in keinem Nachbarfeld. Es hieß nicht: sagt etwas über
> die Ware.**

`satzGehtUeber` gibt für die Herstellerzeile deshalb **`herkunft`** zurück —
eine eigene Kategorie neben `ware`, `versand` und `datensatz`. Wer herstellt,
ist die Herkunft der Ware und nicht ihre Beschaffenheit.

> **Eine Begriffsgrenze, die man verschiebt, bis die Zahl stimmt, ist keine
> Messung mehr.**

Die Gegenprobe `die-herkunft-zaehlt-wieder-als-wareneigenschaft` macht genau
das rückgängig: Sie zählt die Zeile doch als `ware`, die Schranke fällt auf
drei, und der Testfall fällt um. Rot gesehen am 15. September.

## Was die Zahl wirklich gesenkt hat: drei Dosen

Seit dem 13. September steht die Messung dazu bereit: **Namen mit eindeutigem
Maß: 8 von 46.** Fünf davon sagen ihr Maß schon über das Gebindegewicht. Die
übrigen drei sind Soudal-Dosen zu je 750 ml — ein Maß im Namen, das nirgends
im Datensatz stand.

`feedbeschreibung` liest es jetzt, und zwar **nur** bei `lesbarkeit ===
'eindeutig'`: genau ein Maß, keine blanke Zahl daneben. Der Schachtring „800
300 80 mm" bleibt ungelesen, und die Spachtelmasse, deren Produktkennung auf
ein M endet, wird nicht zu Metern.

Die Zeile nennt ihre Herkunft mit:

> *Kleinste Abgabemenge 750 ml — aus der Bezeichnung gelesen, nicht aus einer
> Angabe des Lieferanten.*

**21 → 18.** Drei Artikel, gemessen, nicht geschätzt.

## Eine Vorhersage, die eingetreten ist

Zwei Stellen führten die Zahl bisher als **Aussicht**: der Testfall „Ein
Namensleser senkte die einundzwanzig um drei" und die Schlusszeile von `npm
run pruefe-masse`. Beide beschrieben einen Leser, den es nicht gab.

> **Eine Vorhersage, die eingetreten ist, gehört umgeschrieben und nicht weiter
> als Vorhersage geführt.**

Der Testfall hält seither die **Gegenrichtung**: Kein Name mit eindeutigem Maß
steht mehr unter denen ohne Angabe über die Ware. Fällt einer zurück, ist der
Leser kaputt. Und was der Namensleser noch erreichen könnte, ist **0**.

## Was der Bestand dabei gemeldet hat

**`pruefe-punkte` wurde viermal rot** — und jedes Mal zu Recht. Der offene
Punkt `artikelliste` trug die Zahlen 21 und 13; gemessen sind jetzt 18 und 3.
Zwei Muster mussten mitwandern, weil ich den Satz umgeschrieben habe — genau
das, was die Regel `muster-trifft-nicht` verhindern soll.

**Und eine 13, die nur aus Versehen gedeckt war.** Im selben Punkt steht
dreimal das Datum „13.09.". Solange 13 auch eine gemessene Kennzahl war, fiel
das nicht auf; seit die Kennzahl 3 ist, standen drei Meldungen da.

Der Freibrief dafür lautete `zahlen: ['2', '8', '08']` — Tagesnummern in
Kurzschreibweise, einzeln geführt, mit der Begründung, das sei besser, „als das
Datumsmuster so weit zu machen, dass es jede zweistellige Zahl deckt". Der Satz
stimmt gegen ein *loses* Muster und hat einen dritten Weg übersehen: `DD.MM.`
verlangt Punkt, zwei Ziffern und noch einen Punkt. Eine blanke 13 bleibt
meldepflichtig.

> **Ein Freibrief, der aus Versehen gilt, fällt weg, sobald die Zahl daneben
> sich ändert.**

## Was dieser Lauf nicht erreicht hat

- **Die übrigen 18** bleiben, wo sie waren, und die Abhilfe bleibt beim
  Lieferanten: Die Artikelliste mit EAN, Herstellername und Merkmalen ist ein
  offener Punkt und freigabepflichtig.
- **Die 26 mehrdeutigen Namen** werden nicht gelesen, mit Absicht. Ein
  Werkzeug, das in 17 von 100 Fällen recht hat, ist keine Datenquelle.
- **Ob ein Assistent die Merkblattadresse benutzt**, weiß niemand. Gemessen ist
  nur, dass sie dasteht und auf eine belegte Adresse zeigt.
- **Die vier Marken ohne Merkblatt** sind unverändert ein offener Punkt.
  Darunter der einzige Mauerwerksartikel des Katalogs, bei dem die Bemessung an
  der Steinfestigkeit hängt — dort wäre ein Merkblatt am wertvollsten und ist
  keines belegt.

## Die Frage für den nächsten Lauf

Die Artikelseiten tragen denselben Hersteller und dasselbe Merkblatt — aber
sagen sie es an derselben Stelle und mit denselben Worten wie der Feed? Der
Feed ist seit heute die vollständigere Quelle, und zwei Fassungen derselben
Auskunft sind in diesem Haus der häufigste Befund überhaupt.
