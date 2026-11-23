// Fix 2026-001: Zwei-Klick-Loesung – Google Maps laedt erst nach Klick
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-map-load]'); if (!b) return;
  var f = document.createElement('iframe');
  f.src = 'https://www.google.com/maps/' + 'embed?pb=' + b.getAttribute('data-map-load');
  f.width = 600; f.height = 300; f.style.border = 0; f.loading = 'lazy'; f.title = 'Karte';
  b.closest('.map-placeholder').replaceWith(f);
});
// Cookie-Einstellungen erneut oeffnen (ohne Inline-Handler, CSP-konform)
document.addEventListener('click', function (e) {
  if (e.target.closest('[data-klaro-show]')) { e.preventDefault(); window.klaro && klaro.show(); }
});
