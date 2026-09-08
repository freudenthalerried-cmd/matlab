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
