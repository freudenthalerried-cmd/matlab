(function () {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');

  // Textbausteine (Rechtstexte zum Einfügen)
  const SNIPPETS = {
    'hitze-schutzkleidung': {
      titel: 'Hitzeschutzverordnung (Hitze-V)',
      fundstelle: 'BGBl. II Nr. 325/2025 – § 5 Abs. 2 (Persönliche Schutzausrüstung)',
      bild: 'hitzeschutz-schutzkleidung.png',
      text:
        '„Arbeitgeberinnen und Arbeitgeber müssen Schutzkleidung im Sinn des ' +
        '§ 16 Abs. 2 Z 7 der Verordnung Persönliche Schutzausrüstung – PSA-V, ' +
        'BGBl. II Nr. 77/2014, gegen natürliche UV-Strahlung zur Verfügung stellen, ' +
        'die den Körper ausreichend bedeckt, wie zumindest T-Shirts mit ' +
        'UV-Schutzfunktion bis zur Mitte des Oberarms und Hosen mit ' +
        'UV-Schutzfunktion bis zum Knie, und dafür sorgen, dass diese getragen werden.“'
    }
  };

  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0;
  }

  function appendMessage(text) {
    const li = document.createElement('li');
    li.textContent = text;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  async function copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback für ältere Browser / fehlende Berechtigung
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (button) {
      const original = button.textContent;
      button.textContent = '✓ Kopiert';
      setTimeout(function () { button.textContent = original; }, 1500);
    }
  }

  function appendSnippet(snippet) {
    const li = document.createElement('li');
    li.className = 'snippet-message';

    const heading = document.createElement('div');
    heading.className = 'snippet-title';
    heading.textContent = snippet.titel;
    li.appendChild(heading);

    const sub = document.createElement('div');
    sub.className = 'snippet-fundstelle';
    sub.textContent = snippet.fundstelle;
    li.appendChild(sub);

    if (snippet.bild) {
      const img = document.createElement('img');
      img.className = 'snippet-bild';
      img.src = snippet.bild;
      img.alt = snippet.titel + ' – ' + snippet.fundstelle;
      li.appendChild(img);
    }

    const body = document.createElement('p');
    body.className = 'snippet-text';
    body.textContent = snippet.text;
    li.appendChild(body);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-button';
    copyBtn.textContent = '📋 In Zwischenablage kopieren';
    copyBtn.addEventListener('click', function () {
      copyToClipboard(snippet.text, copyBtn);
    });
    li.appendChild(copyBtn);

    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  document.querySelectorAll('.snippet-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      const snippet = SNIPPETS[chip.dataset.snippet];
      if (snippet) appendSnippet(snippet);
    });
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
})();
