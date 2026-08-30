(function () {
  'use strict';

  const STORAGE_KEY = 'belegungsplan-data';

  const STATUS = {
    frei:       { label: 'Frei' },
    anreise:    { label: 'Anreise' },
    belegt:     { label: 'Belegt' },
    abreise:    { label: 'Abreise' },
    reserviert: { label: 'Reserviert' },
  };

  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const grid = document.getElementById('grid');
  const monthLabel = document.getElementById('month-label');
  const statsEl = document.getElementById('stats');
  const overlay = document.getElementById('overlay');
  const menu = document.getElementById('day-menu');
  const menuDate = document.getElementById('menu-date');
  const menuSub = document.getElementById('menu-sub');
  const statusChips = document.getElementById('status-chips');
  const suggestionWrap = document.getElementById('menu-suggestion');
  const suggestionBtn = document.getElementById('suggestion-btn');
  const fGuest = document.getElementById('f-guest');
  const fPersons = document.getElementById('f-persons');
  const fNote = document.getElementById('f-note');
  const fUntil = document.getElementById('f-until');
  const btnSave = document.getElementById('btn-save');
  const btnDelete = document.getElementById('btn-delete');

  let entries = loadEntries();
  let viewYear, viewMonth;
  let selectedKey = null;
  let selectedStatus = 'frei';
  let lastFocusedCell = null;

  function loadEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) { /* Speicher voll oder blockiert – Anzeige funktioniert weiter */ }
  }

  function keyOf(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function shiftKey(key, days) {
    const dt = parseKey(key);
    dt.setDate(dt.getDate() + days);
    return keyOf(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  function formatLong(key) {
    const dt = parseKey(key);
    return WEEKDAYS[dt.getDay()] + ', ' + dt.getDate() + '. ' + MONTHS[dt.getMonth()] + ' ' + dt.getFullYear();
  }

  /* ---------- Kalender ---------- */

  function render() {
    monthLabel.textContent = MONTHS[viewMonth] + ' ' + viewYear;
    grid.innerHTML = '';

    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Montag als Wochenstart
    const today = new Date();
    const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());
    const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - lead + 1;

      if (dayNum < 1 || dayNum > daysInMonth) {
        const filler = document.createElement('div');
        filler.className = 'day outside';
        const ref = new Date(viewYear, viewMonth, dayNum);
        filler.innerHTML = '<span class="day-num">' + ref.getDate() + '</span>';
        grid.appendChild(filler);
        continue;
      }

      const key = keyOf(viewYear, viewMonth, dayNum);
      const entry = entries[key];
      const dow = (i % 7);

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day';
      cell.dataset.key = key;
      if (dow >= 5) cell.classList.add('weekend');
      if (key === todayKey) cell.classList.add('today');
      if (entry) cell.classList.add('s-' + entry.status);

      let html = '<span class="day-num">' + dayNum + '</span>';
      if (entry) {
        html += '<span class="day-status">' + STATUS[entry.status].label + '</span>';
        if (entry.guest) html += '<span class="day-guest">' + escapeHtml(entry.guest) + '</span>';
      }
      cell.innerHTML = html;

      const aria = [formatLong(key)];
      if (entry) {
        aria.push(STATUS[entry.status].label);
        if (entry.guest) aria.push(entry.guest);
      } else {
        aria.push('Frei');
      }
      cell.setAttribute('aria-label', aria.join(', '));

      cell.addEventListener('click', function () { openMenu(key, cell); });
      grid.appendChild(cell);
    }

    renderStats(daysInMonth);
  }

  function renderStats(daysInMonth) {
    let occupied = 0, reserved = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = entries[keyOf(viewYear, viewMonth, d)];
      if (!entry) continue;
      if (entry.status === 'reserviert') reserved++;
      else occupied++;
    }
    const free = daysInMonth - occupied - reserved;
    statsEl.innerHTML =
      '<span class="stat"><strong>' + occupied + '</strong> Tage belegt</span>' +
      '<span class="stat"><strong>' + reserved + '</strong> reserviert</span>' +
      '<span class="stat"><strong>' + free + '</strong> frei</span>';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Tagesmenü ---------- */

  function buildChips() {
    statusChips.innerHTML = '';
    Object.keys(STATUS).forEach(function (status) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip c-' + status;
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', 'false');
      chip.dataset.status = status;
      chip.innerHTML = '<span class="dot d-' + status + '"></span>' + STATUS[status].label;
      chip.addEventListener('click', function () { setSelectedStatus(status); });
      statusChips.appendChild(chip);
    });
  }

  function setSelectedStatus(status) {
    selectedStatus = status;
    statusChips.querySelectorAll('.chip').forEach(function (chip) {
      chip.setAttribute('aria-checked', chip.dataset.status === status ? 'true' : 'false');
    });
  }

  function openMenu(key, cell) {
    selectedKey = key;
    lastFocusedCell = cell;
    const entry = entries[key];

    menuDate.textContent = formatLong(key);
    menuSub.textContent = entry
      ? 'Eintrag vorhanden – Status: ' + STATUS[entry.status].label
      : 'Noch kein Eintrag – Tag ist frei';

    setSelectedStatus(entry ? entry.status : 'frei');
    fGuest.value = entry && entry.guest ? entry.guest : '';
    fPersons.value = entry && entry.persons ? entry.persons : '';
    fNote.value = entry && entry.note ? entry.note : '';
    fUntil.value = '';
    fUntil.min = shiftKey(key, 1);
    btnDelete.hidden = !entry;

    renderSuggestion(key, entry);

    overlay.hidden = false;
    menu.hidden = false;
    positionMenu(cell);
    fGuest.focus({ preventScroll: true });
  }

  function renderSuggestion(key, entry) {
    suggestionWrap.hidden = true;
    if (entry) return;
    const prev = entries[shiftKey(key, -1)];
    if (prev && prev.guest && (prev.status === 'belegt' || prev.status === 'anreise')) {
      suggestionBtn.textContent = '💡 Aufenthalt von „' + prev.guest + '“ fortsetzen (Belegt übernehmen)';
      suggestionBtn.onclick = function () {
        setSelectedStatus('belegt');
        fGuest.value = prev.guest;
        if (prev.persons) fPersons.value = prev.persons;
        suggestionWrap.hidden = true;
      };
      suggestionWrap.hidden = false;
    }
  }

  function positionMenu(cell) {
    if (window.matchMedia('(max-width: 640px)').matches) {
      menu.classList.add('sheet');
      menu.style.left = '';
      menu.style.top = '';
      return;
    }
    menu.classList.remove('sheet');
    const r = cell.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let left = r.left + r.width / 2 - mw / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - mw - 12));
    let top = r.bottom + 8;
    if (top + mh > window.innerHeight - 12) top = r.top - mh - 8;
    top = Math.max(12, top);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function closeMenu() {
    menu.hidden = true;
    overlay.hidden = true;
    selectedKey = null;
    if (lastFocusedCell && document.contains(lastFocusedCell)) {
      lastFocusedCell.focus({ preventScroll: true });
    }
  }

  function entryFromForm(status) {
    return {
      status: status,
      guest: fGuest.value.trim(),
      persons: fPersons.value ? Number(fPersons.value) : null,
      note: fNote.value.trim(),
    };
  }

  function save() {
    if (!selectedKey) return;
    const until = fUntil.value && fUntil.value > selectedKey ? fUntil.value : selectedKey;

    let key = selectedKey;
    const keys = [];
    while (key <= until) {
      keys.push(key);
      key = shiftKey(key, 1);
    }

    keys.forEach(function (k, idx) {
      if (selectedStatus === 'frei') {
        delete entries[k];
        return;
      }
      let status = selectedStatus;
      if (selectedStatus === 'belegt' && keys.length > 1) {
        if (idx === 0) status = 'anreise';
        else if (idx === keys.length - 1) status = 'abreise';
      }
      entries[k] = entryFromForm(status);
    });

    saveEntries();
    closeMenu();
    render();
  }

  function removeEntry() {
    if (!selectedKey) return;
    delete entries[selectedKey];
    saveEntries();
    closeMenu();
    render();
  }

  /* ---------- Navigation & Events ---------- */

  function goToMonth(offset) {
    const dt = new Date(viewYear, viewMonth + offset, 1);
    viewYear = dt.getFullYear();
    viewMonth = dt.getMonth();
    render();
  }

  document.getElementById('prev-month').addEventListener('click', function () { goToMonth(-1); });
  document.getElementById('next-month').addEventListener('click', function () { goToMonth(1); });
  document.getElementById('today-btn').addEventListener('click', function () {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    render();
  });

  document.getElementById('menu-close').addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  btnSave.addEventListener('click', save);
  btnDelete.addEventListener('click', removeEntry);

  document.addEventListener('keydown', function (event) {
    if (menu.hidden) return;
    if (event.key === 'Escape') closeMenu();
    if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
      event.preventDefault();
      save();
    }
  });

  window.addEventListener('resize', function () {
    if (!menu.hidden && lastFocusedCell) positionMenu(lastFocusedCell);
  });

  /* ---------- Start ---------- */

  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  buildChips();
  render();
})();
