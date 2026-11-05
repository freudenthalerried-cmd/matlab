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
  const infoAdresse = document.getElementById('info-adresse');
  const infoGeocode = document.getElementById('info-geocode');
  const infoGeoStatus = document.getElementById('info-geo-status');
  const standortAdresse = document.getElementById('standort-adresse');

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');
  const ortInput = document.getElementById('ort-input');
  const kiFenster = document.getElementById('ki-fenster');
  const kiEingabe = document.getElementById('ki-eingabe');
  const kiBild = document.getElementById('ki-bild');
  const kiKeinBild = document.getElementById('ki-kein-bild');
  const kiQuelle = document.getElementById('ki-quelle');
  const kiSaetze = document.getElementById('ki-saetze');
  const kiVorschau = document.getElementById('ki-vorschau');
  const kiButton = document.getElementById('ki-button');
  const kiTextButton = document.getElementById('ki-text-button');
  const kiSchliessen = document.getElementById('ki-schliessen');
  const fotoInput = document.getElementById('foto-input');
  const galerieInput = document.getElementById('galerie-input');
  const fotoHinweis = document.getElementById('foto-hinweis');
  const kopfDatum = document.getElementById('kopf-datum');
  const kopfUhrzeit = document.getElementById('kopf-uhrzeit');
  const kopfNr = document.getElementById('kopf-nr');
  const kopfAnwesend = document.getElementById('kopf-anwesend');
  const kopfWetter = document.getElementById('kopf-wetter');
  const kopfAllgemein = document.getElementById('kopf-allgemein');
  const fotoPreview = document.getElementById('foto-preview');
  const fotoPreviewImg = document.getElementById('foto-preview-img');
  const fotoRemove = document.getElementById('foto-remove');
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
  let kiNurText = false;      // Vorschaufenster im reinen Text-Modus (ohne Foto)
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
  let adressen = ladeJson('bp_adressen', {});        // Baustellen-ID -> Adresstext
  let eigene = ladeJson('bp_baustellen_eigene', []); // selbst angelegte Baustellen
  let gruppenOffen = ladeJson('bp_gruppen_offen', { 'SEENTOUR Gmunden': true });
  let koepfe = ladeJson('bp_koepfe', {}); // "<BaustellenID>:<Nr>" -> Kopfdaten
  let aktuelleNr = 1;

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

  // ---------- Ebenen: Zurueck-Taste geht eine Ebene zurueck ----------

  // Jede geoeffnete Ebene (Protokoll, Panel, Fenster) legt einen Eintrag in der
  // Browser-History an. Die Zurueck-Taste des Handys schliesst dann die oberste
  // Ebene, statt die App zu verlassen. Erst auf der Baustellen-Liste beendet
  // Zurueck die App. Auch die Knoepfe in der App gehen ueber ebeneVerlassen(),
  // damit History und Ansicht nicht auseinanderlaufen.

  const ebenen = [];   // offene Ebenen, unterste zuerst

  function ebeneOffen(name) {
    return ebenen.some(function (e) { return e.name === name; });
  }

  function ebeneOeffnen(name, schliessen) {
    if (ebeneOffen(name)) return;
    ebenen.push({ name: name, schliessen: schliessen });
    history.pushState({ bp: ebenen.length }, '');
  }

  // Schliesst die Ebene ueber die History, damit ihr Eintrag mitgeht.
  // Die eigentliche Arbeit macht der popstate-Handler.
  function ebeneVerlassen(name) {
    if (ebeneOffen(name)) history.back();
  }

  // Oeffnen und Schliessen in einem – fuer Knoepfe, die ein Panel umschalten.
  function ebeneUmschalten(name, oeffnen, schliessen) {
    if (ebeneOffen(name)) {
      ebeneVerlassen(name);
    } else {
      oeffnen();
      ebeneOeffnen(name, schliessen);
    }
  }

  window.addEventListener('popstate', function () {
    const e = ebenen.pop();
    if (e) e.schliessen();
  });

  history.replaceState({ bp: 0 }, '');

  // ---------- Baustellen-Daten ----------

  function alleBaustellen() {
    return BAUSTELLEN.concat(eigene);
  }

  function verteilerAnzahl(bs) {
    const v = verteiler[bs.id] || bs.verteiler;
    if (!v) return bs.verteilerN || 0;
    return v.split(',').map(function (e) { return e.trim(); }).filter(Boolean).length;
  }

  // Badge wie in der ursprünglichen App: wann war der letzte Eintrag?
  function tageBadge(bs) {
    let neuester = 0;
    eintraege.forEach(function (e) {
      if ((e.bs === bs.id || (!e.bs && e.ort === bs.name)) && e.ts && e.ts > neuester) neuester = e.ts;
    });
    if (!neuester) return null;
    const tage = Math.floor((Date.now() - neuester) / 86400000);
    return tage <= 0 ? 'heute' : tage + ' Tg.';
  }

  // ---------- Ansicht 1: Baustellen-Liste ----------

  function renderGruppen() {
    const filter = sucheInput.value.trim().toLowerCase();
    gruppenContainer.innerHTML = '';
    GRUPPEN.forEach(function (gruppe) {
      const inGruppe = alleBaustellen().filter(function (bs) {
        return bs.aktiv !== false && (bs.gruppe || GRUPPEN[0]) === gruppe;
      });
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
          const unterzeile = (bs.ort ? bs.ort + ' · ' : '· ') +
            (anzahl ? 'Verteiler: ' + anzahl : '⚠️ kein Verteiler');
          const badge = tageBadge(bs);
          karte.innerHTML = '<span class="karte-text"><span class="karte-titelzeile">' +
            '<span class="karte-name"></span>' + (badge ? '<span class="karte-badge"></span>' : '') +
            '</span><span class="karte-unterzeile"></span></span><span class="karte-pfeil">&#8250;</span>';
          karte.querySelector('.karte-name').textContent = bs.name;
          if (badge) karte.querySelector('.karte-badge').textContent = badge;
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
      ebeneOeffnen('neu', function () { neuForm.hidden = true; });
    } else {
      ebeneVerlassen('neu');
    }
  });

  neuAbbrechen.addEventListener('click', function () { ebeneVerlassen('neu'); });

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
    ebeneVerlassen('neu');
    renderGruppen();
  });

  listeDrucken.addEventListener('click', function () { window.print(); });
  listeBausteine.addEventListener('click', function () {
    ebeneUmschalten('bausteine', function () {
      bausteinePanel.hidden = false;
      renderBausteine();
    }, function () { bausteinePanel.hidden = true; });
  });

  // ---------- Ansicht 2: Protokoll ----------

  function hoechsteNr(bsId) {
    let n = 0;
    Object.keys(koepfe).forEach(function (k) {
      if (k.indexOf(bsId + ':') === 0) n = Math.max(n, parseInt(k.split(':')[1], 10) || 0);
    });
    eintraege.forEach(function (e) {
      if (e.bs === bsId) n = Math.max(n, e.pn || 1);
    });
    return n;
  }

  function kopfKey() {
    return aktuelleBaustelle.id + ':' + aktuelleNr;
  }

  function ladeKopf() {
    const d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    const k = koepfe[kopfKey()] || {};
    kopfDatum.value = k.datum || (d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()));
    kopfUhrzeit.value = k.uhrzeit || (p(d.getHours()) + ':' + p(d.getMinutes()));
    kopfAnwesend.value = k.anwesend || 'Bmst. Ing. Stefan Freudenthaler';
    kopfWetter.value = k.wetter || '';
    kopfAllgemein.value = k.allgemein || '';
    kopfNr.value = aktuelleNr;
    protokollTitel.textContent = 'Protokoll Nr. ' + aktuelleNr;
  }

  function speichereKopf() {
    koepfe[kopfKey()] = {
      datum: kopfDatum.value,
      uhrzeit: kopfUhrzeit.value,
      anwesend: kopfAnwesend.value.trim(),
      wetter: kopfWetter.value.trim(),
      allgemein: kopfAllgemein.value.trim()
    };
    speichereJson('bp_koepfe', koepfe);
  }

  [kopfDatum, kopfUhrzeit, kopfAnwesend, kopfWetter, kopfAllgemein].forEach(function (el) {
    el.addEventListener('change', speichereKopf);
  });

  kopfNr.addEventListener('change', function () {
    const n = Math.max(1, parseInt(kopfNr.value, 10) || 1);
    aktuelleNr = n;
    ladeKopf();
    renderAlleEintraege();
  });

  function oeffneBaustelle(bs) {
    aktuelleBaustelle = bs;
    ortInput.value = bs.name;
    aktuelleNr = Math.max(1, hoechsteNr(bs.id));
    ladeKopf();
    viewListe.hidden = true;
    viewProtokoll.hidden = false;
    infoPanel.hidden = true;
    standortBanner.hidden = true;
    renderAlleEintraege();
    ebeneOeffnen('protokoll', zurueckZurListe);
  }

  function zurueckZurListe() {
    if (aktuelleBaustelle) speichereKopf();
    aktuelleBaustelle = null;
    viewProtokoll.hidden = true;
    viewListe.hidden = false;
    bausteinePanel.hidden = true;
    renderGruppen();
  }

  zurueckButton.addEventListener('click', function () {
    ebeneVerlassen('protokoll');
  });

  infoButton.addEventListener('click', function () {
    ebeneUmschalten('info', function () {
      infoPanel.hidden = false;
      renderInfo();
    }, function () { infoPanel.hidden = true; });
  });

  function renderInfo() {
    const bs = aktuelleBaustelle;
    infoVerteiler.value = verteiler[bs.id] || bs.verteiler || '';
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
    infoAdresse.value = adresseFuer(bs);
    infoGeoStatus.textContent = koordinatenFuer(bs)
      ? 'Koordinaten vorhanden – Baustelle wird per GPS erkannt.'
      : 'Noch keine Koordinaten – Adresse eintragen und ermitteln, oder vor Ort die Position speichern.';
  }

  function adresseFuer(bs) {
    if (adressen[bs.id]) return adressen[bs.id];
    if (bs.adresse) return bs.adresse;
    // Vorbelegung aus den Stammdaten, damit das Feld nicht leer bleibt
    return [bs.name, bs.ort].filter(Boolean).join(', ');
  }

  infoVerteiler.addEventListener('change', function () {
    const v = infoVerteiler.value.trim();
    if (v) verteiler[aktuelleBaustelle.id] = v;
    else delete verteiler[aktuelleBaustelle.id];
    speichereJson('bp_verteiler', verteiler);
  });

  infoAdresse.addEventListener('change', function () {
    if (!aktuelleBaustelle) return;
    const a = infoAdresse.value.trim();
    if (a) adressen[aktuelleBaustelle.id] = a;
    else delete adressen[aktuelleBaustelle.id];
    speichereJson('bp_adressen', adressen);
  });

  // Adresse -> Koordinaten uber OpenStreetMap (Nominatim). Wird nur auf
  // Knopfdruck aufgerufen; das Ergebnis bleibt dauerhaft gespeichert, damit
  // die Erkennung danach auch ohne Netz funktioniert.
  infoGeocode.addEventListener('click', function () {
    if (!aktuelleBaustelle) return;
    const bs = aktuelleBaustelle;
    const adresse = infoAdresse.value.trim();
    if (!adresse) {
      infoGeoStatus.textContent = 'Bitte zuerst eine Adresse eintragen.';
      return;
    }
    adressen[bs.id] = adresse;
    speichereJson('bp_adressen', adressen);

    infoGeocode.disabled = true;
    infoGeoStatus.textContent = 'Adresse wird gesucht …';
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=at&q=' +
      encodeURIComponent(adresse);
    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
      .then(function (daten) {
        if (!daten.length) {
          infoGeoStatus.textContent = 'Adresse nicht gefunden – bitte genauer angeben (Straße, PLZ, Ort).';
          return;
        }
        standorte[bs.id] = { lat: parseFloat(daten[0].lat), lng: parseFloat(daten[0].lon) };
        speichereJson('bp_standorte', standorte);
        infoGeoStatus.textContent = 'Koordinaten gespeichert: ' + (daten[0].display_name || adresse);
        infoPosition.textContent = 'Position gespeichert – neu setzen';
      })
      .catch(function () {
        infoGeoStatus.textContent = 'Adresssuche nicht erreichbar – vor Ort die Position speichern.';
      })
      .then(function () { infoGeocode.disabled = false; });
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
    if (detailStufe > 0) { detailStufe--; speichereJson('bp_detail', detailStufe); rendereKiSaetze(); }
  });
  detailPlus.addEventListener('click', function () {
    if (detailStufe < 2) { detailStufe++; speichereJson('bp_detail', detailStufe); rendereKiSaetze(); }
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

  // Umlaute vereinheitlichen, damit "Kuenette" und "Künette" gleich gefunden werden.
  function normiere(text) {
    return String(text || '').toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }

  // Ein Suchwort trifft, wenn ein Wort damit beginnt (Gasflasche -> Gasflaschen)
  // oder – ab 5 Buchstaben – in einem zusammengesetzten Wort steckt
  // (Dachrand -> Dachrandsicherung). Mehrwortbegriffe muessen als Ganzes vorkommen.
  function trifft(kw, normText, woerter) {
    const k = normiere(kw);
    if (k.indexOf(' ') !== -1) return normText.indexOf(k) !== -1;
    return woerter.some(function (w) {
      return w.indexOf(k) === 0 || (k.length >= 5 && w.indexOf(k) !== -1);
    });
  }

  function schonImText(b, t) {
    return t.indexOf((varianten[b.id] || b.text).toLowerCase().slice(0, 40)) !== -1;
  }

  // Nur echte Treffer – keine "beliebtesten" Bausteine als Lückenfüller mehr,
  // die mit dem Text nichts zu tun haben.
  function vorschlaegeFuer(text) {
    const t = text.toLowerCase();
    if (t.trim().length < 3) return [];
    const normText = normiere(text);
    const woerter = normText.split(/[^a-z0-9§-]+/).filter(Boolean);
    const treffer = [];
    sicherheitsBausteine().forEach(function (b) {
      let punkte = 0;
      b.keywords.forEach(function (kw) {
        if (trifft(kw, normText, woerter)) punkte += 10 + normiere(kw).length;
      });
      if (punkte > 0 && !schonImText(b, t)) {
        treffer.push({ baustein: b, punkte: punkte + score(b) });
      }
    });
    treffer.sort(function (a, b) { return b.punkte - a.punkte; });
    return treffer.slice(0, 3).map(function (x) { return x.baustein; });
  }

  // ---------- Echte Foto-/Text-Analyse mit Claude (optional, eigener API-Schlüssel) ----------

  const CLAUDE_MODELL = 'claude-opus-5-5';
  let claudeSchluessel = ladeJson('bp_claude_key', '');
  let claudeErgebnis = null;   // { quelle, erkannt, vorschlaege } der letzten Analyse
  let claudeLaeuft = false;

  function bausteinKatalog() {
    return sicherheitsBausteine().map(function (b) {
      return b.id + ' | ' + b.titel + ' | ' + b.kurz + (b.gesetz ? ' (' + b.gesetz.ref + ')' : '');
    }).join('\n');
  }

  const CLAUDE_SYSTEM =
    'Du bist Baustellenkoordinator (BauKG) in Österreich und schreibst Einträge für ' +
    'Baustellenbesuchsprotokolle „Sicherheit am Bau“. Rechtsgrundlagen: BauKG, BauV, ASchG, AM-VO.\n' +
    'Regeln:\n' +
    '- Beschreibe nur, was auf dem Foto bzw. im Text tatsächlich erkennbar ist. Nichts erfinden.\n' +
    '- Höchstens 3 Vorschläge, der wichtigste zuerst. Nur sicherheitsrelevante Punkte.\n' +
    '- Passt ein Baustein aus dem Katalog, gib seine ID an (baustein_id) und lass text leer.\n' +
    '- Passt keiner, baustein_id leer lassen und einen eigenen Satz im Protokollstil schreiben ' +
    '(sachlich, max. 2 Sätze, Anweisungsform wie „… ist zu …“). Paragraphen nur nennen, wenn du dir sicher bist.\n' +
    '- mangel = true nur bei einem klar erkennbaren Verstoß.\n' +
    '- Ist nichts Sicherheitsrelevantes zu erkennen, gib eine leere Liste zurück.\n\n' +
    'Baustein-Katalog (ID | Titel | Kurzfassung):\n';

  const CLAUDE_SCHEMA = {
    type: 'object',
    properties: {
      erkannt: { type: 'string' },
      vorschlaege: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            baustein_id: { type: 'string' },
            text: { type: 'string' },
            mangel: { type: 'boolean' }
          },
          required: ['baustein_id', 'text', 'mangel'],
          additionalProperties: false
        }
      }
    },
    required: ['erkannt', 'vorschlaege'],
    additionalProperties: false
  };

  // Foto vor dem Senden verkleinern (spart Zeit und Kosten).
  function verkleinere(dataUrl) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () {
        const max = 1280;
        const f = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * f);
        c.height = Math.round(img.height * f);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  function frageClaude(text, foto) {
    const inhalt = [];
    const vorbereitung = foto ? verkleinere(foto) : Promise.resolve(null);
    return vorbereitung.then(function (bild) {
      if (bild) {
        const teile = bild.split(',');
        const typ = (teile[0].match(/data:(.*?);/) || [])[1] || 'image/jpeg';
        inhalt.push({ type: 'image', source: { type: 'base64', media_type: typ, data: teile[1] } });
      }
      inhalt.push({
        type: 'text',
        text: (aktuelleBaustelle ? 'Baustelle: ' + aktuelleBaustelle.name + '\n' : '') +
          (text ? 'Notiz des Koordinators: ' + text : 'Analysiere das Foto.')
      });
      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': claudeSchluessel,
          'anthropic-version': '2026-10-21',
          'anthropic-beta': 'server-side-fallback-2026-07-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: CLAUDE_MODELL,
          max_tokens: 16000,
          fallbacks: 'default',
          output_config: { effort: 'low', format: { type: 'json_schema', schema: CLAUDE_SCHEMA } },
          system: CLAUDE_SYSTEM + bausteinKatalog(),
          messages: [{ role: 'user', content: inhalt }]
        })
      });
    }).then(function (r) {
      return r.json().then(function (daten) {
        if (!r.ok) {
          const msg = (daten && daten.error && daten.error.message) || ('HTTP ' + r.status);
          throw new Error(r.status === 401 ? 'Schlüssel ungültig' : msg);
        }
        if (daten.stop_reason === 'refusal') throw new Error('Anfrage abgelehnt');
        const block = (daten.content || []).find(function (c) { return c.type === 'text'; });
        if (!block) throw new Error('Keine Antwort');
        return JSON.parse(block.text);
      });
    });
  }

  function starteClaude() {
    if (!claudeSchluessel || claudeLaeuft) return;
    const text = kiEingabe.value.trim();
    const foto = !kiNurText ? aktuellesFoto : null;
    if (!text && !foto) return;
    claudeLaeuft = true;
    claudeErgebnis = null;
    rendereKiSaetze();
    frageClaude(text, foto).then(function (erg) {
      claudeErgebnis = { quelle: text + '|' + (foto ? foto.length : 0), erkannt: erg.erkannt, vorschlaege: erg.vorschlaege || [] };
    }).catch(function (err) {
      claudeErgebnis = { quelle: text + '|' + (foto ? foto.length : 0), fehler: err.message || String(err), vorschlaege: [] };
    }).then(function () {
      claudeLaeuft = false;
      if (!kiFenster.hidden) rendereKiSaetze();
    });
  }

  function schluesselEintragen() {
    const neu = window.prompt(
      'Claude-API-Schlüssel (sk-ant-…) für echte Foto-Analyse.\n' +
      'Wird nur auf diesem Gerät gespeichert. Leer lassen = KI-Analyse aus.',
      claudeSchluessel || '');
    if (neu === null) return;
    claudeSchluessel = neu.trim();
    speichereJson('bp_claude_key', claudeSchluessel);
    claudeErgebnis = null;
    rendereKiSaetze();
  }

  function freierVorschlag(v) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ki-satz';
    knopf.textContent = (v.mangel ? 'MANGEL: ' : '') + v.text;
    knopf.addEventListener('click', function () {
      if (v.mangel) setzeTyp('mangel');
      const bisher = input.value.trim();
      input.value = bisher ? bisher + '\n' + v.text : v.text;
      updateSendState();
      autoGrow();
      ebeneVerlassen('ki');
      input.focus();
    });
    return knopf;
  }

  function kleinerKnopf(text, aktion) {
    const k = document.createElement('button');
    k.type = 'button';
    k.className = 'chip chip-kategorie';
    k.textContent = text;
    k.addEventListener('click', aktion);
    return k;
  }

  // Ein Vorschlag ist hochstens drei Satze lang.
  function dreiSaetze(text) {
    const saetze = String(text || '').trim().match(/[^.!?]+[.!?]*/g) || [];
    return saetze
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');
  }

  // Hauptwort fett: das erste Wort im Baustein, das zu einem Suchwort passt –
  // bevorzugt das Suchwort, das im Thema (Eingabetext) vorkommt.
  function hauptwortStelle(text, b, thema) {
    const normThema = normiere(thema || '');
    const themaWoerter = normThema.split(/[^a-z0-9§-]+/).filter(Boolean);
    const woerter = [];
    const re = /[A-Za-zÄÖÜäöüß-]+/g;
    let m;
    while ((m = re.exec(text))) woerter.push({ wort: m[0], pos: m.index, norm: normiere(m[0]) });
    let beste = null;
    if (b.haupt) {
      const hw = woerter.find(function (x) { return x.norm.indexOf(normiere(b.haupt)) === 0; });
      if (hw) beste = { w: hw, imThema: false, haupt: true };
    }
    b.keywords.forEach(function (kw) {
      const k = normiere(kw);
      if (k.indexOf(' ') !== -1 || k.length < 3) return;
      const w = woerter.find(function (x) {
        return x.norm.indexOf(k) === 0 || (k.length >= 5 && x.norm.indexOf(k) !== -1);
      });
      if (!w) return;
      const imThema = thema ? trifft(kw, normThema, themaWoerter) : false;
      if (!beste || (imThema && !beste.imThema) ||
          (imThema === beste.imThema && !beste.haupt && w.pos < beste.w.pos)) {
        beste = { w: w, imThema: imThema };
      }
    });
    return beste ? { start: beste.w.pos, ende: beste.w.pos + beste.w.wort.length } : null;
  }

  function mitHauptwort(ziel, text, b, thema) {
    const st = hauptwortStelle(text, b, thema);
    if (!st) { ziel.appendChild(document.createTextNode(text)); return; }
    ziel.appendChild(document.createTextNode(text.slice(0, st.start)));
    const fett = document.createElement('strong');
    fett.textContent = text.slice(st.start, st.ende);
    ziel.appendChild(fett);
    ziel.appendChild(document.createTextNode(text.slice(st.ende)));
  }

  function satzZeile(b, thema, nachKlick) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ki-satz';
    if (b.icon && ICONS[b.icon]) {
      const span = document.createElement('span');
      span.className = 'chip-icon';
      span.innerHTML = ICONS[b.icon];
      knopf.appendChild(span);
    }
    mitHauptwort(knopf, dreiSaetze(bausteinText(b)), b, thema);
    knopf.addEventListener('click', function () {
      fuegeTextEin(b);
      if (nachKlick) nachKlick(); else ebeneVerlassen('ki');
    });
    return knopf;
  }

  // Reihenfolge: Claude-Analyse (falls Schlüssel) -> Treffer aus dem Text ->
  // ohne Schlüssel beim Foto die Themen-Auswahl "Was ist zu sehen?".
  function rendereKiSaetze() {
    const text = kiEingabe.value.trim();
    const foto = !kiNurText && aktuellesFoto;
    const quelle = text + '|' + (foto ? foto.length : 0);
    kiSaetze.innerHTML = '';

    if (claudeLaeuft) {
      kiQuelle.textContent = 'KI analysiert …';
    } else if (claudeErgebnis && claudeErgebnis.quelle === quelle) {
      if (claudeErgebnis.fehler) {
        kiQuelle.textContent = 'KI-Fehler: ' + claudeErgebnis.fehler;
      } else {
        kiQuelle.textContent = 'KI erkennt: ' + (claudeErgebnis.erkannt || '–');
        if (!claudeErgebnis.vorschlaege.length) {
          const leer = document.createElement('div');
          leer.className = 'panel-hint';
          leer.textContent = 'Nichts Sicherheitsrelevantes erkannt.';
          kiSaetze.appendChild(leer);
        }
        claudeErgebnis.vorschlaege.slice(0, 3).forEach(function (v) {
          const b = v.baustein_id && BAUSTEINE.find(function (x) { return x.id === v.baustein_id; });
          if (b) {
            const z = satzZeile(b, kiEingabe.value + ' ' + (claudeErgebnis.erkannt || ''));
            if (v.mangel) z.addEventListener('click', function () { setzeTyp('mangel'); }, true);
            kiSaetze.appendChild(z);
          } else if (v.text) {
            kiSaetze.appendChild(freierVorschlag(v));
          }
        });
      }
    } else if (text) {
      const liste = vorschlaegeFuer(text);
      kiQuelle.textContent = liste.length
        ? 'Passende Bausteine zu deinem Text:'
        : 'Kein passender Baustein gefunden.';
      liste.forEach(function (b) { kiSaetze.appendChild(satzZeile(b, text)); });
      eigeneFuer(text, 2).forEach(function (tr) { kiSaetze.appendChild(meinTextZeile(tr)); });
      const eigen = freierVorschlag({ text: text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? '' : '.'), mangel: false });
      if (liste.length) eigen.classList.add('ki-satz-eigen');
      kiSaetze.appendChild(eigen);
    } else if (foto) {
      kiQuelle.textContent = claudeSchluessel
        ? 'Foto wird analysiert …'
        : 'Was ist am Foto zu sehen? (oder Stichwort eintippen)';
      if (!claudeSchluessel) {
        const chips = document.createElement('div');
        chips.className = 'chips';
        FOTO_KATEGORIEN.forEach(function (k) {
          chips.appendChild(kleinerKnopf(k.label, function () {
            kiSaetze.innerHTML = '';
            kiQuelle.textContent = k.label + ':';
            k.bausteine.forEach(function (id) {
              const b = BAUSTEINE.find(function (x) { return x.id === id; });
              if (b) kiSaetze.appendChild(satzZeile(b));
            });
          }));
        });
        kiSaetze.appendChild(chips);
      }
    } else {
      kiQuelle.textContent = kiNurText ? 'Bitte Text eingeben.' : 'Bitte Text eingeben oder ein Foto aufnehmen.';
    }

    const aktionen = document.createElement('div');
    aktionen.className = 'chips ki-claude';
    if (claudeSchluessel && (text || foto) && !claudeLaeuft) {
      aktionen.appendChild(kleinerKnopf(foto ? 'Foto mit KI prüfen' : 'KI fragen', starteClaude));
    }
    aktionen.appendChild(kleinerKnopf(claudeSchluessel ? 'KI-Schlüssel ändern' : 'Echte Foto-KI einrichten', schluesselEintragen));
    kiSaetze.appendChild(aktionen);
    zeigeDetailStufe();
  }

  // nurText = true: Fenster ohne Foto-Vorschau, Vorschlage nur aus dem Eingabefeld.
  // vorgabe: Text, der gleich im Eingabefeld steht (z. B. aus dem Diktat).
  function oeffneKiFenster(nurText, vorgabe) {
    kiNurText = !!nurText;
    kiVorschau.hidden = kiNurText;
    kiBild.src = kiNurText ? '' : (aktuellesFoto || '');
    kiBild.hidden = kiNurText || !aktuellesFoto;
    kiKeinBild.hidden = kiNurText || !!aktuellesFoto;
    kiEingabe.placeholder = kiNurText
      ? 'Text eingeben'
      : 'Text eingeben \u2013 leer lassen, dann wird das Foto analysiert';
    kiEingabe.value = vorgabe || '';
    rendereKiSaetze();
    kiFenster.hidden = false;
    if (!kiNurText && aktuellesFoto && claudeSchluessel &&
        !(claudeErgebnis && claudeErgebnis.quelle === kiEingabe.value.trim() + '|' + aktuellesFoto.length)) {
      starteClaude();
    }
    if (!vorgabe) kiEingabe.focus();
    ebeneOeffnen('ki', schliesseKiFenster);
  }

  function schliesseKiFenster() {
    kiFenster.hidden = true;
  }

  kiEingabe.addEventListener('input', rendereKiSaetze);
  kiButton.addEventListener('click', function () { oeffneKiFenster(false); });
  kiTextButton.addEventListener('click', function () { oeffneKiFenster(true); });
  kiSchliessen.addEventListener('click', function () { ebeneVerlassen('ki'); });
  kiFenster.addEventListener('click', function (event) {
    if (event.target === kiFenster) ebeneVerlassen('ki');
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !kiFenster.hidden) ebeneVerlassen('ki');
  });

  function fuegeTextEin(b) {
    merkeNutzung(b.id);
    const t = bausteinText(b);
    eingefuegt.push({ id: b.id, text: t });
    const bisher = input.value.trim();
    input.value = bisher ? bisher + '\n' + t : t;
    updateSendState();
    autoGrow();
    input.focus();
    renderBausteine();
  }

  // ---------- Eigene Texte merken ----------
  // Selbst geschriebene Sätze werden gespeichert und später passend zum Thema
  // vorgeschlagen. Kurze Sätze (unter MIN_WOERTER Wörtern) werden nicht gemerkt.

  const MIN_WOERTER = 5;
  const FUELLWOERTER = ['sind', 'wird', 'werden', 'wurde', 'wurden', 'nicht', 'eine', 'einer', 'einem',
    'einen', 'eines', 'dass', 'oder', 'auch', 'noch', 'beim', 'sowie', 'durch', 'gegen', 'ueber',
    'unter', 'nach', 'haben', 'diese', 'dieser', 'dieses', 'dort', 'hier', 'bitte', 'vorhanden',
    'umgehend', 'baustelle', 'mangel', 'immer', 'wieder', 'muss', 'muessen', 'soll', 'sollen', 'kein',
    'keine', 'ohne', 'sowie', 'wurde', 'ebenfalls', 'aktuell', 'derzeit'];

  function kernWoerter(text) {
    return normiere(text).split(/[^a-z0-9]+/).filter(function (w) {
      return w.length >= 4 && FUELLWOERTER.indexOf(w) === -1;
    });
  }

  function istBausteinText(satz) {
    const n = normiere(satz).replace(/\s+/g, ' ').trim();
    return BAUSTEINE.some(function (b) {
      return [varianten[b.id], b.text, b.kurz, b.mangel].filter(Boolean).some(function (f) {
        const nf = normiere(f).replace(/\s+/g, ' ').trim();
        return nf === n || nf.indexOf(n) !== -1 || n.indexOf(nf.slice(0, 40)) !== -1;
      });
    }) || ALLGEMEINE_PUNKTE.some(function (pkt) { return normiere(pkt.text).indexOf(n) !== -1; });
  }

  function zerlegeSaetze(text) {
    return String(text || '').split(/\n+/).reduce(function (alle, zeile) {
      return alle.concat(zeile.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/));
    }, []).map(function (x) { return x.replace(/^[•\-–]\s*/, '').trim(); }).filter(Boolean);
  }

  let eigeneTexte = ladeJson('bp_eigene_texte', null);

  function merkeEigeneTexte(text, speichern) {
    zerlegeSaetze(text).forEach(function (satz) {
      if (satz.split(/\s+/).length < MIN_WOERTER || istBausteinText(satz)) return;
      const key = normiere(satz).replace(/\s+/g, ' ');
      const da = eigeneTexte.find(function (e) { return normiere(e.text).replace(/\s+/g, ' ') === key; });
      if (da) { da.n++; da.zuletzt = Date.now(); }
      else eigeneTexte.push({ text: satz, n: 1, zuletzt: Date.now() });
    });
    if (eigeneTexte.length > 300) {
      eigeneTexte.sort(function (a, b) { return (b.n * 1e13 + b.zuletzt) - (a.n * 1e13 + a.zuletzt); });
      eigeneTexte = eigeneTexte.slice(0, 300);
    }
    if (speichern !== false) speichereJson('bp_eigene_texte', eigeneTexte);
  }

  // Beim ersten Start mit dieser Funktion: bisherige Einträge übernehmen.
  if (!Array.isArray(eigeneTexte)) {
    eigeneTexte = [];
    eintraege.forEach(function (e) { merkeEigeneTexte(e.text, false); });
    speichereJson('bp_eigene_texte', eigeneTexte);
  }

  // Eigene Texte, die zum Thema passen (gemeinsame Kernwörter oder gleiches Baustein-Thema).
  function eigeneFuer(thema, max) {
    const themaKern = kernWoerter(thema);
    if (!themaKern.length) return [];
    const themaBs = vorschlaegeFuer(thema).map(function (b) { return b.id; });
    const nThema = normiere(thema).replace(/\s+/g, ' ').trim();
    return eigeneTexte.map(function (e) {
      if (normiere(e.text).replace(/\s+/g, ' ').trim() === nThema) return null;
      const kern = kernWoerter(e.text);
      let punkte = 0;
      let wort = null;
      themaKern.forEach(function (tw) {
        const k = kern.find(function (w) { return w.indexOf(tw) === 0 || tw.indexOf(w) === 0 || (tw.length >= 6 && w.indexOf(tw) !== -1); });
        if (k) { punkte += 10; if (!wort) wort = tw; }
      });
      if (themaBs.length) {
        const eBs = vorschlaegeFuer(e.text).map(function (b) { return b.id; });
        if (eBs.some(function (id) { return themaBs.indexOf(id) !== -1; })) punkte += 8;
      }
      return punkte ? { e: e, punkte: punkte + Math.min(e.n, 5), wort: wort } : null;
    }).filter(Boolean).sort(function (a, b) { return b.punkte - a.punkte; }).slice(0, max || 2);
  }

  function meinTextZeile(treffer, nachKlick) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'ki-satz ki-satz-mein';
    const marke = document.createElement('span');
    marke.className = 'mein-marke';
    marke.textContent = 'Mein Text';
    knopf.appendChild(marke);
    const t = treffer.e.text;
    // Hauptwort fett: erstes Wort, das zum Thema passt
    const re = /[A-Za-zÄÖÜäöüß-]+/g;
    let m, stelle = null;
    while (treffer.wort && (m = re.exec(t))) {
      const nw = normiere(m[0]);
      if (nw.indexOf(treffer.wort) === 0 || treffer.wort.indexOf(nw) === 0 && nw.length >= 4 ||
          (treffer.wort.length >= 6 && nw.indexOf(treffer.wort) !== -1)) { stelle = m; break; }
    }
    if (stelle) {
      knopf.appendChild(document.createTextNode(t.slice(0, stelle.index)));
      const f = document.createElement('strong');
      f.textContent = stelle[0];
      knopf.appendChild(f);
      knopf.appendChild(document.createTextNode(t.slice(stelle.index + stelle[0].length)));
    } else {
      knopf.appendChild(document.createTextNode(t));
    }
    knopf.addEventListener('click', function () {
      treffer.e.n++;
      treffer.e.zuletzt = Date.now();
      speichereJson('bp_eigene_texte', eigeneTexte);
      const bisher = input.value.trim();
      input.value = bisher ? bisher + '\n' + t : t;
      updateSendState();
      autoGrow();
      if (nachKlick) nachKlick(); else ebeneVerlassen('ki');
      input.focus();
    });
    return knopf;
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
    ebeneUmschalten('allgemein', function () {
      allgemeinPanel.hidden = false;
      renderAllgemein();
    }, function () { allgemeinPanel.hidden = true; });
  });

  allgemeinAbbrechen.addEventListener('click', function () {
    ebeneVerlassen('allgemein');
  });

  allgemeinEinfuegen.addEventListener('click', function () {
    const gewaehlt = Array.prototype.slice.call(allgemeinListe.querySelectorAll('input:checked'))
      .map(function (cb) { return ALLGEMEINE_PUNKTE.find(function (p) { return p.id === cb.value; }); })
      .filter(Boolean);
    if (gewaehlt.length) {
      eintraege.push({
        zeit: zeitstempel(),
        ts: Date.now(),
        pn: aktuelleNr,
        bs: aktuelleBaustelle ? aktuelleBaustelle.id : null,
        ort: ortInput.value.trim(),
        titel: 'Allgemeine Punkte',
        text: gewaehlt.map(function (p) { return '• ' + p.text; }).join('\n'),
        foto: null
      });
      speichereJson('bp_eintraege', eintraege);
      renderAlleEintraege();
    }
    ebeneVerlassen('allgemein');
  });

  // ---------- Foto ----------

  function verarbeiteFoto(quelle) {
    const file = quelle.files && quelle.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      aktuellesFoto = reader.result;
      fotoPreviewImg.src = aktuellesFoto;
      fotoPreview.hidden = false;
      updateSendState();
      fotoHinweis.hidden = true;
      oeffneKiFenster(false);
    };
    reader.readAsDataURL(file);
  }

  fotoInput.addEventListener('change', function () { verarbeiteFoto(fotoInput); });
  galerieInput.addEventListener('change', function () { verarbeiteFoto(galerieInput); });

  // ---------- Eigene Kamera: Auslöser lang drücken = Foto mit Diktat ----------
  // Die System-Kamera sperrt das Mikrofon für die Web-App, daher eine eigene
  // Kamera-Ansicht. Kurz tippen auf "Foto aufnehmen" öffnet weiter die System-Kamera.

  const fotoKnopf = document.getElementById('foto-knopf');
  const kamera = document.getElementById('kamera');
  const kameraVideo = document.getElementById('kamera-video');
  const kameraDiktat = document.getElementById('kamera-diktat');
  const kameraAusloeser = document.getElementById('kamera-ausloeser');
  const kameraZu = document.getElementById('kamera-zu');
  const Spracherkennung = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANG_DRUECKEN_MS = 450;

  let kameraStrom = null;
  let kameraNachher = null;     // läuft nach dem Schließen (Foto übernehmen)
  let haltePointer = null;      // Finger, der gerade den Auslöser hält
  let langDruckTimer = null;
  let langGedrueckt = false;
  let diktat = null;
  let diktatFertig = '';
  let diktatZwischen = '';
  let diktatEnde = null;
  let ausloesenLaeuft = false;

  function zeigeDiktat(text) {
    kameraDiktat.textContent = text;
    kameraDiktat.hidden = !text;
  }

  function starteDiktat() {
    if (diktat) return;
    if (!Spracherkennung) {
      zeigeDiktat('Diktat auf diesem Gerät nicht verfügbar');
      return;
    }
    diktatFertig = '';
    diktatZwischen = '';
    const r = new Spracherkennung();
    r.lang = 'de-AT';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = function (ev) {
      let fertig = '';
      let zwischen = '';
      for (let i = 0; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fertig += t; else zwischen += t;
      }
      diktatFertig = fertig;
      diktatZwischen = zwischen;
      zeigeDiktat((fertig + ' ' + zwischen).trim() || 'Sprechen …');
    };
    r.onerror = function (ev) {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        zeigeDiktat('Mikrofon nicht erlaubt – in den Browser-Einstellungen freigeben');
      }
    };
    r.onend = function () {
      diktat = null;
      kamera.classList.remove('diktiert');
      if (diktatEnde) { const f = diktatEnde; diktatEnde = null; f(); }
    };
    diktat = r;
    kamera.classList.add('diktiert');
    zeigeDiktat('Sprechen …');
    try { r.start(); } catch (e) { diktat = null; kamera.classList.remove('diktiert'); }
  }

  // Stoppt das Diktat und liefert den erkannten Text (wartet kurz auf das Endergebnis).
  function beendeDiktat() {
    return new Promise(function (resolve) {
      function fertig() {
        resolve((diktatFertig + ' ' + diktatZwischen).replace(/\s+/g, ' ').trim());
      }
      if (!diktat) { fertig(); return; }
      diktatEnde = fertig;
      try { diktat.stop(); } catch (e) { diktatEnde = null; fertig(); return; }
      setTimeout(function () {
        if (diktatEnde === fertig) { diktatEnde = null; fertig(); }
      }, 2000);
    });
  }

  function oeffneKamera(mitDiktat, pointerId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      fotoInput.click();
      return;
    }
    kameraNachher = null;
    ausloesenLaeuft = false;
    kamera.hidden = false;
    zeigeDiktat('');
    ebeneOeffnen('kamera', schliesseKamera);
    if (mitDiktat) {
      haltePointer = pointerId;
      starteDiktat();
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      audio: false
    }).then(function (strom) {
      if (kamera.hidden) { strom.getTracks().forEach(function (t) { t.stop(); }); return; }
      kameraStrom = strom;
      kameraVideo.srcObject = strom;
    }).catch(function () {
      zeigeDiktat('Kamera nicht erlaubt – schließen und kurz auf „Foto aufnehmen“ tippen');
    });
  }

  function schliesseKamera() {
    haltePointer = null;
    if (diktat) { diktatEnde = null; try { diktat.abort(); } catch (e) { /* egal */ } }
    if (kameraStrom) kameraStrom.getTracks().forEach(function (t) { t.stop(); });
    kameraStrom = null;
    kameraVideo.srcObject = null;
    kamera.hidden = true;
    kamera.classList.remove('diktiert', 'blitz');
    const nachher = kameraNachher;
    kameraNachher = null;
    if (nachher) nachher();
  }

  function ausloesen() {
    if (ausloesenLaeuft || kamera.hidden) return;
    if (!kameraStrom || !kameraVideo.videoWidth) {
      // Kamera noch nicht bereit: auslösen, sobald das erste Bild da ist
      if (kameraStrom || !kameraDiktat.textContent.startsWith('Kamera nicht')) {
        kameraVideo.addEventListener('loadeddata', ausloesen, { once: true });
      }
      return;
    }
    ausloesenLaeuft = true;
    const c = document.createElement('canvas');
    c.width = kameraVideo.videoWidth;
    c.height = kameraVideo.videoHeight;
    c.getContext('2d').drawImage(kameraVideo, 0, 0, c.width, c.height);
    const foto = c.toDataURL('image/jpeg', 0.85);
    kamera.classList.add('blitz');
    beendeDiktat().then(function (text) {
      kameraNachher = function () {
        setzeVorschauFoto(foto);
        fotoHinweis.hidden = true;
        oeffneKiFenster(false, text);
      };
      ebeneVerlassen('kamera');
    });
  }

  // Langes Drücken auf "Foto aufnehmen"
  fotoKnopf.addEventListener('pointerdown', function (ev) {
    if (ev.button !== undefined && ev.button > 0) return;
    langGedrueckt = false;
    clearTimeout(langDruckTimer);
    const id = ev.pointerId;
    langDruckTimer = setTimeout(function () {
      langGedrueckt = true;
      if (navigator.vibrate) navigator.vibrate(30);
      oeffneKamera(true, id);
    }, LANG_DRUECKEN_MS);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
    fotoKnopf.addEventListener(t, function () { clearTimeout(langDruckTimer); });
  });
  fotoKnopf.addEventListener('click', function (ev) {
    if (langGedrueckt) { ev.preventDefault(); langGedrueckt = false; }
  });
  fotoKnopf.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

  // Auslöser in der Kamera: tippen = Foto, halten = diktieren, loslassen = Foto
  let ausloeserTimer = null;
  kameraAusloeser.addEventListener('pointerdown', function (ev) {
    ev.preventDefault();
    haltePointer = ev.pointerId;
    clearTimeout(ausloeserTimer);
    ausloeserTimer = setTimeout(starteDiktat, 300);
  });
  kameraAusloeser.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

  document.addEventListener('pointerup', function (ev) {
    if (haltePointer === null || ev.pointerId !== haltePointer) return;
    haltePointer = null;
    clearTimeout(ausloeserTimer);
    if (!kamera.hidden) ausloesen();
  });
  // Bricht das System den Druck ab, läuft das Diktat weiter – dann zum Auslösen tippen.
  document.addEventListener('pointercancel', function (ev) {
    if (haltePointer === null || ev.pointerId !== haltePointer) return;
    haltePointer = null;
    clearTimeout(ausloeserTimer);
  });

  kameraZu.addEventListener('click', function () { ebeneVerlassen('kamera'); });

  // ---------- Rückgängig-Leiste ----------

  const undoLeiste = document.createElement('div');
  undoLeiste.className = 'undo-leiste';
  undoLeiste.hidden = true;
  const undoText = document.createElement('span');
  const undoKnopf = document.createElement('button');
  undoKnopf.type = 'button';
  undoKnopf.textContent = 'Rückgängig';
  undoLeiste.appendChild(undoText);
  undoLeiste.appendChild(undoKnopf);
  document.body.appendChild(undoLeiste);
  let undoAktion = null;
  let undoTimer = null;

  function zeigeUndo(text, aktion) {
    undoText.textContent = text;
    undoAktion = aktion;
    undoLeiste.hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { undoLeiste.hidden = true; undoAktion = null; }, 10000);
  }

  undoKnopf.addEventListener('click', function () {
    clearTimeout(undoTimer);
    undoLeiste.hidden = true;
    const a = undoAktion;
    undoAktion = null;
    if (a) a();
  });

  function setzeVorschauFoto(foto) {
    aktuellesFoto = foto;
    fotoPreviewImg.src = foto || '';
    fotoPreview.hidden = !foto;
    updateSendState();
  }

  fotoRemove.addEventListener('click', function () {
    const vorher = aktuellesFoto;
    setzeVorschauFoto(null);
    fotoInput.value = '';
    galerieInput.value = '';
    if (vorher) zeigeUndo('Foto entfernt', function () { setzeVorschauFoto(vorher); });
  });

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
      mitHauptwort(text, varianten[b.id] || b.text, b, '');
      if (varianten[b.id]) text.appendChild(document.createTextNode('  (eigene Fassung)'));
      li.appendChild(kopf);
      li.appendChild(text);
      li.addEventListener('click', function () {
        if (viewProtokoll.hidden) return; // aus der Liste heraus nur ansehen
        fuegeTextEin(b);
        ebeneVerlassen('bausteine');
      });
      bausteineListe.appendChild(li);
    });

    if (!eigeneTexte.length) return;
    const kopfMein = document.createElement('li');
    kopfMein.className = 'mein-kopf';
    kopfMein.textContent = 'Meine Texte (' + eigeneTexte.length + ') – werden passend zum Thema vorgeschlagen';
    bausteineListe.appendChild(kopfMein);
    eigeneTexte.slice().sort(function (a, b) { return b.n - a.n || b.zuletzt - a.zuletzt; }).forEach(function (e) {
      const li = document.createElement('li');
      li.className = 'mein-text';
      const t = document.createElement('div');
      t.className = 'baustein-text';
      t.textContent = e.text + (e.n > 1 ? '  (' + e.n + '×)' : '');
      const weg = document.createElement('button');
      weg.type = 'button';
      weg.className = 'eintrag-knopf eintrag-loeschen';
      weg.textContent = '×';
      weg.title = 'Text vergessen';
      weg.addEventListener('click', function (ev) {
        ev.stopPropagation();
        const idx = eigeneTexte.indexOf(e);
        if (idx === -1) return;
        eigeneTexte.splice(idx, 1);
        speichereJson('bp_eigene_texte', eigeneTexte);
        renderBausteine();
        zeigeUndo('Text vergessen', function () {
          eigeneTexte.splice(Math.min(idx, eigeneTexte.length), 0, e);
          speichereJson('bp_eigene_texte', eigeneTexte);
          renderBausteine();
        });
      });
      li.appendChild(t);
      li.appendChild(weg);
      li.addEventListener('click', function () {
        if (viewProtokoll.hidden) return;
        const bisher = input.value.trim();
        input.value = bisher ? bisher + '\n' + e.text : e.text;
        updateSendState();
        autoGrow();
        ebeneVerlassen('bausteine');
      });
      bausteineListe.appendChild(li);
    });
  }

  bausteineButton.addEventListener('click', function () {
    ebeneUmschalten('bausteine', function () {
      bausteinePanel.hidden = false;
      renderBausteine();
    }, function () { bausteinePanel.hidden = true; });
  });
  bausteineClose.addEventListener('click', function () {
    ebeneVerlassen('bausteine');
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
      const gleicheBs = e.bs === aktuelleBaustelle.id || (!e.bs && e.ort === aktuelleBaustelle.name);
      return gleicheBs && (e.pn || 1) === aktuelleNr;
    });
  }

  function starteBearbeitung(eintrag) {
    bearbeitetIndex = eintraege.indexOf(eintrag);
    eintragTyp = eintrag.typ === 'mangel' ? 'mangel' : 'hinweis';
    zeigeTyp();
    input.value = eintrag.text;
    bearbeitenHinweis.hidden = false;
    input.classList.add('bearbeitet');
    ebeneOeffnen('bearbeiten', beendeBearbeitung);
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
    ebeneVerlassen('bearbeiten');
  }

  bearbeitenAbbrechen.addEventListener('click', function () {
    ebeneVerlassen('bearbeiten');
  });

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

    const griff = document.createElement('button');
    griff.type = 'button';
    griff.className = 'eintrag-knopf eintrag-griff';
    griff.textContent = '⠿';
    griff.title = 'Ziehen zum Verschieben';
    griff.setAttribute('aria-label', 'Eintrag verschieben');
    griff.addEventListener('pointerdown', function (ev) { starteZiehen(ev, li); });
    aktionen.appendChild(griff);

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
      if (idx === -1) return;
      if (bearbeitetIndex === idx) beendeBearbeitung();
      eintraege.splice(idx, 1);
      if (bearbeitetIndex !== null && bearbeitetIndex > idx) bearbeitetIndex--;
      speichereJson('bp_eintraege', eintraege);
      renderAlleEintraege();
      zeigeUndo('Eintrag gelöscht', function () {
        eintraege.splice(Math.min(idx, eintraege.length), 0, e);
        if (bearbeitetIndex !== null && bearbeitetIndex >= idx) bearbeitetIndex++;
        speichereJson('bp_eintraege', eintraege);
        renderAlleEintraege();
      });
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
      const rahmen = document.createElement('div');
      rahmen.className = 'eintrag-foto-rahmen';
      const img = document.createElement('img');
      img.className = 'eintrag-foto';
      img.src = e.foto;
      img.alt = 'Baustellenfoto';
      rahmen.appendChild(img);
      const weg = document.createElement('button');
      weg.type = 'button';
      weg.className = 'foto-remove eintrag-foto-weg';
      weg.innerHTML = '&times;';
      weg.title = 'Foto entfernen';
      weg.addEventListener('click', function () {
        const foto = e.foto;
        e.foto = null;
        speichereJson('bp_eintraege', eintraege);
        renderAlleEintraege();
        zeigeUndo('Foto entfernt', function () {
          e.foto = foto;
          speichereJson('bp_eintraege', eintraege);
          renderAlleEintraege();
        });
      });
      rahmen.appendChild(weg);
      li.appendChild(rahmen);
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

    eintragZuLi.set(li, e);
    messages.appendChild(li);
  }

  // ---------- Einträge per Drag & Drop verschieben (Maus und Finger) ----------

  const eintragZuLi = new WeakMap();
  let ziehen = null;

  function starteZiehen(ev, li) {
    if (ev.button !== undefined && ev.button !== 0) return;
    ev.preventDefault();
    ziehen = { li: li, id: ev.pointerId };
    li.classList.add('wird-gezogen');
    try { ev.target.setPointerCapture(ev.pointerId); } catch (err) { /* egal */ }
    document.addEventListener('pointermove', beimZiehen);
    document.addEventListener('pointerup', endeZiehen);
    document.addEventListener('pointercancel', endeZiehen);
  }

  function beimZiehen(ev) {
    if (!ziehen || ev.pointerId !== ziehen.id) return;
    ev.preventDefault();
    const y = ev.clientY;
    const andere = Array.prototype.filter.call(messages.children, function (x) { return x !== ziehen.li; });
    let ziel = null;
    for (let i = 0; i < andere.length; i++) {
      const r = andere[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { ziel = andere[i]; break; }
    }
    if (ziel) {
      if (ziehen.li.nextSibling !== ziel) messages.insertBefore(ziehen.li, ziel);
    } else if (messages.lastChild !== ziehen.li) {
      messages.appendChild(ziehen.li);
    }
    // Am Bildschirmrand mitscrollen
    if (y < 60) window.scrollBy(0, -12);
    else if (y > window.innerHeight - 60) window.scrollBy(0, 12);
  }

  function endeZiehen(ev) {
    if (!ziehen || ev.pointerId !== ziehen.id) return;
    ziehen.li.classList.remove('wird-gezogen');
    ziehen = null;
    document.removeEventListener('pointermove', beimZiehen);
    document.removeEventListener('pointerup', endeZiehen);
    document.removeEventListener('pointercancel', endeZiehen);

    // Neue Reihenfolge der sichtbaren Einträge in ihre bisherigen Plätze
    // im Gesamt-Array zurückschreiben (andere Protokolle bleiben unberührt).
    const neu = Array.prototype.map.call(messages.children, function (x) { return eintragZuLi.get(x); })
      .filter(Boolean);
    const bearbeitet = bearbeitetIndex !== null ? eintraege[bearbeitetIndex] : null;
    const plaetze = neu.map(function (e) { return eintraege.indexOf(e); })
      .filter(function (i) { return i !== -1; })
      .sort(function (a, b) { return a - b; });
    if (plaetze.length !== neu.length) { renderAlleEintraege(); return; }
    plaetze.forEach(function (platz, i) { eintraege[platz] = neu[i]; });
    if (bearbeitet) bearbeitetIndex = eintraege.indexOf(bearbeitet);
    speichereJson('bp_eintraege', eintraege);
  }

  // ---------- Offene Mängel aus dem letzten Protokoll ----------
  // Mängel aus Protokoll Nr. n-1 werden in Nr. n angezeigt (und gedruckt),
  // solange sie nicht mit × entfernt werden. Ältere Protokolle sind nicht mehr relevant.

  let maengelWeg = ladeJson('bp_maengel_weg', {}); // "<bs>:<nr>" -> [Schlüssel]
  const altMaengelBox = document.createElement('div');
  altMaengelBox.className = 'alt-maengel';
  altMaengelBox.hidden = true;
  messages.parentNode.insertBefore(altMaengelBox, messages);

  function istMangel(e) {
    return e.typ === 'mangel' || /^\s*MANGEL\b/i.test(e.text || '');
  }

  function mangelSchluessel(e) {
    return String(e.ts || (e.zeit + '|' + (e.text || '').slice(0, 40)));
  }

  function eintraegeVon(nr) {
    return eintraege.filter(function (e) {
      const gleicheBs = e.bs === aktuelleBaustelle.id || (!e.bs && e.ort === aktuelleBaustelle.name);
      return gleicheBs && (e.pn || 1) === nr;
    });
  }

  // Liefert [{ e, von }] – offene Mängel, die in Protokoll nr angezeigt werden.
  function offeneMaengel(nr) {
    if (!aktuelleBaustelle || nr <= 1) return [];
    const vorher = nr - 1;
    const weg = maengelWeg[aktuelleBaustelle.id + ':' + nr] || [];
    return eintraegeVon(vorher).filter(istMangel).map(function (e) {
      return { e: e, von: vorher };
    }).filter(function (x) {
      return weg.indexOf(mangelSchluessel(x.e)) === -1;
    });
  }

  function datumVon(nr) {
    const k = koepfe[aktuelleBaustelle.id + ':' + nr];
    if (!k || !k.datum) return '';
    const t = k.datum.split('-');
    return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : k.datum;
  }

  function renderAltMaengel() {
    const liste = offeneMaengel(aktuelleNr);
    altMaengelBox.innerHTML = '';
    altMaengelBox.hidden = !liste.length;
    if (!liste.length) return;
    const kopf = document.createElement('div');
    kopf.className = 'alt-maengel-kopf';
    kopf.textContent = 'Offene Mängel aus dem letzten Protokoll (' + liste.length + ')';
    altMaengelBox.appendChild(kopf);
    liste.forEach(function (x) {
      const zeile = document.createElement('div');
      zeile.className = 'alt-mangel';
      if (x.e.foto) {
        const img = document.createElement('img');
        img.src = x.e.foto;
        img.alt = 'Foto';
        zeile.appendChild(img);
      }
      const inhalt = document.createElement('div');
      inhalt.className = 'alt-mangel-inhalt';
      const herkunft = document.createElement('div');
      herkunft.className = 'alt-mangel-herkunft';
      herkunft.textContent = 'Aus Protokoll Nr. ' + x.von + (datumVon(x.von) ? ' vom ' + datumVon(x.von) : '');
      const text = document.createElement('div');
      text.textContent = x.e.text;
      inhalt.appendChild(herkunft);
      inhalt.appendChild(text);
      zeile.appendChild(inhalt);
      const weg = document.createElement('button');
      weg.type = 'button';
      weg.className = 'eintrag-knopf eintrag-loeschen alt-mangel-weg';
      weg.textContent = '×';
      weg.title = 'Nicht mehr anführen';
      weg.setAttribute('aria-label', 'Mangel entfernen');
      weg.addEventListener('click', function () {
        const key = aktuelleBaustelle.id + ':' + aktuelleNr;
        const sk = mangelSchluessel(x.e);
        maengelWeg[key] = (maengelWeg[key] || []).concat([sk]);
        speichereJson('bp_maengel_weg', maengelWeg);
        renderAltMaengel();
        zeigeUndo('Mangel entfernt', function () {
          maengelWeg[key] = (maengelWeg[key] || []).filter(function (k) { return k !== sk; });
          speichereJson('bp_maengel_weg', maengelWeg);
          renderAltMaengel();
        });
      });
      zeile.appendChild(weg);
      altMaengelBox.appendChild(zeile);
    });
  }

  function renderAlleEintraege() {
    messages.innerHTML = '';
    renderAltMaengel();
    const aktuelle = eintraegeAktuell();
    aktuelle.forEach(renderEintrag);
    const hatFoto = aktuelle.some(function (e) { return e.foto; }) || !!aktuellesFoto;
    fotoHinweis.hidden = hatFoto || aktuelle.length > 0;
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
  });

  // ---------- Langes Drücken ins Textfeld: Bausteine zum aktuellen Thema ----------

  const themaFenster = document.getElementById('thema-fenster');
  const themaTitel = document.getElementById('thema-titel');
  const themaListe = document.getElementById('thema-liste');
  const themaSchliessen = document.getElementById('thema-schliessen');
  let themaTimer = null;
  let themaStart = null;
  let themaGeoeffnet = false;

  // Thema = Satz an der Cursor-Stelle, sonst ganzer Text, sonst letzter Eintrag.
  function aktuellesThema() {
    const text = input.value;
    if (text.trim()) {
      const g = satzGrenzen(text, input.selectionStart || 0);
      const satz = text.slice(g.start, g.ende).trim();
      if (satz && vorschlaegeFuer(satz).length) return satz;
      return text.trim();
    }
    const alle = eintraegeAktuell();
    return alle.length ? alle[alle.length - 1].text : '';
  }

  function bausteineZumThema(thema) {
    const treffer = thema ? vorschlaegeFuer(thema) : [];
    const ids = treffer.map(function (b) { return b.id; });
    // verwandte Bausteine des besten Treffers ergänzen
    treffer.slice(0, 2).forEach(function (b) {
      (b.related || []).forEach(function (rid) {
        const rb = BAUSTEINE.find(function (x) { return x.id === rid && x.sicherheit !== false; });
        if (rb && ids.indexOf(rid) === -1 && treffer.length < 5) { treffer.push(rb); ids.push(rid); }
      });
    });
    return treffer;
  }

  function oeffneThemaFenster() {
    const thema = aktuellesThema();
    let liste = bausteineZumThema(thema);
    const kurz = thema.length > 40 ? thema.slice(0, 40) + '…' : thema;
    if (liste.length || eigeneFuer(thema, 1).length) {
      themaTitel.textContent = 'Bausteine zu „' + kurz + '“';
    } else {
      liste = sicherheitsBausteine().slice().sort(function (a, b) { return score(b) - score(a); }).slice(0, 5);
      themaTitel.textContent = thema ? 'Kein Bezug gefunden – häufig verwendet:' : 'Häufig verwendet:';
    }
    themaListe.innerHTML = '';
    liste.forEach(function (b) {
      themaListe.appendChild(satzZeile(b, thema, function () { ebeneVerlassen('thema'); }));
    });
    eigeneFuer(thema, 3).forEach(function (tr) {
      themaListe.appendChild(meinTextZeile(tr, function () { ebeneVerlassen('thema'); }));
    });
    themaFenster.hidden = false;
    ebeneOeffnen('thema', function () { themaFenster.hidden = true; });
  }

  input.addEventListener('pointerdown', function (ev) {
    if (ev.button !== undefined && ev.button > 0) return;
    themaGeoeffnet = false;
    themaStart = { x: ev.clientX, y: ev.clientY };
    clearTimeout(themaTimer);
    themaTimer = setTimeout(function () {
      themaTimer = null;
      themaGeoeffnet = true;
      if (navigator.vibrate) navigator.vibrate(20);
      oeffneThemaFenster();
    }, 550);
  });
  input.addEventListener('pointermove', function (ev) {
    if (themaStart && Math.abs(ev.clientX - themaStart.x) + Math.abs(ev.clientY - themaStart.y) > 12) {
      clearTimeout(themaTimer);
      themaTimer = null;
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
    input.addEventListener(t, function () { clearTimeout(themaTimer); themaTimer = null; themaStart = null; });
  });
  // Nur wenn das Fenster aufging, das System-Menü (Einfügen/Markieren) unterdrücken.
  input.addEventListener('contextmenu', function (ev) {
    if (themaGeoeffnet || themaTimer) {
      clearTimeout(themaTimer);
      themaTimer = null;
      if (!themaGeoeffnet) { themaGeoeffnet = true; oeffneThemaFenster(); }
      ev.preventDefault();
    }
  });
  themaSchliessen.addEventListener('click', function () { ebeneVerlassen('thema'); });
  themaFenster.addEventListener('click', function (ev) {
    if (ev.target === themaFenster) ebeneVerlassen('thema');
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
      merkeEigeneTexte(text);
      alt.typ = eintragTyp;
      alt.icons = iconsFuerText(text);
      speichereJson('bp_eintraege', eintraege);
      beendeBearbeitung();
    } else {
      eintraege.push({
        zeit: zeitstempel(),
        ts: Date.now(),
        pn: aktuelleNr,
        bs: aktuelleBaustelle ? aktuelleBaustelle.id : null,
        ort: ortInput.value.trim(),
        text: text,
        typ: eintragTyp,
        foto: aktuellesFoto,
        icons: iconsFuerText(text)
      });
      speichereJson('bp_eintraege', eintraege);
      if (text) merkeEigeneTexte(text);
    }

    eingefuegt = [];
    aktuellesFoto = null;
    fotoInput.value = '';
    galerieInput.value = '';
    fotoPreview.hidden = true;
    ebeneVerlassen('ki');
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
    const verteilerText = (bs && (verteiler[bs.id] || bs.verteiler)) || '';
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

  // Bis hierher gilt man als "auf der Baustelle" – dann wird das Protokoll
  // direkt geoeffnet. Weiter entfernte Baustellen werden nur vorgeschlagen.
  const ANKUNFT_KM = 0.25;
  const UMKREIS_KM = 5;

  function naechsteBaustelle(lat, lng) {
    let beste = null;
    alleBaustellen().forEach(function (bs) {
      if (bs.aktiv === false) return;
      const k = koordinatenFuer(bs);
      if (!k) return;
      const d = distanzKm(lat, lng, k.lat, k.lng);
      if (!beste || d < beste.distanz) beste = { baustelle: bs, distanz: d };
    });
    return beste && beste.distanz <= UMKREIS_KM ? beste : null;
  }

  function distanzText(km) {
    return km < 1
      ? Math.round(km * 1000) + ' m'
      : km.toFixed(1).replace('.', ',') + ' km';
  }

  function zeigeStandort(treffer) {
    if (!treffer) {
      standortBanner.hidden = true;
      return;
    }
    erkannteBaustelle = treffer.baustelle;
    standortText.textContent = 'Baustelle erkannt: ' + treffer.baustelle.name +
      ' (' + distanzText(treffer.distanz) + ')';
    standortAdresse.textContent = adressen[treffer.baustelle.id] || treffer.baustelle.ort || '';
    if (treffer.baustelle.ordnerUrl) standortOrdner.href = treffer.baustelle.ordnerUrl;
    else standortOrdner.removeAttribute('href');
    standortBanner.hidden = false;
  }

  function ohneKoordinaten() {
    return alleBaustellen().filter(function (bs) {
      return bs.aktiv !== false && !koordinatenFuer(bs);
    }).length;
  }

  // Wird sowohl beim Start, per Knopf als auch laufend von watchPosition
  // aufgerufen. Nur bei einem echten Wechsel wird automatisch geoeffnet,
  // damit die Ansicht nicht dauernd umspringt.
  let zuletztGeoeffnet = null;

  function verarbeiteStandort(lat, lng, leise) {
    const treffer = naechsteBaustelle(lat, lng);

    if (treffer && treffer.distanz <= ANKUNFT_KM && viewProtokoll.hidden &&
        zuletztGeoeffnet !== treffer.baustelle.id) {
      // Angekommen: Protokoll der Baustelle sofort oeffnen
      zuletztGeoeffnet = treffer.baustelle.id;
      oeffneBaustelle(treffer.baustelle);
      zeigeStandort(treffer);
      return;
    }

    if (treffer) {
      zeigeStandort(treffer);
      return;
    }

    erkannteBaustelle = null;
    zuletztGeoeffnet = null;
    if (!leise) {
      const offen = ohneKoordinaten();
      standortText.textContent = 'Keine Baustelle in der Nähe (max. ' + UMKREIS_KM + ' km) gefunden.';
      standortAdresse.textContent = offen
        ? offen + ' Baustelle(n) ohne Koordinaten – Adresse unter „Verteiler / Protokolle“ eintragen.'
        : '';
      standortOrdner.removeAttribute('href');
      standortBanner.hidden = false;
    }
  }

  function ermittleStandort(leise) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      verarbeiteStandort(pos.coords.latitude, pos.coords.longitude, leise);
    }, function () {
      if (!leise) {
        standortText.textContent = 'Standort nicht verfügbar – GPS-Freigabe prüfen.';
        standortAdresse.textContent = '';
        standortBanner.hidden = false;
        erkannteBaustelle = null;
      }
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  }

  // Laufende Ortung: erkennt die Ankunft auch dann, wenn die App schon offen ist.
  function starteUeberwachung() {
    if (!navigator.geolocation || !navigator.geolocation.watchPosition) return;
    navigator.geolocation.watchPosition(function (pos) {
      verarbeiteStandort(pos.coords.latitude, pos.coords.longitude, true);
    }, function () { /* stiller Fehler – der Knopf bleibt als Rueckfallebene */ },
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 });
  }

  standortUebernehmen.addEventListener('click', function () {
    if (erkannteBaustelle) {
      zuletztGeoeffnet = erkannteBaustelle.id;
      oeffneBaustelle(erkannteBaustelle);
    }
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
  starteUeberwachung();
})();
