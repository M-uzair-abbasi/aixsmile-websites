// The 3D treatment section: the bleaching on the real dentition, played
// while the visitor presses and holds the right side of the view (like
// holding the right edge of a video). Scrolling past the section changes
// nothing. This file owns the playhead, the caption, the shade readout and
// the step dots; the captions come from the section's own step list, which
// i18n.js translates. The 3D stage (js/src/bleach-stage.js, shipped as the
// bundle js/bleach-stage.js — rebuild it with tools/build-3d.mjs) loads when
// the section comes near and only draws what it is told; until then, and
// where WebGL is missing or lost, the stage shows a rendered still per step.
// Adapted from the veneer page's js/procedure-section.js.
import { STEP_COUNT, stepAt, stepAnchor, sampleBleach, swatchAt } from './bleach-timeline.js';
import { onLangChange } from './i18n.js';

const SETTLE = 0.11;      // seconds: how softly the drawn progress follows the playhead
const PLAY_SECONDS = 12;  // holding plays the whole treatment in about this long
const RUN_UP = 0.35;      // seconds to reach full speed, instead of a jolt
const GLIDE_MS = 900;     // a step dot glides the playhead to its step in this long

function whenCalm(fn) {
  // the hero plays its entrance first; then wait for an idle moment
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  const wait = () => setTimeout(idle, 2600);
  if (document.readyState === 'complete') wait(); else addEventListener('load', wait, { once: true });
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function initTreatmentSection({ section, stageUrl, modelUrl, stillUrl }) {
  const $ = (sel) => section.querySelector(sel);
  const canvas = $('.procedure__canvas'), poster = $('.procedure__poster');
  const caption = $('.procedure__caption'), num = $('.procedure__num'), title = $('.procedure__title'), text = $('.procedure__text');
  const cta = $('.procedure__cta');
  const chip = $('.procedure__shade'), shadeOut = $('.procedure__shade b');
  const dots = [...section.querySelectorAll('.procedure__dots button')];
  const steps = [...section.querySelectorAll('.procedure__list li')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let step = -1, target = 0, shown = 0, frame = 0, lastTime = 0, view = null;

  function showStep(k, force) {
    if (k === step && !force) return;
    const moved = k !== step;
    step = k;
    num.textContent = String(k + 1).padStart(2, '0');
    title.innerHTML = steps[k].querySelector('h3').innerHTML;
    text.innerHTML = steps[k].querySelector('p').innerHTML;
    cta.hidden = k !== STEP_COUNT - 1;
    section.classList.toggle('is-end', k === STEP_COUNT - 1);
    dots.forEach((d, i) => (i === k ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
    if (!view) poster.src = stillUrl(k);
    if (moved && !reduce) { caption.classList.remove('is-swapping'); void caption.offsetWidth; caption.classList.add('is-swapping'); }
  }
  function showShade(p) {
    const s = sampleBleach(p);
    if (shadeOut.textContent !== s.shadeCode) shadeOut.textContent = s.shadeCode;
    chip.style.setProperty('--tooth', swatchAt(s.shade));
  }

  const api = { ready: Promise.reject(new Error('3D off')), seek() {}, progress: () => shown, still: () => null };
  api.ready.catch(() => {});
  // the step list is translated by i18n.js; the caption re-reads it
  onLangChange(() => { if (step >= 0) showStep(step, true); });
  if (!document.documentElement.classList.contains('proc-live')) return api;

  // The drawn progress eases towards the playhead; frames are drawn only
  // while it moves, so an idle section costs nothing.
  function tick(now) {
    frame = 0;
    const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 1 / 60;
    lastTime = now;
    shown += (target - shown) * (1 - Math.exp(-dt / SETTLE));
    if (Math.abs(target - shown) < 5e-4) shown = target;
    showStep(stepAt(shown));
    showShade(shown);
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
    if (shown !== target) frame = requestAnimationFrame(tick); else lastTime = 0;
  }
  const draw = () => { if (!frame) frame = requestAnimationFrame(tick); };
  const setTarget = (p) => { target = clamp01(p); draw(); };
  // straight to p, caption and 3D included, without waiting for a frame
  function jump(p) {
    shown = target = clamp01(p);
    showStep(stepAt(shown));
    showShade(shown);
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
  }
  showStep(0, true);
  showShade(0);

  // ---- playback: while held, the playhead advances at a steady pace --------
  let playing = false, playRaf = 0, playLast = 0, speed = 0, glideRaf = 0;
  const cancelGlide = () => { cancelAnimationFrame(glideRaf); glideRaf = 0; };
  function run(now) {
    if (!playing) return;
    // up to 0.1 s per frame, so a slow phone (down to ~10 fps) keeps the pace
    const dt = playLast ? Math.min(0.1, (now - playLast) / 1000) : 0;
    playLast = now;
    speed = Math.min(1, speed + dt / RUN_UP);
    setTarget(target + (speed * dt) / PLAY_SECONDS);
    if (target >= 1) { stop(); return; }
    playRaf = requestAnimationFrame(run);
  }
  function play() {
    cancelGlide();
    // held at the end: start the treatment again from the beginning
    if (target >= 0.995) { target = shown = 0; draw(); }
    playing = true; speed = 0; playLast = 0;
    section.classList.add('is-playing');
    playRaf = requestAnimationFrame(run);
  }
  function stop() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(playRaf);
    section.classList.remove('is-playing');
  }

  // a step dot takes the playhead to the moment that step's action is done:
  // gliding, or at once with reduced motion
  function glideTo(to) {
    stop(); cancelGlide();
    if (reduce) { jump(to); return; }
    const from = target, t0 = performance.now();
    const glide = (now) => {
      const k = Math.min(1, (now - t0) / GLIDE_MS);
      setTarget(from + (to - from) * easeInOut(k));
      glideRaf = k < 1 ? requestAnimationFrame(glide) : 0;
    };
    glideRaf = requestAnimationFrame(glide);
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => glideTo(stepAnchor(i))));

  // ---- the hold zone: the right side of the view --------------------------
  // A finger that moves is scrolling, not holding, so normal swipes on that
  // side keep working; playback starts once the press has stayed still.
  const hold = $('.procedure__hold');
  let timer = 0, origin = null;
  const release = () => { clearTimeout(timer); timer = 0; origin = null; stop(); };
  hold.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    origin = { x: e.clientX, y: e.clientY };
    clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; play(); }, e.pointerType === 'mouse' ? 120 : 250);
  });
  hold.addEventListener('pointermove', (e) => {
    if (timer && origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) { clearTimeout(timer); timer = 0; }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => hold.addEventListener(type, release));
  hold.addEventListener('contextmenu', (e) => e.preventDefault());   // no long-press menu on phones
  hold.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat && !playing) play();
  });
  hold.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
  // scrolled away while holding (mouse wheel): pause there
  new IntersectionObserver((entries) => { if (!entries[entries.length - 1].isIntersecting) release(); }).observe($('.procedure__view'));

  // ---- the 3D stage ----------------------------------------------------------
  const toStills = () => {
    view = null;
    section.classList.remove('is-3d');
    section.classList.add('is-stills');
    poster.src = stillUrl(Math.max(0, step));
  };
  let startPromise = null;
  const start3d = () => {
    if (startPromise) return startPromise;
    startPromise = import(stageUrl)
      .then(({ createBleachStage }) => createBleachStage({ canvas, modelUrl }))
      .then((stage3d) => {
        view = stage3d;
        view.render(shown);
        section.classList.add('is-3d');
        new ResizeObserver(() => view && view.resize()).observe(canvas);
        canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toStills(); }, { once: true });
        return view;
      });
    startPromise.catch((err) => { console.warn('Bleaching 3D unavailable, showing stills.', err); toStills(); });
    return startPromise;
  };
  api.ready = new Promise((resolve, reject) => {
    const go = () => start3d().then(resolve, reject);
    // near: start once the page is calm; on screen: start at once
    const near = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { near.disconnect(); whenCalm(go); } }, { rootMargin: '900px 0px' });
    const seen = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { seen.disconnect(); go(); } }, { threshold: 0.02 });
    near.observe(section);
    seen.observe($('.procedure__view'));
  });
  api.ready.catch(() => {});
  /** Jump straight to progress p, without easing (used by the check tools). */
  api.seek = (p) => { stop(); cancelGlide(); jump(p); };
  api.still = (p, width, height) => view && view.still(p, width, height);
  return api;
}
