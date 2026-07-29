(function () {
  // Kontakt läuft bewusst schriftlich: Das Formular öffnet eine
  // vorbefüllte E-Mail im Mailprogramm des Interessenten.
  const CONTACT_EMAIL = 'freudenthaler.ried@gmail.com';

  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const message = form.elements.message.value.trim();
    if (!name || !message) return;

    const subject = 'Anfrage über die Landingpage von ' + name;
    const body = message + '\n\nViele Grüße\n' + name;
    window.location.href =
      'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  });
})();
