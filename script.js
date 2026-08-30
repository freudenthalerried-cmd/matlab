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

  let aktuellesFoto = null; // dataURL

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

  let nutzung = ladeJson('bp_nutzung', {});   // Baustein-ID -> wie oft verwendet
  let eintraege = ladeJson('bp_eintraege', []);
  ortInput.value = ladeJson('bp_ort', '');

  function merkeNutzung(id) {
    nutzung[id] = (nutzung[id] || 0) + 1;
    speichereJson('bp_nutzung', nutzung);
  }

  function score(b) {
    return b.freq + (nutzung[b.id] || 0) * 2;
  }

  // ---------- Kürzel-Expansion (wie Tastatur-Shortcuts) ----------

  const kuerzelMap = {};
  BAUSTEINE.forEach(function (b) {
    b.kuerzel.forEach(function (k) { kuerzelMap[k.toLowerCase()] = b; });
  });

  // Ersetzt ein alleinstehendes Kürzel am Wortende durch den vollen Textbaustein.
  function expandiereKuerzel(text, nurLetztesWort) {
    const regex = /(^|[\s.,;:!?()])([A-Za-zÄÖÜäöüß]+)$/;
    if (nurLetztesWort) {
      const m = text.match(regex);
      if (m) {
        const b = kuerzelMap[m[2].toLowerCase()];
        if (b) {
          merkeNutzung(b.id);
          return text.slice(0, m.index + m[1].length) + b.text;
        }
      }
      return null;
    }
    // Beim Senden: alle Wörter prüfen
    return text.split(/\s+/).map(function (wort) {
      const kern = wort.replace(/[.,;:!?]+$/, '');
      const b = kuerzelMap[kern.toLowerCase()];
      if (b && kern === wort) {
        merkeNutzung(b.id);
        return b.text;
      }
      return wort;
    }).join(' ');
  }

  // ---------- KI-Vorschlag ----------

  function vorschlaegeFuer(text) {
    const t = text.toLowerCase();
    if (t.trim().length < 3) return [];
    const treffer = [];
    BAUSTEINE.forEach(function (b) {
      let punkte = 0;
      b.keywords.forEach(function (kw) {
        if (t.indexOf(kw) !== -1) punkte += 10;
      });
      if (punkte > 0 && t.indexOf(b.text.toLowerCase().slice(0, 40)) === -1) {
        treffer.push({ baustein: b, punkte: punkte + score(b) });
      }
    });
    // Zusammenhänge: was in den Berichten oft gemeinsam vorkam, mitvorschlagen
    const direkt = treffer.map(function (x) { return x.baustein.id; });
    treffer.slice().forEach(function (x) {
      (x.baustein.related || []).forEach(function (rid) {
        if (direkt.indexOf(rid) === -1) {
          const rb = BAUSTEINE.find(function (b) { return b.id === rid; });
          if (rb && t.indexOf(rb.text.toLowerCase().slice(0, 40)) === -1) {
            treffer.push({ baustein: rb, punkte: score(rb) });
            direkt.push(rid);
          }
        }
      });
    });
    treffer.sort(function (a, b) { return b.punkte - a.punkte; });
    return treffer.slice(0, 3).map(function (x) { return x.baustein; });
  }

  function zeigeVorschlaege(liste) {
    kiChips.innerHTML = '';
    if (!liste.length) {
      kiPanel.hidden = true;
      return;
    }
    liste.forEach(function (b) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = b.titel;
      chip.title = b.text;
      chip.addEventListener('click', function () {
        fuegeTextEin(b);
      });
      kiChips.appendChild(chip);
    });
    kiPanel.hidden = false;
  }

  function fuegeTextEin(b) {
    merkeNutzung(b.id);
    const bisher = input.value.trim();
    input.value = bisher ? bisher + '\n' + b.text : b.text;
    updateSendState();
    autoGrow();
    input.focus();
    zeigeVorschlaege(vorschlaegeFuer(input.value));
    renderBausteine();
  }

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
      kopf.textContent = b.titel;
      const kuerzel = document.createElement('span');
      kuerzel.className = 'baustein-kuerzel';
      kuerzel.textContent = b.kuerzel.join(', ');
      kopf.appendChild(kuerzel);
      const text = document.createElement('div');
      text.className = 'baustein-text';
      text.textContent = b.text;
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

  function renderEintrag(e, index) {
    const li = document.createElement('li');
    li.className = 'eintrag';

    const kopf = document.createElement('div');
    kopf.className = 'eintrag-kopf';
    kopf.textContent = 'Erstellt: ' + e.zeit + (e.ort ? ' – ' + e.ort : '');

    const loeschen = document.createElement('button');
    loeschen.type = 'button';
    loeschen.className = 'eintrag-loeschen';
    loeschen.textContent = '×';
    loeschen.title = 'Eintrag löschen';
    loeschen.addEventListener('click', function () {
      eintraege.splice(index, 1);
      speichereJson('bp_eintraege', eintraege);
      renderAlleEintraege();
    });
    kopf.appendChild(loeschen);
    li.appendChild(kopf);

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
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }

  input.addEventListener('input', function () {
    updateSendState();
    autoGrow();
    zeigeVorschlaege(vorschlaegeFuer(input.value));
  });

  // Leertaste nach einem Kürzel → sofort expandieren (wie Tastatur-Shortcut)
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

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    let text = input.value.trim();
    if (!text && !aktuellesFoto) return;
    if (text) text = expandiereKuerzel(text, false);

    eintraege.push({
      zeit: zeitstempel(),
      ort: ortInput.value.trim(),
      text: text,
      foto: aktuellesFoto
    });
    speichereJson('bp_eintraege', eintraege);

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

  renderAlleEintraege();
  updateSendState();
  input.focus();
})();
