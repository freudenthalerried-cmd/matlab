#!/usr/bin/env node
/**
 * Verhaltensprobe des Shops — die gebaute Seite im echten Headless-Chromium.
 *
 *   node bin/shopprobe.mjs
 *
 * Warum eine zweite Probe neben `oberflaechenprobe.mjs`: Jene prüft
 * `demo.html`, die Arbeitsoberfläche des Rechenkerns. Diese prüft
 * `ausgabe/website.html`, den **Shop** — Suche, Filter, Warenkorb, Kasse.
 * Beides sind verschiedene Seiten mit verschiedenen Fehlern.
 *
 * Die Lehren aus der ersten Probe stecken auch hier drin:
 *
 * 1. **Jedes Szenario beweist mit einem Marker, dass es gelaufen ist.** Eine
 *    Probe ohne Marker gilt als Fehlschlag, nicht als bestanden.
 * 2. **Geprüft wird nur der gerenderte Text** zwischen zwei Markern, nicht
 *    das ganze Dokument. Der eingebettete Rechenkern steht als Quelltext in
 *    der Seite; ein Grep darüber fände jeden Erwartungstext in einem
 *    String-Literal und meldete Grün für Szenarien, die nie liefen.
 *
 * Genutzt wird die Einzeldateifassung: Sie navigiert über die Raute, also
 * ohne neuen Seitenladevorgang. Damit ist die Probe unabhängig davon, ob
 * `localStorage` unter `file://` erlaubt ist — der Warenkorb lebt im
 * laufenden Skript. Dass er auch **über einen Seitenwechsel hinweg** hält,
 * ist eine Eigenschaft des Speichers und wird im Testlauf geprüft
 * (`shopkern.test.js`), nicht hier.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { KORBSCHLUESSEL } from '../src/shopkern.js';
import { extname } from 'node:path';

const hier = fileURLToPath(new URL('.', import.meta.url));
const shopDatei = join(hier, '..', 'ausgabe', 'website.html');
const siteOrdner = join(hier, '..', 'ausgabe', 'site');
const ANFANG = 'SHOPPROBE-ANFANG';
const ENDE = 'SHOPPROBE-ENDE';

function findeChromium() {
  const wurzeln = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers'].filter(Boolean);
  for (const wurzel of wurzeln) {
    if (!existsSync(wurzel)) continue;
    for (const eintrag of readdirSync(wurzel).sort().reverse()) {
      for (const rest of [['chrome-linux', 'headless_shell'], ['chrome-linux', 'chrome']]) {
        const pfad = join(wurzel, eintrag, ...rest);
        if (existsSync(pfad)) return pfad;
      }
    }
  }
  return null;
}

/** Wartet, bis die Rautennavigation den neuen Inhalt gezeichnet hat. */
const GEHEZU = `
  async function geheZu(kennung) {
    location.hash = kennung;
    await new Promise((f) => setTimeout(f, 60));
  }
  const text = (wahl) => [...document.querySelectorAll(wahl)].map((n) => n.textContent).join(' | ');
`;

const SZENARIEN = [
  {
    name: 'Suche findet das Wort im zusammengesetzten Wort',
    // Der Grund für diesen Fall: Der erste Entwurf suchte nur Wortanfänge und
    // fand „Baumit KlebeSpachtel" bei der Eingabe „spachtel" nicht.
    aktionen: `
      await geheZu('suche?q=spachtel');
      out = text('#suche-ziel .karte .t');`,
    erwartet: ['KlebeSpachtel'],
  },
  {
    name: 'Suche grenzt mit zwei Wörtern ein statt zu erweitern',
    aktionen: `
      await geheZu('suche?q=xps%2050');
      out = text('#suche-ziel .karte .t');`,
    erwartet: ['XPS glatt SF 50 mm'],
    verboten: ['100 mm', '30 mm'],
  },
  {
    // Gemessen am 28.08.: acht von neun plausiblen Vertippern fanden nichts.
    // Wer auf der Baustelle mit einer Hand tippt, bekommt eine leere Seite.
    name: 'Ein Vertipper bekommt einen Vorschlag, keine stille Ersetzung',
    aktionen: `
      await geheZu('suche?q=kanalror');
      const kopf = text('#suche-kopf');
      const antwort = text('#suche-ziel .antwort');
      const verweis = document.querySelector('#suche-ziel .antwort a');
      // Nicht nur die Adresse lesen, sondern ihr folgen: Was zählt, ist die
      // Seite danach.
      let danach = 'NICHT GEFOLGT';
      if (verweis) {
        await geheZu(verweis.getAttribute('href').replace(/^.*#/, ''));
        danach = text('#suche-kopf');
      }
      out = 'kopf=[' + kopf + '] hatVorschlag=' + /Meinten Sie/.test(antwort)
        + ' wort=' + (verweis ? verweis.textContent : 'KEINER')
        + ' danach=[' + danach + ']';`,

    // Der Kopf nennt weiterhin die **eingegebene** Anfrage — es wird nichts
    // heimlich ersetzt.
    erwartet: ['Kein Treffer für „kanalror"', 'hatVorschlag=true', 'wort=kanalrohr',
      'danach=[2 Treffer für „kanalrohr"]'],
  },
  {
    // Die meisten Kunden kommen gar nicht auf die Suchseite — sie tippen ins
    // Feld. Ein leeres Vorschlagsfenster sagt „gibt es nicht", und das ist
    // bei einem Vertipper falsch.
    name: 'Auch die Vorschlagsliste antwortet auf einen Vertipper',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'kanalror';
      feld.dispatchEvent(new Event('input'));
      const zeilen = [...document.querySelectorAll('#suchvorschlag .vorschlag')];
      out = 'zeilen=' + zeilen.length + ' ' + text('#suchvorschlag .vorschlag')
        + ' fuehrtZurSuche=' + (zeilen.length ? /suche.*q=kanalrohr/.test(zeilen[0].getAttribute('href')) : false);`,
    erwartet: ['kanalrohr', 'Meinten Sie das?', 'fuehrtZurSuche=true'],
  },
  {
    // **Dem Verweis folgen, nicht nur seine Adresse lesen.**
    //
    // Die Probe darüber prüft, wohin die Vorschlagszeile zeigt. Das ist die
    // Sorte Prüfung, die dieses Vorhaben schon zweimal in die Irre geführt
    // hat: Sie liest die Absicht statt das Ergebnis. Hier wird geklickt und
    // nachgesehen, was danach auf der Seite steht.
    name: 'Der Vorschlag führt geklickt zu echten Treffern',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'kanalror';
      feld.dispatchEvent(new Event('input'));
      const zeile = document.querySelector('#suchvorschlag .vorschlag');
      const wohin = zeile.getAttribute('href');
      // In der Einzeldatei ist der Verweis eine Raute; ihr folgen heißt, den
      // Rautenteil zu setzen und die Seite neu zeichnen zu lassen.
      await geheZu(wohin.replace(/^.*#/, ''));
      const karten = [...document.querySelectorAll('#suche-ziel .karte .t')].map((n) => n.textContent);
      out = 'kopf=[' + text('#suche-kopf') + '] karten=' + karten.length
        + ' erste=[' + (karten[0] || 'KEINE') + ']';`,
    erwartet: ['Treffer für „kanalrohr"', 'Kanalrohr'],
    verboten: ['Kein Treffer'],
  },
  {
    name: 'Ohne nahes Wort bleibt die Vorschlagsliste zu',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'dachziegel';
      feld.dispatchEvent(new Event('input'));
      const liste = document.getElementById('suchvorschlag');
      out = 'zeilen=' + document.querySelectorAll('#suchvorschlag .vorschlag').length
        + ' versteckt=' + liste.hidden;`,
    erwartet: ['zeilen=0', 'versteckt=true'],
  },
  {
    name: 'Wo nichts nah genug ist, schweigt der Vorschlag',
    aktionen: `
      await geheZu('suche?q=dachziegel');
      out = 'antwort=[' + text('#suche-ziel .antwort') + ']';`,
    erwartet: ['Was nicht darin steht, führen wir nicht'],
    verboten: ['Meinten Sie'],
  },
  {
    name: 'Suche schweigt lieber, als etwas zu erfinden',
    aktionen: `
      await geheZu('suche?q=dachziegel');
      out = text('#suche-kopf') + ' | ' + text('#suche-ziel .antwort');`,
    erwartet: ['Kein Treffer', 'Was nicht darin steht, führen wir nicht'],
  },
  {
    name: 'Artikel in den Warenkorb legen zählt hoch',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.getElementById('menge-POS-12566').value = '4';
      document.querySelector('[data-legen="POS-12566"]').click();
      out = 'Zaehler:' + document.querySelector('[data-korbzaehler]').textContent;`,
    erwartet: ['Zaehler:4'],
  },
  {
    name: 'Der Warenkorb rechnet Fracht und Sperrgutzuschlag getrennt aus',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .preistafel');`,
    // POS-12566 ist palettiert: 75,50 Pauschale plus 7,50 Kranentladung.
    erwartet: ['83,00 €', 'Pauschale plus 1× Sperrgutzuschlag', '20 % USt'],
  },
  {
    name: 'Der Warenkorb überlebt den Seitenwechsel',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('wissen/baumeisterpreis');
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .korbzeile .kz-t');`,
    erwartet: ['Fassaden EPS'],
  },
  {
    name: 'Kasse: Perg liegt im Liefergebiet',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = 'Perg';
      sel.dispatchEvent(new Event('change'));
      out = text('#kasse-ziel .gebiet');`,
    erwartet: ['Wir liefern nach Perg'],
  },
  {
    name: 'Kasse: ein anderer Bezirk wird abgelehnt, mit Grund',
    // Gate 23 in der Oberfläche. Die Liste kommt aus liefergebiet.js.
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = '__anderer__';
      sel.dispatchEvent(new Event('change'));
      out = text('#kasse-ziel .gebiet');`,
    erwartet: ['Außerhalb des Liefergebiets', 'Perg'],
  },
  {
    name: 'Die Kasse löst nichts aus und sagt das auch',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      out = text('#kasse-ziel .antwort');`,
    // Die Aufzählung dessen, was fehlt, kommt seit dem 29.08. aus derselben
    // Rechnung wie `npm run startklar` und steht nicht mehr im Quelltext der
    // Oberfläche. Erwartet wird deshalb der Zahlungsanbieter als **eines**
    // der genannten Stücke — verschwindet die Aufzählung, fällt das Szenario.
    erwartet: ['Bestellen können Sie hier nicht', 'ein Zahlungsanbieter',
      'sie löst keine aus'],
    verboten: ['Bestellung ausgelöst'],
  },
  {
    name: 'Ohne Bezirk steht kein Anfragetext da, sondern die Aufforderung',
    // Der Anfragetext ohne Bezirk wäre unvollständig und Gate 23 ungeprüft.
    // Geprüft wird deshalb auch, dass das Textfeld noch **nicht** existiert.
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      out = text('.anfrage') + ' [felder=' + document.querySelectorAll('.anfragetext').length + ']';`,
    erwartet: ['Anfrage stellen', 'Wählen Sie oben den Bezirk', '[felder=0]'],
  },
  {
    name: 'Mit Bezirk steht die gerechnete Anfrage im Textfeld',
    // `.value` und nicht `.textContent`: Der Inhalt eines <textarea> steht im
    // Wert. Die erste Fassung dieser Probe las den Text und bekam den leeren
    // Anfangszustand — grün, ohne etwas gesehen zu haben.
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = 'Perg';
      sel.dispatchEvent(new Event('change'));
      const feld = document.querySelector('.anfragetext');
      out = feld ? feld.value : 'KEIN FELD';`,
    erwartet: ['UNVERBINDLICHE ANFRAGE', 'Baustelle im Bezirk: Perg', 'POS-12566',
      'Brutto gesamt', 'freibleibend'],
    verboten: ['Spanne', 'Marge', 'Einkaufspreis'],
  },
  {
    name: 'Ein Bezirk außerhalb des Liefergebiets erzeugt keinen Anfragetext',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = '__anderer__';
      sel.dispatchEvent(new Event('change'));
      out = text('.anfrage') + ' [felder=' + document.querySelectorAll('.anfragetext').length + ']';`,
    // „Kein Textfeld" allein ist keine Zusicherung: Das trifft auch zu, wenn
    // der ganze Abschnitt fehlt. Gegengeprobt — mit abgeschaltetem Abschnitt
    // war dieses Szenario als einziges der vier weiter grün. Deshalb steht
    // hier zusätzlich, was nur bei gezeichnetem Abschnitt dasteht.
    erwartet: ['Anfrage stellen', 'Außerhalb des Liefergebiets', '[felder=0]'],
    verboten: ['UNVERBINDLICHE ANFRAGE'],
  },
  {
    name: 'Ohne hinterlegte Adresse gibt es keinen Mailknopf, aber den Grund dafür',
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('kasse');
      const sel = document.querySelector('#kasse-ziel select');
      sel.value = 'Perg';
      sel.dispatchEvent(new Event('change'));
      const mail = [].filter.call(document.querySelectorAll('.anfrage-knoepfe a'),
        (a) => a.href.indexOf('mailto:') === 0).length;
      out = text('.anfrage-hinweis') + ' [mailknoepfe=' + mail + ']';`,
    erwartet: ['E-Mail-Adresse', '[mailknoepfe=0]'],
  },
  {
    name: 'Ein Gebindeartikel kommt als ganzes Gebinde in den Korb',
    // POS-13728 kostet je Kilogramm und wird in Gebinden zu 25 kg abgegeben.
    // Vor dem 29.08. legte der Knopf **ein Kilogramm** in den Korb — eine
    // Menge, die es nicht gibt.
    aktionen: `
      await geheZu('artikel/POS-13728');
      document.querySelector('[data-legen="POS-13728"]').click();
      await geheZu('warenkorb');
      const feld = document.querySelector('#warenkorb-ziel .kz-menge');
      out = 'menge=' + (feld ? feld.value : 'KEIN FELD')
        + ' schritt=' + (feld ? feld.step : '-')
        + ' summe=' + text('#warenkorb-ziel .kz-summe');`,
    erwartet: ['menge=25', 'schritt=25', '69,25'],
  },
  {
    name: 'Im Warenkorb wird eine Teilmenge auf das nächste Gebinde aufgerundet',
    // Aufgerundet, nicht ab: Wer 30 kg eintippt, braucht mehr als ein
    // Gebinde. Ihm 25 zu geben wäre stillschweigend zu wenig.
    aktionen: `
      await geheZu('artikel/POS-13728');
      document.querySelector('[data-legen="POS-13728"]').click();
      await geheZu('warenkorb');
      const feld = document.querySelector('#warenkorb-ziel .kz-menge');
      feld.value = '30';
      feld.dispatchEvent(new Event('change'));
      const neu = document.querySelector('#warenkorb-ziel .kz-menge');
      out = 'menge=' + neu.value + ' summe=' + text('#warenkorb-ziel .kz-summe');`,
    erwartet: ['menge=50', '138,50'],
    verboten: ['menge=30', 'menge=25'],
  },
  {
    name: 'Der Warenkorb nennt das Gewicht und sagt, wo es fehlt',
    // POS-10095 (Kanalrohr) hat ein belegtes Gewicht, POS-12566 (EPS) nicht.
    aktionen: `
      await geheZu('artikel/POS-10095');
      document.getElementById('menge-POS-10095').value = '10';
      document.querySelector('[data-legen="POS-10095"]').click();
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .preistafel');`,
    erwartet: ['17,33 kg', '1 Position ohne belegtes Gewicht'],
  },
  {
    name: 'Der Warenkorb sagt es, wenn die Fracht die Ware übersteigt',
    // Dieselbe Haltung wie bei der Zahlungsgebühr, die im Angebot gefehlt
    // hat: Die unangenehme Zahl steht auf der Seite, nicht erst auf der
    // Rechnung.
    aktionen: `
      await geheZu('artikel/POS-12566');
      document.querySelector('[data-legen="POS-12566"]').click();
      await geheZu('warenkorb');
      out = text('#warenkorb-ziel .antwort');`,
    erwartet: ['Die Fracht kostet hier mehr als die Ware', 'lieber hier als auf der Rechnung'],
  },
  {
    // **Die Erwartung nennt keine Bestandszahl.**
    //
    // Bis zum 28.08. stand hier „9 Artikel" und beim Szenario darunter „von
    // 46 Artikeln". Ein Lastlauf mit 100 eingespielten Artikeln ließ beide
    // umfallen — obwohl der Filter tadellos arbeitete. Eine Probe, die die
    // Größe des Sortiments festschreibt, meldet beim Wachsen einen Fehler,
    // den es nicht gibt, und lädt dazu ein, sie „anzupassen" statt sie zu
    // lesen.
    //
    // Geprüft wird deshalb das **Verhalten**: Die Sortierung steigt, und die
    // Zahl im Filter stimmt mit der Zahl der gezeigten Karten überein. Beides
    // rechnet die Seite selbst aus; hier steht nur noch das Urteil.
    name: 'Der Filter grenzt ein und sagt, wie viel übrig bleibt',
    aktionen: `
      await geheZu('gruppe/daemmung');
      const s = document.querySelector('#filterleiste select');
      s.value = 'preis-auf';
      s.dispatchEvent(new Event('change'));
      // Ziffernklassen als [0-9] statt \\d: Dieses Stück Code wandert als
      // Zeichenkette durch zwei Schichten Vorlage in eine HTML-Datei, und
      // ein Backslash, der dabei verlorengeht, macht aus einer Ziffernklasse
      // stillschweigend etwas anderes. Die längere Schreibweise übersteht
      // jede Schicht.
      const zahl = (n) => Number(String(n).replace(/[^0-9,.]/g, '').replace(',', '.'));
      const preise = [...document.querySelectorAll('#warenraster .karte .preis')].map((n) => zahl(n.textContent));
      const karten = preise.length;
      const roh = text('#filterleiste .f-zahl');
      const gefunden = roh.match(/[0-9]+/);
      const gemeldet = gefunden ? zahl(gefunden[0]) : -1;
      let steigend = true;
      for (let i = 1; i < preise.length; i++) if (preise[i] < preise[i - 1]) steigend = false;
      out = 'karten=' + karten + ' gemeldet=' + gemeldet
        + ' steigend=' + steigend + ' zahlPasst=' + (karten === gemeldet)
        + ' mehrAlsEine=' + (karten > 1);`,
    erwartet: ['steigend=true', 'zahlPasst=true', 'mehrAlsEine=true'],
  },
  {
    name: 'Preisvorteil-Filter wirft die Artikel ohne Vergleichspreis heraus',
    aktionen: `
      await geheZu('index');
      const zahlen = () => (text('#filterleiste .f-zahl').match(/[0-9]+/g) || []).map(Number);
      const vorher = zahlen();
      const schalter = [...document.querySelectorAll('#filterleiste input[type=checkbox]')][0];
      schalter.click();
      const nachher = zahlen();
      const gezeigt = document.querySelectorAll('#warenraster .karte').length;
      out = 'vorher=' + vorher.join('/') + ' nachher=' + nachher.join('/')
        + ' gezeigt=' + gezeigt
        + ' grenztEin=' + (nachher[0] < nachher[1])
        + ' zahlPasst=' + (gezeigt === nachher[0]);`,
    erwartet: ['grenztEin=true', 'zahlPasst=true'],
  },
  {
    name: 'Die Bedienelemente im Warenkorb sind daumengroß',
    // Gemessen wird hier und nicht im 390-px-Rahmen: Dort führt das
    // eingebettete Dokument keine Skripte aus, und ein leerer Warenkorb hat
    // keine Bedienelemente, die zu klein sein könnten.
    aktionen: `
      await geheZu('artikel/POS-10095');
      document.getElementById('menge-POS-10095').value = '12';
      document.querySelector('[data-legen="POS-10095"]').click();
      await geheZu('warenkorb');
      const mess = (wahl) => [...document.querySelectorAll(wahl)]
        .map((n) => Math.round(n.getBoundingClientRect().height));
      const alle = [...document.querySelectorAll('#warenkorb-ziel .kz-menge, #warenkorb-ziel .kz-weg, #warenkorb-ziel .knopf')];
      out = 'anzahl=' + alle.length
        + ' menge=' + mess('#warenkorb-ziel .kz-menge').join(',')
        + ' weg=' + mess('#warenkorb-ziel .kz-weg').join(',')
        + ' knopf=' + mess('#warenkorb-ziel .knopf').join(',')
        + ' zuklein=' + alle.filter((n) => n.getBoundingClientRect().height < 44).length;`,
    erwartet: ['zuklein=0'],
    verboten: ['anzahl=0'],
  },
  {
    name: 'Die Vorschlagsliste lässt sich mit der Tastatur bedienen',
    // Wer einen Suchvorschlag nur mit der Maus erreichen kann, für den ist
    // die Liste eine Zierde.
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      const taste = (k) => feld.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      feld.value = 'kanal';
      feld.dispatchEvent(new Event('input'));
      taste('ArrowDown');
      taste('ArrowDown');
      const gewaehlt = document.querySelector('#suchvorschlag .gewaehlt');
      out = 'zweite=' + (gewaehlt ? gewaehlt.textContent : 'KEINE')
        + ' | aktiv=' + feld.getAttribute('aria-activedescendant')
        + ' | offen=' + feld.getAttribute('aria-expanded')
        + ' | rolle=' + document.getElementById('suchvorschlag').getAttribute('role');`,
    erwartet: ['aktiv=vorschlag-1', 'offen=true', 'rolle=listbox'],
    verboten: ['zweite=KEINE'],
  },
  {
    name: 'Pfeil nach oben läuft von der ersten Zeile ans Ende um',
    // Am Ende steckenzubleiben ist die häufigste Art, eine Tastaturliste
    // unbrauchbar zu machen.
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      const taste = (k) => feld.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      feld.value = 'kanal';
      feld.dispatchEvent(new Event('input'));
      const anzahl = document.querySelectorAll('#suchvorschlag .vorschlag').length;
      taste('ArrowUp');
      out = 'anzahl=' + anzahl + ' aktiv=' + feld.getAttribute('aria-activedescendant');`,
    erwartet: ['anzahl=8', 'aktiv=vorschlag-7'],
  },
  {
    name: 'Escape schließt die Vorschlagsliste',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'kanal';
      feld.dispatchEvent(new Event('input'));
      // Vorher zählen: „eintraege=0" nach Escape beweist nichts, wenn die
      // Liste nie Einträge hatte. Der Beweis gehört vor die Handlung.
      const vorher = document.querySelectorAll('#suchvorschlag .vorschlag').length;
      feld.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      out = 'vorher=' + vorher
        + ' versteckt=' + document.getElementById('suchvorschlag').hidden
        + ' offen=' + feld.getAttribute('aria-expanded')
        + ' nachher=' + document.querySelectorAll('#suchvorschlag .vorschlag').length;`,
    erwartet: ['vorher=8', 'versteckt=true', 'offen=false', 'nachher=0'],
  },
  {
    name: 'Der Vorschlag unter dem Suchfeld zeigt Preis und Gruppe',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'kanalbogen';
      feld.dispatchEvent(new Event('input'));
      out = text('#suchvorschlag .vorschlag');`,
    erwartet: ['Kanalbogen', 'netto', 'Kanal'],
  },
  {
    // Das Kundenwort muss im **Browser** wirken, nicht nur im Testlauf. Das
    // Register wird beim Bauen in die Seitendaten gelegt; wer es dort
    // vergisst, bekommt einen grünen Testlauf und eine stumme Suche.
    name: 'Wer „Rauchfang" tippt, findet den Kamin',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'rauchfang';
      feld.dispatchEvent(new Event('input'));
      out = 'treffer=' + document.querySelectorAll('#suchvorschlag .vorschlag').length
        + ' ' + text('#suchvorschlag .vorschlag');`,
    erwartet: ['treffer=8', 'Mantelstein', 'Kamin'],
  },
  {
    name: 'Ein Wort ohne Ware im Sortiment findet keine Ware',
    aktionen: `
      await geheZu('index');
      const feld = document.getElementById('suchfeld');
      feld.value = 'drainage';
      feld.dispatchEvent(new Event('input'));
      const zeilen = [...document.querySelectorAll('#suchvorschlag .vorschlag')];
      out = 'vorschlaege=' + zeilen.length
        + ' mitpreis=' + zeilen.filter((z) => /netto/.test(z.textContent)).length;`,
    erwartet: ['mitpreis=0'],
  },
];

/**
 * Szenarien, die die Seite in einem **schmalen Rahmen** messen.
 *
 * Warum eigens: Headless-Chromium erzwingt in dieser Umgebung eine
 * Fensterbreite von mindestens 500 px. Ein Bildschirmfoto mit
 * `--window-size=390` zeigt deshalb einen 500 px breiten Aufbau, von dem
 * 390 px abgeschnitten sind — es sieht aus wie ein Umbruchfehler und ist
 * keiner, und einen echten Umbruchfehler zeigt es nicht.
 *
 * Ein `<iframe width="390">` dagegen hat einen echten eigenen Viewport.
 * Darin gemessen wird, was zählt: **ob die Seite seitwärts scrollt.**
 * `scrollTo(9999, 0)` und danach `scrollX` ist der einzige Test, der nicht
 * lügt — `scrollWidth` allein zählt auch Inhalt, der in einem eigenen
 * Scrollkasten liegt und dort hingehört (Tabellen in `.scroll`).
 *
 * Gefunden hat diese Probe einen echten Fehler: „Geschäftsbedingungen" ist
 * als Überschrift 437 px breit; die AGB-Seite scrollte 82 px seitwärts.
 *
 * **Berichtigt am 28.08.** Hier stand: „In diesem Headless-Chromium führt
 * ein eingebettetes Dokument seine Skripte nicht aus." Die Beobachtung war
 * echt — `skripte=2`, `window.__SHOP__` undefiniert —, die Ursache falsch
 * zugeordnet:
 *
 * > **Widerrufen:** Nicht der Rahmen verhindert das Skript, sondern das
 * > Stylesheet von `fonts.googleapis.com`, das hinter dem Ausgangsproxy
 * > hängt statt zu scheitern. Ein hängendes Stylesheet hält den Parser an;
 * > das nachfolgende `<script src>` wird nie geparst. Ohne Proxyvariablen
 * > liefert derselbe Aufbau `shop=object, ready=complete`.
 *
 * Deshalb starten alle Chromium-Läufe jetzt mit `GRUNDFLAGGEN` und ohne
 * Proxy (siehe dort), und die zwei damals als „hohl" entfernten Szenarien —
 * Warenkorb und Kasse im Rahmen — sind wieder da. Sie waren nicht hohl,
 * weil der Rahmen kein Skript könnte, sondern weil die Seite leer blieb.
 * Die Absicherung dagegen (`mindestens`) bleibt und ist gegengeprobt: mit
 * leerem Korb fällt das Szenario um.
 */
const RAHMENSZENARIEN = [
  { name: 'Startseite: kein Seitwärtsrollen, Bedienelemente daumengroß', kennung: 'index' },
  { name: 'AGB-Seite: kein Seitwärtsrollen, Bedienelemente daumengroß', kennung: 'rechtliches/agb' },
  // Bewusst POS-21382: Diese Bahn steht in zwei Systemlisten und trägt
  // deshalb das längste „Wird damit zusammen verbaut"-Raster des Bestands
  // (dreizehn Karten). Wenn ein Kartenraster den Rahmen sprengt, dann dieses.
  { name: 'Artikelseite: kein Seitwärtsrollen, Bedienelemente daumengroß', kennung: 'artikel/POS-21382' },
  { name: 'Gruppenseite: kein Seitwärtsrollen, Bedienelemente daumengroß', kennung: 'gruppe/wdvs' },
  // Die Dämmgruppe trägt seit dem 28. eine vierspaltige Vergleichstafel. Eine
  // Tabelle ist das, was einen 390-px-Rahmen am ehesten sprengt — sie steht
  // deshalb in einem eigenen Scrollkasten, und genau das wird hier gemessen.
  { name: 'Gruppenseite mit Vergleichstafel scrollt bei 390 px nicht seitwärts', kennung: 'gruppe/daemmung' },
  // Die Systemliste trägt seit dem 27. den Schichtenschnitt — ein SVG mit
  // rechtsbündigen Beschriftungen außerhalb der Bänder. Genau so eine
  // Zeichnung sprengt einen schmalen Rahmen, wenn überhaupt etwas es tut.
  { name: 'Systemliste mit Schichtenschnitt scrollt bei 390 px nicht seitwärts', kennung: 'system/kellerwand-perimeter' },
  {
    name: 'Wissensseite mit langem Titel scrollt bei 390 px nicht seitwärts',
    kennung: 'wissen/perimeterdaemmung-und-grundmauerschutz',
  },
  // Die beiden Seiten, die es am nötigsten haben und am längsten gefehlt
  // haben: Ihre Bedienelemente entstehen erst mit Inhalt. Der Korb wird über
  // den gemeinsamen Ursprung gefüllt, bevor der Rahmen lädt. `mindestens`
  // ist der Beweis, dass die Seite nicht leer war — sonst bestünde ein
  // leerer Warenkorb die Größenprüfung mühelos.
  {
    name: 'Warenkorb mit drei Positionen bei 390 px',
    kennung: 'warenkorb',
    korb: [
      { sku: 'POS-12566', menge: 12 },
      { sku: 'POS-10095', menge: 40 },
      { sku: 'POS-19333', menge: 3 },
    ],
    mindestens: 6,
  },
  {
    name: 'Kasse mit gefülltem Korb bei 390 px',
    kennung: 'kasse',
    korb: [{ sku: 'POS-12566', menge: 12 }, { sku: 'POS-10095', menge: 40 }],
    mindestens: 1,
  },
  // Der Anfragetext ist ein Textfeld mit fester Spaltenbreite — das ist das
  // eine Bedienelement, das einen 390-px-Rahmen sprengen kann, ohne dass es
  // jemand bemerkt. Es entsteht erst nach der Bezirkswahl; deshalb wählt der
  // Rahmen den Bezirk, bevor er misst. `mindestens` beweist, dass er da war:
  // ohne gezeichneten Abschnitt fällt das Szenario um.
  {
    name: 'Kasse mit Anfragetext bei 390 px',
    kennung: 'kasse',
    korb: [{ sku: 'POS-12566', menge: 12 }, { sku: 'POS-10095', menge: 40 }],
    imRahmen: "var s = d.querySelector('#kasse-ziel select');"
      + "if (s) { s.value = 'Perg'; s.dispatchEvent(new w.Event('change')); }",
    mindestens: 3,
  },
];

/**
 * Ein winziger Dateiserver für die Rahmenproben.
 *
 * Warum nicht weiter `file://`: Unter `file://` ist `localStorage` gesperrt.
 * Der Warenkorb lebt dort — also lässt sich unter `file://` nur die **leere**
 * Warenkorbseite messen, und genau deren Bedienelemente (Mengenfeld,
 * Entfernen) entstehen erst mit Inhalt. Über HTTP haben Rahmen und
 * eingebettete Seite denselben Ursprung; der Rahmen kann den Korb füllen,
 * bevor er misst.
 *
 * Nebeneffekt, der wichtiger ist als der Anlass: Die Probe misst damit die
 * Seite so, wie sie später ausgeliefert wird — über HTTP, nicht als Datei.
 *
 * Ohne Fremdpakete, wie alles hier. Er kann genau eine Sache: Dateien aus
 * `ausgabe/site/` ausliefern und unter `/__rahmen` die Messseite erzeugen.
 */
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * @param {string} kennung  die zu messende Seite
 * @param {object[]|null} korb  Warenkorb, vor dem Laden abgelegt
 * @param {string|null} imRahmen  JS, das **im Rahmen** läuft, bevor gemessen
 *   wird. Für Bedienelemente, die erst nach einer Eingabe entstehen: Der
 *   Anfragetext auf der Kasse steht erst da, wenn ein Bezirk gewählt ist.
 *   Ohne diesen Haken misst der Rahmen die Seite vor der Eingabe — und
 *   bescheinigt einem Textfeld, dass es passt, das es gar nicht gab.
 */
function rahmenSeite(kennung, korb, imRahmen = null) {
  const vorbereitung = korb
    ? `try { localStorage.setItem(${JSON.stringify(KORBSCHLUESSEL)}, ${JSON.stringify(JSON.stringify(korb))}); } catch (e) {}`
    : 'try { localStorage.clear(); } catch (e) {}';
  return `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0}iframe{width:390px;height:2600px;border:0;display:block}</style>
<script>${vorbereitung}</script>
<iframe id="f" src="/${kennung}.html"></iframe>
<script>
setTimeout(function () {
  var f = document.getElementById('f'), aus;
  try {
    var d = f.contentDocument, w = f.contentWindow;
    ${imRahmen ? `(function () { ${imRahmen} })();` : ''}
    w.scrollTo(9999, 0);
    var h1 = d.querySelector('h1');
    // Zweite Messung im selben Rahmen: Wie groß sind die Bedienelemente?
    // Fließtextverweise sind ausgenommen — sie stehen im Satz, und WCAG
    // 2.5.8 nimmt sie ausdrücklich aus. Geprüft wird, was ein Knopf ist.
    var klein = [];
    // textarea steht mit in der Liste: Der Anfragetext auf der Kasse ist
    // ein Bedienelement wie jedes andere und muss daumengroß sein.
    d.querySelectorAll('.kopfleiste nav a,.korb,.knopf,.kz-weg,#suchfeld,button,select,textarea,'
      + 'input[type=number],input[type=search]').forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.width && r.height && r.height < 44) {
        klein.push(n.tagName + '.' + String(n.className || '').slice(0, 14)
          + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    });
    aus = 'scrollX=' + Math.round(w.scrollX) + ' breite=' + d.documentElement.scrollWidth
        + '/' + d.documentElement.clientWidth + ' zuklein=' + klein.length
        + (klein.length ? ' [' + klein.slice(0, 6).join(', ') + ']' : '')
        // Gezählt wird, was **im Inhaltsbereich** steht, nicht auf der ganzen
        // Seite. Der erste Wurf zählte alles — und die Kopfleiste allein
        // bringt neun Bedienelemente mit. Damit bestand auch ein leerer
        // Warenkorb die Prüfung „mindestens sechs", und die Zusicherung war
        // hohl. Dieselbe Falle wie überall heute: eine Zahl, die immer
        // stimmt, prüft nichts.
        + ' imZiel=' + [].filter.call(
            d.querySelectorAll('.knopf,.kz-weg,.kz-menge,button,select,textarea,input[type=number]'),
            function (n) { return !n.closest('.kopfleiste'); }
          ).length
        + ' h1=' + (h1 ? h1.textContent.trim().slice(0, 40) : 'KEINE');
  } catch (e) { aus = 'ZUGRIFF ' + e.message; }
  var o = document.createElement('div');
  o.textContent = '${ANFANG.slice(0, 5)}' + '${ANFANG.slice(5)}' + aus + '${ENDE.slice(0, 5)}' + '${ENDE.slice(5)}';
  document.documentElement.append(o);
}, 1400);
</script>`;
}

function starteServer() {
  return new Promise((fertig, schiefgegangen) => {
    const server = createServer((anfrage, antwort) => {
      try {
        const url = new URL(anfrage.url, 'http://127.0.0.1');
        if (url.pathname === '/__rahmen') {
          const korb = url.searchParams.get('korb');
          antwort.writeHead(200, { 'content-type': TYPEN['.html'] });
          antwort.end(rahmenSeite(url.searchParams.get('ziel') ?? 'index', korb ? JSON.parse(korb) : null,
            url.searchParams.get('imrahmen')));
          return;
        }
        // Kein Pfad darf aus dem Ausgabeordner herausführen.
        const ziel = join(siteOrdner, url.pathname.replace(/^\/+/, ''));
        if (!ziel.startsWith(siteOrdner) || !existsSync(ziel)) {
          antwort.writeHead(404).end('nicht gefunden');
          return;
        }
        antwort.writeHead(200, { 'content-type': TYPEN[extname(ziel)] ?? 'application/octet-stream' });
        antwort.end(readFileSync(ziel));
      } catch (fehler) {
        antwort.writeHead(500).end(String(fehler.message));
      }
    });
    server.on('error', schiefgegangen);
    server.listen(0, '127.0.0.1', () => fertig(server));
  });
}

const chromium = findeChromium();
if (!chromium) {
  console.error('Kein Chromium gefunden (PLAYWRIGHT_BROWSERS_PATH oder /opt/pw-browsers).');
  console.error('Die Shopprobe ist damit NICHT gelaufen.');
  process.exit(2);
}
if (!existsSync(shopDatei) || !existsSync(siteOrdner)) {
  console.error('ausgabe/website.html oder ausgabe/site/ fehlt — zuerst npm run website.');
  process.exit(2);
}

const fuehreAus = promisify(execFile);

/**
 * Flaggen und Umgebung für jeden Chromium-Start.
 *
 * **Warum der Ausgangsproxy abgeschaltet wird — und was das berichtigt.**
 * Die Seiten binden Schriften von `fonts.googleapis.com` ein. In dieser
 * Umgebung läuft jeder ausgehende Aufruf über einen Proxy, und dieser
 * Aufruf **hängt** dort, statt zu scheitern. Ein hängendes Stylesheet im
 * Kopf hält den Parser an: Das nachfolgende `<script src="shop.js">` wird
 * nicht mehr geparst, `document.readyState` bleibt auf „loading", und die
 * Seite hat kein Skript.
 *
 * Genau das hat am 27. August zu einer falschen Schlussfolgerung geführt,
 * die hier bis zum 28. als gemessene Tatsache stand:
 *
 * > **Widerrufen:** „In diesem Headless-Chromium führt ein eingebettetes
 * > Dokument seine Skripte nicht aus." Das stimmt nicht. Der Rahmen führt
 * > sie aus, sobald der Proxy aus dem Weg ist — nachgewiesen mit demselben
 * > Aufbau, einmal mit und einmal ohne Proxyvariablen: `shop=undefined,
 * > ready=loading` gegen `shop=object, ready=complete`.
 *
 * Die Beobachtung war richtig, die Ursache falsch zugeordnet: nicht der
 * Rahmen, sondern das hängende Stylesheet. Zwei Szenarien — Warenkorb und
 * Kasse im 390-px-Rahmen — waren deshalb aus einem falschen Grund entfernt
 * worden und sind wieder da.
 *
 * **Was die Probe damit nicht misst:** die Webschrift. Sie lädt hier ohnehin
 * nie; jetzt scheitert sie sofort statt langsam. Gemessen wird der Umbruch
 * mit den Ersatzschriften der Maschine. Ein Umbruchfehler, der erst mit
 * „Barlow Condensed" entsteht, fällt hier nicht auf — das ist die Grenze
 * dieser Probe und kein Nebensatz.
 */
const GRUNDFLAGGEN = Object.freeze([
  '--no-sandbox', '--headless', '--disable-gpu',
  // Kein Weg nach außen: Was die Seite an fremden Adressen einbindet, soll
  // sofort scheitern statt zu hängen. Der eigene Dateiserver läuft auf
  // 127.0.0.1 und ist ausgenommen.
  '--proxy-server=127.0.0.1:9', '--proxy-bypass-list=127.0.0.1',
]);
const OHNE_PROXY = Object.freeze({
  ...process.env,
  HTTPS_PROXY: '', HTTP_PROXY: '', https_proxy: '', http_proxy: '',
  NO_PROXY: '*', no_proxy: '*',
});
const START = { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: 90_000, env: OHNE_PROXY };

/**
 * Die Szenarien laufen **nebeneinander**.
 *
 * Ein Chromium-Start mit dieser Seite kostet rund dreizehn Sekunden — fast
 * alles davon Start und Parsen der 1,1 MB, nicht das Szenario selbst. Nach-
 * einander wären zwölf Szenarien knapp drei Minuten; nebeneinander sind es
 * gut zwanzig Sekunden. Die Grenze hält die Maschine bei Verstand.
 */
const GLEICHZEITIG = 6;

const seite = readFileSync(shopDatei, 'utf8');
const ablage = mkdtempSync(join(tmpdir(), 'shopprobe-'));
let fehlgeschlagen = 0;

async function laufe(s, i) {
  const sonde = `
<script type="module">
(async () => {
  ${GEHEZU}
  let out = '';
  try {
    ${s.aktionen}
  } catch (fehler) {
    out = '[[SONDE GESTOLPERT: ' + fehler.message + ']]';
  }
  const beweis = document.createElement('div');
  beweis.textContent = '${ANFANG.slice(0, 5)}' + '${ANFANG.slice(5)}' + out + '${ENDE.slice(0, 5)}' + '${ENDE.slice(5)}';
  document.documentElement.append(beweis);
})();
</script>`;
  const variante = join(ablage, `szenario-${i}.html`);
  writeFileSync(variante, seite + sonde);

  let dom = '';
  let fehler = null;
  try {
    const { stdout } = await fuehreAus(chromium, [
      ...GRUNDFLAGGEN, '--virtual-time-budget=2500', '--dump-dom', pathToFileURL(variante).href,
    ], START);
    dom = stdout ?? '';
  } catch (e) {
    fehler = e;
    dom = e.stdout ?? '';
  }

  const von = dom.indexOf(ANFANG);
  const bis = dom.indexOf(ENDE, von);
  const gerendert = von >= 0 && bis > von ? dom.slice(von + ANFANG.length, bis) : null;

  const probleme = [];
  if (fehler && gerendert === null) probleme.push(`Browser gescheitert: ${String(fehler.message).slice(0, 200)}`);
  if (gerendert === null) probleme.push('die Sonde ist nicht gelaufen — kein Marker in der Seite');
  else if (gerendert.includes('[[SONDE GESTOLPERT')) probleme.push(gerendert);
  else {
    for (const text of s.erwartet ?? []) {
      if (!gerendert.includes(text)) probleme.push(`fehlt im gerenderten Ergebnis: „${text}"`);
    }
    for (const text of s.verboten ?? []) {
      if (gerendert.includes(text)) probleme.push(`steht fälschlich im Ergebnis: „${text}"`);
    }
  }
  return { s, probleme, gerendert };
}

/** Misst eine Seite in einem 390-px-Rahmen. */
async function laufeRahmen(r, i, adresse) {
  const url = new URL('/__rahmen', adresse);
  url.searchParams.set('ziel', r.kennung);
  if (r.korb) url.searchParams.set('korb', JSON.stringify(r.korb));
  if (r.imRahmen) url.searchParams.set('imrahmen', r.imRahmen);

  let dom = '';
  try {
    const { stdout } = await fuehreAus(chromium, [
      ...GRUNDFLAGGEN, '--virtual-time-budget=5000', '--dump-dom', url.href,
    ], START);
    dom = stdout ?? '';
  } catch (e) { dom = e.stdout ?? ''; }

  const von = dom.indexOf(ANFANG);
  const bis = dom.indexOf(ENDE, von);
  const gerendert = von >= 0 && bis > von ? dom.slice(von + ANFANG.length, bis) : null;

  const probleme = [];
  if (gerendert === null) probleme.push('die Messung ist nicht gelaufen — kein Marker in der Seite');
  else if (gerendert.startsWith('ZUGRIFF')) probleme.push(gerendert);
  else {
    if (/h1=KEINE/.test(gerendert)) probleme.push(`die Seite war leer: ${gerendert}`);
    else {
      if (!/scrollX=0\b/.test(gerendert)) probleme.push(`die Seite scrollt seitwärts: ${gerendert}`);
      if (!/zuklein=0\b/.test(gerendert)) {
        probleme.push(`Bedienelemente unter 44 px hoch: ${gerendert.replace(/^.*zuklein=/, 'zuklein=')}`);
      }
      // Ohne diese Zusicherung besteht eine Seite ohne jedes Bedienelement
      // die Größenprüfung mühelos — null zu kleine von null.
      if (r.mindestens) {
        const gefunden = Number((gerendert.match(/imZiel=(\d+)/) ?? [])[1] ?? 0);
        if (gefunden < r.mindestens) {
          probleme.push(`nur ${gefunden} Bedienelemente gefunden, erwartet mindestens `
            + `${r.mindestens} — die Seite war vermutlich leer: ${gerendert}`);
        }
      }
    }
  }
  return { s: r, probleme, gerendert };
}

try {
  const ergebnisse = [];
  for (let start = 0; start < SZENARIEN.length; start += GLEICHZEITIG) {
    const teil = SZENARIEN.slice(start, start + GLEICHZEITIG);
    ergebnisse.push(...await Promise.all(teil.map((s, k) => laufe(s, start + k))));
  }
  const server = await starteServer();
  const adresse = `http://127.0.0.1:${server.address().port}`;
  try {
    for (let start = 0; start < RAHMENSZENARIEN.length; start += GLEICHZEITIG) {
      const teil = RAHMENSZENARIEN.slice(start, start + GLEICHZEITIG);
      ergebnisse.push(...await Promise.all(teil.map((r, k) => laufeRahmen(r, start + k, adresse))));
    }
  } finally {
    server.close();
  }

  for (const { s, probleme, gerendert } of ergebnisse) {
    if (probleme.length) {
      fehlgeschlagen++;
      console.log(`✗ ${s.name}`);
      for (const p of probleme) console.log(`    ${p}`);
      if (gerendert !== null) console.log(`    gerendert war: ${gerendert.slice(0, 320).replace(/\s+/g, ' ')}`);
    } else {
      console.log(`✓ ${s.name}`);
    }
  }
} finally {
  rmSync(ablage, { recursive: true, force: true });
}

console.log(`\n${SZENARIEN.length + RAHMENSZENARIEN.length} Szenarien (davon ${RAHMENSZENARIEN.length} im 390-px-Rahmen), ${fehlgeschlagen} fehlgeschlagen.`);
process.exit(fehlgeschlagen ? 1 : 0);
