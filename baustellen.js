// Baustellen mit den jeweils letzten 3 Protokollen ("Sicherheit am Bau").
// Stand: automatisch aus Google Drive erhoben (Ordner "Berichte" je Baustelle).
// Der Verteiler gilt als Standard für alle Baustellen und kann in der App
// je Baustelle überschrieben werden (localStorage bp_verteiler).

const VERTEILER_STANDARD = ['Baukoordinator', 'Bauleitung', 'Baufirma / Polier', 'Auftraggeber'];

// Gruppen (Touren) für die Baustellen-Liste.
const GRUPPEN = ['Diverse Baustellen', 'Linz, Traun, Umgebung', 'Rohrbach RUNDE', 'SEENTOUR Gmunden'];

// Standardtext für den E-Mail-Versand des Protokolls.
const MAIL_TEXT = 'Anbei das Baustellenbesuchsprotokoll - BauKG.\n\n' +
  'Bitte um Kenntnisnahme und Umsetzung der jeweils relevanten Punkte.\n\n' +
  'Mit freundlichen Grüßen\n' +
  'Bmst Ing Stefan Freudenthaler\n' +
  'Freudenthaler Bau GmbH\n' +
  'Mobil: 0664 5103676';

// lat/lng: ungefähre Lage (Ortszentrum) für die GPS-Erkennung; die exakte
// Position kann in der App je Baustelle gespeichert werden (bp_standorte).
// Hangar 3 und WFL haben noch keine Koordinaten – vor Ort einmal 'Position
// speichern' drücken.
const BAUSTELLEN = [
  {
    id: 'vorchdorf',
    aktiv: false,
    ort: 'Vorchdorf', gruppe: 'SEENTOUR Gmunden',
    lat: 47.9906, lng: 13.9236,
    name: 'Vorchdorf Messenbachstraße',
    ordnerUrl: 'https://drive.google.com/drive/folders/1-FocuAWFuEkDgVpBvV2ZtrKgVlRvJcNR',
    protokolle: [
      { titel: '28.02.23 14:47 – Bericht', url: 'https://drive.google.com/file/d/1cwqbyzi-ul0f85406yiKc1Dydrlmxddw/view' },
      { titel: '06.02.23 14:10 – Bericht', url: 'https://drive.google.com/file/d/1w44iehVpQzfD9DUbncLm1U4M9pC2iTtv/view' },
      { titel: '23.01.23 14:42 – Bericht', url: 'https://drive.google.com/file/d/1Hyo_rgHxMEhZ4onm6MQQOM7HgNgy8jJO/view' }
    ]
  },
  {
    id: 'pinsdorf',
    aktiv: false,
    ort: 'Pinsdorf', gruppe: 'SEENTOUR Gmunden',
    lat: 47.9247, lng: 13.7695,
    name: 'Ppz Pinsdorf Zentrum',
    ordnerUrl: 'https://drive.google.com/drive/folders/1Ko0vUYLzZJnb9F0wN3dAHAd3lSYgws2j',
    protokolle: [
      { titel: '27.06.23 15:00 – Bericht', url: 'https://drive.google.com/file/d/1P1t47q9NJctXAANZs2zQSZ6Ns1px9zld/view' },
      { titel: '30.05.23 11:36 – Bericht', url: 'https://drive.google.com/file/d/1bLSOvxRgm5aWn95ViaUghAJiu1d9XuXV/view' },
      { titel: '15.05.23 14:43 – Bericht', url: 'https://drive.google.com/file/d/1QB9WJQCV799eyqW677UEC2CM8JfUCUlq/view' }
    ]
  },
  {
    id: 'wels',
    aktiv: false,
    ort: 'Wels', gruppe: 'Diverse Baustellen',
    lat: 48.1487, lng: 14.0304,
    name: 'Wels Neustadt',
    ordnerUrl: 'https://drive.google.com/drive/folders/1db5nUCXjXJUazJwJq2mML16b1-Uws--A',
    protokolle: [
      { titel: '20.06.23 11:29 – Bericht', url: 'https://drive.google.com/file/d/1-hzEw4TYneaQhhGSbfzYMEUDmqUNa-Ec/view' },
      { titel: '08.05.23 14:29 – Bericht', url: 'https://drive.google.com/file/d/16dXqn3g3GFNUU9_sCOmvMXAZISmCrbFD/view' },
      { titel: '19.04.23 10:24 – Bericht', url: 'https://drive.google.com/file/d/1HoLr9d90BVgxdQr8OqcYsdbIaTRuFGa7/view' }
    ]
  },
  {
    id: 'hangar3',
    aktiv: false,
    ort: '', gruppe: 'Linz, Traun, Umgebung',
    name: 'Hangar 3',
    ordnerUrl: 'https://drive.google.com/drive/folders/1iyh3n4RucvE3glCTg8FTE-k0f3698nSp',
    protokolle: [
      { titel: '07.12.22 12:14 – Bericht', url: 'https://drive.google.com/file/d/1ECkHevx2vcidCUVZZynYNOz5k2gb0I3r/view' },
      { titel: '22.11.22 08:33 – Bericht', url: 'https://drive.google.com/file/d/1vhr-Qxp6dOjtCnzWmjm01yel_90TvKbn/view' },
      { titel: '08.11.22 12:06 – Bericht', url: 'https://drive.google.com/file/d/1I5xwKnNmZf1Dzlt0ftnIoiKyAFHBnERX/view' }
    ]
  },
  {
    id: 'brauunion',
    aktiv: false,
    ort: 'Wieselburg', gruppe: 'Diverse Baustellen',
    lat: 48.1266, lng: 15.1354,
    name: 'Brauunion Wieselburg',
    ordnerUrl: 'https://drive.google.com/drive/folders/1wGH0rdK0WSxmg5lXakqkdXueLZZs6EXu',
    protokolle: [
      { titel: '25.04.23 09:25 – Bericht', url: 'https://drive.google.com/file/d/13B4mWzP0Zm5_7SebzpL8LcZtIecBUw3b/view' },
      { titel: '11.04.23 09:42 – Bericht', url: 'https://drive.google.com/file/d/14Zhm0QrEDNQEIwSb0x1Vne62EzdUnoE-/view' },
      { titel: '21.03.23 09:57 – Bericht', url: 'https://drive.google.com/file/d/1BgxCgqUARbTf-tJW_J7DqhYQxT7I1I3c/view' }
    ]
  },
  {
    id: 'niederzirking',
    aktiv: false,
    ort: 'Ried in der Riedmark', gruppe: 'Linz, Traun, Umgebung',
    lat: 48.2606, lng: 14.5231,
    name: 'Kirche Niederzirking',
    ordnerUrl: 'https://drive.google.com/drive/folders/1h7w3KiciT5_EARmEkBgLswLNtkaxjQ5N',
    protokolle: [
      { titel: '22.05.23 12:30 – Bericht', url: 'https://drive.google.com/file/d/1yTTsEbdo-p0bAy3YFlqWmN-y-ap-zcUL/view' },
      { titel: '09.05.23 11:53 – Bericht', url: 'https://drive.google.com/file/d/1oFOqcZkBoo_CiSTPjvZCa1wxp0KlP_Im/view' },
      { titel: '26.04.23 11:00 – Bericht', url: 'https://drive.google.com/file/d/16ZQIyI5dEbITmQrJ5qbvQRxDIskf3Q0d/view' }
    ]
  },
  {
    id: 'niederneukirchen',
    aktiv: false,
    ort: 'Niederneukirchen', gruppe: 'Linz, Traun, Umgebung',
    lat: 48.1861, lng: 14.3894,
    name: 'Niederneukirchen NMS',
    ordnerUrl: 'https://drive.google.com/drive/folders/1aVe_lun_XMvRfGGwu1l7AnArfZ4J7sz0',
    protokolle: [
      { titel: '16.08.23 12:44 – Bericht', url: 'https://drive.google.com/file/d/15KChaLYTvTvJTDapkJmnV9Xl_hAspsAQ/view' }
    ]
  },
  {
    id: 'wfl',
    ort: 'Linz', gruppe: 'Linz, Traun, Umgebung',
    name: 'WFL Versandhalle Süd',
    ordnerUrl: 'https://drive.google.com/drive/folders/1OzQ_0tyxIQjct4bGLTky4q0iKVTtSrO9',
    protokolle: [
      { titel: '24.04.25 13:23 – Bericht', url: 'https://drive.google.com/file/d/1ZEyf5xTM_glUFkwt02pjWo1oQm9etIp9/view' }
    ]
  }
,
  {
    id: 'mittendorfer',
    ort: 'Traunkirchen', gruppe: 'SEENTOUR Gmunden',
    name: 'Mittendorfer Traunkirchen',
    protokolle: []
  },
  {
    id: 'kiga_voecklabruck',
    ort: 'Vöcklabruck', gruppe: 'SEENTOUR Gmunden',
    name: 'OÖ Wohnbau KIGA Vöcklabruck',
    protokolle: []
  },
  {
    id: 'strass_attergau',
    ort: 'Straß im Attergau', gruppe: 'SEENTOUR Gmunden',
    name: 'Straß im Attergau VS+KIGA',
    verteilerN: 9,
    protokolle: []
  },
  {
    id: 'hamburgerstrasse',
    ort: 'Vöcklabruck', gruppe: 'SEENTOUR Gmunden',
    name: 'OJ 12+13 Hamburgerstraße 1-21',
    verteilerN: 10,
    protokolle: []
  },
  {
    id: 'oebb_riedau',
    ort: '', gruppe: 'SEENTOUR Gmunden',
    name: 'ÖBB Riedau-Attnang',
    protokolle: []
  }
,
  {
    id: 'baumgartenberg',
    ort: '', gruppe: 'Diverse Baustellen',
    name: 'Baumgartenberg',
    verteilerN: 9,
    protokolle: []
  },
  {
    id: 'oebb_bahnstrom',
    ort: '', gruppe: 'Diverse Baustellen',
    name: 'ÖBB Bahnstromleitung',
    verteilerN: 8,
    protokolle: []
  },
  {
    id: 'habau_ortner',
    ort: '', gruppe: 'Diverse Baustellen',
    name: 'Habau Ortner',
    protokolle: []
  },
  {
    id: 'ortner_wartberg',
    ort: 'Wartberg', gruppe: 'Diverse Baustellen',
    name: 'Ortner Wartberg',
    protokolle: []
  },
  {
    id: 'grein_nms',
    ort: 'Grein', gruppe: 'Diverse Baustellen',
    name: 'Grein NMS',
    verteilerN: 4,
    protokolle: []
  },
  {
    id: 'altenhaus6',
    ort: '', gruppe: 'Diverse Baustellen',
    name: 'Altenhaus 6',
    protokolle: []
  },
  {
    id: 'perg_habau',
    ort: 'Perg', gruppe: 'Diverse Baustellen',
    name: 'Perg Habau Bürozubau',
    verteilerN: 4,
    protokolle: []
  }
];
