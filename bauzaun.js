(function () {
  var EMAIL = 'stefan.freudenthaler@aon.at';
  var WIDTH = 3.5; // Elementbreite in m

  var len = document.getElementById('bz-len');
  var plane = document.getElementById('bz-plane');
  var dur = document.getElementById('bz-dur');
  var durWrap = document.getElementById('bz-dur-wrap');
  var out = document.getElementById('bz-out');
  var send = document.getElementById('bz-send');
  var form = document.getElementById('bz-form');
  var mail = document.getElementById('bz-mail');

  function val(name) {
    return document.querySelector('input[name="' + name + '"]:checked').value;
  }

  function mailto(subject, body) {
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function calc() {
    var meters = Math.max(0, parseFloat(String(len.value).replace(',', '.')) || 0);
    var loop = val('bz-shape') === 'loop';
    var mode = val('bz-mode');
    var n = Math.ceil(meters / WIDTH);
    var feet = n === 0 ? 0 : (loop ? n : n + 1);
    var clamps = n === 0 ? 0 : (loop ? n : n - 1);
    var struts = plane.checked ? Math.ceil(n / 2) : 0;
    var weeks = Math.max(1, parseInt(dur.value, 10) || 1);

    var rows = [
      ['Bauzaun-Elemente (3,50 × 2,00 m)', n],
      ['Bauzaunfüße', feet + struts],
      ['Schellen', clamps]
    ];
    if (plane.checked) {
      rows.push(['Planen', n]);
      rows.push(['Streben (inkl. Fuß)', struts]);
    }
    rows.push(['Zaunlänge gesamt', (n * WIDTH).toLocaleString('de-AT') + ' m']);
    if (mode === 'Miete') rows.push(['Mietdauer', weeks + (weeks === 1 ? ' Woche' : ' Wochen')]);

    out.innerHTML = '';
    rows.forEach(function (r) {
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = r[0];
      dd.textContent = r[1];
      out.appendChild(dt);
      out.appendChild(dd);
    });

    durWrap.style.display = mode === 'Miete' ? '' : 'none';

    var body = 'Guten Tag,\n\nich bitte um ein Angebot (' + mode + ') für:\n\n' +
      rows.map(function (r) { return '- ' + r[0] + ': ' + r[1]; }).join('\n') +
      '\n- Verlauf: ' + (loop ? 'geschlossene Fläche' : 'gerade / offene Linie') +
      '\n\nEinsatzort / PLZ:\nGewünschter Beginn:\nAbholung oder Lieferung:\n\nName:\nTelefon:\n\nVielen Dank!';
    send.href = mailto('Anfrage Bauzaun (' + mode + ') – ' + n + ' Elemente – bauversand.com', body);
  }

  // Produkt-Links: Anfrage mit vorausgefülltem Produkt
  document.querySelectorAll('[data-product]').forEach(function (a) {
    a.addEventListener('click', function () {
      var p = a.getAttribute('data-product');
      mail.href = mailto('Anfrage ' + p + ' – bauversand.com',
        'Guten Tag,\n\nich interessiere mich für: ' + p + '\n\nMiete oder Kauf:\nMenge:\nZeitraum:\nEinsatzort / PLZ:\n\nName:\nTelefon:\n\nVielen Dank!');
    });
  });

  if (!form) return; // Seite ohne Rechner
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  calc();
})();
