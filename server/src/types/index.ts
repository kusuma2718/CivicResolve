export type ComplaintCategory =
  | 'Roads and Potholes'
  | 'Garbage and Sanitation'
  | 'Streetlights and Electricity'
  | 'Water Supply and Leakage'
  | 'Drainage and Sewage'
  | 'Public Infrastructure'
  | 'Traffic and Transportation'
  | 'Other';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus =
  | 'Reported'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export interface DBComplaint {
  id: string;
  title: string;
  description: string;
  translated_description: string | null;
  original_language: string;
  citizen_preferred_language: string;
  category: ComplaintCategory;
  subcategory: string | null;
  priority: PriorityLevel;
  severity_score: number | null;
  department_id: string;
  department_name: string;
  division: string | null;
  status: ComplaintStatus;
  image_url: string | null;
  location: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  community_impact_score: number;
  duplicate_of_id: string | null;
  repeat_issue_id: string | null;
  citizen_name: string;
  citizen_email: string;
  citizen_phone: string | null;
  assigned_officer: string | null;
  is_sample: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface DBTimelineEvent {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  title: string;
  description: string;
  actor_name: string;
  actor_role: string;
  notes: string | null;
  created_at: string;
}

export interface DBUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'citizen' | 'officer' | 'admin';
  preferred_language: string;
  department_id: string | null;
  created_at: string;
}

export interface DBDepartment {
  id: string;
  name: string;
  code: string;
  division: string | null;
  contact_email: string;
  contact_phone: string | null;
  sla_hours: number;
  created_at: string;
}

export interface DBNotification {
  id: string;
  user_id: string | null;
  complaint_id: string | null;
  title: string;
  message: string;
  type: 'status_update' | 'assignment' | 'alert' | 'general';
  is_read: number;
  created_at: string;
}

export interface DBUploadedImage {
  id: string;
  complaint_id: string | null;
  file_name: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface DBLocationHistory {
  id: string;
  complaint_id: string;
  latitude: number;
  longitude: number;
  landmark: string | null;
  ward: string | null;
  pincode: string | null;
  created_at: string;
}

// API DTOs
export interface CreateComplaintDTO {
  title: string;
  description: string;
  category: ComplaintCategory;
  subcategory?: string;
  location: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  citizenName: string;
  email: string;
  phone?: string;
  originalLanguage?: string;
  citizenPreferredLanguage?: string;
  imageUrl?: string;
  imageId?: string;
  priority?: PriorityLevel;
  severityScore?: number;
  translatedDescription?: string;
  departmentRecommendation?: string;
  aiReason?: string;
}

export interface UpdateComplaintStatusDTO {
  status: ComplaintStatus;
  actorName?: string;
  actorRole?: string;
  notes?: string;
}

export interface ComplaintFilterQuery {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  department?: string;
  language?: string;
  isSample?: string;
  sortBy?: 'newest' | 'oldest' | 'priority' | 'status';
  page?: string;
  limit?: string;
}
