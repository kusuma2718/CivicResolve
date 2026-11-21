import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  CheckCircle2,
  Clock,
  RotateCw,
  ArrowUpDown,
  Eye,
  Flame,
  FileText,
  BarChart2,
  RefreshCw,
  Edit3,
  MapPin,
  CopyCheck,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { AuthService } from '../services/authService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { useComplaints } from '../hooks/useComplaints';
import { Complaint, ComplaintStatus, PriorityLevel } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { DemoBadge } from '../components/common/DemoBadge';
import { CivicHeatmap } from '../components/intelligence/CivicHeatmap';
import { DuplicateDetector } from '../components/intelligence/DuplicateDetector';
import { RepeatIssueAlerts } from '../components/intelligence/RepeatIssueAlerts';
import { CommunityImpactCard } from '../components/intelligence/CommunityImpactCard';
import { SLAMonitor } from '../components/intelligence/SLAMonitor';
import { ResolutionForecastWidget } from '../components/intelligence/ResolutionForecastWidget';
import {
  IntelligenceService,
  HeatmapResponse,
  SLAMatrixSummary,
  RepeatIssueRecord,
  CommunityImpactDetail,
} from '../services/intelligenceService';

const STATUS_LIST: ComplaintStatus[] = ['Reported', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { complaints, updateStatus } = useComplaints();

  // Filter state
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState<'id' | 'createdAt' | 'priority' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Phase 4 Intelligence tab state
  const [activeTab, setActiveTab] = useState<'operations' | 'heatmap' | 'sla' | 'duplicates' | 'impact'>('operations');

  // Intelligence Data states
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);

  const [slaMatrix, setSlaMatrix] = useState<SLAMatrixSummary | null>(null);
  const [isSlaLoading, setIsSlaLoading] = useState(false);

  const [repeatData, setRepeatData] = useState<{
    totalRepeatIssues: number;
    repeatIssues: RepeatIssueRecord[];
    chronicHotspots: Array<{
      location: string;
      category: any;
      totalOccurrences: number;
      latitude: number;
      longitude: number;
    }>;
  } | null>(null);
  const [isRepeatLoading, setIsRepeatLoading] = useState(false);

  const [impactRankings, setImpactRankings] = useState<
    Array<{
      complaintId: string;
      title: string;
      category: string;
      priority: string;
      department: string;
      score: number;
      urgencyLevel: string;
    }>
  >([]);
  const [selectedImpactComplaintId, setSelectedImpactComplaintId] = useState<string>('CR-2024-1042');
  const [selectedImpactDetail, setSelectedImpactDetail] = useState<CommunityImpactDetail | null>(null);
  const [isImpactLoading, setIsImpactLoading] = useState(false);

  const fetchIntelligenceData = async () => {
    setIsHeatmapLoading(true);
    setIsSlaLoading(true);
    setIsRepeatLoading(true);
    setIsImpactLoading(true);

    try {
      const [heatRes, slaRes, repRes, impRankings] = await Promise.all([
        IntelligenceService.getHeatmapData(),
        IntelligenceService.getSLAMatrix(),
        IntelligenceService.getRepeatIssues(),
        IntelligenceService.getImpactRankings(10),
      ]);

      if (heatRes) setHeatmapData(heatRes);
      if (slaRes) setSlaMatrix(slaRes);
      if (repRes) setRepeatData(repRes);
      if (impRankings) {
        setImpactRankings(impRankings);
        if (impRankings.length > 0) {
          const detail = await IntelligenceService.getComplaintImpact(impRankings[0].complaintId);
          if (detail) setSelectedImpactDetail(detail);
        }
      }
    } finally {
      setIsHeatmapLoading(false);
      setIsSlaLoading(false);
      setIsRepeatLoading(false);
      setIsImpactLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const handleSelectImpactComplaint = async (id: string) => {
    setSelectedImpactComplaintId(id);
    setIsImpactLoading(true);
    const detail = await IntelligenceService.getComplaintImpact(id);
    if (detail) setSelectedImpactDetail(detail);
    setIsImpactLoading(false);
  };

  // Status Update Modal state
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [officerNote, setOfficerNote] = useState('');

  // Overview Counts
  const totalCount = complaints.length;
  const reportedCount = complaints.filter((c) => c.status === 'Reported').length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const criticalCount = complaints.filter((c) => c.priority === 'Critical').length;

  // Department List
  const departments = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => set.add(c.department));
    return ['All', ...Array.from(set)];
  }, [complaints]);

  // Category counts for Recharts
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach((c) => {
      // Shorten name for chart legibility
      const shortName = c.category.split(' ')[0];
      counts[shortName] = (counts[shortName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  // Filtered & Sorted Complaints
  const filteredList = useMemo(() => {
    return complaints.filter((c) => {
      if (deptFilter !== 'All' && c.department !== deptFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesCitizen = c.citizenName.toLowerCase().includes(q);
        const matchesLoc = c.location.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesCitizen && !matchesLoc) return false;
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'priority') {
        const weights: Record<PriorityLevel, number> = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        comparison = weights[a.priority] - weights[b.priority];
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [complaints, deptFilter, statusFilter, priorityFilter, categoryFilter, search, sortField, sortOrder]);

  const handleToggleSort = (field: 'id' | 'createdAt' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleOpenStatusModal = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setNewStatus(complaint.status);
    setOfficerNote('');
  };

  const handleSaveStatus = () => {
    if (editingComplaint) {
      updateStatus(
        editingComplaint.id,
        newStatus,
        'Municipal Admin Console',
        officerNote || undefined
      );
      setEditingComplaint(null);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-navy-900 text-teal-300">
              {t('admin.badge')}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
            {t('admin.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('admin.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/track')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Switch to Citizen View
          </button>
          <button
            onClick={() => {
              AuthService.clearSession();
              navigate('/');
            }}
            title="Sign out and clear session credentials"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Phase 4 Municipal Intelligence Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl overflow-x-auto text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'operations'
              ? 'bg-white text-navy-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/60'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Operations & Intake</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
            {complaints.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'heatmap'
              ? 'bg-white text-navy-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/60'
          }`}
        >
          <MapPin className="w-4 h-4 text-rose-600" />
          <span>Civic Heatmap & Clusters</span>
          {heatmapData && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800">
              {heatmapData.totalGeoTagged}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sla')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'sla'
              ? 'bg-white text-navy-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/60'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>SLA Escalation Matrix</span>
          {slaMatrix && slaMatrix.breached > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white animate-pulse">
              {slaMatrix.breached} Overdue
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'duplicates'
              ? 'bg-white text-navy-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/60'
          }`}
        >
          <CopyCheck className="w-4 h-4 text-indigo-600" />
          <span>Duplicates & Repeat Issues</span>
          {repeatData && repeatData.totalRepeatIssues > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800">
              {repeatData.totalRepeatIssues} Repeat
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('impact')}
          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'impact'
              ? 'bg-white text-navy-950 shadow-sm'
              : 'text-slate-600 hover:text-navy-950 hover:bg-slate-100/60'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-teal-600" />
          <span>Impact & Turnaround Forecasting</span>
        </button>
      </div>

      {/* Tab View: Heatmap */}
      {activeTab === 'heatmap' && (
        <CivicHeatmap
          data={heatmapData}
          isLoading={isHeatmapLoading}
          onRefresh={fetchIntelligenceData}
        />
      )}

      {/* Tab View: SLA Escalations */}
      {activeTab === 'sla' && (
        <SLAMonitor
          matrix={slaMatrix}
          isLoading={isSlaLoading}
          onRefresh={fetchIntelligenceData}
        />
      )}

      {/* Tab View: Duplicates & Repeat Issues */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          <RepeatIssueAlerts
            repeatIssues={repeatData?.repeatIssues || []}
            chronicHotspots={repeatData?.chronicHotspots || []}
            isLoading={isRepeatLoading}
            onRefresh={fetchIntelligenceData}
          />
          <DuplicateDetector
            activeComplaintId={selectedImpactComplaintId}
            availableComplaints={complaints.map((c) => ({
              id: c.id,
              title: c.title,
              category: c.category,
              description: c.description,
            }))}
            onLinkSuccess={() => {
              fetchIntelligenceData();
            }}
          />
        </div>
      )}

      {/* Tab View: Community Impact & Forecasting */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1 col: Top Community Impact Scores List */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Community Impact Ranking</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">0–100 Multi-Factor</span>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {impactRankings.map((item) => (
                  <div
                    key={item.complaintId}
                    onClick={() => handleSelectImpactComplaint(item.complaintId)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedImpactComplaintId === item.complaintId
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-700">
                        {item.complaintId}
                      </span>
                      <span className="font-black text-sm text-navy-950 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.score}/100
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-navy-950 truncate mt-1">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{item.department}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.urgencyLevel === 'Emergency'
                            ? 'bg-rose-100 text-rose-800'
                            : item.urgencyLevel === 'Urgent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.urgencyLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 2 cols: Community Impact Card Breakdown */}
            <div className="lg:col-span-2">
              <CommunityImpactCard impact={selectedImpactDetail} isLoading={isImpactLoading} />
            </div>
          </div>

          {/* Predictive Turnaround Forecasting Widget */}
          <ResolutionForecastWidget />
        </div>
      )}

      {/* Tab View: Operations & Intake (Default) */}
      {activeTab === 'operations' && (
        <div className="space-y-8">
          {/* 5 Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title={t('admin.totalComplaints')}
          value={totalCount}
          subtitle="All received grievances"
          icon={FileText}
          colorScheme="navy"
        />
        <StatsCard
          title={t('admin.reported')}
          value={reportedCount}
          subtitle="Awaiting dispatch triage"
          icon={Clock}
          colorScheme="amber"
        />
        <StatsCard
          title={t('admin.inProgress')}
          value={inProgressCount}
          subtitle="Work order issued"
          icon={RotateCw}
          colorScheme="blue"
        />
        <StatsCard
          title={t('admin.resolved')}
          value={resolvedCount}
          subtitle="Completed repairs"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatsCard
          title={t('admin.criticalIssues')}
          value={criticalCount}
          subtitle="Emergency priority hazards"
          icon={Flame}
          colorScheme="red"
          badge="High Risk"
        />
      </div>

      {/* Analytics Preview Row (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-600" />
                <span>Complaints by Department Sector</span>
              </h3>
              <p className="text-xs text-slate-400">Distribution across civic infrastructure</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
              Visual Telemetry
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Mini Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Resolution Pipeline SLA</span>
            </h3>
            <p className="text-xs text-slate-400">Current triage progress status</p>
          </div>

          <div className="space-y-3 my-auto">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-700">Reported (New Intake)</span>
                <span>{reportedCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${(reportedCount / (totalCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-700">In Progress / Under Review</span>
                <span>{inProgressCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-2 rounded-full"
                  style={{ width: `${(inProgressCount / (totalCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-700">Resolved & Closed</span>
                <span>{resolvedCount}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${(resolvedCount / (totalCount || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Overall Efficiency Rate</span>
            <span className="font-bold text-emerald-600">
              {Math.round((resolvedCount / (totalCount || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Complaint Management Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-6">
        {/* Table Search & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search complaint ID, issue, citizen, or location..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Filtered: <strong>{filteredList.length}</strong> of {complaints.length}
              </span>
              {(search || deptFilter !== 'All' || statusFilter !== 'All' || priorityFilter !== 'All') && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 ml-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="All">All Statuses</option>
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleToggleSort('id')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Issue Title</th>
                <th className="py-3 px-4">Category</th>
                <th
                  onClick={() => handleToggleSort('priority')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Department</th>
                <th
                  onClick={() => handleToggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No complaints match the selected admin filters.
                  </td>
                </tr>
              ) : (
                filteredList.map((complaint) => (
                  <tr
                    key={complaint.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{complaint.id}</span>
                        <DemoBadge isSample={complaint.isSample} />
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 font-semibold text-navy-950 max-w-xs truncate">
                      {complaint.title}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={complaint.category} />
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={complaint.priority} />
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {complaint.location}, {complaint.city}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {complaint.department}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={complaint.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenStatusModal(complaint)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                          title="Update resolution status"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Status</span>
                        </button>
                        <button
                          onClick={() => navigate(`/track/${complaint.id}`)}
                          className="p-1 rounded text-slate-400 hover:text-navy-950 hover:bg-slate-100 transition-colors"
                          title="Inspect complaint details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Status Update Modal */}
      {editingComplaint && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-navy-950">Update Complaint Status</h3>
                <span className="font-mono text-xs text-brand-600">{editingComplaint.id}</span>
              </div>
              <StatusBadge status={editingComplaint.status} size="sm" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Select New Operational Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Officer Field Notes / Milestone Log
                </label>
                <textarea
                  rows={3}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="e.g. Field repair crew deployed; asphalt resurfacing completed; road reopened..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
              >
                Apply & Append Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
