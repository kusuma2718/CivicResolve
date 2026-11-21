import React from 'react';
import { ComplaintStatus } from '../../types';
import { Clock, AlertCircle, CheckCircle2, RotateCw, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  switch (status) {
    case 'Reported':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Reported</span>
        </span>
      );
    case 'Under Review':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span>Under Review</span>
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses}`}>
          <RotateCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resolved</span>
        </span>
      );
    case 'Rejected':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Rejected</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};
