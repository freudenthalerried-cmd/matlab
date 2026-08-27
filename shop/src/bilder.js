/**
 * Schemazeichnungen für die Artikel — gezeichnet, nicht beschafft.
 *
 * Der Auftraggeber hat mehr Bilder verlangt. Der naheliegende Weg wäre,
 * Herstellerfotos zu holen; er ist aus zwei Gründen versperrt, und der
 * zweite wiegt schwerer als der erste:
 *
 * 1. `baumit.at`, `schiedel.at`, `isover.at` und `synthesa.at` sind vom
 *    Netzausgang dieser Umgebung gesperrt.
 * 2. **Ein Herstellerfoto ist ein fremdes Werk.** Es ohne Lizenz in einen
 *    Shop zu stellen, ist dieselbe Verletzung wie ein abgeschriebenes
 *    Datenblatt — dieselbe Regel, die `fremdtext-ein-und-ausgaenge.md`
 *    für Text festhält, gilt für Bilder.
 *
 * Deshalb zeichnet der Shop selbst. Jede Zeichnung entsteht **aus den
 * Daten des Artikels**: Warengruppe, Einheit und die Maße, die in der
 * Bezeichnung stehen. Eine 5-cm-Platte wird dicker gezeichnet als eine
 * 2-cm-Platte, ein 30°-Bogen flacher als ein 45°-Bogen.
 *
 * > **Ein Schema ist ehrlicher als ein Foto, das nicht diesen Artikel
 * > zeigt.** Es behauptet keine Oberfläche, keine Farbe und keine Marke —
 * > es zeigt die Bauform und das Maß, und beides steht im Datensatz.
 *
 * Die Zeichnungen sind reines SVG, ohne Fremdmittel, und nehmen ihre
 * Farben aus den Tokens der Seite. Damit tragen sie den hellen und den
 * dunklen Anstrich mit, ohne dass eine zweite Fassung nötig wäre.
 */

const RAHMEN = 'stroke="var(--linie-stark)" fill="var(--flaeche-2)" stroke-width="1.5"';
const KANTE = 'stroke="var(--linie-stark)" fill="none" stroke-width="1.5"';
const AKZENT = 'stroke="var(--ocker)" fill="none" stroke-width="1.5"';
const SCHRIFT = 'fill="var(--gedaempft)" font-family="var(--zahl), monospace" font-size="9"';

/** Die erste Zahl mit Einheit, die zu einem Maß passt. */
function mass(text, muster) {
  const t = String(text ?? '');
  const m = t.match(muster);
  return m ? m[0].replace(/\s+/g, ' ').trim() : null;
}

/** Plattendicke in Millimetern — für die gezeichnete Stärke. */
export function dickeMm(bezeichnung) {
  const t = String(bezeichnung ?? '');
  const mm = t.match(/(\d{1,3})\s*mm(?![\p{L}])/u);
  if (mm) return Number(mm[1]);
  const cm = t.match(/(\d{1,2})\s*cm(?![\p{L}])/u);
  if (cm) return Number(cm[1]) * 10;
  return null;
}

/** Der Winkel eines Formteils. */
export function gradzahl(bezeichnung) {
  const m = String(bezeichnung ?? '').match(/(\d{2,3})\s*grad/i);
  return m ? Number(m[1]) : null;
}

/**
 * Welche Bauform gezeichnet wird.
 *
 * Die Reihenfolge ist Absicht: Das Besondere vor dem Allgemeinen. „PVC
 * Kanalbogen NW 100 45 grad" ist ein Bogen und erst danach ein Rohr.
 */
export function bauform(artikel) {
  const b = String(artikel?.bezeichnung ?? '');
  const g = String(artikel?.gruppe ?? '');
  const e = String(artikel?.einheit ?? '');
  const hat = (re) => re.test(b);

  if (hat(/abzweig/i)) return 'abzweig';
  if (hat(/bogen/i)) return 'bogen';
  if (hat(/schachtring|ring\b/i)) return 'ring';
  if (hat(/rohr/i)) return 'rohr';
  if (hat(/dübel|duebel|rondelle|schraube/i)) return 'duebel';
  if (hat(/kantenschutz|anschlussleiste|leiste|profil/i)) return 'leiste';
  if (hat(/gewebe|gitter|folie|band|grundmauerschutz/i) || e === 'RLL') return 'rolle';
  if (hat(/pistole/i)) return 'werkzeug';
  if (e === 'DOS' || hat(/schaum|kleber\s+b3|750\s*ml/i)) return 'dose';
  if (hat(/haube/i)) return 'haube';
  if (hat(/stein|ziegel|N\+F/i)) return 'stein';
  if (e === 'KG' || e === 'SCK' || e === 'EIM' || hat(/mörtel|putz|spachtel|masse/i)) return 'sack';
  if (g === 'Dämmung' || hat(/EPS|XPS|TDPT|dämm/i)) return 'platte';
  return 'teil';
}

/* ------------------------------------------------------------------ *
 * Die einzelnen Formen. Alle im selben Feld 120 × 90.
 * ------------------------------------------------------------------ */

const formen = {
  /** Dämmplatte in Schrägansicht; die Stärke wird maßstäblich gezeichnet. */
  platte(a) {
    const mm = dickeMm(a.bezeichnung) ?? 40;
    // 20 mm → 6 px, 100 mm → 22 px. Gedeckelt, damit die Platte Platte bleibt.
    const d = Math.max(5, Math.min(24, 4 + mm * 0.19));
    const y = 58 - d;
    return `<path d="M18 ${y} L84 ${y - 16} L104 ${y - 8} L38 ${y + 8} Z" ${RAHMEN}/>
<path d="M18 ${y} L18 ${y + d} L38 ${y + 8 + d} L38 ${y + 8} Z" ${RAHMEN}/>
<path d="M38 ${y + 8} L38 ${y + 8 + d} L104 ${y - 8 + d} L104 ${y - 8} Z" fill="var(--ocker-weich)" stroke="var(--linie-stark)" stroke-width="1.5"/>
<path d="M110 ${y - 8} L110 ${y - 8 + d}" ${AKZENT}/>
<path d="M107 ${y - 8} L113 ${y - 8} M107 ${y - 8 + d} L113 ${y - 8 + d}" ${AKZENT}/>
${beschriftung(mass(a.bezeichnung, /\d{1,3}\s*(?:mm|cm)(?![\p{L}])/u) ?? 'Platte')}`;
  },

  /** Sackware — die Silhouette, die auf jeder Palette steht. */
  sack(a) {
    return `<path d="M34 30 Q34 24 40 24 L80 24 Q86 24 86 30 L88 70 Q88 76 82 76 L38 76 Q32 76 32 70 Z" ${RAHMEN}/>
<path d="M40 24 Q60 30 80 24" ${KANTE}/>
<rect x="44" y="42" width="32" height="14" rx="2" fill="var(--ocker-weich)" stroke="var(--ocker)" stroke-width="1.2"/>
${beschriftung(mass(a.bezeichnung, /\d{1,3}\s*(?:kg|l)(?![\p{L}])/iu) ?? 'Sack')}`;
  },

  /** Rohr in Achsansicht, mit Muffe. */
  rohr(a) {
    return `<rect x="26" y="34" width="70" height="26" ${RAHMEN}/>
<ellipse cx="26" cy="47" rx="7" ry="13" ${RAHMEN}/>
<rect x="88" y="30" width="14" height="34" ${RAHMEN}/>
<ellipse cx="102" cy="47" rx="6" ry="17" ${RAHMEN}/>
<path d="M26 68 L102 68 M26 65 L26 71 M102 65 L102 71" ${AKZENT}/>
${beschriftung(mass(a.bezeichnung, /(?:NW|DN)\s*\d{2,3}/i) ?? 'Rohr')}`;
  },

  /** Bogen — der Winkel wird gezeichnet, nicht nur geschrieben. */
  bogen(a) {
    const grad = gradzahl(a.bezeichnung) ?? 45;
    const rad = (grad * Math.PI) / 180;
    const len = 42;
    const x = 40 + Math.cos(rad) * len;
    const y = 62 - Math.sin(rad) * len;
    return `<path d="M14 62 L40 62" stroke="var(--linie-stark)" stroke-width="14" fill="none" stroke-linecap="butt"/>
<path d="M40 62 L${x.toFixed(1)} ${y.toFixed(1)}" stroke="var(--linie-stark)" stroke-width="14" fill="none"/>
<path d="M14 62 L40 62 L${x.toFixed(1)} ${y.toFixed(1)}" ${AKZENT} stroke-dasharray="3 3" stroke-width="1"/>
<path d="M58 62 A18 18 0 0 0 ${(40 + Math.cos(rad) * 18).toFixed(1)} ${(62 - Math.sin(rad) * 18).toFixed(1)}" ${AKZENT}/>
${beschriftung(`${grad}°`)}`;
  },

  /** Abzweiger — Y-Stück. */
  abzweig(a) {
    return `<path d="M12 62 L100 62" stroke="var(--linie-stark)" stroke-width="14"/>
<path d="M52 62 L84 30" stroke="var(--linie-stark)" stroke-width="12"/>
<path d="M62 62 A14 14 0 0 0 ${(52 + Math.cos(Math.PI / 4) * 14).toFixed(1)} ${(62 - Math.sin(Math.PI / 4) * 14).toFixed(1)}" ${AKZENT}/>
${beschriftung(mass(a.bezeichnung, /\d{2,3}\s*grad/i)?.replace(/\s*grad/i, '°') ?? 'Abzweig')}`;
  },

  /** Schachtring — Draufsicht mit Wandstärke. */
  ring(a) {
    return `<ellipse cx="60" cy="46" rx="44" ry="26" ${RAHMEN}/>
<ellipse cx="60" cy="46" rx="34" ry="18" fill="var(--grund)" stroke="var(--linie-stark)" stroke-width="1.5"/>
<path d="M16 46 L26 46" ${AKZENT}/>
${beschriftung(schachtmass(a.bezeichnung) ?? 'Schachtring')}`;
  },

  /** Mauer- oder Mantelstein mit Nut-und-Feder-Andeutung. */
  stein(a) {
    return `<path d="M20 34 L84 22 L104 30 L40 42 Z" ${RAHMEN}/>
<path d="M20 34 L20 66 L40 74 L40 42 Z" ${RAHMEN}/>
<path d="M40 42 L40 74 L104 62 L104 30 Z" fill="var(--ziegel-weich)" stroke="var(--linie-stark)" stroke-width="1.5"/>
<path d="M52 46 L52 70 M64 44 L64 68 M76 42 L76 66 M88 40 L88 64" stroke="var(--linie-stark)" stroke-width="1" opacity=".55"/>
${beschriftung(mass(a.bezeichnung, /\d{1,3}[.,]?\d?\s*cm(?![\p{L}])/u) ?? 'Stein')}`;
  },

  /** Rolle — Gewebe, Folie, Band. */
  rolle(a) {
    return `<rect x="30" y="26" width="60" height="40" ${RAHMEN}/>
<ellipse cx="30" cy="46" rx="9" ry="20" ${RAHMEN}/>
<ellipse cx="30" cy="46" rx="3" ry="7" fill="var(--grund)" stroke="var(--linie-stark)" stroke-width="1.2"/>
<path d="M90 30 L104 36 L104 72 L90 66 Z" fill="var(--ocker-weich)" stroke="var(--ocker)" stroke-width="1.2"/>
<path d="M30 72 L90 72 M30 69 L30 75 M90 69 L90 75" ${AKZENT}/>
${beschriftung(rollenmass(a.bezeichnung) ?? 'Rollenware')}`;
  },

  /** Kantenschutz und Anschlussleiste — im Schnitt, denn dort erkennt man sie. */
  leiste(a) {
    return `<path d="M30 24 L38 24 L38 62 L96 62 L96 70 L30 70 Z" ${RAHMEN}/>
<path d="M38 62 L96 62" ${AKZENT} stroke-dasharray="4 3"/>
<path d="M96 66 L110 66" stroke="var(--ocker)" stroke-width="1.2" stroke-dasharray="2 2"/>
<path d="M22 24 L22 70 M19 24 L25 24 M19 70 L25 70" ${AKZENT}/>
${beschriftung(mass(a.bezeichnung, /\d{1,2}(?:[.,]\d)?\s*m(?![\p{L}2])/u) ?? 'Profil')}`;
  },

  /** Dübel mit Teller. */
  duebel(a) {
    return `<rect x="20" y="40" width="14" height="14" rx="2" ${RAHMEN}/>
<rect x="34" y="43" width="56" height="8" ${RAHMEN}/>
<path d="M90 47 L104 43 L104 51 Z" fill="var(--ocker-weich)" stroke="var(--ocker)" stroke-width="1.2"/>
<path d="M44 43 L44 51 M54 43 L54 51 M64 43 L64 51 M74 43 L74 51" stroke="var(--linie-stark)" stroke-width="1" opacity=".6"/>
${beschriftung(mass(a.bezeichnung, /\d{1,3}\s*mm|\d{3}\s*\d{2,3}/) ?? 'Dübel')}`;
  },

  /** Kartusche. */
  dose(a) {
    return `<rect x="42" y="30" width="36" height="46" rx="3" ${RAHMEN}/>
<rect x="52" y="18" width="16" height="12" ${RAHMEN}/>
<path d="M56 18 L56 8 L64 8 L64 18" ${KANTE}/>
<rect x="46" y="46" width="28" height="12" rx="1" fill="var(--ocker-weich)" stroke="var(--ocker)" stroke-width="1.2"/>
${beschriftung(mass(a.bezeichnung, /\d{3}\s*ml/i) ?? 'Dose')}`;
  },

  /** Regenhaube. */
  haube(a) {
    return `<path d="M26 40 L60 20 L94 40 Z" ${RAHMEN}/>
<rect x="36" y="40" width="48" height="8" ${RAHMEN}/>
<path d="M44 48 L44 74 M76 48 L76 74" ${KANTE}/>
<path d="M44 74 L76 74" ${KANTE}/>
<circle cx="60" cy="30" r="3" fill="var(--ocker)"/>
${beschriftung(mass(a.bezeichnung, /\d{3}/) ?? 'Haube')}`;
  },

  /** Werkzeug — bewusst grob, es ist Beipack. */
  werkzeug(a) {
    return `<path d="M18 40 L84 40 L84 54 L18 54 Z" ${RAHMEN}/>
<path d="M84 44 L104 44 L104 50 L84 50 Z" ${RAHMEN}/>
<path d="M40 54 L36 76 L48 76 L46 54" ${RAHMEN}/>
<path d="M58 54 L66 72" ${KANTE}/>
${beschriftung('Werkzeug')}`;
  },

  /** Alles übrige — ein Teil in Schrägansicht, ohne Behauptung. */
  teil(a) {
    return `<path d="M28 34 L80 24 L98 32 L46 42 Z" ${RAHMEN}/>
<path d="M28 34 L28 62 L46 70 L46 42 Z" ${RAHMEN}/>
<path d="M46 42 L46 70 L98 60 L98 32 Z" fill="var(--flaeche)" stroke="var(--linie-stark)" stroke-width="1.5"/>
${beschriftung(a.einheit ?? 'Stück')}`;
  },
};

/** „Schachtring 800 300 80 mm" — die erste Zahl ist der lichte Durchmesser. */
function schachtmass(bezeichnung) {
  const m = String(bezeichnung ?? '').match(/(\d{3,4})/);
  return m ? `\u2300 ${m[1]}` : null;
}

/**
 * Rollenware nennt ihr Maß in drei Schreibweisen: „1,1x50 m", „Breite
 * 110cm" oder — wie beim Grundmauerschutz — „20 1,5 m", also Länge und
 * Breite ohne Malzeichen. Die dritte war der Grund, warum auf der
 * Kanalseite nur „Rolle" stand.
 */
function rollenmass(bezeichnung) {
  const t = String(bezeichnung ?? '');
  const kreuz = t.match(/(\d{1,3}(?:[.,]\d)?)\s*(?:x|×)\s*(\d{1,3}(?:[.,]\d)?)\s*m(?![\p{L}2])/iu);
  if (kreuz) return `${kreuz[1]} × ${kreuz[2]} m`;
  const paar = t.match(/(\d{1,3}(?:[.,]\d)?)\s+(\d{1,3}(?:[.,]\d)?)\s*m(?![\p{L}2])/u);
  if (paar) return `${paar[1]} × ${paar[2]} m`;
  const breite = t.match(/(\d{2,3})\s*cm(?![\p{L}])/u);
  if (breite) return `Breite ${breite[1]} cm`;
  const flaeche = t.match(/(\d{1,3}(?:[.,]\d)?)\s*m2/u);
  return flaeche ? `${flaeche[1]} m²` : null;
}

function beschriftung(text) {
  return `<text x="60" y="86" text-anchor="middle" ${SCHRIFT}>${String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
}

/**
 * Die Zeichnung zu einem Artikel.
 *
 * `rolle="img"` mit `aria-label` statt eines leeren `alt` — ein Schema, das
 * niemand vorgelesen bekommt, ist für einen Teil der Leser gar nicht da.
 */
export function artikelBild(artikel, { klasse = 'schema' } = {}) {
  const form = bauform(artikel);
  const zeichnung = (formen[form] ?? formen.teil)(artikel ?? {});
  const beschreibung = `Schemazeichnung: ${BAUFORM_TEXT[form] ?? 'Bauteil'}`;
  return `<svg class="${klasse}" viewBox="0 0 120 90" role="img" aria-label="${beschreibung}"
 xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${zeichnung}</svg>`;
}

/** Klartext je Bauform — für Vorleseprogramme und für den Prüfer. */
export const BAUFORM_TEXT = Object.freeze({
  platte: 'Dämmplatte, Stärke maßstäblich',
  sack: 'Sackware',
  rohr: 'Rohr mit Muffe',
  bogen: 'Rohrbogen im angegebenen Winkel',
  abzweig: 'Abzweiger',
  ring: 'Schachtring in Draufsicht',
  stein: 'Mauer- oder Mantelstein',
  rolle: 'Rollenware',
  leiste: 'Profil im Schnitt',
  duebel: 'Dübel mit Teller',
  dose: 'Kartusche',
  haube: 'Regenhaube',
  werkzeug: 'Werkzeug',
  teil: 'Bauteil',
});

/** Sinnbild einer Warengruppe — dieselbe Sprache, eine Stufe gröber. */
export function gruppenBild(gruppe) {
  const muster = {
    'Dämmung': { bezeichnung: 'Dämmplatte 80 mm', gruppe: 'Dämmung', einheit: 'M2' },
    WDVS: { bezeichnung: 'Gewebe 110 cm', gruppe: 'WDVS', einheit: 'M2' },
    'Mörtel': { bezeichnung: 'Mörtel 25 kg', gruppe: 'Mörtel', einheit: 'SCK' },
    Kanal: { bezeichnung: 'Kanalrohr NW 100', gruppe: 'Kanal', einheit: 'STK' },
    Kamin: { bezeichnung: 'Mantelstein', gruppe: 'Kamin', einheit: 'STK' },
    Mauerwerk: { bezeichnung: 'Ziegel N+F 25 cm', gruppe: 'Mauerwerk', einheit: 'STK' },
    'Zubehör': { bezeichnung: 'Kartusche 750 ml', gruppe: 'Zubehör', einheit: 'DOS' },
  }[gruppe] ?? { bezeichnung: gruppe, gruppe, einheit: 'STK' };
  return artikelBild(muster, { klasse: 'schema gruppe' });
}
