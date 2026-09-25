// ===== Language =====
// German is the page's own language and lives in index.html, where crawlers and
// visitors without JavaScript read it. On load this module remembers the German
// text of every [data-i18n] element; English comes from EN below. Switching back
// to German restores what was remembered, so the two can never drift apart.
//
// DYN holds the strings that scripts build at runtime (the booking widget and
// the price line). Those exist in both languages here.

// A price-from figure for the Kosten band. The practice has not supplied one:
// leave it null and no price is shown. A number (e.g. 290) shows one line,
// worded in DYN.*.kosten.priceFrom, in both languages.
export const PRICE_FROM = null;

const STORAGE_KEY = 'aixsmileLang';

export const EN = {
  skip: 'Skip to content',
  nav: {
    home: 'AIXSMILE – back to top', book: 'Book a consultation', call: 'Call: 0241 31202',
    sections: 'Page sections', wann: 'When it helps', ablauf: 'Process', faelle: 'Before/after', kosten: 'Costs', faq: 'Questions',
  },
  ai: { tag: 'AI-generated', symbol: 'AI-generated · illustration' },
  hero: {
    eyebrow: 'Teeth whitening in Aachen · AIXSMILE',
    h1: 'Measure the shade, then whiten.',
    lead: 'We read your tooth shade against a shade guide before the whitening and once more afterwards. So you see in black and white what changed, not just in the mirror.',
    trustAria: 'In short',
    t1: 'First visit billed to your health insurance',
    t2: 'Written cost plan',
    t3: 'Deutsch · English · فارسی · Türkçe · العربية',
    stageAlt: 'A 3D model of a set of teeth, clearly yellowish. The slider below takes you through a whitening step by step.',
    shadeLabel: 'Shade',
    stageTag: 'Illustration · not a treatment result',
    rangeAria: 'Whitening, step by step, on the 3D model',
    caseB: 'A real case from our practice',
    caseS: 'See before and after',
    caseAlt: 'Case 1 from our practice: before on the left, after on the right',
  },
  when: {
    eyebrow: 'When whitening helps',
    h2: 'Not every discolouration is the same.',
    lede: 'Where the colour comes from decides how well it lightens. Which cause applies to you, we find out at the examination.',
    goodH: 'Responds well',
    limitH: 'Reaches its limits',
    t1: 'Yellowish from coffee and tea',
    p1: 'The most common discolouration, and the one that responds best. The pigments sit inside the tooth and can be lightened.',
    a1: 'Close-up of yellowish discoloured teeth (AI-generated illustration)',
    t2: 'Darkened over the years',
    p2: 'Teeth get darker and more yellow with age. Whitening usually lightens these deposits well too.',
    a2: 'Close-up of teeth that have darkened with age (AI-generated illustration)',
    t3: 'Stains from smoking',
    p3: 'A cleaning removes the deposits on the surface, whitening what is stored inside the tooth. The two together work best.',
    a3: 'Close-up of brownish stains from smoking (AI-generated illustration)',
    t4: 'Grey, often from medication',
    p4: 'Grey or banded discolouration, for example after certain antibiotics in childhood, lightens more modestly and less evenly.',
    a4: 'Close-up of greyish, banded discoloured teeth (AI-generated illustration)',
    t5: 'A single dark tooth',
    p5: 'Often after a root canal treatment. Whitening from the outside helps little here; we discuss with you which approach fits.',
    a5: 'Close-up where one front tooth is clearly darker than the others (AI-generated illustration)',
    t6: 'Fillings, crowns and veneers',
    p6: 'They keep their colour. If they sit at the front, we plan from the start whether they are matched after whitening.',
    a6: 'Close-up where a crown has a different shade from the neighbouring teeth (AI-generated illustration)',
  },
  s2: {
    eyebrow: 'Measuring',
    h2: 'A shade guide instead of an impression.',
    photoAlt: 'A gloved hand holds a shade-guide sample tooth next to the front teeth (AI-generated image)',
    cardAria: 'The shade guide we measure with',
    cardH: 'How we measure your white',
    cardP: 'We hold sample teeth with codes such as A2 or BL3 next to yours. The letter stands for the hue, the number for the gradation. One value before, one value after.',
    scaleAria: 'Simplified shade guide with eight sample teeth, from A3 to BL1',
    darker: '← darker',
    lighter: 'lighter →',
    scaleNote: 'Simplified. The real guide has more steps; we measure in the mouth, in daylight.',
    stripAlt: 'The same smile three times side by side; only the tooth shade changes, from A3 through A1 to BL3 (AI-generated illustration)',
    stripNote: '<b>Illustration, not a treatment result.</b> It shows roughly how three steps on the guide differ. How many steps are possible for your teeth only the examination shows.',
  },
  steps: {
    eyebrow: 'Process',
    alt: 'Whitening gel being applied to the front teeth, with the gums covered (AI-generated image)',
    h2: 'Four steps, and a new number at the end.',
    t1: 'Check first, then whiten',
    p1: 'The examination comes before the gel, and a professional cleaning always comes before that. We treat decay, leaking fillings or exposed tooth necks first. Fillings, crowns and veneers do not lighten; if they sit in the visible area, we plan for them from the start.',
    t2: 'An honest target',
    p2: 'How light a tooth can become is up to the tooth: starting shade, enamel thickness, the kind of discolouration. Yellowish tones usually respond well, grey ones much more modestly. We make no promise in steps, but you learn beforehand what is realistic.',
    t3: 'Whitening, under control',
    p3: 'A protective layer covers the gums, then the gel goes onto the teeth and works in a controlled way, often in several rounds. Concentration and contact time are set by the practice, not by a package leaflet. It should not hurt; brief sensitivity to cold usually passes within a few days.',
    t4: 'Measuring again',
    p4: 'The same guide, the same teeth, a new number. Straight afterwards, teeth often look a little lighter than they will stay; after one to two weeks the shade has settled. How long it lasts depends mostly on coffee, tea, red wine and smoking; usually one to three years.',
  },
  routes: {
    eyebrow: 'Two routes',
    h2: 'In the practice or at home.',
    lede: 'Both routes lighten; they differ in pace and dosage. Which one suits you, we clarify in the consultation.',
    alt1: 'A person in the treatment chair wearing protective glasses, the whitening light in front (AI-generated image)',
    m1: 'One appointment · supervised',
    t1: 'In the practice',
    p1: 'A more concentrated gel, applied and monitored by us. For anyone who wants to see the result the same day.',
    alt2: 'A hand holding clear whitening trays and a small gel syringe (AI-generated image)',
    m2: 'Several days · at home',
    t2: 'At home, with trays',
    p2: 'From an impression we make thin trays for your teeth. You wear a milder gel in them over several days. It takes longer and is often gentler on sensitive teeth.',
  },
  ba: {
    eyebrow: 'Before and after',
    h2: 'Two cases from our practice.',
    lede: 'Published with the patients’ consent. The photos were taken in everyday practice; light and camera were not identical before and after. That is why a photo never shows colour as precisely as the shade guide.',
    alt1: 'Case 1: the teeth before whitening at the top, afterwards below',
    alt2: 'Case 2: the teeth before whitening at the top, afterwards below',
    before: 'Before', after: 'After', case1: 'Case 1', case2: 'Case 2',
    cap1: 'Yellowish discolouration, whitened in the practice. Top: before treatment, bottom: after.',
    cap2: 'Front teeth darkened over the years, whitened in the practice. Top: before treatment, bottom: after.',
  },
  bk: {
    eyebrow: 'Appointment',
    h2: 'Consultation with shade check, book it right here.',
    p: 'Below are the times that are genuinely open at the practice right now. Pick one, leave your name and phone number, and the appointment is yours.',
    fact1: 'First visit billed to your health insurance, no extra cost',
    fact2: 'Written cost plan before any treatment',
    fact3: 'If something comes up, one click in the appointment email is enough',
    unavailable: 'The free slots cannot be loaded right now.', unavailableLink: 'Book on aixsmile.de instead.',
    step1: 'Slot', step2: 'Your details', step3: 'Booked',
    taken: 'Someone booked this time in the meantime. Please pick another one.',
    daysAria: 'Days', morning: 'Morning', afternoon: 'Afternoon',
    quickH: 'Fastest', calPrev: 'Previous month', calNext: 'Next month', calHint: 'Marked days have open times. Bookable up to six months ahead.',
    noDays: 'No time is open online at the moment. On the phone we usually still find one.',
    change: 'Change',
    first: 'First name *', last: 'Last name *', phone: 'Phone *', email: 'Email *',
    addNote: '+ Add a note', note: 'Note (optional)',
    privacy: 'What you enter goes straight to the AIXSMILE dental practice and serves this appointment alone. This page keeps no data of its own.',
    doneH: 'Booked. See you at the practice.',
    doneWhere: 'You come to Großkölnstraße 22–28, 52062 Aachen.',
    nextH: 'What happens next',
    next1: 'The appointment email is on its way with date, time and address.',
    next2: 'A short reminder arrives the day before.',
    next3: 'You can cancel any time via the link in the appointment email.',
    calendar: 'Save appointment', route: 'Way to the practice',
  },
  kosten: {
    eyebrow: 'Costs',
    h2: 'What whitening costs, and what that depends on.',
    p1: 'The first visit costs you nothing extra: for patients with statutory insurance, the examination and shade check count as a routine check-up and are billed to the health insurer; privately insured patients submit it as usual. You only pay for the whitening itself, as a private service under the GOZ fee scale.',
    p2: 'We give you an amount as soon as it is clear which route suits your teeth. These three points decide it:',
    f1k: 'Method', f1v: 'In the practice in one session, or at home with custom-made trays.',
    f2k: 'Preparation', f2v: 'The professional cleaning beforehand, and whether a small treatment is needed as well.',
    f3k: 'Starting point', f3v: 'How pronounced the discolouration is and how many teeth in the visible area are involved.',
    promiseH: 'How you get to your price',
    s1k: 'Examination and shade check', s1v: 'We look at your teeth and measure the starting shade. This visit goes through your health insurance.',
    s2k: 'Written cost plan', s2v: 'With every item listed, before anything is treated.',
    s3k: 'Your decision', s3v: 'You take the plan home and decide without time pressure.',
  },
  doctor: {
    eyebrow: 'Who treats you',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    p1: 'With us, whitening starts with an examination and a number on the shade guide, not with the gel. We tell you beforehand which result is realistic for your teeth, and we measure again afterwards.',
    p2: 'If whitening cannot reach your goal, for example because visible fillings or crowns will not lighten with it, we say so openly and show you what other options there are.',
    langs: 'Your consultation can be in German, English, Farsi, Turkish or Arabic, whichever you are most comfortable in.',
    btn: 'More about the practice',
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
  },
  faq: {
    eyebrow: 'Frequent questions',
    h2: 'What people often ask before whitening.',
    aside: 'Your question is not here? We are happy to answer it by phone or at the consultation.',
    q1: 'Does whitening damage the enamel?',
    a1: 'Not with healthy teeth and a gel dosed by a dentist. The enamel keeps its thickness; only the stored pigments change. That is exactly why we check beforehand whether decay, cracks or leaking fillings are in the way.',
    q2: 'How long does the result last?',
    a2: 'For most people one to three years. Anyone who drinks a lot of coffee, tea or red wine, or smokes, sees the old shade return sooner. A touch-up is then possible with little effort.',
    q3: 'Does whitening hurt?',
    a3: 'The treatment itself usually does not hurt. For a while the teeth may react more strongly to cold or twinge briefly. This usually passes within a few days; a fluoride toothpaste can help.',
    q4: 'Do fillings and crowns get lighter too?',
    a4: 'No. Composite fillings, crowns and veneers keep their colour. If they are in the visible area, it can make sense to match them to the new tooth shade after whitening. We discuss this with you beforehand.',
    q5: 'I have sensitive teeth. Can I still have whitening?',
    a5: 'Often yes, with an adapted approach: a milder gel, shorter contact times or a pre-treatment that makes the teeth less sensitive. Whether that is enough in your case, we clarify at the examination.',
    q6: 'Is whitening possible with receding gums?',
    a6: 'We decide that case by case. Exposed tooth necks react more sensitively and lighten differently from enamel. We look at these areas closely and protect them during the treatment.',
    q7: 'Whitening first or veneers first?',
    a7: 'If both are planned, whitening comes first. The shade of the veneers is then matched to the whitened neighbouring teeth. The other way round does not work, because whitening does not make a ceramic shell any lighter.',
    q8: 'In the practice or with trays at home?',
    a8: 'In the practice it is faster: one appointment, a more concentrated gel under supervision. With trays made from an impression of your teeth, you wear a milder gel at home over several days. Which route suits you depends on your teeth, your time and your sensitivity.',
    q9: 'How is the tooth shade determined?',
    a9: 'With a shade guide of sample teeth that we hold right next to your teeth in daylight. Each sample has a code. We record the value before and after the treatment, so the result stays comparable and does not depend on the light in a photo.',
    q10: 'Does the consultation cost anything?',
    a10: 'No. For patients with statutory insurance, the examination and shade check are a routine check-up billed to the health insurer; privately insured patients submit the visit as usual. Costs only arise once you decide on the whitening after seeing the written cost plan.',
  },
  praxis: {
    eyebrow: 'The practice',
    h2: 'On Großkölnstraße, right in the centre of Aachen.',
    mapAria: 'Map: Großkölnstraße 22–28, 52062 Aachen. Opens the route in your maps app',
    mapGo: 'Open route →',
    addrH: 'Address',
    addrP: 'Right in the city centre, a few minutes from the bus station and the market square. The Großkölnstraße car park is directly opposite.',
    hoursH: 'Consultation hours', hoursDays: 'Mon · Tue · Thu', hoursTime: '9:00 – 16:00', hoursNote: 'Appointment only.',
    slotsBtn: 'See open appointments',
    reviewsH: 'Reviews',
    reviewsP: 'What patients write about us is on Google: complete, unabridged and not selected by us.',
    reviewsBtn: 'To the Google reviews',
  },
  footer: {
    fax: 'Fax 0241 4018150',
    hours: 'Mon · Tue · Thu, 9:00 – 16:00',
    hoursNote: 'appointment only',
    langs: 'German, English, Farsi, Turkish, Arabic',
    linkBook: 'Consultation',
    linkMain: 'Whitening on aixsmile.de',
    impressum: 'Imprint',
    datenschutz: 'Privacy',
  },
  mbar: { aria: 'Quick access', book: 'Book a consultation' },
};

export const DYN = {
  de: {
    meta: {
      title: 'Bleaching Aachen – Ablauf, Farbbestimmung & Beratung | AIXSMILE',
      description: 'Bleaching in Aachen bei AIXSMILE: Zahnfarbe vorher und nachher mit der Farbskala gemessen, Ziel gemeinsam festgelegt. Ablauf, Kosten, echte Fälle, Termin online buchen.',
    },
    kosten: { priceFrom: (n) => `Bleaching in der Praxis ab ${n} €. Der genaue Betrag steht in Ihrem Kostenplan.` },
    stage: {
      num: (n, total) => `Schritt ${n} von ${total}`,
      steps: ['Ausgangsfarbe messen', 'Zahnfleisch schützen', 'Gel auftragen', 'Gel wirken lassen', 'Neue Farbe messen'],
      valueText: (n, total, step, shade) => `Schritt ${n} von ${total}: ${step}. Farbe ${shade}`,
    },
    mini: { hide: 'Ausblenden', none: 'Online ist gerade nichts frei. Rufen Sie uns an: 0241 31202', more: 'Alle Termine und Uhrzeiten', loading: 'Termine werden geladen …' },
    bk: {
      submit: 'Termin verbindlich buchen', submitting: 'Wird gebucht …',
      service: 'Bleaching-Beratung mit Farbbestimmung',
      icsSummary: 'Bleaching-Beratung – AIXSMILE',
      mins: (n) => `ca. ${n} Minuten`,
      when: (d, t) => `${d} · ${t} Uhr`,
      nTimes: (n) => (n === 1 ? '1 Zeit' : `${n} Zeiten`),
      quickNext: 'Nächster Termin', quickAm: 'Nächster Vormittag', quickPm: 'Nächster Nachmittag', timesFor: (d) => `Uhrzeiten am ${d}`,
      errRequired: 'Bitte füllen Sie die Pflichtfelder aus.',
      errEmail: 'Diese E-Mail-Adresse sieht unvollständig aus.',
      errName: 'Bitte tragen Sie Vor- und Nachnamen in Buchstaben ein, ohne Ziffern.',
      errPhone: 'Bitte prüfen Sie die Telefonnummer: nur Ziffern, Leerzeichen und + ( ) / . -',
      errCheck: 'Einige Angaben wurden nicht angenommen. Bitte prüfen Sie Name, Telefon und E-Mail.',
      errConsent: 'Bitte bestätigen Sie die Einwilligung zur Datenverarbeitung.',
      errRate: 'Zu viele Versuche in kurzer Zeit. Bitte warten Sie eine Minute.',
      errLimit: 'Mit diesen Kontaktdaten sind schon mehrere Termine vereinbart. Einen weiteren vergeben wir gern am Telefon.',
      errGeneric: 'Die Buchung ist nicht durchgegangen. Versuchen Sie es noch einmal oder buchen Sie auf aixsmile.de.',
      weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      weekdaysLong: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
      monthsLong: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    },
  },
  en: {
    meta: {
      title: 'Teeth whitening Aachen – process, shade check & consultation | AIXSMILE',
      description: 'Teeth whitening in Aachen at AIXSMILE: tooth shade measured with a shade guide before and after, target agreed together. Process, costs, real cases, book online.',
    },
    kosten: { priceFrom: (n) => `In-practice whitening from €${n}. The exact amount is in your cost plan.` },
    stage: {
      num: (n, total) => `Step ${n} of ${total}`,
      steps: ['Measure the starting shade', 'Protect the gums', 'Apply the gel', 'Let the gel work', 'Measure the new shade'],
      valueText: (n, total, step, shade) => `Step ${n} of ${total}: ${step}. Shade ${shade}`,
    },
    mini: { hide: 'Hide', none: 'Nothing is open online right now. Call us: 0241 31202', more: 'All days and times', loading: 'Loading appointments …' },
    bk: {
      submit: 'Book appointment', submitting: 'Booking …',
      service: 'Whitening consultation with shade check',
      icsSummary: 'Whitening consultation – AIXSMILE',
      mins: (n) => `approx. ${n} minutes`,
      when: (d, t) => `${d} · ${t}`,
      nTimes: (n) => (n === 1 ? '1 time' : `${n} times`),
      quickNext: 'Next appointment', quickAm: 'Next morning', quickPm: 'Next afternoon', timesFor: (d) => `Times on ${d}`,
      errRequired: 'Please fill in the required fields.',
      errEmail: 'This email address looks incomplete.',
      errName: 'Please enter your first and last name in letters, without digits.',
      errPhone: 'Please check the phone number: digits, spaces and + ( ) / . - only.',
      errCheck: 'Some details were not accepted. Please check your name, phone and email.',
      errConsent: 'Please confirm your consent to the processing of your data.',
      errRate: 'Too many attempts in a short time. Please wait a minute.',
      errLimit: 'These contact details already hold several appointments. We are happy to arrange another one by phone.',
      errGeneric: 'Something went wrong with the booking. Try once more, or use the booking page on aixsmile.de.',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    },
  },
};

let lang = 'de';
const listeners = new Set();
const originals = new WeakMap();

export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export const getLang = () => lang;
export const dyn = () => DYN[lang];
export function onLangChange(fn) { listeners.add(fn); }

const all = (sel) => Array.from(document.querySelectorAll(sel));

function remember(el, field, value) {
  const rec = originals.get(el) || {};
  if (!(field in rec)) rec[field] = value;
  originals.set(el, rec);
}

function capture() {
  all('[data-i18n]').forEach((el) => remember(el, 'html', el.innerHTML));
  all('[data-i18n-alt]').forEach((el) => remember(el, 'alt', el.getAttribute('alt') || ''));
  all('[data-i18n-aria]').forEach((el) => remember(el, 'aria', el.getAttribute('aria-label') || ''));
}

function pick(el, field, key) {
  if (lang === 'en') return getPath(EN, key);
  const rec = originals.get(el);
  return rec ? rec[field] : undefined;
}

export function applyLang(next) {
  lang = next === 'en' ? 'en' : 'de';
  document.documentElement.lang = lang;
  document.title = DYN[lang].meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', DYN[lang].meta.description);
  all('[data-i18n]').forEach((el) => {
    const v = pick(el, 'html', el.dataset.i18n);
    if (typeof v === 'string') el.innerHTML = v;
  });
  all('[data-i18n-alt]').forEach((el) => {
    const v = pick(el, 'alt', el.dataset.i18nAlt);
    if (typeof v === 'string') el.setAttribute('alt', v);
  });
  all('[data-i18n-aria]').forEach((el) => {
    const v = pick(el, 'aria', el.dataset.i18nAria);
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.setAttribute('data-active', lang);
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode: the choice just is not remembered */ }
  listeners.forEach((fn) => {
    try { fn(lang); } catch (e) { console.error('[i18n] listener failed', e); }
  });
}

function storedLang() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

// Runs once, at import. The page's German is captured before any other script
// touches the document; the stored choice is applied straight after.
if (typeof document !== 'undefined') {
  capture();
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.addEventListener('click', () => applyLang(lang === 'de' ? 'en' : 'de'));
  if (storedLang() === 'en') applyLang('en');
}
