/* Data behind the brief builder. Static on purpose: free, no keys, nothing the user types leaves the browser.
   Fonts: only Google Fonts families whose metadata lists the Hebrew subset (google-font-metadata 6.0.8), all under open licences.
   Palettes, techniques and references are a curated motion-design library. */
window.BRIEF_DATA = (() => {
  const EASE = {
    expo: { css: 'cubic-bezier(.16, 1, .3, 1)', name: 'expo out' },
    quint: { css: 'cubic-bezier(.22, 1, .36, 1)', name: 'quint out' },
    back: { css: 'cubic-bezier(.34, 1.56, .64, 1)', name: 'back out (עם overshoot קטן)' },
    inOut: { css: 'cubic-bezier(.65, 0, .35, 1)', name: 'cubic in-out' },
    sine: { css: 'cubic-bezier(.37, 0, .63, 1)', name: 'sine in-out' }
  };
  // the motion vocabulary, each entry phrased as an instruction
  const TECH = {
    mask: 'חשיפה במסכה: טקסט ותמונות נחשפים מאחורי מסכה שזזה, במקום פשוט להופיע',
    stagger: 'דירוג: אותיות או מילים נכנסות אחת אחרי השנייה, בהפרש של 30–60ms',
    morph: 'מורפינג: צורה אחת הופכת לבאה, וכך מחברת בין סצנות',
    match: 'מעבר התאמה (match cut): אלמנט מסצנה אחת ממשיך לחיות בסצנה הבאה',
    parallax: 'פרלקסה: שכבות בעומקים שונים זזות במהירויות שונות',
    liquid: 'נוזלים: מסכות נוזליות, טיפות ומזיגות שחושפות את התוכן',
    squash: 'squash & stretch: מעיכה בנחיתה ומתיחה בקפיצה',
    ui: 'בניית ממשק: מסך נבנה מקווים, נקודות ושכבות, ואז מתעורר',
    count: 'מספרים רצים: מספר עולה עד היעד ונעצר בקפיצה קטנה',
    line: 'שרטוט קו: קו משרטט את עצמו והופך לצורה או למילה',
    snap: 'הצמדה לגריד: אלמנטים מפוזרים מתיישרים לגריד ברגע אחד',
    glitch: 'גליץ׳ מבוקר: פיצול ערוצי צבע לרגע, רק במעברים',
    ramp: 'speed ramp: האצה חדה ואז האטה, כדי לתת משקל לרגע',
    camera: 'מצלמה וירטואלית: זום ופאן איטיים על קומפוזיציה גדולה מהפריים',
    slap: 'תוויות נוחתות: מדבקות ותוויות שנחבטות על המסך עם overshoot',
    confetti: 'שכבות חגיגה: קונפטי, סרטים וניצוצות שנוחתים בדיוק בשיא',
    hand: 'כתב יד: מילה נכתבת בקו, כמו ביד, בקצב של כתיבה אמיתית',
    path: 'טקסט על מסלול: מילים זורמות על קו מעוקל או על סרט',
    editorial: 'מסגור אדיטוריאלי: מסגרות ותמונות מתחלפות בקצב, כמו עמודי מגזין',
    graph: 'גרף שצומח: קו או עמודות עולים, והקצה הופך לחץ קדימה',
    grain: 'טקסטורה: גרעין עדין או נייר על כל הפריים, כדי שלא ירגיש סטרילי'
  };
  // per content world: fonts (display + text), a starting palette, the techniques that fit, and style references to draw from
  const WORLD = {
    food: { fonts: ['Suez One', 'Rubik'], hex: ['#F6EBDD', '#E3A72F', '#C8442F', '#5B7F3A', '#2B1B12'], tech: ['liquid', 'camera', 'slap'], refs: 'food motion design, macro food commercials, appetite appeal' },
    tech: { fonts: ['Heebo', 'IBM Plex Sans Hebrew'], hex: ['#0B0F1A', '#141B2D', '#5B5BFF', '#3EE6C1', '#F2F4F8'], tech: ['ui', 'mask', 'count'], refs: 'product launch motion, UI animation reels, Apple-style keynote motion' },
    fashion: { fonts: ['Frank Ruhl Libre', 'Assistant'], hex: ['#F4EEE6', '#111111', '#D9B8A0', '#8C6B4F', '#C9A86A'], tech: ['editorial', 'mask', 'camera'], refs: 'fashion editorial motion, luxury brand films, magazine layouts in motion' },
    realestate: { fonts: ['Assistant', 'Heebo'], hex: ['#EFEDE8', '#B9B2A6', '#6E7B5B', '#2F3A44', '#9CC3D5'], tech: ['line', 'parallax', 'camera'], refs: 'architectural visualization motion, blueprint animation, real estate brand films' },
    health: { fonts: ['Varela Round', 'Assistant'], hex: ['#F7FAFA', '#BFE6E0', '#7FC8E8', '#2E6F8E', '#FFB4A2'], tech: ['line', 'morph', 'stagger'], refs: 'healthcare explainer motion, soft 2D medical animation, calm brand motion' },
    edu: { fonts: ['Rubik', 'Varela Round'], hex: ['#FFFDF5', '#FFC83A', '#3D7BFF', '#FF6B5B', '#1E2A44'], tech: ['line', 'stagger', 'snap'], refs: 'explainer motion graphics, infographic animation, kinetic education videos' },
    finance: { fonts: ['Frank Ruhl Libre', 'Heebo'], hex: ['#F5F3EE', '#0E2A47', '#1F5C4A', '#C8A04A', '#8A94A6'], tech: ['graph', 'count', 'mask'], refs: 'fintech motion design, data storytelling, corporate brand motion' },
    celebration: { fonts: ['Karantina', 'Rubik'], hex: ['#FFF4E6', '#FF8FB8', '#FFC83A', '#7A5CFF', '#2A1A3D'], tech: ['confetti', 'squash', 'hand'], refs: 'celebration kinetic typography, party invitation motion, festive title sequences' },
    sport: { fonts: ['Secular One', 'Heebo'], hex: ['#0A0A0A', '#F5F5F5', '#D7FF3A', '#FF3B30', '#5A5A5A'], tech: ['ramp', 'glitch', 'stagger'], refs: 'sports promo motion, Nike-style kinetic type, high-energy edits' },
    nonprofit: { fonts: ['Rubik', 'Playpen Sans Hebrew'], hex: ['#FBF6EE', '#F2A65A', '#3E7C6B', '#2B3A67', '#E8D5B7'], tech: ['hand', 'morph', 'grain'], refs: 'charity campaign motion, hand-drawn animation, human storytelling films' },
    travel: { fonts: ['Assistant', 'Bellefair'], hex: ['#FDF6EC', '#4FB3D9', '#F2B880', '#E26D5C', '#24476B'], tech: ['path', 'camera', 'parallax'], refs: 'travel brand motion, map route animation, destination title cards' },
    kids: { fonts: ['Fredoka', 'Varela Round'], hex: ['#FFF8EC', '#FFD23F', '#3BCEAC', '#FF6F91', '#5468FF'], tech: ['squash', 'morph', 'slap'], refs: 'playful 2D motion, children brand animation, bouncy character type' },
    retail: { fonts: ['Rubik', 'Heebo'], hex: ['#FFFFFF', '#111111', '#FF4D2E', '#FFD400', '#E9E6E1'], tech: ['slap', 'camera', 'count'], refs: 'product commercial motion, e-commerce promo, sale announcement motion' },
    stage: { fonts: ['Rubik Glitch', 'Heebo'], hex: ['#0B0B12', '#FF2E88', '#7A5CFF', '#F5F2EA', '#2DE2E6'], tech: ['glitch', 'ramp', 'stagger'], refs: 'festival line-up motion, concert visuals, event title sequences' },
    auto: { fonts: ['Secular One', 'IBM Plex Sans Hebrew'], hex: ['#0D0F12', '#2A2F36', '#C9CED6', '#E4002B', '#F4F4F4'], tech: ['ramp', 'camera', 'line'], refs: 'automotive commercial motion, sleek car reveal, speed lines and light trails' }
  };
  // the first second: hook ideas by video type
  const HOOKS = {
    promo: ['זום מתקריב קיצוני של חומר מהעולם שלכם אל המילה הראשונה', 'משפט של שלוש מילים שנכנס מילה אחרי מילה על מסך ריק', 'מספר אחד גדול שרץ ונעצר בקפיצה קטנה'],
    cta: ['שאלה שפונה אל הצופה, בגודל מלא, כבר בפריים הראשון', 'ההטבה או המחיר קופצים לפני כל הסבר', 'אלמנט שנופל ונוחת בדיוק במרכז, עם אימפקט קטן'],
    msg: ['מסך שקט עם מילה אחת שנושמת', 'דימוי מטאפורי מהעולם שלכם שמתגלה לאט', 'טקסט שנכתב מול העיניים, אות אחרי אות'],
    other: ['תנועה מפתיעה כבר בפריים הראשון', 'המילה החשובה ביותר, ענקית, לפני כל דבר אחר', 'קומפוזיציה שנבנית מנקודה אחת']
  };
  // transitions by tone; pacing by running time
  const TRANSITIONS = {
    'יוקרתי ומדויק': 'wipe במסכה עם easing חד, ומעבר התאמה על צורה או קו',
    'אנרגטי ושובב': 'whip pan עם טשטוש תנועה, וחיתוך על אימפקט עם טלטול קטן',
    'חם ומרגש': 'dissolve דרך טקסטורה, ומעבר התאמה איטי בין סצנות',
    '': 'מעבר התאמה בין סצנות, ו-wipe במסכה במעברים בין חלקים'
  };
  const PACING = { '15': '4–6 סצנות, 2–3 שניות כל אחת', '30': '7–9 סצנות, עם רגע עצירה אחד לפני הסוף', '60': '10–14 סצנות, עם רגע נשימה באמצע', song: 'סצנה לכל שורה או ביטוי, והחלפת טיפול בכל חלק', '': 'סצנה כל 2–4 שניות, עם רגע עצירה לפני הסוף' };
  // Hebrew typesetting rules that generic motion templates usually get wrong
  const HEB = 'בעברית: בדוק את כיוון השורה (bidi) בכל שורה שמשלבת מספרים, אנגלית או פיסוק; השתמש בגרשיים עבריים (״ ׳); בלי ריווח אותיות מוגדל; ריווח שורות הדוק בכותרות.';
  const DEFAULT = { fonts: ['Secular One', 'Heebo'], tech: ['mask', 'stagger', 'match'], refs: 'award-winning kinetic typography, title sequence design' };
  // easing and timing follow the chosen tone; without a tone, the content world's character decides
  const TONE_EASE = { 'יוקרתי ומדויק': ['expo', '600–900ms'], 'אנרגטי ושובב': ['back', '250–400ms'], 'חם ומרגש': ['quint', '700–1000ms'] };
  const WORLD_EASE = { tech: ['expo', '300–500ms'], sport: ['back', '200–350ms'], kids: ['back', '300–450ms'], celebration: ['back', '300–450ms'], fashion: ['expo', '700–1000ms'], realestate: ['inOut', '700–1000ms'], health: ['sine', '600–900ms'], finance: ['quint', '400–600ms'] };
  return { EASE, TECH, WORLD, DEFAULT, TONE_EASE, WORLD_EASE, HOOKS, TRANSITIONS, PACING, HEB };
})();
