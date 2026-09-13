/**
 * Die Außenlage — gemessen statt angenommen.
 *
 * **Der Anlass, 9. September 2026, nachts.** In `src/startklar.js` stand seit
 * dem ersten Bau, ob das Repository privat ist, sei „von hier aus nicht
 * feststellbar". Nachgesehen hatte das niemand: Der Netzausgang ist gesperrt,
 * das GitHub-Werkzeug nicht — es beantwortet die Frage in einem Aufruf.
 *
 * > **Eine Grenze, die zu weit gezogen ist, deckt genau das, was sie
 * > ausschließt.**
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  aussenlage, tageSeit, widerspruchsbefund, aussengrenzenbefund, GRENZE_TAGE,
  aussagenbefund, gemesseneAdressen, UMFELD,
} from '../src/aussenlage.js';
import { startklar } from '../src/startklar.js';

const vermerk = JSON.parse(readFileSync(
  fileURLToPath(new URL('../data/aussenlage.json', import.meta.url)), 'utf8'));

test('der Vermerk im Verzeichnis ist lesbar und trägt sein Messdatum', () => {
  assert.match(vermerk.gemessenAm, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof vermerk.repositoryOeffentlich, 'boolean');
  // Die Grenze der Datei gehört in die Datei — nicht nur in den Kopf dieses Tests.
  assert.match(vermerk._grenze, /Handgriff/);
  /*
   * **Nachgezogen am 10. September.** Hier stand `/GitHub-Werkzeug/`, weil die
   * Sichtbarkeit nur über ein fremdes Werkzeug zu haben war. Seit an dem Tag
   * gemessen wurde, dass `api.github.com` aus dieser Umgebung antwortet, kann
   * der Shop sie selbst erheben — und der Weg, der ohne fremdes Werkzeug
   * auskommt, ist der, den dieses Feld nennen muss.
   */
  assert.match(vermerk._wieGemessen, /api\.github\.com/);
});

test('eine frische Messung wird durchgereicht', () => {
  const b = aussenlage(vermerk, vermerk.gemessenAm);
  assert.equal(b.repositoryOeffentlich, vermerk.repositoryOeffentlich);
  assert.equal(b.alter, 0);
  assert.equal(b.grund, null);
});

/**
 * Der Kern: **Eine Messung ist eine Aussage über den Tag, an dem sie gemacht
 * wurde.** Der gefährliche Fall ist nicht „öffentlich und keiner weiß es",
 * sondern „einmal privat gemessen, seither wieder öffentlich".
 */
test('eine alte Messung sagt über heute nichts', () => {
  const spaet = new Date(Date.parse(`${vermerk.gemessenAm}T00:00:00Z`) + (GRENZE_TAGE + 1) * 86400000)
    .toISOString().slice(0, 10);
  const b = aussenlage(vermerk, spaet);
  assert.equal(b.repositoryOeffentlich, null);
  assert.match(b.grund, /Tage alt/);
});

test('genau an der Grenze trägt sie noch', () => {
  const rand = new Date(Date.parse(`${vermerk.gemessenAm}T00:00:00Z`) + GRENZE_TAGE * 86400000)
    .toISOString().slice(0, 10);
  assert.equal(aussenlage(vermerk, rand).repositoryOeffentlich, vermerk.repositoryOeffentlich);
});

test('ein fehlender oder unlesbarer Vermerk ist keine Auskunft, sondern ein Grund', () => {
  const faelle = [
    [null, /fehlt/],
    [{}, /kein lesbares Messdatum/],
    [{ gemessenAm: 'gestern', repositoryOeffentlich: true }, /kein lesbares Messdatum/],
    [{ gemessenAm: '2026-09-20', repositoryOeffentlich: true }, /auf morgen/],
  ];
  assert.equal(faelle.length, 4, 'die Schleife prüfte zu wenig');
  for (const [eingabe, muster] of faelle) {
    const b = aussenlage(eingabe, '2026-09-09');
    assert.equal(b.repositoryOeffentlich, null, JSON.stringify(eingabe));
    assert.match(b.grund, muster, JSON.stringify(eingabe));
  }
});

test('ein Feld, das keine Wahrheitsangabe ist, gilt nicht als Auskunft', () => {
  const b = aussenlage({ gemessenAm: '2026-09-09', repositoryOeffentlich: 'ja' }, '2026-09-09');
  assert.equal(b.repositoryOeffentlich, null);
});

test('tageSeit rechnet vorwärts und meldet Unlesbares', () => {
  assert.equal(tageSeit('2026-09-01', '2026-09-09'), 8);
  assert.equal(tageSeit('2026-09-09', '2026-09-01'), -8);
  assert.equal(tageSeit('irgendwann', '2026-09-09'), null);
});

/* ------------------------------------------------------------------ *
 * Die Messung schlägt die Angabe
 * ------------------------------------------------------------------ */

test('Angabe und Messung, die einander widersprechen, fallen auf', () => {
  const gemessen = { repositoryOeffentlich: true };
  const b = widerspruchsbefund(gemessen, true);
  assert.deepEqual(b.map((m) => m.regel), ['erklaerung-gegen-messung']);
  assert.match(b[0].text, /die Messung gilt/);
});

test('stimmen sie überein, gibt es nichts zu melden', () => {
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: true }, false), []);
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: false }, true), []);
  // Ohne Messung oder ohne Angabe ist nichts zu vergleichen.
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: null }, true), []);
  assert.deepEqual(widerspruchsbefund({ repositoryOeffentlich: true }, null), []);
});

/* ------------------------------------------------------------------ *
 * Was die Bereitschaftsliste daraus macht
 * ------------------------------------------------------------------ */

test('mit Messung ist der Repositorypunkt beantwortet, nicht gefragt', () => {
  const offen = startklar({ aussenlage: vermerk, heute: vermerk.gemessenAm })
    .punkte.find((p) => p.id === 'repository');
  assert.equal(offen.zustand, 'offen', 'öffentlich gemessen heißt offen, nicht unpruefbar');
  assert.match(offen.befund, /gemessen am/);

  const privat = startklar({
    aussenlage: { ...vermerk, repositoryOeffentlich: false },
    heute: vermerk.gemessenAm,
  }).punkte.find((p) => p.id === 'repository');
  assert.equal(privat.zustand, 'erfuellt');
});

/**
 * Und die Gegenrichtung, ohne die die Messung zur Zusage würde: Ist sie alt
 * oder fehlt sie, steht der Punkt wieder als Frage da — mit dem Grund.
 */
test('ohne tragende Messung ist der Punkt wieder eine Frage', () => {
  const b = startklar({ aussenlage: null, heute: '2026-09-09' })
    .punkte.find((p) => p.id === 'repository');
  assert.equal(b.zustand, 'unpruefbar');
  assert.match(b.befund, /fehlt/);
  assert.match(b.befund, /rekonstruierbar/);
});

/* ------------------------------------------------------------------ *
 * Die behaupteten Grenzen
 * ------------------------------------------------------------------ */

test('jede behauptete Grenze nennt einen Weg oder einen Grund', () => {
  const b = aussengrenzenbefund(vermerk, vermerk.gemessenAm);
  assert.deepEqual(b.meldungen, [], b.meldungen.map((m) => m.text).join('\n'));
  assert.ok(b.grenzen >= 5, `nur ${b.grenzen} Grenzen — die Liste ist zu dünn zum Prüfen`);
  assert.equal(b.gemessen + b.begruendet, b.grenzen);
});

/**
 * Der Kern: **Nicht versucht ist nicht unmöglich.** Genau diese Lücke hat am
 * 9. September zweimal eine falsche Grenze gedeckt.
 */
test('ein genannter Weg ohne Versuch fällt auf', () => {
  const b = aussengrenzenbefund({ versuche: {} }, '2026-09-09',
    [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grenze-ohne-versuch']);
  assert.match(b.meldungen[0].text, /niemand ist ihn gegangen/);
});

test('ein alter Versuch sagt über heute nichts', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-01-01', ergebnis: 'gesperrt', beleg: 'a'.repeat(30) } } },
    '2026-09-09', [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['versuch-veraltet']);
});

test('ein Ergebnis ohne Beleg ist eine Behauptung mit Ziffern', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-09-09', ergebnis: 'gesperrt', beleg: 'ging nicht' } } },
    '2026-09-09', [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['beleg-fehlt']);
});

test('ein drittes Ergebnis gibt es nicht', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-09-09', ergebnis: 'vielleicht', beleg: 'a'.repeat(30) } } },
    '2026-09-09', [{ id: 'x', was: 'irgendwas', wie: 'curl' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['ergebnis-unbekannt']);
});

test('ohne Weg braucht es einen ganzen Grund', () => {
  const b = aussengrenzenbefund({ versuche: {} }, '2026-09-09',
    [{ id: 'x', was: 'irgendwas', wie: null, warumOhneVersuch: 'geht halt nicht' }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['grund-zu-duenn']);
});

/** Beide Richtungen: ein Versuch ohne Grenze, und ein Versuch ohne Weg. */
test('ein Versuch, zu dem keine Grenze gehört, fällt auch auf', () => {
  const b = aussengrenzenbefund(
    { versuche: { fremd: { am: '2026-09-09', ergebnis: 'gesperrt', beleg: 'a'.repeat(30) } } },
    '2026-09-09', []);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['versuch-ohne-grenze']);
});

test('eine Grenze ohne Weg, zu der es einen Versuch gibt, ist ein Widerspruch', () => {
  const b = aussengrenzenbefund(
    { versuche: { x: { am: '2026-09-09', ergebnis: 'gesperrt', beleg: 'a'.repeat(30) } } },
    '2026-09-09',
    [{ id: 'x', was: 'irgendwas', wie: null, warumOhneVersuch: 'g'.repeat(90) }]);
  assert.deepEqual(b.meldungen.map((m) => m.regel), ['versuch-ohne-weg']);
});

/**
 * Und das Ergebnis, um das es geht: Eine Grenze, die sich als überschreitbar
 * erwiesen hat, ist keine Grenze mehr. Am 9. September war es die
 * Sichtbarkeit des Repositorys.
 */
test('das Verzeichnis hält fest, welche Grenze gefallen ist', () => {
  const b = aussengrenzenbefund(vermerk, vermerk.gemessenAm);
  assert.ok(b.moeglich >= 1, 'keine einzige überschrittene Grenze — dann fehlt der Anlass');
  assert.equal(vermerk.versuche['repository-sichtbarkeit'].ergebnis, 'moeglich');
  assert.match(vermerk.versuche['repository-sichtbarkeit'].beleg, /visibility/);
});

/**
 * **Was der Bestand über den Netzausgang behauptet.**
 *
 * Bis zum 9. September stand in 15 Quelldateien derselbe pauschale Satz. Am 9.
 * war gemessen, dass er zu weit gezogen ist; berichtigt wurde die Datei, in der
 * es stand. *Eine Berichtigung, die eine Stelle erreicht, gilt für eine Stelle.*
 */
test('Ein Satz ohne Adresse ist eine Pauschale', () => {
  const b = aussagenbefund(
    [{ pfad: 'src/x.js', text: 'Der Netzausgang dieser Umgebung ist gesperrt.' }],
    { a: { beleg: 'bauversand.com antwortet nicht' } });
  assert.equal(b.gefunden, 1);
  assert.equal(b.meldungen.length, 1);
  assert.equal(b.meldungen[0].regel, 'pauschale-sperre');
  assert.equal(b.meldungen[0].pfad, 'src/x.js');
});

test('Ein Satz mit gemessener Adresse geht durch', () => {
  const b = aussagenbefund(
    [{ pfad: 'src/x.js', text: 'Für bauversand.com ist der Netzausgang gesperrt.' }],
    { a: { beleg: 'bauversand.com antwortet nicht' } });
  assert.equal(b.gefunden, 1);
  assert.deepEqual(b.meldungen, []);
});

test('Eine Adresse ohne Messung deckt nichts', () => {
  // Sonst genügte es, irgendeine Adresse danebenzuschreiben.
  const b = aussagenbefund(
    [{ pfad: 'src/x.js', text: 'Für erfunden.example ist der Netzausgang gesperrt.' }],
    { a: { beleg: 'bauversand.com antwortet nicht' } });
  assert.equal(b.meldungen.length, 1);
});

test('Die Adresse muss in der Nähe stehen, nicht irgendwo in der Datei', () => {
  const weit = `bauversand.com\n${'x'.repeat(UMFELD * 2)}\nDer Netzausgang ist gesperrt.`;
  const b = aussagenbefund([{ pfad: 'src/x.js', text: weit }],
    { a: { beleg: 'bauversand.com antwortet nicht' } });
  assert.equal(b.meldungen.length, 1, 'ein weiter Umkreis erklärt Sätze für gedeckt, die er nicht meint');
});

test('Die Zeilennummer zeigt auf den Satz, nicht auf die Datei', () => {
  const text = ['eins', 'zwei', 'drei', 'Der Netzausgang ist gesperrt.'].join('\n');
  const b = aussagenbefund([{ pfad: 'src/x.js', text }], {});
  assert.equal(b.meldungen[0].zeile, 4);
});

test('Mehrere Sätze in einer Datei werden einzeln gezählt', () => {
  const text = `Der Netzausgang ist gesperrt.\n${'y'.repeat(1200)}\nSein Netzausgang war gesperrt.`;
  const b = aussagenbefund([{ pfad: 'src/x.js', text }], {});
  assert.equal(b.gefunden, 2);
  assert.equal(b.meldungen.length, 2);
});

test('Aus den Belegen werden nur echte Adressen gelesen', () => {
  const a = gemesseneAdressen({
    eins: { beleg: 'curl https://api.github.com/repos/x/y: HTTP 200' },
    zwei: { beleg: 'ris.bka.gv.at und www.ris.bka.gv.at ohne Verbindung' },
    drei: { beleg: 'kein Weg, kein Beleg' },
  });
  assert.ok(a.has('api.github.com'), [...a].join(' '));
  assert.ok(a.has('ris.bka.gv.at'));
  assert.ok(!a.has('kein.weg'));
});

test('Der echte Bestand trägt zu jeder Sperraussage eine gemessene Adresse', async () => {
  // Die Richtung, die den Fund gemacht hätte: 22 Sätze, drei berichtigt.
  const { readFileSync, readdirSync } = await import('node:fs');
  const wurzel = new URL('../', import.meta.url);
  const dateien = [];
  for (const ordner of ['src', 'bin']) {
    for (const name of readdirSync(new URL(`${ordner}/`, wurzel))) {
      if (!/\.(js|mjs)$/.test(name)) continue;
      dateien.push({
        pfad: `${ordner}/${name}`,
        text: readFileSync(new URL(`${ordner}/${name}`, wurzel), 'utf8'),
      });
    }
  }
  assert.ok(dateien.length >= 100, `nur ${dateien.length} Quelldateien`);
  const versuche = JSON.parse(readFileSync(new URL('data/aussenlage.json', wurzel), 'utf8')).versuche;
  const b = aussagenbefund(dateien, versuche);
  /*
   * **Die Zahl steht hier mit Absicht.** Beim Nachziehen der Fundstellen fiel sie
   * schon einmal von 24 auf 7, weil das Muster die Wortstellung vorschrieb und die
   * umformulierten Sätze aus seinem Blickfeld rutschten. Der Prüfer war grün, ohne
   * etwas geprüft zu haben. Fällt sie wieder, ist das ein Befund und kein Fortschritt.
   */
  assert.ok(b.gefunden >= 15, `nur ${b.gefunden} Sperraussagen — die Schleife prüfte fast nichts`);
  assert.deepEqual(b.meldungen.map((m) => `${m.pfad}:${m.zeile}`), [],
    'eine Sperraussage im Bestand nennt keine gemessene Adresse');
});


test('Die Adresse der UID-Abfrage liegt unter .eu und zählt trotzdem', () => {
  /*
   * **12. September 2026.** Die Endungsliste in `gemesseneAdressen` endete
   * bei `at`, `com`, `org`, `io` und `net`. Der Versuch `uid-pruefung` vom
   * 10. September nennt als Beleg `ec.europa.eu` — VIES, das
   * EU-Informationsaustauschsystem, und damit die **einzige** Adresse, um
   * die es bei der UID-Abfrage geht. Der Prüfer erkannte sie nicht und
   * verlangte für jeden Satz über diese Sperre eine Adresse, die er selbst
   * ausschloss: Die Messung lag vor und war nicht verwendbar.
   */
  const a = gemesseneAdressen({
    uid: { am: '2026-09-10', ergebnis: 'gesperrt', beleg: 'ec.europa.eu (VIES): keine Verbindung' },
  });
  assert.ok(a.has('ec.europa.eu'), [...a].join(' '));

  // Und die Liste bleibt eng: Ein Wort mit Punkt ist keine Adresse.
  const b = gemesseneAdressen({ x: { beleg: 'z.B. kein Weg dorthin' } });
  assert.equal(b.size, 0, [...b].join(' '));
});
