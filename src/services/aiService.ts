/**
 * aiService.ts
 * Frontend Gemini AI Service Client
 * Calls the CivicResolve backend AI endpoints.
 * Never exposes the Gemini API key on the frontend.
 */

import { ComplaintCategory, PriorityLevel } from '../types';

export interface AIClassificationResult {
  category: ComplaintCategory;
  subcategory: string;
  priority: PriorityLevel;
  severityScore: number; // 1-10
  departmentRecommendation: string;
  confidence: number;
  extractedKeywords: string[];
  summary: string;
  reason?: string;
}

export interface AIImageAnalysisResult {
  hasValidCivicDefect: boolean;
  defectType: string;
  severityAssessment: 'Low' | 'Medium' | 'High' | 'Critical';
  safetyHazardsIdentified: string[];
  visualTags: string[];
  confidence: number;
  visibleDamageDescription?: string;
  consistencyCheck?: string;
  aiAssessment?: string;
  imageId?: string;
}

export interface AIPriorityResult {
  priority: PriorityLevel;
  severityScore: number;
  reasoning: string;
}

export interface LanguageDetectionResult {
  detectedLanguage: string;
  languageName: string;
  confidence: number;
}

export interface TranslationResult {
  detectedLanguage: string;
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  isAiGenerated: boolean;
  fromLanguage: string;
}

export interface AssistantResult {
  reply: string;
  suggestedCategory?: string;
  suggestedAction?: 'report_issue' | 'track_complaint' | 'contact_department';
}

export interface AIServiceError {
  isConfigured: boolean;
  message: string;
  statusCode?: number;
}

const API_BASE = '/api/ai';

export class AIService {
  /**
   * Classify a complaint description using Gemini AI.
   * Returns structured classification: category, subcategory, severity, priority, department, reason.
   */
  public static async classifyComplaint(
    description: string,
    language = 'en'
  ): Promise<{ data: AIClassificationResult | null; error: AIServiceError | null }> {
    try {
      const res = await fetch(`${API_BASE}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
      });

      const json = await res.json();

      if (!res.ok) {
        const isNotConfigured = res.status === 503;
        return {
          data: null,
          error: {
            isConfigured: !isNotConfigured,
            statusCode: res.status,
            message:
              json.error?.message ||
              (isNotConfigured
                ? 'Gemini AI API key is not configured on the server.'
                : 'Failed to classify complaint with AI.'),
          },
        };
      }

      return { data: json.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          isConfigured: false,
          message: err.message || 'Network error connecting to AI service.',
        },
      };
    }
  }

  /**
   * Detect priority and severity using transparent evaluation rules.
   */
  public static async detectPriority(
    description: string,
    category: string
  ): Promise<{ data: AIPriorityResult | null; error: AIServiceError | null }> {
    try {
      const res = await fetch(`${API_BASE}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, category }),
      });

      const json = await res.json();

      if (!res.ok) {
        return {
          data: null,
          error: {
            isConfigured: res.status !== 503,
            statusCode: res.status,
            message: json.error?.message || 'Failed to detect priority.',
          },
        };
      }

      return { data: json.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          isConfigured: false,
          message: err.message || 'Network error connecting to AI priority service.',
        },
      };
    }
  }

  /**
   * Upload an image to the server and analyze it with Gemini Multimodal capabilities.
   * Evaluates visible damage, checks description consistency, and identifies safety hazards.
   */
  public static async analyzeImage(
    imageFile: File,
    description: string
  ): Promise<{ data: AIImageAnalysisResult | null; error: AIServiceError | null }> {
    try {
      // Step 1: Upload the file to /api/upload
      const formData = new FormData();
      formData.append('image', imageFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        return {
          data: null,
          error: {
            isConfigured: true,
            statusCode: uploadRes.status,
            message: errJson.error?.message || 'Failed to upload image for analysis.',
          },
        };
      }

      const uploadData = await uploadRes.json();
      const imageId = uploadData.data?.id;

      if (!imageId) {
        return {
          data: null,
          error: {
            isConfigured: true,
            message: 'Image upload succeeded but returned no image ID.',
          },
        };
      }

      // Step 2: Call Gemini multimodal analysis with the uploaded image record
      const analysisRes = await fetch(`${API_BASE}/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, description }),
      });

      const analysisJson = await analysisRes.json();

      if (!analysisRes.ok) {
        const isNotConfigured = analysisRes.status === 503;
        return {
          data: null,
          error: {
            isConfigured: !isNotConfigured,
            statusCode: analysisRes.status,
            message:
              analysisJson.error?.message ||
              (isNotConfigured
                ? 'Gemini AI API key is not configured on the server.'
                : 'Failed to analyze image with AI.'),
          },
        };
      }

      return {
        data: {
          ...analysisJson.data,
          imageId,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: {
          isConfigured: false,
          message: err.message || 'Network error during image analysis.',
        },
      };
    }
  }

  /**
   * Detect language of the input text using Gemini AI.
   */
  public static async detectLanguage(
    text: string
  ): Promise<{ data: LanguageDetectionResult | null; error: AIServiceError | null }> {
    try {
      const res = await fetch(`${API_BASE}/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          data: null,
          error: {
            isConfigured: res.status !== 503,
            statusCode: res.status,
            message: json.error?.message || 'Failed to detect language.',
          },
        };
      }
      return { data: json.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          isConfigured: false,
          message: err.message || 'Network error detecting language.',
        },
      };
    }
  }

  /**
   * Translate text to target language for administrators or citizens.
   */
  public static async translateText(
    text: string,
    targetLanguage: string
  ): Promise<{ data: TranslationResult | null; error: AIServiceError | null }> {
    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage }),
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          data: null,
          error: {
            isConfigured: res.status !== 503,
            statusCode: res.status,
            message: json.error?.message || 'Failed to translate text.',
          },
        };
      }
      return { data: json.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          isConfigured: false,
          message: err.message || 'Network error translating text.',
        },
      };
    }
  }

  /**
   * Send a query to the CivicSathi AI Assistant.
   */
  public static async askAssistant(
    message: string,
    context?: Record<string, unknown>,
    responseLanguage = 'en'
  ): Promise<{ data: AssistantResult | null; error: AIServiceError | null }> {
    try {
      const res = await fetch(`${API_BASE}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, responseLanguage }),
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          data: null,
          error: {
            isConfigured: res.status !== 503,
            statusCode: res.status,
            message:
              json.error?.message ||
              (res.status === 503
                ? 'Gemini AI API key is not configured on the server.'
                : 'Failed to communicate with AI Assistant.'),
          },
        };
      }
      return { data: json.data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          isConfigured: false,
          message: err.message || 'Network error communicating with AI Assistant.',
        },
      };
    }
  }
}
