// ===== Order: drop the scan, see it in 3D, send it =====
// Files are read and shown in the browser (js/stage.js → createViewer,
// parseScan); nothing leaves the page until the form is sent.
//
// Four face photos (front/side × smiling/mouth open) go along with the scans.
//
// Sending goes to the aixsmile.de backend, which files the order under
// /admin/scans and notifies the practice:
//   1. each scan is PUT straight into the practice's private file storage
//      (Vercel Blob) through a short-lived presigned URL from
//      API_BASE/api/public/scan/upload, under scans/<orderId>/;
//   2. the form fields + those file paths are posted as JSON to
//      API_BASE/api/public/scan.
// Files never pass through a server function (scans are up to 100 MB).
import { t, onLang, getLang } from './i18n.js';

const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
// local dev talks to a local aixsmile (`?api=https://aixsmile.de` to test against live)
export const API_BASE = LOCAL ? (new URLSearchParams(location.search).get('api') || 'http://localhost:3000') : 'https://aixsmile.de';
export const ORDER_ENDPOINT = `${API_BASE}/api/public/scan/`;
const UPLOAD_ENDPOINT = `${API_BASE}/api/public/scan/upload/`;
const MULTIPART_FROM = 20 * 1024 * 1024;
const MAX_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 6;
const OK_EXT = /\.(stl|ply|obj)$/i;
// face photos: one per slot; the server signs only scans/<id>/photo-<slot>.<ext>
const PHOTO_SLOTS = ['front-smile', 'front-open', 'side-smile', 'side-open'];
const PHOTO_EXT = /\.(jpe?g|png|webp|hei[cf])$/i;
const PHOTO_MAX = 25 * 1024 * 1024;
const SAMPLE_URL = 'assets/models/beispiel-scan-oberkiefer.stl';

const $ = (s, r = document) => r.querySelector(s);
const dec = (s) => (getLang() === 'de' ? s.replace('.', ',') : s);
const fmtBytes = (n) => dec(n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const fmtNum = (n) => n.toLocaleString(getLang() === 'de' ? 'de-DE' : 'en-GB');
const fmtMm = (v) => dec(v.toFixed(1));

export function initOrder({ load3d }) {
  const form = $('#orderForm');
  if (!form) return;
  const drop = $('#drop'), input = $('#fileInput'), list = $('#fileList'), viewerBox = $('#viewer');
  const stats = $('#viewerStats'), status = $('#orderStatus'), send = $('#sendBtn'), sampleBtn = $('#sampleBtn');
  const practiceField = form.querySelector('[data-for="praxis"]');

  const files = [];          // { name, size, file|null, sample, state: 'reading'|'ok'|'bad', note, stats, obj }
  let active = null, viewer = null, mod = null;

  // ---------- who is sending ----------
  const syncRole = () => { practiceField.hidden = form.role.value !== 'praxis'; };
  form.addEventListener('change', (e) => { if (e.target.name === 'role') syncRole(); });
  document.querySelectorAll('[data-pick-role]').forEach((a) => a.addEventListener('click', () => {
    const r = form.querySelector(`input[name="role"][value="${a.dataset.pickRole}"]`);
    if (r) { r.checked = true; syncRole(); }
  }));
  syncRole();

  // ---------- files ----------
  async function ensure3d() {
    if (!mod) mod = await load3d();
    if (!viewer) { viewerBox.hidden = false; viewer = mod.createViewer($('#viewerCanvas')); }
    viewerBox.hidden = false;
    return mod;
  }

  function render() {
    list.replaceChildren();
    drop.classList.toggle('has-files', files.length > 0);
    for (const f of files) {
      const li = document.createElement('li');
      li.classList.toggle('is-active', f === active);
      const name = document.createElement('button');
      name.type = 'button';
      name.className = 'file__name';
      name.textContent = f.name;
      name.title = t('show');
      name.disabled = f.state !== 'ok';
      name.addEventListener('click', () => select(f));
      const meta = document.createElement('span');
      meta.className = 'file__meta' + (f.state === 'bad' ? ' is-bad' : f.sample ? ' is-sample' : '');
      meta.textContent = f.state === 'reading' ? t('reading')
        : f.state === 'bad' ? f.note
        : f.sample ? t('sample')
        : `${fmtBytes(f.size)} · ${fmtNum(f.stats.points ? f.stats.verts : f.stats.tris)} ${f.stats.points ? t('points') : t('tris')}`;
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'file__x';
      x.textContent = '×';
      x.setAttribute('aria-label', `${f.name} ${t('remove')}`);
      x.addEventListener('click', () => removeFile(f));
      li.append(name, meta, x);
      list.append(li);
    }
  }

  function showStats(f) {
    const s = f.stats;
    stats.textContent = '';
    const lines = [f.name, `${fmtNum(s.points ? s.verts : s.tris)} ${s.points ? t('points') : t('tris')}`,
      `${t('size')} ${fmtMm(s.size[0])} × ${fmtMm(s.size[1])} × ${fmtMm(s.size[2])} mm`];
    lines.forEach((l, i) => { if (i) stats.append(document.createElement('br')); stats.append(l); });
  }

  function select(f) {
    if (!f || f.state !== 'ok' || !viewer) return;
    active = f;
    viewer.show(f.obj);
    showStats(f);
    render();
  }

  function removeFile(f) {
    const i = files.indexOf(f);
    if (i >= 0) files.splice(i, 1);
    if (active === f) {
      active = null;
      viewer?.clear();
      stats.textContent = '';
      const next = files.find((g) => g.state === 'ok');
      if (next) select(next); else viewerBox.hidden = true;
    }
    render();
  }

  async function addBuffer(entry, getBuffer) {
    files.push(entry);
    render();
    try {
      const [m, buf] = await Promise.all([ensure3d(), getBuffer()]);
      await new Promise((r) => setTimeout(r, 30));      // let "reading …" paint first
      const { obj, stats: st } = m.parseScan(entry.name, buf);
      Object.assign(entry, { state: 'ok', obj, stats: st });
      if (files.includes(entry)) select(entry);
    } catch {
      entry.state = 'bad';
      entry.note = t('badRead');
      render();
    }
  }

  function addFiles(picked) {
    setStatus('', '');
    for (const file of picked) {
      if (files.length >= MAX_FILES) { setStatus(t('tooMany'), 'bad'); break; }
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue;
      const entry = { name: file.name, size: file.size, file, sample: false, state: 'reading' };
      if (!OK_EXT.test(file.name)) { Object.assign(entry, { state: 'bad', note: t('badFormat') }); files.push(entry); continue; }
      if (file.size > MAX_BYTES) { Object.assign(entry, { state: 'bad', note: t('badSize') }); files.push(entry); continue; }
      addBuffer(entry, () => file.arrayBuffer());
    }
    render();
  }

  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'dragend'].forEach((ev) => drop.addEventListener(ev, (e) => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-over'); if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files); });
  // a file dropped next to the zone should not open in the tab
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => { if (!drop.contains(e.target)) e.preventDefault(); });

  sampleBtn.addEventListener('click', () => {
    const had = files.find((f) => f.sample);
    if (had) { select(had); return; }
    addBuffer({ name: 'beispiel-scan-oberkiefer.stl', size: 0, file: null, sample: true, state: 'reading' },
      () => fetch(SAMPLE_URL).then((r) => { if (!r.ok) throw new Error('sample'); return r.arrayBuffer(); }));
  });

  // ---------- face photos: front + side, smiling + mouth open ----------
  const photos = {};          // slot → File
  const shots = [...form.querySelectorAll('.shot')];
  function setPhoto(shot, file) {
    const slot = shot.dataset.slot, img = shot.querySelector('.shot__img');
    if (img.src) URL.revokeObjectURL(img.src);
    img.removeAttribute('src');
    img.hidden = true;
    delete photos[slot];
    shot.classList.remove('has-photo', 'no-preview');
    shot.querySelector('.shot__x').hidden = true;
    if (!file) return;
    photos[slot] = file;
    shot.classList.add('has-photo');
    shot.closest('.photos').classList.remove('is-bad');
    shot.querySelector('.shot__x').hidden = false;
    img.onerror = () => { img.hidden = true; shot.classList.add('no-preview'); };   // e.g. HEIC outside Safari
    img.src = URL.createObjectURL(file);
    img.hidden = false;
  }
  const photosDone = () => PHOTO_SLOTS.every((k) => photos[k]);
  for (const shot of shots) {
    const pick = shot.querySelector('input');
    pick.addEventListener('change', () => {
      const file = pick.files[0];
      pick.value = '';
      if (!file) return;
      if (!(PHOTO_EXT.test(file.name) || /^image\/(jpeg|png|webp|hei[cf])$/.test(file.type)) || file.size > PHOTO_MAX) {
        setStatus(t('badPhoto'), 'bad');
        return;
      }
      setStatus('', '');
      setPhoto(shot, file);
    });
    shot.querySelector('.shot__x').addEventListener('click', () => { setPhoto(shot, null); pick.focus(); });
    // a photo dropped onto its tile
    ['dragenter', 'dragover'].forEach((ev) => shot.addEventListener(ev, (e) => { e.preventDefault(); shot.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => shot.addEventListener(ev, () => shot.classList.remove('is-over')));
    shot.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const dt = new DataTransfer(); dt.items.add(file); pick.files = dt.files;
      pick.dispatchEvent(new Event('change'));
    });
  }
  function needPhotos() {
    setStatus(t('needPhotos'), 'bad');
    form.querySelector('.photos').classList.add('is-bad');
    const first = shots.find((sh) => !photos[sh.dataset.slot]);
    first?.querySelector('input').focus();
  }

  onLang(() => { render(); if (active) showStats(active); showStep(); });

  // ---------- phones: the form one screen at a time ----------
  // 1 scan (+ which jaws) → 2 face photos → 3 who + contact → 4 delivery address, consent, send.
  // The groups carry data-ostep; css/site.css hides the other steps only on
  // narrow screens, so wider screens keep the whole form (and these buttons
  // stay hidden there). The final submit still runs the full check() and
  // jumps back to the step of the first missing field.
  const section = form.closest('.order');
  const stepText = $('#orderStepText'), stepper = $('#orderStepper');
  const STEPS = 4;
  const stepped = window.matchMedia('(max-width: 700px)');
  let step = 1;
  function showStep() {
    section.dataset.step = step;
    if (stepText) stepText.textContent = `${t('stepOf')(step, STEPS)} · ${t('steps')[step - 1]}`;
  }
  function goTo(n, { scroll = true } = {}) {
    step = Math.max(1, Math.min(STEPS, n));
    showStep();
    if (!scroll || !stepped.matches) return;
    const y = section.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(window.scrollY - y) > 4) window.scrollTo({ top: y, behavior: 'auto' });
  }
  const stepOf = (el) => +(el?.closest('[data-ostep]')?.dataset.ostep || step);
  function fieldsOk(ids) {
    let ok = true;
    for (const id of ids) {
      const el = document.getElementById(id);
      const v = el.value.trim();
      const bad = !v || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && ok) { ok = false; el.focus(); }
    }
    return ok;
  }
  function stepOk() {
    if (step === 1 && !files.some((f) => f.state === 'ok' && !f.sample)) { setStatus(t('needFile'), 'bad'); input.focus(); return false; }
    if (step === 2 && !photosDone()) { needPhotos(); return false; }
    if (step === 3 && !fieldsOk(['fName', 'fEmail'])) { setStatus(t('needFields'), 'bad'); return false; }
    return true;
  }
  function next() {
    if (!stepOk()) return;
    setStatus('', '');
    goTo(step + 1);
    stepper?.focus({ preventScroll: true });
  }
  $('#orderNext')?.addEventListener('click', next);
  $('#orderBack')?.addEventListener('click', () => { setStatus('', ''); goTo(step - 1); stepper?.focus({ preventScroll: true }); });
  // a role picked in "Für wen" starts the form from its first step
  document.querySelectorAll('[data-pick-role]').forEach((a) => a.addEventListener('click', () => goTo(1, { scroll: false })));
  showStep();

  // ---------- sending ----------
  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = 'order__status' + (kind ? ` is-${kind}` : '');
  }

  function check() {
    let ok = true;
    for (const id of ['fName', 'fEmail', 'fStreet', 'fZip', 'fCity']) {
      const el = document.getElementById(id);
      const v = el.value.trim();
      const bad = !v || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && ok) { ok = false; goTo(stepOf(el)); el.focus(); }
    }
    if (!ok) { setStatus(t('needFields'), 'bad'); return false; }
    const consent = $('#fConsent');
    consent.closest('.consent').classList.toggle('is-bad', !consent.checked);
    if (!consent.checked) { setStatus(t('needConsent'), 'bad'); goTo(stepOf(consent)); consent.focus(); return false; }
    if (!files.some((f) => f.state === 'ok' && !f.sample)) { setStatus(t('needFile'), 'bad'); goTo(1); input.focus(); return false; }
    if (!photosDone()) { goTo(2); needPhotos(); return false; }
    return true;
  }

  function summary() {
    const L = t('fields'), d = new FormData(form);
    const rows = [
      [L.role, d.get('role') === 'praxis' ? L.praxis : L.privat],
      d.get('role') === 'praxis' ? [L.practice, d.get('practice')] : null,
      [L.name, d.get('name')], [L.email, d.get('email')], [L.phone, d.get('phone')],
      [L.street, d.get('street')], [L.zip, d.get('zip')], [L.city, d.get('city')], [L.country, d.get('country')],
      [L.arch, d.getAll('arch[]').join(', ')], [L.note, d.get('note')],
    ].filter((r) => r && r[1]);
    const names = files.filter((f) => f.state === 'ok' && !f.sample).map((f) => `- ${f.name}`).join('\n');
    return `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${t('mailFiles')}:\n${names}`;
  }

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
    if (e.target.id === 'fConsent') e.target.closest('.consent').classList.remove('is-bad');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // on phones, Enter in an earlier step moves on instead of sending
    if (stepped.matches && step < STEPS) { next(); return; }
    if (!check()) return;
    if (!ORDER_ENDPOINT) {
      setStatus(t('noEndpoint'), '');
      const a = document.createElement('a');
      a.href = `mailto:info@aixsmile.de?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(summary())}`;
      a.textContent = t('openMail');
      status.append(' ', a);
      return;
    }
    send.disabled = true;
    setStatus(t('sending')(0), '');
    sendOrder()
      .then(() => {
        setStatus(t('sent'), 'good');
        form.reset(); syncRole();
        files.splice(0); active = null; viewer?.clear(); viewerBox.hidden = true; render();
        shots.forEach((sh) => setPhoto(sh, null)); goTo(1, { scroll: false });
      })
      .catch((err) => { console.error('[order]', err); setStatus(t('failed'), 'bad'); })
      .finally(() => { send.disabled = false; });
  });

  /** "Mein Scan (1).stl" → "1-Mein_Scan_1_.stl": the server only signs plain names. */
  function safeName(name, i) {
    const dot = name.lastIndexOf('.');
    const ext = name.slice(dot).toLowerCase();
    const base = name.slice(0, dot).replace(/[^A-Za-z0-9._ -]/g, '_').slice(0, 100) || 'scan';
    return `${i + 1}-${base}${ext}`;
  }

  async function sendOrder() {
    const { uploadPresigned } = await import('./vendor/blob-upload.js');
    const id = crypto.randomUUID();
    const todo = files.filter((f) => f.state === 'ok' && !f.sample);
    const shotsTodo = PHOTO_SLOTS.filter((k) => photos[k]).map((k) => ({ slot: k, file: photos[k] }));
    const total = todo.reduce((n, f) => n + f.size, 0) + shotsTodo.reduce((n, p) => n + p.file.size, 0) || 1;
    let done = 0;
    const pathnames = [];
    for (const [i, f] of todo.entries()) {
      const pathname = `scans/${id}/${safeName(f.name, i)}`;
      await uploadPresigned(pathname, f.file, {
        access: 'private',
        handleUploadUrl: UPLOAD_ENDPOINT,
        contentType: 'application/octet-stream',
        multipart: f.size > MULTIPART_FROM,
        onUploadProgress: (ev) => setStatus(t('sending')(Math.min(99, Math.round(((done + ev.loaded) / total) * 100))), ''),
      });
      done += f.size;
      pathnames.push(pathname);
    }
    const photoPaths = [];
    for (const p of shotsTodo) {
      const m = PHOTO_EXT.exec(p.file.name);
      const ext = m ? m[1].toLowerCase() : (p.file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const pathname = `scans/${id}/photo-${p.slot}.${ext}`;
      await uploadPresigned(pathname, p.file, {
        access: 'private',
        handleUploadUrl: UPLOAD_ENDPOINT,
        contentType: 'application/octet-stream',
        multipart: false,
        onUploadProgress: (ev) => setStatus(t('sending')(Math.min(99, Math.round(((done + ev.loaded) / total) * 100))), ''),
      });
      done += p.file.size;
      photoPaths.push(pathname);
    }
    const d = new FormData(form);
    const res = await fetch(ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        role: d.get('role'), practice: d.get('practice'), name: d.get('name'), email: d.get('email'),
        phone: d.get('phone'), street: d.get('street'), zip: d.get('zip'), city: d.get('city'),
        country: d.get('country'), arches: d.getAll('arch[]'), note: d.get('note'),
        consent: d.get('consent') !== null, files: pathnames, photos: photoPaths, locale: getLang(),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
  }
}
