import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'navy';
  badge?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
  badge,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-brand-600',
      border: 'border-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
    red: {
      bg: 'bg-red-50 text-red-600',
      border: 'border-red-100',
    },
    navy: {
      bg: 'bg-slate-100 text-navy-900',
      border: 'border-slate-200',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
            {badge && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-navy-950 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${scheme.bg} border ${scheme.border}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
