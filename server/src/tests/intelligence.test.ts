import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HeatmapService } from '../services/heatmapService.js';
import { DuplicateService } from '../services/duplicateService.js';
import { RepeatIssueService } from '../services/repeatIssueService.js';
import { ImpactService } from '../services/impactService.js';
import { SLAService } from '../services/slaService.js';
import { ForecastService } from '../services/forecastService.js';

describe('Phase 4: Civic Intelligence & Smart Municipal Operations', () => {
  describe('1. Geographic Civic Heatmap Service', () => {
    it('should generate projected coordinates and clusters without fabricating coordinates', () => {
      const result = HeatmapService.getHeatmapData();
      assert.ok(result.points.length > 0, 'Should have geo-tagged points');
      assert.ok(result.clusters.length > 0, 'Should have clustered points');
      assert.ok(typeof result.unmappedCount === 'number', 'Should have unmappedCount');
      assert.strictEqual(
        result.unmappedCount,
        result.unmappedComplaints.length,
        'unmappedCount must match length of unmappedComplaints'
      );

      // Verify no invalid coordinates in mapped points
      for (const pt of result.points) {
        assert.ok(!isNaN(pt.latitude), 'Latitude must be a valid number');
        assert.ok(!isNaN(pt.longitude), 'Longitude must be a valid number');
        assert.ok(pt.latitude >= -90 && pt.latitude <= 90, 'Latitude in valid bounds');
        assert.ok(pt.longitude >= -180 && pt.longitude <= 180, 'Longitude in valid bounds');
      }
    });

    it('should filter points and clusters by category accurately', () => {
      const category = 'Roads and Potholes';
      const result = HeatmapService.getHeatmapData({ category });
      for (const pt of result.points) {
        assert.strictEqual(pt.category, category);
      }
    });
  });

  describe('2. Duplicate Complaint Detection Service', () => {
    it('should detect similar complaint descriptions deterministically', async () => {
      const result = await DuplicateService.checkDuplicates({
        description: 'Huge dangerous pothole right outside central metro station gate 2',
        category: 'Roads and Potholes',
      });

      assert.ok(result, 'Result should exist');
      assert.ok(result.evaluatedCount > 0, 'Should evaluate existing complaints');
      assert.ok(Array.isArray(result.candidates), 'Candidates must be an array');
      assert.ok(result.candidates.length > 0, 'Should find matching candidate near MG Road metro');
      
      const topMatch = result.candidates[0];
      assert.ok(topMatch.similarityScore > 0.35, 'Top candidate similarity score above threshold');
      assert.ok(topMatch.matchingFactors.includes('category_match'), 'Category factor detected');
    });

    it('should support linking duplicates without discarding records', async () => {
      const linkResult = DuplicateService.linkDuplicate({
        complaintId: 'CR-2024-1048',
        duplicateOfId: 'CR-2024-1042',
        actorName: 'Test Suite Officer',
        actorRole: 'System',
      });

      assert.strictEqual(linkResult.success, true);
      assert.strictEqual(linkResult.complaintId, 'CR-2024-1048');
      assert.strictEqual(linkResult.duplicateOfId, 'CR-2024-1042');
      assert.ok(linkResult.message.includes('Neither record was discarded'));
    });
  });

  describe('3. Repeat-Issue & Chronic Hotspot Detection', () => {
    it('should detect recurring defects at previously resolved locations', () => {
      const result = RepeatIssueService.detectRepeatIssues();
      assert.ok(Array.isArray(result.repeatIssues), 'repeatIssues must be an array');
      assert.ok(Array.isArray(result.chronicHotspots), 'chronicHotspots must be an array');
      assert.ok(result.totalRepeatIssues >= 1, 'Should detect at least 1 repeat issue from seed data');

      for (const issue of result.repeatIssues) {
        assert.ok(issue.currentComplaintId, 'Current complaint ID required');
        assert.ok(issue.previousResolvedComplaintId, 'Previous resolved ID required');
        assert.notStrictEqual(issue.currentComplaintId, issue.previousResolvedComplaintId);
        assert.ok(issue.daysSinceLastResolution >= 0, 'Days since last resolution must be positive');
        assert.ok(issue.recommendation, 'Engineering recommendation required');
      }
    });
  });

  describe('4. Community Impact Scoring (CIS)', () => {
    it('should compute deterministic 5-factor impact score within 0–100', () => {
      const result = ImpactService.getComplaintImpact('CR-2024-1042');
      assert.ok(result, 'Score result must exist');
      assert.strictEqual(result.complaintId, 'CR-2024-1042');
      assert.ok(result.score >= 0 && result.score <= 100, 'Score must be between 0 and 100');
      assert.ok(['Emergency', 'Urgent', 'Elevated', 'Routine'].includes(result.urgencyLevel));

      // Validate all 5 factors
      const { factors } = result;
      assert.ok(factors.infrastructureSeverity.score <= factors.infrastructureSeverity.max);
      assert.ok(factors.publicSafety.score <= factors.publicSafety.max);
      assert.ok(factors.trafficDisruption.score <= factors.trafficDisruption.max);
      assert.ok(factors.footfallRisk.score <= factors.footfallRisk.max);
      assert.ok(factors.durationDelay.score <= factors.durationDelay.max);
      assert.ok(result.explanation.length > 10, 'Transparent explanation must be present');
    });
  });

  describe('5. SLA Monitoring & Escalation Service', () => {
    it('should evaluate escalations and compliance rate across active complaints', () => {
      const matrix = SLAService.evaluateSLAMatrix();
      assert.ok(typeof matrix.complianceRate === 'number');
      assert.ok(matrix.complianceRate >= 0 && matrix.complianceRate <= 100);
      assert.strictEqual(matrix.totalActive, matrix.withinSLA + matrix.approachingDeadline + matrix.breached);
      assert.ok(matrix.escalations.length > 0);
      assert.ok(matrix.rules.length > 0);
    });

    it('should allow configuring department SLA rules', async () => {
      const res = await SLAService.updateSLARule({
        departmentId: 'dept-pwd',
        priority: 'Critical',
        targetHours: 16,
        actorName: 'Test Commissioner',
      });
      assert.strictEqual(res.targetHours, 16);
      assert.strictEqual(res.departmentId, 'dept-pwd');
    });
  });

  describe('6. Predictive Resolution Turnaround Forecasting', () => {
    it('should compute statistical turnaround forecast with explicit disclaimers', () => {
      const forecast = ForecastService.forecastResolutionTime({
        category: 'Roads and Potholes',
        departmentId: 'dept-pwd',
        priority: 'High',
      });

      assert.ok(forecast.estimatedHours !== null && forecast.estimatedHours > 0);
      assert.ok(forecast.estimatedDays !== null && forecast.estimatedDays >= 0);
      assert.ok(['High', 'Moderate', 'Preliminary'].includes(forecast.confidenceLevel));
      assert.ok(forecast.confidenceScore >= 0 && forecast.confidenceScore <= 1);
      assert.ok(forecast.isPrediction === true, 'Must clearly state it is a prediction');
      assert.ok(forecast.disclaimer.includes('estimated forecast'), 'Must include non-binding disclaimer');
    });
  });
});
