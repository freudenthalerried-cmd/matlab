// Beispielwohnung, Wandfarben, Böden. Maße in Metern, x nach Osten, z nach Süden (Norden = -z).
const P = Math.PI, H = P / 2;

export const WAND0 = '#f3f1ec';

export const WANDFARBEN = [
  { name: 'Altweiß', hex: '#f3f1ec', kw: 'Wandfarbe weiß matt 10 Liter' },
  { name: 'Reinweiß', hex: '#fbfbf8', kw: 'Wandfarbe reinweiß deckend' },
  { name: 'Kalkweiß', hex: '#ece6da', kw: 'Kalkfarbe Wand' },
  { name: 'Hellgrau', hex: '#d9d9d6', kw: 'Wandfarbe hellgrau matt' },
  { name: 'Greige', hex: '#bfb6a6', kw: 'Wandfarbe greige' },
  { name: 'Warmgrau', hex: '#a59d92', kw: 'Wandfarbe warmgrau' },
  { name: 'Betongrau', hex: '#8e8e8b', kw: 'Wandfarbe betongrau' },
  { name: 'Anthrazit', hex: '#3d4042', kw: 'Wandfarbe anthrazit matt' },
  { name: 'Sandbeige', hex: '#d8c7a8', kw: 'Wandfarbe beige sand' },
  { name: 'Ocker', hex: '#c99a3b', kw: 'Wandfarbe ocker' },
  { name: 'Senfgelb', hex: '#d4a72c', kw: 'Wandfarbe senfgelb' },
  { name: 'Terrakotta', hex: '#c06a4b', kw: 'Wandfarbe terracotta' },
  { name: 'Ziegelrot', hex: '#9c3d2e', kw: 'Wandfarbe rot matt' },
  { name: 'Altrosa', hex: '#d5a6a0', kw: 'Wandfarbe altrosa' },
  { name: 'Lavendel', hex: '#b7a9c9', kw: 'Wandfarbe flieder lavendel' },
  { name: 'Mintgrün', hex: '#bfdccb', kw: 'Wandfarbe mint' },
  { name: 'Salbeigrün', hex: '#9fae8f', kw: 'Wandfarbe salbeigrün' },
  { name: 'Olivgrün', hex: '#6f7651', kw: 'Wandfarbe olivgrün' },
  { name: 'Tannengrün', hex: '#2f4a3a', kw: 'Wandfarbe dunkelgrün' },
  { name: 'Taubenblau', hex: '#8ea3b5', kw: 'Wandfarbe taubenblau' },
  { name: 'Petrol', hex: '#2e5e66', kw: 'Wandfarbe petrol' },
  { name: 'Nachtblau', hex: '#22344d', kw: 'Wandfarbe dunkelblau' },
];

export const MOEBELFARBEN = ['#f1efe9', '#e8e2d6', '#c8a27a', '#b08560', '#8b5a3c', '#b9b2a7', '#7a8a99', '#6f7651', '#2f4a3a', '#9c3d2e', '#22344d', '#3d4042', '#141414'];

// art: dielen | fliesen | beton | teppich ; size = Kantenlänge der Textur in m
export const BOEDEN = {
  eiche_hell: { name: 'Eiche hell', art: 'dielen', farbe: '#c9a57a', size: 2, rough: 0.6, kw: 'Vinylboden Klick Eiche hell' },
  eiche_dunkel: { name: 'Eiche geräuchert', art: 'dielen', farbe: '#8a6542', size: 2, rough: 0.6, kw: 'Parkett Eiche geräuchert' },
  nuss: { name: 'Nussbaum', art: 'dielen', farbe: '#6b4a32', size: 2, rough: 0.55, kw: 'Vinylboden Nussbaum' },
  grau_holz: { name: 'Holz grau', art: 'dielen', farbe: '#a8a39b', size: 2, rough: 0.65, kw: 'Laminat grau Holzoptik' },
  fliesen_hell: { name: 'Fliese hell 60×60', art: 'fliesen', farbe: '#e4e1db', fuge: '#c9c5bd', size: 1.2, rough: 0.35, kw: 'Bodenfliesen 60x60 hell' },
  fliesen_grau: { name: 'Fliese anthrazit 60×60', art: 'fliesen', farbe: '#5b5d5f', fuge: '#46484a', size: 1.2, rough: 0.4, kw: 'Bodenfliesen 60x60 anthrazit' },
  beton: { name: 'Betonoptik', art: 'beton', farbe: '#9c9a95', size: 3, rough: 0.85, kw: 'Vinylboden Betonoptik' },
  teppich: { name: 'Teppichboden grau', art: 'teppich', farbe: '#7d8085', size: 1, rough: 1, kw: 'Teppichboden grau Meterware' },
};

const W = (a, b, t, open) => ({ a, b, t, open: open || [] });
const F = (at, w, sill = 0.9, h = 1.3) => ({ at, w, sill, h, typ: 'fenster' });
const T = (at, w = 0.9, h = 2.05) => ({ at, w, sill: 0, h, typ: 'tuer' });

export function beispiel() {
  return {
    name: 'Beispielwohnung 70 m²', height: 2.6,
    start: { x: 4.0, z: 6.2, yaw: 0 },
    walls: [
      W([0, 0], [10, 0], 0.3, [F(3.8, 1.4), F(8.0, 1.4)]),
      W([10, 0], [10, 7], 0.3, [F(5.75, 1.2)]),
      W([10, 7], [0, 7], 0.3, [F(1.4, 1.2), T(5.4, 1.0, 2.1), F(8.6, 0.6, 1.4, 0.6)]),
      W([0, 7], [0, 0], 0.3, [F(5.0, 2.2, 0, 2.2)]),
      W([6, 0], [6, 4.5], 0.12),
      W([0, 4.5], [10, 4.5], 0.12, [T(4.0, 0.9), T(6.6, 0.8)]),
      W([2.8, 4.5], [2.8, 7], 0.12, [T(1.1, 0.8)]),
      W([7.2, 4.5], [7.2, 7], 0.12, [T(1.1, 0.8)]),
    ],
    rooms: [
      { name: 'Wohnküche', poly: [[0, 0], [6, 0], [6, 4.5], [0, 4.5]], floor: 'eiche_hell' },
      { name: 'Schlafzimmer', poly: [[6, 0], [10, 0], [10, 4.5], [6, 4.5]], floor: 'eiche_hell' },
      { name: 'Bad', poly: [[0, 4.5], [2.8, 4.5], [2.8, 7], [0, 7]], floor: 'fliesen_hell' },
      { name: 'Flur', poly: [[2.8, 4.5], [7.2, 4.5], [7.2, 7], [2.8, 7]], floor: 'fliesen_grau' },
      { name: 'Arbeitszimmer', poly: [[7.2, 4.5], [10, 4.5], [10, 7], [7.2, 7]], floor: 'eiche_dunkel' },
    ],
    items: [
      { cat: 'tvboard', x: 1.5, z: 0.36, rot: 0 }, { cat: 'tv', x: 1.5, z: 0.33, rot: 0, y: 0.48 },
      { cat: 'teppich', x: 1.5, z: 2.75, rot: 0 }, { cat: 'couchtisch', x: 1.5, z: 2.8, rot: 0 },
      { cat: 'sofa3', x: 1.5, z: 3.97, rot: P }, { cat: 'sessel', x: 2.75, z: 3.0, rot: -H * 0.7 },
      { cat: 'stehlampe', x: 0.45, z: 4.1, rot: 0 }, { cat: 'pflanze', x: 0.45, z: 0.5, rot: 0 },
      { cat: 'bild', x: 1.5, y: 1.6, z: 4.422, rot: P },
      { cat: 'kueche', x: 5.64, z: 1.65, rot: -H }, { cat: 'kuehlschrank', x: 5.6, z: 3.2, rot: -H },
      { cat: 'esstisch', x: 4.0, z: 2.0, rot: 0 },
      { cat: 'stuhl', x: 3.6, z: 1.27, rot: 0 }, { cat: 'stuhl', x: 4.4, z: 1.27, rot: 0 },
      { cat: 'stuhl', x: 3.6, z: 2.73, rot: P }, { cat: 'stuhl', x: 4.4, z: 2.73, rot: P },
      { cat: 'deckenlampe', x: 4.0, z: 2.0, rot: 0 }, { cat: 'spot', x: 1.5, z: 2.4, rot: 0 },
      { cat: 'bett', x: 8.8, z: 2.25, rot: -H }, { cat: 'nachttisch', x: 9.62, z: 0.95, rot: -H }, { cat: 'nachttisch', x: 9.62, z: 3.55, rot: -H },
      { cat: 'tischlampe', x: 9.62, z: 0.95, rot: 0, y: 0.5 }, { cat: 'tischlampe', x: 9.62, z: 3.55, rot: 0, y: 0.5 },
      { cat: 'kleiderschrank', x: 6.36, z: 1.3, rot: H }, { cat: 'spot', x: 8.0, z: 2.25, rot: 0 },
      { cat: 'badewanne', x: 0.53, z: 5.65, rot: H }, { cat: 'wc', x: 1.55, z: 6.56, rot: P },
      { cat: 'waschtisch', x: 2.5, z: 6.4, rot: -H }, { cat: 'spiegel', x: 2.727, y: 1.5, z: 6.4, rot: -H }, { cat: 'spot', x: 1.4, z: 5.75, rot: 0 },
      { cat: 'kommode', x: 5.5, z: 4.785, rot: 0 }, { cat: 'spiegel', x: 5.5, y: 1.6, z: 4.573, rot: 0 },
      { cat: 'spot', x: 5.0, z: 5.75, rot: 0 }, { cat: 'pflanze', x: 3.15, z: 6.55, rot: 0 },
      { cat: 'schreibtisch', x: 9.5, z: 5.75, rot: -H }, { cat: 'buerostuhl', x: 8.85, z: 5.75, rot: H },
      { cat: 'regal', x: 7.41, z: 6.4, rot: H }, { cat: 'tischlampe', x: 9.6, z: 6.25, rot: 0, y: 0.75 },
      { cat: 'bild', x: 8.6, y: 1.6, z: 4.578, rot: 0 }, { cat: 'spot', x: 8.6, z: 5.75, rot: 0 },
    ],
    light: { tod: 15, nord: 0, lamps: false, level: 1, kelvin: 3000, exposure: 1 },
  };
}

// Rechteckiger Raum aus Innenmaßen (z. B. aus der Raumplan-Messung)
export function rechteckRaum(name, L, Bt, Hh, nF, tuer, t = 0.25) {
  const h = t / 2, A = [-h, -h], Bp = [L + h, -h], Cp = [L + h, Bt + h], D = [-h, Bt + h];
  const ws = [W(A, Bp, t), W(Bp, Cp, t), W(Cp, D, t), W(D, A, t)];
  const len = i => (i % 2 === 0 ? L : Bt) + t;
  const order = [0, 1, 3, 2];
  for (let k = 0; k < nF; k++) {
    const i = order[k % 4], n = len(i);
    const at = i === 2 && tuer ? n * 0.4 : n / 2, w = Math.min(1.4, (n - t) * 0.4);
    ws[i].open.push(F(at, w));
  }
  if (tuer) ws[2].open.push(T(len(2) - h - 0.25 - 0.45, 0.9));
  return {
    name, height: Hh, start: { x: L / 2, z: Bt * 0.8, yaw: 0 }, walls: ws,
    rooms: [{ name, poly: [[0, 0], [L, 0], [L, Bt], [0, Bt]], floor: 'eiche_hell' }],
    items: [], light: { tod: 15, nord: 0, lamps: false, level: 1, kelvin: 3000, exposure: 1 },
  };
}
