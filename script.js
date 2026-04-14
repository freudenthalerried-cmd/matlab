(function () {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');
  const attachButton = document.getElementById('attach-button');
  const fileInput = document.getElementById('chat-file');
  const chip = document.getElementById('attachment-chip');

  let currentFile = null;

  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0 && !currentFile;
  }

  function showChip(file) {
    chip.textContent = '';
    const name = document.createElement('span');
    name.textContent = file.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Anhang entfernen');
    remove.textContent = '\u00d7';
    remove.addEventListener('click', clearAttachment);
    chip.appendChild(name);
    chip.appendChild(remove);
    chip.hidden = false;
  }

  function clearAttachment() {
    currentFile = null;
    fileInput.value = '';
    chip.hidden = true;
    chip.textContent = '';
    updateSendState();
  }

  function appendMessage(text, file) {
    const li = document.createElement('li');
    if (text) {
      const textDiv = document.createElement('div');
      textDiv.textContent = text;
      li.appendChild(textDiv);
    }
    if (file) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '\ud83d\udcce ' + file.name;
      li.appendChild(link);
    }
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  input.addEventListener('input', updateSendState);

  attachButton.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Bitte eine PDF-Datei auswählen.');
      fileInput.value = '';
      return;
    }
    currentFile = file;
    showChip(file);
    updateSendState();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text && !currentFile) return;
    appendMessage(text, currentFile);
    input.value = '';
    clearAttachment();
    input.focus();
  });

  updateSendState();
  input.focus();
})();
