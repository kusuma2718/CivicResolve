import React from 'react';
import { ComplaintCategory } from '../../types';
import {
  Construction,
  Trash2,
  Lightbulb,
  Droplets,
  Waves,
  Building2,
  Car,
  HelpCircle
} from 'lucide-react';

interface CategoryBadgeProps {
  category: ComplaintCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const getCategoryDetails = () => {
    switch (category) {
      case 'Roads and Potholes':
        return {
          icon: Construction,
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'Garbage and Sanitation':
        return {
          icon: Trash2,
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'Streetlights and Electricity':
        return {
          icon: Lightbulb,
          bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        };
      case 'Water Supply and Leakage':
        return {
          icon: Droplets,
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        };
      case 'Drainage and Sewage':
        return {
          icon: Waves,
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'Public Infrastructure':
        return {
          icon: Building2,
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'Traffic and Transportation':
        return {
          icon: Car,
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'Other':
      default:
        return {
          icon: HelpCircle,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const { icon: Icon, bg } = getCategoryDetails();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{category}</span>
    </span>
  );
};
