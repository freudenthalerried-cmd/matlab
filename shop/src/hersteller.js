/**
 * Die Hersteller hinter den Lieferantenbezeichnungen.
 *
 * **Hierher verlegt am 01.09.** Die Tabelle stand in `bin/website.mjs`, also
 * in einem Bauwerkzeug — erreichbar nur für die Seiten. Die Folge stand im
 * Produktfeed: Jede Artikelseite trug ihre Marke im JSON-LD, **jede der 43
 * Feedzeilen trug keine.** `angebotsAuszeichnung` liest `artikel.hersteller`,
 * und dieses Feld gibt es im Katalog nicht — es wird in 0 von 46 Artikeln
 * gesetzt. Die Marke stand ausschließlich im Bauwerkzeug, das den Feed nicht
 * baut.
 *
 * `brand` ist für einen Produktfeed bei Markenware eine Pflichtangabe.
 * Dieselbe Bauart wie die fehlende Produktadresse eine Stunde davor: Die
 * Seite weiß etwas, das der Feed nicht weiß, weil das Wissen im Werkzeug
 * liegt statt im Modul.
 */
/**
 * Wo das technische Merkblatt zu finden ist.
 *
 * Bewusst nur die Herstellerseite, kein tiefer Link auf ein konkretes PDF:
 * Ein erfundener Dokumentpfad sieht aus wie ein Beleg und ist keiner, und
 * echte Merkblattlinks ändern sich mit jeder Überarbeitung. Der Weg über die
 * Herstellersuche ist einen Klick länger und bleibt richtig.
 */
export const HERSTELLER = {
  Capatect: { name: 'Synthesa (Capatect)', url: 'https://www.synthesa.at/' },
  Baumit: { name: 'Baumit Österreich', url: 'https://www.baumit.at/' },
  Schiedel: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIKM: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIK: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  Isover: { name: 'Isover Österreich', url: 'https://www.isover.at/' },
  Soudal: { name: 'Soudal', url: 'https://www.soudal.com/' },
  // Produktlinien statt Firmennamen. Beleg dafür, dass „Absolut" und „SIH"
  // Schiedel-Linien sind: das Konditionenblatt des Lagerhauses führt sie
  // unter „Schiedel Absolut, SIH" (`lagerhaus-rabatte-gelesen.md`, Seite 18).
  Absolut: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
  SIH: { name: 'Schiedel Österreich', url: 'https://www.schiedel.at/' },
};

/**
 * Die Marke aus der Artikelbezeichnung.
 *
 * Der erste Wurf prüfte `bez.startsWith(m)` — die Marke musste ganz vorn
 * stehen. Bei Lieferantenbezeichnungen steht sie das oft nicht:
 * „Mantelstein MSTS EZ 16-18 **SIKM**", „Regenhaube mit Sicherungsseil 180
 * **Absolut & SIH**", „Thermo-Trennstein 12-18 EZ **Absolut**". Drei
 * Schiedel-Artikel trugen deshalb den Satz „Für diesen Artikel liegt uns
 * kein Herstellermerkblatt vor", obwohl der Hersteller in der Bezeichnung
 * steht.
 *
 * Gesucht wird jetzt überall im Text, aber nur als **ganzes Wort** — sonst
 * fände „SIK" das Wort „Sikkativ" und „Absolut" das Adverb. Die längste
 * Marke gewinnt, damit „SIKM" nicht von „SIK" verdeckt wird.
 */
export const marke = (bez) => Object.keys(HERSTELLER)
  .sort((a, b) => b.length - a.length)
  .find((m) => new RegExp(`(?<![\\p{L}\\d])${m}(?![\\p{L}\\d])`, 'u').test(bez)) ?? null;
