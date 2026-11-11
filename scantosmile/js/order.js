// ===== Order: drop the scan, see it in 3D, send it =====
// Files are read and shown in the browser (js/stage.js → createViewer,
// parseScan); nothing leaves the page until the form is sent.
//
// ORDER_ENDPOINT: where the form goes, as multipart/form-data (fields +
// files under "scans"). The practice has not chosen a receiver yet (email
// service, the main site's API or file storage): while it is null the form
// checks everything and then offers an email with the visitor's details
// filled in, and asks them to attach the files there.
import { t, onLang, getLang } from './i18n.js';

export const ORDER_ENDPOINT = null;
const MAX_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 6;
const OK_EXT = /\.(stl|ply|obj)$/i;
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

  onLang(() => { render(); if (active) showStats(active); });

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
      if (bad && ok) { ok = false; el.focus(); }
    }
    if (!ok) { setStatus(t('needFields'), 'bad'); return false; }
    const consent = $('#fConsent');
    consent.closest('.consent').classList.toggle('is-bad', !consent.checked);
    if (!consent.checked) { setStatus(t('needConsent'), 'bad'); consent.focus(); return false; }
    if (!files.some((f) => f.state === 'ok' && !f.sample)) { setStatus(t('needFile'), 'bad'); input.focus(); return false; }
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
    if (!check()) return;
    if (!ORDER_ENDPOINT) {
      setStatus(t('noEndpoint'), '');
      const a = document.createElement('a');
      a.href = `mailto:info@aixsmile.de?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(summary())}`;
      a.textContent = t('openMail');
      status.append(' ', a);
      return;
    }
    const data = new FormData(form);
    data.delete('scans');
    files.filter((f) => f.state === 'ok' && !f.sample).forEach((f) => data.append('scans', f.file, f.name));
    data.append('lang', getLang());
    send.disabled = true;
    setStatus(t('sending')(0), '');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', ORDER_ENDPOINT);
    xhr.upload.addEventListener('progress', (ev) => { if (ev.lengthComputable) setStatus(t('sending')(Math.round((ev.loaded / ev.total) * 100)), ''); });
    xhr.addEventListener('load', () => {
      send.disabled = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus(t('sent'), 'good');
        form.reset(); syncRole();
        files.splice(0); active = null; viewer?.clear(); viewerBox.hidden = true; render();
      } else setStatus(t('failed'), 'bad');
    });
    xhr.addEventListener('error', () => { send.disabled = false; setStatus(t('failed'), 'bad'); });
    xhr.send(data);
  });
}
