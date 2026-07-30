/* =========================================================
   E-Mail-Modul der Verwaltungs-App
   - Outlook-ähnliche Oberfläche (Ordner / Liste / Lesebereich)
   - An, CC und BCC beim Verfassen, inkl. Standard-CC
   - Anhänge per Dateidialog und Drag & Drop
   - Textbausteine statt vorgefertigter Komplett-E-Mails
   ========================================================= */

(function () {
  'use strict';

  const STORAGE_KEY = 'verwaltung.mail.v1';
  const MAX_FILE_BYTES = 5 * 1024 * 1024;      // 5 MB je Datei
  const MAX_TOTAL_BYTES = 12 * 1024 * 1024;    // 12 MB je Nachricht

  const SYSTEM_FOLDERS = [
    { id: 'inbox',   name: 'Posteingang', icon: 'i-inbox'   },
    { id: 'drafts',  name: 'Entwürfe',    icon: 'i-draft'   },
    { id: 'sent',    name: 'Gesendet',    icon: 'i-sent'    },
    { id: 'archive', name: 'Archiv',      icon: 'i-archive' },
    { id: 'junk',    name: 'Junk-E-Mail', icon: 'i-junk'    },
    { id: 'trash',   name: 'Papierkorb',  icon: 'i-trash'   }
  ];

  /* ---------------------------------------------------------
     Hilfsfunktionen
     --------------------------------------------------------- */

  const $ = (id) => document.getElementById(id);

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Entfernt aktive Inhalte aus gespeichertem HTML, bevor es angezeigt wird. */
  function sanitizeHtml(html) {
    const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    const root = doc.body.firstElementChild;

    root.querySelectorAll('script, style, iframe, object, embed, link, meta, form').forEach((el) => el.remove());

    root.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        const isUrlAttr = name === 'href' || name === 'src' || name === 'xlink:href';
        if (name.startsWith('on') || (isUrlAttr && value.startsWith('javascript:'))) {
          el.removeAttribute(attr.name);
        }
      });
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return root.innerHTML;
  }

  function htmlToText(html) {
    const doc = new DOMParser().parseFromString('<div>' + (html || '') + '</div>', 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function textToHtml(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatListDate(iso) {
    const date = new Date(iso);
    const today = startOfDay(new Date());
    const day = startOfDay(date);
    const diffDays = Math.round((today - day) / 86400000);

    if (diffDays === 0) return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return date.toLocaleDateString('de-AT', { weekday: 'short' });
    return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function formatFullDate(iso) {
    return new Date(iso).toLocaleString('de-AT', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function dateGroupLabel(iso) {
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000);
    if (diffDays <= 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return 'Diese Woche';
    if (diffDays < 31) return 'Diesen Monat';
    return 'Älter';
  }

  /* ---------- Adressen ---------- */

  /** "Armin Berger <armin@x.at>; b@x.at" -> [{name, email}, …] */
  function parseAddresses(value) {
    return String(value || '')
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const match = part.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
        if (match) return { name: match[1].replace(/^["']|["']$/g, '').trim(), email: match[2].trim() };
        return { name: '', email: part };
      })
      .filter((addr) => addr.email);
  }

  function formatAddress(addr) {
    if (!addr) return '';
    return addr.name ? addr.name + ' <' + addr.email + '>' : addr.email;
  }

  function formatAddresses(list) {
    return (list || []).map(formatAddress).join('; ');
  }

  function displayName(addr) {
    return addr && (addr.name || addr.email) || '';
  }

  function sameAddress(a, b) {
    return a && b && a.email.toLowerCase() === b.email.toLowerCase();
  }

  function dedupeAddresses(list, without) {
    const seen = new Set((without || []).map((a) => a.email.toLowerCase()));
    const result = [];
    (list || []).forEach((addr) => {
      const key = addr.email.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(addr);
    });
    return result;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function initials(addr) {
    const source = displayName(addr);
    const parts = source.replace(/[<>]/g, '').split(/[\s._@-]+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  /* ---------------------------------------------------------
     Zustand
     --------------------------------------------------------- */

  const state = {
    settings: null,
    folders: [],      // eigene Ordner
    messages: [],
    contacts: [],
    snippets: [],
    ui: {
      folder: 'inbox',
      selectedId: null,
      search: '',
      unreadOnly: false,
      sort: 'date-desc',
      composeMode: null,   // 'new' | 'reply' | 'replyAll' | 'forward' | 'draft'
      draftId: null,
      attachments: [],
      editingSnippetId: null,
      mobileView: 'list'
    }
  };

  function defaultSettings() {
    return {
      me: { name: 'Verwaltung', email: 'verwaltung@example.at' },
      defaultCc: '',
      ccSelf: false,
      replyAllDefault: false,
      signature: 'Mit freundlichen Grüßen\n\nVerwaltung'
    };
  }

  function seedSnippets() {
    return [
      {
        id: uid('sn'), category: 'Anrede',
        title: 'Anrede – förmlich',
        body: 'Sehr geehrte Damen und Herren,\n\n'
      },
      {
        id: uid('sn'), category: 'Anrede',
        title: 'Anrede – persönlich',
        body: 'Hallo {{Empfänger}},\n\n'
      },
      {
        id: uid('sn'), category: 'Standard',
        title: 'Eingangsbestätigung',
        body: 'vielen Dank für Ihre Nachricht vom {{Datum}}. Wir haben Ihr Anliegen erhalten und melden uns nach Prüfung zeitnah bei Ihnen zurück.\n\n'
      },
      {
        id: uid('sn'), category: 'Standard',
        title: 'Unterlagen nachfordern',
        body: 'für die weitere Bearbeitung benötigen wir noch folgende Unterlagen:\n\n– \n– \n– \n\nBitte übermitteln Sie diese bis spätestens TT.MM.JJJJ.\n\n'
      },
      {
        id: uid('sn'), category: 'Standard',
        title: 'Terminbestätigung',
        body: 'hiermit bestätigen wir den vereinbarten Termin am TT.MM.JJJJ um HH:MM Uhr.\nSollte Ihnen der Termin nicht mehr passen, geben Sie uns bitte rechtzeitig Bescheid.\n\n'
      },
      {
        id: uid('sn'), category: 'Standard',
        title: 'Rückfrage / Erinnerung',
        body: 'wir dürfen höflich an unser Schreiben vom TT.MM.JJJJ erinnern. Eine Rückmeldung Ihrerseits steht noch aus.\n\n'
      },
      {
        id: uid('sn'), category: 'Intern',
        title: 'Zur Erledigung übergeben (mit Kopie)',
        body: 'ich übergebe dir das Anliegen zur weiteren Erledigung. Bitte setze mich bei deiner Antwort in CC, damit ich nicht ein zweites Mal antworte.\n\nDanke und liebe Grüße\n{{Absender}}\n'
      },
      {
        id: uid('sn'), category: 'Schluss',
        title: 'Grußformel – förmlich',
        body: '\nMit freundlichen Grüßen\n{{Absender}}\n'
      },
      {
        id: uid('sn'), category: 'Schluss',
        title: 'Grußformel – kurz',
        body: '\nBeste Grüße\n{{Absender}}\n'
      }
    ];
  }

  function seedContacts() {
    return [
      { name: 'Armin Berger', email: 'armin.berger@verwaltung.at' },
      { name: 'Sabine Huber', email: 'sabine.huber@verwaltung.at' },
      { name: 'Buchhaltung', email: 'buchhaltung@verwaltung.at' },
      { name: 'Sekretariat', email: 'sekretariat@verwaltung.at' },
      { name: 'Familie Mayer', email: 'mayer@beispiel.at' },
      { name: 'Hausverwaltung Nord', email: 'office@hv-nord.at' }
    ];
  }

  function seedMessages() {
    const now = Date.now();
    const at = (hoursAgo) => new Date(now - hoursAgo * 3600000).toISOString();
    const me = { name: 'Verwaltung', email: 'verwaltung@example.at' };

    return [
      {
        id: uid('m'), folder: 'inbox', read: false, flagged: true,
        from: { name: 'Armin Berger', email: 'armin.berger@verwaltung.at' },
        to: [me], cc: [{ name: 'Sekretariat', email: 'sekretariat@verwaltung.at' }], bcc: [],
        subject: 'WG: Betriebskostenabrechnung 2025 – Rückfrage Familie Mayer',
        date: at(2),
        body: '<p>Hallo,</p><p>ich habe die Rückfrage von Familie Mayer übernommen und antworte direkt. '
            + 'Ich setze dich bei meiner Antwort in CC, damit die Anfrage nicht doppelt beantwortet wird.</p>'
            + '<p>Liebe Grüße<br>Armin</p>',
        attachments: []
      },
      {
        id: uid('m'), folder: 'inbox', read: false, flagged: false,
        from: { name: 'Hausverwaltung Nord', email: 'office@hv-nord.at' },
        to: [me], cc: [], bcc: [],
        subject: 'Angebot Fassadensanierung – Unterlagen im Anhang',
        date: at(20),
        body: '<p>Sehr geehrte Damen und Herren,</p>'
            + '<p>anbei übermitteln wir das angeforderte Angebot samt Leistungsverzeichnis.</p>'
            + '<p>Mit freundlichen Grüßen<br>Hausverwaltung Nord</p>',
        attachments: [{
          id: uid('a'), name: 'Angebot-Fassade.txt', size: 96, type: 'text/plain',
          dataUrl: 'data:text/plain;base64,' + btoa('Angebot Fassadensanierung\nPos. 1 Geruest\nPos. 2 Putz\nPos. 3 Anstrich\n')
        }]
      },
      {
        id: uid('m'), folder: 'inbox', read: true, flagged: false,
        from: { name: 'Sabine Huber', email: 'sabine.huber@verwaltung.at' },
        to: [me], cc: [{ name: 'Armin Berger', email: 'armin.berger@verwaltung.at' }], bcc: [],
        subject: 'Protokoll Jour fixe vom Montag',
        date: at(50),
        body: '<p>Hallo zusammen,</p><p>das Protokoll des letzten Jour fixe findet ihr im Laufwerk unter '
            + '<em>Verwaltung/Protokolle</em>. Ergänzungen bitte bis Freitag.</p><p>LG Sabine</p>',
        attachments: []
      },
      {
        id: uid('m'), folder: 'sent', read: true, flagged: false,
        from: me,
        to: [{ name: 'Familie Mayer', email: 'mayer@beispiel.at' }],
        cc: [{ name: 'Armin Berger', email: 'armin.berger@verwaltung.at' }],
        bcc: [],
        subject: 'Ihre Anfrage zur Betriebskostenabrechnung 2025',
        date: at(26),
        body: '<p>Sehr geehrte Familie Mayer,</p><p>vielen Dank für Ihre Nachricht. Wir prüfen die Positionen '
            + 'und melden uns kommende Woche.</p><p>Mit freundlichen Grüßen<br>Verwaltung</p>',
        attachments: []
      },
      {
        id: uid('m'), folder: 'archive', read: true, flagged: false,
        from: { name: 'Buchhaltung', email: 'buchhaltung@verwaltung.at' },
        to: [me], cc: [], bcc: [],
        subject: 'Kontoauszug Juni – abgelegt',
        date: at(200),
        body: '<p>Guten Tag,</p><p>der Kontoauszug für Juni wurde verbucht.</p><p>Buchhaltung</p>',
        attachments: []
      }
    ];
  }

  function seedState() {
    state.settings = defaultSettings();
    state.folders = [{ id: uid('f'), name: 'Objekte' }, { id: uid('f'), name: 'Behörden' }];
    state.messages = seedMessages();
    state.contacts = seedContacts();
    state.snippets = seedSnippets();
  }

  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      raw = null;
    }
    if (!raw) {
      seedState();
      save();
      return;
    }
    try {
      const data = JSON.parse(raw);
      state.settings = Object.assign(defaultSettings(), data.settings || {});
      state.folders = data.folders || [];
      state.messages = data.messages || [];
      state.contacts = data.contacts || seedContacts();
      state.snippets = data.snippets && data.snippets.length ? data.snippets : seedSnippets();
    } catch (err) {
      seedState();
    }
  }

  function save() {
    const payload = {
      settings: state.settings,
      folders: state.folders,
      messages: state.messages,
      contacts: state.contacts,
      snippets: state.snippets
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      toast('Speicher voll – große Anhänge bleiben nur in dieser Sitzung erhalten.');
      return false;
    }
  }

  /* ---------------------------------------------------------
     Rückmeldungen
     --------------------------------------------------------- */

  let toastTimer = null;

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  function setStatus(text) {
    $('status-bar').textContent = text;
  }

  /* ---------------------------------------------------------
     Auswahl / Abfragen
     --------------------------------------------------------- */

  function folderName(id) {
    const system = SYSTEM_FOLDERS.find((f) => f.id === id);
    if (system) return system.name;
    const custom = state.folders.find((f) => f.id === id);
    return custom ? custom.name : 'Ordner';
  }

  function messagesIn(folderId) {
    return state.messages.filter((m) => m.folder === folderId);
  }

  function unreadCount(folderId) {
    return messagesIn(folderId).filter((m) => !m.read).length;
  }

  function selectedMessage() {
    return state.messages.find((m) => m.id === state.ui.selectedId) || null;
  }

  function matchesSearch(message, needle) {
    if (!needle) return true;
    const haystack = [
      message.subject,
      displayName(message.from), message.from && message.from.email,
      formatAddresses(message.to), formatAddresses(message.cc),
      htmlToText(message.body),
      (message.attachments || []).map((a) => a.name).join(' ')
    ].join(' ').toLowerCase();
    return needle.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
  }

  function visibleMessages() {
    const needle = state.ui.search.trim().toLowerCase();
    // Bei aktiver Suche wird ordnerübergreifend gesucht (ohne Papierkorb).
    let list = needle
      ? state.messages.filter((m) => m.folder !== 'trash')
      : messagesIn(state.ui.folder);

    if (needle) list = list.filter((m) => matchesSearch(m, needle));
    if (state.ui.unreadOnly) list = list.filter((m) => !m.read);

    const sorters = {
      'date-desc': (a, b) => new Date(b.date) - new Date(a.date),
      'date-asc': (a, b) => new Date(a.date) - new Date(b.date),
      'from': (a, b) => displayName(a.from).localeCompare(displayName(b.from), 'de'),
      'subject': (a, b) => (a.subject || '').localeCompare(b.subject || '', 'de'),
      'flagged': (a, b) => (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0) || new Date(b.date) - new Date(a.date)
    };
    return list.slice().sort(sorters[state.ui.sort] || sorters['date-desc']);
  }

  /* ---------------------------------------------------------
     Darstellung: Ordner
     --------------------------------------------------------- */

  function svgIcon(id, className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon' + (className ? ' ' + className : ''));
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function renderFolders() {
    const systemList = $('folder-list');
    const customList = $('custom-folder-list');
    systemList.textContent = '';
    customList.textContent = '';

    const build = (folder, isCustom) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'folder';
      btn.setAttribute('aria-current', String(state.ui.folder === folder.id));
      btn.dataset.folder = folder.id;

      btn.appendChild(svgIcon(folder.icon || 'i-move'));

      const name = document.createElement('span');
      name.className = 'folder__name';
      name.textContent = folder.name;
      btn.appendChild(name);

      const count = document.createElement('span');
      count.className = 'folder__count';
      const unread = unreadCount(folder.id);
      const total = messagesIn(folder.id).length;
      count.textContent = folder.id === 'drafts' || folder.id === 'sent'
        ? (total ? String(total) : '')
        : (unread ? String(unread) : '');
      btn.appendChild(count);

      if (isCustom) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'folder__delete';
        del.title = 'Ordner löschen';
        del.setAttribute('aria-label', 'Ordner ' + folder.name + ' löschen');
        del.textContent = '×';
        del.addEventListener('click', (event) => {
          event.stopPropagation();
          removeFolder(folder.id);
        });
        btn.appendChild(del);
      }

      btn.addEventListener('click', () => selectFolder(folder.id));

      // Nachrichten per Drag & Drop in Ordner verschieben
      btn.addEventListener('dragover', (event) => {
        event.preventDefault();
        btn.classList.add('is-drop-target');
      });
      btn.addEventListener('dragleave', () => btn.classList.remove('is-drop-target'));
      btn.addEventListener('drop', (event) => {
        event.preventDefault();
        btn.classList.remove('is-drop-target');
        const id = event.dataTransfer.getData('text/mail-id');
        if (id) moveMessage(id, folder.id);
      });

      li.appendChild(btn);
      return li;
    };

    SYSTEM_FOLDERS.forEach((f) => systemList.appendChild(build(f, false)));
    state.folders.forEach((f) => customList.appendChild(build(f, true)));
  }

  /* ---------------------------------------------------------
     Darstellung: Nachrichtenliste
     --------------------------------------------------------- */

  function renderList() {
    const list = $('msg-list');
    const empty = $('list-empty');
    list.textContent = '';

    const searching = Boolean(state.ui.search.trim());
    $('list-title').textContent = searching
      ? 'Suchergebnisse für „' + state.ui.search.trim() + '“'
      : folderName(state.ui.folder);

    const messages = visibleMessages();
    empty.hidden = messages.length > 0;

    const groupByDate = state.ui.sort === 'date-desc' || state.ui.sort === 'date-asc';
    let currentGroup = null;

    messages.forEach((message) => {
      if (groupByDate) {
        const label = dateGroupLabel(message.date);
        if (label !== currentGroup) {
          currentGroup = label;
          const head = document.createElement('li');
          head.className = 'msg-group';
          head.textContent = label;
          list.appendChild(head);
        }
      }
      list.appendChild(renderListItem(message, searching));
    });

    const unread = unreadCount(state.ui.folder);
    setStatus(messages.length + ' Nachricht(en)'
      + (searching ? ' gefunden' : ' in „' + folderName(state.ui.folder) + '“')
      + (unread ? ' · ' + unread + ' ungelesen' : ''));
  }

  function renderListItem(message, showFolder) {
    const li = document.createElement('li');
    li.className = 'msg' + (message.read ? '' : ' is-unread');
    li.dataset.id = message.id;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(message.id === state.ui.selectedId));
    li.draggable = true;

    const outgoing = message.folder === 'sent' || message.folder === 'drafts';
    const counterpart = outgoing
      ? (message.to && message.to.length ? 'An: ' + message.to.map(displayName).join(', ') : 'Kein Empfänger')
      : displayName(message.from);

    const from = document.createElement('div');
    from.className = 'msg__from';
    from.textContent = counterpart;
    li.appendChild(from);

    const subject = document.createElement('div');
    subject.className = 'msg__subject';
    subject.textContent = message.subject || '(Kein Betreff)';
    li.appendChild(subject);

    const preview = document.createElement('div');
    preview.className = 'msg__preview';
    preview.textContent = htmlToText(message.body).slice(0, 140) || 'Kein Inhalt';
    li.appendChild(preview);

    const side = document.createElement('div');
    side.className = 'msg__side';

    const date = document.createElement('span');
    date.textContent = formatListDate(message.date);
    side.appendChild(date);

    const badges = document.createElement('div');
    badges.className = 'msg__badges';

    if (showFolder) {
      const folderBadge = document.createElement('span');
      folderBadge.className = 'msg__cc-badge';
      folderBadge.textContent = folderName(message.folder);
      badges.appendChild(folderBadge);
    }
    if (message.cc && message.cc.length) {
      const cc = document.createElement('span');
      cc.className = 'msg__cc-badge';
      cc.textContent = 'CC';
      cc.title = 'Kopie an: ' + message.cc.map(displayName).join(', ');
      badges.appendChild(cc);
    }
    if (message.attachments && message.attachments.length) {
      const clip = svgIcon('i-attach');
      clip.setAttribute('aria-label', 'Enthält Anhänge');
      badges.appendChild(clip);
    }
    if (message.flagged) {
      const flag = svgIcon('i-flag', 'msg__flag');
      flag.setAttribute('aria-label', 'Gekennzeichnet');
      badges.appendChild(flag);
    }
    side.appendChild(badges);
    li.appendChild(side);

    li.addEventListener('click', () => openMessage(message.id));
    li.addEventListener('dblclick', () => {
      if (message.folder === 'drafts') openCompose('draft', message);
    });
    li.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/mail-id', message.id);
      event.dataTransfer.effectAllowed = 'move';
    });

    return li;
  }

  /* ---------------------------------------------------------
     Darstellung: Lesebereich
     --------------------------------------------------------- */

  function renderReading() {
    const message = selectedMessage();
    const reading = $('reading');
    const empty = $('reading-empty');

    if (!message) {
      reading.hidden = true;
      empty.hidden = false;
      updateCommandState();
      return;
    }

    empty.hidden = true;
    reading.hidden = false;

    $('read-subject').textContent = message.subject || '(Kein Betreff)';
    $('read-avatar').textContent = initials(message.from);
    $('read-from-name').textContent = displayName(message.from);
    $('read-from-mail').textContent = message.from ? '<' + message.from.email + '>' : '';
    $('read-date').textContent = formatFullDate(message.date);

    const toLine = $('read-to');
    toLine.textContent = '';
    if (message.to && message.to.length) {
      toLine.appendChild(strongLabel('An: '));
      toLine.appendChild(document.createTextNode(message.to.map(formatAddress).join('; ')));
    }

    const ccLine = $('read-cc');
    ccLine.textContent = '';
    if (message.cc && message.cc.length) {
      ccLine.appendChild(strongLabel('CC: '));
      ccLine.appendChild(document.createTextNode(message.cc.map(formatAddress).join('; ')));
    }
    if (message.bcc && message.bcc.length && (message.folder === 'sent' || message.folder === 'drafts')) {
      ccLine.appendChild(document.createElement('br'));
      ccLine.appendChild(strongLabel('BCC: '));
      ccLine.appendChild(document.createTextNode(message.bcc.map(formatAddress).join('; ')));
    }

    renderReadAttachments(message);
    $('read-body').innerHTML = sanitizeHtml(message.body);

    updateCommandState();
  }

  function strongLabel(text) {
    const b = document.createElement('b');
    b.textContent = text;
    return b;
  }

  function renderReadAttachments(message) {
    const box = $('read-attachments');
    box.textContent = '';
    const files = message.attachments || [];
    box.hidden = files.length === 0;
    if (!files.length) return;

    const label = document.createElement('span');
    label.className = 'muted';
    label.textContent = files.length + ' Anhang/Anhänge (' + formatBytes(files.reduce((s, f) => s + (f.size || 0), 0)) + ')';
    box.appendChild(label);

    files.forEach((file) => {
      const link = document.createElement('a');
      link.className = 'attachment';
      link.href = file.dataUrl;
      link.download = file.name;
      link.title = 'Herunterladen: ' + file.name;
      link.appendChild(svgIcon('i-download'));

      const name = document.createElement('span');
      name.className = 'attachment__name';
      name.textContent = file.name;
      link.appendChild(name);

      const size = document.createElement('span');
      size.className = 'attachment__size';
      size.textContent = formatBytes(file.size);
      link.appendChild(size);

      box.appendChild(link);
    });
  }

  function updateCommandState() {
    const message = selectedMessage();
    document.querySelectorAll('[data-needs-selection]').forEach((btn) => {
      btn.disabled = !message;
    });
    $('btn-read').querySelector('span').textContent = message && message.read ? 'Ungelesen' : 'Gelesen';
    $('btn-flag').querySelector('span').textContent = message && message.flagged ? 'Kennz. entf.' : 'Kennzeichnen';
  }

  function render() {
    renderFolders();
    renderList();
    renderReading();
  }

  /* ---------------------------------------------------------
     Aktionen auf Nachrichten
     --------------------------------------------------------- */

  function selectFolder(id) {
    state.ui.folder = id;
    state.ui.selectedId = null;
    setMobileView('list');
    render();
  }

  function openMessage(id) {
    const message = state.messages.find((m) => m.id === id);
    if (!message) return;

    if (message.folder === 'drafts') {
      state.ui.selectedId = id;
      openCompose('draft', message);
      render();
      return;
    }

    state.ui.selectedId = id;
    if (!message.read) {
      message.read = true;
      save();
    }
    setMobileView('reading');
    render();
  }

  function moveMessage(id, folderId) {
    const message = state.messages.find((m) => m.id === id);
    if (!message || message.folder === folderId) return;
    message.folder = folderId;
    save();
    if (state.ui.selectedId === id && state.ui.folder !== folderId && !state.ui.search) {
      state.ui.selectedId = null;
    }
    render();
    toast('Verschoben nach „' + folderName(folderId) + '“');
  }

  function deleteSelected() {
    const message = selectedMessage();
    if (!message) return;

    if (message.folder === 'trash') {
      if (!confirm('Diese Nachricht endgültig löschen?')) return;
      state.messages = state.messages.filter((m) => m.id !== message.id);
      state.ui.selectedId = null;
      save();
      render();
      toast('Endgültig gelöscht');
      return;
    }
    moveMessage(message.id, 'trash');
  }

  function toggleRead() {
    const message = selectedMessage();
    if (!message) return;
    message.read = !message.read;
    save();
    render();
  }

  function toggleFlag() {
    const message = selectedMessage();
    if (!message) return;
    message.flagged = !message.flagged;
    save();
    render();
  }

  function addFolder() {
    const name = (prompt('Name des neuen Ordners:') || '').trim();
    if (!name) return;
    state.folders.push({ id: uid('f'), name: name });
    save();
    render();
  }

  function removeFolder(id) {
    const name = folderName(id);
    const count = messagesIn(id).length;
    const question = count
      ? 'Ordner „' + name + '“ löschen? ' + count + ' Nachricht(en) werden in den Posteingang verschoben.'
      : 'Ordner „' + name + '“ löschen?';
    if (!confirm(question)) return;

    state.messages.forEach((m) => { if (m.folder === id) m.folder = 'inbox'; });
    state.folders = state.folders.filter((f) => f.id !== id);
    if (state.ui.folder === id) state.ui.folder = 'inbox';
    save();
    render();
  }

  /* ---------------------------------------------------------
     Verfassen
     --------------------------------------------------------- */

  const compose = {
    overlay: null, form: null, to: null, cc: null, bcc: null, subject: null, body: null
  };

  function defaultCcAddresses() {
    const list = parseAddresses(state.settings.defaultCc);
    if (state.settings.ccSelf && state.settings.me.email) list.push(Object.assign({}, state.settings.me));
    return list;
  }

  function quotedHeader(message) {
    const rows = [
      ['Von', formatAddress(message.from)],
      ['Gesendet', formatFullDate(message.date)],
      ['An', message.to.map(formatAddress).join('; ')]
    ];
    if (message.cc && message.cc.length) rows.push(['Cc', message.cc.map(formatAddress).join('; ')]);
    rows.push(['Betreff', message.subject || '(Kein Betreff)']);

    return '<p></p><blockquote>'
      + rows.map((r) => '<b>' + escapeHtml(r[0]) + ':</b> ' + escapeHtml(r[1])).join('<br>')
      + '<hr>' + sanitizeHtml(message.body)
      + '</blockquote>';
  }

  function signatureHtml() {
    const sig = (state.settings.signature || '').trim();
    return sig ? '<p></p><p>' + textToHtml(sig) + '</p>' : '<p></p>';
  }

  function openCompose(mode, source) {
    const ui = state.ui;
    ui.composeMode = mode;
    ui.draftId = null;
    ui.attachments = [];

    let to = [], cc = [], bcc = [], subject = '', body = '';
    const me = state.settings.me;

    if (mode === 'new') {
      cc = defaultCcAddresses();
      body = signatureHtml();
    }

    if (mode === 'reply' || mode === 'replyAll') {
      to = [source.from];
      // „Allen antworten“ übernimmt alle ursprünglichen Empfänger als Kopie,
      // damit niemand aus dem Verteiler fällt und doppelt geantwortet wird.
      const originals = mode === 'replyAll' ? (source.to || []).concat(source.cc || []) : [];
      // Die eigene Adresse nur behalten, wenn sie in den Einstellungen gewünscht ist.
      const exclude = to.slice();
      if (!state.settings.ccSelf && me.email) exclude.push({ email: me.email });
      cc = dedupeAddresses(originals.concat(defaultCcAddresses()), exclude);
      subject = /^\s*AW:/i.test(source.subject || '') ? source.subject : 'AW: ' + (source.subject || '');
      body = signatureHtml() + quotedHeader(source);
    }

    if (mode === 'forward') {
      cc = defaultCcAddresses();
      subject = /^\s*WG:/i.test(source.subject || '') ? source.subject : 'WG: ' + (source.subject || '');
      body = signatureHtml() + quotedHeader(source);
      // Anhänge der Ursprungsnachricht mitnehmen
      ui.attachments = (source.attachments || []).map((a) => Object.assign({}, a, { id: uid('a') }));
    }

    if (mode === 'draft') {
      ui.draftId = source.id;
      to = source.to || [];
      cc = source.cc || [];
      bcc = source.bcc || [];
      subject = source.subject || '';
      body = source.body || '';
      ui.attachments = (source.attachments || []).map((a) => Object.assign({}, a));
    }

    compose.to.value = formatAddresses(to);
    compose.cc.value = formatAddresses(cc);
    compose.bcc.value = formatAddresses(bcc);
    compose.subject.value = subject;
    compose.body.innerHTML = sanitizeHtml(body);

    setRowVisible('cc', cc.length > 0);
    setRowVisible('bcc', bcc.length > 0);

    const titles = {
      new: 'Neue Nachricht', reply: 'Antworten', replyAll: 'Allen antworten',
      forward: 'Weiterleiten', draft: 'Entwurf bearbeiten'
    };
    $('compose-title').textContent = titles[mode] || 'Neue Nachricht';

    renderComposeAttachments();
    setComposeHint('');
    compose.overlay.hidden = false;

    if (mode === 'new' || mode === 'forward') {
      compose.to.focus();
    } else {
      compose.body.focus();
      placeCaretAtStart(compose.body);
    }
  }

  function closeCompose() {
    compose.overlay.hidden = true;
    state.ui.composeMode = null;
    state.ui.draftId = null;
    state.ui.attachments = [];
    hideAllSuggestions();
  }

  function setRowVisible(which, visible) {
    $('row-' + which).hidden = !visible;
    const toggle = $('toggle-' + which);
    if (toggle) toggle.setAttribute('aria-pressed', String(visible));
  }

  function setComposeHint(text, isError) {
    const hint = $('compose-hint');
    hint.textContent = text;
    hint.classList.toggle('is-error', Boolean(isError));
  }

  function placeCaretAtStart(el) {
    const range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function collectCompose() {
    return {
      to: parseAddresses(compose.to.value),
      cc: parseAddresses(compose.cc.value),
      bcc: parseAddresses(compose.bcc.value),
      subject: compose.subject.value.trim(),
      body: sanitizeHtml(compose.body.innerHTML),
      attachments: state.ui.attachments.slice()
    };
  }

  function rememberContacts(addresses) {
    addresses.forEach((addr) => {
      if (!state.contacts.some((c) => c.email.toLowerCase() === addr.email.toLowerCase())) {
        state.contacts.push({ name: addr.name || '', email: addr.email });
      }
    });
  }

  function sendMessage(event) {
    if (event) event.preventDefault();
    const data = collectCompose();

    if (!data.to.length && !data.cc.length && !data.bcc.length) {
      setComposeHint('Bitte mindestens einen Empfänger angeben.', true);
      compose.to.focus();
      return;
    }

    const invalid = data.to.concat(data.cc, data.bcc).filter((a) => !isValidEmail(a.email));
    if (invalid.length) {
      setComposeHint('Ungültige Adresse: ' + invalid.map((a) => a.email).join(', '), true);
      return;
    }

    if (!data.subject && !confirm('Die Nachricht hat keinen Betreff. Trotzdem senden?')) return;

    const message = {
      id: state.ui.draftId || uid('m'),
      folder: 'sent',
      read: true,
      flagged: false,
      from: Object.assign({}, state.settings.me),
      to: data.to, cc: data.cc, bcc: data.bcc,
      subject: data.subject,
      date: new Date().toISOString(),
      body: data.body,
      attachments: data.attachments
    };

    const existing = state.messages.findIndex((m) => m.id === message.id);
    if (existing >= 0) state.messages[existing] = message;
    else state.messages.push(message);

    rememberContacts(data.to.concat(data.cc, data.bcc));
    save();

    // Anbindung an einen echten Versand: window.MailTransport.send(message)
    if (window.MailTransport && typeof window.MailTransport.send === 'function') {
      try {
        window.MailTransport.send(message);
      } catch (err) {
        toast('Versand-Schnittstelle meldete einen Fehler: ' + err.message);
      }
    }

    closeCompose();
    state.ui.selectedId = message.id;
    state.ui.folder = 'sent';
    render();

    const ccInfo = data.cc.length ? ' (CC an ' + data.cc.map(displayName).join(', ') + ')' : '';
    toast('Nachricht gesendet' + ccInfo);
  }

  function saveDraft(silent) {
    const data = collectCompose();
    const isEmpty = !data.to.length && !data.cc.length && !data.subject
      && !htmlToText(data.body) && !data.attachments.length;
    if (isEmpty) {
      if (!silent) toast('Nichts zu speichern.');
      return false;
    }

    const draft = {
      id: state.ui.draftId || uid('m'),
      folder: 'drafts',
      read: true,
      flagged: false,
      from: Object.assign({}, state.settings.me),
      to: data.to, cc: data.cc, bcc: data.bcc,
      subject: data.subject,
      date: new Date().toISOString(),
      body: data.body,
      attachments: data.attachments
    };

    const existing = state.messages.findIndex((m) => m.id === draft.id);
    if (existing >= 0) state.messages[existing] = draft;
    else state.messages.push(draft);

    state.ui.draftId = draft.id;
    save();
    if (!silent) {
      closeCompose();
      render();
      toast('Entwurf gespeichert');
    }
    return true;
  }

  function discardCompose() {
    const data = collectCompose();
    const hasContent = data.to.length || data.cc.length || data.subject
      || htmlToText(data.body) || data.attachments.length;
    if (hasContent && !confirm('Nachricht verwerfen? Nicht gespeicherte Änderungen gehen verloren.')) return;

    if (state.ui.draftId) {
      const draft = state.messages.find((m) => m.id === state.ui.draftId);
      if (draft && draft.folder === 'drafts') draft.folder = 'trash';
      save();
    }
    closeCompose();
    render();
  }

  /* ---------------------------------------------------------
     Anhänge
     --------------------------------------------------------- */

  function totalAttachmentBytes() {
    return state.ui.attachments.reduce((sum, a) => sum + (a.size || 0), 0);
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    let pending = files.length;
    let added = 0;

    files.forEach((file) => {
      if (file.size > MAX_FILE_BYTES) {
        toast('„' + file.name + '“ ist zu groß (max. ' + formatBytes(MAX_FILE_BYTES) + ').');
        if (--pending === 0) finish();
        return;
      }
      if (totalAttachmentBytes() + file.size > MAX_TOTAL_BYTES) {
        toast('Gesamtgröße der Anhänge überschreitet ' + formatBytes(MAX_TOTAL_BYTES) + '.');
        if (--pending === 0) finish();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        state.ui.attachments.push({
          id: uid('a'),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result
        });
        added++;
        renderComposeAttachments();
        if (--pending === 0) finish();
      };
      reader.onerror = () => {
        toast('„' + file.name + '“ konnte nicht gelesen werden.');
        if (--pending === 0) finish();
      };
      reader.readAsDataURL(file);
    });

    function finish() {
      renderComposeAttachments();
      if (added) setComposeHint(added + ' Anhang/Anhänge hinzugefügt.');
    }
  }

  function renderComposeAttachments() {
    const box = $('compose-attachments');
    box.textContent = '';
    const files = state.ui.attachments;
    box.hidden = files.length === 0;
    if (!files.length) return;

    const label = document.createElement('span');
    label.className = 'muted';
    label.textContent = files.length + ' Anhang/Anhänge · ' + formatBytes(totalAttachmentBytes());
    box.appendChild(label);

    files.forEach((file) => {
      const chip = document.createElement('span');
      chip.className = 'attachment';
      chip.appendChild(svgIcon('i-attach'));

      const name = document.createElement('span');
      name.className = 'attachment__name';
      name.textContent = file.name;
      chip.appendChild(name);

      const size = document.createElement('span');
      size.className = 'attachment__size';
      size.textContent = formatBytes(file.size);
      chip.appendChild(size);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'attachment__remove';
      remove.title = 'Anhang entfernen';
      remove.setAttribute('aria-label', 'Anhang ' + file.name + ' entfernen');
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        state.ui.attachments = state.ui.attachments.filter((a) => a.id !== file.id);
        renderComposeAttachments();
      });
      chip.appendChild(remove);

      box.appendChild(chip);
    });
  }

  function setupAttachments() {
    const input = $('file-input');

    $('btn-attach').addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      addFiles(input.files);
      input.value = '';   // erlaubt erneutes Auswählen derselben Datei
    });

    const zone = $('drop-zone');
    const hint = $('drop-hint');
    let dragDepth = 0;

    ['dragenter', 'dragover'].forEach((type) => {
      zone.addEventListener(type, (event) => {
        if (!Array.from(event.dataTransfer.types || []).includes('Files')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        if (type === 'dragenter') dragDepth++;
        hint.hidden = false;
      });
    });

    zone.addEventListener('dragleave', () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) hint.hidden = true;
    });

    zone.addEventListener('drop', (event) => {
      if (!Array.from(event.dataTransfer.types || []).includes('Files')) return;
      event.preventDefault();
      dragDepth = 0;
      hint.hidden = true;
      addFiles(event.dataTransfer.files);
    });

    // Bilder/Dateien aus der Zwischenablage anhängen
    compose.body.addEventListener('paste', (event) => {
      const files = Array.from(event.clipboardData ? event.clipboardData.files : []);
      if (files.length) {
        event.preventDefault();
        addFiles(files);
      }
    });

    // Verhindert, dass das Fenster die Datei einfach öffnet
    window.addEventListener('dragover', (event) => event.preventDefault());
    window.addEventListener('drop', (event) => {
      if (compose.overlay.hidden) event.preventDefault();
    });
  }

  /* ---------------------------------------------------------
     Textbausteine
     --------------------------------------------------------- */

  let savedRange = null;

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (compose.body.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  }

  function restoreSelection() {
    compose.body.focus();
    if (!savedRange) {
      placeCaretAtStart(compose.body);
      return;
    }
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  function resolvePlaceholders(text) {
    const recipients = parseAddresses(compose.to.value);
    const recipient = recipients.length ? displayName(recipients[0]) : '';
    return text
      .replace(/\{\{\s*Empfänger\s*\}\}/gi, recipient)
      .replace(/\{\{\s*Absender\s*\}\}/gi, state.settings.me.name || state.settings.me.email || '')
      .replace(/\{\{\s*Datum\s*\}\}/gi, new Date().toLocaleDateString('de-AT'));
  }

  function insertSnippet(snippet) {
    restoreSelection();
    const html = textToHtml(resolvePlaceholders(snippet.body));
    const inserted = document.execCommand('insertHTML', false, html);
    if (!inserted) {
      compose.body.innerHTML += html;
    }
    rememberSelection();
    setComposeHint('Textbaustein „' + snippet.title + '“ eingefügt.');
  }

  function snippetCategories() {
    const categories = [];
    state.snippets.forEach((s) => {
      const cat = s.category || 'Allgemein';
      if (!categories.includes(cat)) categories.push(cat);
    });
    return categories;
  }

  function renderSnippetMenu() {
    const menu = $('snippet-menu');
    menu.textContent = '';

    if (!state.snippets.length) {
      const empty = document.createElement('p');
      empty.className = 'dropdown__group';
      empty.textContent = 'Noch keine Textbausteine angelegt.';
      menu.appendChild(empty);
    }

    snippetCategories().forEach((category) => {
      const head = document.createElement('div');
      head.className = 'dropdown__group';
      head.textContent = category;
      menu.appendChild(head);

      state.snippets
        .filter((s) => (s.category || 'Allgemein') === category)
        .forEach((snippet) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'dropdown__item';
          item.textContent = snippet.title;

          const preview = document.createElement('small');
          preview.textContent = snippet.body.replace(/\s+/g, ' ').trim().slice(0, 70);
          item.appendChild(preview);

          item.addEventListener('click', () => {
            insertSnippet(snippet);
            toggleSnippetMenu(false);
          });
          menu.appendChild(item);
        });
    });

    const manage = document.createElement('button');
    manage.type = 'button';
    manage.className = 'dropdown__item';
    manage.textContent = '⚙ Textbausteine verwalten …';
    manage.addEventListener('click', () => {
      toggleSnippetMenu(false);
      openSnippetManager();
    });
    menu.appendChild(manage);
  }

  function toggleSnippetMenu(force) {
    const menu = $('snippet-menu');
    const toggle = $('snippet-toggle');
    const open = typeof force === 'boolean' ? force : menu.hidden;
    if (open) renderSnippetMenu();
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  function renderSnippetList() {
    const list = $('snippet-list');
    list.textContent = '';

    state.snippets.forEach((snippet) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'snippet-list__item';
      btn.setAttribute('aria-current', String(snippet.id === state.ui.editingSnippetId));
      btn.textContent = snippet.title;

      const meta = document.createElement('small');
      meta.textContent = (snippet.category || 'Allgemein') + ' · ' + snippet.body.replace(/\s+/g, ' ').trim().slice(0, 50);
      btn.appendChild(meta);

      btn.addEventListener('click', () => loadSnippetIntoEditor(snippet.id));
      li.appendChild(btn);
      list.appendChild(li);
    });

    const datalist = $('sn-categories');
    datalist.textContent = '';
    snippetCategories().forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      datalist.appendChild(option);
    });
  }

  function loadSnippetIntoEditor(id) {
    const snippet = state.snippets.find((s) => s.id === id);
    state.ui.editingSnippetId = snippet ? snippet.id : null;
    $('sn-title').value = snippet ? snippet.title : '';
    $('sn-category').value = snippet ? (snippet.category || '') : '';
    $('sn-body').value = snippet ? snippet.body : '';
    renderSnippetList();
  }

  function openSnippetManager() {
    loadSnippetIntoEditor(state.snippets.length ? state.snippets[0].id : null);
    $('snippets-overlay').hidden = false;
    $('sn-title').focus();
  }

  function setupSnippets() {
    $('btn-snippets').addEventListener('click', openSnippetManager);
    $('snippets-close').addEventListener('click', () => { $('snippets-overlay').hidden = true; });

    $('snippet-toggle').addEventListener('click', () => toggleSnippetMenu());

    document.addEventListener('click', (event) => {
      if (!$('snippet-dropdown').contains(event.target)) toggleSnippetMenu(false);
    });

    $('sn-new').addEventListener('click', () => {
      state.ui.editingSnippetId = null;
      $('sn-title').value = '';
      $('sn-category').value = '';
      $('sn-body').value = '';
      renderSnippetList();
      $('sn-title').focus();
    });

    $('sn-delete').addEventListener('click', () => {
      const id = state.ui.editingSnippetId;
      if (!id) return;
      const snippet = state.snippets.find((s) => s.id === id);
      if (!snippet || !confirm('Textbaustein „' + snippet.title + '“ löschen?')) return;
      state.snippets = state.snippets.filter((s) => s.id !== id);
      save();
      loadSnippetIntoEditor(state.snippets.length ? state.snippets[0].id : null);
      toast('Textbaustein gelöscht');
    });

    $('snippet-editor').addEventListener('submit', (event) => {
      event.preventDefault();
      const title = $('sn-title').value.trim();
      const category = $('sn-category').value.trim() || 'Allgemein';
      const body = $('sn-body').value;
      if (!title || !body.trim()) return;

      const existing = state.snippets.find((s) => s.id === state.ui.editingSnippetId);
      if (existing) {
        Object.assign(existing, { title: title, category: category, body: body });
      } else {
        const snippet = { id: uid('sn'), title: title, category: category, body: body };
        state.snippets.push(snippet);
        state.ui.editingSnippetId = snippet.id;
      }
      save();
      renderSnippetList();
      toast('Textbaustein gespeichert');
    });
  }

  /* ---------------------------------------------------------
     Empfänger-Vorschläge
     --------------------------------------------------------- */

  function setupSuggestions(inputId, boxId) {
    const input = $(inputId);
    const box = $(boxId);
    let activeIndex = -1;

    function currentFragment() {
      const value = input.value;
      const start = Math.max(value.lastIndexOf(';'), value.lastIndexOf(',')) + 1;
      return { start: start, text: value.slice(start).trim() };
    }

    function close() {
      box.hidden = true;
      box.textContent = '';
      activeIndex = -1;
    }

    function apply(contact) {
      const fragment = currentFragment();
      const prefix = input.value.slice(0, fragment.start);
      input.value = (prefix ? prefix.replace(/\s*$/, ' ') : '') + formatAddress(contact) + '; ';
      close();
      input.focus();
    }

    function update() {
      const fragment = currentFragment();
      if (fragment.text.length < 1) return close();

      const needle = fragment.text.toLowerCase();
      const already = parseAddresses(input.value).map((a) => a.email.toLowerCase());
      const matches = state.contacts
        .filter((c) => (c.name + ' ' + c.email).toLowerCase().includes(needle))
        .filter((c) => !already.includes(c.email.toLowerCase()) || c.email.toLowerCase().includes(needle))
        .slice(0, 8);

      if (!matches.length) return close();

      box.textContent = '';
      matches.forEach((contact, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'suggest__item' + (index === activeIndex ? ' is-active' : '');
        item.textContent = contact.name || contact.email;
        const mail = document.createElement('small');
        mail.textContent = contact.email;
        item.appendChild(mail);
        item.addEventListener('mousedown', (event) => {
          event.preventDefault();
          apply(contact);
        });
        box.appendChild(item);
      });
      box.hidden = false;
    }

    input.addEventListener('input', () => { activeIndex = -1; update(); });
    input.addEventListener('focus', update);
    input.addEventListener('blur', () => setTimeout(close, 120));

    input.addEventListener('keydown', (event) => {
      const items = Array.from(box.querySelectorAll('.suggest__item'));
      if (box.hidden || !items.length) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        activeIndex = event.key === 'ArrowDown'
          ? (activeIndex + 1) % items.length
          : (activeIndex - 1 + items.length) % items.length;
        items.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        items[activeIndex].dispatchEvent(new MouseEvent('mousedown'));
      } else if (event.key === 'Escape') {
        close();
      }
    });
  }

  function hideAllSuggestions() {
    ['suggest-to', 'suggest-cc', 'suggest-bcc'].forEach((id) => {
      const box = $(id);
      box.hidden = true;
      box.textContent = '';
    });
  }

  /* ---------------------------------------------------------
     Einstellungen
     --------------------------------------------------------- */

  function openSettings() {
    $('set-name').value = state.settings.me.name || '';
    $('set-mail').value = state.settings.me.email || '';
    $('set-cc').value = state.settings.defaultCc || '';
    $('set-cc-self').checked = Boolean(state.settings.ccSelf);
    $('set-reply-all-default').checked = Boolean(state.settings.replyAllDefault);
    $('set-signature').value = state.settings.signature || '';
    $('settings-overlay').hidden = false;
    $('set-name').focus();
  }

  function setupSettings() {
    $('btn-settings').addEventListener('click', openSettings);
    $('settings-close').addEventListener('click', () => { $('settings-overlay').hidden = true; });

    $('settings-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const email = $('set-mail').value.trim();
      if (email && !isValidEmail(email)) {
        toast('Bitte eine gültige eigene E-Mail-Adresse angeben.');
        return;
      }
      const invalidCc = parseAddresses($('set-cc').value).filter((a) => !isValidEmail(a.email));
      if (invalidCc.length) {
        toast('Ungültige CC-Adresse: ' + invalidCc.map((a) => a.email).join(', '));
        return;
      }

      state.settings.me = { name: $('set-name').value.trim(), email: email };
      state.settings.defaultCc = $('set-cc').value.trim();
      state.settings.ccSelf = $('set-cc-self').checked;
      state.settings.replyAllDefault = $('set-reply-all-default').checked;
      state.settings.signature = $('set-signature').value;
      save();
      $('settings-overlay').hidden = true;
      render();
      toast('Einstellungen gespeichert');
    });

    $('set-reset').addEventListener('click', () => {
      if (!confirm('Alle Nachrichten, Ordner und Einstellungen auf die Beispieldaten zurücksetzen?')) return;
      seedState();
      save();
      $('settings-overlay').hidden = true;
      state.ui.folder = 'inbox';
      state.ui.selectedId = null;
      render();
      toast('Beispieldaten wiederhergestellt');
    });
  }

  /* ---------------------------------------------------------
     Verschieben-Dialog
     --------------------------------------------------------- */

  function openMoveDialog() {
    const message = selectedMessage();
    if (!message) return;

    const list = $('move-list');
    list.textContent = '';

    const targets = SYSTEM_FOLDERS.map((f) => ({ id: f.id, name: f.name, icon: f.icon }))
      .concat(state.folders.map((f) => ({ id: f.id, name: f.name, icon: 'i-move' })))
      .filter((f) => f.id !== message.folder);

    targets.forEach((target) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.appendChild(svgIcon(target.icon));
      btn.appendChild(document.createTextNode(target.name));
      btn.addEventListener('click', () => {
        moveMessage(message.id, target.id);
        $('move-overlay').hidden = true;
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    $('move-overlay').hidden = false;
  }

  /* ---------------------------------------------------------
     Mobile Ansicht
     --------------------------------------------------------- */

  function setMobileView(view) {
    state.ui.mobileView = view;
    document.body.dataset.mobileView = view;

    const btn = $('btn-mobile-back');
    const use = btn.querySelector('use');
    const inList = view === 'list';
    use.setAttribute('href', inList ? '#i-menu' : '#i-back');
    btn.setAttribute('aria-label', inList ? 'Ordner anzeigen' : 'Zurück zur Liste');
    btn.title = btn.getAttribute('aria-label');
  }

  function stepMobileViewBack() {
    setMobileView(state.ui.mobileView === 'list' ? 'folders' : 'list');
  }

  /* ---------------------------------------------------------
     Tastenkürzel
     --------------------------------------------------------- */

  function anyOverlayOpen() {
    return ['compose-overlay', 'snippets-overlay', 'settings-overlay', 'move-overlay']
      .some((id) => !$(id).hidden);
  }

  function closeTopOverlay() {
    if (!$('move-overlay').hidden) return void ($('move-overlay').hidden = true);
    if (!$('settings-overlay').hidden) return void ($('settings-overlay').hidden = true);
    if (!$('snippets-overlay').hidden) return void ($('snippets-overlay').hidden = true);
    if (!$('compose-overlay').hidden) discardCompose();
  }

  function moveSelection(delta) {
    const messages = visibleMessages();
    if (!messages.length) return;
    const index = messages.findIndex((m) => m.id === state.ui.selectedId);
    const next = Math.min(messages.length - 1, Math.max(0, index < 0 ? 0 : index + delta));
    openMessage(messages[next].id);
    const el = document.querySelector('.msg[data-id="' + messages[next].id + '"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function setupShortcuts() {
    document.addEventListener('keydown', (event) => {
      const ctrl = event.ctrlKey || event.metaKey;
      const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)
        || event.target.isContentEditable;

      if (event.key === 'Escape') {
        if (anyOverlayOpen()) { event.preventDefault(); closeTopOverlay(); }
        return;
      }

      // Innerhalb des Verfassen-Fensters
      if (!$('compose-overlay').hidden) {
        if (ctrl && event.key === 'Enter') { event.preventDefault(); sendMessage(); }
        if (ctrl && event.key.toLowerCase() === 's') { event.preventDefault(); saveDraft(false); }
        return;
      }

      if (ctrl && event.key.toLowerCase() === 'n') { event.preventDefault(); openCompose('new'); return; }
      if (ctrl && event.key.toLowerCase() === 'e') { event.preventDefault(); $('search-input').focus(); return; }

      const message = selectedMessage();
      if (ctrl && event.key.toLowerCase() === 'r' && message) {
        event.preventDefault();
        openCompose(event.shiftKey ? 'replyAll' : (state.settings.replyAllDefault ? 'replyAll' : 'reply'), message);
        return;
      }
      if (ctrl && event.shiftKey && event.key.toLowerCase() === 'f' && message) {
        event.preventDefault();
        openCompose('forward', message);
        return;
      }

      if (inField) return;

      if (event.key === 'Delete' && message) { event.preventDefault(); deleteSelected(); return; }
      if (event.key === 'ArrowDown') { event.preventDefault(); moveSelection(1); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); moveSelection(-1); }
    });
  }

  /* ---------------------------------------------------------
     Verdrahtung
     --------------------------------------------------------- */

  function requireSelection(action) {
    return function () {
      const message = selectedMessage();
      if (!message) { toast('Bitte zuerst eine Nachricht auswählen.'); return; }
      action(message);
    };
  }

  function setupCompose() {
    compose.overlay = $('compose-overlay');
    compose.form = $('compose-form');
    compose.to = $('f-to');
    compose.cc = $('f-cc');
    compose.bcc = $('f-bcc');
    compose.subject = $('f-subject');
    compose.body = $('f-body');

    compose.form.addEventListener('submit', sendMessage);
    $('compose-close').addEventListener('click', () => {
      if (saveDraft(true)) toast('Als Entwurf gespeichert');
      closeCompose();
      render();
    });
    $('btn-save-draft').addEventListener('click', () => saveDraft(false));
    $('btn-discard').addEventListener('click', discardCompose);

    $('toggle-cc').addEventListener('click', () => {
      const visible = $('row-cc').hidden;
      setRowVisible('cc', visible);
      if (visible) compose.cc.focus();
    });
    $('toggle-bcc').addEventListener('click', () => {
      const visible = $('row-bcc').hidden;
      setRowVisible('bcc', visible);
      if (visible) compose.bcc.focus();
    });

    $('btn-cc-me').addEventListener('click', () => {
      const me = state.settings.me;
      if (!me.email) { toast('Bitte zuerst die eigene Adresse in den Einstellungen hinterlegen.'); return; }
      const existing = parseAddresses(compose.cc.value);
      if (existing.some((a) => sameAddress(a, me))) { toast('Eigene Adresse steht bereits im CC.'); return; }
      existing.push(Object.assign({}, me));
      compose.cc.value = formatAddresses(existing);
      setRowVisible('cc', true);
    });

    // Formatierung
    document.querySelectorAll('.fmt-btn').forEach((btn) => {
      btn.addEventListener('mousedown', (event) => event.preventDefault());
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        compose.body.focus();
        if (cmd === 'createLink') {
          const url = prompt('Ziel-Adresse (URL):', 'https://');
          if (!url) return;
          document.execCommand('createLink', false, url);
        } else {
          document.execCommand(cmd, false, null);
        }
        rememberSelection();
      });
    });

    ['keyup', 'mouseup', 'input'].forEach((type) => {
      compose.body.addEventListener(type, rememberSelection);
    });
    compose.body.addEventListener('blur', rememberSelection);

    setupSuggestions('f-to', 'suggest-to');
    setupSuggestions('f-cc', 'suggest-cc');
    setupSuggestions('f-bcc', 'suggest-bcc');
    setupAttachments();
  }

  function setupRibbon() {
    $('btn-new').addEventListener('click', () => openCompose('new'));
    $('btn-reply').addEventListener('click', requireSelection((m) =>
      openCompose(state.settings.replyAllDefault ? 'replyAll' : 'reply', m)));
    $('btn-reply-all').addEventListener('click', requireSelection((m) => openCompose('replyAll', m)));
    $('btn-forward').addEventListener('click', requireSelection((m) => openCompose('forward', m)));
    $('btn-delete').addEventListener('click', deleteSelected);
    $('btn-archive').addEventListener('click', requireSelection((m) => moveMessage(m.id, 'archive')));
    $('btn-move').addEventListener('click', openMoveDialog);
    $('btn-flag').addEventListener('click', toggleFlag);
    $('btn-read').addEventListener('click', toggleRead);

    $('read-reply').addEventListener('click', requireSelection((m) =>
      openCompose(state.settings.replyAllDefault ? 'replyAll' : 'reply', m)));
    $('read-reply-all').addEventListener('click', requireSelection((m) => openCompose('replyAll', m)));
    $('read-forward').addEventListener('click', requireSelection((m) => openCompose('forward', m)));
    $('read-print').addEventListener('click', () => window.print());

    $('move-close').addEventListener('click', () => { $('move-overlay').hidden = true; });
    $('btn-add-folder').addEventListener('click', addFolder);
    $('btn-mobile-back').addEventListener('click', stepMobileViewBack);
  }

  function setupListControls() {
    const search = $('search-input');
    const clear = $('search-clear');

    search.addEventListener('input', () => {
      state.ui.search = search.value;
      clear.hidden = !search.value;
      renderList();
    });
    clear.addEventListener('click', () => {
      search.value = '';
      state.ui.search = '';
      clear.hidden = true;
      renderList();
      search.focus();
    });

    $('filter-unread').addEventListener('change', (event) => {
      state.ui.unreadOnly = event.target.checked;
      renderList();
    });
    $('sort-select').addEventListener('change', (event) => {
      state.ui.sort = event.target.value;
      renderList();
    });

    // Overlays per Klick auf den Hintergrund schließen
    ['snippets-overlay', 'settings-overlay', 'move-overlay'].forEach((id) => {
      $(id).addEventListener('click', (event) => {
        if (event.target.id === id) $(id).hidden = true;
      });
    });
  }

  function init() {
    load();
    setupCompose();
    setupRibbon();
    setupListControls();
    setupSnippets();
    setupSettings();
    setupShortcuts();
    setMobileView('list');
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
