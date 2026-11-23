(function () {
  var EMAIL = 'stefan.freudenthaler@aon.at';
  var WIDTH = 3.5; // Elementbreite in m
  // Mietpreise netto je Stück und Woche – laut lager-enns.at/bauzaun-mieten.html
  var PREIS = { element: 10, fuss: 0.9, schelle: 0.9, ust: 0.2 };
  var DAY = 86400000;

  var mail = document.getElementById('bz-mail');
  var form = document.getElementById('bz-form');

  function mailto(subject, body) {
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }
  function eur(v) {
    return v.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function fmtDate(v) { return v ? v.split('-').reverse().join('.') : ''; }

  // Produkt-Links: Anfrage mit vorausgefülltem Produkt
  document.querySelectorAll('[data-product]').forEach(function (a) {
    a.addEventListener('click', function () {
      var p = a.getAttribute('data-product');
      mail.href = mailto('Anfrage ' + p + ' – bauversand.com',
        'Guten Tag,\n\nich interessiere mich für: ' + p + '\n\nMiete oder Kauf:\nMenge:\nZeitraum:\nEinsatzort / PLZ:\n\nName:\nTelefon:\n\nVielen Dank!');
    });
  });

  if (!form) return; // Seite ohne Rechner

  var len = document.getElementById('bz-len');
  var plane = document.getElementById('bz-plane');
  var delivery = document.getElementById('bz-delivery');
  var from = document.getElementById('bz-from');
  var to = document.getElementById('bz-to');
  var durWrap = document.getElementById('bz-dur-wrap');
  var out = document.getElementById('bz-out');
  var send = document.getElementById('bz-send');

  var today = new Date(); today.setHours(12, 0, 0, 0);
  from.value = iso(today);
  to.value = iso(new Date(today.getTime() + 27 * DAY));

  function val(name) {
    return form.querySelector('input[name="' + name + '"]:checked').value;
  }

  function weeks() {
    var a = new Date(from.value + 'T12:00:00'), b = new Date(to.value + 'T12:00:00');
    if (isNaN(a) || isNaN(b) || b < a) return 1;
    return Math.max(1, Math.ceil((Math.round((b - a) / DAY) + 1) / 7));
  }

  function row(dl, label, value, cls) {
    var dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value;
    if (cls) { dt.className = cls; dd.className = cls; }
    dl.appendChild(dt); dl.appendChild(dd);
  }

  function calc() {
    var meters = Math.max(0, parseFloat(String(len.value).replace(',', '.')) || 0);
    var loop = val('bz-shape') === 'loop';
    var miete = val('bz-mode') === 'Miete';
    var n = Math.ceil(meters / WIDTH);
    var feet = n === 0 ? 0 : (loop ? n : n + 1);
    var clamps = n === 0 ? 0 : (loop ? n : n - 1);
    var struts = plane.checked ? Math.ceil(n / 2) : 0;
    var w = weeks();
    var lines = [];

    out.innerHTML = '';
    var sum = 0;
    function item(qty, name, price) {
      var line = qty + ' × ' + name;
      if (miete && price != null) {
        var v = qty * price * w;
        sum += v;
        row(out, line, eur(v));
        lines.push('- ' + line + ' à ' + eur(price) + ' × ' + w + ' Wo. = ' + eur(v));
      } else {
        row(out, line, 'auf Anfrage');
        lines.push('- ' + line + ' (Preis auf Anfrage)');
      }
    }
    item(n, 'Zaunelement', PREIS.element);
    item(feet, 'Betonfuß', PREIS.fuss);
    item(clamps, 'Schelle', PREIS.schelle);
    if (plane.checked) {
      item(n, 'Plane', null);
      item(struts, 'Strebe (inkl. Fuß)', null);
    }
    if (delivery.checked) {
      row(out, 'Lieferung, Auf- & Abbau', 'Fixpreis im Angebot');
      lines.push('- Lieferung mit Auf- und Abbau gewünscht');
    }

    var info = (n * WIDTH).toLocaleString('de-AT') + ' m Zaun';
    if (miete) info += ' · ' + w + (w === 1 ? ' Woche' : ' Wochen') + ' (' + fmtDate(from.value) + ' – ' + fmtDate(to.value) + ')';
    row(out, info, '', 'bz-info');
    if (miete) {
      row(out, 'Summe netto', eur(sum), 'bz-total');
      row(out, 'zzgl. 20 % USt.', eur(sum * PREIS.ust));
      row(out, 'Gesamt brutto', eur(sum * (1 + PREIS.ust)), 'bz-total bz-big');
    } else {
      row(out, 'Kaufpreis', 'Angebot auf Anfrage', 'bz-total');
    }

    durWrap.style.display = miete ? '' : 'none';

    var body = 'Guten Tag,\n\nich bitte um ein Angebot (' + (miete ? 'Miete' : 'Kauf') + ') für:\n\n' +
      lines.join('\n') +
      '\n- Verlauf: ' + (loop ? 'geschlossene Fläche' : 'gerade / offene Linie') +
      '\n- ' + info +
      (miete ? '\n\nPreisrechner: ' + eur(sum) + ' netto / ' + eur(sum * (1 + PREIS.ust)) + ' brutto' : '') +
      '\n\nEinsatzort / PLZ:\n\nName:\nTelefon:\n\nVielen Dank!';
    send.href = mailto('Anfrage Bauzaun (' + (miete ? 'Miete' : 'Kauf') + ') – ' + n + ' Elemente – bauversand.com', body);
  }

  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  calc();
})();
