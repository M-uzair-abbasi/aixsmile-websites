// ===== Language =====
// German is the page's own language and lives in index.html, where crawlers
// and visitors without JavaScript read it. On load this module remembers the
// German text of every [data-i18n] element; English comes from EN below.
// Switching back to German restores what was remembered, so the two can never
// drift apart. (The same scheme as the bleaching and implant pages.)
//
// DYN holds the strings that scripts build at runtime (the booking widget, the
// next free slot in the hero, the shade guide's notes, the price line).

// A price-from figure for the costs section. The practice has not supplied
// one: leave it null and no price is shown.
export const PRICE_FROM = null;

const STORAGE_KEY = 'aixsmileLang';

export const EN = {
  skip: 'Skip to content',
  intro: { note: 'Teeth whitening in Aachen · measuring the shade' },
  nav: {
    home: 'AIXSMILE, back to top', sections: 'Sections', book: 'Book now', call: 'Call us',
    ablauf: 'How it works', flecken: 'Stains', wege: 'Ways', kosten: 'Costs', fragen: 'Questions',
  },
  hero: {
    l1: 'Teeth whitening in Aachen.',
    l2: 'Measured before and after.',
    lead: 'We measure the shade of your teeth before and after treatment, with the same shade guide. Keep scrolling and you will see how whitening works.',
    book: 'Book a consultation',
    scroll: 'Scroll: the teeth get lighter',
    plateLabel: 'Consultations at the practice', plateValue: 'Mon · Tue · Thu, 9 am to 4 pm',
  },
  tx: { tag: 'Illustration · not a treatment result', cta: 'Book a consultation', shade: 'Shade', railAria: 'The five steps' },
  proc: {
    h2: 'How whitening works.',
    s1t: 'Measure the starting shade', s1p: 'First a cleaning and an examination, then we hold the shade guide up: here A3.5.',
    s2t: 'Protect the gums', s2p: 'A light-cured protective layer covers the gums.',
    s3t: 'Apply the gel', s3p: 'The whitening gel goes on the visible teeth; we set the strength and the time.',
    s4t: 'Let the gel work', s4p: 'Often in several rounds. Brief sensitivity to cold is possible and usually passes within a few days.',
    s5t: 'Measure the new shade', s5p: 'The same guide, a new number. The shade settles over one to two weeks and usually lasts one to three years.',
  },
  mq: { a: 'Coffee · Tea · Red wine · Smoking · The years ·' },
  when: {
    h2: 'Which stains whitening can lift.',
    lede: 'Where the colour comes from decides how well it lightens.',
    goodH: 'Responds well', limitH: 'Has limits',
    alt1: 'Close-up of yellowish stained teeth (AI-generated illustration)',
    alt2: 'Close-up of teeth that have darkened with age (AI-generated illustration)',
    alt3: 'Close-up of brownish stains from smoking (AI-generated illustration)',
    alt4: 'Close-up of greyish, streaky discoloured teeth (AI-generated illustration)',
    alt5: 'Close-up: one front tooth is clearly darker than the others (AI-generated illustration)',
    alt6: 'Close-up: a crown in a different shade from the neighbouring teeth (AI-generated illustration)',
    t1: 'Yellowish from coffee and tea', p1: 'The most common stain, and the one that responds best.',
    t2: 'Darkened over the years', p2: 'Colour that builds up with age usually lightens well.',
    t3: 'Stains from smoking', p3: 'The cleaning removes the deposits, the whitening what has built up inside.',
    t4: 'Grey, often from medication', p4: 'For example after antibiotics in childhood: lightens more slowly and less evenly.',
    t5: 'A single dark tooth', p5: 'Often after a root canal treatment; this needs a different approach.',
    t6: 'Fillings, crowns and veneers', p6: 'They keep their colour. If they are at the front, we plan matching them in.',
    end: 'Where your teeth stand, we see at the examination.',
  },
  methods: {
    h2: 'At the practice, at home or both.',
    lede: 'Which way suits you, we work out at the consultation. Tap a way.',
    t1: 'At the practice', t2: 'At home', t3: 'Combined',
    alt1: 'A person in the treatment chair wearing protective glasses, the whitening lamp in front (AI-generated image)',
    alt2: 'A hand holding clear whitening trays and a small gel syringe (AI-generated image)',
    alt3: 'Whitening gel being applied to the front teeth, the gums covered (AI-generated image)',
    colFit: 'Suits you if', colHow: 'How it works', colGel: 'The gel',
    fit1: 'you want to see the result the same day.', how1: 'One appointment, under our supervision', gel1: 'Stronger, supervised by us',
    fit2: 'your teeth are sensitive.', how2: 'Several days, with thin custom-made trays', gel2: 'Milder, worn in the trays',
    fit3: 'you want to top it up later.', how3: 'First at the practice, then at home', gel3: 'First stronger, then milder',
  },
  st1: { aria: 'Lighter, but not artificially white.', a: 'Lighter, but', b: 'not artificially white.' },
  band: { alt: 'A young woman laughing, with bright, natural teeth (AI-generated image)', line: 'Laughing without a hand in front of your mouth.' },
  ba: {
    h2: 'Two cases from our practice.',
    lede: 'Published with consent. Light and camera were not the same before and after; the shade guide measures more precisely than any photo.',
    alt1a: 'Case 1 from our practice, after whitening', alt1b: 'Case 1 from our practice, before whitening',
    alt2a: 'Case 2 after whitening', alt2b: 'Case 2 before whitening',
    before: 'Before', after: 'After',
    range1: 'Case 1: compare before and after', range2: 'Case 2: compare before and after',
    case1: 'Case 1', k1: 'At the practice', t1: 'Yellowish discolouration',
    case2: 'Case 2', k2: 'At the practice', t2: 'Darkened front teeth',
    hint: 'Drag or tap: before on the left, after on the right.',
  },
  s2: {
    h2: 'One value before, one value after.',
    cardP: 'We hold sample teeth with codes such as A2 or BL3 next to yours. The distance between the two values shows how much lighter your teeth have become.',
    prompt: 'Which sample tooth comes closest to your teeth? Tap it.',
    exampleNote: 'An example: before A3, after B1.',
    scaleAria: 'Simplified shade guide with eight sample teeth, from A3 to BL1',
    darker: '← darker', lighter: 'lighter →',
    scaleNote: 'Simplified. The real guide has more steps; we measure in the mouth, in daylight.',
  },
  kosten: {
    h2: 'What whitening costs.',
    plan: 'Beforehand you receive a written cost plan with every item. You take it home and decide without time pressure.',
    factorsH: 'The price depends on',
    f1k: 'Method', f1v: 'At the practice in one session, or at home with custom-made trays.',
    f2k: 'Preparation', f2v: 'The professional cleaning beforehand, and whether a small treatment is needed as well.',
    f3k: 'Starting point', f3v: 'How marked the discolouration is and how many teeth in the visible area are involved.',
    sheet: 'Your cost plan',
    r1: 'Examination and shade check', kasseK: 'Through your health insurance',
    r2: 'The whitening itself', privK: 'Private service under the GOZ',
  },
  doctor: {
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
    h2: 'First the examination, then the gel.',
    quote: '“A radiant smile is more than aesthetics – it is a piece of joy in life.”',
    p1: 'We tell you openly which white is realistic for your teeth. And if fillings or crowns will not lighten with them, which other options there are.',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    fact1: 'languages at the practice', fact2: 'shade measured, before and after', fact3: 'years the result usually lasts',
  },
  bk: {
    h2: 'Open consultation times.',
    p: 'These times really are free right now. Pick a time, enter your name and phone number, done.',
    fact1: 'First appointment through your health insurance, at no extra cost',
    fact2: 'A written cost plan before any treatment',
    fact3: 'If something comes up, one click in the appointment email is enough',
    call: 'Rather call?',
    step1: 'Time', step2: 'Your details', step3: 'Booked',
    unavailable: 'The open times cannot be loaded right now.', unavailableCall: 'Call us:',
    taken: 'Someone else has just booked this time. Please choose another one.',
    quickH: 'Soonest', calPrev: 'Previous month', calNext: 'Next month', daysAria: 'Days',
    timesH: 'Time', timesEmpty: 'Choose a day and the times will appear here.',
    morning: 'Morning', afternoon: 'Afternoon',
    noDays: 'No online appointment is free at the moment. By phone we can usually still find one.',
    change: 'Change', first: 'First name *', last: 'Last name *', phone: 'Phone *', email: 'Email *',
    addNote: '+ Note', note: 'Note (optional)',
    privacy: 'Your details go directly to the AIXSMILE dental practice and are used only for this appointment. This page itself stores no data.',
    doneH: 'Booked. See you at the practice.',
    doneWhere: 'Come to Großkölnstraße 22-28, 52062 Aachen.',
    nextH: 'What happens next',
    next1: 'The appointment email is on its way, with the date, time and address.',
    next2: 'You will get a short reminder the day before.',
    next3: 'You can cancel at any time via the link in the appointment email.',
    calendar: 'Save to calendar', route: 'Directions',
  },
  faq: {
    h2: 'Common questions about whitening.',
    topicsAria: 'Topics', tSafe: 'Safety', tFeel: 'Sensitivity', tResult: 'Result', tWay: 'Process and costs',
    aside: 'Your question is not here? We are happy to answer it by phone or at the consultation:',
    q1: 'Does whitening damage the enamel?',
    a1: 'Not with healthy teeth and a gel dosed by a dentist. The enamel keeps its thickness; only the stored colour pigments change. That is exactly why we check beforehand for decay, cracks or leaking fillings.',
    q2: 'How long does the result last?',
    a2: 'For most people one to three years. Anyone who drinks a lot of coffee, tea or red wine, or smokes, will see the old shade return sooner. A top-up is then possible with little effort.',
    q3: 'Does whitening hurt?',
    a3: 'The treatment itself usually does not hurt. For a while the teeth may react more sensitively to cold or twinge briefly. This usually passes within a few days; a fluoride toothpaste can help.',
    q4: 'Do fillings and crowns get lighter too?',
    a4: 'No. Composite fillings, crowns and veneers keep their colour. If they are in the visible area, it can make sense to match them to the new tooth shade after whitening. We discuss this with you beforehand.',
    q5: 'I have sensitive teeth. Can I still have whitening?',
    a5: 'Often yes, with an adapted approach: a milder gel, shorter contact times, or a pre-treatment that makes the teeth less sensitive. Whether that is enough in your case, we clarify at the examination.',
    q6: 'Is whitening possible with receding gums?',
    a6: 'We decide case by case. Exposed tooth necks react more sensitively and lighten differently from enamel. We look at these areas closely and protect them during treatment.',
    q7: 'Whitening first, or veneers first?',
    a7: 'If both are planned, whitening comes first. The shade of the veneers is then matched to the lightened neighbouring teeth. The other way round does not work, because whitening does not make a ceramic shell lighter.',
    q8: 'At the practice or with trays at home?',
    a8: 'At the practice it is faster: one appointment, a stronger gel under supervision. With trays made from an impression of your teeth, you wear a milder gel at home over several days. Which way suits you depends on your teeth, your time and how sensitive you are.',
    q9: 'How is the tooth shade determined?',
    a9: 'With a shade guide of sample teeth that we hold right next to your teeth in daylight. Each sample tooth has a code. We note the value before and after treatment, so the result stays comparable and does not depend on the light in a photo.',
    q10: 'Does the consultation cost anything?',
    a10: 'No. For people with statutory health insurance, the examination and shade check are a check-up billed to the insurer; private patients submit the appointment as usual. Costs only arise if, after the written cost plan, you decide on the whitening.',
  },
  praxis: {
    h2: 'On Großkölnstraße, in the middle of Aachen.',
    addrP: 'In the city centre, a few minutes from the bus station and the market square. Großkölnstraße car park directly opposite.',
    hoursH: 'Opening hours', hours: 'Mon · Tue · Thu, 9 am to 4 pm', hoursNote: 'By appointment only',
    addrH: 'Address', telH: 'Phone', reviewsH: 'Reviews', reviews: 'On Google, unabridged',
    mapAria: 'Map: Großkölnstraße 22-28, 52062 Aachen. Opens directions in your maps app',
    mapGo: 'Open directions',
  },
  foot: {
    line: 'The first step: measuring your tooth shade.',
    mq: 'Lighter · Measured · Aachen ·',
    hours: 'Mon · Tue · Thu, 9 am to 4 pm, by appointment only',
    langs: 'German, English, Farsi, Turkish, Arabic',
    impressum: 'Legal notice', datenschutz: 'Privacy',
  },
  mbar: { aria: 'Quick access', book: 'Book a consultation' },
};

export const DYN = {
  de: {
    meta: {
      title: 'Bleaching Aachen: vorher und nachher gemessen | AIXSMILE',
      description: 'Bleaching in Aachen bei AIXSMILE: Zahnfarbe vorher und nachher mit der Farbskala gemessen, Ziel gemeinsam festgelegt. Ablauf, Kosten, echte Fälle, Termin online buchen.',
    },
    plate: { label: 'Nächster freier Beratungstermin' },
    cost: { priceFrom: (n) => `Ein Bleaching in der Praxis beginnt bei etwa ${n} €; den genauen Betrag nennt Ihr Kostenplan.` },
    shade: { picked: 'Ihre Schätzung. Genau messen wir in der Praxis, bei Tageslicht.' },
    bk: {
      submit: 'Termin verbindlich buchen', submitting: 'Wird gebucht …',
      service: 'Bleaching-Beratung',
      icsSummary: 'Bleaching-Beratung bei AIXSMILE',
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
      title: 'Teeth whitening Aachen: measured before and after | AIXSMILE',
      description: 'Teeth whitening in Aachen at AIXSMILE: tooth shade measured with a shade guide before and after, target agreed together. Process, costs, real cases, book online.',
    },
    plate: { label: 'Next open consultation' },
    cost: { priceFrom: (n) => `Whitening at the practice starts at around €${n}; your cost plan gives the exact amount.` },
    shade: { picked: 'Your estimate. We measure precisely at the practice, in daylight.' },
    bk: {
      submit: 'Book appointment', submitting: 'Booking …',
      service: 'Whitening consultation',
      icsSummary: 'Whitening consultation at AIXSMILE',
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
