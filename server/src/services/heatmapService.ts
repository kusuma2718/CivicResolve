import { db } from '../db/index.js';
import { DBComplaint, ComplaintCategory, PriorityLevel } from '../types/index.js';
import {
  CivicHeatmapPoint,
  CivicHeatmapCluster,
  HeatmapResponse,
} from '../types/intelligence.js';

// Haversine distance in kilometers
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export class HeatmapService {
  /**
   * Retrieve complaints with geographic coordinates, cluster nearby complaints,
   * and isolate unmapped complaints without coordinates.
   */
  public static getHeatmapData(filters?: {
    category?: string;
    priority?: string;
    status?: string;
    department?: string;
  }): HeatmapResponse {
    let sql = 'SELECT * FROM complaints WHERE 1=1';
    const params: any[] = [];

    if (filters?.category && filters.category !== 'All') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.priority && filters.priority !== 'All') {
      sql += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters?.status && filters.status !== 'All') {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.department && filters.department !== 'All') {
      sql += ' AND (department_id = ? OR department_name = ?)';
      params.push(filters.department, filters.department);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params) as DBComplaint[];

    const geoTaggedRows: DBComplaint[] = [];
    const unmappedRows: DBComplaint[] = [];

    for (const row of rows) {
      if (
        row.latitude !== null &&
        row.latitude !== undefined &&
        row.longitude !== null &&
        row.longitude !== undefined &&
        !isNaN(Number(row.latitude)) &&
        !isNaN(Number(row.longitude))
      ) {
        geoTaggedRows.push(row);
      } else {
        unmappedRows.push(row);
      }
    }

    const points: CivicHeatmapPoint[] = geoTaggedRows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      priority: r.priority,
      status: r.status,
      department: r.department_name,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      communityImpactScore: r.community_impact_score || 0,
      createdAt: r.created_at,
    }));

    // Cluster points within 0.8 km distance threshold
    const CLUSTER_DISTANCE_KM = 0.8;
    const visited = new Set<string>();
    const clusters: CivicHeatmapCluster[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (visited.has(p.id)) continue;

      const clusterGroup: CivicHeatmapPoint[] = [p];
      visited.add(p.id);

      for (let j = i + 1; j < points.length; j++) {
        const other = points[j];
        if (visited.has(other.id)) continue;

        const dist = calculateHaversineDistance(
          p.latitude,
          p.longitude,
          other.latitude,
          other.longitude
        );

        if (dist <= CLUSTER_DISTANCE_KM) {
          clusterGroup.push(other);
          visited.add(other.id);
        }
      }

      // Compute cluster center & statistics
      const totalLat = clusterGroup.reduce((sum, item) => sum + item.latitude, 0);
      const totalLng = clusterGroup.reduce((sum, item) => sum + item.longitude, 0);
      const centerLat = totalLat / clusterGroup.length;
      const centerLng = totalLng / clusterGroup.length;

      // Find dominant category in cluster
      const categoryCounts: Record<string, number> = {};
      let dominantCategory: ComplaintCategory = p.category;
      let maxCategoryCount = 0;

      for (const item of clusterGroup) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        if (categoryCounts[item.category] > maxCategoryCount) {
          maxCategoryCount = categoryCounts[item.category];
          dominantCategory = item.category;
        }
      }

      // Find highest priority in cluster
      let maxPriority: PriorityLevel = 'Low';
      let maxWeight = 0;
      for (const item of clusterGroup) {
        const weight = PRIORITY_WEIGHTS[item.priority] || 1;
        if (weight > maxWeight) {
          maxWeight = weight;
          maxPriority = item.priority;
        }
      }

      clusters.push({
        id: `cluster-${i + 1}`,
        center: {
          latitude: Number(centerLat.toFixed(6)),
          longitude: Number(centerLng.toFixed(6)),
        },
        pointCount: clusterGroup.length,
        complaintIds: clusterGroup.map((c) => c.id),
        dominantCategory,
        maxPriority,
        complaints: clusterGroup.map((c) => {
          const original = geoTaggedRows.find((r) => r.id === c.id);
          return {
            id: c.id,
            title: c.title,
            category: c.category,
            priority: c.priority,
            status: c.status,
            location: original?.location || 'Unknown Location',
            communityImpactScore: c.communityImpactScore,
          };
        }),
      });
    }

    return {
      points,
      clusters,
      totalGeoTagged: points.length,
      unmappedCount: unmappedRows.length,
      unmappedComplaints: unmappedRows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
        location: r.location,
      })),
    };
  }
}
