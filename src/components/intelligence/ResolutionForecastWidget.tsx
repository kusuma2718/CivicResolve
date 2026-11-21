import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Calendar,
  Info,
} from 'lucide-react';
import {
  ResolutionForecast,
  IntelligenceService,
} from '../../services/intelligenceService';
import { ComplaintCategory, PriorityLevel } from '../../types';

interface ResolutionForecastWidgetProps {
  initialCategory?: ComplaintCategory;
  initialDepartmentId?: string;
}

export const ResolutionForecastWidget: React.FC<ResolutionForecastWidgetProps> = ({
  initialCategory = 'Roads and Potholes',
  initialDepartmentId = 'dept-pwd',
}) => {
  const [category, setCategory] = useState<ComplaintCategory>(initialCategory);
  const [departmentId, setDepartmentId] = useState<string>(initialDepartmentId);
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [forecast, setForecast] = useState<ResolutionForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchForecast = async () => {
    setIsLoading(true);
    const res = await IntelligenceService.getResolutionForecast({
      category,
      departmentId,
      priority,
    });
    setForecast(res);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchForecast();
  }, [category, departmentId, priority]);

  const categories: ComplaintCategory[] = [
    'Roads and Potholes',
    'Garbage and Sanitation',
    'Streetlights and Electricity',
    'Water Supply and Leakage',
    'Drainage and Sewage',
    'Traffic and Transportation',
    'Public Infrastructure',
  ];

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Preliminary':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-navy-950 text-base">
              Predictive Resolution Turnaround Forecasting
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
              Actuarial Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Projects expected completion turnaround using empirical closed-case telemetry and department velocity.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Civic Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Department</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
          >
            <option value="dept-pwd">Public Works Department (PWD)</option>
            <option value="dept-sanitation">Municipal Sanitation Department</option>
            <option value="dept-water">Water & Sewage Management Board</option>
            <option value="dept-electricity">Electricity & Streetlight Board</option>
            <option value="dept-traffic">Traffic Management Division</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Priority Weighting</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
          >
            <option value="Critical">Critical (Accelerated dispatch)</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium (Baseline)</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center space-y-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Calculating resolution velocity...</p>
        </div>
      )}

      {/* Forecast Output */}
      {!isLoading && forecast && (
        <div className="space-y-4 pt-1">
          {/* Sufficient Data View */}
          {forecast.isDataSufficient ? (
            <div className="p-5 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/40 via-white to-blue-50/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                    Estimated Time to Resolution
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-navy-950">
                      {forecast.estimatedHours} hrs
                    </span>
                    <span className="text-sm font-bold text-teal-700">
                      (~{forecast.estimatedDays} days)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Confidence Level
                    </span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getConfidenceBadge(
                        forecast.confidenceLevel
                      )}`}
                    >
                      {forecast.confidenceLevel} ({Math.round(forecast.confidenceScore * 100)}%)
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Sample Size
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {forecast.sampleCount} closed cases
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Date Projection */}
              {forecast.estimatedCompletionDate && (
                <div className="p-3 bg-white rounded-lg border border-teal-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Projected Completion Window:
                  </span>
                  <span className="font-bold text-navy-950">
                    {new Date(forecast.estimatedCompletionDate).toLocaleDateString([], {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Historical Statistics Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Historical Median
                  </span>
                  <span className="font-bold text-navy-950">
                    {forecast.historicalMedianHours} hrs
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Historical Mean
                  </span>
                  <span className="font-bold text-navy-950">
                    {forecast.historicalMeanHours} hrs
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Variance (Std Dev)
                  </span>
                  <span className="font-bold text-navy-950">
                    ±{forecast.standardDeviationHours} hrs
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-lg border border-teal-50">
                {forecast.explanation}
              </p>
            </div>
          ) : (
            /* Insufficient Data State */
            <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 text-xs">
              <div className="flex items-start gap-3 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-950">
                    Data Sufficiency Threshold Not Yet Reached
                  </h4>
                  <p className="leading-relaxed text-amber-800">{forecast.explanation}</p>
                </div>
              </div>
              <div className="p-3 bg-white/80 rounded-lg border border-amber-200/80 text-[11px] text-slate-600">
                <strong>Why is this shown?</strong> CivicResolve maintains strict actuarial
                integrity and never fabricates artificial predictions without verified closed-case
                resolution timestamps. Once at least 2 complaints in this sector are resolved and signed
                off, statistical forecasting will automatically activate.
              </div>
            </div>
          )}

          {/* Prominent Mandatory Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Prediction Disclaimer:</strong> {forecast.disclaimer} Environmental factors,
              monsoon conditions, supply chain availability, and emergency diversions may impact
              actual field turnaround.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
