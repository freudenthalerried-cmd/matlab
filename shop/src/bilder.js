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

import { einheitText } from './format.js';

const RAHMEN = 'stroke="var(--linie-stark)" fill="var(--flaeche-2)" stroke-width="1.5"';
const KANTE = 'stroke="var(--linie-stark)" fill="none" stroke-width="1.5"';
const AKZENT = 'stroke="var(--ocker)" fill="none" stroke-width="1.5"';
const SCHRIFT = 'fill="var(--gedaempft)" font-family="var(--zahl), monospace" font-size="9"';

/**
 * Die erste Zahl mit Einheit, die zu einem Maß passt.
 *
 * **Berichtigt am 31.08.: eine Zahl, die nach links weitergeht, ist nicht die
 * ganze Zahl.** Zwei Artikelkarten trugen ein falsches Maß:
 *
 *   „Schiedel Fugenmasse FM **1,5 kg**"                 beschriftet „5 kg"
 *   „Capatect Gewebeanschlussleiste … **2,55 m**"        beschriftet „55 m"
 *
 * Beide Male hatte das Muster den **Rest einer Dezimalzahl** gegriffen: Es
 * verlangte nur Ziffern vor der Einheit, und `5 kg` steht nun einmal in
 * `1,5 kg`. Auf der Karte stand damit das Dreifache beziehungsweise das
 * Zweiundzwanzigfache — und die Karte ist oft alles, was ein Kunde sieht.
 *
 * Am 28. August ist derselbe Fehler schon einmal aufgetreten (die 600 mm
 * Plattenbreite als Stärke) und **fallweise** behoben worden. Deshalb steht
 * die Regel jetzt hier, wo alle Muster durchkommen: Steht links vom Treffer
 * eine Ziffer, ein Komma oder ein Punkt, ist der Treffer ein Bruchstück und
 * gilt nicht.
 *
 * Was die Bezeichnung nicht als ganze Zahl hergibt, wird nicht beschriftet —
 * dann greift der Ersatztext der jeweiligen Bauform.
 */
function mass(text, muster) {
  const t = String(text ?? '');
  const m = t.match(muster);
  if (!m) return null;
  const davor = m.index > 0 ? t[m.index - 1] : '';
  if (/[\d.,]/.test(davor)) return null;
  return m[0].replace(/\s+/g, ' ').trim();
}

/**
 * Der Durchmesser einer Regenhaube, mit Zeichen.
 *
 * **Berichtigt am 31.08.** Hier stand `mass(a.bezeichnung, /\d{3}/)`, und die
 * Karte trug daraufhin eine nackte „180". Eine Zahl ohne Einheit ist keine
 * Angabe — der Schachtring nebenan schreibt seit jeher „⌀ 800". Dieselbe
 * Ware, dieselbe Schreibweise.
 */
function hauberndurchmesser(bezeichnung) {
  const m = mass(bezeichnung, /\d{3}(?![\d.,])/);
  return m === null ? null : `⌀ ${m}`;
}

/**
 * Plattendicke in Millimetern — für die gezeichnete Stärke und die
 * Beschriftung.
 *
 * **Berichtigt am 28.08.** „Isover TDPT 20 1200 600 mm 8,64 m2" wurde als
 * Platte mit **600 mm Stärke** gezeichnet und so beschriftet. Die 600 sind
 * die Plattenbreite; die Stärke steht als Typkennung „TDPT 20" weiter vorn
 * und ist als Maß nicht erkennbar. Ein Kunde sah eine 60 cm dicke
 * Trittschalldämmung — und das Bild behauptete dazu „Stärke maßstäblich".
 *
 * > **Die erste Zahl mit „mm" ist nicht die Stärke, sondern die erste Zahl
 * > mit „mm".**
 *
 * Deshalb eine Plausibilitätsgrenze: Über 300 mm ist keine Plattenstärke,
 * die dieses Sortiment führt — die Zahl meint dann etwas anderes, und
 * *welches* etwas, kann diese Funktion nicht wissen. Sie gibt `null` zurück,
 * und die Zeichnung beschriftet sich mit „Platte" statt mit einem falschen
 * Maß. Lieber keine Angabe als eine erfundene; das ist dieselbe Regel wie
 * beim fehlenden Gewicht und beim fehlenden Merkblatt.
 *
 * Die tatsächliche Stärke des Isover-Typs steht im Merkblatt des
 * Herstellers. `isover.at` ist aus dieser Umgebung gesperrt (403 am
 * Ausgangsproxy, am 28.08. nachgesehen), also bleibt sie offen.
 */
export const HOECHSTE_PLATTENSTAERKE_MM = 300;

export function dickeMm(bezeichnung) {
  const t = String(bezeichnung ?? '');
  const mm = t.match(/(\d{1,3})\s*mm(?![\p{L}])/u);
  if (mm) {
    const wert = Number(mm[1]);
    return wert <= HOECHSTE_PLATTENSTAERKE_MM ? wert : null;
  }
  const cm = t.match(/(\d{1,2})\s*cm(?![\p{L}])/u);
  if (cm) {
    const wert = Number(cm[1]) * 10;
    return wert <= HOECHSTE_PLATTENSTAERKE_MM ? wert : null;
  }
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
 * Zwei Regeln, und die zweite ist die, die anfangs fehlte.
 *
 * **Erstens: das Besondere vor dem Allgemeinen.** „PVC Kanalbogen NW 100
 * 45 grad" ist ein Bogen und erst danach ein Rohr.
 *
 * **Zweitens: der Kopf eines deutschen Kompositums steht hinten.** Die
 * erste Fassung suchte das Formwort irgendwo in der Bezeichnung, und das
 * ging bei drei von 46 Artikeln schief:
 *
 * | Bezeichnung | gezeichnet wurde | richtig ist |
 * |---|---|---|
 * | Soudal Profi-Pistolen**schaum** | eine Kartuschenpistole | eine Dose |
 * | Mantelstein**kleber** Dünnbettmörtel | ein Mauerstein | ein Sack |
 * | Putztüranschluss**paket** | ein Sack (wegen „Putz") | ein Formteil |
 *
 * Es ist derselbe Fehler wie bei `marke()` in `bin/website.mjs`, wo „SIK"
 * das Wort „Sikkativ" fand — nur andersherum: Dort war jeder Treffer mitten
 * im Wort falsch, hier ist er es nur, wenn hinter dem Formwort noch ein
 * Wortteil folgt. Ein Mantel**stein** ist ein Stein, ein Mantelstein**kleber**
 * ist keiner.
 *
 * Deshalb prüft `kopf()` auf ein Wortende: hinter dem Formwort darf kein
 * weiterer Buchstabe stehen. Ziffern und Bindestriche sind erlaubt, sonst
 * fiele „Kanalbogen 45" oder „PAE-Folie" heraus. `\b` genügt dafür nicht —
 * JavaScripts Wortgrenze ist ASCII und kennt kein „ö".
 *
 * Was bewusst weiter irgendwo im Text gesucht wird, steht in `hat()`:
 * Produktkürzel wie EPS, XPS oder N+F sind keine Kompositumsköpfe, sondern
 * Typenbezeichnungen.
 */
export function bauform(artikel) {
  const b = String(artikel?.bezeichnung ?? '');
  const g = String(artikel?.gruppe ?? '');
  const e = String(artikel?.einheit ?? '');
  const hat = (re) => re.test(b);

  /**
   * **Was nach „mit" steht, bestimmt die Form nicht.**
   *
   * Gemessen am 30.08. an vierzig Namen, wie sie bei einem Baustoffhändler
   * vorkommen: „Capatect Eckwinkel **mit Gewebe** 2,5 m" wurde als **Rolle**
   * gezeichnet. Das Erzeugnis ist ein Winkel von 2,5 m Länge; die Rolle ist
   * das Zubehör daran.
   *
   * Im Deutschen steht der Kopf des Ausdrucks vorn — beim Kompositum
   * („Mantelstein**kleber**" ist ein Kleber, deshalb prüft `kopf()` auf
   * Wortende) und bei der Beifügung genauso, nur andersherum: „X mit Y" ist
   * ein X. Was hinter „mit" steht, ist Beiwerk und wird für die Formsuche
   * abgeschnitten.
   *
   * Auf den 46 Artikeln des Bestands ändert das nichts: „Regenhaube mit
   * Sicherungsseil" bleibt eine Haube, „Kantenschutz mit Gewebe" bleibt eine
   * Leiste. Es hält den Fehler von morgen ab, nicht einen von heute.
   */
  const kern = b.split(/\s+mit\s+/i)[0];
  /** Formwort am Wortende — „Mantelstein" ja, „Mantelsteinkleber" nein. */
  const kopf = (quelle) => new RegExp(`(?:${quelle})(?![\\p{L}])`, 'iu').test(kern);

  /**
   * **Die Einheit schlägt den Namen, wo sie eindeutig ist.**
   *
   * „Drainagerohr DN 100 gelocht 50 m" mit Einheit `RLL` wurde als Rohr
   * gezeichnet — fünfzig Meter Rohr kommen als Ring, nicht als Stange. Die
   * Einheit steht im Beleg des Lieferanten; der Name ist Prosa. Wo die
   * Einheit die Form festlegt, entscheidet sie zuerst.
   *
   * Nur `RLL` und `DOS`: Sie lassen keine zweite Lesart zu. `SCK`, `KG` und
   * `EIM` stehen weiter unten in der Kette, weil ein Sack auch ein Ziegel
   * sein kann, der auf Paletten in Säcken kommt.
   */
  if (e === 'RLL') return 'rolle';
  if (e === 'DOS') return 'dose';

  if (kopf('abzweiger?')) return 'abzweig';
  if (kopf('bogen')) return 'bogen';
  if (kopf('schachtring|ring')) return 'ring';
  if (kopf('rohr')) return 'rohr';
  if (kopf('dübel|duebel|rondelle|schraube')) return 'duebel';
  if (kopf('kantenschutz|anschlussleiste|leiste|profil|schiene')) return 'leiste';
  if (kopf('gewebe|gitter|folie|band|grundmauerschutz')) return 'rolle';
  if (kopf('pistole')) return 'werkzeug';
  if (kopf('schaum') || hat(/kleber\s+b3|750\s*ml/i)) return 'dose';
  if (kopf('haube')) return 'haube';
  if (kopf('stein|ziegel') || hat(/N\+F/i)) return 'stein';
  if (e === 'KG' || e === 'SCK' || e === 'EIM' || kopf('mörtel|putz|spachtel|masse|kleber')) return 'sack';
  if (g === 'Dämmung' || hat(/EPS|XPS|TDPT/i) || kopf('dämmung')) return 'platte';
  return 'teil';
}

/* ------------------------------------------------------------------ *
 * Die einzelnen Formen. Alle im selben Feld 120 × 90.
 * ------------------------------------------------------------------ */

const formen = {
  /** Dämmplatte in Schrägansicht; die Stärke wird maßstäblich gezeichnet. */
  platte(a) {
    // Zwei Werte, ein Ursprung: Was gezeichnet wird, ist auch das, was
    // darunter steht. Vorher las die Beschriftung mit einem **zweiten**
    // Ausdruck aus derselben Bezeichnung — und schrieb „600 mm" unter eine
    // Platte, die mit der Voreinstellung gezeichnet war.
    const mm = dickeMm(a.bezeichnung);
    const gezeichnet = mm ?? 40;
    // 20 mm → 6 px, 100 mm → 22 px. Gedeckelt, damit die Platte Platte bleibt.
    const d = Math.max(5, Math.min(24, 4 + gezeichnet * 0.19));
    const y = 58 - d;
    return `<path d="M18 ${y} L84 ${y - 16} L104 ${y - 8} L38 ${y + 8} Z" ${RAHMEN}/>
<path d="M18 ${y} L18 ${y + d} L38 ${y + 8 + d} L38 ${y + 8} Z" ${RAHMEN}/>
<path d="M38 ${y + 8} L38 ${y + 8 + d} L104 ${y - 8 + d} L104 ${y - 8} Z" fill="var(--ocker-weich)" stroke="var(--linie-stark)" stroke-width="1.5"/>
<path d="M110 ${y - 8} L110 ${y - 8 + d}" ${AKZENT}/>
<path d="M107 ${y - 8} L113 ${y - 8} M107 ${y - 8 + d} L113 ${y - 8 + d}" ${AKZENT}/>
${beschriftung(mm === null ? 'Platte' : `${mm} mm`)}`;
  },

  /** Sackware — die Silhouette, die auf jeder Palette steht. */
  sack(a) {
    return `<path d="M34 30 Q34 24 40 24 L80 24 Q86 24 86 30 L88 70 Q88 76 82 76 L38 76 Q32 76 32 70 Z" ${RAHMEN}/>
<path d="M40 24 Q60 30 80 24" ${KANTE}/>
<rect x="44" y="42" width="32" height="14" rx="2" fill="var(--ocker-weich)" stroke="var(--ocker)" stroke-width="1.2"/>
${beschriftung(mass(a.bezeichnung, /\d{1,3}(?:[.,]\d{1,2})?\s*(?:kg|l)(?![\p{L}])/iu) ?? 'Sack')}`;
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
${beschriftung(mass(a.bezeichnung, /\d{1,2}(?:[.,]\d{1,2})?\s*m(?![\p{L}2])/u) ?? 'Profil')}`;
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
${beschriftung(hauberndurchmesser(a.bezeichnung) ?? 'Haube')}`;
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
${beschriftung(einheitText(a.einheit))}`;
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
  // „Stärke maßstäblich" ist eine Zusage. Sie gilt nur, wenn die Stärke aus
  // der Bezeichnung ablesbar war — sonst zeichnet die Voreinstellung, und
  // die Bildbeschreibung darf das nicht als Maß ausgeben.
  const beschreibung = form === 'platte' && dickeMm(artikel?.bezeichnung) === null
    ? 'Schemazeichnung: Dämmplatte, Stärke nicht aus der Bezeichnung ablesbar'
    // **Ergänzt am 4. September.** Die Regel darüber gab es seit dem 30. August
    // und galt an genau einer Stelle: bei der Platte ohne ablesbare Stärke.
    // Die **Auffangform** `teil` hatte sie nicht — sie meldete
    // „Schemazeichnung: Bauteil" und las sich damit wie eine Aussage über
    // diesen Artikel, obwohl sie das Gegenteil ist: die Form ließ sich aus dem
    // Namen nicht bestimmen.
    //
    // > **Eine Lücke, die wie eine Angabe klingt, ist schlimmer als eine
    // > sichtbare Lücke** — genau die Familie, gegen die dieser Bestand seine
    // > `[[ … FEHLT ]]`-Marken führt.
    //
    // Betroffen sind heute drei Artikel, und es sind ausgerechnet die drei,
    // deren Seiten sich am ähnlichsten sind (`npm run pruefe-dubletten`,
    // 0,96): die Kaminpakete, bei denen der Name kein Bauteil nennt.
    : form === 'teil'
      ? 'Platzhalter: Die Form dieses Artikels ist aus seiner Bezeichnung nicht ablesbar'
      : `Schemazeichnung: ${BAUFORM_TEXT[form] ?? 'Bauteil'}`;
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
  // Die Auffangform. Sie steht für „aus dem Namen nicht bestimmbar" und
  // nicht für eine Bauart — die Bildbeschreibung sagt das seit dem 4. September
  // ausdrücklich, statt „Bauteil" wie eine Angabe klingen zu lassen.
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

/* ------------------------------------------------------------------ *
 * Der Schichtenschnitt einer Systemliste
 * ------------------------------------------------------------------ */

/**
 * Maskiert Text für die Zeichnung. Bewusst hier und nicht aus `markdown.js`
 * geholt: Dieses Modul kommt ohne einen einzigen Import aus, und das soll so
 * bleiben — es wird sowohl beim Bauen als auch im Testlauf geladen.
 */
function escText(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Zerlegt die Kopfzeile `schichten:` in die einzelnen Lagen.
 *
 * Schreibweise: `Wand (fremd) | Abdichtung (fremd) | Perimeterplatte XPS`.
 * Die Lagen stehen **in Einbaureihenfolge**, von innen nach außen; „(fremd)"
 * markiert eine Lage, die der Shop nicht führt.
 *
 * Warum die Markierung überhaupt in die Zeichnung gehört: Ein Schichtbild,
 * das nur die eigenen Lagen zeigt, sieht aus wie ein vollständiges Bauteil
 * und ist keines. Genau dieser Fehler stand bis gestern in der Fassadenliste
 * — Position 2 in der Tabelle, kein Artikel dahinter. Was auf der Liste
 * fehlt, fehlt jetzt auch sichtbar.
 */
export function schichten(text) {
  return String(text ?? '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const fremd = /\(fremd\)\s*$/i.test(s);
      return { name: s.replace(/\s*\(fremd\)\s*$/i, '').trim(), gefuehrt: !fremd };
    });
}

/**
 * Zeichnet den Schichtenaufbau als Schnitt.
 *
 * Bewusst **kein** maßstäblicher Aufbau: Die Lagendicken eines Bauteils
 * hängen an der Planung, nicht am Sortiment, und eine Zeichnung, die 8 cm
 * Dämmung zeigt, behauptet 8 cm. Alle Lagen sind deshalb gleich breit — das
 * Bild zeigt die **Reihenfolge**, und die ist die Aussage.
 *
 * Fremde Lagen bekommen eine Schraffur und keinen Farbkörper. Wer das Bild
 * ansieht, sieht sofort, welcher Teil des Bauteils nicht aus diesem Shop
 * kommt.
 */
export function schichtbild(lagen, { klasse = 'schichten' } = {}) {
  const l = Array.isArray(lagen) ? lagen : schichten(lagen);
  if (!l.length) return '';
  const breite = 300;
  const hoehe = 30 + l.length * 26;
  const x = 96;
  const bandBreite = breite - x - 12;

  const teile = [`<defs><pattern id="fremdraster" width="6" height="6" patternUnits="userSpaceOnUse"
 patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--linie-stark)" stroke-width="1.2"/></pattern></defs>`];
  l.forEach((lage, i) => {
    const y = 20 + i * 26;
    const fuellung = lage.gefuehrt ? 'var(--flaeche-2)' : 'url(#fremdraster)';
    teile.push(`<rect x="${x}" y="${y}" width="${bandBreite}" height="20" fill="${fuellung}"
 stroke="var(--linie-stark)" stroke-width="1.5"/>`);
    teile.push(`<text x="${x - 8}" y="${y + 14}" text-anchor="end" ${SCHRIFT}>${escText(lage.name)}</text>`);
    if (!lage.gefuehrt) {
      teile.push(`<text x="${x + bandBreite - 6}" y="${y + 14}" text-anchor="end"
 fill="var(--gedaempft)" font-family="var(--zahl), monospace" font-size="8">nicht von uns</text>`);
    }
  });
  teile.push(`<text x="${x}" y="12" ${SCHRIFT}>innen</text>`);
  teile.push(`<text x="${x + bandBreite}" y="${hoehe - 4}" text-anchor="end" ${SCHRIFT}>außen</text>`);

  const beschreibung = `Schichtenschnitt von innen nach außen: ${l
    .map((s) => (s.gefuehrt ? s.name : `${s.name} — nicht aus diesem Shop`))
    .join(', ')}`;
  return `<svg class="${klasse}" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="${escText(beschreibung)}"
 xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${teile.join('')}</svg>`;
}
