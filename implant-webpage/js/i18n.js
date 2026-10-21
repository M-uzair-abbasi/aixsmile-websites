// ===== Language =====
// German is the page's own language and lives in index.html, where crawlers and
// visitors without JavaScript read it. On load this module remembers the German
// text of every [data-i18n] element; English comes from EN below. Switching back
// to German restores what was remembered, so the two can never drift apart.
// (The same scheme as the bleaching page.)
//
// DYN holds the strings that scripts build at runtime (the booking widget, the
// next free slot in the hero, the 60-second check, the price line). Those exist
// in both languages here.

// A price-from figure for the costs section. The practice has not supplied one:
// leave it null and no price is shown. A number (e.g. 1900) shows one line,
// worded in DYN.*.cost.priceFrom, in both languages.
export const PRICE_FROM = null;

const STORAGE_KEY = 'aixsmileLang';

export const EN = {
  skip: 'Skip to content',
  nav: {
    home: 'AIXSMILE, back to top', sections: 'Sections', book: 'Book now', call: 'Call us',
    situation: 'Your situation', ablauf: 'How it works', kosten: 'Costs', fragen: 'Questions',
  },
  hero: {
    alt: 'A woman in her late fifties with silver-grey hair laughing warmly, with natural-looking teeth (illustration, AI-generated)',
    l1: 'Dental implants in Aachen.',
    l2: 'Planned in 3D first.',
    lead: 'Fixed teeth instead of a gap or a denture. Whether one tooth is missing, several are, or your denture moves: we plan every implant on a 3D X-ray first and talk the plan through with you before anything happens at all.',
    book: 'Book a consultation',
    how: 'How it works',
    f1: '3D X-ray (CBCT)', f2: 'Local anaesthesia', f3: '5 languages spoken',
    plateLabel: 'Consultations at the practice', plateValue: 'Mon · Tue · Thu, 9 am to 4 pm',
  },
  sit: {
    h2: 'Which of these sounds familiar?',
    lead: 'Tap yours and you will see how we go about it.',
    t1: 'One tooth is missing.',
    a1: 'An implant replaces the root and carries a crown of its own. The neighbouring teeth stay as they are. A bridge would mean grinding them down, and I avoid that wherever I can.',
    t2: 'Several teeth are missing.',
    a2: 'Often two implants carry a bridge spanning three or four teeth. How many you need shows up in the plan on the 3D image.',
    t3: 'My denture moves.',
    a3: 'Two to four implants can hold a denture in place, either removable on press studs or screwed in for good. What suits your jaw becomes clear after the 3D X-ray.',
    t4: 'I was told there isn’t enough bone.',
    a4: 'Bone can often be built up beforehand or during the procedure. The 3D X-ray shows exactly how much there is and what is needed.',
    t5: 'I’d like a second opinion.',
    a5: 'Bring your X-rays and the treatment and cost plan you were given. I look at both carefully and tell you honestly what I think. Even if the other plan is a good one.',
    book: 'Book about this',
  },
  st1: { aria: 'An implant replaces the root, not just the tooth.', a: 'An implant replaces the root,', b: 'not just the tooth.' },
  xray: {
    h2: 'What’s under the crown.',
    lead: 'Drag the slider. On the left, the teeth as you see them in the mirror; on the right, the same teeth on an X-ray: the implant sits in the bone like a root of its own.',
    f1: 'The neighbouring teeth stay untouched.',
    f2: 'The bone keeps being loaded.', f2s: 'That counteracts bone loss.',
    f3: 'It feels like a tooth of your own.', f3s: 'And looks like one.',
    altX: 'X-ray view: under the crown a threaded implant stands in the bone (illustration)',
    altR: 'The upper front teeth with gums; one of them is a crown on an implant (illustration)',
    lCrown: 'Crown', lAbut: 'Abutment', lImpl: 'Implant', lBone: 'Bone',
    tag: 'Illustration',
    sideL: 'In the mirror', sideR: 'On the X-ray',
    range: 'Compare with the X-ray view: moving the slider left shows more X-ray',
    hint: 'Drag or tap, the picture follows.',
  },
  cmp: {
    h2: 'Implant, bridge or denture?',
    lead: 'All three close a gap. The difference lies in what happens to the neighbouring teeth and the bone, and of course in what it costs.',
    aria: 'Implant, bridge and partial denture compared',
    c1: 'Implant', c2: 'Bridge', c3: 'Partial denture',
    r1: 'Neighbouring teeth', r1a: 'stay untouched', r1b: 'are ground down', r1c: 'carry clasps',
    r2: 'Bone beneath', r2a: 'keeps being loaded', r2b: 'recedes over time', r2c: 'recedes over time',
    r3: 'When eating', r3a: 'stays fixed', r3b: 'stays fixed', r3c: 'can move',
    r4: 'Time', r4a: 'a few months', r4b: 'a few weeks', r4c: 'a few weeks',
    r5: 'Cost', r5a: 'highest', r5b: 'medium', r5c: 'lowest',
    note: 'What suits you depends on your teeth and your bone. We work that out at the consultation.',
  },
  path: {
    h2: 'Four steps to a fixed tooth.',
    aria: 'The four steps',
    t1: 'Consultation and 3D X-ray',
    p1: 'First we listen and take a look in your mouth. A 3D X-ray (CBCT) shows how much bone there is and where the nerves and the sinus run.',
    t2: 'Planning on the computer',
    p2: 'On the 3D image we set the position, length and angle of every implant; if needed, a drilling guide is made from it. Before anything starts you receive a written treatment and cost plan.',
    t3: 'The procedure',
    p3: 'Under local anaesthesia we place the implant exactly as planned. Afterwards the area may be slightly swollen for a few days.',
    t4: 'Healing and the crown',
    p4: 'Over a few weeks to a few months the implant bonds with the bone; until then you wear a temporary solution. Then we fit the finished crown.',
    alt1: '3D X-ray of the upper jaw with all teeth and roots (illustration)',
    alt2: 'The planned implant drawn as an outline in the gap, with the sleeve of the drilling guide above it (illustration)',
    alt3: 'X-ray view: the placed implant in the bone (illustration)',
    alt4: 'The finished crown on the implant between the natural teeth (illustration)',
  },
  band: {
    alt: 'A man in his early sixties with a grey beard laughing openly (illustration, AI-generated)',
    line: 'Laughing again without thinking about the gap.',
    cta: 'Book a consultation',
  },
  calm: {
    h2: 'Feeling nervous about it is normal.',
    lead: 'That is why I explain beforehand exactly what will happen and why.',
    t1: 'Explained first, treated second.', p1: 'We go through the procedure with you on the 3D image, step by step.',
    t2: 'Local anaesthesia.', p2: 'You feel very little of the placement itself. Most people tell me afterwards it was less bad than they had feared.',
    t3: 'More calm, if you want it.', p3: 'If you are very anxious, tell me. We will find a way for you to go into the treatment feeling calmer.',
    t4: 'Afterwards.', p4: 'A few days of swelling is normal. Cooling and an ordinary painkiller are usually enough.',
  },
  st2: {
    aria: 'A gap doesn’t stay the way it is.', a: 'A gap doesn’t stay', b: 'the way it is.',
    small: 'Without a root the bone beneath slowly recedes, and the neighbouring teeth can tip into the gap.',
  },
  quiz: {
    h2: 'Your next step in 60 seconds.',
    lead: 'Three short questions. At the end you will see what matters in your case. You can take the answers straight into your booking.',
    back: 'Back',
    q1: 'What applies to you?', q1a: 'One tooth is missing', q1b: 'Several teeth are missing', q1c: 'My denture doesn’t hold', q1d: 'I have a plan and want a second opinion',
    q2: 'Since when?', q2a: 'Less than six months', q2b: 'Six months to two years', q2c: 'More than two years', q2d: 'The tooth is still there but has to come out',
    q3: 'What matters most to you?', q3a: 'As little anxiety as possible', q3b: 'Clarity about the cost', q3c: 'Chewing firmly again soon', q3d: 'A natural look',
    resH: 'What matters in your case:',
    book: 'Book with these answers',
    again: 'Start again',
  },
  cost: {
    h2: 'What an implant costs.',
    p1: 'We name the exact price once we know your situation. It depends mainly on the four points below.',
    p2: 'After the planning you receive a written treatment and cost plan. Only when you agree does anything begin.',
    fh: 'What sets the price',
    f1: 'Number of implants', f2: 'Bone grafting, if needed', f3: 'Crown, bridge or denture', f4: 'Temporary solution while it heals',
    gH: 'Statutory insurance',
    gP: 'The implant itself is usually a private service. For the crown, bridge or denture on top your insurer pays a fixed subsidy, more with a complete bonus booklet.',
    pH: 'Private insurance',
    pP: 'With the treatment and cost plan you can check with your insurer beforehand what your plan covers.',
  },
  doc: {
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
    h2: 'Who treats you.',
    p: 'I am Novin Molaie, the dentist at the AIXSMILE dental practice in the centre of Aachen. At the consultation I take time for your questions and show you on the 3D image what is possible in your case, and what is not.',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    f1h: 'languages', f1: 'German, English, Farsi, Turkish, Arabic',
    f2h: 'Planned in 3D', f2: 'X-ray and planning on the computer',
  },
  bk: {
    h2: 'Open consultation times.',
    p: 'These times are genuinely open right now. Pick one, enter your name and phone number, done.',
    fact1: 'A written treatment and cost plan before any treatment',
    fact2: 'Cancel with one click in the appointment email',
    fact3: 'Prefer to call?',
    unavailable: 'The open times cannot be loaded right now.', unavailableCall: 'Call us:',
    step1: 'Time', step2: 'Your details', step3: 'Booked',
    taken: 'Someone booked this time in the meantime. Please pick another one.',
    daysAria: 'Days', morning: 'Morning', afternoon: 'Afternoon',
    quickH: 'Fastest', calPrev: 'Previous month', calNext: 'Next month',
    timesH: 'Time', timesEmpty: 'Pick a day and the times appear here.',
    noDays: 'No time is open online at the moment. On the phone we usually still find one.',
    change: 'Change',
    first: 'First name *', last: 'Last name *', phone: 'Phone *', email: 'Email *',
    addNote: '+ Add a note', note: 'Note (optional)',
    privacy: 'What you enter goes straight to the AIXSMILE dental practice and serves this appointment alone. This page keeps no data of its own.',
    doneH: 'Booked. See you at the practice.',
    doneWhere: 'You come to Großkölnstraße 22-28, 52062 Aachen.',
    nextH: 'What happens next',
    next1: 'The appointment email is on its way with date, time and address.',
    next2: 'A short reminder arrives the day before.',
    next3: 'You can cancel any time via the link in the appointment email.',
    calendar: 'Save appointment', route: 'Way to the practice',
  },
  faq: {
    h2: 'Common questions about implants.',
    topicsAria: 'Topics',
    tPain: 'Pain', tCost: 'Cost', tTime: 'Timing', tBone: 'Bone', tCare: 'Care',
    aside: 'Your question isn’t here? We are glad to answer it on the phone:',
    q1: 'Does placing the implant hurt?',
    a1: 'Not during the procedure. The area is numbed, so you feel pressure but no pain. Most patients tell me afterwards they had imagined it far worse. If you are very nervous, talk to me, there are ways to help.',
    q2: 'How will I feel after the procedure?',
    a2: 'Expect a few days of swelling and a feeling of pressure, much like after having a tooth out. With cooling and an ordinary painkiller it is easy to manage. We explain what to watch out for in the first days on the day of treatment.',
    q3: 'What does statutory health insurance pay?',
    a3: 'The implant itself is usually a private service. For the restoration on top, your insurer pays a fixed subsidy, which is higher with a complete bonus booklet. What exactly to expect is set out in the treatment and cost plan.',
    q4: 'Do I get a cost plan beforehand?',
    a4: 'Yes. After the planning you receive a written treatment and cost plan with no hidden costs. Treatment only starts once you have agreed.',
    q5: 'How long does healing take?',
    a5: 'That depends on your situation and the jawbone. It usually takes a few weeks to a few months until the implant has bonded firmly with the bone. We agree the likely timeline with you after the diagnostics.',
    q11: 'Is it worth travelling from Cologne or Düren?',
    a11: 'Many of our implant patients do not live in Aachen itself. From Cologne the train takes about 40 minutes to Aachen main station, from Düren around 25, and from there it is a short walk or two bus stops to Großkölnstraße. By car you park right opposite in the car park. The consultation and the 3D X-ray need one visit; we schedule the placement and the crown so that you travel as rarely as possible.',
    q6: 'Will I have a gap while it heals?',
    a6: 'Usually not. A temporary restoration keeps your appearance well cared for during this time. Which one suits depends on the site and your restoration.',
    q7: 'Is everyone suitable for implants?',
    a7: 'Most people, but not everyone. What I need is enough bone and healthy gums. Whether implants make sense for you is something we clarify with the 3D X-ray at the consultation.',
    q8: 'I was told my bone isn’t enough. What now?',
    a8: 'That does not mean it cannot be done. Bone can often be built up beforehand or during the procedure. How much there is and what would be needed shows on the 3D X-ray at the consultation.',
    q9: 'How long do implants last?',
    a9: 'With good oral hygiene and regular check-ups, implants can last many years and often a lifetime. Healthy gums, careful care and avoiding heavy smoking are decisive. Honestly, I cannot guarantee a specific number of years. Nobody can.',
    q10: 'How do I care for implants?',
    a10: 'Essentially like your own teeth: brush thoroughly, clean between the teeth every day and come to the practice regularly for check-ups and cleaning. That keeps the implant and the gums healthy.',
  },
  place: {
    h2: 'In the centre of Aachen, on Großkölnstraße.',
    p: 'A few minutes from the Markt and the Bushof bus station; the Großkölnstraße car park is right opposite.',
    p2: 'Our implant patients come from all over Aachen and the Städteregion, from Eschweiler, Stolberg, Würselen and Herzogenrath, from the Düren and Heinsberg districts, and regularly from Cologne and nearby Belgium and the Netherlands. From the main station it is two bus stops, from the A4 and A44 about ten minutes.',
    hoursH: 'Opening hours', hours: 'Mon · Tue · Thu, 9 am to 4 pm', hoursNote: 'By appointment only',
    addrH: 'Address', telH: 'Phone', revH: 'Reviews', rev: 'On Google, unedited',
    mapAria: 'Map: Großkölnstraße 22-28, 52062 Aachen. Opens the route in your maps app',
    mapGo: 'Open route',
  },
  foot: {
    line: 'One appointment, and you’ll know what’s possible.',
    book: 'Book a consultation',
    hours: 'Mon · Tue · Thu, 9 am to 4 pm, by appointment only',
    langs: 'German, English, Farsi, Turkish, Arabic',
    impressum: 'Legal notice', datenschutz: 'Privacy', main: 'Implantology at AIXSMILE',
  },
  mq: { a: 'Consultation · 3D X-ray · Planning · Procedure · Healing · Crown ·' },
  mbar: { aria: 'Quick access', book: 'Book a consultation' },
};

export const DYN = {
  de: {
    meta: {
      title: 'Zahnimplantate Aachen: Kosten, Ablauf, 3D-Planung | AIXSMILE',
      description: 'Zahnimplantate in Aachen bei AIXSMILE, Großkölnstraße: 3D-Röntgen, Planung am Computer, Eingriff unter örtlicher Betäubung, schriftlicher Heil- und Kostenplan vorab. Auch für Patienten aus Köln, Düren, Heinsberg und der Euregio. Beratungstermin online buchen.',
    },
    plate: { label: 'Nächster freier Beratungstermin' },
    cost: { priceFrom: (n) => `Ein einzelnes Implantat mit Krone beginnt bei etwa ${n} €; den genauen Betrag nennt Ihr Heil- und Kostenplan.` },
    note: { sit: 'Anliegen: ', quiz: 'Aus dem 60-Sekunden-Check: ' },
    quiz: {
      lines: [
        [
          'Für einen einzelnen Zahn reicht meist ein Implantat mit eigener Krone; die Nachbarzähne bleiben unberührt.',
          'Bei mehreren Lücken prüfen wir, ob wenige Implantate eine Brücke tragen können.',
          'Bei einer wackelnden Prothese klären wir, ob wenige Implantate sie festhalten können.',
          'Bringen Sie Ihren Heil- und Kostenplan und vorhandene Röntgenbilder mit; wir sehen uns beides in Ruhe an.',
        ],
        [
          'Ist die Lücke noch frisch, ist meist noch viel Knochen da.',
          'Nach einem halben bis zwei Jahren schauen wir im 3D-Röntgen genau auf den Knochen.',
          'Fehlt ein Zahn schon länger, hat sich der Knochen oft zurückgebildet. Ob er aufgebaut werden muss, zeigt das 3D-Röntgen.',
          'Muss ein Zahn noch raus, planen wir das Entfernen und das Implantat gleich zusammen.',
        ],
        [
          'Sagen Sie es uns beim Termin: Wir erklären jeden Schritt vorher am Bild, und Sie bestimmen das Tempo.',
          'Nach der Planung bekommen Sie einen schriftlichen Heil- und Kostenplan, bevor irgendetwas beginnt.',
          'Wie schnell es wieder fest wird, hängt vom Knochen ab. Die Planung zeigt auch, welche Übergangslösung bis dahin passt.',
          'Die Krone wird in Form und Farbe an Ihre Nachbarzähne angepasst.',
        ],
      ],
    },
    bk: {
      submit: 'Termin verbindlich buchen', submitting: 'Wird gebucht …',
      service: 'Implantat-Beratung',
      icsSummary: 'Implantat-Beratung bei AIXSMILE',
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
      title: 'Dental implants Aachen: costs, procedure, 3D planning | AIXSMILE',
      description: 'Dental implants in Aachen at AIXSMILE, Großkölnstraße: 3D X-ray, planning on the computer, placement under local anaesthesia, a written treatment and cost plan beforehand. Also for patients from Cologne, Düren, Heinsberg and the Euregio. Book a consultation online.',
    },
    plate: { label: 'Next open consultation' },
    cost: { priceFrom: (n) => `A single implant with a crown starts at around €${n}; your treatment and cost plan gives the exact amount.` },
    note: { sit: 'Concern: ', quiz: 'From the 60-second check: ' },
    quiz: {
      lines: [
        [
          'For a single tooth, one implant with a crown of its own is usually enough; the neighbouring teeth stay untouched.',
          'With several gaps we check whether a few implants can carry a bridge.',
          'With a denture that moves we check whether a few implants can hold it in place.',
          'Bring your treatment and cost plan and any X-rays you have; we will look at both carefully.',
        ],
        [
          'If the gap is recent, there is usually still plenty of bone.',
          'After six months to two years we look closely at the bone on the 3D X-ray.',
          'If a tooth has been missing for longer, the bone has often receded. Whether it needs building up shows on the 3D X-ray.',
          'If a tooth still has to come out, we plan the removal and the implant together.',
        ],
        [
          'Tell us at the appointment: we explain every step beforehand on the image, and you set the pace.',
          'After the planning you receive a written treatment and cost plan before anything begins.',
          'How soon it is firm again depends on the bone. The plan also shows which temporary solution suits you until then.',
          'The crown is matched in shape and shade to your neighbouring teeth.',
        ],
      ],
    },
    bk: {
      submit: 'Book appointment', submitting: 'Booking …',
      service: 'Implant consultation',
      icsSummary: 'Implant consultation at AIXSMILE',
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
