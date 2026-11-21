import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ComplaintService } from '../services/complaintService.js';
import { NotificationService } from '../services/notificationService.js';
import { HeatmapService } from '../services/heatmapService.js';
import { SLAService } from '../services/slaService.js';
import { ForecastService } from '../services/forecastService.js';
import { DuplicateService } from '../services/duplicateService.js';

describe('Phase 5: End-to-End Functional & Integration Verification', () => {
  let createdComplaintId: string;

  it('Citizen Workflow: should register a valid complaint and persist in SQLite', async () => {
    const input = {
      title: 'E2E Test: Overflowing sewage on 8th Cross',
      description: 'Sewage drain is severely overflowing onto the pedestrian pathway near the public garden.',
      category: 'Drainage and Sewage' as const,
      location: '8th Cross, Malleshwaram, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      citizenName: 'Priya Sundaram',
      email: 'priya.sundaram@test.civicresolve.org',
      priority: 'High' as const,
      severityScore: 7.5,
    };

    const complaint = ComplaintService.createComplaint(input);
    assert.ok(complaint.id.startsWith('CR-'), 'Must have valid CR- prefix ID');
    assert.strictEqual(complaint.title, input.title);
    assert.strictEqual(complaint.category, input.category);
    assert.strictEqual(complaint.status, 'Reported');
    assert.strictEqual(complaint.isSample, false, 'Citizen submitted complaint must not be marked sample');
    assert.ok(complaint.timeline.length >= 2, 'Initial timeline events must be logged');

    createdComplaintId = complaint.id;
  });

  it('Citizen Workflow: should retrieve registered complaint with audit timeline', () => {
    assert.ok(createdComplaintId, 'Complaint ID must exist from previous step');
    const record = ComplaintService.getComplaintById(createdComplaintId);
    assert.ok(record, 'Complaint must be found in SQLite database');
    assert.strictEqual(record.id, createdComplaintId);
    assert.strictEqual(record.citizenName, 'Priya Sundaram');
    assert.ok(record.timeline.length > 0, 'Timeline must be populated');
  });

  it('Admin Workflow: should update complaint status with officer audit notes', () => {
    assert.ok(createdComplaintId);
    const updated = ComplaintService.updateStatus(createdComplaintId, {
      status: 'In Progress',
      actorName: 'Ward Inspector K. Raman',
      actorRole: 'Officer',
      notes: 'Supervising repair contractor team at site with suction pumps.',
    });

    assert.strictEqual(updated.status, 'In Progress');
    const latestEvent = updated.timeline[updated.timeline.length - 1];
    assert.strictEqual(latestEvent.status, 'In Progress');
    assert.strictEqual(latestEvent.actor, 'Ward Inspector K. Raman');
    assert.ok(latestEvent.notes?.includes('suction pumps'));
  });

  it('Notifications: should generate registration and status transition alerts', () => {
    const notifs = NotificationService.getNotifications();
    assert.ok(notifs.length > 0, 'Notifications list must not be empty');

    const complaintNotifs = notifs.filter((n) => n.complaint_id === createdComplaintId);
    assert.ok(
      complaintNotifs.length >= 1,
      'Must have generated at least 1 notification for the created complaint'
    );
  });

  it('Intelligence Integration: should reflect complaint in Heatmap, SLA and Forecast', () => {
    const heatmap = HeatmapService.getHeatmapData();
    assert.ok(heatmap.points.length > 0 || heatmap.unmappedCount > 0);

    const sla = SLAService.evaluateSLAMatrix();
    assert.ok(sla.totalActive > 0);
    assert.ok(typeof sla.complianceRate === 'number');

    // Empirical forecast when historical resolved data exists
    const empiricalForecast = ForecastService.forecastResolutionTime({
      category: 'Roads and Potholes',
      departmentId: 'dept-pwd',
      priority: 'High',
    });
    assert.strictEqual(empiricalForecast.isDataSufficient, true);
    assert.ok(empiricalForecast.estimatedHours !== null && empiricalForecast.estimatedHours > 0);

    // Truthful fallback without hallucinating data when historical resolved data is insufficient (< 2)
    const insufficientForecast = ForecastService.forecastResolutionTime({
      category: 'Drainage and Sewage',
      departmentId: 'dept-water',
      priority: 'High',
    });
    assert.strictEqual(insufficientForecast.isDataSufficient, false);
    assert.strictEqual(insufficientForecast.estimatedHours, null);
  });

  it('Data Integrity: linking complaints must preserve both records without data loss', async () => {
    // Check duplicates on similar text
    const check = await DuplicateService.checkDuplicates({
      description: 'Sewage drain overflowing onto pathway in Malleshwaram',
      category: 'Drainage and Sewage',
    });
    assert.ok(check, 'Duplicate check must complete');

    // Link created complaint to primary CR-2024-1061
    const linkResult = DuplicateService.linkDuplicate({
      complaintId: createdComplaintId,
      duplicateOfId: 'CR-2024-1061',
      actorName: 'Lead Dispatcher',
      actorRole: 'Officer',
    });

    assert.strictEqual(linkResult.success, true);

    // Verify source complaint is STILL in database and marked duplicate_of_id
    const sourceRecord = ComplaintService.getComplaintById(createdComplaintId);
    assert.ok(sourceRecord, 'Source complaint must NEVER be deleted');
    assert.strictEqual(sourceRecord.duplicateOfId, 'CR-2024-1061');

    // Verify target complaint is STILL in database
    const targetRecord = ComplaintService.getComplaintById('CR-2024-1061');
    assert.ok(targetRecord, 'Target complaint must NEVER be deleted');
  });
});
