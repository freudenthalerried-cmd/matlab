/**
 * Ein Paket aus dem gebauten Ordner — ohne fremde Bibliothek.
 *
 * **Der Anlass, 8. September 2026.** Der oberste offene Punkt der
 * Bereitschaftsliste lautet seit Wochen: *„`ausgabe/site/` auf bauversand.com
 * hochladen — ohne erreichbare Seite kein Klick, keine Auffindbarkeit, keine
 * Anfrage."* Der Netzausgang dieser Umgebung ist gesperrt; hochladen kann nur
 * der Auftraggeber.
 *
 * Was er dafür bekam, waren **87 Dateien in fünf Ordnern** und der Satz „lade
 * das hoch". Das ist kein Arbeitsauftrag, sondern eine Zumutung: Wer per FTP
 * hantiert, vergisst einen Unterordner, und die Hälfte des Shops liegt dann
 * ohne Suche da.
 *
 * > **Ein Ergebnis, das nur als Ordnerbaum vorliegt, ist noch nicht übergeben.**
 *
 * Dieses Modul schreibt ein ZIP-Archiv **ohne Kompression** (Methode 0,
 * „stored") und ohne Abhängigkeit. Das Format ist alt und schlicht: je Datei
 * ein lokaler Kopf, am Ende ein Verzeichnis und ein Schlussblock. Gepackt wird
 * nicht — der Ordner ist 3,5 MB, und ein Archiv, das jedes Programm öffnet,
 * ist mehr wert als eines, das kleiner ist.
 */

/** Kreuzprüfsumme nach ISO 3309, wie das ZIP-Format sie verlangt. */
const TABELLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

export function crc32(daten) {
  let c = 0xffffffff;
  for (let i = 0; i < daten.length; i += 1) c = TABELLE[(c ^ daten[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * MS-DOS-Zeit, wie das Format sie seit 1980 will: Sekunden in Zweierschritten,
 * Jahr als Abstand zu 1980.
 */
export function dosZeit(datum) {
  const jahr = Math.max(1980, datum.getFullYear());
  const zeit = (datum.getHours() << 11) | (datum.getMinutes() << 5) | (datum.getSeconds() >> 1);
  const tag = ((jahr - 1980) << 9) | ((datum.getMonth() + 1) << 5) | datum.getDate();
  return { zeit, tag };
}

/**
 * Baut ein ZIP-Archiv aus einer Liste von Einträgen.
 *
 * @param {{name: string, inhalt: Buffer|Uint8Array}[]} eintraege
 * @param {Date} [stand] Zeitstempel für alle Einträge
 * @returns {Buffer}
 */
export function baueZip(eintraege, stand = new Date()) {
  const { zeit, tag } = dosZeit(stand);

  /*
   * **Ein Name, der aus dem Ziel hinausführt, ist keiner.**
   *
   * Das ZIP-Format speichert Pfade als Text, und die meisten Auspackprogramme
   * folgen ihm: Ein Eintrag `../../etc/etwas` landet dann außerhalb des
   * Ordners, in den ausgepackt wurde. Dieses Archiv geht an den Auftraggeber
   * und wird in ein **Webverzeichnis** ausgepackt — die eine Stelle, an der
   * das teuer wäre. Die Namen kommen zwar aus dem eigenen Bau; genau deshalb
   * ist die Sperre billig und die Ausnahme teuer.
   */
  for (const e of eintraege) {
    const name = String(e.name ?? '');
    if (!name) throw new Error('Archiveintrag ohne Namen');
    if (name.startsWith('/') || /^[A-Za-z]:/.test(name)) {
      throw new Error(`Archiveintrag mit absolutem Pfad: ${name}`);
    }
    if (name.split('/').includes('..')) {
      throw new Error(`Archiveintrag führt aus dem Ziel hinaus: ${name}`);
    }
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\\]/.test(name)) {
      throw new Error(`Archiveintrag mit Steuerzeichen im Namen: ${JSON.stringify(name)}`);
    }
  }
  const teile = [];
  const verzeichnis = [];
  let versatz = 0;

  for (const e of eintraege) {
    const name = Buffer.from(e.name, 'utf8');
    const inhalt = Buffer.from(e.inhalt);
    const summe = crc32(inhalt);

    const kopf = Buffer.alloc(30);
    kopf.writeUInt32LE(0x04034b50, 0);
    kopf.writeUInt16LE(20, 4); // Mindestversion 2.0
    kopf.writeUInt16LE(0x0800, 6); // Namen sind UTF-8
    kopf.writeUInt16LE(0, 8); // Methode 0: ungepackt
    kopf.writeUInt16LE(zeit, 10);
    kopf.writeUInt16LE(tag, 12);
    kopf.writeUInt32LE(summe, 14);
    kopf.writeUInt32LE(inhalt.length, 18);
    kopf.writeUInt32LE(inhalt.length, 22);
    kopf.writeUInt16LE(name.length, 26);
    kopf.writeUInt16LE(0, 28);

    const eintrag = Buffer.alloc(46);
    eintrag.writeUInt32LE(0x02014b50, 0);
    eintrag.writeUInt16LE(20, 4); // erzeugt mit 2.0
    eintrag.writeUInt16LE(20, 6);
    eintrag.writeUInt16LE(0x0800, 8);
    eintrag.writeUInt16LE(0, 10);
    eintrag.writeUInt16LE(zeit, 12);
    eintrag.writeUInt16LE(tag, 14);
    eintrag.writeUInt32LE(summe, 16);
    eintrag.writeUInt32LE(inhalt.length, 20);
    eintrag.writeUInt32LE(inhalt.length, 24);
    eintrag.writeUInt16LE(name.length, 28);
    eintrag.writeUInt32LE(versatz, 42);

    teile.push(kopf, name, inhalt);
    verzeichnis.push(eintrag, name);
    versatz += kopf.length + name.length + inhalt.length;
  }

  const verzeichnisTeile = Buffer.concat(verzeichnis);
  const schluss = Buffer.alloc(22);
  schluss.writeUInt32LE(0x06054b50, 0);
  schluss.writeUInt16LE(eintraege.length, 8);
  schluss.writeUInt16LE(eintraege.length, 10);
  schluss.writeUInt32LE(verzeichnisTeile.length, 12);
  schluss.writeUInt32LE(versatz, 16);

  return Buffer.concat([...teile, verzeichnisTeile, schluss]);
}

/* ------------------------------------------------------------------ *
 * Was im Archiv steht, gegen das, was gebaut wurde — 11. September 2026
 *
 * **Der Anlass.** `test/paket.test.js` hält seit dem 8. September ein
 * **selbstgebautes Archiv aus zwei Einträgen** gegen `unzip -t`. Das ist die
 * richtige Richtung und die falsche Größe: Das Archiv, das der Auftraggeber
 * bekommt, trägt 89 Einträge, 3,35 MB, Umlaute in Pfaden und fünf
 * Ordnerebenen. Ein handgeschriebenes ZIP kann bei zwei kleinen Einträgen
 * tragen und bei 89 brechen — an Versätzen, am Zentralverzeichnis, an der
 * Reihenfolge.
 *
 * > **Das Paket ist das letzte Glied: Alles, was hier gebaut wird, erreicht
 * > die Welt durch diese eine Datei.**
 *
 * Die Funktionen hier vergleichen, was beim Auspacken herauskommt, mit dem,
 * was gebaut wurde — **in beide Richtungen**. Eine Datei zu wenig ist ein
 * halber Shop; eine zu viel ist etwas, das niemand geprüft hat.
 * ------------------------------------------------------------------ */

/**
 * Hält zwei Dateibestände gegeneinander: Namen und Inhalt.
 *
 * @param {Map<string, Buffer|Uint8Array>} imArchiv  ausgepackt
 * @param {Map<string, Buffer|Uint8Array>} imBau     gebaut
 */
export function archivbefund(imArchiv, imBau) {
  const meldungen = [];
  const melde = (regel, wo, text) => meldungen.push({ regel, wo, text });
  const gleich = (a, b) => a.length === b.length && Buffer.from(a).equals(Buffer.from(b));

  for (const [name, inhalt] of imBau) {
    if (!imArchiv.has(name)) {
      melde('fehlt-im-archiv', name,
        `${name} ist gebaut und liegt nicht im Archiv — hochgeladen wäre der Shop unvollständig`);
      continue;
    }
    if (!gleich(imArchiv.get(name), inhalt)) {
      melde('inhalt-weicht-ab', name,
        `${name} liegt im Archiv mit anderem Inhalt als im Bau `
        + `(${imArchiv.get(name).length} statt ${inhalt.length} Bytes)`);
    }
  }
  for (const name of imArchiv.keys()) {
    if (!imBau.has(name)) {
      melde('nicht-gebaut', name,
        `${name} liegt im Archiv und wurde nicht gebaut — niemand hat es geprüft`);
    }
  }
  return { geprueft: imBau.size, meldungen, sauber: meldungen.length === 0 };
}

/** Eine Zeile des Inhaltsverzeichnisses: Prüfsumme, Größe, Pfad. */
const VERZEICHNISZEILE = /^([0-9a-f]{64})\s+(\d+)\s+(.+)$/;

/**
 * Hält das mitgelieferte Inhaltsverzeichnis gegen die ausgepackten Dateien.
 *
 * Auch das in beide Richtungen: Ein Verzeichnis, das eine Datei nicht nennt,
 * ist so wertlos wie eines, das eine nennt, die es nicht gibt. Wer eine
 * Prüfsumme nachrechnen will, muss sich auf beides verlassen können.
 *
 * @param {string} text  Inhalt von INHALT.txt
 * @param {Map<string, string>} summen  Pfad → SHA-256 der ausgepackten Datei
 * @param {Map<string, number>} groessen  Pfad → Bytes
 */
export function inhaltsbefund(text, summen, groessen) {
  const meldungen = [];
  const melde = (regel, wo, t) => meldungen.push({ regel, wo, text: t });
  const genannt = new Set();
  let zeilen = 0;

  for (const zeile of String(text).split('\n')) {
    const t = VERZEICHNISZEILE.exec(zeile.trimEnd());
    if (!t) continue;
    zeilen += 1;
    const [, summe, groesse, pfad] = t;
    genannt.add(pfad);
    if (!summen.has(pfad)) {
      melde('zeile-ohne-datei', pfad,
        `das Inhaltsverzeichnis nennt ${pfad}, im Archiv liegt die Datei nicht`);
      continue;
    }
    if (summen.get(pfad) !== summe) {
      melde('summe-weicht-ab', pfad, `${pfad}: die Prüfsumme im Verzeichnis stimmt nicht`);
    }
    if (groessen.get(pfad) !== Number(groesse)) {
      melde('groesse-weicht-ab', pfad,
        `${pfad}: das Verzeichnis nennt ${groesse} Bytes, die Datei hat ${groessen.get(pfad)}`);
    }
  }
  for (const pfad of summen.keys()) {
    if (!genannt.has(pfad)) {
      melde('datei-ohne-zeile', pfad,
        `${pfad} liegt im Archiv und steht in keiner Zeile des Inhaltsverzeichnisses`);
    }
  }
  if (!zeilen) {
    melde('kein-verzeichnis', 'INHALT.txt',
      'keine einzige lesbare Zeile im Inhaltsverzeichnis — dann prüft dieser Abgleich nichts');
  }
  return { zeilen, meldungen, sauber: meldungen.length === 0 };
}
