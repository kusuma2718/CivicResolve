import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Heart, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  CIVIC<span className="text-brand-400">RESOLVE</span>
                </span>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  MUNICIPAL ACTION NETWORK
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering citizens to report civic grievances, collaborate directly with municipal authorities, and track measurable community improvements in real time.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs text-teal-300 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Phase 1 Architecture Active</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Overview & Home
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-slate-400 hover:text-white transition-colors">
                  File Civic Grievance
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-400 hover:text-white transition-colors">
                  Live Issue Tracker
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
                  Authority Management Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrated Departments */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Municipal Divisions
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Public Works Department (PWD)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Municipal Sanitation & Waste Ops</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Water Supply & Sewage Board</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Electricity & Lighting Undertaking</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Traffic & Road Safety Authority</span>
              </li>
            </ul>
          </div>

          {/* Civic Tech & Hackathon Notice */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Civic-Tech Blueprint
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed as a modern GovTech SaaS architecture. Backend microservices, multimodal AI classification (Gemini 1.5 Pro / Flash), and SMS gateway integration are staged for subsequent phases.
            </p>
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Enterprise GovTech Compliance Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-navy-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CIVICRESOLVE Platform. Built for open, transparent, and accountable governance.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-400">
              Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for modern smart cities
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
