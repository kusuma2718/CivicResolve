import { en } from './en';
import { hi } from './hi';
import { ur } from './ur';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Helper to clone with custom deep overrides
function createLang(base: typeof en, overrides: DeepPartial<typeof en>): typeof en {
  return {
    ...base,
    ...overrides,
    nav: { ...base.nav, ...(overrides.nav || {}) } as any,
    hero: { ...base.hero, ...(overrides.hero || {}) } as any,
    stats: { ...base.stats, ...(overrides.stats || {}) } as any,
    howItWorks: { ...base.howItWorks, ...(overrides.howItWorks || {}) } as any,
    features: { ...base.features, ...(overrides.features || {}) } as any,
    report: { ...base.report, ...(overrides.report || {}) } as any,
    track: { ...base.track, ...(overrides.track || {}) } as any,
    admin: { ...base.admin, ...(overrides.admin || {}) } as any,
    common: { ...base.common, ...(overrides.common || {}) } as any,
  };
}

// Bengali (বাংলা)
export const bn = createLang(en, {
  nav: {
    logoSubtitle: 'পৌর অ্যাকশন নেটওয়ার্ক',
    home: 'হোম',
    report: 'সমস্যা জানান',
    track: 'সমস্যা ট্র্যাক করুন',
    admin: 'প্রশাসন পোর্টাল',
    lookup: 'আইডি খুঁজুন',
    getStarted: 'শুরু করুন',
  },
  hero: {
    badge: 'পরবর্তী প্রজন্মের নাগরিক পরিকাঠামো ব্যবস্থাপনা',
    titleLine1: 'আপনার শহর।',
    titleHighlight: 'আপনার কণ্ঠস্বর।',
    titleLine3: 'বাস্তব পরিবর্তন।',
    description: 'নাগরিক সমস্যার অভিযোগ জানান, সঠিক কর্তৃপক্ষের সাথে যুক্ত হন এবং প্রতিটি পদক্ষেপ ট্র্যাক করুন।',
    reportBtn: 'সমস্যা জানান',
    dashboardBtn: 'ড্যাশবোর্ড দেখুন',
    trustVerified: 'যাচাইকৃত পৌর প্রেরণ',
    trustSla: 'সরকারি পরিষেবা এসএলএ',
    trustTurnaround: 'গড়ে ~৩৬ ঘণ্টায় সমাধান',
  },
  report: {
    badge: 'জনসাধারণের অভিযোগ পোর্টাল',
    title: 'নাগরিক সমস্যা রিপোর্ট করুন',
    subtitle: 'সঠিক বিবরণ এবং ছবির প্রমাণ দিন যাতে পৌর দল দ্রুত সমাধান করতে পারে।',
    categoryLabel: 'নাগরিক বিভাগ *',
    titleLabel: 'সমস্যার শিরোনাম *',
    descLabel: 'বিস্তারিত বিবরণ *',
    locationLabel: 'ঠিকানা বা ল্যান্ডমার্ক *',
    cityLabel: 'শহর *',
    stateLabel: 'রাজ্য *',
    nameLabel: 'আপনার নাম *',
    emailLabel: 'ইমেইল ঠিকানা *',
    submitBtn: 'অভিযোগ জমা দিন',
  },
  track: {
    title: 'সম্প্রদায় অভিযোগ ট্র্যাকার',
    totalComplaints: 'মোট অভিযোগ',
    reportedComplaints: 'নথিভুক্ত',
    inProgressComplaints: 'চলমান',
    resolvedComplaints: 'মীমাংসিত',
    searchPlaceholder: 'আইডি, শিরোনাম বা অবস্থান দিয়ে খুঁজুন...',
  },
  common: {
    demoData: 'ডেমো ডেটা',
    citizenEntry: 'নাগরিক এন্ট্রি',
    critical: 'জরুরি',
    high: 'উচ্চ অগ্রাধিকার',
    medium: 'মাঝারি',
    low: 'নিম্ন',
    reported: 'নথিভুক্ত',
    underReview: 'পর্যালোচনাধীন',
    inProgress: 'চলমান',
    resolved: 'মীমাংসিত',
    rejected: 'বাতিল',
    language: 'ভাষা',
    disclaimer: 'স্বয়ংক্রিয় সহায়তা সহ ২২টি তফশিলি ভাষায় স্থানীয়করণ। পর্যালোচনা চলছে।',
  },
});

// Tamil (தமிழ்)
export const ta = createLang(en, {
  nav: {
    logoSubtitle: 'நகராட்சி நடவடிக்கை நெட்வொர்க்',
    home: 'முகப்பு',
    report: 'புகார் அளிக்கவும்',
    track: 'சிக்கல்களைக் கண்காணிக்கவும்',
    admin: 'நிர்வாக தளம்',
    lookup: 'ஐடி தேடு',
    getStarted: 'தொடங்கவும்',
  },
  hero: {
    badge: 'அடுத்த தலைமுறை குடிமை உள்கட்டமைப்பு மேலாண்மை',
    titleLine1: 'உங்கள் நகரம்.',
    titleHighlight: 'உங்கள் குரல்.',
    titleLine3: 'உண்மையான மாற்றம்.',
    description: 'குடிமைப் பிரச்சனைகளைப் புகாரளிக்கவும், அதிகாரிகளுடன் இணையவும், தீர்வின் ஒவ்வொரு படியையும் கண்காணிக்கவும்.',
    reportBtn: 'புகார் அளிக்கவும்',
    dashboardBtn: 'டாஷ்போர்டைப் பார்க்கவும்',
    trustVerified: 'சரிபார்க்கப்பட்ட நகராட்சி நடவடிக்கை',
    trustSla: 'அதிகாரப்பூர்வ சேவை எஸ்எல்ஏ',
    trustTurnaround: 'சராசரியாக ~36 மணிநேரத் தீர்வு',
  },
  report: {
    badge: 'மக்கள் குறைதீர்ப்பு தளம்',
    title: 'குடிமைப் பிரச்சனையைப் புகாரளிக்கவும்',
    subtitle: 'துல்லியமான விவரங்களையும் புகைப்பட ஆதாரங்களையும் வழங்கவும்.',
    categoryLabel: 'குடிமை வகை *',
    titleLabel: 'பிரச்சனை தலைப்பு *',
    descLabel: 'விவரமான விளக்கம் *',
    locationLabel: 'முகவரி அல்லது அடையாளம் *',
    cityLabel: 'நகரம் *',
    stateLabel: 'மாநிலம் *',
    nameLabel: 'உங்கள் பெயர் *',
    emailLabel: 'மின்னஞ்சல் முகவரி *',
    submitBtn: 'புகாரைச் சமர்ப்பிக்கவும்',
  },
  track: {
    title: 'சமூக குறைதீர்ப்பு டிராக்கர்',
    totalComplaints: 'மொத்த புகார்கள்',
    reportedComplaints: 'பதிவு செய்யப்பட்டவை',
    inProgressComplaints: 'செயல்பாட்டில்',
    resolvedComplaints: 'தீர்க்கப்பட்டவை',
    searchPlaceholder: 'ஐடி, தலைப்பு அல்லது இருப்பிடம் மூலம் தேடவும்...',
  },
  common: {
    demoData: 'மாதிரி தரவு',
    citizenEntry: 'குடிமக்கள் பதிவு',
    critical: 'மிக முக்கியம்',
    high: 'உயர் முன்னுரிமை',
    medium: 'நடுத்தரம்',
    low: 'குறைந்த',
    reported: 'பதிவு செய்யப்பட்டது',
    underReview: 'மதிப்பாய்வில்',
    inProgress: 'செயல்பாட்டில்',
    resolved: 'தீர்க்கப்பட்டது',
    rejected: 'நிராகரிக்கப்பட்டது',
    language: 'மொழி',
    disclaimer: 'இந்தியாவின் 22 அட்டவணைப்படுத்தப்பட்ட மொழிகளில் உள்ளூர்மயமாக்கல்.',
  },
});

// Telugu (తెలుగు)
export const te = createLang(en, {
  nav: {
    logoSubtitle: 'మున్సిపల్ కార్యాచరణ నెట్‌వర్క్',
    home: 'హోమ్',
    report: 'సమస్యను నివేదించండి',
    track: 'సమస్యలను ట్రాక్ చేయండి',
    admin: 'అడ్మిన్ పోర్టల్',
    lookup: 'ఐడిని శోధించండి',
    getStarted: 'ప్రారంభించండి',
  },
  hero: {
    badge: 'తదుపరి తరం పౌర మౌలిక సదుపాయాల నిర్వహణ',
    titleLine1: 'మీ నగరం.',
    titleHighlight: 'మీ స్వరం.',
    titleLine3: 'నిజమైన మార్పు.',
    description: 'పౌర సమస్యలను నివేదించండి, అధికారులతో కనెక్ట్ అవ్వండి మరియు పరిష్కార పురోగతిని ట్రాక్ చేయండి.',
    reportBtn: 'సమస్యను నివేదించండి',
    dashboardBtn: 'డాష్‌బోర్డ్ అన్వేషించండి',
    trustVerified: 'ధృవీకరించబడిన మున్సిపల్ చర్య',
    trustSla: 'అధికారిక ప్రజా సేవా SLA',
    trustTurnaround: 'సగటు ~36 గంటల పరిష్కారం',
  },
  report: {
    badge: 'ప్రజా ఫిర్యాదుల పోర్టల్',
    title: 'పౌర సమస్యను నివేదించండి',
    subtitle: 'సమస్య త్వరగా పరిష్కరించబడేలా ఖచ్చితమైన వివరాలు మరియు ఫోటోలను అందించండి.',
    categoryLabel: 'పౌర వర్గం *',
    titleLabel: 'సమస్య శీర్షిక *',
    descLabel: 'వివరణాత్మక సమాచారం *',
    locationLabel: 'చిరునామా లేదా ల్యాండ్‌మార్క్ *',
    cityLabel: 'నగరం *',
    stateLabel: 'రాష్ట్రం *',
    nameLabel: 'మీ పూర్తి పేరు *',
    emailLabel: 'ఇమెయిల్ చిరునామా *',
    submitBtn: 'ఫిర్యాదు సమర్పించండి',
  },
  track: {
    title: 'కమ్యూనిటీ సమస్యల ట్రాకర్',
    totalComplaints: 'మొత్తం ఫిర్యాదులు',
    reportedComplaints: 'నమోదైనవి',
    inProgressComplaints: 'పురోగతిలో ఉన్నాయి',
    resolvedComplaints: 'పరిష్కరించబడినవి',
    searchPlaceholder: 'ఐడి, శీర్షిక లేదా లొకేషన్ ద్వారా శోధించండి...',
  },
  common: {
    demoData: 'డెమో డేటా',
    citizenEntry: 'పౌరుడి నమోదు',
    critical: 'తీవ్రమైనది',
    high: 'అధిక ప్రాధాన్యత',
    medium: 'మధ్యస్థం',
    low: 'తక్కువ',
    reported: 'నమోదైంది',
    underReview: 'సమీక్షలో ఉంది',
    inProgress: 'పురోగతిలో ఉంది',
    resolved: 'పరిష్కరించబడింది',
    rejected: 'తిరస్కరించబడింది',
    language: 'భాష',
    disclaimer: 'భారతదేశంలోని 22 షెడ్యూల్డ్ భాషలలో స్థానికీకరణ. సమీక్ష కొనసాగుతోంది.',
  },
});

// Marathi (मराठी)
export const mr = createLang(en, {
  nav: {
    logoSubtitle: 'महानगरपालिका कृती नेटवर्क',
    home: 'मुख्यपृष्ठ',
    report: 'तक्रार नोंदवा',
    track: 'तक्रार ट्रॅक करा',
    admin: 'प्रशासक पोर्टल',
    lookup: 'तक्रार शोधा',
    getStarted: 'सुरू करा',
  },
  hero: {
    badge: 'पुढील पिढीचे नागरी पायाभूत सुविधा व्यवस्थापन',
    titleLine1: 'तुमचे शहर.',
    titleHighlight: 'तुमचा आवाज.',
    titleLine3: 'खरा बदल.',
    description: 'नागरी समस्यांची तक्रार नोंदवा, योग्य अधिकाऱ्यांशी संपर्क साधा आणि प्रत्येक टप्पा ट्रॅक करा.',
    reportBtn: 'तक्रार नोंदवा',
    dashboardBtn: 'डॅशबोर्ड पहा',
    trustVerified: 'प्रमाणित पालिका कृती',
    trustSla: 'अधिकृत लोकसेवा एसएलए',
    trustTurnaround: 'सरासरी ~३६ तासांत निवारण',
  },
  report: {
    badge: 'सार्वजनिक तक्रार निवारण पोर्टल',
    title: 'नागरी समस्येची नोंद करा',
    subtitle: 'अचूक माहिती आणि फोटो पुरावा द्या जेणेकरून त्वरित कारवाई करता येईल.',
    categoryLabel: 'नागरी श्रेणी *',
    titleLabel: 'तक्रारीचे शीर्षक *',
    descLabel: 'सविस्तर वर्णन *',
    locationLabel: 'पत्ता किंवा खूण *',
    cityLabel: 'शहर *',
    stateLabel: 'राज्य *',
    nameLabel: 'तुमचे पूर्ण नाव *',
    emailLabel: 'ईमेल पत्ता *',
    submitBtn: 'तक्रार सादर करा',
  },
  track: {
    title: 'नागरी तक्रार निवारण ट्रॅकर',
    totalComplaints: 'एकूण तक्रारी',
    reportedComplaints: 'नोंदवलेल्या',
    inProgressComplaints: 'प्रगतीपथावर',
    resolvedComplaints: 'निवारण झालेल्या',
    searchPlaceholder: 'आयडी, शीर्षक किंवा पत्त्याद्वारे शोधा...',
  },
  common: {
    demoData: 'डेमो डेटा',
    citizenEntry: 'नागरिक नोंद',
    critical: 'अति तातडीची',
    high: 'उच्च प्राधान्य',
    medium: 'मध्यम',
    low: 'कमी',
    reported: 'नोंदवली',
    underReview: 'पुनरावलोकन सुरू',
    inProgress: 'काम सुरू',
    resolved: 'निवारण झाले',
    rejected: 'नाकारली',
    language: 'भाषा',
    disclaimer: 'भारतातील २२ अनुसूचित भाषांमध्ये स्वयंचलित स्थानिकीकरण.',
  },
});

// Gujarati (ગુજરાતી)
export const gu = createLang(en, {
  nav: {
    logoSubtitle: 'મ્યુનિસિપલ એક્શન નેટવર્ક',
    home: 'હોમ',
    report: 'સમસ્યા નોંધાવો',
    track: 'ટ્રેક કરો',
    admin: 'એડમિન પોર્ટલ',
    lookup: 'આઈડી શોધો',
    getStarted: 'શરૂ કરો',
  },
  hero: {
    titleLine1: 'તમારું શહેર.',
    titleHighlight: 'તમારો અવાજ.',
    titleLine3: 'સાચો બદલાવ.',
    description: 'નાગરિક સમસ્યાઓની ફરિયાદ નોંધાવો અને નિકાલની પ્રગતિને ટ્રેક કરો.',
    reportBtn: 'સમસ્યા નોંધાવો',
    dashboardBtn: 'ડેશબોર્ડ જુઓ',
  },
  report: {
    title: 'નાગરિક ફરિયાદ નોંધાવો',
    categoryLabel: 'શ્રેણી *',
    titleLabel: 'સમસ્યાનું શીર્ષક *',
    descLabel: 'વિગતવાર વર્ણન *',
    locationLabel: 'સરનામું અથવા લેન્ડમાર્ક *',
    cityLabel: 'શહેર *',
    stateLabel: 'રાજ્ય *',
    nameLabel: 'તમારું પૂરું નામ *',
    emailLabel: 'ઈમેલ સરનામું *',
    submitBtn: 'ફરિયાદ સબમિટ કરો',
  },
  track: {
    title: 'કમ્યુનિટી ફરિયાદ ટ્રેકર',
    totalComplaints: 'કુલ ફરિયાદો',
    reportedComplaints: 'નોંધાયેલ',
    inProgressComplaints: 'પ્રગતિમાં',
    resolvedComplaints: 'ઉકેલાયેલ',
  },
  common: {
    demoData: 'ડેમો ડેટા',
    citizenEntry: 'નાગરિક એન્ટ્રી',
    language: 'ભાષા',
    disclaimer: 'ભારતની ૨૨ અનુસૂચિત ભાષાઓમાં સ્થાનિકીકરણ.',
  },
});

// Kannada (ಕನ್ನಡ)
export const kn = createLang(en, {
  nav: {
    logoSubtitle: 'ಪುರಸಭೆಯ ಕ್ರಿಯಾ ಜಾಲ',
    home: 'ಮುಖಪುಟ',
    report: 'ದೂರು ದಾಖಲಿಸಿ',
    track: 'ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ',
    admin: 'ಆಡಳಿತ ಪೋರ್ಟಲ್',
    lookup: 'ಐಡಿ ಹುಡುಕಿ',
    getStarted: 'ಪ್ರಾರಂಭಿಸಿ',
  },
  hero: {
    titleLine1: 'ನಿಮ್ಮ ನಗರ.',
    titleHighlight: 'ನಿಮ್ಮ ಧ್ವನಿ.',
    titleLine3: 'ನಿಜವಾದ ಬದಲಾವಣೆ.',
    description: 'ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ, ಅಧಿಕಾರಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ ಮತ್ತು ಪ್ರತಿಯೊಂದು ಹಂತವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    reportBtn: 'ದೂರು ದಾಖಲಿಸಿ',
    dashboardBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ',
  },
  report: {
    title: 'ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    categoryLabel: 'ವರ್ಗ *',
    titleLabel: 'ಸಮಸ್ಯೆಯ ಶೀರ್ಷಿಕೆ *',
    descLabel: 'ವಿವರವಾದ ವಿವರಣೆ *',
    locationLabel: 'ವಿಳಾಸ ಅಥವಾ ಹೆಗ್ಗುರುತು *',
    cityLabel: 'ನಗರ *',
    stateLabel: 'ರಾಜ್ಯ *',
    nameLabel: 'ನಿಮ್ಮ ಹೆಸರು *',
    emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ *',
    submitBtn: 'ದೂರು ಸಲ್ಲಿಸಿ',
  },
  track: {
    title: 'ಸಮುದಾಯ ದೂರುಗಳ ಟ್ರ್ಯಾಕರ್',
    totalComplaints: 'ಒಟ್ಟು ದೂರುಗಳು',
    reportedComplaints: 'ದಾಖಲಾದ ದೂರುಗಳು',
    inProgressComplaints: 'ಪ್ರಗತಿಯಲ್ಲಿರುವ',
    resolvedComplaints: 'ಪರಿಹರಿಸಲ್ಪಟ್ಟ',
  },
  common: {
    demoData: 'ಡೆಮೊ ಡೇಟಾ',
    citizenEntry: 'ನಾಗರಿಕ ದಾಖಲೆ',
    language: 'ಭಾಷೆ',
    disclaimer: 'ಭಾರತದ 22 ನಿಗದಿತ ಭಾಷೆಗಳಲ್ಲಿ ಸ್ಥಳೀಕರಣ.',
  },
});

// Malayalam (മലയാളം)
export const ml = createLang(en, {
  nav: {
    logoSubtitle: 'മുനിസിപ്പൽ ആക്ഷൻ നെറ്റ്‌വർക്ക്',
    home: 'ഹോം',
    report: 'പരാതി നൽകുക',
    track: 'ട്രാക്ക് ചെയ്യുക',
    admin: 'അഡ്മിൻ പോർട്ടൽ',
    lookup: 'ഐഡി തിരയുക',
    getStarted: 'ആരംഭിക്കുക',
  },
  hero: {
    titleLine1: 'നിങ്ങളുടെ നഗരം.',
    titleHighlight: 'നിങ്ങളുടെ ശബ്ദം.',
    titleLine3: 'യഥാർത്ഥ മാറ്റം.',
    description: 'പൗര പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്യുക, ഉദ്യോഗസ്ഥരുമായി ബന്ധപ്പെടുക, പരിഹാരം ട്രാക്ക് ചെയ്യുക.',
    reportBtn: 'പരാതി നൽകുക',
    dashboardBtn: 'ഡാഷ്‌ബോർഡ് കാണുക',
  },
  report: {
    title: 'പൗര പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക',
    categoryLabel: 'വിഭാഗം *',
    titleLabel: 'ശീർഷകം *',
    descLabel: 'വിശദീകരണം *',
    locationLabel: 'വിലാസം / സ്ഥലം *',
    cityLabel: 'നഗരം *',
    stateLabel: 'സംസ്ഥാനം *',
    nameLabel: 'നിങ്ങളുടെ പേര് *',
    emailLabel: 'ഇമെയിൽ വിലാസം *',
    submitBtn: 'പരാതി സമർപ്പിക്കുക',
  },
  track: {
    title: 'പരാതി പരിഹാര ട്രാക്കർ',
    totalComplaints: 'ആകെ പരാതികൾ',
    reportedComplaints: 'രേഖപ്പെടുത്തിയവ',
    inProgressComplaints: 'നടപടിയിൽ',
    resolvedComplaints: 'പരിഹരിച്ചവ',
  },
  common: {
    demoData: 'ഡെമോ ഡാറ്റ',
    citizenEntry: 'പൗര എൻട്രി',
    language: 'ഭാഷ',
    disclaimer: 'ഇന്ത്യയുടെ 22 ഔദ്യോഗിക ഭാഷകളിൽ ലഭ്യമാണ്.',
  },
});

// Punjabi (ਪੰਜਾਬੀ)
export const pa = createLang(en, {
  nav: {
    logoSubtitle: 'ਨਗਰ ਨਿਗਮ ਐਕਸ਼ਨ ਨੈੱਟਵਰਕ',
    home: 'ਹੋਮ',
    report: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
    track: 'ਟਰੈਕ ਕਰੋ',
    admin: 'ਪ੍ਰਸ਼ਾਸਨ ਪੋਰਟਲ',
    lookup: 'ਆਈਡੀ ਲੱਭੋ',
    getStarted: 'ਸ਼ੁਰੂ ਕਰੋ',
  },
  hero: {
    titleLine1: 'ਤੁਹਾਡਾ ਸ਼ਹਿਰ।',
    titleHighlight: 'ਤੁਹਾਡੀ ਆਵਾਜ਼।',
    titleLine3: 'ਅਸਲ ਬਦਲਾਅ।',
    description: 'ਸ਼ਹਿਰੀ ਸਮੱਸਿਆਵਾਂ ਦੀ ਰਿਪੋਰਟ ਕਰੋ ਅਤੇ ਹੱਲ ਦੀ ਪ੍ਰਗਤੀ ਨੂੰ ਟਰੈਕ ਕਰੋ।',
    reportBtn: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
    dashboardBtn: 'ਡੈਸ਼ਬੋਰਡ ਦੇਖੋ',
  },
  report: {
    title: 'ਸ਼ਹਿਰੀ ਸਮੱਸਿਆ ਦੀ ਰਿਪੋਰਟ ਕਰੋ',
    categoryLabel: 'ਸ਼੍ਰੇਣੀ *',
    titleLabel: 'ਸਮੱਸਿਆ ਦਾ ਸਿਰਲੇਖ *',
    descLabel: 'ਵੇਰਵਾ *',
    locationLabel: 'ਪਤਾ ਜਾਂ ਲੈਂਡਮਾਰਕ *',
    cityLabel: 'ਸ਼ਹਿਰ *',
    stateLabel: 'ਰਾਜ *',
    nameLabel: 'ਤੁਹਾਡਾ ਪੂਰਾ ਨਾਮ *',
    emailLabel: 'ਈਮੇਲ ਪਤਾ *',
    submitBtn: 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
  },
  track: {
    title: 'ਸ਼ਿਕਾਇਤ ਟਰੈਕਰ',
    totalComplaints: 'ਕੁੱਲ ਸ਼ਿਕਾਇਤਾਂ',
    reportedComplaints: 'ਦਰਜ ਸ਼ਿਕਾਇਤਾਂ',
    inProgressComplaints: 'ਜਾਰੀ ਕੰਮ',
    resolvedComplaints: 'ਹੱਲ ਹੋ ਚੁੱਕੀਆਂ',
  },
  common: {
    demoData: 'ਡੈਮੋ ਡੇਟਾ',
    citizenEntry: 'ਨਾਗਰਿਕ ਐਂਟਰੀ',
    language: 'ਭਾਸ਼ਾ',
    disclaimer: 'ਭਾਰਤ ਦੀਆਂ 22 ਅਨੁਸੂਚਿਤ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਉਪਲਬਧ।',
  },
});

// Odia (ଓଡ଼ିଆ)
export const or = createLang(en, {
  nav: {
    logoSubtitle: 'ପୌର କାର୍ଯ୍ୟାନୁଷ୍ଠାନ ନେଟୱାର୍କ',
    home: 'ମୂଳପୃଷ୍ଠା',
    report: 'ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ',
    track: 'ଟ୍ରାକ୍ କରନ୍ତୁ',
    admin: 'ପ୍ରଶାସନ ପୋର୍ଟାଲ',
    lookup: 'ଆଇଡି ଖୋଜନ୍ତୁ',
    getStarted: 'ଆରମ୍ଭ କରନ୍ତୁ',
  },
  hero: {
    titleLine1: 'ଆପଣଙ୍କ ସହର।',
    titleHighlight: 'ଆପଣଙ୍କ ସ୍ୱର।',
    titleLine3: 'ବାସ୍ତବ ପରିବର୍ତ୍ତନ।',
    description: 'ନାଗରିକ ସମସ୍ୟା ଅଭିଯୋଗ କରନ୍ତୁ ଏବଂ ସମାଧାନର ପ୍ରତ୍ୟେକ ପଦକ୍ଷେପ ଟ୍ରାକ୍ କରନ୍ତୁ।',
    reportBtn: 'ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ',
    dashboardBtn: 'ଡ୍ୟାସବୋର୍ଡ ଦେଖନ୍ତୁ',
  },
  report: {
    title: 'ନାଗରିକ ସମସ୍ୟା ରିପୋର୍ଟ କରନ୍ତୁ',
    categoryLabel: 'ବର୍ଗ *',
    titleLabel: 'ଶୀର୍ଷକ *',
    descLabel: 'ବିସ୍ତୃତ ବିବରଣୀ *',
    locationLabel: 'ଠିକଣା *',
    cityLabel: 'ସହର *',
    stateLabel: 'ରାଜ୍ୟ *',
    nameLabel: 'ଆପଣଙ୍କ ନାମ *',
    emailLabel: 'ଇମେଲ ଠିକଣା *',
    submitBtn: 'ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ',
  },
  track: {
    title: 'ଅଭିଯୋଗ ଟ୍ରାକର',
    totalComplaints: 'ମୋଟ ଅଭିଯୋଗ',
    reportedComplaints: 'ଦାଖଲ ହୋଇଥିବା',
    inProgressComplaints: 'ପ୍ରକ୍ରିୟାଧୀନ',
    resolvedComplaints: 'ସମାଧାନ ହୋଇଥିବା',
  },
  common: {
    demoData: 'ଡେମୋ ତଥ୍ୟ',
    citizenEntry: 'ନାଗରିକ ପ୍ରବେଶ',
    language: 'ଭାଷା',
    disclaimer: 'ଭାରତର ୨୨ଟି ଅନୁସୂଚିତ ଭାଷାରେ ଉପଲବ୍ଧ।',
  },
});

// Assamese (অসমীয়া)
export const as = createLang(en, {
  nav: {
    logoSubtitle: 'পৌৰ কাৰ্য ব্যৱস্থা নেটৱৰ্ক',
    home: 'ঘৰ',
    report: 'সমস্যা অভিযোগ কৰক',
    track: 'ট্ৰেক কৰক',
    admin: 'প্ৰশাসন পʼৰ্টেল',
    lookup: 'আইডি সন্ধান কৰক',
    getStarted: 'আৰম্ভ কৰক',
  },
  hero: {
    titleLine1: 'আপোনাৰ চহৰ।',
    titleHighlight: 'আপোনাৰ মাত।',
    titleLine3: 'প্ৰকৃত পৰිৱৰ্তন।',
    description: 'নাগৰিক সমস্যাৰ অভিযোগ জনাওক আৰু সমাধানৰ প্ৰতিটো পদক্ষেপ নিৰীক্ষণ কৰক।',
    reportBtn: 'অভিযোগ দাখিল কৰক',
    dashboardBtn: 'ডেশ্ববʼৰ্ড চাওক',
  },
  common: {
    demoData: 'ডেমো তথ্য',
    citizenEntry: 'নাগৰিক প্ৰৱেশ',
    language: 'ভাষা',
    disclaimer: 'ভাৰতৰ ২২টা অনুসূচীত ভাষাত উপলব্ধ।',
  },
});

// Sanskrit (संस्कृतम्)
export const sa = createLang(en, {
  nav: {
    logoSubtitle: 'पौरकार्य संजालम्',
    home: 'मुख्यपृष्ठम्',
    report: 'समस्यां सूचयतु',
    track: 'स्थितिम् अन्विष्यतु',
    admin: 'प्रशासनद्वारम्',
    lookup: 'सूचकाङ्कः',
    getStarted: 'आरभ्यताम्',
  },
  hero: {
    titleLine1: 'भवतः नगरम्।',
    titleHighlight: 'भवतः वाणी।',
    titleLine3: 'सत्यं परिवर्तनम्।',
    description: 'पौरसमस्याः सूचयन्तु, अधिकारिभिः सह सम्बद्ध्यन्ताम्, प्रगतेः प्रत्येकं पदं पश्यन्तु।',
    reportBtn: 'समस्यां सूचयतु',
    dashboardBtn: 'फलकं पश्यतु',
  },
  common: {
    demoData: 'प्रतिरूपदत्तम्',
    citizenEntry: 'नागरिकप्रविष्टिः',
    language: 'भाषा',
    disclaimer: 'भारते २२ अनुसूचितभाषासु उपलब्धा।',
  },
});

// Maithili (मैथिली)
export const mai = createLang(en, {
  nav: {
    home: 'घर',
    report: 'समस्या दर्ज करू',
    track: 'ट्रैक करू',
    admin: 'प्रशासन पोर्टल',
    lookup: 'शिकायत खोजू',
    getStarted: 'शुरू करू',
  },
  hero: {
    titleLine1: 'अहाँक शहर।',
    titleHighlight: 'अहाँक आवाज।',
    titleLine3: 'साँच बदलाव।',
    reportBtn: 'समस्या दर्ज करू',
  },
  common: {
    language: 'भाषा',
    disclaimer: '२२ अनुसूचित भाषामे उपलब्ध।',
  },
});

// Kashmiri (کٲشُر)
export const ks = createLang(en, {
  nav: {
    home: 'گھر',
    report: 'مسئلہ درج کریو',
    track: 'ٹریک کریو',
    admin: 'ایڈمن پورٹل',
    lookup: 'تلاش کریو',
  },
  common: {
    language: 'زبان',
    disclaimer: 'کٲشُر زبان منٛز دستیاب۔',
  },
});

// Nepali (नेपाली)
export const ne = createLang(en, {
  nav: {
    home: 'गृहपृष्ठ',
    report: 'समस्या रिपोर्ट गर्नुहोस्',
    track: 'ट्र्याक गर्नुहोस्',
    admin: 'प्रशासन पोर्टल',
    lookup: 'खोजी गर्नुहोस्',
    getStarted: 'सुरु गर्नुहोस्',
  },
  hero: {
    titleLine1: 'तपाईंको सहर।',
    titleHighlight: 'तपाईंको आवाज।',
    titleLine3: 'वास्तविक परिवर्तन।',
    reportBtn: 'समस्या रिपोर्ट गर्नुहोस्',
  },
  common: {
    language: 'भाषा',
    disclaimer: 'नेपाली भाषामा उपलब्ध।',
  },
});

// Sindhi (سنڌي)
export const sd = createLang(en, {
  nav: {
    home: 'گھر',
    report: 'مسئلو داخل ڪريو',
    track: 'ٽريڪ ڪريو',
    admin: 'ايڊمن پورٽل',
  },
  common: {
    language: 'ٻولي',
    disclaimer: 'سنڌي ٻوليءَ ۾ دستياب.',
  },
});

// Konkani (कोंकणी)
export const kok = createLang(en, {
  nav: {
    home: 'घर',
    report: 'तक्रार नोंद करा',
    track: 'तपासा',
    admin: 'प्रशासन पोर्टल',
  },
  common: {
    language: 'भास',
  },
});

// Dogri (डोगरी)
export const doi = createLang(en, {
  nav: {
    home: 'घर',
    report: 'समस्या दस्सियै',
    track: 'ट्रैक करो',
    admin: 'प्रशासन पोर्टल',
  },
  common: {
    language: 'बोली',
  },
});

// Manipuri (মৈতৈলোন্)
export const mni = createLang(en, {
  nav: {
    home: 'য়ুম',
    report: 'ৱাকৎ থাগৎলু',
    track: 'য়েংশিনলু',
    admin: 'লৈঙাক পোর্টেল',
  },
  common: {
    language: 'লোন',
  },
});

// Bodo (बड़ो)
export const brx = createLang(en, {
  nav: {
    home: 'नʼ',
    report: 'जेंना खौरां हर',
    track: 'नायगिर',
    admin: 'खुंथाय पोर्टल',
  },
  common: {
    language: 'राव',
  },
});

// Santali (ᱥᱟᱱᱛᱟᱲᱤ)
export const sat = createLang(en, {
  nav: {
    home: 'ᱚᱲᱟᱜ',
    report: 'ᱮᱴᱠᱮᱴᱚᱬᱮ ᱞᱟᱹᱭ ᱢᱮ',
    track: 'ᱯᱟᱸᱡᱟᱭ ᱢᱮ',
    admin: 'ᱥᱟᱥᱚᱱ ᱯᱳᱨᱴᱟᱞ',
  },
  common: {
    language: 'ᱯᱟᱹᱨᱥᱤ',
  },
});

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ur: { translation: ur },
  bn: { translation: bn },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  pa: { translation: pa },
  or: { translation: or },
  as: { translation: as },
  sa: { translation: sa },
  mai: { translation: mai },
  ks: { translation: ks },
  ne: { translation: ne },
  sd: { translation: sd },
  kok: { translation: kok },
  doi: { translation: doi },
  mni: { translation: mni },
  brx: { translation: brx },
  sat: { translation: sat },
};
