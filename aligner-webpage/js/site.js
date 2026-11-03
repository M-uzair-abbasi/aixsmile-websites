// ===== The page's motion and the things you can touch (aligners) =====
// After igloo.inc. The opening (once per visit) straightens a row of teeth
// while her photo loads; the journey is one pinned screen, all on one photo,
// with the 3D version's steps in the order a treatment goes: a woman smiles
// with crooked teeth; scrolling moves the view in to her mouth, a scan line
// leaves her teeth as points and a wireframe, the bite opens and the upper
// aligner comes in, waits and is pushed onto her crooked teeth, then the lower
// one, the bite closes; under the aligners every tooth moves into place (tray
// 01 → 24, the labels count down to straight), and white fog clears onto her
// smile, her aligner in her hand. Then: the check
// (three questions into the booking note), the day as a ring, a real case to
// compare, panels that open from rounded corners, the footer wordmark.
//
// html.scenes is set in the page head unless the visitor asked for reduced
// motion; without it the journey is her photo and the chapters are a list.
import { dyn, onLangChange, PRICE_FROM } from './i18n.js';
import { CHAPTERS, sample, chapterAnchor } from './clear-timeline.js';

const html = document.documentElement;
const calm = html.classList.contains('is-calm');
const $ = (id) => document.getElementById(id);
const all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const phoneQ = matchMedia('(max-width: 760px)');
const scenesOn = html.classList.contains('scenes') && 'IntersectionObserver' in window;
const setVar = (el, name, v) => { const t = v.toFixed(4); if (el.style.getPropertyValue(name) !== t) el.style.setProperty(name, t); };
const note = (text) => dispatchEvent(new CustomEvent('aixsmile:note', { detail: text }));
const SVGNS = 'http://www.w3.org/2000/svg';

const klar = $('top');
const stick = klar.querySelector('.klar__stick');
const face = $('face');
const photo = $('facePhoto');
const trayFilm = [$('trayA'), $('trayB')];
const wearFilm = [$('wearA'), $('wearB')];
const al = { u: $('alU'), l: $('alL') };
const faceEnd = $('faceEnd');

// ---------- her photo ----------
// The numbers tools/make-face-layers.py prints: the photo's size, the boxes
// the mouth and jaw layers cover (fractions of the photo), the frames in each
// strip, how far an aligner waits off its teeth (a fraction of the jaw box),
// and where the labelled teeth and the two aligners are (fractions, y from
// the top).
const FACE = {
  w: 1536, h: 2048,
  mouth: [0.3008, 0.4971, 0.3438, 0.1006],
  jaw: [0.2682, 0.4541, 0.4531, 0.2783],
  tray: 9, wear: 7, gap: 0.048,
  tags: { 12: [0.4199, 0.5332], 22: [0.5417, 0.5347], 23: [0.5729, 0.5298], 41: [0.4408, 0.5723], u: [0.4948, 0.5371], l: [0.4948, 0.5815] },
};
// the photo and the frame strips, all decoded before the hero builds
const decoded = (src) => new Promise((r) => {
  const im = new Image();
  im.onload = im.onerror = () => r();
  im.src = src;
});
const faceReady = Promise.all([
  photo.complete ? Promise.resolve() : new Promise((r) => { photo.addEventListener('load', r, { once: true }); photo.addEventListener('error', r, { once: true }); }),
  ...(scenesOn ? ['tray', 'tray-u', 'tray-l', 'wear'].map((n) => decoded(`assets/photos/face/${n}.webp`)) : []),
]);
let loadK = 0;                  // 0..1 while she loads (the opening shows it)
faceReady.then(() => {
  loadK = 1;
  // the end photo (her aligner in her hand) only loads once the opening's done
  if (scenesOn) faceEnd.style.backgroundImage = 'url(assets/photos/face/end.webp)';
});

// ---------- the opening, then the hero builds itself ----------
const ready = () => html.classList.add('is-ready');
if (html.classList.contains('is-intro')) {
  try { sessionStorage.setItem('aixsmileAlignerIntro', '1'); } catch { /* private mode: it plays again next time */ }
  const intro = $('intro'), pct = $('introPct');
  const t0 = performance.now();
  let shown = 0, done = false;
  // the teeth straighten with the load, never faster than 1.4 s; if loading
  // stalls they creep towards 90 % and the opening gives up after 9 s
  const step = () => {
    const el = (performance.now() - t0) / 1000;
    const target = done ? 1 : Math.min(el / 1.4, Math.max(loadK, 0.9 * (1 - Math.exp(-el / 2.2))));
    shown += (target - shown) * 0.12;
    if (shown > 0.996) shown = 1;
    intro.style.setProperty('--k', shown.toFixed(4));
    pct.textContent = String(Math.round(shown * 100)).padStart(3, '0');
    if (shown < 1) { requestAnimationFrame(step); return; }
    intro.classList.add('is-straight');
    setTimeout(() => {
      html.classList.add('is-lifting');
      ready();
      setTimeout(() => { html.classList.remove('is-intro', 'is-lifting'); intro.remove(); }, 1050);
    }, 520);
  };
  requestAnimationFrame(step);
  Promise.race([faceReady, new Promise((r) => setTimeout(r, 9000))]).then(() => { done = true; });
} else {
  Promise.race([faceReady, new Promise((r) => setTimeout(r, 2600))]).then(() => requestAnimationFrame(ready));
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

// the scroll position where the journey shows progress p (0..1)
const klarY = (p) => klar.offsetTop + p * Math.max(0, klar.offsetHeight - innerHeight) + 2;
const pinned = () => scenesOn;

// in-page links glide (or jump, for reduced motion)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented) return;
  const id = a.getAttribute('href').slice(1);
  const target = id ? $(id) : null;
  if (!target) return;
  e.preventDefault();
  if (id === 'ablauf' && pinned()) glide(klarY(chapterAnchor(1)));
  else glide(id === 'top' || id === 'main' ? 0 : target);
  if (id === 'main') { const h = $('heroH'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
});

// ---------- the floating menu / phone bar appear once the journey is behind ----------
new IntersectionObserver(([e]) => {
  html.classList.toggle('is-past', !e.isIntersecting && e.boundingClientRect.top < 0);
}, { rootMargin: '0px 0px -100% 0px' }).observe(klar);

// ---------- the journey: scroll → progress; her photo eases after it ----------
const st = sample(0);
const want = { p: 0, lx: 0, ly: 0 }, have = { p: 0, lx: 0, ly: 0 };
let raf = 0, lastT = 0, near = true;
const cap = $('klarCap'), num = $('klarNum'), title = $('klarTitle'), text = $('klarText');
const chapters = all('#klarList li');
const rail = all('#klarRail button');
const trayNum = $('klarTrayNum');
let curCh = -1;

// chapter 0 is the starting point (her smile, close up); 1–4 come from the
// chapter list
const startCap = $('klarStart');
function showChapter(k, force) {
  if (k === curCh && !force) return;
  const moved = k !== curCh;
  curCh = k;
  const li = k === 0 ? startCap : chapters[k - 1];
  num.textContent = String(k).padStart(2, '0');
  // a chapter in the list is h3 + p; the starting point is two plain paragraphs
  const ps = li.querySelectorAll('p');
  title.textContent = (li.querySelector('h3') || ps[0]).textContent;
  text.textContent = ps[ps.length - 1].textContent;
  rail.forEach((b, i) => (i === k ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  if (moved && !calm) { cap.classList.remove('is-swap'); void cap.offsetWidth; cap.classList.add('is-swap'); }
}

// labels on the crooked teeth: where each tag sits from its tooth (px on a
// laptop, phones take them closer), and the number it counts down from (what
// the photo shows, as an illustration)
const TAGS = [
  { id: '12', dx: -60, dy: -150, key: 'turn', from: 16, d: 0 },
  { id: '22', dx: 40, dy: -175, key: 'in', from: 1.8, d: 1 },
  { id: '23', dx: 130, dy: -70, key: 'high', from: 2.0, d: 1 },
  { id: '41', dx: -120, dy: 125, key: 'turn', from: 13, d: 0 },
].map((t) => ({ ...t, el: klar.querySelector(`.tag3d[data-tooth="${t.id}"]`), shown: '' }));
// and on the aligners while they go on, following each one: "going on",
// then "in place"
const TRAY_TAGS = [
  { id: 'u', arch: 'u', dx: 170, dy: -150 },
  { id: 'l', arch: 'l', dx: -170, dy: 140 },
].map((t) => ({ ...t, el: klar.querySelector(`.tag3d[data-tray="${t.arch}"]`), shown: '' }));
const lines = $('klarLines');
[...TAGS, ...TRAY_TAGS].forEach((t) => {
  t.line = document.createElementNS(SVGNS, 'line');
  t.dot = document.createElementNS(SVGNS, 'circle');
  t.dot.setAttribute('r', '3');
  const group = t.arch ? 'is-tray' : 'is-teeth';
  t.line.setAttribute('class', group);
  t.dot.setAttribute('class', group);
  lines.append(t.line, t.dot);
});

// ---------- the camera: where her photo sits, and how big ----------
// Three framings, blended by the timeline: her portrait (the hero), her mouth
// (the journey) and the closing one (room for the last line). Each is the
// photo's scale and the screen point the centre of her mouth goes to.
const MC = [(FACE.mouth[0] + FACE.mouth[2] / 2) * FACE.w, (FACE.mouth[1] + FACE.mouth[3] / 2) * FACE.h];
const heroCopy = $('heroCopy');
const rightOf = (el) => el.offsetLeft + el.offsetWidth;
function framing(which, out) {
  const vw = innerWidth, vh = stick.clientHeight || innerHeight;
  const mouthW = FACE.mouth[2] * FACE.w;
  if (phoneQ.matches) {
    if (which === 'mouth') {
      out.s = (vw * 0.94) / mouthW; out.x = vw / 2; out.y = vh * 0.6;
    } else if (which === 'end') {
      // at the top, over the last line
      out.s = (vw * 1.06) / FACE.w;
      out.x = vw / 2 + (MC[0] - FACE.w / 2) * out.s; out.y = 40 + MC[1] * out.s;
    } else {
      // under the words (her chin and sweater may run off the bottom)
      const below = heroCopy.offsetTop + heroCopy.offsetHeight + 4;
      out.s = Math.min(vw * 0.98, ((vh - below) / 0.93) * (FACE.w / FACE.h)) / FACE.w;
      out.x = vw / 2 + (MC[0] - FACE.w / 2) * out.s; out.y = below + MC[1] * out.s;
    }
    return out;
  }
  if (which === 'mouth') {
    // right of the chapter caption, the mouth about two thirds of the room
    const left = rightOf(cap) + 24, room = vw - left - 24;
    out.s = Math.min(room * 0.68, vh * 1.3) / mouthW; out.x = left + room / 2; out.y = vh * 0.5;
    return out;
  }
  // laptops: her portrait fills the height on the right, clear of the words;
  // upright tablets: smaller, at the top right, the words below her
  const upright = vw < vh;
  out.s = upright ? Math.min(vh * 0.62 / FACE.h, vw * 0.74 / FACE.w) : (vh * 1.02) / FACE.h;
  const w = FACE.w * out.s;
  const left = upright ? vw - w - vw * 0.02 : Math.max(vw - w - vw * 0.03, rightOf(heroCopy) - w * 0.14);
  out.x = left + MC[0] * out.s; out.y = (upright ? 56 : vh * 0.01) + MC[1] * out.s;
  return out;
}
const fHero = {}, fMouth = {}, fEnd = {}, cam = { s: 1, x: 0, y: 0, tx: 0, ty: 0 };
const mixF = (a, b, k, out) => {
  out.s = a.s * Math.pow(b.s / a.s, k);
  out.x = a.x + (b.x - a.x) * k; out.y = a.y + (b.y - a.y) * k;
  return out;
};
function aim(s, lx, ly) {
  framing('hero', fHero); framing('mouth', fMouth); framing('end', fEnd);
  mixF(mixF(fHero, fEnd, s.end, cam), fMouth, s.zoom, cam);
  // she leans a little toward the mouse (less when close up)
  const drift = 1 - 0.6 * s.zoom;
  cam.tx = cam.x - MC[0] * cam.s + lx * 10 * drift;
  cam.ty = cam.y - MC[1] * cam.s + ly * 7 * drift;
  face.style.transform = `translate(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px) scale(${cam.s.toFixed(5)})`;
}
// a point on the photo (fractions) → the screen; an aligner's tag rides
// along with it (its offset, a fraction of the jaw box's height)
const pt = { x: 0, y: 0 };
const trayY = { u: 0, l: 0 };
const onScreen = (id) => {
  const [fx, fy] = FACE.tags[id];
  const ride = trayY[id] ? trayY[id] * FACE.jaw[3] : 0;
  pt.x = cam.tx + fx * FACE.w * cam.s; pt.y = cam.ty + (fy + ride) * FACE.h * cam.s;
  return pt;
};

// a tag next to its tooth (or the aligner over it), kept on screen, the line
// running to its near edge
function pin(t, small, capEdge) {
  onScreen(t.id);
  const dx = t.dx * (small ? 0.5 : 1), dy = t.dy * (small ? 0.62 : 1);
  const w = t.el.offsetWidth, h = t.el.offsetHeight;
  const x = clamp(pt.x + dx, (dx < 0 ? w : 0) + Math.max(8, capEdge), innerWidth - (dx < 0 ? 0 : w) - 8);
  const y = clamp(pt.y + dy, h / 2 + 64, innerHeight - h / 2 - 8);
  const tx = dx < 0 ? x - w : x, ty = y - h / 2;
  t.el.style.setProperty('--x', `${tx.toFixed(1)}px`);
  t.el.style.setProperty('--y', `${ty.toFixed(1)}px`);
  t.line.setAttribute('x1', pt.x.toFixed(1)); t.line.setAttribute('y1', pt.y.toFixed(1));
  t.line.setAttribute('x2', x.toFixed(1)); t.line.setAttribute('y2', y.toFixed(1));
  t.dot.setAttribute('cx', pt.x.toFixed(1)); t.dot.setAttribute('cy', pt.y.toFixed(1));
}
const say = (t, label) => { if (label !== t.shown) { t.shown = label; t.el.querySelector('[data-k]').textContent = label; } };
function placeTags(s) {
  const small = phoneQ.matches;
  // on laptops the chapter caption owns the left side while it plays
  const capEdge = !small && klar.classList.contains('is-playing') ? rightOf(cap) + 14 : 0;
  const D = dyn();
  if (s.labels > 0.01) {
    for (const t of TAGS) {
      pin(t, small, capEdge);
      // what is left to go; "straight" once there
      const left = t.from * (1 - s.straight);
      say(t, left < (t.d ? 0.05 : 0.5) ? D.tags.done : D.tags[t.key](D.num(left, t.d)));
    }
  }
  for (const t of TRAY_TAGS) {
    const up = t.arch === 'u';
    const o = s.trays * clamp((up ? s.upIn : s.loIn) * 2.5);
    setVar(t.el, '--o', o); setVar(t.line, '--o', o); setVar(t.dot, '--o', o);
    if (o < 0.01) continue;
    pin(t, small, capEdge);
    const seated = (up ? s.upSeat : s.loSeat) > 0.999;
    say(t, seated ? D.trays.seated : D.trays.going);
    t.el.classList.toggle('is-done', seated);
  }
}

// a frame strip as two layers, the next frame fading in over the last, so
// the teeth glide from frame to frame
function strip(layers, n) {
  let a = -1;
  const row = (i) => `0 ${((i / (n - 1)) * 100).toFixed(4)}%`;
  return (f) => {
    const i = Math.min(n - 2, Math.max(0, Math.floor(f)));
    if (i !== a) { a = i; layers[0].style.backgroundPosition = row(i); layers[1].style.backgroundPosition = row(i + 1); }
    setVar(layers[1], '--k', clamp(f - i));
  };
}
const trayFrame = strip(trayFilm, FACE.tray), wearFrame = strip(wearFilm, FACE.wear);

// an aligner on its own: it comes in from the front (bigger, blurred, from
// below or above), waits just off its teeth, then is pushed on, speeding up
// into the click; the photo of it in place takes over as it seats
function aligner(el, side, inK, seatK, onK, click) {
  const sign = side === 'u' ? 1 : -1;               // the upper waits below its teeth, the lower above
  const wait = FACE.gap * 0.8 * sign;
  const come = 1 - inK;
  const y = wait * (1 - seatK * seatK * seatK) + come * 0.32 * sign;
  trayY[side] = y;
  setVar(el, '--y', y * 100);
  setVar(el, '--s', 1 + come * 0.35);
  setVar(el, '--b', come * 7);
  setVar(el, '--o', clamp(inK * 1.6) * (1 - onK));
  setVar(el, '--c', click);
}

function paint() {
  sample(have.p, st);
  aim(st, have.lx, have.ly);
  // the jaw layers play the aligner chapter (their first frame is her photo);
  // once the bite is closed the wear's mouth frames take over (their first is
  // the jaw's last); after the white-out the photo of her holding her aligner
  // takes over
  const wearOn = st.wear && !st.end;
  const jawOn = st.p > 0.31 && !wearOn && !st.end;
  setVar(stick, '--jaw', jawOn ? 1 : 0);
  setVar(stick, '--wear', wearOn ? 1 : 0);
  setVar(stick, '--end', st.end);
  if (wearOn) wearFrame(st.straight * (FACE.wear - 1));
  if (jawOn) {
    trayFrame(st.trayFrame);
    aligner(al.u, 'u', st.upIn, st.upSeat, st.upOn, st.upClick);
    aligner(al.l, 'l', st.loIn, st.loSeat, st.loOn, st.loClick);
  }
  setVar(stick, '--h', st.play);
  setVar(stick, '--cap', st.cap);
  setVar(stick, '--scan', st.dissolve);
  setVar(stick, '--sweep', st.sweep);
  setVar(stick, '--line', st.line);
  setVar(stick, '--points', st.points);
  setVar(stick, '--glint', st.form);
  setVar(stick, '--dive', st.dive);
  setVar(stick, '--white', st.white);
  setVar(stick, '--fin', st.finale);
  setVar(stick, '--labels', st.labels);
  placeTags(st);
}

function loop(now) {
  raf = 0;
  const dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 1 / 60;
  lastT = now;
  // the photo glides after the scroll a little, so a quick flick still plays
  const kp = 1 - Math.exp(-dt / 0.2), kl = 1 - Math.exp(-dt / 0.3);
  have.p += (want.p - have.p) * kp;
  have.lx += (want.lx - have.lx) * kl;
  have.ly += (want.ly - have.ly) * kl;
  const settled = Math.abs(want.p - have.p) < 2e-4 && Math.abs(want.lx - have.lx) < 2e-3 && Math.abs(want.ly - have.ly) < 2e-3;
  if (settled) Object.assign(have, want);
  const going = near && !document.hidden;
  if (going) paint();
  if (!settled && going) raf = requestAnimationFrame(loop);
  else lastT = 0;
}
const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
document.addEventListener('visibilitychange', kick);
addEventListener('resize', () => { paint(); kick(); });
paint();

// she leans a little toward the mouse
if (fine && !calm) {
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !near) return;
    want.lx = clamp((e.clientX / innerWidth - 0.5) * 2, -1, 1);
    want.ly = clamp((e.clientY / innerHeight - 0.5) * 2, -1, 1);
    kick();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { want.lx = 0; want.ly = 0; kick(); });
}

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
      const k = clamp((t - t0) / 1300);
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
const nearIO = scenesOn ? new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const s = scenes.find((x) => x.el === e.target);
    if (s) s.on = e.isIntersecting;
    if (e.target === klar) { near = e.isIntersecting; if (near) kick(); }
  });
  tick();
}, { rootMargin: '35% 0px 35% 0px' }) : null;
const scene = (el, mode, fn) => {
  if (!scenesOn || !el) return null;
  const s = { el, mode, fn, on: false, last: -1 };
  scenes.push(s);
  nearIO.observe(el);
  return s;
};
const rerun = () => { scenes.forEach((s) => { s.last = -1; }); tick(); };
if (scenesOn) {
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', rerun);
  addEventListener('load', rerun);
}

// ---------- the journey's scene ----------
showChapter(0, true);
const finaleLinks = all('a', $('finale'));
let endOn = null;
const setEnd = (on) => {
  if (on === endOn) return;
  endOn = on;
  klar.classList.toggle('is-end', on);
  finaleLinks.forEach((a) => { a.tabIndex = on ? 0 : -1; });
};
setEnd(false);
scene(klar, 'pin', (p) => {
  sample(p, st);
  klar.classList.toggle('is-playing', st.play > 0.5);
  // the tray counter, while the aligners go on and while she wears them
  klar.classList.toggle('is-count', st.chapter === 2 || st.chapter === 3);
  setEnd(st.finale > 0.02);
  showChapter(st.chapter);
  trayNum.textContent = String(st.tray).padStart(2, '0');
  rail.forEach((b, i) => {
    const c = CHAPTERS[i];
    setVar(b, '--f', clamp((p - c.from) / (c.to - c.from)));
  });
  want.p = p;
  kick();
});
// a chapter on the rail scrolls to where it is fully on show
rail.forEach((b, i) => b.addEventListener('click', () => glide(klarY(chapterAnchor(i)))));
onLangChange(() => { showChapter(curCh, true); [...TAGS, ...TRAY_TAGS].forEach((t) => { t.shown = ''; }); paint(); });

// ---------- situation cards: a tap opens one; with a mouse, pointing opens it
// and moving away closes it again unless it was clicked (the implant page) ----------
const sits = all('.sit');
const openSit = (li, on) => { li.classList.toggle('is-open', on); li.querySelector('.sit__btn').setAttribute('aria-expanded', on ? 'true' : 'false'); };
const closeSits = (except) => sits.forEach((li) => { if (li !== except) { openSit(li, false); delete li.dataset.kept; } });
const wideQ = matchMedia('(min-width: 761px)');
sits.forEach((li) => {
  const btn = li.querySelector('.sit__btn');
  btn.addEventListener('click', () => {
    const keep = !li.dataset.kept;
    closeSits(li);
    if (keep) { li.dataset.kept = '1'; openSit(li, true); } else { delete li.dataset.kept; openSit(li, false); }
  });
  if (fine) {
    li.addEventListener('mouseenter', () => { if (wideQ.matches && !sits.some((x) => x.dataset.kept)) openSit(li, true); });
    li.addEventListener('mouseleave', () => { if (wideQ.matches && !li.dataset.kept) openSit(li, false); });
  }
  const link = li.querySelector('[data-note]');
  if (link) link.addEventListener('click', () => note(dyn().note.sit + li.querySelector('.sit__t').textContent.trim()));
  // the photo drifts inside its card
  scene(li, 'through', (p) => setVar(li, '--p', p));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sits.some((li) => li.classList.contains('is-open'))) closeSits(); });

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
const light = (words, k) => {
  const n = words.length;
  words.forEach((w, i) => {
    const o = (0.14 + 0.86 * clamp(k * (n + 1.5) - i)).toFixed(3);
    if (w.style.opacity !== o) w.style.opacity = o;
  });
};

// ---------- "Im Gespräch [photo] fällt die Schiene kaum auf." ----------
// the words light up, the little photo grows until it fills the screen (the
// implant page's X-ray box), then the line and the button come up on it
const grow = $('kaum');
if (grow && scenesOn) {
  const textEl = grow.querySelector('.grow__text');
  let words = splitWords(textEl);
  const stickEl = grow.querySelector('.grow__stick'), box = grow.querySelector('.grow__box');
  const fill = grow.querySelector('.grow__fill'), fimg = fill.querySelector('img');
  const bandLinks = all('a', $('growBand'));
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
    const s = stickEl.getBoundingClientRect(), b = box.getBoundingClientRect();
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
}

// ---------- everyday questions: giant words that open; a photo follows the mouse ----------
// (the bleaching page's three ways) one open at a time; the words slide in
// from alternate sides as they arrive
const ways = $('alltag');
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
      // only over a closed question: an open one shows its photo in the panel
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

// the marquee slides one line each way; the real case grows into place
const marquee = document.querySelector('.marquee');
if (marquee) scene(marquee, 'through', (p) => setVar(marquee, '--p', p));
const caseFig = document.querySelector('.case__fig');
if (caseFig) scene(caseFig, 'enter', (p) => setVar(caseFig, '--e', ease(p)));

// ---------- the check: three questions, the answers into the booking note ----------
const quiz = $('quiz');
if (quiz) {
  const qs = all('.quiz__q', quiz);
  const back = $('quizBack'), count = $('quizCount'), result = $('quizResult'), linesEl = $('quizLines');
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
    linesEl.textContent = '';
    answers.forEach((a, k) => {
      const li = document.createElement('li');
      li.textContent = L[k][a];
      linesEl.appendChild(li);
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

// ---------- the day as a ring: 24 ticks, drawn as it comes in ----------
const ring = $('dayRing');
if (ring) {
  const ticks = $('dayTicks');
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const major = i % 6 === 0;
    const r1 = 168, r2 = major ? 184 : 176;
    const l = document.createElementNS(SVGNS, 'line');
    l.setAttribute('x1', (200 + Math.cos(a) * r1).toFixed(1)); l.setAttribute('y1', (200 + Math.sin(a) * r1).toFixed(1));
    l.setAttribute('x2', (200 + Math.cos(a) * r2).toFixed(1)); l.setAttribute('y2', (200 + Math.sin(a) * r2).toFixed(1));
    if (major) l.setAttribute('class', 'is-major');
    ticks.appendChild(l);
  }
  scene(ring, 'enter', (p) => setVar(ring, '--d', ease(clamp((p - 0.15) / 0.75))));
}

// pictures drift inside their frames
[document.querySelector('.doctor__fig'), $('mapTile')].forEach((el) => scene(el, 'through', (p) => setVar(el, '--p', p)));
// panels open from rounded corners as they come in
[$('kosten'), $('termin'), $('passt')].forEach((el) => scene(el, 'enter', (p) => setVar(el, '--e', ease(p))));

// the footer wordmark rises letter by letter
const mark = document.querySelector('.foot__mark');
if (mark && scenesOn) {
  const word = mark.textContent.trim();
  mark.textContent = '';
  const letters = [...word].map((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; mark.appendChild(s); return s; });
  scene(mark, 'show', (p) => letters.forEach((l, i) => setVar(l, '--k', ease(clamp(p * 2.1 - i * 0.07)))));
}

// ---------- the real case: a compare slider ----------
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
      setTimeout(() => { if (!touched) sweep(); }, 600);
    }, { threshold: 0.6 });
    seen.observe(box);
  }
});

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

// a language switch changes line lengths
onLangChange(() => setTimeout(rerun, 30));
tick();
