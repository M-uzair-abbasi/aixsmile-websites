// The hero's bleaching slider. One range input walks through the treatment
// (js/treatment.js); it drives the step caption, the shade readout and the
// 3D jaw. The jaw's code and model load after the page, and the yellow still
// image stands in until then. Without WebGL, or if loading fails, the slider
// blends that still into a white one instead.

import { treatment, stepAt, shadeAt, toothColour, STEP_STARTS } from './treatment.js';
import { dyn, onLangChange } from './i18n.js';

const fig = document.getElementById('heroStage');
if (fig) init(fig);

function init(fig) {
  const frame = fig.querySelector('.stageFrame');
  const canvas = fig.querySelector('.stageCanvas');
  const range = fig.querySelector('.stageRange');
  const num = fig.querySelector('.stageNum');
  const name = fig.querySelector('.stageName');
  const shadeOut = fig.querySelector('.stageShade b');
  const ticks = [...fig.querySelectorAll('.stageTicks li')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stage = null;

  ticks.forEach((li, i) => li.style.setProperty('--at', STEP_STARTS[i]));

  function update() {
    const p = Number(range.value) / 100;
    const t = treatment(p);
    const i = stepAt(p);
    const s = dyn().stage;
    const shade = shadeAt(t.shade);
    num.textContent = s.num(i + 1, STEP_STARTS.length);
    name.textContent = s.steps[i];
    shadeOut.textContent = shade;
    range.setAttribute('aria-valuetext', s.valueText(i + 1, STEP_STARTS.length, s.steps[i], shade));
    ticks.forEach((li, k) => li.classList.toggle('is-done', k <= i));
    fig.style.setProperty('--p', String(p));
    fig.style.setProperty('--shade', String(t.shade));
    fig.style.setProperty('--tooth', toothColour(t.shade));
    if (stage) stage.set(t);
  }
  range.addEventListener('input', update);
  onLangChange(update);
  update();

  // Dragging across the model moves the slider too. Vertical swipes still
  // scroll the page (touch-action: pan-y on the frame).
  let drag = null;
  frame.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, v: Number(range.value), w: frame.clientWidth || 1 };
    frame.setPointerCapture(e.pointerId);
    frame.classList.add('is-dragging');
  });
  frame.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = Math.round(Math.min(100, Math.max(0, drag.v + ((e.clientX - drag.x) / drag.w) * 110)));
    if (v !== Number(range.value)) { range.value = String(v); update(); }
  });
  const endDrag = () => { drag = null; frame.classList.remove('is-dragging'); };
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);

  // ---- the 3D jaw ----
  function still() {
    // No live model: blend the yellow still into a white one as the slider moves.
    if (fig.classList.contains('is-still')) return;
    const pic = document.createElement('picture');
    pic.innerHTML = '<source media="(max-width: 599px)" srcset="assets/photos/jaw-white-wide.webp" width="960" height="640">'
      + '<img class="stagePoster stagePoster--white" src="assets/photos/jaw-white.webp" width="1280" height="1280" alt="" decoding="async">';
    frame.querySelector('picture').after(pic);
    fig.classList.remove('is-live');
    fig.classList.add('is-still');
  }

  function webgl() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch { return false; }
  }

  async function live() {
    try {
      const { createTeethStage } = await import('./teeth-stage.js');
      stage = await createTeethStage(canvas, {
        modelUrl: 'assets/models/jaw.glb',
        maxDpr: window.innerWidth < 600 ? 1.5 : 2,
        reduceMotion,
      });
      stage.set(treatment(Number(range.value) / 100), { instant: true });
      stage.renderNow();
      fig.classList.add('is-live');
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        stage = null;
        still();
      }, { once: true });
    } catch (err) {
      stage = null;
      still();
    }
  }

  const saveData = navigator.connection && navigator.connection.saveData;
  if (!webgl() || saveData) { still(); return; }
  // After the page has loaded, so the model never competes with the text,
  // fonts and the still image for the first paint.
  const start = () => (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(live, { timeout: 1500 });
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
