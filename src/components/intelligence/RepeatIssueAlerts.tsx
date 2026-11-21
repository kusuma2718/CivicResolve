import React from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  Wrench,
  ChevronRight,
  Flame,
  Info,
} from 'lucide-react';
import { RepeatIssueRecord } from '../../services/intelligenceService';
import { ComplaintCategory } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { useNavigate } from 'react-router-dom';

interface RepeatIssueAlertsProps {
  repeatIssues: RepeatIssueRecord[];
  chronicHotspots: Array<{
    location: string;
    category: string;
    totalOccurrences: number;
    latitude: number;
    longitude: number;
  }>;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const RepeatIssueAlerts: React.FC<RepeatIssueAlertsProps> = ({
  repeatIssues,
  chronicHotspots,
  isLoading,
  onRefresh: _onRefresh,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-card">
        <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-navy-950">
          Scanning municipal registry for repeat recurring failures...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-navy-950 text-white rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center flex-shrink-0 text-rose-300">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight">
                  Repeat-Issue & Chronic Hotspot Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  {repeatIssues.length} Active Recurring Failures
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1">
                Flags recurring infrastructure defects at locations previously signed off as "Resolved".
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-rose-200 block uppercase font-bold">
                Identified Hotspots
              </span>
              <span className="text-lg font-black text-white">{chronicHotspots.length}</span>
            </div>
          </div>
        </div>

        {/* Distinct from Duplicates Explanatory Note */}
        <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-xs text-rose-100 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-rose-300 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Key Distinction from Duplicates:</strong> Duplicates represent simultaneous
            reports of one ongoing incident. Repeat issues indicate a <em>re-break</em> or recurring
            defect at a site where repairs were completed and closed, signaling potential sub-base,
            material, or structural fatigue.
          </p>
        </div>
      </div>

      {/* Chronic Hotspots Bar */}
      {chronicHotspots.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-3">
          <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Chronic Infrastructure Recurrence Zones (≥ 2 Historical Breakages)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {chronicHotspots.map((spot, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-950 truncate max-w-[70%]">
                    {spot.location}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                    {spot.totalOccurrences}x Recurring
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <CategoryBadge category={spot.category as ComplaintCategory} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repeat Issues Detailed Cards List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
        <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
          Active Repeat-Issue Incidents Requiring Root-Cause Overhaul
        </h4>

        {repeatIssues.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 text-slate-500 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-semibold text-slate-900">No Chronic Repeat Issues Detected</p>
            <p>All current reports are unique first-time occurrences.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {repeatIssues.map((record) => (
              <div
                key={record.currentComplaintId}
                className="p-5 rounded-xl border-2 border-rose-200 bg-gradient-to-br from-white via-rose-50/20 to-orange-50/10 shadow-xs space-y-3"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {record.alertSeverity} Repeat Alert
                    </span>
                    <span className="text-xs font-bold text-navy-950">
                      Recurrence #{record.recurrenceCount} at this site
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      [Dist: ~{record.distanceMeters}m from previous fix]
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-lg">
                    Reoccurred {record.daysSinceLastResolution} days after resolution
                  </span>
                </div>

                {/* Complaint Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Current Active Report */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Current Active Grievance
                      </span>
                      <span className="font-mono font-bold text-rose-700">
                        {record.currentComplaintId}
                      </span>
                    </div>
                    <h5 className="font-bold text-navy-950 line-clamp-2">
                      {record.currentTitle}
                    </h5>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {record.location}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <StatusBadge status={record.currentStatus} size="sm" />
                      <button
                        type="button"
                        onClick={() => navigate(`/track/${record.currentComplaintId}`)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Inspect Current <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Previous Resolved Record */}
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Previous Resolved Record
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {record.previousResolvedComplaintId}
                      </span>
                    </div>
                    <h5 className="font-bold text-emerald-950 line-clamp-2">
                      {record.previousResolvedTitle}
                    </h5>
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      Resolved on: {new Date(record.previousResolvedDate).toLocaleDateString()}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Closed in Registry
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/track/${record.previousResolvedComplaintId}`)}
                        className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                      >
                        View Past Record <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Engineering Root-Cause Recommendation */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                  <Wrench className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      Engineering Recommendation for Field Supervisors:
                    </span>
                    <p className="mt-0.5 text-amber-900 leading-relaxed">
                      {record.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
