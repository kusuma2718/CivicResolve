import { Router } from 'express';
import {
  getHeatmapHandler,
  checkDuplicatesHandler,
  linkDuplicateHandler,
  getRepeatIssuesHandler,
  getImpactRankingsHandler,
  getComplaintImpactHandler,
  getSLAMatrixHandler,
  getSLARulesHandler,
  updateSLARuleHandler,
  acknowledgeEscalationHandler,
  getResolutionForecastHandler,
} from '../controllers/intelligenceController.js';
import { requireOfficerRole } from '../middlewares/auth.js';

const router = Router();

// 1. Geographic Civic Heatmap
router.get('/heatmap', getHeatmapHandler);

// 2. Duplicate Complaint Detection
router.post('/check-duplicates', checkDuplicatesHandler);
router.post('/link-duplicate', requireOfficerRole, linkDuplicateHandler);

// 3. Repeat-Issue Detection
router.get('/repeat-issues', getRepeatIssuesHandler);

// 4. Community Impact Score
router.get('/impact-scores', getImpactRankingsHandler);
router.get('/complaint/:id/impact', getComplaintImpactHandler);

// 5. Department SLA Escalation
router.get('/sla-matrix', getSLAMatrixHandler);
router.get('/sla-rules', getSLARulesHandler);
router.put('/sla-rules', requireOfficerRole, updateSLARuleHandler);
router.post('/sla-escalations/:id/acknowledge', requireOfficerRole, acknowledgeEscalationHandler);

// 6. Predictive Resolution Forecasting
router.get('/forecast', getResolutionForecastHandler);

export default router;
