import { Request, Response, NextFunction } from 'express';
import { HeatmapService } from '../services/heatmapService.js';
import { DuplicateService } from '../services/duplicateService.js';
import { RepeatIssueService } from '../services/repeatIssueService.js';
import { ImpactService } from '../services/impactService.js';
import { SLAService } from '../services/slaService.js';
import { ForecastService } from '../services/forecastService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { ComplaintCategory, PriorityLevel } from '../types/index.js';

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export function getHeatmapHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, priority, status, department } = req.query as {
      category?: string;
      priority?: string;
      status?: string;
      department?: string;
    };

    const data = HeatmapService.getHeatmapData({ category, priority, status, department });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

export async function checkDuplicatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { description, category, latitude, longitude, excludeId } = req.body as {
      description?: string;
      category?: ComplaintCategory;
      latitude?: number;
      longitude?: number;
      excludeId?: string;
    };

    if (!description || description.trim().length < 5) {
      throw new AppError('description is required (min 5 characters).', 400);
    }

    const data = await DuplicateService.checkDuplicates({
      description: description.trim(),
      category,
      latitude,
      longitude,
      excludeId,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export function linkDuplicateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { complaintId, duplicateOfId, actorName, actorRole } = req.body as {
      complaintId?: string;
      duplicateOfId?: string;
      actorName?: string;
      actorRole?: string;
    };

    if (!complaintId || !duplicateOfId) {
      throw new AppError('complaintId and duplicateOfId are required.', 400);
    }

    const result = DuplicateService.linkDuplicate({
      complaintId,
      duplicateOfId,
      actorName,
      actorRole,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Repeat Issues ────────────────────────────────────────────────────────────

export function getRepeatIssuesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = RepeatIssueService.detectRepeatIssues();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Community Impact Score ───────────────────────────────────────────────────

export function getImpactRankingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const data = ImpactService.listImpactRankings(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export function getComplaintImpactHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) throw new AppError('Complaint ID is required.', 400);

    const data = ImpactService.getComplaintImpact(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── SLA Escalations & Rules ──────────────────────────────────────────────────

export function getSLAMatrixHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = SLAService.evaluateSLAMatrix();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export function getSLARulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = SLAService.getSLARules();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export function updateSLARuleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { departmentId, priority, targetHours, actorName } = req.body as {
      departmentId?: string;
      priority?: PriorityLevel;
      targetHours?: number;
      actorName?: string;
    };

    if (!departmentId || !priority || targetHours === undefined) {
      throw new AppError('departmentId, priority, and targetHours are required.', 400);
    }

    const data = SLAService.updateSLARule({
      departmentId,
      priority,
      targetHours: Number(targetHours),
      actorName,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export function acknowledgeEscalationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { officerName } = req.body as { officerName?: string };

    if (!id) throw new AppError('Escalation ID is required.', 400);

    const data = SLAService.acknowledgeEscalation(id, officerName || 'Municipal Officer');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Predictive Resolution Forecasting ────────────────────────────────────────

export function getResolutionForecastHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { departmentId, category, priority, complaintCreatedDate } = req.query as {
      departmentId?: string;
      category?: ComplaintCategory;
      priority?: PriorityLevel;
      complaintCreatedDate?: string;
    };

    if (!category) {
      throw new AppError('category query parameter is required for resolution forecasting.', 400);
    }

    const data = ForecastService.forecastResolutionTime({
      departmentId,
      category,
      priority,
      complaintCreatedDate,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
