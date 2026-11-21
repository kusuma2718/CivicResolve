import { db } from '../db/index.js';
import { DBComplaint, PriorityLevel } from '../types/index.js';
import {
  DepartmentSLARule,
  SLACalculation,
  SLAMatrixSummary,
} from '../types/intelligence.js';
import { AppError } from '../middlewares/errorHandler.js';

export class SLAService {
  /**
   * Retrieve all configured Department SLA rules
   */
  public static getSLARules(): DepartmentSLARule[] {
    const rows = db.prepare(`
      SELECT r.id, r.department_id, d.name as department_name, r.priority, r.target_hours, r.updated_at
      FROM department_sla_rules r
      JOIN departments d ON r.department_id = d.id
      ORDER BY d.name ASC, CASE r.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
      END ASC
    `).all() as any[];

    return rows.map((r) => ({
      id: r.id,
      departmentId: r.department_id,
      departmentName: r.department_name,
      priority: r.priority as PriorityLevel,
      targetHours: Number(r.target_hours),
      updatedAt: r.updated_at,
    }));
  }

  /**
   * Update or configure SLA target hours for a department and priority
   */
  public static updateSLARule(params: {
    departmentId: string;
    priority: PriorityLevel;
    targetHours: number;
    actorName?: string;
  }): DepartmentSLARule {
    const { departmentId, priority, targetHours, actorName = 'Municipal Officer' } = params;

    if (!targetHours || targetHours < 1 || targetHours > 720) {
      throw new AppError('Target hours must be between 1 and 720 hours (30 days).', 400);
    }

    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(departmentId) as any;
    if (!dept) {
      throw new AppError(`Department "${departmentId}" was not found.`, 404);
    }

    const now = new Date().toISOString();
    const ruleId = `sla-${departmentId}-${priority.toLowerCase()}`;

    db.prepare(`
      INSERT INTO department_sla_rules (id, department_id, priority, target_hours, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(department_id, priority) DO UPDATE SET
        target_hours = excluded.target_hours,
        updated_at = excluded.updated_at
    `).run(ruleId, departmentId, priority, targetHours, now);

    return {
      id: ruleId,
      departmentId,
      departmentName: dept.name,
      priority,
      targetHours,
      updatedAt: now,
    };
  }

  /**
   * Evaluate SLA compliance across all active complaints and generate escalation alerts
   */
  public static evaluateSLAMatrix(): SLAMatrixSummary {
    const activeComplaints = db.prepare(`
      SELECT * FROM complaints
      WHERE status IN ('Reported', 'Under Review', 'In Progress')
      ORDER BY created_at ASC
    `).all() as DBComplaint[];

    const rules = this.getSLARules();
    const rulesMap = new Map<string, number>();
    rules.forEach((r) => {
      rulesMap.set(`${r.departmentId}-${r.priority}`, r.targetHours);
    });

    const nowMs = Date.now();
    const calculations: SLACalculation[] = [];

    let withinSLACount = 0;
    let approachingCount = 0;
    let breachedCount = 0;

    for (const c of activeComplaints) {
      const createdMs = new Date(c.created_at).getTime();
      const elapsedHours = Number(((nowMs - createdMs) / (3600 * 1000)).toFixed(1));

      // Determine SLA target hours from rules, or compute standard fallback
      let slaHours = rulesMap.get(`${c.department_id}-${c.priority}`) || 48;
      if (!rulesMap.has(`${c.department_id}-${c.priority}`)) {
        if (c.priority === 'Critical') slaHours = 18;
        else if (c.priority === 'High') slaHours = 36;
        else if (c.priority === 'Medium') slaHours = 48;
        else slaHours = 72;
      }

      const targetDeadline = new Date(createdMs + slaHours * 3600 * 1000).toISOString();
      const remainingHours = Number((slaHours - elapsedHours).toFixed(1));
      const isBreached = remainingHours < 0;
      const isApproaching = !isBreached && remainingHours <= slaHours * 0.25;

      let escalationLevel: 0 | 1 | 2 | 3 = 0;
      let targetOfficerRole = 'Assigned Officer';

      if (isBreached) {
        breachedCount++;
        const hoursOverdue = Math.abs(remainingHours);

        if (hoursOverdue > 36) {
          escalationLevel = 3;
          targetOfficerRole = 'Municipal Commissioner / Grievance Cell';
        } else if (hoursOverdue > 12) {
          escalationLevel = 2;
          targetOfficerRole = 'Head of Department (HoD)';
        } else {
          escalationLevel = 1;
          targetOfficerRole = 'Divisional Supervisor';
        }

        // Maintain escalation record in database if not already logged
        this.logEscalationRecord(c, escalationLevel, hoursOverdue, targetOfficerRole);
      } else if (isApproaching) {
        approachingCount++;
      } else {
        withinSLACount++;
      }

      calculations.push({
        complaintId: c.id,
        title: c.title,
        category: c.category,
        priority: c.priority,
        departmentId: c.department_id,
        departmentName: c.department_name,
        status: c.status,
        createdAt: c.created_at,
        slaHours,
        targetDeadline,
        elapsedHours,
        remainingHours,
        isBreached,
        isApproaching,
        escalationLevel,
        targetOfficerRole,
      });
    }

    const totalActive = activeComplaints.length;
    const complianceRate = totalActive > 0 ? Math.round((withinSLACount / totalActive) * 100) : 100;

    // Sort calculations: breached first, then approaching, then by smallest remaining hours
    calculations.sort((a, b) => a.remainingHours - b.remainingHours);

    return {
      totalActive,
      withinSLA: withinSLACount,
      approachingDeadline: approachingCount,
      breached: breachedCount,
      complianceRate,
      escalations: calculations,
      rules,
    };
  }

  /**
   * Record escalation event in database and timeline
   */
  private static logEscalationRecord(
    complaint: DBComplaint,
    level: 1 | 2 | 3,
    hoursOverdue: number,
    targetRole: string
  ) {
    const existing = db.prepare(`
      SELECT id FROM sla_escalations
      WHERE complaint_id = ? AND escalation_level = ? AND status = 'Active'
    `).get(complaint.id, level) as { id: string } | undefined;

    if (!existing) {
      const now = new Date().toISOString();
      const escId = `esc-${complaint.id}-${level}`;

      db.prepare(`
        INSERT OR IGNORE INTO sla_escalations (
          id, complaint_id, department_id, escalation_level, hours_overdue, target_officer_role, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(escId, complaint.id, complaint.department_id, level, hoursOverdue, targetRole, 'Active', now);

      // Add timeline event
      db.prepare(`
        INSERT OR IGNORE INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `tl-${complaint.id}-esc-${level}`,
        complaint.id,
        complaint.status,
        `SLA Escalation Alert (Level ${level})`,
        `Complaint has exceeded the target SLA deadline by ${hoursOverdue.toFixed(1)} hours. Formally escalated to ${targetRole}.`,
        'Municipal SLA Monitor',
        'System Monitor',
        `Automated escalation level ${level} dispatched to ${targetRole}.`,
        now
      );

      // Create notification
      db.prepare(`
        INSERT OR IGNORE INTO notifications (id, user_id, complaint_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `notif-${complaint.id}-esc-${level}`,
        null,
        complaint.id,
        `SLA Alert: ${complaint.id} Overdue`,
        `Complaint "${complaint.title}" is overdue by ${hoursOverdue.toFixed(1)} hours and escalated to ${targetRole}.`,
        'alert',
        0,
        now
      );
    }
  }

  /**
   * Officer acknowledges an active escalation
   */
  public static acknowledgeEscalation(escalationId: string, officerName: string) {
    const esc = db.prepare('SELECT * FROM sla_escalations WHERE id = ?').get(escalationId) as any;
    if (!esc) throw new AppError(`Escalation record "${escalationId}" was not found.`, 404);

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE sla_escalations
      SET status = 'Acknowledged', acknowledged_at = ?, acknowledged_by = ?
      WHERE id = ?
    `).run(now, officerName, escalationId);

    return {
      success: true,
      message: `Escalation ${escalationId} acknowledged by ${officerName}.`,
    };
  }
}
