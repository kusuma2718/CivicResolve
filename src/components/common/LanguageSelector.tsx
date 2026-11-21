import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, Search, ChevronDown, Info } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../../i18n/languages';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) => {
    const q = search.toLowerCase();
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      lang.script.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (lang: LanguageInfo) => {
    i18n.changeLanguage(lang.code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-expanded={isOpen}
        aria-label="Select interface language"
      >
        <Globe className="w-3.5 h-3.5 text-brand-600" />
        <span className="font-medium text-slate-900">{currentLang.nativeName}</span>
        <span className="text-[10px] text-slate-400 font-mono uppercase">({currentLang.code})</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn text-left">
          {/* Search box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Indian languages..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
              autoFocus
            />
          </div>

          {/* Languages List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 divide-y divide-slate-100 pr-1">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.code === currentLang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    isSelected ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{lang.nativeName}</span>
                    <span className="text-[11px] text-slate-500">({lang.name})</span>
                    {lang.dir === 'rtl' && (
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono font-bold">
                        RTL
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{lang.script}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </div>
                </button>
              );
            })}
            {filteredLanguages.length === 0 && (
              <p className="text-center py-4 text-xs text-slate-400">No language matches found.</p>
            )}
          </div>

          {/* Legal / Accuracy Disclaimer */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 px-1 text-[10px] text-slate-400 leading-tight">
            <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{t('common.disclaimer')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
