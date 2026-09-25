(function () {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');

  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0;
  }

  function appendMessage(text) {
    const li = document.createElement('li');
    li.textContent = text;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  input.addEventListener('input', updateSendState);

  // Zieladresse für Kontaktanfragen aus dem Chat.
  const CONTACT_EMAIL = 'office365@aon.at';

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text);

    // Nachricht tatsächlich zustellen: E-Mail-Programm mit vorausgefülltem Text öffnen.
    const subject = 'Nachricht über Lager-Enns-Website';
    const mailto =
      'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(text);
    window.location.href = mailto;

    input.value = '';
    updateSendState();
    input.focus();
  });

  updateSendState();
  input.focus();
})();
