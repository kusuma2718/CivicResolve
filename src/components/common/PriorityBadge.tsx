import React from 'react';
import { PriorityLevel } from '../../types';
import { Flame, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          {showIcon && <Flame className="w-3 h-3 text-red-500 fill-red-500" />}
          <span>Critical</span>
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          {showIcon && <AlertTriangle className="w-3 h-3 text-orange-500" />}
          <span>High Priority</span>
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          {showIcon && <Info className="w-3 h-3 text-amber-500" />}
          <span>Medium</span>
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {showIcon && <ShieldCheck className="w-3 h-3 text-slate-500" />}
          <span>Low</span>
        </span>
      );
    default:
      return null;
  }
};
