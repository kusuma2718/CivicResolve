import React from 'react';
import {
  Flame,
  ShieldAlert,
  Activity,
  Users,
  Clock,
  Info,
} from 'lucide-react';
import { CommunityImpactDetail } from '../../services/intelligenceService';

interface CommunityImpactCardProps {
  impact: CommunityImpactDetail | null;
  isLoading?: boolean;
}

export const CommunityImpactCard: React.FC<CommunityImpactCardProps> = ({
  impact,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card text-center space-y-2">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-navy-950">
          Calculating transparent community impact score...
        </p>
      </div>
    );
  }

  if (!impact) return null;

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-950',
          badge: 'bg-rose-600 text-white',
          bar: 'bg-rose-600',
        };
      case 'Urgent':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-950',
          badge: 'bg-amber-500 text-white',
          bar: 'bg-amber-500',
        };
      case 'Elevated':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-950',
          badge: 'bg-blue-600 text-white',
          bar: 'bg-blue-600',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-900',
          badge: 'bg-slate-600 text-white',
          bar: 'bg-slate-600',
        };
    }
  };

  const styles = getUrgencyStyles(impact.urgencyLevel);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
      {/* Score Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-navy-950 text-base">Community Impact Assessment</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles.badge}`}>
              {impact.urgencyLevel} Urgency
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic multi-factor score (0–100) reflecting public hazard and urban disruption.
          </p>
        </div>

        {/* Big Score Gauge */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Cumulative Score
            </span>
            <span className="text-2xl font-black text-navy-950">{impact.score}</span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-white border border-slate-200 shadow-xs">
            {impact.score >= 80 ? '🚨' : impact.score >= 60 ? '⚡' : impact.score >= 35 ? '⚠️' : 'ℹ️'}
          </div>
        </div>
      </div>

      {/* 5 Factor Breakdown Progress Bars */}
      <div className="space-y-3.5 text-xs">
        {/* Factor 1: Infrastructure Severity */}
        <div className="space-y-1">
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Infrastructure Damage Severity
            </span>
            <span className="font-bold text-navy-950">
              {impact.factors.infrastructureSeverity.score} /{' '}
              {impact.factors.infrastructureSeverity.max} pts
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{
                width: `${
                  (impact.factors.infrastructureSeverity.score /
                    impact.factors.infrastructureSeverity.max) *
                  100
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500">{impact.factors.infrastructureSeverity.detail}</p>
        </div>

        {/* Factor 2: Public Safety Hazard */}
        <div className="space-y-1">
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Public Safety Risk & Bodily Hazard
            </span>
            <span className="font-bold text-navy-950">
              {impact.factors.publicSafety.score} / {impact.factors.publicSafety.max} pts
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-rose-600 rounded-full"
              style={{
                width: `${
                  (impact.factors.publicSafety.score / impact.factors.publicSafety.max) * 100
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500">{impact.factors.publicSafety.detail}</p>
        </div>

        {/* Factor 3: Traffic Disruption */}
        <div className="space-y-1">
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              Traffic & Arterial Transit Disruption
            </span>
            <span className="font-bold text-navy-950">
              {impact.factors.trafficDisruption.score} / {impact.factors.trafficDisruption.max} pts
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{
                width: `${
                  (impact.factors.trafficDisruption.score / impact.factors.trafficDisruption.max) *
                  100
                }%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{impact.factors.trafficDisruption.detail}</span>
            <span className="text-[10px] text-slate-400 italic">
              {impact.factors.trafficDisruption.dataStatus}
            </span>
          </div>
        </div>

        {/* Factor 4: Affected Population & Footfall */}
        <div className="space-y-1">
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Pedestrian Footfall & Facility Proximity
            </span>
            <span className="font-bold text-navy-950">
              {impact.factors.footfallRisk.score} / {impact.factors.footfallRisk.max} pts
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full"
              style={{
                width: `${
                  (impact.factors.footfallRisk.score / impact.factors.footfallRisk.max) * 100
                }%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{impact.factors.footfallRisk.detail}</span>
            <span className="text-[10px] text-slate-400 italic">
              {impact.factors.footfallRisk.dataStatus}
            </span>
          </div>
        </div>

        {/* Factor 5: Issue Duration */}
        <div className="space-y-1">
          <div className="flex justify-between items-center font-semibold">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Unresolved Grievance Duration
            </span>
            <span className="font-bold text-navy-950">
              {impact.factors.durationDelay.score} / {impact.factors.durationDelay.max} pts
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{
                width: `${
                  (impact.factors.durationDelay.score / impact.factors.durationDelay.max) * 100
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500">{impact.factors.durationDelay.detail}</p>
        </div>
      </div>

      {/* Explanation Note */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
        <span className="font-bold text-navy-950 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          Scoring Rationale & Data Integrity Note
        </span>
        <p className="leading-relaxed text-slate-600">{impact.explanation}</p>
        <p className="text-[10px] text-slate-400 pt-1 italic">
          Inputs are derived from actual complaint details and verified municipal asset registers.
          Estimated data points are explicitly marked and never synthesized without baseline.
        </p>
      </div>
    </div>
  );
};
