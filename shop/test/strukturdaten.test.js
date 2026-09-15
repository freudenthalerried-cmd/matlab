/**
 * Was die Maschine liest, muss auf der Seite stehen.
 *
 * **Befund vom 2. September 2026.** Jede Artikelseite trägt `Product`, jede
 * Wissens- und Gruppenseite `Article` und `FAQPage`, die Startseite
 * `Organization` — die **Lieferseite** trug nichts. Ausgerechnet die Seite mit
 * den Frachtsätzen und dem Liefergebiet, also den beiden Auskünften, nach
 * denen ein Kaufinteressent zuerst fragt.
 *
 * Beim Nachtragen fiel die zweite Frage auf: Wer bewacht, dass eine
 * ausgezeichnete Antwort dasselbe sagt wie die Seite? Eine Auszeichnung, die
 * etwas anderes behauptet als der sichtbare Text, ist die alte Familie —
 * `PreOrder` gegen `InStock`, „Kranentladung" gegen „Sperrgutzuschlag": Beide
 * Seiten stimmen für sich, und der Widerspruch fällt beim Kunden auf.
 *
 * > **Eine Auszeichnung, die mehr sagt als die Seite, ist eine Behauptung an
 * > eine Maschine.**
 *
 * Geprüft werden die **Zahlen** — sie sind die nachprüfbare Substanz einer
 * Antwort. Der Wortlaut darf abweichen; die Sätze sind für verschiedene Leser
 * geschrieben.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const SITE = fileURLToPath(new URL('../ausgabe/site', import.meta.url));

function seiten() {
  const gefunden = [];
  const gehe = (ordner) => {
    for (const e of readdirSync(ordner, { withFileTypes: true })) {
      const pfad = join(ordner, e.name);
      if (e.isDirectory()) gehe(pfad);
      else if (e.name.endsWith('.html')) gefunden.push(pfad);
    }
  };
  gehe(SITE);
  return gefunden;
}

/** Der sichtbare Text einer Seite — ohne Skripte, ohne Marken. */
function sichtbar(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#8239;|&thinsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

function auszeichnungen(html) {
  const gefunden = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    gefunden.push({ roh: m[1] });
  }
  return gefunden;
}

test('Jede Auszeichnung ist gültiges JSON', () => {
  if (!existsSync(SITE)) return; // ohne Bau keine Aussage — und keine falsche
  const dateien = seiten();
  assert.ok(dateien.length >= 40, `nur ${dateien.length} Seiten — die Schleife prüfte zu wenig`);
  // Erst sammeln, dann zusichern, dann prüfen: Die Zusicherung gehört **vor**
  // die Schleife, sonst liefe sie bei leerem Bestand durch und meldete Grün.
  const alle = dateien.flatMap((datei) =>
    auszeichnungen(readFileSync(datei, 'utf8')).map((a) => ({ datei, roh: a.roh })));
  assert.ok(alle.length >= 40, `nur ${alle.length} Auszeichnungen gefunden`);
  for (const a of alle) {
    assert.doesNotThrow(() => JSON.parse(a.roh), `${relative(SITE, a.datei)}: unlesbares JSON-LD`);
  }
});

test('Jede Zahl einer ausgezeichneten Antwort steht auch sichtbar auf der Seite', () => {
  if (!existsSync(SITE)) return;
  // Einheiten, nicht blanke Zahlen: „2" steht auf jeder Seite, „7,50 €" nicht.
  const zahlMitEinheit = /\d+(?:[.,]\d+)?\s*(?:€|%|m²|mm|cm|kg|Bezirke|Werktage?)/g;
  const fehlend = [];
  let antworten = 0;
  const dateien = seiten();
  assert.ok(dateien.length >= 40, `nur ${dateien.length} Seiten — die Schleife prüfte zu wenig`);
  for (const datei of dateien) {
    const html = readFileSync(datei, 'utf8');
    const text = sichtbar(html);
    for (const a of auszeichnungen(html)) {
      const daten = JSON.parse(a.roh);
      for (const frage of [].concat(daten.mainEntity ?? [])) {
        const antwort = frage?.acceptedAnswer?.text;
        if (!antwort) continue;
        antworten += 1;
        for (const zahl of antwort.match(zahlMitEinheit) ?? []) {
          if (!text.includes(zahl.replace(/\s+/g, ' '))) {
            fehlend.push(`${relative(SITE, datei)}: „${zahl}" steht nur in der Auszeichnung`);
          }
        }
      }
    }
  }
  assert.ok(antworten >= 10, `nur ${antworten} ausgezeichnete Antworten — die Schleife prüfte zu wenig`);
  assert.deepEqual(fehlend, []);
});

test('Die Lieferseite beantwortet die Fragen, die ein Assistent bekommt', () => {
  if (!existsSync(SITE)) return;
  const datei = join(SITE, 'lieferung.html');
  if (!existsSync(datei)) return;
  const daten = auszeichnungen(readFileSync(datei, 'utf8')).map((a) => JSON.parse(a.roh));
  const faq = daten.find((d) => [].concat(d['@type']).includes('FAQPage'));
  assert.ok(faq, 'die Lieferseite trägt keine FAQ-Auszeichnung');
  const fragen = faq.mainEntity.map((f) => f.name).join(' | ');
  for (const wort of ['kostet', 'Frei-Haus', 'Wohin', 'abholen']) {
    assert.match(fragen, new RegExp(wort), fragen);
  }
  // Und was die Daten nicht hergeben, steht nicht da: Die Lieferzeit des
  // Lieferanten ist unbekannt, und eine erfundene Frist in einer
  // maschinenlesbaren Auszeichnung wird zitiert und nicht gelesen.
  assert.doesNotMatch(fragen, /Wie lange|Lieferzeit|Liefertermin/, 'eine Frist, die niemand zugesagt hat');
});
