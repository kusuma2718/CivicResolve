import { db } from '../db/index.js';
import { DBComplaint } from '../types/index.js';
import { CommunityImpactDetail } from '../types/intelligence.js';
import { AppError } from '../middlewares/errorHandler.js';

export class ImpactService {
  /**
   * Calculate transparent Community Impact Score (0 - 100) for a complaint
   * across 5 verifiable dimensions.
   */
  public static calculateImpactScore(complaint: DBComplaint): CommunityImpactDetail {
    const text = `${complaint.title} ${complaint.description} ${complaint.location}`.toLowerCase();

    // 1. Infrastructure Severity (0 - 30 max)
    let infraScore = 15;
    let infraDetail = 'Standard civic infrastructure defect.';
    if (complaint.severity_score !== null && complaint.severity_score !== undefined) {
      infraScore = Math.min(30, Math.round((Number(complaint.severity_score) / 10) * 30));
      infraDetail = `Directly derived from assessed severity (${complaint.severity_score}/10).`;
    } else {
      if (complaint.priority === 'Critical') {
        infraScore = 27;
        infraDetail = 'Critical priority failure with extensive asset damage.';
      } else if (complaint.priority === 'High') {
        infraScore = 20;
        infraDetail = 'High priority civic defect requiring specialized field crew.';
      } else if (complaint.priority === 'Medium') {
        infraScore = 14;
        infraDetail = 'Moderate infrastructure damage contained to immediate fixture.';
      } else {
        infraScore = 8;
        infraDetail = 'Minor cosmetic or superficial damage.';
      }
    }

    // 2. Public Safety Risk (0 - 25 max)
    let safetyScore = 10;
    let safetyDetail = 'Standard localized inconvenience.';
    const criticalSafetyKeywords = [
      'electrocution',
      'live wire',
      'open manhole',
      'collapsed',
      'toxic',
      'infection',
      'biohazard',
      'medical waste',
      'skid',
      'accident',
      'fatal',
      'explosion',
      'gas leak',
    ];
    const highSafetyKeywords = [
      'deep pothole',
      'swerving',
      'dark street',
      'no light',
      'flooding',
      'unlit',
      'open pit',
    ];

    if (criticalSafetyKeywords.some((k) => text.includes(k)) || complaint.priority === 'Critical') {
      safetyScore = 24;
      safetyDetail = 'High risk of bodily injury or acute public hazard identified in report.';
    } else if (highSafetyKeywords.some((k) => text.includes(k)) || complaint.priority === 'High') {
      safetyScore = 18;
      safetyDetail = 'Elevated public safety concern affecting night commuters or pedestrians.';
    } else {
      safetyScore = 10;
      safetyDetail = 'Low direct hazard; primary impact is environmental or convenience.';
    }

    // 3. Traffic & Mobility Disruption (0 - 20 max)
    let trafficScore = 6;
    let trafficDetail = 'Local residential traffic impact.';
    let trafficDataStatus = 'Verified from road hierarchy and transit junction keywords.';

    const majorCorridorKeywords = [
      'metro',
      'junction',
      'main road',
      'flyover',
      'ring road',
      'arterial',
      'highway',
      'cross road',
      'signal',
      'station',
    ];
    const commercialRoadKeywords = ['market', 'bazaar', 'commercial', 'bus stop', 'terminal'];

    if (majorCorridorKeywords.some((k) => text.includes(k))) {
      trafficScore = 19;
      trafficDetail = 'Severe obstruction on major arterial corridor or transit node.';
    } else if (commercialRoadKeywords.some((k) => text.includes(k))) {
      trafficScore = 13;
      trafficDetail = 'Moderate congestion in dense commercial market district.';
    } else if (complaint.category === 'Garbage and Sanitation' || complaint.category === 'Water Supply and Leakage') {
      trafficScore = 7;
      trafficDetail = 'Minimal direct road congestion; localized footpath or lane obstruction.';
      trafficDataStatus = 'Estimated (off-road utility category; no arterial blockage reported).';
    } else {
      trafficScore = 5;
      trafficDetail = 'Minor local lane traffic impact.';
      trafficDataStatus = 'Estimated (no arterial transit sensors present).';
    }

    // 4. Affected Population & Footfall Risk (0 - 15 max)
    let footfallScore = 8;
    let footfallDetail = 'Medium footfall neighborhood area.';
    let footfallDataStatus = 'Estimated from civic landmark density.';

    const highFootfallKeywords = [
      'hospital',
      'metro gate',
      'school',
      'central market',
      'station exit',
      'bus terminal',
      'shopping complex',
    ];
    const mediumFootfallKeywords = ['residential layout', 'apartment', 'colony', 'sector', 'block'];

    if (highFootfallKeywords.some((k) => text.includes(k))) {
      footfallScore = 14;
      footfallDetail = 'Proximity to high-density public facility (hospital/metro/station/market).';
    } else if (mediumFootfallKeywords.some((k) => text.includes(k))) {
      footfallScore = 9;
      footfallDetail = 'Moderate pedestrian volume in multi-family residential layout.';
    } else {
      footfallScore = 5;
      footfallDetail = 'Low footfall peripheral lane.';
      footfallDataStatus = 'Estimated (landmark data unavailable; default baseline applied).';
    }

    // 5. Issue Duration & Unresolved Delay (0 - 10 max)
    const nowMs = Date.now();
    const createdMs = new Date(complaint.created_at).getTime();
    const daysElapsed = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)));

    let durationScore = 2;
    let durationDetail = 'Recently reported (< 24 hours).';
    if (daysElapsed >= 7) {
      durationScore = 10;
      durationDetail = `Unresolved for ${daysElapsed} days (extended civic delay).`;
    } else if (daysElapsed >= 4) {
      durationScore = 7;
      durationDetail = `Persisting for ${daysElapsed} days without resolution.`;
    } else if (daysElapsed >= 2) {
      durationScore = 5;
      durationDetail = `Over 48 hours unresolved (${daysElapsed} days).`;
    } else if (daysElapsed === 1) {
      durationScore = 3;
      durationDetail = '1 day elapsed since registration.';
    }

    // Sum factors (0 - 100)
    const totalScore = Math.min(
      100,
      Math.max(0, infraScore + safetyScore + trafficScore + footfallScore + durationScore)
    );

    let urgencyLevel: 'Normal' | 'Elevated' | 'Urgent' | 'Emergency' = 'Normal';
    if (totalScore >= 80) urgencyLevel = 'Emergency';
    else if (totalScore >= 60) urgencyLevel = 'Urgent';
    else if (totalScore >= 35) urgencyLevel = 'Elevated';
    else urgencyLevel = 'Normal';

    const explanation = `Total Community Impact Score of ${totalScore}/100 (${urgencyLevel}). Infrastructure Severity contributed ${infraScore}/30 pts, Public Safety Hazard ${safetyScore}/25 pts, Traffic Mobility Disruption ${trafficScore}/20 pts, Affected Footfall Risk ${footfallScore}/15 pts, and Issue Duration ${durationScore}/10 pts.`;

    return {
      complaintId: complaint.id,
      score: totalScore,
      urgencyLevel,
      factors: {
        infrastructureSeverity: {
          score: infraScore,
          max: 30,
          detail: infraDetail,
        },
        publicSafety: {
          score: safetyScore,
          max: 25,
          detail: safetyDetail,
        },
        trafficDisruption: {
          score: trafficScore,
          max: 20,
          detail: trafficDetail,
          dataStatus: trafficDataStatus,
        },
        footfallRisk: {
          score: footfallScore,
          max: 15,
          detail: footfallDetail,
          dataStatus: footfallDataStatus,
        },
        durationDelay: {
          score: durationScore,
          max: 10,
          daysElapsed,
          detail: durationDetail,
        },
      },
      explanation,
    };
  }

  /**
   * Get detailed impact breakdown for a specific complaint
   */
  public static getComplaintImpact(id: string): CommunityImpactDetail {
    const complaint = db.prepare('SELECT * FROM complaints WHERE LOWER(id) = LOWER(?)').get(id) as DBComplaint | undefined;
    if (!complaint) {
      throw new AppError(`Complaint with ID "${id}" was not found.`, 404);
    }
    const impact = this.calculateImpactScore(complaint);

    // Update database if changed
    if (complaint.community_impact_score !== impact.score) {
      db.prepare('UPDATE complaints SET community_impact_score = ? WHERE id = ?').run(
        impact.score,
        complaint.id
      );
    }

    return impact;
  }

  /**
   * Get impact scores across all active complaints
   */
  public static listImpactRankings(limit = 20): Array<{
    complaintId: string;
    title: string;
    category: string;
    priority: string;
    department: string;
    score: number;
    urgencyLevel: string;
  }> {
    const complaints = db.prepare(`SELECT * FROM complaints WHERE status != 'Rejected' ORDER BY community_impact_score DESC LIMIT ?`).all(limit) as DBComplaint[];

    return complaints.map((c) => {
      const calc = this.calculateImpactScore(c);
      return {
        complaintId: c.id,
        title: c.title,
        category: c.category,
        priority: c.priority,
        department: c.department_name,
        score: calc.score,
        urgencyLevel: calc.urgencyLevel,
      };
    });
  }
}
