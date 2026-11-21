import React, { useState } from 'react';
import {
  Clock,
  Settings,
  ShieldAlert,
  X,
  Check,
  Save,
} from 'lucide-react';
import {
  SLAMatrixSummary,
  IntelligenceService,
} from '../../services/intelligenceService';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityLevel } from '../../types';
import { useNavigate } from 'react-router-dom';

interface SLAMonitorProps {
  matrix: SLAMatrixSummary | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const SLAMonitor: React.FC<SLAMonitorProps> = ({
  matrix,
  isLoading,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'breached' | 'approaching' | 'within'>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // SLA Rule Editor state
  const [selectedDeptId, setSelectedDeptId] = useState('dept-pwd');
  const [selectedPriority, setSelectedPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Critical');
  const [targetHoursInput, setTargetHoursInput] = useState<number>(18);
  const [ruleSaveMessage, setRuleSaveMessage] = useState<string | null>(null);
  const [isSavingRule, setIsSavingRule] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-card text-center space-y-2">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-navy-950">Evaluating SLA Matrix and Escalation Triage...</p>
      </div>
    );
  }

  if (!matrix) return null;

  const filteredEscalations = matrix.escalations.filter((esc) => {
    if (filterType === 'breached') return esc.isBreached;
    if (filterType === 'approaching') return esc.isApproaching;
    if (filterType === 'within') return !esc.isBreached && !esc.isApproaching;
    return true;
  });

  const handleAcknowledge = async (complaintId: string) => {
    setAcknowledgingId(complaintId);
    // Find matching escalation level
    const escItem = matrix.escalations.find((e) => e.complaintId === complaintId);
    const escId = `esc-${complaintId}-${escItem?.escalationLevel || 1}`;
    await IntelligenceService.acknowledgeEscalation(escId, 'Chief Municipal Officer');
    setAcknowledgingId(null);
    if (onRefresh) onRefresh();
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);
    setRuleSaveMessage(null);

    const res = await IntelligenceService.updateSLARule({
      departmentId: selectedDeptId,
      priority: selectedPriority,
      targetHours: Number(targetHoursInput),
      actorName: 'Superintending Engineer',
    });

    setIsSavingRule(false);
    if (res.success) {
      setRuleSaveMessage(`SLA rule updated: ${selectedPriority} priority set to ${targetHoursInput} hours.`);
      if (onRefresh) onRefresh();
    } else {
      setRuleSaveMessage(`Failed to update rule: ${res.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              SLA Compliance Rate
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-navy-950">{matrix.complianceRate}%</span>
              <span className="text-xs text-slate-400 font-semibold">on-time</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across {matrix.totalActive} active cases</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Breached / Overdue */}
        <div
          onClick={() => setFilterType(filterType === 'breached' ? 'all' : 'breached')}
          className={`p-5 rounded-2xl border shadow-card cursor-pointer transition-all ${
            filterType === 'breached'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/30'
              : 'bg-white border-slate-200/90 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Breached / Overdue
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700">{matrix.breached}</span>
            <span className="text-xs text-rose-600 font-bold">cases escalated</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Exceeded target SLA hours</p>
        </div>

        {/* Approaching Deadline */}
        <div
          onClick={() => setFilterType(filterType === 'approaching' ? 'all' : 'approaching')}
          className={`p-5 rounded-2xl border shadow-card cursor-pointer transition-all ${
            filterType === 'approaching'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/30'
              : 'bg-white border-slate-200/90 hover:border-amber-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Approaching Deadline
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">
              {matrix.approachingDeadline}
            </span>
            <span className="text-xs text-amber-600 font-bold">&lt; 25% time left</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Requires immediate prioritization</p>
        </div>

        {/* On Track */}
        <div
          onClick={() => setFilterType(filterType === 'within' ? 'all' : 'within')}
          className={`p-5 rounded-2xl border shadow-card cursor-pointer transition-all ${
            filterType === 'within'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/30'
              : 'bg-white border-slate-200/90 hover:border-emerald-200'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Within Target SLA
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{matrix.withinSLA}</span>
            <span className="text-xs text-emerald-600 font-bold">healthy pipeline</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Progressing within deadline</p>
        </div>
      </div>

      {/* Escalation Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-navy-950 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>SLA Escalation Matrix & Hierarchical Alerts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated hierarchical escalation dispatch: Level 1 (Supervisor), Level 2 (HoD), Level 3 (Commissioner)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure SLA Rules</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Filter View:</span>
          {(['all', 'breached', 'approaching', 'within'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterType(mode)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                filterType === mode
                  ? 'bg-navy-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode === 'all'
                ? `All (${matrix.escalations.length})`
                : mode === 'breached'
                ? `Breached (${matrix.breached})`
                : mode === 'approaching'
                ? `Approaching (${matrix.approachingDeadline})`
                : `Within SLA (${matrix.withinSLA})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Hours</th>
                <th className="py-3 px-4">Target Deadline</th>
                <th className="py-3 px-4">Elapsed / Remaining</th>
                <th className="py-3 px-4">Escalation Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEscalations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No complaints match the selected SLA filter.
                  </td>
                </tr>
              ) : (
                filteredEscalations.map((item) => {
                  const isOverdue = item.isBreached;
                  const isSoon = item.isApproaching;

                  return (
                    <tr
                      key={item.complaintId}
                      className={`hover:bg-slate-50 transition-colors ${
                        isOverdue ? 'bg-rose-50/20' : isSoon ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {item.complaintId}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-navy-950 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.category}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {item.departmentName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                        {item.slaHours}h target
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(item.targetDeadline).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isOverdue ? (
                          <span className="font-bold text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded">
                            Overdue by {Math.abs(item.remainingHours)}h
                          </span>
                        ) : isSoon ? (
                          <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                            {item.remainingHours}h remaining
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700">
                            {item.remainingHours}h remaining
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.escalationLevel === 3 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                            Level 3: Commissioner
                          </span>
                        ) : item.escalationLevel === 2 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
                            Level 2: HoD
                          </span>
                        ) : item.escalationLevel === 1 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white uppercase tracking-wider">
                            Level 1: Supervisor
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Standard Queue</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {(isOverdue || isSoon) && (
                          <button
                            type="button"
                            disabled={acknowledgingId === item.complaintId}
                            onClick={() => handleAcknowledge(item.complaintId)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 disabled:opacity-50"
                          >
                            {acknowledgingId === item.complaintId ? 'Acknowledging...' : 'Acknowledge'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/track/${item.complaintId}`)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-navy-950">
                  Configure Department Resolution SLA Rules
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Define the maximum turnaround hours for each department by complaint priority. Once
              hours elapse, the system automatically triggers hierarchical escalation alerts.
            </p>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                  >
                    <option value="dept-pwd">Public Works Department (PWD)</option>
                    <option value="dept-sanitation">Municipal Sanitation Department</option>
                    <option value="dept-water">Water & Sewage Management Board</option>
                    <option value="dept-electricity">Electricity & Streetlight Board</option>
                    <option value="dept-traffic">Traffic Management Division</option>
                    <option value="dept-admin">General Municipal Administration</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority Tier</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                  >
                    <option value="Critical">Critical (Emergency)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low (Routine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  Target Resolution Deadline (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={targetHoursInput}
                  onChange={(e) => setTargetHoursInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Example: 12 hours for critical water leaks, 24 hours for sanitation backlogs, 72 hours for routine paving.
                </span>
              </div>

              {ruleSaveMessage && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>{ruleSaveMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRule}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingRule ? 'Saving Rule...' : 'Save Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
