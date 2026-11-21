// veneers-aachen.de — motion (2026-11-20, after verostudio.com).
// The intro (headline darkens word by word while loading, then a window
// opens on a smile and grows to the full hero), word-split headlines, one-time
// arrivals, smooth wheel scrolling on desktop and the scroll scenes. Scenes
// only write progress values (--p, --q1, --fan …) and state classes;
// css/site.css owns every look (scene layouts sit under html.scenes, so
// reduced motion and no-JS get plain stacked sections). No frame sequences:
// everything moves by transforms and clips, so it stays smooth on phones.
// Runs after the page's module script, so the dictionary is already applied.
(() => {
  'use strict';
  const d = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    quint: (t) => 1 - Math.pow(1 - t, 5),
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    io4: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  };
  const vh = () => window.innerHeight;
  const set = (el, k, v) => el.style.setProperty(k, typeof v === 'number' ? v.toFixed(4) : v);

  // ---------- word splitting ----------
  function split(el, cls) {
    let i = 0;
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) continue;
          const frag = document.createDocumentFragment();
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
            const w = document.createElement('span');
            if (cls) { w.className = cls; w.textContent = part; }
            else { w.className = 'w'; const s = document.createElement('span'); s.textContent = part; w.appendChild(s); }
            w.style.setProperty('--i', i++);
            frag.appendChild(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('w') && !child.classList.contains('iw') && !child.classList.contains('hw') && child.tagName !== 'BR') walk(child);
      }
    };
    walk(el);
    return i;
  }
  const splitAll = () => $$('[data-split], [data-split-scene]').forEach((el) => { if (!el.querySelector('.w')) split(el); });

  // buttons: the label rolls up on hover (wrapped again after each language switch)
  function wrapButtons() {
    $$('.btn, .topBtn--book').forEach((b) => {
      if (b.querySelector(':scope > .roll')) return;
      const s = document.createElement('span'); s.className = 'roll';
      while (b.firstChild) s.appendChild(b.firstChild);
      b.appendChild(s);
    });
  }

  // ---------- arrivals ----------
  let arrivals = null;
  function startArrivals() {
    const els = $$('[data-split], [data-reveal], [data-mask], .gauge, .steps li');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    arrivals = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); arrivals.unobserve(en.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    els.forEach((el) => arrivals.observe(el));
  }

  // ---------- smooth wheel scrolling (mouse and trackpad; touch stays native) ----------
  function smoothWheel() {
    if (reduce || !matchMedia('(pointer: fine)').matches) return;
    let target = 0, cur = 0, raf = 0, last = 0, t0 = 0;
    const max = () => d.scrollHeight - innerHeight;
    const blocked = (e) => {
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return true;
      if (d.classList.contains('menu-open') || d.classList.contains('intro-on') || document.body.classList.contains('lb-open') || document.querySelector('dialog[open]')) return true;
      for (let n = e.target; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
        if (n.scrollHeight > n.clientHeight + 1) { const oy = getComputedStyle(n).overflowY; if (oy === 'auto' || oy === 'scroll') return true; }
      }
      return false;
    };
    const step = (now) => {
      const dt = Math.min(0.05, (now - t0) / 1000 || 0.016); t0 = now;
      cur += (target - cur) * (1 - Math.exp(-dt * 9));
      if (Math.abs(target - cur) < 0.4) cur = target;
      last = cur; window.scrollTo(0, cur);
      raf = cur === target ? 0 : requestAnimationFrame(step);
    };
    addEventListener('wheel', (e) => {
      if (blocked(e)) return;
      e.preventDefault();
      if (!raf) { cur = target = scrollY; t0 = performance.now(); }
      const k = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1;
      target = clamp(target + e.deltaY * k, 0, max());
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: false });
    // keyboard, scrollbar or a jump link takes over: stop gliding
    addEventListener('scroll', () => { if (raf && Math.abs(scrollY - last) > 3) { cancelAnimationFrame(raf); raf = 0; } }, { passive: true });
  }

  // ---------- scenes ----------
  const scenes = [];
  function scene(el, mode, fn) { if (el) scenes.push({ el, mode, fn, on: true }); }
  function progress(s, r) {
    const h = vh();
    if (s.mode === 'sticky') return clamp(-r.top / Math.max(1, r.height - h));
    if (s.mode === 'pass') return clamp((h - r.top) / (h + r.height));
    return clamp(-r.top / h); // 'top'
  }
  let ticking = false;
  // the logo turns light while it sits over a dark scene (the scan, the 3D)
  const topBar = $('.top'), darkProc = $('.procedure'), darkCraft = $('.craft');
  function headerTone() {
    if (!topBar) return;
    let dark = false;
    if (darkProc) { const r = darkProc.getBoundingClientRect(); dark = r.top <= 36 && r.bottom >= 36; }
    if (!dark && darkCraft && darkCraft.dataset.active === '1') { const r = darkCraft.getBoundingClientRect(); dark = r.top <= 0 && r.bottom >= innerHeight; }
    topBar.classList.toggle('is-dark', dark);
  }
  function tick() { ticking = false; for (const s of scenes) if (s.on) { const r = s.el.getBoundingClientRect(); s.fn(progress(s, r), r); } headerTone(); }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }

  function setupScenes() {
    // hero: the full-bleed picture squeezes into a framed card as you leave
    const hero = $('.hero');
    scene(hero, 'top', (p) => hero.style.setProperty('--p', ease.out(p).toFixed(4)));

    // the statement: a pile of smiles fans out, then the top one opens to the whole screen
    const dk = $('.deck');
    if (dk) {
      const t1 = $('.deck__t1', dk), t2 = $('.deck__t2', dk), line = $('.deck__line', dk), img = $('.deck__hero img', dk), card = $('.deck__card', dk);
      // the window starts as the top card of the pile, framed on her face
      const frame = () => {
        if (!img.naturalWidth || !card) return;
        const W = innerWidth, H = innerHeight;
        const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
        const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight), dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
        const [fx, fy] = (img.dataset.focus || '0.5 0.4').split(' ').map(Number);
        const sx = (W - dw) * px + fx * dw, sy = (H - dh) * py + fy * dh;
        set(img, '--ox', `${sx.toFixed(1)}px`); set(img, '--oy', `${sy.toFixed(1)}px`);
        set(img, '--dx', `${(W / 2 - sx).toFixed(1)}px`); set(img, '--dy', `${(H / 2 - sy).toFixed(1)}px`);
        set(img, '--z', card.offsetHeight / ((Number(img.dataset.span) || 0.8) * dh));
      };
      if (img.complete) frame();
      img.addEventListener('load', frame); addEventListener('resize', frame);
      scene(dk, 'sticky', (p, r) => {
        const enter = clamp((vh() - r.top) / vh());
        const grow = ease.io4(clamp((p - 0.42) / 0.38));
        set(dk, '--fan', ease.io(clamp(p / 0.28)));
        set(dk, '--out', ease.io(clamp((p - 0.42) / 0.26)));
        set(dk, '--grow', grow);
        t1.classList.toggle('is-in', enter > 0.45); t2.classList.toggle('is-in', enter > 0.45);
        line.classList.toggle('is-in', grow > 0.9);
      });
    }

    // smile → scan → ceramic: a small picture grows to full screen, a wipe to the
    // scan (the light line turns the point cloud into the surface), a wipe to the ceramic
    const cr = $('.craft');
    if (cr) {
      let active = -1, lastPct = -1;
      const pct = $('.scanView__pct b', cr);
      scene(cr, 'sticky', (p) => {
        const q1 = ease.io4(clamp(p / 0.24));
        const q2 = ease.io(clamp((p - 0.3) / 0.16));
        const sw = clamp((p - 0.48) / 0.22);
        const q3 = ease.io(clamp((p - 0.76) / 0.16));
        set(cr, '--q1', q1); set(cr, '--q2', q2); set(cr, '--s', ease.io(sw)); set(cr, '--q3', q3);
        cr.classList.toggle('is-caption', q1 > 0.96);
        const n = Math.round(sw * 100);
        if (pct && n !== lastPct) { lastPct = n; pct.textContent = String(n); }
        const a = q3 > 0.5 ? 2 : q2 > 0.5 ? 1 : 0;
        if (a !== active) { active = a; cr.dataset.active = String(a); }
      });
    }

    // the dark 3D section opens out of a card as it comes up
    const pr = $('.procedure');
    scene(pr, 'pass', (p, r) => {
      const e = ease.out(clamp((vh() - r.top) / (vh() * 0.9)));
      set(pr, '--e', e); pr.classList.toggle('is-full', e > 0.999);
    });

    // what a veneer is: the two pictures drift at their own speeds
    const col = $('.collage');
    scene(col, 'pass', (p) => set(col, '--py', p));

    // materials: each card slides over the last one, which sinks back
    const stack = $('.stack'), cards = $$('.stackCard');
    if (stack && cards.length > 1) scene(stack, 'pass', () => {
      for (let i = 0; i < cards.length - 1; i++) {
        const a = cards[i].getBoundingClientRect(), b = cards[i + 1].getBoundingClientRect();
        set(cards[i], '--cov', clamp(1 - (b.top - a.top) / Math.max(1, a.height)));
      }
    });

    // what veneers are for: a picture follows the pointer (desktop) or the row
    // in the middle of the screen lights up (touch)
    const list = $('.concernList');
    if (list) {
      const rows = $$('.concern', list);
      if (matchMedia('(hover: hover) and (min-width: 901px)').matches) {
        const fl = document.createElement('div'); fl.className = 'concernFloat'; fl.setAttribute('aria-hidden', 'true');
        const pics = rows.map((row) => { const im = document.createElement('img'); im.src = row.querySelector('img').getAttribute('src'); im.alt = ''; im.decoding = 'async'; fl.appendChild(im); return im; });
        list.appendChild(fl);
        let tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false, act = -1;
        const loop = () => {
          const nx = x + (tx - x) * 0.16, ny = y + (ty - y) * 0.16, vx = nx - x;
          x = nx; y = ny;
          set(fl, '--fx', `${x.toFixed(1)}px`); set(fl, '--fy', `${y.toFixed(1)}px`); set(fl, '--fr', `${clamp(vx * 0.5, -10, 10).toFixed(2)}deg`);
          raf = on || Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
        };
        list.addEventListener('pointermove', (e) => {
          const r = list.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
          if (!on) { x = tx; y = ty; }
          if (!raf) raf = requestAnimationFrame(loop);
        });
        rows.forEach((row, i) => row.addEventListener('pointerenter', () => {
          on = true; fl.classList.add('is-on'); list.classList.add('is-hovering');
          if (i === act) return;
          act = i;
          pics.forEach((im, k) => im.classList.toggle('is-on', k === i));
          rows.forEach((rw, k) => rw.classList.toggle('is-hover', k === i));
        }));
        list.addEventListener('pointerleave', () => {
          on = false; act = -1; fl.classList.remove('is-on'); list.classList.remove('is-hovering');
          pics.forEach((im) => im.classList.remove('is-on')); rows.forEach((rw) => rw.classList.remove('is-hover'));
        });
      } else {
        scene(list, 'pass', () => {
          let best = -1, bd = Infinity;
          rows.forEach((row, i) => { const b = row.getBoundingClientRect(); const dd = Math.abs(b.top + b.height / 2 - vh() * 0.5); if (dd < bd) { bd = dd; best = i; } });
          rows.forEach((row, i) => row.classList.toggle('is-active', i === best));
        });
      }
    }

    // real cases: the row slides sideways while you scroll down; each case
    // turns from before to after as it crosses the screen
    const cs = $('.cases');
    if (cs) {
      const track = $('.cases__track', cs), figs = $$('.caseFig', cs), bar = $('.cases__progress i', cs);
      let dist = 0;
      const measure = () => { dist = Math.max(0, track.scrollWidth - track.clientWidth); set(cs, '--dist', `${dist}px`); request(); };
      measure();
      addEventListener('resize', measure); addEventListener('aixsmile:lang', measure);
      if (document.fonts) document.fonts.ready.then(measure);
      scene(cs, 'sticky', (p) => {
        set(track, '--tx', (p * dist).toFixed(1));
        if (bar) set(bar, '--p', p);
        const W = innerWidth;
        figs.forEach((f) => { const b = f.getBoundingClientRect(); set(f, '--w', ease.io(clamp((W * 0.82 - (b.left + b.width / 2)) / (W * 0.5)))); });
      });
    }

    // the treatment: a line fills along the steps, the big number rolls with them
    const ab = $('.ablauf'), steps = $('#stepsRail');
    if (ab && steps) {
      const lis = $$('li', steps);
      let last = -2;
      scene(ab, 'pass', () => {
        const mark = vh() * 0.6, r = steps.getBoundingClientRect();
        set(steps, '--fill', clamp((mark - r.top) / r.height));
        let k = -1;
        lis.forEach((li, i) => { const on = li.getBoundingClientRect().top < mark; li.classList.toggle('is-on', on); if (on) k = i; });
        if (k !== last) { last = k; ab.style.setProperty('--step', String(Math.max(0, k))); }
      });
    }

    // the quote: the words light up while you read it; the tooth turns gently
    const qt = $('.quote');
    if (qt) scene(qt, 'pass', () => {
      const r = $('.quote__src', qt).getBoundingClientRect();
      set(qt, '--qp', clamp((vh() * 0.9 - r.top) / (vh() * 0.6)));
    });

    // the invitation opens from a framed picture to the full width
    const cta = $('.ctaBand');
    scene(cta, 'pass', (p, r) => {
      const e = ease.out(clamp((vh() - r.top) / (vh() * 0.8)));
      set(cta, '--e', e); cta.classList.toggle('is-full', e > 0.999);
    });

    // the footer wordmark rises letter by letter
    const foot = $('.foot'), fmark = $('.foot__mark');
    if (foot && fmark) scene(foot, 'pass', () => {
      const r = fmark.getBoundingClientRect();
      set(foot, '--fp', clamp((vh() - r.top) / Math.max(1, r.height)));
    });

    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { const s = scenes.find((x) => x.el === e.target); if (s) { s.on = e.isIntersecting; if (s.on) request(); } }), { rootMargin: '25% 0px 25% 0px' });
      scenes.forEach((s) => io.observe(s.el));
    }
    tick();
  }

  // ---------- the quote: one span per word, lit by the scroll ----------
  function splitQuote() {
    const p = $('.quote__src p'); if (!p || p.querySelector('.hw')) return;
    p.style.setProperty('--n', split(p, 'hw'));
  }
  // ---------- the footer wordmark: one span per letter ----------
  function splitMark() {
    const m = $('.foot__mark'); if (!m || m.querySelector('.fl')) return;
    let i = 0;
    const walk = (node) => {
      for (const c of [...node.childNodes]) {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of c.textContent) {
            if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); continue; }
            const sp = document.createElement('span'); sp.className = 'fl'; sp.textContent = ch; sp.style.setProperty('--i', i++);
            frag.appendChild(sp);
          }
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      }
    };
    walk(m);
  }

  // ---------- menu ----------
  function setupMenu() {
    const btn = $('#menuBtn'), menu = $('#menu'); if (!btn || !menu) return;
    const set = (open) => {
      d.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    };
    set(false);
    btn.addEventListener('click', () => set(!d.classList.contains('menu-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('menu-open')) { set(false); btn.focus(); } });
  }

  // ---------- intro ----------
  function tween(ms, fn, easing) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => { const t = clamp((now - t0) / ms); fn(easing ? easing(t) : t); if (t < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function runIntro() {
    const intro = $('#opening');
    if (!d.classList.contains('intro-on') || !intro || reduce) { finishIntro(intro); return; }
    d.classList.add('intro-run');
    const veil = $('.opening__veil', intro), bar = $('.opening__bar', intro), pct = $('.opening__pct', intro);
    $$('.opening__line', intro).forEach((l) => split(l, 'iw'));
    const words = $$('.iw', intro);
    const img = $('.hero__media img');
    const W = innerWidth, H = innerHeight;
    const hx = clamp(W * 0.078, 58, 132), hy = Math.min(hx * (H / W), H * 0.16);
    intro.style.setProperty('--gap', `${hy + Math.max(14, H * 0.025)}px`);

    // loading: the line fills and the words darken; never shorter than 1.5 s
    let ready = false;
    const imgReady = img ? (img.decode ? img.decode() : Promise.resolve()).catch(() => {}) : Promise.resolve();
    Promise.all([imgReady, document.fonts ? document.fonts.ready : null]).then(() => { ready = true; });
    setTimeout(() => { ready = true; }, 4200);
    const t0 = performance.now();
    let shown = 0;
    await new Promise((res) => {
      const step = (now) => {
        const el = now - t0;
        const target = ready ? 1 : Math.min(0.9, el / 2400);
        const floor = Math.min(1, el / 1500);
        shown = Math.max(shown, Math.min(target, floor));
        bar.style.setProperty('--prog', shown.toFixed(4));
        pct.textContent = Math.round(shown * 100) + '%';
        words.forEach((w, k) => w.classList.toggle('on', shown >= (k + 0.6) / words.length));
        if (shown >= 1) res(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    await wait(260);

    // the window: centred on the smile, then it grows to the whole screen
    let tf = null;
    if (img && img.naturalWidth) {
      const rect = img.getBoundingClientRect();
      const focus = /-sq\./.test(img.currentSrc || '') ? img.dataset.focusSq : img.dataset.focus;
      const [fx, fy] = (focus || '0.5 0.45').split(' ').map(Number);
      const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
      const s = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight) || 1;
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      const sx = rect.left + (rect.width - dw) * px + fx * dw, sy = rect.top + (rect.height - dh) * py + fy * dh;
      tf = { dx: W / 2 - sx, dy: H / 2 - sy, z: 2.5 };
      img.style.transformOrigin = `${sx - rect.left}px ${sy - rect.top}px`;
      img.style.transform = `translate3d(${tf.dx}px, ${tf.dy}px, 0) scale(${tf.z})`;
    }
    bar.style.transition = 'opacity .5s ease'; bar.style.opacity = '0';
    await tween(760, (t) => { veil.style.setProperty('--hx', `${hx * t}px`); veil.style.setProperty('--hy', `${hy * t}px`); }, ease.quint);
    await wait(520);
    await tween(1250, (t) => {
      veil.style.setProperty('--hx', `${hx + (W / 2 + 4 - hx) * t}px`);
      veil.style.setProperty('--hy', `${hy + (H / 2 + 4 - hy) * t}px`);
      if (tf) img.style.transform = `translate3d(${tf.dx * (1 - t)}px, ${tf.dy * (1 - t)}px, 0) scale(${1 + (tf.z - 1) * (1 - t)})`;
    }, ease.io4);
    if (img) { img.style.transform = ''; img.style.transformOrigin = ''; }
    finishIntro(intro);
  }
  function finishIntro(intro) {
    if (intro) intro.remove();
    d.classList.remove('intro-on', 'intro-run');
    d.classList.add('is-revealed');
    try { sessionStorage.setItem('vIntro', '1'); } catch (e) { /* private mode */ }
    window.dispatchEvent(new CustomEvent('aixsmile:revealed'));
    // the first screen arrives at once, wherever it sits on the screen
    $$('.hero [data-reveal], .hero [data-split]').forEach((el) => el.classList.add('is-in'));
    startArrivals();
  }

  // ---------- language switch (the module script rewrites the copy) ----------
  window.addEventListener('aixsmile:lang', () => {
    $$('[data-split], [data-split-scene]').forEach((el) => { if (!el.querySelector('.w')) split(el); });
    wrapButtons();
    splitQuote();
    request();
  });

  // ---------- go ----------
  d.classList.add('motion');
  if (reduce) d.classList.add('m-calm');
  splitAll();
  wrapButtons();
  splitQuote();
  splitMark();
  setupMenu();
  if (!reduce) { d.classList.add('scenes'); setupScenes(); smoothWheel(); }
  runIntro();
})();
