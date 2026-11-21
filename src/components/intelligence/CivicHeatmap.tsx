import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  HeatmapResponse,
  CivicHeatmapCluster,
} from '../../services/intelligenceService';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { useNavigate } from 'react-router-dom';

interface CivicHeatmapProps {
  data: HeatmapResponse | null;
  isLoading: boolean;
  onRefresh?: () => void;
  onFilterChange?: (filters: {
    category: string;
    priority: string;
    status: string;
  }) => void;
}

export const CivicHeatmap: React.FC<CivicHeatmapProps> = ({
  data,
  isLoading,
}) => {
  const navigate = useNavigate();

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Map viewport & interaction state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedCluster, setSelectedCluster] = useState<CivicHeatmapCluster | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [showUnmappedModal, setShowUnmappedModal] = useState(false);
  const clusterDrawerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to inspect details when an officer clicks a cluster
  useEffect(() => {
    if (selectedCluster && clusterDrawerRef.current) {
      clusterDrawerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedCluster]);

  // Compute spatial bounding box for projected coordinate system
  const bounds = useMemo(() => {
    if (!data || data.points.length === 0) {
      return { minLat: 12.91, maxLat: 13.01, minLng: 77.56, maxLng: 77.69 };
    }
    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;
    for (const p of data.points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    // Add 15% padding so edge markers don't get clipped
    const latPad = Math.max(0.015, (maxLat - minLat) * 0.15);
    const lngPad = Math.max(0.015, (maxLng - minLng) * 0.15);
    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [data]);

  // Project GPS lat/long to SVG canvas 0-1000 x 0-600 coordinate plane
  const projectCoordinates = (lat: number, lng: number) => {
    const svgWidth = 1000;
    const svgHeight = 600;
    const x =
      ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * (svgWidth - 100) + 50;
    // Latitude is inverted in SVG y-axis
    const y =
      (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * (svgHeight - 100) + 50;
    return { x, y };
  };

  // Filtered points & clusters
  const filteredPoints = useMemo(() => {
    if (!data) return [];
    return data.points.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && p.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      return true;
    });
  }, [data, categoryFilter, priorityFilter, statusFilter]);

  const filteredClusters = useMemo(() => {
    if (!data) return [];
    return data.clusters.filter((c) => {
      if (categoryFilter !== 'All' && c.dominantCategory !== categoryFilter) return false;
      if (priorityFilter !== 'All' && c.maxPriority !== priorityFilter) return false;
      return true;
    });
  }, [data, categoryFilter, priorityFilter]);

  const categories = [
    'All',
    'Roads and Potholes',
    'Garbage and Sanitation',
    'Streetlights and Electricity',
    'Water Supply and Leakage',
    'Drainage and Sewage',
    'Traffic and Transportation',
    'Public Infrastructure',
  ];

  if (isLoading) {
    return (
      <div className="h-96 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-3 p-8 shadow-card">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-navy-950">Generating Geographic Civic Heatmap...</p>
        <p className="text-xs text-slate-500">Projecting municipal coordinates and spatial clusters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden space-y-4">
      {/* Header & Filter Controls Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-navy-950 text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Geographic Civic Heatmap & Spatial Clustering</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real GPS coordinate projection of municipal grievances across urban wards
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Unmapped Coordinates Indicator Button */}
          {data && data.unmappedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowUnmappedModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-semibold flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
              title="Complaints without GPS coordinates"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{data.unmappedCount} Unmapped</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative h-[480px] w-full bg-slate-900 overflow-hidden cursor-crosshair select-none">
        {/* Subtle Map Grid lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '24px 24px, 120px 120px, 120px 120px',
          }}
        />

        {/* Map Top Control Overlays */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="bg-navy-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/30 text-white text-xs flex items-center gap-2 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold tracking-wide">
              {filteredPoints.length} Mapped Complaints
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-blue-300 font-medium">
              {filteredClusters.length} Geographic Clusters
            </span>
          </div>
        </div>

        {/* Zoom & Pan Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="w-8 h-8 rounded-lg bg-navy-900/90 text-white hover:bg-navy-800 flex items-center justify-center border border-white/10 shadow-md transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="w-8 h-8 rounded-lg bg-navy-900/90 text-white hover:bg-navy-800 flex items-center justify-center border border-white/10 shadow-md transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
              setSelectedCluster(null);
            }}
            className="w-8 h-8 rounded-lg bg-navy-900/90 text-white hover:bg-navy-800 flex items-center justify-center border border-white/10 shadow-md transition-colors"
            title="Reset map perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* SVG Canvas with Projected Markers & Clusters */}
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 200ms ease-out',
          }}
        >
          {/* Stylized background terrain contours */}
          <path
            d="M 50,300 Q 250,150 500,280 T 950,220"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.3"
          />
          <path
            d="M 100,500 Q 400,380 700,480 T 900,450"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1"
            strokeDasharray="6 6"
            opacity="0.25"
          />

          {/* 1. Heat Intensity Halo Rings */}
          {filteredPoints.map((point) => {
            const { x, y } = projectCoordinates(point.latitude, point.longitude);
            const isCritical = point.priority === 'Critical';
            const isHigh = point.priority === 'High';
            const radius = isCritical ? 42 : isHigh ? 30 : 20;
            const haloColor = isCritical ? '#f43f5e' : isHigh ? '#f59e0b' : '#38bdf8';

            return (
              <g key={`halo-${point.id}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={haloColor}
                  opacity={isCritical ? 0.22 : 0.14}
                  className={isCritical ? 'animate-pulse' : ''}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={radius * 0.55}
                  fill={haloColor}
                  opacity={isCritical ? 0.35 : 0.22}
                />
              </g>
            );
          })}

          {/* 2. Cluster Boundary Rings (if cluster has > 1 point) */}
          {filteredClusters
            .filter((c) => c.pointCount > 1)
            .map((cluster) => {
              const { x, y } = projectCoordinates(
                cluster.center.latitude,
                cluster.center.longitude
              );
              return (
                <circle
                  key={`cluster-ring-${cluster.id}`}
                  cx={x}
                  cy={y}
                  r={34 + cluster.pointCount * 3}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              );
            })}

          {/* 3. Interactive Pins & Cluster Badges */}
          {filteredClusters.map((cluster) => {
            const { x, y } = projectCoordinates(
              cluster.center.latitude,
              cluster.center.longitude
            );
            const isSelected = selectedCluster?.id === cluster.id;
            const isHovered = hoveredClusterId === cluster.id;
            const hasMultiple = cluster.pointCount > 1;

            return (
              <g
                key={`marker-${cluster.id}`}
                className="cursor-pointer select-none"
                onMouseEnter={() => setHoveredClusterId(cluster.id)}
                onMouseLeave={() => setHoveredClusterId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCluster(cluster);
                }}
              >
                {/* Generous invisible hit-target circle for reliable clicks */}
                <circle
                  cx={x}
                  cy={y}
                  r={hasMultiple ? 26 : 18}
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Selected/Hovered halo accent ring */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={hasMultiple ? (isSelected ? 26 : 22) : (isSelected ? 16 : 13)}
                    fill="none"
                    stroke={isSelected ? '#60a5fa' : '#93c5fd'}
                    strokeWidth={isSelected ? '3' : '2'}
                    strokeDasharray={isSelected ? '3 2' : undefined}
                    opacity="0.9"
                  />
                )}

                {/* Cluster Badge or Pin */}
                {hasMultiple ? (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 19 : isHovered ? 18 : 16}
                      fill={
                        cluster.maxPriority === 'Critical'
                          ? '#e11d48'
                          : cluster.maxPriority === 'High'
                          ? '#d97706'
                          : '#2563eb'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '3' : '2'}
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                      style={{ transition: 'r 120ms ease-in-out' }}
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {cluster.pointCount}
                    </text>
                  </>
                ) : (
                  <>
                    {/* Single Complaint Pin */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 10 : isHovered ? 9 : 7}
                      fill={
                        cluster.maxPriority === 'Critical'
                          ? '#f43f5e'
                          : cluster.maxPriority === 'High'
                          ? '#f59e0b'
                          : '#38bdf8'
                      }
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ transition: 'r 120ms ease-in-out' }}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom Map Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-navy-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-[11px] flex items-center gap-4 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
            <span className="text-slate-300">Critical (High Impact Glow)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-slate-300">High Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs" />
            <span className="text-slate-300">Medium/Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white">
              N
            </span>
            <span className="text-slate-300">Spatial Cluster (Click to Inspect)</span>
          </div>
        </div>
      </div>

      {/* Selected Cluster / Point Summary Drawer */}
      {selectedCluster && (
        <div ref={clusterDrawerRef} className="p-5 border-t border-slate-100 bg-blue-50/40 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">
                  Cluster {selectedCluster.id}
                </span>
                <span className="text-xs font-semibold text-navy-950">
                  {selectedCluster.pointCount} Grievance
                  {selectedCluster.pointCount > 1 ? 's' : ''} in Vicinity
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  [{selectedCluster.center.latitude.toFixed(4)},{' '}
                  {selectedCluster.center.longitude.toFixed(4)}]
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Dominant Sector: <strong>{selectedCluster.dominantCategory}</strong> • Highest
                Severity: <strong>{selectedCluster.maxPriority}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCluster(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of complaints in selected cluster */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {selectedCluster.complaints.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-blue-100/90 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      {item.id}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <h5 className="font-semibold text-xs text-navy-950 line-clamp-2">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">{item.location}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <StatusBadge status={item.status} size="sm" />
                  <button
                    type="button"
                    onClick={() => navigate(`/track/${item.id}`)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmapped Complaints Modal (Handles missing coordinates without inventing locations) */}
      {showUnmappedModal && data && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-scaleUp">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-950">
                    Complaints with Missing Geo-Coordinates ({data.unmappedCount})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Location text was provided by citizens without GPS device metadata. Locations are
                    strictly NOT fabricated on the map.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnmappedModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {data.unmappedComplaints.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5 max-w-[75%]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">{item.id}</span>
                      <CategoryBadge category={item.category} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <p className="font-semibold text-navy-950 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUnmappedModal(false);
                      navigate(`/track/${item.id}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-navy-900 font-semibold text-xs flex items-center gap-1 flex-shrink-0"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnmappedModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Close Unmapped Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
