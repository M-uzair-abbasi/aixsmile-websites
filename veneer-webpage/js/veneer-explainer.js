import { buildVeneerModel } from '/js/veneer-model.js';

const STATE_ORDER = ['before', 'veneer', 'seated'];
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
  let pivot;
  let setSeating;
  let getBounds;
  let framingBounds;
  let frameId = 0;
  let transitionStart = 0;
  let transitionFrom = 0;
  let transitionTo = 0;
  let currentSeating = 0;
  let currentState = 'before';
  let orbitTargetX = 0;
  let orbitTargetY = 0;
  let orbitX = 0;
  let orbitY = 0;
  let dragging = false;
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
    currentSeating = seat;
    const orbitEase = reducedMotion ? 1 : .14;
    orbitX += (orbitTargetX - orbitX) * orbitEase;
    orbitY += (orbitTargetY - orbitY) * orbitEase;
    if (pivot) {
      pivot.rotation.x = orbitX;
      pivot.rotation.y = orbitY;
    }
    renderer.render(scene, camera);
    if (progress < 1 || Math.abs(orbitTargetX - orbitX) > .001 || Math.abs(orbitTargetY - orbitY) > .001) scheduleFrame();
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
    const distance = Math.max(verticalHalf / fovTan, horizontalHalf / (fovTan * aspect)) * 1.04;
    const aim = center.clone();
    aim.y += size.y * .04;
    camera.position.set(center.x + distance * .12, center.y + distance * .08, center.z + distance);
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
    transitionFrom = immediate || reducedMotion ? value : currentSeating;
    transitionTo = value;
    transitionStart = performance.now();
    if (immediate || reducedMotion) {
      setSeating(value);
      currentSeating = value;
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
    const nextIndex = event.key === 'ArrowRight'
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

  const setOrbitFromPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    const y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    orbitTargetY = x * .34;
    orbitTargetX = y * -.18;
    scheduleFrame();
  };

  const resetOrbit = () => {
    if (dragging) return;
    orbitTargetX = 0;
    orbitTargetY = 0;
    scheduleFrame();
  };

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture?.(event.pointerId);
    setOrbitFromPointer(event);
  };

  const onPointerMove = (event) => setOrbitFromPointer(event);

  const onPointerUp = (event) => {
    dragging = false;
    canvas.classList.remove('is-dragging');
    canvas.releasePointerCapture?.(event.pointerId);
    resetOrbit();
  };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    if ('toneMapping' in renderer && THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if ('toneMappingExposure' in renderer) renderer.toneMappingExposure = 1.08;
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(29, 1, .001, 2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8da99d, 1.8));
    const key = new THREE.DirectionalLight(0xfff8ee, 2.45);
    key.position.set(.14, .24, .18);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa9c8bb, .9);
    fill.position.set(-.16, .08, -.14);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, .58);
    rim.position.set(.04, -.04, -.22);
    scene.add(rim);

    const built = buildVeneerModel(THREE);
    ({ root, setSeating, getBounds } = built);
    root.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    setSeating(0);
    const initialBefore = getBounds();
    setSeating(1);
    const union = initialBefore.union(getBounds()).clone();
    const unionCenter = union.getCenter(new THREE.Vector3());
    const framingShift = unionCenter.clone().multiplyScalar(-1);
    root.position.add(framingShift);
    framingBounds = union.translate(framingShift);
    pivot = new THREE.Group();
    pivot.add(root);
    scene.add(pivot);
    setSeating(0);
    currentSeating = 0;

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerenter', onPointerMove);
    canvas.addEventListener('pointerleave', resetOrbit);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

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
    renderState('before', true);
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
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerenter', onPointerMove);
      canvas.removeEventListener('pointerleave', resetOrbit);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      renderer?.dispose();
    },
  };
}
