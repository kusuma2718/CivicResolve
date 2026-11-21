import { GoogleGenAI } from '@google/genai';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { DBComplaint, ComplaintCategory } from '../types/index.js';
import { DuplicateCandidate } from '../types/intelligence.js';

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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

// Tokenize and compute Jaccard + n-gram similarity as deterministic baseline
function computeTokenSimilarity(text1: string, text2: string): number {
  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const t1 = new Set(tokenize(text1));
  const t2 = new Set(tokenize(text2));

  if (t1.size === 0 || t2.size === 0) return 0;

  let intersection = 0;
  t1.forEach((token) => {
    if (t2.has(token)) intersection++;
  });

  const union = new Set([...t1, ...t2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Add 3-character n-gram overlap
  const getGrams = (s: string) => {
    const clean = s.toLowerCase().replace(/\s+/g, ' ');
    const grams = new Set<string>();
    for (let i = 0; i < clean.length - 2; i++) {
      grams.add(clean.substring(i, i + 3));
    }
    return grams;
  };

  const g1 = getGrams(text1);
  const g2 = getGrams(text2);
  let gramIntersection = 0;
  g1.forEach((g) => {
    if (g2.has(g)) gramIntersection++;
  });
  const gramUnion = new Set([...g1, ...g2]).size;
  const gramScore = gramUnion > 0 ? gramIntersection / gramUnion : 0;

  return Number((jaccard * 0.6 + gramScore * 0.4).toFixed(3));
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dotProduct / denom : 0;
}

export class DuplicateService {
  /**
   * Compare complaint description against candidate open complaints.
   * Leverages Gemini embeddings when configured; uses deterministic token/n-gram similarity as fallback.
   * Combines with category match and geographic proximity.
   */
  public static async checkDuplicates(params: {
    description: string;
    category?: ComplaintCategory;
    latitude?: number | null;
    longitude?: number | null;
    excludeId?: string;
  }): Promise<{
    hasDuplicates: boolean;
    candidates: DuplicateCandidate[];
    evaluatedCount: number;
    embeddingModelUsed: string;
  }> {
    const { description, category, latitude, longitude, excludeId } = params;

    if (!description || description.trim().length < 5) {
      throw new AppError('Description is too short to check for duplicates.', 400);
    }

    // Retrieve active complaints (Reported, Under Review, In Progress)
    let sql = `
      SELECT * FROM complaints
      WHERE status IN ('Reported', 'Under Review', 'In Progress')
    `;
    const queryParams: any[] = [];

    if (excludeId) {
      sql += ' AND id != ?';
      queryParams.push(excludeId);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const candidates = db.prepare(sql).all(...queryParams) as DBComplaint[];
    if (candidates.length === 0) {
      return {
        hasDuplicates: false,
        candidates: [],
        evaluatedCount: 0,
        embeddingModelUsed: 'none',
      };
    }

    // Try Gemini embedding if API key is present
    let inputVector: number[] | null = null;
    let candidateVectors: Map<string, number[]> = new Map();
    let embeddingModelUsed = 'deterministic-token-matching';

    if (ENV.GEMINI_API_KEY) {
      try {
        const client = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
        const res = (await client.models.embedContent({
          model: 'text-embedding-004',
          contents: description.trim(),
        })) as any;

        const values: number[] | undefined = res.embedding?.values || res.embeddings?.[0]?.values;

        if (values) {
          inputVector = values;
          embeddingModelUsed = 'text-embedding-004';

          // Embed candidates in small batches
          for (const cand of candidates.slice(0, 10)) {
            try {
              const cRes = (await client.models.embedContent({
                model: 'text-embedding-004',
                contents: `${cand.title}. ${cand.description}`.substring(0, 500),
              })) as any;
              const cValues: number[] | undefined = cRes.embedding?.values || cRes.embeddings?.[0]?.values;
              if (cValues) {
                candidateVectors.set(cand.id, cValues);
              }
            } catch {
              // Gracefully continue with token similarity for this candidate
            }
          }
        }
      } catch {
        // Fallback to token similarity without failing
        embeddingModelUsed = 'deterministic-token-matching (fallback)';
      }
    }

    const matches: DuplicateCandidate[] = [];

    for (const cand of candidates) {
      // 1. Text Similarity
      let textScore = 0;
      if (inputVector && candidateVectors.has(cand.id)) {
        textScore = calculateCosineSimilarity(inputVector, candidateVectors.get(cand.id)!);
      } else {
        const combinedCandText = `${cand.title} ${cand.description}`;
        textScore = computeTokenSimilarity(description, combinedCandText);
      }

      // 2. Category Match
      let catScore = 0;
      if (category) {
        if (cand.category === category) {
          catScore = 1.0;
        } else if (
          (cand.category.includes('Road') && category.includes('Traffic')) ||
          (cand.category.includes('Water') && category.includes('Drainage'))
        ) {
          catScore = 0.5;
        }
      } else {
        catScore = 0.5; // neutral if category not provided
      }

      // 3. Geographic Proximity
      let geoDistanceKm: number | null = null;
      let geoScore = 0;
      let hasGeo = false;

      if (
        latitude !== undefined &&
        latitude !== null &&
        longitude !== undefined &&
        longitude !== null &&
        cand.latitude !== null &&
        cand.longitude !== null
      ) {
        hasGeo = true;
        geoDistanceKm = calculateHaversineDistanceKm(
          Number(latitude),
          Number(longitude),
          Number(cand.latitude),
          Number(cand.longitude)
        );

        if (geoDistanceKm < 0.1) geoScore = 1.0;
        else if (geoDistanceKm < 0.3) geoScore = 0.85;
        else if (geoDistanceKm < 0.7) geoScore = 0.6;
        else if (geoDistanceKm < 1.5) geoScore = 0.3;
        else geoScore = 0.0;
      }

      // 4. Combined Weighted Similarity
      let totalSimilarity = 0;
      const matchingFactors: ('geographic_proximity' | 'textual_similarity' | 'category_match')[] = [];

      if (textScore >= 0.4) matchingFactors.push('textual_similarity');
      if (catScore >= 0.8) matchingFactors.push('category_match');
      if (hasGeo && geoScore >= 0.6) matchingFactors.push('geographic_proximity');

      if (hasGeo) {
        totalSimilarity = 0.55 * textScore + 0.25 * catScore + 0.2 * geoScore;
      } else {
        totalSimilarity = 0.7 * textScore + 0.3 * catScore;
      }

      totalSimilarity = Math.min(1.0, Math.max(0.0, Number(totalSimilarity.toFixed(3))));

      // Only include candidate if similarity exceeds 0.35 threshold
      if (totalSimilarity >= 0.35) {
        let suggestedAction: 'link' | 'merge' | 'keep_separate' = 'keep_separate';
        if (totalSimilarity >= 0.75) suggestedAction = 'merge';
        else if (totalSimilarity >= 0.5) suggestedAction = 'link';

        matches.push({
          id: cand.id,
          title: cand.title,
          description: cand.description,
          category: cand.category,
          priority: cand.priority,
          status: cand.status,
          location: cand.location,
          createdAt: cand.created_at,
          similarityScore: totalSimilarity,
          textualSimilarityScore: Number(textScore.toFixed(3)),
          geographicDistanceKm: geoDistanceKm ? Number(geoDistanceKm.toFixed(3)) : null,
          matchingFactors,
          suggestedAction,
        });
      }
    }

    // Sort by highest similarity
    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      hasDuplicates: matches.length > 0 && matches[0].similarityScore >= 0.5,
      candidates: matches.slice(0, 5),
      evaluatedCount: candidates.length,
      embeddingModelUsed,
    };
  }

  /**
   * Link a complaint as a duplicate of an existing primary complaint.
   * Never discards or deletes the complaint record.
   */
  public static linkDuplicate(params: {
    complaintId: string;
    duplicateOfId: string;
    actorName?: string;
    actorRole?: string;
  }) {
    const { complaintId, duplicateOfId, actorName = 'Municipal Officer', actorRole = 'Officer' } = params;

    if (complaintId === duplicateOfId) {
      throw new AppError('A complaint cannot be marked as a duplicate of itself.', 400);
    }

    const source = db.prepare('SELECT * FROM complaints WHERE LOWER(id) = LOWER(?)').get(complaintId) as DBComplaint | undefined;
    const target = db.prepare('SELECT * FROM complaints WHERE LOWER(id) = LOWER(?)').get(duplicateOfId) as DBComplaint | undefined;

    if (!source) throw new AppError(`Complaint with ID "${complaintId}" was not found.`, 404);
    if (!target) throw new AppError(`Primary complaint with ID "${duplicateOfId}" was not found.`, 404);

    const now = new Date().toISOString();

    // Update duplicate_of_id on source complaint
    db.prepare('UPDATE complaints SET duplicate_of_id = ?, updated_at = ? WHERE id = ?').run(
      target.id,
      now,
      source.id
    );

    // Timeline event on source
    const uid = Math.random().toString(36).substring(2, 9);
    db.prepare(`
      INSERT INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `tl-${Date.now()}-${uid}-dup1`,
      source.id,
      source.status,
      'Linked as Duplicate Record',
      `Identified as co-incident duplicate of primary complaint ${target.id}. Complaint remains open and tracked.`,
      actorName,
      actorRole,
      `Linked to primary report ${target.id} (${target.title}).`,
      now
    );

    // Timeline event on primary target
    db.prepare(`
      INSERT INTO complaint_timeline (id, complaint_id, status, title, description, actor_name, actor_role, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `tl-${Date.now()}-${uid}-dup2`,
      target.id,
      target.status,
      'Duplicate Citizen Report Linked',
      `Additional citizen complaint ${source.id} was confirmed and linked to this incident ticket.`,
      actorName,
      actorRole,
      `Co-incident citizen report received from ${source.citizen_name}.`,
      now
    );

    return {
      success: true,
      complaintId: source.id,
      duplicateOfId: target.id,
      message: `Complaint ${source.id} successfully linked to primary complaint ${target.id}. Neither record was discarded.`,
    };
  }
}
