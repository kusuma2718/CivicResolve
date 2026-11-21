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

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: ComplaintStatus;
  actor: string;
  notes?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  subcategory?: string;
  priority: PriorityLevel;
  severityScore?: number;
  status: ComplaintStatus;
  location: string;
  city: string;
  state: string;
  citizenName: string;
  email: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  department: string;
  division?: string;
  assignedOfficer?: string;
  timeline: TimelineEvent[];
  isSample: boolean; // clearly distinguishes demo mock data from user-submitted complaints
  translatedDescription?: string;
  originalLanguage?: string;
  citizenPreferredLanguage?: string;
  communityImpactScore?: number;
  aiReason?: string;
}

export interface NewComplaintInput {
  title: string;
  description: string;
  location: string;
  city: string;
  state: string;
  category: ComplaintCategory;
  subcategory?: string;
  citizenName: string;
  email: string;
  image?: File | null;
  imagePreviewUrl?: string;
  imageId?: string;
  priority?: PriorityLevel;
  severityScore?: number;
  translatedDescription?: string;
  departmentRecommendation?: string;
  aiReason?: string;
}

export interface FilterOptions {
  search: string;
  category: string;
  priority: string;
  status: string;
  department?: string;
  sortBy: 'newest' | 'oldest' | 'priority' | 'status';
}
