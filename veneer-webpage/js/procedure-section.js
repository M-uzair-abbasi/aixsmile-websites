// The procedure section: a pinned stage that plays the veneer treatment while
// the visitor scrolls through it. This file owns the scroll -> progress
// mapping, the caption and the step dots. The 3D stage (veneer-procedure.js)
// loads when the section comes near and only draws what it is told; until it
// is ready, or if WebGL is missing, the stage shows a rendered still per step.
import { STEP_COUNT, stepAt, stepAnchor } from './procedure-timeline.js';

const SETTLE = 0.11; // seconds: how softly the drawn progress follows the scroll

function whenCalm(fn) {
  // the hero plays its entrance first; then wait for an idle moment
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  const wait = () => setTimeout(idle, 2600);
  if (document.readyState === 'complete') wait(); else addEventListener('load', wait, { once: true });
}

export function initProcedureSection({ section, copy, lang, stageUrl, modelUrl, stillUrl }) {
  const $ = (sel) => section.querySelector(sel);
  const track = $('.procedure__track'), stage = $('.procedure__stage');
  const canvas = $('.procedure__canvas'), poster = $('.procedure__poster');
  const caption = $('.procedure__caption'), num = $('.procedure__num'), title = $('.procedure__title'), text = $('.procedure__text');
  const cta = $('.procedure__cta');
  const dots = [...section.querySelectorAll('.procedure__dots button')];

  let words = copy(lang);
  let step = -1, target = 0, shown = 0, frame = 0, lastTime = 0, onScreen = false, view = null;

  function showStep(k, force) {
    if (k === step && !force) return;
    const moved = k !== step;
    step = k;
    num.textContent = String(k + 1).padStart(2, '0');
    title.innerHTML = words[`s${k + 1}t`];
    text.innerHTML = words[`s${k + 1}p`];
    cta.hidden = k !== STEP_COUNT - 1;
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

  const range = () => Math.max(1, track.offsetHeight - stage.offsetHeight);
  const readScroll = () => Math.min(1, Math.max(0, -track.getBoundingClientRect().top / range()));

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
  const follow = () => { target = readScroll(); if (!frame) frame = requestAnimationFrame(tick); };

  addEventListener('scroll', () => { if (onScreen) follow(); }, { passive: true });
  addEventListener('resize', follow, { passive: true });
  new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    if (onScreen) follow();
  }).observe(track);
  shown = target = readScroll();
  showStep(stepAt(shown), true);

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    const top = track.getBoundingClientRect().top + scrollY + stepAnchor(i) * range();
    scrollTo({ top: Math.ceil(top) + 1, behavior: 'smooth' });
  }));

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
    seen.observe(track);
  });
  api.ready.catch(() => {});
  /** Jump to the scroll position without easing (used by the check tools). */
  api.sync = () => {
    shown = target = readScroll();
    showStep(stepAt(shown));
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
  };
  api.still = (p, width, height) => view && view.still(p, width, height);
  return api;
}
