import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './locales';
import { getLanguageInfo } from './languages';

const STORAGE_KEY = 'civicresolve_language';

const savedLang = localStorage.getItem(STORAGE_KEY) || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Apply document direction and language attribute
export function applyLanguageSettings(langCode: string) {
  const info = getLanguageInfo(langCode);
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;

  // Set font class if helpful
  if (info.dir === 'rtl') {
    document.documentElement.classList.add('is-rtl');
  } else {
    document.documentElement.classList.remove('is-rtl');
  }
}

// Initial setup
applyLanguageSettings(savedLang);

// Listen to language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyLanguageSettings(lng);

  // Optional background sync with backend preference if user email is present
  try {
    const userEmail = localStorage.getItem('civicresolve_user_email');
    if (userEmail) {
      fetch('/api/users/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, language: lng }),
      }).catch(() => {
        // Silent catch for offline or standalone mode
      });
    }
  } catch {}
});

export default i18n;
