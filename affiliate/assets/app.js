// Rechner: Formeln stehen in den Nischen-JSONs (nur vom Betreiber gepflegt, keine Nutzereingaben im Code).
document.querySelectorAll('.calc-form').forEach(form => {
  const cfg = JSON.parse(form.dataset.calc);
  const out = form.nextElementSibling;
  const ids = cfg.inputs.map(i => i.id);
  const fns = cfg.outputs.map(o => new Function(...ids, `return (${o.formel});`));
  const fmt = (v, d) => typeof v === 'number'
    ? (isFinite(v) ? v.toLocaleString('de-AT', {minimumFractionDigits: d ?? 0, maximumFractionDigits: d ?? 0}) : '–')
    : v;
  const run = () => {
    const vals = ids.map(id => parseFloat(form.querySelector('#' + id).value.replace(',', '.')) || 0);
    out.innerHTML = cfg.outputs.map((o, k) => {
      let v; try { v = fns[k](...vals); } catch { v = '–'; }
      return `<div>${o.label}<b>${fmt(v, o.stellen)} ${o.einheit || ''}</b></div>`;
    }).join('');
  };
  form.addEventListener('input', run);
  run();
});
