import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startklar } from '../src/startklar.js';
import { IMPRESSUMSFELDER } from '../src/rechtstexte.js';
import { FORMREGELN } from '../src/betreiberform.js';

const werkzeug = fileURLToPath(new URL('../bin/startklar.mjs', import.meta.url));

// Ein Platzhalter ist kein Impressum. Seit dem 4. September fragt der Punkt
// nicht nur, **ob** eine Angabe dasteht, sondern **ob sie die Form hat** — ein
// „steht" in der UID-Zeile ist genau der Fall, den er finden soll. Wo es eine
// Formregel gibt, nimmt die Probe deren Beispiel: So bringt jede neue Regel
// ihre eigene gültige Angabe mit, statt diese Zeile stillschweigend rot zu
// färben.
const formbeispiele = new Map(FORMREGELN.map((r) => [r.feld, r.beispiel]));
const vollstaendig = Object.fromEntries(
  IMPRESSUMSFELDER.map((f) => [f.feld, formbeispiele.get(f.feld) ?? 'steht']),
);
const katalogVoll = { artikel: [{ sku: 'A', vkNetto: 10, ekIstPlatzhalter: false, lieferantId: 'l1' }] };
const alles = {
  // Seit dem 2. September gehört die zugesagte Antwortzeit dazu — sie ist der
  // einzige Termin, den dieser Shop selbst nennt.
  betreiber: { ...vollstaendig, antwortzeitWerktage: 1 },
  impressumsfelder: IMPRESSUMSFELDER,
  katalog: katalogVoll,
  preisdateiVorhanden: true,
  zahlungsanbieter: 'EPS über einen Anbieter',
  rechtstexteFundstelle: 'Kanzlei X, Fassung vom …',
  domainZeigtAufShop: true,
  repositoryPrivat: true,
  lieferanten: [{ id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: 5 }],
  // Seit dem 3. September gehört der Bestellweg dazu, und zwar als erster
  // Punkt: Alle anderen sind Zulieferungen des Auftraggebers, dieser ist der
  // Weg selbst. Die Probe gibt einen Quelltext mit, der abschickt — sonst
  // stünde hier ein „startklar", das es nie geben kann.
  oberflaechenQuelltext: 'fetch(\'/bestellung\', { method: \'POST\' });',
};

test('mit allem, was gebraucht wird, ist der Shop startklar', () => {
  const b = startklar(alles);
  assert.equal(b.startklar, true, JSON.stringify(b.punkte.filter((p) => p.zustand !== 'erfuellt')));
  assert.equal(b.offen, 0);
  assert.equal(b.unpruefbar, 0);
  assert.ok(b.punkte.length >= 7, `nur ${b.punkte.length} Punkte geprüft`);
});

test('ein unbeantworteter Punkt zählt nicht als erfüllt', () => {
  // Der Kern dieses Werkzeugs. Ohne diese Regel ginge der Shop online, weil
  // die Prüfung nicht hinsehen konnte — und das ist genau die Sorte Lücke,
  // die dieses Vorhaben sonst überall vermeidet.
  const b = startklar({ ...alles, repositoryPrivat: null });
  assert.equal(b.startklar, false);
  assert.equal(b.unpruefbar, 1);
  const punkt = b.punkte.find((p) => p.id === 'repository');
  assert.equal(punkt.zustand, 'unpruefbar');
  assert.match(punkt.befund, /nicht feststellbar/);
  assert.equal(punkt.wer, 'Auftraggeber');
});

test('ein ausdrücklich verneinter Punkt ist offen, kein Fragezeichen', () => {
  const b = startklar({ ...alles, repositoryPrivat: false });
  assert.equal(b.unpruefbar, 0);
  assert.equal(b.offen, 1);
  assert.match(b.punkte.find((p) => p.id === 'repository').befund, /verneint/);
});

test('fehlende Impressumsangaben werden gezählt und benannt', () => {
  const b = startklar({ ...alles, betreiber: { ...vollstaendig, [IMPRESSUMSFELDER[0].feld]: '' } });
  const punkt = b.punkte.find((p) => p.id === 'impressum');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /1 Pflichtangaben fehlen/);
  assert.match(punkt.befund, new RegExp(IMPRESSUMSFELDER[0].bezeichnung.slice(0, 12)));
});

test('ohne Preisdatei ist der Katalog kein Sortiment', () => {
  const b = startklar({ ...alles, preisdateiVorhanden: false });
  const punkt = b.punkte.find((p) => p.id === 'preise');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /Preisdatei fehlt/);
});

test('ein Platzhalterpreis hält den Shop an', () => {
  const b = startklar({
    ...alles,
    katalog: { artikel: [{ sku: 'A', vkNetto: 10, ekIstPlatzhalter: true }] },
  });
  assert.equal(b.punkte.find((p) => p.id === 'keine-platzhalter').zustand, 'offen');
  assert.equal(b.startklar, false);
});

/**
 * `--bericht`, weil das Werkzeug seit dem 3. September **rot endet**, solange
 * der Shop nicht startklar ist. Vorher endete es immer grün, auch mit „NICHT
 * STARTKLAR" auf dem Bildschirm — ein Urteil, das nur auf dem Bildschirm
 * steht, ist keines. Diese Probe will den Text und nicht den Ausgang, und
 * dafür gibt es den Schalter.
 */
test('das Werkzeug läuft am Bestand und sagt, dass der Shop nicht startklar ist', () => {
  const ausgabe = execFileSync(process.execPath, [werkzeug, '--bericht'], { encoding: 'utf8' });
  assert.match(ausgabe, /NICHT STARTKLAR/);
  assert.match(ausgabe, /Impressum vollständig/);
  assert.match(ausgabe, /Zahlungsanbieter/);
  assert.match(ausgabe, /von hier aus nicht feststellbar/);
  // Und der Punkt, der heute steht, steht auch da — relativ gezählt, nicht
  // absolut: Eine Probe, die „46" erwartet, fällt an dem Tag um, an dem der
  // Katalog wächst, und sieht dann aus, als wäre das Werkzeug kaputt.
  const katalog = JSON.parse(readFileSync(
    fileURLToPath(new URL('../data/katalog-baustoff.json', import.meta.url)), 'utf8'));
  const n = katalog.artikel.length;
  assert.match(ausgabe, new RegExp(`${n} von ${n} Artikeln`));
});

test('die Antworten kommen aus der Datei, nicht aus dem Werkzeug', async () => {
  // Die erste Fassung setzte die vier offenen Angaben im Werkzeug hart auf
  // null und schrieb daneben, sie gehörten in data/betreiber.json — dann
  // werde von selbst gemeldet. Das war eine Zusage, die der Code nicht
  // gehalten hätte. Diese Probe hält sie fest.
  const { mkdtempSync, writeFileSync, readFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const echt = JSON.parse(readFileSync(
    fileURLToPath(new URL('../data/betreiber.json', import.meta.url)), 'utf8'));

  const ordner = mkdtempSync(join(tmpdir(), 'startklar-'));
  const pfad = join(ordner, 'betreiber.json');
  writeFileSync(pfad, JSON.stringify({
    ...echt,
    zahlungsanbieter: 'Anbieter aus der Probe',
    repositoryPrivat: true,
    domainZeigtAufShop: false,
  }));

  const ausgabe = execFileSync(process.execPath, [werkzeug, '--bericht'], {
    encoding: 'utf8',
    env: { ...process.env, STARTKLAR_BETREIBER: pfad },
  });
  assert.match(ausgabe, /angebunden: Anbieter aus der Probe/);
  assert.match(ausgabe, /Repository ist privat\n\s+bestätigt/);
  // Ein ausdrückliches „nein" ist eine Antwort, kein Fragezeichen.
  assert.match(ausgabe, /ausdrücklich verneint/);
  assert.match(ausgabe, /0 von hier aus nicht feststellbar/);
});


/* ------------------------------------------------------------------ *
 * Die Lieferzeit — der Punkt, ohne den keine Bestätigung hinausdarf
 * ------------------------------------------------------------------ */

test('Ein liefernder Lieferant ohne Lieferzeit hält den Shop auf', () => {
  const b = startklar({
    ...alles,
    lieferanten: [{ id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: null }],
  });
  assert.equal(b.startklar, false);
  const punkt = b.punkte.find((p) => p.id === 'lieferzeit');
  assert.equal(punkt.zustand, 'offen');
  assert.match(punkt.befund, /Lieferant Eins/);
  assert.match(punkt.befund, /Auftragsbestätigung/);
  // **Berichtigt am 01.09.:** „Auftraggeber (Anfrage)" statt „Auftraggeber".
  // Die Impressumsangaben liegen ihm vor, die Lieferzeit muss er beim
  // Lieferanten erfragen — und eine Anfrage an Dritte ist freigabepflichtig.
  // Die Aufstellung der offenen Punkte gruppiert danach.
  assert.equal(punkt.wer, 'Auftraggeber (Anfrage)');
});

test('Ein Lieferant ohne geführte Ware blockiert nichts', () => {
  // Der Bestand trägt drei Lieferanten aus dem abgelösten Radon-Modell mit,
  // die keinen einzigen Artikel liefern. Ihre Lieferzeit zu verlangen, hieße
  // eine Angabe einzufordern, die niemand je braucht — und den Punkt
  // dauerhaft rot zu halten, bis jemand sie erfindet.
  const b = startklar({
    ...alles,
    lieferanten: [
      { id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: 5 },
      { id: 'alt', name: 'Alter Hersteller ohne Ware', lieferzeitWerktage: null },
    ],
  });
  assert.equal(b.punkte.find((p) => p.id === 'lieferzeit').zustand, 'erfuellt');
  assert.equal(b.startklar, true);
});

test('Ohne geladene Lieferanten bleibt der Punkt offen, nicht erfüllt', () => {
  // Dieselbe Regel wie beim Rest des Werkzeugs: Was niemand bestätigt hat,
  // zählt nicht als erfüllt. Ein Aufrufer, der die Liste vergisst, bekommt
  // keinen grünen Haken geschenkt.
  const b = startklar({ ...alles, lieferanten: [] });
  assert.equal(b.punkte.find((p) => p.id === 'lieferzeit').zustand, 'offen');
  assert.equal(b.startklar, false);
});

test('Eine Lieferzeit von 0 Werktagen ist eine Zahl, keine Lücke', () => {
  // `Number.isFinite` und nicht `!!`: Eine Selbstabholung am selben Tag wäre
  // eine gültige Angabe. Wer hier auf Wahrheitswert prüft, erklärt sie zur
  // fehlenden Angabe — derselbe Griff, der die Null erst zum Problem gemacht
  // hat, nur in die andere Richtung.
  const b = startklar({
    ...alles,
    lieferanten: [{ id: 'l1', name: 'Lieferant Eins', lieferzeitWerktage: 0 }],
  });
  assert.equal(b.punkte.find((p) => p.id === 'lieferzeit').zustand, 'erfuellt');
});

/* ------------------------------------------------------------------ *
 * Die Antwortzeit — aufgenommen am 2. September
 *
 * Der einzige Termin, den dieser Shop selbst zusagt. Alle anderen kommen
 * vom Lieferanten. Sie steht in keinem Schritt von auftragslauf.js, weil
 * sie zwischen den Schritten liegt — und ist deshalb beiden Rechnungen
 * entgangen, der Wegprobe wie dem Aufwand.
 * ------------------------------------------------------------------ */

test('Ohne zugesagte Antwortzeit ist der Punkt offen', () => {
  const e = startklar({ ...alles, betreiber: { ...alles.betreiber, antwortzeitWerktage: null } });
  const p = e.punkte.find((x) => x.id === 'antwortzeit');
  assert.ok(p, 'der Punkt fehlt ganz');
  assert.equal(p.zustand, 'offen');
  assert.equal(p.wer, 'Auftraggeber');
  assert.match(p.befund, /ohne Zeitangabe/);
});

test('Mit zugesagter Antwortzeit ist er erfüllt und nennt die Zahl', () => {
  const e = startklar({ ...alles, betreiber: { ...alles.betreiber, antwortzeitWerktage: 2 } });
  const p = e.punkte.find((x) => x.id === 'antwortzeit');
  assert.equal(p.zustand, 'erfuellt');
  assert.match(p.befund, /2 Werktag/);
});

test('Null Werktage sind keine Zusage, sondern ein Fehler', () => {
  for (const wert of [0, -1, '2', NaN]) {
    const e = startklar({ ...alles, betreiber: { ...alles.betreiber, antwortzeitWerktage: wert } });
    assert.equal(e.punkte.find((x) => x.id === 'antwortzeit').zustand, 'offen', String(wert));
  }
});

test('Die Antwortzeit steht auf der Kassenliste der fehlenden Dinge', () => {
  const e = startklar({ ...alles, betreiber: { ...alles.betreiber, antwortzeitWerktage: null } });
  const p = e.punkte.find((x) => x.id === 'antwortzeit');
  assert.ok(p.aufDerKasse, 'ohne Kassenwort bleibt der Punkt für den Kunden unsichtbar');
});

test('Die Betreiberdaten führen das Feld mit seiner Begründung', () => {
  const daten = JSON.parse(readFileSync(new URL('../data/betreiber.json', import.meta.url), 'utf8'));
  assert.ok('antwortzeitWerktage' in daten, 'das Feld fehlt in den Daten');
  assert.equal(daten.antwortzeitWerktage, null, 'heute ist keine Zeit entschieden');
  assert.ok((daten._antwortzeitHinweis ?? '').length > 80, 'ohne Begründung ist null nur eine Lücke');
});


/* ------------------------------------------------------------------ *
 * Das Urteil steht nicht nur auf dem Bildschirm
 *
 * Befund vom 3. September: `bin/startklar.mjs` endete ohne jeden
 * `process.exit` — also immer grün, auch mit „NICHT STARTKLAR". Es ist das
 * Werkzeug, das die Frage „darf der Shop online gehen?" beantwortet; wer es
 * in einen Veröffentlichungsschritt hängt, bekam von ihm jedes Mal ein Ja.
 * ------------------------------------------------------------------ */

test('Solange der Shop nicht startklar ist, endet der Lauf rot', () => {
  let ausgang = 0;
  let ausgabe = '';
  try {
    ausgabe = execFileSync(process.execPath, [werkzeug], { encoding: 'utf8' });
  } catch (e) {
    ausgang = e.status;
    ausgabe = e.stdout ?? '';
  }
  assert.match(ausgabe, /NICHT STARTKLAR/, 'der Bestand ist entgegen der Annahme startklar');
  assert.equal(ausgang, 1, 'das Urteil steht nur auf dem Bildschirm');
});

test('Mit --bericht bleibt derselbe Lauf grün', () => {
  // Wer die Liste lesen will, soll sie ohne Fehlerschluss bekommen — dieselbe
  // Regel wie bei den Prüfern.
  const ausgabe = execFileSync(process.execPath, [werkzeug, '--bericht'], { encoding: 'utf8' });
  assert.match(ausgabe, /NICHT STARTKLAR/);
});
