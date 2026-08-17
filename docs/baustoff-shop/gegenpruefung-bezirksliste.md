# Gegenprüfung der Bezirksliste — sieben von zehn bestätigt, eine amtlich

Stand: 2026-08-16. Fortsetzung des Auftrags, Alternativen zu den blockierten
Freigaben zu betreiben. Werkzeug ausschließlich die Websuche; RIS wurde zu
Rundenbeginn erneut geprüft (weiterhin blockiert), und zwei aufgefundene
PDF-Spiegel des Verordnungstexts (Gemeindebund, Land Steiermark) sind aus
dieser Umgebung ebenfalls nicht abrufbar.

Die Gebietsauskunft ([`gebietsauskunft-zwischenloesung.md`](./gebietsauskunft-zwischenloesung.md))
steht auf einer Negativliste aus **einer** Sekundärquelle. Jede Auskunft trägt
deshalb den Vorbehalt der Gegenprüfung. Diese Runde holt die Gegenprüfung so
weit ein, wie es ohne Verordnungstext geht: Bundesland für Bundesland gegen
unabhängige zweite Quellen.

## Ergebnis je Bundesland

| Bundesland | Ausnahme laut Liste | Gegenprüfung | Quelle |
|---|---|---|---|
| Oberösterreich | Ried im Innkreis | **amtlich bestätigt**: alle Gemeinden außer Bezirk Ried im Innkreis sind Vorsorgegebiet | Land OÖ (PDF „Radongebiete gemäß RnV", radon.htm) |
| Burgenland | Güssing, Jennersdorf, Neusiedl am See, Oberwart | **bestätigt**, alle vier ausdrücklich | WKO-Zusammenfassung der RnV |
| Niederösterreich | Bruck an der Leitha | **bestätigt** | WKO-Zusammenfassung der RnV |
| Steiermark | Südoststeiermark | **bestätigt** | WKO-Zusammenfassung der RnV |
| Vorarlberg | Bregenz, Dornbirn, Feldkirch | **indirekt gestützt**: Bludenz wird als (einziger) Vorsorge-Bezirk genannt; die drei Ausnahmen sind nicht ausdrücklich benannt | Landes-/Verbandsquellen |
| Wien | Wien | aus der Erstquelle (BMLUK), in dieser Runde nicht erneut belegt | BMLUK |

**Sieben der zehn Bezirke sind damit aus unabhängiger zweiter Quelle
ausdrücklich bestätigt, einer davon amtlich durch das Land** — und es ist
genau der, der im Modul und in der Demo am meisten trägt: Ried im Innkreis,
der Beispielwert der Gebietsauskunft und der Heimatbezirk des Betreibers.
Kein einziger Widerspruch zur Liste ist aufgetaucht.

## Was sich dadurch ändert — und was nicht

`GEBIETSSTAND` in `gebiet.js` nennt jetzt die Mehrfachbelegung; der
Vorbehalt bleibt, präzisiert: Der **Verordnungstext** ist weiterhin die
ausständige Instanz. Eine Gegenprüfung aus Sekundärquellen macht die Liste
belastbarer, aber nicht amtlich — die Regel aus Gate 11 (Rechtsaussage nur
aus Verordnungstext) gilt unverändert, und die Auskunft sagt das weiterhin in
jedem Ergebnis dazu.

Für die Vollausbau-Blockade heißt das: Aufgefunden sind inzwischen **drei**
Wege zum Verordnungstext (RIS direkt, Gemeindebund-PDF, Land-Steiermark-PDF)
— alle drei aus dieser Umgebung gesperrt. Der erste Lauf mit freiem
Netzzugang kann die Gegenprüfung in Minuten abschließen und zugleich die
104-Gemeinden-Liste für die Schutzgebiets-Stufe ziehen; die Fundstellen
stehen hier.

## Kein Gate

Kein Gate ändert sich; die Zwischenlösung bleibt Zwischenlösung. Keine
E-Mail versendet, nichts gekauft, keine Ausgabe.

## Sources

- [Land Oberösterreich: Radongebiete gemäß RnV (PDF)](https://www.land-oberoesterreich.gv.at/Mediendateien/Formulare/Dokumente%20UWD%20Abt_US/Radongebiete_ooe_gemaess_rnv.pdf) / [Radon-Seite des Landes](https://www.land-oberoesterreich.gv.at/radon.htm)
- [WKO: Radonschutzverordnung — Zusammenfassung mit Bezirkslisten](https://www.wko.at/betriebsanlagen/radonschutzverordnung)
- [BMLUK: Gemeinden im Radonvorsorgegebiet (Erstquelle)](https://www.bmluk.gv.at/themen/klima-und-umwelt/strahlenschutz/radon/gemeinden-vorsorgegebiet.html)
- Blockierte Verordnungstext-Spiegel: [Gemeindebund (konsolidierte Fassung 09.07.2021, PDF)](https://gemeindebund.at/website2024/wp-content/uploads/2024/05/radonschutzvo-fassung-vom-09072021.pdf), [Land Steiermark (BGBl. II 470/2020, PDF)](https://www.technik.steiermark.at/cms/dokumente/12791586_58813874/11921654/RadonschutzVO_09.11.2020.pdf)
