/* Pixelwerkstatt motion layer for the demo pages.
   Adds: back button, cursor ring, magnetic buttons, 3D tilt + glare on cards, hero that turns toward the
   mouse with layered depth, 3D letter flip on the headline, gentle scroll tilt. Everything stays visible at rest
   and switches off for reduced motion; pointer effects only run on a mouse. */
(() => {
  'use strict';
  const only = (document.currentScript && document.currentScript.dataset.only) || '';   // "back" = button only
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $$ = s => [...document.querySelectorAll(s)];
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--fx-accent').trim() || '#ff5a1f';

  const style = document.createElement('style');
  style.textContent = `
  .fx-back{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;
    display:inline-flex;align-items:center;gap:10px;padding:12px 18px 12px 14px;border-radius:999px;background:rgba(14,18,24,.82);color:#fff;
    font:600 14px/1 "Segoe UI",system-ui,-apple-system,sans-serif;text-decoration:none;backdrop-filter:blur(12px);
    box-shadow:0 12px 30px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);transition:transform .25s,background .25s}
  .fx-back:hover{background:rgba(14,18,24,.94)}
  .fx-back:focus-visible{outline:3px solid ${accent};outline-offset:3px}
  .fx-back b{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:${accent};color:#fff;font-size:15px}
  .fx-cur{position:fixed;left:0;top:0;width:36px;height:36px;margin:-18px 0 0 -18px;border:1.5px solid ${accent};border-radius:50%;
    pointer-events:none;z-index:10000;opacity:0;transition:width .25s,height .25s,margin .25s,background .25s,opacity .3s}
  .fx-cur.on{opacity:1}
  .fx-cur.big{width:70px;height:70px;margin:-35px 0 0 -35px;background:color-mix(in srgb,${accent} 14%,transparent)}
  .fx-dot{position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:${accent};pointer-events:none;z-index:10001;opacity:0}
  .fx-dot.on{opacity:1}
  .fx-tilt{transition:transform .3s ease-out;transform-style:preserve-3d;will-change:transform}
  .fx-glare{position:relative;overflow:hidden}
  .fx-glare::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;
    background:radial-gradient(380px circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.28),transparent 60%);mix-blend-mode:soft-light}
  .fx-glare:hover::after{opacity:1}
  .fx-ch{display:inline-block;transform-origin:50% 100%;animation:fxflip .9s cubic-bezier(.2,.75,.2,1) both;animation-delay:calc(var(--i) * 26ms + 120ms)}
  @keyframes fxflip{from{opacity:0;transform:perspective(500px) rotateX(-95deg) translateY(.25em)}}
  @media (pointer:coarse){.fx-cur,.fx-dot{display:none}}
  @media (prefers-reduced-motion:reduce){.fx-ch{animation:none}.fx-tilt{transition:none}}`;
  document.head.append(style);

  // ---------- back button ----------
  const back = document.createElement('a');
  back.className = 'fx-back';
  back.href = '../index.html#arbeiten';
  back.innerHTML = '<b aria-hidden="true">←</b>Zurück zur Pixelwerkstatt';
  back.addEventListener('click', e => {
    // came from the portfolio: step back so the carousel keeps its place
    if (document.referrer && new URL(document.referrer, location.href).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); }
  });
  document.body.append(back);
  if (only === 'back') return;

  // ---------- headline: letters flip in ----------
  const h1 = document.querySelector('h1');
  if (h1 && !reduce) {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const word = document.createElement('span'); word.style.whiteSpace = 'nowrap';
          [...w].forEach(c => { const s = document.createElement('span'); s.className = 'fx-ch'; s.style.setProperty('--i', i++); s.textContent = c; word.append(s); });
          frag.append(word);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    walk(h1);
    // gradient-clipped words need the clip on each letter
    $$('h1 em, h1 i, h1 span').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') el.querySelectorAll('.fx-ch').forEach(c => { c.style.background = cs.backgroundImage; c.style.webkitBackgroundClip = 'text'; c.style.backgroundClip = 'text'; c.style.color = 'transparent'; });
    });
  }

  if (reduce) return;

  // ---------- gentle 3D tilt of cards while scrolling ----------
  const cards = $$('.card, .f, .pain, .specs div, .feat > div, .grid > .card, .tile');
  const scrollTilt = () => {
    const vh = innerHeight;
    cards.forEach(c => {
      if (c.matches(':hover')) return;
      const r = c.getBoundingClientRect(), mid = (r.top + r.height / 2) / vh - .5;   // -0.5 (top) .. 0.5 (bottom)
      if (r.bottom < -50 || r.top > vh + 50) return;
      c.style.transform = `perspective(1100px) rotateX(${(-mid * 10).toFixed(2)}deg) translateZ(0)`;
    });
  };
  cards.forEach(c => c.classList.add('fx-tilt'));
  addEventListener('scroll', () => requestAnimationFrame(scrollTilt), {passive: true});
  scrollTilt();

  if (!fine) return;

  // ---------- cursor ring ----------
  const ring = document.createElement('div'), dot = document.createElement('div');
  ring.className = 'fx-cur'; dot.className = 'fx-dot'; document.body.append(ring, dot);
  let x = -99, y = -99, rx = x, ry = y, mx = 0, my = 0;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; mx = x / innerWidth - .5; my = y / innerHeight - .5; ring.classList.add('on'); dot.classList.add('on'); }, {passive: true});
  document.addEventListener('pointerleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); });
  document.addEventListener('pointerover', e => ring.classList.toggle('big', !!e.target.closest('a,button,input,select,label')));

  // ---------- magnetic buttons ----------
  $$('a.btn, a.cta, a.tel, button, .fx-back').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  // ---------- tilt + glare on hover ----------
  cards.concat($$('.form, .offer, .visit, .cta-band, .cta > div')).forEach(el => {
    el.classList.add('fx-tilt', 'fx-glare');
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
      el.style.transform = `perspective(1000px) rotateY(${(px - .5) * 12}deg) rotateX(${(.5 - py) * 12}deg) translateZ(10px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; scrollTilt(); });
  });

  // ---------- hero turns toward the mouse, badges float on their own depth ----------
  const hero = document.querySelector('#hero3d, .stage img, .mock, .portrait, .hero .form');
  const layers = $$('.badge, .quote, .stats-float');
  if (hero) hero.style.willChange = 'transform';
  let smx = 0, smy = 0;
  (function loop() {
    rx += (x - rx) * .18; ry += (y - ry) * .18;
    ring.style.transform = `translate(${rx}px,${ry}px)`; dot.style.transform = `translate(${x}px,${y}px)`;
    smx += (mx - smx) * .06; smy += (my - smy) * .06;
    if (hero && !hero.matches(':hover')) hero.style.transform = `perspective(1200px) rotateY(${smx * 18}deg) rotateX(${-smy * 12}deg) translate3d(${smx * 14}px,${smy * 10}px,0)`;
    layers.forEach((l, i) => { const d = (i % 2 ? -1 : 1) * (24 + i * 8); l.style.transform = `translate3d(${smx * d}px,${smy * d * .6}px,0)`; });
    requestAnimationFrame(loop);
  })();
})();
