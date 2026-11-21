import React, { useState, useEffect } from 'react';
import {
  CopyCheck,
  Search,
  Link2,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  IntelligenceService,
  DuplicateCandidate,
} from '../../services/intelligenceService';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { ComplaintCategory } from '../../types';

interface DuplicateDetectorProps {
  initialDescription?: string;
  initialCategory?: ComplaintCategory;
  activeComplaintId?: string;
  onLinkSuccess?: (complaintId: string, duplicateOfId: string) => void;
  availableComplaints?: Array<{
    id: string;
    title: string;
    category?: string;
    description?: string;
  }>;
}

export const DuplicateDetector: React.FC<DuplicateDetectorProps> = ({
  initialDescription = '',
  initialCategory,
  activeComplaintId,
  onLinkSuccess,
  availableComplaints,
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<ComplaintCategory | undefined>(initialCategory);
  const [selectedSourceId, setSelectedSourceId] = useState<string>(activeComplaintId || '');
  const [isChecking, setIsChecking] = useState(false);
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('');

  useEffect(() => {
    if (activeComplaintId) {
      setSelectedSourceId(activeComplaintId);
    }
  }, [activeComplaintId]);

  const handleSelectComplaint = (id: string) => {
    setSelectedSourceId(id);
    setErrorMessage(null);
    setSuccessMessage(null);
    const found = availableComplaints?.find((c) => c.id === id);
    if (found) {
      if (found.description) setDescription(found.description);
      if (found.category) setCategory(found.category as ComplaintCategory);
    }
  };

  const handleCheckDuplicates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Please enter at least 5 characters to check for duplicate complaints.');
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await IntelligenceService.checkDuplicates({
      description: description.trim(),
      category,
      excludeId: selectedSourceId || activeComplaintId,
    });

    setIsChecking(false);
    setHasSearched(true);

    if (result) {
      setCandidates(result.candidates);
      setModelUsed(result.embeddingModelUsed);
    } else {
      setErrorMessage('Could not complete duplicate check. Please verify connection.');
    }
  };

  const handleLink = async (duplicateOfId: string) => {
    const sourceIdToUse = selectedSourceId || activeComplaintId;
    if (!sourceIdToUse) {
      setErrorMessage('Please select or specify which active complaint you want to link as duplicate.');
      return;
    }

    setLinkingId(duplicateOfId);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await IntelligenceService.linkDuplicate({
      complaintId: sourceIdToUse,
      duplicateOfId,
      actorName: 'Municipal Officer Console',
      actorRole: 'Officer',
    });

    setLinkingId(null);

    if (res.success) {
      setSuccessMessage(res.message);
      if (onLinkSuccess) onLinkSuccess(sourceIdToUse, duplicateOfId);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CopyCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-navy-950 text-base">
              Semantic Duplicate Complaint Detection
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
              Text Embeddings + Geo-Proximity
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detects co-incident reports before intake to avoid redundant crew dispatch. Complaints are
            linked and never discarded.
          </p>
        </div>

        {modelUsed && (
          <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            Engine: {modelUsed}
          </span>
        )}
      </div>

      {/* Input Search Form */}
      <form onSubmit={handleCheckDuplicates} className="space-y-3">
        {/* Optional Active Complaint Selector */}
        {availableComplaints && availableComplaints.length > 0 && (
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Active Complaint Ticket to Evaluate (Optional)
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => handleSelectComplaint(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-medium"
            >
              <option value="">-- Select an active complaint from registry or type description below --</option>
              {availableComplaints.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Complaint Description to Evaluate
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Hazardous deep pothole outside Central Metro Station Gate 2..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isChecking || !description.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Embeddings...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check For Duplicates</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick test suggestion triggers */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test Samples:</span>
          <button
            type="button"
            onClick={() => {
              setDescription('Massive crater and pothole near metro gate 2 causing severe bike skids.');
              setCategory('Roads and Potholes');
            }}
            className="text-[11px] text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded"
          >
            MG Road Pothole
          </button>
          <button
            type="button"
            onClick={() => {
              setDescription('Clean water leaking from cracked underground pipeline onto street.');
              setCategory('Water Supply and Leakage');
            }}
            className="text-[11px] text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded"
          >
            Water Leakage
          </button>
        </div>
      </form>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>Potential Matching Complaints</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                {candidates.length} match{candidates.length === 1 ? '' : 'es'} found
              </span>
            </h4>
            <span className="text-[11px] text-slate-400">Threshold: ≥ 35% similarity</span>
          </div>

          {candidates.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-navy-950">No Significant Duplicates Found</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The semantic embedding score and geographic proximity did not match any ongoing open
                complaints. This complaint appears unique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((cand) => {
                const matchPct = Math.round(cand.similarityScore * 100);
                const isHighMatch = matchPct >= 65;

                return (
                  <div
                    key={cand.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isHighMatch
                        ? 'border-indigo-300 bg-indigo-50/30 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {cand.id}
                          </span>
                          <CategoryBadge category={cand.category} />
                          <PriorityBadge priority={cand.priority} />
                          <StatusBadge status={cand.status} size="sm" />
                        </div>

                        <h5 className="font-bold text-xs sm:text-sm text-navy-950">
                          {cand.title}
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {cand.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {cand.location}
                          </span>
                          {cand.geographicDistanceKm !== null && (
                            <span className="font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                              {cand.geographicDistanceKm < 1
                                ? `${Math.round(cand.geographicDistanceKm * 1000)}m away`
                                : `${cand.geographicDistanceKm} km away`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(cand.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Similarity Score & Actions Column */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:min-w-[150px]">
                        <div className="text-right">
                          <span
                            className={`text-base font-extrabold ${
                              isHighMatch ? 'text-indigo-600' : 'text-slate-700'
                            }`}
                          >
                            {matchPct}% Match
                          </span>
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHighMatch ? 'bg-indigo-600' : 'bg-slate-500'
                              }`}
                              style={{ width: `${matchPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Matching Factors tags */}
                        <div className="flex flex-wrap gap-1 justify-end pt-1">
                          {cand.matchingFactors.map((f, i) => (
                            <span
                              key={i}
                              className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              {f.replace('_', ' ')}
                            </span>
                          ))}
                        </div>

                        {/* Link Button */}
                        {(selectedSourceId || activeComplaintId) && (
                          <button
                            type="button"
                            onClick={() => handleLink(cand.id)}
                            disabled={linkingId === cand.id}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                            title={`Link ${selectedSourceId || activeComplaintId} as duplicate of ${cand.id}`}
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>
                              {linkingId === cand.id
                                ? 'Linking...'
                                : `Link ${selectedSourceId || activeComplaintId}`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              <strong>Zero-Data-Loss Guarantee:</strong> Linking records connects complaints for
              unified municipal action without deleting, discarding, or muting any citizen report.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
