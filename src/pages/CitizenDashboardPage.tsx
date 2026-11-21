import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  PlusCircle,
  FileText,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useComplaints } from '../hooks/useComplaints';
import { ComplaintCategory, ComplaintStatus, PriorityLevel } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { DemoBadge } from '../components/common/DemoBadge';

const CATEGORIES: (ComplaintCategory | 'All')[] = [
  'All',
  'Roads and Potholes',
  'Garbage and Sanitation',
  'Streetlights and Electricity',
  'Water Supply and Leakage',
  'Drainage and Sewage',
  'Public Infrastructure',
  'Traffic and Transportation',
  'Other',
];

const STATUSES: (ComplaintStatus | 'All')[] = [
  'All',
  'Reported',
  'Under Review',
  'In Progress',
  'Resolved',
];

const PRIORITIES: (PriorityLevel | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

export const CitizenDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { complaints } = useComplaints();

  // Search and Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'user' | 'demo'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Statistics calculation
  const totalCount = complaints.length;
  const reportedCount = complaints.filter((c) => c.status === 'Reported').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Under Review').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  // Filtered and sorted complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      // Tab filter (all, user submissions, demo)
      if (activeTab === 'user' && complaint.isSample) return false;
      if (activeTab === 'demo' && !complaint.isSample) return false;

      // Category filter
      if (selectedCategory !== 'All' && complaint.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && complaint.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'All' && complaint.priority !== selectedPriority) {
        return false;
      }

      // Search query filter (matches ID, title, description, location, city)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = complaint.id.toLowerCase().includes(q);
        const matchesTitle = complaint.title.toLowerCase().includes(q);
        const matchesDesc = complaint.description.toLowerCase().includes(q);
        const matchesLocation = complaint.location.toLowerCase().includes(q);
        const matchesCity = complaint.city.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesDesc && !matchesLocation && !matchesCity) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'priority') {
        const order: Record<PriorityLevel, number> = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1,
        };
        return order[b.priority] - order[a.priority];
      }
      return 0;
    });
  }, [complaints, activeTab, selectedCategory, selectedStatus, selectedPriority, searchQuery, sortBy]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedPriority('All');
    setActiveTab('all');
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              {t('track.badge')}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
            {t('track.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('track.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/report')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('report.badge')}</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title={t('track.totalComplaints')}
          value={totalCount}
          subtitle="All grievances on file"
          icon={FileText}
          colorScheme="navy"
          trend={{ value: 'Live Registry', isPositive: true }}
        />
        <StatsCard
          title={t('track.reportedComplaints')}
          value={reportedCount}
          subtitle="Pending initial triage"
          icon={AlertCircle}
          colorScheme="amber"
          trend={{ value: 'Awaiting Intake', isPositive: false }}
        />
        <StatsCard
          title={t('track.inProgressComplaints')}
          value={inProgressCount}
          subtitle="Under review or field crew active"
          icon={RotateCw}
          colorScheme="blue"
          trend={{ value: 'Active Crews', isPositive: true }}
        />
        <StatsCard
          title={t('track.resolvedComplaints')}
          value={resolvedCount}
          subtitle="Repairs verified & closed"
          icon={CheckCircle2}
          colorScheme="emerald"
          trend={{ value: `${Math.round((resolvedCount / (totalCount || 1)) * 100)}% Rate`, isPositive: true }}
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-6">
        {/* Top Controls: Search Bar & Tab Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('track.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dataset Segment Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200/80">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              {t('track.allTab')} ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'user'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              <Sparkles className="w-3 h-3 text-brand-500" />
              <span>{t('track.userTab')} ({complaints.filter((c) => !c.isSample).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'demo'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              {t('track.demoTab')} ({complaints.filter((c) => c.isSample).length})
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr === 'All' ? 'All Priorities' : `${pr} Priority`}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>
        </div>

        {/* Results summary and Active Filters clear */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Showing <strong className="text-slate-800">{filteredComplaints.length}</strong> of{' '}
            <strong className="text-slate-800">{complaints.length}</strong> issues
          </span>
          {(selectedCategory !== 'All' ||
            selectedStatus !== 'All' ||
            selectedPriority !== 'All' ||
            searchQuery ||
            activeTab !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Complaints List Cards */}
        {filteredComplaints.length === 0 ? (
          <div className="py-16 text-center space-y-4 border border-dashed border-slate-200 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-navy-950">No complaints found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No civic grievances matched your current filter or search criteria. Try modifying your search or clearing active filters.
              </p>
            </div>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() => navigate(`/track/${complaint.id}`)}
                className="group relative bg-white border border-slate-200/90 rounded-xl p-5 hover:border-brand-500/80 hover:shadow-card-hover transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: ID, Title, Description, Metadata */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {complaint.id}
                      </span>
                      <DemoBadge isSample={complaint.isSample} />
                      <StatusBadge status={complaint.status} size="sm" />
                      <PriorityBadge priority={complaint.priority} />
                      <CategoryBadge category={complaint.category} />
                    </div>

                    <h3 className="text-base font-bold text-navy-950 group-hover:text-brand-600 transition-colors">
                      {complaint.title}
                    </h3>

                    <p className="text-sm text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
                      {complaint.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {complaint.location}, {complaint.city}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{complaint.department}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reported {formatDate(complaint.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Thumbnail & Action button */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {complaint.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                        <img
                          src={complaint.imageUrl}
                          alt={complaint.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700 bg-brand-50 group-hover:bg-brand-100 px-3.5 py-2 rounded-lg transition-colors">
                      <span>View Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
