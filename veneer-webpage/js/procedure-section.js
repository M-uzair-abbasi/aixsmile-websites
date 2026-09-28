// The procedure section: the veneer treatment on a 3D dentition, played while
// the visitor presses and holds the right side of the view (like holding the
// right edge of a video). Scrolling past the section changes nothing. This
// file owns the playhead, the caption and the step dots. The 3D stage
// (veneer-procedure.js, shipped as js/veneer-procedure.bundle.js with three.js
// inside — rebuild it with tools/build-procedure.mjs) loads when the section
// comes near and only draws what it is told; until it is ready, the stage
// shows a rendered still per step.
import { STEP_COUNT, stepAt, stepAnchor } from './procedure-timeline.js';

const SETTLE = 0.11;      // seconds: how softly the drawn progress follows the playhead
const PLAY_SECONDS = 15;  // holding plays the whole treatment in about this long
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

export function initProcedureSection({ section, copy, lang, stageUrl, modelUrl, stillUrl }) {
  const $ = (sel) => section.querySelector(sel);
  const stage = $('.procedure__stage');
  const canvas = $('.procedure__canvas'), poster = $('.procedure__poster');
  const caption = $('.procedure__caption'), num = $('.procedure__num'), title = $('.procedure__title'), text = $('.procedure__text');
  const cta = $('.procedure__cta');
  const dots = [...section.querySelectorAll('.procedure__dots button')];

  let words = copy(lang);
  let step = -1, target = 0, shown = 0, frame = 0, lastTime = 0, view = null;

  function showStep(k, force) {
    if (k === step && !force) return;
    const moved = k !== step;
    step = k;
    num.textContent = String(k + 1).padStart(2, '0');
    title.innerHTML = words[`s${k + 1}t`];
    text.innerHTML = words[`s${k + 1}p`];
    cta.hidden = k !== STEP_COUNT - 1;
    section.classList.toggle('is-end', k === STEP_COUNT - 1);
    dots.forEach((d, i) => (i === k ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
    if (!view) poster.src = stillUrl(k);
    if (moved) { caption.classList.remove('is-swapping'); void caption.offsetWidth; caption.classList.add('is-swapping'); }
  }

  const api = {
    setLang(next) { words = copy(next); if (step >= 0) showStep(step, true); },
    /** Resolves with the 3D stage once it has drawn its first frame. */
    ready: null,
  };
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
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
    if (shown !== target) frame = requestAnimationFrame(tick); else lastTime = 0;
  }
  const draw = () => { if (!frame) frame = requestAnimationFrame(tick); };
  const setTarget = (p) => { target = clamp01(p); draw(); };
  showStep(0, true);

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

  // a step dot glides the playhead to the moment that step's action is done
  function glideTo(to) {
    stop(); cancelGlide();
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
  if (hold) {
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
    new IntersectionObserver((entries) => { if (!entries[entries.length - 1].isIntersecting) release(); }).observe(stage);
  }

  // ---- the 3D stage ----------------------------------------------------------
  let startPromise = null;
  const start3d = () => {
    if (startPromise) return startPromise;
    startPromise = import(stageUrl)
      .then(({ createVeneerProcedure }) => createVeneerProcedure({ canvas, modelUrl }))
      .then((stage3d) => {
        view = stage3d;
        view.render(shown);
        section.classList.add('is-3d');
        new ResizeObserver(() => view.resize()).observe(canvas);
        return view;
      });
    startPromise.catch((err) => console.warn('Veneer 3D unavailable, showing stills.', err));
    return startPromise;
  };
  api.ready = new Promise((resolve, reject) => {
    const go = () => start3d().then(resolve, reject);
    // near: start once the page is calm; on screen: start at once
    const near = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { near.disconnect(); whenCalm(go); } }, { rootMargin: '900px 0px' });
    const seen = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { seen.disconnect(); go(); } }, { threshold: 0.02 });
    near.observe(section);
    seen.observe(stage);
  });
  api.ready.catch(() => {});
  /** Jump straight to progress p, without easing (used by the check tools). */
  api.seek = (p) => {
    stop(); cancelGlide();
    shown = target = clamp01(p);
    showStep(stepAt(shown));
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
  };
  api.progress = () => shown;
  api.still = (p, width, height) => view && view.still(p, width, height);
  return api;
}
