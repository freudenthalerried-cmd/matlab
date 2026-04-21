(function () {
  const STORAGE_KEY = 'chat.messages';

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');

  function loadMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveMessages(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  const history = loadMessages();

  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0;
  }

  function renderMessage(text) {
    const li = document.createElement('li');
    li.textContent = text;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendMessage(text) {
    renderMessage(text);
    history.push(text);
    saveMessages(history);
  }

  history.forEach(renderMessage);

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
