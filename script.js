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
