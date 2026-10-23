// ===== The page's motion and the things you can touch (bleaching 2) =====
// After landonorris.com and the implant page. The opening (once per visit)
// turns a tooth white while the hero photo loads; scrolling zooms in to the
// smiling man's mouth and plays the bleaching on his teeth (yellow, gum
// barrier, gel, lamp, white; the shade A3.5 → BL4 in the chip and on the tab),
// then zooms out to his white smile and the whole screen turns white. Then:
// two giant lines slide sideways, the stains travel past on a sideways track,
// the three ways are giant words that open (a photo follows the mouse), a
// sentence lights up and its photo grows to fill the screen, the real cases
// compare under the pointer, the shade guide answers a tap, panels open from
// rounded corners, the footer wordmark rises.
//
// html.scenes is set in the page head unless the visitor asked for reduced
// motion; without it every scene is a plain, still section and the hero
// photo stays as it is.
import { dyn, onLangChange, PRICE_FROM } from './i18n.js';
import { STEP_COUNT, SHADES, sampleBleach, stepAt, stepAnchor, stepProgress, swatchAt } from './bleach-timeline.js';

const html = document.documentElement;
const calm = html.classList.contains('is-calm');
const $ = (id) => document.getElementById(id);
const all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const smooth = (u) => { const t = clamp(u); return t * t * (3 - 2 * t); };
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const scenesOn = html.classList.contains('scenes') && 'IntersectionObserver' in window;
const setVar = (el, name, v) => { const t = v.toFixed(4); if (el.style.getPropertyValue(name) !== t) el.style.setProperty(name, t); };

// ---------- the man and his teeth ----------
// One photo, the man cut out of its backdrop, the teeth tinted yellow; over his
// mouth the layers cut from the same pixels (tools/make-face-layers.py): his own
// white teeth, the gum barrier, the gel and the lamp's light. The treatment
// progress sets them, and the photo zooms in to his mouth for the steps and out
// for the result.
const tx = $('top');
const face = $('face');
const poster = $('txPoster');
const tabCode = $('txTab');
// the opening waits until every layer can be drawn
const stageReady = Promise.all(all('img', face).map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => null)));

// zoom over the treatment: the whole face, in to the mouth, out for the white smile
const Z_MAX = 2.5;
const ZOOM_KEYS = [
  [0, 1], [stepProgress(0, 0.55), 2], [stepProgress(1, 0.4), Z_MAX], [stepProgress(3, 0.9), Z_MAX],
  [stepProgress(4, 0.4), 2.25], [stepProgress(4, 0.85), 1], [1, 1],
];
function zoomAt(t) {
  let i = 0;
  while (i < ZOOM_KEYS.length - 2 && t > ZOOM_KEYS[i + 1][0]) i++;
  const [a, za] = ZOOM_KEYS[i], [b, zb] = ZOOM_KEYS[i + 1];
  return za + (zb - za) * smooth((t - a) / (b - a));
}
// on between a→b, off between c→d (all in treatment progress)
const span = (t, a, b, c, d) => smooth((t - a) / (b - a)) * (1 - smooth((t - c) / (d - c)));
const at = stepProgress;
let tabShown = '';
function paintFace(t, lx, ly) {
  const s = sampleBleach(t);
  const z = zoomAt(t);
  setVar(face, '--z', z);
  setVar(face, '--zk', (z - 1) / (Z_MAX - 1));
  setVar(face, '--lx', lx);
  setVar(face, '--ly', ly);
  setVar(face, '--white', s.shade);
  setVar(face, '--bin', s.barrierIn);
  setVar(face, '--bout', s.barrierOut);
  setVar(face, '--gin', s.gelIn);
  setVar(face, '--gout', s.gelOut);
  const lamp = span(t, at(3, 0.05), at(3, 0.2), at(3, 0.85), at(3, 0.98));
  setVar(face, '--lamp', lamp);
  tx.classList.toggle('is-lamp', lamp > 0.05);
  // the shade tab is held up for the first and the last measurement
  setVar(face, '--tab', Math.max(span(t, at(0, 0.3), at(0, 0.6), at(1, 0.05), at(1, 0.25)), span(t, at(4, 0.2), at(4, 0.35), at(4, 0.6), at(4, 0.75))));
  if (tabShown !== s.shadeCode) {
    tabShown = s.shadeCode;
    tabCode.textContent = tabShown;
    face.style.setProperty('--tooth', swatchAt(s.shade));
  }
}

// the drawn state eases towards what the scroll and the mouse ask for, and
// frames are drawn only while it moves, so an idle page costs nothing
const want = { t: 0, lx: 0, ly: 0 }, have = { t: 0, lx: 0, ly: 0 };
let raf = 0, lastT = 0, heroNear = true;
function loop(now) {
  raf = 0;
  const dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 1 / 60; // slow devices catch up in a few frames
  lastT = now;
  const kt = 1 - Math.exp(-dt / 0.12), kl = 1 - Math.exp(-dt / 0.28);
  have.t += (want.t - have.t) * kt;
  have.lx += (want.lx - have.lx) * kl;
  have.ly += (want.ly - have.ly) * kl;
  const done = Math.abs(want.t - have.t) < 4e-4 && Math.abs(want.lx - have.lx) < 2e-3 && Math.abs(want.ly - have.ly) < 2e-3;
  if (done) Object.assign(have, want);
  if (heroNear) paintFace(have.t, have.lx, have.ly);
  if (!done) raf = requestAnimationFrame(loop); else lastT = 0;
}
function kick() { if (!raf) raf = requestAnimationFrame(loop); }
let curStep = 0;
paintFace(0, 0, 0);

// the face drifts a little against the mouse (Lando's helmet turns)
if (fine && !calm) {
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !heroNear) return;
    want.lx = clamp((e.clientX / innerWidth - 0.5) * 2, -1, 1);
    want.ly = clamp((e.clientY / innerHeight - 0.5) * 2, -1, 1);
    kick();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { want.lx = 0; want.ly = 0; kick(); });
}

// ---------- the opening, then the hero builds itself ----------
const ready = () => html.classList.add('is-ready');
const posterLoaded = new Promise((r) => { if (!poster || poster.complete) r(); else { poster.addEventListener('load', r, { once: true }); poster.addEventListener('error', r, { once: true }); } });
if (html.classList.contains('is-intro')) {
  try { sessionStorage.setItem('aixsmileBleach2Intro', '1'); } catch { /* private mode: it plays again next time */ }
  const intro = $('intro'), code = $('introCode');
  const t0 = performance.now();
  let loaded = false, shown = 0;
  // the enamel rises on its own towards 85 % (never faster than 1.2 s to
  // the top), and the rest of the way once the teeth are in; the code under
  // the tooth walks the shade guide with it
  const rise = () => {
    const el = (performance.now() - t0) / 1000;
    const k = Math.min(el / 1.2, loaded ? 1 : 0.85 * (1 - Math.exp(-el / 1.4)));
    shown += (k - shown) * 0.14;
    if (shown > 0.995) shown = 1;
    intro.style.setProperty('--k', shown.toFixed(4));
    code.textContent = SHADES[Math.min(SHADES.length - 1, Math.floor(shown * SHADES.length * 0.999))];
    if (shown < 1) { requestAnimationFrame(rise); return; }
    // white: the shine and the sparkles land, a short hold, then the field lifts
    intro.classList.add('is-white');
    setTimeout(() => {
      html.classList.add('is-lifting');
      ready();
      setTimeout(() => { html.classList.remove('is-intro', 'is-lifting'); intro.remove(); }, 1050);
    }, Math.max(650, 1900 - (performance.now() - t0)));
  };
  requestAnimationFrame(rise);
  Promise.race([Promise.all([stageReady, posterLoaded]), new Promise((r) => setTimeout(r, 4500))]).then(() => { loaded = true; });
} else {
  Promise.race([Promise.all([stageReady, posterLoaded]), new Promise((r) => setTimeout(r, 1400))]).then(() => requestAnimationFrame(ready));
}

// ---------- smooth wheel on laptops ----------
let lenis = null;
if (!calm && window.Lenis && fine) {
  lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
  const tickLenis = (t) => { lenis.raf(t); requestAnimationFrame(tickLenis); };
  requestAnimationFrame(tickLenis);
}
const glide = (y) => {
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + scrollY, behavior: calm ? 'auto' : 'smooth' });
};

// the scroll position where the treatment shows progress t (0..1)
const TX_FROM = 0.1, TX_SPAN = 0.82;
const txY = (t) => tx.offsetTop + (TX_FROM + t * TX_SPAN) * (tx.offsetHeight - innerHeight) + 2;

// in-page links glide (or jump, for reduced motion)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented) return;
  const id = a.getAttribute('href').slice(1);
  const target = id ? $(id) : null;
  if (!target) return;
  e.preventDefault();
  if (id === 'ablauf' && scenesOn) glide(txY(0.02));
  else glide(id === 'top' || id === 'main' ? 0 : target);
  if (id === 'main') { const h = $('heroH'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
});

// ---------- the floating menu / phone bar appear once the opening scene is behind ----------
new IntersectionObserver(([e]) => {
  html.classList.toggle('is-past', !e.isIntersecting && e.boundingClientRect.top < 0);
}, { rootMargin: '0px 0px -100% 0px' }).observe(tx);

// ---------- the big sentence: every word its own span, lit by its scene ----------
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
const light = (words, k) => {
  const n = words.length;
  words.forEach((w, i) => {
    const o = (0.14 + 0.86 * clamp(k * (n + 1.5) - i)).toFixed(3);
    if (w.style.opacity !== o) w.style.opacity = o;
  });
};

// ---------- arrivals: once, when a thing comes into view ----------
const arrivals = all('[data-rv]');
arrivals.forEach((el) => {
  if (!el.parentElement) return;
  const sibs = Array.from(el.parentElement.children).filter((c) => c.matches('[data-rv]'));
  const i = sibs.indexOf(el);
  if (i > 0) el.style.setProperty('--d', `${Math.min(i * 0.09, 0.45)}s`);
});
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

// numbers count up once they arrive
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

// ---------- the scroll-scene engine (from the implant page) ----------
// 'pin':     a tall section with a sticky screen: 0 at its top, 1 when it lets go
// 'through': 0 when the top enters at the bottom, 1 when the bottom leaves at the top
// 'enter':   0 when the top enters at the bottom, 1 when the top is a quarter from the top
// 'show':    0 when the top enters at the bottom, 1 when the whole thing is on screen
const scenes = [];
let queued = false;
const progress = (s) => {
  const h = innerHeight;
  const r = s.el.getBoundingClientRect();
  if (s.mode === 'pin') return clamp(-r.top / Math.max(1, r.height - h));
  if (s.mode === 'through') return clamp((h - r.top) / (h + r.height));
  if (s.mode === 'enter') return clamp((h - r.top) / (h * 0.75));
  return clamp((h - r.top) / Math.max(1, r.height));
};
const run = () => {
  queued = false;
  for (const s of scenes) {
    if (!s.on) continue;
    const p = progress(s);
    if (Math.abs(p - s.last) < 0.0002) continue;
    s.last = p;
    s.fn(p);
  }
};
const tick = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
const near = scenesOn ? new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const s = scenes.find((x) => x.el === e.target);
    if (s) s.on = e.isIntersecting;
    if (e.target === tx) heroNear = e.isIntersecting;
  });
  tick();
}, { rootMargin: '35% 0px 35% 0px' }) : null;
const scene = (el, mode, fn) => {
  if (!scenesOn || !el) return null;
  const s = { el, mode, fn, on: false, last: -1 };
  scenes.push(s);
  near.observe(el);
  return s;
};
const rerun = () => { scenes.forEach((s) => { s.last = -1; }); tick(); };
if (scenesOn) {
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', rerun);
  addEventListener('load', rerun);
}

// ---------- the opening scene: hero → treatment → white ----------
const cap = $('txCap'), num = $('txNum'), title = $('txTitle'), text = $('txText');
const chip = $('txShade'), chipCode = $('txShadeCode');
const steps = all('#txList li');
const rail = all('#txRail button');
const W_FROM = stepProgress(4, 0.12), W_TO = stepProgress(4, 0.62);
function showStep(k, force) {
  if (k === curStep && !force && title.textContent) return;
  const moved = k !== curStep;
  curStep = k;
  num.textContent = String(k + 1).padStart(2, '0');
  title.textContent = steps[k].querySelector('h3').textContent;
  text.textContent = steps[k].querySelector('p').textContent;
  rail.forEach((b, i) => (i === k ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  if (moved && !calm) { cap.classList.remove('is-swap'); void cap.offsetWidth; cap.classList.add('is-swap'); }
}
function showShade(t) {
  const s = sampleBleach(t);
  if (chipCode.textContent !== s.shadeCode) chipCode.textContent = s.shadeCode;
  chip.style.setProperty('--tooth', swatchAt(s.shade));
}
showStep(0, true);
scene(tx, 'pin', (p) => {
  const h = smooth(p / 0.075);
  const t = clamp((p - TX_FROM) / TX_SPAN);
  const w = smooth((t - W_FROM) / (W_TO - W_FROM));
  setVar(tx, '--h', h);
  setVar(tx, '--w', w);
  setVar(tx, '--t', t);
  tx.classList.toggle('is-playing', h > 0.5);
  tx.classList.toggle('is-white', w > 0.5);
  const k = stepAt(t);
  showStep(k);
  tx.classList.toggle('is-end', k === STEP_COUNT - 1 && t > stepProgress(4, 0.55));
  showShade(t);
  rail.forEach((b, i) => {
    const a = stepProgress(i, 0), z = stepProgress(i + 1, 0);
    setVar(b, '--f', clamp((t - a) / (z - a)));
  });
  want.t = t;
  kick();
});
// a step on the rail scrolls to where that step has played
rail.forEach((b, i) => b.addEventListener('click', () => glide(txY(stepAnchor(i)))));

// ---------- the result, on people: the portraits are dealt out ----------
// laptops: the stack spreads across the screen (--e); phones: the top
// portrait slides away and the next face shows, one after another (--o)
const look = $('laecheln');
if (look) {
  const cards = all('.look__card', look);
  const LEAVE = [2, 3, 1, 4]; // card indices, top of the phone stack first
  const phoneQ = matchMedia('(max-width: 760px)');
  scene(look, 'pin', (p) => {
    setVar(look, '--e', ease(clamp((p - 0.06) / 0.56)));
    setVar(look, '--p', p);
    if (phoneQ.matches) LEAVE.forEach((c, i) => setVar(cards[c], '--o', ease(clamp((p - 0.1 - i * 0.19) / 0.15))));
  });
}

// ---------- the stains travel sideways (Lando's horizontal track) ----------
// the track's progress goes to every picture as --p: each one drifts at its own
// speed and height (--dx/--dy in site.css), and slides inside its frame
const track = $('flecken');
if (track) {
  const stick = track.querySelector('.track__stick'), railEl = $('trackRail');
  let dist = 0;
  const measure = () => { dist = Math.max(0, railEl.scrollWidth - stick.clientWidth); };
  scene(track, 'pin', (p) => {
    if (!dist) measure();
    const x = dist * ease(clamp((p - 0.04) / 0.92));
    railEl.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
    setVar(track, '--p', p);
  });
  addEventListener('resize', () => { dist = 0; });
  onLangChange(() => { dist = 0; });
}

// ---------- the three ways: giant words that open; a photo follows the mouse ----------
const ways = $('wege');
if (ways) {
  const items = all('.way', ways);
  const float = $('waysFloat'), imgs = float ? all('img', float) : [];
  const open = (li, on) => { li.classList.toggle('is-open', on); li.querySelector('.way__btn').setAttribute('aria-expanded', on ? 'true' : 'false'); };
  items.forEach((li) => {
    li.querySelector('.way__btn').addEventListener('click', () => {
      const on = !li.classList.contains('is-open');
      items.forEach((x) => open(x, false));
      open(li, on);
      if (on) ways.classList.remove('is-floating');
    });
    scene(li, 'enter', (p) => setVar(li, '--e', ease(p)));
  });
  if (fine && float) {
    let fx = 0, fy = 0, tx0 = 0, ty0 = 0, rot = 0, fr = 0, frame = 0;
    const follow = () => {
      frame = 0;
      fx += (tx0 - fx) * 0.2; fy += (ty0 - fy) * 0.2; rot += (fr - rot) * 0.15; fr *= 0.86;
      float.style.setProperty('--fx', `${fx.toFixed(1)}px`);
      float.style.setProperty('--fy', `${fy.toFixed(1)}px`);
      float.style.setProperty('--fr', `${rot.toFixed(2)}deg`);
      if (Math.abs(tx0 - fx) > 0.3 || Math.abs(ty0 - fy) > 0.3 || Math.abs(rot) > 0.05) frame = requestAnimationFrame(follow);
    };
    ways.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = ways.getBoundingClientRect();
      tx0 = e.clientX - r.left + 150; ty0 = e.clientY - r.top;
      fr = clamp(e.movementX * 0.5, -9, 9);
      // only over a closed way: an open one shows its photo in the panel
      const btn = e.target.closest('.way__btn');
      const over = btn && !btn.closest('.way').classList.contains('is-open') ? btn : null;
      ways.classList.toggle('is-floating', !!over);
      if (over) {
        const k = +over.closest('.way').dataset.img;
        imgs.forEach((im, i) => im.classList.toggle('is-on', i === k));
        if (!ways.dataset.warm) { ways.dataset.warm = '1'; fx = tx0; fy = ty0; imgs.forEach((im) => { im.loading = 'eager'; }); }
      }
      if (!frame) frame = requestAnimationFrame(follow);
    });
    ways.addEventListener('pointerleave', () => ways.classList.remove('is-floating'));
  }
}

// ---------- "Heller, aber [photo] nicht künstlich weiß." ----------
// the words light up, the little photo grows until it fills the screen (the
// implant page's X-ray box), then the band's line and button come up on it
const grow = $('heller');
if (grow) {
  const textEl = grow.querySelector('.grow__text');
  let words = splitWords(textEl);
  if (scenesOn) {
    const stick = grow.querySelector('.grow__stick'), box = grow.querySelector('.grow__box');
    const fill = grow.querySelector('.grow__fill'), fimg = fill.querySelector('img');
    const band = $('growBand'), bandLinks = all('a', band);
    let banded = null;
    const showBand = (on) => {
      if (on === banded) return;
      banded = on;
      grow.classList.toggle('is-band', on);
      bandLinks.forEach((a) => { a.tabIndex = on ? 0 : -1; });
    };
    showBand(false);
    let R = null;
    const measure = () => {
      const s = stick.getBoundingClientRect(), b = box.getBoundingClientRect();
      R = { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height, W: s.width, H: s.height };
    };
    scene(grow, 'pin', (p) => {
      if (!R || !R.W) measure();
      light(words, clamp(p / 0.3));
      const e = ease(clamp((p - 0.32) / 0.42));
      const t = R.y * (1 - e), l = R.x * (1 - e), r = (R.W - R.x - R.w) * (1 - e), b = (R.H - R.y - R.h) * (1 - e);
      fill.style.clipPath = `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${(R.h * 0.18 * (1 - e)).toFixed(1)}px)`;
      const s0 = Math.max(R.w / R.W, R.h / R.H), sc = s0 + (1 - s0) * e;
      const dx = (R.x + R.w / 2 - R.W / 2) * (1 - e), dy = (R.y + R.h / 2 - R.H / 2) * (1 - e);
      fimg.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
      textEl.style.opacity = (1 - clamp((p - 0.42) / 0.2)).toFixed(3);
      showBand(p > 0.78);
    });
    addEventListener('resize', () => { R = null; });
    onLangChange(() => { words = splitWords(textEl); R = null; rerun(); });
  } else {
    onLangChange(() => { words = splitWords(textEl); });
  }
}

// pictures drift inside their frames
[document.querySelector('.doctor__fig'), $('mapTile')].forEach((el) => scene(el, 'through', (p) => setVar(el, '--p', p)));
// panels open from rounded corners as they come in
[$('kosten'), $('termin')].forEach((el) => scene(el, 'enter', (p) => setVar(el, '--e', ease(p))));

// the footer wordmark rises letter by letter
const mark = document.querySelector('.foot__mark');
if (mark && scenesOn) {
  const word = mark.textContent.trim();
  mark.textContent = '';
  const letters = [...word].map((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; mark.appendChild(s); return s; });
  scene(mark, 'show', (p) => letters.forEach((l, i) => setVar(l, '--k', ease(clamp(p * 2.1 - i * 0.07)))));
}

// ---------- the real cases: compare sliders ----------
all('.compare').forEach((box) => {
  const range = box.querySelector('.compare__range');
  let pos = 50, touched = false, sweepId = 0, drag = null;
  const set = (v) => {
    pos = clamp(v, 0, 100);
    box.style.setProperty('--pos', `${pos}%`);
    range.value = String(Math.round(pos));
    box.classList.toggle('is-left', pos < 14);
    box.classList.toggle('is-right', pos > 86);
  };
  const at = (e) => { const r = box.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
  const stop = () => { touched = true; cancelAnimationFrame(sweepId); };
  box.addEventListener('pointerdown', (e) => {
    stop();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, touch: e.pointerType !== 'mouse', moving: !(e.pointerType !== 'mouse') };
    box.classList.remove('is-follow');
    if (!drag.touch) { box.setPointerCapture(e.pointerId); set(at(e)); }
  });
  box.addEventListener('pointermove', (e) => {
    if (drag && drag.id === e.pointerId) {
      if (!drag.moving) {
        const dx = Math.abs(e.clientX - drag.x0), dy = Math.abs(e.clientY - drag.y0);
        if (dx < 6 || dx < dy) return;
        drag.moving = true;
        box.setPointerCapture(e.pointerId);
      }
      set(at(e));
    } else if (e.pointerType === 'mouse' && !e.buttons) {
      stop();
      box.classList.add('is-follow');
      set(at(e));
    }
  });
  const end = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (e.type === 'pointerup' && drag.touch && !drag.moving) { box.classList.add('is-follow'); set(at(e)); }
    drag = null;
  };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
  range.addEventListener('input', () => { stop(); set(+range.value); });
  range.style.pointerEvents = 'none';
  set(pos);
  // when it first comes into view the divider sweeps once, so people see it moves
  if (!calm) {
    const sweep = () => {
      const keys = [[0, 50], [0.34, 18], [0.72, 82], [1, 50]];
      const dur = 2600, t0 = performance.now();
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
      setTimeout(() => { if (!touched) sweep(); }, 600 + all('.compare').indexOf(box) * 450);
    }, { threshold: 0.6 });
    seen.observe(box);
  }
});

// ---------- the shade guide: tap a sample tooth ----------
const shade = $('messen');
if (shade) {
  const teeth = all('.tooth', shade);
  const code = $('shadeCode'), noteEl = $('shadeNote');
  const example = { code: code.textContent, note: noteEl.innerHTML };
  let picked = null;
  const swap = () => { if (!calm) { code.classList.remove('is-swap'); void code.offsetWidth; code.classList.add('is-swap'); } };
  const render = () => {
    teeth.forEach((b) => b.setAttribute('aria-pressed', b === picked ? 'true' : 'false'));
    shade.classList.toggle('is-picking', !!picked);
    if (picked) {
      code.textContent = picked.dataset.code;
      noteEl.removeAttribute('data-i18n');
      noteEl.textContent = dyn().shade.picked;
    } else {
      code.textContent = example.code;
      noteEl.setAttribute('data-i18n', 's2.exampleNote');
      noteEl.innerHTML = example.note;
    }
  };
  teeth.forEach((b) => b.addEventListener('click', () => { picked = picked === b ? null : b; swap(); render(); }));
  onLangChange(() => { if (picked) noteEl.textContent = dyn().shade.picked; else example.note = noteEl.innerHTML; });
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

// a language switch changes line lengths and the step captions
onLangChange(() => { showStep(curStep, true); setTimeout(rerun, 30); });
tick();
