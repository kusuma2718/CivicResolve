import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  User,
  Copy,
  Check,
  AlertTriangle,
  FileCheck2,
  Clock
} from 'lucide-react';
import { useComplaints } from '../hooks/useComplaints';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { DemoBadge } from '../components/common/DemoBadge';
import { TimelineView } from '../components/common/TimelineView';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getComplaintById, fetchComplaintById } = useComplaints();
  const [copied, setCopied] = React.useState(false);
  const [asyncComplaint, setAsyncComplaint] = React.useState<any>(null);

  const complaint = (id ? getComplaintById(id) : undefined) || asyncComplaint;

  React.useEffect(() => {
    if (id && !getComplaintById(id)) {
      fetchComplaintById(id).then((data) => {
        if (data) setAsyncComplaint(data);
      });
    }
  }, [id, fetchComplaintById, getComplaintById]);

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-navy-950">Complaint Not Found</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          No civic complaint could be located with tracking ID <strong>{id}</strong>. Please check the spelling or view all active reports.
        </p>
        <div className="pt-4">
          <Link
            to="/track"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Issue Tracker</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/track')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-navy-950 bg-white px-3.5 py-2 rounded-lg border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tracker</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-lg border border-slate-200/90 shadow-xs hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied ID!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy ID ({complaint.id})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">
              {complaint.id}
            </span>
            <DemoBadge isSample={complaint.isSample} />
            <StatusBadge status={complaint.status} size="md" />
            <PriorityBadge priority={complaint.priority} />
            <CategoryBadge category={complaint.category} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Updated: {formatDate(complaint.updatedAt)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 leading-snug">
            {complaint.title}
          </h1>
          <p className="text-base text-slate-700 leading-relaxed max-w-4xl">
            {complaint.description}
          </p>

          {/* AI Translated Description if available */}
          {complaint.translatedDescription && (
            <div className="mt-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-navy-900 max-w-4xl space-y-1">
              <span className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                AI Translated Description (for Municipal Administrators)
              </span>
              <p className="text-navy-800 leading-relaxed italic">
                "{complaint.translatedDescription}"
              </p>
              {complaint.originalLanguage && (
                <span className="text-[10px] text-blue-600 block pt-0.5">
                  Originally submitted in: {complaint.originalLanguage.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Evidence Image */}
        {complaint.imageUrl && (
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Citizen Photo Evidence
            </h4>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-96 w-full max-w-2xl">
              <img
                src={complaint.imageUrl}
                alt={complaint.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs">
          {/* Location */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>Location / Geo-Target</span>
            </div>
            <p className="font-semibold text-slate-900">{complaint.location}</p>
            <p className="text-slate-500">
              {complaint.city}, {complaint.state}
            </p>
          </div>

          {/* Department */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Assigned Department</span>
            </div>
            <p className="font-semibold text-slate-900">{complaint.department}</p>
            <p className="text-slate-500">
              Officer: {complaint.assignedOfficer || 'Under Allocation'}
            </p>
          </div>

          {/* Citizen Reporter */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reported By</span>
            </div>
            <p className="font-semibold text-slate-900">{complaint.citizenName}</p>
            <p className="text-slate-500">{complaint.email}</p>
          </div>
        </div>
      </div>

      {/* Resolution Milestone Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-navy-950 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-brand-600" />
              <span>Official Resolution Timeline</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable audit log of all triage milestones, dispatches, and field verification notes
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {complaint.timeline.length} Recorded Milestone{complaint.timeline.length > 1 ? 's' : ''}
          </span>
        </div>

        <TimelineView timeline={complaint.timeline} />
      </div>
    </div>
  );
};
