(function () {
  // ---------- Elemente ----------
  const viewListe = document.getElementById('view-liste');
  const viewProtokoll = document.getElementById('view-protokoll');
  const gruppenContainer = document.getElementById('gruppen');
  const sucheInput = document.getElementById('suche-input');
  const neuButton = document.getElementById('neu-button');
  const neuForm = document.getElementById('neu-form');
  const neuName = document.getElementById('neu-name');
  const neuOrt = document.getElementById('neu-ort');
  const neuGruppe = document.getElementById('neu-gruppe');
  const neuAbbrechen = document.getElementById('neu-abbrechen');
  const listeDrucken = document.getElementById('liste-drucken');
  const listeBausteine = document.getElementById('liste-bausteine');

  const zurueckButton = document.getElementById('zurueck-button');
  const protokollTitel = document.getElementById('protokoll-titel');
  const infoButton = document.getElementById('info-button');
  const infoPanel = document.getElementById('info-panel');
  const infoVerteiler = document.getElementById('info-verteiler');
  const infoProtokolle = document.getElementById('info-protokolle');
  const infoPosition = document.getElementById('info-position');

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');
  const ortInput = document.getElementById('ort-input');
  const kiPanel = document.getElementById('ki-vorschlaege');
  const kiChips = document.getElementById('ki-chips');
  const fotoInput = document.getElementById('foto-input');
  const fotoPreview = document.getElementById('foto-preview');
  const fotoPreviewImg = document.getElementById('foto-preview-img');
  const fotoRemove = document.getElementById('foto-remove');
  const fotoKategorien = document.getElementById('foto-kategorien');
  const fotoKategorienChips = document.getElementById('foto-kategorien-chips');
  const bausteineButton = document.getElementById('bausteine-button');
  const bausteinePanel = document.getElementById('bausteine-panel');
  const bausteineClose = document.getElementById('bausteine-close');
  const bausteineListe = document.getElementById('bausteine-liste');
  const printButton = document.getElementById('print-button');
  const mailButton = document.getElementById('mail-button');
  const allgemeinButton = document.getElementById('allgemein-button');
  const allgemeinPanel = document.getElementById('allgemein-panel');
  const allgemeinListe = document.getElementById('allgemein-liste');
  const allgemeinEinfuegen = document.getElementById('allgemein-einfuegen');
  const allgemeinAbbrechen = document.getElementById('allgemein-abbrechen');
  const detailMinus = document.getElementById('detail-minus');
  const detailPlus = document.getElementById('detail-plus');
  const detailLabel = document.getElementById('detail-label');
  const bearbeitenHinweis = document.getElementById('bearbeiten-hinweis');
  const bearbeitenAbbrechen = document.getElementById('bearbeiten-abbrechen');
  const typHinweisKnopf = document.getElementById('typ-hinweis');
  const typMangelKnopf = document.getElementById('typ-mangel');
  const ortungButton = document.getElementById('ortung-button');
  const standortBanner = document.getElementById('standort-banner');
  const standortText = document.getElementById('standort-text');
  const standortUebernehmen = document.getElementById('standort-uebernehmen');
  const standortOrdner = document.getElementById('standort-ordner');
  const standortSchliessen = document.getElementById('standort-schliessen');

  let aktuellesFoto = null;
  let bearbeitetIndex = null;   // Index im gefilterten Eintrags-Array
  let eingefuegt = [];
  let eintragTyp = 'hinweis';
  let aktuelleBaustelle = null;
  let erkannteBaustelle = null;

  // ---------- Speicher ----------

  function ladeJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function speichereJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* Speicher voll oder blockiert – App funktioniert weiter */ }
  }

  let nutzung = ladeJson('bp_nutzung', {});
  let eintraege = ladeJson('bp_eintraege', []);
  let varianten = ladeJson('bp_varianten', {});
  let aenderungen = ladeJson('bp_aenderungen', []);
  let detailStufe = ladeJson('bp_detail', 1);
  let verteiler = ladeJson('bp_verteiler', {});      // Baustellen-ID -> Verteiler-Text
  let standorte = ladeJson('bp_standorte', {});      // Baustellen-ID -> {lat, lng}
  let eigene = ladeJson('bp_baustellen_eigene', []); // selbst angelegte Baustellen
  let gruppenOffen = ladeJson('bp_gruppen_offen', { 'SEENTOUR Gmunden': true });

  function merkeNutzung(id) {
    nutzung[id] = (nutzung[id] || 0) + 1;
    speichereJson('bp_nutzung', nutzung);
  }

  function merkeAenderung(bausteinId, original, geaendert) {
    aenderungen.push({ zeit: new Date().toISOString(), baustein: bausteinId, original: original, geaendert: geaendert });
    if (aenderungen.length > 500) aenderungen = aenderungen.slice(-500);
    speichereJson('bp_aenderungen', aenderungen);
    if (bausteinId) {
      varianten[bausteinId] = geaendert;
      speichereJson('bp_varianten', varianten);
    }
  }

  function score(b) {
    return b.freq + (nutzung[b.id] || 0) * 2;
  }

  // ---------- Baustellen-Daten ----------

  function alleBaustellen() {
    return BAUSTELLEN.concat(eigene);
  }

  function verteilerAnzahl(bs) {
    const v = verteiler[bs.id];
    if (!v) return 0;
    return v.split(',').map(function (e) { return e.trim(); }).filter(Boolean).length;
  }

  // ---------- Ansicht 1: Baustellen-Liste ----------

  function renderGruppen() {
    const filter = sucheInput.value.trim().toLowerCase();
    gruppenContainer.innerHTML = '';
    GRUPPEN.forEach(function (gruppe) {
      const inGruppe = alleBaustellen().filter(function (bs) { return (bs.gruppe || GRUPPEN[0]) === gruppe; });
      const treffer = filter
        ? inGruppe.filter(function (bs) { return (bs.name + ' ' + (bs.ort || '')).toLowerCase().indexOf(filter) !== -1; })
        : inGruppe;
      if (filter && !treffer.length) return;

      const kopf = document.createElement('button');
      kopf.type = 'button';
      kopf.className = 'gruppe-kopf';
      const offen = filter ? true : !!gruppenOffen[gruppe];
      kopf.innerHTML = '<span class="gruppe-pfeil">' + (offen ? '&#9662;' : '&#9656;') + '</span>' +
        '<span class="gruppe-name"></span><span class="gruppe-anzahl"></span>';
      kopf.querySelector('.gruppe-name').textContent = gruppe;
      kopf.querySelector('.gruppe-anzahl').textContent = inGruppe.length;
      kopf.addEventListener('click', function () {
        gruppenOffen[gruppe] = !gruppenOffen[gruppe];
        speichereJson('bp_gruppen_offen', gruppenOffen);
        renderGruppen();
      });
      gruppenContainer.appendChild(kopf);

      if (offen) {
        treffer.forEach(function (bs) {
          const karte = document.createElement('button');
          karte.type = 'button';
          karte.className = 'baustelle-karte';
          const anzahl = verteilerAnzahl(bs);
          const unterzeile = (bs.ort ? bs.ort + ' · ' : '') +
            (anzahl ? 'Verteiler: ' + anzahl : '⚠️ kein Verteiler');
          karte.innerHTML = '<span class="karte-text"><span class="karte-name"></span>' +
            '<span class="karte-unterzeile"></span></span><span class="karte-pfeil">&#8250;</span>';
          karte.querySelector('.karte-name').textContent = bs.name;
          karte.querySelector('.karte-unterzeile').textContent = unterzeile;
          karte.addEventListener('click', function () { oeffneBaustelle(bs); });
          gruppenContainer.appendChild(karte);
        });
      }
    });
  }

  sucheInput.addEventListener('input', renderGruppen);

  // Neue Baustelle anlegen
  neuButton.addEventListener('click', function () {
    neuForm.hidden = !neuForm.hidden;
    if (!neuForm.hidden) {
      neuGruppe.innerHTML = '';
      GRUPPEN.forEach(function (g) {
        const o = document.createElement('option');
        o.value = g;
        o.textContent = g;
        neuGruppe.appendChild(o);
      });
      neuName.focus();
    }
  });

  neuAbbrechen.addEventListener('click', function () { neuForm.hidden = true; });

  neuForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = neuName.value.trim();
    if (!name) return;
    const bs = {
      id: 'eigene_' + Date.now(),
      name: name,
      ort: neuOrt.value.trim(),
      gruppe: neuGruppe.value,
      protokolle: []
    };
    eigene.push(bs);
    speichereJson('bp_baustellen_eigene', eigene);
    gruppenOffen[bs.gruppe] = true;
    speichereJson('bp_gruppen_offen', gruppenOffen);
    neuName.value = '';
    neuOrt.value = '';
    neuForm.hidden = true;
    renderGruppen();
  });

  listeDrucken.addEventListener('click', function () { window.print(); });
  listeBausteine.addEventListener('click', function () {
    bausteinePanel.hidden = false;
    renderBausteine();
  });

  // ---------- Ansicht 2: Protokoll ----------

  function oeffneBaustelle(bs) {
    aktuelleBaustelle = bs;
    ortInput.value = bs.name;
    protokollTitel.textContent = bs.name;
    viewListe.hidden = true;
    viewProtokoll.hidden = false;
    infoPanel.hidden = true;
    standortBanner.hidden = true;
    renderAlleEintraege();
    input.focus();
  }

  function zurueckZurListe() {
    aktuelleBaustelle = null;
    viewProtokoll.hidden = true;
    viewListe.hidden = false;
    bausteinePanel.hidden = true;
    renderGruppen();
  }

  zurueckButton.addEventListener('click', zurueckZurListe);

  infoButton.addEventListener('click', function () {
    infoPanel.hidden = !infoPanel.hidden;
    if (!infoPanel.hidden) renderInfo();
  });

  function renderInfo() {
    const bs = aktuelleBaustelle;
    infoVerteiler.value = verteiler[bs.id] || '';
    infoProtokolle.innerHTML = '';
    if (bs.protokolle && bs.protokolle.length) {
      const hint = document.createElement('div');
      hint.className = 'panel-hint';
      hint.textContent = 'Letzte Protokolle:';
      infoProtokolle.appendChild(hint);
      const liste = document.createElement('div');
      liste.className = 'protokoll-links';
      bs.protokolle.forEach(function (p) {
        const a = document.createElement('a');
        a.href = p.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = p.titel;
        liste.appendChild(a);
      });
      if (bs.ordnerUrl) {
        const a = document.createElement('a');
        a.href = bs.ordnerUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Drive-Ordner öffnen';
        liste.appendChild(a);
      }
      infoProtokolle.appendChild(liste);
    }
    infoPosition.textContent = standorte[bs.id]
      ? 'Position gespeichert – neu setzen'
      : 'Aktuelle Position speichern';
  }

  infoVerteiler.addEventListener('change', function () {
    const v = infoVerteiler.value.trim();
    if (v) verteiler[aktuelleBaustelle.id] = v;
    else delete verteiler[aktuelleBaustelle.id];
    speichereJson('bp_verteiler', verteiler);
  });

  infoPosition.addEventListener('click', function () {
    if (!navigator.geolocation || !aktuelleBaustelle) return;
    const bs = aktuelleBaustelle;
    navigator.geolocation.getCurrentPosition(function (pos) {
      standorte[bs.id] = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      speichereJson('bp_standorte', standorte);
      infoPosition.textContent = 'Position gespeichert – neu setzen';
    }, function () {
      infoPosition.textContent = 'Standort nicht verfügbar – GPS-Freigabe prüfen';
    }, { enableHighAccuracy: true, timeout: 8000 });
  });

  // ---------- Detailstufe (– kürzer / + länger mit Gesetzestext) ----------

  const stufenNamen = ['Kurz', 'Normal', '+ Gesetzestext'];

  function zeigeDetailStufe() {
    detailLabel.textContent = stufenNamen[detailStufe];
    detailMinus.disabled = detailStufe === 0;
    detailPlus.disabled = detailStufe === 2;
  }

  detailMinus.addEventListener('click', function () {
    if (detailStufe > 0) { detailStufe--; speichereJson('bp_detail', detailStufe); zeigeDetailStufe(); }
  });
  detailPlus.addEventListener('click', function () {
    if (detailStufe < 2) { detailStufe++; speichereJson('bp_detail', detailStufe); zeigeDetailStufe(); }
  });

  function bausteinText(b) {
    if (eintragTyp === 'mangel' && b.mangel) {
      if (detailStufe === 2 && b.gesetz) {
        return b.mangel + '\n' + b.gesetz.text + ' (' + b.gesetz.ref + ')';
      }
      return b.mangel;
    }
    const basis = varianten[b.id] || b.text;
    if (detailStufe === 0) return b.kurz || basis;
    if (detailStufe === 2 && b.gesetz) {
      return basis + '\n' + b.gesetz.text + ' (' + b.gesetz.ref + ')';
    }
    return basis;
  }

  // ---------- Eintragstyp: Hinweis / Mangel ----------

  function zeigeTyp() {
    typHinweisKnopf.classList.toggle('typ-aktiv', eintragTyp === 'hinweis');
    typMangelKnopf.classList.toggle('typ-aktiv', false);
    typMangelKnopf.classList.toggle('typ-aktiv-mangel', eintragTyp === 'mangel');
  }

  function wechsleFassung(text, zielTyp) {
    let neu = text;
    BAUSTEINE.forEach(function (b) {
      if (!b.mangel) return;
      if (zielTyp === 'mangel') {
        [varianten[b.id], b.text, b.kurz].filter(Boolean).forEach(function (f) {
          if (neu.indexOf(f) !== -1) neu = neu.split(f).join(b.mangel);
        });
      } else {
        if (neu.indexOf(b.mangel) !== -1) {
          neu = neu.split(b.mangel).join(detailStufe === 0 && b.kurz ? b.kurz : (varianten[b.id] || b.text));
        }
      }
    });
    return neu;
  }

  function setzeTyp(typ) {
    if (typ === eintragTyp) return;
    eintragTyp = typ;
    zeigeTyp();
    if (input.value.trim()) {
      input.value = wechsleFassung(input.value, typ);
      eingefuegt = eingefuegt.map(function (e) {
        const b = BAUSTEINE.find(function (x) { return x.id === e.id; });
        return b ? { id: e.id, text: bausteinText(b) } : e;
      });
      autoGrow();
      updateSendState();
    }
    zeigeVorschlaege(vorschlaegeFuer(input.value));
  }

  typHinweisKnopf.addEventListener('click', function () { setzeTyp('hinweis'); });
  typMangelKnopf.addEventListener('click', function () { setzeTyp('mangel'); });

  // ---------- Kürzel-Expansion ----------

  const kuerzelMap = {};
  BAUSTEINE.forEach(function (b) {
    b.kuerzel.forEach(function (k) { kuerzelMap[k.toLowerCase()] = b; });
  });

  function expandiereKuerzel(text, nurLetztesWort) {
    const regex = /(^|[\s.,;:!?()])([A-Za-zÄÖÜäöüß]+)$/;
    if (nurLetztesWort) {
      const m = text.match(regex);
      if (m) {
        const b = kuerzelMap[m[2].toLowerCase()];
        if (b) {
          merkeNutzung(b.id);
          const t = bausteinText(b);
          eingefuegt.push({ id: b.id, text: t });
          return text.slice(0, m.index + m[1].length) + t;
        }
      }
      return null;
    }
    return text.split(/\s+/).map(function (wort) {
      const kern = wort.replace(/[.,;:!?]+$/, '');
      const b = kuerzelMap[kern.toLowerCase()];
      if (b && kern === wort) {
        merkeNutzung(b.id);
        const t = bausteinText(b);
        eingefuegt.push({ id: b.id, text: t });
        return t;
      }
      return wort;
    }).join(' ');
  }

  // ---------- KI-Vorschlag (nur sicherheitsrelevante Bausteine) ----------

  function sicherheitsBausteine() {
    return BAUSTEINE.filter(function (b) { return b.sicherheit !== false; });
  }

  function vorschlaegeFuer(text) {
    const t = text.toLowerCase();
    if (t.trim().length < 3) return [];
    const treffer = [];
    sicherheitsBausteine().forEach(function (b) {
      let punkte = 0;
      b.keywords.forEach(function (kw) {
        if (t.indexOf(kw) !== -1) punkte += 10;
      });
      if (punkte > 0 && t.indexOf((varianten[b.id] || b.text).toLowerCase().slice(0, 40)) === -1) {
        treffer.push({ baustein: b, punkte: punkte + score(b) });
      }
    });
    const dabei = treffer.map(function (x) { return x.baustein.id; });
    treffer.slice().forEach(function (x) {
      (x.baustein.related || []).forEach(function (rid) {
        if (dabei.indexOf(rid) === -1) {
          const rb = BAUSTEINE.find(function (b) { return b.id === rid && b.sicherheit !== false; });
          if (rb && t.indexOf((varianten[rb.id] || rb.text).toLowerCase().slice(0, 40)) === -1) {
            treffer.push({ baustein: rb, punkte: score(rb) });
            dabei.push(rid);
          }
        }
      });
    });
    treffer.sort(function (a, b) { return b.punkte - a.punkte; });
    if (treffer.length < 3) {
      sicherheitsBausteine()
        .slice()
        .sort(function (a, b) { return score(b) - score(a); })
        .forEach(function (b) {
          if (treffer.length < 3 && dabei.indexOf(b.id) === -1 &&
              t.indexOf((varianten[b.id] || b.text).toLowerCase().slice(0, 40)) === -1) {
            treffer.push({ baustein: b, punkte: 0 });
            dabei.push(b.id);
          }
        });
    }
    return treffer.slice(0, 3).map(function (x) { return x.baustein; });
  }

  function chipFuer(b, onClick) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    if (b.icon && ICONS[b.icon]) {
      const span = document.createElement('span');
      span.className = 'chip-icon';
      span.innerHTML = ICONS[b.icon];
      chip.appendChild(span);
    }
    chip.appendChild(document.createTextNode(b.titel));
    chip.title = varianten[b.id] || b.text;
    chip.addEventListener('click', onClick);
    return chip;
  }

  function zeigeVorschlaege(liste) {
    kiChips.innerHTML = '';
    if (!liste.length) {
      kiPanel.hidden = true;
      return;
    }
    liste.forEach(function (b) {
      kiChips.appendChild(chipFuer(b, function () { fuegeTextEin(b); }));
    });
    zeigeDetailStufe();
    kiPanel.hidden = false;
  }

  function fuegeTextEin(b) {
    merkeNutzung(b.id);
    const t = bausteinText(b);
    eingefuegt.push({ id: b.id, text: t });
    const bisher = input.value.trim();
    input.value = bisher ? bisher + '\n' + t : t;
    updateSendState();
    autoGrow();
    input.focus();
    zeigeVorschlaege(vorschlaegeFuer(input.value));
    renderBausteine();
  }

  // ---------- Allgemeine Punkte ----------

  function renderAllgemein() {
    allgemeinListe.innerHTML = '';
    ALLGEMEINE_PUNKTE.forEach(function (p) {
      const label = document.createElement('label');
      label.className = 'allgemein-punkt';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.value = p.id;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + p.text));
      allgemeinListe.appendChild(label);
    });
  }

  allgemeinButton.addEventListener('click', function () {
    allgemeinPanel.hidden = !allgemeinPanel.hidden;
    if (!allgemeinPanel.hidden) renderAllgemein();
  });

  allgemeinAbbrechen.addEventListener('click', function () {
    allgemeinPanel.hidden = true;
  });

  allgemeinEinfuegen.addEventListener('click', function () {
    const gewaehlt = Array.prototype.slice.call(allgemeinListe.querySelectorAll('input:checked'))
      .map(function (cb) { return ALLGEMEINE_PUNKTE.find(function (p) { return p.id === cb.value; }); })
      .filter(Boolean);
    if (gewaehlt.length) {
      eintraege.push({
        zeit: zeitstempel(),
        bs: aktuelleBaustelle ? aktuelleBaustelle.id : null,
        ort: ortInput.value.trim(),
        titel: 'Allgemeine Punkte',
        text: gewaehlt.map(function (p) { return '• ' + p.text; }).join('\n'),
        foto: null
      });
      speichereJson('bp_eintraege', eintraege);
      renderAlleEintraege();
    }
    allgemeinPanel.hidden = true;
  });

  // ---------- Foto ----------

  fotoInput.addEventListener('change', function () {
    const file = fotoInput.files && fotoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      aktuellesFoto = reader.result;
      fotoPreviewImg.src = aktuellesFoto;
      fotoPreview.hidden = false;
      renderFotoKategorien();
      fotoKategorien.hidden = false;
      updateSendState();
    };
    reader.readAsDataURL(file);
  });

  fotoRemove.addEventListener('click', function () {
    aktuellesFoto = null;
    fotoInput.value = '';
    fotoPreview.hidden = true;
    fotoKategorien.hidden = true;
    updateSendState();
  });

  function renderFotoKategorien() {
    fotoKategorienChips.innerHTML = '';
    FOTO_KATEGORIEN.forEach(function (kat) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip chip-kategorie';
      chip.textContent = kat.label;
      chip.addEventListener('click', function () {
        const liste = kat.bausteine
          .map(function (id) { return BAUSTEINE.find(function (b) { return b.id === id; }); })
          .filter(Boolean)
          .sort(function (a, b) { return score(b) - score(a); });
        zeigeVorschlaege(liste);
      });
      fotoKategorienChips.appendChild(chip);
    });
  }

  // ---------- Textbaustein-Panel ----------

  function renderBausteine() {
    bausteineListe.innerHTML = '';
    BAUSTEINE.slice().sort(function (a, b) { return score(b) - score(a); }).forEach(function (b) {
      const li = document.createElement('li');
      const kopf = document.createElement('div');
      kopf.className = 'baustein-kopf';
      if (b.icon && ICONS[b.icon]) {
        const span = document.createElement('span');
        span.className = 'chip-icon';
        span.innerHTML = ICONS[b.icon];
        kopf.appendChild(span);
      }
      kopf.appendChild(document.createTextNode(b.titel));
      const kuerzel = document.createElement('span');
      kuerzel.className = 'baustein-kuerzel';
      kuerzel.textContent = b.kuerzel.join(', ');
      kopf.appendChild(kuerzel);
      const text = document.createElement('div');
      text.className = 'baustein-text';
      text.textContent = (varianten[b.id] || b.text) + (varianten[b.id] ? '  (eigene Fassung)' : '');
      li.appendChild(kopf);
      li.appendChild(text);
      li.addEventListener('click', function () {
        if (viewProtokoll.hidden) return; // aus der Liste heraus nur ansehen
        fuegeTextEin(b);
        bausteinePanel.hidden = true;
      });
      bausteineListe.appendChild(li);
    });
  }

  bausteineButton.addEventListener('click', function () {
    bausteinePanel.hidden = !bausteinePanel.hidden;
    if (!bausteinePanel.hidden) renderBausteine();
  });
  bausteineClose.addEventListener('click', function () {
    bausteinePanel.hidden = true;
  });

  // ---------- Einträge ----------

  function zeitstempel() {
    const d = new Date();
    const tage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const monate = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return tage[d.getDay()] + ' ' + p(d.getDate()) + ' ' + monate[d.getMonth()] + ' ' +
      p(d.getHours()) + ':' + p(d.getMinutes()) + ' ' + d.getFullYear();
  }

  // Einträge der aktuellen Baustelle (ältere Einträge über den Ort zugeordnet)
  function eintraegeAktuell() {
    if (!aktuelleBaustelle) return [];
    return eintraege.filter(function (e) {
      return e.bs === aktuelleBaustelle.id || (!e.bs && e.ort === aktuelleBaustelle.name);
    });
  }

  function starteBearbeitung(eintrag) {
    bearbeitetIndex = eintraege.indexOf(eintrag);
    eintragTyp = eintrag.typ === 'mangel' ? 'mangel' : 'hinweis';
    zeigeTyp();
    input.value = eintrag.text;
    bearbeitenHinweis.hidden = false;
    input.classList.add('bearbeitet');
    updateSendState();
    autoGrow();
    input.focus();
  }

  function beendeBearbeitung() {
    bearbeitetIndex = null;
    bearbeitenHinweis.hidden = true;
    input.classList.remove('bearbeitet');
    input.value = '';
    updateSendState();
    autoGrow();
  }

  bearbeitenAbbrechen.addEventListener('click', beendeBearbeitung);

  function renderEintrag(e) {
    const li = document.createElement('li');
    li.className = 'eintrag';

    const kopf = document.createElement('div');
    kopf.className = 'eintrag-kopf';
    const kopfText = document.createElement('span');
    kopfText.textContent = 'Erstellt: ' + e.zeit;
    kopf.appendChild(kopfText);

    if (e.typ === 'mangel') {
      const badge = document.createElement('span');
      badge.className = 'mangel-badge';
      badge.textContent = 'MANGEL';
      kopf.appendChild(badge);
    }

    const aktionen = document.createElement('span');
    aktionen.className = 'eintrag-aktionen';

    const bearbeiten = document.createElement('button');
    bearbeiten.type = 'button';
    bearbeiten.className = 'eintrag-knopf';
    bearbeiten.textContent = '✎';
    bearbeiten.title = 'Eintrag bearbeiten';
    bearbeiten.addEventListener('click', function () { starteBearbeitung(e); });
    aktionen.appendChild(bearbeiten);

    const loeschen = document.createElement('button');
    loeschen.type = 'button';
    loeschen.className = 'eintrag-knopf eintrag-loeschen';
    loeschen.textContent = '×';
    loeschen.title = 'Eintrag löschen';
    loeschen.addEventListener('click', function () {
      const idx = eintraege.indexOf(e);
      if (idx !== -1) eintraege.splice(idx, 1);
      speichereJson('bp_eintraege', eintraege);
      if (bearbeitetIndex === idx) beendeBearbeitung();
      renderAlleEintraege();
    });
    aktionen.appendChild(loeschen);
    kopf.appendChild(aktionen);
    li.appendChild(kopf);

    if (e.titel) {
      const titel = document.createElement('div');
      titel.className = 'eintrag-titel';
      titel.textContent = e.titel;
      li.appendChild(titel);
    }

    if (e.foto) {
      const img = document.createElement('img');
      img.className = 'eintrag-foto';
      img.src = e.foto;
      img.alt = 'Baustellenfoto';
      li.appendChild(img);
    }

    const text = document.createElement('div');
    text.className = 'eintrag-text';
    text.textContent = e.text;
    li.appendChild(text);

    if (e.icons && e.icons.length) {
      const icons = document.createElement('div');
      icons.className = 'eintrag-icons';
      e.icons.forEach(function (name) {
        if (ICONS[name]) {
          const s = document.createElement('span');
          s.innerHTML = ICONS[name];
          icons.appendChild(s);
        }
      });
      li.appendChild(icons);
    }

    messages.appendChild(li);
  }

  function renderAlleEintraege() {
    messages.innerHTML = '';
    eintraegeAktuell().forEach(renderEintrag);
    messages.scrollTop = messages.scrollHeight;
  }

  // ---------- Eingabe ----------

  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0 && !aktuellesFoto;
  }

  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 320) + 'px';
  }

  input.addEventListener('input', function () {
    updateSendState();
    autoGrow();
    zeigeVorschlaege(vorschlaegeFuer(input.value));
  });

  // ---------- Intelligente Satz-Markierung ----------

  const ABKUERZUNGEN = ['z.b', 'b', 'bzw', 'usw', 'ca', 'inkl', 'gem', 'abs', 'fa', 'ing', 'bmst', 'dipl', 'nr', 'max', 'min', 'evtl', 'ggf', 'lt', 'og', 'ug', 'eg'];

  function istSatzEnde(text, i) {
    const c = text[i];
    if (c === '\n') return true;
    if (c !== '.' && c !== '!' && c !== '?') return false;
    let w = i - 1;
    while (w >= 0 && /[A-Za-zÄÖÜäöüß0-9§]/.test(text[w])) w--;
    const wort = text.slice(w + 1, i).toLowerCase();
    if (ABKUERZUNGEN.indexOf(wort) !== -1) return false;
    if (/^\d+$/.test(wort) && /[§0-9]/.test(text.slice(Math.max(0, w - 3), w + 1))) return false;
    const nach = text[i + 1];
    return nach === undefined || /\s/.test(nach);
  }

  function satzGrenzen(text, pos) {
    let start = 0;
    for (let i = Math.min(pos, text.length) - 1; i >= 0; i--) {
      if (istSatzEnde(text, i)) { start = i + 1; break; }
    }
    let ende = text.length;
    for (let i = Math.min(pos, text.length); i < text.length; i++) {
      if (istSatzEnde(text, i)) { ende = text[i] === '\n' ? i : i + 1; break; }
    }
    while (start < ende && /\s/.test(text[start])) start++;
    return { start: start, ende: ende };
  }

  let vorherigeMarkierung = null;

  input.addEventListener('mousedown', function () {
    const aktiv = input.selectionStart !== input.selectionEnd &&
      vorherigeMarkierung &&
      input.selectionStart === vorherigeMarkierung.start &&
      input.selectionEnd === vorherigeMarkierung.ende;
    input.dataset.satzAktiv = aktiv ? '1' : '';
  });

  input.addEventListener('click', function () {
    const pos = input.selectionStart;
    if (input.selectionStart !== input.selectionEnd) return;
    const text = input.value;
    if (!text || pos > text.length) return;
    const zeichen = text[pos] || text[pos - 1];
    if (!zeichen || /\s/.test(zeichen)) { vorherigeMarkierung = null; return; }
    const g = satzGrenzen(text, pos);
    if (g.ende <= g.start) return;
    if (input.dataset.satzAktiv === '1' && vorherigeMarkierung &&
        pos >= vorherigeMarkierung.start && pos <= vorherigeMarkierung.ende) {
      vorherigeMarkierung = null;
      return;
    }
    input.setSelectionRange(g.start, g.ende);
    vorherigeMarkierung = g;
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === ' ') {
      const ersetzt = expandiereKuerzel(input.value, true);
      if (ersetzt !== null) {
        event.preventDefault();
        input.value = ersetzt + ' ';
        updateSendState();
        autoGrow();
        zeigeVorschlaege(vorschlaegeFuer(input.value));
      }
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  function iconsFuerText(text) {
    const t = text.toLowerCase();
    const icons = [];
    BAUSTEINE.forEach(function (b) {
      if (b.icon && icons.indexOf(b.icon) === -1) {
        const basis = (varianten[b.id] || b.text).toLowerCase().slice(0, 40);
        if (t.indexOf(basis) !== -1 || b.keywords.some(function (kw) { return t.indexOf(kw) !== -1; })) {
          icons.push(b.icon);
        }
      }
    });
    return icons.slice(0, 4);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    let text = input.value.trim();
    if (!text && !aktuellesFoto) return;
    if (text) text = expandiereKuerzel(text, false);

    eingefuegt.forEach(function (e) {
      if (text.indexOf(e.text) === -1) {
        merkeAenderung(eingefuegt.length === 1 ? e.id : null, e.text, text);
      }
    });

    if (bearbeitetIndex !== null && eintraege[bearbeitetIndex]) {
      const alt = eintraege[bearbeitetIndex];
      if (alt.text !== text) merkeAenderung(null, alt.text, text);
      alt.text = text;
      alt.typ = eintragTyp;
      alt.icons = iconsFuerText(text);
      speichereJson('bp_eintraege', eintraege);
      beendeBearbeitung();
    } else {
      eintraege.push({
        zeit: zeitstempel(),
        bs: aktuelleBaustelle ? aktuelleBaustelle.id : null,
        ort: ortInput.value.trim(),
        text: text,
        typ: eintragTyp,
        foto: aktuellesFoto,
        icons: iconsFuerText(text)
      });
      speichereJson('bp_eintraege', eintraege);
    }

    eingefuegt = [];
    aktuellesFoto = null;
    fotoInput.value = '';
    fotoPreview.hidden = true;
    fotoKategorien.hidden = true;
    kiPanel.hidden = true;
    input.value = '';
    setzeTyp('hinweis');
    updateSendState();
    autoGrow();
    renderAlleEintraege();
    input.focus();
  });

  printButton.addEventListener('click', function () {
    window.print();
  });

  // ---------- Protokoll per E-Mail ----------

  function baueMailto() {
    const bs = aktuelleBaustelle;
    const verteilerText = (bs && verteiler[bs.id]) || '';
    const empfaenger = verteilerText.split(',')
      .map(function (e) { return e.trim(); })
      .filter(function (e) { return e.indexOf('@') !== -1; });
    const d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    const datum = p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
    const betreff = 'Baustellenbesuchsprotokoll - BauKG' + (bs ? ' – ' + bs.name : '') + ' – ' + datum;
    const body = MAIL_TEXT + (verteilerText ? '\n\nVerteiler: ' + verteilerText : '');
    return 'mailto:' + encodeURIComponent(empfaenger.join(',')) +
      '?subject=' + encodeURIComponent(betreff) +
      '&body=' + encodeURIComponent(body);
  }

  mailButton.addEventListener('click', function () {
    window.location.href = baueMailto();
  });

  // ---------- GPS: Baustelle automatisch erkennen ----------

  function distanzKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function koordinatenFuer(bs) {
    if (standorte[bs.id]) return standorte[bs.id];
    if (typeof bs.lat === 'number') return { lat: bs.lat, lng: bs.lng };
    return null;
  }

  function naechsteBaustelle(lat, lng) {
    let beste = null;
    alleBaustellen().forEach(function (bs) {
      const k = koordinatenFuer(bs);
      if (!k) return;
      const d = distanzKm(lat, lng, k.lat, k.lng);
      if (!beste || d < beste.distanz) beste = { baustelle: bs, distanz: d };
    });
    return beste && beste.distanz <= 5 ? beste : null;
  }

  function zeigeStandort(treffer) {
    if (!treffer) {
      standortBanner.hidden = true;
      return;
    }
    erkannteBaustelle = treffer.baustelle;
    const dist = treffer.distanz < 1
      ? Math.round(treffer.distanz * 1000) + ' m'
      : treffer.distanz.toFixed(1).replace('.', ',') + ' km';
    standortText.textContent = 'Baustelle erkannt: ' + treffer.baustelle.name + ' (' + dist + ')';
    if (treffer.baustelle.ordnerUrl) standortOrdner.href = treffer.baustelle.ordnerUrl;
    else standortOrdner.removeAttribute('href');
    standortBanner.hidden = false;
  }

  function ermittleStandort(leise) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      const treffer = naechsteBaustelle(pos.coords.latitude, pos.coords.longitude);
      if (treffer && viewProtokoll.hidden) {
        // Aus der Liste heraus die erkannte Baustelle direkt öffnen
        oeffneBaustelle(treffer.baustelle);
        zeigeStandort(treffer);
        return;
      }
      zeigeStandort(treffer);
      if (!treffer && !leise) {
        standortText.textContent = 'Keine Baustelle in der Nähe (max. 5 km) gefunden.';
        standortOrdner.removeAttribute('href');
        standortBanner.hidden = false;
        erkannteBaustelle = null;
      }
    }, function () {
      if (!leise) {
        standortText.textContent = 'Standort nicht verfügbar – GPS-Freigabe prüfen.';
        standortBanner.hidden = false;
        erkannteBaustelle = null;
      }
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  }

  standortUebernehmen.addEventListener('click', function () {
    if (erkannteBaustelle) oeffneBaustelle(erkannteBaustelle);
    standortBanner.hidden = true;
  });

  standortSchliessen.addEventListener('click', function () {
    standortBanner.hidden = true;
  });

  ortungButton.addEventListener('click', function () { ermittleStandort(false); });

  // ---------- Start ----------

  zeigeDetailStufe();
  zeigeTyp();
  renderGruppen();
  ermittleStandort(true);
})();
