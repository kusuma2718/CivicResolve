import { ComplaintCategory, PriorityLevel, ComplaintStatus } from './index.js';

export interface CivicHeatmapPoint {
  id: string;
  title: string;
  category: ComplaintCategory;
  priority: PriorityLevel;
  status: ComplaintStatus;
  department: string;
  latitude: number;
  longitude: number;
  communityImpactScore: number;
  createdAt: string;
}

export interface CivicHeatmapCluster {
  id: string;
  center: {
    latitude: number;
    longitude: number;
  };
  pointCount: number;
  complaintIds: string[];
  dominantCategory: ComplaintCategory;
  maxPriority: PriorityLevel;
  complaints: Array<{
    id: string;
    title: string;
    category: ComplaintCategory;
    priority: PriorityLevel;
    status: ComplaintStatus;
    location: string;
    communityImpactScore: number;
  }>;
}

export interface HeatmapResponse {
  points: CivicHeatmapPoint[];
  clusters: CivicHeatmapCluster[];
  totalGeoTagged: number;
  unmappedCount: number;
  unmappedComplaints: Array<{
    id: string;
    title: string;
    category: ComplaintCategory;
    priority: PriorityLevel;
    status: ComplaintStatus;
    location: string;
  }>;
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: PriorityLevel;
  status: ComplaintStatus;
  location: string;
  createdAt: string;
  similarityScore: number; // 0.0 - 1.0
  textualSimilarityScore: number;
  geographicDistanceKm: number | null;
  matchingFactors: ('geographic_proximity' | 'textual_similarity' | 'category_match')[];
  suggestedAction: 'link' | 'merge' | 'keep_separate';
}

export interface RepeatIssueRecord {
  currentComplaintId: string;
  currentTitle: string;
  currentCategory: ComplaintCategory;
  currentStatus: ComplaintStatus;
  location: string;
  latitude: number;
  longitude: number;
  previousResolvedComplaintId: string;
  previousResolvedTitle: string;
  previousResolvedDate: string;
  daysSinceLastResolution: number;
  recurrenceCount: number;
  distanceMeters: number;
  alertSeverity: 'Critical' | 'High';
  recommendation: string;
}

export interface CommunityImpactDetail {
  complaintId: string;
  score: number; // 0 - 100
  urgencyLevel: 'Normal' | 'Elevated' | 'Urgent' | 'Emergency';
  factors: {
    infrastructureSeverity: {
      score: number;
      max: 30;
      detail: string;
    };
    publicSafety: {
      score: number;
      max: 25;
      detail: string;
    };
    trafficDisruption: {
      score: number;
      max: 20;
      detail: string;
      dataStatus: string;
    };
    footfallRisk: {
      score: number;
      max: 15;
      detail: string;
      dataStatus: string;
    };
    durationDelay: {
      score: number;
      max: 10;
      daysElapsed: number;
      detail: string;
    };
  };
  explanation: string;
}

export interface DepartmentSLARule {
  id: string;
  departmentId: string;
  departmentName: string;
  priority: PriorityLevel;
  targetHours: number;
  updatedAt: string;
}

export interface SLACalculation {
  complaintId: string;
  title: string;
  category: ComplaintCategory;
  priority: PriorityLevel;
  departmentId: string;
  departmentName: string;
  status: ComplaintStatus;
  createdAt: string;
  slaHours: number;
  targetDeadline: string;
  elapsedHours: number;
  remainingHours: number;
  isBreached: boolean;
  isApproaching: boolean;
  escalationLevel: 0 | 1 | 2 | 3;
  targetOfficerRole: string;
}

export interface SLAMatrixSummary {
  totalActive: number;
  withinSLA: number;
  approachingDeadline: number;
  breached: number;
  complianceRate: number;
  escalations: SLACalculation[];
  rules: DepartmentSLARule[];
}

export interface ResolutionForecast {
  departmentId: string;
  departmentName: string;
  category: ComplaintCategory;
  priority?: PriorityLevel;
  sampleCount: number;
  isDataSufficient: boolean;
  estimatedHours: number | null;
  estimatedDays: number | null;
  estimatedCompletionDate: string | null;
  confidenceLevel: 'High' | 'Moderate' | 'Preliminary' | 'Insufficient Data';
  confidenceScore: number;
  historicalMeanHours: number | null;
  historicalMedianHours: number | null;
  standardDeviationHours: number | null;
  explanation: string;
  isPrediction: true;
  disclaimer: string;
}
