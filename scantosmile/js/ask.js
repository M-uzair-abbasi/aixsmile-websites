// ===== Contact: a question to the practice =====
// Posted as JSON to API_BASE/api/public/inquiry; it lands in the aixsmile.de
// admin under Aligner-Scans → Anfragen, where the practice replies by email.
import { t, getLang } from './i18n.js';
import { API_BASE } from './order.js';

const ENDPOINT = `${API_BASE}/api/public/inquiry/`;
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function initAsk() {
  const form = document.getElementById('askForm');
  if (!form) return;
  const status = document.getElementById('askStatus'), send = document.getElementById('askSend');
  const say = (msg, kind) => { status.textContent = msg; status.className = 'order__status' + (kind ? ` is-${kind}` : ''); };

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
    if (e.target.id === 'aConsent') e.target.closest('.consent').classList.remove('is-bad');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let first = null;
    for (const id of ['aName', 'aEmail', 'aMessage']) {
      const el = document.getElementById(id);
      const v = el.value.trim();
      const bad = !v || (id === 'aEmail' && !EMAIL.test(v)) || (id === 'aMessage' && v.length < 2);
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !first) first = el;
    }
    if (first) { say(t('askNeed'), 'bad'); first.focus(); return; }
    const consent = document.getElementById('aConsent');
    consent.closest('.consent').classList.toggle('is-bad', !consent.checked);
    if (!consent.checked) { say(t('askConsent'), 'bad'); consent.focus(); return; }

    const d = new FormData(form);
    send.disabled = true;
    say(t('askSending'), '');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.get('name'), email: d.get('email'), message: d.get('message'),
          website: d.get('website'), consent: true, locale: getLang(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) { say(t('askRate'), 'bad'); return; }
      if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
      form.reset();
      say(t('askSent'), 'good');
    } catch (err) {
      console.error('[ask]', err);
      say(t('askFailed'), 'bad');
    } finally {
      send.disabled = false;
    }
  });
}
