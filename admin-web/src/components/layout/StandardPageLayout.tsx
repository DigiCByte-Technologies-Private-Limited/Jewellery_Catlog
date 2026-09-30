import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export interface StatWidget {
  label: string;
  value: string | number;
  subtext?: string;
  watermarkIcon?: React.ReactNode;
  variant?: 'default' | 'gold' | 'emerald' | 'blue' | 'purple';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

export interface StandardPageLayoutProps {
  // 1. Long Header Banner
  title: string;
  description: string;
  badge?: string;
  headerWatermark?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;

  // 2. KPI Stats Widgets
  stats?: StatWidget[];

  // 3. Search & Filter Bar
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterSlot?: React.ReactNode;
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;

  // 4. Data Content
  tableContent: React.ReactNode;
  cardGridContent: React.ReactNode;
  isLoading?: boolean;
  totalCount?: number;

  // 5. Pagination
  pagination?: PaginationProps;

  // 6. Page Footer
  footerInfo?: React.ReactNode;

  // 7. Extra elements like Modals
  children?: React.ReactNode;
}

export function StandardPageLayout({
  title,
  description,
  badge,
  headerWatermark,
  primaryAction,
  secondaryActions,
  stats,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterSlot,
  viewMode = 'table',
  onViewModeChange,
  showViewToggle = true,
  tableContent,
  cardGridContent,
  isLoading = false,
  totalCount,
  pagination,
  footerInfo,
  children,
}: StandardPageLayoutProps) {
  const getWidgetStyle = (variant: StatWidget['variant'] = 'default') => {
    switch (variant) {
      case 'gold':
        return {
          cardBg: 'bg-white border-amber-200',
          titleColor: 'text-amber-700',
          valColor: 'text-amber-950',
          iconColor: 'text-amber-500/15',
        };
      case 'emerald':
        return {
          cardBg: 'bg-white border-emerald-200',
          titleColor: 'text-emerald-700',
          valColor: 'text-emerald-950',
          iconColor: 'text-emerald-500/15',
        };
      case 'blue':
        return {
          cardBg: 'bg-white border-blue-200',
          titleColor: 'text-blue-700',
          valColor: 'text-blue-950',
          iconColor: 'text-blue-500/15',
        };
      case 'purple':
        return {
          cardBg: 'bg-white border-purple-200',
          titleColor: 'text-purple-700',
          valColor: 'text-purple-950',
          iconColor: 'text-purple-500/15',
        };
      default:
        return {
          cardBg: 'bg-white border-slate-200',
          titleColor: 'text-slate-500',
          valColor: 'text-slate-900',
          iconColor: 'text-slate-400/15',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Long Header Banner Card with Watermark ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 text-white rounded-xl p-6 sm:p-7 shadow-md border border-slate-800">
        {/* Subtle Luxury Jewellery Background Watermark */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-6 pointer-events-none opacity-10 select-none">
          {headerWatermark || <Sparkles className="w-56 h-56 text-amber-300" />}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl">
            {badge && (
              <span className="inline-block px-2.5 py-0.5 mb-2 rounded text-[10px] font-bold font-mono tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        </div>
      </div>

      {/* ── 2. KPI Stats Widgets Row with Themed Watermarks ── */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => {
            const style = getWidgetStyle(s.variant);
            return (
              <Card
                key={idx}
                className={`relative overflow-hidden shadow-xs border transition-shadow hover:shadow-sm ${style.cardBg}`}
              >
                {/* Individual Widget Watermark */}
                {s.watermarkIcon && (
                  <div
                    className={`absolute right-2 bottom-1 pointer-events-none select-none ${style.iconColor}`}
                  >
                    <div className="w-20 h-20 flex items-center justify-center scale-125">
                      {s.watermarkIcon}
                    </div>
                  </div>
                )}

                <CardContent className="pt-5 pb-4 relative z-10">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider ${style.titleColor}`}
                  >
                    {s.label}
                  </div>
                  <div
                    className={`text-2xl font-black font-mono mt-1 ${style.valColor}`}
                  >
                    {s.value}
                  </div>
                  {s.subtext && (
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {s.subtext}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 3. Unified Search & Filter Control Bar ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          )}

          {/* Filter Dropdown Slots */}
          {filterSlot}
        </div>

        {/* View Toggle on Desktop (Table vs Grid) */}
        {showViewToggle && onViewModeChange && (
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white shadow text-amber-950 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white shadow text-amber-950 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Adaptive Content Layer (Desktop Table/Grid vs Mobile Cards) ── */}
      <div className="relative min-h-[160px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20 rounded-xl">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-xs font-medium text-amber-800">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading records...</span>
            </div>
          </div>
        )}

        {/* Desktop View (Table OR Card Grid based on toggle) */}
        <div className="hidden md:block">
          {viewMode === 'table' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {tableContent}
            </div>
          ) : (
            <div>{cardGridContent}</div>
          )}
        </div>

        {/* Mobile View: AUTOMATICALLY renders ONLY Cards (No horizontal table scrolling) */}
        <div className="block md:hidden">
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Mobile Cards ({totalCount ?? 'List'})
          </div>
          {cardGridContent}
        </div>
      </div>

      {/* ── 5. Advanced Pagination Bar ── */}
      {pagination && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-mono">
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {pagination.totalItems === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800">
              {pagination.totalItems.toLocaleString('en-IN')}
            </span>{' '}
            records
          </div>

          <div className="flex items-center gap-2">
            {pagination.onItemsPerPageChange && (
              <div className="flex items-center gap-1.5 text-slate-500 mr-2">
                <span>Per page:</span>
                <select
                  value={pagination.itemsPerPage}
                  onChange={(e) =>
                    pagination.onItemsPerPageChange?.(Number(e.target.value))
                  }
                  className="rounded border border-slate-300 py-1 px-1.5 text-xs bg-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange(1)}
                className="p-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={pagination.currentPage <= 1}
                onClick={() =>
                  pagination.onPageChange(pagination.currentPage - 1)
                }
                className="p-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 font-mono font-semibold text-amber-900">
                Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() =>
                  pagination.onPageChange(pagination.currentPage + 1)
                }
                className="p-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.totalPages)}
                className="p-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Page Footer ── */}
      {footerInfo && (
        <div className="p-3 bg-slate-100/70 border border-slate-200/80 rounded-lg text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {footerInfo}
        </div>
      )}

      {/* ── 7. Modals / Overlay Slots ── */}
      {children}
    </div>
  );
}
