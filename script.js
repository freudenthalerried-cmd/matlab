(function () {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const messages = document.getElementById('messages');
  const themeToggle = document.getElementById('theme-toggle');

  const MOON = '\u{1F319}';
  const SUN = '\u{2600}\u{FE0F}';

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) {
      const isDark = theme === 'dark';
      themeToggle.textContent = isDark ? SUN : MOON;
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Hellmodus umschalten' : 'Dunkelmodus umschalten'
      );
    }
  }

  function initTheme() {
    let stored = null;
    try {
      stored = localStorage.getItem('theme');
    } catch (e) { /* localStorage nicht verfügbar */ }

    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

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

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) { /* localStorage nicht verfügbar */ }
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text);
    input.value = '';
    updateSendState();
    input.focus();
  });

  initTheme();
  updateSendState();
  input.focus();
})();
