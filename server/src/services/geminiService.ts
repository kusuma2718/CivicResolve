/**
 * geminiService.ts
 * CivicResolve Phase 3 – Gemini AI Intelligence
 *
 * All Gemini API calls are made exclusively on the backend.
 * The API key is NEVER exposed to the frontend.
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  AIClassificationResult,
  AIImageAnalysisResult,
  MultilingualTranslationResult,
} from '../types/ai.js';
import { ComplaintCategory, PriorityLevel } from '../types/index.js';

// ─── Lazy client initialisation ───────────────────────────────────────────────

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!ENV.GEMINI_API_KEY) {
    throw new AppError(
      'Gemini AI is not configured. Please set GEMINI_API_KEY in the server .env file.',
      503
    );
  }
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  }
  return _client;
}

const MODEL_TEXT = 'gemini-1.5-flash';
const MODEL_VISION = 'gemini-1.5-flash';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the first valid JSON object / array from a Gemini response string.
 * Gemini sometimes wraps JSON in a markdown code-fence.
 */
function extractJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Try to find the first {...} or [...] block
    const match = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      return JSON.parse(match[1]) as T;
    }
    throw new Error(`Could not parse Gemini JSON response:\n${text.substring(0, 300)}`);
  }
}

function geminiError(context: string, err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('403')) {
    throw new AppError(
      `Gemini API key is invalid or has been revoked. ${context}`,
      503
    );
  }
  if (msg.includes('quota') || msg.includes('429')) {
    throw new AppError(`Gemini API quota exceeded. ${context}`, 503);
  }
  throw new AppError(`AI service error (${context}): ${msg}`, 503);
}

// ─── 1. Complaint Classification ──────────────────────────────────────────────

const VALID_CATEGORIES: ComplaintCategory[] = [
  'Roads and Potholes',
  'Garbage and Sanitation',
  'Streetlights and Electricity',
  'Water Supply and Leakage',
  'Drainage and Sewage',
  'Public Infrastructure',
  'Traffic and Transportation',
  'Other',
];

const VALID_PRIORITIES: PriorityLevel[] = ['Critical', 'High', 'Medium', 'Low'];

export async function classifyComplaint(
  description: string,
  language = 'en'
): Promise<AIClassificationResult> {
  if (!description || description.trim().length < 5) {
    throw new AppError('Complaint description is too short for AI analysis.', 400);
  }

  const client = getClient();

  const prompt = `
You are CivicResolve's AI complaint classifier for Indian municipal authorities.

Analyse the following civic complaint (originally written in language code: "${language}").

COMPLAINT TEXT:
"""
${description.trim()}
"""

Classify this complaint and respond ONLY with valid JSON (no markdown, no explanations) in this exact structure:
{
  "category": "<one of: Roads and Potholes | Garbage and Sanitation | Streetlights and Electricity | Water Supply and Leakage | Drainage and Sewage | Public Infrastructure | Traffic and Transportation | Other>",
  "subcategory": "<specific sub-type, e.g. 'Pothole on main road' or 'Overflowing manhole'>",
  "priority": "<one of: Critical | High | Medium | Low>",
  "severityScore": <integer 1–10>,
  "departmentRecommendation": "<full name of the Indian municipal department responsible>",
  "confidence": <float 0.0–1.0>,
  "extractedKeywords": ["<keyword1>", "<keyword2>", ...],
  "summary": "<one-sentence English summary of the issue>",
  "reason": "<2-3 sentences explaining why this classification and priority were chosen>"
}

PRIORITY RULES (apply transparently):
- Critical: Immediate public safety risk (open manhole, collapsed structure, gas leak, major flood).
- High: Significant inconvenience affecting many people (broken road, sewage overflow, no water supply to neighbourhood).
- Medium: Moderate issue affecting a street or locality (pothole, broken streetlight, irregular garbage collection).
- Low: Minor quality-of-life issue (cosmetic damage, single broken bench, faded road marking).

Always pick the most accurate category from the provided list. Do NOT invent new categories.
`.trim();

  try {
    const response = await client.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    const text = response.text ?? '';
    const parsed = extractJSON<any>(text);

    // Validate and sanitise
    const category: ComplaintCategory = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'Other';
    const priority: PriorityLevel = VALID_PRIORITIES.includes(parsed.priority)
      ? parsed.priority
      : 'Medium';

    return {
      category,
      subcategory: String(parsed.subcategory || ''),
      priority,
      severityScore: Math.min(10, Math.max(1, Number(parsed.severityScore) || 5)),
      departmentRecommendation: String(parsed.departmentRecommendation || ''),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
      extractedKeywords: Array.isArray(parsed.extractedKeywords)
        ? parsed.extractedKeywords.map(String)
        : [],
      summary: String(parsed.summary || description.substring(0, 120)),
      // reason is returned separately in controller
      ...(parsed.reason ? { reason: parsed.reason } : {}),
    } as AIClassificationResult & { reason?: string };
  } catch (err) {
    if (err instanceof AppError) throw err;
    return geminiError('complaint classification', err);
  }
}

// ─── 2. Priority Detection ─────────────────────────────────────────────────────

export async function detectPriority(
  description: string,
  category: string
): Promise<{ priority: PriorityLevel; severityScore: number; reasoning: string }> {
  const client = getClient();

  const prompt = `
You are CivicResolve's priority detection system for Indian municipal complaints.

COMPLAINT CATEGORY: ${category}
COMPLAINT DESCRIPTION:
"""
${description.trim()}
"""

Evaluate the complaint on these four axes (score 0–10 each):
1. Public Safety Risk
2. Traffic Obstruction
3. Infrastructure Damage
4. Potential Residential Impact

Then assign one final priority level using THESE TRANSPARENT RULES only:
- Critical: Average axis score ≥ 7.5 OR any single axis score = 10 (immediate danger)
- High:     Average axis score 5.0–7.4
- Medium:   Average axis score 2.5–4.9
- Low:      Average axis score < 2.5

Respond ONLY with valid JSON:
{
  "priority": "<Critical | High | Medium | Low>",
  "severityScore": <integer 1–10 overall>,
  "axisScores": {
    "publicSafetyRisk": <0–10>,
    "trafficObstruction": <0–10>,
    "infrastructureDamage": <0–10>,
    "residentialImpact": <0–10>
  },
  "reasoning": "<2-3 sentences explaining the final priority using the axis scores>"
}
`.trim();

  try {
    const response = await client.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    const parsed = extractJSON<any>(response.text ?? '');
    const priority: PriorityLevel = VALID_PRIORITIES.includes(parsed.priority)
      ? parsed.priority
      : 'Medium';

    return {
      priority,
      severityScore: Math.min(10, Math.max(1, Number(parsed.severityScore) || 5)),
      reasoning: String(parsed.reasoning || 'Priority determined by AI analysis.'),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    return geminiError('priority detection', err);
  }
}

// ─── 3. Image Analysis ────────────────────────────────────────────────────────

export async function analyzeImage(
  imagePath: string,
  description: string,
  mimeType: string
): Promise<AIImageAnalysisResult & { consistencyCheck: string; aiAssessment: string }> {
  const client = getClient();

  if (!fs.existsSync(imagePath)) {
    throw new AppError(`Image file not found at path: ${imagePath}`, 400);
  }

  const imageBytes = fs.readFileSync(imagePath);
  const base64Image = imageBytes.toString('base64');

  const prompt = `
You are CivicResolve's image analysis system for Indian civic infrastructure complaints.

CITIZEN'S COMPLAINT DESCRIPTION:
"""
${description.trim()}
"""

Analyse the uploaded image and respond ONLY with valid JSON:
{
  "hasValidCivicDefect": <true | false>,
  "defectType": "<brief name of the visible civic defect, or 'None Visible'>",
  "severityAssessment": "<Low | Medium | High | Critical>",
  "safetyHazardsIdentified": ["<hazard1>", ...],
  "visualTags": ["<tag1>", "<tag2>", ...],
  "confidence": <float 0.0–1.0>,
  "visibleDamageDescription": "<2-3 sentences describing visible damage in the image>",
  "consistencyCheck": "<Does the image match the complaint description? State clearly: 'Consistent', 'Partially Consistent', or 'Inconsistent'. Explain briefly.>",
  "aiAssessment": "<2-3 sentences of overall AI assessment of the civic issue shown>"
}

IMPORTANT:
- Do NOT claim to verify the exact GPS location from the image.
- Only describe what is visually present in the image.
- If no civic defect is visible, set hasValidCivicDefect to false.
- Never fabricate details not visible in the image.
`.trim();

  try {
    const response = await client.models.generateContent({
      model: MODEL_VISION,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const parsed = extractJSON<any>(response.text ?? '');

    return {
      hasValidCivicDefect: Boolean(parsed.hasValidCivicDefect),
      defectType: String(parsed.defectType || 'Unknown'),
      severityAssessment: ['Low', 'Medium', 'High', 'Critical'].includes(parsed.severityAssessment)
        ? parsed.severityAssessment
        : 'Medium',
      safetyHazardsIdentified: Array.isArray(parsed.safetyHazardsIdentified)
        ? parsed.safetyHazardsIdentified.map(String)
        : [],
      visualTags: Array.isArray(parsed.visualTags) ? parsed.visualTags.map(String) : [],
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.6)),
      consistencyCheck: String(parsed.consistencyCheck || ''),
      aiAssessment: String(parsed.aiAssessment || ''),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    return geminiError('image analysis', err);
  }
}

// ─── 4. Language Detection ────────────────────────────────────────────────────

export async function detectLanguage(
  text: string
): Promise<{ detectedLanguage: string; confidence: number; languageName: string }> {
  const client = getClient();

  if (!text || text.trim().length < 3) {
    return { detectedLanguage: 'en', confidence: 0.5, languageName: 'English' };
  }

  const prompt = `
Identify the language of the following text.
Respond ONLY with valid JSON:
{
  "detectedLanguage": "<BCP-47 language code, e.g. en, hi, ta, te, bn, mr>",
  "languageName": "<full English name of the language>",
  "confidence": <float 0.0–1.0>
}

TEXT:
"""
${text.trim().substring(0, 500)}
"""
`.trim();

  try {
    const response = await client.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    const parsed = extractJSON<any>(response.text ?? '');
    return {
      detectedLanguage: String(parsed.detectedLanguage || 'en'),
      languageName: String(parsed.languageName || 'Unknown'),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    return geminiError('language detection', err);
  }
}

// ─── 5. Translation ───────────────────────────────────────────────────────────

export async function translateComplaint(
  text: string,
  targetLanguage: string
): Promise<MultilingualTranslationResult & { fromLanguage: string }> {
  const client = getClient();

  if (!text || text.trim().length < 3) {
    throw new AppError('Text is too short to translate.', 400);
  }

  const prompt = `
Translate the following civic complaint text to "${targetLanguage}".
Preserve the original meaning, do not add or remove information.

Respond ONLY with valid JSON:
{
  "detectedLanguage": "<BCP-47 code of the source language>",
  "sourceText": "<original text>",
  "targetLanguage": "${targetLanguage}",
  "translatedText": "<translated text>",
  "isAiGenerated": true
}

TEXT TO TRANSLATE:
"""
${text.trim()}
"""
`.trim();

  try {
    const response = await client.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    const parsed = extractJSON<any>(response.text ?? '');
    return {
      detectedLanguage: String(parsed.detectedLanguage || 'en'),
      sourceText: text.trim(),
      targetLanguage,
      translatedText: String(parsed.translatedText || text),
      isAiGenerated: true,
      fromLanguage: String(parsed.detectedLanguage || 'en'),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    return geminiError('translation', err);
  }
}

// ─── 6. Civic AI Assistant ────────────────────────────────────────────────────

export async function askAssistant(
  message: string,
  context: Record<string, unknown> = {},
  responseLanguage = 'en'
): Promise<{
  reply: string;
  suggestedCategory?: string;
  suggestedAction?: string;
}> {
  const client = getClient();

  if (!message || message.trim().length < 3) {
    throw new AppError('Message is too short.', 400);
  }

  const contextStr = Object.keys(context).length
    ? `Context: ${JSON.stringify(context)}\n`
    : '';

  const prompt = `
You are CivicSathi, a helpful civic assistant for CivicResolve — an AI-powered civic complaint management platform for Indian citizens and municipal authorities.

Your role is to:
- Help citizens describe their civic issues clearly.
- Guide them to the correct complaint category.
- Explain how to report issues and track complaint status.
- Provide information about municipal services.
- Be empathetic, concise, and professional.

${contextStr}

CITIZEN'S MESSAGE:
"""
${message.trim()}
"""

Respond in language code: "${responseLanguage}" (if you cannot respond in that language, respond in English).

Respond ONLY with valid JSON:
{
  "reply": "<your helpful response to the citizen>",
  "suggestedCategory": "<optional: one of the complaint categories if relevant, else null>",
  "suggestedAction": "<optional: 'report_issue' | 'track_complaint' | 'contact_department' | null>"
}

Keep replies concise (2-4 sentences). Never fabricate complaint IDs or official policy details you are not certain about.
`.trim();

  try {
    const response = await client.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });

    const parsed = extractJSON<any>(response.text ?? '');
    return {
      reply: String(parsed.reply || "I'm here to help with civic issues. Please describe your concern."),
      suggestedCategory: parsed.suggestedCategory || undefined,
      suggestedAction: parsed.suggestedAction || undefined,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    return geminiError('civic assistant', err);
  }
}
