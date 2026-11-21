import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Info,
  RefreshCw,
  X,
  ShieldAlert,
  Eye,
  Tag,
  KeyRound,
} from 'lucide-react';
import {
  AIClassificationResult,
  AIImageAnalysisResult,
  AIServiceError,
} from '../../services/aiService';
import { PriorityBadge } from '../common/PriorityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { ComplaintCategory, PriorityLevel } from '../../types';

interface AIAnalysisPanelProps {
  classification: AIClassificationResult | null;
  imageAnalysis?: AIImageAnalysisResult | null;
  isLoading: boolean;
  loadingMessage?: string;
  error?: AIServiceError | null;
  onApply: (recommendations: {
    category: ComplaintCategory;
    subcategory: string;
    priority: PriorityLevel;
    severityScore: number;
    departmentRecommendation: string;
    aiReason?: string;
  }) => void;
  onDismiss: () => void;
  onRetry?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  classification,
  imageAnalysis,
  isLoading,
  loadingMessage = 'Analyzing with Gemini AI...',
  error,
  onApply,
  onDismiss,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <Sparkles className="h-6 w-6 animate-spin text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-navy-950 flex items-center gap-2">
              Gemini AI Intelligence
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                gemini-1.5-flash
              </span>
            </h4>
            <p className="text-sm text-navy-600 mt-0.5">{loadingMessage}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-navy-500">
          <div className="h-1.5 w-full bg-blue-200/60 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not Configured State
  if (error) {
    const isMissingKey = !error.isConfigured || error.statusCode === 503;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-sm">
        <div className="flex items-start gap-3">
          {isMissingKey ? (
            <KeyRound className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-amber-950">
              {isMissingKey ? 'Gemini AI Configuration Notice' : 'AI Analysis Unavailable'}
            </h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              {isMissingKey
                ? 'To activate real-time Gemini AI classification, image analysis, and language detection, add your GEMINI_API_KEY in the server/.env file. You can still report issues normally with manual category selection.'
                : error.message}
            </p>
            {isMissingKey && (
              <div className="mt-2 text-xs font-mono bg-amber-100/80 p-2 rounded text-amber-900 border border-amber-200">
                GEMINI_API_KEY=your_gemini_api_key_here
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs text-amber-700 hover:text-amber-950 underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="text-amber-500 hover:text-amber-800 p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!classification) return null;

  return (
    <div className="rounded-xl border-2 border-blue-400/50 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-5 shadow-lg relative transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-blue-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-navy-950 text-sm">
                Gemini AI Assessment & Triage
              </h4>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                {(classification.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
            <p className="text-xs text-navy-500">
              Generated by Google Gemini 1.5 Flash • Review before submission
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-navy-400 hover:text-navy-700 p-1 transition-colors"
          title="Dismiss AI suggestions"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Grid of Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
        {/* Category Recommendation */}
        <div className="rounded-lg bg-white p-3 border border-blue-100/80 shadow-sm">
          <span className="text-[11px] font-medium text-navy-500 uppercase tracking-wider block mb-1">
            Detected Category
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={classification.category} />
          </div>
          {classification.subcategory && (
            <p className="text-xs text-navy-600 mt-1.5 font-medium">
              Sub: {classification.subcategory}
            </p>
          )}
        </div>

        {/* Priority & Severity */}
        <div className="rounded-lg bg-white p-3 border border-blue-100/80 shadow-sm">
          <span className="text-[11px] font-medium text-navy-500 uppercase tracking-wider block mb-1">
            Smart Priority & Severity
          </span>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={classification.priority} />
            <span className="text-xs font-bold text-navy-700 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
              Severity: {classification.severityScore}/10
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                classification.priority === 'Critical'
                  ? 'bg-rose-500 w-full'
                  : classification.priority === 'High'
                  ? 'bg-amber-500 w-3/4'
                  : classification.priority === 'Medium'
                  ? 'bg-blue-500 w-1/2'
                  : 'bg-emerald-500 w-1/4'
              }`}
            />
          </div>
        </div>

        {/* Department Allocation */}
        <div className="rounded-lg bg-white p-3 border border-blue-100/80 shadow-sm">
          <span className="text-[11px] font-medium text-navy-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-blue-600" />
            Recommended Department
          </span>
          <p className="text-xs font-semibold text-navy-900 leading-tight">
            {classification.departmentRecommendation || 'Public Works Department (PWD)'}
          </p>
          <p className="text-[11px] text-navy-500 mt-1">Direct municipal routing</p>
        </div>
      </div>

      {/* AI Reasoning */}
      {classification.reason && (
        <div className="mt-3.5 bg-blue-50/60 rounded-lg p-3 border border-blue-100 text-xs text-navy-800">
          <div className="font-semibold text-navy-950 flex items-center gap-1.5 mb-1">
            <Info className="h-3.5 w-3.5 text-blue-600" />
            AI Rationale & Public Safety Context
          </div>
          <p className="leading-relaxed">{classification.reason}</p>
        </div>
      )}

      {/* Extracted Keywords */}
      {classification.extractedKeywords && classification.extractedKeywords.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-navy-500 font-medium flex items-center gap-1">
            <Tag className="h-3 w-3" /> Keywords:
          </span>
          {classification.extractedKeywords.slice(0, 5).map((kw, i) => (
            <span
              key={i}
              className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Multimodal Image Intelligence Card (if image was analyzed) */}
      {imageAnalysis && (
        <div className="mt-3.5 rounded-lg border border-purple-200 bg-purple-50/40 p-3.5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-purple-950 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-purple-600" />
              Multimodal Image Verification (Gemini Vision)
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                imageAnalysis.hasValidCivicDefect
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {imageAnalysis.hasValidCivicDefect ? 'Valid Civic Issue Detected' : 'Uncertain Defect'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-navy-800 mt-2">
            <div>
              <span className="text-[10px] text-navy-500 font-medium uppercase block">
                Visual Defect Type
              </span>
              <p className="font-semibold text-xs text-navy-900">{imageAnalysis.defectType}</p>
            </div>
            <div>
              <span className="text-[10px] text-navy-500 font-medium uppercase block">
                Description Consistency Check
              </span>
              <p className="font-semibold text-xs text-navy-900">
                {imageAnalysis.consistencyCheck || 'Consistent with description'}
              </p>
            </div>
          </div>

          {imageAnalysis.visibleDamageDescription && (
            <p className="mt-2 text-navy-700 text-xs italic bg-white/70 p-2 rounded border border-purple-100">
              "{imageAnalysis.visibleDamageDescription}"
            </p>
          )}

          {imageAnalysis.safetyHazardsIdentified &&
            imageAnalysis.safetyHazardsIdentified.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Hazards:
                </span>
                {imageAnalysis.safetyHazardsIdentified.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-navy-500 flex items-center gap-1">
          <Info className="h-3 w-3 text-blue-500" />
          Note: AI cannot verify exact physical location from image pixels alone.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-navy-700 hover:text-navy-950 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Edit Manually
          </button>
          <button
            type="button"
            onClick={() =>
              onApply({
                category: classification.category,
                subcategory: classification.subcategory,
                priority: classification.priority,
                severityScore: classification.severityScore,
                departmentRecommendation: classification.departmentRecommendation,
                aiReason: classification.reason,
              })
            }
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Apply Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};
