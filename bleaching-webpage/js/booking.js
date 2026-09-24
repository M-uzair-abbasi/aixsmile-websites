// ===== Embedded booking (Option B) =====
// Three steps against the practice's booking API, the same system behind
// aixsmile.de/termin: pick a slot, enter details, confirmation. This page
// stores nothing; the API validates everything again on its side.
//
// CONTRACT: the API fields are only ever added to, never renamed. If the slots
// request fails, the widget shows the plain aixsmile.de link instead.
import { dyn, getLang, onLangChange } from './i18n.js';

// Until the aixsmile.de cutover the app lives on its Vercel URL. After the
// cutover this becomes 'https://aixsmile.de'. One line to change.
let API_BASE = 'https://aixsmile.de';
// Local development only: ?api=http://localhost:3000 points the widget at a
// dev server of the main app (whose local database is not the live one).
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  const o = new URLSearchParams(location.search).get('api');
  if (o && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) API_BASE = o;
}
const SERVICE = 'bleaching';
const VIA = 'bleaching-aachen';

// The API's own rules (lib/booking/submit.ts in the main app), checked here too
// so a rejected field gets a specific message instead of a generic one.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s'\u2019.-]{0,79}$/u;
const PHONE_RE = /^[\d\s+()\/.-]{5,40}$/;
const EMAIL_RE = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const $ = (id) => document.getElementById(id);
const form = $('bkForm');

if (form) {
  const T = () => dyn().bk;
  let data = null;
  let days = [];
  let date = '';
  let time = '';
  let len = 30;
  let gender = '';
  let existing = '';
  let step = 1;
  let busy = false;

  const parts = (key) => {
    const p = key.split('-');
    return { y: +p[0], m: +p[1], d: +p[2], dow: new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay() };
  };
  const longDate = (key) => { const t = T(), p = parts(key); return `${t.weekdaysLong[p.dow]}, ${p.d}. ${t.monthsLong[p.m - 1]}`; };
  const shortDate = (key) => { const t = T(), p = parts(key); return `${t.weekdays[p.dow]}, ${p.d}. ${t.months[p.m - 1]}`; };
  const slotsFor = (day) => day.slots.filter((s) => Array.isArray(s.services) && s.services.indexOf(SERVICE) !== -1);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  // ---- stepper ----
  function setStep(n) {
    step = n;
    [1, 2, 3].forEach((k) => {
      const li = $('bkSteps').querySelector(`[data-step="${k}"]`);
      li.classList.toggle('on', k === n);
      li.classList.toggle('done', k < n);
      $(`bkPane${k}`).hidden = k !== n;
    });
    if (n > 1) form.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // ---- step 1: day and time ----
  function renderDays() {
    const t = T(), box = $('bkDays');
    box.innerHTML = '';
    $('bkNoDays').hidden = days.length > 0;
    box.hidden = days.length === 0;
    if (!days.length) { $('bkMonth').textContent = ''; return; }
    const seen = {};
    days.forEach((d) => {
      const p = parts(d.date), n = slotsFor(d).length;
      const b = el('button', 'day');
      b.type = 'button';
      b.setAttribute('aria-pressed', d.date === date ? 'true' : 'false');
      b.setAttribute('aria-label', `${longDate(d.date)}, ${t.nTimes(n)}`);
      b.appendChild(el('small', null, t.weekdays[p.dow]));
      b.appendChild(el('b', null, String(p.d)));
      b.appendChild(el('span', null, t.months[p.m - 1]));
      b.addEventListener('click', () => {
        date = d.date; time = '';
        $('bkTaken').hidden = true;
        renderDays(); renderTimes();
        const sel = $('bkDays').querySelector('[aria-pressed="true"]');
        if (sel) sel.scrollIntoView({ inline: 'nearest', block: 'nearest' });
      });
      box.appendChild(b);
      const mk = `${p.y}-${p.m}`;
      if (!seen[mk]) seen[mk] = `${t.monthsLong[p.m - 1]} ${p.y}`;
    });
    $('bkMonth').textContent = Object.keys(seen).map((k) => seen[k]).join(' · ');
  }

  function renderTimes() {
    const day = days.filter((d) => d.date === date)[0];
    $('bkTimesWrap').hidden = !day;
    if (!day) return;
    const am = $('bkAm'), pm = $('bkPm');
    am.querySelector('.timeGrid').innerHTML = '';
    pm.querySelector('.timeGrid').innerHTML = '';
    let nAm = 0, nPm = 0;
    slotsFor(day).forEach((s) => {
      const b = el('button', 'time', s.time);
      b.type = 'button';
      b.setAttribute('aria-pressed', s.time === time ? 'true' : 'false');
      b.addEventListener('click', () => { time = s.time; len = s.len || 30; renderTimes(); goStep2(); });
      if (+s.time.slice(0, 2) < 12) { am.querySelector('.timeGrid').appendChild(b); nAm++; }
      else { pm.querySelector('.timeGrid').appendChild(b); nPm++; }
    });
    am.hidden = !nAm;
    pm.hidden = !nPm;
  }

  // ---- step 2: details ----
  function renderPick() {
    const t = T();
    $('bkPickWhen').textContent = t.when(shortDate(date), time);
    $('bkPickWhat').textContent = `${t.service} · ${t.mins(len)}`;
  }
  function goStep2() {
    $('bkTaken').hidden = true; // a new time is picked: the old notice no longer applies
    renderPick();
    setStep(2);
    setTimeout(() => { const g = $('bkGender').querySelector('button'); if (g && !gender) g.focus({ preventScroll: true }); }, 380);
  }
  function renderSeg(id, opts, current, set) {
    const box = $(id);
    box.innerHTML = '';
    opts.forEach((o) => {
      const b = el('button', null, o[1]);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', current === o[0] ? 'true' : 'false');
      b.addEventListener('click', () => { set(o[0]); renderStatic(); });
      box.appendChild(b);
    });
  }
  function renderStatic() {
    const t = T();
    renderSeg('bkGender', t.genders, gender, (v) => { gender = v; });
    renderSeg('bkExisting', t.existingOpts, existing, (v) => { existing = v; });
    if (data && data.consent && data.consent.text) {
      $('bkConsentText').textContent = data.consent.text[getLang()] || data.consent.text.de;
    }
    if (!busy) $('bkSubmit').textContent = t.submit;
    renderDays();
    renderTimes();
    if (date && time) { renderPick(); renderDone(); }
  }

  $('bkChange').addEventListener('click', () => { $('bkTaken').hidden = true; setStep(1); });
  $('bkNoteToggle').addEventListener('click', () => {
    $('bkNoteWrap').hidden = false;
    $('bkNoteToggle').hidden = true;
    $('bkNote').focus();
  });

  function showError(msg) {
    const e = $('bkError');
    e.textContent = msg || '';
    e.hidden = !msg;
    if (msg) e.scrollIntoView({ block: 'nearest' });
  }
  const mark = (id, bad) => $(id).classList.toggle('bad', !!bad);

  // ---- step 3: done ----
  const pad = (n) => (n < 10 ? '0' : '') + n;
  function renderDone() {
    const t = T();
    $('bkDoneWhen').textContent = t.when(longDate(date), time);
    $('bkDoneWhat').textContent = `${t.service} · ${t.mins(len)}`;
    // .ics for the phone's calendar: wall-clock time in Europe/Berlin
    const p = parts(date), hh = +time.slice(0, 2), mm = +time.slice(3, 5);
    const day = `${p.y}${pad(p.m)}${pad(p.d)}`;
    const endMin = hh * 60 + mm + len;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AIXSMILE//Termin//DE', 'BEGIN:VEVENT',
      `UID:${date}-${time.replace(':', '')}@bleaching-aachen`,
      `DTSTART;TZID=Europe/Berlin:${day}T${pad(hh)}${pad(mm)}00`,
      `DTEND;TZID=Europe/Berlin:${day}T${pad(Math.floor(endMin / 60))}${pad(endMin % 60)}00`,
      `SUMMARY:${t.icsSummary}`,
      'LOCATION:Zahnarztpraxis AIXSMILE\\, Großkölnstraße 22–28\\, 52062 Aachen', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    $('bkIcs').href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }

  // ---- load the open days ----
  function load() {
    fetch(`${API_BASE}/api/public/slots/`, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((json) => {
        if (!json || !Array.isArray(json.days)) throw new Error('shape');
        data = json;
        days = json.days.filter((d) => Array.isArray(d.slots) && slotsFor(d).length > 0);
        if (date && !days.some((d) => d.date === date)) { date = ''; time = ''; }
        $('bkLoading').hidden = true;
        $('bkUnavailable').hidden = true;
        renderStatic();
        renderMini();
        if (step === 1) $('bkPane1').hidden = false;
      })
      .catch((e) => {
        console.warn('[booking] slots unavailable, showing the aixsmile.de link instead', e);
        data = { days: [] }; days = []; renderMini();
        $('bkLoading').hidden = true;
        $('bkUnavailable').hidden = false;
      });
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (busy) return;
    showError('');
    const t = T();
    const first = $('bkFirst').value.trim(), last = $('bkLast').value.trim();
    const phone = $('bkPhone').value.trim(), email = $('bkEmail').value.trim();
    mark('bkFirst', !first); mark('bkLast', !last); mark('bkPhone', !phone); mark('bkEmail', !email);
    if (!date || !time || !first || !last || !phone || !email || !gender) return showError(t.errRequired);
    const collapse = (v) => v.replace(/\s+/g, ' ');
    const badFirst = !NAME_RE.test(collapse(first)), badLast = !NAME_RE.test(collapse(last));
    if (badFirst || badLast) { mark('bkFirst', badFirst); mark('bkLast', badLast); return showError(t.errName); }
    if (!PHONE_RE.test(phone)) { mark('bkPhone', true); return showError(t.errPhone); }
    if (!EMAIL_RE.test(email)) { mark('bkEmail', true); return showError(t.errEmail); }
    if (!$('bkConsent').checked) return showError(t.errConsent);
    const btn = $('bkSubmit');
    busy = true;
    btn.disabled = true;
    btn.textContent = t.submitting;
    fetch(`${API_BASE}/api/public/book/`, {
      method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date, time, firstName: first, lastName: last, phone, email,
        gender, existingPatient: existing, service: SERVICE, note: $('bkNote').value,
        consent: true, consentVersion: data && data.consent ? data.consent.version : null, locale: getLang(),
        via: VIA, website: form.elements.website.value,
      }),
    })
      .then((r) => r.json().then((j) => ({ status: r.status, body: j })))
      .then((res) => {
        if (res.body && res.body.ok) { renderDone(); setStep(3); return; }
        const err = res.body && res.body.error;
        if (err === 'taken' || err === 'past' || err === 'invalid_slot' || err === 'invalid_service') {
          // the slot went while the form was being filled: back to the calendar,
          // fresh slots, and say why
          time = '';
          setStep(1);
          $('bkTaken').hidden = false;
          load();
        } else if (err === 'rate_limited') showError(t.errRate);
        else if (err === 'limit') showError(t.errLimit);
        else if (err === 'validation') showError(t.errCheck);
        else showError(t.errGeneric);
      })
      .catch(() => showError(T().errGeneric))
      .then(() => { busy = false; btn.disabled = false; btn.textContent = T().submit; });
  });

  // ---- the small calendar in the practice band: next days and their times,
  // a tap lands on step 2 of the widget with that slot picked ----
  const miniBox = $('miniSlots'), miniBtn = $('miniToggle');
  function renderMini() {
    if (!miniBox || miniBox.hidden) return;
    const t = T(), m = dyn().mini;
    miniBox.innerHTML = '';
    if (!data) { miniBox.appendChild(el('p', 'miniMore', m.loading)); return; }
    if (!days.length) { miniBox.appendChild(el('p', 'miniMore', m.none)); return; }
    days.slice(0, 3).forEach((d) => {
      const box = el('div', 'miniDay');
      box.appendChild(el('b', null, longDate(d.date)));
      const row = el('div', 'miniTimes');
      slotsFor(d).slice(0, 6).forEach((s) => {
        const btn = el('button', null, s.time);
        btn.type = 'button';
        btn.addEventListener('click', () => {
          date = d.date; time = s.time; len = s.len || 30;
          renderDays(); renderTimes(); goStep2();
        });
        row.appendChild(btn);
      });
      box.appendChild(row);
      miniBox.appendChild(box);
    });
    const more = el('p', 'miniMore');
    const link = el('a', null, m.more);
    link.href = '#buchen';
    more.appendChild(link);
    miniBox.appendChild(more);
  }
  if (miniBtn && miniBox) {
    const label = () => { const open = !miniBox.hidden; miniBtn.textContent = open ? dyn().mini.hide : (getLang() === 'en' ? 'See open appointments' : 'Freie Termine ansehen'); miniBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    miniBtn.addEventListener('click', () => { miniBox.hidden = !miniBox.hidden; renderMini(); label(); });
    onLangChange(() => { renderMini(); label(); });
  }

  onLangChange(renderStatic);
  load();

  // exposed for the check tools only
  window.__booking = { get apiBase() { return API_BASE; }, SERVICE, VIA };
}

// The map tile opens the visitor's own maps app: Apple Maps on Apple devices,
// Google Maps everywhere else. Plain link either way, nothing is loaded here.
const mapTile = document.getElementById('mapTile');
if (mapTile && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
  mapTile.href = 'https://maps.apple.com/?q=Zahnarztpraxis%20AIXSMILE&address=Gro%C3%9Fk%C3%B6lnstra%C3%9Fe%2022-28%2C%2052062%20Aachen&ll=50.7768518,6.085097';
}
