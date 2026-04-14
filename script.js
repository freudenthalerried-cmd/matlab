(function () {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const attachButton = document.getElementById('attach-button');
  const fileInput = document.getElementById('file-input');
  const messages = document.getElementById('messages');
  const chip = document.getElementById('attachment-chip');

  let pendingFile = null;

  // --- UI-Helfer -----------------------------------------------------------
  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0 && !pendingFile;
  }

  function showChip(file) {
    chip.textContent = '';
    const icon = document.createElement('span');
    icon.className = 'attachment-chip-icon';
    icon.textContent = '\uD83D\uDCCE';
    const name = document.createElement('span');
    name.className = 'attachment-chip-name';
    name.textContent = file.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'attachment-chip-remove';
    remove.setAttribute('aria-label', 'Anhang entfernen');
    remove.textContent = '\u00D7';
    remove.addEventListener('click', clearAttachment);
    chip.append(icon, name, remove);
    chip.hidden = false;
  }

  function clearAttachment() {
    pendingFile = null;
    fileInput.value = '';
    chip.textContent = '';
    chip.hidden = true;
    updateSendState();
  }

  function appendMessage(text, opts) {
    opts = opts || {};
    const li = document.createElement('li');
    if (opts.className) li.className = opts.className;

    if (opts.meta) {
      const meta = document.createElement('div');
      meta.className = 'attachment-meta';
      const name = document.createElement('span');
      name.className = 'attachment-name';
      name.textContent = opts.meta.name;
      const kind = document.createElement('span');
      kind.className = 'attachment-chip';
      kind.textContent = opts.meta.kind;
      meta.append(name, kind);
      li.appendChild(meta);
    }

    if (opts.userText) {
      const t = document.createElement('div');
      t.className = 'user-text';
      t.textContent = opts.userText;
      li.appendChild(t);
    }

    if (opts.pre) {
      const pre = document.createElement('pre');
      pre.className = 'attachment-body';
      pre.textContent = text;
      li.appendChild(pre);
    } else if (text) {
      li.appendChild(document.createTextNode(text));
    }

    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
    return li;
  }

  // --- Bibliotheken --------------------------------------------------------
  function getPdfjs() {
    const lib = window.pdfjsLib;
    if (!lib || !lib.getDocument) {
      throw new Error('pdf.js ist nicht geladen (CDN erreichbar?)');
    }
    if (!lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js';
    }
    return lib;
  }

  let msgReaderCtor = null;
  async function getMsgReader() {
    if (msgReaderCtor) return msgReaderCtor;
    const candidates = [
      'https://cdn.jsdelivr.net/npm/@kenjiuno/msgreader@1.22.0/+esm',
      'https://esm.sh/@kenjiuno/msgreader@1.22.0',
    ];
    let lastErr;
    for (const url of candidates) {
      try {
        const mod = await import(url);
        const Ctor = mod.default || mod.MsgReader || mod;
        if (typeof Ctor !== 'function') throw new Error('MsgReader-Klasse nicht gefunden');
        msgReaderCtor = Ctor;
        return Ctor;
      } catch (e) {
        lastErr = e;
        console.warn('msgreader load failed from', url, e);
      }
    }
    throw new Error(
      'msgreader konnte nicht geladen werden (für .msg wird ein Webserver benötigt, nicht file://): ' +
        ((lastErr && lastErr.message) || lastErr)
    );
  }

  // --- Extraktion ----------------------------------------------------------
  async function extractPdfText(file) {
    const lib = getPdfjs();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await lib.getDocument({ data }).promise;
    const parts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it) => it.str).join(' ');
      parts.push('--- Seite ' + i + ' ---\n' + pageText);
    }
    return parts.join('\n\n');
  }

  async function extractMsgText(file) {
    const Ctor = await getMsgReader();
    const buf = await file.arrayBuffer();
    const reader = new Ctor(buf);
    const data = reader.getFileData();
    if (data.error) throw new Error(data.error);

    const lines = [];
    if (data.subject) lines.push('Betreff: ' + data.subject);
    const senderParts = [data.senderName, data.senderEmail].filter(Boolean);
    if (senderParts.length) {
      lines.push(
        'Von: ' +
          senderParts.join(' <') +
          (data.senderEmail ? '>' : '')
      );
    }
    if (data.recipients && data.recipients.length) {
      const rcp = data.recipients
        .map((r) => {
          const parts = [r.name, r.email].filter(Boolean);
          return parts.join(' <') + (r.email ? '>' : '');
        })
        .join(', ');
      lines.push('An: ' + rcp);
    }
    if (data.messageDeliveryTime) lines.push('Datum: ' + data.messageDeliveryTime);
    lines.push('');
    lines.push(data.body || data.bodyHtml || '(kein Textinhalt)');

    if (data.attachments && data.attachments.length) {
      lines.push('');
      lines.push('Anhänge:');
      for (const a of data.attachments) {
        lines.push('  • ' + (a.fileName || a.name || '(unbenannt)'));
      }
    }
    return lines.join('\n');
  }

  // --- Flow ---------------------------------------------------------------
  function classify(file) {
    const lower = (file.name || '').toLowerCase();
    const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf');
    const isMsg = lower.endsWith('.msg');
    if (isPdf) return 'pdf';
    if (isMsg) return 'msg';
    return null;
  }

  async function processAndSend(file, userText) {
    const kind = classify(file);
    if (!kind) {
      appendMessage('Dateityp nicht unterstützt: ' + file.name, { className: 'error' });
      return;
    }
    const kindLabel = kind === 'pdf' ? 'PDF' : 'E-Mail (.msg)';
    const loading = appendMessage('Lese ' + kindLabel + '…', {
      className: 'attachment loading',
      meta: { name: file.name, kind: kindLabel },
      userText: userText || undefined,
    });
    attachButton.disabled = true;
    sendButton.disabled = true;
    try {
      const text = kind === 'pdf' ? await extractPdfText(file) : await extractMsgText(file);
      loading.remove();
      appendMessage(text.trim() || '(kein Text extrahiert)', {
        className: 'attachment',
        meta: { name: file.name, kind: kindLabel },
        userText: userText || undefined,
        pre: true,
      });
    } catch (err) {
      loading.remove();
      console.error('Attachment error:', err);
      appendMessage('Fehler beim Lesen von ' + file.name + ': ' + (err.message || err), {
        className: 'attachment error',
        meta: { name: file.name, kind: kindLabel },
        userText: userText || undefined,
      });
    } finally {
      attachButton.disabled = false;
      updateSendState();
    }
  }

  // --- Events -------------------------------------------------------------
  attachButton.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!classify(file)) {
      appendMessage('Dateityp nicht unterstützt: ' + file.name, { className: 'error' });
      fileInput.value = '';
      return;
    }
    pendingFile = file;
    showChip(file);
    updateSendState();
  });

  input.addEventListener('input', updateSendState);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const text = input.value.trim();
    const file = pendingFile;
    if (!text && !file) return;

    input.value = '';
    clearAttachment();
    updateSendState();

    if (file) {
      await processAndSend(file, text);
    } else {
      appendMessage(text);
    }
    input.focus();
  });

  // Globale Fehler sichtbar machen (statt stummer Abbruch)
  window.addEventListener('error', (e) => {
    appendMessage('Skript-Fehler: ' + e.message, { className: 'error' });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = (e.reason && e.reason.message) || String(e.reason);
    appendMessage('Promise-Fehler: ' + msg, { className: 'error' });
  });

  updateSendState();
  input.focus();
})();
