/**
 * Was nach dem Hochladen im Browser nachzusehen ist.
 *
 * **Der Anlass, 6. September 2026.** Der Rolloutplan führt fünfzehn Etappen.
 * Eine davon heißt „ausgabe/site/ auf bauversand.com hochladen", die nächste
 * „Search Console einrichten und die Indexierung bestätigen". Dazwischen
 * fehlt der Schritt, der beantwortet, ob die Auslieferung überhaupt stimmt.
 *
 * > **Der Plan prüft, ob Google die Seite findet — und nicht, ob der Server
 * > sie richtig herausgibt.**
 *
 * Das ist keine theoretische Lücke. Seit dem 6. September hängt die
 * Fehlerseite an einer Zeile in `.htaccess`, von der dieses Verzeichnis
 * **nicht** wissen kann, ob der Hoster sie befolgt: Der Netzausgang dieser
 * Umgebung ist für bauversand.com gesperrt — am 9. September gemessen, mit
 * derselben Antwort für die bestehende Firmenseite freudenthaler-bau.at, also
 * am Ausgang und nicht an der Adresse. Dasselbe gilt für jede andere Frage der
 * Auslieferung
 * — Erreichbarkeit, Zeichensatz, ob `shop.js` als JavaScript ankommt.
 *
 * ## Warum die Liste erzeugt wird und nicht geschrieben
 *
 * Eine abgeschriebene Prüfliste ist am Tag nach dem nächsten Bau falsch —
 * dieselbe Sorte Fehler wie das Prüferregister vom 4. September und die
 * Kopfzahl in `STATUS.md` vom 5. Jeder Punkt hier wird deshalb **aus dem
 * gebauten Erzeugnis abgeleitet**: die Zahl der Adressen aus der Sitemap, der
 * Pfad der Fehlerseite aus der `.htaccess`, die erwartete Zeile aus der Datei
 * selbst.
 *
 * ## Was hier lokal geprüft wird — und was gerade nicht
 *
 * Jeder Punkt nennt eine Datei im Ausgabeordner und einen Text, der darin
 * steht. **Beides ist hier nachmessbar**, und ein Testfall tut das. Nicht
 * nachmessbar ist die eine Frage, um die es geht: ob der Server dieselbe Datei
 * unter dieser Adresse herausgibt.
 *
 * > **Was übrig bleibt, ist genau die Liste dessen, was hier nicht geht.**
 */

/** Der Pfad, den es nicht geben darf — er löst die Fehlerseite aus. */
export const FEHLERPROBE = 'gibt-es-nicht-abnahme.html';

/**
 * Baut die Abnahmeliste aus dem gebauten Erzeugnis.
 *
 * @param {object} eingabe
 * @param {Record<string, string>} eingabe.ausgabe  Pfad (relativ zu `site/`) → Inhalt
 * @param {string} eingabe.marke
 */
export function abnahmeplan({ ausgabe, marke }) {
  const punkte = [];
  const nimm = (p) => ausgabe[p];

  if (nimm('index.html') !== undefined) {
    punkte.push({
      id: 'startseite',
      pfad: '/',
      datei: 'index.html',
      erwartet: marke,
      warum: 'Kommt hier die Seite des Hosters oder ein Verzeichnislisting, ist gar nichts '
        + 'ausgeliefert — und jede weitere Messung misst die falsche Seite.',
    });
  }

  const htaccess = nimm('.htaccess');
  const fehlerpfad = htaccess ? (htaccess.match(/^ErrorDocument\s+404\s+(\S+)$/m) ?? [])[1] : undefined;
  const fehlerdatei = fehlerpfad ? fehlerpfad.replace(/^\//, '') : undefined;
  if (fehlerdatei && nimm(fehlerdatei) !== undefined) {
    punkte.push({
      id: 'fehlerseite',
      pfad: `/${FEHLERPROBE}`,
      datei: fehlerdatei,
      erwartet: 'Diese Seite gibt es nicht',
      warum: 'Befolgt der Server die Zeile `ErrorDocument` nicht, kommt seine eigene '
        + 'Fehlerseite — ohne Marke, ohne Kopfleiste, ohne Weg ins Sortiment. Der Klick ist '
        + 'dann bezahlt und verloren.',
    });
    punkte.push({
      id: 'fehlerseite-tief',
      pfad: `/artikel/${FEHLERPROBE}`,
      datei: fehlerdatei,
      erwartet: 'href="/index.html"',
      warum: 'Dieselbe Seite, eine Ebene tiefer aufgerufen. Ihre Verweise gehen ab der Wurzel; '
        + 'stünden sie relativ, zeigten sie von hier aus ins Leere.',
    });
  }

  const robots = nimm('robots.txt');
  if (robots !== undefined) {
    punkte.push({
      id: 'robots',
      pfad: '/robots.txt',
      datei: 'robots.txt',
      erwartet: (robots.match(/^Sitemap:.*$/m) ?? ['Sitemap:'])[0],
      warum: 'Kommt hier eine 404 oder HTML statt Text, liest keine Suchmaschine die Sitemap — '
        + 'und der Klickversuch misst später Auffindbarkeit und Kaufquote in einem.',
    });
  }

  const sitemap = nimm('sitemap.xml');
  if (sitemap !== undefined) {
    const adressen = (sitemap.match(/<loc>/g) ?? []).length;
    punkte.push({
      id: 'sitemap',
      pfad: '/sitemap.xml',
      datei: 'sitemap.xml',
      erwartet: '<urlset',
      warum: `Muss als XML ankommen und ${adressen} Adressen führen. Wird sie als Text oder `
        + 'als Download ausgeliefert, nimmt die Search Console sie nicht an.',
    });
  }

  if (nimm('shop.js') !== undefined) {
    punkte.push({
      id: 'skript',
      pfad: '/shop.js',
      datei: 'shop.js',
      erwartet: 'window.__SHOP__',
      warum: 'Ohne dieses Skript sind Suche, Warenkorb und Kasse tot. Es muss als JavaScript '
        + 'ankommen, nicht als Text zum Herunterladen.',
    });
  }

  if (nimm('llms.txt') !== undefined) {
    punkte.push({
      id: 'llms',
      pfad: '/llms.txt',
      datei: 'llms.txt',
      erwartet: 'Liefergebiet',
      warum: 'Die Datei, für die dieser Shop überhaupt so geschrieben ist. Ist sie nicht '
        + 'erreichbar, liest kein Assistent sie.',
    });
  }

  const artikel = Object.keys(ausgabe).find((p) => p.startsWith('artikel/') && p.endsWith('.html'));
  if (artikel) {
    punkte.push({
      id: 'tiefe-seite',
      pfad: `/${artikel}`,
      datei: artikel,
      erwartet: '../shop.js',
      warum: 'Eine Seite aus einem Unterordner. Ihre Verweise gehen eine Ebene hoch — bricht '
        + 'das, ist der halbe Shop ohne Suche und ohne Warenkorb.',
    });
  }

  return punkte;
}

/**
 * Der Befund über eine Abnahmeliste: Steht jeder erwartete Text wirklich in
 * der Datei, die dort ankommen soll?
 *
 * Das ist die Hälfte, die sich hier prüfen lässt. Sie sagt nichts über den
 * Server — sie sagt, dass die Liste nicht nach etwas fragt, was es gar nicht
 * gibt.
 */
export function abnahmebefund({ punkte, ausgabe, mindestens = 5 }) {
  const meldungen = [];
  for (const p of punkte) {
    const inhalt = ausgabe[p.datei];
    if (inhalt === undefined) {
      meldungen.push({ regel: 'datei-fehlt', text: `${p.id}: ${p.datei} liegt nicht im Ausgabeordner` });
      continue;
    }
    if (!inhalt.includes(p.erwartet)) {
      meldungen.push({
        regel: 'erwartung-steht-nicht-drin',
        text: `${p.id}: „${p.erwartet.slice(0, 60)}" steht nicht in ${p.datei}`,
      });
    }
  }
  // **Der Pfad der Fehlerprobe darf es nicht geben.** Sonst prüft sie nichts.
  if (ausgabe[FEHLERPROBE] !== undefined) {
    meldungen.push({
      regel: 'fehlerprobe-gibt-es',
      text: `${FEHLERPROBE} liegt im Ausgabeordner — dann löst sie keine Fehlerseite aus`,
    });
  }
  if (punkte.length < mindestens) {
    meldungen.push({
      regel: 'zu-wenig-punkte',
      text: `nur ${punkte.length} Punkte, erwartet mindestens ${mindestens}`,
    });
  }
  return { punkte: punkte.length, meldungen, sauber: meldungen.length === 0 };
}
