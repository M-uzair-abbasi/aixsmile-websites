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
    home: 'AIXSMILE – back to top', book: 'Book an appointment', call: 'Call: 0241 31202',
    sections: 'Page sections', behandlung: 'Treatment', faelle: 'Cases', methoden: 'Methods', kosten: 'Costs', faq: 'Questions',
  },
  proc: {
    h2: 'How whitening works.',
    hint: 'Press and hold the right half of the picture – the treatment plays.',
    tag: 'Illustration · not a treatment result',
    shade: 'Shade',
    holdAria: 'Play the treatment: press and hold',
    hold: 'Press and hold',
    playing: 'Playing',
    cta: 'Book a consultation',
    dots: 'Treatment steps',
    s1t: 'Measure the starting shade',
    s1p: 'First a cleaning and an examination, then we hold up the shade guide: here A3.5.',
    s2t: 'Protect the gums',
    s2p: 'A light-cured barrier covers the gums.',
    s3t: 'Apply the gel',
    s3p: 'The whitening gel goes onto the visible teeth; we set its strength and timing.',
    s4t: 'Let the gel work',
    s4p: 'Often in several rounds. Brief sensitivity to cold can occur and usually passes within a few days.',
    s5t: 'Measure the new shade',
    s5p: 'The same guide, a new number. The shade settles over one to two weeks; with good care it stays bright for many years.',
  },
  hero: {
    h1: 'Whitening in Aachen, <span class="hl">honestly</span> measured.',
    lead: 'I hold the same shade guide against your teeth before and after the treatment. So you see what has really changed, not what a photo promises.',
    proofB: 'A3 → B1, measured.',
    proofS: 'The same shade guide before and after the treatment, in daylight.',
    proofAlt: 'A sample tooth from the shade guide held next to the front teeth (AI-generated image)',
    book: 'Book a consultation',
    cases: 'See real cases',
    imgAlt: 'A young woman laughing, with bright natural teeth (AI-generated image)',
    caseB: 'A real case from our practice',
    caseAltA: 'Case 1 from our practice, after whitening', caseAltB: 'Case 1 from our practice, before whitening',
    caseRange: 'Real case: compare before and after',
  },
  smile: {
    l1: 'Lighter, but not artificially white. That is my aim with every whitening.',
    l2: 'Laughing, without a hand over your mouth.',
    l3: 'The first step is a small one: measuring your shade.',
    cta: 'Book a consultation',
    alt1: 'Close-up of a naturally bright smile (AI-generated image)',
    alt2: 'A man in his forties smiling, with bright teeth (AI-generated image)',
    alt3: 'A woman with silver hair smiling, with bright teeth (AI-generated image)',
  },
  when: {
    h2: 'Which stains whitening can lift.',
    lede: 'Where the colour comes from decides how well it lightens. I tell you beforehand where we can realistically land.',
    goodH: 'Responds well',
    limitH: 'Reaches its limits',
    t1: 'Yellowish from coffee and tea',
    p1: 'The most common discolouration – and the one that responds best.',
    a1: 'Close-up of yellowish discoloured teeth (AI-generated illustration)',
    t2: 'Darkened over the years',
    p2: 'Colour stored with age usually lightens well.',
    a2: 'Close-up of teeth that have darkened with age (AI-generated illustration)',
    t3: 'Stains from smoking',
    p3: 'The cleaning removes the deposits, the whitening what is stored inside.',
    a3: 'Close-up of brownish stains from smoking (AI-generated illustration)',
    t4: 'Grey, often from medication',
    p4: 'For example after antibiotics in childhood: lightens more modestly and less evenly.',
    a4: 'Close-up of greyish, banded discoloured teeth (AI-generated illustration)',
    t5: 'A single dark tooth',
    p5: 'Often after a root canal; this needs a different approach.',
    a5: 'Close-up where one front tooth is clearly darker than the others (AI-generated illustration)',
    t6: 'Fillings, crowns and veneers',
    p6: 'They keep their colour – if they sit at the front, we plan their matching in.',
    a6: 'Close-up where a crown has a different shade from the neighbouring teeth (AI-generated illustration)',
  },
  s2: {
    h2: 'One value before, one value after.',
    photoAlt: 'A shade guide with sample teeth from yellowish to light, on a dark background (AI-generated image)',
    cardP: 'We hold sample teeth with codes such as A2 or BL3 next to yours. The gap between the two values shows how much lighter your teeth have become.',
    scaleAria: 'Simplified shade guide with eight sample teeth, from A3 to BL1',
    darker: '← darker',
    lighter: 'lighter →',
    scaleNote: 'Simplified. The real guide has more steps; we measure in the mouth, in daylight.',
    prompt: 'Which sample tooth is closest to yours? Tap it.',
    exampleNote: 'An example: before A3, after B1.',
    pickedNote: 'Your estimate. We measure exactly in the practice, in daylight.',
  },
  methods: {
    h2: 'In the practice, at home, or both.',
    lede: 'Which route suits you, we work out together at the consultation. There is no wrong one.',
    colHow: 'Process', colGel: 'The gel', colFit: 'Suits you if',
    alt1: 'A person in the treatment chair wearing protective glasses, the whitening light in front (AI-generated image)',
    t1: 'In the practice',
    how1: 'One appointment, supervised by us',
    gel1: 'More concentrated, monitored by us',
    fit1: 'you want to see the result the same day',
    alt2: 'A hand holding clear whitening trays and a small gel syringe (AI-generated image)',
    t2: 'At home with trays',
    how2: 'Several days, with thin custom trays',
    gel2: 'Milder, worn in the trays',
    fit2: 'your teeth are sensitive',
    alt3: 'Whitening gel being applied to the front teeth, with the gums covered (AI-generated image)',
    t3: 'Combined',
    how3: 'First in the practice, then at home',
    gel3: 'Stronger first, then milder',
    fit3: 'you want to refresh later',
  },
  ba: {
    h2: 'Two cases, exactly as they looked.',
    lede: 'Published with consent. Light and camera were not identical before and after. That is why I rely on the shade guide, not on the photo.',
    altB1: 'Case 1 before whitening', altA1: 'Case 1 after whitening',
    altB2: 'Case 2 before whitening', altA2: 'Case 2 after whitening',
    range1: 'Case 1: compare before and after', range2: 'Case 2: compare before and after',
    before: 'Before', after: 'After', case1: 'Case 1', case2: 'Case 2',
    expand1: 'View the full photo of case 1', expand2: 'View the full photo of case 2',
    lightbox: 'Enlarged view', close: 'Close', lbHint: 'Tap to close',
    k1: 'In the practice', t1: 'Yellowish discolouration', cap1: 'Before on the left, after on the right.',
    k2: 'In the practice', t2: 'Front teeth darkened over the years', cap2: 'Before on the left, after on the right.',
  },
  bk: {
    h2: 'Open times for a consultation.',
    p: 'Below are the times genuinely open right now. Pick one, leave your name and phone number, done.',
    fact1: 'First visit billed to your health insurance, no extra cost',
    fact2: 'Written cost plan before any treatment',
    fact3: 'If something comes up, one click in the appointment email is enough',
    unavailable: 'The free slots cannot be loaded right now.', unavailableLink: 'Call us: 0241 31202',
    step1: 'Slot', step2: 'Your details', step3: 'Booked',
    taken: 'Someone booked this time in the meantime. Please pick another one.',
    daysAria: 'Days', morning: 'Morning', afternoon: 'Afternoon',
    quickH: 'Fastest', calPrev: 'Previous month', calNext: 'Next month', calHint: 'Marked days have open times. Bookable up to six months ahead.',
    timesH: 'Time', timesEmpty: 'Pick a day and the open times appear here.',
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
    h2: 'What whitening costs.',
    sheet: 'What is paid for what',
    r1: 'Examination and shade check', kasseK: 'Covered by your health insurance',
    r2: 'The whitening itself', privK: 'Private service under the GOZ fee scale',
    plan: 'You get a written cost plan with every item listed beforehand. Take it home and decide at your own pace. Nobody will push you.',
    factorsH: 'The price depends on',
    f1k: 'Method', f1v: 'In the practice in one session, or at home with custom-made trays.',
    f2k: 'Preparation', f2v: 'The professional cleaning beforehand, and whether a small treatment is needed as well.',
    f3k: 'Starting point', f3v: 'How pronounced the discolouration is and how many teeth in the visible area are involved.',
  },
  doctor: {
    h2: 'First the examination, then the gel.',
    quote: '“A smile you no longer hide is worth more to me than the brightest white.”',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    p1: 'I tell you openly which white is realistic for your teeth. And if fillings or crowns will not lighten with them, we discuss beforehand what that means for you.',
    p2: 'If whitening will not do anything for you, I tell you that too. Better an honest no than a result that disappoints you.',
    fact1: 'languages spoken in the practice',
    fact2: 'shade measurements, before and after',
    fact3: 'years of experience',
    cta: 'Book a consultation',
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
  },
  faq: {
    h2: 'Common questions about whitening.',
    aside: 'Your question is not here? Call us, or ask me at the appointment. I will take the time.',
    q1: 'Does whitening damage the enamel?',
    a1: 'Not with healthy teeth and a gel dosed by a dentist. The enamel keeps its thickness; only the stored pigments change. That is exactly why we check beforehand whether decay, cracks or leaking fillings are in the way.',
    q2: 'How long does the result last?',
    a2: 'That depends mostly on you. If you look after your teeth and come for regular cleanings, you usually enjoy it for many years. A lot of coffee, tea, red wine or smoking lets the shade darken sooner. And if it fades at some point, a short touch-up is enough, far smaller than the first treatment.',
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
    hours: 'Mon · Tue · Thu, 9:00 – 16:00',
    hoursNote: 'appointment only',
    langs: 'German, English, Farsi, Turkish, Arabic',
    linkBook: 'Consultation',
    impressum: 'Imprint',
    datenschutz: 'Privacy',
  },
  mbar: { aria: 'Quick access', book: 'Book a consultation' },
  cookie: { text: 'This page sets no cookies and runs no tracking. <a href="/datenschutz/">Privacy</a>', close: 'Dismiss' },
};

export const DYN = {
  de: {
    meta: {
      title: 'Bleaching Aachen – Ablauf, Farbbestimmung & Beratung | AIXSMILE',
      description: 'Bleaching in Aachen bei AIXSMILE: Zahnfarbe vorher und nachher mit der Farbskala gemessen, Ziel gemeinsam festgelegt. Ablauf, Kosten, echte Fälle, Termin online buchen.',
    },
    kosten: { priceFrom: (n) => `Bleaching in der Praxis ab ${n} €. Der genaue Betrag steht in Ihrem Kostenplan.` },
    mini: { hide: 'Ausblenden', none: 'Online ist gerade nichts frei. Rufen Sie uns an: 0241 31202', more: 'Alle Termine und Uhrzeiten', loading: 'Termine werden geladen …' },
    bk: {
      submit: 'Termin verbindlich buchen', submitting: 'Wird gebucht …',
      service: 'Bleaching-Beratung mit Farbbestimmung',
      icsSummary: 'Bleaching-Beratung – AIXSMILE',
      mins: (n) => `ca. ${n} Minuten`,
      when: (d, t) => `${d} · ${t} Uhr`,
      nTimes: (n) => (n === 1 ? '1 Zeit' : `${n} Zeiten`),
      quickNext: 'Nächster Termin', quickAm: 'Nächster Vormittag', quickPm: 'Nächster Nachmittag', timesFor: (d) => `${d}`,
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
    mini: { hide: 'Hide', none: 'Nothing is open online right now. Call us: 0241 31202', more: 'All days and times', loading: 'Loading appointments …' },
    bk: {
      submit: 'Book appointment', submitting: 'Booking …',
      service: 'Whitening consultation with shade check',
      icsSummary: 'Whitening consultation – AIXSMILE',
      mins: (n) => `approx. ${n} minutes`,
      when: (d, t) => `${d} · ${t}`,
      nTimes: (n) => (n === 1 ? '1 time' : `${n} times`),
      quickNext: 'Next appointment', quickAm: 'Next morning', quickPm: 'Next afternoon', timesFor: (d) => `${d}`,
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
