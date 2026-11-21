import { ComplaintCategory, PriorityLevel } from './index.js';

export interface AIClassificationResult {
  category: ComplaintCategory;
  subcategory: string;
  priority: PriorityLevel;
  severityScore: number; // 1-10
  departmentRecommendation: string;
  confidence: number;
  extractedKeywords: string[];
  summary: string;
}

export interface AIImageAnalysisResult {
  hasValidCivicDefect: boolean;
  defectType: string;
  severityAssessment: 'Low' | 'Medium' | 'High' | 'Critical';
  safetyHazardsIdentified: string[];
  visualTags: string[];
  confidence: number;
}

export interface AIDuplicateCheckResult {
  isPotentialDuplicate: boolean;
  duplicateOfComplaintId: string | null;
  similarityScore: number;
  matchingFactors: ('geographic_proximity' | 'textual_similarity' | 'visual_similarity')[];
  suggestedAction: 'merge' | 'link' | 'keep_separate';
}

export interface CommunityImpactScoreResult {
  score: number; // 1-100
  factors: {
    publicFootfallRisk: number;
    trafficDisruption: number;
    criticalInfrastructureProximity: number;
    durationUnresolvedDays: number;
  };
  urgencyLevel: 'Normal' | 'Elevated' | 'Urgent' | 'Emergency';
}

export interface MultilingualTranslationResult {
  detectedLanguage: string;
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  isAiGenerated: boolean;
}

export interface CivicHeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  complaintId: string;
  category: ComplaintCategory;
  priority: PriorityLevel;
}
