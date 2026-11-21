import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Building2,
  User,
  Mail,
  FileText,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CopyCheck,
  ExternalLink,
} from 'lucide-react';
import { ComplaintCategory, NewComplaintInput, PriorityLevel } from '../types';
import { useComplaints } from '../hooks/useComplaints';
import { getDepartmentForCategory } from '../services/complaintStore';
import {
  AIService,
  AIClassificationResult,
  AIImageAnalysisResult,
  AIServiceError,
} from '../services/aiService';
import { AIAnalysisPanel } from '../components/ai/AIAnalysisPanel';
import {
  IntelligenceService,
  DuplicateCandidate,
} from '../services/intelligenceService';

const CATEGORIES: ComplaintCategory[] = [
  'Roads and Potholes',
  'Garbage and Sanitation',
  'Streetlights and Electricity',
  'Water Supply and Leakage',
  'Drainage and Sewage',
  'Public Infrastructure',
  'Traffic and Transportation',
  'Other',
];

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  city?: string;
  state?: string;
  citizenName?: string;
  email?: string;
}

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addComplaint } = useComplaints();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Roads and Potholes' as ComplaintCategory,
    location: '',
    city: '',
    state: '',
    citizenName: '',
    email: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Gemini AI state
  const [aiClassification, setAiClassification] = useState<AIClassificationResult | null>(null);
  const [aiImageAnalysis, setAiImageAnalysis] = useState<AIImageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiLoadingMessage, setAiLoadingMessage] = useState('Analyzing issue with Gemini AI...');
  const [aiError, setAiError] = useState<AIServiceError | null>(null);
  const [appliedAiData, setAppliedAiData] = useState<{
    priority?: PriorityLevel;
    severityScore?: number;
    subcategory?: string;
    departmentRecommendation?: string;
    aiReason?: string;
  } | null>(null);

  // Pre-submission duplicate check state
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [dismissDuplicateNotice, setDismissDuplicateNotice] = useState(false);

  const handleCheckDuplicates = async () => {
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setErrors((prev) => ({
        ...prev,
        description: 'Enter at least 10 characters to check for existing reports.',
      }));
      return;
    }
    setIsCheckingDuplicates(true);
    try {
      const res = await IntelligenceService.checkDuplicates({
        description: formData.description.trim(),
        category: formData.category,
      });
      setDuplicateChecked(true);
      if (res && res.candidates && res.candidates.length > 0) {
        setDuplicateCandidates(res.candidates);
        setDismissDuplicateNotice(false);
      } else {
        setDuplicateCandidates([]);
      }
    } catch {
      // Non-blocking: silently ignore to never block submission
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!formData.description.trim()) {
      setErrors((prev) => ({ ...prev, description: 'Enter a description first for AI to analyze.' }));
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    setAiLoadingMessage('Classifying issue & detecting priority with Gemini 1.5 Flash...');

    try {
      // 1. Classify text
      const classRes = await AIService.classifyComplaint(formData.description, 'en');
      if (classRes.error) {
        setAiError(classRes.error);
        setIsAnalyzing(false);
        return;
      }
      setAiClassification(classRes.data);

      // 2. Multimodal image analysis if image is provided
      if (imageFile) {
        setAiLoadingMessage('Analyzing evidence photograph with Gemini Multimodal Vision...');
        const imgRes = await AIService.analyzeImage(imageFile, formData.description);
        if (imgRes.data) {
          setAiImageAnalysis(imgRes.data);
        }
      }
    } catch {
      setAiError({
        isConfigured: false,
        message: 'Could not complete AI analysis due to a connection issue.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, WEBP).');
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Issue title is required.';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title should be at least 5 characters.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please describe the civic issue in detail.';
    } else if (formData.description.trim().length < 15) {
      newErrors.description = 'Description should provide at least 15 characters of detail.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Specific street address or landmark is required.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required.';
    }

    if (!formData.citizenName.trim()) {
      newErrors.citizenName = 'Citizen full name is required for administrative filing.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required for status updates.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstErrorEl = document.querySelector('.form-error-marker');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const newComplaintInput: NewComplaintInput = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        category: formData.category,
        citizenName: formData.citizenName,
        email: formData.email,
        image: imageFile,
        imagePreviewUrl: imagePreviewUrl || undefined,
        priority: appliedAiData?.priority,
        severityScore: appliedAiData?.severityScore,
        subcategory: appliedAiData?.subcategory,
        departmentRecommendation: appliedAiData?.departmentRecommendation,
        aiReason: appliedAiData?.aiReason,
        imageId: aiImageAnalysis?.imageId,
      };

      const created = await addComplaint(newComplaintInput);
      setSubmittedId(created.id);
    } catch (err) {
      console.error('Failed to submit complaint', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const recommendedDept = getDepartmentForCategory(formData.category);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
          <FileText className="w-3.5 h-3.5" />
          <span>{t('report.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          {t('report.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          {t('report.subtitle')}
        </p>

        {/* Phase 3 Gemini AI Intelligence Notice Box */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 text-blue-950 text-xs flex items-start gap-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="space-y-1">
            <span className="font-bold">Phase 3: Gemini AI Intelligence Active</span>
            <p className="text-blue-800 leading-relaxed">
              Powered by Google Gemini 1.5 Flash. You can now use AI to classify issues, detect priority severity, analyze uploaded photos, and get guided assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Submission Success Modal / Banner */}
      {submittedId && (
        <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-elevated animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-emerald-950">
                  Complaint Filed Successfully!
                </h3>
                <span className="px-2.5 py-1 rounded-md bg-emerald-200/80 text-emerald-900 text-xs font-mono font-bold">
                  {submittedId}
                </span>
              </div>
              <p className="text-sm text-emerald-800">
                Your report has been logged in the municipal triage registry and pre-assigned to{' '}
                <strong className="text-emerald-950 font-semibold">{recommendedDept}</strong>.
              </p>
              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/track/${submittedId}`)}
                  className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm inline-flex items-center gap-2"
                >
                  <span>Track This Complaint</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/track')}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-sm font-semibold shadow-xs"
                >
                  View All Complaints
                </button>
                <button
                  onClick={() => {
                    setSubmittedId(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: 'Roads and Potholes',
                      location: '',
                      city: '',
                      state: '',
                      citizenName: '',
                      email: '',
                    });
                    setImageFile(null);
                    setImagePreviewUrl(null);
                    setErrors({});
                  }}
                  className="px-5 py-2.5 rounded-lg text-emerald-800 hover:text-emerald-950 text-sm font-medium"
                >
                  File Another Complaint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Section 1: Issue Classification & Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Issue Details
            </h2>
            <span className="text-xs text-slate-400">* Required fields</span>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700">
              Civic Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-xs"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Recommended Authority: <strong>{recommendedDept}</strong></span>
            </p>
          </div>

          {/* Issue Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
              Issue Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Hazardous deep pothole near Central Metro Station Gate 2"
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.title ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
              } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
            />
            {errors.title && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              Detailed Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the nature of the issue, severity, how long it has persisted, and any hazards to pedestrians or motorists..."
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.description ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
              } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Optional Image Upload with Preview */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Evidence Photograph (Optional)
            </label>
            <p className="text-xs text-slate-500">
              Visual proof significantly expedites field verification and repair crew dispatch.
            </p>

            {!imagePreviewUrl ? (
              <div className="mt-2 border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500">
                    <Upload className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="text-sm text-slate-600">
                    <label
                      htmlFor="image-upload"
                      className="font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                    >
                      Click to upload an image
                    </label>{' '}
                    <span>or drag & drop</span>
                  </div>
                  <p className="text-xs text-slate-400">PNG, JPG, or WEBP up to 10MB</p>
                </div>
                <input
                  id="image-upload"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-md">
                <img
                  src={imagePreviewUrl}
                  alt="Complaint proof preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors shadow-md"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <ImageIcon className="w-4 h-4 text-brand-600" />
                    <span className="truncate">{imageFile?.name || 'Uploaded Photo'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Trigger & Panel */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Gemini AI Pre-Submission Intelligence
                </span>
                <p className="text-[11px] text-slate-500">
                  Analyze description & uploaded image for category, priority, and department allocation.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {appliedAiData && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AI Recommended: {appliedAiData.priority} Priority
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCheckDuplicates}
                  disabled={isCheckingDuplicates || formData.description.trim().length < 10}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all disabled:opacity-50"
                  title="Check if a similar complaint has already been submitted in the registry"
                >
                  <CopyCheck className={`w-3.5 h-3.5 text-indigo-600 ${isCheckingDuplicates ? 'animate-pulse' : ''}`} />
                  <span>{isCheckingDuplicates ? 'Checking Registry...' : 'Check Existing Reports'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAIAnalysis}
                  disabled={isAnalyzing || formData.description.trim().length < 10}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-navy-900 hover:from-blue-700 hover:to-navy-950 text-white text-xs font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze with Gemini AI'}</span>
                </button>
              </div>
            </div>

            {/* AI Analysis Results or Loading or Error */}
            {(isAnalyzing || aiClassification || aiError) && (
              <AIAnalysisPanel
                classification={aiClassification}
                imageAnalysis={aiImageAnalysis}
                isLoading={isAnalyzing}
                loadingMessage={aiLoadingMessage}
                error={aiError}
                onApply={(recs) => {
                  setFormData((prev) => ({ ...prev, category: recs.category }));
                  setAppliedAiData({
                    priority: recs.priority,
                    severityScore: recs.severityScore,
                    subcategory: recs.subcategory,
                    departmentRecommendation: recs.departmentRecommendation,
                    aiReason: recs.aiReason,
                  });
                }}
                onDismiss={() => {
                  setAiClassification(null);
                  setAiImageAnalysis(null);
                  setAiError(null);
                }}
                onRetry={handleRunAIAnalysis}
              />
            )}

            {/* Pre-submission Duplicate Check Warning (Non-blocking) */}
            {duplicateCandidates.length > 0 && !dismissDuplicateNotice && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CopyCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-navy-950">
                        Similar Existing Incident{duplicateCandidates.length > 1 ? 's' : ''} Detected ({duplicateCandidates.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        A matching issue may already be open with municipal teams. You can track the ongoing ticket or continue submitting yours.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissDuplicateNotice(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {duplicateCandidates.slice(0, 2).map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3 bg-white rounded-lg border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-700">{cand.id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {Math.round(cand.similarityScore * 100)}% Match
                          </span>
                          <span className="text-slate-500">• {cand.status}</span>
                        </div>
                        <p className="font-semibold text-navy-950 line-clamp-1">{cand.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{cand.location}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`/track/${cand.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <span>Track Existing</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-indigo-100/70 text-[11px] text-slate-500">
                  <span>Zero-Block Policy: Legitimate complaints are never discarded.</span>
                  <button
                    type="button"
                    onClick={() => setDismissDuplicateNotice(true)}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    Continue Submitting New Report →
                  </button>
                </div>
              </div>
            )}

            {/* Subtle Confirmation when search was clean */}
            {duplicateChecked && duplicateCandidates.length === 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No duplicate reports found. Your grievance will create a unique ticket.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateChecked(false)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Location Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              Location Information
            </h2>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="block text-sm font-semibold text-slate-700">
              Street Address or Landmark *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. 4th Cross Road, Indiranagar 2nd Stage (Near Post Office)"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  errors.location ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
                } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
              />
            </div>
            {errors.location && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.location}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="city" className="block text-sm font-semibold text-slate-700">
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g. Metro City"
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  errors.city ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
                } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
              />
              {errors.city && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.city}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="state" className="block text-sm font-semibold text-slate-700">
                State / Province *
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="e.g. Karnataka"
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  errors.state ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
                } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
              />
              {errors.state && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.state}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Citizen Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              Citizen Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="citizenName" className="block text-sm font-semibold text-slate-700">
                Your Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="citizenName"
                  name="citizenName"
                  value={formData.citizenName}
                  onChange={handleInputChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                    errors.citizenName ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
                  } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
                />
              </div>
              {errors.citizenName && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.citizenName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address (for resolution alerts) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. aarav.sharma@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                    errors.email ? 'border-red-500 bg-red-50/20 form-error-marker' : 'border-slate-200'
                  } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Official municipal intake pipeline • Transparent timeline log</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-1/2 sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 sm:w-auto px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Submit Complaint</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
