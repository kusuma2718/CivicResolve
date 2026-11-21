import { db } from '../db/index.js';
import { DBComplaint, ComplaintCategory, PriorityLevel } from '../types/index.js';
import { ResolutionForecast } from '../types/intelligence.js';
import { AppError } from '../middlewares/errorHandler.js';

export class ForecastService {
  /**
   * Forecast likely resolution time using empirical historical performance data.
   * Clearly flags data sufficiency and labels outputs as statistical predictions.
   */
  public static forecastResolutionTime(params: {
    departmentId?: string;
    category: ComplaintCategory;
    priority?: PriorityLevel;
    complaintCreatedDate?: string;
  }): ResolutionForecast {
    const { departmentId, category, priority, complaintCreatedDate } = params;

    // Look up department if ID supplied
    let deptName = 'Municipal Department';
    let targetDeptId = departmentId || '';

    if (departmentId) {
      const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(departmentId) as any;
      if (dept) {
        deptName = dept.name;
        targetDeptId = dept.id;
      }
    }

    // Query resolved complaints in same category (and optionally department)
    let sql = `SELECT * FROM complaints WHERE status = 'Resolved' AND category = ?`;
    const queryParams: any[] = [category];

    if (targetDeptId) {
      sql += ' AND department_id = ?';
      queryParams.push(targetDeptId);
    }

    let resolvedRows = db.prepare(sql).all(...queryParams) as DBComplaint[];

    // If none found in specific department, broaden to all resolved records in this category
    if (resolvedRows.length < 2 && targetDeptId) {
      resolvedRows = db
        .prepare(`SELECT * FROM complaints WHERE status = 'Resolved' AND category = ?`)
        .all(category) as DBComplaint[];
    }

    const sampleCount = resolvedRows.length;

    // Data Sufficiency Check: At least 2 resolved samples required
    if (sampleCount < 2) {
      return {
        departmentId: targetDeptId,
        departmentName: deptName,
        category,
        priority,
        sampleCount,
        isDataSufficient: false,
        estimatedHours: null,
        estimatedDays: null,
        estimatedCompletionDate: null,
        confidenceLevel: 'Insufficient Data',
        confidenceScore: 0.15,
        historicalMeanHours: null,
        historicalMedianHours: null,
        standardDeviationHours: null,
        explanation: `Insufficient historical resolution data for ${deptName} in category "${category}" (only ${sampleCount} resolved record${sampleCount === 1 ? '' : 's'} available in system registry). A reliable empirical forecast requires at least 2 closed resolution records.`,
        isPrediction: true,
        disclaimer:
          'Statistical forecast. Predictions are derived exclusively from actual verified resolution logs and are not guaranteed administrative deadlines.',
      };
    }

    // Calculate actual resolution durations in hours
    const durationsHours: number[] = [];
    for (const r of resolvedRows) {
      const created = new Date(r.created_at).getTime();
      const resolved = new Date(r.updated_at).getTime();
      const diffHours = (resolved - created) / (1000 * 60 * 60);
      if (diffHours > 0.5 && diffHours < 720) {
        durationsHours.push(diffHours);
      }
    }

    if (durationsHours.length === 0) {
      return {
        departmentId: targetDeptId,
        departmentName: deptName,
        category,
        priority,
        sampleCount: 0,
        isDataSufficient: false,
        estimatedHours: null,
        estimatedDays: null,
        estimatedCompletionDate: null,
        confidenceLevel: 'Insufficient Data',
        confidenceScore: 0.1,
        historicalMeanHours: null,
        historicalMedianHours: null,
        standardDeviationHours: null,
        explanation: `Historical resolution timestamps contained anomalous values. Reliable prediction cannot yet be computed.`,
        isPrediction: true,
        disclaimer: 'Statistical forecast. Not a guaranteed deadline.',
      };
    }

    durationsHours.sort((a, b) => a - b);
    const sum = durationsHours.reduce((acc, v) => acc + v, 0);
    const mean = sum / durationsHours.length;

    const mid = Math.floor(durationsHours.length / 2);
    const median =
      durationsHours.length % 2 !== 0
        ? durationsHours[mid]
        : (durationsHours[mid - 1] + durationsHours[mid]) / 2;

    // Standard deviation
    const variance =
      durationsHours.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / durationsHours.length;
    const stdDev = Math.sqrt(variance);

    // Priority multiplier
    let priorityMultiplier = 1.0;
    if (priority === 'Critical') priorityMultiplier = 0.65;
    else if (priority === 'High') priorityMultiplier = 0.85;
    else if (priority === 'Medium') priorityMultiplier = 1.0;
    else if (priority === 'Low') priorityMultiplier = 1.3;

    const adjustedEstimatedHours = Number((median * priorityMultiplier).toFixed(1));
    const estimatedDays = Number((adjustedEstimatedHours / 24).toFixed(1));

    // Calculate estimated completion date from reference date (or current time)
    const baseDate = complaintCreatedDate ? new Date(complaintCreatedDate).getTime() : Date.now();
    const completionDateMs = baseDate + adjustedEstimatedHours * 3600 * 1000;
    const estimatedCompletionDate = new Date(completionDateMs).toISOString();

    // Determine confidence score and level
    const cv = stdDev / (mean || 1); // coefficient of variation
    let confidenceScore = 0.7;
    let confidenceLevel: 'High' | 'Moderate' | 'Preliminary' = 'Moderate';

    if (sampleCount >= 4 && cv < 0.35) {
      confidenceScore = 0.92;
      confidenceLevel = 'High';
    } else if (sampleCount >= 3 && cv < 0.65) {
      confidenceScore = 0.78;
      confidenceLevel = 'Moderate';
    } else {
      confidenceScore = 0.58;
      confidenceLevel = 'Preliminary';
    }

    const explanation = `Based on ${durationsHours.length} verified historical resolutions in "${category}", the historical median turnaround is ${median.toFixed(1)} hours (mean: ${mean.toFixed(1)}h, ±${stdDev.toFixed(1)}h). With priority '${priority || 'Standard'}', estimated resolution is ~${adjustedEstimatedHours} hours (${estimatedDays} days).`;

    return {
      departmentId: targetDeptId,
      departmentName: deptName,
      category,
      priority,
      sampleCount: durationsHours.length,
      isDataSufficient: true,
      estimatedHours: adjustedEstimatedHours,
      estimatedDays,
      estimatedCompletionDate,
      confidenceLevel,
      confidenceScore,
      historicalMeanHours: Number(mean.toFixed(1)),
      historicalMedianHours: Number(median.toFixed(1)),
      standardDeviationHours: Number(stdDev.toFixed(1)),
      explanation,
      isPrediction: true,
      disclaimer: `Statistical prediction based on ${durationsHours.length} historically resolved complaints in ${deptName}. This is an estimated forecast, not a guaranteed municipal SLA deadline.`,
    };
  }
}
