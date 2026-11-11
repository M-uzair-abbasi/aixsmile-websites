// Legal pages: the DE/EN switch only. German is in the markup; English comes
// from the [data-en] attribute on each element. Remembers the choice the same
// way the main page does (localStorage key aixsmileLang).
const KEY = 'aixsmileLang';
const toggle = document.getElementById('langToggle');
const all = () => Array.from(document.querySelectorAll('[data-en]'));
const de = new Map();
all().forEach((el) => de.set(el, el.innerHTML));
function apply(lang) {
  document.documentElement.lang = lang;
  all().forEach((el) => { el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : de.get(el); });
  document.title = lang === 'en' ? document.body.dataset.titleEn : document.body.dataset.titleDe;
  if (toggle) toggle.setAttribute('data-active', lang);
  try { localStorage.setItem(KEY, lang); } catch { /* fine */ }
}
let lang = 'de';
try { if (localStorage.getItem(KEY) === 'en') lang = 'en'; } catch { /* fine */ }
if (toggle) toggle.addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; apply(lang); });
if (lang === 'en') apply('en');
