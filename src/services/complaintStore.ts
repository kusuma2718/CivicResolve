import { Complaint, ComplaintCategory, ComplaintStatus, NewComplaintInput, PriorityLevel, TimelineEvent } from '../types';
import { INITIAL_MOCK_COMPLAINTS } from './mockData';

const STORAGE_KEY = 'civicresolve_complaints_v1';

export function getDepartmentForCategory(category: ComplaintCategory): string {
  switch (category) {
    case 'Roads and Potholes':
      return 'Public Works Department (PWD)';
    case 'Garbage and Sanitation':
      return 'Municipal Sanitation Department';
    case 'Streetlights and Electricity':
      return 'Electricity & Streetlight Board';
    case 'Water Supply and Leakage':
    case 'Drainage and Sewage':
      return 'Water & Sewage Management Board';
    case 'Traffic and Transportation':
      return 'Traffic Management Division';
    case 'Public Infrastructure':
      return 'Public Works Department (PWD)';
    case 'Other':
    default:
      return 'General Municipal Administration';
  }
}

export function getDefaultPriorityForCategory(category: ComplaintCategory): PriorityLevel {
  switch (category) {
    case 'Water Supply and Leakage':
    case 'Drainage and Sewage':
      return 'High';
    case 'Roads and Potholes':
      return 'Critical';
    case 'Streetlights and Electricity':
      return 'Medium';
    case 'Garbage and Sanitation':
      return 'High';
    default:
      return 'Medium';
  }
}

class ComplaintStore {
  private complaints: Complaint[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.complaints = JSON.parse(stored);
      } else {
        this.complaints = [...INITIAL_MOCK_COMPLAINTS];
        this.saveToStorage();
      }
    } catch {
      this.complaints = [...INITIAL_MOCK_COMPLAINTS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.complaints));
    } catch (err) {
      console.error('Failed to save complaints to localStorage', err);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  public getAllComplaints(): Complaint[] {
    return [...this.complaints];
  }

  public getComplaintById(id: string): Complaint | undefined {
    return this.complaints.find((c) => c.id.toLowerCase() === id.toLowerCase());
  }

  public createComplaint(input: NewComplaintInput): Complaint {
    const timestamp = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `CR-2025-${randomSuffix}`;

    const department = getDepartmentForCategory(input.category);
    const priority = getDefaultPriorityForCategory(input.category);

    const initialTimeline: TimelineEvent[] = [
      {
        id: `tl-${Date.now()}-1`,
        title: 'Issue Submitted by Citizen',
        description: 'Complaint registered in municipal database with verified details and photo documentation.',
        timestamp,
        status: 'Reported',
        actor: input.citizenName,
        notes: 'Submitted via CivicResolve Web Portal (Phase 1 Frontend Prototype).'
      },
      {
        id: `tl-${Date.now()}-2`,
        title: 'Department Assigned',
        description: `Routed to ${department} for jurisdiction review.`,
        timestamp,
        status: 'Under Review',
        actor: 'Municipal Dispatch Engine',
        notes: 'Automated triage based on issue category.'
      }
    ];

    const newComplaint: Complaint = {
      id: newId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority,
      status: 'Reported',
      location: input.location.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      citizenName: input.citizenName.trim(),
      email: input.email.trim(),
      imageUrl: input.imagePreviewUrl || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      department,
      assignedOfficer: 'Pending Field Officer Assignment',
      timeline: initialTimeline,
      isSample: false // explicitly marks this as a user-submitted mock entry
    };

    this.complaints.unshift(newComplaint);
    this.saveToStorage();
    return newComplaint;
  }

  public updateStatus(
    id: string,
    newStatus: ComplaintStatus,
    actor: string = 'Municipal Officer',
    notes?: string
  ): boolean {
    const complaint = this.complaints.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (!complaint) return false;

    const timestamp = new Date().toISOString();
    complaint.status = newStatus;
    complaint.updatedAt = timestamp;

    const newEvent: TimelineEvent = {
      id: `tl-${Date.now()}`,
      title: `Status Updated to ${newStatus}`,
      description: `Official review conducted. Issue status transitioned to ${newStatus}.`,
      timestamp,
      status: newStatus,
      actor,
      notes: notes || undefined
    };

    complaint.timeline.push(newEvent);
    this.saveToStorage();
    return true;
  }

  public resetToDefaults() {
    this.complaints = [...INITIAL_MOCK_COMPLAINTS];
    this.saveToStorage();
  }
}

export const complaintStore = new ComplaintStore();
