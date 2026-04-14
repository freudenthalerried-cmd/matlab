import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
import MsgReader from 'https://cdn.jsdelivr.net/npm/@kenjiuno/msgreader@1.22.0/+esm';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

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

async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
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
  const buf = await file.arrayBuffer();
  const reader = new MsgReader(buf);
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

updateSendState();
input.focus();
