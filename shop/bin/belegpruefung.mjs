#!/usr/bin/env node
/**
 * Die Belege erzeugen und lesen, die der Kunde bekommt.
 *
 *   npm run pruefe-belege
 *
 * Kein Prüfer dieser Kette hat je einen fertigen Beleg gesehen. Sie lesen
 * Quelltext, Inhaltsdateien und gebaute Seiten — der Beleg entsteht erst im
 * Betrieb, aus einem Warenkorb. Also baut dieses Werkzeug einen: echter
 * Katalog, echte Preise, zwei Positionen von einem Lieferanten, und dann
 * dieselben vier Texte, die eine Bestellung auslösen würde.
 *
 * Die Regeln stehen in `src/belegpruefung.js`; hier steht nur, woraus die
 * Belege gemacht werden. Beides getrennt, weil sonst ein Prüfer sein eigenes
 * Prüfobjekt herstellt und niemand die Regeln einzeln testen kann.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ladeKatalog, berechneWarenkorb } from '../src/warenkorb.js';
import { ZIELMARGE, ladeBaustoffkatalog } from '../src/baustoffkatalog.js';
import { erzeugeAngebot, erzeugeAuftragsbestaetigung, erzeugeRechnung } from '../src/beleg.js';
import { erzeugeBestellungen, darfAutomatischAusgeloestWerden } from '../src/bestellung.js';
import { kundenWarenkorb } from '../src/shopkern.js';
import { baueKundenanfrage } from '../src/kundenanfrage.js';
import { pruefeBelege } from '../src/belegpruefung.js';
import { lieferhinweise } from '../src/rechtstexte.js';

const wurzel = dirname(dirname(fileURLToPath(import.meta.url)));
const lies = (name) => JSON.parse(readFileSync(join(wurzel, 'data', name), 'utf8'));

const lieferantenDatei = lies('lieferanten.json');

/**
 * **Welchen Katalog liest dieser Prüfer?**
 *
 * Die erste Fassung von heute Vormittag las `data/artikel.json` — den
 * Radonkatalog mit neun Platzhalterartikeln — und schrieb „Belege gepruft: 4"
 * darunter, ohne zu sagen, aus welchem Bestand die Belege stammen. Der aktuelle
 * Handel hat sechsundvierzig Artikel mit bestaetigten Preisen.
 *
 * > **Ein Prüfer, der nicht sagt, was er gelesen hat, wird für etwas gehalten,
 * > was er nicht ist.** Genau die Familie, die dieser Prüfer finden soll.
 *
 * `preise/` liegt ausserhalb des Repositories, deshalb ist der Rueckfall der
 * Normalzustand einer frischen Arbeitskopie. Er ist nicht falsch — er ist nur
 * etwas anderes, und das steht jetzt in der Ausgabe. Der Griff ueber die
 * Umgebung ist derselbe wie in `veroeffentlichung.mjs`: Ein Zweig, den keine
 * Probe betreten kann, ist kein Zweig, sondern eine Vermutung.
 */
const preisPfad = process.env.VEROEFFENTLICHUNG_PREISE
  || join(wurzel, '..', 'preise', 'baustoff-preise.json');
const baustoffVerfuegbar = existsSync(preisPfad) && existsSync(join(wurzel, 'data', 'katalog-baustoff.json'));

const katalog = baustoffVerfuegbar
  ? ladeBaustoffkatalog(
      lies('katalog-baustoff.json'),
      JSON.parse(readFileSync(preisPfad, 'utf8')),
      lieferantenDatei,
      ZIELMARGE,
    )
  : ladeKatalog({ lieferanten: lieferantenDatei, artikel: lies('artikel.json') }, ZIELMARGE);

const katalogName = baustoffVerfuegbar
  ? `Baustoffkatalog aus den Lieferantenrechnungen (${katalog.artikel.length} Artikel)`
  : `Radon-Platzhalterkatalog (${katalog.artikel.length} Artikel) — die Preisdatei des Baustoffkatalogs fehlt`;

// Der Warenkorb braucht zwei Positionen mit gerechnetem Preis. Im
// Baustoffkatalog tragen Artikel nach Gate 24 teils `vkNetto: null`; die
// fallen hier heraus, statt eine Bestellung ueber einen fehlenden Preis zu
// bauen.
/**
 * **Welcher Warenkorb?** Nicht der erstbeste.
 *
 * Die ersten beiden Artikel des Baustoffkatalogs sind Zuschnitte
 * Fassadendämmung zu 1,93 € und 2,81 €. Daraus wurde ein Beleg über 43,37 €
 * Ware und 90,50 € Fracht — genau die Bestellung, die Gate 20 sperrt und die
 * nie hinausgeht. Nach Preis absteigend sortiert kippte es ins Gegenteil:
 * 5.362 € Ware, das Achtfache des Bezugswarenkorbs.
 *
 * > **Ein Prüfer, der ein Dokument liest, das der Betrieb nie erzeugt, prüft
 * > eine Möglichkeit statt eines Falls.**
 *
 * Gebaut wird deshalb auf `warenkorbNetto` aus `data/zielgroessen.json` — die
 * Zahl, mit der die ganze Wirtschaftlichkeitsrechnung arbeitet. Zwei
 * Positionen zu je einer Hälfte, Mengen ganzzahlig aufgerundet.
 */
const ZIELKORB_NETTO = lies('zielgroessen.json').warenkorbNetto;
const verkaeuflich = katalog.artikel.filter((a) => typeof a.vkNetto === 'number' && a.vkNetto > 0);
if (verkaeuflich.length < 2) {
  console.error(`Zu wenige verkäufliche Artikel im ${katalogName} — kein Beleg baubar.`);
  process.exit(1);
}
const haelfte = ZIELKORB_NETTO / 2;
// Die zwei Artikel, deren Preis der halben Zielsumme am nächsten liegt: Sie
// ergeben mit kleinen, im Baustoffhandel plausiblen Stückzahlen einen Korb in
// der Größenordnung, für die dieses Modell gerechnet ist.
const gewaehlt = [...verkaeuflich]
  .sort((a, b) => Math.abs(a.vkNetto - haelfte) - Math.abs(b.vkNetto - haelfte))
  .slice(0, 2);
const positionen = gewaehlt.map((a) => ({
  sku: a.sku,
  menge: Math.max(1, Math.round(haelfte / a.vkNetto)),
}));

// Zwei Positionen, damit Positionszeilen, Fracht und Summenblock alle
// vorkommen. Der Warenkorb ist erfunden — die Preise und Konditionen darin
// sind es nicht.
const korb = berechneWarenkorb(positionen, katalog);

// Die echten Betreiberdaten, nicht erfundene: Vier Pflichtangaben sind dort
// offen, und der Prüfer soll genau die Belege sehen, die heute entstehen
// würden — samt ihrer Lücken.
const betreiberDatei = lies('betreiber.json');
const betreiber = {
  firma: betreiberDatei.firma ?? betreiberDatei.name ?? '',
  // Die Marke gehört auf den Beleg, seit der Laden anders heißt als die
  // Betreiberin: Wer bei „Bauversand" bestellt, soll auf der Rechnung nicht
  // erst raten müssen. Der Name des Ausstellers steht in derselben Zeile —
  // die Prüfung nach § 11 findet ihn dort weiterhin.
  marke: betreiberDatei.marke ?? '',
  // **Nachgetragen am 2. September.** Hier standen nur Firma und UID. Die
  // Anschrift ist Pflichtangabe nach § 11 UStG und stand in betreiber.json
  // längst da — der Prüflauf hat sie nur nicht weitergereicht und danach eine
  // Rechnung ohne Anschrift für vollständig gehalten.
  strasse: betreiberDatei.strasse ?? '',
  plz: betreiberDatei.plz ?? '',
  ort: betreiberDatei.ort ?? '',
  uid: betreiberDatei.uid ?? '',
};
const kunde = { firma: 'Musterbau GmbH', strasse: 'Baustellenweg 7', plz: '4600', ort: 'Wels', uid: 'ATU12345675' };
const gemeinsam = { datum: '01.09.2026', kunde, betreiber };

/**
 * Angaben, die geprüft **und** gedruckt sein müssen.
 *
 * Die Anschrift des Ausstellers ist Pflichtangabe nach § 11 Abs 1 Z 3 UStG.
 * Sie wurde geprüft und nicht gedruckt — beide Prüfungen waren grün und
 * meinten verschiedene Dinge.
 */
const pflichtangaben = [
  { was: 'Straße des Ausstellers', wert: betreiber.strasse },
  { was: 'Ort des Ausstellers', wert: `${betreiber.plz} ${betreiber.ort}`.trim() },
];

const belege = [
  {
    art: 'Angebot',
    text: erzeugeAngebot(korb, { nummer: 'AN-0001', ...gemeinsam }).text,
    mussEnthalten: pflichtangaben,
  },
  /**
   * **Zweimal, seit dem 3. September.** Hier stand eine einzige
   * Auftragsbestätigung **ohne Hinweise** — und genau die erzeugt der Betrieb
   * nie: `baueVorgang` hängt `lieferhinweise(auftrag)` an, und die zitieren
   * zwei AGB-Punkte, die dieser Prüfer nie zu sehen bekam. Einer davon zeigte
   * auf den falschen Punkt.
   *
   * > **Ein Prüfer, der ein Dokument liest, das der Betrieb nie erzeugt, prüft
   * > eine Möglichkeit statt eines Falls** — derselbe Satz, der über der Wahl
   * > des Warenkorbs steht, eine Ebene weiter.
   *
   * Beide Fassungen, weil die Hinweise vom Lieferort abhängen: Geht die Ware an
   * die Rechnungsanschrift, entfällt der Hinweis zur Empfangsvollmacht. Nur die
   * abweichende Baustelle zeigt ihn — und nur die reichere Fassung zu prüfen
   * hieße, den Regelfall ungeprüft zu lassen.
   */
  {
    art: 'Auftragsbestätigung',
    text: erzeugeAuftragsbestaetigung(korb, {
      nummer: 'AB-0001',
      ...gemeinsam,
      hinweise: lieferhinweise({ lieferungAnRechnungsadresse: true }),
    }).text,
    mussEnthalten: pflichtangaben,
  },
  {
    art: 'Auftragsbestätigung',
    text: erzeugeAuftragsbestaetigung(korb, {
      nummer: 'AB-0002',
      ...gemeinsam,
      hinweise: lieferhinweise({ lieferungAnRechnungsadresse: false }),
    }).text,
    mussEnthalten: pflichtangaben,
  },
  {
    art: 'Rechnung',
    text: erzeugeRechnung(korb, {
      nummer: 'RE-0001',
      lieferdatum: '05.09.2026',
      zahlung: { weg: 'eps', datum: '30.08.2026', kennzeichen: 'AB-0001' },
      ...gemeinsam,
    }).text,
    mussEnthalten: pflichtangaben,
  },
];

// Die vierte Kundendatei: der Anfragetext, den die Kasse in eine E-Mail legt.
// Er kommt aus einem anderen Rechenweg (`shopkern.js` statt `warenkorb.js`) —
// derselbe Korb, zwei Kalkulationen. Genau deshalb gehört er in denselben
// Durchlauf: Was der Kunde in einem Zug liest, muss ein Prüfer in einem Zug
// gelesen haben.
const anfrage = baueKundenanfrage({
  rechnung: kundenWarenkorb(positionen, {
    artikel: katalog.artikel,
    lieferanten: lieferantenDatei.lieferanten ?? lieferantenDatei,
    // Gate 25: aus derselben Datei wie in der Seite. Ohne die Grenze käme
    // gar kein Anfragetext zustande — und dieser Prüfer sagt das dann auch,
    // statt einen leeren Text gegen seine Pflichtangaben zu halten.
    mindestbestellwertNetto: betreiberDatei.mindestbestellwertNetto ?? null,
  }),
  bezirk: 'Perg',
  betreiber: { firma: betreiber.firma, ort: 'Ried in der Riedmark', email: '' },
  datum: '2026-09-01',
});
if (!anfrage.moeglich) {
  console.error(`Die Kundenanfrage ließ sich nicht bauen: ${anfrage.hindernis}`);
  process.exit(1);
}
belege.push({ art: 'Kundenanfrage', text: anfrage.text });

// Der fünfte Außentext geht nicht an den Kunden, sondern an den Lieferanten.
// Er stand am 1. September vormittags noch außerhalb jeder Prüfung — und trug
// genau deshalb eine leere Zeile „Ansprechpartner vor Ort:".
const bestellauftrag = {
  bestellnummer: 'B-2026-0001',
  absender: { firma: betreiber.firma },
  lieferadresse: {
    name: kunde.firma,
    strasse: kunde.strasse,
    plz: kunde.plz,
    ort: kunde.ort,
    telefon: '+43 660 1234567',
    hinweis: 'Zufahrt über die Nordseite, Wendeplatz vorhanden',
  },
};
for (const b of erzeugeBestellungen(korb, bestellauftrag)) {
  belege.push({ art: 'Lieferantenbestellung', text: b.text });
}

// Würde diese Bestellung überhaupt hinausgehen? Die Antwort gehört neben die
// Belege: Ein sauber geprüfter Text über einen gesperrten Auftrag ist kein
// Freibrief. Keine Meldung, sondern Auskunft — die Lücken, die hier
// auftauchen, sind die offenen Punkte beim Auftraggeber und beim Lieferanten.
const freigabe = darfAutomatischAusgeloestWerden(korb, {
  ...bestellauftrag,
  zahlungEingegangen: true,
  kundeIstUnternehmer: true,
  uid: kunde.uid,
  zahlweg: 'eps',
  frachtVerrechnet: true,
});

const befund = pruefeBelege(belege, { vollstaendig: true });
const zeigeTexte = process.argv.includes('--zeigen');

if (zeigeTexte) {
  for (const b of belege) {
    console.log(`\n${'='.repeat(72)}\n${b.art}\n${'='.repeat(72)}\n${b.text}`);
  }
  console.log('');
}

console.log(`Belege geprüft: ${befund.geprueft} (${belege.map((b) => b.art).join(', ')})`);
console.log(`Gelesener Katalog: ${katalogName}`);
console.log(`Warenkorb: ${positionen.map((p) => `${p.menge}× ${p.sku}`).join(', ')} = `
  + `${korb.warenwertNetto.toFixed(2)} € netto (Zielgröße ${ZIELKORB_NETTO} €)`);
console.log(`Zahlungsziel laut Geschäftsbedingungen: ${befund.zielTage} Tage\n`);

for (const b of befund.befunde) {
  if (b.sauber) {
    console.log(`  ✓ ${b.art}`);
    continue;
  }
  for (const m of b.meldungen) {
    console.log(`  ✗ ${b.art}${m.zeile ? `:${m.zeile}` : ''} [${m.regel}]`);
    console.log(`      ${m.text}`);
  }
}

console.log('');
if (freigabe.erlaubt) {
  console.log('Diese Bestellung dürfte ausgelöst werden.');
} else {
  console.log('Auslösbar wäre sie nicht — offene Punkte, keine Textfehler:');
  for (const g of freigabe.gruende) console.log(`    · ${g}`);
}

console.log('');
if (befund.sauber) {
  console.log('Keine Meldung. Der Text, der beim Kunden ankommt, ist gelesen worden —');
  console.log('nicht nur der Quelltext, aus dem er entsteht.');
  console.log('\nMit --zeigen stehen die Belege vollständig da; gelesen gehören sie trotzdem.');
} else {
  console.log(`${befund.meldungen} Meldung(en). Ein Beleg hat keine Fußnoten — was auf ihm steht, gilt.`);
  process.exitCode = 1;
}
