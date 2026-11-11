// ===== Scan to Smile: the page =====
// - one number, P, from the scroll position: chapter k (data-scene) plus how
//   far its sticky screen has run (0..1); the 3D stage (js/stage.js) turns P
//   into the aligner's journey, and the chapters' copy reacts to it here
//   (data-in, the method's step, labels that follow the 3D, the light)
// - the blueprint opening, once per visit, while the 3D loads
// - the bar, smooth wheel scrolling (Lenis, fine pointers only), one-time
//   arrivals in the light part, the order form (js/order.js)
// People who asked for less motion, or whose browser has no WebGL, get the
// chapters as plain sections with still pictures.
import { initLang, onLang, t } from './i18n.js';
import { initOrder } from './order.js';

const d = document.documentElement;
const $ = (s) => document.querySelector(s);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const calm = d.classList.contains('is-calm');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

initLang();

function hasGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
const gl = hasGL();
if (!gl) { d.classList.add('no-gl'); d.classList.remove('scenes'); }

let stageModule = null;
const load3d = () => (stageModule ||= import('./stage.js'));
initOrder({ load3d });

// ---------- elements ----------
const bar = $('#bar'), paper = $('#paper'), canvas = $('#stage');
const scenes = [...document.querySelectorAll('[data-scene]')].sort((a, b) => a.dataset.scene - b.dataset.scene);
const method = $('#methode'), hudText = $('#methodHudText');
const arrive = $('#ankunft');

// ---------- scroll → P and the chapters' states ----------
let vh = window.innerHeight;
let step = -1, covered = false;
const inState = new Map();

function read() {
  let P = 0;
  for (const el of scenes) {
    const k = +el.dataset.scene;
    const r = el.getBoundingClientRect();
    const span = k === 0 ? r.height : Math.max(1, r.height - vh);
    const local = clamp01(-r.top / span);
    if (r.top <= 0.5) P = k + local;
    const on = r.top <= vh * 0.4 && r.bottom >= vh * 0.6;
    if (inState.get(el) !== on) { inState.set(el, on); el.toggleAttribute('data-in', on); }
    if (el === method) {
      const s = local < 0.3 ? 0 : local < 0.5 ? 1 : local < 0.76 ? 2 : 3;
      if (s !== step) { step = s; method.dataset.step = s; hudText.textContent = t('hud')[s]; }
    } else if (el === arrive) {
      arrive.toggleAttribute('data-snap', local > 0.64);
      arrive.toggleAttribute('data-smile', local > 0.76);
      arrive.toggleAttribute('data-pull', local > 0.74 && local < 0.94);   // the face passes behind the copy
    }
  }
  const pr = paper.getBoundingClientRect();
  covered = pr.top <= 0;
  const chapter = covered ? '' : String(Math.min(3, Math.floor(P + 0.04)));
  if (document.body.dataset.chapter !== chapter) document.body.dataset.chapter = chapter;
  bar.classList.toggle('is-scrolled', window.scrollY > 8);
  bar.classList.toggle('on-paper', pr.top <= 64 && pr.bottom > 64);
  return Math.min(P, scenes.length);
}
onLang(() => { if (step >= 0) hudText.textContent = t('hud')[step]; });

// ---------- the opening's progress ----------
const ready = { fonts: false, stage: !gl || calm };

// ---------- the 3D stage ----------
let stage = null;
let lowPowerSet = false, frames = 0, slow = 0, lastNow = 0;
let mx = 0, my = 0;
// the hero's product box (where it sits with the page at the top): the 3D fills it
const heroStage = document.getElementById('heroStage');
const placeHero = () => {
  if (!stage || !heroStage) return;
  const r = heroStage.getBoundingClientRect();
  stage.place({ left: r.left, top: r.top + window.scrollY, width: r.width, height: r.height }, heroStage.closest('.hero').offsetHeight);
};

if (gl && !calm) {
  load3d()
    .then((m) => m.createStage(canvas, { base: 'assets/models/', lowPower: !fine && (window.devicePixelRatio || 1) > 2.5 }))
    .then((st) => {
      stage = st;
      stage.resize(window.innerWidth, window.innerHeight);
      placeHero();
      if (document.fonts) document.fonts.ready.then(placeHero);
      stage.warm();
      d.classList.add('has-gl');
      if (heroShown) stage.heroIn();
      ready.stage = true;
    })
    .catch((err) => {
      console.warn('3D unavailable', err);
      d.classList.add('no-gl');
      d.classList.remove('scenes');
      ready.stage = true;
    });
}
window.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  mx = (e.clientX / window.innerWidth) * 2 - 1;
  my = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

let lastW = window.innerWidth, lastH = window.innerHeight;
window.addEventListener('resize', () => {
  vh = window.innerHeight;
  // phones change the height while the address bar slides: only follow real changes
  if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 140) {
    lastW = window.innerWidth; lastH = window.innerHeight;
    stage?.resize(lastW, lastH);
    placeHero();
  }
});

// ---------- smooth wheel + in-page links ----------
let lenis = null;
if (!calm && fine && window.Lenis) lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id.length > 1 ? document.getElementById(id.slice(1)) : null;
  if (!target) return;
  e.preventDefault();
  const y = target.getBoundingClientRect().top + window.scrollY;
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
  if (id !== '#top') history.replaceState(null, '', id);
});

// ---------- the loop ----------
function loop(now) {
  requestAnimationFrame(loop);
  lenis?.raf(now);
  const P = read();
  if (!stage) return;
  canvas.classList.toggle('is-off', covered);
  if (covered || document.hidden) return;
  stage.pointer(mx, my);
  stage.set(P);
  stage.render(now / 1000);
  // a slow GPU: fewer pixels, once
  if (!lowPowerSet && lastNow) {
    frames++;
    if (now - lastNow > 34) slow++;
    if (frames === 120) { if (slow > 50) { stage.setLowPower(true); lowPowerSet = true; } frames = 0; slow = 0; }
  }
  lastNow = now;
}
if (!calm) requestAnimationFrame(loop);
else scenes.forEach((el) => el.setAttribute('data-in', ''));

// ---------- the opening ----------
const intro = $('#intro'), countEl = $('#introCount');
document.fonts?.ready.then(() => { ready.fonts = true; });
setTimeout(() => { ready.fonts = true; }, 1500);
let heroShown = false;
const heroIn = () => { document.body.classList.add('is-ready'); heroShown = true; stage?.heroIn(); };

if (d.classList.contains('is-intro') && intro) {
  const t0 = performance.now();
  let shown = 0;
  const tick = () => {
    const el = performance.now() - t0;
    // the count follows the real loading, but never faster than the drawing
    const target = Math.min(el / 23, (ready.fonts ? 15 : 0) + (ready.stage ? 85 : Math.min(75, el / 55)));
    shown += (target - shown) * 0.09;
    countEl.textContent = String(Math.round(shown)).padStart(3, '0');
    const done = (ready.stage && ready.fonts && el > 2300) || el > 9000;
    if (!done) { requestAnimationFrame(tick); return; }
    countEl.textContent = '100';
    setTimeout(() => {
      intro.classList.add('is-out');
      heroIn();
      setTimeout(() => {
        d.classList.remove('is-intro');
        try { sessionStorage.setItem('aixsmileScanIntro', '1'); } catch { /* private mode */ }
      }, 1150);
    }, 260);
  };
  requestAnimationFrame(tick);
} else {
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(heroIn));
}

// ---------- one-time arrivals in the light part ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
document.querySelectorAll('.head, .rise').forEach((el) => (calm ? el.classList.add('is-in') : io.observe(el)));
