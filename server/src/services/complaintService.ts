import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import {
  ComplaintCategory,
  ComplaintFilterQuery,
  ComplaintStatus,
  CreateComplaintDTO,
  DBComplaint,
  DBTimelineEvent,
  PriorityLevel,
  UpdateComplaintStatusDTO,
} from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';

export function getDepartmentForCategory(category: ComplaintCategory) {
  switch (category) {
    case 'Roads and Potholes':
      return { id: 'dept-pwd', name: 'Public Works Department (PWD)', division: 'Roads & Infrastructure' };
    case 'Garbage and Sanitation':
      return { id: 'dept-sanitation', name: 'Municipal Sanitation Department', division: 'Solid Waste Management' };
    case 'Streetlights and Electricity':
      return { id: 'dept-electricity', name: 'Electricity & Streetlight Board', division: 'Urban Electrification' };
    case 'Water Supply and Leakage':
    case 'Drainage and Sewage':
      return { id: 'dept-water', name: 'Water & Sewage Management Board', division: 'Water Utilities & Sewerage' };
    case 'Traffic and Transportation':
      return { id: 'dept-traffic', name: 'Traffic Management Division', division: 'Traffic Flow & Safety' };
    case 'Public Infrastructure':
      return { id: 'dept-pwd', name: 'Public Works Department (PWD)', division: 'Public Civil Assets' };
    case 'Other':
    default:
      return { id: 'dept-admin', name: 'General Municipal Administration', division: 'Civic Grievances' };
  }
}

export function getDefaultPriority(category: ComplaintCategory): PriorityLevel {
  switch (category) {
    case 'Roads and Potholes':
    case 'Water Supply and Leakage':
      return 'Critical';
    case 'Drainage and Sewage':
    case 'Garbage and Sanitation':
      return 'High';
    case 'Streetlights and Electricity':
      return 'Medium';
    default:
      return 'Medium';
  }
}

export function calculateBaseImpactScore(priority: PriorityLevel): number {
  switch (priority) {
    case 'Critical':
      return 75;
    case 'High':
      return 60;
    case 'Medium':
      return 40;
    case 'Low':
      return 20;
  }
}

export class ComplaintService {
  public static createComplaint(dto: CreateComplaintDTO) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `CR-2025-${randomSuffix}`;
    const now = new Date().toISOString();

    const dept = getDepartmentForCategory(dto.category);
    const priority = dto.priority || getDefaultPriority(dto.category);
    const severityScore = dto.severityScore !== undefined
      ? dto.severityScore
      : (priority === 'Critical' ? 8.5 : priority === 'High' ? 7.0 : 4.5);
    const impactScore = calculateBaseImpactScore(priority);

    const insertComplaint = db.prepare(`
      INSERT INTO complaints (
        id, title, description, translated_description, original_language, citizen_preferred_language,
        category, subcategory, priority, severity_score, department_id, department_name, division,
        status, image_url, location, city, state, latitude, longitude, community_impact_score,
        duplicate_of_id, repeat_issue_id, citizen_name, citizen_email, citizen_phone, assigned_officer,
        is_sample, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertComplaint.run(
      complaintId,
      dto.title.trim(),
      dto.description.trim(),
      dto.translatedDescription || null,
      dto.originalLanguage || 'en',
      dto.citizenPreferredLanguage || 'en',
      dto.category,
      dto.subcategory || null,
      priority,
      severityScore,
      dept.id,
      dept.name,
      dept.division,
      'Reported',
      dto.imageUrl || null,
      dto.location.trim(),
      dto.city.trim(),
      dto.state.trim(),
      dto.latitude || null,
      dto.longitude || null,
      impactScore,
      null,
      null,
      dto.citizenName.trim(),
      dto.email.trim(),
      dto.phone || null,
      'Pending Officer Allocation',
      0, // Real citizen submission
      now,
      now
    );

    // Initial timeline events
    const insertTimeline = db.prepare(`
      INSERT INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTimeline.run(
      `tl-${Date.now()}-1`,
      complaintId,
      'Reported',
      'Complaint Registered in Municipal System',
      'Issue reported by citizen with contact and location details.',
      dto.citizenName.trim(),
      'Citizen',
      `Filed in ${dto.originalLanguage || 'en'} language via CivicResolve Web Portal.`,
      now
    );

    insertTimeline.run(
      `tl-${Date.now()}-2`,
      complaintId,
      'Under Review',
      'Departmental Jurisdiction Assigned',
      `Auto-routed to ${dept.name} (${dept.division}) based on issue categorization.`,
      'Municipal Dispatch Engine',
      'System',
      'Pre-assigned for jurisdictional verification.',
      now
    );

    if (dto.aiReason || dto.priority) {
      insertTimeline.run(
        `tl-${Date.now()}-3`,
        complaintId,
        'Under Review',
        'AI Intelligent Triage & Priority Assessment',
        dto.aiReason || `Assessed as ${priority} priority with severity score ${severityScore}/10.`,
        'CivicResolve Gemini AI Engine',
        'AI System',
        `Automated priority detection: ${priority}. Recommended Dept: ${dto.departmentRecommendation || dept.name}`,
        now
      );
    }

    // Initial notification for the citizen
    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, complaint_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertNotification.run(
      `notif-${Date.now()}`,
      null,
      complaintId,
      `Complaint Registered: ${complaintId}`,
      `Your report regarding "${dto.title.trim()}" has been recorded and assigned to ${dept.name}.`,
      'status_update',
      0,
      now
    );

    // If coordinates were supplied, record in location_history
    if (dto.latitude && dto.longitude) {
      db.prepare(`
        INSERT INTO location_history (id, complaint_id, latitude, longitude, landmark, ward, pincode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `loc-${Date.now()}`,
        complaintId,
        dto.latitude,
        dto.longitude,
        dto.location,
        null,
        null,
        now
      );
    }

    return this.getComplaintById(complaintId);
  }

  public static listComplaints(filters: ComplaintFilterQuery) {
    let sql = 'SELECT * FROM complaints WHERE 1=1';
    const params: any[] = [];

    if (filters.category && filters.category !== 'All') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.status && filters.status !== 'All') {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority && filters.priority !== 'All') {
      sql += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.department && filters.department !== 'All') {
      sql += ' AND (department_id = ? OR department_name = ?)';
      params.push(filters.department, filters.department);
    }

    if (filters.isSample !== undefined && filters.isSample !== 'all') {
      sql += ' AND is_sample = ?';
      params.push(filters.isSample === 'true' || filters.isSample === '1' ? 1 : 0);
    }

    if (filters.language) {
      sql += ' AND (original_language = ? OR citizen_preferred_language = ?)';
      params.push(filters.language, filters.language);
    }

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      sql += ' AND (id LIKE ? OR title LIKE ? OR description LIKE ? OR location LIKE ? OR city LIKE ? OR citizen_name LIKE ?)';
      params.push(q, q, q, q, q, q);
    }

    // Sort order
    if (filters.sortBy === 'oldest') {
      sql += ' ORDER BY created_at ASC';
    } else if (filters.sortBy === 'priority') {
      sql += ` ORDER BY CASE priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5 END ASC, created_at DESC`;
    } else if (filters.sortBy === 'status') {
      sql += ' ORDER BY status ASC, created_at DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const rows = db.prepare(sql).all(...params) as DBComplaint[];

    // Map to frontend-friendly structure
    return rows.map((row) => this.mapDBComplaintToResponse(row));
  }

  public static getComplaintById(id: string) {
    const complaint = db.prepare('SELECT * FROM complaints WHERE LOWER(id) = LOWER(?)').get(id) as DBComplaint | undefined;
    if (!complaint) {
      throw new AppError(`Complaint with ID "${id}" was not found.`, 404);
    }

    const timeline = db.prepare(
      'SELECT * FROM complaint_timeline WHERE complaint_id = ? ORDER BY created_at ASC'
    ).all(complaint.id) as DBTimelineEvent[];

    const images = db.prepare(
      'SELECT * FROM uploaded_images WHERE complaint_id = ?'
    ).all(complaint.id);

    return {
      ...this.mapDBComplaintToResponse(complaint),
      timeline: timeline.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        timestamp: t.created_at,
        status: t.status,
        actor: t.actor_name,
        actorRole: t.actor_role,
        notes: t.notes || undefined,
      })),
      images,
    };
  }

  public static updateStatus(id: string, update: UpdateComplaintStatusDTO) {
    const existing = db.prepare('SELECT * FROM complaints WHERE LOWER(id) = LOWER(?)').get(id) as DBComplaint | undefined;
    if (!existing) {
      throw new AppError(`Complaint with ID "${id}" was not found.`, 404);
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?').run(
      update.status,
      now,
      existing.id
    );

    // Append to timeline
    const timelineId = `tl-${Date.now()}`;
    db.prepare(`
      INSERT INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      timelineId,
      existing.id,
      update.status,
      `Status Updated to ${update.status}`,
      `Official municipal review conducted. Status transitioned to ${update.status}.`,
      update.actorName || 'Municipal Authority Console',
      update.actorRole || 'Officer',
      update.notes || null,
      now
    );

    // Create Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, complaint_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif-${Date.now()}`,
      null,
      existing.id,
      `Complaint Update: ${existing.id} is now ${update.status}`,
      `Status for "${existing.title}" was updated to ${update.status}. Note: ${update.notes || 'None'}`,
      'status_update',
      0,
      now
    );

    return this.getComplaintById(existing.id);
  }

  public static getStats() {
    const total = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count;
    const reported = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'Reported'").get() as any).count;
    const inProgress = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status IN ('In Progress', 'Under Review')").get() as any).count;
    const resolved = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'Resolved'").get() as any).count;
    const critical = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE priority = 'Critical'").get() as any).count;

    const categories = db.prepare(`
      SELECT category, COUNT(*) as count FROM complaints GROUP BY category
    `).all() as { category: string; count: number }[];

    const departments = db.prepare(`
      SELECT department_name as name, COUNT(*) as count FROM complaints GROUP BY department_name
    `).all() as { name: string; count: number }[];

    return {
      total,
      reported,
      inProgress,
      resolved,
      critical,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      categoryDistribution: categories,
      departmentDistribution: departments,
    };
  }

  private static mapDBComplaintToResponse(row: DBComplaint) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      translatedDescription: row.translated_description,
      originalLanguage: row.original_language,
      citizenPreferredLanguage: row.citizen_preferred_language,
      category: row.category,
      subcategory: row.subcategory,
      priority: row.priority,
      severityScore: row.severity_score,
      departmentId: row.department_id,
      department: row.department_name,
      division: row.division,
      status: row.status,
      imageUrl: row.image_url || undefined,
      location: row.location,
      city: row.city,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      communityImpactScore: row.community_impact_score,
      citizenName: row.citizen_name,
      email: row.citizen_email,
      phone: row.citizen_phone,
      assignedOfficer: row.assigned_officer || undefined,
      isSample: Boolean(row.is_sample),
      duplicateOfId: row.duplicate_of_id || undefined,
      repeatIssueId: row.repeat_issue_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
