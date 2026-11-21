/**
 * aiRoutes.ts
 * CivicResolve Phase 3 – Gemini AI Route Declarations
 */

import { Router } from 'express';
import {
  classifyComplaintHandler,
  detectPriorityHandler,
  analyzeImageHandler,
  detectLanguageHandler,
  translateTextHandler,
  askAssistantHandler,
} from '../controllers/aiController.js';
import { aiAssistantLimiter } from '../middlewares/security.js';

const router = Router();

// POST /api/ai/classify - AI complaint classification & structured JSON
router.post('/classify', aiAssistantLimiter, classifyComplaintHandler);

// POST /api/ai/priority - Smart priority detection (Critical, High, Medium, Low)
router.post('/priority', aiAssistantLimiter, detectPriorityHandler);

// POST /api/ai/analyze-image - Multimodal Gemini image analysis & consistency check
router.post('/analyze-image', aiAssistantLimiter, analyzeImageHandler);

// POST /api/ai/detect-language - Multilingual language detection
router.post('/detect-language', aiAssistantLimiter, detectLanguageHandler);

// POST /api/ai/translate - Multilingual complaint translation
router.post('/translate', aiAssistantLimiter, translateTextHandler);

// POST /api/ai/assistant - Multilingual AI Civic Assistant (CivicSathi)
router.post('/assistant', aiAssistantLimiter, askAssistantHandler);

export default router;
