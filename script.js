(function () {
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

  let aktuellesFoto = null;      // dataURL
  let bearbeitetIndex = null;    // Index des Eintrags, der gerade bearbeitet wird
  let eingefuegt = [];           // im aktuellen Eintrag eingefügte Bausteine [{id, text}]

  // ---------- Speicher (lernt aus der Verwendung) ----------

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

  let nutzung = ladeJson('bp_nutzung', {});       // Baustein-ID -> wie oft verwendet
  let eintraege = ladeJson('bp_eintraege', []);
  let varianten = ladeJson('bp_varianten', {});   // Baustein-ID -> vom Benutzer geänderte Fassung
  let aenderungen = ladeJson('bp_aenderungen', []); // Änderungs-Log für die Datenbank
  let detailStufe = ladeJson('bp_detail', 1);     // 0 = kurz, 1 = normal, 2 = + Gesetzestext
  ortInput.value = ladeJson('bp_ort', '');

  function merkeNutzung(id) {
    nutzung[id] = (nutzung[id] || 0) + 1;
    speichereJson('bp_nutzung', nutzung);
  }

  // Merkt geänderte Baustein-Texte: die eigene Formulierung wird künftig bevorzugt.
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
    const basis = varianten[b.id] || b.text;
    if (detailStufe === 0) return b.kurz || basis;
    if (detailStufe === 2 && b.gesetz) {
      return basis + '\n' + b.gesetz.text + ' (' + b.gesetz.ref + ')';
    }
    return basis;
  }

  // ---------- Kürzel-Expansion (wie Tastatur-Shortcuts) ----------

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
    // Zusammenhänge aus den Berichten: verwandte Bausteine mitvorschlagen
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
    // Immer 3 Vorschläge: mit den meistgenutzten Sicherheits-Bausteinen auffüllen
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

  function starteBearbeitung(index) {
    const e = eintraege[index];
    bearbeitetIndex = index;
    input.value = e.text;
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

  function renderEintrag(e, index) {
    const li = document.createElement('li');
    li.className = 'eintrag';

    const kopf = document.createElement('div');
    kopf.className = 'eintrag-kopf';
    const kopfText = document.createElement('span');
    kopfText.textContent = 'Erstellt: ' + e.zeit + (e.ort ? ' – ' + e.ort : '');
    kopf.appendChild(kopfText);

    const aktionen = document.createElement('span');
    aktionen.className = 'eintrag-aktionen';

    const bearbeiten = document.createElement('button');
    bearbeiten.type = 'button';
    bearbeiten.className = 'eintrag-knopf';
    bearbeiten.textContent = '✎';
    bearbeiten.title = 'Eintrag bearbeiten';
    bearbeiten.addEventListener('click', function () { starteBearbeitung(index); });
    aktionen.appendChild(bearbeiten);

    const loeschen = document.createElement('button');
    loeschen.type = 'button';
    loeschen.className = 'eintrag-knopf eintrag-loeschen';
    loeschen.textContent = '×';
    loeschen.title = 'Eintrag löschen';
    loeschen.addEventListener('click', function () {
      eintraege.splice(index, 1);
      speichereJson('bp_eintraege', eintraege);
      if (bearbeitetIndex === index) beendeBearbeitung();
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
    eintraege.forEach(renderEintrag);
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
  // Klick auf ein Wort markiert den ganzen Satz; ein zweiter Klick in den
  // markierten Satz setzt den Cursor normal. Abkürzungen wie "z. B.", "Abs.",
  // "Fa." oder "§ 4 Abs. 7" beenden keinen Satz.

  const ABKUERZUNGEN = ['z.b', 'b', 'bzw', 'usw', 'ca', 'inkl', 'gem', 'abs', 'fa', 'ing', 'bmst', 'dipl', 'nr', 'max', 'min', 'evtl', 'ggf', 'lt', 'og', 'ug', 'eg'];

  function istSatzEnde(text, i) {
    const c = text[i];
    if (c === '\n') return true;
    if (c !== '.' && c !== '!' && c !== '?') return false;
    // Wort vor dem Punkt bestimmen
    let w = i - 1;
    while (w >= 0 && /[A-Za-zÄÖÜäöüß0-9§]/.test(text[w])) w--;
    const wort = text.slice(w + 1, i).toLowerCase();
    if (ABKUERZUNGEN.indexOf(wort) !== -1) return false;
    if (/^\d+$/.test(wort) && /[§0-9]/.test(text.slice(Math.max(0, w - 3), w + 1))) return false; // "§ 4." / "4.7"
    // Nach dem Punkt: Satz endet nur vor Leerraum/Zeilenende
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

  let vorherigeMarkierung = null; // {start, ende} der zuletzt markierten Satzauswahl

  input.addEventListener('mousedown', function () {
    const aktiv = input.selectionStart !== input.selectionEnd &&
      vorherigeMarkierung &&
      input.selectionStart === vorherigeMarkierung.start &&
      input.selectionEnd === vorherigeMarkierung.ende;
    input.dataset.satzAktiv = aktiv ? '1' : '';
  });

  input.addEventListener('click', function () {
    const pos = input.selectionStart;
    if (input.selectionStart !== input.selectionEnd) return; // Nutzer zieht selbst eine Auswahl
    const text = input.value;
    if (!text || pos > text.length) return;
    const zeichen = text[pos] || text[pos - 1];
    if (!zeichen || /\s/.test(zeichen)) { vorherigeMarkierung = null; return; }
    const g = satzGrenzen(text, pos);
    if (g.ende <= g.start) return;
    // Zweiter Klick in den bereits markierten Satz: Cursor normal setzen
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

  ortInput.addEventListener('change', function () {
    speichereJson('bp_ort', ortInput.value);
  });

  // Symbole der im Text enthaltenen komplexeren Themen ermitteln
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

    // Für die Datenbank merken: wurde ein eingefügter Baustein-Text verändert?
    eingefuegt.forEach(function (e) {
      if (text.indexOf(e.text) === -1) {
        merkeAenderung(eingefuegt.length === 1 ? e.id : null, e.text, text);
      }
    });

    if (bearbeitetIndex !== null) {
      const alt = eintraege[bearbeitetIndex];
      if (alt.text !== text) merkeAenderung(null, alt.text, text);
      alt.text = text;
      alt.icons = iconsFuerText(text);
      speichereJson('bp_eintraege', eintraege);
      beendeBearbeitung();
    } else {
      eintraege.push({
        zeit: zeitstempel(),
        ort: ortInput.value.trim(),
        text: text,
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
    updateSendState();
    autoGrow();
    renderAlleEintraege();
    input.focus();
  });

  printButton.addEventListener('click', function () {
    window.print();
  });

  // ---------- Start ----------

  zeigeDetailStufe();
  renderAlleEintraege();
  updateSendState();
  input.focus();
})();
