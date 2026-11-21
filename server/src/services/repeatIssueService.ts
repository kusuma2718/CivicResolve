import { db } from '../db/index.js';
import { DBComplaint, ComplaintCategory } from '../types/index.js';
import { RepeatIssueRecord } from '../types/intelligence.js';

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function normalizeLocation(loc: string): string {
  return loc
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

export class RepeatIssueService {
  /**
   * Scan active complaints and detect recurring civic problems
   * at previously resolved locations.
   */
  public static detectRepeatIssues(): {
    totalRepeatIssues: number;
    repeatIssues: RepeatIssueRecord[];
    chronicHotspots: Array<{
      location: string;
      category: ComplaintCategory;
      totalOccurrences: number;
      latitude: number;
      longitude: number;
    }>;
  } {
    // 1. Fetch resolved complaints
    const resolvedRows = db
      .prepare(`SELECT * FROM complaints WHERE status = 'Resolved' ORDER BY updated_at DESC`)
      .all() as DBComplaint[];

    // 2. Fetch active complaints
    const activeRows = db
      .prepare(
        `SELECT * FROM complaints WHERE status IN ('Reported', 'Under Review', 'In Progress') ORDER BY created_at DESC`
      )
      .all() as DBComplaint[];

    const repeatIssues: RepeatIssueRecord[] = [];
    const locationOccurrenceMap = new Map<
      string,
      { count: number; category: ComplaintCategory; lat: number; lng: number }
    >();

    for (const active of activeRows) {
      for (const resolved of resolvedRows) {
        // Must be in the same category
        if (active.category !== resolved.category) continue;

        let isMatch = false;
        let distanceMeters = 0;

        // Condition A: Geo coordinates within 350 meters
        if (
          active.latitude !== null &&
          active.longitude !== null &&
          resolved.latitude !== null &&
          resolved.longitude !== null
        ) {
          distanceMeters = calculateDistanceMeters(
            Number(active.latitude),
            Number(active.longitude),
            Number(resolved.latitude),
            Number(resolved.longitude)
          );
          if (distanceMeters <= 350) {
            isMatch = true;
          }
        }

        // Condition B: Location text match (e.g. same landmark or street)
        if (!isMatch) {
          const normActive = normalizeLocation(active.location);
          const normResolved = normalizeLocation(resolved.location);
          if (
            normActive.includes(normResolved) ||
            normResolved.includes(normActive) ||
            (normActive.includes('mg road') && normResolved.includes('mg road')) ||
            (normActive.includes('indiranagar') && normResolved.includes('indiranagar'))
          ) {
            isMatch = true;
            distanceMeters = 50; // estimated close vicinity
          }
        }

        if (isMatch) {
          const activeDate = new Date(active.created_at).getTime();
          const resolvedDate = new Date(resolved.updated_at).getTime();
          const daysSinceLastResolution = Math.max(
            1,
            Math.round((activeDate - resolvedDate) / (1000 * 60 * 60 * 24))
          );

          // Count total occurrences at this location across all historical records
          const clusterKey = `${active.category}-${active.location.substring(0, 20)}`;
          const currentOccurrences =
            (locationOccurrenceMap.get(clusterKey)?.count || 1) + 1;
          locationOccurrenceMap.set(clusterKey, {
            count: currentOccurrences,
            category: active.category,
            lat: Number(active.latitude) || 12.9716,
            lng: Number(active.longitude) || 77.5946,
          });

          const isCriticalRecurrence =
            daysSinceLastResolution <= 60 || currentOccurrences >= 3;

          let recommendation = '';
          if (active.category === 'Roads and Potholes') {
            recommendation =
              'Pavement base instability detected. Recommend structural asphalt sub-base overhaul rather than superficial patching.';
          } else if (active.category === 'Water Supply and Leakage') {
            recommendation =
              'Chronic hydrostatic joint fatigue. Recommend pipe section replacement with ductile iron or HDPE.';
          } else if (active.category === 'Garbage and Sanitation') {
            recommendation =
              'Repeated illegal dumping zone. Deploy municipal CCTV surveillance and establish a scheduled secondary collection beat.';
          } else if (active.category === 'Streetlights and Electricity') {
            recommendation =
              'Recurring feeder cable fault. Recommend insulation resistance testing of the whole feeder line circuit.';
          } else {
            recommendation =
              'Recurring failure mode. Recommend thorough departmental engineering audit of the physical asset.';
          }

          repeatIssues.push({
            currentComplaintId: active.id,
            currentTitle: active.title,
            currentCategory: active.category,
            currentStatus: active.status,
            location: active.location,
            latitude: Number(active.latitude) || 0,
            longitude: Number(active.longitude) || 0,
            previousResolvedComplaintId: resolved.id,
            previousResolvedTitle: resolved.title,
            previousResolvedDate: resolved.updated_at,
            daysSinceLastResolution,
            recurrenceCount: currentOccurrences,
            distanceMeters,
            alertSeverity: isCriticalRecurrence ? 'Critical' : 'High',
            recommendation,
          });

          // Link repeat_issue_id if not already set
          if (!active.repeat_issue_id) {
            db.prepare('UPDATE complaints SET repeat_issue_id = ? WHERE id = ?').run(
              resolved.id,
              active.id
            );
          }

          // Stop checking after finding the closest/most recent resolved match for this active complaint
          break;
        }
      }
    }

    const chronicHotspots = Array.from(locationOccurrenceMap.entries())
      .filter(([_, v]) => v.count >= 2)
      .map(([locKey, v]) => ({
        location: locKey.split('-').slice(1).join('-'),
        category: v.category,
        totalOccurrences: v.count,
        latitude: v.lat,
        longitude: v.lng,
      }));

    return {
      totalRepeatIssues: repeatIssues.length,
      repeatIssues,
      chronicHotspots,
    };
  }
}
