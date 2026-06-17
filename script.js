(function () {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');

  function updateSendState() {
    sendButton.disabled = input.value.trim().length === 0;
  }

  function appendMessage(text, sender) {
    const li = document.createElement('li');
    li.className = sender === 'bot' ? 'message message--bot' : 'message message--user';
    li.textContent = text;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
    return li;
  }

  function botReply(userText) {
    const typing = appendMessage('…', 'bot');
    typing.classList.add('message--typing');

    const reply = 'Du hast geschrieben: ' + userText;
    setTimeout(function () {
      typing.classList.remove('message--typing');
      typing.textContent = reply;
      messages.scrollTop = messages.scrollHeight;
    }, 600);
  }

  input.addEventListener('input', updateSendState);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    input.value = '';
    updateSendState();
    input.focus();
    botReply(text);
  });

  updateSendState();
  input.focus();
})();
