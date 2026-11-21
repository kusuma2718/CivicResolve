export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  dir: 'ltr' | 'rtl';
  isScheduled: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', dir: 'ltr', isScheduled: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese', dir: 'ltr', isScheduled: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', dir: 'ltr', isScheduled: true },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', dir: 'ltr', isScheduled: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', dir: 'ltr', isScheduled: true },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', script: 'Perso-Arabic', dir: 'rtl', isScheduled: true },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', dir: 'ltr', isScheduled: true },
  { code: 'mni', name: 'Manipuri (Meitei)', nativeName: 'মৈতৈলোন্', script: 'Meetei Mayek / Bengali', dir: 'ltr', isScheduled: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', dir: 'ltr', isScheduled: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', dir: 'ltr', isScheduled: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari', dir: 'ltr', isScheduled: true },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki', dir: 'ltr', isScheduled: true },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'Arabic / Devanagari', dir: 'rtl', isScheduled: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', dir: 'ltr', isScheduled: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', dir: 'ltr', isScheduled: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Perso-Arabic', dir: 'rtl', isScheduled: true },
];

export function isRTL(code: string): boolean {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.dir === 'rtl';
}

export function getLanguageInfo(code: string): LanguageInfo {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
