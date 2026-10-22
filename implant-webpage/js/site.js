// ===== The page's motion and the things you can touch =====
// The opening (once per visit), the hero building itself, sections arriving
// once, the floating menu, and the visitor-driven parts: the X-ray slider, the
// situation cards, the four steps, the 60-second check, the FAQ topics.
//
// Scroll scenes (2026-10-21, the owner asked for the reference sites'
// animations): a small engine gives each scene a progress 0..1 while it passes
// through the screen, and the scene turns that into movement — the hero zooms
// and darkens under the curtain, pictures drift inside their frames, a sentence
// lights up word by word and its X-ray grows to fill the screen, the four steps
// play along a drawing line, two giant lines slide sideways, a sentence splits
// apart around a gap, dark panels open from rounded corners, the footer
// wordmark rises. html.scenes is set in the page head unless the visitor asked
// for reduced motion; without it every scene is a plain, still section.
import { dyn, onLangChange, PRICE_FROM } from './i18n.js';

const html = document.documentElement;
const calm = html.classList.contains('is-calm');
const $ = (id) => document.getElementById(id);
const all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const note = (text) => dispatchEvent(new CustomEvent('aixsmile:note', { detail: text }));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- the opening, then the hero builds itself ----------
const heroImg = document.querySelector('.hero__media img');
const heroLoaded = new Promise((resolve) => {
  if (!heroImg || heroImg.complete) return resolve();
  heroImg.addEventListener('load', resolve, { once: true });
  heroImg.addEventListener('error', resolve, { once: true });
  setTimeout(resolve, 2200); // a slow picture never holds the page back for long
});
const ready = () => html.classList.add('is-ready');

if (html.classList.contains('is-intro')) {
  try { sessionStorage.setItem('aixsmileImplantIntro', '1'); } catch { /* private mode: it plays again next time */ }
  const t0 = performance.now();
  heroLoaded.then(() => {
    // the wordmark gets at least 1.25 s, then the curtain lifts as the hero builds
    setTimeout(() => {
      html.classList.add('is-lifting');
      ready();
      setTimeout(() => {
        html.classList.remove('is-intro', 'is-lifting');
        const intro = $('intro');
        if (intro) intro.remove();
      }, 950);
    }, Math.max(0, 1250 - (performance.now() - t0)));
  });
} else {
  heroLoaded.then(() => requestAnimationFrame(ready));
}

// ---------- smooth wheel on laptops ----------
let lenis = null;
if (!calm && window.Lenis && fine) {
  lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const glide = (y) => {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + scrollY, behavior: calm ? 'auto' : 'smooth' });
};

// in-page links glide (or jump, for reduced motion)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented) return;
  const id = a.getAttribute('href').slice(1);
  const target = id ? $(id) : null;
  if (!target) return;
  e.preventDefault();
  glide(id === 'top' || id === 'main' ? 0 : target);
  if (id === 'main') { const h = document.querySelector('#situation h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
});

// ---------- the floating menu / phone bar appear once the hero is covered ----------
const flow = $('flow');
if (flow) {
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none';
  flow.prepend(sentinel);
  new IntersectionObserver(([e]) => {
    html.classList.toggle('is-past', !e.isIntersecting && e.boundingClientRect.top < 90);
  }, { rootMargin: '-90px 0px 0px 0px' }).observe(sentinel);
}

// ---------- the big sentences: every word its own span, lit by its scene ----------
const splitWords = (p) => {
  all('[data-i18n]', p).forEach((span) => {
    if (span.querySelector('.w')) return;
    const parts = span.textContent.split(/(\s+)/);
    span.textContent = '';
    parts.forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w)) { span.appendChild(document.createTextNode(w)); return; }
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      span.appendChild(s);
    });
  });
  return all('.w', p);
};
// a run of words lights up one after another as k goes 0 → 1
const light = (words, k) => {
  const n = words.length;
  words.forEach((w, i) => {
    const o = (0.14 + 0.86 * clamp(k * (n + 1.5) - i)).toFixed(3);
    if (w.style.opacity !== o) w.style.opacity = o;
  });
};

// ---------- arrivals: once, when a thing comes into view ----------
const arrivals = all('[data-rv], .calm, .band');
// siblings arrive one after another
arrivals.forEach((el) => {
  if (!el.matches('[data-rv]') || !el.parentElement) return;
  const sibs = Array.from(el.parentElement.children).filter((c) => c.matches('[data-rv]'));
  const i = sibs.indexOf(el);
  if (i > 0) el.style.setProperty('--d', `${Math.min(i * 0.09, 0.45)}s`);
});
all('.calm__grid > *, .calm__list > div').forEach((el, i) => el.style.setProperty('--i', i));
if (calm || !('IntersectionObserver' in window)) {
  arrivals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  arrivals.forEach((el) => io.observe(el));
}

// numbers count up once they arrive (the 5 languages)
all('[data-count]').forEach((el) => {
  const n = +el.dataset.count;
  if (calm || !n) return;
  el.textContent = '0';
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / 1100);
      el.textContent = String(Math.round(n * ease(k)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(el);
});

// ---------- the scroll-scene engine ----------
// mode 'pin':     a tall section with a sticky screen inside: 0 at its top, 1 when it lets go
// mode 'through': 0 when the top enters at the bottom, 1 when the bottom leaves at the top
// mode 'enter':   0 when the top enters at the bottom, 1 when the top is a quarter from the top
// mode 'show':    0 when the top enters at the bottom, 1 when the whole thing is on screen
// mode 'top':     the page's first screen of scrolling (the hero)
const scenesOn = html.classList.contains('scenes') && 'IntersectionObserver' in window;
const scenes = [];
let queued = false;
const progress = (s) => {
  const h = innerHeight;
  if (s.mode === 'top') return clamp(scrollY / h);
  const r = s.el.getBoundingClientRect();
  if (s.mode === 'pin') return clamp(-r.top / Math.max(1, r.height - h));
  if (s.mode === 'through') return clamp((h - r.top) / (h + r.height));
  if (s.mode === 'enter') return clamp((h - r.top) / (h * 0.75));
  return clamp((h - r.top) / Math.max(1, r.height)); // 'show'
};
const run = () => {
  queued = false;
  for (const s of scenes) {
    if (!s.on) continue;
    const p = progress(s);
    if (Math.abs(p - s.last) < 0.0004) continue;
    s.last = p;
    s.fn(p);
  }
};
const tick = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
const near = scenesOn ? new IntersectionObserver((entries) => {
  entries.forEach((e) => { const s = scenes.find((x) => x.el === e.target); if (s) s.on = e.isIntersecting; });
  tick();
}, { rootMargin: '35% 0px 35% 0px' }) : null;
const scene = (el, mode, fn) => {
  if (!scenesOn || !el) return null;
  const s = { el, mode, fn, on: mode === 'top', last: -1 };
  scenes.push(s);
  if (mode !== 'top') near.observe(el);
  return s;
};
const rerun = () => { scenes.forEach((s) => { s.last = -1; }); tick(); };
if (scenesOn) {
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', rerun);
  addEventListener('load', rerun);
}
const setVar = (el, name, v) => { const t = v.toFixed(4); if (el.style.getPropertyValue(name) !== t) el.style.setProperty(name, t); };

// the hero zooms in a little and darkens while the page slides up over it (Slobodian)
const hero = $('top');
scene(hero, 'top', (p) => setVar(hero, '--hp', p));

// pictures drift slowly inside their frames (Slobodian's scrubbed zoom)
[document.querySelector('.sits'), document.querySelector('.doctor__fig'), $('mapTile'), $('band')].forEach((el) => {
  scene(el, 'through', (p) => setVar(el, '--p', p));
});

// two giant lines slide sideways (Minémal)
const marquee = document.querySelector('.marquee');
scene(marquee, 'through', (p) => setVar(marquee, '--p', p));

// dark panels open from rounded corners as they come in (Slobodian)
[document.querySelector('.calm'), ...all('.opens')].forEach((el) => {
  scene(el, 'enter', (p) => setVar(el, '--e', ease(p)));
});

// the footer wordmark rises letter by letter (Minémal / Slobodian)
const mark = document.querySelector('.foot__mark');
if (mark && scenesOn) {
  const text = mark.textContent.trim();
  mark.textContent = '';
  const letters = [...text].map((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; mark.appendChild(s); return s; });
  // the mark is cut off at the page's bottom edge, so its progress tops out near .8: done by .7
  scene(mark, 'show', (p) => letters.forEach((l, i) => setVar(l, '--k', ease(clamp(p * 2.1 - i * 0.07)))));
}

// "Ein Implantat ersetzt die Wurzel, [X-ray] nicht nur den Zahn." — the words
// light up, then the little X-ray grows until it fills the screen and hands
// over to the dark X-ray section (LAVA's box)
const grow = $('wurzel');
if (grow) {
  const text = grow.querySelector('.grow__text');
  let words = splitWords(text);
  if (scenesOn) {
    const stick = grow.querySelector('.grow__stick'), box = grow.querySelector('.grow__box');
    const fill = grow.querySelector('.grow__fill'), fimg = fill.querySelector('img');
    let R = null;
    const measure = () => {
      const s = stick.getBoundingClientRect(), b = box.getBoundingClientRect();
      R = { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height, W: s.width, H: s.height };
    };
    const draw = (p) => {
      if (!R || !R.W) measure();
      light(words, clamp(p / 0.38));
      const e = ease(clamp((p - 0.4) / 0.48));
      const t = R.y * (1 - e), l = R.x * (1 - e), r = (R.W - R.x - R.w) * (1 - e), b = (R.H - R.y - R.h) * (1 - e);
      fill.style.clipPath = `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${(R.h * 0.16 * (1 - e) + 28 * e * (1 - e)).toFixed(1)}px)`;
      const s0 = Math.max(R.w / R.W, R.h / R.H), sc = s0 + (1 - s0) * e;
      const dx = (R.x + R.w / 2 - R.W / 2) * (1 - e), dy = (R.y + R.h / 2 - R.H / 2) * (1 - e);
      fimg.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
      fimg.style.opacity = (1 - 0.7 * clamp((p - 0.84) / 0.16)).toFixed(3);
      text.style.opacity = (1 - clamp((p - 0.5) / 0.22)).toFixed(3);
    };
    scene(grow, 'pin', draw);
    addEventListener('resize', () => { R = null; });
    onLangChange(() => { words = splitWords(text); R = null; rerun(); });
  } else {
    onLangChange(() => { words = splitWords(text); });
  }
}

// "Eine Lücke bleibt nicht, wie sie ist." — two pictures drift in from the
// edges while the words light up (LAVA), then the sentence splits apart around
// a gap and the explanation appears in it (Minémal's MIN / ÉMAL)
const gap = $('luecke');
if (gap) {
  const text = gap.querySelector('.gap__text');
  let words = splitWords(text);
  if (scenesOn) {
    const imgL = gap.querySelector('.gap__img--l'), imgR = gap.querySelector('.gap__img--r');
    const small = gap.querySelector('.gap__small');
    const draw = (p) => {
      const lineL = gap.querySelector('.gap__l'), lineR = gap.querySelector('.gap__r');
      const a = ease(clamp(p / 0.45));
      light(words, clamp(p / 0.4));
      const b = ease(clamp((p - 0.42) / 0.36));
      // in from the edges, then a little further apart as the sentence splits
      // (on phones the pictures sit at the edge already, so they move less)
      const push = innerWidth < 760 ? 3 : 18;
      imgL.style.transform = `translate(${(-125 * (1 - a) - push * b).toFixed(1)}%, ${(14 * (1 - a) - 8 * b).toFixed(1)}%) rotate(${(-12 + 7 * a).toFixed(2)}deg)`;
      imgR.style.transform = `translate(${(125 * (1 - a) + push * b).toFixed(1)}%, ${(-14 * (1 - a) + 8 * b).toFixed(1)}%) rotate(${(12 - 7 * a).toFixed(2)}deg)`;
      const dx = b * Math.min(innerWidth * 0.06, 90);
      lineL.style.transform = `translateX(${(-dx).toFixed(1)}px) rotate(${(-2.4 * b).toFixed(2)}deg)`;
      lineR.style.transform = `translateX(${dx.toFixed(1)}px) rotate(${(2.4 * b).toFixed(2)}deg)`;
      small.style.opacity = b.toFixed(3);
      small.style.transform = `translateY(${(18 * (1 - b)).toFixed(1)}px)`;
    };
    scene(gap, 'pin', draw);
    onLangChange(() => { words = splitWords(text); rerun(); });
  } else {
    onLangChange(() => { words = splitWords(text); });
  }
}

// ---------- the X-ray slider ----------
const scope = $('scope');
if (scope) {
  const range = $('scopeRange');
  const labels = all('.scope__labels li', scope);
  let pos = 58, touched = false, sweepId = 0;
  // each name points at a spot given in % of the 1600×1000 render (site.css);
  // the picture is cropped to fill the frame, so place them in pixels
  const placeLabels = () => {
    const W = scope.clientWidth, H = scope.clientHeight, k = Math.max(W / 1600, H / 1000);
    const offX = (W - 1600 * k) / 2, offY = (H - 1000 * k) / 2;
    labels.forEach((li) => {
      const cs = getComputedStyle(li);
      const x = offX + (parseFloat(cs.getPropertyValue('--x')) / 100) * 1600 * k;
      const y = offY + (parseFloat(cs.getPropertyValue('--y')) / 100) * 1000 * k;
      li.style.left = `${x}px`;
      li.style.top = `${y}px`;
      li.at = (x / W) * 100;
    });
  };
  const set = (p) => {
    pos = clamp(p, 0, 100);
    scope.style.setProperty('--pos', `${pos}%`);
    range.value = String(Math.round(pos));
    // a part's name shows once the X-ray side has reached it
    labels.forEach((li) => li.classList.toggle('is-shown', pos < li.at - 3));
    scope.classList.toggle('is-left', pos < 18);
    scope.classList.toggle('is-right', pos > 82);
  };
  placeLabels();
  new ResizeObserver(() => { placeLabels(); set(pos); }).observe(scope);
  const stop = () => { touched = true; cancelAnimationFrame(sweepId); };
  const at = (e) => { const r = scope.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  set(pos);

  let drag = null; // { id, x0, y0, touch, moving }
  scope.addEventListener('pointerdown', (e) => {
    stop();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, touch: e.pointerType !== 'mouse', moving: false };
    scope.classList.remove('is-follow');
    if (!drag.touch) {
      // a mouse grabs straight away
      drag.moving = true;
      scope.classList.add('is-drag');
      scope.setPointerCapture(e.pointerId);
      set(at(e));
    }
  });
  scope.addEventListener('pointermove', (e) => {
    if (drag && drag.id === e.pointerId) {
      if (!drag.moving) {
        // a finger only takes the slider once it moves sideways; up and down still scrolls
        const dx = Math.abs(e.clientX - drag.x0), dy = Math.abs(e.clientY - drag.y0);
        if (dx < 6 || dx < dy) return;
        drag.moving = true;
        scope.classList.add('is-drag');
        scope.setPointerCapture(e.pointerId);
      }
      set(at(e));
    } else if (e.pointerType === 'mouse' && !e.buttons) {
      // with a mouse the divider follows the pointer, no press needed
      stop();
      scope.classList.add('is-follow');
      set(at(e));
    }
  });
  const end = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (e.type === 'pointerup' && drag.touch && !drag.moving) set(at(e)); // a tap moves the divider there
    drag = null;
    scope.classList.remove('is-drag');
  };
  scope.addEventListener('pointerup', end);
  scope.addEventListener('pointercancel', end);
  range.addEventListener('input', () => { stop(); scope.classList.add('is-follow'); set(+range.value); });

  // when it first comes into view the divider sweeps once, so people see it moves
  if (!calm) {
    const sweep = () => {
      const keys = [[0, pos], [0.34, 24], [0.72, 76], [1, 52]];
      const dur = 2800, t0 = performance.now();
      const step = (t) => {
        if (touched) return;
        const k = Math.min(1, (t - t0) / dur);
        let i = 0;
        while (i < keys.length - 2 && k > keys[i + 1][0]) i++;
        const [ka, va] = keys[i], [kb, vb] = keys[i + 1];
        set(va + (vb - va) * ease((k - ka) / (kb - ka)));
        if (k < 1) sweepId = requestAnimationFrame(step);
      };
      sweepId = requestAnimationFrame(step);
    };
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      seen.disconnect();
      setTimeout(() => { if (!touched) sweep(); }, 700);
    }, { threshold: 0.6 });
    seen.observe(scope);
  }
}

// ---------- situation cards: a tap opens one; with a mouse, pointing opens it
// and moving away closes it again unless it was clicked (Slobodian) ----------
const sits = all('.sit');
const openSit = (li, on) => { li.classList.toggle('is-open', on); li.querySelector('.sit__btn').setAttribute('aria-expanded', on ? 'true' : 'false'); };
const closeSits = (except) => sits.forEach((li) => { if (li !== except) { openSit(li, false); delete li.dataset.kept; } });
const wide = matchMedia('(min-width: 761px)');
sits.forEach((li) => {
  const btn = li.querySelector('.sit__btn');
  btn.addEventListener('click', () => {
    const keep = !li.dataset.kept;
    closeSits(li);
    if (keep) { li.dataset.kept = '1'; openSit(li, true); } else { delete li.dataset.kept; openSit(li, false); }
  });
  if (fine) {
    li.addEventListener('mouseenter', () => { if (wide.matches && !sits.some((x) => x.dataset.kept)) openSit(li, true); });
    li.addEventListener('mouseleave', () => { if (wide.matches && !li.dataset.kept) openSit(li, false); });
  }
  const link = li.querySelector('[data-note]');
  if (link) link.addEventListener('click', () => note(dyn().note.sit + li.querySelector('.sit__t').textContent.trim()));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sits.some((li) => li.classList.contains('is-open'))) closeSits(); });

// ---------- the four steps: with scenes they play while you scroll through the
// section (the line draws, the dot travels, Slobodian's timeline); a click or
// an arrow key scrolls to that step. Without scenes they are plain tabs. ----------
const steps = $('steps');
if (steps) {
  const path = $('ablauf');
  const tabs = all('.step', steps);
  const nos = tabs.map((t) => t.querySelector('.step__no'));
  const imgs = all('#stepP img');
  const panel = $('stepP');
  const track = steps.querySelector('.steps__track');
  let cur = 0;
  const ys = () => { const tr = track.getBoundingClientRect(); return nos.map((n) => { const r = n.getBoundingClientRect(); return Math.max(0, r.top + r.height / 2 - tr.top); }); };
  // the line fills down to the chosen step and the dot sits on its number
  const place = () => { const y = ys()[cur]; steps.style.setProperty('--dot', `${y}px`); steps.style.setProperty('--fill', `${y}px`); };
  const select = (i, focus) => {
    cur = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    panel.setAttribute('aria-labelledby', tabs[i].id);
    if (focus) tabs[i].focus({ preventScroll: true });
  };
  const n = tabs.length;
  const s = scene(path, 'pin', (p) => {
    const x = p * (n - 1), i0 = Math.min(n - 2, Math.floor(x)), f = x - i0;
    const i = Math.round(x);
    if (i !== cur) select(i, false);
    const y = ys(), at = y[i0] + (y[i0 + 1] - y[i0]) * clamp(f);
    steps.style.setProperty('--dot', `${at.toFixed(1)}px`);
    steps.style.setProperty('--fill', `${at.toFixed(1)}px`);
  });
  const go = (i, focus) => {
    if (!s) { select(i, focus); requestAnimationFrame(place); setTimeout(place, 600); return; }
    if (focus) tabs[i].focus({ preventScroll: true });
    const top = path.getBoundingClientRect().top + scrollY;
    glide(top + (i / (n - 1)) * (path.offsetHeight - innerHeight) + 2);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => go(i));
    t.addEventListener('keydown', (e) => {
      const next = { ArrowDown: cur + 1, ArrowRight: cur + 1, ArrowUp: cur - 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      go((next + n) % n, true);
    });
  });
  if (!s) {
    place();
    addEventListener('resize', place);
    onLangChange(() => setTimeout(place, 60));
  }
}

// ---------- the 60-second check ----------
const quiz = $('quiz');
if (quiz) {
  const qs = all('.quiz__q', quiz);
  const back = $('quizBack'), count = $('quizCount'), result = $('quizResult'), lines = $('quizLines');
  let answers = [], cur = 0;
  const show = (i, focus) => {
    cur = i;
    qs.forEach((q, k) => q.classList.toggle('is-on', k === i));
    result.hidden = true;
    back.hidden = i === 0;
    count.textContent = `${i + 1} / ${qs.length}`;
    all('.opt', qs[i]).forEach((o) => o.classList.toggle('is-picked', +o.dataset.a === answers[i]));
    if (focus) { const first = qs[i].querySelector('.opt'); if (first) first.focus({ preventScroll: true }); }
  };
  const renderResult = () => {
    const L = dyn().quiz.lines;
    lines.textContent = '';
    answers.forEach((a, k) => {
      const li = document.createElement('li');
      li.textContent = L[k][a];
      lines.appendChild(li);
    });
  };
  const finish = () => {
    cur = qs.length;
    qs.forEach((q) => q.classList.remove('is-on'));
    renderResult();
    result.hidden = false;
    back.hidden = false;
    count.textContent = `${qs.length} / ${qs.length}`;
    result.focus({ preventScroll: true });
  };
  all('.opt', quiz).forEach((o) => {
    o.addEventListener('click', () => {
      const q = +o.closest('.quiz__q').dataset.q;
      answers[q] = +o.dataset.a;
      answers.length = q + 1;
      all('.opt', qs[q]).forEach((x) => x.classList.toggle('is-picked', x === o));
      const keyboard = o.matches(':focus-visible');
      setTimeout(() => (q < qs.length - 1 ? show(q + 1, keyboard) : finish()), calm ? 0 : 340);
    });
  });
  back.addEventListener('click', () => show(Math.max(0, cur - 1), true));
  $('quizAgain').addEventListener('click', () => { answers = []; show(0, true); });
  $('quizBook').addEventListener('click', () => {
    const picked = answers.map((a, k) => qs[k].querySelector(`.opt[data-a="${a}"] span`).textContent.trim());
    note(dyn().note.quiz + picked.join(' · '));
  });
  onLangChange(() => { if (!result.hidden) renderResult(); });
}

// ---------- FAQ by topic ----------
const topics = $('faqTopics'), faqList = $('faqList');
if (topics && faqList) {
  const btns = all('button', topics);
  const groups = all('.faq__group', faqList);
  const sel = (i, focus) => {
    btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
    groups.forEach((g) => g.classList.toggle('is-on', g.dataset.topic === btns[i].dataset.topic));
    if (focus) btns[i].focus();
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => sel(i));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      sel((i + d + btns.length) % btns.length, true);
    });
  });
  topics.hidden = false;
  faqList.classList.add('is-tabbed');
  sel(0);
}

// ---------- a price-from line, once the practice supplies one ----------
const priceFrom = $('priceFrom');
if (priceFrom && PRICE_FROM) {
  const show = () => { priceFrom.textContent = dyn().cost.priceFrom(PRICE_FROM); priceFrom.hidden = false; };
  show();
  onLangChange(show);
}

const year = $('footYear');
if (year) year.textContent = String(new Date().getFullYear());

// a language switch changes line lengths: let every scene measure again
onLangChange(() => setTimeout(rerun, 30));
tick();
