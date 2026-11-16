// ===== Language =====
// German lives in index.html (crawlers and visitors without JavaScript read
// it). English lives next to it on each element:
//   data-en        replaces the element's HTML
//   data-en-label  replaces aria-label
//   data-en-alt    replaces alt
// On load the German of every such element is remembered, so switching
// back restores it exactly. DYN holds the strings scripts build at runtime.
// The choice is remembered across the AIXSMILE pages (localStorage key
// aixsmileLang, like the other satellites).

const KEY = 'aixsmileLang';
const TITLE = {
  de: 'Scan to Smile: Aligner aus Ihrem Scan, gefertigt in Aachen | AIXSMILE',
  en: 'Scan to Smile: aligners from your scan, made in Aachen | AIXSMILE',
};

export const DYN = {
  de: {
    hud: ['oberkiefer.stl · 38.621 △ · 1,9 MB', 'Geprüft · Zahnarzt N. Molaie', 'Tiefziehen · Schiene 01', 'Fertig · nur für Sie'],
    reading: 'wird gelesen …',
    tris: 'Dreiecke',
    points: 'Punkte',
    size: 'Größe',
    sample: 'Beispiel · wird nicht gesendet',
    badFormat: 'Format nicht unterstützt',
    badSize: 'größer als 100 MB',
    badRead: 'Datei nicht lesbar',
    tooMany: 'Höchstens 6 Dateien auf einmal.',
    remove: 'entfernen',
    show: 'in der Vorschau zeigen',
    needFile: 'Bitte laden Sie mindestens eine Scan-Datei hoch.',
    needFields: 'Bitte füllen Sie die markierten Felder aus.',
    needConsent: 'Bitte bestätigen Sie die Einwilligung zur Verarbeitung Ihrer Scan-Daten.',
    sending: (p) => `Wird gesendet … ${p} %`,
    sent: 'Danke! Ihr Scan ist angekommen. Wir melden uns per E-Mail.',
    failed: 'Das Senden hat nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie uns an info@aixsmile.de.',
    noEndpoint: 'Das Hochladen direkt über die Seite wird gerade eingerichtet. Bis dahin: Schicken Sie Ihre Scan-Dateien bitte per E-Mail an info@aixsmile.de.',
    openMail: 'E-Mail mit Ihren Angaben öffnen',
    mailSubject: 'Scan to Smile: neuer Scan',
    mailFiles: 'Dateien und vier Gesichtsfotos (bitte anhängen)',
    steps: ['Scan', 'Fotos', 'Kontakt', 'Lieferung'],
    askNeed: 'Bitte füllen Sie Name, E-Mail und Nachricht aus.',
    askConsent: 'Bitte bestätigen Sie die Einwilligung.',
    askSending: 'Wird gesendet …',
    askSent: 'Danke! Ihre Nachricht ist angekommen. Wir antworten Ihnen per E-Mail.',
    askRate: 'Sie haben gerade schon geschrieben. Bitte versuchen Sie es in ein paar Minuten noch einmal.',
    askFailed: 'Das Senden hat nicht geklappt. Bitte schreiben Sie uns direkt an info@aixsmile.de.',
    needPhotos: 'Bitte fügen Sie alle vier Fotos hinzu: vorne und seitlich, jeweils lächelnd und mit offenem Mund.',
    badPhoto: 'Bitte ein Foto als JPG, PNG, WEBP oder HEIC, bis 25 MB.',
    stepOf: (n, m) => `${n}/${m}`,
    fields: { role: 'Ich bin', praxis: 'Zahnarztpraxis', privat: 'Privatperson', practice: 'Praxis', name: 'Name', email: 'E-Mail', phone: 'Telefon', street: 'Straße', zip: 'PLZ', city: 'Ort', country: 'Land', arch: 'Schienen für', note: 'Nachricht' },
  },
  en: {
    hud: ['upper-jaw.stl · 38,621 △ · 1.9 MB', 'Checked · dentist N. Molaie', 'Thermoforming · aligner 01', 'Done · only yours'],
    reading: 'reading …',
    tris: 'triangles',
    points: 'points',
    size: 'Size',
    sample: 'Example · not sent',
    badFormat: 'format not supported',
    badSize: 'larger than 100 MB',
    badRead: 'file can’t be read',
    tooMany: 'Six files at most at a time.',
    remove: 'remove',
    show: 'show in preview',
    needFile: 'Please upload at least one scan file.',
    needFields: 'Please fill in the marked fields.',
    needConsent: 'Please confirm your consent to processing your scan data.',
    sending: (p) => `Sending … ${p} %`,
    sent: 'Thank you! Your scan has arrived. We’ll be in touch by email.',
    failed: 'Sending didn’t work. Please try again or write to us at info@aixsmile.de.',
    noEndpoint: 'Uploading directly on the page is being set up. Until then, please send your scan files by email to info@aixsmile.de.',
    openMail: 'Open an email with your details',
    mailSubject: 'Scan to Smile: new scan',
    mailFiles: 'Files and four face photos (please attach)',
    steps: ['Scan', 'Photos', 'Contact', 'Delivery'],
    askNeed: 'Please fill in your name, email and message.',
    askConsent: 'Please confirm your consent.',
    askSending: 'Sending …',
    askSent: 'Thank you! Your message has arrived. We’ll answer you by email.',
    askRate: 'You’ve just written to us. Please try again in a few minutes.',
    askFailed: 'Sending didn’t work. Please write to us directly at info@aixsmile.de.',
    needPhotos: 'Please add all four photos: front and side, each smiling and with the mouth open.',
    badPhoto: 'Please pick a JPG, PNG, WEBP or HEIC photo, up to 25 MB.',
    stepOf: (n, m) => `${n}/${m}`,
    fields: { role: 'I am', praxis: 'Dental practice', privat: 'Private person', practice: 'Practice', name: 'Name', email: 'Email', phone: 'Phone', street: 'Street', zip: 'Postcode', city: 'Town', country: 'Country', arch: 'Aligners for', note: 'Message' },
  },
};

let lang = 'de';
const listeners = new Set();
const remembered = new Map();   // element → { html, label, alt }

export const getLang = () => lang;
export const t = (k) => DYN[lang][k];
export function onLang(fn) { listeners.add(fn); }

function capture(root = document) {
  root.querySelectorAll('[data-en], [data-en-label], [data-en-alt]').forEach((el) => {
    if (remembered.has(el)) return;
    remembered.set(el, {
      html: el.hasAttribute('data-en') ? el.innerHTML : null,
      label: el.getAttribute('aria-label'),
      alt: el.getAttribute('alt'),
    });
  });
}

export function applyLang(next) {
  lang = next === 'en' ? 'en' : 'de';
  capture();
  const en = lang === 'en';
  for (const [el, de] of remembered) {
    if (de.html !== null) el.innerHTML = en ? el.getAttribute('data-en') : de.html;
    if (el.hasAttribute('data-en-label')) el.setAttribute('aria-label', en ? el.getAttribute('data-en-label') : de.label);
    if (el.hasAttribute('data-en-alt')) el.setAttribute('alt', en ? el.getAttribute('data-en-alt') : de.alt);
  }
  document.documentElement.lang = lang;
  document.title = TITLE[lang];
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.setAttribute('data-active', lang);
  try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(lang));
}

export function initLang() {
  capture();
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch { /* private mode */ }
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', () => applyLang(lang === 'de' ? 'en' : 'de'));
  if (stored === 'en') applyLang('en');
}
