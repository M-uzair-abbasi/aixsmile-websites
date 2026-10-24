// ===== Language =====
// German is the page's own language and lives in index.html, where crawlers
// and visitors without JavaScript read it. On load this module remembers the
// German text of every [data-i18n] element; English comes from EN below.
// Switching back to German restores what was remembered, so the two can never
// drift apart. (The same scheme as the bleaching and implant pages.)
//
// DYN holds the strings that scripts build at runtime (the booking widget, the
// next free slot in the hero, the labels on the 3D teeth, the check's results,
// the price line).

// A price-from figure for the costs section. The practice has not supplied
// one: leave it null and no price is shown.
export const PRICE_FROM = null;

const STORAGE_KEY = 'aixsmileLang';

export const EN = {
  skip: 'Skip to content',
  intro: { note: 'Loading straight teeth' },
  nav: {
    home: 'AIXSMILE, back to top', sections: 'Sections', book: 'Book now', call: 'Call us',
    ablauf: 'How it works', passt: 'Right for me?', alltag: 'Daily life', kosten: 'Costs', fragen: 'Questions',
  },
  hud: { what: 'Aligner treatment', tray: 'Aligner' },
  hero: {
    l1: 'Aligners in Aachen.',
    l2: 'Straight, one tray at a time.',
    lead: 'Clear, removable aligners move your teeth into place step by step. Planned digitally: you see the goal before you begin.',
    scroll: 'Scroll: crooked turns straight',
    plateLabel: 'Consultation with 3D scan', plateValue: 'Mon · Tue · Thu, 9 am to 4 pm',
  },
  klar: {
    posterAlt: 'A young woman holds out her open hand; above it floats a set of crooked glass teeth (AI-generated photo, teeth as a 3D illustration)',
    railAria: 'The chapters',
    r0: 'Start', r1: 'Scan', r2: 'Plan', r3: 'Aligners', r4: 'Result',
    trayU: 'Upper', trayL: 'Lower',
  },
  finale: {
    line: 'Barely visible. Easy to wear.',
    book: 'Book a consultation with 3D scan',
    tag: 'Illustration',
    alt: 'A young woman in a knitted sweater laughs, holding a clear aligner in her hand (AI-generated image)',
  },
  steps: {
    h2: 'How aligner treatment works.',
    s0t: 'The starting point', s0p: 'Slight crowding, a few rotated teeth: a typical starting point for aligners.',
    s1t: 'The scan', s1p: 'Instead of impression paste, a digital 3D scan: your teeth are captured in a few minutes.',
    s2t: 'The plan', s2p: 'On screen we plan every tooth movement. You see the goal before the first aligner is made.',
    s3t: 'The aligners', s3p: 'Custom-made and clear. You wear each one about 22 hours a day; every one to two weeks the next one follows.',
    s4t: 'The result', s4p: 'Check-ups accompany the movement, and a retainer keeps the result stable afterwards.',
  },
  sit: {
    h2: 'Which situation sounds like yours?',
    lead: 'Tap your situation. You will see what aligners can do there and how we go about it.',
    t1: 'My teeth are crowded and crooked.',
    a1: 'Crowding is the most common reason for aligners. The trays make room step by step and line the teeth up. The plan after the scan shows how many aligners it takes.',
    t2: 'I have gaps between my teeth.',
    a2: 'Small and medium gaps can often be closed well with aligners. The plan shows you beforehand how it will look.',
    t3: 'My bite is not quite right.',
    a3: 'With an overbite, underbite or crossbite we check carefully whether aligners are enough or fixed braces suit you better. We will tell you honestly.',
    t4: 'My teeth shifted again after braces.',
    a4: 'Then a few aligners are often enough. A retainer then keeps the result stable.',
    t5: 'I do not want fixed braces.',
    a5: 'Aligners are clear and removable. You take them out to eat and to brush your teeth; the rest of the day they are barely noticeable.',
    book: 'Book an appointment about this',
    alt1: 'A young woman in a knit sweater laughs; her teeth are a little crowded (AI-generated image)',
    alt2: 'A man smiles; there is a small gap between his upper front teeth (AI-generated image)',
    alt3: 'A woman thoughtfully rests two fingers on her chin (AI-generated image)',
    alt4: 'A young man holds his old clear retainer (AI-generated image)',
    alt5: 'A man laughs, holding a small white aligner case in his hand (AI-generated image)',
  },
  grow: {
    aria: 'In conversation the aligner is barely noticeable.',
    a: 'In conversation', b: 'the aligner is barely noticeable.',
    alt: 'Two friends laughing together in a café (AI-generated image)',
    line: 'Laugh without thinking about the aligner.',
    cta: 'Book a consultation with 3D scan',
  },
  ways: {
    h2: 'And in everyday life?',
    lead: 'The questions we are asked most often. Tap one.',
    t1: 'Eating?', a1: 'You take the aligner out to eat. You eat everything as usual.',
    m1: 'Afterwards brush your teeth and put the aligner back in. On the go it stays in its case.',
    t2: 'Drinking?', a2: 'Water any time, with the aligner in.',
    m2: 'Coffee, tea, juice and anything sweet are better without the aligner, or rinse your mouth afterwards: otherwise it stains, and sugar stays on the teeth.',
    t3: 'Speaking?', a3: 'For the first few days some people lisp a little.',
    m3: 'The tongue gets used to it quickly; usually it is gone after a few days. In conversation the aligner is barely noticeable.',
    t4: 'Sport?', a4: 'Sport works with the aligner.',
    m4: 'You drink water with the aligner in. For contact sports we discuss suitable protection with you.',
    t5: 'Does it press?', a5: 'Each new aligner presses for a day or two.',
    m5: 'That shows it is working. After that it sits, and you hardly notice it.',
    t6: 'Cleaning?', a6: 'A quick clean morning and evening.',
    m6: 'Rinse with cold or lukewarm water and brush gently. Hot water deforms the aligner.',
    alt1: 'Hands put a clear aligner into its case at lunch (AI-generated image)',
    alt2: 'A woman in a knit sweater drinks a glass of water (AI-generated image)',
    alt3: 'A man laughs in a meeting at the office (AI-generated image)',
    alt4: 'A woman in running clothes smiles after a run in the park (AI-generated image)',
    alt5: 'A woman in a knit sweater presses her clear aligner onto her teeth (AI-generated image)',
    alt6: 'A woman puts in her clear aligner at the bathroom mirror (AI-generated image)',
  },
  mq: {
    a: 'Scan · Plan · Aligner 01 · Aligner 12 · Aligner 24 · Retainer ·',
    b: 'clear · removable · digitally planned · in Aachen ·',
  },
  quiz: {
    h2: 'Is an aligner right for me?',
    lead: 'Three short questions. At the end you see what matters in your case, and you can take the answers straight into your booking.',
    back: 'Back',
    q1: 'What would you like to correct?',
    q1a: 'Crowded or crooked teeth', q1b: 'Gaps between the teeth', q1c: 'Overbite or underbite', q1d: 'Shifted again after braces',
    q2: 'What describes your everyday life best?',
    q2a: 'Lots of contact with people', q2b: 'I often snack between meals', q2c: 'I forget things easily', q2d: 'Nothing special',
    q3: 'When would you like to start?',
    q3a: 'As soon as possible', q3b: 'In the next few months', q3c: 'I am just finding out for now',
    resH: 'What matters in your case:',
    book: 'Book with these answers', again: 'Start again',
  },
  day: {
    unit: 'hours', m1: 'Breakfast', m2: 'Lunch', m3: 'Dinner',
    h2: 'Around 22 hours a day.',
    p: 'You take the aligner out to eat and to brush your teeth. The rest of the day and overnight you wear it. This wearing time is the most important factor for success.',
    f1k: '1–2 weeks', f1v: 'per aligner, then the next one follows',
    f2k: 'Clear', f2v: 'and thin, barely visible in conversation',
    f3k: 'Check-ups', f3v: 'at regular intervals; we adjust if needed',
  },
  case: {
    h2: 'A case from our practice.',
    p: 'Crowded front teeth, before and after aligner treatment. Published with consent.',
    hint: 'Drag or tap: before on the left, after on the right.',
    before: 'Before', after: 'After', range: 'Compare before and after',
    altA: 'Case from our practice: straight front teeth after aligner treatment',
    altB: 'Case from our practice: crowded front teeth before aligner treatment',
  },
  cost: {
    h2: 'What aligner treatment costs.',
    p1: 'The cost depends on the extent of the misalignment and the length of the treatment. For adults, aligner therapy is usually a private service.',
    p2: 'After the scan and the planning you receive a written cost plan. You take it home and decide without time pressure.',
    sheet: 'Your cost plan',
    r1: 'Aligner therapy for adults', r1v: 'Usually a private service',
    r2: 'Paying', r2v: 'Instalments often possible',
    r3: 'Afterwards', r3v: 'Retainer to stabilise',
    fh: 'The price depends on',
    f1: 'Extent of the misalignment', f2: 'Number of aligners and duration', f3: 'Check-ups and retainer',
  },
  doctor: {
    h2: 'First the scan, then the plan.',
    quote: '“A radiant smile is more than aesthetics – it is a piece of joy in life.”',
    p1: 'After the scan we tell you openly whether aligners suit your teeth. And if fixed braces would be better, we tell you that too.',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    fact1: 'languages at the practice', fact2: 'wearing time a day', fact3: 'weeks per aligner',
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
  },
  bk: {
    h2: 'Open consultation times.',
    p: 'These times really are free right now. Pick a time, enter your name and phone number, done.',
    fact1: 'Consultation with a digital 3D scan',
    fact2: 'A written cost plan before anything begins',
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
    h2: 'Common questions about aligners.',
    topicsAria: 'Topics',
    tDay: 'Daily life', tCare: 'Treatment', tAfter: 'Afterwards and costs',
    aside: 'Your question is not here? We are happy to answer it by phone or at the consultation:',
    q1: 'Can people see the aligners?',
    a1: 'Hardly. The aligners are clear and sit thinly on the teeth. In everyday life and in photos they usually go unnoticed; for many adults that is the deciding advantage over fixed brackets.',
    q2: 'How many hours do I need to wear the aligner?',
    a2: 'As a rule around 22 hours a day, so all day and overnight. You take it out only to eat and for dental care. The wearing time is the most important factor for success.',
    q3: 'Does the treatment hurt?',
    a3: 'At the start of each new aligner a slight feeling of pressure can occur, a sign that the teeth are moving. It usually eases after a day or two.',
    q4: 'How long does the treatment take?',
    a4: 'That depends on the starting point. Minor corrections can succeed within a few months; more extensive cases take longer. After the digital planning we can estimate the likely duration well.',
    q5: 'Are aligners suitable for everyone?',
    a5: 'Many misalignments can be treated very well with aligners, but not all. Whether the therapy suits you is something we clarify at a consultation with a digital scan.',
    q6: 'How often do I need to come to the practice?',
    a6: 'For the scan and to receive the aligners, then for check-ups at regular intervals. In between you change the aligners yourself, every one to two weeks.',
    q7: 'What happens after the treatment?',
    a7: 'So that the teeth stay in their new position, a stabilisation phase follows with a retainer: a thin tray or a fixed wire behind the teeth.',
    q8: 'What does aligner treatment cost?',
    a8: 'The cost depends on the extent of the misalignment and the length of the treatment. For adults, aligner therapy is usually a private service. After the scan and the planning you receive a written cost plan; instalments are often possible.',
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
    hours: 'Mon · Tue · Thu, 9 am to 4 pm, by appointment only',
    langs: 'German, English, Farsi, Turkish, Arabic',
    impressum: 'Legal notice', datenschutz: 'Privacy', legalAria: 'Legal',
  },
  mbar: { aria: 'Quick access', book: 'Book a consultation' },
};

export const DYN = {
  de: {
    meta: {
      title: 'Aligner Aachen: unsichtbare Zahnschienen, digital geplant | AIXSMILE',
      description: 'Aligner in Aachen bei AIXSMILE: transparente, herausnehmbare Zahnschienen korrigieren Fehlstellungen Schritt für Schritt. Digitaler 3D-Scan, Plan vorab, Termin online buchen.',
    },
    plate: { label: 'Nächster freier Beratungstermin' },
    cost: { priceFrom: (n) => `Eine Aligner-Behandlung beginnt bei etwa ${n} €; den genauen Betrag nennt Ihr Kostenplan.` },
    // the labels on the crooked teeth; n is what is still to go
    tags: {
      turn: (n) => `gedreht ${n}°`,
      in: (n) => `${n} mm nach innen`,
      high: (n) => `${n} mm zu hoch`,
      done: 'gerade',
    },
    // the labels on the trays as they go on
    trays: { going: 'Schiene wird eingesetzt', seated: 'Schiene sitzt' },
    num: (n, d = 1) => n.toFixed(d).replace('.', ','),
    note: { sit: 'Anliegen: ', quiz: 'Aus dem Aligner-Check: ' },
    quiz: {
      lines: [
        [
          'Engstand und gedrehte Zähne gehören zu dem, was Aligner gut können. Wie ausgeprägt er ist, zeigt der Scan.',
          'Lücken lassen sich oft gut schließen; der Plan zeigt, wie viele Schienen es dafür braucht.',
          'Bei einer Bissfehlstellung prüfen wir genau, ob Aligner reichen oder eine feste Spange besser passt.',
          'Haben sich die Zähne nach einer Spange wieder verschoben, reichen oft wenige Schienen. Danach hält ein Retainer das Ergebnis.',
        ],
        [
          'Die Schienen sind transparent und fallen im Gespräch kaum auf.',
          'Zum Essen nehmen Sie die Schiene heraus, danach Zähne putzen und wieder einsetzen. Weniger Zwischenmahlzeiten machen das leichter.',
          'Die Tragezeit von rund 22 Stunden ist der wichtigste Faktor. Eine feste Routine hilft: nach jedem Zähneputzen gleich wieder einsetzen.',
          'Dann passt die Tragezeit von rund 22 Stunden meist ohne große Umstellung.',
        ],
        [
          'Im Beratungstermin machen wir den Scan; danach planen wir, und Sie bekommen Ihren Kostenplan.',
          'Ein guter Zeitpunkt für den Scan: Sie sehen den Plan und die Kosten, bevor Sie sich entscheiden.',
          'Gern. Im Beratungstermin beantworten wir Ihre Fragen, ohne dass Sie sich festlegen müssen.',
        ],
      ],
    },
    bk: {
      submit: 'Termin verbindlich buchen', submitting: 'Wird gebucht …',
      service: 'Kieferorthopädische Beratung (Aligner)',
      icsSummary: 'Aligner-Beratung bei AIXSMILE',
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
      title: 'Aligners Aachen: invisible braces, planned digitally | AIXSMILE',
      description: 'Aligners in Aachen at AIXSMILE: clear, removable aligners correct misaligned teeth step by step. Digital 3D scan, plan in advance, book online.',
    },
    plate: { label: 'Next open consultation' },
    cost: { priceFrom: (n) => `Aligner treatment starts at around €${n}; your cost plan gives the exact amount.` },
    tags: {
      turn: (n) => `rotated ${n}°`,
      in: (n) => `${n} mm too far in`,
      high: (n) => `${n} mm too high`,
      done: 'straight',
    },
    trays: { going: 'aligner going on', seated: 'aligner in place' },
    num: (n, d = 1) => n.toFixed(d),
    note: { sit: 'Concern: ', quiz: 'From the aligner check: ' },
    quiz: {
      lines: [
        [
          'Crowding and rotated teeth are among the things aligners do well. How pronounced it is shows on the scan.',
          'Gaps can often be closed well; the plan shows how many aligners it takes.',
          'With a bite problem we check carefully whether aligners are enough or fixed braces suit you better.',
          'If your teeth have shifted again after braces, a few aligners are often enough. A retainer then holds the result.',
        ],
        [
          'The aligners are clear and barely noticeable in conversation.',
          'You take the aligner out to eat, then brush and put it back in. Fewer snacks make that easier.',
          'The wearing time of around 22 hours is the most important factor. A fixed routine helps: put it back in right after every brushing.',
          'Then the wearing time of around 22 hours usually fits without much change.',
        ],
        [
          'At the consultation we do the scan; then we plan, and you receive your cost plan.',
          'A good time for the scan: you see the plan and the costs before you decide.',
          'Of course. At the consultation we answer your questions without you having to commit.',
        ],
      ],
    },
    bk: {
      submit: 'Book appointment', submitting: 'Booking …',
      service: 'Orthodontic consultation (aligners)',
      icsSummary: 'Aligner consultation at AIXSMILE',
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
