import { buildVeneerModel } from '/js/veneer-model.js';

const STATE_ORDER = ['seated', 'veneer', 'before'];
const STATE_SEATING = { before: 0, veneer: 0.5, seated: 1 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

export function createVeneerExplainer({ THREE, canvas, fallback, controls, label, title, text, content }) {
  let renderer;
  let scene;
  let camera;
  let root;
  let setSeating;
  let getBounds;
  let framingBounds;
  let frameId = 0;
  let transitionStart = 0;
  let transitionFrom = 1;
  let transitionTo = 1;
  let currentState = 'seated';
  let visible = true;
  let destroyed = false;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let resizeObserver;
  let visibilityObserver;
  const stateCopy = { ...content };

  const copyState = (name) => {
    const copy = stateCopy[name];
    if (!copy) return;
    if (label) label.innerHTML = copy.label;
    if (title) title.innerHTML = copy.title;
    if (text) text.innerHTML = copy.text;
  };

  const updateControls = (name) => {
    controls.forEach((control) => {
      const active = control.dataset.veneerState === name;
      control.setAttribute('aria-selected', String(active));
      control.tabIndex = active ? 0 : -1;
    });
  };

  const scheduleFrame = () => {
    if (destroyed || frameId || !visible) return;
    frameId = requestAnimationFrame(renderFrame);
  };

  const renderFrame = (time) => {
    frameId = 0;
    if (destroyed || !renderer || !visible) return;
    const duration = reducedMotion ? 0 : 520;
    const progress = duration ? clamp((time - transitionStart) / duration, 0, 1) : 1;
    const eased = easeOutCubic(progress);
    const seat = transitionFrom + (transitionTo - transitionFrom) * eased;
    setSeating(seat);
    renderer.render(scene, camera);
    if (progress < 1) scheduleFrame();
  };

  const fitCamera = () => {
    if (!camera || !getBounds) return;
    const bounds = framingBounds || getBounds();
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const aspect = Math.max(.35, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    const verticalHalf = Math.max(size.y, size.z) * .5;
    const horizontalHalf = size.x * .5;
    const fovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) * .5);
    const distance = Math.max(verticalHalf / fovTan, horizontalHalf / (fovTan * aspect)) * 1.55;
    const aim = center.clone();
    aim.y += size.y * .04;
    camera.position.set(center.x + distance * .18, center.y + distance * .18, center.z + distance);
    camera.lookAt(aim);
    camera.near = Math.max(.001, distance * .01);
    camera.far = Math.max(2, distance * 30);
    camera.updateProjectionMatrix();
  };

  const resize = () => {
    if (!renderer) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    fitCamera();
    renderer.render(scene, camera);
  };

  const renderState = (name, immediate = false) => {
    const value = STATE_SEATING[name];
    if (value == null) return;
    currentState = name;
    copyState(name);
    updateControls(name);
    if (!renderer) return;
    transitionFrom = immediate || reducedMotion ? value : transitionFrom;
    transitionTo = value;
    transitionStart = performance.now();
    if (immediate || reducedMotion) {
      setSeating(value);
      fitCamera();
      renderer.render(scene, camera);
      return;
    }
    scheduleFrame();
  };

  const setState = (name, options = {}) => renderState(name, options.immediate === true);

  const setContent = (nextContent) => {
    Object.assign(stateCopy, nextContent);
    copyState(currentState);
  };

  const onKeyDown = (event) => {
    const index = STATE_ORDER.indexOf(currentState);
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextIndex = event.key === 'ArrowLeft'
      ? (index + 1) % STATE_ORDER.length
      : (index - 1 + STATE_ORDER.length) % STATE_ORDER.length;
    const next = STATE_ORDER[nextIndex];
    setState(next);
    controls.find((control) => control.dataset.veneerState === next)?.focus();
  };

  const setFallback = () => {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
    controls.forEach((control) => control.addEventListener('click', () => setState(control.dataset.veneerState)));
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, .001, 2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c5cf, 1.65));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(.12, .18, .16);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbad9e8, .8);
    fill.position.set(-.15, .08, -.12);
    scene.add(fill);

    const built = buildVeneerModel(THREE);
    ({ root, setSeating, getBounds } = built);
    root.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    const initialBefore = getBounds();
    setSeating(1);
    const union = initialBefore.union(getBounds()).clone();
    const unionCenter = union.getCenter(new THREE.Vector3());
    const framingShift = unionCenter.clone().multiplyScalar(-1);
    root.position.add(framingShift);
    framingBounds = union.translate(framingShift);
    const pivot = new THREE.Group();
    pivot.add(root);
    scene.add(pivot);
    setSeating(1);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) {
        resize();
        scheduleFrame();
      }
    }, { rootMargin: '160px' });
    visibilityObserver.observe(canvas.closest('.veneerExplainer') || canvas);
    controls.forEach((control) => control.addEventListener('click', () => setState(control.dataset.veneerState)));
    controls[0]?.parentElement?.addEventListener('keydown', onKeyDown);
    resize();
    renderState('seated', true);
  } catch (error) {
    console.warn('Veneer explainer fallback:', error);
    setFallback();
  }

  return {
    setState,
    setContent,
    destroy() {
      destroyed = true;
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      renderer?.dispose();
    },
  };
}
