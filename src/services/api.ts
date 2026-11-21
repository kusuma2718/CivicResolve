import { Complaint, ComplaintCategory, ComplaintStatus, NewComplaintInput, PriorityLevel } from '../types';
import { complaintStore } from './complaintStore';
import { AuthService } from './authService';

const API_BASE = '/api';

export class ApiService {
  private static isBackendAvailable: boolean | null = null;

  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      this.isBackendAvailable = data?.status === 'healthy';
      return this.isBackendAvailable;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  public static async getComplaints(filters?: any): Promise<Complaint[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== 'All') queryParams.append('category', filters.category);
      if (filters?.status && filters.status !== 'All') queryParams.append('status', filters.status);
      if (filters?.priority && filters.priority !== 'All') queryParams.append('priority', filters.priority);
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.isSample !== undefined && filters.isSample !== 'all') {
        queryParams.append('isSample', filters.isSample === 'demo' ? 'true' : 'false');
      }

      const res = await fetch(`${API_BASE}/complaints?${queryParams.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        // Map backend complaint records to frontend format
        return json.data.map((c: any) => this.mapBackendComplaint(c));
      }
      return complaintStore.getAllComplaints();
    } catch {
      // Fallback to local store
      return complaintStore.getAllComplaints();
    }
  }

  public static async getComplaintById(id: string): Promise<Complaint | undefined> {
    try {
      const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      if (json.success && json.data) {
        return this.mapBackendComplaint(json.data);
      }
      return complaintStore.getComplaintById(id);
    } catch {
      return complaintStore.getComplaintById(id);
    }
  }

  public static async createComplaint(input: NewComplaintInput): Promise<Complaint> {
    try {
      let uploadedImageUrl = input.imagePreviewUrl;

      // If an actual File is supplied, upload it to /api/upload first
      if (input.image instanceof File) {
        try {
          const formData = new FormData();
          formData.append('image', input.image);
          const uploadRes = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
          });
          const uploadJson = await uploadRes.json();
          if (uploadJson.success && uploadJson.data?.url) {
            uploadedImageUrl = uploadJson.data.url;
          }
        } catch (err) {
          console.warn('Image upload fallback to preview url', err);
        }
      }

      const currentLang = localStorage.getItem('civicresolve_language') || 'en';

      const payload = {
        title: input.title,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory,
        location: input.location,
        city: input.city,
        state: input.state,
        citizenName: input.citizenName,
        email: input.email,
        originalLanguage: currentLang,
        citizenPreferredLanguage: currentLang,
        imageUrl: uploadedImageUrl,
        imageId: input.imageId,
        priority: input.priority,
        severityScore: input.severityScore,
        translatedDescription: input.translatedDescription,
        departmentRecommendation: input.departmentRecommendation,
        aiReason: input.aiReason,
      };

      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Creation failed');
      const json = await res.json();
      if (json.success && json.data) {
        const created = this.mapBackendComplaint(json.data);
        // Also sync local store for offline resilience
        complaintStore.createComplaint(input);
        return created;
      }
      return complaintStore.createComplaint(input);
    } catch (err) {
      console.warn('Backend create failed, fallback to local store:', err);
      return complaintStore.createComplaint(input);
    }
  }

  public static async updateStatus(
    id: string,
    newStatus: ComplaintStatus,
    actor: string = 'Municipal Officer',
    notes?: string
  ): Promise<boolean> {
    try {
      const authHeaders = await AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          status: newStatus,
          actorName: actor,
          notes,
        }),
      });

      AuthService.handleResponse(res);

      if (!res.ok) throw new Error('Status update failed');
      const json = await res.json();
      if (json.success) {
        complaintStore.updateStatus(id, newStatus, actor, notes);
        return true;
      }
      return complaintStore.updateStatus(id, newStatus, actor, notes);
    } catch {
      return complaintStore.updateStatus(id, newStatus, actor, notes);
    }
  }

  public static async getStats() {
    try {
      const res = await fetch(`${API_BASE}/complaints/stats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  private static mapBackendComplaint(c: any): Complaint {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category as ComplaintCategory,
      priority: c.priority as PriorityLevel,
      status: c.status as ComplaintStatus,
      location: c.location,
      city: c.city,
      state: c.state,
      citizenName: c.citizenName || c.citizen_name,
      email: c.email || c.citizen_email,
      imageUrl: c.imageUrl || c.image_url,
      createdAt: c.createdAt || c.created_at,
      updatedAt: c.updatedAt || c.updated_at,
      department: c.department || c.department_name,
      division: c.division,
      assignedOfficer: c.assignedOfficer || c.assigned_officer,
      isSample: Boolean(c.isSample !== undefined ? c.isSample : c.is_sample),
      subcategory: c.subcategory,
      severityScore: c.severityScore !== undefined ? c.severityScore : c.severity_score,
      translatedDescription: c.translatedDescription || c.translated_description,
      originalLanguage: c.originalLanguage || c.original_language,
      citizenPreferredLanguage: c.citizenPreferredLanguage || c.citizen_preferred_language,
      communityImpactScore: c.communityImpactScore !== undefined ? c.communityImpactScore : c.community_impact_score,
      timeline: Array.isArray(c.timeline)
        ? c.timeline.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            timestamp: t.timestamp || t.created_at,
            status: t.status,
            actor: t.actor || t.actor_name,
            notes: t.notes,
          }))
        : [],
    };
  }
}
