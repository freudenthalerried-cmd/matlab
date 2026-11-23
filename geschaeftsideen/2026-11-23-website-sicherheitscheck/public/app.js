'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text; // nie innerHTML mit Fremddaten
    return e;
  };

  let config = { stripe: {} };
  fetch('/api/config').then((r) => r.json()).then((c) => { config = c; wirePackages(); }).catch(() => {});

  const STEPS = [
    'Verbindung und SSL-Zertifikat',
    'Weiterleitung auf HTTPS',
    'Schutz-Einstellungen des Servers',
    'Software-Versionen & Updates',
    'E-Mail-Schutz (SPF, DMARC)',
    'Datenschutz: Fonts, Tracking, Impressum',
  ];
  const ICON = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
  const LABEL = { pass: 'In Ordnung', warn: 'Verbessern', fail: 'Risiko', info: 'Hinweis' };

  const form = $('#scan-form');
  const btn = $('#scan-btn');
  const errBox = $('#scan-error');
  let lastResult = null;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const url = $('#url').value.trim();
    errBox.hidden = true;
    if (!url) return showError('Bitte geben Sie eine Website-Adresse ein.');
    if (!$('#consent').checked) return showError('Bitte bestätigen Sie, dass Sie diese Website prüfen lassen dürfen.');

    btn.disabled = true;
    btn.textContent = 'Prüfe …';
    $('#scan').hidden = false;
    $('#result').hidden = true;
    $('#progress').hidden = false;
    $('#progress-host').textContent = url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const anim = animateSteps();
    $('#scan').scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, consent: true }),
      });
      const data = await res.json().catch(() => ({ error: 'Unerwartete Antwort vom Server.' }));
      if (!res.ok) throw new Error(data.error || 'Prüfung fehlgeschlagen.');
      await anim.finish();
      render(data);
    } catch (e) {
      anim.stop();
      $('#scan').hidden = true;
      showError(e.message);
      form.scrollIntoView({ behavior: 'smooth' });
    } finally {
      btn.disabled = false;
      btn.textContent = 'Jetzt prüfen';
    }
  });

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
  }

  // Sichtbarer Fortschritt, solange der Server prüft.
  function animateSteps() {
    const list = $('#steps');
    list.replaceChildren(...STEPS.map((s) => el('li', 'step', s)));
    const items = [...list.children];
    let i = 0;
    items[0].classList.add('running');
    const timer = setInterval(() => {
      if (i < items.length - 1) {
        items[i].classList.replace('running', 'done');
        i++;
        items[i].classList.add('running');
      }
    }, 650);
    return {
      stop: () => clearInterval(timer),
      finish: () => new Promise((resolve) => {
        clearInterval(timer);
        let j = i;
        const t = setInterval(() => {
          if (j < items.length) {
            items[j].classList.remove('running');
            items[j].classList.add('done');
            j++;
          } else { clearInterval(t); setTimeout(resolve, 250); }
        }, 120);
      }),
    };
  }

  function render(d) {
    lastResult = d;
    $('#progress').hidden = true;
    $('#result').hidden = false;
    $('#result-host').textContent = d.target;
    const ring = $('#ring');
    ring.className = `ring grade-${d.grade}`;
    ring.style.setProperty('--score', d.score);
    $('#grade').textContent = d.grade;

    const s = d.summary;
    $('#result-summary').textContent = `${d.score} von 100 Punkten · ${s.fail} Risiken · ${s.warn} Verbesserungen · ${s.pass} in Ordnung`;
    $('#result-meta').textContent = `Geprüft am ${new Date(d.scannedAt).toLocaleString('de-AT')} · ${d.finalUrl}`;

    const problems = s.fail + s.warn;
    $('#cta-title').textContent = s.fail
      ? `${s.fail} ${s.fail === 1 ? 'Sicherheitsrisiko' : 'Sicherheitsrisiken'} gefunden – wir beheben das für Sie.`
      : problems ? `${problems} Punkte können verbessert werden.` : 'Sehr gut – Ihre Website ist solide aufgestellt.';
    $('#cta-text').textContent = problems
      ? 'Unser Fix-Paket schließt die gefundenen Lücken – inklusive Backup, Updates, Bericht und 30 Tage Nachkontrolle. Fixpreis nach kostenloser Rückmeldung.'
      : 'Halten Sie es so: Mit Wartung & Monitoring prüfen wir wöchentlich und spielen Updates für Sie ein.';

    const box = $('#categories');
    box.replaceChildren();
    for (const cat of d.categories) {
      const sec = el('section', 'cat');
      const head = el('div', 'cat-head');
      head.append(el('h3', null, cat.title));
      const fails = cat.results.filter((x) => x.status === 'fail').length;
      const warns = cat.results.filter((x) => x.status === 'warn').length;
      head.append(el('span', `pill ${fails ? 'fail' : warns ? 'warn' : 'pass'}`, fails ? `${fails} ${fails === 1 ? 'Risiko' : 'Risiken'}` : warns ? `${warns} verbessern` : 'In Ordnung'));
      sec.append(head);
      const order = { fail: 0, warn: 1, info: 2, pass: 3 };
      for (const x of [...cat.results].sort((a, b) => order[a.status] - order[b.status])) {
        const item = el('details', `item ${x.status}`);
        if (x.status === 'fail') item.open = true;
        const sum = el('summary');
        sum.append(el('span', `icon ${x.status}`, ICON[x.status]));
        sum.append(el('span', 'item-title', x.title));
        sum.append(el('span', `tag ${x.status}`, LABEL[x.status]));
        item.append(sum);
        const body = el('div', 'item-body');
        body.append(el('p', null, x.detail));
        if (x.fix && x.status !== 'pass') {
          const fix = el('p', 'fix');
          fix.append(el('strong', null, 'So wird’s behoben: '), document.createTextNode(x.fix));
          body.append(fix);
        }
        item.append(body);
        sec.append(item);
      }
      box.append(sec);
    }
    $('#locked-list').replaceChildren(...d.locked.map((t) => el('li', null, t)));
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#print-btn').addEventListener('click', () => window.print());
  $('#again-btn').addEventListener('click', () => {
    $('#scan').hidden = true;
    $('#url').value = '';
    $('#url').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Paket-Buttons: Stripe-Zahlungslink (falls hinterlegt) oder Kontaktformular vorbefüllen.
  function wirePackages() {
    document.querySelectorAll('[data-package]').forEach((a) => {
      const link = config.stripe && config.stripe[a.dataset.package];
      if (link && /^https:\/\//.test(link)) {
        a.href = link;
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  }
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-package]');
    if (!a || a.target === '_blank') return;
    $('#lead-package').value = a.dataset.package;
    if (lastResult) {
      $('#lead-website').value = lastResult.target;
      const msg = $('#lead-message');
      if (!msg.value) {
        const bad = lastResult.categories.flatMap((c) => c.results).filter((x) => x.status === 'fail' || x.status === 'warn');
        msg.value = `Gratis-Check: Note ${lastResult.grade} (${lastResult.score}/100).\nGefundene Punkte:\n${bad.map((x) => `- ${x.title}`).join('\n')}`;
      }
    }
  });
  wirePackages();

  const lead = $('#lead-form');
  lead.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = new FormData(lead);
    const body = Object.fromEntries(f.entries());
    body.privacy = lead.elements.privacy.checked;
    $('#lead-error').hidden = true;
    const submit = lead.querySelector('button[type=submit]');
    submit.disabled = true;
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Senden fehlgeschlagen.');
      lead.reset();
      $('#lead-ok').hidden = false;
    } catch (e) {
      $('#lead-error').textContent = e.message;
      $('#lead-error').hidden = false;
    } finally {
      submit.disabled = false;
    }
  });
})();
