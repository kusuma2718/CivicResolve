import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  PlusCircle,
  Search,
  ShieldCheck,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { LanguageSelector } from '../common/LanguageSelector';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.report'), path: '/report' },
    { name: t('nav.track'), path: '/track' },
    { name: t('nav.admin'), path: '/admin' },
  ];

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-950 via-navy-900 to-brand-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-navy-950 group-hover:text-brand-600 transition-colors">
                  CIVIC<span className="text-brand-600">RESOLVE</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                {t('nav.logoSubtitle')}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-600 bg-brand-50/80 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-navy-950 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Selector for 22 scheduled Indian languages */}
            <LanguageSelector />

            <Link
              to="/track"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('nav.lookup')}</span>
            </Link>

            <button
              onClick={() => navigate('/report')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow transition-all duration-150 active:scale-98"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>{t('nav.report')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => navigate('/report')}
              className="inline-flex items-center p-2 rounded-lg text-white bg-brand-600 hover:bg-brand-700"
              aria-label="Report issue"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={handleMobileNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-base font-medium ${
                    isActive
                      ? 'text-brand-600 bg-brand-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <span>{link.name}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Link
              to="/report"
              onClick={handleMobileNavClick}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('nav.report')}</span>
            </Link>

            <Link
              to="/admin"
              onClick={handleMobileNavClick}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>{t('nav.admin')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
