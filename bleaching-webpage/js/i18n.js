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
    home: 'AIXSMILE – back to top', book: 'Book a shade check', call: 'Call: 0241 31202',
    sections: 'Page sections', wann: 'When it helps', ablauf: 'Process', faelle: 'Before/after', kosten: 'Costs', faq: 'Questions',
  },
  ai: { tag: 'AI-generated', symbol: 'AI-generated · illustration' },
  hero: {
    eyebrow: 'Teeth whitening in Aachen · AIXSMILE',
    h1: 'What’s your shade of <em>white</em>?',
    alt: 'A gloved hand holds a shade-guide sample tooth next to the front teeth (AI-generated image)',
    lead: 'Tooth colour can be measured. We read it against a shade guide before the whitening and once more afterwards. So the change is on paper, not just in the mirror.',
    sub: 'From AIXSMILE, your dental practice on Großkölnstraße. The shade check is part of the first consultation.',
    book: 'Book a shade check',
    t1: 'Book online, confirmation straight away by email',
    t2: 'Written cost plan before any treatment',
    t3: 'Five languages spoken at the practice',
    caseB: 'A real case from our practice',
    caseS: 'See before and after',
    caseAlt: 'Case 1 from our practice: before on the left, after on the right',
    dotAlt: 'Detail of the shade guide in our practice: the sample teeth BL1 to BL4',
  },
  moment: {
    eyebrow: 'Why whitening',
    h2: 'Laughing without thinking about the <em>colour</em> of your teeth.',
    p1: 'Many people notice it first in photos: the teeth look darker than they used to, the laugh gets more careful, a hand drifts in front of the mouth. That is nothing unusual. Tooth colour changes with the years and with what we drink every day.',
    p2: 'Whitening in the practice lightens your own teeth, under dental supervision and with a result we measure.',
    f1: 'Examination and cleaning first, then the gel',
    f2: 'The shade is measured, not guessed',
    f3: 'Written cost plan before any treatment',
    alt: 'A woman laughing, with naturally light teeth (AI-generated image)',
  },
  when: {
    eyebrow: 'When whitening helps',
    h2: 'Not every discolouration is <em>the same</em>.',
    lede: 'Where the colour comes from decides how well it lightens. The pictures are illustrations; which cause applies to you, we find out at the examination.',
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
  s1: {
    eyebrow: 'What happens',
    h2: 'The tooth <em>itself</em> is lightened, not its surface.',
    p1: 'Coffee, tea, red wine, tobacco and the years leave pigments inside the tooth, in the enamel and in the dentine beneath it. A cleaning only reaches what sits on the outside. The whitening gel penetrates and breaks down those stored pigments until the tooth looks lighter.',
    p2: 'Nothing is added to the tooth and nothing is removed. Its shape and surface stay as they are. Of all the ways to lighter teeth, whitening changes the least.',
    alt: 'Whitening gel being applied to the front teeth, with the gums covered (AI-generated image)',
  },
  s2: {
    eyebrow: 'Measuring',
    h2: 'A shade guide instead of an <em>impression</em>.',
    p1: 'We hold a row of sample teeth next to yours. Each carries a code such as A2, B1 or BL3: the letter stands for the hue, the number for the gradation. The BL samples are lighter than the usual natural shades and are meant for whitened teeth.',
    figAlt: 'Shade guide with sample teeth, held right next to the teeth during a shade check in our practice',
    figCap: 'This is what a shade check looks like in our practice. Colours on screen are not binding; the shade is measured in the mouth, in daylight.',
    p2: 'We measure in daylight and before anything else happens. The value is written down, and every later result has to be measured against it.',
    scaleAria: 'Simplified shade guide with eight sample teeth, from A3 to BL1',
    darker: '← darker',
    lighter: 'lighter →',
    scaleNote: 'Simplified. The real guide has more steps, and colours on screen are not binding.',
    stripH: 'What one step on the guide means',
    stripAlt: 'The same smile three times side by side; only the tooth shade changes, from A3 through A1 to BL3 (AI-generated illustration)',
    stripNote: '<b>Illustration, not a treatment result.</b> It shows roughly how three steps on the guide differ. How many steps are possible for your teeth only the examination shows.',
  },
  steps: {
    eyebrow: 'Process',
    h2: 'Four steps, and a <em>new number</em> at the end.',
    alt: 'A shade guide of sample teeth on a metal stand, from ivory to white (AI-generated image)',
    t1: 'Check first, then whiten',
    p1: 'The examination comes before the gel, and a professional cleaning always comes before that. We treat decay, leaking fillings or exposed tooth necks first. Fillings, crowns and veneers do not lighten; if they sit in the visible area, we plan for them from the start.',
    t2: 'An honest target',
    p2: 'How light a tooth can become is up to the tooth: starting shade, enamel thickness, the kind of discolouration. Yellowish tones usually respond well, grey ones much more modestly. We make no promise in steps, but you learn beforehand what is realistic.',
    t3: 'Whitening, under control',
    p3: 'A protective layer covers the gums, then the gel goes onto the teeth and works in a controlled way, often in several rounds. Concentration and contact time are set by the practice, not by a package leaflet. It should not hurt; brief sensitivity to cold usually passes within a few days.',
    t4: 'Measuring again',
    p4: 'The same guide, the same teeth, a new number. Straight afterwards, teeth often look a little lighter than they will stay; after one to two weeks the shade has settled. How long it lasts depends mostly on coffee, tea, red wine and smoking; usually one to three years.',
    book: 'Book a shade check',
  },
  routes: {
    eyebrow: 'Two routes',
    h2: 'In the practice or <em>at home</em>.',
    lede: 'Both routes lighten; they differ in pace and dosage. Which one suits you, we clarify in the consultation.',
    m1: 'One appointment · supervised',
    t1: 'In the practice',
    p1: 'A more concentrated gel, applied and monitored by us. For anyone who wants to see the result the same day.',
    alt1: 'A person in the treatment chair wearing protective glasses, the whitening light in front (AI-generated image)',
    m2: 'Several days · at home',
    t2: 'At home, with trays',
    p2: 'From an impression we make thin trays for your teeth. You wear a milder gel in them over several days. It takes longer and is often gentler on sensitive teeth.',
    alt2: 'A hand holding clear whitening trays and a small gel syringe (AI-generated image)',
  },
  ba: {
    eyebrow: 'Before and after',
    h2: 'Two cases from <em>our practice</em>.',
    lede: 'Published with the patients’ consent. The photos were taken in everyday practice; light and camera were not identical before and after. That is why a photo never shows colour as precisely as the shade guide.',
    alt1: 'Case 1: the teeth before whitening at the top, afterwards below',
    alt2: 'Case 2: the teeth before whitening at the top, afterwards below',
    before: 'Before', after: 'After', case1: 'Case 1', case2: 'Case 2',
    cap: 'Treated in our practice in Aachen',
  },
  bk: {
    eyebrow: 'Appointment',
    h2: 'Shade check and consultation, <em>book right here</em>.',
    p: 'You see the practice’s free slots in real time. Choose a day, choose a time, enter your details; the confirmation arrives by email.',
    fact1: 'Examination and shade check at the first appointment',
    fact2: 'Written cost plan before any treatment',
    fact3: 'Cancel with one click from the confirmation email',
    fallbackText: 'Prefer to call?', fallbackLink: 'Book on aixsmile.de',
    unavailable: 'The free slots cannot be loaded right now.', unavailableLink: 'Book on aixsmile.de instead.',
    step1: 'Slot', step2: 'Your details', step3: 'Booked',
    taken: 'Someone booked this time in the meantime. Please pick another one.',
    pickDay: 'Day', daysAria: 'Days', pickTime: 'Time', morning: 'Morning', afternoon: 'Afternoon',
    noDays: 'There are no open consultation times online right now. Please give us a call.',
    change: 'Change',
    gender: 'Title *', first: 'First name *', last: 'Last name *', phone: 'Phone *', email: 'Email *',
    existing: 'Have you been to our practice before?', addNote: '+ Add a note', note: 'Note (optional)',
    privacy: 'What you enter goes straight to the AIXSMILE dental practice and serves this appointment alone. This page keeps no data of its own.',
    doneH: 'Booked. See you at the practice.',
    doneWhere: 'AIXSMILE dental practice · Großkölnstraße 22–28, 52062 Aachen',
    nextH: 'What happens next',
    next1: 'We are sending a confirmation with every detail to the email address you gave.',
    next2: 'The day before, we remind you of the appointment by email.',
    next3: 'If it no longer suits you, cancel via the link in the confirmation.',
    calendar: 'Add to calendar', route: 'Get directions',
  },
  kosten: {
    eyebrow: 'Costs',
    h2: 'What whitening costs, and <em>what that depends on</em>.',
    p1: 'Whitening is a cosmetic private service, charged under the German fee scale for dentists (GOZ). Statutory health insurance does not contribute; private supplementary insurance depends on the plan.',
    p2: 'We give you an amount as soon as it is clear which route suits your teeth. These three points decide it:',
    f1k: 'Method', f1v: 'In the practice in one session, or at home with custom-made trays.',
    f2k: 'Preparation', f2v: 'The professional cleaning beforehand, and whether a small treatment is needed as well.',
    f3k: 'Starting point', f3v: 'How pronounced the discolouration is and how many teeth in the visible area are involved.',
    promiseH: 'How you get to your price',
    s1k: 'Examination and shade check', s1v: 'We look at your teeth and measure the starting shade.',
    s2k: 'Written cost plan', s2v: 'With every item listed, before anything is treated.',
    s3k: 'Your decision', s3v: 'You take the plan home and decide without time pressure.',
    btn: 'Book a consultation',
  },
  doctor: {
    eyebrow: 'Your dentist',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    p1: 'With us, whitening starts with an examination and a number on the shade guide, not with the gel. We tell you beforehand which result is realistic for your teeth, and we measure again afterwards.',
    p2: 'If whitening cannot reach your goal, for example because visible fillings or crowns will not lighten with it, we say so openly and show you what other options there are.',
    langs: 'At the practice we speak German, English, Farsi, Turkish and Arabic.',
    btn: 'Get to know the practice on aixsmile.de',
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
  },
  faq: {
    eyebrow: 'Frequent questions',
    h2: 'What people <em>often ask</em> before whitening.',
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
  },
  praxis: {
    eyebrow: 'The practice',
    h2: 'On Großkölnstraße, right in the <em>centre of Aachen</em>.',
    addrH: 'Address', route: 'Get directions',
    hoursH: 'Consultation hours', hoursDays: 'Mon · Tue · Thu', hoursTime: '9:00 – 16:00', hoursNote: 'By appointment.',
    reviewsH: 'Reviews',
    reviewsP: 'How other patients experienced us is on Google.',
    reviewsBtn: 'Read reviews on Google',
    reviewsNote: 'We show no selected quotes on this page. All reviews are on Google, unabridged and unchanged.',
  },
  footer: {
    fax: 'Fax 0241 4018150',
    hours: 'Mon · Tue · Thu, 9:00 – 16:00',
    hoursNote: 'By appointment',
    langs: 'German, English, Farsi, Turkish, Arabic',
    linkBook: 'Book an appointment',
    linkMain: 'Whitening on aixsmile.de',
    impressum: 'Imprint',
    datenschutz: 'Privacy',
  },
  mbar: { aria: 'Quick access', book: 'Book a shade check' },
};

export const DYN = {
  de: {
    meta: {
      title: 'Bleaching Aachen – Ablauf, Farbbestimmung & Beratung | AIXSMILE',
      description: 'Bleaching in Aachen bei AIXSMILE: Zahnfarbe vorher und nachher mit der Farbskala gemessen, Ziel gemeinsam festgelegt. Ablauf, Kosten, echte Fälle, Termin online buchen.',
    },
    kosten: { priceFrom: (n) => `Bleaching in der Praxis ab ${n} €. Der genaue Betrag steht in Ihrem Kostenplan.` },
    bk: {
      submit: 'Termin verbindlich buchen', submitting: 'Wird gebucht …',
      service: 'Bleaching-Beratung mit Farbbestimmung',
      icsSummary: 'Bleaching-Beratung – AIXSMILE',
      mins: (n) => `ca. ${n} Minuten`,
      when: (d, t) => `${d} · ${t} Uhr`,
      nTimes: (n) => (n === 1 ? '1 Zeit' : `${n} Zeiten`),
      genders: [['m', 'Herr'], ['w', 'Frau'], ['d', 'Divers']],
      existingOpts: [['ja', 'Ja'], ['nein', 'Nein']],
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
    bk: {
      submit: 'Book appointment', submitting: 'Booking …',
      service: 'Whitening consultation with shade check',
      icsSummary: 'Whitening consultation – AIXSMILE',
      mins: (n) => `approx. ${n} minutes`,
      when: (d, t) => `${d} · ${t}`,
      nTimes: (n) => (n === 1 ? '1 time' : `${n} times`),
      genders: [['m', 'Mr'], ['w', 'Ms'], ['d', 'Other']],
      existingOpts: [['ja', 'Yes'], ['nein', 'No']],
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
