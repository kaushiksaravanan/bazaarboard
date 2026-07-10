/**
 * Language catalog — every entry maps a UI language code to:
 *  - the human-readable name (rendered in both English and native script)
 *  - the CSS class that pulls the right Noto Sans font family (matches
 *    tailwind.config.ts fontFamily entries)
 *  - the Gemini prompt fragment used to tell the model which script
 *    to render at typography-fidelity
 *
 * India has 22 official languages and 100+ scripts commonly used in
 * commerce. Judges want to SEE the app render 5+ scripts side-by-side.
 * This catalog is the source of truth for the language toggle grid.
 */

export interface Language {
  code: string;
  englishName: string;
  nativeName: string;
  fontClass: string;
  scriptHint: string;
  sampleProduct: string;
  samplePrice: string;
}

export const LANGUAGES: Language[] = [
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
    fontClass: "font-sans",
    scriptHint: "Latin script (English)",
    sampleProduct: "Mango pulp",
    samplePrice: "₹120 / kg",
  },
  {
    code: "hi",
    englishName: "Hindi",
    nativeName: "हिन्दी",
    fontClass: "font-devanagari",
    scriptHint:
      "Devanagari script (Hindi). Preserve nukta, chandrabindu, and conjunct consonants.",
    sampleProduct: "मैंगो पल्प",
    samplePrice: "₹120 / किलो",
  },
  {
    code: "ta",
    englishName: "Tamil",
    nativeName: "தமிழ்",
    fontClass: "font-tamil",
    scriptHint:
      "Tamil script. Preserve pulli, aytham, and Tamil-specific ligatures (kṣ, śrī).",
    sampleProduct: "மாம்பழம் கூழ்",
    samplePrice: "₹120 / கிலோ",
  },
  {
    code: "bn",
    englishName: "Bengali",
    nativeName: "বাংলা",
    fontClass: "font-bengali",
    scriptHint:
      "Bengali script. Preserve conjunct consonants (yuktakshar) and reph.",
    sampleProduct: "আমের পাল্প",
    samplePrice: "₹120 / কেজি",
  },
  {
    code: "te",
    englishName: "Telugu",
    nativeName: "తెలుగు",
    fontClass: "font-telugu",
    scriptHint:
      "Telugu script. Preserve gunintam vowel signs and virama-joined conjuncts.",
    sampleProduct: "మామిడి పల్ప్",
    samplePrice: "₹120 / కిలో",
  },
  {
    code: "kn",
    englishName: "Kannada",
    nativeName: "ಕನ್ನಡ",
    fontClass: "font-kannada",
    scriptHint:
      "Kannada script. Preserve subjoined-consonant forms (kagunita) and anusvara.",
    sampleProduct: "ಮಾವಿನ ಪಲ್ಪ್",
    samplePrice: "₹120 / ಕಿಲೋ",
  },
  {
    code: "ml",
    englishName: "Malayalam",
    nativeName: "മലയാളം",
    fontClass: "font-malayalam",
    scriptHint:
      "Malayalam script. Preserve chillu letters and complex conjuncts (kk, ll, nt).",
    sampleProduct: "മാമ്പഴ പൾപ്പ്",
    samplePrice: "₹120 / കിലോ",
  },
  {
    code: "pa",
    englishName: "Punjabi (Gurmukhi)",
    nativeName: "ਪੰਜਾਬੀ",
    fontClass: "font-gurmukhi",
    scriptHint:
      "Gurmukhi script. Preserve tippi, bindi, and adhak.",
    sampleProduct: "ਅੰਬ ਦਾ ਪਲਪ",
    samplePrice: "₹120 / ਕਿੱਲੋ",
  },
  {
    code: "gu",
    englishName: "Gujarati",
    nativeName: "ગુજરાતી",
    fontClass: "font-gujarati",
    scriptHint:
      "Gujarati script. Preserve anusvara, visarga, and conjunct forms.",
    sampleProduct: "કેરીનો પલ્પ",
    samplePrice: "₹120 / કિલો",
  },
];

export function findLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
