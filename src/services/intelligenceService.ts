import { ComplaintCategory, PriorityLevel, ComplaintStatus } from '../types';
import { AuthService } from './authService';

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

const API_BASE = '/api/intelligence';

export class IntelligenceService {
  /**
   * 1. Get Geographic Civic Heatmap Data
   */
  public static async getHeatmapData(filters?: {
    category?: string;
    priority?: string;
    status?: string;
    department?: string;
  }): Promise<HeatmapResponse | null> {
    try {
      const q = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') q.append('category', filters.category);
      if (filters?.priority && filters.priority !== 'All') q.append('priority', filters.priority);
      if (filters?.status && filters.status !== 'All') q.append('status', filters.status);
      if (filters?.department && filters.department !== 'All') q.append('department', filters.department);

      const res = await fetch(`${API_BASE}/heatmap?${q.toString()}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  /**
   * 2. Check for Duplicate Complaints
   */
  public static async checkDuplicates(params: {
    description: string;
    category?: ComplaintCategory;
    latitude?: number;
    longitude?: number;
    excludeId?: string;
  }): Promise<{
    hasDuplicates: boolean;
    candidates: DuplicateCandidate[];
    evaluatedCount: number;
    embeddingModelUsed: string;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/check-duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  /**
   * 2b. Link a complaint as duplicate
   */
  public static async linkDuplicate(params: {
    complaintId: string;
    duplicateOfId: string;
    actorName?: string;
    actorRole?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const authHeaders = await AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/link-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(params),
      });
      AuthService.handleResponse(res);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to link duplicate.');
      return json.data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 3. Get Repeat-Issue Alerts and Hotspots
   */
  public static async getRepeatIssues(): Promise<{
    totalRepeatIssues: number;
    repeatIssues: RepeatIssueRecord[];
    chronicHotspots: Array<{
      location: string;
      category: ComplaintCategory;
      totalOccurrences: number;
      latitude: number;
      longitude: number;
    }>;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/repeat-issues`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  /**
   * 4. Get Community Impact Rankings
   */
  public static async getImpactRankings(limit = 25): Promise<
    Array<{
      complaintId: string;
      title: string;
      category: string;
      priority: string;
      department: string;
      score: number;
      urgencyLevel: string;
    }> | null
  > {
    try {
      const res = await fetch(`${API_BASE}/impact-scores?limit=${limit}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  /**
   * 4b. Get detailed impact breakdown for a single complaint
   */
  public static async getComplaintImpact(id: string): Promise<CommunityImpactDetail | null> {
    try {
      const res = await fetch(`${API_BASE}/complaint/${encodeURIComponent(id)}/impact`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  /**
   * 5. Get SLA Matrix and Escalations
   */
  public static async getSLAMatrix(): Promise<SLAMatrixSummary | null> {
    try {
      const res = await fetch(`${API_BASE}/sla-matrix`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  /**
   * 5b. Update Department SLA Rule
   */
  public static async updateSLARule(params: {
    departmentId: string;
    priority: PriorityLevel;
    targetHours: number;
    actorName?: string;
  }): Promise<{ success: boolean; data?: DepartmentSLARule; message?: string }> {
    try {
      const authHeaders = await AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/sla-rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(params),
      });
      AuthService.handleResponse(res);
      const json = await res.json();
      if (!res.ok) return { success: false, message: json.error?.message || 'Update failed' };
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 5c. Acknowledge Escalation
   */
  public static async acknowledgeEscalation(
    escalationId: string,
    officerName = 'Municipal Officer'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const authHeaders = await AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/sla-escalations/${encodeURIComponent(escalationId)}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ officerName }),
      });
      AuthService.handleResponse(res);
      const json = await res.json();
      if (!res.ok) return { success: false, message: json.error?.message || 'Acknowledgement failed' };
      return json.data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 6. Get Predictive Resolution Forecast
   */
  public static async getResolutionForecast(params: {
    category: ComplaintCategory;
    departmentId?: string;
    priority?: PriorityLevel;
    complaintCreatedDate?: string;
  }): Promise<ResolutionForecast | null> {
    try {
      const q = new URLSearchParams();
      q.append('category', params.category);
      if (params.departmentId) q.append('departmentId', params.departmentId);
      if (params.priority) q.append('priority', params.priority);
      if (params.complaintCreatedDate) q.append('complaintCreatedDate', params.complaintCreatedDate);

      const res = await fetch(`${API_BASE}/forecast?${q.toString()}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }
}
