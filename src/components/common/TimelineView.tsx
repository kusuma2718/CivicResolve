import React from 'react';
import { TimelineEvent } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, UserCheck, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface TimelineViewProps {
  timeline: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  const sorted = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getEventIcon = (index: number, total: number, status: string) => {
    if (status === 'Resolved') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (index === 0) {
      return <Clock className="w-4 h-4 text-brand-600" />;
    }
    if (index === total - 1) {
      return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    }
    return <UserCheck className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((event, idx) => (
        <div key={event.id} className="relative group">
          {/* Timeline bullet */}
          <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-white border-2 border-slate-300 group-hover:border-brand-500 flex items-center justify-center shadow-sm transition-colors">
            {getEventIcon(idx, sorted.length, event.status)}
          </div>

          {/* Event Content Card */}
          <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-navy-950">{event.title}</h4>
              <div className="flex items-center gap-2">
                <StatusBadge status={event.status} size="sm" />
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(event.timestamp)}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-3">{event.description}</p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-700">Handler / Entity:</span>
                <span className="text-navy-900 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                  {event.actor}
                </span>
              </div>
              {event.notes && (
                <div className="text-slate-500 italic text-[11px] max-w-md">
                  Note: {event.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
