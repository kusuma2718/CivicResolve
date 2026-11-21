import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  MapPin,
  Cpu,
  Layers,
  Activity,
  Compass
} from 'lucide-react';
import { MOCK_STATISTICS } from '../services/mockData';
import { useComplaints } from '../hooks/useComplaints';
import { StatusBadge } from '../components/common/StatusBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { DemoBadge } from '../components/common/DemoBadge';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { complaints } = useComplaints();
  const recentComplaints = complaints.slice(0, 3);

  const steps = [
    {
      num: '01',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
      icon: PlusCircle,
      accent: 'border-brand-500 bg-brand-50/50 text-brand-600',
    },
    {
      num: '02',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
      icon: Cpu,
      accent: 'border-teal-500 bg-teal-50/50 text-teal-600',
    },
    {
      num: '03',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
      icon: ShieldCheck,
      accent: 'border-indigo-500 bg-indigo-50/50 text-indigo-600',
    },
    {
      num: '04',
      title: t('howItWorks.step4Title'),
      description: t('howItWorks.step4Desc'),
      icon: CheckCircle2,
      accent: 'border-emerald-500 bg-emerald-50/50 text-emerald-600',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: t('features.f1Title'),
      description: t('features.f1Desc'),
      tag: 'AI INTELLIGENCE',
    },
    {
      icon: Zap,
      title: t('features.f2Title'),
      description: t('features.f2Desc'),
      tag: 'PUBLIC SAFETY',
    },
    {
      icon: Layers,
      title: t('features.f3Title'),
      description: t('features.f3Desc'),
      tag: 'DEPARTMENT ALLOCATION',
    },
    {
      icon: Compass,
      title: t('features.f4Title'),
      description: t('features.f4Desc'),
      tag: 'CITIZEN ACCOUNTABILITY',
    },
    {
      icon: Activity,
      title: t('features.f5Title'),
      description: t('features.f5Desc'),
      tag: 'LIVE UPDATES',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-850 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle decorative grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines and CTAs */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-navy-700/80 text-teal-300 text-xs font-medium backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>{t('hero.badge')}</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  {t('hero.titleLine1')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-teal-300 to-sky-300">
                    {t('hero.titleHighlight')}
                  </span>{' '}
                  <br />
                  {t('hero.titleLine3')}
                </h1>

                <p className="text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
                  {t('hero.description')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => navigate('/report')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <PlusCircle className="w-5 h-5 text-white" />
                  <span>{t('hero.reportBtn')}</span>
                </button>

                <button
                  onClick={() => navigate('/track')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-navy-800/90 hover:bg-navy-700 border border-navy-700/80 shadow-md transition-all duration-200"
                >
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                  <span>{t('hero.dashboardBtn')}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-navy-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>{t('hero.trustVerified')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>{t('hero.trustSla')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>{t('hero.trustTurnaround')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Civic Infrastructure Visual Component */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow backdrop */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 opacity-20 blur-xl"></div>

                {/* Simulated Civic Terminal UI card */}
                <div className="relative bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-2xl text-left space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-navy-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-mono text-slate-400 ml-2">
                        civic-terminal.hub
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-950 text-teal-300 border border-teal-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                      Live Hub
                    </span>
                  </div>

                  {/* Active Issue Card Preview */}
                  <div className="bg-navy-950/90 rounded-xl p-4 border border-navy-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-teal-400">
                        CR-2024-1042
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/80 text-red-300 border border-red-800">
                        Critical Hazard
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      Hazardous deep pothole on MG Road Junction
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Near Central Metro Station, Gate 2</span>
                    </div>
                    <div className="w-full bg-navy-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-brand-500 to-teal-400 h-1.5 rounded-full w-3/4"></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Status: In Progress</span>
                      <span className="text-teal-400">Assigned: PWD Div #4</span>
                    </div>
                  </div>

                  {/* Triage Stats Row */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-navy-800/60 rounded-lg p-3 border border-navy-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Daily Inflow
                      </span>
                      <p className="text-lg font-bold text-white mt-0.5">384 Issues</p>
                      <span className="text-[10px] text-teal-400 font-medium">98% Auto-Routed</span>
                    </div>
                    <div className="bg-navy-800/60 rounded-lg p-3 border border-navy-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Resolution SLA
                      </span>
                      <p className="text-lg font-bold text-white mt-0.5">94.8%</p>
                      <span className="text-[10px] text-emerald-400 font-medium">On-Time Target</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section (Clearly Labelled Demo Data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-elevated p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-lg font-bold text-navy-950">
                Civic Impact at a Glance
              </h2>
              <p className="text-xs text-slate-500">
                Real-time municipal telemetry across operational jurisdictions
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>SIMULATED DEMO DATA</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Reported
              </span>
              <p className="text-3xl font-extrabold text-navy-950">
                {MOCK_STATISTICS.totalIssuesReported.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">Verified citizen submissions</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Successfully Resolved
              </span>
              <p className="text-3xl font-extrabold text-emerald-600">
                {MOCK_STATISTICS.resolvedIssues.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">84% resolution efficiency</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Active Departments
              </span>
              <p className="text-3xl font-extrabold text-brand-600">
                {MOCK_STATISTICS.activeDepartments}
              </p>
              <p className="text-xs text-slate-500">Integrated agency boards</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Avg. Resolution Time
              </span>
              <p className="text-3xl font-extrabold text-teal-600">
                {MOCK_STATISTICS.avgResolutionTimeHours} hrs
              </p>
              <p className="text-xs text-slate-500">From filing to inspection</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
            Transparent Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            How CivicResolve Works
          </h2>
          <p className="text-base text-slate-600">
            A frictionless, transparent pipeline connecting community voices with municipal action crews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-black text-slate-300 font-mono group-hover:text-brand-600 transition-colors">
                      {step.num}
                    </span>
                    <div className={`p-3 rounded-xl border ${step.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-navy-950 mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                  <span>Step {step.num} Details</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-100/70 py-20 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider border border-teal-200">
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
              Built for Modern Smart Municipalities
            </h2>
            <p className="text-base text-slate-600">
              Transforming bureaucratic complaint registries into an intelligent, actionable civic resolution network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-card hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-50 border border-slate-200 flex items-center justify-center text-brand-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-navy-950 mb-2">
                    {feat.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}

            {/* Architecture Preview Box */}
            <div className="bg-gradient-to-br from-navy-950 to-navy-900 rounded-xl border border-navy-800 p-6 text-white flex flex-col justify-between shadow-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-800 flex items-center justify-center text-teal-400">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                    Phase 1 Scope
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  Foundation & Frontend Architecture
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Clean modular React + TypeScript foundation ready for Gemini Multimodal API, PostgreSQL backend, and municipal auth in Phase 2.
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-navy-800">
                <Link
                  to="/report"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-white transition-colors"
                >
                  <span>Test Form Layout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Live Complaints Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-950">
              Recent Civic Reports in City Feed
            </h2>
            <p className="text-sm text-slate-500">
              Live sample issues actively under administrative review
            </p>
          </div>
          <Link
            to="/track"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>View All Reported Issues</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentComplaints.map((complaint) => (
            <div
              key={complaint.id}
              onClick={() => navigate(`/track/${complaint.id}`)}
              className="bg-white rounded-xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {complaint.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <DemoBadge isSample={complaint.isSample} />
                    <StatusBadge status={complaint.status} size="sm" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-navy-950 line-clamp-2">
                  {complaint.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {complaint.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <CategoryBadge category={complaint.category} />
                <span className="font-medium text-brand-600 flex items-center gap-1">
                  Track
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Notice a problem in your neighborhood today?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Submit a report in less than 2 minutes. Every complaint is tracked with guaranteed municipal accountability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => navigate('/report')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-navy-950 font-bold text-sm shadow-md transition-all duration-150"
            >
              Report an Issue Now
            </button>
            <button
              onClick={() => navigate('/track')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-semibold text-sm border border-navy-700 transition-all duration-150"
            >
              Search by Complaint ID
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
