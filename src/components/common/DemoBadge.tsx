import React from 'react';
import { Database, Sparkles } from 'lucide-react';

interface DemoBadgeProps {
  isSample: boolean;
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ isSample, className = '' }) => {
  if (isSample) {
    return (
      <span
        title="Simulated municipal dataset for hackathon preview"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-500 border border-slate-200 ${className}`}
      >
        <Database className="w-2.5 h-2.5" />
        <span>Demo Data</span>
      </span>
    );
  }

  return (
    <span
      title="Submitted during current browser session"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
    >
      <Sparkles className="w-2.5 h-2.5 text-blue-500" />
      <span>Citizen Entry</span>
    </span>
  );
};
