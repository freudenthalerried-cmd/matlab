const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const attachButton = document.getElementById('attach-button');
const fileInput = document.getElementById('file-input');
const messages = document.getElementById('messages');

function updateSendState() {
  sendButton.disabled = input.value.trim().length === 0;
}

function appendMessage(text, opts = {}) {
  const li = document.createElement('li');
  if (opts.className) li.className = opts.className;

  if (opts.meta) {
    const meta = document.createElement('div');
    meta.className = 'attachment-meta';
    const name = document.createElement('span');
    name.className = 'attachment-name';
    name.textContent = opts.meta.name;
    const chip = document.createElement('span');
    chip.className = 'attachment-chip';
    chip.textContent = opts.meta.kind;
    meta.append(name, chip);
    li.appendChild(meta);
  }

  if (opts.pre) {
    const pre = document.createElement('pre');
    pre.className = 'attachment-body';
    pre.textContent = text;
    li.appendChild(pre);
  } else {
    li.appendChild(document.createTextNode(text));
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
  return li;
}

// --- Lazy-Loader mit Fallback-CDN -------------------------------------------
let pdfjsLib = null;
let MsgReader = null;

async function loadPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const candidates = [
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm',
    'https://esm.sh/pdfjs-dist@4.0.379',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.mjs',
  ];
  let lastErr;
  for (const url of candidates) {
    try {
      const mod = await import(url);
      const lib = mod.default && mod.default.getDocument ? mod.default : mod;
      if (!lib.getDocument) throw new Error('getDocument fehlt im Modul');
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
      pdfjsLib = lib;
      return lib;
    } catch (e) {
      lastErr = e;
      console.warn('pdfjs load failed from', url, e);
    }
  }
  throw new Error(`pdf.js konnte nicht geladen werden: ${lastErr && lastErr.message}`);
}

async function loadMsgReader() {
  if (MsgReader) return MsgReader;
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
      MsgReader = Ctor;
      return Ctor;
    } catch (e) {
      lastErr = e;
      console.warn('msgreader load failed from', url, e);
    }
  }
  throw new Error(`msgreader konnte nicht geladen werden: ${lastErr && lastErr.message}`);
}

// --- Extraktion -------------------------------------------------------------
async function extractPdfText(file) {
  const lib = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await lib.getDocument({ data }).promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join(' ');
    parts.push(`--- Seite ${i} ---\n${pageText}`);
  }
  return parts.join('\n\n');
}

async function extractMsgText(file) {
  const Ctor = await loadMsgReader();
  const buf = await file.arrayBuffer();
  const reader = new Ctor(buf);
  const data = reader.getFileData();
  if (data.error) throw new Error(data.error);

  const lines = [];
  if (data.subject) lines.push(`Betreff: ${data.subject}`);
  const from = [data.senderName, data.senderEmail].filter(Boolean).join(' <') +
    (data.senderEmail ? '>' : '');
  if (from) lines.push(`Von: ${from}`);
  if (data.recipients && data.recipients.length) {
    const rcp = data.recipients
      .map((r) => [r.name, r.email].filter(Boolean).join(' <') + (r.email ? '>' : ''))
      .join(', ');
    lines.push(`An: ${rcp}`);
  }
  if (data.messageDeliveryTime) lines.push(`Datum: ${data.messageDeliveryTime}`);
  lines.push('');
  lines.push(data.body || data.bodyHtml || '(kein Textinhalt)');

  if (data.attachments && data.attachments.length) {
    lines.push('');
    lines.push('Anhänge:');
    for (const a of data.attachments) {
      lines.push(`  • ${a.fileName || a.name || '(unbenannt)'}`);
    }
  }
  return lines.join('\n');
}

async function handleFile(file) {
  const name = file.name;
  const lower = name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf');
  const isMsg = lower.endsWith('.msg');

  if (!isPdf && !isMsg) {
    appendMessage(`Dateityp nicht unterstützt: ${name}`, { className: 'error' });
    return;
  }

  const kind = isPdf ? 'PDF' : 'E-Mail (.msg)';
  const loading = appendMessage(`Lese ${kind}…`, {
    className: 'attachment loading',
    meta: { name, kind },
  });

  attachButton.disabled = true;
  try {
    const text = isPdf ? await extractPdfText(file) : await extractMsgText(file);
    loading.remove();
    appendMessage(text.trim() || '(kein Text extrahiert)', {
      className: 'attachment',
      meta: { name, kind },
      pre: true,
    });
  } catch (err) {
    loading.remove();
    console.error('Attachment error:', err);
    appendMessage(`Fehler beim Lesen von ${name}: ${err.message || err}`, {
      className: 'attachment error',
      meta: { name, kind },
    });
  } finally {
    attachButton.disabled = false;
  }
}

attachButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files && event.target.files[0];
  fileInput.value = '';
  if (file) await handleFile(file);
});

input.addEventListener('input', updateSendState);

form.addEventListener('submit', function (event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  appendMessage(text);
  input.value = '';
  updateSendState();
  input.focus();
});

// Globale Fehler sichtbar machen (statt stummer Abbruch)
window.addEventListener('error', (e) => {
  appendMessage(`Skript-Fehler: ${e.message}`, { className: 'error' });
});
window.addEventListener('unhandledrejection', (e) => {
  appendMessage(`Promise-Fehler: ${(e.reason && e.reason.message) || e.reason}`, {
    className: 'error',
  });
});

updateSendState();
input.focus();
